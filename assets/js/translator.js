/* @flow */

var pairs = {}, chainedPairs = {}, originalPairs = pairs;
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];
var droppedFile;
var curPaths = [], chosenPath = [];
var svg, simulation, width = 800, height = 550, nodeSize = 20, nodeTextY = 5;
var srcLinkPadding = 1.8, dstLinkPadding = 1.8;
var srcNodeX = 0.3, srcNodeY = 0.6, dstNodeX = 0.7, dstNodeY = 0.6;
var translateRequest;

var UPLOAD_FILE_SIZE_LIMIT = 32E6,
    TRANSLATION_LIST_BUTTONS = 3,
    TRANSLATION_LIST_WIDTH = 650,
    TRANSLATION_LIST_ROWS = 8,
    TRANSLATION_LIST_COLUMNS = 4,
    TRANSLATION_LISTS_BUFFER = 50;

var INSTANT_TRANSLATION_URL_DELAY = 500,
    INSTANT_TRANSLATION_PUNCTUATION_DELAY = 1000,
    INSTANT_TRANSLATION_DELAY = 3000;

var PUNCTUATION_KEY_CODES = [46, 33, 58, 63, 47, 45, 190, 171, 49]; // eslint-disable-line no-magic-numbers

/* exported getPairs */
/* global config, modeEnabled, synchronizeTextareaHeights, persistChoices, getLangByCode, sendEvent, onlyUnique, restoreChoices
    getDynamicLocalization, locale, ajaxSend, ajaxComplete, localizeInterface, filterLangList, cache, readCache, iso639Codes,
    callApy, apyRequestTimeout, isURL */
/* global SPACE_KEY_CODE, ENTER_KEY_CODE, HTTP_OK_CODE, XHR_LOADING, XHR_DONE, HTTP_OK_CODE, HTTP_BAD_REQUEST_CODE */
/* global $bu_getBrowser */

