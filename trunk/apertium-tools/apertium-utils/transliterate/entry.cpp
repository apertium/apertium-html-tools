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

#include "entry.h" 

using namespace std;

Entry::Entry(wstring const &left, wstring const &right)
{
	_left = left;
	_right = right;
}

Entry::~Entry()
{
	destroy();
}

Entry::Entry(Entry const &e)
{
//	wcout << L"Entry(Entry const &e)" << endl;
	copy(e);
}

Entry & Entry::operator = (Entry const &e)
{
//	wcout << L"Entry &" << endl;

	if(this != &e) {
		destroy();
		copy(e);
	}

	return *this;
}

void
Entry::destroy()
{

}

void
Entry::copy(Entry const &e)
{
	_left = e._left;
	_right = e._right;
}


wstring
Entry::left()
{
	return _left;
}

wstring
Entry::right()
{
	return _right;
}


