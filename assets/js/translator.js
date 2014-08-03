var pairs = {};
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];

if(modeEnabled('translation')) {
    $(document).ready(function () {
        $('#srcLanguages').on('click', '.languageName:not(.text-muted)', function () {
            curSrcLang = $(this).attr('data-code');
            handleNewCurrentLang(curSrcLang, recentSrcLangs, 'srcLang');
        });

        $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
            curDstLang = $(this).attr('data-code');
            handleNewCurrentLang(curDstLang, recentDstLangs, 'dstLang');
        });

        $('.srcLang').click(function () {
            curSrcLang = $(this).attr('data-code');
            $('.srcLang').removeClass('active');
            $(this).addClass('active');
            refreshLangList(true);
            muteLanguages();
            localizeInterface();
            if($('div#translateText').is(":visible"))
                translate();
        });

        $('.dstLang').click(function () {
            curDstLang = $(this).attr('data-code');
            $('.dstLang').removeClass('active');
            $(this).addClass('active');
            refreshLangList();
            muteLanguages();
            localizeInterface();
            if($('div#translateText').is(":visible"))
                translate();
        });

        $('button#translate').click(function () {
            if($('div#translateText').is(":visible"))
                translate();
            else
                translateDoc();
        });

        var timer, timeout = 1000;
        $('#originalText').on('keyup paste', function (event) {
            if(timer && $('#instantTranslation').prop('checked'))
                clearTimeout(timer);
            timer = setTimeout(function () {
                if($('#instantTranslation').prop('checked'))
                    translate();
            }, timeout);
        });

        $('#instantTranslation').change(function () {
            persistChoices('translator');
        });

        $('#originalText').on('input propertychange', function () {
            persistChoices('translator');
        });

        $('#originalText').submit(function () {
            translate();
        });

        $('.clearButton').click(function () {
            $(this).blur().siblings('textarea').val('');
        });

        $('#detect').click(function () {
            $('.srcLang').removeClass('active');
            $(this).addClass('active');
            detectLanguage();
            translate();
        });

        $('.swapLangBtn').click(function () {
            var srcCode = $('.srcLang.active').attr('data-code'), dstCode = $('.dstLang.active').attr('data-code');
            curSrcLang = dstCode;
            curDstLang = srcCode;

            if(recentSrcLangs.indexOf(curSrcLang) !== -1) {
                $('.srcLang').removeClass('active');
                $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
                $('#srcLangSelect').val(curSrcLang);
            }
            else
                recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;

            if(recentDstLangs.indexOf(curDstLang) !== -1) {
                $('.dstLang').removeClass('active');
                $('#dstLang' + (recentDstLangs.indexOf(curDstLang) + 1)).addClass('active');
                $('#dstLangSelect').val(curDstLang);
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

        $('#srcLangSelect').change(function () {
            var selectValue = $(this).val();
            if(selectValue === 'detect') {
                detectLanguage();
                translate();
            }
            else
                handleNewCurrentLang(curSrcLang = $(this).val(), recentSrcLangs, 'srcLang', true);
        });

        $('#dstLangSelect').change(function () {
            handleNewCurrentLang(curDstLang = $(this).val(), recentDstLangs, 'dstLang', true);
        });

        $('button#translateDoc').click(function () {
            $('div#translateText').fadeOut('fast', function () {
                $('div#translateDoc').fadeIn('fast');
            });
        });

        $('button#cancelDocTranslate').click(function () {
            $('div#translateDoc').fadeOut('fast', function () {
                $('div#translateText').fadeIn('fast');
            });
        });

        $('input#fileInput').change(function () {
            $('div#fileUploadProgress').parent().fadeOut('fast', function () {
                $('span#uploadError').fadeOut('fast');
            });
            $('a#fileDownload').fadeOut('fast');
        });
    });
}

function getPairs() {
    var deferred = $.Deferred();

    if(config.PAIRS) {
        handlePairs(config.PAIRS.responseData);
        deferred.resolve();
    }
    else {
        var pairData = readCache('pairs', 'LIST_REQUEST');
        if(pairData) {
            handlePairs(pairData);
            deferred.resolve();
        }
        else {
            console.error('Translation pairs cache ' + (pairs === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=pairs',
                beforeSend: ajaxSend,
                success: function (data) {
                    handlePairs(data.responseData);
                    cache('pairs', data.responseData);
                },
                error: function () {
                    console.error('Failed to get available translation language pairs');
                    translationNotAvailable();
                },
                complete: function () {
                    ajaxComplete();
                    deferred.resolve();
                }
            });
        }
    }

    function handlePairs(pairData) {
        $.each(pairData, function (i, pair) {
            srcLangs.push(pair.sourceLanguage);
            dstLangs.push(pair.targetLanguage);

            if(pairs[pair.sourceLanguage])
                pairs[pair.sourceLanguage].push(pair.targetLanguage);
            else
                pairs[pair.sourceLanguage] = [pair.targetLanguage];
        });
        srcLangs = filterLangList(srcLangs.filter(onlyUnique));
        dstLangs = filterLangList(dstLangs.filter(onlyUnique));

        curSrcLang = srcLangs[0];
        curDstLang = dstLangs[0];
        for(var i = 0; i < 3; i++) {
            recentSrcLangs.push(i < srcLangs.length ? srcLangs[i] : undefined);
            recentDstLangs.push(i < dstLangs.length ? dstLangs[i] : undefined);
        }

        populateTranslationList();
        restoreChoices('translator');

        var pair = getURLParam('dir');
        if(pair) {
            pair = pair.split('-');
            pair[0] = iso639CodesInverse[pair[0]] ? iso639CodesInverse[pair[0]] : pair[0];
            pair[1] = iso639CodesInverse[pair[1]] ? iso639CodesInverse[pair[1]] : pair[1];
            if(pairs[pair[0]] && pairs[pair[0]].indexOf(pair[1]) !== -1) {
                handleNewCurrentLang(curSrcLang = pair[0], recentSrcLangs, 'srcLang');
                handleNewCurrentLang(curDstLang = pair[1], recentDstLangs, 'dstLang');
            }
        }

        refreshLangList();
    }

    return deferred.promise();
}

function handleNewCurrentLang(lang, recentLangs, langType, resetDetect) {
    $('.' + langType).removeClass('active');
    if(recentLangs.indexOf(lang) === -1) {
        recentLangs.unshift(lang);
        $('#' + langType + '1').addClass('active');
        refreshLangList(resetDetect);
    }
    else {
        $('#' + langType + (recentLangs.indexOf(lang) + 1)).addClass('active');
        persistChoices('translator');
    }

    $('select#' + langType + 'Select').val(lang);
    if(resetDetect && recentLangs.indexOf(lang) !== -1)
        refreshLangList(resetDetect);

    muteLanguages();
    localizeInterface();
    translate();
}

function refreshLangList(resetDetect) {
    recentSrcLangs = filterLangList(recentSrcLangs, srcLangs);
    recentDstLangs = filterLangList(recentDstLangs, dstLangs);

    persistChoices('translator');

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

    function filterLangList(recentLangs, allLangs) {
        recentLangs = recentLangs.filter(onlyUnique);
        if(recentLangs.length < 3)
            for(var i = 0; i < allLangs.length; i++)
                if(recentLangs.length < 3 && recentLangs.indexOf(allLangs[i]) === -1)
                    recentLangs.push(allLangs[i]);
        if(recentLangs.length > 3)
            recentLangs = recentLangs.slice(0, 3);
        return recentLangs;
    }
}

function populateTranslationList() {
    sortTranslationList();
    $('.languageName').remove();
    $('.languageCol').show().removeClass('col-sm-3 col-sm-4 col-sm-6 col-sm-12');

    var numSrcCols = Math.ceil(srcLangs.length / 8) < 5 ? Math.ceil(srcLangs.length / 8) : 4,
        numDstCols = Math.ceil(dstLangs.length / 8) < 5 ? Math.ceil(dstLangs.length / 8) : 4;
    var srcLangsPerCol = Math.ceil(srcLangs.length / numSrcCols),
        dstLangsPerCol = Math.ceil(dstLangs.length / numDstCols);

    $('#srcLanguages').css('min-width', Math.floor(650 * (numSrcCols / 4)) + 'px');
    $('#srcLanguages .languageCol').addClass('col-sm-' + (12 / numSrcCols));
    $('#srcLanguages .languageCol:gt(' + (numSrcCols - 1) + ')').hide();

    $('#dstLanguages').css('min-width', Math.floor(650 * (numDstCols / 4)) + 'px');
    $('#dstLanguages .languageCol').addClass('col-sm-' + (12 / numDstCols));
    $('#dstLanguages .languageCol:gt(' + (numDstCols - 1) + ')').hide();

    for(var i = 0; i < numSrcCols; i++) {
        var numSrcLang = Math.ceil(srcLangs.length / numSrcCols) * i;
        for(var j = numSrcLang; j < numSrcLang + srcLangsPerCol; j++)
            if(numSrcLang < srcLangs.length) {
                var langCode = srcLangs[j], langName = getLangByCode(langCode);
                $('#srcLanguages .languageCol:eq(' + i + ')').append($('<div class="languageName"></div>').attr('data-code', langCode).text(langName));
            }
    }

     for(var i = 0; i < numDstCols; i++) {
        var numDstLang = Math.ceil(dstLangs.length / numDstCols) * i;
        for(var j = numDstLang; j < numDstLang + dstLangsPerCol; j++)
            if(numDstLang < dstLangs.length) {
                var langCode = dstLangs[j], langName = getLangByCode(langCode);
                $('#dstLanguages .languageCol:eq(' + i + ')').append($('<div class="languageName"></div>').attr('data-code', langCode).text(langName));
            }
    }

    $('.langSelect option[value!=detect]').remove();
    $.each(srcLangs, function () {
        $('#srcLangSelect').append($('<option></option>').prop('value', this).text(getLangByCode(this)));
    });
    $.each(dstLangs, function () {
        $('#dstLangSelect').append($('<option></option>').prop('value', this).text(getLangByCode(this)));
    });

    $('#srcLangSelect').val(curSrcLang);
    $('#dstLangSelect').val(curDstLang);

    muteLanguages();

    function sortTranslationList() {
        var sortLocale = locale in iso639Codes ? iso639Codes[locale] : locale;

        srcLangs = srcLangs.sort(function (a, b) {
            return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
        });

        dstLangs = dstLangs.sort(function (a, b) {
            return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
        });
    }
}

function translate() {
    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
        sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, $('#originalText').val().length);
        $.jsonp({
            url: config.APY_URL + '/translate',
            beforeSend: ajaxSend,
            complete: ajaxComplete,
            data: {
                'langpair': curSrcLang + '|' + curDstLang,
                'q': $('#originalText').val()
            },
            success: function (data) {
                if(data.responseStatus === 200) {
                    $('#translatedText').html(data.responseData.translatedText);
                    $('#translatedText').removeClass('notAvailable');
                }
                else
                    translationNotAvailable();
            },
            error: translationNotAvailable
        });
    }
    else
        translationNotAvailable();
}

