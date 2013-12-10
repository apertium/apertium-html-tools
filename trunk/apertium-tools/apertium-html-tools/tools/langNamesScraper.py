import sqlite3, argparse, os
from lxml import etree

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape Unicode.org for language names in different locales.')
    parser.add_argument('languages', nargs='+', help='list of languages to add to DB')
    parser.add_argument('-db', '--database', help='name of database file', default='unicode.db')
    args = parser.parse_args()

    conn = sqlite3.connect(args.database)
    c = conn.cursor()
    c.execute('''create table if not exists languageNames (id integer primary key, lg text, inLg text, name text, unique(lg, inLg) on conflict replace)''')
    for inLang in args.languages:
        try:
            tree = etree.parse('http://www.unicode.org/repos/cldr/tags/latest/common/main/%s.xml' % inLang)
            languages = tree.xpath('//language')
            i = 0
            for language in languages:
                if language.text:
                    c.execute('insert into languageNames values (?, ?, ?, ?)', (None, inLang, language.get('type'), language.text))
                    i += 1
            print('Added %s language names for %s' % (i, inLang))
        except OSError:
            print('Failed to retreive language %s' % inLang)
        
    conn.commit()
    c.close()
    