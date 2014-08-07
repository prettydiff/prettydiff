/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
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
 same array based architecture used for the markup_beauty and jspretty
 libraries.  The architecture focuses on separation of roles.  The first
 area of the application reads the code and writes an array of tokens.
 The second area is the algorithm that determines what white space and
 indentation should be applied.  The final area is a report on the
 analysis of the code.

 Arguments:

 * source - The code to process as a string.
 * insize - The size of a single indentation.  The type is number and
   the default is 4.
 * inchar - The string character(s) to make up an indentation.  The
   default is a single space.
 * mode - Tells the library what to do.  Accepted values are 'beautify',
   'minify', and 'diff'.  The default is 'beautify'.
      - 'beautify' will provide corrections to values, vertically align
        colons, preserve comments, and will beautify the white space
      - 'minify' will provide corrections to values, will remove
        semicolons preceding closing curly braces, and will remove
        unnecessary white space
      - 'diff' will beautify the code's white space and remove comments
 * topcoms - Tells the application to preserve comments preceding any
   code for the 'minify' mode. This argument expects a boolean type and
   defaults to false.
 * diffcomm - Tells the application to preserve all comments for the
   'diff' mode. This argument expects a boolean type and defaults to
   false.
 -----------------------------------------------------------------------
 */
 var summary   = "",
    csspretty = function csspretty(args) {
        "use strict";
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
        //The tokenizer is where all the parsing happens
        (function csspretty__tokenize() {
            var a          = 0,
                b          = source.split(""),
                len        = source.length,
                ltype      = "",
                itemsize   = 0,
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
                                leng    = x.length,
                                cc     = 0,
                                dd     = 0,
                                items   = [],
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
                    //backtrack through immediately prior comments to
                    //find the correct token
                    if (ltype === "comment" || ltype === "comment-inline") {
                        do {
                            aa    -= 1;
                            ltype = types[aa];
                            coms.push(token[aa]);
                        } while (ltype === "comment" || ltype === "comment-inline");
                    } else {
                        aa -= 1;
                    }
                    //if the last non-comment type is 'item' then id it
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
                            //take comments out until the 'item' is
                            //found and then put the comments back
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
                    var aa     = 0,
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
                //the generic token builder
                buildtoken = function csspretty__tokenize_build() {
                    var aa     = 0,
                        bb     = 0,
                        out = [],
                        block  = "";
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
                        next = 0,
                        stoke = [],
                        stype = [];
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
                    //pad out those property names so that the colons
                    //are vertically aligned
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
                    //consolidate margin and padding
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
                    //replace a block's data with sorted analyzed data
                    token.splice(next + 1, token.length - next - 1);
                    types.splice(next + 1, types.length - next - 1);
                    token = token.concat(stoke);
                    types = types.concat(stype);
                };
            //token building loop
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
        //beautification
        if (mode !== "minify") {
            output = (function csspretty__beautify() {
                var a        = 0,
                    len      = token.length,
                    build    = [],
                    indent   = 0,
                    //a single unit of indentation
                    tab      = (function csspretty__beautify_tab() {
                        var aa = 0,
                            bb = [];
                        for (aa = 0; aa < insize; aa += 1) {
                            bb.push(inchar);
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
                        build.push(items[0].replace(/\,\s*/g, ", ").replace(/(\, )$/, ","));
                        for (aa = 1; aa < leng; aa += 1) {
                            nl(indent);
                            build.push(items[aa].replace(/\,\s*/g, ", ").replace(/(\, )$/, ","));
                        }
                        build.push(" ");
                    };
                //beautification loop
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
        //summary
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
    };