if(modeEnabled('translation')) {
    $(document).ready(function () {
        function updatePairList() {
            pairs = $('input#chainedTranslation').prop('checked') ? chainedPairs : originalPairs;
        }

        function setupTextTranslation() {
            synchronizeTextareaHeights();

            $('#markUnknown').change(function () {
                if($('div#translateText').is(':visible')) {
                    translateText();
                }
                persistChoices('translator');
            });

            $('.clearButton').click(function () {
                $('#originalText, #translatedText').val('');
                $('#originalText').focus();
                synchronizeTextareaHeights();
            });

            $(window).resize(synchronizeTextareaHeights);

            $('#originalText').blur(function () {
                persistChoices('translator', true);
            });

            $('#originalText').on('input propertychange', function () {
                var disableDetect = this.value === '';
                $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', disableDetect);
                $('#detect').toggleClass('disabledLang', disableDetect);

                persistChoices('translator');
            });
        }

        function setupWebpageTranslation() {
            $('button#showTranslateWebpage').click(function () {
                showTranslateWebpageInterface($('#originalText').val().trim(), true);
            });

            $('button#cancelTranslateWebpage').click(function () {
                if(translateRequest) {
                    translateRequest.abort();
                    clearTimeout(apyRequestTimeout);
                }

                $('input#webpage').attr({
                    'required': false,
                    'novalidate': true
                });

                $('div#translateWebpage').fadeOut('fast', function () {
                    $('button#cancelTranslateWebpage').fadeOut('fast', function () {
                        $('#srcLangSelectors').removeClass('col-sm-9').addClass('col-sm-11');
                    });
                    $('div#translateText').fadeIn('fast', function () {
                        synchronizeTextareaHeights();
                    });
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
                    $('#detect').removeClass('disabledLang');
                });

                $('#translationTarget').attr('href', '#translation');
                window.location.hash = 'translation';
            }).removeClass('cancelTranslateWebpage');

            $('input#webpage').keyup(function (ev) {
                if(ev.keyCode === ENTER_KEY_CODE && isURL($('input#webpage').val())) {
                    translate();
                    return false;
                }
            });
        }

        function setupDocTranslation() {
            $('button#translateDoc').click(function () {
                $('div#translateText').fadeOut('fast', function () {
                    $('#fileInput').show();
                    $('div#fileName').hide();
                    $('div#docTranslation').fadeIn('fast');
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', true);
                    $('#detect').addClass('disabledLang');
                });
                pairs = originalPairs;
                populateTranslationList();
            });

            $('button#cancelDocTranslate').click(function () {
                droppedFile = undefined;
                $('div#docTranslation').fadeOut('fast', function () {
                    $('a#fileDownload').hide();
                    $('span#uploadError').hide();
                    $('div#translateText').fadeIn('fast', synchronizeTextareaHeights);
                    $('input#fileInput').wrap('<form>').closest('form')[0].reset();
                    $('input#fileInput').unwrap();
                    $('#detect, #srcLangSelect option[value="detect"]').prop('disabled', false);
                    $('#detect').removeClass('disabledLang');
                });
                updatePairList();
                populateTranslationList();
            });

            $('input#fileInput').change(function () {
                $('div#fileUploadProgress').parent().fadeOut('fast', function () {
                    $('span#uploadError').fadeOut('fast');
                });
                $('a#fileDownload').fadeOut('fast');
            });

            $('body')
                .on('dragover', function (ev) {
                    ev.preventDefault();
                    return false;
                })
                .on('dragenter', function (ev) {
                    ev.preventDefault();
                    if(!$('div#fileDropBackdrop:visible').length) {
                        $('div#fileDropBackdrop').fadeTo('fast', 0.5);
                        $('div#fileDropMask').on('drop', function (ev) {
                            ev.preventDefault();
                            droppedFile = ev.originalEvent.dataTransfer.files[0];

                            $('#fileDropBackdrop').fadeOut();
                            if(!$('div#docTranslation').is(':visible')) {
                                $('div#translateText').fadeOut('fast', function () {
                                    $('input#fileInput').hide();
                                    $('div#docTranslation').fadeIn('fast');

                                    if(droppedFile) {
                                        $('div#fileName').show().text(droppedFile.name);
                                        translateDoc();
                                    }
                                });
                            }
                            else {
                                $('input#fileInput').fadeOut('fast', function () {
                                    if(droppedFile) {
                                        $('div#fileName').show().text(droppedFile.name);
                                        translateDoc();
                                    }
                                });
                            }

                            return false;
                        });
                        $('div#fileDropMask').on('dragleave', function () {
                            $('div#fileDropBackdrop').fadeOut();
                        });
                    }
                    return false;
                });
        }

        function setupLanguageSelectors() {
            $('.swapLangBtn').click(function () {
                var srcCode = $('.srcLang.active').attr('data-code'), dstCode = $('.dstLang.active').attr('data-code');
                curSrcLang = dstCode;
                curDstLang = srcCode;

                if(recentSrcLangs.indexOf(curSrcLang) !== -1) {
                    $('.srcLang').removeClass('active');
                    $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
                }
                else {
                    recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;
                }
                $('#srcLangSelect').val(curSrcLang);

                if(recentDstLangs.indexOf(curDstLang) !== -1) {
                    $('.dstLang').removeClass('active');
                    $('#dstLang' + (recentDstLangs.indexOf(curDstLang) + 1)).addClass('active');
                }
                else {
                    recentDstLangs[recentDstLangs.indexOf(dstCode)] = curDstLang;
                }
                $('#dstLangSelect').val(curDstLang);

                refreshLangList(true);
                muteLanguages();
                refreshChosenPath();
                refreshChainGraph();

                if($('.active > #detectedText')) {
                    $('.srcLang').removeClass('active');
                    $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
                }
            });

            $('#srcLangSelect').change(function () {
                var selectValue = $(this).val();
                if(selectValue === 'detect') {
                    $.when(detectLanguage()).done(translateText);
                }
                else {
                    handleNewCurrentLang(curSrcLang = $(this).val(), recentSrcLangs, 'srcLang', true);
                    autoSelectDstLang();
                    refreshChosenPath();
                    refreshChainGraph();
                }
            });

            $('#dstLangSelect').change(function () {
                handleNewCurrentLang(curDstLang = $(this).val(), recentDstLangs, 'dstLang', true);
                refreshChosenPath();
                refreshChainGraph();
            });

            $('#srcLanguages').on('click', '.languageName:not(.text-muted)', function () {
                curSrcLang = $(this).attr('data-code');
                handleNewCurrentLang(curSrcLang, recentSrcLangs, 'srcLang');
                autoSelectDstLang();
                refreshChosenPath();
                refreshChainGraph();
            });

            $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
                curDstLang = $(this).attr('data-code');
                handleNewCurrentLang(curDstLang, recentDstLangs, 'dstLang');
                refreshChosenPath();
                refreshChainGraph();
            });

            $('.srcLang:not(#detect)').click(function () {
                curSrcLang = $(this).attr('data-code');
                $('.srcLang').removeClass('active');
                $(this).addClass('active');
                populateTranslationList();
                refreshLangList(true);
                muteLanguages();
                localizeInterface();
                autoSelectDstLang();
                refreshChainGraph();
                refreshChosenPath();
                translate();
            });

            $('.dstLang').click(function () {
                curDstLang = $(this).attr('data-code');
                $('.dstLang').removeClass('active');
                $(this).addClass('active');
                refreshLangList();
                muteLanguages();
                localizeInterface();
                refreshChainGraph();
                refreshChosenPath();
                translate();
            });

            $('#detect').click(function () {
                $('.srcLang').removeClass('active');
                $(this).addClass('active');
                $.when(detectLanguage()).done(translateText);
            });
        }

        function getChainedDstLangs(srcLang) {
            var targets = [];
            var targetsSeen = {};
            targetsSeen[srcLang] = true;
            var targetLists = [pairs[srcLang]];

            while(targetLists.length > 0) {
                $.each(targetLists.pop(), function (i, trgt) {
                    if(!targetsSeen[trgt]) {
                        targets.push(trgt);
                        if(pairs[trgt]) {
                            targetLists.push(pairs[trgt]);
                        }
                        targetsSeen[trgt] = true;
                    }
                });
            }

            return targets;
        }

        if(config.TRANSLATION_CHAINING) {
            $('.chaining').show();
            $.each(pairs, function (srcLang, _dstLangs) {
                chainedPairs[srcLang] = getChainedDstLangs(srcLang);
            });
            updatePairList();
            populateTranslationList();
        }

        $('.translateBtn').click(function () {
            translate();
            persistChoices('translator', true);
        });

        $('#chooseChain').toggleClass('hide', !$('#chainedTranslation').prop('checked'));
        $('input#chainedTranslation').change(function () {
            updatePairList();
            populateTranslationList();
            persistChoices('translator');
            $('#chooseChain').toggleClass('hide', !$('#chainedTranslation').prop('checked'));
        });

        var timer, lastPunct = false;
        $('#originalText').on('keyup paste', function (event) {
            if(lastPunct && (event.keyCode === SPACE_KEY_CODE || event.keyCode === ENTER_KEY_CODE)) {
                // Don't override the short timeout for simple space-after-punctuation
                return;
            }

            if(timer && $('#instantTranslation').prop('checked')) {
                clearTimeout(timer);
            }

            var timeout;
            if(PUNCTUATION_KEY_CODES.indexOf(event.keyCode) !== -1) {
                timeout = INSTANT_TRANSLATION_PUNCTUATION_DELAY;
                lastPunct = true;
            }
            else if(isURL($('#originalText').val())) {
                timeout = INSTANT_TRANSLATION_URL_DELAY;
                lastPunct = false;
            }
            else {
                timeout = INSTANT_TRANSLATION_DELAY;
                lastPunct = false;
            }

            timer = setTimeout(function () {
                if($('#instantTranslation').prop('checked')) {
                    translate();
                }
                persistChoices('translator', true);
            }, timeout);

            synchronizeTextareaHeights();
        });

        $('#instantTranslation').change(function () {
            persistChoices('translator');
        });

        setupLanguageSelectors();
        setupTextTranslation();
        setupWebpageTranslation();
        setupDocTranslation();
        initChainGraph();
    });
}

