function persistChoices(mode) {
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

        for(var name in objects)
          localStorage[name] = JSON.stringify(objects[name]);
    }

    if(window.history.replaceState && parent.location.hash) {
        var hash = parent.location.hash,
            urlParams = [],
            urlParamNames = ['dir', 'choice'];

        $.each(urlParamNames, function () {
            var urlParam = getURLParam(this);
            if(urlParam)
                urlParams.push(this + '=' + encodeURIComponent(urlParam));
        });

        if(hash === '#translation' && curSrcLang && curDstLang) {
            urlParams = [];
            urlParams.push('dir' + '=' + encodeURIComponent(curSrcLang + '-' + curDstLang));
        }
        else if(hash === '#analyzation' && $('#secondaryAnalyzerMode').val()) {
            urlParams = [];
            urlParams.push('choice' + '=' + encodeURIComponent($('#secondaryAnalyzerMode').val()));
        }
        else if(hash === '#generation' && $('#secondaryGeneratorMode').val()) {
            urlParams = [];
            urlParams.push('choice' + '=' + encodeURIComponent($('#secondaryGeneratorMode').val()));
        }

        var newURL = window.location.pathname + (urlParams.length > 0 ? '?' + urlParams.join('+') : '') + hash;
        window.history.replaceState({}, document.title, newURL);
    }
}

function restoreChoices(mode) {
    if(mode === 'translator') {
        if(localStorage) {
            if('recentSrcLangs' in localStorage && isSubset(retrieve('recentSrcLangs'), srcLangs)) {
                recentSrcLangs = retrieve('recentSrcLangs');
                curSrcLang = retrieve('curSrcLang');
                $('.srcLang').removeClass('active');
                $('#srcLangSelect option[value=' + curSrcLang + ']').prop('selected', true);
                $('#' + retrieve('curSrcChoice')).addClass('active');
                if(retrieve('curSrcChoice') === 'detect') {
                    $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
                    $('#detectText').hide();
                }
            }
            if('recentDstLangs' in localStorage && isSubset(retrieve('recentDstLangs'), dstLangs)) {
                recentDstLangs = retrieve('recentDstLangs');
                curDstLang = retrieve('curDstLang');
                $('.dstLang').removeClass('active');
                $('#dstLangSelect option[value=' + curDstLang + ']').prop('selected', true);
                $('#' + retrieve('curDstChoice')).addClass('active');
            }

            if('translationInput' in localStorage)
                $('#originalText').val(retrieve('translationInput'));

            if('instantTranslation' in localStorage)
                $('#instantTranslation').prop('checked', retrieve('instantTranslation'));
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

        refreshLangList();
    }
    else if(mode === 'analyzer') {
        if(localStorage) {
            if('primaryAnalyzerChoice' in localStorage && 'secondaryAnalyzerChoice' in localStorage) {
                $('#primaryAnalyzerMode option[value="' + retrieve('primaryAnalyzerChoice') + '"]').prop('selected', true);
                populateSecondaryAnalyzerList();
                $('#secondaryAnalyzerMode option[value="' + retrieve('secondaryAnalyzerChoice') + '"]').prop('selected', true);
            }
            else if('primaryAnalyzerChoice' in localStorage)
                $('#primaryAnalyzerMode option[value="' + retrieve('primaryAnalyzerChoice') + '"]').prop('selected', true);
            else
                populateSecondaryAnalyzerList();

            if('analyzerInput' in localStorage)
                $('#morphAnalyzerInput').val(retrieve('analyzerInput'));
        }

        if(getURLParam('choice')) {
            var choice = getURLParam('choice').split('-');
            $('#primaryAnalyzerMode option[value="' + choice[0] + '"]').prop('selected', true);
            populateSecondaryAnalyzerList();
            if(choice.length === 2)
                $('#secondaryAnalyzerMode option[value="' + choice.join('-') + '"]').prop('selected', true);
        }
    }
    else if(mode === 'generator') {
        if(localStorage) {
            if('primaryGeneratorChoice' in localStorage && 'secondaryGeneratorChoice' in localStorage) {
                $('#primaryGeneratorMode option[value="' + retrieve('primaryGeneratorChoice') + '"]').prop('selected', true);
                populateSecondaryGeneratorList();
                $('#secondaryGeneratorMode option[value="' + retrieve('secondaryGeneratorChoice') + '"]').prop('selected', true);
            }
            else
                populateSecondaryGeneratorList();

            if('generatorInput' in localStorage)
                $('#morphGeneratorInput').val(retrieve('generatorInput'));
        }

        if(getURLParam('choice')) {
            var choice = getURLParam('choice').split('-');
            $('#primaryGeneratorMode option[value="' + choice[0] + '"]').prop('selected', true);
            populateSecondaryGeneratorList();
            if(choice.length === 2)
                $('#secondaryGeneratorMode option[value="' + choice.join('-') + '"]').prop('selected', true);
        }
    }
    else if(mode === 'localization') {
        if(localStorage && 'locale' in localStorage) {
            locale = retrieve('locale');
            $('.localeSelect').val(locale);
        }
    }
    else if(mode === 'sandbox') {
        if(localStorage && 'sandboxInput' in localStorage) {
            $('#sandboxInput').val(retrieve('sandboxInput'));
        }
    }

    function retrieve(name) {
        try {
            return JSON.parse(localStorage[name]);
        }
        catch(e) {
            return null;
        }
    }
}
