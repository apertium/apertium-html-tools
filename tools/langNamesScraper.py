import sqlite3, argparse, os, subprocess, re
from lxml import etree

apertiumLanguages = set()
iso639Codes = {"abk":"ab","aar":"aa","afr":"af","aka":"ak","sqi":"sq","amh":"am","ara":"ar","arg":"an","hye":"hy","asm":"as","ava":"av","ave":"ae","aym":"ay","aze":"az","bam":"bm","bak":"ba","eus":"eu","bel":"be","ben":"bn","bih":"bh","bis":"bi","bos":"bs","bre":"br","bul":"bg","mya":"my","cat":"ca","cha":"ch","che":"ce","nya":"ny","zho":"zh","chv":"cv","cor":"kw","cos":"co","cre":"cr","hrv":"hr","ces":"cs","dan":"da","div":"dv","nld":"nl","dzo":"dz","eng":"en","epo":"eo","est":"et","ewe":"ee","fao":"fo","fij":"fj","fin":"fi","fra":"fr","ful":"ff","glg":"gl","kat":"ka","deu":"de","ell":"el","grn":"gn","guj":"gu","hat":"ht","hau":"ha","heb":"he","her":"hz","hin":"hi","hmo":"ho","hun":"hu","ina":"ia","ind":"id","ile":"ie","gle":"ga","ibo":"ig","ipk":"ik","ido":"io","isl":"is","ita":"it","iku":"iu","jpn":"ja","jav":"jv","kal":"kl","kan":"kn","kau":"kr","kas":"ks","kaz":"kk","khm":"km","kik":"ki","kin":"rw","kir":"ky","kom":"kv","kon":"kg","kor":"ko","kur":"ku","kua":"kj","lat":"la","ltz":"lb","lug":"lg","lim":"li","lin":"ln","lao":"lo","lit":"lt","lub":"lu","lav":"lv","glv":"gv","mkd":"mk","mlg":"mg","msa":"ms","mal":"ml","mlt":"mt","mri":"mi","mar":"mr","mah":"mh","mon":"mn","nau":"na","nav":"nv","nob":"nb","nde":"nd","nep":"ne","ndo":"ng","nno":"nn","nor":"no","iii":"ii","nbl":"nr","oci":"oc","oji":"oj","chu":"cu","orm":"om","ori":"or","oss":"os","pan":"pa","pli":"pi","fas":"fa","pol":"pl","pus":"ps","por":"pt","que":"qu","roh":"rm","run":"rn","ron":"ro","rus":"ru","san":"sa","srd":"sc","snd":"sd","sme":"se","smo":"sm","sag":"sg","srp":"sr","gla":"gd","sna":"sn","sin":"si","slk":"sk","slv":"sl","som":"so","sot":"st","azb":"az","spa":"es","sun":"su","swa":"sw","ssw":"ss","swe":"sv","tam":"ta","tel":"te","tgk":"tg","tha":"th","tir":"ti","bod":"bo","tuk":"tk","tgl":"tl","tsn":"tn","ton":"to","tur":"tr","tso":"ts","tat":"tt","twi":"tw","tah":"ty","uig":"ug","ukr":"uk","urd":"ur","uzb":"uz","ven":"ve","vie":"vi","vol":"vo","wln":"wa","cym":"cy","wol":"wo","fry":"fy","xho":"xh","yid":"yi","yor":"yo","zha":"za","zul":"zu"}
'''
    Scraped from https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes using
        out = {};
        $.each($('tr', $('table').get(1)), function(i, elem) { var rows = $('td', elem); out[$(rows[5]).text()] = $(rows[4]).text(); });
        JSON.stringify(out);
'''

def getApertiumLanguages():
    dirs = [('incubator', r'<name>apertium-(\w{2,3})(?:-(\w{2,3}))?</name>'), 
            ('nursery', r'<name>apertium-(\w{2,3})(?:-(\w{2,3}))?</name>'), 
            ('staging', r'<name>apertium-(\w{2,3})(?:-(\w{2,3}))?</name>'), 
            ('trunk', r'<name>(apertium)-(\w{2,3})-(?:\w{2,3})</name>'), 
            ('languages', r'<name>(apertium)-(\w{3})</name>'), 
           ]
    for (dirPath, dirRegex) in dirs:
        svnData = str(subprocess.check_output('svn list --xml https://svn.code.sf.net/p/apertium/svn/%s/' % dirPath, stderr=subprocess.STDOUT, shell=True), 'utf-8')
        for langCodes in re.findall(dirRegex, svnData, re.DOTALL):
            apertiumLanguages.update([convertISOCode(langCode)[1] for langCode in langCodes if not langCode == 'apertium'])
            
    print('Scraped %s apertium languages' % len(apertiumLanguages))
    return apertiumLanguages

def convertISOCode(code):
    if code in iso639Codes:
        return (code, iso639Codes[code])
    else:
        return (code, code)

def populateDatabase(args):
    conn = sqlite3.connect(args.database)
    c = conn.cursor()
    c.execute('''create table if not exists languageNames (id integer primary key, lg text, inLg text, name text, unique(lg, inLg) on conflict replace)''')
    for locale in args.languages:
        locale = convertISOCode(locale)
        try:
            tree = etree.parse('http://www.unicode.org/repos/cldr/tags/latest/common/main/%s.xml' % locale[1])
            languages = tree.xpath('//language')
            changes = conn.total_changes
            for language in languages:
                if language.text:
                    if not args.apertiumNames or (args.apertiumNames and language.get('type') in apertiumLanguages):
                        c.execute('''insert into languageNames values (?, ?, ?, ?)''', (None, locale[1], language.get('type'), language.text))
            print('Scraped %s localized language names for %s' % (conn.total_changes - changes, locale[1] if locale[0] == locale[1] else '%s -> %s' % locale))
        except (KeyboardInterrupt, SystemExit):
            raise
        except:
            print('Failed to retreive language %s' % locale[1])
        
    conn.commit()
    c.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape Unicode.org for language names in different locales.')
    parser.add_argument('languages', nargs='*', help='list of languages to add to DB')
    parser.add_argument('-d', '--database', help='name of database file', default='unicode.db')
    parser.add_argument('-n', '--apertiumNames', help='only save names of Apertium languages to database', action='store_true', default=False)
    parser.add_argument('-l', '--apertiumLangs', help='scrape localized names in all Apertium languages', action='store_true', default=False)
    args = parser.parse_args()
    
    if not len(args.languages) or args.apertiumNames or args.apertiumLangs:
        parser.print_help()
    
    if args.apertiumNames or args.apertiumLangs:
        getApertiumLanguages()
    if args.apertiumLangs:
        args.languages = apertiumLanguages
    populateDatabase(args)