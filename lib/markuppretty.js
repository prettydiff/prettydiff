/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/***********************************************************************
 csspretty is written by Austin Cheney on 7 Aug 2014.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/*
 A simple parser for XML, HTML, and a variety of template schemes. It
 beautifies, minifies, and peforms a series of analysis*/

 var markuppretty = function markuppretty(args) {
    "use strict";
    var mbraceline      = (args.braceline === true || args.braceline === "true") ? true : false,
        mbracepadding   = (args.bracepadding === true || args.bracepadding === "true") ? true : false,
        mbraces         = (args.braces === "allman") ? "allman" : "knr",
        mchar           = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
        mcomm           = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : ((args.comments === "nocomment") ? "nocomment" : "indent"),
        mconditional    = (args.html === true || args.conditional === true || args.conditional === "true") ? true : false,
        mcont           = (args.content === "true" || args.content === true) ? true : false,
        mcorrect        = (args.correct === true || args.correct === "true") ? true : false,
        mcssinsertlines = (args.cssinsertlines === true || args.cssinsertlines === "true") ? true : false,
        mforce          = (args.force_indent === "true" || args.force_indent === true) ? true : false,
        mhtml           = (args.html === "true" || args.html === true) ? true : false,
        minlevel        = (isNaN(args.inlevel) === true) ? 0 : Number(args.inlevel),
        mjsx            = (args.jsx === true || args.jsx === "true") ? true : false,
        mmode           = (args.mode === "parse" || args.mode === "diff" || args.mode === "minify") ? args.mode : "beautify",
        mobfuscate      = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
        mobjsort        = (args.objsort === "true" || args.objsort === true) ? true : false,
        mpreserve       = (args.preserve === false || args.preserve === "false") ? false : true,
        mquoteConvert   = (args.quoteConvert === "single" || args.quoteConvert === "double") ? args.quoteConvert : "none",
        msize           = (isNaN(args.insize) === true) ? 4 : Number(args.insize),
        msource         = (typeof args.source === "string" && args.source.length > 0) ? args.source : "Error: no source code supplied to markuppretty!",
        mspace          = (args.space === false || args.space === "false") ? false : true,
        mstyle          = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
        mstyleguide     = (typeof args.styleguide === "string") ? args.styleguide : "none",
        mtopcomments    = (args.top_comments === true || args.top_comments === "true") ? true : false,
        mwrap           = (isNaN(args.wrap) === true || mjsx === true) ? 0 : Number(args.wrap),
        mvarword        = (args.varword === "each" || args.varword === "list") ? args.varword : "none",
        mvertical       = (args.vertical === "jsonly") ? "jsonly" : ((args.vertical === true || args.vertical === "true") ? true : false),
        stats           = {
            cdata    : [
                0, 0
            ],
            comment  : [
                0, 0
            ],
            content  : [
                0, 0
            ],
            end      : [
                0, 0
            ],
            ignore   : [
                0, 0
            ],
            script   : [
                0, 0
            ],
            sgml     : [
                0, 0
            ],
            singleton: [
                0, 0
            ],
            space    : 0,
            start    : [
                0, 0
            ],
            style    : [
                0, 0
            ],
            template : [
                0, 0
            ],
            text     : [
                0, 0
            ],
            xml      : [
                0, 0
            ]
        },
        //parallel arrays
        //* token stores parsed tokens
        //* types segments tokens into named groups
        //* lines describes the preceeding space using: 2, 1, or 0
        //    lines is populated in markuppretty__tokenize_spacer
        //* level describes the indentation of a given token
        //    level is only used in beautify and diff modes
        //* attrs is a list of arrays, each of which contains (if any) parsed attributes
        token           = [],
        types           = [],
        level           = [],
        lines           = [],
        attrs           = [],
        reqs            = [],
        ids             = [],
        jscom           = [],

        //What is the lowercase element name of the current start or singleton tag
        tagName         = function markuppretty__tokenize_tagName(el) {
            var space = el.indexOf(" "),
                name  = (space < 0) ? el.slice(1, el.length - 1) : el.slice(1, space).toLowerCase();
            return name;
        };
    //type definitions:
    //start      end     type
    //<[CDATA[   ]]>     cdata
    //<!--[if    ]-->    comment
    //<!--       -->     comment
    //<%--       --%>    comment
    //                   content
    //</         >       end
    //<pre       </pre>  ignore (html only)
    //                   script
    //<!         >       sgml
    //<          />      singleton
    //<          >       start
    //                   style
    //<!--#      -->     template
    //<%         %>      template
    //{{{        }}}     template
    //{{         }}      template
    //{%         %}      template
    //[%         %]      template
    //{@         @}      template
    //{#         #}      template
    //<?         ?>      template
    //{{/        }}      template_end
    //<%\s*}     %>      template_end
    //[%\s*}     %]      template_end
    //{@\s*}     @}      template_end
    //{{#        }}      template_start
    //<%         {\s*%>  template_start
    //[%         {\s*%]  template_start
    //{@         {\s*@}  template_start
    //<?xml      ?>      xml
    if (mmode !== "diff") {
        mcont = false;
    }
    (function markuppretty__tokenize() {
        var a        = 0,
            b        = msource.split(""),
            c        = b.length,
            minspace = "",
            space    = "",
            list     = 0,
            litag    = 0,
            ext      = false,
            line     = 1,
            //determine if spaces between nodes are absent, multiline, or merely there
            //2 - multiline
            //1 - space present
            //0 - no space present
            spacer   = function markuppretty__tokenize_spacer() {
                if (space.length > 0) {
                    stats.space += space.length;
                    if (mpreserve === true && space.split("\n").length > 2) {
                        lines.push(2);
                    } else {
                        lines.push(1);
                    }
                } else {
                    lines.push(0);
                }
                minspace = space;
                space    = "";
            },
            //parses tags, attributes, and template elements
            tag      = function markuppretty__tokenize_tag(end) {
                var output    = [],
                    bcount    = 0,
                    count     = 0,
                    e         = 0,
                    f         = 0,
                    igcount   = 0,
                    quote     = "",
                    element   = "",
                    lastchar  = "",
                    name      = "",
                    jsxquote  = "",
                    cheat     = false,
                    endtag    = false,
                    nopush    = false,
                    simple    = false,
                    preserve  = false,
                    stest     = false,
                    liend     = false,
                    ignore    = false,
                    quotetest = false,
                    attribute = [],
                    attrname  = function markuppretty__tokenize_tag_attrname(atty) {
                        var index = atty.indexOf("=");
                        if (index < 0) {
                            return "";
                        }
                        atty = atty.slice(0, index);
                        if (mhtml === true) {
                            return atty.toLowerCase();
                        }
                        return atty;
                    };
                spacer();
                jscom.push(false);
                attrs.push([]);
                ext = false;

                //this complex series of conditions determines an elements delimiters
                //look to the types being pushed to quickly reason about the logic
                //no type is pushed for start tags or singleton tags just yet some types set the
                //`preserve` flag, which means to preserve internal white
                //space
                //The `nopush` flag is set when parsed tags are to be ignored and forgotten
                if (b[a] === "<") {
                    if (b[a + 1] === "!") {
                        if (b[a + 2] === "-" && b[a + 3] === "-") {
                            if (b[a + 4] === "#") {
                                end = "-->";
                                types.push("template");
                            } else if (b[a + 4] === "[" && b[a + 5] === "i" && b[a + 6] === "f") {
                                end = "]-->";
                                if (mmode !== "minify" || mconditional === true) {
                                    preserve = true;
                                }
                                types.push("comment");
                            } else {
                                end = "-->";
                                if (mmode === "minify" || mcomm === "nocomment") {
                                    nopush = true;
                                } else {
                                    preserve = true;
                                    types.push("comment");
                                }
                            }
                        } else if (b[a + 2] === "[" && b[a + 3] === "C" && b[a + 4] === "D" && b[a + 5] === "A" && b[a + 6] === "T" && b[a + 7] === "A" && b[a + 8] === "[") {
                            end      = "]]>";
                            preserve = true;
                            types.push("cdata");
                        } else {
                            end = ">";
                            types.push("sgml");
                        }
                    } else if (b[a + 1] === "?") {
                        end = "?>";
                        if (b[a + 2] === "x" && b[a + 3] === "m" && b[a + 4] === "l") {
                            types.push("xml");
                        } else {
                            preserve = true;
                            types.push("template");
                        }
                    } else if (b[a + 1] === "%") {
                        preserve = true;
                        if (b[a + 2] === "-" && b[a + 3] === "-") {
                            end = "--%>";
                            types.push("comment");
                        } else {
                            end = "%>";
                            types.push("template");
                        }
                    } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "p" && b[a + 2].toLowerCase() === "r" && b[a + 3].toLowerCase() === "e" && (b[a + 4] === ">" || (/\s/).test(b[a + 4]) === true)) {
                        end      = "</pre>";
                        preserve = true;
                        types.push("ignore");
                    } else {
                        if (b[a + 1] === "/") {
                            types.push("end");
                        } else {
                            simple = true;
                        }
                        end = ">";
                    }
                } else if (b[a] === "{") {
                    preserve = true;
                    if (b[a + 1] === "{") {
                        if (b[a + 2] === "{") {
                            end = "}}}";
                            types.push("template");
                        } else if (b[a + 2] === "#") {
                            end = "}}";
                            types.push("template_start");
                        } else if (b[a + 2] === "/") {
                            end = "}}";
                            types.push("template_end");
                        } else {
                            end = "}}";
                            types.push("template");
                        }
                    } else {
                        end = b[a + 1] + "}";
                        types.push("template");
                    }
                }

                //This loop is the logic that parses tags and attributes
                //If the attribute data-prettydiff-ignore is present the `ignore` flag is set
                //The ignore flag is identical to the preserve flag
                lastchar = end.charAt(end.length - 1);
                for (a; a < c; a += 1) {
                    if (b[a] === "\n") {
                        line += 1;
                    }
                    output.push(b[a]);
                    if (quote === "") {
                        if (stest === true && (/\s/).test(b[a]) === false && b[a] !== lastchar) {
                            //attribute start
                            stest = false;
                            quote = jsxquote;
                            output.pop();
                            for (a; a < c; a += 1) {
                                if (b[a] === "\n") {
                                    line += 1;
                                }
                                attribute.push(b[a]);
                                if (quote === "") {
                                    if (b[a + 1] === lastchar) {
                                        //if at end of tag
                                        element = attribute.join("").replace(/\s+/g, " ");
                                        name    = attrname(element);
                                        if (name === "data-prettydiff-ignore") {
                                            ignore = true;
                                        } else if (name === "id") {
                                            ids.push(element.slice(name.length + 1, element.length));
                                        }
                                        if (element !== " ") {
                                            attrs[attrs.length - 1].push(element);
                                        }
                                        attribute = [];
                                        break;
                                    }
                                    if ((/\s/).test(b[a]) === true) {

                                        //testing for a run of spaces between an attribute's =
                                        //and a quoted value. Unquoted values separated by space
                                        //are separate attributes
                                        if (attribute[attribute.length - 2] === "=") {
                                            for (e = a + 1; e < c; e += 1) {
                                                if ((/\s/).test(b[e]) === false) {
                                                    if (b[e] === "\"" || b[e] === "'") {
                                                        a = e - 1;
                                                        quotetest = true;
                                                        attribute.pop();
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        if (quotetest === true) {
                                            quotetest = false;
                                        } else {
                                            //if there is an unquoted space attribute is complete
                                            element = attribute.join("").replace(/\s+/g, " ");
                                            name    = attrname(element);
                                            if (name === "data-prettydiff-ignore") {
                                                ignore = true;
                                            } else if (name === "id") {
                                                ids.push(element.slice(name.length + 1, element.length));
                                            }
                                            if (element !== " ") {
                                                attrs[attrs.length - 1].push(element);
                                            }
                                            stest     = true;
                                            attribute = [];
                                            break;
                                        }
                                    }
                                    if (b[a] === "\"" || b[a] === "'") {
                                        quote = b[a];
                                    } else if (mjsx === true) {
                                        //jsx variable attribute
                                        if (b[a - 1] === "=" && b[a] === "{") {
                                            quote  = "}";
                                            bcount = 1;
                                        } else if (b[a] === "/") {
                                            //jsx comments
                                            if (b[a + 1] === "*") {
                                                quote = "*/";
                                            } else if (b[a + 1] === "/") {
                                                quote = "\n";
                                            }
                                        }
                                    } else if (b[a] === "{" && (b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                        //opening embedded template expression
                                        if (b[a + 1] === "{") {
                                            if (b[a + 2] === "{") {
                                                quote = "}}}";
                                            } else {
                                                quote = "}}";
                                            }
                                        } else {
                                            quote = b[a + 1] + "}";
                                        }
                                    }
                                } else if (mjsx === true && (quote === "}" || (quote === "\n" && b[a] === "\n") || (quote === "*/" && b[a - 1] === "*" && b[a] === "/"))) {
                                    //jsx attributes
                                    if (quote === "}") {
                                        if (b[a] === "{") {
                                            bcount += 1;
                                        } else if (b[a] === quote) {
                                            bcount -= 1;
                                            if (bcount === 0) {
                                                quote     = "";
                                                element   = attribute.join("").replace(/\s+/g, " ");
                                                attribute = [];
                                                if (element !== " ") {
                                                    attrs[attrs.length - 1].push(element);
                                                }
                                                break;
                                            }
                                        }
                                    } else {
                                        quote                   = "";
                                        jsxquote                = "";
                                        jscom[jscom.length - 1] = true;
                                        element                 = attribute.join("");
                                        if (element.charAt(1) === "*") {
                                            element = element + "\n";
                                        }
                                        attribute = [];
                                        if (element !== " ") {
                                            attrs[attrs.length - 1].push(element);
                                        }
                                        break;
                                    }
                                } else {
                                    //terminate attribute at the conclusion of a quote pair
                                    f = 0;
                                    for (e = quote.length - 1; e > -1; e -= 1) {
                                        if (b[a - f] !== quote.charAt(e)) {
                                            break;
                                        }
                                        f += 1;
                                    }
                                    if (e < 0) {
                                        if (quote === "\"" && mquoteConvert === "single") {
                                            quote = attribute.slice(0, attribute.length - 1).join("").replace(/'/g, "\"").replace(/"/, "'") + "'";
                                        } else if (quote === "'" && mquoteConvert === "double") {
                                            quote = attribute.slice(0, attribute.length - 1).join("").replace(/"/g, "'").replace(/'/, "\"") + "\"";
                                        } else {
                                            quote = attribute.join("");
                                        }
                                        name = attrname(quote);
                                        if (name === "data-prettydiff-ignore") {
                                            ignore = true;
                                        } else if (name === "id") {
                                            ids.push(quote.slice(name.length + 2, quote.length - 1));
                                        } else if (name === "schemaLocation") {
                                            reqs.push(quote.slice(name.length + 2, quote.length - 1));
                                        }
                                        attrs[attrs.length - 1].push(quote.replace(/\s+/g, " "));
                                        quote     = "";
                                        attribute = [];
                                        if (b[a + 1] === lastchar) {
                                            break;
                                        }
                                    }
                                }
                            }
                        } else if (b[a] === "\"" || b[a] === "'") {
                            //opening quote
                            quote = b[a];
                        } else if (b[a] === "{" && (b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                            //opening embedded template expression
                            if (b[a + 1] === "{") {
                                if (b[a + 2] === "{") {
                                    quote = "}}}";
                                } else {
                                    quote = "}}";
                                }
                            } else {
                                quote = b[a + 1] + "}";
                            }
                            if (quote === end) {
                                quote = "";
                            }
                        } else if (simple === true && (/\s/).test(b[a]) === true) {
                            //identify a space in a regular start or singleton tag
                            stest = true;
                        } else if (simple === true && mjsx === true && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                            //jsx comment immediately following tag name
                            stest                     = true;
                            output[output.length - 1] = " ";
                            attribute.push(b[a]);
                            if (b[a + 1] === "*") {
                                jsxquote = "*/";
                            } else {
                                jsxquote = "\n";
                            }
                        } else if (b[a] === "<" && simple === true) {
                            //counting unquoted angle braces contained in regular start and singleton tags
                            count += 1;
                        } else if (b[a] === lastchar) {
                            //if current character matches the last character of the tag ending sequence
                            if (simple === true) {
                                count -= 1;
                            }
                            if (count === 0) {
                                f = output.length;
                                for (e = end.length - 1; e > -1; e -= 1) {
                                    f -= 1;
                                    if (output[f] !== end.charAt(e)) {
                                        break;
                                    }
                                }
                                if (e < 0) {
                                    break;
                                }
                            }
                        }
                    } else if (b[a] === quote.charAt(quote.length - 1)) {
                        //find the closing quote or embedded template expression
                        f = 0;
                        for (e = quote.length - 1; e > -1; e -= 1) {
                            if (b[a - f] !== quote.charAt(e)) {
                                break;
                            }
                            f += 1;
                        }
                        if (e < 0) {
                            quote = "";
                        }
                    }
                }

                //nopush flags mean an early exit
                if (nopush === true) {
                    lines.pop();
                    space = minspace;
                    return;
                }

                //fix singleton tags and sort attributes
                if (attrs[attrs.length - 1].length > 1) {
                    e = attrs.length - 1;
                    if (attrs[e][attrs[e].length - 1] === "/") {
                        attrs[attrs.length - 1].pop();
                        output.splice(output.length - 1, 0, "/");
                    }
                    if (jscom[jscom.length - 1] === false) {
                        attrs[attrs.length - 1] = safeSort(attrs[attrs.length - 1]);
                    }
                }

                //cheat identifies HTML singleton elements as singletons even if formatted as
                //start tags
                element = output.join("");

                cheat   = (function markuppretty__tokenize_tag_cheat() {
                    var tname = tagName(element),
                        atts  = attrs[attrs.length - 1],
                        atty  = "",
                        value = "",
                        type  = "",
                        d     = 0;

                    atty = token[token.length - 1];
                    if (types[types.length - 1] === "end" && types[types.length - 2] === "singleton" && atty.charAt(atty.length - 2) !== "/" && "/" + tagName(atty) === tname) {
                        types[types.length - 2] = "start";
                    }
                    for (d = atts.length - 1; d > -1; d -= 1) {
                        atty = attrname(atts[d]);
                        if (atty === "type") {
                            type = atts[d].split("=")[1];
                            if (type.charAt(0) === "\"" || type.charAt(0) === "'") {
                                type = type.slice(1, type.length - 1);
                            }
                        } else if (atty === "src" && (tname === "embed" || tname === "img" || tname === "script" || tname === "iframe")) {
                            value = atts[d].split("=")[1];
                            if (value.charAt(0) === "\"" || value.charAt(0) === "'") {
                                value = value.slice(1, value.length - 1);
                            }
                            reqs.push(value);
                        } else if (tname === "link" && atty === "href") {
                            value = atts[d].split("=")[1];
                            if (value.charAt(0) === "\"" || value.charAt(0) === "'") {
                                value = value.slice(1, value.length - 1);
                            }
                            reqs.push(value);
                        }
                    }

                    if (tname === "script" || tname === "style") {

                        //identify if there is embedded code requiring an external parser
                        if (tname === "script" && (type === "" || type === "text/javascript" || type === "application/javascript" || type === "application/x-javascript" || type === "text/ecmascript" || type === "application/ecmascript" || type === "text/jsx" || type === "application/jsx" || type === "text/cjs")) {
                            ext = true;
                        } else if (tname === "style" && (quote === "" || quote === "text/css")) {
                            ext = true;
                        }
                    }
                    if (mhtml === true) {

                        //simple means of looking for missing li end tags
                        if (tname === "li") {
                            if (litag === list) {
                                liend = true;
                            } else {
                                litag += 1;
                            }
                        } else if (tname === "/li" && litag === list) {
                            litag -= 1;
                        } else if (tname === "ul" || tname === "ol") {
                            list += 1;
                        } else if (tname === "/ul" || tname === "/ol") {
                            if (litag === list) {
                                liend = true;
                                litag -= 1;
                            }
                            list -= 1;
                        } else if (tname === "area" || tname === "base" || tname === "basefont" || tname === "br" || tname === "col" || tname === "embed" || tname === "eventsource" || tname === "frame" || tname === "hr" || tname === "img" || tname === "input" || tname === "keygen" || tname === "link" || tname === "meta" || tname === "param" || tname === "progress" || tname === "source" || tname === "wbr") {
                            return true;
                        }
                    }
                    return false;
                }());

                //am I a singleton or a start type?
                if (simple === true && ignore === false) {
                    if (cheat === true || (output[output.length - 2] === "/" && output[output.length - 1] === ">")) {
                        types.push("singleton");
                    } else {
                        types.push("start");
                    }
                }

                //additional logic is required to find the end of a tag with the attribute
                //data-prettydiff-ignore
                if (simple === true && preserve === false && ignore === true && end === ">" && element.slice(element.length - 2) !== "/>") {
                    if (cheat === true) {
                        types.push("singleton");
                    } else {
                        preserve = true;
                        types.push("ignore");
                        a += 1;
                        for (a; a < c; a += 1) {
                            if (b[a] === "\n") {
                                line += 1;
                            }
                            output.push(b[a]);
                            if (quote === "") {
                                if (b[a] === "\"") {
                                    quote = "\"";
                                } else if (b[a] === "'") {
                                    quote = "'";
                                } else if (b[a] === "{" && (b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                    if (b[a + 1] === "{") {
                                        if (b[a + 2] === "{") {
                                            quote = "}}}";
                                        } else {
                                            quote = "}}";
                                        }
                                    } else {
                                        quote = b[a + 1] + "}";
                                    }
                                } else if (b[a] === "<" && simple === true) {
                                    if (count === 0) {
                                        if (b[a + 1] === "/") {
                                            endtag = true;
                                        } else {
                                            endtag = false;
                                        }
                                    }
                                    count += 1;
                                } else if (b[a] === lastchar) {
                                    if (simple === true) {
                                        count -= 1;
                                    }
                                    if (count === 0 && b[a - 1] !== "/") {
                                        if (b[a - 1] !== "/") {
                                            if (endtag === true) {
                                                igcount -= 1;
                                                if (igcount < 0) {
                                                    break;
                                                }
                                            } else {
                                                igcount += 1;
                                            }
                                        }
                                    }
                                }
                            } else if (b[a] === quote.charAt(quote.length - 1)) {
                                f = 0;
                                for (e = quote.length - 1; e > -1; e -= 1) {
                                    if (b[a - f] !== quote.charAt(e)) {
                                        break;
                                    }
                                    f += 1;
                                }
                                if (e < 0) {
                                    quote = "";
                                }
                            }
                        }
                    }
                }
                element = output.join("");

                //some template tags can be evaluated as a block start/end based on syntax alone
                if (types[types.length - 1] === "template") {
                    if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                        types[types.length - 1] = "template_end";
                    } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                        types[types.length - 1] = "template_start";
                    }
                }

                //HTML5 does not require an end tag for an opening list item <li>
                //this logic temprorarily creates a pseudo end tag
                if (liend === true && (mmode === "beautify" || mmode === "diff")) {
                    token.push("</prettydiffli>");
                    lines.push(lines[lines.length - 1]);
                    lines[lines.length - 2] = 0;
                    attrs.splice(attrs.length - 1, 0, []);
                    types.splice(types.length - 1, 0, "end");
                }
                if (preserve === true) {
                    token.push(element);
                } else {
                    token.push(element.replace(/\s+/g, " "));
                }
            },
            content  = function markuppretty__tokenize_content() {
                var output    = [],
                    quote     = "",
                    tailSpace = function markuppretty__tokenize_content_tailSpace(spacey) {
                        space = spacey;
                        return "";
                    },
                    name      = "";
                spacer();
                attrs.push([]);
                jscom.push(false);
                if (ext === true) {
                    name = tagName(token[token.length - 1]);
                }
                for (a; a < c; a += 1) {
                    if (b[a] === "\n") {
                        line += 1;
                    }

                    //external code requires additional parsing to look for the appropriate
                    //end tag, but that end tag cannot be quoted or commented
                    if (ext === true) {
                        if (quote === "") {
                            if (b[a] === "\"") {
                                quote = "\"";
                            } else if (b[a] === "'") {
                                quote = "'";
                            } else if (b[a] === "/") {
                                if (b[a + 1] === "*") {
                                    quote = "*";
                                } else if (b[a + 1] === "/") {
                                    quote = "/";
                                }
                            }
                            if (name === "script" && b[a] === "<" && b[a + 1] === "/" && b[a + 2] === "s" && b[a + 3] === "c" && b[a + 4] === "r" && b[a + 5] === "i" && b[a + 6] === "p" && b[a + 7] === "t") {
                                a   -= 1;
                                ext = false;
                                if (output.length < 2) {
                                    attrs.pop();
                                    jscom.pop();
                                    return lines.pop();
                                }
                                token.push(output.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                if (typeof jspretty === "function") {
                                    return types.push(name);
                                }
                                return types.push("content");
                            }
                            if (name === "style" && b[a] === "<" && b[a + 1] === "/" && b[a + 2] === "s" && b[a + 3] === "t" && b[a + 4] === "y" && b[a + 5] === "l" && b[a + 6] === "e") {
                                a   -= 1;
                                ext = false;
                                if (output.length < 2) {
                                    attrs.pop();
                                    jscom.pop();
                                    return lines.pop();
                                }
                                token.push(output.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                if (typeof csspretty === "function") {
                                    return types.push(name);
                                }
                                return types.push("content");
                            }
                        } else if (quote === b[a] && (quote === "\"" || quote === "'" || (quote === "*" && b[a + 1] === "/"))) {
                            quote = "";
                        } else if (quote === "/" && b[a] === "\n") {
                            quote = "";
                        }
                    } else if (b[a] === "<" || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#"))) {
                        a -= 1;
                        if (mcont === true) {
                            token.push("text");
                        } else {
                            token.push(output.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                        }
                        return types.push("content");
                    }
                    output.push(b[a]);
                }
            };

        for (a = 0; a < c; a += 1) {
            if (ext === true) {
                content();
            } else if ((/\s/).test(b[a]) === true) {
                space = space + b[a];
                if (b[a] === "\n") {
                    line += 1;
                }
            } else if (b[a] === "<") {
                tag("");
            } else if (b[a] === "[" && b[a + 1] === "%") {
                tag("%]");
            } else if (b[a] === "{" && (b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                tag("");
            } else {
                content();
            }
        }
        lines[0] = 0;
    }());

    if (mmode === "parse") {
        (function markuppretty__parse() {
            var a      = 0,
                c      = token.length,
                //white space token to insertion logic
                insert = function markuppretty__parse_insert(string) {
                    if (types[a] === "content") {
                        token[a] = string + token[a];
                        return;
                    }
                    if (types[a - 1] === "content" && token[a] !== "content") {
                        token[a - 1] = token[a - 1] + string;
                        return;
                    }
                    token.splice(a, 0, string);
                    types.splice(a, 0, "content");
                    lines.splice(a, 0, 1);
                    attrs.splice(a, 0, []);
                    c += 1;
                    a += 1;
                };
            for (a = 0; a < c; a += 1) {
                if (attrs[a].length > 0) {
                    token[a] = token[a].replace(" ", " " + attrs[a].join(" "));
                }
                if (lines[a] === 2) {
                    if (mpreserve === true) {
                        insert("\n\n");
                    } else if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                        insert(" ");
                    }
                } else if (lines[a] === 1) {
                    if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                        insert(" ");
                    } else if (types[a] !== types[a - 1] && (types[a - 1] === "singleton" || types[a - 1] === "content" || types[a - 1] === "template")) {
                        insert(" ");
                    }
                }
            }
        }());
        return {
            token: token,
            types: types
        };
    }

    if (mmode === "minify") {
        (function markuppretty__minify() {
            var a      = 0,
                c      = token.length,
                script = function markuppretty__beautify_script() {
                    token[a] = jspretty({
                        correct     : mcorrect,
                        mode        : "minify",
                        obfuscate   : mobfuscate,
                        quoteConvert: mquoteConvert,
                        source      : token[a],
                        styleguide  : mstyleguide,
                        topcoms     : mtopcomments
                    });
                    level.push("x");
                },
                style  = function markuppretty__beautify_style() {
                    token[a] = csspretty({
                        mode   : "minify",
                        objsort: mobjsort,
                        source : token[a],
                        topcoms: mtopcomments
                    });
                    level.push("x");
                };
            for (a = 0; a < c; a += 1) {
                if (attrs[a].length > 0) {
                    token[a] = token[a].replace(" ", attrs[a].join(" "));
                }
                if (types[a] === "script") {
                    script();
                } else if (token[a] === "style") {
                    style();
                } else if (lines[a] > 0) {
                    if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                        level.push(0);
                    } else if (types[a - 1] === "singleton" || types[a - 1] === "content" || types[a] === "template") {
                        level.push(0);
                    } else {
                        level.push("x");
                    }
                } else {
                    level.push("x");
                }
            }
        }());
    }

    if (mmode === "beautify" || mmode === "diff") {
        (function markuppretty__beautify() {
            var a            = 0,
                c            = token.length,
                ltype        = "",
                lline        = 0,
                indent       = minlevel,
                cdataS       = "",
                cdataE       = "",
                commentS     = "",
                commentE     = "",
                cdataStart   = (/^(\s*(\/)*<\!?\[+[A-Z]+\[+)/),
                cdataEnd     = (/((\/)*\]+>\s*)$/),
                commentStart = (/^(\s*<\!\-\-)/),
                commentEnd   = (/((\/\/)?\-\->\s*)$/),
                tab          = (function markuppretty__beautify_tab() {
                    var b      = msize,
                        output = [];
                    for (b; b > -1; b -= 1) {
                        output.push(mchar);
                    }
                    return new RegExp("^(" + output.join("") + "+)");
                }()),
                tabs         = "",
                end          = function markuppretty__beautify_end() {
                    var b = 0;
                    indent -= 1;
                    if (ltype === "start") {
                        return level.push("x");
                    }
                    if (mforce === false) {
                        if (lines[a] === 0 && (ltype === "singleton" || ltype === "content" || ltype === "template")) {
                            return level.push("x");
                        }
                        if (ltype === "comment") {
                            for (b = a - 1; b > -1; b -= 1) {
                                if (types[b] !== "comment") {
                                    if (lines[b + 1] === 0 && (types[b] === "singleton" || types[b] === "content" || ltype === "template")) {
                                        for (b += 1; b < a; b += 1) {
                                            level[b] = "x";
                                        }
                                        return level.push("x");
                                    }
                                    return level.push(indent);
                                }
                            }
                        }
                        return level.push(indent);
                    }
                    level.push(indent);
                },
                content      = function markuppretty__beautify_content() {
                    var b = 0;
                    if (lines[a] === 0 && mforce === false) {
                        if (ltype === "comment" && lline === 0) {
                            for (b = a - 1; b > -1; b -= 1) {
                                if (types[b - 1] !== "comment" && types[b] === "comment") {
                                    if (lines[b] === 0) {
                                        for (b; b < a; b += 1) {
                                            level[b] = "x";
                                        }
                                        return level.push("x");
                                    }
                                    return level.push(indent);
                                }
                                if (lines[b] > 0) {
                                    return level.push(indent);
                                }
                            }
                            return level.push(indent);
                        }
                        level.push("x");
                    } else {
                        level.push(indent);
                    }
                },
                script       = function markuppretty__beautify_script() {
                    var list = [];
                    stats.script[0] += 1;
                    stats.script[1] += token[a].length - 1;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart.exec(token[a])[0].replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart.exec(token[a])[0].replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    token[a] = jspretty({
                        braceline   : mbraceline,
                        bracepadding: mbracepadding,
                        braces      : mbraces,
                        comments    : mcomm,
                        correct     : mcorrect,
                        inchar      : mchar,
                        inlevel     : (mstyle === "noindent") ? 0 : indent,
                        insize      : msize,
                        mode        : "beautify",
                        objsort     : mobjsort,
                        preserve    : mpreserve,
                        quoteConvert: mquoteConvert,
                        source      : token[a],
                        space       : mspace,
                        styleguide  : mstyleguide,
                        varword     : mvarword,
                        vertical    : (mvertical === "jsonly" || mvertical === true || mvertical === "true") ? true : false
                    });
                    list     = tab.exec(token[a]);
                    if (list !== null) {
                        tabs = list[0];
                    }
                    if (cdataS !== "") {
                        token[a] = tabs + cdataS + token[a];
                        cdataS   = "";
                    } else if (commentS !== "") {
                        token[a] = tabs + commentS + token[a];
                        commentS = "";
                    }
                    if (cdataE !== "") {
                        token[a] = token[a] + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + tabs + commentE;
                        commentE = "";
                    }
                    level.push(0);
                },
                style        = function markuppretty__beautify_style() {
                    var list = [];
                    stats.style[0] += 1;
                    stats.style[1] += token[a].length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart.exec(token[a])[0].replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart.exec(token[a])[0].replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    token[a] = csspretty({
                        comm          : mcomm,
                        cssinsertlines: mcssinsertlines,
                        inchar        : mchar,
                        inlevel       : (mstyle === "noindent") ? 0 : indent,
                        insize        : msize,
                        mode          : "beautify",
                        objsort       : mobjsort,
                        source        : token[a],
                        vertical      : (mvertical === true || mvertical === "true") ? true : false
                    });
                    list     = tab.exec(token[a]);
                    if (list !== null) {
                        tabs = list[0];
                    }
                    if (cdataS !== "") {
                        token[a] = tabs + cdataS + token[a];
                        cdataS   = "";
                    } else if (commentS !== "") {
                        token[a] = tabs + commentS + token[a];
                        commentS = "";
                    }
                    if (cdataE !== "") {
                        token[a] = token[a] + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + tabs + commentE;
                        commentE = "";
                    }
                    level.push(0);
                };
            for (a = 0; a < c; a += 1) {
                if (types[a] === "start") {
                    level.push(indent);
                    indent         += 1;
                    stats.start[0] += 1;
                    stats.start[1] += token[a].length;
                } else if (types[a] === "template_start") {
                    level.push(indent);
                    indent            += 1;
                    stats.template[0] += 1;
                    stats.template[1] += token[a].length;
                } else if (types[a] === "end") {
                    end();
                    stats.end[0] += 1;
                    stats.end[1] += token[a].length;
                } else if (types[a] === "template_end") {
                    end();
                    stats.template[0] += 1;
                    stats.template[1] += token[a].length;
                } else if (lines[a] === 0 && (types[a] === "singleton" || types[a] === "content" || types[a] === "template")) {
                    content();
                    stats[types[a]][0] += 1;
                    stats[types[a]][1] += token[a].length;
                } else if (types[a] === "script") {
                    stats.script[0] += 1;
                    stats.script[1] += token[a].length;
                    script();
                } else if (types[a] === "style") {
                    stats.style[0] += 1;
                    stats.style[1] += 1;
                    style();
                } else if (types[a] === "comment" && mcomm === "noindent") {
                    level.push(0);
                    stats.comment[0] += 1;
                    stats.comment[1] += token[a].length;
                } else {
                    level.push(indent);
                    stats[types[a]][0] += 1;
                    stats[types[a]][1] += token[a].length;
                }
                ltype = types[a];
                lline = lines[a];
            }
            level[0] = 0;
        }());
    }

    return (function markuppretty__apply() {
        var a       = 0,
            c       = level.length,
            build   = [],
            output  = "",
            //tab builds out the character sequence for one step of indentation
            tab     = (function markuppretty__apply_tab() {
                var aa  = 0,
                    ind = [mchar];
                msize -= 1;
                for (aa = 0; aa < msize; aa += 1) {
                    ind.push(mchar);
                }
                return ind.join("");
            }()),
            //a new line character plus the correct amount
            //of identation for the given line of code
            nl      = function markuppretty__apply_nl(ind, item) {
                var aa          = 0,
                    indentation = ["\n"];
                if (mmode === "minify") {
                    return build.push("\n");
                }
                if (lines[a] === 2 && item === build) {
                    indentation.push("\n");
                }
                for (aa = 0; aa < ind; aa += 1) {
                    indentation.push(tab);
                }
                item.push(indentation.join(""));
            },
            //populates attributes onto start and singleton tags
            //it also checks to see if a tag should or content should wrap
            wrap    = function markuppretty__apply_wrap() {
                var b        = 0,
                    len      = 0,
                    list     = attrs[a],
                    lev      = level[a],
                    atty     = "",
                    string   = "",
                    content  = [],
                    wordslen = 0;
                if (lev === "x") {
                    b = a;
                    do {
                        b   -= 1;
                        lev = level[b];
                    } while (lev === "x" && b > -1);
                    if (lev === "x") {
                        lev = 1;
                    }
                }
                if (list.length > 0) {
                    atty   = list.join(" ");
                    string = tagName(token[a]);
                    len    = string.length + 3 + atty.length;
                    if (token[a].charAt(token[a].length - 2) === "/") {
                        len += 1;
                    }
                    if (mwrap === 0 || len <= mwrap) {
                        token[a] = token[a].replace(" ", " " + atty);
                        return;
                    }
                    content.push(token[a].slice(0, token[a].indexOf(" ")));
                    wordslen = content[0].length;
                    len      = list.length;
                    for (b = 0; b < len; b += 1) {
                        if (list[b].length + wordslen + 1 > mwrap) {
                            nl(lev + 1, content);
                            wordslen = 0;
                        } else {
                            content.push(" ");
                            wordslen += 1;
                        }
                        content.push(list[b]);
                        wordslen += list[b].length;
                    }
                    content.push(token[a].slice(token[a].indexOf(" ") + 1));
                    token[a] = content.join("");
                } else {
                    list = token[a].split(" ");
                    len  = list.length;
                    for (b = 0; b < len; b += 1) {
                        string = string + list[b];
                        if (list[b + 1] !== undefined && string.length + list[b + 1].length + 1 > mwrap) {
                            content.push(string);
                            nl(lev, content);
                            string = "";
                        } else {
                            string = string + " ";
                        }
                    }
                    if (content.length > 0 && content[content.length - 1].charAt(0) === "\n") {
                        content.pop();
                    }
                    token[a] = content.join("");
                }
            },
            //JSX tags may contain comments, which are captured as
            //attributes in this parser.  These attributes demand
            //unique care to be correctly applied.
            attrcom = function markuppretty__apply_attrcom() {
                var toke  = token[a].split(" "),
                    attr  = attrs[a],
                    len   = attr.length,
                    ilen  = 0,
                    item  = [toke[0]],
                    temp  = [],
                    tempx = [],
                    index = 0,
                    b     = 0,
                    x     = 0,
                    y     = 0;
                nl(level[a], build);
                for (b = 0; b < len; b += 1) {
                    index = attr[b].indexOf("\n");
                    if (index > 0 && index !== attr[b].length - 1 && attr[b].indexOf("/*") === 0) {
                        temp = attr[b].split("\n");
                        tempx.push(temp[0]);
                        y = temp.length;
                        for (x = 0; x < y; x += 1) {
                            if (temp[x] === "") {
                                temp[x] = "\n";
                            } else {
                                nl(level[a] + 1, tempx);
                                tempx.push(temp[x].replace(/^(\s+)/, ""));
                            }
                        }
                        tempx.push("\n");
                        attr[b] = tempx.join("");
                    }
                    if (b > 0 && attr[b - 1].charAt(attr[b - 1].length - 1) === "\n") {
                        nl(level[a] + 1, item);
                        ilen       = item.length - 1;
                        item[ilen] = item[ilen].slice(1);
                    } else {
                        item.push(" ");
                    }
                    item.push(attr[b]);
                }
                if (attr[len - 1].charAt(attr[len - 1].length - 1) === "\n") {
                    nl(level[a], item);
                    ilen       = item.length - 1;
                    item[ilen] = item[ilen].slice(1);
                }
                item.push(toke[1]);
                build.push(item.join(""));
            };
        for (a = 0; a < c; a += 1) {
            if (jscom[a] === true) {
                attrcom();
            } else if ((types[a] === "content" && mwrap > 0 && token[a].length > mwrap) || attrs[a].length > 0) {
                wrap();
            }
            if (token[a] !== "</prettydiffli>") {
                if (isNaN(level[a]) === false) {
                    nl(level[a], build);
                } else if (level[a] === "s") {
                    build.push(" ");
                }
                build.push(token[a]);
            }
        }
        if (build[0] === "\n") {
            build[0] = "";
        }
        output = build.join("");
        if (mmode === "beautify") {
            summary = (function markuppretty__apply_summary() {
                var len        = token.length,
                    sum        = [],
                    startend   = stats.start[0] - stats.end[0],
                    statistics = (function markuppretty__apply_summary_statistics() {
                        var stat       = [],
                            totalItems = stats.cdata[0] + stats.comment[0] + stats.content[0] + stats.end[0] + stats.ignore[0] + stats.script[0] + stats.sgml[0] + stats.singleton[0] + stats.start[0] + stats.style[0] + stats.template[0] + stats.text[0] + stats.xml[0],
                            totalSizes = stats.cdata[1] + stats.comment[1] + stats.content[1] + stats.end[1] + stats.ignore[1] + stats.script[1] + stats.sgml[1] + stats.singleton[1] + stats.start[1] + stats.style[1] + stats.template[1] + stats.text[1] + stats.xml[1],
                            rowBuilder = function markuppretty__apply_summary_stats_rowBuilder(type) {
                                var itema = (type === "Total") ? totalItems : stats[type][0],
                                    itemb = (type === "Total") ? totalSizes : stats[type][1];
                                stat.push("<tr><th>");
                                stat.push(type);
                                stat.push("</th><td>");
                                stat.push(itema);
                                stat.push("</td><td");
                                if (startend !== 0 && (type === "start" || type === "end")) {
                                    stat.push(" class=\"bad\"");
                                }
                                stat.push(">");
                                stat.push(((itema / totalItems) * 100).toFixed(2));
                                stat.push("%</td><td>");
                                stat.push(itemb);
                                stat.push("</td><td>");
                                stat.push(((itemb / totalSizes) * 100).toFixed(2));
                                stat.push("%</td></tr>");
                            };
                        stat.push("<h4>Statistics and analysis of parsed code</h4>");
                        stat.push("<table class='analysis' summary='Statistics'><caption>This table provides basic " +
                            "statistics about the parsed components of the given code sample..</caption>");
                        stat.push("<thead><tr><th>Item type</th><th>Number of instances</th><th>Percentage of total" +
                            " items</th><th>Character size</th><th>Percentage of total size</th></tr></thead>");
                        stat.push("<tbody>");
                        rowBuilder("Total");
                        rowBuilder("cdata");
                        rowBuilder("comment");
                        rowBuilder("content");
                        rowBuilder("end");
                        rowBuilder("ignore");
                        rowBuilder("script");
                        rowBuilder("sgml");
                        rowBuilder("singleton");
                        rowBuilder("start");
                        rowBuilder("style");
                        rowBuilder("template");
                        rowBuilder("text");
                        rowBuilder("xml");
                        stat.push("</tbody></table>");
                        return stat.join("");
                    }()),
                    numformat  = function markuppretty__apply_summary_numformat(x) {
                        var y    = String(x).split(""),
                            z    = 0,
                            xlen = y.length,
                            dif  = 0;
                        if (xlen % 3 === 2) {
                            dif = 2;
                        } else if (xlen % 3 === 1) {
                            dif = 1;
                        }
                        for (z = xlen - 1; z > 0; z -= 1) {
                            if ((z % 3) - dif === 0) {
                                y[z] = "," + y[z];
                            }
                        }
                        return y.join("");
                    },
                    analysis   = function markuppretty__apply_summary_analysis(arr) {
                        var x       = arr.length,
                            idtest  = (arr === ids) ? true : false,
                            y       = 0,
                            data    = [],
                            content = [];
                        if (x > 0) {
                            arr = safeSort(arr);
                            for (y = 0; y < x; y += 1) {
                                if (arr[y] === arr[y + 1]) {
                                    if (idtest === true && (data.length === 0 || data[data.length - 1][1] !== arr[y])) {
                                        data.push([
                                            2, arr[y]
                                        ]);
                                    }
                                    data[data.length - 1][0] += 1;
                                } else if (idtest === false) {
                                    data.push([
                                        1, arr[y]
                                    ]);
                                }
                            }
                            x = data.length;
                            if (idtest === true) {
                                if (x === 0) {
                                    return "";
                                }
                                content.push("<h4>Duplicate id attribute values</h4>");
                            } else {
                                content.push("<h4>HTTP requests:</h4>");
                            }
                            content.push("<ul>");
                            for (y = 0; y < x; y += 1) {
                                content.push("<li>");
                                content.push(data[y][0]);
                                content.push("x - ");
                                content.push(data[y][1]);
                                content.push("</li>");
                            }
                            content.push("</ul>");
                            return content.join("");
                        }
                        return "";
                    },
                    zipf       = (function markuppretty__apply_summary_zipf() {
                        var x          = 0,
                            wordlen    = 0,
                            wordcount  = 0,
                            word       = "",
                            ratio      = "",
                            wordlist   = [],
                            wordtotal  = [],
                            wordproper = [],
                            zipfout    = [],
                            identical  = true,
                            sortchild  = function markuppretty__apply_summary_zipf_sortchild(y, z) {
                                return z[0] - y[0];
                            };
                        for (x; x < len; x += 1) {
                            if (types[x] === "content") {
                                wordlist.push(token[x]);
                            }
                        }
                        wordlist = safeSort(wordlist.join(" ").toLowerCase().replace(/\&nbsp;?/gi, " ").replace(/(\,|\.|\?|\!|\:|\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").split(" "));
                        wordlen  = wordlist.length;
                        for (x = 0; x < wordlen; x += 1) {
                            word = wordlist[x];
                            if (word.length > 2 && word.length < 30 && (/&\#?\w+;/).test(word) === false && word !== "the" && word !== "and" && word !== "for" && word !== "are" && word !== "this" && word !== "from" && word !== "with" && word !== "that" && word !== "to") {
                                if (wordproper.length === 0 || word !== wordproper[wordproper.length - 1][1]) {
                                    wordproper.push([
                                        1, word
                                    ]);
                                } else {
                                    wordproper[wordproper.length - 1][0] += 1;
                                }
                            }
                            if (word !== wordlist[x - 1]) {
                                wordtotal.push([
                                    1, word
                                ]);
                            } else {
                                wordtotal[wordtotal.length - 1][0] += 1;
                            }
                        }
                        wordtotal  = wordtotal.sort(sortchild).slice(0, 11);
                        wordproper = wordproper.sort(sortchild).slice(0, 11);
                        wordlen    = (wordproper.length > 10) ? 11 : wordproper.length;
                        for (x = 0; x < wordlen; x += 1) {
                            if (wordtotal[x][1] !== wordproper[x][1]) {
                                identical = false;
                                break;
                            }
                        }
                        wordlen = (wordtotal.length > 10) ? 10 : wordtotal.length;
                        if (wordlen > 1) {
                            wordcount = wordlist.length;
                            zipfout.push("<h4>Zipf's Law analysis of content</h4>");
                            zipfout.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrate" +
                                "s <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content a" +
                                "nd the number of times they occurred.</caption>");
                            zipfout.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of I" +
                                "nstances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Perc" +
                                "entage from ");
                            zipfout.push(wordcount);
                            zipfout.push(" total words</th></tr></thead><tbody>");
                            if (identical === false) {
                                zipfout.push("<tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                            }
                            for (x = 0; x < wordlen; x += 1) {
                                ratio = (wordtotal[x + 1] !== undefined) ? (wordtotal[x][0] / wordtotal[x + 1][0]).toFixed(2) : "1.00";
                                zipfout.push("<tr><td>");
                                zipfout.push(x + 1);
                                zipfout.push("</td><td>");
                                zipfout.push(wordtotal[x][1]);
                                zipfout.push("</td><td>");
                                zipfout.push(wordtotal[x][0]);
                                zipfout.push("</td><td>");
                                zipfout.push(ratio);
                                zipfout.push("</td><td>");
                                zipfout.push(((wordtotal[x][0] / wordcount) * 100).toFixed(2));
                                zipfout.push("%</td></tr>");
                            }
                            wordlen = (wordproper.length > 10) ? 10 : wordproper.length;
                            if (wordlen > 1 && identical === false) {
                                zipfout.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                for (x = 0; x < wordlen; x += 1) {
                                    ratio = (wordproper[x + 1] !== undefined) ? (wordproper[x][0] / wordproper[x + 1][0]).toFixed(2) : "1.00";
                                    zipfout.push("<tr><td>");
                                    zipfout.push(x + 1);
                                    zipfout.push("</td><td>");
                                    zipfout.push(wordproper[x][1]);
                                    zipfout.push("</td><td>");
                                    zipfout.push(wordproper[x][0]);
                                    zipfout.push("</td><td>");
                                    zipfout.push(ratio);
                                    zipfout.push("</td><td>");
                                    zipfout.push(((wordproper[x][0] / wordcount) * 100).toFixed(2));
                                    zipfout.push("%</td></tr>");
                                }
                            }
                            zipfout.push("</tbody></table>");
                        }
                        return zipfout.join("");
                    }());

                if (startend > 0) {
                    sum.push("<p><strong>");
                    sum.push(startend);
                    sum.push(" more start tag");
                    if (startend > 1) {
                        sum.push("s");
                    }
                    sum.push(" than end tags!</strong></p>");
                } else if (startend < 0) {
                    startend = startend * -1;
                    sum.push("<p><strong>");
                    sum.push(startend);
                    sum.push(" more end tag");
                    if (startend > 1) {
                        sum.push("s");
                    }
                    sum.push(" than start tags!</strong></p>");
                }
                sum.push("<p><strong>Total input size:</strong> <em>");
                sum.push(numformat(msource.length));
                sum.push("</em> characters</p>");
                sum.push("<p><strong>Total output size:</strong> <em>");
                sum.push(numformat(output.length));
                sum.push("</em> characters</p>");
                sum.push("<p><strong>Total number of HTTP requests (presuming HTML or XML Schema):</strong" +
                    "> <em>");
                sum.push(reqs.length);
                sum.push("</em></p>");
                sum.push("<div class='doc'>");
                sum.push(analysis(ids));
                sum.push(zipf);
                sum.push(statistics);
                sum.push(analysis(reqs));
                sum.push("</div>");
                return sum.join("");
            }());
        }
        return output;
    }());
};
