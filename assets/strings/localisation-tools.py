#!/usr/bin/python3

from collections import OrderedDict
import argparse, json

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Manipulate localisation files')
    parser.add_argument('action', choices=['new', 'create', 'clean', 'sort', 'sort+clean', 'clean+sort'])
    parser.add_argument('codes', nargs='+', help='language codes for filename')
    parser.add_argument('-u', '--unavailableString', default='%%UNAVAILABLE%%', help='placeholder value for unavailable string')
    parser.add_argument('-c', '--canonicalFile', default='eng.json', help='canonical file for creation')
    parser.add_argument('-b', '--showBaseString', default=False, action='store_true', help='use strings from canonical file with unavailable string')
    args = parser.parse_args()
    args.actions = args.action.split('+')

    with open(args.canonicalFile) as f:
        canonicalStrings = json.loads(f.read(), object_pairs_hook=OrderedDict)

    for fname in args.codes:
        fname = '{}.json'.format(fname)
        if 'create' in args.actions or 'new' in args.actions:
            with open(fname, 'w+') as f:
                f.write(json.dumps(canonicalStrings, indent=4, sort_keys=False, ensure_ascii=False))
        if 'clean' in args.actions:
            with open(fname, 'r+') as f:
                strings = OrderedDict(filter(lambda x: x[0] in canonicalStrings.keys(), json.loads(f.read()).items()))
                for stringName in set(canonicalStrings.keys()) - set(strings.keys()):
                    strings[stringName] = args.unavailableString + (' ' + canonicalStrings[stringName] if args.showBaseString else '') 
                f.seek(0)
                f.write(json.dumps(strings, indent=4, sort_keys=False, ensure_ascii=False))
                f.truncate()
        if 'sort' in args.actions:
            with open(fname, 'r+') as f:
                strings = OrderedDict(json.loads(f.read()).items())
                strings = OrderedDict(sorted(strings.items(), key=lambda x: -1 if x[0] not in canonicalStrings.keys() else list(canonicalStrings.keys()).index(x[0])))
                f.seek(0)
                f.write(json.dumps(strings, indent=4, sort_keys=False, ensure_ascii=False))
                f.truncate()
                
