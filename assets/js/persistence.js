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
            store(name, objects[name]);
    }

    function store(name, obj) {
        localStorage[name] = JSON.stringify(obj);
    }
}

function restoreChoices(mode) {
    if(localStorage) {
        if(mode === 'translator') {
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
                $('#instantTranslation').attr('checked', retrieve('instantTranslation'));

            refreshLangList();
        }
        else if(mode === 'analyzer') {
            if('primaryAnalyzerChoice' in localStorage && 'secondaryAnalyzerChoice' in localStorage) {
                $('#primaryAnalyzerMode option[value="' + retrieve('primaryAnalyzerChoice') + '"]').prop('selected', true);
                populateSecondaryAnalyzerList();
                $('#secondaryAnalyzerMode option[value="' + retrieve('secondaryAnalyzerChoice') + '"]').prop('selected', true);
            }
            else
                populateSecondaryAnalyzerList();

            if('analyzerInput' in localStorage)
                $('#morphAnalyzerInput').val(retrieve('analyzerInput'));
        }
        else if(mode === 'generator') {
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
        else if(mode === 'localization') {
            if('locale' in localStorage) {
                locale = retrieve('locale');
                $('.localeSelect').val(locale);
            }
        }
        else if(mode === 'sandbox') {
            if('sandboxInput' in localStorage) {
                $('#sandboxInput').val(retrieve('sandboxInput'));
            }
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

