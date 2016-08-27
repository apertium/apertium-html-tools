var pairs = {};
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];
var droppedFile;
var textTranslateRequest;
var currentSrc = "https://www.google.com/recaptcha/api.js?onload=recaptchaRenderCallback&render=explicit&hl=";

var TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH = 768,
    UPLOAD_FILE_SIZE_LIMIT = 32E6,
    TRANSLATION_LIST_WIDTH = 650,
    TRANSLATION_LIST_ROWS = 8,
    TRANSLATION_LIST_COLUMNS = 4;

/* exported getPairs */

if(modeEnabled('translation')) {
    $(document).ready(function () {
        synchronizeTextareaHeights();

        var localLang = iso639Codes[$('.localeSelect').val()];
        var newSrc = currentSrc + 'en';
        var backoff = false;

        for(var i = 0; i < localizeRecaptcha.length; i++) {
            if (localLang == localizeRecaptcha[i]) {
                newSrc = currentSrc + localLang;
                backoff = false;
                break
            }
            else {
                backoff = true;
            } 
        }

        if (backoff) {
            newSrc = currentSrc + localizeRecaptchaAlternative[localLang]; 
            }

        $('#recapscript').attr('src', newSrc);
        $('#recapscript').attr('async', '');
        $('#recapscript').attr('defer', ''); 

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
            // eslint-disable-next-line no-magic-numbers
            lastPunct = false, punct = [46, 33, 58, 63, 47, 45, 190, 171, 49],
            timeoutPunct = 1000, timeoutOther = 3000;
        $('#originalText').on('keyup paste', function (event) {
            if(lastPunct && (event.keyCode === SPACE_KEY_CODE || event.keyCode === ENTER_KEY_CODE)) {
                // Don't override the short timeout for simple space-after-punctuation
                return;
            }

            if(timer && $('#instantTranslation').prop('checked')) {
                clearTimeout(timer);
            }

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

            synchronizeTextareaHeights();
        });

        $(window).resize(synchronizeTextareaHeights);

        $('#originalText').blur(function () {
            persistChoices('translator', true);
        });

        $('#instantTranslation').change(function () {
            persistChoices('translator');
        });

        $('#markUnknown').change(function () {
            translate();
        });

        $('#originalText').on('input propertychange', function () {
            persistChoices('translator');
        });

        $('#originalText').submit(function () {
            translateText();
        });

        $('.clearButton').click(function () {
            $('#originalText, #translatedText').val('');
            $('#originalText').focus();
            synchronizeTextareaHeights();
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
            else {
                recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;
            }

            if(recentDstLangs.indexOf(curDstLang) !== -1) {
                $('.dstLang').removeClass('active');
                $('#dstLang' + (recentDstLangs.indexOf(curDstLang) + 1)).addClass('active');
                $('#dstLangSelect').val(curDstLang);
            }
            else {
                recentDstLangs[recentDstLangs.indexOf(dstCode)] = curDstLang;
            }

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
            else {
                handleNewCurrentLang(curSrcLang = $(this).val(), recentSrcLangs, 'srcLang', true);
            }
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
                $('input#fileInput').wrap('<form>').closest('form')[0].reset();
                $('input#fileInput').unwrap();
            });
        });

        $('input#fileInput').change(function () {
            $('div#fileUploadProgress').parent().fadeOut('fast', function () {
                $('span#uploadError').fadeOut('fast');
            });
            $('a#fileDownload').fadeOut('fast');
        });

        $('#translatedText').css('height', $('#originalText').css('height'));
        $('#suggestCloseBtn').click(function() {
            $('#suggestedWordInput').val('');
            grecaptcha.reset();
        });
        $('#suggestBtn').click(function() {
            var fromWord = $('#suggestionTargetWord').html();
            var toWord = $('#suggestedWordInput').val();
            var recaptchaResponse = grecaptcha.getResponse();

            if(toWord.length === 0) {
                $('#suggestedWordInput').tooltip('destroy');
                $('#suggestedWordInput').tooltip({
                    'title': 'Suggestion cannot be empty.',
                    'trigger': 'manual',
                    'placement': 'bottom'
                });
                $('#suggestedWordInput').tooltip('show')
                setTimeout(function() {
                    $('#suggestedWordInput').tooltip('hide');
                    $('#suggestedWordInput').tooltip('destroy');
                }, 3000);

                return;
            }

            // Obtaining context, (± config.SUGGESTIONS.context_wrap) words
            // fallback to complete text if this fails.
            var hashedWord = fromWord.hashCode() + fromWord + fromWord.hashCode();
            $('#wordGettingSuggested').text(hashedWord);

            var splitted = $('#translatedText').text().split(' ');
            $('#wordGettingSuggested').text(fromWord)

            var targetIndex = splitted.indexOf(hashedWord);
            var wrapLength = parseInt(config.SUGGESTIONS.context_wrap);
            var begin, end;
            begin  = (targetIndex > wrapLength) ? (targetIndex - wrapLength) : 0;
            end = (splitted.length - targetIndex - 1 > wrapLength) ? (targetIndex + wrapLength + 1) : splitted.length;
            
            var context = splitted.slice(begin, end).join(' ').replace(hashedWord, fromWord);
            if (!context) {
                context = $('#translatedText').attr('pristineText');
            }

            $.ajax({
                url: config.APY_URL + '/suggest',
                type: 'POST',
                beforeSend: ajaxSend,
                data: {
                    'langpair': curSrcLang + '|' + curDstLang,
                    'word': fromWord,
                    'newWord': toWord,
                    'context': context,
                    'g-recaptcha-response': recaptchaResponse
                },
                success: function (data) {
                    $('#suggestedWordInput').tooltip('hide');
                    $('#suggestedWordInput').tooltip('destroy');
                    $('#suggestedWordInput').val('');

                    $('#wordSuggestModal').modal('hide');
                },
                error: function (data) {
                    data = $.parseJSON(data.responseText);
                    $('#suggestedWordInput').tooltip('destroy');
                    $('#suggestedWordInput').tooltip({
                        'title': (data['explanation'] ? data['explanation'] : 'An error occurred'),
                        'trigger': 'manual',
                        'placement': 'bottom'
                    });
                    $('#suggestedWordInput').tooltip('show')
                    setTimeout(function() {
                        $('#suggestedWordInput').tooltip('hide');
                        $('#suggestedWordInput').tooltip('destroy');
                    }, 3000);
                },
                complete: function(){
                    ajaxComplete
                    grecaptcha.reset();
                }
            });
        });

        $('body').on('dragover', function (ev) {
            ev.preventDefault();
            return false;
        });
        $('body').on('dragenter', function (ev) {
            ev.preventDefault();
            if(!$('div#fileDropBackdrop:visible').length) {
                $('div#fileDropBackdrop').fadeTo('fast', 0.5);
                $('div#fileDropMask').on('drop', function (ev) {
                    ev.preventDefault();
                    droppedFile = ev.originalEvent.dataTransfer.files[0];

                    $('#fileDropBackdrop').fadeOut();
                    if(!$('div#docTranslation').is(':visible')) {
                        $('div#translateText').fadeOut('fast', function () {
                            $('input#fileInput').hide();
                            $('div#docTranslation').fadeIn('fast');

                            if(droppedFile) {
                                $('div#fileName').show().text(droppedFile.name);
                                translateDoc();
                            }
                        });
                    }
                    else {
                        $('input#fileInput').fadeOut('fast', function () {
                            if(droppedFile) {
                                $('div#fileName').show().text(droppedFile.name);
                                translateDoc();
                            }
                        });
                    }

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
            console.warn('Translation pairs cache ' + (pairs === null ? 'stale' : 'miss') + ', retrieving from server');
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

            if(pairs[pair.sourceLanguage]) {
                pairs[pair.sourceLanguage].push(pair.targetLanguage);
            }
            else {
                pairs[pair.sourceLanguage] = [pair.targetLanguage];
            }
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
    if(resetDetect && recentLangs.indexOf(lang) !== -1) {
        refreshLangList(resetDetect);
    }

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
        if(i < recentSrcLangs.length && recentSrcLangs[i]) {
            $('#srcLang' + (i + 1)).attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i]));
        }
        if(i < recentDstLangs.length && recentDstLangs[i]) {
            $('#dstLang' + (i + 1)).attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i]));
        }
    }

    if($('#detectedText').parent('.srcLang').attr('data-code')) {
        $('#detectedText')
            .text(getLangByCode($('#detectedText')
            .parent('.srcLang')
            .attr('data-code')) + ' - ' + dynamicLocalizations['detected']);
    }

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }

    function filterLangList(recentLangs, allLangs) {
        recentLangs = recentLangs.filter(onlyUnique);
        if(recentLangs.length < 3) {
            for(var i = 0; i < allLangs.length; i++) {
                if(recentLangs.length < 3 && recentLangs.indexOf(allLangs[i]) === -1) {
                    recentLangs.push(allLangs[i]);
                }
            }
        }
        if(recentLangs.length > 3) {
            recentLangs = recentLangs.slice(0, 3);
        }
        return recentLangs;
    }
}

