#!/usr/bin/python3

from collections import OrderedDict
import argparse, json

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Manipulate localisation files')
    parser.add_argument('action', choices=['new', 'create', 'clean', 'sort', 'sort+clean', 'clean+sort'])
    parser.add_argument('codes', nargs='+', help='language codes for filename')
    parser.add_argument('-u', '--unavailableString', default='%%UNAVAILABLE%%', help='placeholder value for unavailable string')
    parser.add_argument('-c', '--canonicalFile', default='eng.json', help='canonical file for keys and sort order')
    parser.add_argument('-p', '--placeholderFile', default='eng.json', help='placeholder file for missing values')
    parser.add_argument('-b', '--showPlaceholderString', default=False, action='store_true', help='use strings from replacement file with unavailable strings')
    args = parser.parse_args()
    args.actions = args.action.split('+')
    
    if not args.canonicalFile.endswith('.json'):
        args.canonicalFile += '.json'
    if not args.placeholderFile.endswith('.json'):
        args.placeholderFile += '.json'

    with open(args.canonicalFile) as f:
        canonicalStrings = json.loads(f.read(), object_pairs_hook=OrderedDict)
    with open(args.placeholderFile) as f:
        placeholderStrings = json.loads(f.read())

    for fname in args.codes:
        fname = '{}.json'.format(fname)
        if 'create' in args.actions or 'new' in args.actions:
            with open(fname, 'w+') as f:
                strings = OrderedDict(map(lambda x: (x[0], args.unavailableString + (' ' + placeholderStrings[x[0]] if x[0] in placeholderStrings else '') if args.showPlaceholderString else ''), canonicalStrings.items()))
                f.write(json.dumps(strings, indent=4, sort_keys=False, ensure_ascii=False))
        if 'clean' in args.actions:
            with open(fname, 'r+') as f:
                strings = OrderedDict(filter(lambda x: x[0] in canonicalStrings.keys(), json.loads(f.read()).items()))
                for stringName in set(canonicalStrings.keys()) - set(strings.keys()):
                    try:
                        strings[stringName] = args.unavailableString + (' ' + placeholderStrings[stringName] if args.showPlaceholderString else '')
                    except Exception:
                        strings[stringName] = args.unavailableString
                        print('String %s not available in %s for placeholder in %s' % (stringName, args.placeholderFile, fname))
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
                
