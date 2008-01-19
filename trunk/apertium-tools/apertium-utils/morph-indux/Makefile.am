cpp_SOURCES =  morph.cpp paradigm.cpp trie.cpp XMLParseUtil.cpp

bin_PROGRAMS = morph-indux

morph_indux_SOURCES = $(cpp_SOURCES)

morph_indux_LDADD = $(LIBXML2_LIBS)

INCLUDES = -I$(top_srcdir) $(LIBXML2_CFLAGS) -Wall

