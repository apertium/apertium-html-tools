#!/usr/bin/env python3

import argparse
import configparser
import json
import re
import sys


def get_string(conf, key):
    return conf.get(key)

def get_string_array(conf, key):
    string = get_string(conf, key)
    return None if string is None else re.split(r"[, ]+", string)

def get_bool(conf, key):
    return conf.getboolean(key)

def get_int(conf, key):
    return conf.getint(key)

def get_int_array(conf, key):
    array = get_string_array(conf, key)
    return None if array is None else [int(x) for x in array]


dtypes = {
    # section APY
    "HTML_URL": get_string,
    "APY_URL": get_string,

    "SUBTITLE": get_string,
    "SUBTITLE_COLOR": get_string,

    "ALLOWED_LANGS": get_string_array,
    "ALLOWED_VARIANTS": get_string_array,
    "ALLOWED_PAIRS": get_string_array,

    "ENABLED_MODES": get_string_array,
    "DEFAULT_MODE": get_string,

    "TRANSLATION_CHAINING": get_bool,

    "DEFAULT_LOCALE": get_string,

    "SHOW_NAVBAR": get_string,

    "PIWIK_SITEID": get_string,
    "PIWIK_URL": get_string,

    "LIST_REQUEST_CACHE_EXPIRY": get_int,
    "LANGUAGE_NAME_CACHE_EXPIRY": get_int,
    "LOCALIZATION_CACHE_EXPIRY": get_int,
    "AVAILABLE_LOCALES_CACHE_EXPIRY": get_int,

    # section PERSISTENCE
    "DEFAULT_EXPIRY_HOURS": get_int,

    # section TRANSLATOR
    "UPLOAD_FILE_SIZE_LIMIT": get_int,

    "TRANSLATION_LIST_BUTTONS": get_int,
    "TRANSLATION_LIST_WIDTH": get_int,
    "TRANSLATION_LIST_ROWS": get_int,
    "TRANSLATION_LIST_COLUMNS": get_int,
    "TRANSLATION_LISTS_BUFFER": get_int,

    "INSTANT_TRANSLATION_URL_DELAY": get_int,
    "INSTANT_TRANSLATION_PUNCTUATION_DELAY": get_int,
    "INSTANT_TRANSLATION_DELAY": get_int,

    # section UTIL
    "TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH": get_int,
    "BACK_TO_TOP_BUTTON_ACTIVATION_HEIGHT": get_int,
    "APY_REQUEST_URL_THRESHOLD_LENGTH": get_int,
    "DEFAULT_DEBOUNCE_DELAY": get_int,

    "INSTALLATION_NOTIFICATION_REQUESTS_BUFFER_LENGTH": get_int,
    "INSTALLATION_NOTIFICATION_INDIVIDUAL_DURATION_THRESHOLD": get_int,
    "INSTALLATION_NOTIFICATION_CUMULATIVE_DURATION_THRESHOLD": get_int,
    "INSTALLATION_NOTIFICATION_DURATION": get_int,
}


def check_config(conf, result):
    # Some error checking:
    for section in conf.sections():
        if section not in ['APY', 'PERSISTENCE', 'REPLACEMENTS', 'TRANSLATOR', 'UTIL']:
            raise configparser.Error("\nUnknown section [%s]" % (section,))

    # TODO: either remove or check for all sections
    apy_diff = set(k.lower() for k in conf['APY'].keys()) - set(k.lower() for k in result.keys())
    if apy_diff:
        raise configparser.Error("\nUnknown key(s) in section [APY]: %s" % (apy_diff,))

    return True

def load_conf(filename_config, filename_custom):
    conf = configparser.ConfigParser(allow_no_value=True)
    conf.optionxform = str

    with open(filename_config, 'r') as f:
        conf.read_file(f)
    with open(filename_custom, 'r') as f:
        conf.read_file(f)

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

    for section in conf.sections():
        if section == 'REPLACEMENTS':
            continue

        for key, value in conf.items(section):
            result[key] = dtypes[key](conf[section], key)

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
