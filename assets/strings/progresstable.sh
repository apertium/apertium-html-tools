#!/bin/bash

grep "completion" *.json | sort -nrk1.33,1.35 -nrk1.38,1.43 | awk -F '"' 'BEGIN {print "{| class=\"wikitable sortable\"\n|-\n!|code\n!|CBE*\n!|CBC**" } {sub(/\..*$/, "", $1); split($4, s, " "); print "|-\n|| " $1 " || " s[1] " || " s[2]} END { print "|}\n\n&nbsp;*CBE: completion by entries <br>\n&nbsp;**CBC: completion by characters (i.e., ratio of characters to English ~source)"}'
