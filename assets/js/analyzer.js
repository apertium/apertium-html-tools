var analyzers = {};

$(document).ready(function () {
    $('#analyze').click(function () {
        analyze();
    });
    
    $('#analysisForm').submit(function () {
        return false;
    });
    
    $("#morphAnalyzerInput").keydown(function (e) {
        if(e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            analyze();
        }
    });
});

function getAnalyzers () {
    var deferred = $.Deferred();
    $.jsonp({
        url: APY_URL + '/list?q=analyzers',
        pageCache: true,
        beforeSend: ajaxSend,
        success: function (data) {
            analyzers = data;
            populateAnalyzerList(analyzers);
        },
        complete: function () {
            ajaxComplete();
            deferred.resolve();
        }
    });
    return deferred.promise();
}

function populateAnalyzerList (data) {
    formattedAnalyzers = formatModes(data).sort(function (a, b) {
        return a[1].localeCompare(b[1]);
    });
    var selected = $('#analyzerMode').val();
    $('#analyzerMode').empty();
    for(var i = 0; i < formattedAnalyzers.length; i++)
        $('#analyzerMode').append($('<option></option').val(formattedAnalyzers[i][0]).text(formattedAnalyzers[i][1]));
    $('#analyzerMode option[value="' + selected + '"]').prop('selected', true);
}

function analyze () {
    $("#morphAnalyzerOutput").animate({ opacity: 0.5 });
    $.jsonp({
        url: APY_URL + '/analyze',
        pageCache: true,
        beforeSend: ajaxSend,
        complete: ajaxComplete,
        data: {
            'mode': $('#analyzerMode').val(),
            'q': $('#morphAnalyzerInput').val()
        },
        success: function (data) {
            var regex = /([^<]*)((<[^>]+>)*)/g;
            $('#morphAnalyzerOutput').empty();
            for(var i = 0; i < data.length; i++) {
                var leftTD = $('<td class="text-right"></td>');
                var strong = $('<strong></strong>').text(data[i][1].trim());
                var arrow = $('<span></span>').html('&nbsp;&nbsp;&#8620;');
                leftTD.append(strong).append(arrow)
                
                var rightTD = $('<td class="text-left"></td>');
                var splitUnit = data[i][0].split('/');

                if(splitUnit[1][0] === '*')
                    rightTD.css({color: 'darkred'})
                
                var tr = $('<tr></tr>').append(leftTD).append(rightTD);
                $('#morphAnalyzerOutput').append(tr);
                
                joinedMorphemes = {}
                unitsWithMorphemes = []
                for(var j = 1; j < splitUnit.length; j++) {
                    var unit = splitUnit[j];
                    if(unit.match(regex).length > 2) {
                        var matches = unit.match(regex);
                        for(var k = 1; k < matches.length - 1; k++) {
                            if(joinedMorphemes[matches[k]])
                                joinedMorphemes[matches[k]].push(unit);
                            else
                                joinedMorphemes[matches[k]] = [unit];
                        }
                    }
                    else {
                        var unitDiv = $('<div></div>').html(formatUnit(unit));
                        rightTD.append(unitDiv);
                    }
                }
                $.each(joinedMorphemes, function (joinedMorpheme, units) {
                    var morphemeDiv = $('<div></div>').html(formatUnit(joinedMorpheme));
                    rightTD.append(morphemeDiv);
                    for(var j = 0; j < units.length; j++) {
                        var unitDiv = $('<div style="margin-left: 30px;"></div>').html(formatUnit(units[j].match(regex)[0]));
                        rightTD.append(unitDiv);
                    }
                });
                $("#morphAnalyzerOutput").animate({ opacity: 1 });
            }
        },
        error: function (xOptions, error) {
            $('#morphGenOutput').text(error);
            $("#morphAnalyzerOutput").animate({ opacity: 1 });
        }
    });
}

function formatUnit (unit) {
    var tagRegex = /<([^>]+)>/g;
    var tags = [];
    var tagMatch = tagRegex.exec(unit);
    while(tagMatch != null) {
        tags.push(tagMatch[1]);
        tagMatch = tagRegex.exec(unit);
    }
    var tagStartLoc = unit.indexOf('<');
    return unit.substring(0, tagStartLoc != -1 ? tagStartLoc : unit.length) + (tags.length > 0 ? '&nbsp;&nbsp;&#8612;&nbsp;&nbsp;' + tags.join(' &#8901; ') : '');
}
