/* @flow */

var pairs = {}, chainedPairs = {}, originalPairs = pairs;
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];
var droppedFile;
var translateRequest;

var UPLOAD_FILE_SIZE_LIMIT = 32E6,
    TRANSLATION_LIST_BUTTONS = 3,
    TRANSLATION_LIST_WIDTH = 650,
    TRANSLATION_LIST_ROWS = 8,
    TRANSLATION_LIST_COLUMNS = 4,
    TRANSLATION_LISTS_BUFFER = 50;

var INSTANT_TRANSLATION_URL_DELAY = 500,
    INSTANT_TRANSLATION_PUNCTUATION_DELAY = 1000,
    INSTANT_TRANSLATION_DELAY = 3000;

var PUNCTUATION_KEY_CODES = [46, 33, 58, 63, 47, 45, 190, 171, 49]; // eslint-disable-line no-magic-numbers

/* exported getPairs */
/* global config, modeEnabled, synchronizeTextareaHeights, persistChoices, getLangByCode, sendEvent, onlyUnique, restoreChoices
    getDynamicLocalization, locale, ajaxSend, ajaxComplete, localizeInterface, filterLangList, cache, readCache, iso639Codes,
    callApy, apyRequestTimeout, isURL */
/* global SPACE_KEY_CODE, ENTER_KEY_CODE, HTTP_OK_CODE, XHR_LOADING, XHR_DONE, HTTP_OK_CODE, HTTP_BAD_REQUEST_CODE */
/* global $bu_getBrowser */

