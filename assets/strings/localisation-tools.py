#!/usr/bin/env python3

import argparse
import json
# import itertools
from collections import OrderedDict

# TODO: run Apertium to fill in placeholders if a fitting language pair is installed!

def dump_json(f, data):
    f.seek(0)
    f.write(json.dumps(data, indent=4, sort_keys=False, ensure_ascii=False, separators=(',', ': ')))
    f.write('\n')
    f.truncate()

def load_json(f):
    return json.loads(f.read(), object_pairs_hook=OrderedDict)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Manipulate localisation files', formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument('actions', nargs='+', help='new/create: creates a new localisation file\n'
                                                   'sort: sorts according to the sort order specified by the canonical file (-c)\n'
                                                   'clean: removes localisations that are not present in the canonical file (-c)\n'
                                                   'scrub: removes localisations marked unavailable\n'
                                                   'update: updates metadata stats\n'
                                                   'rebase: adds entries for missing localisations as specified by the placeholder file (-p)\n'
                                                   'cleanup: clean, scrub, update, sort\n'
                                                   'all: clean, scrub, rebase, update, and sort')
    # choices=['new', 'create'] + list(map(lambda x: '+'.join(x), itertools.chain.from_iterable([itertools.permutations(['clean', 'sort', 'update', 'rebase', 'scrub'], i) for i in range(1, 6)]))))
    parser.add_argument('codes', nargs='+', help='language codes for filenames')
    parser.add_argument('-m', '--metadataKey', default='@metadata')
    parser.add_argument('-c', '--canonicalFile', default='eng.json', help='canonical file for keys and sort order')
    parser.add_argument('-u', '--unavailableString', default='%%UNAVAILABLE%%', help='placeholder value for unavailable string (used by rebase action)')
    parser.add_argument('-b', '--hidePlaceholderString', default=False, action='store_false', help='don\'t use strings from placeholder file for unavailable strings (used by rebase action)')
    parser.add_argument('-p', '--placeholderFile', default='eng.json', help='placeholder file for missing values (used by rebase action)')

    args = parser.parse_args()

    actions = ['new', 'create', 'sort', 'clean', 'scrub', 'update', 'rebase', 'all', 'cleanup']
    args.codes = args.codes + list(filter(lambda x: x not in actions, args.actions))
    args.actions = list(filter(lambda x: x in actions, args.actions))

    if not args.actions:
        parser.error('the following arguments are required: actions')

    args.files = map(lambda x: x + '.json' if not x.endswith('.json') else x, args.codes)
    if not args.canonicalFile.endswith('.json'):
        args.canonicalFile += '.json'
    if not args.placeholderFile.endswith('.json'):
        args.placeholderFile += '.json'

    with open(args.canonicalFile) as f:
        canonicalStrings = load_json(f)
    with open(args.placeholderFile) as f:
        placeholderStrings = json.loads(f.read())

    for fname in args.files:
        defaultMetadata = OrderedDict([('authors', []), ('last-updated', ''), ('locale', [fname.replace('.json', '')]), ('completion', None), ('missing', [])])

        if len(set(['create', 'new']) & set(args.actions)) > 0:
            with open(fname, 'w+') as f:
                strings = []
                for stringName, _ in canonicalStrings.items():
                    if stringName != args.metadataKey:
                        if args.hidePlaceholderString:
                            strings.append((stringName, args.unavailableString))
                        else:
                            strings.append((stringName, args.unavailableString + (' ' + placeholderStrings[stringName] if stringName in placeholderStrings else '')))

                strings = OrderedDict(strings)
                strings[args.metadataKey] = defaultMetadata
                f.write(json.dumps(strings, indent=4, sort_keys=False, ensure_ascii=False, separators=(',', ': ')))
        if len(set(['clean', 'all', 'cleanup']) & set(args.actions)) > 0:
            with open(fname, 'r+') as f:
                strings = OrderedDict(filter(lambda x: x[0] in canonicalStrings.keys(), load_json(f).items()))
                dump_json(f, strings)
        if len(set(['scrub', 'all', 'cleanup']) & set(args.actions)) > 0:
            with open(fname, 'r+') as f:
                strings = OrderedDict(filter(lambda x: x[0] == args.metadataKey or not x[1].startswith(args.unavailableString), load_json(f).items()))
                dump_json(f, strings)
        if len(set(['rebase', 'all']) & set(args.actions)) > 0:
            with open(fname, 'r+') as f:
                strings = OrderedDict(filter(lambda x: x[0] == args.metadataKey or not x[1].startswith(args.unavailableString), load_json(f).items()))
                for stringName in set(canonicalStrings.keys()) - set(strings.keys()):
                    if stringName != args.metadataKey:
                        try:
                            strings[stringName] = args.unavailableString + (' ' + placeholderStrings[stringName] if not args.hidePlaceholderString else '')
                        except Exception:
                            strings[stringName] = args.unavailableString
                            print('String %s not available in %s for placeholder in %s' % (stringName, args.placeholderFile, fname))
                    else:
                        strings[args.metadataKey] = defaultMetadata

                for key in set(defaultMetadata.keys()) - set(strings[args.metadataKey].keys()):
                    strings[args.metadataKey][key] = defaultMetadata[key]

                dump_json(f, strings)
        if len(set(['update', 'all', 'cleanup']) & set(args.actions)) > 0:
            with open(fname, 'r+') as f:
                strings = load_json(f)
                if args.metadataKey not in strings:
                    strings[args.metadataKey] = defaultMetadata

                presentKeys, allKeys = set(dict(filter(lambda x: x[0] == args.metadataKey or not x[1].startswith(args.unavailableString), strings.items())).keys()), set(canonicalStrings.keys())
                presentValuesLength, allValuesLength = sum(map(len, map(lambda x: x[1], filter(lambda x: x[0] in presentKeys, strings.items())))), sum(map(len, canonicalStrings.values()))
                strings[args.metadataKey]['completion'] = '%3d%% %6.2f%%' % (100 - int(len(allKeys - presentKeys) / len(allKeys) * 100), presentValuesLength / allValuesLength * 100)
                strings[args.metadataKey]['missing'] = sorted(list(allKeys - presentKeys))
                dump_json(f, strings)
        if len(set(['sort', 'all', 'cleanup']) & set(args.actions)) > 0:
            with open(fname, 'r+') as f:
                strings = load_json(f)
                strings = OrderedDict(sorted(strings.items(), key=lambda x: -1 if x[0] not in canonicalStrings.keys() else list(canonicalStrings.keys()).index(x[0])))
                strings[args.metadataKey] = OrderedDict(sorted(strings[args.metadataKey].items(), key=lambda x: -1 if x[0] not in defaultMetadata.keys() else list(defaultMetadata.keys()).index(x[0])))
                dump_json(f, strings)
