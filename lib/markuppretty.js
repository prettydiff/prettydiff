/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global __dirname, ace, define, exports, global, process*/
/*jslint for: true*/
/***********************************************************************
 markuppretty is written by Austin Cheney on 20 Jun 2015.  Anybody may
 use this code without permission so long as this comment exists
 verbatim in each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/* A simple parser for XML, HTML, and a variety of template schemes. It
 beautifies, minifies, and peforms a series of analysis*/
var markuppretty = function markuppretty_(args) {
    "use strict";
    var maccessibility  = (args.accessibility === true || args.accessibility === "true"),
        mbraceline      = (args.braceline === true || args.braceline === "true"),
        mbracepadding   = (args.bracepadding === true || args.bracepadding === "true"),
        mbraces         = (args.braces === "allman")
            ? "allman"
            : "knr",
        mchar           = (typeof args.inchar === "string" && args.inchar.length > 0)
            ? args.inchar
            : " ",
        mcomm           = (typeof args.comments === "string" && args.comments === "noindent")
            ? "noindent"
            : (args.comments === "nocomment")
                ? "nocomment"
                : "indent",
        mcommline       = (args.commline === true || args.commline === "true"),
        mconditional    = (args.html === true || args.conditional === true || args.conditional === "true"),
        mcont           = (args.content === true || args.content === "true"),
        mcorrect        = (args.correct === true || args.correct === "true"),
        mcssinsertlines = (args.cssinsertlines === true || args.cssinsertlines === "true"),
        mdust           = (args.dustjs === true || args.dustjs === "true"),
        mmethodchain    = (args.methodchain === true || args.methodchain === "true"),
        mforce          = (args.force_indent === true || args.force_indent === "true"),
        mhtml           = (args.html === true || args.html === "true"),
        minlevel        = (isNaN(args.inlevel) === true)
            ? 0
            : Number(args.inlevel),
        mjsx            = (args.jsx === true || args.jsx === "true"),
        mmode           = (args.mode === "parse" || args.mode === "diff" || args.mode === "minify")
            ? args.mode
            : "beautify",
        mobfuscate      = (args.obfuscate === true || args.obfuscate === "true"),
        mobjsort        = (args.objsort === true || args.objsort === "true"),
        mpreserve       = (args.preserve !== false && args.preserve !== "false"),
        mquoteConvert   = (args.quoteConvert === "single" || args.quoteConvert === "double")
            ? args.quoteConvert
            : "none",
        msize           = (isNaN(args.insize) === true)
            ? 4
            : Number(args.insize),
        msource         = (typeof args.source === "string" && args.source.length > 0)
            ? args.source
            : "Error: no source code supplied to markuppretty!",
        mspace          = (args.space !== false && args.space !== "false"),
        mspaceclose     = (args.spaceclose === true || args.spaceclose === "true"),
        mstyle          = (typeof args.style === "string" && args.style === "noindent")
            ? "noindent"
            : "indent",
        mstyleguide     = (typeof args.styleguide === "string")
            ? args.styleguide
            : "none",
        mtagmerge       = (args.tagmerge === true || args.tagmerge === "true"),
        mtagsort        = (args.tagsort === true || args.tagsort === "true"),
        mtextpreserve   = (args.textpreserve === true || args.textpreserve === "true"),
        mtopcomments    = (args.top_comments === true || args.top_comments === "true"),
        mwrap           = (isNaN(args.wrap) === true || mjsx === true)
            ? 0
            : Number(args.wrap),
        mvarword        = (args.varword === "each" || args.varword === "list")
            ? args.varword
            : "none",
        mvertical       = (args.vertical === "jsonly")
            ? "jsonly"
            : (args.vertical === true || args.vertical === "true"),
        stats           = {
            cdata      : [
                0, 0
            ],
            comment    : [
                0, 0
            ],
            conditional: [
                0, 0
            ],
            content    : [
                0, 0
            ],
            end        : [
                0, 0
            ],
            ignore     : [
                0, 0
            ],
            script     : [
                0, 0
            ],
            sgml       : [
                0, 0
            ],
            singleton  : [
                0, 0
            ],
            space      : 0,
            start      : [
                0, 0
            ],
            style      : [
                0, 0
            ],
            template   : [
                0, 0
            ],
            text       : [
                0, 0
            ],
            xml        : [
                0, 0
            ]
        },

        //parallel arrays
        //* attrs is a list of arrays, each of which contains (if any) parsed attributes
        //* jscom stores true/false if the current token is a JS comment from JSX format
        //* level describes the indentation of a given token level is only used in
        //beautify and diff modes
        //* linen stores the input line number on which the token occurs * lines
        //describes the preceeding space using: 2, 1, or 0 lines is populated in
        //markuppretty__tokenize_spacer
        //* token stores parsed tokens//* types segments tokens into named groups
        attrs           = [],
        jscom           = [],
        level           = [],
        linen           = [],
        lines           = [],
        token           = [],
        types           = [],
        reqs            = [],
        ids             = [],
        parseError      = [],
        line            = 1,
        //What is the lowercase tag name of the provided token?
        tagName         = function markuppretty__tagName(el) {
            var space = el.replace(/\s+/, " ")
                    .indexOf(" "),
                name  = (space < 0)
                    ? el.slice(1, el.length - 1)
                    : el.slice(1, space)
                        .toLowerCase();
            return name;
        },
        attrName        = function markuppretty__attrName(atty) {
            var index = atty.indexOf("="),
                name  = "",
                value = "";
            if (index < 0) {
                return [atty, ""];
            }
            name  = atty.slice(0, index);
            value = atty.slice(index + 1);
            if ((value.charAt(0) === "\"" && value.charAt(value.length - 1) === "\"") || (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")) {
                value = value.slice(1, value.length - 1);
            }
            if (mhtml === true) {
                return [name.toLowerCase(), value.toLowerCase()];
            }
            return [name, value];
        };

    //type definitions:
    //start      end     type
    //<[CDATA[   ]]>     cdata
    //<!--       -->     comment
    //<#--       -->     comment
    //<%--       --%>    comment
    //{!         !}      comment
    //<!--[if    -->     conditional
    //text       text    content
    //</         >       end
    //<pre       </pre>  ignore (html only)
    //text       text    script
    //<!         >       sgml
    //<          />      singleton
    //<          >       start
    //text       text    style
    //<!--#      -->     template
    //<%         %>      template
    //{{{        }}}     template
    //{{         }}      template
    //{%         %}      template
    //[%         %]      template
    //{@         @}      template
    //{#         #}      template
    //{#         /}      template
    //{?         /}      template
    //{^         /}      template
    //{@         /}      template
    //{<         /}      template
    //{+         /}      template
    //{~         }       template
    //<?         ?>      template
    //{:else}            template_else
    //<#else     >       template_else
    //{{/        }}      template_end
    //<%\s*}     %>      template_end
    //[%\s*}     %]      template_end
    //{@\s*}     @}      template_end
    //{/         }       template_end
    //{{#        }}      template_start
    //<%         {\s*%>  template_start
    //[%         {\s*%]  template_start
    //{@         {\s*@}  template_start
    //{#         }       template_start
    //{?         }       template_start
    //{^         }       template_start
    //{@         }       template_start
    //{<         }       template_start
    //{+         }       template_start
    //<?xml      ?>      xml
    if (mmode === "diff") {
        mwrap = 0;
    } else {
        mcont = false;
    }
    if (mjsx === true) {
        mdust = false;
    }
    if (mtextpreserve === true) {
        mwrap = 0;
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
                    e         = 0,
                    f         = 0,
                    igcount   = 0,
                    jsxcount  = 0,
                    quote     = "",
                    element   = "",
                    lastchar  = "",
                    jsxquote  = "",
                    comment   = false,
                    cheat     = false,
                    endtag    = false,
                    nopush    = false,
                    simple    = false,
                    preserve  = false,
                    stest     = false,
                    liend     = false,
                    ignoreme  = false,
                    quotetest = false,
                    parseFail = false,
                    singleton = false,
                    attribute = [],
                    attrpush  = function markuppretty__tokenize_tag_attrpush(quotes) {
                        var atty = "",
                            name = "";
                        if (quotes === true) {
                            if (quote === "\"" && mquoteConvert === "single") {
                                atty = attribute.slice(0, attribute.length - 1)
                                    .join("")
                                    .replace(/'/g, "\"")
                                    .replace(/"/, "'") + "'";
                            } else if (quote === "'" && mquoteConvert === "double") {
                                atty = attribute.slice(0, attribute.length - 1)
                                    .join("")
                                    .replace(/"/g, "'")
                                    .replace(/'/, "\"") + "\"";
                            } else {
                                atty = attribute.join("");
                            }
                            name = attrName(atty)[0];
                            if (name === "data-prettydiff-ignore") {
                                ignoreme = true;
                            } else if (name === "id") {
                                ids.push(atty.slice(name.length + 2, atty.length - 1));
                            } else if (name === "schemaLocation") {
                                reqs.push(atty.slice(name.length + 2, atty.length - 1));
                            }
                            quote = "";
                        } else {
                            atty = attribute.join("")
                                .replace(/\s+/g, " ");
                            name = attrName(atty)[0];
                            if (name === "data-prettydiff-ignore") {
                                ignoreme = true;
                            } else if (name === "id") {
                                ids.push(element.slice(name.length + 1, atty.length));
                            }
                            if (mjsx === true && attribute[0] === "{" && attribute[attribute.length - 1] === "}") {
                                jsxcount = 0;
                            }
                        }
                        if (atty.charAt(0) === "=" && attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1].indexOf("=") < 0) {
                            attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] = attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] + atty.replace(/\s+/g, " ");
                        } else if (atty !== "" && atty !== " ") {
                            attrs[attrs.length - 1].push(atty);
                        }
                        attribute = [];
                    };
                spacer();
                jscom.push(false);
                attrs.push([]);
                linen.push(line);
                ext = false;
                //this complex series of conditions determines an elements delimiters
                //look to the types being pushed to quickly reason about the logic
                //no type is pushed for start tags or singleton tags just yet some types set the
                //`preserve` flag, which means to preserve internal white space
                //The `nopush` flag is set when parsed tags are to be ignored and forgotten
                if (b[a] === "<") {
                    if (b[a + 1] === "!") {
                        if (b[a + 2] === "-" && b[a + 3] === "-") {
                            if (b[a + 4] === "#") {
                                end = "-->";
                                types.push("template");
                            } else if (b[a + 4] === "[" && b[a + 5] === "i" && b[a + 6] === "f" && mconditional === true) {
                                end = "-->";
                                types.push("conditional");
                            } else {
                                end = "-->";
                                if (mmode === "minify" || mcomm === "nocomment") {
                                    nopush = true;
                                } else {
                                    preserve = true;
                                    comment  = true;
                                    if (mcommline === true) {
                                        lines[lines.length - 1] = 2;
                                    }
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
                            end     = "--%>";
                            comment = true;
                            if (mcommline === true) {
                                line[line.length - 1] = 2;
                            }
                            types.push("comment");
                        } else {
                            end = "%>";
                            types.push("template");
                        }
                    } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "p" && b[a + 2].toLowerCase() === "r" && b[a + 3].toLowerCase() === "e" && (b[a + 4] === ">" || (/\s/).test(b[a + 4]) === true)) {
                        end      = "</pre>";
                        preserve = true;
                        types.push("ignore");
                    } else if (b[a + 4] !== undefined && b[a + 1].toLowerCase() === "x" && b[a + 2].toLowerCase() === "s" && b[a + 3].toLowerCase() === "l" && b[a + 4].toLowerCase() === ":" && b[a + 5].toLowerCase() === "t" && b[a + 6].toLowerCase() === "e" && b[a + 7].toLowerCase() === "x" && b[a + 8].toLowerCase() === "t" && (b[a + 9] === ">" || (/\s/).test(b[a + 9]) === true)) {
                        end      = "</xsl:text>";
                        preserve = true;
                        types.push("ignore");
                    } else if (b[a + 1] === "<") {
                        if (b[a + 2] === "<") {
                            end = ">>>";
                        } else {
                            end = ">>";
                        }
                        types.push("template");
                    } else if (b[a + 1] === "#") {
                        if (b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e") {
                            end = ">";
                            types.push("template_else");
                        } else if (b[a + 2] === "-" && b[a + 3] === "-") {
                            end = "-->";
                            types.push("comment");
                            preserve = true;
                        } else {
                            end = ">";
                            types.push("start");
                        }
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
                    if (mjsx === true) {
                        end = "}";
                        types.push("script");
                    } else if (mdust === true) {
                        if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                            a += 6;
                            token.push("{:else}");
                            return types.push("template_else");
                        }
                        if (b[a + 1] === "!") {
                            end     = "!}";
                            comment = true;
                            types.push("comment");
                        } else if (b[a + 1] === "/") {
                            end = "}";
                            types.push("template_end");
                        } else if (b[a + 1] === "~") {
                            end = "}";
                            types.push("singleton");
                        } else if (b[a + 1] === ">") {
                            end = "/}";
                            types.push("singleton");
                        } else if (b[a + 1] === "#" || b[a + 1] === "?" || b[a + 1] === "^" || b[a + 1] === "@" || b[a + 1] === "<" || b[a + 1] === "+") {
                            end = "}";
                            types.push("template_start");
                        } else {
                            end = "}";
                            types.push("template");
                        }
                    } else if (b[a + 1] === "{") {
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
                } else if (b[a] === "[" && b[a + 1] === "%") {
                    end = "%]";
                    types.push("template");
                }
                //This loop is the logic that parses tags and attributes
                //If the attribute data-prettydiff-ignore is present the `ignore` flag is set
                //The ignore flag is identical to the preserve flag
                lastchar = end.charAt(end.length - 1);
                for (a = a; a < c; a += 1) {
                    if (b[a] === "\n") {
                        line += 1;
                    }
                    output.push(b[a]);
                    if (comment === true) {
                        quote = "";
                    }
                    if (quote === "") {
                        if (mjsx === true) {
                            if (b[a] === "{") {
                                jsxcount += 1;
                            } else if (b[a] === "}") {
                                jsxcount -= 1;
                            }
                        }
                        if (b[a] === "<" && preserve === false && output.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                            parseError.push("Parse error on line " + line + " on element: ");
                            parseFail = true;
                        }
                        if (stest === true && (/\s/).test(b[a]) === false && b[a] !== lastchar) {
                            //attribute start
                            stest = false;
                            quote = jsxquote;
                            output.pop();
                            for (a = a; a < c; a += 1) {
                                if (b[a] === "\n") {
                                    line += 1;
                                }
                                attribute.push(b[a]);
                                if (quote === "") {
                                    if (b[a + 1] === lastchar) {
                                        //if at end of tag
                                        if (attribute[attribute.length - 1] === "/") {
                                            attribute.pop();
                                            a -= 1;
                                        }
                                        if (attribute.length > 0) {
                                            attrpush(false);
                                        }
                                        break;
                                    }
                                    if (b[a] === "\"" || b[a] === "'") {
                                        quote = b[a];
                                    } else if (mjsx === true) {
                                        //jsx variable attribute
                                        if ((b[a - 1] === "=" || (/\s/).test(b[a - 1]) === true) && b[a] === "{") {
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
                                    } else if (output[0] !== "{" && b[a] === "{" && (mdust === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                        //opening embedded template expression
                                        if (b[a + 1] === "{") {
                                            if (b[a + 2] === "{") {
                                                quote = "}}}";
                                            } else {
                                                quote = "}}";
                                            }
                                        } else if (mdust === true) {
                                            quote = "}";
                                        } else {
                                            quote = b[a + 1] + "}";
                                        }
                                    }
                                    if ((/\s/).test(b[a]) === true && quote === "") {
                                        //testing for a run of spaces between an attribute's =
                                        //and a quoted value. Unquoted values separated by space
                                        //are separate attributes
                                        if (attribute[attribute.length - 2] === "=") {
                                            for (e = a + 1; e < c; e += 1) {
                                                if ((/\s/).test(b[e]) === false) {
                                                    if (b[e] === "\"" || b[e] === "'") {
                                                        a         = e - 1;
                                                        quotetest = true;
                                                        attribute.pop();
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        if (quotetest === true) {
                                            quotetest = false;
                                        } else if (jsxcount === 0 || (jsxcount === 1 && attribute[0] === "{")) {
                                            //if there is an unquoted space attribute is complete
                                            attribute.pop();
                                            attrpush(false);
                                            stest = true;
                                            break;
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
                                                jsxcount  = 0;
                                                quote     = "";
                                                element   = attribute.join("")
                                                    .replace(/\s+/g, " ");
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
                                        attrpush(true);
                                        if (b[a + 1] === lastchar) {
                                            break;
                                        }
                                    }
                                }
                            }
                        } else if (b[a] === "\"" || b[a] === "'") {
                            //opening quote
                            quote = b[a];
                        } else if (output[0] !== "{" && b[a] === "{" && (mdust === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) { //opening embedded template expression
                            if (b[a + 1] === "{") {
                                if (b[a + 2] === "{") {
                                    quote = "}}}";
                                } else {
                                    quote = "}}";
                                }
                            } else if (mdust === true) {
                                quote = "}";
                            } else {
                                quote = b[a + 1] + "}";
                            }
                            if (quote === end) {
                                quote = "";
                            }
                        } else if (simple === true && (/\s/).test(b[a]) === true && b[a - 1] !== "<") {
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
                        } else if (b[a] === lastchar && (mjsx === false || jsxcount === 0)) {
                            //if current character matches the last character of the tag ending sequence
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
                    attrs.pop();
                    jscom.pop();
                    linen.pop();
                    lines.pop();
                    space = minspace;
                    return;
                }
                //fix singleton tags and sort attributes
                if (attrs[attrs.length - 1].length > 0) {
                    e = attrs.length - 1;
                    if (attrs[e][attrs[e].length - 1] === "/") {
                        attrs[attrs.length - 1].pop();
                        output.splice(output.length - 1, 0, "/");
                    }
                    if (jscom[jscom.length - 1] === false && mjsx === false) {
                        attrs[attrs.length - 1] = global.safeSort(attrs[attrs.length - 1]);
                    }
                }

                element = output.join("");

                if (parseFail === true) {
                    if (element.indexOf("<!--<![") === 0) {
                        parseError.pop();
                    } else {
                        parseError[parseError.length - 1] = parseError[parseError.length - 1] + element;
                        if (element.indexOf("</") > 0) {
                            token.push(element);
                            return types.push("end");
                        }
                    }
                }
                //cheat identifies HTML singleton elements as singletons even if formatted as
                //start tags
                cheat = (function markuppretty__tokenize_tag_cheat() {
                    var tname = tagName(element),
                        atts  = attrs[attrs.length - 1],
                        atty  = [],
                        attn  = token[token.length - 1],
                        value = "",
                        type  = "",
                        d     = 0,
                        ee    = 1;
                    if (types[types.length - 1] === "end") {
                        if (types[types.length - 2] === "singleton" && attn.charAt(attn.length - 2) !== "/" && "/" + tagName(attn) === tname) {
                            types[types.length - 2] = "start";
                        } else if (types[types.length - 2] === "start" && tname !== "/span" && tname !== "/div" && tname !== "/script" && (mhtml === false || (mhtml === true && tname !== "/li")) && tname === "/" + tagName(token[token.length - 1]) && mtagmerge === true) {
                            types.pop();
                            attrs.pop();
                            jscom.pop();
                            linen.pop();
                            lines.pop();
                            types[types.length - 1] = "singleton";
                            token[token.length - 1] = token[token.length - 1].replace(/>$/, "/>");
                            singleton               = true;
                            return;
                        }
                    }
                    for (d = atts.length - 1; d > -1; d -= 1) {
                        atty = attrName(atts[d]);
                        if (atty[0] === "type") {
                            type = atty[1];
                            if (type.charAt(0) === "\"" || type.charAt(0) === "'") {
                                type = type.slice(1, type.length - 1);
                            }
                        } else if (atty[0] === "src" && (tname === "embed" || tname === "img" || tname === "script" || tname === "iframe")) {
                            value = atty[1];
                            if (value.charAt(0) === "\"" || value.charAt(0) === "'") {
                                value = value.slice(1, value.length - 1);
                            }
                            reqs.push(value);
                        } else if (tname === "link" && atty === "href") {
                            value = atty[1];
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
                    if (tname === "/#assign" || tname === "/#global") {
                        for (d = types.length - 2; d > -1; d -= 1) {
                            if (types[d] === "start" || types[d] === "template_start") {
                                ee -= 1;
                            } else if (types[d] === "end" || types[d] === "template_end") {
                                ee += 1;
                            }
                            if (ee === 1) {
                                if ((token[d].indexOf("<#assign") === 0 && tname === "/#assign") || (token[d].indexOf("<#global") === 0 && tname === "/#global")) {
                                    types[d] = "start";
                                    return false;
                                }
                            }
                            if (ee === 0) {
                                return false;
                            }
                        }
                        return false;
                    }
                    if (tname.charAt(0) === "#" && types[types.length - 1] === "start" && (tname === "#assign" || tname === "#break" || tname === "#case" || tname === "#default" || tname === "#fallback" || tname === "#flush" || tname === "#ftl" || tname === "#global" || tname === "#import" || tname === "#include" || tname === "#local" || tname === "#t" || tname === "#lt" || tname === "#rt" || tname === "#nested" || tname === "#nt" || tname === "#recover" || tname === "#recurse" || tname === "#return" || tname === "#sep" || tname === "#setting" || tname === "#stop" || tname === "#visit")) {
                        return true;
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
                    if (mdust === true && types[types.length - 1] === "template_start") {
                        type  = element.charAt(1);
                        value = element.slice(element.length - 2);
                        if ((value === "/}" || value.charAt(0) === type) && (type === "#" || type === "?" || type === "^" || type === "@" || type === "<" || type === "+")) {
                            types[types.length - 1] = "template";
                        }
                    }
                    return false;
                }());

                if (singleton === true) {
                    return;
                }
                //am I a singleton or a start type?
                if (simple === true && ignoreme === false) {
                    if (cheat === true || (output[output.length - 2] === "/" && output[output.length - 1] === ">")) {
                        types.push("singleton");
                    } else {
                        types.push("start");
                    }
                }
                //additional logic is required to find the end of a tag with the attribute
                //data-prettydiff-ignore
                if (simple === true && preserve === false && ignoreme === true && end === ">" && element.slice(element.length - 2) !== "/>") {
                    if (cheat === true) {
                        types.push("singleton");
                    } else {
                        preserve = true;
                        types.push("ignore");
                        a += 1;
                        for (a = a; a < c; a += 1) {
                            if (b[a] === "\n") {
                                line += 1;
                            }
                            output.push(b[a]);
                            if (quote === "") {
                                if (b[a] === "\"") {
                                    quote = "\"";
                                } else if (b[a] === "'") {
                                    quote = "'";
                                } else if (output[0] !== "{" && b[a] === "{" && (mdust === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                    if (b[a + 1] === "{") {
                                        if (b[a + 2] === "{") {
                                            quote = "}}}";
                                        } else {
                                            quote = "}}";
                                        }
                                    } else if (mdust === true) {
                                        quote = "}";
                                    } else {
                                        quote = b[a + 1] + "}";
                                    }
                                } else if (b[a] === "<" && simple === true) {
                                    if (b[a + 1] === "/") {
                                        endtag = true;
                                    } else {
                                        endtag = false;
                                    }
                                } else if (b[a] === lastchar) {
                                    if (b[a - 1] !== "/") {
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
                    linen.push(line);
                    lines[lines.length - 2] = 0;
                    attrs.splice(attrs.length - 1, 0, []);
                    types.splice(types.length - 1, 0, "end");
                }
                if (preserve === true) {
                    token.push(element);
                } else {
                    token.push(element.replace(/\s+/g, " "));
                }
                if (mtagsort === true && types[types.length - 1] === "end" && types[types.length - 2] !== "start") {
                    (function markuppretty__tokenize_tag_sorttag() {
                        var children   = [],
                            bb         = 0,
                            d          = 0,
                            endStore   = 0,
                            startStore = 0,
                            endData    = {},
                            store      = {
                                attrs: [],
                                jscom: [],
                                linen: [],
                                lines: [],
                                token: [],
                                types: []
                            },
                            sortName   = function markuppretty__tokenize_tag_sorttag_sortName(x, y) {
                                if (token[x[0]] < token[y[0]]) {
                                    return 1;
                                }
                                return -1;
                            },
                            pushy      = function markuppretty__tokenize_tag_sorttag_pushy(index) {
                                store.attrs
                                    .push(attrs[index]);
                                store.jscom
                                    .push(jscom[index]);
                                store.linen
                                    .push(linen[index]);
                                store.lines
                                    .push(lines[index]);
                                store.token
                                    .push(token[index]);
                                store.types
                                    .push(types[index]);
                            };
                        for (bb = token.length - 2; bb > -1; bb -= 1) {
                            if (types[bb] === "start") {
                                d -= 1;
                                if (d < 0) {
                                    startStore = bb + 1;
                                    break;
                                }
                            } else if (types[bb] === "end") {
                                d += 1;
                                if (d === 1) {
                                    endStore = bb;
                                }
                            }
                            if (d === 0) {
                                if (types[bb] === "start") {
                                    children.push([bb, endStore]);
                                } else {
                                    children.push([bb, bb]);
                                }
                            }
                        }
                        if (children.length < 2) {
                            return;
                        }
                        children.sort(sortName);
                        for (bb = children.length - 1; bb > -1; bb -= 1) {
                            pushy(children[bb][0]);
                            if (children[bb][0] !== children[bb][1]) {
                                for (d = children[bb][0] + 1; d < children[bb][1]; d += 1) {
                                    pushy(d);
                                }
                                pushy(children[bb][1]);
                            }
                        }
                        endData.attrs = attrs.pop();
                        endData.jscom = jscom.pop();
                        endData.linen = linen.pop();
                        endData.lines = lines.pop();
                        endData.token = token.pop();
                        endData.types = types.pop();
                        attrs         = attrs.slice(0, startStore)
                            .concat(store.attrs);
                        jscom         = jscom.slice(0, startStore)
                            .concat(store.jscom);
                        linen         = linen.slice(0, startStore)
                            .concat(store.linen);
                        lines         = lines.slice(0, startStore)
                            .concat(store.lines);
                        token         = token.slice(0, startStore)
                            .concat(store.token);
                        types         = types.slice(0, startStore)
                            .concat(store.types);
                        attrs.push(endData.attrs);
                        jscom.push(endData.jscom);
                        linen.push(endData.linen);
                        lines.push(endData.lines);
                        token.push(endData.token);
                        types.push(endData.types);
                    }());
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
                linen.push(line);
                if (ext === true) {
                    name = tagName(token[token.length - 1]);
                }
                for (a = a; a < c; a += 1) {
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
                                    linen.pop();
                                    return lines.pop();
                                }
                                token.push(output.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                if (typeof global.jspretty === "function") {
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
                                    linen.pop();
                                    return lines.pop();
                                }
                                token.push(output.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                if (typeof global.csspretty === "function") {
                                    return types.push(name);
                                }
                                return types.push("content");
                            }
                        } else if (quote === b[a] && (quote === "\"" || quote === "'" || (quote === "*" && b[a + 1] === "/"))) {
                            quote = "";
                        } else if (quote === "/" && b[a] === "\n") {
                            quote = "";
                        }
                    } else if (b[a] === "<" || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (mjsx === true || mdust === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#"))) {
                        if (mdust === true && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                            a += 6;
                            if (mcont === true) {
                                token.push("text");
                            } else if (mtextpreserve === true) {
                                token.push(minspace + output.join(""));
                                lines[lines.length - 1] = 0;
                            } else {
                                token.push(output.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                            }
                            types.push("content");
                            spacer();
                            attrs.push([]);
                            jscom.push(false);
                            linen.push(line);
                            token.push("{:else}");
                            return types.push("template_else");
                        }
                        a -= 1;
                        if (mcont === true) {
                            token.push("text");
                        } else if (mtextpreserve === true) {
                            token.push(minspace + output.join(""));
                            lines[lines.length - 1] = 0;
                        } else {
                            token.push(output.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                        }
                        return types.push("content");
                    }
                    output.push(b[a]);
                }
            };

        for (a = 0; a < c; a += 1) {
            if ((/\s/).test(b[a]) === true) {
                space = space + b[a];
                if (b[a] === "\n") {
                    line += 1;
                }
            } else if (ext === true) {
                content();
            } else if (b[a] === "<") {
                tag("");
            } else if (b[a] === "[" && b[a + 1] === "%") {
                tag("%]");
            } else if (b[a] === "{" && (mjsx === true || mdust === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                    token[a] = token[a].replace(" ", " " + attrs[a].join(" "))
                        .replace(/(\ \/>)$/, "/>");
                }
                if (token[a] === "</prettydiffli>") {
                    if (mcorrect === true) {
                        token[a] = "</li>";
                    } else {
                        token[a] = "";
                        types[a] = "";
                    }
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
                script = function markuppretty__minify_script() {
                    token[a] = global.jspretty({
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
                style  = function markuppretty__minify_style() {
                    token[a] = global.csspretty({
                        mode   : "minify",
                        objsort: mobjsort,
                        source : token[a],
                        topcoms: mtopcomments
                    });
                    level.push("x");
                };
            for (a = 0; a < c; a += 1) {
                if (types[a] === "script") {
                    script();
                } else if (types[a] === "style") {
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
                cdataStart   = (/^(\s*(\/)*<!?\[+[A-Z]+\[+)/),
                cdataEnd     = (/((\/)*\]+>\s*)$/),
                commentStart = (/^(\s*<!--)/),
                commentEnd   = (/((\/\/)?-->\s*)$/),
                tabs         = "",
                xslline      = function markuppretty__beautify_xslline() {
                    var tname = false;
                    if (lines[a] === 2 || (types[a] !== "start" && types[a] !== "singleton") || (types[a - 1] === "comment" && lines[a - 1] === 2)) {
                        return;
                    }
                    tname = (tagName(token[a]).indexOf("xsl:") === 0);
                    if (tname === false) {
                        return;
                    }
                    if (types[a] === "start") {
                        lines[a] = 2;
                    } else if (types[a - 1] !== "start" || types[a + 1] !== "end" || (types[a - 1] !== "start" && types[a + 1] !== "end")) {
                        lines[a] = 2;
                    }
                },
                tab          = (function markuppretty__beautify_tab() {
                    var b      = msize,
                        output = [];
                    for (b = b; b > -1; b -= 1) {
                        output.push(mchar);
                    }
                    return new RegExp("^(" + output.join("") + "+)");
                }()),
                end          = function markuppretty__beautify_end() {
                    var b = 0;
                    indent -= 1;
                    if (ltype === "start" || (mjsx === true && (/^\s+\{/).test(token[a - 1]) === true && lines[a] === 0)) {
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
                                        for (b = b; b < a; b += 1) {
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
                    var list      = [],
                        source    = token[a],
                        bracetest = false,
                        jsxstart  = function markuppretty__beautify_script_jsxstart(spaces) {
                            return spaces + "{";
                        };
                    stats.script[0] += 1;
                    stats.script[1] += token[a].replace(/\s+/g, " ")
                        .length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart.exec(token[a])[0]
                            .replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart.exec(token[a])[0]
                            .replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    if (mjsx === true && source.charAt(0) === "{") {
                        source    = source.slice(1, source.length - 1);
                        bracetest = true;
                    }
                    token[a] = global.jspretty({
                        braceline   : mbraceline,
                        bracepadding: mbracepadding,
                        braces      : mbraces,
                        comments    : mcomm,
                        correct     : mcorrect,
                        inchar      : mchar,
                        inlevel     : (mstyle === "noindent")
                            ? 0
                            : indent,
                        insize      : msize,
                        methodchain : mmethodchain,
                        mode        : "beautify",
                        objsort     : mobjsort,
                        preserve    : mpreserve,
                        quoteConvert: mquoteConvert,
                        source      : source,
                        space       : mspace,
                        styleguide  : mstyleguide,
                        varword     : mvarword,
                        vertical    : (mvertical === "jsonly" || mvertical === true || mvertical === "true")
                    });
                    if (bracetest === true) {
                        if (lines[a] === 0) {
                            token[a] = "{" + token[a].replace(/^(\s+)/, "") + "}";
                        } else {
                            token[a] = token[a].replace(/^(\s+)/, jsxstart) + "}";
                        }
                    }
                    list = tab.exec(token[a]);
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
                    if (bracetest === true && lines[a] === 0) {
                        level.push("x");
                        types[a] = "singleton";
                    } else {
                        level.push(0);
                    }
                },
                style        = function markuppretty__beautify_style() {
                    var list = [];
                    stats.style[0] += 1;
                    stats.style[1] += token[a].replace(/\s+/g, " ")
                        .length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart.exec(token[a])[0]
                            .replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart.exec(token[a])[0]
                            .replace(/^\s+/, "") + "\n";
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    token[a] = global.csspretty({
                        comm          : mcomm,
                        cssinsertlines: mcssinsertlines,
                        inchar        : mchar,
                        inlevel       : (mstyle === "noindent")
                            ? 0
                            : indent,
                        insize        : msize,
                        mode          : "beautify",
                        objsort       : mobjsort,
                        source        : token[a],
                        vertical      : (mvertical === true || mvertical === "true")
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
                    xslline();
                } else if (types[a] === "template_start") {
                    level.push(indent);
                    indent            += 1;
                    stats.template[0] += 1;
                    stats.template[1] += token[a].length;
                } else if (types[a] === "template_else") {
                    indent -= 1;
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
                    if (types[a] === "content" && mtextpreserve === true) {
                        level.push("x");
                    } else {
                        content();
                    }
                    xslline();
                    stats[types[a]][0] += 1;
                    stats[types[a]][1] += token[a].length;
                } else if (types[a] === "script") {
                    stats.script[0] += 1;
                    stats.script[1] += token[a].length;
                    script();
                } else if (types[a] === "style") {
                    stats.style[0] += 1;
                    stats.style[1] += token[a].length;
                    style();
                } else if (types[a] === "comment" && mcomm === "noindent") {
                    level.push(0);
                    stats.comment[0] += 1;
                    stats.comment[1] += token[a].length;
                } else {
                    level.push(indent);
                    stats[types[a]][0] += 1;
                    stats[types[a]][1] += token[a].length;
                    xslline();
                }
                ltype = types[a];
                lline = lines[a];
            }
            level[0] = 0;
        }());
    }

    return (function markuppretty__apply() {
        var a            = 0,
            c            = level.length,
            build        = [],
            output       = "",
            //tab builds out the character sequence for one step of indentation
            tab          = (function markuppretty__apply_tab() {
                var aa   = 0,
                    ind  = [mchar],
                    size = msize - 1;
                for (aa = 0; aa < size; aa += 1) {
                    ind.push(mchar);
                }
                return ind.join("");
            }()),
            //a new line character plus the correct amount//of identation for the given line
            //of code
            nl           = function markuppretty__apply_nl(ind, item) {
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
            wrap         = function markuppretty__apply_wrap() {
                var b        = 0,
                    len      = 0,
                    xlen     = 0,
                    list     = attrs[a],
                    lev      = level[a],
                    atty     = "",
                    string   = "",
                    content  = [],
                    wordslen = 0;
                if (lev === "x") {
                    b = a;
                    do {
                        b    -= 1;
                        lev  = level[b];
                        xlen += token[b].length;
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
                        token[a] = token[a].replace(" ", " " + atty)
                            .replace(/(\ \/>)$/, "/>");
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
                    token[a] = content.join("")
                        .replace(/(\ \/>)$/, "/>");
                } else {
                    list = token[a].split(" ");
                    len  = list.length;
                    if (level[a] === "x" && types[a - 1] === "end") {
                        b   = a - 1;
                        lev = 1;
                        do {
                            b -= 1;
                            if (types[b] === "start") {
                                lev -= 1;
                            } else if (types[b] === "end") {
                                lev += 1;
                            }
                        } while (lev > 0 && b > 0);
                        lev = level[b];
                    }
                    for (b = 0; b < len; b += 1) {
                        string = string + list[b];
                        if (list[b + 1] !== undefined && string.length + list[b + 1].length + 1 > mwrap - xlen) {
                            content.push(string);
                            xlen = 0;
                            if (level[a] === "x" && types[a - 1] !== "end") {
                                nl(lev + 1, content);
                            } else {
                                nl(lev, content);
                            }
                            string = "";
                        } else {
                            string = string + " ";
                        }
                    }
                    content.push(string.replace(/\s$/, ""));
                    if (content.length > 0 && content[content.length - 1].charAt(0) === "\n") {
                        content.pop();
                    }
                    token[a] = content.join("")
                        .replace(/(\ \/>)$/, "/>");
                }
            },
            //JSX tags may contain comments, which are captured as
            //attributes in this parser.  These attributes demand
            //unique care to be correctly applied.
            attrcom      = function markuppretty__apply_attrcom() {
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
            },
            jsxattribute = function markuppretty__apply_jsxattribute() {
                var attr    = attrs[a],
                    b       = 0,
                    x       = attr.length,
                    value   = [],
                    inlevel = minlevel + level[a];
                if (level[a] === "x") {
                    inlevel = minlevel;
                } else if (level[a] > 0) {
                    inlevel = level[a];
                }
                for (b = 0; b < x; b += 1) {
                    value = attrName(attr[b]);
                    if (value[1].charAt(0) === "{") {
                        value[1]    = global.jspretty({
                            braceline   : mbraceline,
                            bracepadding: mbracepadding,
                            braces      : mbraces,
                            comments    : mcomm,
                            correct     : mcorrect,
                            inchar      : mchar,
                            inlevel     : inlevel,
                            insize      : msize,
                            methodchain : mmethodchain,
                            mode        : "beautify",
                            objsort     : mobjsort,
                            preserve    : mpreserve,
                            quoteConvert: mquoteConvert,
                            source      : value[1].slice(1, value[1].length - 1),
                            space       : mspace,
                            styleguide  : mstyleguide,
                            varword     : mvarword,
                            vertical    : (mvertical === "jsonly" || mvertical === true || mvertical === "true")
                        });
                        attrs[a][b] = value[0] + "={" + value[1].replace(/^\s+/, "") + "}";
                    }
                }
            };
        for (a = 0; a < c; a += 1) {
            if (mjsx === true && attrs[a].length > 0) {
                jsxattribute();
            }
            if (jscom[a] === true) {
                attrcom();
            } else if (((types[a] === "content" && mwrap > 0 && token[a].length > mwrap) || attrs[a].length > 0) && mmode === "beautify") {
                wrap();
            } else if (attrs[a].length > 0) {
                token[a] = token[a].replace(" ", " " + attrs[a].join(" "))
                    .replace(/(\ \/>)$/, "/>");
            } else if (types[a] === "singleton") {
                token[a] = token[a].replace(/(\ \/>)$/, "/>");
            }
            if (token[a] === "</prettydiffli>" && mcorrect === true) {
                token[a] = "</li>";
            }
            if (types[a] === "singleton" && mspaceclose === true) {
                token[a] = token[a].replace(/(\/>)$/, " />");
            }
            if (token[a] !== "</prettydiffli>") {
                if (isNaN(level[a]) === false) {
                    if (mmode === "minify") {
                        build.push(" ");
                    } else {
                        nl(level[a], build);
                    }
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
            global.report = (function markuppretty__apply_summary() {
                var len           = token.length,
                    sum           = [],
                    startend      = stats.start[0] - stats.end[0],
                    violations    = 0,
                    binfix        = (/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f|\ufffd/g),
                    numformat     = function markuppretty__apply_summary_numformat(x) {
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
                    analysis      = function markuppretty__apply_summary_analysis(arr) {
                        var x       = arr.length,
                            idtest  = (arr === ids),
                            y       = 0,
                            data    = [],
                            content = [];
                        if (x > 0) {
                            arr = global.safeSort(arr);
                            for (y = 0; y < x; y += 1) {
                                if (arr[y] === arr[y + 1]) {
                                    if (idtest === true && (data.length === 0 || data[data.length - 1][1] !== arr[y])) {
                                        data.push([2, arr[y]]);
                                    }
                                    if (data.length > 0) {
                                        data[data.length - 1][0] += 1;
                                    }
                                } else if (idtest === false) {
                                    data.push([1, arr[y]]);
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
                                if (idtest === true && data[y][0] > 1) {
                                    violations += (data[y][0] - 1);
                                }
                                content.push("<li>");
                                content.push(data[y][0]);
                                content.push("x - ");
                                content.push(data[y][1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                content.push("</li>");
                            }
                            content.push("</ul>");
                            return content.join("");
                        }
                        return "";
                    },
                    accessibility = (function markuppretty__apply_summary_accessibility() {
                        var findings   = [],
                            tagsbyname = function markuppretty__apply_summary_accessibility_tagsbyname() {
                                var b              = 0,
                                    x              = 0,
                                    y              = 0,
                                    z              = 0,
                                    tagname        = "",
                                    alttest        = false,
                                    id             = false,
                                    fortest        = false,
                                    attr           = [],
                                    noalt          = [],
                                    emptyalt       = [],
                                    headings       = [],
                                    headtest       = (/^(h\d)$/),
                                    presentationEl = [],
                                    presentationAt = [],
                                    tabindex       = [],
                                    formnoID       = [],
                                    formID         = [],
                                    labelFor       = [],
                                    nofor          = [];
                                for (b = 0; b < c; b += 1) {
                                    tagname = tagName(token[b]);
                                    if ((types[b] === "start" || types[b] === "singleton") && (tagname === "font" || tagname === "center" || tagname === "basefont" || tagname === "b" || tagname === "i" || tagname === "u" || tagname === "small" || tagname === "big" || tagname === "blink" || tagname === "plaintext" || tagname === "spacer" || tagname === "strike" || tagname === "tt" || tagname === "xmp")) {
                                        presentationEl.push(b);
                                    } else {
                                        if (types[b] === "start" && headtest.test(tagname) === true) {
                                            z = Number(tagname.charAt(1));
                                            if (headings.length > 0 && z - headings[headings.length - 1][1] > 1) {
                                                violations += 1;
                                                headings.push([b, z, true]);
                                            } else {
                                                headings.push([b, z, false]);
                                            }
                                        }
                                        y = attrs[b].length;
                                        for (x = 0; x < y; x += 1) {
                                            attr = attrName(attrs[b][x]);
                                            if (attr[0] === "alt" && tagname === "img") {
                                                alttest = true;
                                                if (attr[1] === "") {
                                                    emptyalt.push(b);
                                                }
                                            }
                                            if (tagname === "label" && attr[0] === "for") {
                                                labelFor.push(attr[1]);
                                                fortest = true;
                                            } else if (tagname === "select" || tagname === "input" || tagname === "textarea") {
                                                if (attr[0] === "id" || (attr[0] === "type" && (attr[1].toLowerCase() === "hidden" || attr[1].toLowerCase() === "submit"))) {
                                                    id = true;
                                                    if (attr[0] === "id") {
                                                        formID.push([b, x]);
                                                    }
                                                }
                                            }
                                            if (presentationEl[presentationEl.length - 1] !== b && (attr[0] === "alink" || attr[0] === "align" || attr[0] === "background" || attr[0] === "border" || attr[0] === "color" || attr[0] === "compact" || attr[0] === "face" || attr[0] === "height" || attr[0] === "language" || attr[0] === "link" || (attr[0] === "name" && tagname !== "meta" && tagname !== "iframe" && tagname !== "select" && tagname !== "input" && tagname !== "textarea") || attr[0] === "nowrap" || attr[0] === "size" || attr[0] === "start" || attr[0] === "text" || (attr[0] === "type" && tagname !== "script" && tagname !== "style" && tagname !== "input") || (attr[0] === "value" && tagname !== "input" && tagname !== "option" && tagname !== "textarea") || attr[0] === "version" || attr[0] === "vlink" || attr[0] === "width")) {
                                                presentationAt.push([b, x]);
                                            }
                                            if (attr[0] === "tabindex") {
                                                if (isNaN(Number(attr[1])) === true || Number(attr[1]) > 0) {
                                                    tabindex.push([b, true]);
                                                } else {
                                                    tabindex.push([b, false]);
                                                }
                                            }
                                        }
                                        if (fortest === true) {
                                            fortest = false;
                                        } else if (tagname === "label") {
                                            nofor.push(b);
                                        }
                                        if (id === true) {
                                            id = false;
                                        } else if (tagname === "select" || tagname === "input" || tagname === "textarea") {
                                            formnoID.push(b);
                                        }
                                        if (alttest === true) {
                                            alttest = false;
                                        } else if (tagname === "img") {
                                            noalt.push(b);
                                        }
                                    }
                                }
                                attr       = [];
                                //obsolete tags
                                b          = presentationEl.length;
                                violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> obsolete HTML tag");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push("</h4> <p>Obsolete elements do not appropriately describe content.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[presentationEl[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[presentationEl[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> obsolete HTML tags</h4>");
                                }
                                //obsolete attributes
                                b = presentationAt.length;
                                if (b > 0) {
                                    z = 0;
                                    attr.push("<h4><strong>");
                                    y = attr.length;
                                    attr.push("</strong> HTML tag");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" containing obsolete or inappropriate attributes</h4> <p>Obsolete elements do no" +
                                            "t appropriately describe content.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        tagname = token[presentationAt[x][0]].replace(/&/g, "&amp;")
                                            .replace(/</g, "&lt;")
                                            .replace(/>/g, "&gt;")
                                            .replace(attrs[presentationAt[x][0]][presentationAt[x][1]], "<strong>" + attrs[presentationAt[x][0]][presentationAt[x][1]] + "</strong>");
                                        if (x < b - 1 && presentationAt[x][0] === presentationAt[x + 1][0]) {
                                            do {
                                                tagname = tagname.replace(attrs[presentationAt[x][0]][presentationAt[x + 1][1]], "<strong>" + attrs[presentationAt[x][0]][presentationAt[x + 1][1]] + "</strong>");
                                                x       += 1;
                                            } while (x < b - 1 && presentationAt[x][0] === presentationAt[x + 1][0]);
                                        }
                                        z += 1;
                                        attr.push("<li><code>");
                                        attr.push(tagname);
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[presentationAt[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.splice(y, 0, z);
                                    violations += z;
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> HTML tags containing obsolete or inappropriate attributes" +
                                            "</h4>");
                                }
                                //form controls missing a required 'id' attribute
                                b          = formnoID.length;
                                violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> form control element");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" missing a required <em>id</em> attribute</h4> <p>The id attribute is required t" +
                                            "o bind a point of interaction to an HTML label.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[formnoID[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[formnoID[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> form control elements missing a required <em>id</em> attr" +
                                            "ibute</h4> <p>The id attribute is required to bind a point of interaction to an " +
                                            "HTML label.</p>");
                                }
                                //form controls missing a binding to a label
                                b        = formID.length;
                                formnoID = [];
                                for (x = 0; x < b; x += 1) {
                                    for (y = labelFor.length - 1; y > -1; y -= 1) {
                                        if (attrName(attrs[formID[x][0]][formID[x][1]])[1] === labelFor[y]) {
                                            break;
                                        }
                                    }
                                    if (y < 0) {
                                        formnoID.push(formID[x]);
                                    }
                                }
                                b          = formnoID.length;
                                violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> form control element");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" not bound to a label</h4> <p>The <em>id</em> of a form control must match the <" +
                                            "em>for</em> of a label.</p><ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[formnoID[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[formnoID[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> form control elements not bound to a label</h4> <p>The <e" +
                                            "m>id</em> of a form control must match the <em>for</em> of a label.</p>");
                                }
                                //elements with tabindex
                                b          = tabindex.length;
                                violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> element");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" with a <em>tabindex</em> attribute</h4> <p>The tabindex attribute should have a" +
                                            " 0 or -1 value and should not be over used.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        if (tabindex[x][1] === true) {
                                            attr.push("<strong>");
                                        }
                                        attr.push(token[tabindex[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        if (tabindex[x][1] === true) {
                                            attr.push("</strong>");
                                        }
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[tabindex[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> elements with a <em>tabindex</em> attribute</h4> <p>The t" +
                                            "abindex attribute should have a 0 or -1 value and should not be over used.</p>");
                                }
                                //headings
                                b = headings.length;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> HTML heading tag");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" and their order</h4> <p>Poorly ordered tags are described with a <strong>strong" +
                                            "</strong> tag (color red).</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        if (headings[x][2] === true) {
                                            attr.push("<strong>");
                                        }
                                        attr.push(token[headings[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        if (headings[x][2] === true) {
                                            attr.push("</strong>");
                                        }
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[headings[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> HTML heading elements</h4>");
                                }
                                //missing alt attributes on images
                                b          = noalt.length;
                                violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> image");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" missing a required <em>alt</em> attribute</h4> <p>The alt attribute is required" +
                                            " even if it contains no value.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[noalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[noalt[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> images missing a required <em>alt</em> attribute</h4> <p>" +
                                            "The alt attribute is required even if it contains no value.</p>");
                                }
                                //alt attributes with empty values
                                b          = emptyalt.length;
                                violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> image");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" have an empty <em>alt</em> attribute value</h4> <p>Empty alt text is not necess" +
                                            "arily a violation, such as the case of tracking pixels. If an image has embedded");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[emptyalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[emptyalt[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> images have an empty <em>alt</em> attribute value</h4>");
                                }

                                return attr.join("");
                            };
                        if (maccessibility === false) {
                            return "";
                        }
                        findings.push(tagsbyname());
                        return findings.join("");
                    }()),
                    parseErrors   = (function markuppretty__apply_summary_parseErrors() {
                        var x     = parseError.length,
                            y     = 0,
                            fails = [];
                        violations += x;
                        if (x === 0) {
                            return "";
                        }
                        fails.push("<h4><strong>");
                        fails.push(x);
                        fails.push("</strong> errors interpreting markup</h4> <ol>");
                        for (y = 0; y < x; y += 1) {
                            fails.push("<li>");
                            fails.push(parseError[y].replace(binfix, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace("element: ", "element: <code>"));
                            fails.push("</code></li>");
                        }
                        fails.push("</ol>");
                        return fails.join("");
                    }()),
                    sizes         = (function markuppretty__apply_summary_sizes() {
                        var table      = [],
                            insize     = msource.length,
                            outlines   = output.split("\n")
                                .length,
                            outsize    = output.length,
                            linechange = (outlines / line) * 100,
                            charchange = (outsize / insize) * 100;
                        table.push("<h4>Data sizes</h4>");
                        table.push("<table class='analysis' summary='Data sizes'><caption>This table shows changes i" +
                                "n sizes of the data due to beautification.</caption>");
                        table.push("<thead><tr><th>Data figure</th><th>Input</th><th>Output</th><th>Percent change</" +
                                "th></tr></thead><tbody>");
                        table.push("<tr><th>Lines of code</th><td>");
                        table.push(numformat(line));
                        table.push("</td><td>");
                        table.push(numformat(outlines));
                        table.push("</td><td>");
                        table.push(linechange.toFixed(2));
                        table.push("%</td></tr>");
                        table.push("<tr><th>Character size</th><td>");
                        table.push(numformat(insize));
                        table.push("</td><td>");
                        table.push(numformat(outsize));
                        table.push("</td><td>");
                        table.push(charchange.toFixed(2));
                        table.push("%</td></tr>");
                        table.push("</tbody></table>");
                        return table.join("");
                    }()),
                    statistics    = (function markuppretty__apply_summary_statistics() {
                        var stat       = [],
                            totalItems = stats.cdata[0] + stats.comment[0] + stats.content[0] + stats.end[0] + stats.ignore[0] + stats.script[0] + stats.sgml[0] + stats.singleton[0] + stats.start[0] + stats.style[0] + stats.template[0] + stats.text[0] + stats.xml[0],
                            totalSizes = stats.cdata[1] + stats.comment[1] + stats.content[1] + stats.end[1] + stats.ignore[1] + stats.script[1] + stats.sgml[1] + stats.singleton[1] + stats.start[1] + stats.style[1] + stats.template[1] + stats.text[1] + stats.xml[1],
                            rowBuilder = function markuppretty__apply_summary_statistics_rowBuilder(type) {
                                var itema = (type === "Total*")
                                        ? totalItems
                                        : stats[type][0],
                                    itemb = (type === "Total*")
                                        ? totalSizes
                                        : stats[type][1],
                                    ratio = 0;
                                stat.push("<tr><th>");
                                stat.push(type);
                                if (itema > 0 && (type === "script" || type === "style")) {
                                    stat.push("**");
                                }
                                stat.push("</th><td");
                                if (startend !== 0 && (type === "start" || type === "end")) {
                                    stat.push(" class=\"bad\"");
                                }
                                stat.push(">");
                                stat.push(itema);
                                stat.push("</td><td>");
                                ratio = ((itema / totalItems) * 100);
                                stat.push(ratio.toFixed(2));
                                stat.push("%</td><td>");
                                stat.push(itemb);
                                stat.push("</td><td");
                                if (itema > 0 && (type === "script" || type === "style")) {
                                    stat.push(" class='bad'");
                                }
                                stat.push(">");
                                ratio = ((itemb / totalSizes) * 100);
                                stat.push(ratio.toFixed(2));
                                stat.push("%</td></tr>");
                            };
                        stat.push("<h4>Statistics and analysis of parsed code</h4>");
                        stat.push("<table class='analysis' summary='Statistics'><caption>This table provides basic " +
                                "statistics about the parsed components of the given code sample after beautifica" +
                                "tion.</caption>");
                        stat.push("<thead><tr><th>Item type</th><th>Number of instances</th><th>Percentage of total" +
                                " items</th><th>Character size</th><th>Percentage of total size</th></tr></thead>");
                        stat.push("<tbody>");
                        rowBuilder("Total*");
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
                        stat.push("<tr><th>space between tags***</th><td colspan='4'>");
                        stat.push(stats.space);
                        stat.push("</td></tr>");
                        stat.push("</tbody></table> ");
                        stat.push("<p>* Totals are accounted for parsed code/content tokens only and not extraneous" +
                                " space for beautification.</p> ");
                        stat.push("<p>** Script and Style code is measured with minimal white space.</p>");
                        stat.push("<p>*** This is space that is not associated with text, tags, script, or css.</p>" +
                                " ");
                        return stat.join("");
                    }()),
                    zipf          = (function markuppretty__apply_summary_zipf() {
                        var x          = 0,
                            ratio      = 0,
                            wordlen    = 0,
                            wordcount  = 0,
                            word       = "",
                            wordlist   = [],
                            wordtotal  = [],
                            wordproper = [],
                            zipfout    = [],
                            identical  = true,
                            sortchild  = function markuppretty__apply_summary_zipf_sortchild(y, z) {
                                return z[0] - y[0];
                            };
                        for (x = x; x < len; x += 1) {
                            if (types[x] === "content") {
                                wordlist.push(token[x]);
                            }
                        }
                        wordlist = global.safeSort(wordlist.join(" ").replace(binfix, "").toLowerCase().replace(/&nbsp;/gi, " ").replace(/(,|\.|\?|!|:|\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").split(" "));
                        wordlen  = wordlist.length;
                        for (x = 0; x < wordlen; x += 1) {
                            word = wordlist[x];
                            if (word.length > 2 && word.length < 30 && (/&#?\w+;/).test(word) === false && word !== "the" && word !== "and" && word !== "for" && word !== "are" && word !== "this" && word !== "from" && word !== "with" && word !== "that" && word !== "to") {
                                if (wordproper.length === 0 || word !== wordproper[wordproper.length - 1][1]) {
                                    wordproper.push([1, word]);
                                } else {
                                    wordproper[wordproper.length - 1][0] += 1;
                                }
                            }
                            if (word !== wordlist[x - 1]) {
                                wordtotal.push([1, word]);
                            } else {
                                wordtotal[wordtotal.length - 1][0] += 1;
                            }
                        }
                        wordtotal  = wordtotal.sort(sortchild)
                            .slice(0, 11);
                        wordproper = wordproper.sort(sortchild)
                            .slice(0, 11);
                        wordlen    = (wordproper.length > 10)
                            ? 11
                            : wordproper.length;
                        for (x = 0; x < wordlen; x += 1) {
                            if (wordtotal[x][1] !== wordproper[x][1]) {
                                identical = false;
                                break;
                            }
                        }
                        wordlen = (wordtotal.length > 10)
                            ? 10
                            : wordtotal.length;
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
                                ratio = (wordtotal[x + 1] !== undefined)
                                    ? (wordtotal[x][0] / wordtotal[x + 1][0])
                                    : 1;
                                zipfout.push("<tr><td>");
                                zipfout.push(x + 1);
                                zipfout.push("</td><td>");
                                zipfout.push(wordtotal[x][1]);
                                zipfout.push("</td><td>");
                                zipfout.push(wordtotal[x][0]);
                                zipfout.push("</td><td>");
                                zipfout.push(ratio.toFixed(2));
                                zipfout.push("</td><td>");
                                ratio = ((wordtotal[x][0] / wordcount) * 100);
                                zipfout.push(ratio.toFixed(2));
                                zipfout.push("%</td></tr>");
                            }
                            wordlen = (wordproper.length > 10)
                                ? 10
                                : wordproper.length;
                            if (wordlen > 1 && identical === false) {
                                zipfout.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                for (x = 0; x < wordlen; x += 1) {
                                    ratio = (wordproper[x + 1] !== undefined)
                                        ? (wordproper[x][0] / wordproper[x + 1][0])
                                        : 1;
                                    zipfout.push("<tr><td>");
                                    zipfout.push(x + 1);
                                    zipfout.push("</td><td>");
                                    zipfout.push(wordproper[x][1]);
                                    zipfout.push("</td><td>");
                                    zipfout.push(wordproper[x][0]);
                                    zipfout.push("</td><td>");
                                    zipfout.push(ratio.toFixed(2));
                                    zipfout.push("</td><td>");
                                    ratio = ((wordproper[x][0] / wordcount) * 100);
                                    zipfout.push(ratio.toFixed(2));
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
                sum.push("<p><strong>Total number of HTTP requests (presuming HTML or XML Schema):</strong" +
                        "> <em>");
                sum.push(reqs.length);
                sum.push("</em></p>");
                sum.push("<div class='doc'>");
                sum.push(analysis(ids));
                sum.push(sizes);
                sum.push(parseErrors);
                sum.push(accessibility);
                sum.push(statistics);
                sum.push(analysis(reqs));
                sum.push(zipf);
                sum.push("</div>");
                if (maccessibility === true) {
                    return sum.join("")
                        .replace("<div class='doc'>", "<p><strong>Total potential accessibility violations:</strong> <em>" + violations + "</em></p> <div class='doc'>");
                }
                return sum.join("");
            }());
        }
        return output;
    }());
};
if (typeof require === "function" && typeof ace !== "object") {
    (function glib_markuppretty() {
        "use strict";
        var localPath = (typeof process === "object" && process.cwd() === "/" && typeof __dirname === "string")
            ? __dirname
            : ".";
        if (global.csspretty === undefined) {
            global.csspretty = require(localPath + "/csspretty.js").api;
        }
        if (global.jspretty === undefined) {
            global.jspretty = require(localPath + "/jspretty.js").api;
        }
        if (global.safeSort === undefined) {
            global.safeSort = require(localPath + "/safeSort.js").api;
        }
    }());
} else {
    if (typeof csspretty === "function") {
        global.csspretty = csspretty;
    }
    if (typeof jspretty === "function") {
        global.jspretty = jspretty;
    }
    if (typeof safeSort === "function") {
        global.safeSort = safeSort;
    }
}
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api     = function commonjs(x) {
        "use strict";
        return markuppretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api     = function requirejs_export(x) {
            return markuppretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
