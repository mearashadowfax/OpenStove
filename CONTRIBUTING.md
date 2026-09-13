# Contributing to OpenStove

Thank you for your interest in contributing to OpenStove! We value your contributions and aim to make the process seamless and understandable, whether you're submitting new recipes or suggesting improvements.

## Easy path: online form

No Git required – use the [Contribute form](https://openstove.org/contribute) on the site. Submissions open a GitHub issue with generated Markdown for maintainers to review.

## GitHub pull request path

To contribute via Git, please make sure you have:

- A GitHub account. [Sign up here](https://github.com/signup) if you haven't yet.
- Forked the OpenStove repository to your own account. Here's the [link to our repository](https://github.com/mearashadowfax/OpenStove).
- If you're planning multiple contributions or prefer working locally, clone your fork.

Familiarize yourself with [Markdown syntax](https://www.markdownguide.org/basic-syntax/) as each recipe on OpenStove is written in Markdown.

## Recipe Format Guidelines

When you create your recipe, please use the following markdown template, replicating the structure and replacing the placeholder content with your recipe details:

```markdown
---
title: 'Name of Your Dish'
description: 'A short description of the dish. Aim for one or two sentences that evoke taste and appeal.'

author: 'Your Name, GitHub Username or Alias' # Optional, if not provided, remove the block, will be set to default "anonymous".
pubDate: YYYY-MM-DD # Publication date when you are writing the recipe.

image: '' # Optional: CDN filename (e.g. tomato-soup.avif) or HTTPS URL you have rights to. Do NOT commit photo binaries to this repo.
imageAlt: '' # Optional: A brief description of the image for accessibility.

cookingTime: # Cooking time in minutes.

# For recipes that make a whole dish (cakes, pies, bread loaves, pizzas) - add both fields:
servings: 8 # How many people the whole recipe serves
scalable: false # Cannot be scaled per serving

# For individual portions, salads, soups, stir-fries - omit both fields above (they default to scalable: true)

steps:
  - title: 'Step Name' # Optional, can be left blank
    actions:
      - 'Action to perform in this step.'
      - 'Another action to perform in this step.'
  # Repeat the above block for each step in the recipe process.

ingredients:
  - title: 'Ingredient List Title' # Example: "For the Pastry Crust:", "For the Lemon Filling:" (Optional, can be left blank if there's no separate list title)
    items:
      - quantity: '1/2' # A number (2), decimal (1.5), fraction (1/2), mixed number (1 1/2) or range (3-4). Put units in `unit`, never here: '125g' is rejected.
        unit: 'tablespoon' # Optional unit of measurement. Examples: cup, tablespoon, teaspoon, gram.
        name: 'vegetable oil' # Ingredient name only, without the measurement unit.
      - quantity: '' # If an ingredient does not require a specific quantity, such as "Salt and pepper to taste", leave the quantity blank.
        unit: '' # Leave blank when no specific unit is needed.
        name: 'Salt and pepper to taste'
      # Repeat the above item block for each ingredient in the list.

  # If the recipe has separate parts, like crust and filling, repeat the entire title and items block for each part.

recipeNotes:
  [
    'Any notable tips, tricks, or warnings about the recipe, separated by comma',
    # Include additional notes as list items.
  ]
  # Optional, if none, remove the recipeNotes block

tags: ['tag1', 'tag2', 'tag3'] # Describe the dish with appropriate tags, max 3 tags
---
```

### Important Notes About Recipe Scaling

**For scalable recipes** (salads, soups, stir-fries, individual portions):

- **Do not include** `servings:` or `scalable:` fields
- Write ingredients for **1 serving**
- Users can scale up (1 serving → 2 servings → 3 servings, etc.)

**For non-scalable recipes** (whole cakes, pies, pizzas, bread loaves):

- **Include both** `servings: X` and `scalable: false` fields
- Write ingredients for the **entire recipe**
- Users see "Serves X people" instead of scaling controls

Be sure to adhere to the placeholder structure, replacing the fields with the relevant details of your recipe. If an image is not provided, leave the image field empty. Maintainers host licensed photos on a private CDN (not in this repository) and set the filename after review.

### Images and licensing

- Recipe **text** in this repository is covered by [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/).
- Recipe **photos are not part of the public git tree** (separate rights). Do not open PRs that add files under `public/images/` or commit `.avif` recipe photos.
- You may optionally include an `image` HTTPS URL to a photo you own; otherwise leave `image` empty.

Please note that if you want to keep the field blank, keep the `""`. Also, please check the [ready-to-go template](https://github.com/mearashadowfax/OpenStove/blob/main/Ready-to-go-Template.md?plain=1) with no placeholders.

## Contribution Process

### Adding Your Recipe

- Place your recipe markdown file in the correct category folder within the repository, which is `/src/content/recipes/`.
- Adhere to the file naming conventions, such as `dish-name.md` for clarity and organization. The filename (without `.md`) is the recipe URL slug – do not add a separate `slug:` field in frontmatter.

### Creating a Pull Request

1. Commit your changes with a clear message describing your recipe, e.g., `git commit -m "Add Vegan Chocolate Cake recipe"`.
2. Push the changes to your forked repository.
3. Create a pull request against the main OpenStove repository.
4. Title your pull request and provide a summary of your recipe.

### Review and Merge

Our maintainers will review your recipe, provide feedback, and merge it into the collection if it meets our standards of quality.

## Example Recipes

Take a look at our example recipes to get an idea of the format and style that we look for:

- [Traditional French Lemon Tart](https://github.com/mearashadowfax/OpenStove/blob/main/src/content/recipes/traditional-french-lemon-tart.md?plain=1)
- [Creamy Tomato Soup](https://github.com/mearashadowfax/OpenStove/blob/main/src/content/recipes/creamy-tomato-soup.md?plain=1)

## Community Guidelines

OpenStove is dedicated to providing a welcoming and inclusive community. Please review our [Code of Conduct](https://github.com/mearashadowfax/OpenStove/blob/main/CODE_OF_CONDUCT.md) for guidelines on our community behavior.

## Licensing

By contributing recipe text to OpenStove, you agree to license that content under the same terms as the OpenStove project itself (CC BY-NC-SA 4.0). Photo rights remain separate unless you explicitly grant them.

Thank you for contributing to OpenStove and helping to create a rich repository of diverse and delicious recipes!
