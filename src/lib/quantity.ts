/**
 * Ingredient quantities: one grammar, one parser, one formatter.
 *
 * Grammar (also enforced by the content schema and the Keystatic CMS):
 *   integer      `2`
 *   decimal      `1.5`
 *   fraction     `1/2`
 *   mixed        `1 1/2`
 *   range        `3-4` (any two of the above joined by `-` or `–`)
 *   empty        no quantity ("salt to taste")
 */

import { convertQuantity, type MeasurementSystem } from './measurementSystem';

export interface Quantity {
  min: number;
  max: number;
}

export interface IngredientLine {
  quantity?: string;
  unit?: string;
  name: string;
}

const VALUE = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)`;

export const QUANTITY_PATTERN = new RegExp(
  `^(?:${VALUE}(?:\\s*[-–]\\s*${VALUE})?)?$`
);

export const QUANTITY_PATTERN_MESSAGE =
  'Use a number (2), decimal (1.5), fraction (1/2), mixed number (1 1/2) or range (3-4); leave empty for no quantity.';

/** Denominators cooks actually use; everything else falls back to a decimal. */
const DENOMINATORS = [2, 3, 4, 5, 6, 8, 16];
const FRACTION_TOLERANCE = 0.02;

const UNICODE_FRACTIONS: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
};

function parseValue(text: string): number {
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }
  return Number(text);
}

/**
 * Parse a quantity string. Returns `null` for an empty quantity or for text
 * outside the grammar; callers that want to display unparseable text
 * verbatim should check the raw string themselves.
 */
export function parseQuantity(raw: string | undefined | null): Quantity | null {
  const text = (raw ?? '').trim();
  if (!text || !QUANTITY_PATTERN.test(text)) return null;

  const [first, second] = text.split(/\s*[-–]\s*/);
  const min = parseValue(first);
  const max = second === undefined ? min : parseValue(second);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  return { min, max };
}

export function scaleQuantity(quantity: Quantity, factor: number): Quantity {
  return { min: quantity.min * factor, max: quantity.max * factor };
}

function formatValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';

  let whole = Math.floor(value);
  const fractionPart = value - whole;

  let best: { numerator: number; denominator: number } | null = null;
  let bestError = Infinity;
  for (const denominator of [1, ...DENOMINATORS]) {
    const numerator = Math.round(fractionPart * denominator);
    const error = Math.abs(fractionPart - numerator / denominator);
    if (error < bestError) {
      bestError = error;
      best = { numerator, denominator };
    }
  }

  if (!best || bestError > FRACTION_TOLERANCE) {
    return String(Math.round(value * 100) / 100);
  }

  let { numerator, denominator } = best;
  if (numerator === denominator) {
    whole += 1;
    numerator = 0;
  }
  if (numerator === 0) return String(whole);

  const divisor = gcd(numerator, denominator);
  numerator /= divisor;
  denominator /= divisor;

  const key = `${numerator}/${denominator}`;
  const glyph = UNICODE_FRACTIONS[key];
  if (whole === 0) return glyph ?? key;
  return glyph ? `${whole}${glyph}` : `${whole} ${key}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function formatQuantity(quantity: Quantity): string {
  const min = formatValue(quantity.min);
  if (quantity.min === quantity.max) return min;
  return `${min}-${formatValue(quantity.max)}`;
}

/**
 * Spelled-out units recipes use, with their plurals. Abbreviations (tsp, tbsp,
 * g, ml, oz, lb) are invariant and deliberately absent; unknown words are left
 * as written. Extend when a new unit shows up in content.
 */
const UNIT_PLURALS: Record<string, string> = {
  bunch: 'bunches',
  can: 'cans',
  clove: 'cloves',
  cup: 'cups',
  gram: 'grams',
  ounce: 'ounces',
  package: 'packages',
  packet: 'packets',
  pinch: 'pinches',
  pound: 'pounds',
  slice: 'slices',
  sprig: 'sprigs',
  tablespoon: 'tablespoons',
  teaspoon: 'teaspoons',
};

const UNIT_SINGULARS: Record<string, string> = Object.fromEntries(
  Object.entries(UNIT_PLURALS).map(([singular, plural]) => [plural, singular])
);

/**
 * Agree a spelled-out unit with its quantity: "½ cup" but "1½ cups" and
 * "1-2 cups". Authors write either form, so both are normalised first.
 * Plurality follows the number the reader sees, so a value that rounds to
 * "1" stays singular. The author's casing ("Pinch", "CUP") is kept.
 */
export function pluralizeUnit(unit: string, quantity: Quantity): string {
  const lower = unit.toLowerCase();
  const singular = UNIT_SINGULARS[lower] ?? lower;
  const plural = UNIT_PLURALS[singular];
  if (!plural) return unit;
  const agreed = isMoreThanOne(quantity.max) ? plural : singular;
  if (unit === unit.toUpperCase()) return agreed.toUpperCase();
  return unit[0] === unit[0].toUpperCase()
    ? agreed[0].toUpperCase() + agreed.slice(1)
    : agreed;
}

/** Whether `formatValue` would show `value` as more than one. */
function isMoreThanOne(value: number): boolean {
  const shown = formatValue(value);
  return shown !== '' && shown !== '1' && value > 1;
}

/**
 * Render "quantity unit name" for one ingredient, scaled by `factor` and,
 * when `system` is given, converted to that measurement system.
 * Text outside the grammar is shown as written and never scaled.
 */
export function formatIngredientLine(
  line: IngredientLine,
  factor: number = 1,
  system?: MeasurementSystem
): string {
  const raw = (line.quantity ?? '').trim();
  const parsed = parseQuantity(raw);
  let unit = line.unit;
  let quantity = raw;

  if (parsed) {
    const scaled = scaleQuantity(parsed, factor);
    const converted = system
      ? convertQuantity(scaled, unit ?? '', line.name, system)
      : null;
    const shown = converted ? converted.quantity : scaled;
    quantity = formatQuantity(shown);
    if (converted) unit = converted.unit;
    if (unit) unit = pluralizeUnit(unit.trim(), shown);
  }

  return [quantity, unit, line.name]
    .map(part => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * The system a recipe's convertible lines are written in, for pre-selecting
 * the toggle so the first render shows the recipe as written. `null` when no
 * line converts either way, so there is nothing to toggle.
 */
export function recipeMeasurementSystem(
  lines: IngredientLine[]
): MeasurementSystem | null {
  let us = 0;
  let metric = 0;
  for (const line of lines) {
    const quantity = parseQuantity(line.quantity);
    if (!quantity) continue;
    const unit = line.unit ?? '';
    if (convertQuantity(quantity, unit, line.name, 'metric')) us += 1;
    else if (convertQuantity(quantity, unit, line.name, 'us')) metric += 1;
  }
  if (us === 0 && metric === 0) return null;
  return metric > us ? 'metric' : 'us';
}
