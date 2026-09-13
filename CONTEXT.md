# OpenStove

A community recipe library. Recipes are Markdown files with YAML frontmatter, rendered by Astro; readers browse, search, scale and bookmark them; contributors submit new ones through a form or a pull request.

## Language

**Recipe**:
One dish, stored as a single Markdown file whose filename is its id and URL path. The frontmatter is the recipe; the Markdown body is unused.
_Avoid_: post, entry (except for Astro's `CollectionEntry` type), article

**Ingredient line**:
One row of a recipe's ingredient list: an optional quantity, an optional unit, and a name. Rendered as "quantity unit name".
_Avoid_: ingredient item, count

**Quantity**:
The numeric amount on an ingredient line, written as a number, decimal, fraction, mixed number, or a range of two of those. A quantity never contains a unit; "125g" is a quantity of 125 with unit g.
_Avoid_: amount, measure

**Serving**:
The portion size a recipe's quantities are written for. A recipe that is scalable is written for one serving; a non-scalable recipe (a whole cake) lists a fixed number of servings.

**Scaling**:
Multiplying every quantity on a recipe by the ratio of chosen servings to base servings. Quantities outside the grammar are shown as written and never scaled.
_Avoid_: adjusting, converting
