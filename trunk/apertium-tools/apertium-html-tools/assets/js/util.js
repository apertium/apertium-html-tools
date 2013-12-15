var APY_URL = '//localhost:2737';
var languages = {'gd': 'Gàidhlig', 'rn': 'Ikirundi', 'ga': 'Gaeilge', 'os': 'ирон', 'ca': 'català', 'el': 'Ελληνικά', 'eo': 'esperanto', 'en': 'English', 'gv': 'Gaelg', 'es': 'español', 'sv': 'svenska', 'eu': 'euskara', 'et': 'eesti', 'ia': 'interlingua', 'cs': 'čeština', 'ko': '한국어', 'zu': 'isiZulu', 'pt': 'português', 'pa': 'ਪੰਜਾਬੀ', 'id': 'Bahasa Indonesia', 'as': 'অসমীয়া', 'ar': 'العربية', 'kk': 'қазақ тілі', 'si': 'සිංහල', 'mr': 'मराठी', 'tr': 'Türkçe', 'mt': 'Malti', 'pl': 'polski', 'az': 'azərbaycan', 'mk': 'македонски', 'af': 'Afrikaans', 'ml': 'മലയാളം', 'th': 'ไทย', 'ro': 'română', 'sk': 'slovenčina', 'tg': 'Тоҷикӣ', 'ky': 'кыргызча', 'te': 'తెలుగు', 'vi': 'Tiếng Việt', 'is': 'íslenska', 'rm': 'rumantsch', 'mfe': 'kreol morisien', 'fa': 'فارسی', 'bn': 'বাংলা', 'fo': 'føroyskt', 'be': 'беларуская', 'fi': 'suomi', 'da': 'dansk', 'xh': 'isiXhosa', 'ur': 'اردو', 'ru': 'русский', 'fr': 'français', 'it': 'italiano', 'zh': '中文', 'br': 'brezhoneg', 'bg': 'български', 'nl': 'Nederlands', 'lg': 'Luganda', 'hi': 'हिंदी', 'de': 'Deutsch', 'lt': 'lietuvių', 'lo': 'ລາວ', 'sq': 'Shqip', 'uz': 'oʻzbekcha', 'sw': 'Kiswahili', 'cy': 'Cymraeg', 'he': 'עברית', 'lv': 'latviešu', 'nn': 'nynorsk', 'hy': 'հայերեն', 'se': 'davvisámegiella', 'sl': 'slovenščina', 'ne': 'नेपाली', 'uk': 'українська', 'nb': 'norsk bokmål', 'hu': 'magyar', 'tt': 'татарча'};
var iso639Codes = {"abk":"ab","aar":"aa","afr":"af","aka":"ak","sqi":"sq","amh":"am","ara":"ar","arg":"an","hye":"hy","asm":"as","ava":"av","ave":"ae","aym":"ay","aze":"az","bam":"bm","bak":"ba","eus":"eu","bel":"be","ben":"bn","bih":"bh","bis":"bi","bos":"bs","bre":"br","bul":"bg","mya":"my","cat":"ca","cha":"ch","che":"ce","nya":"ny","zho":"zh","chv":"cv","cor":"kw","cos":"co","cre":"cr","hrv":"hr","ces":"cs","dan":"da","div":"dv","nld":"nl","dzo":"dz","eng":"en","epo":"eo","est":"et","ewe":"ee","fao":"fo","fij":"fj","fin":"fi","fra":"fr","ful":"ff","glg":"gl","kat":"ka","deu":"de","ell":"el","grn":"gn","guj":"gu","hat":"ht","hau":"ha","heb":"he","her":"hz","hin":"hi","hmo":"ho","hun":"hu","ina":"ia","ind":"id","ile":"ie","gle":"ga","ibo":"ig","ipk":"ik","ido":"io","isl":"is","ita":"it","iku":"iu","jpn":"ja","jav":"jv","kal":"kl","kan":"kn","kau":"kr","kas":"ks","kaz":"kk","khm":"km","kik":"ki","kin":"rw","kir":"ky","kom":"kv","kon":"kg","kor":"ko","kur":"ku","kua":"kj","lat":"la","ltz":"lb","lug":"lg","lim":"li","lin":"ln","lao":"lo","lit":"lt","lub":"lu","lav":"lv","glv":"gv","mkd":"mk","mlg":"mg","msa":"ms","mal":"ml","mlt":"mt","mri":"mi","mar":"mr","mah":"mh","mon":"mn","nau":"na","nav":"nv","nob":"nb","nde":"nd","nep":"ne","ndo":"ng","nno":"nn","nor":"no","iii":"ii","nbl":"nr","oci":"oc","oji":"oj","chu":"cu","orm":"om","ori":"or","oss":"os","pan":"pa","pli":"pi","fas":"fa","pol":"pl","pus":"ps","por":"pt","que":"qu","roh":"rm","run":"rn","ron":"ro","rus":"ru","san":"sa","srd":"sc","snd":"sd","sme":"se","smo":"sm","sag":"sg","srp":"sr","gla":"gd","sna":"sn","sin":"si","slk":"sk","slv":"sl","som":"so","sot":"st","azb":"az","spa":"es","sun":"su","swa":"sw","ssw":"ss","swe":"sv","tam":"ta","tel":"te","tgk":"tg","tha":"th","tir":"ti","bod":"bo","tuk":"tk","tgl":"tl","tsn":"tn","ton":"to","tur":"tr","tso":"ts","tat":"tt","twi":"tw","tah":"ty","uig":"ug","ukr":"uk","urd":"ur","uzb":"uz","ven":"ve","vie":"vi","vol":"vo","wln":"wa","cym":"cy","wol":"wo","fry":"fy","xho":"xh","yid":"yi","yor":"yo","zha":"za","zul":"zu"}
var languagesInverse = {}, iso639CodesInverse = {};

