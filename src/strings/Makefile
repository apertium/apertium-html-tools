all: cleanup update-readme

cleanup: $(shell find . -name '*.json' -not -path './pos/*' | egrep '/[a-z]{3}\.json')
	./localisation-tools.py cleanup $?

update-readme: README.md
	sed -n "/<!--table-->/q;p" $^ > $^.tmp
	echo "<!--table-->" >> $^.tmp
	./progresstable.sh md >> $^.tmp
	mv $^.tmp $^

test: README.md
	git diff --exit-code .
