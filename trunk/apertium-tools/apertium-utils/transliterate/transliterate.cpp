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
wstring const Transliterator::TRANSLITERATOR_TABLE_NAME_ATTR		=	L"name";
wstring const Transliterator::TRANSLITERATOR_TRANSFORM_ELEM		=	L"transform";

wstring const Transliterator::TRANSLITERATOR_LEFT_ATTR			=	L"left";
wstring const Transliterator::TRANSLITERATOR_RIGHT_ATTR			=	L"right";

Transliterator::Transliterator(string const &file, string const &_direction, wstring const &_name)
{
	init(file, _direction, _name);
}

Transliterator::Transliterator(string const &file, string const &_direction)
{
	wstring const _name = L"default";
	init(file, _direction, _name);
}

Transliterator::Transliterator(string const &file)
{
	wstring const _name = L"default";
	string const _direction = "lr";
	init(file, _direction, _name);
}

void Transliterator::init(string const &file, string const &_direction, wstring const &_name)
{
	reader = xmlReaderForFile(file.c_str(), NULL, 0);

	direction = _direction;
	name = _name;
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
 */
wstring 
Transliterator::transliterate(wstring in)
{
	wstring out;
	wstring r = L"";

	// iterate through the string 1 char at a time.
	for(unsigned int i = 0; i < in.length(); i++) {

		r = in[i]; 

		// iterate through the transliteration table
		for(unsigned int j = 0; j < table.size(); j++) {
			Entry e = table.at(j);

			if(direction == "rl") {
				if(in[i] == (unsigned int)(e.right())[0]) {
					r = e.left();
				}
			} else {
				if(in[i] == (unsigned int)(e.left())[0]) {
					r = e.right();
				}
			}
		}

		out += r;
	}

	return out;
}

void
Transliterator::process_node(void)
{
	wstring nombre = XMLParseUtil::towstring(xmlTextReaderConstName(reader));
	// this needs to be static as it must remain through all calls.
	wstring static table_name = L"";

	if(nombre == L"#text") {
		// ignore this
	} else if(nombre == TRANSLITERATOR_TRANSLITERATOR_ELEM) {
//		wcout << L"Transliterator" << endl;
	} else if(nombre == TRANSLITERATOR_TABLE_ELEM) {
		table_name = XMLParseUtil::attrib(reader, TRANSLITERATOR_TABLE_NAME_ATTR);
//		wcout << L"  Table " << table_name << endl;
	} else if(nombre == TRANSLITERATOR_TRANSFORM_ELEM) {

		if(table_name == name) {
			wstring const &left  = XMLParseUtil::attrib(reader, TRANSLITERATOR_LEFT_ATTR);
			wstring const &right = XMLParseUtil::attrib(reader, TRANSLITERATOR_RIGHT_ATTR);
//			wcout << L"  Replace " << left << L" --> " << right << endl;

			Entry e = Entry(left, right);
			iter = table.insert(iter, e);
		}	
	} else if(nombre == L"#comment") {
		// ignore this
	} else {
		wcerr << "Error (" << xmlTextReaderGetParserLineNumber(reader);
		wcerr << "): Invalid node '<" << nombre << ">'." << endl;
	}
}
