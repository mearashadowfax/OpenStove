import { describe, expect, it } from 'vitest';
import {
  QUANTITY_PATTERN,
  formatIngredientLine,
  formatQuantity,
  parseQuantity,
  recipeMeasurementSystem,
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

  it('agrees spelled-out units with the quantity', () => {
    const line = { quantity: '1', unit: 'cup', name: 'flour' };
    expect(formatIngredientLine(line, 3)).toBe('3 cups flour');
    expect(formatIngredientLine(line, 1.5)).toBe('1½ cups flour');
    expect(formatIngredientLine(line, 0.5)).toBe('½ cup flour');
    expect(
      formatIngredientLine({ quantity: '1-2', unit: 'tablespoon', name: 'oil' })
    ).toBe('1-2 tablespoons oil');
    expect(
      formatIngredientLine({ quantity: '2', unit: 'cups', name: 'rice' }, 0.5)
    ).toBe('1 cup rice');
    expect(
      formatIngredientLine({ quantity: '2', unit: 'Pinch', name: 'salt' })
    ).toBe('2 Pinches salt');
  });

  it('leaves abbreviations and unknown units as written', () => {
    expect(
      formatIngredientLine({ quantity: '2', unit: 'tbsp', name: 'butter' })
    ).toBe('2 tbsp butter');
    expect(
      formatIngredientLine({ quantity: '3', unit: 'rasher', name: 'bacon' })
    ).toBe('3 rasher bacon');
  });
});

