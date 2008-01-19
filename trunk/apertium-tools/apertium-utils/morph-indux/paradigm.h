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

#ifndef __PARADIGM_H__
#define __PARADIGM_H__

#include <vector>
#include <iostream>
#include <string>
#include <cstdlib>
#include <cwctype>
#include <map>

using namespace std;

class Paradigm
{
private:
	map<wstring,wstring> stemlist;

public:
	wstring name;

	Paradigm();
	Paradigm(wstring _name);
	~Paradigm();

	void add(wstring stem);
	map<wstring,wstring> stems();
};


#endif /* __PARADIGM_H__ */

