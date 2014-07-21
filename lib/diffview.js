/***
 Completely rewritten by Austin Cheney on 2009-04-29 to avoid accessing
 the DOM.

 This is part of jsdifflib v1.0. <https://github.com/cemerick/jsdifflib>

 Copyright (c) 2007, Snowtide Informatics Systems, Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the
 distribution.
 * Neither the name of the Snowtide Informatics Systems nor the names
 of its contributors may be used to endorse or promote products
 derived from this software without specific prior written
 permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 ***/
/* Author: Chas Emerick <cemerick@snowtide.com> */
/* completely rewritten by Austin Cheney */
/**
 * Output - an array of three indexes:
 * 1) Diff result as a HTML table
 * 2) Number of errors after the number of error lines used for total
 *    total error count when added to the next index
 * 3) Number of error lines in the HTML table
 *
 * Arguments:
 * - baseTextLines: the array of strings that was used as the base
 *       text input to SequenceMatcher
 * - newTextLines: the array of strings that was used as the new
 *       text input to SequenceMatcher
 * - baseTextName: the title to be displayed above the base text
 *       listing in the diff view; defaults to "Base Text"
 * - newTextName: the title to be displayed above the new text
 *       listing in the diff view; defaults to "New Text"
 * - contextSize: the number of lines of context to show around
 *       differences; by default, all lines are shown
 * - inline: if not true, a side-by-side diff view is generated
 *       (default); if true, an inline diff view is generated
 * - tchar: the character(s) comprising a code indentation; this
 *          defaults to an empty string
 * - tsize: the number of tchar characters to comprise a single code
 *       indentation; this defaults to 1 if tchar is not an empty string
 */
