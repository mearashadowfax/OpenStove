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

**Measurement system**:
US customary or metric, chosen by the reader on a recipe page and remembered in this browser. A recipe is shown as written until the reader picks the other system; then each ingredient line that has an honest conversion is converted (lb and oz to grams; a cup of a known dry ingredient to grams by its density; a cup of a liquid to millilitres) and every other line stays as written. Converted quantities use kitchen numbers (a cup is 240 ml, a pound is 450 g).
_Avoid_: units toggle, imperial, localisation

**Catalogue**:
The full set of published recipes, and any ordered, paged view of it: the listing, a tag's recipes, search results, or a reader's saved recipes. Newest first unless a view has its own order.
_Avoid_: collection (that is Astro's storage term), list, feed

**Tag**:
A lowercase word attached to a recipe that groups it with others (salad, soup). A tag has a page.
_Avoid_: category, label

**Bookmark**:
A reader's saved recipe, remembered in this browser only. The set of bookmarks is what the saved page shows.
_Avoid_: favourite, like, saved item

**Contribution**:
A recipe submitted through the site's form, on its way to becoming a Recipe. It is reviewed by maintainers as a GitHub issue containing the generated frontmatter.
_Avoid_: submission (fine in prose, but the concept is a contribution), request

**Human check**:
The proof that a contribution came from a person (Cloudflare Turnstile in production, waived locally).
_Avoid_: captcha, spam check
