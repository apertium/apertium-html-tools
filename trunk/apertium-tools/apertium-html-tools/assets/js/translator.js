var pairs = new Array();
var curr_pair = new Object();
var srcLangs = new Array();
var dstLangs = new Array();
var grayedOuts = new Array();
var isDetecting = false;
var localizedLanguageNames = new Object();

$(document).ready(function () {
    curr_pair.srcLang = "";
    curr_pair.dstLang = "";

    $("#textAreaId").keyup(function (event) {
        if (event.keyCode == 32 || event.keyCode == 190 || event.keyCode == 191 || event.keyCode == 49 || event.keyCode == 59 || event.keyCode == 13) {
            try {
                if (curr_pair.srcLang.indexOf("Detect") != -1)
                    isDetecting = true;

                if (isDetecting) {
                    curr_pair.srcLang = detectLanguage($(this).val());
                    curr_pair.srcLang = abbreviations[curr_pair.srcLang];
                    $('#selectFrom em').html(curr_pair.srcLang);
                }

            } catch (e) {
                console.log(e.message);
            }

            translate(curr_pair, $('#textAreaId').val());
            return false;
        }
    });

    $("#inputBox").submit(function () {
        try {
            try {
                if (curr_pair.srcLang.indexOf("Detect") != -1) {
                    curr_pair.srcLang = detectLanguage($(this).val());
                    curr_pair.srcLang = abbreviations[curr_pair.srcLang];
                    $('#selectFrom em').html(curr_pair.srcLang);
                }
            } catch (e) {
                console.log(e.message);
            }

            translate(curr_pair, $('#textAreaId').val());
            return false;
        } catch (e) {
            console.log(e.message);
        }
    });

    $('#dropDownSub').hide();

    var FromOrTo;

    $('#swapLanguages').click(function () {
        fromText = $('#selectFrom em').text();
        toText = $('#selectTo em').text();
        $('#selectTo em').html(fromText);
        $('#selectFrom em').html(toText);

        curr_pair.dstLang = fromText;
        curr_pair.srcLang = toText;
    });

    $('#selectTo').click(function () {
        loler = localizedLanguageNames[curr_pair.srcLang] + "|";
        aaa = 0;
        for (it in window.pairs) {
            if (window.pairs[it].indexOf(loler) != -1) {
                grayedOuts[aaa] = window.pairs[it].split('|')[1];
                aaa++;
            }
        }
    });
    
    $('#localeSelect').change(localizeLanguageNames);
    getPairs();
});

$(document).click(function () {
    $('#dropDownSub').hide();
});

