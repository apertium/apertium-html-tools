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

#include <cwctype>

#include "trie.h"

/*
 *	This class is an implementation of a reverse Trie, the
 *	trie for 'function', 'fractal', 'fraction' and 'full' looks
 *	like the following:
 *
 *                root
 *                /  \
 *               N    L
 *              /    / \
 *             O    L   A
 *            /    /     \
 *           I    U       T
 *           |    |        \
 *           T    F         C
 *           |               \
 *           C                A
 *          / \                \
 *         N   A                R
 *        /     \                \
 *       U       R                F
 *      /         \
 *     F           F
 */

using namespace std;

unsigned int lemma = 0;
bool debug;

TrieNode::TrieNode()
{
//	wcout << L"TrieNode()" << endl;
}

TrieNode::~TrieNode()
{
//	wcout << L"~TrieNode()" << endl;
}

void
TrieNode::add(wstring s)
{
	if(!s.empty()) {
		wchar_t c = s.at(s.length() - 1); 	// this is stupid but i
		wstring x = L"";			// can't think of a  
		x += c;					// better way to do it
		value = x;

		if(debug) {
			wcout << L"TrieNode::add( " << s << L" ) [" << x << L"]" << endl;
		}

		if(children.count(x) == 0) {
			if(debug) {
				wcout << L"* Creating new TrieNode for `" << x << L"'" << endl;
			}
			children[x] = TrieNode();
		}

		wstring n = s.substr(0, s.length() - 1);
		if(debug) {
			wcout << L" ? Adding: " << n << endl;
		}
		children[x].add(n);

	} else {
		if(debug) {
			wcout << L"Returning from TrieNode::add()" << endl;
		}
		return;
	}
}

/*
 * returns true if the string was found, false if it wasn't
 */

bool
TrieNode::find(wstring s)
{
	if(s.empty()) {
		if(debug) {
			wcout << L"Found." << endl;
		}
		return true;
	} else {
		wchar_t c = s.at(0); 
		wstring x = L""; x += c;

		if(debug) {
			wcout << L"TrieNode::find( " << s << L" ) [" << x << L" : " << s.length() << L"]" << endl;
		}
		if(children.count(x) == 0) {
			if(debug) {
				wcout << L"Not found." << endl;
			}
		} else {
			children[x].find(s.substr(1));
		}
	}
	return false;
}

/*
 * Return a list of candidate lemmata from a suffix
 * The 'candidates' argument is ammended and returned.
 *
 * sfx = suffix
 */

vector<wstring> 
TrieNode::candidates(wstring sfx, vector<wstring> & candidates)
{
	if(sfx.empty()) { // reached the end of the suffix.

		if(debug) {
			wcout << L"Found." << endl;
		}
	
		vector<wstring>::iterator eliter = candidates.begin();
		eliter = candidates.insert(eliter, L"");

		if(debug) {
			wcout << L"TrieNode::candidates() [children: " << children.size() << L"]" << endl;
		}

		print2(candidates); // call this something less stupid

		if(debug) {
			wcout << endl;
		}

		// we got to the end of the suffix so now we need to count up the 
		// candidates. we also need to reverse them to retrieve the original
		// stem.
		for(eliter = candidates.begin(); eliter != candidates.end(); eliter++) {
			wstring reversed = (*eliter);
			unsigned int count = 0;
			// reverse string.
			for(unsigned int i = (*eliter).length(); i != 0; i--) {
				reversed[count++] = (*eliter).at(i-1);
			}

			(*eliter) = reversed;

			if(debug) {
				wcout << L" @ " << reversed << endl;
			}
		}
	
		return candidates;

	} else { // we haven't reached the end of the suffix

		wchar_t c = sfx.at(0); 
		wstring x = L""; x += c;

		if(debug) {
			wcout << L"TrieNode::find( " << sfx << L" ) [" << x << L" : " << sfx.length() << L"]" << endl;
		}

		if(children.count(x) == 0) {
			// if there are no children to this character then the suffix has
			// no candidate stems -- and we should return what we currently have
			if(debug) {
				wcout << L"Not found." << endl;
			}
			return candidates;
		} else {
			// take the next character in the suffix and recurse down
			// removing the current character from the suffix.
			return children[x].candidates(sfx.substr(1), candidates);
		}
	}
}

/* THE MANGLING HAPPENS HERE */

void
TrieNode::print2(vector<wstring> & candidates)
{
	map<wstring,TrieNode>::iterator iter;
	vector<wstring>::iterator eliter = candidates.end();

	if(children.empty()) {
		if(debug) {
			wcout << L" + candidates.size [e] =  " << candidates.size() << endl;
		}
		lemma++;

	} else 	if(children.size() > 1) {

		if(debug) {
			wcout << L" + candidates.size [1] =  " << candidates.size() << L" : " << children.size() << L" : " << candidates.at(lemma) << endl;
		}

		for(unsigned int i = 1; i < children.size(); i++) {
			eliter = candidates.insert(eliter, candidates.at(lemma));
		}
	} else {
		wcout << L"(" << children.size() << L") We didn't do shit. Children wasn't empty and size wasn't > 1" << endl;
	}

	for(iter = children.begin(); iter != children.end(); iter++) {
		if(debug) {
			wcout << L" + candidates.size [f] =  " << candidates.size() << L" - " << candidates[lemma] << L" += " << (*iter).first << endl;
		}
		candidates[lemma] += (*iter).first;
		if(debug) {
			wcout << L"[" << (*iter).first << L"] (" << children.size() << L") " << endl;
		}
		children[(*iter).first].print2(candidates);
	}
}

Trie::Trie(bool _verbose)
{
	root = TrieNode();
	debug = _verbose;
}

Trie::Trie()
{
	root = TrieNode();
	debug = false;
}

Trie::~Trie()
{
//	wcout << L"~Trie()" << endl;
}

void
Trie::add(wstring s) 
{
	if(debug) {
		wcout << L"adding: " << s << L" / " << endl;
	}

	if(s.length() > 0) {
		root.add(s);
	}
}

bool
Trie::find(wstring s)
{
	if(debug) {
		wcout << L"Trie::find( " << s << L" ) " << endl;
	}
	return root.find(s);
}

/*
 *	Return a vector of candidate lemmas for a particular suffix
 */
vector<wstring>
Trie::candidates(wstring sfx)
{
	vector<wstring> candidates;
	wstring reversed = sfx;
	unsigned int count = 0;

	// make sure this is clear.
	candidates.clear();
	lemma =  0;

	// we have to reverse the string because the Trie 
	// is in reverse order -- no standard library
	// function for reversing strings iirc.
	for(unsigned int i = sfx.length(); i != 0; i--) {
		reversed[count++] = sfx.at(i-1);
	}

	if(debug) {
		wcout << L"sfx: " << sfx << "; rev: " << reversed << endl;
	}

	return root.candidates(reversed, candidates);
}

void 
Trie::print(void)
{

}

