#!/usr/bin/env python3

import json
import sys

if __name__ == '__main__':
    with open(sys.argv[1], 'r+') as f:
        strings = json.load(f)
        if '@metadata' in strings:
            strings['alpha2'] = strings['@metadata']['locale'][0]
            del strings['@metadata']
        f.seek(0)
        f.write(json.dumps(strings, ensure_ascii=False))
        f.truncate()
