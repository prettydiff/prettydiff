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
String.prototype.has = function (c) {
    return this.indexOf(c) > -1;
};
var jsmin = function (comment, input, level, type, alter, fcomment) {
    "use strict";
    if (input === undefined) {
        input = comment;
        comment = '';
        level = 2;
    } else {
        if (level === undefined || level < 1 || level > 3) {
            level = 2;
        }
        if (type === "javascript") {
            input = input.replace(/\/\/(\s)*-->/g, "//-->");
        } else if (type !== "css") {
            return "Error: The type argument is not provided a value of either 'css' or 'javascript'.";
        }
    }
    if (comment.length > 0) {
        comment += '\n';
    }
    var ret,
        atchar = input.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
        error = "",
        a = '',
        b = '',
        geti,
        getl,
        EOF = -1,
        LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        DIGITS = '0123456789',
        OTHERS,
        ALNUM,
        fcom = [],
        theLookahead = EOF,

        //reduction provides a logical compression to flatten redundantly
        //applied CSS properties
        reduction = function (x) {
            var a,
                e,
                f,
                g,
                m,
                p,
                b = x.length,
                c = "",
                d = [],

                //colorLow is used in a replace method to convert CSS hex colors
                //from uppercase alpha characters to lowercase and in some cases
                //shorten hex color codes from 6 characters to 3.
                colorLow = function (x) {
                    x = x.toLowerCase();
                    if (x.length === 7 && x.charAt(1) === x.charAt(2) && x.charAt(3) === x.charAt(4) && x.charAt(5) === x.charAt(6)) {
                        x = "#" + x.charAt(1) + x.charAt(3) + x.charAt(5);
                    }
                    return x;
                };
            for (a = 0; a < b; a += 1) {
                c += x[a];
                if (x[a] === "{" || x[a + 1] === "}") {
                    d.push(c);
                    c = "";
                }
            }
            if (x[a - 1] === "}") {
                d.push("}");
            }
            b = d.length;
            for (a = 0; a < b - 1; a += 1) {
                if (d[a].charAt(d[a].length - 1) !== "{") {
                    if (d[a].charAt(d[a].length - 1) === ";") {
                        d[a] = d[a].substr(0, d[a].length - 1);
                    }
                    c = d[a].replace(/\:/g, "$").replace(/#[a-zA-Z0-9]{3,6}(?!(\w*\)))/g, colorLow).split(";").sort();
                    f = c.length;
                    for (e = 0; e < f; e += 1) {
                        c[e] = c[e].split("$");
                    }
                    g = -1;
                    m = 0;
                    p = 0;
                    for (e = 0; e < f; e += 1) {
                        if (c[e - 1] && c[e - 1][0] === c[e][0]) {
                            c[e - 1] = "";
                        }
                        if (c[e][0] !== "margin" && c[e][0].indexOf("margin") !== -1) {
                            m += 1;
                            if (m === 4) {
                                c[e][0] = "margin";
                                c[e][1] = c[e][1] + " " + c[e - 1][1] + " " + c[e - 3][1] + " " + c[e - 2][1];
                                c[e - 3] = "";
                                c[e - 2] = "";
                                c[e - 1] = "";
                                if (c[e - 4] && c[e - 4][0] === "margin") {
                                    c[e - 4] = "";
                                }
                            }
                        } else if (c[e][0] !== "padding" && c[e][0].indexOf("padding") !== -1) {
                            p += 1;
                            if (p === 4) {
                                c[e][0] = "padding";
                                c[e][1] = c[e][1] + " " + c[e - 1][1] + " " + c[e - 3][1] + " " + c[e - 2][1];
                                c[e - 3] = "";
                                c[e - 2] = "";
                                c[e - 1] = "";
                                if (c[e - 4] && c[e - 4][0] === "padding") {
                                    c[e - 4] = "";
                                }
                            }
                        }
                        if (g === -1 && c[e + 1] && c[e][0].charAt(0) !== "-" && (c[e][0].indexOf("cue") !== -1 || c[e][0].indexOf("list-style") !== -1 || c[e][0].indexOf("outline") !== -1 || c[e][0].indexOf("overflow") !== -1 || c[e][0].indexOf("pause") !== -1) && (c[e][0] === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")) || c[e][0].substring(0, c[e][0].lastIndexOf("-")) === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")))) {
                            g = e;
                            if (c[g][0].indexOf("-") !== -1) {
                                c[g][0] = c[g][0].substring(0, c[g][0].lastIndexOf("-"));
                            }
                        } else if (g !== -1 && c[g][0] === c[e][0].substring(0, c[e][0].lastIndexOf("-"))) {
                            if (c[g][0] === "cue" || c[g][0] === "pause") {
                                c[g][1] = c[e][1] + " " + c[g][1];
                            } else {
                                c[g][1] = c[g][1] + " " + c[e][1];
                            }
                            c[e] = "";
                        } else if (g !== -1) {
                            g = -1;
                        }
                    }
                    for (e = 0; e < f; e += 1) {
                        if (c[e] !== "") {
                            c[e] = c[e].join(":");
                        }
                    }
                    d[a] = c.join(";").replace(/;+/g, ";").replace(/^;/, "");
                }
            }
            return d.join("");
        },

        //isAlphanum -- return true if the character is a letter, digit,
        //underscore, dollar sign, or non-ASCII character.
        isAlphanum = function (c) {
            return c !== EOF && (ALNUM.has(c) || c.charCodeAt(0) > 126);
        },

        //fixURI forcefully writes double quote characters around URI
        //fragments in CSS.  If parenthesis characters are characters of the
        //URI they must be escaped with a backslash, "\)", in accordance
        //with the CSS specification, or they will damage the output.
        fixURI = function (x) {
            var a;
            x = x.split("url(");
            for (a = 1; a < x.length; a += 1) {
                if (x[a].charAt(0) !== "\"" && x[a].charAt(0) !== "'") {
                    x[a] = x[a].split(")");
                    if (x[a][0].charAt(x[a][0].length - 1) !== "\"" && x[a][0].charAt(x[a][0].length - 1) !== "'") {
                        x[a][0] = x[a][0] + "\"";
                    } else if (x[a][0].charAt(x[a][0].length - 1) === "'" || x[a][0].charAt(x[a][0].length - 1) === "\"") {
                        x[a][0] = x[a][0].substr(0, x[a][0].length - 1) + "\"";
                    }
                    x[a] = "url(\"" + x[a].join(')');
                } else if (x[a].charAt(0) === "\"") {
                    x[a] = x[a].split(")");
                    if (x[a][0].charAt(x[a][0].length - 1) !== "\"" && x[a][0].charAt(x[a][0].length - 1) !== "'") {
                        x[a][0] = x[a][0] + "\"";
                    } else if (x[a][0].charAt(x[a][0].length - 1) === "'" || x[a][0].charAt(x[a][0].length - 1) === "\"") {
                        x[a][0] = x[a][0].substr(0, x[a][0].length - 1) + "\"";
                    }
                    x[a] = "url(" + x[a].join(')');
                } else {
                    x[a] = x[a].substr(1, x[a].length - 1).split(")");
                    if (x[a][0].charAt(x[a][0].length - 1) !== "\"" && x[a][0].charAt(x[a][0].length - 1) !== "'") {
                        x[a][0] = x[a][0] + "\"";
                    } else if (x[a][0].charAt(x[a][0].length - 1) === "'" || x[a][0].charAt(x[a][0].length - 1) === "\"") {
                        x[a][0] = x[a][0].substr(0, x[a][0].length - 1) + "\"";
                    }
                    x[a] = "url(\"" + x[a].join(')');
                }
            }
            return x.join('');
        },

        //rgbToHex is used in a replace method to convert CSS colors from
        //RGB definitions to hex definitions
        rgbToHex = function (x) {
            var a,
                y = function (z) {
                    z = Number(z).toString(16);
                    if (z.length === 1) {
                        z = "0" + z;
                    }
                    return z;
                };
            a = "#" + x.replace(/\d+/g, y).replace(/rgb\(/, "").replace(/,/g, "").replace(/\)/, "").replace(/\s*/g, "");
            return a;
        },

        //sameDist is used in a replace method to shorten redundant CSS
        //distances to the fewest number of non-redundant increments
        sameDist = function (x) {
            if (x === "0") {
                return x;
            }
            var a = "";
            if (x.charAt(0) === " ") {
                a = " ";
                x = x.substr(1, x.length);
            }
            x = x.split(" ");
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
            return a + x.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
        },
        singleZero = function (x) {
            var a = x.substr(0, x.indexOf(":") + 1);
            if (a === "radius:" || a === "shadow:" || x.charAt(x.length - 1) !== "0" || (x.charAt(x.length - 1) === "0" && x.charAt(x.length - 2) !== " ")) {
                return x;
            }
            return a + "0";
        },

        //endZero is used in a replace method to convert "20.0" to "20" in
        //CSS
        endZero = function (x) {
            var a = x.indexOf(".");
            return x.substr(0, a);
        },

        //runZero suppresses continuous runs of 0 to a single 0 if they
        //are not preceeded by a period (.), number sign (#), or a hex
        //digit (0-9, a-f)
        runZero = function (x) {
            var a = x.charAt(0);
            if (a === "#" || a === "." || /[a-f0-9]/.test(a)) {
                return x;
            } else {
                return a + "0";
            }
        },

        //startZero is used in a replace method to convert "0.02" to ".02"
        //in CSS
        startZero = function (x) {
            var a = x.indexOf(".");
            return x.charAt(0) + x.substr(a, x.length);
        },

        //This function prevents percentage numbers from running together
        fixpercent = function (x) {
            return x.replace(/%/, "% ");
        },

        //get -- return the next character. Watch out for lookahead. If
        //the character is a control character, translate it to a space
        //or linefeed.
        get = function () {
            var c = theLookahead;
            if (geti === getl) {
                return EOF;
            }
            theLookahead = EOF;
            if (c === EOF) {
                c = input.charAt(geti);
                geti += 1;
            }
            if (c >= ' ' || c === '\n') {
                return c;
            }
            if (c === '\r') {
                return '\n';
            }
            return ' ';
        },

        //peek -- get the next character without getting it.
        peek = function () {
            theLookahead = get();
            return theLookahead;
        },

        //next -- get the next character, excluding comments. peek() is
        //used to see if a '/' is followed by a '/' or '*'.
        next = function () {
            var c = get();
            if (c === '/' && (type === 'javascript' || (type === 'css' && peek() !== '/'))) {
                switch (peek()) {
                case '/':
                    for (;;) {
                        c = get();
                        if (c <= '\n') {
                            return c;
                        }
                    }
                    break;
                case '*':
                    get();
                    for (;;) {
                        switch (get()) {
                        case "'":
                            c = get().replace(/'/, '');
                            break;
                        case '"':
                            c = get().replace(/"/, '');
                            break;
                        case '*':
                            if (peek() === '/') {
                                get();
                                return ' ';
                            }
                            break;
                        case EOF:
                            error = 'Error: Unterminated block comment.';
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
        //action recognizes a regular expression if it is preceded by
        //( or , or =.
        action = function (d) {
            var r = [];
            if (d === 1) {
                r.push(a);
            }
            if (d < 3) {
                a = b;
                if (a === '\'' || a === '"') {
                    for (;;) {
                        r.push(a);
                        a = get();
                        if (a === b) {
                            break;
                        }
                        if (a <= '\n') {
                            if (type === "css") {
                                error = 'Error: This does not appear to be CSS.';
                            } else {
                                error = 'Error: This does not appear to be JavaScript.';
                            }
                            return error;
                        }
                        if (a === '\\') {
                            r.push(a);
                            a = get();
                        }
                    }
                }
            }
            b = next();
            if (b === '/' && '(,=:[!&|'.has(a)) {
                r.push(a);
                r.push(b);
                for (;;) {
                    a = get();
                    if (a === '/') {
                        break;
                    } else if (a === '\\') {
                        r.push(a);
                        a = get();
                    } else if (a <= '\n') {
                        error = 'Error: unterminated JavaScript Regular Expression literal';
                        return error;
                    }
                    r.push(a);
                }
                b = next();
            }
            return r.join('');
        },

        //m -- Copy the input to the output, deleting the characters
        //which are insignificant to JavaScript. Comments will be
        //removed. Tabs will be replaced with spaces. Carriage returns
        //will be replaced with linefeeds.
        //Most spaces and linefeeds will be removed.
        m = function () {
            if (error !== "") {
                return error;
            }
            var firstComment = (function () {
                if (fcomment !== true || (/^\s*\/\*/.test(input) !== true && /^\s*\/\//.test(input) !== true)) {
                    return;
                }
                var a,
                    b = input.length,
                    c = '';
                for (a = 0; a < b; a += 1) {
                    if (c === '') {
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
                            c = '';
                        } else if ((input.charAt(a) === "\n" || input.charAt(a) === "\r") && c === "//") {
                            c = '';
                        }
                    }
                }
            }()),
                r = [];
            a = '\n';
            r.push(action(3));
            while (a !== EOF) {
                if (a === ' ' && !(type === 'css' && b === '#')) {
                    if (isAlphanum(b)) {
                        r.push(action(1));
                    } else {
                        r.push(action(2));
                    }
                } else if (a === '\n') {
                    switch (b) {
                    case '{':
                    case '[':
                    case '(':
                    case '+':
                    case '-':
                        r.push(action(1));
                        break;
                    case ' ':
                        r.push(action(3));
                        break;
                    default:
                        if (isAlphanum(b)) {
                            r.push(action(1));
                        } else {
                            if (level === 1 && b !== '\n') {
                                r.push(action(1));
                            } else {
                                r.push(action(2));
                            }
                        }
                    }
                } else {
                    switch (b) {
                    case ' ':
                        if (isAlphanum(a)) {
                            r.push(action(1));
                            break;
                        }
                        r.push(action(3));
                        break;
                    case '\n':
                        if (level === 1 && a !== '\n') {
                            r.push(action(1));
                        } else if (a === '}') {
                            if (level === 3) {
                                r.push(action(3));
                            } else {
                                r.push(action(1));
                            }
                        } else {
                            r.push(action(3));
                        }
                        break;
                    default:
                        r.push(action(1));
                        break;
                    }
                }
            }
            return r.join('');
        };
    if (type === "css") {
        OTHERS = '-._\\';
    } else {
        OTHERS = '_$//';
    }
    ALNUM = LETTERS + DIGITS + OTHERS;
    geti = 0;
    getl = input.length;
    ret = m(input);
    if (/(\}\s*)$/.test(input) && !/(\}\s*)$/.test(ret)) {
        ret = ret + "}";
    }
    if (type === "css") {
        ret = ret.replace(/\: #/g, ":#").replace(/\; #/g, ";#").replace(/\, #/g, ",#").replace(/\s+/g, " ").replace(/\} /g, '}').replace(/\{ /g, '{').replace(/\\\)/g, "~PDpar~").replace(/\)/g, ") ").replace(/\) ;/g, ");").replace(/\d%[a-z0-9]/g, fixpercent);
        if (alter === true) {
            ret = reduction(ret).replace(/@charset("|')?[\w\-]+("|')?;?/gi, "").replace(/(#|\.)?[\w]*\{\}/gi, "").replace(/(\S|\s)0+/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/(:| )0+\.\d+/g, startZero).replace(/\s?((\.\d+|\d+\.\d+|\d+)[a-zA-Z]+|0 )+((\.\d+|\d+\.\d+|\d+)[a-zA-Z]+)|0/g, sameDist);
            ret = ret.replace(/:\.?0(\%|px|in|cm|mm|em|ex|pt|pc)/g, ":0").replace(/ \.?0(\%|px|in|cm|mm|em|ex|pt|pc)/g, " 0").replace(/bottom:none/g, "bottom:0").replace(/top:none/g, "top:0").replace(/left:none/g, "left:0").replace(/right:none/, "right:0").replace(/:0 0 0 0/g, ":0");
            ret = ret.replace(/[a-z]*:(0\s*)+\-?\.?\d?/g, singleZero).replace(/ 0 0 0 0/g, " 0").replace(/rgb\(\d+,\d+,\d+\)/g, rgbToHex).replace(/background\-position:0;/gi, "background-position:0 0;").replace(/;+/g, ";").replace(/\s*[\w\-]+:\s*\}/g, "}").replace(/\s*[\w\-]+:\s*;/g, "").replace(/;\}/g, "}").replace(/\{\s+\}/g, "{}");

            //This logic is used to pull the first "@charset" definition
            //to the extreme top and remove all others
            if (atchar === null) {
                atchar = [""];
            } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                atchar[0] = atchar[0] + ";";
            }
            ret = atchar[0].replace(/@charset/i, "@charset") + fixURI(ret);
        }
        ret = ret.replace(/~PDpar~/g, "\\)");
    } else {
        ret = ret.replace(/x{2}-->/g, "//-->");
    }
    if (ret.charAt(0) === " " || ret.charAt(0) === "\n" || ret.charAt(0) === "\t") {
        ret = ret.slice(1, ret.length);
    }
    if (error !== "") {
        return error;
    } else {
        return comment + fcom.join('') + ret;
    }
};