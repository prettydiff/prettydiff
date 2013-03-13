/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " " */
/*global pd, exports */
/*
 @source: http://prettydiff.com/documentation.php

 @licstart  The following is the entire license notice for the
 JavaScript code in this page.

 Special thanks to Harry Whitfield for the numerous test cases provided
 against JSPretty.
 
 Created by Austin Cheney originally on 3 Mar 2009.
 This code may not be used or redistributed unless the following
 conditions are met:

 There is no licensing associated with diffview.css.  Please use,
 redistribute, and alter to your content.  However, diffview.css
 provided from Pretty Diff is different from and not aligned with
 diffview.css originally from Snowtide Informatics.

 * The use of diffview.js and prettydiff.js must contain the following
 copyright:
 Copyright (c) 2007, Snowtide Informatics Systems, Inc.
 All rights reserved.

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

 - used as diffview function
 <http://prettydiff.com/lib/diffview.js>

 * The author of fulljsmin.js and date of creation must be stated as:
 Franck Marcia - 31 Aug 2006

 - used as jsmin function:
 <http://prettydiff.com/lib/fulljsmin.js>

 * The fulljsmin.js is used with permission from the author of jsminc.c
 and such must be stated as:
 Copyright (c) 2002 Douglas Crockford  (www.crockford.com)

 * JSPretty is written by Austin Cheney.  Use of this function requires
 that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as jspretty function
 <http://prettydiff.com/lib/jspretty.js>

 * cleanCSS.js is originally written by Anthony Lieuallen
 http://tools.arantius.com/tabifier

 - used as cleanCSS function
 <http://prettydiff.com/lib/cleanCSS.js>

 * charDecoder.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as charDecoder function
 <http://prettydiff.com/lib/charDecoder.js>

 * csvbeauty.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as csvbeauty function
 <http://prettydiff.com/lib/csvbeauty.js>

 * csvmin.js is written by Austin Cheney.  Use of this function requires
 that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as csvmin function
 <http://prettydiff.com/lib/csvmin.js>

 * markupmin.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as markupmin function
 <http://prettydiff.com/lib/markupmin.js>

 * markup_beauty.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as markup-beauty function
 <http://prettydiff.com/lib/markup_beauty.js>

 * pd.o object literal is in the api/dom.js file and exists to provide a
 one time and external means of access to the DOM for character entity
 translation.

 -----------------------------------------------------------------------
 * The code mentioned above has significantly expanded documentation in
 each of the respective function's external JS file as linked from the
 documentation page:
 <http://prettydiff.com/documentation.php>

 * The compilation of cssClean, csvbeauty, csvmin, jsmin, jsdifflib,
 markup_beauty, markupmin, and js-beautify in this manner is a result of
 the prettydiff() function contained in prettydiff.js.  The per
 character highlighting is the result of the charcomp() function also
 contained in prettydiff.js. Any use or redistribution of these
 functions must mention the following:
 Prettydiff created by Austin Cheney originally on 3 Mar 2009.
 <http://prettydiff.com/>

 Join the Pretty Diff mailing list at:
 https://groups.google.com/d/forum/pretty-diff

 * In addition to the previously stated requirements any use of any
 component, aside from directly using the full files in their entirety,
 must restate the license mentioned at the top of each concerned file.


 If each and all these conditions are met use and redistribution of
 prettydiff and its required assets is unlimited without author
 permission.

 @licend  The above is the entire license notice for the JavaScript code
 in this page.

 */
