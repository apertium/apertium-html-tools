// @flow

var pairs /*: {[string]: string[]} */ = {}, chainedPairs = {}, originalPairs = pairs;
var srcLangs /*: string[] */ = [], dstLangs /*: string[] */ = [];
var curSrcLang /*: string */, curDstLang/*: string */;
var recentSrcLangs /*: string[] */ = [], recentDstLangs /*: string[] */ = [];
var droppedFile/*: ?File */;
var translateRequest;
var translationTimer/*: ?TimeoutID */;

var UPLOAD_FILE_SIZE_LIMIT = 32E6,
    TRANSLATION_LIST_BUTTONS = 3,
    TRANSLATION_LIST_IDEAL_ROWS = 12,
    TRANSLATION_LIST_MAX_WIDTH = 800,
    TRANSLATION_LIST_MAX_COLUMNS = 5,
    TRANSLATION_LISTS_BUFFER = 50;

var INSTANT_TRANSLATION_URL_DELAY = 500,
    INSTANT_TRANSLATION_PUNCTUATION_DELAY = 1000,
    INSTANT_TRANSLATION_DELAY = 3000;

var PUNCTUATION_KEY_CODES = [46, 33, 58, 63, 47, 45, 190, 171, 49]; // eslint-disable-line no-magic-numbers

/* exported curDstLang, curSrcLang, dstLangs, getPairs, handleNewCurrentLang, pairs, populateTranslationList, recentDstLangs,
    refreshLangList, recentSrcLangs, setCurDstLang, setCurSrcLang, setRecentDstLangs, setRecentSrcLangs, showTranslateWebpageInterface,
    srcLangs */

/* global config, modeEnabled, synchronizeTextareaHeights, persistChoices, getLangByCode, sendEvent, onlyUnique, restoreChoices
    getDynamicLocalization, locale, ajaxSend, ajaxComplete, localizeInterface, filterLangList, cache, readCache, iso639Codes,
    callApy, apyRequestTimeout, isURL, removeSoftHyphens, parentLang, isVariant, langDirection, languages, iso639CodesInverse */
