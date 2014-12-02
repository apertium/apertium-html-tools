#!/bin/bash

./localisation-tools.py cleanup `find . -regextype sed -regex ".*/[a-z]\{3\}\.json" -printf "%f "`
