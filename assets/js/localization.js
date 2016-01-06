var locale;
var languages = {'af': 'Afrikaans', 'id': 'Bahasa Indonesia', 'cy': 'Cymraeg', 'de': 'Deutsch', 'en': 'English', 'ga': 'Gaeilge', 'gv': 'Gaelg', 'gd': 'Gàidhlig', 'rn': 'Ikirundi', 'sw': 'Kiswahili', 'lg': 'Luganda', 'mt': 'Malti', 'nl': 'Nederlands', 'sq': 'Shqip', 'vi': 'Tiếng Việt', 'tr': 'Türkçe', 'az': 'azərbaycan', 'br': 'brezhoneg', 'ca': 'català', 'da': 'dansk', 'se': 'davvisámegiella', 'et': 'eesti', 'es': 'español', 'eo': 'esperanto', 'eu': 'euskara', 'fr': 'français', 'fo': 'føroyskt', 'ia': 'interlingua', 'xh': 'isiXhosa', 'zu': 'isiZulu', 'it': 'italiano', 'mfe': 'kreol morisien', 'lv': 'latviešu', 'lt': 'lietuvių', 'hu': 'magyar', 'nb': 'norsk bokmål', 'nn': 'nynorsk', 'uz': 'oʻzbekcha', 'pl': 'polski', 'pt': 'português', 'ro': 'română', 'rm': 'rumantsch', 'sk': 'slovenčina', 'sl': 'slovenščina', 'fi': 'suomi', 'sv': 'svenska', 'is': 'íslenska', 'cs': 'čeština', 'el': 'Ελληνικά', 'tg': 'Тоҷикӣ', 'ba': 'башҡортса', 'be': 'беларуская', 'bg': 'български', 'os': 'ирон', 'kum': 'къумукъча', 'ky': 'кыргызча', 'mk': 'македонски', 'ru': 'русский', 'tt': 'татарча', 'uk': 'українська', 'kk': 'қазақша', 'hy': 'հայերեն', 'he': 'עברית', 'ur': 'اردو', 'ar': 'العربية', 'fa': 'فارسی', 'ne': 'नेपाली', 'mr': 'मराठी', 'hi': 'हिंदी', 'as': 'অসমীয়া', 'bn': 'বাংলা', 'pa': 'ਪੰਜਾਬੀ', 'te': 'తెలుగు', 'ml': 'മലയാളം', 'si': 'සිංහල', 'th': 'ไทย', 'lo': 'ລາວ', 'zh': '中文', 'ko': '한국어', 'mrj': 'Мары йӹлмӹ', 'gl': 'galego', 'myv': 'Эрзянь кель', 'oc': 'occitan', 'cv': 'чӑвашла', 'arg': 'aragonés', 'ast': 'asturianu', 'msa': 'bahasa malay', 'hbs': 'srpskohrvatski', 'srp': 'српски', 'hrv': 'hrvatski', 'bos':'bosanski', 'nog': 'ногъайша', 'sah': 'сахалыы', 'uig': 'ئۇيغۇرچە', 'tyv': 'тыва дылда'};
var iso639Codes = {"abk":"ab","aar":"aa","afr":"af","aka":"ak","sqi":"sq","amh":"am","ara":"ar","arg":"an","hye":"hy","asm":"as","ava":"av","ave":"ae","aym":"ay","aze":"az","bam":"bm","bak":"ba","eus":"eu","bel":"be","ben":"bn","bih":"bh","bis":"bi","bos":"bs","bre":"br","bul":"bg","mya":"my","cat":"ca","cha":"ch","che":"ce","nya":"ny","zho":"zh","chv":"cv","cor":"kw","cos":"co","cre":"cr","hrv":"hr","ces":"cs","dan":"da","div":"dv","nld":"nl","dzo":"dz","eng":"en","epo":"eo","est":"et","ewe":"ee","fao":"fo","fij":"fj","fin":"fi","fra":"fr","ful":"ff","glg":"gl","kat":"ka","deu":"de","ell":"el","grn":"gn","guj":"gu","hat":"ht","hau":"ha","heb":"he","her":"hz","hin":"hi","hmo":"ho","hun":"hu","ina":"ia","ind":"id","ile":"ie","gle":"ga","ibo":"ig","ipk":"ik","ido":"io","isl":"is","ita":"it","iku":"iu","jpn":"ja","jav":"jv","kal":"kl","kan":"kn","kau":"kr","kas":"ks","kaz":"kk","khm":"km","kik":"ki","kin":"rw","kir":"ky","kom":"kv","kon":"kg","kor":"ko","kur":"ku","kua":"kj","lat":"la","ltz":"lb","lug":"lg","lim":"li","lin":"ln","lao":"lo","lit":"lt","lub":"lu","lav":"lv","glv":"gv","mkd":"mk","mlg":"mg","msa":"ms","mal":"ml","mlt":"mt","mri":"mi","mar":"mr","mah":"mh","mon":"mn","nau":"na","nav":"nv","nob":"nb","nde":"nd","nep":"ne","ndo":"ng","nno":"nn","nor":"no","iii":"ii","nbl":"nr","oci":"oc","oji":"oj","chu":"cu","orm":"om","ori":"or","oss":"os","pan":"pa","pli":"pi","fas":"fa","pol":"pl","pus":"ps","por":"pt","que":"qu","roh":"rm","run":"rn","ron":"ro","rus":"ru","san":"sa","srd":"sc","snd":"sd","sme":"se","smo":"sm","sag":"sg","srp":"sr","gla":"gd","sna":"sn","sin":"si","slk":"sk","slv":"sl","som":"so","sot":"st","azb":"az","spa":"es","sun":"su","swa":"sw","ssw":"ss","swe":"sv","tam":"ta","tel":"te","tgk":"tg","tha":"th","tir":"ti","bod":"bo","tuk":"tk","tgl":"tl","tsn":"tn","ton":"to","tur":"tr","tso":"ts","tat":"tt","twi":"tw","tah":"ty","uig":"ug","ukr":"uk","urd":"ur","uzb":"uz","ven":"ve","vie":"vi","vol":"vo","wln":"wa","cym":"cy","wol":"wo","fry":"fy","xho":"xh","yid":"yi","yor":"yo","zha":"za","zul":"zu", "hbs":"sh", "pes":"fa"};
var rtlLanguages = ['heb', 'ara', 'pes', 'urd', 'uig'];
var languagesInverse = {}, iso639CodesInverse = {};
var localizedLanguageCodes = {}, localizedLanguageNames = {};
var dynamicLocalizations = {
    'Not_Available': 'Translation not yet available!',
    'detected': 'detected',
    'File_Too_Large': 'File is too large!',
    'Format_Not_Supported': 'Format not supported!',
    'Download_File': 'Download {{fileName}}'
};

