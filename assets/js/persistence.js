/* exported persistChoices, restoreChoices */

var URL_PARAM_Q_LIMIT = 1300;

function persistChoices(mode, updatePermalink) {
    if(localStorage) {
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
                'instantTranslation': $('#instantTranslation').prop('checked')
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
            localStorage[name] = JSON.stringify(objects[name]);
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

        var qVal = "";
        if(hash === '#translation' && curSrcLang && curDstLang) {
            urlParams = [];
            urlParams.push('dir=' + encodeURIComponent(curSrcLang + '-' + curDstLang));
            qVal = $('#originalText').val();
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

        var qName = "";
        if(hash === '#translation') { qName = ''; }
        if(hash === '#analyzation') { qName = 'A'; }
        if(hash === '#generation') { qName = 'G'; }

        if(updatePermalink) {
            if(qVal != undefined && qVal.length > 0 && qVal.length < URL_PARAM_Q_LIMIT) {
                urlParams.push('q' + qName + '=' + qVal);
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
    if(localStorage && getURLParam('reset').length > 0) {
        localStorage.clear();
    }

    if(mode === 'translator') {
        if(localStorage) {
            recentSrcLangs = safeRetrieve('recentSrcLangs', recentSrcLangs);
            recentDstLangs = safeRetrieve('recentDstLangs', recentDstLangs);
            curSrcLang = safeRetrieve('curSrcLang', "eng");
            curDstLang = safeRetrieve('curDstLang', "spa");
            if('recentSrcLangs' in localStorage && isSubset(recentSrcLangs, srcLangs)) {
                $('.srcLang').removeClass('active');
                $('#srcLangSelect option[value=' + curSrcLang + ']').prop('selected', true);
                $('#' + safeRetrieve('curSrcChoice', "srcLang1")).addClass('active');
                if(safeRetrieve('curSrcChoice', "srcLang1") === 'detect') {
                    $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
                    $('#detectText').hide();
                }
            }
            if('recentDstLangs' in localStorage && isSubset(recentDstLangs, dstLangs)) {
                $('.dstLang').removeClass('active');
                $('#dstLangSelect option[value=' + curDstLang + ']').prop('selected', true);
                $('#' + safeRetrieve('curDstChoice', "dstLang1")).addClass('active');
            }
            $('#originalText').val(safeRetrieve('translationInput', ""));
            $('#instantTranslation').prop('checked', safeRetrieve('instantTranslation', "true"));
        }

        if(getURLParam('dir')) {
            var pair = getURLParam('dir').split('-');
            pair[0] = iso639CodesInverse[pair[0]] ? iso639CodesInverse[pair[0]] : pair[0];
            pair[1] = iso639CodesInverse[pair[1]] ? iso639CodesInverse[pair[1]] : pair[1];
            if(pairs[pair[0]] && pairs[pair[0]].indexOf(pair[1]) !== -1) {
                handleNewCurrentLang(curSrcLang = pair[0], recentSrcLangs, 'srcLang');
                handleNewCurrentLang(curDstLang = pair[1], recentDstLangs, 'dstLang');
            }
        }

        if(getURLParam('q').length > 0) {
            $('#originalText').val(decodeURIComponent(getURLParam('q')));
        }

        refreshLangList();
    }
    else if(mode === 'analyzer') {
        if(localStorage) {
            var primaryAnalyzerChoice = safeRetrieve('primaryAnalyzerChoice', ""),
                secondaryAnalyzerChoice = safeRetrieve('secondaryAnalyzerChoice', "");
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

            $('#morphAnalyzerInput').val(safeRetrieve('analyzerInput', ""));
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
        if(localStorage) {
            var primaryGeneratorChoice = safeRetrieve('primaryGeneratorChoice', ""),
                secondaryGeneratorChoice = safeRetrieve('secondaryGeneratorChoice', "");
            if('primaryGeneratorChoice' in localStorage && 'secondaryGeneratorChoice' in localStorage) {
                $('#primaryGeneratorMode option[value="' + primaryGeneratorChoice + '"]').prop('selected', true);
                populateSecondaryGeneratorList();
                $('#secondaryGeneratorMode option[value="' + secondaryGeneratorChoice + '"]').prop('selected', true);
            }
            else {
                populateSecondaryGeneratorList();
            }

            $('#morphGeneratorInput').val(safeRetrieve('generatorInput', ""));
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
        if(localStorage) {
            locale = safeRetrieve('locale', "");
            if(locale) {
                $('.localeSelect').val(locale);
            }
        }
    }
    else if(mode === 'sandbox') {
        if(localStorage) {
            $('#sandboxInput').val(safeRetrieve('sandboxInput', ""));
        }
    }

}

/*:: export {persistChoices, restoreChoices} */
