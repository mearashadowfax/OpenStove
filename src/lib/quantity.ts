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

export interface Quantity {
  min: number;
  max: number;
}

export interface IngredientItem {
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
 * Render "quantity unit name" for one ingredient, scaled by `factor`.
 * Text outside the grammar is shown as written and never scaled.
 */
export function formatIngredientLine(
  item: IngredientItem,
  factor: number = 1
): string {
  const raw = (item.quantity ?? '').trim();
  const parsed = parseQuantity(raw);
  const quantity = parsed ? formatQuantity(scaleQuantity(parsed, factor)) : raw;

  return [quantity, item.unit, item.name]
    .map(part => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}
