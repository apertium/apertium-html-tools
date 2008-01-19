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

#include "similarity.h"

using namespace std;

/*
 * broadly speaking:
 * Levenshtein Distance Algorithm: C++ Implementation
 * by Anders Sewerin Johansen
 *
 */

int levenshtein_distance(wstring string1, wstring string2)
{
	int n = string1.length();
	int m = string2.length();

	if(n == 0 || m == 0) {
		return -1;
	}

	vector< vector<int> > matrix(n + 1);

	for(int i = 0; i <= n; i++) {
		matrix[i].resize(m + 1);
	}

	for(int i = 0; i <= n; i++) {
		matrix[i][0] = i;
	}

	for(int j = 0; j <= m; j++) {
		matrix[0][j] = j;
	}

	for (int i = 1; i <= n; i++) {
		const wchar_t s1i = string1[i - 1];
		for (int j = 1; j <= m; j++) {
			const wchar_t s2j = string2[j - 1];
			int cost;
			if (s1i == s2j) {
				cost = 0;
			} else { 
				cost = 1;	
			}
			const int above = matrix[i - 1][j];
			const int left = matrix[i][j - 1];
			const int diag = matrix[i - 1][j - 1];
			const int cell = min(above + 1, min(left + 1, diag + cost));

			matrix[i][j] = cell;
		}
	}

	return matrix[n][m];
}

/*
 * dice coefficient = bigram overlap * 2 / bigrams in a + bigrams in b
 *
 * as described in... 
 */

float dice_coefficient(wstring string1, wstring string2)
{
	int overlap = 0;

	vector<wstring> string1_bigrams;
	vector<wstring> string2_bigrams;

	vector<wstring>::iterator iter;

	iter = string1_bigrams.begin();			
	for(unsigned int i = 0; i < (string1.length() - 1); i++) {	// extract character bigrams from string1
		iter = string1_bigrams.insert(iter, string1.substr(i, 2));
	}

	iter = string2_bigrams.begin();
	for(unsigned int j = 0; j < (string2.length() - 1); j++) {	// extract character bigrams from string2
		iter = string2_bigrams.insert(iter, string2.substr(j, 2));
	}

	// calculate character bigram overlap between two strings
	for(unsigned int z = 0; z < string1_bigrams.size(); z++) {
		for(unsigned int x = 0; x < string2_bigrams.size(); x++) {
			if(string1_bigrams.at(z) == string2_bigrams.at(x)) {
				overlap++;
			}
		}
	}

	// calculate dice coefficient
	int total = string1_bigrams.size() + string2_bigrams.size();
	float dice = (float)(overlap * 2) / (float)total;

	return dice;
}

/*
 *	Same as dice_coefficient only with gappy bigrams.
 */

float xdice_coefficient(wstring string1, wstring string2)
{
	int overlap = 0;

	vector<wstring> string1_bigrams;
	vector<wstring> string2_bigrams;

	vector<wstring>::iterator iter;

	iter = string1_bigrams.begin();			
	for(unsigned int i = 0; i < (string1.length() - 1); i++) {	// extract character bigrams from string1
		iter = string1_bigrams.insert(iter, string1.substr(i, 2));
	}

	for(unsigned int h = 0; h < (string1.length() - 1); h++) {	// extract trigrams -- for gappy matching.
		iter = string1_bigrams.insert(iter, string1.substr(h, 3));
	}

	iter = string2_bigrams.begin();
	for(unsigned int j = 0; j < (string2.length() - 1); j++) {	// extract character bigrams from string2
		iter = string2_bigrams.insert(iter, string2.substr(j, 2));
	}

	for(unsigned int l = 0; l < (string2.length() - 1); l++) {	// extract trigrams
		iter = string2_bigrams.insert(iter, string2.substr(l, 3));
	}

	// calculate character bigram overlap between two strings
	for(unsigned int z = 0; z < string1_bigrams.size(); z++) {
		for(unsigned int x = 0; x < string2_bigrams.size(); x++) {
			if(string1_bigrams.at(z) == string2_bigrams.at(x)) {
				overlap++;	// bar:bar = 1
			} else if(string1_bigrams.at(z)[0] == string2_bigrams.at(x)[0] && string1_bigrams.at(z)[2] == string2_bigrams.at(x)[2]) {
				overlap++;	// bar:bur = 1
			} else if(string1_bigrams.at(z)[0] == string2_bigrams.at(x)[0] && string1_bigrams.at(z)[2] == string2_bigrams.at(x)[1]) {
				overlap++;	// bar:br  = 1
			}
		}
	}

	// calculate dice coefficient
	int total = string1_bigrams.size() + string2_bigrams.size();
	float dice = (float)(overlap * 2) / (float)total;

	return dice;
}

