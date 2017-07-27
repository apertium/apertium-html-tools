var spellers = {}, spellerData = {};
var currentSpellCheckerRequest;

/* exported getSpellers */
/* global config, modeEnabled, persistChoices, readCache, ajaxSend, ajaxComplete, filterLangList, allowedLang, analyzers, cache,
    localizeInterface, getLangByCode, sendEvent, restoreChoices, callApy */
/* global ENTER_KEY_CODE */

function getSpellers() {
    var deferred = $.Deferred();

    if(config.SPELLERS) {
        spellerData = config.SPELLERS;
        populatePrimarySpellcheckerList(spellerData);
        deferred.resolve();
    }
    else {
        var spellers = readCache('spellers', 'LIST_REQUEST');
        if(spellers) {
            spellerData = spellers;
            populatePrimarySpellcheckerList(spellerData);
            deferred.resolve();
        }
        else {
            console.warn('Spellers cache ' + (spellers === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=spellers',
                beforeSend: ajaxSend,
                success: function (data) {
                    spellerData = data;
                    populatePrimarySpellcheckerList(spellerData);
                    cache('spellers', data);
                    populatePrimarySpellcheckerList(data);
                },
                error: function () {
                    console.error('Failed to get available spellers');
                },
                complete: function () {
                    ajaxComplete();
                    deferred.resolve();
                }
            });
        }
    }

    return deferred.promise();
}

if(modeEnabled('spellchecker')) {
    $(document).ready(function () {
        restoreChoices('spellchecker');
        var timer, timeout = 2000;
        $('#check').click(function () {
            clearTimeout(timer);
            check();
        });


        $('#spellcheckerInput').on('input propertychange', function () {
            if(timer && $('#instantChecking').prop('checked')) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                if($('#instantChecking').prop('checked')) {
                    check();
                }
            }, timeout);
        });

        $('#primarySpellcheckerMode').change(function () {
            populateSecondarySpellcheckerList();
            localizeInterface();
            persistChoices('spellchecker');
        });

        $('#secondarySpellcheckerMode').change(function () {
            persistChoices('spellchecker');
        });

        $('#spellCheckerInput').keydown(function (e) {
            if(e.keyCode === ENTER_KEY_CODE && !e.shiftKey) {
                e.preventDefault();
                check();
            }
        });

        $('#instantChecking').change(function () {
            persistChoices('spellchecker');
        });

        $('#spellcheckerInput').on('input propertychange', function () {
            $('#spellcheckerInput').removeClass('spellcheckVisible');
            $('.spellError').each(function () {
                $(this).popover('hide');
            });
            persistChoices('spellchecker');
        });

        $('#spellcheckerInput').submit(function () {
            clearTimeout(timer);
            check();
        });

        $(document).on('mouseover', '.spellcheckVisible .spellError', function () {
            $('.spellError').each(function () {
                $(this).popover('hide');
            });
            $(this).popover('show');
        });

        $(document).on('mouseleave', '.spellError', function () {
            var hidePopoverDuration = 400;
            var hidePopoverTimer = setTimeout(function () {
                $(this).popover('hide');
            }, hidePopoverDuration);
            $(this).on('mouseover', function () {
                clearTimeout(hidePopoverTimer);
            });
            $(document).on('mouseover', '.popover', function () {
                clearTimeout(hidePopoverTimer);
            });
            $(document).on('mouseleave', '.popover', function () {
                $(this).popover('hide');
            });
        });

        $(document).on('click', '.list-group-item', function () {
            var e = $(this).parents('.popover').prev();
            e.text($(this).text());
            e.removeClass('spellError');
            e.popover('hide');
            check();
        });
    });
}

