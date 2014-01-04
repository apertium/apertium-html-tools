var localizedLanguageCodes = new Object(), localizedLanguageNames = new Object();

$(document).ready(function() {
    var locale = 'en';
    $.ajax({
        url: APY_URL + '/getLocale',
        type: "GET",
        success: function(data) {
            for(var i = 0; i < data.length; i++) {
                localeGuess = data[i];
                if(localeGuess.indexOf('-') != -1)
                    localeGuess = localeGuess.split('-')[0];
                if(iso639Codes[localeGuess] || iso639CodesInverse[localeGuess]) {
                    locale = localeGuess;
                    break;
                }
            }
            $.each(languages, function(code, langName) {
                $('#localeSelect').append($('<option></option>').prop('value', code).text(langName).prop('selected', code == locale));
            });

            var intervalId = window.setInterval(function() {
                if(generatorsLoaded && translatorsLoaded) {
                    clearInterval(intervalId)
                    localizeLanguageNames();
                }
            }, 500);
        },
        dataType: 'jsonp',
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
});

function generateLanguageList () {
    var languages = {};
    $.each(srcLangs.concat(dstLangs), function(i, elem) {
        languages[elem] = undefined;
    });

    var langObjects = [generators, analyzers];
    for(var i = 0; i < langObjects.length; i++) {
        var keys = Object.keys(langObjects[i]);
        $.each(keys, function(i, key) {
            if(key.indexOf('-') !== -1) {
                var langs = key.split('-');
                languages[langs[0]] = undefined;
                languages[langs[1]] = undefined;
            }
            else
                languages[key] = undefined;
        });
    }

    languages = Object.keys(languages);
    return languages;
}

function localizeLanguageNames () {
    var locale = $('#localeSelect').val();
    var languages = generateLanguageList();

    $.ajax({
        url: APY_URL + '/listLanguageNames?locale=' + locale + '&languages=' + languages.join('+'),
        type: "GET",
        success: function (data) {
            localizedLanguageNames = data;
            $.each(data, function(key, value) { localizedLanguageCodes[value] = key });
            $('#selectTo em').html(getLangByCode(curr_pair.dstLang, localizedLanguageNames));
            $('#selectFrom em').html(getLangByCode(curr_pair.srcLang, localizedLanguageNames));
            
            populateTranslationList("#column-group-", srcLangs);
            populateGeneratorList(generators);
            populateAnalyzerList(analyzers);
        },
        dataType: 'jsonp',
        failure: function () {
            localizedLanguageNames = {};
        },
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
}

function getLangByCode (code, localizedLanguageNames) {
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

function getCodeByLang (lang, localizedLanguageCodes) {
    lang = lang.trim();
    if(localizedLanguageCodes[lang])
        return localizedLanguageCodes[lang];
    else if(languagesInverse[lang] && !iso639CodesInverse[languagesInverse[lang]])
        return languagesInverse[lang];
    else if(languagesInverse[lang] && iso639CodesInverse[languagesInverse[lang]]) {
        if(pairs.join('|').split('|').indexOf(iso639CodesInverse[languagesInverse[lang]]) != -1)
            return iso639CodesInverse[languagesInverse[lang]];
        else
            return languagesInverse[lang];
    }
    else
        return lang;
}