function initChainGraph() {
    var choose = d3.select('#chooseModalBody');
    svg = choose
        .append('svg')
        .attr('width', width.toString() + 'px')
        .attr('height', height.toString() + 'px');
    choose.append('br');
    choose.append('div').attr('id', 'validPaths')
        .append('b')
            .text('Valid Paths:')
            .append('br');

    /* eslint-disable no-magic-numbers */
    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');

    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'start-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 4)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', '#999');

    simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function (d) { return d.id; }).distance(nodeSize * 10))
        .force('charge', d3.forceManyBody().strength(-700))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .alphaDecay(0.018);
    /* eslint-enable no-magic-numbers */

    refreshChainGraph();
}

function boundary(dist, max) {
    if(dist < nodeSize) return nodeSize;
    if(dist < max - nodeSize) return dist;
    return max - nodeSize;
}

function paths(src, trgt, curPath, seens) {
    if(!originalPairs[src]) return [];
    var rets = [];
    var i, j;
    for(i = 0; i < originalPairs[src].length; i++) {
        var lang = originalPairs[src][i];
        var newPath = curPath.slice();
        newPath.push(lang);
        var oldSeens = $.extend(true, {}, seens);
        if(lang === trgt) rets.push(newPath);
        else if(!(lang in seens)) {
            seens[lang] = [];
            var recurse = paths(lang, trgt, newPath, seens);
            for(j = 0; j < recurse.length; j++) {
                rets.push(recurse[j]);
                seens[lang].push(recurse[j].slice(recurse[j].indexOf(lang)));
            }
        }
        else {
            for(j = 0; j < seens[lang].length; j++) {
                rets.push(newPath.concat(seens[lang][j]));
            }
        }
        // eslint-disable-line no-param-reassign
        seens = oldSeens;
    }
    return rets;
}

function displayPaths(paths) {
    var graph = {};
    var arrows = {};
    var nodes = [];
    var ids = [];
    var source = paths[0][0];
    var target = paths[0][paths[0].length - 1];
    var i = 0;
    for(i = 0; i < paths.length; i++) {
        var oldLang = undefined;
        for(var j = 0; j < paths[i].length; j++) {
            var lang = paths[i][j];
            if(ids.indexOf(lang) === -1) {
                if(lang === source) nodes.push({'id': lang, 'fx': srcNodeX * width, 'fy': srcNodeY * height});
                else if(lang === target) nodes.push({'id': lang, 'fx': dstNodeX * width, 'fy': dstNodeY * height});
                else nodes.push({'id': lang});
                ids.push(lang);
            }
            if(oldLang !== undefined) {
                if(arrows[oldLang] === undefined) {
                    arrows[oldLang] = [];
                }
                if(arrows[oldLang].indexOf(lang) === -1) {
                    arrows[oldLang].push(lang);
                }
            }
            oldLang = lang;
        }
    }

    graph.nodes = nodes;
    graph.links = [];
    Object.keys(arrows).forEach(function (src) {
        arrows[src].forEach(function (trgt) {
            if(arrows[trgt] && arrows[trgt].indexOf(src) !== -1) {
                graph.links.push({'source': src, 'target': trgt, 'right': true, 'left': true});
                arrows[trgt].splice(arrows[trgt].indexOf(src), 1);
            }
            else {
                graph.links.push({'source': src, 'target': trgt, 'right': true});
            }
        });
    });

    var link = svg.append('g')
        .attr('class', 'links')
      .selectAll('path')
      .data(graph.links)
      .enter()
      .append('path')
      .style('marker-start', function (d) { return d.left ? 'url(#start-arrow)' : ''; })
      .style('marker-end', function (d) { return d.right ? 'url(#end-arrow)' : ''; })
      .attr('id', function (d) { return d.source + '-' + d.target; })
      .classed('some_path', false)
      .classed('all_path', false);

    var node = svg.append('g')
        .attr('class', 'nodes')
      .selectAll('g')
      .data(graph.nodes)
      .enter()
      .append('g');

    var circ = node.append('circle');
    circ
        .attr('r', nodeSize)
        .attr('id', function (d) { return d.id; })
        .classed('endpoint', function (d) { return (d.id === source || d.id === target); })
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded))
        .on('click', nodeClicked)
        .append('title')
            .text(function (d) { return d.id; });
    node
        .append('text')
        .attr('class', 'langs')
        .attr('dy', nodeTextY)
        .text(function (d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on('tick', ticked);

    simulation
        .force('link')
        .links(graph.links);

    var text = node.selectAll('text');
    function ticked() {
        circ
            .attr('cx', function (d) {
                d.x = boundary(d.x, width);
                d.y = boundary(d.y, height);
                return d.x;
            })
            .attr('cy', function (d) { return d.y; });
        text
            .attr('x', function (d) { return boundary(d.x, width); })
            .attr('y', function (d) { return boundary(d.y, height); });
        link.attr('d', function (d) {
            var srcx = boundary(d.source.x, width),
                srcy = boundary(d.source.y, height),
                trgtx = boundary(d.target.x, width),
                trgty = boundary(d.target.y, height);
            var deltaX = trgtx - srcx,
                deltaY = trgty - srcy,
                dist = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)),
                normX = deltaX / dist,
                normY = deltaY / dist,
                sourcePadding = nodeSize * srcLinkPadding,
                targetPadding = nodeSize * dstLinkPadding,
                sourceX = srcx + (sourcePadding * normX),
                sourceY = srcy + (sourcePadding * normY),
                targetX = trgtx - (targetPadding * normX),
                targetY = trgty - (targetPadding * normY);
            return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
        });
    }
}

