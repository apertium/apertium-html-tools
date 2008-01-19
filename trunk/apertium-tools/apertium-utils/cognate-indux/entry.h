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

#ifndef __ENTRY_H__
#define __ENTRY_H__

#include <fstream>
#include <iostream>
#include <string>
#include <cstdlib>

#include <libxml/xmlreader.h>

using namespace std;

class Entry
{
private:
	wstring char_from;
	wstring char_to;

	void destroy();

	void copy(Entry const &e);

public:
	Entry(wstring const &from, wstring const &to);
	Entry(const Entry &e);
	Entry & operator = (Entry const &e);

	wstring from();
	wstring to();

        ~Entry();
};

#endif /* __ENTRY_H__ */

