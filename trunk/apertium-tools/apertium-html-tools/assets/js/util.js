function ajaxSend() {
    $('#loading-indicator').show();
}

function ajaxComplete() {
    $('#loading-indicator').hide();
}

$(document).ajaxSend(ajaxSend);
$(document).ajaxComplete(ajaxComplete);
$(document).ajaxError(ajaxComplete);

$.jsonp.setup({
    callbackParameter: 'callback'
});

$(document).ready(function () {
    $('#noscript').hide();
    $('.navbar').css('margin-top', '0px');
    $('body > .container').css('margin-top', '0px');

    if(config.SHOW_NAVBAR) {
        if(config.ENABLED_MODES === undefined)
            $('.nav a').removeClass('hide');
        else
            $.each(config.ENABLED_MODES, function () {
                $('.nav a[data-mode=' + this + ']').removeClass('hide');
            });
    }
    else {
        $('.navbar-toggle').hide();
        $('.nav').hide();
    }

    var hash = parent.location.hash;

    if(!hash || !$(hash + 'Container')) {
        hash = '#' + config.DEFAULT_MODE;
        parent.location.hash = hash;
    }

    $('.modeContainer' + hash + 'Container').show();
    $('.nav li > a[data-mode=' + hash.substring(1) + ']').parent().addClass('active');

    $('.nav a').click(function () {
        var mode = $(this).data('mode');
        $('.nav li').removeClass('active');
        $(this).parent('li').addClass('active');
        $('.modeContainer:not(#' + mode + 'Container)').hide({
            queue: false
        });
        $('#' + mode + 'Container').show({
            queue: false
        });
    });

    if(config.ALLOWED_LANGS)
        $.each(config.ALLOWED_LANGS.slice(0), function () {
            if(iso639Codes[this])
                config.ALLOWED_LANGS.push(iso639Codes[this]);
            if(iso639CodesInverse[this])
                config.ALLOWED_LANGS.push(iso639CodesInverse[this]);
        });

    $('form').submit(function () {
        return false;
    });

    $('.modal').on('show.bs.modal', function () {
        $.each($(this).find('img[data-src]'), function () {
            $(this).attr('src', $(this).attr('data-src'));
        });
    });
});

if(config.GOOGLE_ANALYTICS_PROPERTY && config.GOOGLE_ANALYTICS_TRACKING_ID) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', config.GOOGLE_ANALYTICS_TRACKING_ID, config.GOOGLE_ANALYTICS_PROPERTY);
    ga('require', 'displayfeatures');
    ga('send', 'pageview');
}

function sendGAEvent(category, action, label, value) {
    if(config.GOOGLE_ANALYTICS_PROPERTY && config.GOOGLE_ANALYTICS_TRACKING_ID && ga) {
        var args = ['send', 'event', category, action];
        if(label !== undefined && value !== undefined)
            args = args.concat([label, value]);
        else if(label !== undefined)
            args.push(label);

        ga.apply(undefined, args);
    }
}

function modeEnabled(mode) {
    return config.ENABLED_MODES === undefined || config.ENABLED_MODES.indexOf(mode) !== -1;
}

function filterLangList(langs, filterFn) {
    if(config.ALLOWED_LANGS === undefined && config.ALLOWED_VARIANTS === undefined)
        return langs;
    else {
        if(!filterFn)
            filterFn = function (code) {
                return  allowedLang(code) || ((code.indexOf('-') !== -1 && (allowedLang(code.split('-')[0]) || allowedLang(code.split('-')[1]))));
            };

        return langs.filter(filterFn);
    }
}

function allowedLang(code) {
    if(code.indexOf('_') === -1)
        return config.ALLOWED_LANGS === undefined || config.ALLOWED_LANGS.indexOf(code) !== -1;
    else
        return allowedLang(code.split('_')[0]) && (config.ALLOWED_VARIANTS === undefined || config.ALLOWED_VARIANTS.indexOf(code.split('_')[1]) !== -1);
}

function getURLParam(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
    var regexS = "[\\?&]" + name + "=([^&#]*)";  
    var regex = new RegExp(regexS);  
    var results = regex.exec(window.location.href); 
     return results == null ? "" : results[1];
 }

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function isSubset(subset, superset) {
    return subset.every(function (val) {
        return superset.indexOf(val) >= 0;
    });
}

