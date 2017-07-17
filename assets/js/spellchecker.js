if(modeEnabled('spellchecker')) {
    $(document).ready(function() {
        restoreChoices('spellchecker');

        $('#check').click(function() {
            clearTimeout(timer);
            check();
        });

        var timer, timeout = 2000;
        $('#spellcheckerInput').on('input propertychange', function(e) {
            if(timer && $('#instantChecking').prop('checked'))
                clearTimeout(timer);

            timer = setTimeout(function() {
                if($('#instantChecking').prop('checked')) {
                    check();
                }
            }, timeout);
        });

        $('#primarySpellcheckerMode').change(function() {
            populateSecondarySpellcheckerList();
            localizeInterface();
            persistChoices('spellchecker');
        });

        $('#secondarySpellcheckerMode').change(function() {
            persistChoices('spellchecker');
        });

        $('#instantChecking').change(function() {
            persistChoices('spellchecker');
        });

        $('#spellcheckerInput').on('input propertychange', function() {
            $('#spellcheckerInput').removeClass('spellcheckVisible');
            $('.spellError').each(function() {
                $(this).popover('hide');
            });
            persistChoices('spellchecker');
        });

        $('#spellcheckerInput').submit(function() {
            clearTimeout(timer);
            check();
        });

        $(document).on('mouseover', '.spellcheckVisible .spellError', function() {
            $('.spellError').each(function() {
                $(this).popover('hide');
            });
            $(this).popover('show');
        });

        $(document).on('mouseleave', '.spellError', function() {
            e = $(this);
            t = setTimeout(function() {
                e.popover('hide');
            }, 400);
            $(this).on('mouseover', function() {
                clearTimeout(t);
            });
            $(document).on('mouseover', '.popover', function() {
                clearTimeout(t);
            });
            $(document).on('mouseleave', '.popover', function() {
                e.popover('hide');
            });
        });

        $(document).on('click', '.list-group-item', function() {
            e = $(this).parents('.popover').prev();
            e.text($(this).text());
            e.removeClass('spellError');
            e.popover('hide');
            check();
        });
    });
}

function populateSecondarySpellcheckerList() {
    var group = analyzers[$('#primarySpellcheckerMode').val()];
    $('#secondarySpellcheckerMode').empty();

    if(group) {
        if(group.length <= 1)
            $('$secondarySpellcheckerMode').fadeOut('fast');
        else
            $('$secondarySpellcheckerMode').fadeIn('fast');

        group.sort(function (a, b) {
            var lang = group[i];
            var langDisplay = lang.indexOf('-') !== -1 ? getLangByCode(lang.split('-')[0]) + '-' + getLangByCode(lang.split('-')[1]) : getLangByCode(lang);
            $('$secondarySpellcheckerMode').append($('<option></option>').val(lang).text(langDisplay));
        });
    }
    else
        $('#secondarySpellcheckerMode').fadeOut('fast');
}

var dummy_words = ['hello', 'my', 'name', 'is', 'and', 'I', 'like', 'nothing', 'but', 'bacon'];

function check() {
    // APY call will make following code much cleaner.
    
    $('#spellcheckerInput').html($('#spellcheckerInput').html().replace(/\<br\>/g, '\n').replace(/&nbsp;/g, ' '));
    words = $.trim($('#spellcheckerInput').text());

    $('#spellcheckerInput').addClass('spellcheckVisible');
    // TODO send words to APY
    words = words.split(' ');

    for(d in dummy_words)
        dummy_words[d] = dummy_words[d].toLowerCase();

    $('#spellcheckerInput').html('');
    for(w in words) {
        words[w] = words[w].replace(/\n/g, '<br>');
        if(dummy_words.indexOf(words[w].toLowerCase()) == -1)
            $('#spellcheckerInput').html($('#spellcheckerInput').html() + '<span class="spellError">' + words[w] + '</span>');
        else
            $('#spellcheckerInput').html($('#spellcheckerInput').html() + words[w]);

        if(w != words.length - 1)
            $('#spellcheckerInput').html($('#spellcheckerInput').html() + ' ');
    }

    content = '<div class="list-group">';
    for(w in dummy_words)
        content += '<a href="#" class="list-group-item">' + dummy_words[w] + '</a>';
    content += '</div>';
    
    $('.spellError').each(function() {
        $(this).popover({animation: false, placement: 'bottom', trigger: 'manual', html: true, content: content});
    });
}
