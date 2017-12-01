#!/usr/bin/env python3

import argparse
import configparser
import json
import re
import sys


def get_value(conf_APY, key, dtype, fallback=None):
    return {
        'string': get_string,
        'list': get_list,
        'bool': get_bool,
        'int': get_int
    }[dtype](conf_APY, key, fallback)

def get_string(conf_APY, key, fallback=None):
    return conf_APY.get(key, fallback=fallback)

def get_list(conf_APY, key, fallback=None):
    string = get_string(conf_APY, key, fallback)
    return None if string is None else re.split(r"[, ]+", string)

def get_bool(conf_APY, key, fallback=None):
    fallback = False if fallback is None else bool(fallback)
    return conf_APY.getboolean(key, fallback=fallback)

def get_int(conf_APY, key, fallback=None):
    fallback = 0 if fallback is None else int(fallback)
    return conf_APY.getint(key, fallback=fallback)

def check_config(conf, result):
    # Some error checking:
    for section in conf.sections():
        if section not in ['APY', 'REPLACEMENTS']:
            raise configparser.Error("\nUnknown section [%s]" % (section,))

    apy_diff = set(k.lower() for k in conf['APY'].keys()) - set(k.lower() for k in result.keys())
    if apy_diff:
        raise configparser.Error("\nUnknown key(s) in section [APY]: %s" % (apy_diff,))

    return True

def load_conf(filename):
    conf = configparser.ConfigParser()
    with open(filename, 'r') as f:
        conf.read_file(f)
    conf_APY = conf['APY']
    result = {
        'REPLACEMENTS'                   : {k: v for k, v in conf['REPLACEMENTS'].items()},
        # These are filled at various places by javascript:
        'LANGNAMES': None,
        'LOCALES': None,
        'PAIRS': None,
        'GENERATORS': None,
        'ANALYZERS': None,
        'TAGGERS': None
    }

    with open('tools/conf-fields.txt', 'r') as fields:
        lines = fields.readlines()
        lines = [line.strip() for line in lines]

        for line in lines:
            if len(line) == 0:
                continue

            parts = line.split('|', 2)
            parts = [part.strip() for part in parts]

            key = parts[0]
            dtype = parts[1]

            if len(parts) == 3:
                fallback = parts[2]
                result[key] = get_value(conf_APY, key, dtype, fallback)
            else:
                result[key] = get_value(conf_APY, key, dtype)

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
    subparsers = parser.add_subparsers(help='Available actions:')

    parser_json = subparsers.add_parser('json', help='Print config as json')
    parser_json.set_defaults(func=print_json)

    parser_js = subparsers.add_parser('js', help='Print config as js (with "var config =" first)')
    parser_js.set_defaults(func=print_js)

    parser_get = subparsers.add_parser('get', help='Print a specific config value')
    parser_get.set_defaults(func=print_keyval)
    parser_get.add_argument('key', help='The key whose value you want to look up')

    args = parser.parse_args()

    # result = load_conf(args.config)
    # args.func(result, args)
    if 'func' in args:
        result = load_conf(args.config)
        args.func(result, args)
    else:
        # TODO: isn't there some built-in argparse way of saying we
        # require at least one subparser argument?
        parser.print_usage()
        sys.exit(2)
