/*
 * Copyright (C) 2007 Francis Tyers
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 */

/*
 * TODO:
 *  change format of arguments to:
 *
 *  cognate [ -m | -v | -V ] [input_file1 input_file2 [transliteration1 transliteration2]]
 */

#include <fstream>
#include <iostream>
#include <string>
#include <vector> 
#include <cstdlib>
#include <getopt.h>

#include "similarity.h"
#include "transliterate.h"
#include "XMLParseUtil.h"

using namespace std;

void usage(void);
void find_cognates(string file1, string file2, string trant1, string trant2, string measure);

int main(int argc, char **argv) 
{
	wstring wtext;
	string first_file, second_file, trf_first, trf_second, measure;
	string line, text;

	if (NULL == setlocale(LC_ALL,"")) {
		wcerr << L"Couldn't set locale." << endl;
		return 0;	
	}

	if(argc < 4) {
		usage();
	}

	static struct option long_options[] =  {
		{ "first-file", 0, 0, 'f' },
		{ "second-file", 0, 0, 's' },
		{ "transliterate-first", 0, 0, 't' },
		{ "transliterate-second", 0, 0, 'r' },
		{ "measure", 0, 0, 'm' },
		{ "verbose", 0, 0, 'v' },
		{ "version", 0, 0, 'V' },
		{ 0, 0, 0, 0 }
	};

	while(true) {
		int option_index;
		int c = getopt_long(argc, argv, "f:s:t:r:m:vV", long_options, &option_index);

		if(c < 0) {
			break;
		}

		switch(c) {
			case 'v':
				wcout << L"Verbose" << endl;
				break;
			case 'V':
				wcout << L"Version" << endl;
				usage();
				break;
			case 'f':
				wcout << L"First file: " << optarg << endl;
				first_file = optarg;
				break;
			case 's':
				wcout << L"Second file: " << optarg << endl;
				second_file = optarg;
				break;
			case 't':
				wcout << L"First transliteration: " << optarg << endl;
				trf_first =  optarg;
				break;
			case 'r':
				wcout << L"Second transliteration: " << optarg << endl;
				trf_second = optarg;
				break;
			case 'm':
				wcout << L"Measure: " << optarg << endl;
				measure = optarg;
				break;

			default:
				break;
		}
	}

	find_cognates(first_file, second_file, trf_first, trf_second, measure);

	return 0;
}

/*
 *	file1 = 
 *	file2 = 
 *	trant1 = transliteration table file for first file
 *	trant2 = transliteration table file for second file
 *	measure = string similarity measur
 */

void find_cognates(string file1, string file2, string trant1, string trant2, string measure) 
{
	ifstream file1stream(file1.c_str());
	ifstream file2stream(file2.c_str());

	vector<wstring> file1words;
	vector<wstring> file2words;
	vector<wstring>::iterator iter;

	string buf1, buf2, line;
	wstring wbuf1, wbuf2;

	if(!file1stream.is_open()) {
		cerr << "Could not open " << file1 << endl;
		return;
	}
	if(!file2stream.is_open()) {
		cerr << "Could not open " << file2 << endl;
		return;
	}
	
	iter = file1words.begin();
	while(getline(file1stream, line)) {
		iter = file1words.insert(iter, XMLParseUtil::towstring((const xmlChar *)line.c_str()));
	}

	iter = file2words.begin();
	while(getline(file2stream, line)) {
		iter = file2words.insert(iter, XMLParseUtil::towstring((const xmlChar *)line.c_str()));
	}

	Transliterator ttable_first = Transliterator(trant1); // read the file :after: setting the locale
	Transliterator ttable_second = Transliterator(trant2); 

	wcout << file1words.size() << endl;
	wcout << file2words.size() << endl;

	for(unsigned int i = 0; i < file1words.size(); i++) {
		for(unsigned int j = 0; j < file2words.size(); j++) {
			float d = 0.0;
			wstring wword1 = ttable_first.transliterate(file1words[i]);
			wstring wword2 = ttable_second.transliterate(file2words[j]);
			wcout << file1words[i] << " : " << file2words[j] << " : ";
			wcout << wword1 << " : " << wword2 << " : ";

			if(measure == "dice") {				// choose similarity measure
				d =  dice_coefficient(wword1, wword2);
			} else if(measure == "levenshtein") {
				d = levenshtein_distance(wword1, wword2);
			} else if(measure == "xdice") {
				d = xdice_coefficient(wword1, wword2);
			} else if(measure == "xxdice") {
				d = xxdice_coefficient(wword1, wword2);
			} else if(measure == "lcs") {
				d = longest_common_subsequence(wword1, wword2);
			} else if(measure == "lcsc") {
				d = longest_common_subsequence_coefficient(wword1, wword2);
			} else {
				wcout << L"Default (m: " << XMLParseUtil::towstring((const xmlChar *)measure.c_str()) << ")" << endl;
				return;
			}
			wcout << d << endl;
		}
	}

	file1stream.close();
	file2stream.close();
	
}

void usage(void) 
{
	cout << "Usage: ./cognate [ -v | -V ] -f <first file> -s <second file> -t <first transliteration table> -r <second transliteration table>" << endl;
	cout << "Options:" << endl;
	cout << "  -m, --measure:        String similarity measure (levenshtein, dice, xdice, xxdice, lcs, lcsc)." << endl;
	cout << "  -v, --verbose:        Display verbose output." << endl;
	cout << "  -V, --version:        Display version information." << endl;
	exit(0);
}