if(modeEnabled('translation')) {
    $(document).ready(function () {
        function updatePairList() {
            pairs = $('input#chainedTranslation').prop('checked') ? chainedPairs : originalPairs;
        }

        function setupTextTranslation() {
            synchronizeTextareaHeights();

            $('#markUnknown').change(function () {
                if($('div#translateText').is(':visible')) {
                    translateText();
                }
                persistChoices('translator');
            });

            $('.clearButton').click(function () {
                $('#originalText, #translatedText').val('');
                $('#originalText').focus();
                synchronizeTextareaHeights();
            });

            $(window).resize(synchronizeTextareaHeights);

            $('#originalText').blur(function () {
                persistChoices('translator', true);
            });

            $('#originalText').on('input propertychange', function () {
                var disableDetect = this.value === '';
                $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', disableDetect);
                $('#detect').toggleClass('disabledLang', disableDetect);

                persistChoices('translator');
            });
        }

        function setupWebpageTranslation() {
            if(window.location.href.indexOf('&qP=') != -1) {
                translateWebpage();
            }

            $('button#showTranslateWebpage').click(function () {
                showTranslateWebpageInterface();
            });

            $('button#cancelTranslateWebpage').click(function () {
                if(translateRequest) {
                    translateRequest.abort();
                }

                $('input#webpage').attr({
                    'required': false,
                    'novalidate': true
                });

                $('div#translateWebpage').fadeOut('fast', function () {
                    $('button#cancelTranslateWebpage').fadeOut('fast', function () {
                        $('#srcLangSelectors').removeClass('srcLangSelectorsWebpageTranslation').addClass('srcLangSelectors');
                    });
                    $('div#translateText').fadeIn('fast', function () {
                        synchronizeTextareaHeights();
                    });
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
                    $('#detect').removeClass('disabledLang');
                });

                window.location.hash = 'translation';
            });
        }

        function setupDocTranslation() {
            $('button#translateDoc').click(function () {
                $('div#translateText').fadeOut('fast', function () {
                    $('#fileInput').show();
                    $('div#fileName').hide();
                    $('div#docTranslation').fadeIn('fast');
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', true);
                    $('#detect').addClass('disabledLang');
                });
                pairs = originalPairs;
                populateTranslationList();
            });

            $('button#cancelDocTranslate').click(function () {
                droppedFile = undefined;
                $('div#docTranslation').fadeOut('fast', function () {
                    $('a#fileDownload').hide();
                    $('span#uploadError').hide();
                    $('div#translateText').fadeIn('fast', synchronizeTextareaHeights);
                    $('input#fileInput').wrap('<form>').closest('form')[0].reset();
                    $('input#fileInput').unwrap();
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
                    $('#detect').removeClass('disabledLang');
                });
                updatePairList();
                populateTranslationList();
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
        }

        function setupLanguageSelectors() {
            $('.swapLangBtn').click(function () {
                var srcCode = $('.srcLang.active').attr('data-code'), dstCode = $('.dstLang.active').attr('data-code');
                curSrcLang = dstCode;
                curDstLang = srcCode;

                if(recentSrcLangs.indexOf(curSrcLang) !== -1) {
                    $('.srcLang').removeClass('active');
                    $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
                }
                else {
                    recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;
                }
                $('#srcLangSelect').val(curSrcLang);

                if(recentDstLangs.indexOf(curDstLang) !== -1) {
                    $('.dstLang').removeClass('active');
                    $('#dstLang' + (recentDstLangs.indexOf(curDstLang) + 1)).addClass('active');
                }
                else {
                    recentDstLangs[recentDstLangs.indexOf(dstCode)] = curDstLang;
                }
                $('#dstLangSelect').val(curDstLang);

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
                    $.when(detectLanguage()).done(translateText);
                }
                else {
                    handleNewCurrentLang(curSrcLang = $(this).val(), recentSrcLangs, 'srcLang', true);
                    autoSelectDstLang();
                }
            });

            $('#dstLangSelect').change(function () {
                handleNewCurrentLang(curDstLang = $(this).val(), recentDstLangs, 'dstLang', true);
            });

            $('#srcLangSelectors').addClass('srcLangSelectors');

            $('#srcLanguages').on('click', '.languageName:not(.text-muted)', function () {
                curSrcLang = $(this).attr('data-code');
                handleNewCurrentLang(curSrcLang, recentSrcLangs, 'srcLang');
                autoSelectDstLang();
            });

            $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
                curDstLang = $(this).attr('data-code');
                handleNewCurrentLang(curDstLang, recentDstLangs, 'dstLang');
            });

            $('.srcLang:not(#detect)').click(function () {
                curSrcLang = $(this).attr('data-code');
                $('.srcLang').removeClass('active');
                $(this).addClass('active');
                populateTranslationList();
                refreshLangList(true);
                muteLanguages();
                localizeInterface();
                autoSelectDstLang();
                translate();
            });

            $('.dstLang').click(function () {
                curDstLang = $(this).attr('data-code');
                $('.dstLang').removeClass('active');
                $(this).addClass('active');
                refreshLangList();
                muteLanguages();
                localizeInterface();
                translate();
            });

            $('#detect').click(function () {
                $('.srcLang').removeClass('active');
                $(this).addClass('active');
                $.when(detectLanguage()).done(translateText);
            });
        }

        function getChainedDstLangs(srcLang) {
            var targets = [];
            var targetsSeen = {};
            targetsSeen[srcLang] = true;
            var targetLists = [pairs[srcLang]];

            while(targetLists.length > 0) {
                $.each(targetLists.pop(), function (i, trgt) {
                    if(!targetsSeen[trgt]) {
                        targets.push(trgt);
                        if(pairs[trgt]) {
                            targetLists.push(pairs[trgt]);
                        }
                        targetsSeen[trgt] = true;
                    }
                });
            }

            return targets;
        }

        if(config.TRANSLATION_CHAINING) {
            $('.chaining').show();
            $.each(pairs, function (srcLang, _dstLangs) {
                chainedPairs[srcLang] = getChainedDstLangs(srcLang);
            });
            updatePairList();
            populateTranslationList();
        }

        $('.translateBtn').click(function () {
            translate();
            persistChoices('translator', true);
        });

        /*$('#translationForm').submit(function () {
            console.log('called');
            translate();
            persistChoices('translator', true);
        });*/

        $('input#chainedTranslation').change(function () {
            updatePairList();
            populateTranslationList();
            persistChoices('translator');
        });

        var timer, lastPunct = false;
        $('#originalText').on('keyup paste', function (event) {
            if(lastPunct && (event.keyCode === SPACE_KEY_CODE || event.keyCode === ENTER_KEY_CODE)) {
                // Don't override the short timeout for simple space-after-punctuation
                return;
            }

            if(timer && $('#instantTranslation').prop('checked')) {
                clearTimeout(timer);
            }

            var timeout;
            if(PUNCTUATION_KEY_CODES.indexOf(event.keyCode) !== -1) {
                timeout = INSTANT_TRANSLATION_PUNCTUATION_DELAY;
                lastPunct = true;
            }
            else if(isURL($('#originalText').val())) {
                timeout = INSTANT_TRANSLATION_URL_DELAY;
                lastPunct = false;
            }
            else {
                timeout = INSTANT_TRANSLATION_DELAY;
                lastPunct = false;
            }

            timer = setTimeout(function () {
                if($('#instantTranslation').prop('checked')) {
                    translate();
                }
                persistChoices('translator', true);
            }, timeout);

            synchronizeTextareaHeights();
        });

        $('#instantTranslation').change(function () {
            persistChoices('translator');
        });

        setupLanguageSelectors();
        setupTextTranslation();
        setupWebpageTranslation();
        setupDocTranslation();
    });
}

