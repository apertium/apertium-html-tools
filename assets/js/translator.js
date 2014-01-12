/*
TODO: (in some order)
1) Mobile version for translation (!!!)
2) Deal with languages having multiple iso codes (ugh...)
3) Second level dropdown in analyzer/generators
4) Adapting width of dropdown?
*/

var pairs = {};
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];

$(document).ready(function () {
    $('#srcLanguages').on('click', '.languageName:not(.text-muted)', function () {
        var code = $(this).attr('data-code');
        curSrcLang = code;

        $('.srcLang').removeClass('active');
        if(recentSrcLangs.indexOf(code) === -1) {
            recentSrcLangs = [code, recentSrcLangs[0], recentSrcLangs[1]];
            $('#srcLang1').addClass('active');
            refreshLangList(true);
        }
        else {
            $('#srcLang' + (recentSrcLangs.indexOf(code) + 1)).addClass('active');
            persistChoices();
        }
        
        muteLanguages();
    });

    $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
        var code = $(this).attr('data-code');
        curDstLang = code;
        
        $('.dstLang').removeClass('active');
        if(recentDstLangs.indexOf(code) === -1) {
            recentDstLangs = [code, recentDstLangs[0], recentDstLangs[1]];
            $('#dstLang1').addClass('active');
            refreshLangList();
        }
        else {
            $('#dstLang' + (recentDstLangs.indexOf(code) + 1)).addClass('active');
            persistChoices();
        }

        muteLanguages();
    });

    $('.srcLang').click(function () {
        curSrcLang = $(this).attr('data-code');
        $('.srcLang').removeClass('active');
        $(this).addClass('active');
        refreshLangList(true);
        muteLanguages();
    });

    $('.dstLang').click(function () {
        curDstLang = $(this).attr('data-code');
        $('.dstLang').removeClass('active');
        $(this).addClass('active');
        refreshLangList();
        muteLanguages();
    });

    $('#translate').click(function () {
        translate();
    });

    keyCodes = [32, 190, 191, 49, 59, 13]
    $("#originalText").keyup(function (event) {
        if (keyCodes.indexOf(event.keyCode) !== -1)
            translate();
    });

    $("#originalText").submit(function () {
        translate();
    });

    $('#detect').click(function () {
        $('.srcLang').removeClass('active');
        $(this).addClass('active');
        detectLanguage();
    });

    $('#swap').click(function () {
        var srcCode = $('.srcLang.active').attr('data-code'), dstCode = $('.dstLang.active').attr('data-code');
        curSrcLang = dstCode;
        curDstLang = srcCode;

        if(recentSrcLangs.indexOf(curSrcLang) !== -1) {
            $('.srcLang').removeClass('active');
            $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
        }
        else
            recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;

        if(recentDstLangs.indexOf(curDstLang) !== -1) {
            $('.dstLang').removeClass('active');
            $('#dstLang' + (recentDstLangs.indexOf(curDstLang) + 1)).addClass('active');
        }
        else
            recentDstLangs[recentDstLangs.indexOf(dstCode)] = curDstLang;

        refreshLangList(true);
        muteLanguages();

        if($('.active > #detectedText')) {
            $('.srcLang').removeClass('active');
            $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
        }
    });
});

function getPairs () {
    var deferred = $.Deferred();
    $.jsonp({
        url: APY_URL + '/list?q=pairs',
        beforeSend: ajaxSend,
        success: function (data) {
            var srcLangsObj = {}, dstLangsObj = {};
            $.each(data['responseData'], function (i, pair) {
                srcLangsObj[pair.sourceLanguage] = undefined;
                dstLangsObj[pair.targetLanguage] = undefined;

                if(pairs[pair.sourceLanguage])
                    pairs[pair.sourceLanguage].push(pair.targetLanguage);
                else
                    pairs[pair.sourceLanguage] = [pair.targetLanguage];
            });
            srcLangs = Object.keys(srcLangsObj).sort();
            dstLangs = Object.keys(dstLangsObj).sort();

            curSrcLang = srcLangs[0];
            curDstLang = dstLangs[0];
            for(var i = 0; i < 3; i++) {
                recentSrcLangs.push(i < srcLangs.length ? srcLangs[i] : undefined);
                recentDstLangs.push(i < dstLangs.length ? dstLangs[i] : undefined);
            }

            restoreChoices();
            refreshLangList();
            populateTranslationList();
        },
        error: function () {
            $('#translatedText').text(notAvailableText);
        },
        complete: function () {
            ajaxComplete();
            deferred.resolve();
        }
    });
    return deferred.promise();
}

function refreshLangList (resetDetect) {
    persistChoices();

    recentSrcLangs = filterLangList(recentSrcLangs, srcLangs);
    recentDstLangs = filterLangList(recentDstLangs, dstLangs);

    for(var i = 0; i < 3; i++) {
        if(i < recentSrcLangs.length && recentSrcLangs[i])
            $('#srcLang' + (i + 1)).attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i]));
        if(i < recentDstLangs.length && recentDstLangs[i])
            $('#dstLang' + (i + 1)).attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i]));
    }

    if($('#detectedText').parent('.srcLang').attr('data-code'))
        $('#detectedText').text(getLangByCode($('#detectedText').parent('.srcLang').attr('data-code')) + ' - ' + detectedText);

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }
}

