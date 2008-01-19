#!/usr/bin/env python
# coding=utf-8
# -*- encoding: utf-8 -*-

import os
import os.path as path
import re
import sys
import cStringIO
import pprint
from itertools import izip
from subprocess import Popen, PIPE

# In order to use this script, you need to install 4Suite's cDomlette.
from Ft.Xml.Domlette import NonvalidatingReader;
from Ft.Xml.Domlette import Print, PrettyPrint;
from Ft.Xml.XPath import Evaluate;

"""
This tool is used to find entries which are in the bidix but not in a monodix.

If a word is in a monodix, then lt-proc will produce one or more morphological
analyses for the word. For example, the Afrikaans word 'vat' is both a noun and
a verb. The Afrikaans monodix contains both these meanings. Therefore, when
we feed 'vat' to 'lt-proc af-en.automorf.bin', it will produce:
  ^vat/vat<n><sg>/vat<vblex><pres>/vat<vblex><inf>$^./.<sent>

In the monodix, we are likely to have two entries:
  <e><p><l>barrel<s n=\"n\"/></l><r>vat<s n=\"n\"/></r></p></e>
and
  <e><p><l>take<s n=\"vblex\"/></l><r>vat<s n=\"vblex\"/></r></p></e>

So, we can extract 'vat<n>' and 'vat<vblex>' from the bidix. One can see that
  vat<n> is a substring of vat<n><sg>
and that
  vat<vblex> is a substring of <vat><vblex><pres> as well as vat<vblex><inf>

In other words, if a bidix definition such as 'vat<n>' has a corresponding
monodix entry, then the morphological analyser when given the word 'vat',  must
produce at least one string of which 'vat<n>' will be a substring. In the
above example, that string is 'vat<n><sg>'.

Conversely, if the morphological analyser produces no such string, then
there is no corresponding monodix entry. This is exactly the property we use
to find the missing monodix entries.
"""


# Change this for your language
template = {
    '<vblex>'  : '<par n="breek__vblex"/>',
    '<adj>'    : '<par n="dadelik__adj"/>',
    '<n>'      : '<par n="artikel__n"/>',
    '<n><unc>' : '<par n="poësie__n__unc"/>',
    '<np>'     : '<par n="Engeland__np"/>',
    '<adv>'    : '<par n="miskien__adv"/>',
    '<preadv>' : '<par n="taamlik__preadv"/>'
}

# Default global values
class Globals:
    lt_proc_path  = '/usr/local/bin/lt-proc' # default location for lt-proc

# Parse an XML document and return a DOM tree. 
def load_xml_file(filename):
    return NonvalidatingReader.parseUri('file://' + os.path.realpath(filename))


def extract_entries(doc, side='l'):
    return doc.xpath("/dictionary/section[@id='main']/e/p/" + side)

def make_input_list(lst):
    """lst is list of DOM nodes. Get all the child text nodes for each
    node and concatenate the text in those nodes. Form a list of these
    new strings.

    If n is the tree <p>foo</b>bar</p>, we will extract 'foobar' from n.
    One should probably take special care of the <b/> tags; this is not
    currently done.
    """
    return [nodes_to_string(node.xpath('./text()')) for node in lst]

pattern = re.compile(r'<s n="([a-zA-Z0-9]*)"/>')
def transform_tags(tag):
    """Change a tag of the form <s n=\"tagname\"> to <tagname>"""
    return pattern.sub(r'<\1>', tag)

def make_compare_list(lst):
    return [transform_tags(nodes_to_string(node.childNodes)) for node in lst]

def process_output(output):
    """Split a set of newline separated morphological analyses,
and for each morphological analysis, strip off '^' and '$'
and split the analysis along the character '/'. This creates
a list of lists.

    For example,
      ^vat/vat<n><sg>/vat<vblex><pres>/vat<vblex><inf>$
      ^kla/kla<vblex><pres>/kla<vblex><inf>$
      ^nag/nag<n><sg>$
      
    will be split into
      [['vat', 'vat<n><sg>', 'vat<vblex><pres>', 'vat<vblex><inf>'],
       ['kla', 'kla<vblex><pres>', 'kla<vblex><inf>'],
       ['nag', 'nag<n><sg>']]"""
    return [line.strip('^$').split('/') for line in output.split('\n')]

def extract_tags(s):
    """Given an entry such as: 'foo<bar><baz>', return ('foo', '<bar><baz>').
    We ignore <g> and <b/> tags. Thus, we will split 'foo<g><b/>bar</g><baz>'
    into ('foo<g><b/>bar</g>', '<baz>')."""
    i = 0
    while True:
        if s[i] == '<':
            if s[i+1:i+3] == 'g>':
                i = i + 2

            elif s[i+1:i+4] in ('/g>', 'b/>'):
                i = i + 3

            else:
                return s[0:i], s[i:]

        i += 1

