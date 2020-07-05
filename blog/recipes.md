---
date: 1593973704
title: 'How I use org-mode to organize my recipes'
---

::: {.epigraph}
Here the Red Queen began again. "Can you answer useful questions?" she
said. "How is bread made?"

"I know *that*!" Alice cried eagerly. "You take some flour---"

"Where do you pick the flower?" the White Queen asked. "In a garden, or
in the hedges?"

"Well, it isn't *picked* at all," Alice explained: "it's *ground*---"

"How many acres of ground?" said the White Queen. "You mustn't leave out
so many things."
:::

Cooking is a major hobby of mine, and for a long time, I kept recipes
either in text files or printed PDFs in a poorly organized folder on my
hard drive. It was hard to find specific recipes (did I file
[horchata](https://www.tastemade.com/shows/thirsty-for/mexican-horchata)
under "Drinks" or "Mexican"?), hard to remember whether I had made a
recipe before (and whether it was any good), and pretty much impossible
to search for complicated things like "recipes without seafood" or
"recipes that take less than an hour". To make things worse, the whole
folder was cluttered with useless infographics and spreadsheets.

I recently discovered [org-mode](https://orgmode.org/), an organization
system for the [Emacs](https://www.gnu.org/software/emacs/) text editor,
and while there is a bit of a learning curve, it is the best
organization tool I've ever used. I took a few days last winter to
wrangle my recipe collection into something manageable. I had the
following criteria for my setup:

-   Recipes can easily be copied from websites without adding a lot of
    formatting/structure.
-   Recipes can be searched or filtered based on common metadata, such
    as yield or cooking time.
-   There is a space to add "cooking notes", so the next time I make the
    recipe I'll remember what happened the first time (say,
    substitutions I made or steps that were unclear).
-   It is obvious where any particular recipe should be placed.

After playing with some possible schemes, I settled on the one below.

# File structure

All my recipes are in the single file `Cooking.org`, the basic structure
of which is below.

``` {.org-mode}
#+TITLE: Recipes
#+STARTUP: indent align overview
#+TODO: NEVERMADE(n) | HAVEMADE(h@)
#+TAGS: { weekday weekend } { vegetarian seafood } glutenfree breakfast instantpot slowcooker
#+TAGS: { { asian : chinese(c) japanese(j) korean(k) vietnamese(v) } lebanese(l) indian(i) }

* Meals:
** Meats:
** Vegetables, stir-fries, & curries:
** Rice/orzo & grains:
** Pasta & noodles:
** Soups, stews, & casseroles:
** Salads:
** Sandwiches:
** Breakfast eggs & grains:
* Condiments & snacks:
** Pickles & preserves:
** Sauces & toppings:
** Snacks & dips:
* Baked goods:
** Savory breads/rolls:
** Sweet breads/rolls:
** Batters:
** Cakes & tortes:
** Pies, tarts, & cobblers:
** Pastries, custards/curds, & ice cream:
** Cookies:
* Drinks:
** Hot drinks:
** Cold drinks:
* Projects:
** Brewing:
** Dairy:
** Bread & noodles:
** Candy:
* Notes:
** Price book:
** Unsorted recipes:
** Settings:
```

The first few lines, starting with `#+`, make up the file header. The
`#+STARTUP` line defines some
[settings](https://orgmode.org/manual/In_002dbuffer-settings.html#index-_0023_002bSTARTUP)
for when I open the file. The most important is `overview`, which makes
sure only the headings are shown, and not all \~30,000 lines of text.
Unfortunately, this only shows top-level headings. I can use <kbd>M-2
S-Tab</kbd>[^1] to see the second-level headings as well, or <kbd>M-3
S-Tab</kbd> to see all recipes, although at this point, I have far too
many for the latter to be useful.

I also define [tags](https://orgmode.org/manual/Tags.html) and [TODO
states](https://orgmode.org/manual/TODO-Items.html), the latter of which
let you mark an item as being in any of various states of completion.
The `@` after the `HAVEMADE` state means that when I mark a recipe as
`HAVEMADE`, org should prompt me to [leave a
note](https://orgmode.org/manual/Tracking-TODO-state-changes.html).
Thus, after I make a recipe, I can jot down what went well and what I
should change next time. The tags define ancillary properties of the
recipe---whether it is gluten-free, what part of the world it comes
from---and tags surrounded with curly braces are mutually exclusive,
such as `{ vegetarian seafood }`.

In the body of the file, the recipes are organized into first- and
second-level [headings](https://orgmode.org/manual/Headlines.html),
starting with `*` and `**`, respectively. The tacit rule is that recipes
within a category should substitute for each other---thus,
`Cakes & tortes` is a valid category because [tres leches
cake](https://smittenkitchen.com/2015/12/tres-leches-cake-a-taco-party/)
could substitute for [olive oil
cake](https://www.americastestkitchen.com/recipes/9648-olive-oil-cake);
but it couldn't substitute for [pickled red
onions](https://www.budgetbytes.com/pickled-red-onions/), so it wouldn't
make sense to group them under a `Mexican` heading.

The final top-level heading is `Notes`. The first thing here is a [price
book](https://en.wikipedia.org/wiki/Price_book)---a simple table of
ingredients I buy often, and at which nearby grocery stores they are
cheapest, with the cheapest price in bold.[^2] I also rounded up to the
nearest dime to make mental math easier, and combat stores'
[psychological
tricks](https://en.wikipedia.org/wiki/Psychological_pricing).

``` {.org-mode}
** Price book:
- Rules of thumb:
  - Apple/peach/onion :: 1/2lb ($1/ @ $2/lb, $1.50/ @ $3/lb)
  - Banana :: 1/3lb (15¢/ @ 50¢/lb)
  - Head of garlic :: 1/8lb
  - Chicken drumstick :: 7oz
| Food               | Trader Joe's | Whole Foods |
|--------------------+--------------+-------------|
| Milk (1/2gal)      | *$1.70*      | $2.20       |
| Eggs (dozen large) | *$2*         | $3          |
| Butter (4 sticks)  | *$3*         | $3.50       |
| Coffee (12oz)      | $4           | $4          |
| Garlic (head)      | 70¢          | *~50¢*      |
| Lemon              | 50¢          | 50¢         |
```

The second subheading under `Notes` is `Unsorted Recipes`, where recipes
are automatically placed when added (see [below](#adding-recipes)).

Finally, a `Settings` subheading contains the [in-file
settings](https://www.gnu.org/software/emacs/manual/html_node/emacs/Specifying-File-Variables.html)---this
must be the last thing in the file. The first line sets the
[refile](https://orgmode.org/manual/Refile-and-Copy.html) targets to the
second-level headings, so recipes can easily be moved between categories
while keeping them at the third heading level. The second line sets
[`org-tags-column`](https://orgmode.org/manual/Setting-tags.html) to
`-105` from the default value of `-77`. I have a lot of tags on recipes,
and this reduces visual clutter by moving them farther to the right.

``` {.org-mode}
** Settings:
# Local variables:
# org-refile-targets: (("~/org/Cooking.org" :level . 2))
# org-tags-column: -105
# End:
```

As a final bonus, this structure makes it easy to see how many recipes I
have: hit <kbd>M-!</kbd> to get a shell prompt, then run
`grep '^\*\*\*' Cooking.org | wc -l`{.bash}.

# Recipe structure

The third level is for the recipes themselves. These basically consist
of a [properties
drawer](https://orgmode.org/manual/Property-syntax.html) for the
metadata, a [checklist](https://orgmode.org/manual/Checkboxes.html) for
the ingredients, and a [numbered
list](https://orgmode.org/manual/Plain-lists.html) for the directions.

For example, here is a recipe for marinated eggs: the properties drawer
runs from `:PROPERTIES:` to `:END:`, followed by the ingredients
prepended with `- [ ]`, then the directions and an endnote.

``` {.org-mode}
*** HAVEMADE Japanese Marinated Soft Boiled Egg for Ramen (Ajitsuke Tamago)          :weekend:japanese:
:PROPERTIES:
:Author: J. Kenji López-Alt
:Source:
:Sent_by:
:Yield: 6 eggs
:Prep_Time: 0:10
:Cook_Time: 4:00
:Total_Time: 4:10
:Cost:
:Description: Perfectly seasoned soft-boiled eggs for the best homemade ramen.
:URL: https://www.seriouseats.com/recipes/2012/03/ajitsuke-tamago-japanese-marinated-soft-boiled-egg-recipe.html
:Added: [2019-01-03 Thu]
:END:
- [ ] 1 cup water
- [ ] 1 cup sake
- [ ] 1/2 cup soy sauce
- [ ] 1/2 cup mirin
- [ ] 1/2 cup sugar
- [ ] 6 eggs


1. Combine water, sake, soy, mirin, and sugar in a medium bowl and
   whisk until sugar is dissolved. Set aside.

2. Bring 2 quarts of water to a boil in a medium saucepan over high
   heat. Pierce fat end of each egg with a thumbtack to make a tiny
   hole (this prevents them from cracking and eliminates the air
   bubble at the end). Carefully lower eggs into water with a wire
   mesh spider or slotted spoon. Reduce heat to maintain a bare
   simmer. Cook for exactly 6 minutes. Drain hot water and carefully
   peel eggs under cold running water (the whites will be quite
   delicate).

3. Transfer eggs to a bowl that just barely fits them all. Pour
   marinade on top until eggs are covered or just floating. Place a
   double-layer of paper towels on top and press down until completely
   saturated in liquid to help keep eggs submerged and marinating
   evenly. Refrigerate and marinate at least four hours and up to 12.
   Discard marinade after 12 hours. Store eggs in a sealed container
   in the fridge for up to 3 days. Reheat in ramen soup to serve.

Note: This recipe can be made using leftover broth from chashu pork.
If you have this broth, replace all the ingredients in the marinade
with the broth.
```

The ingredients list is interactive: with the cursor on one of the list
items, I can use `C-c C-c` to check or uncheck it. This is extremely
useful for making shopping lists. The directions list has to be
separated by *two* blank lines from the ingredients list, or org-mode
will parse them as being part of the same list, and insist they both be
bullets or both be numbers.

The properties drawer has slots for most of the metadata that comes with
a recipe: author, yield, estimated time, etc., as well as one for the
URL, and the date it was added to `Cooking.org`. Combined with the tag
structure, it is a breeze to search for recipes by hitting <kbd>C-c /
m</kbd> and typing in a [match
pattern](https://orgmode.org/manual/Matching-tags-and-properties.html).
This creates a [sparse
tree](https://orgmode.org/manual/Sparse-Trees.html), which shows the
titles of all matching recipes. For example, I can search for:

-   Chinese recipes with the pattern `chinese`;
-   Chinese recipes that are *also* vegetarian with
    `chinese+vegetarian`;
-   Vegetarian Chinese recipes I've never made before with
    `chinese+vegetarian/NEVERMADE`;
-   Recipes I've added in the past month with `Added>="<-1m>"`, or since
    May with `Added>="<2020-05-01>"`;
-   Recipes that come together in less than 90 minutes with
    `Total_time<"1:30"`;[^3]
-   Recipes from the New York Times with `URL={cooking.nytimes.com}`.
    The braces indicate a regular expression.

There is also the <kbd>C-c / p</kbd> command for simple equality
matches---for example, if I wanted to find all recipes by [Amanda
Hesser](https://en.wikipedia.org/wiki/Amanda_Hesser)---which supports
tab completion.

# Adding recipes

Although adding a new recipe is as easy as creating a new heading, it
would be tedious to copy the properties drawer each time. A much easier
way is to use [capture](https://orgmode.org/manual/Capture.html), which
allows the quick "capturing" and filing of data from any open file. I
keep the following [capture
template](https://orgmode.org/manual/Capture-templates.html) in my
`~/.emacs` file:

``` {.lisp}
(custom-set-variables
 '(org-capture-templates
    '(("r" "Recipe" entry
      (file+headline "~/org/Cooking.org" "Unsorted recipes:")
      "* NEVERMADE %? :weekday:
:PROPERTIES:
:Author:
:Source:
:Sent_by:
:Yield:
:Prep_Time:
:Cook_Time:
:Total_Time:
:Cost:
:Description:
:URL:
:Added: %u
:END:"))))
```

I can add a recipe from any file by hitting <kbd>C-c c r</kbd>; org-mode
will create a new recipe under `Unsorted Recipes` with the template
above, and I just have to fill in the details. The `%u` is
[automatically
replaced](https://orgmode.org/manual/Template-expansion.html) with the
current date, and the `%?` tells org-mode where to put the cursor. Since
most recipes follow the same basic pattern (paragraph of metadata,
unnumbered list of ingredients, numbered list of directions), formatting
the recipes as described above is very quick, with a few caveats: times
have to be formatted as `HH:MM`, and the description can't run into
multiple paragraphs (I use `//` as a paragraph separator, but I'm not
thrilled with this solution).

Finally, the new recipe can be easily refiled with <kbd>C-c C-w</kbd>.

# Final thoughts

The main downside to this system is that there is no easy way to store
images. Many recipes have [complicated
assemblies](https://smittenkitchen.com/2012/03/potato-knish-two-ways/)
that are best explained in pictures. The best I can do is store a note
that says something like "see pictures in original recipe", which has
been good enough so far.

[^1]: In Emacs-speak, <kbd>C</kbd> is the control key, <kbd>M</kbd>, or
    "meta" is alt, and <kbd>S</kbd> is shift. So <kbd>M-2 S-Tab</kbd>
    means you hit alt-2, then shift-tab in sequence.

[^2]: This is just a subset for illustration; my actual table is larger.

[^3]: In this and the above example, notice the quotation marks.
