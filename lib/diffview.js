/*global ace, define, exports*/
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
 */
var diffview = function diffview_(options) {
    "use strict";
    (function diffview__options() {
        options.context       = ((/^([0-9]+)$/).test(options.context) === true)
            ? Number(options.context)
            : -1;
        options.diff  = (typeof options.diff === "string")
            ? options.diff
                .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
            : "";
        options.diffcli       = (options.diffcli === true || options.diffcli === "true");
        options.difflabel = (typeof options.difflabel === "string")
            ? options.difflabel
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
            : "New Source";
        options.inline        = (options.inline === true || options.inline === "true" || options.inline === "inline");
        options.inchar         = (typeof options.inchar === "string")
            ? options.inchar
            : " ";
        options.insize         = ((/^([0-9]+)$/).test(options.insize))
            ? Number(options.insize)
            : 4;
        options.source = (typeof options.source === "string")
            ? options.source
                .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
            : "";
        options.sourcelabel = (typeof options.sourcelabel === "string")
            ? options.sourcelabel
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
            : "Base Source";
        //old non-standard API
        if (typeof options.baseTextLines === "string") {
            options.source = options.baseTextLines
                .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
        }
        if (typeof options.baseTextName === "string") {
            options.sourcelabel = options.baseTextName
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
        if (typeof options.newTextLines === "string") {
            options.diff = options.newTextLines
                .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
        }
        if (typeof options.newTextName === "string") {
            options.difflabel = options.newTextName
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
        }
        if ((/^([0-9]+)$/).test(options.contextSize) === true) {
            options.context = Number(options.contextSize);
        }
        if (typeof options.tchar === "string") {
            options.inchar = options.tchar;
        }
        if ((/^([0-9]+)$/).test(options.tsize) === true) {
            options.insize = Number(options.tsize);
        }
    }());
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
        //tab is a construct of a standard indentation for code
        tab           = (function diffview__tab() {
            var a      = 0,
                output = [];
            if (options.inchar === "") {
                return "";
            }
            for (a = 0; a < options.insize; a += 1) {
                output.push(options.inchar);
            }
            return output.join("");
        }()),
        //translates source code from a string to an array by
        //splitting on line breaks
        stringAsLines = function diffview__stringAsLines(str) {
            var lines = (options.diffcli === true)
                ? str
                : str.replace(/&/g, "&amp;")
                    .replace(/&#lt;/g, "$#lt;")
                    .replace(/&#gt;/g, "$#gt;")
                    .replace(/</g, "$#lt;")
                    .replace(/>/g, "$#gt;");
            return lines.split("\n");
        },
        //array representation of base source
        baseTextArray = stringAsLines(options.source),
        //array representation of new source
        newTextArray  = stringAsLines(options.diff),
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
                            return (x.length === y.length)
                                ? 0
                                : ((x.length < y.length)
                                    ? -1
                                    : 1);
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
                            return [bestFirst, bestSecond, bestsize];
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
                                queue.push([lowFirst, bestLongestFirst, lowSecond, bestLongestSecond]);
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
                                non_adjacent.push([matchFirstPrior, matchSecondPrior, matchSizePrior]);
                            }
                            matchFirstPrior  = matchFirstNew;
                            matchSecondPrior = matchSecondNew;
                            matchSizePrior   = matchSizeNew;
                        }
                    }
                    if (matchSizePrior > 0) {
                        non_adjacent.push([matchFirstPrior, matchSecondPrior, matchSizePrior]);
                    }
                    non_adjacent.push([sourceFirstLength, sourceSecondLength, 0]);
                    return non_adjacent;
                };
            if (options.source === "" || options.diff === "") {
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
                            secondInContext.push([a, sourceLine]);
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
                                        cleanedTest = test.replace(/^(\s+)/, "")
                                            .split(""),
                                        minSize     = Math.min(cleanedTest.length, base.length);
                                    for (b = 0; b < minSize; b += 1) {
                                        if (cleanedTest[b] !== base[b]) {
                                            return b;
                                        }
                                    }
                                    return b;
                                },
                                cleanedCompare = compare.replace(/^(\s+)/, "")
                                    .split(""),
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
                                        answer.push(["replace", secondSize, matchingSecond, firstSize, matchingFirst]);
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
                                        answer.push(["replace", firstSize, matchingFirst, secondSize, matchingSecond]);
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
                                answer.push([tag, secondSize, matchingSecond, firstSize, matchingFirst]);
                            } else {
                                answer.push([tag, firstSize, matchingFirst, secondSize, matchingSecond]);
                            }
                        }
                        firstSize  = matchingFirst + matchingSize;
                        secondSize = matchingSecond + matchingSize;
                        if (matchingSize > 0) {
                            if (reverse === true) {
                                answer.push(["equal", matchingSecond, secondSize, matchingFirst, firstSize]);
                            } else {
                                answer.push(["equal", matchingFirst, firstSize, matchingSecond, secondSize]);
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
            data           = (options.diffcli === true)
                ? [
                    [], [], [], [], [], []
                ]
                : [
                    [], [], [], []
                ],
            baseStart      = 0,
            baseEnd        = 0,
            newStart       = 0,
            newEnd         = 0,
            rowcnt         = 0,
            foldcount      = 0,
            foldback       = 0,
            foldstart      = 0,
            jump           = 0,
            finaldoc       = "",
            tabFix         = (tab === "")
                ? ""
                : new RegExp("^((" + tab.replace(/\\/g, "\\") + ")+)"),
            noTab          = function diffview__report_noTab(str) {
                var b      = 0,
                    strLen = str.length,
                    output = [];
                for (b = 0; b < strLen; b += 1) {
                    output.push(str[b].replace(tabFix, ""));
                }
                return output;
            },
            baseTab        = (tab === "")
                ? []
                : noTab(baseTextArray),
            newTab         = (tab === "")
                ? []
                : noTab(newTextArray),
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
                    dataA         = [],
                    dataB         = [],
                    cleanedA      = (options.diffcli === true)
                        ? lineA
                        : lineA.replace(/&#160;/g, " ")
                            .replace(/&nbsp;/g, " ")
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/\$#lt;/g, "<")
                            .replace(/\$#gt;/g, ">")
                            .replace(/&amp;/g, "&"),
                    cleanedB      = (options.diffcli === true)
                        ? lineB
                        : lineB.replace(/&#160;/g, " ")
                            .replace(/&nbsp;/g, " ")
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/\$#lt;/g, "<")
                            .replace(/\$#gt;/g, ">")
                            .replace(/&amp;/g, "&"),
                    dataMinLength = 0,
                    currentdiff   = [],
                    regStart      = (/_pdiffdiff\u005f/g),
                    regEnd        = (/_epdiffdiff\u005f/g),
                    strStart      = "_pdiffdiff_",
                    strEnd        = "_epdiffdiff_",
                    tabdiff       = (function diffview__report_charcomp_tabdiff() {
                        var tabMatchA  = "",
                            tabMatchB  = "",
                            splitA     = "",
                            splitB     = "",
                            analysis   = [],
                            matchListA = cleanedA.match(tabFix),
                            matchListB = cleanedB.match(tabFix);
                        if (matchListA === null || matchListB === null || (matchListA[0] === "" && matchListA.length === 1) || (matchListB[0] === "" && matchListB.length === 1)) {
                            return ["", "", cleanedA, cleanedB];
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
                        return [tabMatchA, tabMatchB, splitA, splitB];
                    }()),
                    //compare is the fuzzy string comparison algorithm
                    compare       = function diffview__report_charcomp_compare(start) {
                        var x     = 0,
                            y     = 0,
                            max   = Math.max(dataA.length, dataB.length),
                            store = [],
                            sorta = function diffview__report_charcomp_compare_sorta(a, b) {
                                if (a[1] - a[0] < b[1] - b[0]) {
                                    return 1;
                                }
                                return -1;
                            },
                            sortb = function diffview__report_charcomp_compare_sortb(a, b) {
                                if (a[0] + a[1] > b[0] + b[1]) {
                                    return 1;
                                }
                                return -1;
                            };
                        //first gather a list of all matching indexes into an array
                        for (x = start; x < dataMinLength; x += 1) {
                            for (y = start; y < max; y += 1) {
                                if (dataA[x] === dataB[y] || dataB[x] === dataA[y]) {
                                    store.push([x, y]);
                                    break;
                                }
                            }
                        }
                        //if there are no character matches then quit out
                        if (store.length === 0) {
                            return [dataMinLength, max, 0];
                        }
                        //take the list of matches and sort it
                        //first sort by size of change with shortest up front
                        //second sort by sum of change start and end
                        //the second sort results in the smallest change from the earliest point
                        store.sort(sorta);
                        if (dataMinLength - start < 5000) {
                            store.sort(sortb);
                        }
                        //x should always be the shorter index (change start)
                        if (store[0][0] < store[0][1]) {
                            x = store[0][0];
                            y = store[0][1];
                        } else {
                            y = store[0][0];
                            x = store[0][1];
                        }
                        //package the output
                        if (dataA[y] === dataB[x]) {
                            if (dataA[y - 1] === dataB[x - 1] && x !== start) {
                                x -= 1;
                                y -= 1;
                            }
                            return [x, y, 0];
                        }
                        if (dataA[x] === dataB[y]) {
                            if (dataA[x - 1] === dataB[y - 1] && x !== start) {
                                x -= 1;
                                y -= 1;
                            }
                            return [x, y, 1];
                        }
                    };
                //if same after accounting for character entities then exit
                if (cleanedA === cleanedB) {
                    return [lineA, lineB];
                }
                //prevent extra error counting that occurred before entering this function
                errorout -= 1;
                //diff for tabs
                if (tabFix !== "" && cleanedA.length !== cleanedB.length && cleanedA.replace(tabFix, "") === cleanedB.replace(tabFix, "")) {
                    errorout += 1;
                    if (options.diffcli === true) {
                        tabdiff[0] = tabdiff[0] + tabdiff[2];
                        tabdiff[0] = tabdiff[0].replace(regStart, "<pd>")
                            .replace(regEnd, "</pd>");
                        tabdiff[1] = tabdiff[1] + tabdiff[3];
                        tabdiff[1] = tabdiff[1].replace(regStart, "<pd>")
                            .replace(regEnd, "</pd>");
                        return [tabdiff[0], tabdiff[1]];
                    }
                    tabdiff[0] = tabdiff[0] + tabdiff[2];
                    tabdiff[0] = tabdiff[0].replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(regStart, "<em>")
                        .replace(regEnd, "</em>");
                    tabdiff[1] = tabdiff[1] + tabdiff[3];
                    tabdiff[1] = tabdiff[1].replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(regStart, "<em>")
                        .replace(regEnd, "</em>");
                    return [tabdiff[0], tabdiff[1]];
                }
                //turn the pruned input into arrays
                dataA         = cleanedA.split("");
                dataB         = cleanedB.split("");
                //the length of the shortest array
                dataMinLength = Math.min(dataA.length, dataB.length);
                for (b = 0; b < dataMinLength; b += 1) {
                    //if undefined break the loop
                    if (dataA[b] === undefined || dataB[b] === undefined) {
                        break;
                    }
                    //iterate until the arrays are not the same
                    if (dataA[b] !== dataB[b]) {
                        //count each difference
                        errorout    += 1;
                        //fuzzy string comparison returns an array with these indexes
                        //0 - shorter ending index of difference
                        //1 - longer ending index of difference
                        //2 - 0 if index 2 is for dataA or 1 for dataB
                        currentdiff = compare(b);
                        //supply the difference start indicator
                        if (b > 0) {
                            dataA[b - 1] = dataA[b - 1] + strStart;
                            dataB[b - 1] = dataB[b - 1] + strStart;
                        } else {
                            dataA[b] = strStart + dataA[b];
                            dataB[b] = strStart + dataB[b];
                        }
                        //complex decision tree on how to supply difference end indicator
                        if (currentdiff[2] === 1) {
                            if (currentdiff[0] === 0) {
                                dataA[0] = dataA[0].replace(regStart, strStart + strEnd);
                            } else if (currentdiff[0] === dataMinLength) {
                                if (dataB.length === dataMinLength) {
                                    dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                                } else {
                                    dataA[currentdiff[0] - 1] = dataA[currentdiff[0] - 1] + strEnd;
                                }
                            } else {
                                if (dataA[currentdiff[0]].indexOf(strStart) > -1) {
                                    dataA[currentdiff[0]] = dataA[currentdiff[0]] + strEnd;
                                } else {
                                    dataA[currentdiff[0]] = strEnd + dataA[currentdiff[0]];
                                }
                            }
                            if (currentdiff[1] > dataB.length - 1 || currentdiff[0] === dataMinLength) {
                                dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                            } else {
                                dataB[currentdiff[1]] = strEnd + dataB[currentdiff[1]];
                            }
                        } else {
                            if (currentdiff[0] === 0) {
                                dataB[0] = dataB[0].replace(regStart, strStart + strEnd);
                            } else if (currentdiff[0] === dataMinLength) {
                                if (dataA.length === dataMinLength) {
                                    dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                                } else {
                                    dataB[currentdiff[0] - 1] = dataB[currentdiff[0] - 1] + strEnd;
                                }
                            } else {
                                if (dataB[currentdiff[0]].indexOf(strStart) > -1) {
                                    dataB[currentdiff[0]] = dataB[currentdiff[0]] + strEnd;
                                } else {
                                    dataB[currentdiff[0]] = strEnd + dataB[currentdiff[0]];
                                }
                            }
                            if (currentdiff[1] > dataA.length - 1 || currentdiff[0] === dataMinLength) {
                                dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                            } else {
                                dataA[currentdiff[1]] = strEnd + dataA[currentdiff[1]];
                            }
                        }
                        //we must rebase the array with the shorter difference
                        //so that the end of the current difference is on the
                        //same index.  This provides a common baseline by which
                        //to find the next unmatching index
                        if (currentdiff[1] > currentdiff[0] && currentdiff[1] - currentdiff[0] < 1000) {
                            if (currentdiff[2] === 1) {
                                do {
                                    dataA.unshift("");
                                    currentdiff[0] += 1;
                                } while (currentdiff[1] > currentdiff[0]);
                            } else {
                                do {
                                    dataB.unshift("");
                                    currentdiff[0] += 1;
                                } while (currentdiff[1] > currentdiff[0]);
                            }
                        }
                        //since the previous logic will grow the shorter array
                        //we have to redefine the shortest length
                        dataMinLength = Math.min(dataA.length, dataB.length);
                        //assign the incrementer to the end of the longer difference
                        b             = currentdiff[1];
                    }
                }
                //if one array is longer than the other and not identified as different
                //then identify this difference in length
                if (dataA.length > dataB.length && dataB[dataB.length - 1] !== undefined && dataB[dataB.length - 1].indexOf(strEnd) < 0) {
                    dataB.push(strStart + strEnd);
                    dataA[dataB.length - 1] = strStart + dataA[dataB.length - 1];
                    dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                    errorout                += 1;
                }
                if (dataB.length > dataA.length && dataA[dataA.length - 1] !== undefined && dataA[dataA.length - 1].indexOf(strEnd) < 0) {
                    dataA.push(strStart + strEnd);
                    dataB[dataA.length - 1] = strStart + dataB[dataA.length - 1];
                    dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                    errorout                += 1;
                }
                //options.diffcli output doesn't need XML protected characters
                //to be escaped because its output is the command line
                if (options.diffcli === true) {
                    return [
                        dataA.join("")
                            .replace(regStart, "<pd>")
                            .replace(regEnd, "</pd>"),
                        dataB.join("")
                            .replace(regStart, "<pd>")
                            .replace(regEnd, "</pd>")
                    ];
                }
                return [
                    dataA.join("")
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(regStart, "<em>")
                        .replace(regEnd, "</em>"),
                    dataB.join("")
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(regStart, "<em>")
                        .replace(regEnd, "</em>")
                ];
            };
        if (options.diffcli === false) {
            if (options.inline === true) {
                node.push("<h3 class='texttitle'>");
                node.push(options.sourcelabel);
                node.push(" vs. ");
                node.push(options.difflabel);
                node.push("</h3><ol class='count'>");
            } else {
                data[0].push("<div class='diff-left'><h3 class='texttitle'>");
                data[0].push(options.sourcelabel);
                data[0].push("</h3><ol class='count'>");
                data[2].push("<div class='diff-right'><h3 class='texttitle'>");
                data[2].push(options.difflabel);
                data[2].push("</h3><ol class='count' style='cursor:w-resize'>");
            }
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
                //apply options.context collapsing for the output, if needed
                if (options.context > -1 && opcodes.length > 1 && ((a > 0 && i === options.context) || (a === 0 && i === 0)) && change === "equal") {
                    ctest = false;
                    jump  = rowcnt - ((a === 0
                        ? 1
                        : 2) * options.context);
                    if (jump > 1) {
                        foldcount += 1;
                        baseStart += jump;
                        newStart  += jump;
                        i         += jump - 1;
                        if (options.diffcli === true) {
                            data[5].push([baseStart, newStart]);
                        } else {
                            data[0].push("<li>...</li>");
                            if (options.inline === false) {
                                data[1].push("<li class='skip'>&#10;</li>");
                            }
                            data[2].push("<li>...</li>");
                            data[3].push("<li class='skip'>&#10;</li>");
                        }
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
                if (options.diffcli === true) {
                    //data array schema:
                    //0 - base line number
                    //1 - base code line
                    //2 - new line number
                    //3 - new code line
                    //4 - change
                    //5 - index of options.context (not parallel)
                    if (ntest === true || change === "insert") {
                        data[0].push(0);
                        data[1].push("");
                        data[2].push(newStart + 1);
                        data[3].push(newTextArray[newStart]);
                        data[4].push("insert");
                        errorout += 1;
                    } else if (btest === true || change === "delete") {
                        data[0].push(baseStart + 1);
                        data[1].push(baseTextArray[baseStart]);
                        data[2].push(0);
                        data[3].push("");
                        data[4].push("delete");
                        errorout += 1;
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
                                errorout       += 1;
                            }
                        }
                        if (baseStart < baseEnd) {
                            data[0].push(baseStart + 1);
                            if (newStart < newEnd) {
                                data[1].push(charcompOutput[0]);
                            } else {
                                data[1].push(baseTextArray[baseStart]);
                            }
                            data[2].push(0);
                            data[3].push("");
                            data[4].push("delete");
                        }
                        if (newStart < newEnd) {
                            data[0].push(0);
                            data[1].push("");
                            data[2].push(newStart + 1);
                            if (baseStart < baseEnd) {
                                data[3].push(charcompOutput[1]);
                            } else {
                                data[3].push(newTextArray[newStart]);
                            }
                            data[4].push("insert");
                        }
                    } else if (baseStart < baseEnd || newStart < newEnd) {
                        data[0].push(baseStart + 1);
                        data[1].push(baseTextArray[baseStart]);
                        data[2].push(newStart + 1);
                        data[3].push(newTextArray[newStart]);
                        data[4].push(change);
                        if (change !== "equal") {
                            errorout += 1;
                        }
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

                    //this is the final of the three primary components
                    //this is where the output is built
                } else if (options.inline === true) {
                    if (options.context < 0 && baseTextArray[baseStart - 1] === newTextArray[newStart - 1] && baseTextArray[baseStart] !== newTextArray[newStart] && foldstart > 0) {
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
                        errorout  += 1;
                    } else if (btest === true || change === "delete") {
                        data[0].push("<li>");
                        data[0].push(baseStart + 1);
                        data[0].push("</li>");
                        data[2].push("<li class='empty'>&#8203;&#10;</li>");
                        data[3].push("<li class='delete'>");
                        data[3].push(baseTextArray[baseStart]);
                        data[3].push("&#10;</li>");
                        foldcount += 1;
                        errorout  += 1;
                    } else if (change === "replace") {
                        if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                            if (baseTextArray[baseStart] === "") {
                                charcompOutput = [
                                    "", newTextArray[newStart]
                                ];
                                errorout       += 1;
                            } else if (newTextArray[newStart] === "") {
                                charcompOutput = [
                                    baseTextArray[baseStart], ""
                                ];
                                errorout       += 1;
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
                            errorout  += 1;
                        }
                    } else if (baseStart < baseEnd || newStart < newEnd) {
                        foldcount += 1;
                        if (options.context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                            foldstart = data[0].length;
                            if (a === opcodesLength - 1) {
                                if (baseEnd > newEnd) {
                                    data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (baseEnd + 3) + "'>");
                                } else {
                                    data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (newEnd + 3) + "'>");
                                }
                            } else {
                                data[0].push("<li class='fold' title='folds from line " + foldcount + " to line xxx'>");
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
                        if (change !== "equal") {
                            errorout += 1;
                        }
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
                    if (options.context < 0 && baseTextArray[baseStart] !== newTextArray[newStart]) {
                        data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                    }
                    if (btest === false && ntest === false && typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] === "string") {
                        if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "") {
                            change = "insert";
                        }
                        if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                            change = "delete";
                        }
                        if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseTextArray[baseStart] !== newTextArray[newStart]) {
                            charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                        } else {
                            charcompOutput = [
                                baseTextArray[baseStart], newTextArray[newStart]
                            ];
                        }
                        if (baseStart === Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1 || newStart === Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                            repeat = true;
                        }
                        if (repeat === false) {
                            foldcount += 1;
                            if (baseStart < baseEnd) {
                                if (options.context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (a > 1 && opcodes[a - 1][0] !== "equal" && baseStart === opcodes[a - 1][2]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                                    if (a === opcodesLength - 1) {
                                        if (baseEnd > newEnd) {
                                            data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (baseEnd + 2) + "'>- " + (baseStart + 1) + "</li>");
                                        } else {
                                            data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (baseEnd + 1 + foldback) + "'>- " + (baseStart + 1) + "</li>");
                                        }
                                    } else {
                                        foldstart = data[0].length;
                                        data[0].push("<li class='fold' title='folds from line " + (baseStart + 1) + " to line xxx'>- " + (baseStart + 1) + "</li>");
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
                                data[1].push(charcompOutput[0]);
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
                                    foldback  += 1;
                                    foldcount -= 1;
                                } else if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                    data[3].push("empty");
                                } else {
                                    data[3].push(change);
                                }
                                data[3].push("'>");
                                data[3].push(charcompOutput[1]);
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
        if (typeof data[0][foldstart] === "string") {
            data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
        }
        if (options.diffcli === true) {
            data.push(errorout);
            return data;
        }
        node.push(data[0].join(""));
        node.push("</ol><ol class=");
        if (options.inline === true) {
            node.push("'count'>");
        } else {
            node.push("'data'>");
            node.push(data[1].join(""));
            node.push("</ol></div>");
        }
        node.push(data[2].join(""));
        node.push("</ol><ol class='data'>");
        node.push(data[3].join(""));
        if (options.inline === true) {
            node.push("</ol>");
        } else {
            node.push("</ol></div>");
        }
        node.push("<p class='author'>Diff view written by <a href='http://prettydiff.com/'>Pretty D" +
                "iff</a>.</p></div>");
        finaldoc = node.join("");
        return [
            finaldoc.replace(/li\ class='equal'><\/li/g, "li class='equal'>&#10;</li")
                .replace(/\$#gt;/g, "&gt;")
                .replace(/\$#lt;/g, "&lt;")
                .replace(/%#lt;/g, "$#lt;")
                .replace(/%#gt;/g, "$#gt;"),
            errorout,
            diffline
        ];
    }());
};
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api     = function commonjs(x) {
        "use strict";
        return diffview(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api     = function requirejs_export(x) {
            return diffview(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
