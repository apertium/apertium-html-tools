var APY_URL = '//localhost:2737';

function ajaxSend () {
    $("#loading-indicator").show(); 
}

function ajaxComplete () { 
    $("#loading-indicator").hide(); 
}

$(document).ajaxSend(ajaxSend);
$(document).ajaxComplete(ajaxComplete);
$(document).ajaxError(ajaxComplete);

$.jsonp.setup({
    callbackParameter: "callback"
});

$(document).ready(function () {
    if(!parent.location.hash || !$(parent.location.hash + 'Container'))
        parent.location.hash = '#translation';
    $('.modeContainer' + parent.location.hash + 'Container').show();
    $('.nav li > a[data-mode=' +  parent.location.hash.substring(1) + ']').parent().addClass('active');

    $('.nav a').click(function () {
        var mode = $(this).data('mode');
        $('.nav li').removeClass('active');
        $(this).parent('li').addClass('active');
        $('.modeContainer:not(#' + mode + 'Container)').hide({ queue: false });
        $('#' + mode + 'Container').show({ queue: false }); 
    });
});

function formatModes (modes) {
    var modesArr = [], toReturn = []
    for(var val in modes) {
        if(val.indexOf('-') === -1)
            modesArr.push(val);
        else
            modesArr = modesArr.concat(val.split('-'));
    }
    for(var val in modes) {
        if(val.indexOf('-') === -1)
            toReturn.push([val, getLangByCode(val)]);
        else {
            var mode = val.split('-')[0];
            if(modesArr.indexOf(mode) === -1)
                toReturn.push([val, getLangByCode(mode)]);
            else
                toReturn.push([val, getLangByCode(mode) + ' (' + val + ')']);
        }   
    }
    return toReturn;
}

function persistChoices (mode) {
    if(localStorage) {
        if(mode == 'translator') {
             objects = {
                'recentSrcLangs': recentSrcLangs,
                'recentDstLangs': recentDstLangs,
                'curSrcLang': curSrcLang,
                'curDstLang': curDstLang,
                'curSrcChoice': $('.srcLang.active').prop('id'),
                'curDstChoice': $('.dstLang.active').prop('id'),
            };
        }
        else if(mode == 'analyzer') {
             objects = {
                'primaryAnalyzerChoice': $('#primaryAnalyzerMode').val(),
                'secondaryAnalyzerChoice': $('#secondaryAnalyzerMode').val()
            };
        }
        else if(mode == 'generator') {
             objects = {
                'primaryGeneratorChoice': $('#primaryGeneratorMode').val(),
                'secondaryGeneratorChoice': $('#secondaryGeneratorMode').val()
            };
        }

        for(var name in objects)
            store(name, objects[name]);
    }

    function store (name, obj) {
        localStorage[name] = JSON.stringify(obj);
    }
}

function restoreChoices (mode) {
    if(localStorage) {
        if(mode == 'translator') {
            if('recentSrcLangs' in localStorage && isSubset(retrieve('recentSrcLangs'), srcLangs)) {
                recentSrcLangs = retrieve('recentSrcLangs');
                curSrcLang = retrieve('curSrcLang');
                $('.srcLang').removeClass('active');
                $('#' + retrieve('curSrcChoice')).addClass('active');
            }
            if('recentDstLangs' in localStorage && isSubset(retrieve('recentDstLangs'), dstLangs)) {
                recentDstLangs = retrieve('recentDstLangs');
                curDstLang = retrieve('curDstLang');
                $('.dstLang').removeClass('active');
                $('#' + retrieve('curDstChoice')).addClass('active');
            }
            refreshLangList();
        }
        else if(mode == 'analyzer') {
            if('primaryAnalyzerChoice' in localStorage && 'secondaryAnalyzerChoice' in localStorage) {
                $('#primaryAnalyzerMode option[value="' + retrieve('primaryAnalyzerChoice') + '"]').prop('selected', true);
                populateSecondaryAnalyzerList();
                $('#secondaryAnalyzerMode option[value="' + retrieve('secondaryAnalyzerChoice') + '"]').prop('selected', true);
            }
        }
        else if(mode == 'generator') {
            if('primaryGeneratorChoice' in localStorage && 'secondaryGeneratorChoice' in localStorage) {
                $('#primaryGeneratorMode option[value="' + retrieve('primaryGeneratorChoice') + '"]').prop('selected', true);
                populateSecondaryGeneratorList();
                $('#secondaryGeneratorMode option[value="' + retrieve('secondaryGeneratorChoice') + '"]').prop('selected', true);
            }
        }
    }

    function retrieve (name) {
        return JSON.parse(localStorage[name]);
    }
}

function onlyUnique (value, index, self) { 
    return self.indexOf(value) === index;
}

function isSubset (subset, superset) {
  return subset.every(function(val) { return superset.indexOf(val) >= 0; });
}
