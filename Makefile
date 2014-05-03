all: build/js/min.js build/js/compat.js build/css/min.css build/index.html build/index.debug.html localhtml simple

# Note: the min.{js,css} are equal to all.{js,css}; minification gives
# negligible improvements over just enabling gzip in the server, and
# brings with it lots of dependencies and a more complicated build.


### JS ###
JSFILES= \
	assets/js/jquery.jsonp-2.4.0.min.js \
	assets/js/config.js \
	assets/js/util.js \
	assets/js/persistence.js \
	assets/js/caching.js \
	assets/js/localization.js \
	assets/js/translator.js \
	assets/js/analyzer.js \
	assets/js/generator.js \
	assets/js/sandbox.js

# Only create the file based on the example if it doesn't exist
# already; otherwise just give a message that the user might want to
# merge it in:
assets/js/config.js: assets/js/config.js.example
	@if test -f assets/js/config.js; then \
		touch $@; \
		echo; echo You may have to merge new changes from $^ into $@; echo; \
	else \
		cp $^ $@; \
		echo; echo You should edit $@; echo; \
	fi


jquery-1.8.js:
	curl https://closure-compiler.googlecode.com/git/contrib/externs/$@ > $@
	touch $@

build/js/all.js: $(JSFILES)
	mkdir -p build/js
	cat $^ > $@

build/js/min.js: build/js/all.js
	cp $^ $@

build/js/compat.js: assets/js/compat.js
	cp $^ $@

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
build/l10n-rel.html: assets/strings/locales.json isobork
	mkdir -p build/
	awk 'BEGIN{while(getline<"isobork")i[$$1]=$$2} /:/{sub(/^[^"]*"/,""); sub(/".*/,""); print "<link rel=\"alternate\" hreflang=\""i[$$0]"\" href=\"./index."$$0".html\"/>"}' $^ > $@


build/index.%.html: assets/strings/%.json build/index.localiseme.html
	if ! ./localise-html.py build/index.localiseme.html < $< > $@; then rm -f $@; false; fi

build/index.html: build/index.eng.html
	cp $^ $@

### CSS ###
build/css/all.css:  assets/css/bootstrap.css assets/css/style.css
	mkdir -p build/css
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

reallyclean: clean
	rm -f jquery-1.8.js
