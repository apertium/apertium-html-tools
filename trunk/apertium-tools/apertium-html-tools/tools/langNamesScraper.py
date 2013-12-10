import sqlite3, argparse, os
from lxml import etree

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Scrape Unicode.org for language names in different locales.')
    parser.add_argument('languages', nargs='+', help='list of languages to add to DB')
    parser.add_argument('-db', '--database', help='name of database file', default='unicode.db')
    args = parser.parse_args()

    os.path.exists(args.database) and os.remove(args.database)
    conn = sqlite3.connect(args.database)
    c = conn.cursor()
    c.execute('''create table languageNames (lg text, inLg text, name text)''')

    for inLang in args.languages:
        tree = etree.parse('http://www.unicode.org/repos/cldr/tags/latest/common/main/%s.xml' % inLang)
        languages = tree.xpath('//language')
        i = 0
        for language in languages:
            if language.text:
                c.execute('insert into languageNames values (?, ?, ?)', (inLang, language.get('type'), language.text))
                i += 1
        print('Added %s language names for %s' % (i, inLang))
    conn.commit()
    c.close()
    