---
addenda:
- '[code](https://github.com/alexklapheke/menu)'
date: 1593814319
title: Menu categorization
---

::: {.epigraph}
The History of every major Galactic Civilization tends to pass through
three distinct and recognizable phases, those of Survival, Inquiry and
Sophistication, otherwise known as the How, Why and Where phases.

For instance, the first phase is characterized by the question "How can
we eat?", the second by the question "Why do we eat?" and the third by
the question, "Where shall we have lunch?"
:::

# Introduction

Since 2011, the New York Public Library has maintained ["What's on the
menu?"](http://menus.nypl.org/), a collection of tens of thousands of
restaurant menus going back to the mid-nineteenth century. This is an
invaluable collection not just for data scientists, but for food
historians, since it is well known that foods go in and out of fashion
like clothing. For example, the famed [Oyster
Bar](https://en.wikipedia.org/wiki/Grand_Central_Oyster_Bar_%26_Restaurant)
at Grand Central Terminal, which in 1941
[featured](https://commons.wikimedia.org/wiki/File:Grand_Central_Terminal_Restaurant_menu_1941.jpg)
"cream of chicken à la reine", "broiled sweetbreads on toast with
Virginia ham", and "farina custard pudding, Melba sauce" (not to mention
oysters for a nickel apiece), today
[serves](https://web.archive.org/web/20160315171449/http://www.oysterbarny.com/pdf/dailymenu.pdf)
such mouthfuls as "poached farmed Norwegian salmon over baby red
oak-watercress salad with charred scallion-honey vinaigrette, avocado,
and goat cheese."

These vicissitudes are due partly to economics. In 1914, avocados, then
known as "alligator pears", [could go
for](https://time.com/4832655/avocado-american-history/) \$1 each---more
than \$25 today. But economics can be adulterated by public perception.
David Foster Wallace, considering the lobster, wrote that
[-@wallace2004consider,p. 55]:

> Up until sometime in the 1800s, though, lobster was literally
> low-class food, eaten only by the poor and institutionalized. Even in
> the harsh penal environment of early America, some colonies had laws
> against feeding lobsters to inmates more than once a week because it
> was thought to be cruel and unusual, like making people eat rats. One
> reason for their low status was how plentiful lobsters were in old New
> England. "Unbelievable abundance" is how one source describes the
> situation, including accounts of Plymouth pilgrims wading out and
> capturing all they wanted by hand, and of early Boston's seashore
> being littered with lobsters after hard storms---these latter were
> treated as a smelly nuisance and ground up for fertilizer. There is
> also the fact that premodern lobster was often cooked dead and then
> preserved, usually packed in salt or crude hermetic containers.
> Maine's earliest lobster industry was based around a dozen such
> seaside canneries in the 1840s, from which lobster was shipped as far
> away as California, in demand only because it was cheap and high in
> protein, basically chewable fuel.

By 1941, of course, the Oyster Bar's menu lists "alligator pear salad"
for 45¢ and "lobster pan roast"---one of the priciest items named---for
\$1.45.[^1] In this project I wanted to see if, using this data,[^2] I
could predict the year a menu was served based on the dishes listed.

# Data structuring

The NYPL provides the data in the very simple [snowflake
schema](https://en.wikipedia.org/wiki/Snowflake_schema) shown in
@fig:schema. The central table is `MenuItem.csv`, in which each of the
1,334,417 rows represents an item on a menu. Each references a
particular dish, which are named in `Dish.csv` (426,959 comestibles in
total), and each is also referenced to a page in `MenuPage.csv`, which
are in turn referenced in `Menu.csv` to the particular bills of fare on
which they appear.

![Menu dataset table schema (some columns omitted). [Source
code](https://gist.github.com/alexklapheke/a197eed2a9ba742aa0080c1bdbfa579c)](images/e21ef90bc35863a4987861c018579662522e923c.svg){#fig:schema}

Since all I wanted was the name of the dish (from `Dish.csv`), the date
(from `Menu.csv`), and the menu ID (in case I wanted to group dishes by
menu), I merged the data frames like so:

``` {.python}
# Add menu id to each menu item
df = pd.merge(
    left = menu_item[["dish_id", "menu_page_id"]],
    right = menu_page[["id", "menu_id"]],
    how = "right",
    left_on = "menu_page_id",
    right_on = "id"
)

# Add menu date to each menu id
df = pd.merge(
    left = df,
    right = menu[["id", "date"]],
    how = "right",
    left_on = "menu_id",
    right_on = "id"
)

# Add dish name to each menu item
df = pd.merge(
    left = df,
    right = dish[["id", "name"]],
    how = "right",
    left_on = "dish_id",
    right_on = "id"
)

# Remove intermediate columns
df = df[["name", "date", "menu_id"]]
```

This left me with a single data frame of menu items to clean and parse.

# Data cleaning

## Dates

The first work to be done was on the dates. For example, 638 dates
turned out to be incorrect or malformed. In some, like `1091-01-27`, the
error was transparent, but with less than 0.05% of the data so
corrupted, I decided to just drop them. However, another 68,438
items---5% of the data---were missing dates altogether. Since they were
useless to the analysis, and I couldn't know if there was a pattern to
the missingness, I was forced to drop these as well. Then, from the 1.27
million well-formed dates remaining, I extracted the year and decade,
the latter of which would prove a more reasonable target for modeling
than the former.

``` {.python}
# Drop malformed dates
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df.dropna(inplace=True)

# Calculate year and decade
df["year"] = df["date"].dt.year
df["decade"] = df["year"] // 10 * 10
```

A further problem is that our dataset's classes are heavily unbalanced.
Looking at @fig:decade, we see that the great preponderance of them---a
full 63% of menus and 62% of items---are from the initial two decades of
the twentieth century.

![Number of menus (left) and menu items (right) by
decade](images/1dd20f58075aee57f212300ff5e6b2ffe63a6034.svg){#fig:decade}

This could cause problems during modeling, not only because a naïve
model could latch onto the majority class and return it without
considering the inputs, but because the meagerness of
data---particularly before 1880 and after 1990---will leave the model
with inadequate information to categorize *any* menu as being from these
eras.

## Menus

Looking at the number of items featured on each menu, we see that
although 22.7% of them feature fewer than a hundred items, several reach
into the thousands, with one startling outlier:

![Number of items on menus (log~10~
scale)](images/ac4a666eef8d26a4926f0acf2cf8ff6de67feb93.svg){#fig:items}

That last menu, a [1933 Plaza Hotel
menu](http://menus.nypl.org/menus/31054), is actually 62 menus bound
together, totalling 4,060 dishes. However, even the runner-up, a [1914
Waldorf Astoria menu](http://menus.nypl.org/menus/34201), packs 1,360
dishes into ten octavo-sized pages. (For reference, the famously
voluminous Cheesecake Factory menu has
["only"](https://www.mentalfloss.com/article/566482/why-the-cheesecake-factorys-menu-is-so-big)
250 items.) This shouldn't matter to the model, of course, since it will
be trained only on individual dish names.

## Dishes

The dish names themselves were somewhat less tractable. The menus are
transcribed by hand, eliminating the need to deal with OCR errors, but
many items were unreasonably long.

![Character length of menu items (log~10~
scale)](images/a47dd4bf94ca107a2ea087828d7ec1885d4141b9.svg){#fig:length}

As the histogram in @fig:length shows, these go well beyond gusty
descriptions like our "poached farmed Norwegian salmon"---the longest,
from first class on a [1993 Virgin Atlantic
flight](http://menus.nypl.org/menus/29358), reads with the paragraph
breaks removed like a deranged Basil Fawlty:

> Afternoon Tea- A Great British Tradition- Tea, the most universally
> consumed of all drinks, is especially popular in Britain where the
> annual consumption is something in the region of 512 million cups. W.
> E. Gladstone observed "If you are cold, tea will warm you- if you are
> heated, it will cool you- if you are depressed, it will cheer you- if
> you are excited, it will calm you." First brought to England c. 1559
> by Giambattista Rusmusio, tea did not evolve into an afternoon meal
> until the end of the 18th century. Anna, Duchess of Bedford, invented
> afternoon tea to fill the long gap between early lunch and dinner
> which bored many house parties. It became a meal surrounded by
> etiquette and customs, delicate china, silver, cake stands and
> doilies- a time when friend and family meet. Famous tea parties
> include Mad Hatter's (Alice's Adventures in Wonderland by Lewis
> Carroll 1865), the Boston Tea Party, 1773, and not forgetting HM Queen
> Elizabeth II's annual garden parties at Buckingham Palace. The Duke of
> Wellington declared that "Tea cleared my head and left no
> misapprehensions." He was right- tea contains small amounts of two B
> vitamins, and has no calories, artificial flavourings or colourings.
> It is said to cure gout, apoplexy, epilepsy, gall stones and
> sleepiness, and one's longevity is assured. "Thank God for Tea! What
> would the world do without tea?"- Sydney Smith

Like the erroneous dates, these were sparse---only 6,682, or 0.5% of the
listed dishes exceeded 100 characters, and these held only 3.7% of the
dataset's total characters. However, the decision to drop them was less
clear-cut, since they potentially contained period-specific text which
could be used to inform a model. I ultimately stetted them for this
reason.

I then processed the text. 251 menu items contained non-ASCII
characters, of which 126 were in French,[^3] 56 Chinese, 21 German, 20
Swedish, 11 Greek, 10 Hindi, 3 Hungarian, and one lonely item in Polish.
The remaining three were English with special characters such as ½.
Happily, the excellent Python library
[Unidecode](https://pypi.org/project/Unidecode/) can do most of the
heavy lifting here, stripping accents, and Romanizing the Greek, Hindi,
and Chinese.

``` {.python}
from unidecode import unidecode

# Remove special characters
df["name"] = df["name"].apply(unidecode)

# Check for remaining non-ASCII characters
df[df["name"].str.match("[^\x00-\x7F]")]["name"]
```

It then remained only to normalize to lower case and tokenize on the
regular expression `[a-z'-]+`, which captures strings of letters,
apostrophes, and hyphens and throws out other punctuation and numbers
(since this destroys ordering information, I put it into a new column
called `tokens`).

``` {.python}
from nltk.tokenize import RegexpTokenizer
from nltk.corpus import stopwords

tokenizer = RegexpTokenizer("[a-z'-]+")
stopwords = set(stopwords.words("english"))

def tokenize(text):
    tokens = set(tokenizer.tokenize(text))
    return " ".join(tokens - stopwords)

df["name"] = df["name"].str.lower()
df["tokens"] = df["name"].apply(tokenize)
```

I also threw out [stopwords](https://en.wikipedia.org/wiki/Stop_words)
such as "the". The text was now ready for exploring trends and building
a predictive model.

# Data exploration

## Cross-sectional

I first examined the top words from each decade, excerpted in
@fig:1850--@fig:1990.

![Most common words on menus from the
1850s](images/3a04acfdc390f9309b3cf78806d685e9b02434ea.svg){#fig:1850}

There are only a few menus from the 1850s in the collection, but we can
get a sense of the palate. Names of wines---*madeira*, *sherry*, and
*claret*, and probably also *château* and *pale*---feature prominently,
and the most common cooking methods are boiling and roasting.

![Most common words on menus from the
1910s](images/122b6b74e110c1dc2b7425adaed5d377da8df865.svg){#fig:1910}

By the 1910s, we have a new picture: fried foods are popular, as are
cream sauces. Chicken and beef have made the list, as, notably, does
salad, as fresh fruits and vegetables become more available to the
average patron.

![Most common words on menus from the
1950s](images/0da635cbd4d4a354db51f4e5ab3017b5fa4a120d.svg){#fig:1950}

We see fewer changes in the post-war era, but "fresh" has been advanced,
as have French *de* 'of' and German *mit* 'with', indicating European
dishes, or at least European phrasings, coming into vogue.

![Most common words on menus from the
1990s](images/723984e59c0e4e8141e3374f230a6946b946f0a6.svg){#fig:1990}

In the 1990s, "fried" has been replaced by "grilled", and a renewed
interest in French cuisine seems to be the *dernier cri*, as five of the
ten are French grammatical words not filtered by the English stopword
list (and *de* outpacing the next-highest word by almost 2 to 1).

## Longitudinal

Equally illuminating is to look at the waxing and waning of particular
foods across time, in the style of [Google
Ngrams](https://books.google.com/ngrams).

``` {.python}
words = ["lobster", "oyster"]

occurrences = {word: df["tokens"].str.contains(f"\\b{word}\\b") for word in words}
menu_item_prop = pd.DataFrame(occurrences).join([df["year"]).groupby("year").mean()
```

The Madeira that was so popular in the 1850s dropped off steeply soon
after (@fig:madeira).

![Percent of menu items per year containing the word
"Madeira"](images/55176d110106bf97c9df11bc5d37b3dec891fa5b.svg){#fig:madeira}

We see the Sun rise and set on the age of Jell-O in @fig:jello, and in
@fig:tofu the nascence of tofu.

![Percent of menu items per year containing the word
"Jell-O"](images/d7650987a52a9968e759d9e982fa315a003a784c.svg){#fig:jello}

![Percent of menu items per year containing the word
"tofu"](images/242a8f0179d5369eece0428dc40c34d25f421627.svg){#fig:tofu}

It is also interesting to look at descriptors. Organic food is rooted in
the environmental movement of the '60s and '70s, but doesn't appear on
restaurant menus until the turn of the millennium.

![Percent of menu items per year containing the word
"organic"](images/465c7e3374dde92e731b828ea2f3f4e57c9f567e.svg){#fig:organic}

Health terms such as "diet" show a similar trend, appearing in numbers
in the '70s.

![Percent of menu items per year containing health terms\
\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#e7298a" /></svg> "health"\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#66a61e" /></svg> "healthy"\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#e6ab02" /></svg> "diet"\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#a6761d" /></svg> "lite"\
](images/b21f5423a476f59753e4714af6e8367e55d951a1.svg){#fig:health}

We can also use foreign words that commonly appear on menus as a rough
proxy for how fashionable those cuisines were in different periods.

![Percent of menu items per year containing foreign prepositions\
\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#e7298a" /></svg> *au*
(Fr. 'in the style of')\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#66a61e" /></svg> *alla*
(It. 'in the style of')\
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#e6ab02" /></svg> *mit*
(Gm.
'with')](images/1d1e57611acc1f871be5269d4c4febffa43f7369.svg){#fig:auallamit}

A clear post-war interest in French and German cuisine manifests
itself---although the 40% of menu items in 2005 containing *mit* is more
likely an artifact of a small sample than a genuine trend.

# Modeling

The first step is to sample from the data, firstly to correct the class
imbalance seen in @fig:decade above, but more importantly, to curtail
the incredibly large matrix we would get if we vectorized the entire
data frame.[^4]

``` {.python}
# We want each class to have only as many as the smallest class
sample_size = df.groupby("decade")["name"].count().min()

# Sample randomly from each decade
sample = df.sample(frac=1).groupby("decade").head(sample_size)
```

Then we define our variables and create train and test classes:

``` {.python}
from sklearn.model_selection import train_test_split

X = sample["tokens"]
y = sample["decade"]

X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y)
```

Since the `tokens` column has already been cleaned, we can it for
modeling using [tf-idf](https://en.wikipedia.org/wiki/Tf%E2%80%93idf)
vectorization, which assigns high scores to words which are highly
localized, occurring, say, only in the 1970s and nowhere else. This
turns a vector of words into a matrix of tf-idf scores.

``` {.python}
from sklearn.feature_extraction.text import TfidfVectorizer

tfidf = TfidfVectorizer()
X_train_vec = tfidf.fit_transform(X_train)
X_test_vec = tfidf.transform(X_test)
```

Finally, the model itself can be constructed. I use a Gaussian naïve
Bayes classifier, which is standard despite the data not following a
Gaussian distribution.

``` {.python}
from sklearn.naive_bayes import GaussianNB

bayes = GaussianNB().fit(X_train_vec.toarray(), y_train)
```

Finally, we assess the accuracy of the model.

``` {.python}
bayes.score(X_train_vec.toarray(), y_train)
bayes.score(X_test_vec.toarray(), y_test)
```

The results are pretty disappointing: 77.5% train accuracy and 17.6%
test accuracy mean that the model arbitrarily latched onto some words
that weren't really indicative of their decades. This is due to our
miserliness with the data: the model was only allowed to see 0.2% of the
menu items. We can fix this by taking the second-lowest class rather
than the lowest. This will give us *mostly* balanced classes, but with
fewer in the 1870s, to which only 174 menus are dated.

``` {.python}
sample_size = df.groupby("decade")["name"].count().sort_values().iloc[1]
```

The results are more promising: 52.7% train and 21.7% test accuracy.
Another consideration is that, since our classes are ordinal, even when
the model is wrong, it may only be wrong by a decade or two. We can
check this by defining a "fuzzy accuracy" score, and seeing how

``` {.python}
def fuzzy_accuracy(y_true, y_pred, tolerance):
    return np.mean(np.abs(y_true - y_pred) <= tolerance)

fuzzy_accuracy(y_train, bayes.predict(X_train_vec.toarray()), tolerance=10)
fuzzy_accuracy(y_test, bayes.predict(X_test_vec.toarray()), tolerance=10)
```

We now get 62.7% train and 40.2% test accuracy with a tolerance of one
decade. With more memory available, it would be possible to feed more of
the dataset into the model, and perhaps create a yet more accurate
model.

# Final thoughts

I'll end with an amusing and instructive story: as I was working on
this, I reimported my data, and was surprised to see there were dishes
listed as missing. I verified that no rows were missing in the original
dataset, and tried to figure out which dishes had been dropped. It turns
out that an [Indian menu](http://menus.nypl.org/menus/28323) from 1981
listed naan bread, but spelled it "nan", and pandas interpreted that as
[not a
number](https://numpy.org/doc/stable/reference/constants.html?highlight=nan#numpy.nan).
The solution was simply to pass `na_filter=False`{.python} to
`pd.read_csv()`{.python}, but the lesson learned was always to check
that the data read in is the same as the data written out.

[^1]: In 2020, \$7.85 and \$25.29, respectively

[^2]: Retrieved April 27, 2020

[^3]: Or else in what Chesterton called "a sort of super-French employed
    by cooks, but quite unintelligible to Frenchmen"

[^4]: Sampling function borrowed from
    <https://stackoverflow.com/a/56841648>
