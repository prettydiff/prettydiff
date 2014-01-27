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
        var input        = (typeof args.source !== "string" || args.source === "") ? "Error: no source supplied to jsmin." : args.source,
            level        = (args.level === 1 || args.level === 2 || args.level === 3) ? args.level : 2,
            type         = (args.type === "javascript" || args.type === "css") ? args.type : "javascript",
            alter        = (args.alter === true) ? true : false,
            fcomment     = (args.fcomment === true) ? true : false,
            ret          = "",
            atchar       = input.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
            error        = "",
            a            = "",
            b            = "",
            geti         = 0,
            getl         = 0,
            EOF          = -1,
            LETTERS      = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
            DIGITS       = "0123456789",
            OTHERS       = "",
            ALNUM        = "",
            fcom         = [],
            alterj       = false,
            theLookahead = EOF,

            //blockspace normalizes whitespace at the front of any
            //retained comments.
            blockspace   = function jsmin__blockspace(whiteSpace) {
                var noNewLine = whiteSpace.replace(/\n/g, "");
                whiteSpace = whiteSpace.substr(1);
                if (whiteSpace.indexOf("\n") === 0 && noNewLine === "") {
                    return "\n\n";
                }
                if (whiteSpace.indexOf("\n") > -1) {
                    return "\n\n ";
                }
                return "\n ";
            },

            //isAlphanum -- return true if the character is a letter,
            //digit, underscore, dollar sign, or non-ASCII character.
            isAlphanum   = function jsmin__isAlphanum(c) {
                if (typeof c === "string") {
                    return c !== EOF && (ALNUM.indexOf(c) > -1 || c.charCodeAt(0) > 126);
                }
                return false;
            },

            //jsasiq is a response to a regular expression and only
            //serves to verify the white space in question contains a
            //new line character
            jsasiq       = function jsmin__jsasiq(x) {
                if (x.indexOf("\n") === -1) {
                    return x;
                }
                x    = x.split("");
                x[0] = x[0] + ";";
                return x.join("");
            },

            //semiword ensures that a semicolon is inserted for newlines
            //following:  return, continue, break, throw
            semiword     = function jsmin__semiword(x) {
                var noSpace = x.replace(/\s+/, "");
                if (x.indexOf("\n") > -1) {
                    return noSpace + ";";
                }
                return noSpace + " ";
            },

            //asifix determines whether "}" or ")" need to be followed
            //by a semicolon during automatic semicolon insertion.  This
            //part cannot be performed with simple minification
            //reduction or a regular expression due to nesting.  Instead
            //this one aspect of automatic semicolon must be treated
            //as a logical irregularity of a regular syntax, much like
            //deducing XML.
            asiFix       = function jsmin__asiFix(input) {
                var aa      = 0,
                    chars   = input.split(""),
                    bb      = chars.length,
                    c       = 0,
                    counter = 0,
                    quoteA  = "",
                    quoteB  = "",
                    starter = "",
                    ender   = "";
                for (aa = 0; aa < bb; aa += 1) {
                    if (chars[aa] === "\\") {
                        aa += 1;
                    } else if (chars[aa] === "\"" && quoteB === "") {
                        quoteB = "\"";
                    } else if (chars[aa] === "'" && quoteB === "") {
                        quoteB = "'";
                    } else if (chars[aa] === "/" && quoteB === "" && !isAlphanum(chars[aa - 1]) && chars[aa - 1] !== ")" && chars[aa - 1] !== "]") {
                        if (chars[aa - 1] === " ") {
                            chars[aa - 1] = "";
                            if (!isAlphanum(chars[aa - 2])) {
                                quoteB    = "/";
                                chars[aa] = "pd";
                            } else if (chars[aa + 1] === " ") {
                                chars[aa + 1] = "";
                            }
                        } else {
                            quoteB    = "/";
                            chars[aa] = "pd";
                        }
                    } else if (chars[aa] === "/" && quoteB === "" && chars[aa + 1] === " " && isAlphanum(chars[aa - 1])) {
                        chars[aa + 1] = "";
                    } else if (chars[aa] === "\"" && quoteB === "\"") {
                        quoteB = "";
                    } else if (chars[aa] === "'" && quoteB === "'") {
                        quoteB = "";
                    } else if (chars[aa] === "/" && quoteB === "/") {
                        quoteB    = "";
                        chars[aa] = "pd";
                    } else if ((quoteB === "'" || quoteB === "\"") && chars[aa - 2] === "\\" && chars[aa - 1] === ";") {
                        chars[aa - 1] = "";
                        chars[aa - 2] = " ";
                    } else if (quoteB === "" && (chars[aa] === "}" || chars[aa] === ")")) {
                        if ((chars[aa + 1] !== "(" && chars[aa + 1] !== "[" && chars[aa + 1] !== "," && chars[aa + 1] !== ";" && chars[aa + 1] !== "." && chars[aa + 1] !== "?" && chars[aa + 1] !== "*" && chars[aa + 1] !== "+" && chars[aa + 1] !== "-" && (chars[aa + 1] !== "\n" || (chars[aa + 1] === "\n" && chars[aa + 2] !== "(" && chars[aa + 2] !== "[" && chars[aa + 2] !== "+" && chars[aa + 2] !== "-" && chars[aa + 2] !== "/")) && typeof chars[aa - 3] === "string" && chars[aa - 2] === "=" && chars[aa - 1] === "{" && chars[aa] === "}" && (chars[aa + 1] !== "\n" || (chars[aa + 1] === "\n" && chars[aa + 2] !== "+" && chars[aa + 2] !== "-")) && (isAlphanum(chars[aa - 3]) || chars[aa - 3] === "]" || chars[aa - 3] === ")"))) {
                            chars[aa] += ";";
                        } else {
                            counter = -1;
                            quoteA  = "";
                            starter = "";
                            if (chars[aa] === "}") {
                                starter = "}";
                                ender   = "{";
                            } else {
                                starter = ")";
                                ender   = "(";
                            }
                            for (c = aa - 1; c > -1; c -= 1) {
                                if ((c > 1 && chars[c - 1] === "\\" && chars[c - 2] !== "\\") || (c === 1 && chars[c - 1] === "\\")) {
                                    c -= 1;
                                } else {
                                    if (chars[c].charAt(0) === starter && quoteA === "") {
                                        counter -= 1;
                                    } else if (chars[c] === ender && quoteA === "") {
                                        counter += 1;
                                    } else if (chars[c] === "\"" && quoteA === "") {
                                        quoteA = "\"";
                                    } else if (chars[c] === "'" && quoteA === "") {
                                        quoteA = "'";
                                    } else if (chars[c] === "pd" && quoteA === "") {
                                        quoteA = "/";
                                    } else if (chars[c] === "\"" && quoteA === "\"") {
                                        quoteA = "";
                                    } else if (chars[c] === "'" && quoteA === "'") {
                                        quoteA = "";
                                    } else if (chars[c] === "pd" && quoteA === "/") {
                                        quoteA = "";
                                    }
                                }
                                if (counter === 0 && (c !== aa - 1 || (c === aa - 1 && typeof chars[c - 1] === "string" && chars[c - 1] !== chars[aa]))) {
                                    if (chars[c - 1] === ")" && starter === "}") {
                                        c       -= 2;
                                        counter = -1;
                                        quoteA  = "";
                                        for (c; c > -1; c -= 1) {
                                            if ((c > 1 && chars[c - 1] === "\\" && chars[c - 2] !== "\\") || (c === 1 && chars[c - 1] === "\\")) {
                                                c -= 1;
                                            } else {
                                                if (chars[c] === ")" && quoteA === "") {
                                                    counter -= 1;
                                                } else if (chars[c] === "(" && quoteA === "") {
                                                    counter += 1;
                                                } else if (chars[c] === "\"" && quoteA === "") {
                                                    quoteA = "\"";
                                                } else if (chars[c] === "'" && quoteA === "") {
                                                    quoteA = "'";
                                                } else if (chars[c] === "pd" && quoteA === "") {
                                                    quoteA = "/";
                                                } else if (chars[c] === "\"" && quoteA === "\"") {
                                                    quoteA = "";
                                                } else if (chars[c] === "'" && quoteA === "'") {
                                                    quoteA = "";
                                                } else if (chars[c] === "pd" && quoteA === "/") {
                                                    quoteA = "";
                                                }
                                            }
                                            if (counter === 0) {
                                                c -= 1;
                                                if (chars[aa + 1] !== "(" && chars[aa + 1] !== "[" && chars[aa + 1] !== "," && chars[aa + 1] !== ";" && chars[aa + 1] !== "." && chars[aa + 1] !== "?" && chars[aa + 1] !== "*" && chars[aa + 1] !== "+" && chars[aa + 1] !== "-" && typeof chars[c - 9] === "string" && chars[c - 8] === "=" && chars[c - 7] === "f" && chars[c - 6] === "u" && chars[c - 5] === "n" && chars[c - 4] === "c" && chars[c - 3] === "t" && chars[c - 2] === "i" && chars[c - 1] === "o" && chars[c] === "n" && (isAlphanum(chars[c - 9]) || chars[c - 9] === "]" || chars[c - 9] === ")")) {
                                                    chars[aa] += ";";
                                                }
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                    if (typeof chars[c - 2] === "string" && chars[c - 1] === "=" && (chars[aa - 1].length === 1 || chars[aa - 1] === "pd") && (isAlphanum(chars[c - 2] || chars[c - 2] === "]" || chars[c - 2] === ")"))) {
                                        if (chars[aa + 1] !== "(" && chars[aa + 1] !== "[" && chars[aa + 1] !== "," && chars[aa + 1] !== ";" && chars[aa + 1] !== "." && chars[aa + 1] !== "?" && chars[aa + 1] !== "*" && chars[aa + 1] !== "+" && chars[aa + 1] !== "-" && (chars[aa + 1] !== "\n" || (chars[aa + 1] === "\n" && chars[aa + 2] !== "(" && chars[aa + 2] !== "[" && chars[aa + 2] !== "+" && chars[aa + 2] !== "-" && chars[aa + 2] !== "/")) && (typeof chars[aa + 1] !== "string" || chars[aa + 1] !== "/")) {
                                            chars[aa] += ";";
                                        }
                                        break;
                                    }
                                    break;
                                }
                            }
                        }
                    } else if (quoteB === "" && chars[aa] === "\n") {
                        if ((/\w/).test(chars[aa + 1]) && chars[aa - 1] !== "}" && chars[aa - 1] !== ")" && chars[aa - 1].indexOf(";") === -1) {
                            chars[aa] = ";";
                        } else {
                            chars[aa] = "";
                        }
                    }
                }
                for (aa = 0; aa < bb; aa += 1) {
                    if (chars[aa] === "pd") {
                        chars[aa] = "/";
                    }
                }
                return chars.join("").replace(/\"/g, "\"").replace(/\'/g, "'");
            },

            //reduction provides a logical compression to flatten
            //redundantly applied CSS properties
            reduction    = function jsmin__reduction(x) {
                var aa           = 0,
                    e            = 0,
                    length       = 0,
                    noWordIndex  = -1,
                    marginCount  = 0,
                    paddingCount = 0,
                    marginIndex  = 0,
                    buildLen     = x.length,
                    c            = [],
                    build        = [],
                    fragment     = [],
                    margin       = [],
                    test         = false,

                    //colorLow is used in a replace method to convert
                    //CSS hex colors from uppercase alpha characters to
                    //lowercase and in some cases shorten hex color
                    //codes from 6 characters to 3.
                    colorLow     = function jsmin__reduction_colorLow(colorInput) {
                        var firstChar = colorInput.charAt(0),
                            tooLong   = false;
                        if (colorInput.length === 8 || colorInput.length === 5) {
                            colorInput = colorInput.substr(1);
                            tooLong    = true;
                        }
                        colorInput = colorInput.toLowerCase();
                        if (colorInput.length === 7 && colorInput.charAt(1) === colorInput.charAt(2) && colorInput.charAt(3) === colorInput.charAt(4) && colorInput.charAt(5) === colorInput.charAt(6)) {
                            colorInput = "#" + colorInput.charAt(1) + colorInput.charAt(3) + colorInput.charAt(5);
                        }
                        if (tooLong === true && (/\s/).test(firstChar) === false && firstChar !== ":") {
                            colorInput = firstChar + " " + colorInput;
                        } else if (tooLong === true && firstChar === ":") {
                            colorInput = ":PDpoundPD" + colorInput;
                        } else if (tooLong === true && (/\s/).test(firstChar) === true) {
                            colorInput = " " + colorInput;
                        }
                        return colorInput;
                    };
                (function jsmin__reduction_semicolonRepair() {
                    var misssemi   = function jsmin__reduction_semicolonRepair_misssemi(cssSample) {
                            if (cssSample.indexOf("\n") === -1) {
                                return cssSample;
                            }
                            return cssSample.replace(/\s+/, ";");
                        },
                        lengthSemi = x.length,
                        fragments  = [],
                        semiIndex  = 0,
                        fragmenta  = "";
                    for (aa = 0; aa < lengthSemi; aa += 1) {
                        fragments.push(x.charAt(aa));
                        if (x.charAt(aa) === "{" || x.charAt(aa + 1) === "}") {
                            if (fragments[0] === "}") {
                                build.push("}");
                                fragments[0] = "";
                            }
                            fragmenta = fragments.join("");
                            if (fragmenta.indexOf("{") > -1) {
                                semiIndex = Math.max(fragmenta.lastIndexOf("\n"), fragmenta.lastIndexOf(";"));
                                build.push(fragmenta.substring(0, semiIndex + 1).replace(/^(\s+)/, "").replace(/(\w|\)|"|')\s+/g, misssemi));
                                build.push(fragmenta.substring(semiIndex + 1));
                            } else {
                                build.push(fragmenta.replace(/^(\s+)/, "").replace(/\s+\w+(\-\w+)*:/g, misssemi));
                            }
                            fragments = [];
                        }
                    }
                    build.push("}");
                }());
                //looks for multidimensional structures, SCSS, and pulls
                //direct properties above child structures
                (function jsmin__reduction_scss() {
                    var aaa          = 0,
                        ccc          = 0,
                        lengthScss   = build.length,
                        blockCounter = 0,
                        blockState   = 1,
                        subBuild     = [],
                        partFirst    = [],
                        partSecond   = [],
                        blockTest    = false;
                    for (aaa = 0; aaa < lengthScss; aaa += 1) {
                        if (build[aaa] === "}") {
                            blockCounter -= 1;
                            if (blockCounter === blockState - 1 && subBuild.length > 0) {
                                partFirst  = build.slice(0, aaa);
                                partSecond = build.slice(aaa, build.length);
                                build      = [].concat(partFirst, subBuild, partSecond);
                                subBuild   = [];
                                aaa        = partFirst.length - 1;
                                lengthScss = build.length;
                            }
                        } else if (build[aaa].indexOf("{") > -1) {
                            blockCounter += 1;
                            if (blockCounter > blockState) {
                                blockTest  = true;
                                blockState = blockCounter - 1;
                                subBuild.push(build[aaa]);
                                build[aaa] = "";
                                for (ccc = aaa + 1; ccc < lengthScss; ccc += 1) {
                                    subBuild.push(build[ccc]);
                                    if (build[ccc].indexOf("{") > -1) {
                                        blockCounter += 1;
                                        build[ccc]   = "";
                                    } else if (build[ccc] === "}") {
                                        blockCounter -= 1;
                                        build[ccc]   = "";
                                        if (blockCounter === blockState) {
                                            break;
                                        }
                                    } else {
                                        build[ccc] = "";
                                    }
                                }
                            }
                        }
                    }
                    if (blockTest === true) {
                        lengthScss = build.length;
                        subBuild   = [];
                        for (aaa = 0; aaa < lengthScss; aaa += 1) {
                            if (subBuild.length > 0 && subBuild[subBuild.length - 1].indexOf("{") === -1 && build[aaa] !== "}" && build[aaa].indexOf("{") === -1) {
                                subBuild[subBuild.length - 1] = subBuild[subBuild.length - 1] + build[aaa];
                            } else if (build[aaa] !== "") {
                                subBuild.push(build[aaa]);
                            }
                        }
                        build = [].concat(subBuild);
                    }
                }());
                buildLen = build.length;
                for (aa = 0; aa < buildLen - 1; aa += 1) {
                    if (build[aa].charAt(build[aa].length - 1) !== "{") {
                        if (build[aa].indexOf("url(") > -1) {
                            fragment = build[aa].split("");
                            length   = fragment.length;
                            for (e = 3; e < length; e += 1) {
                                if (fragment[e - 3] === "u" && fragment[e - 2] === "r" && fragment[e - 1] === "l" && fragment[e] === "(") {
                                    test = true;
                                }
                                if (test === true) {
                                    if (fragment[e - 1] !== "\\" && fragment[e] === ")") {
                                        test = false;
                                    } else if (fragment[e] === ";") {
                                        fragment[e] = "~PrettyDiffSemi~";
                                    } else if (fragment[e] === ":") {
                                        fragment[e] = "~PrettyDiffColon~";
                                    }
                                }
                            }
                            build[aa] = fragment.join("");
                        }
                        if (build[aa].charAt(build[aa].length - 1) === ";") {
                            build[aa] = build[aa].substr(0, build[aa].length - 1);
                        }
                        if (build[aa].slice(0, 2) === "/*" || build[aa].indexOf("{") > -1 || build[aa].indexOf(",") > build[aa].length - 3) {
                            c = [build[aa]];
                        } else {
                            c = build[aa].replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))(?=(;|\s|\)\}|,))/g, colorLow).replace(/:/g, "~PDCSEP~").split(";").sort();
                        }
                        length   = c.length;
                        fragment = [];
                        for (e = 0; e < length; e += 1) {
                            if (c[e].charAt(0) === "_") {
                                c.push(c[e]);
                                c.splice(e, 1);
                            }
                            fragment.push(c[e].split("~PDCSEP~"));
                        }
                        c            = [].concat(fragment);
                        length       = c.length;
                        marginCount  = 0;
                        paddingCount = 0;
                        noWordIndex  = -1;

                        //This small loop removes duplicate CSS
                        //properties from a sorted list
                        for (e = 1; e < length; e += 1) {
                            if (c[e].length > 1 && c[e][0] === c[e - 1][0]) {
                                c[e - 1] = [
                                    "", ""
                                ];
                            }
                        }
                        for (e = 0; e < length; e += 1) {
                            if (c[e - 1] && c[e - 1][0] === c[e][0] && (/\-[a-z]/).test(c[e - 1][1]) === false && (/\-[a-z]/).test(c[e][1]) === false) {
                                c[e - 1] = [
                                    "", ""
                                ];
                            }
                            if (c[e][0] !== "margin" && c[e][0].indexOf("margin") !== -1) {
                                marginCount += 1;
                                if (marginCount === 4) {
                                    margin      = [c[e][1]];
                                    marginIndex = e;
                                    do {
                                        marginIndex -= 1;
                                        if (c[marginIndex].length > 1 && c[marginIndex][1] !== "") {
                                            margin.push(c[marginIndex][1]);
                                            c[marginIndex] = [
                                                "", ""
                                            ];
                                        }
                                    } while (margin.length < 4 && marginIndex > 0);
                                    c[e]        = [
                                        "margin", margin[0] + " " + margin[1] + " " + margin[3] + " " + margin[2]
                                    ];
                                    marginCount = 0;
                                }
                            } else if (c[e][0] !== "padding" && c[e][0].indexOf("padding") !== -1) {
                                paddingCount += 1;
                                if (paddingCount === 4) {
                                    margin      = [c[e][1]];
                                    marginIndex = e;
                                    do {
                                        marginIndex -= 1;
                                        if (c[marginIndex].length > 1 && c[marginIndex][1] !== "") {
                                            margin.push(c[marginIndex][1]);
                                            c[marginIndex] = [
                                                "", ""
                                            ];
                                        }
                                    } while (margin.length < 4 && marginIndex > 0);
                                    c[e]         = [
                                        "padding", margin[0] + " " + margin[1] + " " + margin[3] + " " + margin[2]
                                    ];
                                    paddingCount = 0;
                                }
                            }
                            if (noWordIndex === -1 && c[e + 1] && c[e][0].charAt(0) !== "-" && (c[e][0].indexOf("cue") !== -1 || c[e][0].indexOf("list-style") !== -1 || c[e][0].indexOf("outline") !== -1 || c[e][0].indexOf("overflow") !== -1 || c[e][0].indexOf("pause") !== -1) && (c[e][0] === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")) || c[e][0].substring(0, c[e][0].lastIndexOf("-")) === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")))) {
                                noWordIndex = e;
                                if (c[noWordIndex][0].indexOf("-") !== -1 && c[noWordIndex][0] !== "list-style") {
                                    c[noWordIndex][0] = c[noWordIndex][0].substring(0, c[noWordIndex][0].lastIndexOf("-"));
                                }
                            } else if (noWordIndex !== -1 && c[noWordIndex][0] === c[e][0].substring(0, c[e][0].lastIndexOf("-"))) {
                                if (c[noWordIndex][0] === "cue" || c[noWordIndex][0] === "pause") {
                                    c[noWordIndex][1] = c[e][1] + " " + c[noWordIndex][1];
                                } else {
                                    c[noWordIndex][1] = c[noWordIndex][1] + " " + c[e][1];
                                }
                                c[e] = [
                                    "", ""
                                ];
                            } else if (noWordIndex !== -1) {
                                noWordIndex = -1;
                            }
                        }
                        for (e = 0; e < length; e += 1) {
                            if (c[e].length > 1 && c[e][0] !== "") {
                                for (marginIndex = e + 1; marginIndex < length; marginIndex += 1) {
                                    if (c[marginIndex].length > 1 && c[e][0] === c[marginIndex][0]) {
                                        c[e] = [
                                            "", ""
                                        ];
                                    }
                                }
                            }
                        }
                        fragment = [];
                        for (e = 0; e < length; e += 1) {
                            if (typeof c[e] !== "string" && c[e] !== undefined && c[e][0] !== "") {
                                fragment[e] = c[e].join(":");
                            } else if (typeof c[e] === "string") {
                                fragment[e] = c[e].replace(/~PDCSEP~/g, ":");
                            }
                        }
                        build[aa] = fragment.join(";").replace(/;+/g, ";").replace(/^;/, "");
                        if (build[aa] !== "}" && typeof build[aa + 1] === "string" && build[aa + 1] !== "}" && build[aa + 1].indexOf("{") > -1 && (/(\,\s*)$/).test(build[aa]) === false) {
                            build[aa] = build[aa] + ";";
                        }
                    }
                    build[aa] = build[aa].replace(/\)\s+\{/g, "){");
                }
                return build.join("").replace(/PDpoundPD#/g, "#");
            },

            //fixURI forcefully writes double quote characters around
            //URI fragments in CSS.  If parenthesis characters are
            //characters of the URI they must be escaped with a
            //backslash, "\)", in accordance with the CSS specification,
            //or they will damage the output.
            fixURI       = function jsmin__fixURI(y) {
                var aa          = 0,
                    uriFragment = [],
                    c           = "",
                    uris        = y.replace(/\\\)/g, "~PDpar~").split("url("),
                    uriLen      = uris.length,
                    quote       = "";
                for (aa = 1; aa < uriLen; aa += 1) {
                    quote = "\"";
                    if (uris[aa].charAt(0) === "\"") {
                        quote = "";
                    } else if (uris[aa].charAt(0) === "'") {
                        uris[aa] = uris[aa].substr(1, uris[aa].length - 1);
                    }
                    uriFragment = uris[aa].split(")");
                    c           = uriFragment[0];
                    if (c.charAt(c.length - 1) !== "\"" && c.charAt(c.length - 1) !== "'") {
                        c = c + "\"";
                    } else if (c.charAt(c.length - 1) === "'" || c.charAt(c.length - 1) === "\"") {
                        c = c.substr(0, c.length - 1) + "\"";
                    }
                    uriFragment[0] = c;
                    uris[aa]       = "url(" + quote + uriFragment.join(")");
                }
                return uris.join("").replace(/~PDpar~/g, "\\)");
            },

            //fixNegative is used to correct the collision between a
            //number or increment and a hyphen
            fixNegative  = function jsmin__fixNegative(x) {
                return x.replace(/\-/, " -");
            },

            //rgbToHex is used in a replace method to convert CSS colors
            //from RGB definitions to hex definitions
            rgbToHex     = function jsmin__rgbToHex(x) {
                var toHex = function jsmin__rgbToHex_toHex(z) {
                        z = Number(z).toString(16);
                        if (z.length === 1) {
                            z = "0" + z;
                        }
                        return z;
                    };
                return "#" + x.replace(/\d+/g, toHex).replace(/rgb\(/, "").replace(/,/g, "").replace(/\)/, "").replace(/(\s*)/g, "");
            },

            //sameDist is used in a replace method to shorten redundant
            //CSS distances to the fewest number of non-redundant
            //increments
            sameDist     = function jsmin__sameDist(y) {
                var cssProperty = y.split(":"),
                    x           = [];
                if (cssProperty[0].indexOf("background") > -1 || cssProperty.length > 2) {
                    return y;
                }
                x = cssProperty[1].split(" ");
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
                return cssProperty[0] + ":" + x.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
            },
            singleZero   = function jsmin__singleZero(x) {
                var property = x.substr(0, x.indexOf(":") + 1);
                if (property === "radius:" || property === "shadow:" || x.charAt(x.length - 1) !== "0" || (x.charAt(x.length - 1) === "0" && x.charAt(x.length - 2) !== " ")) {
                    return x;
                }
                return property + "0";
            },

            //endZero is used in a replace method to convert "20.0" to
            //"20" in CSS
            endZero      = function jsmin__endZero(x) {
                var dot = x.indexOf(".");
                return x.substr(0, dot);
            },

            //startZero is used in a replace method to convert "0.02" to
            //".02" in CSS
            startZero    = function jsmin__startZero(x) {
                var dot = x.indexOf(".");
                return x.charAt(0) + x.substr(dot, x.length);
            },

            //This function prevents percentage numbers from running
            //together
            fixpercent   = function jsmin__fixpercent(x) {
                return x.replace(/%/, "% ");
            },

            //This function is used to fix a bizarre JS automatic
            //semilcolon insertion (ASI) edgecase of a closing paren,
            //some amount of white space containing a new line
            //character, and an exclamation character not followed by
            //an equal character
            bangFix      = function jsmin__bangFix(x) {
                if (x.indexOf("\n") > -1) {
                    return ");!";
                }
                return x;
            },

            //get -- return the next character. Watch out for lookahead.
            //If the character is a control character, translate it to a
            //space or linefeed.
            get          = function jsmin__get() {
                var lookAhead = theLookahead;
                if (geti === getl) {
                    return EOF;
                }
                theLookahead = EOF;
                if (lookAhead === EOF) {
                    lookAhead = input.charAt(geti);
                    geti      += 1;
                }
                if (lookAhead >= " " || lookAhead === "\n") {
                    return lookAhead;
                }
                if (lookAhead === "\r") {
                    return "\n";
                }
                return " ";
            },

            //peek -- get the next character without getting it.
            peek         = function jsmin__peek() {
                theLookahead = get();
                return theLookahead;
            },

            //next -- get the next character, excluding comments. peek()
            //is used to see if a "/" is followed by a "/" or "*".
            next         = function jsmin__next() {
                var got = get();
                if (got === "/" && (type === "javascript" || (type === "css" && peek() !== "/"))) {
                    switch (peek()) {
                    case "/":
                        for (;;) {
                            got = get();
                            if (got <= "\n") {
                                return got;
                            }
                        }
                        break;
                    case "*":
                        get();
                        for (;;) {
                            switch (get()) {
                            case "'":
                                got = get().replace(/'/, "");
                                break;
                            case "\"":
                                got = get().replace(/"/, "");
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
                        return got;
                    }
                }
                return got;
            },

            //action -- do something! What you do is determined by the
            //argument:
            //   1   Output A. Copy B to A. Get the next B.
            //   2   Copy B to A. Get the next B. (Delete A).
            //   3   Get the next B. (Delete B).
            //action treats a string as a single character. Wow!
            //action recognizes a regular expression if it is preceded
            //by ( or , or =.
            action       = function jsmin__action(rule) {
                var build = [];
                if (rule === 1) {
                    build.push(a);
                }
                if (rule < 3) {
                    a = b;
                    if (a === "'" || a === "\"") {
                        if (rule === 1 && (build[0] === ")" || build[0] === "]") && alterj === true) {
                            a = ";";
                            return build[0];
                        }
                        for (;;) {
                            build.push(a);
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
                                build.push(a);
                                a = get();
                            }
                        }
                    }
                }
                b = next();
                if (b === "/" && "(,=:[!&|".indexOf(a) > -1 && type !== "css") {
                    build.push(a);
                    build.push(b);
                    for (;;) {
                        a = get();
                        if (a === "/") {
                            break;
                        }
                        if (a === "\\") {
                            build.push(a);
                            a = get();
                        } else if (a <= "\n") {
                            error = "Error: unterminated JavaScript Regular Expression literal";
                            return error;
                        }
                        build.push(a);
                    }
                    b = next();
                }
                return build.join("");
            },

            //m -- Copy the input to the output, deleting the characters
            //which are insignificant to JavaScript. Comments will be
            //removed. Tabs will be replaced with spaces. Carriage
            //returns will be replaced with linefeeds.  Most spaces and
            //linefeeds will be removed.
            min          = function jsmin__min() {
                var build        = [],
                    syntax       = "",
                    buildLen     = 0,
                    asiflag      = true,
                    conflag      = false,
                    asiParenTest = function jsmin__min_asiParenTest() {
                        var c = build.length - 2,
                            d = 1;
                        if (build[c - 2] + build[c - 1] + build[c] === "}()" || build[c - 2] + build[c - 1] + build[c] === "})(") {
                            return;
                        }
                        for (c; c > -1; c -= 1) {
                            if (build[c] === ")") {
                                d += 1;
                            }
                            if (build[c] === "(") {
                                d -= 1;
                            }
                            if (d === 0) {
                                break;
                            }
                            if (d < 0) {
                                return;
                            }
                        }
                        c -= 1;
                        if (build[c - 4] + build[c - 3] + build[c - 2] + build[c - 1] + build[c] === "while" || build[c - 1] + build[c] === "if" || build[c - 2] + build[c - 1] + build[c] === "for") {
                            asiflag = false;
                        }
                    };
                if (error !== "") {
                    return error;
                }
                a = "\n";
                build.push(action(3));
                while (a !== EOF) {
                    if (a === " " && type !== "css" && b !== "#") {
                        if (isAlphanum(b) === true) {
                            build.push(action(1));
                        } else {
                            build.push(action(2));
                            if (alterj === true) {
                                syntax = build[build.length - 1];
                                if ((isAlphanum(syntax) === true || syntax === "'" || syntax === "\"" || syntax === "]" || syntax === ")") && a === "}") {
                                    build.push(";");
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
                            build.push(action(1));
                            break;
                        case " ":
                            build.push(action(3));
                            break;
                        default:
                            if (isAlphanum(b) === true) {
                                build.push(action(1));
                            } else {
                                if (level === 1 && b !== "\n") {
                                    build.push(action(1));
                                } else {
                                    build.push(action(2));
                                }
                            }
                        }
                    } else {
                        switch (b) {
                        case " ":
                            if (isAlphanum(a) === true) {
                                build.push(action(1));
                                break;
                            }
                            build.push(action(3));
                            break;
                        case "\n":
                            if (level === 1 && a !== "\n") {
                                build.push(action(1));
                            } else if (a === "}") {
                                asiflag = true;
                                if (level === 3) {
                                    build.push(action(3));
                                } else {
                                    build.push(action(1));
                                }
                            } else if (isAlphanum(a) === true) {
                                build.push(action(1));
                                if (alterj === true) {
                                    syntax = build[build.length - 1];
                                    if (syntax === ":") {
                                        asiflag = false;
                                    }
                                    if (asiflag === true && (isAlphanum(syntax) === true || syntax === "]" || syntax === ")") && a === "\n" && (b === "}" || b === " ")) {
                                        build.push(";");
                                    }
                                }
                            } else {
                                build.push(action(3));
                            }
                            break;
                        default:
                            build.push(action(1));
                            if (alterj === true) {
                                syntax = build[build.length - 1];
                                if (syntax === "{") {
                                    asiflag = true;
                                } else if (syntax.charAt(0) === ":") {
                                    asiflag = false;
                                } else if ((build[build.length - 3] + build[build.length - 2] + build[build.length - 1] === "if(") || (build[build.length - 4] + build[build.length - 3] + build[build.length - 2] + build[build.length - 1] === "for(")) {
                                    asiflag = false;
                                    conflag = true;
                                } else if (build[build.length - 1] === "(" && build[build.length - 2] === "") {
                                    buildLen = build.length - 2;
                                    do {
                                        buildLen -= 1;
                                    } while (build[buildLen] === "");
                                    if ((build[buildLen - 1] + build[buildLen] + build[build.length - 1] === "if(") || (build[buildLen - 2] + build[buildLen - 1] + build[buildLen] + build[build.length - 1] === "for(")) {
                                        asiflag = false;
                                        conflag = true;
                                    }
                                }
                                if (asiflag === true && (((syntax === "]" || syntax === ")") && isAlphanum(a) === true && a !== "/") || (a === "}" && (isAlphanum(syntax) === true || syntax === "'" || syntax === "\"")))) {
                                    if (syntax === ")") {
                                        asiParenTest();
                                    }
                                    if (asiflag === true) {
                                        build.push(";");
                                    }
                                }
                                if (conflag === true && syntax === ")") {
                                    asiflag = true;
                                    conflag = false;
                                }
                            }
                            break;
                        }
                    }
                }
                return build.join("").replace(/;\]/g, "]");
            };
        (function jsmin__topComments() {
            var aa      = 0,
                length  = input.length,
                comment = "",
                cdata   = (/^(\s*<\!\[CDATA\[)/).test(input);
            if (fcomment === false || (cdata === false && (/^(\s*\/\*)/).test(input) === false && (/^(\s*\/\/)/).test(input) === false) || (cdata === true && (/^(\s*<\!\[CDATA\[\s*\/\*)/).test(input) === false && (/^(\s*<\!\[CDATA\[\s*\/\/)/).test(input) === false)) {
                return;
            }
            if (cdata === true) {
                fcom.push("<![CDATA[");
                input = input.replace(/^(\s*<\!\[CDATA\[)/, "").replace(/(\]\]>\s*)$/, "");
            }
            for (aa = 0; aa < length; aa += 1) {
                if (comment === "") {
                    if (input.charAt(aa) === "/" && typeof input.charAt(aa + 1) === "string" && (input.charAt(aa + 1) === "*" || input.charAt(aa + 1) === "/")) {
                        comment = input.substr(aa, 2);
                        fcom.push(input.charAt(aa));
                    } else if (/\s/.test(input.charAt(aa)) === false) {
                        input = input.substr(aa);
                        return;
                    }
                } else {
                    fcom.push(input.charAt(aa));
                    if (input.charAt(aa) === "*" && comment === "/*" && input.charAt(aa + 1) && input.charAt(aa + 1) === "/") {
                        fcom.push("/\n");
                        if (input.charAt(aa + 2) && input.charAt(aa + 2) === "\n") {
                            aa += 2;
                        } else {
                            aa += 1;
                        }
                        comment = "";
                    } else if ((input.charAt(aa) === "\n" || input.charAt(aa) === "\r") && comment === "//") {
                        comment = "";
                    }
                }
            }
        }());
        if (type === "css") {
            OTHERS = "-._\\";
        } else {
            if (alter === true && level === 2) {
                alterj = true;
                input  = input.replace(/\r\n?/g, "\n").replace(/("|')\s+["'a-zA-Z_$]/g, jsasiq).replace(/\)\s+\!(?!\=)/g, bangFix);
            }
            OTHERS = "_$//";
        }
        if (type === "css" && alter === true) {
            input = reduction(input.replace(/; /g, ";\n"));
        }
        ALNUM = LETTERS + DIGITS + OTHERS;
        geti  = 0;
        getl  = input.length;
        ret   = min(input);
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