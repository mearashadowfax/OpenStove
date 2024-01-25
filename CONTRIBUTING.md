# Contributing to OpenStove

Thank you for your interest in contributing to OpenStove! We value your contributions and aim to make the process seamless and understandable, whether you're submitting new recipes or suggesting improvements.

## Getting Started

To contribute to OpenStove, please make sure you have:

- A GitHub account. [Sign up here](https://github.com/signup) if you haven't yet.
- Forked the OpenStove repository to your own account. Here's the [link to our repository](https://github.com/mearashadowfax/OpenStove).
- If you're planning multiple contributions or prefer working locally, clone your fork.

Familiarize yourself with [Markdown syntax](https://www.markdownguide.org/basic-syntax/) as each recipe on OpenStove is written in Markdown.

## Recipe Format Guidelines

When you create your recipe, please use the following markdown template, replicating the structure and replacing the placeholder content with your recipe details:

```markdown
---
title: "Name of Your Dish"
description: "A short description of the dish. Aim for one or two sentences that evoke taste and appeal."

author: "Your Name, GitHub Username or Alias" # Optional, if not provided, remove the block, will be set to default "anonymous".
pubDate: YYYY-MM-DD  # Publication date when you are writing the recipe.

image: ""  # Optional: URL of an image or relative path to an image within the repository.
imageAlt: ""  # Optional: A brief description of the image for accessibility.

cookingTime:  # Cooking time in minutes.

steps:
  - title: "Step Name" # Optional, can be left blank
    actions:
      - "Action to perform in this step."
      - "Another action to perform in this step."
  # Repeat the above block for each step in the recipe process.

ingredients:
  - title: "Ingredient List Title" # Example: "For the Pastry Crust:", "For the Lemon Filling:" (Optional, can be left blank if there's no separate list title)
    items:
      - quantity: "1/2" # Use fractional numbers like 1/2 or decimal numbers like 0.5.
        name: "tablespoon vegetable oil" # Include the unit of measurement followed by the ingredient, such as "tablespoon vegetable oil" or "cup water".
      - quantity: "" # If an ingredient does not require a specific quantity, such as "Salt and pepper to taste", leave the quantity blank.
        name: "Salt and pepper to taste"
      # Repeat the above item block for each ingredient in the list.

  # If the recipe has separate parts, like crust and filling, repeat the entire title and items block for each part.

recipeNotes: [
  "Any notable tips, tricks, or warnings about the recipe, separated by comma",
  # Include additional notes as list items.
] 
  # Optional, if none, remove the recipeNotes block

tags: ["tag1", "tag2", "tag3"]  # Describe the dish with appropriate tags, max 3 tags

slug: name-of-your-dish  # A URL-friendly version of your recipe's title.

---
```

Be sure to adhere to the placeholder structure, replacing the fields with the relevant details of your recipe. If an image is not provided, leave the image field empty. We will find an appropriate image for your recipe.

Please note that if you want to keep the field blank, keep the `""`. Also, please check the [ready-to-go template](https://github.com/mearashadowfax/OpenStove/blob/main/Ready-to-go-Template.md?plain=1) with no placeholders.

## Contribution Process

### Adding Your Recipe

- Place your recipe markdown file in the correct category folder within the repository, which is `/src/content/recipes/`.
- Adhere to the file naming conventions, such as `dish-name.md` for clarity and organization.

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

By contributing to OpenStove, you agree to license your content under the same terms as the OpenStove project itself.

Thank you for contributing to OpenStove and helping to create a rich repository of diverse and delicious recipes!
