h_sources =  transliterate.h entry.h XMLParseUtil.h 
cpp_sources = transliterate.cpp entry.cpp XMLParseUtil.cpp main.cpp

bin_PROGRAMS = transliterate

transliterate_SOURCES = $(cpp_sources)

transliterate_LDADD = $(LIBXML2_LIBS)

INCLUDES = -I$(top_srcdir) $(LIBXML2_CFLAGS)
EXTRA_DIST = hin.tr.xml per.tr.xml tgk.tr.xml urd.tr.xml

transliterators: $(EXTRA_DIST)
	xmllint --dtdvalid transliterator.dtd --noout $(EXTRA_DIST)

transliteratedir=$(prefix)/share/apertium/
transliterate_DATA=transliterators
