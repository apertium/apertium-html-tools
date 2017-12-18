// @flow

var currentSandboxRequest;

/* global config, ajaxSend, ajaxComplete, persistChoices, restoreChoices */
/* global ENTER_KEY_CODE */

if(!config.ENABLED_MODES || config.ENABLED_MODES.indexOf('sandbox') !== -1) {
    $(document).ready(function () {
        $('#sandboxForm').submit(function () {
            request();
        });

        $('#sandboxInput').keydown(function (e /*: JQueryKeyEventObject */) {
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
    var input = $('#sandboxInput').val();
    if(input.trim() === '') {
        return;
    }

    $('#sandboxOutput').addClass('blurred');
    var startTime /*: number */ = new Date().getTime();
    if(currentSandboxRequest) {
        currentSandboxRequest.abort();
    }
    currentSandboxRequest = $.jsonp({
        url: config.APY_URL + input,
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
            currentSandboxRequest = null;
        }
    });
}

/*:: import {ajaxSend, ajaxComplete} from "./util.js" */
/*:: import {ENTER_KEY_CODE} from "./util.js" */
/*:: import {persistChoices, restoreChoices} from "./persistence.js" */
/*:: import {locale} from "./localization.js" */
