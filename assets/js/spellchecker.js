// @flow

var spellers = {}, spellerData = {};
var currentSpellCheckerRequest;

/* exported getSpellers, spellerData */
/* global config, modeEnabled, persistChoices, readCache, ajaxSend, ajaxComplete, filterLangPairList, allowedLang, cache,
    localizeInterface, getLangByCode, restoreChoices, callApy */
/* global ENTER_KEY_CODE */

function getSpellers() /*: JQueryPromise<any> */ {
    var deferred = $.Deferred();

    if(config.SPELLERS) {
        spellerData = config.SPELLERS;
        populatePrimarySpellCheckerList(spellerData);
        deferred.resolve();
    }
    else {
        var spellers = readCache('spellers', 'LIST_REQUEST');
        if(spellers) {
            spellerData = spellers;
            populatePrimarySpellCheckerList(spellerData);
            deferred.resolve();
        }
        else {
            console.warn('Spellers cache ' + (spellers === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=spellers',
                beforeSend: ajaxSend,
                success: function (data) {
                    spellerData = data;
                    populatePrimarySpellCheckerList(spellerData);
                    cache('spellers', data);
                    populatePrimarySpellCheckerList(data);
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

if(modeEnabled('spellchecking')) {
    $(document).ready(function () {
        restoreChoices('spellchecker');
        var timer, timeout = 2000;
        $('#spellCheckerForm').submit(function () {
            clearTimeout(timer);
            check();
        });

        $('#spellCheckerInput').on('input propertychange', function () {
            if(timer && $('#instantChecking').prop('checked')) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                if($('#instantChecking').prop('checked')) {
                    check();
                }
            }, timeout);
        });

        $('#primarySpellCheckerMode').change(function () {
            localizeInterface();
            persistChoices('spellchecker');
        });

        $('#spellCheckerInput').keydown(function (e /*: JQueryKeyEventObject */) {
            if(e.keyCode === ENTER_KEY_CODE && !e.shiftKey) {
                e.preventDefault();
                check();
            }
        });

        $('#instantChecking').change(function () {
            persistChoices('spellchecker');
        });

        $('#spellCheckerInput').on('input propertychange', function () {
            $('#spellCheckerInput').removeClass('spellCheckerVisible');
            $('.spellError').each(function () {
                $(this).popover('hide');
            });
            persistChoices('spellchecker');
        });

        $('#spellCheckerInput').submit(function () {
            clearTimeout(timer);
            check();
        });

        $(document).on('mouseover', '.spellCheckerVisible .spellError', function () {
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

        $(document).on('click', '.spellCheckerListItem', function () {
            var e = $(this).parents('.popover').prev();
            e.text($(this).text());
            e.removeClass('spellError');
            e.popover('hide');
            check();
        });
    });
}

function populatePrimarySpellCheckerList(data /*: {} */) {
    $('.spellCheckerMode').empty();

    spellers = ({} /*: {[string]: string[]} */);
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

    var spellerArray /*: [string, string][] */ = [];
    $.each(spellers, function (spellerLang /*: string */, lang /*: string */) {
        spellerArray.push([spellerLang, lang]);
    });
    spellerArray = filterLangPairList(spellerArray, function (speller /*: [string, string] */) {
        return allowedLang(speller[0]);
    });
    spellerArray.sort(function (a, b) {
        return getLangByCode(a[0]).localeCompare(getLangByCode(b[0]));
    });

    for(var i = 0; i < spellerArray.length; i++) {
        lang = spellerArray[i][0];
        $('#primarySpellCheckerMode').append($('<option></option>').val(lang).text(getLangByCode(lang)));
    }

    restoreChoices('spellerchecker');
}

function check() {
    if(currentSpellCheckerRequest) {
        currentSpellCheckerRequest.abort();
    }
    $('#spellCheckerInput').addClass('spellCheckerVisible');
    $('#spellCheckerInput').html($('#spellCheckerInput').html().replace(/br/g, '\n')
        .replace(/&nbsp;/g, ' '));
    var words = $.trim($('#spellCheckerInput').text());
    var splitWords = words.split(' ');
    var content = {};
    $('#spellCheckerInput').html('');
    currentSpellCheckerRequest = callApy({
        data: {
            'q': words,
            'lang': $('#primarySpellCheckerMode').val()
        },
        success: function (data) {
            var originalWordsIndex = 0;
            for(var tokenIndex = 0; tokenIndex < data.length; tokenIndex++) {
                if(data[tokenIndex].known === true) {
                    $('#spellCheckerInput').html($('#spellCheckerInput').html() + ' ' + splitWords[originalWordsIndex]);
                    originalWordsIndex++;
                    continue;
                }
                $('#spellCheckerInput').html($('#spellCheckerInput').html() + ' <span class="spellError" id=' +
                    splitWords[originalWordsIndex] + '>' + splitWords[originalWordsIndex] + '</span>');
                content[splitWords[originalWordsIndex]] = '<div class="spellCheckerList">';
                for(var sugg = 0; sugg < data[tokenIndex].sugg.length; sugg++) {
                    content[splitWords[originalWordsIndex]] += '<a href="#" class="spellCheckerListItem">' +
                        data[tokenIndex].sugg[sugg][0] + '</a>';
                }
                content[splitWords[originalWordsIndex]] += '</div>';
                originalWordsIndex++;
            }
            $('.spellError').each(function () {
                var currentTokenId = this.id;
                $(this).popover({
                    animation: false,
                    placement: 'bottom',
                    trigger: 'manual',
                    html: true,
                    content: content[currentTokenId]
                });
            });

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
    $('#spellCheckerInput').append($('<div></div>').text(data.message));
    $('#spellCheckerInput').append($('<div></div>').text(data.explanation));
}

/*:: export {getSpellers, spellerData} */

/*:: import {modeEnabled, ajaxSend, ajaxComplete, allowedLang, filterLangPairList, callApy, ENTER_KEY_CODE} from "./util.js" */
/*:: import {persistChoices, restoreChoices} from "./persistence.js" */
/*:: import {localizeInterface, getLangByCode} from "./localization.js" */
/*:: import {readCache, cache} from "./persistence.js" */
