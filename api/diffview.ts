(function diffview_init(): void {
    "use strict";
    const diffview = function diffview_(options : any): [string, number, number]{
        const tab: string = (function diffview_tab(): string {
                let a: number = 0;
                const output: string[] = [];
                if (options.indent_char === "" || options.indent_size < 1) {
                    return "";
                }
                do {
                    output.push(options.indent_char);
                    a = a + 1;
                } while (a < options.indent_size);
                return output.join("");
            }()),
            // translates source code from a string to an array by splitting on line breaks
            stringAsLines = function diffview_stringAsLines(str : string): string[]{
                const lines = (options.diff_format === "text")
                    ? str
                    : str
                        .replace(/&/g, "&amp;")
                        .replace(/&#lt;/g, "$#lt;")
                        .replace(/&#gt;/g, "$#gt;")
                        .replace(/</g, "$#lt;")
                        .replace(/>/g, "$#gt;");
                if (options.crlf === true) {
                    return lines.split("\r\n");
                }
                return lines.split("\n");
            },
            // array representation of base source
            baseTextArray: string[] = (typeof options.source === "string")
                ? stringAsLines(options.source)
                : options.source,
            // array representation of new source
            newTextArray: string[] = (typeof options.diff === "string")
                ? stringAsLines(options.diff)
                : options.diff,
            codeBuild = function diffview_opcodes(): opcodes {
                const table: difftable = {},
                    one: string[] = baseTextArray,
                    two: string[] = newTextArray;
                let lena: number = one.length,
                    lenb: number = two.length,
                    a: number = 0,
                    b: number = 0,
                    c: number = 0,
                    d: number = 0,
                    codes: opcodes = [],
                    clean = function diffview_opcodes_clean(ln:string): string|void {
                        if (ln === undefined) { return; }
                        return options.diff_space_ignore === true ? ln.replace(/\s+/g, '') : ln;
                    },
                    fix = function diffview_opcodes_fix(code:codes): void {
                        let len:number = codes.length - 1,
                            prior:[string, number, number, number, number] = codes[len];
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
                                if (codes.length > 1 && prior[2] === code[2] && prior[4] === code[4]) {
                                    if (prior[0] === "insert" && clean(two[codes[codes.length - 2][4] - (prior[4] - prior[3])]) === clean(one[codes[codes.length - 2][1]])) {
                                        codes.pop();
                                        len = len - 1;
                                        codes[len] = ["insert", -1, -1, codes[len][3], codes[len][4] - (prior[4] - prior[3])];
                                        if (codes[len][4] < 0) {
                                            codes[len][4] = prior[4] - prior[3];
                                        }
                                        do {
                                            // one-sided replacement undo, more like undelete
                                            table[one[c]][0] = table[one[c]][0] + 1;
                                            c = c - 1;
                                        } while (c > codes[codes.length - 2][2]);
                                        d = codes[len][4] - 1;
                                    }
                                }
                                return;
                            }
                            if (prior[0] === "insert" && prior[4] - prior[3] === 1) {
                                if (code[2] - code[1] === 1) {
                                    if (code[0] === "replace") {
                                        codes[len] = ["replace", code[1], code[2], prior[3], prior[4]];
                                        prior = codes[len];
                                        code = ["insert", -1, -2, code[3], code[4]];
                                    } else if (code[0] === "delete") {
                                        code = ["replace", code[1], code[2], prior[3], prior[4]];
                                        codes.pop();
                                        len = len - 1;
                                        prior = codes[len];
                                        if (codes[len][0] === "replace") {
                                            prior[2] = code[2];
                                            prior[4] = code[4];
                                            return;
                                        }
                                    }
                                } else if (code[0] === "delete") {
                                    codes[len] = ["replace", code[1], code[1] + 1, prior[3], prior[4]];
                                    prior = codes[len];
                                    code[1] = code[1] + 1;
                                } else if (code[0] === "replace") {
                                    codes[len] = ["replace", code[1], code[1] + 1, prior[3], prior[4]];
                                    prior = codes[len];
                                    c = (prior[2] > 0)
                                        ? prior[2]
                                        : 0;
                                    d = (prior[4] > 0)
                                        ? prior[4]
                                        : 0;
                                    return;
                                }
                            } else if (prior[0] === "insert" && code[0] === "delete" && code[2] - code[1] === 1) {
                                prior[4] = prior[4] - 1;
                                code = ["replace", code[1], code[2], prior[4], prior[4] + 1];
                            } else if (prior[0] === "delete" && prior[2] - prior[1] === 1) {
                                if (code[4] - code[3] === 1) {
                                    if (code[0] === "replace") {
                                        codes[len] = ["replace", prior[1], prior[2], code[3], code[4]];
                                        prior = codes[len];
                                        code = ["delete", code[1], code[2], -1, -1];
                                    } else if (code[0] === "insert") {
                                        code = ["replace", prior[1], prior[2], code[3], code[4]];
                                        codes.pop();
                                        len = len - 1;
                                        prior = codes[len];
                                        if (codes[len][0] === "replace") {
                                            prior[2] = code[2];
                                            prior[4] = code[4];
                                            return;
                                        }
                                    }
                                } else if (code[0] === "insert") {
                                    codes[len] = ['replace', prior[1], prior[2], code[3], code[3] + 1];
                                    prior = codes[len];
                                    code[3] = code[3] + 1;
                                } else if (code[0] === "replace") {
                                    codes[len] = ["replace", prior[1], prior[2], code[3], code[4] + 1];
                                    c = (prior[2] > 0)
                                        ? prior[2]
                                        : 0;
                                    d = (prior[4] > 0)
                                        ? prior[4]
                                        : 0;
                                    return;
                                }
                            } else if (prior[0] === "delete" && code[0] === "insert" && code[4] - code[3] === 1) {
                                prior[2] = prior[2] - 1;
                                code = ["replace", prior[2], prior[2] + 1, code[3], code[4]];
                            } else if (prior[0] === "replace") {
                                if (code[0] === "delete" && code[2] - 1 > a) {
                                    c = (code[2] - 1 > 0)
                                        ? code[2] - 1
                                        : 0;
                                    d = (prior[3] > 0)
                                        ? prior[3]
                                        : 0;
                                    codes[len] = ["delete", prior[1], code[2] - 1, -1, -1];
                                    return;
                                }
                                if (code[0] === "insert" && code[4] - 1 > b) {
                                    c = (prior[1] > 0)
                                        ? prior[1]
                                        : 0;
                                    d = (code[4] - 1 > 0)
                                        ? code[4] - 1
                                        : 0;
                                    codes[len] = ["insert", -1, -1, prior[3], code[4] - 1];
                                    return;
                                }
                            }
                        }
                        if (codes.length > 1 && codes[codes.length - 2][0] === codes[len][0]) {
                            codes[codes.length - 2][2] = codes[len][2];
                            codes[codes.length - 2][4] = codes[len][4];
                            codes.pop();
                            diffview_opcodes_fix(code);
                        } else {
                            codes.push(code);
                        }
                    },
                    equality = function diffview_opcodes_equality(): void {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            table[one[c]][1] = table[one[c]][1] - 1;
                            c = c + 1;
                            d = d + 1;
                        } while (c < lena && d < lenb && clean(one[c]) === clean(two[d]));
                        fix(["equal", a, c, b, d]);
                        b = d - 1;
                        a = c - 1;
                    },
                    deletion = function diffview_opcodes_deletion(): void {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            c = c + 1;
                        } while (c < lena && table[one[c]][1] < 1);
                        fix(["delete", a, c, -1, -1]);
                        a = c - 1;
                        b = d - 1;
                    },
                    deletionStatic = function diffview_opcodes_deletionStatic(): void {
                        table[one[a]][0] = table[one[a]][0] - 1;
                        fix([
                            "delete", a, a + 1,
                            -1,
                            -1
                        ]);
                        a = c;
                        b = d - 1;
                    },
                    insertion = function diffview_opcodes_insertion(): void {
                        do {
                            table[two[d]][1] = table[two[d]][1] - 1;
                            d = d + 1;
                        } while (d < lenb && table[two[d]][0] < 1);
                        fix(["insert", -1, -1, b, d]);
                        a = c - 1;
                        b = d - 1;
                    },
                    insertionStatic = function diffview_opcodes_insertionStatic(): void {
                        table[two[b]][1] = table[two[b]][1] - 1;
                        fix([
                            "insert", -1, -1, b, b + 1
                        ]);
                        a = c - 1;
                        b = d;
                    },
                    replacement = function diffview_opcodes_replacement(): void {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            table[two[d]][1] = table[two[d]][1] - 1;
                            c = c + 1;
                            d = d + 1;
                        } while (c < lena && d < lenb && table[one[c]][1] > 0 && table[two[d]][0] > 0);
                        fix(["replace", a, c, b, d]);
                        a = c - 1;
                        b = d - 1;
                    },
                    replaceUniques = function diffview_opcodes_replaceUniques(): void {
                        do {
                            table[one[c]][0] = table[one[c]][0] - 1;
                            c = c + 1;
                            d = d + 1;
                        } while (c < lena && d < lenb && table[one[c]][1] < 1 && table[two[d]][0] < 1);
                        fix(["replace", a, c, b, d]);
                        a = c - 1;
                        b = d - 1;
                    };
                // * First Pass, account for lines from first file
                // * build the table from the second file
                do {
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
                a = 0;
                do {
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
                    if (clean(one[a]) === clean(two[b])) {
                        equality();
                    } else if (table[one[a]][1] < 1 && table[two[b]][0] < 1) {
                        replaceUniques();
                    } else if (table[one[a]][1] < 1 && clean(one[a + 1]) !== clean(two[b + 2])) {
                        deletion();
                    } else if (table[two[b]][0] < 1 && clean(one[a + 2]) !== clean(two[b + 1])) {
                        insertion();
                    } else if (table[one[a]][0] - table[one[a]][1] === 1 && clean(one[a + 1]) !== clean(two[b + 2])) {
                        deletionStatic();
                    } else if (table[two[b]][1] - table[two[b]][0] === 1 && clean(one[a + 2]) !== clean(two[b + 1])) {
                        insertionStatic();
                    } else if (clean(one[a + 1]) === clean(two[b])) {
                        deletion();
                    } else if (clean(one[a]) === clean(two[b + 1])) {
                        insertion();
                    } else {
                        replacement();
                    }
                    a = a + 1;
                    b = b + 1;
                } while (a < lena && b < lenb);
                if (lena - a === lenb - b) {
                    if (clean(one[a]) === clean(two[b])) {
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
        let errorout: number = 0,
            // diffline is a count of lines that are not equal
            diffline: number = 0,
            // tab is a construct of a standard indentation for code
            opcodes: opcodes = [];
        if (Array.isArray(options.source) === false && typeof options.source !== "string") {
            return ["Error: source value is not a string or array!", 0, 0];
        }
        if (Array.isArray(options.diff) === false && typeof options.diff !== "string") {
            return ["Error: diff value is not a string or array!", 0, 0];
        }
        opcodes = codeBuild();
        // diffview application contains three primary parts
        // 1.  opcodes - performs the 'largest common subsequence'    calculation to
        // determine which lines are different.  I    did not write this logic.  I have
        // rewritten it for    performance, but original logic is still intact.
        // 2.  charcomp - performs the 'largest common subsequence' upon    characters
        // of two compared lines.
        // 3.  The construction of the output into the 'node' array errorout is a count
        // of differences after the opcodes generate the other two core pieces of logic
        // are quaranteened into an anonymous function.
        return(function diffview_report(): [string, number, number]{
            let a: number = 0,
                i: number = 0,
                node: string[] = ["<div class='diff'>"],
                diffplural: string = "s",
                linesplural: string = "s",
                baseStart: number = 0,
                baseEnd: number = 0,
                newStart: number = 0,
                newEnd: number = 0,
                rowcnt: number = 0,
                rowItem: number = -1,
                rcount: number = 0,
                foldcount: number = 0,
                foldstart: number = -1,
                jump: number = 0,
                change: string = "",
                btest: boolean = false,
                ntest: boolean = false,
                repeat: boolean = false,
                ctest: boolean = true,
                code: codes,
                baseItem:string = "",
                newItem:string = "",
                charcompOutput: [
                    string, string
                ],
                finaldoc: string = "";
            const data: [
                    string[], string[], string[], string[]
                ] = [
                    [], [], [], []
                ],
                json: diffJSON = [],
                clidata: string[] = [],
                tabFix: RegExp = new RegExp(`^((${tab.replace(/\\/g, "\\")})+)`),
                noTab = function diffview_report_noTab(str : string[]): string[]{
                    let b: number = 0;
                    const strLen: number = str.length,
                        output: string[] = [];
                    if (strLen < 1) {
                        return output;
                    }
                    do {
                        output.push(str[b].replace(tabFix, ""));
                        b = b + 1;
                    } while (b < strLen);
                    return output;
                },
                htmlfix = function diffview_report_htmlfix(item:string): string {
                    if (item === undefined) {
                        return "";
                    }
                    return item
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                },
                baseTab: string[] = (tab === "")
                    ? []
                    : noTab(baseTextArray),
                newTab: string[] = (tab === "")
                    ? []
                    : noTab(newTextArray),
                opcodesLength: number = opcodes.length,
                // this is the character comparison logic that performs the 'largest common
                // subsequence' between two lines of code
                charcomp = function diffview_report_charcomp(lineA:string, lineB:string): [string, string]{
                    let b: number = 0,
                        currentdiff = [],
                        dataMinLength: number = 0,
                        dataA: string[] = [],
                        dataB: string[] = [];
                    const cleanedA: string = (options.diff_format === "text")
                            ? lineA
                            : lineA
                                .replace(/&#160;/g, " ")
                                .replace(/&nbsp;/g, " ")
                                .replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">")
                                .replace(/\$#lt;/g, "<")
                                .replace(/\$#gt;/g, ">")
                                .replace(/&amp;/g, "&"),
                        cleanedB: string = (options.diff_format === "text")
                            ? lineB
                            : lineB
                                .replace(/&#160;/g, " ")
                                .replace(/&nbsp;/g, " ")
                                .replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">")
                                .replace(/\$#lt;/g, "<")
                                .replace(/\$#gt;/g, ">")
                                .replace(/&amp;/g, "&"),
                        regStart: RegExp = (/_pdiffdiff\u005f/g),
                        regEnd: RegExp = (/_epdiffdiff\u005f/g),
                        strStart: string = "_pdiffdiff\u005f",
                        strEnd: string = "_epdiffdiff\u005f",
                        tabdiff: [string, string, string, string] = (function diffview_report_charcomp_tabdiff(): [string, string, string, string]{
                            let tabMatchA: string = "",
                                tabMatchB: string = "",
                                splitA: string = "",
                                splitB: string = "",
                                matchListA: string[] | null = cleanedA.match(tabFix),
                                matchListB: string[] | null = cleanedB.match(tabFix);
                            if (matchListA === null || matchListB === null || (matchListA[0] === "" && matchListA.length === 1) || (matchListB[0] === "" && matchListB.length === 1)) {
                                return ["", "", cleanedA, cleanedB];
                            }
                            tabMatchA = matchListA[0];
                            tabMatchB = matchListB[0];
                            splitA = cleanedA.split(tabMatchA)[1];
                            splitB = cleanedB.split(tabMatchB)[1];
                            if (tabMatchA.length > tabMatchB.length) {
                                tabMatchA = tabMatchA.slice(0, tabMatchB.length) + strStart + tabMatchA.slice(tabMatchB.length) + strEnd;
                            } else {
                                tabMatchB = tabMatchB.slice(0, tabMatchA.length) + strStart + tabMatchB.slice(tabMatchA.length) + strEnd;
                            }
                            return [tabMatchA, tabMatchB, splitA, splitB];
                        }()),
                        whiteout = function diffview_report_charcomp_whiteout(whitediff : string): string {
                            const spacetest: RegExp = (/<((em)|(pd))>\u0020+<\/((em)|(pd))>/),
                                crtest: RegExp = (/<((em)|(pd))>\r+<\/((em)|(pd))>/);
                            if (spacetest.test(whitediff) === true) {
                                return whitediff;
                            }
                            if (crtest.test(whitediff) === true) {
                                return whitediff.replace(/\s+/, "(carriage return)");
                            }
                            return whitediff.replace(/\s+/, "(white space differences)");
                        },
                        // compare is the fuzzy string comparison algorithm
                        compare = function diffview_report_charcomp_compare(start : number): [number, number, number, boolean]{
                            let x: number = 0,
                                y: number = 0,
                                whitespace: boolean = false,
                                wordtest: boolean = false,
                                store: compareStore = [];
                            const max: number = Math.max(dataA.length, dataB.length),
                                sorta = function diffview_report_charcomp_compare_sorta(a : number[], b : number[]): 1 | -1 {
                                    if(a[1] - a[0] < b[1] - b[0]) {
                                        return 1;
                                    }
                                    return -1;
                                },
                                sortb = function diffview_report_charcomp_compare_sortb(a : number[], b : number[]): 1 | -1 {
                                    if(a[0] + a[1] > b[0] + b[1]) {
                                        return 1;
                                    }
                                    return -1;
                                },
                                whitetest: RegExp = (/^(\s+)$/);
                            // first gather a list of all matching indexes into an array
                            x = start;
                            do {
                                y = start;
                                do {
                                    if (dataA[x] === dataB[y] || dataB[x] === dataA[y]) {
                                        store.push([x, y]);
                                        if (dataA[y] === dataB[x] && dataA[y + 1] === dataB[x + 1] && whitetest.test(dataB[x - 1]) === true) {
                                            wordtest = true;
                                            store = [[x, y]];
                                        }
                                        if (dataA[x] === dataB[y] && dataA[x + 1] === dataB[y + 1] && whitetest.test(dataB[y - 1]) === true) {
                                            wordtest = true;
                                            store = [[x, y]];
                                        }
                                        break;
                                    }
                                    y = y + 1;
                                } while (y < max);
                                if (wordtest === true) {
                                    break;
                                }
                                x = x + 1;
                            } while (x < dataMinLength);
                            // if there are no character matches then quit out
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
                            // x should always be the shorter index (change start)
                            if (store[0][0] < store[0][1]) {
                                x = store[0][0];
                                y = store[0][1];
                            } else {
                                y = store[0][0];
                                x = store[0][1];
                            }
                            // package the output
                            if (dataA[y] === dataB[x]) {
                                if (dataA[y - 1] === dataB[x - 1] && x !== start) {
                                    x = x - 1;
                                    y = y - 1;
                                }
                                if (options.diff_space_ignore === true && ((whitetest.test(dataA[y - 1]) === true && y - start > 0) || (whitetest.test(dataB[x - 1]) === true && x - start > 0))) {
                                    whitespace = true;
                                }
                                return [x, y, 0, whitespace];
                            }
                            if (dataA[x] === dataB[y]) {
                                if (dataA[x - 1] === dataB[y - 1] && x !== start) {
                                    x = x - 1;
                                    y = y - 1;
                                }
                                if (options.diff_space_ignore === true && ((whitetest.test(dataA[x - 1]) === true && x - start > 0) || (whitetest.test(dataB[y - 1]) === true && y - start > 0))) {
                                    whitespace = true;
                                }
                                return [x, y, 1, whitespace];
                            }
                        };
                    // if same after accounting for character entities then exit
                    if (cleanedA === cleanedB) {
                        return [lineA, lineB];
                    }
                    // prevent extra error counting that occurred before entering this function
                    errorout = errorout - 1;
                    // diff for tabs
                    if (tab !== "" && cleanedA
                        .length !== cleanedB
                        .length && cleanedA
                        .replace(tabFix, "") === cleanedB
                        .replace(tabFix, "") && options
                        .diff_space_ignore === false) {
                        errorout = errorout + 1;
                        if (options.diff_format === "text") {
                            tabdiff[0] = tabdiff[0] + tabdiff[2];
                            tabdiff[0] = tabdiff[0].replace(regStart, "<pd>").replace(regEnd, "</pd>");
                            tabdiff[1] = tabdiff[1] + tabdiff[3];
                            tabdiff[1] = tabdiff[1].replace(regStart, "<pd>").replace(regEnd, "</pd>");
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
                    // turn the pruned input into arrays
                    dataA = cleanedA.split("");
                    dataB = cleanedB.split("");
                    // the length of the shortest array
                    dataMinLength = Math.min(dataA.length, dataB.length);
                    do { // if undefined break the loop
                        if (dataA[b] === undefined || dataB[b] === undefined) {
                            break;
                        }
                        // iterate until the arrays are not the same
                        if (dataA[b] !== dataB[b]) {
                            // fuzzy string comparison returns an array with these indexes 0 - shorter
                            // ending index of difference 1 - longer ending index of difference 2 - 0 if
                            // index 2 is for dataA or 1 for dataB 3 - whether the difference is only
                            // whitespace
                            currentdiff = compare(b);
                            // supply the difference start indicator
                            if (currentdiff[3] === false) { // count each difference
                                errorout = errorout + 1;
                                if (b > 0) {
                                    dataA[b - 1] = dataA[b - 1] + strStart;
                                    dataB[b - 1] = dataB[b - 1] + strStart;
                                } else {
                                    dataA[b] = strStart + dataA[b];
                                    dataB[b] = strStart + dataB[b];
                                }
                                // complex decision tree on how to supply difference end indicator
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
                                        if (currentdiff[1] - currentdiff[0] === currentdiff[0]) {
                                            if (dataA[b].indexOf(strStart) > -1) {
                                                dataA[b] = dataA[b] + strEnd;
                                            } else {
                                                dataA[b] = strEnd + dataA[b];
                                            }
                                        } else {
                                            if (dataA[currentdiff[0]].indexOf(strStart) > -1) {
                                                dataA[currentdiff[0]] = dataA[currentdiff[0]] + strEnd;
                                            } else {
                                                dataA[currentdiff[0]] = strEnd + dataA[currentdiff[0]];
                                            }
                                        }
                                    }
                                    if (currentdiff[1] > dataB.length - 1 || currentdiff[0] === dataMinLength) {
                                        dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                                    } else if (currentdiff[1] - currentdiff[0] === currentdiff[0]) {
                                        dataB[b + (currentdiff[1] - currentdiff[0])] = dataB[b + (currentdiff[1] - currentdiff[0])] + strEnd;
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
                                        if (currentdiff[1] - currentdiff[0] === currentdiff[0]) {
                                            if (dataB[b].indexOf(strStart) > -1) {
                                                dataB[b] = dataB[b] + strEnd;
                                            } else {
                                                dataB[b] = strEnd + dataB[b];
                                            }
                                        } else {
                                            if (dataB[currentdiff[0]].indexOf(strStart) > -1) {
                                                dataB[currentdiff[0]] = dataB[currentdiff[0]] + strEnd;
                                            } else {
                                                dataB[currentdiff[0]] = strEnd + dataB[currentdiff[0]];
                                            }
                                        }
                                    }
                                    if (currentdiff[1] > dataA.length - 1 || currentdiff[0] === dataMinLength) {
                                        dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                                    } else if (currentdiff[0] - currentdiff[1] === currentdiff[1]) {
                                        dataA[b + (currentdiff[0] - currentdiff[1])] = dataA[b + (currentdiff[0] - currentdiff[1])] + strEnd;
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
                            // assign the incrementer to the end of the longer difference
                            b = currentdiff[1];
                        }
                        b = b + 1;
                    } while (b < dataMinLength);
                    // if one array is longer than the other and not identified as different then
                    // identify this difference in length
                    if (dataA
                        .length > dataB
                        .length && dataB[dataB.length - 1] !== undefined && dataB[dataB.length - 1]
                        .indexOf(strEnd) < 1) {
                        dataB.push(strStart + strEnd);
                        dataA[dataB.length - 1] = strStart + dataA[dataB.length - 1];
                        dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                        errorout = errorout + 1;
                    }
                    if (dataB
                        .length > dataA
                        .length && dataA[dataA.length - 1] !== undefined && dataA[dataA.length - 1]
                        .indexOf(strEnd) < 1) {
                        dataA.push(strStart + strEnd);
                        dataB[dataA.length - 1] = strStart + dataB[dataA.length - 1];
                        dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                        errorout = errorout + 1;
                    }
                    // options.diff_format output doesn't need XML protected characters to be escaped
                    // when its value is 'text'
                    if (options.diff_format === "text") {
                        return [
                            dataA
                                .join("")
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>")
                                .replace(/<pd>\s+<\/pd>/g, whiteout)
                                .replace(/\r<\/pd>/g, "(carriage return)</pd>"),
                            dataB
                                .join("")
                                .replace(regStart, "<pd>")
                                .replace(regEnd, "</pd>")
                                .replace(/<pd>\s+<\/pd>/g, whiteout)
                                .replace(/\r<\/pd>/g, "(carriage return)</pd>")
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
                            .replace(/<em>\s+<\/em>/g, whiteout)
                            .replace(/\r<\/em>/g, "(carriage return)</em>"),
                        dataB
                            .join("")
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(regStart, "<em>")
                            .replace(regEnd, "</em>")
                            .replace(/<em>\s+<\/em>/g, whiteout)
                            .replace(/\r<\/em>/g, "(carriage return)</em>"),
                    ];
                };
            if (options.diff_format === "html") {
                if (options.diff_view === "inline") {
                    node.push("<h3 class='texttitle'>");
                    node.push(options.source_label);
                    node.push(" vs. ");
                    node.push(options.diff_label);
                    node.push("</h3><ol class='count'>");
                } else {
                    data[0].push("<div class='diff-left'><h3 class='texttitle'>");
                    data[0].push(options.source_label);
                    data[0].push("</h3><ol class='count'>");
                    data[2].push("<div class='diff-right'><h3 class='texttitle'>");
                    data[2].push(options.diff_label);
                    data[2].push("</h3><ol class='count' style='cursor:w-resize'>");
                }
            } else {
                foldstart = 0;
            }
            do {
                code = opcodes[a];
                change = code[0];
                baseStart = code[1];
                baseEnd = code[2];
                newStart = code[3];
                newEnd = code[4];
                rowcnt = Math.max(baseEnd - baseStart, newEnd - newStart);
                ctest = true;
                if (options.diff_format === "json") {
                    i = 0;
                    do {
                        if (change === "insert" && newTextArray[newStart + i] === undefined) {
                            break;
                        }
                        if (change !== "insert" && baseTextArray[baseStart + i] === undefined) {
                            break;
                        }
                        if (change !== "equal") {
                            errorout = errorout + 1;
                        }
                        if (change === "equal") {
                            json.push([
                                "=",
                                baseTextArray[baseStart + i]
                            ]);
                        } else if (change === "replace") {
                            json.push([
                                "r",
                                baseTextArray[baseStart + i],
                                newTextArray[newStart + i]
                            ]);
                        } else if (change === "insert") {
                            json.push([
                                "+",
                                newTextArray[newStart + i]
                            ]);
                        } else {
                            json.push([
                                "-",
                                baseTextArray[baseStart + i]
                            ]);
                        }
                        i = i + 1;
                    } while (i < rowcnt);
                } else if (options.diff_format === "text") {
                    const text = {
                        angry: "\u001b[1m\u001b[4m",
                        clear: "\u001b[24m\u001b[22m",
                        cyan: "\u001b[36m",
                        green: "\u001b[32m",
                        none: "\u001b[0m",
                        red: "\u001b[31m"
                    };
                    if (foldstart > 49 && change === "equal") {
                        break;
                    }
                    // this is a check against false positives incurred by increasing or reducing of
                    // nesting.  At this time it only checks one level deep.
                    if (tab !== "") {
                        if (btest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof baseTextArray[baseStart + 1] === "string" && typeof newTextArray[newStart] === "string" && baseTab[baseStart + 1] === newTab[newStart] && baseTab[baseStart] !== newTab[newStart] && (typeof newTextArray[newStart - 1] !== "string" || baseTab[baseStart] !== newTab[newStart - 1])) {
                            btest = true;
                        } else if (ntest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof newTextArray[newStart + 1] === "string" && typeof baseTextArray[baseStart] === "string" && newTab[newStart + 1] === baseTab[baseStart] && newTab[newStart] !== baseTab[baseStart] && (typeof baseTextArray[baseStart - 1] !== "string" || newTab[newStart] !== baseTab[baseStart - 1])) {
                            ntest = true;
                        }
                    }
                    if (options
                        .diff_space_ignore === true && change === "replace" && baseTextArray[baseStart] !== undefined && newTextArray[newStart] !== undefined && baseTextArray[baseStart]
                        .replace(/\s+/g, "") === newTextArray[newStart]
                        .replace(/\s+/g, "")) {
                        change = "equal";
                    } else if (change !== "equal") {
                        diffline = diffline + 1;
                        if (a > 0 && opcodes[a - 1][0] === "equal") {
                            foldcount = options.diff_context;
                            if ((ntest === true || change === "insert") && (options.diff_space_ignore === false || (/^(\s+)$/g).test(newTextArray[newStart]) === false)) {
                                foldstart = foldstart + 1;
                                if (options.api === "dom") {
                                    clidata.push("</li><li><h3>Line: ");
                                    clidata.push(String(opcodes[a - 1][2] + 1));
                                    clidata.push("</h3>");
                                } else {
                                    clidata.push("");
                                    clidata.push(`${text.cyan}Line: ${ (opcodes[a - 1][2] + 1) + text.none}`);
                                }
                                if (foldcount > 0) {
                                    do {
                                        if (newStart - foldcount > -1) {
                                            if (options.api === "dom") {
                                                clidata.push("<p>");
                                                clidata.push(htmlfix(newTextArray[newStart - foldcount]));
                                                clidata.push("</p>");
                                            } else {
                                                clidata.push(newTextArray[newStart - foldcount]);
                                            }
                                        }
                                        foldcount = foldcount - 1;
                                    } while (foldcount > 0);
                                }
                            } else {
                                foldstart = foldstart + 1;
                                if (options.api === "dom") {
                                    clidata.push("</li><li><h3>Line: ");
                                    clidata.push(String(baseStart + 1));
                                    clidata.push("</h3>");
                                } else {
                                    clidata.push("");
                                    clidata.push(`${text.cyan}Line: ${ (baseStart + 1) + text.none}`);
                                }
                                if (foldcount > 0) {
                                    do {
                                        if (baseStart - foldcount > -1) {
                                            if (options.api === "dom") {
                                                clidata.push("<p>");
                                                clidata.push(htmlfix(baseTextArray[baseStart - foldcount]));
                                                clidata.push("</p>");
                                            } else {
                                                clidata.push(baseTextArray[baseStart - foldcount]);
                                            }
                                        }
                                        foldcount = foldcount - 1;
                                    } while (foldcount > 0);
                                }
                            }
                        } else if (a < 1) {
                            if (options.api === "dom") {
                                clidata.push("</li><li><h3>Line: 1</h3>");
                            } else {
                                clidata.push("");
                                clidata.push(`${text.cyan}Line: 1${text.none}`);
                            }
                            foldstart = foldstart + 1;
                        }
                        foldcount = 0;
                        if ((ntest === true || change === "insert") && (options.diff_space_ignore === false || (/^(\s+)$/g).test(newTextArray[newStart]) === false)) {
                            do {
                                if (options.api === "dom") {
                                    clidata.push("<ins>");
                                    clidata.push(htmlfix(newTextArray[newStart + foldcount]));
                                    clidata.push("</ins>");
                                } else {
                                    if (newTextArray[newStart + foldcount] === "") {
                                        clidata.push(`${text.green}(empty line)${text.none}`);
                                    } else {
                                        clidata.push(text.green + newTextArray[newStart + foldcount] + text.none);
                                    }
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < 7 && foldcount + newStart < newEnd);
                        } else if (change === "delete" && (options.diff_space_ignore === false || (/^(\s+)$/g).test(baseTextArray[baseStart]) === false)) {
                            do {
                                if (options.api === "dom") {
                                    clidata.push("<del>");
                                    clidata.push(htmlfix(baseTextArray[baseStart + foldcount]))
                                    clidata.push("</del>");
                                } else {
                                    if (baseTextArray[baseStart + foldcount] === "") {
                                        clidata.push(`${text.red}(empty line)${text.none}`);
                                    } else {
                                        clidata.push(text.red + baseTextArray[baseStart + foldcount] + text.none);
                                    }
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < 7 && foldcount + baseStart < baseEnd);
                        } else if (change === "replace" && (options
                            .diff_space_ignore === false || baseTextArray[baseStart]
                            .replace(/\s+/g, "") !== newTextArray[newStart]
                            .replace(/\s+/g, ""))) {
                            do {
                                charcompOutput = charcomp(baseTextArray[baseStart + foldcount], newTextArray[newStart + foldcount]);
                                if (options.api === "dom") {
                                    clidata.push("<del>");
                                    clidata.push(htmlfix(charcompOutput[0]).replace(/&lt;pd&gt;/g, "<em>").replace(/&lt;\/pd&gt;/g, "</em>"));
                                    clidata.push("</del><ins>");
                                    clidata.push(htmlfix(charcompOutput[1]).replace(/&lt;pd&gt;/g, "<em>").replace(/&lt;\/pd&gt;/g, "</em>"));
                                    clidata.push("</ins>");
                                } else {
                                    if (charcompOutput[0] === "") {
                                        clidata.push(`${text.red}(empty line)${text.none}`);
                                    } else if ((/^\s+$/).test(charcompOutput[0]) === true) {
                                        clidata.push(`${text.red}(white space)${text.none}`);
                                    } else {
                                        clidata.push(text
                                            .red + charcompOutput[0]
                                            .replace(/<pd><\/pd>/g, "")
                                            .replace(/<pd>/g, text.angry)
                                            .replace(/<\/pd>/g, text.clear)
                                            .replace(/\s+$/, "") + text
                                            .none);
                                    }
                                    if (charcompOutput[1] === "") {
                                        clidata.push(`${text.green}(empty line)${text.none}`);
                                    } else if ((/^\s+$/).test(charcompOutput[1]) === true) {
                                        clidata.push(`${text.green}(white space)${text.none}`);
                                    } else {
                                        clidata.push(text
                                            .green + charcompOutput[1]
                                            .replace(/<pd><\/pd>/g, "")
                                            .replace(/<pd>/g, text.angry)
                                            .replace(/<\/pd>/g, text.clear)
                                            .replace(/\s+$/, "") + text
                                            .none);
                                    }
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < 7 && foldcount + baseStart < baseEnd);
                        }
                        if (((change === "insert" && foldcount + newStart === newEnd) || (change !== "insert" && foldcount + baseStart === baseEnd)) && baseTextArray[baseStart + foldcount] !== undefined && options.diff_context > 0 && a < opcodesLength - 1 && opcodes[a + 1][0] === "equal") {
                            foldcount = 0;
                            baseStart = opcodes[a + 1][1];
                            baseEnd = opcodes[a + 1][2] - baseStart;
                            do {
                                if (options.api === "dom") {
                                    clidata.push("<p>");
                                    clidata.push(htmlfix(baseTextArray[baseStart + foldcount]));
                                    clidata.push("</p>");
                                } else {
                                    clidata.push(baseTextArray[baseStart + foldcount]);
                                }
                                foldcount = foldcount + 1;
                            } while (foldcount < options.diff_context && foldcount < baseEnd);
                        }
                        if (btest === true) {
                            baseStart = baseStart + 1;
                            btest = false;
                        } else if (ntest === true) {
                            newStart = newStart + 1;
                            ntest = false;
                        } else {
                            baseStart = baseStart + 1;
                            newStart = newStart + 1;
                        }
                    }
                } else {
                    if (foldstart > -1) {
                        data[0][foldstart] = data[0][foldstart].replace("xxx", String(foldcount));
                    }
                    i = 0;
                    do { // apply options.diff_context collapsing for the output, if needed
                        if (options.diff_context > -1 && opcodes.length > 1 && ((a > 0 && i === options.diff_context) || (a === 0 && i === 0)) && change === "equal") {
                            ctest = false;
                            jump = rowcnt - ((
                                a === 0
                                ? 1
                                : 2) * options.diff_context);
                            if (jump > 1) {
                                baseStart = baseStart + jump;
                                newStart = newStart + jump;
                                i = i + (jump - 1);
                                data[0].push("<li>...</li>");
                                if (options.diff_view !== "inline") {
                                    data[1].push("<li class=\"skip\">&#10;</li>");
                                }
                                data[2].push("<li>...</li>");
                                data[3].push("<li class=\"skip\">&#10;</li>");
                                if (a + 1 === opcodes.length) {
                                    break;
                                }
                            }
                        } else if (change !== "equal") {
                            diffline = diffline + 1;
                        }
                        if (options.api === "dom" && baseTextArray[baseStart] !==  undefined) {
                            baseItem = baseTextArray[baseStart].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            baseItem  = baseTextArray[baseStart];
                        }
                        if (options.api === "dom" && newTextArray[newStart] !== undefined) {
                            newItem = newTextArray[newStart].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            newItem = newTextArray[newStart];
                        }
                        // this is a check against false positives incurred by increasing or reducing of
                        // nesting.  At this time it only checks one level deep.
                        if (tab !== "") {
                            if (btest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof baseTextArray[baseStart + 1] === "string" && typeof newItem === "string" && baseTab[baseStart + 1] === newTab[newStart] && baseTab[baseStart] !== newTab[newStart] && (typeof newTextArray[newStart - 1] !== "string" || baseTab[baseStart] !== newTab[newStart - 1])) {
                                btest = true;
                            } else if (ntest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof newTextArray[newStart + 1] === "string" && typeof baseItem === "string" && newTab[newStart + 1] === baseTab[baseStart] && newTab[newStart] !== baseTab[baseStart] && (typeof baseTextArray[baseStart - 1] !== "string" || newTab[newStart] !== baseTab[baseStart - 1])) {
                                ntest = true;
                            }
                        }
                        foldcount = foldcount + 1;
                        if (options.diff_view === "inline") {
                            if (options
                                .diff_space_ignore === true && change === "replace" && baseItem
                                .replace(/\s+/g, "") === newItem
                                .replace(/\s+/g, "")) {
                                change = "equal";
                                errorout = errorout - 1;
                            }
                            if (options.diff_context < 0 && rowItem < a) {
                                rowItem = a;
                                if (foldstart > -1) {
                                    if (data[0][foldstart + 1] === String(foldcount - 1)) {
                                        data[0][foldstart] = `<li class="${data[0][foldstart].slice(data[0][foldstart].indexOf("line xxx\">- ") + 12)}`;
                                    } else {
                                        data[0][foldstart] = data[0][foldstart].replace("xxx", String(foldcount - 1 + rcount));
                                    }
                                }
                                if (change !== "replace") {
                                    if (baseEnd - baseStart > 1 || newEnd - newStart > 1) {
                                        data[0].push(`<li class="fold" title="folds from line ${foldcount + rcount } to line xxx">- `);
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li>");
                                    }
                                    if (ntest === true || change === "insert") {
                                        data[0].push("&#10;");
                                    } else {
                                        data[0].push(String(baseStart + 1));
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
                                    data[0].push(String(baseStart + 1));
                                }
                                data[0].push("</li>");
                            } else if (change === "replace") {
                                rcount = rcount + 1;
                            }
                            if (ntest === true || change === "insert") {
                                data[2].push("<li>");
                                data[2].push(String(newStart + 1));
                                data[2].push("&#10;</li>");
                                if (options.diff_space_ignore === true && newItem.replace(/\s+/g, "") === "") {
                                    data[3].push("<li class=\"equal\">");
                                    diffline = diffline - 1;
                                } else {
                                    data[3].push("<li class=\"insert\">");
                                }
                                data[3].push(newItem);
                                data[3].push("&#10;</li>");
                            } else if (btest === true || change === "delete") {
                                data[2].push("<li class=\"empty\">&#10;</li>");
                                if (options.diff_space_ignore === true && baseItem.replace(/\s+/g, "") === "") {
                                    data[3].push("<li class=\"equal\">");
                                    diffline = diffline - 1;
                                } else {
                                    data[3].push("<li class=\"delete\">");
                                }
                                data[3].push(baseItem);
                                data[3].push("&#10;</li>");
                            } else if (change === "replace") {
                                if (baseItem !== newItem) {
                                    if (baseItem === "") {
                                        charcompOutput = [
                                            "", newItem
                                        ];
                                    } else if (newItem === "") {
                                        charcompOutput = [baseItem, ""];
                                    } else if (baseStart < baseEnd && newStart < newEnd) {
                                        charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                    }
                                }
                                if (baseStart < baseEnd) {
                                    data[0].push(`<li>${baseStart + 1 }</li>`);
                                    data[2].push("<li class=\"empty\">&#10;</li>");
                                    if (options.diff_space_ignore === true && baseItem.replace(/\s+/g, "") === "") {
                                        data[3].push("<li class=\"equal\">");
                                        diffline = diffline - 1;
                                    } else {
                                        data[3].push("<li class=\"delete\">");
                                    }
                                    if (newStart < newEnd) {
                                        data[3].push(charcompOutput[0]);
                                    } else {
                                        data[3].push(baseItem);
                                    }
                                    data[3].push("&#10;</li>");
                                }
                                if (newStart < newEnd) {
                                    data[0].push("<li class=\"empty\">&#10;</li>");
                                    data[2].push("<li>");
                                    data[2].push(String(newStart + 1));
                                    data[2].push("</li>");
                                    if (options.diff_space_ignore === true && newItem.replace(/\s+/g, "") === "") {
                                        data[3].push("<li class=\"equal\">");
                                        diffline = diffline - 1;
                                    } else {
                                        data[3].push("<li class=\"insert\">");
                                    }
                                    if (baseStart < baseEnd) {
                                        data[3].push(charcompOutput[1]);
                                    } else {
                                        data[3].push(newItem);
                                    }
                                    data[3].push("&#10;</li>");
                                }
                            } else if (baseStart < baseEnd || newStart < newEnd) {
                                data[2].push("<li>");
                                data[2].push(String(newStart + 1));
                                data[2].push("</li>");
                                data[3].push("<li class=\"");
                                data[3].push(change);
                                data[3].push("\">");
                                data[3].push(baseItem);
                                data[3].push("&#10;</li>");
                            }
                            if (btest === true) {
                                baseStart = baseStart + 1;
                                btest = false;
                            } else if (ntest === true) {
                                newStart = newStart + 1;
                                ntest = false;
                            } else {
                                baseStart = baseStart + 1;
                                newStart = newStart + 1;
                            }
                        } else {
                            if (btest === false && ntest === false && typeof baseItem === "string" && typeof newItem === "string") {
                                if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseItem !== newItem) {
                                    charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                } else if (options.api === "dom") {
                                    charcompOutput = [
                                        baseTextArray[baseStart].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                                        newTextArray[newStart].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                    ];
                                } else {
                                    charcompOutput = [
                                        baseTextArray[baseStart], newTextArray[newStart]
                                    ];
                                }
                                if ((data[0].length > 0 && baseStart === Number(data[0][data[0].length - 1].slice(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1) || (data[2].length > 0 && newStart === Number(data[2][data[2].length - 1].slice(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1)) {
                                    repeat = true;
                                }
                                if (repeat === false) {
                                    if (baseStart < baseEnd) {
                                        if (options.diff_context < 0 && rowItem < a && (opcodes[a][2] - opcodes[a][1] > 1 || opcodes[a][4] - opcodes[a][3] > 1)) {
                                            rowItem = a;
                                            data[0].push(`<li class="fold" title="folds from line ${foldcount } to line xxx">- ${baseStart + 1 }</li>`);
                                            foldstart = data[0].length - 1;
                                        } else {
                                            data[0].push(`<li>${baseStart + 1 }</li>`);
                                        }
                                        data[1].push("<li class=\"");
                                        if (newStart >= newEnd) {
                                            if (options.diff_space_ignore === true && baseItem.replace(/\s+/g, "") === "") {
                                                data[1].push("equal");
                                                diffline = diffline - 1;
                                            } else {
                                                data[1].push("delete");
                                            }
                                        } else if (baseItem === "" && newItem !== "" && (options.diff_space_ignore === false || (baseItem.replace(/\s+/g, "") !== "" && newItem.replace(/\s+/g, "") !== ""))) {
                                            data[1].push("empty");
                                        } else {
                                            data[1].push(change);
                                        }
                                        data[1].push("\">");
                                        data[1].push(charcompOutput[0]);
                                        data[1].push("&#10;</li>");
                                    } else if (ctest === true) {
                                        if (options.diff_context < 0 && rowItem < a && (opcodes[a][2] - opcodes[a][1] > 1 || opcodes[a][4] - opcodes[a][3])) {
                                            rowItem = a;
                                            if (foldstart > -1) {
                                                data[0][foldstart] = data[0][foldstart].replace("xxx", String(foldcount - 1));
                                            }
                                            data[0].push(`<li class="fold" title="folds from line ${foldcount } to line xxx">- &#10;</li>`);
                                            foldstart = data[0].length - 1;
                                        } else {
                                            data[0].push("<li class=\"empty\">&#10;</li>");
                                        }
                                        data[1].push("<li class=\"empty\"></li>");
                                    }
                                    if (newStart < newEnd) {
                                        data[2].push(`<li>${newStart + 1 }</li>`);
                                        data[3].push("<li class=\"");
                                        if (baseStart >= baseEnd) {
                                            if (options.diff_space_ignore === true && newItem.replace(/\s+/g, "") === "") {
                                                data[3].push("equal");
                                                diffline = diffline - 1;
                                            } else {
                                                data[3].push("insert");
                                            }
                                        } else if (newItem === "" && baseItem !== "" && (options.diff_space_ignore === false || (baseItem.replace(/\s+/g, "") !== "" && newItem.replace(/\s+/g, "") !== ""))) {
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
                            } else if (btest === true || (typeof baseItem === "string" && typeof newItem !== "string")) {
                                if (baseStart !== -1 && data[0].length > 0 && baseStart !== Number(data[0][data[0].length - 1].slice(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1) {
                                    if (options.diff_context < 0 && rowItem < a && opcodes[a][2] - opcodes[a][1] > 1) {
                                        rowItem = a;
                                        data[0].push(`<li class="fold" title="folds from line ${foldcount } to line xxx">- ${baseStart + 1 }</li>`);
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push(`<li>${baseStart + 1 }</li>`);
                                    }
                                    data[1].push("<li class=\"delete\">");
                                    data[1].push(baseItem);
                                    data[1].push("&#10;</li>");
                                    data[2].push("<li class=\"empty\">&#10;</li>");
                                    data[3].push("<li class=\"empty\"></li>");
                                }
                                btest = false;
                                baseStart = baseStart + 1;
                            } else if (ntest === true || (typeof baseItem !== "string" && typeof newItem === "string")) {
                                if (newStart !== -1 && data[2].length > 0 && newStart !== Number(data[2][data[2].length - 1].slice(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                    if (options.diff_context < 0 && rowItem < a && opcodes[a][4] - opcodes[a][3] > 1) {
                                        rowItem = a;
                                        data[0].push(`<li class="fold" title="folds from line ${foldcount } to line xxx">-</li>`);
                                        foldstart = data[0].length - 1;
                                    } else {
                                        data[0].push("<li class=\"empty\">&#10;</li>");
                                    }
                                    data[1].push("<li class=\"empty\"></li>");
                                    data[2].push(`<li>${newStart + 1 }</li>`);
                                    data[3].push("<li class=\"insert\">");
                                    data[3].push(newItem);
                                    data[3].push("&#10;</li>");
                                }
                                ntest = false;
                                newStart = newStart + 1;
                            }
                        }
                        i = i + 1;
                    } while (i < rowcnt);
                }
                a = a + 1;
            } while (a < opcodesLength);
            if (options.diff_format === "json") {
                return [
                    JSON.stringify({diff: json})
                        .replace(/\$#gt;/g, "&gt;")
                        .replace(/\$#lt;/g, "&lt;")
                        .replace(/%#lt;/g, "$#lt;")
                        .replace(/%#gt;/g, "$#gt;"),
                    errorout,
                    0
                ];
            }
            if (options.diff_format === "text") {
                if (options.api === "dom") {
                    clidata.push("</li></ol>");
                    return [
                        clidata.join("").replace("</li>", "<ol class=\"diffcli\">"),
                        foldstart,
                        diffline
                    ];
                }
                if (options.crlf === true) {
                    return [clidata.join("\r\n"), foldstart, diffline];
                }
                return [clidata.join("\n"), foldstart, diffline];
            }
            if (foldstart > -1) {
                data[0][foldstart] = data[0][foldstart].replace("xxx", String(foldcount + rcount));
            }
            node.push(data[0].join(""));
            node.push("</ol><ol class=");
            if (options.diff_view === "inline") {
                node.push("\"count\">");
            } else {
                node.push("\"data\" data-prettydiff-ignore=\"true\">");
                node.push(data[1].join(""));
                node.push("</ol></div>");
            }
            node.push(data[2].join(""));
            node.push("</ol><ol class=\"data\" data-prettydiff-ignore=\"true\">");
            node.push(data[3].join(""));
            if (options.diff_view === "inline") {
                node.push("</ol>");
            } else {
                node.push("</ol></div>");
            }
            node.push("<p class=\"author\">Diff view written by <a href=\"https://prettydiff.com/\">Pr" + "etty Diff</a>.</p></div>");
            if (errorout === 1) {
                diffplural = "";
            }
            if (diffline === 1) {
                linesplural = "";
            }
            finaldoc = `<p><strong>Number of differences:</strong> <em>${errorout + diffline }</em> difference${diffplural } from <em>${diffline }</em> line${linesplural } of code.</p>${node.join("")}`;
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
    global
        .prettydiff
        .api
        .diffview = diffview;
}());