all: \
	assets/js/min.js \
	index.min.html \
	assets/css/bootstrap.min.css \
	assets/css/style.min.css


### JS ###
JSFILES=assets/js/config.js \
	assets/js/util.js \
	assets/js/persistence.js \
	assets/js/localization.js \
	assets/js/translator.js \
	assets/js/analyzer.js \
	assets/js/generator.js \
	assets/js/sandbox.js \

jquery-1.8.js:
	curl https://closure-compiler.googlecode.com/git/contrib/externs/$@ > $@
	touch $@

compiler-latest.zip:
	curl http://dl.google.com/closure-compiler/$@ > $@
	touch $@

compiler.jar: compiler-latest.zip
	unzip -n $<
	touch $@

assets/js/min.js: compiler.jar jquery-1.8.js
	mkdir -p assets/minified
	java -jar compiler.jar --js $(JSFILES) --js_output_file $@ --externs jquery-1.8.js


### HTML ###
htmlcompressor.jar:
	curl https://htmlcompressor.googlecode.com/files/htmlcompressor-1.5.3.jar > $@
	touch $@

index.min.html: index.html htmlcompressor.jar
	java -jar htmlcompressor.jar -t html $< > $@


### CSS ###
# To minify CSS you need the YUI Compressor (http://yui.github.io/yuicompressor/)
# On Debian, install with
#     sudo apt-get install yui-compressor
%.min.css: %.css
	@echo $^
	@if test -e /usr/share/yui-compressor/yui-compressor.jar; then \
		java -jar /usr/share/yui-compressor/yui-compressor.jar -o $@ $^; \
	else \
		echo 'yui-compressor not installed! Not minifying @^'; \
	fi


### Clean ###
clean:
	rm -f assets/js/min.js index.min.html assets/css/bootstrap.min.css assets/css/style.min.css

reallyclean: clean
	rm -f htmlcompressor.jar compiler.jar compiler-latest.zip jquery-1.8.js
