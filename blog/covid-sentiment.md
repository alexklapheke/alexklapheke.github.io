---
addenda:
- '[code](https://github.com/alexklapheke/Social-Media-Sentiment-Analysis)'
- |
    [slide
    deck](https://github.com/alexklapheke/Social-Media-Sentiment-Analysis/blob/master/presentation/Covid%2019%20Sentiment%20Analysis.pdf)
date: '2020-06-23T15:58:12-04:00'
title: 'COVID-19 Sentiment Analysis'
---

This project is joint work with Luken Weaver, Jon Godin, and Reza
Farrokhi.

::: {.epigraph}
The Master said, "When the multitude hate a man, it is necessary to
examine into the case. When the multitude like a man, it is necessary to
examine into the case."
:::

# Background & problem statement

The COVID-19 crisis officially began in the US on January 20, when an
infected traveler in Wuhan flew home to Washington State
[@holshue2020first]. For the several months thence, in the absence of a
unified national policy, states have engaged in a complicated fandango
of business closures, mask orders, and quarantines for visitors. While
it would take a much more sophisticated data analysis to gauge their
effectiveness, we can look at how these policies were popularly received
using social media sentiment as a proxy.

We chose to compare sentiment between two cities in which the saga took
quite different turns: New York, which suffered both an alarming
outbreak and an austere lockdown (ongoing at time of writing), and
Houston, which had a much easier time, with fewer infections than New
York City had deaths, and a lockdown lasting barely a month
(@fig:nychou).

![Case and death counts in New York City (all five boroughs) and in
Harris County, Texas (which contains Houston) as of June 22. Data
courtesy of the [*New York
Times*](https://github.com/nytimes/covid-19-data).<br><br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#081220" /></svg> Cases<br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#CE2A07" /></svg> Deaths<br>
<svg width="20" height="10"><rect x="0" y="0" width="20" height="10" fill="#E0E0E0" stroke="none" /></svg> Lockdown
(statewide)](images/3f1e7e6df86e8f9fd018a392563d41c599aa0188.svg){#fig:nychou}

A naïve hypothesis would be that Houstonians, faring better overall,
would speak with more positive affect. Complicating this, of course, is
the profusion of topics on which people might converse, including:
China, Donald Trump, Anthony Fauci, the CDC and WHO, governors Andrew
Cuomo[^1] and Greg Abbott[^2], cruise ships, quarantines, face masks,
and the cancellations of events, not to mention the pathogen itself and
its physiological effects. Our goal, therefore, was to isolate topics of
conversation, and examine the sentiment surrounding particular public
figures.

# Data collection

Our preferred data source was Twitter, which, with a third of a billion
users, captures an enormous fraction of the public discourse. In
addition, there is an up-to-date, curated
[dataset](https://github.com/thepanacealab/covid19_twitter) of COVID-19
related tweets [@banda2020a]. However, time and budget allowed few
tweets to be captured---either on the order of 10^3^ total, or
stretching back only seven days. In addition, the paucity of
geotags---by [some
estimates](https://www.forbes.com/sites/kalevleetaru/2019/03/04/visualizing-seven-years-of-twitters-evolution-2012-2018/),
on the order of 1%---would make filtering by city nearly impossible.

Reddit turned out to be somewhat more hospitable, as
[pushshift](https://github.com/pushshift/api) provides free access to
the Reddit API, as well as a [full
dataset](http://files.pushshift.io/reddit/comments/) of Reddit comments
stretching back to the site's founding [@baumgartner2020pushshift],
although the latter source was not updated frequently enough for our
purpose. Reddit users subscribe to interest communities called
"subreddits", prefixed with "/r/", some of which are for cities and
other locales. While it can't be verified that a particular subscriber
is a resident, we assume that a large proportion of them are. One
downside of this structure is that subreddits can become [echo
chambers](https://en.wikipedia.org/wiki/Echo_chamber_(media)) which do
not represent the larger population.

Another difficulty is that although Reddit ranks in the [top 20
websites](https://www.alexa.com/siteinfo/reddit.com) by traffic, the
volume of posts pales next to Twitter. Although each metropolitan
subreddit records hundreds of thousands of subscribers, by the [90--9--1
rule of
thumb](https://en.wikipedia.org/wiki/1%25_rule_(Internet_culture)), we
guessed that in a subreddit with on the order of 10^5^ subscribers, only
about 10^3^ would be active commenters, as shown in @tbl:commenters.

  Subreddit    City pop.   Subscribers   Casual commenters   Active commenters
  ------------ ----------- ------------- ------------------- -------------------
  /r/nyc       8,300,000   225,000       ≈20,000             ≈2,000
  /r/houston   2,300,000   150,000       ≈13,500             ≈1,500

  : City and subreddit populations and commenter estimates
  {\#tbl:commenters}

We focused on comments, since most of the substantive (read:
sentiment-laden) discussion happens there; however, these are not
guaranteed to contain topic-relevant keywords, so we searched for posts
whose titles contained any of the keywords "COVID", "coronavirus",
"quarantine", or "pandemic". Reddit
[generates](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/utils/_utils.pyx#L39-L40)
a base 36 ID for each post and comment on the site, so we collated post
IDs with comment IDs, as the simplified code snippet below illustrates.

``` {.python}
import requests
import pandas as pd

comments = []

for subreddit in ["nyc", "houston"]:

    # Get posts with the most comments
    res = requests.get(
        "https://api.pushshift.io/reddit/search/submission",
        params = {
            "subreddit": subreddit,
            "size": 400,
            "sort_type": "num_comments",
            "sort": "desc",
        })

    # Parse JSON
    posts = pd.DataFrame(res.json()["data"])

    # Get comments from posts
    res = requests.get(
        "https://api.pushshift.io/reddit/search/comment",
        params = {
            "subreddit": subreddit,
            "link_id": (["t3_" + n for n in posts["id"]]),
            "size": 1000,
        })

    # Collect parsed output
    comments.append(pd.DataFrame(res.json()["data"]))
```

In toto, we collected 150,000 comments from /r/nyc, and 85,000 from
/r/houston, and randomly sampled 85,000 New York comments for the
analysis to avoid variance issues.

# Sentiment analysis

The sentiment analysis itself was done with the VADER sentiment parser
[@vader], a sophisticated rule-based parser that incorporates contextual
information such as negations ("not"), intensifiers ("very"), hedges
("somewhat"), and even emoticons (":)").[^3] For these reasons, it works
best on unprocessed text:

``` {.python}
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Instantiate sentiment analyzer & compute sentiments
analyzer = SentimentIntensityAnalyzer()
sentiments = pd.DataFrame(map(analyzer.polarity_scores, comments["text"]))

# Append to original data frame
comments = comments.join(sentiments.set_index(comments.index))
```

It provides a "sentiment intensity" score which is signed for polarity
(positive good, negative bad). We took the 5-day rolling mean of the
sentiments of all comments, filtering for various keywords.

Two important caveats apply, the first of which is that knowing *what*
the sentiment is doesn't tell you *why*. For example, in late April,
/r/nyc responded negatively to the keyword "Fauci", but this turned out
to be displeasure not with Fauci himself, but rather with Trump, who had
considered firing him. Thus, sentiment *around* a public figure should
not be conflated with sentiment *toward* that figure. The second caveat
is that positive and negative sentiments can cancel; so although a
highly positive or negative overall sentiment score reflects unanimity
in these feelings, a neutral score does not represent apathy, but simply
lack of consensus.

One way consensus is achieved on Reddit is by voting: users vote for
("upvote") or against ("downvote") comments, and the comment's score is
the number of votes for minus the number against. If voting is a way of
agreeing with the sentiment of a comment, then it can be seen as tacitly
expressing the same sentiment. We accounted for this by eliminating
comments that scored less than one, and weighting the sentiment of the
remainder by their scores:

``` {.python}
import numpy as np

comments["weighted"] = np.maximum(0,
    # Sentiment score
    comments["compound"] *
    # Reddit score
    comments["score"] *
    # Scaling factor (for convenience; does not change analysis)
    0.75)
```

One potential pitfall is that since the highest-scoring comments appear
highest on the page, this can be subject to the [bandwagon
effect](https://en.wikipedia.org/wiki/Bandwagon_effect), by which users
see, and then upvote, comments that are already popular.

We graphed the weighted sentiments of COVID-related posts in 2020
(@fig:2020), and formulated a baseline sentiment for comparison---maybe
sentiment is more positive in haler times, or maybe New Yorkers really
are [less positive](https://www.youtube.com/watch?v=lX4MoaTFp9g) in
general---so we looked at comments from the same months in the previous
year, without filtering by keyword (@fig:2019).

![COVID-related sentiment across cities, 2020 (5-day rolling
mean)<br><br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#FF5500" /></svg> New
York<br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#0658CF" /></svg> Houston<br>](images/d89180b2553b6e5cd53d96829abd4c6acf722a35.svg){#fig:2020}

The overall results were unilluminating; the only particularly positive
or negative periods, in February 2020, are essentially artifacts due to
insufficient data (the virus had not yet seized the nation's attention).

![General sentiment across cities, 2019 (5-day rolling mean)<br><br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#FF5500" /></svg> New
York<br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#0658CF" /></svg> Houston<br>](images/b5ca49f637a5e4007a3da8506aafdc19e706b258.svg){#fig:2019}

A clearer picture arose around public figures. After filtering by the
surname of each state's governor, we see a positive spike in New York in
the early days of shutdowns, whereas Houston takes a swift negative turn
when Abbott declares lockdown, and swiftly becomes positive after he
orders its end (@fig:gov).

![Sentiment around governors across cities, 2020 (5-day rolling
mean)<br><br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#FF5500" /></svg> New
York (Keyword "Cuomo")<br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#0658CF" /></svg> Houston
(Keyword
"Abbott")<br>](images/8c8f9d11ec59d39e31be63fd9eb8df6ac232e28a.svg){#fig:gov}

This seems to imply that New Yorkers, having been much harder hit, were
more sanguine about curtailments of public life than the relatively
freewheeling Texans.

A similarly revealing pattern is shown in response to the keyword
"Trump" (@fig:trump). While comments about the president tended negative
overall, they dipped steeply in late April, possibly in response to his
defunding the WHO.

![Sentiment around President Trump across cities, 2020 (5-day rolling
mean)<br><br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#FF5500" /></svg> New
York (Keyword "Trump")<br>
<svg width="20" height="4"><line x1="0" y1="0" x2="20" y2="0" stroke-width="4" stroke="#0658CF" /></svg> Houston
(Keyword
"Trump")<br>](images/b27797c4e7d81546407d8e69449b18b8f905a9fc.svg){#fig:trump}

# Conclusions

We have shown that public attitudes as expressed on social media can be
tied to world events, and analyzed attitudes toward events during the
COVID-19 crisis. This analysis could be expanded with, e.g., a more
sophisticated weighting scheme, more precise filtering, or a larger
dataset.

[^1]: Dem., NY, in office since 2011

[^2]: Rep., TX, in office since 2015

[^3]: Some sample inputs and scores are shown below:

      Text            Score
      --------------- ---------
      great!          +0.6588
      great           +0.6249
      very good       +0.4927
      good            +0.4404
      not bad         +0.4310
      somewhat good   +0.3832
      okay            +0.2263
      meh             −0.0772
      not good        −0.3412
      bad             −0.5423
