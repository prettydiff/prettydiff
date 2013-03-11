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
                    lines = str.replace(/\&/g, "&amp;").replace(/\$#lt;/g, "%#lt;").replace(/\$#gt;/g, "%#gt;").replace(/</g, "$#lt;").replace(/>/g, "$#gt;");
                if (linebreak === "\n") {
                    str = str.replace(/\r/g, "");
                } else {
                    str = str.replace(/\n/g, "");
                }
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
                                var i = 0,
                                    mlen = Math.max(x.length, y.length);
                                for (i = 0; i < mlen; i += 1) {
                                    if (x[i] < y[i]) {
                                        return -1;
                                    }
                                    if (x[i] > y[i]) {
                                        return 1;
                                    }
                                }
                                return (x.length === y.length) ? 0 : ((x.length < y.length) ? -1 : 1);
                            },
                            find_longest_match = function diffview__opcodes_getMatchingBlocks_findLongestMatch(alo, ahi, blo, bhi) {
                                var c = 0,
                                    d = bxj.length,
                                    i = 0,
                                    j = 0,
                                    k = 0,
                                    l = [
                                        0, 0
                                    ],
                                    besti = alo,
                                    bestj = blo,
                                    bestsize = 0;
                                for (i = alo; i < ahi; i += 1) {
                                    for (c = 0; c < d; c += 1) {
                                        if (bxj[c][1] === a[i] && (a[i] !== b[i] || i === ahi - 1 || a[i + 1] === b[i + 1])) {
                                            j = bxj[c][0];
                                            break;
                                        }
                                    }
                                    if (c !== d) {
                                        if (j >= blo) {
                                            if (j >= bhi) {
                                                break;
                                            }
                                            if (l[0] === j - 1) {
                                                k = l[1] + 1;
                                            } else {
                                                k = 1;
                                            }
                                            if (k > bestsize) {
                                                besti = i - k + 1;
                                                bestj = j - k + 1;
                                                bestsize = k;
                                            }
                                        }
                                        l = [
                                            j, k
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
                                        var c = a.replace(/^(\s+)/, "").split(""),
                                            d = Math.min(c.length, b.length),
                                            e = 0;
                                        for (e = 0; e < d; e += 1) {
                                            if (c[e] !== b[e]) {
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
                        b = str.length,
                        c = [];
                    for (a = 0; a < b; a += 1) {
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
                    var n = false,
                        k = 0,
                        p = 0,
                        r = 0,
                        ax = [],
                        bx = [],
                        ra = "",
                        rb = "",
                        u = [],
                        v = [],
                        zx = 0,
                        //ignore these next two assignments.  I just
                        //wanted to type them as a 'function'.  They
                        //will be defined later
                        entity = function diffview__report_charcomp_emptyE() {
                            return;
                        },
                        compare = function diffview__report_charcomp_emptyC() {
                            return;
                        },
                        emerge = function diffview__report_charcomp_emptyM() {
                            errorout -= 1;
                            return "";
                        },
                        a = c.replace(/\'/g, "$#39;").replace(/\"/g, "$#34;").replace(/\&nbsp;/g, " ").replace(/\&#160;/g, " "),
                        b = d.replace(/\'/g, "$#39;").replace(/\"/g, "$#34;").replace(/\&nbsp;/g, " ").replace(/\&#160;/g, " ");
                    //if the two lines are identical then get out of
                    //this beast without doing any more work
                    if (a === b) {
                        return [
                            c, d
                        ];
                    }
                    if (a.charAt(a.length - 1) === "\r" && b.charAt(b.length - 1) !== "\r") {
                        a = a.substring(0, a.length - 1);
                        ra = "<em>\\r</em>";
                        rb = "<em></em>";
                        errorout += 1;
                    } else if (b.charAt(b.length - 1) === "\r" && a.charAt(a.length - 1) !== "\r") {
                        b = b.substring(0, b.length - 1);
                        rb = "<em>\\r</em>";
                        ra = "<em></em>";
                        errorout += 1;
                    }
                    //if the only difference between two lines is
                    //indentation then show that and not a bunch of
                    //false positives
                    if (tb !== "" && a.length !== b.length && a.replace(tb, "") === b.replace(tb, "")) {
                        return (function diffview__report_charcomp_earlyReturn() {
                            var ax = a.split(tab),
                                bx = b.split(tab),
                                i = 0,
                                j = ax.length,
                                k = bx.length,
                                p = 0;
                            for (i = 0; i < j; i += 1) {
                                if (ax[i].length === 0) {
                                    ax[i] = tab;
                                } else {
                                    break;
                                }
                            }
                            for (p = 0; p < k; p += 1) {
                                if (bx[p].length === 0) {
                                    bx[p] = tab;
                                } else {
                                    break;
                                }
                            }
                            if (j > k) {
                                r = j - k;
                                zx = i - r;
                                ax[zx] = "<em>" + ax[zx];
                                ax[zx + r] = "</em>" + ax[zx + r];
                                bx[p] = "<em></em>" + bx[p];
                            } else {
                                r = k - j;
                                zx = p - r;
                                ax[i] = "<em></em>" + ax[i];
                                bx[zx] = "<em>" + bx[zx];
                                bx[zx + r] = "</em>" + bx[zx + r];
                            }
                            c = ax.join("").replace(/\$#34;/g, "\"").replace(/\$#39;/g, "'");
                            d = bx.join("").replace(/\$#34;/g, "\"").replace(/\$#39;/g, "'");
                            return [
                                c, d
                            ];
                        }());
                    }
                    //decrement errorout once per visit, because just
                    //being here increment errorout even though the
                    //assignment of "delete", "insert", or "replace"
                    //also increments errorout
                    errorout -= 1;
                    ax = a.split("");
                    bx = b.split("");
                    zx = Math.max(ax.length, bx.length);
                    //this beast ensures that character entities are in
                    //a single array index so as to eliminate certain
                    //false positive conditions.  These guys are
                    //multiple characters, but represent a single
                    //character
                    entity = function diffview__report_charcomp_entity(z) {
                        var a = z.length,
                            b = [];
                        for (n = 0; n < a; n += 1) {
                            if (z[n] + z[n + 1] + z[n + 2] + z[n + 3] + z[n + 4] === "$#gt;") {
                                z[n] = "$#gt;";
                                z[n + 1] = "";
                                z[n + 2] = "";
                                z[n + 3] = "";
                                z[n + 4] = "";
                            } else if (z[n] + z[n + 1] + z[n + 2] + z[n + 3] + z[n + 4] === "$#lt;") {
                                z[n] = "$#lt;";
                                z[n + 1] = "";
                                z[n + 2] = "";
                                z[n + 3] = "";
                                z[n + 4] = "";
                            } else if (z[n] + z[n + 1] + z[n + 2] + z[n + 3] + z[n + 4] === "&amp;") {
                                z[n] = "&amp;";
                                z[n + 1] = "";
                                z[n + 2] = "";
                                z[n + 3] = "";
                                z[n + 4] = "";
                            } else if (z[n] + z[n + 1] + z[n + 2] + z[n + 3] + z[n + 4] === "$#34;") {
                                z[n] = "&#34;";
                                z[n + 1] = "";
                                z[n + 2] = "";
                                z[n + 3] = "";
                                z[n + 4] = "";
                            } else if (z[n] + z[n + 1] + z[n + 2] + z[n + 3] + z[n + 4] === "$#39;") {
                                z[n] = "&#39;";
                                z[n + 1] = "";
                                z[n + 2] = "";
                                z[n + 3] = "";
                                z[n + 4] = "";
                            }
                        }
                        for (n = 0; n < a; n += 1) {
                            if (z[n] !== "" && z[n] !== undefined) {
                                b.push(z[n]);
                            }
                        }
                        return b;
                    };
                    ax = entity(ax);
                    bx = entity(bx);
                    n = false;
                    //This is a space based comparison algoritm.  While
                    //this algorithm preceeds the standard per character
                    //comparison algorithm located in the compare
                    //function it is also fault tolerant to it.
                    (function diffview__report_charcomp_spacetest() {
                        var a = c,
                            b = d,
                            tt = tab,
                            ts = new RegExp("^(" + tt + ")+"),
                            e = (a.search(ts) === 0) ? a.match(ts) : [""],
                            f = (b.search(ts) === 0) ? b.match(ts) : [""],
                            g = [],
                            h = [],
                            i = 0,
                            j = 0,
                            l = [
                                0, 0
                            ],
                            m = false,
                            n = [
                                e[0].length, f[0].length
                            ];

                        //if a tab is empty string and the only
                        //difference is indentation then let's bail out
                        //early
                        if (tt === "" && a.replace(/^(\s+)/, "") === b.replace(/^(\s+)/, "")) {
                            i = a.search(/\S/);
                            j = b.search(/\S/);
                            g = a.split("");
                            h = b.split("");
                            ax = [];
                            bx = [];
                            if (i > j) {
                                g[j] = "<em>" + g[j];
                                g[i] = "</em>" + g[i];
                                h[j] = "<em></em>" + h[j];
                                for (i; i > j; i -= 1) {
                                    bx.push("");
                                }
                                k = i + 1;
                            } else {
                                h[i] = "<em>" + h[i];
                                h[j] = "</em>" + h[j];
                                g[i] = "<em></em>" + g[i];
                                for (j; j > i; j -= 1) {
                                    ax.push("");
                                }
                                k = j + 1;
                            }
                            ax = ax.concat(g);
                            bx = bx.concat(h);
                            return;
                        }

                        //remove indentation for accurate comparison
                        if (e[0] !== "") {
                            a = a.substr(n[0]);
                        }
                        if (f[0] !== "") {
                            b = b.substr(n[1]);
                        }
                        //compare indentation
                        if (n[0] > n[1]) {
                            i = n[0] - n[1];
                            e[0] = e[0].substring(0, n[0] - i) + "<em>" + e[0].substr(n[0] - i) + "</em>";
                            f[0] = f[0] + "<em></em>";
                            errorout += 1;
                        }
                        if (n[0] < n[1]) {
                            i = n[1] - n[0];
                            f[0] = f[0].substring(0, n[1] - i) + "<em>" + f[0].substr(n[1] - i) + "</em>";
                            e[0] = e[0] + "<em></em>";
                            errorout += 1;
                        }
                        //split line on spaces
                        g = a.split(" ");
                        h = b.split(" ");
                        j = Math.max(g.length, h.length);
                        //l will contain the string length as this
                        //algorithm progresses
                        l[0] += g[0].length;
                        l[1] += h[0].length;

                        //this loop defines the space based algorithm
                        for (i = 1; i < j; i += 1) {
                            if (g[i] !== h[i] && typeof g[i] === "string" && typeof h[i] === "string") {
                                //when not identical test one index
                                //against the next index of the other
                                //sample
                                if (g[i + 1] === h[i]) {
                                    g[i] = "<em> " + g[i] + "</em>";
                                    h.splice(i, 0, "<em></em>");
                                    if (g.length >= h.length) {
                                        j += 1;
                                    }
                                    m = true;
                                    errorout += 1;
                                } else if (g[i] === h[i + 1]) {
                                    h[i] = "<em> " + h[i] + "</em>";
                                    g.splice(i, 0, "<em></em>");
                                    if (g.length <= h.length) {
                                        j += 1;
                                    }
                                    m = true;
                                    errorout += 1;
                                } else {
                                    //break on the first moment this
                                    //space based algorithm no longer
                                    //applies
                                    break;
                                }
                            } else if (typeof g[i] === "string" && typeof h[i] === "string") {
                                g[i] = " " + g[i];
                                h[i] = " " + h[i];
                            } else {
                                //if indexes are exhausted from either
                                //sample then break
                                break;
                            }
                            //account for character length of each index
                            l[0] += g[i].length;
                            l[1] += h[i].length;
                        }
                        if (m === false) {
                            return;
                        }
                        //if the indexes of either sample are exhausted
                        //then we do not need to provide support for the
                        //other algorithms located in the compare
                        //function
                        if (i === j) {
                            if (typeof g[j] === "string") {
                                g[j] = " " + g[j];
                            }
                            if (typeof h[j] === "string") {
                                h[j] = " " + h[j];
                            }
                            if (g.length > h.length) {
                                g[j] = "<em>" + g[j];
                                g[g.length - 1] = g[g.length - 1] + "</em>";
                            } else if (g.length < h.length) {
                                h[j] = "<em>" + h[j];
                                h[h.length - 1] = h[h.length - 1] + "</em>";
                            }
                            g.splice(0, 0, e[0]);
                            h.splice(0, 0, f[0]);
                            ax = g;
                            bx = h;
                            k = zx;
                        } else {
                            //if the space based algorithm loop broke
                            //early then we must provide support and
                            //coordinate the pieces for the other
                            //algorithms in the compare function
                            //to engage where this left off so that
                            //there is no overlap in the comparison
                            j = Math.max(g.length, h.length);
                            for (i; i < j; i += 1) {
                                g[i] = (typeof g[i] === "string") ? " " + g[i] : "";
                                h[i] = (typeof h[i] === "string") ? " " + h[i] : "";
                            }
                            ax = g.join("").split("");
                            bx = h.join("").split("");
                            if (l[0] !== l[1]) {
                                do {
                                    if (l[0] > l[1]) {
                                        l[1] += 1;
                                        bx.splice(0, 0, "");
                                    } else {
                                        l[0] += 1;
                                        ax.splice(0, 0, "");
                                    }
                                } while (l[0] !== l[1]);
                            }
                            ax.splice(0, 0, e[0]);
                            bx.splice(0, 0, f[0]);
                            k = l[0];
                            zx = Math.max(ax.length, bx.length);
                        }
                    }());

                    //the complex algorithm that compares character
                    //differences
                    compare = function diffview__report_charcomp_compare() {
                        var em = /<em>/g,
                            i = 0,
                            j = 0,
                            m = 0,
                            o = 0,
                            p = [],
                            q = false,
                            s = [],
                            t = [];
                        //x = u[u.length - 1],
                        //y = v[v.length - 1],
                        //z = false;

                        //this first condition is a recursive array to
                        //detect and more accurately condense
                        //differences into fewer results
                        /*if (x !== "" && x === v[v.length - 2] && u.length > 0 && x.length > 0 && x.indexOf("<em>") < x.indexOf("</em>") && x.lastIndexOf("<em>") < x.lastIndexOf("</em>")) {
                            for (i = k; i > -1; i -= 1) {
                                if (ax[i].indexOf("</em>") > -1) {
                                    ax[i] = ax[i].replace("</em>", "");
                                    if (bx[i].indexOf("<em></em>") > -1) {
                                        bx[i] = bx[i].replace("<em></em>", "");
                                        z = true;
                                    } else if (z === true) {
                                        bx[i + 1] = bx[i + 1].replace("</em>", "<em></em>");
                                    } else {
                                        bx[i] = bx[i].replace("</em>", "");
                                    }
                                    if (q === true) {
                                        break;
                                    }
                                }
                                if (ax[i].indexOf("<em>") > -1) {
                                    ax[i] = ax[i].replace("<em>", "");
                                    if (bx[i].indexOf("<em>") > -1) {
                                        bx[i] = bx[i].replace("<em>", "");
                                    } else if (i > 0 && bx[i - 1].indexOf("<em>") > -1) {
                                        bx[i - 1] = bx[i - 1].replace("<em>", "");
                                    }
                                    q = true;
                                }
                            }
                            ax[k - 2] = ax[k - 2] + "</em>";
                            if (typeof bx[i - 1] === "string" && bx[i - 1].indexOf("<em>") === bx[i - 1].length - 4 && bx[i].indexOf("</em>") < 0) {
                                bx[i - 1] = bx[i - 1] + "</em>";
                            }
                            errorout -= 1;
                            q = false;
                            z = false;
                        } else if (y !== "" && y === u[u.length - 2] && v.length > 0 && y.length > 0 && y.indexOf("<em>") < y.indexOf("</em>") && y.lastIndexOf("<em>") < y.lastIndexOf("</em>")) {
                            for (i = k; i > -1; i -= 1) {
                                if (bx[i].indexOf("</em>") > -1) {
                                    bx[i] = bx[i].replace("</em>", "");
                                    if (ax[i].indexOf("<em></em>") > -1) {
                                        ax[i] = ax[i].replace("<em></em>", "");
                                        z = true;
                                    } else if (z === true) {
                                        ax[i + 1] = ax[i + 1].replace("</em>", "<em></em>");
                                    } else {
                                        ax[i] = ax[i].replace("</em>", "");
                                    }
                                    if (q === true) {
                                        break;
                                    }
                                }
                                if (bx[i].indexOf("<em>") > -1) {
                                    bx[i] = bx[i].replace("<em>", "");
                                    if (ax[i].indexOf("<em>") > -1) {
                                        ax[i] = ax[i].replace("<em>", "");
                                    } else if (i > 0 && ax[i - 1].indexOf("<em>") > -1) {
                                        ax[i - 1] = ax[i - 1].replace("<em>", "");
                                    }
                                    q = true;
                                }
                            }
                            bx[k - 2] = bx[k - 2] + "</em>";
                            if (typeof ax[i - 1] === "string" && ax[i - 1].indexOf("<em>") === ax[i - 1].length - 4 && ax[i].indexOf("</em>") < 0) {
                                ax[i - 1] = ax[i - 1] + "</em>";
                            }
                            errorout -= 1;
                            q = false;
                            z = false;
                        }*/
                        //build out static indexes for undefined areas
                        //and find where the differences start
                        for (i = k; i < zx; i += 1) {
                            if (ax[i] === bx[i]) {
                                r = i;
                            } else if (n === false && ax[i] !== bx[i] && !em.test(ax[i]) && !em.test(bx[i]) && !em.test(ax[i - 1]) && !em.test(bx[i - 1])) {
                                if (i === 0 || (typeof ax[i - 1] === "string" && typeof bx[i - 1] === "string")) {
                                    if (i === 0) {
                                        ax[i] = "<em>" + ax[i];
                                        bx[i] = "<em>" + bx[i];
                                    } else {
                                        ax[i - 1] = ax[i - 1] + "<em>";
                                        bx[i - 1] = bx[i - 1] + "<em>";
                                    }
                                    errorout += 1;
                                    n = true;
                                    break;
                                } else if (typeof ax[i - 1] !== "string" && typeof bx[i - 1] === "string") {
                                    ax[i - 1] = "<em>";
                                    bx[i - 1] = bx[i] + "<em>";
                                    errorout += 1;
                                    n = true;
                                    break;
                                } else if (typeof ax[i - 1] === "string" && typeof bx[i - 1] !== "string") {
                                    ax[i - 1] = ax[i] + "<em>";
                                    bx[i - 1] = "<em>";
                                    errorout += 1;
                                    n = true;
                                    break;
                                }
                            } else if (ax[i] === undefined && (bx[i] === "" || bx[i] === " ")) {
                                ax[i] = "";
                            } else if (bx[i] === undefined && (ax[i] === "" || ax[i] === " ")) {
                                bx[i] = "";
                            }
                        }
                        if (i === zx) {
                            r = i + 1;
                            return;
                        }

                        //this is how we define where differences end,
                        //but its multidimensional so as to allow
                        //intelligent detection of character
                        //similarities aside from indexes of either
                        //sample
                        for (j = i; j < zx; j += 1) {
                            if (typeof ax[j] === "string" && typeof bx[j] !== "string") {
                                bx[j] = "";
                            } else if (typeof ax[j] !== "string" && typeof bx[j] === "string") {
                                ax[j] = "";
                            } else if (n === true) {
                                for (o = j; o < zx; o += 1) {
                                    for (m = o - 1; m > j; m -= 1) {
                                        if (ax[m] === bx[o]) {
                                            if (m > ax.length - 1) {
                                                do {
                                                    ax.push("");
                                                } while (m > ax.length - 1);
                                            }
                                            ax[m - 1] = ax[m - 1] + "</em>";
                                            bx[o - 1] = bx[o - 1] + "</em>";
                                            k = o;
                                            p = [];
                                            do {
                                                p.push("");
                                                o -= 1;
                                            } while (o > m);
                                            ax = p.concat(ax);
                                            n = false;
                                            s.push(ax[o]);
                                            t.push(bx[o]);
                                            break;
                                        } else if (bx[m] === ax[o]) {
                                            if (m > bx.length - 1) {
                                                do {
                                                    bx.push("");
                                                } while (m > bx.length - 1);
                                            }
                                            bx[m - 1] = bx[m - 1] + "</em>";
                                            ax[o - 1] = ax[o - 1] + "</em>";
                                            k = o;
                                            p = [];
                                            do {
                                                p.push("");
                                                o -= 1;
                                            } while (o > m);
                                            bx = p.concat(bx);
                                            n = false;
                                            s.push(ax[o]);
                                            t.push(bx[o]);
                                            break;
                                        }
                                    }
                                    s.push(ax[o]);
                                    t.push(bx[o]);
                                    if (!n) {
                                        break;
                                    } else if (ax[o] === bx[o] && typeof ax[o] === "string") {
                                        ax[o - 1] = ax[o - 1] + "</em>";
                                        bx[o - 1] = bx[o - 1] + "</em>";
                                        k = o;
                                        n = false;
                                        break;
                                    } else if (ax[j - 1] === "<em>" + bx[o] && em.test(bx[j - 1]) && (j - 2 < 0 || ax[j - 2] !== bx[o + 1])) {
                                        ax[j - 1] = ax[j - 1].replace(em, "");
                                        ax.splice(j - 1, 0, "<em></em>");
                                        bx[o - 1] = bx[o - 1] + "</em>";
                                        k = o;
                                        if (o - j > 0) {
                                            p = [];
                                            for (o; o > j; o -= 1) {
                                                p.push("");
                                            }
                                            ax = p.concat(ax);
                                        }
                                        n = false;
                                        break;
                                    } else if (bx[j - 1] === "<em>" + ax[o] && em.test(ax[j - 1]) && (j - 2 < 0 || bx[j - 2] !== ax[o + 1])) {
                                        bx[j - 1] = bx[j - 1].replace(em, "");
                                        bx.splice(j - 1, 0, "<em></em>");
                                        ax[o - 1] = ax[o - 1] + "</em>";
                                        k = o;
                                        if (o - j > 0) {
                                            p = [];
                                            for (o; o > j; o -= 1) {
                                                p.push("");
                                            }
                                            bx = p.concat(bx);
                                        }
                                        n = false;
                                        break;
                                    } else if (bx[j] === ax[o] && ((ax[o - 1] !== ")" && ax[o - 1] !== "}" && ax[o - 1] !== "]" && ax[o - 1] !== ">" && bx[j - 1] !== ")" && bx[j - 1] !== "}" && bx[j - 1] !== "]" && bx[j - 1] !== ">") || (o === zx - 1 || bx[j + 1] === ax[o + 1]))) {
                                        if (bx[j - 1] === "<em>" + ax[o - 1]) {
                                            bx[j - 1] = bx[j - 1].replace(/<em>/, "<em></em>");
                                            ax[o - 1] = ax[o - 1] + "</em>";
                                            k = j;
                                            n = false;
                                            break;
                                        }
                                        if (ax.length > bx.length && ax[o - 1].substr(4) === bx[j - 1]) {
                                            ax[o - 2] = ax[o - 2] + "</em>";
                                            bx[j - 2] = bx[j - 2] + "<em></em>";
                                            bx[j - 1] = bx[j - 1].replace(/<em>/, "");
                                        } else if (ax[o - 1] !== bx[j - 1] && !em.test(ax[o - 1])) {
                                            ax[o - 1] = ax[o - 1] + "</em>";
                                            if (typeof bx[j - 1] === "string") {
                                                bx[j - 1] = bx[j - 1] + "</em>";
                                            } else {
                                                bx[j - 1] = "</em>";
                                            }
                                        } else {
                                            if (o === 1) {
                                                ax[o - 1] = ax[o - 1] + "</em>";
                                            } else {
                                                ax[o - 1] = "</em>" + ax[o - 1];
                                            }
                                            if (j === 1) {
                                                bx[j - 1] = bx[j - 1] + "</em>";
                                            } else {
                                                bx[j - 1] = "</em>" + bx[j - 1];
                                            }
                                        }
                                        k = o;
                                        if (o - j > 0) {
                                            p = [];
                                            for (o; o > j; o -= 1) {
                                                p.push("");
                                            }
                                            bx = p.concat(bx);
                                        }
                                        n = false;
                                        break;
                                    } else if (ax[j] === bx[o] && ((bx[o - 1] !== ")" && bx[o - 1] !== "}" && bx[o - 1] !== "]" && bx[o - 1] !== ">" && ax[j - 1] !== ")" && ax[j - 1] !== "}" && ax[j - 1] !== "]" && ax[j - 1] !== ">") || (o === zx - 1 || ax[j + 1] === bx[o + 1]))) {
                                        if (ax[j - 1] === "<em>" + bx[o - 1]) {
                                            ax[j - 1] = ax[j - 1].replace(/<em>/, "<em></em>");
                                            bx[o - 1] = bx[o - 1] + "</em>";
                                            k = j;
                                            n = false;
                                            break;
                                        }
                                        if (bx.length > ax.length && bx[o - 1].substr(4) === ax[j - 1]) {
                                            bx[o - 2] = bx[o - 2] + "</em>";
                                            ax[j - 2] = ax[j - 2] + "<em></em>";
                                            ax[j - 1] = ax[j - 1].replace(/<em>/, "");
                                        } else if (bx[o - 1] !== ax[j - 1] && !em.test(bx[o - 1])) {
                                            bx[o - 1] = bx[o - 1] + "</em>";
                                            if (typeof ax[j - 1] === "string") {
                                                ax[j - 1] = ax[j - 1] + "</em>";
                                            } else {
                                                ax[j - 1] = "</em>";
                                            }
                                        } else {
                                            if (o === 1) {
                                                bx[o - 1] = bx[o - 1] + "</em>";
                                            } else {
                                                bx[o - 1] = "</em>" + bx[o - 1];
                                            }
                                            if (j === 1) {
                                                ax[j - 1] = ax[j - 1] + "</em>";
                                            } else {
                                                ax[j - 1] = "</em>" + ax[j - 1];
                                            }
                                        }
                                        k = o;
                                        if (o - j > 0) {
                                            p = [];
                                            for (o; o > j; o -= 1) {
                                                p.push("");
                                            }
                                            ax = p.concat(ax);
                                        }
                                        n = false;
                                        break;
                                    }
                                }
                                //This is just a fail safe to prevent
                                //unterminated "<em>" pairs from leaking
                                //into the output.  Hopefully, you never
                                //need this.
                                if (n) {
                                    for (o = j + 1; o < zx - 1; o += 1) {
                                        s.push(ax[o]);
                                        t.push(bx[o]);
                                        if (typeof ax[o] !== "string") {
                                            ax.push("");
                                        } else if (typeof bx[o] !== "string") {
                                            bx.push("");
                                        } else if (ax[o] === bx[o] && typeof ax[o - 1] === "string" && typeof bx[o - 1] === "string") {
                                            ax[o - 1] = ax[o - 1] + "</em>";
                                            bx[o - 1] = bx[o - 1] + "</em>";
                                            k = o;
                                            n = false;
                                            q = true;
                                            break;
                                        }
                                    }
                                    if (q) {
                                        q = false;
                                        break;
                                    }
                                }
                            }
                            zx = Math.max(ax.length, bx.length);
                        }

                        //this part provides data to the recursive check
                        //above
                        if (j > o) {
                            u.push(s.join(""));
                            v.push(t.join(""));
                        } else {
                            u.push(ax.slice(i, o).join(""));
                            v.push(bx.slice(i, o).join(""));
                        }

                        //reduce the number of excessive entries into
                        //the compare function
                        if (j === zx) {
                            r += 1;
                        }
                    };
                    //if the compare algorithm has finished but not
                    //quite yet represents the entirety of input then
                    //have another go at it
                    for (p = 0; p < zx; p += 1) {
                        if (r > zx - 1) {
                            break;
                        }
                        compare();
                    }
                    c = ax.join("").replace(/\$#34;/g, "\"").replace(/\$#39;/g, "'").replace(/<\/em><em>/g, emerge);
                    d = bx.join("").replace(/\$#34;/g, "\"").replace(/\$#39;/g, "'").replace(/<\/em><em>/g, "");

                    //An extra found of precaution against unqualified
                    //output even though a more robust fail safe is in
                    //the compare algorithm
                    if (n) {
                        if (c.split("<em>").length > c.split("</em>").length) {
                            c += "</em>";
                        }
                        if (d.split("<em>").length > d.split("</em>").length) {
                            d += "</em>";
                        }
                    }
                    c = c + ra;
                    d = d + rb;
                    return [
                        c, d
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
                                data[1].push("<li class='skip'>&#8203;</li>");
                            }
                            data[2].push("<li>...</li>");
                            data[3].push("<li class='skip'>&#8203;</li>");
                            b += jump;
                            n += jump;
                            i += jump - 1;
                            if (idx + 1 === opcodes.length) {
                                break;
                            }
                        }
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
                            data[0].push("<li class='empty'>&#8203;</li>");
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
                            data[2].push("<li class='empty'>&#8203;</li>");
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
                                data[2].push("<li class='empty'>&#8203;</li>");
                                data[3].push("<li class='delete'>");
                                if (n < ne) {
                                    data[3].push(z[0]);
                                } else {
                                    data[3].push(bta[b]);
                                }
                                data[3].push("&#10;</li>");
                            }
                            if (n < ne) {
                                data[0].push("<li class='empty'>&#8203;</li>");
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
                                    data[0].push("<li class='empty'>&#8203;");
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
                                    data[1].push("&#10;");
                                } else if (bta[b] === "") {
                                    data[1].push("&#8203;");
                                } else {
                                    data[1].push(bta[b]);
                                    data[1].push("&#10;");
                                }
                                data[1].push("</li>");
                            } else if (ctest) {
                                data[0].push("<li class='empty'>&#8203;</li>");
                                data[1].push("<li class='empty'>&#8203;</li>");
                            }
                            if (n < ne) {
                                if (nta[n] === "") {
                                    data[2].push("<li class='empty'>&#8203;");
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
                                    data[3].push("&#10;");
                                } else if (nta[n] === "") {
                                    data[3].push("");
                                } else {
                                    data[3].push(nta[n]);
                                    data[3].push("&#10;");
                                }
                                data[3].push("</li>");
                            } else if (ctest) {
                                data[2].push("<li class='empty'>&#8203;</li>");
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
                            data[2].push("<li class='empty'>&#8203;</li>");
                            data[3].push("<li class='empty'>&#8203;</li>");
                            btest = false;
                            b += 1;
                        } else if (ntest || (typeof bta[b] !== "string" && typeof nta[n] === "string")) {
                            data[0].push("<li class='empty'>&#8203;</li>");
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
                node.join("").replace(/li class='equal'><\/li/g, "li class='equal'>&#8203;</li").replace(/\$#gt;/g, "&gt;").replace(/\$#lt;/g, "&lt;").replace(/\%#lt;/g, "$#lt;").replace(/\%#gt;/g, "$#gt;"), errorout, diffline
            ];
        }());
    };