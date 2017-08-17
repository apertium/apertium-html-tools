var currentSandboxRequest;

/* global config, ajaxSend, ajaxComplete, persistChoices, restoreChoices */
/* global ENTER_KEY_CODE */

if(config.ENABLED_MODES === undefined || config.ENABLED_MODES.indexOf('sandbox') !== -1) {
    $(document).ready(function () {
        $('#sandboxForm').submit(function () {
            request();
        });

        $('#sandboxInput').keydown(function (e) {
            if(e.keyCode === ENTER_KEY_CODE && !e.shiftKey) {
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
    var startTime = new Date().getTime();
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
            $('#time').text(new Date().getTime() - startTime + ' ms');
            currentSandboxRequest = undefined;
        }
    });
}
