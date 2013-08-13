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
        var errorout = 0,
            //diffline is a count of lines that are not equal
            diffline = 0,
            baseTextLines = (typeof args.baseTextLines === "string") ? args.baseTextLines : "Error: Cannot build diff view; baseTextLines is not defined.",
            newTextLines = (typeof args.newTextLines === "string") ? args.newTextLines : "Error: Cannot build diff view; newTextLines is not defined.",
            baseTextName = (typeof args.baseTextName === "string") ? args.baseTextName : "Base Source",
            newTextName = (typeof args.newTextName === "string") ? args.newTextName : "New Source",
            context = ((/^([0-9]+)$/).test(args.contextSize)) ? Number(args.contextSize) : -1,
            tsize = ((/^([0-9]+)$/).test(args.tsize)) ? Number(args.tsize) : 4,
            tchar = (typeof args.tchar === "string") ? args.tchar : " ",
            inline = (args.inline === true) ? true : false,
            //tab is a construct of a standard indentation for code
            tab = (function diffview__tab() {
                var b = 0,
                    c = [];
                if (tchar === "") {
                    return "";
                }
                for (b = 0; b < tsize; b += 1) {
                    c.push(tchar);
                }
                return c.join("");
            }()),
            //translates source code from a string to an array by
            //splitting on line breaks
            stringAsLines = function diffview__stringAsLines(str) {
                var lfpos = str.indexOf("\n"),
                    crpos = str.indexOf("\r"),
                    linebreak = ((lfpos > -1 && crpos > -1) || crpos < 0) ? "\n" : "\r",
                    lines = "";
                if (linebreak === "\n") {
                    str = str.replace(/\r/g, "");
                } else {
                    str = str.replace(/\n/g, "");
                }
                lines = str.replace(/\&/g, "&amp;").replace(/\$#lt;/g, "$#lt;").replace(/\$#gt;/g, "$#gt;").replace(/</g, "$#lt;").replace(/>/g, "$#gt;");
                return lines.split(linebreak);
            },
            //array representation of base source
            bta = stringAsLines(baseTextLines),
            //array representation of new source
            nta = stringAsLines(newTextLines),
            //the core algorithm.  This logic is not mine even though I
            //have largely rewritten it for performance.  It determines
            //the largest common subsequence calculations between lines
            //of code
            opcodes = (function diffview__opcodes() {
                var junkdict = {},
                    isbjunk = function diffview__opcodes_isbjunk(key) {
                        if (junkdict.hasOwnProperty(key)) {
                            return junkdict[key];
                        }
                    },
                    a = [],
                    b = [],
                    reverse = false,
                    matching_blocks = [],
                    bxj = [],
                    answer = [],
                    get_matching_blocks = function diffview__opcodes_getMatchingBlocks() {
                        var c = 0,
                            d = 0,
                            alo = 0,
                            ahi = 0,
                            blo = 0,
                            bhi = 0,
                            qi = [],
                            i = 0,
                            j = 0,
                            k = 0,
                            x = [],
                            i1 = 0,
                            i2 = 0,
                            j1 = 0,
                            j2 = 0,
                            k1 = 0,
                            k2 = 0,
                            la = a.length,
                            lb = b.length,
                            queue = [
                                [
                                    0, la, 0, lb
                                ]
                            ],
                            non_adjacent = [],
                            ntuplecomp = function diffview__opcodes_getMatchingBlocks_ntuplecomp(x, y) {
                                var ii = 0,
                                    mlen = Math.max(x.length, y.length);
                                for (ii = 0; ii < mlen; ii += 1) {
                                    if (x[ii] < y[ii]) {
                                        return -1;
                                    }
                                    if (x[ii] > y[ii]) {
                                        return 1;
                                    }
                                }
                                return (x.length === y.length) ? 0 : ((x.length < y.length) ? -1 : 1);
                            },
                            find_longest_match = function diffview__opcodes_getMatchingBlocks_findLongestMatch(alo, ahi, blo, bhi) {
                                var cc = 0,
                                    dd = bxj.length,
                                    ii = 0,
                                    jj = 0,
                                    kk = 0,
                                    l = [
                                        0, 0
                                    ],
                                    besti = alo,
                                    bestj = blo,
                                    bestsize = 0;
                                for (ii = alo; ii < ahi; ii += 1) {
                                    for (cc = 0; cc < dd; cc += 1) {
                                        if (bxj[cc][1] === a[ii] && (a[ii] !== b[ii] || ii === ahi - 1 || a[ii + 1] === b[ii + 1])) {
                                            jj = bxj[cc][0];
                                            break;
                                        }
                                    }
                                    if (cc !== dd) {
                                        if (jj >= blo) {
                                            if (jj >= bhi) {
                                                break;
                                            }
                                            if (l[0] === jj - 1) {
                                                kk = l[1] + 1;
                                            } else {
                                                kk = 1;
                                            }
                                            if (kk > bestsize) {
                                                besti = ii - kk + 1;
                                                bestj = jj - kk + 1;
                                                bestsize = kk;
                                            }
                                        }
                                        l = [
                                            jj, kk
                                        ];
                                    }
                                }
                                while (besti > alo && bestj > blo && !isbjunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
                                    besti -= 1;
                                    bestj -= 1;
                                    bestsize += 1;
                                }
                                while (besti + bestsize < ahi && bestj + bestsize < bhi && !isbjunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
                                    bestsize += 1;
                                }
                                while (besti > alo && bestj > blo && isbjunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
                                    besti -= 1;
                                    bestj -= 1;
                                    bestsize += 1;
                                }
                                while (besti + bestsize < ahi && bestj + bestsize < bhi && isbjunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
                                    bestsize += 1;
                                }
                                return [
                                    besti, bestj, bestsize
                                ];
                            };
                        while (queue.length) {
                            qi = queue.pop();
                            alo = qi[0];
                            ahi = qi[1];
                            blo = qi[2];
                            bhi = qi[3];
                            x = find_longest_match(alo, ahi, blo, bhi);
                            i = x[0];
                            j = x[1];
                            k = x[2];
                            if (k > 0) {
                                matching_blocks.push(x);
                                if (alo < i && blo < j) {
                                    queue.push([
                                        alo, i, blo, j
                                    ]);
                                }
                                if (i + k < ahi && j + k < bhi) {
                                    queue.push([
                                        i + k, ahi, j + k, bhi
                                    ]);
                                }
                            }
                        }
                        matching_blocks.sort(ntuplecomp);
                        d = matching_blocks.length;
                        for (c = 0; c < d; c += 1) {
                            i2 = matching_blocks[c][0];
                            j2 = matching_blocks[c][1];
                            k2 = matching_blocks[c][2];
                            if (i1 + k1 === i2 && j1 + k1 === j2) {
                                k1 += k2;
                            } else {
                                if (k1) {
                                    non_adjacent.push([
                                        i1, j1, k1
                                    ]);
                                }
                                i1 = i2;
                                j1 = j2;
                                k1 = k2;
                            }
                        }
                        if (k1) {
                            non_adjacent.push([
                                i1, j1, k1
                            ]);
                        }
                        non_adjacent.push([
                            la, lb, 0
                        ]);
                        return non_adjacent;
                    };
                (function diffview__opcodes_diffArray() {
                    (function diffview__opcodes_diffArray_determineReverse() {
                        if (bta.length > nta.length) {
                            reverse = true;
                            a = nta;
                            b = bta;
                        } else {
                            a = bta;
                            b = nta;
                        }
                    }());
                    (function diffview__opcodes_diffArray_clarity() {
                        var i = 0,
                            c = 0,
                            elt = "",
                            n = b.length;
                        for (i = 0; i < n; i += 1) {
                            elt = b[i];
                            for (c = bxj.length - 1; c > -1; c -= 1) {
                                if (bxj[c][1] === elt) {
                                    break;
                                }
                            }
                            if (c > -1) {
                                if (n >= 200 && 100 > n) {
                                    bxj.splice(c, 1);
                                }
                            } else {
                                bxj.push([
                                    i, elt
                                ]);
                            }
                        }
                    }());
                    (function diffview__opcodes_diffArray_algorithm() {
                        var ai = 0,
                            bj = 0,
                            size = 0,
                            tag = "",
                            c = 0,
                            i = 0,
                            j = 0,
                            blocks = get_matching_blocks(),
                            d = blocks.length,
                            closerMatch = function diffview__opcodes_diffArray_algorithm_closerMatch(x, y, z) {
                                var diffspot = function diffview__opcodes_diffArray_algorithm_closerMatch_diffspot(a, b) {
                                        var cc = a.replace(/^(\s+)/, "").split(""),
                                            dd = Math.min(cc.length, b.length),
                                            e = 0;
                                        for (e = 0; e < dd; e += 1) {
                                            if (cc[e] !== b[e]) {
                                                return e;
                                            }
                                        }
                                        return e;
                                    },
                                    zz = z.replace(/^(\s+)/, "").split(""),
                                    test = diffspot(y, zz) - diffspot(x, zz);
                                if (test > 0) {
                                    return true;
                                }
                                return false;
                            };
                        for (c = 0; c < d; c += 1) {
                            ai = blocks[c][0];
                            bj = blocks[c][1];
                            size = blocks[c][2];
                            tag = "";
                            if (i < ai && j < bj) {
                                if (i - j !== ai - bj && j - bj < 3 && i - ai < 3) {
                                    if (reverse && i - ai > j - bj) {
                                        if (closerMatch(b[j], b[j + 1], a[i])) {
                                            answer.push([
                                                "delete", j, j + 1, i, i
                                            ]);
                                            answer.push([
                                                "replace", j + 1, bj, i, ai
                                            ]);
                                        } else {
                                            answer.push([
                                                "replace", j, bj, i, ai
                                            ]);
                                        }
                                    } else if (!reverse && bj - j > ai - i) {
                                        if (closerMatch(b[j], b[j + 1], a[i])) {
                                            answer.push([
                                                "insert", i, i, j, j + 1
                                            ]);
                                            answer.push([
                                                "replace", i, ai, j + 1, bj
                                            ]);
                                        } else {
                                            answer.push([
                                                "replace", i, ai, j, bj
                                            ]);
                                        }
                                    } else {
                                        tag = "replace";
                                    }
                                } else {
                                    tag = "replace";
                                }
                            } else if (i < ai) {
                                if (reverse) {
                                    tag = "insert";
                                } else {
                                    tag = "delete";
                                }
                            } else if (j < bj) {
                                if (reverse) {
                                    tag = "delete";
                                } else {
                                    tag = "insert";
                                }
                            }
                            if (tag !== "") {
                                if (reverse) {
                                    answer.push([
                                        tag, j, bj, i, ai
                                    ]);
                                } else {
                                    answer.push([
                                        tag, i, ai, j, bj
                                    ]);
                                }
                            }
                            i = ai + size;
                            j = bj + size;
                            if (size > 0) {
                                if (reverse) {
                                    answer.push([
                                        "equal", bj, j, ai, i
                                    ]);
                                } else {
                                    answer.push([
                                        "equal", ai, i, bj, j
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
            var node = ["<div class='diff'>"],
                data = [
                    [], [], [], []
                ],
                idx = 0,
                b = 0,
                be = 0,
                n = 0,
                ne = 0,
                rowcnt = 0,
                i = 0,
                jump = 0,
                tb = (tab === "") ? "" : new RegExp("^((" + tab.replace(/\\/g, "\\") + ")+)"),
                noTab = function diffview__report_noTab(str) {
                    var a = 0,
                        bb = str.length,
                        c = [];
                    for (a = 0; a < bb; a += 1) {
                        c.push(str[a].replace(tb, ""));
                    }
                    return c;
                },
                btab = (tab === "") ? [] : noTab(bta),
                ntab = (tab === "") ? [] : noTab(nta),
                opleng = opcodes.length,
                change = "",
                btest = false,
                ntest = false,
                ctest = true,
                code = [],
                z = [],
                //this is the character comparison logic that performs
                //the 'largest common subsequence' between two lines of
                //code
                charcomp = function diffview__report_charcomp(c, d) {
                    var aa = [],
                        bb = [],
                        cc = c.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, ">").replace(/&gt;/g, "<"),
                        dd = d.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, ">").replace(/&gt;/g, "<"),
                        ee = 0,
                        ff = 0,
                        ja = [],
                        jj = 0,
                        jt = false,
                        ka = [],
                        kt = false,
                        kk = 0,
                        ll = [],
                        rs = (/ _pdiffdiff_/g),
                        rrs = (/_pdiffdiff_/g),
                        rrt = (/_epdiffdiff_/g),
                        ss = "_pdiffdiff_",
                        tt = "_epdiffdiff_",
                        xx = 0,
                        tabdiff = (function diffview__report_charcomp_tabdiff() {
                            var aaa = "",
                                bbb = "",
                                ccc = "",
                                ddd = "",
                                eee = [],
                                fff = cc.match(tb),
                                ggg = dd.match(tb);
                            if (fff === null || ggg === null || (fff[0] === "" && fff.length === 1) || (ggg[0] === "" && ggg.length === 1)) {
                                return ["", "", cc, dd];
                            }
                            aaa = cc.match(tb)[0];
                            bbb = dd.match(tb)[0];
                            ccc = cc.split(aaa)[1];
                            ddd = dd.split(bbb)[1];
                            if (aaa.length > bbb.length) {
                                eee = aaa.split(bbb);
                                aaa = bbb + ss + eee[1] + tt;
                                bbb = bbb + ss + tt;
                            } else {
                                eee = bbb.split(aaa);
                                bbb = aaa + ss + eee[1] + tt;
                                aaa = aaa + ss + tt;
                            }
                            errorout += 1;
                            return [aaa, bbb, ccc, ddd];
                        }());
                    if (cc === dd) {
                        return [cc, dd];
                    }
                    errorout -= 1;
                    if (tb !== "" && cc.length !== dd.length && cc.replace(tb, "") === dd.replace(tb, "")) {
                        return [
                            (tabdiff[0] + tabdiff[2]).replace(rrs, "<em>").replace(rrt, "</em>"), (tabdiff[1] + tabdiff[3]).replace(rrs, "<em>").replace(rrt, "</em>")
                        ];
                    }
                    aa = cc.split("");
                    bb = dd.split("");
                    ff = Math.min(aa.length, bb.length);
                    for (ee = 0; ee < ff; ee += 1) {
                        if (aa[ee] === undefined || bb[ee] === undefined) {
                            break;
                        }
                        if (aa[ee] !== bb[ee]) {
                            jt = false;
                            kt = false;
                            ll.push(ff);
                            ll.push(ff);
                            aa[ee] = ss + aa[ee];
                            bb[ee] = ss + bb[ee];
                            errorout += 1;
                            for (xx = ee; xx < ff; xx += 1) {
                                if (jt === false) {
                                    for (jj = xx; jj < ff; jj += 1) {
                                        if (aa[xx] === bb[jj]) {
                                            if (xx === ee) {
                                                xx -= 1;
                                            }
                                            ja.push(xx - 1);
                                            ja.push(jj - 1);
                                            jt = true;
                                            break;
                                        }
                                    }
                                    if (xx === ff - 1 && jj === ff) {
                                        jt = true;
                                    }
                                }
                                if (kt === false) {
                                    for (kk = xx; kk < ff; kk += 1) {
                                        if (bb[xx] === aa[kk]) {
                                            if (xx === ee) {
                                                xx -= 1;
                                            }
                                            ka.push(kk - 1);
                                            ka.push(xx - 1);
                                            kt = true;
                                            break;
                                        }
                                    }
                                    if (xx === ff - 1 && kk === ff) {
                                        kt = true;
                                    }
                                }
                                if (jt === true && kt === true) {
                                    if (kk < jj) {
                                        ll.pop();
                                        ll.pop();
                                        ll.push(ka[0]);
                                        ll.push(ka[1]);
                                    } else if (jj < kk) {
                                        ll.pop();
                                        ll.pop();
                                        ll.push(ja[0]);
                                        ll.push(ja[1]);
                                    } else if (jj === kk && jj < ff) {
                                        ll.pop();
                                        ll.pop();
                                        ll.push(ja[0]);
                                        ll.push(ja[1]);
                                    }
                                    break;
                                }
                            }
                            if (ll[0] === ff || ll[1] === ff) {
                                if (aa[ee].replace(rrs, "") === bb[bb.length - 1]) {
                                    aa[ee] = ss + tt + aa[ee].replace(rrs, "");
                                    bb[bb.length - 1] = tt + bb[bb.length - 1];
                                } else if (bb[ee].replace(rrs, "") === aa[aa.length - 1]) {
                                    bb[ee] = ss + tt + bb[ee].replace(rrs, "");
                                    aa[aa.length - 1] = tt + aa[aa.length - 1];
                                } else {
                                    aa.push(tt);
                                    bb.push(tt);
                                }
                                break;
                            }
                            if (aa[ll[0]] === bb[ee].replace(rrs, "")) {
                                aa[ll[0]] = aa[ll[0]] + tt;
                                if (ll[1] === ee) {
                                    bb[ll[1]] = ss + tt + bb[ll[1]].replace(rrs, "");
                                } else {
                                    bb[ll[1]] = tt + bb[ll[1]];
                                }
                            } else if (aa[ee] === bb[ll[1]]) {
                                if (ll[0] === ee) {
                                    aa[ll[0]] = ss + tt + aa[ll[0]].replace(rrs, "");
                                } else {
                                    aa[ll[0]] = tt + aa[ll[0]];
                                }
                                bb[ll[1]] = bb[ll[1]] + tt;
                            } else {
                                aa[ll[0]] = aa[ll[0]] + tt;
                                bb[ll[1]] = bb[ll[1]] + tt;
                            }
                            if (ll[1] - ll[0] > 0) {
                                for (xx = (ll[1] - ll[0]) + ee; xx > ee; xx -= 1) {
                                    aa.splice(0, 0, "");
                                }
                            }
                            if (ll[0] - ll[1] > 0) {
                                for (xx = (ll[0] - ll[1]) + ee; xx > ee; xx -= 1) {
                                    bb.splice(0, 0, "");
                                }
                            }
                            ee = Math.max(ll[0], ll[1]);
                            ff = Math.min(aa.length, bb.length);
                            ja.pop();
                            ja.pop();
                            ka.pop();
                            ka.pop();
                            ll.pop();
                            ll.pop();
                        }
                    }
                    return [
                        aa.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(rrs, "<em>").replace(rrt, "</em>"), bb.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(rrs, "<em>").replace(rrt, "</em>")
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
                data[2].push("</h3><ol class='count' onmousedown='pd.colSliderGrab(this);' style='cursor:w-resize'>");
            }
            for (idx = 0; idx < opleng; idx += 1) {
                code = opcodes[idx];
                change = code[0];
                b = code[1];
                be = code[2];
                n = code[3];
                ne = code[4];
                rowcnt = Math.max(be - b, ne - n);
                ctest = true;
                for (i = 0; i < rowcnt; i += 1) {
                    //apply context collapsing for the output, if needed
                    if (!isNaN(context) && context > -1 && opcodes.length > 1 && ((idx > 0 && i === context) || (idx === 0 && i === 0)) && change === "equal") {
                        ctest = false;
                        jump = rowcnt - ((idx === 0 ? 1 : 2) * context);
                        if (jump > 1) {
                            data[0].push("<li>...</li>");
                            if (inline === false) {
                                data[1].push("<li class='skip'>&#10;</li>");
                            }
                            data[2].push("<li>...</li>");
                            data[3].push("<li class='skip'>&#10;</li>");
                            b += jump;
                            n += jump;
                            i += jump - 1;
                            if (idx + 1 === opcodes.length) {
                                break;
                            }
                        }
                    }
                    if (bta[b] === nta[n]) {
                        change = "equal";
                    } else if (change === "equal") {
                        change = "replace";
                    }
                    //count the lines of differences
                    if (change !== "equal") {
                        diffline += 1;
                    }
                    //this is a check against false positives incurred
                    //by increasing or reducing of nesting.  At this
                    //time it only checks one level deep.
                    if (tab !== "") {
                        if (!btest && bta[be] !== nta[ne] && typeof bta[b + 1] === "string" && typeof nta[n] === "string" && btab[b + 1] === ntab[n] && btab[b] !== ntab[n] && (typeof nta[n - 1] !== "string" || btab[b] !== ntab[n - 1])) {
                            btest = true;
                        } else if (!ntest && bta[be] !== nta[ne] && typeof nta[n + 1] === "string" && typeof bta[b] === "string" && ntab[n + 1] === btab[b] && ntab[n] !== btab[b] && (typeof bta[b - 1] !== "string" || ntab[n] !== btab[b - 1])) {
                            ntest = true;
                        }
                    }
                    //this is the final of the three primary components
                    //this is where the output is built
                    if (inline === true) {
                        if (ntest || change === "insert") {
                            data[0].push("<li class='empty'>&#8203;&#10;</li>");
                            data[2].push("<li>");
                            data[2].push(n + 1);
                            data[2].push("&#10;</li>");
                            data[3].push("<li class='insert'>");
                            data[3].push(nta[n]);
                            data[3].push("&#10;</li>");
                        } else if (btest || change === "delete") {
                            data[0].push("<li>");
                            data[0].push(b + 1);
                            data[0].push("</li>");
                            data[2].push("<li class='empty'>&#8203;&#10;</li>");
                            data[3].push("<li class='delete'>");
                            data[3].push(bta[b]);
                            data[3].push("&#10;</li>");
                        } else if (change === "replace") {
                            if (bta[b] !== nta[n]) {
                                if (bta[b] === "") {
                                    z = [
                                        "", nta[n]
                                    ];
                                } else if (nta[n] === "") {
                                    z = [
                                        bta[b], ""
                                    ];
                                } else if (b < be && n < ne) {
                                    z = charcomp(bta[b], nta[n]);
                                }
                            }
                            if (b < be) {
                                data[0].push("<li>");
                                data[0].push(b + 1);
                                data[0].push("</li>");
                                data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                data[3].push("<li class='delete'>");
                                if (n < ne) {
                                    data[3].push(z[0]);
                                } else {
                                    data[3].push(bta[b]);
                                }
                                data[3].push("&#10;</li>");
                            }
                            if (n < ne) {
                                data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                data[2].push("<li>");
                                data[2].push(n + 1);
                                data[2].push("</li>");
                                data[3].push("<li class='insert'>");
                                if (b < be) {
                                    data[3].push(z[1]);
                                } else {
                                    data[3].push(nta[n]);
                                }
                                data[3].push("&#10;</li>");
                            }
                        } else if (b < be || n < ne) {
                            data[0].push("<li>");
                            data[0].push(b + 1);
                            data[0].push("</li>");
                            data[2].push("<li>");
                            data[2].push(n + 1);
                            data[2].push("</li>");
                            data[3].push("<li class='");
                            data[3].push(change);
                            data[3].push("'>");
                            data[3].push(bta[b]);
                            data[3].push("&#10;</li>");
                        }
                        if (btest) {
                            b += 1;
                            btest = false;
                        } else if (ntest) {
                            n += 1;
                            ntest = false;
                        } else {
                            b += 1;
                            n += 1;
                        }
                    } else {
                        if (!btest && !ntest && typeof bta[b] === "string" && typeof nta[n] === "string") {
                            if (bta[b] === "" && nta[n] !== "") {
                                change = "insert";
                            }
                            if (nta[n] === "" && bta[b] !== "") {
                                change = "delete";
                            }
                            if (change === "replace" && b < be && n < ne && bta[b] !== nta[n]) {
                                z = charcomp(bta[b], nta[n]);
                            } else {
                                z = [];
                            }
                            if (b < be) {
                                if (bta[b] === "") {
                                    data[0].push("<li class='empty'>&#10;");
                                } else {
                                    data[0].push("<li>" + (b + 1));
                                }
                                data[0].push("</li>");
                                data[1].push("<li class='");
                                if (n >= ne) {
                                    data[1].push("delete");
                                } else if (bta[b] === "" && nta[n] !== "") {
                                    data[1].push("empty");
                                } else {
                                    data[1].push(change);
                                }
                                data[1].push("'>");
                                if (z.length === 2) {
                                    data[1].push(z[0]);
                                } else {
                                    data[1].push(bta[b]);
                                }
                                data[1].push("&#10;</li>");
                            } else if (ctest) {
                                data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                data[1].push("<li class='empty'>&#8203;</li>");
                            }
                            if (n < ne) {
                                if (nta[n] === "") {
                                    data[2].push("<li class='empty'>&#10;");
                                } else {
                                    data[2].push("<li>" + (n + 1));
                                }
                                data[2].push("</li>");
                                data[3].push("<li class='");
                                if (b >= be) {
                                    data[3].push("insert");
                                } else if (nta[n] === "" && bta[b] !== "") {
                                    data[3].push("empty");
                                } else {
                                    data[3].push(change);
                                }
                                data[3].push("'>");
                                if (z.length === 2) {
                                    data[3].push(z[1]);
                                } else {
                                    data[3].push(nta[n]);
                                }
                                data[3].push("&#10;</li>");
                            } else if (ctest) {
                                data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                data[3].push("<li class='empty'>&#8203;</li>");
                            }
                            if (b < be) {
                                b += 1;
                            }
                            if (n < ne) {
                                n += 1;
                            }
                        } else if (btest || (typeof bta[b] === "string" && typeof nta[n] !== "string")) {
                            data[0].push("<li>");
                            data[0].push(b + 1);
                            data[0].push("</li>");
                            data[1].push("<li class='delete'>");
                            data[1].push(bta[b]);
                            data[1].push("&#10;</li>");
                            data[2].push("<li class='empty'>&#8203;&#10;</li>");
                            data[3].push("<li class='empty'>&#8203;</li>");
                            btest = false;
                            b += 1;
                        } else if (ntest || (typeof bta[b] !== "string" && typeof nta[n] === "string")) {
                            data[0].push("<li class='empty'>&#8203;&#10;</li>");
                            data[1].push("<li class='empty'>&#8203;</li>");
                            data[2].push("<li>");
                            data[2].push(n + 1);
                            data[2].push("</li>");
                            data[3].push("<li class='insert'>");
                            data[3].push(nta[n]);
                            data[3].push("&#10;</li>");
                            ntest = false;
                            n += 1;
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