var locale;
var languages = {'af': 'Afrikaans', 'id': 'Bahasa Indonesia', 'cy': 'Cymraeg', 'de': 'Deutsch', 'en': 'English', 'ga': 'Gaeilge', 'gv': 'Gaelg', 'gd': 'Gàidhlig', 'rn': 'Ikirundi', 'sw': 'Kiswahili', 'lg': 'Luganda', 'mt': 'Malti', 'nl': 'Nederlands', 'sq': 'Shqip', 'vi': 'Tiếng Việt', 'tr': 'Türkçe', 'az': 'azərbaycan', 'br': 'brezhoneg', 'ca': 'català', 'da': 'dansk', 'se': 'davvisámegiella', 'et': 'eesti', 'es': 'español', 'eo': 'esperanto', 'eu': 'euskara', 'fr': 'français', 'fo': 'føroyskt', 'ia': 'interlingua', 'xh': 'isiXhosa', 'zu': 'isiZulu', 'it': 'italiano', 'mfe': 'kreol morisien', 'lv': 'latviešu', 'lt': 'lietuvių', 'hu': 'magyar', 'nb': 'norsk bokmål', 'nn': 'nynorsk', 'uz': 'oʻzbekcha', 'pl': 'polski', 'pt': 'português', 'ro': 'română', 'rm': 'rumantsch', 'sk': 'slovenčina', 'sl': 'slovenščina', 'fi': 'suomi', 'sv': 'svenska', 'is': 'íslenska', 'cs': 'čeština', 'el': 'Ελληνικά', 'tg': 'Тоҷикӣ', 'ba': 'башҡортса', 'be': 'беларуская', 'bg': 'български', 'os': 'ирон', 'kum': 'къумукъча', 'ky': 'кыргызча', 'mk': 'македонски', 'ru': 'русский', 'tt': 'татарча', 'uk': 'українська', 'kk': 'қазақша', 'hy': 'հայերեն', 'he': 'עברית', 'ur': 'اردو', 'ar': 'العربية', 'fa': 'فارسی', 'ne': 'नेपाली', 'mr': 'मराठी', 'hi': 'हिंदी', 'as': 'অসমীয়া', 'bn': 'বাংলা', 'pa': 'ਪੰਜਾਬੀ', 'te': 'తెలుగు', 'ml': 'മലയാളം', 'si': 'සිංහල', 'th': 'ไทย', 'lo': 'ລາວ', 'zh': '中文', 'ko': '한국어'};
var iso639Codes = {"abk":"ab","aar":"aa","afr":"af","aka":"ak","sqi":"sq","amh":"am","ara":"ar","arg":"an","hye":"hy","asm":"as","ava":"av","ave":"ae","aym":"ay","aze":"az","bam":"bm","bak":"ba","eus":"eu","bel":"be","ben":"bn","bih":"bh","bis":"bi","bos":"bs","bre":"br","bul":"bg","mya":"my","cat":"ca","cha":"ch","che":"ce","nya":"ny","zho":"zh","chv":"cv","cor":"kw","cos":"co","cre":"cr","hrv":"hr","ces":"cs","dan":"da","div":"dv","nld":"nl","dzo":"dz","eng":"en","epo":"eo","est":"et","ewe":"ee","fao":"fo","fij":"fj","fin":"fi","fra":"fr","ful":"ff","glg":"gl","kat":"ka","deu":"de","ell":"el","grn":"gn","guj":"gu","hat":"ht","hau":"ha","heb":"he","her":"hz","hin":"hi","hmo":"ho","hun":"hu","ina":"ia","ind":"id","ile":"ie","gle":"ga","ibo":"ig","ipk":"ik","ido":"io","isl":"is","ita":"it","iku":"iu","jpn":"ja","jav":"jv","kal":"kl","kan":"kn","kau":"kr","kas":"ks","kaz":"kk","khm":"km","kik":"ki","kin":"rw","kir":"ky","kom":"kv","kon":"kg","kor":"ko","kur":"ku","kua":"kj","lat":"la","ltz":"lb","lug":"lg","lim":"li","lin":"ln","lao":"lo","lit":"lt","lub":"lu","lav":"lv","glv":"gv","mkd":"mk","mlg":"mg","msa":"ms","mal":"ml","mlt":"mt","mri":"mi","mar":"mr","mah":"mh","mon":"mn","nau":"na","nav":"nv","nob":"nb","nde":"nd","nep":"ne","ndo":"ng","nno":"nn","nor":"no","iii":"ii","nbl":"nr","oci":"oc","oji":"oj","chu":"cu","orm":"om","ori":"or","oss":"os","pan":"pa","pli":"pi","fas":"fa","pol":"pl","pus":"ps","por":"pt","que":"qu","roh":"rm","run":"rn","ron":"ro","rus":"ru","san":"sa","srd":"sc","snd":"sd","sme":"se","smo":"sm","sag":"sg","srp":"sr","gla":"gd","sna":"sn","sin":"si","slk":"sk","slv":"sl","som":"so","sot":"st","azb":"az","spa":"es","sun":"su","swa":"sw","ssw":"ss","swe":"sv","tam":"ta","tel":"te","tgk":"tg","tha":"th","tir":"ti","bod":"bo","tuk":"tk","tgl":"tl","tsn":"tn","ton":"to","tur":"tr","tso":"ts","tat":"tt","twi":"tw","tah":"ty","uig":"ug","ukr":"uk","urd":"ur","uzb":"uz","ven":"ve","vie":"vi","vol":"vo","wln":"wa","cym":"cy","wol":"wo","fry":"fy","xho":"xh","yid":"yi","yor":"yo","zha":"za","zul":"zu"}
var languagesInverse = {}, iso639CodesInverse = {};
var localizedLanguageCodes = {}, localizedLanguageNames = {};
var notAvailableText = 'Translation not yet available!', detectedText = 'detected';