function populateSecondarySpellcheckerList() {
    var group = analyzers[$('#primarySpellcheckerMode').val()];
    $('#secondarySpellcheckerMode').empty();

    if(group) {
        if(group.length <= 1) {
            $('#secondarySpellcheckerMode').fadeOut('fast');
        }
        else {
            $('#secondarySpellcheckerMode').fadeIn('fast');
        }

        group.sort(function (a, b) {
            return a.length - b.length;
        });

        for(var i = 0; i < group.length; i++) {
            var lang = group[i];
            var langDisplay = lang.indexOf('-') !== -1
                ? getLangByCode(lang.split('-')[0]) + '-' + getLangByCode(lang.split('-')[1])
                : getLangByCode(lang);
            $('#secondarySpellcheckerMode').append($('<option></option').val(lang).text(langDisplay));
        }
    }
    else {
        $('#secondarySpellcheckerMode').fadeOut('fast');
    }
}
function populatePrimarySpellcheckerList(data) {
    $('.spellcheckerMode').empty();

    spellers = {};
    for(var lang in data) {
        var spellerLang = lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang;
        var group = spellers[spellerLang];
        if(group) {
            group.push(lang);
        }
        else {
            spellers[spellerLang] = [lang];
        }
    }

    var spellerArray = [];
    $.each(spellers, function (spellerLang, lang) {
        spellerArray.push([spellerLang, lang]);
    });
    spellerArray = filterLangList(spellerArray, function (speller) {
        return allowedLang(speller[0]);
    });
    spellerArray.sort(function (a, b) {
        return getLangByCode(a[0]).localeCompare(getLangByCode(b[0]));
    });

    for(var i = 0; i < spellerArray.length; i++) {
        lang = spellerArray[i][0];
        $('#primarySpellcheckerMode').append($('<option></option>').val(lang).text(getLangByCode(lang)));
    }

    restoreChoices('spellerchecker');
}

function check() {
    $('#spellcheckerInput').addClass('spellcheckVisible');
    $('#spellcheckerInput').html($('#spellcheckerInput').html().replace(/br/g, '\n')
        .replace(/&nbsp;/g, ' '));
    var words = $.trim($('#spellcheckerInput').text());
    var splitWords = words.split(' ');
    var content = {};
    $('#spellcheckerInput').html('');
    currentSpellCheckerRequest = callApy({
        data: {
            'q': words,
            'lang': $('#primarySpellcheckerMode').val()
        },
        success: function (data) {
            var originalWordsIndex = 0;
            for(var tokenIndex = 0; tokenIndex < data.length; tokenIndex++) {
                if(data[tokenIndex]['known'] === true) { // eslint-disable-line dot-notation
                    $('#spellcheckerInput').html($('#spellcheckerInput').html() + ' ' + splitWords[originalWordsIndex]);
                    originalWordsIndex++;
                    continue;
                }
                $('#spellcheckerInput').html($('#spellcheckerInput').html() + ' <span class="spellError" id=' +
                    splitWords[originalWordsIndex] + '>' + splitWords[originalWordsIndex] + '</span>');
                content[splitWords[originalWordsIndex]] = '<div class="list-group">';
                for(var sugg = 0; sugg < data[tokenIndex]['sugg'].length; sugg++) { // eslint-disable-line dot-notation
                    content[splitWords[originalWordsIndex]] += '<a href="#" class="list-group-item">' +
                        data[tokenIndex]['sugg'][sugg][0] + '</a>'; // eslint-disable-line dot-notation
                    content[splitWords[originalWordsIndex]] += '</div>';
                }
                $('.spellError').each(function () {
                    var currentTokenId = this.id;
                    $(this).popover({animation: false, placement: 'bottom', trigger: 'manual', html: true,
                        content: content[currentTokenId]});
                });
                originalWordsIndex++;
            }
        },
        error: handleSpellCheckerErrorResponse,
        complete: function () {
            ajaxComplete();
            currentSpellCheckerRequest = undefined;
        }
    }, '/speller', true);
}

function handleSpellCheckerErrorResponse(jqXHR) {
    spellCheckerNotAvailable(jqXHR.responseJSON);
}

function spellCheckerNotAvailable(data) {
    $('#spellcheckerInput').append($('<div></div>').text(' '));
    $('#spellcheckerInput').append($('<div></div>').text(data.message));
    $('#spellcheckerInput').append($('<div></div>').text(data.explanation));
}
