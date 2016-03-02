/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*jshint laxbreak: true*/
/*global ace, define, exports, global*/
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
var csspretty = function csspretty_(options) {
    "use strict";
    var token      = [],
        types      = [],
        lines      = [],
        uri        = [],
        colors     = [],
        output     = "",
        endline    = false,
        objsortop  = false,
        verticalop = false,
        colorNames = {
            aliceblue           : 0.9288006825347457,
            antiquewhite        : 0.8464695170775405,
            aqua                : 0.7874,
            aquamarine          : 0.8078549208338043,
            azure               : 0.9726526495416643,
            beige               : 0.8988459998705021,
            bisque              : 0.8073232737297876,
            black               : 0,
            blanchedalmond      : 0.8508443960815607,
            blue                : 0.0722,
            blueviolet          : 0.12622014321946043,
            brown               : 0.09822428787651079,
            burlywood           : 0.5155984453389335,
            cadetblue           : 0.29424681085422044,
            chartreuse          : 0.7603202590262282,
            chocolate           : 0.23898526114557292,
            coral               : 0.3701793087292368,
            cornflowerblue      : 0.30318641994179363,
            cornsilk            : 0.9356211037296492,
            crimson             : 0.16042199953025577,
            cyan                : 0.7874,
            darkblue            : 0.018640801980939217,
            darkcyan            : 0.2032931783904645,
            darkgoldenrod       : 0.27264703559992554,
            darkgray            : 0.39675523072562674,
            darkgreen           : 0.09114342904757505,
            darkgrey            : 0.39675523072562674,
            darkkhaki           : 0.45747326349994155,
            darkmagenta         : 0.07353047651207048,
            darkolivegreen      : 0.12651920884889156,
            darkorange          : 0.40016167026523863,
            darkorchid          : 0.1341314217485677,
            darkred             : 0.05488967453113126,
            darksalmon          : 0.4054147156338075,
            darkseagreen        : 0.43789249325969054,
            darkslateblue       : 0.06579284622798763,
            darkslategray       : 0.06760815192804355,
            darkslategrey       : 0.06760815192804355,
            darkturquoise       : 0.4874606277449034,
            darkviolet          : 0.10999048339343433,
            deeppink            : 0.2386689582827583,
            deepskyblue         : 0.444816033955754,
            dimgray             : 0.14126329114027164,
            dimgrey             : 0.14126329114027164,
            dodgerblue          : 0.2744253699145608,
            firebrick           : 0.10724525535015225,
            floralwhite         : 0.9592248482500424,
            forestgreen         : 0.18920812076002244,
            fuchsia             : 0.2848,
            gainsboro           : 0.7156935005064806,
            ghostwhite          : 0.9431126188632283,
            gold                : 0.6986087742815887,
            goldenrod           : 0.41919977809568404,
            gray                : 0.21586050011389915,
            green               : 0.15438342968146068,
            greenyellow         : 0.8060947261145331,
            grey                : 0.21586050011389915,
            honeydew            : 0.9633653555478173,
            hotpink             : 0.3465843816971475,
            indianred           : 0.21406134963884,
            indigo              : 0.031075614863369846,
            ivory               : 0.9907127060061531,
            khaki               : 0.7701234339412052,
            lavendar            : 0.8031875051452125,
            lavendarblush       : 0.9017274863104644,
            lawngreen           : 0.7390589312496334,
            lemonchiffon        : 0.9403899224562171,
            lightblue           : 0.6370914128080659,
            lightcoral          : 0.35522120733134843,
            lightcyan           : 0.9458729349482863,
            lightgoldenrodyellow: 0.9334835101829635,
            lightgray           : 0.651405637419824,
            lightgreen          : 0.6909197995686475,
            lightgrey           : 0.651405637419824,
            lightpink           : 0.5856615273489745,
            lightsalmon         : 0.47806752252059587,
            lightseagreen       : 0.3505014511704197,
            lightskyblue        : 0.5619563761833096,
            lightslategray      : 0.23830165007286924,
            lightslategrey      : 0.23830165007286924,
            lightyellow         : 0.9816181839288161,
            lime                : 0.7152,
            limegreen           : 0.44571042246097864,
            linen               : 0.8835734098437936,
            magenta             : 0.2848,
            maroon              : 0.04589194232421496,
            mediumaquamarine    : 0.4938970331080111,
            mediumblue          : 0.04407778021232784,
            mediumorchid        : 0.21639251153773428,
            mediumpurple        : 0.22905858091648004,
            mediumseagreen      : 0.34393112338131226,
            mediumslateblue     : 0.20284629471622434,
            mediumspringgreen   : 0.7070430819418444,
            mediumturquois      : 0.5133827926447991,
            mediumvioletred     : 0.14371899849357186,
            midnightblue        : 0.020717866350860484,
            mintcream           : 0.9783460494758793,
            mistyrose           : 0.8218304785918541,
            moccasin            : 0.8008300099156694,
            navajowhite         : 0.7651968234278562,
            navy                : 0.015585128108223519,
            oldlace             : 0.9190063340554899,
            olive               : 0.20027537200567563,
            olivedrab           : 0.2259315095192918,
            orange              : 0.48170267036309605,
            orangered           : 0.2551624375341641,
            orchid              : 0.3134880676143873,
            palegoldenrod       : 0.7879264788761452,
            palegreen           : 0.7793675900635259,
            paleturquoise       : 0.764360779217138,
            palevioletred       : 0.2875499411788909,
            papayawhip          : 0.8779710019983541,
            peachpuff           : 0.7490558987825108,
            peru                : 0.3011307487793569,
            pink                : 0.6327107070246611,
            plum                : 0.4573422158796909,
            powderblue          : 0.6825458650060524,
            purple              : 0.061477070432438476,
            red                 : 0.2126,
            rosyblue            : 0.3231945764940708,
            royalblue           : 0.16663210743188323,
            saddlebrown         : 0.09792228502052071,
            salmon              : 0.3697724152759545,
            sandybrown          : 0.46628543696283414,
            seagreen            : 0.1973419970627483,
            seashell            : 0.927378622069223,
            sienna              : 0.13697631337097677,
            silver              : 0.527115125705813,
            skyblue             : 0.5529166851818412,
            slateblue           : 0.14784278062136097,
            slategray           : 0.20896704076536138,
            slategrey           : 0.20896704076536138,
            slightsteelblue     : 0.5398388828466575,
            snow                : 0.9653334183484877,
            springgreen         : 0.7305230606852947,
            steelblue           : 0.20562642207624846,
            tan                 : 0.48237604163921527,
            teal                : 0.1699685577896842,
            thistle             : 0.5681840109373312,
            tomato              : 0.3063861271941505,
            turquoise           : 0.5895536427577983,
            violet              : 0.40315452986676303,
            wheat               : 0.7490970282048214,
            white               : 1,
            whitesmoke          : 0.913098651793419,
            yellow              : 0.9278,
            yellowgreen         : 0.5076295720870697
        },
        stats      = {
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
        },
        lf         = (options.crlf === true || options.crlf === "true")
            ? "\r\n"
            : "\n";
    (function csspretty__options() {
        objsortop              = (options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "css");
        options.accessibility  = (options.accessibility === true || options.accessibility === "true");
        options.braces         = (options.braces === true || options.braces === "allman");
        options.compressedcss  = (options.compressedcss === true || options.compressedcss === "true");
        options.cssinsertlines = (options.cssinsertlines === true || options.cssinsertlines === "true");
        options.diffcomm       = (options.diffcomm === true || options.diffcomm === "true");
        options.inchar         = (typeof options.inchar !== "string" || options.inchar === "")
            ? " "
            : options.inchar;
        options.inlevel        = (isNaN(options.inlevel) === true)
            ? 0
            : Number(options.inlevel);
        options.insize         = (isNaN(options.insize) === true)
            ? 4
            : Number(options.insize);
        options.mode           = (options.mode === "minify" || options.mode === "parse" || options.mode === "diff")
            ? options.mode
            : "beautify";
        options.noleadzero     = (options.noleadzero === true || options.noleadzero === "true");
        options.preserve       = (function csspretty__options_preserve() {
            if (options.preserve === 1 || options.preserve === undefined || options.preserve === true || options.preserve === "all" || options.preserve === "js" || options.preserve === "css") {
                return 1;
            }
            if (options.preserve === false || isNaN(options.preserve) === true || Number(options.preserve) < 1 || options.preserve === "none") {
                return 0;
            }
            return Number(options.preserve);
        }());
        options.quoteConvert   = (options.quoteConvert === "single" || options.quoteConvert === "double")
            ? options.quoteConvert
            : "none";
        options.selectorlist   = (options.selectorlist === true || options.selectorlist === "true");
        options.source         = (typeof options.source !== "string" || options.source === "" || (/^(\s+)$/).test(options.source) === true)
            ? "Error: no source supplied to csspretty."
            : options
                .source
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
        options.topcoms        = (options.topcoms === true || options.topcoms === "true");
        verticalop             = (options.vertical === true || options.vertical === "true" || options.vertical === "all" || options.vertical === "css");
        if (options.compressedcss === true) {
            verticalop = false;
        }
    }());
    if (options.source === "Error: no source supplied to csspretty.") {
        return options.source;
    }
    (function csspretty__tokenize() {
        var a          = 0,
            b          = options
                .source
                .split(""),
            len        = options.source.length,
            ltype      = "",
            itemsize   = 0,
            space      = "",
            endtest    = false,
            spacecol   = false,
            //map location of empty lines for beautification
            spacer     = function csspretty__tokenize_space(end) {
                var slen  = space
                        .split(lf)
                        .length - 1,
                    value = 0;
                if (token.length === 0 && slen > 0) {
                    slen += 1;
                }
                if (slen > 0 && options.preserve > 0) {
                    if (slen > options.preserve) {
                        value = options.preserve + 1;
                    } else {
                        value = slen;
                    }
                } else if (space.length > 1) {
                    value = 1;
                } else if (slen === 0 && types[types.length - 1] === "comment" && types[types.length - 2] !== "comment") {
                    types[types.length - 1] = "comment-inline";
                }
                if (slen > 1 && end === true && options.preserve > 0) {
                    endline = true;
                    space = "";
                    return value;
                }
                space = "";
                return value;
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
                            start = cc;
                            if (types[end + 1] === "comment-inline") {
                                end += 1;
                            }
                            if (types[start - 1] === "comment") {
                                do {
                                    start -= 1;
                                } while (start > -1 && types[start - 1] === "comment");
                            }
                            keys.push([
                                start, end + 1,
                                false
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
                                    pairLines.push(lines[ee]);
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
                    value = function csspretty__tokenize_item_value(val, font) {
                        var x         = val.split(""),
                            leng      = x.length,
                            cc        = 0,
                            dd        = 0,
                            items     = [],
                            block     = "",
                            values    = [],
                            qchar     = "",
                            colorPush = function csspretty__tokenize_item_value_colorPush(value) {
                                var vl = value.toLowerCase();
                                if ((/^(#[0-9a-f]{3,6})$/).test(vl) === true) {
                                    colors.push(value);
                                } else if ((/^(rgba?\()/).test(vl) === true) {
                                    colors.push(value);
                                } else if (colorNames[vl] !== undefined) {
                                    colors.push(value);
                                }
                                return value;
                            };
                        if (options.quoteConvert === "double") {
                            qchar = "\"";
                        } else if (options.quoteConvert === "single") {
                            qchar = "'";
                        }
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
                                values.push(colorPush(items.join("")));
                                items = [];
                            }
                        }
                        values.push(colorPush(items.join("")));
                        leng = values.length;
                        //This is where the rules mentioned above
                        //are applied
                        for (cc = 0; cc < leng; cc += 1) {
                            if (options.noleadzero === false && (/^(\.\d)/).test(values[cc]) === true) {
                                values[cc] = "0" + values[cc];
                            } else if (options.noleadzero === true && (/^(0+\.)/).test(values[cc])) {
                                values[cc] = values[cc].replace(/^(0+\.)/, ".");
                            } else if ((/^(0+([a-z]{2,3}|%))$/).test(values[cc]) === true) {
                                values[cc] = "0";
                            } else if ((/^(0+)/).test(values[cc]) === true) {
                                values[cc] = values[cc].replace(/0+/, "0");
                                if ((/\d/).test(values[cc].charAt(1)) === true) {
                                    values[cc] = values[cc].substr(1);
                                }
                            } else if ((/^url\((?!\$)/).test(values[cc]) === true && values[cc].charAt(values[cc].length - 1) === ")") {
                                if (qchar === "" && (/url\(('|")/).test(values[cc]) === false) {
                                    values[cc] = values[cc]
                                        .replace(/url\(('|")?/, "url(\"")
                                        .replace(/(('|")?\))$/, "\")");
                                } else if (qchar !== "") {
                                    values[cc] = values[cc]
                                        .replace(/url\(('|")?/, "url(" + qchar)
                                        .replace(/(('|")?\))$/, qchar + ")");
                                }
                            } else if (font === true) {
                                if (qchar === "'") {
                                    values[cc] = values[cc].replace(/"/g, "'");
                                } else {
                                    values[cc] = values[cc].replace(/'/g, "\"");
                                }
                            } else if (font === false && qchar !== "" && ((qchar === "\"" && values[cc].charAt(0) === "'" && values[cc].charAt(values[cc].length - 1) === "'") || (qchar === "'" && values[cc].charAt(0) === "\"" && values[cc].charAt(values[cc].length - 1) === "\""))) {
                                values[cc] = qchar + values[cc].slice(1, values[cc].length - 1) + qchar;
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
                                token[aa] = parts
                                    .join("")
                                    .replace(/\s*,(\s*)/g, ",");
                            }());
                        } else {
                            token[aa] = token[aa].replace(/\s*,(\s*)/g, ",");
                        }
                        types[aa] = "selector";
                    } else if (type === "end") {
                        types[aa] = "value";
                        if (options.mode !== "diff") {
                            if (options.quoteConvert !== "none" && (token[aa - 2] === "font" || token[aa - 2] === "font-family")) {
                                token[aa] = value(token[aa], true);
                            } else {
                                token[aa] = value(token[aa], false);
                            }
                        }
                        //take comments out until the 'item' is
                        //found and then put the comments back
                        if (options.mode === "beautify" || (options.mode === "diff" && options.diffcomm === true)) {
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
                                    if (options.mode === "diff") {
                                        token.push("x;");
                                    } else {
                                        token.push(";");
                                    }
                                    types.push("semi");
                                    lines.push(spacer(false));
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
                                    if (options.mode === "diff") {
                                        token.push("x;");
                                    } else {
                                        token.push(";");
                                    }
                                    types.push("semi");
                                    lines.push(spacer(false));
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
                            if (options.mode !== "diff") {
                                if (options.quoteConvert !== "none" && (token[aa - 2] === "font" || token[aa - 2] === "font-family")) {
                                    token[aa] = value(token[aa], true);
                                } else {
                                    token[aa] = value(token[aa], false);
                                }
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
                    type      = "comment",
                    spareType = [],
                    spareToke = [],
                    spareLine = [],
                    linev     = spacer(false);
                type = (inline === true && linev === 0)
                    ? "comment-inline"
                    : "comment";
                for (aa = a + 1; aa < len; aa += 1) {
                    out.push(b[aa]);
                    if ((inline === false && b[aa - 1] === "*" && b[aa] === "/") || (inline === true && b[aa + 1] === "\n")) {
                        break;
                    }
                }
                a                    = aa;
                stats.comments.count += 1;
                stats.comments.chars += out.length;
                if (options.mode === "minify") {
                    out.push("\n");
                }
                if (options.mode === "beautify" || (options.mode === "diff" && options.diffcomm === true) || (options.mode === "minify" && options.topcoms === true)) {
                    if (token.length > 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === "," && types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline") {
                        spareToke.push(token[token.length - 1]);
                        token.pop();
                        types.pop();
                        lines.pop();
                        token.push(out.join(""));
                        types.push(type);
                        lines.push(linev);
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
                        lines.push(linev);
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
                        lines.push(linev);
                    }
                }
            },
            //the generic token builder
            buildtoken = function csspretty__tokenize_build() {
                var aa    = 0,
                    bb    = 0,
                    out   = [],
                    block = "",
                    comma = (token.length > 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === ","),
                    linev = spacer(false);
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
                    token[token.length - 1] = token[token.length - 1] + out
                        .join("")
                        .replace(/\s+/g, " ")
                        .replace(/^\s/, "")
                        .replace(/\s$/, "");
                    return;
                }
                token.push(out.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, ""));
                lines.push(linev);
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
                    if (bb === 1 && types[aa] === "property" && options.mode === "beautify") {
                        p.push(aa);
                    }
                    set[set.length - 1].push(aa);
                    if (bb === 1 && (types[aa - 1] === "comment" || types[aa - 1] === "comment-inline" || types[aa - 1] === "semi" || types[aa - 1] === "end" || types[aa - 1] === "start") && types[aa] !== "start" && types[aa] !== "end") {
                        set.push([]);
                    }
                }
                //this reverse fixes the order of consecutive comments
                set.reverse();
                p.reverse();

                //consolidate margin and padding
                (function csspretty__tokenize_properties_propcheck() {
                    var leng      = set.length,
                        fourcount = function csspretty__tokenize_properties_propcheck_fourcount(name) {
                            var test      = [
                                    false, false, false, false
                                ],
                                value     = [
                                    "0", "0", "0", "0"
                                ],
                                zero      = (/^(0+([a-z]+|%))/),
                                start     = aa,
                                yy        = -1,
                                zz        = 0,
                                valsplit  = [],
                                important = false,
                                store     = function csspretty__tokenize_properties_propcheck_fourcount_store(side) {
                                    yy          += 1;
                                    value[side] = token[set[aa][2]];
                                    test[side]  = true;
                                    if (start < 0) {
                                        start = aa;
                                    }
                                };
                            for (aa = aa; aa < leng; aa += 1) {
                                if (token[set[aa][2]] !== undefined && token[set[aa][0]].indexOf(name) === 0) {
                                    if (token[set[aa][2]].indexOf("!important") > -1) {
                                        important         = true;
                                        token[set[aa][2]] = token[set[aa][2]].replace(/\s*!important/, "");
                                    }
                                    if (token[set[aa][0]] === name || token[set[aa][0]].indexOf(name + " ") === 0) {
                                        yy       += 1;
                                        valsplit = token[set[aa][2]].split(" ");
                                        if (valsplit.length === 1) {
                                            value = [
                                                token[set[aa][2]],
                                                token[set[aa][2]],
                                                token[set[aa][2]],
                                                token[set[aa][2]]
                                            ];
                                        } else if (valsplit.length === 2) {
                                            value = [valsplit[0], valsplit[1], valsplit[0], valsplit[1]];
                                        } else if (valsplit.length === 3) {
                                            value = [valsplit[0], valsplit[1], valsplit[2], valsplit[1]];
                                        } else if (valsplit.length === 4) {
                                            value = [valsplit[0], valsplit[1], valsplit[2], valsplit[3]];
                                        } else {
                                            return;
                                        }
                                        test = [true, true, true, true];
                                    } else if (token[set[aa][0]].indexOf(name + "-bottom") === 0) {
                                        store(2);
                                    } else if (token[set[aa][0]].indexOf(name + "-left") === 0) {
                                        store(3);
                                    } else if (token[set[aa][0]].indexOf(name + "-right") === 0) {
                                        store(1);
                                    } else if (token[set[aa][0]].indexOf(name + "-top") === 0) {
                                        store(0);
                                    }
                                }
                                if (set[aa + 1] === undefined || token[set[aa + 1][0]].indexOf(name) < 0 || aa === leng - 1) {
                                    if (test[0] === true && test[1] === true && test[2] === true && test[3] === true) {
                                        set.splice(start + 1, yy);
                                        leng -= yy;
                                        aa   -= yy;
                                        zz   = 0;
                                        bb   = p.length;
                                        do {
                                            if (p[zz] === set[start][0]) {
                                                break;
                                            }
                                            zz += 1;
                                        } while (zz < bb);
                                        if (zz < bb) {
                                            p.splice(zz + 1, yy);
                                        }
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
                                        if (options.mode === "beautify" && verticalop === true) {
                                            if (token[set[start][0]].charAt(token[set[start][0]].length - 1) === " ") {
                                                yy = token[set[start][0]].length - name.length;
                                                do {
                                                    name = name + " ";
                                                    yy   -= 1;
                                                } while (yy > 0);
                                            }
                                        }
                                    }
                                    if (important === true) {
                                        token[set[start][2]] = token[set[start][2]] + " !important";
                                    }
                                    break;
                                }
                            }
                            if (important === true && token[set[aa][2]].indexOf("!important") < 0) {
                                token[set[aa][2]] = token[set[aa][2]] + " !important";
                            }
                        };
                    for (aa = 0; aa < leng; aa += 1) {
                        if (types[set[aa][0]] === "property") {
                            if (token[set[aa][0]].indexOf("margin") === 0) {
                                fourcount("margin");
                            }
                            if (token[set[aa][0]].indexOf("padding") === 0) {
                                fourcount("padding");
                            }
                        }
                    }
                }());

                //pad out those property names so that the colons
                //are vertically aligned
                if (verticalop === true) {
                    bb = 0;
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
                    if (endtest === false) {
                        return;
                    }
                }
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
            if (ltype !== "comment" && ltype !== "comment-inline" && ltype !== "" && options.topcoms === true) {
                options.topcoms = false;
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
                lines.push(spacer(false));
                stats.braces += 1;
                spacecol     = false;
            } else if (b[a] === "}") {
                endtest = true;
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
                    if (options.mode !== "diff") {
                        properties();
                    }
                    ltype = "end";
                    if (objsortop === true) {
                        objSort();
                    }
                    types.push("end");
                    token.push("}");
                    lines.push(spacer(false));
                    stats.braces += 1;
                }
            } else if (b[a] === ";") {
                item("semi");
                if (types[types.length - 1] !== "semi") {
                    ltype = "semi";
                    types.push("semi");
                    token.push(";");
                    lines.push(spacer(false));
                }
                stats.semi += 1;
                space      = "";
            } else if (b[a] === ":") {
                item("colon");
                types.push("colon");
                token.push(":");
                lines.push(0);
                ltype = "colon";
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
        if (endtest === false && verticalop === true) {
            properties();
        }
    }());
    if (options.mode === "parse") {
        return {token: token, types: types};
    }

    //beautification
    if (options.mode !== "minify") {
        output = (function csspretty__beautify() {
            var a        = 0,
                len      = token.length,
                build    = [],
                indent   = options.inlevel,
                mixin    = false,
                //a single unit of indentation
                tab      = (function csspretty__beautify_tab() {
                    var aa = 0,
                        bb = [];
                    for (aa = 0; aa < options.insize; aa += 1) {
                        bb.push(options.inchar);
                    }
                    return bb.join("");
                }()),
                //new lines plus indentation
                nl       = function csspretty__beautify_nl(tabs) {
                    var aa = 0;
                    if (build[build.length - 1] === tab) {
                        do {
                            build.pop();
                        } while (build[build.length - 1] === tab);
                    }
                    build.push(lf);
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
                    if (options.compressedcss === true && (/\)\s*when\s*\(/).test(item) === true) {
                        item = item.replace(/\)\s*when\s*\(/, ")" + lf + (function csspretty__beautify_selector_whenTab() {
                            var wtab = "",
                                aaa = indent + 1;
                            do {
                                wtab += tab;
                                aaa -= 1;
                            } while (aaa > 0);
                            return wtab;
                        }()) + "when (");
                    }
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
                    if (options.selectorlist === true) {
                        build.push(items.join(" "));
                    } else {
                        build.push(items[0].replace(/,(\s*)/g, ", ").replace(/(,\ )$/, ","));
                        for (aa = 1; aa < leng; aa += 1) {
                            nl(indent);
                            build.push(items[aa].replace(/,(\s*)/g, ", ").replace(/(,\ )$/, ","));
                        }
                    }
                    if (options.compressedcss === false) {
                        build.push(" ");
                    }
                };
            if (options.inlevel > 0) {
                a = options.inlevel;
                do {
                    a -= 1;
                    build.push(tab);
                } while (a > 0);
            }

            //beautification loop
            for (a = 0; a < len; a += 1) {
                if (lines[a] > 1 && options.compressedcss === false && (types[a] === "start" || types[a] === "end" || types[a] === "selector" || types[a] === "comment" || types[a] === "property")) {
                    if (options.cssinsertlines === true && types[a] === "selector" && types[a - 1] !== "comment") {
                        lines[a] -= 1;
                    }
                    if (build[build.length - 1] === tab) {
                        do {
                            build.pop();
                        } while (build[build.length - 1] === tab);
                    }
                    if (lines[a] > 1) {
                        if (lines[a] > 2) {
                            do {
                                lines[a] -= 1;
                                build.push(lf);
                            } while (lines[a] > 2);
                        }
                        nl(indent);
                    }
                }
                if (types[a] === "start") {
                    if (a > 0 && token[a - 1].charAt(token[a - 1].length - 1) === "#") {
                        build.push(token[a]);
                    } else {
                        if (options.braces === true) {
                            if (build[build.length - 1] === " ") {
                                build.pop();
                            }
                            nl(indent);
                        } else if (types[a - 1] === "colon") {
                            build.push(" ");
                        }
                        build.push(token[a]);
                        indent += 1;
                        if (types[a + 1] !== "end" && (options.compressedcss === false || (options.compressedcss === true && types[a + 1] === "start")) && (types[a + 1] !== "selector" || options.cssinsertlines === false)) {
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
                        if (types[a - 1] !== "start" && options.compressedcss === false) {
                            nl(indent);
                        }
                        build.push(token[a]);
                        if (options.compressedcss === true && types[a + 1] === "end") {
                            nl(indent - 1);
                        } else if (options.cssinsertlines === true && types[a + 1] === "selector" && lines[a] < 2 && token[a - 1] !== "{") {
                            build.push(lf);
                        } else if (types[a + 1] !== "end" && types[a + 1] !== "semi" && types[a + 1] !== "comment") {
                            nl(indent);
                        }
                    }
                } else if (types[a] === "semi") {
                    if (token[a] !== "x;" && (options.compressedcss === false || (options.compressedcss === true && types[a + 1] !== "end"))) {
                        build.push(token[a]);
                    }
                    if (types[a + 1] === "comment-inline") {
                        build.push(" ");
                    } else if (types[a + 1] !== "end" && types[a + 1] !== "comment" && options.compressedcss === false) {
                        if (options.cssinsertlines === true && types[a + 1] === "selector") {
                            build.push(lf);
                        } else {
                            nl(indent);
                        }
                    }
                } else if (types[a] === "selector") {
                    if (a > 0 && types[a - 1] !== "comment" && (options.cssinsertlines === true || (options.compressedcss === true && (types[a - 1] === "start" || types[a - 1] === "semi")))) {
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
                        if (options.compressedcss === false) {
                            build.push(" ");
                        }
                    }
                } else if ((types[a] === "comment" || types[a] === "comment-inline") && types[a - 1] !== "colon" && types[a - 1] !== "property") {
                    if (a > 0 && options.compressedcss === true && types[a] === "comment" && types[a - 1] !== "comment") {
                        build.push(lf);
                        nl(indent);
                    } else if (a > 0 && types[a - 1] !== "start" && types[a] !== "comment-inline") {
                        nl(indent);
                    }
                    build.push(token[a]);
                    if (types[a + 1] !== "end" && types[a + 1] !== "comment") {
                        nl(indent);
                    }
                } else {
                    if (types[a] === "value" && types[a - 1] !== "semi" && options.compressedcss === false && (mixin === false || token[a - 1] === ":") && token[a - 2] !== "filter" && token[a - 2] !== "progid") {
                        build.push(" ");
                    }
                    build.push(token[a]);
                }
            }
            if (options.preserve > 0 && (lines[lines.length - 1] > 0 || endline === true)) {
                return build
                    .join("")
                    .replace(/(\s+)$/, lf);
            }
            return build
                .join("")
                .replace(/(\s+)$/, "");
        }());
    } else {
        output = token
            .join("")
            .replace(/;\}/g, "}");
    }
    //summary
    if (options.mode === "beautify") {
        (function csspretty__summary() {
            var summ  = [],
                inl   = options.source.length,
                out   = output.length,
                uris  = uri.length,
                uric  = 0,
                a     = 0,
                b     = 0,
                color = [];
            (function csspretty_summary_colorNormalize() {
                var aa = 0,
                    bb = 0,
                    cc = colors.length;
                colors.sort();
                color.push(colors[0]);
                for (aa = 0; aa < cc; aa += 1) {
                    if (colors[aa] !== color[bb]) {
                        color.push(colors[aa]);
                        bb += 1;
                    }
                }
            }());
            summ.push("<div class='report' id='cssreport'><p><strong>Number of HTTP requests:</strong> <em" +
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
            summ.push("</tbody></table>");
            summ.push("</div><span class='clear'></span>");
            if (color.length === 0) {
                summ.push("<h4>0 colors were identified in the provided code.</h4>");
            } else {
                summ.push("<h4>These ");
                summ.push(color.length);
                if (color.length > 1) {
                    summ.push(" different");
                }
                summ.push(" color");
                if (color.length > 1) {
                    summ.push("s");
                }
                summ.push(" were identified in the provided code:</h4><p>");
                summ.push(color.join(", "));
                summ.push("</p>");
                if (options.accessibility === true) {
                    (function csspretty__summary_colorConvert() {
                        var vl        = "",
                            bb        = color.length,
                            aa        = 0,
                            luminance = function csspretty__summary_colorConvert_luminance(rgb) {
                                var convert = function csspretty__summary_colorConvert_luminance_convert(x) {
                                    if (x === 0) {
                                        return 0;
                                    }
                                    x = (x / 255);
                                    if ((x * 100000) <= 3928) {
                                        return ((x * 100) / 1292) * 10000;
                                    }
                                    x *= 100000;
                                    return Math.pow(((x + 5500) / 105500), 2.4) * 10000;
                                };
                                return ((2126 * convert(rgb[0])) + (7152 * convert(rgb[1])) + (722 * convert(rgb[2]))) / 100000000;
                            },
                            hexToDec  = function csspretty__summary_colorConvert_hexToDec(val) {
                                var str = val
                                        .slice(1)
                                        .split(""),
                                    rgb = [],
                                    num = [],
                                    aaa = 0,
                                    bbb = str.length;
                                for (aaa = 0; aaa < bbb; aaa += 1) {
                                    if (str[aaa] === "a") {
                                        num.push(10);
                                    } else if (str[aaa] === "b") {
                                        num.push(11);
                                    } else if (str[aaa] === "c") {
                                        num.push(12);
                                    } else if (str[aaa] === "d") {
                                        num.push(13);
                                    } else if (str[aaa] === "e") {
                                        num.push(14);
                                    } else if (str[aaa] === "f") {
                                        num.push(15);
                                    } else {
                                        num.push(Number(str[aaa]));
                                    }
                                }
                                if (bbb === 3) {
                                    rgb.push((num[0] * 16) + num[0]);
                                    rgb.push((num[1] * 16) + num[1]);
                                    rgb.push((num[2] * 16) + num[2]);
                                } else {
                                    rgb.push((num[0] * 16) + num[1]);
                                    rgb.push((num[2] * 16) + num[3]);
                                    rgb.push((num[4] * 16) + num[5]);
                                }
                                return luminance(rgb);
                            },
                            rgbToDec  = function csspretty__summary_colorConvert_rgbToDec(val) {
                                var rgb  = [],
                                    rgbs = [],
                                    rr   = 0;
                                if (vl.charAt(3) === "a") {
                                    vl   = vl
                                        .slice(5, vl.length - 1)
                                        .replace(/\s+/g, "");
                                    rgbs = vl.split(",");
                                    rgbs.pop();
                                } else {
                                    vl   = vl
                                        .slice(4, vl.length - 1)
                                        .replace(/\s+/g, "");
                                    rgbs = vl.split(",");
                                }
                                do {
                                    if ((/^([0-9a-f]{2})$/).test(rgbs[rr]) === false) {
                                        if (rgbs[rr].charAt(rgbs[rr].length - 1) === "%") {
                                            vl = rgbs[rr].slice(0, rgbs[rr].length - 1);
                                            if (isNaN(vl) === true) {
                                                return val;
                                            }
                                            rgb.push(Number(vl));
                                            if (rgb[rr] < 0) {
                                                rgb[rr] = 0;
                                            } else if (rgb[rr] > 100) {
                                                rgb[rr] = 100;
                                            }
                                            rgb[rr] = Math.round(2.55 * rgb[rr]);
                                        } else {
                                            if (isNaN(rgbs[rr]) === true) {
                                                return val;
                                            }
                                            rgb.push(Number(rgbs[rr]));
                                            if (rgb[rr] < 0) {
                                                rgb[rr] = 0;
                                            } else if (rgb[rr] > 255) {
                                                rgb[rr] = 255;
                                            }
                                            rgb[rr] = Math.round(rgb[rr]);
                                        }
                                    }
                                    rr += 1;
                                } while (rr < 3);
                                return luminance(rgb);
                            };
                        colors = [];
                        for (aa = 0; aa < bb; aa += 1) {
                            if (color[aa] === undefined) {
                                break;
                            }
                            vl = color[aa].toLowerCase();
                            if ((/^(#[0-9a-f]{3,6})$/).test(vl) === true) {
                                colors.push(hexToDec(vl.slice(1)));
                            } else if ((/^(rgba?\()/).test(vl) === true) {
                                colors.push(rgbToDec(vl));
                            } else if (colorNames[vl] !== undefined) {
                                colors.push(colorNames[vl]);
                            }
                        }
                    }());
                }
            }
            global.report = summ.join("");
        }());
    } else {
        global.report = "";
    }
    return output;
};
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api = function commonjs(x) {
        "use strict";
        return csspretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api = function requirejs_export(x) {
            return csspretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
