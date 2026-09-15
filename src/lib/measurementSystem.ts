/**
 * Measurement systems: converting one ingredient line's quantity between US
 * customary and metric units.
 *
 * Conversion is tiered and otherwise leaves the line as written:
 *   1. mass <-> mass (lb, oz <-> g) always
 *   2. a cup of a dry ingredient in the vocabulary <-> g, by its density
 *   3. a cup of a liquid in the vocabulary <-> ml
 *   4. anything else has no conversion
 *
 * Quantities are computed with kitchen factors (a cup is 240 ml, not 236.6)
 * and rounded once, at the end. A quantity that rounds to nothing is treated
 * as having no conversion rather than rendered as "0 g".
 *
 * This module knows nothing about the quantity grammar; it works on parsed
 * quantities so that `quantity.ts` can depend on it without a cycle.
 */

import type { Quantity } from './quantity';

export const MEASUREMENT_SYSTEMS = ['us', 'metric'] as const;
export type MeasurementSystem = (typeof MEASUREMENT_SYSTEMS)[number];

export function isMeasurementSystem(
  value: unknown
): value is MeasurementSystem {
  return MEASUREMENT_SYSTEMS.includes(value as MeasurementSystem);
}

export interface ConvertedQuantity {
  quantity: Quantity;
  unit: string;
}

const ML_PER_CUP = 240;
const GRAMS_PER_OUNCE = 28;
const GRAMS_PER_POUND = 450;

type CanonicalUnit = 'cup' | 'lb' | 'oz' | 'g' | 'ml';

/** Free-text units authors actually write, mapped to one spelling each. */
const UNIT_ALIASES: Record<string, CanonicalUnit> = {
  cup: 'cup',
  cups: 'cup',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  g: 'g',
  gram: 'g',
  grams: 'g',
  ml: 'ml',
  millilitre: 'ml',
  milliliter: 'ml',
};

function canonicalUnit(unit: string): CanonicalUnit | undefined {
  return UNIT_ALIASES[unit.trim().toLowerCase()];
}

/**
 * What a cup of an ingredient is. An entry with `gramsPerCup` is a dry
 * ingredient weighed by density; a `liquid` entry is measured by volume in
 * both systems; an entry with neither is a deliberate stop so that a shorter
 * keyword inside it can't misfire ("milk chocolate" is not milk).
 *
 * Densities follow King Arthur's ingredient weight chart where it lists the
 * ingredient (https://www.kingarthurbaking.com/learn/ingredient-weight-chart)
 * and are hand-filled elsewhere.
 */
interface VocabularyEntry {
  keyword: string;
  gramsPerCup?: number;
  liquid?: true;
}

