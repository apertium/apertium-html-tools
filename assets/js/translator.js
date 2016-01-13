var pairs = {};
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];
var droppedFile;
var textTranslateRequest;

if(modeEnabled('translation')) {
    $(document).ready(function () {
        $('#srcLanguages').on('click', '.languageName:not(.text-muted)', function () {
            curSrcLang = $(this).attr('data-code');
            handleNewCurrentLang(curSrcLang, recentSrcLangs, 'srcLang');

            autoSelectDstLang();
        });

        $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
            curDstLang = $(this).attr('data-code');
            handleNewCurrentLang(curDstLang, recentDstLangs, 'dstLang');
        });

        $('.srcLang').click(function () {
            curSrcLang = $(this).attr('data-code');
            $('.srcLang').removeClass('active');
            $(this).addClass('active');
            populateTranslationList();
            refreshLangList(true);
            muteLanguages();
            localizeInterface();
            translateText();

            autoSelectDstLang();
        });

        $('.dstLang').click(function () {
            curDstLang = $(this).attr('data-code');
            $('.dstLang').removeClass('active');
            $(this).addClass('active');
            refreshLangList();
            muteLanguages();
            localizeInterface();
            translateText();
        });

        $('button#translate').click(function () {
            translate();
            persistChoices('translator', true);
        });

        var timer,
            lastPunct = false, punct = [46, 33, 58, 63, 47, 45, 190, 171, 49],
            timeoutPunct = 1000, timeoutOther = 3000;
        $('#originalText').on('keyup paste', function (event) {
            if(lastPunct && event.keyCode === 32 || event.keyCode === 13) {
                // Don't override the short timeout for simple space-after-punctuation
                return;
            }

            if(timer && $('#instantTranslation').prop('checked'))
                clearTimeout(timer);

            var timeout;
            if(punct.indexOf(event.keyCode) !== -1) {
                timeout = timeoutPunct;
                lastPunct = true;
            }
            else {
                timeout = timeoutOther;
                lastPunct = false;
            }

            timer = setTimeout(function () {
                if($('#instantTranslation').prop('checked')) {
                    translateText();
                }
                persistChoices('translator', true);
            }, timeout);
        });

        $('#originalText').blur(function() {
            persistChoices('translator', true);
        });

        $('#instantTranslation').change(function () {
            persistChoices('translator');
        });

        $('#originalText').on('input propertychange', function () {
            persistChoices('translator');
        });

        $('#originalText').submit(function () {
            translateText();
        });

        $('.clearButton').click(function () {
            $(this).blur().siblings('textarea').val('');
        });

        $('#detect').click(function () {
            $('.srcLang').removeClass('active');
            $(this).addClass('active');
            detectLanguage();
            translateText();
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
                translateText();
            }
            else
                handleNewCurrentLang(curSrcLang = $(this).val(), recentSrcLangs, 'srcLang', true);
        });

        $('#dstLangSelect').change(function () {
            handleNewCurrentLang(curDstLang = $(this).val(), recentDstLangs, 'dstLang', true);
        });

        $('button#translateDoc').click(function () {
            $('div#translateText').fadeOut('fast', function () {
                $('#fileInput').show();
                $('div#fileName').hide();
                $('div#docTranslation').fadeIn('fast');
            });
        });

        $('button#cancelDocTranslate').click(function () {
            droppedFile = undefined;
            $('div#docTranslation').fadeOut('fast', function () {
                $('a#fileDownload').hide();
                $('span#uploadError').hide();
                $('div#translateText').fadeIn('fast');
                $('input#fileInput').wrap('<form>').closest('form').get(0).reset();
                $('input#fileInput').unwrap();
            });
        });

        $('input#fileInput').change(function () {
            $('div#fileUploadProgress').parent().fadeOut('fast', function () {
                $('span#uploadError').fadeOut('fast');
            });
            $('a#fileDownload').fadeOut('fast');
        });

        $('body').on('dragover', function (ev) {
            ev.preventDefault();
            return false;
        });
        $('body').on('dragenter', function (ev) {
            ev.preventDefault();
            if(!$('div#fileDropBackdrop:visible').length) {
                $('div#fileDropBackdrop').fadeTo(400, 0.5);
                $('div#fileDropMask').on('drop', function (ev) {
                    ev.preventDefault();
                    droppedFile = ev.originalEvent.dataTransfer.files[0];

                    $('#fileDropBackdrop').fadeOut();
                    if(!$('div#docTranslation').is(":visible")) {
                        $('div#translateText').fadeOut('fast', function () {
                            $('input#fileInput').hide();
                            $('div#docTranslation').fadeIn('fast');

                            if(droppedFile) {
                                $('div#fileName').show().text(droppedFile.name);
                                translateDoc();
                            }
                        });
                    }
                    else
                        $('input#fileInput').fadeOut('fast', function () {
                            if(droppedFile) {
                                $('div#fileName').show().text(droppedFile.name);
                                translateDoc();
                            }
                        });

                    return false;
                });
                $('div#fileDropMask').on('dragleave', function () {
                    $('div#fileDropBackdrop').fadeOut();
                });
            }
            return false;
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

    populateTranslationList();
    muteLanguages();
    localizeInterface();
    translateText();
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
        $('#detectedText').text(getLangByCode($('#detectedText').parent('.srcLang').attr('data-code')) + ' - ' + dynamicLocalizations['detected']);

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
            var aPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(a) !== -1,
                bPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(b) !== -1;

            if((aPossible && bPossible) || (!aPossible && !bPossible)) {
                return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
            }
            else if(aPossible && !bPossible) {
                return -1;
            }
            else
                return 1;
        });
    }
}

