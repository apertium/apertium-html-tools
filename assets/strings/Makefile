all: cleanup update-readme

cleanup: $(shell find . -regextype sed -regex ".*/[a-z]\{3\}\.json" -printf "%f ")
	./localisation-tools.py cleanup $?

update-readme: README.md
	sed -n "/<!--table-->/q;p" $^ > $^.tmp
	echo "<!--table-->" >> $^.tmp
	./progresstable.sh md >> $^.tmp
	mv $^.tmp $^
