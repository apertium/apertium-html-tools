all: js css html fonts build/sitemap.xml build/strings/locales.json localhtml images
debug: debugjs debugcss build/index.debug.html build/not-found.html fonts build/js/compat.js build/js/jquery.min.js build/js/bootstrap.min.js build/sitemap.xml build/strings/locales.json build/index.eng.html build/strings/eng.json images

js: build/js/min.js build/js/compat.js build/js/jquery.min.js build/js/bootstrap.min.js debugjs
debugjs: build/js/jquery.jsonp-2.4.0.min.js build/js/config.js build/js/util.js build/js/persistence.js build/js/caching.js build/js/localization.js build/js/translator.js build/js/analyzer.js build/js/generator.js build/js/sandbox.js
css: build/css/min.css build/css/font-awesome.min.css build/css/bootstrap-rtl.min.css debugcss
debugcss: build/css/bootstrap.css build/css/style.css
html: build/index.html build/index.debug.html build/not-found.html
fonts: build/fonts/fontawesome-webfont.woff build/fonts/fontawesome-webfont.ttf build/fonts/fontawesome-webfont.svg build/fonts/fontawesome-webfont.eot

# Note: the min.{js,css} are equal to all.{js,css}; minification gives
# negligible improvements over just enabling gzip in the server, and
# brings with it lots of dependencies and a more complicated build.


### Directories ###
%/.d:
	test -d $(@D) || mkdir -p $(@D)
	touch $@

# Don't autoremove
.PRECIOUS: build/.d build/js/.d build/css/.d build/strings/.d


### JS ###
JSFILES= \
	assets/js/jquery.jsonp-2.4.0.min.js \
	assets/js/config.js \
	build/js/locales.js \
	build/js/listrequests.js \
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

build/js/listrequests.js: config.conf read-conf.py build/js/.d
	printf "config.PAIRS = " > $@
	curl -Ss "$(shell ./read-conf.py -c $< get APY_URL)/list?q=pairs" >> $@ || ( rm $@; false; )
	echo ";" >> $@
	printf "config.GENERATORS = " >> $@
	curl -Ss "$(shell ./read-conf.py -c $< get APY_URL)/list?q=generators" >> $@ || ( rm $@; false; )
	echo ";" >> $@
	printf "config.ANALYZERS = " >> $@
	curl -Ss "$(shell ./read-conf.py -c $< get APY_URL)/list?q=analyzers" >> $@ || ( rm $@; false; )
	echo ";" >> $@
	printf "config.TAGGERS = " >> $@
	curl -Ss "$(shell ./read-conf.py -c $< get APY_URL)/list?q=taggers" >> $@ || ( rm $@; false; )
	echo ";" >> $@

build/js/all.js: $(JSFILES) build/js/.d
	@awk '/\xEF\xBB\xBF/{print "\nERROR: Byte Order Mark found in "FILENAME"\n"; exit(1)}' $(JSFILES)
	cat $(JSFILES) > $@

build/js/min.js: build/js/all.js
	cp $< $@

build/js/compat.js: assets/js/compat.js build/js/.d
	cp $< $@

build/js/jquery.min.js: build/js/.d
	curl -Ss 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js' -o $@

build/js/bootstrap.min.js: build/js/.d
	curl -Ss 'http://netdna.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js' -o $@

build/js/%.js: assets/js/%.js build/js/.d
	cp $< $@


### HTML ###
build/index.debug.html: index.html.in debug-head.html build/l10n-rel.html build/.PIWIK_URL build/.PIWIK_SITEID build/strings/eng.json config.conf read-conf.py localise-html.py build/.d
	sed -e '/@include_head@/r debug-head.html' -e '/@include_head@/r build/l10n-rel.html' -e '/@include_head@/d' -e "s%@include_piwik_url@%$(shell cat build/.PIWIK_URL)%" -e "s%@include_piwik_siteid@%$(shell cat build/.PIWIK_SITEID)%" $< > $@
	./localise-html.py -c config.conf $@ build/strings/eng.json $@

# timestamp links, only double quotes supported :>
build/prod-head.html: prod-head.html build/js/all.js build/css/all.css
	ts=`date +%s`; sed "s/\(href\|src\)=\"\([^\"]*\)\"/\1=\"\2?$${ts}\"/" $< > $@

build/.PIWIK_URL: config.conf read-conf.py build/.d
	./read-conf.py -c $< get PIWIK_URL > $@
build/.PIWIK_SITEID: config.conf read-conf.py build/.d
	./read-conf.py -c $< get PIWIK_SITEID > $@

build/index.localiseme.html: index.html.in build/prod-head.html build/l10n-rel.html build/.PIWIK_URL build/.PIWIK_SITEID
	sed -e '/@include_head@/r build/prod-head.html' -e '/@include_head@/r build/l10n-rel.html' -e '/@include_head@/d' -e "s%@include_piwik_url@%$(shell cat build/.PIWIK_URL)%" -e "s%@include_piwik_siteid@%$(shell cat build/.PIWIK_SITEID)%" $< > $@


## HTML localisation
# JSON-parsing-regex ahoy:
localhtml: $(shell sed -n 's%^[^"]*"\([^"]*\)":.*%build/index.\1.html build/strings/\1.json% p' assets/strings/locales.json)


