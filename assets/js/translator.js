/*
TODO: (in some order)
1) Make detect language work,
2) Mobile version (!!!)
3) Why is Tatar showing up twice?? 
4) Deal with languages having multiple iso codes (ugh...)
5) Save choices in cookie?
6) Adapting width of dropdown?
*/

var pairs = {};
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];

$(document).ready(function () {
    $('#srcLanguages').on('click', '.languageName', function () {
        var code = $(this).attr('data-code');
        curSrcLang = code;

        $('.srcLang').removeClass('active');
        if(recentSrcLangs.indexOf(code) === -1) {
            recentSrcLangs = [code, recentSrcLangs[0], recentSrcLangs[1]]
            refreshLangList();
            $('#srcLang1').addClass('active');
        }
        else {
            $('#srcLang' + (recentSrcLangs.indexOf(code) + 1)).addClass('active');
        }
        
        muteLanguages();
    });

    $('#dstLanguages').on('click', '.languageName', function () {
        var code = $(this).attr('data-code');
        curDstLang = code;
        
        $('.dstLang').removeClass('active');
        if(recentDstLangs.indexOf(code) === -1) {
            recentDstLangs = [code, recentDstLangs[0], recentDstLangs[1]]
            refreshLangList();
            $('#dstLang1').addClass('active');
        }
        else {
            $('#dstLang' + (recentDstLangs.indexOf(code) + 1)).addClass('active');
        }

        muteLanguages();
    });

    $('.srcLang').click(function () {
        curSrcLang = $(this).attr('data-code');
        $('.srcLang').removeClass('active');
        $(this).addClass('active');
        muteLanguages();
    });

    $('.dstLang').click(function () {
        curDstLang = $(this).attr('data-code');
        $('.dstLang').removeClass('active');
        $(this).addClass('active');
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
});

function getPairs () {
    var deferred = $.Deferred();
    $.ajax({
        url: APY_URL + '/list?q=pairs',
        type: "GET",
        success: function (data) {
            $.each(data['responseData'], function (i, pair) {
                srcLangs[i] = pair.sourceLanguage;
                dstLangs[i] = pair.targetLanguage;

                if(pairs[pair.sourceLanguage])
                    pairs[pair.sourceLanguage].push(pair.targetLanguage);
                else
                    pairs[pair.sourceLanguage] = [pair.targetLanguage];
            });
            srcLangs = $.unique(srcLangs).sort();
            dstLangs = $.unique(dstLangs).sort();

            curSrcLang = srcLangs[0];
            curDstLang = dstLangs[0];
            refreshLangList();
            for(var i = 0; i < 3; i++) {
                recentSrcLangs.push(i < srcLangs.length ? srcLangs[i] : undefined);
                recentDstLangs.push(i < dstLangs.length ? dstLangs[i] : undefined);
            }
                
            populateTranslationList();
        },
        dataType: 'jsonp',
        failure: function () {
            $('#translatedText').text(notAvailableText);
        },
        beforeSend: ajaxSend,
        complete: function () {
            ajaxComplete();
            deferred.resolve();
        }
    });
    return deferred.promise();
}

function refreshLangList () {
    for(var i = 0; i < 3; i++) {
        if(i < recentSrcLangs.length && recentSrcLangs[i])
            $('#srcLang' + (i + 1)).attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i], localizedLanguageNames));
        if(i < recentDstLangs.length && recentDstLangs[i])
            $('#dstLang' + (i + 1)).attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i], localizedLanguageNames));
    }
}

function populateTranslationList () {
    $('.languageName').remove();

    var srcLangsPerCol = Math.floor(srcLangs.length / 3), dstLangsPerCol = Math.floor(dstLangs.length / 3);

    for(var i = 0; i < 3; i++)
        for(var j = 0; j < srcLangsPerCol; j++) {
            var index = i * srcLangsPerCol + j;
            if(index < srcLangs.length) {
                var langCode = srcLangs[index];
                $($('#srcLanguages .col-sm-4')[i]).append($('<div class="languageName"></div>').attr('data-code', langCode).text(getLangByCode(langCode, localizedLanguageNames)));
            }
        }

    for(var i = 0; i < 3; i++)
        for(var j = 0; j < dstLangsPerCol; j++) {
            var index = i * dstLangsPerCol + j;
            if(index < dstLangs.length) {
                var langCode = dstLangs[index];
                $($('#dstLanguages .col-sm-4')[i]).append($('<div class="languageName"></div>').attr('data-code', langCode).text(getLangByCode(langCode, localizedLanguageNames)));
            }
        }
    muteLanguages();
}

function translate () {
    if(pairs[curSrcLang].indexOf(curDstLang) !== -1) {
        $.ajax({
            url: APY_URL + '/translate',
            type: "GET",
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
            dataType: 'jsonp',
            failure: translationNotAvailable,
            beforeSend: ajaxSend,
            complete: ajaxComplete
        });
    }
    else
        translationNotAvailable();
}

function translationNotAvailable () {
    $('#translatedText').text(notAvailableText);
}

function muteLanguages () {
    $('.languageName.text-muted').removeClass('text-muted');
    $.each($('#dstLanguages .languageName'), function(i, element) {
        if(pairs[curSrcLang].indexOf($(element).attr('data-code')) == -1)
            $(element).addClass('text-muted');
    });
}