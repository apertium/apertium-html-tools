/* @flow */

var pairs = {}, chainedPairs = {}, originalPairs = pairs;
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];
var droppedFile;
var textTranslateRequest;

var UPLOAD_FILE_SIZE_LIMIT = 32E6,
    TRANSLATION_LIST_BUTTONS = 5,
    TRANSLATION_LIST_WIDTH = 650,
    TRANSLATION_LIST_ROWS = 8,
    TRANSLATION_LIST_COLUMNS = 4;

/* exported getPairs */

if(modeEnabled('translation')) {
    $(document).ready(function () {
        synchronizeTextareaHeights();

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

        $('input#chainedTranslation').change(function () {
            updatePairList();
            populateTranslationList();
            persistChoices('translator');
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
                    translate();
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
            if($('div#translateText').is(':visible')) {
              translateText();
            }
            persistChoices('translator');
        });

        $('#originalText').on('input propertychange', function () {
            persistChoices('translator');
        });

        $('#originalText').submit(function () {
            translateText();
        });

        $('.clearButton').click(function () {
            $('#originalText').val('');
            $('#translatedText').text('');
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
            });
            updatePairList();
            populateTranslationList();
        });

        $('input#webpage').keyup(function (ev) {
            if(ev.keyCode === ENTER_KEY_CODE) {
                translate();
                return false;
            }
        });

        $('button#translateWebpage').click(showTranslateWebpageInterface);

        $('button#cancelWebpageTranslate').click(hideTranslateWebpageInterface);

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
    });
}