var localizedHTML = false;

if(!config.LANGNAMES)
    config.LANGNAMES = {};

$(document).ready(function () {
    $.each(languages, function (key, value) {
        languagesInverse[value] = key;
    });
    $.each(iso639Codes, function (key, value) {
        iso639CodesInverse[value] = key;
    });

    var possibleItems = {'translation': getPairs, 'generation': getGenerators, 'analyzation': getAnalyzers};
    var deferredItems = [getLocale(), getLocales()];
    if(config.ENABLED_MODES === null)
        $.each(possibleItems, function (mode, deferrer) {
            deferredItems.push(deferrer.call());
        });
    else
        $.each(config.ENABLED_MODES, function () {
            if(possibleItems[this])
                deferredItems.push(possibleItems[this].call());
        });

    $.when.apply($, deferredItems).then(function () {
        $('.localeSelect').val(locale);
        localizeEverything(localizedHTML);
        persistChoices('localization');
    });

    $('.localeSelect').change(function () {
        locale = $(this).val();
        sendEvent('localization', 'localize', locale);
        localizeEverything(false);
        persistChoices('localization');
    });

    function localizeEverything(stringsFresh) {
        localizeInterface();
        localizeStrings(stringsFresh);
        if ($('#translatedText').hasClass('notAvailable')) {
            $('#translatedText').text(dynamicLocalizations['Not_Available']);
        }

        var pathname = window.location.pathname;

        if(window.history.replaceState && !pathname.endsWith('/index.debug.html')) {
            var urlParams = [], urlParamNames = ['dir', 'choice'];
            $.each(urlParamNames, function () {
                var urlParam = getURLParam(this);
                if(urlParam)
                    urlParams.push(this + '=' + encodeURIComponent(urlParam));
            });

            var newURL = pathname.substring(0, pathname.lastIndexOf('/')) + '/index.' + locale + '.html' + (urlParams.length > 0 ? '?' + urlParams.join('+') : '') + window.location.hash;
            window.history.replaceState({}, document.title, newURL);
        }
    }
});

