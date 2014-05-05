#!/usr/bin/python3

# Usage: ./localise-html.py index.html < assets/strings/bar.json > build/index.bar.html

# TODO: REPLACEMENTS from config.js

from html.parser import HTMLParser
from sys import stdin, stderr, argv
from os import listdir
import json

def p(*value):
    """Print with no newline"""
    print(*value, end='')

class DataTextHTMLParser(HTMLParser):
    data_text = None
    def handle_startendtag(self, tag, attrs):
        # We don't handle data-text on tags like <img/> and <b/>, but
        # that doesn't quite make sense either
        p(self.get_starttag_text())
    def handle_starttag(self, tag, attrs):
        for attr in attrs:
            if attr[0]=="data-text" and attr[1] in self.locale:
                text = self.locale[attr[1]]
                if not text.startswith("%%UNAVAILABLE"):
                    self.data_text = text
        p(self.get_starttag_text())
    def handle_endtag(self, tag):
        if self.data_text:
            p(self.data_text)
            self.data_text = None
        p("</%s>" % (tag,))
    def handle_data(self, data):
        if self.data_text:
            p(self.data_text)
            self.data_text = None
        else:
            p(data)
    def handle_comment(self, data):
        p("<!--%s-->" %(data,))
    def handle_entityref(self, name):
        p("&%s;"%(name,))
    def handle_charref(self, name):
        p("&#%s;" % (name,))
    def handle_decl(self, data):
        p("<!%s>" % (data,))
    def handle_pi(self, data):
        p("<?%s>" % (data,))

def run():
    try:
        # convert_charrefs will default to True in py3.5:
        parser = DataTextHTMLParser(convert_charrefs=False)
    except TypeError:
        # convert_charrefs was added in py3.4:
        parser = DataTextHTMLParser()
    locale_str = ""
    for line in stdin:
        locale_str += line
    parser.locale = json.loads("".join(locale_str))
    parser.feed("".join(open(argv[1]).readlines()))

run()
