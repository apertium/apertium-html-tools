/*
TODO: (in some order)
1) Mobile version (!!!)
2) Deal with languages having multiple iso codes (ugh...)
3) Save choices in cookie?
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
            recentSrcLangs = [code, recentSrcLangs[0], recentSrcLangs[1]]
            refreshLangList(true);
            $('#srcLang1').addClass('active');
        }
        else
            $('#srcLang' + (recentSrcLangs.indexOf(code) + 1)).addClass('active');
        
        muteLanguages();
    });

    $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
        var code = $(this).attr('data-code');
        curDstLang = code;
        
        $('.dstLang').removeClass('active');
        if(recentDstLangs.indexOf(code) === -1) {
            recentDstLangs = [code, recentDstLangs[0], recentDstLangs[1]]
            refreshLangList();
            $('#dstLang1').addClass('active');
        }
        else
            $('#dstLang' + (recentDstLangs.indexOf(code) + 1)).addClass('active');

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
        recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;
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
    $.ajax({
        url: APY_URL + '/list?q=pairs',
        type: "GET",
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

function refreshLangList (resetDetect) {
    for(var i = 0; i < 3; i++) {
        if(i < recentSrcLangs.length && recentSrcLangs[i])
            $('#srcLang' + (i + 1)).attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i]));
        if(i < recentDstLangs.length && recentDstLangs[i])
            $('#dstLang' + (i + 1)).attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i]));
    }

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }
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

function detectLanguage () {
    $.ajax({
        url: APY_URL + '/identifyLang',
        type: "GET",
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

            for(var i = 2; i >= 0; i--)
                if(i < possibleLanguages.length)
                    recentSrcLangs.unshift(possibleLanguages[i][0]);
            if(recentSrcLangs.length > 3)
                recentSrcLangs = recentSrcLangs.slice(0, 3);

            refreshLangList();
            curSrcLang = recentSrcLangs[0];
            muteLanguages();

            $('#detectedText').text(getLangByCode(curSrcLang) + ' - detected') //TODO: localize
            $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
            $('#detectedText').show();
            $('#detectText').hide();
        },
        dataType: 'jsonp',
        failure: function () {
            $('#srcLang1').click();
        },
        beforeSend: ajaxSend,
        complete: ajaxComplete
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