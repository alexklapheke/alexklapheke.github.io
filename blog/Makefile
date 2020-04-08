markdown = $(wildcard *.md)
html = $(patsubst %.md,%.html,$(markdown))

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

blog : clean rss.xml

clean :
	rm -f rss.xml
	rm -f index.html

%.html : %.md
	pandoc -t html+smart             \
		-V 'lang=en-US'              \
		-V date="$(pubdate_pretty)"  \
		--standalone                 \
		--css=include/style.css      \
		--toc                        \
		$(pandoc_body_options)       \
		-o $@ $<
	pandoc -t html+smart             \
		--template=templates/index.html \
		-V date=$(pubdate)           \
		-V date_terse=$(pubdate_terse) \
		$(pandoc_body_options)       \
		$< | tac >> index-items.html
	pandoc -t html+smart             \
		--template=templates/rss.xml \
		-V date=$(pubdate)           \
		-V sourcefile=$@             \
		$(pandoc_body_options)       \
		$< | tac >> rss-items.xml

index.html : $(html)
	tac index-items.html >> index.html

rss.xml : $(html)
	echo "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>" >> rss.xml
	echo "<rss version=\"2.0\">" >> rss.xml
	echo "	<channel>" >> rss.xml
	echo "		<title>Alex Klapheke</title>" >> rss.xml
	echo "		<link>https://alexklapheke.github.io/blog</link>" >> rss.xml
	echo "		<description></description>" >> rss.xml
	echo "		<lastBuildDate>$(pubdate)</lastBuildDate>" >> rss.xml
	tac rss-items.xml >> rss.xml
	echo "	</channel>" >> rss.xml
	echo "</rss>" >> rss.xml

