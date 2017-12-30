#!/usr/bin/env python3

import sys

try:
    from csscompressor import compress
except ImportError:
    print("csscompressor not installed, skipping CSS minification")
    sys.exit(0)

path = sys.argv[1]

with open(path, 'r') as f:
    input_data = f.read()

output_data = compress(input_data)

with open(path, 'w') as f:
    f.write(output_data)
