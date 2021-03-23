/* exported persistChoices, restoreChoices, cache, readCache */

var URL_PARAM_Q_LIMIT = 1300;

var store = new Store(config.HTML_URL);

// eslint-disable-next-line id-blacklist
function cache(name, value) {
    store.set(name, value);
    store.set(name + '_timestamp', Date.now());
}

function readCache(name, type) {
    var ts = store.get(name + '_timestamp', 0);
    var obj = store.get(name, null);
    if(obj && ts) {
        var expiry_hrs = config[type.toUpperCase() + '_CACHE_EXPIRY'];
        if(expiry_hrs === undefined) {
            expiry_hrs = 24;
        }
        var MS_IN_HOUR = 3600000,
            expiryTime = ts + (expiry_hrs * MS_IN_HOUR);
        if(expiryTime > Date.now()) {
            return obj;
        }
    }
    return null;
}

function persistChoices(mode, updatePermalink) {
    if(store.able()) {
        var objects;
        if(mode === 'translator') {
            objects = {
                'recentSrcLangs': recentSrcLangs,
                'recentDstLangs': recentDstLangs,
                'curSrcLang': curSrcLang,
                'curDstLang': curDstLang,
                'curSrcChoice': $('.srcLang.active').prop('id'),
                'curDstChoice': $('.dstLang.active').prop('id'),
                'translationInput': $('#originalText').val(),
                'webpageInput': $('#webpage').val(),
                'instantTranslation': $('#instantTranslation').prop('checked'),
                'markUnknown': $('#markUnknown').prop('checked'),
                'chainedTranslation': $('#chainedTranslation').prop('checked')
            };
        }
        else if(mode === 'analyzer') {
            objects = {
                'primaryAnalyzerChoice': $('#primaryAnalyzerMode').val(),
                'secondaryAnalyzerChoice': $('#secondaryAnalyzerMode').val(),
                'analyzerInput': $('#morphAnalyzerInput').val()
            };
        }
        else if(mode === 'generator') {
            objects = {
                'primaryGeneratorChoice': $('#primaryGeneratorMode').val(),
                'secondaryGeneratorChoice': $('#secondaryGeneratorMode').val(),
                'generatorInput': $('#morphGeneratorInput').val()
            };
        }
        else if(mode === 'localization') {
            objects = {
                'locale': $('.localeSelect').val()
            };
        }
        else if(mode === 'sandbox') {
            objects = {
                'sandboxInput': $('#sandboxInput').val()
            };
        }

        for(var name in objects) {
            store.set(name, objects[name]);
        }
    }

    if(window.history.replaceState && parent.location.hash) {
        var hash = parent.location.hash,
            urlParams = [],
            urlParamNames = ['dir', 'choice'];

        $.each(urlParamNames, function () {
            var urlParam = getURLParam(this);
            if(urlParam) {
                urlParams.push(this + '=' + encodeURIComponent(urlParam));
            }
        });

        var qVal = '';
        if(hash === '#translation' && curSrcLang && curDstLang) {
            urlParams = [];
            urlParams.push('dir=' + encodeURIComponent(curSrcLang + '-' + curDstLang));
            qVal = $('#originalText').val();
        }
        if(hash === '#webpageTranslation' && curSrcLang && curDstLang) {
            urlParams = [];
            urlParams.push('dir=' + encodeURIComponent(curSrcLang + '-' + curDstLang));
            qVal = $('#webpage').val();
        }
        else if(hash === '#analyzation' && $('#secondaryAnalyzerMode').val()) {
            urlParams = [];
            urlParams.push('choice=' + encodeURIComponent($('#secondaryAnalyzerMode').val()));
            qVal = $('#morphAnalyzerInput').val();
        }
        else if(hash === '#generation' && $('#secondaryGeneratorMode').val()) {
            urlParams = [];
            urlParams.push('choice=' + encodeURIComponent($('#secondaryGeneratorMode').val()));
            qVal = $('#morphGeneratorInput').val();
        }

        var qName = '';
        if(hash === '#translation') { qName = ''; }
        if(hash === '#webpageTranslation') { qName = 'P'; }
        if(hash === '#analyzation') { qName = 'A'; }
        if(hash === '#generation') { qName = 'G'; }

        if(updatePermalink) {
            if(qVal != undefined && qVal.length > 0 && qVal.length < URL_PARAM_Q_LIMIT) {
                urlParams.push('q' + qName + '=' + encodeURIComponent(qVal));
            }
        }
        else if(getURLParam('q' + qName).length > 0) {
            urlParams.push('q' + qName + '=' + getURLParam('q' + qName));
        }

        var newURL = window.location.pathname + (urlParams.length > 0 ? '?' + urlParams.join('&') : '') + hash;
        window.history.replaceState({}, document.title, newURL);
    }
}

