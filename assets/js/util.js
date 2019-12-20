// @flow

/* exported ajaxComplete, ajaxSend, allowedLang, apyRequestTimeout, callApy, debounce, filterLangList, filterLangPairList, getURLParam,
    isSubset, isURL, modeEnabled, onlyUnique, resizeFooter, sendEvent, synchronizeTextareaHeights, removeSoftHyphens, parentLang,
    isVariant */
/* exported ENTER_KEY_CODE, HTTP_BAD_REQUEST_CODE, HTTP_OK_CODE, SPACE_KEY_CODE, XHR_DONE, XHR_LOADING */

/* global _paq, config */

var SPACE_KEY_CODE = 32, ENTER_KEY_CODE = 13,
    HTTP_OK_CODE = 200, HTTP_BAD_REQUEST_CODE = 400,
    XHR_LOADING = 3, XHR_DONE = 4;

var TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH = 768,
    APY_REQUEST_URL_THRESHOLD_LENGTH = 2000, // maintain 48 characters buffer for generated parameters
    DEFAULT_DEBOUNCE_DELAY = 100;

var INSTALLATION_NOTIFICATION_REQUESTS_BUFFER_LENGTH = 5,
    INSTALLATION_NOTIFICATION_INDIVIDUAL_DURATION_THRESHOLD = 4000,
    INSTALLATION_NOTIFICATION_CUMULATIVE_DURATION_THRESHOLD = 3000,
    INSTALLATION_NOTIFICATION_DURATION = 10000;

var apyRequestTimeout /*: TimeoutID */, apyRequestStartTime/*: ?number */;
var installationNotificationShown = false, lastNAPyRequestDurations = [];