function ajaxSend() {
    $("#loading-indicator").show(); 
}

function ajaxComplete() { 
    $("#loading-indicator").hide(); 
}

$(document).ajaxSend(ajaxSend);
$(document).ajaxComplete(ajaxComplete);

$(document).ready(function() {
    if(!parent.location.hash || !$(parent.location.hash + 'Container'))
        parent.location.hash = '#translation';
    $('.modeContainer' + parent.location.hash + 'Container').show();
    $('.nav li > a[data-mode=' +  parent.location.hash.substring(1) + ']').parent().addClass('active');

    $('.nav a').click(function () {
        var mode = $(this).data('mode');
        $('.nav li').removeClass('active');
        $(this).parent('li').addClass('active');
        $('.modeContainer:not(#' + mode + 'Container)').hide({ queue: false });
        $('#' + mode + 'Container').show({ queue: false }); 
    });
    $.each(languages, function(key, value) { languagesInverse[value] = key });
    $.each(iso639Codes, function(key, value) { iso639CodesInverse[value] = key });
});

function formatModes(modes) {
    var modesArr = [], toReturn = []
    for(var val in modes)
        modesArr.push(val);
    for(var val in modes) {
        if(val.indexOf('-') === -1)
            toReturn.push([val, val]);
        else {
            var mode = val.split('-')[0];
            if(modesArr.indexOf(mode) === -1)
                toReturn.push([val, mode]);
            else
                toReturn.push([val, mode + ' (' + val + ')']);
        }   
    }
    return toReturn;
}

function getLangByCode(code, localizedLanguageNames) {
    code = code.trim();
    if(localizedLanguageNames[code])
        return localizedLanguageNames[code];
    else if(languages[code])
        return languages[code]
    else if(iso639Codes[code] && languages[iso639Codes[code]])
        return languages[iso639Codes[code]]
    else
        return code;
}

function getCodeByLang(lang, localizedLanguageCodes) {
    lang = lang.trim();
    if(localizedLanguageCodes[lang])
        return localizedLanguageCodes[lang];
    else if(languagesInverse[lang] && !iso639CodesInverse[languagesInverse[lang]])
        return languagesInverse[lang];
    else if(languagesInverse[lang] && iso639CodesInverse[languagesInverse[lang]]) {
        if(pairs.join('|').split('|').indexOf(iso639CodesInverse[languagesInverse[lang]]) != -1)
            return iso639CodesInverse[languagesInverse[lang]];
        else
            return languagesInverse[lang];
    }
    else
        return lang;
}
