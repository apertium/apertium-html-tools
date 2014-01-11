var generators = {};

$(document).ready(function() {
    $('#generate').click(function () {
        generate();
    });

    $('#generateForm').submit(function () {
        return false;
    });

    $("#morphGeneratorInput").keydown(function (e){
        if(e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            generate();
        }
    });
});

function getGenerators () {
    var deferred = $.Deferred();
    $.ajax({
        url: APY_URL + '/list?q=generators',
        type: 'GET',
        success: function (data) {
            generators = data;
            populateGeneratorList(generators);
        },
        dataType: 'jsonp',
        beforeSend: ajaxSend,
        complete: function() {
            ajaxComplete();
            deferred.resolve();
        }
    });
    return deferred.promise();
}

function populateGeneratorList (data) {
    formattedGenerators = formatModes(data).sort(function (a, b) {
        return a[1].localeCompare(b[1]);
    });
    var selected = $('#generatorMode').val();
    $('#generatorMode').empty();
    for(var i = 0; i < formattedGenerators.length; i++)
        $('#generatorMode').append($('<option></option').val(formattedGenerators[i][0]).text(formattedGenerators[i][1]));
    $('#generatorMode option[value="' + selected + '"]').prop('selected', true);
}

function generate () {
    $("#morphGenOutput").animate({ opacity: 0.5 });
    $.ajax({
        url: APY_URL + '/generate',
        type: 'GET',
        data: {
            'mode': $('#generatorMode').val(),
            'q': $('#morphGeneratorInput').val()
        },
        success: function (data) {
            $('#morphGenOutput').empty();
            for(var i = 0; i < data.length; i++) {
                var div = $('<div class="generation" data-toggle="tooltip" data-placement="auto" data-html="true"></div>');
                var strong = $('<strong></strong>').text(data[i][1].trim());
                var span = $('<span></span>').html('&nbsp;&nbsp;&#8620;&nbsp;&nbsp;' + data[i][0]);
                div.append(strong).append(span);
                $('#morphGenOutput').append(div);
            }
            $("#morphGenOutput").animate({ opacity: 1 });
        },
        dataType: 'jsonp',
        failure: function (xhr, textStatus, error) {
            $('#morphGenOutput').text(error);
            $("#morphGenOutput").animate({ opacity: 1 });
        },
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
}
