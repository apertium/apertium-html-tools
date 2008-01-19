/*
 * Copyright (C) 2007 Francis Tyers
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
 * 02111-1307, USA.
 */

#include <vector>
#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <cstdlib>
#include <map>
#include <getopt.h>
#include <iomanip>

#include "trie.h"
#include "paradigm.h"
#include "XMLParseUtil.h"

using namespace std;

// from lttoolbox Compiler.C
wstring const COMPILER_N_ATTR             = L"n";
wstring const COMPILER_PARDEFS_ELEM       = L"pardefs";
wstring const COMPILER_PARDEF_ELEM        = L"pardef";
wstring const COMPILER_PAR_ELEM           = L"par";
wstring const COMPILER_ENTRY_ELEM         = L"e";
wstring const COMPILER_RESTRICTION_ATTR   = L"r";
wstring const COMPILER_RESTRICTION_LR_VAL = L"LR";
wstring const COMPILER_RESTRICTION_RL_VAL = L"RL";
wstring const COMPILER_PAIR_ELEM          = L"p";
wstring const COMPILER_LEFT_ELEM          = L"l";
wstring const COMPILER_RIGHT_ELEM         = L"r";
wstring const COMPILER_S_ELEM             = L"s";

// function prototypes
void process_node(void);
void usage(void);
void version(void);
void output_line(wstring paradigm, wstring lemma, float score, string style);
wstring trim(wstring line);

// deglobalise these at some point.
xmlTextReaderPtr reader;
map<wstring,Paradigm> paradigms;
wstring current_pardef = L"";
float threshold = 0.0;
bool verbose = false;

void
process_node(void)
{
        wstring nombre = XMLParseUtil::towstring(xmlTextReaderConstName(reader));

	if(nombre == L"#text") {
		wstring foo = XMLParseUtil::towstring(xmlTextReaderValue(reader));
		// we only want to include the stem if there is a current paradigm, and if it
		// is a real word, not just \n, ' ' or an empty string. <-- this should be simplified
		if(foo[0] != L'\n' && foo[0] != L' ' && !foo.empty() && current_pardef != L"") {
			if(verbose) {
				wcout << L"nombre: " << current_pardef << L" : " << foo << endl;
			}
			paradigms[current_pardef].add(foo);
		}
	} else if(nombre == COMPILER_PARDEF_ELEM) {
		wstring const &nom = XMLParseUtil::attrib(reader, L"n");
		if(paradigms.count(nom) == 0) {
			paradigms[nom] = Paradigm(nom);
		}
		current_pardef = nom;

		if(verbose) {
			wcout << nom << endl;
		}

	} else if(nombre == COMPILER_PARDEFS_ELEM) {
		// close the current paradigm.
		current_pardef = L"";

	} else {
		return;
	}
}

void usage()
{
	wcout << L"Usage: morph-indux [OPTION] [DICTIONARY] [FILE]" << endl;
	wcout << L"Options:" << endl;
	wcout << L"  -s, --style:           The style of output, one of XML (Apertium standard) and CSV." << endl;
	wcout << L"  -t, --threshold:       The score threshold for printing the results, default is 0. Value between 0 and 1." << endl;
	wcout << L"  -V, --version:         Display version information." << endl;
	wcout << L"  -v, --verbose:         Display verbose output." << endl;
	wcout << L"  -h, --help:            Display this message." << endl;

	wcout << endl;
}

void version()
{
	wcout << L"morph-indux 0.1" << endl;
	wcout << L"Copyright (C) 2007 Francis Tyers" << endl;
	wcout << L"This is free software.  You may redistribute copies of it under the terms of" << endl;
	wcout << L"There is NO WARRANTY, to the extent permitted by law." << endl;

	wcout << endl;
}

/*
 *	Output a pair, either as csv, or as apertium XML
 *
 *
 */
void output_line(wstring paradigm, wstring lemma, float score, string style)
{
	wstringstream s2; s2 << std::fixed << std::setprecision (2) << score;

	// if there is a '/' we need to append that bit to the end of the
	// root to make the lemma.
	unsigned int slashpos = paradigm.find(L"/", 0);
	unsigned int unscopos = paradigm.find(L"_", 0);
	wstring root = lemma;

	if(slashpos != string::npos && unscopos != string::npos) {
		unsigned int len = unscopos - slashpos;
		lemma += paradigm.substr(slashpos+1, len-1);
//		wcout << slashpos << L" : " << unscopos << L" : " << lemma << endl;
	}

	if(style == "csv") {
		wcout << paradigm << L"," << root << L"," << lemma << L"," << s2.str() << endl;
	} else { 
		// indent by 4 chars as standard
		wcout << L"    <e lm=\"" << lemma << L"\"><i>";
		wcout << root << L"</i><par n=\"" << paradigm;
		wcout << L"\"/></e> <!-- Score: " << s2.str() << L" -->";
		wcout << endl;
	}
}

/*
 *	trims the whitespace and punctuation from the beginning and end of a string.
 */