$(document).ready(function () {
    $.each(languages, function (key, value) {
        languagesInverse[value] = key
    });
    $.each(iso639Codes, function (key, value) {
        iso639CodesInverse[value] = key
    });

    $.each(languages, function (code, langName) {
        $('.localeSelect').append($('<option></option>').prop('value', code).text(langName));
    });

    $('.localeSelect').change(function () {
        locale = $(this).val();
        localizeLanguageNames();
        persistChoices('localization');
    });

    var deferredItems = [getLocale(), getPairs(), getGenerators(), getAnalyzers()];
    $.when.apply($, deferredItems).then(function () {
        locale = $('.localeSelect').val();
        localizeLanguageNames();
    });
});

function getLocale() {
    var deferred = $.Deferred();
    restoreChoices('localization');

    if(!locale) {
        $.jsonp({
            url: APY_URL + '/getLocale',
            beforeSend: ajaxSend,
            success: function (data) {
                for(var i = 0; i < data.length; i++) {
                    localeGuess = data[i];
                    if(localeGuess.indexOf('-') !== -1)
                        localeGuess = localeGuess.split('-')[0];
                    if(iso639Codes[localeGuess] || iso639CodesInverse[localeGuess]) {
                        locale = localeGuess;
                        break;
                    }
                }
                $('.localeSelect').val(locale);
                persistChoices('localization');
            },
            complete: function () {
                ajaxComplete();
                deferred.resolve();
            }
        });
    }
    else
        deferred.resolve();

    return deferred.promise();
}

function generateLanguageList() {
    var languages = [];
    $.each(srcLangs.concat(dstLangs), function (i, elem) {
        languages.push(elem);
    });

    var langObjects = [generators, analyzers];
    for(var i = 0; i < langObjects.length; i++) {
        $.each(Object.keys(langObjects[i]), function (i, lang) {
            if(lang.indexOf('-') !== -1)
                languages = languages.concat(lang.split('-'));
            else
                languages.push(lang);
        });
    }

    languages = languages.filter(onlyUnique);
    return languages;
}

function localizeLanguageNames() {
    var languages = generateLanguageList();

    $.jsonp({
        url: APY_URL + '/listLanguageNames?locale=' + locale + '&languages=' + languages.join('+'),
        beforeSend: ajaxSend,
        complete: ajaxComplete,
        success: function (data) {
            localizedLanguageNames = data;
            localizedLanguageCodes = {};
            $.each(data, function (key, value) {
                localizedLanguageCodes[value] = key
            });

            populateTranslationList();
            refreshLangList();

            populateGeneratorList(generatorData);
            populateAnalyzerList(analyzerData);
        },
        error: function () {
            localizedLanguageNames = {};
        },
    });

    $.ajax({
        url: './assets/strings/' + iso639CodesInverse[locale] + '.json',
        type: 'GET',
        success: function (data) {
            for(var textId in data) {
                $('[data-text=' + textId + ']').text(data[textId]);
            }
            if(data['Not_Available'])
                notAvailableText = data['Not_Available'];
            if(data['detected'])
                detectedText = data['detected'];
        },
        error: function () {
            console.log('Failed to fetch localized strings for ' + locale);
        }
    });
}

function getLangByCode(code) {
    code = code.trim();
    if(localizedLanguageNames[code])
        return localizedLanguageNames[code];
    else if(languages[code])
        return languages[code];
    else if(iso639Codes[code] && languages[iso639Codes[code]])
        return languages[iso639Codes[code]];
    else
        return code;
}