function persistChoices () {
    if(localStorage) {
        objects = {
            'recentSrcLangs': recentSrcLangs,
            'recentDstLangs': recentDstLangs,
            'curSrcLang': curSrcLang,
            'curDstLang': curDstLang,
            'curSrcChoice': $('.srcLang.active').prop('id'),
            'curDstChoice': $('.dstLang.active').prop('id'),
        };

        for(var name in objects)
            store(name, objects[name]);
    }

    function store (name, obj) {
        localStorage[name] = JSON.stringify(obj);
    }
}

function restoreChoices () {
    if(localStorage) {
        if('recentSrcLangs' in localStorage && isSubset(retrieve('recentSrcLangs'), srcLangs)) {
            recentSrcLangs = retrieve('recentSrcLangs');
            curSrcLang = retrieve('curSrcLang');
            $('.srcLang').removeClass('active');
            $('#' + retrieve('curSrcChoice')).addClass('active');
        }
        if('recentDstLangs' in localStorage && isSubset(retrieve('recentDstLangs'), dstLangs)) {
            recentDstLangs = retrieve('recentDstLangs');
            curDstLang = retrieve('curDstLang');
            $('.dstLang').removeClass('active');
            $('#' + retrieve('curDstChoice')).addClass('active');
        }
        refreshLangList();
    }

    function retrieve (name) {
        return JSON.parse(localStorage[name]);
    }
}

function filterLangList (recentLangs, allLangs) {
    recentLangs = recentLangs.filter(onlyUnique);
    if(recentLangs.length < 3)
        for(var i = 0; i < allLangs.length; i++)
            if(recentLangs.length < 3 && recentLangs.indexOf(allLangs[i]) === -1)
                recentLangs.push(allLangs[i]);
    return recentLangs;
}

function populateTranslationList () {
    $('.languageName').remove();

    var srcLangsPerCol = Math.ceil(srcLangs.length / 3), dstLangsPerCol = Math.ceil(dstLangs.length / 3);

    for(var i = 0; i < srcLangs.length; i++) {
        var langCode = srcLangs[i], 
            colNum = Math.floor(i / srcLangsPerCol), 
            langName = getLangByCode(langCode);
        $($('#srcLanguages .col-sm-4')[colNum]).append($('<div class="languageName"></div>').attr('data-code', langCode).text(langName));
    }

    for(var i = 0; i < dstLangs.length; i++) {
        var langCode = dstLangs[i], 
            colNum = Math.floor(i / dstLangsPerCol), 
            langName = getLangByCode(langCode);
        $($('#dstLanguages .col-sm-4')[colNum]).append($('<div class="languageName"></div>').attr('data-code', langCode).text(langName));
    }

    muteLanguages();
}

function translate () {
    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
        $.jsonp({
            url: APY_URL + '/translate',
            beforeSend: ajaxSend,
            complete: ajaxComplete,
            data: {
                'langpair': curSrcLang + '|' + curDstLang,
                'q': $('#originalText').val(),
            },
            success: function (data) {
                if (data.responseStatus == 200)
                    $('#translatedText').text(data.responseData.translatedText);
                else
                    translationNotAvailable();
            },
            error: translationNotAvailable
        });
    }
    else
        translationNotAvailable();
}

function detectLanguage () {
    $.jsonp({
        url: APY_URL + '/identifyLang',
        beforeSend: ajaxSend,
        complete: ajaxComplete,
        data: {
            'q': $('#originalText').val(),
        },
        success: function (data) {
            possibleLanguages = []
            for(var lang in data)
                possibleLanguages.push([lang.indexOf('-') != -1 ? lang.split('-')[0] : lang, data[lang]])
            possibleLanguages.sort(function(a, b) {
                return b[1] - a[1];
            });

            oldSrcLangs = recentSrcLangs;
            recentSrcLangs = [];
            for(var i = 0; i < possibleLanguages.length; i++)
                if(recentSrcLangs.length < 3 && recentSrcLangs.indexOf(possibleLanguages[i][0]) === -1)
                    recentSrcLangs.push(possibleLanguages[i][0]);
            recentSrcLangs = recentSrcLangs.concat(oldSrcLangs);
            if(recentSrcLangs.length > 3)
                recentSrcLangs = recentSrcLangs.slice(0, 3);

            curSrcLang = recentSrcLangs[0];
            muteLanguages();
            
            $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
            refreshLangList();
            $('#detectedText').show();
            $('#detectText').hide();
        },
        error: function () {
            $('#srcLang1').click();
        },
    });
}

function translationNotAvailable () {
    $('#translatedText').text(notAvailableText);
}

function muteLanguages () {
    $('.languageName.text-muted').removeClass('text-muted');
    $.each($('#dstLanguages .languageName'), function(i, element) {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(element).attr('data-code')) == -1)
            $(element).addClass('text-muted');
    });
}