/* global ENTER_KEY_CODE, HTTP_BAD_REQUEST_CODE, HTTP_OK_CODE, SPACE_KEY_CODE, XHR_DONE, XHR_LOADING */

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
                updateDetect($('#originalText').val() !== '');
            });

            updateDetect($('#originalText').val() !== '');
        }

        function setupWebpageTranslation() {
            $('button#showTranslateWebpage').click(function () {
                var possibleURL = $('#originalText').val().trim();
                showTranslateWebpageInterface(isURL(possibleURL) ? possibleURL : null, true);
            });

            $('button#cancelTranslateWebpage').click(function () {
                if(translateRequest) {
                    translateRequest.abort();
                    clearTimeout(apyRequestTimeout);
                }

                $('input#webpage').attr({
                    'required': false,
                    'novalidate': true
                });

                $('div#translateWebpage').fadeOut('fast', function () {
                    $('button#cancelTranslateWebpage').fadeOut('fast', function () {
                        $('#srcLangSelectors').removeClass('col-sm-9').addClass('col-sm-11');
                    });
                    $('div#translateText').fadeIn('fast', function () {
                        synchronizeTextareaHeights();
                    });
                    if(!updateDetect(true)) {
                        translateText();
                    }
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
                    $('#detect').removeClass('disabledLang');
                });

                window.location.hash = 'translation';
            }).removeClass('cancelTranslateWebpage');

            $('input#webpage').keyup(function (ev /*: JQueryKeyEventObject */) {
                if(ev.keyCode === ENTER_KEY_CODE && isURL($('input#webpage').val())) {
                    translate();
                    return false;
                }
            });
        }

        function setupDocTranslation() {
            $('button#translateDoc').click(function () {
                $('div#translateText').fadeOut('fast', function () {
                    $('#fileInput').show();
                    $('div#fileName').hide();
                    $('div#docTranslation').fadeIn('fast');
                    updateDetect(false);
                });
                pairs = originalPairs;
                populateTranslationList();
            });

            $('button#cancelDocTranslate').click(function () {
                droppedFile = null;
                $('div#docTranslation').fadeOut('fast', function () {
                    $('a#fileDownload').hide();
                    $('span#uploadError').hide();
                    $('div#translateText').fadeIn('fast', synchronizeTextareaHeights);
                    var form /*: HTMLFormElement */ = ($('input#fileInput').wrap('<form>').closest('form')[0] /*: any */);
                    form.reset();
                    $('input#fileInput').unwrap();
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
                    if(!updateDetect(true)) {
                        translateText();
                    }
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

            $('body')
                .on('dragover', function (ev) {
                    ev.preventDefault();
                    return false;
                })
                .on('dragenter', function (ev) {
                    ev.preventDefault();
                    if(!$('div#fileDropBackdrop:visible').length) {
                        $('div#fileDropBackdrop').fadeTo('fast', 0.5);
                        $('div#fileDropMask').on('drop', function (ev) {
                            ev.preventDefault();
                            var originalEvent /*: DragEvent */ = (ev.originalEvent /*: any */);
                            // Assume non-null value
                            var dataTransfer /*: DataTransfer */ = (originalEvent.dataTransfer /*: any */);
                            droppedFile = dataTransfer.files[0];

                            $('#fileDropBackdrop').fadeOut();
                            if($('div#docTranslation').is(':visible')) {
                                $('input#fileInput').fadeOut('fast', function () {
                                    if(droppedFile) {
                                        $('div#fileName').show().text(droppedFile.name);
                                        translateDoc();
                                    }
                                });
                            }
                            else {
                                $('div#translateText').fadeOut('fast', function () {
                                    $('input#fileInput').hide();
                                    $('div#docTranslation').fadeIn('fast');

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
                var srcCode = $('.srcLang.active').attr('data-code');
                var dstCode = $('.dstLang.active').attr('data-code');
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
                var selectValue /*: string */ = $(this).val();
                if(selectValue === 'detect') {
                    $.when(detectLanguage()).done(translateText);
                }
                else {
                    handleNewCurrentLang(curSrcLang = (selectValue || curSrcLang), recentSrcLangs, 'srcLang', true);
                    autoSelectDstLang();
                }
            });

            $('#dstLangSelect').change(function () {
                handleNewCurrentLang(curDstLang = ($(this).val() || curDstLang), recentDstLangs, 'dstLang', true);
            });

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
                $('#detect').removeClass('activeAfterCancel');
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
                $.each(targetLists.pop(), function (i /*: number */, trgt) {
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
            $.each(pairs, function (srcLang /*: string */, _dstLangs) {
                chainedPairs[srcLang] = getChainedDstLangs(srcLang);
            });
            updatePairList();
            populateTranslationList();
        }

        $('.translateBtn').click(function () {
            translate();
            persistChoices('translator', true);
        });

        $('input#chainedTranslation').change(function () {
            updatePairList();
            populateTranslationList();
            persistChoices('translator');
        });

        var lastPunct = false;
        $('#originalText').on('keyup paste', function (ev /*: JQueryEventObject */) {
            var event /*: JQueryKeyEventObject */ = (ev /*: any */);

            if(lastPunct && (event.keyCode === SPACE_KEY_CODE || event.keyCode === ENTER_KEY_CODE)) {
                // Don't override the short timeout for simple space-after-punctuation
                return;
            }

            if(translationTimer && $('#instantTranslation').prop('checked')) {
                clearTimeout(translationTimer);
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

            translationTimer = setTimeout(function () {
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

function getPairs() /*: JQueryPromise<any> */ {
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
            console.warn('Translation pairs cache ' + (pairs ? 'miss' : 'stale') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=pairs',
                beforeSend: ajaxSend,
                success: function (data, _textStatus, _xOptions) {
                    handlePairs(data.responseData);
                    cache('pairs', data.responseData);
                },
                error: function (_xOptions, errorThrown) {
                    console.error('Failed to get available translation language pairs: ' + errorThrown);
                    translationNotAvailable();
                },
                complete: function (_xOptions, _errorThrown) {
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
            translate(true);
            return;
        }

        $.each(pairData, function (i /*: number */, pair) {
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

        $.each(dstLangs, function () {
            var parent = parentLang(this);
            if(dstLangs.indexOf(parent) === -1) {
                dstLangs.push(parent);
            }
        });

        $.each(srcLangs, function () {
            var parent = parentLang(this);
            if(!(parent in pairs)) {
                srcLangs.push(parent);
                pairs[parent] = [];
            }
        });

        for(var i = 0; i < TRANSLATION_LIST_BUTTONS; i++) {
            if(i < srcLangs.length) {
                recentSrcLangs.push(srcLangs[i]);
            }
            if(i < dstLangs.length) {
                recentDstLangs.push(dstLangs[i]);
            }
        }

        populateTranslationList();

        restoreChoices('translator');
        if(!curSrcLang) {
            setDefaultSrcLang();
        }

        translate(true);
    }

    return deferred.promise();
}

function handleNewCurrentLang(lang /*: string */, recentLangs /*: string[] */, langType /*: string */,
    resetDetect /*: ?boolean */, noTranslate /*: ?boolean */) {
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

function refreshLangList(resetDetect /*: ?boolean */) {
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

    function filterLangs(allRecentLangs /*: string[] */, allLangs /*: string[] */) /*: string[] */ {
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
    $('.languageCol').remove();

    var minColumnWidth = TRANSLATION_LIST_MAX_WIDTH / TRANSLATION_LIST_MAX_COLUMNS;

    var maxSrcLangsWidth, maxDstLangsWidth;

    // figure out how much space is actually available for the columns, defaulting to ltr
    var direction = locale ? langDirection(locale) : 'ltr';
    if(direction === 'ltr') {
        maxSrcLangsWidth = $(window).width() - $('#srcLanguagesDropdownTrigger').offset().left - TRANSLATION_LISTS_BUFFER;
        maxDstLangsWidth = $('#dstLanguagesDropdownTrigger').offset().left + $('#dstLanguagesDropdownTrigger').outerWidth() -
                            TRANSLATION_LISTS_BUFFER;
        $('#srcLanguages').removeClass('dropdown-menu-right').addClass('dropdown-menu-left');
        $('#dstLanguages').removeClass('dropdown-menu-left').addClass('dropdown-menu-right');
        $('.translateBtn').removeClass('mr-auto').addClass('ml-auto');
    }
    else {
        maxSrcLangsWidth = $('#srcLanguagesDropdownTrigger').offset().left + $('#srcLanguagesDropdownTrigger').outerWidth() -
                          TRANSLATION_LISTS_BUFFER;
        maxDstLangsWidth = $(window).width() - $('#dstLanguagesDropdownTrigger').offset().left - TRANSLATION_LISTS_BUFFER;
        $('#srcLanguages').removeClass('dropdown-menu-left').addClass('dropdown-menu-right');
        $('#dstLanguages').removeClass('dropdown-menu-right').addClass('dropdown-menu-left');
        $('.translateBtn').removeClass('ml-auto').addClass('mr-auto');
    }

    // then, prevent all the columns from getting too wide
    maxSrcLangsWidth = Math.min(TRANSLATION_LIST_MAX_WIDTH, maxSrcLangsWidth);
    maxDstLangsWidth = Math.min(TRANSLATION_LIST_MAX_WIDTH, maxDstLangsWidth);

    // finally, pick the ideal number of columns (up to limitations from the maximum overall width and the imposed maximum)
    var numSrcCols = Math.min(
            Math.ceil(srcLangs.length / TRANSLATION_LIST_IDEAL_ROWS),
            Math.floor(maxSrcLangsWidth / minColumnWidth),
            TRANSLATION_LIST_MAX_COLUMNS
        ),
        numDstCols = Math.min(
            Math.ceil(dstLangs.length / TRANSLATION_LIST_IDEAL_ROWS),
            Math.floor(maxDstLangsWidth / minColumnWidth),
            TRANSLATION_LIST_MAX_COLUMNS
        );

    var srcLangsPerCol = Math.ceil(srcLangs.length / numSrcCols),
        dstLangsPerCol = Math.ceil(dstLangs.length / numDstCols);

    for(var i = 0; i < numSrcCols; i++) {
        while(i * srcLangsPerCol < srcLangs.length && isVariant(srcLangs[i * srcLangsPerCol])) {
            srcLangsPerCol++;
        }
    }

    for(i = 0; i < numDstCols; i++) {
        while(i * dstLangsPerCol < dstLangs.length && isVariant(dstLangs[i * dstLangsPerCol])) {
            dstLangsPerCol++;
        }
    }

    for(i = 0; i < numSrcCols; i++) {
        var numSrcLang = srcLangsPerCol * i;
        var srcLangCol = $('<div class="languageCol">').appendTo($('#srcLanguages .row'));

        for(var j = numSrcLang; j < srcLangs.length && j < numSrcLang + srcLangsPerCol; j++) {
            var langCode = srcLangs[j];
            var langName = getLangByCode(langCode);
            var langClasses = 'languageName';
            if(isVariant(langCode)) {
                langClasses += ' languageVariant';
            }
            srcLangCol.append(
                $('<div class="' + langClasses + '"></div>')
                    .attr('data-code', langCode)
                    .text(langName)
            );
        }
    }

    for(i = 0; i < numDstCols; i++) {
        var numDstLang = dstLangsPerCol * i;
        var dstLangCol = $('<div class="languageCol">').appendTo($('#dstLanguages .row'));

        for(j = numDstLang; j < dstLangs.length && j < numDstLang + dstLangsPerCol; j++) {
            langCode = dstLangs[j];
            langName = getLangByCode(langCode);
            langClasses = 'languageName';
            if(isVariant(langCode)) {
                langClasses += ' languageVariant';
            }
            dstLangCol.append(
                $('<div class="' + langClasses + '"></div>')
                    .attr('data-code', langCode)
                    .text(langName)
            );
        }
    }

    $('#srcLanguages').css('min-width', numSrcCols * minColumnWidth);
    $('#dstLanguages').css('min-width', numDstCols * minColumnWidth);
    $('#srcLanguages .languageCol').css('width', (100.0 / numSrcCols) + '%');
    $('#dstLanguages .languageCol').css('width', (100.0 / numDstCols) + '%');

    $('.langSelect option[value!=detect]').remove();
    $.each(srcLangs, function () {
        $('#srcLangSelect').append(
            $('<option></option>')
                .prop('value', this)
                .html(getLangByCode(this))
        );
    });
    $.each(dstLangs, function () {
        $('#dstLangSelect').append(
            $('<option></option>')
                .prop('value', this)
                .html(getLangByCode(this))
        );
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

        function compareLangCodes(a, b) {
            var aVariant = a.split('_'), bVariant = b.split('_');
            var directCompare;
            try {
                directCompare = getLangByCode(aVariant[0]).localeCompare(getLangByCode(bVariant[0]), sortLocale);
            }
            catch(e) {
                directCompare = getLangByCode(aVariant[0]).localeCompare(getLangByCode(bVariant[0]));
            }

            if(aVariant[1] && bVariant[1] && aVariant[0] === bVariant[0]) {
                return directCompare;
            }
            else if(aVariant[1] && aVariant[0] === b) {
                return 1;
            }
            else if(bVariant[1] && bVariant[0] === a) {
                return -1;
            }
            else {
                return directCompare;
            }
        }

        srcLangs = srcLangs.sort(compareLangCodes);
        dstLangs = dstLangs.sort(function (a, b) {
            var possibleDstLangs = pairs[curSrcLang] || [];

            function isPossible(lang) {
                return possibleDstLangs.indexOf(lang) !== -1;
            }

            function isFamilyPossible(lang) {
                var parent = parentLang(lang);
                return isPossible(lang) ||
                    possibleDstLangs.indexOf(parent) !== -1 ||
                    possibleDstLangs.some(function (possibleLang) {
                        return parentLang(possibleLang) === parent;
                    });
            }

            var aParent = parentLang(a), bParent = parentLang(b);
            var aFamilyPossible = isFamilyPossible(a), bFamilyPossible = isFamilyPossible(b);
            if(aFamilyPossible === bFamilyPossible) {
                if(aParent === bParent) {
                    var aVariant = isVariant(a), bVariant = isVariant(b);
                    if(aVariant && bVariant) {
                        var aPossible = isPossible(a), bPossible = isPossible(b);
                        if(aPossible === bPossible) {
                            return compareLangCodes(a, b);
                        }
                        else if(aPossible) {
                            return -1;
                        }
                        else {
                            return 1;
                        }
                    }
                    else if(aVariant) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                }
                else {
                    return compareLangCodes(a, b);
                }
            }
            else if(aFamilyPossible) {
                return -1;
            }
            else {
                return 1;
            }
        });
    }
}

function translate(ignoreIfEmpty) {
    if(translationTimer) {
        clearTimeout(translationTimer);
    }

    if($('div#translateWebpage').is(':visible') || isURL($('#originalText').val())) {
        translateWebpage(ignoreIfEmpty);
    }
    else if($('div#translateText').is(':visible')) {
        translateText(ignoreIfEmpty);
    }
    else if($('div#docTranslation').is(':visible')) {
        translateDoc();
    }
}

function translateText(ignoreIfEmpty) {
    function handleTranslateSuccessResponse(data) {
        if(data.responseStatus === HTTP_OK_CODE) {
            $('#translatedText').val(data.responseData.translatedText);
            $('#translatedText').removeClass('notAvailable text-danger');
        }
        else {
            translationNotAvailable();
        }
    }

    var originalText /*: string */ = removeSoftHyphens($('#originalText').val());

    if(!originalText && ignoreIfEmpty) {
        return;
    }

    if($('div#translateText').is(':visible')) {
        if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
            sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, originalText.length);

            if(translateRequest) {
                translateRequest.abort();
                clearTimeout(apyRequestTimeout);
            }

            var endpoint/*: string */;
            var request /*: { langpairs?: string, langpair?: string, q: string, markUnknown: string } */ = {
                q: originalText, // eslint-disable-line id-length
                markUnknown: $('#markUnknown').prop('checked') ? 'yes' : 'no'
            };

            if($('input#chainedTranslation').prop('checked') && config.TRANSLATION_CHAINING) {
                endpoint = '/translateChain';
                request.langpairs = curSrcLang + '|' + curDstLang;
            }
            else {
                endpoint = '/translate';
                request.langpair = curSrcLang + '|' + curDstLang;
            }

            translateRequest = callApy({
                data: request,
                success: handleTranslateSuccessResponse,
                error: translationNotAvailable,
                complete: function () {
                    ajaxComplete();
                    translateRequest = null;
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
    var file = droppedFile ? droppedFile : null;
    var fileInput /*: HTMLInputElement */ = ($('input#fileInput')[0] /*: any */);

    if(fileInput.files.length > 0 && fileInput.files[0].size !== 0) {
        file = fileInput.files[0];
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

                // $FlowFixMe
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
                        $('div#fileUploadProgress').parent().fadeOut('fast');
                        $('div#fileLoading').fadeOut('fast', function () {
                            if(typeof window.navigator.msSaveBlob !== 'undefined') {
                                // IE file download workaround
                                $('a#fileDownload')
                                    .click(function () {
                                        window.navigator.msSaveBlob(xhr.response, fileName);
                                    });
                            }
                            else if(/.*(?!chrome|android).*(version\/\d\.|Mobile).*safari/i.test(window.navigator.userAgent) &&
                                !/chrome/i.test(window.navigator.userAgent)) {
                                /* Safari <9 + Mobile file download workaround
                                 * Tests User Agent against a regexp to detect if the user is on older or mobile version of
                                 * Safari and then runs another test to eliminate Chrome, which also include Safari in UA.
                                 */
                                var reader = new FileReader();
                                reader.onload = function () {
                                    $('a#fileDownload')
                                        .click(function () {
                                            // Flow infers incorrect type ArrayBuffer
                                            var result /*: string */ = (reader.result /*: any */);
                                            window.location.href = result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                                        });
                                };
                                reader.readAsDataURL(xhr.response);
                            }
                            // File download for modern browsers and right-click to save
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
                        docTranslateError(getDynamicLocalization('Not_Available'), 'Not_Available');
                    }
                };
                xhr.onerror = function () {
                    docTranslateError(getDynamicLocalization('Not_Available'), 'Not_Available');
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
    else if(file) {
        docTranslateError(getDynamicLocalization('Not_Available'), 'Not_Available');
    }

    function updateProgressBar(ev /*: ProgressEvent | {'total': number, 'loaded': number} */) {
        var progress = ev.loaded / ev.total;
        var percentDone = Math.floor(progress * 1000) / 10;
        $('div#fileUploadProgress').attr('aria-valuenow', percentDone).css('width', percentDone + '%');
    }

    function docTranslateError(errorMessage /*: string */, errorTextName /*: string */) {
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

function translateWebpage(ignoreIfEmpty /*: ?boolean */) {
    function webpageTranslationNotAvailable(data) {
        $('#translatedWebpage').replaceWith(
            $('<div id="translatedWebpage" class="notAvailable text-danger w-100 pl-2 pt-2"></div>')
                .text(getDynamicLocalization('Not_Available'))
        );

        if(data) {
            console.warn('Webpage translation failed', data.message, data.explanation);
        }
    }

    function handleTranslateWebpageSuccessResponse(data) {
        function cleanPage(html /*: string */) /*: string */ {
            // Pages like https://goo.gl/PiZyW3 insert noise using document.write that
            // 1. makes things enormously slow, and 2. completely mess up styling so e.g. you
            // have to scroll through a full screen of whitespace before reaching content.
            // This might mess things up some places – needs testing – but on the other hand
            // most uses of document.write are evil.
            return html.replace(/document\.write\(/g, 'console.log("document.write "+');
        }

        var translatedHtml /*: string */ = data.responseData.translatedText;

        if(data.responseStatus === HTTP_OK_CODE && translatedHtml) {
            var iframe /*: HTMLIFrameElement */ = ($('<iframe id="translatedWebpage" frameborder="0"></iframe>')[0] /*: any */);
            $('#translatedWebpage').replaceWith(iframe);
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(cleanPage(translatedHtml));
            iframe.contentWindow.document.close();

            $(iframe).on('load', function () {
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

    var url /*: string */ = $('input#webpage').val();

    if(!url && ignoreIfEmpty) {
        return;
    }

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
                translateRequest = null;
                $('iframe#translatedWebpage').animate({'opacity': 1}, 'fast');
            }
        }, '/translatePage', true);
    }
}

function showTranslateWebpageInterface(url /*: ?string */, ignoreIfEmpty /*: ?boolean */) {
    $('#srcLangSelectors').removeClass('col-sm-11').addClass('col-sm-9');

    $('div#translateText').fadeOut('fast', function () {
        $('input#webpage').attr({
            'required': true,
            'novalidate': false
        });
        $('button#cancelTranslateWebpage').fadeIn('fast').addClass('cancelTranslateWebpage');
        $('div#translateWebpage').fadeIn('fast');
        updateDetect(false);

        if(url) {
            $('input#webpage').val(url);
        }

        window.location.hash = 'webpageTranslation';
        translateWebpage(ignoreIfEmpty);
    });
}

function updateDetect(active /*: bool */) {
    var wasActive;

    if(active) {
        wasActive = $('#detect').hasClass('activeAfterCancel');

        if(wasActive) {
            $('.srcLang').removeClass('active');
            $('#detect').addClass('active');
            handleDetectLanguageSuccessComplete();
            $('#detect').removeClass('activeAfterCancel');
        }

        $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
        $('#detect').removeClass('disabledLang');
    }
    else {
        wasActive = $('#detect').hasClass('active');

        if(wasActive) {
            $('#srcLang1').click();
            $('#detect').addClass('activeAfterCancel');
        }

        $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', true);
        $('#detect').addClass('disabledLang');
    }

    persistChoices('translator');
    return wasActive;
}

function detectLanguage() {
    var originalText /*: string */ = $('#originalText').val();

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
            translateRequest = null;
        }
    }, '/identifyLang');

    return translateRequest;

    function handleDetectLanguageSuccessResponse(data) {
        var possibleLanguages /*: string[][] */ = [];
        for(var lang in data) {
            possibleLanguages.push([lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang, data[lang]]);
        }
        possibleLanguages.sort(function (a, b) {
            return parseInt(b[1], 10) - parseInt(a[1], 10);
        });

        var oldSrcLangs /*: string[] */ = recentSrcLangs;
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
        handleDetectLanguageSuccessComplete();
    }

    function handleDetectLanguageErrorResponse() {
        $('#srcLang1').click();
    }
}

function handleDetectLanguageSuccessComplete() {
    muteLanguages();
    $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
    refreshLangList();
    $('#detectedText').show();
    $('#detectText').hide();
}

function translationNotAvailable() {
    $('#translatedText')
        .val(getDynamicLocalization('Not_Available'))
        .text(getDynamicLocalization('Not_Available'))
        .addClass('notAvailable text-danger');
}

function muteLanguages() {
    var possibleDstLangs = pairs[curSrcLang] || [];

    $('.languageName.text-muted').removeClass('text-muted');
    $('.dstLang').removeClass('disabledLang').prop('disabled', false);

    $.each($('#dstLanguages .languageName'), function () {
        if(possibleDstLangs.indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('text-muted');
        }
    });

    $.each($('.dstLang'), function () {
        if(possibleDstLangs.indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('disabledLang').prop('disabled', true);
        }
    });

    $.each($('#dstLangSelect option'), function (i, element) {
        $(element).prop('disabled', !pairs[curSrcLang] || pairs[curSrcLang].indexOf($(element).val()) === -1);
    });
}

function autoSelectDstLang() {
    var possibleDstLangs = pairs[curSrcLang] || [];

    // currently selected destination language works
    if(possibleDstLangs.indexOf(curDstLang) !== -1) {
        return;
    }

    // prefer a recently selected destination language
    var newDstLang/*: ?string */;
    for(var i = 0; i < recentDstLangs.length; i++) {
        if(possibleDstLangs.indexOf(recentDstLangs[i]) !== -1) {
            newDstLang = recentDstLangs[i];
            break;
        }
    }

    // otherwise, pick the first possible destination language
    if(!newDstLang && possibleDstLangs.length > 0) {
        var filteredPossibleDstLangs = filterLangList(possibleDstLangs);
        if(filteredPossibleDstLangs.length > 0) {
            newDstLang = filterLangList(possibleDstLangs)[0];
        }
    }

    curDstLang = newDstLang || curDstLang;

    if(recentDstLangs.indexOf(curDstLang) === -1) {
        handleNewCurrentLang(curDstLang, recentDstLangs, 'dstLang');
    }
    else {
        $('.dstLang').removeClass('active');
        refreshLangList();
        $('.dstLang[data-code=' + curDstLang + ']').addClass('active');
        muteLanguages();
        localizeInterface();
        translateText();
    }

    $('#dstLangSelect').val(curDstLang).change();
}

function setCurSrcLang(lang /*: string */) {
    curSrcLang = lang;
    return lang;
}

function setCurDstLang(lang /*: string */) {
    curDstLang = lang;
    return lang;
}

function setRecentSrcLangs(langs /*: string[] */) {
    recentSrcLangs = langs;
    return langs;
}

function setRecentDstLangs(langs /*: string[] */) {
    recentDstLangs = langs;
    return langs;
}

function setDefaultSrcLang() {
    function validSrcLang(lang) {
        return languages[lang] && pairs[iso639CodesInverse[lang]];
    }

    function convertBCP47LangCode(lang) {
        var iso639Lang;

        // converts variant format
        iso639Lang = lang.replace('-', '_');

        // BCP 47 prefers shortest code, we prefer longest
        if(isVariant(iso639Lang)) {
            var splitLang = iso639Lang.split('_', 2);
            if(iso639CodesInverse[splitLang[0]]) {
                iso639Lang = iso639CodesInverse[splitLang[0]] + '_' + splitLang[1];
            }
        }

        return iso639Lang;
    }

    // default to first available browser preference pair
    var prefSrcLang;

    var browserLangs = window.navigator.languages; // Chrome, Mozilla and Safari
    if(browserLangs) {
        for(var i = 0; i < browserLangs.length; ++i) {
            var isoLang = convertBCP47LangCode(browserLangs[i]);
            if(validSrcLang(isoLang)) {
                prefSrcLang = isoLang;
                break;
            }
        }
    }

    var ieLang = window.navigator.userlanguage || window.navigator.browserlanguage || window.navigator.language;
    if(!prefSrcLang && ieLang) {
        var ieIsoLang = convertBCP47LangCode(ieLang);
        if(validSrcLang(ieIsoLang)) {
            prefSrcLang = ieIsoLang;
        }
        else if(validSrcLang(iso639Codes[parentLang(ieIsoLang)])) {
            prefSrcLang = iso639Codes[parentLang(ieIsoLang)];
        }
    }

    if(!prefSrcLang) {
        // first available overall pair
        for(var srcLang in pairs) {
            prefSrcLang = srcLang;
            break;
        }
        return; // unreachable
    }

    setCurSrcLang(iso639CodesInverse[prefSrcLang]);
    handleNewCurrentLang(curSrcLang, recentSrcLangs, 'srcLang');
    autoSelectDstLang();
}

/*:: export {curDstLang, curSrcLang, dstLangs, getPairs, handleNewCurrentLang, pairs, populateTranslationList, recentDstLangs,
    refreshLangList, recentSrcLangs, setCurDstLang, setCurSrcLang, setRecentDstLangs, setRecentSrcLangs, showTranslateWebpageInterface,
    srcLangs} */

/*:: import {synchronizeTextareaHeights, modeEnabled, ajaxSend, ajaxComplete, filterLangList, onlyUnique, sendEvent, callApy,
    apyRequestTimeout, removeSoftHyphens, parentLang, isVariant} from "./util.js" */
/*:: import {ENTER_KEY_CODE, HTTP_BAD_REQUEST_CODE, HTTP_OK_CODE, SPACE_KEY_CODE, XHR_DONE, XHR_LOADING} from "./util.js" */
/*:: import {persistChoices, restoreChoices} from "./persistence.js" */
/*:: import {localizeInterface, getLangByCode, getDynamicLocalization, locale, iso639Codes, langDirection, languages,
    iso639CodesInverse} from "./localization.js" */
/*:: import {readCache, cache} from "./persistence.js" */
/*:: import {isURL} from "./util.js" */