function getPairs() {
    var deferred = $.Deferred();

    if(config.PAIRS && 'responseData' in config.PAIRS) {
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
        if(!pairData) {
            populateTranslationList();
            restoreChoices('translator');
            translate();
            return;
        }
        $.each(pairData, function (i, pair) {
            if(config.ALLOWED_PAIRS && config.ALLOWED_PAIRS.indexOf(pair.sourceLanguage + '-' + pair.targetLanguage) === -1) {
                return;
            }
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

        for(var k in pairs) {
            // Default for new users is first available pair; TODO something smart based on browser lang setting
            curSrcLang = k;
            curDstLang = pairs[k][0];
            break;
        }
        for(var i = 0; i < TRANSLATION_LIST_BUTTONS; i++) {
            recentSrcLangs.push(i < srcLangs.length ? srcLangs[i] : undefined);
            recentDstLangs.push(i < dstLangs.length ? dstLangs[i] : undefined);
        }

        populateTranslationList();
        restoreChoices('translator');
        translate();
    }

    return deferred.promise();
}

function handleNewCurrentLang(lang, recentLangs, langType, resetDetect, noTranslate) {
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
    if(!noTranslate) {
        translate();
    }
}

function refreshLangList(resetDetect) {
    recentSrcLangs = filterLangs(recentSrcLangs, srcLangs);
    recentDstLangs = filterLangs(recentDstLangs, dstLangs);

    persistChoices('translator');

    for(var i = 0; i < TRANSLATION_LIST_BUTTONS; i++) {
        var srcBtn = $('#srcLang' + (i + 1));
        var dstBtn = $('#dstLang' + (i + 1));
        if(i < recentSrcLangs.length && recentSrcLangs[i]) {
            srcBtn.show().attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i]));
        }
        else {
            srcBtn.hide();
        }
        if(i < recentDstLangs.length && recentDstLangs[i]) {
            dstBtn.show().attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i]));
        }
        else {
            dstBtn.hide();
        }
    }

    if($('#detectedText').parent('.srcLang').attr('data-code')) {
        $('#detectedText').text(
            getLangByCode($('#detectedText').parent('.srcLang').attr('data-code')) +
            ' - ' + getDynamicLocalization('detected')
        );
    }

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }

    function filterLangs(allRecentLangs, allLangs) {
        var recentLangs = allRecentLangs.filter(onlyUnique);
        if(recentLangs.length < TRANSLATION_LIST_BUTTONS) {
            for(var i = 0; i < allLangs.length; i++) {
                if(recentLangs.length < TRANSLATION_LIST_BUTTONS && recentLangs.indexOf(allLangs[i]) === -1) {
                    recentLangs.push(allLangs[i]);
                }
            }
        }
        if(recentLangs.length > TRANSLATION_LIST_BUTTONS) {
            recentLangs = recentLangs.slice(0, TRANSLATION_LIST_BUTTONS);
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

    var columnWidth = TRANSLATION_LIST_WIDTH / TRANSLATION_LIST_COLUMNS;
    var maxSrcLangsWidth = $(window).width() - $('#srcLanguagesDropdownTrigger').offset().left - TRANSLATION_LISTS_BUFFER;
    numSrcCols = Math.min(Math.floor(maxSrcLangsWidth / columnWidth), TRANSLATION_LIST_COLUMNS);
    var maxDstLangsWidth = $('#dstLanguagesDropdownTrigger').offset().left + $('#dstLanguagesDropdownTrigger').outerWidth() -
        TRANSLATION_LISTS_BUFFER;
    numDstCols = Math.min(Math.floor(maxDstLangsWidth / columnWidth), TRANSLATION_LIST_COLUMNS);

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
                    .append(
                        $('<div class="languageName"></div>')
                            .attr('data-code', langCode)
                            .text(langName)
                    );
            }
        }
    }

    for(i = 0; i < numDstCols; i++) {
        var numDstLang = Math.ceil(dstLangs.length / numDstCols) * i;
        for(j = numDstLang; j < numDstLang + dstLangsPerCol; j++) {
            if(numDstLang < dstLangs.length) {
                langCode = dstLangs[j], langName = getLangByCode(langCode);
                $('#dstLanguages .languageCol:eq(' + i + ')')
                    .append(
                        $('<div class="languageName"></div>')
                            .attr('data-code', langCode)
                            .text(langName)
                    );
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

    if(srcLangs.length === 1) {
        $('#srcLangSelectors div.btn-group').hide();
    }
    if(dstLangs.length === 1) {
        $('#dstLangSelectors div.btn-group').hide();
    }

    function sortTranslationList() {
        var sortLocale = (locale && locale in iso639Codes) ? iso639Codes[locale] : locale;

        srcLangs = srcLangs.sort(function (a, b) {
            try {
                return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
            }
            catch(e) {
                return getLangByCode(a).localeCompare(getLangByCode(b));
            }
        });

        dstLangs = dstLangs.sort(function (a, b) {
            var aPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(a) !== -1,
                bPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(b) !== -1;

            if((aPossible && bPossible) || (!aPossible && !bPossible)) {
                try {
                    return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
                }
                catch(e) {
                    return getLangByCode(a).localeCompare(getLangByCode(b));
                }

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
    if($('div#translateWebpage').is(':visible') || isURL($('#originalText').val())) {
        translateWebpage();
    }
    else if($('div#translateText').is(':visible')) {
        translateText();
    }
    else if($('div#docTranslation').is(':visible')) {
        translateDoc();
    }
}

function translateText() {
    function handleTranslateSuccessResponse(data) {
        if(data.responseStatus === HTTP_OK_CODE) {
            $('#translatedText').val(data.responseData.translatedText);
            $('#translatedText').removeClass('notAvailable text-danger');
        }
        else {
            translationNotAvailable();
        }
    }

    if($('div#translateText').is(':visible')) {
        if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
            sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, $('#originalText').val().length);

            if(translateRequest) {
                translateRequest.abort();
                clearTimeout(apyRequestTimeout);
            }

            var endpoint, request;
            if($('input#chainedTranslation').prop('checked') && config.TRANSLATION_CHAINING) {
                endpoint = '/translateChain';
                request = {'langpairs': curSrcLang + '|' + curDstLang};
            }
            else {
                endpoint = '/translate';
                request = {'langpair': curSrcLang + '|' + curDstLang};
            }

            request.q = $('#originalText').val(); // eslint-disable-line id-length
            request.markUnknown = $('#markUnknown').prop('checked') ? 'yes' : 'no';
            translateRequest = callApy({
                data: request,
                success: handleTranslateSuccessResponse,
                error: translationNotAvailable,
                complete: function () {
                    ajaxComplete();
                    translateRequest = undefined;
                }
            }, endpoint);
        }
        else {
            translationNotAvailable();
        }
    }
}

function translateDoc() {
    var validPair = pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1;

    var file = droppedFile ? droppedFile : undefined;
    if($('input#fileInput')[0].files.length > 0 && $('input#fileInput')[0].files[0].length !== 0) {
        file = $('input#fileInput')[0].files[0];
    }

    if(validPair && file) {
        if(file.size > UPLOAD_FILE_SIZE_LIMIT) {
            docTranslateError(getDynamicLocalization('File_Too_Large'), 'File_Too_Large');
        }
        else {
            // Keep in sync with accept attribute of input#fileInput:
            var allowedMimeTypes = [
                '', // epiphany-browser gives this instead of a real MIME type
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
                var fileName = file.name;
                xhr.onreadystatechange = function () {
                    if(this.readyState === XHR_LOADING) {
                        $('div#fileLoading').fadeIn('fast');
                        $('div#fileUploadProgress').parent().fadeIn('fast', function () {
                            updateProgressBar({'loaded': 1, 'total': 1, 'position': undefined, 'totalSize': undefined});
                        });
                    }
                    else if(this.readyState === XHR_DONE && xhr.status === HTTP_OK_CODE) {
                        downloadBrowserWarn();
                        $('div#fileUploadProgress').parent().fadeOut('fast');
                        $('div#fileLoading').fadeOut('fast', function () {
                            var URL = window.URL || window.webkitURL;
                            $('a#fileDownload')
                                .attr('href', URL.createObjectURL(xhr.response))
                                .attr('download', fileName)
                                .fadeIn('fast');
                            $('span#fileDownloadText').text(getDynamicLocalization('Download_File').replace('{{fileName}}', fileName));
                            $('button#translate').prop('disabled', false);
                            $('input#fileInput').prop('disabled', false);
                        });
                    }
                    else if(this.status >= HTTP_BAD_REQUEST_CODE) {
                        docTranslateError(getDynamicLocalization('Not_Available'));
                    }
                };
                xhr.onerror = function () {
                    docTranslateError(getDynamicLocalization('Not_Available'));
                };

                updateProgressBar({'loaded': 0, 'total': 1, 'position': undefined, 'totalSize': undefined});
                $('div#fileUploadProgress').parent().fadeIn('fast');
                xhr.open('post', config.APY_URL + '/translateDoc', true);
                xhr.responseType = 'blob';
                var fileData = new FormData();
                fileData.append('langpair', curSrcLang + '|' + curDstLang);
                fileData.append('markUnknown', $('#markUnknown').prop('checked') ? 'yes' : 'no');
                fileData.append('file', file);
                xhr.send(fileData);
                sendEvent('translator', 'translateDoc', curSrcLang + '-' + curDstLang, file.size);
            }
            else {
                console.warn('Browser gave MIME type as', file.type);
                docTranslateError(getDynamicLocalization('Format_Not_Supported'), 'Format_Not_Supported');
            }
        }
    }
    else {
        docTranslateError(getDynamicLocalization('Not_Available'));
    }

    function updateProgressBar(ev) {
        var progress = 0.0;
        if(ev instanceof ProgressEvent) {
            progress = ev.loaded / ev.total;
        }
        else {
            console.warn('Strange event type given to updateProgressBar:');
            console.warn(ev);
        }
        var percentDone = Math.floor(progress * 1000) / 10;
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

function translateWebpage() {
    function webpageTranslationNotAvailable(data) {
        $('#translatedWebpage').replaceWith(
            $('<div id="translatedWebpage" class="notAvailable text-danger"></div>')
                .text(getDynamicLocalization('Not_Available'))
        );

        if(data) {
            console.warn('Webpage translation failed', data.message, data.explanation);
        }
    }

    function handleTranslateWebpageSuccessResponse(data) {
        function cleanPage(html) {
            // Pages like https://goo.gl/PiZyW3 insert noise using document.write that
            // 1. makes things enormously slow, and 2. completely mess up styling so e.g. you
            // have to scroll through a full screen of whitespace before reaching content.
            // This might mess things up some places – needs testing – but on the other hand
            // most uses of document.write are evil.
            return html.replace(/document[.]write[(]/g, 'console.log("document.write "+');
        }

        var translatedHtml = data.responseData.translatedText;

        if(data.responseStatus === HTTP_OK_CODE && translatedHtml) {
            var iframe = $('<iframe id="translatedWebpage" frameborder="0"></iframe>')[0];
            $('#translatedWebpage').replaceWith(iframe);
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(cleanPage(translatedHtml));
            iframe.contentWindow.document.close();

            $(iframe).load(function () {
                var contents = $(iframe).contents();
                contents.find('head').append($('<base>').attr('href', $('input#webpage').val()));

                $.each(contents.find('a'), function (index, a) {
                    var href = a.href;
                    $(a).on('click', function () {
                        $('#webpage').val(href);
                        translateWebpage();
                    });
                    a.href = '#';
                    a.target = '';
                });

                if(!contents.find('body').text().trim()) {
                    webpageTranslationNotAvailable();
                }
            });
        }
        else {
            webpageTranslationNotAvailable(data);
        }
    }

    function handleTranslateWebpageErrorResponse(jqXHR) {
        webpageTranslationNotAvailable(jqXHR.responseJSON);
    }

    persistChoices('translator', true);

    if(!$('div#translateWebpage').is(':visible')) {
        showTranslateWebpageInterface($('#originalText').val().trim());
    }

    var url = $('input#webpage').val();

    if(!isURL(url)) {
        webpageTranslationNotAvailable();
        return;
    }

    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
        sendEvent('translator', 'translateWebpage', curSrcLang + '-' + curDstLang);

        if(translateRequest) {
            translateRequest.abort();
            clearTimeout(apyRequestTimeout);
        }

        $('iframe#translatedWebpage').animate({'opacity': 0.75}, 'fast');
        translateRequest = callApy({
            data: {
                'langpair': curSrcLang + '|' + curDstLang,
                'markUnknown': 'no',
                'url': url
            },
            dataType: 'json',
            success: handleTranslateWebpageSuccessResponse,
            error: handleTranslateWebpageErrorResponse,
            complete: function () {
                ajaxComplete();
                translateRequest = undefined;
                $('iframe#translatedWebpage').animate({'opacity': 1}, 'fast');
            }
        }, '/translatePage', true);
    }
}

function showTranslateWebpageInterface(url) {
    $('#srcLangSelectors').removeClass('srcLangSelectors').addClass('srcLangSelectorsWebpageTranslation');

    $('div#translateText').fadeOut('fast', function () {
        $('input#webpage').attr({
            'required': true,
            'novalidate': false
        });
        $('button#cancelTranslateWebpage').fadeIn('fast');
        $('div#translateWebpage').fadeIn('fast');
        $('#detect, #srcLangSelect option[value=detect]').prop('disabled', true);
        $('#detect').addClass('disabledLang');
    });

    if(url) {
        $('input#webpage').val(url);
    }

    window.location.hash = 'webpageTranslation';
}

function downloadBrowserWarn() {
    if(typeof $bu_getBrowser == 'function') { // eslint-disable-line camelcase
        var detected = $bu_getBrowser();
        // Show the warning for (what bu calls) "niche" browsers and Safari, but not Chromium:
        if(detected.n.match(/^[xs]/) && !(navigator.userAgent.match(/Chromium/))) {
            $('#fileDownloadBrowserWarning').show();
        }
    }
}

function detectLanguage() {
    var originalText = $('#originalText').val();

    if(translateRequest) {
        translateRequest.abort();
        clearTimeout(apyRequestTimeout);
    }

    translateRequest = callApy({
        data: {
            'q': originalText
        },
        success: handleDetectLanguageSuccessResponse,
        error: handleDetectLanguageErrorResponse,
        complete: function () {
            ajaxComplete();
            translateRequest = undefined;
        }
    }, '/identifyLang');

    return translateRequest;

    function handleDetectLanguageSuccessResponse(data) {
        var possibleLanguages = [];
        for(var lang in data) {
            possibleLanguages.push([lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang, data[lang]]);
        }
        possibleLanguages.sort(function (a, b) {
            return b[1] - a[1];
        });

        var oldSrcLangs = recentSrcLangs;
        recentSrcLangs = [];
        for(var i = 0; i < possibleLanguages.length; i++) {
            if(recentSrcLangs.length < TRANSLATION_LIST_BUTTONS && possibleLanguages[i][0] in pairs) {
                recentSrcLangs.push(possibleLanguages[i][0]);
            }
        }
        recentSrcLangs = recentSrcLangs.concat(oldSrcLangs);
        if(recentSrcLangs.length > TRANSLATION_LIST_BUTTONS) {
            recentSrcLangs = recentSrcLangs.slice(0, TRANSLATION_LIST_BUTTONS);
        }

        curSrcLang = recentSrcLangs[0];
        autoSelectDstLang();
        $('#srcLangSelect').val(curSrcLang);
        muteLanguages();

        $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
        refreshLangList();
        $('#detectedText').show();
        $('#detectText').hide();
    }

    function handleDetectLanguageErrorResponse() {
        $('#srcLang1').click();
    }
}

function translationNotAvailable() {
    $('#translatedText')
        .val(getDynamicLocalization('Not_Available'))
        .text(getDynamicLocalization('Not_Available'))
        .addClass('notAvailable text-danger');
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
            newDstLang = filterLangList(pairs[curSrcLang])[0];
        }

        curDstLang = newDstLang;

        if(recentDstLangs.indexOf(newDstLang) === -1) {
            handleNewCurrentLang(newDstLang, recentDstLangs, 'dstLang');
        }
        else {
            $('.dstLang').removeClass('active');
            refreshLangList();
            $('.dstLang[data-code=' + curDstLang + ']').addClass('active');
            muteLanguages();
            localizeInterface();
            translateText();
        }

        $('#dstLangSelect').val(newDstLang).change();
    }
}

/*:: import {synchronizeTextareaHeights, modeEnabled, ajaxSend, ajaxComplete, filterLangList, onlyUnique, getLangByCode,
    callApy, apyRequestTimeout} from "./util.js" */
/*:: import {persistChoices, restoreChoices} from "./persistence.js" */
/*:: import localizeInterface from "./localization.js" */
/*:: import {readCache,cache} from "./cache.js" */
/*:: import {config} from "./config.js" */
/*:: import {isURL} from "./util.js" */
