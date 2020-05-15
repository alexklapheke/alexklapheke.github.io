# To publish a blog post:
#     1. Copy all files from blog/drafts to blog/publish
#     2. Run $ make blog
#     3. RSS feed and site homepage will be automatically updated
#     4. Validate RSS feed: https://validator.w3.org/feed/

# Markdown word counter from <https://github.com/gandreadis/markdown-word-count>

source = $(wildcard publish/*.md)
markdown = $(patsubst publish/%.md,%.md,$(source))
html = $(patsubst publish/%.md,%.html,$(source))

now = $(shell date -Iseconds)

define pandoc_body_options
--mathml \
--section-divs \
--filter=pandoc-crossref \
--filter=pandoc-citeproc \
--highlight-style=pygments \
--syntax-definition=$(HOME)/.pandoc/org-mode.xml \
--bibliography=$(HOME)/texmf/bibtex/bib/references.bib
endef

.PHONY : clean blog

blog : rss.xml

clean :
	rm -f rss.xml

%.html : publish/%.md templates/index-item.html templates/rss.xml templates/blogpost.html
	sed -i 's/\$$DATE\$$/$(now)/' $<;                                                   \
	pubdate=$$(pandoc -t plain --template=templates/date.plain $<);                     \
	pubdate_pretty=$$(date -d $$pubdate +"%A, %B %e, %Y");                              \
	pubdate_terse=$$(date -d $$pubdate +%F);                                            \
	if [ ! -e $@ ]; then                                                                \
		pandoc -t html5+smart                                                           \
			--ascii                                                                     \
			--template=templates/index-item.html                                        \
			-V date=$$pubdate                                                           \
			-V date_terse=$$pubdate_terse                                               \
			-V target=$@                                                                \
			$(pandoc_body_options)                                                      \
			$< -o index-item.html;                                                      \
			sed -i '/<ul id="bloglist">/r index-item.html' ../index.html;               \
			rm index-item.html;                                                         \
		echo "		</item>" >> rss-items.xml;                                          \
		echo "	</description>" >> rss-items.xml;                                       \
		pandoc publish/firstpost.md -t html | recode utf8..html | tac >> rss-items.xml; \
		echo "	<description>" >> rss-items.xml;                                        \
		pandoc -t html5+smart                                                           \
			--ascii                                                                     \
			--template=templates/rss.xml                                                \
			-V date=$$pubdate                                                           \
			-V date_terse=$$pubdate_terse                                               \
			$(pandoc_body_options)                                                      \
			$< | tac >> rss-items.xml;                                                  \
		echo "		<item>" >> rss-items.xml;                                           \
	fi;                                                                                 \
	pandoc -t html5+smart                                                               \
		--css=../include/style.css                                                      \
		--css=../include/blog.css                                                       \
		--standalone                                                                    \
		-V 'lang=en-US'                                                                 \
		-V date=$$pubdate                                                               \
		-V date_pretty="$$pubdate_pretty"                                               \
		-V wordcount=$(shell mwc.py $<)                                                 \
		--template=templates/blogpost.html                                              \
		--resource-path=publish                                                         \
		--extract-media=images                                                          \
		--toc                                                                           \
		$(pandoc_body_options)                                                          \
		-o $@ $<

index.html : $(html)
	cat templates/index-header.html >  index.html
	tac index-items.html            >> index.html
	cat templates/index-footer.html >> index.html

rss.xml : $(html)
	echo "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>"            >  rss.xml
	echo "<rss version=\"2.0\">"                                  >> rss.xml
	echo "	<channel>"                                            >> rss.xml
	echo "		<title>Alex Klapheke</title>"                     >> rss.xml
	echo "		<link>https://alexklapheke.github.io/blog</link>" >> rss.xml
	echo "		<description></description>"                      >> rss.xml
	echo "		<lastBuildDate>$(now)</lastBuildDate>"            >> rss.xml
	tac rss-items.xml                                             >> rss.xml
	echo "	</channel>"                                           >> rss.xml
	echo "</rss>"                                                 >> rss.xml
