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

#include <cwctype>
#include <transliterate.h>
#include <XMLParseUtil.h>

#include "entry.h"

using namespace std;

wstring const Transliterator::TRANSLITERATOR_TRANSLITERATOR_ELEM	=	L"transliterator";
wstring const Transliterator::TRANSLITERATOR_TABLE_ELEM			=	L"table";
wstring const Transliterator::TRANSLITERATOR_REPLACE_ELEM		=	L"replace";

wstring const Transliterator::TRANSLITERATOR_CHAR_ATTR			=	L"char";
wstring const Transliterator::TRANSLITERATOR_WITH_ATTR			=	L"with";

Transliterator::Transliterator(string const &file)
{
//	wcout << L" Transliterator()" << endl;
	reader = xmlReaderForFile(file.c_str(), NULL, 0);

	iter = table.begin();

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
}

Transliterator::~Transliterator()
{
//	wcout << L"--" << endl << "~Transliterator()" << endl;
}

/*
 *	Transliterate a string.
 *
 */
wstring 
Transliterator::transliterate(wstring in)
{
	wstring out;

	for(unsigned int i = 0; i < in.length(); i++) {
		for(unsigned int j = 0; j < table.size(); j++) {
			Entry e = table.at(j);

			if(towlower(in[i]) == (unsigned int)(e.from())[0]) {
				wstring r = e.to();
				out += r;
			}
		}
	}

	return out;
}

void
Transliterator::process_node(void)
{
	wstring nombre = XMLParseUtil::towstring(xmlTextReaderConstName(reader));

	if(nombre == L"#text") {
		// ignore this
	} else if(nombre == TRANSLITERATOR_TRANSLITERATOR_ELEM) {
		wcout << L"Transliterator" << endl;
	} else if(nombre == TRANSLITERATOR_TABLE_ELEM) {
		wcout << L" Table" << endl;
	} else if(nombre == TRANSLITERATOR_REPLACE_ELEM) {
		wstring const &character = XMLParseUtil::attrib(reader, L"char");
		wstring const &with = XMLParseUtil::attrib(reader, L"with");
		wcout << L"  Replace " << character << L" --> " << with << endl;

		Entry e = Entry(character, with);
		iter = table.insert(iter, e);
	} else if(nombre == L"#comment") {
		// ignore this
	} else {
		wcerr << "Error (" << xmlTextReaderGetParserLineNumber(reader);
		wcerr << "): Invalid node '<" << nombre << ">'." << endl;
	}
}

