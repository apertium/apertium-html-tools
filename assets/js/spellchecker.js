var spellers = {}, spellerData = {};
var currentSpellCheckerRequest;

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
                    console.log(data);
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
    $(document).ready(function() {
        restoreChoices('spellchecker');

        $('#check').click(function() {
            clearTimeout(timer);
            check();
        });

        var timer, timeout = 2000;
        $('#spellcheckerInput').on('input propertychange', function(e) {
            if(timer && $('#instantChecking').prop('checked'))
                clearTimeout(timer);

            timer = setTimeout(function() {
                if($('#instantChecking').prop('checked')) {
                    check();
                }
            }, timeout);
        });

        $('#primarySpellcheckerMode').change(function() {
            populateSecondarySpellcheckerList();
            localizeInterface();
            persistChoices('spellchecker');
        });

        $('#secondarySpellcheckerMode').change(function() {
            persistChoices('spellchecker');
        });

        $('#instantChecking').change(function() {
            persistChoices('spellchecker');
        });

        $('#spellcheckerInput').on('input propertychange', function() {
            $('#spellcheckerInput').removeClass('spellcheckVisible');
            $('.spellError').each(function() {
                $(this).popover('hide');
            });
            persistChoices('spellchecker');
        });

        $('#spellcheckerInput').submit(function() {
            clearTimeout(timer);
            check();
        });

        $(document).on('mouseover', '.spellcheckVisible .spellError', function() {
            $('.spellError').each(function() {
                $(this).popover('hide');
            });
            $(this).popover('show');
        });

        $(document).on('mouseleave', '.spellError', function() {
            var e = $(this);
            var t = setTimeout(function() {
                e.popover('hide');
            }, 400);
            $(this).on('mouseover', function() {
                clearTimeout(t);
            });
            $(document).on('mouseover', '.popover', function() {
                clearTimeout(t);
            });
            $(document).on('mouseleave', '.popover', function() {
                e.popover('hide');
            });
        });

        $(document).on('click', '.list-group-item', function() {
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
        if(group.length <= 1)
            $('#secondarySpellcheckerMode').fadeOut('fast');
        else
            $('#secondarySpellcheckerMode').fadeIn('fast');

        group.sort(function (a, b) {
            var lang = group[i];
            var langDisplay = lang.indexOf('-') !== -1 ? getLangByCode(lang.split('-')[0]) + '-' + getLangByCode(lang.split('-')[1]) : getLangByCode(lang);
            $('#secondarySpellcheckerMode').append($('<option></option>').val(lang).text(langDisplay));
        });
    }
    else
        $('#secondarySpellcheckerMode').fadeOut('fast');
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

//var dummy_words = ['hello', 'my', 'name', 'is', 'and', 'I', 'like', 'nothing', 'but', 'bacon'];

function check() {
    $('#spellcheckerInput').addClass('spellcheckVisible');
    // TODO send words to APY
    //words = words.split(' ');

    //for(var d in dummy_words)
    //    dummy_words[d] = dummy_words[d].toLowerCase();

    //$('#spellcheckerInput').html('');
    /*for(var w in words) {
        words[w] = words[w].replace(/\n/g, '<br>');
        if(dummy_words.indexOf(words[w].toLowerCase()) == -1)
            $('#spellcheckerInput').html($('#spellcheckerInput').html() + '<span class="spellError">' + words[w] + '</span>');
        else
            $('#spellcheckerInput').html($('#spellcheckerInput').html() + words[w]);

        if(w != words.length - 1)
            $('#spellcheckerInput').html($('#spellcheckerInput').html() + ' ');
    }*/

    /*var content = '<div class="list-group">';
    for(var w in dummy_words)
        content += '<a href="#" class="list-group-item">' + dummy_words[w] + '</a>';
    content += '</div>';
    $('.spellError').each(function() {
    $(this).popover({animation: false, placement: 'bottom', trigger: 'manual', html: true, content: content});
    });*/
    

    $('#spellcheckerInput').html($('#spellcheckerInput').html().replace(/\<br\>/g, '\n').replace(/&nbsp;/g, ' '));
    var words = $.trim($('#spellcheckerInput').text());
    var splitWords = words.split(' ');
    var content = {};
    $('#spellcheckerInput').html('');
    console.log(words);
    currentSpellCheckerRequest = callApy({
        data: {
            'q': words,
            'lang': 'hin'
        },
        success: function(data) {
                var p = 0;
                for(var j = 0; j < data.length; j++) {
                
                    if(data[j]['known'] === true) {
                        $('#spellcheckerInput').html($('#spellcheckerInput').html() + ' ' + splitWords[p]);
                        p++;
                        continue;
                    }
                    $('#spellcheckerInput').html($('#spellcheckerInput').html() + ' <span class="spellError" id=' + splitWords[p] + '>' + splitWords[p] + '</span>');
                    content[splitWords[p]] = '<div class="list-group">';
                    for(var i=0; i<data[j]['sugg'].length; i++) {
                        content[splitWords[p]] += '<a href="#" class="list-group-item">' + data[j]['sugg'][i][0] + '</a>';
                        content[splitWords[p]] += '</div>';
                    }
                    $('.spellError').each(function() {
                        var curId = this.id;
                        console.log(curId);
                        $(this).popover({animation: false, placement: 'bottom', trigger: 'manual', html: true, content: content[curId]});
                    });
                    p++;
                }
            
            /*$('#spellcheckerInput').html('<span class="spellError">' + 'माय' + '</span>');
            content = '<div class="list-group">';
            for(var i=0; i<data[0]['sugg'].length; i++) {
                content += '<a href="#" class="list-group-item">' + data[0]['sugg'][i][0] + '</a>';
                content += '</div>';
            }
            $('.spellError').each(function() {
                $(this).popover({animation: false, placement: 'bottom', trigger: 'manual', html: true, content: content});
            });*/
        },
        error: function(jqXHR) {
            spellCheckerNotAvailable(jqXHR.responseJSON);
        },
        complete: function() {
            ajaxComplete();
            currentSpellCheckerRequest = undefined;
        }
    }, '/speller');
}

function spellCheckerNotAvailable(data) {
    $('#spellcheckerInput').append($('<div></div>').text(' '));
    $('#spellcheckerInput').append($('<div></div>').text(data.message));
    $('#spellcheckerInput').append($('<div></div>').text(data.explanation));
}