function getPairs() {
    var deferred = $.Deferred();

    if(config.PAIRS && "responseData" in config.PAIRS) {
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
                error: function (a) {
                    console.error('Failed to get available translation language pairs');
                    console.error(a);
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
            if(config.ALLOWED_PAIRS && config.ALLOWED_PAIRS.indexOf(pair.sourceLanguage + "-" + pair.targetLanguage) === -1) {
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
        $('#detectedText')
            .text(getLangByCode($('#detectedText')
            .parent('.srcLang')
            .attr('data-code')) + ' - ' + getDynamicLocalization('detected'));
    }

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }

    function filterLangs(recentLangs, allLangs) {
        recentLangs = recentLangs.filter(onlyUnique);
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

function updatePairList() {
    pairs = $('input#chainedTranslation').prop('checked') ? chainedPairs : originalPairs;
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

    if(srcLangs.length === 1) {
        $('#srcLangSelectors div.btn-group').hide();
        $('#srcLang1').prop('disabled', true);
    }
    if(dstLangs.length === 1) {
        $('#dstLangSelectors div.btn-group').hide();
        $('#dstLang1').prop('disabled', true);
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
    if(showingWebpageTranslation() || isURL($('#originalText').val().trim())) {
        translateWebpage();
    }
    else if($('div#translateText').is(':visible')) {
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
            var endpoint, request;
            if($('input#chainedTranslation').prop('checked')) {
                endpoint = '/translateChain';
                request = {'langpairs': curSrcLang + '|' + curDstLang};
            }
            else {
                endpoint = '/translate';
                request = {'langpair': curSrcLang + '|' + curDstLang};
            }
            request.q = $('#originalText').val(); // eslint-disable-line id-length
            var markUnknown = $('#markUnknown').prop('checked') ? 'yes' : 'no';
            request.markUnknown = 'yes'; // Remove marks on client instead, so we can spell afterwards.
            textTranslateRequest = $.jsonp({
                url: config.APY_URL + endpoint,
                beforeSend: ajaxSend,
                complete: function () {
                    ajaxComplete();
                    textTranslateRequest = undefined;
                },
                data: request,
                success: function (data) {
                    if(data.responseStatus === HTTP_OK_CODE) {
                        insertWithSpelling(data.responseData.translatedText,
                                           $('#translatedText'),
                                           curSrcLang);
                        $('#translatedText').removeClass('notAvailable text-danger');
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

function inputFile() {
    if($('input#fileInput')[0].files.length > 0 && $('input#fileInput')[0].files[0].length !== 0) {
        return $('input#fileInput')[0].files[0];
    }
    return undefined;           // like droppedFile
}

function translateDoc() {
    var validPair = pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1,
        file = droppedFile !== undefined ? droppedFile : inputFile();
    if(validPair && file !== undefined) {
        if(file.size > UPLOAD_FILE_SIZE_LIMIT) {
            docTranslateError(getDynamicLocalization('File_Too_Large'), 'File_Too_Large');
        }
        else {
            // Keep in sync with accept attribute of input#fileInput:
            var allowedMimeTypes = [
                '',               // epiphany-browser gives this instead of a real MIME type
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
                console.log("Browser gave MIME type as", file.type);
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
            progress = ev.loaded / ev. total;
        }
        else {
            console.warn("Strange event type given updateProgressBar:");
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

function downloadBrowserWarn() {
    if(typeof $bu_getBrowser == 'function') {
        var detected = $bu_getBrowser();
        // Show the warning for (what bu calls) "niche" browsers and Safari, but not Chromium:
        if(detected.n.match(/^[xs]/) && !(navigator.userAgent.match(/Chromium/))) {
            $('#fileDownloadBrowserWarning').show();
        }
    }
}

function translateLink(url) {
    $('#webpage').val(url);
    translateWebpage();
}

function cleanPage(html) {
    // Pages like
    // http://www.lapinkansa.fi/sagat/romssa-sami-searvvi-jodiheaddji-daruiduhttinpolitihkka-vaikkuha-ain-olbmuid-guottuide-samiid-birra-15843633/
    // insert noise using document.write that 1. makes things
    // enormously slow, and 2. completely mess up styling so e.g. you
    // have to scroll through a full screen of whitespace before
    // reaching content. This might mess things up some places – needs
    // testing – but on the other hand most uses of document.write are
    // evil.
    return html.replace(/document[.]write[(]/g,
                        'console.log("document.write "+');
}

function translateWebpage() {
    persistChoices('translator', true);
    if(!showingWebpageTranslation()) {
        showTranslateWebpageInterface($('#originalText').val().trim());
    }

    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
        sendEvent('translator', 'translateWebpage', curSrcLang + '-' + curDstLang);
        $('iframe#translatedWebpage').animate({'opacity': 0.75}, 'fast');
        $.jsonp({
            url: config.APY_URL + '/translatePage',
            beforeSend: ajaxSend,
            complete: function () {
                ajaxComplete();
                synchronizeTextareaHeights();
                textTranslateRequest = undefined;
                $('iframe#translatedWebpage').animate({'opacity': 1}, 'fast');
            },
            data: {
                'langpair': curSrcLang + '|' + curDstLang,
                'markUnknown': 'no', // TODO: checkbox; also perhaps only remove the #-marks, not *
                'url': $('input#webpage').val()
            },
            success: function (data) {
                if(data.responseStatus === HTTP_OK_CODE) {
                    var iframe = $('<iframe id="translatedWebpage" class="translatedWebpage" frameborder="0"></iframe>')[0];
                    $('#translatedWebpage').replaceWith(iframe);
                    iframe.contentWindow.document.open();
                    var html = cleanPage(data.responseData.translatedText);
                    iframe.contentWindow.document.write(html);
                    iframe.contentWindow.document.close();
                    var contents = $(iframe).contents();
                    contents.find('head')
                        .append($('<base>').attr('href', $('input#webpage').val()));
                    $(iframe).load(function(){
                        contents.find('a')
                            .map(function(_i, a){
                                var href = a.href;
                                $(a).on('click', function() { window.parent.translateLink(href); });
                                a.href = "#";
                            });
                    });
                }
                else {
                    translationNotAvailable();
                }
            },
            error: translationNotAvailable
        });
    }
}

function hideTranslateWebpageInterface() {
    $('input#webpage').attr({
        'required': false,
        'novalidate': true
    });
    $('div#translateWebpage').fadeOut('fast', function () {
        $('button#cancelWebpageTranslate').fadeOut('fast');
        $('div#translateText').fadeIn('fast', function () {
            synchronizeTextareaHeights();
        });
    });
    window.location.hash = 'translation';
    $('.ap-content').addClass('container').removeClass('container-fluid');
    $('.ap-header-nav').show();
    $('#footer').show();
}

function showingWebpageTranslation() {
    return parent.location.hash === '#webpageTranslation';
}

function showTranslateWebpageInterface(url) {
    $('div#translateText').fadeOut('fast', function () {
        $('input#webpage').attr({
            'required': true,
            'novalidate': false
        });
        $('button#cancelWebpageTranslate').fadeIn('fast');
        $('div#translateWebpage').fadeIn('fast');
    });
    if(url && typeof url === 'string') {
        $('input#webpage').val(url);
    }
    window.location.hash = 'webpageTranslation';
    $('.ap-content').addClass('container-fluid').removeClass('container');
    $('.ap-header-nav').hide();
    $('#footer').hide();
    synchronizeTextareaHeights();
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
    $('#translatedText')
        .text(getDynamicLocalization('Not_Available'))
        .addClass('notAvailable text-danger');
    var div = $('<div id="translatedWebpage" class="translatedWebpage"></div>');
    div.text(getDynamicLocalization('Not_Available'));
    div.addClass('notAvailable text-danger');
    $('#translatedWebpage').replaceWith(div[0]);
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

/*:: import {synchronizeTextareaHeights, modeEnabled, ajaxSend, ajaxComplete, filterLangList, onlyUnique, getLangByCode} from "./util.js" */
/*:: import {readCache, cache, persistChoices, restoreChoices} from "./persistence.js" */
/*:: import localizeInterface from "./localization.js" */
/*:: import {config} from "./config.js" */
/*:: import {insertWithSpelling} from "./spelling.js" */
