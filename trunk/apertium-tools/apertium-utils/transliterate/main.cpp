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

#include <fstream>
#include <iostream>
#include <string>
#include <vector> 
#include <cstdlib>
#include <getopt.h>

#include "transliterate.h"
#include "XMLParseUtil.h"

using namespace std;

void usage(void);

int main(int argc, char **argv) 
{
	string transliterator_file, transliterator_table, transliterator_direction;
	string line, text;

	if (NULL == setlocale(LC_ALL,"")) {
		wcerr << L"Couldn't set locale." << endl;
		return 0;	
	}

	if(argc < 3) {
		usage();
	}

	static struct option long_options[] =  {
		{ "transliterator", 0, 0, 'f' },
		{ "table", 0, 0, 't' },
		{ "direction", 0, 0, 'd' },
		{ "help", 0, 0, 'h' },
		{ "verbose", 0, 0, 'v' },
		{ "version", 0, 0, 'V' },
		{ 0, 0, 0, 0 }
	};

	while(true) {
		int option_index;
		int c = getopt_long(argc, argv, "f:t:d:hvV", long_options, &option_index);

		if(c < 0) {
			break;
		}

		switch(c) {
			case 'v':
				wcout << L"Verbose" << endl;
				break;
			case 'V':
				usage();
				break;
			case 'h':
				usage();
				break;
			case 'f':
				transliterator_file =  optarg;
				break;
			case 't':
				transliterator_table =  optarg;
				break;
			case 'd':
				transliterator_direction =  optarg;
				break;

			default:
				break;
		}
	}

	// read from stdin until EOF 
	std::getline(std::cin, line, '\0');

	if(transliterator_table.empty() || transliterator_direction.empty()) {
		exit(-1);
	}

	wstring transliterated;
	Transliterator table = Transliterator(transliterator_file, transliterator_direction, XMLParseUtil::towstring((const xmlChar *)transliterator_table.c_str()));
	transliterated =  table.transliterate(XMLParseUtil::towstring((const xmlChar *)line.c_str()));

	wcout << transliterated << endl;

	return 0;
}

void usage(void) 
{
	cout << "Usage: ./transliterate [ -v | -V ] -f <transliterator file> -t <table name> -d [ lr | rl ]" << endl;
	cout << "Options:" << endl;
	cout << "  -f, --transliterator: The filename of the transliterator." << endl;
	cout << "  -t, --table:          The name of the table to use (Default: default)." << endl;
	cout << "  -d, --direction:      The direction of the transliteration (Default: lr, left-to-right)." << endl;
	cout << "  -v, --verbose:        Display verbose output." << endl;
	cout << "  -h, --help:           Print this usage information." << endl;
	cout << "  -V, --version:        Display version information." << endl;
	exit(0);
}
