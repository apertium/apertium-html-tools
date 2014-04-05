var APY_URL = '//localhost:2737';
var ALLOWED_LANGS = undefined; //Set to undefined for all languages

function ajaxSend() {
    $('#loading-indicator').show();
}

function ajaxComplete() {
    $('#loading-indicator').hide();
}

$(document).ajaxSend(ajaxSend);
$(document).ajaxComplete(ajaxComplete);
$(document).ajaxError(ajaxComplete);

$.jsonp.setup({
    callbackParameter: 'callback'
});

$(document).ready(function () {
    $('#noscript').hide();
    $('.navbar').css('margin-top', '0px');
    $('body > .container').css('margin-top', '0px');

    var hash = parent.location.hash;

    if(!hash || !$(hash + 'Container')) {
        hash = '#translation';
		parent.location.hash = hash;
	}
	
    $('.modeContainer' + hash + 'Container').show();
    $('.nav li > a[data-mode=' + hash.substring(1) + ']').parent().addClass('active');

    $('.nav a').click(function () {
        var mode = $(this).data('mode');
        $('.nav li').removeClass('active');
        $(this).parent('li').addClass('active');
        $('.modeContainer:not(#' + mode + 'Container)').hide({
            queue: false
        });
        $('#' + mode + 'Container').show({
            queue: false
        });
    });

    if(ALLOWED_LANGS)
        $.each(ALLOWED_LANGS.slice(0), function () {
            if(iso639Codes[this])
                ALLOWED_LANGS.push(iso639Codes[this]);
            if(iso639CodesInverse[this])
                ALLOWED_LANGS.push(iso639CodesInverse[this]);
        });

    $('form').submit(function () {
        return false;
    });

    $('.modal').on('show.bs.modal', function () {
        $.each($(this).find('img[data-src]'), function () {
            $(this).attr('src', $(this).attr('data-src'));
        });
    });

    var parameters = getParameters();
    if((!('sandbox' in parameters) || parameters['sandbox'].replace('/', '') === '0') && !(hash && hash.substring(1) === 'sandbox'))
        $('.nav a[data-mode=sandbox]').hide();

    function getParameters() {
        var searchString = window.location.search.substring(1),
            params = searchString.split('&'),
            hash = {};

        if(searchString === '')
            return {};

        for(var i = 0; i < params.length; i++) {
            var val = params[i].split('=');
            hash[unescape(val[0])] = unescape(val[1]);
        }
        return hash;
    }
});

function filterLangList(langs, filterFn) {
    if(!ALLOWED_LANGS)
        return langs;
    else {
        if(!filterFn)
            filterFn = function (code) {
              return ALLOWED_LANGS.indexOf(code) !== -1 || ((code.indexOf('-') !== -1 && (ALLOWED_LANGS.indexOf(code.split('-')[0]) + ALLOWED_LANGS.indexOf(code.split('-')[1])) !== -2));  
            };

        return langs.filter(filterFn);
    }
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function isSubset(subset, superset) {
    return subset.every(function (val) {
        return superset.indexOf(val) >= 0;
    });
}