// These polyfills are placed here since all versions of IE require them and IE10+
// does not support conditional comments. They could be moved to a separate file.

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
/* eslint-disable */
if (typeof Object.assign != 'function') {
  // $FlowFixMe
  Object.assign = function(target /*: ?{} */, varArgs /*: {}[] */) { // .length of function is 2
    'use strict';
    if (!target) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource /*: ?{} */ = arguments[index];

      if (nextSource) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
if (!String.prototype.startsWith) {
    // $FlowFixMe
	String.prototype.startsWith = function(search /*: string */, pos /*: ?number */) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith#Polyfill
if (!String.prototype.endsWith) {
    // $FlowFixMe
	String.prototype.endsWith = function(search /*: string */, this_len /*: number|undefined */) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
        return this.substring(this_len - search.length, this_len) === search;
	};
}
/* eslint-enable */

function debounce(func /*: any */, delay /*: ?number */) { // eslint-disable-line no-unused-vars
    var clock = null;
    return function () {
        var context = this, args = arguments;
        if(clock) {
            clearTimeout(clock);
        }
        clock = setTimeout(function () {
            func.apply(context, args);
        }, delay || DEFAULT_DEBOUNCE_DELAY);
    };
}

function ajaxSend() {
    $('#loadingIndicator').show();
}

function ajaxComplete() {
    $('#loadingIndicator').hide();
    clearTimeout(apyRequestTimeout);
    if(apyRequestStartTime) {
        handleAPyRequestCompletion(Date.now() - apyRequestStartTime);
        apyRequestStartTime = null;
    }
}

/* eslint-disable id-blacklist */
function sendEvent/*:: <T> */(category /*: string */, action /*: string */, label /*: ?string */, value /*: T */) {
    if(config.PIWIK_SITEID && config.PIWIK_URL && _paq) {
        var args = [category, action];
        if(label && value) {
            args = args.concat([label, value]);
        }
        else if(label) {
            args.push(label);
        }

        _paq.push(['trackEvent'].concat(args));
    }
}
/* eslint-enable id-blacklist */

function modeEnabled(mode /*: string */) {
    return !config.ENABLED_MODES || config.ENABLED_MODES.indexOf(mode) !== -1;
}

function removeSoftHyphens(text /*: string */) {
    return text.replace(/\u00AD/g, '');
}

function resizeFooter() {
    var footerHeight = $('#footer').height();
    $('#push').css('height', footerHeight);
    $('#wrap').css('margin-bottom', -footerHeight);
}

function parentLang(code /*: string */) {
    return code.split('_')[0];
}

function isVariant(code /*: string */) {
    return code.indexOf('_') !== -1;
}

function allowedLang(code /*: string */) {
    if(isVariant(code)) {
        return allowedLang(parentLang(code)) &&
            (!config.ALLOWED_VARIANTS || config.ALLOWED_VARIANTS.indexOf(code.split('_')[1]) !== -1);
    }
    else {
        return !config.ALLOWED_LANGS || config.ALLOWED_LANGS.indexOf(code) !== -1;
    }
}

function filterLangList(langs /*: string[] */, _filterFn /*: ?(lang: string) => boolean */) {
    if(config.ALLOWED_LANGS || config.ALLOWED_VARIANTS) {
        var filterFn = _filterFn;
        if(!filterFn) {
            filterFn = function (code /*: string */) {
                return allowedLang(code) ||
                    ((code.indexOf('-') !== -1 && (allowedLang(code.split('-')[0]) || allowedLang(code.split('-')[1]))));
            };
        }

        return (langs.filter(filterFn) /*: string[] */);
    }
    else {
        return langs;
    }
}

function filterLangPairList(langPairs /*: [string, string][] */, filterFn /*: [string, string] => boolean */) {
    if(config.ALLOWED_LANGS || config.ALLOWED_VARIANTS) {
        return langPairs.filter(filterFn);
    }
    else {
        return langPairs;
    }
}

function getURLParam(name /*: string */) {
    var escapedName = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + escapedName + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results /*: ?string[] */ = regex.exec(window.location.href);
    return results ? results[1] : '';
}

/* eslint-disable */
// From: http://stackoverflow.com/a/19696443/1266600 (source: AOSP)
function isURL(text /*: string */) {
    var re = /^((?:(http|https):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\s*$)/i;
    return text.search(re) === 0;
}
/* eslint-enable */

// eslint-disable-next-line id-blacklist
function onlyUnique/*:: <T> */(value /*: T */, index /*: number */, self /*: T[] */) {
    return self.indexOf(value) === index;
}

function isSubset/*:: <T> */(subset /*: T[] */, superset /*: T[] */) {
    // eslint-disable-next-line id-blacklist, id-length
    return subset.every(function (val /*: T */) {
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

function callApy(options /*: {} */, endpoint /*: string */, useAjax /*: ?boolean */) {
    var requestOptions /*: any */ = Object.assign({
        url: config.APY_URL + endpoint,
        beforeSend: ajaxSend,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
    }, options);

    var requestUrl /*: string */ = window.location.protocol + window.location.hostname +
        window.location.pathname + '?' + $.param(requestOptions.data);

    requestOptions.type = requestUrl.length > APY_REQUEST_URL_THRESHOLD_LENGTH ? 'POST' : 'GET';

    apyRequestStartTime = Date.now();
    apyRequestTimeout = setTimeout(function () {
        displayInstallationNotification();
        clearTimeout(apyRequestTimeout);
    }, INSTALLATION_NOTIFICATION_INDIVIDUAL_DURATION_THRESHOLD);

    if(useAjax || requestUrl.length > APY_REQUEST_URL_THRESHOLD_LENGTH) {
        return $.ajax(requestOptions);
    }

    return $.jsonp(requestOptions);
}

function handleAPyRequestCompletion(requestDuration) {
    var cumulativeAPyRequestDuration = 0;

    if(lastNAPyRequestDurations.length === INSTALLATION_NOTIFICATION_REQUESTS_BUFFER_LENGTH) {
        cumulativeAPyRequestDuration = lastNAPyRequestDurations.reduce(
            function (totalDuration, duration) {
                return totalDuration + duration;
            });

        lastNAPyRequestDurations.shift();
        lastNAPyRequestDurations.push(requestDuration);
    }
    else {
        lastNAPyRequestDurations.push(requestDuration);
    }

    var averageRequestDuration = cumulativeAPyRequestDuration / lastNAPyRequestDurations.length;

    if(requestDuration > INSTALLATION_NOTIFICATION_INDIVIDUAL_DURATION_THRESHOLD ||
        averageRequestDuration > INSTALLATION_NOTIFICATION_CUMULATIVE_DURATION_THRESHOLD) {
        displayInstallationNotification();
    }
}

function displayInstallationNotification() {
    if(installationNotificationShown) {
        return;
    }
    installationNotificationShown = true;

    $('#installationNotice').fadeIn('slow').show()
        .delay(INSTALLATION_NOTIFICATION_DURATION)
        .fadeOut('slow', hideInstallationNotification);

    $('#installationNotice').mouseover(function () {
        $(this).stop(true);
    }).mouseout(function () {
        $(this).delay(INSTALLATION_NOTIFICATION_DURATION)
            .fadeOut('slow', hideInstallationNotification);
    });

    function hideInstallationNotification() {
        $('#installationNotice').hide();
    }
}

/*:: export {ajaxComplete, ajaxSend, allowedLang, apyRequestTimeout, callApy, debounce, filterLangList, filterLangPairList, getURLParam,
    isSubset, isURL, modeEnabled, onlyUnique, resizeFooter, sendEvent, synchronizeTextareaHeights, removeSoftHyphens, parentLang,
    isVariant} */
/*:: export {ENTER_KEY_CODE, HTTP_BAD_REQUEST_CODE, HTTP_OK_CODE, SPACE_KEY_CODE, XHR_DONE, XHR_LOADING} */

/*:: import {_paq} from "./init.js" */