function restoreChoices(mode) {
    if(store.able() && getURLParam('reset').length > 0) {
        store.clear();
    }

    if(mode === 'translator') {
        if(store.able()) {
            recentSrcLangs = store.get('recentSrcLangs', recentSrcLangs);
            recentDstLangs = store.get('recentDstLangs', recentDstLangs);
            curSrcLang = store.get('curSrcLang', curSrcLang);
            curDstLang = store.get('curDstLang', curDstLang);
            if(store.has('recentSrcLangs') && isSubset(recentSrcLangs, srcLangs)) {
                $('.srcLang').removeClass('active');
                $('#srcLangSelect option[value=' + curSrcLang + ']').prop('selected', true);
                $('#' + store.get('curSrcChoice', "srcLang1")).addClass('active');
                if(store.get('curSrcChoice', "srcLang1") === 'detect') {
                    $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
                    $('#detectText').hide();
                }
            }
            if(store.has('recentDstLangs') && isSubset(recentDstLangs, dstLangs)) {
                $('.dstLang').removeClass('active');
                $('#dstLangSelect option[value=' + curDstLang + ']').prop('selected', true);
                $('#' + store.get('curDstChoice', "dstLang1")).addClass('active');
            }

            $('#webpage').val(store.get('webpageInput', ''));
            $('#originalText').val(store.get('translationInput', ''));
            $('#instantTranslation').prop('checked', store.get('instantTranslation', true));
            $('#markUnknown').prop('checked', store.get('markUnknown', window.location.hostname !== "jorgal.uit.no")); // default to true unless on jorgal
            $('#chainedTranslation').prop('checked', store.get('chainedTranslation', false));
        }

        if(getURLParam('dir')) {
            var pair = getURLParam('dir').split('-');
            pair[0] = iso639CodesInverse[pair[0]] ? iso639CodesInverse[pair[0]] : pair[0];
            pair[1] = iso639CodesInverse[pair[1]] ? iso639CodesInverse[pair[1]] : pair[1];
            if(pairs[pair[0]] && pairs[pair[0]].indexOf(pair[1]) !== -1) {
                handleNewCurrentLang(curSrcLang = pair[0], recentSrcLangs, 'srcLang', undefined, true);
                handleNewCurrentLang(curDstLang = pair[1], recentDstLangs, 'dstLang', undefined, true);
            }
        }

        if(getURLParam('q').length > 0) {
            $('#originalText').val(decodeURIComponent(getURLParam('q')));
        }

        if(getURLParam('qP').length > 0) {
            $('#webpage').val(decodeURIComponent(getURLParam('qP')));
        }

        refreshLangList();
    }
    else if(mode === 'analyzer') {
        if(store.able()) {
            var primaryAnalyzerChoice = store.get('primaryAnalyzerChoice', ''),
                secondaryAnalyzerChoice = store.get('secondaryAnalyzerChoice', '');
            if(primaryAnalyzerChoice && secondaryAnalyzerChoice) {
                $('#primaryAnalyzerMode option[value="' + primaryAnalyzerChoice + '"]').prop('selected', true);
                populateSecondaryAnalyzerList();
                $('#secondaryAnalyzerMode option[value="' + secondaryAnalyzerChoice + '"]').prop('selected', true);
            }
            else if(primaryAnalyzerChoice) {
                $('#primaryAnalyzerMode option[value="' + primaryAnalyzerChoice + '"]').prop('selected', true);
            }
            else {
                populateSecondaryAnalyzerList();
            }

            $('#morphAnalyzerInput').val(store.get('analyzerInput', ''));
        }

        if(getURLParam('choice')) {
            var choice = getURLParam('choice').split('-');
            $('#primaryAnalyzerMode option[value="' + choice[0] + '"]').prop('selected', true);
            populateSecondaryAnalyzerList();
            if(choice.length === 2) {
                $('#secondaryAnalyzerMode option[value="' + choice.join('-') + '"]').prop('selected', true);
            }
        }

        if(getURLParam('qA').length > 0) {
            $('#morphAnalyzerInput').val(decodeURIComponent(getURLParam('qA')));
        }
    }
    else if(mode === 'generator') {
        if(store.able()) {
            var primaryGeneratorChoice = store.get('primaryGeneratorChoice', ''),
                secondaryGeneratorChoice = store.get('secondaryGeneratorChoice', '');
            if(store.has('primaryGeneratorChoice') && store.has('secondaryGeneratorChoice')) {
                $('#primaryGeneratorMode option[value="' + primaryGeneratorChoice + '"]').prop('selected', true);
                populateSecondaryGeneratorList();
                $('#secondaryGeneratorMode option[value="' + secondaryGeneratorChoice + '"]').prop('selected', true);
            }
            else {
                populateSecondaryGeneratorList();
            }

            $('#morphGeneratorInput').val(store.get('generatorInput', ''));
        }

        if(getURLParam('choice')) {
            choice = getURLParam('choice').split('-');
            $('#primaryGeneratorMode option[value="' + choice[0] + '"]').prop('selected', true);
            populateSecondaryGeneratorList();
            if(choice.length === 2) {
                $('#secondaryGeneratorMode option[value="' + choice.join('-') + '"]').prop('selected', true);
            }
        }

        if(getURLParam('qG').length > 0) {
            $('#morphGeneratorInput').val(decodeURIComponent(getURLParam('qG')));
        }
    }
    else if(mode === 'localization') {
        if(store.able()) {
            locale = store.get('locale', '');
            if(locale) {
                $('.localeSelect').val(locale);
            }
        }
    }
    else if(mode === 'sandbox') {
        if(store.able()) {
            $('#sandboxInput').val(store.get('sandboxInput', ''));
        }
    }

}

/*:: export {persistChoices, restoreChoices, cache, readCache, store} */
/*:: import {Store} from "./store.js" */
