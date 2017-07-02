/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*jshint laxbreak: true*/
/*global __dirname, ace, define, global, module, process, require*/
/***********************************************************************
 markuppretty is written by Austin Cheney on 20 Jun 2015.

 Please see the license.txt file associated with the Pretty Diff
 application for license information.
 **********************************************************************/
/* A simple parser for XML, HTML, and a variety of template schemes. It
 beautifies, minifies, and peforms a series of analysis*/
(function markuppretty_init() {
    "use strict";
    var markuppretty = function markuppretty_(options) {
        var safeSort    = global.prettydiff.safeSort,
            output      = "",
            stats       = {
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
                xml        : [0, 0]
            },

            //parallel arrays
            // * attrs is a list of arrays, each of which contains (if any) parsed
            // attributes
            // * begin stores the index of the current token's parent element
            // * daddy stores the tag name of the parent element
            // * jscom stores true/false if the current token is a JS comment from JSX
            // format
            // * level describes the indentation of a given token level is only used in
            // beautify and diff modes
            // * linen stores the input line number on which the token occurs
            // * lines describes the preceeding space using: 2, 1, or 0 lines is populated
            // in markuppretty__tokenize_spacer
            // * presv whether a given token should be preserved as provided
            // * token stores parsed tokens
            // * types segments tokens into named groups
            // * value attribute value if current type is attribute and
            // options.attributetoken is true
            attrs       = [],
            jscom       = [],
            level       = [],
            linen       = [],
            lines       = [],
            token       = [],
            types       = [],
            presv       = [],
            daddy       = [],
            begin       = [],
            value       = [],
            reqs        = [],
            ids         = [],
            parseError  = [],
            parent      = [
                ["none", -1]
            ],
            line        = 1,
            wrap        = options.wrap,
            objsortop   = false,
            globalerror = "",
            lf          = (options.crlf === true || options.crlf === "true")
                ? "\r\n"
                : "\n",
            sourceSize  = options.source.length,
            extlib      = function markuppretty__extlib(type) {
                var result = "",
                    newline = options.newline;
                if (type === "script" && typeof global.prettydiff.jspretty !== "function") {
                    return options.source;
                }
                if (type === "style" && typeof global.prettydiff.csspretty !== "function") {
                    return options.source;
                }
                options.newline = false;
                result = (type === "script")
                    ? global
                        .prettydiff
                        .jspretty(options)
                    : global
                        .prettydiff
                        .csspretty(options);
                options.newline = newline;
                if (options.nodeasync === true) {
                    if (globalerror === "") {
                        globalerror = result[1];
                    }
                    if (options.mode === "parse") {
                        if (options.parseFormat === "htmltable") {
                            if (type === "script") {
                                return result[0]
                                    .data
                                    .replace(
                                        "<thead>",
                                        "<thead><tr><th colspan=\"6\" class=\"nested\">JavaScript tokens</th></tr>"
                                    );
                            }
                            return result[0]
                                .data
                                .replace(
                                    "<thead>",
                                    "<thead><tr><th colspan=\"4\" class=\"nested\">CSS tokens</th></tr>"
                                );
                        }
                        return result[0].data;
                    }
                    return result[0];
                }
                if (options.mode === "parse") {
                    if (options.parseFormat === "htmltable") {
                        if (type === "script") {
                            return result
                                .data
                                .replace(
                                    "<thead>",
                                    "<thead><tr><th colspan=\"6\" class=\"nested\">JavaScript tokens</th></tr>"
                                );
                        }
                        return result
                            .data
                            .replace(
                                "<thead>",
                                "<thead><tr><th colspan=\"4\" class=\"nested\">CSS tokens</th></tr>"
                            );
                    }
                    return result.data;
                }
                return result;
            },
            //What is the lowercase tag name of the provided token?
            tagName     = function markuppretty__tagName(el) {
                var space = el
                        .replace(/^(\{((%-?)|\{-?)\s*)/, "%")
                        .replace(/\s+/, " ")
                        .indexOf(" "),
                    name  = (space < 0)
                        ? el
                            .replace(/^(\{((%-?)|\{-?)\s*)/, " ")
                            .slice(1, el.length - 1)
                            .toLowerCase()
                        : el
                            .replace(/^(\{((%-?)|\{-?)\s*)/, " ")
                            .slice(1, space)
                            .toLowerCase();
                name = name.replace(/(\}\})$/, "");
                if (name.indexOf("(") > 0) {
                    name = name.slice(0, name.indexOf("("));
                }
                return name;
            };

        (function markuppretty__options() {
            objsortop      = (
                options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "markup"
            );
            options.source = (
                typeof options.source === "string" && options.source.length > 0
            )
                ? options
                    .source
                    .replace(/\r\n?/g, "\n")
                : "Error: no source code supplied to markuppretty!";
            if (options.mode === "analysis") {
                options.accessibility = true;
            }
        }());
        //type definitions:
        // * start      end     type
        // * <![CDATA[   ]]>    cdata
        // * <!--       -->     comment
        // * <#--       -->     comment
        // * <%--       --%>    comment
        // * {!         !}      comment
        // * <!--[if    -->     conditional
        // * text       text    content
        // * </         >       end
        // * <pre       </pre>  ignore (html only)
        // * text       text    script
        // * <!         >       sgml
        // * <          />      singleton
        // * <          >       start
        // * text       text    style
        // * <!--#      -->     template
        // * <%         %>      template
        // * {{{        }}}     template
        // * {{         }}      template
        // * {%         %}      template
        // * [%         %]      template
        // * {@         @}      template
        // * {#         #}      template
        // * {#         /}      template
        // * {?         /}      template
        // * {^         /}      template
        // * {@         /}      template
        // * {<         /}      template
        // * {+         /}      template
        // * {~         }       template
        // * <?         ?>      template
        // * {:else}            template_else
        // * <#else     >       template_else
        // * {@}else{@}         template_else
        // * <%}else{%>         template_else
        // * {{         }}      template_end
        // * <%\s*}     %>      template_end
        // * [%\s*}     %]      template_end
        // * {@\s*}     @}      template_end
        // * {          }       template_end
        // * {{#        }}      template_start
        // * <%         {\s*%>  template_start
        // * [%         {\s*%]  template_start
        // * {@         {\s*@}  template_start
        // * {#         }       template_start
        // * {?         }       template_start
        // * {^         }       template_start
        // * {@         }       template_start
        // * {<         }       template_start
        // * {+         }       template_start
        // * <?xml      ?>      xml
        if (options.mode !== "diff") {
            options.content = false;
        }
        if (options.jsx === true) {
            options.dustjs = false;
        }
        (function markuppretty__tokenize() {
            var a             = 0,
                b             = options
                    .source
                    .split(""),
                c             = b.length,
                minspace      = "",
                space         = "",
                list          = 0,
                litag         = 0,
                linepreserve  = 0,
                cftransaction = false,
                sgmlflag      = 0,
                ext           = false,
                //cftags is a list of supported coldfusion tags
                //* required - means must have a separate matching end tag
                // * optional - means the tag could have a separate end tag, but is probably a
                // singleton
                //* prohibited - means there is not corresponding end tag
                cftags        = {
                    cfabort               : "prohibited",
                    cfajaximport          : "optional",
                    cfajaxproxy           : "optional",
                    cfapplet              : "prohibited",
                    cfapplication         : "prohibited",
                    cfargument            : "prohibited",
                    cfassociate           : "prohibited",
                    cfauthenticate        : "prohibited",
                    cfbreak               : "prohibited",
                    cfcache               : "optional",
                    cfcalendar            : "optional",
                    cfcase                : "required",
                    cfcatch               : "required",
                    cfchart               : "optional",
                    cfchartdata           : "prohibited",
                    cfchartseries         : "optional",
                    cfclient              : "required",
                    cfclientsettings      : "optional",
                    cfcol                 : "prohibited",
                    cfcollection          : "prohibited",
                    cfcomponent           : "required",
                    cfcontent             : "optional",
                    cfcontinue            : "prohibited",
                    cfcookie              : "prohibited",
                    cfdbinfo              : "prohibited",
                    cfdefaultcase         : "required",
                    cfdirectory           : "prohibited",
                    cfdiv                 : "optional",
                    cfdocument            : "optional",
                    cfdocumentitem        : "optional",
                    cfdocumentsection     : "optional",
                    cfdump                : "optional",
                    cfelse                : "prohibited",
                    cfelseif              : "prohibited",
                    cferror               : "prohibited",
                    cfexchangecalendar    : "optional",
                    cfexchangeconnection  : "optional",
                    cfexchangecontact     : "optional",
                    cfexchangeconversation: "optional",
                    cfexchangefilter      : "optional",
                    cfexchangefolder      : "optional",
                    cfexchangemail        : "optional",
                    cfexchangetask        : "optional",
                    cfexecute             : "required",
                    cfexit                : "prohibited",
                    cffeed                : "prohibited",
                    cffile                : "optional",
                    cffileupload          : "optional",
                    cffinally             : "required",
                    cfflush               : "prohibited",
                    cfform                : "required",
                    cfformgroup           : "required",
                    cfformitem            : "optional",
                    cfforward             : "prohibited",
                    cfftp                 : "prohibited",
                    cffunction            : "required",
                    cfgraph               : "required",
                    cfgraphdata           : "prohibited",
                    cfgrid                : "required",
                    cfgridcolumn          : "optional",
                    cfgridrow             : "optional",
                    cfgridupdate          : "optional",
                    cfheader              : "prohibited",
                    cfhtmlbody            : "optional",
                    cfhtmlhead            : "optional",
                    cfhtmltopdf           : "optional",
                    cfhtmltopdfitem       : "optional",
                    cfhttp                : "optional",
                    cfhttpparam           : "prohibited",
                    cfif                  : "required",
                    cfimage               : "prohibited",
                    cfimap                : "prohibited",
                    cfimapfilter          : "optional",
                    cfimport              : "prohibited",
                    cfinclude             : "prohibited",
                    cfindex               : "prohibited",
                    cfinput               : "prohibited",
                    cfinsert              : "prohibited",
                    cfinterface           : "required",
                    cfinvoke              : "optional",
                    cfinvokeargument      : "prohibited",
                    cflayout              : "optional",
                    cflayoutarea          : "optional",
                    cfldap                : "prohibited",
                    cflocation            : "prohibited",
                    cflock                : "required",
                    cflog                 : "prohibited",
                    cflogic               : "required",
                    cfloginuser           : "prohibited",
                    cflogout              : "prohibited",
                    cfloop                : "required",
                    cfmail                : "required",
                    cfmailparam           : "prohibited",
                    cfmailpart            : "required",
                    cfmap                 : "optional",
                    cfmapitem             : "optional",
                    cfmediaplayer         : "optional",
                    cfmenu                : "required",
                    cfmenuitem            : "optional",
                    cfmessagebox          : "optional",
                    cfmodule              : "optional",
                    cfNTauthenticate      : "optional",
                    cfoauth               : "optional",
                    cfobject              : "prohibited",
                    cfobjectcache         : "prohibited",
                    cfoutput              : "required",
                    cfpageencoding        : "optional",
                    cfparam               : "prohibited",
                    cfpdf                 : "optional",
                    cfpdfform             : "optional",
                    cfpdfformparam        : "optional",
                    cfpdfparam            : "prohibited",
                    cfpdfsubform          : "required",
                    cfpod                 : "optional",
                    cfpop                 : "prohibited",
                    cfpresentation        : "required",
                    cfpresentationslide   : "optional",
                    cfpresenter           : "optional",
                    cfprint               : "optional",
                    cfprocessingdirective : "optional",
                    cfprocparam           : "prohibited",
                    cfprocresult          : "prohibited",
                    cfprogressbar         : "optional",
                    cfproperty            : "prohibited",
                    cfquery               : "required",
                    cfqueryparam          : "prohibited",
                    cfregistry            : "prohibited",
                    cfreport              : "optional",
                    cfreportparam         : "optional",
                    cfrethrow             : "prohibited",
                    cfretry               : "prohibited",
                    cfreturn              : "prohibited",
                    cfsavecontent         : "required",
                    cfschedule            : "prohibited",
                    cfscript              : "required",
                    cfsearch              : "prohibited",
                    cfselect              : "required",
                    cfservlet             : "prohibited",
                    cfservletparam        : "prohibited",
                    cfset                 : "prohibited",
                    cfsetting             : "optional",
                    cfsharepoint          : "optional",
                    cfsilent              : "required",
                    cfsleep               : "prohibited",
                    cfslider              : "prohibited",
                    cfspreadsheet         : "optional",
                    cfsprydataset         : "optional",
                    cfstatic              : "required",
                    cfstopwatch           : "required",
                    cfstoredproc          : "optional",
                    cfswitch              : "required",
                    cftable               : "required",
                    cftextarea            : "optional",
                    cfthread              : "optional",
                    cfthrow               : "prohibited",
                    cftimer               : "required",
                    cftooltip             : "required",
                    cftrace               : "optional",
                    cftransaction         : "required",
                    cftree                : "required",
                    cftreeitem            : "optional",
                    cftry                 : "required",
                    cfupdate              : "prohibited",
                    cfvideo               : "prohibited",
                    cfvideoplayer         : "optional",
                    cfwddx                : "prohibited",
                    cfwebsocket           : "optional",
                    cfwhile               : "required",
                    cfwindow              : "optional",
                    cfx_                  : "prohibited",
                    cfxml                 : "required",
                    cfzip                 : "optional",
                    cfzipparam            : "prohibited"
                },
                // determine if spaces between nodes are absent, multiline, or merely there 2 -
                // multiline 1 - space present 0 - no space present
                spacer        = function markuppretty__tokenize_spacer() {
                    var linea = 0;
                    if (space.length > 0) {
                        stats.space = stats.space + space.length;
                        linea       = space
                            .split("\n")
                            .length - 1;
                        if (options.preserve > 0 && linea > 1) {
                            if (linea > options.preserve + 1) {
                                lines.push(options.preserve + 1);
                            } else {
                                lines.push(linea);
                            }
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
                tag           = function markuppretty__tokenize_tag(end) {
                    var lexer     = [],
                        bcount    = 0,
                        e         = 0,
                        f         = 0,
                        igcount   = 0,
                        jsxcount  = 0,
                        braccount = 0,
                        parncount = 0,
                        quote     = "",
                        element   = "",
                        lastchar  = "",
                        jsxquote  = "",
                        tname     = "",
                        comment   = false,
                        cheat     = false,
                        endtag    = false,
                        nopush    = false,
                        nosort    = false,
                        simple    = false,
                        preserve  = false,
                        stest     = false,
                        liend     = false,
                        ignoreme  = false,
                        quotetest = false,
                        parseFail = false,
                        singleton = false,
                        earlyexit = false,
                        attribute = [],
                        attstore  = [],
                        presend   = {
                            cfquery: true
                        },
                        arname    = function markuppretty__tokenize_tag_name(x) {
                            var eq = x.indexOf("=");
                            if (eq > 0 && ((eq < x.indexOf("\"") && x.indexOf("\"") > 0) || (eq < x.indexOf("'") && x.indexOf("'") > 0))) {
                                return x.slice(0, eq);
                            }
                            return x;
                        },
                        slashy    = function markuppretty__tokenize_tag_slashy() {
                            var x = a;
                            do {
                                x = x - 1;
                            } while (b[x] === "\\");
                            x = a - x;
                            if (x % 2 === 1) {
                                return false;
                            }
                            return true;
                        },
                        attrpush  = function markuppretty__tokenize_tag_attrpush(quotes) {
                            var atty = "",
                                name = "",
                                aa   = 0,
                                bb   = 0;
                            if (quotes === true) {
                                if (quote === "\"" && options.quoteConvert === "single") {
                                    atty = attribute
                                        .slice(0, attribute.length - 1)
                                        .join("")
                                        .replace(/'/g, "\"")
                                        .replace(/"/, "'") + "'";
                                } else if (quote === "'" && options.quoteConvert === "double") {
                                    atty = attribute
                                        .slice(0, attribute.length - 1)
                                        .join("")
                                        .replace(/"/g, "'")
                                        .replace(/'/, "\"") + "\"";
                                } else {
                                    atty = attribute.join("");
                                }
                                name = arname(atty);
                                if (name === "data-prettydiff-ignore") {
                                    ignoreme = true;
                                } else if (name === "id") {
                                    ids.push(atty.slice(name.length + 2, atty.length - 1));
                                } else if (name === "schemaLocation") {
                                    reqs.push(atty.slice(name.length + 2, atty.length - 1));
                                }
                                quote = "";
                            } else {
                                atty = attribute
                                    .join("")
                                    .replace(/\s+/g, " ");
                                name = arname(atty);
                                if (name === "data-prettydiff-ignore") {
                                    ignoreme = true;
                                } else if (name === "id") {
                                    ids.push(element.slice(name.length + 1, atty.length));
                                }
                                if (options.jsx === true && attribute[0] === "{" && attribute[attribute.length - 1] === "}") {
                                    jsxcount = 0;
                                }
                            }
                            if (atty.slice(0, 3) === "<%=" || atty.slice(0, 2) === "{%") {
                                nosort = true;
                            }
                            atty      = atty
                                .replace(/^\u0020/, "")
                                .replace(/\u0020$/, "");
                            attribute = atty
                                .replace(/\r\n/g, "\n")
                                .split("\n");
                            bb        = attribute.length;
                            for (aa = 0; aa < bb; aa = aa + 1) {
                                attribute[aa] = attribute[aa].replace(/(\s+)$/, "");
                            }
                            atty = attribute.join(lf);
                            if (atty === "=") {
                                attstore[attstore.length - 1] = attstore[attstore.length - 1] + "=";
                            } else if (atty.charAt(0) === "=" && attstore.length > 0 && attstore[attstore.length - 1].indexOf("=") < 0) {
                                //if an attribute starts with a `=` then adjoin it to the last attribute
                                attstore[attstore.length - 1] = attstore[attstore.length - 1] + atty;
                            } else if (atty.charAt(0) !== "=" && attstore.length > 0 && attstore[attstore.length - 1].indexOf("=") === attstore[attstore.length - 1].length - 1) {
                                // if an attribute follows an attribute ending with `=` then adjoin it to the
                                // last attribute
                                attstore[attstore.length - 1] = attstore[attstore.length - 1] + atty;
                            } else if (atty !== "" && atty !== " ") {
                                attstore.push(atty);
                            }
                            attribute = [];
                        };
                    spacer();
                    jscom.push(false);
                    linen.push(line);
                    value.push("");
                    ext = false;
                    // this complex series of conditions determines an elements delimiters look to
                    // the types being pushed to quickly reason about the logic no type is pushed
                    // for start tags or singleton tags just yet some types set the `preserve` flag,
                    // which means to preserve internal white space The `nopush` flag is set when
                    // parsed tags are to be ignored and forgotten
                    (function markuppretty__tokenize_types() {
                        if (end === "]>") {
                            end      = ">";
                            sgmlflag = sgmlflag - 1;
                            types.push("template_end");
                        } else if (end === "---") {
                            preserve = true;
                            types.push("comment");
                        } else if (b[a] === "<") {
                            if (b[a + 1] === "/") {
                                if (b[a + 2] === "#") {
                                    types.push("template_end");
                                } else {
                                    types.push("end");
                                }
                                end = ">";
                            } else if (b[a + 1] === "!") {
                                if (b[a + 2] === "-" && b[a + 3] === "-") {
                                    if (b[a + 4] === "#") {
                                        end = "-->";
                                        types.push("template");
                                    } else if (b[a + 4] === "[" && b[a + 5] === "i" && b[a + 6] === "f" && options.conditional === true) {
                                        end = "-->";
                                        types.push("conditional");
                                    } else if (b[a + 4] === "-" && (/<cf[a-z]/i).test(options.source) === true) {
                                        preserve = true;
                                        comment  = true;
                                        end      = "--->";
                                        types.push("comment");
                                    } else {
                                        end = "-->";
                                        if (options.mode === "minify" || options.comments === "nocomment") {
                                            nopush  = true;
                                            comment = true;
                                        } else {
                                            if (options.preserveComment === true) {
                                                preserve = true;
                                            }
                                            comment  = true;
                                            if (options.commline === true) {
                                                lines[lines.length - 1] = 2;
                                            }
                                            types.push("comment");
                                        }
                                    }
                                } else if (b[a + 2] === "[" && b[a + 3] === "C" && b[a + 4] === "D" && b[a + 5] === "A" && b[a + 6] === "T" && b[a + 7] === "A" && b[a + 8] === "[") {
                                    end      = "]]>";
                                    preserve = true;
                                    comment  = true;
                                    types.push("cdata");
                                } else {
                                    end      = ">";
                                    sgmlflag = sgmlflag + 1;
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
                                if (b[a + 2] !== "=") {
                                    preserve = true;
                                }
                                if (b[a + 2] === "-" && b[a + 3] === "-") {
                                    end     = "--%>";
                                    comment = true;
                                    if (options.commline === true) {
                                        line[line.length - 1] = 2;
                                    }
                                    types.push("comment");
                                } else if (b[a + 2] === "#") {
                                    end     = "%>";
                                    comment = true;
                                    if (options.commline === true) {
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
                            } else if (b[a + 8] !== undefined && b[a + 1].toLowerCase() === "c" && b[a + 2].toLowerCase() === "f" && b[a + 3].toLowerCase() === "q" && b[a + 4].toLowerCase() === "u" && b[a + 5].toLowerCase() === "e" && b[a + 6].toLowerCase() === "r" && b[a + 7].toLowerCase() === "y" && (b[a + 8] === ">" || (/\s/).test(b[a + 8]))) {
                                end          = ">";
                                linepreserve = linepreserve + 1;
                                types.push("linepreserve");
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
                                    types.push("template_start");
                                }
                            } else {
                                simple = true;
                                end    = ">";
                            }
                        } else if (b[a] === "{") {
                            preserve = true;
                            if (options.jsx === true) {
                                end = "}";
                                types.push("script");
                            } else if (options.dustjs === true) {
                                if (b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                    a = a + 6;
                                    token.push("{:else}");
                                    presv.push(true);
                                    daddy.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    attrs.push({});
                                    stats.template[0] = stats.template[0] + 1;
                                    stats.template[1] = stats.template[1] + 7;
                                    earlyexit         = true;
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
                                } else if (b[a + 2] === "e" && b[a + 3] === "n" && b[a + 4] === "d") {
                                    end = "}}";
                                    types.push("template_end");
                                } else if (b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e") {
                                    end = "}}";
                                    types.push("template_else");
                                } else {
                                    end = "}}";
                                    types.push("template");
                                }
                            } else if (b[a + 1] === "%") {
                                end = "%}";
                                types.push("template");
                            } else if (b[a + 1] === "#") {
                                end = "#}";
                                types.push("comment");
                                preserve = true;
                                comment  = true;
                            } else {
                                end = b[a + 1] + "}";
                                types.push("template");
                            }
                            if (b[a + 1] === "@" && b[a + 2] === "}" && b[a + 3] === "e" && b[a + 4] === "l" && b[a + 5] === "s" && b[a + 6] === "e" && b[a + 7] === "{" && b[a + 8] === "@" && b[a + 9] === "}") {
                                a                       = a + 9;
                                types[types.length - 1] = "template_else";
                                presv.push(true);
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                attrs.push({});
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + 10;
                                earlyexit         = true;
                                return token.push("{@}else{@}");
                            }
                        } else if (b[a] === "[" && b[a + 1] === "%") {
                            end = "%]";
                            types.push("template");
                        } else if (b[a] === "#" && options.apacheVelocity === true) {
                            if (b[a + 1] === "*") {
                                preserve = true;
                                comment  = true;
                                end      = "*#";
                                types.push("comment");
                            } else if (b[a + 1] === "[" && b[a + 2] === "[") {
                                preserve = true;
                                comment  = true;
                                end      = "]]#";
                                types.push("comment");
                            } else if (b[a + 1] === "#") {
                                preserve = true;
                                comment  = true;
                                end      = "\n";
                                types.push("comment");
                            } else if (b[a + 1] === "e" && b[a + 2] === "l" && b[a + 3] === "s" && b[a + 4] === "e" && (/\s/).test(b[a + 5]) === true) {
                                end = "\n";
                                types.push("template_else");
                            } else if (b[a + 1] === "i" && b[a + 2] === "f") {
                                end = "\n";
                                types.push("template_start");
                            } else if (b[a + 1] === "f" && b[a + 2] === "o" && b[a + 3] === "r" && b[a + 4] === "e" && b[a + 5] === "a" && b[a + 6] === "c" && b[a + 7] === "h") {
                                end = "\n";
                                types.push("template_start");
                            } else if (b[a + 1] === "e" && b[a + 2] === "n" && b[a + 3] === "d") {
                                end = "\n";
                                types.push("template_end");
                            } else {
                                end = "\n";
                                types.push("template");
                            }
                        } else if (b[a] === "$" && options.apacheVelocity === true) {
                            end = "\n";
                            types.push("template");
                        }
                        if (options.unformatted === true) {
                            preserve = true;
                        }
                    }());
                    if (earlyexit === true) {
                        return;
                    }
                    // This loop is the logic that parses tags and attributes If the attribute
                    // data-prettydiff-ignore is present the `ignore` flag is set The ignore flag is
                    // identical to the preserve flag
                    lastchar = end.charAt(end.length - 1);
                    for (a = a; a < c; a = a + 1) {
                        if (b[a] === "\n") {
                            line = line + 1;
                        }
                        if (preserve === true || (/\s/).test(b[a]) === false) {
                            lexer.push(b[a]);
                        } else if (lexer[lexer.length - 1] !== " ") {
                            lexer.push(" ");
                        }
                        if (comment === true) {
                            quote = "";
                            //comments must ignore fancy encapsulations and attribute parsing
                            if (b[a] === lastchar && lexer.length > end.length + 1) {
                                //if current character matches the last character of the tag ending sequence
                                f = lexer.length;
                                for (e = end.length - 1; e > -1; e = e - 1) {
                                    f = f - 1;
                                    if (lexer[f] !== end.charAt(e)) {
                                        break;
                                    }
                                }
                                if (e < 0) {
                                    if (end === "endcomment") {
                                        f = f - 1;
                                        if ((/\s/).test(lexer[f]) === true) {
                                            do {
                                                f = f - 1;
                                            } while ((/\s/).test(lexer[f]) === true);
                                        }
                                        if (lexer[f - 1] === "{" && lexer[f] === "%") {
                                            end      = "%}";
                                            lastchar = "}";
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            }
                        } else {
                            if (quote === "") {
                                if (options.jsx === true) {
                                    if (b[a] === "{") {
                                        jsxcount = jsxcount + 1;
                                    } else if (b[a] === "}") {
                                        jsxcount = jsxcount - 1;
                                    }
                                }
                                if (types[types.length - 1] === "sgml" && b[a] === "[" && lexer.length > 4) {
                                    types[types.length - 1] = "template_start";
                                    break;
                                }
                                if (b[a] === "<" && preserve === false && lexer.length > 1 && end !== ">>" && end !== ">>>" && simple === true) {
                                    parseError.push("Parse error on line " + line + " on element: ");
                                    parseFail = true;
                                }
                                if (stest === true && (/\s/).test(b[a]) === false && b[a] !== lastchar) {
                                    //attribute start
                                    stest   = false;
                                    quote   = jsxquote;
                                    igcount = 0;
                                    lexer.pop();
                                    for (a = a; a < c; a = a + 1) {
                                        if (b[a] === "\n") {
                                            line = line + 1;
                                        }
                                        if (options.unformatted === true) {
                                            lexer.push(b[a]);
                                        }
                                        attribute.push(b[a]);

                                        if ((b[a] === "<" || b[a] === ">") && (quote === "" || quote === ">") && options.jsx === false) {
                                            if (quote === "" && b[a] === "<") {
                                                quote     = ">";
                                                braccount = 1;
                                            } else if (quote === ">") {
                                                if (b[a] === "<") {
                                                    braccount = braccount + 1;
                                                } else if (b[a] === ">") {
                                                    braccount = braccount - 1;
                                                    if (braccount === 0) {
                                                        // the following detects if a coldfusion tag is embedded within another markup
                                                        // tag
                                                        tname = tagName(attribute.join(""));
                                                        if (cftags[tname] === "required") {
                                                            quote = "</" + tname + ">";
                                                        } else {
                                                            quote   = "";
                                                            igcount = 0;
                                                            attrpush(false);
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        } else if (quote === "") {
                                            if (b[a + 1] === lastchar) {
                                                //if at end of tag
                                                if (attribute[attribute.length - 1] === "/") {
                                                    attribute.pop();
                                                    if (preserve === true) {
                                                        lexer.pop();
                                                    }
                                                    a = a - 1;
                                                }
                                                if (attribute.length > 0) {
                                                    attrpush(false);
                                                }
                                                break;
                                            }
                                            if (b[a] === "{" && b[a - 1] === "=" && options.jsx === false) {
                                                quote = "}";
                                            } else if (b[a] === "\"" || b[a] === "'") {
                                                quote = b[a];
                                                if (b[a - 1] === "=" && (b[a + 1] === "<" || (b[a + 1] === "{" && b[a + 2] === "%") || (/\s/).test(b[a + 1]) === true)) {
                                                    igcount = a;
                                                }
                                            } else if (b[a] === "(") {
                                                quote     = ")";
                                                parncount = 1;
                                            } else if (options.jsx === true) {
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
                                            } else if (lexer[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                                //opening embedded template expression
                                                if (b[a + 1] === "{") {
                                                    if (b[a + 2] === "{") {
                                                        quote = "}}}";
                                                    } else {
                                                        quote = "}}";
                                                    }
                                                } else if (options.dustjs === true) {
                                                    quote = "}";
                                                } else {
                                                    quote = b[a + 1] + "}";
                                                }
                                            }
                                            if ((/\s/).test(b[a]) === true && quote === "") {
                                                // testing for a run of spaces between an attribute's = and a quoted value.
                                                // Unquoted values separated by space are separate attributes
                                                if (attribute[attribute.length - 2] === "=") {
                                                    for (e = a + 1; e < c; e = e + 1) {
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
                                        } else if (b[a] === "(" && quote === ")") {
                                            parncount = parncount + 1;
                                        } else if (b[a] === ")" && quote === ")") {
                                            parncount = parncount - 1;
                                            if (parncount === 0) {
                                                quote = "";
                                                if (b[a + 1] === end.charAt(0)) {
                                                    attrpush(false);
                                                    break;
                                                }
                                            }
                                        } else if (options.jsx === true && (quote === "}" || (quote === "\n" && b[a] === "\n") || (quote === "*/" && b[a - 1] === "*" && b[a] === "/"))) {
                                            //jsx attributes
                                            if (quote === "}") {
                                                if (b[a] === "{") {
                                                    bcount = bcount + 1;
                                                } else if (b[a] === quote) {
                                                    bcount = bcount - 1;
                                                    if (bcount === 0) {
                                                        jsxcount = 0;
                                                        quote    = "";
                                                        element  = attribute.join("");
                                                        if (options.unformatted === false) {
                                                            if (options.jsx === true) {
                                                                if ((/^(\s*)$/).test(element) === false) {
                                                                    attstore.push(element);
                                                                }
                                                            } else {
                                                                element = element.replace(/\s+/g, " ");
                                                                if (element !== " ") {
                                                                    attstore.push(element);
                                                                }
                                                            }
                                                        } else if ((/^(\s+)$/).test(element) === false) {
                                                            attstore.push(element);
                                                        }
                                                        attribute = [];
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
                                                    attstore.push(element);
                                                }
                                                break;
                                            }
                                        } else if (b[a] === "{" && b[a + 1] === "%" && b[igcount - 1] === "=" && (quote === "\"" || quote === "'")) {
                                            quote   = quote + "{%";
                                            igcount = 0;
                                        } else if (b[a - 1] === "%" && b[a] === "}" && (quote === "\"{%" || quote === "'{%")) {
                                            quote   = quote.charAt(0);
                                            igcount = 0;
                                        } else if (b[a] === "<" && end === ">" && b[igcount - 1] === "=" && (quote === "\"" || quote === "'")) {
                                            quote   = quote + "<";
                                            igcount = 0;
                                        } else if (b[a] === ">" && (quote === "\"<" || quote === "'<")) {
                                            quote   = quote.charAt(0);
                                            igcount = 0;
                                        } else if (igcount === 0 && quote !== ">" && (quote.length < 2 || (quote.charAt(0) !== "\"" && quote.charAt(0) !== "'"))) {
                                            //terminate attribute at the conclusion of a quote pair
                                            f     = 0;
                                            tname = lexer[1] + lexer[2];
                                            tname = tname.toLowerCase();
                                            // in coldfusion quotes are escaped in a string with double the characters:
                                            // "cat"" and dog"
                                            if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "'")) {
                                                attribute.push(b[a + 1]);
                                                a = a + 1;
                                            } else {
                                                for (e = quote.length - 1; e > -1; e = e - 1) {
                                                    if (b[a - f] !== quote.charAt(e)) {
                                                        break;
                                                    }
                                                    f = f + 1;
                                                }
                                                if (e < 0) {
                                                    attrpush(true);
                                                    if (b[a + 1] === lastchar) {
                                                        break;
                                                    }
                                                }
                                            }
                                        } else if (igcount > 0 && (/\s/).test(b[a]) === false) {
                                            igcount = 0;
                                        }
                                    }
                                } else if (end !== "%>" && end !== "\n" && (b[a] === "\"" || b[a] === "'")) {
                                    //opening quote
                                    quote = b[a];
                                } else if (comment === false && end !== "\n" && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && b[a + 4] !== "#" && types[types.length - 1] !== "conditional") {
                                    quote = "-->";
                                } else if (lexer[0] !== "{" && end !== "\n" && b[a] === "{" && end !== "%>" && end !== "%]" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                    //opening embedded template expression
                                    if (b[a + 1] === "{") {
                                        if (b[a + 2] === "{") {
                                            quote = "}}}";
                                        } else {
                                            quote = "}}";
                                        }
                                    } else if (options.dustjs === true) {
                                        quote = "}";
                                    } else {
                                        quote = b[a + 1] + "}";
                                    }
                                    if (quote === end) {
                                        quote = "";
                                    }
                                } else if (simple === true && end !== "\n" && (/\s/).test(b[a]) === true && b[a - 1] !== "<") {
                                    //identify a space in a regular start or singleton tag
                                    stest = true;
                                } else if (simple === true && options.jsx === true && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                                    //jsx comment immediately following tag name
                                    stest                   = true;
                                    lexer[lexer.length - 1] = " ";
                                    attribute.push(b[a]);
                                    if (b[a + 1] === "*") {
                                        jsxquote = "*/";
                                    } else {
                                        jsxquote = "\n";
                                    }
                                } else if ((b[a] === lastchar || (end === "\n" && b[a + 1] === "<")) && (lexer.length > end.length + 1 || lexer[0] === "]") && (options.jsx === false || jsxcount === 0)) {
                                    if (end === "\n") {
                                        if ((/\s/).test(lexer[lexer.length - 1]) === true) {
                                            do {
                                                lexer.pop();
                                                a = a - 1;
                                            } while ((/\s/).test(lexer[lexer.length - 1]) === true);
                                        }
                                        break;
                                    }
                                    if (lexer[0] === "{" && lexer[1] === "%" && lexer.join("").replace(/\s+/g, "") === "{%comment%}") {
                                        end                     = "endcomment";
                                        lastchar                = "t";
                                        preserve                = true;
                                        comment                 = true;
                                        types[types.length - 1] = "comment";
                                    } else {
                                        //if current character matches the last character of the tag ending sequence
                                        f = lexer.length;
                                        for (e = end.length - 1; e > -1; e = e - 1) {
                                            f = f - 1;
                                            if (lexer[f] !== end.charAt(e)) {
                                                break;
                                            }
                                        }
                                        if (e < 0) {
                                            break;
                                        }
                                    }
                                }
                            } else if (b[a] === quote.charAt(quote.length - 1) && ((options.jsx === true && end === "}" && (b[a - 1] !== "\\" || slashy() === false)) || options.jsx === false || end !== "}")) {
                                //find the closing quote or embedded template expression
                                f     = 0;
                                tname = lexer[1] + lexer[2];
                                tname = tname.toLowerCase();
                                // in coldfusion quotes are escaped in a string with double the characters:
                                // "cat"" and dog"
                                if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "'")) {
                                    attribute.push(b[a + 1]);
                                    a = a + 1;
                                } else {
                                    for (e = quote.length - 1; e > -1; e = e - 1) {
                                        if (b[a - f] !== quote.charAt(e)) {
                                            break;
                                        }
                                        f = f + 1;
                                    }
                                    if (e < 0) {
                                        quote = "";
                                    }
                                }
                            }
                        }
                    }
                    //nopush flags mean an early exit
                    if (nopush === true) {
                        jscom.pop();
                        linen.pop();
                        lines.pop();
                        value.pop();
                        space = minspace;
                        return;
                    }

                    if (preserve === true) {
                        presv.push(true);
                    } else {
                        presv.push(false);
                    }

                    if (options.correct === true) {
                        if (b[a + 1] === ">" && lexer[0] === "<" && lexer[1] !== "<") {
                            do {
                                a = a + 1;
                            } while (b[a + 1] === ">");
                        } else if (lexer[0] === "<" && lexer[1] === "<" && b[a + 1] !== ">" && lexer[lexer.length - 2] !== ">") {
                            do {
                                lexer.splice(1, 1);
                            } while (lexer[1] === "<");
                        }
                    }
                    igcount = 0;
                    element = lexer.join("");
                    if (element.indexOf("{{") === 0 && element.slice(element.length - 2) === "}}") {
                        if (tagName(element) === "end") {
                            types[types.length - 1] = "template_end";
                        } else if (tagName(element) === "else") {
                            types[types.length - 1] = "template_else";
                        }
                    } else if (element.slice(0, 2) === "<%" && element.slice(element.length - 2) === "%>") {
                        if ((/^(<%\s*end\s*-?%>)$/).test(element) === true || (/^(<%\s*\}\s*%>)$/).test(element) === true) {
                            types[types.length - 1] = "template_end";
                        } else if ((/^(<%\s*\}?\s*else\s*\{?\s*-?%>)$/).test(element) === true) {
                            types[types.length - 1] = "template_else";
                        } else if (element.indexOf("<%=") !== 0) {
                            types[types.length - 1] = "template_start";
                        }
                    }
                    tname = tagName(element);
                    if (options.html === true && element.charAt(0) === "<" && element.charAt(1) !== "!" && element.charAt(1) !== "?" && (types.length === 0 || types[types.length - 1].indexOf("template") < 0) && options.jsx === false && cftags[tname] === undefined && cftags[tname.slice(1)] === undefined && tname.slice(0, 3) !== "cf_") {
                        element = element.toLowerCase();
                    }
                    if (tname === "comment" && element.slice(0, 2) === "{%") {
                        element = element
                            .replace(/^(\{%\s*comment\s*%\}\s*)/, "")
                            .replace(/(\s*\{%\s*endcomment\s*%\})$/, "");

                        attrs.push({});
                        attrs.push({});
                        value.push("");
                        value.push("");
                        jscom.push(false);
                        jscom.push(false);
                        e = linen[linen.length - 1];
                        linen.push(e);
                        linen.push(e);
                        types[types.length - 1] = "template_start";
                        token.push("{% comment %}");
                        types.push("comment");
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        stats.template[0] = stats.template[0] + 1;
                        stats.template[1] = stats.template[1] + 13;
                        token.push(element);
                        types.push("template_end");
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        stats.template[0] = stats.template[0] + 1;
                        stats.template[1] = stats.template[1] + element.length;
                        return token.push("{% endcomment %}");
                    }

                    if (end !== "]>" && sgmlflag > 0 && element.charAt(element.length - 1) !== "[" && (element.slice(element.length - 2) === "]>" || (/^(<!((doctype)|(notation))\s)/i).test(element) === true)) {
                        sgmlflag = sgmlflag - 1;
                    }

                    //fix singleton tags and sort attributes
                    if (attstore.length > 0) {
                        if (attstore[attstore.length - 1] === "/") {
                            attstore.pop();
                            lexer.splice(lexer.length - 1, 0, "/");
                        }
                        f = attstore.length;
                        for (e = 1; e < f; e = e + 1) {
                            quote = attstore[e - 1];
                            if (quote.charAt(quote.length - 1) === "=" && attstore[e].indexOf("=") < 0) {
                                attstore[e - 1] = quote + attstore[e];
                                attstore.splice(e, 1);
                                f = f - 1;
                                e = e - 1;
                            }
                        }
                        if (objsortop === true && jscom[jscom.length - 1] === false && options.jsx === false && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                            attstore = safeSort(attstore);
                        }
                    }
                    attrs.push(function markuppretty__tokenize_attribute() {
                        var ind    = 0,
                            len    = attstore.length,
                            obj    = {},
                            eq     = 0,
                            dq     = 0,
                            sq     = 0,
                            syntax = "<{\"'=/",
                            slice  = "",
                            store  = [],
                            name   = "",
                            cft    = cftags[tname];
                        if (tname.slice(0, 3) === "cf_") {
                            cft = "required";
                        }
                        if (objsortop === true && options.jsx === false && cft === undefined) {
                            attstore = safeSort(attstore);
                        }
                        for (ind = 0; ind < len; ind = ind + 1) {
                            eq = attstore[ind].indexOf("=");
                            dq = attstore[ind].indexOf("\"");
                            sq = attstore[ind].indexOf("'");
                            if (eq > -1 && store.length > 0) {
                                obj[store.join(" ")] = "";
                                store                = [];
                                obj[attstore[ind]]   = "";
                            } else if (cft !== undefined && eq < 0 && attstore[ind].indexOf("=") < 0) {
                                store.push(attstore[ind]);
                            } else if ((cft !== undefined && eq < 0) || (dq > 0 && dq < eq) || (sq > 0 && sq < eq) || syntax.indexOf(attstore[ind].charAt(0)) > -1) {
                                obj[attstore[ind]] = "";
                            } else if (eq < 0 && cft === undefined) {
                                name = attstore[ind];
                                if (options.html === true && options.jsx === false && cft === undefined) {
                                    name = name.toLowerCase();
                                }
                                if (options.quoteConvert === "single") {
                                    obj[name] = "'" + attstore[ind] + "'";
                                } else {
                                    obj[name] = "\"" + attstore[ind] + "\"";
                                }
                            } else {
                                slice = attstore[ind].slice(eq + 1);
                                if (syntax.indexOf(slice.charAt(0)) < 0 && cft === undefined) {
                                    if (options.quoteConvert === "single") {
                                        slice = "'" + slice + "'";
                                    } else {
                                        slice = "\"" + slice + "\"";
                                    }
                                }
                                name = attstore[ind].slice(0, eq);
                                if (options.html === true && options.jsx === false && cft === undefined) {
                                    name = name.toLowerCase();
                                }
                                obj[name] = slice;
                            }
                        }
                        if (store.length > 0) {
                            obj[store.join(" ")] = "";
                        }
                        return obj;
                    }());

                    if (parseFail === true) {
                        if (element.indexOf("<!--<![") === 0) {
                            parseError.pop();
                        } else {
                            parseError[parseError.length - 1] = parseError[parseError.length - 1] +
                                    element;
                            if (element.indexOf("</") > 0) {
                                token.push(element);
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                stats.end[0] = stats.end[0] + 1;
                                stats.end[1] = stats.end[1] + token[token.length - 1].length;
                                return types.push("end");
                            }
                        }
                    }
                    // cheat identifies HTML singleton elements as singletons even if formatted as
                    // start tags
                    cheat = (function markuppretty__tokenize_tag_cheat() {
                        var atty         = [],
                            attn         = token[token.length - 1],
                            atval        = "",
                            type         = "",
                            d            = 0,
                            ee           = 1,
                            cfval        = "",
                            ender        = (/(\/>)$/),
                            htmlsings    = {
                                area       : "singleton",
                                base       : "singleton",
                                basefont   : "singleton",
                                br         : "singleton",
                                col        : "singleton",
                                embed      : "singleton",
                                eventsource: "singleton",
                                frame      : "singleton",
                                hr         : "singleton",
                                img        : "singleton",
                                input      : "singleton",
                                keygen     : "singleton",
                                link       : "singleton",
                                meta       : "singleton",
                                param      : "singleton",
                                progress   : "singleton",
                                source     : "singleton",
                                wbr        : "singleton"
                            },
                            fixsingleton = function markuppretty__tokenize_tag_cheat_fixsingleton() {
                                var aa    = 0,
                                    bb    = 0,
                                    vname = tname.slice(1);
                                for (aa = token.length - 1; aa > -1; aa = aa - 1) {
                                    if (types[aa] === "end") {
                                        bb = bb + 1;
                                    } else if (types[aa] === "start") {
                                        bb = bb - 1;
                                        if (bb < 0) {
                                            return false;
                                        }
                                    }
                                    if (bb === 0 && token[aa].toLowerCase().indexOf(vname) === 1) {
                                        if (cftags[tagName(token[aa])] !== undefined) {
                                            types[aa] = "template_start";
                                        } else {
                                            types[aa]          = "start";
                                            stats.singleton[0] = stats.singleton[0] - 1;
                                            stats.singleton[1] = stats.singleton[1] - token[token.length - 1].length;
                                            stats.start[0]     = stats.start[0] + 1;
                                            stats.start[1]     = stats.start[1] + token[token.length - 1].length;
                                        }
                                        if (Object.keys(attrs[aa]).length > 0) {
                                            token[aa] = token[aa].replace(/(\s*\/>)$/, " >");
                                        } else {
                                            token[aa] = token[aa].replace(/(\s*\/>)$/, ">");
                                        }
                                        return false;
                                    }
                                }
                            };
                        if (presend["/" + tname] === true) {
                            linepreserve = linepreserve - 1;
                        }
                        if (types[types.length - 1] === "end" && tname.slice(0, 3) !== "/cf") {
                            if (types[types.length - 2] === "singleton" && attn.charAt(attn.length - 2) !== "/" && "/" + tagName(attn) === tname) {
                                types[types.length - 2] = "start";
                            } else if ((types[types.length - 2] === "start" || htmlsings[tname.slice(1)] === "singleton") && tname !== "/span" && tname !== "/div" && tname !== "/script" && (options.html === false || (options.html === true && tname !== "/li")) && tname === "/" + tagName(token[token.length - 1]) && options.tagmerge === true) {
                                types.pop();
                                attrs.pop();
                                jscom.pop();
                                linen.pop();
                                lines.pop();
                                presv.pop();
                                value.pop();
                                if (types[types.length - 1] === "start") {
                                    token[token.length - 1] = token[token.length - 1].replace(/>$/, "/>");
                                }
                                types[types.length - 1] = "singleton";
                                singleton               = true;
                                return;
                            }
                        }
                        for (d = attstore.length - 1; d > -1; d = d - 1) {
                            atty = arname(attstore[d]);
                            if (atty[0] === "type") {
                                type = atty[1];
                                if (type.charAt(0) === "\"" || type.charAt(0) === "'") {
                                    type = type.slice(1, type.length - 1);
                                }
                            } else if (atty[0] === "src" && (tname === "embed" || tname === "img" || tname === "script" || tname === "iframe")) {
                                atval = atty[1];
                                if (atval.charAt(0) === "\"" || atval.charAt(0) === "'") {
                                    atval = atval.slice(1, atval.length - 1);
                                }
                                reqs.push(atval);
                            } else if (tname === "link" && atty === "href") {
                                atval = atty[1];
                                if (atval.charAt(0) === "\"" || atval.charAt(0) === "'") {
                                    atval = atval.slice(1, atval.length - 1);
                                }
                                reqs.push(atval);
                            }
                        }

                        if ((tname === "script" || tname === "style" || tname === "cfscript") && element.slice(element.length - 2) !== "/>") {
                            //identify if there is embedded code requiring an external parser
                            if (tname === "script" && (type === "" || type === "text/javascript" || type === "babel" || type === "module" || type === "application/javascript" || type === "application/x-javascript" || type === "text/ecmascript" || type === "application/ecmascript" || type === "text/jsx" || type === "application/jsx" || type === "text/cjs")) {
                                ext = true;
                            } else if (tname === "style" && (type === "" || type === "text/css")) {
                                ext = true;
                            } else if (tname === "cfscript") {
                                ext = true;
                            }
                            if (ext === true) {
                                for (d = a + 1; d < c; d = d + 1) {
                                    if ((/\s/).test(b[d]) === false) {
                                        if (b[d] === "<") {
                                            if (b.slice(d + 1, d + 4).join("") === "!--") {
                                                for (d = d + 4; d < c; d = d + 1) {
                                                    if ((/\s/).test(b[d]) === false) {
                                                        ext = false;
                                                        break;
                                                    }
                                                    if (b[d] === "\n" || b[d] === "\r") {
                                                        break;
                                                    }
                                                }
                                            } else if (b.slice(d + 1, d + 9).join("") !== "![CDATA[") {
                                                ext = false;
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        if (tname === "/#assign" || tname === "/#global") {
                            for (d = types.length - 2; d > -1; d = d - 1) {
                                if (types[d] === "start" || types[d] === "template_start") {
                                    ee = ee - 1;
                                } else if (types[d] === "end" || types[d] === "template_end") {
                                    ee = ee + 1;
                                }
                                if (ee === 1) {
                                    if ((token[d].indexOf("<#assign") === 0 && tname === "/#assign") || (token[d].indexOf("<#global") === 0 && tname === "/#global")) {
                                        types[d] = "template_start";
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
                            simple = true;
                            return true;
                        }
                        if (options.html === true) {
                            //simple means of looking for missing li end tags
                            if (options.jsx === false) {
                                if (tname === "li") {
                                    if (litag === list && (list !== 0 || (list === 0 && types.length > 0 && types[types.length - 1].indexOf("template") < 0))) {
                                        for (d = types.length - 1; d > -1; d = d - 1) {
                                            if (types[d] === "start" || types[d] === "template_start") {
                                                ee = ee - 1;
                                            } else if (types[d] === "end" || types[d] === "template_end") {
                                                ee = ee + 1;
                                            }
                                            if (ee === -1 && (tagName(token[d]) === "li" || (tagName(token[d + 1]) === "li" && (tagName(token[d]) === "ul" || tagName(token[d]) === "ol")))) {
                                                liend = true;
                                                break;
                                            }
                                            if (ee < 0) {
                                                break;
                                            }
                                        }
                                    } else {
                                        litag = litag + 1;
                                    }
                                } else if (tname === "/li" && litag === list) {
                                    litag = litag - 1;
                                } else if (tname === "ul" || tname === "ol") {
                                    list = list + 1;
                                } else if (tname === "/ul" || tname === "/ol") {
                                    if (litag === list) {
                                        liend = true;
                                        litag = litag - 1;

                                    }
                                    list = list - 1;
                                }
                            }
                            if (types[types.length - 1] === "end" && htmlsings[tname.slice(1)] === "singleton" && tname !== "/cftransaction") {
                                return fixsingleton();
                            }
                            if (htmlsings[tname] === "singleton") {
                                if (options.correct === true && ender.test(element) === false) {
                                    lexer.pop();
                                    lexer.push(" ");
                                    lexer.push("/");
                                    lexer.push(">");
                                    element = lexer.join("");
                                }
                                return true;
                            }
                        }
                        if (types[types.length - 1] === "end" && tname.slice(0, 3) === "/cf" && cftags[tname.slice(1)] !== undefined) {
                            cfval = cftags[tname.slice(1)];
                            if (tname === "/cftransaction") {
                                cftransaction = false;
                            }
                            if (cfval !== undefined) {
                                types[types.length - 1] = "template_end";
                            }
                            if ((cfval === "optional" || cfval === "prohibited") && tname !== "/cftransaction") {
                                return fixsingleton();
                            }
                            return false;
                        }
                        if (tname.slice(0, 2) === "cf") {
                            if (tname === "cfelse" || tname === "cfelseif") {
                                types.push("template_else");
                                token.push(lexer.join(""));
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                singleton         = true;
                                return false;
                            }
                            if (tname === "cftransaction" && cftransaction === true) {
                                cfval = "prohibited";
                            } else {
                                cfval = cftags[tname];
                            }
                            if (cfval === "optional" || cfval === "prohibited" || tname.slice(0, 3) === "cf_") {
                                if (options.correct === true && ender.test(element) === false) {
                                    lexer.pop();
                                    lexer.push(" ");
                                    lexer.push("/");
                                    lexer.push(">");
                                }
                                types.push("template");
                                token.push(lexer.join("").replace(/\s+/, " "));
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                singleton         = true;
                                return false;
                            }
                            if (cfval === "required" && tname !== "cfquery") {
                                if (tname === "cftransaction" && cftransaction === false) {
                                    cftransaction = true;
                                }
                                types.push("template_start");
                                token.push(lexer.join(""));
                                daddy.push(parent[parent.length - 1][0]);
                                if (parent[parent.length - 1][1] === -1) {
                                    begin.push(token.length - 1);
                                } else {
                                    begin.push(parent[parent.length - 1][1]);
                                }
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                singleton         = true;
                            }
                            return false;
                        }
                        if (options.dustjs === true && types[types.length - 1] === "template_start") {
                            type  = element.charAt(1);
                            atval = element.slice(element.length - 2);
                            if ((atval === "/}" || atval.charAt(0) === type) && (type === "#" || type === "?" || type === "^" || type === "@" || type === "<" || type === "+")) {
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
                        if (cheat === true || (lexer[lexer.length - 2] === "/" && lexer[lexer.length - 1] === ">")) {
                            types.push("singleton");
                        } else {
                            types.push("start");
                        }
                    }
                    // additional logic is required to find the end of a tag with the attribute
                    // data-prettydiff-ignore
                    if (simple === true && preserve === false && ignoreme === true && end === ">" && element.slice(element.length - 2) !== "/>") {
                        if (cheat === true) {
                            types.push("singleton");
                        } else {
                            preserve                = true;
                            presv[presv.length - 1] = true;
                            types.push("ignore");
                            a     = a + 1;
                            quote = "";
                            for (a = a; a < c; a = a + 1) {
                                if (b[a] === "\n") {
                                    line = line + 1;
                                }
                                lexer.push(b[a]);
                                if (quote === "") {
                                    if (b[a] === "\"") {
                                        quote = "\"";
                                    } else if (b[a] === "'") {
                                        quote = "'";
                                    } else if (lexer[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                                        if (b[a + 1] === "{") {
                                            if (b[a + 2] === "{") {
                                                quote = "}}}";
                                            } else {
                                                quote = "}}";
                                            }
                                        } else if (options.dustjs === true) {
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
                                                    igcount = igcount - 1;
                                                    if (igcount < 0) {
                                                        break;
                                                    }
                                                } else {
                                                    igcount = igcount + 1;
                                                }
                                            }
                                        }
                                    }
                                } else if (b[a] === quote.charAt(quote.length - 1)) {
                                    f = 0;
                                    for (e = quote.length - 1; e > -1; e = e - 1) {
                                        if (b[a - f] !== quote.charAt(e)) {
                                            break;
                                        }
                                        f = f + 1;
                                    }
                                    if (e < 0) {
                                        quote = "";
                                    }
                                }
                            }
                        }
                        element = lexer.join("");
                        if (options.mode === "diff") {
                            element = element.replace(" >", " />");
                            element = element.slice(0, element.indexOf(" />") + 3);
                            if (options.quotes === "single") {
                                attstore = ["data-prettydiff-ignore='true'"];
                            } else {
                                attstore = ["data-prettydiff-ignore=\"true\""];
                            }
                        }
                    }

                    //some template tags can be evaluated as a block start/end based on syntax alone
                    e = types.length - 1;
                    if (types[e].indexOf("template") > -1) {
                        if (element.slice(0, 2) === "{%") {
                            lexer = [
                                "autoescape",
                                "block",
                                "capture",
                                "case",
                                "comment",
                                "embed",
                                "filter",
                                "for",
                                "form",
                                "if",
                                "macro",
                                "paginate",
                                "raw",
                                "sandbox",
                                "spaceless",
                                "tablerow",
                                "unless",
                                "verbatim"
                            ];
                            if (tname === "else" || tname === "elseif" || tname === "when" || tname === "elif") {
                                types[e] = "template_else";
                            } else {
                                for (f = lexer.length - 1; f > -1; f = f - 1) {
                                    if (tname === lexer[f]) {
                                        types[e] = "template_start";
                                        break;
                                    }
                                    if (tname === "end" + lexer[f]) {
                                        types[e] = "template_end";
                                        break;
                                    }
                                }
                            }
                        } else if (element.slice(0, 2) === "{{" && element.charAt(3) !== "{") {
                            if ((/^(\{\{\s*end\s*\}\})$/).test(element) === true) {
                                types[e] = "template_end";
                            } else if (tname === "block" || tname === "define" || tname === "form" || tname === "if" || tname === "range" || tname === "with") {
                                if (tname !== "block" || (/\{%\s*\w/).test(options.source) === false) {
                                    types[e] = "template_start";
                                }
                            }
                        } else if (types[e] === "template") {
                            if (element.indexOf("else") > 2) {
                                types[e] = "template_else";
                            } else if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                                types[e] = "template_end";
                            } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                                types[e] = "template_start";
                            }
                        }
                    }

                    // HTML5 does not require an end tag for an opening list item <li> this logic
                    // temprorarily creates a pseudo end tag
                    if (liend === true && (options.mode === "beautify" || options.mode === "diff" || options.mode === "parse")) {
                        token.push("</prettydiffli>");
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        lines.push(lines[lines.length - 1]);
                        linen.push(line);
                        lines[lines.length - 2] = 0;
                        attrs.push({});
                        if (types[types.length - 1] === "start") {
                            types.splice(types.length - 1, 0, "end");
                        } else {
                            types.push("end");
                        }
                        presv.push(false);
                        jscom.push(false);
                        value.push("");
                        if (parent.length > 1) {
                            parent.pop();
                        }
                        stats.end[0] = stats.end[0] + 1;
                        stats.end[1] = stats.end[1] + 5;
                    }
                    if (parent[parent.length - 1][1] === -1) {
                        parent[parent.length - 1] = ["root", token.length];
                    }
                    if (preserve === true) {
                        token.push(element);
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        stats.ignore[0] = stats.ignore[0] + 1;
                        stats.ignore[1] = stats.ignore[1] + token[token.length - 1].length;
                    } else {
                        if (options.jsx === true) {
                            token.push(element);
                        } else {
                            token.push(element.replace(/\s+/g, " "));
                        }
                        daddy.push(parent[parent.length - 1][0]);
                        begin.push(parent[parent.length - 1][1]);
                        if (types[types.length - 1].indexOf("template") > -1) {
                            stats.template[0] = stats.template[0] + 1;
                            stats.template[1] = stats.template[1] + token[token.length - 1].length;
                        } else if (types[types.length - 1].indexOf("linepreserve") > -1) {
                            stats.ignore[0] = stats.ignore[0] + 1;
                            stats.ignore[1] = stats.ignore[1] + token[token.length - 1].length;
                        } else {
                            stats[types[types.length - 1]][0] = stats[types[types.length - 1]][0] + 1;
                            stats[types[types.length - 1]][1] = stats[types[types.length - 1]][1] +
                                    token[token.length - 1].length;
                        }
                    }
                    if (options.tagsort === true && types[types.length - 1] === "end" && types[types.length - 2] !== "start") {
                        (function markuppretty__tokenize_tag_sorttag() {
                            var children   = [],
                                bb         = 0,
                                d          = 0,
                                endStore   = 0,
                                startStore = 0,
                                endData    = {},
                                store      = {
                                    attrs: [],
                                    begin: [],
                                    daddy: [],
                                    jscom: [],
                                    linen: [],
                                    lines: [],
                                    presv: [],
                                    token: [],
                                    types: [],
                                    value: []
                                },
                                sortName   = function markuppretty__tokenize_tag_sorttag_sortName(x, y) {
                                    if (token[x[0]] < token[y[0]]) {
                                        return 1;
                                    }
                                    return -1;
                                },
                                pushy      = function markuppretty__tokenize_tag_sorttag_pushy(index) {
                                    store
                                        .attrs
                                        .push(attrs[index]);
                                    store
                                        .begin
                                        .push(begin[index]);
                                    store
                                        .daddy
                                        .push(daddy[index]);
                                    store
                                        .jscom
                                        .push(jscom[index]);
                                    store
                                        .linen
                                        .push(linen[index]);
                                    store
                                        .lines
                                        .push(lines[index]);
                                    store
                                        .presv
                                        .push(presv[index]);
                                    store
                                        .token
                                        .push(token[index]);
                                    store
                                        .types
                                        .push(types[index]);
                                    store
                                        .value
                                        .push(value[index]);
                                };
                            for (bb = token.length - 2; bb > -1; bb = bb - 1) {
                                if (types[bb] === "start") {
                                    d = d - 1;
                                    if (d < 0) {
                                        startStore = bb + 1;
                                        break;
                                    }
                                } else if (types[bb] === "end") {
                                    d = d + 1;
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
                            for (bb = children.length - 1; bb > -1; bb = bb - 1) {
                                pushy(children[bb][0]);
                                if (children[bb][0] !== children[bb][1]) {
                                    for (d = children[bb][0] + 1; d < children[bb][1]; d = d + 1) {
                                        pushy(d);
                                    }
                                    pushy(children[bb][1]);
                                }
                            }
                            endData.attrs = attrs.pop();
                            endData.begin = begin.pop();
                            endData.daddy = daddy.pop();
                            endData.jscom = jscom.pop();
                            endData.linen = linen.pop();
                            endData.lines = lines.pop();
                            endData.presv = presv.pop();
                            endData.token = token.pop();
                            endData.types = types.pop();
                            endData.value = value.pop();
                            attrs         = attrs
                                .slice(0, startStore)
                                .concat(store.attrs);
                            begin         = begin
                                .slice(0, startStore)
                                .concat(store.begin);
                            daddy         = daddy
                                .slice(0, startStore)
                                .concat(store.daddy);
                            jscom         = jscom
                                .slice(0, startStore)
                                .concat(store.jscom);
                            linen         = linen
                                .slice(0, startStore)
                                .concat(store.linen);
                            lines         = lines
                                .slice(0, startStore)
                                .concat(store.lines);
                            presv         = presv
                                .slice(0, startStore)
                                .concat(store.presv);
                            token         = token
                                .slice(0, startStore)
                                .concat(store.token);
                            types         = types
                                .slice(0, startStore)
                                .concat(store.types);
                            value         = value
                                .slice(0, startStore)
                                .concat(store.value);
                            attrs.push(endData.attrs);
                            begin.push(endData.begin);
                            daddy.push(endData.daddy);
                            jscom.push(endData.jscom);
                            linen.push(endData.linen);
                            lines.push(endData.lines);
                            presv.push(endData.presv);
                            token.push(endData.token);
                            types.push(endData.types);
                            value.push(endData.value);
                        }());
                    }
                    e = token.length - 1;
                    if (types[e] === "start") {
                        parent.push([tname, e]);
                    } else if (types[e] === "end" && parent.length > 1) {
                        parent.pop();
                    }
                    if (options.attributetoken === true && options.mode === "parse") {
                        attribute = Object.keys(attrs[e]);
                        bcount    = attribute.length;
                        if ((types[e] === "start" || types[e] === "singleton") && bcount > 0) {
                            for (f = 0; f < bcount; f = f + 1) {
                                attrs.push({});
                                begin.push(begin[e]);
                                if (daddy[e] === "root") {
                                    daddy.push(tname);
                                } else {
                                    daddy.push(daddy[e]);
                                }
                                jscom.push(false);
                                linen.push(linen[e]);
                                lines.push(0);
                                presv.push(presv[e]);
                                token.push(attribute[f]);
                                if (attribute[f] === "") {
                                    types.push("template_attribute");
                                    value.push("");
                                } else {
                                    types.push("attribute");
                                    value.push(attrs[e][attribute[f]]);
                                }
                            }
                        }
                    }
                },
                content       = function markuppretty__tokenize_content() {
                    var lexer     = [],
                        quote     = "",
                        end       = "",
                        square    = (
                            types[types.length - 1] === "template_start" && token[token.length - 1].indexOf("<!") === 0 && token[token.length - 1].indexOf("<![") < 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === "["
                        ),
                        tailSpace = function markuppretty__tokenize_content_tailSpace(spacey) {
                            if (linepreserve > 0 && spacey.indexOf("\n") < 0 && spacey.indexOf("\r") < 0) {
                                spacey = "";
                            }
                            space = spacey;
                            return "";
                        },
                        esctest   = function markuppretty__tokenize_content_esctest() {
                            var aa = 0,
                                bb = 0;
                            if (b[a - 1] !== "\\") {
                                return false;
                            }
                            for (aa = a - 1; aa > -1; aa = aa - 1) {
                                if (b[aa] !== "\\") {
                                    break;
                                }
                                bb = bb + 1;
                            }
                            if (bb % 2 === 1) {
                                return true;
                            }
                            return false;
                        },
                        name      = "";
                    spacer();
                    attrs.push({});
                    jscom.push(false);
                    linen.push(line);
                    value.push("");
                    if (linepreserve > 0) {
                        presv.push(true);
                    } else {
                        presv.push(false);
                    }
                    if (ext === true) {
                        name = tagName(token[token.length - 1]);
                    }
                    for (a = a; a < c; a = a + 1) {
                        if (b[a] === "\n") {
                            line = line + 1;
                        }
                        // external code requires additional parsing to look for the appropriate end
                        // tag, but that end tag cannot be quoted or commented
                        if (ext === true) {
                            if (quote === "") {
                                if (b[a] === "/") {
                                    if (b[a + 1] === "*") {
                                        quote = "*";
                                    } else if (b[a + 1] === "/") {
                                        quote = "/";
                                    } else if (name === "script" && "([{!=,;.?:&<>".indexOf(b[a - 1]) > -1) {
                                        quote = "reg";
                                    }
                                } else if ((b[a] === "\"" || b[a] === "'" || b[a] === "`") && esctest() === false) {
                                    quote = b[a];
                                }
                                end = b
                                    .slice(a, a + 10)
                                    .join("")
                                    .toLowerCase();
                                if (name === "cfscript" && end === "</cfscript") {
                                    a   = a - 1;
                                    ext = false;
                                    if (lexer.length < 1) {
                                        attrs.pop();
                                        jscom.pop();
                                        linen.pop();
                                        presv.pop();
                                        value.pop();
                                        return lines.pop();
                                    }
                                    token.push(lexer.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                    daddy.push(parent[parent.length - 1][0]);
                                    begin.push(parent[parent.length - 1][1]);
                                    stats.script[0] = stats.script[0] + 1;
                                    stats.script[1] = stats.script[1] + token[token.length - 1].length;
                                    if (typeof global.prettydiff.jspretty === "function") {
                                        return types.push(name);
                                    }
                                    return types.push("content");
                                }
                                if (name === "script") {
                                    if (a === c - 9) {
                                        end = end.slice(0, end.length - 1);
                                    } else {
                                        end = end.slice(0, end.length - 2);
                                    }
                                    if (end === "</script") {
                                        a   = a - 1;
                                        ext = false;
                                        if (lexer.length < 1) {
                                            attrs.pop();
                                            jscom.pop();
                                            linen.pop();
                                            presv.pop();
                                            value.pop();
                                            return lines.pop();
                                        }
                                        token.push(lexer.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                        daddy.push(parent[parent.length - 1][0]);
                                        begin.push(parent[parent.length - 1][1]);
                                        stats.script[0] = stats.script[0] + 1;
                                        stats.script[1] = stats.script[1] + token[token.length - 1].length;
                                        if (typeof global.prettydiff.jspretty === "function") {
                                            return types.push(name);
                                        }
                                        return types.push("content");
                                    }
                                }
                                if (name === "style") {
                                    if (a === c - 8) {
                                        end = end.slice(0, end.length - 1);
                                    } else if (a === c - 9) {
                                        end = end.slice(0, end.length - 2);
                                    } else {
                                        end = end.slice(0, end.length - 3);
                                    }
                                    if (end === "</style") {
                                        a   = a - 1;
                                        ext = false;
                                        if (lexer.length < 1) {
                                            attrs.pop();
                                            jscom.pop();
                                            linen.pop();
                                            presv.pop();
                                            value.pop();
                                            return lines.pop();
                                        }
                                        token.push(lexer.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                        daddy.push(parent[parent.length - 1][0]);
                                        begin.push(parent[parent.length - 1][1]);
                                        stats.style[0] = stats.style[0] + 1;
                                        stats.style[1] = stats.style[1] + token[token.length - 1].length;
                                        if (typeof global.prettydiff.csspretty === "function") {
                                            return types.push(name);
                                        }
                                        return types.push("content");
                                    }
                                }
                            } else if (quote === b[a] && (quote === "\"" || quote === "'" || quote === "`" || (quote === "*" && b[a + 1] === "/")) && esctest() === false) {
                                quote = "";
                            } else if (quote === "`" && b[a] === "$" && b[a + 1] === "{" && esctest() === false) {
                                quote = "}";
                            } else if (quote === "}" && b[a] === "}" && esctest() === false) {
                                quote = "`";
                            } else if (quote === "/" && (b[a] === "\n" || b[a] === "\r")) {
                                quote = "";
                            } else if (quote === "reg" && b[a] === "/" && esctest() === false) {
                                quote = "";
                            } else if (quote === "/" && b[a] === ">" && b[a - 1] === "-" && b[a - 2] === "-") {
                                end = b
                                    .slice(a + 1, a + 11)
                                    .join("")
                                    .toLowerCase();
                                if (name === "cfscript" && end === "</cfscript") {
                                    quote = "";
                                }
                                end = end.slice(0, end.length - 2);
                                if (name === "script" && end === "</script") {
                                    quote = "";
                                }
                                end = end.slice(0, end.length - 1);
                                if (name === "style" && end === "</style") {
                                    quote = "";
                                }
                            }
                        }
                        if (square === true && b[a] === "]") {
                            a = a - 1;
                            spacer();
                            if (options.content === true) {
                                token.push("text");
                            } else if (options.textpreserve === true) {
                                token.push(minspace + lexer.join(""));
                                lines[lines.length - 1] = 0;
                            } else if (linepreserve > 0) {
                                token.push(minspace + lexer.join("").replace(/(\s+)$/, tailSpace));
                                lines[lines.length - 1] = 0;
                            } else {
                                token.push(lexer.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                            }
                            stats.content[0] = stats.content[0] + 1;
                            stats.content[1] = stats.content[1] + token[token.length - 1].length;
                            daddy.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            return types.push("content");
                        }

                        if (ext === false && lexer.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {
                            if (options.dustjs === true && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                                a = a + 6;
                                if (options.content === true) {
                                    token.push("text");
                                } else if (options.textpreserve === true) {
                                    token.push(minspace + lexer.join(""));
                                    lines[lines.length - 1] = 0;
                                } else {
                                    token.push(lexer.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                                }
                                stats.content[0] = stats.content[0] + 1;
                                stats.content[1] = stats.content[1] + token[token.length - 1].length;
                                types.push("content");
                                spacer();
                                attrs.push({});
                                jscom.push(false);
                                linen.push(line);
                                presv.push(false);
                                token.push("{:else}");
                                value.push("");
                                stats.template[0] = stats.template[0] + 1;
                                stats.template[1] = stats.template[1] + token[token.length - 1].length;
                                daddy.push(parent[parent.length - 1][0]);
                                begin.push(parent[parent.length - 1][1]);
                                return types.push("template_else");
                            }
                            a = a - 1;
                            if (options.content === true) {
                                token.push("text");
                            } else if (options.textpreserve === true) {
                                token.push(minspace + lexer.join(""));
                                lines[lines.length - 1] = 0;
                            } else if (linepreserve > 0) {
                                token.push(minspace + lexer.join("").replace(/(\s+)$/, tailSpace));
                                lines[lines.length - 1] = 0;
                            } else {
                                token.push(lexer.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                            }
                            stats.content[0] = stats.content[0] + 1;
                            stats.content[1] = stats.content[1] + token[token.length - 1].length;
                            daddy.push(parent[parent.length - 1][0]);
                            begin.push(parent[parent.length - 1][1]);
                            return types.push("content");
                        }
                        lexer.push(b[a]);
                    }
                    spacer();
                    if (options.content === true) {
                        token.push("text");
                    } else if (options.textpreserve === true) {
                        token.push(minspace + lexer.join(""));
                        lines[lines.length - 1] = 0;
                    } else {
                        token.push(lexer.join("").replace(/(\s+)$/, tailSpace));
                    }
                    stats.content[0] = stats.content[0] + 1;
                    stats.content[1] = stats.content[1] + token[token.length - 1].length;
                    daddy.push(parent[parent.length - 1][0]);
                    begin.push(parent[parent.length - 1][1]);
                    return types.push("content");
                };

            for (a = 0; a < c; a = a + 1) {
                if ((/\s/).test(b[a]) === true) {
                    space = space + b[a];
                    if (b[a] === "\n") {
                        line = line + 1;
                    }
                } else if (ext === true) {
                    content();
                } else if (b[a] === "<") {
                    tag("");
                } else if (b[a] === "[" && b[a + 1] === "%") {
                    tag("%]");
                } else if (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                    tag("");
                } else if (b[a] === "]" && sgmlflag > 0) {
                    tag("]>");
                } else if (b[a] === "-" && b[a + 1] === "-" && b[a + 2] === "-" && options.jekyll === true) {
                    tag("---");
                } else if (b[a] === "#" && options.apacheVelocity === true && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false && ((/\w/).test(b[a + 1]) === true || b[a + 1] === "*" || b[a + 1] === "#" || (b[a + 1] === "[" && b[a + 2] === "["))) {
                    tag("");
                } else if (b[a] === "$" && options.apacheVelocity === true && (/\d/).test(b[a + 1]) === false && (/\s/).test(b[a + 1]) === false && b[a + 1] !== "$" && b[a + 1] !== "=" && b[a + 1] !== "[") {
                    tag("");
                } else {
                    content();
                }
            }
            lines[0] = 0;
        }());

        if (token.length === 0) {
            if (options.nodeasync === true) {
                return [options.source, "Error: source does not appear to be markup."];
            }
            if (global.prettydiff.meta === undefined) {
                global.prettydiff.meta = {};
            }
            global.prettydiff.meta.error = "Error: source does not appear to be markup.";
            return options.source;
        }

        globalerror = (function markuppretty__globalerror() {
            var startend = stats.start[0] - stats.end[0],
                error    = "";
            if (startend > 0) {
                error = startend + " more start tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + " than start tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + "!";
                return error;
            } else if (startend < 0) {
                startend = startend * -1;
                error    = startend + " more end tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + " than start tag";
                if (startend > 1) {
                    error = error + "s";
                }
                error = error + "!";
                return error;
            } else {
                return "";
            }
        }());

        if (options.nodeasync === false) {
            if (global.prettydiff.meta === undefined) {
                global.prettydiff.meta       = {};
                global.prettydiff.meta.error = "";
            }
            if (global.prettydiff.meta.error === "") {
                global.prettydiff.meta.error = globalerror;
            }
        }

        if (options.mode === "parse") {
            return (function markuppretty__parse() {
                var a        = 0,
                    c        = token.length,
                    record   = [],
                    wspace   = "",
                    data     = {},
                    def      = {
                        attrs: "array - List of attributes (if any) for the given token.",
                        begin: "number - Index where the parent element occurs.",
                        daddy: "string - Tag name of the parent element. Tokens of type 'template_start' are n" +
                                "ot considered as parent elements.  End tags reflect their matching start tag.",
                        jscom: "boolean - Whether the token is a JavaScript comment if in JSX format.",
                        linen: "number - The line number in the original source where the token started, which" +
                                " is used for reporting and analysis.",
                        lines: "number - Whether the token is preceeded any space and/or line breaks in the or" +
                                "iginal code source.",
                        presv: "boolean - Whether the token is preserved verbatim as found.  Useful for commen" +
                                "ts and HTML 'pre' tags.",
                        token: "string - The parsed code tokens.",
                        types: "string - Data types of the tokens: cdata, comment, conditional, content, end, " +
                                "ignore, linepreserve, script, sgml, singleton, start, template, template_else," +
                                " template_end, template_start, xml",
                        value: "string - The attribute's value if the current type is attribute"
                    },
                    //white space token to insertion logic
                    insert   = function markuppretty__parse_insert(string) {
                        if (types[a] === "content") {
                            token[a] = string + token[a];
                            return;
                        }
                        if (types[a - 1] === "content" && token[a] !== "content") {
                            token[a - 1] = token[a - 1] + string;
                            return;
                        }
                        attrs.splice(a, 0, {});
                        begin.splice(a, 0, begin[a]);
                        daddy.splice(a, 0, daddy[a]);
                        jscom.splice(a, 0, false);
                        linen.splice(a, 0, linen[a]);
                        lines.splice(a, 0, 1);
                        presv.splice(a, 0, false);
                        token.splice(a, 0, string);
                        types.splice(a, 0, "content");
                        value.splice(a, 0, "");
                        c = c + 1;
                        a = a + 1;
                    },
                    attApply = function markuppretty__parse_attApply(atty) {
                        var string = "",
                            xlen   = atty.length,
                            xind   = 0,
                            toke   = token[a],
                            atts   = "";
                        for (xind = 0; xind < xlen; xind = xind + 1) {
                            if (attrs[a][atty[xind]] === "") {
                                atts = atts + " " + atty[xind];
                            } else {
                                atts = atts + " " + atty[xind] + "=" + attrs[a][atty[xind]];
                            }
                        }
                        if (presv[a] === true) {
                            token[a] = toke.replace(" ", atts);
                        } else {
                            string   = ((/(\/>)$/).test(toke) === true)
                                ? "/>"
                                : ">";
                            xlen     = (string === "/>")
                                ? 3
                                : 2;
                            token[a] = (toke.slice(0, toke.length - xlen) + atts + string);
                        }
                    };
                if (options.attributetoken === true) {
                    delete def.attrs;
                } else {
                    delete def.value;
                }
                for (a = 0; a < c; a = a + 1) {
                    wspace = "";
                    record = Object.keys(attrs[a]);
                    if (record.length > 0 && options.unformatted === false) {
                        attApply(record);
                    }
                    if (token[a] === "</prettydiffli>") {
                        if (options.correct === true) {
                            token[a] = "</li>";
                        } else {
                            attrs.splice(a, 1);
                            begin.splice(a, 1);
                            daddy.splice(a, 1);
                            jscom.splice(a, 1);
                            linen.splice(a, 1);
                            lines.splice(a, 1);
                            presv.splice(a, 1);
                            token.splice(a, 1);
                            types.splice(a, 1);
                            value.splice(a, 1);
                            a = a - 1;
                            c = c - 1;
                        }
                    }
                    if (options.parseFormat !== "htmltable") {
                        if (types[a] === "script") {
                            options.source = token[a];
                            token[a]       = extlib("script");
                        } else if (types[a] === "style") {
                            options.source = token[a];
                            token[a]       = extlib("style");
                        }
                    }
                    if (options.parseSpace === true) {
                        if (lines[a] > 1) {
                            if (options.preserve > 1) {
                                if (options.parseFormat === "htmltable") {
                                    wspace = "(empty line)";
                                } else {
                                    wspace = lf + lf;
                                }
                            } else if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                                wspace = " ";
                            }
                        } else if (lines[a] === 1) {
                            if (types[a] === "singleton" || types[a] === "content" || types[a] === "template") {
                                wspace = " ";
                            } else if (types[a] !== types[a - 1] && (types[a - 1] === "singleton" || types[a - 1] === "content" || types[a - 1] === "template")) {
                                wspace = " ";
                            }
                        }
                        if (wspace !== "") {
                            if (wspace === " " && options.parseFormat === "htmltable") {
                                wspace = "(space)";
                            }
                            insert(wspace);
                        }
                    }
                }
                if (options.parseFormat === "sequential") {
                    if (options.attributetoken === true) {
                        def.order = "[token, types, value, lines, linen, jscom, presv, daddy, begin]";
                    } else {
                        def.order = "[token, types, attrs, lines, linen, jscom, presv, daddy, begin]";
                    }
                    for (a = 0; a < c; a = a + 1) {
                        if (options.attributetoken === true) {
                            record.push([
                                token[a],
                                types[a],
                                value[a],
                                lines[a],
                                linen[a],
                                jscom[a],
                                presv[a],
                                daddy[a],
                                begin[a]
                            ]);
                        } else {
                            record.push([
                                token[a],
                                types[a],
                                attrs[a],
                                lines[a],
                                linen[a],
                                jscom[a],
                                presv[a],
                                daddy[a],
                                begin[a]
                            ]);
                        }
                    }
                    if (options.nodeasync === true) {
                        return [
                            {
                                data      : record,
                                definition: def
                            },
                            globalerror
                        ];
                    }
                    return {data: record, definition: def};
                }
                if (options.parseFormat === "htmltable") {
                    return (function markuppretty__parse_html() {
                        var report = [],
                            header = "<tr class=\"header\"><th>index</th><th>token</th><th>types</th>",
                            aa     = 0,
                            len    = 0;
                        if (options.attributetoken === true) {
                            header = header + "<th>value</th>";
                        } else {
                            header = header + "<th>attrs</th>";
                        }
                        header = header + "<th>linen</th><th>jscom</th><th>presv</th><th>daddy</th><th>" +
                                "begin</th><th>lines</th></tr>";
                        report.push("<table summary='markup parse table'><thead>");
                        report.push(header);
                        report.push("</thead><tbody>");
                        len = token.length;
                        for (aa = 0; aa < len; aa = aa + 1) {
                            if (types[aa] === "script") {
                                options.source = token[aa];
                                report.push("<tr><td colspan=\"10\" class=\"nested\">");
                                report.push(extlib("script"));
                                report.push("</td></tr>");
                                report.push("<tr><th colspan=\"10\" class=\"nested\">Markup tokens</th></tr>");
                                report.push(header);
                            } else if (types[aa] === "style") {
                                options.source = token[aa];
                                report.push("<tr><td colspan=\"10\" class=\"nested\">");
                                report.push(extlib("style"));
                                report.push("</td></tr>");
                                report.push("<tr><th colspan=\"10\" class=\"nested\">Markup tokens</th></tr>");
                                report.push(header);
                            } else {
                                report.push("<tr><td>");
                                report.push(aa);
                                report.push("</td><td style=\"white-space:pre\">");
                                report.push(
                                    token[aa].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                );
                                report.push("</td><td>");
                                report.push(types[aa]);
                                report.push("</td>");
                                if (options.attributetoken === true) {
                                    report.push("<td style=\"white-space:pre\">");
                                    report.push(
                                        value[aa].replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                    );
                                    report.push("</td><td>");
                                } else {
                                    report.push("<td style=\"white-space:pre\">");
                                    report.push(
                                        JSON.stringify(attrs[aa]).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;")
                                    );
                                    report.push("</td><td>");
                                }
                                report.push(linen[aa]);
                                report.push("</td><td>");
                                report.push(jscom[aa]);
                                report.push("</td><td>");
                                report.push(presv[aa]);
                                report.push("</td><td>");
                                report.push(daddy[aa]);
                                report.push("</td><td>");
                                report.push(begin[aa]);
                                report.push("</td><td>");
                                report.push(lines[aa]);
                                report.push("</td></tr>");
                            }
                        }
                        report.push("</tbody></table>");
                        if (options.nodeasync === true) {
                            return [
                                {
                                    data      : report.join(""),
                                    definition: def
                                },
                                globalerror
                            ];
                        }
                        return {data: report.join(""), definition: def};
                    }());
                }
                if (options.attributetoken === true) {
                    data.value = value;
                } else {
                    data.attrs = attrs;
                }
                data.begin = begin;
                data.daddy = daddy;
                data.jscom = jscom;
                data.linen = linen;
                data.lines = lines;
                data.presv = presv;
                data.token = token;
                data.types = types;
                if (options.nodeasync === true) {
                    return [
                        {
                            data      : data,
                            definition: def
                        },
                        globalerror
                    ];
                }
                return {data: data, definition: def};
            }());
        }

        if (options.mode === "minify") {
            (function markuppretty__minify() {
                var a      = 0,
                    c      = token.length,
                    script = function markuppretty__minify_script() {
                        options.source = token[a];
                        token[a]       = extlib("script");
                        level.push(-20);
                    },
                    style  = function markuppretty__minify_style() {
                        options.source = token[a];
                        token[a]       = extlib("style");
                        level.push(-20);
                    };
                for (a = 0; a < c; a = a + 1) {
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
                            level.push(-20);
                        }
                    } else {
                        level.push(-20);
                    }
                }
            }());
        }

        output = (function markuppretty__beautify() {
            var a            = 0,
                c            = token.length,
                lprescount   = [],
                ltype        = "",
                lline        = 0,
                indent       = options.inlevel,
                cdataS       = "",
                cdataE       = "",
                commentS     = "",
                commentE     = "",
                cdataStart   = (/^(\s*(\/)*<!?\[+[A-Z]+\[+)/),
                cdataEnd     = (/((\/)*\]+>\s*)$/),
                commentStart = (/^(\s*<!--)/),
                commentEnd   = (/((\/\/)?-->\s*)$/),
                tabs         = "",
                twigStart    = (/^(\{%\s+)/),
                twigEnd      = (/(\s%\})$/),
                xslline      = function markuppretty__beautify_xslline() {
                    var tname = false;
                    if (lines[a] > 1 || (types[a] !== "start" && types[a] !== "singleton") || (types[a - 1] === "comment" && lines[a - 1] > 1)) {
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
                    var b   = options.insize,
                        ind = [];
                    for (b = b; b > 0; b = b - 1) {
                        ind.push(options.inchar);
                    }
                    return new RegExp("^(" + ind.join("") + "+)");
                }()),
                end          = function markuppretty__beautify_end() {
                    var b = 0;
                    indent = indent - 1;
                    if ((types[a] === "end" && ltype === "start") || (types[a] === "template_end" && ltype === "template_start") || (options.jsx === true && (/^\s+\{/).test(token[a - 1]) === true && lines[a] === 0)) {
                        return level.push(-20);
                    }
                    if (lines[a] < 1 && options.html === true && a > 0 && tagName(token[a - 1]) === "/span") {
                        b = a;
                        do {
                            b = b - 1;
                        } while (lines[b] < 1);
                        if (types[b] === "content" || types[b] === "singleton" || types[b] === "start" || types[b] === "comment" || types[b].indexOf("template") > -1) {
                            level[a - 1] = -20;
                            return level.push(-20);
                        }
                    }
                    if (options.force_indent === false) {
                        if (lines[a] === 0 && (ltype === "singleton" || ltype === "content" || (ltype === "template" && types[a] !== "template_end"))) {
                            return level.push(-20);
                        }
                        if (ltype === "comment") {
                            for (b = a - 1; b > -1; b = b - 1) {
                                if (types[b] !== "comment") {
                                    if (lines[b + 1] === 0 && (types[b] === "singleton" || types[b] === "content" || ltype === "template")) {
                                        for (b = b + 1; b < a; b = b + 1) {
                                            level[b] = -20;
                                        }
                                        return level.push(-20);
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
                    var b       = 0,
                        spanfix = function markuppretty__beautify_content_spanfix() {
                            b = b - 1;
                            if (types[b] === "comment") {
                                do {
                                    b = b - 1;
                                } while (b > 0 && types[b] === "comment" && lines[b] < 1);
                            }
                            if (lines[b] === 0 && tagName(token[b]) === "span" && (tagName(token[b - 1]) === "span" || tagName(token[b - 1]) === "/span")) {
                                do {
                                    level[b] = -20;
                                    b        = b - 1;
                                } while (
                                    b > 0 && lines[b] < 1 && (tagName(token[b]) === "span" || types[b] === "comment")
                                );
                            }
                        };
                    if (lines[a] === 0 && options.force_indent === false && (presv[a] === false || types[a] !== "content")) {
                        if (ltype === "comment" && lline === 0) {
                            for (b = a - 1; b > -1; b = b - 1) {
                                if (types[b - 1] !== "comment" && types[b] === "comment") {
                                    if (lines[b] === 0) {
                                        for (b = b; b < a; b = b + 1) {
                                            level[b] = -20;
                                        }
                                        if (options.html === true && tagName(token[begin[a]]) === "span") {
                                            spanfix();
                                        }
                                        return level.push(-20);
                                    }
                                    return level.push(indent);
                                }
                                if (lines[b] > 0) {
                                    return level.push(indent);
                                }
                            }
                            return level.push(indent);
                        }
                        level.push(-20);
                        if (options.html === true && begin[a] > -1 && tagName(token[begin[a]]) === "span") {
                            b = a;
                            spanfix();
                        }
                    } else {
                        level.push(indent);
                    }
                },
                script       = function markuppretty__beautify_script(twig) {
                    var list    = [],
                        source  = "",
                        twigfix = function markuppretty__beautify_script_twigfix(item) {
                            var fixnumb = function markupretty__beautify_script_twigfix_fixnumb(xx) {
                                return xx.replace(". .", "..");
                            };
                            item = item
                                .replace(tab, "")
                                .replace(/\)\s*and\s*\(/g, ") and (")
                                .replace(/in\u0020?\(?\d+\.\u0020\.\d\(?/g, fixnumb);
                            if (options.correct === true) {
                                item = item.replace(/;$/, "") + " %}";
                            } else {
                                item = item + " %}";
                            }
                            return "{% " + item;
                        },
                        inle    = options.inlevel,
                        mode    = options.mode;
                    if (twig === true) {
                        options.twig = true;
                        token[a]     = token[a]
                            .replace(twigStart, "")
                            .replace(twigEnd, "");
                    }
                    stats.script[0] = stats.script[0] + 1;
                    stats.script[1] = stats.script[1] + token[a]
                        .replace(/\s+/g, " ")
                        .length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    source          = token[a].replace(/^(\s+)/, "");
                    options.source  = source;
                    options.inlevel = (options.style === "noinde")
                        ? 0
                        : indent;
                    options.mode    = "beautify";
                    token[a]        = extlib("script");
                    options.inlevel = inle;
                    options.mode    = mode;
                    options.twig    = false;
                    list            = tab.exec(token[a]);
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
                        token[a] = token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + lf + tabs + commentE;
                        commentE = "";
                    }
                    if ((/^(\s+\{)/).test(token[a]) === true && options.jsx === true) {
                        if (ltype === "content" || ltype === "singleton" || ltype === "template") {
                            token[a] = token[a].replace(/^(\s+)/, "");
                            if (lines[a] < 1) {
                                level.push(-20);
                            } else {
                                level.push(-10);
                            }
                        } else {
                            token[a] = token[a].replace(/^(\s+)/, "");
                            if (lines[a] === 0) {
                                level.push(-20);
                            } else {
                                level.push(indent);
                                token[a] = token[a].replace(/(\r?\n\})$/, lf + tabs + "}");
                            }
                        }
                        if (token[a].indexOf(";") < 0 && token[a].replace(/^(\{\s+)/, "").replace(/(\s+\})$/, "").indexOf("\n") < 0) {
                            token[a] = token[a]
                                .replace(/^(\{\s+)/, "{")
                                .replace(/(\s+\})$/, "}");
                        }
                    } else if (twig === true) {
                        token[a] = twigfix(token[a]);
                    } else if (twig === true && lines[a] === 0) {
                        level.push(-20);
                        types[a] = "singleton";
                    } else {
                        level.push(0);
                    }
                },
                style        = function markuppretty__beautify_style() {
                    var list = [],
                        inle = options.inlevel,
                        mode = options.mode;
                    stats.style[0] = stats.style[0] + 1;
                    stats.style[1] = stats.style[1] + token[a]
                        .replace(/\s+/g, " ")
                        .length;
                    if (cdataStart.test(token[a]) === true) {
                        cdataS   = cdataStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(cdataStart, "");
                    } else if (commentStart.test(token[a]) === true) {
                        commentS = commentStart
                            .exec(token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        token[a] = token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(token[a]) === true) {
                        cdataE   = cdataEnd.exec(token[a])[0];
                        token[a] = token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(token[a]) === true) {
                        commentE = commentEnd.exec(token[a])[0];
                        token[a] = token[a].replace(commentEnd, "");
                    }
                    options.inlevel = (options.style === "noindent")
                        ? 0
                        : indent;
                    options.mode    = "beautify";
                    options.source  = token[a].replace(/^(\s+)/, "");
                    token[a]        = extlib("style");
                    options.inlevel = inle;
                    options.mode    = mode;
                    list            = tab.exec(token[a]);
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
                        token[a] = token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + lf + tabs + commentE;
                        commentE = "";
                    }
                    token[a] = token[a].replace(/(\s+)$/, "");
                    level.push(0);
                },
                apply        = function markuppretty__beautify_apply() {
                    var x            = 0,
                        y            = level.length,
                        build        = [],
                        attrib       = [],
                        //tab builds out the character sequence for one step of indentation
                        ind          = (function markuppretty__beautify_apply_tab() {
                            var aa   = 0,
                                indy = [options.inchar],
                                size = options.insize - 1;
                            for (aa = 0; aa < size; aa = aa + 1) {
                                indy.push(options.inchar);
                            }
                            return indy.join("");
                        }()),
                        // a new line character plus the correct amount of identation for the given line
                        // of code
                        nl           = function markuppretty__beautify_apply_nl(indy, item) {
                            var aa          = 0,
                                indentation = [lf];
                            if (options.mode === "minify") {
                                return build.push(lf);
                            }
                            if (indy === -10) {
                                item.push(" ");
                            } else if (indy > -9) {
                                if (lines[x] > 1 && item === build) {
                                    do {
                                        lines[x] = lines[x] - 1;
                                        indentation.push(lf);
                                    } while (lines[x] > 1);
                                }
                                for (aa = 0; aa < indy; aa = aa + 1) {
                                    indentation.push(ind);
                                }
                                item.push(indentation.join(""));
                            }
                        },
                        // populates attributes onto start and singleton tags it also checks to see if a
                        // tag or content should wrap
                        wrapper      = function markuppretty__beautify_apply_wrapper() {
                            var b      = 0,
                                len    = 0,
                                xlen   = 0,
                                list   = attrib,
                                lev    = level[x],
                                atty   = "",
                                string = "",
                                indy   = "",
                                name   = "",
                                text   = [],
                                tname  = tagName(token[x]);
                            if (lev === -20) {
                                b = x;
                                do {
                                    b    = b - 1;
                                    lev  = level[b];
                                    xlen = xlen + token[b].length;
                                } while (lev === -20 && b > -1);
                                if (lev === -20) {
                                    lev = 1;
                                }
                            }
                            if (lev === 0) {
                                lev = lev + options.inlevel;
                            }
                            if (list.length > 0) {
                                if (options.force_attribute === true) {
                                    len = list.length;
                                    text.push(list[0]);
                                    if (len > 1) {
                                        b = 1;
                                        do {
                                            nl(lev + 1, text);
                                            text.push(list[b]);
                                            b = b + 1;
                                        } while (b < len);
                                        b = 0;
                                    }
                                    atty = text.join("");
                                    text = [];
                                } else {
                                    atty = list.join(" ");
                                }
                                if ((types[x] === "template_start" || types[x] === "template" || types[x] === "template_else") && options.jsx === false) {
                                    len = list.length;
                                    for (b = 0; b < len; b = b + 1) {
                                        xlen = list[b].indexOf("{");
                                        if (list[b].indexOf("}") > xlen && xlen > 0) {
                                            options.source  = list[b].slice(xlen, list[b].indexOf("}") + 1);
                                            options.inlevel = lev;
                                            list[b]         = list[b].slice(0, xlen) + extlib("script").replace(/^(\s+)/, "") +
                                                    list[b].slice(list[b].indexOf("}") + 1);
                                        }
                                    }
                                }
                                indy   = (function markuppretty__beautify_apply_wrapper_indy() {
                                    var atline = lf,
                                        atnum  = lev + 1;
                                    do {
                                        atline = atline + ind;
                                        atnum  = atnum - 1;
                                    } while (atnum > 0);
                                    return atline;
                                }());
                                string = tagName(token[x]);
                                len    = string.length + 3 + atty.length;
                                if (token[x].charAt(token[x].length - 2) === "/") {
                                    len = len + 1;
                                }
                                if (wrap === 0 || len <= wrap || tname === "cfset" || tname === "cfreturn" || tname === "cfif" || tname === "cfelseif") {
                                    if (presv[x] === true) {
                                        token[x] = token[x].replace(" ", " " + atty);
                                    } else {
                                        string = ((/(\/>)$/).test(token[x]) === true)
                                            ? "/>"
                                            : ">";
                                        xlen   = (string === "/>")
                                            ? 3
                                            : 2;
                                        name   = token[x].slice(1, token[x].length - xlen);
                                        if (options.force_attribute === true) {
                                            token[x] = "<" + name + indy + atty + string;
                                        } else {
                                            token[x] = "<" + name + " " + atty + string;
                                        }
                                    }
                                    if (types[x] === "singleton" || types[x] === "template") {
                                        if (options.spaceclose === true) {
                                            token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                                        } else {
                                            token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                                        }
                                    }
                                    return;
                                }
                                text.push(token[x].slice(0, token[x].indexOf(" ")));
                                len = list.length;
                                for (b = 0; b < len; b = b + 1) {
                                    nl(lev + 1, text);
                                    text.push(list[b]);
                                }
                                text.push(token[x].slice(token[x].indexOf(" ") + 1));
                                token[x] = text.join("");
                                if (types[x] === "singleton" || types[x] === "template") {
                                    if ((/(>\}+\/>)$/).test(token[x]) === true) {
                                        b    = 0;
                                        atty = lf;
                                        if (lev > 1) {
                                            do {
                                                atty = atty + ind;
                                                b    = b + 1;
                                            } while (b < lev);
                                            atty = atty + ind + "}" + atty + "/>";
                                        } else {
                                            atty = atty + "}/>";
                                        }
                                        token[x] = token[x].replace(/(\u0020*\}\u0020*\/>)$/, atty);
                                    } else if (options.spaceclose === true) {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                                    } else {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                                    }
                                }
                            } else {
                                list = token[x]
                                    .replace(/\s+/g, " ")
                                    .split(" ");
                                len  = list.length;
                                if (level[x] === -20 && types[x - 1] === "end") {
                                    b   = x - 1;
                                    lev = 1;
                                    do {
                                        b = b - 1;
                                        if (types[b] === "start") {
                                            lev = lev - 1;
                                        } else if (types[b] === "end") {
                                            lev = lev + 1;
                                        }
                                    } while (lev > 0 && b > 0);
                                    lev = level[b];
                                }
                                for (b = 0; b < len; b = b + 1) {
                                    string = string + list[b];
                                    if (list[b + 1] !== undefined && string.length + list[b + 1].length + 1 > wrap - xlen) {
                                        text.push(string);
                                        xlen = 0;
                                        if (level[x] === -20 && types[x - 1] !== "end") {
                                            nl(lev + 1, text);
                                        } else {
                                            nl(lev, text);
                                        }
                                        string = "";
                                    } else {
                                        string = string + " ";
                                    }
                                }
                                text.push(string.replace(/\s$/, ""));
                                token[x] = text.join("");
                                if (types[x] === "singleton") {
                                    if (options.spaceclose === true) {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                                    } else {
                                        token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                                    }
                                }
                            }
                        },
                        // JSX tags may contain comments, which are captured as attributes in this
                        // parser.  These attributes demand unique care to be correctly applied.
                        attrcom      = function markuppretty__beautify_apply_attrcom() {
                            var toke  = token[x].split(" "),
                                attr  = attrib,
                                len   = attr.length,
                                ilen  = 0,
                                item  = [toke[0]],
                                temp  = [],
                                tempx = [],
                                index = 0,
                                b     = 0,
                                xx    = 0,
                                yy    = 0;
                            nl(level[x], build);
                            for (b = 0; b < len; b = b + 1) {
                                index = attr[b].indexOf("\n");
                                if (index > 0 && index !== attr[b].length - 1 && attr[b].indexOf("/*") === 0) {
                                    temp = (lf === "\r\n")
                                        ? attr[b].split("\r\n")
                                        : attr[b].split("\n");
                                    yy   = temp.length;
                                    for (xx = 0; xx < yy; xx = xx + 1) {
                                        if (temp[xx] === "") {
                                            temp[xx] = lf;
                                        } else {
                                            nl(level[x] + 1, tempx);
                                            tempx.push(temp[xx].replace(/^(\s+)/, ""));
                                        }
                                    }
                                    tempx.push(lf);
                                    attr[b] = tempx.join("");
                                }
                                if (b > 0 && attr[b - 1].charAt(attr[b - 1].length - 1) === "\n" && (/^(\s*\/\/)/).test(attr[b]) === false) {
                                    nl(level[x] + 1, item);
                                    ilen       = item.length - 1;
                                    item[ilen] = item[ilen].slice(1);
                                } else if ((/^\s/).test(attr[b]) === false && (/^(\s*\/\/)/).test(attr[b - 1]) === false) {
                                    item.push(" ");
                                }
                                item.push(attr[b]);
                            }
                            if (attr[len - 1].charAt(attr[len - 1].length - 1) === "\n") {
                                nl(level[x], item);
                                ilen       = item.length - 1;
                                item[ilen] = item[ilen].slice(1);
                            }
                            item.push(toke[1]);
                            build.push(item.join(""));
                        },
                        jsxattribute = function markuppretty__beautify_apply_jsxattribute() {
                            var attr     = Object.keys(attrs[x]),
                                b        = 0,
                                yy       = 0,
                                xx       = attr.length,
                                inlevel  = (level[x] < 1)
                                    ? options.inlevel + 1
                                    : level[x] + 1,
                                builder  = "",
                                inle     = options.inlevel,
                                mode     = options.mode,
                                vertical = options.vertical;
                            for (b = 0; b < xx; b = b + 1) {
                                if (attrs[x][attr[b]].charAt(0) === "{") {
                                    options.mode      = "beautify";
                                    options.inlevel   = inlevel;
                                    options.source    = attrs[x][attr[b]].slice(1, attrs[x][attr[b]].length - 1);
                                    options.vertical  = (
                                        options.vertical === "jsonly" || options.vertical === true || options.vertical === "true"
                                    );
                                    attrs[x][attr[b]] = extlib("script");
                                    options.mode      = mode;
                                    options.inlevel   = inle;
                                    options.vertical  = vertical;
                                    attrib[b]         = attr[b] + "={" + attrs[x][attr[b]].replace(/^\s+/, "") + "}";
                                } else if (attr[b].charAt(0) === "/" && attr[b].charAt(1) === "/" && attr[b].charAt(attr[b].length - 1) === "\n") {
                                    builder = "";
                                    yy      = inlevel;
                                    do {
                                        builder = builder + ind;
                                        yy      = yy - 1;
                                    } while (yy > 0);
                                    if (b < attrib.length - 1) {
                                        builder = lf + builder + attr[b].slice(0, attr[b].length - 1) + lf +
                                                builder;
                                    } else {
                                        builder = lf + builder + attr[b].slice(0, attr[b].length - 1) + lf;
                                    }
                                    attrib[b] = builder;
                                }
                            }
                        },
                        linepreserve = function markuppretty__beautify_apply_linepreserve() {
                            var str  = token[x]
                                    .replace(/\r\n/g, "\n")
                                    .replace(/^(\n)/, ""),
                                item = str.split("\n"),
                                aa   = 0,
                                bb   = item.length,
                                out  = [],
                                taby = new RegExp("^(" + ind + "+)");
                            lines[x] = 1;
                            for (aa = 0; aa < bb; aa = aa + 1) {
                                item[aa] = item[aa]
                                    .replace(/^(\s+)/, "")
                                    .replace(taby, "");
                                if (item[aa] === "" && item[aa - 1] !== "" && aa < bb - 1) {
                                    nl(0, out);
                                } else if (item[aa] !== "") {
                                    if (aa > 0) {
                                        nl(level[x], out);
                                    }
                                    if (item[aa].indexOf(ind) === 0) {
                                        do {
                                            item[aa] = item[aa].slice(ind.length);
                                        } while (item[aa].indexOf(ind) === 0);
                                    }
                                    out.push(item[aa].replace(/(\s+)$/, ""));
                                }
                            }
                            if (out[out.length - 1] === "") {
                                out.pop();
                            }
                            if (types[x + 1] === "template_end" && out[out.length - 1].indexOf(ind) > 0 && (/^(\s+)$/).test(out[out.length - 1]) === false) {
                                out.pop();
                            }
                            token[x] = out.join("");
                        },
                        attArray     = function markuppretty__beautify_apply_attArray() {
                            var list = Object.keys(attrs[x]),
                                len  = list.length,
                                b    = 0,
                                attr = [];
                            if (len < 1) {
                                return [];
                            }
                            do {
                                if (attrs[x][list[b]] === "") {
                                    attr.push(list[b]);
                                } else {
                                    attr.push(list[b] + "=" + attrs[x][list[b]]);
                                }
                                b = b + 1;
                            } while (b < len);
                            return attr;
                        };
                    for (x = 0; x < y; x = x + 1) {
                        attrib = attArray();
                        if (options.jsx === true && attrib.length > 0) {
                            jsxattribute();
                        }
                        if (jscom[x] === true) {
                            attrcom();
                        } else if (types[x] === "content" && x < y - 1) {
                            if (presv[x] === true) {
                                linepreserve();
                            } else if (wrap > 0 && token[x].length > wrap && (options.mode === "beautify" || options.mode === "diff")) {
                                wrapper();
                            }
                        } else if (types[x] !== "content" && options.unformatted === false && (options.mode === "beautify" || options.mode === "diff") && presv[x] === false && (attrib.length > 0 || (wrap > 0 && token[x].length > wrap)) && (types[x] === "content" || types[x] === "start" || types[x] === "singleton" || types[x] === "template_start" || types[x] === "template" || types[x] === "comment") && (types[x] !== "singleton" || token[x].charAt(0) !== "{")) {
                            wrapper();
                        } else if (options.unformatted === false && attrib.length > 0) {
                            token[x] = token[x].replace(" ", " " + attrib.join(" "));
                        } else if (types[x] === "singleton") {
                            if (options.spaceclose === true) {
                                token[x] = token[x].replace(/(\u0020*\/>)$/, " />");
                            } else {
                                token[x] = token[x].replace(/(\u0020*\/>)$/, "/>");
                            }
                        }
                        if (token[x] === "</prettydiffli>" && options.correct === true) {
                            token[x] = "</li>";
                        }
                        if (token[x] !== "</prettydiffli>" && jscom[x] === false) {
                            if ((types[x] === "template" || types[x] === "template_start") && types[x - 1] === "content" && presv[x - 1] === true && options.mode === "beautify" && level[x] === -20) {
                                build.push(" ");
                            }
                            if (level[x] > -9) {
                                if (options.mode === "minify") {
                                    build.push(" ");
                                } else {
                                    nl(level[x], build);
                                }
                            } else if (level[x] === -10) {
                                build.push(" ");
                            }
                            build.push(token[x]);
                        }
                    }
                    if (build[0] === lf || build[0] === " ") {
                        build[0] = "";
                    }
                    if (options.newline === true) {
                        if (options.crlf === true) {
                            build.push("\r\n");
                        } else {
                            build.push("\n");
                        }
                    }
                    if (options.nodeasync === true) {
                        return [build.join(""), globalerror];
                    }
                    return build.join("");
                };

            if (options.mode !== "minify") {
                for (a = 0; a < c; a = a + 1) {
                    if (twigStart.test(token[a]) === true && twigEnd.test(token[a]) === true && (a === 0 || (tagName(token[a - 1]) !== "script" && tagName(token[a - 1]) !== "style")) && (/\D-+\D/).test(token[a]) === false && (/^(\{%\s*((comment)|(else))\s*)/).test(token[a]) === false) {
                        script(true);
                    }
                    if (types[a] === "start") {
                        level.push(indent);
                        indent = indent + 1;
                        xslline();
                    } else if (types[a] === "template_start" || types[a] === "linepreserve") {
                        if (types[a] === "linepreserve") {
                            lprescount.push(tagName(token[a]));
                        }
                        level.push(indent);
                        indent = indent + 1;
                    } else if (types[a] === "template_else") {
                        level.push(indent - 1);
                    } else if (types[a] === "end") {
                        end();
                    } else if (types[a] === "template_end") {
                        if (lprescount.length > 0 && tagName(token[a]) === "/" + lprescount[lprescount.length - 1]) {
                            lprescount.pop();
                        }
                        end();
                    } else if (lines[a] === 0 && (types[a] === "singleton" || types[a] === "content" || types[a] === "template")) {
                        if (types[a] === "content" && options.textpreserve === true) {
                            level.push(-20);
                        } else {
                            content();
                        }
                        xslline();
                    } else if (types[a] === "script" || types[a] === "cfscript") {
                        script(false);
                    } else if (types[a] === "style") {
                        style();
                    } else if (types[a] === "comment" && options.comments === "noindent") {
                        level.push(0);
                    } else if (types[a] === "linepreserve") {
                        level.push(indent);
                    } else {
                        level.push(indent);
                        xslline();
                    }
                    if (types[a] !== "content" && types[a] !== "comment" && types[a - 1] === "content" && types[a - 2] !== "linepreserve" && lprescount.length > 0) {
                        level[a] = -20;
                    }
                    if (lines[a] === 0 && (ltype === "content" || (ltype === "script" && token[a - 1].charAt(0) === "{" && options.jsx === true))) {
                        level[a] = -20;
                    }
                    ltype = types[a];
                    lline = lines[a];
                }
            }
            level[0] = 0;
            return apply();
        }());

        if (options.mode === "analysis") {
            options.accessibility = true;
            return (function markuppretty__beautify_apply_summary() {
                var len           = token.length,
                    sum           = [],
                    data          = {
                        violations: 0
                    },
                    numformat     = function markuppretty__beautify_apply_summary_numformat(x) {
                        var y    = String(x).split(""),
                            z    = 0,
                            xlen = y.length,
                            dif  = 0;
                        if (xlen % 3 === 2) {
                            dif = 2;
                        } else if (xlen % 3 === 1) {
                            dif = 1;
                        }
                        for (z = xlen - 1; z > 0; z = z - 1) {
                            if ((z % 3) - dif === 0) {
                                y[z] = "," + y[z];
                            }
                        }
                        return y.join("");
                    },
                    analysis      = function markuppretty__beautify_apply_summary_analysis(arr) {
                        var x       = arr.length,
                            idtest  = (arr === ids),
                            y       = 0,
                            adata   = [],
                            content = [];
                        if (x > 0) {
                            arr = safeSort(arr);
                            for (y = 0; y < x; y = y + 1) {
                                if (arr[y] === arr[y + 1]) {
                                    if (idtest === true && (adata.length === 0 || adata[adata.length - 1][1] !== arr[y])) {
                                        adata.push([
                                            2, arr[y]
                                        ]);
                                    }
                                    if (adata.length > 0) {
                                        adata[adata.length - 1][0] = adata[adata.length - 1][0] + 1;
                                    }
                                } else if (idtest === false) {
                                    adata.push([
                                        1, arr[y]
                                    ]);
                                }
                            }
                            x = adata.length;
                            if (idtest === true) {
                                if (x === 0) {
                                    return "";
                                }
                                content.push("<h4>Duplicate id attribute values</h4>");
                            } else {
                                content.push("<h4>HTTP requests:</h4>");
                            }
                            content.push("<ul>");
                            for (y = 0; y < x; y = y + 1) {
                                if (idtest === true && adata[y][0] > 1) {
                                    data.violations = data.violations + (adata[y][0] - 1);
                                }
                                content.push("<li>");
                                content.push(adata[y][0]);
                                content.push("x - ");
                                content.push(adata[y][1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
                                    />/g,
                                    "&gt;"
                                ));
                                content.push("</li>");
                            }
                            content.push("</ul>");
                            return content.join("");
                        }
                        return "";
                    },
                    accessibility = (
                        function markuppretty__beautify_apply_summary_accessibility() {
                            var findings   = [],
                                tagsbyname = function markuppretty__beautify_apply_summary_accessibility_tagsbyname() {
                                    var b            = 0,
                                        c            = 0,
                                        x            = 0,
                                        y            = 0,
                                        z            = 0,
                                        tagname      = "",
                                        tabindex     = "",
                                        alttest      = false,
                                        id           = false,
                                        fortest      = false,
                                        hidden       = false,
                                        html         = false,
                                        headtest     = (/^(h\d)$/),
                                        obsoleteAttr = [
                                            "alink",
                                            "align",
                                            "background",
                                            "border",
                                            "color",
                                            "compact",
                                            "face",
                                            "height",
                                            "language",
                                            "link",
                                            "nowrap",
                                            "size",
                                            "start",
                                            "text",
                                            "version",
                                            "vlink",
                                            "width"
                                        ],
                                        attr         = [],
                                        formID       = [],
                                        labelFor     = [],
                                        nofor        = [],
                                        namestack    = [];

                                    // badnest - checks for improperly orderd tags [tagname, start index, end index]
                                    data.badnest      = [];
                                    // obsoleteTags - checks for obsolete or presentation only tag names of start
                                    // and singleton tags token index
                                    data.obsoleteTags = [];
                                    // obsoleteAttr - checks for obsolete or presentation attribute names [token
                                    // index, attr index]
                                    data.obsoleteAttr = [];
                                    // headings - stores heading tag data [token index, number from tag name, if
                                    // violation]
                                    data.headings     = [];
                                    // emptyalt - if an img tag contains an alt attribute with no values token index
                                    data.emptyalt     = [];
                                    //noalt - if an img tag does not contain an alt attribute token index
                                    data.noalt        = [];
                                    //formNoId - if a form control is missing an id attribute token index
                                    data.formNoId     = [];
                                    // formNoLabel - if a form control is missing a binding to a label [token index,
                                    // id attr index]
                                    data.formNoLabel  = [];
                                    // tabindex - identifies elements with a tabindex attribute [token index, if
                                    // value is greater than 0]
                                    data.tabindex     = [];
                                    // htmllang - if there is an <html> tag does it contain a lang or xml:lang
                                    // attribute? boolean
                                    data.htmllang     = false;

                                    c                 = token.length;
                                    for (b = 0; b < c; b = b + 1) {
                                        hidden  = false;
                                        tagname = tagName(token[b]);
                                        if ((types[b] === "start" || types[b] === "singleton") && (tagname === "font" || tagname === "center" || tagname === "basefont" || tagname === "b" || tagname === "i" || tagname === "u" || tagname === "small" || tagname === "big" || tagname === "blink" || tagname === "plaintext" || tagname === "spacer" || tagname === "strike" || tagname === "tt" || tagname === "xmp")) {
                                            data
                                                .obsoleteTags
                                                .push(b);
                                        } else {
                                            if (types[b] === "start" && headtest.test(tagname) === true) {
                                                z = Number(tagname.charAt(1));
                                                if (data.headings.length > 0 && z - data.headings[data.headings.length - 1][1] > 1) {
                                                    data.violations = data.violations + 1;
                                                    data
                                                        .headings
                                                        .push([b, z, true]);
                                                } else {
                                                    data
                                                        .headings
                                                        .push([b, z, false]);
                                                }
                                            }
                                            if (attrs[b].alt !== undefined && tagname === "img") {
                                                alttest = true;
                                                if (attrs[b].alt === "") {
                                                    data
                                                        .emptyalt
                                                        .push(b);
                                                }
                                            }
                                            if (attrs[b].for !== undefined && tagname === "label") {
                                                labelFor.push(attrs[b].for);
                                                fortest = true;
                                            }
                                            if (tagname === "select" || tagname === "input" || tagname === "textarea") {
                                                if (typeof attrs[b].id === "string" || (tagname === "input" && typeof attrs[b].type === "string" && (attrs[b].type.toLowerCase() === "hidden" || attrs[b].type.toLowerCase() === "submit"))) {
                                                    id = true;
                                                    if (tagname === "input" && attrs[b].type === "hidden") {
                                                        hidden = true;
                                                    }
                                                    if (typeof attrs[b].id === "string") {
                                                        formID.push(b);
                                                    }
                                                } else {
                                                    z = namestack.length;
                                                    if (z > 0) {
                                                        do {
                                                            z = z - 1;
                                                        } while (z > 0 && namestack[z][0] === "span");
                                                        if (namestack[z][0] === "label") {
                                                            hidden = true;
                                                        }
                                                    }
                                                }
                                            } else if (tagname === "html") {
                                                html = true;
                                                if (typeof attrs[b].lang === "string" || typeof attrs[b]["xml:lang"] === "string") {
                                                    data.htmllang = true;
                                                }
                                            }
                                            if (data.obsoleteTags[data.obsoleteTags.length - 1] !== b) {
                                                if (typeof attrs[b].name === "string" && tagname !== "meta" && tagname !== "iframe" && tagname !== "select" && tagname !== "input" && tagname !== "textarea") {
                                                    data
                                                        .obsoleteAttr
                                                        .push([b, "name"]);
                                                }
                                                if (typeof attrs[b].type === "string" && tagname !== "script" && tagname !== "style" && tagname !== "input" && tagname !== "button" && tagname !== "link") {
                                                    data
                                                        .obsoleteAttr
                                                        .push([b, "type"]);
                                                }
                                                if (typeof attrs[b].value === "string" && tagname !== "input" && tagname !== "option" && tagname !== "textarea" && tagname !== "button") {
                                                    data
                                                        .obsoleteAttr
                                                        .push([b, "value"]);
                                                }
                                                z = obsoleteAttr.length;
                                                for (y = 0; y < z; y = y + 1) {
                                                    if (typeof attrs[b][obsoleteAttr[y]] === "string") {
                                                        data
                                                            .obsoleteAttr
                                                            .push([
                                                                b, obsoleteAttr[y]
                                                            ]);
                                                    }
                                                }
                                            }
                                            if (typeof attrs[b].tabindex === "string") {
                                                tabindex = attrs[b]
                                                    .tabindex
                                                    .slice(1, attrs[b].tabindex.length - 1);
                                                if (isNaN(tabindex) === true || Number(tabindex) > 0) {
                                                    data
                                                        .tabindex
                                                        .push([b, true]);
                                                    data.violations = data.violations + 1;
                                                } else {
                                                    data
                                                        .tabindex
                                                        .push([b, false]);
                                                }
                                            }
                                            if (fortest === true) {
                                                fortest = false;
                                            } else if (tagname === "label") {
                                                nofor.push(b);
                                            }
                                            if (id === true) {
                                                id = false;
                                            } else if (hidden === false && (tagname === "select" || tagname === "input" || tagname === "textarea")) {
                                                data
                                                    .formNoId
                                                    .push(b);
                                            }
                                            if (alttest === true) {
                                                alttest = false;
                                            } else if (tagname === "img") {
                                                data
                                                    .noalt
                                                    .push(b);
                                            }
                                        }
                                        if (types[b] === "start" || types[b] === "template_start") {
                                            namestack.push([tagname, b]);
                                        } else if (types[b] === "end" || types[b] === "template_end") {
                                            if (namestack.length > 0 && tagname !== "/" + namestack[namestack.length - 1][0]) {
                                                namestack[namestack.length - 1].push(b);
                                                data
                                                    .badnest
                                                    .push(namestack[namestack.length - 1]);
                                            }
                                            namestack.pop();
                                        }
                                    }
                                    attr = [];
                                    if (html === false) {
                                        data.htmllang = true;
                                    }
                                    attr.push("<div id='a11y'>");
                                    //missing lang attribute
                                    if (data.htmllang === false) {
                                        data.violations = data.violations + 1;
                                        attr.push(
                                            "<div><h4>HTML tag is a <strong>missing</strong> lang or xml:lang attribute</h4>"
                                        );
                                        attr.push(
                                            "<p>The lang attribute ensures the natural language is properly understood by a" +
                                            "ssisting applications.</p></div>"
                                        );
                                    } else {
                                        attr.push("<div><h4>HTML lang or xml:lang attribute is present</h4></div>");
                                    }
                                    //improperly nested tags
                                    b               = data.badnest.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> improperly nested tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            "</h4> <p>Improperly nested tags produce unexpected behaviors.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.badnest[x][2]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.badnest[x][2]]);
                                            attr.push(" does not match start tag <code>");
                                            attr.push(
                                                token[data.badnest[x][1]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> from input line number ");
                                            attr.push(linen[data.badnest[x][1]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push("<div><h4><strong>0</strong> improperly nested tags</h4>");
                                        attr.push("<p>Improperly nested tags produce unexpected behaviors.</p></div>");
                                    }
                                    //obsolete tags
                                    b               = data.obsoleteTags.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> obsolete HTML tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            "</h4> <p>Obsolete elements do not appropriately describe content.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.obsoleteTags[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.obsoleteTags[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push("<div><h4><strong>0</strong> obsolete HTML tags</h4>");
                                        attr.push("<p>Obsolete elements do not appropriately describe content.</p></div>");
                                    }
                                    //obsolete attributes
                                    b = data.obsoleteAttr.length;
                                    if (b > 0) {
                                        z = 0;
                                        attr.push("<div><h4><strong>");
                                        y = attr.length;
                                        attr.push("</strong> HTML tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " containing obsolete or inappropriate attributes</h4> <p>Obsolete attributes d" +
                                            "o not appropriately describe content.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            tagname = token[data.obsoleteAttr[x][0]]
                                                .replace(/&/g, "&amp;")
                                                .replace(/</g, "&lt;")
                                                .replace(/>/g, "&gt;")
                                                .replace(
                                                    attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x][1]],
                                                    "<strong>" + attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x][1]] + "</stron" +
                                                            "g>"
                                                );
                                            if (x < b - 1 && data.obsoleteAttr[x][0] === data.obsoleteAttr[x + 1][0]) {
                                                do {
                                                    tagname = tagname.replace(
                                                        attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x + 1][1]],
                                                        "<strong>" + attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x + 1][1]] + "</s" +
                                                                "trong>"
                                                    );
                                                    x       = x + 1;
                                                } while (x < b - 1 && data.obsoleteAttr[x][0] === data.obsoleteAttr[x + 1][0]);
                                            }
                                            z = z + 1;
                                            attr.push("<li><code>");
                                            attr.push(tagname);
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.obsoleteAttr[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr.splice(y, 0, z);
                                        data.violations = data.violations + z;
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> HTML tags containing obsolete or inappropriate attribut" +
                                            "es</h4>"
                                        );
                                        attr.push("<p>Obsolete attributes do not appropriately describe content.</p></div>");
                                    }
                                    //form controls missing a required 'id' attribute
                                    b               = data.formNoId.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> form control element");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " missing a required <em>id</em> attribute</h4> <p>The id attribute is required" +
                                            " to bind a point of interaction to an HTML label.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.formNoId[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.formNoId[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> form control elements missing a required <em>id</em> at" +
                                            "tribute</h4> <p>The id attribute is required to bind a point of interaction to" +
                                            " an HTML label.</p></div>"
                                        );
                                    }
                                    //form controls missing a binding to a label
                                    b                = formID.length;
                                    data.formNoLabel = [];
                                    for (x = 0; x < b; x = x + 1) {
                                        for (y = labelFor.length - 1; y > -1; y = y - 1) {
                                            if (attrs[formID[x]].id === labelFor[y]) {
                                                break;
                                            }
                                        }
                                        if (y < 0) {
                                            data
                                                .formNoLabel
                                                .push(formID[x]);
                                        }
                                    }
                                    b               = data.formNoLabel.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> form control element");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " not bound to a label</h4> <p>The <em>id</em> of a form control must match the" +
                                            " <em>for</em> of a label.</p><ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.formNoLabel[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.formNoLabel[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> form control elements not bound to a label</h4> <p>The " +
                                            "<em>id</em> of a form control must match the <em>for</em> of a label.</p></div>"
                                        );
                                    }
                                    //elements with tabindex
                                    b = data.tabindex.length;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        y = attr.length;
                                        z = 0;
                                        attr.push(0);
                                        attr.push("</strong> <em>tabindex</em>");
                                        attr.push(" violation");
                                        attr.push(
                                            "</h4> <p>The tabindex attribute should have a 0 or -1 value and should not be " +
                                            "over used. Only tabindexes with a value greater than 0 are counted as violatio" +
                                            "ns, but every element with a tabindex attribute is listed to quickly indicate " +
                                            "if it used excessively.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            if (data.tabindex[x][1] === true) {
                                                attr.push("<strong>");
                                                z = z + 1;
                                            }
                                            attr.push(
                                                token[data.tabindex[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            if (data.tabindex[x][1] === true) {
                                                attr.push("</strong>");
                                            }
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.tabindex[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr[y] = z;
                                        if (z !== 1) {
                                            attr[y + 2] = attr[y + 2] + "s";
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> elements with a <em>tabindex</em> attribute</h4> <p>The" +
                                            " tabindex attribute should have a 0 or -1 value and should not be over used.</" +
                                            "p></div>"
                                        );
                                    }
                                    //headings
                                    b = data.headings.length;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> HTML heading tag");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " and their order</h4> <p>Poorly ordered tags are described with a <strong>stro" +
                                            "ng</strong> tag (color red).</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            if (data.headings[x][2] === true) {
                                                attr.push("<strong>");
                                            }
                                            attr.push(
                                                token[data.headings[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            if (data.headings[x][2] === true) {
                                                attr.push("</strong>");
                                            }
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.headings[x][0]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push("<div><h4><strong>0</strong> HTML heading elements</h4>");
                                        attr.push(
                                            "<p>When heading tags are present it is important they are properly ordered so " +
                                            "that the content they describe can be navigated in the proper order.</p></div>"
                                        );
                                    }
                                    //missing alt attributes on images
                                    b               = data.noalt.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> image");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " missing a required <em>alt</em> attribute</h4> <p>The alt attribute is requir" +
                                            "ed even if it contains no value.</p> <ol>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.noalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.noalt[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> images missing a required <em>alt</em> attribute</h4> <" +
                                            "p>The alt attribute is required even if it contains no value.</p></div>"
                                        );
                                    }
                                    //alt attributes with empty values
                                    b               = data.emptyalt.length;
                                    data.violations = data.violations + b;
                                    if (b > 0) {
                                        attr.push("<div><h4><strong>");
                                        attr.push(b);
                                        attr.push("</strong> image");
                                        if (b > 1) {
                                            attr.push("s");
                                        }
                                        attr.push(
                                            " have an empty <em>alt</em> attribute value</h4> <p>Empty alt text is not nece" +
                                            "ssarily a violation, such as the case of tracking pixels. If an image has embe" +
                                            "dded text this content should be supplied in the alt attribute.</p>"
                                        );
                                        for (x = 0; x < b; x = x + 1) {
                                            attr.push("<li><code>");
                                            attr.push(
                                                token[data.emptyalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                            );
                                            attr.push("</code> on input line number ");
                                            attr.push(linen[data.emptyalt[x]]);
                                            attr.push("</li>");
                                        }
                                        attr.push("</ol></div>");
                                    } else {
                                        attr.push(
                                            "<div><h4><strong>0</strong> images have an empty <em>alt</em> attribute value</h4>"
                                        );
                                        attr.push(
                                            "<p>Empty alt text is not necessarily a violation, such as the case of tracking" +
                                            " pixels. If an image has embedded text this content should be supplied in the " +
                                            "alt attribute.</p></div>"
                                        );
                                    }
                                    attr.push("</div>");
                                    return attr.join("");
                                };
                            if (options.accessibility === false) {
                                return "";
                            }
                            findings.push(tagsbyname());
                            return findings.join("");
                        }()
                    ),
                    parseErrors   = (function markuppretty__beautify_apply_summary_parseErrors() {
                        var x     = parseError.length,
                            y     = 0,
                            fails = [];
                        data.violations = data.violations + x;
                        if (parseError.length > 1) {
                            globalerror = parseError[0].replace(options.functions.binaryCheck, "");
                        }
                        if (x === 0) {
                            return "";
                        }
                        fails.push("<h4><strong>");
                        fails.push(x);
                        fails.push("</strong> errors interpreting markup</h4> <ol>");
                        for (y = 0; y < x; y = y + 1) {
                            fails.push("<li>");
                            fails.push(
                                parseError[y].replace(options.functions.binaryCheck, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace("element: ", "element: <code>")
                            );
                            fails.push("</code></li>");
                        }
                        fails.push("</ol>");
                        return fails.join("");
                    }()),
                    sizes         = (function markuppretty__beautify_apply_summary_sizes() {
                        var table      = [],
                            outlines   = output
                                .split(lf)
                                .length,
                            outsize    = output.length,
                            linechange = (outlines / line) * 100,
                            charchange = (outsize / sourceSize) * 100;
                        table.push("<h4>Data sizes</h4>");
                        table.push(
                            "<table class='analysis' summary='Data sizes'><caption>This table shows changes" +
                            " in sizes of the data due to beautification.</caption>"
                        );
                        table.push(
                            "<thead><tr><th>Data figure</th><th>Input</th><th>Output</th><th>Percent change" +
                            "</th></tr></thead><tbody>"
                        );
                        table.push("<tr><th>Lines of code</th><td>");
                        table.push(numformat(line));
                        table.push("</td><td>");
                        table.push(numformat(outlines));
                        table.push("</td><td>");
                        table.push(linechange.toFixed(2));
                        table.push("%</td></tr>");
                        table.push("<tr><th>Character size</th><td>");
                        table.push(numformat(sourceSize));
                        table.push("</td><td>");
                        table.push(numformat(outsize));
                        table.push("</td><td>");
                        table.push(charchange.toFixed(2));
                        table.push("%</td></tr>");
                        table.push("</tbody></table>");
                        return table.join("");
                    }()),
                    statistics    = (function markuppretty__beautify_apply_summary_statistics() {
                        var stat       = [],
                            totalItems = stats.cdata[0] + stats.comment[0] + stats.content[0] + stats.end[0] +
                                    stats.ignore[0] + stats.script[0] + stats.sgml[0] + stats.singleton[0] +
                                    stats.start[0] + stats.style[0] + stats.template[0] + stats.text[0] + stats.xml[0],
                            totalSizes = stats.cdata[1] + stats.comment[1] + stats.content[1] + stats.end[1] +
                                    stats.ignore[1] + stats.script[1] + stats.sgml[1] + stats.singleton[1] +
                                    stats.start[1] + stats.style[1] + stats.template[1] + stats.text[1] + stats.xml[1],
                            rowBuilder = function markuppretty__beautify_apply_summary_statistics_rowBuilder(
                                type
                            ) {
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
                                if ((globalerror.indexOf(" more start tag") || globalerror.indexOf(" more end tag")) && (type === "start" || type === "end")) {
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
                        stat.push(
                            "<table class='analysis' summary='Statistics'><caption>This table provides basi" +
                            "c statistics about the parsed components of the given code sample after beauti" +
                            "fication.</caption>"
                        );
                        stat.push(
                            "<thead><tr><th>Item type</th><th>Number of instances</th><th>Percentage of tot" +
                            "al items</th><th>Character size</th><th>Percentage of total size</th></tr></th" +
                            "ead>"
                        );
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
                        stat.push(
                            "<p>* Totals are accounted for parsed code/content tokens only and not extraneo" +
                            "us space for beautification.</p> "
                        );
                        stat.push(
                            "<p>** Script and Style code is measured with minimal white space.</p>"
                        );
                        stat.push(
                            "<p>*** This is space that is not associated with text, tags, script, or css.</" +
                            "p> "
                        );
                        return stat.join("");
                    }()),
                    zipf          = (function markuppretty__beautify_apply_summary_zipf() {
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
                            sortchild  = function markuppretty__beautify_apply_summary_zipf_sortchild(y, z) {
                                return z[0] - y[0];
                            };
                        for (x = x; x < len; x = x + 1) {
                            if (types[x] === "content") {
                                wordlist.push(token[x]);
                            }
                        }
                        wordlist = safeSort(
                            wordlist.join(" ").replace(options.functions.binaryCheck, "").toLowerCase().replace(/&nbsp;/gi, " ").replace(/(,|\.|\?|!|:|\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").split(" ")
                        );
                        wordlen  = wordlist.length;
                        for (x = 0; x < wordlen; x = x + 1) {
                            word = wordlist[x];
                            if (word.length > 2 && word.length < 30 && (/&#?\w+;/).test(word) === false && word !== "the" && word !== "and" && word !== "for" && word !== "are" && word !== "this" && word !== "from" && word !== "with" && word !== "that" && word !== "to") {
                                if (wordproper.length === 0 || word !== wordproper[wordproper.length - 1][1]) {
                                    wordproper.push([1, word]);
                                } else {
                                    wordproper[wordproper.length - 1][0] = wordproper[wordproper.length - 1][0] + 1;
                                }
                            }
                            if (word !== wordlist[x - 1]) {
                                wordtotal.push([1, word]);
                            } else {
                                wordtotal[wordtotal.length - 1][0] = wordtotal[wordtotal.length - 1][0] + 1;
                            }
                        }
                        wordtotal  = wordtotal
                            .sort(sortchild)
                            .slice(0, 11);
                        wordproper = wordproper
                            .sort(sortchild)
                            .slice(0, 11);
                        wordlen    = (wordproper.length > 10)
                            ? 11
                            : wordproper.length;
                        for (x = 0; x < wordlen; x = x + 1) {
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
                            zipfout.push(
                                "<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstra" +
                                "tes <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the conte" +
                                "nt and the number of times they occurred.</caption>"
                            );
                            zipfout.push(
                                "<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of" +
                                " Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>" +
                                "Percentage from "
                            );
                            zipfout.push(wordcount);
                            zipfout.push(" total words</th></tr></thead><tbody>");
                            if (identical === false) {
                                zipfout.push("<tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                            }
                            for (x = 0; x < wordlen; x = x + 1) {
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
                                for (x = 0; x < wordlen; x = x + 1) {
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

                sum.push(
                    "<p><strong>Total number of HTTP requests (presuming HTML or XML Schema):</stro" +
                    "ng> <em>"
                );
                sum.push(reqs.length);
                sum.push("</em></p>");
                sum.push("<div class='report'>");
                sum.push(analysis(ids));
                sum.push(sizes);
                sum.push(parseErrors);
                if (options.accessibility === true) {
                    sum.push(accessibility);
                }
                sum.push(statistics);
                sum.push(analysis(reqs));
                sum.push(zipf);
                sum.push("</div>");
                if (options.accessibility === true) {
                    if (options.nodeasync === true) {
                        return [
                            sum
                                .join("")
                                .replace(
                                    "<div class='report'>",
                                    "<p><strong>Total potential accessibility violations:</strong> <em>" + data.violations +
                                            "</em></p> <div class='report'>"
                                ),
                            globalerror
                        ];
                    }
                    return sum
                        .join("")
                        .replace(
                            "<div class='report'>",
                            "<p><strong>Total potential accessibility violations:</strong> <em>" + data.violations +
                                    "</em></p> <div class='report'>"
                        );
                }
                if (options.nodeasync === true) {
                    return [sum.join(""), globalerror];
                }
                return sum.join("");
            }());
        }
        return output;
    };
    if ((typeof define === "object" || typeof define === "function") && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
        //requirejs support
        define(function markuppretty_requirejs() {
            return function markuppretty_requirejs_wrapper(x) {
                return markuppretty(x);
            };
        });
    } else if (typeof module === "object" && typeof module.parent === "object") {
        //commonjs and nodejs support
        module.exports = markuppretty;
        if (typeof require === "function" && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
            (function glib_markuppretty() {
                var localPath = (
                    typeof process === "object" && typeof process.cwd === "function" && (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true) && typeof __dirname === "string"
                )
                    ? __dirname
                    : ".";
                if (global.prettydiff.csspretty === undefined) {
                    global.prettydiff.csspretty = require(
                        localPath + "/csspretty.js"
                    );
                }
                if (global.prettydiff.jspretty === undefined) {
                    global.prettydiff.jspretty = require(
                        localPath + "/jspretty.js"
                    );
                }
                if (global.prettydiff.safeSort === undefined) {
                    global.prettydiff.safeSort = require(
                        localPath + "/safeSort.js"
                    );
                }
            }());
        }
    } else {
        global.prettydiff.markuppretty = markuppretty;
    }
}());