describe('formatIngredientLine with a measurement system', () => {
  it('converts a cup of a known dry ingredient to grams under metric', () => {
    expect(
      formatIngredientLine(
        { quantity: '2', unit: 'cup', name: 'all-purpose flour' },
        1,
        'metric'
      )
    ).toBe('240 g all-purpose flour');
  });

  it('converts a cup of a liquid to millilitres under metric', () => {
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'water' },
        1,
        'metric'
      )
    ).toBe('240 ml water');
    expect(
      formatIngredientLine(
        { quantity: '1/2', unit: 'cup', name: 'chicken or vegetable broth' },
        1,
        'metric'
      )
    ).toBe('120 ml chicken or vegetable broth');
  });

  it('leaves a cup of an unrecognised ingredient as written', () => {
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'cherry tomatoes' },
        1,
        'metric'
      )
    ).toBe('1 cup cherry tomatoes');
  });

  it('converts pounds and ounces to grams regardless of ingredient', () => {
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'lb', name: 'chicken' },
        1,
        'metric'
      )
    ).toBe('450 g chicken');
    expect(
      formatIngredientLine(
        { quantity: '8', unit: 'ounce', name: 'cream cheese' },
        1,
        'metric'
      )
    ).toBe('220 g cream cheese');
  });

  it('scales, then converts, then rounds once', () => {
    // 1/2 cup x 3 = 1.5 cups x 120 g = 180 g; rounding each step would drift.
    expect(
      formatIngredientLine(
        { quantity: '1/2', unit: 'cup', name: 'flour' },
        3,
        'metric'
      )
    ).toBe('180 g flour');
    // 1/3 cup x 3 = 1 cup = 240 ml exactly, not 3 x 80.
    expect(
      formatIngredientLine(
        { quantity: '1/3', unit: 'cup', name: 'milk' },
        3,
        'metric'
      )
    ).toBe('240 ml milk');
  });

  it('converts grams of a known dry ingredient to cups under us', () => {
    expect(
      formatIngredientLine(
        { quantity: '250', unit: 'g', name: 'flour' },
        1,
        'us'
      )
    ).toBe('2 cups flour');
    expect(
      formatIngredientLine(
        { quantity: '100', unit: 'gram', name: 'flour' },
        1,
        'us'
      )
    ).toBe('¾ cup flour');
  });

  it('converts grams of anything else to ounces or pounds under us', () => {
    expect(
      formatIngredientLine(
        { quantity: '450', unit: 'g', name: 'chicken' },
        1,
        'us'
      )
    ).toBe('1 lb chicken');
    expect(
      formatIngredientLine(
        { quantity: '200', unit: 'g', name: 'salmon' },
        1,
        'us'
      )
    ).toBe('7 oz salmon');
  });

  it('converts millilitres to cups under us', () => {
    expect(
      formatIngredientLine(
        { quantity: '500', unit: 'ml', name: 'broth' },
        1,
        'us'
      )
    ).toBe('2 cups broth');
    expect(
      formatIngredientLine(
        { quantity: '80', unit: 'ml', name: 'water' },
        1,
        'us'
      )
    ).toBe('⅓ cup water');
  });

  it('leaves a line already in the chosen system untouched', () => {
    expect(
      formatIngredientLine(
        { quantity: '2', unit: 'cups', name: 'flour' },
        1,
        'us'
      )
    ).toBe('2 cups flour');
    expect(
      formatIngredientLine(
        { quantity: '250', unit: 'g', name: 'flour' },
        1,
        'metric'
      )
    ).toBe('250 g flour');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'tsp', name: 'salt' },
        1,
        'metric'
      )
    ).toBe('1 tsp salt');
  });

  it('converts both ends of a range', () => {
    expect(
      formatIngredientLine(
        { quantity: '1/2-3/4', unit: 'cup', name: 'flour' },
        1,
        'metric'
      )
    ).toBe('60-90 g flour');
  });

  it('leaves amounts too small to measure in cups as written', () => {
    expect(
      formatIngredientLine(
        { quantity: '30', unit: 'ml', name: 'water' },
        1,
        'us'
      )
    ).toBe('30 ml water');
    expect(
      formatIngredientLine(
        { quantity: '10', unit: 'g', name: 'flour' },
        1,
        'us'
      )
    ).toBe('10 g flour');
  });

  it('leaves grams too small to measure in ounces as written', () => {
    expect(
      formatIngredientLine(
        { quantity: '5', unit: 'gram', name: 'ground cinnamon' },
        1,
        'us'
      )
    ).toBe('5 grams ground cinnamon');
  });

  it('leaves ounces that scale down to nothing in grams as written', () => {
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'oz', name: 'cream cheese' },
        1 / 12,
        'metric'
      )
    ).toBe('0.08 oz cream cheese');
  });

  it('converts millilitres to cups only for a recognised ingredient', () => {
    expect(
      formatIngredientLine(
        { quantity: '250', unit: 'ml', name: 'honey' },
        1,
        'us'
      )
    ).toBe('1 cup honey');
    expect(
      formatIngredientLine(
        { quantity: '100', unit: 'ml', name: 'tahini' },
        1,
        'us'
      )
    ).toBe('100 ml tahini');
  });

  it('does not mistake a keyword inside a longer word or compound name', () => {
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'buttermilk' },
        1,
        'metric'
      )
    ).toBe('240 ml buttermilk');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'butternut squash, cubed' },
        1,
        'metric'
      )
    ).toBe('1 cup butternut squash, cubed');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'watermelon' },
        1,
        'metric'
      )
    ).toBe('1 cup watermelon');
    expect(
      formatIngredientLine(
        { quantity: '2', unit: 'cups', name: 'boiled potatoes' },
        1,
        'metric'
      )
    ).toBe('2 cups boiled potatoes');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'milk chocolate, chopped' },
        1,
        'metric'
      )
    ).toBe('1 cup milk chocolate, chopped');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'cream cheese' },
        1,
        'metric'
      )
    ).toBe('230 g cream cheese');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'sugar snap peas' },
        1,
        'metric'
      )
    ).toBe('1 cup sugar snap peas');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'rice noodles' },
        1,
        'metric'
      )
    ).toBe('1 cup rice noodles');
  });

  it('recognises common short forms and plurals', () => {
    expect(
      formatIngredientLine(
        { quantity: '1/2', unit: 'cup', name: 'mayo' },
        1,
        'metric'
      )
    ).toBe('120 ml mayo');
    expect(
      formatIngredientLine(
        { quantity: '1/4', unit: 'cup', name: 'corn syrup' },
        1,
        'metric'
      )
    ).toBe('85 g corn syrup');
    expect(
      formatIngredientLine(
        { quantity: '1', unit: 'cup', name: 'chopped pecans' },
        1,
        'metric'
      )
    ).toBe('100 g chopped pecans');
  });
});

describe('recipeMeasurementSystem', () => {
  it('is null when no line can be converted', () => {
    expect(
      recipeMeasurementSystem([
        { quantity: '2', unit: 'clove', name: 'garlic' },
        { quantity: '1', unit: 'tsp', name: 'salt' },
        { quantity: '1', unit: 'cup', name: 'cherry tomatoes' },
        { quantity: '5', unit: 'g', name: 'ground cinnamon' },
        { name: 'pepper to taste' },
      ])
    ).toBeNull();
  });

  it('is the system most convertible lines are written in', () => {
    expect(
      recipeMeasurementSystem([
        { quantity: '2', unit: 'cups', name: 'flour' },
        { quantity: '1', unit: 'lb', name: 'butter' },
        { quantity: '200', unit: 'g', name: 'sugar' },
        { quantity: '1', unit: 'tsp', name: 'salt' },
      ])
    ).toBe('us');
    expect(
      recipeMeasurementSystem([
        { quantity: '250', unit: 'g', name: 'flour' },
        { quantity: '200', unit: 'ml', name: 'milk' },
        { quantity: '1', unit: 'cup', name: 'water' },
      ])
    ).toBe('metric');
  });

  it('ignores lines whose quantity is outside the grammar', () => {
    expect(
      recipeMeasurementSystem([
        { quantity: 'a splash', unit: 'ml', name: 'milk' },
      ])
    ).toBeNull();
  });
});