var prettydiff = function prettydiff(api) {
        "use strict";
        var startTime = (function startTime() {
                var d = new Date(),
                    t = d.getTime();
                return t;
            }()),
            summary = "",
            charDecoder = function charDecoder(input) {
                var b = 0,
                    d = 0,
                    a = 0,
                    f = 0,
                    g = 0,
                    c = input,
                    e = [],
                    x = [],
                    y = [],
                    uni = (/u\+[0-9a-f]{4,5}\+/),
                    unit = (/u\![0-9a-f]{4,5}\+/),
                    htmln = (/\&\#[0-9]{1,6}\;/),
                    htmlt = (/\&\![0-9]{1,6}\;/);
                if ((pd === undefined || pd.o.rh === null || pd.o.rh === undefined || typeof pd.o.rh.innerHTML !== "string") || (c.search(unit) === -1 && c.search(uni) === -1 && c.search(htmlt) === -1 && c.search(htmln) === -1)) {
                    return input;
                }
                f = input.length;
                for (b = 0; b < f; b += 1) {
                    if (c.search(htmln) === -1 || (c.search(uni) < c.search(htmln) && c.search(uni) !== -1)) {
                        d = c.search(uni);
                        y.push(d + "|h");
                        g = c.length;
                        for (a = d; a < g; a += 1) {
                            if (c.charAt(a) === "+" && c.charAt(a - 1) === "u") {
                                e = c.split("");
                                e.splice(a, 1, "!");
                                c = e.join("");
                            }
                            if (c.charAt(a) === "+" && c.charAt(a - 1) !== "u") {
                                a += 1;
                                break;
                            }
                        }
                        x.push(c.slice(d + 2, a - 1));
                        c = c.replace(unit, "");
                    } else if (c.search(uni) === -1 || (c.search(htmln) < c.search(uni) && c.search(htmln) !== -1)) {
                        d = c.search(htmln);
                        y.push(d + "|d");
                        g = c.length;
                        for (a = d; a < g; a += 1) {
                            if (c.charAt(a) === "#") {
                                e = c.split("");
                                e.splice(a, 1, "!");
                                c = e.join("");
                            }
                            if (c.charAt(a) === ";") {
                                a += 1;
                                break;
                            }
                        }
                        x.push(c.slice(d + 2, a - 1));
                        c = c.replace(htmlt, "");
                    }
                    if (c.search(uni) === -1 && c.search(htmln) === -1) {
                        break;
                    }
                }
                c = c.replace(/u\![0-9a-f]{4,5}\+/g, "").replace(/\&\![0-9]{1,6}\;/g, "").split("");
                d = x.length;
                e = [];
                for (b = 0; b < d; b += 1) {
                    y[b] = y[b].split("|");
                    if (y[b][1] === "h") {
                        x[b] = parseInt(x[b], 16);
                    }
                    pd.o.rh.innerHTML = "&#" + parseInt(x[b], 10) + ";";
                    x[b] = pd.o.rh.innerHTML;
                    e.push(x[b]);
                }
                return e.join("");
            },
            csvbeauty = function csvbeauty(source, ch) {
                var err = "",
                    a = 0,
                    b = 0,
                    c = [],
                    error = "Error: Unterminated string begging at character number ";
                (function csvbeauty_logic() {
                    var b = 0,
                        d = 0,
                        e = 0,
                        src = "";
                    source = source.replace(/"{2}/g, "{csvquote}");
                    src = source;
                    source = source.split("");
                    e = source.length;
                    for (a = 0; a < e; a += 1) {
                        if (source[a] === "\"") {
                            d = source.length;
                            for (b = a + 1; b < d; b += 1) {
                                if (source[b] === "\"") {
                                    c.push(src.slice(a, b + 1));
                                    source[a] = "{csvstring}";
                                    source[b] = "";
                                    a = b + 1;
                                    break;
                                }
                                source[b] = "";
                            }
                            if (b === source.length) {
                                err = source.join("").slice(a, a + 9);
                                source = error;
                                return;
                            }
                        }
                    }
                    source = source.join("").replace(/\{csvquote\}/g, "\"\"");
                }());
                if (ch === "") {
                    ch = ",";
                } else {
                    ch = charDecoder(ch);
                }
                if (ch.length > source.length) {
                    return source;
                }
                if (source === error) {
                    if (a !== source.length - 1) {
                        return source + a + ", '" + err + "'.";
                    }
                    return source + a + ".";
                }
                source = source.replace(/\n/g, "\n\n{-}\n\n");
                if (source.charAt(source.length - ch.length) === ch) {
                    source = source.slice(0, source.length + 1 - ch.length) + "{|}";
                }
                do {
                    source = source.replace(ch, "\n");
                } while (source.indexOf(ch) !== -1);
                b = c.length;
                for (a = 0; a < b; a += 1) {
                    c[a] = c[a].replace(/\n/g, "{ }");
                    source = source.replace("{csvstring}", c[a]);
                }
                return source.replace(/\{csvquote\}/g, "\"");
            },
            csvmin = function csvmin(source, ch) {
                if (ch === "") {
                    ch = ",";
                } else {
                    ch = charDecoder(ch);
                }
                (function csvmin__logic() {
                    var multiline = function csvmin__logic_multiline(x) {
                            var w = [],
                                y = 0,
                                z = x.length - 2;
                            if (x.length === 2) {
                                return "{ }";
                            }
                            for (y = 0; y < z; y += 1) {
                                w.push(ch);
                            }
                            return w.join("") + "{ }";
                        },
                        a = 0,
                        c = [],
                        d = "",
                        e = 0,
                        f = [],
                        g = source.replace(/\n\n\{\-\}\n\n/g, "{-}").replace(/\n{2,}/g, multiline).split("\n"),
                        b = g.length,
                        err = "",
                        error = "Error: Unterminated String begging at character number ";
                    for (a = 0; a < b; a += 1) {
                        c = [];
                        if (typeof g[a] === "string" && g[a].indexOf("\"") !== -1) {
                            f = g[a].split("");
                            e = f.length;
                            for (b = 0; b < e; b += 1) {
                                if (f[b] === "\"") {
                                    c.push(b);
                                }
                            }
                            if (c.length === 1) {
                                d = error;
                                g[a] = f.join("");
                                err = g[a].slice(c[0], c[0] + 9);
                                return;
                            }
                            if (c.length > 2) {
                                e = c.length - 1;
                                for (d = 1; d < e; d += 1) {
                                    f[c[d]] = "\"\"";
                                }
                            }
                            g[a] = f.join("");
                        }
                    }
                    if (d === error) {
                        return error + (g.join(ch).indexOf(g[a]) + c[0]) + " or value number " + (a + 1) + ", '" + err + "'.";
                    }
                    if (g[g.length - 1] === "{|}") {
                        g[g.length - 1] = "";
                    }
                    source = g.join(ch).replace(/\n/g, ch);
                }());
                do {
                    source = source.replace("{ }", "\n");
                } while (source.indexOf("{ }") !== -1);
                source = source.replace(/\n{2}/g, "\n");
                if (source.indexOf("{|}") === source.length - 3) {
                    source = source.slice(0, source.length - 3) + ch;
                }
                return source.replace(/\{\-\}/g, "\n");
            },
            jsmin = function jsmin(args) {
                (function jsmin__replaceHTMLComment() {
                    if (args.type === "javascript") {
                        args.source = args.source.replace(/\/\/(\s)*-->/g, "//-->");
                    }
                }());
                var input = (typeof args.source !== "string" || args.source === "") ? "Error: no source supplied to jsmin." : args.source,
                    level = (args.level === 1 || args.level === 2 || args.level === 3) ? args.level : 2,
                    type = (args.type === "javascript" || args.type === "css") ? args.type : "javascript",
                    alter = (args.alter === true) ? true : false,
                    fcomment = (args.fcomment === true) ? true : false,
                    ret = "",
                    atchar = input.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
                    error = "",
                    a = "",
                    b = "",
                    geti = 0,
                    getl = 0,
                    EOF = -1,
                    LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
                    DIGITS = "0123456789",
                    OTHERS = "",
                    ALNUM = "",
                    fcom = [],
                    alterj = false,
                    theLookahead = EOF,
                    isAlphanum = function jsmin__isAlphanum(c) {
                        if (typeof c === "string") {
                            return c !== EOF && (ALNUM.indexOf(c) > -1 || c.charCodeAt(0) > 126);
                        }
                    },
                    jsasiq = function jsmin__jsasiq(x) {
                        if (x.indexOf("\n") === -1) {
                            return x;
                        }
                        x = x.split("");
                        x[0] = x[0] + ";";
                        return x.join("");
                    },
                    semiword = function jsmin__semiword(x) {
                        var a = x.replace(/\s+/, "");
                        if (x.indexOf("\n") > -1) {
                            return a + ";";
                        }
                        return a + " ";
                    },
                    asiFix = function jsmin__asiFix(y) {
                        var a = 0,
                            x = y.split(""),
                            b = x.length,
                            c = 0,
                            d = 0,
                            e = "",
                            f = "",
                            g = "",
                            h = "";
                        for (a = 0; a < b; a += 1) {
                            if (x[a] === "\\") {
                                a += 1;
                            } else if (x[a] === "\"" && f === "") {
                                f = "\"";
                            } else if (x[a] === "'" && f === "") {
                                f = "'";
                            } else if (x[a] === "/" && f === "" && !isAlphanum(x[a - 1]) && x[a - 1] !== ")" && x[a - 1] !== "]") {
                                if (x[a - 1] === " ") {
                                    x[a - 1] = "";
                                    if (!isAlphanum(x[a - 2])) {
                                        f = "/";
                                        x[a] = "pd";
                                    } else if (x[a + 1] === " ") {
                                        x[a + 1] = "";
                                    }
                                } else {
                                    f = "/";
                                    x[a] = "pd";
                                }
                            } else if (x[a] === "/" && f === "" && x[a + 1] === " " && isAlphanum(x[a - 1])) {
                                x[a + 1] = "";
                            } else if (x[a] === "\"" && f === "\"") {
                                f = "";
                            } else if (x[a] === "'" && f === "'") {
                                f = "";
                            } else if (x[a] === "/" && f === "/") {
                                f = "";
                                x[a] = "pd";
                            } else if ((f === "'" || f === "\"") && x[a - 2] === "\\" && x[a - 1] === ";") {
                                x[a - 1] = "";
                                x[a - 2] = " ";
                            } else if (f === "" && (x[a] === "}" || x[a] === ")")) {
                                if ((x[a + 1] !== "(" && x[a + 1] !== "[" && x[a + 1] !== "," && x[a + 1] !== ";" && x[a + 1] !== "." && x[a + 1] !== "?" && x[a + 1] !== "*" && x[a + 1] !== "+" && x[a + 1] !== "-" && (x[a + 1] !== "\n" || (x[a + 1] === "\n" && x[a + 2] !== "(" && x[a + 2] !== "[" && x[a + 2] !== "+" && x[a + 2] !== "-" && x[a + 2] !== "/")) && typeof x[a - 3] === "string" && x[a - 2] === "=" && x[a - 1] === "{" && x[a] === "}" && (x[a + 1] !== "\n" || (x[a + 1] === "\n" && x[a + 2] !== "+" && x[a + 2] !== "-")) && (isAlphanum(x[a - 3]) || x[a - 3] === "]" || x[a - 3] === ")"))) {
                                    x[a] += ";";
                                } else {
                                    d = -1;
                                    e = "";
                                    g = "";
                                    if (x[a] === "}") {
                                        g = "}";
                                        h = "{";
                                    } else {
                                        g = ")";
                                        h = "(";
                                    }
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if ((c > 1 && x[c - 1] === "\\" && x[c - 2] !== "\\") || (c === 1 && x[c - 1] === "\\")) {
                                            c -= 1;
                                        } else {
                                            if (x[c].charAt(0) === g && e === "") {
                                                d -= 1;
                                            } else if (x[c] === h && e === "") {
                                                d += 1;
                                            } else if (x[c] === "\"" && e === "") {
                                                e = "\"";
                                            } else if (x[c] === "'" && e === "") {
                                                e = "'";
                                            } else if (x[c] === "pd" && e === "") {
                                                e = "/";
                                            } else if (x[c] === "\"" && e === "\"") {
                                                e = "";
                                            } else if (x[c] === "'" && e === "'") {
                                                e = "";
                                            } else if (x[c] === "pd" && e === "/") {
                                                e = "";
                                            }
                                        }
                                        if (d === 0 && (c !== a - 1 || (c === a - 1 && typeof x[c - 1] === "string" && x[c - 1] !== x[a]))) {
                                            if (x[c - 1] === ")" && g === "}") {
                                                c -= 2;
                                                d = -1;
                                                e = "";
                                                for (c; c > -1; c -= 1) {
                                                    if ((c > 1 && x[c - 1] === "\\" && x[c - 2] !== "\\") || (c === 1 && x[c - 1] === "\\")) {
                                                        c -= 1;
                                                    } else {
                                                        if (x[c] === ")" && e === "") {
                                                            d -= 1;
                                                        } else if (x[c] === "(" && e === "") {
                                                            d += 1;
                                                        } else if (x[c] === "\"" && e === "") {
                                                            e = "\"";
                                                        } else if (x[c] === "'" && e === "") {
                                                            e = "'";
                                                        } else if (x[c] === "pd" && e === "") {
                                                            e = "/";
                                                        } else if (x[c] === "\"" && e === "\"") {
                                                            e = "";
                                                        } else if (x[c] === "'" && e === "'") {
                                                            e = "";
                                                        } else if (x[c] === "pd" && e === "/") {
                                                            e = "";
                                                        }
                                                    }
                                                    if (d === 0) {
                                                        c -= 1;
                                                        if (x[a + 1] !== "(" && x[a + 1] !== "[" && x[a + 1] !== "," && x[a + 1] !== ";" && x[a + 1] !== "." && x[a + 1] !== "?" && x[a + 1] !== "*" && x[a + 1] !== "+" && x[a + 1] !== "-" && typeof x[c - 9] === "string" && x[c - 8] === "=" && x[c - 7] === "f" && x[c - 6] === "u" && x[c - 5] === "n" && x[c - 4] === "c" && x[c - 3] === "t" && x[c - 2] === "i" && x[c - 1] === "o" && x[c] === "n" && (isAlphanum(x[c - 9]) || x[c - 9] === "]" || x[c - 9] === ")")) {
                                                            x[a] += ";";
                                                        }
                                                        break;
                                                    }
                                                }
                                                break;
                                            } else if (typeof x[c - 2] === "string" && x[c - 1] === "=" && (x[a - 1].length === 1 || x[a - 1] === "pd") && (isAlphanum(x[c - 2] || x[c - 2] === "]" || x[c - 2] === ")"))) {
                                                if (x[a + 1] !== "(" && x[a + 1] !== "[" && x[a + 1] !== "," && x[a + 1] !== ";" && x[a + 1] !== "." && x[a + 1] !== "?" && x[a + 1] !== "*" && x[a + 1] !== "+" && x[a + 1] !== "-" && (x[a + 1] !== "\n" || (x[a + 1] === "\n" && x[a + 2] !== "(" && x[a + 2] !== "[" && x[a + 2] !== "+" && x[a + 2] !== "-" && x[a + 2] !== "/")) && (typeof x[a + 1] !== "string" || x[a + 1] !== "/")) {
                                                    x[a] += ";";
                                                }
                                                break;
                                            } else {
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else if (f === "" && x[a] === "\n") {
                                if ((/\w/).test(x[a + 1]) && x[a - 1] !== "}" && x[a - 1] !== ")" && x[a - 1].indexOf(";") === -1) {
                                    x[a] = ";";
                                } else {
                                    x[a] = "";
                                }
                            }
                        }
                        for (a = 0; a < b; a += 1) {
                            if (x[a] === "pd") {
                                x[a] = "/";
                            }
                        }
                        return x.join("").replace(/\"/g, "\"").replace(/\'/g, "'");
                    },
                    reduction = function jsmin__reduction(x) {
                        var a = 0,
                            e = 0,
                            f = 0,
                            g = -1,
                            m = 0,
                            p = 0,
                            r = 0,
                            b = x.length,
                            c = [],
                            d = [],
                            h = [],
                            i = [],
                            test = false,
                            colorLow = function jsmin__reduction_colorLow(y) {
                                var a = y.charAt(0),
                                    b = false;
                                if (y.length === 8 || y.length === 5) {
                                    y = y.substr(1);
                                    b = true;
                                }
                                y = y.toLowerCase();
                                if (y.length === 7 && y.charAt(1) === y.charAt(2) && y.charAt(3) === y.charAt(4) && y.charAt(5) === y.charAt(6)) {
                                    y = "#" + y.charAt(1) + y.charAt(3) + y.charAt(5);
                                }
                                if (b && !(/\s/).test(a) && a !== ":") {
                                    y = a + " " + y;
                                } else if (b && a === ":") {
                                    y = ":PDpoundPD" + y;
                                } else if (b && (/\s/).test(a)) {
                                    y = " " + y;
                                }
                                return y;
                            };
                        (function jsmin__reduction_semicolonRepair() {
                            var misssemi = function jsmin__reduction_semicolonRepair_misssemi(y) {
                                    if (y.indexOf("\n") === -1) {
                                        return y;
                                    }
                                    return y.replace(/\s+/, ";");
                                },
                                b = x.length,
                                c = [],
                                e = 0,
                                q = "";
                            for (a = 0; a < b; a += 1) {
                                c.push(x.charAt(a));
                                if (x.charAt(a) === "{" || x.charAt(a + 1) === "}") {
                                    if (c[0] === "}") {
                                        d.push("}");
                                        c[0] = "";
                                    }
                                    q = c.join("");
                                    if (q.indexOf("{") > -1) {
                                        e = Math.max(q.lastIndexOf("\n"), q.lastIndexOf(";"));
                                        d.push(q.substring(0, e + 1).replace(/^(\s+)/, "").replace(/(\w|\)|"|')\s+/g, misssemi));
                                        d.push(q.substring(e + 1));
                                    } else {
                                        d.push(q.replace(/^(\s+)/, "").replace(/\s+\w+(\-\w+)*:/g, misssemi));
                                    }
                                    c = [];
                                }
                            }
                            d.push("}");
                        }());
                        for (b = a - 1; b > 0; b -= 1) {
                            if (x.charAt(b) === "/" && x.charAt(b - 1) && x.charAt(b - 1) === "*") {
                                for (e = b - 1; e > 0; e -= 1) {
                                    if (x.charAt(e) === "/" && x.charAt(e + 1) === "*") {
                                        b = e;
                                        break;
                                    }
                                }
                            } else if (!/[\}\s]/.test(x.charAt(b))) {
                                break;
                            }
                        }
                        //looks for multidimensional structures, SCSS, and pulls
                        //direct properties above child structures
                        (function jsmin__reduction_scss() {
                            var a = 0,
                                b = d.length,
                                c = 0,
                                e = 0,
                                f = 1,
                                g = [],
                                h = [],
                                i = [],
                                test = false;
                            for (a = 0; a < b; a += 1) {
                                if (d[a] === "}") {
                                    e -= 1;
                                    if (e === f - 1 && g.length > 0) {
                                        h = d.slice(0, a);
                                        i = d.slice(a, d.length);
                                        d = [].concat(h, g, i);
                                        g = [];
                                        a = h.length - 1;
                                        b = d.length;
                                    }
                                } else if (d[a].indexOf("{") > -1) {
                                    e += 1;
                                    if (e > f) {
                                        test = true;
                                        f = e - 1;
                                        g.push(d[a]);
                                        d[a] = "";
                                        for (c = a + 1; c < b; c += 1) {
                                            g.push(d[c]);
                                            if (d[c].indexOf("{") > -1) {
                                                e += 1;
                                                d[c] = "";
                                            } else if (d[c] === "}") {
                                                e -= 1;
                                                d[c] = "";
                                                if (e === f) {
                                                    break;
                                                }
                                            } else {
                                                d[c] = "";
                                            }
                                        }
                                    }
                                }
                            }
                            if (test) {
                                b = d.length;
                                g = [];
                                for (a = 0; a < b; a += 1) {
                                    if (g.length > 0 && g[g.length - 1].indexOf("{") === -1 && d[a] !== "}" && d[a].indexOf("{") === -1) {
                                        g[g.length - 1] = g[g.length - 1] + d[a];
                                    } else if (d[a] !== "") {
                                        g.push(d[a]);
                                    }
                                }
                                d = [].concat(g);
                            }
                        }());
                        b = d.length;
                        for (a = 0; a < b - 1; a += 1) {
                            if (d[a].charAt(d[a].length - 1) !== "{") {
                                if (d[a].indexOf("url(") > -1) {
                                    h = d[a].split("");
                                    f = h.length;
                                    for (e = 3; e < f; e += 1) {
                                        if (h[e - 3] === "u" && h[e - 2] === "r" && h[e - 1] === "l" && h[e] === "(") {
                                            test = true;
                                        }
                                        if (test) {
                                            if (h[e - 1] !== "\\" && h[e] === ")") {
                                                test = false;
                                            } else if (h[e] === ";") {
                                                h[e] = "~PrettyDiffSemi~";
                                            } else if (h[e] === ":") {
                                                h[e] = "~PrettyDiffColon~";
                                            }
                                        }
                                    }
                                    d[a] = h.join("");
                                }
                                if (d[a].charAt(d[a].length - 1) === ";") {
                                    d[a] = d[a].substr(0, d[a].length - 1);
                                }
                                if (d[a].indexOf("{") > -1 || d[a].indexOf(",") > d[a].length - 3) {
                                    c = [d[a]];
                                } else {
                                    c = d[a].replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))(?=(;|\s|\)\}|,))/g, colorLow).replace(/:/g, "~PDCSEP~").split(";").sort();
                                }
                                f = c.length;
                                h = [];
                                for (e = 0; e < f; e += 1) {
                                    if (c[e].charAt(0) === "_") {
                                        c.push(c[e]);
                                        c.splice(e, 1);
                                    }
                                    h.push(c[e].split("~PDCSEP~"));
                                }
                                c = [].concat(h);
                                f = c.length;
                                m = 0;
                                p = 0;
                                g = -1;
                                for (e = 1; e < f; e += 1) {
                                    if (c[e].length > 1 && c[e][0] === c[e - 1][0]) {
                                        c[e - 1] = [
                                            "", ""
                                        ];
                                    }
                                }
                                for (e = 0; e < f; e += 1) {
                                    if (c[e - 1] && c[e - 1][0] === c[e][0] && (/\-[a-z]/).test(c[e - 1][1]) === false && (/\-[a-z]/).test(c[e][1]) === false) {
                                        c[e - 1] = [
                                            "", ""
                                        ];
                                    }
                                    if (c[e][0] !== "margin" && c[e][0].indexOf("margin") !== -1) {
                                        m += 1;
                                        if (m === 4) {
                                            i = [c[e][1]];
                                            r = e;
                                            do {
                                                r -= 1;
                                                if (c[r].length > 1 && c[r][1] !== "") {
                                                    i.push(c[r][1]);
                                                    c[r] = [
                                                        "", ""
                                                    ];
                                                }
                                            } while (i.length < 4 && r > 0);
                                            c[e] = [
                                                "margin", i[0] + " " + i[1] + " " + i[3] + " " + i[2]
                                            ];
                                            m = 0;
                                        }
                                    } else if (c[e][0] !== "padding" && c[e][0].indexOf("padding") !== -1) {
                                        p += 1;
                                        if (p === 4) {
                                            i = [c[e][1]];
                                            r = e;
                                            do {
                                                r -= 1;
                                                if (c[r].length > 1 && c[r][1] !== "") {
                                                    i.push(c[r][1]);
                                                    c[r] = [
                                                        "", ""
                                                    ];
                                                }
                                            } while (i.length < 4 && r > 0);
                                            c[e] = [
                                                "padding", i[0] + " " + i[1] + " " + i[3] + " " + i[2]
                                            ];
                                            p = 0;
                                        }
                                    }
                                    if (g === -1 && c[e + 1] && c[e][0].charAt(0) !== "-" && (c[e][0].indexOf("cue") !== -1 || c[e][0].indexOf("list-style") !== -1 || c[e][0].indexOf("outline") !== -1 || c[e][0].indexOf("overflow") !== -1 || c[e][0].indexOf("pause") !== -1) && (c[e][0] === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")) || c[e][0].substring(0, c[e][0].lastIndexOf("-")) === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")))) {
                                        g = e;
                                        if (c[g][0].indexOf("-") !== -1 && c[g][0] !== "list-style") {
                                            c[g][0] = c[g][0].substring(0, c[g][0].lastIndexOf("-"));
                                        }
                                    } else if (g !== -1 && c[g][0] === c[e][0].substring(0, c[e][0].lastIndexOf("-"))) {
                                        if (c[g][0] === "cue" || c[g][0] === "pause") {
                                            c[g][1] = c[e][1] + " " + c[g][1];
                                        } else {
                                            c[g][1] = c[g][1] + " " + c[e][1];
                                        }
                                        c[e] = [
                                            "", ""
                                        ];
                                    } else if (g !== -1) {
                                        g = -1;
                                    }
                                }
                                for (e = 0; e < f; e += 1) {
                                    if (c[e].length > 1 && c[e][0] !== "") {
                                        for (r = e + 1; r < f; r += 1) {
                                            if (c[r].length > 1 && c[e][0] === c[r][0]) {
                                                c[e] = [
                                                    "", ""
                                                ];
                                            }
                                        }
                                    }
                                }
                                h = [];
                                for (e = 0; e < f; e += 1) {
                                    if (typeof c[e] !== "string" && c[e] !== undefined && c[e][0] !== "") {
                                        h[e] = c[e].join(":");
                                    } else if (typeof c[e] === "string") {
                                        h[e] = c[e].replace(/~PDCSEP~/g, ":");
                                    }
                                }
                                d[a] = h.join(";").replace(/;+/g, ";").replace(/^;/, "");
                                if (d[a] !== "}" && typeof d[a + 1] === "string" && d[a + 1] !== "}" && d[a + 1].indexOf("{") > -1 && !(/(\,\s*)$/).test(d[a])) {
                                    d[a] = d[a] + ";";
                                }
                            }
                            d[a] = d[a].replace(/\)\s+\{/g, "){");
                        }
                        return d.join("").replace(/PDpoundPD#/g, "#");
                    },
                    fixURI = function jsmin__fixURI(y) {
                        var a = 0,
                            b = [],
                            c = "",
                            x = y.replace(/\\\)/g, "~PDpar~").split("url("),
                            d = x.length,
                            e = "";
                        for (a = 1; a < d; a += 1) {
                            e = "\"";
                            if (x[a].charAt(0) === "\"") {
                                e = "";
                            } else if (x[a].charAt(0) === "'") {
                                x[a] = x[a].substr(1, x[a].length - 1);
                            }
                            b = x[a].split(")");
                            c = b[0];
                            if (c.charAt(c.length - 1) !== "\"" && c.charAt(c.length - 1) !== "'") {
                                c = c + "\"";
                            } else if (c.charAt(c.length - 1) === "'" || c.charAt(c.length - 1) === "\"") {
                                c = c.substr(0, c.length - 1) + "\"";
                            }
                            b[0] = c;
                            x[a] = "url(" + e + b.join(")");
                        }
                        return x.join("").replace(/~PDpar~/g, "\\)");
                    },
                    fixNegative = function jsmin__fixNegative(x) {
                        return x.replace(/\-/, " -");
                    },
                    rgbToHex = function jsmin__rgbToHex(x) {
                        var a,
                            y = function jsmin__rgbToHex_toHex(z) {
                                z = Number(z).toString(16);
                                if (z.length === 1) {
                                    z = "0" + z;
                                }
                                return z;
                            };
                        a = "#" + x.replace(/\d+/g, y).replace(/rgb\(/, "").replace(/,/g, "").replace(/\)/, "").replace(/\s*/g, "");
                        return a;
                    },
                    sameDist = function jsmin__sameDist(y) {
                        var z = y.split(":"),
                            x = [];
                        if (z[0].indexOf("background") > -1 || z.length > 2) {
                            return y;
                        }
                        x = z[1].split(" ");
                        if (x.length === 4) {
                            if (x[0] === x[1] && x[1] === x[2] && x[2] === x[3]) {
                                x[1] = "";
                                x[2] = "";
                                x[3] = "";
                            } else if (x[0] === x[2] && x[1] === x[3] && x[0] !== x[1]) {
                                x[2] = "";
                                x[3] = "";
                            } else if (x[0] !== x[2] && x[1] === x[3]) {
                                x[3] = "";
                            }
                        } else if (x.length === 3 && x[0] === x[2] && x[0] !== x[1]) {
                            x[2] = "";
                        } else if (x.length === 2 && a !== " " && x[0] === x[1]) {
                            x[1] = "";
                        }
                        return z[0] + ":" + x.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
                    },
                    singleZero = function jsmin__singleZero(x) {
                        var a = x.substr(0, x.indexOf(":") + 1);
                        if (a === "radius:" || a === "shadow:" || x.charAt(x.length - 1) !== "0" || (x.charAt(x.length - 1) === "0" && x.charAt(x.length - 2) !== " ")) {
                            return x;
                        }
                        return a + "0";
                    },
                    endZero = function jsmin__endZero(x) {
                        var a = x.indexOf(".");
                        return x.substr(0, a);
                    },
                    runZero = function jsmin__runZero(x) {
                        var a = x.charAt(0);
                        if (a === "#" || a === "." || /[a-f0-9]/.test(a)) {
                            return x;
                        }
                        return a + "0";
                    },
                    startZero = function jsmin__startZero(x) {
                        var a = x.indexOf(".");
                        return x.charAt(0) + x.substr(a, x.length);
                    },
                    fixpercent = function jsmin__fixpercent(x) {
                        return x.replace(/%/, "% ");
                    },
                    bangFix = function jsmin__bangFix(x) {
                        if (x.indexOf("\n") > -1) {
                            return ");!";
                        }
                        return x;
                    },
                    get = function jsmin__get() {
                        var c = theLookahead;
                        if (geti === getl) {
                            return EOF;
                        }
                        theLookahead = EOF;
                        if (c === EOF) {
                            c = input.charAt(geti);
                            geti += 1;
                        }
                        if (c >= " " || c === "\n") {
                            return c;
                        }
                        if (c === "\r") {
                            return "\n";
                        }
                        return " ";
                    },
                    peek = function jsmin__peek() {
                        theLookahead = get();
                        return theLookahead;
                    },
                    next = function jsmin__next() {
                        var c = get();
                        if (c === "/" && (type === "javascript" || (type === "css" && peek() !== "/"))) {
                            switch (peek()) {
                            case "/":
                                for (;;) {
                                    c = get();
                                    if (c <= "\n") {
                                        return c;
                                    }
                                }
                                break;
                            case "*":
                                get();
                                for (;;) {
                                    switch (get()) {
                                    case "'":
                                        c = get().replace(/'/, "");
                                        break;
                                    case "\"":
                                        c = get().replace(/"/, "");
                                        break;
                                    case "*":
                                        if (peek() === "/") {
                                            get();
                                            return " ";
                                        }
                                        break;
                                    case EOF:
                                        error = "Error: Unterminated block comment.";
                                        return error;
                                    }
                                }
                                break;
                            default:
                                return c;
                            }
                        }
                        return c;
                    },
                    action = function jsmin__action(d) {
                        var r = [];
                        if (d === 1) {
                            r.push(a);
                        }
                        if (d < 3) {
                            a = b;
                            if (a === "'" || a === "\"") {
                                if (d === 1 && (r[0] === ")" || r[0] === "]") && alterj) {
                                    a = ";";
                                    return r[0];
                                }
                                for (;;) {
                                    r.push(a);
                                    a = get();
                                    if (a === b) {
                                        break;
                                    }
                                    if (a <= "\n") {
                                        if (type === "css") {
                                            error = "Error: This does not appear to be CSS.";
                                        } else {
                                            error = "Error: This does not appear to be JavaScript.";
                                        }
                                        return error;
                                    }
                                    if (a === "\\") {
                                        r.push(a);
                                        a = get();
                                    }
                                }
                            }
                        }
                        b = next();
                        if (b === "/" && "(,=:[!&|".indexOf(a) > -1 && type !== "css") {
                            r.push(a);
                            r.push(b);
                            for (;;) {
                                a = get();
                                if (a === "/") {
                                    break;
                                } else if (a === "\\") {
                                    r.push(a);
                                    a = get();
                                } else if (a <= "\n") {
                                    error = "Error: unterminated JavaScript Regular Expression literal";
                                    return error;
                                }
                                r.push(a);
                            }
                            b = next();
                        }
                        return r.join("");
                    },
                    m = function jsmin__m() {
                        (function jsmin__m_topComments() {
                            var a = 0,
                                b = input.length,
                                c = "";
                            if (fcomment !== true || (/^\s*\/\*/.test(input) !== true && /^\s*\/\//.test(input) !== true)) {
                                return;
                            }
                            for (a = 0; a < b; a += 1) {
                                if (c === "") {
                                    if (input.charAt(a) === "/" && input.charAt(a + 1) && (input.charAt(a + 1) === "*" || input.charAt(a + 1) === "/")) {
                                        c = input.substr(a, 2);
                                        fcom.push(input.charAt(a));
                                    } else if (/\s/.test(input.charAt(a)) !== true) {
                                        return;
                                    }
                                } else {
                                    fcom.push(input.charAt(a));
                                    if (input.charAt(a) === "*" && c === "/*" && input.charAt(a + 1) && input.charAt(a + 1) === "/") {
                                        fcom.push("/\n");
                                        if (input.charAt(a + 2) && input.charAt(a + 2) === "\n") {
                                            a += 2;
                                        } else {
                                            a += 1;
                                        }
                                        c = "";
                                    } else if ((input.charAt(a) === "\n" || input.charAt(a) === "\r") && c === "//") {
                                        c = "";
                                    }
                                }
                            }
                        }());
                        var r = [],
                            s = "",
                            t = 0,
                            asiflag = true,
                            conflag = false;
                        if (error !== "") {
                            return error;
                        }
                        a = "\n";
                        r.push(action(3));
                        while (a !== EOF) {
                            if (a === " " && !(type === "css" && b === "#")) {
                                if (isAlphanum(b)) {
                                    r.push(action(1));
                                } else {
                                    r.push(action(2));
                                    if (alterj) {
                                        s = r[r.length - 1];
                                        if ((isAlphanum(s) || s === "'" || s === "\"" || s === "]" || s === ")") && a === "}") {
                                            r.push(";");
                                        }
                                    }
                                }
                            } else if (a === "\n") {
                                switch (b) {
                                case "{":
                                case "[":
                                case "(":
                                case "+":
                                case "-":
                                    r.push(action(1));
                                    break;
                                case " ":
                                    r.push(action(3));
                                    break;
                                default:
                                    if (isAlphanum(b)) {
                                        r.push(action(1));
                                    } else {
                                        if (level === 1 && b !== "\n") {
                                            r.push(action(1));
                                        } else {
                                            r.push(action(2));
                                        }
                                    }
                                }
                            } else {
                                switch (b) {
                                case " ":
                                    if (isAlphanum(a)) {
                                        r.push(action(1));
                                        break;
                                    }
                                    r.push(action(3));
                                    break;
                                case "\n":
                                    if (level === 1 && a !== "\n") {
                                        r.push(action(1));
                                    } else if (a === "}") {
                                        asiflag = true;
                                        if (level === 3) {
                                            r.push(action(3));
                                        } else {
                                            r.push(action(1));
                                        }
                                    } else if (isAlphanum(a)) {
                                        r.push(action(1));
                                        if (alterj) {
                                            s = r[r.length - 1];
                                            if (s === ":") {
                                                asiflag = false;
                                            }
                                            if (asiflag && (isAlphanum(s) || s === "]" || s === ")") && a === "\n" && (b === "}" || b === " ")) {
                                                r.push(";");
                                            }
                                        }
                                    } else {
                                        r.push(action(3));
                                    }
                                    break;
                                default:
                                    r.push(action(1));
                                    if (alterj) {
                                        s = r[r.length - 1];
                                        if (s === "{") {
                                            asiflag = true;
                                        } else if (s.charAt(0) === ":") {
                                            asiflag = false;
                                        } else if ((r[r.length - 3] + r[r.length - 2] + r[r.length - 1] === "if(") || (r[r.length - 4] + r[r.length - 3] + r[r.length - 2] + r[r.length - 1] === "for(")) {
                                            asiflag = false;
                                            conflag = true;
                                        } else if (r[r.length - 1] === "(" && r[r.length - 2] === "") {
                                            t = r.length - 2;
                                            do {
                                                t -= 1;
                                            } while (r[t] === "");
                                            if ((r[t - 1] + r[t] + r[r.length - 1] === "if(") || (r[t - 2] + r[t - 1] + r[t] + r[r.length - 1] === "for(")) {
                                                asiflag = false;
                                                conflag = true;
                                            }
                                        }
                                        if (asiflag && (((s === "]" || s === ")") && isAlphanum(a) && a !== "/") || (a === "}" && (isAlphanum(s) || s === "'" || s === "\"")))) {
                                            r.push(";");
                                        }
                                        if (conflag && s === ")") {
                                            asiflag = true;
                                            conflag = false;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        return r.join("").replace(/;\]/g, "]");
                    };
                if (type === "css") {
                    OTHERS = "-._\\";
                } else {
                    if (alter && level === 2) {
                        alterj = true;
                        input = input.replace(/\r\n?/g, "\n").replace(/("|')\s+["'a-zA-Z_$]/g, jsasiq).replace(/\)\s+\!(?!\=)/g, bangFix);
                    }
                    OTHERS = "_$//";
                }
                if (type === "css" && alter) {
                    input = reduction(input.replace(/; /g, ";\n"));
                }
                ALNUM = LETTERS + DIGITS + OTHERS;
                geti = 0;
                getl = input.length;
                ret = m(input);
                if (/\s/.test(ret.charAt(0))) {
                    ret = ret.slice(1, ret.length);
                }
                if (type === "css") {
                    ret = ret.replace(/\: #/g, ":#").replace(/\; #/g, ";#").replace(/\, #/g, ",#").replace(/\s+/g, " ").replace(/\} /g, "}").replace(/\{ /g, "{").replace(/\\\)/g, "~PDpar~").replace(/\)/g, ") ").replace(/\) ;/g, ");").replace(/\d%\.?[a-z0-9]/g, fixpercent);
                    if (alter) {
                        ret = ret.replace(/@charset("|')?[\w\-]+("|')?;?/gi, "").replace(/(#|\.)?[\w]*\{\}/gi, "").replace(/(\S|\s)0+/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/(:| )0+\.\d+/g, startZero).replace(/\w+(\-\w+)*:((((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0) )+(((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0)/g, sameDist).replace(/\};/g, "}").replace(/^;/, "").replace(/ \}/g, "}");
                        ret = ret.replace(/:\.?0(\%|px|in|cm|mm|em|ex|pt|pc)/g, ":0").replace(/ \.?0(\%|px|in|cm|mm|em|ex|pt|pc)/g, " 0").replace(/bottom:none/g, "bottom:0").replace(/top:none/g, "top:0").replace(/left:none/g, "left:0").replace(/right:none/, "right:0").replace(/:0 0 0 0/g, ":0").replace(/:(\s*([0-9]+\.)?[0-9]+(%|in|cm|mm|em|ex|pt|pc|px)?)+\-([0-9]*\.)?[0-9]/g, fixNegative);
                        ret = ret.replace(/[a-z]*:(0\s*)+\-?\.?\d?/g, singleZero).replace(/ 0 0 0 0/g, " 0").replace(/rgb\(\d+,\d+,\d+\)/g, rgbToHex).replace(/background\-position:0;/gi, "background-position:0 0;").replace(/;+/g, ";").replace(/\s*[\w\-]+:\s*\}/g, "}").replace(/\s*[\w\-]+:\s*;/g, "").replace(/;\}/g, "}").replace(/\{;/g, "{").replace(/\{\s+\}/g, "{}").replace(/\s+\)/g, ")").replace(/\s+\,/g, ",");
                        if (atchar === null) {
                            atchar = [""];
                        } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                            atchar[0] = atchar[0] + ";";
                        }
                        ret = atchar[0].replace(/@charset/i, "@charset") + fixURI(ret).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";");
                    }
                    ret = ret.replace(/~PDpar~/g, "\\)");
                } else if (alterj) {
                    ret = ret.replace(/(\s+)$/, "").replace(/((return)|(continue)|(break)|(throw))\s+/g, semiword).replace(/(\n+)!+(\+|\-)/g, ";").replace(/\}\u003b(!=\))/g, "}").replace(/x{2}-->/g, "//-->");
                    ret = asiFix(ret);
                    if (ret.charAt(ret.length - 1) !== ";" && ret.charAt(ret.length - 1) !== "}") {
                        ret = ret + ";";
                    }
                } else {
                    ret = ret.replace(/^\s+/, "").replace(/x{2}-->/g, "//-->");
                }
                if (error !== "") {
                    return error;
                }
                return fcom.join("") + ret;
            },
            cleanCSS = function cleanCSS(args) {
                var x = (typeof args.source !== "string" || args.source === "") ? "Error: no source supplied to cleanCSS." : args.source,
                    size = (typeof args.size !== "number" || args.size < 0) ? 4 : args.size,
                    character = (typeof args.character !== "string") ? " " : args.character,
                    comment = (args.comment === "noindent") ? "noindent" : "",
                    alter = (args.alter === true) ? true : false,
                    q = x.length,
                    a = 0,
                    b = 0,
                    c = [],
                    atchar = x.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
                    tab = "",
                    nsize = Number(size),
                    fixURI = function cleanCSS__fixURI(y) {
                        var a = 0,
                            b = [],
                            c = "",
                            x = y.replace(/\\\)/g, "~PDpar~").split("url("),
                            d = x.length,
                            e = "",
                            f = (y.indexOf("data~PrettyDiffColon~") > -1 && y.indexOf("~PrettyDiffSemi~base64") > y.indexOf("data~PrettyDiffColon~")) ? true : false,
                            basefix = function (x) {
                                return x + "\n";
                            };
                        for (a = 1; a < d; a += 1) {
                            e = "\"";
                            if (x[a].charAt(0) === "\"") {
                                e = "";
                            } else if (x[a].charAt(0) === "'") {
                                x[a] = x[a].substr(1, x[a].length - 1);
                            }
                            b = x[a].split(")");
                            c = b[0];
                            if (c.charAt(c.length - 1) !== "\"" && c.charAt(c.length - 1) !== "'") {
                                c = c + "\"";
                            } else if (c.charAt(c.length - 1) === "'" || c.charAt(c.length - 1) === "\"") {
                                c = c.substr(0, c.length - 1) + "\"";
                            }
                            if (f === true) {
                                b[0] = c.replace(/ ?\/ ?/g, "/").replace(/\S{77}\/?\s*/g, basefix).replace(/\n{2}/g, "\n");
                            } else {
                                b[0] = c.replace(/\s*\/\s*/g, "/");
                            }
                            x[a] = "url(" + e + b.join(")");
                        }
                        return x.join("").replace(/~PDpar~/g, "\\)");
                    },
                    sameDist = function cleanCSS__sameDist(x) {
                        var y = [],
                            z = x.split(": ");
                        if (z[0].indexOf("background") > -1 || z.length > 2) {
                            return x;
                        }
                        y = z[1].split(" ");
                        if (y.length === 4) {
                            if (y[0] === y[1] && y[1] === y[2] && y[2] === y[3]) {
                                y[1] = "";
                                y[2] = "";
                                y[3] = "";
                            } else if (y[0] === y[2] && y[1] === y[3] && y[0] !== y[1]) {
                                y[2] = "";
                                y[3] = "";
                            } else if (y[0] !== y[2] && y[1] === y[3]) {
                                y[3] = "";
                            }
                        } else if (y.length === 3 && y[0] === y[2] && y[0] !== y[1]) {
                            y[2] = "";
                        } else if (y.length === 2 && y[0] === y[1]) {
                            y[1] = "";
                        }
                        return z[0] + ": " + y.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
                    },
                    endZero = function cleanCSS__endZero(y) {
                        var a = y.indexOf(".");
                        return y.substr(0, a);
                    },
                    runZero = function cleanCSS__runZero(y) {
                        var a = y.charAt(0);
                        if (a === "#" || a === "." || /[a-f0-9]/.test(a)) {
                            return y;
                        }
                        return a + "0;";
                    },
                    startZero = function cleanCSS__startZero(y) {
                        return y.replace(/ \./g, " 0.");
                    },
                    emptyend = function cleanCSS__emptyend(y) {
                        var b = y.match(/^(\s*)/)[0],
                            c = b.substr(0, b.length - tab.length);
                        if (y.charAt(y.length - 1) === "}") {
                            return c + "}";
                        }
                        return c.replace(/(\s+)$/, "");
                    },
                    fixpercent = function cleanCSS__fixpercent(y) {
                        return y.replace(/%/, "% ");
                    },
                    nestblock = function cleanCSS__nestblock(y) {
                        return y.replace(/\s*;\n/, "\n");
                    },
                    cleanAsync = function cleanCSS__cleanAsync() {
                        var i = 0,
                            j = 0,
                            b = x.length,
                            tabs = [],
                            tabb = "",
                            out = [tab],
                            y = x.split("");
                        for (i = 0; i < b; i += 1) {
                            if ("{" === y[i]) {
                                tabs.push(tab);
                                tabb = tabs.join("");
                                out.push(" {\n" + tabb);
                            } else if ("\n" === y[i]) {
                                out.push("\n" + tabb);
                            } else if ("}" === y[i]) {
                                out[out.length - 1] = out[out.length - 1].replace(/\s*$/, "");
                                tabs = tabs.slice(0, tabs.length - 1);
                                tabb = tabs.join("");
                                if (y[i + 1] + y[i + 2] !== "*/") {
                                    out.push("\n" + tabb + "}\n" + tabb);
                                } else {
                                    out.push("\n" + tabb + "}");
                                }
                            } else if (y[i - 1] === "," && (/\s/).test(y[i]) === false) {
                                out.push(" ");
                                out.push(y[i]);
                            } else if (";" === y[i] && "}" !== y[i + 1]) {
                                out.push(";\n" + tabb);
                            } else if (i > 3 && y[i - 3] === "u" && y[i - 2] === "r" && y[i - 1] === "l" && y[i] === "(") {
                                for (j = i; j < b; j += 1) {
                                    out.push(y[j]);
                                    if (y[j] === ")" && y[j - 1] !== "\\") {
                                        i = j;
                                        break;
                                    }
                                }
                            } else {
                                out.push(y[i]);
                            }
                        }
                        if (i >= b) {
                            out = [out.join("").replace(/^(\s*)/, "").replace(/(\s*)$/, "")];
                            x = out.join("");
                            tabs = [];
                        }
                    },
                    reduction = function cleanCSS__reduction(x) {
                        var a = 0,
                            e = 0,
                            f = 0,
                            g = -1,
                            m = 0,
                            p = 0,
                            r = 0,
                            q = "",
                            b = x.length,
                            c = [],
                            d = [],
                            h = [],
                            i = [],
                            test = false,
                            colorLow = function cleanCSS__reduction_colorLow(y) {
                                var a = y.charAt(0),
                                    b = false;
                                if (y.length === 8 || y.length === 5) {
                                    y = y.substr(1);
                                    b = true;
                                }
                                y = y.toLowerCase();
                                if (y.length === 7 && y.charAt(1) === y.charAt(2) && y.charAt(3) === y.charAt(4) && y.charAt(5) === y.charAt(6)) {
                                    y = "#" + y.charAt(1) + y.charAt(3) + y.charAt(5);
                                }
                                if (a === ":") {
                                    y = a + "PDpoundPD" + y;
                                } else if (b && !(/\s/).test(a) && a !== "(") {
                                    y = a + " " + y;
                                } else if (b && ((/\s/).test(a) || a === "(")) {
                                    y = a + y;
                                }
                                return y;
                            },
                            ccex = (/[\w\s:#\-\=\!\(\)"'\[\]\.%-\_\?\/\\]\/\*/),
                            cceg = function cleanCSS__reduction_cceg(a) {
                                return a.replace(/\s*\/\*/, ";/*");
                            };
                        (function cleanCSS__reduction_missingSemicolon() {
                            var misssemi = function cleanCSS__reduction_missingSemicolon_misssemi(y) {
                                    if (y.indexOf("\n") === -1) {
                                        return y;
                                    }
                                    return y.replace(/\s+/, ";");
                                },
                                b = x.length,
                                c = [],
                                e = 0,
                                q = "";
                            for (a = 0; a < b; a += 1) {
                                c.push(x.charAt(a));
                                if (x.charAt(a) === "{" || x.charAt(a + 1) === "}") {
                                    if (c[0] === "}") {
                                        d.push("}");
                                        c[0] = "";
                                    }
                                    q = c.join("");
                                    if (q.indexOf("{") > -1 && (q.indexOf("\n") > -1 || q.indexOf(";") > -1)) {
                                        e = Math.max(q.lastIndexOf("\n"), q.lastIndexOf(";"));
                                        d.push(q.substring(0, e + 1).replace(/(\w|\)|"|')\s+/g, misssemi));
                                        d.push(q.substring(e + 1));
                                    } else {
                                        d.push(q.replace(/(\w|\)|"|')\s+/g, misssemi));
                                    }
                                    c = [];
                                }
                            }
                            d.push("}");
                        }());
                        for (b = a - 1; b > 0; b -= 1) {
                            if (x.charAt(b) === "/" && x.charAt(b - 1) && x.charAt(b - 1) === "*") {
                                for (e = b - 1; e > 0; e -= 1) {
                                    if (x.charAt(e) === "/" && x.charAt(e + 1) === "*") {
                                        b = e;
                                        break;
                                    }
                                }
                            } else if (!/[\}\s]/.test(x.charAt(b))) {
                                break;
                            }
                        }
                        (function cleanCSS__reduction_scss() {
                            var a = 0,
                                b = d.length,
                                c = 0,
                                e = 0,
                                f = 1,
                                g = [],
                                h = [],
                                i = [],
                                test = false;
                            for (a = 0; a < b; a += 1) {
                                if (d[a] === "}") {
                                    e -= 1;
                                    if (e === f - 1 && g.length > 0) {
                                        h = d.slice(0, a);
                                        i = d.slice(a, d.length);
                                        d = [].concat(h, g, i);
                                        g = [];
                                        a = h.length - 1;
                                        b = d.length;
                                    }
                                } else if (d[a].indexOf("{") > -1) {
                                    e += 1;
                                    if (e > f) {
                                        test = true;
                                        f = e - 1;
                                        g.push(d[a]);
                                        d[a] = "";
                                        for (c = a + 1; c < b; c += 1) {
                                            g.push(d[c]);
                                            if (d[c].indexOf("{") > -1) {
                                                e += 1;
                                                d[c] = "";
                                            } else if (d[c] === "}") {
                                                e -= 1;
                                                d[c] = "";
                                                if (e === f) {
                                                    break;
                                                }
                                            } else {
                                                d[c] = "";
                                            }
                                        }
                                    }
                                }
                            }
                            if (test) {
                                b = d.length;
                                g = [];
                                for (a = 0; a < b; a += 1) {
                                    if (g.length > 0 && g[g.length - 1].indexOf("{") === -1 && d[a] !== "}" && d[a].indexOf("{") === -1) {
                                        g[g.length - 1] = g[g.length - 1] + d[a];
                                    } else if (d[a] !== "") {
                                        g.push(d[a]);
                                    }
                                }
                                d = [].concat(g);
                            }
                        }());
                        for (a = d.length - 1; a > 0; a -= 1) {
                            if (d[a] === "}") {
                                b += 1;
                            } else {
                                break;
                            }
                        }
                        b = d.length;
                        for (a = 0; a < b; a += 1) {
                            if (d[a].charAt(d[a].length - 1) === "{") {
                                d[a] = d[a].replace(/,\s*/g, ",\n").replace(/>/g, " > ");
                            } else {
                                if (d[a].indexOf("url(") > -1) {
                                    h = d[a].split("");
                                    f = h.length;
                                    for (e = 3; e < f; e += 1) {
                                        if (h[e - 3] === "u" && h[e - 2] === "r" && h[e - 1] === "l" && h[e] === "(") {
                                            test = true;
                                        }
                                        if (test) {
                                            if (h[e - 1] !== "\\" && h[e] === ")") {
                                                test = false;
                                            } else if (h[e] === ";") {
                                                h[e] = "~PrettyDiffSemi~";
                                            } else if (h[e] === ":") {
                                                h[e] = "~PrettyDiffColon~";
                                            }
                                        }
                                    }
                                    d[a] = h.join("");
                                }
                                if (d[a].charAt(d[a].length - 1) === ";") {
                                    d[a] = d[a].substr(0, d[a].length - 1);
                                }
                                q = d[a].replace(ccex, cceg);
                                c = q.replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))/g, colorLow).replace(/\*\//g, "*/;").replace(/:/g, "~PDCSEP~").split(";");
                                f = c.length;
                                h = [];
                                i = [];
                                for (e = 0; e < f; e += 1) {
                                    if (/^(\/\*)/.test(c[e])) {
                                        h.push(c[e].replace(/\/\*\s*/, "/* "));
                                    } else if (c[e] !== "") {
                                        i.push(c[e].replace(/^\s*/, ""));
                                    }
                                }
                                i = i.sort();
                                f = i.length;
                                c = [];
                                for (e = 0; e < f; e += 1) {
                                    if (i[e].charAt(0) === "_") {
                                        i.push(i[e]);
                                        i.splice(e, 1);
                                    }
                                    c.push(i[e].split("~PDCSEP~"));
                                }
                                c = h.concat(c);
                                f = c.length;
                                m = 0;
                                p = 0;
                                g = -1;
                                for (e = 1; e < f; e += 1) {
                                    if (c[e].length > 1 && c[e][0] === c[e - 1][0]) {
                                        c[e - 1] = [
                                            "", ""
                                        ];
                                    }
                                }
                                for (e = 0; e < f; e += 1) {
                                    if (c[e - 1] && c[e - 1][0] === c[e][0] && (/\-[a-z]/).test(c[e - 1][1]) === false && (/\-[a-z]/).test(c[e][1]) === false) {
                                        c[e - 1] = [
                                            "", ""
                                        ];
                                    }
                                    if (c[e].length > 1 && typeof c[e][1] === "string" && c[e][1].length > 2) {
                                        c[e][1] = c[e][1].replace(/\//g, " / ").replace(/\*/g, "* ");
                                    }
                                    if (c[e][0] !== "margin" && c[e][0].indexOf("margin") !== -1) {
                                        m += 1;
                                        if (m === 4) {
                                            i = [c[e][1]];
                                            r = e;
                                            do {
                                                r -= 1;
                                                if (c[r].length > 1 && c[r][1] !== "") {
                                                    i.push(c[r][1]);
                                                    c[r] = [
                                                        "", ""
                                                    ];
                                                }
                                            } while (i.length < 4 && r > 0);
                                            c[e] = [
                                                "margin", i[0] + " " + i[1] + " " + i[3] + " " + i[2]
                                            ];
                                            m = 0;
                                        }
                                    } else if (c[e][0] !== "padding" && c[e][0].indexOf("padding") !== -1) {
                                        p += 1;
                                        if (p === 4) {
                                            i = [c[e][1]];
                                            r = e;
                                            do {
                                                r -= 1;
                                                if (c[r].length > 1 && c[r][1] !== "") {
                                                    i.push(c[r][1]);
                                                    c[r] = [
                                                        "", ""
                                                    ];
                                                }
                                            } while (i.length < 4 && r > 0);
                                            c[e] = [
                                                "padding", i[0] + " " + i[1] + " " + i[3] + " " + i[2]
                                            ];
                                            p = 0;
                                        }
                                    }
                                    if (g === -1 && c[e + 1] && c[e][0].charAt(0) !== "-" && (c[e][0].indexOf("cue") !== -1 || c[e][0].indexOf("list-style") !== -1 || c[e][0].indexOf("outline") !== -1 || c[e][0].indexOf("overflow") !== -1 || c[e][0].indexOf("pause") !== -1) && (c[e][0] === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")) || c[e][0].substring(0, c[e][0].lastIndexOf("-")) === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")))) {
                                        g = e;
                                        if (c[g][0].indexOf("-") !== -1 && c[g][0] !== "list-style") {
                                            c[g][0] = c[g][0].substring(0, c[g][0].lastIndexOf("-"));
                                        }
                                    } else if (g !== -1 && c[g][0] === c[e][0].substring(0, c[e][0].lastIndexOf("-"))) {
                                        if (c[g][0] === "cue" || c[g][0] === "pause") {
                                            c[g][1] = c[e][1] + " " + c[g][1];
                                        } else {
                                            c[g][1] = c[g][1] + " " + c[e][1];
                                        }
                                        c[e] = [
                                            "", ""
                                        ];
                                    } else if (g !== -1) {
                                        g = -1;
                                    }
                                }
                                for (e = 0; e < f; e += 1) {
                                    if (c[e].length > 1 && c[e][0] !== "") {
                                        for (r = e + 1; r < f; r += 1) {
                                            if (c[r].length > 1 && c[e][0] === c[r][0]) {
                                                c[e] = [
                                                    "", ""
                                                ];
                                            }
                                        }
                                    }
                                }
                                h = [];
                                for (e = 0; e < f; e += 1) {
                                    if (typeof c[e] !== "string" && c[e] !== undefined && c[e][0] !== "") {
                                        h.push(c[e].join(": "));
                                    } else if (typeof c[e] === "string") {
                                        h.push(c[e].replace(/~PDCSEP~/g, ": "));
                                    }
                                }
                                d[a] = (h.join(";") + ";").replace(/^;/, "");
                            }
                        }
                        return d.join("").replace(/\*\/\s*;\s*/g, "*/\n").replace(/(\s*[\w\-]+:)$/g, "\n}").replace(/\s*;$/, "").replace(/PDpoundPD#/g, "#");
                    };
                (function cleanCSS__tab() {
                    var i = 0,
                        j = [];
                    for (i = 0; i < nsize; i += 1) {
                        j.push(character);
                    }
                    tab = j.join("");
                }());
                if ("\n" === x.charAt(0)) {
                    x = x.substr(1);
                }
                (function cleanCSS__fixSyntaxReplace() {
                    var c = x.split(""),
                        b = c.length,
                        f = 0,
                        e = false;
                    for (f = 1; f < b; f += 1) {
                        if (c[f] === "*" && c[f - 1] === "/" && !e) {
                            e = true;
                        } else if (e) {
                            if (c[f] === ",") {
                                c[f] = "~PrettyDiffComma~";
                            } else if (c[f] === ";") {
                                c[f] = "~PrettyDiffSemi~";
                            } else if (c[f] === "/" && c[f - 1] === "*") {
                                e = false;
                            }
                        }
                    }
                    x = c.join("");
                }());
                x = x.replace(/[ \t\r\v\f]+/g, " ").replace(/\n (?!\*)/g, "\n").replace(/\s?([;:{}+>])\s?/g, "$1").replace(/\{(\.*):(\.*)\}/g, "{$1: $2}").replace(/\b\*/g, " *").replace(/\*\/\s?/g, "*/\n").replace(/\d%\.?\d/g, fixpercent);
                if (alter === true) {
                    x = reduction(x);
                }
                cleanAsync();
                if (alter === true) {
                    c = x.split("*/");
                    b = c.length;
                    for (a = 0; a < b; a += 1) {
                        if (c[a].search(/\s*\/\*/) !== 0) {
                            c[a] = c[a].replace(/@charset\s*("|')?[\w\-]+("|')?;?\s*/gi, "").replace(/(\S|\s)0+(%|in|cm|mm|em|ex|pt|pc)?;/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/:[\w\s\!\.\-%]* \.\d+/g, startZero).replace(/ \.?0((?=;)|(?= )|%|in|cm|mm|em|ex|pt|pc)/g, " 0px");
                            c[a] = c[a].replace(/\w+(\-\w+)*: ((((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0) )+(((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0)/g, sameDist).replace(/background\-position: 0px;/g, "background-position: 0px 0px;").replace(/\s+\*\//g, "*/");
                            c[a] = c[a].replace(/\s*[\w\-]+\:\s*(\}|;)/g, emptyend).replace(/\{\s+\}/g, "{}").replace(/\}\s*;\s*\}/g, nestblock).replace(/:\s+#/g, ": #").replace(/(\s+;+\n)+/g, "\n");
                        }
                    }
                    x = c.join("*/");
                    if (atchar === null) {
                        atchar = [""];
                    } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                        atchar[0] = atchar[0] + ";\n";
                    } else {
                        atchar[0] = atchar[0] + "\n";
                    }
                    x = atchar[0].replace(/@charset/i, "@charset") + fixURI(x).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";").replace(/~PrettyDiffComma~/g, ",");
                }
                if (comment === "noindent") {
                    x = x.replace(/\s+\/\*/g, "\n/*").replace(/\n\s+\*\//g, "\n*/");
                }
                if (summary !== "diff") {
                    (function cleanCSS__report() {
                        var a = 0,
                            b = [],
                            c = x.split("\n"),
                            d = c.length,
                            e = [],
                            f = q.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                            g = x.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                            h = 0,
                            i = "",
                            j = 0;
                        for (a = 0; a < d; a += 1) {
                            if (c[a].charAt(0) === "/" && c[a].charAt(1) === "*") {
                                for (a; a < d; a += 1) {
                                    if (c[a].charAt(c[a].length - 2) === "*" && c[a].charAt(c[a].length - 1) === "/") {
                                        break;
                                    }
                                }
                            } else if (c[a].indexOf("url") !== -1 && c[a].indexOf("url(\"\")") === -1 && c[a].indexOf("url('')") === -1 && c[a].indexOf("url()") === -1) {
                                b.push(c[a]);
                            }
                        }
                        d = b.length;
                        for (a = 0; a < d; a += 1) {
                            b[a] = b[a].substr(b[a].indexOf("url(\"") + 5, b[a].length);
                            b[a] = b[a].substr(0, b[a].indexOf("\")"));
                        }
                        for (a = 0; a < d; a += 1) {
                            e[a] = 1;
                            for (j = a + 1; j < d; j += 1) {
                                if (b[a] === b[j]) {
                                    e[a] += 1;
                                    b[j] = "";
                                }
                            }
                        }
                        for (a = 0; a < d; a += 1) {
                            if (b[a] !== "") {
                                h += 1;
                                e[a] = e[a] + "x";
                                if (e[a] === "1x") {
                                    e[a] = "<em>" + e[a] + "</em>";
                                }
                                b[a] = "<li>" + e[a] + " - " + b[a] + "</li>";
                            }
                        }
                        if (d !== 0) {
                            i = "<h4>List of HTTP requests:</h4><ul>" + b.join("") + "</ul>";
                        }
                        summary = "<p><strong>Total input size:</strong> <em>" + f + "</em> characters</p><p><strong>Total output size:</strong> <em>" + g + "</em> characters</p><p><strong>Number of HTTP requests:</strong> <em>" + h + "</em></p>" + i;
                    }());
                }
                return x;
            },
            jspretty = function jspretty(args) {
                var source = (typeof args.source === "string" && args.source.length > 0) ? args.source : "Error: no source code supplied to jsbeauty!",
                    jsize = (args.insize > 0) ? args.insize : ((Number(args.insize) > 0) ? Number(args.insize) : 4),
                    jchar = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                    jpres = (typeof args.preserve === "boolean") ? args.preserve : true,
                    jlevel = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
                    jspace = (typeof args.space === "boolean") ? args.space : true,
                    jbrace = (args.braces === "allman") ? true : false,
                    jcomment = (args.comments === "noindent") ? true : false,
                    jsscope = (args.jsscope === true) ? true : false,
                    token = [],
                    types = [],
                    level = [],
                    lines = [],
                    meta = [],
                    j = [
                        0, 0
                    ],
                    k = [
                        0, 0
                    ],
                    l = [
                        0, 0, 0
                    ],
                    m = [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                    ],
                    n = [
                        0, 0, 0, 0, 0
                    ],
                    o = [
                        0, 0
                    ],
                    p = [
                        0, 0
                    ],
                    q = [
                        0, 0
                    ],
                    w = [
                        0, 0, 0, 0
                    ],
                    result = "";
                if (source === "Error: no source code supplied to jsbeauty!") {
                    return source;
                }
                //this function tokenizes the source code into an array
                //of literals and syntax tokens
                (function jspretty__tokenize() {
                    var a = 0,
                        b = source.length,
                        c = source.split(""),
                        t = "",
                        u = "",
                        d = function jspretty__tokenize_genericBuilder(start, offset, end) {
                            var e = 0,
                                f = 0,
                                g = 0,
                                h = end.split(""),
                                i = h.length - 1,
                                j = b,
                                k = false,
                                l = [start],
                                m = (h[0] === "\r") ? true : false,
                                n = a + offset,
                                o = "";
                            for (e = n; e < j; e += 1) {
                                l.push(c[e]);
                                if (c[e] === h[i] || (m === true && (c[e] === "\n" || e === j - 1))) {
                                    if (i > 0) {
                                        g = i;
                                        for (f = e; g > -1; f -= 1) {
                                            if (c[f] !== h[g]) {
                                                break;
                                            }
                                            g -= 1;
                                        }
                                        if (g === -1) {
                                            k = true;
                                        }
                                    } else {
                                        k = true;
                                    }
                                    if (e > i + 1 && c[e - i - 1] === "\\") {
                                        g = 1;
                                        for (f = e - 2; f > -1; f -= 1) {
                                            if (c[f] === "\\") {
                                                g += 1;
                                            } else {
                                                break;
                                            }
                                        }
                                        if (g % 2 === 1) {
                                            k = false;
                                        }
                                    }
                                    if (k) {
                                        break;
                                    }
                                }
                            }
                            if (e < j) {
                                a = e;
                                if (start === "//") {
                                    l.pop();
                                }
                                if (jsscope === true) {
                                    o = l.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                                } else {
                                    o = l.join("");
                                }
                                return o;
                            }
                            return "";
                        },
                        comtest = function jspretty__tokenize_commentTester() {
                            var z = 0;
                            for (z = a - 1; z > -1; z -= 1) {
                                if (!(/\s/).test(c[z])) {
                                    return "comment-inline";
                                }
                                if (c[z] === "\n" || c[z] === "\r") {
                                    return "comment";
                                }
                            }
                            return "comment";
                        },
                        operator = function jspretty__tokenize_operator() {
                            var e = [
                                    "=", "<", ">", "+", "*", "?", "|", "^", ":", "&"
                                ],
                                f = [c[a]],
                                g = 0,
                                h = 0,
                                i = e.length,
                                j = b,
                                k = "";
                            if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === token.length - 1) {
                                lines.pop();
                            }
                            if (a < b - 1) {
                                if (c[a] === "!" && c[a + 1] === "/") {
                                    return "!";
                                }
                                if (c[a] === ":" && c[a + 1] !== ":") {
                                    return ":";
                                }
                                if (c[a] === "-") {
                                    if (c[a + 1] === "-") {
                                        a += 1;
                                        return "--";
                                    }
                                    if (c[a + 1] === "=") {
                                        a += 1;
                                        return "-=";
                                    }
                                    return "-";
                                }
                            }
                            for (g = a + 1; g < j; g += 1) {
                                for (h = 0; h < i; h += 1) {
                                    if (c[g] === e[h]) {
                                        f.push(e[h]);
                                        break;
                                    }
                                }
                                if (h === i) {
                                    break;
                                }
                            }
                            a = a + (f.length - 1);
                            if (jsscope === true) {
                                k = f.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            } else {
                                k = f.join("");
                            }
                            return k;
                        },
                        regex = function jspretty__tokenize_regex() {
                            var e = 0,
                                f = b,
                                g = ["/"],
                                h = 0,
                                i = 0,
                                j = "";
                            for (e = a + 1; e < f; e += 1) {
                                g.push(c[e]);
                                if (c[e] === "/") {
                                    if (c[e - 1] === "\\") {
                                        i = 0;
                                        for (h = e - 1; h > 0; h -= 1) {
                                            if (c[h] === "\\") {
                                                i += 1;
                                            } else {
                                                break;
                                            }
                                        }
                                        if (i % 2 === 0) {
                                            break;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                            if (c[e + 1] === "g" || c[e + 1] === "i" || c[e + 1] === "m" || c[e + 1] === "y") {
                                g.push(c[e + 1]);
                                if (c[e + 2] !== c[e + 1] && (c[e + 2] === "g" || c[e + 2] === "i" || c[e + 2] === "m" || c[e + 2] === "y")) {
                                    g.push(c[e + 2]);
                                    if (c[e + 3] !== c[e + 1] && c[e + 3] !== c[e + 2] && (c[e + 3] === "g" || c[e + 3] === "i" || c[e + 3] === "m" || c[e + 3] === "y")) {
                                        g.push(c[e + 3]);
                                        if (c[e + 4] !== c[e + 1] && c[e + 4] !== c[e + 2] && c[e + 4] !== c[e + 3] && (c[e + 4] === "g" || c[e + 4] === "i" || c[e + 4] === "m" || c[e + 4] === "y")) {
                                            g.push(c[e + 4]);
                                            a = e + 4;
                                        } else {
                                            a = e + 3;
                                        }
                                    } else {
                                        a = e + 2;
                                    }
                                } else {
                                    a = e + 1;
                                }
                            } else {
                                a = e;
                            }
                            if (jsscope === true) {
                                j = g.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            } else {
                                j = g.join("");
                            }
                            return j;
                        },
                        numb = function jspretty__tokenize_number() {
                            var e = 0,
                                f = b,
                                g = [c[a]],
                                h = (g[0] === ".") ? true : false;
                            if (a < b - 2 && c[a + 1] === "x" && (/[0-9A-Fa-f]/).test(c[a + 2])) {
                                g.push("x");
                                for (e = a + 2; e < f; e += 1) {
                                    if ((/[0-9A-Fa-f]/).test(c[e])) {
                                        g.push(c[e]);
                                    } else {
                                        break;
                                    }
                                }
                            } else {
                                for (e = a + 1; e < f; e += 1) {
                                    if ((/[0-9]/).test(c[e]) || (c[e] === "." && h === false)) {
                                        g.push(c[e]);
                                        if (c[e] === ".") {
                                            h = true;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                            if (e < f - 1 && (c[e] === "e" || c[e] === "E")) {
                                g.push(c[e]);
                                if (c[e + 1] === "-") {
                                    g.push("-");
                                    e += 1;
                                }
                                h = false;
                                for (e += 1; e < f; e += 1) {
                                    if ((/[0-9]/).test(c[e]) || (c[e] === "." && h === false)) {
                                        g.push(c[e]);
                                        if (c[e] === ".") {
                                            h = true;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                            a = e - 1;
                            return g.join("");
                        },
                        space = function jspretty__tokenize_space() {
                            var e = [],
                                f = 0,
                                g = b,
                                h = false;
                            for (f = a; f < g; f += 1) {
                                if (c[f] === "\n") {
                                    w[0] += 1;
                                } else if (c[f] === " ") {
                                    w[1] += 1;
                                } else if (c[f] === "\t") {
                                    w[2] += 1;
                                } else if ((/\s/).test(c[f])) {
                                    w[3] += 1;
                                } else {
                                    break;
                                }
                                e.push(c[f]);
                            }
                            a = f - 1;
                            if (token.length === 0) {
                                return;
                            }
                            g = e.join("");
                            if (jpres && g.indexOf("\n") > -1) {
                                if ((g.indexOf("\n") !== g.lastIndexOf("\n")) || token[token.length - 1].indexOf("//") === 0) {
                                    h = true;
                                }
                                lines.push([
                                    token.length - 1, h
                                ]);
                            }
                        },
                        word = function jspretty__tokenize_word() {
                            var e = [],
                                f = a,
                                g = b,
                                h = "";
                            do {
                                e.push(c[f]);
                                f += 1;
                            } while (f < g && !((/\s/).test(c[f]) || c[f] === ";" || c[f] === "=" || c[f] === "." || c[f] === "," || c[f] === "&" || c[f] === "<" || c[f] === ">" || c[f] === "+" || c[f] === "-" || c[f] === "*" || c[f] === "/" || c[f] === "!" || c[f] === "?" || c[f] === "|" || c[f] === "^" || c[f] === ":" || c[f] === "\"" || c[f] === "'" || c[f] === "\\" || c[f] === "/" || c[f] === "(" || c[f] === ")" || c[f] === "{" || c[f] === "}" || c[f] === "[" || c[f] === "]" || c[f] === "%"));
                            h = e.join("");
                            if (types.length > 1 && h === "function" && types[types.length - 1] === "method" && token[token.length - 2] === "{") {
                                types[types.length - 1] = "start";
                            }
                            a = f - 1;
                            if (types.length > 2 && h === "function" && u === "method" && token[token.length - 2] === "}") {
                                types[types.length - 1] = "start";
                            }
                            return h;
                        };
                    for (a = 0; a < b; a += 1) {
                        if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                            t = d("/*", 2, "*\/");
                            u = "comment";
                            k[0] += 1;
                            k[1] += t.length;
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                            u = comtest();
                            types.push(u);
                            t = d("//", 2, "\r");
                            j[0] += 1;
                            j[1] += t.length;
                            token.push(t);
                        } else if (c[a] === "/" && (types.length > 0 && u !== "word" && u !== "literal" && u !== "end")) {
                            t = regex();
                            u = "regex";
                            p[0] += 1;
                            p[1] += t.length;
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "\"") {
                            t = d("\"", 1, "\"");
                            u = "literal";
                            l[0] += 1;
                            l[1] += t.length - 2;
                            l[2] += 2;
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "'") {
                            t = d("'", 1, "'");
                            u = "literal";
                            l[0] += 1;
                            l[1] += t.length - 2;
                            l[2] += 2;
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (u === "literal" || u === "word") && t !== "return" && (t === ")" || t === "]" || u === "word" || u === "literal")) {
                            n[0] += 1;
                            n[1] += 1;
                            t = "-";
                            u = "operator";
                            token.push(t);
                            types.push(u);
                        } else if ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1]))) {
                            if (u === "end") {
                                t = "-";
                                u = "operator";
                            } else {
                                t = numb();
                                u = "literal";
                            }
                            q[0] += 1;
                            q[1] += t.length;
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === ",") {
                            n[2] += 1;
                            t = ",";
                            u = "separator";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === ".") {
                            n[0] += 1;
                            n[1] += 1;
                            if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === token.length - 1) {
                                lines.pop();
                            }
                            t = ".";
                            u = "separator";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === ";") {
                            n[3] += 1;
                            t = ";";
                            u = "separator";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "(") {
                            n[4] += 1;
                            if (token.length > 2 && token[token.length - 2] === "function") {
                                u = "method";
                            } else if (types.length === 0 || t === "return" || t === "function" || t === "for" || t === "if" || t === "while" || t === "switch" || u === "separator" || u === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
                                u = "start";
                            } else {
                                u = "method";
                            }
                            t = "(";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "[") {
                            n[4] += 1;
                            t = "[";
                            u = "start";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "{") {
                            n[4] += 1;
                            t = "{";
                            u = "start";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === ")") {
                            n[4] += 1;
                            t = ")";
                            u = "end";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "]") {
                            n[4] += 1;
                            t = "]";
                            u = "end";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "}") {
                            n[4] += 1;
                            t = "}";
                            u = "end";
                            token.push(t);
                            types.push(u);
                        } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%") {
                            t = operator();
                            u = "operator";
                            n[0] += 1;
                            n[1] += t.length;
                            token.push(t);
                            types.push(u);
                        } else if ((/\s/).test(c[a])) {
                            space();
                        } else {
                            t = word();
                            u = "word";
                            token.push(t);
                            types.push(u);
                            if (t === "alert") {
                                m[0] += 1;
                            } else if (t === "break") {
                                m[2] += 1;
                            } else if (t === "case") {
                                m[4] += 1;
                            } else if (t === "catch") {
                                m[48] += 1;
                            } else if (t === "console") {
                                m[54] += 1;
                            } else if (t === "continue") {
                                m[6] += 1;
                            } else if (t === "default") {
                                m[8] += 1;
                            } else if (t === "delete") {
                                m[10] += 1;
                            } else if (t === "do") {
                                m[12] += 1;
                            } else if (t === "document") {
                                m[44] += 1;
                            } else if (t === "else") {
                                m[14] += 1;
                            } else if (t === "eval") {
                                m[16] += 1;
                            } else if (t === "for") {
                                m[18] += 1;
                            } else if (t === "function") {
                                m[20] += 1;
                            } else if (t === "if") {
                                m[22] += 1;
                            } else if (t === "in") {
                                m[24] += 1;
                            } else if (t === "label") {
                                m[26] += 1;
                            } else if (t === "new") {
                                m[28] += 1;
                            } else if (t === "return") {
                                m[30] += 1;
                            } else if (t === "switch") {
                                m[32] += 1;
                            } else if (t === "this") {
                                m[34] += 1;
                            } else if (t === "throw") {
                                m[50] += 1;
                            } else if (t === "try") {
                                m[52] += 1;
                            } else if (t === "typeof") {
                                m[36] += 1;
                            } else if (t === "var") {
                                m[38] += 1;
                            } else if (t === "while") {
                                m[40] += 1;
                            } else if (t === "with") {
                                m[42] += 1;
                            } else if (t === "window") {
                                m[46] += 1;
                            } else {
                                o[0] += 1;
                                o[1] += t.length;
                            }
                        }
                    }
                    lines.push([
                        token.length, false
                    ]);
                }());
                //this function is the pretty-print algorithm
                (function jspretty__algorithm() {
                    var a = 0,
                        b = token.length,
                        l = 0,
                        indent = jlevel,
                        obj = [],
                        list = [],
                        listtest = [],
                        lastlist = false,
                        ternary = false,
                        question = false,
                        varline = [],
                        casetest = [],
                        fortest = 0,
                        ctype = "",
                        ctoke = "",
                        ltype = types[0],
                        ltoke = token[0],
                        separator = function jspretty__algorithm_separator() {
                            if (types[a - 1] === "comment-inline" && a > 1) {
                                return (function jspretty__algorithm_commentfix() {
                                    var c = 0,
                                        d = b,
                                        e = token[a - 1];
                                    level[a - 2] = "x";
                                    level[a - 1] = "x";
                                    for (c = a; c < d; c += 1) {
                                        token[c - 1] = token[c];
                                        types[c - 1] = types[c];
                                        if (token[c] === ";" || token[c] === "{" || c === lines[l][0]) {
                                            token[c] = e;
                                            types[c] = "comment-inline";
                                            a -= 1;
                                            return;
                                        }
                                    }
                                    token[c - 1] = e;
                                    types[c - 1] = "comment-inline";
                                    a -= 1;
                                }());
                            }
                            if (ctoke === ".") {
                                level[a - 1] = "x";
                                return level.push("x");
                            }
                            if (ctoke === ",") {
                                level[a - 1] = "x";
                                if (listtest[listtest.length - 1] === false) {
                                    listtest[listtest.length - 1] = true;
                                    (function jspretty__algorithm_separator_listTest() {
                                        var c = 0,
                                            d = 0,
                                            e = false,
                                            f = false,
                                            g = false;
                                        for (c = a - 1; c > -1; c -= 1) {
                                            if (types[c] === "end") {
                                                d += 1;
                                            }
                                            if (types[c] === "start" || types[c] === "method") {
                                                d -= 1;
                                                if (token[c] === "[" && d === -1) {
                                                    obj[obj.length - 1] = false;
                                                }
                                            }
                                            if (d === 0) {
                                                if (g === false && token[c] === "return") {
                                                    list[list.length - 1] = true;
                                                    return;
                                                }
                                                if (e === false && (token[c] === "=" || token[c] === ";")) {
                                                    e = true;
                                                }
                                                if (f === false && (token[c] === "&&" || token[c] === "||")) {
                                                    f = true;
                                                }
                                                if (g === false && token[c] === ";") {
                                                    g = true;
                                                }
                                            }
                                            if (d === -1) {
                                                if (token[c] === "{") {
                                                    if (token[c - 1] !== ")") {
                                                        obj[obj.length - 1] = true;
                                                    } else if (f === false && g === false) {
                                                        for (c = c - 1; c > -1; c -= 1) {
                                                            if (types[c] === "end") {
                                                                d += 1;
                                                            }
                                                            if (types[c] === "start" || types[c] === "method") {
                                                                d -= 1;
                                                            }
                                                            if (d === -1 && token[c] === "(") {
                                                                if (token[c - 1] === "function" || token[c - 2] === "function" || token[c - 1] === "if" || token[c - 1] === "for") {
                                                                    return;
                                                                }
                                                                break;
                                                            }
                                                        }
                                                    }
                                                } else if (f === false && g === false && token[c] === "(" && token[c - 1] === "for") {
                                                    list[list.length - 1] = true;
                                                }
                                                if (f === false && g === false && varline[varline.length - 1] === false && (e === false || token[c] === "(")) {
                                                    list[list.length - 1] = true;
                                                }
                                                return;
                                            }
                                        }
                                    }());
                                }
                                if (obj[obj.length - 1] === true) {
                                    return level.push(indent);
                                }
                                if (list[list.length - 1] === true) {
                                    return (function jspretty__algorithm_separator_inList() {
                                        var c = 0,
                                            d = 0;
                                        for (c = a - 1; c > -1; c -= 1) {
                                            if (types[c] === "end") {
                                                d += 1;
                                            }
                                            if (types[c] === "start" || types[c] === "method") {
                                                d -= 1;
                                            }
                                            if (d === -1) {
                                                if (token[c] === "[" && token[c + 1] !== "]" && token[c + 2] !== "]") {
                                                    level[c] = indent;
                                                }
                                                return level.push("s");
                                            }
                                        }
                                        return level.push("s");
                                    }());
                                }
                                if (varline[varline.length - 1] === true && fortest === 0) {
                                    if (ltype !== "]") {
                                        (function jspretty__algorithm_separator_varline() {
                                            var c = 0,
                                                d = false;
                                            for (c = a - 1; c > -1; c -= 1) {
                                                if (token[c] === "]") {
                                                    d = true;
                                                }
                                                if (types[c] === "method" || types[c] === "start") {
                                                    if (token[c] === "[" && token[c + 1] !== "]" && d === false) {
                                                        level[c] = indent;
                                                    }
                                                    return;
                                                }
                                            }
                                        }());
                                    }
                                    return level.push(indent);
                                }
                                return level.push(indent);
                            }
                            if (ctoke === ";") {
                                question = false;
                                level[a - 1] = "x";
                                if (fortest === 0) {
                                    if (varline[varline.length - 1] === true) {
                                        varline[varline.length - 1] = false;
                                        indent -= 1;
                                    }
                                    return level.push(indent);
                                }
                                if (fortest > 0) {
                                    return level.push("s");
                                }
                                return level.push("s");
                            }
                        },
                        start = function jspretty__algorithm_start() {
                            varline.push(false);
                            list.push(false);
                            listtest.push(false);
                            if (ctoke !== "(") {
                                indent += 1;
                            }
                            if (ltoke === "for") {
                                fortest = 1;
                            }
                            if (ctoke === "{") {
                                ternary = false;
                                casetest.push(false);
                                if (ltoke === "=" || ltoke === ":" || ltoke === "return") {
                                    obj.push(true);
                                } else {
                                    obj.push(false);
                                }
                                if (jbrace && ltype !== "operator" && ltoke !== "return") {
                                    level[a - 1] = indent - 1;
                                } else if (ltoke === ")") {
                                    level[a - 1] = "s";
                                } else if (ltoke === "{" || ltoke === "[" || ltoke === "}") {
                                    level[a - 1] = indent - 1;
                                }
                                if (jsscope === true) {
                                    meta.push("");
                                }
                                return level.push(indent);
                            }
                            obj.push(false);
                            if (ctoke === "(") {
                                if (jsscope === true) {
                                    if (ltoke === "function" || (a < 1 && token[a - 2] === "function")) {
                                        meta.push(0);
                                    } else {
                                        meta.push("");
                                    }
                                }
                                if (fortest > 0 && ltoke !== "for") {
                                    fortest += 1;
                                }
                                if (ltoke === "}") {
                                    level[a - 1] = indent;
                                    return level.push("x");
                                }
                                if ((ltoke === "-" && (a < 2 || (token[a - 2] !== ")" && token[a - 2] !== "]" && types[a - 2] !== "word" && types[a - 2] !== "literal"))) || (jspace === false && ltoke === "function")) {
                                    level[a - 1] = "x";
                                }
                                return level.push("x");
                            }
                            if (ctoke === "[") {
                                if (jsscope === true) {
                                    meta.push("");
                                }
                                if (ltoke === "[") {
                                    list[list.length - 2] = true;
                                }
                                if (ltoke === "return") {
                                    level[a - 1] = "s";
                                } else if (ltoke === "]" || ltype === "word" || ltoke === ")") {
                                    level[a - 1] = "x";
                                } else if (ltoke === "[" || ltoke === "{") {
                                    level[a - 1] = indent - 1;
                                }
                                return (function jspretty__algorithm_start_squareBrace() {
                                    var c = 0;
                                    for (c = a + 1; c < b; c += 1) {
                                        if (token[c] === "]") {
                                            return level.push("x");
                                        }
                                        if (token[c] === ",") {
                                            return level.push(indent);
                                        }
                                    }
                                    return level.push("x");
                                }());
                            }
                            if (jsscope === true && meta[a] === undefined) {
                                meta.push("");
                            }
                            return level.push("x");
                        },
                        end = function jspretty__algorithm_end() {
                            if (ctoke === "}" && ltype === "end" && varline[varline.length - 1] === true) {
                                ltoke = ";";
                                ltype = "separator";
                                indent -= 1;
                                level[a - 1] = indent - 1;
                                varline[varline.length - 1] = false;
                            } else if ((a - 1 === lines[l][0] || (ctoke === "}" && casetest.length > 1 && obj.length > 1 && casetest[casetest.length - 2] === true && obj[obj.length - 1] === false && obj[obj.length - 2] === false)) && ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start" && ltoke !== "}") {
                                if (varline[varline.length - 1] === true) {
                                    varline[varline.length - 1] = false;
                                    indent -= 1;
                                }
                                if (ltoke === "}" || ltoke === "]") {
                                    level[a - 1] = indent - 1;
                                } else {
                                    level[a - 1] = indent;
                                }
                                if (a - 1 === lines[l][0]) {
                                    l += 1;
                                }
                                ltoke = ";";
                                ltype = "separator";
                            } else if (ctoke === "}" && a > 1) {
                                if (varline[varline.length - 1] === true && ((token[a - 2] === "," && ltype === "word") || (token[a - 2] === "=" && (ltype === "literal" || ltype === "word")))) {
                                    ltoke = ";";
                                    ltype = "separator";
                                    varline[varline.length - 1] = false;
                                    indent -= 1;
                                    level[a - 1] = indent - 1;
                                } else if ((token[a - 2] === ";" || types[a - 2] === "end" || types[a - 2] === "operator") && (ltype === "word" || ltype === "literal")) {
                                    ltoke = ";";
                                    ltype = "separator";
                                    level[a - 1] = indent - 1;
                                }
                            }
                            if (ctoke !== ")") {
                                indent -= 1;
                            } else if (fortest > 0 && ctoke === ")") {
                                fortest -= 1;
                            }
                            if (ctoke === "}") {
                                if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || ltoke === "break" || ltoke === "return")) {
                                    (function jspretty__algorithm_end_curlyBrace() {
                                        var c = 0,
                                            d = 1,
                                            e = false,
                                            f = list.length;
                                        for (c = a - 1; c > -1; c -= 1) {
                                            if (types[c] === "end") {
                                                d += 1;
                                            }
                                            if (types[c] === "start" || types[c] === "method") {
                                                d -= 1;
                                            }
                                            if (d === 1) {
                                                if (token[c] === "=" || token[c] === ";") {
                                                    e = true;
                                                }
                                                if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "{" || token[c - 1] === "}" || token[c - 1] === ";")) {
                                                    indent -= 1;
                                                    level[a - 1] = indent;
                                                    return;
                                                }
                                                if ((token[c] === ":" && ternary === false) || (token[c] === "," && e === false && varline[varline.length - 1] === false)) {
                                                    return;
                                                }
                                                if ((c === 0 || token[c - 1] === "{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var") {
                                                    if (list[f - 1] === false && f > 1 && (a === b - 1 || token[a + 1] !== ")")) {
                                                        indent -= 1;
                                                    }
                                                    if (varline[varline.length - 1] === true) {
                                                        indent -= 1;
                                                    }
                                                    return;
                                                }
                                            }
                                        }
                                    }());
                                }
                                if (jsscope === true) {
                                    (function jspretty__algorithm_end_jsscope() {
                                        var c = 0,
                                            d = 1,
                                            e = [],
                                            f = false;
                                        for (c = a - 1; c > -1; c -= 1) {
                                            if (types[c] === "end") {
                                                d += 1;
                                            } else if (types[c] === "start" || types[c] === "method") {
                                                d -= 1;
                                            }
                                            if (d < 0) {
                                                return;
                                            }
                                            if (d === 1) {
                                                if (meta[c] === "v") {
                                                    e.push(token[c]);
                                                } else if (token[c] === ")") {
                                                    f = true;
                                                } else if (f === true && types[c] === "word") {
                                                    meta[c] = "v";
                                                    e.push(token[c]);
                                                }
                                            }
                                            if (c > 0 && token[c - 1] === "function" && types[c] === "word") {
                                                e.push(token[c]);
                                            }
                                            if (d === 0) {
                                                if (types[c] === "separator" || types[c] === "operator" || types[c] === "literal" || token[c] === "if" || token[c] === "else" || token[c] === "for" || token[c] === "switch" || token[c] === "do" || token[c] === "return" || token[c] === "while" || token[c] === "catch" || token[c] === "try") {
                                                    return;
                                                }
                                                if (token[c] === "function") {
                                                    if (types[c + 1] === "word") {
                                                        meta[c + 2] = a;
                                                    } else {
                                                        meta[c + 1] = a;
                                                    }
                                                    meta.push(e);
                                                    return;
                                                }
                                            }
                                        }
                                    }());
                                }
                                casetest.pop();
                            }
                            if ((types[a - 1] === "comment" && token[a - 1].substr(0, 2) === "//") || types[a - 1] === "comment-inline") {
                                level[a - 1] = indent;
                                level.push("x");
                            } else if ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]")) {
                                level[a - 1] = "x";
                                level.push("x");
                            } else if (ctoke === "]") {
                                if (list[list.length - 1] === true || (ltoke === "]" && level[a - 2] === indent + 1)) {
                                    level[a - 1] = indent;
                                } else if (level[a - 1] === "s") {
                                    level[a - 1] = "x";
                                }
                                if (list[list.length - 1] === false) {
                                    if (ltoke === "}") {
                                        level[a - 1] = indent;
                                    }
                                    (function jspretty__algorithm_end_squareBrace() {
                                        var c = 0,
                                            d = 1;
                                        for (c = a - 1; c > -1; c -= 1) {
                                            if (token[c] === "]") {
                                                d += 1;
                                            }
                                            if (token[c] === "[") {
                                                d -= 1;
                                                if (d === 0) {
                                                    if (c > 0 && (token[c + 1] === "{" || token[c + 1] === "[")) {
                                                        level[c] = indent + 1;
                                                        return;
                                                    }
                                                    if (token[c + 1] !== "[" || lastlist === false) {
                                                        level[c] = "x";
                                                        return;
                                                    }
                                                    return;
                                                }
                                            }
                                        }
                                    }());
                                }
                                level.push("x");
                            } else if (ctoke === ")") {
                                level[a - 1] = "x";
                                level.push("s");
                            } else if (ctoke === "}" && obj[obj.length - 1] === false && ltype === "word" && list[list.length - 1] === false && casetest[casetest.length - 1] === false) {
                                indent += 1;
                                level[a - 1] = indent;
                                level.push(indent);
                            } else if (ctoke === "}" || list[list.length - 1] === true) {
                                level[a - 1] = indent;
                                level.push("x");
                            } else {
                                level.push("x");
                            }
                            if (varline[varline.length - 1] === true) {
                                indent -= 1;
                            }
                            lastlist = list[list.length - 1];
                            list.pop();
                            listtest.pop();
                            varline.pop();
                            obj.pop();
                            if (ctoke === "}") {
                                ternary = false;
                            }
                            if (jsscope === true && meta[a] === undefined) {
                                meta.push("");
                            }
                        },
                        operator = function jspretty__algorithm_operator() {
                            if (a - 1 === lines[l][0] && ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start") {
                                ltoke = ";";
                                ltype = "separator";
                                if (varline[varline.length - 1] === true) {
                                    varline[varline.length - 1] = false;
                                    indent -= 1;
                                }
                                level[a - 1] = indent;
                                l += 1;
                            }
                            if (ctoke === "!") {
                                if (ltoke === "(") {
                                    level[a - 1] = "x";
                                }
                                if (ltoke === "}") {
                                    level[a - 1] = indent;
                                }
                                return level.push("x");
                            }
                            if (ctoke === "?") {
                                question = true;
                            }
                            if (ctoke === ":") {
                                return (function jspretty__algorithm_operator_colon() {
                                    var c = 0,
                                        d = 0;
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if (types[c] === "end") {
                                            d += 1;
                                        }
                                        if (types[c] === "start" || types[c] === "method") {
                                            d -= 1;
                                        }
                                        if (d === 0) {
                                            if ((token[c] === "case" || token[c] === "default") && casetest[casetest.length - 1] === true && question === false) {
                                                if (a < b - 1 && token[a + 1] !== "case" && token[a + 1] !== "default") {
                                                    indent += 1;
                                                }
                                                level[a - 1] = "x";
                                                return level.push(indent);
                                            }
                                            if (token[c] === "?") {
                                                ternary = true;
                                                level[a - 1] = "s";
                                                return level.push("s");
                                            }
                                            if ((c > 0 && types[c - 1] === "start") || token[c] === ";" || (l > 0 && token[c] !== "+" && token[c] !== "-" && token[c] !== "*" && token[c] !== "/" && c === lines[l - 1][0])) {
                                                obj[obj.length - 1] = true;
                                                level[a - 1] = "x";
                                                return level.push("s");
                                            }
                                        }
                                    }
                                }());
                            }
                            if (ctoke === "++" || ctoke === "--") {
                                if (ltype === "literal" || ltype === "word") {
                                    level[a - 1] = "x";
                                    level.push("s");
                                } else if (a < b - 1 && (types[a + 1] === "literal" || types[a + 1] === "word")) {
                                    level.push("x");
                                } else {
                                    level.push("s");
                                }
                                return;
                            }
                            level[a - 1] = "s";
                            if (ctoke === "-" && ltoke === "return") {
                                return level.push("x");
                            }
                            level.push("s");
                        },
                        word = function jspretty__algorithm_word() {
                            if (a - 1 !== lines[l][0] && ltoke === "}" && varline.length > 1 && varline[varline.length - 1] === true && ctoke !== "else" && ctoke !== "while" && ctoke !== "catch") {
                                ltoke = ";";
                                ltype = "separator";
                                indent -= 1;
                                level[a - 1] = indent;
                                varline[varline.length - 1] = false;
                            } else if (a - 1 === lines[l][0] && ((varline[varline.length - 1] === true && ltoke === "}") || (ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start" && ltoke !== "}"))) {
                                ltoke = ";";
                                ltype = "separator";
                                if (ltoke !== "}") {
                                    l += 1;
                                }
                                if (varline[varline.length - 1] === true) {
                                    varline[varline.length - 1] = false;
                                    indent -= 1;
                                }
                                level[a - 1] = indent;
                            }
                            if (jsscope === true) {
                                if (ltoke === "function" || (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var"))) {
                                    meta.push("v");
                                } else {
                                    meta.push("");
                                }
                            }
                            if (ltoke === "}") {
                                level[a - 1] = indent;
                            }
                            if (ctoke === "function" && jspace === false && a < b - 1 && token[a + 1] === "(") {
                                return level.push("x");
                            }
                            if (ctoke === "return") {
                                listtest[listtest.length - 1] = false;
                            }
                            if (ltoke === "-" && a > 1) {
                                if (types[a - 2] === "operator" || token[a - 2] === ",") {
                                    level[a - 1] = "x";
                                } else if (types[a - 2] === "start" || types[a - 2] === "method") {
                                    level[a - 2] = "x";
                                    level[a - 1] = "x";
                                }
                            } else if (ctoke === "while" && ltoke === "}") {
                                (function jspretty__algorithm_word_curlyBrace() {
                                    var c = 0,
                                        d = 0;
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if (token[c] === "}") {
                                            d += 1;
                                        }
                                        if (token[c] === "{") {
                                            d -= 1;
                                        }
                                        if (d === 0) {
                                            if (token[c - 1] === "do") {
                                                level[a - 1] = "s";
                                                return;
                                            }
                                            level[a - 1] = indent;
                                            return;
                                        }
                                    }
                                }());
                            } else if ((ctoke === "else" || ctoke === "catch") && ltoke === "}") {
                                level[a - 1] = "s";
                            } else if (ctoke === "var") {
                                if (ltype === "end") {
                                    level[a - 1] = indent;
                                }
                                if (indent === 0) {
                                    varline.push(true);
                                } else {
                                    varline[varline.length - 1] = true;
                                }
                                if (fortest === 0) {
                                    indent += 1;
                                }
                            } else if (ctoke === "switch") {
                                question = false;
                            } else if (ctoke === "default" || ctoke === "case") {
                                if (casetest[casetest.length - 1] === false) {
                                    if (ltoke === "{") {
                                        indent -= 1;
                                    }
                                    level[a - 1] = indent;
                                    casetest[casetest.length - 1] = true;
                                } else if ((ltoke === ":" && (types[a - 1] === "comment-inline" || types[a - 1] === "comment")) || ltoke !== ":") {
                                    indent -= 1;
                                    level[a - 1] = indent;
                                }
                            } else if ((ctoke === "break" || ctoke === "return") && casetest[casetest.length - 1] === true) {
                                level[a - 1] = indent;
                                (function jspretty__algorithm_word_break() {
                                    var c = 0;
                                    for (c = a + 1; c < b; c += 1) {
                                        if (token[c] === "}") {
                                            casetest[casetest.length - 1] = false;
                                            return;
                                        }
                                        if (token[c] === "{" || token[c] === "[") {
                                            return;
                                        }
                                        if (token[c] === "case" || token[c] === "default" || token[c] === "switch") {
                                            indent -= 1;
                                            casetest[casetest.length - 1] = false;
                                            return;
                                        }
                                    }
                                }());
                            }
                            level.push("s");
                        };
                    for (a = 0; a < b; a += 1) {
                        if (jsscope === true && types[a] !== "start" && types[a] !== "word" && types[a] !== "end") {
                            meta.push("");
                        }
                        ctype = types[a];
                        ctoke = token[a];
                        if (a - 1 > lines[l][0]) {
                            l += 1;
                        }
                        if (ctype === "comment") {
                            level[a - 1] = indent;
                            level.push(indent);
                        }
                        if (ctype === "comment-inline") {
                            if (a < b - 1 && token[a + 1] === "{") {
                                token[a + 1] = ctoke;
                                types[a + 1] = ctype;
                                token[a] = "{";
                                types[a] = "start";
                                a -= 1;
                            } else {
                                level[a - 1] = "s";
                                level.push(indent);
                            }
                        }
                        if (ctype === "regex") {
                            level.push("x");
                        }
                        if (ctype === "literal") {
                            level.push("s");
                        }
                        if (ctype === "separator") {
                            separator();
                        }
                        if (ctype === "method") {
                            level[a - 1] = "x";
                            level.push("x");
                            list.push(false);
                            listtest.push(false);
                            varline.push(false);
                            obj.push(false);
                            if (fortest > 0) {
                                fortest += 1;
                            }
                        }
                        if (ctype === "start") {
                            start();
                        }
                        if (ctype === "end") {
                            end();
                        }
                        if (ctype === "operator") {
                            operator();
                        }
                        if (ctype === "word") {
                            word();
                        }
                        if (ctype !== "comment" && ctype !== "comment-inline") {
                            ltype = ctype;
                            ltoke = ctoke;
                        }
                    }
                }());
                //the result function generates the output
                result = (function jspretty__result() {
                    var a = 0,
                        b = token.length,
                        c = [],
                        d = 0,
                        e = 2,
                        f = "",
                        g = 0,
                        h = 0,
                        scope = jsscope,
                        data = ["<div class='beautify'><ol class='count'><li>1</li>"],
                        blockline = function jspretty__result_blockline(x) {
                            var f = x.split("\n"),
                                h = 0,
                                i = f.length - 1;
                            data.push("<li>");
                            data.push(e);
                            data.push("</li>");
                            e += 1;
                            if (lines[d][0] === a && d === a && d > 0) {
                                data.push("<li>");
                                data.push(e);
                                data.push("</li>");
                                e += 1;
                            }
                            for (h = 0; h < i; h += 1) {
                                data.push("<li>");
                                data.push(e);
                                data.push("</li>");
                                e += 1;
                                f[h] = f[h] + "<em>&#10;</em></li><li class='c0'>";
                            }
                            return f.join("");
                        },
                        findvars = function jspretty__result_findvars(x) {
                            var c = meta[x],
                                d = meta[c],
                                e = 0,
                                f = 0,
                                h = d.length,
                                i = 1,
                                j = true;
                            if (h > 0) {
                                for (e = c - 1; e > a; e -= 1) {
                                    if (types[e] === "word") {
                                        for (f = 0; f < h; f += 1) {
                                            if (token[e] === d[f]) {
                                                token[e] = "<em class='s" + g + "'>" + token[e] + "</em>";
                                                break;
                                            }
                                        }
                                    }
                                    if (j === true) {
                                        if (types[e] === "end") {
                                            i += 1;
                                        } else if (types[e] === "start" || types[e] === "method") {
                                            i -= 1;
                                        }
                                        if (i === 0 && token[e] === "{") {
                                            token[e] = "<em class='s" + g + "'>{</em>";
                                            j = false;
                                        }
                                    }
                                }
                            } else {
                                for (e = a + 1; e < c; e += 1) {
                                    if (types[e] === "end") {
                                        i -= 1;
                                    } else if (types[e] === "start" || types[e] === "method") {
                                        i += 1;
                                    }
                                    if (i === 1 && token[e] === "{") {
                                        token[e] = "<em class='s" + g + "'>{</em>";
                                        return;
                                    }
                                }
                            }
                        },
                        indent = jlevel,
                        tab = (function jspretty__result_tab() {
                            var a = jchar,
                                b = jsize,
                                c = [];
                            for (b; b > 0; b -= 1) {
                                c.push(a);
                            }
                            return c.join("");
                        }()),
                        lscope = (scope === true) ? [
                            "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                        ] : [],
                        nl = function jspretty__result_nl(x) {
                            var c = (scope === true) ? ["<em>&#10;</em></li><li class='l" + g + "'>"] : ["\n"],
                                d = 0;
                            if (scope === true) {
                                data.push("<li>");
                                data.push(e);
                                data.push("</li>");
                                e += 1;
                                if (a < b - 1 && token[a + 1].indexOf("/*") === 0) {
                                    c[0] = "<em>&#10;</em></li><li class='c0'>";
                                } else if (x > 0) {
                                    if (x > 16) {
                                        d = 17;
                                    } else {
                                        d = g;
                                    }
                                    if (g === x + 1 && x > 0) {
                                        d -= 1;
                                    }
                                    c.push(lscope[d - 1]);
                                }
                            }
                            for (d; d < x; d += 1) {
                                c.push(tab);
                            }
                            f = c.join("");
                            return f;
                        };
                    if (scope === true) {
                        if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                            c.push("<ol class='data'><li class='c0'>");
                        } else {
                            c.push("<ol class='data'><li>");
                        }
                    }
                    for (a = 0; a < indent; a += 1) {
                        c.push(tab);
                    }
                    if (scope === true) {
                        g = 1;
                        for (a = b - 1; a > -1; a -= 1) {
                            if (typeof meta[a] === "number") {
                                g -= 1;
                                findvars(a);
                            } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                                token[a] = "<em class='s" + g + "'>" + token[a] + "</em>";
                                g += 1;
                            }
                        }
                        g = 0;
                    }
                    for (a = 0; a < b; a += 1) {
                        if (scope === true && types[a] === "comment" && token[a].indexOf("/*") === 0) {
                            c.push(blockline(token[a]));
                        } else if (scope === true) {
                            if (typeof meta[a] === "number") {
                                g += 1;
                                c.push(token[a]);
                            } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                                c.push(token[a]);
                                g -= 1;
                                h = c.length - 1;
                                do {
                                    h -= 1;
                                } while (c[h].indexOf("</li><li") < 0);
                                c[h] = c[h].replace(/class\='l\d+'/, "class='l" + g + "'");
                            } else {
                                c.push(token[a]);
                            }
                        } else {
                            c.push(token[a]);
                        }
                        if (jpres === true && a === lines[d][0] && level[a] !== "x" && level[a] !== "s") {
                            if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                    c.push(nl(indent));
                                    c.push(tab);
                                    level[a] = "x";
                                } else {
                                    indent = level[a];
                                    if (lines[d][1] === true) {
                                        c.push("\n");
                                    }
                                    c.push(nl(indent));
                                    c.push(tab);
                                    c.push(token[a + 1]);
                                    c.push(nl(indent));
                                    c.push(tab);
                                    level[a + 1] = "x";
                                    a += 1;
                                }
                            } else if (lines[d][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator"))) {
                                    if (scope === true) {
                                        c.push("<em>&#10;</em></li><li>");
                                    } else {
                                        c.push("\n");
                                    }
                                    if (level[a] === "x" && scope === false) {
                                        c.push("\n");
                                    }
                                }
                            }
                            d += 1;
                        }
                        if (a < b - 1 && types[a + 1] === "comment" && jcomment === true) {
                            c.push(nl(jlevel));
                        } else if (level[a] === "s") {
                            c.push(" ");
                        } else if (level[a] !== "x") {
                            indent = level[a];
                            c.push(nl(indent));
                        }
                    }
                    if (scope === true) {
                        f = c[c.length - 1];
                        if (f.indexOf("<li") > 0) {
                            c[c.length - 1] = "<em>&#10;</em></li>";
                        } else if (f.indexOf("</li>") < 0) {
                            c.push("<em>&#10;</em></li>");
                        }
                        c.push("</ol></div>");
                        f = c.join("");
                        g = f.match(/<li/g).length;
                        if (e - 1 > g) {
                            e -= 1;
                            do {
                                data.pop();
                                data.pop();
                                data.pop();
                                e -= 1;
                            } while (e > g);
                        }
                        data.push("</ol>");
                        summary = data.join("") + f;
                        data = [];
                        c = [];
                        return "";
                    }
                    return c.join("");
                }()).replace(/(\s+)$/, "");
                if (summary !== "diff" && jsscope === false) {
                    //the analysis report is generated in this function
                    (function jspretty__report() {
                        var a = 0,
                            b = 0,
                            e = 1,
                            f = 1,
                            g = 0,
                            h = 0,
                            i = 0,
                            r = 0,
                            s = [],
                            z = [],
                            output,
                            zero = function jspretty__report_zero(x, y) {
                                if (y === 0) {
                                    return "0.00%";
                                }
                                return ((x / y) * 100).toFixed(2) + "%";
                            },
                            drawRow = function jspretty__report_drawRow(w, x, y, z, Z) {
                                var a = ["<tr><th>Keyword '"];
                                a.push(w);
                                a.push("'</th><td ");
                                a.push(x);
                                a.push(">");
                                a.push(y);
                                a.push("</td><td>");
                                a.push(zero(y, m[54]));
                                a.push("</td><td>");
                                a.push(zero(y, Z[0]));
                                a.push("</td><td>");
                                a.push(z);
                                a.push("</td><td>");
                                a.push(zero(z, m[55]));
                                a.push("</td><td>");
                                a.push(zero(z, Z[1]));
                                a.push("</td></tr>");
                                return a.join("");
                            };
                        if (result.length <= source.length) {
                            b = source.length;
                        } else {
                            b = result.length;
                        }
                        for (a = 0; a < b; a += 1) {
                            if (args.source.charAt(a) === " ") {
                                g += 1;
                            } else if (args.source.charAt(a) === "\t") {
                                h += 1;
                            } else if (args.source.charAt(a) === "\n") {
                                e += 1;
                            } else if (args.source.charAt(a) === "\r" || args.source.charAt(a) === "\f" || args.source.charAt(a) === "\v") {
                                r += 1;
                            }
                            if (result.charAt(a) === "\n") {
                                f += 1;
                            }
                        }
                        if (m[0] > 0) {
                            s[0] = " class='bad'";
                        } else {
                            s[0] = "";
                        }
                        if (m[6] > 0) {
                            s[1] = " class='bad'";
                        } else {
                            s[1] = "";
                        }
                        if (m[16] > 0) {
                            s[2] = " class='bad'";
                        } else {
                            s[2] = "";
                        }
                        if (m[42] > 0) {
                            s[3] = " class='bad'";
                        } else {
                            s[3] = "";
                        }
                        if (m[54] > 0) {
                            s[4] = " class='bad'";
                        } else {
                            s[4] = "";
                        }
                        g = g - w[1];
                        h = h - w[2];
                        r = r - w[3];
                        i = ((e - 1 - w[0]) + g + h + r);
                        n.push(l[2] + n[0] + n[2] + n[3] + n[4]);
                        n.push(l[2] + n[1] + n[2] + n[3] + n[4]);
                        j.push(j[0] + k[0]);
                        j.push(j[1] + k[1]);
                        m[1] = m[0] * 5;
                        m[3] = m[2] * 5;
                        m[5] = m[4] * 4;
                        m[7] = m[6] * 8;
                        m[9] = m[8] * 7;
                        m[11] = m[10] * 6;
                        m[13] = m[12] * 2;
                        m[15] = m[14] * 4;
                        m[17] = m[16] * 4;
                        m[19] = m[18] * 3;
                        m[21] = m[20] * 8;
                        m[23] = m[22] * 2;
                        m[25] = m[24] * 2;
                        m[27] = m[26] * 5;
                        m[29] = m[28] * 3;
                        m[31] = m[30] * 6;
                        m[33] = m[32] * 6;
                        m[35] = m[34] * 4;
                        m[37] = m[36] * 6;
                        m[39] = m[38] * 3;
                        m[41] = m[40] * 5;
                        m[43] = m[42] * 4;
                        m[45] = m[44] * 8;
                        m[47] = m[46] * 6;
                        m[49] = m[48] * 5;
                        m[51] = m[50] * 5;
                        m[53] = m[52] * 3;
                        m[55] = m[54] * 7;
                        m[56] = m[0] + m[2] + m[4] + m[6] + m[8] + m[10] + m[12] + m[14] + m[16] + m[18] + m[20] + m[22] + m[24] + m[26] + m[28] + m[30] + m[32] + m[34] + m[36] + m[38] + m[40] + m[42] + m[44] + m[46] + m[48] + m[50] + m[52] + m[54];
                        m[57] = m[1] + m[3] + m[5] + m[7] + m[9] + m[11] + m[13] + m[15] + m[17] + m[19] + m[21] + m[23] + m[25] + m[27] + m[29] + m[31] + m[33] + m[35] + m[37] + m[39] + m[41] + m[43] + m[45] + m[47] + m[49] + m[51] + m[53] + m[55];
                        z.push(j[2] + l[0] + n[5] + m[56] + o[0] + p[0] + q[0] + i);
                        z.push(j[3] + l[1] + n[6] + m[57] + o[1] + p[1] + q[1] + i);
                        output = ["<div id='doc'>"];
                        output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>");
                        output.push("</thead><tbody><tr><th>Total Character Size</th><td>");
                        output.push(source.length);
                        output.push("</td><td>");
                        output.push(result.length);
                        output.push("</td><td>");
                        output.push(result.length - source.length);
                        output.push("</td><td>");
                        output.push((((result.length - source.length) / source.length) * 100).toFixed(2));
                        output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
                        output.push(e);
                        output.push("</td><td>");
                        output.push(f);
                        output.push("</td><td>");
                        output.push(f - e);
                        output.push("</td><td>");
                        output.push((((f - e) / e) * 100).toFixed(2));
                        output.push("%</td></tr></tbody></table>");
                        output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScript component analysis</caption><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percentage Quantity from Section</th>");
                        output.push("<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage Length from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
                        output.push("<tr><th>Total Accounted</th><td>");
                        output.push(z[0]);
                        output.push("</td><td>100.00%</td><td>100.00%</td><td>");
                        output.push(z[1]);
                        output.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></tr><tr><th>Block Comments</th><td>");
                        output.push(j[0]);
                        output.push("</td><td>");
                        output.push(zero(j[0], j[2]));
                        output.push("</td><td>");
                        output.push(zero(j[0], z[0]));
                        output.push("</td><td>");
                        output.push(j[1]);
                        output.push("</td><td>");
                        output.push(zero(j[1], j[3]));
                        output.push("</td><td>");
                        output.push(zero(j[1], z[1]));
                        output.push("</td></tr><tr><th>Inline Comments</th><td>");
                        output.push(k[0]);
                        output.push("</td><td>");
                        output.push(zero(k[0], j[2]));
                        output.push("</td><td>");
                        output.push(zero(k[0], z[0]));
                        output.push("</td><td>");
                        output.push(k[1]);
                        output.push("</td><td>");
                        output.push(zero(k[1], j[3]));
                        output.push("</td><td>");
                        output.push(zero(k[1], z[1]));
                        output.push("</td></tr><tr><th>Comment Total</th><td>");
                        output.push(j[2]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(j[2], z[0]));
                        output.push("</td><td>");
                        output.push(j[3]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(j[3], z[1]));
                        output.push("</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></tr><tr><th>New Lines</th><td>");
                        output.push(e - 1 - w[0]);
                        output.push("</td><td>");
                        output.push(zero(e - 1 - w[0], i));
                        output.push("</td><td>");
                        output.push(zero(e - 1 - w[0], z[0]));
                        output.push("</td><td>");
                        output.push(e - 1 - w[0]);
                        output.push("</td><td>");
                        output.push(zero(e - 1 - w[0], i));
                        output.push("</td><td>");
                        output.push(zero(e - 1 - w[0], z[1]));
                        output.push("</td></tr><tr><th>Spaces</th><td>");
                        output.push(g);
                        output.push("</td><td>");
                        output.push(zero(g, i));
                        output.push("</td><td>");
                        output.push(zero(g, z[0]));
                        output.push("</td><td>");
                        output.push(g);
                        output.push("</td><td>");
                        output.push(zero(g, i));
                        output.push("</td><td>");
                        output.push(zero(g, z[1]));
                        output.push("</td></tr><tr><th>Tabs</th><td>");
                        output.push(h);
                        output.push("</td><td>");
                        output.push(zero(h, i));
                        output.push("</td><td>");
                        output.push(zero(h, z[0]));
                        output.push("</td><td>");
                        output.push(h);
                        output.push("</td><td>");
                        output.push(zero(h, i));
                        output.push("</td><td>");
                        output.push(zero(h, z[1]));
                        output.push("</td></tr><tr><th>Other Whitespace</th><td>");
                        output.push(r);
                        output.push("</td><td>");
                        output.push(zero(r, i));
                        output.push("</td><td>");
                        output.push(zero(r, z[0]));
                        output.push("</td><td>");
                        output.push(r);
                        output.push("</td><td>");
                        output.push(zero(r, i));
                        output.push("</td><td>");
                        output.push(zero(r, z[1]));
                        output.push("</td></tr><tr><th>Total Whitespace</th><td>");
                        output.push(i);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(i, z[0]));
                        output.push("</td><td>");
                        output.push(i);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(i, z[1]));
                        output.push("</td></tr><tr><th colspan='7'>Literals</th></tr><tr><th>Strings</th><td>");
                        output.push(l[0]);
                        output.push("</td><td>");
                        output.push(zero(l[0], l[0] + p[0] + q[0]));
                        output.push("</td><td>");
                        output.push(zero(l[0], z[0]));
                        output.push("</td><td>");
                        output.push(l[1]);
                        output.push("</td><td>");
                        output.push(zero(l[1], l[1] + p[1] + q[1]));
                        output.push("</td><td>");
                        output.push(zero(l[1], z[1]));
                        output.push("</td></tr><tr><th>Numbers</th><td>");
                        output.push(q[0]);
                        output.push("</td><td>");
                        output.push(zero(q[0], l[0] + p[0] + q[0]));
                        output.push("</td><td>");
                        output.push(zero(q[0], z[0]));
                        output.push("</td><td>");
                        output.push(q[1]);
                        output.push("</td><td>");
                        output.push(zero(q[1], l[1] + p[1] + q[1]));
                        output.push("</td><td>");
                        output.push(zero(q[1], z[1]));
                        output.push("</td></tr><tr><th>Regular Expressions</th><td>");
                        output.push(p[0]);
                        output.push("</td><td>");
                        output.push(zero(p[0], l[0] + p[0] + q[0]));
                        output.push("</td><td>");
                        output.push(zero(p[0], z[0]));
                        output.push("</td><td>");
                        output.push(p[1]);
                        output.push("</td><td>");
                        output.push(zero(p[1], l[1] + p[1] + q[1]));
                        output.push("</td><td>");
                        output.push(zero(p[1], z[1]));
                        output.push("</td></tr><tr><th>Total Literals</th><td>");
                        output.push(l[0] + p[0] + q[0]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(l[0] + p[0] + q[0], z[0]));
                        output.push("</td><td>");
                        output.push(l[1] + p[1] + q[1]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(l[1] + p[1] + q[1], z[1]));
                        output.push("</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Characters</th><td>");
                        output.push(l[2]);
                        output.push("</td><td>");
                        output.push(zero(l[2], n[5]));
                        output.push("</td><td>");
                        output.push(zero(l[2], z[0]));
                        output.push("</td><td>");
                        output.push(l[2]);
                        output.push("</td><td>");
                        output.push(zero(l[2], n[6]));
                        output.push("</td><td>");
                        output.push(zero(l[2], z[1]));
                        output.push("</td></tr><tr><th>Commas</th><td>");
                        output.push(n[2]);
                        output.push("</td><td>");
                        output.push(zero(n[2], n[5]));
                        output.push("</td><td>");
                        output.push(zero(n[2], z[0]));
                        output.push("</td><td>");
                        output.push(n[2]);
                        output.push("</td><td>");
                        output.push(zero(n[2], n[6]));
                        output.push("</td><td>");
                        output.push(zero(n[2], z[1]));
                        output.push("</td></tr><tr><th>Containment Characters</th><td>");
                        output.push(n[4]);
                        output.push("</td><td>");
                        output.push(zero(n[4], n[5]));
                        output.push("</td><td>");
                        output.push(zero(n[4], z[0]));
                        output.push("</td><td>");
                        output.push(n[4]);
                        output.push("</td><td>");
                        output.push(zero(n[4], n[6]));
                        output.push("</td><td>");
                        output.push(zero(n[4], z[1]));
                        output.push("</td></tr><tr><th>Semicolons</th><td>");
                        output.push(n[3]);
                        output.push("</td><td>");
                        output.push(zero(n[3], n[5]));
                        output.push("</td><td>");
                        output.push(zero(n[3], z[0]));
                        output.push("</td><td>");
                        output.push(n[3]);
                        output.push("</td><td>");
                        output.push(zero(n[3], n[6]));
                        output.push("</td><td>");
                        output.push(zero(n[3], z[1]));
                        output.push("</td></tr><tr><th>Operators</th><td>");
                        output.push(n[0]);
                        output.push("</td><td>");
                        output.push(zero(n[0], n[5]));
                        output.push("</td><td>");
                        output.push(zero(n[0], z[0]));
                        output.push("</td><td>");
                        output.push(n[1]);
                        output.push("</td><td>");
                        output.push(zero(n[1], n[6]));
                        output.push("</td><td>");
                        output.push(zero(n[1], z[1]));
                        output.push("</td></tr><tr><th>Total Syntax Characters</th><td>");
                        output.push(n[5]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(n[5], z[0]));
                        output.push("</td><td>");
                        output.push(n[6]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(n[6], z[1]));
                        output.push("</td></tr>");
                        output.push("<tr><th colspan='7'>Keywords</th></tr>");
                        output.push(drawRow("alert", s[0], m[0], m[1], z));
                        output.push(drawRow("break", "", m[2], m[3], z));
                        output.push(drawRow("case", "", m[4], m[5], z));
                        output.push(drawRow("catch", "", m[48], m[49], z));
                        output.push(drawRow("console", s[4], m[54], m[55], z));
                        output.push(drawRow("continue", s[1], m[6], m[7], z));
                        output.push(drawRow("default", "", m[8], m[9], z));
                        output.push(drawRow("delete", "", m[10], m[11], z));
                        output.push(drawRow("do", "", m[12], m[13], z));
                        output.push(drawRow("document", "", m[44], m[45], z));
                        output.push(drawRow("else", "", m[14], m[15], z));
                        output.push(drawRow("eval", s[2], m[16], m[17], z));
                        output.push(drawRow("for", "", m[18], m[19], z));
                        output.push(drawRow("function", "", m[20], m[21], z));
                        output.push(drawRow("if", "", m[22], m[23], z));
                        output.push(drawRow("in", "", m[24], m[25], z));
                        output.push(drawRow("label", "", m[26], m[27], z));
                        output.push(drawRow("new", "", m[28], m[29], z));
                        output.push(drawRow("return", "", m[30], m[31], z));
                        output.push(drawRow("switch", "", m[32], m[33], z));
                        output.push(drawRow("this", "", m[34], m[35], z));
                        output.push(drawRow("throw", "", m[50], m[51], z));
                        output.push(drawRow("typeof", "", m[36], m[37], z));
                        output.push(drawRow("var", "", m[38], m[39], z));
                        output.push(drawRow("while", "", m[40], m[41], z));
                        output.push(drawRow("with", s[3], m[42], m[43], z));
                        output.push(drawRow("window", "", m[46], m[47], z));
                        output.push(drawRow("try", "", m[52], m[53], z));
                        output.push("<tr><th>Total Keywords</th><td>");
                        output.push(m[56]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(m[56], z[0]));
                        output.push("</td><td>");
                        output.push(m[57]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(m[57], z[1]));
                        output.push("</td></tr>");
                        output.push("<tr><th colspan='7'>Variables and Other Keywords</th></tr><tr><th>Variable Instances</th><td>");
                        output.push(o[0]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(o[0], z[0]));
                        output.push("</td><td>");
                        output.push(o[1]);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(o[1], z[1]));
                        output.push("</td></tr></tbody></table></div>");
                        summary = output.join("");
                    }());
                }
                token = [];
                types = [];
                level = [];
                lines = [];
                meta = [];
                return result;
            },
            markupmin = function markupmin(args) {
                var i = 0,
                    x = (typeof args.source === "string") ? args.source.split("") : "Error: no content supplied to markup.",
                    comments = (args.comments !== "comments" && args.comments !== "beautify" && args.comments !== "diff") ? "" : args.comments,
                    presume_html = (args.presume_html === true) ? true : false,
                    top_comments = (args.top_comments === true) ? true : false,
                    conditional = (args.conditional === true) ? true : false,
                    markupspace = function markupmin__markupspace() {
                        var a = 0,
                            c = [],
                            Y = x.length;
                        for (a = i; a < Y; a += 1) {
                            if (x[a] === ">") {
                                break;
                            } else {
                                c.push(x[a]);
                                x[a] = "";
                            }
                        }
                        i = a;
                        x[i] = c.join("").replace(/\s+/g, " ").replace(/\s*,\s+/g, ", ").replace(/\s*\/\s*/g, "/").replace(/\s*=\s*/g, "=").replace(/ \="/g, "=\"").replace(/ \='/g, "='") + ">";
                    },
                    markupcomment = function markupmin__markupcomment(end) {
                        var Y = x.length,
                            b = 0,
                            c = [];
                        for (b = i; b < Y; b += 1) {
                            if ((b < Y - 8 && x[b] + x[b + 1] + x[b + 2] + x[b + 3] + x[b + 4] + x[b + 5] + x[b + 6] + x[b + 7] + x[b + 8] + x[b + 9] + x[b + 10] + x[b + 11] === end) || (b < Y - 4 && x[b] + x[b + 1] + x[b + 2] + x[b + 3] === end) || (b < Y - 3 && x[b] + x[b + 1] + x[b + 2] === end)) {
                                x[b] = "";
                                x[b + 1] = "";
                                x[b + 2] = "";
                                if (end.length > 3) {
                                    x[b + 3] = "";
                                    if (end.length === 12) {
                                        x[b + 4] = "";
                                        x[b + 5] = "";
                                        x[b + 6] = "";
                                        x[b + 7] = "";
                                        x[b + 8] = "";
                                        x[b + 9] = "";
                                        x[b + 10] = "";
                                        x[b + 11] = "";
                                        i = b + 11;
                                    } else {
                                        i = b + 3;
                                    }
                                } else {
                                    i = b + 2;
                                }
                                break;
                            } else {
                                if ((conditional === true && end.length === 12) || comments === "beautify" || comments === "comments") {
                                    c.push(x[b]);
                                }
                                x[b] = "";
                            }
                        }
                        if ((conditional === true && end.length === 12) || comments === "comments" || comments === "beautify") {
                            x[i] = c.join("");
                            if (x[i].indexOf(end) !== x[i].length - end.length) {
                                x[i] = x[i] + end;
                            }
                        }
                    },
                    markupscript = function markupmin__markupscript(z) {
                        var c = 0,
                            e = [],
                            f = 0,
                            g = "",
                            h = "",
                            j = "</" + z,
                            m = "",
                            Y = x.length,
                            cdataStart = (/^(\s*\/+<!\[+[A-Z]+\[+)/),
                            cdataEnd = (/(\/+\]+>\s*)$/),
                            scriptStart = (/^(\s*<\!\-\-)/),
                            scriptEnd = (/(\/+\-\->\s*)$/),
                            cs = "",
                            ce = "",
                            y = args.source;
                        if (typeof jsmin !== "function") {
                            return;
                        }
                        for (c = i; c < Y; c += 1) {
                            if ((y.slice(c, c + j.length)).toLowerCase() === j) {
                                f = c;
                                break;
                            }
                        }
                        for (c = i; c < f; c += 1) {
                            if (x[c - 1] !== ">") {
                                e.push(x[c]);
                                x[c] = "";
                            } else {
                                break;
                            }
                        }
                        m = e[0];
                        e.splice(0, 1);
                        if ((/\s/).test(e[0])) {
                            e.splice(0, 1);
                        }
                        for (f; f < Y; f += 1) {
                            if (x[f] !== ">") {
                                h = h + x[f];
                                x[f] = "";
                            } else {
                                break;
                            }
                        }
                        h = h + ">";
                        i = f;
                        if (e.join("") === "") {
                            x[i] = m + h;
                            return;
                        }
                        g = e.join("");
                        if (comments !== "beautify") {
                            if (cdataStart.test(g)) {
                                cs = g.match(cdataStart)[0];
                                g = g.replace(cdataStart, "");
                            } else if (scriptStart.test(g)) {
                                cs = g.match(scriptStart)[0];
                                g = g.replace(scriptStart, "");
                            }
                            if (cdataEnd.test(g)) {
                                ce = g.match(cdataEnd)[0];
                                g = g.replace(cdataEnd, "");
                            } else if (scriptEnd.test(g)) {
                                ce = g.match(scriptEnd)[0];
                                g = g.replace(scriptEnd, "");
                            }
                            if (z === "style") {
                                g = cs + jsmin({
                                    source: g,
                                    level: 3,
                                    type: "css",
                                    alter: true,
                                    fcomment: top_comments
                                }) + ce;
                            } else {
                                g = cs + jsmin({
                                    source: g,
                                    level: 2,
                                    type: "javascript",
                                    alter: true,
                                    fcomment: top_comments
                                }) + ce;
                            }
                        }
                        Y = g.length;
                        for (c = 0; c < Y; c += 1) {
                            if ((/\s/).test(g.charAt(c))) {
                                g = g.substr(c + 1);
                            } else {
                                break;
                            }
                        }
                        x[i] = m + g + h;
                    },
                    preserve = function markupmin__preserve(end) {
                        var Y = x.length,
                            a = 0,
                            b = [],
                            c = 0;
                        for (c = i; c < Y; c += 1) {
                            if (end === "</script>" && c > 8 && (x[c - 8] + x[c - 7] + x[c - 6] + x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</script>") {
                                break;
                            } else if (end === "</pre>" && c > 5 && (x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</pre>") {
                                break;
                            } else if (x[c - 1] + x[c] === end) {
                                break;
                            }
                        }
                        for (a = i; a < c; a += 1) {
                            b.push(x[a]);
                            x[a] = "";
                        }
                        x[i] = b.join("");
                        i = c;
                    },
                    content = function markupmin__content() {
                        var Y = x.length,
                            a = 0,
                            b = [];
                        for (a = i; a < Y; a += 1) {
                            if (x[a] === "<") {
                                break;
                            } else {
                                b.push(x[a]);
                                x[a] = "";
                            }
                        }
                        i = a - 1;
                        x[i] = b.join("").replace(/\s+/g, " ");
                    };
                (function markupmin__algorithm() {
                    var a = [],
                        b = 0,
                        c = x.length,
                        d = "",
                        y = args.source;
                    for (i = 0; i < x.length; i += 1) {
                        if ((y.slice(i, i + 7)).toLowerCase() === "<script") {
                            a = [];
                            for (b = i + 8; b < c; b += 1) {
                                if (y.charAt(b) === ">") {
                                    break;
                                }
                                a.push(y.charAt(b));
                            }
                            d = a.join("").toLowerCase().replace(/'/g, "\"");
                            if (comments !== "beautify" && comments !== "diff") {
                                markupspace();
                            }
                            if (d.indexOf("type=\"syntaxhighlighter\"") > -1) {
                                preserve("</script>");
                            }
                            if (d.indexOf("type=\"") === -1 || d.indexOf("type=\"text/javascript\"") !== -1 || d.indexOf("type=\"application/javascript\"") !== -1 || d.indexOf("type=\"application/x-javascript\"") !== -1 || d.indexOf("type=\"text/ecmascript\"") !== -1 || d.indexOf("type=\"application/ecmascript\"") !== -1) {
                                markupscript("script");
                            }
                        } else if ((y.slice(i, i + 6)).toLowerCase() === "<style") {
                            a = [];
                            for (b = i + 7; b < c; b += 1) {
                                if (y.charAt(b) === ">") {
                                    break;
                                }
                                a.push(y.charAt(b));
                            }
                            d = a.join("").toLowerCase().replace(/'/g, "\"");
                            if (comments !== "beautify" && comments !== "diff") {
                                markupspace();
                            }
                            if (d.indexOf("type=\"") === -1 || d.indexOf("type=\"text/css\"") !== -1) {
                                markupscript("style");
                            }
                        } else if (conditional && y.slice(i, i + 8) === "<!--[if ") {
                            markupcomment("<![endif]-->");
                        } else if (y.slice(i, i + 4) === "<!--" && x[i + 4] !== "#") {
                            markupcomment("-->");
                        } else if (y.slice(i, i + 4) === "<%--") {
                            markupcomment("--%>");
                        } else if (y.slice(i, i + 5) === "<?php") {
                            preserve("?>");
                        } else if (y.slice(i, i + 4).toLowerCase() === "<pre" && presume_html === true) {
                            preserve("</pre>");
                        } else if (y.slice(i, i + 2) === "<%") {
                            preserve("%>");
                        } else if ((x[i] === "<" && x[i + 1] !== "!") || (x[i] === "<" && x[i + 1] === "!" && x[i + 2] !== "-")) {
                            markupspace();
                        } else if (x[i] === undefined) {
                            x[i] = "";
                        } else if (x[i - 1] !== undefined && x[i - 1].charAt(x[i - 1].length - 1) === ">") {
                            content();
                        }
                    }
                }());
                return (function markupmin__finalTouches() {
                    var a = 0,
                        b = [],
                        c = false,
                        d = 0,
                        f = 0,
                        g = "",
                        i = [],
                        Y = x.length,
                        html = [
                            "area", "base", "basefont", "br", "col", "embed", "eventsource", "frame", "hr", "img", "input", "keygen", "link", "meta", "param", "progress", "source", "wbr"
                        ],
                        e = html.length;
                    for (a = 0; a < Y; a += 1) {
                        if (x[a] !== "") {
                            i.push(x[a]);
                        }
                    }
                    x = [];
                    Y = i.length;
                    for (a = 0; a < Y; a += 1) {
                        c = (/^\s+$/).test(i[a]);
                        if (!c || (c && !(/^\s+$/).test(i[a + 1]))) {
                            x.push(i[a]);
                        }
                    }
                    Y = x.length;
                    for (a = 2; a < Y; a += 1) {
                        c = false;
                        if (presume_html === true) {
                            b = [];
                            f = x[a].length;
                            for (d = 1; d < f; d += 1) {
                                if (/[a-z]/i.test(x[a].charAt(d))) {
                                    b.push(x[a].charAt(d));
                                } else {
                                    break;
                                }
                            }
                            for (d = 0; d < e; d += 1) {
                                if (b.join("") === html[d] && x[a].charAt(0) === "<") {
                                    c = true;
                                    break;
                                }
                            }
                        }
                        if ((/^\s+$/).test(x[a - 1])) {
                            if (!c && (x[a].charAt(0) === "<" && x[a].charAt(1) === "/" && x[a - 1] !== " " && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/" && x[a - 3].charAt(0) !== "<") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/" && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/")) {
                                x[a - 1] = "";
                            }
                        }
                    }
                    g = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/<\s*/g, "<").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">").replace(/ <\!\-\-\[/g, "<!--[");
                    if ((/\s/).test(g.charAt(0))) {
                        g = g.slice(1, g.length);
                    }
                    return g;
                }());
            },
            markup_beauty = function markup_beauty(args) {
                var token = [],
                    build = [],
                    cinfo = [],
                    level = [],
                    inner = [],
                    sum = [],
                    x = (typeof args.source === "string") ? args.source : "",
                    msize = (isNaN(args.insize)) ? 4 : Number(args.insize),
                    mchar = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                    mmode = (typeof args.mode === "string" && args.mode === "diff") ? "diff" : "beautify",
                    mcomm = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : "indent",
                    mstyle = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
                    mhtml = (typeof args.html === "boolean") ? args.html : false,
                    mcont = (typeof args.content === "boolean") ? args.content : false,
                    mforce = (typeof args.force_indent === "boolean") ? args.force_indent : false,
                    mcond = (typeof args.conditional === "boolean") ? args.conditional : false,
                    mwrap = (isNaN(args.wrap)) ? 0 : Number(args.wrap);
                (function markup_beauty__replaceCdata() {
                    var a = function markup_beauty__replaceCdata_start(y) {
                            y = y.replace(/</g, "\nprettydiffcdatas");
                            return y;
                        },
                        b = function markup_beauty__replaceCdata_end(y) {
                            y = y.replace(/>/g, "\nprettydiffcdatae");
                            return y;
                        };
                    x = x.replace(/\/+<!\[+[A-Z]+\[+/g, a).replace(/\/+\]+>/g, b);
                }());
                (function markup_beauty__findNestedTags() {
                    var d = (function markup_beauty__findNestedTags_angleBraces() {
                            var a = 0,
                                b = 0,
                                c = x.length,
                                d = [],
                                e = 0,
                                h = -1,
                                i = 0,
                                j = 0,
                                k = -1,
                                l = 0,
                                m = 0,
                                n = false,
                                o = false,
                                p = 0,
                                q = [">"],
                                r = false,
                                s = 0;
                            for (a = 0; a < c; a += 1) {
                                if (mhtml === true && x.substr(a, 4).toLowerCase() === "<pre") {
                                    for (b = a + 4; b < c; b += 1) {
                                        if (x.charAt(b) + x.charAt(b + 1) + x.charAt(b + 2).toLowerCase() + x.charAt(b + 3).toLowerCase() + x.charAt(b + 4).toLowerCase() + x.charAt(b + 5) === "</pre>") {
                                            if (/></.test(x.substr(a, b))) {
                                                h += 2;
                                            } else {
                                                h += 3;
                                            }
                                            a = b + 5;
                                            break;
                                        }
                                    }
                                } else if (x.substr(a, 7).toLowerCase() === "<script") {
                                    for (b = a + 7; b < c; b += 1) {
                                        if (x.charAt(b) + x.charAt(b + 1) + x.charAt(b + 2).toLowerCase() + x.charAt(b + 3).toLowerCase() + x.charAt(b + 4).toLowerCase() + x.charAt(b + 5).toLowerCase() + x.charAt(b + 6).toLowerCase() + x.charAt(b + 7).toLowerCase() + x.charAt(b + 8) === "</script>") {
                                            if (/></.test(x.substr(a, b))) {
                                                h += 2;
                                            } else {
                                                h += 3;
                                            }
                                            a = b + 8;
                                            break;
                                        }
                                    }
                                } else if (x.substr(a, 6).toLowerCase() === "<style") {
                                    for (b = a + 6; b < c; b += 1) {
                                        if (x.charAt(b) + x.charAt(b + 1) + x.charAt(b + 2).toLowerCase() + x.charAt(b + 3).toLowerCase() + x.charAt(b + 4).toLowerCase() + x.charAt(b + 5).toLowerCase() + x.charAt(b + 6).toLowerCase() + x.charAt(b + 7) === "</style>") {
                                            if (/></.test(x.substr(a, b))) {
                                                h += 2;
                                            } else {
                                                h += 3;
                                            }
                                            a = b + 7;
                                            break;
                                        }
                                    }
                                } else if (x.substr(a, 5) === "<?php") {
                                    for (b = a + 5; b < c; b += 1) {
                                        if (x.charAt(b - 1) === "?" && x.charAt(b) === ">") {
                                            a = b;
                                            h += 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "%") {
                                    for (b = a + 2; b < c; b += 1) {
                                        if (x.charAt(b - 1) === "%" && x.charAt(b) === ">") {
                                            a = b;
                                            h += 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && x.charAt(a + 2) === "[") {
                                    for (b = a + 2; b < c; b += 1) {
                                        if (x.charAt(b - 1) === "]" && x.charAt(b) === ">") {
                                            a = b;
                                            h += 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && /[A-Z]|\[/.test(x.charAt(a + 2))) {
                                    for (b = a + 3; b < c; b += 1) {
                                        if (x.charAt(b) === "<" && c > b + 3 && x.charAt(b + 1) === "!" && x.charAt(b + 2) === "-" && x.charAt(b + 3) === "-") {
                                            for (s = b + 4; s < c; s += 1) {
                                                if (x.charAt(s - 2) === "-" && x.charAt(s - 1) === "-" && x.charAt(s) === ">") {
                                                    b = s;
                                                    break;
                                                }
                                            }
                                        } else if (x.charAt(b) === ">" && q[q.length - 1] === ">" && q.length === 1) {
                                            h += 1;
                                            if (r) {
                                                d.push([
                                                    a, b, h, a
                                                ]);
                                            }
                                            r = false;
                                            a = b;
                                            q = [">"];
                                            break;
                                        } else if (x.charAt(b) === "<") {
                                            q.push(">");
                                            r = true;
                                        } else if (x.charAt(b) === ">" && q.length > 1) {
                                            q.pop();
                                            r = true;
                                        } else if (x.charAt(b) === "[") {
                                            q.push("]");
                                        } else if (x.charAt(b) === "]") {
                                            q.pop();
                                        } else if (x.charAt(b) === "\"") {
                                            if (q[q.length - 1] === "\"") {
                                                q.pop();
                                            } else {
                                                q.push("\"");
                                            }
                                        } else if (x.charAt(b) === "'") {
                                            if (q[q.length - 1] === "'") {
                                                q.pop();
                                            } else {
                                                q.push("'");
                                            }
                                        }
                                    }
                                } else if (x.charAt(a) === x.charAt(a + 1) && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                                    a += 1;
                                } else if (x.charAt(a - 1) === "=" && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                                    o = false;
                                    for (m = a - 1; m > 0; m -= 1) {
                                        if ((x.charAt(m) === "\"" && x.charAt(a) === "\"") || (x.charAt(m) === "'" && x.charAt(a) === "'") || x.charAt(m) === "<") {
                                            break;
                                        } else if (x.charAt(m) === ">") {
                                            o = true;
                                            break;
                                        }
                                    }
                                    if (!o) {
                                        n = false;
                                        for (b = a + 1; b < c; b += 1) {
                                            if (x.substr(b, 7).toLowerCase() === "<script") {
                                                for (p = b + 7; p < c; p += 1) {
                                                    if (x.charAt(p) + x.charAt(p + 1) + x.charAt(p + 2).toLowerCase() + x.charAt(p + 3).toLowerCase() + x.charAt(p + 4).toLowerCase() + x.charAt(p + 5).toLowerCase() + x.charAt(p + 6).toLowerCase() + x.charAt(p + 7).toLowerCase() + x.charAt(p + 8) === "</script>") {
                                                        b = p + 8;
                                                        break;
                                                    }
                                                }
                                            } else if (x.substr(b, 6).toLowerCase() === "<style") {
                                                for (p = b + 6; p < c; p += 1) {
                                                    if (x.charAt(p) + x.charAt(p + 1) + x.charAt(p + 2).toLowerCase() + x.charAt(p + 3).toLowerCase() + x.charAt(p + 4).toLowerCase() + x.charAt(p + 5).toLowerCase() + x.charAt(p + 6).toLowerCase() + x.charAt(p + 7) === "</style>") {
                                                        b = p + 7;
                                                        break;
                                                    }
                                                }
                                            } else if (x.substr(b, 5) === "<?php") {
                                                for (p = b + 5; p < c; p += 1) {
                                                    if (x.charAt(p - 1) === "?" && x.charAt(p) === ">") {
                                                        b = p;
                                                        break;
                                                    }
                                                }
                                            } else if (x.charAt(b) === "<" && x.charAt(b + 1) === "%") {
                                                for (p = b + 5; p < c; p += 1) {
                                                    if (x.charAt(p - 1) === "%" && x.charAt(p) === ">") {
                                                        b = p;
                                                        break;
                                                    }
                                                }
                                            } else if (x.charAt(b) === ">" || x.charAt(b) === "<") {
                                                n = true;
                                            } else if ((x.charAt(b - 1) !== "\\" && ((x.charAt(a) === "\"" && x.charAt(b) === "\"") || (x.charAt(a) === "'" && x.charAt(b) === "'"))) || b === c - 1) {
                                                if (k !== h && l === 1) {
                                                    l = 0;
                                                    h -= 1;
                                                    k -= 1;
                                                } else if (k === h) {
                                                    for (e = i + 1; e > a; e += 1) {
                                                        if (!/\s/.test(x.charAt(e))) {
                                                            break;
                                                        }
                                                    }
                                                    j = e;
                                                    if (i < a && l !== 1) {
                                                        l = 1;
                                                        h += 1;
                                                        k += 1;
                                                    }
                                                }
                                                if (n) {
                                                    d.push([
                                                        a, b, h, j
                                                    ]);
                                                }
                                                a = b;
                                                break;
                                            }
                                        }
                                    }
                                } else if (x.charAt(a) === "<") {
                                    if (x.charAt(a + 1) === "!" && x.charAt(a + 2) === "-" && x.charAt(a + 3) === "-") {
                                        for (b = a + 4; b < x.length; b += 1) {
                                            if (x.charAt(b) === "-" && x.charAt(b + 1) === "-" && x.charAt(b + 2) === ">") {
                                                break;
                                            }
                                        }
                                        h += 1;
                                        a = b + 2;
                                    } else {
                                        h += 1;
                                        j = a;
                                    }
                                } else if (x.charAt(a + 1) === "<" && x.charAt(a) !== ">") {
                                    for (b = a; b > 0; b -= 1) {
                                        if (!/\s/.test(x.charAt(b)) && x.charAt(b) !== ">") {
                                            h += 1;
                                            k += 1;
                                            j = a;
                                            break;
                                        } else if (x.charAt(b) === ">") {
                                            if (h !== k) {
                                                k += 1;
                                                i = a;
                                            }
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === ">") {
                                    k += 1;
                                    i = a;
                                }
                            }
                            return d;
                        }());
                    (function markup_beauty__findNestedTags_replaceBraces() {
                        var a = 0,
                            b = 0,
                            c = d.length,
                            e = 0,
                            f = 0,
                            g = 0,
                            h = 0,
                            i = 0,
                            j = 0,
                            k = 0,
                            y = x.split("");
                        for (a = 0; a < c; a += 1) {
                            i = d[a][0] + 1;
                            f = d[a][1];
                            g = d[a][2];
                            j = d[a][3];
                            for (e = i; e < f; e += 1) {
                                h = 0;
                                if (y[e] === "<") {
                                    y[e] = "[";
                                    for (b = e; b > j; b -= 1) {
                                        h += 1;
                                        if (/\s/.test(y[b])) {
                                            for (k = b - 1; k > j; k -= 1) {
                                                if (!/\s/.test(y[k])) {
                                                    if (y[k] !== "=") {
                                                        h += 1;
                                                    } else if (/\s/.test(y[k - 1])) {
                                                        h -= 1;
                                                    }
                                                    b = k;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (/\s/.test(y[i])) {
                                        h -= 1;
                                    }
                                    inner.push([
                                        "<", h, g
                                    ]);
                                } else if (y[e] === ">") {
                                    y[e] = "]";
                                    for (b = e; b > j; b -= 1) {
                                        h += 1;
                                        if (/\s/.test(y[b])) {
                                            for (k = b - 1; k > j; k -= 1) {
                                                if (!/\s/.test(y[k])) {
                                                    if (y[k] !== "=") {
                                                        h += 1;
                                                    } else if (/\s/.test(y[k - 1])) {
                                                        h -= 1;
                                                    }
                                                    b = k;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (/\s/.test(y[i])) {
                                        h -= 1;
                                    }
                                    inner.push([
                                        ">", h, g
                                    ]);
                                }
                            }
                        }
                        x = y.join("");
                    }());
                }());
                (function markup_beauty__createBuild() {
                    var i = 0,
                        j = 0,
                        y = markupmin({
                            source: x,
                            comments: mmode,
                            presume_html: mhtml,
                            conditional: mcond
                        }).split(""),
                        a = "",
                        b = function markup_beauty__createBuild_endFinder(end) {
                            var a = [],
                                b = end.length,
                                c = end.split("").reverse(),
                                d = 0,
                                e = "",
                                f = true,
                                loop = y.length;
                            if (i > 0 && y[i - 1] === " ") {
                                e = " ";
                            }
                            for (i; i < loop; i += 1) {
                                a.push(y[i]);
                                if (end === "]>") {
                                    if (y[i] === "[") {
                                        f = false;
                                    }
                                    if (f && y[i] === ">") {
                                        c = [">"];
                                        b = 1;
                                    }
                                }
                                if (a[a.length - 1] === c[0]) {
                                    if (b === 1) {
                                        return e + a.join("");
                                    }
                                    for (d = 0; d < b; d += 1) {
                                        if (c[d] !== a[a.length - (d + 1)]) {
                                            break;
                                        }
                                    }
                                    if (d === b) {
                                        return e + a.join("");
                                    }
                                }
                            }
                            return e + a.join("");
                        },
                        c = [],
                        cgather = function markup_beauty__createBuild_buildContent(z) {
                            var c = 0,
                                d = "",
                                e = 0,
                                q = "",
                                loop = y.length;
                            for (c = i; c < loop; c += 1) {
                                if (q === "" && (y[c - 1] !== "\\" || (c > 2 && y[c - 2] === "\\"))) {
                                    if (y[c] === "/" && y[c + 1] && y[c + 1] === "/") {
                                        q = "//";
                                    } else if (y[c] === "/" && y[c + 1] && y[c + 1] === "*") {
                                        q = "/*";
                                    } else if (y[c] === "'" || y[c] === "\"" || y[c] === "/") {
                                        if (y[c] === "/") {
                                            for (e = c - 1; e > 0; e -= 1) {
                                                if (!/\s/.test(y[e])) {
                                                    break;
                                                }
                                            }
                                            if (y[e] === ")" || y[e] === "]" || y[e] === "}" || /\w/.test(y[e])) {
                                                q = "";
                                            } else {
                                                q = "/";
                                            }
                                        } else {
                                            q = y[c];
                                        }
                                    }
                                } else if ((y[c - 1] !== "\\" || (c > 2 && y[c - 2] === "\\")) && ((q === "'" && y[c] === "'") || (q === "\"" && y[c] === "\"") || (q === "/" && y[c] === "/") || (q === "//" && (y[c] === "\n" || (y[c - 4] && y[c - 4] === "/" && y[c - 3] === "/" && y[c - 2] === "-" && y[c - 1] === "-" && y[c] === ">"))) || (q === "/*" && y[c - 1] === "*" && y[c] === "/"))) {
                                    q = "";
                                }
                                if (((z === "script" && q === "") || z === "style") && y[c] === "<" && y[c + 1] === "/" && y[c + 2].toLowerCase() === "s") {
                                    if (z === "script" && (y[c + 3].toLowerCase() === "c" && y[c + 4].toLowerCase() === "r" && y[c + 5].toLowerCase() === "i" && y[c + 6].toLowerCase() === "p" && y[c + 7].toLowerCase() === "t")) {
                                        break;
                                    } else if (z === "style" && (y[c + 3].toLowerCase() === "t" && y[c + 4].toLowerCase() === "y" && y[c + 5].toLowerCase() === "l" && y[c + 6].toLowerCase() === "e")) {
                                        break;
                                    }
                                } else if (z === "other" && y[c] === "<") {
                                    break;
                                } else {
                                    d = d + y[c];
                                }
                            }
                            i = c - 1;
                            if (mcont) {
                                if (d.charAt(0) === " " && d.charAt(d.length - 1) === " ") {
                                    d = " text ";
                                } else if (d.charAt(0) === " ") {
                                    d = " text";
                                } else if (d.charAt(d.length - 1) === " ") {
                                    d = "text ";
                                } else {
                                    d = "text";
                                }
                            }
                            return d;
                        },
                        loop = y.length;
                    for (i = 0; i < loop; i += 1) {
                        if (token[token.length - 1] === "T_script" && !(y[i] === "<" && y[i + 1] === "/" && y[i + 2].toLowerCase() === "s" && y[i + 3].toLowerCase() === "c" && y[i + 4].toLowerCase() === "r" && y[i + 5].toLowerCase() === "i" && y[i + 6].toLowerCase() === "p" && y[i + 7].toLowerCase() === "t")) {
                            build.push(cgather("script"));
                            token.push("T_content");
                        } else if (token[token.length - 1] === "T_style" && !(y[i] === "<" && y[i + 1] === "/" && y[i + 2].toLowerCase() === "s" && y[i + 3].toLowerCase() === "t" && y[i + 4].toLowerCase() === "y" && y[i + 5].toLowerCase() === "l" && y[i + 6].toLowerCase() === "e")) {
                            build.push(cgather("style"));
                            token.push("T_content");
                        } else if (y[i] === "<" && y[i + 1] === "!" && y[i + 2] === "-" && y[i + 3] === "-" && y[i + 4] !== "#" && token[token.length - 1] !== "T_style") {
                            build.push(b("-->"));
                            token.push("T_comment");
                        } else if (y[i] === "<" && y[i + 1] === "%" && y[i + 2] === "-" && y[i + 3] === "-") {
                            build.push(b("--%>"));
                            token.push("T_comment");
                        } else if (y[i] === "<" && y[i + 1] === "!" && y[i + 2] === "-" && y[i + 3] === "-" && y[i + 4] === "#") {
                            build.push(b("-->"));
                            token.push("T_ssi");
                        } else if (y[i] === "<" && y[i + 1] === "!" && y[i + 2] !== "-") {
                            build.push(b("]>"));
                            token.push("T_sgml");
                        } else if (y[i] === "<" && y[i + 1] === "?" && y[i + 2].toLowerCase() === "x" && y[i + 3].toLowerCase() === "m" && y[i + 4].toLowerCase() === "l") {
                            build.push(b("?>"));
                            token.push("T_xml");
                        } else if (mhtml === true && y[i] === "<" && y[i + 1].toLowerCase() === "p" && y[i + 2].toLowerCase() === "r" && y[i + 3].toLowerCase() === "e") {
                            build.push(b("</pre>"));
                            token.push("T_pre");
                        } else if (y[i] === "<" && y[i + 1] === "?" && y[i + 2].toLowerCase() === "p" && y[i + 3].toLowerCase() === "h" && y[i + 4].toLowerCase() === "p") {
                            build.push(b("?>"));
                            token.push("T_php");
                        } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "c" && y[i + 3].toLowerCase() === "r" && y[i + 4].toLowerCase() === "i" && y[i + 5].toLowerCase() === "p" && y[i + 6].toLowerCase() === "t") {
                            j = i;
                            build.push(b(">"));
                            a = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                            if (a.indexOf(" type=\"syntaxhighlighter\"") !== -1) {
                                i = j;
                                build[build.length - 1] = b("</script>");
                                token.push("T_pre");
                            } else if (a.charAt(a.length - 2) === "/") {
                                token.push("T_singleton");
                            } else if (a.indexOf(" type=\"") === -1 || a.indexOf(" type=\"text/javascript\"") !== -1 || a.indexOf(" type=\"application/javascript\"") !== -1 || a.indexOf(" type=\"application/x-javascript\"") !== -1 || a.indexOf(" type=\"text/ecmascript\"") !== -1 || a.indexOf(" type=\"application/ecmascript\"") !== -1) {
                                token.push("T_script");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "t" && y[i + 3].toLowerCase() === "y" && y[i + 4].toLowerCase() === "l" && y[i + 5].toLowerCase() === "e") {
                            build.push(b(">"));
                            a = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                            if (a.indexOf(" type=\"") === -1 || a.indexOf(" type=\"text/css\"") !== -1) {
                                token.push("T_style");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "%") {
                            build.push(b("%>"));
                            token.push("T_asp");
                        } else if (y[i] === "<" && y[i + 1] === "/") {
                            build.push(b(">"));
                            token.push("T_tag_end");
                        } else if (y[i] === "<" && token[token.length - 1] !== "T_script" && token[token.length - 1] !== "T_style" && (y[i + 1] !== "!" || y[i + 1] !== "?" || y[i + 1] !== "/" || y[i + 1] !== "%")) {
                            for (c = i; c < loop; c += 1) {
                                if (y[c] !== "?" && y[c] !== "%") {
                                    if (y[c] === "/" && y[c + 1] === ">") {
                                        build.push(b("/>"));
                                        token.push("T_singleton");
                                        break;
                                    } else if (y[c + 1] === ">") {
                                        build.push(b(">"));
                                        token.push("T_tag_start");
                                        break;
                                    }
                                }
                            }
                        } else if (y[i - 1] === ">" && (y[i] !== "<" || (y[i] !== " " && y[i + 1] !== "<"))) {
                            if (token[token.length - 1] === "T_script") {
                                build.push(cgather("script"));
                                token.push("T_content");
                            } else if (token[token.length - 1] === "T_style") {
                                build.push(cgather("style"));
                                token.push("T_content");
                            } else if (y[i - 1] + y[i] + y[i + 1] !== "> <") {
                                build.push(cgather("other"));
                                token.push("T_content");
                            }
                        }
                    }
                }());
                (function markup_beauty__createCinfo() {
                    var i = 0,
                        Z = token.length;
                    for (i = 0; i < Z; i += 1) {
                        build[i] = build[i].replace(/\s*prettydiffcdatas/g, "<").replace(/\s*prettydiffcdatae/g, ">");
                        if (token[i] === "T_sgml" || token[i] === "T_xml") {
                            cinfo.push("parse");
                        } else if (token[i] === "T_asp" || token[i] === "T_php" || token[i] === "T_ssi" || token[i] === "T_pre") {
                            cinfo.push("singleton");
                        } else if (token[i] === "T_comment") {
                            cinfo.push("comment");
                        } else if ((token[i] === "T_content" && build[i] !== " ") && token[i - 1] === "T_script") {
                            cinfo.push("external");
                        } else if (token[i] === "T_content" && token[i - 1] === "T_style") {
                            cinfo.push("external");
                        } else if (token[i] === "T_content" && build[i].charAt(0) === " " && build[i].charAt(build[i].length - 1) === " ") {
                            cinfo.push("mixed_both");
                        } else if (token[i] === "T_content" && build[i].charAt(0) === " " && build[i].charAt(build[i].length - 1) !== " ") {
                            cinfo.push("mixed_start");
                        } else if (token[i] === "T_content" && build[i].charAt(0) !== " " && build[i].charAt(build[i].length - 1) === " ") {
                            cinfo.push("mixed_end");
                        } else if (token[i] === "T_content") {
                            cinfo.push("content");
                        } else if (token[i] === "T_tag_start") {
                            cinfo.push("start");
                        } else if (token[i] === "T_style") {
                            build[i] = build[i].replace(/\s+/g, " ");
                            cinfo.push("start");
                        } else if (token[i] === "T_script") {
                            build[i] = build[i].replace(/\s+/g, " ");
                            cinfo.push("start");
                        } else if (token[i] === "T_singleton") {
                            cinfo.push("singleton");
                        } else if (token[i] === "T_tag_end") {
                            cinfo.push("end");
                        }
                    }
                    sum = [].concat(build);
                }());
                (function markup_beauty__htmlCheat() {
                    var a = 0,
                        b = "",
                        i = 0,
                        loop = 0;
                    if (mhtml === false) {
                        return;
                    }
                    loop = cinfo.length;
                    for (i = 0; i < loop; i += 1) {
                        if (cinfo[i] === "start") {
                            a = build[i].indexOf(" ");
                            if (build[i].length === 3) {
                                b = build[i].charAt(1).toLowerCase();
                            } else if (a === -1) {
                                b = build[i].slice(1, build[i].length - 1).toLowerCase();
                            } else if (a === 0) {
                                b = build[i].slice(1, build[i].length);
                                a = b.indexOf(" ");
                                b = b.slice(1, a).toLowerCase();
                            } else {
                                b = build[i].slice(1, a).toLowerCase();
                            }
                            if (b === "area" || b === "base" || b === "basefont" || b === "br" || b === "col" || b === "embed" || b === "eventsource" || b === "frame" || b === "hr" || b === "img" || b === "input" || b === "keygen" || b === "link" || b === "meta" || b === "param" || b === "progress" || b === "source" || b === "wbr") {
                                cinfo[i] = "singleton";
                                token[i] = "T_singleton";
                            }
                        }
                    }
                }());
                (function markup_beauty__algorithm() {
                    var i = 0,
                        c = function markup_beauty__algorithm_commonStart(x) {
                            var k = 0,
                                m = 0;
                            if (x === "start") {
                                m += 1;
                            }
                            for (k = i - 1; k > -1; k -= 1) {
                                if (cinfo[k] === "start" && level[k] === "x") {
                                    m += 1;
                                } else if (cinfo[k] === "end") {
                                    m -= 1;
                                } else if (cinfo[k] === "start" && level[k] !== "x") {
                                    return level.push(level[k] + m);
                                }
                                if (k === 0) {
                                    if (cinfo[k] !== "start") {
                                        return level.push(0);
                                    }
                                    if (cinfo[i] === "mixed_start" || cinfo[i] === "content" || (cinfo[i] === "singleton" && build[i].charAt(0) !== " ")) {
                                        return level.push("x");
                                    }
                                    return level.push(1);
                                }
                            }
                        },
                        e = function markup_beauty__algorithm_end() {
                            var z = function markup_beauty__algorithm_end_xTester(y) {
                                    for (y; y > 0; y -= 1) {
                                        if (level[y] !== "x") {
                                            return level.push(level[y] + 1);
                                        }
                                    }
                                },
                                w = function markup_beauty__algorithm_end_computation() {
                                    var k = 0,
                                        q = false,
                                        u = function markup_beauty__algorithm_end_computation_primary() {
                                            var y = 0,
                                                t = function markup_beauty__algorithm_end_computation_primary_vooDoo() {
                                                    var k = 0,
                                                        s = 0,
                                                        l = 0;
                                                    for (s = i - 1; s > 0; s -= 1) {
                                                        if ((cinfo[s] === "start" && cinfo[s + 1] === "start" && level[s] === level[s + 1] - 1) || (cinfo[s] === "start" && cinfo[s - 1] !== "start" && level[s] === level[s - 1])) {
                                                            break;
                                                        }
                                                    }
                                                    for (k = s + 1; k < i; k += 1) {
                                                        if (cinfo[k] === "mixed_start" && cinfo[k + 1] === "end") {
                                                            l += 1;
                                                        }
                                                    }
                                                    if (cinfo[s - 1] === "end" && level[s - 1] !== "x" && l === 0) {
                                                        l += 1;
                                                    }
                                                    if (l !== 0) {
                                                        if (level[i - 1] === "x") {
                                                            return l - 1;
                                                        }
                                                        return l;
                                                    }
                                                    for (s; s < i; s += 1) {
                                                        if (cinfo[s] === "start") {
                                                            l += 1;
                                                        } else if (cinfo[s] === "end") {
                                                            l -= 1;
                                                        }
                                                    }
                                                    return l;
                                                };
                                            for (y = i - 1; y > 0; y -= 1) {
                                                if (cinfo[y] !== "mixed_end" || (cinfo[y] === "start" && level[y] !== "x")) {
                                                    if (cinfo[y - 1] === "end") {
                                                        q = true;
                                                        if (cinfo[i - 1] === "mixed_both" && level[i - 1] === level[y] - t()) {
                                                            return level.push(level[y] - (t() + 1));
                                                        }
                                                        if (cinfo[i - 2] === "start" && (cinfo[i - 1] === "mixed_end" || cinfo[i - 1] === "mixed_both")) {
                                                            return level.push(level[y]);
                                                        }
                                                        if (level[y] !== "x") {
                                                            if (cinfo[y] === "mixed_both" && y !== i - t()) {
                                                                if (y === i - 1) {
                                                                    return level.push(level[y] - 1);
                                                                }
                                                                return level.push(level[y] + t());
                                                            }
                                                            if (cinfo[i - 1] === "mixed_end" && t() === 0) {
                                                                return level.push(level[y] - 1);
                                                            }
                                                            if (level[i - 1] === "x" && (cinfo[i - 2] !== "end" || (cinfo[i - 2] === "end" && level[i - 2] !== "x"))) {
                                                                return level.push(level[y] + t());
                                                            }
                                                            return level.push(level[y] - t());
                                                        }
                                                    } else {
                                                        q = false;
                                                        return;
                                                    }
                                                }
                                            }
                                        },
                                        r = function markup_beauty__algorithm_end_computation_resultant() {
                                            var l = 0,
                                                k = 0;
                                            for (k = i; k > 0; k -= 1) {
                                                if (cinfo[k] === "end") {
                                                    l += 1;
                                                } else if (cinfo[k] === "start") {
                                                    l -= 1;
                                                }
                                                if (l === 0) {
                                                    return k;
                                                }
                                            }
                                        };
                                    if (cinfo[i - 1] === "end" && level[i - 1] !== "x") {
                                        if (cinfo[i - 2] === "start" && level[i - 2] === "x") {
                                            for (k = i - 2; k > 0; k -= 1) {
                                                if (level[k] !== "x") {
                                                    break;
                                                }
                                            }
                                            if (cinfo[k] === "start") {
                                                return c("end");
                                            }
                                            return level.push(level[k] - 1);
                                        }
                                        if (cinfo[i - 2] === "start" && level[i - 2] !== "x") {
                                            return level.push(level[i - 2] - 1);
                                        }
                                        return level.push(level[i - 1] - 1);
                                    }
                                    u();
                                    if (q) {
                                        return;
                                    }
                                    return (function markup_beauty__end_computation_whenAllElseFails() {
                                        var y = 0,
                                            q = 0;
                                        for (q = r(); q > 0; q -= 1) {
                                            if (cinfo[q] === "start") {
                                                y += 1;
                                            } else if (cinfo[q] === "end") {
                                                y -= 1;
                                            }
                                            if (level[q] !== "x") {
                                                if (cinfo[q] === "end" && cinfo[q - 1] === "start" && level[q - 1] !== "x") {
                                                    return level.push(level[q]);
                                                }
                                                if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_end" && (cinfo[i - 2] !== "end" || level[i - 2] !== "x") && (cinfo[i - 3] !== "end" || level[i - 3] !== "x")) {
                                                    return level.push("x");
                                                }
                                                return level.push(level[q] + (y - 1));
                                            }
                                        }
                                        y = 0;
                                        for (q = i; q > -1; q -= 1) {
                                            if (cinfo[q] === "start") {
                                                y += 1;
                                            } else if (cinfo[q] === "end") {
                                                y -= 1;
                                            }
                                        }
                                        return level.push(y);
                                    }());
                                };
                            if (cinfo[i - 1] === "end" || cinfo[i - 1] === "mixed_both" || cinfo[i - 1] === "mixed_end") {
                                return w();
                            }
                            if (cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content") {
                                return level.push("x");
                            }
                            if (cinfo[i - 1] === "external") {
                                return (function markup_beauty__algorithm_end_external() {
                                    var a = 0,
                                        yy = -1;
                                    for (a = i - 2; a > 0; a -= 1) {
                                        if (cinfo[a] === "start") {
                                            yy += 1;
                                        } else if (cinfo[a] === "end") {
                                            yy -= 1;
                                        }
                                        if (level[a] !== "x") {
                                            break;
                                        }
                                    }
                                    if (cinfo[a] === "end") {
                                        yy += 1;
                                    }
                                    return level.push(level[a] + yy);
                                }());
                            }
                            if (build[i].charAt(0) !== " ") {
                                if (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content") {
                                    return level.push("x");
                                }
                                return (function markup_beauty__algorithm_end_singletonContent() {
                                    var a = 0,
                                        yy = 0;
                                    for (a = i - 1; a > 0; a -= 1) {
                                        if (cinfo[a] === "singleton" && level[a] === "x" && ((cinfo[a - 1] === "singleton" && level[a - 1] !== "x") || cinfo[a - 1] !== "singleton")) {
                                            yy += 1;
                                        }
                                        if (level[a] !== 0 && level[a] !== "x" && cinfo[i - 1] !== "start") {
                                            if (cinfo[a] === "mixed_both" || cinfo[a] === "mixed_start") {
                                                return level.push(level[a] - yy);
                                            }
                                            if (level[a] === yy || (cinfo[a] === "singleton" && (cinfo[a - 1] === "content" || cinfo[a - 1] === "mixed_start"))) {
                                                return level.push(level[a]);
                                            }
                                            return level.push(level[a] - 1);
                                        }
                                        if (cinfo[a] === "start" && level[a] === "x") {
                                            return z(a);
                                        }
                                        if (cinfo[i - 1] === "start") {
                                            return level.push(level[a]);
                                        }
                                    }
                                    return level.push(0);
                                }());
                            }
                            return c("end");
                        },
                        f = function markup_beauty__algorithm_start(z) {
                            var k = 0,
                                l = 0,
                                m = 0,
                                p = function markup_beauty__algorithm_start_complexity() {
                                    var j = 0,
                                        v = 1,
                                        u = -1;
                                    for (j = k; j > 0; j -= 1) {
                                        if (cinfo[j] === "start") {
                                            u -= 1;
                                            if (level[j] === "x") {
                                                v += 1;
                                            }
                                        } else if (cinfo[j] === "end") {
                                            u += 1;
                                            v -= 1;
                                        }
                                        if (level[j] === 0) {
                                            k = 0;
                                            for (l = i - 1; l > j; l -= 1) {
                                                if (cinfo[l] === "start") {
                                                    k += 1;
                                                } else if (cinfo[l] === "end") {
                                                    k -= 1;
                                                }
                                            }
                                            if (k > 0) {
                                                if (level[j + 1] === "x") {
                                                    return level.push((u * -1) - 1);
                                                }
                                                if (cinfo[j] !== "external" && (mcomm !== "noindent" || (mcomm === "noindent" && cinfo[j] !== "comment"))) {
                                                    return level.push((u + 1) * -1);
                                                }
                                            } else {
                                                for (k = i - 1; k > 0; k -= 1) {
                                                    if (level[k] !== "x") {
                                                        return level.push(level[k]);
                                                    }
                                                }
                                            }
                                        }
                                        if (level[j] !== "x" && level[i - 1] !== "x") {
                                            if (cinfo[j] === "start" || cinfo[j] === "end") {
                                                return level.push(level[j] + v);
                                            }
                                            return level.push(level[j] + v - 1);
                                        }
                                        if (u === -1 && level[j] === "x") {
                                            break;
                                        } else if (u === 1 && level[j] !== "x" && cinfo[j] !== "mixed_start" && cinfo[j] !== "content") {
                                            if (cinfo[j - 1] === "mixed_end" || (level[i - 1] === "x" && cinfo[i - 1] === "end" && cinfo[j] !== "end")) {
                                                return level.push(level[j] - u - 1);
                                            }
                                            return level.push(level[j] - u);
                                        }
                                        if (u === 0 && level[j] !== "x") {
                                            return c("start");
                                        }
                                    }
                                    return c("start");
                                };
                            (function markup_beauty__algorithm_start_referrenceFinder() {
                                var j = 0;
                                if (z === 1) {
                                    k = 0;
                                    l = 0;
                                    m = 0;
                                } else {
                                    for (j = z - 1; j > 0; j -= 1) {
                                        if (cinfo[j] !== "comment") {
                                            k = j;
                                            break;
                                        }
                                    }
                                    if (k === 1) {
                                        l = 0;
                                        m = 0;
                                    } else {
                                        for (j = k - 1; j > 0; j -= 1) {
                                            if (cinfo[j] !== "comment") {
                                                l = j;
                                                break;
                                            }
                                        }
                                        if (l === 1) {
                                            m = 0;
                                        } else {
                                            for (j = l - 1; j > 0; j -= 1) {
                                                if (cinfo[j] !== "comment") {
                                                    m = j;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }());
                            if (i - 1 === 0 && cinfo[0] === "start") {
                                return level.push(1);
                            }
                            if (cinfo[k] === "mixed_start" || cinfo[k] === "content" || cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i] === "singleton" && (cinfo[i - 1] === "start" || cinfo[i - 1] === "singleton" || cinfo[i - 1] === "end") && build[i].charAt(0) !== " ")) {
                                return level.push("x");
                            }
                            if ((cinfo[i - 1] === "comment" && level[i - 1] === 0) || ((cinfo[m] === "mixed_start" || cinfo[m] === "content") && cinfo[l] === "end" && (cinfo[k] === "mixed_end" || cinfo[k] === "mixed_both"))) {
                                return c("start");
                            }
                            if (cinfo[i - 1] === "comment" && level[i - 1] !== "x") {
                                return level.push(level[i - 1]);
                            }
                            if ((cinfo[k] === "start" && level[k] === "x") || (cinfo[k] !== "mixed_end" && cinfo[k] !== "mixed_both" && level[k] === "x")) {
                                if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "start" && build[i - 1].charAt(build[i - 1].length - 1) !== " ") {
                                    if ((cinfo[i - 1] === "end" && cinfo[i - 2] === "end") || (cinfo[i - 1] === "end" && cinfo[i] !== "end" && cinfo[i + 1] !== "mixed_start" && cinfo[i + 1] !== "content")) {
                                        return c("start");
                                    }
                                    return level.push("x");
                                }
                                return p();
                            }
                            if (cinfo[k] === "end" && level[k] !== "x" && (cinfo[k - 1] !== "start" || (cinfo[k - 1] === "start" && level[k - 1] !== "x"))) {
                                if (level[k] < 0) {
                                    return c("start");
                                }
                                return level.push(level[k]);
                            }
                            if (cinfo[m] !== "mixed_start" && cinfo[m] !== "content" && (cinfo[k] === "mixed_end" || cinfo[k] === "mixed_both")) {
                                return (function markup_beauty__algorithm_start_notContentNotMixedstart() {
                                    var a = 0,
                                        l = 0,
                                        p = 0,
                                        m = 0;
                                    for (a = k; a > 0; a -= 1) {
                                        if (cinfo[a] === "end") {
                                            l += 1;
                                        }
                                        if (cinfo[a] === "start") {
                                            p += 1;
                                        }
                                        if (level[a] === 0 && a !== 0) {
                                            m = a;
                                        }
                                        if (cinfo[k] === "mixed_both" && level[a] !== "x") {
                                            return level.push(level[a]);
                                        }
                                        if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end" && level[a] !== "x") {
                                            if (cinfo[a] === "start" && level[a] !== "x") {
                                                if (cinfo[i - 1] !== "end") {
                                                    return level.push(level[a] + (p - l));
                                                }
                                                if ((level[a] === level[a - 1] && cinfo[a - 1] !== "end" && level[a + 1] !== "x") || (cinfo[i - 2] === "start" && level[i - 2] !== "x" && level[i - 1] === "x")) {
                                                    return level.push(level[a] + 1);
                                                }
                                                if (p <= 1) {
                                                    return level.push(level[a]);
                                                }
                                            } else if (l > 0) {
                                                if (p > 1) {
                                                    if (m !== 0) {
                                                        return c("start");
                                                    }
                                                    return level.push(level[a] + 1);
                                                }
                                                return level.push(level[a] - l + 1);
                                            }
                                            return level.push(level[a] + p);
                                        }
                                    }
                                    return c("start");
                                }());
                            }
                            if (cinfo[k] === "start" && level[k] !== "x") {
                                return (function markup_beauty__algorithm_start_referenceKStartNotX() {
                                    var a = 0;
                                    for (a = i - 1; a > -1; a -= 1) {
                                        if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end") {
                                            if (cinfo[i + 1] && build[i].charAt(0) !== " " && (cinfo[i + 1] === "mixed_end" || cinfo[i + 1] === "content" || (build[i + 1].charAt(0) !== " " && cinfo[i + 1] === "singleton"))) {
                                                return level.push("x");
                                            }
                                            return level.push(level[a] + 1);
                                        }
                                    }
                                    return level.push(0);
                                }());
                            }
                            if (build[i].charAt(0) !== " " && (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content" || cinfo[i - 1] === "mixed_start")) {
                                return level.push("x");
                            }
                            return c("start");
                        },
                        h = function markup_beauty__algorithm_initialTest() {
                            var z = 0;
                            if (cinfo[i] !== "start" && level[i - 1] === "x" && cinfo[i - 1] !== "content" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_start" && cinfo[i - 1] !== "mixed_end") {
                                return level.push("x");
                            }
                            if (cinfo[i] !== "start" && build[i] === " ") {
                                build[i] = "";
                                return level.push("x");
                            }
                            if (cinfo[i - 1] !== "comment") {
                                f(i);
                            } else {
                                for (z = i - 1; z > 0; z -= 1) {
                                    if (cinfo[z] !== "comment") {
                                        break;
                                    }
                                }
                                f(z + 1);
                            }
                        };
                    (function markup_beauty__algorithm_innerFix() {
                        var a = 0,
                            b = "",
                            c = 0,
                            d = 0,
                            e = inner.length,
                            f = [];
                        for (a = 0; a < e; a += 1) {
                            b = inner[a][0];
                            c = inner[a][1];
                            d = inner[a][2];
                            if (typeof build[d] === "string") {
                                if (build[d].charAt(0) === " ") {
                                    c += 1;
                                }
                                f = build[d].split("");
                                if (b === "<" && f[c] === "[") {
                                    f[c] = "<";
                                } else if (b === ">" && f[c] === "]") {
                                    f[c] = ">";
                                }
                                build[d] = f.join("");
                            }
                        }
                    }());
                    (function markup_beauty__algorithm_loop() {
                        var test = false,
                            test1 = false,
                            svg = false,
                            cdata = [],
                            cdata1 = [],
                            cdataStart = (/^(\s*\/*<\!\[+[A-Z]+\[+)/),
                            cdataEnd = (/(\/*\]+>\s*)$/),
                            scriptStart = (/^(\s*<\!\-\-)/),
                            scriptEnd = (/(\-\->\s*)$/),
                            loop = cinfo.length,
                            disqualify = (mhtml === true) ? (/^(\s?<((pre)|(script)))/) : (/^(\s?<script)/),
                            attrib = function markup_beauty__algorithm_loop_attributeOrder(tag, end) {
                                var a = [],
                                    b = 0,
                                    c = 0,
                                    d = "",
                                    e = tag.indexOf(" ") + 1,
                                    f = 0,
                                    g = "",
                                    h = 0,
                                    space = (tag.charAt(0) === " ") ? true : false,
                                    joinchar = (svg === true) ? "\n" + (function markup_beauty__apply_tab() {
                                        var a = 0,
                                            b = msize,
                                            c = mchar,
                                            d = [],
                                            tab = "";
                                        for (a = 0; a < b; a += 1) {
                                            d.push(c);
                                        }
                                        tab = d.join("");
                                        b = level[i];
                                        d = [];
                                        for (a = 0; a < b; a += 1) {
                                            d.push(tab);
                                        }
                                        return d.join("") + tab;
                                    }()) : " ";
                                if (space) {
                                    tag = tag.substr(1);
                                    e = tag.indexOf(" ") + 1;
                                }
                                g = tag.substring(0, e);
                                tag = tag.substring(e, tag.length - end.length) + " ";
                                b = tag.length;
                                for (c = 0; c < b; c += 1) {
                                    if (d === "") {
                                        if (tag.charAt(c) === "\"") {
                                            d = "\"";
                                        } else if (tag.charAt(c) === "'") {
                                            d = "'";
                                        } else if (tag.charAt(c) === "[") {
                                            d = "[";
                                            h = 1;
                                        } else if (tag.charAt(c) === "{") {
                                            d = "{";
                                            h = 1;
                                        } else if (tag.charAt(c) === "(") {
                                            d = "(";
                                            h = 1;
                                        } else if (tag.charAt(c) === " " && h === 0) {
                                            a.push(tag.substring(f, c));
                                            f = c + 1;
                                        }
                                    } else if (d === "\"" && tag.charAt(c) === "\"") {
                                        d = "";
                                    } else if (d === "'" && tag.charAt(c) === "'") {
                                        d = "";
                                    } else if (d === "[") {
                                        if (tag.charAt(c) === "]") {
                                            h -= 1;
                                            if (h === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(c) === "[") {
                                            h += 1;
                                        }
                                    } else if (d === "{") {
                                        if (tag.charAt(c) === "}") {
                                            h -= 1;
                                            if (h === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(c) === "{") {
                                            h += 1;
                                        }
                                    } else if (d === "(") {
                                        if (tag.charAt(c) === ")") {
                                            h -= 1;
                                            if (h === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(c) === "(") {
                                            h += 1;
                                        }
                                    }
                                }
                                if (space) {
                                    return " " + g + a.sort().join(joinchar) + end;
                                }
                                return g + a.sort().join(joinchar) + end;
                            };
                        for (i = 0; i < loop; i += 1) {
                            test = false;
                            test1 = false;
                            cdata = [""];
                            cdata1 = [""];
                            if (build[i].indexOf("<svg") === 0 || build[i].indexOf(" <svg") === 0) {
                                svg = true;
                            } else if (build[i] === "</svg>" || build[i] === " </svg>") {
                                svg = false;
                            }
                            if (i === 0) {
                                level.push(0);
                            } else if (mforce) {
                                if (cinfo[i] === "end") {
                                    if (cinfo[i - 1] === "start") {
                                        level.push(level[i - 1]);
                                    } else {
                                        level.push(level[i - 1] - 1);
                                    }
                                } else {
                                    if (cinfo[i - 1] === "start") {
                                        level.push(level[i - 1] + 1);
                                    } else {
                                        level.push(level[i - 1]);
                                    }
                                    if (cinfo[i] === "mixed_end") {
                                        build[i] = build[i].slice(0, build[i].length - 1);
                                    }
                                }
                            } else if (cinfo[i] === "external") {
                                if (/\s*<\!\-\-\s*\-\->\s*/.test(build[i])) {
                                    if (build[i].charAt(0) === " ") {
                                        build[i] = build[i].substr(1);
                                    }
                                    if (build[i].charAt(build[i].length - 1) === " ") {
                                        build[i] = build[i].substr(0, build[i].length - 1);
                                    }
                                    cinfo[i] = "comment";
                                    token[i] = "T_comment";
                                    if (mcomm !== "noindent") {
                                        h();
                                    } else {
                                        level.push(0);
                                    }
                                } else if (token[i - 1] === "T_script") {
                                    level.push(0);
                                    if (scriptStart.test(build[i])) {
                                        test = true;
                                        build[i] = build[i].replace(scriptStart, "");
                                    } else if (cdataStart.test(build[i])) {
                                        cdata = cdataStart.exec(build[i]);
                                        build[i] = build[i].replace(cdataStart, "");
                                    }
                                    if (scriptEnd.test(build[i]) && !/(\/\/\-\->\s*)$/.test(build[i])) {
                                        test1 = true;
                                        build[i] = build[i].replace(scriptEnd, "");
                                    } else if (cdataEnd.test(build[i])) {
                                        cdata1 = cdataEnd.exec(build[i]);
                                        build[i] = build[i].replace(cdataEnd, "");
                                    }
                                    if (typeof jspretty === "function") {
                                        build[i] = jspretty({
                                            source: build[i],
                                            insize: msize,
                                            inchar: mchar,
                                            preserve: true,
                                            inlevel: 0,
                                            space: true,
                                            braces: args.indent,
                                            comments: mcomm
                                        });
                                    }
                                    if (test) {
                                        build[i] = "<!--\n" + build[i];
                                    } else if (cdata[0] !== "") {
                                        build[i] = cdata[0] + "\n" + build[i];
                                    }
                                    if (test1) {
                                        build[i] = build[i] + "\n-->";
                                    } else if (cdata1[0] !== "") {
                                        build[i] = build[i] + "\n" + cdata1[0];
                                    }
                                    build[i] = build[i].replace(/(\/\/(\s)+\-\->(\s)*)$/, "//-->").replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                                } else if (token[i - 1] === "T_style") {
                                    level.push(0);
                                    if (scriptStart.test(build[i])) {
                                        test = true;
                                        build[i] = build[i].replace(scriptStart, "");
                                    } else if (cdataStart.test(build[i])) {
                                        cdata = cdataStart.exec(build[i]);
                                        build[i] = build[i].replace(cdataStart, "");
                                    }
                                    if (scriptEnd.test(build[i]) && !/(\/\/\-\->\s*)$/.test(build[i])) {
                                        test1 = true;
                                        build[i].replace(scriptEnd, "");
                                    } else if (cdataEnd.test(build[i])) {
                                        cdata1 = cdataEnd.exec(build[i]);
                                        build[i] = build[i].replace(cdataEnd, "");
                                    }
                                    if (typeof cleanCSS === "function") {
                                        build[i] = cleanCSS({
                                            source: build[i],
                                            size: msize,
                                            character: mchar,
                                            comment: mcomm,
                                            alter: true
                                        });
                                    }
                                    if (test) {
                                        build[i] = "<!--\n" + build[i];
                                    } else if (cdata[0] !== "") {
                                        build[i] = cdata[0] + "\n" + build[i];
                                    }
                                    if (test1) {
                                        build[i] = build[i] + "\n-->";
                                    } else if (cdata1[0] !== "") {
                                        build[i] = build[i] + "\n" + cdata1[0];
                                    }
                                    build[i] = build[i].replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                                }
                            } else {
                                if (cinfo[i] === "comment" && mcomm !== "noindent") {
                                    if (build[i].charAt(0) === " ") {
                                        h();
                                    } else {
                                        level.push("x");
                                    }
                                } else if (cinfo[i] === "comment" && mcomm === "noindent") {
                                    level.push(0);
                                } else if (cinfo[i] === "content") {
                                    level.push("x");
                                } else if (cinfo[i] === "parse") {
                                    h();
                                } else if (cinfo[i] === "mixed_both") {
                                    h();
                                } else if (cinfo[i] === "mixed_start") {
                                    h();
                                } else if (cinfo[i] === "mixed_end") {
                                    build[i] = build[i].slice(0, build[i].length - 1);
                                    level.push("x");
                                } else if (cinfo[i] === "start") {
                                    h();
                                } else if (cinfo[i] === "end") {
                                    e();
                                } else if (cinfo[i] === "singleton") {
                                    if (svg === true) {
                                        if (cinfo[i - 1] === "start") {
                                            level.push(level[i - 1] + 1);
                                        } else {
                                            level.push(level[i - 1]);
                                        }
                                    } else {
                                        h();
                                    }
                                }
                            }
                            if ((cinfo[i] === "start" || cinfo[i] === "singleton") && token[i] !== "T_asp" && token[i] !== "T_php" && token[i] !== "T_ssi" && disqualify.test(build[i]) === false && build[i].substr(1).indexOf(" ") > 1) {
                                if (build[i].lastIndexOf("/>") === build[i].length - 2) {
                                    build[i] = attrib(build[i], "/>");
                                } else {
                                    build[i] = attrib(build[i], ">");
                                }
                            }
                        }
                    }());
                }());
                (function markup_beauty__apply() {
                    var tab = (function markup_beauty__apply_tab() {
                            var a = 0,
                                b = msize,
                                c = mchar,
                                d = [];
                            for (a = 0; a < b; a += 1) {
                                d.push(c);
                            }
                            return d.join("");
                        }()),
                        i = 0,
                        loop = build.length,
                        indents = "",
                        tab_math = function markup_beauty__apply_indentation(x) {
                            var a = 0,
                                b = (typeof level[i] === "number") ? level[i] : 0,
                                c = 0,
                                d = 0,
                                indent = [],
                                parse = [],
                                pad = function markup_beauty__apply_indentation_pad() {
                                    var s = indents,
                                        t = c;
                                    if (t === 0) {
                                        return s;
                                    }
                                    do {
                                        s += tab;
                                        t -= 1;
                                    } while (t > 0);
                                    return s;
                                };
                            for (a = 0; a < b; a += 1) {
                                indent.push(tab);
                            }
                            if (cinfo[i] === "mixed_both" && mwrap === 0) {
                                x = x.slice(0, x.length - 1);
                            }
                            indents = indent.join("");
                            x = "\n" + indents + x;
                            if (cinfo[i] === "parse" && /\[\s*</.test(build[i])) {
                                build[i] = build[i].replace(/\[\s+</g, "[<");
                                parse = build[i].split("");
                                b = parse.length;
                                for (a = 0; a < b; a += 1) {
                                    if (parse[a] === "[") {
                                        c += 1;
                                        parse[a] = "[\n" + pad();
                                    } else if (parse[a] === "]") {
                                        c -= 1;
                                        parse[a] = "\n" + pad() + "]";
                                    } else if (parse[a] === "<" && b > a + 3 && parse[a + 1] === "!" && parse[a + 2] === "-" && parse[a + 3] === "-") {
                                        if (a === 0 || parse[a - 1].charAt(0) !== "[") {
                                            parse[a] = "\n" + pad() + "<";
                                        }
                                        for (d = a + 4; d < b; d += 1) {
                                            if (parse[d - 2] === "-" && parse[d - 1] === "-" && parse[d] === ">") {
                                                a = d;
                                                break;
                                            }
                                        }
                                    } else if (parse[a] === "<" && (a === 0 || parse[a - 1].charAt(0) !== "[")) {
                                        parse[a] = "\n" + pad() + "<";
                                    }
                                }
                                x = parse.join("").replace(/\s>/g, ">");
                            }
                            return x;
                        },
                        end_math = function markup_beauty__apply_end(x) {
                            var a = 0,
                                b = 0,
                                indent = [];
                            for (b = i; b > 0; b -= 1) {
                                if (level[b] !== "x") {
                                    break;
                                }
                            }
                            for (a = 0; a < level[b]; a += 1) {
                                indent.push(tab);
                            }
                            x = "\n" + indent.join("") + x;
                            return x;
                        },
                        script_math = function markup_beauty__apply_script(x) {
                            var a = 0,
                                b = 0,
                                c = 0,
                                d = "",
                                indent = [];
                            if (level[i - 1] === "x") {
                                for (b = i - 1; b > 0; b -= 1) {
                                    if (cinfo[b] === "start") {
                                        a += 1;
                                    } else if (cinfo[b] === "end") {
                                        a -= 1;
                                    }
                                    if (level[b] !== "x") {
                                        break;
                                    }
                                }
                                if (cinfo[b] === "end") {
                                    a += 1;
                                }
                                for (c = 0; c < level[b] + a; c += 1) {
                                    indent.push(tab);
                                }
                            } else {
                                for (c = 0; c < level[i - 1] + 1; c += 1) {
                                    indent.push(tab);
                                }
                            }
                            d = indent.join("");
                            return "\n" + d + x.replace(/\n/g, "\n" + d);
                        },
                        text_wrap = function markup_beauty__apply_wrap() {
                            var a = i,
                                b = 0,
                                c = build[i].replace(/^(\s+)/, "").replace(/(\s+)$/, "").split(" "),
                                d = c.length - 1,
                                e = [c[0]],
                                f = c[0].length,
                                ind = (function markup_beauty__apply_wrap_ind() {
                                    var a = 0,
                                        b = [],
                                        c = level[i];
                                    for (a = i - 1; a > -1; a -= 1) {
                                        if (token[a] === "T_content" || (cinfo[a] === "end" && level[a] !== "x")) {
                                            if (cinfo[a] === "end" && level[i] !== "x" && level[i] !== indents.length / tab.length) {
                                                for (a = 0; a < c; a += 1) {
                                                    b.push(tab);
                                                }
                                                return b.join("");
                                            }
                                            return indents;
                                        }
                                        if (cinfo[a] !== "singleton" && cinfo[a] !== "end") {
                                            return indents + tab;
                                        }
                                    }
                                }());
                            if (c.length === 1) {
                                return;
                            }
                            if (level[i] === "x") {
                                for (a = i - 1; a > -1; a -= 1) {
                                    if (level[a] !== "x") {
                                        b += build[a].replace(indents, "").length;
                                        break;
                                    }
                                    b += build[a].length;
                                }
                            }
                            f += b;
                            if (c.length > 1 && c[0] !== "") {
                                if (f + c[1].length > mwrap) {
                                    e.push("\n");
                                    e.push(ind);
                                    f = 0;
                                } else {
                                    e.push(" ");
                                }
                            }
                            for (a = 1; a < d; a += 1) {
                                e.push(c[a]);
                                if (c[a].length + c[a + 1].length + 1 + f > mwrap) {
                                    e.push("\n");
                                    e.push(ind);
                                    f = 0;
                                } else {
                                    e.push(" ");
                                    f += 1 + c[a].length;
                                }
                            }
                            if (e.length > 1) {
                                e.pop();
                            }
                            if (e[e.length - 1] !== "\n" && i < loop - 1 && level[i + 1] === "x") {
                                f += build[i + 1].length;
                            }
                            if (f + c[d].length > mwrap) {
                                e.push("\n");
                                e.push(ind);
                            } else if (f === 0) {
                                e.push(ind);
                            } else {
                                e.push(" ");
                            }
                            e.push(c[d]);
                            build[i] = e.join("");
                        };
                    for (i = 0; i < loop; i += 1) {
                        if (mwrap > 0 && (cinfo[i] === "content" || cinfo[i] === "mixed_start" || cinfo[i] === "mixed_both" || cinfo[i] === "mixed_end")) {
                            text_wrap(build[i]);
                        }
                        if (cinfo[i] === "end" && (mforce || (cinfo[i - 1] !== "content" && cinfo[i - 1] !== "mixed_start"))) {
                            if (build[i].charAt(0) === " ") {
                                build[i] = build[i].substr(1);
                            }
                            if (level[i] !== "x" && cinfo[i - 1] !== "start") {
                                build[i] = end_math(build[i]);
                            }
                        } else if (cinfo[i] === "external" && mstyle === "indent") {
                            build[i] = script_math(build[i]);
                        } else if (level[i] !== "x" && (cinfo[i - 1] !== "content" && (cinfo[i - 1] !== "mixed_start" || mforce))) {
                            if (build[i].charAt(0) === " ") {
                                build[i] = build[i].substr(1);
                            }
                            build[i] = tab_math(build[i]);
                        }
                    }
                }());
                if (summary !== "diff") {
                    (function markup_beauty__report() {
                        var m = [],
                            g = cinfo.length,
                            f = sum.join("").length,
                            b = (function markup_beauty__report_tagTypesCount() {
                                var a = 0,
                                    b = [
                                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                    ],
                                    c = [
                                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                    ],
                                    d = [],
                                    e = [],
                                    f = [],
                                    h = [];
                                for (a = 0; a < g; a += 1) {
                                    switch (cinfo[a]) {
                                    case "end":
                                        b[1] += 1;
                                        c[1] += sum[a].length;
                                        if (sum[a].charAt(0) === " " && cinfo[a - 1] === "singleton") {
                                            c[1] -= 1;
                                            c[2] += 1;
                                        }
                                        break;
                                    case "singleton":
                                        b[2] += 1;
                                        c[2] += sum[a].length;
                                        if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            m.push(build[a]);
                                        }
                                        break;
                                    case "comment":
                                        b[3] += 1;
                                        c[3] += sum[a].length;
                                        break;
                                    case "content":
                                        b[4] += 1;
                                        c[4] += sum[a].length;
                                        break;
                                    case "mixed_start":
                                        b[5] += 1;
                                        c[5] += (sum[a].length - 1);
                                        break;
                                    case "mixed_end":
                                        b[6] += 1;
                                        c[6] += (sum[a].length - 1);
                                        break;
                                    case "mixed_both":
                                        b[7] += 1;
                                        c[7] += (sum[a].length - 2);
                                        break;
                                    case "parse":
                                        b[10] += 1;
                                        c[10] += sum[a].length;
                                        break;
                                    case "external":
                                        b[17] += 1;
                                        c[17] += sum[a].length;
                                        if (((build[a].indexOf("<script") !== -1 || build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            m.push(build[a]);
                                        }
                                        break;
                                    default:
                                        switch (token[a]) {
                                        case "T_tag_start":
                                            b[0] += 1;
                                            c[0] += sum[a].length;
                                            if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                                m.push(build[a]);
                                            }
                                            break;
                                        case "T_sgml":
                                            b[8] += 1;
                                            c[8] += sum[a].length;
                                            break;
                                        case "T_xml":
                                            b[9] += 1;
                                            c[9] += sum[a].length;
                                            break;
                                        case "T_ssi":
                                            b[11] += 1;
                                            c[11] += sum[a].length;
                                            break;
                                        case "T_asp":
                                            b[12] += 1;
                                            c[12] += sum[a].length;
                                            break;
                                        case "T_php":
                                            b[13] += 1;
                                            c[13] += sum[a].length;
                                            break;
                                        case "T_script":
                                            b[15] += 1;
                                            c[15] += sum[a].length;
                                            if (build[a].indexOf(" src") !== -1) {
                                                m.push(build[a]);
                                            }
                                            break;
                                        case "T_style":
                                            b[16] += 1;
                                            c[16] += sum[a].length;
                                            break;
                                        }
                                    }
                                }
                                d = [
                                    b[0] + b[1] + b[2] + b[3], b[4] + b[5] + b[6] + b[7], b[15] + b[16] + b[17], b[11] + b[12] + b[13]
                                ];
                                e = [
                                    c[0] + c[1] + c[2] + c[3], c[4] + c[5] + c[6] + c[7], c[15] + c[16] + c[17], c[11] + c[12] + c[13]
                                ];
                                f = [
                                    d[0], d[0], d[0], d[0], d[1], d[1], d[1], d[1], b[10], b[10], b[10], d[3], d[3], d[3], d[3], d[2], d[2], d[2]
                                ];
                                h = [
                                    e[0], e[0], e[0], e[0], e[1], e[1], e[1], e[1], c[10], c[10], c[10], e[3], e[3], e[3], e[3], e[2], e[2], e[2]
                                ];
                                b[2] = b[2] - d[3];
                                c[2] = c[2] - e[3];
                                return [
                                    b, c, d, e, f, h
                                ];
                            }()),
                            p = function markup_beauty__report_goodOrBad(x) {
                                var u = function markup_beauty__report_goodOrBad_extreme1(x) {
                                        if (b[3][x] === 0) {
                                            return "0.00%";
                                        }
                                        return "100.00%";
                                    },
                                    v = function markup_beauty__report_goodOrBad_extreme2(x) {
                                        if (b[2][x] === 0) {
                                            return "0.00%";
                                        }
                                        return "100.00%";
                                    },
                                    w = [],
                                    y = "",
                                    z = "";
                                switch (x) {
                                case 0:
                                    if ((b[2][x] / g) < 0.7) {
                                        y = "bad";
                                    } else {
                                        y = "good";
                                    }
                                    if ((b[3][x] / f) > 0.4) {
                                        z = "bad";
                                    } else {
                                        z = "good";
                                    }
                                    break;
                                case 1:
                                    if ((b[2][x] / g) < 0.25) {
                                        y = "bad";
                                    } else {
                                        y = "good";
                                    }
                                    if ((b[3][x] / f) < 0.6) {
                                        z = "bad";
                                    } else {
                                        z = "good";
                                    }
                                    break;
                                case 2:
                                    if ((b[2][x] / g) > 0.05) {
                                        y = "bad";
                                    } else {
                                        y = "good";
                                    }
                                    if ((b[3][x] / f) > 0.05) {
                                        z = "bad";
                                    } else {
                                        z = "good";
                                    }
                                    break;
                                }
                                w = ["</th><td>"];
                                w.push(b[2][x]);
                                w.push("</td><td>");
                                w.push(v(x));
                                w.push("</td><td class='");
                                w.push(y);
                                w.push("'>");
                                w.push(((b[2][x] / g) * 100).toFixed(2));
                                w.push("%</td><td>");
                                w.push(b[3][x]);
                                w.push("</td><td>");
                                w.push(u(x));
                                w.push("</td><td class='");
                                w.push(z);
                                w.push("'>");
                                w.push(((b[3][x] / f) * 100).toFixed(2));
                                w.push("%</td></tr>");
                                return w.join("");
                            },
                            o = (function markup_beauty__report_buildOutput() {
                                var a = 0,
                                    c = "",
                                    d = [],
                                    e = [],
                                    h = (function markup_beauty__report_buildOutput_resultTable() {
                                        var a = 0,
                                            c = [
                                                "*** Start Tags", "End Tags", "Singleton Tags", "Comments", "Flat String", "String with Space at Start", "String with Space at End", "String with Space at Start and End", "SGML", "XML", "Total Parsing Declarations", "SSI", "ASP", "PHP", "Total Server Side Tags", "*** Script Tags", "*** Style Tags", "JavaScript/CSS Code"
                                            ],
                                            d = [],
                                            h = "",
                                            l = "",
                                            z = b[0].length;
                                        for (a = 0; a < z; a += 1) {
                                            if (b[4][a] === 0) {
                                                h = "0.00%";
                                            } else if (b[0][a] === b[4][a]) {
                                                h = "100.00%";
                                            } else {
                                                h = ((b[0][a] / b[4][a]) * 100).toFixed(2) + "%";
                                            }
                                            if (b[5][a] === 0) {
                                                l = "0.00%";
                                            } else if (b[1][a] === b[5][a]) {
                                                l = "100.00%";
                                            } else {
                                                l = ((b[1][a] / b[5][a]) * 100).toFixed(2) + "%";
                                            }
                                            d = ["<tr><th>" + c[a]];
                                            d.push("</th><td>");
                                            d.push(b[0][a]);
                                            d.push("</td><td>");
                                            d.push(h);
                                            d.push("</td><td>");
                                            d.push(((b[0][a] / g) * 100).toFixed(2));
                                            d.push("%</td><td>");
                                            d.push(b[1][a]);
                                            d.push("</td><td>");
                                            d.push(l);
                                            d.push("</td><td>");
                                            d.push(((b[1][a] / f) * 100).toFixed(2));
                                            d.push("%</td></tr>");
                                            if (a === 3) {
                                                d.push("<tr><th>Total Common Tags");
                                                d.push(p(0));
                                                d.push("<tr><th colspan='7'>Content</th></tr>");
                                            } else if (a === 7) {
                                                d.push("<tr><th>Total Content");
                                                d.push(p(1));
                                                d.push("<tr><th colspan='7'>Parsing Declarations</th></tr>");
                                            } else if (a === 10) {
                                                d.push("<tr><th colspan='7'>Server Side Tags</th></tr>");
                                            } else if (a === 14) {
                                                d.push("<tr><th colspan='7'>Style and Script Code/Tags</th></tr>");
                                            } else if (a === 17) {
                                                d.push("<tr><th>Total Script and Style Tags/Code");
                                                d.push(p(2));
                                            }
                                            c[a] = d.join("");
                                        }
                                        return c.join("");
                                    }()),
                                    i = ["<div id='doc'>"],
                                    z = m.length;
                                i.push((function markup_beauty__report_buildOutput_content() {
                                    var a = 0,
                                        b = 0,
                                        z = g,
                                        h = [],
                                        i = [],
                                        j = 0,
                                        k = 0,
                                        l = [],
                                        m = [],
                                        n = [],
                                        o = "",
                                        p = [],
                                        w = [],
                                        x = "",
                                        punctuation = function markup_beauty__report_buildOutput_punctuation(y) {
                                            return y.replace(/(\,|\.|\?|\!|\:) /, " ");
                                        };
                                    for (a = 0; a < z; a += 1) {
                                        if (cinfo[a] === "content") {
                                            l.push(" ");
                                            l.push(build[a]);
                                        } else if (cinfo[a] === "mixed_start") {
                                            l.push(build[a]);
                                        } else if (cinfo[a] === "mixed_both") {
                                            l.push(build[a].substr(0, build[a].length));
                                        } else if (cinfo[a] === "mixed_end") {
                                            l.push(" ");
                                            l.push(build[a].substr(0, build[a].length));
                                        }
                                    }
                                    x = l.join("");
                                    if (x.length === 0) {
                                        return "";
                                    }
                                    x = x.substr(1, x.length).toLowerCase();
                                    w = x.replace(/\&nbsp;?/gi, " ").replace(/[a-z](\,|\.|\?|\!|\:) /gi, punctuation).replace(/(\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").split(" ");
                                    z = w.length;
                                    for (a = 0; a < z; a += 1) {
                                        if (w[a] !== "") {
                                            h.push([
                                                1, w[a]
                                            ]);
                                            j += 1;
                                            for (b = a + 1; b < z; b += 1) {
                                                if (w[b] === w[a]) {
                                                    h[h.length - 1][0] += 1;
                                                    w[b] = "";
                                                    j += 1;
                                                }
                                            }
                                        }
                                    }
                                    z = h.length;
                                    for (a = 0; a < z; a += 1) {
                                        k = a;
                                        for (b = a + 1; b < z; b += 1) {
                                            if (h[b][0] > h[k][0] && h[b][1] !== "") {
                                                k = b;
                                            }
                                        }
                                        o = h[k][1];
                                        if (o.length < 3 || o.length > 30 || !(/[a-zA-Z]/).test(o) || (/&\#?\w+;/).test(o) || o === "the" || o === "and" || o === "for" || o === "are" || o === "this" || o === "from" || o === "with" || o === "that") {
                                            m.push(h[k]);
                                        } else {
                                            m.push(h[k]);
                                            n.push(h[k]);
                                        }
                                        if (h[k] !== h[a]) {
                                            h[k] = h[a];
                                        } else {
                                            h[k] = [
                                                0, ""
                                            ];
                                        }
                                        if (n.length === 11) {
                                            break;
                                        }
                                    }
                                    if (m.length < 2) {
                                        return "";
                                    }
                                    b = m.length;
                                    for (a = 0; a < b; a += 1) {
                                        if (a > 9) {
                                            m[a] = "";
                                        } else {
                                            p[a] = (m[a + 1]) ? (m[a][0] / m[a + 1][0]).toFixed(2) : "1.00";
                                            m[a] = "<tr><th>" + (a + 1) + "</th><td>" + m[a][1].replace(/&/g, "&amp;") + "</td><td>" + m[a][0] + "</td><td>" + p[a] + "</td><td>" + ((m[a][0] / j) * 100).toFixed(2) + "%</td></tr>";
                                        }
                                    }
                                    if (m[10]) {
                                        m[10] = "";
                                    }
                                    if (n.length > 10) {
                                        b = 10;
                                    } else {
                                        b = n.length;
                                    }
                                    p = [];
                                    for (a = 0; a < b; a += 1) {
                                        p[a] = (n[a + 1]) ? (n[a][0] / n[a + 1][0]).toFixed(2) : "1.00";
                                        n[a] = "<tr><th>" + (a + 1) + "</th><td>" + n[a][1].replace(/&/g, "&amp;") + "</td><td>" + n[a][0] + "</td><td>" + p[a] + "</td><td>" + ((n[a][0] / j) * 100).toFixed(2) + "%</td></tr>";
                                    }
                                    if (n[10]) {
                                        n[10] = "";
                                    }
                                    if (b > 10) {
                                        n[n.length - 1] = "";
                                    }
                                    i.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrates <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content and the number of times they occurred.</caption>");
                                    i.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Percentage from ");
                                    i.push(j.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                    if (j > 1) {
                                        i.push(" Total");
                                    }
                                    i.push(" Word");
                                    if (j > 1) {
                                        i.push("s");
                                    }
                                    o = m.join("");
                                    x = n.join("");
                                    i.push("</th></tr></thead><tbody><tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                                    i.push(o);
                                    if (o !== x && n.length > 2) {
                                        i.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                        i.push(x);
                                    }
                                    i.push("</tbody></table>");
                                    return i.join("");
                                }()));
                                i.push("<table class='analysis' summary='Analysis of markup pieces.'><caption>Analysis of markup pieces.</caption><thead><tr><th>Type</th><th>Quantity of Tags/Content</th><th>Percentage Quantity in Section</th><th>Percentage Quantity of Total</th><th>** Character Size</th><th>Percentage Size in Section</th><th>Percentage Size of Total</th></tr></thead><tbody><tr><th>Total Pieces</th><td>");
                                i.push(g);
                                i.push("</td><td>100.00%</td><td>100.00%</td><td>");
                                i.push(f);
                                i.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Common Tags</th></tr>");
                                i.push(h);
                                d = [];
                                for (a = 0; a < z; a += 1) {
                                    if (m[a]) {
                                        e = ["<li>"];
                                        e.push(m[a].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;"));
                                        e.push("</li>");
                                        d[a] = e.join("");
                                    }
                                }
                                if (d.length > 0) {
                                    c = "<h4>HTML elements making HTTP requests:</h4><ul>" + d.join("") + "</ul>";
                                } else {
                                    c = "";
                                }
                                i.push("</tbody></table></div><p>* The number of requests is determined from the input submitted only and does not count the additional HTTP requests supplied from dynamically executed code, frames, iframes, css, or other external entities.</p><p>**");
                                i.push("Character size is measured from the individual pieces of tags and content specifically between minification and beautification.</p><p>*** The number of starting &lt;script&gt; and &lt;style&gt; tags is subtracted from the total number of start tags.");
                                i.push("The combination of those three values from the table above should equal the number of end tags or the code is in error.</p>");
                                i.push(c);
                                return i.join("");
                            }()),
                            r = function markup_beauty__report_ratios(x, y) {
                                return (((b[3][0] + x) / f) / ((b[3][1] * y) / f));
                            },
                            n = (function markup_beauty__report_efficiencyScore() {
                                var a = "",
                                    c = f / 7500,
                                    d = build.join("").length,
                                    e = args.source.length,
                                    h = 0,
                                    i = ["<p>If the input is content it receives an efficiency score of <strong>"],
                                    k = "",
                                    l = "",
                                    t = "",
                                    u = "";
                                a = c.toFixed(0);
                                if (c > 0) {
                                    c = (m.length - a) * 4;
                                } else {
                                    c = 0;
                                }
                                if (b[3][1] === 0) {
                                    b[2][1] = 0.00000001;
                                    b[3][1] = 0.00000001;
                                }
                                h = (((b[2][0] + b[2][2] - c) / g) / (b[2][1] / g));
                                k = (h / r(b[3][2], 1)).toPrecision(2);
                                l = (h / r(b[1][15], 1)).toPrecision(2);
                                t = (h / r(b[3][2], 4)).toPrecision(2);
                                u = (h / r(b[1][15], 4)).toPrecision(2);
                                if (k === l) {
                                    l = "";
                                    u = "";
                                } else {
                                    l = ", or <strong>" + l + "</strong> if inline script code and style tags are removed";
                                    u = ", or <strong>" + u + "</strong> if inline script code and style tags are removed";
                                }
                                i.push(k);
                                i.push("</strong>");
                                i.push(l);
                                i.push(". The efficiency score if this input is a large form or application is <strong>");
                                i.push(t);
                                i.push("</strong>");
                                i.push(u);
                                i.push(". Efficient markup achieves scores higher than 2.00 and excellent markup achieves scores higher than 4.00. The score reflects the highest number of tags to pieces of content where the weight of those tags is as small as possible compared to the weight of the content.");
                                i.push("The score is a performance metric only and is not associated with validity or well-formedness, but semantic code typically achieves the highest scores. All values are rounded to the nearest hundreth.</p><p><strong>Total input size:</strong> <em>");
                                i.push(e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                i.push("</em> characters</p><p><strong>Total output size:</strong> <em>");
                                i.push(d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                i.push("</em> characters</p><p><strong>* Total number of HTTP requests in supplied HTML:</strong> <em>");
                                i.push(m.length);
                                i.push("</em></p>");
                                return i.join("");
                            }()),
                            s = (function markup_beauty__report_summary() {
                                var a = 0,
                                    c = ["<p><strong>"],
                                    q = "";
                                if (b[0][0] + b[0][15] + b[0][16] !== b[0][1]) {
                                    q = "s";
                                    a = (b[0][0] + b[0][15] + b[0][16]) - b[0][1];
                                    if (a > 0) {
                                        if (a === 1) {
                                            q = "";
                                        }
                                        c.push(a);
                                        c.push(" more start tag");
                                        c.push(q);
                                        c.push(" than end tag");
                                        c.push(q);
                                        c.push("!");
                                    } else {
                                        if (a === -1) {
                                            q = "";
                                        }
                                        c.push(a * -1);
                                        c.push(" more end tag");
                                        c.push(q);
                                        c.push(" than start tag");
                                        c.push(q);
                                        c.push("!");
                                    }
                                    c.push("</strong> The combined total number of start tags, script tags, and style tags should equal the number of end tags. For HTML this problem may be solved by selecting the '<em>Presume SGML type HTML</em>' option.</p>");
                                } else {
                                    return "";
                                }
                                return c.join("");
                            }());
                        summary = s + n + o;
                    }());
                }
                token = [];
                cinfo = [];
                level = [];
                inner = [];
                sum = [];
                return build.join("").replace(/^\s+/, "");
            },
            diffview = function diffview(args) {
                var errorout = 0,
                    diffline = 0,
                    baseTextLines = (typeof args.baseTextLines === "string") ? args.baseTextLines : "Error: Cannot build diff view; baseTextLines is not defined.",
                    newTextLines = (typeof args.newTextLines === "string") ? args.newTextLines : "Error: Cannot build diff view; newTextLines is not defined.",
                    baseTextName = (typeof args.baseTextName === "string") ? args.baseTextName : "Base Source",
                    newTextName = (typeof args.newTextName === "string") ? args.newTextName : "New Source",
                    context = ((/^([0-9]+)$/).test(args.contextSize)) ? Number(args.contextSize) : -1,
                    tsize = ((/^([0-9]+)$/).test(args.tsize)) ? Number(args.tsize) : 4,
                    tchar = (typeof args.tchar === "string") ? args.tchar : " ",
                    inline = (args.inline === true) ? true : false,
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
                    bta = stringAsLines(baseTextLines),
                    nta = stringAsLines(newTextLines),
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
                                                //if (bxj[c][1] === a[i] && (bxj[c][0] === i || a[i] !== b[i] || i === ahi - 1 || a[i + 1] === b[i + 1])) {
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
                            errorout -= 1;
                            ax = a.split("");
                            bx = b.split("");
                            zx = Math.max(ax.length, bx.length);
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
                                if (e[0] !== "") {
                                    a = a.substr(n[0]);
                                }
                                if (f[0] !== "") {
                                    b = b.substr(n[1]);
                                }
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
                                g = a.split(" ");
                                h = b.split(" ");
                                j = Math.max(g.length, h.length);
                                l[0] += g[0].length;
                                l[1] += h[0].length;
                                for (i = 1; i < j; i += 1) {
                                    if (g[i] !== h[i] && typeof g[i] === "string" && typeof h[i] === "string") {
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
                                            break;
                                        }
                                    } else if (typeof g[i] === "string" && typeof h[i] === "string") {
                                        g[i] = " " + g[i];
                                        h[i] = " " + h[i];
                                    } else {
                                        break;
                                    }
                                    l[0] += g[i].length;
                                    l[1] += h[i].length;
                                }
                                if (m === false) {
                                    return;
                                }
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
                                /*x = u[u.length - 1],
                                    y = v[v.length - 1],
                                    z = false;
                                if (x !== "" && x === v[v.length - 2] && u.length > 0 && x.length > 0 && x.indexOf("<em>") < x.indexOf("</em>") && x.lastIndexOf("<em>") < x.lastIndexOf("</em>")) {
                                    for (i = k; i > -1; i -= 1) {
                                        if (ax[i].indexOf("</em>") > -1 || bx[i].indexOf("</em>") > -1) {
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
                                        if (ax[i].indexOf("<em>") > -1 || bx[i].indexOf("<em>") > -1) {
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
                                if (j > o) {
                                    u.push(s.join(""));
                                    v.push(t.join(""));
                                } else {
                                    u.push(ax.slice(i, o).join(""));
                                    v.push(bx.slice(i, o).join(""));
                                }
                                if (j === zx) {
                                    r += 1;
                                }
                            };
                            for (p = 0; p < zx; p += 1) {
                                if (r > zx - 1) {
                                    break;
                                }
                                compare();
                            }
                            c = ax.join("").replace(/\$#34;/g, "\"").replace(/\$#39;/g, "'").replace(/<\/em><em>/g, emerge);
                            d = bx.join("").replace(/\$#34;/g, "\"").replace(/\$#39;/g, "'").replace(/<\/em><em>/g, "");
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
                            if (change !== "equal") {
                                diffline += 1;
                            }
                            if (tab !== "") {
                                if (!btest && bta[be] !== nta[ne] && typeof bta[b + 1] === "string" && typeof nta[n] === "string" && btab[b + 1] === ntab[n] && btab[b] !== ntab[n] && (typeof nta[n - 1] !== "string" || btab[b] !== ntab[n - 1])) {
                                    btest = true;
                                } else if (!ntest && bta[be] !== nta[ne] && typeof nta[n + 1] === "string" && typeof bta[b] === "string" && ntab[n + 1] === btab[b] && ntab[n] !== btab[b] && (typeof bta[b - 1] !== "string" || ntab[n] !== btab[b - 1])) {
                                    ntest = true;
                                }
                            }
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
            },
            core = function core(api) {
                var auto = "",
                    autotest = false,
                    spacetest = (/^\s+$/g),
                    apioutput = "",
                    apidiffout = "",
                    ccomm = (typeof api.comments === "string" && api.comments === "noindent") ? "noindent" : "indent",
                    ccond = (typeof api.conditional === "boolean") ? api.conditional : false,
                    ccontent = (typeof api.content === "boolean") ? api.content : false,
                    ccontext = (api.context === "" || (/^(\s+)$/).test(api.context) || isNaN(api.context)) ? "" : Number(api.context),
                    ccsvchar = (typeof api.csvchar === "string" && api.csvchar.length > 0) ? api.csvchar : ",",
                    cdiff = (typeof api.diff === "string" && api.diff.length > 0) ? api.diff : "Diff sample is missing.",
                    cdiffcomments = (typeof api.diffcomments === "boolean") ? api.diffcomments : false,
                    cdifflabel = (typeof api.difflabel === "string" && api.difflabel.length > 0) ? api.difflabel : "new",
                    cdiffview = (typeof api.diffview === "string" && api.diffview === "inline") ? "inline" : "sidebyside",
                    cforce = (typeof api.force_indent === "boolean") ? api.force_indent : false,
                    chtml = ((typeof api.html === "boolean" && api.html === true) || (typeof api.html === "string" && api.html === "html-yes")) ? true : false,
                    cinchar = (typeof api.inchar === "string" && api.inchar.length > 0) ? api.inchar : " ",
                    cindent = (typeof api.indent === "string" && api.indent === "allman") ? "allman" : "",
                    cinlevel = (isNaN(api.inlevel) || Number(api.inlevel) < 1) ? 0 : Number(api.inlevel),
                    cinsize = (isNaN(api.insize)) ? 4 : Number(api.insize),
                    cjsscope = (typeof api.jsscope === "boolean") ? api.jsscope : false,
                    clang = (typeof api.lang === "string" && (api.lang === "javascript" || api.lang === "css" || api.lang === "markup" || api.lang === "html" || api.lang === "csv" || api.lang === "text")) ? api.lang : "auto",
                    cmode = (typeof api.mode === "string" && (api.mode === "minify" || api.mode === "beautify")) ? api.mode : "diff",
                    cpreserve = (typeof api.preserve === "boolean") ? api.preserve : true,
                    cquote = (typeof api.quote === "boolean") ? api.quote : false,
                    csemicolon = (typeof api.semicolon === "boolean") ? api.semicolon : false,
                    csource = (typeof api.source === "string" && api.source.length > 0) ? api.source : "Source sample is missing.",
                    csourcelabel = (typeof api.sourcelabel === "string" && api.sourcelabel.length > 0) ? api.sourcelabel : "base",
                    cspace = (typeof api.space === "boolean") ? api.space : true,
                    cstyle = (typeof api.style === "string" && api.style === "noindent") ? "noindent" : "indent",
                    ctopcoms = (typeof api.topcoms === "boolean") ? api.topcoms : false,
                    cwrap = (isNaN(api.wrap)) ? 0 : Number(api.wrap),
                    proctime = function core__proctime() {
                        var d = "",
                            e = "",
                            f = 0,
                            h = 0,
                            g = new Date(),
                            b = ((g.getTime() - startTime) / 1000),
                            c = b.toFixed(3),
                            plural = function core__proctime_plural(x, y) {
                                var a = "";
                                if (x > 1) {
                                    a = x + y + "s ";
                                } else {
                                    a = x + y + " ";
                                }
                                return a;
                            },
                            minute = function core__proctime_minute() {
                                d = (b / 60).toFixed(1);
                                f = Number(d.toString().split(".")[0]);
                                c = (b - (f * 60)).toFixed(3);
                                d = plural(d, " minute");
                            };
                        if (b >= 60 && b < 3600) {
                            minute();
                        } else if (b >= 3600) {
                            e = (b / 3600).toFixed(1);
                            h = Number(e.toString().split(".")[0]);
                            b = b - (h * 3600);
                            e = plural(e, " hour");
                            minute();
                        }
                        return "<p><strong>Execution time:</strong> <em>" + e + d + c + "</em> seconds</p>";
                    },
                    pdcomment = function core__pdcomment() {
                        var a = "",
                            b = csource.length,
                            c = csource.indexOf("/*prettydiff.com") + 16,
                            d = true,
                            e = [],
                            f = -1,
                            g = 0,
                            h = [],
                            i = "";
                        if (csource.indexOf("/*prettydiff.com") === -1 && cdiff.indexOf("/*prettydiff.com") === -1) {
                            return;
                        }
                        if (c === 15 && typeof cdiff === "string") {
                            c = cdiff.indexOf("/*prettydiff.com") + 16;
                            d = false;
                        } else if (c === 15) {
                            return;
                        }
                        for (c; c < b; c += 1) {
                            if (d) {
                                if (csource.charAt(c) === "*" && csource.charAt(c + 1) && csource.charAt(c + 1) === "/") {
                                    break;
                                }
                                h.push(csource.charAt(c));
                            } else {
                                if (cdiff.charAt(c) === "*" && cdiff.charAt(c + 1) && cdiff.charAt(c + 1) === "/") {
                                    break;
                                }
                                h.push(cdiff.charAt(c));
                            }
                        }
                        a = h.join("").toLowerCase();
                        b = a.length;
                        for (c = 0; c < b; c += 1) {
                            if ((!a.charAt(c - 1) || a.charAt(c - 1) !== "\\") && (a.charAt(c) === "\"" || a.charAt(c) === "'")) {
                                if (i === "") {
                                    i = a.charAt(c);
                                } else {
                                    i = "";
                                }
                            }
                            if (i === "") {
                                if (a.charAt(c) === ",") {
                                    g = f + 1;
                                    f = c;
                                    e.push(a.substring(g, f).replace(/^(\s*)/, "").replace(/(\s*)$/, ""));
                                }
                            }
                        }
                        g = f + 1;
                        f = a.length;
                        e.push(a.substring(g, f).replace(/^(\s*)/, "").replace(/(\s*)$/, ""));
                        i = "";
                        b = e.length;
                        h = [];
                        for (c = 0; c < b; c += 1) {
                            a = e[c].length;
                            for (g = 0; g < a; g += 1) {
                                if (e[c].indexOf(":") === -1) {
                                    e[c] = "";
                                    break;
                                } else {
                                    h = [];
                                }
                                if ((!e[c].charAt(g - 1) || e[c].charAt(g - 1) !== "\\") && (e[c].charAt(g) === "\"" || e[c].charAt(g) === "'")) {
                                    if (i === "") {
                                        i = e[c].charAt(g);
                                    } else {
                                        i = "";
                                    }
                                }
                                if (i === "") {
                                    if (e[c].charAt(g) === ":") {
                                        h.push(e[c].substring(0, g).replace(/(\s*)$/, ""));
                                        h.push(e[c].substring(g + 1).replace(/^(\s*)/, ""));
                                        if (h[1].charAt(0) === h[1].charAt(h[1].length - 1) && h[1].charAt(h[1].length - 2) !== "\\" && (h[1].charAt(0) === "\"" || h[1].charAt(0) === "'")) {
                                            h[1] = h[1].substring(1, h[1].length - 1);
                                        }
                                        e[c] = h;
                                        break;
                                    }
                                }
                            }
                        }
                        for (c = 0; c < b; c += 1) {
                            if (e[c][1]) {
                                if (e[c][0] === "api.mode") {
                                    if (e[c][1] === "beautify") {
                                        cmode = "beautify";
                                    } else if (e[c][1] === "minify") {
                                        cmode = "minify";
                                    } else if (e[c][1] === "diff") {
                                        cmode = "diff";
                                    }
                                } else if (e[c][0] === "api.lang") {
                                    if (e[c][1] === "auto") {
                                        clang = "auto";
                                    } else if (e[c][1] === "javascript") {
                                        clang = "javascript";
                                    } else if (e[c][1] === "css") {
                                        clang = "csv";
                                    } else if (e[c][1] === "csv") {
                                        clang = "csv";
                                    } else if (e[c][1] === "markup") {
                                        clang = "markup";
                                    } else if (e[c][1] === "text") {
                                        clang = "text";
                                    }
                                } else if (e[c][0] === "api.csvchar") {
                                    ccsvchar = e[c][1];
                                } else if (e[c][0] === "api.insize" && !/\D/.test(e[c][1])) {
                                    cinsize = e[c][1];
                                } else if (e[c][0] === "api.inchar") {
                                    cinchar = e[c][1];
                                } else if (e[c][0] === "api.comments") {
                                    if (e[c][1] === "indent") {
                                        ccomm = "indent";
                                    } else if (e[c][1] === "noindent") {
                                        ccomm = "noindent";
                                    }
                                } else if (e[c][0] === "api.indent") {
                                    if (e[c][1] === "knr") {
                                        cindent = "knr";
                                    } else if (e[c][1] === "allman") {
                                        cindent = "allman";
                                    }
                                } else if (e[c][0] === "api.style") {
                                    if (e[c][1] === "indent") {
                                        cstyle = "indent";
                                    } else if (e[c][1] === "noindent") {
                                        cstyle = "noindent";
                                    }
                                } else if (e[c][0] === "api.html") {
                                    if (e[c][1] === "html-no") {
                                        chtml = "html-no";
                                    } else if (e[c][1] === "html-yes") {
                                        chtml = "html-yes";
                                    }
                                } else if (e[c][0] === "api.context" && (!/\D/.test(e[c][1]) || e[c][1] === "")) {
                                    ccontext = e[c][1];
                                } else if (e[c][0] === "api.content") {
                                    if (e[c][1] === "true") {
                                        ccontent = true;
                                    } else if (e[c][1] === "false") {
                                        ccontent = false;
                                    }
                                } else if (e[c][0] === "api.quote") {
                                    if (e[c][1] === "true") {
                                        cquote = true;
                                    } else if (e[c][1] === "false") {
                                        cquote = false;
                                    }
                                } else if (e[c][0] === "api.semicolon") {
                                    if (e[c][1] === "true") {
                                        csemicolon = true;
                                    } else if (e[c][1] === "false") {
                                        csemicolon = false;
                                    }
                                } else if (e[c][0] === "api.diffview") {
                                    if (e[c][1] === "sidebyside") {
                                        cdiffview = "sidebyside";
                                    } else if (e[c][1] === "inline") {
                                        cdiffview = "inline";
                                    }
                                } else if (e[c][0] === "api.sourcelabel") {
                                    csourcelabel = e[c][1];
                                } else if (e[c][0] === "api.difflabel") {
                                    cdifflabel = e[c][1];
                                } else if (e[c][0] === "api.topcoms") {
                                    if (e[c][1] === "true") {
                                        ctopcoms = true;
                                    } else if (e[c][1] === "false") {
                                        ctopcoms = false;
                                    }
                                } else if (e[c][0] === "api.force_indent") {
                                    if (e[c][1] === "true") {
                                        cforce = true;
                                    } else if (e[c][1] === "false") {
                                        cforce = false;
                                    }
                                } else if (e[c][0] === "api.conditional") {
                                    if (e[c][1] === "true") {
                                        ccond = true;
                                    } else if (e[c][1] === "false") {
                                        ccond = false;
                                    }
                                } else if (e[c][0] === "api.diffcomments") {
                                    if (e[c][1] === "true") {
                                        cdiffcomments = true;
                                    } else if (e[c][1] === "false") {
                                        cdiffcomments = false;
                                    }
                                } else if (e[c][0] === "api.jsspace") {
                                    if (e[c][1] === "true") {
                                        cspace = true;
                                    } else if (e[c][1] === "false") {
                                        cspace = false;
                                    }
                                } else if (e[c][0] === "api.jsscope") {
                                    if (e[c][1] === "true") {
                                        cjsscope = true;
                                    } else if (e[c][1] === "false") {
                                        cjsscope = false;
                                    }
                                } else if (e[c][0] === "api.jslines") {
                                    if (e[c][1] === "true") {
                                        cpreserve = true;
                                    } else if (e[c][1] === "false") {
                                        cpreserve = false;
                                    }
                                } else if (e[c][0] === "api.inlevel") {
                                    if (e[c][1] === "true") {
                                        cinlevel = true;
                                    } else if (e[c][1] === "false") {
                                        cinlevel = false;
                                    }
                                }
                            }
                        }
                    };
                if (csource === "Source sample is missing.") {
                    return [
                        "Error: Source sample is missing.", ""
                    ];
                }
                if (cdiff === "Diff sample is missing." && cmode === "diff") {
                    return [
                        "Error: Diff sample is missing.", ""
                    ];
                }
                if (clang === "html") {
                    chtml = true;
                    clang = "markup";
                }
                if (clang === "auto") {
                    (function core__auto() {
                        var a = csource,
                            b = a.replace(/\[[a-zA-Z][\w\-]*\=("|')?[a-zA-Z][\w\-]*("|')?\]/g, "").split(""),
                            c = b.length,
                            d = 0,
                            e = false,
                            f = "",
                            g = false;
                        autotest = true;
                        if (!/^([\s\w]*<)/.test(a) && !/(>[\s\w]*)$/.test(a)) {
                            for (d = 1; d < c; d += 1) {
                                if (!e) {
                                    if (b[d] === "*" && b[d - 1] === "/") {
                                        b[d - 1] = "";
                                        e = true;
                                    } else if (!g && b[d] === "f" && d < c - 6 && b[d + 1] === "i" && b[d + 2] === "l" && b[d + 3] === "t" && b[d + 4] === "e" && b[d + 5] === "r" && b[d + 6] === ":") {
                                        g = true;
                                    }
                                } else if (e && b[d] === "*" && d !== c - 1 && b[d + 1] === "/") {
                                    e = false;
                                    b[d] = "";
                                    b[d + 1] = "";
                                } else if (g && b[d] === ";") {
                                    g = false;
                                    b[d] = "";
                                }
                                if (e || g) {
                                    b[d] = "";
                                }
                            }
                            f = b.join("");
                            if (/^(\s*\{)/.test(a) && /(\}\s*)$/.test(a) && a.indexOf(",") !== -1) {
                                clang = "javascript";
                                auto = "JSON";
                            } else if (/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i.test(a) && (/(var\s+[a-z]+[a-zA-Z0-9]*)/.test(a) || /(\=\s*function)|(\s*function\s+(\w*\s+)?\()/.test(a) || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a))) {
                                if (a.indexOf("(") > -1 || a.indexOf("=") > -1 || (a.indexOf(";") > -1 && a.indexOf("{") > -1) || cmode !== "diff") {
                                    clang = "javascript";
                                    auto = "JavaScript";
                                } else {
                                    clang = "text";
                                    auto = "Plain Text";
                                }
                            } else if (/^(\s*[\$\.#@a-z0-9])|^(\s*\/\*)|^(\s*\*\s*\{)/i.test(a) && !/^(\s*if\s*\()/.test(a) && a.indexOf("{") !== -1 && !(/\=\s*(\{|\[|\()/).test(f) && !(/(\+|\-|\=|\*|\?)\=/).test(f) && !(/function(\s+\w+)*\s*\(/).test(f)) {
                                if (/^(\s*return;?\s*\{)/.test(a) && /(\};?\s*)$/.test(a)) {
                                    clang = "javascript";
                                    auto = "JavaScript";
                                } else {
                                    clang = "css";
                                    auto = "CSS";
                                }
                            } else if (cmode === "diff") {
                                clang = "text";
                                auto = "unknown";
                            } else {
                                clang = "javascript";
                                auto = "JavaScript";
                            }
                        } else if ((/(>[\w\s:]*)?<(\/|\!)?[\w\s:\-\[]+/.test(a) && /^([\s\w]*<)/.test(a) && /(>[\s\w]*)$/.test(a)) || (/^(\s*<s((cript)|(tyle)))/i.test(a) && /(<\/s((cript)|(tyle))>\s*)$/i.test(a))) {
                            clang = "markup";
                            if (/^(\s*<\?xml)/.test(a)) {
                                if (/XHTML\s+1\.1/.test(a) || /XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/.test(a)) {
                                    auto = "XHTML";
                                } else {
                                    auto = "XML";
                                }
                            } else if (/<[a-zA-Z]/.test(a) === false && /<\![A-Z]/.test(a)) {
                                auto = "SGML";
                            } else if (chtml === true || /^(\s*<\!doctype html>)/i.test(a) || (/^(\s*<\!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/.test(a) && /XHTML\s+1\.1/.test(a) === false && /XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/.test(a) === false)) {
                                chtml = true;
                                auto = "HTML";
                            } else {
                                auto = "markup";
                            }
                        } else if (cmode === "diff") {
                            clang = "text";
                            auto = "unknown";
                        } else {
                            clang = "javascript";
                            auto = "JavaScript";
                        }
                        if (auto === "unknown") {
                            if (cmode === "diff") {
                                auto = "Plain Text";
                            } else {
                                auto = "JavaScript";
                            }
                            auto = "<p>Language set to <strong>auto</strong>, but language could not be determined. Language defaulted to <em>" + auto + "</em>.</p>";
                        } else {
                            auto = "<p>Language set to <strong>auto</strong>. Presumed language is <em>" + auto + "</em>.</p>";
                        }
                        a = "";
                        b = [];
                    }());
                }
                pdcomment();
                if (cmode === "minify") {
                    if (clang === "css") {
                        apioutput = jsmin({
                            source: csource,
                            level: 3,
                            type: "css",
                            alter: true,
                            fcomment: ctopcoms
                        });
                    } else if (clang === "csv") {
                        apioutput = csvmin(csource, ccsvchar);
                    } else if (clang === "markup") {
                        apioutput = markupmin({
                            source: csource,
                            comments: "",
                            presume_html: chtml,
                            top_comments: ctopcoms,
                            conditional: ccond
                        });
                    } else if (clang === "text") {
                        apioutput = csource;
                    } else {
                        apioutput = jsmin({
                            source: csource,
                            level: 2,
                            type: "javascript",
                            alter: true,
                            fcomment: ctopcoms
                        });
                    }
                    return (function core__minifyReport() {
                        var sizediff = function core__minifyReport_score() {
                                var a = 0,
                                    b = 0,
                                    c = csource,
                                    d = c.length,
                                    f = 0,
                                    g = apioutput.length,
                                    h = d - g,
                                    i = 0,
                                    j = 0,
                                    k = ((h / d) * 100).toFixed(2) + "%",
                                    l = "";
                                for (a = 0; a < d; a += 1) {
                                    if (c.charAt(a) === "\n") {
                                        b += 1;
                                    }
                                }
                                f = csource.length + b;
                                i = f - g;
                                j = f - d + 1;
                                l = ((i / f) * 100).toFixed(2) + "%";
                                return "<div id='doc'><table class='analysis' summary='Minification efficiency report'><caption>Minification efficiency report</caption><thead><tr><th colspan='2'>Output Size</th><th colspan='2'>Number of Lines From Input</th></tr></thead><tbody><tr><td colspan='2'>" + g + "</td><td colspan='2'>" + (b + 1) + "</td></tr><tr><th>Operating System</th><th>Input Size</th><th>Size Difference</th><th>Percentage of Decrease</th></tr><tr><th>Unix/Linux</th><td>" + d + "</td><td>" + h + "</td><td>" + k + "</td></tr><tr><th>Windows</th><td>" + f + "</td><td>" + i + "</td><td>" + l + "</td></tr></tbody></table></div>";
                            };
                        if (autotest === true) {
                            return [
                                apioutput, proctime() + auto + sizediff()
                            ];
                        }
                        return [
                            apioutput, proctime() + sizediff()
                        ];
                    }());
                }
                if (cmode === "beautify") {
                    if (clang === "css") {
                        apioutput = cleanCSS({
                            source: csource,
                            size: cinsize,
                            character: cinchar,
                            comment: ccomm,
                            alter: true
                        });
                        apidiffout = summary;
                    } else if (clang === "csv") {
                        apioutput = csvbeauty(csource, ccsvchar);
                        apidiffout = "";
                    } else if (clang === "markup") {
                        apioutput = markup_beauty({
                            source: csource,
                            insize: cinsize,
                            inchar: cinchar,
                            mode: "beautify",
                            comments: ccomm,
                            style: cstyle,
                            html: chtml,
                            force_indent: cforce,
                            wrap: cwrap
                        });
                        apidiffout = summary;
                        if (cinchar !== "\t") {
                            apioutput = apioutput.replace(/\n[\t]* \/>/g, "");
                        }
                    } else if (clang === "text") {
                        apioutput = csource;
                        apidiffout = "";
                    } else {
                        apioutput = jspretty({
                            source: csource,
                            insize: cinsize,
                            inchar: cinchar,
                            preserve: cpreserve,
                            inlevel: cinlevel,
                            space: cspace,
                            braces: cindent,
                            comments: ccomm,
                            jsscope: cjsscope
                        });
                        apidiffout = summary;
                    }
                    if (apidiffout === false) {
                        apidiffout = "";
                    }
                    if (autotest === true && clang !== "csv" && clang !== "text") {
                        return [
                            apioutput, proctime() + auto + apidiffout
                        ];
                    }
                    return [
                        apioutput, proctime() + apidiffout
                    ];
                }
                if (cmode === "diff") {
                    summary = "diff";
                    if (clang === "css") {
                        if (cdiffcomments === true) {
                            apioutput = csource;
                            apidiffout = cdiff;
                        } else {
                            apioutput = jsmin({
                                source: csource,
                                level: 3,
                                type: "css",
                                alter: false,
                                fcomment: ctopcoms
                            });
                            apidiffout = jsmin({
                                source: cdiff,
                                level: 3,
                                type: "css",
                                alter: false,
                                fcomment: ctopcoms
                            });
                        }
                        apioutput = cleanCSS({
                            source: apioutput,
                            size: cinsize,
                            character: cinchar,
                            comment: ccomm,
                            alter: false
                        });
                        apidiffout = cleanCSS({
                            source: apidiffout,
                            size: cinsize,
                            character: cinchar,
                            comment: ccomm,
                            alter: false
                        });
                    } else if (clang === "csv") {
                        apioutput = csvbeauty(csource, ccsvchar);
                        apidiffout = csvbeauty(cdiff, ccsvchar);
                    } else if (clang === "markup") {
                        if (cdiffcomments === true) {
                            apioutput = markup_beauty({
                                source: csource,
                                insize: cinsize,
                                inchar: cinchar,
                                mode: "beautify",
                                comments: ccomm,
                                style: cstyle,
                                html: chtml,
                                content: ccontent,
                                force_indent: cforce,
                                conditional: ccond,
                                wrap: cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                            apidiffout = markup_beauty({
                                source: cdiff,
                                insize: cinsize,
                                inchar: cinchar,
                                mode: "beautify",
                                comments: ccomm,
                                style: cstyle,
                                html: chtml,
                                content: ccontent,
                                force_indent: cforce,
                                conditional: ccond,
                                wrap: cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                        } else {
                            apioutput = markup_beauty({
                                source: csource,
                                insize: cinsize,
                                inchar: cinchar,
                                mode: "diff",
                                comments: ccomm,
                                style: cstyle,
                                html: chtml,
                                content: ccontent,
                                force_indent: cforce,
                                conditional: ccond,
                                wrap: cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                            apidiffout = markup_beauty({
                                source: cdiff,
                                insize: cinsize,
                                inchar: cinchar,
                                mode: "diff",
                                comments: ccomm,
                                style: cstyle,
                                html: chtml,
                                content: ccontent,
                                force_indent: cforce,
                                conditional: ccond,
                                wrap: cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                        }
                    } else if (clang === "text") {
                        apioutput = csource;
                        apidiffout = cdiff;
                    } else {
                        if (cdiffcomments === true) {
                            apioutput = jspretty({
                                source: csource,
                                insize: cinsize,
                                inchar: cinchar,
                                preserve: cpreserve,
                                inlevel: cinlevel,
                                space: cspace,
                                braces: cindent,
                                comments: ccomm,
                                jsscope: false
                            });
                            apidiffout = jspretty({
                                source: cdiff,
                                insize: cinsize,
                                inchar: cinchar,
                                preserve: cpreserve,
                                inlevel: cinlevel,
                                space: cspace,
                                braces: cindent,
                                comments: ccomm,
                                jsscope: false
                            });
                        } else {
                            apioutput = jsmin({
                                source: csource,
                                level: 3,
                                type: "javascript",
                                alter: false,
                                fcomments: false
                            });
                            apioutput = jspretty({
                                source: apioutput,
                                insize: cinsize,
                                inchar: cinchar,
                                preserve: cpreserve,
                                inlevel: cinlevel,
                                space: cspace,
                                braces: cindent,
                                comments: ccomm,
                                jsscope: false
                            });
                            apidiffout = jsmin({
                                source: cdiff,
                                level: 3,
                                type: "javascript",
                                alter: false,
                                fcomments: false
                            });
                            apidiffout = jspretty({
                                source: apidiffout,
                                insize: cinsize,
                                inchar: cinchar,
                                preserve: cpreserve,
                                inlevel: cinlevel,
                                space: cspace,
                                braces: cindent,
                                comments: ccomm,
                                jsscope: false
                            });
                        }
                    }
                    if (cquote === true) {
                        apioutput = apioutput.replace(/'/g, "\"");
                        apidiffout = apidiffout.replace(/'/g, "\"");
                    }
                    if (csemicolon === true) {
                        apioutput = apioutput.replace(/;\n/g, "\n");
                        apidiffout = apidiffout.replace(/;\n/g, "\n");
                    }
                    if (csourcelabel === "" || spacetest.test(csourcelabel)) {
                        csourcelabel = "Base Text";
                    }
                    if (cdifflabel === "" || spacetest.test(cdifflabel)) {
                        cdifflabel = "New Text";
                    }
                    if (cdiffview === "inline") {
                        cdiffview = true;
                    }
                    return (function core__diff() {
                        var a = [],
                            s = "s",
                            t = "s",
                            achar = "";
                        if (apioutput === "Error: This does not appear to be JavaScript." || apidiffout === "Error: This does not appear to be JavaScript.") {
                            a[1] = [
                                "<p><strong>Error:</strong> Please try using the option labeled <em>Plain Text (diff only)</em>. <span style='display:block'>The input does not appear to be markup, CSS, or JavaScript.</span></p>", 0, 0
                            ];
                        } else {
                            if (clang !== "text") {
                                achar = cinchar;
                            }
                            a[1] = diffview({
                                baseTextLines: apioutput,
                                newTextLines: apidiffout,
                                baseTextName: csourcelabel,
                                newTextName: cdifflabel,
                                contextSize: ccontext,
                                inline: cdiffview,
                                tchar: achar,
                                tsize: cinsize
                            });
                            if (a[1][2] === 1) {
                                t = "";
                                if (a[1][1] === 0) {
                                    s = "";
                                }
                            }
                        }
                        a[0] = "<p><strong>Number of differences:</strong> <em>" + (a[1][1] + a[1][2]) + "</em> difference" + s + " from <em>" + a[1][2] + "</em> line" + t + " of code.</p>";
                        if (autotest === true) {
                            return [
                                a[1][0], proctime() + auto + a[0]
                            ];
                        }
                        return [
                            a[1][0], proctime() + a[0]
                        ];
                    }());
                }
            };
        return core(api);
    },
    //the edition values use the format YYMMDD for dates.
    edition = {
        charDecoder: 121231, //charDecoder library
        cleanCSS: 130204, //cleanCSS library
        css: 130309, //diffview.css file
        csvbeauty: 121127, //csvbeauty library
        csvmin: 121127, //csvmin library
        diffview: 130311, //diffview library
        documentation: 121203, //documentation.xhtml
        jsmin: 121223, //jsmin library (fulljsmin.js)
        jspretty: 130313, //jspretty library
        markup_beauty: 130312, //markup_beauty library
        markupmin: 130312, //markupmin library
        prettydiff: 130313, //this file
        webtool: 121227, //prettydiff.com.xhtml
        api: {
            dom: 130310,
            nodeLocal: 130113,
            nodeService: 121106,
            wsh: 130113
        },
        latest: 0
    };
edition.latest = (function edition_latest() {
    "use strict";
    return Math.max(edition.charDecoder, edition.cleanCSS, edition.css, edition.csvbeauty, edition.csvmin, edition.diffview, edition.documentation, edition.jsmin, edition.jspretty, edition.markup_beauty, edition.markupmin, edition.prettydiff, edition.webtool, edition.api.dom, edition.api.nodeLocal, edition.api.nodeService, edition.api.wsh);
}());
if (typeof exports === "object" || typeof exports === "function") {
    exports.api = function commonjs(x) {
        "use strict";
        return prettydiff(x);
    };
}