function populateTranslationList() {
    sortTranslationList();
    $('.languageName').remove();
    $('.languageCol').show().removeClass('col-sm-3 col-sm-4 col-sm-6 col-sm-12');

    var numSrcCols = Math.ceil(srcLangs.length / TRANSLATION_LIST_ROWS) < (TRANSLATION_LIST_COLUMNS + 1)
            ? Math.ceil(srcLangs.length / TRANSLATION_LIST_ROWS)
            : TRANSLATION_LIST_COLUMNS,
        numDstCols = Math.ceil(dstLangs.length / TRANSLATION_LIST_ROWS) < (TRANSLATION_LIST_COLUMNS + 1)
            ? Math.ceil(dstLangs.length / TRANSLATION_LIST_ROWS)
            : TRANSLATION_LIST_COLUMNS;
    var srcLangsPerCol = Math.ceil(srcLangs.length / numSrcCols),
        dstLangsPerCol = Math.ceil(dstLangs.length / numDstCols);

    var BOOTSTRAP_MAX_COLUMNS = 12;

    $('#srcLanguages').css('min-width', Math.floor(TRANSLATION_LIST_WIDTH * (numSrcCols / TRANSLATION_LIST_COLUMNS)) + 'px');
    $('#srcLanguages .languageCol').addClass('col-sm-' + (BOOTSTRAP_MAX_COLUMNS / numSrcCols));
    $('#srcLanguages .languageCol:gt(' + (numSrcCols - 1) + ')').hide();

    $('#dstLanguages').css('min-width', Math.floor(TRANSLATION_LIST_WIDTH * (numDstCols / TRANSLATION_LIST_COLUMNS)) + 'px');
    $('#dstLanguages .languageCol').addClass('col-sm-' + (BOOTSTRAP_MAX_COLUMNS / numDstCols));
    $('#dstLanguages .languageCol:gt(' + (numDstCols - 1) + ')').hide();

    for(var i = 0; i < numSrcCols; i++) {
        var numSrcLang = Math.ceil(srcLangs.length / numSrcCols) * i;
        for(var j = numSrcLang; j < numSrcLang + srcLangsPerCol; j++) {
            if(numSrcLang < srcLangs.length) {
                var langCode = srcLangs[j], langName = getLangByCode(langCode);
                $('#srcLanguages .languageCol:eq(' + i + ')')
                    .append($('<div class="languageName"></div>')
                    .attr('data-code', langCode)
                    .text(langName));
            }
        }
    }

    for(i = 0; i < numDstCols; i++) {
        var numDstLang = Math.ceil(dstLangs.length / numDstCols) * i;
        for(j = numDstLang; j < numDstLang + dstLangsPerCol; j++) {
            if(numDstLang < dstLangs.length) {
                langCode = dstLangs[j], langName = getLangByCode(langCode);
                $('#dstLanguages .languageCol:eq(' + i + ')')
                    .append($('<div class="languageName"></div>')
                    .attr('data-code', langCode)
                    .text(langName));
            }
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
            else {
                return 1;
            }
        });
    }
}

