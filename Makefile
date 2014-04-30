# This (default) goal just cats stuff:
nojava: build/js/all.js build/css/min.css index.html index.debug.html localhtml
	cat build/js/all.js > build/js/min.js

# This goal actually minifies stuff:
min: \
	build/js/min.js \
	index.min.html \
	index.debug.html \
	build/css/min.css


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
	cat $(JSFILES) > $@

# minification:
compiler-latest.zip:
	curl http://dl.google.com/closure-compiler/$@ > $@
	touch $@

compiler.jar: compiler-latest.zip
	unzip -n $<
	touch $@

build/js/min.js: compiler.jar jquery-1.8.js $(JSFILES)
	mkdir -p build/js
	java -jar compiler.jar --js $(JSFILES) --js_output_file $@ --externs jquery-1.8.js


### HTML ###
index.debug.html: index.html.in debug-head.html
	sed -e '/@include_head@/r debug-head.html' -e '/@include_head@/d' $< > $@

# timestamp links, only double quotes supported :>
build/prod-head.html: prod-head.html build/js/all.js build/css/all.css
	ts=`date +%s`; sed "s/\(href\|src\)=\"\([^\"]*\)\"/\1=\"\2?$${ts}\"/" $< > $@

index.html: index.html.in build/prod-head.html
	sed -e '/@include_head@/r build/prod-head.html' -e '/@include_head@/d' $< > $@

# minification:
htmlcompressor.jar:
	curl https://htmlcompressor.googlecode.com/files/htmlcompressor-1.5.3.jar > $@
	touch $@

index.min.html: index.html htmlcompressor.jar
	java -jar htmlcompressor.jar -t html $< > $@


# HTML localisation
localhtml: \
	build/index.arg.html \
	build/index.ava.html \
	build/index.cat.html \
	build/index.eng.html \
	build/index.eus.html \
	build/index.fra.html \
	build/index.kaz.html \
	build/index.kir.html \
	build/index.kaa.html \
	build/index.nno.html \
	build/index.nob.html \
	build/index.por.html \
	build/index.ron.html \
	build/index.rus.html \
	build/index.sme.html \
	build/index.spa.html \
	build/index.tat.html


build/index.%.html: assets/strings/%.json index.html
	if ! ./localise-html.py index.html < $< > $@; then rm -f $@; false; fi


### CSS ###
build/css/all.css:  assets/css/bootstrap.css assets/css/style.css
	mkdir -p build/css
	cat $^ > $@

# minification:
build/css/min.css: build/css/all.css
	@echo $^
	@if test -e /usr/share/yui-compressor/yui-compressor.jar; then \
		java -jar /usr/share/yui-compressor/yui-compressor.jar -o $@ $^; \
	else \
		echo "yui-compressor not installed! Just concatenating $^"; \
		cat $^ > $@; \
	fi


### Clean ###
clean:
	rm -rf index.min.html index.html index.debug.html build/

reallyclean: clean
	rm -f htmlcompressor.jar compiler.jar compiler-latest.zip jquery-1.8.js
