import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertQuantity } from './measurementSystem';
import { parseQuantity } from './quantity';

/**
 * Maintenance contract for the vocabulary: every ingredient measured in cups
 * anywhere in the catalogue must have a known outcome under metric. A new cup
 * ingredient fails here until it is classified below.
 */
type Outcome = 'g' | 'ml' | 'as written';

/** Ingredient name (lowercased) -> what a cup of it becomes under metric. */
const CUP_OUTCOMES: Record<string, Outcome> = {
  // flours, starches, grains and pulses (dry, by density)
  'all-purpose flour': 'g',
  flour: 'g',
  'self-raising flour': 'g',
  'almond flour': 'g',
  'oat flour': 'g',
  cornflour: 'g',
  'arborio rice': 'g',
  'white rice, rinsed': 'g',
  barley: 'g',
  'buckwheat groats': 'g',
  quinoa: 'g',
  'green lentils': 'g',
  'lentils (red lentils or yellow lentils)': 'g',
  "bob's red mill organic extra thick rolled oats. non-organic to substitute.":
    'g',
  breadcrumbs: 'g',
  'breadcrumbs or torn day-old bread': 'g',
  // sugars, fats, cocoa, chocolate
  sugar: 'g',
  'granulated sugar': 'g',
  'brown sugar': 'g',
  'caster sugar': 'g',
  'icing sugar': 'g',
  'powdered sugar': 'g',
  butter: 'g',
  'softened butter': 'g',
  '(1 stick) unsalted butter, chilled and diced': 'g',
  '(1 stick) unsalted butter, melted': 'g',
  'unsalted butter, cold and cubed': 'g',
  'cocoa powder': 'g',
  'raw cacao powder': 'g',
  'chocolate chips': 'g',
  'sweetened condensed milk': 'g',
  // dried fruit, coconut, nuts, hard cheeses
  'dried cranberries': 'g',
  "golden raisins. trader joe's brand preferred.": 'g',
  'desiccated coconut': 'g',
  'shredded coconut': 'g',
  'pecan halves': 'g',
  'sliced almonds': 'g',
  'grated parmesan cheese': 'g',
  'mozzarella cheese, shredded': 'g',
  // liquids (by volume)
  water: 'ml',
  'warm water': 'ml',
  'hot water (approximately)': 'ml',
  'water (approximately)': 'ml',
  'water or broth': 'ml',
  'beef broth': 'ml',
  'beef broth or water': 'ml',
  'beef or vegetable stock': 'ml',
  'chicken broth': 'ml',
  'chicken broth or white wine': 'ml',
  'chicken or pork broth': 'ml',
  'chicken or vegetable broth': 'ml',
  'chicken stock': 'ml',
  'vegetable broth': 'ml',
  'vegetable stock': 'ml',
  'milk (any kind)': 'ml',
  'milk (or a dairy-free alternative)': 'ml',
  'coconut milk': 'ml',
  'coconut milk or almond milk': 'ml',
  'unsweetened vanilla almond milk. califia farms brand preferred.': 'ml',
  'heavy cream': 'ml',
  'heavy cream (or alternative)': 'ml',
  'heavy cream, plus extra for serving': 'ml',
  yogurt: 'ml',
  'plain yogurt': 'ml',
  mayonnaise: 'ml',
  ketchup: 'ml',
  pesto: 'ml',
  'pizza sauce': 'ml',
  'olive oil': 'ml',
  'olive oil, plus more for green beans': 'ml',
  'coconut oil. extra virgin preferred.': 'ml',
  'coconut oil, melted': 'ml',
  'fresh lemon juice (about 3-4 lemons)': 'ml',
  'white vinegar': 'ml',
  'white wine': 'ml',
  'red wine (optional)': 'ml',
  // produce, cooked things, and anything without an honest density
  'broccoli florets, steamed': 'as written',
  'canned diced tomatoes': 'as written',
  'chanterelle mushrooms, cleaned and thinly sliced': 'as written',
  'cherry tomatoes': 'as written',
  'cherry tomatoes, halved (optional)': 'as written',
  'chopped carrots': 'as written',
  'chopped celery': 'as written',
  'cooked and chilled rice (preferably day-old)': 'as written',
  'cooked chicken, beef, shrimp, or tofu, diced (optional)': 'as written',
  'cooked rice': 'as written',
  'cracked green olives, pitted': 'as written',
  'crumbled feta cheese': 'as written',
  'crushed hazelnuts (for topping)': 'as written',
  'cubed pumpkin': 'as written',
  'egg noodles (or your preferred noodles)': 'as written',
  'fresh arugula': 'as written',
  'fresh arugula leaves': 'as written',
  'fresh basil leaves': 'as written',
  'fresh blueberries, plus more for serving': 'as written',
  'fresh coriander leaves, chopped': 'as written',
  'fresh corn kernels (from about 2 ears of corn)': 'as written',
  'fresh mint, finely chopped': 'as written',
  'fresh parsley, chopped': 'as written',
  'fresh parsley, finely chopped': 'as written',
  'fresh spinach': 'as written',
  'fresh spinach, chopped': 'as written',
  'fresh spinach leaves': 'as written',
  'frozen dark sweet cherries': 'as written',
  'frozen peas and carrots, thawed': 'as written',
  'green beans': 'as written',
  'greens (spinach, kale, swiss chard, etc.), washed and chopped': 'as written',
  'kalamata olives, pitted': 'as written',
  microgreens: 'as written',
  'mixed berries (optional)': 'as written',
  'mixed green leaves': 'as written',
  olives: 'as written',
  'olives, sliced': 'as written',
  'preserved lemon peel, thinly sliced': 'as written',
  'ripe plums, thinly sliced and pitted': 'as written',
  'salami, diced': 'as written',
  'shredded cabbage': 'as written',
  'sliced ear mushrooms': 'as written',
  'sliced mushrooms (such as button or cremini)': 'as written',
  'small pasta': 'as written',
  'sun-dried tomatoes in oil': 'as written',
  'sweet peas, fresh or thawed if frozen': 'as written',
  'thai basil leaves': 'as written',
};

