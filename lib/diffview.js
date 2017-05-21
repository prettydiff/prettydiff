/*global ace, define, global, module*/
/*jshint laxbreak: true*/
/*

Written by Austin Cheney on 1 Mar 2017

 Please see the license.txt file associated with the Pretty Diff
 application for license information.

 * Output - an array of three indexes:
 * 1) Diff result as a HTML table
 * 2) Number of errors after the number of error lines used for total
 *    total error count when added to the next index
 * 3) Number of error lines in the HTML table
 */
(function () {
    "use strict";
    var diffview = function diffview_(options) {
        (function diffview__options() {
            if (typeof options.diff === "string") {
                if (options.functions !== undefined) {
                    options.diff = options
                        .diff
                        .replace(options.functions.binaryCheck, "");
                }
                if (options.semicolon === true) {
                    options.diff = options
                        .diff
                        .replace(/;\n/g, "\n")
                        .replace(/;$/, "");
                }
            }
            if (typeof options.source === "string") {
                if (options.functions !== undefined) {
                    options.source = options
                        .source
                        .replace(options.functions.binaryCheck, "");
                }
                if (options.semicolon === true) {
                    options.source = options
                        .source
                        .replace(/;\n/g, "\n")
                        .replace(/;$/, "");
                }
            }
            options.diffview        = (options.diffview === "inline")
                ? "inline"
                : "sidebyside";
            options.diffcomments    = (
                options.diffcomments === true || options.diffcomments === "true"
            );
            options.diffspaceignore = (
                options.diffspaceignore === true || options.diffspaceignore === "true"
            );
            options.quote           = (options.quote === true || options.quote === "true");
            options.semicolon       = (
                options.semicolon === true || options.semicolon === "true"
            );
            options.content         = (options.content === true || options.content === "true");
            options.diffcli         = (options.diffcli === true || options.diffcli === "true");
            options.context         = (isNaN(options.context) === false)
                ? Number(options.context)
                : -1;
            if (options.diffcli === true && options.context < 0) {
                options.context = 2;
            }
        }());
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
                for (a = 0; a < options.insize; a = a + 1) {
                    output.push(options.inchar);
                }
                return output.join("");
            }()),
            //translates source code from a string to an array by splitting on line breaks
            stringAsLines = function diffview__stringAsLines(str) {
                var lines = (options.diffcli === true)
                    ? str
                    : str
                        .replace(/&/g, "&amp;")
                        .replace(/&#lt;/g, "$#lt;")
                        .replace(/&#gt;/g, "$#gt;")
                        .replace(/</g, "$#lt;")
                        .replace(/>/g, "$#gt;");
                return lines.split("\n");
            },
            //array representation of base source
            baseTextArray = (typeof options.source === "string")
                ? stringAsLines(options.source)
                : options.source,
            //array representation of new source
            newTextArray  = (typeof options.diff === "string")
                ? stringAsLines(options.diff)
                : options.diff,
            opcodes       = [],
            codeBuild     = function diffview__opcodes() {
                var table           = {},
                    one             = (typeof options.source === "string")
                        ? options.source.split("\n")
                        : options.source,
                    two             = (typeof options.diff === "string")
                        ? options.diff.split("\n")
                        : options.diff,
                    lena            = one.length,
                    lenb            = two.length,
                    a               = 0,
                    b               = 0,
                    c               = 0,
                    d               = 0,
                    codes           = [],
                    fix             = function diffview__opcodes_fix(code) {
                        var prior = codes[codes.length - 1];
                        if (prior !== undefined) {
                            if (prior[0] === code[0]) {
                                if (code[0] === "replace" || code[0] === "equal") {
                                    prior[2] = code[2];
                                    prior[4] = code[4];
                                } else if (code[0] === "delete") {
                                    prior[2] = code[2];
                                } else if (code[0] === "insert") {
                                    prior[4] = code[4];
                                }
                                return;
                            }
                            if (prior[0] === "insert" && prior[4] - prior[3] === 1) {
                                if (code[2] - code[1] === 1) {
                                    if (code[0] === "replace") {
                                        prior[0] = "replace";
                                        prior[1] = code[1];
                                        prior[2] = code[2];
                                        code[0]  = "insert";
                                        code[1]  = -1;
                                        code[2]  = -1;
                                    } else if (code[0] === "delete") {
                                        code[0] = "replace";
                                        code[3] = prior[3];
                                        code[4] = prior[4];
                                        codes.pop();
                                        prior = codes[codes.length - 1];
                                        if (prior[0] === "replace") {
                                            prior[2] = code[2];
                                            prior[4] = code[4];
                                            return;
                                        }
                                    }
                                } else if (code[0] === "delete") {
                                    prior[0] = "replace";
                                    prior[1] = code[1];
                                    prior[2] = code[1] + 1;
                                    code[1]  = code[1] + 1;
                                } else if (code[0] === "replace") {
                                    prior[0] = "replace";
                                    prior[1] = code[1];
                                    prior[2] = code[1] + 1;
                                    c = prior[2];
                                    d = prior[4];
                                    return;
                                }
                            } else if (prior[0] === "insert" && code[0] === "delete" && code[2] - code[1] === 1) {
                                prior[4] = prior[4] - 1;
                                code[0]  = "replace";
                                code[3]  = prior[4];
                                code[4]  = prior[4] + 1;
                            } else if (prior[0] === "delete" && prior[2] - prior[1] === 1) {
                                if (code[4] - code[3] === 1) {
                                    if (code[0] === "replace") {
                                        prior[0] = "replace";
                                        prior[3] = code[3];
                                        prior[4] = code[4];
                                        code[0]  = "delete";
                                        code[3]  = -1;
                                        code[4]  = -1;
                                    } else if (code[0] === "insert") {
                                        code[0] = "replace";
                                        code[1] = prior[1];
                                        code[2] = prior[2];
                                        codes.pop();
                                        prior = codes[codes.length - 1];
                                        if (prior[0] === "replace") {
                                            prior[2] = code[2];
                                            prior[4] = code[4];
                                            return;
                                        }
                                    }
                                } else if (code[0] === "insert") {
                                    prior[0] = "replace";
                                    prior[3] = code[3];
                                    prior[4] = code[3] + 1;
                                    code[3]  = code[3] + 1;
                                } else if (code[0] === "replace") {
                                    prior[0] = "replace";
                                    prior[3] = code[3];
                                    prior[4] = code[4] + 1;
                                    c = prior[2];
                                    d = prior[4];
                                    return;
                                }
                            } else if (prior[0] === "delete" && code[0] === "insert" && code[4] - code[3] === 1) {
                                prior[2] = prior[2] - 1;
                                code[0]  = "replace";
                                code[1]  = prior[2];
                                code[2]  = prior[2] + 1;
                            } else if (prior[0] === "replace") {
                                if (code[0] === "delete") {
                                    if (one[code[2] - 1] === two[prior[4] - 1]) {
                                        if (prior[2] - prior[1] > 1) {
                                            prior[4] = prior[4] - 1;
                                        }
                                        c = c - 1;
                                        d = d - 1;
                                        return;
                                    }
                                    if (one[code[2]] === two[prior[4] - 1]) {
                                        if (prior[2] - prior[1] > 1) {
                                            prior[2]             = prior[2] - 1;
                                            prior[4]             = prior[4] - 11;
                                            table[one[c - 1]][0] = table[one[c - 1]][0] - 1;
                                        }
                                    }
                                } else if (code[0] === "insert") {
                                    if (one[prior[2] - 1] === two[code[4] - 1]) {
                                        if (prior[2] - prior[1] > 1) {
                                            prior[2] = prior[2] - 1;
                                        }
                                        c = c - 1;
                                        d = d - 1;
                                        return;
                                    }
                                    if (one[code[2] - 1] === two[prior[4]]) {
                                        if (prior[4] - prior[3] > 1) {
                                            prior[2]             = prior[2] - 1;
                                            prior[4]             = prior[4] - 1;
                                            table[two[d - 1]][1] = table[two[d - 1]][1] - 1;
                                        }
                                    }
                                }
                            }
                        }
                        codes.push(code);
                    },
                    equality        = function diffview__opcodes_equality() {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            table[one[c]][1] = table[one[c]][1] - 1;
                            c                = c + 1;
                            d                = d + 1;
                        } while (c < lena && d < lenb && one[c] === two[d]);
                        fix(["equal", a, c, b, d]);
                        b = d - 1;
                        a = c - 1;
                    },
                    deletion        = function diffview__opcodes_deletion() {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            c                = c + 1;
                        } while (c < lena && table[one[c]][1] < 1);
                        fix(["delete", a, c, -1, -1]);
                        a = c - 1;
                        b = d - 1;
                    },
                    deletionStatic  = function diffview__opcodes_deletionStatic() {
                        table[one[a]][0] = table[one[a]][0] - 1;
                        fix([
                            "delete", a, a + 1,
                            -1,
                            -1
                        ]);
                        a = c;
                        b = d - 1;
                    },
                    insertion       = function diffview__opcodes_insertion() {
                        do {
                            table[two[d]][1] = table[two[d]][1] - 1;
                            d                = d + 1;
                        } while (d < lenb && table[two[d]][0] < 1);
                        fix(["insert", -1, -1, b, d]);
                        a = c - 1;
                        b = d - 1;
                    },
                    insertionStatic = function diffview__opcodes_insertionStatic() {
                        table[two[b]][1] = table[two[b]][1] - 1;
                        fix([
                            "insert", -1, -1, b, b + 1
                        ]);
                        a = c - 1;
                        b = d;
                    },
                    replacement     = function diffview__opcodes_replacement() {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            table[two[d]][1] = table[two[d]][1] - 1;
                            c                = c + 1;
                            d                = d + 1;
                        } while (c < lena && d < lenb && table[one[c]][1] > 0 && table[two[d]][0] > 0);
                        fix(["replace", a, c, b, d]);
                        a = c - 1;
                        b = d - 1;
                    },
                    replaceUniques  = function diffview__opcodes_replaceUniques() {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            c                = c + 1;
                            d                = d + 1;
                        } while (c < lena && d < lenb && table[one[c]][1] < 1 && table[two[d]][0] < 1);
                        fix(["replace", a, c, b, d]);
                        a = c - 1;
                        b = d - 1;
                    };

                // * First Pass, account for lines from first file
                // * build the table from the second file
                do {
                    if (options.diffspaceignore === true) {
                        two[b] = two[b].replace(/\s+/g, "");
                    }
                    if (table[two[b]] === undefined) {
                        table[two[b]] = [0, 1];
                    } else {
                        table[two[b]][1] = table[two[b]][1] + 1;
                    }
                    b = b + 1;
                } while (b < lenb);

                // * Second Pass, account for lines from second file
                // * build the table from the first file
                lena = one.length;
                a    = 0;
                do {
                    if (options.diffspaceignore === true) {
                        one[a] = one[a].replace(/\s+/g, "");
                    }
                    if (table[one[a]] === undefined) {
                        table[one[a]] = [1, 0];
                    } else {
                        table[one[a]][0] = table[one[a]][0] + 1;
                    }
                    a = a + 1;
                } while (a < lena);
                a = 0;
                b = 0;
                // find all equality... differences are what's left over solve only for the
                // second set test removing reverse test removing undefined checks for table
                // refs

                do {
                    c = a;
                    d = b;
                    if (one[a] === two[b]) {
                        equality();
                    } else if (table[one[a]][1] < 1 && table[two[b]][0] < 1) {
                        replaceUniques();
                    } else if (table[one[a]][1] < 1 && one[a + 1] !== two[b + 2]) {
                        deletion();
                    } else if (table[two[b]][0] < 1 && one[a + 2] !== two[b + 1]) {
                        insertion();
                    } else if (table[one[a]][0] - table[one[a]][1] === 1 && one[a + 1] !== two[b + 2]) {
                        deletionStatic();
                    } else if (table[two[b]][1] - table[two[b]][0] === 1 && one[a + 2] !== two[b + 1]) {
                        insertionStatic();
                    } else if (one[a + 1] === two[b]) {
                        deletion();
                    } else if (one[a] === two[b + 1]) {
                        insertion();
                    } else {
                        replacement();
                    }
                    a = a + 1;
                    b = b + 1;
                } while (a < lena && b < lenb);
                if (lena - a === lenb - b) {
                    if (one[a] === two[b]) {
                        fix(["equal", a, lena, b, lenb]);
                    } else {
                        fix(["replace", a, lena, b, lenb]);
                    }
                } else if (a < lena) {
                    fix(["delete", a, lena, -1, -1]);
                } else if (b < lenb) {
                    fix(["insert", -1, -1, b, lenb]);
                }
                return codes;
            };

        if (Array.isArray(options.source) === false && typeof options.source !== "string") {
            return "Error: source value is not a string or array!";
        }
        if (Array.isArray(options.diff) === false && typeof options.diff !== "string") {
            return "Error: diff value is not a string or array!";
        }

        opcodes = codeBuild();
        //diffview application contains three primary parts
        // 1.  opcodes - performs the 'largest common subsequence'    calculation to
        // determine which lines are different.  I    did not write this logic.  I have
        // rewritten it for    performance, but original logic is still intact.
        // 2.  charcomp - performs the 'largest common subsequence' upon    characters
        // of two compared lines.
        // 3.  The construction of the output into the 'node' array errorout is a count
        // of differences after the opcodes generate the other two core pieces of logic
        // are quaranteened into an anonymous function.
        return (function diffview__report() {
            var a              = 0,
                i              = 0,
                node           = ["<div class='diff'>"],
                data           = (options.diffcli === true)
                    ? []
                    : [
                        [], [], [], []
                    ],
                baseStart      = 0,
                baseEnd        = 0,
                newStart       = 0,
                newEnd         = 0,
                rowcnt         = 0,
                rowItem        = -1,
                rcount         = 0,
                foldcount      = 0,
                foldstart      = -1,
                jump           = 0,
                finaldoc       = "",
                tabFix         = (tab === "")
                    ? ""
                    : new RegExp("^((" + tab.replace(/\\/g, "\\") + ")+)"),
                noTab          = function diffview__report_noTab(str) {
                    var b      = 0,
                        strLen = str.length,
                        output = [];
                    for (b = 0; b < strLen; b = b + 1) {
                        output.push(str[b].replace(tabFix, ""));
                    }
                    return output;
                },
                htmlfix        = function diffview__report_htmlfix(item) {
                    return item.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
                // this is the character comparison logic that performs the 'largest common
                // subsequence' between two lines of code
                charcomp       = function diffview__report_charcomp(lineA, lineB) {
                    var b             = 0,
                        dataA         = [],
                        dataB         = [],
                        cleanedA      = (options.diffcli === true)
                            ? lineA
                            : lineA
                                .replace(/&#160;/g, " ")
                                .replace(/&nbsp;/g, " ")
                                .replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">")
                                .replace(/\$#lt;/g, "<")
                                .replace(/\$#gt;/g, ">")
                                .replace(/&amp;/g, "&"),
                        cleanedB      = (options.diffcli === true)
                            ? lineB
                            : lineB
                                .replace(/&#160;/g, " ")
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
                        strStart      = "_pdiffdiff\u005f",
                        strEnd        = "_epdiffdiff\u005f",
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
                        whiteout      = function diffview__report_charcomp_whiteout(whitediff) {
                            var spacetest = (/<((em)|(pd))>\u0020+<\/((em)|(pd))>/),
                                crtest    = (/<((em)|(pd))>\r+<\/((em)|(pd))>/);
                            if (spacetest.test(whitediff) === true) {
                                return whitediff;
                            }
                            if (crtest.test(whitediff) === true) {
                                return whitediff.replace(/\s+/, "(carriage return)");
                            }
                            return whitediff.replace(/\s+/, "(white space differences)");
                        },
                        //compare is the fuzzy string comparison algorithm
                        compare       = function diffview__report_charcomp_compare(start) {
                            var x          = 0,
                                y          = 0,
                                max        = Math.max(dataA.length, dataB.length),
                                store      = [],
                                sorta      = function diffview__report_charcomp_compare_sorta(a, b) {
                                    if (a[1] - a[0] < b[1] - b[0]) {
                                        return 1;
                                    }
                                    return -1;
                                },
                                sortb      = function diffview__report_charcomp_compare_sortb(a, b) {
                                    if (a[0] + a[1] > b[0] + b[1]) {
                                        return 1;
                                    }
                                    return -1;
                                },
                                whitetest  = (/^(\s+)$/),
                                whitespace = false,
                                wordtest   = false;
                            //first gather a list of all matching indexes into an array
                            for (x = start; x < dataMinLength; x = x + 1) {
                                for (y = start; y < max; y = y + 1) {
                                    if (dataA[x] === dataB[y] || dataB[x] === dataA[y]) {
                                        store.push([x, y]);
                                        if (dataA[y] === dataB[x] && dataA[y + 1] === dataB[x + 1] && whitetest.test(dataB[x - 1]) === true) {
                                            wordtest = true;
                                            store    = [
                                                [x, y]
                                            ];
                                        }
                                        if (dataA[x] === dataB[y] && dataA[x + 1] === dataB[y + 1] && whitetest.test(dataB[y - 1]) === true) {
                                            wordtest = true;
                                            store    = [
                                                [x, y]
                                            ];
                                        }
                                        break;
                                    }
                                }
                                if (wordtest === true) {
                                    break;
                                }
                            }
                            //if there are no character matches then quit out
                            if (store.length === 0) {
                                return [dataMinLength, max, 0, whitespace];
                            }
                            // take the list of matches and sort it first sort by size of change with
                            // shortest up front second sort by sum of change start and end the second sort
                            // results in the smallest change from the earliest point
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
                                    x = x - 1;
                                    y = y - 1;
                                }
                                if (options.diffspaceignore === true && ((whitetest.test(dataA[y - 1]) === true && y - start > 0) || (whitetest.test(dataB[x - 1]) === true && x - start > 0))) {
                                    whitespace = true;
                                }
                                return [x, y, 0, whitespace];
                            }
                            if (dataA[x] === dataB[y]) {
                                if (dataA[x - 1] === dataB[y - 1] && x !== start) {
                                    x = x - 1;
                                    y = y - 1;
                                }
                                if (options.diffspaceignore === true && ((whitetest.test(dataA[x - 1]) === true && x - start > 0) || (whitetest.test(dataB[y - 1]) === true && y - start > 0))) {
                                    whitespace = true;
                                }
                                return [x, y, 1, whitespace];
                            }
                        };
                    //if same after accounting for character entities then exit
                    if (cleanedA === cleanedB) {
                        return [lineA, lineB];
                    }
                    //prevent extra error counting that occurred before entering this function
                    errorout = errorout - 1;
                    //diff for tabs
                    if (tabFix !== "" && cleanedA.length !== cleanedB.length && cleanedA.replace(tabFix, "") === cleanedB.replace(tabFix, "") && options.diffspaceignore === false) {
                        errorout = errorout + 1;
                        if (options.diffcli === true) {
                            tabdiff[0] = tabdiff[0] + tabdiff[2];
                            tabdiff[0] = tabdiff[0]
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>");
                            tabdiff[1] = tabdiff[1] + tabdiff[3];
                            tabdiff[1] = tabdiff[1]
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>");
                            return [
                                tabdiff[0], tabdiff[1]
                            ];
                        }
                        tabdiff[0] = tabdiff[0] + tabdiff[2];
                        tabdiff[0] = tabdiff[0]
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>");
                        tabdiff[1] = tabdiff[1] + tabdiff[3];
                        tabdiff[1] = tabdiff[1]
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>");
                        return [
                            tabdiff[0], tabdiff[1]
                        ];
                    }
                    //turn the pruned input into arrays
                    dataA         = cleanedA.split("");
                    dataB         = cleanedB.split("");
                    //the length of the shortest array
                    dataMinLength = Math.min(dataA.length, dataB.length);
                    for (b = 0; b < dataMinLength; b = b + 1) {
                        //if undefined break the loop
                        if (dataA[b] === undefined || dataB[b] === undefined) {
                            break;
                        }
                        //iterate until the arrays are not the same
                        if (dataA[b] !== dataB[b]) {
                            // fuzzy string comparison returns an array with these indexes 0 - shorter
                            // ending index of difference 1 - longer ending index of difference 2 - 0 if
                            // index 2 is for dataA or 1 for dataB 3 - whether the difference is only
                            // whitespace
                            currentdiff = compare(b);
                            //supply the difference start indicator
                            if (currentdiff[3] === false) {
                                //count each difference
                                errorout = errorout + 1;
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
                                        } else if (currentdiff[1] - currentdiff[0] === currentdiff[0]) {
                                            dataA[b] = strEnd + dataA[b];
                                        } else {
                                            dataA[currentdiff[0]] = strEnd + dataA[currentdiff[0]];
                                        }
                                    }
                                    if (currentdiff[1] > dataB.length - 1 || currentdiff[0] === dataMinLength) {
                                        dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                                    } else if (currentdiff[1] - currentdiff[0] === currentdiff[0]) {
                                        dataB[b + (currentdiff[1] - currentdiff[0])] = strEnd + dataB[b + (currentdiff[1] - currentdiff[0])];
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
                                        } else if (currentdiff[0] - currentdiff[1] === currentdiff[1]) {
                                            dataB[b] = strEnd + dataB[b];
                                        } else {
                                            dataB[currentdiff[0]] = strEnd + dataB[currentdiff[0]];
                                        }
                                    }
                                    if (currentdiff[1] > dataA.length - 1 || currentdiff[0] === dataMinLength) {
                                        dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                                    } else if (currentdiff[0] - currentdiff[1] === currentdiff[1]) {
                                        dataA[b + (currentdiff[0] - currentdiff[1])] = strEnd + dataA[b + (currentdiff[0] - currentdiff[1])];
                                    } else {
                                        dataA[currentdiff[1]] = strEnd + dataA[currentdiff[1]];
                                    }
                                }
                            }
                            // we must rebase the array with the shorter difference so that the end of the
                            // current difference is on the same index.  This provides a common baseline by
                            // which to find the next unmatching index
                            if (currentdiff[1] > currentdiff[0] && currentdiff[1] - currentdiff[0] < 1000) {
                                if (currentdiff[2] === 1) {
                                    do {
                                        dataA.unshift("");
                                        currentdiff[0] = currentdiff[0] + 1;
                                    } while (currentdiff[1] > currentdiff[0]);
                                } else {
                                    do {
                                        dataB.unshift("");
                                        currentdiff[0] = currentdiff[0] + 1;
                                    } while (currentdiff[1] > currentdiff[0]);
                                }
                            }
                            // since the previous logic will grow the shorter array we have to redefine the
                            // shortest length
                            dataMinLength = Math.min(dataA.length, dataB.length);
                            //assign the incrementer to the end of the longer difference
                            b             = currentdiff[1];
                        }
                    }
                    // if one array is longer than the other and not identified as different then
                    // identify this difference in length
                    if (dataA.length > dataB.length && dataB[dataB.length - 1] !== undefined && dataB[dataB.length - 1].indexOf(strEnd) < 1) {
                        dataB.push(strStart + strEnd);
                        dataA[dataB.length - 1] = strStart + dataA[dataB.length - 1];
                        dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                        errorout                = errorout + 1;
                    }
                    if (dataB.length > dataA.length && dataA[dataA.length - 1] !== undefined && dataA[dataA.length - 1].indexOf(strEnd) < 1) {
                        dataA.push(strStart + strEnd);
                        dataB[dataA.length - 1] = strStart + dataB[dataA.length - 1];
                        dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                        errorout                = errorout + 1;
                    }
                    // options.diffcli output doesn't need XML protected characters to be escaped
                    // because its output is the command line
                    if (options.diffcli === true) {
                        return [
                            dataA
                                .join("")
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>")
                                .replace(/<pd>\s+<\/pd>/g, whiteout),
                            dataB
                                .join("")
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>")
                                .replace(/<pd>\s+<\/pd>/g, whiteout)
                        ];
                    }
                    return [
                        dataA
                            .join("")
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>")
                            .replace(/<em>\s+<\/em>/g, whiteout),
                        dataB
                            .join("")
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>")
                            .replace(/<em>\s+<\/em>/g, whiteout)
                    ];
                };
            if (options.diffcli === false) {
                if (options.diffview === "inline") {
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
            } else {
                foldstart = 0;
            }
            for (a = 0; a < opcodesLength; a = a + 1) {
                code      = opcodes[a];
                change    = code[0];
                baseStart = code[1];
                baseEnd   = code[2];
                newStart  = code[3];
                newEnd    = code[4];
                rowcnt    = Math.max(baseEnd - baseStart, newEnd - newStart);
                ctest     = true;

                if (foldstart > -1 && options.diffcli === false) {
                    data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                }
                if (options.diffcli === true) {
                    if (foldstart > 49 && change === "equal") {
                        break;
                    }
                    if (options.diffspaceignore === true && change === "replace" && baseTextArray[baseStart] !== undefined && newTextArray[newStart] !== undefined && baseTextArray[baseStart].replace(/\s+/g, "") === newTextArray[newStart].replace(/\s+/g, "")) {
                        change = "equal";
                    } else if (change !== "equal") {
                        if (a > 0 && opcodes[a - 1][0] === "equal") {
                            foldcount = options.context;
                            if ((ntest === true || change === "insert") && (options.diffspaceignore === false || (/^(\s+)$/g).test(newTextArray[newStart]) === false)) {
                                foldstart = foldstart + 1;
                                if (options.api === "dom") {
                                    data.push("</li><li><h3>Line: ");
                                    data.push(opcodes[a - 1][2] + 1);
                                    data.push("</h3>");
                                } else {
                                    data.push("");
                                    data.push("\u001b[36mLine: " + (opcodes[a - 1][2] + 1) + "\u001b[39m");
                                }
                                if (foldcount > 0) {
                                    do {
                                        if (newStart - foldcount > -1) {
                                            if (options.api === "dom") {
                                                data.push("<p>");
                                                data.push(htmlfix(newTextArray[newStart - foldcount]));
                                                data.push("</p>");
                                            } else {
                                                data.push(newTextArray[newStart - foldcount]);
                                            }
                                        }
                                        foldcount = foldcount - 1;
                                    } while (foldcount > 0);
                                }
                            } else {
                                foldstart = foldstart + 1;
                                if (options.api === "dom") {
                                    data.push("</li><li><h3>Line: ");
                                    data.push(baseStart + 1);
                                    data.push("</h3>");
                                } else {
                                    data.push("");
                                    data.push("\u001b[36mLine: " + (baseStart + 1) + "\u001b[39m");
                                }
                                if (foldcount > 0) {
                                    do {
                                        if (baseStart - foldcount > -1) {
                                            if (options.api === "dom") {
                                                data.push("<p>");
                                                data.push(htmlfix(newTextArray[newStart - foldcount]));
                                                data.push("</p>");
                                            } else {
                                                data.push(baseTextArray[baseStart - foldcount]);
                                            }
                                        }
                                        foldcount = foldcount - 1;
                                    } while (foldcount > 0);
                                }
                            }
                        } else if (a < 1) {
                            if (options.api === "dom") {
                                data.push("</li><li><h3>Line: 1</h3>");
                            } else {
                                data.push("");
                                data.push("\u001b[36mLine: 1\u001b[39m");
                            }
                            foldstart = foldstart + 1;
                        }
                        foldcount = 0;
                        if ((ntest === true || change === "insert") && (options.diffspaceignore === false || (/^(\s+)$/g).test(newTextArray[newStart]) === false)) {
                            do {
                                if (options.api === "dom") {
                                    data.push("<ins>");
                                    data.push(htmlfix(newTextArray[newStart + foldcount]));
                                    data.push("</ins>");
                                } else {
                                    data.push("\u001b[32m" + newTextArray[newStart + foldcount] + "\u001b[39m");
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < 7 && foldcount + newStart < newEnd);
                        } else if (change === "delete" && (options.diffspaceignore === false || (/^(\s+)$/g).test(baseTextArray[baseStart]) === false)) {
                            do {
                                if (options.api === "dom") {
                                    data.push("<del>");
                                    data.push(htmlfix(baseTextArray[baseStart + foldcount]))
                                    data.push("</del>");
                                } else {
                                    data.push("\u001b[31m" + baseTextArray[baseStart + foldcount] + "\u001b[39m");
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < 7 && foldcount + baseStart < baseEnd);
                        } else if (change === "replace" && (options.diffspaceignore === false || baseTextArray[baseStart].replace(/\s+/g, "") !== newTextArray[newStart].replace(/\s+/g, ""))) {
                            do {
                                charcompOutput = charcomp(
                                    baseTextArray[baseStart + foldcount],
                                    newTextArray[newStart + foldcount]
                                );
                                if (options.api === "dom") {
                                    data.push("<del>");
                                    data.push(htmlfix(charcompOutput[0]).replace(/&lt;pd&gt;/g, "<em>").replace(/&lt;\/pd&gt;/g, "</em>"));
                                    data.push("</del><ins>");
                                    data.push(htmlfix(charcompOutput[1]).replace(/&lt;pd&gt;/g, "<em>").replace(/&lt;\/pd&gt;/g, "</em>"));
                                    data.push("</ins>");
                                } else {
                                    data.push("\u001b[31m" + charcompOutput[0].replace(/<pd>/g, "\u001b[1m").replace(/<\/pd>/g, "\u001b[22m") + "\u001b[39m");
                                    data.push("\u001b[32m" + charcompOutput[1].replace(/<pd>/g, "\u001b[1m").replace(/<\/pd>/g, "\u001b[22m") + "\u001b[39m");
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < 7 && foldcount + baseStart < baseEnd);
                        }
                        if (((change === "insert" && foldcount + newStart === newEnd) || (change !== "insert" && foldcount + baseStart === baseEnd)) && baseTextArray[baseStart + foldcount] !== undefined && options.context > 0 && a < opcodesLength - 1 && opcodes[a + 1][0] === "equal") {
                            foldcount = 0;
                            baseStart = opcodes[a + 1][1];
                            baseEnd   = opcodes[a + 1][2] - baseStart;
                            do {
                                if (options.api === "dom") {
                                    data.push("<p>");
                                    data.push(htmlfix(baseTextArray[baseStart + foldcount]));
                                    data.push("</p>");
                                } else {
                                    data.push(baseTextArray[baseStart + foldcount]);
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < options.context && foldcount < baseEnd);
                        }
                        if (btest === true) {
                            baseStart = baseStart + 1;
                            btest     = false;
                        } else if (ntest === true) {
                            newStart = newStart + 1;
                            ntest    = false;
                        } else {
                            baseStart = baseStart + 1;
                            newStart  = newStart + 1;
                        }
                    }
                } else {
                    for (i = 0; i < rowcnt; i = i + 1) {
                        //apply options.context collapsing for the output, if needed
                        if (options.context > -1 && opcodes.length > 1 && ((a > 0 && i === options.context) || (a === 0 && i === 0)) && change === "equal") {
                            ctest = false;
                            jump  = rowcnt - ((a === 0
                                ? 1
                                : 2) * options.context);
                            if (jump > 1) {
                                baseStart = baseStart + jump;
                                newStart  = newStart + jump;
                                i         = i + (jump - 1);
                                if (options.diffcli === true) {
                                    data[5].push([baseStart, newStart]);
                                } else {
                                    data[0].push("<li>...</li>");
                                    if (options.diffview !== "inline") {
                                        data[1].push("<li class=\"skip\">&#10;</li>");
                                    }
                                    data[2].push("<li>...</li>");
                                    data[3].push("<li class=\"skip\">&#10;</li>");
                                }
                                if (a + 1 === opcodes.length) {
                                    break;
                                }
                            }
                        } else if (change !== "equal") {
                            diffline = diffline + 1;
                        }
                        foldcount = foldcount + 1;
                        // this is a check against false positives incurred by increasing or reducing of
                        // nesting.  At this time it only checks one level deep.
                        if (tab !== "") {
                            if (btest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof baseTextArray[baseStart + 1] === "string" && typeof newTextArray[newStart] === "string" && baseTab[baseStart + 1] === newTab[newStart] && baseTab[baseStart] !== newTab[newStart] && (typeof newTextArray[newStart - 1] !== "string" || baseTab[baseStart] !== newTab[newStart - 1])) {
                                btest = true;
                            } else if (ntest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof newTextArray[newStart + 1] === "string" && typeof baseTextArray[baseStart] === "string" && newTab[newStart + 1] === baseTab[baseStart] && newTab[newStart] !== baseTab[baseStart] && (typeof baseTextArray[baseStart - 1] !== "string" || newTab[newStart] !== baseTab[baseStart - 1])) {
                                ntest = true;
                            }
                        }
                        if (options.diffview === "inline") {
                            if (options.diffspaceignore === true && change === "replace" && baseTextArray[baseStart].replace(/\s+/g, "") === newTextArray[newStart].replace(/\s+/g, "")) {
                                change   = "equal";
                                errorout = errorout - 1;
                            }
                            if (options.context < 0 && rowItem < a) {
                                rowItem = a;
                                if (foldstart > -1) {
                                    if (data[0][foldstart + 1] === foldcount - 1) {
                                        data[0][foldstart] = "<li class=\"" + data[0][foldstart].slice(
                                            data[0][foldstart].indexOf(
                                                "line xxx\">- "
                                            ) + 12
                                        );
                                    } else {
                                        data[0][foldstart] = data[0][foldstart].replace(
                                            "xxx",
                                            (foldcount - 1 + rcount)
                                        );
                                    }
                                }
                                if (change !== "replace") {
                                    if (baseEnd - baseStart > 1 || newEnd - newStart > 1) {
                                        data[0].push("<li class=\"fold\" title=\"folds from line " + (
                                            foldcount + rcount
                                        ) + " to line xxx\">- ");
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li>");
                                    }
                                    if (ntest === true || change === "insert") {
                                        data[0].push("&#10;");
                                    } else {
                                        data[0].push(baseStart + 1);
                                    }
                                    data[0].push("</li>");
                                } else {
                                    rcount = rcount + 1;
                                }
                            } else if (change !== "replace") {
                                data[0].push("<li>");
                                if (ntest === true || change === "insert") {
                                    data[0].push("&#10;");
                                } else {
                                    data[0].push(baseStart + 1);
                                }
                                data[0].push("</li>");
                            } else if (change === "replace") {
                                rcount = rcount + 1;
                            }
                            if (ntest === true || change === "insert") {
                                data[2].push("<li>");
                                data[2].push(newStart + 1);
                                data[2].push("&#10;</li>");
                                if (options.diffspaceignore === true && newTextArray[newStart].replace(/\s+/g, "") === "") {
                                    data[3].push("<li class=\"equal\">");
                                    diffline = diffline - 1;
                                } else {
                                    data[3].push("<li class=\"insert\">");
                                }
                                data[3].push(newTextArray[newStart]);
                                data[3].push("&#10;</li>");
                            } else if (btest === true || change === "delete") {
                                data[2].push("<li class=\"empty\">&#10;</li>");
                                if (options.diffspaceignore === true && baseTextArray[baseStart].replace(/\s+/g, "") === "") {
                                    data[3].push("<li class=\"equal\">");
                                    diffline = diffline - 1;
                                } else {
                                    data[3].push("<li class=\"delete\">");
                                }
                                data[3].push(baseTextArray[baseStart]);
                                data[3].push("&#10;</li>");
                            } else if (change === "replace") {
                                if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                                    if (baseTextArray[baseStart] === "") {
                                        charcompOutput = [
                                            "", newTextArray[newStart]
                                        ];
                                    } else if (newTextArray[newStart] === "") {
                                        charcompOutput = [baseTextArray[baseStart], ""];
                                    } else if (baseStart < baseEnd && newStart < newEnd) {
                                        charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                    }
                                }
                                if (baseStart < baseEnd) {
                                    data[0].push("<li>" + (
                                        baseStart + 1
                                    ) + "</li>");
                                    data[2].push("<li class=\"empty\">&#10;</li>");
                                    if (options.diffspaceignore === true && baseTextArray[baseStart].replace(/\s+/g, "") === "") {
                                        data[3].push("<li class=\"equal\">");
                                        diffline = diffline - 1;
                                    } else {
                                        data[3].push("<li class=\"delete\">");
                                    }
                                    if (newStart < newEnd) {
                                        data[3].push(charcompOutput[0]);
                                    } else {
                                        data[3].push(baseTextArray[baseStart]);
                                    }
                                    data[3].push("&#10;</li>");
                                }
                                if (newStart < newEnd) {
                                    data[0].push("<li class=\"empty\">&#10;</li>");
                                    data[2].push("<li>");
                                    data[2].push(newStart + 1);
                                    data[2].push("</li>");
                                    if (options.diffspaceignore === true && newTextArray[newStart].replace(/\s+/g, "") === "") {
                                        data[3].push("<li class=\"equal\">");
                                        diffline = diffline - 1;
                                    } else {
                                        data[3].push("<li class=\"insert\">");
                                    }
                                    if (baseStart < baseEnd) {
                                        data[3].push(charcompOutput[1]);
                                    } else {
                                        data[3].push(newTextArray[newStart]);
                                    }
                                    data[3].push("&#10;</li>");
                                }
                            } else if (baseStart < baseEnd || newStart < newEnd) {
                                data[2].push("<li>");
                                data[2].push(newStart + 1);
                                data[2].push("</li>");
                                data[3].push("<li class=\"");
                                data[3].push(change);
                                data[3].push("\">");
                                data[3].push(baseTextArray[baseStart]);
                                data[3].push("&#10;</li>");
                            }
                            if (btest === true) {
                                baseStart = baseStart + 1;
                                btest     = false;
                            } else if (ntest === true) {
                                newStart = newStart + 1;
                                ntest    = false;
                            } else {
                                baseStart = baseStart + 1;
                                newStart  = newStart + 1;
                            }
                        } else {
                            if (btest === false && ntest === false && typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] === "string") {
                                if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                    charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                } else {
                                    charcompOutput = [
                                        baseTextArray[baseStart], newTextArray[newStart]
                                    ];
                                }
                                if (baseStart === Number(data[0][data[0].length - 1].substring(
                                    data[0][data[0].length - 1].indexOf(">") + 1,
                                    data[0][data[0].length - 1].lastIndexOf("<")
                                )) - 1 || newStart === Number(data[2][data[2].length - 1].substring(
                                    data[2][data[2].length - 1].indexOf(">") + 1,
                                    data[2][data[2].length - 1].lastIndexOf("<")
                                )) - 1) {
                                    repeat = true;
                                }
                                if (repeat === false) {
                                    if (baseStart < baseEnd) {
                                        if (options.context < 0 && rowItem < a && (opcodes[a][2] - opcodes[a][1] > 1 || opcodes[a][4] - opcodes[a][3] > 1)) {
                                            rowItem = a;
                                            data[0].push(
                                                "<li class=\"fold\" title=\"folds from line " + foldcount +
                                                " to line xxx\">- " + (
                                                    baseStart + 1
                                                ) + "</li>"
                                            );
                                            foldstart = data[0].length - 1;
                                        } else {
                                            data[0].push("<li>" + (
                                                baseStart + 1
                                            ) + "</li>");
                                        }
                                        data[1].push("<li class=\"");
                                        if (newStart >= newEnd) {
                                            if (options.diffspaceignore === true && baseTextArray[baseStart].replace(/\s+/g, "") === "") {
                                                data[1].push("equal");
                                                diffline = diffline - 1;
                                            } else {
                                                data[1].push("delete");
                                            }
                                        } else if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "" && (options.diffspaceignore === false || (baseTextArray[baseStart].replace(/\s+/g, "") !== "" && newTextArray[newStart].replace(/\s+/g, "") !== ""))) {
                                            data[1].push("empty");
                                        } else {
                                            data[1].push(change);
                                        }
                                        data[1].push("\">");
                                        data[1].push(charcompOutput[0]);
                                        data[1].push("&#10;</li>");
                                    } else if (ctest === true) {
                                        if (options.context < 0 && rowItem < a && (opcodes[a][2] - opcodes[a][1] > 1 || opcodes[a][4] - opcodes[a][3])) {
                                            rowItem = a;
                                            if (foldstart > -1) {
                                                data[0][foldstart] = data[0][foldstart].replace("xxx", (foldcount - 1));
                                            }
                                            data[0].push(
                                                "<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">- &" +
                                                "#10;</li>"
                                            );
                                            foldstart = data[0].length - 1;
                                        } else {
                                            data[0].push("<li class=\"empty\">&#10;</li>");
                                        }
                                        data[1].push("<li class=\"empty\"></li>");
                                    }
                                    if (newStart < newEnd) {
                                        data[2].push("<li>" + (
                                            newStart + 1
                                        ) + "</li>");
                                        data[3].push("<li class=\"");
                                        if (baseStart >= baseEnd) {
                                            if (options.diffspaceignore === true && newTextArray[newStart].replace(/\s+/g, "") === "") {
                                                data[3].push("equal");
                                                diffline = diffline - 1;
                                            } else {
                                                data[3].push("insert");
                                            }
                                        } else if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "" && (options.diffspaceignore === false || (baseTextArray[baseStart].replace(/\s+/g, "") !== "" && newTextArray[newStart].replace(/\s+/g, "") !== ""))) {
                                            data[3].push("empty");
                                        } else {
                                            data[3].push(change);
                                        }
                                        data[3].push("\">");
                                        data[3].push(charcompOutput[1]);
                                        data[3].push("&#10;</li>");
                                    } else if (ctest === true) {
                                        data[2].push("<li class=\"empty\">&#10;</li>");
                                        data[3].push("<li class=\"empty\"></li>");
                                    }
                                } else {
                                    repeat = false;
                                }
                                if (baseStart < baseEnd) {
                                    baseStart = baseStart + 1;
                                }
                                if (newStart < newEnd) {
                                    newStart = newStart + 1;
                                }
                            } else if (btest === true || (typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] !== "string")) {
                                if (baseStart !== Number(data[0][data[0].length - 1].substring(
                                    data[0][data[0].length - 1].indexOf(">") + 1,
                                    data[0][data[0].length - 1].lastIndexOf("<")
                                )) - 1) {
                                    if (options.context < 0 && rowItem < a && opcodes[a][2] - opcodes[a][1] > 1) {
                                        rowItem = a;
                                        data[0].push(
                                            "<li class=\"fold\" title=\"folds from line " + foldcount +
                                            " to line xxx\">- " + (
                                                baseStart + 1
                                            ) + "</li>"
                                        );
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li>" + (
                                            baseStart + 1
                                        ) + "</li>");
                                    }
                                    data[1].push("<li class=\"delete\">");
                                    data[1].push(baseTextArray[baseStart]);
                                    data[1].push("&#10;</li>");
                                    data[2].push("<li class=\"empty\">&#10;</li>");
                                    data[3].push("<li class=\"empty\"></li>");
                                }
                                btest     = false;
                                baseStart = baseStart + 1;
                            } else if (ntest === true || (typeof baseTextArray[baseStart] !== "string" && typeof newTextArray[newStart] === "string")) {
                                if (newStart !== Number(data[2][data[2].length - 1].substring(
                                    data[2][data[2].length - 1].indexOf(">") + 1,
                                    data[2][data[2].length - 1].lastIndexOf("<")
                                )) - 1) {
                                    if (options.context < 0 && rowItem < a && opcodes[a][4] - opcodes[a][3] > 1) {
                                        rowItem = a;
                                        data[0].push(
                                            "<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">-</" +
                                            "li>"
                                        );
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li class=\"empty\">&#10;</li>");
                                    }
                                    data[1].push("<li class=\"empty\"></li>");
                                    data[2].push("<li>" + (
                                        newStart + 1
                                    ) + "</li>");
                                    data[3].push("<li class=\"insert\">");
                                    data[3].push(newTextArray[newStart]);
                                    data[3].push("&#10;</li>");
                                }
                                ntest    = false;
                                newStart = newStart + 1;
                            }
                        }
                    }
                }
            }
            if (options.diffcli === true) {
                if (a < opcodesLength && foldstart > 49) {
                    diffline = -1;
                }
                if (options.api === "dom") {
                    data.push("</li></ol>");
                    return [data.join("").replace("</li>", "<ol class=\"diffcli\">"), foldstart, diffline];
                }
                return [data, foldstart, diffline];
            }
            if (foldstart > -1) {
                data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount + rcount);
            }
            node.push(data[0].join(""));
            node.push("</ol><ol class=");
            if (options.diffview === "inline") {
                node.push("\"count\">");
            } else {
                node.push("\"data\" data-prettydiff-ignore=\"true\">");
                node.push(data[1].join(""));
                node.push("</ol></div>");
            }
            node.push(data[2].join(""));
            node.push("</ol><ol class=\"data\" data-prettydiff-ignore=\"true\">");
            node.push(data[3].join(""));
            if (options.diffview === "inline") {
                node.push("</ol>");
            } else {
                node.push("</ol></div>");
            }
            node.push(
                "<p class=\"author\">Diff view written by <a href=\"http://prettydiff.com/\">Pr" +
                "etty Diff</a>.</p></div>"
            );
            baseTab  = (errorout === 1)
                ? ""
                : "s";
            newTab   = (diffline === 1)
                ? ""
                : "s";
            finaldoc = "<p><strong>Number of differences:</strong> <em>" + (
                errorout + diffline
            ) + "</em> difference" + baseTab + " from <em>" + diffline + "</em> line" +
                    newTab + " of code.</p>" + node.join("");
            return [
                finaldoc
                    .replace(
                        /li\u0020class="equal"><\/li/g,
                        "li class=\"equal\">&#10;</li"
                    )
                    .replace(/\$#gt;/g, "&gt;")
                    .replace(/\$#lt;/g, "&lt;")
                    .replace(/%#lt;/g, "$#lt;")
                    .replace(/%#gt;/g, "$#gt;"),
                errorout,
                diffline
            ];
        }());
    };
    if ((typeof define === "object" || typeof define === "function") && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
        //requirejs support
        define(function diffview_requirejs() {
            return function diffview_requirejs_wrapper(x) {
                return diffview(x);
            };
        });
    } else if (typeof module === "object" && typeof module.parent === "object") {
        //commonjs and nodejs support
        module.exports = diffview;
    } else {
        global.prettydiff.diffview = diffview;
    }
}());