function refreshChosenPath() {
    chosenPath = [curSrcLang, curDstLang];
    if($('input#chainedTranslation').prop('checked')) {
        $.jsonp({
            url: config.APY_URL + '/translateChain?langpairs=' + curSrcLang + '|' + curDstLang,
            beforeSend: ajaxSend,
            success: function (data) {
                chosenPath = data.responseData.translationChain;
                var i = 0;
                for(i = 0; i < chosenPath.length - 1; i++) {
                    d3.select('#' + chosenPath[i] + '-' + chosenPath[i + 1]).classed('all_path', true);
                    d3.select('#' + chosenPath[i + 1] + '-' + chosenPath[i]).classed('all_path', true);
                }
                d3.select('#validPaths')
                    .append('a')
                    .attr('data-dismiss', 'modal')
                    .text(chosenPath.join(' → ') + ' (default)');
                d3.select('#validPaths').append('br');
            },
            error: function () {
                console.error('Failed to get translation path');
                translationNotAvailable();
            },
            complete: function () {
                ajaxComplete();
            }
        });
    }
}

function refreshChainGraph() {
    if($('input#chainedTranslation').prop('checked')) {
        d3.selectAll('svg > g').remove();
        d3.selectAll('#validPaths > a').remove();
        d3.selectAll('#validPaths > br').remove();

        var tmpSeens = {};
        tmpSeens[curSrcLang] = [];
        curPaths = paths(curSrcLang, curDstLang, [curSrcLang], tmpSeens);
        displayPaths(curPaths);
        simulation.alpha(1).restart();
        d3.select('.endpoint').dispatch('click');
    }
}

function dragStarted(d) {
    // eslint-disable-next-line no-magic-numbers
    if(!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.select(this).classed('dragging', true);
    d.fx = boundary(d.x, width);
    d.fy = boundary(d.y, height);
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragEnded(d) {
    if(!d3.event.active) simulation.alphaTarget(0);
    d3.select(this).classed('dragging', false);
    if(!d3.select(this).classed('endpoint')) {
        d.fx = null;
        d.fy = null;
    }
}

function nodeClicked() {
    var curSel = !d3.select(this).classed('selected');
    d3.select(this).classed('selected', curSel);
    d3.selectAll('path').classed('some_path', false);
    d3.selectAll('path').classed('all_path', false);
    d3.selectAll('#validPaths > a').remove();
    d3.selectAll('#validPaths > br').remove();

    var highPaths = [];
    curPaths.forEach(function (d) {
        var some = false, all = true;
        for(var i = 1; i < d.length - 1; i++) {
            if(d3.select('#' + d[i]).classed('selected')) some = true;
            else all = false;
        }
        highPaths.push({'path': d, 'some': some, 'all': all});
    });
    highPaths.forEach(function (d) {
        var i;
        var path = d.path;
        if(d.some) {
            for(i = 0; i < path.length - 1; i++) {
                d3.select('#' + path[i] + '-' + path[i + 1]).classed('some_path', d.some);
                d3.select('#' + path[i + 1] + '-' + path[i]).classed('some_path', d.some);
            }
        }
        if(d.all) {
            for(i = 0; i < path.length - 1; i++) {
                d3.select('#' + path[i] + '-' + path[i + 1]).classed('all_path', d.all);
                d3.select('#' + path[i + 1] + '-' + path[i]).classed('all_path', d.all);
            }
            if(d.path.length > d3.selectAll('.selected').size() - 1) {
                d3.select('#validPaths')
                    .append('a')
                    .attr('data-dismiss', 'modal')
                    .text(d.path.join(' → '))
                    .on('click', function (a, b, validPath) {
                        chosenPath = validPath[0].text.split(' → ');
                        translate(true);
                    });
                d3.select('#validPaths').append('br');
            }
        }
    });
}

/*
function onClear(d) {
    d3.selectAll('circle').classed('selected', false);
    d3.selectAll('path').classed('some_path', false);
    d3.selectAll('path').classed('all_path', false);
}
*/

function getPairs() {
    var deferred = $.Deferred();

    if(config.PAIRS && 'responseData' in config.PAIRS) {
        handlePairs(config.PAIRS.responseData);
        deferred.resolve();
    }
    else {
        var pairData = readCache('pairs', 'LIST_REQUEST');
        if(pairData) {
            handlePairs(pairData);
            deferred.resolve();
        }
        else {
            console.warn('Translation pairs cache ' + (pairs === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=pairs',
                beforeSend: ajaxSend,
                success: function (data) {
                    handlePairs(data.responseData);
                    cache('pairs', data.responseData);
                },
                error: function () {
                    console.error('Failed to get available translation language pairs');
                    translationNotAvailable();
                },
                complete: function () {
                    ajaxComplete();
                    deferred.resolve();
                }
            });
        }
    }

    function handlePairs(pairData) {
        if(!pairData) {
            populateTranslationList();
            restoreChoices('translator');
            refreshChosenPath();
            translate(true);
            return;
        }
        $.each(pairData, function (i, pair) {
            if(config.ALLOWED_PAIRS && config.ALLOWED_PAIRS.indexOf(pair.sourceLanguage + '-' + pair.targetLanguage) === -1) {
                return;
            }
            srcLangs.push(pair.sourceLanguage);
            dstLangs.push(pair.targetLanguage);

            if(pairs[pair.sourceLanguage]) {
                pairs[pair.sourceLanguage].push(pair.targetLanguage);
            }
            else {
                pairs[pair.sourceLanguage] = [pair.targetLanguage];
            }
        });
        srcLangs = filterLangList(srcLangs.filter(onlyUnique));
        dstLangs = filterLangList(dstLangs.filter(onlyUnique));

        for(var k in pairs) {
            // Default for new users is first available pair; TODO something smart based on browser lang setting
            curSrcLang = k;
            curDstLang = pairs[k][0];
            break;
        }
        for(var i = 0; i < TRANSLATION_LIST_BUTTONS; i++) {
            recentSrcLangs.push(i < srcLangs.length ? srcLangs[i] : undefined);
            recentDstLangs.push(i < dstLangs.length ? dstLangs[i] : undefined);
        }

        populateTranslationList();
        restoreChoices('translator');
        refreshChosenPath();
        translate(true);
    }

    return deferred.promise();
}

function handleNewCurrentLang(lang, recentLangs, langType, resetDetect, noTranslate) {
    $('.' + langType).removeClass('active');
    if(recentLangs.indexOf(lang) === -1) {
        recentLangs.unshift(lang);
        $('#' + langType + '1').addClass('active');
        refreshLangList(resetDetect);
    }
    else {
        $('#' + langType + (recentLangs.indexOf(lang) + 1)).addClass('active');
        persistChoices('translator');
    }

    $('select#' + langType + 'Select').val(lang);
    if(resetDetect && recentLangs.indexOf(lang) !== -1) {
        refreshLangList(resetDetect);
    }

    populateTranslationList();
    muteLanguages();
    localizeInterface();
    if(!noTranslate) {
        refreshChosenPath();
        translate();
    }
}

function refreshLangList(resetDetect) {
    recentSrcLangs = filterLangs(recentSrcLangs, srcLangs);
    recentDstLangs = filterLangs(recentDstLangs, dstLangs);

    persistChoices('translator');

    for(var i = 0; i < TRANSLATION_LIST_BUTTONS; i++) {
        var srcBtn = $('#srcLang' + (i + 1));
        var dstBtn = $('#dstLang' + (i + 1));
        if(i < recentSrcLangs.length && recentSrcLangs[i]) {
            srcBtn.show().attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i]));
        }
        else {
            srcBtn.hide();
        }
        if(i < recentDstLangs.length && recentDstLangs[i]) {
            dstBtn.show().attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i]));
        }
        else {
            dstBtn.hide();
        }
    }

    if($('#detectedText').parent('.srcLang').attr('data-code')) {
        $('#detectedText').text(
            getLangByCode($('#detectedText').parent('.srcLang').attr('data-code')) +
            ' - ' + getDynamicLocalization('detected')
        );
    }

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }

    function filterLangs(allRecentLangs, allLangs) {
        var recentLangs = allRecentLangs.filter(onlyUnique);
        if(recentLangs.length < TRANSLATION_LIST_BUTTONS) {
            for(var i = 0; i < allLangs.length; i++) {
                if(recentLangs.length < TRANSLATION_LIST_BUTTONS && recentLangs.indexOf(allLangs[i]) === -1) {
                    recentLangs.push(allLangs[i]);
                }
            }
        }
        if(recentLangs.length > TRANSLATION_LIST_BUTTONS) {
            recentLangs = recentLangs.slice(0, TRANSLATION_LIST_BUTTONS);
        }
        return recentLangs;
    }
}

