/* @flow */
/* exported sendEvent, modeEnabled, filterLangList, getURLParam, onlyUnique, isSubset, safeRetrieve */
/* exported SPACE_KEY_CODE, ENTER_KEY_CODE, HTTP_OK_CODE, HTTP_BAD_REQUEST_CODE, XHR_LOADING, XHR_DONE */
/* global config, persistChoices, iso639Codes, iso639CodesInverse */

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

    if(config.SUBTITLE) {
        $('.apertiumSubLogo')
            .text(config.SUBTITLE)
            .show();
        if(config.SUBTITLE_COLOR) {
            $('.apertiumSubLogo').css('color', config.SUBTITLE_COLOR);
        }
    }
    else {
        $('.apertiumSubLogo').hide();
    }

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
        if(!hash || !$(hash + 'Container')) {
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

    resizeFooter();
    $(window)
        .on('hashchange', persistChoices)
        .resize(resizeFooter);

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

function modeEnabled(mode/*: string*/) {
    return config.ENABLED_MODES === null || config.ENABLED_MODES.indexOf(mode) !== -1;
}

function resizeFooter() {
    var footerHeight = $('#footer').height();
    $('#push').css('height', footerHeight);
    $('#wrap').css('margin-bottom', -footerHeight);
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

function filterLangList(langs/*: Array<string>*/, filterFn/*: (lang: string) => bool*/) {
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
function getURLParam(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    return results === null ? "" : results[1];
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
}

/*:: export {synchronizeTextareaHeights, modeEnabled, ajaxSend, ajaxComplete, filterLangList, onlyUnique,
    SPACE_KEY_CODE, ENTER_KEY_CODE, HTTP_OK_CODE, HTTP_BAD_REQUEST_CODE, XHR_LOADING, XHR_DONE} */

/*:: import {config} from "./config.js" */
/*:: import {persistChoices} from "./persistence.js" */
/*:: import {iso639Codes, iso639CodesInverse} from "./localization.js" */