# hreflang requires iso639-1 :/ Fight ugly with ugly:
build/l10n-rel.html: assets/strings/locales.json isobork build/.d
	awk 'BEGIN{while(getline<"isobork")i[$$1]=$$2} /:/{sub(/^[^"]*"/,""); sub(/".*/,""); borkd=i[$$0]; if(!borkd)borkd=$$0; print "<link rel=\"alternate\" hreflang=\""borkd"\" href=\"index."$$0".html\">"}' $^ > $@

build/index.%.html: build/strings/%.json build/index.localiseme.html config.conf read-conf.py localise-html.py
	./localise-html.py -c config.conf build/index.localiseme.html $< $@

build/index.html: build/index.eng.html
	cp $^ $@

build/not-found.html: build/index.html not-found.html
	sed -e '/<!-- Not found warning -->/r not-found.html' $< > $@

build/strings/%.json: assets/strings/%.json config.conf read-conf.py minify-json.py build/strings/.d
	@printf '    "@langNames": ' > $@.tmp
	curl -Ss "$(shell ./read-conf.py -c config.conf get APY_URL)/listLanguageNames?locale=$*" >> $@.tmp
	@echo ',' >> $@.tmp
	@sed "0,/{/ s/{/{\n/" $< | sed "1r $@.tmp" > $@
	./minify-json.py $@
	@rm $@.tmp
# the first sed to ensure inserting after line 1 is unproblematic

build/strings/locales.json: assets/strings/locales.json build/strings/.d
	cp $< $@


## Sitemap
build/.HTML_URL: config.conf read-conf.py build/.d
	./read-conf.py -c $< get HTML_URL > $@
build/sitemap.xml: sitemap.xml.in build/l10n-rel.html build/.HTML_URL
	sed -e 's%^<link%<xhtml:link%' -e "s%href=\"%&$(shell cat build/.HTML_URL)/%" build/l10n-rel.html > build/l10n-rel.html.tmp
	sed -e "s%@include_url@%$(shell cat build/.HTML_URL)%" -e '/@include_linkrel@/r build/l10n-rel.html.tmp' -e '/@include_linkrel@/d' $< > $@
	rm -f build/l10n-rel.html.tmp


# TODO: is there a way to have prerequisites of _variables_? (could do away with the intermediate file)
.INTERMEDIATE: build/.HTML_URL build/.PIWIK_SITEID build/.PIWIK_URL


### CSS ###

THEMES= cerulean cosmo cyborg darkly journal lumen paper readable sandstone simplex slate spacelab superhero united yeti

$(THEMES): % : all build/css/bootstrap.%.css build/css/.d

theme = $(filter $(THEMES), $(MAKECMDGOALS))

build/css/bootstrap.%.css: build/css/.d
	curl -Ss 'http://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/$*/bootstrap.min.css' -o $@

build/css/all.css: $(if $(theme), build/css/bootstrap.$(theme).css, assets/css/bootstrap.css) build/css/style.css build/css/.d
	cat $^ > $@

build/css/min.css: build/css/all.css
	cp $< $@

build/css/style.css: assets/css/style.css $(if $(theme), assets/css/themes/style.$(theme).css, ) build/css/.d
	cat $^ > $@

build/css/font-awesome.min.css: build/css/.d
	curl -Ss 'http://netdna.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css' -o $@

build/css/bootstrap-rtl.min.css: build/css/.d
	curl -Ss 'http://cdnjs.cloudflare.com/ajax/libs/bootstrap-rtl/3.2.0-rc2/css/bootstrap-rtl.min.css' -o $@

build/css/%.css: assets/css/%.css build/css/.d
	cp $< $@


### Fonts ###
build/fonts/fontawesome-webfont.woff: build/fonts/.d
	curl -Ss "http://netdna.bootstrapcdn.com/font-awesome/4.5.0/fonts/fontawesome-webfont.woff" -o $@

build/fonts/fontawesome-webfont.ttf: build/fonts/.d
	curl -Ss "http://netdna.bootstrapcdn.com/font-awesome/4.5.0/fonts/fontawesome-webfont.ttf" -o $@

build/fonts/fontawesome-webfont.svg: build/fonts/.d
	curl -Ss 'http://netdna.bootstrapcdn.com/font-awesome/4.5.0/fonts/fontawesome-webfont.svg' -o $@

build/fonts/fontawesome-webfont.eot: build/fonts/.d
	curl -Ss 'http://netdna.bootstrapcdn.com/font-awesome/4.5.0/fonts/fontawesome-webfont.eot' -o $@


### Images ###
# Images just copied over
IMAGES_ASSETS=$(shell find assets/img -path '*/.svn' -prune -o -type f -print)
IMAGES_BUILD=$(patsubst assets/%, build/%, $(IMAGES_ASSETS))

build/img/%: assets/img/%
	@mkdir -p $(@D)
	cp $< $@

images: $(IMAGES_BUILD)

### Test server ###
server:
	exo-open "http://localhost:8082"
	( cd build; python3 -m http.server 8082 )


### Clean ###
clean:
	rm -rf build/