var diffview = function diffview(args) {
        "use strict";
        //diffview application contains three primary parts
        //1.  opcodes - performs the 'largest common subsequence'
        //    calculation to determine which lines are different.  I
        //    did not write this logic.  I have rewritten it for
        //    performance, but original logic is still intact.
        //2.  charcomp - performs the 'largest common subsequence' upon
        //    characters of two compared lines.
        //3.  The construction of the output into the 'node' array
        //errorout is a count of differences
        var errorout      = 0,
            //diffline is a count of lines that are not equal
            diffline      = 0,
            baseTextLines = (typeof args.baseTextLines === "string") ? args.baseTextLines : "",
            newTextLines  = (typeof args.newTextLines === "string") ? args.newTextLines : "",
            baseTextName  = (typeof args.baseTextName === "string") ? args.baseTextName : "Base Source",
            newTextName   = (typeof args.newTextName === "string") ? args.newTextName : "New Source",
            context       = ((/^([0-9]+)$/).test(args.contextSize)) ? Number(args.contextSize) : -1,
            tsize         = ((/^([0-9]+)$/).test(args.tsize)) ? Number(args.tsize) : 4,
            tchar         = (typeof args.tchar === "string") ? args.tchar : " ",
            inline        = (args.inline === true || args.inline === "true") ? true : false,
            //tab is a construct of a standard indentation for code
            tab           = (function diffview__tab() {
                var a      = 0,
                    output = [];
                if (tchar === "") {
                    return "";
                }
                for (a = 0; a < tsize; a += 1) {
                    output.push(tchar);
                }
                return output.join("");
            }()),
            //translates source code from a string to an array by
            //splitting on line breaks
            stringAsLines = function diffview__stringAsLines(str) {
                var lfpos     = str.indexOf("\n"),
                    crpos     = str.indexOf("\r"),
                    linebreak = ((lfpos > -1 && crpos > -1) || crpos < 0) ? "\n" : "\r",
                    lines     = "";
                if (linebreak === "\n") {
                    str = str.replace(/\r/g, "");
                } else {
                    str = str.replace(/\n/g, "");
                }
                lines = str.replace(/\&/g, "&amp;").replace(/\&#lt;/g, "$#l" + "t;").replace(/\&#gt;/g, "$#g" + "t;").replace(/</g, "$#l" + "t;").replace(/>/g, "$#g" + "t;");
                return lines.split(linebreak);
            },
            //array representation of base source
            baseTextArray = stringAsLines(baseTextLines),
            //array representation of new source
            newTextArray  = stringAsLines(newTextLines),
            //the core algorithm.  This logic is not mine even though I
            //have largely rewritten it for performance.  It determines
            //the largest common subsequence calculations between lines
            //of code
            opcodes       = (function diffview__opcodes() {
                var junkdict            = {},
                    isbjunk             = function diffview__opcodes_isbjunk(key) {
                        if (junkdict.hasOwnProperty(key)) {
                            return junkdict[key];
                        }
                    },
                    sourceFirst         = [],
                    sourceSecond        = [],
                    secondInContext     = [],
                    reverse             = false,
                    matching_blocks     = [],
                    answer              = [],
                    get_matching_blocks = function diffview__opcodes_getMatchingBlocks() {
                        var a                  = 0,
                            matchingLen        = 0,
                            lowFirst           = 0,
                            highFirst          = 0,
                            lowSecond          = 0,
                            highSecond         = 0,
                            bestLongestFirst   = 0,
                            bestLongestSecond  = 0,
                            bestLongestSize    = 0,
                            matchFirstPrior    = 0,
                            matchFirstNew      = 0,
                            matchSecondPrior   = 0,
                            matchSecondNew     = 0,
                            matchSizePrior     = 0,
                            matchSizeNew       = 0,
                            sourceFirstLength  = sourceFirst.length,
                            sourceSecondLength = sourceSecond.length,
                            matchInstance      = [],
                            queueInstance      = [],
                            non_adjacent       = [],
                            queue              = [
                                [
                                    0, sourceFirstLength, 0, sourceSecondLength
                                ]
                            ],
                            matchingSort       = function diffview__opcodes_getMatchingBlocks_ntuplecomp(x, y) {
                                var b   = 0,
                                    end = Math.max(x.length, y.length);
                                for (b = 0; b < end; b += 1) {
                                    if (x[b] < y[b]) {
                                        return -1;
                                    }
                                    if (x[b] > y[b]) {
                                        return 1;
                                    }
                                }
                                return (x.length === y.length) ? 0 : ((x.length < y.length) ? -1 : 1);
                            },
                            find_longest_match = function diffview__opcodes_getMatchingBlocks_findLongestMatch(lowFirst, highFirst, lowSecond, highSecond) {
                                var b                   = 0,
                                    c                   = 0,
                                    sContextLength      = secondInContext.length,
                                    sContextCompareLine = 0,
                                    distance            = 0,
                                    priorLine           = [
                                        0, 0
                                    ],
                                    bestFirst           = lowFirst,
                                    bestSecond          = lowSecond,
                                    bestsize            = 0;
                                for (b = lowFirst; b < highFirst; b += 1) {
                                    for (c = 0; c < sContextLength; c += 1) {
                                        if (secondInContext[c][1] === sourceFirst[b] && (sourceFirst[b] !== sourceSecond[b] || b === highFirst - 1 || sourceFirst[b + 1] === sourceSecond[b + 1])) {
                                            sContextCompareLine = secondInContext[c][0];
                                            break;
                                        }
                                    }
                                    if (c !== sContextLength) {
                                        if (sContextCompareLine >= lowSecond) {
                                            if (sContextCompareLine >= highSecond) {
                                                break;
                                            }
                                            if (priorLine[0] === sContextCompareLine - 1) {
                                                distance = priorLine[1] + 1;
                                            } else {
                                                distance = 1;
                                            }
                                            if (distance > bestsize) {
                                                bestFirst  = b - distance + 1;
                                                bestSecond = sContextCompareLine - distance + 1;
                                                bestsize   = distance;
                                            }
                                        }
                                        priorLine = [
                                            sContextCompareLine, distance
                                        ];
                                    }
                                }
                                while (bestFirst > lowFirst && bestSecond > lowSecond && isbjunk(sourceSecond[bestSecond - 1]) === undefined && sourceFirst[bestFirst - 1] === sourceSecond[bestSecond - 1]) {
                                    bestFirst  -= 1;
                                    bestSecond -= 1;
                                    bestsize   += 1;
                                }
                                while (bestFirst + bestsize < highFirst && bestSecond + bestsize < highSecond && isbjunk(sourceSecond[bestSecond + bestsize]) === undefined && sourceFirst[bestFirst + bestsize] === sourceSecond[bestSecond + bestsize]) {
                                    bestsize += 1;
                                }
                                while (bestFirst > lowFirst && bestSecond > lowSecond && isbjunk(sourceSecond[bestSecond - 1]) !== undefined && sourceFirst[bestFirst - 1] === sourceSecond[bestSecond - 1]) {
                                    bestFirst  -= 1;
                                    bestSecond -= 1;
                                    bestsize   += 1;
                                }
                                while (bestFirst + bestsize < highFirst && bestSecond + bestsize < highSecond && isbjunk(sourceSecond[bestSecond + bestsize]) !== undefined && sourceFirst[bestFirst + bestsize] === sourceSecond[bestSecond + bestsize]) {
                                    bestsize += 1;
                                }
                                return [
                                    bestFirst, bestSecond, bestsize
                                ];
                            };
                        while (queue.length > 0) {
                            queueInstance     = queue.pop();
                            lowFirst          = queueInstance[0];
                            highFirst         = queueInstance[1];
                            lowSecond         = queueInstance[2];
                            highSecond        = queueInstance[3];
                            matchInstance     = find_longest_match(lowFirst, highFirst, lowSecond, highSecond);
                            bestLongestFirst  = matchInstance[0];
                            bestLongestSecond = matchInstance[1];
                            bestLongestSize   = matchInstance[2];
                            if (bestLongestSize > 0) {
                                matching_blocks.push(matchInstance);
                                if (lowFirst < bestLongestFirst && lowSecond < bestLongestSecond) {
                                    queue.push([
                                        lowFirst, bestLongestFirst, lowSecond, bestLongestSecond
                                    ]);
                                }
                                if (bestLongestFirst + bestLongestSize < highFirst && bestLongestSecond + bestLongestSize < highSecond) {
                                    queue.push([
                                        bestLongestFirst + bestLongestSize, highFirst, bestLongestSecond + bestLongestSize, highSecond
                                    ]);
                                }
                            }
                        }
                        matching_blocks.sort(matchingSort);
                        matchingLen = matching_blocks.length;
                        for (a = 0; a < matchingLen; a += 1) {
                            matchFirstNew  = matching_blocks[a][0];
                            matchSecondNew = matching_blocks[a][1];
                            matchSizeNew   = matching_blocks[a][2];
                            if (matchFirstPrior + matchSizePrior === matchFirstNew && matchSecondPrior + matchSizePrior === matchSecondNew) {
                                matchSizePrior += matchSizeNew;
                            } else {
                                if (matchSizePrior > 0) {
                                    non_adjacent.push([
                                        matchFirstPrior, matchSecondPrior, matchSizePrior
                                    ]);
                                }
                                matchFirstPrior  = matchFirstNew;
                                matchSecondPrior = matchSecondNew;
                                matchSizePrior   = matchSizeNew;
                            }
                        }
                        if (matchSizePrior > 0) {
                            non_adjacent.push([
                                matchFirstPrior, matchSecondPrior, matchSizePrior
                            ]);
                        }
                        non_adjacent.push([
                            sourceFirstLength, sourceSecondLength, 0
                        ]);
                        return non_adjacent;
                    };
                if (baseTextLines === "" || newTextLines === "") {
                    return "";
                }
                (function diffview__opcodes_diffArray() {
                    (function diffview__opcodes_diffArray_determineReverse() {
                        if (baseTextArray.length > newTextArray.length) {
                            reverse      = true;
                            sourceFirst  = newTextArray;
                            sourceSecond = baseTextArray;
                        } else {
                            sourceFirst  = baseTextArray;
                            sourceSecond = newTextArray;
                        }
                    }());
                    (function diffview__opcodes_diffArray_clarity() {
                        var a          = 0,
                            b          = 0,
                            sourceLine = "",
                            ssLen      = sourceSecond.length;
                        for (a = 0; a < ssLen; a += 1) {
                            sourceLine = sourceSecond[a];
                            for (b = secondInContext.length - 1; b > -1; b -= 1) {
                                if (secondInContext[b][1] === sourceLine) {
                                    break;
                                }
                            }
                            if (b > -1) {
                                if (ssLen >= 200 && 100 > ssLen) {
                                    secondInContext.splice(b, 1);
                                }
                            } else {
                                secondInContext.push([
                                    a, sourceLine
                                ]);
                            }
                        }
                    }());
                    (function diffview__opcodes_diffArray_algorithm() {
                        var a              = 0,
                            matchingFirst  = 0,
                            matchingSecond = 0,
                            matchingSize   = 0,
                            tag            = "",
                            firstSize      = 0,
                            secondSize     = 0,
                            blocks         = get_matching_blocks(),
                            blockLength    = blocks.length,
                            closerMatch    = function diffview__opcodes_diffArray_algorithm_closerMatch(current, next, compare) {
                                var diffspot       = function diffview__opcodes_diffArray_algorithm_closerMatch_diffspot(test, base) {
                                        var b           = 0,
                                            cleanedTest = test.replace(/^(\s+)/, "").split(""),
                                            minSize     = Math.min(cleanedTest.length, base.length);
                                        for (b = 0; b < minSize; b += 1) {
                                            if (cleanedTest[b] !== base[b]) {
                                                return b;
                                            }
                                        }
                                        return b;
                                    },
                                    cleanedCompare = compare.replace(/^(\s+)/, "").split(""),
                                    test           = diffspot(next, cleanedCompare) - diffspot(current, cleanedCompare);
                                if (test > 0) {
                                    return true;
                                }
                                return false;
                            };
                        for (a = 0; a < blockLength; a += 1) {
                            matchingFirst  = blocks[a][0];
                            matchingSecond = blocks[a][1];
                            matchingSize   = blocks[a][2];
                            tag            = "";
                            if (firstSize < matchingFirst && secondSize < matchingSecond) {
                                if (firstSize - secondSize !== matchingFirst - matchingSecond && secondSize - matchingSecond < 3 && firstSize - matchingFirst < 3) {
                                    if (reverse === true && firstSize - matchingFirst > secondSize - matchingSecond) {
                                        if (closerMatch(sourceSecond[secondSize], sourceSecond[secondSize + 1], sourceFirst[firstSize]) === true) {
                                            answer.push([
                                                "delete", secondSize, secondSize + 1, firstSize, firstSize
                                            ]);
                                            answer.push([
                                                "replace", secondSize + 1, matchingSecond, firstSize, matchingFirst
                                            ]);
                                        } else {
                                            answer.push([
                                                "replace", secondSize, matchingSecond, firstSize, matchingFirst
                                            ]);
                                        }
                                    } else if (reverse === false && matchingSecond - secondSize > matchingFirst - firstSize) {
                                        if (closerMatch(sourceSecond[secondSize], sourceSecond[secondSize + 1], sourceFirst[firstSize]) === true) {
                                            answer.push([
                                                "insert", firstSize, firstSize, secondSize, secondSize + 1
                                            ]);
                                            answer.push([
                                                "replace", firstSize, matchingFirst, secondSize + 1, matchingSecond
                                            ]);
                                        } else {
                                            answer.push([
                                                "replace", firstSize, matchingFirst, secondSize, matchingSecond
                                            ]);
                                        }
                                    } else {
                                        tag = "replace";
                                    }
                                } else {
                                    tag = "replace";
                                }
                            } else if (firstSize < matchingFirst) {
                                if (reverse === true) {
                                    tag = "insert";
                                } else {
                                    tag = "delete";
                                }
                            } else if (secondSize < matchingSecond) {
                                if (reverse === true) {
                                    tag = "delete";
                                } else {
                                    tag = "insert";
                                }
                            }
                            if (tag !== "") {
                                if (reverse === true) {
                                    answer.push([
                                        tag, secondSize, matchingSecond, firstSize, matchingFirst
                                    ]);
                                } else {
                                    answer.push([
                                        tag, firstSize, matchingFirst, secondSize, matchingSecond
                                    ]);
                                }
                            }
                            firstSize  = matchingFirst + matchingSize;
                            secondSize = matchingSecond + matchingSize;
                            if (matchingSize > 0) {
                                if (reverse === true) {
                                    answer.push([
                                        "equal", matchingSecond, secondSize, matchingFirst, firstSize
                                    ]);
                                } else {
                                    answer.push([
                                        "equal", matchingFirst, firstSize, matchingSecond, secondSize
                                    ]);
                                }
                            }
                        }
                    }());
                }());
                return answer;
            }());
        //after the opcodes generate the other two core pieces of logic
        //are quaranteened into an anonymous function.
        return (function diffview__report() {
            var a              = 0,
                i              = 0,
                node           = ["<div class='diff'>"],
                data           = [
                    [], [], [], []
                ],
                baseStart      = 0,
                baseEnd        = 0,
                newStart       = 0,
                newEnd         = 0,
                rowcnt         = 0,
                foldcount      = 0,
                foldstart      = 0,
                jump           = 0,
                tabFix         = (tab === "") ? "" : new RegExp("^((" + tab.replace(/\\/g, "\\") + ")+)"),
                noTab          = function diffview__report_noTab(str) {
                    var b      = 0,
                        strLen = str.length,
                        output = [];
                    for (b = 0; b < strLen; b += 1) {
                        output.push(str[b].replace(tabFix, ""));
                    }
                    return output;
                },
                baseTab        = (tab === "") ? [] : noTab(baseTextArray),
                newTab         = (tab === "") ? [] : noTab(newTextArray),
                opcodesLength  = opcodes.length,
                change         = "",
                btest          = false,
                ntest          = false,
                repeat         = false,
                ctest          = true,
                code           = [],
                charcompOutput = [],
                //this is the character comparison logic that performs
                //the 'largest common subsequence' between two lines of
                //code
                charcomp       = function diffview__report_charcomp(lineA, lineB) {
                    var b             = 0,
                        c             = 0,
                        d             = 0,
                        e             = 0,
                        dataA         = [],
                        dataB         = [],
                        cleanedA      = lineA.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">"),
                        cleanedB      = lineB.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">"),
                        dataMinLength = 0,
                        matchNextB    = [],
                        mBTest        = false,
                        matchNextA    = [],
                        mATest        = false,
                        lenComp       = [],
                        earlyOut      = false,
                        matchCount    = 0,
                        regStart      = (/_pdiffdiff\_/g),
                        regEnd        = (/_epdiffdiff\_/g),
                        strStart      = "_pdiff" + "diff_",
                        strEnd        = "_epdiff" + "diff_",
                        tabdiff       = (function diffview__report_charcomp_tabdiff() {
                            var tabMatchA  = "",
                                tabMatchB  = "",
                                splitA     = "",
                                splitB     = "",
                                analysis   = [],
                                matchListA = cleanedA.match(tabFix),
                                matchListB = cleanedB.match(tabFix);
                            if (matchListA === null || matchListB === null || (matchListA[0] === "" && matchListA.length === 1) || (matchListB[0] === "" && matchListB.length === 1)) {
                                return [
                                    "", "", cleanedA, cleanedB
                                ];
                            }
                            tabMatchA = matchListA[0];
                            tabMatchB = matchListB[0];
                            splitA    = cleanedA.split(tabMatchA)[1];
                            splitB    = cleanedB.split(tabMatchB)[1];
                            if (tabMatchA.length > tabMatchB.length) {
                                analysis  = tabMatchA.split(tabMatchB);
                                tabMatchA = tabMatchB + strStart + analysis[1] + strEnd;
                                tabMatchB = tabMatchB + strStart + strEnd;
                            } else {
                                analysis  = tabMatchB.split(tabMatchA);
                                tabMatchB = tabMatchA + strStart + analysis[1] + strEnd;
                                tabMatchA = tabMatchA + strStart + strEnd;
                            }
                            return [
                                tabMatchA, tabMatchB, splitA, splitB
                            ];
                        }());
                    if (cleanedA === cleanedB) {
                        return [
                            lineA, lineB
                        ];
                    }
                    errorout -= 1;
                    if (tabFix !== "" && cleanedA.length !== cleanedB.length && cleanedA.replace(tabFix, "") === cleanedB.replace(tabFix, "")) {
                        errorout += 1;
                        return [
                            (tabdiff[0] + tabdiff[2]).replace(/&/g, "&amp;").replace(/</g, "&l" + "t;").replace(/>/g, "&g" + "t;").replace(regStart, "<em>").replace(regEnd, "</em>"), (tabdiff[1] + tabdiff[3]).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>")
                        ];
                    }
                    dataA         = cleanedA.split("");
                    dataB         = cleanedB.split("");
                    dataMinLength = Math.min(dataA.length, dataB.length);
                    for (b = 0; b < dataMinLength; b += 1) {
                        if (dataA[b] === undefined || dataB[b] === undefined) {
                            break;
                        }
                        if (dataA[b] !== dataB[b]) {
                            mBTest   = false;
                            mATest   = false;
                            earlyOut = false;
                            lenComp.push(dataMinLength);
                            lenComp.push(dataMinLength);
                            dataA[b] = strStart + dataA[b];
                            dataB[b] = strStart + dataB[b];
                            errorout += 1;
                            for (c = b; c < dataMinLength; c += 1) {
                                if (mBTest === false) {
                                    for (d = c; d < dataMinLength; d += 1) {
                                        if ((dataA[c] === dataB[d] && dataB[c + 1] !== dataB[d - 1]) || dataB[c] === dataA[d]) {
                                            if (c === b) {
                                                c -= 1;
                                            }
                                            matchNextB.push(c - 1);
                                            matchNextB.push(d - 1);
                                            matchCount = (matchNextB[1] - matchNextB[0]);
                                            if (dataA[matchNextB[1] + matchCount] === dataB[matchNextB[1]] && strStart + dataA.slice(matchNextB[0] + matchCount, matchNextB[1] + matchCount).join("") === dataB.slice(matchNextB[0], matchNextB[1]).join("")) {
                                                dataA[b + (matchCount - 1)] = dataA[b + (matchCount - 1)] + strEnd;
                                                dataB[b]                    = dataB[b].replace(strStart, strStart + strEnd);
                                                do {
                                                    dataB.unshift("");
                                                    matchCount -= 1;
                                                } while (matchCount > 0);
                                            } else if (dataB[matchNextB[1] + matchCount] === dataA[matchNextB[1]] && strStart + dataB.slice(matchNextB[0] + matchCount, matchNextB[1] + matchCount).join("") === dataA.slice(matchNextB[0], matchNextB[1]).join("")) {
                                                dataB[b + (matchCount - 1)] = dataB[b + (matchCount - 1)] + strEnd;
                                                dataA[b]                    = dataA[b].replace(strStart, strStart + strEnd);
                                                do {
                                                    dataA.unshift("");
                                                    matchCount -= 1;
                                                } while (matchCount > 0);
                                            } else if (dataA[d] === dataB[d]) {
                                                mBTest = true;
                                            } else {
                                                dataA[c - 1] += strEnd;
                                                dataB[d - 1] += strEnd;
                                                do {
                                                    dataA.unshift("");
                                                    matchCount -= 1;
                                                } while (matchCount > 0);
                                            }
                                            if (mBTest === false) {
                                                b             = d;
                                                dataMinLength += matchCount;
                                                matchNextB.pop();
                                                matchNextB.pop();
                                                lenComp.pop();
                                                lenComp.pop();
                                                earlyOut = true;
                                            }
                                            break;
                                        }
                                    }
                                    if (earlyOut === true) {
                                        break;
                                    }
                                    if (c === dataMinLength - 1 && d === dataMinLength) {
                                        mBTest = true;
                                    }
                                }
                                if (mATest === false) {
                                    for (e = c; e < dataMinLength; e += 1) {
                                        if (dataB[c] === dataA[e]) {
                                            if (c === b) {
                                                c -= 1;
                                            }
                                            matchNextA.push(e - 1);
                                            matchNextA.push(c - 1);
                                            mATest = true;
                                            break;
                                        }
                                    }
                                    if (c === dataMinLength - 1 && e === dataMinLength) {
                                        mATest = true;
                                    }
                                }
                                if (mBTest === true && mATest === true) {
                                    if (e < d) {
                                        lenComp.pop();
                                        lenComp.pop();
                                        lenComp.push(matchNextA[0]);
                                        lenComp.push(matchNextA[1]);
                                    } else if (d < e) {
                                        lenComp.pop();
                                        lenComp.pop();
                                        lenComp.push(matchNextB[0]);
                                        lenComp.push(matchNextB[1]);
                                    } else if (d === e && d < dataMinLength) {
                                        lenComp.pop();
                                        lenComp.pop();
                                        lenComp.push(matchNextB[0]);
                                        lenComp.push(matchNextB[1]);
                                    }
                                    break;
                                }
                            }
                            if (dataB[lenComp[1]] !== undefined && dataA[b + 1] === dataB[lenComp[1]].replace(regStart, "")) {
                                dataA[b] = dataA[b] + strEnd;
                                if (lenComp[1] > b + 1) {
                                    dataB[lenComp[1] - 1] = dataB[lenComp[1] - 1] + strEnd;
                                    dataB[lenComp[1]]     = dataB[lenComp[1]].replace(regStart, "");
                                } else {
                                    dataB[lenComp[1] - 1] = dataB[lenComp[1] - 1].replace(regStart, "") + strStart + strEnd;
                                    dataB[lenComp[1]]     = dataB[lenComp[1]].replace(regStart, "");
                                }
                                for (c = (lenComp[1] - 1) - b; c > 0; c -= 1) {
                                    dataA.unshift("");
                                    if (dataA.length < dataB.length) {
                                        dataMinLength += 1;
                                    }
                                }
                                if (lenComp[1] < dataMinLength && dataA[b] !== undefined && dataB[b] !== undefined) {
                                    b = lenComp[1];
                                } else {
                                    b = Math.max(dataA.length, dataB.length);
                                    break;
                                }
                            } else if (dataA[b + 1] === dataB[lenComp[0]] && regEnd.test(dataA[b]) === false && regStart.test(dataA[b]) === true) {
                                dataA[b]              += strEnd;
                                dataB[lenComp[0] - 1] += strEnd;
                                for (c = lenComp[0] - (b + 1); c > 0; c -= 1) {
                                    dataA.unshift("");
                                }
                                if (lenComp[0] < dataMinLength && dataA[b] !== undefined && dataB[b] !== undefined) {
                                    b = lenComp[0] + 1;
                                } else {
                                    b = Math.max(dataA.length, dataB.length);
                                    break;
                                }
                            }
                            if (dataA[lenComp[1]] !== undefined && dataB[b + 1] === dataA[lenComp[1]].replace(regStart, "")) {
                                dataB[b] = dataB[b] + strEnd;
                                if (lenComp[1] > b + 1) {
                                    dataA[lenComp[1] - 1] = dataA[lenComp[1] - 1] + strEnd;
                                    dataA[lenComp[1]]     = dataA[lenComp[1]].replace(regStart, "");
                                } else {
                                    dataA[lenComp[1] - 1] = dataA[lenComp[1] - 1].replace(regStart, "") + strStart + strEnd;
                                    dataA[lenComp[1]]     = dataA[lenComp[1]].replace(regStart, "");
                                }
                                for (c = (lenComp[1] - 1) - b; c > 0; c -= 1) {
                                    dataB.unshift("");
                                    if (dataB.length < dataA.length) {
                                        dataMinLength += 1;
                                    }
                                }
                                if (lenComp[1] < dataMinLength && dataB[b] !== undefined && dataA[b] !== undefined) {
                                    b = lenComp[1];
                                } else {
                                    b = Math.max(dataA.length, dataB.length);
                                    break;
                                }
                            } else if (dataB[b + 1] === dataA[lenComp[0]] && regEnd.test(dataB[b]) === false && regStart.test(dataB[b]) === true) {
                                dataB[b]              += strEnd;
                                dataA[lenComp[0] - 1] += strEnd;
                                for (c = lenComp[0] - (b + 1); c > 0; c -= 1) {
                                    dataB.unshift("");
                                }
                                if (lenComp[0] < dataMinLength && dataA[b] !== undefined && dataB[b] !== undefined) {
                                    b = lenComp[0];
                                } else {
                                    b = Math.max(dataA.length, dataB.length);
                                    break;
                                }
                            }
                            if (lenComp[0] === dataMinLength || lenComp[1] === dataMinLength) {
                                if (dataA[b].replace(regStart, "") === dataB[dataB.length - 1]) {
                                    dataA[b]                = strStart + strEnd + dataA[b].replace(regStart, "");
                                    dataB[dataB.length - 1] = strEnd + dataB[dataB.length - 1];
                                    matchCount              = (dataB.length - 1) - b;
                                    do {
                                        dataA.unshift("");
                                        matchCount -= 1;
                                    } while (matchCount > 0);
                                } else if (dataB[b].replace(regStart, "") === dataA[dataA.length - 1]) {
                                    dataB[b]                = strStart + strEnd + dataB[b].replace(regStart, "");
                                    dataA[dataA.length - 1] = strEnd + dataA[dataA.length - 1];
                                    matchCount              = (dataA.length - 1) - b;
                                    do {
                                        dataB.unshift("");
                                        matchCount -= 1;
                                    } while (matchCount > 0);
                                } else {
                                    dataA.push(strEnd);
                                    dataB.push(strEnd);
                                }
                                if (dataA.length < dataB.length && dataB[dataB.length - 1].indexOf(strEnd) < 0) {
                                    d = dataB.length - 1;
                                    dataA.push(strStart);
                                    if (dataB[b].indexOf(strStart + strEnd) > -1) {
                                        dataB[dataMinLength - 1] = strStart + dataB[dataMinLength - 1];
                                    } else {
                                        dataB[dataMinLength] = strStart + dataB[dataMinLength];
                                    }
                                    dataA.push(strEnd);
                                    dataB[d] = dataB[d] + strEnd;
                                    errorout += 1;
                                }
                                if (dataB.length < dataA.length && dataA[dataA.length - 1].indexOf(strEnd) < 0) {
                                    d = dataA.length - 1;
                                    dataB.push(strStart);
                                    if (dataA[b].indexOf(strStart + strEnd) > -1) {
                                        dataA[dataMinLength - 1] = strStart + dataA[dataMinLength - 1];
                                    } else {
                                        dataA[dataMinLength] = strStart + dataA[dataMinLength];
                                    }
                                    dataA[d] = dataA[d] + strEnd;
                                    dataB.push(strEnd);
                                    errorout += 1;
                                }
                                break;
                            }
                            if (dataA[lenComp[0]] === dataB[b].substring(strStart.length)) {
                                if (dataA[lenComp[0]] === dataB[b].substring(strStart.length)) {
                                    dataA[lenComp[0] - 1] = dataA[lenComp[0] - 1] + strEnd;
                                } else {
                                    dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                }
                                if (lenComp[1] === b) {
                                    dataB[lenComp[1]] = strStart + strEnd + dataB[lenComp[1]].replace(regStart, "");
                                } else {
                                    dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                }
                            } else if (dataB[lenComp[1]] === dataA[b].substring(strStart.length)) {
                                if (dataB[lenComp[1]] === dataA[b].substring(strStart.length)) {
                                    dataB[lenComp[1] - 1] = dataB[lenComp[1] - 1] + strEnd;
                                } else {
                                    dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                }
                                if (lenComp[0] === b) {
                                    dataA[lenComp[0]] = strStart + strEnd + dataA[lenComp[0]].replace(regStart, "");
                                } else {
                                    dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                }
                            } else {
                                if (lenComp[1] > lenComp[0] && dataA[lenComp[1] + 1] === dataB[lenComp[1] + 1]) {
                                    if (dataA[lenComp[1]] === dataB[lenComp[1]].replace(regEnd, "")) {
                                        dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "");
                                        do {
                                            lenComp[1] -= 1;
                                        } while (dataA[lenComp[1]] === dataB[lenComp[1]]);
                                        dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                    }
                                    dataA[lenComp[1]] = dataA[lenComp[1]].replace(regEnd, "") + strEnd;
                                    lenComp[0]        = lenComp[1];
                                } else if (dataA[lenComp[0]] !== undefined && dataA[lenComp[0]].indexOf(strEnd) < 0 && dataA[lenComp[0] - 1].indexOf(strEnd) < 0) {
                                    dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                }
                                if (lenComp[0] > lenComp[1] && dataB[lenComp[0] + 1] === dataA[lenComp[0] + 1]) {
                                    if (dataB[lenComp[0]] === dataA[lenComp[0]].replace(regEnd, "")) {
                                        dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "");
                                        do {
                                            lenComp[0] -= 1;
                                        } while (dataB[lenComp[0]] === dataA[lenComp[0]]);
                                        dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                    }
                                    dataB[lenComp[0]] = dataB[lenComp[0]].replace(regEnd, "") + strEnd;
                                    lenComp[1]        = lenComp[0];
                                } else if (dataB[lenComp[1]] !== undefined && dataB[lenComp[1]].indexOf(strEnd) < 0 && dataB[lenComp[1] - 1].indexOf(strEnd) < 0) {
                                    dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                }
                            }
                            if (lenComp[1] - lenComp[0] > 0) {
                                for (c = (lenComp[1] - lenComp[0]) + b; c > b; c -= 1) {
                                    dataA.unshift("");
                                }
                            }
                            if (lenComp[0] - lenComp[1] > 0) {
                                for (c = (lenComp[0] - lenComp[1]) + b; c > b; c -= 1) {
                                    dataB.unshift("");
                                }
                            }
                            if (earlyOut === false) {
                                b = Math.max(lenComp[0], lenComp[1]);
                            }
                            dataMinLength = Math.min(dataA.length, dataB.length);
                            matchNextB.pop();
                            matchNextB.pop();
                            matchNextA.pop();
                            matchNextA.pop();
                            lenComp.pop();
                            lenComp.pop();
                        }
                    }
                    if (b < Math.max(dataA.length, dataB.length) && regEnd.test(dataA[dataA.length - 1]) === false && regEnd.test(dataB[dataB.length - 1]) === false) {
                        errorout += 1;
                        if (dataA.length < dataB.length) {
                            dataA.push(strStart);
                            dataA.push(strEnd);
                            dataB[b] = strStart + dataB[b];
                            dataB.push(strEnd);
                        } else {
                            dataB.push(strStart);
                            dataB.push(strEnd);
                            dataA[b] = strStart + dataA[b];
                            dataA.push(strEnd);
                        }
                    }
                    return [
                        dataA.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>"), dataB.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>")
                    ];
                };
            if (inline === true) {
                node.push("<h3 class='texttitle'>");
                node.push(baseTextName);
                node.push(" vs. ");
                node.push(newTextName);
                node.push("</h3><ol class='count'>");
            } else {
                data[0].push("<div class='diff-left'><h3 class='texttitle'>");
                data[0].push(baseTextName);
                data[0].push("</h3><ol class='count'>");
                data[2].push("<div class='diff-right'><h3 class='texttitle'>");
                data[2].push(newTextName);
                data[2].push("</h3><ol class='count' style='cursor:w-resize'>");
            }
            for (a = 0; a < opcodesLength; a += 1) {
                code      = opcodes[a];
                change    = code[0];
                baseStart = code[1];
                baseEnd   = code[2];
                newStart  = code[3];
                newEnd    = code[4];
                rowcnt    = Math.max(baseEnd - baseStart, newEnd - newStart);
                ctest     = true;
                for (i = 0; i < rowcnt; i += 1) {
                    //apply context collapsing for the output, if needed
                    if (context > -1 && opcodes.length > 1 && ((a > 0 && i === context) || (a === 0 && i === 0)) && change === "equal") {
                        ctest = false;
                        jump  = rowcnt - ((a === 0 ? 1 : 2) * context);
                        if (jump > 1) {
                            foldcount += 1;
                            data[0].push("<li>...</li>");
                            if (inline === false) {
                                data[1].push("<li class='skip'>&#10;</li>");
                            }
                            data[2].push("<li>...</li>");
                            data[3].push("<li class='skip'>&#10;</li>");
                            baseStart += jump;
                            newStart  += jump;
                            i         += jump - 1;
                            if (a + 1 === opcodes.length) {
                                break;
                            }
                        }
                    } else if (change !== "equal") {
                        diffline += 1;
                    }
                    if (baseTextArray[baseStart] === newTextArray[newStart]) {
                        change = "equal";
                    } else if (change === "equal") {
                        change = "replace";
                    }
                    //this is a check against false positives incurred
                    //by increasing or reducing of nesting.  At this
                    //time it only checks one level deep.
                    if (tab !== "") {
                        if (btest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof baseTextArray[baseStart + 1] === "string" && typeof newTextArray[newStart] === "string" && baseTab[baseStart + 1] === newTab[newStart] && baseTab[baseStart] !== newTab[newStart] && (typeof newTextArray[newStart - 1] !== "string" || baseTab[baseStart] !== newTab[newStart - 1])) {
                            btest = true;
                        } else if (ntest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof newTextArray[newStart + 1] === "string" && typeof baseTextArray[baseStart] === "string" && newTab[newStart + 1] === baseTab[baseStart] && newTab[newStart] !== baseTab[baseStart] && (typeof baseTextArray[baseStart - 1] !== "string" || newTab[newStart] !== baseTab[baseStart - 1])) {
                            ntest = true;
                        }
                    }
                    //this is the final of the three primary components
                    //this is where the output is built
                    if (inline === true) {
                        if (context < 0 && baseTextArray[baseStart - 1] === newTextArray[newStart - 1] && baseTextArray[baseStart] !== newTextArray[newStart]) {
                            data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                        }
                        if (ntest === true || change === "insert") {
                            data[0].push("<li class='empty'>&#8203;&#10;</li>");
                            data[2].push("<li>");
                            data[2].push(newStart + 1);
                            data[2].push("&#10;</li>");
                            data[3].push("<li class='insert'>");
                            data[3].push(newTextArray[newStart]);
                            data[3].push("&#10;</li>");
                            foldcount += 1;
                        } else if (btest === true || change === "delete") {
                            data[0].push("<li>");
                            data[0].push(baseStart + 1);
                            data[0].push("</li>");
                            data[2].push("<li class='empty'>&#8203;&#10;</li>");
                            data[3].push("<li class='delete'>");
                            data[3].push(baseTextArray[baseStart]);
                            data[3].push("&#10;</li>");
                            foldcount += 1;
                        } else if (change === "replace") {
                            if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                                if (baseTextArray[baseStart] === "") {
                                    charcompOutput = [
                                        "", newTextArray[newStart]
                                    ];
                                } else if (newTextArray[newStart] === "") {
                                    charcompOutput = [
                                        baseTextArray[baseStart], ""
                                    ];
                                } else if (baseStart < baseEnd && newStart < newEnd) {
                                    charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                }
                            }
                            if (baseStart < baseEnd) {
                                data[0].push("<li>");
                                data[0].push(baseStart + 1);
                                data[0].push("</li>");
                                data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                data[3].push("<li class='delete'>");
                                if (newStart < newEnd) {
                                    data[3].push(charcompOutput[0]);
                                } else {
                                    data[3].push(baseTextArray[baseStart]);
                                }
                                data[3].push("&#10;</li>");
                                foldcount += 1;
                            }
                            if (newStart < newEnd) {
                                data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                data[2].push("<li>");
                                data[2].push(newStart + 1);
                                data[2].push("</li>");
                                data[3].push("<li class='insert'>");
                                if (baseStart < baseEnd) {
                                    data[3].push(charcompOutput[1]);
                                } else {
                                    data[3].push(newTextArray[newStart]);
                                }
                                data[3].push("&#10;</li>");
                                foldcount += 1;
                            }
                        } else if (baseStart < baseEnd || newStart < newEnd) {
                            foldcount += 1;
                            if (context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                                foldstart = data[0].length;
                                if (a === opcodesLength - 1) {
                                    if (baseEnd > newEnd) {
                                        data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (baseEnd + 3) + "\">");
                                    } else {
                                        data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (newEnd + 3) + "\">");
                                    }
                                } else {
                                    data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">");
                                }
                                data[0].push("- " + (baseStart + 1));
                            } else {
                                data[0].push("<li>");
                                data[0].push(baseStart + 1);
                            }
                            data[0].push("</li>");
                            data[2].push("<li>");
                            data[2].push(newStart + 1);
                            data[2].push("</li>");
                            data[3].push("<li class='");
                            data[3].push(change);
                            data[3].push("'>");
                            data[3].push(baseTextArray[baseStart]);
                            data[3].push("&#10;</li>");
                        }
                        if (btest === true) {
                            baseStart += 1;
                            btest     = false;
                        } else if (ntest === true) {
                            newStart += 1;
                            ntest    = false;
                        } else {
                            baseStart += 1;
                            newStart  += 1;
                        }
                    } else {
                        if (btest === false && ntest === false && typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] === "string") {
                            if (context < 0 && (foldstart === 3 || baseTextArray[baseStart - 1] === newTextArray[newStart - 1]) && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                            }
                            if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "") {
                                change = "insert";
                            }
                            if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                change = "delete";
                            }
                            if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                            } else {
                                charcompOutput = [];
                            }
                            if (baseStart === Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1 || newStart === Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                repeat = true;
                            }
                            if (repeat === false) {
                                foldcount += 1;
                                if (baseStart < baseEnd) {
                                    if (context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                                        if (a === opcodesLength - 1) {
                                            if (baseEnd > newEnd) {
                                                data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (baseEnd + 2) + "\">- " + (baseStart + 1) + "</li>");
                                            } else {
                                                data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (newEnd + 2) + "\">- " + (baseStart + 1) + "</li>");
                                            }
                                        } else {
                                            foldstart = data[0].length;
                                            data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">- " + (baseStart + 1) + "</li>");
                                        }
                                    } else {
                                        data[0].push("<li>" + (baseStart + 1) + "</li>");
                                    }
                                    data[1].push("<li class='");
                                    if (newStart >= newEnd) {
                                        data[1].push("delete");
                                    } else if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "") {
                                        data[1].push("empty");
                                    } else {
                                        data[1].push(change);
                                    }
                                    data[1].push("'>");
                                    if (charcompOutput.length === 2) {
                                        data[1].push(charcompOutput[0]);
                                    } else {
                                        data[1].push(baseTextArray[baseStart]);
                                    }
                                    data[1].push("&#10;</li>");
                                } else if (ctest === true) {
                                    data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                    data[1].push("<li class='empty'>&#8203;</li>");
                                }
                                if (newStart < newEnd) {
                                    data[2].push("<li>" + (newStart + 1) + "</li>");
                                    data[3].push("<li class='");
                                    if (baseStart >= baseEnd) {
                                        data[3].push("insert");
                                    } else if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                        data[3].push("empty");
                                    } else {
                                        data[3].push(change);
                                    }
                                    data[3].push("'>");
                                    if (charcompOutput.length === 2) {
                                        data[3].push(charcompOutput[1]);
                                    } else {
                                        data[3].push(newTextArray[newStart]);
                                    }
                                    data[3].push("&#10;</li>");
                                } else if (ctest === true) {
                                    data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                    data[3].push("<li class='empty'>&#8203;</li>");
                                }
                            } else {
                                repeat = false;
                            }
                            if (baseStart < baseEnd) {
                                baseStart += 1;
                            }
                            if (newStart < newEnd) {
                                newStart += 1;
                            }
                        } else if (btest === true || (typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] !== "string")) {
                            if (baseStart !== Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1) {
                                foldcount += 1;
                                data[0].push("<li>" + (baseStart + 1) + "</li>");
                                data[1].push("<li class='delete'>");
                                data[1].push(baseTextArray[baseStart]);
                                data[1].push("&#10;</li>");
                                data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                data[3].push("<li class='empty'>&#8203;</li>");
                            }
                            btest     = false;
                            baseStart += 1;
                        } else if (ntest === true || (typeof baseTextArray[baseStart] !== "string" && typeof newTextArray[newStart] === "string")) {
                            if (newStart !== Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                foldcount += 1;
                                data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                data[1].push("<li class='empty'>&#8203;</li>");
                                data[2].push("<li>" + (newStart + 1) + "</li>");
                                data[3].push("<li class='insert'>");
                                data[3].push(newTextArray[newStart]);
                                data[3].push("&#10;</li>");
                            }
                            ntest    = false;
                            newStart += 1;
                        }
                    }
                }
            }
            node.push(data[0].join(""));
            node.push("</ol><ol class=");
            if (inline === true) {
                node.push("'count'>");
            } else {
                node.push("'data'>");
                node.push(data[1].join(""));
                node.push("</ol></div>");
            }
            node.push(data[2].join(""));
            node.push("</ol><ol class='data'>");
            node.push(data[3].join(""));
            if (inline === true) {
                node.push("</ol>");
            } else {
                node.push("</ol></div>");
            }
            node.push("<p class='author'>Diff view written by <a href='http://prettydiff.com/'>Pretty Diff</a>.</p></div>");
            return [
                node.join("").replace(/li class='equal'><\/li/g, "li class='equal'>&#10;</li").replace(/\$#gt;/g, "&gt;").replace(/\$#lt;/g, "&lt;").replace(/\%#lt;/g, "$#lt;").replace(/\%#gt;/g, "$#gt;"), errorout, diffline
            ];
        }());
    };