var APY_URL = '//localhost:2737';

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
    var hash = parent.location.hash;

    if(!hash || !$(hash + 'Container'))
        parent.location.hash = '#translation';
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

    $('form').submit(function () {
        return false;
    });

    var parameters = getParameters();
    if((!('sandbox' in parameters) || parameters['sandbox'].replace('/', '') === '0') && !(hash && hash.substring(1) == 'sandbox'))
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

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function isSubset(subset, superset) {
    return subset.every(function (val) {
        return superset.indexOf(val) >= 0;
    });
}
