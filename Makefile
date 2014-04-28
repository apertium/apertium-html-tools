# This (default) goal just cats stuff:
nojava: build/js/all.js build/css/min.css index.html index.debug.html
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

build/js/min.js: compiler.jar jquery-1.8.js
	java -jar compiler.jar --js $(JSFILES) --js_output_file $@ --externs jquery-1.8.js


### HTML ###
index.debug.html: index.html.in debug-head.html
	sed -e '/@include_head@/r debug-head.html' -e '/@include_head@/d' $< > $@

index.html: index.html.in prod-head.html
	sed -e '/@include_head@/r  prod-head.html' -e '/@include_head@/d' $< > $@

# minification:
htmlcompressor.jar:
	curl https://htmlcompressor.googlecode.com/files/htmlcompressor-1.5.3.jar > $@
	touch $@

index.min.html: index.html htmlcompressor.jar
	java -jar htmlcompressor.jar -t html $< > $@


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
