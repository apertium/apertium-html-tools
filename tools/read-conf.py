#!/usr/bin/env python3

import argparse
import configparser
import json
import re
import sys


def get_value(conf, key, dtype):
    return {
        'string': get_string,
        'list': get_list,
        'bool': get_bool,
        'int': get_int
    }[dtype](conf, key)

def get_string(conf, key):
    return conf.get(key)

def get_list(conf, key):
    string = get_string(conf, key)
    return None if string is None else re.split(r"[, ]+", string)

def get_bool(conf, key):
    return conf.getboolean(key)

def get_int(conf, key):
    return conf.getint(key)


def check_config(conf, result):
    # Some error checking:
    for section in conf.sections():
        if section not in ['APY', 'REPLACEMENTS']:
            raise configparser.Error("\nUnknown section [%s]" % (section,))

    apy_diff = set(k.lower() for k in conf['APY'].keys()) - set(k.lower() for k in result.keys())
    if apy_diff:
        raise configparser.Error("\nUnknown key(s) in section [APY]: %s" % (apy_diff,))

    return True

def load_dtypes():
    dtypes = {}

    with open('tools/conf-dtypes.txt', 'r') as fields:
        lines = fields.readlines()
        lines = [line.strip() for line in lines]

        section = None

        for line in lines:
            if len(line) == 0:
                continue

            parts = line.split('|')
            parts = [part.strip() for part in parts]

            if len(parts) == 1:
                section = parts[0][1:-1]
                dtypes[section] = {}
            elif len(parts) == 2:
                key = parts[0]
                dtype = parts[1]
                dtypes[section][key] = dtype

    return dtypes

def load_conf(filename, filename_custom):
    conf = configparser.ConfigParser()

    with open(filename, 'r') as f:
        conf.read_file(f)
    with open(filename_custom, 'r') as f:
        conf.read_file(f)

    result = {
        # These are filled at various places by javascript:
        'LANGNAMES': None,
        'LOCALES': None,
        'PAIRS': None,
        'GENERATORS': None,
        'ANALYZERS': None,
        'TAGGERS': None
    }

    dtypes = load_dtypes()

    for section in conf.sections():
        for key, raw_value in conf.items(section):
            result[key] = get_value(conf[section], key, dtypes[section][key])

    check_config(conf, result)
    return result


def print_json(result, args):
    print(json.dumps(result))

def print_js(result, args):
    print("var config = %s;" % (json.dumps(result, indent=4, sort_keys=False, ensure_ascii=False),))

def print_keyval(result, args):
    print(result[args.key])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Load config, print stuff')
    parser.add_argument('-c', '--config', default='config.conf', help='Config file name (default: config.conf)')
    parser.add_argument('-C', '--custom', default='config-custom.conf', help='Config customization file name (default: config-custom.conf)')
    subparsers = parser.add_subparsers(help='Available actions:')

    parser_json = subparsers.add_parser('json', help='Print config as json')
    parser_json.set_defaults(func=print_json)

    parser_js = subparsers.add_parser('js', help='Print config as js (with "var config =" first)')
    parser_js.set_defaults(func=print_js)

    parser_get = subparsers.add_parser('get', help='Print a specific config value')
    parser_get.set_defaults(func=print_keyval)
    parser_get.add_argument('key', help='The key whose value you want to look up')

    args = parser.parse_args()

    if 'func' in args:
        result = load_conf(args.config, args.custom)
        args.func(result, args)
    else:
        # TODO: isn't there some built-in argparse way of saying we
        # require at least one subparser argument?
        parser.print_usage()
        sys.exit(2)
