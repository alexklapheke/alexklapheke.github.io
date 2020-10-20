# To publish a blog post:
#     1. Copy all files from blog/drafts to blog/publish
#     2. Run $ make blog
#     3. RSS feed and site homepage will be automatically updated
#     4. Validate RSS feed: https://validator.w3.org/feed/

# Markdown word counter from <https://github.com/gandreadis/markdown-word-count>

# TODO: change <span lang=""> to <bdi lang="">

source = $(wildcard publish/*.md)
markdown = $(patsubst publish/%.md,%.md,$(source))
html = $(patsubst publish/%.md,%.html,$(source))

bibfile = $(HOME)/texmf/bibtex/bib/references.bib
cslfile = $(HOME)/.pandoc/chicago-footnotes.csl

ghraw = https://raw.githubusercontent.com/alexklapheke/alexklapheke.github.io/master/blog

# now = $(shell date -Iseconds)
now = $(shell date +%s)
now_full = $(shell date -R -d @$(now))

define pandoc_body_options
--ascii \
--mathml \
--section-divs \
--number-sections \
--filter=pandoc-crossref \
--filter=pandoc-citeproc \
--highlight-style=kate \
--syntax-definition=$(HOME)/.pandoc/org-mode.xml \
--bibliography=$(bibfile) \
--csl=$(cslfile) \
--lua-filter=filters/date.lua
endef

.PHONY : clean blog

blog : rss.xml

clean :
	rm -f rss.xml

%.html : publish/%.md templates/index-item.html templates/rss.xml templates/blogpost.html $(bibfile)
	prosecheck $<;                                                                                \
	sed -i 's/\$$DATE\$$/$(now)/' $<;                                                             \
	if [ ! -e $@ ]; then                                                                          \
		pandoc -t html5+smart                                                                     \
			--template=templates/index-item.html                                                  \
			-V target=$@                                                                          \
			$(pandoc_body_options)                                                                \
			$< -o index-item.html;                                                                \
			sed -i '/<ul id="bloglist">/r index-item.html' ../index.html;                         \
			rm index-item.html;                                                                   \
		echo "		</item>" >> rss-items.xml;                                                    \
		echo "	</description>" >> rss-items.xml;                                                 \
		pandoc $< -t html | recode utf8..XML-standalone | tac >> rss-items.xml;                   \
		echo "	<description>" >> rss-items.xml;                                                  \
		pandoc -t html5+smart                                                                     \
			--strip-comments                                                                      \
			--template=templates/rss.xml                                                          \
			$(pandoc_body_options)                                                                \
			$< | tac >> rss-items.xml;                                                            \
		echo "		<item>" >> rss-items.xml;                                                     \
		echo "New post $@ created at $$pubdate.";                                                 \
	fi;                                                                                           \
	pandoc -t html5+smart                                                                         \
		--strip-comments                                                                          \
		--css=../include/style.css                                                                \
		--css=../include/blog.css                                                                 \
		--standalone                                                                              \
		-V 'lang=en-US'                                                                           \
		-V markdown=$(patsubst publish/%.md,$(ghraw)/%.md,$<)                                     \
		--template=templates/blogpost.html                                                        \
		--resource-path=publish                                                                   \
		--extract-media=images                                                                    \
		--toc                                                                                     \
		--lua-filter filters/wordcount.lua                                                        \
		$(pandoc_body_options)                                                                    \
		-o $@ $<;                                                                                 \
	pandoc -t markdown                                                                            \
		--strip-comments                                                                          \
		--standalone                                                                              \
		--atx-headers                                                                             \
		--resource-path=publish                                                                   \
		--extract-media=images                                                                    \
		-o $(patsubst publish/%.md,%.md,$<) $<;                                                   \
	sed -i 's/<table>/<table class="sortable">/' $@;                                              \
	sed -i 's/<thead>/<thead title="Click to sort">/' $@;                                         \
	sed -i 's/<img\([^>]\+\)src="\([^"]\+.svg\)"\([^>]\+\)\/>/<object\1data="\2"\3>&<\/object>/' $@; \
	echo "Post $@ content updated."

index.html : $(html)
	cat templates/index-header.html >  index.html
	tac index-items.html            >> index.html
	cat templates/index-footer.html >> index.html

rss.xml : $(html)
	echo "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>"            >  rss.xml
	echo "<rss version=\"2.0\">"                                  >> rss.xml
	echo "	<channel>"                                            >> rss.xml
	echo "		<title>Alexander Klapheke</title>"                >> rss.xml
	echo "		<link>https://alexklapheke.github.io/</link>"     >> rss.xml
	echo "		<description></description>"                      >> rss.xml
	echo "		<language>en-US</language>"                       >> rss.xml
	echo "		<lastBuildDate>$(now_full)</lastBuildDate>"       >> rss.xml
	tac rss-items.xml                                             >> rss.xml
	echo "	</channel>"                                           >> rss.xml
	echo "</rss>"                                                 >> rss.xml
