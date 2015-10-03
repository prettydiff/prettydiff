/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global define, exports, global*/
/***********************************************************************
 csspretty is written by Austin Cheney on 7 Aug 2014.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/*
 This application beautifies CSS code as well as SCSS (Sass) and LESS
 variants. This application was written with extension in mind using the
 same array based architecture used for the markuppretty and jspretty
 libraries.  The architecture focuses on separation of roles.  The first
 area of the application reads the code and writes an array of tokens.
 The second area is the algorithm that determines what white space and
 indentation should be applied.  The final area is a report on the
 analysis of the code.
 -----------------------------------------------------------------------
 */
var csspretty = function csspretty_(args) {
    "use strict";
    var scssinsertlines = (args.cssinsertlines === true || args.cssinsertlines === "true"),
        sdiffcomm       = (args.diffcomm === true || args.diffcomm === "true"),
        sinchar         = (typeof args.inchar !== "string" || args.inchar === "")
            ? " "
            : args.inchar,
        sinlevel        = (isNaN(args.inlevel) === true)
            ? 0
            : Number(args.inlevel),
        sinsize         = (isNaN(args.insize) === true)
            ? 4
            : Number(args.insize),
        smode           = (args.mode === "minify" || args.mode === "parse" || args.mode === "diff")
            ? args.mode
            : "beautify",
        snoleadzero     = (args.noleadzero === true || args.noleadzero === "true"),
        sobjsort        = (args.objsort === true || args.objsort === "true"),
        spres           = (args.preserve !== false && args.preserve !== "false"),
        ssource         = (typeof args.source !== "string" || args.source === "" || (/^(\s+)$/).test(args.source) === true)
            ? "Error: no source supplied to csspretty."
            : args.source,
        stopcoms        = (args.topcoms === true || args.topcoms === "true"),
        svertical       = (args.vertical === true || args.vertical === "true"),
        token           = [],
        types           = [],
        lines           = [],
        uri             = [],
        output          = "",
        endline         = false,
        stats           = {
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
    if (ssource === "Error: no source supplied to csspretty.") {
        return ssource;
    }
    //The tokenizer is where all the parsing happens
    (function csspretty__tokenize() {
        var a          = 0,
            b          = ssource.split(""),
            len        = ssource.length,
            ltype      = "",
            itemsize   = 0,
            space      = "",
            spacecol   = false,
            //map location of empty lines for beautification
            spacer     = function csspretty__tokenize_space(end) {
                var slen = space.split("\n")
                    .length;
                if (slen > 1 && end === true && spres === true) {
                    endline = true;
                    return;
                }
                if (types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline" && (slen > 2 || (slen > 1 && b[a] + b[a + 1] === "//"))) {
                    lines[lines.length - 1] = 1;
                }
                space = "";
            },
            //sort parsed properties intelligently
            objSort    = function csspretty__tokenize_objSort() {
                var cc        = 0,
                    dd        = 0,
                    ee        = 0,
                    startlen  = token.length - 1,
                    end       = startlen,
                    keys      = [],
                    keylen    = 0,
                    keyend    = 0,
                    start     = 0,
                    sort      = function csspretty__tokenize_objSort_sort(x, y) {
                        var xx = x[0],
                            yy = y[0];
                        if (types[xx] === "comment" || types[xx] === "comment-inline") {
                            do {
                                xx += 1;
                            } while (xx < startlen && (types[xx] === "comment" || types[xx] === "comment-inline"));
                        }
                        if (types[yy] === "comment" || types[yy] === "comment-inline") {
                            do {
                                yy += 1;
                            } while (yy < startlen && (types[yy] === "comment" || types[yy] === "comment-inline"));
                        }
                        if (types[xx] < types[yy]) {
                            return -1;
                        }
                        if (types[xx] === types[yy] && token[xx].toLowerCase() < token[yy].toLowerCase()) {
                            return -1;
                        }
                        return 1;
                    },
                    semiTest  = true,
                    pairToken = [],
                    pairTypes = [],
                    pairLines = [];
                if (types[end] === "comment" || types[end] === "comment-inline") {
                    do {
                        end -= 1;
                    } while (end > 0 && (types[end] === "comment" || types[end] === "comment-inline"));
                }
                for (cc = startlen; cc > -1; cc -= 1) {
                    if (types[cc] === "end") {
                        dd += 1;
                    }
                    if (types[cc] === "start") {
                        dd -= 1;
                    }
                    if (dd === 0) {
                        if ((types[cc] === "property" || types[cc] === "selector" || types[cc] === "propvar") && types[cc - 1] !== "property" && types[cc - 1] !== "selector") {
                            if (lines[start - 1] > 0 && (types[start] === "comment" || types[start] === "selector")) {
                                lines[start - 1] = 0;
                                lines[start]     = 1;
                            }
                            start = cc;
                            if (types[end + 1] === "comment-inline") {
                                end += 1;
                            }
                            if (types[start - 1] === "comment") {
                                start -= 1;
                            }
                            keys.push([
                                start, end + 1, false
                            ]);
                            end = start - 1;
                        }
                    }
                    if (dd < 0 && cc < startlen) {
                        if (keys.length > 1 && (types[cc - 1] === "selector" || token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "[" || token[cc - 1] === "{" || token[cc - 1] === "," || cc === 0)) {
                            keys.sort(sort);
                            keylen   = keys.length;
                            semiTest = false;
                            for (dd = 0; dd < keylen; dd += 1) {
                                keyend = keys[dd][1];
                                for (ee = keys[dd][0]; ee < keyend; ee += 1) {
                                    pairToken.push(token[ee]);
                                    pairTypes.push(types[ee]);
                                    if ((types[ee] === "comment" || types[ee] === "selector") && lines[ee] > 0) {
                                        pairLines[pairLines.length - 1] = 1;
                                        pairLines.push(0);
                                    } else {
                                        pairLines.push(lines[ee]);
                                    }
                                    if (token[ee] === ";" || token[ee] === "}") {
                                        semiTest = true;
                                    } else if (token[ee] !== ";" && token[ee] !== "}" && types[ee] !== "comment" && types[ee] !== "comment-inline") {
                                        semiTest = false;
                                    }
                                }
                                if (semiTest === false) {
                                    ee = pairTypes.length - 1;
                                    if (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline") {
                                        do {
                                            ee -= 1;
                                        } while (ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline"));
                                    }
                                    ee += 1;
                                    pairToken.splice(ee, 0, ";");
                                    pairTypes.splice(ee, 0, "semi");
                                    if (pairLines[ee - 1] > 0) {
                                        pairLines[ee - 1] = 0;
                                        pairLines.splice(ee, 0, 1);
                                    } else {
                                        pairLines.splice(ee, 0, 0);
                                    }
                                }
                            }
                            ee = pairTypes.length - 1;
                            if (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline") {
                                do {
                                    ee -= 1;
                                } while (ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline"));
                            }
                            keylen = token.length - (cc + 1);
                            token.splice(cc + 1, keylen);
                            types.splice(cc + 1, keylen);
                            lines.splice(cc + 1, keylen);
                            token = token.concat(pairToken);
                            types = types.concat(pairTypes);
                            lines = lines.concat(pairLines);
                        }
                        return;
                    }
                }
            },
            //Some tokens receive a generic type named 'item'
            //because their type is unknown until we know the
            //following syntax.  This function replaces the type
            //'item' with something more specific.
            item       = function csspretty__tokenize_item(type) {
                var aa    = token.length,
                    bb    = 0,
                    coms  = [],
                    //Since I am already identifying value types
                    //this is a good place to do some quick analysis
                    //and clean up on certain value conditions.
                    //These things are being corrected:
                    //  * fractional values missing a leading 0 are
                    //    provided a leading 0
                    //  * 0 values with a dimension indicator
                    //    (px, em) have the dimension indicator
                    //    removed
                    //  * eliminate unnecessary leading 0s
                    //  * url values that are not quoted are wrapped
                    //    in double quote characters
                    //  * color values are set to lowercase and
                    //    reduced from 6 to 3 digits if appropriate
                    value = function csspretty__tokenize_item_value(val) {
                        var x      = val.split(""),
                            leng   = x.length,
                            cc     = 0,
                            dd     = 0,
                            items  = [],
                            block  = "",
                            values = [];
                        //this loop identifies containment so that
                        //tokens/sub-tokens are correctly taken
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
                        //This is where the rules mentioned above
                        //are applied
                        for (cc = 0; cc < leng; cc += 1) {
                            if (snoleadzero === false && (/^(\.\d)/).test(values[cc]) === true) {
                                values[cc] = "0" + values[cc];
                            } else if (snoleadzero === true && (/^(0+\.)/).test(values[cc])) {
                                values[cc] = values[cc].replace(/^(0+\.)/, ".");
                            } else if ((/^(0+([a-z]{2,3}|%))$/).test(values[cc]) === true) {
                                values[cc] = "0";
                            } else if ((/^(0+)/).test(values[cc]) === true) {
                                values[cc] = values[cc].replace(/0+/, "0");
                                if ((/\d/).test(values[cc].charAt(1)) === true) {
                                    values[cc] = values[cc].substr(1);
                                }
                            } else if ((/^url\((?!\$)/).test(values[cc]) === true && (/\+/).test(values[cc]) === false && values[cc].charAt(values[cc].length - 1) === ")") {
                                if (values[cc].charAt(4) !== "\"") {
                                    if (values[cc].charAt(4) === "'") {
                                        values[cc] = values[cc].replace("url('", "url(\"");
                                    } else {
                                        values[cc] = values[cc].replace("url(", "url(\"");
                                        if (values[cc] === "url(\")") {
                                            values[cc] = "url(\"\")";
                                        }
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
                //backtrack through immediately prior comments to
                //find the correct token
                if (ltype === "comment" || ltype === "comment-inline") {
                    do {
                        aa    -= 1;
                        ltype = types[aa];
                        coms.push(token[aa]);
                    } while (aa > 0 && (ltype === "comment" || ltype === "comment-inline"));
                } else {
                    aa -= 1;
                }
                //if the last non-comment type is 'item' then id it
                if (ltype === "item") {
                    if (type === "start") {
                        stats.selectors.count += 1;
                        stats.selectors.chars += itemsize;
                        if (types[aa - 1] !== "comment" && types[aa - 1] !== "comment-inline" && types[aa - 1] !== "end" && types[aa - 1] !== "start" && types[aa - 1] !== "semi" && types[aa - 1] !== undefined) {
                            (function csspretty__tokenize_item_selparts() {
                                var parts = [],
                                    cc    = aa,
                                    dd    = 0;
                                do {
                                    parts.push(token[cc]);
                                    if (spacecol === true && token[cc] === ":" && token[cc - 1] !== ":") {
                                        parts.push(" ");
                                    }
                                    cc -= 1;
                                } while (cc > -1 && types[cc] !== "comment" && types[cc] !== "comment-inline" && types[cc] !== "end" && types[cc] !== "start" && types[cc] !== "semi" && types[cc] !== undefined);
                                parts.reverse();
                                cc += 1;
                                dd = aa - cc;
                                token.splice(cc, dd);
                                types.splice(cc, dd);
                                lines.splice(cc, dd);
                                aa        -= dd;
                                token[aa] = parts.join("")
                                    .replace(/\s*,(\s*)/g, ",");
                            }());
                        } else {
                            token[aa] = token[aa].replace(/\s*,(\s*)/g, ",");
                        }
                        types[aa] = "selector";
                    } else if (type === "end") {
                        types[aa] = "value";
                        if (smode !== "diff") {
                            token[aa] = value(token[aa]);
                        }
                        //take comments out until the 'item' is
                        //found and then put the comments back
                        if (smode === "beautify" || (smode === "diff" && sdiffcomm === true)) {
                            if (token[token.length - 2] === "{") {
                                types[types.length - 1] = "propvar";
                                stats.values.count      -= 1;
                                stats.values.chars      -= itemsize;
                                stats.variables.count   += 1;
                                stats.variables.chars   += itemsize;
                            } else {
                                if (coms.length > 0 && ltype !== "semi" && ltype !== "end" && ltype !== "start") {
                                    aa = coms.length - 1;
                                    do {
                                        token.pop();
                                        types.pop();
                                        lines.pop();
                                        aa -= 1;
                                    } while (aa > 0);
                                    if (smode === "diff") {
                                        token.push("x;");
                                    } else {
                                        token.push(";");
                                    }
                                    types.push("semi");
                                    lines.push(0);
                                    bb = coms.length - 1;
                                    do {
                                        token.push(coms[aa]);
                                        if (coms[aa].indexOf("//") === 0 && lines[lines.length - 1] === 0) {
                                            types.push("comment-inline");
                                        } else {
                                            types.push("comment");
                                        }
                                        lines.push(0);
                                        aa += 1;
                                    } while (aa < bb);
                                } else {
                                    if (smode === "diff") {
                                        token.push("x;");
                                    } else {
                                        token.push(";");
                                    }
                                    types.push("semi");
                                    lines.push(0);
                                }
                            }
                        }
                        stats.values.count += 1;
                        stats.values.chars += itemsize;
                    } else if (type === "semi") {
                        if (types[aa - 1] === "colon") {
                            stats.values.count += 1;
                            stats.values.chars += itemsize;
                            types[aa]          = "value";
                            if (smode !== "diff") {
                                token[aa] = value(token[aa]);
                            }
                        } else {
                            //properties without values are
                            //considered variables
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
            //finds comments include those JS looking '//' comments
            comment    = function csspretty__tokenize_comment(inline) {
                var aa        = 0,
                    out       = [b[a]],
                    type      = "",
                    spareType = [],
                    spareToke = [],
                    spareLine = [];
                spacer(false);
                type = (inline === true && lines[lines.length - 1] === 0 && token[token.length - 1] !== "comment" && token[token.length - 1] !== "comment-inline")
                    ? "comment-inline"
                    : "comment";
                for (aa = a + 1; aa < len; aa += 1) {
                    out.push(b[aa]);
                    if ((inline === false && b[aa - 1] === "*" && b[aa] === "/") || (inline === true && (b[aa + 1] === "\n"))) {
                        break;
                    }
                }
                a                    = aa;
                stats.comments.count += 1;
                stats.comments.chars += out.length;
                if (smode === "minify") {
                    out.push("\n");
                }
                if (smode === "beautify" || (smode === "diff" && sdiffcomm === true) || (smode === "minify" && stopcoms === true)) {
                    if (token.length > 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === "," && types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline") {
                        spareToke.push(token[token.length - 1]);
                        token.pop();
                        types.pop();
                        lines.pop();
                        token.push(out.join(""));
                        types.push(type);
                        lines.push(0);
                        token.push(spareToke[0]);
                        types.push("selector");
                        lines.push(0);
                    } else if (ltype === "colon" || ltype === "property" || ltype === "value" || ltype === "propvar") {
                        do {
                            spareToke.push(token[token.length - 1]);
                            spareType.push(types[types.length - 1]);
                            spareLine.push(lines[lines.length - 1]);
                            token.pop();
                            types.pop();
                            lines.pop();
                        } while (types.length > 1 && types[types.length - 1] !== "semi" && types[types.length - 1] !== "start");
                        token.push(out.join(""));
                        types.push(type);
                        lines.push(0);
                        do {
                            token.push(spareToke[spareToke.length - 1]);
                            types.push(spareType[spareType.length - 1]);
                            lines.push(spareLine[spareLine.length - 1]);
                            spareToke.pop();
                            spareType.pop();
                            spareLine.pop();
                        } while (spareToke.length > 0);
                    } else {
                        ltype = type;
                        types.push(type);
                        token.push(out.join(""));
                        lines.push(0);
                    }
                }
            },
            //the generic token builder
            buildtoken = function csspretty__tokenize_build() {
                var aa    = 0,
                    bb    = 0,
                    out   = [],
                    block = "",
                    comma = (token.length > 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === ",");
                spacer(false);
                //this loop accounts for grouping mechanisms
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
                        } else if (b[aa] === "#" && b[aa + 1] === "{") {
                            block = "}";
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
                if (comma === true && types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline") {
                    token[token.length - 1] = token[token.length - 1] + out.join("")
                        .replace(/\s+/g, " ")
                        .replace(/^\s/, "")
                        .replace(/\s$/, "");
                    return;
                }
                token.push(out.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, ""));
                lines.push(0);
                if (token[token.length - 1].indexOf("extend(") === 0) {
                    ltype = "pseudo";
                    types.push("pseudo");
                } else {
                    ltype = "item";
                    types.push("item");
                }
            },
            //do fancy things to property types like: sorting,
            //consolidating, and padding
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
                    stype = [],
                    sline = [];
                //identify properties and build out prop/val sets
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
                    if (bb === 1 && types[aa] === "property" && smode === "beautify") {
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
                //pad out those property names so that the colons
                //are vertically aligned
                if (svertical === true) {
                    for (aa = p.length - 1; aa > -1; aa -= 1) {
                        if (token[p[aa]].length > bb && token[p[aa]] !== "filter" && token[p[aa]] !== "progid") {
                            bb = token[p[aa]].length;
                        }
                    }
                    for (aa = p.length - 1; aa > -1; aa -= 1) {
                        cc = bb - token[p[aa]].length;
                        if (cc > 0 && token[p[aa]] !== "filter" && token[p[aa]] !== "progid") {
                            do {
                                token[p[aa]] = token[p[aa]] + " ";
                                cc           -= 1;
                            } while (cc > 0);
                        }
                    }
                }
                //consolidate margin and padding
                (function csspretty__tokenize_properties_propcheck() {
                    var leng      = set.length,
                        fourcount = function csspretty__tokenize_properties_propcheck_fourcount(ind, name) {
                            var test         = [
                                    false, false, false, false
                                ],
                                value        = [
                                    "0", "0", "0", "0"
                                ],
                                zero         = (/^(0+([a-z]+|%))/),
                                start        = -1,
                                yy           = -1,
                                xx           = 0,
                                valsplit     = [],
                                important    = false,
                                store        = function csspretty__tokenize_properties_propcheck_fourcount_store(side) {
                                    yy          += 1;
                                    value[side] = token[set[xx][2]];
                                    test[side]  = true;
                                    if (start < 0) {
                                        start = xx;
                                    }
                                },
                                fixalignment = function csspretty__tokenize_properties_propcheck_fourcount_fixalignment() {
                                    var aaa  = 0,
                                        bbb  = 0,
                                        ccc  = 0,
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
                                                ccc           -= 1;
                                            } while (ccc > 0);
                                        }
                                    }
                                };
                            for (xx = ind; xx < leng; xx += 1) {
                                if (token[set[xx][0]].indexOf(name) < 0) {
                                    break;
                                }
                                if (token[set[xx][2]] !== undefined && token[set[xx][0]].indexOf(name) === 0) {
                                    if (token[set[xx][2]].indexOf("!important") > -1) {
                                        important         = true;
                                        token[set[xx][2]] = token[set[xx][2]].replace(/\s*!important/, "");
                                    }
                                    if (token[set[xx][0]] === name || token[set[xx][0]].indexOf(name + " ") === 0) {
                                        yy       += 1;
                                        valsplit = token[set[xx][2]].split(" ");
                                        if (valsplit.length === 1) {
                                            value = [
                                                token[set[xx][2]], token[set[xx][2]], token[set[xx][2]], token[set[xx][2]]
                                            ];
                                        } else if (valsplit.length === 2) {
                                            value = [
                                                valsplit[0], valsplit[1], valsplit[0], valsplit[1]
                                            ];
                                        } else if (valsplit.length === 3) {
                                            value = [
                                                valsplit[0], valsplit[1], valsplit[2], valsplit[1]
                                            ];
                                        } else if (valsplit.length === 4) {
                                            value = [
                                                valsplit[0], valsplit[1], valsplit[2], valsplit[3]
                                            ];
                                        }
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
                                if (token[set[xx][0]].indexOf(name) > -1 || xx === leng - 1) {
                                    if (test[0] === true && test[1] === true && test[2] === true && test[3] === true) {
                                        set.splice(start + 1, yy);
                                        leng                 -= yy;
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
                                            value.pop();
                                            if (value[0] === value[2]) {
                                                value.pop();
                                                if (value[0] === value[1]) {
                                                    value.pop();
                                                }
                                            }
                                        }
                                        token[set[start][2]] = value.join(" ");
                                        if (smode === "beautify" && svertical === true) {
                                            if (token[set[start][0]].charAt(token[set[start][0]].length - 1) === " ") {
                                                yy = token[set[start][0]].length - name.length;
                                                do {
                                                    name = name + " ";
                                                    yy   -= 1;
                                                } while (yy > 0);
                                            } else {
                                                fixalignment();
                                            }
                                        }
                                    }
                                    if (important === true) {
                                        token[set[start][2]] = token[set[start][2]] + " !important";
                                    }
                                    break;
                                }
                                if (important === true) {
                                    token[set[xx][2]] = token[set[xx][2]] + " !important";
                                }
                            }
                        };
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
                        sline.push(lines[set[aa][cc]]);
                    }
                }
                //replace a block's data with sorted analyzed data
                token.splice(next + 1, token.length - next - 1);
                types.splice(next + 1, types.length - next - 1);
                lines.splice(next + 1, lines.length - next - 1);
                token = token.concat(stoke);
                types = types.concat(stype);
                lines = lines.concat(sline);
            };
        //token building loop
        for (a = 0; a < len; a += 1) {
            if (ltype !== "comment" && ltype !== "comment-inline" && ltype !== "" && stopcoms === true) {
                stopcoms = false;
            }
            if ((/\s/).test(b[a]) === true) {
                stats.space += 1;
                space       += b[a];
            } else if (b[a] === "/" && b[a + 1] === "*") {
                comment(false);
            } else if (b[a] === "/" && b[a + 1] === "/") {
                comment(true);
            } else if (b[a] === "{") {
                if (token[token.length - 2] === ":") {
                    types[types.length - 1] = "pseudo";
                }
                item("start");
                ltype = "start";
                types.push("start");
                token.push("{");
                lines.push(0);
                stats.braces += 1;
                space        = "";
                spacecol     = false;
            } else if (b[a] === "}") {
                if (types[types.length - 1] === "item" && token[token.length - 2] === "{" && token[token.length - 3] !== undefined && token[token.length - 3].charAt(token[token.length - 3].length - 1) === "@") {
                    token[token.length - 3] = token[token.length - 3] + "{" + token[token.length - 1] + "}";
                    token.pop();
                    token.pop();
                    types.pop();
                    types.pop();
                    lines.pop();
                    lines.pop();
                } else {
                    item("end");
                    if (smode !== "diff") {
                        properties();
                    }
                    ltype = "end";
                    if (sobjsort === true) {
                        objSort();
                    }
                    types.push("end");
                    token.push("}");
                    lines.push(0);
                    stats.braces += 1;
                    space        = "";
                }
            } else if (b[a] === ";") {
                item("semi");
                if (types[types.length - 1] !== "semi") {
                    ltype = "semi";
                    types.push("semi");
                    token.push(";");
                    lines.push(0);
                }
                stats.semi += 1;
                space      = "";
            } else if (b[a] === ":") {
                item("colon");
                ltype = "colon";
                types.push("colon");
                token.push(":");
                lines.push(0);
                stats.colon += 1;
                space       = "";
                if ((/\s/).test(b[a - 1]) === true) {
                    spacecol = true;
                } else if (b[a - 1] !== ":") {
                    spacecol = false;
                }
            } else {
                buildtoken();
            }
        }
        spacer(true);
    }());
    if (smode === "parse") {
        return {
            token: token,
            types: types
        };
    }

    //beautification
    if (smode !== "minify") {
        output = (function csspretty__beautify() {
            var a        = 0,
                len      = token.length,
                build    = [],
                indent   = sinlevel,
                mixin    = false,
                //a single unit of indentation
                tab      = (function csspretty__beautify_tab() {
                    var aa = 0,
                        bb = [];
                    for (aa = 0; aa < sinsize; aa += 1) {
                        bb.push(sinchar);
                    }
                    return bb.join("");
                }()),
                //new lines plus indentation
                nl       = function csspretty__beautify_nl(tabs) {
                    var aa = 0;
                    build.push("\n");
                    for (aa = 0; aa < tabs; aa += 1) {
                        build.push(tab);
                    }
                },
                //breaks selector lists onto newlines
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
                    if (leng === 0) {
                        items.push(item);
                    }
                    build.push(items[0].replace(/,(\s*)/g, ", ").replace(/(,\ )$/, ","));
                    for (aa = 1; aa < leng; aa += 1) {
                        nl(indent);
                        build.push(items[aa].replace(/,(\s*)/g, ", ").replace(/(,\ )$/, ","));
                    }
                    build.push(" ");
                };
            if (sinlevel > 0) {
                a = sinlevel;
                do {
                    a -= 1;
                    build.push(tab);
                } while (a > 0);
            }

            //beautification loop
            for (a = 0; a < len; a += 1) {
                if (types[a] === "start") {
                    if (a > 0 && token[a - 1].charAt(token[a - 1].length - 1) === "#") {
                        build.push(token[a]);
                    } else {
                        if (types[a - 1] === "colon") {
                            build.push(" ");
                        }
                        build.push(token[a]);
                        indent += 1;
                        if (types[a + 1] !== "selector" || scssinsertlines === false) {
                            nl(indent);
                        }
                    }
                } else if (types[a] === "end") {
                    if (mixin === true) {
                        mixin = false;
                        build.push(token[a]);
                        build.push(" ");
                    } else {
                        indent -= 1;
                        nl(indent);
                        build.push(token[a]);
                        if (scssinsertlines === true && types[a + 1] === "selector" && lines[a] < 2 && token[a - 1] !== "{") {
                            build.push("\n");
                        } else if (types[a + 1] !== "end" && types[a + 1] !== "semi") {
                            if (scssinsertlines === true && types[a + 1] === "comment" && types[a] === "end") {
                                build.push("\n");
                            } else {
                                nl(indent);
                            }
                        }
                    }
                } else if (types[a] === "semi") {
                    if (token[a] !== "x;") {
                        build.push(token[a]);
                    }
                    if (types[a + 1] === "comment-inline") {
                        build.push(" ");
                    } else if (types[a + 1] !== "end") {
                        nl(indent);
                    }
                } else if (types[a] === "selector") {
                    if (a > 0 && types[a - 1] !== "comment" && scssinsertlines === true) {
                        nl(indent);
                    }
                    if (token[a].charAt(token[a].length - 1) === "#") {
                        build.push(token[a]);
                        mixin = true;
                    } else if (token[a].indexOf(",") > -1) {
                        selector(token[a]);
                    } else {
                        if (token[a].charAt(0) === ":" && token[a - 1] === "}" && build[build.length - 1] === " ") {
                            build.pop();
                        }
                        build.push(token[a]);
                        build.push(" ");
                    }
                } else if ((types[a] === "comment" || types[a] === "comment-inline") && types[a - 1] !== "colon" && types[a - 1] !== "property") {
                    if (lines[a - 1] > 0) {
                        nl(indent);
                    }
                    build.push(token[a]);
                    if (types[a + 1] !== "end") {
                        nl(indent);
                    }
                } else {
                    if (types[a] === "value" && types[a - 1] !== "semi" && (mixin === false || token[a - 1] === ":") && token[a - 2] !== "filter" && token[a - 2] !== "progid") {
                        build.push(" ");
                    }
                    build.push(token[a]);
                }
            }
            if (spres === true && (lines[lines.length - 1] > 0 || endline === true)) {
                return build.join("")
                    .replace(/(\s+)$/, "\n");
            }
            return build.join("")
                .replace(/(\s+)$/, "");
        }());
    } else {
        output = token.join("")
            .replace(/;\}/g, "}");
    }
    //summary
    if (smode === "beautify") {
        (function csspretty__summary() {
            var summ = [],
                inl  = ssource.length,
                out  = output.length,
                uris = uri.length,
                uric = 0,
                a    = 0,
                b    = 0;
            summ.push("<div class='doc' id='cssreport'><p><strong>Number of HTTP requests:</strong> <em" +
                    ">");
            summ.push(uris);
            summ.push("</em></p><table class='analysis' id='css-parts' summary='Component counts and si" +
                    "zes'><caption>Component counts and sizes</caption><thead><tr><th>Type Name</th><" +
                    "th>Quantity</th><th>Character Size</th></tr></thead><tbody><tr><th>curly braces<" +
                    "/th><td>");
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
            summ.push("</td></tr></tbody></table><table class='analysis' id='css-size' summary='CSS cha" +
                    "racter size change'><caption>CSS character size change</caption><tbody><tr><th>I" +
                    "nput</th><td>");
            summ.push(inl);
            summ.push("</td></tr><tr><th>Output</th><td>");
            summ.push(out);
            summ.push("</td></tr><tr><th>");
            if (out > inl) {
                summ.push("Increase</th><td>");
                summ.push(out - inl);
                summ.push("</td></tr><tr><th>Percent Change</th><td>");
                a = (((out - inl) / out) * 100);
                summ.push(a.toFixed(2));
            } else {
                summ.push("Decrease</th><td>");
                summ.push(inl - out);
                summ.push("</td></tr><tr><th>Percent Change</th><td>");
                a = (((inl - out) / inl) * 100);
                summ.push(a.toFixed(2));
            }
            summ.push("%</td></tr></tbody></table><table class='analysis' id='css-uri' summary='A list " +
                    "of HTTP requests'><caption>A List of HTTP Requests</caption><thead><tr><th>Quant" +
                    "ity</th><th>URI</th></tr></thead><tbody>");
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
                summ.push(uri[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                summ.push("</td></tr>");
            }
            summ.push("</tbody></table></div>");
            global.report = summ.join("");
        }());
    }
    return output;
};
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api     = function commonjs(x) {
        "use strict";
        return csspretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api     = function requirejs_export(x) {
            return csspretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
