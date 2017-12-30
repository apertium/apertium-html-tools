#!/usr/bin/env python3

import sys

try:
    from jsmin import jsmin
except ImportError:
    print("jsmin not installed, skipping JS minification")
    sys.exit(0)

path = sys.argv[1]

with open(path, 'r') as f:
    input_data = f.read()

output_data = jsmin(input_data)

with open(path, 'w') as f:
    f.write(output_data)
