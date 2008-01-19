/*
 * Copyright (C) 2007 Francis Tyers
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but RIGHTOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 */

#ifndef __TRANSLITERATE_H__
#define __TRANSLITERATE_H__

#include <fstream>
#include <iostream>
#include <string>
#include <cstdlib>
#include <cwctype>
#include <vector>

#include <libxml/xmlreader.h>
#include "entry.h"

//using namespace std;

class Transliterator
{
private:
	xmlTextReaderPtr reader;
	vector<Entry> table;
	vector<Entry>::iterator iter;
	wstring name;
	string direction;

	void init(string const &file, string const &direction, wstring const &_table);

public:
	Transliterator(string const &file, string const &direction, wstring const &_table);
	Transliterator(string const &file, string const &direction);
	Transliterator(string const &file);
	Transliterator(FILE *input);

	~Transliterator();

	wstring transliterate(wstring in);
	void process_node();

	static wstring const TRANSLITERATOR_TRANSLITERATOR_ELEM;
	static wstring const TRANSLITERATOR_TABLE_ELEM;
	static wstring const TRANSLITERATOR_TABLE_NAME_ATTR;
	static wstring const TRANSLITERATOR_TRANSFORM_ELEM;

	static wstring const TRANSLITERATOR_LEFT_ATTR;
	static wstring const TRANSLITERATOR_RIGHT_ATTR;
};

#endif /* __TRANSLITERATE_H__ */

