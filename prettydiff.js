/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " " */
/*global pd, exports, define */
/*

 Execute in a NodeJS app:
    var prettydiff = require("prettydiff"),
        args       = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output     = prettydiff.api(args);
 
 Execute on command line with NodeJS:
    >node c:\\prettydiff\\api\\node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file" diff:"c:\myotherfile.js"
 
 Execute with WSH:
    >cscript prettydiff.wsf /source:"myFile.xml" /mode:"beautify"
 
 Execute from JavaScript:
    var args   = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output = prettydiff(args);
    
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

 * JSPretty is written by Austin Cheney.  Use of this function requires
 that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as jspretty function
 <http://prettydiff.com/lib/jspretty.js>

 * CSSPretty is written by Austin Cheney.  Use of this function requires
 that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as csspretty function
 <http://prettydiff.com/lib/csspretty.js>

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
 
 * CodeMirror
 Copyright (C) 2013 by Marijn Haverbeke <marijnh@gmail.com> and others
 <http://codemirror.com> - MIT License

 * pd.o object literal is in the api/dom.js file and exists to provide a
 one time and external means of access to the DOM for character entity
 translation.

 -----------------------------------------------------------------------
 * The code mentioned above has significantly expanded documentation in
 each of the respective function's external JS file as linked from the
 documentation page:
 <http://prettydiff.com/documentation.php>

 * The compilation of csspretty, csvbeauty, csvmin, jsdifflib,
 markup_beauty, markupmin, and jspretty in this manner is a result of
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
                    source = source.replace(/\{csv/g, "{prettydiffcsv").replace(/"{2}/g, "{csvquote}");
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
                    return source.replace(/\{prettydiffcsv/g, "{csv");
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
                return source.replace(/\{csvquote\}/g, "\"").replace(/\{prettydiffcsv/g, "{csv");
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
            csspretty     = function csspretty(args) {
                var source   = (typeof args.source !== "string" || args.source === "" || (/^(\s+)$/).test(args.source) === true) ? "Error: no source supplied to csspretty." : args.source,
                    insize   = (isNaN(args.insize) === true) ? 4 : Number(args.insize),
                    inchar   = (typeof args.inchar !== "string" || args.inchar === "") ? " " : args.inchar,
                    mode     = (args.mode !== "diff" && args.mode !== "minify") ? "beautify" : args.mode,
                    topcoms  = (args.topcoms === true || args.topcoms === "true") ? true : false,
                    diffcomm = (args.diffcomm === true || args.diffcomm === "true") ? true : false,
                    token    = [],
                    types    = [],
                    uri      = [],
                    output   = "",
                    stats    = {
                        braces    : 0,
                        colon     : 0,
                        comments  : {
                            chars: 0,
                            count: 0
                        },
                        properties: {
                            chars: 0,
                            count: 0
                        },
                        selectors : {
                            chars: 0,
                            count: 0
                        },
                        semi      : 0,
                        space     : 0,
                        values    : {
                            chars: 0,
                            count: 0
                        },
                        variables : {
                            chars: 0,
                            count: 0
                        }
                    };
                if (source === "Error: no source supplied to csspretty.") {
                    return source;
                }
                (function csspretty__tokenize() {
                    var a          = 0,
                        b          = source.split(""),
                        len        = source.length,
                        ltype      = "",
                        itemsize   = 0,
                        item       = function csspretty__tokenize_item(type) {
                            var aa    = token.length,
                                bb    = 0,
                                coms  = [],
                                value = function csspretty__tokenize_item_value(val) {
                                    var x      = val.split(""),
                                        leng   = x.length,
                                        cc     = 0,
                                        dd     = 0,
                                        items  = [],
                                        block  = "",
                                        values = [];
                                    for (cc = 0; cc < leng; cc += 1) {
                                        items.push(x[cc]);
                                        if (block === "") {
                                            if (x[cc] === "\"") {
                                                block = "\"";
                                                dd    += 1;
                                            } else if (x[cc] === "'") {
                                                block = "'";
                                                dd    += 1;
                                            } else if (x[cc] === "(") {
                                                block = ")";
                                                dd    += 1;
                                            } else if (x[cc] === "[") {
                                                block = "]";
                                                dd    += 1;
                                            }
                                        } else if ((x[cc] === "(" && block === ")") || (x[cc] === "[" && block === "]")) {
                                            dd += 1;
                                        } else if (x[cc] === block) {
                                            dd -= 1;
                                            if (dd === 0) {
                                                block = "";
                                            }
                                        }
                                        if (block === "" && x[cc] === " ") {
                                            items.pop();
                                            values.push(items.join(""));
                                            items = [];
                                        }
                                    }
                                    values.push(items.join(""));
                                    leng = values.length;
                                    for (cc = 0; cc < leng; cc += 1) {
                                        if ((/^(\.\d)/).test(values[cc]) === true) {
                                            values[cc] = "0" + values[cc];
                                        } else if ((/^(0+([a-z]{2,3}|%))$/).test(values[cc]) === true) {
                                            values[cc] = "0";
                                        } else if ((/^(0+)/).test(values[cc]) === true) {
                                            values[cc] = values[cc].replace(/0+/, "0");
                                            if ((/\d/).test(values[cc].charAt(1)) === true) {
                                                values[cc] = values[cc].substr(1);
                                            }
                                        } else if ((/^url\(/).test(values[cc]) === true && values[cc].charAt(values[cc].length - 1) === ")") {
                                            if (values[cc].charAt(4) !== "\"") {
                                                if (values[cc].charAt(4) === "'") {
                                                    values[cc] = values[cc].replace("url('", "url(\"");
                                                } else {
                                                    values[cc] = values[cc].replace("url(", "url(\"");
                                                }
                                            }
                                            if (values[cc].charAt(values[cc].length - 2) !== "\"") {
                                                if (values[cc].charAt(values[cc].length - 2) === "'") {
                                                    values[cc] = values[cc].substr(0, values[cc].length - 2);
                                                } else {
                                                    values[cc] = values[cc].substr(0, values[cc].length - 1);
                                                }
                                                values[cc] = values[cc] + "\")";
                                            }
                                            uri.push(values[cc].substring(5, values[cc].length - 2));
                                        } else if ((/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))$/).test(values[cc]) === true) {
                                            values[cc] = values[cc].toLowerCase();
                                            if (values[cc].length === 7 && values[cc].charAt(1) === values[cc].charAt(2) && values[cc].charAt(3) === values[cc].charAt(4) && values[cc].charAt(5) === values[cc].charAt(6)) {
                                                values[cc] = "#" + values[cc].charAt(1) + values[cc].charAt(3) + values[cc].charAt(5);
                                            }
                                        }
                                    }
                                    return values.join(" ");
                                };
                            if (ltype === "comment" || ltype === "comment-inline") {
                                do {
                                    aa    -= 1;
                                    ltype = types[aa];
                                    coms.push(token[aa]);
                                } while (ltype === "comment" || ltype === "comment-inline");
                            } else {
                                aa -= 1;
                            }
                            if (ltype === "item") {
                                if (type === "start") {
                                    stats.selectors.count += 1;
                                    stats.selectors.chars += itemsize;
                                    types[aa]             = "selector";
                                    token[aa]             = token[aa].replace(/\s*\,\s*/g, ",");
                                } else if (type === "end") {
                                    types[aa] = "value";
                                    if (mode !== "diff") {
                                        token[aa] = value(token[aa]);
                                    }
                                    if (mode === "beautify" || (mode === "diff" && diffcomm === true)) {
                                        if (coms.length > 0 && ltype !== "semi" && ltype !== "end" && ltype !== "start") {
                                            aa = coms.length - 1;
                                            do {
                                                token.pop();
                                                types.pop();
                                                aa -= 1;
                                            } while (aa > 0);
                                            if (mode === "diff") {
                                                token.push("x;");
                                            } else {
                                                token.push(";");
                                            }
                                            types.push("semi");
                                            bb = coms.length - 1;
                                            do {
                                                token.push(coms[aa]);
                                                if (coms[aa].indexOf("//") === 0) {
                                                    types.push("comment-inline");
                                                } else {
                                                    types.push("comment");
                                                }
                                                aa += 1;
                                            } while (aa < bb);
                                        } else {
                                            if (mode === "diff") {
                                                token.push("x;");
                                            } else {
                                                token.push(";");
                                            }
                                            types.push("semi");
                                        }
                                    }
                                    stats.values.count += 1;
                                    stats.values.chars += itemsize;
                                } else if (type === "semi") {
                                    if (types[aa - 1] === "colon") {
                                        stats.values.count += 1;
                                        stats.values.chars += itemsize;
                                        types[aa]          = "value";
                                        if (mode !== "diff") {
                                            token[aa] = value(token[aa]);
                                        }
                                    } else {
                                        types[aa]             = "propvar";
                                        stats.variables.count += 1;
                                        stats.variables.chars += itemsize;
                                    }
                                } else if (type === "colon") {
                                    types[aa]              = "property";
                                    stats.properties.count += 1;
                                    stats.properties.chars += itemsize;
                                }
                            }
                        },
                        comment    = function csspretty__tokenize_comment(inline) {
                            var aa  = 0,
                                out = [b[a]];
                            for (aa = a + 1; aa < len; aa += 1) {
                                out.push(b[aa]);
                                if ((inline === false && b[aa - 1] === "*" && b[aa] === "/") || (inline === true && (b[aa + 1] === "\n"))) {
                                    break;
                                }
                            }
                            a                    = aa;
                            stats.comments.count += 1;
                            stats.comments.chars += out.length;
                            if (mode === "minify") {
                                out.push("\n");
                            }
                            return out.join("");
                        },
                        buildtoken = function csspretty__tokenize_build() {
                            var aa    = 0,
                                bb    = 0,
                                out   = [],
                                block = "";
                            for (aa = a; aa < len; aa += 1) {
                                out.push(b[aa]);
                                if (block === "") {
                                    if (b[aa] === "\"") {
                                        block = "\"";
                                        bb    += 1;
                                    } else if (b[aa] === "'") {
                                        block = "'";
                                        bb    += 1;
                                    } else if (b[aa] === "(") {
                                        block = ")";
                                        bb    += 1;
                                    } else if (b[aa] === "[") {
                                        block = "]";
                                        bb    += 1;
                                    }
                                } else if ((b[aa] === "(" && block === ")") || (b[aa] === "[" && block === "]")) {
                                    bb += 1;
                                } else if (b[aa] === block) {
                                    bb -= 1;
                                    if (bb === 0) {
                                        block = "";
                                    }
                                }
                                if (block === "" && b[aa] !== "\\" && (b[aa + 1] === ";" || b[aa + 1] === ":" || b[aa + 1] === "}" || b[aa + 1] === "{" || (b[aa + 1] === "/" && (b[aa + 2] === "*" || b[aa + 2] === "/")))) {
                                    break;
                                }
                            }
                            a        = aa;
                            itemsize = out.length;
                            return out.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
                        },
                        properties = function csspretty__tokenize_properties() {
                            var aa    = 0,
                                bb    = 1,
                                cc    = 0,
                                dd    = 0,
                                p     = [],
                                set   = [
                                    []
                                ],
                                next  = 0,
                                stoke = [],
                                stype = [];
                            for (aa = token.length - 1; aa > -1; aa -= 1) {
                                if (types[aa] === "start") {
                                    bb -= 1;
                                    if (bb === 0) {
                                        next = aa;
                                        set.pop();
                                        for (aa = set.length - 1; aa > -1; aa -= 1) {
                                            set[aa].reverse();
                                        }
                                        break;
                                    }
                                }
                                if (types[aa] === "end") {
                                    bb += 1;
                                }
                                if (bb === 1 && types[aa] === "property" && mode === "beautify") {
                                    p.push(aa);
                                }
                                set[set.length - 1].push(aa);
                                if (bb === 1 && (types[aa - 1] === "comment" || types[aa - 1] === "comment-inline" || types[aa - 1] === "semi" || types[aa - 1] === "end" || types[aa - 1] === "start") && types[aa] !== "start" && types[aa] !== "end") {
                                    set.push([]);
                                }
                            }
                            //this reverse fixes the order of consecutive comments
                            set.reverse();
                            bb = 0;
                            for (aa = p.length - 1; aa > -1; aa -= 1) {
                                if (token[p[aa]].length > bb) {
                                    bb = token[p[aa]].length;
                                }
                            }
                            for (aa = p.length - 1; aa > -1; aa -= 1) {
                                cc = bb - token[p[aa]].length;
                                if (cc > 0) {
                                    do {
                                        token[p[aa]] = token[p[aa]] + " ";
                                        cc           -= 1;
                                    } while (cc > 0);
                                }
                            }
                            //sort by type
                            set = set.sort(function csspretty__tokenize_properties_sortbytype(a, b) {
                                if (types[a[0]] > types[b[0]]) {
                                    return 1;
                                }
                                return -1;
                            });
                            //sort by name of same type
                            set = set.sort(function csspretty__tokenize_properties_sortbyname(a, b) {
                                if (types[a[0]] === "comment" || types[b[0]] === "comment" || types[a[0]] === "comment-inline" || types[b[0]] === "comment-inline") {
                                    return 0;
                                }
                                if (token[a[0]] > token[b[0]] && types[a[0]] === types[b[0]]) {
                                    return 1;
                                }
                                return -1;
                            });
                            (function csspretty__tokenize_properties_propcheck() {
                                var leng      = set.length - 1,
                                    fourcount = function csspretty__tokenize_properties_propcheck_fourcount(ind, name) {
                                        var test  = [
                                                false, false, false, false
                                            ],
                                            value = [
                                                0, 0, 0, 0
                                            ],
                                            zero  = (/^(0([a-z]+|%))/),
                                            start = -1,
                                            yy    = -1,
                                            xx    = 0,
                                            store = function csspretty__tokenize_properties_propcheck_fourcount_store(side) {
                                                yy          += 1;
                                                value[side] = token[set[xx][2]];
                                                test[side]  = true;
                                                if (start < 0) {
                                                    start = xx;
                                                }
                                            };
                                        for (xx = ind; xx < leng; xx += 1) {
                                            if (token[set[xx][2]] !== undefined && token[set[xx][0]].indexOf(name) === 0) {
                                                if (token[set[xx][0]] === name || token[set[xx][0]].indexOf(name + " ") === 0) {
                                                    yy    += 1;
                                                    value = [
                                                        token[set[xx][2]], token[set[xx][2]], token[set[xx][2]], token[set[xx][2]]
                                                    ];
                                                    test  = [
                                                        true, true, true, true
                                                    ];
                                                    start = xx;
                                                } else if (token[set[xx][0]].indexOf(name + "-bottom") === 0) {
                                                    store(2);
                                                } else if (token[set[xx][0]].indexOf(name + "-left") === 0) {
                                                    store(3);
                                                } else if (token[set[xx][0]].indexOf(name + "-right") === 0) {
                                                    store(1);
                                                } else if (token[set[xx][0]].indexOf(name + "-top") === 0) {
                                                    store(0);
                                                }
                                            }
                                            if (token[set[xx][0]].indexOf(name) !== 0) {
                                                if (test[0] === true && test[1] === true && test[2] === true && test[3] === true) {
                                                    set.splice(start + 1, yy);
                                                    leng -= yy + 1;
                                                    token[set[start][0]] = name;
                                                    if (zero.test(value[0]) === true) {
                                                        value[0] = "0";
                                                    }
                                                    if (zero.test(value[1]) === true) {
                                                        value[1] = "0";
                                                    }
                                                    if (zero.test(value[2]) === true) {
                                                        value[2] = "0";
                                                    }
                                                    if (zero.test(value[3]) === true) {
                                                        value[3] = "0";
                                                    }
                                                    if (value[1] === value[3]) {
                                                        value.splice(3, 1);
                                                    }
                                                    if (value[0] === value[2] && value.length === 3) {
                                                        value.splice(2, 1);
                                                    }
                                                    if (value[0] === value[1] && value.length === 2) {
                                                        value.splice(1, 1);
                                                    }
                                                    token[set[start][2]] = value.join(" ");
                                                    if (mode === "beautify") {
                                                        if (token[set[start][0]].charAt(token[set[start][0]].length - 1) === " ") {
                                                            yy = token[set[start][0]].length - name.length;
                                                            do {
                                                                name = name + " ";
                                                                yy   -= 1;
                                                            } while (yy > 0);
                                                        } else {
                                                            (function () {
                                                                var aaa = 0,
                                                                    bbb = 0,
                                                                    ccc = 0,
                                                                    lenp = p.length;
                                                                for (aaa = 0; aaa < lenp; aaa += 1) {
                                                                    token[p[aaa]] = token[p[aaa]].replace(/(\s+)$/, "");
                                                                    if (token[p[aaa]].indexOf(name + "-") === 0) {
                                                                        p.splice(aaa, 1);
                                                                        lenp -= 1;
                                                                    } else if (token[p[aaa]].replace().length > bbb) {
                                                                        bbb = token[p[aaa]].length;
                                                                    }
                                                                }
                                                                for (aaa = 0; aaa < lenp; aaa += 1) {
                                                                    if (token[p[aaa]].length < bbb) {
                                                                        ccc = bbb - token[p[aaa]].length;
                                                                        do {
                                                                            token[p[aaa]] = token[p[aaa]] + " ";
                                                                            ccc -= 1;
                                                                        } while (ccc > 0);
                                                                    }
                                                                }
                                                            }());
                                                        }
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    };
                                for (aa = 0; aa < leng; aa += 1) {
                                    if (types[set[aa][0]] === "property") {
                                        if (token[set[aa][0]] === token[set[aa + 1][0]]) {
                                            set.splice(aa, 1);
                                            leng -= 1;
                                        }
                                    }
                                }
                                leng = set.length;
                                for (aa = 0; aa < leng; aa += 1) {
                                    if (types[set[aa][0]] === "property") {
                                        if (token[set[aa][0]].indexOf("margin") === 0) {
                                            fourcount(aa, "margin");
                                        }
                                        if (token[set[aa][0]].indexOf("padding") === 0) {
                                            fourcount(aa, "padding");
                                        }
                                    }
                                }
                            }());
                            bb = set.length;
                            for (aa = 0; aa < bb; aa += 1) {
                                dd = set[aa].length;
                                for (cc = 0; cc < dd; cc += 1) {
                                    stoke.push(token[set[aa][cc]]);
                                    stype.push(types[set[aa][cc]]);
                                }
                            }
                            token.splice(next + 1, token.length - next - 1);
                            types.splice(next + 1, types.length - next - 1);
                            token = token.concat(stoke);
                            types = types.concat(stype);
                        };
                    for (a = 0; a < len; a += 1) {
                        if (ltype !== "comment" && ltype !== "comment-inline" && ltype !== "" && topcoms === true) {
                            topcoms = false;
                        }
                        if ((/\s/).test(b[a]) === true) {
                            stats.space += 1;
                        } else if (b[a] === "/" && b[a + 1] === "*") {
                            if (mode === "beautify" || (mode === "diff" && diffcomm === true) || (mode === "minify" && topcoms === true)) {
                                ltype = "comment";
                                types.push("comment");
                                token.push(comment(false));
                            } else {
                                comment(false);
                            }
                        } else if (b[a] === "/" && b[a + 1] === "/") {
                            if (mode === "beautify" || (mode === "diff" && diffcomm === true) || (mode === "minify" && topcoms === true)) {
                                ltype = "comment-inline";
                                types.push("comment-inline");
                                token.push(comment(true));
                            } else {
                                comment(true);
                            }
                        } else if (b[a] === "{") {
                            item("start");
                            ltype = "start";
                            types.push("start");
                            token.push("{");
                            stats.braces += 1;
                        } else if (b[a] === "}") {
                            item("end");
                            if (mode !== "diff") {
                                properties();
                            }
                            ltype = "end";
                            types.push("end");
                            token.push("}");
                            stats.braces += 1;
                        } else if (b[a] === ";") {
                            item("semi");
                            if (types[types.length - 1] !== "semi") {
                                ltype = "semi";
                                types.push("semi");
                                token.push(";");
                            }
                            stats.semi += 1;
                        } else if (b[a] === ":") {
                            item("colon");
                            ltype = "colon";
                            types.push("colon");
                            token.push(":");
                            stats.colon += 1;
                        } else {
                            ltype = "item";
                            types.push("item");
                            token.push(buildtoken());
                        }
                    }
                }());
                if (mode !== "minify") {
                    output = (function csspretty__beautify() {
                        var a        = 0,
                            len      = token.length,
                            build    = [],
                            indent   = 0,
                            tab      = (function csspretty__beautify_tab() {
                                var aa = 0,
                                    bb = [];
                                for (aa = 0; aa < insize; aa += 1) {
                                    bb.push(inchar);
                                }
                                return bb.join("");
                            }()),
                            nl       = function csspretty__beautify_nl(tabs) {
                                var aa = 0;
                                build.push("\n");
                                for (aa = 0; aa < tabs; aa += 1) {
                                    build.push(tab);
                                }
                            },
                            selector = function csspretty__beautify_selector(item) {
                                var aa    = 0,
                                    bb    = 0,
                                    cc    = 0,
                                    block = "",
                                    items = [],
                                    leng  = item.length;
                                for (aa = 0; aa < leng; aa += 1) {
                                    if (block === "") {
                                        if (item.charAt(aa) === "\"") {
                                            block = "\"";
                                            bb    += 1;
                                        } else if (item.charAt(aa) === "'") {
                                            block = "'";
                                            bb    += 1;
                                        } else if (item.charAt(aa) === "(") {
                                            block = ")";
                                            bb    += 1;
                                        } else if (item.charAt(aa) === "[") {
                                            block = "]";
                                            bb    += 1;
                                        }
                                    } else if ((item.charAt(aa) === "(" && block === ")") || (item.charAt(aa) === "[" && block === "]")) {
                                        bb += 1;
                                    } else if (item.charAt(aa) === block) {
                                        bb -= 1;
                                        if (bb === 0) {
                                            block = "";
                                        }
                                    }
                                    if (block === "" && item.charAt(aa) === ",") {
                                        items.push(item.substring(cc, aa + 1));
                                        cc = aa + 1;
                                    }
                                }
                                if (cc > 0) {
                                    items.push(item.substr(cc));
                                }
                                leng = items.length;
                                build.push(items[0].replace(/\,\s*/g, ", ").replace(/(\, )$/, ","));
                                for (aa = 1; aa < leng; aa += 1) {
                                    nl(indent);
                                    build.push(items[aa].replace(/\,\s*/g, ", ").replace(/(\, )$/, ","));
                                }
                                build.push(" ");
                            };
                        for (a = 0; a < len; a += 1) {
                            if (types[a] === "start") {
                                build.push(token[a]);
                                indent += 1;
                                nl(indent);
                            } else if (types[a] === "end") {
                                indent -= 1;
                                nl(indent);
                                build.push(token[a]);
                                if (types[a + 1] !== "end") {
                                    nl(indent);
                                }
                            } else if (types[a] === "semi") {
                                if (token[a] !== "x;") {
                                    build.push(token[a]);
                                }
                                if (types[a + 1] !== "end") {
                                    nl(indent);
                                }
                            } else if (types[a] === "selector" && token[a].indexOf(",") > -1) {
                                selector(token[a]);
                            } else if (types[a] === "selector") {
                                build.push(token[a]);
                                build.push(" ");
                            } else if ((types[a] === "comment" || types[a] === "comment-inline") && types[a - 1] !== "colon" && types[a - 1] !== "property") {
                                build.push(token[a]);
                                if (types[a + 1] !== "end") {
                                    nl(indent);
                                }
                            } else {
                                if (types[a] === "value") {
                                    build.push(" ");
                                }
                                build.push(token[a]);
                            }
                        }
                        return build.join("").replace(/(\s+)$/, "");
                    }());
                } else {
                    output = token.join("").replace(/;\}/g, "}");
                }
                if (mode !== "diff") {
                    summary = (function csspretty__summary() {
                        var summ = [],
                            inl  = source.length,
                            out  = output.length,
                            uris = uri.length,
                            uric = 0,
                            a    = 0,
                            b    = 0;
                        summ.push("<div id='doc' class='css'><p><strong>Number of HTTP requests:</strong> <em>");
                        summ.push(uris);
                        summ.push("</em></p><table class='analysis' id='css-parts' summary='Component counts and sizes'><caption>Component counts and sizes</caption><thead><tr><th>Type Name</th><th>Quantity</th><th>Character Size</th></tr></thead><tbody><tr><th>curly braces</th><td>");
                        summ.push(stats.braces);
                        summ.push("</td><td>");
                        summ.push(stats.braces);
                        summ.push("</td></tr><tr><th>colon</th><td>");
                        summ.push(stats.colon);
                        summ.push("</td><td>");
                        summ.push(stats.colon);
                        summ.push("</td></tr><tr><th>comments</th><td>");
                        summ.push(stats.comments.count);
                        summ.push("</td><td>");
                        summ.push(stats.comments.chars);
                        summ.push("</td></tr><tr><th>properties</th><td>");
                        summ.push(stats.properties.count);
                        summ.push("</td><td>");
                        summ.push(stats.properties.chars);
                        summ.push("</td></tr><tr><th>selectors</th><td>");
                        summ.push(stats.selectors.count);
                        summ.push("</td><td>");
                        summ.push(stats.selectors.chars);
                        summ.push("</td></tr><tr><th>semicolons</th><td>");
                        summ.push(stats.semi);
                        summ.push("</td><td>");
                        summ.push(stats.semi);
                        summ.push("</td></tr><tr><th>white space</th><td>");
                        summ.push(stats.space);
                        summ.push("</td><td>");
                        summ.push(stats.space);
                        summ.push("</td></tr><tr><th>values</th><td>");
                        summ.push(stats.values.count);
                        summ.push("</td><td>");
                        summ.push(stats.values.chars);
                        summ.push("</td></tr><tr><th>variables</th><td>");
                        summ.push(stats.variables.count);
                        summ.push("</td><td>");
                        summ.push(stats.variables.chars);
                        summ.push("</td></tr></tbody></table><table class='analysis' id='css-size' summary='CSS character size change'><caption>CSS character size change</caption><tbody><tr><th>Input</th><td>");
                        summ.push(inl);
                        summ.push("</td></tr><tr><th>Output</th><td>");
                        summ.push(out);
                        summ.push("</td></tr><tr><th>");
                        if (out > inl) {
                            summ.push("Increase</th><td>");
                            summ.push(out - inl);
                            summ.push("</td></tr><tr><th>Percent Change</th><td>");
                            summ.push((((out - inl) / out) * 100).toFixed(2));
                        } else {
                            summ.push("Decrease</th><td>");
                            summ.push(inl - out);
                            summ.push("</td></tr><tr><th>Percent Change</th><td>");
                            summ.push((((inl - out) / inl) * 100).toFixed(2));
                        }
                        summ.push("%</td></tr></tbody></table><table class='analysis' id='css-uri' summary='A list of HTTP requests'><caption>A List of HTTP Requests</caption><thead><tr><th>Quantity</th><th>URI</th></tr></thead><tbody>");
                        for (a = 0; a < uris; a += 1) {
                            uric = 1;
                            for (b = a + 1; b < uris; b += 1) {
                                if (uri[a] === uri[b]) {
                                    uric += 1;
                                    uri.splice(b, 1);
                                    uris -= 1;
                                }
                            }
                            summ.push("<tr><td>");
                            summ.push(uric);
                            summ.push("</td><td>");
                            summ.push(uri[a]);
                            summ.push("</td></tr>");
                        }
                        summ.push("</tbody></table></div>");
                        return summ.join("");
                    }());
                }
                return output;
            },
            jspretty      = function jspretty(args) {
                var source     = (typeof args.source === "string" && args.source.length > 0) ? args.source + " " : "Error: no source code supplied to jspretty!",
                    jbrace     = (args.braces === "allman") ? true : false,
                    jchar      = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                    jcomment   = (args.comments === "noindent") ? "noindent" : (args.comments === "nocomment") ? "nocomment" : "indent",
                    jelseline  = (args.elseline === true || args.elseline === "true") ? true : false,
                    jlevel     = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
                    jmode      = (args.mode !== undefined && args.mode.toLowerCase() === "minify") ? "minify" : "beautify",
                    jobfuscate = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
                    jpres      = (args.preserve === false || args.preserve === "false") ? false : true,
                    jscorrect  = (args.correct === true || args.correct === "true") ? true : false,
                    jsize      = (args.insize > 0) ? args.insize : ((Number(args.insize) > 0) ? Number(args.insize) : 4),
                    jspace     = (args.space === false || args.space === "false") ? false : true,
                    jsscope    = (args.jsscope === true || args.jsscope === "true" || (jmode === "minify" && jobfuscate === true)) ? true : false,
                    jtopcoms   = (args.topcoms === true || args.topcoms === "true") ? true : false,
                    jvarspace  = (args.varspace === false || args.varspace === "false") ? false : true,
                    sourcemap  = [
                        0, ""
                    ],
                    token      = [],
                    types      = [],
                    level      = [],
                    lines      = [],
                    globals    = [],
                    meta       = [],
                    varlist    = [],
                    news       = 0,
                    stats      = {
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
                        server      : {
                            token: 0,
                            chars: 0
                        },
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
                    semi       = 0,
                    result     = "";
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
                        fstart       = false,
                        ltoke        = "",
                        ltype        = "",
                        lengtha      = 0,
                        lengthb      = 0,
                        wordTest     = -1,
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
                            word  : [] //a list from the code sample of the words:  if, else, for, do, while
                        },
                        blockpop     = function jspretty__tokenize_blockpop() {
                            block.bcount.pop();
                            block.brace.pop();
                            block.method.pop();
                            block.pcount.pop();
                            block.prior.pop();
                            block.simple.pop();
                        },
                        commaComment = function jspretty__tokenize_commacomment() {
                            var x = types.length;
                            do {
                                x -= 1;
                            } while (types[x - 1] === "comment" || types[x - 1] === "comment-inline");
                            token.splice(x, 0, ",");
                            types.splice(x, 0, "separator");
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
                        objtest      = function jspretty__tokenize_objtest(ifMethod) {
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
                                    if (ifMethod === true) {
                                        if (types[cc] === "start" && types[cc + 1] === "start" && token[cc + 2] !== "function") {
                                            do {
                                                cc += 1;
                                            } while (types[cc] === "start");
                                        } else if (token[cc] === "{" && token[cc - 1] === ")") {
                                            dd = 1;
                                            for (cc -= 2; cc > -1; cc -= 1) {
                                                if (types[cc] === "end") {
                                                    dd += 1;
                                                }
                                                if (types[cc] === "start" || types[cc] === "method") {
                                                    dd -= 1;
                                                }
                                                if (dd === 0) {
                                                    break;
                                                }
                                            }
                                        }
                                        if (token[cc + 1] !== "function") {
                                            cc -= 1;
                                            if (token[cc + 1] === "function") {
                                                return "start";
                                            }
                                        }
                                        if (types[cc] === "word" && token[cc] !== "function") {
                                            cc -= 1;
                                        }
                                        if (token[cc] === "function" || token[cc - 1] === "function" || token[cc + 1] === "function") {
                                            return "method";
                                        }
                                        return "start";
                                    }
                                    if (token[cc - 1] !== "=" && token[cc - 1] !== "==" && token[cc - 1] !== "===" && (token[cc] === "{" || token[cc] === "x{") && block.method.length > 0 && ((types[cc - 1] === "operator" && token[cc - 1] !== ":") || token[cc - 1] === "{" || token[cc - 1] === "x{" || token[cc - 1] === "[")) {
                                        block.method[block.method.length - 1] -= 1;
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
                        braceFinder  = function jspretty__tokenize_braceFinder() {
                            var elsestart    = function jspretty__tokenize_braceFinder_elsestart() {
                                    var bb       = 0,
                                        r        = 0,
                                        x        = block.word.length - 1,
                                        y        = token.length - 1,
                                        z        = 0,
                                        comments = [],
                                        endtest  = "",
                                        btest    = (block.bcount[block.bcount.length - 1] > 0) ? true : false,
                                        iftest   = (token[token.length - 2] === "x}" && token[token.length - 3] === "x}") ? true : false,
                                        test     = (function jspretty__tokenize_braceFinder_elsestart_test() {
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
                                    if (token[token.length - 2] === "}" || btest === true || block.simple.length === 0) {
                                        blockpop();
                                        block.bcount.push(0);
                                        block.brace.push("else");
                                        block.method.push(0);
                                        block.pcount.push(0);
                                        block.prior.push(false);
                                        block.simple.push(true);
                                        block.flag  = false;
                                        block.count = 0;
                                        block.start = a;
                                        return;
                                    }
                                    types.pop();
                                    token.pop();
                                    if (btest === false && (iftest === false || (iftest === true && (block.word[block.word.length - 1] !== "if" || block.word[block.word.length - 2] !== "if")))) {
                                        block.bcount.push(0);
                                        block.brace.push("else");
                                        block.method.push(0);
                                        block.pcount.push(0);
                                        block.prior.push(false);
                                        block.simple.push(true);
                                        block.flag  = false;
                                        block.count = 0;
                                        block.start = a;
                                    }
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
                                        if (types[types.length - 1] === "comment" || types[types.length - 1] === "comment-inline") {
                                            comments.push([
                                                token[token.length - 1], types[types.length - 1]
                                            ]);
                                            if (lines[lines.length - 1][0] === token.length - 2) {
                                                lines[lines.length - 1][0] -= 3;
                                            }
                                            token.pop();
                                            types.pop();
                                        }
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
                                        block.start = a;
                                    }
                                    if (types[types.length - 1] === "end") {
                                        endtest = token[token.length - 1];
                                        token.pop();
                                        types.pop();
                                    }
                                    for (r = comments.length - 1; r > -1; r -= 1) {
                                        token.push(comments[r][0]);
                                        types.push(comments[r][1]);
                                    }
                                    if (endtest !== "") {
                                        token.push(endtest);
                                        types.push("end");
                                    }
                                    token.push("else");
                                    types.push("word");
                                },
                                whiletest    = function jspretty__tokenize_braceFinder_whiletest() {
                                    var cc = 0,
                                        dd = 1;
                                    for (cc = token.length - 3; cc > -1; cc -= 1) {
                                        if (token[cc] === "}" || token[cc] === "x}") {
                                            dd += 1;
                                        }
                                        if (token[cc] === "{" || token[cc] === "x{") {
                                            dd -= 1;
                                        }
                                        if (dd === 0 && token[cc] === "do") {
                                            block.dotest = true;
                                            token.pop();
                                            types.pop();
                                            do {
                                                dd -= 1;
                                                block.brace.push(-1);
                                                block.simple.push(false);
                                                block.method.push(0);
                                                block.start = a;
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
                                commentcheck = function jspretty__tokenize_braceFinder_commentcheck() {
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
                                lstart       = false;
                            if (lengtha < token.length) {
                                lengtha = token.length - 2;
                                if (types[lengtha] === "comment" || types[lengtha] === "comment-inline") {
                                    do {
                                        lengtha -= 1;
                                    } while (lengtha > -1 && (types[lengtha] === "comment" || types[lengtha] === "comment-inline"));
                                }
                                lasttwo = [
                                    token[lengtha], types[lengtha]
                                ];
                                lengtha = token.length;
                                if (lengtha === 0) {
                                    lengtha = 1;
                                }
                                if (ltoke === "}") {
                                    if (block.bcount.length > 0) {
                                        block.bcount[block.bcount.length - 1] -= 1;
                                    }
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
                                    if (block.bcount.length > 0) {
                                        block.bcount[block.bcount.length - 1] += 1;
                                    }
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
                                    token.push("x{");
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
                                    if (ltoke === "}" && block.prior[block.prior.length - 1] === true && block.prior[block.prior.length - 2] !== false && block.pcount[block.pcount.length - 1] === 0 && block.bcount[block.bcount.length - 1] > -1) {
                                        blockpop();
                                        if (block.simple.length === 0) {
                                            block.start = -1;
                                        }
                                    } else if ((ltoke === "}" && block.prior[block.prior.length - 1] === true && block.prior[block.prior.length - 2] === false) || ((ltoke === ";" || block.bcount[block.bcount.length - 1] < 0) && (block.brace[block.brace.length - 1] === "else" || (block.prior[block.prior.length - 1] === false && block.start > -1)))) {
                                        if ((token[block.start - 1] === "while" && token[block.start] === "(" && lengtha - 1 === block.brace[block.brace.length - 1]) || (block.word[block.word.length - 1] === "while" && lengtha - 2 === block.brace[block.brace.length - 1])) {
                                            blockpop();
                                            if (block.simple.length === 0) {
                                                block.start = -1;
                                            }
                                        } else if (block.bcount[block.bcount.length - 1] < 1) {
                                            //verify else is connected to the
                                            //correct "if" before closing it
                                            do {
                                                if (block.prior[block.prior.length - 1] === false && block.brace[block.brace.length - 1] !== lengtha - 2) {
                                                    if (lstart === false) {
                                                        token.push("x}");
                                                        types.push("end");
                                                    } else {
                                                        fstart = true;
                                                        return;
                                                    }
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
                                            block.start = a;
                                        } else {
                                            if (ltoke === "else") {
                                                return elsestart();
                                            }
                                            block.method.push(0);
                                            block.pcount.push(0);
                                            block.prior.push(false);
                                            block.simple.push(false);
                                            block.flag  = true;
                                            block.start = a;
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
                                        token.push("x{");
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
                                            token.push("x{");
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
                        },
                        asi          = function jspretty__tokenize_asi(z) {
                            var length     = token.length - 1,
                                last       = token[length],
                                nextCharA  = c[z],
                                nextCharB  = c[z + 1],
                                asiTest    = false,
                                syntax     = (/[\(\)\[\]\{\}\=&<>\+\-\*\/\!\?\|\^:%(0-9)\\]/),
                                jj         = 0,
                                kk         = 0,
                                ll         = 0,
                                store      = [],
                                space      = (/\s/),
                                colon      = false,
                                elsetest   = false,
                                earlyflag  = false,
                                futureTest = function (x) {
                                    if (space.test(c[x]) === true) {
                                        do {
                                            x += 1;
                                        } while (x < b && space.test(c[x]) === true);
                                    }
                                    if (c[x] === "/" && c[x + 1] === "/") {
                                        x += 1;
                                        do {
                                            x += 1;
                                        } while (x < b && c[x] !== "\n" && c[x] !== "\r");
                                    }
                                    if (c[x] === "/" && c[x + 1] === "*") {
                                        x += 1;
                                        do {
                                            x += 1;
                                        } while (x < b && c[x - 1] === "*" && c[x] === "/");
                                    }
                                    if (space.test(c[x]) === true || (c[x] === "/" && c[x + 1] === "/") || (c[x] === "/" && c[x + 1] === "*")) {
                                        futureTest(x);
                                    }
                                    if (c[x] === ":" || c[x] === "," || c[x] === "]" || c[x] === ")") {
                                        earlyflag = true;
                                        return;
                                    }
                                    nextCharA = c[x];
                                    nextCharB = c[x + 1];
                                    z         = x;
                                };
                            futureTest(z);
                            if (types[length] === "comment" || types[length] === "comment-inline") {
                                jj = length - 1;
                                if (types[jj] === "comment" || types[jj] === "comment-inline") {
                                    do {
                                        jj -= 1;
                                    } while (types[jj] === "comment" || types[jj] === "comment-inline");
                                }
                                last = token[jj];
                            }
                            if (asiTest === false && (earlyflag === true || last === "else" || last === "var" || last === ";" || last === "x;" || nextCharA === ";" || (last === "}" && nextCharA === "c" && nextCharB === "a" && c[z + 2] === "t" && c[z + 3] === "c" && c[z + 4] === "h") || types[length] === "start" || types[length] === "method" || last === "," || last === ":" || last === "{" || last === "x{" || last === "[" || nextCharB === "]" || last === "." || (last !== ")" && nextCharA !== "}" && c[z] !== "\n" && c[z] !== "\r" && (nextCharB === ";" || nextCharB === "," || nextCharB === "." || nextCharB === "(")) || nextCharB === "+" || nextCharB === "*" || nextCharB === "-" || nextCharB === "%" || nextCharB === "!" || nextCharB === "=" || nextCharB === "^" || nextCharB === "?" || (ltype === "operator" && types[lengtha - 1] !== "word") || ltype === "comment" || (ltype === "comment-inline" && nextCharA === "}") || (nextCharB === "/" && c[z + 2] !== "/" && c[z + 2] !== "*"))) {
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
                            if (asiTest === false && (last === ")" || (last === "}" && token[length - 1] === "{" && token[length - 2] === ")"))) {
                                for (jj = (last === ")") ? length - 1 : length - 3; jj > -1; jj -= 1) {
                                    if (types[jj] === "end") {
                                        kk += 1;
                                    }
                                    if (types[jj] === "start" || types[jj] === "method") {
                                        kk -= 1;
                                    }
                                    if (kk === -1) {
                                        if (token[jj] === "(" && ((token[jj - 1] === "function" && types[jj - 2] !== "operator" && token[jj - 2] !== "(") || token[jj - 1] === "catch" || token[jj - 2] === "function" || token[jj - 1] === "if" || token[jj - 1] === "for" || (token[jj - 1] === "while" && token[jj - 2] !== "}") || token[jj - 1] === "catch" || token[jj - 1] === "switch")) {
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
                                        if (token[jj - 1] === "function" || token[jj] === "else" || token[jj] === "try" || ((token[length - 1] === "{" || token[length - 1] === "x{") && (token[jj - 1] === "if" || token[jj - 1] === "for" || token[jj - 1] === "while" || token[jj - 1] === "catch")) || ((token[jj] === "{" || token[jj] === "x{") && jj < length - 1 && colon === false)) {
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
                                        if (token[jj - 1] === "catch" && token[jj] === "(") {
                                            return;
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
                                        if (((token[jj] === "{" || token[jj] === "x{") && (token[jj - 1] === ")" || token[jj - 1] === "else")) || ((token[length - 1] === "{" || token[length - 1] === "x{") && nextCharA === "}") || token[jj + 1] === "return" || token[jj + 1] === "break" || token[jj + 1] === "continue" || token[jj + 1] === "throw") {
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
                                            if (ll === 0) {
                                                if (token[kk] === "?") {
                                                    asiTest = true;
                                                    break;
                                                }
                                                if (token[kk] === ",") {
                                                    break;
                                                }
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
                                            if (types[jj] === "operator" && token[jj + 1] === "function") {
                                                asiTest = true;
                                                break;
                                            }
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
                                                        break;
                                                    }
                                                    return;
                                                }
                                                asiTest = true;
                                                break;
                                            }
                                        }
                                    }
                                } else if (jj > -1 && token[jj] !== ",") {
                                    asiTest = true;
                                }
                            }
                            if (asiTest === true) {
                                token.push("x;");
                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                    lines[lines.length - 1][0] += 1;
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
                                        token.push("x{");
                                        types.push("start");
                                        token.push(store[0]);
                                        types.push(store[1]);
                                        token.push(ltoke);
                                        types.push(ltype);
                                        lengtha += 1;
                                    }
                                    if (block.bcount[block.bcount.length - 1] < 1) {
                                        jj = block.simple.length;
                                        do {
                                            token.push("x}");
                                            types.push("end");
                                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                                lines[lines.length - 1][0] += 1;
                                            }
                                            blockpop();
                                            lengtha += 1;
                                            jj      -= 1;
                                        } while (jj > 0 && block.prior[block.prior.length - 1] === false && block.prior[block.prior.length - 1] === false && block.bcount[block.bcount.length - 1] < 1);
                                    }
                                    ltoke = "}";
                                    ltype = "end";
                                    if (block.simple.length === 0) {
                                        block.start = -1;
                                    }
                                }
                                braceFinder();
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
                        generic      = function jspretty__tokenize_genericBuilder(start, ending) {
                            var ee       = 0,
                                f        = 0,
                                g        = 0,
                                end      = ending.split(""),
                                endlen   = end.length - 1,
                                jj       = b,
                                exittest = false,
                                build    = [start],
                                rtest    = (end[0] === "\r") ? true : false,
                                base     = a + start.length,
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
                                if (jsscope === true && jmode === "beautify") {
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
                            if (jsscope === true && jmode === "beautify") {
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
                                output = "",
                                square = false;
                            for (ee = a + 1; ee < f; ee += 1) {
                                build.push(c[ee]);
                                if (c[ee - 1] !== "\\" || c[ee - 2] === "\\") {
                                    if (c[ee] === "[") {
                                        square = true;
                                    }
                                    if (c[ee] === "]") {
                                        square = false;
                                    }
                                }
                                if (c[ee] === "/" && square === false) {
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
                            if (jsscope === true && jmode === "beautify") {
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
                            var f      = wordTest,
                                g      = 1,
                                build  = [],
                                output = "";
                            do {
                                build.push(c[f]);
                                f += 1;
                            } while (f < a);
                            output   = build.join("");
                            wordTest = -1;
                            if (types.length > 1 && output === "function" && types[types.length - 1] === "method" && (token[token.length - 2] === "{" || token[token.length - 2] === "x{")) {
                                types[types.length - 1] = "start";
                            }
                            if (types.length > 2 && output === "function" && ltype === "method" && (token[token.length - 2] === "}" || token[token.length - 2] === "x}")) {
                                if (token[token.length - 2] === "}") {
                                    for (f = token.length - 3; f > -1; f -= 1) {
                                        if (types[f] === "end") {
                                            g += 1;
                                        } else if (types[f] === "start" || types[f] === "end") {
                                            g -= 1;
                                        }
                                        if (g === 0) {
                                            break;
                                        }
                                    }
                                    if (token[f] === "{" && token[f - 1] === ")") {
                                        g = 1;
                                        for (f -= 2; f > -1; f -= 1) {
                                            if (types[f] === "end") {
                                                g += 1;
                                            } else if (types[f] === "start" || types[f] === "end") {
                                                g -= 1;
                                            }
                                            if (g === 0) {
                                                break;
                                            }
                                        }
                                        if (token[f - 1] !== "function" && token[f - 2] !== "function") {
                                            types[types.length - 1] = "start";
                                        }
                                    }
                                } else {
                                    types[types.length - 1] = "start";
                                }
                            }
                            if (output === "function" && block.start > -1) {
                                if (types[lengtha - 1] === "method" || token[lengtha - 1] === "=") {
                                    block.method[block.method.length - 1] += 1;
                                }
                                if (token[lengtha - 1] === ",") {
                                    methodtest();
                                }
                            }
                            if (jscorrect === true && (output === "Object" || output === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && token[lengtha - 2] === "=" && token[lengtha - 1] === "new") {
                                if (output === "Object") {
                                    token[lengtha - 1] = "{";
                                    token.push("}");
                                } else {
                                    token[lengtha - 1] = "[";
                                    token.push("]");
                                }
                                types[lengtha - 1] = "start";
                                types.push("end");
                                c[a + 1]        = "";
                                c[a + 2]        = "";
                                stats.container += 2;
                                a               += 2;
                            } else {
                                token.push(output);
                                types.push("word");
                                ltoke            = output;
                                ltype            = "word";
                                stats.word.token += 1;
                                stats.word.chars += output.length;
                            }
                            braceFinder();
                        };
                    for (a = 0; a < b; a += 1) {
                        lengtha = token.length;
                        if ((/\s/).test(c[a])) {
                            if (wordTest > -1) {
                                word();
                            }
                            space();
                        } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke              = generic("<?php", "?>");
                            ltype              = "literal";
                            stats.server.token += 1;
                            stats.server.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "<" && c[a + 1] === "%") {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke              = generic("<%", "%>");
                            ltype              = "literal";
                            stats.server.token += 1;
                            stats.server.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke              = generic("<!--#", "--" + ">");
                            ltype              = "literal";
                            stats.server.token += 1;
                            stats.server.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                        } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke                    = generic("/*", "*\/");
                            stats.commentBlock.token += 1;
                            stats.commentBlock.chars += ltoke.length;
                            if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                                sourcemap[0] = token.length;
                                sourcemap[1] = ltoke;
                            }
                            if (jcomment !== "nocomment") {
                                ltype = "comment";
                                token.push(ltoke);
                                types.push(ltype);
                            }
                        } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                            if (wordTest > -1) {
                                word();
                            }
                            if (jcomment !== "nocomment") {
                                ltype = comtest();
                            }
                            ltoke                   = generic("//", "\r");
                            stats.commentLine.token += 1;
                            stats.commentLine.chars += ltoke.length;
                            if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                                sourcemap[0] = token.length;
                                sourcemap[1] = ltoke;
                            }
                            if (jcomment !== "nocomment") {
                                token.push(ltoke);
                                types.push(ltype);
                            }
                        } else if (c[a] === "/" && wordTest === -1 && (lengtha > 0 && (types[lengtha - 1] !== "word" || ltoke === "typeof" || ltoke === "return") && ltype !== "literal" && ltype !== "end")) {
                            ltoke             = regex();
                            ltype             = "regex";
                            stats.regex.token += 1;
                            stats.regex.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (c[a] === "\"") {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke              = generic("\"", "\"");
                            ltype              = "literal";
                            stats.string.token += 1;
                            stats.string.chars += ltoke.length - 2;
                            stats.string.quote += 2;
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (c[a] === "'") {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke              = generic("'", "'");
                            ltype              = "literal";
                            stats.string.token += 1;
                            stats.string.chars += ltoke.length - 2;
                            stats.string.quote += 2;
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "literal" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "literal")) {
                            if (wordTest > -1) {
                                word();
                            }
                            stats.operator.token += 1;
                            stats.operator.chars += 1;
                            ltoke                = "-";
                            ltype                = "operator";
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (wordTest === -1 && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                            if (wordTest > -1) {
                                word();
                            }
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
                            braceFinder();
                        } else if (c[a] === ",") {
                            if (wordTest > -1) {
                                word();
                            }
                            stats.comma += 1;
                            if (ltype === "comment" || ltype === "comment-inline") {
                                commaComment();
                            } else {
                                ltoke = ",";
                                ltype = "separator";
                                token.push(ltoke);
                                types.push(ltype);
                            }
                            braceFinder();
                        } else if (c[a] === ".") {
                            if (wordTest > -1) {
                                word();
                            }
                            stats.operator.token += 1;
                            stats.operator.chars += 1;
                            if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === lengtha - 1) {
                                lines.pop();
                            }
                            ltoke = ".";
                            ltype = "separator";
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (c[a] === ";") {
                            if (wordTest > -1) {
                                word();
                            }
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
                            braceFinder();
                        } else if (c[a] === "(") {
                            if (wordTest > -1) {
                                word();
                            }
                            stats.container += 1;
                            if (ltype === "comment" || ltype === "comment-inline" || ltype === "start") {
                                ltype = "start";
                            } else if (lengtha > 2 && token[lengtha - 2] === "function") {
                                ltype = "method";
                            } else if (lengtha === 0 || ltoke === "return" || ltoke === "function" || ltoke === "for" || ltoke === "if" || ltoke === "while" || ltoke === "switch" || ltoke === "catch" || ltype === "separator" || ltype === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
                                ltype = "start";
                            } else if (ltype === "end") {
                                ltype = objtest(true);
                            } else {
                                ltype = "method";
                            }
                            ltoke = "(";
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (c[a] === "[") {
                            if (wordTest > -1) {
                                word();
                            }
                            stats.container += 1;
                            ltoke           = "[";
                            ltype           = "start";
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (c[a] === "{") {
                            if (wordTest > -1) {
                                word();
                            }
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
                            braceFinder();
                        } else if (c[a] === ")") {
                            if (wordTest > -1) {
                                word();
                            }
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
                            braceFinder();
                        } else if (c[a] === "]") {
                            if (wordTest > -1) {
                                word();
                            }
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
                            braceFinder();
                        } else if (c[a] === "}") {
                            if (wordTest > -1) {
                                word();
                            }
                            if (ltoke !== ";" && lengthb < token.length) {
                                asi(a);
                                lengthb = token.length;
                            }
                            if (ltoke === ";" && jmode === "minify" && jobfuscate === true) {
                                token[token.length - 1] = "x;";
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
                            if (fstart === true) {
                                fstart = false;
                                token.push("x}");
                                types.push("end");
                            }
                            braceFinder();
                        } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%") {
                            if (wordTest > -1) {
                                word();
                            }
                            ltoke                = operator();
                            ltype                = "operator";
                            stats.operator.token += 1;
                            stats.operator.chars += ltoke.length;
                            token.push(ltoke);
                            types.push(ltype);
                            braceFinder();
                        } else if (wordTest < 0 && c[a] !== "") {
                            wordTest = a;
                        }
                    }
                    lines.push([
                        token.length, false
                    ]);
                    asi(a);
                    if (sourcemap[0] === token.length - 1) {
                        token.push("\n" + sourcemap[1]);
                        types.push("literal");
                    }
                }());

                if (jmode === "beautify" || (jmode === "minify" && jobfuscate === true)) {
                    //this function is the pretty-print and var finding algorithm
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
                            functest   = function () {
                                var aa   = 0,
                                    bb   = 1,
                                    curl = (token[a - 1] === "}") ? true : false;
                                for (aa = a - 2; aa > -1; aa -= 1) {
                                    if (curl === true) {
                                        if (token[aa] === "}") {
                                            bb += 1;
                                        }
                                        if (token[aa] === "{") {
                                            bb -= 1;
                                        }
                                    } else {
                                        if (token[aa] === ")") {
                                            bb += 1;
                                        }
                                        if (token[aa] === "(") {
                                            bb -= 1;
                                        }
                                    }
                                    if (bb < 0) {
                                        level[a - 1] = indent;
                                        return false;
                                    }
                                    if (bb === 0) {
                                        if (token[aa - 1] === ")" && curl === false) {
                                            bb = 1;
                                            for (aa -= 2; aa > -1; aa -= 1) {
                                                if (token[aa] === ")") {
                                                    bb += 1;
                                                }
                                                if (token[aa] === "(") {
                                                    bb -= 1;
                                                }
                                                if (bb === 0) {
                                                    if (token[aa - 1] === "function" || token[aa - 2] === "function") {
                                                        return true;
                                                    }
                                                    return false;
                                                }
                                            }
                                            return false;
                                        }
                                        if (curl === false && token[aa + 1] === "function") {
                                            return true;
                                        }
                                        return false;
                                    }
                                }
                                return false;
                            },
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
                                    if (ltoke === "}" || ltoke === ")") {
                                        if (functest() === true) {
                                            level[a - 1] = "x";
                                        } else {
                                            level[a - 1] = indent;
                                        }
                                    }
                                    if (ltoke === "}" || ltoke === "x}") {
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
                                    if (token[a - 2] === "x}") {
                                        level[a - 3] = indent + 1;
                                    }
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
                                    if (ctoke === "}" && ltoke === "x}" && token[a + 1] === "else") {
                                        level[a - 2] = indent + 2;
                                    }
                                    level[a - 1] = indent;
                                    level.push("x");
                                } else {
                                    level.push("x");
                                }
                                if (ctoke === "x}" && types[a + 1] !== "word" && a < b - 1 && types[a + 1] !== "end" && (ltoke === ";" || ltoke === "x;")) {
                                    level[a - 1] = "x";
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
                                } else if (ctoke === "in" || (((ctoke === "else" && jelseline === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
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
                }

                if (jscorrect === true) {
                    (function () {
                        var a = 0,
                            b = token.length;
                        for (a = 0; a < b; a += 1) {
                            if (token[a] === "x;") {
                                token[a] = ";";
                            }
                            if (token[a] === "x{") {
                                token[a] = "{";
                            }
                            if (token[a] === "x}") {
                                token[a] = "}";
                            }
                        }
                    }());
                }
                if (jmode === "minify") {
                    result = (function jspretty__minify() {
                        var a        = 0,
                            length   = token.length,
                            comtest  = (jtopcoms === false) ? true : false,
                            build    = [],
                            letter   = [65],
                            gg       = 0,
                            minmeta  = [],
                            findvars = function jspretty__minify_findvars(x) {
                                var metax    = meta[x],
                                    metameta = meta[metax],
                                    mini     = minmeta[meta[x]],
                                    ee       = 0,
                                    ff       = 0,
                                    hh       = metameta.length;
                                if (hh > 0) {
                                    for (ee = metax - 1; ee > a; ee -= 1) {
                                        if (types[ee] === "word") {
                                            for (ff = 0; ff < hh; ff += 1) {
                                                if (token[ee] === metameta[ff] && token[ee - 1] !== ".") {
                                                    if (token[ee - 1] === "function" && token[ee + 1] === "(") {
                                                        token[ee] = mini[ff];
                                                    } else if (token[ee - 1] === "case" || token[ee + 1] !== ":" || (token[ee + 1] === ":" && level[ee] !== "x")) {
                                                        token[ee] = mini[ff];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            rename   = function (x) {
                                var b        = 0,
                                    len      = x.length,
                                    array    = [],
                                    inc      = function jspretty__minify_findvars_inc() {
                                        letter[letter.length - 1] += 1;
                                        if (letter[letter.length - 1] === 91) {
                                            letter[letter.length - 1] = 97;
                                        }
                                        if (letter[0] === 123) {
                                            for (gg = letter.length - 1; gg > -1; gg -= 1) {
                                                letter[gg] = 65;
                                            }
                                            letter.push(65);
                                        } else if (letter[letter.length - 1] === 123) {
                                            gg         = letter.length - 1;
                                            letter[gg] = 65;
                                            do {
                                                gg         -= 1;
                                                letter[gg] += 1;
                                                if (letter[gg] === 91) {
                                                    letter[gg] = 97;
                                                }
                                                if (letter[gg] === 123) {
                                                    letter[gg] = 65;
                                                }
                                            } while (letter[gg] === 65 && gg > 1);
                                        }
                                    },
                                    toLetter = function jspretty__minify_findvars_toLetter() {
                                        var ii  = letter.length - 1,
                                            out = [];
                                        for (ii; ii > -1; ii -= 1) {
                                            out.push(String.fromCharCode(letter[ii]));
                                        }
                                        return "a" + out.join("");
                                    };
                                for (b = 0; b < len; b += 1) {
                                    array.push(toLetter());
                                    inc();
                                }
                                minmeta.push(array);
                            };
                        if (jobfuscate === true) {
                            for (a = 0; a < token.length; a += 1) {
                                if (typeof meta[a] === "number" || typeof meta[a] === "string") {
                                    minmeta.push(meta[a]);
                                } else {
                                    rename(meta[a]);
                                }
                            }
                            for (a = token.length - 1; a > -1; a -= 1) {
                                if (typeof meta[a] === "number") {
                                    findvars(a);
                                }
                            }
                        }
                        for (a = 0; a < length; a += 1) {
                            if (types[a] !== "comment") {
                                comtest = true;
                            }
                            if (types[a] === "word" && (types[a + 1] === "word" || types[a + 1] === "literal" || token[a + 1] === "x{" || types[a + 1] === "comment" || types[a + 1] === "comment-inline")) {
                                build.push(token[a]);
                                build.push(" ");
                            } else if (types[a] === "comment" && comtest === false) {
                                build.push(token[a]);
                                build.push("\n");
                            } else if (token[a] === "x;" && token[a + 1] !== "}") {
                                build.push(";");
                            } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && types[a] !== "comment" && types[a] !== "comment-inline") {
                                build.push(token[a]);
                            }
                        }
                        return build.join("");
                    }());
                } else {
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
                                    data[datalen]     = "<li class=\"fold\" title=\"folds from line " + start + " to line xxx\">";
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
                                                        } else if (token[ee - 1] === "case" || token[ee + 1] !== ":" || (token[ee + 1] === ":" && level[ee] !== "x")) {
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
                                    if (token[a] !== "x}" || (token[a] === "x}" && token[a + 1] !== "}")) {
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
                                    } else {
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
                                },
                                rl         = function jspretty__resultScope_rl(x) {
                                    var bb = token.length,
                                        cc = 2,
                                        dd = 0;
                                    for (dd = a + 2; dd < bb; dd += 1) {
                                        if (token[dd] === "x}") {
                                            cc += 1;
                                        } else {
                                            break;
                                        }
                                    }
                                    nl(x - cc);
                                    a += 1;
                                };
                            if (jvarspace === true) {
                                (function jspretty__resultScope_varSpaces() {
                                    var aa          = 0,
                                        lastListLen = 0,
                                        cc          = 0,
                                        longest     = 0,
                                        longTest    = 0,
                                        tokenInList = "",
                                        longList    = [],
                                        joins       = function jspretty__resultScope_varSpaces_joins(x) {
                                            var xlen    = token[x].length,
                                                endTest = false,
                                                mixTest = false,
                                                perTest = false,
                                                period  = function jspretty__resultScope_varSpaces_joins_periodInit() {
                                                    return;
                                                },
                                                ending  = function jspretty__resultScope_varSpaces_joins_endingInit() {
                                                    return;
                                                };
                                            period = function jspretty__resultScope_varSpaces_joins_period() {
                                                perTest = true;
                                                do {
                                                    x    -= 2;
                                                    xlen += token[x].length + 1;
                                                } while (x > 1 && token[x - 1] === ".");
                                                if (token[x] === ")" || token[x] === "]") {
                                                    x       += 1;
                                                    xlen    -= 1;
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
                                                    if (types[x] === "operator" || types[x] === "separator") {
                                                        if (level[x] === "s") {
                                                            xlen += 1;
                                                        }
                                                        if (level[x - 1] === "s") {
                                                            xlen += 1;
                                                        }
                                                    }
                                                    if (token[x] === ";" || token[x] === "x;" || token[x] === "}" || token[x] === "x}") {
                                                        return;
                                                    }
                                                }
                                                if (types[x - 1] === "word" || types[x - 1] === "literal") {
                                                    x    -= 1;
                                                    xlen += token[x].length;
                                                }
                                                if (types[x] === "word" && token[x - 1] === ".") {
                                                    period();
                                                }
                                                if (token[x] === "{") {
                                                    return;
                                                }
                                                if (token[x - 1] === ")" || token[x - 1] === "]") {
                                                    xlen -= 1;
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
                            }
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
                                } else if (meta[a] !== undefined && typeof meta[a] !== "string" && typeof meta[a] !== "number" && a > 0 && token[a] !== "x;" && token[a] !== "x}" && token[a] !== "x{") {
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
                                if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || (lines[linesinc] !== undefined && lines[linesinc - 1][1] === true))) {
                                    folder();
                                    comfold = a;
                                }
                                if (comfold > -1 && types[a] !== "comment") {
                                    foldclose();
                                    comfold = -1;
                                }
                                if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                                    build.push(blockline(token[a]));
                                } else if (token[a] !== "x;" && token[a] !== "x}" && token[a] !== "x{") {
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
                                            build.push(token[a]);
                                            nl(indent);
                                            build.push(tab);
                                        } else {
                                            build.push(token[a]);
                                        }
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
                                if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && ((/<em class='s\d+'>\}<\/em>/).test(token[a + 2]) === true || token[a + 2] === "x}")) {
                                    rl(indent);
                                } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                                    build.push("");
                                } else if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                                    nl(jlevel);
                                } else if (level[a] === "s" && token[a] !== "x}") {
                                    build.push(" ");
                                } else if (level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || (linesinc > 0 && lines[linesinc - 1][1] === true && lines[linesinc - 1][0] === a))) {
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
                            last = build.join("");
                            if (last.match(/<li/g) !== null) {
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
                            var a       = 0,
                                b       = token.length,
                                build   = [],
                                lineinc = 0,
                                indent  = jlevel,
                                tab     = (function jspretty__result_tab() {
                                    var aa = jchar,
                                        bb = jsize,
                                        cc = [];
                                    for (bb; bb > 0; bb -= 1) {
                                        cc.push(aa);
                                    }
                                    return cc.join("");
                                }()),
                                nl      = function jspretty__result_nl(x) {
                                    var dd = 0;
                                    build.push("\n");
                                    for (dd; dd < x; dd += 1) {
                                        build.push(tab);
                                    }
                                },
                                rl      = function jspretty__result_rl(x) {
                                    var bb = token.length,
                                        cc = 2,
                                        dd = 0;
                                    for (dd = a + 2; dd < bb; dd += 1) {
                                        if (token[dd] === "x}") {
                                            cc += 1;
                                        } else {
                                            break;
                                        }
                                    }
                                    nl(x - cc);
                                    a += 1;
                                };
                            if (jvarspace === true) {
                                (function jspretty__result_varSpaces() {
                                    var aa          = 0,
                                        varListLen  = 0,
                                        cc          = 0,
                                        longest     = 0,
                                        longTest    = 0,
                                        tokenInList = "",
                                        longList    = [],
                                        joins       = function jspretty__result_varSpaces_joins(x) {
                                            var xlen    = token[x].length,
                                                endTest = false,
                                                mixTest = false,
                                                perTest = false,
                                                period  = function jspretty__result_varSpaces_joins_periodInit() {
                                                    return;
                                                },
                                                ending  = function jspretty__result_varSpaces_joins_endingInit() {
                                                    return;
                                                };
                                            period = function jspretty__result_varSpaces_joins_period() {
                                                perTest = true;
                                                do {
                                                    x    -= 2;
                                                    xlen += token[x].length + 1;
                                                } while (x > 1 && token[x - 1] === ".");
                                                if (token[x] === ")" || token[x] === "]") {
                                                    x       += 1;
                                                    xlen    -= 1;
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
                                                    if (types[x] === "operator" || types[x] === "separator") {
                                                        if (level[x] === "s") {
                                                            xlen += 1;
                                                        }
                                                        if (level[x - 1] === "s") {
                                                            xlen += 1;
                                                        }
                                                    }
                                                    if (token[x] === ";" || token[x] === "x;" || token[x] === "}" || token[x] === "x}") {
                                                        return;
                                                    }
                                                }
                                                if (types[x - 1] === "word" || types[x - 1] === "literal") {
                                                    x    -= 1;
                                                    xlen += token[x].length;
                                                }
                                                if (types[x] === "word" && token[x - 1] === ".") {
                                                    period();
                                                }
                                                if (token[x] === "{") {
                                                    return;
                                                }
                                                if (token[x - 1] === ")" || token[x - 1] === "]") {
                                                    xlen -= 1;
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
                            }
                            for (a = 0; a < indent; a += 1) {
                                build.push(tab);
                            }
                            for (a = 0; a < b; a += 1) {
                                if (types[a] === "comment" || (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}")) {
                                    build.push(token[a]);
                                    if (token[a].indexOf("//") === 0 && types[a + 1] === "operator") {
                                        nl(indent);
                                        build.push(tab);
                                    }
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
                                if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && (token[a + 2] === "}" || token[a + 2] === "x}")) {
                                    rl(indent);
                                } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                                    build.push("");
                                } else if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                                    nl(jlevel);
                                } else if (level[a] === "s" && token[a] !== "x}") {
                                    build.push(" ");
                                } else if (level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || (lineinc > 0 && lines[lineinc - 1][1] === true && lines[lineinc - 1][0] === a))) {
                                    indent = level[a];
                                    nl(indent);
                                }
                                if (lines[lineinc] !== undefined && lines[lineinc][0] < a) {
                                    lineinc += 1;
                                }
                            }
                            return build.join("").replace(/(\s+)$/, "");
                        }());
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
                            total.token        = stats.server.token + stats.word.token + total.comment.token + total.literal.token + total.space + total.syntax.token;
                            total.chars        = stats.server.chars + stats.word.chars + total.comment.chars + total.literal.chars + total.space + total.syntax.chars;
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
                            output.push("<tr><th colspan='7'>Keywords and Variables</th></tr><tr><th>Words</th><td>");
                            output.push(stats.word.token);
                            output.push("</td><td>100.00%</td><td>");
                            output.push(zero(stats.word.token, total.token));
                            output.push("</td><td>");
                            output.push(stats.word.chars);
                            output.push("</td><td>100.00%</td><td>");
                            output.push(zero(stats.word.chars, total.chars));
                            output.push("</td></tr>");
                            output.push("<tr><th colspan='7'>Server-side Tags</th></tr><tr><th>Server Tags</th><td>");
                            output.push(stats.server.token);
                            output.push("</td><td>100.00%</td><td>");
                            output.push(zero(stats.server.token, total.token));
                            output.push("</td><td>");
                            output.push(stats.server.chars);
                            output.push("</td><td>100.00%</td><td>");
                            output.push(zero(stats.server.chars, total.chars));
                            output.push("</td></tr></tbody></table></div>");
                            summary = output.join("");
                        }());
                    }
                }
                return result;
            },
            markupmin     = function markupmin(args) {
                var i             = 0,
                    x             = (typeof args.source === "string") ? args.source.split("") : "Error: no content supplied to markup.",
                    comments      = (args.comments !== "comments" && args.comments !== "beautify" && args.comments !== "diff") ? "" : args.comments,
                    presume_html  = (args.presume_html === true || args.presume_html === "true") ? true : false,
                    top_comments  = (args.top_comments === true || args.top_comments === "true") ? true : false,
                    conditional   = (args.conditional === true || args.conditional === "true") ? true : false,
                    correct       = (args.correct === true || args.correct === "true") ? true : false,
                    obfuscate     = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
                    markupspace   = function markupmin__markupspace() {
                        var a     = 0,
                            store = [],
                            end   = x.length;
                        for (a = i; a < end; a += 1) {
                            if (x[a] === ">") {
                                break;
                            }
                            store.push(x[a]);
                            x[a] = "";
                        }
                        i    = a;
                        x[i] = store.join("").replace(/\s+/g, " ").replace(/\s*,\s+/g, ", ").replace(/\s*\/(\s*)/g, "/").replace(/\s+\="/g, "=\"").replace(/\s+\='/g, "='") + ">";
                    },
                    markupcomment = function markupmin__markupcomment(ending) {
                        var a     = 0,
                            store = [],
                            end   = x.length;
                        for (a = i; a < end; a += 1) {
                            if ((a < end - 8 && x[a] + x[a + 1] + x[a + 2] + x[a + 3] + x[a + 4] + x[a + 5] + x[a + 6] + x[a + 7] + x[a + 8] + x[a + 9] + x[a + 10] + x[a + 11] === ending) || (a < end - 4 && x[a] + x[a + 1] + x[a + 2] + x[a + 3] === ending) || (a < end - 3 && x[a] + x[a + 1] + x[a + 2] === ending)) {
                                x[a]     = "";
                                x[a + 1] = "";
                                x[a + 2] = "";
                                if (ending.length > 3) {
                                    x[a + 3] = "";
                                    if (ending.length === 12) {
                                        x[a + 4]  = "";
                                        x[a + 5]  = "";
                                        x[a + 6]  = "";
                                        x[a + 7]  = "";
                                        x[a + 8]  = "";
                                        x[a + 9]  = "";
                                        x[a + 10] = "";
                                        x[a + 11] = "";
                                        i         = a + 11;
                                    } else {
                                        i = a + 3;
                                    }
                                } else {
                                    i = a + 2;
                                }
                                break;
                            }
                            if ((conditional === true && ending.length === 12) || comments === "beautify" || comments === "comments") {
                                store.push(x[a]);
                            }
                            x[a] = "";
                        }
                        if ((conditional === true && ending.length === 12) || comments === "comments" || comments === "beautify") {
                            x[i] = store.join("");
                            if (x[i].indexOf(ending) !== x[i].length - ending.length) {
                                x[i] = x[i] + ending;
                            }
                        }
                        i += 1;
                        if ((/\s/).test(x[i]) === true) {
                            x[i] = " ";
                        }
                        if (i < end - 1 && (/\s/).test(x[i + 1]) === true) {
                            do {
                                i    += 1;
                                x[i] = "";
                            } while ((/\s/).test(x[i]) === true);
                        }
                    },
                    markupscript  = function markupmin__markupscript(type) {
                        var a           = 0,
                            store       = [],
                            endIndex    = 0,
                            script      = "",
                            endTag      = "",
                            endTagBuild = "</" + type,
                            stoken      = "",
                            end         = x.length,
                            cdataStart  = (/^(\s*\/+<!\[+[A-Z]+\[+)/),
                            cdataEnd    = (/(\/+\]+>\s*)$/),
                            scriptStart = (/^(\s*<\!\-\-)/),
                            scriptEnd   = (/(\/+\-\->\s*)$/),
                            cdataS      = "",
                            cdataE      = "",
                            source      = args.source;
                        for (a = i; a < end; a += 1) {
                            if ((source.slice(a, a + endTagBuild.length)).toLowerCase() === endTagBuild) {
                                endIndex = a;
                                break;
                            }
                        }
                        for (a = i; a < endIndex; a += 1) {
                            if (x[a - 1] !== ">") {
                                store.push(x[a]);
                                x[a] = "";
                            } else {
                                break;
                            }
                        }
                        stoken = store[0];
                        store.splice(0, 1);
                        if ((/\s/).test(store[0])) {
                            store.splice(0, 1);
                        }
                        for (endIndex; endIndex < end; endIndex += 1) {
                            if (x[endIndex] !== ">") {
                                endTag      = endTag + x[endIndex];
                                x[endIndex] = "";
                            } else {
                                break;
                            }
                        }
                        endTag = endTag + ">";
                        i      = endIndex;
                        if (store.join("") === "") {
                            x[i] = stoken + endTag;
                            return;
                        }
                        script = store.join("");
                        if (comments !== "beautify") {
                            if (cdataStart.test(script) === true) {
                                cdataS = script.match(cdataStart)[0];
                                script = script.replace(cdataStart, "");
                            } else if (scriptStart.test(script)) {
                                cdataS = script.match(scriptStart)[0];
                                script = script.replace(scriptStart, "");
                            }
                            if (cdataEnd.test(script) === true) {
                                cdataE = script.match(cdataEnd)[0];
                                script = script.replace(cdataEnd, "");
                            } else if (scriptEnd.test(script)) {
                                cdataE = script.match(scriptEnd)[0];
                                script = script.replace(scriptEnd, "");
                            }
                            if (store[store.length - 1] !== ">" || (type === "script" && store[store.length - 3] === "]" && store[store.length - 2] === "]" && store[store.length - 1] === ">")) {
                                if (type === "style") {
                                    if (typeof csspretty !== "function") {
                                        return;
                                    }
                                    script = cdataS + csspretty({
                                        mode   : "minify",
                                        source : script,
                                        topcoms: top_comments
                                    }) + cdataE;
                                } else {
                                    if (typeof jspretty !== "function") {
                                        return;
                                    }
                                    script = cdataS + jspretty({
                                        source   : script,
                                        correct  : correct,
                                        mode     : "minify",
                                        topcoms  : top_comments,
                                        obfuscate: obfuscate
                                    }) + cdataE;
                                }
                            }
                        }
                        end = script.length;
                        for (a = 0; a < end; a += 1) {
                            if ((/\s/).test(script.charAt(a)) === true) {
                                script = script.substr(a + 1);
                            } else {
                                break;
                            }
                        }
                        x[i] = stoken + script + endTag;
                    },
                    preserve      = function markupmin__preserve(endTag) {
                        var a     = 0,
                            c     = 0,
                            end   = x.length,
                            store = [];
                        for (c = i; c < end; c += 1) {
                            if (endTag === "</script>" && c > 8 && (x[c - 8] + x[c - 7] + x[c - 6] + x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</script>") {
                                break;
                            }
                            if (endTag === "</pre>" && c > 5 && (x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</pre>") {
                                break;
                            }
                            if (x[c - 1] + x[c] === endTag) {
                                break;
                            }
                        }
                        for (a = i; a < c; a += 1) {
                            store.push(x[a]);
                            x[a] = "";
                        }
                        x[i] = store.join("");
                        i    = c;
                    },
                    content       = function markupmin__content() {
                        var a     = 0,
                            end   = x.length,
                            store = [];
                        for (a = i; a < end; a += 1) {
                            if (x[a] === "<") {
                                break;
                            }
                            store.push(x[a]);
                            x[a] = "";
                        }
                        i    = a - 1;
                        x[i] = store.join("").replace(/\s+/g, " ");
                    };
                (function markupmin__algorithm() {
                    var a      = 0,
                        store  = [],
                        end    = x.length,
                        part   = "",
                        source = args.source;
                    for (i = 0; i < x.length; i += 1) {
                        if ((source.slice(i, i + 7)).toLowerCase() === "<script") {
                            store = [];
                            for (a = i + 8; a < end; a += 1) {
                                if (source.charAt(a) === ">") {
                                    break;
                                }
                                store.push(source.charAt(a));
                            }
                            part = store.join("").toLowerCase().replace(/'/g, "\"");
                            if (comments !== "beautify" && comments !== "diff") {
                                markupspace();
                            }
                            if (part.indexOf("type=\"syntaxhighlighter\"") > -1) {
                                preserve("</script>");
                            }
                            if (part.indexOf("type=\"") < 0 || part.indexOf("type=\"text/javascript\"") > -1 || part.indexOf("type=\"application/javascript\"") > -1 || part.indexOf("type=\"application/x-javascript\"") > -1 || part.indexOf("type=\"text/ecmascript\"") > -1 || part.indexOf("type=\"application/ecmascript\"") > -1 || part.indexOf("type=\"text/cjs\"") > -1) {
                                markupscript("script");
                            }
                        } else if ((source.slice(i, i + 6)).toLowerCase() === "<style") {
                            store = [];
                            for (a = i + 7; a < end; a += 1) {
                                if (source.charAt(a) === ">") {
                                    break;
                                }
                                store.push(source.charAt(a));
                            }
                            part = store.join("").toLowerCase().replace(/'/g, "\"");
                            if (comments !== "beautify" && comments !== "diff") {
                                markupspace();
                            }
                            if (part.indexOf("type=\"") < 0 || part.indexOf("type=\"text/css\"") > -1) {
                                markupscript("style");
                            }
                        } else if ((conditional === true || (presume_html === true && comments === "beautify")) && source.slice(i, i + 8) === "<!--[if ") {
                            markupcomment("<![endif]-->");
                        } else if (source.slice(i, i + 4) === "<!--" && x[i + 4] !== "#") {
                            markupcomment("-->");
                        } else if (source.slice(i, i + 4) === "<%--") {
                            markupcomment("--%>");
                        } else if (source.slice(i, i + 5) === "<?php") {
                            preserve("?>");
                        } else if (source.slice(i, i + 4).toLowerCase() === "<pre" && presume_html === true) {
                            preserve("</pre>");
                        } else if (source.slice(i, i + 2) === "<%") {
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
                    var a         = 0,
                        b         = 0,
                        htmlStore = [],
                        htmlEnd   = 0,
                        test      = false,
                        output    = "",
                        build     = [],
                        end       = x.length,
                        html      = [
                            "area", "base", "basefont", "br", "col", "embed", "eventsource", "frame", "hr", "img", "input", "keygen", "link", "meta", "param", "progress", "source", "wbr"
                        ],
                        htmlLen   = html.length;
                    for (a = 0; a < end; a += 1) {
                        if (x[a] !== "") {
                            build.push(x[a]);
                        }
                    }
                    x   = [];
                    end = build.length;
                    for (a = 0; a < end; a += 1) {
                        test = (/^\s+$/).test(build[a]);
                        if (test === false || (test === true && (/^\s+$/).test(build[a + 1]) === false)) {
                            x.push(build[a]);
                        }
                    }
                    end = x.length;
                    for (a = 2; a < end; a += 1) {
                        test = false;
                        if (presume_html === true) {
                            htmlStore = [];
                            htmlEnd   = x[a].length;
                            for (b = 1; b < htmlEnd; b += 1) {
                                if (/[a-z]/i.test(x[a].charAt(b))) {
                                    htmlStore.push(x[a].charAt(b));
                                } else {
                                    break;
                                }
                            }
                            for (b = 0; b < htmlLen; b += 1) {
                                if (htmlStore.join("") === html[b] && x[a].charAt(0) === "<") {
                                    test = true;
                                    break;
                                }
                            }
                        }
                        if ((/^\s+$/).test(x[a - 1]) === true) {
                            if (test === false && (x[a].charAt(0) === "<" && x[a].charAt(1) === "/" && x[a - 1] !== " " && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/" && x[a - 3].charAt(0) !== "<") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/" && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/")) {
                                x[a - 1] = "";
                            }
                        }
                    }
                    output = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/<(\s*)/g, "<").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">");
                    if ((/\s/).test(output.charAt(0)) === true) {
                        output = output.slice(1, output.length);
                    }
                    return output;
                }());
            },
            markup_beauty = function markup_beauty(args) {
                var token     = [],
                    build     = [],
                    cinfo     = [],
                    level     = [],
                    inner     = [],
                    sum       = [],
                    x         = (typeof args.source === "string") ? args.source : "",
                    mchar     = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                    mcomm     = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : "indent",
                    mcond     = (args.conditional === "true" || args.conditional === true) ? true : false,
                    mcont     = (args.content === "true" || args.content === true) ? true : false,
                    mforce    = (args.force_indent === "true" || args.force_indent === true) ? true : false,
                    mhtml     = (args.html === "true" || args.html === true) ? true : false,
                    mmode     = (typeof args.mode === "string" && args.mode === "diff") ? "diff" : "beautify",
                    msize     = (isNaN(args.insize) === true) ? 4 : Number(args.insize),
                    mstyle    = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
                    mwrap     = (isNaN(args.wrap) === true) ? 0 : Number(args.wrap),
                    mvarspace = (args.varspace === false || args.varspace === "false") ? false : true;
                if (mhtml === true) {
                    x = x.replace(/<\!\[if /g, "<!--[if ").replace(/<\!\[endif\]>/g, "<![endif]-->");
                }
                (function markup_beauty__findNestedTags() {
                    var data = (function markup_beauty__findNestedTags_angleBraces() {
                            var a               = 0,
                                b               = 0,
                                c               = 0,
                                end             = x.length,
                                tagEnd          = 0,
                                tagCount        = -1,
                                ltIndex         = 0,
                                quoteEnd        = 0,
                                ltCount         = -1,
                                quoteSwitch     = false,
                                braceTest       = false,
                                quotedBraceTest = false,
                                quoteless       = false,
                                quoteBuild      = [">"],
                                output          = [];
                            for (a = 0; a < end; a += 1) {
                                if (mhtml === true && x.substr(a, 4).toLowerCase() === "<pre") {
                                    for (b = a + 4; b < end; b += 1) {
                                        if (tagEnd === 0 && x.charAt(b) === ">") {
                                            tagEnd = b;
                                        }
                                        if (x.slice(b, b + 6).toLowerCase() === "</pre>") {
                                            if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 6)) === true) {
                                                tagCount += 2;
                                            } else {
                                                tagCount += 3;
                                            }
                                            a      = b + 5;
                                            tagEnd = 0;
                                            break;
                                        }
                                    }
                                } else if (x.substr(a, 7).toLowerCase() === "<script") {
                                    for (b = a + 7; b < end; b += 1) {
                                        if (tagEnd === 0 && x.charAt(b) === ">") {
                                            tagEnd = b;
                                        }
                                        if (x.slice(b, b + 9).toLowerCase() === "</script>") {
                                            if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 9)) === true) {
                                                tagCount += 2;
                                            } else {
                                                tagCount += 3;
                                            }
                                            a      = b + 8;
                                            tagEnd = 0;
                                            break;
                                        }
                                    }
                                } else if (x.substr(a, 6).toLowerCase() === "<style") {
                                    for (b = a + 6; b < end; b += 1) {
                                        if (tagEnd === 0 && x.charAt(b) === ">") {
                                            tagEnd = b;
                                        }
                                        if (x.slice(b, b + 8).toLowerCase() === "</style>") {
                                            if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 8)) === true) {
                                                tagCount += 2;
                                            } else {
                                                tagCount += 3;
                                            }
                                            a      = b + 7;
                                            tagEnd = 0;
                                            break;
                                        }
                                    }
                                } else if (x.substr(a, 5) === "<?php") {
                                    for (b = a + 5; b < end; b += 1) {
                                        if (x.charAt(b - 1) === "?" && x.charAt(b) === ">") {
                                            a        = b;
                                            tagCount += 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "%") {
                                    for (b = a + 2; b < end; b += 1) {
                                        if (x.charAt(b - 1) === "%" && x.charAt(b) === ">") {
                                            a        = b;
                                            tagCount += 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && x.charAt(a + 2) === "[") {
                                    for (b = a + 2; b < end; b += 1) {
                                        if (x.charAt(b - 1) === "]" && x.charAt(b) === ">") {
                                            a        = b;
                                            tagCount += 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && (/[A-Za-z]|\[/).test(x.charAt(a + 2)) === true) {
                                    for (b = a + 3; b < end; b += 1) {
                                        if (x.slice(b, b + 4) === "<!--") {
                                            for (c = b + 4; c < end; c += 1) {
                                                if (x.slice(c - 2, c + 1) === "-->") {
                                                    b = c + 1;
                                                    break;
                                                }
                                            }
                                        } else if (x.charAt(b) === ">" && quoteBuild.length === 1 && quoteBuild[0] === ">") {
                                            tagCount += 1;
                                            if (quoteless === true) {
                                                output.push([
                                                    a, b, tagCount, a
                                                ]);
                                            }
                                            quoteless  = false;
                                            a          = b;
                                            quoteBuild = [">"];
                                            break;
                                        }
                                        if (x.charAt(b) === "<") {
                                            quoteBuild.push(">");
                                            quoteless = true;
                                        } else if (x.charAt(b) === ">" && quoteBuild.length > 1) {
                                            quoteBuild.pop();
                                            if (quoteBuild.length === 1 && quoteless === true) {
                                                tagCount += 1;
                                                output.push([
                                                    a, b, tagCount, a
                                                ]);
                                                quoteless  = false;
                                                a          = b;
                                                quoteBuild = [">"];
                                                break;
                                            }
                                            quoteless = true;
                                        } else if (x.charAt(b) === "[") {
                                            quoteBuild.push("]");
                                        } else if (x.charAt(b) === "]") {
                                            quoteBuild.pop();
                                        } else if (x.charAt(b) === "\"") {
                                            if (quoteBuild[quoteBuild.length - 1] === "\"") {
                                                quoteBuild.pop();
                                            } else {
                                                quoteBuild.push("\"");
                                            }
                                        } else if (x.charAt(b) === "'") {
                                            if (quoteBuild[quoteBuild.length - 1] === "'") {
                                                quoteBuild.pop();
                                            } else {
                                                quoteBuild.push("'");
                                            }
                                        }
                                    }
                                } else if (x.charAt(a) === x.charAt(a + 1) && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                                    a += 1;
                                } else if (x.charAt(a - 1) === "=" && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                                    quotedBraceTest = false;
                                    for (c = a - 1; c > 0; c -= 1) {
                                        if ((x.charAt(c) === "\"" && x.charAt(a) === "\"") || (x.charAt(c) === "'" && x.charAt(a) === "'") || x.charAt(c) === "<") {
                                            break;
                                        }
                                        if (x.charAt(c) === ">") {
                                            quotedBraceTest = true;
                                            break;
                                        }
                                    }
                                    if (quotedBraceTest === false) {
                                        braceTest = false;
                                        for (b = a + 1; b < end; b += 1) {
                                            if (x.substr(b, 7).toLowerCase() === "<script") {
                                                for (c = b + 7; c < end; c += 1) {
                                                    if (x.slice(c, c + 9).toLowerCase() === "</script>") {
                                                        b = c + 9;
                                                        break;
                                                    }
                                                }
                                            } else if (x.substr(b, 6).toLowerCase() === "<style") {
                                                for (c = b + 6; c < end; c += 1) {
                                                    if (x.slice(c, c + 8).toLowerCase() === "</style>") {
                                                        b = c + 8;
                                                        break;
                                                    }
                                                }
                                            } else if (x.substr(b, 5) === "<?php") {
                                                for (c = b + 5; c < end; c += 1) {
                                                    if (x.charAt(c - 1) === "?" && x.charAt(c) === ">") {
                                                        b = c;
                                                        break;
                                                    }
                                                }
                                            } else if (x.charAt(b) === "<" && x.charAt(b + 1) === "%") {
                                                for (c = b + 5; c < end; c += 1) {
                                                    if (x.charAt(c - 1) === "%" && x.charAt(c) === ">") {
                                                        b = c;
                                                        break;
                                                    }
                                                }
                                            } else if (x.charAt(b) === ">" || x.charAt(b) === "<") {
                                                braceTest = true;
                                            } else if ((x.charAt(b - 1) !== "\\" && ((x.charAt(a) === "\"" && x.charAt(b) === "\"") || (x.charAt(a) === "'" && x.charAt(b) === "'"))) || b === end - 1) {
                                                if (ltCount !== tagCount && quoteSwitch === true) {
                                                    quoteSwitch = false;
                                                    tagCount    -= 1;
                                                    ltCount     -= 1;
                                                } else if (ltCount === tagCount) {
                                                    for (c = ltIndex + 1; c > a; c += 1) {
                                                        if ((/\s/).test(x.charAt(c)) === false) {
                                                            break;
                                                        }
                                                    }
                                                    quoteEnd = c;
                                                    if (ltIndex < a && quoteSwitch === false) {
                                                        quoteSwitch = true;
                                                        tagCount    += 1;
                                                        ltCount     += 1;
                                                    }
                                                }
                                                if (braceTest === true) {
                                                    output.push([
                                                        a, b, tagCount, quoteEnd
                                                    ]);
                                                }
                                                a = b;
                                                break;
                                            }
                                        }
                                    }
                                } else if (x.charAt(a) === "<") {
                                    if (x.charAt(a + 1) === "!" && x.charAt(a + 2) === "-" && x.charAt(a + 3) === "-") {
                                        if (mhtml === true && x.charAt(a + 4) === "[" && x.charAt(a + 5).toLowerCase() === "i" && x.charAt(a + 6).toLowerCase() === "f") {
                                            for (b = a + 7; b < end; b += 1) {
                                                if (x.charAt(b) === "]" && x.charAt(b + 1) === "-" && x.charAt(b + 2) === "-" && x.charAt(b + 3) === ">") {
                                                    break;
                                                }
                                            }
                                            a = b + 3;
                                        } else {
                                            for (b = a + 4; b < end; b += 1) {
                                                if (x.charAt(b) === "-" && x.charAt(b + 1) === "-" && x.charAt(b + 2) === ">") {
                                                    break;
                                                }
                                            }
                                            a = b + 2;
                                        }
                                        tagCount += 1;
                                    } else {
                                        tagCount += 1;
                                        quoteEnd = a;
                                    }
                                } else if (x.charAt(a + 1) === "<" && x.charAt(a) !== ">") {
                                    for (b = a; b > 0; b -= 1) {
                                        if ((/\s/).test(x.charAt(b)) === false && x.charAt(b) !== ">") {
                                            tagCount += 1;
                                            ltCount  += 1;
                                            quoteEnd = a;
                                            break;
                                        }
                                        if (x.charAt(b) === ">") {
                                            if (tagCount !== ltCount) {
                                                ltCount += 1;
                                                ltIndex = a;
                                            }
                                            break;
                                        }
                                    }
                                } else if (x.charAt(a) === ">") {
                                    ltCount += 1;
                                    ltIndex = a;
                                }
                            }
                            return output;
                        }());
                    (function markup_beauty__findNestedTags_replaceBraces() {
                        var a          = 0,
                            b          = 0,
                            c          = 0,
                            d          = 0,
                            dataEnd    = data.length,
                            tagEnd     = 0,
                            tagCount   = 0,
                            braceIndex = 0,
                            tagStart   = 0,
                            quoteEnd   = 0,
                            source     = x.split("");
                        for (a = 0; a < dataEnd; a += 1) {
                            tagStart = data[a][0] + 1;
                            tagEnd   = data[a][1];
                            tagCount = data[a][2];
                            quoteEnd = data[a][3];
                            for (b = tagStart; b < tagEnd; b += 1) {
                                braceIndex = 0;
                                if (source[b] === "<") {
                                    source[b] = "[";
                                    for (c = b; c > quoteEnd; c -= 1) {
                                        braceIndex += 1;
                                        if ((/\s/).test(source[c]) === true) {
                                            for (d = c - 1; d > quoteEnd; d -= 1) {
                                                if ((/\s/).test(source[d]) === false) {
                                                    if (source[d] !== "=") {
                                                        braceIndex += 1;
                                                    } else if ((/\s/).test(source[d - 1]) === true) {
                                                        braceIndex -= 1;
                                                    }
                                                    c = d;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if ((/\s/).test(source[tagStart]) === true && source[tagStart - 1] !== "\"" && source[tagStart - 1] !== "'") {
                                        braceIndex -= 1;
                                    }
                                    inner.push([
                                        "<", braceIndex, tagCount
                                    ]);
                                } else if (source[b] === ">") {
                                    source[b] = "]";
                                    for (c = b; c > quoteEnd; c -= 1) {
                                        braceIndex += 1;
                                        if ((/\s/).test(source[c]) === true) {
                                            for (d = c - 1; d > quoteEnd; d -= 1) {
                                                if ((/\s/).test(source[d]) === false) {
                                                    if (source[d] !== "=") {
                                                        braceIndex += 1;
                                                    } else if ((/\s/).test(source[d - 1]) === true) {
                                                        braceIndex -= 1;
                                                    }
                                                    c = d;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if ((/\s/).test(source[tagStart]) === true && source[tagStart - 1] !== "\"" && source[tagStart - 1] !== "'") {
                                        braceIndex -= 1;
                                    }
                                    inner.push([
                                        ">", braceIndex, tagCount
                                    ]);
                                }
                            }
                        }
                        x = source.join("");
                    }());
                }());
                (function markup_beauty__createBuild() {
                    var i          = 0,
                        inc        = 0,
                        scriptflag = 0,
                        y          = markupmin({
                            source      : x,
                            comments    : mmode,
                            presume_html: mhtml,
                            conditional : mcond
                        }).split(""),
                        last       = "",
                        builder    = function markup_beauty__createBuild_endFinder(ending) {
                            var a          = 0,
                                b          = 0,
                                c          = 0,
                                buildLen   = 0,
                                part       = [],
                                endLen     = ending.length,
                                endParse   = ending.split("").reverse(),
                                space      = "",
                                name       = "",
                                braceCount = 0,
                                ename      = "",
                                previous   = "",
                                loop       = y.length,
                                quote      = "";
                            if (i > 0 && y[i - 1] === " ") {
                                space = " ";
                            }
                            for (i; i < loop; i += 1) {
                                part.push(y[i]);
                                if (ending === ">" && y[i] === "%") {
                                    if (y[i - 1] === "<") {
                                        braceCount += 1;
                                    }
                                    if (y[i + 1] === ">") {
                                        braceCount -= 1;
                                        i          += 1;
                                        part.pop();
                                        part.push("%>");
                                    }
                                }
                                if (quote === "") {
                                    if (y[i] === "\"") {
                                        quote = "\"";
                                    } else if (y[i] === "'") {
                                        quote = "'";
                                    } else if (y[i] === "[" && part[0] === "<" && part[1] === "!" && part[2] !== "-") {
                                        ending   = "]>";
                                        endLen   = 2;
                                        endParse = [
                                            ">", "]"
                                        ];
                                    } else {
                                        if (part[part.length - 1] === endParse[0] && braceCount === 0) {
                                            if (endLen === 1) {
                                                if (mhtml === true && (part[3] === ">" || part[3] === " " || part[3] === "l" || part[3] === "L")) {
                                                    name = part.slice(1, 5).join("").toLowerCase();
                                                    if (name.slice(0, 2) === "li") {
                                                        name = name.slice(0, 4);
                                                    }
                                                    buildLen = build.length - 1;
                                                    b        = buildLen;
                                                    if (b > -1) {
                                                        if (token[b] === "T_asp" || token[b] === "T_php" || token[b] === "T_ssi" || token[b] === "T_sgml" || token[b] === "T_xml" || token[b] === "T_comment") {
                                                            do {
                                                                b -= 1;
                                                            } while (b > 0 && (token[b] === "T_asp" || token[b] === "T_php" || token[b] === "T_ssi" || token[b] === "T_sgml" || token[b] === "T_xml" || token[b] === "T_comment"));
                                                        }
                                                        previous = build[b].toLowerCase();
                                                        ename    = previous.substr(1);
                                                        if (ename.charAt(0) === "<") {
                                                            ename = ename.substr(1);
                                                        }
                                                        if (((name === "li " || name === "li>") && (ename === "/ul>" || ename === "/ol>" || (ename !== "/li>" && ename !== "ul>" && ename !== "ol>" && ename.indexOf("ul ") !== 0 && ename.indexOf("ol ") !== 0))) || (((name === "/ul>" && previous.indexOf("<ul") < 0) || (name === "/ol>" && previous.indexOf("<ol") < 0)) && ename !== "/li>")) {
                                                            build.push("</prettydiffli>");
                                                            token.push("T_tag_end");
                                                            buildLen += 1;
                                                            for (c = inner.length - 1; c > -1; c -= 1) {
                                                                if (inner[c][2] < buildLen) {
                                                                    break;
                                                                }
                                                                inner[c][2] += 1;
                                                            }
                                                        }
                                                    }
                                                }
                                                return space + part.join("");
                                            }
                                            for (a = 0; a < endLen; a += 1) {
                                                if (endParse[a] !== part[part.length - (a + 1)]) {
                                                    break;
                                                }
                                            }
                                            if (a === endLen) {
                                                return space + part.join("");
                                            }
                                        }
                                    }
                                } else if (y[i] === quote) {
                                    quote = "";
                                }
                            }
                            return space + part.join("");
                        },
                        cgather    = function markup_beauty__createBuild_buildContent(type) {
                            var a       = 0,
                                b       = 0,
                                output  = "",
                                comment = "",
                                endd    = y.length;
                            for (a = i; a < endd; a += 1) {
                                if (comment === "" && (y[a - 1] !== "\\" || (a > 2 && y[a - 2] === "\\"))) {
                                    if (y[a] === "/" && y[a + 1] && y[a + 1] === "/") {
                                        comment = "//";
                                    } else if (y[a] === "/" && y[a + 1] && y[a + 1] === "*") {
                                        comment = "/" + "*";
                                    } else if (y[a] === "'" || y[a] === "\"" || y[a] === "/") {
                                        if (y[a] === "/") {
                                            for (b = a - 1; b > 0; b -= 1) {
                                                if ((/\s/).test(y[b]) === false) {
                                                    break;
                                                }
                                            }
                                            if (y[b] === ")" || y[b] === "]" || y[b] === "}" || (/\w/).test(y[b]) === true) {
                                                comment = "";
                                            } else {
                                                comment = "/";
                                            }
                                        } else {
                                            comment = y[a];
                                        }
                                    }
                                } else if ((y[a - 1] !== "\\" || y[a - 2] === "\\") && ((comment === "'" && y[a] === "'") || (comment === "\"" && y[a] === "\"") || (comment === "/" && y[a] === "/") || (comment === "//" && (y[a] === "\n" || (y[a - 4] && y[a - 4] === "/" && y[a - 3] === "/" && y[a - 2] === "-" && y[a - 1] === "-" && y[a] === ">"))) || (comment === ("/" + "*") && y[a - 1] === "*" && y[a] === "/"))) {
                                    comment = "";
                                }
                                if (((type === "script" && comment === "") || type === "style") && y[a] === "<" && y[a + 1] === "/" && y[a + 2].toLowerCase() === "s") {
                                    if (type === "script" && (y[a + 3].toLowerCase() === "c" && y[a + 4].toLowerCase() === "r" && y[a + 5].toLowerCase() === "i" && y[a + 6].toLowerCase() === "p" && y[a + 7].toLowerCase() === "t")) {
                                        break;
                                    }
                                    if (type === "style" && (y[a + 3].toLowerCase() === "t" && y[a + 4].toLowerCase() === "y" && y[a + 5].toLowerCase() === "l" && y[a + 6].toLowerCase() === "e")) {
                                        break;
                                    }
                                } else if (type === "other" && y[a] === "<") {
                                    break;
                                }
                                output = output + y[a];
                            }
                            i = a - 1;
                            if (mcont === true) {
                                if (output.charAt(0) === " " && output.charAt(output.length - 1) === " ") {
                                    output = " text ";
                                } else if (output.charAt(0) === " ") {
                                    output = " text";
                                } else if (output.charAt(output.length - 1) === " ") {
                                    output = "text ";
                                } else {
                                    output = "text";
                                }
                            }
                            return output;
                        },
                        end        = y.length;
                    for (i = 0; i < end; i += 1) {
                        if (token[token.length - 1] === "T_script" && (i > end - 8 || y.slice(i, i + 8).join("").toLowerCase() !== "</script")) {
                            build.push(cgather("script"));
                            if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                                build.pop();
                            } else {
                                token.push("T_content");
                            }
                        } else if (token[token.length - 1] === "T_style" && (i > end - 7 || y.slice(i, i + 7).join("").toLowerCase() !== "</style")) {
                            build.push(cgather("style"));
                            if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                                build.pop();
                            } else {
                                token.push("T_content");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "!") {
                            if (y[i + 2] === "-" && y[i + 3] === "-") {
                                if (mhtml === true && y[i + 3] === "-" && y[i + 4] === "[" && y[i + 5] === "i" && y[i + 6] === "f") {
                                    build.push(builder("]-->"));
                                    token.push("T_comment");
                                } else if (y[i + 3] === "-" && y[i + 4] !== "#" && token[token.length - 1] !== "T_style") {
                                    build.push(builder("-->"));
                                    token.push("T_comment");
                                } else if (y[i + 3] === "-" && y[i + 4] === "#") {
                                    build.push(builder("-->"));
                                    token.push("T_ssi");
                                } else {
                                    build.push(builder(">"));
                                    token.push("T_tag_start");
                                }
                            } else if (y[i + 2] !== "-") {
                                build.push(builder(">"));
                                token.push("T_sgml");
                            } else {
                                build.push(builder(">"));
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "%") {
                            if (y[i + 2] === "-" && y[i + 3] === "-") {
                                build.push(builder("--%>"));
                                token.push("T_comment");
                            } else {
                                build.push(builder("%>"));
                                token.push("T_asp");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "?") {
                            if (y[i + 2].toLowerCase() === "x" && y[i + 3].toLowerCase() === "m" && y[i + 4].toLowerCase() === "l") {
                                token.push("T_xml");
                            } else if (y[i + 2].toLowerCase() === "p" && y[i + 3].toLowerCase() === "h" && y[i + 4].toLowerCase() === "p") {
                                token.push("T_php");
                            }
                            build.push(builder("?>"));
                        } else if (mhtml === true && y[i] === "<" && y[i + 1].toLowerCase() === "p" && y[i + 2].toLowerCase() === "r" && y[i + 3].toLowerCase() === "e") {
                            build.push(builder("</pre>"));
                            token.push("T_pre");
                        } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "c" && y[i + 3].toLowerCase() === "r" && y[i + 4].toLowerCase() === "i" && y[i + 5].toLowerCase() === "p" && y[i + 6].toLowerCase() === "t") {
                            scriptflag = i;
                            build.push(builder(">"));
                            last = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                            if (last.indexOf(" type=\"syntaxhighlighter\"") !== -1) {
                                i                       = scriptflag;
                                build[build.length - 1] = builder("</script>");
                                token.push("T_pre");
                            } else if (last.charAt(last.length - 2) === "/") {
                                token.push("T_singleton");
                            } else if (last.indexOf(" type=\"") === -1 || last.indexOf(" type=\"text/javascript\"") !== -1 || last.indexOf(" type=\"application/javascript\"") !== -1 || last.indexOf(" type=\"application/x-javascript\"") !== -1 || last.indexOf(" type=\"text/ecmascript\"") !== -1 || last.indexOf(" type=\"application/ecmascript\"") !== -1 || last.indexOf(" type=\"text/cjs\"") !== -1) {
                                token.push("T_script");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "t" && y[i + 3].toLowerCase() === "y" && y[i + 4].toLowerCase() === "l" && y[i + 5].toLowerCase() === "e") {
                            build.push(builder(">"));
                            last = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                            if (last.indexOf(" type=\"") === -1 || last.indexOf(" type=\"text/css\"") !== -1) {
                                token.push("T_style");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "/") {
                            build.push(builder(">"));
                            token.push("T_tag_end");
                        } else if (y[i] === "<" && token[token.length - 1] !== "T_script" && token[token.length - 1] !== "T_style" && (y[i + 1] !== "!" || y[i + 1] !== "?" || y[i + 1] !== "/" || y[i + 1] !== "%")) {
                            for (inc = i; inc < end; inc += 1) {
                                if (y[inc] !== "?" && y[inc] !== "%") {
                                    if (y[inc] === "/" && y[inc + 1] === ">") {
                                        build.push(builder("/>"));
                                        token.push("T_singleton");
                                        break;
                                    }
                                    if (y[inc + 1] === ">") {
                                        build.push(builder(">"));
                                        token.push("T_tag_start");
                                        break;
                                    }
                                }
                            }
                        } else if (y[i - 1] === ">" && (y[i] !== "<" || (y[i] !== " " && y[i + 1] !== "<"))) {
                            if (token[token.length - 1] === "T_script") {
                                build.push(cgather("script"));
                                if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                                    build.pop();
                                } else {
                                    token.push("T_content");
                                }
                            } else if (token[token.length - 1] === "T_style") {
                                build.push(cgather("style"));
                                if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                                    build.pop();
                                } else {
                                    token.push("T_content");
                                }
                            } else if (y[i - 1] + y[i] + y[i + 1] !== "> <") {
                                build.push(cgather("other"));
                                token.push("T_content");
                            }
                        }
                    }
                }());
                (function markup_beauty__createCinfo() {
                    var i   = 0,
                        end = token.length;
                    for (i = 0; i < end; i += 1) {
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
                    var i          = 0,
                        indexSpace = 0,
                        tag        = "",
                        end        = cinfo.length,
                        next       = "";
                    if (mhtml === false) {
                        return;
                    }
                    for (i = 0; i < end; i += 1) {
                        if (cinfo[i] === "start") {
                            indexSpace = build[i].indexOf(" ");
                            if (build[i].length === 3) {
                                tag = build[i].charAt(1).toLowerCase();
                            } else if (indexSpace === -1) {
                                tag = build[i].slice(1, build[i].length - 1).toLowerCase();
                            } else if (indexSpace === 0) {
                                tag        = build[i].slice(1, build[i].length);
                                indexSpace = tag.indexOf(" ");
                                tag        = tag.slice(1, indexSpace).toLowerCase();
                            } else {
                                tag = build[i].slice(1, indexSpace).toLowerCase();
                            }
                            if (cinfo[i + 1] === "end") {
                                next = (build[i + 1].charAt(0) === " ") ? build[i + 1].toLowerCase().substr(1) : build[i + 1].toLowerCase();
                            } else {
                                next = "";
                            }
                            if (next !== "</" + tag + ">") {
                                if (tag === "area" || tag === "base" || tag === "basefont" || tag === "br" || tag === "col" || tag === "embed" || tag === "eventsource" || tag === "frame" || tag === "hr" || tag === "img" || tag === "input" || tag === "keygen" || tag === "param" || tag === "progress" || tag === "source" || tag === "wbr") {
                                    cinfo[i] = "singleton";
                                    token[i] = "T_singleton";
                                }
                                if (tag === "link" || tag === "meta") {
                                    cinfo[i] = "mixed_both";
                                    token[i] = "T_singleton";
                                }
                            }
                        }
                    }
                }());
                (function markup_beauty__innerFix() {
                    var a          = 0,
                        braceType  = "",
                        braceIndex = 0,
                        tagCount   = 0,
                        endInner   = inner.length,
                        tag        = [];
                    for (a = 0; a < endInner; a += 1) {
                        braceType  = inner[a][0];
                        braceIndex = inner[a][1];
                        tagCount   = inner[a][2];
                        if (typeof build[tagCount] === "string") {
                            if (build[tagCount].charAt(0) === " ") {
                                braceIndex += 1;
                            }
                            tag = build[tagCount].split("");
                            if (braceType === "<" && tag[braceIndex] === "[") {
                                tag[braceIndex] = "<";
                            } else if (braceType === ">" && tag[braceIndex] === "]") {
                                tag[braceIndex] = ">";
                            }
                            build[tagCount] = tag.join("");
                        }
                    }
                }());
                (function markup_beauty__algorithm() {
                    var i           = 0,
                        commonStart = function markup_beauty__algorithm_commonStart(isStart) {
                            var a       = 0,
                                counter = 0;
                            if (isStart === "start") {
                                counter += 1;
                            }
                            for (a = i - 1; a > -1; a -= 1) {
                                if (cinfo[a] === "start" && level[a] === "x") {
                                    counter += 1;
                                } else if (cinfo[a] === "end") {
                                    counter -= 1;
                                } else if (cinfo[a] === "start" && level[a] !== "x") {
                                    return level.push(level[a] + counter);
                                }
                                if (a === 0) {
                                    if (cinfo[a] !== "start") {
                                        return level.push(0);
                                    }
                                    if (cinfo[i] === "mixed_start" || cinfo[i] === "content" || (cinfo[i] === "singleton" && build[i].charAt(0) !== " ")) {
                                        return level.push("x");
                                    }
                                    return level.push(1);
                                }
                            }
                        },
                        end         = function markup_beauty__algorithm_end() {
                            var xTester     = function markup_beauty__algorithm_end_xTester(a) {
                                    for (a; a > 0; a -= 1) {
                                        if (level[a] !== "x") {
                                            return level.push(level[a] + 1);
                                        }
                                    }
                                },
                                computation = function markup_beauty__algorithm_end_computation() {
                                    var a            = 0,
                                        mixendTest   = false,
                                        primary      = function markup_beauty__algorithm_end_computation_primary() {
                                            var b           = 0,
                                                mixAnalysis = function markup_beauty__algorithm_end_computation_primary_vooDoo() {
                                                    var c       = 0,
                                                        d       = 0,
                                                        counter = 0;
                                                    for (c = i - 1; c > 0; c -= 1) {
                                                        if ((cinfo[c] === "start" && cinfo[c + 1] === "start" && level[c] === level[c + 1] - 1) || (cinfo[c] === "start" && cinfo[c - 1] !== "start" && level[c] === level[c - 1])) {
                                                            break;
                                                        }
                                                    }
                                                    for (d = c + 1; d < i; d += 1) {
                                                        if (cinfo[d] === "mixed_start" && cinfo[d + 1] === "end") {
                                                            counter += 1;
                                                        }
                                                    }
                                                    if (cinfo[c - 1] === "end" && level[c - 1] !== "x" && counter === 0) {
                                                        counter += 1;
                                                    }
                                                    if (counter !== 0) {
                                                        if (level[i - 1] === "x") {
                                                            return counter - 1;
                                                        }
                                                        return counter;
                                                    }
                                                    for (c; c < i; c += 1) {
                                                        if (cinfo[c] === "start") {
                                                            counter += 1;
                                                        } else if (cinfo[c] === "end") {
                                                            counter -= 1;
                                                        }
                                                    }
                                                    return counter;
                                                };
                                            for (b = i - 1; b > 0; b -= 1) {
                                                if (cinfo[b] !== "mixed_end" || (cinfo[b] === "start" && level[b] !== "x")) {
                                                    if (cinfo[b - 1] === "end") {
                                                        mixendTest = true;
                                                        if (cinfo[i - 1] === "mixed_both" && level[i - 1] === level[b] - mixAnalysis()) {
                                                            return level.push(level[b] - (mixAnalysis() + 1));
                                                        }
                                                        if (cinfo[i - 2] === "start" && (cinfo[i - 1] === "mixed_end" || cinfo[i - 1] === "mixed_both")) {
                                                            return level.push(level[b]);
                                                        }
                                                        if (level[b] !== "x") {
                                                            if (cinfo[b] === "mixed_both" && b !== i - mixAnalysis()) {
                                                                if (b === i - 1) {
                                                                    return level.push(level[b] - 1);
                                                                }
                                                                return level.push(level[b] + mixAnalysis());
                                                            }
                                                            if (cinfo[i - 1] === "mixed_end" && mixAnalysis() === 0) {
                                                                return level.push(level[b] - 1);
                                                            }
                                                            if (level[i - 1] === "x" && (cinfo[i - 2] !== "end" || (cinfo[i - 2] === "end" && level[i - 2] !== "x"))) {
                                                                return level.push(level[b] + mixAnalysis());
                                                            }
                                                            return level.push(level[b] - mixAnalysis());
                                                        }
                                                    } else {
                                                        mixendTest = false;
                                                        return;
                                                    }
                                                }
                                            }
                                        },
                                        neutralStart = function markup_beauty__algorithm_end_computation_resultant() {
                                            var b       = 0,
                                                counter = 0;
                                            for (b = i; b > 0; b -= 1) {
                                                if (cinfo[b] === "end") {
                                                    counter += 1;
                                                } else if (cinfo[b] === "start") {
                                                    counter -= 1;
                                                }
                                                if (counter === 0) {
                                                    return b;
                                                }
                                            }
                                        };
                                    if (cinfo[i - 1] === "end" && level[i - 1] !== "x") {
                                        if (cinfo[i - 2] === "start" && level[i - 2] === "x") {
                                            for (a = i - 2; a > 0; a -= 1) {
                                                if (level[a] !== "x") {
                                                    break;
                                                }
                                            }
                                            if (cinfo[a] === "start") {
                                                return commonStart("end");
                                            }
                                            return level.push(level[a] - 1);
                                        }
                                        if (cinfo[i - 2] === "start" && level[i - 2] !== "x") {
                                            return level.push(level[i - 2] - 1);
                                        }
                                        return level.push(level[i - 1] - 1);
                                    }
                                    primary();
                                    if (mixendTest === true) {
                                        return;
                                    }
                                    return (function markup_beauty__algorithm_end_computation_whenAllElseFails() {
                                        var b       = 0,
                                            counter = 0;
                                        for (b = neutralStart(); b > 0; b -= 1) {
                                            if (cinfo[b] === "start") {
                                                counter += 1;
                                            } else if (cinfo[b] === "end") {
                                                counter -= 1;
                                            }
                                            if (level[b] !== "x") {
                                                if (cinfo[b] === "end" && cinfo[b - 1] === "start" && level[b - 1] !== "x") {
                                                    return level.push(level[b]);
                                                }
                                                if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_end" && (cinfo[i - 2] !== "end" || level[i - 2] !== "x") && (cinfo[i - 3] !== "end" || level[i - 3] !== "x")) {
                                                    return level.push("x");
                                                }
                                                return level.push(level[b] + (counter - 1));
                                            }
                                        }
                                        counter = 0;
                                        for (b = i; b > -1; b -= 1) {
                                            if (cinfo[b] === "start") {
                                                counter += 1;
                                            } else if (cinfo[b] === "end") {
                                                counter -= 1;
                                            }
                                        }
                                        return level.push(counter);
                                    }());
                                };
                            if (cinfo[i - 1] === "end" || cinfo[i - 1] === "mixed_both" || cinfo[i - 1] === "mixed_end") {
                                return computation();
                            }
                            if (build[i].charAt(0) !== " " && (cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i - 1] === "comment" && (cinfo[i - 2] === "start" || (level[i - 1] === "x" && level[i - 2] === "x"))))) {
                                return level.push("x");
                            }
                            if (cinfo[i - 1] === "external") {
                                return (function markup_beauty__algorithm_end_external() {
                                    var a       = 0,
                                        counter = -1;
                                    for (a = i - 2; a > 0; a -= 1) {
                                        if (cinfo[a] === "start") {
                                            counter += 1;
                                        } else if (cinfo[a] === "end") {
                                            counter -= 1;
                                        }
                                        if (level[a] !== "x") {
                                            break;
                                        }
                                    }
                                    if (cinfo[a] === "end") {
                                        counter += 1;
                                    }
                                    return level.push(level[a] + counter);
                                }());
                            }
                            if (build[i].charAt(0) !== " ") {
                                if (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content") {
                                    return level.push("x");
                                }
                                return (function markup_beauty__algorithm_end_singletonContent() {
                                    var a       = 0,
                                        counter = 0;
                                    for (a = i - 1; a > 0; a -= 1) {
                                        if (cinfo[a] === "singleton" && level[a] === "x" && ((cinfo[a - 1] === "singleton" && level[a - 1] !== "x") || cinfo[a - 1] !== "singleton")) {
                                            counter += 1;
                                        }
                                        if (level[a] !== 0 && level[a] !== "x" && cinfo[i - 1] !== "start") {
                                            if (cinfo[a] === "mixed_both" || cinfo[a] === "mixed_start") {
                                                return level.push(level[a] - counter);
                                            }
                                            if (level[a] === counter || (cinfo[a] === "singleton" && (cinfo[a - 1] === "content" || cinfo[a - 1] === "mixed_start"))) {
                                                return level.push(level[a]);
                                            }
                                            return level.push(level[a] - 1);
                                        }
                                        if (cinfo[a] === "start" && level[a] === "x") {
                                            return xTester(a);
                                        }
                                        if (cinfo[i - 1] === "start") {
                                            return level.push(level[a]);
                                        }
                                    }
                                    return level.push(0);
                                }());
                            }
                            return commonStart("end");
                        },
                        startSafety = function markup_beauty__algorithm_startSafety() {
                            var e     = 0,
                                start = function markup_beauty__algorithm_startSafety_start(noComIndex) {
                                    var refA    = 0,
                                        refB    = 0,
                                        refC    = 0,
                                        xTester = function markup_beauty__algorithm_start_complexity() {
                                            var a       = 0,
                                                xCount  = 1,
                                                counter = -1;
                                            for (a = refA; a > 0; a -= 1) {
                                                if (cinfo[a] === "start") {
                                                    counter -= 1;
                                                    if (level[a] === "x") {
                                                        xCount += 1;
                                                    }
                                                } else if (cinfo[a] === "end") {
                                                    counter += 1;
                                                    xCount  -= 1;
                                                }
                                                if (level[a] === 0) {
                                                    refA = 0;
                                                    for (refB = i - 1; refB > a; refB -= 1) {
                                                        if (cinfo[refB] === "start") {
                                                            refA += 1;
                                                        } else if (cinfo[refB] === "end") {
                                                            refA -= 1;
                                                        }
                                                    }
                                                    if (refA > 0) {
                                                        if (level[a + 1] === "x") {
                                                            return level.push((counter * -1) - 1);
                                                        }
                                                        if (cinfo[a] !== "external" && (mcomm !== "noindent" || (mcomm === "noindent" && cinfo[a] !== "comment"))) {
                                                            return level.push((counter + 1) * -1);
                                                        }
                                                    } else {
                                                        for (refA = i - 1; refA > 0; refA -= 1) {
                                                            if (level[refA] !== "x") {
                                                                return level.push(level[refA]);
                                                            }
                                                        }
                                                    }
                                                }
                                                if (level[a] !== "x" && level[i - 1] !== "x") {
                                                    if (cinfo[a] === "start" || cinfo[a] === "end") {
                                                        return level.push(level[a] + xCount);
                                                    }
                                                    return level.push(level[a] + xCount - 1);
                                                }
                                                if (counter === -1 && level[a] === "x") {
                                                    break;
                                                }
                                                if (counter === 1 && level[a] !== "x" && cinfo[a] !== "mixed_start" && cinfo[a] !== "content") {
                                                    if (cinfo[a - 1] === "mixed_end" || (level[i - 1] === "x" && cinfo[i - 1] === "end" && cinfo[a] !== "end")) {
                                                        return level.push(level[a] - counter - 1);
                                                    }
                                                    return level.push(level[a] - counter);
                                                }
                                                if (counter === 0 && level[a] !== "x") {
                                                    return commonStart("start");
                                                }
                                            }
                                            return commonStart("start");
                                        };
                                    (function markup_beauty__algorithm_start_referrenceFinder() {
                                        var a = 0;
                                        if (noComIndex === 1) {
                                            refA = 0;
                                            refB = 0;
                                            refC = 0;
                                        } else {
                                            for (a = noComIndex - 1; a > 0; a -= 1) {
                                                if (cinfo[a] !== "comment") {
                                                    refA = a;
                                                    break;
                                                }
                                            }
                                            if (refA === 1) {
                                                refB = 0;
                                                refC = 0;
                                            } else {
                                                for (a = refA - 1; a > 0; a -= 1) {
                                                    if (cinfo[a] !== "comment") {
                                                        refB = a;
                                                        break;
                                                    }
                                                }
                                                if (refB === 1) {
                                                    refC = 0;
                                                } else {
                                                    for (a = refB - 1; a > 0; a -= 1) {
                                                        if (cinfo[a] !== "comment") {
                                                            refC = a;
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
                                    if (cinfo[refA] === "mixed_start" || cinfo[refA] === "content" || cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i] === "singleton" && (cinfo[i - 1] === "start" || cinfo[i - 1] === "singleton" || cinfo[i - 1] === "end") && build[i].charAt(0) !== " ")) {
                                        return level.push("x");
                                    }
                                    if ((cinfo[i - 1] === "comment" && level[i - 1] === 0) || ((cinfo[refC] === "mixed_start" || cinfo[refC] === "content") && cinfo[refB] === "end" && (cinfo[refA] === "mixed_end" || cinfo[refA] === "mixed_both"))) {
                                        return commonStart("start");
                                    }
                                    if (cinfo[i - 1] === "comment" && level[i - 1] !== "x") {
                                        return level.push(level[i - 1]);
                                    }
                                    if (refA < i - 1 && ((cinfo[refA] === "start" && level[refA] === "x") || (cinfo[refA] !== "mixed_end" && cinfo[refA] !== "mixed_both" && level[refA] === "x"))) {
                                        if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "start" && build[i - 1].charAt(build[i - 1].length - 1) !== " ") {
                                            if ((cinfo[i - 1] === "end" && cinfo[i - 2] === "end") || (cinfo[i - 1] === "end" && cinfo[i] !== "end" && cinfo[i + 1] !== "mixed_start" && cinfo[i + 1] !== "content")) {
                                                return commonStart("start");
                                            }
                                            return level.push("x");
                                        }
                                        return xTester();
                                    }
                                    if (cinfo[refA] === "end" && level[refA] !== "x" && (cinfo[refA - 1] !== "start" || (cinfo[refA - 1] === "start" && level[refA - 1] !== "x"))) {
                                        if (level[refA] < 0) {
                                            return commonStart("start");
                                        }
                                        return level.push(level[refA]);
                                    }
                                    if (cinfo[refC] !== "mixed_start" && cinfo[refC] !== "content" && (cinfo[refA] === "mixed_end" || cinfo[refA] === "mixed_both")) {
                                        return (function markup_beauty__algorithm_start_notContentNotMixedstart() {
                                            var a          = 0,
                                                countEnd   = 0,
                                                countStart = 0,
                                                indexZero  = 0;
                                            for (a = refA; a > 0; a -= 1) {
                                                if (cinfo[a] === "end") {
                                                    countEnd += 1;
                                                }
                                                if (cinfo[a] === "start") {
                                                    countStart += 1;
                                                }
                                                if (level[a] === 0 && a !== 0) {
                                                    indexZero = a;
                                                }
                                                if (cinfo[refA] === "mixed_both" && level[a] !== "x") {
                                                    return level.push(level[a]);
                                                }
                                                if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end" && level[a] !== "x") {
                                                    if (cinfo[a] === "start" && level[a] !== "x") {
                                                        if (cinfo[i - 1] !== "end") {
                                                            return level.push(level[a] + (countStart - countEnd));
                                                        }
                                                        if ((level[a] === level[a - 1] && cinfo[a - 1] !== "end" && level[a + 1] !== "x") || (cinfo[i - 2] === "start" && level[i - 2] !== "x" && level[i - 1] === "x")) {
                                                            return level.push(level[a] + 1);
                                                        }
                                                        if (countStart <= 1) {
                                                            return level.push(level[a]);
                                                        }
                                                    } else if (countEnd > 0) {
                                                        if (countStart > 1) {
                                                            if (indexZero !== 0) {
                                                                return commonStart("start");
                                                            }
                                                            return level.push(level[a] + 1);
                                                        }
                                                        return level.push(level[a] - countEnd + 1);
                                                    }
                                                    return level.push(level[a] + countStart);
                                                }
                                            }
                                            return commonStart("start");
                                        }());
                                    }
                                    if (cinfo[refA] === "start" && level[refA] !== "x") {
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
                                    return commonStart("start");
                                };
                            if (cinfo[i] !== "start" && level[i - 1] === "x" && cinfo[i - 1] !== "content" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_start" && cinfo[i - 1] !== "mixed_end") {
                                return level.push("x");
                            }
                            if (cinfo[i] !== "start" && build[i] === " ") {
                                build[i] = "";
                                return level.push("x");
                            }
                            if (cinfo[i - 1] !== "comment") {
                                start(i);
                            } else {
                                for (e = i - 1; e > 0; e -= 1) {
                                    if (cinfo[e] !== "comment") {
                                        break;
                                    }
                                }
                                start(e + 1);
                            }
                        };
                    (function markup_beauty__algorithm_loop() {
                        var test        = false,
                            test1       = false,
                            svg         = false,
                            cdata       = [],
                            cdata1      = [],
                            cdataStart  = (/^(\s*(\/)*<\!\[+[A-Z]+\[+)/),
                            cdataEnd    = (/((\/)*\]+>\s*)$/),
                            scriptStart = (/^(\s*<\!\-\-)/),
                            scriptEnd   = (/(\-\->\s*)$/),
                            loop        = cinfo.length,
                            attrib      = function markup_beauty__algorithm_loop_attributeOrder(tag, end) {
                                var a           = 0,
                                    attribute   = [],
                                    tagLength   = 0,
                                    starter     = "",
                                    spaceAfter  = tag.indexOf(" ") + 1,
                                    attribIndex = 0,
                                    nameSpace   = "",
                                    counter     = 0,
                                    space       = (tag.charAt(0) === " ") ? " " : "",
                                    joinchar    = (svg === true) ? "\n" + (function markup_beauty__algorithm_loop_attributeOrder_joinchar() {
                                        var b       = 0,
                                            size    = msize,
                                            tabChar = mchar,
                                            output  = [],
                                            tab     = "";
                                        for (b = 0; b < size; b += 1) {
                                            output.push(tabChar);
                                        }
                                        tab    = output.join("");
                                        size   = level[i];
                                        output = [];
                                        for (b = 0; b < size; b += 1) {
                                            output.push(tab);
                                        }
                                        return output.join("") + tab;
                                    }()) : " ";
                                if (space === " ") {
                                    tag        = tag.substr(1);
                                    spaceAfter = tag.indexOf(" ") + 1;
                                }
                                nameSpace = tag.substring(0, spaceAfter);
                                tagLength = tag.length;
                                tag       = tag.substring(spaceAfter, tagLength - end.length) + " ";
                                for (a = 0; a < tagLength; a += 1) {
                                    if (starter === "") {
                                        if (tag.charAt(a) === "\"") {
                                            starter = "\"";
                                        } else if (tag.charAt(a) === "'") {
                                            starter = "'";
                                        } else if (tag.charAt(a) === "[") {
                                            starter = "[";
                                            counter = 1;
                                        } else if (tag.charAt(a) === "{") {
                                            starter = "{";
                                            counter = 1;
                                        } else if (tag.charAt(a) === "(") {
                                            starter = "(";
                                            counter = 1;
                                        } else if (tag.charAt(a) === "<" && tag.charAt(a + 1) === "%") {
                                            starter     = "<%";
                                            counter     = 1;
                                            attribIndex = a;
                                        } else if (tag.charAt(a) === " " && counter === 0) {
                                            attribute.push(tag.substring(attribIndex, a));
                                            attribIndex = a + 1;
                                        }
                                    } else if (starter === "\"" && tag.charAt(a) === "\"") {
                                        starter = "";
                                    } else if (starter === "'" && tag.charAt(a) === "'") {
                                        starter = "";
                                    } else if (starter === "[") {
                                        if (tag.charAt(a) === "]") {
                                            counter -= 1;
                                            if (counter === 0) {
                                                starter = "";
                                            }
                                        } else if (tag.charAt(a) === "[") {
                                            counter += 1;
                                        }
                                    } else if (starter === "{") {
                                        if (tag.charAt(a) === "}") {
                                            counter -= 1;
                                            if (counter === 0) {
                                                starter = "";
                                            }
                                        } else if (tag.charAt(a) === "{") {
                                            counter += 1;
                                        }
                                    } else if (starter === "(") {
                                        if (tag.charAt(a) === ")") {
                                            counter -= 1;
                                            if (counter === 0) {
                                                starter = "";
                                            }
                                        } else if (tag.charAt(a) === "(") {
                                            counter += 1;
                                        }
                                    } else if (starter === "<%") {
                                        if (tag.charAt(a) === ">" && tag.charAt(a - 1) === "%") {
                                            counter -= 1;
                                            if (counter === 0) {
                                                starter = "";
                                            }
                                        } else if (tag.charAt(a) === "<" && tag.charAt(a + 1) === "%") {
                                            counter += 1;
                                        }
                                    }
                                }
                                return space + nameSpace + attribute.sort().join(joinchar) + end;
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
                                if ((/^(\s*<\!\-\-\s*\-\->(\s*))$/).test(build[i]) === true) {
                                    if (build[i].charAt(0) === " ") {
                                        build[i] = build[i].substr(1);
                                    }
                                    if (build[i].charAt(build[i].length - 1) === " ") {
                                        build[i] = build[i].substr(0, build[i].length - 1);
                                    }
                                    cinfo[i] = "comment";
                                    token[i] = "T_comment";
                                    if (mcomm !== "noindent") {
                                        startSafety();
                                    } else {
                                        level.push(0);
                                    }
                                } else if (token[i - 1] === "T_script") {
                                    startSafety();
                                    if (scriptStart.test(build[i]) === true) {
                                        test     = true;
                                        build[i] = build[i].replace(scriptStart, "");
                                    } else if (cdataStart.test(build[i]) === true) {
                                        cdata    = cdataStart.exec(build[i]);
                                        build[i] = build[i].replace(cdataStart, "");
                                    }
                                    if (scriptEnd.test(build[i]) === true && (/(\/\/\-\->\s*)$/).test(build[i]) === false) {
                                        test1    = true;
                                        build[i] = build[i].replace(scriptEnd, "");
                                    } else if (cdataEnd.test(build[i]) === true) {
                                        cdata1   = cdataEnd.exec(build[i]);
                                        build[i] = build[i].replace(cdataEnd, "");
                                    }
                                    if (typeof jspretty === "function") {
                                        build[i] = jspretty({
                                            source  : build[i],
                                            insize  : msize,
                                            inchar  : mchar,
                                            preserve: true,
                                            inlevel : level[i],
                                            space   : true,
                                            braces  : args.indent,
                                            comments: mcomm,
                                            varspace: mvarspace
                                        });
                                    }
                                    if (test === true) {
                                        build[i] = "<!--\n" + build[i];
                                    } else if (cdata[0] !== "") {
                                        build[i] = cdata[0] + "\n" + build[i];
                                    }
                                    if (test1 === true) {
                                        level.push(level[i]);
                                        build.splice(i + 1, 0, "-->");
                                        cinfo.splice(i + 1, 0, "external");
                                        token.splice(i + 1, 0, "T_content");
                                        loop += 1;
                                    } else if (cdata1[0] !== "") {
                                        level.push(level[i]);
                                        build.splice(i + 1, 0, cdata1[0]);
                                        cinfo.splice(i + 1, 0, "external");
                                        token.splice(i + 1, 0, "T_content");
                                        loop += 1;
                                    }
                                    build[i] = build[i].replace(/(\/\/(\s)+\-\->(\s)*)$/, "//-->").replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                                } else if (token[i - 1] === "T_style") {
                                    level.push(0);
                                    if (scriptStart.test(build[i]) === true) {
                                        test     = true;
                                        build[i] = build[i].replace(scriptStart, "");
                                    } else if (cdataStart.test(build[i]) === true) {
                                        cdata    = cdataStart.exec(build[i]);
                                        build[i] = build[i].replace(cdataStart, "");
                                    }
                                    if (scriptEnd.test(build[i]) === true && (/(\/\/\-\->\s*)$/).test(build[i]) === false) {
                                        test1 = true;
                                        build[i].replace(scriptEnd, "");
                                    } else if (cdataEnd.test(build[i]) === true) {
                                        cdata1   = cdataEnd.exec(build[i]);
                                        build[i] = build[i].replace(cdataEnd, "");
                                    }
                                    if (typeof csspretty === "function") {
                                        build[i] = csspretty({
                                            comm  : mcomm,
                                            inchar: mchar,
                                            insize: msize,
                                            mode  : "beautify",
                                            source: build[i]
                                        });
                                    }
                                    if (test === true) {
                                        build[i] = "<!--\n" + build[i];
                                    } else if (cdata[0] !== "") {
                                        build[i] = cdata[0] + "\n" + build[i];
                                    }
                                    if (test1 === true) {
                                        build[i] = build[i] + "\n-->";
                                    } else if (cdata1[0] !== "") {
                                        build[i] = build[i] + "\n" + cdata1[0];
                                    }
                                    build[i] = build[i].replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                                }
                            } else {
                                if (cinfo[i] === "comment" && mcomm !== "noindent") {
                                    if (build[i].charAt(0) === " ") {
                                        startSafety();
                                    } else {
                                        level.push("x");
                                    }
                                } else if (cinfo[i] === "comment" && mcomm === "noindent") {
                                    level.push(0);
                                } else if (cinfo[i] === "content") {
                                    level.push("x");
                                } else if (cinfo[i] === "parse") {
                                    startSafety();
                                } else if (cinfo[i] === "mixed_both") {
                                    startSafety();
                                } else if (cinfo[i] === "mixed_start") {
                                    startSafety();
                                } else if (cinfo[i] === "mixed_end") {
                                    build[i] = build[i].slice(0, build[i].length - 1);
                                    level.push("x");
                                } else if (cinfo[i] === "start") {
                                    if (svg === true && level[i - 1] !== "x" && (cinfo[i - 1] === "start" || (/^( ?<svg)/).test(build[i - 1]) === true)) {
                                        level.push(level[i - 1] + 1);
                                    } else {
                                        startSafety();
                                    }
                                } else if (cinfo[i] === "end") {
                                    end();
                                } else if (cinfo[i] === "singleton") {
                                    if (svg === true && level[i - 1] !== "x") {
                                        if (cinfo[i - 1] === "start" || (/^( ?<svg)/).test(build[i - 1]) === true) {
                                            level.push(level[i - 1] + 1);
                                        } else {
                                            level.push(level[i - 1]);
                                        }
                                    } else {
                                        startSafety();
                                    }
                                }
                            }
                            if ((cinfo[i] === "start" || cinfo[i] === "singleton") && token[i] !== "T_asp" && token[i] !== "T_php" && token[i] !== "T_ssi" && build[i].substr(1).indexOf(" ") > 0) {
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
                    var i          = 0,
                        end        = build.length,
                        indents    = "",
                        tab        = (function markup_beauty__apply_tab() {
                            var a       = 0,
                                size    = msize,
                                tabChar = mchar,
                                output  = [];
                            for (a = 0; a < size; a += 1) {
                                output.push(tabChar);
                            }
                            return output.join("");
                        }()),
                        comment    = function markup_beauty__apply_comment(item) {
                            var regress = {},
                                a       = i - 1;
                            if (level[a] === "x") {
                                do {
                                    a -= 1;
                                } while (typeof level[a] !== "number");
                            }
                            regress = new RegExp("\n(" + tab + "){" + level[a] + "}", "g");
                            if (cinfo[i - 1] === "start" || (level[i - 1] === "x" && level[i] !== "x")) {
                                item = item.replace(tab, "");
                            }
                            return item.replace(regress, "\n").split("\n").join("\n" + indents);
                        },
                        tab_math   = function markup_beauty__apply_indentation(item) {
                            var a       = 0,
                                b       = 0,
                                loopEnd = (typeof level[i] === "number") ? level[i] : 0,
                                square  = 0,
                                indent  = [],
                                parse   = [],
                                pad     = function markup_beauty__apply_indentation_pad() {
                                    var ins     = indents,
                                        squares = square;
                                    if (squares === 0) {
                                        return ins;
                                    }
                                    do {
                                        ins     += tab;
                                        squares -= 1;
                                    } while (squares > 0);
                                    return ins;
                                };
                            for (a = 0; a < loopEnd; a += 1) {
                                indent.push(tab);
                            }
                            if (cinfo[i] === "mixed_both" && mwrap === 0) {
                                item = item.slice(0, item.length - 1);
                            }
                            indents = indent.join("");
                            item    = "\n" + indents + item;
                            if (cinfo[i] === "parse" && (/\[\s*</).test(build[i])) {
                                build[i] = build[i].replace(/\[\s+</g, "[<");
                                parse    = build[i].split("");
                                loopEnd  = parse.length;
                                for (a = 0; a < loopEnd; a += 1) {
                                    if (parse[a] === "[") {
                                        square   += 1;
                                        parse[a] = "[\n" + pad();
                                    } else if (parse[a] === "]") {
                                        square   -= 1;
                                        parse[a] = "\n" + pad() + "]";
                                    } else if (parse[a] === "<" && loopEnd > a + 3 && parse[a + 1] === "!" && parse[a + 2] === "-" && parse[a + 3] === "-") {
                                        if (a === 0 || parse[a - 1].charAt(0) !== "[") {
                                            parse[a] = "\n" + pad() + "<";
                                        }
                                        for (b = a + 4; b < loopEnd; b += 1) {
                                            if (parse[b - 2] === "-" && parse[b - 1] === "-" && parse[b] === ">") {
                                                a = b;
                                                break;
                                            }
                                        }
                                    } else if (parse[a] === "<" && (a === 0 || parse[a - 1].charAt(0) !== "[")) {
                                        parse[a] = "\n" + pad() + "<";
                                    }
                                }
                                item = parse.join("").replace(/\s>/g, ">");
                            }
                            if (cinfo[i] === "comment" && build[i].indexOf("\n") > 0 && mcomm !== "noindent") {
                                item = comment(item);
                            }
                            return item;
                        },
                        end_math   = function markup_beauty__apply_end(item) {
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
                            item = "\n" + indent.join("") + item;
                            return item;
                        },
                        style_math = function markup_beauty__apply_style(item) {
                            var a       = 0,
                                b       = 0,
                                counter = 0,
                                ins     = "",
                                indent  = [];
                            if (level[i - 1] === "x") {
                                for (a = i - 1; a > 0; a -= 1) {
                                    if (cinfo[a] === "start") {
                                        counter += 1;
                                    } else if (cinfo[a] === "end") {
                                        counter -= 1;
                                    }
                                    if (level[a] !== "x") {
                                        break;
                                    }
                                }
                                if (cinfo[a] === "end") {
                                    counter += 1;
                                }
                                for (b = 0; b < level[a] + counter; b += 1) {
                                    indent.push(tab);
                                }
                            } else {
                                for (b = 0; b < level[i - 1] + 1; b += 1) {
                                    indent.push(tab);
                                }
                            }
                            ins = indent.join("");
                            return "\n" + ins + item.replace(/\n(?!\n)/g, "\n" + ins);
                        },
                        text_wrap  = function markup_beauty__apply_wrap() {
                            var a                = 0,
                                itemLengthNative = 0,
                                item             = build[i].replace(/^(\s+)/, "").replace(/(\s+)$/, "").split(" "),
                                itemLength       = item.length - 1,
                                output           = [item[0]],
                                firstLen         = item[0].length,
                                ind              = (function markup_beauty__apply_wrap_ind() {
                                    var b       = 0,
                                        tabs    = [],
                                        levels  = level[i],
                                        counter = 0;
                                    if (cinfo[i - 1] === "end" && level[i - 1] === "x") {
                                        for (b = i - 1; b > -1; b -= 1) {
                                            if (cinfo[b] === "end") {
                                                counter += 1;
                                            }
                                            if (cinfo[b] === "start") {
                                                counter -= 1;
                                            }
                                            if (counter === -1 && cinfo[b] === "start") {
                                                if (i > b + 2 && level[b + 2] !== "x") {
                                                    return indents;
                                                }
                                                return indents + tab;
                                            }
                                        }
                                    }
                                    for (b = i - 1; b > -1; b -= 1) {
                                        if (token[b] === "T_content" || (cinfo[b] === "end" && level[b] !== "x")) {
                                            if (cinfo[b] === "end" && level[i] !== "x" && level[i] !== indents.length / tab.length) {
                                                for (b = 0; b < levels; b += 1) {
                                                    tabs.push(tab);
                                                }
                                                return tabs.join("");
                                            }
                                            return indents;
                                        }
                                        if (cinfo[b] !== "singleton" && cinfo[b] !== "end") {
                                            if (cinfo[b] === "start" && cinfo[b - 1] === "end" && b === i - 1 && level[b] === "x") {
                                                return indents;
                                            }
                                            return indents + tab;
                                        }
                                    }
                                }());
                            if (itemLength === 0) {
                                return;
                            }
                            if (level[i] === "x") {
                                for (a = i - 1; a > -1; a -= 1) {
                                    if (level[a] !== "x") {
                                        itemLengthNative += build[a].replace(indents, "").length;
                                        break;
                                    }
                                    itemLengthNative += build[a].length;
                                }
                            }
                            firstLen += itemLengthNative;
                            if (itemLength > 0 && item[0] !== "") {
                                if (firstLen + item[1].length > mwrap) {
                                    output.push("\n");
                                    output.push(ind);
                                    firstLen = 0;
                                } else {
                                    output.push(" ");
                                }
                            }
                            for (a = 1; a < itemLength; a += 1) {
                                output.push(item[a]);
                                if (item[a].length + item[a + 1].length + 1 + firstLen > mwrap) {
                                    output.push("\n");
                                    output.push(ind);
                                    firstLen = 0;
                                } else {
                                    output.push(" ");
                                    firstLen += 1 + item[a].length;
                                }
                            }
                            if (output.length > 1) {
                                output.pop();
                            }
                            if (output[output.length - 1] !== "\n" && i < end - 1 && level[i + 1] === "x") {
                                firstLen += build[i + 1].length;
                            }
                            if (firstLen + item[itemLength].length > mwrap) {
                                output.push("\n");
                                output.push(ind);
                            } else if (firstLen === 0) {
                                output.push(ind);
                            } else {
                                output.push(" ");
                            }
                            output.push(item[itemLength]);
                            build[i] = output.join("");
                        };
                    for (i = 0; i < end; i += 1) {
                        if (mwrap > 0 && (cinfo[i] === "content" || cinfo[i] === "mixed_start" || cinfo[i] === "mixed_both" || cinfo[i] === "mixed_end")) {
                            text_wrap(build[i]);
                        }
                        if (build[i] === "</prettydiffli>" || build[i] === " </prettydiffli>") {
                            build[i] = "";
                        } else if (cinfo[i] === "end" && (mforce === true || (cinfo[i - 1] !== "content" && cinfo[i - 1] !== "mixed_start"))) {
                            if (build[i].charAt(0) === " ") {
                                build[i] = build[i].substr(1);
                            }
                            if (level[i] !== "x" && cinfo[i - 1] !== "start") {
                                build[i] = end_math(build[i]);
                            }
                        } else if (cinfo[i] === "external" && mstyle === "indent" && build[i - 1].toLowerCase().indexOf("<style") > -1) {
                            build[i] = style_math(build[i]);
                        } else if (level[i] !== "x" && (cinfo[i - 1] !== "content" && (cinfo[i - 1] !== "mixed_start" || mforce === true))) {
                            if (build[i].charAt(0) === " ") {
                                build[i] = build[i].substr(1);
                            }
                            build[i] = tab_math(build[i]);
                        } else if (cinfo[i] === "comment" && build[i].indexOf("\n") > 0 && mcomm !== "noindent" && level[i] === "x") {
                            build[i] = comment(build[i]);
                        }
                    }
                }());
                if (summary !== "diff") {
                    (function markup_beauty__report() {
                        var requests        = [],
                            lengthToken     = sum.length,
                            lengthChars     = sum.join("").length,
                            stats           = (function markup_beauty__report_tagTypesCount() {
                                var a          = 0,
                                    types      = [
                                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                    ],
                                    chars      = [
                                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                    ],
                                    totalTypes = [
                                        0, 0, 0, 0
                                    ],
                                    totalChars = [],
                                    avgTypes   = [],
                                    avgChars   = [];
                                for (a = 0; a < lengthToken; a += 1) {
                                    switch (cinfo[a]) {
                                    case "end":
                                        types[1]      += 1;
                                        totalTypes[0] += 1;
                                        chars[1]      += sum[a].length;
                                        if (sum[a].charAt(0) === " " && cinfo[a - 1] === "singleton") {
                                            chars[1] -= 1;
                                            chars[2] += 1;
                                        }
                                        break;
                                    case "singleton":
                                        types[2]      += 1;
                                        totalTypes[0] += 1;
                                        chars[2]      += sum[a].length;
                                        if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            requests.push(build[a]);
                                        }
                                        break;
                                    case "comment":
                                        types[3]      += 1;
                                        totalTypes[0] += 1;
                                        chars[3]      += sum[a].length;
                                        break;
                                    case "content":
                                        types[4]      += 1;
                                        totalTypes[1] += 1;
                                        chars[4]      += sum[a].length;
                                        break;
                                    case "mixed_start":
                                        types[5]      += 1;
                                        totalTypes[1] += 1;
                                        chars[5]      += (sum[a].length - 1);
                                        break;
                                    case "mixed_end":
                                        types[6]      += 1;
                                        totalTypes[1] += 1;
                                        chars[6]      += (sum[a].length - 1);
                                        break;
                                    case "mixed_both":
                                        types[7]      += 1;
                                        totalTypes[1] += 1;
                                        chars[7]      += (sum[a].length - 2);
                                        break;
                                    case "parse":
                                        types[10] += 1;
                                        chars[10] += sum[a].length;
                                        break;
                                    case "external":
                                        types[17]     += 1;
                                        totalTypes[2] += 1;
                                        chars[17]     += sum[a].length;
                                        if (((build[a].indexOf("<script") !== -1 || build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            requests.push(build[a]);
                                        }
                                        break;
                                    default:
                                        switch (token[a]) {
                                        case "T_tag_start":
                                            types[0]      += 1;
                                            totalTypes[0] += 1;
                                            chars[0]      += sum[a].length;
                                            if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                                requests.push(build[a]);
                                            }
                                            break;
                                        case "T_sgml":
                                            types[8] += 1;
                                            chars[8] += sum[a].length;
                                            break;
                                        case "T_xml":
                                            types[9] += 1;
                                            chars[9] += sum[a].length;
                                            break;
                                        case "T_ssi":
                                            types[11]     += 1;
                                            totalTypes[3] += 1;
                                            chars[11]     += sum[a].length;
                                            break;
                                        case "T_asp":
                                            types[12]     += 1;
                                            totalTypes[3] += 1;
                                            chars[12]     += sum[a].length;
                                            break;
                                        case "T_php":
                                            types[13]     += 1;
                                            totalTypes[3] += 1;
                                            chars[13]     += sum[a].length;
                                            break;
                                        case "T_script":
                                            types[15]     += 1;
                                            totalTypes[2] += 1;
                                            chars[15]     += sum[a].length;
                                            if (build[a].indexOf(" src") !== -1) {
                                                requests.push(build[a]);
                                            }
                                            break;
                                        case "T_style":
                                            types[16]     += 1;
                                            totalTypes[2] += 1;
                                            chars[16]     += sum[a].length;
                                            break;
                                        }
                                    }
                                }
                                totalChars.push(chars[0] + chars[1] + chars[2] + chars[3]);
                                totalChars.push(chars[4] + chars[5] + chars[6] + chars[7]);
                                totalChars.push(chars[15] + chars[16] + chars[17]);
                                totalChars.push(chars[11] + chars[12] + chars[13]);
                                avgTypes = [
                                    totalTypes[0], totalTypes[0], totalTypes[0], totalTypes[0], totalTypes[1], totalTypes[1], totalTypes[1], totalTypes[1], types[10], types[10], types[10], totalTypes[3], totalTypes[3], totalTypes[3], totalTypes[3], totalTypes[2], totalTypes[2], totalTypes[2]
                                ];
                                avgChars = [
                                    totalChars[0], totalChars[0], totalChars[0], totalChars[0], totalChars[1], totalChars[1], totalChars[1], totalChars[1], chars[10], chars[10], chars[10], totalChars[3], totalChars[3], totalChars[3], totalChars[3], totalChars[2], totalChars[2], totalChars[2]
                                ];
                                types[2] = types[2] - totalTypes[3];
                                chars[2] = chars[2] - totalChars[3];
                                return [
                                    types, chars, totalTypes, totalChars, avgTypes, avgChars
                                ];
                            }()),
                            goodOrBad       = function markup_beauty__report_goodOrBad(x) {
                                var extreme1 = function markup_beauty__report_goodOrBad_extreme1(x) {
                                        if (stats[3][x] === 0) {
                                            return "0.00%";
                                        }
                                        return "100.00%";
                                    },
                                    extreme2 = function markup_beauty__report_goodOrBad_extreme2(x) {
                                        if (stats[2][x] === 0) {
                                            return "0.00%";
                                        }
                                        return "100.00%";
                                    },
                                    output   = [],
                                    types    = "",
                                    chars    = "";
                                switch (x) {
                                case 0:
                                    if ((stats[2][x] / lengthToken) < 0.7) {
                                        types = "bad";
                                    } else {
                                        types = "good";
                                    }
                                    if ((stats[3][x] / lengthChars) > 0.4) {
                                        chars = "bad";
                                    } else {
                                        chars = "good";
                                    }
                                    break;
                                case 1:
                                    if ((stats[2][x] / lengthToken) < 0.25) {
                                        types = "bad";
                                    } else {
                                        types = "good";
                                    }
                                    if ((stats[3][x] / lengthChars) < 0.6) {
                                        chars = "bad";
                                    } else {
                                        chars = "good";
                                    }
                                    break;
                                case 2:
                                    if ((stats[2][x] / lengthToken) > 0.05) {
                                        types = "bad";
                                    } else {
                                        types = "good";
                                    }
                                    if ((stats[3][x] / lengthChars) > 0.05) {
                                        chars = "bad";
                                    } else {
                                        chars = "good";
                                    }
                                    break;
                                }
                                output = ["</th><td>"];
                                output.push(stats[2][x]);
                                output.push("</td><td>");
                                output.push(extreme2(x));
                                output.push("</td><td class='");
                                output.push(types);
                                output.push("'>");
                                output.push(((stats[2][x] / lengthToken) * 100).toFixed(2));
                                output.push("%</td><td>");
                                output.push(stats[3][x]);
                                output.push("</td><td>");
                                output.push(extreme1(x));
                                output.push("</td><td class='");
                                output.push(chars);
                                output.push("'>");
                                output.push(((stats[3][x] / lengthChars) * 100).toFixed(2));
                                output.push("%</td></tr>");
                                return output.join("");
                            },
                            tables          = (function markup_beauty__report_buildOutput() {
                                var a             = 0,
                                    requestOutput = "",
                                    requestList   = [],
                                    requestItem   = [],
                                    requestLength = requests.length,
                                    resultsTable  = (function markup_beauty__report_buildOutput_resultTable() {
                                        var b            = 0,
                                            output       = [
                                                "*** Start Tags", "End Tags", "Singleton Tags", "Comments", "Flat String", "String with Space at Start", "String with Space at End", "String with Space at Start and End", "SGML", "XML", "Total Parsing Declarations", "SSI", "ASP", "PHP", "Total Server Side Tags", "*** Script Tags", "*** Style Tags", "JavaScript/CSS Code"
                                            ],
                                            section      = [],
                                            percentTypes = "",
                                            percentChars = "",
                                            length       = stats[0].length;
                                        for (b = 0; b < length; b += 1) {
                                            if (stats[4][b] === 0) {
                                                percentTypes = "0.00%";
                                            } else if (stats[0][b] === stats[4][b]) {
                                                percentTypes = "100.00%";
                                            } else {
                                                percentTypes = ((stats[0][b] / stats[4][b]) * 100).toFixed(2) + "%";
                                            }
                                            if (stats[5][b] === 0) {
                                                percentChars = "0.00%";
                                            } else if (stats[1][b] === stats[5][b]) {
                                                percentChars = "100.00%";
                                            } else {
                                                percentChars = ((stats[1][b] / stats[5][b]) * 100).toFixed(2) + "%";
                                            }
                                            section = ["<tr><th>" + output[b]];
                                            section.push("</th><td>");
                                            section.push(stats[0][b]);
                                            section.push("</td><td>");
                                            section.push(percentTypes);
                                            section.push("</td><td>");
                                            section.push(((stats[0][b] / lengthToken) * 100).toFixed(2));
                                            section.push("%</td><td>");
                                            section.push(stats[1][b]);
                                            section.push("</td><td>");
                                            section.push(percentChars);
                                            section.push("</td><td>");
                                            section.push(((stats[1][b] / lengthChars) * 100).toFixed(2));
                                            section.push("%</td></tr>");
                                            if (b === 3) {
                                                section.push("<tr><th>Total Common Tags");
                                                section.push(goodOrBad(0));
                                                section.push("<tr><th colspan='7'>Content</th></tr>");
                                            } else if (b === 7) {
                                                section.push("<tr><th>Total Content");
                                                section.push(goodOrBad(1));
                                                section.push("<tr><th colspan='7'>Parsing Declarations</th></tr>");
                                            } else if (b === 10) {
                                                section.push("<tr><th colspan='7'>Server Side Tags</th></tr>");
                                            } else if (b === 14) {
                                                section.push("<tr><th colspan='7'>Style and Script Code/Tags</th></tr>");
                                            } else if (b === 17) {
                                                section.push("<tr><th>Total Script and Style Tags/Code");
                                                section.push(goodOrBad(2));
                                            }
                                            output[b] = section.join("");
                                        }
                                        return output.join("");
                                    }()),
                                    report        = ["<div id='doc'>"];
                                report.push((function markup_beauty__report_buildOutput_content() {
                                    var b            = 0,
                                        c            = 0,
                                        d            = 0,
                                        length       = lengthToken,
                                        words        = [],
                                        word         = "",
                                        zipf         = [],
                                        wordCount    = 0,
                                        spacer       = [],
                                        wordAnalyzer = [],
                                        topTen       = [],
                                        ratio        = [],
                                        wordList     = [],
                                        wordString   = "",
                                        punctuation  = function markup_beauty__report_buildOutput_punctuation(y) {
                                            return y.replace(/(\,|\.|\?|\!|\:) /, " ");
                                        };
                                    for (b = 0; b < length; b += 1) {
                                        if (cinfo[b] === "content") {
                                            spacer.push(" ");
                                            spacer.push(build[b]);
                                        } else if (cinfo[b] === "mixed_start") {
                                            spacer.push(build[b]);
                                        } else if (cinfo[b] === "mixed_both") {
                                            spacer.push(build[b].substr(0, build[b].length));
                                        } else if (cinfo[b] === "mixed_end") {
                                            spacer.push(" ");
                                            spacer.push(build[b].substr(0, build[b].length));
                                        }
                                    }
                                    wordString = spacer.join("");
                                    if (wordString.length === 0) {
                                        return "";
                                    }
                                    wordString = wordString.substr(1, wordString.length).toLowerCase();
                                    wordList   = wordString.replace(/\&nbsp;?/gi, " ").replace(/[a-z](\,|\.|\?|\!|\:) /gi, punctuation).replace(/(\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").split(" ");
                                    length     = wordList.length;
                                    for (b = 0; b < length; b += 1) {
                                        if (wordList[b] !== "") {
                                            words.push([
                                                1, wordList[b].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            ]);
                                            wordCount += 1;
                                            for (c = b + 1; c < length; c += 1) {
                                                if (wordList[c] === wordList[b]) {
                                                    words[words.length - 1][0] += 1;
                                                    wordList[c]                = "";
                                                    wordCount                  += 1;
                                                }
                                            }
                                        }
                                    }
                                    length = words.length;
                                    for (b = 0; b < length; b += 1) {
                                        d = b;
                                        for (c = b + 1; c < length; c += 1) {
                                            if (words[c][0] > words[d][0] && words[c][1] !== "") {
                                                d = c;
                                            }
                                        }
                                        word = words[d][1];
                                        if (word.length < 3 || word.length > 30 || (/&\#?\w+;/).test(word) === true || word === "the" || word === "and" || word === "for" || word === "are" || word === "this" || word === "from" || word === "with" || word === "that" || word === "to") {
                                            wordAnalyzer.push(words[d]);
                                        } else {
                                            wordAnalyzer.push(words[d]);
                                            topTen.push(words[d]);
                                        }
                                        if (words[d] !== words[b]) {
                                            words[d] = words[b];
                                        } else {
                                            words[d] = [
                                                0, ""
                                            ];
                                        }
                                        if (topTen.length === 11) {
                                            break;
                                        }
                                    }
                                    if (wordAnalyzer.length < 2) {
                                        return "";
                                    }
                                    c = wordAnalyzer.length;
                                    for (b = 0; b < c; b += 1) {
                                        if (b > 9) {
                                            wordAnalyzer[b] = "";
                                        } else {
                                            ratio[b]        = (wordAnalyzer[b + 1]) ? (wordAnalyzer[b][0] / wordAnalyzer[b + 1][0]).toFixed(2) : "1.00";
                                            wordAnalyzer[b] = "<tr><th>" + (b + 1) + "</th><td>" + wordAnalyzer[b][1] + "</td><td>" + wordAnalyzer[b][0] + "</td><td>" + ratio[b] + "</td><td>" + ((wordAnalyzer[b][0] / wordCount) * 100).toFixed(2) + "%</td></tr>";
                                        }
                                    }
                                    if (wordAnalyzer[10]) {
                                        wordAnalyzer[10] = "";
                                    }
                                    if (topTen.length > 10) {
                                        c = 10;
                                    } else {
                                        c = topTen.length;
                                    }
                                    ratio = [];
                                    for (b = 0; b < c; b += 1) {
                                        ratio[b]  = (topTen[b + 1]) ? (topTen[b][0] / topTen[b + 1][0]).toFixed(2) : "1.00";
                                        topTen[b] = "<tr><th>" + (b + 1) + "</th><td>" + topTen[b][1] + "</td><td>" + topTen[b][0] + "</td><td>" + ratio[b] + "</td><td>" + ((topTen[b][0] / wordCount) * 100).toFixed(2) + "%</td></tr>";
                                    }
                                    if (topTen[10]) {
                                        topTen[10] = "";
                                    }
                                    if (c > 10) {
                                        topTen[topTen.length - 1] = "";
                                    }
                                    zipf.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrates <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content and the number of times they occurred.</caption>");
                                    zipf.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Percentage from ");
                                    zipf.push(wordCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                    if (wordCount > 1) {
                                        zipf.push(" Total");
                                    }
                                    zipf.push(" Word");
                                    if (wordCount > 1) {
                                        zipf.push("s");
                                    }
                                    word       = wordAnalyzer.join("");
                                    wordString = topTen.join("");
                                    zipf.push("</th></tr></thead><tbody><tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                                    zipf.push(word);
                                    if (word !== wordString && topTen.length > 2) {
                                        zipf.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                        zipf.push(wordString);
                                    }
                                    zipf.push("</tbody></table>");
                                    return zipf.join("");
                                }()));
                                report.push("<table class='analysis' summary='Analysis of markup pieces.'><caption>Analysis of markup pieces.</caption><thead><tr><th>Type</th><th>Quantity of Tags/Content</th><th>Percentage Quantity in Section</th><th>Percentage Quantity of Total</th><th>** Character Size</th><th>Percentage Size in Section</th><th>Percentage Size of Total</th></tr></thead><tbody><tr><th>Total Pieces</th><td>");
                                report.push(lengthToken);
                                report.push("</td><td>100.00%</td><td>100.00%</td><td>");
                                report.push(lengthChars);
                                report.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Common Tags</th></tr>");
                                report.push(resultsTable);
                                requestList = [];
                                for (a = 0; a < requestLength; a += 1) {
                                    if (requests[a] !== undefined) {
                                        requestItem = ["<li>"];
                                        requestItem.push(requests[a].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;"));
                                        requestItem.push("</li>");
                                        requestList[a] = requestItem.join("");
                                    }
                                }
                                if (requestList.length > 0) {
                                    requestOutput = "<h4>HTML elements making HTTP requests:</h4><ul>" + requestList.join("") + "</ul>";
                                } else {
                                    requestOutput = "";
                                }
                                report.push("</tbody></table></div><p>* The number of requests is determined from the input submitted only and does not count the additional HTTP requests supplied from dynamically executed code, frames, iframes, css, or other external entities.</p><p>**");
                                report.push("Character size is measured from the individual pieces of tags and content specifically between minification and beautification.</p><p>*** The number of starting &lt;script&gt; and &lt;style&gt; tags is subtracted from the total number of start tags.");
                                report.push("The combination of those three values from the table above should equal the number of end tags or the code is in error.</p>");
                                report.push(requestOutput);
                                return report.join("");
                            }()),
                            score           = (function markup_beauty__report_efficiencyScore() {
                                var charMath    = lengthChars / 7500,
                                    charFixed   = Number(charMath.toFixed(2)),
                                    reqLen      = requests.length,
                                    reduction   = 0,
                                    output      = ["<p>If the input is content it receives an efficiency score of <strong>"],
                                    normScript  = "",
                                    normContent = "",
                                    appScript   = "",
                                    appContent  = "",
                                    ratioMath   = function markup_beauty__report_ratios(x, y) {
                                        return (((stats[3][0] + x) / lengthChars) / ((stats[3][1] * y) / lengthChars));
                                    };
                                if (charMath > 0) {
                                    charMath = (reqLen - charFixed) * 4;
                                } else {
                                    charMath = 0;
                                }
                                if (stats[3][1] === 0) {
                                    stats[2][1] = 0.00000001;
                                    stats[3][1] = 0.00000001;
                                }
                                reduction   = (((stats[2][0] + stats[2][2] - charFixed) / lengthToken) / (stats[2][1] / lengthToken));
                                normScript  = (reduction / ratioMath(stats[3][2], 1)).toPrecision(2);
                                normContent = (reduction / ratioMath(stats[1][15], 1)).toPrecision(2);
                                appScript   = (reduction / ratioMath(stats[3][2], 4)).toPrecision(2);
                                appContent  = (reduction / ratioMath(stats[1][15], 4)).toPrecision(2);
                                if (normScript === normContent) {
                                    normContent = "";
                                    appContent  = "";
                                } else {
                                    normContent = ", or <strong>" + normContent + "</strong> if inline script code and style tags are removed";
                                    appContent  = ", or <strong>" + appContent + "</strong> if inline script code and style tags are removed";
                                }
                                output.push(normScript);
                                output.push("</strong>");
                                output.push(normContent);
                                output.push(". The efficiency score if this input is a large form or application is <strong>");
                                output.push(appScript);
                                output.push("</strong>");
                                output.push(appContent);
                                output.push(". Efficient markup achieves scores higher than 2.00 and excellent markup achieves scores higher than 4.00. The score reflects the highest number of tags to pieces of content where the weight of those tags is as small as possible compared to the weight of the content.");
                                output.push("The score is a performance metric only and is not associated with validity or well-formedness, but semantic code typically achieves the highest scores. All values are rounded to the nearest hundreth.</p><p><strong>Total input size:</strong> <em>");
                                output.push(args.source.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                output.push("</em> characters</p><p><strong>Total output size:</strong> <em>");
                                output.push(build.join("").length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                                output.push("</em> characters</p><p><strong>* Total number of HTTP requests in supplied HTML:</strong> <em>");
                                output.push(reqLen);
                                output.push("</em></p>");
                                return output.join("");
                            }()),
                            summaryLanguage = (function markup_beauty__report_summary() {
                                var startTags = 0,
                                    output    = ["<p><strong>"],
                                    plural    = "";
                                if (stats[0][0] + stats[0][15] + stats[0][16] !== stats[0][1]) {
                                    plural    = "s";
                                    startTags = (stats[0][0] + stats[0][15] + stats[0][16]) - stats[0][1];
                                    if (startTags > 0) {
                                        if (startTags === 1) {
                                            plural = "";
                                        }
                                        output.push(startTags);
                                        output.push(" more start tag");
                                        output.push(plural);
                                        output.push(" than end tag");
                                        output.push(plural);
                                        output.push("!");
                                    } else {
                                        if (startTags === -1) {
                                            plural = "";
                                        }
                                        output.push(startTags * -1);
                                        output.push(" more end tag");
                                        output.push(plural);
                                        output.push(" than start tag");
                                        output.push(plural);
                                        output.push("!");
                                    }
                                    output.push("</strong> The combined total number of start tags, script tags, and style tags should equal the number of end tags. For HTML this problem may be solved by selecting the '<em>Presume SGML type HTML</em>' option.</p>");
                                } else {
                                    return "";
                                }
                                return output.join("");
                            }());
                        summary = summaryLanguage + score + tables;
                    }());
                }
                return build.join("").replace(/^\s+/, "");
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
                    inline        = (args.inline === true || args.inline === "true") ? true : false,
                    tab           = (function diffview__tab() {
                        var a      = 0,
                            output = [];
                        if (tchar === "") {
                            return "";
                        }
                        for (a = 0; a < tsize; a += 1) {
                            output.push(tchar);
                        }
                        return output.join("");
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
                    baseTextArray = stringAsLines(baseTextLines),
                    newTextArray  = stringAsLines(newTextLines),
                    opcodes       = (function diffview__opcodes() {
                        var junkdict            = {},
                            isbjunk             = function diffview__opcodes_isbjunk(key) {
                                if (junkdict.hasOwnProperty(key)) {
                                    return junkdict[key];
                                }
                            },
                            sourceFirst         = [],
                            sourceSecond        = [],
                            secondInContext     = [],
                            reverse             = false,
                            matching_blocks     = [],
                            answer              = [],
                            get_matching_blocks = function diffview__opcodes_getMatchingBlocks() {
                                var a                  = 0,
                                    matchingLen        = 0,
                                    lowFirst           = 0,
                                    highFirst          = 0,
                                    lowSecond          = 0,
                                    highSecond         = 0,
                                    bestLongestFirst   = 0,
                                    bestLongestSecond  = 0,
                                    bestLongestSize    = 0,
                                    matchFirstPrior    = 0,
                                    matchFirstNew      = 0,
                                    matchSecondPrior   = 0,
                                    matchSecondNew     = 0,
                                    matchSizePrior     = 0,
                                    matchSizeNew       = 0,
                                    sourceFirstLength  = sourceFirst.length,
                                    sourceSecondLength = sourceSecond.length,
                                    matchInstance      = [],
                                    queueInstance      = [],
                                    non_adjacent       = [],
                                    queue              = [
                                        [
                                            0, sourceFirstLength, 0, sourceSecondLength
                                        ]
                                    ],
                                    matchingSort       = function diffview__opcodes_getMatchingBlocks_ntuplecomp(x, y) {
                                        var b   = 0,
                                            end = Math.max(x.length, y.length);
                                        for (b = 0; b < end; b += 1) {
                                            if (x[b] < y[b]) {
                                                return -1;
                                            }
                                            if (x[b] > y[b]) {
                                                return 1;
                                            }
                                        }
                                        return (x.length === y.length) ? 0 : ((x.length < y.length) ? -1 : 1);
                                    },
                                    find_longest_match = function diffview__opcodes_getMatchingBlocks_findLongestMatch(lowFirst, highFirst, lowSecond, highSecond) {
                                        var b                   = 0,
                                            c                   = 0,
                                            sContextLength      = secondInContext.length,
                                            sContextCompareLine = 0,
                                            distance            = 0,
                                            priorLine           = [
                                                0, 0
                                            ],
                                            bestFirst           = lowFirst,
                                            bestSecond          = lowSecond,
                                            bestsize            = 0;
                                        for (b = lowFirst; b < highFirst; b += 1) {
                                            for (c = 0; c < sContextLength; c += 1) {
                                                if (secondInContext[c][1] === sourceFirst[b] && (sourceFirst[b] !== sourceSecond[b] || b === highFirst - 1 || sourceFirst[b + 1] === sourceSecond[b + 1])) {
                                                    sContextCompareLine = secondInContext[c][0];
                                                    break;
                                                }
                                            }
                                            if (c !== sContextLength) {
                                                if (sContextCompareLine >= lowSecond) {
                                                    if (sContextCompareLine >= highSecond) {
                                                        break;
                                                    }
                                                    if (priorLine[0] === sContextCompareLine - 1) {
                                                        distance = priorLine[1] + 1;
                                                    } else {
                                                        distance = 1;
                                                    }
                                                    if (distance > bestsize) {
                                                        bestFirst  = b - distance + 1;
                                                        bestSecond = sContextCompareLine - distance + 1;
                                                        bestsize   = distance;
                                                    }
                                                }
                                                priorLine = [
                                                    sContextCompareLine, distance
                                                ];
                                            }
                                        }
                                        while (bestFirst > lowFirst && bestSecond > lowSecond && isbjunk(sourceSecond[bestSecond - 1]) === undefined && sourceFirst[bestFirst - 1] === sourceSecond[bestSecond - 1]) {
                                            bestFirst  -= 1;
                                            bestSecond -= 1;
                                            bestsize   += 1;
                                        }
                                        while (bestFirst + bestsize < highFirst && bestSecond + bestsize < highSecond && isbjunk(sourceSecond[bestSecond + bestsize]) === undefined && sourceFirst[bestFirst + bestsize] === sourceSecond[bestSecond + bestsize]) {
                                            bestsize += 1;
                                        }
                                        while (bestFirst > lowFirst && bestSecond > lowSecond && isbjunk(sourceSecond[bestSecond - 1]) !== undefined && sourceFirst[bestFirst - 1] === sourceSecond[bestSecond - 1]) {
                                            bestFirst  -= 1;
                                            bestSecond -= 1;
                                            bestsize   += 1;
                                        }
                                        while (bestFirst + bestsize < highFirst && bestSecond + bestsize < highSecond && isbjunk(sourceSecond[bestSecond + bestsize]) !== undefined && sourceFirst[bestFirst + bestsize] === sourceSecond[bestSecond + bestsize]) {
                                            bestsize += 1;
                                        }
                                        return [
                                            bestFirst, bestSecond, bestsize
                                        ];
                                    };
                                while (queue.length > 0) {
                                    queueInstance     = queue.pop();
                                    lowFirst          = queueInstance[0];
                                    highFirst         = queueInstance[1];
                                    lowSecond         = queueInstance[2];
                                    highSecond        = queueInstance[3];
                                    matchInstance     = find_longest_match(lowFirst, highFirst, lowSecond, highSecond);
                                    bestLongestFirst  = matchInstance[0];
                                    bestLongestSecond = matchInstance[1];
                                    bestLongestSize   = matchInstance[2];
                                    if (bestLongestSize > 0) {
                                        matching_blocks.push(matchInstance);
                                        if (lowFirst < bestLongestFirst && lowSecond < bestLongestSecond) {
                                            queue.push([
                                                lowFirst, bestLongestFirst, lowSecond, bestLongestSecond
                                            ]);
                                        }
                                        if (bestLongestFirst + bestLongestSize < highFirst && bestLongestSecond + bestLongestSize < highSecond) {
                                            queue.push([
                                                bestLongestFirst + bestLongestSize, highFirst, bestLongestSecond + bestLongestSize, highSecond
                                            ]);
                                        }
                                    }
                                }
                                matching_blocks.sort(matchingSort);
                                matchingLen = matching_blocks.length;
                                for (a = 0; a < matchingLen; a += 1) {
                                    matchFirstNew  = matching_blocks[a][0];
                                    matchSecondNew = matching_blocks[a][1];
                                    matchSizeNew   = matching_blocks[a][2];
                                    if (matchFirstPrior + matchSizePrior === matchFirstNew && matchSecondPrior + matchSizePrior === matchSecondNew) {
                                        matchSizePrior += matchSizeNew;
                                    } else {
                                        if (matchSizePrior > 0) {
                                            non_adjacent.push([
                                                matchFirstPrior, matchSecondPrior, matchSizePrior
                                            ]);
                                        }
                                        matchFirstPrior  = matchFirstNew;
                                        matchSecondPrior = matchSecondNew;
                                        matchSizePrior   = matchSizeNew;
                                    }
                                }
                                if (matchSizePrior > 0) {
                                    non_adjacent.push([
                                        matchFirstPrior, matchSecondPrior, matchSizePrior
                                    ]);
                                }
                                non_adjacent.push([
                                    sourceFirstLength, sourceSecondLength, 0
                                ]);
                                return non_adjacent;
                            };
                        if (baseTextLines === "" || newTextLines === "") {
                            return "";
                        }
                        (function diffview__opcodes_diffArray() {
                            (function diffview__opcodes_diffArray_determineReverse() {
                                if (baseTextArray.length > newTextArray.length) {
                                    reverse      = true;
                                    sourceFirst  = newTextArray;
                                    sourceSecond = baseTextArray;
                                } else {
                                    sourceFirst  = baseTextArray;
                                    sourceSecond = newTextArray;
                                }
                            }());
                            (function diffview__opcodes_diffArray_clarity() {
                                var a          = 0,
                                    b          = 0,
                                    sourceLine = "",
                                    ssLen      = sourceSecond.length;
                                for (a = 0; a < ssLen; a += 1) {
                                    sourceLine = sourceSecond[a];
                                    for (b = secondInContext.length - 1; b > -1; b -= 1) {
                                        if (secondInContext[b][1] === sourceLine) {
                                            break;
                                        }
                                    }
                                    if (b > -1) {
                                        if (ssLen >= 200 && 100 > ssLen) {
                                            secondInContext.splice(b, 1);
                                        }
                                    } else {
                                        secondInContext.push([
                                            a, sourceLine
                                        ]);
                                    }
                                }
                            }());
                            (function diffview__opcodes_diffArray_algorithm() {
                                var a              = 0,
                                    matchingFirst  = 0,
                                    matchingSecond = 0,
                                    matchingSize   = 0,
                                    tag            = "",
                                    firstSize      = 0,
                                    secondSize     = 0,
                                    blocks         = get_matching_blocks(),
                                    blockLength    = blocks.length,
                                    closerMatch    = function diffview__opcodes_diffArray_algorithm_closerMatch(current, next, compare) {
                                        var diffspot       = function diffview__opcodes_diffArray_algorithm_closerMatch_diffspot(test, base) {
                                                var b           = 0,
                                                    cleanedTest = test.replace(/^(\s+)/, "").split(""),
                                                    minSize     = Math.min(cleanedTest.length, base.length);
                                                for (b = 0; b < minSize; b += 1) {
                                                    if (cleanedTest[b] !== base[b]) {
                                                        return b;
                                                    }
                                                }
                                                return b;
                                            },
                                            cleanedCompare = compare.replace(/^(\s+)/, "").split(""),
                                            test           = diffspot(next, cleanedCompare) - diffspot(current, cleanedCompare);
                                        if (test > 0) {
                                            return true;
                                        }
                                        return false;
                                    };
                                for (a = 0; a < blockLength; a += 1) {
                                    matchingFirst  = blocks[a][0];
                                    matchingSecond = blocks[a][1];
                                    matchingSize   = blocks[a][2];
                                    tag            = "";
                                    if (firstSize < matchingFirst && secondSize < matchingSecond) {
                                        if (firstSize - secondSize !== matchingFirst - matchingSecond && secondSize - matchingSecond < 3 && firstSize - matchingFirst < 3) {
                                            if (reverse === true && firstSize - matchingFirst > secondSize - matchingSecond) {
                                                if (closerMatch(sourceSecond[secondSize], sourceSecond[secondSize + 1], sourceFirst[firstSize]) === true) {
                                                    answer.push([
                                                        "delete", secondSize, secondSize + 1, firstSize, firstSize
                                                    ]);
                                                    answer.push([
                                                        "replace", secondSize + 1, matchingSecond, firstSize, matchingFirst
                                                    ]);
                                                } else {
                                                    answer.push([
                                                        "replace", secondSize, matchingSecond, firstSize, matchingFirst
                                                    ]);
                                                }
                                            } else if (reverse === false && matchingSecond - secondSize > matchingFirst - firstSize) {
                                                if (closerMatch(sourceSecond[secondSize], sourceSecond[secondSize + 1], sourceFirst[firstSize]) === true) {
                                                    answer.push([
                                                        "insert", firstSize, firstSize, secondSize, secondSize + 1
                                                    ]);
                                                    answer.push([
                                                        "replace", firstSize, matchingFirst, secondSize + 1, matchingSecond
                                                    ]);
                                                } else {
                                                    answer.push([
                                                        "replace", firstSize, matchingFirst, secondSize, matchingSecond
                                                    ]);
                                                }
                                            } else {
                                                tag = "replace";
                                            }
                                        } else {
                                            tag = "replace";
                                        }
                                    } else if (firstSize < matchingFirst) {
                                        if (reverse === true) {
                                            tag = "insert";
                                        } else {
                                            tag = "delete";
                                        }
                                    } else if (secondSize < matchingSecond) {
                                        if (reverse === true) {
                                            tag = "delete";
                                        } else {
                                            tag = "insert";
                                        }
                                    }
                                    if (tag !== "") {
                                        if (reverse === true) {
                                            answer.push([
                                                tag, secondSize, matchingSecond, firstSize, matchingFirst
                                            ]);
                                        } else {
                                            answer.push([
                                                tag, firstSize, matchingFirst, secondSize, matchingSecond
                                            ]);
                                        }
                                    }
                                    firstSize  = matchingFirst + matchingSize;
                                    secondSize = matchingSecond + matchingSize;
                                    if (matchingSize > 0) {
                                        if (reverse === true) {
                                            answer.push([
                                                "equal", matchingSecond, secondSize, matchingFirst, firstSize
                                            ]);
                                        } else {
                                            answer.push([
                                                "equal", matchingFirst, firstSize, matchingSecond, secondSize
                                            ]);
                                        }
                                    }
                                }
                            }());
                        }());
                        return answer;
                    }());
                return (function diffview__report() {
                    var a              = 0,
                        i              = 0,
                        node           = ["<div class='diff'>"],
                        data           = [
                            [], [], [], []
                        ],
                        baseStart      = 0,
                        baseEnd        = 0,
                        newStart       = 0,
                        newEnd         = 0,
                        rowcnt         = 0,
                        foldcount      = 0,
                        foldstart      = 0,
                        jump           = 0,
                        tabFix         = (tab === "") ? "" : new RegExp("^((" + tab.replace(/\\/g, "\\") + ")+)"),
                        noTab          = function diffview__report_noTab(str) {
                            var b      = 0,
                                strLen = str.length,
                                output = [];
                            for (b = 0; b < strLen; b += 1) {
                                output.push(str[b].replace(tabFix, ""));
                            }
                            return output;
                        },
                        baseTab        = (tab === "") ? [] : noTab(baseTextArray),
                        newTab         = (tab === "") ? [] : noTab(newTextArray),
                        opcodesLength  = opcodes.length,
                        change         = "",
                        btest          = false,
                        ntest          = false,
                        repeat         = false,
                        ctest          = true,
                        code           = [],
                        charcompOutput = [],
                        charcomp       = function diffview__report_charcomp(lineA, lineB) {
                            var b             = 0,
                                c             = 0,
                                d             = 0,
                                e             = 0,
                                dataA         = [],
                                dataB         = [],
                                cleanedA      = lineA.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">"),
                                cleanedB      = lineB.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">"),
                                dataMinLength = 0,
                                matchNextB    = [],
                                mBTest        = false,
                                matchNextA    = [],
                                mATest        = false,
                                lenComp       = [],
                                earlyOut      = false,
                                matchCount    = 0,
                                regStart      = (/_pdiffdiff\_/g),
                                regEnd        = (/_epdiffdiff\_/g),
                                strStart      = "_pdiff" + "diff_",
                                strEnd        = "_epdiff" + "diff_",
                                tabdiff       = (function diffview__report_charcomp_tabdiff() {
                                    var tabMatchA  = "",
                                        tabMatchB  = "",
                                        splitA     = "",
                                        splitB     = "",
                                        analysis   = [],
                                        matchListA = cleanedA.match(tabFix),
                                        matchListB = cleanedB.match(tabFix);
                                    if (matchListA === null || matchListB === null || (matchListA[0] === "" && matchListA.length === 1) || (matchListB[0] === "" && matchListB.length === 1)) {
                                        return [
                                            "", "", cleanedA, cleanedB
                                        ];
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
                                    return [
                                        tabMatchA, tabMatchB, splitA, splitB
                                    ];
                                }());
                            if (cleanedA === cleanedB) {
                                return [
                                    lineA, lineB
                                ];
                            }
                            errorout -= 1;
                            if (tabFix !== "" && cleanedA.length !== cleanedB.length && cleanedA.replace(tabFix, "") === cleanedB.replace(tabFix, "")) {
                                errorout += 1;
                                return [
                                    (tabdiff[0] + tabdiff[2]).replace(/&/g, "&amp;").replace(/</g, "&l" + "t;").replace(/>/g, "&g" + "t;").replace(regStart, "<em>").replace(regEnd, "</em>"), (tabdiff[1] + tabdiff[3]).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>")
                                ];
                            }
                            dataA         = cleanedA.split("");
                            dataB         = cleanedB.split("");
                            dataMinLength = Math.min(dataA.length, dataB.length);
                            for (b = 0; b < dataMinLength; b += 1) {
                                if (dataA[b] === undefined || dataB[b] === undefined) {
                                    break;
                                }
                                if (dataA[b] !== dataB[b]) {
                                    mBTest   = false;
                                    mATest   = false;
                                    earlyOut = false;
                                    lenComp.push(dataMinLength);
                                    lenComp.push(dataMinLength);
                                    dataA[b] = strStart + dataA[b];
                                    dataB[b] = strStart + dataB[b];
                                    errorout += 1;
                                    for (c = b; c < dataMinLength; c += 1) {
                                        if (mBTest === false) {
                                            for (d = c; d < dataMinLength; d += 1) {
                                                if ((dataA[c] === dataB[d] && dataB[c + 1] !== dataB[d - 1]) || dataB[c] === dataA[d]) {
                                                    if (c === b) {
                                                        c -= 1;
                                                    }
                                                    matchNextB.push(c - 1);
                                                    matchNextB.push(d - 1);
                                                    matchCount = (matchNextB[1] - matchNextB[0]);
                                                    if (dataA[matchNextB[1] + matchCount] === dataB[matchNextB[1]] && strStart + dataA.slice(matchNextB[0] + matchCount, matchNextB[1] + matchCount).join("") === dataB.slice(matchNextB[0], matchNextB[1]).join("")) {
                                                        dataA[b + (matchCount - 1)] = dataA[b + (matchCount - 1)] + strEnd;
                                                        dataB[b]                    = dataB[b].replace(strStart, strStart + strEnd);
                                                        do {
                                                            dataB.unshift("");
                                                            matchCount -= 1;
                                                        } while (matchCount > 0);
                                                    } else if (dataB[matchNextB[1] + matchCount] === dataA[matchNextB[1]] && strStart + dataB.slice(matchNextB[0] + matchCount, matchNextB[1] + matchCount).join("") === dataA.slice(matchNextB[0], matchNextB[1]).join("")) {
                                                        dataB[b + (matchCount - 1)] = dataB[b + (matchCount - 1)] + strEnd;
                                                        dataA[b]                    = dataA[b].replace(strStart, strStart + strEnd);
                                                        do {
                                                            dataA.unshift("");
                                                            matchCount -= 1;
                                                        } while (matchCount > 0);
                                                    } else if (dataA[d] === dataB[d]) {
                                                        mBTest = true;
                                                    } else {
                                                        dataA[c - 1] += strEnd;
                                                        dataB[d - 1] += strEnd;
                                                        do {
                                                            dataA.unshift("");
                                                            matchCount -= 1;
                                                        } while (matchCount > 0);
                                                    }
                                                    if (mBTest === false) {
                                                        b             = d;
                                                        dataMinLength += matchCount;
                                                        matchNextB.pop();
                                                        matchNextB.pop();
                                                        lenComp.pop();
                                                        lenComp.pop();
                                                        earlyOut = true;
                                                    }
                                                    break;
                                                }
                                            }
                                            if (earlyOut === true) {
                                                break;
                                            }
                                            if (c === dataMinLength - 1 && d === dataMinLength) {
                                                mBTest = true;
                                            }
                                        }
                                        if (mATest === false) {
                                            for (e = c; e < dataMinLength; e += 1) {
                                                if (dataB[c] === dataA[e]) {
                                                    if (c === b) {
                                                        c -= 1;
                                                    }
                                                    matchNextA.push(e - 1);
                                                    matchNextA.push(c - 1);
                                                    mATest = true;
                                                    break;
                                                }
                                            }
                                            if (c === dataMinLength - 1 && e === dataMinLength) {
                                                mATest = true;
                                            }
                                        }
                                        if (mBTest === true && mATest === true) {
                                            if (e < d) {
                                                lenComp.pop();
                                                lenComp.pop();
                                                lenComp.push(matchNextA[0]);
                                                lenComp.push(matchNextA[1]);
                                            } else if (d < e) {
                                                lenComp.pop();
                                                lenComp.pop();
                                                lenComp.push(matchNextB[0]);
                                                lenComp.push(matchNextB[1]);
                                            } else if (d === e && d < dataMinLength) {
                                                lenComp.pop();
                                                lenComp.pop();
                                                lenComp.push(matchNextB[0]);
                                                lenComp.push(matchNextB[1]);
                                            }
                                            break;
                                        }
                                    }
                                    if (dataB[lenComp[1]] !== undefined && dataA[b + 1] === dataB[lenComp[1]].replace(regStart, "")) {
                                        dataA[b] = dataA[b] + strEnd;
                                        if (lenComp[1] > b + 1) {
                                            dataB[lenComp[1] - 1] = dataB[lenComp[1] - 1] + strEnd;
                                            dataB[lenComp[1]]     = dataB[lenComp[1]].replace(regStart, "");
                                        } else {
                                            dataB[lenComp[1] - 1] = dataB[lenComp[1] - 1].replace(regStart, "") + strStart + strEnd;
                                            dataB[lenComp[1]]     = dataB[lenComp[1]].replace(regStart, "");
                                        }
                                        for (c = (lenComp[1] - 1) - b; c > 0; c -= 1) {
                                            dataA.unshift("");
                                            if (dataA.length < dataB.length) {
                                                dataMinLength += 1;
                                            }
                                        }
                                        if (lenComp[1] < dataMinLength && dataA[b] !== undefined && dataB[b] !== undefined) {
                                            b = lenComp[1];
                                        } else {
                                            b = Math.max(dataA.length, dataB.length);
                                            break;
                                        }
                                    } else if (dataA[b + 1] === dataB[lenComp[0]] && regEnd.test(dataA[b]) === false && regStart.test(dataA[b]) === true) {
                                        dataA[b]              += strEnd;
                                        dataB[lenComp[0] - 1] += strEnd;
                                        for (c = lenComp[0] - (b + 1); c > 0; c -= 1) {
                                            dataA.unshift("");
                                        }
                                        if (lenComp[0] < dataMinLength && dataA[b] !== undefined && dataB[b] !== undefined) {
                                            b = lenComp[0] + 1;
                                        } else {
                                            b = Math.max(dataA.length, dataB.length);
                                            break;
                                        }
                                    }
                                    if (dataA[lenComp[1]] !== undefined && dataB[b + 1] === dataA[lenComp[1]].replace(regStart, "")) {
                                        dataB[b] = dataB[b] + strEnd;
                                        if (lenComp[1] > b + 1) {
                                            dataA[lenComp[1] - 1] = dataA[lenComp[1] - 1] + strEnd;
                                            dataA[lenComp[1]]     = dataA[lenComp[1]].replace(regStart, "");
                                        } else {
                                            dataA[lenComp[1] - 1] = dataA[lenComp[1] - 1].replace(regStart, "") + strStart + strEnd;
                                            dataA[lenComp[1]]     = dataA[lenComp[1]].replace(regStart, "");
                                        }
                                        for (c = (lenComp[1] - 1) - b; c > 0; c -= 1) {
                                            dataB.unshift("");
                                            if (dataB.length < dataA.length) {
                                                dataMinLength += 1;
                                            }
                                        }
                                        if (lenComp[1] < dataMinLength && dataB[b] !== undefined && dataA[b] !== undefined) {
                                            b = lenComp[1];
                                        } else {
                                            b = Math.max(dataA.length, dataB.length);
                                            break;
                                        }
                                    } else if (dataB[b + 1] === dataA[lenComp[0]] && regEnd.test(dataB[b]) === false && regStart.test(dataB[b]) === true) {
                                        dataB[b]              += strEnd;
                                        dataA[lenComp[0] - 1] += strEnd;
                                        for (c = lenComp[0] - (b + 1); c > 0; c -= 1) {
                                            dataB.unshift("");
                                        }
                                        if (lenComp[0] < dataMinLength && dataA[b] !== undefined && dataB[b] !== undefined) {
                                            b = lenComp[0];
                                        } else {
                                            b = Math.max(dataA.length, dataB.length);
                                            break;
                                        }
                                    }
                                    if (lenComp[0] === dataMinLength || lenComp[1] === dataMinLength) {
                                        if (dataA[b].replace(regStart, "") === dataB[dataB.length - 1]) {
                                            dataA[b]                = strStart + strEnd + dataA[b].replace(regStart, "");
                                            dataB[dataB.length - 1] = strEnd + dataB[dataB.length - 1];
                                            matchCount              = (dataB.length - 1) - b;
                                            do {
                                                dataA.unshift("");
                                                matchCount -= 1;
                                            } while (matchCount > 0);
                                        } else if (dataB[b].replace(regStart, "") === dataA[dataA.length - 1]) {
                                            dataB[b]                = strStart + strEnd + dataB[b].replace(regStart, "");
                                            dataA[dataA.length - 1] = strEnd + dataA[dataA.length - 1];
                                            matchCount              = (dataA.length - 1) - b;
                                            do {
                                                dataB.unshift("");
                                                matchCount -= 1;
                                            } while (matchCount > 0);
                                        } else {
                                            dataA.push(strEnd);
                                            dataB.push(strEnd);
                                        }
                                        if (dataA.length < dataB.length && dataB[dataB.length - 1].indexOf(strEnd) < 0) {
                                            d = dataB.length - 1;
                                            dataA.push(strStart);
                                            if (dataB[b].indexOf(strStart + strEnd) > -1) {
                                                dataB[dataMinLength - 1] = strStart + dataB[dataMinLength - 1];
                                            } else {
                                                dataB[dataMinLength] = strStart + dataB[dataMinLength];
                                            }
                                            dataA.push(strEnd);
                                            dataB[d] = dataB[d] + strEnd;
                                            errorout += 1;
                                        }
                                        if (dataB.length < dataA.length && dataA[dataA.length - 1].indexOf(strEnd) < 0) {
                                            d = dataA.length - 1;
                                            dataB.push(strStart);
                                            if (dataA[b].indexOf(strStart + strEnd) > -1) {
                                                dataA[dataMinLength - 1] = strStart + dataA[dataMinLength - 1];
                                            } else {
                                                dataA[dataMinLength] = strStart + dataA[dataMinLength];
                                            }
                                            dataA[d] = dataA[d] + strEnd;
                                            dataB.push(strEnd);
                                            errorout += 1;
                                        }
                                        break;
                                    }
                                    if (dataA[lenComp[0]] === dataB[b].substring(strStart.length)) {
                                        if (dataA[lenComp[0]] === dataB[b].substring(strStart.length)) {
                                            dataA[lenComp[0] - 1] = dataA[lenComp[0] - 1] + strEnd;
                                        } else {
                                            dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                        }
                                        if (lenComp[1] === b) {
                                            dataB[lenComp[1]] = strStart + strEnd + dataB[lenComp[1]].replace(regStart, "");
                                        } else {
                                            dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                        }
                                    } else if (dataB[lenComp[1]] === dataA[b].substring(strStart.length)) {
                                        if (dataB[lenComp[1]] === dataA[b].substring(strStart.length)) {
                                            dataB[lenComp[1] - 1] = dataB[lenComp[1] - 1] + strEnd;
                                        } else {
                                            dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                        }
                                        if (lenComp[0] === b) {
                                            dataA[lenComp[0]] = strStart + strEnd + dataA[lenComp[0]].replace(regStart, "");
                                        } else {
                                            dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                        }
                                    } else {
                                        if (lenComp[1] > lenComp[0] && dataA[lenComp[1] + 1] === dataB[lenComp[1] + 1]) {
                                            if (dataA[lenComp[1]] === dataB[lenComp[1]].replace(regEnd, "")) {
                                                dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "");
                                                do {
                                                    lenComp[1] -= 1;
                                                } while (dataA[lenComp[1]] === dataB[lenComp[1]]);
                                                dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                            }
                                            dataA[lenComp[1]] = dataA[lenComp[1]].replace(regEnd, "") + strEnd;
                                            lenComp[0]        = lenComp[1];
                                        } else if (dataA[lenComp[0]] !== undefined && dataA[lenComp[0]].indexOf(strEnd) < 0 && dataA[lenComp[0] - 1].indexOf(strEnd) < 0) {
                                            dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                        }
                                        if (lenComp[0] > lenComp[1] && dataB[lenComp[0] + 1] === dataA[lenComp[0] + 1]) {
                                            if (dataB[lenComp[0]] === dataA[lenComp[0]].replace(regEnd, "")) {
                                                dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "");
                                                do {
                                                    lenComp[0] -= 1;
                                                } while (dataB[lenComp[0]] === dataA[lenComp[0]]);
                                                dataA[lenComp[0]] = dataA[lenComp[0]].replace(regEnd, "") + strEnd;
                                            }
                                            dataB[lenComp[0]] = dataB[lenComp[0]].replace(regEnd, "") + strEnd;
                                            lenComp[1]        = lenComp[0];
                                        } else if (dataB[lenComp[1]] !== undefined && dataB[lenComp[1]].indexOf(strEnd) < 0 && dataB[lenComp[1] - 1].indexOf(strEnd) < 0) {
                                            dataB[lenComp[1]] = dataB[lenComp[1]].replace(regEnd, "") + strEnd;
                                        }
                                    }
                                    if (lenComp[1] - lenComp[0] > 0) {
                                        for (c = (lenComp[1] - lenComp[0]) + b; c > b; c -= 1) {
                                            dataA.unshift("");
                                        }
                                    }
                                    if (lenComp[0] - lenComp[1] > 0) {
                                        for (c = (lenComp[0] - lenComp[1]) + b; c > b; c -= 1) {
                                            dataB.unshift("");
                                        }
                                    }
                                    if (earlyOut === false) {
                                        b = Math.max(lenComp[0], lenComp[1]);
                                    }
                                    dataMinLength = Math.min(dataA.length, dataB.length);
                                    matchNextB.pop();
                                    matchNextB.pop();
                                    matchNextA.pop();
                                    matchNextA.pop();
                                    lenComp.pop();
                                    lenComp.pop();
                                }
                            }
                            if (b < Math.max(dataA.length, dataB.length) && regEnd.test(dataA[dataA.length - 1]) === false && regEnd.test(dataB[dataB.length - 1]) === false) {
                                errorout += 1;
                                if (dataA.length < dataB.length) {
                                    dataA.push(strStart);
                                    dataA.push(strEnd);
                                    dataB[b] = strStart + dataB[b];
                                    dataB.push(strEnd);
                                } else {
                                    dataB.push(strStart);
                                    dataB.push(strEnd);
                                    dataA[b] = strStart + dataA[b];
                                    dataA.push(strEnd);
                                }
                            }
                            return [
                                dataA.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>"), dataB.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>")
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
                        data[2].push("</h3><ol class='count' style='cursor:w-resize'>");
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
                        for (i = 0; i < rowcnt; i += 1) {
                            if (context > -1 && opcodes.length > 1 && ((a > 0 && i === context) || (a === 0 && i === 0)) && change === "equal") {
                                ctest = false;
                                jump  = rowcnt - ((a === 0 ? 1 : 2) * context);
                                if (jump > 1) {
                                    foldcount += 1;
                                    data[0].push("<li>...</li>");
                                    if (inline === false) {
                                        data[1].push("<li class='skip'>&#10;</li>");
                                    }
                                    data[2].push("<li>...</li>");
                                    data[3].push("<li class='skip'>&#10;</li>");
                                    baseStart += jump;
                                    newStart  += jump;
                                    i         += jump - 1;
                                    if (a + 1 === opcodes.length) {
                                        break;
                                    }
                                }
                            } else if (change !== "equal") {
                                diffline += 1;
                            }
                            if (baseTextArray[baseStart] === newTextArray[newStart]) {
                                change = "equal";
                            } else if (change === "equal") {
                                change = "replace";
                            }
                            if (tab !== "") {
                                if (btest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof baseTextArray[baseStart + 1] === "string" && typeof newTextArray[newStart] === "string" && baseTab[baseStart + 1] === newTab[newStart] && baseTab[baseStart] !== newTab[newStart] && (typeof newTextArray[newStart - 1] !== "string" || baseTab[baseStart] !== newTab[newStart - 1])) {
                                    btest = true;
                                } else if (ntest === false && baseTextArray[baseEnd] !== newTextArray[newEnd] && typeof newTextArray[newStart + 1] === "string" && typeof baseTextArray[baseStart] === "string" && newTab[newStart + 1] === baseTab[baseStart] && newTab[newStart] !== baseTab[baseStart] && (typeof baseTextArray[baseStart - 1] !== "string" || newTab[newStart] !== baseTab[baseStart - 1])) {
                                    ntest = true;
                                }
                            }
                            if (inline === true) {
                                if (context < 0 && baseTextArray[baseStart - 1] === newTextArray[newStart - 1] && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                    data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                                }
                                if (ntest === true || change === "insert") {
                                    data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                    data[2].push("<li>");
                                    data[2].push(newStart + 1);
                                    data[2].push("&#10;</li>");
                                    data[3].push("<li class='insert'>");
                                    data[3].push(newTextArray[newStart]);
                                    data[3].push("&#10;</li>");
                                    foldcount += 1;
                                } else if (btest === true || change === "delete") {
                                    data[0].push("<li>");
                                    data[0].push(baseStart + 1);
                                    data[0].push("</li>");
                                    data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                    data[3].push("<li class='delete'>");
                                    data[3].push(baseTextArray[baseStart]);
                                    data[3].push("&#10;</li>");
                                    foldcount += 1;
                                } else if (change === "replace") {
                                    if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                                        if (baseTextArray[baseStart] === "") {
                                            charcompOutput = [
                                                "", newTextArray[newStart]
                                            ];
                                        } else if (newTextArray[newStart] === "") {
                                            charcompOutput = [
                                                baseTextArray[baseStart], ""
                                            ];
                                        } else if (baseStart < baseEnd && newStart < newEnd) {
                                            charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                        }
                                    }
                                    if (baseStart < baseEnd) {
                                        data[0].push("<li>");
                                        data[0].push(baseStart + 1);
                                        data[0].push("</li>");
                                        data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                        data[3].push("<li class='delete'>");
                                        if (newStart < newEnd) {
                                            data[3].push(charcompOutput[0]);
                                        } else {
                                            data[3].push(baseTextArray[baseStart]);
                                        }
                                        data[3].push("&#10;</li>");
                                        foldcount += 1;
                                    }
                                    if (newStart < newEnd) {
                                        data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                        data[2].push("<li>");
                                        data[2].push(newStart + 1);
                                        data[2].push("</li>");
                                        data[3].push("<li class='insert'>");
                                        if (baseStart < baseEnd) {
                                            data[3].push(charcompOutput[1]);
                                        } else {
                                            data[3].push(newTextArray[newStart]);
                                        }
                                        data[3].push("&#10;</li>");
                                        foldcount += 1;
                                    }
                                } else if (baseStart < baseEnd || newStart < newEnd) {
                                    foldcount += 1;
                                    if (context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                                        foldstart = data[0].length;
                                        if (a === opcodesLength - 1) {
                                            if (baseEnd > newEnd) {
                                                data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (baseEnd + 3) + "\">");
                                            } else {
                                                data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (newEnd + 3) + "\">");
                                            }
                                        } else {
                                            data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">");
                                        }
                                        data[0].push("- " + (baseStart + 1));
                                    } else {
                                        data[0].push("<li>");
                                        data[0].push(baseStart + 1);
                                    }
                                    data[0].push("</li>");
                                    data[2].push("<li>");
                                    data[2].push(newStart + 1);
                                    data[2].push("</li>");
                                    data[3].push("<li class='");
                                    data[3].push(change);
                                    data[3].push("'>");
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
                                    if (context < 0 && (foldstart === 3 || baseTextArray[baseStart - 1] === newTextArray[newStart - 1]) && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                        data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                                    }
                                    if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "") {
                                        change = "insert";
                                    }
                                    if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                        change = "delete";
                                    }
                                    if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                        charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                    } else {
                                        charcompOutput = [];
                                    }
                                    if (baseStart === Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1 || newStart === Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                        repeat = true;
                                    }
                                    if (repeat === false) {
                                        foldcount += 1;
                                        if (baseStart < baseEnd) {
                                            if (context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                                                if (a === opcodesLength - 1) {
                                                    if (baseEnd > newEnd) {
                                                        data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (baseEnd + 2) + "\">- " + (baseStart + 1) + "</li>");
                                                    } else {
                                                        data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line " + (newEnd + 2) + "\">- " + (baseStart + 1) + "</li>");
                                                    }
                                                } else {
                                                    foldstart = data[0].length;
                                                    data[0].push("<li class=\"fold\" title=\"folds from line " + foldcount + " to line xxx\">- " + (baseStart + 1) + "</li>");
                                                }
                                            } else {
                                                data[0].push("<li>" + (baseStart + 1) + "</li>");
                                            }
                                            data[1].push("<li class='");
                                            if (newStart >= newEnd) {
                                                data[1].push("delete");
                                            } else if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "") {
                                                data[1].push("empty");
                                            } else {
                                                data[1].push(change);
                                            }
                                            data[1].push("'>");
                                            if (charcompOutput.length === 2) {
                                                data[1].push(charcompOutput[0]);
                                            } else {
                                                data[1].push(baseTextArray[baseStart]);
                                            }
                                            data[1].push("&#10;</li>");
                                        } else if (ctest === true) {
                                            data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                            data[1].push("<li class='empty'>&#8203;</li>");
                                        }
                                        if (newStart < newEnd) {
                                            data[2].push("<li>" + (newStart + 1) + "</li>");
                                            data[3].push("<li class='");
                                            if (baseStart >= baseEnd) {
                                                data[3].push("insert");
                                            } else if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                                data[3].push("empty");
                                            } else {
                                                data[3].push(change);
                                            }
                                            data[3].push("'>");
                                            if (charcompOutput.length === 2) {
                                                data[3].push(charcompOutput[1]);
                                            } else {
                                                data[3].push(newTextArray[newStart]);
                                            }
                                            data[3].push("&#10;</li>");
                                        } else if (ctest === true) {
                                            data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                            data[3].push("<li class='empty'>&#8203;</li>");
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
                                        foldcount += 1;
                                        data[0].push("<li>" + (baseStart + 1) + "</li>");
                                        data[1].push("<li class='delete'>");
                                        data[1].push(baseTextArray[baseStart]);
                                        data[1].push("&#10;</li>");
                                        data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                        data[3].push("<li class='empty'>&#8203;</li>");
                                    }
                                    btest     = false;
                                    baseStart += 1;
                                } else if (ntest === true || (typeof baseTextArray[baseStart] !== "string" && typeof newTextArray[newStart] === "string")) {
                                    if (newStart !== Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                        foldcount += 1;
                                        data[0].push("<li class='empty'>&#8203;&#10;</li>");
                                        data[1].push("<li class='empty'>&#8203;</li>");
                                        data[2].push("<li>" + (newStart + 1) + "</li>");
                                        data[3].push("<li class='insert'>");
                                        data[3].push(newTextArray[newStart]);
                                        data[3].push("&#10;</li>");
                                    }
                                    ntest    = false;
                                    newStart += 1;
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
                    builder       = {},
                    capi          = (api.api === undefined || api.api.length === 0) ? "" : api.api,
                    //api.comments - if comments should receive indentation or not
                    ccomm         = (api.comments === "noindent") ? "noindent" : "indent",
                    //api.conditional - should IE conditional comments be preserved during markup minification
                    ccond         = (api.conditional === true || api.conditional === "true") ? true : false,
                    //api.content - should content be normalized during a diff operation
                    ccontent      = (api.content === true || api.content === "true") ? true : false,
                    //api.context - should the diff report only include the differences, if so then buffered by how many lines of code
                    ccontext      = (api.context === "" || (/^(\s+)$/).test(api.context) || isNaN(api.context)) ? "" : Number(api.context),
                    //api.correct - should JSPretty make some corrections for sloppy JS
                    ccorrect      = (api.correct === true || api.correct === "true") ? true : false,
                    //api.csvchar - what character should be used as a separator
                    ccsvchar      = (typeof api.csvchar === "string" && api.csvchar.length > 0) ? api.csvchar : ",",
                    //api.diff - source code to compare with
                    cdiff         = (typeof api.diff === "string" && api.diff.length > 0 && (/^(\s+)$/).test(api.diff) === false) ? api.diff : "",
                    //api.diffcomments - should comments be included in the diff operation
                    cdiffcomments = (api.diffcomments === true || api.diffcomments === "true") ? true : false,
                    //api.difflabel - a text label to describe the diff code
                    cdifflabel    = (typeof api.difflabel === "string" && api.difflabel.length > 0) ? api.difflabel : "new",
                    //api.diffview - should the diff report be a single column showing both sources simultaneously "inline" or showing the sources in separate columns "sidebyside"
                    cdiffview     = (api.diffview === "inline") ? "inline" : "sidebyside",
                    //api.elseline - for the 'else' keyword onto a new line in JavaScript
                    celseline     = (api.elseline === true || api.elseline === "true") ? true : false,
                    //api.force_indent - should markup beautification always force indentation even if disruptive
                    cforce        = (api.force_indent === true || api.force_indent === "true") ? true : false,
                    //api.html - should markup be presumed to be HTML with all the aloppiness HTML allows
                    chtml         = (api.html === true || api.html === "true" || (typeof api.html === "string" && api.html === "html-yes")) ? true : false,
                    //api.inchar - what character should be used to create a single identation
                    cinchar       = (typeof api.inchar === "string" && api.inchar.length > 0) ? api.inchar : " ",
                    //api.indent - should JSPretty format JavaScript in the normal KNR style or push curly braces onto a separate line like the "allman" style
                    cindent       = (api.indent === "allman") ? "allman" : "",
                    //api.inlevel - should indentation in JSPretty be buffered with additional indentation?  Useful when supplying code to sites accepting markdown
                    cinlevel      = (isNaN(api.inlevel) || Number(api.inlevel) < 1) ? 0 : Number(api.inlevel),
                    //api.insize - how many characters from api.inchar should constitute a single indentation
                    cinsize       = (isNaN(api.insize)) ? 4 : Number(api.insize),
                    //api.jsscope - do you want to enable the jsscope feature of JSPretty?  This feature will output formatted HTML instead of text code showing which variables are declared at which functional depth
                    cjsscope      = (api.jsscope === true || api.jsscope === "true") ? true : false,
                    //api.lang - which programming language will we be analyzing
                    clang         = (typeof api.lang === "string" && (api.lang === "javascript" || api.lang === "css" || api.lang === "markup" || api.lang === "html" || api.lang === "csv" || api.lang === "text")) ? api.lang : "auto",
                    //api.mode - is this a minify, beautify, or diff operation
                    cmode         = (typeof api.mode === "string" && (api.mode === "minify" || api.mode === "beautify")) ? api.mode : "diff",
                    //api.obfuscate - when minifying code with JSPretty should we make it sloppy and change variable names to make the code extra small?
                    cobfuscate    = (api.obfuscate === true || api.obfuscate === "true") ? true : false,
                    //api.preserve - should empty lines be preserved in beautify operations of JSPretty?
                    cpreserve     = (api.preserve === false || api.preserve === "false") ? false : true,
                    //api.quote - should all single quote characters be converted to double quote characters during a diff operation to reduce the number of false positive comparisons
                    cquote        = (api.quote === true || api.quote === "true") ? true : false,
                    //api.semicolon - should trailing semicolons be removed during a diff operation to reduce the number of false positive comparisons
                    csemicolon    = (api.semicolon === true || api.semicolon === "true") ? true : false,
                    //api.source - the source code in minify and beautify operations or "base" code in operations 
                    csource       = (typeof api.source === "string" && api.source.length > 0 && (/^(\s+)$/).test(api.source) === false) ? api.source : ((cmode === "diff") ? "" : "Source sample is missing."),
                    //api.sourcelabel - a text label to describe the api.source code for the diff report
                    csourcelabel  = (typeof api.sourcelabel === "string" && api.sourcelabel.length > 0) ? api.sourcelabel : "base",
                    //api.space - should JSPretty include a space between a function keyword and the next adjacent opening parenthesis character in beautification operations
                    cspace        = (api.space === false || api.space === "false") ? false : true,
                    //api.style - should JavaScript and CSS code receive indentation if embedded inline in markup
                    cstyle        = (api.style === "noindent") ? "noindent" : "indent",
                    //api.topcoms - should comments at the top of a JavaScript or CSS source be preserved during minify operations
                    ctopcoms      = (api.topcoms === true || api.topcoms === "true") ? true : false,
                    //api.wrap - in markup beautification should text content wrap after the first complete word up to a certain character length
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
                                if (build[c][0] === "api.comments") {
                                    if (build[c][1] === "indent") {
                                        ccomm = "indent";
                                    } else if (build[c][1] === "noindent") {
                                        ccomm = "noindent";
                                    }
                                } else if (build[c][0] === "api.conditional") {
                                    if (build[c][1] === "true") {
                                        ccond = true;
                                    } else if (build[c][1] === "false") {
                                        ccond = false;
                                    }
                                } else if (build[c][0] === "api.content") {
                                    if (build[c][1] === "true") {
                                        ccontent = true;
                                    } else if (build[c][1] === "false") {
                                        ccontent = false;
                                    }
                                } else if (build[c][0] === "api.context" && ((/\D/).test(build[c][1]) === false || build[c][1] === "")) {
                                    ccontext = build[c][1];
                                } else if (build[c][0] === "api.correct") {
                                    if (build[c][1] === "true") {
                                        ccorrect = true;
                                    } else if (build[c][1] === "false") {
                                        ccorrect = false;
                                    }
                                } else if (build[c][0] === "api.csvchar") {
                                    ccsvchar = build[c][1];
                                } else if (build[c][0] === "api.diffcomments") {
                                    if (build[c][1] === "true") {
                                        cdiffcomments = true;
                                    } else if (build[c][1] === "false") {
                                        cdiffcomments = false;
                                    }
                                } else if (build[c][0] === "api.difflabel") {
                                    cdifflabel = build[c][1];
                                } else if (build[c][0] === "api.diffview") {
                                    if (build[c][1] === "sidebyside") {
                                        cdiffview = "sidebyside";
                                    } else if (build[c][1] === "inline") {
                                        cdiffview = "inline";
                                    }
                                } else if (build[c][0] === "api.elseline" && build[c][1] === "true") {
                                    celseline = true;
                                } else if (build[c][0] === "api.force_indent") {
                                    if (build[c][1] === "true") {
                                        cforce = true;
                                    } else if (build[c][1] === "false") {
                                        cforce = false;
                                    }
                                } else if (build[c][0] === "api.html") {
                                    if (build[c][1] === "html-no") {
                                        chtml = "html-no";
                                    } else if (build[c][1] === "html-yes") {
                                        chtml = "html-yes";
                                    }
                                } else if (build[c][0] === "api.inchar") {
                                    cinchar = build[c][1];
                                } else if (build[c][0] === "api.indent") {
                                    if (build[c][1] === "knr") {
                                        cindent = "knr";
                                    } else if (build[c][1] === "allman") {
                                        cindent = "allman";
                                    }
                                } else if (build[c][0] === "api.inlevel") {
                                    if (build[c][1] === "true") {
                                        cinlevel = true;
                                    } else if (build[c][1] === "false") {
                                        cinlevel = false;
                                    }
                                } else if (build[c][0] === "api.insize" && (/\D/).test(build[c][1]) === false) {
                                    cinsize = build[c][1];
                                } else if (build[c][0] === "api.jslines") {
                                    if (build[c][1] === "true") {
                                        cpreserve = true;
                                    } else if (build[c][1] === "false") {
                                        cpreserve = false;
                                    }
                                } else if (build[c][0] === "api.jsscope") {
                                    if (build[c][1] === "true") {
                                        cjsscope = true;
                                    } else if (build[c][1] === "false") {
                                        cjsscope = false;
                                    }
                                } else if (build[c][0] === "api.jsspace") {
                                    if (build[c][1] === "true") {
                                        cspace = true;
                                    } else if (build[c][1] === "false") {
                                        cspace = false;
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
                                } else if (build[c][0] === "api.mode") {
                                    if (build[c][1] === "beautify") {
                                        cmode = "beautify";
                                    } else if (build[c][1] === "minify") {
                                        cmode = "minify";
                                    } else if (build[c][1] === "diff") {
                                        cmode = "diff";
                                    }
                                } else if (build[c][0] === "api.obfuscate") {
                                    if (build[c][1] === "true") {
                                        cobfuscate = true;
                                    } else if (build[c][1] === "false") {
                                        cobfuscate = false;
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
                                } else if (build[c][0] === "api.style") {
                                    if (build[c][1] === "indent") {
                                        cstyle = "indent";
                                    } else if (build[c][1] === "noindent") {
                                        cstyle = "noindent";
                                    }
                                } else if (build[c][0] === "api.sourcelabel") {
                                    csourcelabel = build[c][1];
                                } else if (build[c][0] === "api.topcoms") {
                                    if (build[c][1] === "true") {
                                        ctopcoms = true;
                                    } else if (build[c][1] === "false") {
                                        ctopcoms = false;
                                    }
                                } else if (build[c][0] === "api.wrap" && isNaN(build[c][1]) === false) {
                                    cwrap = Number(build[c][1]);
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
                            auto  = "<p>Language set to <strong>auto</strong>. Presumed language is <em>CSS</em>.</p>";
                            return;
                        }
                        if ((/^([\s\w]*<)/).test(a) === false && (/(>[\s\w]*)$/).test(a) === false) {
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
                            if ((/^(\s*\{)/).test(a) === true && (/(\}\s*)$/).test(a) && a.indexOf(",") !== -1) {
                                clang = "javascript";
                                auto  = "JSON";
                            } else if ((/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i).test(a) === true && ((/(var\s+[a-z]+[a-zA-Z0-9]*)/).test(a) === true || (/(\=\s*function)|(\s*function\s+(\w*\s+)?\()/).test(a) === true || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a) === true)) {
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
                        } else if (((/(>[\w\s:]*)?<(\/|\!)?[\w\s:\-\[]+/).test(a) === true && (/^([\s\w]*<)/).test(a) === true && (/(>[\s\w]*)$/).test(a) === true) || (/^(\s*<s((cript)|(tyle)))/i.test(a) === true && /(<\/s((cript)|(tyle))>\s*)$/i.test(a) === true)) {
                            clang = "markup";
                            if ((/^(\s*<\?xml)/).test(a) === true) {
                                if ((/XHTML\s+1\.1/).test(a) === true || (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === true) {
                                    auto = "XHTML";
                                } else {
                                    auto = "XML";
                                }
                            } else if ((/<[a-zA-Z]/).test(a) === false && (/<\![A-Z]/).test(a) === true) {
                                auto = "SGML";
                            } else if (chtml === true || (/^(\s*<\!doctype html>)/i).test(a) === true || (/^(\s*<html)/i).test(a) === true || ((/^(\s*<\!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/).test(a) === true && (/XHTML\s+1\.1/).test(a) === false && (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === false)) {
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
                        apioutput = csspretty({
                            mode   : cmode,
                            source : csource,
                            topcoms: ctopcoms
                        });
                    } else if (clang === "csv") {
                        apioutput = csvmin(csource, ccsvchar);
                    } else if (clang === "markup") {
                        apioutput = markupmin({
                            comments    : "",
                            conditional : ccond,
                            presume_html: chtml,
                            source      : csource,
                            top_comments: ctopcoms
                        });
                    } else if (clang === "text") {
                        apioutput = csource;
                    } else {
                        apioutput = jspretty({
                            correct  : ccorrect,
                            mode     : cmode,
                            obfuscate: cobfuscate,
                            source   : csource,
                            topcoms  : ctopcoms
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
                        apioutput  = csspretty({
                            comm  : ccomm,
                            inchar: cinchar,
                            insize: cinsize,
                            mode  : cmode,
                            source: csource
                        });
                        apidiffout = summary;
                    } else if (clang === "csv") {
                        apioutput  = csvbeauty(csource, ccsvchar);
                        apidiffout = "";
                    } else if (clang === "markup") {
                        apioutput  = markup_beauty({
                            comments    : ccomm,
                            force_indent: cforce,
                            html        : chtml,
                            inchar      : cinchar,
                            insize      : cinsize,
                            mode        : "beautify",
                            source      : csource,
                            style       : cstyle,
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
                            braces  : cindent,
                            comments: ccomm,
                            correct : ccorrect,
                            elseline: celseline,
                            inchar  : cinchar,
                            inlevel : cinlevel,
                            insize  : cinsize,
                            jsscope : cjsscope,
                            preserve: cpreserve,
                            source  : csource,
                            space   : cspace
                        });
                        apidiffout = summary;
                    }
                    if (apidiffout === false) {
                        apidiffout = "";
                    }
                    if (autotest === false) {
                        auto = "";
                    }
                    if (capi === "" && cjsscope === true && clang === "javascript") {
                        builder.head       = "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>";
                        builder.cssCore    = "body{font-family:\"Arial\";font-size:10px;overflow-y:scroll;}#samples #dcolorScheme{position:relative;z-index:1000}#apireturn textarea{font-size:1.2em;height:50em;width:100%}button{border-radius:.9em;display:block;font-weight:bold;width:100%}div .button{text-align:center}div button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover{cursor:pointer}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin-right:1em;width:22.5em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:2em 0 0;text-align:right;width:9em}h1{float:left;font-size:2em;margin:0 .5em .5em 0}#hideOptions{margin-left:5em;padding:0}#title_text{border-style:solid;border-width:.05em;display:block;float:left;font-size:1em;margin-left:.55em;padding:.1em}h1 svg,h1 img{border-style:solid;border-width:.05em;float:left;height:2em;width:2em}h1 span{font-size:.5em}h2,h3{background:#fff;border-style:solid;border-width:.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 .5em .5em 0;padding:0 .2em}#doc h3{margin-top:.5em}h3{font-size:1.6em}h4{font-size:1.4em}fieldset{border-radius:.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}legend{border-style:solid;border-width:.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}#diffreport{right:57.8em}#beaureport{right:38.8em}#minnreport{right:19.8em}#statreport{right:.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#reports{height:4em}#reports h2{display:none}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:.8em;line-height:.5em;margin:-.85em 0 0;position:absolute;right:.05em;top:100%;width:.85em}.box button.minimize{margin:.35em 4em 0 0}.box button.maximize{margin:.35em 1.75em 0 0}.box button.save{margin:.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:.25em 0 0 .5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.options{border-radius:0 0 .9em .9em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}label{display:inline;font-size:1.4em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}body#doc ol li{font-size:1.1em}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:.4em 0;text-align:left;width:14em}p{clear:both;font-size:1.2em;margin:0 0 1em}#option_comment{height:2.5em;margin-bottom:-1.5em;width:100%}.difflabel{display:block;height:0}#beau-other-span,#diff-other-span{text-indent:-200em;width:0}.options p span{display:block;float:left;font-size:1.2em}#top{min-width:80em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:.5em;position:absolute;right:1em;top:11em}#announcement{height:2.5em;margin:0 -5em -4.75em;width:27.5em}#textreport{width:100%}#options{float:left;margin:0;width:19em}#options label{width:auto}#options p{clear:both;font-size:1em;margin:0;padding:0}#options p span{clear:both;float:none;height:2em;margin:0 0 0 2em}#csvchar{width:11.8em}#language,#csvchar,#colorScheme{margin:0 0 1em 2em}#codeInput{margin-left:22.5em}#Beautify.wide p,#Beautify.tall p.file,#Minify.wide p,#Minify.tall p.file{clear:none;float:none}#diffops p,#miniops p,#beauops p{clear:both;font-size:1em;padding-top:1em}#options p strong,#diffops p strong,#miniops p strong,#beauops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}input[type=\"radio\"]{margin:0 .25em}input[type=\"file\"]{box-shadow:none}select{border-style:inset;border-width:.1em;width:11.85em}.options input,.options label{border-style:none;display:block;float:left}.options span label{margin-left:.4em;white-space:nowrap;width:12em}.options p span label{font-size:1em}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:.1em}textarea{display:inline-block;height:10em;margin:0}strong label{font-size:1em;width:inherit}strong.new{background:#ff6;font-style:italic}#miniops span strong,#diffops span strong,#beauops span strong{display:inline;float:none;font-size:1em;width:auto}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}.clear{clear:both;display:block}.wide,.tall,#diffBase,#diffNew{border-radius:0 0 .9em .9em;margin-bottom:1em}#diffBase,#diffNew{padding:1em}#diffBase p,#diffNew p{clear:none;float:none}#diffBase.wide textarea,#diffNew.wide textarea{height:10.1em}.wide,.tall{padding:1em 1.25em 0}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:.5em .5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:.5em .5em .5em 2em}.wide label{float:none;margin-right:0;width:100%}.wide #beautyinput,.wide #minifyinput,.wide #beautyoutput,.wide #minifyoutput{height:14.8em;margin:0;width:99.5%}.tall .input{clear:none;float:left}.tall .output{clear:none;float:right;margin-top:-2.4em}.tall .input,.tall .output{width:49%}.tall .output label{text-align:right}.tall .input textarea{height:31.7em}.tall .output textarea{height:34em}.tall textarea{margin:0 0 -.1em;width:100%}.tall #beautyinput,.tall #minifyinput{float:left}.tall #beautyoutput,.tall #minifyoutput{float:right}.wide{width:auto}#diffBase.difftall,#diffNew.difftall{margin-bottom:1.3em;padding:1em 1% .9em;width:47.5%}#diffBase.difftall{float:left}#diffNew.difftall{float:right}.file input,.labeltext input{display:inline-block;margin:0 .7em 0 0;width:16em}.labeltext,.file{font-size:.9em;font-weight:bold;margin-bottom:1em}.difftall textarea{height:30.6em;margin-bottom:.5em}#diffBase textarea,#diffNew textarea{width:99.5%}.input,.output{margin:0}#diffBase.wide,#diffNew.wide{padding:.8em 1em}#diffBase.wide{margin-bottom:1.2em}#diffoutput{width:100%}#diffoutput p em,#diffoutput li em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}.analysis th{text-align:left}.analysis td{text-align:right}#doc ul{margin-top:1em}#doc ul li{font-size:1.2em}body#doc ul li{font-size:1.1em}#doc ol li span{display:block;margin-left:2em}.diff,.beautify{border-style:solid;border-width:.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;position:relative}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:.5em}.diff .skip{border-style:none none solid;border-width:0 0 .1em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 .1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 .1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 .1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff ol,.beautify ol{display:table-cell;margin:0;padding:0}.diff li,.beautify li{border-style:none none solid;border-width:0 0 .1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:.5em}.diff li{padding-top:.5em}.beautify .count li{padding-top:.5em}@media screen and (-webkit-min-device-pixel-ratio:0) {.beautify .count li{padding-top:.546em}}#doc .beautify .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:.5em}.diff .count,.beautify .count{border-style:solid;border-width:0 .1em 0 0;font-weight:normal;padding:0;text-align:right}.diff .count li,.beautify .count li{padding-left:2em}.diff .data,.beautify .data{text-align:left;white-space:pre}.diff .data li,.beautify .data li{letter-spacing:.1em;padding-left:.5em;white-space:pre}#webtool .diff h3{border-style:none solid solid;border-width:0 .1em .2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:.2em 2em;text-align:left}.diff li em{font-style:normal;margin:0 -.09em;padding:.05em 0}.diff p.author{border-style:solid;border-width:.2em .1em .1em;margin:0;overflow:hidden;padding:.4em;text-align:right}#dcolorScheme{float:right;margin:-2em 0 0 0}#dcolorScheme label{display:inline-block;font-size:1em;margin-right:1em}body#doc{font-size:.8em;max-width:80em}#doc th{font-weight:bold}#doc td span{display:block}#doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:.2em;clear:both}#doc table{font-size:1.2em}body#doc table{font-size:1em}#doc td,#doc th{border-left-style:solid;border-left-width:.1em;border-top-style:solid;border-top-width:.1em;padding:.5em}#doc em,.box .body em{font-style:normal;font-weight:bold}#doc div{margin-bottom:2em}#doc div div{clear:both;margin-bottom:1em}#doc h2{font-size:1.6em;margin:.5em .5em .5em 0}#doc ol{clear:both}#doc_contents li{font-size:1.75em;margin:1em 0 0}#doc_contents ol ol li{font-size:.75em;list-style:lower-alpha;margin:.5em 0 0}#doc_contents ol{padding-bottom:1em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:.25em .3em 0 0;padding-bottom:0}#doc_contents a{text-decoration:none}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}button,fieldset,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,.wide,.tall,#diffBase,#diffNew,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties{border-style:solid;border-width:.1em}#apitest p{clear:both;padding-top:.75em}#apitest label,#apitest select,#apitest input,#apitest textarea{float:left}#apitest label{width:20em}#apitest select,#apitest input,#apitest textarea{width:30em}#pdsamples{list-style-position:inside;margin:-12em 0 0 0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:.5em}#modalSave span{background:#000;display:block;left:0;opacity:.5;position:absolute;top:0;z-index:9000}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}@media print{p,.options,#Beautify,#Minify,#diff,ul{display:none}div{width:100%}html td{font-size:.8em;white-space:normal}}";
                        builder.cssColor   = "html .white,body.white{color:#333}body.white button{background:#eee;border-color:#222;box-shadow:0 .1em .2em rgba(64,64,64,0.75);color:#666;text-shadow:.05em .05em .1em #ccc}.white button:hover,.white button:active{background:#999;color:#eee;text-shadow:.1em .1em .1em #333}.white a{color:#009}.white #title_text{border-color:#fff;color:#333}.white #introduction h2{border-color:#999;color:#333}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#eee;border-color:#eee;box-shadow:none;padding-left:0;text-shadow:none}.white fieldset{background:#ddd;border-color:#999}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white .box{background:#666;border-color:#999;box-shadow:0 .4em .8em rgba(64,64,64,0.75)}.white .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:.2em .2em .4em #666}.white .box h3.heading:hover{background:#333;color:#eee}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 .4em rgba(64,64,64,0.75)}.white .options{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5);text-shadow:.05em .05em .1em #ccc}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white #option_comment{background:#ddd;border-color:#999}.white #top em{color:#00f}.white #update{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(64,64,64,0.5)}.white .wide,.white .tall,.white #diffBase,.white #diffNew{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5)}.white .file input,.white .labeltext input{border-color:#fff}#webtool.white input.unchecked{background:#ccc;color:#666}.white .options input[type=text],.white .options select{border-color:#999}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white #doc .analysis thead th,.white #doc .analysis th[colspan]{background:#eef}.white div input{border-color:#999}.white textarea{border-color:#999}.white textarea:hover{background:#eef8ff}.white .diff,.white .beautify,.white .diff ol,.white .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{background:#eed;border-color:#bbc;color:#886}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .data .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}.white .diff .data .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .equal,.white .beautify .data li{background-color:#fff;border-color:#eee}.white .beautify .data em.s1{color:#f66}.white .beautify .data em.s2{color:#12f}.white .beautify .data em.s3{color:#090}.white .beautify .data em.s4{color:#d6d}.white .beautify .data em.s5{color:#7cc}.white .beautify .data em.s6{color:#c85}.white .beautify .data em.s7{color:#737}.white .beautify .data em.s8{color:#6d0}.white .beautify .data em.s9{color:#dd0s}.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13{color:#cc3}.white .beautify .data em.s14{color:#333}.white .beautify .data em.s15{color:#9d9}.white .beautify .data em.s16{color:#880}.white .beautify .data .l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify .data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .beautify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.white .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{background:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l11{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautify .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white .beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea}.white .beautify .data .c0{background:#ddd}.white .beautify .data li{color:#777}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff .insert{background-color:#bfb;border-color:#aea}.white .diff .data .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white #doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc strong,.white .box .body strong{color:#c00}.white .box .body em,.white .box .body #doc em{color:#090}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #thirdparties img{box-shadow:.2em .2em .4em #999}.white #diffoutput #thirdparties{background:#eee}.white #doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc ol,#doc.white ol{background:#eee;border-color:#999}.white #doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc table,#doc.white table{background:#fff;border-color:#999}.white #doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,#doc.white tr:hover{background:#ddd}#doc.white em{color:#060}.white #doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}";
                        builder.cssExtra   = "body{background:#eee}#doc p em{color:#090}";
                        builder.body       = "</style></head><body id='webtool' class='";
                        builder.bodyColor  = "white";
                        builder.title      = "'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div id='doc'>";
                        builder.scriptOpen = "<script type='application/javascript'><![CDATA[";
                        builder.scriptBody = "var data=document.getElementById('pd-jsscope'),pd={};pd.beaurows=[];pd.beaurows[0]=data.getElementsByTagName('ol')[0].getElementsByTagName('li');pd.beaurows[1]=data.getElementsByTagName('ol')[1].getElementsByTagName('li');pd.beaufold=function dom__beaufold(){var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b='';if(self.innerHTML.charAt(0)==='-'){for(a=min;a<max;a+=1){pd.beaurows[0][a].style.display='none';pd.beaurows[1][a].style.display='none';}self.innerHTML='+'+self.innerHTML.substr(1);}else{for(a=min;a<max;a+=1){pd.beaurows[0][a].style.display='block';pd.beaurows[1][a].style.display='block';if(pd.beaurows[0][a].getAttribute('class')==='fold'&&pd.beaurows[0][a].innerHTML.charAt(0)==='+'){b=pd.beaurows[0][a].getAttribute('title');b=b.substring('to line ');a=Number(b)-1;}}self.innerHTML='-'+self.innerHTML.substr(1);}};(function(){var len=pd.beaurows[0].length,a=0;for(a=0;a<len;a+=1){if(pd.beaurows[0][a].getAttribute('class')==='fold'){pd.beaurows[0][a].onclick=pd.beaufold;}}}());";
                        builder.scriptEnd  = "]]></script>";
                        return [
                            [
                                builder.head, builder.cssCore, builder.cssColor, builder.cssExtra, builder.body, builder.bodyColor, builder.title, proctime(), auto, "</div>", apidiffout, builder.scriptOpen, builder.scriptBody, builder.scriptEnd, "</body></html>"
                            ].join(""), ""
                        ];
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
                        apioutput  = csspretty({
                            comm    : ccomm,
                            diffcomm: cdiffcomments,
                            inchar  : cinchar,
                            insize  : cinsize,
                            mode    : cmode,
                            source  : csource,
                            topcoms : ctopcoms
                        });
                        apidiffout = csspretty({
                            comm    : ccomm,
                            diffcomm: cdiffcomments,
                            inchar  : cinchar,
                            insize  : cinsize,
                            mode    : cmode,
                            source  : cdiff,
                            topcoms : ctopcoms
                        });
                    } else if (clang === "csv") {
                        apioutput  = csvbeauty(csource, ccsvchar);
                        apidiffout = csvbeauty(cdiff, ccsvchar);
                    } else if (clang === "markup") {
                        if (cdiffcomments === true) {
                            apioutput  = markup_beauty({
                                comments    : ccomm,
                                conditional : ccond,
                                content     : ccontent,
                                force_indent: cforce,
                                html        : chtml,
                                inchar      : cinchar,
                                insize      : cinsize,
                                mode        : "beautify",
                                source      : csource,
                                style       : cstyle,
                                varspace    : false,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                            apidiffout = markup_beauty({
                                comments    : ccomm,
                                conditional : ccond,
                                content     : ccontent,
                                force_indent: cforce,
                                html        : chtml,
                                inchar      : cinchar,
                                insize      : cinsize,
                                mode        : "beautify",
                                source      : cdiff,
                                style       : cstyle,
                                varspace    : false,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                        } else {
                            apioutput  = markup_beauty({
                                comments    : ccomm,
                                conditional : ccond,
                                content     : ccontent,
                                force_indent: cforce,
                                html        : chtml,
                                inchar      : cinchar,
                                insize      : cinsize,
                                mode        : "diff",
                                source      : csource,
                                style       : cstyle,
                                varspace    : false,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                            apidiffout = markup_beauty({
                                comments    : ccomm,
                                conditional : ccond,
                                content     : ccontent,
                                force_indent: cforce,
                                html        : chtml,
                                inchar      : cinchar,
                                insize      : cinsize,
                                mode        : "diff",
                                source      : cdiff,
                                style       : cstyle,
                                varspace    : false,
                                wrap        : cwrap
                            }).replace(/\n[\t]* \/>/g, "");
                        }
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = cdiff;
                    } else {
                        if (cdiffcomments === true) {
                            ccomm = "nocomment";
                        }
                        apioutput  = jspretty({
                            braces  : cindent,
                            comments: ccomm,
                            correct : ccorrect,
                            elseline: celseline,
                            inchar  : cinchar,
                            inlevel : cinlevel,
                            insize  : cinsize,
                            jsscope : false,
                            preserve: cpreserve,
                            source  : csource,
                            space   : cspace,
                            varspace: false
                        });
                        apidiffout = jspretty({
                            braces  : cindent,
                            comments: ccomm,
                            correct : ccorrect,
                            elseline: celseline,
                            inchar  : cinchar,
                            inlevel : cinlevel,
                            insize  : cinsize,
                            jsscope : false,
                            preserve: cpreserve,
                            source  : cdiff,
                            space   : cspace,
                            varspace: false
                        });
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
                                contextSize  : ccontext,
                                baseTextLines: apioutput,
                                baseTextName : csourcelabel,
                                inline       : cdiffview,
                                newTextLines : apidiffout,
                                newTextName  : cdifflabel,
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
                        if (capi === "") {
                            builder.head          = "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>";
                            builder.cssCore       = "body{font-family:\"Arial\";font-size:10px;overflow-y:scroll;}#samples #dcolorScheme{position:relative;z-index:1000}#apireturn textarea{font-size:1.2em;height:50em;width:100%}button{border-radius:.9em;display:block;font-weight:bold;width:100%}div .button{text-align:center}div button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover{cursor:pointer}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin-right:1em;width:22.5em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:2em 0 0;text-align:right;width:9em}h1{float:left;font-size:2em;margin:0 .5em .5em 0}#hideOptions{margin-left:5em;padding:0}#title_text{border-style:solid;border-width:.05em;display:block;float:left;font-size:1em;margin-left:.55em;padding:.1em}h1 svg,h1 img{border-style:solid;border-width:.05em;float:left;height:2em;width:2em}h1 span{font-size:.5em}h2,h3{background:#fff;border-style:solid;border-width:.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 .5em .5em 0;padding:0 .2em}#doc h3{margin-top:.5em}h3{font-size:1.6em}h4{font-size:1.4em}fieldset{border-radius:.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}legend{border-style:solid;border-width:.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}#diffreport{right:57.8em}#beaureport{right:38.8em}#minnreport{right:19.8em}#statreport{right:.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#reports{height:4em}#reports h2{display:none}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:.8em;line-height:.5em;margin:-.85em 0 0;position:absolute;right:.05em;top:100%;width:.85em}.box button.minimize{margin:.35em 4em 0 0}.box button.maximize{margin:.35em 1.75em 0 0}.box button.save{margin:.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:.25em 0 0 .5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.options{border-radius:0 0 .9em .9em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}label{display:inline;font-size:1.4em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}body#doc ol li{font-size:1.1em}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:.4em 0;text-align:left;width:14em}p{clear:both;font-size:1.2em;margin:0 0 1em}#option_comment{height:2.5em;margin-bottom:-1.5em;width:100%}.difflabel{display:block;height:0}#beau-other-span,#diff-other-span{text-indent:-200em;width:0}.options p span{display:block;float:left;font-size:1.2em}#top{min-width:80em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:.5em;position:absolute;right:1em;top:11em}#announcement{height:2.5em;margin:0 -5em -4.75em;width:27.5em}#textreport{width:100%}#options{float:left;margin:0;width:19em}#options label{width:auto}#options p{clear:both;font-size:1em;margin:0;padding:0}#options p span{clear:both;float:none;height:2em;margin:0 0 0 2em}#csvchar{width:11.8em}#language,#csvchar,#colorScheme{margin:0 0 1em 2em}#codeInput{margin-left:22.5em}#Beautify.wide p,#Beautify.tall p.file,#Minify.wide p,#Minify.tall p.file{clear:none;float:none}#diffops p,#miniops p,#beauops p{clear:both;font-size:1em;padding-top:1em}#options p strong,#diffops p strong,#miniops p strong,#beauops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}input[type=\"radio\"]{margin:0 .25em}input[type=\"file\"]{box-shadow:none}select{border-style:inset;border-width:.1em;width:11.85em}.options input,.options label{border-style:none;display:block;float:left}.options span label{margin-left:.4em;white-space:nowrap;width:12em}.options p span label{font-size:1em}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:.1em}textarea{display:inline-block;height:10em;margin:0}strong label{font-size:1em;width:inherit}strong.new{background:#ff6;font-style:italic}#miniops span strong,#diffops span strong,#beauops span strong{display:inline;float:none;font-size:1em;width:auto}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}.clear{clear:both;display:block}.wide,.tall,#diffBase,#diffNew{border-radius:0 0 .9em .9em;margin-bottom:1em}#diffBase,#diffNew{padding:1em}#diffBase p,#diffNew p{clear:none;float:none}#diffBase.wide textarea,#diffNew.wide textarea{height:10.1em}.wide,.tall{padding:1em 1.25em 0}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:.5em .5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:.5em .5em .5em 2em}.wide label{float:none;margin-right:0;width:100%}.wide #beautyinput,.wide #minifyinput,.wide #beautyoutput,.wide #minifyoutput{height:14.8em;margin:0;width:99.5%}.tall .input{clear:none;float:left}.tall .output{clear:none;float:right;margin-top:-2.4em}.tall .input,.tall .output{width:49%}.tall .output label{text-align:right}.tall .input textarea{height:31.7em}.tall .output textarea{height:34em}.tall textarea{margin:0 0 -.1em;width:100%}.tall #beautyinput,.tall #minifyinput{float:left}.tall #beautyoutput,.tall #minifyoutput{float:right}.wide{width:auto}#diffBase.difftall,#diffNew.difftall{margin-bottom:1.3em;padding:1em 1% .9em;width:47.5%}#diffBase.difftall{float:left}#diffNew.difftall{float:right}.file input,.labeltext input{display:inline-block;margin:0 .7em 0 0;width:16em}.labeltext,.file{font-size:.9em;font-weight:bold;margin-bottom:1em}.difftall textarea{height:30.6em;margin-bottom:.5em}#diffBase textarea,#diffNew textarea{width:99.5%}.input,.output{margin:0}#diffBase.wide,#diffNew.wide{padding:.8em 1em}#diffBase.wide{margin-bottom:1.2em}#diffoutput{width:100%}#diffoutput p em,#diffoutput li em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}.analysis th{text-align:left}.analysis td{text-align:right}#doc ul{margin-top:1em}#doc ul li{font-size:1.2em}body#doc ul li{font-size:1.1em}#doc ol li span{display:block;margin-left:2em}.diff,.beautify{border-style:solid;border-width:.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;position:relative}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:.5em}.diff .skip{border-style:none none solid;border-width:0 0 .1em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 .1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 .1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 .1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff ol,.beautify ol{display:table-cell;margin:0;padding:0}.diff li,.beautify li{border-style:none none solid;border-width:0 0 .1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:.5em}.diff li{padding-top:.5em}.beautify .count li{padding-top:.5em}@media screen and (-webkit-min-device-pixel-ratio:0) {.beautify .count li{padding-top:.546em}}#doc .beautify .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:.5em}.diff .count,.beautify .count{border-style:solid;border-width:0 .1em 0 0;font-weight:normal;padding:0;text-align:right}.diff .count li,.beautify .count li{padding-left:2em}.diff .data,.beautify .data{text-align:left;white-space:pre}.diff .data li,.beautify .data li{letter-spacing:.1em;padding-left:.5em;white-space:pre}#webtool .diff h3{border-style:none solid solid;border-width:0 .1em .2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:.2em 2em;text-align:left}.diff li em{font-style:normal;margin:0 -.09em;padding:.05em 0}.diff p.author{border-style:solid;border-width:.2em .1em .1em;margin:0;overflow:hidden;padding:.4em;text-align:right}#dcolorScheme{float:right;margin:-2em 0 0 0}#dcolorScheme label{display:inline-block;font-size:1em;margin-right:1em}body#doc{font-size:.8em;max-width:80em}#doc th{font-weight:bold}#doc td span{display:block}#doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:.2em;clear:both}#doc table{font-size:1.2em}body#doc table{font-size:1em}#doc td,#doc th{border-left-style:solid;border-left-width:.1em;border-top-style:solid;border-top-width:.1em;padding:.5em}#doc em,.box .body em{font-style:normal;font-weight:bold}#doc div{margin-bottom:2em}#doc div div{clear:both;margin-bottom:1em}#doc h2{font-size:1.6em;margin:.5em .5em .5em 0}#doc ol{clear:both}#doc_contents li{font-size:1.75em;margin:1em 0 0}#doc_contents ol ol li{font-size:.75em;list-style:lower-alpha;margin:.5em 0 0}#doc_contents ol{padding-bottom:1em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:.25em .3em 0 0;padding-bottom:0}#doc_contents a{text-decoration:none}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}button,fieldset,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,.wide,.tall,#diffBase,#diffNew,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties{border-style:solid;border-width:.1em}#apitest p{clear:both;padding-top:.75em}#apitest label,#apitest select,#apitest input,#apitest textarea{float:left}#apitest label{width:20em}#apitest select,#apitest input,#apitest textarea{width:30em}#pdsamples{list-style-position:inside;margin:-12em 0 0 0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:.5em}#modalSave span{background:#000;display:block;left:0;opacity:.5;position:absolute;top:0;z-index:9000}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}@media print{p,.options,#Beautify,#Minify,#diff,ul{display:none}div{width:100%}html td{font-size:.8em;white-space:normal}}";
                            builder.cssColor      = "html .white,body.white{color:#333}body.white button{background:#eee;border-color:#222;box-shadow:0 .1em .2em rgba(64,64,64,0.75);color:#666;text-shadow:.05em .05em .1em #ccc}.white button:hover,.white button:active{background:#999;color:#eee;text-shadow:.1em .1em .1em #333}.white a{color:#009}.white #title_text{border-color:#fff;color:#333}.white #introduction h2{border-color:#999;color:#333}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#eee;border-color:#eee;box-shadow:none;padding-left:0;text-shadow:none}.white fieldset{background:#ddd;border-color:#999}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white .box{background:#666;border-color:#999;box-shadow:0 .4em .8em rgba(64,64,64,0.75)}.white .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:.2em .2em .4em #666}.white .box h3.heading:hover{background:#333;color:#eee}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 .4em rgba(64,64,64,0.75)}.white .options{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5);text-shadow:.05em .05em .1em #ccc}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white #option_comment{background:#ddd;border-color:#999}.white #top em{color:#00f}.white #update{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(64,64,64,0.5)}.white .wide,.white .tall,.white #diffBase,.white #diffNew{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5)}.white .file input,.white .labeltext input{border-color:#fff}#webtool.white input.unchecked{background:#ccc;color:#666}.white .options input[type=text],.white .options select{border-color:#999}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white #doc .analysis thead th,.white #doc .analysis th[colspan]{background:#eef}.white div input{border-color:#999}.white textarea{border-color:#999}.white textarea:hover{background:#eef8ff}.white .diff,.white .beautify,.white .diff ol,.white .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{background:#eed;border-color:#bbc;color:#886}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .data .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}.white .diff .data .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .equal,.white .beautify .data li{background-color:#fff;border-color:#eee}.white .beautify .data em.s1{color:#f66}.white .beautify .data em.s2{color:#12f}.white .beautify .data em.s3{color:#090}.white .beautify .data em.s4{color:#d6d}.white .beautify .data em.s5{color:#7cc}.white .beautify .data em.s6{color:#c85}.white .beautify .data em.s7{color:#737}.white .beautify .data em.s8{color:#6d0}.white .beautify .data em.s9{color:#dd0s}.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13{color:#cc3}.white .beautify .data em.s14{color:#333}.white .beautify .data em.s15{color:#9d9}.white .beautify .data em.s16{color:#880}.white .beautify .data .l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify .data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .beautify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.white .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{background:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l11{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautify .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white .beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea}.white .beautify .data .c0{background:#ddd}.white .beautify .data li{color:#777}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff .insert{background-color:#bfb;border-color:#aea}.white .diff .data .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white #doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc strong,.white .box .body strong{color:#c00}.white .box .body em,.white .box .body #doc em{color:#090}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #thirdparties img{box-shadow:.2em .2em .4em #999}.white #diffoutput #thirdparties{background:#eee}.white #doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc ol,#doc.white ol{background:#eee;border-color:#999}.white #doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc table,#doc.white table{background:#fff;border-color:#999}.white #doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,#doc.white tr:hover{background:#ddd}#doc.white em{color:#060}.white #doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}";
                            builder.cssExtra      = "body{background:#eee}#doc p em{color:#090}";
                            builder.body          = "</style></head><body id='webtool' class='";
                            builder.bodyColor     = "white";
                            builder.title         = "'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div id='doc'>";
                            builder.accessibility = "</div><p>Accessibility note. &lt;em&gt; tags in the output represent character differences per lines compared.</p>";
                            builder.scriptOpen    = "<script type='application/javascript'><![CDATA[var pd={},d=document.getElementsByTagName('ol');";
                            builder.scriptBody    = "(function(){var cells=d[0].getElemensByTagName('li'),len=cells.length,a=0;for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')==='fold'){cells[a].onclick=pd.difffold;}}if(d.length>3){d[3].onmousedown=pd.colSliderGrab;}}());pd.difffold=function dom__difffold(){var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b=0,inner=self.innerHTML,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('class'==='diff'))?parent.getElementsByTagName('ol'):parent.parentNode.getElementsByTagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a].getElementsByTagName('li'));}max=(max>=lists[0].length)?lists[0].length:max;if(inner.charAt(0)===' - '){self.innerHTML='+'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='none';}}}else{self.innerHTML=' - '+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='block';}}}};pd.colSliderProperties=[d[0].clientWidth,d[1].clientWidth,d[2].parentNode.clientWidth,d[2].parentNode.parentNode.clientWidth,d[2].parentNode.offsetLeft-d[2].parentNode.parentNode.offsetLeft,];pd.colSliderGrab=function(){'use strict';var x=this,a=x.parentNode,b=a.parentNode,c=0,counter=pd.colSliderProperties[0],data=pd.colSliderProperties[1],width=pd.colSliderProperties[2],total=pd.colSliderProperties[3],offset=(pd.colSliderProperties[4]),min=0,max=data-1,status='ew',g=min+15,h=max-15,k=false,z=a.previousSibling,drop=function(g){x.style.cursor=status+'-resize';g=null;document.onmousemove=null;document.onmouseup=null;},boxmove=function(f){f=f||window.event;c=offset-f.clientX;if(c>g&&c<h){k=true;}if(k===true&&c>h){a.style.width=((total-counter-2)/10)+'em';status='e';}else if(k===true&&c<g){a.style.width=(width/10)+'em';status='w';}else if(c<max&&c>min){a.style.width=((width+c)/10)+'em';status='ew';}document.onmouseup=drop;};if(typeof pd.o==='object'&&typeof pd.o.re==='object'){offset+=pd.o.re.offsetLeft;offset-=pd.o.rf.scrollLeft;}else{c=(document.body.parentNode.scrollLeft>document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLeft;offset-=c;}offset+=x.clientWidth;x.style.cursor='ew-resize';b.style.width=(total/10)+'em';b.style.display='inline-block';if(z.nodeType!==1){do{z=z.previousSibling;}while(z.nodeType!==1);}z.style.display='block';a.style.width=(a.clientWidth/10)+'em';a.style.position='absolute';document.onmousemove=boxmove;document.onmousedown=null;};";
                            builder.scriptEnd     = "]]></script>";
                            return [
                                [
                                    builder.head, builder.cssCore, builder.cssColor, builder.cssExtra, builder.body, builder.bodyColor, builder.title, proctime(), auto, a[0], builder.accessibility, a[1][0], builder.scriptOpen, builder.scriptBody, builder.scriptEnd, "</body></html>"
                                ].join(""), ""
                            ];
                        }
                        return [
                            a[1][0], proctime() + auto + a[0]
                        ];
                    }());
                }
            };
        return core(api);
    },
    //the edition values use the format YYMMDD for dates.
    edition    = {
        charDecoder  : 131224, //charDecoder library
        css          : 140806, //diffview.css file
        csspretty    : 140806, //csspretty library
        csvbeauty    : 140114, //csvbeauty library
        csvmin       : 131224, //csvmin library
        diffview     : 140720, //diffview library
        documentation: 140806, //documentation.xhtml
        jspretty     : 140806, //jspretty library
        markup_beauty: 140705, //markup_beauty library
        markupmin    : 140705, //markupmin library
        prettydiff   : 140806, //this file
        webtool      : 140806, //prettydiff.com.xhtml
        api          : {
            dom        : 140806,
            nodeLocal  : 140725,
            nodeService: 121106, //no longer maintained
            wsh        : 140725
        },
        addon        : {
            cmjs : 140127, //CodeMirror JavaScript
            cmcss: 140705 //CodeMirror CSS
        },
        latest       : 0
    };
edition.latest = (function edition_latest() {
    "use strict";
    return Math.max(edition.charDecoder, edition.css, edition.csspretty, edition.csvbeauty, edition.csvmin, edition.diffview, edition.documentation, edition.jspretty, edition.markup_beauty, edition.markupmin, edition.prettydiff, edition.webtool, edition.api.dom, edition.api.nodeLocal, edition.api.nodeService, edition.api.wsh);
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