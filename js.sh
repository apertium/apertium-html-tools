#!/bin/bash

root='./assets/js/'
files=('config.js' 'util.js' 'persistence.js' 'localization.js' 'translator.js' 'analyzer.js' 'generator.js' 'sandbox.js')

jquery_externs='https://closure-compiler.googlecode.com/git/contrib/externs/jquery-1.8.js'
closure_compiler='http://dl.google.com/closure-compiler/compiler-latest.zip'

minfile=$root
files_str=''
for file in ${files[@]}
	do
		md5=`md5sum $root$file | awk '{ print $1 }'`
		minfile=$minfile${md5:0:5}
		files_str=$files_str' '$(readlink -f $root$file)
done

minfile=$(readlink -f $minfile'.js')

if [ -f $minfile ]
	then
		while read line
			do
				echo $line
		done < $minfile
	else
		if [ ! -f `basename $jquery_externs` ]
			then
				curl $jquery_externs > `basename $jquery_externs`
		fi

		if [ ! -f 'compiler.jar' ]
			then
				curl $closure_compiler > compiler.zip
				unzip -n compiler.zip
		fi

		touch $minfile
		java -jar compiler.jar --js $files_str --js_output_file $minfile --externs `basename $jquery_externs`

		while read line
			do
				echo $line
		done < $minfile
fi