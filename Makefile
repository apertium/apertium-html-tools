all: build/js/min.js build/css/min.css index.html index.debug.html localhtml

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

### HTML ###
index.debug.html: index.html.in debug-head.html
	sed -e '/@include_head@/r debug-head.html' -e '/@include_head@/d' $< > $@

# timestamp links, only double quotes supported :>
build/prod-head.html: prod-head.html build/js/all.js build/css/all.css
	ts=`date +%s`; sed "s/\(href\|src\)=\"\([^\"]*\)\"/\1=\"\2?$${ts}\"/" $< > $@

index.html: index.html.in build/prod-head.html build/l10n-rel.html
	sed -e '/@include_head@/r build/prod-head.html' -e '/@include_head@/r build/l10n-rel.html' -e '/@include_head@/d' $< > $@


## HTML localisation
# JSON-parsing-regex ahoy:
localhtml: $(shell sed -n 's%^[^"]*"\([^"]*\)":.*%build/index.\1.html% p' assets/strings/locales.json)

#<link rel="alternate" hreflang="[lang]" href="http://apertium.org/build/index.[lang].html" />
build/l10n-rel.html: assets/strings/locales.json
	sed -n 's%^[^"]*"\([^"]*\)":.*%<link rel="alternate" hreflang="\1" href="/build/index.\1.html"/>% p' $^ > $@

build/index.%.html: assets/strings/%.json index.html
	if ! ./localise-html.py index.html < $< > $@; then rm -f $@; false; fi


### CSS ###
build/css/all.css:  assets/css/bootstrap.css assets/css/style.css
	mkdir -p build/css
	cat $^ > $@

build/css/min.css: build/css/all.css
	cp $^ $@

### Clean ###
clean:
	rm -rf index.html index.debug.html build/

reallyclean: clean
	rm -f jquery-1.8.js