/*
 *	xxdice, as xdice but includes adjustment based on
 *	bigram position offset.
 */

float xxdice_coefficient(wstring string1, wstring string2)
{
	float overlap = 0.0;

	vector<wstring> string1_bigrams;
	vector<wstring> string2_bigrams;

	vector<wstring>::iterator iter;

	iter = string1_bigrams.begin();			
	for(unsigned int i = 0; i < (string1.length() - 1); i++) {	// extract character bigrams from string1
		iter = string1_bigrams.insert(iter, string1.substr(i, 2));
	}

	for(unsigned int h = 0; h < (string1.length() - 1); h++) {	// extract trigrams -- for gappy matching.
		iter = string1_bigrams.insert(iter, string1.substr(h, 3));
	}

	iter = string2_bigrams.begin();
	for(unsigned int j = 0; j < (string2.length() - 1); j++) {	// extract character bigrams from string2
		iter = string2_bigrams.insert(iter, string2.substr(j, 2));
	}

	for(unsigned int l = 0; l < (string2.length() - 1); l++) {	// extract trigrams
		iter = string2_bigrams.insert(iter, string2.substr(l, 3));
	}

	// calculate character bigram overlap between two strings
	for(unsigned int z = 0; z < string1_bigrams.size(); z++) {
		for(unsigned int x = 0; x < string2_bigrams.size(); x++) {
			int idx1 = string1.find_first_of(string1_bigrams.at(z));	
			int idx2 = string2.find_first_of(string2_bigrams.at(x));
			int offset = idx1 - idx2;					// offset is the difference between the positions of the bigrams
			float fiddle = (float)(2 / (1 + (offset * offset)));		// calculate fiddle factor 
			if(string1_bigrams.at(z) == string2_bigrams.at(x)) {
				overlap += fiddle;	// bar:bar = 1
			} else if(string1_bigrams.at(z)[0] == string2_bigrams.at(x)[0] && string1_bigrams.at(z)[2] == string2_bigrams.at(x)[2]) {
				overlap += fiddle;	// bar:bur = 1
			} else if(string1_bigrams.at(z)[0] == string2_bigrams.at(x)[0] && string1_bigrams.at(z)[2] == string2_bigrams.at(x)[1]) {
				overlap += fiddle;	// bar:br  = 1
			}
		}
	}

	// calculate dice coefficient
	int total = string1_bigrams.size() + string2_bigrams.size();
	float dice = (float)(overlap * 2) / (float)total;

	return dice;
}

/*
 *	This is a hack of a hack of a hack.
 *	Kind of works though.
 */

int longest_common_subsequence(wstring string1, wstring string2)
{	
	unsigned int i, j;

	unsigned int n = string1.length();
	unsigned int m = string2.length();

	if(n == 0 || m == 0) {
		return -1;
	}

	vector< vector<int> > matrix(n + 2);

	for(i = 0; i <= n+1; i++) {
		matrix[i].resize(m + 2);
	}

	for(i = 0; i <= n+1; i++) {
		matrix[i][0] = i;
	}

	for(j = 0; j <= m+1; j++) {
		matrix[0][j] = j;
	}

	for(i = n+1; i >= 1; i--) {	
		for(j = m+1; j >= 1; j--) {
//			wcout << L"n: " << n+1 << L" m: " << m+1 << L" i: " << i << L" j: " << j << endl;
			if(i == n+1 || j == m+1) {
				matrix[i][j] = 0;
			} else if(string1.at(i-1) == string2.at(j-1)) {
				matrix[i][j] = 1 + matrix[i + 1][j + 1];
			} else {
				matrix[i][j] = max(matrix[i + 1][j], matrix[i][j + 1]);
			}
		}
	}
/*
	for(i = 0; i <= n+1; i++) {	// print matrix
		wcout << endl;
		for(j = 0; j <= m+1; j++){
			wcout << matrix[i][j] << " ";
		}
	}
	wcout << L" = "; 
*/
	return matrix[1][1];
}

float longest_common_subsequence_coefficient(wstring string1, wstring string2)
{
	unsigned int n = string1.length();
	unsigned int m = string2.length();

	int lcs = longest_common_subsequence(string1, string2);

	return (float)lcs / (float)((n + m) / 2);
}