function translateDoc() {
    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1 && $('input#fileInput')[0].files.length === 1) {
        if($('input#fileInput')[0].files.length !== 0 && $('input#fileInput')[0].files[0].length !== 0)
        var file = $('input#fileInput')[0].files[0];
        if(file.size > 32E6)
            docTranslateError(fileTooLargeText, 'File_Too_Large');
        else {
            var allowedMimeTypes = [
                'text/plain', 'text/html',
                'text/rtf', 'application/rtf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                // 'application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'
                'application/vnd.oasis.opendocument.text',
                'application/x-latex', 'application/x-tex'
            ];

            if(allowedMimeTypes.indexOf(file.type) !== -1) {
                $('span#uploadError').fadeOut('fast');
                $('a#fileDownload').hide();
                $('span#uploadError').hide();
                $('input#fileInput').prop('disabled', true);
                $('button#translate').prop('disabled', true);

                var xhr = new XMLHttpRequest({mozSystem: true});
                xhr.addEventListener('progress', updateProgressBar, false);
                xhr.responseType = 'blob';
                if(xhr.upload)
                    xhr.upload.onprogress = updateProgressBar;
                xhr.onreadystatechange = function (ev) {
                    if(this.readyState === 3) {
                        $('div#fileLoading').fadeIn('fast');
                        $('div#fileUploadProgress').parent().fadeIn('fast', function () {
                            updateProgressBar({'loaded': 1, 'total': 1});
                        });
                    }
                    else if(this.readyState === 4 && xhr.status === 200) {
                        $('div#fileUploadProgress').parent().fadeOut('fast');
                        $('div#fileLoading').fadeOut('fast', function() {
                            $('a#fileDownload').attr('href', (window.webkitURL ? webkitURL : URL).createObjectURL(xhr.response)).attr('download', file.name).fadeIn('fast');
                            $('a#fileDownload span#fileName').text(file.name);
                            $('button#translate').prop('disabled', false);
                            $('input#fileInput').prop('disabled', false);
                        });
                    }
                    else if(this.status >= 400)
                        docTranslateError(notAvailableText);
                };
                xhr.onerror = function () {
                    docTranslateError(notAvailableText);
                };

                $('div#fileUploadProgress').parent().fadeIn('fast');
                xhr.open('post', config.APY_URL + '/translateDoc', true);
                var fileData = new FormData();
                fileData.append('langpair', curSrcLang + '|' + curDstLang);
                fileData.append('file', file);
                xhr.send(fileData);
                sendEvent('translator', 'translateDoc', curSrcLang + '-' + curDstLang, file.size);
            }
            else
                docTranslateError(formatNotSupportedText, 'Format_Not_Supported');
        }

        function updateProgressBar(ev) {
            var done = ev.position || ev.loaded, total = ev.totalSize || ev.total;
            var percentDone = Math.floor(done / total * 1000) / 10;
            $('div#fileUploadProgress').attr('aria-valuenow', percentDone).css('width', percentDone + '%');
        }
    }
    else
        docTranslateError(notAvailableText);

    function docTranslateError(errorMessage, errorTextName) {
        $('div#fileUploadProgress').parent().fadeOut('fast', function () {
            $('span#uploadError').text(errorMessage).attr('data-text', errorTextName).fadeIn('fast');
        });
        $('a#fileDownload').fadeOut('fast');
        $('div#fileLoading').fadeOut('fast');
        $('button#translate').prop('disabled', false);
        $('input#fileInput').prop('disabled', false);
        console.error(errorMessage);
    }
}