const VOCABULARY: VocabularyEntry[] = [
  // flours and starches
  { keyword: 'flour', gramsPerCup: 120 },
  { keyword: 'almond flour', gramsPerCup: 96 },
  { keyword: 'oat flour', gramsPerCup: 92 },
  { keyword: 'rice flour', gramsPerCup: 142 },
  { keyword: 'coconut flour', gramsPerCup: 128 },
  { keyword: 'whole wheat flour', gramsPerCup: 113 },
  { keyword: 'cornflour', gramsPerCup: 112 },
  { keyword: 'cornstarch', gramsPerCup: 112 },
  { keyword: 'cornmeal', gramsPerCup: 138 },
  { keyword: 'semolina', gramsPerCup: 163 },
  { keyword: 'breadcrumbs', gramsPerCup: 112 },
  // grains and pulses, uncooked
  { keyword: 'rice', gramsPerCup: 190 },
  { keyword: 'quinoa', gramsPerCup: 170 },
  { keyword: 'buckwheat', gramsPerCup: 170 },
  { keyword: 'barley', gramsPerCup: 200 },
  { keyword: 'lentil', gramsPerCup: 190 },
  { keyword: 'oats', gramsPerCup: 89 },
  // sugars and sweeteners
  { keyword: 'sugar', gramsPerCup: 198 },
  { keyword: 'brown sugar', gramsPerCup: 213 },
  { keyword: 'caster sugar', gramsPerCup: 200 },
  { keyword: 'icing sugar', gramsPerCup: 113 },
  { keyword: 'powdered sugar', gramsPerCup: 113 },
  { keyword: 'honey', gramsPerCup: 340 },
  { keyword: 'syrup', gramsPerCup: 330 },
  { keyword: 'maple syrup', gramsPerCup: 312 },
  { keyword: 'condensed milk', gramsPerCup: 306 },
  // fats and soft cheeses
  { keyword: 'butter', gramsPerCup: 227 },
  { keyword: 'nut butter', gramsPerCup: 270 },
  { keyword: 'peanut butter', gramsPerCup: 270 },
  { keyword: 'almond butter', gramsPerCup: 270 },
  { keyword: 'cream cheese', gramsPerCup: 227 },
  // cocoa and chocolate
  { keyword: 'cocoa', gramsPerCup: 84 },
  { keyword: 'cacao', gramsPerCup: 84 },
  { keyword: 'chocolate chip', gramsPerCup: 170 },
  // dried fruit, coconut, nuts, hard cheeses
  { keyword: 'dried cranberries', gramsPerCup: 142 },
  { keyword: 'raisin', gramsPerCup: 149 },
  { keyword: 'coconut', gramsPerCup: 85 },
  { keyword: 'pecan', gramsPerCup: 99 },
  { keyword: 'sliced almond', gramsPerCup: 85 },
  { keyword: 'walnut', gramsPerCup: 113 },
  { keyword: 'parmesan', gramsPerCup: 100 },
  { keyword: 'mozzarella', gramsPerCup: 113 },
  { keyword: 'cheddar', gramsPerCup: 113 },
  // liquids
  { keyword: 'water', liquid: true },
  { keyword: 'coconut water', liquid: true },
  { keyword: 'broth', liquid: true },
  { keyword: 'stock', liquid: true },
  { keyword: 'milk', liquid: true },
  { keyword: 'coconut milk', liquid: true },
  { keyword: 'almond milk', liquid: true },
  { keyword: 'buttermilk', liquid: true },
  { keyword: 'cream', liquid: true },
  { keyword: 'coconut cream', liquid: true },
  { keyword: 'yogurt', liquid: true },
  { keyword: 'mayonnaise', liquid: true },
  { keyword: 'mayo', liquid: true },
  { keyword: 'ketchup', liquid: true },
  { keyword: 'pesto', liquid: true },
  { keyword: 'sauce', liquid: true },
  { keyword: 'oil', liquid: true },
  { keyword: 'coconut oil', liquid: true },
  { keyword: 'juice', liquid: true },
  { keyword: 'vinegar', liquid: true },
  { keyword: 'wine', liquid: true },
  // stops: cooked things and compound names that contain a keyword
  { keyword: 'cooked' },
  { keyword: 'tomato' },
  { keyword: 'milk chocolate' },
  { keyword: 'milk powder' },
  { keyword: 'powdered milk' },
  { keyword: 'ice cream' },
  { keyword: 'sugar snap' },
  { keyword: 'coconut sugar' },
  { keyword: 'noodle' },
  { keyword: 'rice paper' },
  { keyword: 'butter bean' },
  { keyword: 'water chestnut' },
];

/**
 * The vocabulary entry for an ingredient name: keywords match whole words
 * (so "boiled" is not oil), the longest keyword wins, and on a tie a density
 * entry beats a liquid one.
 */
const KEYWORD_PATTERNS = VOCABULARY.map(
  entry => new RegExp(`\\b${entry.keyword}(?:s|es)?\\b`)
);

function lookup(name: string): VocabularyEntry | undefined {
  const lower = name.toLowerCase();
  let best: VocabularyEntry | undefined;
  for (const [index, entry] of VOCABULARY.entries()) {
    if (!KEYWORD_PATTERNS[index].test(lower)) continue;
    const longer = !best || entry.keyword.length > best.keyword.length;
    const tieWon =
      best?.keyword.length === entry.keyword.length &&
      entry.gramsPerCup !== undefined;
    if (longer || tieWon) best = entry;
  }
  return best;
}

