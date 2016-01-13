var generators = {}, generatorData = {};
var currentGeneratorRequest;

if(modeEnabled('generation')) {
    $(document).ready(function () {
        $('#generate').click(function () {
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

        $('#morphGeneratorInput').keydown(function (e) {
            if(e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                generate();
            }
        });

        $('#morphGeneratorInput').on('input propertychange', function () {
            persistChoices('generator');
        });

        $('#morphGeneratorInput').blur(function() {
            persistChoices('generator', true);
        });
    });
}

function getGenerators() {
    var deferred = $.Deferred();

    if(config.GENERATORS) {
        generatorData = config.GENERATORS;
        populateGeneratorList(generators);
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
            console.error('Generators cache ' + (analyzers === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=generators',
                beforeSend: ajaxSend,
                success: function (data) {
                    generatorData = data;
                    populateGeneratorList(generatorData);
                    cache('generators', data);
                },
                error: function (xOptions, error) {
                    console.error('Failed to get available generators');
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

function populateGeneratorList(data) {
    $('.generatorMode').empty();

    generators = {};
    for(var lang in data) {
        var generatorLang = lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang;
        var group = generators[generatorLang];
        if(group)
            group.push(lang);
        else
            generators[generatorLang] = [lang];
    }

    var generatorArray = [];
    $.each(generators, function (key, value) {
        generatorArray.push([key, value]);
    });
    generatorArray = filterLangList(generatorArray, function (generator) {
        return allowedLang(generator[0]);
    });
    generatorArray.sort(function (a, b) {
        return getLangByCode(a[0]).localeCompare(getLangByCode(b[0]));
    });

    for(var i = 0; i < generatorArray.length; i++) {
        var lang = generatorArray[i][0];
        $('#primaryGeneratorMode').append($('<option></option>').val(lang).text(getLangByCode(lang)));
    }

    restoreChoices('generator');
}

function populateSecondaryGeneratorList() {
    var group = generators[$('#primaryGeneratorMode').val()];
    $('#secondaryGeneratorMode').empty();

    if(group) {
        if(group.length <= 1)
            $('#secondaryGeneratorMode').fadeOut('fast');
        else
            $('#secondaryGeneratorMode').fadeIn('fast');

        group.sort(function (a, b) {
            return a.length - b.length;
        });

        for(var i = 0; i < group.length; i++) {
            var lang = group[i];
            var langDisplay = lang.indexOf('-') !== -1 ? getLangByCode(lang.split('-')[0]) + '-' + getLangByCode(lang.split('-')[1]) : getLangByCode(lang);
            $('#secondaryGeneratorMode').append($('<option></option').val(lang).text(langDisplay));
        }
    }
    else
        $('#secondaryGeneratorMode').fadeOut('fast');
}

function generate() {
    var generatorMode = generators[$('#primaryGeneratorMode').val()].length > 1 ? $('#secondaryGeneratorMode').val() : generators[$('#primaryGeneratorMode').val()][0];
    sendEvent('generator', 'generate', generatorMode, $('#morphGeneratorInput').val().length);

    $('#morphGenOutput').addClass('blurred');

    if(currentGeneratorRequest) {
        currentGeneratorRequest.abort();
    }
    currentGeneratorRequest = $.jsonp({
        url: config.APY_URL + '/generate',
        beforeSend: ajaxSend,
        complete: function() {
            ajaxComplete();
            currentGeneratorRequest = undefined;
        },
        data: {
            'lang': generatorMode,
            'q': $('#morphGeneratorInput').val()
        },
        success: function (data) {
            $('#morphGenOutput').empty();
            for(var i = 0; i < data.length; i++) {
                var div = $('<div data-toggle="tooltip" data-placement="auto" data-html="true"></div>');
                var strong = $('<strong></strong>').text(data[i][1].trim());
                var span = $('<span></span>').html('&nbsp;&nbsp;&#8620;&nbsp;&nbsp;' + data[i][0]);
                div.append(strong).append(span);
                $('#morphGenOutput').append(div);
            }
            $('#morphGenOutput').removeClass('blurred');
        },
        error: function (xOptions, error) {
            $('#morphGenOutput').text(error);
            $('#morphGenOutput').removeClass('blurred');
        }
    });
}