function getLocale() {
    var deferred = $.Deferred();

    restoreChoices('localization');

    var localeParam = getURLParam('lang').replace('/', '');
    localeParam = iso639CodesInverse[localeParam] ? iso639CodesInverse[localeParam] : localeParam;
    if(localeParam) {
        locale = localeParam;
        deferred.resolve();
    }
    else {
        var pathParts = window.location.pathname.split('.');
        if(pathParts.length === 3 && pathParts[1] !== 'debug') {
            locale = pathParts[1];
            localizedHTML = true;
            deferred.resolve();
        }
        else if(!locale) {
            $.jsonp({
                url: config.APY_URL + '/getLocale',
                beforeSend: ajaxSend,
                success: function (data) {
                    for(var i = 0; i < data.length; i++) {
                        localeGuess = data[i];
                        if(localeGuess.indexOf('-') !== -1)
                            localeGuess = localeGuess.split('-')[0];
                        if(localeGuess in iso639Codes) {
                            locale = localeGuess;
                            break;
                        }
                        else if(localeGuess in iso639CodesInverse) {
                            locale = iso639CodesInverse[localeGuess];
                            break;
                        }
                    }
                },
                error: function () {
                    console.error('Failed to determine locale, defaulting to eng');
                    locale = 'eng';
                },
                complete: function () {
                    ajaxComplete();
                    deferred.resolve();
                }
            });
        }
        else {
            deferred.resolve();
        }
    }

    return deferred.promise();
}

function getLocales() {
    var deferred = $.Deferred();
    if(config.LOCALES) {
        handleLocales(config.LOCALES);
        deferred.resolve();
    }
    else {
        var locales = readCache('locales', 'AVAILABLE_LOCALES');
        if(locales) {
            handleLocales(locales);
            deferred.resolve();
        }
        else {
            console.error('Available locales cache ' + (locales === null ? 'stale' : 'miss') + ', retrieving from server');
            $.ajax({
                url: './strings/locales.json',
                type: 'GET',
                success: function (data) {
                    handleLocales(data);
                    cache('locales', data);
                    deferred.resolve();
                },
                error: function (jqXHR, textStatus, errorThrow) {
                    console.error('Failed to fetch available locales: ' + errorThrow);
                    deferred.resolve();
                }
            });
        }
    }

    function handleLocales(locales) {
        var localePairs = [];
        for(var code in locales)
            localePairs.push([code, locales[code]]);
        localePairs.sort();
        $('.localeSelect').empty();
        $.each(localePairs, function () {
            $('.localeSelect').append($('<option></option>').val(this[0]).text(this[1]).prop('dir', rtlLanguages.indexOf(this[0]) !== -1 ? 'rtl' : 'ltr'));
        });
    }

    return deferred.promise();
}

function generateLanguageList() {
    var languages = [];
    $.each(srcLangs.concat(dstLangs), function () {
        languages.push(this);
    });

    var langObjects = [generators, analyzers];
    for(var i = 0; i < langObjects.length; i++) {
        $.each(Object.keys(langObjects[i]), function () {
            if(this.indexOf('-') !== -1)
                languages = languages.concat(this.split('-'));
            else
                languages.push(this);
        });
    }

    languages = languages.filter(onlyUnique);
    return languages;
}

function localizeLanguageNames(localizedNamesFromJSON) {
    if(config.LANGNAMES[locale]) {
        handleLocalizedNames(config.LANGNAMES[locale]);
        cache(locale + '_names', config.LANGNAMES[locale]);
    }
    else if(localizedNamesFromJSON) {
        handleLocalizedNames(localizedNamesFromJSON);
        cache(locale + '_names', localizedNamesFromJSON);
    }
    else {
        var languages = generateLanguageList();

        var localizedNames = readCache(locale + '_names', 'LANGUAGE_NAME');
        if(localizedNames) {
            handleLocalizedNames(localizedNames);
            cache(locale + '_names', localizedNames);
        }
        else {
            console.error(locale + ' localized names cache ' + (localizedNames === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/listLanguageNames?locale=' + locale + '&languages=' + languages.join('+'),
                beforeSend: ajaxSend,
                complete: ajaxComplete,
                success: function (data) {
                    handleLocalizedNames(data);
                    cache(locale + '_names', data);
                },
                error: function () {
                    localizedLanguageNames = {};
                }
            });
        }
    }

    function handleLocalizedNames(localizedNames) {
        localizedLanguageNames = localizedNames;
        localizedLanguageCodes = {};
        $.each(localizedNames, function (key, value) {
            localizedLanguageCodes[value] = key;
        });

        if(modeEnabled('translation')) {
            populateTranslationList();
            refreshLangList();
        }

        if(modeEnabled('generation'))
            populateGeneratorList(generatorData);

        if(modeEnabled('analyzation'))
            populateAnalyzerList(analyzerData);
    }
}

