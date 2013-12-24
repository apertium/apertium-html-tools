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
});

function request () {
    $("#morphGenOutput").animate({ opacity: 0.5 });
    var start_time = new Date().getTime();
    $.ajax({
        url: APY_URL + $('#sandboxInput').val(),
        type: 'GET',
        success: function (data) {
            $('#sandboxOutput').empty();
            $('#sandboxOutput').text(JSON.stringify(data, undefined, 3));
            $("#sandboxOutput").animate({ opacity: 1 });
            $('#time').text((new Date().getTime() - start_time) + ' ms');
        },
        dataType: 'jsonp',
        failure: function (xhr, textStatus, error) {
            $('#sandboxOutput').text(error);
            $("#sandboxOutput").animate({ opacity: 1 });
            $('#time').text(new Date().getTime() - start_time);
        },
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
}
