$(document).ready(function() {
    $('#request').click(function () {
        request();
    });

    $('#sandboxForm').submit(function () {
        return false;
    });

    $("#sandboxInput").keydown(function (e){
        if(e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            request();
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

function request () {
    $("#morphGenOutput").animate({ opacity: 0.5 });
    $.ajax({
        url: APY_URL + $('#sandboxInput').val(),
        type: 'GET',
        success: function (data) {
            $('#sandboxOutput').empty();
            $('#sandboxOutput').text(JSON.stringify(data, undefined, 3));
            $("#sandboxOutput").animate({ opacity: 1 });
        },
        dataType: 'jsonp',
        failure: function (xhr, textStatus, error) {
            $('#sandboxOutput').text(error);
            $("#sandboxOutput").animate({ opacity: 1 });
        },
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
}