function localizeLanguageNames(callback) {
    var locale = $('#localeSelect').val();
    $.ajax({
        url: APY_URL + '/listLanguageNames?locale=' + locale + '&languages=' + srcLangs.concat(dstLangs).join('+'),
        type: "GET",
        success: function (data) {
            var srcLangCode = localizedLanguageNames[curr_pair.srcLang], dstLangCode = localizedLanguageNames[curr_pair.dstLang];
            
            localizedLanguageNames = data;
            $.each(data, function(key, value) { localizedLanguageNames[value] = key });
            
            if(srcLangCode) {
                $('#selectFrom em').html(localizedLanguageNames[srcLangCode]);
                curr_pair.srcLang = localizedLanguageNames[srcLangCode];
            }
            if(dstLangCode) {
                $('#selectTo em').html(localizedLanguageNames[dstLangCode]);
                curr_pair.dstLang = localizedLanguageNames[dstLangCode];
            }
           
            populateTranslationList("#column-group-", srcLangs);
        },
        dataType: 'jsonp',
        failure: function () {
            localizedLanguageNames = {};
        },
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
}

function translate(langPair, text) {
    langpairer = localizedLanguageNames[$.trim(langPair.srcLang)] + "|" + localizedLanguageNames[$.trim(langPair.dstLang)];

    $.ajax({
        url: APY_URL + '/translate',
        type: "GET",
        data: {
            'langpair': langpairer,
            'q': text,
        },
        success: function (dt) {
            if (dt.responseStatus == 200)
                $('#translationTest').html(dt.responseData.translatedText);
            else
                trad_fail();
        },
        dataType: 'jsonp',
        failure: trad_fail,
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });

}

function getPairs() {
    $.ajax({
        url: APY_URL + '/listPairs',
        type: "GET",
        success: trad_ok,
        dataType: 'jsonp',
        failure: trad_fail,
        beforeSend: ajaxSend,
        complete: ajaxComplete
    });
}

function trad_fail(dt) {
    $('#translationTest').html("Translation not yet available!");
}

function trad_ok(dt) {
    if (dt.responseStatus == 200) {
        $('#translationTest').html(" ");
        all = dt.responseData;

        for (var i in all) {
            l = all[i].sourceLanguage + '|' + all[i].targetLanguage;
            window.pairs[i] = l;
            srcLangs[i] = all[i].sourceLanguage;
            srcLangs = $.unique(srcLangs);
            
            dstLangs[i] = all[i].targetLanguage;
            dstLangs = $.unique(dstLangs);
        }
        localizeLanguageNames();
    }
    else
        trad_fail();
}

function populateTranslationList(elementClass, langArr) {
    $(".column-group").html("");
    $("#column-group-1").append("<span> <a href='#' class='language-selected' > Detect Language </a></span>");

    column_num = 1;
    for (it in langArr) {
        $(elementClass + column_num).append("<span> <a href='#' class='language-selected' > " + getLangByCode(langArr[it], localizedLanguageNames) + " </a></span>");
        if ($(elementClass + column_num).children().length > 5)
            column_num++;
    }

    for (it in grayedOuts)
        $("a:contains( " + localizedLanguageNames[grayedOuts[it]] + " )").removeClass('language-selected');

    $('.itemSelect').toggle(function () {
        $('.column-group').removeClass('language-selected');

        if ($(this).attr("id") == "selectFrom") {
            populateTranslationList("#column-group-", srcLangs);

            FromOrTo = "from";
            $('#dropDownSub').hide();
            $('#dropDownSub').addClass('selectFromSub');
            $('#dropDownSub').css('margin-left', 00);

        } else {
            populateTranslationList("#column-group-", dstLangs);

            FromOrTo = "to";
            $('#dropDownSub').hide();
            $('#dropDownSub').css('margin-left', 287);
            $('#dropDownSub').removeClass('selectFromSub');
            //$('#dropDownSub a').addClass('language-selected');
        }

        $('#dropDownSub').show();

    }, function () {
        $('#dropDownSub').hide()
    });

    $('#dropDownSub a').click(function () {
        $('#dropDownSub a').removeClass('language-selected');
        $(this).addClass('language-selected');

        if (FromOrTo == "from") {
            if ($(this).text() != " Detect Language ")
                isDetecting = false;

            $('#selectFrom em').html($(this).text());
            curr_pair.srcLang = $(this).text();

        } else {
            $('#selectTo em').html($(this).text());
            curr_pair.dstLang = $(this).text();
        }
        matchFound = false;

        //FIXME: if (curr_pair in window.pairs) ??
        for (var it in window.pairs)
            if (parsePair_lol(curr_pair) == window.pairs[it]) matchFound = true;

        if (matchFound) {
            try {
                if (curr_pair.srcLang.indexOf("Detect") != -1) {
                    curr_pair.srcLang = detectLanguage($(this).val());
                    curr_pair.srcLang = abbreviations[curr_pair.srcLang];
                    $('#selectFrom em').html(curr_pair.srcLang);
                }

            } catch (e) {
                console.log(e.message);
            }

            translate(curr_pair, $('#textAreaId').val());
        }
        else $('#translationTest').html("Translation not yet available!");
    });
}

function parsePair_lol(pr) {
    parsedPair = null;
    pr.srcLang = $.trim(pr.srcLang);
    pr.dstLang = $.trim(pr.dstLang);

    parsedPair = pr.srcLang;
    parsedPair += "|" + pr.dstLang;
    return parsedPair;
}