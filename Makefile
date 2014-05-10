all: build/js/min.js build/js/compat.js build/css/min.css build/index.html build/index.debug.html build/sitemap.xml localhtml simple

# Note: the min.{js,css} are equal to all.{js,css}; minification gives
# negligible improvements over just enabling gzip in the server, and
# brings with it lots of dependencies and a more complicated build.


### Directories ###
%/.d:
	test -d $(@D) || mkdir -p $(@D)
	touch $@

# Don't autoremove
.PRECIOUS: build/.d build/js/.d build/css/.d

### JS ###
JSFILES= \
	assets/js/jquery.jsonp-2.4.0.min.js \
	assets/js/config.js \
	build/js/locales.js \
	assets/js/util.js \
	assets/js/persistence.js \
	assets/js/caching.js \
	assets/js/localization.js \
	assets/js/translator.js \
	assets/js/analyzer.js \
	assets/js/generator.js \
	assets/js/sandbox.js

assets/js/config.js: config.conf read-conf.py
	./read-conf.py -c $< js > $@

# Only create the file based on the example if it doesn't exist
# already; otherwise just give a message that the user might want to
# merge it in:
config.conf: config.conf.example
	@if test -f $@; then \
		touch $@; \
		echo; echo You may have to merge new changes from $^ into $@; echo; \
	else \
		cp $^ $@; \
		echo; echo You should edit $@; echo; \
	fi

build/js/locales.js: assets/strings/locales.json build/js/.d
	echo "config.LOCALES = `cat $<`;" > $@

build/js/all.js: $(JSFILES) build/js/.d
	cat $(JSFILES) > $@

build/js/min.js: build/js/all.js
	cp $< $@

build/js/compat.js: assets/js/compat.js build/js/.d
	cp $< $@

### HTML ###
build/index.debug.html: index.html.in debug-head.html
	sed -e '/@include_head@/r debug-head.html' -e '/@include_head@/d' $< > $@

# timestamp links, only double quotes supported :>
build/prod-head.html: prod-head.html build/js/all.js build/css/all.css
	ts=`date +%s`; sed "s/\(href\|src\)=\"\([^\"]*\)\"/\1=\"\2?$${ts}\"/" $< > $@

build/index.localiseme.html: index.html.in build/prod-head.html build/l10n-rel.html
	sed -e '/@include_head@/r build/prod-head.html' -e '/@include_head@/r build/l10n-rel.html' -e '/@include_head@/d' $< > $@


## HTML localisation
# JSON-parsing-regex ahoy:
localhtml: $(shell sed -n 's%^[^"]*"\([^"]*\)":.*%build/index.\1.html% p' assets/strings/locales.json)


# hreflang requires iso639-1 :/ Fight ugly with ugly:
build/l10n-rel.html: assets/strings/locales.json isobork build/.d
	awk 'BEGIN{while(getline<"isobork")i[$$1]=$$2} /:/{sub(/^[^"]*"/,""); sub(/".*/,""); borkd=i[$$0]; if(!borkd)borkd=$$0; print "<link rel=\"alternate\" hreflang=\""borkd"\" href=\"index."$$0".html\"/>"}' $^ > $@

build/index.%.html: assets/strings/%.json build/index.localiseme.html
	if ! ./localise-html.py build/index.localiseme.html < $< > $@; then rm -f $@; false; fi

build/index.html: build/index.eng.html
	cp $^ $@

## Sitemap
.INTERMEDIATE: build/.html-url # TODO: is there a way to have prerequisites of _variables_? (could do away with the intermediate file)
build/.html-url: config.conf read-conf.py
	./read-conf.py -c $< get HTML_URL > $@
build/sitemap.xml: sitemap.xml.in build/l10n-rel.html build/.html-url
	sed -e 's%^<link%<xhtml:link%' -e "s%href=\"%&$(shell cat build/.html-url)/%" build/l10n-rel.html > build/l10n-rel.html.tmp
	sed -e "s%@include_url@%$(shell cat build/.html-url)%" -e '/@include_linkrel@/r build/l10n-rel.html.tmp' -e '/@include_linkrel@/d' $< > $@
	rm -f build/l10n-rel.html.tmp

### CSS ###
build/css/all.css:  assets/css/bootstrap.css assets/css/style.css build/css/.d
	cat $^ > $@

build/css/min.css: build/css/all.css
	cp $^ $@


### Simple assets ###
# Images and strings just copied over
SIMPLE_ASSETS=$(shell find assets/img assets/strings -type f)
SIMPLE_BUILD=$(patsubst assets/%, build/%, $(SIMPLE_ASSETS))

build/%: assets/%
	@mkdir -p $(@D)
	cp $< $@

simple: $(SIMPLE_BUILD)


### Clean ###
clean:
	rm -rf build/

