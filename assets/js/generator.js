// @flow

var generators = ({} /*: {[string]: string[]} */), generatorData = {};
var currentGeneratorRequest;

/* exported generatorData, generators, getGenerators, populateGeneratorList, populateSecondaryGeneratorList */

/* global config, modeEnabled, persistChoices, readCache, ajaxSend, ajaxComplete, filterLangPairList, allowedLang, analyzers, cache,
    localizeInterface, getLangByCode, sendEvent, restoreChoices, callApy, apyRequestTimeout */
/* global ENTER_KEY_CODE */

if(modeEnabled('generation')) {
    $(document).ready(function () {
        $('#generateForm').submit(function () {
            generate();
            persistChoices('generator', true);
        });

        $('#primaryGeneratorMode').change(function () {
            populateSecondaryGeneratorList();
            localizeInterface();
            persistChoices('generator');
        });

        $('#secondaryGeneratorMode').change(function () {
            persistChoices('generator');
        });

        $('#morphGeneratorInput').keydown(function (e /*: JQueryKeyEventObject */) {
            if(e.keyCode === ENTER_KEY_CODE && !e.shiftKey) {
                e.preventDefault();
                generate();
            }
        });

        $('#morphGeneratorInput').on('input propertychange', function () {
            persistChoices('generator');
        });

        $('#morphGeneratorInput').blur(function () {
            persistChoices('generator', true);
        });
    });
}

function getGenerators() /*: JQueryPromise<any> */ {
    var deferred = $.Deferred();

    if(config.GENERATORS) {
        generatorData = config.GENERATORS;
        populateGeneratorList(generatorData);
        deferred.resolve();
    }
    else {
        var generators = readCache('generators', 'LIST_REQUEST');
        if(generators) {
            generatorData = generators;
            populateGeneratorList(generators);
            deferred.resolve();
        }
        else {
            console.warn('Generators cache ' + (analyzers ? 'miss' : 'stale') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=generators',
                beforeSend: ajaxSend,
                success: function (data, _textStatus, _xOptions) {
                    generatorData = data;
                    populateGeneratorList(generatorData);
                    cache('generators', data);
                },
                error: function (_xOptions, errorThrown) {
                    console.error('Failed to get available generators: ' + errorThrown);
                },
                complete: function (_xOptions, _errorThrown) {
                    ajaxComplete();
                    deferred.resolve();
                }
            });
        }
    }

    return deferred.promise();
}

function populateGeneratorList(data /*: {} */) {
    $('.generatorMode').empty();

    generators = {};
    for(var lang in data) {
        var generatorLang = lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang;
        var group = generators[generatorLang];
        if(group) {
            group.push(lang);
        }
        else {
            generators[generatorLang] = [lang];
        }
    }

    var generatorArray /*: [string, string][] */ = [];
    $.each(generators, function (generatorLang /*: string */, lang /*: string */) {
        generatorArray.push([generatorLang, lang]);
    });
    generatorArray = filterLangPairList(generatorArray, function (generator /*: [string, string] */) {
        return allowedLang(generator[0]);
    });
    generatorArray.sort(function (a, b) {
        return getLangByCode(a[0]).localeCompare(getLangByCode(b[0]));
    });

    for(var i = 0; i < generatorArray.length; i++) {
        lang = generatorArray[i][0];
        $('#primaryGeneratorMode').append($('<option></option>').val(lang).text(getLangByCode(lang)));
    }

    restoreChoices('generator');
}

function populateSecondaryGeneratorList() {
    var group = generators[$('#primaryGeneratorMode').val()];
    $('#secondaryGeneratorMode').empty();

    if(group) {
        if(group.length <= 1) {
            $('#secondaryGeneratorMode').fadeOut('fast');
        }
        else {
            $('#secondaryGeneratorMode').fadeIn('fast');
        }

        group.sort(function (a, b) {
            return a.length - b.length;
        });

        for(var i = 0; i < group.length; i++) {
            var lang = group[i];
            var langDisplay = lang.indexOf('-') !== -1
                ? getLangByCode(lang.split('-')[0]) + '-' + getLangByCode(lang.split('-')[1])
                : getLangByCode(lang);
            $('#secondaryGeneratorMode').append($('<option></option').val(lang).text(langDisplay));
        }
    }
    else {
        $('#secondaryGeneratorMode').fadeOut('fast');
    }
}

function generate() {
    var input /*: string */ = $('#morphGeneratorInput').val();

    if(!$('#primaryGeneratorMode').val() || input.trim() === '') {
        return;
    }

    var generatorMode /*: string */ = generators[$('#primaryGeneratorMode').val()].length > 1
        ? $('#secondaryGeneratorMode').val()
        : generators[$('#primaryGeneratorMode').val()][0];
    sendEvent('generator', 'generate', generatorMode, $('#morphGeneratorInput').val().length);

    $('#morphGenOutput').addClass('blurred');

    if(currentGeneratorRequest) {
        currentGeneratorRequest.abort();
        clearTimeout(apyRequestTimeout);
    }

    currentGeneratorRequest = callApy({
        data: {
            'lang': generatorMode,
            'q': input
        },
        success: handleGenerateSuccessResponse,
        error: handleGenerateErrorResponse,
        complete: function () {
            ajaxComplete();
            currentGeneratorRequest = null;
        }
    }, '/generate');
}

function handleGenerateSuccessResponse(data) {
    $('#morphGenOutput').empty();
    for(var i = 0; i < data.length; i++) {
        var div = $('<div data-toggle="tooltip" data-placement="auto" data-html="true"></div>');
        var strong = $('<strong></strong>').text(data[i][1].trim());
        var span = $('<span></span>').html('&nbsp;&nbsp;&#8620;&nbsp;&nbsp;' + data[i][0]);
        div.append(strong).append(span);
        $('#morphGenOutput').append(div);
    }
    $('#morphGenOutput').removeClass('blurred');
}

function handleGenerateErrorResponse(xOptions, error) {
    $('#morphGenOutput').text(error);
    $('#morphGenOutput').removeClass('blurred');
}

/*:: export {generatorData, generators, getGenerators, populateGeneratorList, populateSecondaryGeneratorList} */

/*:: import {ajaxComplete, ajaxSend, allowedLang, apyRequestTimeout, callApy, ENTER_KEY_CODE, filterLangPairList, modeEnabled,
    sendEvent} from "./util.js" */
/*:: import {cache, persistChoices, readCache, restoreChoices} from "./persistence.js" */
/*:: import {getLangByCode, localizeInterface} from "./localization.js" */
/*:: import {getPairs} from "./translator.js" */
/*:: import {analyzers} from "./analyzer.js" */
