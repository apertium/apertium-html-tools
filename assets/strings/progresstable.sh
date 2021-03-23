#!/bin/bash

completion=`grep "completion" *.json | sort -nrk1.33,1.35 -nrk1.38,1.43`

if [[ $1 == "md" ]]; then
    echo "$completion" | awk -F '"' 'BEGIN {print "| code | CBE* | CBC** |\n|------|------|-------|" } {sub(/\..*$/, "", $1); split($4, s, " "); print "| " $1 "  | " s[1] " | " s[2] " |"} END { print "\n\\*CBE: completion by entries<br>\n\\**CBC: completion by characters (i.e., ratio of characters to English ~source)"}'
else
    echo "$completion" | awk -F '"' 'BEGIN {print "{| class=\"wikitable sortable\"\n|-\n!|code\n!|CBE*\n!|CBC**" } {sub(/\..*$/, "", $1); split($4, s, " "); print "|-\n|| " $1 " || " s[1] " || " s[2]} END { print "|}\n\n&nbsp;*CBE: completion by entries <br>\n&nbsp;**CBC: completion by characters (i.e., ratio of characters to English ~source)"}'
fi