function translate() {
    if($('div#translateText').is(":visible"))
        translateText();
    else
        translateDoc();
}

function translateText() {
    if($('div#translateText').is(":visible")) {
        if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
            sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, $('#originalText').val().length);
            if(textTranslateRequest) {
                textTranslateRequest.abort();
            }
            textTranslateRequest = $.jsonp({
                url: config.APY_URL + '/translate',
                beforeSend: ajaxSend,
                complete: function() {
                    ajaxComplete();
                    textTranslateRequest = undefined;
                },
                data: {
                    'langpair': curSrcLang + '|' + curDstLang,
                    'q': $('#originalText').val()
                },
                success: function (data) {
                    if(data.responseStatus === 200) {
                        $('#translatedText').html(data.responseData.translatedText);
                        $('#translatedText').removeClass('notAvailable text-danger');
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
}

function translateDoc() {
    var validPair = pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1,
        validFile = droppedFile !== undefined || $('input#fileInput')[0].files.length === 1;
    if(validPair && validFile) {
        var file;
        if(droppedFile === undefined) {
            if($('input#fileInput')[0].files.length !== 0 && $('input#fileInput')[0].files[0].length !== 0)
                file = $('input#fileInput')[0].files[0];
        }
        else
            file = droppedFile;

        if(file.size > 32E6)
            docTranslateError(dynamicLocalizations['File_Too_Large'], 'File_Too_Large');
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
                            var URL = window.URL || window.webkitURL;
                            $('a#fileDownload').attr('href', URL.createObjectURL(xhr.response)).attr('download', file.name).fadeIn('fast');
                            $('span#fileDownloadText').text(dynamicLocalizations['Download_File'].replace('{{fileName}}', file.name));
                            $('button#translate').prop('disabled', false);
                            $('input#fileInput').prop('disabled', false);
                        });
                    }
                    else if(this.status >= 400)
                        docTranslateError(dynamicLocalizations['Not_Available']);
                };
                xhr.onerror = function () {
                    docTranslateError(dynamicLocalizations['Not_Available']);
                };

                updateProgressBar({'loaded': 0, 'total': 1});
                $('div#fileUploadProgress').parent().fadeIn('fast');
                xhr.open('post', config.APY_URL + '/translateDoc', true);
                xhr.responseType = 'blob';
                var fileData = new FormData();
                fileData.append('langpair', curSrcLang + '|' + curDstLang);
                fileData.append('file', file);
                xhr.send(fileData);
                sendEvent('translator', 'translateDoc', curSrcLang + '-' + curDstLang, file.size);
            }
            else
                docTranslateError(dynamicLocalizations['Format_Not_Supported'], 'Format_Not_Supported');
        }
    }
    else
        docTranslateError(dynamicLocalizations['Not_Available']);

    function updateProgressBar(ev) {
        var done = ev.loaded || ev.position, total = ev.total || ev.totalSize;
        var percentDone = Math.floor(done / total * 1000) / 10;
        $('div#fileUploadProgress').attr('aria-valuenow', percentDone).css('width', percentDone + '%');
    }

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
    if(textTranslateRequest) {
        textTranslateRequest.abort();
    }
    textTranslateRequest = $.jsonp({
        url: config.APY_URL + '/identifyLang',
        beforeSend: ajaxSend,
        complete: function() {
            ajaxComplete();
            textTranslateRequest = undefined;
        },
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
    $('#translatedText').text(dynamicLocalizations['Not_Available']);
    $('#translatedText').addClass('notAvailable text-danger');
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

function autoSelectDstLang() {
    if (pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) === -1) {
        var newDstLang;
        for (var i = 0; i < recentDstLangs.length; i++) {
            if (pairs[curSrcLang].indexOf(recentDstLangs[i]) !== -1) {
                newDstLang = recentDstLangs[i];
                break;
            }
        }
        if(!newDstLang) {
            newDstLang = pairs[curSrcLang][0];
        }

        if(recentDstLangs.indexOf(newDstLang) === -1) {
            handleNewCurrentLang(newDstLang, recentDstLangs, 'dstLang');
        }
        else {
            curDstLang = newDstLang;
            $('.dstLang').removeClass('active');
            refreshLangList();
            $('.dstLang[data-code=' + curDstLang + ']').addClass('active');
            muteLanguages();
            localizeInterface();
            translateText();
        }
    }
}