function populateTranslationList() {
    sortTranslationList();
    $('.languageName').remove();
    $('.languageCol').show().removeClass('col-sm-3 col-sm-4 col-sm-6 col-sm-12');

    var numSrcCols = Math.ceil(srcLangs.length / TRANSLATION_LIST_ROWS) < (TRANSLATION_LIST_COLUMNS + 1)
            ? Math.ceil(srcLangs.length / TRANSLATION_LIST_ROWS)
            : TRANSLATION_LIST_COLUMNS,
        numDstCols = Math.ceil(dstLangs.length / TRANSLATION_LIST_ROWS) < (TRANSLATION_LIST_COLUMNS + 1)
            ? Math.ceil(dstLangs.length / TRANSLATION_LIST_ROWS)
            : TRANSLATION_LIST_COLUMNS;

    var columnWidth = TRANSLATION_LIST_WIDTH / TRANSLATION_LIST_COLUMNS;
    var maxSrcLangsWidth = $(window).width() - $('#srcLanguagesDropdownTrigger').offset().left - TRANSLATION_LISTS_BUFFER;
    numSrcCols = Math.min(Math.floor(maxSrcLangsWidth / columnWidth), TRANSLATION_LIST_COLUMNS);
    var maxDstLangsWidth = $('#dstLanguagesDropdownTrigger').offset().left + $('#dstLanguagesDropdownTrigger').outerWidth() -
        TRANSLATION_LISTS_BUFFER;
    numDstCols = Math.min(Math.floor(maxDstLangsWidth / columnWidth), TRANSLATION_LIST_COLUMNS);

    var srcLangsPerCol = Math.ceil(srcLangs.length / numSrcCols),
        dstLangsPerCol = Math.ceil(dstLangs.length / numDstCols);

    var BOOTSTRAP_MAX_COLUMNS = 12;

    $('#srcLanguages').css('min-width', Math.floor(TRANSLATION_LIST_WIDTH * (numSrcCols / TRANSLATION_LIST_COLUMNS)) + 'px');
    $('#srcLanguages .languageCol').addClass('col-sm-' + (BOOTSTRAP_MAX_COLUMNS / numSrcCols));
    $('#srcLanguages .languageCol:gt(' + (numSrcCols - 1) + ')').hide();

    $('#dstLanguages').css('min-width', Math.floor(TRANSLATION_LIST_WIDTH * (numDstCols / TRANSLATION_LIST_COLUMNS)) + 'px');
    $('#dstLanguages .languageCol').addClass('col-sm-' + (BOOTSTRAP_MAX_COLUMNS / numDstCols));
    $('#dstLanguages .languageCol:gt(' + (numDstCols - 1) + ')').hide();

    for(var i = 0; i < numSrcCols; i++) {
        var numSrcLang = Math.ceil(srcLangs.length / numSrcCols) * i;
        for(var j = numSrcLang; j < numSrcLang + srcLangsPerCol; j++) {
            if(numSrcLang < srcLangs.length) {
                var langCode = srcLangs[j], langName = getLangByCode(langCode);
                $('#srcLanguages .languageCol:eq(' + i + ')')
                    .append(
                        $('<div class="languageName"></div>')
                            .attr('data-code', langCode)
                            .text(langName)
                    );
            }
        }
    }

    var dstLangsSorted = [];
    var directHead = 0;
    var multiHead = 0;
    $.each(dstLangs, function (i, lang) {
        if(originalPairs[curSrcLang].indexOf(lang) === -1) {
            if(pairs[curSrcLang].indexOf(lang) === -1) {
                dstLangsSorted.push(lang);
            }
            else {
                dstLangsSorted.splice(multiHead, 0, lang);
                multiHead++;
            }
        }
        else {
            dstLangsSorted.splice(directHead, 0, lang);
            directHead++;
            multiHead++;
        }
    });
    for(i = 0; i < numDstCols; i++) {
        var numDstLang = Math.ceil(dstLangsSorted.length / numDstCols) * i;
        for(j = numDstLang; j < numDstLang + dstLangsPerCol; j++) {
            if(numDstLang < dstLangsSorted.length) {
                langCode = dstLangsSorted[j], langName = getLangByCode(langCode);
                $('#dstLanguages .languageCol:eq(' + i + ')')
                    .append(
                        $('<div class="languageName"></div>')
                            .attr('data-code', langCode)
                            .text(((j >= directHead) && (j < multiHead)) ? langName + ' (+)' : langName)
                    );
            }
        }
    }

    $('.langSelect option[value!=detect]').remove();
    $.each(srcLangs, function () {
        $('#srcLangSelect').append($('<option></option>').prop('value', this).text(getLangByCode(this)));
    });
    $.each(dstLangs, function () {
        $('#dstLangSelect').append($('<option></option>').prop('value', this).text(getLangByCode(this)));
    });

    $('#srcLangSelect').val(curSrcLang);
    $('#dstLangSelect').val(curDstLang);

    muteLanguages();

    if(srcLangs.length === 1) {
        $('#srcLangSelectors div.btn-group').hide();
    }
    if(dstLangs.length === 1) {
        $('#dstLangSelectors div.btn-group').hide();
    }

    function sortTranslationList() {
        var sortLocale = (locale && locale in iso639Codes) ? iso639Codes[locale] : locale;

        srcLangs = srcLangs.sort(function (a, b) {
            try {
                return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
            }
            catch(e) {
                return getLangByCode(a).localeCompare(getLangByCode(b));
            }
        });

        dstLangs = dstLangs.sort(function (a, b) {
            var aPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(a) !== -1,
                bPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(b) !== -1;

            if((aPossible && bPossible) || (!aPossible && !bPossible)) {
                try {
                    return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
                }
                catch(e) {
                    return getLangByCode(a).localeCompare(getLangByCode(b));
                }

            }
            else if(aPossible && !bPossible) {
                return -1;
            }
            else {
                return 1;
            }
        });
    }
}