wstring trim(wstring line) 
{
	if(line.length() == 0) {
		return line;
	}

	unsigned int beg = line.find_first_not_of(L" \a\b\f\n\r\t\v:,.?;!»«");
	unsigned int end = line.find_last_not_of(L" \a\b\f\n\r\t\v:,.?;!»«");

	if(beg == string::npos) {
		return L"";
	}

	return wstring(line, beg, end - beg + 1);
}

int main(int argc, char **argv)
{
	string threshold_s, style;
	if(argc <= 2) {
		usage();
		return -1;
	}

	static struct option long_options[] =  {
		{ "style", 0, 0, 's' },
		{ "threshold", 0, 0, 't' },
		{ "version", 0, 0, 'V' },
		{ "verbose", 0, 0, 'v' },
		{ "help", 0, 0, 'h' },
		{ 0, 0, 0, 0 }
	};

	while(true) {	
		int option_index;
		int c = getopt_long(argc, argv, "t:s:vVh", long_options, &option_index);

		if(c < 0) {
			break;
		}

		switch(c) {
			case 'V':
				version();
				return 0;
			case 'v':
				verbose = true;
				break;
			case 'h':
				usage();
				return 0;
			case 't':
				threshold_s = optarg;
				break;
			case 's':
				style = optarg;
				break;
			default:
				wcout << L"Invalid option." << endl;
				return 0;
		}
	}

	if (NULL == setlocale(LC_ALL,"")) {
		wcerr << L"Couldn't set locale." << endl;
		return 0;
	}

	string filename = string(argv[argc - 1]), filename2 = string(argv[argc - 2]), line;
	std::istringstream i(threshold_s);
	i >> threshold;

	ifstream f(filename.c_str());

	reader = xmlReaderForFile(filename2.c_str(), NULL, 0);

	// load the xml file
	int ret = xmlTextReaderRead(reader);
	while(ret == 1) {
		process_node();
		ret = xmlTextReaderRead(reader);
	}

	if(ret != 0) {
		wcerr << L"Error: Parse error at the end of input." << endl;
	}

	xmlFreeTextReader(reader);
	xmlCleanupParser();

	Trie t = Trie(verbose);

	if(!f.is_open()) {
		cerr << "Could not open " << argv[1] << endl;
		return -1;
	}

	// assuming one word per line, read the line and then
	// add it into the trie.
	while(getline(f, line)) {
		// add the line, trimming it.
		wstring s = XMLParseUtil::towstring((const xmlChar *)line.c_str());
		if(verbose) {
			wcout << s << endl;
		}
		t.add(trim(s));
	}

	if(verbose) {
		wcout << L"pardefs: " << paradigms.size() << endl;
	}

        map<wstring,Paradigm>::iterator iter;
	map<wstring,wstring>::iterator  stemiter;

	if(verbose) {
	        for(iter = paradigms.begin(); iter != paradigms.end(); iter++) {
			map<wstring,wstring> stems = (*iter).second.stems();
			// this is not a particularly appropriate way of doing this... a better way would be
			// to read in the 'inconditional' section and then trim out paradigms based on this.
			if(stems.size() > 1) {
				wcout << L" [" << (*iter).first << L"] (" << stems.size() << L") [ ";
				for(stemiter = stems.begin(); stemiter != stems.end(); stemiter++) {
					wcout << (*stemiter).first << L" ";
				}
				wcout << L" ]" << endl;
			}
		}

	}

	map< map <wstring, wstring>, int > results;

	for(iter = paradigms.begin(); iter != paradigms.end(); iter++) {
		map<wstring,wstring> stems = (*iter).second.stems();
		// this is not a particularly appropriate way of doing this... a better way would be
		// to read in the 'inconditional' section and then trim out paradigms based on this.
		if(stems.size() > 1) {
			for(stemiter = stems.begin(); stemiter != stems.end(); stemiter++) {
				// generate lists of candidate lemmas.
		
				vector<wstring> cs = t.candidates((*stemiter).first);
				if(verbose) {
					wcout << L"[" << (*iter).first << L"] candidates for `" << (*stemiter).first << "':" << endl;
					wcout << L"+ cs size: " << cs.size() << endl;
				}
				for(unsigned int i = 0; i < cs.size(); i++) {
					map<wstring,wstring> m;
					m[(*iter).first] = cs[i];
					results[m]++;
				}
			}
		}
	}

	// print out the results
	// this is a bloated mess of hell, and should be split out into a series of functions
	map< map <wstring, wstring>, int >::iterator riter;
	for(riter = results.begin(); riter != results.end(); riter++) {
		map<wstring,wstring> tuple = (*riter).first;
		for(stemiter = tuple.begin(); stemiter != tuple.end(); stemiter++) {
			float score = (float)(*riter).second / (float)paradigms[(*stemiter).first].stems().size();
			if(score > threshold) {
				output_line((*stemiter).first, (*stemiter).second, score, style);
			}
		}	
	}
		
	f.close();
	return 0;
}