const RECIPES_DIR = join(__dirname, '../content/recipes');

function unquote(value: string): string {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === "'" || quote === '"') && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1).replaceAll(quote + quote, quote);
  }
  return trimmed;
}

function cupLines(): { file: string; name: string }[] {
  const lines: { file: string; name: string }[] = [];
  const pattern =
    /quantity:(?<quantity>[^\n]*)\n\s*unit:(?<unit>[^\n]*)\n\s*name:(?<name>[^\n]*)/g;
  for (const file of readdirSync(RECIPES_DIR)) {
    const source = readFileSync(join(RECIPES_DIR, file), 'utf8');
    for (const match of source.matchAll(pattern)) {
      const { unit, name } = match.groups!;
      if (!/^cups?$/i.test(unquote(unit))) continue;
      lines.push({ file, name: unquote(name) });
    }
  }
  return lines;
}

describe('every cup ingredient in the catalogue', () => {
  const lines = cupLines();

  it('finds the cup lines', () => {
    expect(lines.length).toBeGreaterThan(100);
  });

  it.each(lines.map(line => [line.name, line]))(
    '%s has a classified outcome under metric',
    (_name, line) => {
      const expected = CUP_OUTCOMES[line.name.toLowerCase()];
      expect(
        expected,
        `Add "${line.name.toLowerCase()}" (${line.file}) to CUP_OUTCOMES`
      ).toBeDefined();

      const converted = convertQuantity(
        parseQuantity('1')!,
        'cup',
        line.name,
        'metric'
      );
      expect(converted?.unit ?? 'as written').toBe(expected);
    }
  );
});