function translate(ignoreIfEmpty) {
    if($('div#translateWebpage').is(':visible') || isURL($('#originalText').val())) {
        translateWebpage(ignoreIfEmpty);
    }
    else if($('div#translateText').is(':visible')) {
        translateText(ignoreIfEmpty);
    }
    else if($('div#docTranslation').is(':visible')) {
        translateDoc();
    }
}

function translateText(ignoreIfEmpty) {
    function handleTranslateSuccessResponse(data) {
        if(data.responseStatus === HTTP_OK_CODE) {
            $('#translatedText').val(data.responseData.translatedText);
            $('#translatedText').removeClass('notAvailable text-danger');
        }
        else {
            translationNotAvailable();
        }
    }

    var originalText = $('#originalText').val();

    if(!originalText && ignoreIfEmpty) {
        return;
    }

    if($('div#translateText').is(':visible')) {
        if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
            sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, originalText.length);

            if(translateRequest) {
                translateRequest.abort();
                clearTimeout(apyRequestTimeout);
            }

            var endpoint, request;
            if($('input#chainedTranslation').prop('checked') && config.TRANSLATION_CHAINING) {
                endpoint = '/translateChain';
                request = {'langpairs': chosenPath.join('|')};
            }
            else {
                endpoint = '/translate';
                request = {'langpair': curSrcLang + '|' + curDstLang};
            }

            request.q = originalText; // eslint-disable-line id-length
            request.markUnknown = $('#markUnknown').prop('checked') ? 'yes' : 'no';
            translateRequest = callApy({
                data: request,
                success: handleTranslateSuccessResponse,
                error: translationNotAvailable,
                complete: function () {
                    ajaxComplete();
                    translateRequest = undefined;
                }
            }, endpoint);
        }
    }
}

