#!/usr/bin/env python3

import argparse
import configparser
import json
import re
import sys


def get_string(conf, key, fallback=None):
    return conf.get(key, fallback=fallback)

def get_string_array(conf, key, fallback=None):
    string = get_string(conf, key)
    return fallback if string is None else re.split(r'[, ]+', string)

def get_bool(conf, key, fallback=None):
    return conf.getboolean(key, fallback=fallback)

def get_int(conf, key, fallback=None):
    return conf.getint(key, fallback=fallback)

def get_int_array(conf, key, fallback=None):
    array = get_string_array(conf, key)
    return fallback if array is None else [int(x) for x in array]


# Constant descriptors
constants = {
    # section name
    'APY': {
        # CONSTANT_NAME: (parser,)
        # CONSTANT_NAME: (parser, fallback)
        'HTML_URL': (get_string, "http://www.apertium.org"),
        'APY_URL': (get_string, "http://apy.projectjj.com"),

        'SUBTITLE': (get_string,),
        'SUBTITLE_COLOR': (get_string,),

        'ALLOWED_LANGS': (get_string_array,),
        'ALLOWED_VARIANTS': (get_string_array,),
        'ALLOWED_PAIRS': (get_string_array,),

        'ENABLED_MODES': (get_string_array, ["translation"]),
        'DEFAULT_MODE': (get_string, "translation"),

        'TRANSLATION_CHAINING': (get_bool, False),

        'DEFAULT_LOCALE': (get_string, "eng"),

        'SHOW_NAVBAR': (get_string, False),

        'PIWIK_SITEID': (get_string,),
        'PIWIK_URL': (get_string,),

        'LIST_REQUEST_CACHE_EXPIRY': (get_int, 24),
        'LANGUAGE_NAME_CACHE_EXPIRY': (get_int, 24),
        'LOCALIZATION_CACHE_EXPIRY': (get_int, 24),
        'AVAILABLE_LOCALES_CACHE_EXPIRY': (get_int, 24),
    },

    'PERSISTENCE': {
        'DEFAULT_EXPIRY_HOURS': (get_int,),
    },

    'TRANSLATOR': {
        'UPLOAD_FILE_SIZE_LIMIT': (get_int,),

        'TRANSLATION_LIST_BUTTONS': (get_int,),
        'TRANSLATION_LIST_WIDTH': (get_int,),
        'TRANSLATION_LIST_ROWS': (get_int,),
        'TRANSLATION_LIST_COLUMNS': (get_int,),
        'TRANSLATION_LISTS_BUFFER': (get_int,),

        'INSTANT_TRANSLATION_URL_DELAY': (get_int,),
        'INSTANT_TRANSLATION_PUNCTUATION_DELAY': (get_int,),
        'INSTANT_TRANSLATION_DELAY': (get_int,),
    },

    'UTIL': {
        'TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH': (get_int,),
        'BACK_TO_TOP_BUTTON_ACTIVATION_HEIGHT': (get_int,),
        'APY_REQUEST_URL_THRESHOLD_LENGTH': (get_int,),
        'DEFAULT_DEBOUNCE_DELAY': (get_int,),

        'INSTALLATION_NOTIFICATION_REQUESTS_BUFFER_LENGTH': (get_int,),
        'INSTALLATION_NOTIFICATION_INDIVIDUAL_DURATION_THRESHOLD': (get_int,),
        'INSTALLATION_NOTIFICATION_CUMULATIVE_DURATION_THRESHOLD': (get_int,),
        'INSTALLATION_NOTIFICATION_DURATION': (get_int,),
    },
}

# Some error checking
def check_config(conf, result):
    for section in conf.sections():
        if section == 'REPLACEMENTS':
            continue

        if section not in constants.keys():
            raise configparser.Error("\nUnknown section [%s]" % (section,))

        for constant, _ in conf.items(section):
            if constant not in constants[section].keys():
                raise configparser.Error("\nUnknown key in section [%s]: %s" % (section, constant))

    return True

def load_conf(filename_config, filename_custom):
    conf = configparser.ConfigParser(allow_no_value=True)
    conf.optionxform = str

    with open(filename_config, 'r') as f:
        conf.read_file(f)
    with open(filename_custom, 'r') as f:
        conf.read_file(f)

    result = {
        'REPLACEMENTS': {k: v for k, v in conf['REPLACEMENTS'].items()},
        # These are filled at various places by javascript:
        'LANGNAMES': None,
        'LOCALES': None,
        'PAIRS': None,
        'GENERATORS': None,
        'ANALYZERS': None,
        'TAGGERS': None
    }

    for section_name, section_desc in constants.items():
        for constant_name, constant_desc in section_desc.items():
            dtype, fallback, *_ = (*constant_desc, None)
            result[constant_name] = dtype(conf[section_name], constant_name, fallback)

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
    parser.add_argument('-C', '--custom', default='custom.conf', help='Customization file name (default: custom.conf)')
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