function localizeStrings(stringsFresh) {
    if(stringsFresh)
        localizeLanguageNames();
    else {
        var localizations = readCache(locale + '_localizations', 'LOCALIZATION');
        if(localizations) {
            handleLocalizations(localizations);
            localizeLanguageNames(localizations['@langNames']);
        }
        else {
            console.error(locale + ' localizations cache ' + (localizations === null ? 'stale' : 'miss') + ', retrieving from server');
            $.ajax({
                url: './strings/' + locale + '.json',
                type: 'GET',
                dataType: 'text',
                success: function (data) {
                    data = JSON.parse(data.replace(/[\n\t\r]/g, ''));
                    handleLocalizations(data);
                    localizeLanguageNames(data['@langNames']);
                    cache(locale + '_localizations', data);
                },
                error: function (jqXHR, textStatus, errorThrow) {
                    console.error('Failed to fetch localized strings for ' + locale + ': ' + errorThrow);
                }
            });
        }
    }

    function handleLocalizations(localizations) {
        for(var textId in localizations) {
            if(textId.charAt(0) !== '@') {
                var text = localizations[textId];
                $.each(config.REPLACEMENTS, function (name, value) {
                    if(text.indexOf('{{' + name + '}}') !== -1)
                        text = text.replace('{{' + name + '}}', value);
                });
                try {
                    if(text.lastIndexOf('%%UNAVAILABLE%%') !== 0)
                        var elem = $('[data-text=' + textId + ']');
                        if(elem.attr('data-textattr'))
                            elem.attr(elem.attr('data-textattr'), text);
                        else
                            elem.html(text);
                }
                catch(e) {
                    console.error('Ignored "' + e + "\" when calling $('[data-text=' + " + textId + " + ']').html(" + text + ")"); // Only in IE8.
                }
            }
        }

        if(localizations['Download_File'] && $('#fileDownloadText').text().length)
            $('span#fileDownloadText').text(localizations['Download_File'].replace('{{fileName}}', $('a#fileDownload').attr('download')));

        $.each(dynamicLocalizations, function (key, value) {
            if(localizations[key] && localizations[key].lastIndexOf('%%UNAVAILABLE%%') !== 0)
                dynamicLocalizations[key] = localizations[key];
        });
    }
}

function localizeInterface() {
    var elements = {
        'html': locale,
        '#originalText': curSrcLang,
        '#translatedText': curDstLang,
        '#morphAnalyzerInput': $('#primaryAnalyzerMode').val(),
        '#morphGeneratorInput': $('#primaryGeneratorMode').val()
    };

    $.each(elements, function (selector, lang) {
        $(selector).attr('dir', direction(lang));
    });

    function direction(lang) {
        return rtlLanguages.indexOf(lang) === -1 ? 'ltr' : 'rtl';
    }

    $('link.rtlStylesheet').attr('disabled', direction(locale) === 'ltr');
}

function getLangByCode(code) {
    code = code ? code.trim() : code;
    if(localizedLanguageNames[code])
        return localizedLanguageNames[code];
    else if(iso639Codes[code] && localizedLanguageNames[iso639Codes[code]])
        return localizedLanguageNames[iso639Codes[code]];
    else if(iso639CodesInverse[code] && localizedLanguageNames[iso639CodesInverse[code]])
        return localizedLanguageNames[iso639CodesInverse[code]];
    else if(languages[code])
        return languages[code];
    else if(iso639Codes[code] && languages[iso639Codes[code]])
        return languages[iso639Codes[code]];
    else
        return code;
}