function translateDoc() {
    var validPair = pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1;

    var file = droppedFile ? droppedFile : undefined;
    if($('input#fileInput')[0].files.length > 0 && $('input#fileInput')[0].files[0].length !== 0) {
        file = $('input#fileInput')[0].files[0];
    }

    if(validPair && file) {
        if(file.size > UPLOAD_FILE_SIZE_LIMIT) {
            docTranslateError(getDynamicLocalization('File_Too_Large'), 'File_Too_Large');
        }
        else {
            // Keep in sync with accept attribute of input#fileInput:
            var allowedMimeTypes = [
                '', // epiphany-browser gives this instead of a real MIME type
                'text/plain', 'text/html',
                'text/rtf', 'application/rtf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                // 'application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'
                'application/vnd.oasis.opendocument.text',
                'application/x-latex', 'application/x-tex'
            ];

            if(allowedMimeTypes.indexOf(file.type) !== -1) {
                $('span#uploadError').fadeOut('fast');
                $('a#fileDownload').hide();
                $('span#uploadError').hide();
                $('input#fileInput').prop('disabled', true);
                $('button#translate').prop('disabled', true);

                var xhr = new XMLHttpRequest({mozSystem: true});
                xhr.addEventListener('progress', updateProgressBar, false);
                if(xhr.upload) {
                    xhr.upload.onprogress = updateProgressBar;
                }
                var fileName = file.name;
                xhr.onreadystatechange = function () {
                    if(this.readyState === XHR_LOADING) {
                        $('div#fileLoading').fadeIn('fast');
                        $('div#fileUploadProgress').parent().fadeIn('fast', function () {
                            updateProgressBar({'loaded': 1, 'total': 1, 'position': undefined, 'totalSize': undefined});
                        });
                    }
                    else if(this.readyState === XHR_DONE && xhr.status === HTTP_OK_CODE) {
                        downloadBrowserWarn();
                        $('div#fileUploadProgress').parent().fadeOut('fast');
                        $('div#fileLoading').fadeOut('fast', function () {
                            var URL = window.URL || window.webkitURL;
                            $('a#fileDownload')
                                .attr('href', URL.createObjectURL(xhr.response))
                                .attr('download', fileName)
                                .fadeIn('fast');
                            $('span#fileDownloadText').text(getDynamicLocalization('Download_File').replace('{{fileName}}', fileName));
                            $('button#translate').prop('disabled', false);
                            $('input#fileInput').prop('disabled', false);
                        });
                    }
                    else if(this.status >= HTTP_BAD_REQUEST_CODE) {
                        docTranslateError(getDynamicLocalization('Not_Available'));
                    }
                };
                xhr.onerror = function () {
                    docTranslateError(getDynamicLocalization('Not_Available'));
                };

                updateProgressBar({'loaded': 0, 'total': 1, 'position': undefined, 'totalSize': undefined});
                $('div#fileUploadProgress').parent().fadeIn('fast');
                xhr.open('post', config.APY_URL + '/translateDoc', true);
                xhr.responseType = 'blob';
                var fileData = new FormData();
                fileData.append('langpair', curSrcLang + '|' + curDstLang);
                fileData.append('markUnknown', $('#markUnknown').prop('checked') ? 'yes' : 'no');
                fileData.append('file', file);
                xhr.send(fileData);
                sendEvent('translator', 'translateDoc', curSrcLang + '-' + curDstLang, file.size);
            }
            else {
                console.warn('Browser gave MIME type as', file.type);
                docTranslateError(getDynamicLocalization('Format_Not_Supported'), 'Format_Not_Supported');
            }
        }
    }
    else {
        docTranslateError(getDynamicLocalization('Not_Available'));
    }

    function updateProgressBar(ev) {
        var progress = 0.0;
        if(ev instanceof ProgressEvent) {
            progress = ev.loaded / ev.total;
        }
        else {
            console.warn('Strange event type given to updateProgressBar:');
            console.warn(ev);
        }
        var percentDone = Math.floor(progress * 1000) / 10;
        $('div#fileUploadProgress').attr('aria-valuenow', percentDone).css('width', percentDone + '%');
    }

    function docTranslateError(errorMessage, errorTextName) {
        $('div#fileUploadProgress').parent().fadeOut('fast', function () {
            $('span#uploadError')
                .text(errorMessage)
                .attr('data-text', errorTextName)
                .fadeIn('fast');
        });
        $('a#fileDownload').fadeOut('fast');
        $('div#fileLoading').fadeOut('fast');
        $('button#translate').prop('disabled', false);
        $('input#fileInput').prop('disabled', false);
        console.error(errorMessage);
    }
}

function translateWebpage(ignoreIfEmpty) {
    function webpageTranslationNotAvailable(data) {
        $('#translatedWebpage').replaceWith(
            $('<div id="translatedWebpage" class="notAvailable text-danger"></div>')
                .text(getDynamicLocalization('Not_Available'))
        );

        if(data) {
            console.warn('Webpage translation failed', data.message, data.explanation);
        }
    }

    function handleTranslateWebpageSuccessResponse(data) {
        function cleanPage(html) {
            // Pages like https://goo.gl/PiZyW3 insert noise using document.write that
            // 1. makes things enormously slow, and 2. completely mess up styling so e.g. you
            // have to scroll through a full screen of whitespace before reaching content.
            // This might mess things up some places – needs testing – but on the other hand
            // most uses of document.write are evil.
            return html.replace(/document[.]write[(]/g, 'console.log("document.write "+');
        }

        var translatedHtml = data.responseData.translatedText;

        if(data.responseStatus === HTTP_OK_CODE && translatedHtml) {
            var iframe = $('<iframe id="translatedWebpage" frameborder="0"></iframe>')[0];
            $('#translatedWebpage').replaceWith(iframe);
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(cleanPage(translatedHtml));
            iframe.contentWindow.document.close();

            $(iframe).load(function () {
                var contents = $(iframe).contents();
                contents.find('head').append($('<base>').attr('href', $('input#webpage').val()));

                $.each(contents.find('a'), function (index, a) {
                    var href = a.href;
                    $(a).on('click', function () {
                        $('#webpage').val(href);
                        translateWebpage();
                    });
                    a.href = '#';
                    a.target = '';
                });

                if(!contents.find('body').text().trim()) {
                    webpageTranslationNotAvailable();
                }
            });
        }
        else {
            webpageTranslationNotAvailable(data);
        }
    }

    function handleTranslateWebpageErrorResponse(jqXHR) {
        webpageTranslationNotAvailable(jqXHR.responseJSON);
    }

    persistChoices('translator', true);

    if(!$('div#translateWebpage').is(':visible')) {
        showTranslateWebpageInterface($('#originalText').val().trim());
    }

    var url = $('input#webpage').val();

    if(!url && ignoreIfEmpty) {
        return;
    }

    if(!isURL(url)) {
        webpageTranslationNotAvailable();
        return;
    }

    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
        sendEvent('translator', 'translateWebpage', curSrcLang + '-' + curDstLang);

        if(translateRequest) {
            translateRequest.abort();
            clearTimeout(apyRequestTimeout);
        }

        $('iframe#translatedWebpage').animate({'opacity': 0.75}, 'fast');
        translateRequest = callApy({
            data: {
                'langpair': curSrcLang + '|' + curDstLang,
                'markUnknown': 'no',
                'url': url
            },
            dataType: 'json',
            success: handleTranslateWebpageSuccessResponse,
            error: handleTranslateWebpageErrorResponse,
            complete: function () {
                ajaxComplete();
                translateRequest = undefined;
                $('iframe#translatedWebpage').animate({'opacity': 1}, 'fast');
            }
        }, '/translatePage', true);
    }
}