def call(name, input=''):
    """A convenience function to invoke a subprocess with the
    parameter list name (where the first argument is the name
    of an executable). The subprocess is fed the contents of
    input via stdin. We collect the output of both stdout and
    stderr from the subprocess. If stderr is not empty, we
    raise an exception, otherwise we return the contents of
    stdout."""
    proc = Popen(name, stdin=PIPE, stdout=PIPE, stderr=PIPE)
    out, err = proc.communicate(input)
    
    if not (err == None or err == ''):
        raise Exception(err)

    return out

# Execute lt-proc 
def run_ltproc(morfo_path, input_list):
    out = call([Globals.lt_proc_path, morfo_path], "\n".join(input_list))
    return process_output(out)

def find_missing_entries(morfo_path, lst):
    i = make_input_list(lst)
    c = make_compare_list(lst)
    o = run_ltproc(morfo_path, i)

    missing = []

    for entry, morpho_entries in izip(c, o):
        matches = [e for e in morpho_entries if e.startswith(entry)]

        if len(matches) == 0:
            missing.append(entry)

    return missing

def write_entries_to_file(f, lst):
    for lemma, tags in (extract_tags(e) for e in lst):
        if tags in template:
            f.write(u'    <e lm="%(lemma)s"><i>%(lemma)s</i>%(template)s</e>\n' % { 'lemma': lemma,
                                                                                    'template': template[tags] })

def node_to_string(node):
       buf = cStringIO.StringIO();
       Print(node, stream=buf, encoding='utf-8');
       return buf.getvalue();

def nodes_to_string(lst):
    return ''.join(node_to_string(n) for n in lst)



##def last_component(pathname):
##     return path.split(pathname)[2]

## def get_automorf_pair(automorf_path):
##     try:
##         return re.match('([^.]*[.]automorf[.]bin)', last_component(automorf_path))
##     except:
##         raise Exception("%s is not a valid automorf path" % automorf_path)

## def get_bidix_pair(bidix_path):
##     try:
##         return re.match('apertium-([^.]*)[.]([^.]*)[.]dix([.]xml', last_component(bidix_path)).group(1)
##     except:
##         raise Exception("%s is not a valid bidix path" % bidix_path)




def eliminate_duplicates(lst):
    seen_before = {}
    new_lst = []

    for item in lst:
        if item not in seen_before:
            seen_before[item] = True
            new_lst.append(item)

    return new_lst
    

def main(automorf_path, bidix_path, lt_proc_path=Globals.lt_proc_path, output=None, side='l'):
    """usage: find-missing-monodix-entries.py <options>

    <options> are the following
    
    --lt_proc_path  - path to lt-proc; the default is /usr/local/bin/lt-proc
    --automorf_path - path to the morphological analysis file used by lt-proc; e.g. af-en.automorf.bin
    --bidix_path    - path to the bidix file to be used
    --side          - either l or r; used to determine which side in the bidix is to be read; the default is l.
    --output        - filename to dump the data to; this defaults to stdout

    Example:
      python find-missing-monodix-entries.py --bidix_path=apertium-en-af.en-af.dix.xml \\
             --automorf_path=/usr/local/share/apertium/apertium-en-af/af-en.automorf.bin --side=r

      Read the bidix 'apertium-en-af.en-af.dix.xml' in the current directory. Use the morphological
      analyser file '/usr/local/share/apertium/apertium-en-af/af-en.automorf.bin'. Read entries from the
      right hand side of the bidix. Everything will be written to stdout.
    """

    Globals.lt_proc_path = lt_proc_path
    out_file = None

    if output == None:
        out_file = sys.stdout
    else:
        out_file = open(output, 'w')

    doc = load_xml_file(bidix_path)
    entries = extract_entries(doc, side)
    missing = find_missing_entries(automorf_path, entries)
    write_entries_to_file(out_file, eliminate_duplicates(missing))
    out_file.close()
    
    exit(0)
    

if __name__ == '__main__':
    param_dict = {}
    
    try:
        param_re = re.compile("[-][-]([_a-zA-Z0-9]*)[=](.*)$")
        param_dict = dict((match.group(1), match.group(2)) for match in (param_re.match(p) for p in sys.argv[1:]))
        
    except Exception, e:
        print main.__doc__
        exit(1)

    try:
        main(**param_dict)

    except Exception, e:
        print e
        print main.__doc__
        exit(1)
    
    

    

    

        
