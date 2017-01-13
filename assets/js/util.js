/* @flow */
/* exported sendEvent, modeEnabled, filterLangList, getURLParam, onlyUnique, isSubset, safeRetrieve */
/* exported SPACE_KEY_CODE, ENTER_KEY_CODE, HTTP_OK_CODE, HTTP_BAD_REQUEST_CODE, XHR_LOADING, XHR_DONE */

var SPACE_KEY_CODE = 32, ENTER_KEY_CODE = 13,
    HTTP_OK_CODE = 200, HTTP_BAD_REQUEST_CODE = 400,
    XHR_LOADING = 3, XHR_DONE = 4;

var TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH = 768;

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
        if(config.ENABLED_MODES === null) {
            $('.nav a').removeClass('hide');
        }
        else {
            $.each(config.ENABLED_MODES, function () {
                $('.nav a[data-mode=' + this + ']').removeClass('hide');
            });
        }
    }
    else {
        $('.navbar-default .navbar-toggle').hide();
        $('.navbar-default .nav').hide();
    }

    var hash = parent.location.hash;

    try {
        if(hash === '#webpageTranslation') {
            hash = '#translation';
            showTranslateWebpageInterface();
        }
        else if(!hash || !$(hash + 'Container').length) {
            hash = '#' + config.DEFAULT_MODE;
            parent.location.hash = hash;
        }
    }
    catch(e) {
        console.error('Invalid hash: ' + e);
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
        synchronizeTextareaHeights();
    });

    $(window).on('hashchange', persistChoices);

    if(config.ALLOWED_LANGS) {
        var withIso = [];
        $.each(config.ALLOWED_LANGS, function () {
            if(iso639Codes[this]) {
                withIso.push(iso639Codes[this]);
            }
            if(iso639CodesInverse[this]) {
                withIso.push(iso639CodesInverse[this]);
            }
        });
        Array.prototype.push.apply(config.ALLOWED_LANGS, withIso);
    }

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
    var url = config.PIWIK_URL;
    url = url.replace(/http(s)?/, '');
    if(url.charAt(url.length - 1) !== '/') {
        url += '/';
    }
    config.PIWIK_URL = url;

    /* eslint-disable */
    var _paq = _paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
        var u=(("https:" == document.location.protocol) ? "https" : "http") + url;
        _paq = _paq || [];
        _paq.push(['setTrackerUrl', u+'piwik.php']);
        _paq.push(['setSiteId', config.PIWIK_SITEID]);
        var d=document,
            g=d.createElement('script'),
            s=d.getElementsByTagName('script')[0];
        g.type='text/javascript';
        g.defer=true;
        g.async=true;
        g.src=u+'piwik.js';
        if(s.parentNode) {
            s.parentNode.insertBefore(g,s);
        }
    })();
    /* eslint-enable */
}

/* eslint-disable id-blacklist */
function sendEvent(category, action, label, value) {
    if(config.PIWIK_SITEID && config.PIWIK_URL && _paq) {
        var args = [category, action];
        if(label !== undefined && value !== undefined) {
            args = args.concat([label, value]);
        }
        else if(label !== undefined) {
            args.push(label);
        }

        _paq.push(['trackEvent'].concat(args));
    }
}
/* eslint-enable id-blacklist */

function modeEnabled(mode/*:string*/) {
    return config.ENABLED_MODES === null || config.ENABLED_MODES.indexOf(mode) !== -1;
}

function allowedLang(code) {
    if(code.indexOf('_') === -1) {
        return config.ALLOWED_LANGS === null || config.ALLOWED_LANGS.indexOf(code) !== -1;
    }
    else {
        return allowedLang(code.split('_')[0]) &&
            (config.ALLOWED_VARIANTS === null || config.ALLOWED_VARIANTS.indexOf(code.split('_')[1]) !== -1);
    }
}

function filterLangList(langs/*:Array<string>*/, filterFn/*:(lang: string) => bool*/) {
    if(config.ALLOWED_LANGS === null && config.ALLOWED_VARIANTS === null) {
        return langs;
    }
    else {
        if(!filterFn) {
            filterFn = function (code) {
                return allowedLang(code) ||
                    ((code.indexOf('-') !== -1 && (allowedLang(code.split('-')[0]) || allowedLang(code.split('-')[1]))));
            };
        }

        return langs.filter(filterFn);
    }
}

/* eslint-disable */
// From: http://stackoverflow.com/a/4548504/1266600
function getURLParam(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    return results === null ? "" : results[1];
}

// From: http://stackoverflow.com/a/19696443/1266600 (source: AOSP)
function isURL(text) {
  var re = /^((?:(http|https):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\s*$)/i;
  return text.search(re) === 0;
}
/* eslint-enable */

// eslint-disable-next-line id-blacklist
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function isSubset(subset, superset) {
    // eslint-disable-next-line id-blacklist, id-length
    return subset.every(function (val) {
        return superset.indexOf(val) >= 0;
    });
}

var safeRetrieve = function/*::<T>*/(key/*:string*/, fallback/*:T*/)/*:T*/ {
    if(!window.localStorage) {
        return fallback;
    }
    var fromStorage = window.localStorage.getItem(key);
    if(fromStorage == null) {
        return fallback;
    }
    else {
        try {
            var parsed = JSON.parse(fromStorage);
            if(parsed != null) {
                return parsed;
            }
        }
        catch(e) {
            console.log(e);
        }
        return fallback;
    }
};

function synchronizeTextareaHeights() {
    if($(window).width() < TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH) {
        return;
    }

    $('#originalText').css({
        'overflow-y': 'hidden',
        'height': 'auto'
    });
    var originalTextScrollHeight = $('#originalText')[0].scrollHeight;
    $('#originalText').css('height', originalTextScrollHeight + 'px');
    $('#translatedText').css('height', originalTextScrollHeight + 'px');

    if($('div#translateWebpage').is(':visible')) {
        var bottomOfButtons = Math.max(45, $('div#translateWebpage')[0].offsetTop);
        $('iframe.translatedWebpage').css('top', bottomOfButtons + 'px');
        $('#translateWebpage > div').css('top', bottomOfButtons + 'px');
        $('iframe.translatedWebpage').css('bottom', bottomOfButtons + 'px');
        $('#translateWebpage > div').css('bottom', bottomOfButtons + 'px');
    }
}

/*:: export {synchronizeTextareaHeights, modeEnabled, ajaxSend, ajaxComplete, filterLangList, onlyUnique, SPACE_KEY_CODE, ENTER_KEY_CODE, HTTP_OK_CODE, HTTP_BAD_REQUEST_CODE, XHR_LOADING, XHR_DONE} */

/*:: import {config} from "./config.js" */
/*:: import {persistChoices} from "./persistence.js" */
/*:: import {iso639Codes, iso639CodesInverse} from "./localization.js" */