function detectLanguage() {
    $.jsonp({
        url: config.APY_URL + '/identifyLang',
        beforeSend: ajaxSend,
        complete: ajaxComplete,
        data: {
            'q': $('#originalText').val()
        },
        success: function (data) {
            var possibleLanguages = [];
            for(var lang in data)
                possibleLanguages.push([lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang, data[lang]]);
            possibleLanguages.sort(function (a, b) {
                return b[1] - a[1];
            });

            oldSrcLangs = recentSrcLangs;
            recentSrcLangs = [];
            for(var i = 0; i < possibleLanguages.length; i++)
                if(recentSrcLangs.length < 3 && possibleLanguages[i][0] in pairs)
                    recentSrcLangs.push(possibleLanguages[i][0]);
            recentSrcLangs = recentSrcLangs.concat(oldSrcLangs);
            if(recentSrcLangs.length > 3)
                recentSrcLangs = recentSrcLangs.slice(0, 3);

            curSrcLang = recentSrcLangs[0];
            $('#srcLangSelect').val(curSrcLang);
            muteLanguages();

            $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
            refreshLangList();
            $('#detectedText').show();
            $('#detectText').hide();
        },
        error: function () {
            $('#srcLang1').click();
        }
    });
}

function translationNotAvailable() {
    $('#translatedText').text(notAvailableText);
    $('#translatedText').addClass('notAvailable');
}

function muteLanguages() {
    $('.languageName.text-muted').removeClass('text-muted');
    $('.dstLang').removeClass('disabledLang').prop('disabled', false);

    $.each($('#dstLanguages .languageName'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1)
            $(this).addClass('text-muted');
    });
    $.each($('.dstLang'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1)
            $(this).addClass('disabledLang').prop('disabled', true);
    });

    $.each($('#dstLangSelect option'), function(i, element) {
        $(element).prop('disabled', !pairs[curSrcLang] || pairs[curSrcLang].indexOf($(element).val()) === -1);
    });
}
