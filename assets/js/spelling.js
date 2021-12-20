/* @flow */


var unknownMarkRE = /([#*])([^.,;:\t\n\r\* ]+)/g;

/* Insert text into div, but wrapping a class .unknownWord around each
 * word that starts with '*', or .ungeneratedWord around those that
 * start with '#'; then run the spell checker on .unknownWord's. */
function insertWithSpelling(text, div, language, includeMark) {
    div.html("");
    unknownMarkRE.lastIndex = 0;
    var match,
        last = 0;
    while((match = unknownMarkRE.exec(text))) {
        var preText = text.substring(last, match.index),
            unkClass = (match[1] === '*') ? 'unknownWord' : 'ungeneratedWord',
            unkMark = includeMark ? match[1] : '',
            unkText = unkMark + match[2];
        div.append($('<span />').text(preText));
        var unk = $('<span />').text(unkText).addClass(unkClass);
        unk.data('index', match.index); // used by pickSpellingSuggestion
        div.append(unk);
        last = unknownMarkRE.lastIndex;
    }
    div.append($('<span />').text(text.substring(last)));
    spell(div.find('.unknownWord'), language);
}

function readCacheSuggestions(form, language) {
    return readCache("spellingSuggestion:" + language + ":" + form, 'SPELLING');
}

function cacheSuggestions(form, suggestions, language) {

    cache("spellingSuggestion:" + language + ":" + form, suggestions);
}

function spellCached(forms, language, onSuccess, _onError) {
    var data = $.map(forms, function(form, _i) {
        return readCacheSuggestions(form, language);
    });
    onSuccess(data);
}

function spellFake(forms, language, onSuccess, onError) {
    // For testing when the network is down
    var result = $(forms).map(function(_i, f) {
        return {
            word: f,
            suggestions: [
                f.split("").reverse().join(""),
                f+"s",
                f.replace(/ie/g, "ei")
            ]
        };
    }).toArray();
    onSuccess(result);
}

function spellDivvun(forms, language, onSuccess, onError) {
    var slang = language;
    if(iso639Codes.hasOwnProperty(language)) {
        slang = iso639Codes[language];
    }
    return $.jsonp({
        url: '//gtweb.uit.no/divvun3000/spellcheck31/script/ssrv.cgi',
        data: {
            'cmd': 'check_spelling',
            'customerid': "1%3AWvF0D4-UtPqN1-43nkD4-NKvUm2-daQqk3-LmNiI-z7Ysb4-mwry24-T8YrS3-Q2tpq2",
            'run_mode': 'web_service',
            'format': 'json',
            'out_type': 'words',
            'version': '1.0',
            'slang': slang,
            'text': forms.join(",")
        },
        success: onSuccess,
        error: onError
    });
}

function getSpeller(language) {
    if(language === 'sme') {
        return spellDivvun;
        // return spellFake;
    }
    else {
        // TODO: apy-based spellers for apertium langs?
        return spellDivvun;
    }
};

function spell(unks, language) {
    console.log("spell");
    var forms = unique(unks.map(function(_i, w) {
        return $(w).text();
    }));
    var handleSuggestions = function (data) {
        var suggmap = {};
        for(var i in data) {
            if(data[i].suggestions.length > 0) {
                suggmap[data[i].word] = data[i];
            }
        }
        unks.each(function(_i, w){
            var ww = $(w),
                form = ww.text(),
                d = suggmap[form];
            if(d === undefined || (!d.suggestions)) {
                return;
            }
            ww.data('spelling', d);
            ww.addClass('hasSuggestion');
            ww.tooltip({
                title: getDynamicLocalization('Click_To_Spell'),
                placement:"top"
            });
            ww.on('click', clickSpellingSuggestion); // or on 'contextmenu'?
        });
        clickSpellingSuggestionFirstTime(unks);
    };
    if(forms.length > 0) {
        spellCached(forms, language, handleSuggestions, console.log);
        spellUncached(forms, language, handleSuggestions, console.log);
    }
    $("body").click(hideSpellingMenu);
    $(function () { $('[data-toggle="tooltip"]').tooltip(); });
}


/* Educate the first-time user about the possibility of spelling: */
function clickSpellingSuggestionFirstTime(unks) {
    // Don't do this if we can't store that we've done it
    if(store.able() && !store.get('spellingShownMenuOnce', false)) {
        var withSugg = $(unks).filter('.hasSuggestion');
        if(withSugg.length >= 1) {
            var first = withSugg[0];
            first.click();
            store.set('spellingShownMenuOnce', true);
        }
    }
}

var spellXHR = null;

function spellUncached(forms, language, onSuccess, onError) {
    var speller = getSpeller(language);
    var uncachedForms = $.grep(forms, function (form, _i){
        return !readCacheSuggestions(form, language);
    });
    var handleSuggestionsCaching = function(data) {
        onSuccess(data);
        var suggmap = {};
        $.map(data, function(s, _i) {
            if(s.suggestions.length > 0) {
                suggmap[s.word] = s;
            }
        });
        $.map(uncachedForms, function(f, _i) {
            // The server reply doesn't include known/suggestionless
            // words – but we want to cache that they are known
            var s = suggmap[f] || { word: f, suggestions: [] };
            cacheSuggestions(f, s, language);
        });
    };
    if(uncachedForms.length > 0) {
        if(spellXHR != null) {
            // We only ever want to have the latest check results:
            spellXHR.abort();
        }
        spellXHR = speller(uncachedForms, language, handleSuggestionsCaching, onError);
    }
}

function clickSpellingSuggestion(ev) {
    ev.preventDefault();
    var spelling = $(this).data('spelling');
    var spanoff = $(this).offset();
    var newoff = { top:  spanoff.top+20,
                   left: spanoff.left };
    var menu = $('#spellingMenu');
    var at_same_err = menu.offset().top == newoff.top && menu.offset().left == newoff.left;
    if(menu.is(":visible") && at_same_err) {
        hideSpellingMenu();
    }
    else {
        menu.show();
        menu.offset(newoff);
        if(!at_same_err) {
            makeSpellingMenu(this, spelling);
        }
    }
    return false;
}

var hideSpellingMenu = function()/*:void*/
{
  var menu = $('#spellingMenu');
  menu.offset({top:0, left:0}); // avoid some potential bugs with misplacement
  menu.hide();
};

function makeSpellingMenu(node, spelling) {
    $("#spellingTable").empty();
    var tbody = $('<tbody />').attr("role", "listbox");
    spelling.suggestions.map(function(sugg){
        var a_rep = $('<a />')
            .text(sugg)
            .attr("role", "option");
        var td_rep = $('<td />')
            .addClass("spellingSuggestion")
            .append(a_rep)
            .click( // has to be on td since <a> doesn't fill the whole td
                {
                    word: node,
                    suggestion: sugg
                },
                pickSpellingSuggestion);
        var tr_rep = $('<tr />')
            .append(td_rep);
        tbody.append(tr_rep);
    });
    $("#spellingTable").append(tbody);
    sendEvent('translator', 'showSpelling', $(node).text());
};

function pickSpellingSuggestion(args) {
    hideSpellingMenu();
    var origtxt = $('#originalText').val(),
        sugg = args.data.suggestion,
        outIndex = $(args.data.word).data('index'),
        inWord = $(args.data.word).text(),
        pos = -1,
        best = -1;
    sendEvent('translator', 'pickSpelling', inWord + '::' + sugg);
    while((pos = origtxt.indexOf(inWord, pos)) != -1) {
        best = pos;
        if(best > outIndex) {
            break;
        }
        ++pos;
    }
    if(best != -1) {
        var replaced = origtxt.substr(0, best) + sugg + origtxt.substr(best+inWord.length);
        $('#originalText').val(replaced);
        translateText();
    }
    else {
        console.log("Couldn't find inWord", inWord, " in #originalText", origtxt, "for suggestion", sugg, "near", outIndex);
    }
}

/*:: export {insertWithSpelling} */
/*:: import {partition, unique} from ./util.js */
/*:: import {getDynamicLocalization} from ./localization.js */
/*:: import {readCache, cache, store} from "./persistence.js" */
