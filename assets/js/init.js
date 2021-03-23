// @flow

/* exported _paq */

/* global config, persistChoices, iso639Codes, iso639CodesInverse, populateTranslationList, showTranslateWebpageInterface */
/* global ajaxSend, ajaxComplete, debounce, resizeFooter, synchronizeTextareaHeights */

var BACK_TO_TOP_BUTTON_ACTIVATION_HEIGHT = 300;

$(document).ajaxSend(ajaxSend);
$(document).ajaxComplete(ajaxComplete);
$(document).ajaxError(ajaxComplete);

$.jsonp.setup({
    callbackParameter: 'callback'
});

$(document).ready(function () {
    if(config.SUBTITLE) {
        var subtitle = config.SUBTITLE,
            subtitleColor = config.SUBTITLE_COLOR;
        $('.apertiumSubLogo')
            .text(subtitle)
            .show();
        if(subtitleColor) {
            $('.apertiumSubLogo').css('color', subtitleColor);
        }
    }
    else {
        $('.apertiumSubLogo').hide();
    }

    if(config.SHOW_NAVBAR) {
        if(config.ENABLED_MODES) {
            $.each(config.ENABLED_MODES, function () {
                $('.nav a[data-mode=' + this + ']').show();
            });
        }
        else {
            $('.nav a').show();
        }
    }
    else {
        $('.navbarDefault .navbar-toggler').hide();
        $('.navbarDefault .nav').hide();
    }

    var hash /*: string */ = parent.location.hash;

    try {
        if(hash === '#webpageTranslation') {
            hash = '#translation';
            showTranslateWebpageInterface();
        }
        else if(!hash || !$('.modeContainer' + hash).length) {
            hash = '#' + config.DEFAULT_MODE;
            parent.location.hash = hash;
        }
    }
    catch(e) {
        console.error('Invalid hash: ' + e);
        hash = '#' + config.DEFAULT_MODE;
        parent.location.hash = hash;
    }

    $('.modeContainer' + hash).addClass('active show');
    // FlowCheck doesn't recognise Bootstrap's `tab` function
    // $FlowFixMe
    $('.navbarDefault .nav li > a[data-mode=' + hash.substring(1) + ']').tab('show');

    resizeFooter();

    $(window)
        .on('hashchange', function () {
            var mode /*: string */ = parent.location.hash.substring(1);
            persistChoices(mode);
        })
        .resize(debounce(function () {
            populateTranslationList();
            resizeFooter();
        }));

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

    $('a[data-mode][data-toggle="tab"]').on('shown.bs.tab', function (ev) {
        synchronizeTextareaHeights();
        var target/*: HTMLLinkElement */ = (ev.target /*: any */);
        parent.location.hash = '#' + target.dataset.mode;
    });

    $('form').submit(function () {
        return false;
    });

    $('.modal').on('show.bs.modal', function () {
        $('a[data-target="#' + $(this).attr('id') + '"]').parents('li').addClass('active');
        $.each($(this).find('img[data-src]'), function () {
            $(this).attr('src', $(this).attr('data-src'));
        });
    });

    $('.modal').on('hide.bs.modal', function () {
        $('a[data-target="#' + $(this).attr('id') + '"]').parents('li').removeClass('active');
    });

    $(window).scroll(function () {
        $('#backToTop').toggleClass('hide', $(window).scrollTop() < BACK_TO_TOP_BUTTON_ACTIVATION_HEIGHT);
    });

    $('#backToTop').click(function () {
        $('html, body').animate({
            scrollTop: 0
        }, 'fast');
        return false;
    });
});

if(config.PIWIK_SITEID && config.PIWIK_URL) {
    var url = config.PIWIK_URL;
    if(document.location.protocol === 'https:') {
        url = url.replace(/^(http(s)?)?:/, 'https:');
    }
    // but if we're on plain http, we keep whatever was in the config
    if(url.charAt(url.length - 1) !== '/') {
        url += '/';
    }

    /* eslint-disable */
    var _paq = _paq || [];
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
        var u=url;
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

/*:: export {_paq} */

/*:: import {persistChoices} from "./persistence.js" */
/*:: import {iso639Codes, iso639CodesInverse} from "./localization.js" */
/*:: import {populateTranslationList, showTranslateWebpageInterface} from "./translator.js" */
/*:: import {ajaxSend, ajaxComplete, debounce, resizeFooter, synchronizeTextareaHeights} from "./util.js" */
