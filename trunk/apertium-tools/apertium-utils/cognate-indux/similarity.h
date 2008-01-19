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

#ifndef __SIMILARITY_H__
#define __SIMILARITY_H__

#include <fstream>
#include <iostream>
#include <string>
#include <cstdlib>
#include <cwctype>
#include <vector>

using namespace std;

int 	levenshtein_distance			(wstring string1, wstring string2);
float	dice_coefficient			(wstring string1, wstring string2);
float	xdice_coefficient			(wstring string1, wstring string2);
float	xxdice_coefficient			(wstring string1, wstring string2);
int 	longest_common_subsequence		(wstring string1, wstring string2);
float 	longest_common_subsequence_coefficient	(wstring string1, wstring string2);

#endif /* __SIMILARITY_H__ */

