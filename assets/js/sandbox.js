var currentSandboxRequest;

if(config.ENABLED_MODES === undefined || config.ENABLED_MODES.indexOf('sandbox') !== -1) {
    $(document).ready(function () {
        $('#request').click(function () {
            request();
        });

        $('#sandboxInput').keydown(function (e) {
            if(e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                request();
            }
        });

        $('#sandboxInput').on('input propertychange', function () {
            persistChoices('sandbox');
        });

        restoreChoices('sandbox');
    });
}

function request() {
    $('#sandboxOutput').addClass('blurred');
    var start_time = new Date().getTime();
    if(currentSandboxRequest) {
        currentSandboxRequest.abort();
    }
    currentSandboxRequest = $.jsonp({
        url: config.APY_URL + $('#sandboxInput').val(),
        beforeSend: ajaxSend,
        success: function (data) {
            $('#sandboxOutput').text(JSON.stringify(data, undefined, 3)).removeClass('blurred');
        },
        error: function (xOptions, error) {
            $('#sandboxOutput').text(error).removeClass('blurred');
        },
        complete: function () {
            ajaxComplete();
            $('#time').text((new Date().getTime() - start_time) + ' ms');
            currentSandboxRequest = undefined;
        }
    });
}
