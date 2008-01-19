h_sources =  entry.h similarity.h transliterate.h XMLParseUtil.h
cpp_sources = cognate.cpp entry.cpp similarity.cpp transliterate.cpp XMLParseUtil.cpp

bin_PROGRAMS = cognate-indux

cognate_indux_SOURCES = $(cpp_sources)

cognate_indux_LDADD = $(LIBXML2_LIBS)

INCLUDES = -I$(top_srcdir) $(LIBXML2_CFLAGS)

EXTRA_DIST = hin.xml per.xml tgk.xml urd.xml