function translate() {
    if($('div#translateText').is(':visible')) {
        translateText();
    }
    else {
        translateDoc();
    }
}

function translateText() {
    if($('div#translateText').is(':visible')) {
        if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
            sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, $('#originalText').val().length);
            if(textTranslateRequest) {
                textTranslateRequest.abort();
            }
            textTranslateRequest = $.jsonp({
                url: config.APY_URL + '/translate',
                beforeSend: ajaxSend,
                complete: function () {
                    ajaxComplete();
                    textTranslateRequest = undefined;
                },
                data: {
                    'langpair': curSrcLang + '|' + curDstLang,
                    'q': $('#originalText').val(),
                    'markUnknown': $('#markUnknown').prop('checked') ? 'yes' : 'no'
                },
                success: function (data) {
                    if(data.responseStatus === HTTP_OK_CODE) {
                        $('#translatedText').html(data.responseData.translatedText);
                        $('#translatedText').removeClass('notAvailable text-danger');

                        $('#translatedText').attr('pristineText', data.responseData.translatedText);

                        if(config.SUGGESTIONS.enabled) {
                            var localizedTitle = dynamicLocalizations['Suggest_Title'];
                            var placeholder = dynamicLocalizations['Suggest_Placeholder'];
                            $('#suggestedWordInput').attr('placeholder', placeholder);
                            $('#translatedText').html(                                
                                $('#translatedText').html().replace(/(\*|\@|\#)(\S+)/g, '<span class="wordSuggestPop text-danger" title="' + localizedTitle + '">$2</span>'));
                        }

                        $('#translatedTextClone').html(
                            $('#translatedText').attr('pristineText'));

                        $('.wordSuggestPop').click(function() {
                            $('.wordSuggestPop').removeAttr('id');
                            $('.wordSuggestPopInline').removeAttr('id');
                            $(this).attr('id', 'wordGettingSuggested');

                            $('#translatedTextClone').html(
                                $('#translatedTextClone').html().replace(/(\*|\@|\#)(\S+)/g, '<span class="wordSuggestPopInline text-danger" title="' + localizedTitle + '">$2</span>'));

                            $('.wordSuggestPopInline').click(function() {
                                $('.wordSuggestPop').removeAttr('id');
                                $('.wordSuggestPopInline').removeAttr('id');
                                $(this).attr('id', 'wordGettingSuggested');

                                $('#suggestionTargetWord').html($(this).text().replace(/(\*|\@|\#)/g, ''));
                                $('#suggestedWordInput').val('');

                            });

                            $('#suggestSentenceContainer').html(
                                dynamicLocalizations['Suggest_Sentence'].replace('{{targetWordCode}}', '<code><span id="suggestionTargetWord"></span></code>'))
                            $('#suggestionTargetWord').html($(this).text().replace(/(\*|\@|\#)/g, ''));

                            $('#wordSuggestModal').modal();
                        });
                    }
                    else {
                        translationNotAvailable();
                    }
                },
                error: translationNotAvailable
            });
        }
        else {
            translationNotAvailable();
        }
    }
}

function translateDoc() {
    var validPair = pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1,
        validFile = droppedFile !== undefined || $('input#fileInput')[0].files.length === 1;
    if(validPair && validFile) {
        var file;
        if(droppedFile === undefined) {
            if($('input#fileInput')[0].files.length !== 0 && $('input#fileInput')[0].files[0].length !== 0) {
                file = $('input#fileInput')[0].files[0];
            }
        }
        else {
            file = droppedFile;
        }

        if(file.size > UPLOAD_FILE_SIZE_LIMIT) {
            docTranslateError(dynamicLocalizations['File_Too_Large'], 'File_Too_Large');
        }
        else {
            var allowedMimeTypes = [
                'text/plain', 'text/html',
                'text/rtf', 'application/rtf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
                if(xhr.upload) {
                    xhr.upload.onprogress = updateProgressBar;
                }
                xhr.onreadystatechange = function () {
                    if(this.readyState === XHR_LOADING) {
                        $('div#fileLoading').fadeIn('fast');
                        $('div#fileUploadProgress').parent().fadeIn('fast', function () {
                            updateProgressBar({'loaded': 1, 'total': 1});
                        });
                    }
                    else if(this.readyState === XHR_DONE && xhr.status === HTTP_OK_CODE) {
                        $('div#fileUploadProgress').parent().fadeOut('fast');
                        $('div#fileLoading').fadeOut('fast', function () {
                            var URL = window.URL || window.webkitURL;
                            $('a#fileDownload')
                                .attr('href', URL.createObjectURL(xhr.response))
                                .attr('download', file.name)
                                .fadeIn('fast');
                            $('span#fileDownloadText').text(dynamicLocalizations['Download_File'].replace('{{fileName}}', file.name));
                            $('button#translate').prop('disabled', false);
                            $('input#fileInput').prop('disabled', false);
                        });
                    }
                    else if(this.status >= HTTP_BAD_REQUEST_CODE) {
                        docTranslateError(dynamicLocalizations['Not_Available']);
                    }
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
            else {
                docTranslateError(dynamicLocalizations['Format_Not_Supported'], 'Format_Not_Supported');
            }
        }
    }
    else {
        docTranslateError(dynamicLocalizations['Not_Available']);
    }

    function updateProgressBar(ev) {
        var done = ev.loaded || ev.position, total = ev.total || ev.totalSize;
        var percentDone = Math.floor(done / total * 1000) / 10;
        $('div#fileUploadProgress').attr('aria-valuenow', percentDone).css('width', percentDone + '%');
    }

    function docTranslateError(errorMessage, errorTextName) {
        $('div#fileUploadProgress').parent().fadeOut('fast', function () {
            $('span#uploadError')
                .text(errorMessage)
                .attr('data-text', errorTextName)
                .fadeIn('fast');
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
        complete: function () {
            ajaxComplete();
            textTranslateRequest = undefined;
        },
        data: {
            'q': $('#originalText').val()
        },
        success: function (data) {
            var possibleLanguages = [];
            for(var lang in data) {
                possibleLanguages.push([lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang, data[lang]]);
            }
            possibleLanguages.sort(function (a, b) {
                return b[1] - a[1];
            });

            oldSrcLangs = recentSrcLangs;
            recentSrcLangs = [];
            for(var i = 0; i < possibleLanguages.length; i++) {
                if(recentSrcLangs.length < 3 && possibleLanguages[i][0] in pairs) {
                    recentSrcLangs.push(possibleLanguages[i][0]);
                }
            }
            recentSrcLangs = recentSrcLangs.concat(oldSrcLangs);
            if(recentSrcLangs.length > 3) {
                recentSrcLangs = recentSrcLangs.slice(0, 3);
            }

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
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('text-muted');
        }
    });
    $.each($('.dstLang'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('disabledLang').prop('disabled', true);
        }
    });

    $.each($('#dstLangSelect option'), function (i, element) {
        $(element).prop('disabled', !pairs[curSrcLang] || pairs[curSrcLang].indexOf($(element).val()) === -1);
    });
}

function autoSelectDstLang() {
    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) === -1) {
        var newDstLang;
        for(var i = 0; i < recentDstLangs.length; i++) {
            if(pairs[curSrcLang].indexOf(recentDstLangs[i]) !== -1) {
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

function synchronizeTextareaHeights() {
    if($(window).width() < TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH) {
        return;
    }

    $('#originalText').css({
        'overflow-y': 'hidden',
        'height': 'auto'
    });
    var originalTextScrollHeight = $('#originalText')[0].scrollHeight;
    $('#originalText').css('height', originalTextScrollHeight + 'px');
    $('#translatedText').css('height', originalTextScrollHeight + 'px');
}
