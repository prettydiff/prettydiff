/*global ace, define, global, module*/
/*jshint laxbreak: true*/
/*

Written by Austin Cheney on 1 Mar 2017

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
                options.diff = options
                    .diff
                    .replace(/\r\n?/g, "\n");
                if (options.functions !== undefined) {
                    options.diff = options
                        .diff
                        .replace(options.functions.binaryCheck, "");
                }
                if (options.semicolon === true) {
                    options.diff   = options.diff.replace(/;\n/g, "\n").replace(/;$/, "");
                }
            }
            if (typeof options.source === "string") {
                options.source = options
                    .source
                    .replace(/\r\n?/g, "\n");
                if (options.functions !== undefined) {
                    options.source = options
                        .source
                        .replace(options.functions.binaryCheck, "");
                }
                if (options.semicolon === true) {
                    options.source = options.source.replace(/;\n/g, "\n").replace(/;$/, "");
                }
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
                for (a = 0; a < options.insize; a += 1) {
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
            opcodes = [],
            codeBuild = function diffview__opcodes() {
                var table = {},
                    lines = function diff_opcodes_lines(str) {
                        str = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                        return str.split("\n");
                    },
                    one   = (typeof options.source === "string")
                        ? lines(options.source)
                        : options.source,
                    two   = (typeof options.diff === "string")
                        ? lines(options.diff)
                        : options.diff,
                    len   = two.length,
                    a     = 0,
                    b     = 0,
                    c     = 0,
                    d     = 0,
                    first = (one.length > two.length),
                    codes = [],
                    fix   = function diffview__opcodes_fix(code) {
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
                                        code[0] = "insert";
                                        code[1] = -1;
                                        code[2] = -1;
                                    } else if (code[0] === "delete") {
                                        code[0] = "replace";
                                        code[3] = prior[3];
                                        code[4] = prior[4];
                                        codes.pop();
                                        prior = codes[codes.length - 1];
                                        if (prior !== undefined && prior[0] === "replace") {
                                            prior[2] = code[2];
                                            prior[4] = code[4];
                                            return;
                                        }
                                    }
                                } else if (code[0] === "delete") {
                                    prior[0] = "replace";
                                    prior[1] = code[1];
                                    prior[2] = code[1] + 1;
                                    code[1]  += 1;
                                }
                            }
                            if (prior[0] === "delete" && prior[2] - prior[1] === 1) {
                                if (code[4] - code[3] === 1) {
                                    if (code[0] === "replace") {
                                        prior[0] = "replace";
                                        prior[3] = code[3];
                                        prior[4] = code[4];
                                        code[0] = "delete";
                                        code[3] = -1;
                                        code[4] = -1;
                                    } else if (code[0] === "insert") {
                                        code[0] = "replace";
                                        code[1] = prior[1];
                                        code[2] = prior[2];
                                        codes.pop();
                                        prior = codes[codes.length - 1];
                                        if (prior !== undefined && prior[0] === "replace") {
                                            prior[2] = code[2];
                                            prior[4] = code[4];
                                            return;
                                        }
                                    }
                                } else if (code[0] === "insert") {
                                    prior[0] = "replace";
                                    prior[3] = code[3];
                                    prior[4] = code[3] + 1;
                                    code[3]  += 1;
                                }
                            }
                        }
                        codes.push(code);
                    },
                    equality = function diffview__opcodes_equality() {
                        c = a;
                        do {
                            table[one[c]].one -= 1;
                            table[one[c]].two -= 1;
                            if (table[one[c]].one < 1 && table[one[c]].two < 1) {
                                delete table[one[c]];
                            }
                            c += 1;
                        } while (c < len && one[c] === two[b + (c - a)]);
                        fix(["equal", a, c, b, b + (c - a)]);
                        b = b + (c - a) - 1;
                        a = c - 1;
                    };

                // * First Pass, account for lines from first file
                // * build the table from the second file
                do {
                    if (options.diffspaceignore === true) {
                        two[a] = two[a].replace(/\s+/g, "");
                    }
                    if (table[two[a]] === undefined) {
                        table[two[a]] = {
                            one : 0,
                            two : 1
                        };
                    } else {
                        table[two[a]].two += 1;
                    }
                    a += 1;
                } while (a < len);

                // * Second Pass, account for lines from second file
                // * build the table from the first file
                len = one.length;
                a   = 0;
                do {
                    if (options.diffspaceignore === true) {
                        one[a] = one[a].replace(/\s+/g, "");
                    }
                    if (table[one[a]] === undefined) {
                        table[one[a]] = {
                            one : 1,
                            two : 0
                        };
                    } else {
                        table[one[a]].one += 1;
                    }
                    a += 1;
                } while (a < len);

                a = 0;
                b = 0;
                len = Math.min(one.length, two.length);
                // find all equality... differences are what's left over
                // solve only for the second set
                // test removing reverse
                // test removing undefined checks for table refs

                do {
                    if (one[a] === two[b]) {
                        equality();
                    } else {
                        if (table[one[a]] !== undefined && table[one[a]].two === 0) {
                            c = a;
                            if (table[one[a + 1]] !== undefined && table[one[a + 1]].one === 1 && table[one[a + 1]].two === 1) {
                                if (one[a + 1] === two[b]) {
                                    fix(["delete", a, a + 1, -1, -1]);
                                    b -= 1;
                                } else {
                                    fix(["replace", a, a + 1, b, b + 1]);
                                }
                            } else if (table[two[b]] !== undefined && table[two[b]].one === 0) {
                                do {
                                    table[one[c]].one -= 1;
                                    if (table[one[c]].one < 1) {
                                        delete table[one[c]];
                                    }
                                    c += 1;
                                } while (c < len && one[c] !== undefined && table[one[c]] !== undefined && two[b + (c - a)] !== undefined && table[two[b + (c - a)]] !== undefined && table[one[c]].two === 0 && table[two[b + (c - a)]].one === 0 && one[c] !== two[b + (c - a)]);
                                fix(["replace", a, c, b, b + (c - a)]);
                                b = b + (c - a) - 1;
                                a = c - 1;
                            } else {
                                do {
                                    table[one[c]].one -= 1;
                                    if (table[one[c]].one < 1) {
                                        delete table[one[c]];
                                    }
                                    c += 1;
                                } while (c < len && one[c] !== undefined && table[one[c]] !== undefined && table[one[c]].two === 0);
                                fix(["delete", a, c, -1, -1]);
                                a = c - 1;
                                b -= 1;
                            }
                        } else if (table[two[b]] !== undefined && table[two[b]].one === 0) {
                            c = b;
                            if (table[one[a]] !== undefined && table[one[a]].two === 0) {
                                do {
                                    table[two[c]].two -= 1;
                                    if (table[two[c]].two < 1) {
                                        delete table[two[c]];
                                    }
                                    c += 1;
                                } while (c < len && one[a + (c - b)] !== undefined && two[c] !== undefined && table[two[c]] !== undefined && table[one[a + (c - b)]] !== undefined && table[one[a + (c - b)]].two === 0 && table[two[c]].one === 0 && one[a + (c - b)] !== two[b]);
                                fix(["replace", a, a + (c - b), b, c]);
                                a = a + (c - b) - 1;
                                b = c - 1;
                            } else {
                                do {
                                    table[two[c]].two -= 1;
                                    if (table[two[c]].two < 1) {
                                        delete table[two[c]];
                                    }
                                    c += 1;
                                } while (c < len && two[c] !== undefined && table[two[c]] !== undefined && table[two[c]].one === 0);
                                fix(["insert", -1, -1, b, c]);
                                b = c - 1;
                                a -= 1;
                            }
                        } else {
                            c = a;
                            d = b;
                            do {
                                c += 1;
                            } while (c < len && one[c] !== two[b] && table[one[c]].one + table[one[c]].two > 2);
                            do {
                                d += 1;
                            } while (d < len && one[a] !== two[d] && table[two[d]].one + table[two[d]].two > 2);
                            if (c - a === d - b) {
                                fix(["replace", a, c, b, d]);
                                d = a;
                                do {
                                    table[one[d]].one -= 1;
                                    if (table[one[d]].one < 1 && table[one[d]].two < 1) {
                                        delete table[one[d]];
                                    }
                                    table[two[b + (d - a)]].two -= 1;
                                    if (table[two[b + (d - a)]].one < 1 && table[two[b + (d - a)]].two < 1) {
                                        delete table[two[b + (d - a)]];
                                    }
                                    d += 1;
                                } while (d < c);
                                a = c - 1;
                                b = b + (d - a) - 1;
                            } else if (c - a < d - b) {
                                fix(["delete", a, c, -1, -1]);
                                d = a;
                                do {
                                    table[one[d]].one -= 1;
                                    if (table[one[d]].one < 1 && table[one[d]].two < 1) {
                                        delete table[one[d]];
                                    }
                                    d += 1;
                                } while (d < c);
                                a = c - 1;
                                b -= 1;
                            } else {
                                fix(["insert", -1, -1, b, d]);
                                c = b;
                                do {
                                    table[two[c]].two -= 1;
                                    if (table[two[c]].one < 1 && table[two[c]].two < 1) {
                                        delete table[two[c]];
                                    }
                                    c += 1;
                                } while (c < d);
                                b = d - 1;
                                a -= 1;
                            }
                        }
                    }
                    a += 1;
                    b += 1;
                } while ((a < len && first === false) || (b < len && first === true));
                c = one.length;
                len = two.length;
                if (c - a === len - b && c - a > 0) {
                    if (one[a] === two[b]) {
                        fix(["equal", a, c, b, len]);
                    } else {
                        fix(["replace", a, c, b, len]);
                    }
                } else if (a < c) {
                    fix(["delete", a, c, -1, -1]);
                } else if (b < len) {
                    fix(["insert", -1, -1, b, len]);
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
        // of differences



        // after the opcodes generate the other two core pieces of logic are
        // quaranteened into an anonymous function.
        return (function diffview__report() {
            var a              = 0,
                i              = 0,
                node           = ["<div class='diff'>"],
                data           = (options.diffcli === true)
                    ? [
                        [],
                        [],
                        [],
                        [],
                        [],
                        []
                    ]
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
                            for (x = start; x < dataMinLength; x += 1) {
                                for (y = start; y < max; y += 1) {
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
                            if (options.diffspaceignore === true) {
                                if (whitetest.test(dataA.join("").slice(b, x)) === true || whitetest.test(dataB.join("").slice(b, x)) === true) {
                                    whitespace = true;
                                }
                            }
                            //package the output
                            if (dataA[y] === dataB[x]) {
                                if (dataA[y - 1] === dataB[x - 1] && x !== start) {
                                    x -= 1;
                                    y -= 1;
                                }
                                return [x, y, 0, whitespace];
                            }
                            if (dataA[x] === dataB[y]) {
                                if (dataA[x - 1] === dataB[y - 1] && x !== start) {
                                    x -= 1;
                                    y -= 1;
                                }
                                return [x, y, 1, whitespace];
                            }
                        };
                    //if same after accounting for character entities then exit
                    if (cleanedA === cleanedB) {
                        return [lineA, lineB];
                    }
                    //prevent extra error counting that occurred before entering this function
                    errorout -= 1;
                    //diff for tabs
                    if (tabFix !== "" && cleanedA.length !== cleanedB.length && cleanedA.replace(tabFix, "") === cleanedB.replace(tabFix, "") && options.diffspaceignore === false) {
                        errorout += 1;
                        if (options.diffcli === true) {
                            tabdiff[0] = tabdiff[0] + tabdiff[2];
                            tabdiff[0] = tabdiff[0]
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>");
                            tabdiff[1] = tabdiff[1] + tabdiff[3];
                            tabdiff[1] = tabdiff[1]
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>");
                            return [tabdiff[0], tabdiff[1]];
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
                            // fuzzy string comparison returns an array with these indexes 0 - shorter
                            // ending index of difference 1 - longer ending index of difference 2 - 0 if
                            // index 2 is for dataA or 1 for dataB 3 - whether the difference is only
                            // whitespace
                            currentdiff = compare(b);
                            //supply the difference start indicator
                            if (currentdiff[3] === false) {
                                //count each difference
                                errorout += 1;
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
                                        currentdiff[0] += 1;
                                    } while (currentdiff[1] > currentdiff[0]);
                                } else {
                                    do {
                                        dataB.unshift("");
                                        currentdiff[0] += 1;
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
                        errorout                += 1;
                    }
                    if (dataB.length > dataA.length && dataA[dataA.length - 1] !== undefined && dataA[dataA.length - 1].indexOf(strEnd) < 1) {
                        dataA.push(strStart + strEnd);
                        dataB[dataA.length - 1] = strStart + dataB[dataA.length - 1];
                        dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                        errorout                += 1;
                    }
                    // options.diffcli output doesn't need XML protected characters to be escaped
                    // because its output is the command line
                    if (options.diffcli === true) {
                        return [
                            dataA
                                .join("")
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>"),
                            dataB
                                .join("")
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>")
                        ];
                    }
                    return [
                        dataA
                            .join("")
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>"),
                        dataB
                            .join("")
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>")
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

                if (foldstart > -1) {
                    data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                }
                for (i = 0; i < rowcnt; i += 1) {
                    //apply options.context collapsing for the output, if needed
                    if (options.context > -1 && opcodes.length > 1 && ((a > 0 && i === options.context) || (a === 0 && i === 0)) && change === "equal") {
                        ctest = false;
                        jump  = rowcnt - ((a === 0
                            ? 1
                            : 2) * options.context);
                        if (jump > 1) {
                            baseStart += jump;
                            newStart  += jump;
                            i         += jump - 1;
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
                        diffline += 1;
                    }
                    foldcount += 1;
                    // this is a check against false positives incurred by increasing or reducing of
                    // nesting.  At this time it only checks one level deep.
                    if (tab !== "") {
                        if (btest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof baseTextArray[baseStart + 1] === "string" && typeof newTextArray[newStart] === "string" && baseTab[baseStart + 1] === newTab[newStart] && baseTab[baseStart] !== newTab[newStart] && (typeof newTextArray[newStart - 1] !== "string" || baseTab[baseStart] !== newTab[newStart - 1])) {
                            btest = true;
                        } else if (ntest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof newTextArray[newStart + 1] === "string" && typeof baseTextArray[baseStart] === "string" && newTab[newStart + 1] === baseTab[baseStart] && newTab[newStart] !== baseTab[baseStart] && (typeof baseTextArray[baseStart - 1] !== "string" || newTab[newStart] !== baseTab[baseStart - 1])) {
                            ntest = true;
                        }
                    }
                    if (options.diffcli === true) {
                        if (options.diffspaceignore === true && change === "replace" && baseTextArray[baseStart] !== undefined && newTextArray[newStart] !== undefined && baseTextArray[baseStart].replace(/\s+/g, "") === newTextArray[newStart].replace(/\s+/g, "")) {
                            change   = "equal";
                            errorout -= 1;
                        } else {

                            // data array schema: 0 - base line number 1 - base code line 2 - new line
                            // number 3 - new code line 4 - change 5 - index of options.context (not
                            // parallel)
                            if (ntest === true || change === "insert") {
                                if (options.diffspaceignore === false || (/^(\s+)$/g).test(newTextArray[newStart]) === false) {
                                    data[0].push(0);
                                    data[1].push("");
                                    data[2].push(newStart + 1);
                                    data[3].push(newTextArray[newStart]);
                                    data[4].push("insert");
                                    errorout += 1;
                                }
                            } else if (btest === true || change === "delete") {
                                if (options.diffspaceignore === false || (/^(\s+)$/g).test(baseTextArray[baseStart]) === false) {
                                    data[0].push(baseStart + 1);
                                    data[1].push(baseTextArray[baseStart]);
                                    data[2].push(0);
                                    data[3].push("");
                                    data[4].push("delete");
                                    errorout += 1;
                                }
                            } else if (change === "replace") {
                                if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                                    if (baseTextArray[baseStart] === "") {
                                        charcompOutput = ["", newTextArray[newStart]];
                                    } else if (newTextArray[newStart] === "") {
                                        charcompOutput = [baseTextArray[baseStart], ""];
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
                                if (options.diffspaceignore === false || baseTextArray[baseStart].replace(/\s+/g, "") !== newTextArray[newStart].replace(/\s+/g, "")) {
                                    data[0].push(baseStart + 1);
                                    data[1].push(baseTextArray[baseStart]);
                                    data[2].push(newStart + 1);
                                    data[3].push(newTextArray[newStart]);
                                    data[4].push(change);
                                    if (change !== "equal") {
                                        errorout += 1;
                                    }
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
                        }

                        // this is the final of the three primary components this is where the output is
                        // built
                    } else if (options.diffview === "inline") {
                        if (options.diffspaceignore === true && change === "replace" && baseTextArray[baseStart].replace(/\s+/g, "") === newTextArray[newStart].replace(/\s+/g, "")) {
                            change   = "equal";
                            errorout -= 1;
                        }
                        if (options.context < 0 && rowItem < a) {
                            rowItem = a;
                            if (foldstart > -1) {
                                if (data[0][foldstart + 1] === foldcount - 1) {
                                    data[0][foldstart] = "<li>" + data[0][foldstart].slice(data[0][foldstart].indexOf("line xxx\">- ") + 12);
                                } else {
                                    data[0][foldstart] = data[0][foldstart].replace("xxx", (foldcount - 1 + rcount));
                                }
                            }
                            if (change !== "replace") {
                                data[0].push("<li class=\"fold\" title=\"folds from line " + (foldcount + rcount) + " to line xxx\">- ");
                                foldstart = data[0].length - 1;
                                if (ntest === true || change === "insert") {
                                    data[0].push("&#10;");
                                } else {
                                    data[0].push(baseStart + 1);
                                }
                                data[0].push("</li>");
                            } else {
                                rcount += 1;
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
                            rcount += 1;
                        }
                        if (ntest === true || change === "insert") {
                            data[2].push("<li>");
                            data[2].push(newStart + 1);
                            data[2].push("&#10;</li>");
                            if (options.diffspaceignore === true && newTextArray[newStart].replace(/\s+/g, "") === "") {
                                data[3].push("<li class=\"equal\">");
                                diffline -= 1;
                            } else {
                                data[3].push("<li class=\"insert\">");
                            }
                            data[3].push(newTextArray[newStart]);
                            data[3].push("&#10;</li>");
                        } else if (btest === true || change === "delete") {
                            data[2].push("<li class=\"empty\">&#10;</li>");
                            if (options.diffspaceignore === true && baseTextArray[baseStart].replace(/\s+/g, "") === "") {
                                data[3].push("<li class=\"equal\">");
                                diffline -= 1;
                            } else {
                                data[3].push("<li class=\"delete\">");
                            }
                            data[3].push(baseTextArray[baseStart]);
                            data[3].push("&#10;</li>");
                        } else if (change === "replace") {
                            if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                                if (baseTextArray[baseStart] === "") {
                                    charcompOutput = ["", newTextArray[newStart]];
                                } else if (newTextArray[newStart] === "") {
                                    charcompOutput = [baseTextArray[baseStart], ""];
                                } else if (baseStart < baseEnd && newStart < newEnd) {
                                    charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                }
                            }
                            if (baseStart < baseEnd) {
                                data[0].push("<li>" + (baseStart + 1) + "</li>");
                                data[2].push("<li class=\"empty\">&#10;</li>");
                                if (options.diffspaceignore === true && baseTextArray[baseStart].replace(/\s+/g, "") === "") {
                                    data[3].push("<li class=\"equal\">");
                                    diffline -= 1;
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
                                    diffline -= 1;
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
                            if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                            } else {
                                charcompOutput = [baseTextArray[baseStart], newTextArray[newStart]];
                            }
                            if (baseStart === Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1 || newStart === Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                repeat = true;
                            }
                            if (repeat === false) {
                                if (baseStart < baseEnd) {
                                    if (options.context < 0 && rowItem < a && (opcodes[a][2] - opcodes[a][1] > 1 || opcodes[a][4] - opcodes[a][3] > 1)) {
                                        rowItem = a;
                                        data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">- " + (baseStart + 1) + "</li>");
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li>" + (baseStart + 1) + "</li>");
                                    }
                                    data[1].push("<li class=\"");
                                    if (newStart >= newEnd) {
                                        if (options.diffspaceignore === true && baseTextArray[baseStart].replace(/\s+/g, "") === "") {
                                            data[1].push("equal");
                                            diffline -= 1;
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
                                        data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">- &#10;</li>");
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li class=\"empty\">&#10;</li>");
                                    }
                                    data[1].push("<li class=\"empty\"></li>");
                                }
                                if (newStart < newEnd) {
                                    data[2].push("<li>" + (newStart + 1) + "</li>");
                                    data[3].push("<li class=\"");
                                    if (baseStart >= baseEnd) {
                                        if (options.diffspaceignore === true && newTextArray[newStart].replace(/\s+/g, "") === "") {
                                            data[3].push("equal");
                                            diffline -= 1;
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
                                baseStart += 1;
                            }
                            if (newStart < newEnd) {
                                newStart += 1;
                            }
                        } else if (btest === true || (typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] !== "string")) {
                            if (baseStart !== Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1) {
                                if (options.context < 0 && rowItem < a && opcodes[a][2] - opcodes[a][1] > 1) {
                                    rowItem = a;
                                    data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">- " + (baseStart + 1) + "</li>");
                                    foldstart = data[0].length - 1;
                                } else {
                                    data[0].push("<li>" + (baseStart + 1) + "</li>");
                                }
                                data[1].push("<li class=\"delete\">");
                                data[1].push(baseTextArray[baseStart]);
                                data[1].push("&#10;</li>");
                                data[2].push("<li class=\"empty\">&#10;</li>");
                                data[3].push("<li class=\"empty\"></li>");
                            }
                            btest     = false;
                            baseStart += 1;
                        } else if (ntest === true || (typeof baseTextArray[baseStart] !== "string" && typeof newTextArray[newStart] === "string")) {
                            if (newStart !== Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                if (options.context < 0 && rowItem < a && opcodes[a][4] - opcodes[a][3] > 1) {
                                    rowItem = a;
                                    data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">-</li>");
                                    foldstart = data[0].length - 1;
                                } else {
                                    data[0].push("<li class=\"empty\">&#10;</li>");
                                }
                                data[1].push("<li class=\"empty\"></li>");
                                data[2].push("<li>" + (newStart + 1) + "</li>");
                                data[3].push("<li class=\"insert\">");
                                data[3].push(newTextArray[newStart]);
                                data[3].push("&#10;</li>");
                            }
                            ntest    = false;
                            newStart += 1;
                        }
                    }
                }
            }
            if (foldstart > -1) {
                data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount + rcount);
            }
            if (options.diffcli === true) {
                return [data, errorout, diffline];
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
            node.push("<p class=\"author\">Diff view written by <a href=\"http://prettydiff.com/\">Pret" +
                    "ty Diff</a>.</p></div>");
            baseTab  = (errorout === 1)
                ? ""
                : "s";
            newTab   = (diffline === 1)
                ? ""
                : "s";
            finaldoc = "<p><strong>Number of differences:</strong> <em>" + (errorout + diffline) + "</em> difference" + baseTab + " from <em>" + diffline + "</em> line" + newTab + " of code.</p>" + node.join("");
            return [
                finaldoc
                    .replace(/li\u0020class="equal"><\/li/g, "li class=\"equal\">&#10;</li")
                    .replace(/\$#gt;/g, "&gt;")
                    .replace(/\$#lt;/g, "&lt;")
                    .replace(/%#lt;/g, "$#lt;")
                    .replace(/%#gt;/g, "$#gt;"),
                errorout,
                diffline
            ];
        }());
    };
    if (typeof module === "object" && typeof module.parent === "object") {
        //commonjs and nodejs support
        module.exports = diffview;
    } else if ((typeof define === "object" || typeof define === "function") && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
        //requirejs support
        define(function requirejs(require, module) {
            module.exports = function requirejs_diffview_export(x) {
                return diffview(x);
            };
            //worthless if block to appease RequireJS and JSLint
            if (typeof require === "number") {
                return require;
            }
            return function requirejs_diffview_module(x) {
                return diffview(x);
            };
        });
    } else {
        global.prettydiff.diffview = diffview;
    }
}());
