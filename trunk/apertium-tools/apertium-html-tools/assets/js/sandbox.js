$(document).ready(function () {
    $('#request').click(function () {
        request();
    });

    $('#sandboxForm').submit(function () {
        return false;
    });

    $("#sandboxInput").keydown(function (e) {
        if(e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            request();
        }
    });
});

function request () {
    $("#morphGenOutput").animate({ opacity: 0.5 });
    var start_time = new Date().getTime();
    $.jsonp({
        url: APY_URL + $('#sandboxInput').val(),
        beforeSend: ajaxSend,
        complete: ajaxComplete,
        success: function (data) {
            $('#sandboxOutput').empty();
            $('#sandboxOutput').text(JSON.stringify(data, undefined, 3));
            $("#sandboxOutput").animate({ opacity: 1 });
            $('#time').text((new Date().getTime() - start_time) + ' ms');
        },
        error: function (xOptions, error) {
            $('#sandboxOutput').text(error);
            $("#sandboxOutput").animate({ opacity: 1 });
            $('#time').text(new Date().getTime() - start_time);
        },
    });
}
