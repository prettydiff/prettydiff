/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " " */
/*global pd, exports, define */
/*
 Special thanks to:

 * Harry Whitfield for the numerous test cases provided against
 JSPretty.  http://g6auc.me.uk/

 * Andreas Greuel for contributing samples to test diffview.js
 https://plus.google.com/105958105635636993368/posts

 * Maria Ramos for translating the documentation to Spanish.
 http://www.webhostinghub.com/support/es/misc/

 @source: http://prettydiff.com/prettydiff.js
 @documentation - English: http://prettydiff.com/documentation.php
 @documentation - Spanish:
 http://www.webhostinghub.com/support/es/misc/diff-documentacion

 @licstart  The following is the entire license notice for the
 JavaScript code in this page.

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
        var startTime     = (function startTime() {
                var date = new Date(),
                    time = date.getTime();
                return time;
            }()),
            summary       = "",
            charDecoder   = function charDecoder(input) {
                var a         = 0,
                    b         = 0,
                    index     = 0,
                    inputLenA = 0,
                    inputLenB = 0,
                    output    = [],
                    entity    = [],
                    type      = [],
                    uni       = (/u\+[0-9a-f]{4,5}\+/),
                    unit      = (/u\![0-9a-f]{4,5}\+/),
                    htmln     = (/\&\#[0-9]{1,6}\;/),
                    htmlt     = (/\&\![0-9]{1,6}\;/);
                if ((pd === undefined || pd.o.rh === null || pd.o.rh === undefined || typeof pd.o.rh.innerHTML !== "string") || (input.search(unit) === -1 && input.search(uni) === -1 && input.search(htmlt) === -1 && input.search(htmln) === -1)) {
                    return input;
                }
                inputLenA = input.length;
                for (b = 0; b < inputLenA; b += 1) {
                    if (input.search(htmln) === -1 || (input.search(uni) < input.search(htmln) && input.search(uni) !== -1)) {
                        index = input.search(uni);
                        type.push(index + "|h");
                        inputLenB = input.length;
                        for (a = index; a < inputLenB; a += 1) {
                            if (input.charAt(a) === "+" && input.charAt(a - 1) === "u") {
                                input = input.slice(0, a) + "!" + input.slice(a + 1);
                            }
                            if (input.charAt(a) === "+" && input.charAt(a - 1) !== "u") {
                                a += 1;
                                break;
                            }
                        }
                        entity.push(input.slice(index + 2, a - 1));
                        input = input.replace(unit, "");
                    } else if (input.search(uni) === -1 || (input.search(htmln) < input.search(uni) && input.search(htmln) !== -1)) {
                        index = input.search(htmln);
                        type.push(index + "|d");
                        inputLenB = input.length;
                        for (a = index; a < inputLenB; a += 1) {
                            if (input.charAt(a) === "#") {
                                input = input.slice(0, a) + "!" + input.slice(a + 1);
                            }
                            if (input.charAt(a) === ";") {
                                a += 1;
                                break;
                            }
                        }
                        entity.push(input.slice(index + 2, a - 1));
                        input = input.replace(htmlt, "");
                    }
                    if (input.search(uni) === -1 && input.search(htmln) === -1) {
                        break;
                    }
                }
                input = input.replace(/u\![0-9a-f]{4,5}\+/g, "").replace(/\&\![0-9]{1,6}\;/g, "").split("");
                index = entity.length;
                for (b = 0; b < index; b += 1) {
                    type[b] = type[b].split("|");
                    if (type[b][1] === "h") {
                        entity[b] = parseInt(entity[b], 16);
                    }
                    pd.o.rh.innerHTML = "&#" + parseInt(entity[b], 10) + ";";
                    entity[b]         = pd.o.rh.innerHTML;
                    output.push(entity[b]);
                }
                return output.join("");
            },
            csvbeauty     = function csvbeauty(source, ch) {
                var errorLocation  = "",
                    a              = 0,
                    b              = 0,
                    quotedNewlines = [],
                    error          = "Error: Unterminated string begging at character number ";
                (function csvbeauty__logic() {
                    var bb     = 0,
                        srcLen = 0,
                        src    = [];
                    source = source.replace(/"{2}/g, "{csvquote}");
                    src    = source.split("");
                    srcLen = src.length;
                    for (a = 0; a < srcLen; a += 1) {
                        if (src[a] === "\"") {
                            for (bb = a + 1; bb < srcLen; bb += 1) {
                                if (src[bb] === "\"") {
                                    quotedNewlines.push(source.slice(a, bb + 1));
                                    src[a]  = "{csvstring}";
                                    src[bb] = "";
                                    a       = bb + 1;
                                    break;
                                }
                                src[bb] = "";
                            }
                            if (bb === srcLen) {
                                errorLocation = src.join("").slice(a, a + 9);
                                source        = error;
                                return;
                            }
                        }
                    }
                    source = src.join("").replace(/\{csvquote\}/g, "\"\"");
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
                        return source + a + ", '" + errorLocation + "'.";
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
                b = quotedNewlines.length;
                for (a = 0; a < b; a += 1) {
                    quotedNewlines[a] = quotedNewlines[a].replace(/\n/g, "{ }");
                    source            = source.replace("{csvstring}", quotedNewlines[a]);
                }
                return source.replace(/\{csvquote\}/g, "\"");
            },
            csvmin        = function csvmin(source, ch) {
                if (ch === "") {
                    ch = ",";
                } else {
                    ch = charDecoder(ch);
                }
                (function csvmin__logic() {
                    var multiline     = function csvmin__logic_multiline(x) {
                            var output = [],
                                y      = 0,
                                len    = x.length - 2;
                            if (len === 0) {
                                return "{ }";
                            }
                            for (y = 0; y < len; y += 1) {
                                output.push(ch);
                            }
                            return output.join("") + "{ }";
                        },
                        a             = 0,
                        b             = 0,
                        segment       = [],
                        partLen       = 0,
                        part          = [],
                        srcLines      = source.replace(/\n\n\{\-\}\n\n/g, "{-}").replace(/\n{2,}/g, multiline).split("\n"),
                        srcLen        = srcLines.length,
                        errorLocation = "",
                        error         = "Error: Unterminated String begging at character number ";
                    for (a = 0; a < srcLen; a += 1) {
                        segment = [];
                        if (typeof srcLines[a] === "string" && srcLines[a].indexOf("\"") !== -1) {
                            part    = srcLines[a].split("");
                            partLen = part.length;
                            for (b = 0; b < partLen; b += 1) {
                                if (part[b] === "\"") {
                                    segment.push(b);
                                }
                            }
                            if (segment.length === 1) {
                                srcLines[a]   = part.join("");
                                errorLocation = srcLines[a].slice(segment[0], segment[0] + 9);
                                return error + (srcLines.join(ch).indexOf(srcLines[a]) + segment[0]) + " or value number " + (a + 1) + ", '" + errorLocation + "'.";
                            }
                            if (segment.length > 2) {
                                partLen = segment.length - 1;
                                for (b = 1; b < partLen; b += 1) {
                                    part[segment[b]] = "\"\"";
                                }
                            }
                            srcLines[a] = part.join("");
                        }
                    }
                    if (srcLines[srcLines.length - 1] === "{|}") {
                        srcLines[srcLines.length - 1] = "";
                    }
                    source = srcLines.join(ch).replace(/\n/g, ch);
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
            jsmin         = function jsmin(args) {
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
                    isAlphanum   = function jsmin__isAlphanum(c) {
                        if (typeof c === "string") {
                            return c !== EOF && (ALNUM.indexOf(c) > -1 || c.charCodeAt(0) > 126);
                        }
                        return false;
                    },
                    jsasiq       = function jsmin__jsasiq(x) {
                        if (x.indexOf("\n") === -1) {
                            return x;
                        }
                        x    = x.split("");
                        x[0] = x[0] + ";";
                        return x.join("");
                    },
                    semiword     = function jsmin__semiword(x) {
                        var noSpace = x.replace(/\s+/, "");
                        if (x.indexOf("\n") > -1) {
                            return noSpace + ";";
                        }
                        return noSpace + " ";
                    },
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
                                if (build[aa].indexOf("{") > -1 || build[aa].indexOf(",") > build[aa].length - 3) {
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
                    fixNegative  = function jsmin__fixNegative(x) {
                        return x.replace(/\-/, " -");
                    },
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
                    endZero      = function jsmin__endZero(x) {
                        var dot = x.indexOf(".");
                        return x.substr(0, dot);
                    },
                    startZero    = function jsmin__startZero(x) {
                        var dot = x.indexOf(".");
                        return x.charAt(0) + x.substr(dot, x.length);
                    },
                    fixpercent   = function jsmin__fixpercent(x) {
                        return x.replace(/%/, "% ");
                    },
                    bangFix      = function jsmin__bangFix(x) {
                        if (x.indexOf("\n") > -1) {
                            return ");!";
                        }
                        return x;
                    },
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
                    peek         = function jsmin__peek() {
                        theLookahead = get();
                        return theLookahead;
                    },
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
                    min          = function jsmin__min() {
                        var build    = [],
                            syntax   = "",
                            buildLen = 0,
                            asiflag  = true,
                            conflag  = false;
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
                                            build.push(";");
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
            },
            cleanCSS      = function cleanCSS(args) {
                var source          = (typeof args.source !== "string" || args.source === "") ? "Error: no source supplied to cleanCSS." : args.source,
                    size       = (typeof args.size !== "number" || args.size < 0) ? 4 : args.size,
                    character  = (typeof args.character !== "string") ? " " : args.character,
                    comment    = (args.comment === "noindent") ? "noindent" : "",
                    alter      = (args.alter === true) ? true : false,
                    sourceLen          = source.length,
                    a          = 0,
                    commsLen          = 0,
                    comments          = [],
                    commstor   = [],
                    atchar     = source.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
                    tab        = "",
                    nsize      = Number(size),
                    fixURI     = function cleanCSS__fixURI(y) {
                        var aa = 0,
                            uriFragment = [],
                            c = "",
                            uris = y.replace(/\\\)/g, "~PDpar~").split("url("),
                            uriLen  = uris.length,
                            quote  = "",
                            process  = (y.indexOf("data~PrettyDiffColon~") > -1 && y.indexOf("~PrettyDiffSemi~base64") > y.indexOf("data~PrettyDiffColon~")) ? true : false;
                        for (aa = 1; aa < uriLen; aa += 1) {
                            quote = "\"";
                            if (uris[aa].charAt(0) === "\"") {
                                quote = "";
                            } else if (uris[aa].charAt(0) === "'") {
                                uris[aa] = uris[aa].substr(1, uris[aa].length - 1);
                            }
                            uriFragment = uris[aa].split(")");
                            c = uriFragment[0];
                            if (c.charAt(c.length - 1) !== "\"" && c.charAt(c.length - 1) !== "'") {
                                c = c + "\"";
                            } else if (c.charAt(c.length - 1) === "'" || c.charAt(c.length - 1) === "\"") {
                                c = c.substr(0, c.length - 1) + "\"";
                            }
                            if (process === true) {
                                uriFragment[0] = c.replace(/ ?\/ ?/g, "/").replace(/\n{2}/g, "\n");
                            } else {
                                uriFragment[0] = c.replace(/\s*\/(\s*)/g, "/");
                            }
                            uris[aa] = "url(" + quote + uriFragment.join(")");
                        }
                        return uris.join("").replace(/~PDpar~/g, "\\)");
                    },
                    sameDist   = function cleanCSS__sameDist(y) {
                        var cssProperty = y.split(": "),
                            x = [];
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
                        } else if (x.length === 2 && x[0] === x[1]) {
                            x[1] = "";
                        }
                        return cssProperty[0] + ": " + x.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
                    },
                    endZero    = function cleanCSS__endZero(y) {
                        var dot = y.indexOf(".");
                        return y.substr(0, dot);
                    },
                    runZero    = function cleanCSS__runZero(y) {
                        var first = y.charAt(0);
                        if (first === "#" || first === "." || (/[a-f0-9]/).test(first) === true) {
                            return y;
                        }
                        return first + "0;";
                    },
                    startZero  = function cleanCSS__startZero(y) {
                        return y.replace(/ \./g, " 0.");
                    },
                    emptyend   = function cleanCSS__emptyend(y) {
                        var spaceStart  = y.match(/^(\s*)/)[0],
                            noTab = spaceStart.substr(0, spaceStart.length - tab.length);
                        if (y.charAt(y.length - 1) === "}") {
                            return noTab + "}";
                        }
                        return noTab.replace(/(\s+)$/, "");
                    },
                    fixpercent = function cleanCSS__fixpercent(y) {
                        return y.replace(/%/, "% ");
                    },
                    nestblock  = function cleanCSS__nestblock(y) {
                        return y.replace(/\s*;\n/, "\n");
                    },
                    cleanAsync = function cleanCSS__cleanAsync() {
                        var i    = 0,
                            j    = 0,
                            localLen    = sourceLen,
                            tabs = [],
                            tabb = "",
                            out  = [tab],
                            build    = source.split("");
                        for (i = 0; i < localLen; i += 1) {
                            if ("{" === build[i]) {
                                tabs.push(tab);
                                tabb = tabs.join("");
                                out.push(" {\n");
                                out.push(tabb);
                            } else if ("\n" === build[i]) {
                                out.push("\n");
                                out.push(tabb);
                            } else if ("}" === build[i]) {
                                out[out.length - 1] = out[out.length - 1].replace(/\s*$/, "");
                                tabs                = tabs.slice(0, tabs.length - 1);
                                tabb                = tabs.join("");
                                if (build[i + 1] + build[i + 2] !== "*\/") {
                                    out.push("\n");
                                    out.push(tabb);
                                    out.push("}\n");
                                    out.push(tabb);
                                } else {
                                    out.push("\n");
                                    out.push(tabb);
                                    out.push("}");
                                }
                            } else if (build[i - 1] === "," && (/\s/).test(build[i]) === false) {
                                out.push(" ");
                                out.push(build[i]);
                            } else if (";" === build[i] && "}" !== build[i + 1]) {
                                out.push(";\n");
                                out.push(tabb);
                            } else if (i > 3 && build[i - 3] === "u" && build[i - 2] === "r" && build[i - 1] === "l" && build[i] === "(") {
                                for (j = i; j < localLen; j += 1) {
                                    out.push(build[j]);
                                    if (build[j] === ")" && build[j - 1] !== "\\") {
                                        i = j;
                                        break;
                                    }
                                }
                            } else {
                                out.push(build[i]);
                            }
                        }
                        if (i >= localLen) {
                            out  = [out.join("").replace(/^(\s*)/, "").replace(/(\s*)$/, "")];
                            source    = out.join("");
                            tabs = [];
                        }
                    },
                    reduction  = function cleanCSS__reduction(x) {
                        var aa       = 0,
                            e        = 0,
                            length        = 0,
                            noWordIndex        = -1,
                            marginCount        = 0,
                            paddingCount        = 0,
                            marginIndex        = 0,
                            buildLen       = x.length,
                            cc       = [],
                            build        = [],
                            fragment        = [],
                            margin        = [],
                            test     = false,
                            colorLow = function cleanCSS__reduction_colorLow(colorInput) {
                                var firstChar = colorInput.charAt(0),
                                    tooLong = false;
                                if (colorInput.length === 8 || colorInput.length === 5) {
                                    colorInput   = colorInput.substr(1);
                                    tooLong = true;
                                }
                                colorInput = colorInput.toLowerCase();
                                if (colorInput.length === 7 && colorInput.charAt(1) === colorInput.charAt(2) && colorInput.charAt(3) === colorInput.charAt(4) && colorInput.charAt(5) === colorInput.charAt(6)) {
                                    colorInput = "#" + colorInput.charAt(1) + colorInput.charAt(3) + colorInput.charAt(5);
                                }
                                if (firstChar === ":") {
                                    colorInput = firstChar + "PDpoundPD" + colorInput;
                                } else if (tooLong === true && (/\s/).test(firstChar) === false && firstChar !== "(") {
                                    colorInput = firstChar + " " + colorInput;
                                } else if (tooLong === true && ((/\s/).test(firstChar) === true || firstChar === "(")) {
                                    colorInput = firstChar + colorInput;
                                }
                                return colorInput;
                            },
                            propertyComment       = "",
                            propertyCommentIn     = (/[\w\s:#\-\=\!\(\)"'\[\]\.%-\_\?\/\\]\/(\*)/),
                            propertyCommentOut     = function cleanCSS__reduction_propertyCommentOut(z) {
                                if (z.indexOf("\n/*") === 0) {
                                    return z;
                                }
                                return z.replace(/\s*\/(\*)/, ";/*");
                            },
                            commfix  = function cleanCSS_reduction_commfix(y) {
                                if (y.charAt(y.length - 1) === "}") {
                                    return y.replace(";", "");
                                }
                                return y.replace(";", "\n");
                            };
                        (function cleanCSS__reduction_missingSemicolon() {
                            var misssemi = function cleanCSS__reduction_missingSemicolon_misssemi(cssSample) {
                                    if (cssSample.indexOf("\n") === -1) {
                                        return cssSample;
                                    }
                                    return cssSample.replace(/\s+/, ";");
                                },
                                lengthSemi        = x.length,
                                fragments      = [],
                                semiIndex      = 0,
                                fragmenta      = "";
                            for (aa = 0; aa < lengthSemi; aa += 1) {
                                if (x.charAt(aa) === "/" && x.charAt(aa + 1) === "*") {
                                    build.push(fragments.join(""));
                                    fragments = [];
                                    if ((/\s/).test(x.charAt(aa - 1)) === true) {
                                        for (marginCount = aa - 1; marginCount > -1; marginCount -= 1) {
                                            if (x.charAt(marginCount) === "\n") {
                                                fragments.push("\n");
                                                break;
                                            }
                                            if ((/\s/).test(x.charAt(marginCount)) === false) {
                                                break;
                                            }
                                        }
                                    }
                                    do {
                                        fragments.push(x.charAt(aa));
                                        aa += 1;
                                    } while (x.charAt(aa - 2) !== "*" || (x.charAt(aa - 2) === "*" && x.charAt(aa - 1) !== "/"));
                                    if (x.charAt(aa) === "\n") {
                                        fragments.push("\n");
                                    }
                                    build.push(fragments.join(""));
                                    fragments = [];
                                    if (x.charAt(aa) === "}") {
                                        build.push("}");
                                    }
                                } else {
                                    fragments.push(x.charAt(aa));
                                    if (x.charAt(aa) === "{" || x.charAt(aa + 1) === "}") {
                                        if (fragments[0] === "}") {
                                            build.push("}");
                                            fragments[0] = "";
                                        }
                                        fragmenta = fragments.join("");
                                        if (fragmenta.indexOf("{") > -1 && (fragmenta.indexOf("\n") > -1 || fragmenta.indexOf(";") > -1)) {
                                            semiIndex = Math.max(fragmenta.lastIndexOf("\n"), fragmenta.lastIndexOf(";"));
                                            build.push(fragmenta.substring(0, semiIndex + 1).replace(/(\w|\)|"|')\s+/g, misssemi));
                                            build.push(fragmenta.substring(semiIndex + 1));
                                        } else {
                                            build.push(fragmenta.replace(/(\w|\)|"|')\s+/g, misssemi));
                                        }
                                        fragments = [];
                                    }
                                }
                            }
                            build.push("}");
                        }());
                        (function cleanCSS__reduction_scss() {
                            var aaa = 0,
                                ccc = 0,
                                lengthScss = build.length,
                                blockCounter = 0,
                                blockState = 1,
                                subBuild = [],
                                partFirst = [],
                                partSecond = [],
                                blockTest = false;
                            for (aaa = 0; aaa < lengthScss; aaa += 1) {
                                if (build[aaa] === "}") {
                                    blockCounter -= 1;
                                    if (blockCounter === blockState - 1 && subBuild.length > 0) {
                                        partFirst = build.slice(0, aaa);
                                        partSecond = build.slice(aaa, build.length);
                                        build   = [].concat(partFirst, subBuild, partSecond);
                                        subBuild = [];
                                        aaa = partFirst.length - 1;
                                        lengthScss = build.length;
                                    }
                                } else if (build[aaa].indexOf("{") > -1 && (build[aaa].indexOf("/*") === 0 || build[aaa].indexOf("\n/*") === 0)) {
                                    blockCounter += 1;
                                    if (blockCounter > blockState) {
                                        blockTest = true;
                                        blockState = blockCounter - 1;
                                        subBuild.push(build[aaa]);
                                        build[aaa] = "";
                                        for (ccc = aaa + 1; ccc < lengthScss; ccc += 1) {
                                            subBuild.push(build[ccc]);
                                            if (build[ccc].indexOf("{") > -1) {
                                                blockCounter    += 1;
                                                build[ccc] = "";
                                            } else if (build[ccc] === "}") {
                                                blockCounter    -= 1;
                                                build[ccc] = "";
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
                                subBuild = [];
                                for (aaa = 0; aaa < lengthScss; aaa += 1) {
                                    if (subBuild.length > 0 && subBuild[subBuild.length - 1].indexOf("{") === -1 && build[aaa] !== "}" && build[aaa].indexOf("{") === -1 && build[aaa].indexOf("/*") !== 0 && build[aaa].indexOf("\n/*") !== 0) {
                                        subBuild[subBuild.length - 1] = subBuild[subBuild.length - 1] + build[aaa];
                                    } else if (build[aaa] !== "") {
                                        subBuild.push(build[aaa]);
                                    }
                                }
                                build = [].concat(subBuild);
                            }
                        }());
                        buildLen = build.length;
                        for (aa = 0; aa < buildLen; aa += 1) {
                            if (build[aa].charAt(build[aa].length - 1) === "{") {
                                build[aa] = build[aa].replace(/>/g, " > ");
                            } else {
                                if (build[aa].indexOf("url(") > -1) {
                                    fragment = build[aa].split("");
                                    length = fragment.length;
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
                                propertyComment = build[aa].replace(propertyCommentIn, propertyCommentOut);
                                cc = propertyComment.replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))/g, colorLow).replace(/\*\//g, "*\/;").replace(/:/g, "~PDCSEP~").split(";");
                                length  = cc.length;
                                fragment  = [];
                                margin  = [];
                                for (e = 0; e < length; e += 1) {
                                    if (/^(\n?\/\*)/.test(cc[e])) {
                                        fragment.push(cc[e].replace(/\/\*\s+/, "/* "));
                                    } else if (cc[e] !== "") {
                                        margin.push(cc[e].replace(/^(\s*)/, ""));
                                    }
                                }
                                margin  = margin.sort();
                                length  = margin.length;
                                cc = [];
                                for (e = 0; e < length; e += 1) {
                                    if (margin[e].charAt(0) === "_") {
                                        margin.push(margin[e]);
                                        margin.splice(e, 1);
                                    }
                                    cc.push(margin[e].split("~PDCSEP~"));
                                }
                                cc = fragment.concat(cc);
                                length  = cc.length;
                                marginCount  = 0;
                                paddingCount  = 0;
                                noWordIndex  = -1;
                                for (e = 1; e < length; e += 1) {
                                    if (cc[e].length > 1 && cc[e][0] === cc[e - 1][0]) {
                                        cc[e - 1] = [
                                            "", ""
                                        ];
                                    }
                                }
                                for (e = 0; e < length; e += 1) {
                                    if (cc[e - 1] && cc[e - 1][0] === cc[e][0] && (/\-[a-z]/).test(cc[e - 1][1]) === false && (/\-[a-z]/).test(cc[e][1]) === false) {
                                        cc[e - 1] = [
                                            "", ""
                                        ];
                                    }
                                    if (cc[e].length > 1 && typeof cc[e][1] === "string" && cc[e][1].length > 2) {
                                        cc[e][1] = cc[e][1].replace(/\//g, " / ").replace(/(\*)/g, "* ");
                                    }
                                    if (cc[e][0] !== "margin" && cc[e][0].indexOf("margin") !== -1) {
                                        marginCount += 1;
                                        if (marginCount === 4) {
                                            margin = [cc[e][1]];
                                            marginIndex = e;
                                            do {
                                                marginIndex -= 1;
                                                if (cc[marginIndex].length > 1 && cc[marginIndex][1] !== "") {
                                                    margin.push(cc[marginIndex][1]);
                                                    cc[marginIndex] = [
                                                        "", ""
                                                    ];
                                                }
                                            } while (margin.length < 4 && marginIndex > 0);
                                            cc[e] = [
                                                "margin", margin[0] + " " + margin[1] + " " + margin[3] + " " + margin[2]
                                            ];
                                            marginCount     = 0;
                                        }
                                    } else if (cc[e][0] !== "padding" && cc[e][0].indexOf("padding") !== -1) {
                                        paddingCount += 1;
                                        if (paddingCount === 4) {
                                            margin = [cc[e][1]];
                                            marginIndex = e;
                                            do {
                                                marginIndex -= 1;
                                                if (cc[marginIndex].length > 1 && cc[marginIndex][1] !== "") {
                                                    margin.push(cc[marginIndex][1]);
                                                    cc[marginIndex] = [
                                                        "", ""
                                                    ];
                                                }
                                            } while (margin.length < 4 && marginIndex > 0);
                                            cc[e] = [
                                                "padding", margin[0] + " " + margin[1] + " " + margin[3] + " " + margin[2]
                                            ];
                                            paddingCount     = 0;
                                        }
                                    }
                                    if (noWordIndex === -1 && cc[e + 1] && cc[e][0].charAt(0) !== "-" && (cc[e][0].indexOf("cue") !== -1 || cc[e][0].indexOf("list-style") !== -1 || cc[e][0].indexOf("outline") !== -1 || cc[e][0].indexOf("overflow") !== -1 || cc[e][0].indexOf("pause") !== -1) && (cc[e][0] === cc[e + 1][0].substring(0, cc[e + 1][0].lastIndexOf("-")) || cc[e][0].substring(0, cc[e][0].lastIndexOf("-")) === cc[e + 1][0].substring(0, cc[e + 1][0].lastIndexOf("-")))) {
                                        noWordIndex = e;
                                        if (cc[noWordIndex][0].indexOf("-") !== -1 && cc[noWordIndex][0] !== "list-style") {
                                            cc[noWordIndex][0] = cc[noWordIndex][0].substring(0, cc[noWordIndex][0].lastIndexOf("-"));
                                        }
                                    } else if (noWordIndex !== -1 && cc[noWordIndex][0] === cc[e][0].substring(0, cc[e][0].lastIndexOf("-"))) {
                                        if (cc[noWordIndex][0] === "cue" || cc[noWordIndex][0] === "pause") {
                                            cc[noWordIndex][1] = cc[e][1] + " " + cc[noWordIndex][1];
                                        } else {
                                            cc[noWordIndex][1] = cc[noWordIndex][1] + " " + cc[e][1];
                                        }
                                        cc[e] = [
                                            "", ""
                                        ];
                                    } else if (noWordIndex !== -1) {
                                        noWordIndex = -1;
                                    }
                                }
                                for (e = 0; e < length; e += 1) {
                                    if (cc[e].length > 1 && cc[e][0] !== "") {
                                        for (marginIndex = e + 1; marginIndex < length; marginIndex += 1) {
                                            if (cc[marginIndex].length > 1 && cc[e][0] === cc[marginIndex][0]) {
                                                cc[e] = [
                                                    "", ""
                                                ];
                                            }
                                        }
                                    }
                                }
                                fragment = [];
                                for (e = 0; e < length; e += 1) {
                                    if (typeof cc[e] !== "string" && cc[e] !== undefined && cc[e][0] !== "") {
                                        if (cc[e][1] === undefined || cc[e][1] === "before" || cc[e][1] === "after" || cc[e][1] === "hover" || cc[e][1] === "link" || cc[e][1] === "visited" || cc[e][1] === "active" || cc[e][1] === "focus" || cc[e][1] === "first-child" || cc[e][1] === "lang" || cc[e][1] === "first-line" || cc[e][1] === "first-letter") {
                                            fragment.push(cc[e].join(":"));
                                        } else {
                                            fragment.push(cc[e].join(": "));
                                        }
                                    } else if (typeof cc[e] === "string") {
                                        fragment.push(cc[e].replace(/~PDCSEP~/g, ": "));
                                    }
                                }
                                build[aa] = (fragment.join(";") + ";").replace(/^;/, "");
                            }
                            if (build[aa].charAt(build[aa].length - 1) === "{") {
                                build[aa] = build[aa].replace(/\,/g, ",\n");
                            }
                        }
                        return build.join("").replace(/\*\/\s*;\s*\}?/g, commfix).replace(/(\s*[\w\-]+:)$/g, "\n}").replace(/\s*;$/, "").replace(/PDpoundPD#/g, "#");
                    };
                (function cleanCSS__tab() {
                    var i = 0,
                        output = [];
                    for (i = 0; i < nsize; i += 1) {
                        output.push(character);
                    }
                    tab = output.join("");
                }());
                if ("\n" === source.charAt(0)) {
                    source = source.substr(1);
                }
                (function cleanCSS__fixSyntaxReplace() {
                    var chars = source.split(""),
                        buildLen  = chars.length,
                        f  = 0,
                        blockComment  = false;
                    for (f = 1; f < buildLen; f += 1) {
                        if (chars[f] === "*" && chars[f - 1] === "/" && blockComment === false) {
                            blockComment = true;
                        } else if (blockComment === true) {
                            if (chars[f] === ",") {
                                chars[f] = "~PrettyDiffComma~";
                            } else if (chars[f] === ";") {
                                chars[f] = "~PrettyDiffSemi~";
                            } else if (chars[f] === "/" && chars[f - 1] === "*") {
                                blockComment = false;
                            }
                        }
                    }
                    source = chars.join("");
                }());
                comments = source.split("*\/");
                commsLen = comments.length;
                for (a = 0; a < commsLen; a += 1) {
                    if (comments[a].search(/\s*\/(\*)/) !== 0) {
                        commstor    = comments[a].split("/*");
                        commstor[0] = commstor[0].replace(/[ \t\r\v\f]+/g, " ").replace(/\n (?!\*)/g, "\n").replace(/\s?([;:{}+>])\s?/g, "$1").replace(/\{(\.*):(\.*)\}/g, "{$1: $2}").replace(/\b(\*)/g, " *").replace(/\*\/\s?/g, "*\/\n").replace(/\d%\.?\d/g, fixpercent);
                        comments[a]        = commstor.join("/*");
                    }
                }
                source = comments.join("*\/");
                if (alter === true) {
                    source = reduction(source.replace(/\,\s+/g, ","));
                }
                cleanAsync();
                if (alter === true) {
                    comments = source.split("*\/");
                    commsLen = comments.length;
                    for (a = 0; a < commsLen; a += 1) {
                        if (comments[a].search(/\s*\/(\*)/) !== 0) {
                            commstor    = comments[a].split("/*");
                            commstor[0] = commstor[0].replace(/@charset\s*("|')?[\w\-]+("|')?;?(\s*)/gi, "").replace(/(\S|\s)0+(%|in|cm|mm|em|ex|pt|pc)?;/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/:[\w\s\!\.\-%#]* \.\d+/g, startZero).replace(/ \.?0((?=;)|(?= )|%|in|cm|mm|em|ex|pt|pc)/g, " 0px");
                            commstor[0] = commstor[0].replace(/\w+(\-\w+)*: ((((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0) )+(((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0)/g, sameDist).replace(/background\-position: 0px;/g, "background-position: 0px 0px;").replace(/\s+\*\//g, "*\/");
                            commstor[0] = commstor[0].replace(/\s*[\w\-]+\:\s*(\}|;)/g, emptyend).replace(/\{\s+\}/g, "{}").replace(/\}\s*;\s*\}/g, nestblock).replace(/:\s+#/g, ": #").replace(/(\s+;+\n)+/g, "\n");
                            comments[a]        = commstor.join("/*");
                        }
                    }
                    source = comments.join("*\/");
                    if (atchar === null) {
                        atchar = [""];
                    } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                        atchar[0] = atchar[0] + ";\n";
                    } else {
                        atchar[0] = atchar[0] + "\n";
                    }
                    source = atchar[0].replace(/@charset/i, "@charset") + fixURI(source).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";").replace(/~PrettyDiffComma~/g, ",");
                }
                if (comment === "noindent") {
                    source = source.replace(/\s+\/(\*)/g, "\n/*").replace(/\n\s+\*\//g, "\n*\/");
                }
                if (summary !== "diff") {
                    (function cleanCSS__report() {
                        var aa = 0,
                            build = [],
                            lines = source.split("\n"),
                            lineLen  = lines.length,
                            requests  = [],
                            lengthInput  = sourceLen.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                            lengthOutput  = source.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                            requestCount  = 0,
                            requestList  = "",
                            j  = 0;
                        for (aa = 0; aa < lineLen; aa += 1) {
                            if (lines[aa].charAt(0) === "/" && lines[aa].charAt(1) === "*") {
                                for (aa; aa < lineLen; aa += 1) {
                                    if (lines[aa].charAt(lines[aa].length - 2) === "*" && lines[aa].charAt(lines[aa].length - 1) === "/") {
                                        break;
                                    }
                                }
                            } else if (lines[aa].indexOf("url") !== -1 && lines[aa].indexOf("url(\"\")") === -1 && lines[aa].indexOf("url('')") === -1 && lines[aa].indexOf("url()") === -1) {
                                build.push(lines[aa]);
                            }
                        }
                        lineLen = build.length;
                        for (aa = 0; aa < lineLen; aa += 1) {
                            build[aa] = build[aa].substr(build[aa].indexOf("url(\"") + 5, build[aa].length);
                            build[aa] = build[aa].substr(0, build[aa].indexOf("\")"));
                        }
                        for (aa = 0; aa < lineLen; aa += 1) {
                            requests[aa] = 1;
                            for (j = aa + 1; j < lineLen; j += 1) {
                                if (build[aa] === build[j]) {
                                    requests[aa] += 1;
                                    build[j] = "";
                                }
                            }
                        }
                        for (aa = 0; aa < lineLen; aa += 1) {
                            if (build[aa] !== "") {
                                requestCount     += 1;
                                requests[aa] = requests[aa] + "x";
                                if (requests[aa] === "1x") {
                                    requests[aa] = "<em>" + requests[aa] + "</em>";
                                }
                                build[aa] = "<li>" + requests[aa] + " - " + build[aa] + "</li>";
                            }
                        }
                        if (lineLen !== 0) {
                            requestList = "<h4>List of HTTP requests:</h4><ul>" + build.join("") + "</ul>";
                        }
                        summary = "<p><strong>Total input size:</strong> <em>" + lengthInput + "</em> characters</p><p><strong>Total output size:</strong> <em>" + lengthOutput + "</em> characters</p><p><strong>Number of HTTP requests:</strong> <em>" + requestCount + "</em></p>" + requestList;
                    }());
                }
                return source;
            },
            jspretty      = function jspretty(args) {
                var source    = (typeof args.source === "string" && args.source.length > 0) ? args.source + " " : "Error: no source code supplied to jspretty!",
                    jsize     = (args.insize > 0) ? args.insize : ((Number(args.insize) > 0) ? Number(args.insize) : 4),
                    jchar     = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                    jpres     = (args.preserve === false) ? false : true,
                    jlevel    = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
                    jspace    = (args.space === false) ? false : true,
                    jbrace    = (args.braces === "allman") ? true : false,
                    jcomment  = (args.comments === "noindent") ? "noindent" : (args.comments === "nocomment") ? "nocomment" : "indent",
                    jsscope   = (args.jsscope === true) ? true : false,
                    jscorrect = (args.correct === true) ? true : false,
                    token     = [],
                    types     = [],
                    level     = [],
                    lines     = [],
                    globals   = [],
                    meta      = [],
                    varlist   = [],
                    news      = 0,
                    stats     = {
                        comma       : 0,
                        commentBlock: {
                            token: 0,
                            chars: 0
                        },
                        commentLine : {
                            token: 0,
                            chars: 0
                        },
                        container   : 0,
                        number      : {
                            token: 0,
                            chars: 0
                        },
                        operator    : {
                            token: 0,
                            chars: 0
                        },
                        regex       : {
                            token: 0,
                            chars: 0
                        },
                        semicolon   : 0,
                        space       : {
                            newline: 0,
                            other  : 0,
                            space  : 0,
                            tab    : 0
                        },
                        string      : {
                            token: 0,
                            chars: 0,
                            quote: 0
                        },
                        word        : {
                            token: 0,
                            chars: 0
                        }
                    },
                    semi      = 0,
                    result    = "";
                if (source === "Error: no source code supplied to jspretty!") {
                    return source;
                }
                //this function tokenizes the source code into an array
                //of literals and syntax tokens
                (function jspretty__tokenize() {
                    var a            = 0,
                        b            = source.length,
                        c            = source.split(""),
                        lasttwo      = [],
                        ltoke        = "",
                        ltype        = "",
                        lengtha      = 0,
                        lengthb      = 0,
                        block        = {
                            count : 0, //paren count off
                            start : -1, //prevent some interference
                            dotest: false, //check for alignment of do and while
                            flag  : false, //move between keywords and condition end
                            bcount: [], //counting braces present since recent start insertion
                            brace : [], //list of indexes prior to missing brace
                            method: [], //if in a method move to next end brace
                            pcount: [], //block count off for prior block tests
                            prev  : [], //block.prior value of prior closed block
                            prior : [], //does a brace already exist following a missing brace
                            simple: [], //is a condition expected?
                            word  : [], //a list from the code sample of the words:  if, else, for, do, while
                            cs    : (jscorrect === true) ? "{" : "x{",
                            ce    : (jscorrect === true) ? "}" : "x}"
                        },
                        blockpop     = function jspretty__tokenize_blockpop() {
                            block.bcount.pop();
                            block.brace.pop();
                            block.method.pop();
                            block.pcount.pop();
                            block.prior.pop();
                            block.simple.pop();
                        },
                        commentcheck = function jspretty__tokenize_commentcheck() {
                            var aa = 0,
                                bb = 0,
                                cc = token.length - 1;
                            if ((token[cc] !== "}" && token[cc] !== "x}") || block.prior[block.prior.length - 1] === true) {
                                return;
                            }
                            for (aa = cc - 1; aa > -1; aa -= 1) {
                                if (types[aa] === "end") {
                                    bb += 1;
                                }
                                if (types[aa] === "start" || types[aa] === "method") {
                                    bb -= 1;
                                }
                                if (bb === -1) {
                                    break;
                                }
                            }
                            if ((token[aa] === "{" || token[aa] === "x{") && (types[aa - 1] === "comment" || types[aa - 1] === "comment-inline")) {
                                token.pop();
                                types.pop();
                                token.splice(aa, 1);
                                types.splice(aa, 1);
                            }
                        },
                        elsestart    = function jspretty__tokenize_elsestart() {
                            var bb   = 0,
                                r    = 0,
                                x    = block.word.length - 1,
                                y    = token.length - 1,
                                z    = 0,
                                test = (function jspretty__tokenize_elsestart_test() {
                                    var g     = a + 1,
                                        space = /\s/;
                                    for (g; g < b; g += 1) {
                                        if (c[g] === "{") {
                                            return true;
                                        }
                                        if (space.test(c[g]) === false) {
                                            return false;
                                        }
                                    }
                                }());
                            if (test === true) {
                                return;
                            }
                            block.bcount.push(0);
                            block.brace.push("else");
                            block.method.push(0);
                            block.pcount.push(0);
                            block.prior.push(false);
                            block.simple.push(true);
                            block.flag  = false;
                            block.count = 0;
                            types.pop();
                            token.pop();
                            for (y; y > -1; y -= 1) {
                                if (token[y] === "}" || token[y] === "x}") {
                                    r += 1;
                                }
                                if (token[y] === "{" || token[y] === "x{") {
                                    r -= 1;
                                }
                                if (token[y] === "if") {
                                    bb += 1;
                                }
                                if (token[y] === "else" && token[y + 1] !== "if") {
                                    bb -= 1;
                                }
                                if (r < 0) {
                                    break;
                                }
                            }
                            for (x; x > -1; x -= 1) {
                                if (block.word[x] !== "if" && block.word[x] !== "else") {
                                    bb -= 1;
                                }
                                if (block.word[x] === "if") {
                                    if (block.prev[x] === true) {
                                        bb -= 1;
                                    }
                                    break;
                                }
                            }
                            if (block.prev[block.prev.length - 1] === true || (token[token.length - 2] !== "}" && token[token.length - 2] !== "x}" && block.prev[block.prev.length - 1] === false)) {
                                token.push("else");
                                types.push("word");
                                return;
                            }
                            r = a - 4;
                            if ((/\s/).test(c[r]) === true) {
                                do {
                                    r -= 1;
                                } while ((/\s/).test(c[r]) === true);
                            }
                            if (c[r] === "}" || c[r] === "x}") {
                                token.push("else");
                                types.push("word");
                                return;
                            }
                            for (bb -= 1; bb > -1; bb -= 1) {
                                z -= 1;
                                if ((token[token.length - 2] !== "}" && token[token.length - 2] !== "x}") || block.prev[z] === true) {
                                    break;
                                }
                                token.pop();
                                types.pop();
                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                    lines[lines.length - 1][0] -= 1;
                                }
                                block.bcount.push(0);
                                block.brace.push("else");
                                block.method.push(0);
                                block.pcount.push(0);
                                block.prior.push(false);
                                block.simple.push(true);
                            }
                            token.push("else");
                            types.push("word");
                        },
                        methodtest   = function jspretty__tokenize_methodtest() {
                            var cc = 0,
                                dd = 0;
                            for (cc = token.length - 2; cc > -1; cc -= 1) {
                                if (types[cc] === "end") {
                                    dd += 1;
                                }
                                if (types[cc] === "start" || types[cc] === "method") {
                                    dd -= 1;
                                }
                                if (dd === -1) {
                                    if (types[cc] === "method") {
                                        block.method[block.method.length - 1] += 1;
                                    }
                                    return;
                                }
                            }
                        },
                        objtest      = function jspretty__tokenize_objtest() {
                            var cc = 0,
                                dd = 0;
                            for (cc = token.length - 2; cc > -1; cc -= 1) {
                                if (types[cc] === "end") {
                                    dd += 1;
                                }
                                if (types[cc] === "start" || types[cc] === "method") {
                                    dd -= 1;
                                }
                                if (dd === -1) {
                                    if (token[cc - 1] !== "=" && token[cc - 1] !== "==" && token[cc - 1] !== "===" && (token[cc] === "{" || token[cc] === "x{") && block.method.length > 0 && ((types[cc - 1] === "operator" && token[cc - 1] !== ":") || token[cc - 1] === "{" || token[cc - 1] === "x{" || token[cc - 1] === "[")) {
                                        block.method[block.method.length - 1] -= 1;
                                    }
                                    return;
                                }
                            }
                        },
                        whiletest    = function jspretty__tokenize_whiletest() {
                            var cc = 0,
                                dd = 1;
                            for (cc = token.length - 3; cc > -1; cc -= 1) {
                                if (token[cc] === "}" || token[cc] === "x}") {
                                    dd += 1;
                                }
                                if (token[cc] === "{" || token[cc] === "x{") {
                                    dd -= 1;
                                }
                                if (dd > 0 && token[cc] === "do") {
                                    block.dotest = true;
                                    token.pop();
                                    types.pop();
                                    do {
                                        dd -= 1;
                                        block.brace.push(-1);
                                        block.simple.push(false);
                                        block.method.push(0);
                                        token.pop();
                                        types.pop();
                                    } while (dd > 0);
                                    if (block.start === -1) {
                                        block.start = 0;
                                    }
                                    block.flag  = false;
                                    block.count = 0;
                                    token.push("while");
                                    return types.push("word");
                                }
                                if (dd === 0) {
                                    if (token[cc - 1] === "do") {
                                        block.dotest = true;
                                    }
                                    return;
                                }
                            }
                        },
                        plusplus     = function jspretty__tokenize_plusplus(x, y) {
                            var store = [],
                                op    = "",
                                cc    = 0,
                                dd    = 0;
                            if (y === "post" && c[a] === ")" && token[lengtha - 3] === ",") {
                                for (cc = lengtha - 1; cc > -1; cc -= 1) {
                                    if (types[cc] === "end") {
                                        dd += 1;
                                    }
                                    if (types[cc] === "start" || types[cc] === "method") {
                                        dd -= 1;
                                    }
                                    if (dd < 0) {
                                        if (types[cc] === "method" || token[cc - 1] === "function") {
                                            return;
                                        }
                                        break;
                                    }
                                }
                            }
                            if (token[x] === "++") {
                                op = "+=";
                            } else {
                                op = "-=";
                            }
                            if (y === "pre") {
                                store.push(token[x + 1]);
                                store.push(types[x + 1]);
                                token.pop();
                                types.pop();
                                token.pop();
                                types.pop();
                                token.push(store[0]);
                                types.push(store[1]);
                                token.push(op);
                                types.push("operator");
                                token.push("1");
                                types.push("literal");
                            } else {
                                token.pop();
                                types.pop();
                                token.push(op);
                                types.push("operator");
                                token.push("1");
                                types.push("literal");
                            }
                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                lines[lines.length - 1][0] += 1;
                            }
                        },
                        asi          = function jspretty__tokenize_asi(z) {
                            var length    = token.length - 1,
                                last      = token[length],
                                nextCharA = c[z],
                                nextCharB = c[z + 1],
                                asiTest   = false,
                                syntax    = (/[\(\)\[\]\{\}\=&<>\+\-\*\/\!\?\|\^:%(0-9)\\]/),
                                jj        = 0,
                                kk        = 0,
                                ll        = 0,
                                store     = [],
                                space     = (/\s/),
                                colon     = false,
                                elsetest  = false;
                            if (space.test(c[z]) === true) {
                                do {
                                    z += 1;
                                } while (z < b && space.test(c[z]) === true);
                                if (c[z] === ":") {
                                    return;
                                }
                                nextCharA = c[z];
                                nextCharB = c[z + 1];
                            }
                            if (last === "else") {
                                return;
                            }
                            if (last === "return" || last === "break" || last === "continue" || last === "throw") {
                                jj = length - 1;
                                if (types[jj] === "comment" || types[jj] === "comment-inline") {
                                    do {
                                        jj -= 1;
                                    } while (types[jj] === "comment" || types[jj] === "comment-inline");
                                }
                                if (token[jj] !== ":") {
                                    asiTest = true;
                                }
                            }
                            if (asiTest === false && last === ")") {
                                for (jj = length - 1; jj > -1; jj -= 1) {
                                    if (types[jj] === "end") {
                                        kk += 1;
                                    }
                                    if (types[jj] === "start" || types[jj] === "method") {
                                        kk -= 1;
                                    }
                                    if (kk === -1) {
                                        if (token[jj] === "(" && (token[jj - 1] === "function" || token[jj - 2] === "function" || token[jj - 1] === "if" || token[jj - 1] === "for" || token[jj - 1] === "while" || token[jj - 1] === "catch" || token[jj - 1] === "switch")) {
                                            return;
                                        }
                                        break;
                                    }
                                }
                            }
                            if (asiTest === false && (last === "}" || last === "x}")) {
                                for (jj = a; jj < b; jj += 1) {
                                    if (space.test(c[jj]) === false) {
                                        break;
                                    }
                                }
                                if (c[jj] === "e" && c[jj + 1] === "l" && c[jj + 2] === "s" && c[jj + 3] === "e") {
                                    return;
                                }
                            }
                            if (asiTest === false && (nextCharB + c[z + 2] === "++" || nextCharB + c[z + 2] === "--")) {
                                if (space.test(c[z]) === true) {
                                    for (jj = z; jj > -1; jj -= 1) {
                                        if (c[jj] === "\n" || c[jj] === "\r" || space.test(c[jj]) === false) {
                                            break;
                                        }
                                    }
                                    if (c[jj] === "\n" || c[jj] === "\r") {
                                        for (jj = z + 3; jj < b; jj += 1) {
                                            if (space.test(c[jj]) === false) {
                                                if (syntax.test(c[jj]) === true) {
                                                    c.splice(jj, 0, ";");
                                                    b    += 1;
                                                    semi += 1;
                                                    return;
                                                }
                                                asiTest   = true;
                                                nextCharB = "";
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            if (asiTest === false && (last === ";" || last === "x;" || last === "," || last === ":" || last === "{" || last === "x{" || last === "[" || nextCharB === "]" || (nextCharA !== "}" && (nextCharB === ";" || nextCharB === "," || nextCharB === "." || nextCharB === "(")) || nextCharB === "+" || nextCharB === "*" || nextCharB === "-" || nextCharB === "%" || nextCharB === "!" || nextCharB === "=" || nextCharB === "^" || nextCharB === "?" || ltype === "operator" || ltype === "comment" || ltype === "comment-inline" || (nextCharB === "/" && c[z + 2] !== "/" && c[z + 2] !== "*"))) {
                                return;
                            }
                            if (asiTest === false && (last === ")" || last === "]" || token[length - 1] === "break" || token[length - 1] === "return" || token[length - 1] === "continue" || token[length - 1] === "throw" || (nextCharA === "}" && (token[length - 1] === "{" || token[length - 1] === "x{")))) {
                                kk = 0;
                                for (jj = length; jj > -1; jj -= 1) {
                                    if (types[jj] === "end") {
                                        kk += 1;
                                    }
                                    if (types[jj] === "start" || types[jj] === "method") {
                                        kk -= 1;
                                    }
                                    if (kk < 0 && jj < length - 1) {
                                        if (((token[length - 1] === "{" || token[length - 1] === "x{") && (token[jj - 1] === "if" || token[jj - 1] === "for" || token[jj - 1] === "while")) || ((token[jj] === "{" || token[jj] === "x{") && jj < length - 1 && colon === false)) {
                                            kk      = 0;
                                            asiTest = true;
                                            break;
                                        }
                                        return;
                                    }
                                    if (kk === 0) {
                                        if (token[jj] === ":") {
                                            colon = true;
                                        }
                                        if (token[jj] === "=" || token[jj] === "return" || token[jj] === ";") {
                                            break;
                                        }
                                        if (c[a] === ")" && token[jj] === "(" && (token[jj - 1] === "function" || (types[jj - 1] === "word" && token[jj - 2] === "function"))) {
                                            return;
                                        }
                                    }
                                }
                                kk      = 0;
                                asiTest = true;
                            }
                            if (asiTest === false && nextCharA !== "}" && nextCharB + c[z + 2] + c[z + 3] + c[z + 4] === "else") {
                                asiTest  = true;
                                elsetest = true;
                            }
                            if (asiTest === false) {
                                for (jj = length; jj > -1; jj -= 1) {
                                    if (types[jj] === "end") {
                                        kk    += 1;
                                        colon = false;
                                    }
                                    if (types[jj] === "start" || types[jj] === "method") {
                                        kk -= 1;
                                    }
                                    if (kk < 0) {
                                        if (((token[jj] === "{" || token[jj] === "x{") && token[jj - 1] === ")") || ((token[length - 1] === "{" || token[length - 1] === "x{") && nextCharA === "}") || token[jj + 1] === "return" || token[jj + 1] === "break" || token[jj + 1] === "continue" || token[jj + 1] === "throw") {
                                            asiTest = true;
                                            break;
                                        }
                                        return;
                                    }
                                    if (kk === 0) {
                                        if (nextCharA === "}" || (nextCharA !== "}" && nextCharB === "}")) {
                                            if (token[jj] === ":") {
                                                colon = true;
                                            }
                                            if (token[jj] === "," && colon === true) {
                                                return;
                                            }
                                        }
                                        if (token[jj] === "return" || token[jj] === "=" || (token[jj] === "else" && token[jj + 1] !== "{" && token[jj + 1] !== "x{" && token[jj + 1] !== "if")) {
                                            asiTest = true;
                                            break;
                                        }
                                        if (token[jj - 1] === "while") {
                                            for (ll = jj - 2; ll > -1; ll -= 1) {
                                                if (token[jj - 2] !== "}" && token[jj - 2] !== "x}" && token[ll] === ";" && ll < jj - 2 && kk === 0) {
                                                    return;
                                                }
                                                if (types[ll] === "end") {
                                                    kk += 1;
                                                }
                                                if (types[ll] === "start" || types[ll] === "method") {
                                                    kk -= 1;
                                                }
                                                if (kk < 0) {
                                                    return;
                                                }
                                                if (kk === 0 && token[ll] === "do") {
                                                    break;
                                                }
                                            }
                                            if (ll === -1) {
                                                return;
                                            }
                                            break;
                                        }
                                        if (token[jj] === "do" && token[jj + 1] !== "{" && token[jj + 1] !== "x{") {
                                            asiTest = true;
                                            break;
                                        }
                                        if (types[jj] === "start" || types[jj] === "method" || token[jj] === ";" || token[jj] === "," || token[jj] === "do") {
                                            if (((token[jj - 1] === "else" || token[jj - 1] === "for" || token[jj - 1] === "catch" || token[jj - 1] === "if") && elsetest === false) || ((token[jj] === "{" || token[jj] === "x{") && token[jj - 1] === "do")) {
                                                if (token[jj - 1] !== "if" && token[jj - 1] !== "for") {
                                                    if (types[length] === "end") {
                                                        return;
                                                    }
                                                    asiTest = true;
                                                    break;
                                                }
                                                kk = 1;
                                                for (ll = jj + 1; ll < length + 1; ll += 1) {
                                                    if (token[ll] === "(") {
                                                        kk += 1;
                                                    }
                                                    if (token[ll] === ")") {
                                                        kk -= 1;
                                                        if (kk === 0) {
                                                            if (token[ll + 1] === undefined) {
                                                                return;
                                                            }
                                                            last = token[ll + 1];
                                                            if (last === "{" || last === "x{" || last === "for" || last === "if" || last === "while" || last === "do") {
                                                                return;
                                                            }
                                                            last = token[length];
                                                            break;
                                                        }
                                                    }
                                                }
                                                kk = 0;
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            if (asiTest === false) {
                                colon = false;
                                if (token[jj - 1] === ":") {
                                    if (token[jj] === "{") {
                                        ll = 0;
                                        for (kk = jj - 2; kk > -1; kk -= 1) {
                                            if (types[kk] === "start" && token[kk] !== "(") {
                                                ll += 1;
                                            }
                                            if (types[kk] === "end" && token[kk] !== ")") {
                                                ll -= 1;
                                            }
                                            if (ll === 0 && token[kk] === "?") {
                                                asiTest = true;
                                                break;
                                            }
                                            if (ll > 1) {
                                                return;
                                            }
                                        }
                                    }
                                    if (asiTest === false) {
                                        kk = 0;
                                        for (jj -= 1; jj > -1; jj -= 1) {
                                            if (types[jj] === "end") {
                                                kk += 1;
                                            }
                                            if (types[jj] === "start" || types[jj] === "method") {
                                                kk -= 1;
                                            }
                                            if (kk === 1) {
                                                return;
                                            }
                                        }
                                    }
                                }
                                if (token[jj - 1] === ")" && asiTest === false) {
                                    kk = 0;
                                    for (jj -= 1; jj > -1; jj -= 1) {
                                        if (types[jj] === "end") {
                                            kk += 1;
                                        }
                                        if (types[jj] === "start" || types[jj] === "method") {
                                            kk -= 1;
                                        }
                                        if (kk === 0) {
                                            if (nextCharA === "}" || (nextCharA !== "}" && nextCharB === "}")) {
                                                if (token[jj] === ":") {
                                                    colon = true;
                                                }
                                                if (token[jj] === "," && colon === true) {
                                                    return;
                                                }
                                            }
                                            if (token[jj] === ";") {
                                                break;
                                            }
                                            if (token[jj] === "(") {
                                                jj -= 1;
                                                if (token[jj] === "if" || token[jj] === "for" || token[jj] === "switch" || token[jj] === "catch" || token[jj] === "while") {
                                                    if (types[length] === "end") {
                                                        return;
                                                    }
                                                    asiTest = true;
                                                    break;
                                                }
                                                if (token[jj - 1] === "function") {
                                                    jj -= 1;
                                                }
                                                if (token[jj] === "function") {
                                                    if ((types[jj - 1] === "operator" && token[jj - 1] !== ":") || token[jj - 1] === "(" || token[jj - 1] === "[") {
                                                        asiTest = true;
                                                    } else {
                                                        return;
                                                    }
                                                } else {
                                                    asiTest = true;
                                                }
                                            }
                                        }
                                    }
                                } else if (token[jj] !== ",") {
                                    asiTest = true;
                                }
                            }
                            if (asiTest === true) {
                                if (jscorrect === true) {
                                    token.push(";");
                                } else {
                                    token.push("x;");
                                }
                                ltoke = ";";
                                ltype = "separator";
                                types.push("separator");
                                lengtha += 1;
                                semi    += 1;
                                if (block.prior[block.prior.length - 1] === false && block.start > -1 && block.count === 0 && block.simple.length > 0 && block.method[block.method.length - 1] === 0) {
                                    if (token[lengtha - 3] === "else" && token[lengtha - 2] !== "{" && token[lengtha - 2] !== "x{" && token[lengtha - 2] !== "if") {
                                        store.push(token[token.length - 2]);
                                        store.push(types[types.length - 2]);
                                        token.pop();
                                        types.pop();
                                        token.pop();
                                        types.pop();
                                        token.push(block.cs);
                                        types.push("start");
                                        token.push(store[0]);
                                        types.push(store[1]);
                                        token.push(ltoke);
                                        types.push(ltype);
                                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                            lines[lines.length - 1][0] -= 1;
                                        }
                                        lengtha += 1;
                                    }
                                    do {
                                        if (block.prior[block.prior.length - 1] === false) {
                                            token.push(block.ce);
                                            types.push("end");
                                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                                lines[lines.length - 1][0] += 1;
                                            }
                                        }
                                        blockpop();
                                        lengtha += 1;
                                    } while (block.simple.length > 0 && block.prior[block.prior.length - 1] === false);
                                    ltoke = "}";
                                    ltype = "end";
                                    if (block.simple.length === 0) {
                                        block.start = -1;
                                    }
                                }
                            }
                        },
                        newarray     = function jspretty__tokenize_newarray() {
                            var aa       = token.length - 1,
                                bb       = 0,
                                cc       = aa,
                                arraylen = 0;
                            for (aa; aa > -1; aa -= 1) {
                                if (types[aa] === "end") {
                                    bb += 1;
                                }
                                if (types[aa] === "start" || types[aa] === "method") {
                                    bb -= 1;
                                }
                                if (bb === -1 || (bb === 0 && token[aa] === ";")) {
                                    break;
                                }
                            }
                            if (types[aa] === "method" && token[aa - 1] === "Array" && token[aa - 2] === "new") {
                                if (cc - aa === 1 && (/^([0-9])$/).test(token[cc]) === true) {
                                    arraylen = token[cc] - 1;
                                    token.pop();
                                    token.pop();
                                    token.pop();
                                    token.pop();
                                    types.pop();
                                    types.pop();
                                    types.pop();
                                    types.pop();
                                    token.push("[");
                                    types.push("start");
                                    do {
                                        token.push(",");
                                        types.push("separator");
                                        arraylen -= 1;
                                    } while (arraylen > 0);
                                } else {
                                    token[aa] = "[";
                                    types[aa] = "start";
                                    token.splice(aa - 2, 2);
                                    types.splice(aa - 2, 2);
                                }
                                token.push("]");
                            } else {
                                token.push(")");
                            }
                            types.push("end");
                        },
                        generic      = function jspretty__tokenize_genericBuilder(start, offset, ending) {
                            var ee       = 0,
                                f        = 0,
                                g        = 0,
                                end      = ending.split(""),
                                endlen   = end.length - 1,
                                jj       = b,
                                exittest = false,
                                build    = [start],
                                rtest    = (end[0] === "\r") ? true : false,
                                base     = a + offset,
                                output   = "",
                                escape   = false;
                            if (c[a - 2] !== "\\" && c[a - 1] === "\\" && (c[a] === "\"" || c[a] === "'")) {
                                token.pop();
                                types.pop();
                                if (token[0] === "{") {
                                    if (c[a] === "\"") {
                                        start  = "\"";
                                        ending = "\\\"";
                                        build  = ["\""];
                                    } else {
                                        start  = "'";
                                        ending = "\\'";
                                        build  = ["'"];
                                    }
                                    escape = true;
                                } else {
                                    if (c[a] === "\"") {
                                        return "\\\"";
                                    }
                                    return "\\'";
                                }
                            }
                            for (ee = base; ee < jj; ee += 1) {
                                build.push(c[ee]);
                                if (c[ee] === end[endlen] || (rtest === true && (c[ee] === "\n" || ee === jj - 1))) {
                                    if (endlen > 0) {
                                        g = endlen;
                                        for (f = ee; g > -1; f -= 1) {
                                            if (c[f] !== end[g]) {
                                                break;
                                            }
                                            g -= 1;
                                        }
                                        if (g === -1) {
                                            exittest = true;
                                        }
                                    } else {
                                        exittest = true;
                                    }
                                    if (ee > endlen + 1 && c[ee - endlen - 1] === "\\" && ending.charAt(0) !== "\\") {
                                        g = 1;
                                        for (f = ee - 2; f > -1; f -= 1) {
                                            if (c[f] === "\\") {
                                                g += 1;
                                            } else {
                                                break;
                                            }
                                        }
                                        if (g % 2 === 1) {
                                            exittest = false;
                                        }
                                    }
                                    if (exittest === true) {
                                        break;
                                    }
                                }
                            }
                            if (escape === true) {
                                output = build[build.length - 1];
                                build.pop();
                                build.pop();
                                build.push(output);
                            }
                            if (ee < jj) {
                                a = ee;
                                if (start === "//") {
                                    stats.space.newline += 1;
                                    build.pop();
                                }
                                if (jsscope === true) {
                                    output = build.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                                } else {
                                    output = build.join("");
                                }
                                return output;
                            }
                            return "";
                        },
                        comtest      = function jspretty__tokenize_commentTester() {
                            var z = 0;
                            if (ltype === "comment" || ltype === "comment-inline") {
                                return "comment";
                            }
                            for (z = a - 1; z > -1; z -= 1) {
                                if ((/\S/).test(c[z]) === true) {
                                    return "comment-inline";
                                }
                                if (c[z] === "\n" || c[z] === "\r") {
                                    return "comment";
                                }
                            }
                            return "comment";
                        },
                        operator     = function jspretty__tokenize_operator() {
                            var syntax = [
                                    "=", "<", ">", "+", "*", "?", "|", "^", ":", "&"
                                ],
                                g      = 0,
                                h      = 0,
                                jj     = b,
                                build  = [c[a]],
                                synlen = syntax.length,
                                output = "";
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
                                        output = "--";
                                    } else if (c[a + 1] === "=") {
                                        output = "-=";
                                    }
                                    if (output === "") {
                                        return "-";
                                    }
                                }
                            }
                            if (output === "") {
                                for (g = a + 1; g < jj; g += 1) {
                                    for (h = 0; h < synlen; h += 1) {
                                        if (c[g] === syntax[h]) {
                                            build.push(syntax[h]);
                                            break;
                                        }
                                    }
                                    if (h === synlen) {
                                        break;
                                    }
                                }
                                output = build.join("");
                            }
                            a = a + (output.length - 1);
                            if (jsscope === true) {
                                output = output.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            }
                            return output;
                        },
                        regex        = function jspretty__tokenize_regex() {
                            var ee     = 0,
                                f      = b,
                                h      = 0,
                                i      = 0,
                                build  = ["/"],
                                output = "";
                            for (ee = a + 1; ee < f; ee += 1) {
                                build.push(c[ee]);
                                if (c[ee] === "/") {
                                    if (c[ee - 1] === "\\") {
                                        i = 0;
                                        for (h = ee - 1; h > 0; h -= 1) {
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
                            if (c[ee + 1] === "g" || c[ee + 1] === "i" || c[ee + 1] === "m" || c[ee + 1] === "y") {
                                build.push(c[ee + 1]);
                                if (c[ee + 2] !== c[ee + 1] && (c[ee + 2] === "g" || c[ee + 2] === "i" || c[ee + 2] === "m" || c[ee + 2] === "y")) {
                                    build.push(c[ee + 2]);
                                    if (c[ee + 3] !== c[ee + 1] && c[ee + 3] !== c[ee + 2] && (c[ee + 3] === "g" || c[ee + 3] === "i" || c[ee + 3] === "m" || c[ee + 3] === "y")) {
                                        build.push(c[ee + 3]);
                                        if (c[ee + 4] !== c[ee + 1] && c[ee + 4] !== c[ee + 2] && c[ee + 4] !== c[ee + 3] && (c[ee + 4] === "g" || c[ee + 4] === "i" || c[ee + 4] === "m" || c[ee + 4] === "y")) {
                                            build.push(c[ee + 4]);
                                            a = ee + 4;
                                        } else {
                                            a = ee + 3;
                                        }
                                    } else {
                                        a = ee + 2;
                                    }
                                } else {
                                    a = ee + 1;
                                }
                            } else {
                                a = ee;
                            }
                            if (jsscope === true) {
                                output = build.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            } else {
                                output = build.join("");
                            }
                            return output;
                        },
                        numb         = function jspretty__tokenize_number() {
                            var ee    = 0,
                                f     = b,
                                build = [c[a]],
                                dot   = (build[0] === ".") ? true : false;
                            if (a < b - 2 && c[a + 1] === "x" && (/[0-9A-Fa-f]/).test(c[a + 2])) {
                                build.push("x");
                                for (ee = a + 2; ee < f; ee += 1) {
                                    if ((/[0-9A-Fa-f]/).test(c[ee])) {
                                        build.push(c[ee]);
                                    } else {
                                        break;
                                    }
                                }
                            } else {
                                for (ee = a + 1; ee < f; ee += 1) {
                                    if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                        build.push(c[ee]);
                                        if (c[ee] === ".") {
                                            dot = true;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                            if (ee < f - 1 && (c[ee] === "e" || c[ee] === "E")) {
                                build.push(c[ee]);
                                if (c[ee + 1] === "-") {
                                    build.push("-");
                                    ee += 1;
                                }
                                dot = false;
                                for (ee += 1; ee < f; ee += 1) {
                                    if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && dot === false)) {
                                        build.push(c[ee]);
                                        if (c[ee] === ".") {
                                            dot = true;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                            a = ee - 1;
                            return build.join("");
                        },
                        space        = function jspretty__tokenize_space() {
                            var schars    = [],
                                f         = 0,
                                locallen  = b,
                                emptyline = false,
                                output    = "",
                                stest     = (/\s/),
                                asitest   = false;
                            for (f = a; f < locallen; f += 1) {
                                if (c[f] === "\n") {
                                    stats.space.newline += 1;
                                    asitest             = true;
                                } else if (c[f] === " ") {
                                    stats.space.space += 1;
                                } else if (c[f] === "\t") {
                                    stats.space.tab += 1;
                                } else if (stest.test(c[f]) === true) {
                                    stats.space.other += 1;
                                    if (c[f] === "\r") {
                                        asitest = true;
                                    }
                                } else {
                                    break;
                                }
                                schars.push(c[f]);
                            }
                            a = f - 1;
                            if (token.length === 0) {
                                return;
                            }
                            output = schars.join("");
                            if (jpres === true && output.indexOf("\n") > -1) {
                                if (output.indexOf("\n") !== output.lastIndexOf("\n") || token[token.length - 1].indexOf("//") === 0) {
                                    emptyline = true;
                                }
                                lines.push([
                                    token.length - 1, emptyline
                                ]);
                            }
                            if (asitest === true && ltoke !== ";" && lengthb < token.length) {
                                asi(a);
                                lengthb = token.length;
                            }
                        },
                        word         = function jspretty__tokenize_word() {
                            var f      = a,
                                g      = b,
                                build  = [],
                                output = "";
                            do {
                                build.push(c[f]);
                                f += 1;
                            } while (f < g && " \f\n\r\t\v\u00A0\u2028\u2029;=.,&<>+-/*!?|^:\"'\\(){}[]%".indexOf(c[f]) === -1);
                            output = build.join("");
                            if (types.length > 1 && output === "function" && types[types.length - 1] === "method" && (token[token.length - 2] === "{" || token[token.length - 2] === "x{")) {
                                types[types.length - 1] = "start";
                            }
                            a = f - 1;
                            if (types.length > 2 && output === "function" && ltype === "method" && (token[token.length - 2] === "}" || token[token.length - 2] === "x}")) {
                                types[types.length - 1] = "start";
                            }
                            return output;
                        };
                    for (a = 0; a < b; a += 1) {
                        lengtha = token.length;
                        if ((/\s/).test(c[a])) {
                            space();
                        } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                            ltoke                    = generic("/*", 2, "*\/");
                            stats.commentBlock.token += 1;
                            stats.commentBlock.chars += ltoke.length;
                            if (jcomment !== "nocomment") {
                                ltype = "comment";
                                token.push(ltoke);
                                types.push(ltype);
                            }
                        } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                            if (jcomment !== "nocomment") {
                                ltype = comtest();
                            }
                            ltoke                   = generic("//", 2, "\r");
                            stats.commentLine.token += 1;
                            stats.commentLine.chars += ltoke.length;
                            if (jcomment !== "nocomment") {
                                token.push(ltoke);
                                types.push(ltype);
                            }
                        } else if (c[a] === "/" && (lengtha > 0 && (ltype !== "word" || ltoke === "typeof" || ltoke === "return") && ltype !== "literal" && ltype !== "end")) {
                            ltoke             = regex();
                            ltype             = "regex";
                            stats.regex.token += 1;
                            stats.regex.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "\"") {
                            ltoke              = generic("\"", 1, "\"");
                            ltype              = "literal";
                            stats.string.token += 1;
                            stats.string.chars += ltoke.length - 2;
                            stats.string.quote += 2;
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "'") {
                            ltoke              = generic("'", 1, "'");
                            ltype              = "literal";
                            stats.string.token += 1;
                            stats.string.chars += ltoke.length - 2;
                            stats.string.quote += 2;
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "literal" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "literal")) {
                            stats.operator.token += 1;
                            stats.operator.chars += 1;
                            ltoke                = "-";
                            ltype                = "operator";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1]))) {
                            if (ltype === "end" && c[a] === "-") {
                                ltoke                = "-";
                                ltype                = "operator";
                                stats.operator.token += 1;
                                stats.operator.chars += 1;
                            } else {
                                ltoke              = numb();
                                ltype              = "literal";
                                stats.number.token += 1;
                                stats.number.chars += ltoke.length;
                            }
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === ",") {
                            stats.comma += 1;
                            ltoke       = ",";
                            ltype       = "separator";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === ".") {
                            stats.operator.token += 1;
                            stats.operator.chars += 1;
                            if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === lengtha - 1) {
                                lines.pop();
                            }
                            ltoke = ".";
                            ltype = "separator";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === ";") {
                            stats.semicolon += 1;
                            if ((token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "[" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                                if (ltoke === "++" || ltoke === "--") {
                                    plusplus(lengtha - 1, "post");
                                } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                                    plusplus(lengtha - 2, "pre");
                                }
                            }
                            ltoke = ";";
                            ltype = "separator";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "(") {
                            stats.container += 1;
                            if (ltype === "comment" || ltype === "comment-inline" || ltype === "start") {
                                ltype = "start";
                            } else if (lengtha > 2 && token[lengtha - 2] === "function") {
                                ltype = "method";
                            } else if (lengtha === 0 || ltoke === "return" || ltoke === "function" || ltoke === "for" || ltoke === "if" || ltoke === "while" || ltoke === "switch" || ltoke === "catch" || ltype === "separator" || ltype === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
                                ltype = "start";
                            } else {
                                ltype = "method";
                            }
                            ltoke = "(";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "[") {
                            stats.container += 1;
                            ltoke           = "[";
                            ltype           = "start";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "{") {
                            stats.container += 1;
                            if ((ltype === "comment" || ltype === "comment-inline") && token[lengtha - 2] === ")") {
                                ltoke              = token[lengtha - 1];
                                token[lengtha - 1] = "{";
                                ltype              = types[lengtha - 1];
                                types[lengtha - 1] = "start";
                            } else {
                                ltoke = "{";
                                ltype = "start";
                            }
                            if (jscorrect === true && block.start > -1) {
                                if (types[types.length - 1] === "method" || token[token.length - 1] === "=") {
                                    block.method[block.method.length - 1] += 1;
                                }
                                if (token[lengtha - 1] === ",") {
                                    methodtest();
                                }
                            }
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === ")") {
                            stats.container += 1;
                            if ((token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "[" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                                if (types[lengtha - 3] !== "method" && (ltoke === "++" || ltoke === "--")) {
                                    plusplus(lengtha - 1, "post");
                                } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                                    plusplus(lengtha - 2, "pre");
                                }
                            }
                            ltoke = ")";
                            ltype = "end";
                            if (jscorrect === true) {
                                newarray();
                            } else {
                                token.push(ltoke);
                                types.push(ltype);
                            }
                        } else if (c[a] === "]") {
                            stats.container += 1;
                            if ((token[lengtha - 3] === "[" || token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                                if (ltoke === "++" || ltoke === "--") {
                                    plusplus(lengtha - 1, "post");
                                } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                                    plusplus(lengtha - 2, "pre");
                                }
                            }
                            ltoke = "]";
                            ltype = "end";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "}") {
                            if (ltoke !== ";" && lengthb < token.length) {
                                asi(a);
                                lengthb = token.length;
                            }
                            if ((token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "[" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                                if (token[lengtha - 1] === "++" || token[lengtha - 1] === "--") {
                                    plusplus(lengtha - 1, "post");
                                    token.push(";");
                                    types.push("separator");
                                } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                                    plusplus(lengtha - 2, "pre");
                                    token.push(";");
                                    types.push("separator");
                                }
                            }
                            stats.container += 1;
                            ltoke           = "}";
                            ltype           = "end";
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%") {
                            ltoke                = operator();
                            ltype                = "operator";
                            stats.operator.token += 1;
                            stats.operator.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                        } else {
                            ltoke = word();
                            ltype = "word";
                            if (ltoke === "function" && block.start > -1) {
                                if (types[lengtha - 1] === "method" || token[lengtha - 1] === "=") {
                                    block.method[block.method.length - 1] += 1;
                                }
                                if (token[lengtha - 1] === ",") {
                                    methodtest();
                                }
                            }
                            if (jscorrect === true && (ltoke === "Object" || ltoke === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && token[lengtha - 2] === "=" && token[lengtha - 1] === "new") {
                                if (ltoke === "Object") {
                                    token[lengtha - 1] = "{";
                                    token.push("}");
                                } else {
                                    token[lengtha - 1] = "[";
                                    token.push("]");
                                }
                                types[lengtha - 1] = "start";
                                types.push("end");
                                a += 2;
                            } else {
                                token.push(ltoke);
                                types.push(ltype);
                                stats.word.token += 1;
                                stats.word.chars += ltoke.length;
                            }
                        }
                        //everything in this condition is dedicated to
                        //curly brace insertion
                        if (lengtha < token.length) {
                            lengtha = token.length;
                            lasttwo = [
                                token[lengtha - 2], types[lengtha - 2]
                            ];
                            if (lengtha === 0) {
                                lengtha += 1;
                            }
                            if (ltoke === "}") {
                                block.bcount[block.bcount.length - 1] -= 1;
                                if (block.prior[block.prior.length - 1] === true) {
                                    block.pcount[block.pcount.length - 1] -= 1;
                                }
                                if (block.method > 0 && block.method[block.method.length - 1] > 0) {
                                    block.method[block.method.length - 1] -= 1;
                                }
                                if (block.method[block.method.length - 1] > 0) {
                                    block.method[block.method.length - 1] -= 1;
                                } else if (token[lengtha - 2] !== "{" && types[lengtha - 3] !== "operator") {
                                    objtest();
                                }
                            }
                            if (ltoke === "{") {
                                block.bcount[block.bcount.length - 1] += 1;
                                if (block.prior[block.prior.length - 1] === true) {
                                    block.pcount[block.pcount.length - 1] += 1;
                                }
                                if (lasttwo[0] === "else" || (block.word[block.word.length - 2] === "else" && block.word[block.word.length - 1] === "if")) {
                                    block.prev[block.prev.length - 1] = true;
                                }
                            }
                            if (token[lengtha - 3] === "else" && lasttwo[0] !== "{" && lasttwo[0] !== "x{" && lasttwo[0] !== "if") {
                                token.pop();
                                types.pop();
                                token.pop();
                                types.pop();
                                token.push(block.cs);
                                types.push("start");
                                block.prev.push(false);
                                token.push(lasttwo[0]);
                                types.push(lasttwo[1]);
                                token.push(ltoke);
                                types.push(ltype);
                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                    lines[lines.length - 1][0] += 1;
                                }
                                lengtha += 1;
                            }
                            if ((ltoke === "}" || ltoke === ";") && block.count === 0 && block.simple.length > 0 && block.method[block.method.length - 1] === 0) {
                                if (ltoke === "}" && block.prior[block.prior.length - 1] === true && block.pcount[block.pcount.length - 1] === 0) {
                                    blockpop();
                                    if (block.simple.length === 0) {
                                        block.start = -1;
                                    }
                                } else if (ltoke === ";" && (block.brace[block.brace.length - 1] === "else" || (block.prior[block.prior.length - 1] === false && block.start > -1))) {
                                    if ((token[block.start - 1] === "while" && token[block.start] === "(" && lengtha - 1 === block.brace[block.brace.length - 1]) || (block.word[block.word.length - 1] === "while" && lengtha - 2 === block.brace[block.brace.length - 1])) {
                                        blockpop();
                                        if (block.simple.length === 0) {
                                            block.start = -1;
                                        }
                                    } else if (block.bcount[block.bcount.length - 1] === 0) {
                                        //verify else is connected to the
                                        //correct "if" before closing it
                                        do {
                                            if (block.prior[block.prior.length - 1] === false && block.brace[block.brace.length - 1] !== lengtha - 2) {
                                                token.push(block.ce);
                                                types.push("end");
                                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                                    lines[lines.length - 1][0] += 1;
                                                }
                                            }
                                            commentcheck();
                                            lengtha += 1;
                                            blockpop();
                                        } while (block.simple.length > 0 && block.prior[block.prior.length - 1] === false && block.bcount[block.bcount.length - 1] === 0);
                                        ltoke = "}";
                                        ltype = "end";
                                        if (block.simple.length === 0) {
                                            block.start = -1;
                                        }
                                    }
                                }
                            }
                            if (block.flag === false && (ltoke === "for" || ltoke === "if" || ltoke === "while" || ltoke === "do" || ltoke === "else") && (block.brace.length === 0 || block.brace[block.brace.length - 1] === "else" || block.brace[block.brace.length - 1] < lengtha - 1)) {
                                if (ltoke === "while" && (lasttwo[0] === "}" || lasttwo[0] === "x}")) {
                                    whiletest();
                                }
                                if (block.dotest === true) {
                                    block.dotest = false;
                                } else {
                                    if ((ltoke === "if" && lasttwo[0] === "else") || (ltoke === "while" && token[block.start] === "do")) {
                                        blockpop();
                                    } else if (ltoke === "if" && (lasttwo[0] === "{" || lasttwo[0] === "x{") && token[lengtha - 3] === "else" && block.word[block.word.length - 2] === "else" && block.word[block.word.length - 1] === "if") {
                                        token.pop();
                                        types.pop();
                                        token.pop();
                                        types.pop();
                                        token.push("if");
                                        types.push("word");
                                    }
                                    if (ltoke === "do") {
                                        block.bcount.push(0);
                                        block.brace.push(lengtha - 1);
                                        block.method.push(0);
                                        block.pcount.push(0);
                                        block.prior.push(false);
                                        block.simple.push(true);
                                        block.flag  = false;
                                        block.count = 0;
                                    } else if (ltoke === "else") {
                                        elsestart();
                                    } else {
                                        block.method.push(0);
                                        block.pcount.push(0);
                                        block.prior.push(false);
                                        block.simple.push(false);
                                        block.flag = true;
                                    }
                                    block.start = lengtha;
                                    block.word.push(ltoke);
                                }
                            }
                            if (block.start > -1) {
                                if (block.flag === true && block.simple[block.simple.length - 1] === false) {
                                    if (ltoke === "(") {
                                        block.count += 1;
                                    }
                                    if (ltoke === ")") {
                                        block.count -= 1;
                                        if (block.count === 0) {
                                            block.bcount.push(0);
                                            block.brace.push(lengtha - 1);
                                            block.flag = false;
                                        }
                                    }
                                }
                                if (ltoke === "for" && lasttwo[0] === "else") {
                                    token.pop();
                                    types.pop();
                                    token.push(block.cs);
                                    types.push("start");
                                    token.push(ltoke);
                                    types.push(ltype);
                                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                        lines[lines.length - 1][0] += 1;
                                    }
                                    lengtha += 1;
                                } else if ((block.flag === false || lasttwo[0] === "else" || (lasttwo[0] === ")" && (ltoke === "if" || ltoke === "for" || ltoke === "while"))) && block.count === 0 && lengtha - 2 === block.brace[block.brace.length - 1]) {
                                    if (block.word[block.word.length - 1] === "else" && (ltoke === "{" || lasttwo[0] === "{" || lasttwo[0] === "x{")) {
                                        if (lasttwo[0] === "{" || lasttwo[0] === "x{") {
                                            token[token.length - 2] = token[token.length - 1];
                                            types[types.length - 2] = types[types.length - 1];
                                            token.pop();
                                            types.pop();
                                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                                lines[lines.length - 1][0] -= 1;
                                            }
                                        }
                                        block.prev.push(true);
                                    } else if (ltoke === "{") {
                                        block.prior[block.prior.length - 1]   = true;
                                        block.pcount[block.pcount.length - 1] = 1;
                                        block.prev.push(true);
                                    } else if (block.brace[block.brace.length - 1] !== -1) {
                                        token.pop();
                                        types.pop();
                                        token.push(block.cs);
                                        types.push("start");
                                        token.push(ltoke);
                                        types.push(ltype);
                                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                            lines[lines.length - 1][0] += 1;
                                        }
                                        block.prev.push(false);
                                        lengtha += 1;
                                    }
                                } else if (ltoke === "{" && lasttwo[0] === "else" && block.brace[block.brace.length - 1] === "else") {
                                    blockpop();
                                    block.prev.push(true);
                                }
                            }
                        }
                    }
                    lines.push([
                        token.length, false
                    ]);
                    asi(a);
                }());
                //this function is the pretty-print algorithm
                (function jspretty__algorithm() {
                    var a          = 0,
                        b          = token.length,
                        lcount     = 0,
                        indent     = jlevel,
                        obj        = [],
                        list       = [],
                        listtest   = [],
                        lastlist   = false,
                        ternary    = [],
                        varline    = [],
                        casetest   = [],
                        fortest    = 0,
                        ctype      = "",
                        ctoke      = "",
                        ltype      = types[0],
                        ltoke      = token[0],
                        varlen     = [],
                        methodtest = [],
                        assignlist = [false],
                        separator  = function jspretty__algorithm_separator() {
                            if (types[a - 1] === "comment-inline" && a > 1) {
                                return (function jspretty__algorithm_commentfix() {
                                    var c    = 0,
                                        d    = b,
                                        last = token[a - 1];
                                    level[a - 2] = "x";
                                    level[a - 1] = "x";
                                    for (c = a; c < d; c += 1) {
                                        token[c - 1] = token[c];
                                        types[c - 1] = types[c];
                                        if (token[c] === ";" || token[c] === "x;" || token[c] === "{" || token[c] === "x{" || c === lines[lcount][0]) {
                                            token[c] = last;
                                            types[c] = "comment-inline";
                                            a        -= 1;
                                            return;
                                        }
                                    }
                                    token[c - 1] = last;
                                    types[c - 1] = "comment-inline";
                                    a            -= 1;
                                }());
                            }
                            if (ctoke === ".") {
                                level[a - 1] = "x";
                                return level.push("x");
                            }
                            if (ctoke === ",") {
                                level[a - 1] = "x";
                                if (ternary.length > 0) {
                                    ternary[ternary.length - 1] = false;
                                }
                                if (listtest[listtest.length - 1] === false) {
                                    listtest[listtest.length - 1] = true;
                                    (function jspretty__algorithm_separator_listTest() {
                                        var c         = 0,
                                            d         = 0,
                                            assign    = false,
                                            compare   = false,
                                            semicolon = false;
                                        if (methodtest[methodtest.length - 1] === true) {
                                            list[list.length - 1] = true;
                                            return;
                                        }
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
                                                if (semicolon === false && token[c] === "return") {
                                                    list[list.length - 1] = true;
                                                    return;
                                                }
                                                if (assign === false && (token[c] === "=" || token[c] === ";")) {
                                                    assign = true;
                                                }
                                                if (compare === false && (token[c] === "&&" || token[c] === "||")) {
                                                    compare = true;
                                                }
                                                if (semicolon === false && token[c] === ";") {
                                                    semicolon = true;
                                                }
                                            }
                                            if (d === -1) {
                                                if (types[c] === "method") {
                                                    list[list.length - 1] = true;
                                                } else if (token[c] === "{" || token[c] === "x{") {
                                                    if (token[c - 1] !== ")") {
                                                        obj[obj.length - 1] = true;
                                                    } else if (compare === false && semicolon === false) {
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
                                                } else if (compare === false && semicolon === false && ((token[c] === "(" && token[c - 1] === "for") || token[c] === "[")) {
                                                    list[list.length - 1] = true;
                                                    return;
                                                }
                                                if (compare === false && semicolon === false && varline[varline.length - 1] === false && (assign === false || token[c] === "(")) {
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
                                    if (ltoke !== "]") {
                                        (function jspretty__algorithm_separator_varline() {
                                            var c     = 0,
                                                brace = false;
                                            for (c = a - 1; c > -1; c -= 1) {
                                                if (token[c] === "]") {
                                                    brace = true;
                                                }
                                                if (types[c] === "method" || types[c] === "start") {
                                                    if (token[c] === "[" && token[c + 1] !== "]" && brace === false) {
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
                            if (ctoke === ";" || ctoke === "x;") {
                                if (ternary.length > 0) {
                                    ternary[ternary.length - 1] = false;
                                }
                                level[a - 1] = "x";
                                if (fortest === 0) {
                                    if (varline[varline.length - 1] === true) {
                                        varline[varline.length - 1] = false;
                                        if ((methodtest.length === 0 || methodtest[methodtest.length - 1] === false) && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                            varlist.push(varlen[varlen.length - 1]);
                                        }
                                        varlen.pop();
                                        indent -= 1;
                                    }
                                    return level.push(indent);
                                }
                                if (fortest > 0) {
                                    if (varline[varline.length - 1] === true) {
                                        varline[varline.length - 1] = false;
                                    }
                                    return level.push("s");
                                }
                                return level.push("s");
                            }
                        },
                        method     = function jspretty__algorithm_method() {
                            level[a - 1] = "x";
                            level.push("x");
                            list.push(false);
                            listtest.push(false);
                            methodtest.push(true);
                            obj.push(false);
                            ternary.push(false);
                            assignlist.push(false);
                            if (fortest > 0) {
                                fortest += 1;
                            }
                        },
                        start      = function jspretty__algorithm_start() {
                            list.push(false);
                            listtest.push(false);
                            methodtest.push(false);
                            ternary.push(false);
                            assignlist.push(false);
                            if (ctoke !== "(") {
                                indent += 1;
                            }
                            if (ltoke === "for") {
                                fortest = 1;
                            }
                            if (ctoke === "{" || ctoke === "x{") {
                                casetest.push(false);
                                varlen.push([]);
                                if (ctoke === "{") {
                                    varline.push(false);
                                }
                                if (ltoke === "=" || ltoke === ";" || ltoke === "," || ltoke === ":" || ltoke === "?" || ltoke === "return" || ltoke === "in" || ltype === "start" || ltype === "method") {
                                    obj.push(true);
                                } else {
                                    obj.push(false);
                                }
                                if (jbrace && ltype !== "operator" && ltoke !== "return") {
                                    level[a - 1] = indent - 1;
                                } else if (ltoke === ")") {
                                    level[a - 1] = "s";
                                } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent - 1;
                                }
                                if (jsscope === true) {
                                    meta.push("");
                                }
                                return level.push(indent);
                            }
                            obj.push(false);
                            if (ctoke === "(") {
                                if (ltoke === "-" && token[a - 2] === "(") {
                                    level[a - 2] = "x";
                                }
                                if (ltoke === "function" || ltoke === "switch" || ltoke === "for" || ltoke === "while") {
                                    methodtest[methodtest.length - 1] = true;
                                }
                                if (jsscope === true) {
                                    if (ltoke === "function" || token[a - 2] === "function") {
                                        meta.push(0);
                                    } else {
                                        meta.push("");
                                    }
                                }
                                if (fortest > 0 && ltoke !== "for") {
                                    fortest += 1;
                                }
                                if (ltoke === "}" || ltoke === "x}") {
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
                                } else if (ltoke === "[" || ltoke === "{" || ltoke === "x{") {
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
                        end        = function jspretty__algorithm_end() {
                            if (fortest === 1 && ctoke === ")" && varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                            }
                            if (ctoke !== ")") {
                                indent -= 1;
                            } else if (fortest > 0 && ctoke === ")") {
                                fortest -= 1;
                            }
                            if (ctoke === "}" || ctoke === "x}") {
                                if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || ltoke === "break" || ltoke === "return")) {
                                    (function jspretty__algorithm_end_curlyBrace() {
                                        var c       = 0,
                                            d       = 1,
                                            assign  = false,
                                            listlen = list.length;
                                        for (c = a - 1; c > -1; c -= 1) {
                                            if (types[c] === "end") {
                                                d += 1;
                                            }
                                            if (types[c] === "start" || types[c] === "method") {
                                                d -= 1;
                                            }
                                            if (d === 1) {
                                                if (token[c] === "=" || token[c] === ";") {
                                                    assign = true;
                                                }
                                                if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "{" || token[c - 1] === "x{" || token[c - 1] === "}" || token[c - 1] === "x}" || token[c - 1] === ";")) {
                                                    indent       -= 1;
                                                    level[a - 1] = indent;
                                                    return;
                                                }
                                                if ((token[c] === ":" && ternary[ternary.length - 1] === false) || (token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                                    return;
                                                }
                                                if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var") {
                                                    if (list[listlen - 1] === false && listlen > 1 && (a === b - 1 || token[a + 1] !== ")") && obj[obj.length - 1] === false) {
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
                                        var c     = 0,
                                            d     = 1,
                                            build = [],
                                            paren = false;
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
                                                if (meta[c] === "v" && token[c] !== build[build.length - 1]) {
                                                    build.push(token[c]);
                                                } else if (token[c] === ")") {
                                                    paren = true;
                                                } else if (paren === true && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                                    build.push(token[c]);
                                                }
                                            }
                                            if (c > 0 && token[c - 1] === "function" && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                                build.push(token[c]);
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
                                                    meta.push(build);
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
                                    if (ltoke === "}" || ltoke === "x}") {
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
                                                    if (c > 0 && (token[c + 1] === "{" || token[c + 1] === "x{" || token[c + 1] === "[")) {
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
                            } else if ((ctoke === "}" || ctoke === "x}") && obj[obj.length - 1] === false && ltype === "word" && list[list.length - 1] === false && casetest[casetest.length - 1] === false) {
                                indent       += 1;
                                level[a - 1] = indent;
                                level.push(indent);
                            } else if (ctoke === "}" || ctoke === "x}" || list[list.length - 1] === true) {
                                level[a - 1] = indent;
                                level.push("x");
                            } else {
                                level.push("x");
                            }
                            lastlist = list[list.length - 1];
                            list.pop();
                            listtest.pop();
                            methodtest.pop();
                            ternary.pop();
                            if (ctoke === "}") {
                                if (varline[varline.length - 1] === true || (obj[obj.length - 1] === true && ltoke !== "{")) {
                                    if (varlen.length > 0 && assignlist[assignlist.length - 1] === false) {
                                        if (varlen[varlen.length - 1].length > 1) {
                                            varlist.push(varlen[varlen.length - 1]);
                                        }
                                    }
                                }
                                varlen.pop();
                                varline.pop();
                            }
                            assignlist.pop();
                            obj.pop();
                            if (jsscope === true && meta[a] === undefined) {
                                meta.push("");
                            }
                        },
                        operator   = function jspretty__algorithm_operator() {
                            if (ctoke === "!") {
                                if (ltoke === "(") {
                                    level[a - 1] = "x";
                                }
                                if (ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent;
                                }
                                return level.push("x");
                            }
                            if (ctoke === "?") {
                                if (ternary.length === 0) {
                                    ternary.push(true);
                                } else {
                                    ternary[ternary.length - 1] = true;
                                }
                            }
                            if (ctoke === ":") {
                                if (ternary[ternary.length - 1] === false) {
                                    level[a - 1] = "x";
                                } else {
                                    level[a - 1] = "s";
                                }
                                return (function jspretty__algorithm_operator_colon() {
                                    var c      = 0,
                                        d      = 0,
                                        listin = (varlen.length > 0) ? varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1 : 0,
                                        listop = token[listin],
                                        assign = (listop === undefined || listop.indexOf("=") > -1) ? false : true;
                                    if (listin === 0) {
                                        return;
                                    }
                                    if (obj[obj.length - 1] === true && varlen.length > 0 && (listop === undefined || (assign === true && types[listin] === "operator"))) {
                                        c = a - 1;
                                        if (types[c] === "comment" || types[c] === "comment-inline") {
                                            do {
                                                c -= 1;
                                            } while (types[c] === "comment" || types[c] === "comment-inline");
                                        }
                                        if (ternary[ternary.length - 1] === false) {
                                            varlen[varlen.length - 1].push(c);
                                        }
                                    }
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if (types[c] === "start" || types[c] === "method") {
                                            d += 1;
                                        }
                                        if (types[c] === "end") {
                                            d -= 1;
                                        }
                                        if (d > 0) {
                                            if (d === 1 && token[c] === "{" && ternary[ternary.length - 1] === false) {
                                                obj[obj.length - 1] = true;
                                            }
                                            break;
                                        }
                                        if (d === 0) {
                                            if (ternary[ternary.length - 1] === false && (token[c] === "case" || token[c] === "default")) {
                                                if (token[a + 1] !== "case") {
                                                    indent += 1;
                                                }
                                                return level.push(indent);
                                            }
                                            if (token[c] === "," && ternary[ternary.length - 1] === false) {
                                                obj[obj.length - 1] = true;
                                            }
                                        }
                                    }
                                    return level.push("s");
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
                            if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && varline[varline.length - 1] === false && methodtest[methodtest.length - 1] === false && obj[obj.length - 1] === false) {
                                if (assignlist[assignlist.length - 1] === true) {
                                    (function jspretty__algorithm_operator_assignTest() {
                                        var c = 0,
                                            d = "";
                                        for (c = a - 1; c > -1; c -= 1) {
                                            d = token[c];
                                            if (d === ";") {
                                                return varlen[varlen.length - 1].push(a - 1);
                                            }
                                            if (d.indexOf("=") > -1 && d !== "==" && d !== "===" && d !== "!=" && d !== "!==" && d !== ">=" && d !== "<=") {
                                                return;
                                            }
                                        }
                                    }());
                                }
                                (function jspretty__algorithm_operator_assignSpaces() {
                                    var c = 0,
                                        d = 0,
                                        e = false,
                                        f = "";
                                    for (c = a + 1; c < b; c += 1) {
                                        if (types[c] === "start" || types[c] === "method") {
                                            if (e === true && types[c] === "start" && token[c] !== "[") {
                                                if (assignlist[assignlist.length - 1] === true) {
                                                    assignlist[assignlist.length - 1] = false;
                                                    if (varlen[varlen.length - 1].length > 1) {
                                                        varlist.push(varlen[varlen.length - 1]);
                                                    }
                                                    varlen.pop();
                                                }
                                                break;
                                            }
                                            d += 1;
                                        }
                                        if (types[c] === "end") {
                                            d -= 1;
                                        }
                                        if (d < 0) {
                                            if (assignlist[assignlist.length - 1] === true) {
                                                assignlist[assignlist.length - 1] = false;
                                                if (varlen[varlen.length - 1].length > 1) {
                                                    varlist.push(varlen[varlen.length - 1]);
                                                }
                                                varlen.pop();
                                            }
                                            break;
                                        }
                                        if (d === 0) {
                                            if (e === true) {
                                                if (types[c] === "operator" || token[c] === ";" || token[c] === "var") {
                                                    f = token[c];
                                                    if (f !== undefined && f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<=") {
                                                        if (assignlist[assignlist.length - 1] === false) {
                                                            varlen.push([a - 1]);
                                                            assignlist[assignlist.length - 1] = true;
                                                        }
                                                    }
                                                    if ((token[c] === ";" || token[c] === "var") && assignlist[assignlist.length - 1] === true) {
                                                        assignlist[assignlist.length - 1] = false;
                                                        if (varlen.length > 0) {
                                                            if (varlen[varlen.length - 1].length > 1) {
                                                                varlist.push(varlen[varlen.length - 1]);
                                                            }
                                                            varlen.pop();
                                                        }
                                                    }
                                                    return;
                                                }
                                                if (assignlist[assignlist.length - 1] === true && (token[c] === "return" || token[c] === "break" || token[c] === "continue" || token[c] === "throw")) {
                                                    assignlist[assignlist.length - 1] = false;
                                                    if (varlen[varlen.length - 1].length > 1) {
                                                        varlist.push(varlen[varlen.length - 1]);
                                                    }
                                                    varlen.pop();
                                                }
                                            }
                                            if (token[c] === ";") {
                                                e = true;
                                            }
                                        }
                                    }
                                }());
                            }
                            if ((ctoke === "-" && ltoke === "return") || ltoke === "=") {
                                return level.push("x");
                            }
                            level.push("s");
                        },
                        word       = function jspretty__algorithm_word() {
                            var next    = token[a + 1],
                                compare = (next === undefined || next === "==" || next === "===" || next === "!=" || next === "!==" || next === ">=" || next === "<=" || next.indexOf("=") < 0) ? false : true;
                            if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var")) {
                                if (fortest === 0 && (methodtest[methodtest.length - 1] === false || methodtest.length === 0)) {
                                    if (types[a + 1] === "operator" && compare === true && varlen.length > 0 && token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ":") {
                                        varlen[varlen.length - 1].push(a);
                                    }
                                    meta.push("v");
                                }
                                if (jsscope === true) {
                                    meta.push("v");
                                }
                            } else if (jsscope === true) {
                                if (ltoke === "function") {
                                    meta.push("v");
                                } else {
                                    meta.push("");
                                }
                            }
                            if (ltoke === "}" || ltoke === "x}") {
                                level[a - 1] = indent;
                            }
                            if (ctoke === "else" && ltoke === "}" && token[a - 2] === "x}") {
                                level[a - 3] -= 1;
                            }
                            if (varline.length === 1 && varline[0] === true && (ltoke === "var" || ltoke === "," || (ltoke === "function" && types[a + 1] === "method"))) {
                                globals.push(ctoke);
                            }
                            if (ctoke === "new") {
                                (function jspretty__algorithm_word_new() {
                                    var c       = 0,
                                        nextish = (typeof next === "string") ? next : "",
                                        apiword = (nextish === "") ? [] : [
                                            "Date", "RegExp", "Error", "XMLHttpRequest", "FileReader", "ActiveXObject", "DataView", "ArrayBuffer", "Proxy", "DOMParser", "ParallelArray", "Int8Array", "Uint8Array", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "Canvas", "CustomAnimation", "FadeAnimation", "Flash", "FormField", "Frame", "HotKey", "Image", "MenuItem", "MoveAnimation", "Point", "Rectangle", "ResizeAnimation", "RotateAnimation", "ScrollBar", "Shadow", "SQLite", "Text", "TextArea", "Timer", "URL", "Web", "Window"
                                        ],
                                        apilen  = apiword.length;
                                    for (c = 0; c < apilen; c += 1) {
                                        if (nextish === apiword[c]) {
                                            return;
                                        }
                                    }
                                    news += 1;
                                    if (jsscope === true) {
                                        token[a] = "<strong class='new'>" + token[a] + "</strong>";
                                    }
                                }());
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
                            } else if (ctoke === "while" && (ltoke === "}" || ltoke === "x}")) {
                                (function jspretty__algorithm_word_curlyBrace() {
                                    var c = 0,
                                        d = 0;
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if (token[c] === "}" || token[c] === "x}") {
                                            d += 1;
                                        }
                                        if (token[c] === "{" || token[c] === "x{") {
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
                            } else if (ctoke === "in" || ((ctoke === "else" || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                                level[a - 1] = "s";
                            } else if (ctoke === "var") {
                                if (methodtest.length === 0 || methodtest[methodtest.length - 1] === false) {
                                    varlen.push([]);
                                }
                                if (ltype === "end") {
                                    level[a - 1] = indent;
                                }
                                if (varline.length === 0) {
                                    varline.push(true);
                                } else {
                                    varline[varline.length - 1] = true;
                                }
                                if (fortest === 0) {
                                    indent += 1;
                                }
                            } else if (ctoke === "default" || ctoke === "case") {
                                if (casetest[casetest.length - 1] === false) {
                                    if (ltoke === "{" || ltoke === "x{") {
                                        indent -= 1;
                                    }
                                    level[a - 1]                  = indent;
                                    casetest[casetest.length - 1] = true;
                                } else if ((ltoke === ":" && (ctoke === "default" || types[a - 1] === "comment-inline" || types[a - 1] === "comment")) || ltoke !== ":") {
                                    indent       -= 1;
                                    level[a - 1] = indent;
                                }
                            } else if ((ctoke === "break" || ctoke === "return") && casetest[casetest.length - 1] === true) {
                                level[a - 1] = indent;
                                (function jspretty__algorithm_word_break() {
                                    var c = 0;
                                    for (c = a + 1; c < b; c += 1) {
                                        if (token[c] === "}" || token[c] === "x}") {
                                            casetest[casetest.length - 1] = false;
                                            return;
                                        }
                                        if (token[c] === "{" || token[c] === "x{" || token[c] === "[") {
                                            return;
                                        }
                                        if (token[c] === "case" || token[c] === "default" || token[c] === "switch") {
                                            indent                        -= 1;
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
                        if (a - 1 > lines[lcount][0]) {
                            lcount += 1;
                        }
                        if (ctype === "comment") {
                            if (ltoke === "=" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                                level[a - 1] = "s";
                            } else {
                                level[a - 1] = indent;
                            }
                            level.push(indent);
                        }
                        if (ctype === "comment-inline") {
                            if (a < b - 1 && (token[a + 1] === "{" || token[a + 1] === "x{")) {
                                token[a]     = token[a + 1];
                                types[a]     = "start";
                                token[a + 1] = ctoke;
                                types[a + 1] = ctype;
                                a            -= 1;
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
                            method();
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
                if (jsscope === true) {
                    result = (function jspretty__resultScope() {
                        var a          = 0,
                            b          = token.length,
                            build      = [],
                            linesinc   = 0,
                            linecount  = 2,
                            last       = "",
                            scope      = 1,
                            buildlen   = 0,
                            commentfix = (function jspretty__resultScope_i() {
                                var aa = 1,
                                    bb = 1;
                                if (types[0] !== "comment" || (token[0].indexOf("//") === 0 && (lines.length === 0 || lines[0][0] > 0)) || types[1] !== "comment") {
                                    return 1;
                                }
                                do {
                                    if (token[aa].indexOf("/*") === 0) {
                                        bb += 1;
                                    }
                                    aa += 1;
                                } while (types[aa] === "comment");
                                return bb;
                            }()),
                            folderItem = [],
                            comfold    = -1,
                            data       = [
                                "<div class='beautify' id='pd-jsscope'><ol class='count'>", "<li>", 1, "</li>"
                            ],
                            folder     = function jspretty__resultScope_folder() {
                                var datalen = (data.length - (commentfix * 3) > 0) ? data.length - (commentfix * 3) : 1,
                                    index   = a,
                                    start   = data[datalen + 1] || 1,
                                    assign  = true,
                                    kk      = index;
                                if (types[a] === "comment" && comfold === -1) {
                                    comfold = a;
                                } else if (types[a] !== "comment") {
                                    index = meta[a];
                                    do {
                                        kk -= 1;
                                    } while (token[kk] !== "function");
                                    kk -= 1;
                                    if (token[kk] === "(" && types[kk] === "start") {
                                        do {
                                            kk -= 1;
                                        } while (types[kk] === "start" && token[kk] === "(");
                                    }
                                    if (token[kk] === "=" || token[kk] === ":" || token[kk] === "," || (token[kk + 1] === "(" && types[kk + 1] === "start")) {
                                        assign = false;
                                    }
                                }
                                if (types[a] === "comment" && lines[linesinc - 1] !== undefined && lines[linesinc - 1][1] === true) {
                                    datalen -= 3;
                                    start   -= 1;
                                }
                                data[datalen]     = "<li class='fold' onclick='pd.beaufold(this," + start + ",xxx);'>";
                                data[datalen + 1] = "- " + start;
                                folderItem.push([
                                    datalen, index, assign
                                ]);
                            },
                            foldclose  = function jspretty__resultScope_foldclose() {
                                var end = (function jspretty_resultScope_foldclose_end() {
                                        if (comfold > -1 || folderItem[folderItem.length - 1][2] === true) {
                                            return linecount - commentfix - 1;
                                        }
                                        return linecount - commentfix;
                                    }()),
                                    gg  = 0;
                                if (a > 1 && token[a].indexOf("}</em>") === token[a].length - 6 && token[a - 1].indexOf("{</em>") === token[a - 1].length - 6) {
                                    for (gg = data.length - 1; gg > 0; gg -= 1) {
                                        if (typeof data[gg] === "string" && data[gg].charAt(0) === "-") {
                                            data[gg - 1] = "<li>";
                                            data[gg]     = Number(data[gg].substr(1));
                                            folderItem.pop();
                                            return;
                                        }
                                    }
                                }
                                if (folderItem[folderItem.length - 1][1] === b - 1 && token[a].indexOf("<em ") === 0) {
                                    end += 1;
                                }
                                data[folderItem[folderItem.length - 1][0]] = data[folderItem[folderItem.length - 1][0]].replace("xxx", end);
                                folderItem.pop();
                            },
                            blockline  = function jspretty__resultScope_blockline(x) {
                                var commentLines = x.split("\n"),
                                    hh           = 0,
                                    ii           = commentLines.length - 1;
                                if (lines[linesinc] !== undefined && lines[linesinc][0] === a && linesinc === a && linesinc > 0) {
                                    data.push("<li>");
                                    data.push(linecount);
                                    data.push("</li>");
                                    linecount += 1;
                                }
                                for (hh = 0; hh < ii; hh += 1) {
                                    data.push("<li>");
                                    data.push(linecount);
                                    data.push("</li>");
                                    linecount        += 1;
                                    commentLines[hh] = commentLines[hh] + "<em>&#xA;</em></li><li class='c0'>";
                                }
                                return commentLines.join("").replace(/\r/g, "");
                            },
                            findvars   = function jspretty__resultScope_findvars(x) {
                                var metax         = meta[x],
                                    metameta      = meta[metax],
                                    ee            = 0,
                                    ff            = 0,
                                    hh            = metameta.length,
                                    adjustment    = 1,
                                    functionBlock = true,
                                    varbuild      = [],
                                    varbuildlen   = 0;
                                if (types[a - 1] === "word" && token[a - 1] !== "function") {
                                    varbuild     = token[a - 1].split(" ");
                                    token[a - 1] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                    varbuildlen  = varbuild.length;
                                    if (varbuildlen > 1) {
                                        do {
                                            token[ee]   = token[ee] + " ";
                                            varbuildlen -= 1;
                                        } while (varbuildlen > 1);
                                    }
                                }
                                if (hh > 0) {
                                    for (ee = metax - 1; ee > a; ee -= 1) {
                                        varbuild = token[ee].split(" ");
                                        if (types[ee] === "word") {
                                            for (ff = 0; ff < hh; ff += 1) {
                                                if (varbuild[0] === metameta[ff] && token[ee - 1] !== ".") {
                                                    if (token[ee - 1] === "function" && token[ee + 1] === "(") {
                                                        token[ee]   = "<em class='s" + (scope + 1) + "'>" + varbuild[0] + "</em>";
                                                        varbuildlen = varbuild.length;
                                                        if (varbuildlen > 1) {
                                                            do {
                                                                token[ee]   = token[ee] + " ";
                                                                varbuildlen -= 1;
                                                            } while (varbuildlen > 1);
                                                        }
                                                    } else if (token[ee + 1] !== ":" || (token[ee + 1] === ":" && level[ee] !== "x")) {
                                                        token[ee]   = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                        varbuildlen = varbuild.length;
                                                        if (varbuildlen > 1) {
                                                            do {
                                                                token[ee]   = token[ee] + " ";
                                                                varbuildlen -= 1;
                                                            } while (varbuildlen > 1);
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        if (functionBlock === true) {
                                            if (types[ee] === "end") {
                                                adjustment += 1;
                                            } else if (types[ee] === "start" || types[ee] === "method") {
                                                adjustment -= 1;
                                            }
                                            if (adjustment === 0 && token[ee] === "{") {
                                                token[ee]     = "<em class='s" + scope + "'>{</em>";
                                                functionBlock = false;
                                            }
                                        }
                                    }
                                } else {
                                    for (ee = a + 1; ee < metax; ee += 1) {
                                        if (types[ee] === "end") {
                                            adjustment -= 1;
                                        } else if (types[ee] === "start" || types[ee] === "method") {
                                            adjustment += 1;
                                        }
                                        if (adjustment === 1 && token[ee] === "{") {
                                            token[ee] = "<em class='s" + scope + "'>{</em>";
                                            return;
                                        }
                                    }
                                }
                            },
                            indent     = jlevel,
                            removeEm   = function jspretty__resultScope_removeEm(x) {
                                var em   = x.lastIndexOf("<em "),
                                    noem = x.substring(em),
                                    end  = noem.indexOf("'>");
                                return x.substring(0, em) + noem.substring(end + 2).replace("</em>", "");
                            },
                            tab        = (function jspretty__resultScope_tab() {
                                var aa = jchar,
                                    bb = jsize,
                                    cc = [];
                                for (bb; bb > 0; bb -= 1) {
                                    cc.push(aa);
                                }
                                return cc.join("");
                            }()),
                            lscope     = [
                                "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                            ],
                            nl         = function jspretty__resultScope_nl(x) {
                                var dd = 0;
                                data.push("<li>");
                                data.push(linecount);
                                data.push("</li>");
                                linecount += 1;
                                if (a < b - 1 && token[a + 1].indexOf("/*") === 0) {
                                    build.push("<em>&#xA;</em></li><li class='c0'>");
                                } else {
                                    build.push("<em>&#xA;</em></li><li class='l" + scope + "'>");
                                    if (x > 0) {
                                        dd = scope;
                                        if (scope > 0) {
                                            if (scope === x + 1 && x > 0) {
                                                dd -= 1;
                                            }
                                            build.push(lscope[dd - 1]);
                                        }
                                    }
                                }
                                for (dd; dd < x; dd += 1) {
                                    build.push(tab);
                                }
                            };
                        (function jspretty__resultScope_varSpaces() {
                            var aa          = 0,
                                lastListLen = 0,
                                cc          = 0,
                                longest     = 0,
                                longTest    = 0,
                                tokenInList = "",
                                longList    = [],
                                joins       = function jspretty__resultScope_varSpaces_joins(x) {
                                    var xlen   = token[x].length,
                                        endTest = false,
                                        mixTest = false,
                                        perTest = false,
                                        period = function jspretty__resultScope_varSpaces_joins_periodInit() {
                                            return;
                                        },
                                        ending = function jspretty__resultScope_varSpaces_joins_endingInit() {
                                            return;
                                        };
                                    period = function jspretty__resultScope_varSpaces_joins_period() {
                                        perTest = true;
                                        do {
                                            x    -= 2;
                                            xlen += token[x].length + 1;
                                        } while (x > 1 && token[x - 1] === ".");
                                        if (token[x] === ")" || token[x] === "]") {
                                            x += 1;
                                            xlen -= 1;
                                            mixTest = true;
                                            ending();
                                        }
                                    };
                                    ending = function jspretty__resultScope_varSpaces_joins_ending() {
                                        var yy = 0;
                                        endTest = true;
                                        for (x -= 1; x > -1; x -= 1) {
                                            xlen += token[x].length;
                                            if (types[x] === "start" || types[x] === "method") {
                                                yy += 1;
                                                if (yy === 1) {
                                                    if (mixTest === true) {
                                                        return;
                                                    }
                                                    break;
                                                }
                                            }
                                            if (types[x] === "end") {
                                                yy -= 1;
                                            }
                                            if (types[x] === "operator") {
                                                if (level[x] === "s") {
                                                    xlen += 1;
                                                }
                                                if (level[x - 1] === "s") {
                                                    xlen += 1;
                                                }
                                            }
                                            if (token[x] === ";") {
                                                return;
                                            }
                                        }
                                        if (types[x - 1] === "word" || types[x - 1] === "literal") {
                                            x    -= 1;
                                            xlen += token[x].length;
                                        }
                                        if (types[x] === "word" && token[x - 1] === ".") {
                                            period();
                                        } else if (token[x - 1] === ")" || token[x - 1] === "]") {
                                            ending();
                                        }
                                    };
                                    if (types[x] === "word" && token[x - 1] === ".") {
                                        period();
                                        if (endTest === false) {
                                            xlen += 1;
                                        }
                                    } else if (token[x] === ")" || token[x] === "]") {
                                        ending();
                                        if (perTest === false) {
                                            xlen += 1;
                                        }
                                    } else {
                                        xlen += 1;
                                    }
                                    return xlen;
                                };
                            for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                                if (varlist[aa] !== undefined) {
                                    lastListLen = varlist[aa].length;
                                    longest     = 0;
                                    longList    = [];
                                    for (cc = 0; cc < lastListLen; cc += 1) {
                                        longTest = joins(varlist[aa][cc]);
                                        if (longTest > longest) {
                                            longest = longTest;
                                        }
                                        longList.push(longTest);
                                    }
                                    for (cc = 0; cc < lastListLen; cc += 1) {
                                        tokenInList = token[varlist[aa][cc]];
                                        if (longList[cc] < longest) {
                                            do {
                                                tokenInList  += " ";
                                                longList[cc] += 1;
                                            } while (longList[cc] < longest);
                                        }
                                        token[varlist[aa][cc]] = tokenInList;
                                    }
                                }
                            }
                        }());
                        if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                            build.push("<ol class='data'><li class='c0'>");
                        } else {
                            build.push("<ol class='data'><li>");
                        }
                        for (a = 0; a < indent; a += 1) {
                            build.push(tab);
                        }
                        for (a = b - 1; a > -1; a -= 1) {
                            if (typeof meta[a] === "number") {
                                scope -= 1;
                                findvars(a);
                            } else if (meta[a] !== undefined && typeof meta[a] !== "string" && typeof meta[a] !== "number" && a > 0) {
                                token[a] = "<em class='s" + scope + "'>" + token[a] + "</em>";
                                scope    += 1;
                                if (scope > 16) {
                                    scope = 16;
                                }
                            }
                        }
                        (function jspretty__resultScope_globals() {
                            var aa          = 0,
                                bb          = token.length,
                                globalLocal = globals,
                                dd          = globalLocal.length,
                                ee          = 0,
                                word        = [],
                                wordlen     = 0;
                            for (aa = bb - 1; aa > 0; aa -= 1) {
                                if (types[aa] === "word" && (token[aa + 1] !== ":" || (token[aa + 1] === ":" && level[aa + 1] === "x")) && token[aa].indexOf("<em ") < 0) {
                                    word = token[aa].split(" ");
                                    for (ee = dd - 1; ee > -1; ee -= 1) {
                                        if (word[0] === globalLocal[ee] && token[aa - 1] !== ".") {
                                            if (token[aa - 1] === "function" && types[aa + 1] === "method") {
                                                token[aa] = "<em class='s1'>" + word[0] + "</em>";
                                                wordlen   = word.length;
                                                if (wordlen > 1) {
                                                    do {
                                                        token[aa] = token[aa] + " ";
                                                        wordlen   -= 1;
                                                    } while (wordlen > 1);
                                                }
                                            } else {
                                                token[aa] = "<em class='s0'>" + word[0] + "</em>";
                                                wordlen   = word.length;
                                                if (wordlen > 1) {
                                                    do {
                                                        token[aa] = token[aa] + " ";
                                                        wordlen   -= 1;
                                                    } while (wordlen > 1);
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }());
                        scope = 0;
                        for (a = 0; a < b; a += 1) {
                            if (typeof meta[a] === "number") {
                                folder();
                            }
                            if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || (lines[linesinc] !== undefined && lines[linesinc][1] === true))) {
                                folder();
                                comfold = a;
                            }
                            if (comfold > -1 && types[a] !== "comment") {
                                foldclose();
                                comfold = -1;
                            }
                            if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                                build.push(blockline(token[a]));
                            } else {
                                if (typeof meta[a] === "number") {
                                    scope += 1;
                                    if (scope > 16) {
                                        scope = 16;
                                    }
                                    build.push(token[a]);
                                } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                                    build.push(token[a]);
                                    scope    -= 1;
                                    buildlen = build.length - 1;
                                    do {
                                        buildlen -= 1;
                                    } while (buildlen > 0 && build[buildlen].indexOf("</li><li") < 0);
                                    build[buildlen] = build[buildlen].replace(/class\='l\d+'/, "class='l" + scope + "'");
                                } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}") {
                                    if (types[a] === "comment") {
                                        if (a === 0) {
                                            build[0] = "<ol class='data'><li class='c0'>";
                                        } else {
                                            buildlen = build.length - 1;
                                            if (build[buildlen].indexOf("<li") < 0) {
                                                do {
                                                    build[buildlen] = build[buildlen].replace(/<em class\='[a-z]\d+'>/g, "").replace(/<\/em>/g, "");
                                                    buildlen        -= 1;
                                                    if (buildlen > 0 && build[buildlen] === undefined) {
                                                        buildlen -= 1;
                                                    }
                                                } while (buildlen > 0 && build[buildlen - 1] !== undefined && build[buildlen].indexOf("<li") < 0);
                                            }
                                            build[buildlen] = build[buildlen].replace(/class\='l\d+'/, "class='c0'");
                                        }
                                    }
                                    build.push(token[a]);
                                }
                            }
                            if (jpres === true && lines[linesinc] !== undefined && a === lines[linesinc][0] && level[a] !== "x" && level[a] !== "s") {
                                if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                    if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                        nl(indent);
                                        build.push(tab);
                                        level[a] = "x";
                                    } else {
                                        indent = level[a];
                                        if (lines[linesinc][1] === true) {
                                            build.push("\n");
                                        }
                                        nl(indent);
                                        build.push(tab);
                                        build.push(token[a + 1]);
                                        nl(indent);
                                        build.push(tab);
                                        level[a + 1] = "x";
                                        a            += 1;
                                    }
                                } else if (lines[linesinc][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                    if ((token[a] !== "x}" || isNaN(level[a]) === true) && (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator")))) {
                                        data.push("<li>");
                                        data.push(linecount);
                                        data.push("</li>");
                                        linecount += 1;
                                        if (types[a] === "comment") {
                                            build.push("<em>&#xA;</em></li><li class='c0'>");
                                        } else {
                                            commentfix += 1;
                                            nl(indent);
                                        }
                                    }
                                }
                                linesinc += 1;
                            }
                            if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                                nl(jlevel);
                            } else if (level[a] === "s" && token[a] !== "x}") {
                                build.push(" ");
                            } else if (level[a] !== "x" && token[a] === "x}" && typeof meta[a + 1] !== "string" && typeof meta[a + 1] !== "number") {
                                build[build.length - 1] = removeEm(build[build.length - 1]);
                            } else if (level[a] !== "x" && (token[a] !== "x}" || (linesinc > 0 && lines[linesinc - 1][1] === true && lines[linesinc - 1][0] === a))) {
                                indent = level[a];
                                nl(indent);
                            }
                            if (lines[linesinc] !== undefined && lines[linesinc][0] < a) {
                                linesinc += 1;
                            }
                            if (folderItem.length > 0) {
                                if (a === folderItem[folderItem.length - 1][1] && comfold === -1) {
                                    foldclose();
                                }
                            }
                        }
                        last = build[build.length - 1];
                        if (last.indexOf("<li") > 0) {
                            build[build.length - 1] = "<em>&#xA;</em></li>";
                        } else if (last.indexOf("</li>") < 0) {
                            build.push("<em>&#xA;</em></li>");
                        }
                        build.push("</ol></div>");
                        last  = build.join("");
                        scope = last.match(/<li/g).length;
                        if (linecount - 1 > scope) {
                            linecount -= 1;
                            do {
                                data.pop();
                                data.pop();
                                data.pop();
                                linecount -= 1;
                            } while (linecount > scope);
                        }
                        data.push("</ol>");
                        build   = [
                            "<p>Scope analysis does not provide support for undeclared variables.</p>", "<p><em>", semi, "</em> instances of <strong>missing semicolons</strong> counted.</p>", "<p><em>", news, "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>", data.join(""), last
                        ];
                        summary = build.join("");
                        data    = [];
                        build   = [];
                        return "";
                    }()).replace(/(\s+)$/, "");
                } else {
                    result = (function jspretty__result() {
                        var a          = 0,
                            b          = token.length,
                            build      = [],
                            lineinc    = 0,
                            blockspace = function jspretty__result_blockspace(x) {
                                var linetest = x.replace(/\n/g, "");
                                x = x.substr(1);
                                if (x.indexOf("\n") === 0 && linetest === "") {
                                    return "\n\n";
                                }
                                if (x.indexOf("\n") > -1) {
                                    return "\n\n ";
                                }
                                return "\n ";
                            },
                            indent     = jlevel,
                            tab        = (function jspretty__result_tab() {
                                var aa = jchar,
                                    bb = jsize,
                                    cc = [];
                                for (bb; bb > 0; bb -= 1) {
                                    cc.push(aa);
                                }
                                return cc.join("");
                            }()),
                            nl         = function jspretty__result_nl(x) {
                                var dd = 0;
                                build.push("\n");
                                for (dd; dd < x; dd += 1) {
                                    build.push(tab);
                                }
                            };
                        (function jspretty__result_varSpaces() {
                            var aa          = 0,
                                varListLen  = 0,
                                cc          = 0,
                                longest     = 0,
                                longTest    = 0,
                                tokenInList = "",
                                longList    = [],
                                joins       = function jspretty__result_varSpaces_joins(x) {
                                    var xlen   = token[x].length,
                                        endTest = false,
                                        mixTest = false,
                                        perTest = false,
                                        period = function jspretty__result_varSpaces_joins_periodInit() {
                                            return;
                                        },
                                        ending = function jspretty__result_varSpaces_joins_endingInit() {
                                            return;
                                        };
                                    period = function jspretty__result_varSpaces_joins_period() {
                                        perTest = true;
                                        do {
                                            x    -= 2;
                                            xlen += token[x].length + 1;
                                        } while (x > 1 && token[x - 1] === ".");
                                        if (token[x] === ")" || token[x] === "]") {
                                            x += 1;
                                            xlen -= 1;
                                            mixTest = true;
                                            ending();
                                        }
                                    };
                                    ending = function jspretty__result_varSpaces_joins_ending() {
                                        var yy = 0;
                                        endTest = true;
                                        for (x -= 1; x > -1; x -= 1) {
                                            xlen += token[x].length;
                                            if (types[x] === "start" || types[x] === "method") {
                                                yy += 1;
                                                if (yy === 1) {
                                                    if (mixTest === true) {
                                                        return;
                                                    }
                                                    break;
                                                }
                                            }
                                            if (types[x] === "end") {
                                                yy -= 1;
                                            }
                                            if (types[x] === "operator") {
                                                if (level[x] === "s") {
                                                    xlen += 1;
                                                }
                                                if (level[x - 1] === "s") {
                                                    xlen += 1;
                                                }
                                            }
                                            if (token[x] === ";") {
                                                return;
                                            }
                                        }
                                        if (types[x - 1] === "word" || types[x - 1] === "literal") {
                                            x    -= 1;
                                            xlen += token[x].length;
                                        }
                                        if (types[x] === "word" && token[x - 1] === ".") {
                                            period();
                                        } else if (token[x - 1] === ")" || token[x - 1] === "]") {
                                            ending();
                                        }
                                    };
                                    if (types[x] === "word" && token[x - 1] === ".") {
                                        period();
                                        if (endTest === false) {
                                            xlen += 1;
                                        }
                                    } else if (token[x] === ")" || token[x] === "]") {
                                        ending();
                                        if (perTest === false) {
                                            xlen += 1;
                                        }
                                    } else {
                                        xlen += 1;
                                    }
                                    return xlen;
                                };
                            for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                                if (varlist[aa] !== undefined) {
                                    varListLen = varlist[aa].length;
                                    longest    = 0;
                                    longList   = [];
                                    for (cc = 0; cc < varListLen; cc += 1) {
                                        longTest = joins(varlist[aa][cc]);
                                        if (longTest > longest) {
                                            longest = longTest;
                                        }
                                        longList.push(longTest);
                                    }
                                    for (cc = 0; cc < varListLen; cc += 1) {
                                        tokenInList = token[varlist[aa][cc]];
                                        if (longList[cc] < longest) {
                                            do {
                                                tokenInList  += " ";
                                                longList[cc] += 1;
                                            } while (longList[cc] < longest);
                                        }
                                        token[varlist[aa][cc]] = tokenInList;
                                    }
                                }
                            }
                        }());
                        for (a = 0; a < indent; a += 1) {
                            build.push(tab);
                        }
                        for (a = 0; a < b; a += 1) {
                            if (types[a] === "comment") {
                                build.push(token[a].replace(/\n\s+/g, blockspace));
                            } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}") {
                                build.push(token[a]);
                            }
                            if (jpres === true && lines[lineinc] !== undefined && a === lines[lineinc][0] && level[a] !== "x" && level[a] !== "s") {
                                if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                    if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                        nl(indent);
                                        build.push(tab);
                                        level[a] = "x";
                                    } else {
                                        indent = level[a];
                                        if (lines[lineinc][1] === true) {
                                            build.push("\n");
                                        }
                                        nl(indent);
                                        build.push(tab);
                                        build.push(token[a + 1]);
                                        nl(indent);
                                        build.push(tab);
                                        level[a + 1] = "x";
                                        a            += 1;
                                    }
                                } else if (lines[lineinc][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                    if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator"))) {
                                        if (token[a] !== "x}" || isNaN(level[a]) === true || level[a] === "x") {
                                            build.push("\n");
                                        }
                                    }
                                }
                                lineinc += 1;
                            }
                            if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                                nl(jlevel);
                            } else if (level[a] === "s" && token[a] !== "x}") {
                                build.push(" ");
                            } else if (level[a] !== "x" && (token[a] !== "x}" || (lineinc > 0 && lines[lineinc - 1][1] === true && lines[lineinc - 1][0] === a))) {
                                indent = level[a];
                                nl(indent);
                            }
                            if (lines[lineinc] !== undefined && lines[lineinc][0] < a) {
                                lineinc += 1;
                            }
                        }
                        return build.join("");
                    }()).replace(/(\s+)$/, "");
                }
                if (summary !== "diff" && jsscope === false) {
                    stats.space.space -= 1;
                    //the analysis report is generated in this function
                    (function jspretty__report() {
                        var originalSize = source.length - 1,
                            noOfLines    = result.split("\n").length,
                            newlines     = stats.space.newline,
                            total        = {
                                chars  : 0,
                                comment: {
                                    token: stats.commentBlock.token + stats.commentLine.token,
                                    chars: stats.commentBlock.chars + stats.commentLine.chars
                                },
                                literal: {
                                    token: stats.number.token + stats.regex.token + stats.string.token,
                                    chars: stats.number.chars + stats.regex.chars + stats.string.chars
                                },
                                space  : stats.space.newline + stats.space.other + stats.space.space + stats.space.tab,
                                syntax : {
                                    token: stats.string.quote + stats.comma + stats.semicolon + stats.container,
                                    chars: 0
                                },
                                token  : 0
                            },
                            output       = [],
                            zero         = function jspretty__report_zero(x, y) {
                                if (y === 0) {
                                    return "0.00%";
                                }
                                return ((x / y) * 100).toFixed(2) + "%";
                            };
                        total.syntax.chars = total.syntax.token + stats.operator.chars;
                        total.syntax.token += stats.operator.token;
                        total.token        = stats.word.token + total.comment.token + total.literal.token + total.space + total.syntax.token;
                        total.chars        = stats.word.chars + total.comment.chars + total.literal.chars + total.space + total.syntax.chars;
                        if (newlines === 0) {
                            newlines = 1;
                        }
                        output.push("<div id='doc'>");
                        output.push("<p><em>");
                        output.push(semi);
                        output.push("</em> instance");
                        if (semi !== 1) {
                            output.push("s");
                        }
                        output.push(" of <strong>missing semicolons</strong> counted.</p>");
                        output.push("<p><em>");
                        output.push(news);
                        output.push("</em> unnessary instance");
                        if (news !== 1) {
                            output.push("s");
                        }
                        output.push(" of the keyword <strong>new</strong> counted.</p>");
                        output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>");
                        output.push("</thead><tbody><tr><th>Total Character Size</th><td>");
                        output.push(originalSize);
                        output.push("</td><td>");
                        output.push(result.length);
                        output.push("</td><td>");
                        output.push(result.length - originalSize);
                        output.push("</td><td>");
                        output.push((((result.length - originalSize) / originalSize) * 100).toFixed(2));
                        output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
                        output.push(newlines);
                        output.push("</td><td>");
                        output.push(noOfLines);
                        output.push("</td><td>");
                        output.push(noOfLines - newlines);
                        output.push("</td><td>");
                        output.push((((noOfLines - newlines) / newlines) * 100).toFixed(2));
                        output.push("%</td></tr></tbody></table>");
                        output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScript component analysis</caption><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percentage Quantity from Section</th>");
                        output.push("<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage Length from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
                        output.push("<tr><th>Total Accounted</th><td>");
                        output.push(total.token);
                        output.push("</td><td>100.00%</td><td>100.00%</td><td>");
                        output.push(total.chars);
                        output.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></tr><tr><th>Block Comments</th><td>");
                        output.push(stats.commentBlock.token);
                        output.push("</td><td>");
                        output.push(zero(stats.commentBlock.token, total.comment.token));
                        output.push("</td><td>");
                        output.push(zero(stats.commentBlock.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.commentBlock.chars);
                        output.push("</td><td>");
                        output.push(zero(stats.commentBlock.chars, total.comment.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.commentBlock.chars, total.chars));
                        output.push("</td></tr><tr><th>Inline Comments</th><td>");
                        output.push(stats.commentLine.token);
                        output.push("</td><td>");
                        output.push(zero(stats.commentLine.token, total.comment.token));
                        output.push("</td><td>");
                        output.push(zero(stats.commentLine.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.commentLine.chars);
                        output.push("</td><td>");
                        output.push(zero(stats.commentLine.chars, total.comment.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.commentLine.chars, total.chars));
                        output.push("</td></tr><tr><th>Comment Total</th><td>");
                        output.push(total.comment.token);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.comment.token, total.token));
                        output.push("</td><td>");
                        output.push(total.comment.chars);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.comment.chars, total.chars));
                        output.push("</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></tr><tr><th>New Lines</th><td>");
                        output.push(stats.space.newline);
                        output.push("</td><td>");
                        output.push(zero(stats.space.newline, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.newline, total.token));
                        output.push("</td><td>");
                        output.push(stats.space.newline);
                        output.push("</td><td>");
                        output.push(zero(stats.space.newline, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.newline, total.chars));
                        output.push("</td></tr><tr><th>Spaces</th><td>");
                        output.push(stats.space.space);
                        output.push("</td><td>");
                        output.push(zero(stats.space.space, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.space, total.token));
                        output.push("</td><td>");
                        output.push(stats.space.space);
                        output.push("</td><td>");
                        output.push(zero(stats.space.space, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.space, total.chars));
                        output.push("</td></tr><tr><th>Tabs</th><td>");
                        output.push(stats.space.tab);
                        output.push("</td><td>");
                        output.push(zero(stats.space.tab, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.tab, total.token));
                        output.push("</td><td>");
                        output.push(stats.space.tab);
                        output.push("</td><td>");
                        output.push(zero(stats.space.tab, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.tab, total.chars));
                        output.push("</td></tr><tr><th>Other Whitespace</th><td>");
                        output.push(stats.space.other);
                        output.push("</td><td>");
                        output.push(zero(stats.space.other, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.other, total.token));
                        output.push("</td><td>");
                        output.push(stats.space.other);
                        output.push("</td><td>");
                        output.push(zero(stats.space.other, total.space));
                        output.push("</td><td>");
                        output.push(zero(stats.space.other, total.chars));
                        output.push("</td></tr><tr><th>Total Whitespace</th><td>");
                        output.push(total.space);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.space, total.token));
                        output.push("</td><td>");
                        output.push(total.space);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.space, total.chars));
                        output.push("</td></tr><tr><th colspan='7'>Literals</th></tr><tr><th>Strings</th><td>");
                        output.push(stats.string.token);
                        output.push("</td><td>");
                        output.push(zero(stats.string.token, total.literal.token));
                        output.push("</td><td>");
                        output.push(zero(stats.string.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.string.chars);
                        output.push("</td><td>");
                        output.push(zero(stats.string.chars, total.literal.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.string.chars, total.chars));
                        output.push("</td></tr><tr><th>Numbers</th><td>");
                        output.push(stats.number.token);
                        output.push("</td><td>");
                        output.push(zero(stats.number.token, total.literal.token));
                        output.push("</td><td>");
                        output.push(zero(stats.number.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.number.chars);
                        output.push("</td><td>");
                        output.push(zero(stats.number.chars, total.literal.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.number.chars, total.chars));
                        output.push("</td></tr><tr><th>Regular Expressions</th><td>");
                        output.push(stats.regex.token);
                        output.push("</td><td>");
                        output.push(zero(stats.regex.token, total.literal.token));
                        output.push("</td><td>");
                        output.push(zero(stats.regex.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.regex.chars);
                        output.push("</td><td>");
                        output.push(zero(stats.regex.chars, total.literal.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.regex.chars, total.chars));
                        output.push("</td></tr><tr><th>Total Literals</th><td>");
                        output.push(total.literal.token);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.literal.token, total.token));
                        output.push("</td><td>");
                        output.push(total.literal.chars);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.literal.chars, total.chars));
                        output.push("</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Characters</th><td>");
                        output.push(stats.string.quote);
                        output.push("</td><td>");
                        output.push(zero(stats.string.quote, total.syntax.token));
                        output.push("</td><td>");
                        output.push(zero(stats.string.quote, total.token));
                        output.push("</td><td>");
                        output.push(stats.string.quote);
                        output.push("</td><td>");
                        output.push(zero(stats.string.quote, total.syntax.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.string.quote, total.chars));
                        output.push("</td></tr><tr><th>Commas</th><td>");
                        output.push(stats.comma);
                        output.push("</td><td>");
                        output.push(zero(stats.comma, total.syntax.token));
                        output.push("</td><td>");
                        output.push(zero(stats.comma, total.token));
                        output.push("</td><td>");
                        output.push(stats.comma);
                        output.push("</td><td>");
                        output.push(zero(stats.comma, total.syntax.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.comma, total.chars));
                        output.push("</td></tr><tr><th>Containment Characters</th><td>");
                        output.push(stats.container);
                        output.push("</td><td>");
                        output.push(zero(stats.container, total.syntax.token));
                        output.push("</td><td>");
                        output.push(zero(stats.container, total.token));
                        output.push("</td><td>");
                        output.push(stats.container);
                        output.push("</td><td>");
                        output.push(zero(stats.container, total.syntax.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.container, total.chars));
                        output.push("</td></tr><tr><th>Semicolons</th><td>");
                        output.push(stats.semicolon);
                        output.push("</td><td>");
                        output.push(zero(stats.semicolon, total.syntax.token));
                        output.push("</td><td>");
                        output.push(zero(stats.semicolon, total.token));
                        output.push("</td><td>");
                        output.push(stats.semicolon);
                        output.push("</td><td>");
                        output.push(zero(stats.semicolon, total.syntax.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.semicolon, total.chars));
                        output.push("</td></tr><tr><th>Operators</th><td>");
                        output.push(stats.operator.token);
                        output.push("</td><td>");
                        output.push(zero(stats.operator.token, total.syntax.token));
                        output.push("</td><td>");
                        output.push(zero(stats.operator.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.operator.chars);
                        output.push("</td><td>");
                        output.push(zero(stats.operator.chars, total.syntax.chars));
                        output.push("</td><td>");
                        output.push(zero(stats.operator.chars, total.chars));
                        output.push("</td></tr><tr><th>Total Syntax Characters</th><td>");
                        output.push(total.syntax.token);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.syntax.token, total.token));
                        output.push("</td><td>");
                        output.push(total.syntax.chars);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(total.syntax.chars, total.chars));
                        output.push("</td></tr>");
                        output.push("<tr><th colspan='7'>Keywords and Variables</th></tr><tr><th>Word</th><td>");
                        output.push(stats.word.token);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(stats.word.token, total.token));
                        output.push("</td><td>");
                        output.push(stats.word.chars);
                        output.push("</td><td>100.00%</td><td>");
                        output.push(zero(stats.word.chars, total.chars));
                        output.push("</td></tr></tbody></table></div>");
                        summary = output.join("");
                    }());
                }
                token   = [];
                types   = [];
                level   = [];
                lines   = [];
                meta    = [];
                varlist = [];
                return result;
            },
            markupmin     = function markupmin(args) {
                var i             = 0,
                    x             = (typeof args.source === "string") ? args.source.split("") : "Error: no content supplied to markup.",
                    comments      = (args.comments !== "comments" && args.comments !== "beautify" && args.comments !== "diff") ? "" : args.comments,
                    presume_html  = (args.presume_html === true) ? true : false,
                    top_comments  = (args.top_comments === true) ? true : false,
                    conditional   = (args.conditional === true) ? true : false,
                    markupspace   = function markupmin__markupspace() {
                        var a = 0,
                            c = [],
                            Y = x.length;
                        for (a = i; a < Y; a += 1) {
                            if (x[a] === ">") {
                                break;
                            }
                            c.push(x[a]);
                            x[a] = "";
                        }
                        i    = a;
                        x[i] = c.join("").replace(/\s+/g, " ").replace(/\s*,\s+/g, ", ").replace(/\s*\/(\s*)/g, "/").replace(/\s*=(\s*)/g, "=").replace(/ \="/g, "=\"").replace(/ \='/g, "='") + ">";
                    },
                    markupcomment = function markupmin__markupcomment(end) {
                        var Y = x.length,
                            b = 0,
                            c = [];
                        for (b = i; b < Y; b += 1) {
                            if ((b < Y - 8 && x[b] + x[b + 1] + x[b + 2] + x[b + 3] + x[b + 4] + x[b + 5] + x[b + 6] + x[b + 7] + x[b + 8] + x[b + 9] + x[b + 10] + x[b + 11] === end) || (b < Y - 4 && x[b] + x[b + 1] + x[b + 2] + x[b + 3] === end) || (b < Y - 3 && x[b] + x[b + 1] + x[b + 2] === end)) {
                                x[b]     = "";
                                x[b + 1] = "";
                                x[b + 2] = "";
                                if (end.length > 3) {
                                    x[b + 3] = "";
                                    if (end.length === 12) {
                                        x[b + 4]  = "";
                                        x[b + 5]  = "";
                                        x[b + 6]  = "";
                                        x[b + 7]  = "";
                                        x[b + 8]  = "";
                                        x[b + 9]  = "";
                                        x[b + 10] = "";
                                        x[b + 11] = "";
                                        i         = b + 11;
                                    } else {
                                        i = b + 3;
                                    }
                                } else {
                                    i = b + 2;
                                }
                                break;
                            }
                            if ((conditional === true && end.length === 12) || comments === "beautify" || comments === "comments") {
                                c.push(x[b]);
                            }
                            x[b] = "";
                        }
                        if ((conditional === true && end.length === 12) || comments === "comments" || comments === "beautify") {
                            x[i] = c.join("");
                            if (x[i].indexOf(end) !== x[i].length - end.length) {
                                x[i] = x[i] + end;
                            }
                        }
                        i += 1;
                        if (/\s/.test(x[i]) === true) {
                            x[i] = " ";
                        }
                        if (i < Y - 1 && /\s/.test(x[i + 1]) === true) {
                            i += 1;
                            do {
                                x[i] = "";
                                i    += 1;
                            } while (/\s/.test(x[i]) === true);
                        }
                    },
                    markupscript  = function markupmin__markupscript(z) {
                        var c           = 0,
                            e           = [],
                            f           = 0,
                            g           = "",
                            h           = "",
                            j           = "</" + z,
                            m           = "",
                            Y           = x.length,
                            cdataStart  = (/^(\s*\/+<!\[+[A-Z]+\[+)/),
                            cdataEnd    = (/(\/+\]+>\s*)$/),
                            scriptStart = (/^(\s*<\!\-\-)/),
                            scriptEnd   = (/(\/+\-\->\s*)$/),
                            cs          = "",
                            ce          = "",
                            y           = args.source;
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
                                h    = h + x[f];
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
                                g  = g.replace(cdataStart, "");
                            } else if (scriptStart.test(g)) {
                                cs = g.match(scriptStart)[0];
                                g  = g.replace(scriptStart, "");
                            }
                            if (cdataEnd.test(g)) {
                                ce = g.match(cdataEnd)[0];
                                g  = g.replace(cdataEnd, "");
                            } else if (scriptEnd.test(g)) {
                                ce = g.match(scriptEnd)[0];
                                g  = g.replace(scriptEnd, "");
                            }
                            if (e[e.length - 1] !== ">" || (z === "script" && e[e.length - 3] === "]" && e[e.length - 2] === "]" && e[e.length - 1] === ">")) {
                                if (z === "style") {
                                    g = cs + jsmin({
                                        source  : g,
                                        level   : 3,
                                        type    : "css",
                                        alter   : true,
                                        fcomment: top_comments
                                    }) + ce;
                                } else {
                                    g = cs + jsmin({
                                        source  : g,
                                        level   : 2,
                                        type    : "javascript",
                                        alter   : true,
                                        fcomment: top_comments
                                    }) + ce;
                                }
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
                    preserve      = function markupmin__preserve(end) {
                        var Y = x.length,
                            a = 0,
                            b = [],
                            c = 0;
                        for (c = i; c < Y; c += 1) {
                            if (end === "</script>" && c > 8 && (x[c - 8] + x[c - 7] + x[c - 6] + x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</script>") {
                                break;
                            }
                            if (end === "</pre>" && c > 5 && (x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</pre>") {
                                break;
                            }
                            if (x[c - 1] + x[c] === end) {
                                break;
                            }
                        }
                        for (a = i; a < c; a += 1) {
                            b.push(x[a]);
                            x[a] = "";
                        }
                        x[i] = b.join("");
                        i    = c;
                    },
                    content       = function markupmin__content() {
                        var Y = x.length,
                            a = 0,
                            b = [];
                        for (a = i; a < Y; a += 1) {
                            if (x[a] === "<") {
                                break;
                            }
                            b.push(x[a]);
                            x[a] = "";
                        }
                        i    = a - 1;
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
                    var a    = 0,
                        b    = [],
                        c    = false,
                        d    = 0,
                        f    = 0,
                        g    = "",
                        j    = [],
                        Y    = x.length,
                        html = [
                            "area", "base", "basefont", "br", "col", "embed", "eventsource", "frame", "hr", "img", "input", "keygen", "link", "meta", "param", "progress", "source", "wbr"
                        ],
                        e    = html.length;
                    for (a = 0; a < Y; a += 1) {
                        if (x[a] !== "") {
                            j.push(x[a]);
                        }
                    }
                    x = [];
                    Y = j.length;
                    for (a = 0; a < Y; a += 1) {
                        c = (/^\s+$/).test(j[a]);
                        if (!c || (c && !(/^\s+$/).test(j[a + 1]))) {
                            x.push(j[a]);
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
                    g = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/<(\s*)/g, "<").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">").replace(/ <\!\-\-\[/g, "<!--[");
                    if ((/\s/).test(g.charAt(0))) {
                        g = g.slice(1, g.length);
                    }
                    return g;
                }());
            },
            markup_beauty = function markup_beauty(args) {
                var token  = [],
                    build  = [],
                    cinfo  = [],
                    level  = [],
                    inner  = [],
                    sum    = [],
                    x      = (typeof args.source === "string") ? args.source : "",
                    msize  = (isNaN(args.insize)) ? 4 : Number(args.insize),
                    mchar  = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                    mmode  = (typeof args.mode === "string" && args.mode === "diff") ? "diff" : "beautify",
                    mcomm  = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : "indent",
                    mstyle = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
                    mhtml  = (typeof args.html === "boolean") ? args.html : false,
                    mcont  = (typeof args.content === "boolean") ? args.content : false,
                    mforce = (typeof args.force_indent === "boolean") ? args.force_indent : false,
                    mcond  = (typeof args.conditional === "boolean") ? args.conditional : false,
                    mwrap  = (isNaN(args.wrap)) ? 0 : Number(args.wrap);
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
                    if (mhtml === true) {
                        x = x.replace(/<\!\[endif\]\-\->/g, "<!--[endif]-->");
                    }
                }());
                (function markup_beauty__findNestedTags() {
                    var d = (function markup_beauty__findNestedTags_angleBraces() {
                            var a  = 0,
                                b  = 0,
                                c  = x.length,
                                dd = [],
                                e  = 0,
                                h  = -1,
                                i  = 0,
                                j  = 0,
                                k  = -1,
                                l  = 0,
                                m  = 0,
                                n  = false,
                                o  = false,
                                p  = 0,
                                q  = [">"],
                                r  = false,
                                s  = 0;
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
                                                dd.push([
                                                    a, b, h, a
                                                ]);
                                            }
                                            r = false;
                                            a = b;
                                            q = [">"];
                                            break;
                                        }
                                        if (x.charAt(b) === "<") {
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
                                        }
                                        if (x.charAt(m) === ">") {
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
                                                    dd.push([
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
                                        }
                                        if (x.charAt(b) === ">") {
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
                            return dd;
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
                    var i       = 0,
                        j       = 0,
                        y       = markupmin({
                            source      : x,
                            comments    : mmode,
                            presume_html: mhtml,
                            conditional : mcond
                        }).split(""),
                        a       = "",
                        b       = function markup_beauty__createBuild_endFinder(end) {
                            var aa   = [],
                                bb   = end.length,
                                c    = end.split("").reverse(),
                                d    = 0,
                                e    = "",
                                g    = "",
                                h    = 0,
                                jj   = "",
                                loop = y.length;
                            if (i > 0 && y[i - 1] === " ") {
                                e = " ";
                            }
                            for (i; i < loop; i += 1) {
                                aa.push(y[i]);
                                if (end === ">" && y[i] === "%") {
                                    if (y[i - 1] === "<") {
                                        h += 1;
                                    }
                                    if (y[i + 1] === ">") {
                                        h -= 1;
                                        i += 1;
                                        aa.pop();
                                        aa.push("%>");
                                    }
                                }
                                if (end === "]>" && h === 0) {
                                    if (y[i] === ">") {
                                        c  = [">"];
                                        bb = 1;
                                    }
                                }
                                if (aa[aa.length - 1] === c[0] && h === 0) {
                                    if (bb === 1) {
                                        if (mhtml === true && (aa[3] === ">" || aa[3] === " " || aa[3] === "l" || aa[3] === "L")) {
                                            g = aa.slice(1, 4).join("").toLowerCase();
                                            h = build.length - 1;
                                            if (h > -1) {
                                                if (token[h] === "T_asp" || token[h] === "T_php" || token[h] === "T_ssi" || token[h] === "T_sgml" || token[h] === "T_xml" || token[h] === "T_comment") {
                                                    do {
                                                        h -= 1;
                                                    } while (h > 0 && (token[h] === "T_asp" || token[h] === "T_php" || token[h] === "T_ssi" || token[h] === "T_sgml" || token[h] === "T_xml" || token[h] === "T_comment"));
                                                }
                                                jj = (build[h].charAt(0) === " ") ? build[h].slice(2, 5).toLowerCase() : build[h].slice(1, 4).toLowerCase();
                                                if (((g === "li " || g === "li>") && jj !== "/li" && jj !== "ul " && jj !== "ul>" && jj !== "ol " && jj !== "ol>") || (g === "/ul" && jj !== "/li" && jj !== "ul " && jj !== "ul>") || (g === "/ol" && jj !== "/li" && jj !== "ol " && jj !== "ol>")) {
                                                    build.push("</prettydiffli>");
                                                    token.push("T_tag_end");
                                                }
                                            }
                                        }
                                        return e + aa.join("");
                                    }
                                    for (d = 0; d < bb; d += 1) {
                                        if (c[d] !== aa[aa.length - (d + 1)]) {
                                            break;
                                        }
                                    }
                                    if (d === bb) {
                                        return e + aa.join("");
                                    }
                                }
                            }
                            return e + aa.join("");
                        },
                        c       = [],
                        cgather = function markup_beauty__createBuild_buildContent(z) {
                            var d    = "",
                                e    = 0,
                                f    = 0,
                                q    = "",
                                loop = y.length;
                            for (f = i; f < loop; f += 1) {
                                if (q === "" && (y[f - 1] !== "\\" || (f > 2 && y[f - 2] === "\\"))) {
                                    if (y[f] === "/" && y[f + 1] && y[f + 1] === "/") {
                                        q = "//";
                                    } else if (y[f] === "/" && y[f + 1] && y[f + 1] === "*") {
                                        q = "/*";
                                    } else if (y[f] === "'" || y[f] === "\"" || y[f] === "/") {
                                        if (y[f] === "/") {
                                            for (e = f - 1; e > 0; e -= 1) {
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
                                            q = y[f];
                                        }
                                    }
                                } else if ((y[f - 1] !== "\\" || (f > 2 && y[f - 2] === "\\")) && ((q === "'" && y[f] === "'") || (q === "\"" && y[f] === "\"") || (q === "/" && y[f] === "/") || (q === "//" && (y[f] === "\n" || (y[f - 4] && y[f - 4] === "/" && y[f - 3] === "/" && y[f - 2] === "-" && y[f - 1] === "-" && y[f] === ">"))) || (q === "/*" && y[f - 1] === "*" && y[f] === "/"))) {
                                    q = "";
                                }
                                if (((z === "script" && q === "") || z === "style") && y[f] === "<" && y[f + 1] === "/" && y[f + 2].toLowerCase() === "s") {
                                    if (z === "script" && (y[f + 3].toLowerCase() === "c" && y[f + 4].toLowerCase() === "r" && y[f + 5].toLowerCase() === "i" && y[f + 6].toLowerCase() === "p" && y[f + 7].toLowerCase() === "t")) {
                                        break;
                                    }
                                    if (z === "style" && (y[f + 3].toLowerCase() === "t" && y[f + 4].toLowerCase() === "y" && y[f + 5].toLowerCase() === "l" && y[f + 6].toLowerCase() === "e")) {
                                        break;
                                    }
                                } else if (z === "other" && y[f] === "<") {
                                    break;
                                }
                                d = d + y[f];
                            }
                            i = f - 1;
                            if (mcont === true) {
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
                        loop    = y.length;
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
                                i                       = j;
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
                                    }
                                    if (y[c + 1] === ">") {
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
                        if (build[i] !== "</prettydiffli>") {
                            sum.push(build[i]);
                        }
                    }
                }());
                (function markup_beauty__htmlCheat() {
                    var a    = 0,
                        b    = "",
                        i    = 0,
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
                                                    var j = 0,
                                                        s = 0,
                                                        l = 0;
                                                    for (s = i - 1; s > 0; s -= 1) {
                                                        if ((cinfo[s] === "start" && cinfo[s + 1] === "start" && level[s] === level[s + 1] - 1) || (cinfo[s] === "start" && cinfo[s - 1] !== "start" && level[s] === level[s - 1])) {
                                                            break;
                                                        }
                                                    }
                                                    for (j = s + 1; j < i; j += 1) {
                                                        if (cinfo[j] === "mixed_start" && cinfo[j + 1] === "end") {
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
                                                j = 0;
                                            for (j = i; j > 0; j -= 1) {
                                                if (cinfo[j] === "end") {
                                                    l += 1;
                                                } else if (cinfo[j] === "start") {
                                                    l -= 1;
                                                }
                                                if (l === 0) {
                                                    return j;
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
                                    return (function markup_beauty__algorithm_end_computation_whenAllElseFails() {
                                        var y = 0,
                                            j = 0;
                                        for (j = r(); j > 0; j -= 1) {
                                            if (cinfo[j] === "start") {
                                                y += 1;
                                            } else if (cinfo[j] === "end") {
                                                y -= 1;
                                            }
                                            if (level[j] !== "x") {
                                                if (cinfo[j] === "end" && cinfo[j - 1] === "start" && level[j - 1] !== "x") {
                                                    return level.push(level[j]);
                                                }
                                                if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_end" && (cinfo[i - 2] !== "end" || level[i - 2] !== "x") && (cinfo[i - 3] !== "end" || level[i - 3] !== "x")) {
                                                    return level.push("x");
                                                }
                                                return level.push(level[j] + (y - 1));
                                            }
                                        }
                                        y = 0;
                                        for (j = i; j > -1; j -= 1) {
                                            if (cinfo[j] === "start") {
                                                y += 1;
                                            } else if (cinfo[j] === "end") {
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
                                    var a  = 0,
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
                                    var a  = 0,
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
                                        }
                                        if (u === 1 && level[j] !== "x" && cinfo[j] !== "mixed_start" && cinfo[j] !== "content") {
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
                            if (i - 1 === 0 && cinfo[0] === "start" && (build[i].charAt(0) === " " || cinfo[i] !== "singleton")) {
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
                                        j = 0,
                                        h = 0,
                                        g = 0;
                                    for (a = k; a > 0; a -= 1) {
                                        if (cinfo[a] === "end") {
                                            j += 1;
                                        }
                                        if (cinfo[a] === "start") {
                                            h += 1;
                                        }
                                        if (level[a] === 0 && a !== 0) {
                                            g = a;
                                        }
                                        if (cinfo[k] === "mixed_both" && level[a] !== "x") {
                                            return level.push(level[a]);
                                        }
                                        if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end" && level[a] !== "x") {
                                            if (cinfo[a] === "start" && level[a] !== "x") {
                                                if (cinfo[i - 1] !== "end") {
                                                    return level.push(level[a] + (h - j));
                                                }
                                                if ((level[a] === level[a - 1] && cinfo[a - 1] !== "end" && level[a + 1] !== "x") || (cinfo[i - 2] === "start" && level[i - 2] !== "x" && level[i - 1] === "x")) {
                                                    return level.push(level[a] + 1);
                                                }
                                                if (h <= 1) {
                                                    return level.push(level[a]);
                                                }
                                            } else if (j > 0) {
                                                if (h > 1) {
                                                    if (g !== 0) {
                                                        return c("start");
                                                    }
                                                    return level.push(level[a] + 1);
                                                }
                                                return level.push(level[a] - j + 1);
                                            }
                                            return level.push(level[a] + h);
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
                        var a  = 0,
                            b  = "",
                            cc = 0,
                            d  = 0,
                            ee = inner.length,
                            ff = [];
                        for (a = 0; a < ee; a += 1) {
                            b  = inner[a][0];
                            cc = inner[a][1];
                            d  = inner[a][2];
                            if (typeof build[d] === "string") {
                                if (build[d].charAt(0) === " ") {
                                    cc += 1;
                                }
                                ff = build[d].split("");
                                if (b === "<" && ff[cc] === "[") {
                                    ff[cc] = "<";
                                } else if (b === ">" && ff[cc] === "]") {
                                    ff[cc] = ">";
                                }
                                build[d] = ff.join("");
                            }
                        }
                    }());
                    (function markup_beauty__algorithm_loop() {
                        var test        = false,
                            test1       = false,
                            svg         = false,
                            cdata       = [],
                            cdata1      = [],
                            cdataStart  = (/^(\s*\/*<\!\[+[A-Z]+\[+)/),
                            cdataEnd    = (/(\/*\]+>\s*)$/),
                            scriptStart = (/^(\s*<\!\-\-)/),
                            scriptEnd   = (/(\-\->\s*)$/),
                            loop        = cinfo.length,
                            disqualify  = (mhtml === true) ? (/^(\s?<((pre)|(script)))/) : (/^(\s?<script)/),
                            attrib      = function markup_beauty__algorithm_loop_attributeOrder(tag, end) {
                                var a        = [],
                                    b        = 0,
                                    cc       = 0,
                                    d        = "",
                                    ee       = tag.indexOf(" ") + 1,
                                    ff       = 0,
                                    g        = "",
                                    hh       = 0,
                                    space    = (tag.charAt(0) === " ") ? " " : "",
                                    joinchar = (svg === true) ? "\n" + (function markup_beauty__algorithm_loop_attributeOrder_joinchar() {
                                        var aa  = 0,
                                            bb  = msize,
                                            ccc = mchar,
                                            dd  = [],
                                            tab = "";
                                        for (aa = 0; aa < bb; aa += 1) {
                                            dd.push(ccc);
                                        }
                                        tab = dd.join("");
                                        bb  = level[i];
                                        dd  = [];
                                        for (aa = 0; aa < bb; aa += 1) {
                                            dd.push(tab);
                                        }
                                        return dd.join("") + tab;
                                    }()) : " ";
                                if (space === " ") {
                                    tag = tag.substr(1);
                                    ee  = tag.indexOf(" ") + 1;
                                }
                                g   = tag.substring(0, ee);
                                tag = tag.substring(ee, tag.length - end.length) + " ";
                                b   = tag.length;
                                for (cc = 0; cc < b; cc += 1) {
                                    if (d === "") {
                                        if (tag.charAt(cc) === "\"") {
                                            d = "\"";
                                        } else if (tag.charAt(cc) === "'") {
                                            d = "'";
                                        } else if (tag.charAt(cc) === "[") {
                                            d  = "[";
                                            hh = 1;
                                        } else if (tag.charAt(cc) === "{") {
                                            d  = "{";
                                            hh = 1;
                                        } else if (tag.charAt(cc) === "(") {
                                            d  = "(";
                                            hh = 1;
                                        } else if (tag.charAt(cc) === "<" && tag.charAt(cc + 1) === "%") {
                                            d  = "<%";
                                            hh = 1;
                                            ff = cc;
                                        } else if (tag.charAt(cc) === " " && hh === 0) {
                                            a.push(tag.substring(ff, cc));
                                            ff = cc + 1;
                                        }
                                    } else if (d === "\"" && tag.charAt(cc) === "\"") {
                                        d = "";
                                    } else if (d === "'" && tag.charAt(cc) === "'") {
                                        d = "";
                                    } else if (d === "[") {
                                        if (tag.charAt(cc) === "]") {
                                            hh -= 1;
                                            if (hh === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(cc) === "[") {
                                            hh += 1;
                                        }
                                    } else if (d === "{") {
                                        if (tag.charAt(cc) === "}") {
                                            hh -= 1;
                                            if (hh === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(cc) === "{") {
                                            hh += 1;
                                        }
                                    } else if (d === "(") {
                                        if (tag.charAt(cc) === ")") {
                                            hh -= 1;
                                            if (hh === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(cc) === "(") {
                                            hh += 1;
                                        }
                                    } else if (d === "<%") {
                                        if (tag.charAt(cc) === ">" && tag.charAt(cc - 1) === "%") {
                                            hh -= 1;
                                            if (hh === 0) {
                                                d = "";
                                            }
                                        } else if (tag.charAt(cc) === "<" && tag.charAt(cc + 1) === "%") {
                                            hh += 1;
                                        }
                                    }
                                }
                                return space + g + a.sort().join(joinchar) + end;
                            };
                        for (i = 0; i < loop; i += 1) {
                            test   = false;
                            test1  = false;
                            cdata  = [""];
                            cdata1 = [""];
                            if (build[i].indexOf("<svg") === 0 || build[i].indexOf(" <svg") === 0) {
                                svg = true;
                            } else if (build[i] === "</svg>" || build[i] === " </svg>") {
                                svg = false;
                            }
                            if (i === 0) {
                                level.push(0);
                            } else if (mforce === true) {
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
                                if ((/\s*<\!\-\-\s*\-\->(\s*)/).test(build[i]) === true) {
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
                                        test     = true;
                                        build[i] = build[i].replace(scriptStart, "");
                                    } else if (cdataStart.test(build[i])) {
                                        cdata    = cdataStart.exec(build[i]);
                                        build[i] = build[i].replace(cdataStart, "");
                                    }
                                    if (scriptEnd.test(build[i]) && (/(\/\/\-\->\s*)$/).test(build[i]) === false) {
                                        test1    = true;
                                        build[i] = build[i].replace(scriptEnd, "");
                                    } else if (cdataEnd.test(build[i])) {
                                        cdata1   = cdataEnd.exec(build[i]);
                                        build[i] = build[i].replace(cdataEnd, "");
                                    }
                                    if (typeof jspretty === "function") {
                                        build[i] = jspretty({
                                            source  : build[i],
                                            insize  : msize,
                                            inchar  : mchar,
                                            preserve: true,
                                            inlevel : 0,
                                            space   : true,
                                            braces  : args.indent,
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
                                        test     = true;
                                        build[i] = build[i].replace(scriptStart, "");
                                    } else if (cdataStart.test(build[i])) {
                                        cdata    = cdataStart.exec(build[i]);
                                        build[i] = build[i].replace(cdataStart, "");
                                    }
                                    if (scriptEnd.test(build[i]) && !/(\/\/\-\->\s*)$/.test(build[i])) {
                                        test1 = true;
                                        build[i].replace(scriptEnd, "");
                                    } else if (cdataEnd.test(build[i])) {
                                        cdata1   = cdataEnd.exec(build[i]);
                                        build[i] = build[i].replace(cdataEnd, "");
                                    }
                                    if (typeof cleanCSS === "function") {
                                        build[i] = cleanCSS({
                                            source   : build[i],
                                            size     : msize,
                                            character: mchar,
                                            comment  : mcomm,
                                            alter    : true
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
                                    if (svg === true && level[i - 1] !== "x" && (cinfo[i - 1] === "start" || (/^( ?<svg)/).test(build[i - 1]) === true)) {
                                        level.push(level[i - 1] + 1);
                                    } else {
                                        h();
                                    }
                                } else if (cinfo[i] === "end") {
                                    e();
                                } else if (cinfo[i] === "singleton") {
                                    if (svg === true && level[i - 1] !== "x") {
                                        if (cinfo[i - 1] === "start" || (/^( ?<svg)/).test(build[i - 1]) === true) {
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
                    var tab         = (function markup_beauty__apply_tab() {
                            var a = 0,
                                b = msize,
                                c = mchar,
                                d = [];
                            for (a = 0; a < b; a += 1) {
                                d.push(c);
                            }
                            return d.join("");
                        }()),
                        i           = 0,
                        loop        = build.length,
                        indents     = "",
                        tab_math    = function markup_beauty__apply_indentation(x) {
                            var a      = 0,
                                b      = (typeof level[i] === "number") ? level[i] : 0,
                                c      = 0,
                                d      = 0,
                                indent = [],
                                parse  = [],
                                pad    = function markup_beauty__apply_indentation_pad() {
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
                            x       = "\n" + indents + x;
                            if (cinfo[i] === "parse" && /\[\s*</.test(build[i])) {
                                build[i] = build[i].replace(/\[\s+</g, "[<");
                                parse    = build[i].split("");
                                b        = parse.length;
                                for (a = 0; a < b; a += 1) {
                                    if (parse[a] === "[") {
                                        c        += 1;
                                        parse[a] = "[\n" + pad();
                                    } else if (parse[a] === "]") {
                                        c        -= 1;
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
                        end_math    = function markup_beauty__apply_end(x) {
                            var a      = 0,
                                b      = 0,
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
                            var a      = 0,
                                b      = 0,
                                c      = 0,
                                d      = "",
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
                            return "\n" + d + x.replace(/\n(?!\n)/g, "\n" + d);
                        },
                        text_wrap   = function markup_beauty__apply_wrap() {
                            var a   = i,
                                b   = 0,
                                c   = build[i].replace(/^(\s+)/, "").replace(/(\s+)$/, "").split(" "),
                                d   = c.length - 1,
                                e   = [c[0]],
                                f   = c[0].length,
                                ind = (function markup_beauty__apply_wrap_ind() {
                                    var aa = 0,
                                        bb = [],
                                        cc = level[i],
                                        dd = 0;
                                    if (cinfo[i - 1] === "end" && level[i - 1] === "x") {
                                        for (aa = i - 1; aa > -1; aa -= 1) {
                                            if (cinfo[aa] === "end") {
                                                dd += 1;
                                            }
                                            if (cinfo[aa] === "start") {
                                                dd -= 1;
                                            }
                                            if (dd === -1 && cinfo[aa] === "start") {
                                                if (i > aa + 2 && level[aa + 2] !== "x") {
                                                    return indents;
                                                }
                                                return indents + tab;
                                            }
                                        }
                                    }
                                    for (aa = i - 1; aa > -1; aa -= 1) {
                                        if (token[aa] === "T_content" || (cinfo[aa] === "end" && level[aa] !== "x")) {
                                            if (cinfo[aa] === "end" && level[i] !== "x" && level[i] !== indents.length / tab.length) {
                                                for (aa = 0; aa < cc; aa += 1) {
                                                    bb.push(tab);
                                                }
                                                return bb.join("");
                                            }
                                            return indents;
                                        }
                                        if (cinfo[aa] !== "singleton" && cinfo[aa] !== "end") {
                                            if (cinfo[aa] === "start" && cinfo[aa - 1] === "end" && aa === i - 1 && level[aa] === "x") {
                                                return indents;
                                            }
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
                        if (cinfo[i] === "end" && (mforce === true || (cinfo[i - 1] !== "content" && cinfo[i - 1] !== "mixed_start"))) {
                            if (build[i].charAt(0) === " ") {
                                build[i] = build[i].substr(1);
                            }
                            if (level[i] !== "x" && cinfo[i - 1] !== "start") {
                                build[i] = end_math(build[i]);
                            }
                        } else if (cinfo[i] === "external" && mstyle === "indent") {
                            build[i] = script_math(build[i]);
                        } else if (level[i] !== "x" && (cinfo[i - 1] !== "content" && (cinfo[i - 1] !== "mixed_start" || mforce === true))) {
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
                            g = sum.length,
                            f = sum.join("").length,
                            b = (function markup_beauty__report_tagTypesCount() {
                                var a  = 0,
                                    bb = [
                                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                    ],
                                    c  = [
                                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                    ],
                                    d  = [],
                                    e  = [],
                                    ff = [],
                                    h  = [];
                                for (a = 0; a < g; a += 1) {
                                    switch (cinfo[a]) {
                                    case "end":
                                        bb[1] += 1;
                                        c[1]  += sum[a].length;
                                        if (sum[a].charAt(0) === " " && cinfo[a - 1] === "singleton") {
                                            c[1] -= 1;
                                            c[2] += 1;
                                        }
                                        break;
                                    case "singleton":
                                        bb[2] += 1;
                                        c[2]  += sum[a].length;
                                        if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            m.push(build[a]);
                                        }
                                        break;
                                    case "comment":
                                        bb[3] += 1;
                                        c[3]  += sum[a].length;
                                        break;
                                    case "content":
                                        bb[4] += 1;
                                        c[4]  += sum[a].length;
                                        break;
                                    case "mixed_start":
                                        bb[5] += 1;
                                        c[5]  += (sum[a].length - 1);
                                        break;
                                    case "mixed_end":
                                        bb[6] += 1;
                                        c[6]  += (sum[a].length - 1);
                                        break;
                                    case "mixed_both":
                                        bb[7] += 1;
                                        c[7]  += (sum[a].length - 2);
                                        break;
                                    case "parse":
                                        bb[10] += 1;
                                        c[10]  += sum[a].length;
                                        break;
                                    case "external":
                                        bb[17] += 1;
                                        c[17]  += sum[a].length;
                                        if (((build[a].indexOf("<script") !== -1 || build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            m.push(build[a]);
                                        }
                                        break;
                                    default:
                                        switch (token[a]) {
                                        case "T_tag_start":
                                            bb[0] += 1;
                                            c[0]  += sum[a].length;
                                            if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                                m.push(build[a]);
                                            }
                                            break;
                                        case "T_sgml":
                                            bb[8] += 1;
                                            c[8]  += sum[a].length;
                                            break;
                                        case "T_xml":
                                            bb[9] += 1;
                                            c[9]  += sum[a].length;
                                            break;
                                        case "T_ssi":
                                            bb[11] += 1;
                                            c[11]  += sum[a].length;
                                            break;
                                        case "T_asp":
                                            bb[12] += 1;
                                            c[12]  += sum[a].length;
                                            break;
                                        case "T_php":
                                            bb[13] += 1;
                                            c[13]  += sum[a].length;
                                            break;
                                        case "T_script":
                                            bb[15] += 1;
                                            c[15]  += sum[a].length;
                                            if (build[a].indexOf(" src") !== -1) {
                                                m.push(build[a]);
                                            }
                                            break;
                                        case "T_style":
                                            bb[16] += 1;
                                            c[16]  += sum[a].length;
                                            break;
                                        }
                                    }
                                }
                                d     = [
                                    bb[0] + bb[1] + bb[2] + bb[3], bb[4] + bb[5] + bb[6] + bb[7], bb[15] + bb[16] + bb[17], bb[11] + bb[12] + bb[13]
                                ];
                                e     = [
                                    c[0] + c[1] + c[2] + c[3], c[4] + c[5] + c[6] + c[7], c[15] + c[16] + c[17], c[11] + c[12] + c[13]
                                ];
                                ff    = [
                                    d[0], d[0], d[0], d[0], d[1], d[1], d[1], d[1], bb[10], bb[10], bb[10], d[3], d[3], d[3], d[3], d[2], d[2], d[2]
                                ];
                                h     = [
                                    e[0], e[0], e[0], e[0], e[1], e[1], e[1], e[1], c[10], c[10], c[10], e[3], e[3], e[3], e[3], e[2], e[2], e[2]
                                ];
                                bb[2] = bb[2] - d[3];
                                c[2]  = c[2] - e[3];
                                return [
                                    bb, c, d, e, ff, h
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
                                var a  = 0,
                                    c  = "",
                                    dd = [],
                                    e  = [],
                                    h  = (function markup_beauty__report_buildOutput_resultTable() {
                                        var aa = 0,
                                            cc = [
                                                "*** Start Tags", "End Tags", "Singleton Tags", "Comments", "Flat String", "String with Space at Start", "String with Space at End", "String with Space at Start and End", "SGML", "XML", "Total Parsing Declarations", "SSI", "ASP", "PHP", "Total Server Side Tags", "*** Script Tags", "*** Style Tags", "JavaScript/CSS Code"
                                            ],
                                            w  = [],
                                            hh = "",
                                            l  = "",
                                            z  = b[0].length;
                                        for (aa = 0; aa < z; aa += 1) {
                                            if (b[4][aa] === 0) {
                                                hh = "0.00%";
                                            } else if (b[0][aa] === b[4][aa]) {
                                                hh = "100.00%";
                                            } else {
                                                hh = ((b[0][aa] / b[4][aa]) * 100).toFixed(2) + "%";
                                            }
                                            if (b[5][aa] === 0) {
                                                l = "0.00%";
                                            } else if (b[1][aa] === b[5][aa]) {
                                                l = "100.00%";
                                            } else {
                                                l = ((b[1][aa] / b[5][aa]) * 100).toFixed(2) + "%";
                                            }
                                            w = ["<tr><th>" + cc[aa]];
                                            w.push("</th><td>");
                                            w.push(b[0][aa]);
                                            w.push("</td><td>");
                                            w.push(hh);
                                            w.push("</td><td>");
                                            w.push(((b[0][aa] / g) * 100).toFixed(2));
                                            w.push("%</td><td>");
                                            w.push(b[1][aa]);
                                            w.push("</td><td>");
                                            w.push(l);
                                            w.push("</td><td>");
                                            w.push(((b[1][aa] / f) * 100).toFixed(2));
                                            w.push("%</td></tr>");
                                            if (aa === 3) {
                                                w.push("<tr><th>Total Common Tags");
                                                w.push(p(0));
                                                w.push("<tr><th colspan='7'>Content</th></tr>");
                                            } else if (aa === 7) {
                                                w.push("<tr><th>Total Content");
                                                w.push(p(1));
                                                w.push("<tr><th colspan='7'>Parsing Declarations</th></tr>");
                                            } else if (aa === 10) {
                                                w.push("<tr><th colspan='7'>Server Side Tags</th></tr>");
                                            } else if (aa === 14) {
                                                w.push("<tr><th colspan='7'>Style and Script Code/Tags</th></tr>");
                                            } else if (aa === 17) {
                                                w.push("<tr><th>Total Script and Style Tags/Code");
                                                w.push(p(2));
                                            }
                                            cc[aa] = w.join("");
                                        }
                                        return cc.join("");
                                    }()),
                                    i  = ["<div id='doc'>"],
                                    z  = m.length;
                                i.push((function markup_beauty__report_buildOutput_content() {
                                    var aa          = 0,
                                        bb          = 0,
                                        zz          = g,
                                        hh          = [],
                                        ii          = [],
                                        j           = 0,
                                        k           = 0,
                                        l           = [],
                                        mm          = [],
                                        n           = [],
                                        oo          = "",
                                        pp          = [],
                                        w           = [],
                                        xx          = "",
                                        punctuation = function markup_beauty__report_buildOutput_punctuation(y) {
                                            return y.replace(/(\,|\.|\?|\!|\:) /, " ");
                                        };
                                    for (aa = 0; aa < zz; aa += 1) {
                                        if (cinfo[aa] === "content") {
                                            l.push(" ");
                                            l.push(build[aa]);
                                        } else if (cinfo[aa] === "mixed_start") {
                                            l.push(build[aa]);
                                        } else if (cinfo[aa] === "mixed_both") {
                                            l.push(build[aa].substr(0, build[aa].length));
                                        } else if (cinfo[aa] === "mixed_end") {
                                            l.push(" ");
                                            l.push(build[aa].substr(0, build[aa].length));
                                        }
                                    }
                                    xx = l.join("");
                                    if (xx.length === 0) {
                                        return "";
                                    }
                                    xx = xx.substr(1, xx.length).toLowerCase();
                                    w  = xx.replace(/\&nbsp;?/gi, " ").replace(/[a-z](\,|\.|\?|\!|\:) /gi, punctuation).replace(/(\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").split(" ");
                                    zz = w.length;
                                    for (aa = 0; aa < zz; aa += 1) {
                                        if (w[aa] !== "") {
                                            hh.push([
                                                1, w[aa]
                                            ]);
                                            j += 1;
                                            for (bb = aa + 1; bb < zz; bb += 1) {
                                                if (w[bb] === w[aa]) {
                                                    hh[hh.length - 1][0] += 1;
                                                    w[bb]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   = "";
                                                    j                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       += 1;
                                                }
                                            }
                                        }
                                    }
                                    zz = hh.length;
                                    for (aa = 0; aa < zz; aa += 1) {
                                        k = aa;
                                        for (bb = aa + 1; bb < zz; bb += 1) {
                                            if (hh[bb][0] > hh[k][0] && hh[bb][1] !== "") {
                                                k = bb;
                                            }
                                        }
                                        oo = hh[k][1];
                                        if (oo.length < 3 || oo.length > 30 || !(/[a-zA-Z]/).test(oo) || (/&\#?\w+;/).test(oo) || oo === "the" || oo === "and" || oo === "for" || oo === "are" || oo === "this" || oo === "from" || oo === "with" || oo === "that") {
                                            mm.push(hh[k]);
                                        } else {
                                            mm.push(hh[k]);
                                            n.push(hh[k]);
                                        }
                                        if (hh[k] !== hh[aa]) {
                                            hh[k] = hh[aa];
                                        } else {
                                            hh[k] = [
                                                0, ""
                                            ];
                                        }
                                        if (n.length === 11) {
                                            break;
                                        }
                                    }
                                    if (mm.length < 2) {
                                        return "";
                                    }
                                    bb = mm.length;
                                    for (aa = 0; aa < bb; aa += 1) {
                                        if (aa > 9) {
                                            mm[aa] = "";
                                        } else {
                                            pp[aa] = (mm[aa + 1]) ? (mm[aa][0] / mm[aa + 1][0]).toFixed(2) : "1.00";
                                            mm[aa] = "<tr><th>" + (aa + 1) + "</th><td>" + mm[aa][1].replace(/&/g, "&amp;") + "</td><td>" + mm[aa][0] + "</td><td>" + pp[aa] + "</td><td>" + ((mm[aa][0] / j) * 100).toFixed(2) + "%</td></tr>";
                                        }
                                    }
                                    if (mm[10]) {
                                        mm[10] = "";
                                    }
                                    if (n.length > 10) {
                                        bb = 10;
                                    } else {
                                        bb = n.length;
                                    }
                                    pp = [];
                                    for (aa = 0; aa < bb; aa += 1) {
                                        pp[aa] = (n[aa + 1]) ? (n[aa][0] / n[aa + 1][0]).toFixed(2) : "1.00";
                                        n[aa]  = "<tr><th>" + (aa + 1) + "</th><td>" + n[aa][1].replace(/&/g, "&amp;") + "</td><td>" + n[aa][0] + "</td><td>" + pp[aa] + "</td><td>" + ((n[aa][0] / j) * 100).toFixed(2) + "%</td></tr>";
                                    }
                                    if (n[10]) {
                                        n[10] = "";
                                    }
                                    if (bb > 10) {
                                        n[n.length - 1] = "";
                                    }
                                    ii.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrates <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content and the number of times they occurred.</caption>");
                                    ii.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Percentage from ");
                                    ii.push(j.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                    if (j > 1) {
                                        ii.push(" Total");
                                    }
                                    ii.push(" Word");
                                    if (j > 1) {
                                        ii.push("s");
                                    }
                                    oo = mm.join("");
                                    xx = n.join("");
                                    ii.push("</th></tr></thead><tbody><tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                                    ii.push(oo);
                                    if (oo !== xx && n.length > 2) {
                                        ii.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                        ii.push(xx);
                                    }
                                    ii.push("</tbody></table>");
                                    return ii.join("");
                                }()));
                                i.push("<table class='analysis' summary='Analysis of markup pieces.'><caption>Analysis of markup pieces.</caption><thead><tr><th>Type</th><th>Quantity of Tags/Content</th><th>Percentage Quantity in Section</th><th>Percentage Quantity of Total</th><th>** Character Size</th><th>Percentage Size in Section</th><th>Percentage Size of Total</th></tr></thead><tbody><tr><th>Total Pieces</th><td>");
                                i.push(g);
                                i.push("</td><td>100.00%</td><td>100.00%</td><td>");
                                i.push(f);
                                i.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Common Tags</th></tr>");
                                i.push(h);
                                dd = [];
                                for (a = 0; a < z; a += 1) {
                                    if (m[a]) {
                                        e = ["<li>"];
                                        e.push(m[a].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;"));
                                        e.push("</li>");
                                        dd[a] = e.join("");
                                    }
                                }
                                if (dd.length > 0) {
                                    c = "<h4>HTML elements making HTTP requests:</h4><ul>" + dd.join("") + "</ul>";
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
                                    b[2][1]                      = 0.00000001;
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
                sum   = [];
                return build.join("").replace(/^\s+/, "").replace(/\s*<\/prettydiffli>/g, "");
            },
            diffview      = function diffview(args) {
                var errorout      = 0,
                    diffline      = 0,
                    baseTextLines = (typeof args.baseTextLines === "string") ? args.baseTextLines : "",
                    newTextLines  = (typeof args.newTextLines === "string") ? args.newTextLines : "",
                    baseTextName  = (typeof args.baseTextName === "string") ? args.baseTextName : "Base Source",
                    newTextName   = (typeof args.newTextName === "string") ? args.newTextName : "New Source",
                    context       = ((/^([0-9]+)$/).test(args.contextSize)) ? Number(args.contextSize) : -1,
                    tsize         = ((/^([0-9]+)$/).test(args.tsize)) ? Number(args.tsize) : 4,
                    tchar         = (typeof args.tchar === "string") ? args.tchar : " ",
                    inline        = (args.inline === true) ? true : false,
                    tab           = (function diffview__tab() {
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
                        var lfpos     = str.indexOf("\n"),
                            crpos     = str.indexOf("\r"),
                            linebreak = ((lfpos > -1 && crpos > -1) || crpos < 0) ? "\n" : "\r",
                            lines     = "";
                        if (linebreak === "\n") {
                            str = str.replace(/\r/g, "");
                        } else {
                            str = str.replace(/\n/g, "");
                        }
                        lines = str.replace(/\&/g, "&amp;").replace(/\&#lt;/g, "$#l" + "t;").replace(/\&#gt;/g, "$#g" + "t;").replace(/</g, "$#l" + "t;").replace(/>/g, "$#g" + "t;");
                        return lines.split(linebreak);
                    },
                    bta           = stringAsLines(baseTextLines),
                    nta           = stringAsLines(newTextLines),
                    opcodes       = (function diffview__opcodes() {
                        var junkdict            = {},
                            isbjunk             = function diffview__opcodes_isbjunk(key) {
                                if (junkdict.hasOwnProperty(key)) {
                                    return junkdict[key];
                                }
                            },
                            a                   = [],
                            b                   = [],
                            reverse             = false,
                            matching_blocks     = [],
                            bxj                 = [],
                            answer              = [],
                            get_matching_blocks = function diffview__opcodes_getMatchingBlocks() {
                                var c                  = 0,
                                    d                  = 0,
                                    alo                = 0,
                                    ahi                = 0,
                                    blo                = 0,
                                    bhi                = 0,
                                    qi                 = [],
                                    i                  = 0,
                                    j                  = 0,
                                    k                  = 0,
                                    x                  = [],
                                    i1                 = 0,
                                    i2                 = 0,
                                    j1                 = 0,
                                    j2                 = 0,
                                    k1                 = 0,
                                    k2                 = 0,
                                    la                 = a.length,
                                    lb                 = b.length,
                                    queue              = [
                                        [
                                            0, la, 0, lb
                                        ]
                                    ],
                                    non_adjacent       = [],
                                    ntuplecomp         = function diffview__opcodes_getMatchingBlocks_ntuplecomp(x, y) {
                                        var ii   = 0,
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
                                        var cc       = 0,
                                            dd       = bxj.length,
                                            ii       = 0,
                                            jj       = 0,
                                            kk       = 0,
                                            l        = [
                                                0, 0
                                            ],
                                            besti    = alo,
                                            bestj    = blo,
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
                                                        besti    = ii - kk + 1;
                                                        bestj    = jj - kk + 1;
                                                        bestsize = kk;
                                                    }
                                                }
                                                l = [
                                                    jj, kk
                                                ];
                                            }
                                        }
                                        while (besti > alo && bestj > blo && !isbjunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
                                            besti    -= 1;
                                            bestj    -= 1;
                                            bestsize += 1;
                                        }
                                        while (besti + bestsize < ahi && bestj + bestsize < bhi && !isbjunk(b[bestj + bestsize]) && a[besti + bestsize] === b[bestj + bestsize]) {
                                            bestsize += 1;
                                        }
                                        while (besti > alo && bestj > blo && isbjunk(b[bestj - 1]) && a[besti - 1] === b[bestj - 1]) {
                                            besti    -= 1;
                                            bestj    -= 1;
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
                                    qi  = queue.pop();
                                    alo = qi[0];
                                    ahi = qi[1];
                                    blo = qi[2];
                                    bhi = qi[3];
                                    x   = find_longest_match(alo, ahi, blo, bhi);
                                    i   = x[0];
                                    j   = x[1];
                                    k   = x[2];
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
                        if (baseTextLines === "" || newTextLines === "") {
                            return "";
                        }
                        (function diffview__opcodes_diffArray() {
                            (function diffview__opcodes_diffArray_determineReverse() {
                                if (bta.length > nta.length) {
                                    reverse = true;
                                    a       = nta;
                                    b       = bta;
                                } else {
                                    a = bta;
                                    b = nta;
                                }
                            }());
                            (function diffview__opcodes_diffArray_clarity() {
                                var i   = 0,
                                    c   = 0,
                                    elt = "",
                                    n   = b.length;
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
                                var ai          = 0,
                                    bj          = 0,
                                    size        = 0,
                                    tag         = "",
                                    c           = 0,
                                    i           = 0,
                                    j           = 0,
                                    blocks      = get_matching_blocks(),
                                    d           = blocks.length,
                                    closerMatch = function diffview__opcodes_diffArray_algorithm_closerMatch(x, y, z) {
                                        var diffspot = function diffview__opcodes_diffArray_algorithm_closerMatch_diffspot(a, b) {
                                                var cc = a.replace(/^(\s+)/, "").split(""),
                                                    dd = Math.min(cc.length, b.length),
                                                    e  = 0;
                                                for (e = 0; e < dd; e += 1) {
                                                    if (cc[e] !== b[e]) {
                                                        return e;
                                                    }
                                                }
                                                return e;
                                            },
                                            zz       = z.replace(/^(\s+)/, "").split(""),
                                            test     = diffspot(y, zz) - diffspot(x, zz);
                                        if (test > 0) {
                                            return true;
                                        }
                                        return false;
                                    };
                                for (c = 0; c < d; c += 1) {
                                    ai   = blocks[c][0];
                                    bj   = blocks[c][1];
                                    size = blocks[c][2];
                                    tag  = "";
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
                    var node     = ["<div class='diff'>"],
                        data     = [
                            [], [], [], []
                        ],
                        idx      = 0,
                        b        = 0,
                        be       = 0,
                        n        = 0,
                        ne       = 0,
                        rowcnt   = 0,
                        i        = 0,
                        jump     = 0,
                        tb       = (tab === "") ? "" : new RegExp("^((" + tab.replace(/\\/g, "\\") + ")+)"),
                        noTab    = function diffview__report_noTab(str) {
                            var a  = 0,
                                bb = str.length,
                                c  = [];
                            for (a = 0; a < bb; a += 1) {
                                c.push(str[a].replace(tb, ""));
                            }
                            return c;
                        },
                        btab     = (tab === "") ? [] : noTab(bta),
                        ntab     = (tab === "") ? [] : noTab(nta),
                        opleng   = opcodes.length,
                        change   = "",
                        btest    = false,
                        ntest    = false,
                        ctest    = true,
                        code     = [],
                        z        = [],
                        charcomp = function diffview__report_charcomp(c, d) {
                            var aa      = [],
                                bb      = [],
                                cc      = c.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">"),
                                dd      = d.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">"),
                                ee      = 0,
                                ff      = 0,
                                ja      = [],
                                jj      = 0,
                                jt      = false,
                                ka      = [],
                                kt      = false,
                                kk      = 0,
                                ll      = [],
                                rrs     = (/_pdiffdiff\_/g),
                                rrt     = (/_epdiffdiff\_/g),
                                ss      = "_pdiff" + "diff_",
                                tt      = "_epdiff" + "diff_",
                                xx      = 0,
                                tabdiff = (function diffview__report_charcomp_tabdiff() {
                                    var aaa = "",
                                        bbb = "",
                                        ccc = "",
                                        ddd = "",
                                        eee = [],
                                        fff = cc.match(tb),
                                        ggg = dd.match(tb);
                                    if (fff === null || ggg === null || (fff[0] === "" && fff.length === 1) || (ggg[0] === "" && ggg.length === 1)) {
                                        return [
                                            "", "", cc, dd
                                        ];
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
                                    return [
                                        aaa, bbb, ccc, ddd
                                    ];
                                }());
                            if (cc === dd) {
                                return [
                                    c, d
                                ];
                            }
                            errorout -= 1;
                            if (tb !== "" && cc.length !== dd.length && cc.replace(tb, "") === dd.replace(tb, "")) {
                                errorout += 1;
                                return [
                                    (tabdiff[0] + tabdiff[2]).replace(/&/g, "&amp;").replace(/</g, "&l" + "t;").replace(/>/g, "&g" + "t;").replace(rrs, "<em>").replace(rrt, "</em>"), (tabdiff[1] + tabdiff[3]).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(rrs, "<em>").replace(rrt, "</em>")
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
                                    aa[ee]   = ss + aa[ee];
                                    bb[ee]   = ss + bb[ee];
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
                                            aa[ee]            = ss + tt + aa[ee].replace(rrs, "");
                                            bb[bb.length - 1] = tt + bb[bb.length - 1];
                                        } else if (bb[ee].replace(rrs, "") === aa[aa.length - 1]) {
                                            bb[ee]            = ss + tt + bb[ee].replace(rrs, "");
                                            aa[aa.length - 1] = tt + aa[aa.length - 1];
                                        } else {
                                            aa.push(tt);
                                            bb.push(tt);
                                        }
                                        break;
                                    }
                                    if (aa[ll[0]] === bb[ee].substring(ss.length)) {
                                        if (aa[ll[0]] === bb[ee].substring(ss.length)) {
                                            aa[ll[0]] = tt + aa[ll[0]];
                                        } else {
                                            aa[ll[0]] = aa[ll[0]] + tt;
                                        }
                                        if (ll[1] === ee) {
                                            bb[ll[1]] = ss + tt + bb[ll[1]].replace(rrs, "");
                                        } else {
                                            bb[ll[1]] = tt + bb[ll[1]];
                                        }
                                    } else if (bb[ll[1]] === aa[ee].substring(ss.length)) {
                                        if (bb[ll[1]] === aa[ee].substring(ss.length)) {
                                            bb[ll[1]] = tt + bb[ll[1]];
                                        } else {
                                            bb[ll[1]] = bb[ll[1]] + tt;
                                        }
                                        if (ll[0] === ee) {
                                            aa[ll[0]] = ss + tt + aa[ll[0]].replace(rrs, "");
                                        } else {
                                            aa[ll[0]] = tt + aa[ll[0]];
                                        }
                                    } else {
                                        if (ll[1] > ll[0] && aa[ll[1] + 1] === bb[ll[1] + 1]) {
                                            if (aa[ll[1]] === bb[ll[1]].replace(rrt, "")) {
                                                bb[ll[1]] = bb[ll[1]].replace(rrt, "");
                                                do {
                                                    ll[1] -= 1;
                                                } while (aa[ll[1]] === bb[ll[1]]);
                                                bb[ll[1]] = bb[ll[1]] + tt;
                                            }
                                            aa[ll[1]] = aa[ll[1]] + tt;
                                            ll[0]     = ll[1];
                                        } else if (rrt.test(aa[ll[0]]) === false) {
                                            aa[ll[0]] = aa[ll[0]] + tt;
                                        }
                                        if (ll[0] > ll[1] && bb[ll[0] + 1] === aa[ll[0] + 1]) {
                                            if (bb[ll[0]] === aa[ll[0]].replace(rrt, "")) {
                                                aa[ll[0]] = aa[ll[0]].replace(rrt, "");
                                                do {
                                                    ll[0] -= 1;
                                                } while (bb[ll[0]] === aa[ll[0]]);
                                                aa[ll[0]] = aa[ll[0]] + tt;
                                            }
                                            bb[ll[0]] = bb[ll[0]] + tt;
                                            ll[1]     = ll[0];
                                        } else if (rrt.test(bb[ll[1]]) === false) {
                                            bb[ll[1]] = bb[ll[1]] + tt;
                                        }
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
                            if (ee < Math.max(aa.length, bb.length) && rrt.test(aa[aa.length - 1]) === false && rrt.test(bb[bb.length - 1]) === false) {
                                errorout += 1;
                                if (aa.length < bb.length) {
                                    aa.push(ss);
                                    aa.push(tt);
                                    bb[ee] = ss + bb[ee];
                                    bb.push(tt);
                                } else {
                                    bb.push(ss);
                                    bb.push(tt);
                                    aa[ee] = ss + aa[ee];
                                    aa.push(tt);
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
                        code   = opcodes[idx];
                        change = code[0];
                        b      = code[1];
                        be     = code[2];
                        n      = code[3];
                        ne     = code[4];
                        rowcnt = Math.max(be - b, ne - n);
                        ctest  = true;
                        for (i = 0; i < rowcnt; i += 1) {
                            if (isNaN(context) === false && context > -1 && opcodes.length > 1 && ((idx > 0 && i === context) || (idx === 0 && i === 0)) && change === "equal") {
                                ctest = false;
                                jump  = rowcnt - ((idx === 0 ? 1 : 2) * context);
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
                            } else if (change !== "equal") {
                                diffline += 1;
                            }
                            if (bta[b] === nta[n]) {
                                change = "equal";
                            } else if (change === "equal") {
                                change = "replace";
                            }
                            if (tab !== "") {
                                if (btest === false && bta[be] !== nta[ne] && typeof bta[b + 1] === "string" && typeof nta[n] === "string" && btab[b + 1] === ntab[n] && btab[b] !== ntab[n] && (typeof nta[n - 1] !== "string" || btab[b] !== ntab[n - 1])) {
                                    btest = true;
                                } else if (ntest === false && bta[be] !== nta[ne] && typeof nta[n + 1] === "string" && typeof bta[b] === "string" && ntab[n + 1] === btab[b] && ntab[n] !== btab[b] && (typeof bta[b - 1] !== "string" || ntab[n] !== btab[b - 1])) {
                                    ntest = true;
                                }
                            }
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
                                    b     += 1;
                                    btest = false;
                                } else if (ntest) {
                                    n     += 1;
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
                                    b     += 1;
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
                                    n     += 1;
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
            },
            //everything above, except "startTime" is a library.  Here
            //is the logic that puts it all together into a combined
            //application
            core          = function core(api) {
                var auto          = "",
                    autotest      = false,
                    spacetest     = (/^\s+$/g),
                    apioutput     = "",
                    apidiffout    = "",
                    ccomm         = (api.comments === "noindent") ? "noindent" : "indent",
                    ccond         = (api.conditional === true) ? true : false,
                    ccontent      = (api.content === true) ? true : false,
                    ccontext      = (api.context === "" || (/^(\s+)$/).test(api.context) || isNaN(api.context)) ? "" : Number(api.context),
                    ccorrect      = (api.correct === true) ? true : false,
                    ccsvchar      = (typeof api.csvchar === "string" && api.csvchar.length > 0) ? api.csvchar : ",",
                    cdiff         = (typeof api.diff === "string" && api.diff.length > 0) ? api.diff : "",
                    cdiffcomments = (api.diffcomments === true) ? true : false,
                    cdifflabel    = (typeof api.difflabel === "string" && api.difflabel.length > 0) ? api.difflabel : "new",
                    cdiffview     = (api.diffview === "inline") ? "inline" : "sidebyside",
                    cforce        = (api.force_indent === true) ? true : false,
                    chtml         = (api.html === true || (typeof api.html === "string" && api.html === "html-yes")) ? true : false,
                    cinchar       = (typeof api.inchar === "string" && api.inchar.length > 0) ? api.inchar : " ",
                    cindent       = (api.indent === "allman") ? "allman" : "",
                    cinlevel      = (isNaN(api.inlevel) || Number(api.inlevel) < 1) ? 0 : Number(api.inlevel),
                    cinsize       = (isNaN(api.insize)) ? 4 : Number(api.insize),
                    cjsscope      = (api.jsscope === true) ? true : false,
                    clang         = (typeof api.lang === "string" && (api.lang === "javascript" || api.lang === "css" || api.lang === "markup" || api.lang === "html" || api.lang === "csv" || api.lang === "text")) ? api.lang : "auto",
                    cmode         = (typeof api.mode === "string" && (api.mode === "minify" || api.mode === "beautify")) ? api.mode : "diff",
                    cpreserve     = (api.preserve === false) ? false : true,
                    cquote        = (api.quote === true) ? true : false,
                    csemicolon    = (api.semicolon === true) ? true : false,
                    csource       = (typeof api.source === "string" && api.source.length > 0) ? api.source : ((cmode === "diff") ? "" : "Source sample is missing."),
                    csourcelabel  = (typeof api.sourcelabel === "string" && api.sourcelabel.length > 0) ? api.sourcelabel : "base",
                    cspace        = (api.space === false) ? false : true,
                    cstyle        = (api.style === "noindent") ? "noindent" : "indent",
                    ctopcoms      = (api.topcoms === true) ? true : false,
                    cwrap         = (isNaN(api.wrap)) ? 0 : Number(api.wrap),
                    proctime      = function core__proctime() {
                        var minuteString = "",
                            hourString   = "",
                            minutes      = 0,
                            hours        = 0,
                            now          = new Date(),
                            elapsed      = ((now.getTime() - startTime) / 1000),
                            secondString = elapsed.toFixed(3),
                            plural       = function core__proctime_plural(x, y) {
                                var a = "";
                                if (x !== 1) {
                                    a = x + y + "s ";
                                } else {
                                    a = x + y + " ";
                                }
                                return a;
                            },
                            minute       = function core__proctime_minute() {
                                minutes      = parseInt((elapsed / 60), 10);
                                secondString = plural(Number((elapsed - (minutes * 60)).toFixed(3)), " second");
                                minuteString = plural(minutes, " minute");
                            };
                        if (elapsed >= 60 && elapsed < 3600) {
                            minute();
                        } else if (elapsed >= 3600) {
                            hours      = parseInt((elapsed / 3600), 10);
                            hourString = hours.toString();
                            elapsed    = elapsed - (hours * 3600);
                            hourString = plural(hours, " hour");
                            minute();
                        } else {
                            secondString = plural(secondString, " second");
                        }
                        return "<p><strong>Execution time:</strong> <em>" + hourString + minuteString + secondString + "</em></p>";
                    },
                    pdcomment     = function core__pdcomment() {
                        var comment    = "",
                            a          = 0,
                            b          = csource.length,
                            c          = csource.indexOf("/*prettydiff.com") + 16,
                            difftest   = false,
                            build      = [],
                            comma      = -1,
                            g          = 0,
                            sourceChar = [],
                            quote      = "";
                        if (csource.indexOf("/*prettydiff.com") === -1 && cdiff.indexOf("/*prettydiff.com") === -1) {
                            return;
                        }
                        if (c === 15 && typeof cdiff === "string") {
                            c        = cdiff.indexOf("/*prettydiff.com") + 16;
                            difftest = true;
                        } else if (c === 15) {
                            return;
                        }
                        for (c; c < b; c += 1) {
                            if (difftest === false) {
                                if (csource.charAt(c) === "*" && csource.charAt(c + 1) === "/") {
                                    break;
                                }
                                sourceChar.push(csource.charAt(c));
                            } else {
                                if (cdiff.charAt(c) === "*" && cdiff.charAt(c + 1) === "/") {
                                    break;
                                }
                                sourceChar.push(cdiff.charAt(c));
                            }
                        }
                        comment = sourceChar.join("").toLowerCase();
                        b       = comment.length;
                        for (c = 0; c < b; c += 1) {
                            if ((typeof comment.charAt(c - 1) !== "string" || comment.charAt(c - 1) !== "\\") && (comment.charAt(c) === "\"" || comment.charAt(c) === "'")) {
                                if (quote === "") {
                                    quote = comment.charAt(c);
                                } else {
                                    quote = "";
                                }
                            }
                            if (quote === "") {
                                if (comment.charAt(c) === ",") {
                                    g     = comma + 1;
                                    comma = c;
                                    build.push(comment.substring(g, comma).replace(/^(\s*)/, "").replace(/(\s*)$/, ""));
                                }
                            }
                        }
                        g     = comma + 1;
                        comma = comment.length;
                        build.push(comment.substring(g, comma).replace(/^(\s*)/, "").replace(/(\s*)$/, ""));
                        quote      = "";
                        b          = build.length;
                        sourceChar = [];
                        for (c = 0; c < b; c += 1) {
                            a = build[c].length;
                            for (g = 0; g < a; g += 1) {
                                if (build[c].indexOf(":") === -1) {
                                    build[c] = "";
                                    break;
                                }
                                sourceChar = [];
                                if ((typeof build[c].charAt(g - 1) !== "string" || build[c].charAt(g - 1) !== "\\") && (build[c].charAt(g) === "\"" || build[c].charAt(g) === "'")) {
                                    if (quote === "") {
                                        quote = build[c].charAt(g);
                                    } else {
                                        quote = "";
                                    }
                                }
                                if (quote === "") {
                                    if (build[c].charAt(g) === ":") {
                                        sourceChar.push(build[c].substring(0, g).replace(/(\s*)$/, ""));
                                        sourceChar.push(build[c].substring(g + 1).replace(/^(\s*)/, ""));
                                        if (sourceChar[1].charAt(0) === sourceChar[1].charAt(sourceChar[1].length - 1) && sourceChar[1].charAt(sourceChar[1].length - 2) !== "\\" && (sourceChar[1].charAt(0) === "\"" || sourceChar[1].charAt(0) === "'")) {
                                            sourceChar[1] = sourceChar[1].substring(1, sourceChar[1].length - 1);
                                        }
                                        build[c] = sourceChar;
                                        break;
                                    }
                                }
                            }
                        }
                        for (c = 0; c < b; c += 1) {
                            if (build[c][1]) {
                                if (build[c][0] === "api.mode") {
                                    if (build[c][1] === "beautify") {
                                        cmode = "beautify";
                                    } else if (build[c][1] === "minify") {
                                        cmode = "minify";
                                    } else if (build[c][1] === "diff") {
                                        cmode = "diff";
                                    }
                                } else if (build[c][0] === "api.lang") {
                                    if (build[c][1] === "auto") {
                                        clang = "auto";
                                    } else if (build[c][1] === "javascript") {
                                        clang = "javascript";
                                    } else if (build[c][1] === "css") {
                                        clang = "csv";
                                    } else if (build[c][1] === "csv") {
                                        clang = "csv";
                                    } else if (build[c][1] === "markup") {
                                        clang = "markup";
                                    } else if (build[c][1] === "text") {
                                        clang = "text";
                                    }
                                } else if (build[c][0] === "api.csvchar") {
                                    ccsvchar = build[c][1];
                                } else if (build[c][0] === "api.insize" && !/\D/.test(build[c][1])) {
                                    cinsize = build[c][1];
                                } else if (build[c][0] === "api.inchar") {
                                    cinchar = build[c][1];
                                } else if (build[c][0] === "api.comments") {
                                    if (build[c][1] === "indent") {
                                        ccomm = "indent";
                                    } else if (build[c][1] === "noindent") {
                                        ccomm = "noindent";
                                    }
                                } else if (build[c][0] === "api.indent") {
                                    if (build[c][1] === "knr") {
                                        cindent = "knr";
                                    } else if (build[c][1] === "allman") {
                                        cindent = "allman";
                                    }
                                } else if (build[c][0] === "api.style") {
                                    if (build[c][1] === "indent") {
                                        cstyle = "indent";
                                    } else if (build[c][1] === "noindent") {
                                        cstyle = "noindent";
                                    }
                                } else if (build[c][0] === "api.html") {
                                    if (build[c][1] === "html-no") {
                                        chtml = "html-no";
                                    } else if (build[c][1] === "html-yes") {
                                        chtml = "html-yes";
                                    }
                                } else if (build[c][0] === "api.context" && (!/\D/.test(build[c][1]) || build[c][1] === "")) {
                                    ccontext = build[c][1];
                                } else if (build[c][0] === "api.content") {
                                    if (build[c][1] === "true") {
                                        ccontent = true;
                                    } else if (build[c][1] === "false") {
                                        ccontent = false;
                                    }
                                } else if (build[c][0] === "api.quote") {
                                    if (build[c][1] === "true") {
                                        cquote = true;
                                    } else if (build[c][1] === "false") {
                                        cquote = false;
                                    }
                                } else if (build[c][0] === "api.semicolon") {
                                    if (build[c][1] === "true") {
                                        csemicolon = true;
                                    } else if (build[c][1] === "false") {
                                        csemicolon = false;
                                    }
                                } else if (build[c][0] === "api.diffview") {
                                    if (build[c][1] === "sidebyside") {
                                        cdiffview = "sidebyside";
                                    } else if (build[c][1] === "inline") {
                                        cdiffview = "inline";
                                    }
                                } else if (build[c][0] === "api.sourcelabel") {
                                    csourcelabel = build[c][1];
                                } else if (build[c][0] === "api.difflabel") {
                                    cdifflabel = build[c][1];
                                } else if (build[c][0] === "api.topcoms") {
                                    if (build[c][1] === "true") {
                                        ctopcoms = true;
                                    } else if (build[c][1] === "false") {
                                        ctopcoms = false;
                                    }
                                } else if (build[c][0] === "api.force_indent") {
                                    if (build[c][1] === "true") {
                                        cforce = true;
                                    } else if (build[c][1] === "false") {
                                        cforce = false;
                                    }
                                } else if (build[c][0] === "api.conditional") {
                                    if (build[c][1] === "true") {
                                        ccond = true;
                                    } else if (build[c][1] === "false") {
                                        ccond = false;
                                    }
                                } else if (build[c][0] === "api.diffcomments") {
                                    if (build[c][1] === "true") {
                                        cdiffcomments = true;
                                    } else if (build[c][1] === "false") {
                                        cdiffcomments = false;
                                    }
                                } else if (build[c][0] === "api.jsspace") {
                                    if (build[c][1] === "true") {
                                        cspace = true;
                                    } else if (build[c][1] === "false") {
                                        cspace = false;
                                    }
                                } else if (build[c][0] === "api.jsscope") {
                                    if (build[c][1] === "true") {
                                        cjsscope = true;
                                    } else if (build[c][1] === "false") {
                                        cjsscope = false;
                                    }
                                } else if (build[c][0] === "api.jslines") {
                                    if (build[c][1] === "true") {
                                        cpreserve = true;
                                    } else if (build[c][1] === "false") {
                                        cpreserve = false;
                                    }
                                } else if (build[c][0] === "api.inlevel") {
                                    if (build[c][1] === "true") {
                                        cinlevel = true;
                                    } else if (build[c][1] === "false") {
                                        cinlevel = false;
                                    }
                                } else if (build[c][0] === "api.correct") {
                                    if (build[c][1] === "true") {
                                        ccorrect = true;
                                    } else if (build[c][1] === "false") {
                                        ccorrect = false;
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
                        var a     = csource,
                            b     = a.replace(/\[[a-zA-Z][\w\-]*\=("|')?[a-zA-Z][\w\-]*("|')?\]/g, "").split(""),
                            c     = b.length,
                            d     = 0,
                            join  = "",
                            flaga = false,
                            flagb = false;
                        autotest = true;
                        if ((/^(\s*#)/).test(a) === true) {
                            clang = "css";
                            auto  = "CSS";
                            return;
                        }
                        if (/^([\s\w]*<)/.test(a) === false && /(>[\s\w]*)$/.test(a) === false) {
                            for (d = 1; d < c; d += 1) {
                                if (flaga === false) {
                                    if (b[d] === "*" && b[d - 1] === "/") {
                                        b[d - 1] = "";
                                        flaga    = true;
                                    } else if (flagb === false && b[d] === "f" && d < c - 6 && b[d + 1] === "i" && b[d + 2] === "l" && b[d + 3] === "t" && b[d + 4] === "e" && b[d + 5] === "r" && b[d + 6] === ":") {
                                        flagb = true;
                                    }
                                } else if (flaga === true && b[d] === "*" && d !== c - 1 && b[d + 1] === "/") {
                                    flaga    = false;
                                    b[d]     = "";
                                    b[d + 1] = "";
                                } else if (flagb === true && b[d] === ";") {
                                    flagb = false;
                                    b[d]  = "";
                                }
                                if (flaga === true || flagb === true) {
                                    b[d] = "";
                                }
                            }
                            join = b.join("");
                            if (/^(\s*\{)/.test(a) === true && /(\}\s*)$/.test(a) && a.indexOf(",") !== -1) {
                                clang = "javascript";
                                auto  = "JSON";
                            } else if ((/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i).test(a) === true && ((/(var\s+[a-z]+[a-zA-Z0-9]*)/).test(a) === true || /(\=\s*function)|(\s*function\s+(\w*\s+)?\()/.test(a) === true || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a) === true)) {
                                if (a.indexOf("(") > -1 || a.indexOf("=") > -1 || (a.indexOf(";") > -1 && a.indexOf("{") > -1) || cmode !== "diff") {
                                    clang = "javascript";
                                    auto  = "JavaScript";
                                } else {
                                    clang = "text";
                                    auto  = "Plain Text";
                                }
                            } else if ((/^(\s*[\$\.#@a-z0-9])|^(\s*\/\*)|^(\s*\*\s*\{)/i).test(a) === true && (/^(\s*if\s*\()/).test(a) === false && a.indexOf("{") !== -1 && (/\=\s*(\{|\[|\()/).test(join) === false && ((/(\+|\-|\=|\*|\?)\=/).test(join) === false || ((/\=+('|")?\)/).test(a) === true && (/;\s*base64/).test(a) === true)) && (/function(\s+\w+)*\s*\(/).test(join) === false) {
                                if ((/^(\s*return;?\s*\{)/).test(a) === true && (/(\};?\s*)$/).test(a) === true) {
                                    clang = "javascript";
                                    auto  = "JavaScript";
                                } else {
                                    clang = "css";
                                    auto  = "CSS";
                                }
                            } else if (cmode === "diff") {
                                clang = "text";
                                auto  = "unknown";
                            } else {
                                clang = "javascript";
                                auto  = "JavaScript";
                            }
                        } else if ((/(>[\w\s:]*)?<(\/|\!)?[\w\s:\-\[]+/.test(a) === true && (/^([\s\w]*<)/).test(a) === true && (/(>[\s\w]*)$/).test(a) === true) || (/^(\s*<s((cript)|(tyle)))/i.test(a) === true && /(<\/s((cript)|(tyle))>\s*)$/i.test(a) === true)) {
                            clang = "markup";
                            if (/^(\s*<\?xml)/.test(a) === true) {
                                if (/XHTML\s+1\.1/.test(a) === true || /XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/.test(a) === true) {
                                    auto = "XHTML";
                                } else {
                                    auto = "XML";
                                }
                            } else if (/<[a-zA-Z]/.test(a) === false && /<\![A-Z]/.test(a) === true) {
                                auto = "SGML";
                            } else if (chtml === true || /^(\s*<\!doctype html>)/i.test(a) === true || (/^(\s*<\!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/.test(a) === true && /XHTML\s+1\.1/.test(a) === false && /XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/.test(a) === false)) {
                                chtml = true;
                                auto  = "HTML";
                            } else {
                                auto = "markup";
                            }
                        } else if (cmode === "diff") {
                            clang = "text";
                            auto  = "unknown";
                        } else {
                            clang = "javascript";
                            auto  = "JavaScript";
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
                            source  : csource,
                            level   : 3,
                            type    : "css",
                            alter   : true,
                            fcomment: ctopcoms
                        });
                    } else if (clang === "csv") {
                        apioutput = csvmin(csource, ccsvchar);
                    } else if (clang === "markup") {
                        apioutput = markupmin({
                            source      : csource,
                            comments    : "",
                            presume_html: chtml,
                            top_comments: ctopcoms,
                            conditional : ccond
                        });
                    } else if (clang === "text") {
                        apioutput = csource;
                    } else {
                        apioutput = jsmin({
                            source  : csource,
                            level   : 2,
                            type    : "javascript",
                            alter   : true,
                            fcomment: ctopcoms
                        });
                    }
                    return (function core__minifyReport() {
                        var sizediff = function core__minifyReport_score() {
                                var a                 = 0,
                                    lines             = 0,
                                    source            = csource,
                                    sizeOld           = source.length,
                                    windowsSize       = 0,
                                    sizeNew           = apioutput.length,
                                    sizeDifference    = sizeOld - sizeNew,
                                    windowsDifference = 0,
                                    percentUnix       = ((sizeDifference / sizeOld) * 100).toFixed(2) + "%",
                                    percentWindows    = "",
                                    output            = [];
                                for (a = 0; a < sizeOld; a += 1) {
                                    if (source.charAt(a) === "\n") {
                                        lines += 1;
                                    }
                                }
                                windowsSize       = sizeOld + lines;
                                windowsDifference = windowsSize - sizeNew;
                                percentWindows    = ((windowsDifference / windowsSize) * 100).toFixed(2) + "%";
                                output.push("<div id='doc'><table class='analysis' summary='Minification efficiency report'><caption>Minification efficiency report</caption><thead><tr><th colspan='2'>Output Size</th><th colspan='2'>Number of Lines From Input</th></tr></thead><tbody><tr><td colspan='2'>");
                                output.push(sizeNew);
                                output.push("</td><td colspan='2'>");
                                output.push(lines + 1);
                                output.push("</td></tr><tr><th>Operating System</th><th>Input Size</th><th>Size Difference</th><th>Percentage of Decrease</th></tr><tr><th>Unix/Linux</th><td>");
                                output.push(sizeOld);
                                output.push("</td><td>");
                                output.push(sizeDifference);
                                output.push("</td><td>");
                                output.push(percentUnix);
                                output.push("</td></tr><tr><th>Windows</th><td>");
                                output.push(windowsSize);
                                output.push("</td><td>");
                                output.push(windowsDifference);
                                output.push("</td><td>");
                                output.push(percentWindows);
                                output.push("</td></tr></tbody></table></div>");
                                return output.join("");
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
                        apioutput  = cleanCSS({
                            source   : csource,
                            size     : cinsize,
                            character: cinchar,
                            comment  : ccomm,
                            alter    : true
                        });
                        apidiffout = summary;
                    } else if (clang === "csv") {
                        apioutput  = csvbeauty(csource, ccsvchar);
                        apidiffout = "";
                    } else if (clang === "markup") {
                        apioutput  = markup_beauty({
                            source      : csource,
                            insize      : cinsize,
                            inchar      : cinchar,
                            mode        : "beautify",
                            comments    : ccomm,
                            style       : cstyle,
                            html        : chtml,
                            force_indent: cforce,
                            wrap        : cwrap
                        });
                        apidiffout = summary;
                        if (cinchar !== "\t") {
                            apioutput = apioutput.replace(/\n[\t]* \/>/g, "");
                        }
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = "";
                    } else {
                        apioutput  = jspretty({
                            source  : csource,
                            insize  : cinsize,
                            inchar  : cinchar,
                            preserve: cpreserve,
                            inlevel : cinlevel,
                            space   : cspace,
                            braces  : cindent,
                            comments: ccomm,
                            jsscope : cjsscope,
                            correct : ccorrect
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
                    if (csource === "" || cdiff === "") {
                        return [
                            "", ""
                        ];
                    }
                    if (clang === "css") {
                        if (cdiffcomments === true) {
                            apioutput  = csource;
                            apidiffout = cdiff;
                        } else {
                            apioutput  = jsmin({
                                source  : csource,
                                level   : 3,
                                type    : "css",
                                alter   : false,
                                fcomment: ctopcoms
                            });
                            apidiffout = jsmin({
                                source  : cdiff,
                                level   : 3,
                                type    : "css",
                                alter   : false,
                                fcomment: ctopcoms
                            });
                        }
                        apioutput  = cleanCSS({
                            source   : apioutput,
                            size     : cinsize,
                            character: cinchar,
                            comment  : ccomm,
                            alter    : false
                        });
                        apidiffout = cleanCSS({
                            source   : apidiffout,
                            size     : cinsize,
                            character: cinchar,
                            comment  : ccomm,
                            alter    : false
                        });
                    } else if (clang === "csv") {
                        apioutput  = csvbeauty(csource, ccsvchar);
                        apidiffout = csvbeauty(cdiff, ccsvchar);
                    } else if (clang === "markup") {
                        if (cdiffcomments === true) {
                            apioutput  = markup_beauty({
                                source      : csource,
                                insize      : cinsize,
                                inchar      : cinchar,
                                mode        : "diff",
                                comments    : ccomm,
                                style       : cstyle,
                                html        : chtml,
                                content     : ccontent,
                                force_indent: cforce,
                                conditional : ccond,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                            apidiffout = markup_beauty({
                                source      : cdiff,
                                insize      : cinsize,
                                inchar      : cinchar,
                                mode        : "diff",
                                comments    : ccomm,
                                style       : cstyle,
                                html        : chtml,
                                content     : ccontent,
                                force_indent: cforce,
                                conditional : ccond,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                        } else {
                            apioutput  = markup_beauty({
                                source      : csource,
                                insize      : cinsize,
                                inchar      : cinchar,
                                mode        : "diff",
                                comments    : ccomm,
                                style       : cstyle,
                                html        : chtml,
                                content     : ccontent,
                                force_indent: cforce,
                                conditional : ccond,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                            apidiffout = markup_beauty({
                                source      : cdiff,
                                insize      : cinsize,
                                inchar      : cinchar,
                                mode        : "diff",
                                comments    : ccomm,
                                style       : cstyle,
                                html        : chtml,
                                content     : ccontent,
                                force_indent: cforce,
                                conditional : ccond,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                        }
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = cdiff;
                    } else {
                        if (cdiffcomments === true) {
                            apioutput  = jspretty({
                                source  : csource,
                                insize  : cinsize,
                                inchar  : cinchar,
                                preserve: cpreserve,
                                inlevel : cinlevel,
                                space   : cspace,
                                braces  : cindent,
                                comments: ccomm,
                                jsscope : false,
                                correct : ccorrect
                            });
                            apidiffout = jspretty({
                                source  : cdiff,
                                insize  : cinsize,
                                inchar  : cinchar,
                                preserve: cpreserve,
                                inlevel : cinlevel,
                                space   : cspace,
                                braces  : cindent,
                                comments: ccomm,
                                jsscope : false,
                                correct : ccorrect
                            });
                        } else {
                            apioutput  = jspretty({
                                source  : csource,
                                insize  : cinsize,
                                inchar  : cinchar,
                                preserve: cpreserve,
                                inlevel : cinlevel,
                                space   : cspace,
                                braces  : cindent,
                                comments: "nocomment",
                                jsscope : false,
                                correct : ccorrect
                            });
                            apidiffout = jspretty({
                                source  : cdiff,
                                insize  : cinsize,
                                inchar  : cinchar,
                                preserve: cpreserve,
                                inlevel : cinlevel,
                                space   : cspace,
                                braces  : cindent,
                                comments: "nocomment",
                                jsscope : false,
                                correct : ccorrect
                            });
                        }
                        apioutput  = apioutput.replace(/\n+/g, "\n").replace(/\r+/g, "\r").replace(/(\r\n)+/g, "\r\n").replace(/(\n\r)+/g, "\n\r");
                        apidiffout = apidiffout.replace(/\n+/g, "\n").replace(/\r+/g, "\r").replace(/(\r\n)+/g, "\r\n").replace(/(\n\r)+/g, "\n\r");
                    }
                    if (cquote === true) {
                        apioutput  = apioutput.replace(/'/g, "\"");
                        apidiffout = apidiffout.replace(/'/g, "\"");
                    }
                    if (csemicolon === true) {
                        apioutput  = apioutput.replace(/;\n/g, "\n");
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
                        var a     = [],
                            s     = "s",
                            t     = "s",
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
                                newTextLines : apidiffout,
                                baseTextName : csourcelabel,
                                newTextName  : cdifflabel,
                                contextSize  : ccontext,
                                inline       : cdiffview,
                                tchar        : achar,
                                tsize        : cinsize
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
    edition    = {
        charDecoder  : 131224, //charDecoder library
        cleanCSS     : 131224, //cleanCSS library
        css          : 130924, //diffview.css file
        csvbeauty    : 131224, //csvbeauty library
        csvmin       : 131224, //csvmin library
        diffview     : 130903, //diffview library
        documentation: 130814, //documentation.xhtml
        jsmin        : 131224, //jsmin library (fulljsmin.js)
        jspretty     : 131224, //jspretty library
        markup_beauty: 131210, //markup_beauty library
        markupmin    : 131102, //markupmin library
        prettydiff   : 131224, //this file
        webtool      : 131120, //prettydiff.com.xhtml
        api          : {
            dom        : 131219,
            nodeLocal  : 130924,
            nodeService: 121106, //no longer maintained
            wsh        : 130924
        },
        latest       : 0
    };
edition.latest = (function edition_latest() {
    "use strict";
    return Math.max(edition.charDecoder, edition.cleanCSS, edition.css, edition.csvbeauty, edition.csvmin, edition.diffview, edition.documentation, edition.jsmin, edition.jspretty, edition.markup_beauty, edition.markupmin, edition.prettydiff, edition.webtool, edition.api.dom, edition.api.nodeLocal, edition.api.nodeService, edition.api.wsh);
}());
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api = function commonjs(x) {
        "use strict";
        return prettydiff(x);
    };
} else if (typeof define === "object" || typeof define === "function") {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api = function requirejs_export(x) {
            return prettydiff(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}