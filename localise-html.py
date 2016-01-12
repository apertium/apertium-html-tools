#!/usr/bin/env python3

# Usage: ./localise-html.py -c config.conf index.html < assets/strings/bar.json > build/index.bar.html

read_conf = __import__('read-conf')
import argparse
from html.parser import HTMLParser
from sys import stdin, stderr, argv
from os import listdir, path
import json, re

rtl_languages = ['heb', 'ara', 'pes', 'urd', 'uig']

class DataTextHTMLParser(HTMLParser):
    data_text = None
    output = []

    def p(self, value):
        self.output.append(value)

    def run_replacements(self, text):
        for k in self.replacements:
            text = text.replace('{{%s}}'%(k,), self.replacements[k])
            return text

    def handle_startendtag(self, tag, attrs):
        # We don't handle data-text on tags like <img/> and <b/>, but
        # that doesn't quite make sense either
        if tag == "link" and ('id', 'rtlStylesheet') in attrs:
            text = self.get_starttag_text()
            self.p(text[:text.index('/>')] + ('enabled' if self.localename in rtl_languages else 'disabled' ) + ' />')
            print(text, text[:text.index('/>')])
        else:
            self.p(self.get_starttag_text())

    def handle_starttag(self, tag, attrs):
        """This is where localisation happens"""
        attr_localization = list(filter(lambda x: x[0] == "data-textattr", attrs))
        if not attr_localization:
            for attr in attrs:
                if attr[0] == "data-text" and attr[1] in self.locale:
                    text = self.locale[attr[1]]
                    if text.startswith("%%UNAVAILABLE"):
                        text = self.fallback_locale[attr[1]]
                    self.data_text = self.run_replacements(text)

            """This is where html's dir attribute is set to ltr or rtl"""
            if tag == "html":
                text = self.get_starttag_text()
                self.p('<html dir="%s"' % ('rtl' if self.localename in rtl_languages else 'ltr') + text[text.index('html') + 4:])
            else:
                self.p(self.get_starttag_text())
        else:
            attr_name, attr_value = attr_localization[0][1], None
            for attr in attrs:
                if attr[0] == "data-text" and attr[1] in self.locale:
                    text = self.locale[attr[1]]
                    if text.startswith("%%UNAVAILABLE"):
                        text = self.fallback_locale[attr[1]]
                    attr_value = self.run_replacements(text)

            tag_text = self.get_starttag_text()
            if attr_value:
                tag_text = re.sub(r'''%s=["'].*?["']''' % attr_name, '%s="%s"' % (attr_name, attr_value), tag_text)
            self.p(tag_text)

    def handle_endtag(self, tag):
        if self.data_text:
            self.p(self.data_text)
            self.data_text = None
        if tag == "head":
            self.p("    <script type=\"text/javascript\">config.LANGNAMES['%s']=%s</script>\n    " % (
                self.localename,
                self.locale["@langNames"]))
        self.p("</%s>" % (tag,))
    def handle_data(self, data):
        if self.data_text:
            self.p(self.data_text)
            self.data_text = None
        else:
            self.p(data)
    def handle_comment(self, data):
        self.p("<!--%s-->" %(data,))
    def handle_entityref(self, name):
        self.p("&%s;"%(name,))
    def handle_charref(self, name):
        self.p("&#%s;" % (name,))
    def handle_decl(self, data):
        self.p("<!%s>" % (data,))
    def handle_pi(self, data):
        self.p("<?%s>" % (data,))

def run(html_path, json_path, out_path, conf_path, fallback_path):
    try:
        # convert_charrefs will default to True in py3.5:
        parser = DataTextHTMLParser(convert_charrefs=False)
    except TypeError:
        # convert_charrefs was added in py3.4:
        parser = DataTextHTMLParser()
    parser.locale = json.loads("".join(open(json_path).readlines()))
    parser.localename = path.basename(json_path).replace('.json', '')
    parser.fallback_locale = json.loads("".join(open(fallback_path).readlines()))
    parser.replacements = read_conf.load_conf(conf_path)['REPLACEMENTS']
    parser.feed("".join(open(html_path).readlines()))
    with open(out_path, 'w') as out:
        out.write("".join(parser.output))

if __name__ == "__main__":
    argparser = argparse.ArgumentParser(description='Localise an HTML file using a json file from stdin')
    argparser.add_argument('template', help='HTML file to localise')
    argparser.add_argument('localisations', help='JSON file to use to localise')
    argparser.add_argument('output', help='Output file')
    argparser.add_argument('-c', '--config', default='config.conf', help='Config file name (default: config.conf)')
    argparser.add_argument('-f', '--fallback', default='build/strings/eng.json', help='Fallback JSON file to use when main one gives no answer')

    args = argparser.parse_args()

    run(args.template, args.localisations, args.output, args.config, args.fallback)