/** Cup fractions a US cook can actually measure. */
const CUP_FRACTIONS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1];
const POUND_FRACTIONS = [0, 1 / 4, 1 / 2, 3 / 4, 1];

/** Metric quantities are whole numbers: nearest 5 under 100, nearest 10 above. */
function roundMetric(value: number): number {
  const step = value < 100 ? 5 : 10;
  return Math.round(value / step) * step;
}

/** Snap the fractional part of `value` to the nearest entry in `fractions`. */
function snapTo(fractions: number[], value: number): number {
  const whole = Math.floor(value);
  const part = value - whole;
  const nearest = fractions.reduce((best, f) =>
    Math.abs(part - f) < Math.abs(part - best) ? f : best
  );
  return whole + nearest;
}

function mapQuantity(
  quantity: Quantity,
  fn: (value: number) => number
): Quantity {
  return { min: fn(quantity.min), max: fn(quantity.max) };
}

/** `null` when the quantity rounded away to nothing. */
function measurable(
  quantity: Quantity,
  unit: string
): ConvertedQuantity | null {
  return quantity.min > 0 ? { quantity, unit } : null;
}

function grams(
  quantity: Quantity,
  gramsPerUnit: number
): ConvertedQuantity | null {
  return measurable(
    mapQuantity(quantity, v => roundMetric(v * gramsPerUnit)),
    'g'
  );
}

function millilitres(
  quantity: Quantity,
  mlPerUnit: number
): ConvertedQuantity | null {
  return measurable(
    mapQuantity(quantity, v => roundMetric(v * mlPerUnit)),
    'ml'
  );
}

function cups(quantity: Quantity, perCup: number): ConvertedQuantity | null {
  const converted = mapQuantity(quantity, v =>
    snapTo(CUP_FRACTIONS, v / perCup)
  );
  return measurable(converted, converted.max > 1 ? 'cups' : 'cup');
}

function ouncesOrPounds(quantity: Quantity): ConvertedQuantity | null {
  if (quantity.min >= GRAMS_PER_POUND) {
    return measurable(
      mapQuantity(quantity, v => snapTo(POUND_FRACTIONS, v / GRAMS_PER_POUND)),
      'lb'
    );
  }
  return measurable(
    mapQuantity(quantity, v => Math.round(v / GRAMS_PER_OUNCE)),
    'oz'
  );
}

type Conversion = (
  quantity: Quantity,
  name: string
) => ConvertedQuantity | null;

const CONVERSIONS: Record<
  MeasurementSystem,
  Partial<Record<CanonicalUnit, Conversion>>
> = {
  metric: {
    lb: quantity => grams(quantity, GRAMS_PER_POUND),
    oz: quantity => grams(quantity, GRAMS_PER_OUNCE),
    cup: (quantity, name) => {
      const entry = lookup(name);
      if (entry?.gramsPerCup) return grams(quantity, entry.gramsPerCup);
      if (entry?.liquid) return millilitres(quantity, ML_PER_CUP);
      return null;
    },
  },
  us: {
    g: (quantity, name) => {
      const density = lookup(name)?.gramsPerCup;
      return density ? cups(quantity, density) : ouncesOrPounds(quantity);
    },
    ml: (quantity, name) => {
      const entry = lookup(name);
      return entry?.liquid || entry?.gramsPerCup
        ? cups(quantity, ML_PER_CUP)
        : null;
    },
  },
};

/**
 * Convert a quantity to `system`. Returns `null` when the line has no
 * conversion, so the caller shows it as written.
 */
export function convertQuantity(
  quantity: Quantity,
  unit: string,
  name: string,
  system: MeasurementSystem
): ConvertedQuantity | null {
  const from = canonicalUnit(unit);
  if (!from) return null;
  return CONVERSIONS[system][from]?.(quantity, name) ?? null;
}
