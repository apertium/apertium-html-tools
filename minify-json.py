#!/usr/bin/env python3

import json, sys

if __name__ == "__main__":
    with open(sys.argv[1], 'r+') as f:
        strings = json.loads(f.read())
        if '@metadata' in strings:
            del strings['@metadata']
        f.seek(0)
        f.write(json.dumps(strings, ensure_ascii=False))
        f.truncate()
