/* jsmin.js - 2006-08-31
 Author: Franck Marcia
 This work is an adaptation of jsminc.c published by Douglas Crockford.
 Permission is hereby granted to use the Javascript version under the
 same conditions as the jsmin.c on which it is based.

 jsmin.c
 2006-05-04

 Copyright (c) 2002 Douglas Crockford  (www.crockford.com)

 Permission is hereby granted, free of charge, to any person obtaining a
 copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be included
 in all copies or substantial portions of the Software.

 The Software shall be used for Good, not Evil.

 Extended by Austin Cheney to lend support for minification of CSS for
 Pretty Diff tool at http://prettydiff.com/

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 Arguements:

 * comment allows a user to pass in an extraneous string that is
 returned to the front of the input.
 * input is the source code to manipulate.
 * level is the degree of minification strengthness.  For Pretty Diff
 the level is set to the highest value for the strongest possible
 minification.
 * type sets the code language for input.  If the value is "css" then
 jsmin presumes CSS language, otherwise jsmin defaults to JavaScript
 * alter is used for CSS processing only.  This argument determines
 whether or not the source code should be alter so to achieve a
 stronger minification resuling in smaller output.

 */
var jsmin = function jsmin(args) {
        "use strict";
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

            //blockspace normalizes whitespace at the front of any
            //retained comments.
            blockspace = function jsmin__blockspace(x) {
                var y = x.replace(/\n/g, "");
                x = x.substr(1);
                if (x.indexOf("\n") === 0 && y === "") {
                    return "\n\n";
                }
                if (x.indexOf("\n") > -1) {
                    return "\n\n ";
                }
                return "\n ";
            },

            //isAlphanum -- return true if the character is a letter,
            //digit, underscore, dollar sign, or non-ASCII character.
            isAlphanum = function jsmin__isAlphanum(c) {
                if (typeof c === "string") {
                    return c !== EOF && (ALNUM.indexOf(c) > -1 || c.charCodeAt(0) > 126);
                }
            },

            //jsasiq is a response to a regular expression and only
            //serves to verify the white space in question contains a
            //new line character
            jsasiq = function jsmin__jsasiq(x) {
                if (x.indexOf("\n") === -1) {
                    return x;
                }
                x = x.split("");
                x[0] = x[0] + ";";
                return x.join("");
            },

            //semiword ensures that a semicolon is inserted for newlines
            //following:  return, continue, break, throw
            semiword = function jsmin__semiword(x) {
                var aa = x.replace(/\s+/, "");
                if (x.indexOf("\n") > -1) {
                    return aa + ";";
                }
                return aa + " ";
            },

            //asifix determines whether "}" or ")" need to be followed
            //by a semicolon during automatic semicolon insertion.  This
            //part cannot be performed with simple minification
            //reduction or a regular expression due to nesting.  Instead
            //this one aspect of automatic semicolon must be treated
            //as a logical irregularity of a regular syntax, much like
            //deducing XML.
            asiFix = function jsmin__asiFix(y) {
                var aa = 0,
                    x = y.split(""),
                    bb = x.length,
                    c = 0,
                    d = 0,
                    e = "",
                    f = "",
                    g = "",
                    h = "";
                for (aa = 0; aa < bb; aa += 1) {
                    if (x[aa] === "\\") {
                        aa += 1;
                    } else if (x[aa] === "\"" && f === "") {
                        f = "\"";
                    } else if (x[aa] === "'" && f === "") {
                        f = "'";
                    } else if (x[aa] === "/" && f === "" && !isAlphanum(x[aa - 1]) && x[aa - 1] !== ")" && x[aa - 1] !== "]") {
                        if (x[aa - 1] === " ") {
                            x[aa - 1] = "";
                            if (!isAlphanum(x[aa - 2])) {
                                f = "/";
                                x[aa] = "pd";
                            } else if (x[aa + 1] === " ") {
                                x[aa + 1] = "";
                            }
                        } else {
                            f = "/";
                            x[aa] = "pd";
                        }
                    } else if (x[aa] === "/" && f === "" && x[aa + 1] === " " && isAlphanum(x[aa - 1])) {
                        x[aa + 1] = "";
                    } else if (x[aa] === "\"" && f === "\"") {
                        f = "";
                    } else if (x[aa] === "'" && f === "'") {
                        f = "";
                    } else if (x[aa] === "/" && f === "/") {
                        f = "";
                        x[aa] = "pd";
                    } else if ((f === "'" || f === "\"") && x[aa - 2] === "\\" && x[aa - 1] === ";") {
                        x[aa - 1] = "";
                        x[aa - 2] = " ";
                    } else if (f === "" && (x[aa] === "}" || x[aa] === ")")) {
                        if ((x[aa + 1] !== "(" && x[aa + 1] !== "[" && x[aa + 1] !== "," && x[aa + 1] !== ";" && x[aa + 1] !== "." && x[aa + 1] !== "?" && x[aa + 1] !== "*" && x[aa + 1] !== "+" && x[aa + 1] !== "-" && (x[aa + 1] !== "\n" || (x[aa + 1] === "\n" && x[aa + 2] !== "(" && x[aa + 2] !== "[" && x[aa + 2] !== "+" && x[aa + 2] !== "-" && x[aa + 2] !== "/")) && typeof x[aa - 3] === "string" && x[aa - 2] === "=" && x[aa - 1] === "{" && x[aa] === "}" && (x[aa + 1] !== "\n" || (x[aa + 1] === "\n" && x[aa + 2] !== "+" && x[aa + 2] !== "-")) && (isAlphanum(x[aa - 3]) || x[aa - 3] === "]" || x[aa - 3] === ")"))) {
                            x[aa] += ";";
                        } else {
                            d = -1;
                            e = "";
                            g = "";
                            if (x[aa] === "}") {
                                g = "}";
                                h = "{";
                            } else {
                                g = ")";
                                h = "(";
                            }
                            for (c = aa - 1; c > -1; c -= 1) {
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
                                if (d === 0 && (c !== aa - 1 || (c === aa - 1 && typeof x[c - 1] === "string" && x[c - 1] !== x[aa]))) {
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
                                                if (x[aa + 1] !== "(" && x[aa + 1] !== "[" && x[aa + 1] !== "," && x[aa + 1] !== ";" && x[aa + 1] !== "." && x[aa + 1] !== "?" && x[aa + 1] !== "*" && x[aa + 1] !== "+" && x[aa + 1] !== "-" && typeof x[c - 9] === "string" && x[c - 8] === "=" && x[c - 7] === "f" && x[c - 6] === "u" && x[c - 5] === "n" && x[c - 4] === "c" && x[c - 3] === "t" && x[c - 2] === "i" && x[c - 1] === "o" && x[c] === "n" && (isAlphanum(x[c - 9]) || x[c - 9] === "]" || x[c - 9] === ")")) {
                                                    x[aa] += ";";
                                                }
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                    if (typeof x[c - 2] === "string" && x[c - 1] === "=" && (x[aa - 1].length === 1 || x[aa - 1] === "pd") && (isAlphanum(x[c - 2] || x[c - 2] === "]" || x[c - 2] === ")"))) {
                                        if (x[aa + 1] !== "(" && x[aa + 1] !== "[" && x[aa + 1] !== "," && x[aa + 1] !== ";" && x[aa + 1] !== "." && x[aa + 1] !== "?" && x[aa + 1] !== "*" && x[aa + 1] !== "+" && x[aa + 1] !== "-" && (x[aa + 1] !== "\n" || (x[aa + 1] === "\n" && x[aa + 2] !== "(" && x[aa + 2] !== "[" && x[aa + 2] !== "+" && x[aa + 2] !== "-" && x[aa + 2] !== "/")) && (typeof x[aa + 1] !== "string" || x[aa + 1] !== "/")) {
                                            x[aa] += ";";
                                        }
                                        break;
                                    }
                                    break;
                                }
                            }
                        }
                    } else if (f === "" && x[aa] === "\n") {
                        if ((/\w/).test(x[aa + 1]) && x[aa - 1] !== "}" && x[aa - 1] !== ")" && x[aa - 1].indexOf(";") === -1) {
                            x[aa] = ";";
                        } else {
                            x[aa] = "";
                        }
                    }
                }
                for (aa = 0; aa < bb; aa += 1) {
                    if (x[aa] === "pd") {
                        x[aa] = "/";
                    }
                }
                return x.join("").replace(/\"/g, "\"").replace(/\'/g, "'");
            },

            //reduction provides a logical compression to flatten
            //redundantly applied CSS properties
            reduction = function jsmin__reduction(x) {
                var aa = 0,
                    e = 0,
                    f = 0,
                    g = -1,
                    m = 0,
                    p = 0,
                    r = 0,
                    bb = x.length,
                    c = [],
                    d = [],
                    h = [],
                    i = [],
                    test = false,

                    //colorLow is used in a replace method to convert
                    //CSS hex colors from uppercase alpha characters to
                    //lowercase and in some cases shorten hex color
                    //codes from 6 characters to 3.
                    colorLow = function jsmin__reduction_colorLow(y) {
                        var aaa = y.charAt(0),
                            bbb = false;
                        if (y.length === 8 || y.length === 5) {
                            y = y.substr(1);
                            bbb = true;
                        }
                        y = y.toLowerCase();
                        if (y.length === 7 && y.charAt(1) === y.charAt(2) && y.charAt(3) === y.charAt(4) && y.charAt(5) === y.charAt(6)) {
                            y = "#" + y.charAt(1) + y.charAt(3) + y.charAt(5);
                        }
                        if (bbb && !(/\s/).test(aaa) && aaa !== ":") {
                            y = aaa + " " + y;
                        } else if (bbb && aaa === ":") {
                            y = ":PDpoundPD" + y;
                        } else if (bbb && (/\s/).test(aaa)) {
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
                        bbb = x.length,
                        ccc = [],
                        eee = 0,
                        q = "";
                    for (aa = 0; aa < bbb; aa += 1) {
                        ccc.push(x.charAt(aa));
                        if (x.charAt(aa) === "{" || x.charAt(aa + 1) === "}") {
                            if (ccc[0] === "}") {
                                d.push("}");
                                ccc[0] = "";
                            }
                            q = ccc.join("");
                            if (q.indexOf("{") > -1) {
                                eee = Math.max(q.lastIndexOf("\n"), q.lastIndexOf(";"));
                                d.push(q.substring(0, eee + 1).replace(/^(\s+)/, "").replace(/(\w|\)|"|')\s+/g, misssemi));
                                d.push(q.substring(eee + 1));
                            } else {
                                d.push(q.replace(/^(\s+)/, "").replace(/\s+\w+(\-\w+)*:/g, misssemi));
                            }
                            ccc = [];
                        }
                    }
                    d.push("}");
                }());
                for (bb = aa - 1; bb > 0; bb -= 1) {
                    if (x.charAt(bb) === "/" && x.charAt(bb - 1) && x.charAt(bb - 1) === "*") {
                        for (e = bb - 1; e > 0; e -= 1) {
                            if (x.charAt(e) === "/" && x.charAt(e + 1) === "*") {
                                bb = e;
                                break;
                            }
                        }
                    } else if (!/[\}\s]/.test(x.charAt(bb))) {
                        break;
                    }
                }

                //looks for multidimensional structures, SCSS, and pulls
                //direct properties above child structures
                (function jsmin__reduction_scss() {
                    var aaa = 0,
                        bbb = d.length,
                        ccc = 0,
                        eee = 0,
                        fff = 1,
                        ggg = [],
                        hhh = [],
                        iii = [],
                        ttt = false;
                    for (aaa = 0; aaa < bbb; aaa += 1) {
                        if (d[aaa] === "}") {
                            eee -= 1;
                            if (eee === fff - 1 && ggg.length > 0) {
                                hhh = d.slice(0, aaa);
                                iii = d.slice(aaa, d.length);
                                d = [].concat(hhh, ggg, iii);
                                ggg = [];
                                aaa = hhh.length - 1;
                                bbb = d.length;
                            }
                        } else if (d[aaa].indexOf("{") > -1) {
                            eee += 1;
                            if (eee > fff) {
                                ttt = true;
                                fff = eee - 1;
                                ggg.push(d[aaa]);
                                d[aaa] = "";
                                for (ccc = aaa + 1; ccc < bbb; ccc += 1) {
                                    ggg.push(d[ccc]);
                                    if (d[ccc].indexOf("{") > -1) {
                                        eee += 1;
                                        d[ccc] = "";
                                    } else if (d[ccc] === "}") {
                                        eee -= 1;
                                        d[ccc] = "";
                                        if (eee === fff) {
                                            break;
                                        }
                                    } else {
                                        d[ccc] = "";
                                    }
                                }
                            }
                        }
                    }
                    if (ttt === true) {
                        bbb = d.length;
                        ggg = [];
                        for (aaa = 0; aaa < bbb; aaa += 1) {
                            if (ggg.length > 0 && ggg[ggg.length - 1].indexOf("{") === -1 && d[aaa] !== "}" && d[aaa].indexOf("{") === -1) {
                                ggg[ggg.length - 1] = ggg[ggg.length - 1] + d[aaa];
                            } else if (d[aaa] !== "") {
                                ggg.push(d[aaa]);
                            }
                        }
                        d = [].concat(ggg);
                    }
                }());
                bb = d.length;
                for (aa = 0; aa < bb - 1; aa += 1) {
                    if (d[aa].charAt(d[aa].length - 1) !== "{") {
                        if (d[aa].indexOf("url(") > -1) {
                            h = d[aa].split("");
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
                            d[aa] = h.join("");
                        }
                        if (d[aa].charAt(d[aa].length - 1) === ";") {
                            d[aa] = d[aa].substr(0, d[aa].length - 1);
                        }
                        if (d[aa].indexOf("{") > -1 || d[aa].indexOf(",") > d[aa].length - 3) {
                            c = [d[aa]];
                        } else {
                            c = d[aa].replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))(?=(;|\s|\)\}|,))/g, colorLow).replace(/:/g, "~PDCSEP~").split(";").sort();
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

                        //This small loop removes duplicate CSS
                        //properties from a sorted list
                        for (e = 1; e < f; e += 1) {
                            if (c[e].length > 1 && c[e][0] === c[e - 1][0]) {
                                c[e - 1] = ["", ""];
                            }
                        }
                        for (e = 0; e < f; e += 1) {
                            if (c[e - 1] && c[e - 1][0] === c[e][0] && (/\-[a-z]/).test(c[e - 1][1]) === false && (/\-[a-z]/).test(c[e][1]) === false) {
                                c[e - 1] = ["", ""];
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
                                            c[r] = ["", ""];
                                        }
                                    } while (i.length < 4 && r > 0);
                                    c[e] = ["margin", i[0] + " " + i[1] + " " + i[3] + " " + i[2]];
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
                                            c[r] = ["", ""];
                                        }
                                    } while (i.length < 4 && r > 0);
                                    c[e] = ["padding", i[0] + " " + i[1] + " " + i[3] + " " + i[2]];
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
                                c[e] = ["", ""];
                            } else if (g !== -1) {
                                g = -1;
                            }
                        }
                        for (e = 0; e < f; e += 1) {
                            if (c[e].length > 1 && c[e][0] !== "") {
                                for (r = e + 1; r < f; r += 1) {
                                    if (c[r].length > 1 && c[e][0] === c[r][0]) {
                                        c[e] = ["", ""];
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
                        d[aa] = h.join(";").replace(/;+/g, ";").replace(/^;/, "");
                        if (d[aa] !== "}" && typeof d[aa + 1] === "string" && d[aa + 1] !== "}" && d[aa + 1].indexOf("{") > -1 && !(/(\,\s*)$/).test(d[aa])) {
                            d[aa] = d[aa] + ";";
                        }
                    }
                    d[aa] = d[aa].replace(/\)\s+\{/g, "){");
                }
                return d.join("").replace(/PDpoundPD#/g, "#");
            },

            //fixURI forcefully writes double quote characters around
            //URI fragments in CSS.  If parenthesis characters are
            //characters of the URI they must be escaped with a
            //backslash, "\)", in accordance with the CSS specification,
            //or they will damage the output.
            fixURI = function jsmin__fixURI(y) {
                var aa = 0,
                    bb = [],
                    c = "",
                    x = y.replace(/\\\)/g, "~PDpar~").split("url("),
                    d = x.length,
                    e = "";
                for (aa = 1; aa < d; aa += 1) {
                    e = "\"";
                    if (x[aa].charAt(0) === "\"") {
                        e = "";
                    } else if (x[aa].charAt(0) === "'") {
                        x[aa] = x[aa].substr(1, x[aa].length - 1);
                    }
                    bb = x[aa].split(")");
                    c = bb[0];
                    if (c.charAt(c.length - 1) !== "\"" && c.charAt(c.length - 1) !== "'") {
                        c = c + "\"";
                    } else if (c.charAt(c.length - 1) === "'" || c.charAt(c.length - 1) === "\"") {
                        c = c.substr(0, c.length - 1) + "\"";
                    }
                    bb[0] = c;
                    x[aa] = "url(" + e + bb.join(")");
                }
                return x.join("").replace(/~PDpar~/g, "\\)");
            },

            //fixNegative is used to correct the collision between a
            //number or increment and a hyphen
            fixNegative = function jsmin__fixNegative(x) {
                return x.replace(/\-/, " -");
            },

            //rgbToHex is used in a replace method to convert CSS colors
            //from RGB definitions to hex definitions
            rgbToHex = function jsmin__rgbToHex(x) {
                var z,
                    y = function jsmin__rgbToHex_toHex(z) {
                        z = Number(z).toString(16);
                        if (z.length === 1) {
                            z = "0" + z;
                        }
                        return z;
                    };
                z = "#" + x.replace(/\d+/g, y).replace(/rgb\(/, "").replace(/,/g, "").replace(/\)/, "").replace(/(\s*)/g, "");
                return z;
            },

            //sameDist is used in a replace method to shorten redundant
            //CSS distances to the fewest number of non-redundant
            //increments
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
                var z = x.substr(0, x.indexOf(":") + 1);
                if (z === "radius:" || z === "shadow:" || x.charAt(x.length - 1) !== "0" || (x.charAt(x.length - 1) === "0" && x.charAt(x.length - 2) !== " ")) {
                    return x;
                }
                return z + "0";
            },

            //endZero is used in a replace method to convert "20.0" to
            //"20" in CSS
            endZero = function jsmin__endZero(x) {
                var z = x.indexOf(".");
                return x.substr(0, z);
            },

            //startZero is used in a replace method to convert "0.02" to
            //".02" in CSS
            startZero = function jsmin__startZero(x) {
                var z = x.indexOf(".");
                return x.charAt(0) + x.substr(z, x.length);
            },

            //This function prevents percentage numbers from running
            //together
            fixpercent = function jsmin__fixpercent(x) {
                return x.replace(/%/, "% ");
            },

            //This function is used to fix a bizarre JS automatic
            //semilcolon insertion (ASI) edgecase of a closing paren,
            //some amount of white space containing a new line
            //character, and an exclamation character not followed by
            //an equal character
            bangFix = function jsmin__bangFix(x) {
                if (x.indexOf("\n") > -1) {
                    return ");!";
                }
                return x;
            },

            //get -- return the next character. Watch out for lookahead.
            //If the character is a control character, translate it to a
            //space or linefeed.
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

            //peek -- get the next character without getting it.
            peek = function jsmin__peek() {
                theLookahead = get();
                return theLookahead;
            },

            //next -- get the next character, excluding comments. peek()
            //is used to see if a "/" is followed by a "/" or "*".
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

            //action -- do something! What you do is determined by the
            //argument:
            //   1   Output A. Copy B to A. Get the next B.
            //   2   Copy B to A. Get the next B. (Delete A).
            //   3   Get the next B. (Delete B).
            //action treats a string as a single character. Wow!
            //action recognizes a regular expression if it is preceded
            //by ( or , or =.
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
                        }
                        if (a === "\\") {
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

            //m -- Copy the input to the output, deleting the characters
            //which are insignificant to JavaScript. Comments will be
            //removed. Tabs will be replaced with spaces. Carriage
            //returns will be replaced with linefeeds.  Most spaces and
            //linefeeds will be removed.
            m = function jsmin__m() {
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
        (function jsmin__topComments() {
            var aa = 0,
                bb = input.length,
                c = "",
                d = (/^(\s*<\!\[CDATA\[)/).test(input);
            if (fcomment === false || (d === false && (/^(\s*\/\*)/).test(input) === false && (/^(\s*\/\/)/).test(input) === false) || (d === true && (/^(\s*<\!\[CDATA\[\s*\/\*)/).test(input) === false && (/^(\s*<\!\[CDATA\[\s*\/\/)/).test(input) === false)) {
                return;
            }
            if (d === true) {
                fcom.push("<![CDATA[");
                input = input.replace(/^(\s*<\!\[CDATA\[)/, "").replace(/(\]\]>\s*)$/, "");
            }
            for (aa = 0; aa < bb; aa += 1) {
                if (c === "") {
                    if (input.charAt(aa) === "/" && typeof input.charAt(aa + 1) === "string" && (input.charAt(aa + 1) === "*" || input.charAt(aa + 1) === "/")) {
                        c = input.substr(aa, 2);
                        fcom.push(input.charAt(aa));
                    } else if (/\s/.test(input.charAt(aa)) === false) {
                        input = input.substr(aa);
                        return;
                    }
                } else {
                    fcom.push(input.charAt(aa));
                    if (input.charAt(aa) === "*" && c === "/*" && input.charAt(aa + 1) && input.charAt(aa + 1) === "/") {
                        fcom.push("/\n");
                        if (input.charAt(aa + 2) && input.charAt(aa + 2) === "\n") {
                            aa += 2;
                        } else {
                            aa += 1;
                        }
                        c = "";
                    } else if ((input.charAt(aa) === "\n" || input.charAt(aa) === "\r") && c === "//") {
                        c = "";
                    }
                }
            }
        }());
        if (type === "css") {
            OTHERS = "-._\\";
        } else {
            if (alter === true && level === 2) {
                alterj = true;
                input = input.replace(/\r\n?/g, "\n").replace(/("|')\s+["'a-zA-Z_$]/g, jsasiq).replace(/\)\s+\!(?!\=)/g, bangFix);
            }
            OTHERS = "_$//";
        }
        if (type === "css" && alter === true) {
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
            if (alter === true) {
                ret = ret.replace(/@charset("|')?[\w\-]+("|')?;?/gi, "").replace(/(#|\.)?[\w]*\{\}/gi, "").replace(/\w\s*:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/(:| )0+\.\d+/g, startZero).replace(/\w+(\-\w+)*:((((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0) )+(((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0)/g, sameDist).replace(/\};/g, "}").replace(/^;/, "").replace(/ \}/g, "}");
                ret = ret.replace(/:\.?0(\%|px|in|cm|mm|em|ex|pt|pc)/g, ":0").replace(/ 0?\.?0+(\%|px|in|cm|mm|em|ex|pt|pc)/g, " 0").replace(/bottom:none/g, "bottom:0").replace(/top:none/g, "top:0").replace(/left:none/g, "left:0").replace(/right:none/, "right:0").replace(/:0 0 0 0/g, ":0").replace(/:(\s*([0-9]+\.)?[0-9]+(%|in|cm|mm|em|ex|pt|pc|px)?)+\-([0-9]*\.)?[0-9]/g, fixNegative);
                ret = ret.replace(/[a-z]*:(0\s*)+\-?\.?\d?/g, singleZero).replace(/ 0 0 0 0/g, " 0").replace(/rgb\(\d+,\d+,\d+\)/g, rgbToHex).replace(/background\-position:0;/gi, "background-position:0 0;").replace(/;+/g, ";").replace(/\s*[\w\-]+:\s*\}/g, "}").replace(/\s*[\w\-]+:\s*;/g, "").replace(/;\}/g, "}").replace(/\{;/g, "{").replace(/\{\s+\}/g, "{}").replace(/\s+\)/g, ")").replace(/\s+\,/g, ",");

                //This logic is used to pull the first "@charset"
                // definition to the extreme top and remove all others
                if (atchar === null) {
                    atchar = [""];
                } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                    atchar[0] = atchar[0] + ";";
                }
                ret = atchar[0].replace(/@charset/i, "@charset") + fixURI(ret).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";");
            }
            ret = ret.replace(/~PDpar~/g, "\\)");
        } else if (alterj === true) {
            ret = ret.replace(/(\s+)$/, "").replace(/((return)|(continue)|(break)|(throw))\s+/g, semiword).replace(/(\n+)!+(\+|\-)/g, ";").replace(/\}\u003b(!=\))/g, "}").replace(/x{2}-->/g, "//-->");
            ret = asiFix(ret);
            if (ret.charAt(ret.length - 1) !== ";" && ret.charAt(ret.length - 1) !== "}" && ret !== "") {
                ret = ret + ";";
            }
        } else {
            ret = ret.replace(/^(\s+)/, "").replace(/x{2}-->/g, "//-->");
        }
        if (error !== "") {
            return error;
        }
        if (fcom[0] === "<![CDATA[") {
            ret = ret + "]]>";
        }
        if (ret === "" && fcom.length > 0) {
            fcom[fcom.length - 1] = fcom[fcom.length - 1].replace(/(\s+)$/, "");
        }
        return fcom.join("").replace(/\n\s+/g, blockspace) + ret;
    };