function showTranslateWebpageInterface(url, ignoreIfEmpty) {
    $('#srcLangSelectors').removeClass('col-sm-11').addClass('col-sm-9');

    $('div#translateText').fadeOut('fast', function () {
        $('input#webpage').attr({
            'required': true,
            'novalidate': false
        });
        $('button#cancelTranslateWebpage').fadeIn('fast').addClass('cancelTranslateWebpage');
        $('div#translateWebpage').fadeIn('fast');
        $('#detect, #srcLangSelect option[value=detect]').prop('disabled', true);
        $('#detect').addClass('disabledLang');

        if(url) {
            $('input#webpage').val(url);
        }

        $('#translationTarget').attr('href', '#webpageTranslation');
        window.location.hash = 'webpageTranslation';
        translateWebpage(ignoreIfEmpty);
    });
}

function downloadBrowserWarn() {
    if(typeof $bu_getBrowser == 'function') { // eslint-disable-line camelcase
        var detected = $bu_getBrowser();
        // Show the warning for (what bu calls) 'niche' browsers and Safari, but not Chromium:
        if(detected.n.match(/^[xs]/) && !(navigator.userAgent.match(/Chromium/))) {
            $('#fileDownloadBrowserWarning').show();
        }
    }
}

function detectLanguage() {
    var originalText = $('#originalText').val();

    if(translateRequest) {
        translateRequest.abort();
        clearTimeout(apyRequestTimeout);
    }

    translateRequest = callApy({
        data: {
            'q': originalText
        },
        success: handleDetectLanguageSuccessResponse,
        error: handleDetectLanguageErrorResponse,
        complete: function () {
            ajaxComplete();
            translateRequest = undefined;
        }
    }, '/identifyLang');

    return translateRequest;

    function handleDetectLanguageSuccessResponse(data) {
        var possibleLanguages = [];
        for(var lang in data) {
            possibleLanguages.push([lang.indexOf('-') !== -1 ? lang.split('-')[0] : lang, data[lang]]);
        }
        possibleLanguages.sort(function (a, b) {
            return b[1] - a[1];
        });

        var oldSrcLangs = recentSrcLangs;
        recentSrcLangs = [];
        for(var i = 0; i < possibleLanguages.length; i++) {
            if(recentSrcLangs.length < TRANSLATION_LIST_BUTTONS && possibleLanguages[i][0] in pairs) {
                recentSrcLangs.push(possibleLanguages[i][0]);
            }
        }
        recentSrcLangs = recentSrcLangs.concat(oldSrcLangs);
        if(recentSrcLangs.length > TRANSLATION_LIST_BUTTONS) {
            recentSrcLangs = recentSrcLangs.slice(0, TRANSLATION_LIST_BUTTONS);
        }

        curSrcLang = recentSrcLangs[0];
        autoSelectDstLang();
        $('#srcLangSelect').val(curSrcLang);
        muteLanguages();

        $('#detectedText').parent('.srcLang').attr('data-code', curSrcLang);
        refreshLangList();
        $('#detectedText').show();
        $('#detectText').hide();

        refreshChosenPath();
        refreshChainGraph();
    }

    function handleDetectLanguageErrorResponse() {
        $('#srcLang1').click();
    }
}

function translationNotAvailable() {
    $('#translatedText')
        .val(getDynamicLocalization('Not_Available'))
        .text(getDynamicLocalization('Not_Available'))
        .addClass('notAvailable text-danger');
}

function muteLanguages() {
    $('.languageName.text-muted').removeClass('text-muted');
    $('.dstLang').removeClass('disabledLang').prop('disabled', false);

    $.each($('#dstLanguages .languageName'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('text-muted');
        }
    });
    $.each($('.dstLang'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('disabledLang').prop('disabled', true);
        }
    });

    $.each($('#dstLangSelect option'), function (i, element) {
        $(element).prop('disabled', !pairs[curSrcLang] || pairs[curSrcLang].indexOf($(element).val()) === -1);
    });
}

function autoSelectDstLang() {
    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) === -1) {
        var newDstLang;
        for(var i = 0; i < recentDstLangs.length; i++) {
            if(pairs[curSrcLang].indexOf(recentDstLangs[i]) !== -1) {
                newDstLang = recentDstLangs[i];
                break;
            }
        }
        if(!newDstLang) {
            newDstLang = filterLangList(pairs[curSrcLang])[0];
        }

        curDstLang = newDstLang;

        if(recentDstLangs.indexOf(newDstLang) === -1) {
            handleNewCurrentLang(newDstLang, recentDstLangs, 'dstLang');
        }
        else {
            $('.dstLang').removeClass('active');
            refreshLangList();
            $('.dstLang[data-code=' + curDstLang + ']').addClass('active');
            muteLanguages();
            localizeInterface();
            refreshChosenPath();
            translateText();
        }

        $('#dstLangSelect').val(newDstLang).change();
    }
}

/*:: import {synchronizeTextareaHeights, modeEnabled, ajaxSend, ajaxComplete, filterLangList, onlyUnique, getLangByCode,
    callApy, apyRequestTimeout} from "./util.js" */
/*:: import {persistChoices, restoreChoices} from "./persistence.js" */
/*:: import localizeInterface from "./localization.js" */
/*:: import {readCache,cache} from "./cache.js" */
/*:: import {config} from "./config.js" */
/*:: import {isURL} from "./util.js" */
