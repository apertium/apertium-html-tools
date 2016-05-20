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

    if(config.SHOW_NAVBAR) {
        if(config.ENABLED_MODES === null)
            $('.nav a').removeClass('hide');
        else
            $.each(config.ENABLED_MODES, function () {
                $('.nav a[data-mode=' + this + ']').removeClass('hide');
            });
    }
    else {
        $('.navbar-default .navbar-toggle').hide();
        $('.navbar-default .nav').hide();
    }

    var hash = parent.location.hash;

    if(!hash || !$(hash + 'Container')) {
        hash = '#' + config.DEFAULT_MODE;
        parent.location.hash = hash;
    }

    $('.modeContainer' + hash + 'Container').show();
    $('.navbar-default .nav li > a[data-mode=' + hash.substring(1) + ']').parent().addClass('active');

    $('.navbar-default .nav a').click(function () {
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

    $(window).on('hashchange', persistChoices);

    if(config.ALLOWED_LANGS)
        $.each(config.ALLOWED_LANGS.slice(0), function () {
            if(iso639Codes[this])
                config.ALLOWED_LANGS.push(iso639Codes[this]);
            if(iso639CodesInverse[this])
                config.ALLOWED_LANGS.push(iso639CodesInverse[this]);
        });

    $('form').submit(function () {
        return false;
    });

    $('.modal').on('show.bs.modal', function () {
        $('a[data-target=#' + $(this).attr('id') + ']').parents('li').addClass('active');
        $.each($(this).find('img[data-src]'), function () {
            $(this).attr('src', $(this).attr('data-src'));
        });
    });

    $('.modal').on('hide.bs.modal', function () {
        $('a[data-target=#' + $(this).attr('id') + ']').parents('li').removeClass('active');
    });
});

if(config.PIWIK_SITEID && config.PIWIK_URL) {
    config.PIWIK_URL = config.PIWIK_URL.replace(/http(s)?/, '');
    if(config.PIWIK_URL.charAt(config.PIWIK_URL.length - 1) !== '/')
        config.PIWIK_URL += '/';

    var _paq = _paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
        var u=(("https:" == document.location.protocol) ? "https" : "http") + config.PIWIK_URL;
        _paq.push(['setTrackerUrl', u+'piwik.php']);
        _paq.push(['setSiteId', config.PIWIK_SITEID]);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript';
        g.defer=true; g.async=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
    })();
}

function sendEvent(category, action, label, value) {
    if(config.PIWIK_SITEID && config.PIWIK_URL && _paq) {
        var args = [category, action];
        if(label !== undefined && value !== undefined)
            args = args.concat([label, value]);
        else if(label !== undefined)
            args.push(label);

        _paq.push(['trackEvent'].concat(args));
    }
}

function modeEnabled(mode) {
    return config.ENABLED_MODES === null || config.ENABLED_MODES.indexOf(mode) !== -1;
}

function filterLangList(langs, filterFn) {
    if(config.ALLOWED_LANGS === null && config.ALLOWED_VARIANTS === null)
        return langs;
    else {
        if(!filterFn)
            filterFn = function (code) {
                return  allowedLang(code) || ((code.indexOf('-') !== -1 && (allowedLang(code.split('-')[0]) || allowedLang(code.split('-')[1]))));
            };

        return langs.filter(filterFn);
    }
}

function allowedLang(code) {
    if(code.indexOf('_') === -1)
        return config.ALLOWED_LANGS === null || config.ALLOWED_LANGS.indexOf(code) !== -1;
    else
        return allowedLang(code.split('_')[0]) && (config.ALLOWED_VARIANTS === null || config.ALLOWED_VARIANTS.indexOf(code.split('_')[1]) !== -1);
}

function getURLParam(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    return results === null ? "" : results[1];
 }

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function isSubset(subset, superset) {
    return subset.every(function (val) {
        return superset.indexOf(val) >= 0;
    });
}
