# To publish a blog post:
#     1. Copy all files from blog/drafts to blog/publish
#     2. Run $ make blog
#     3. RSS feed and site homepage will be automatically updated
#     4. Validate RSS feed: https://validator.w3.org/feed/

markdown = $(wildcard publish/*.md)
html = $(patsubst publish/%.md,%.html,$(markdown))

pubdate = $(shell date -Iseconds)
pubdate_pretty = $(shell date -d $(pubdate) +"%A, %B %e, %Y")
pubdate_terse = $(shell date -d $(pubdate) +"%F")

define pandoc_body_options
--mathml \
--section-divs \
--ascii \
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
	if [ ! -e $@ ]; then \
		pandoc -t html5+smart                   \
			--template=templates/index-item.html \
			-V date=$(pubdate)                 \
			-V date_terse=$(pubdate_terse)     \
			-V target=$@                   \
			$(pandoc_body_options)             \
			$< -o index-item.html;      \
			sed -i '/<ul id="bloglist">/r index-item.html' ../index.html; \
			rm index-item.html; \
		pandoc -t html5+smart                   \
			--template=templates/rss.xml       \
			-V date=$(pubdate_terse)           \
			$(pandoc_body_options)             \
			$< | tac >> rss-items.xml;         \
	fi
	pandoc -t html5+smart                   \
		--css=/include/style.css           \
		--css=/include/blog.css            \
		--standalone                       \
		-V 'lang=en-US'                    \
		-V date="$(pubdate_pretty)"        \
		--template=templates/blogpost.html \
		--resource-path=publish            \
		--extract-media=images             \
		--toc                              \
		$(pandoc_body_options)             \
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
	echo "		<lastBuildDate>$(pubdate)</lastBuildDate>"        >> rss.xml
	tac rss-items.xml                                             >> rss.xml
	echo "	</channel>"                                           >> rss.xml
	echo "</rss>"                                                 >> rss.xml
