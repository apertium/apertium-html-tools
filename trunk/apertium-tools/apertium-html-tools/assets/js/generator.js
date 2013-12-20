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
    
    $.ajax({
        url: APY_URL + '/list?q=generators',
        type: 'GET',
        success: function (data) {
            data = formatModes(data);
            for(var i = 0; i < data.length; i++)
                $('#generatorMode').append($('<option></option').val(data[i][0]).text(data[i][1]));
        },
        dataType: 'jsonp',
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
});

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
