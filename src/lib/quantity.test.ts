import { describe, expect, it } from 'vitest';
import {
  QUANTITY_PATTERN,
  formatIngredientLine,
  formatQuantity,
  parseQuantity,
  scaleQuantity,
} from './quantity';

describe('QUANTITY_PATTERN', () => {
  it.each(['', '2', '1.5', '1/2', '1 1/2', '3-4', '1/2 - 3/4', '1–2'])(
    'accepts %j',
    value => {
      expect(QUANTITY_PATTERN.test(value)).toBe(true);
    }
  );

  it.each(['125g', '1 tablespoon', '2 cups', 'a pinch', '1/', '-3', '1-'])(
    'rejects %j',
    value => {
      expect(QUANTITY_PATTERN.test(value)).toBe(false);
    }
  );
});

describe('parseQuantity', () => {
  it('parses integers, decimals, fractions and mixed numbers', () => {
    expect(parseQuantity('2')).toEqual({ min: 2, max: 2 });
    expect(parseQuantity('1.5')).toEqual({ min: 1.5, max: 1.5 });
    expect(parseQuantity('1/2')).toEqual({ min: 0.5, max: 0.5 });
    expect(parseQuantity('1 1/2')).toEqual({ min: 1.5, max: 1.5 });
  });

  it('parses ranges with either dash', () => {
    expect(parseQuantity('3-4')).toEqual({ min: 3, max: 4 });
    expect(parseQuantity('1/2 – 1')).toEqual({ min: 0.5, max: 1 });
  });

  it('returns null for empty or out-of-grammar text', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity(undefined)).toBeNull();
    expect(parseQuantity('125g')).toBeNull();
    expect(parseQuantity('1/0')).toBeNull();
  });
});

describe('formatQuantity', () => {
  const q = (min: number, max = min) => ({ min, max });

  it('renders whole numbers and unicode fractions', () => {
    expect(formatQuantity(q(2))).toBe('2');
    expect(formatQuantity(q(0.5))).toBe('½');
    expect(formatQuantity(q(1.5))).toBe('1½');
    expect(formatQuantity(q(0.75))).toBe('¾');
  });

  it('renders fractions without a glyph as a/b', () => {
    expect(formatQuantity(q(1 / 16))).toBe('1/16');
    expect(formatQuantity(q(1 + 3 / 16))).toBe('1 3/16');
  });

  it('snaps near-misses to the nearest cooking fraction', () => {
    expect(formatQuantity(q(0.33))).toBe('⅓');
    expect(formatQuantity(q(0.33 * 3))).toBe('1');
    expect(formatQuantity(q(0.66))).toBe('⅔');
  });

  it('falls back to a two-decimal number outside tolerance', () => {
    expect(formatQuantity(q(0.9))).toBe('0.9');
    expect(formatQuantity(q(2.1))).toBe('2.1');
  });

  it('renders ranges and empties', () => {
    expect(formatQuantity(q(3, 4))).toBe('3-4');
    expect(formatQuantity(q(4.5, 6))).toBe('4½-6');
    expect(formatQuantity(q(0))).toBe('');
  });
});

describe('scaleQuantity', () => {
  it('scales both ends of a range', () => {
    expect(scaleQuantity({ min: 3, max: 4 }, 1.5)).toEqual({
      min: 4.5,
      max: 6,
    });
  });
});

describe('formatIngredientLine', () => {
  it('joins quantity, unit and name, skipping blanks', () => {
    expect(
      formatIngredientLine({ quantity: '1/2', unit: 'cup', name: 'flour' })
    ).toBe('½ cup flour');
    expect(formatIngredientLine({ quantity: '', unit: '', name: 'salt' })).toBe(
      'salt'
    );
    expect(formatIngredientLine({ name: 'pepper' })).toBe('pepper');
  });

  it('scales the quantity by the factor', () => {
    expect(
      formatIngredientLine({ quantity: '1/16', unit: 'tsp', name: 'nutmeg' }, 2)
    ).toBe('⅛ tsp nutmeg');
    expect(
      formatIngredientLine({ quantity: '3-4', name: 'persimmons' }, 2)
    ).toBe('6-8 persimmons');
    expect(formatIngredientLine({ quantity: '1', name: 'egg' }, 1)).toBe(
      '1 egg'
    );
  });

  it('leaves out-of-grammar text verbatim and unscaled', () => {
    expect(formatIngredientLine({ quantity: 'a pinch', name: 'salt' }, 3)).toBe(
      'a pinch salt'
    );
  });
});
