#!/usr/bin/env python3

import configparser, json, re, argparse, sys


def getlist(conf_section, key, fallback=None):
    string = conf_section.get(key, fallback=fallback)
    if string:
        return re.split(r"[, ]+", string)
    else:
        return fallback

def check_config(conf, result):
    # Some error checking:
    for section in conf.sections():
        if not section in ['APY', 'REPLACEMENTS']:
            raise configparser.Error("\nUnknown section [%s]" %(section,))

    apy_diff = set(k.lower() for k in conf['APY'].keys()) - set(k.lower() for k in result.keys())
    if apy_diff:
        raise configparser.Error("\nUnknown key(s) in section [APY]: %s" %(apy_diff,))

    return True

def load_conf(filename):
    conf = configparser.ConfigParser()
    with open(filename, 'r') as f:
        conf.read_file(f)
    conf_APY = conf['APY']
    result = {
        'HTML_URL'                       : conf_APY.get('HTML_URL', fallback="http://www.apertium.org"),
        'APY_URL'                        : conf_APY.get('APY_URL', fallback="http://apy.projectjj.com"),

        'ALLOWED_LANGS'                  : getlist(conf_APY, 'ALLOWED_LANGS', fallback=None),
        'ALLOWED_VARIANTS'               : getlist(conf_APY, 'ALLOWED_VARIANTS', fallback=None),

        'ENABLED_MODES'                  : getlist(conf_APY, 'ENABLED_MODES', fallback=["translation"]),
        'DEFAULT_MODE'                   : conf_APY.get('DEFAULT_MODE', fallback="translation"),

        'SHOW_NAVBAR'                    : conf_APY.getboolean('SHOW_NAVBAR', fallback=False),

        'PIWIK_SITEID'                   : conf_APY.get('PIWIK_SITEID', fallback=None),
        'PIWIK_URL'                      : conf_APY.get('PIWIK_URL', fallback=None),

        'LIST_REQUEST_CACHE_EXPIRY'      : conf_APY.getint('LIST_REQUEST_CACHE_EXPIRY', fallback=24),
        'LANGUAGE_NAME_CACHE_EXPIRY'     : conf_APY.getint('LANGUAGE_NAME_CACHE_EXPIRY', fallback=24),
        'LOCALIZATION_CACHE_EXPIRY'      : conf_APY.getint('LOCALIZATION_CACHE_EXPIRY', fallback=24),
        'AVAILABLE_LOCALES_CACHE_EXPIRY' : conf_APY.getint('AVAILABLE_LOCALES_CACHE_EXPIRY', fallback=24),

        'REPLACEMENTS'                   : { k:v for k,v in conf['REPLACEMENTS'].items() },
    }
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
