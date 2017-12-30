#!/usr/bin/env python3

from csscompressor import compress
import sys

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r') as f:
    input_data = f.read()

output_data = compress(input_data)

with open(output_file, 'w') as f:
    f.write(output_data)
