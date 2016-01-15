/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global __dirname, ace, csspretty, define, exports, global, jspretty, process, require, safeSort*/
/***********************************************************************
 markuppretty is written by Austin Cheney on 20 Jun 2015.  Anybody may
 use this code without permission so long as this comment exists
 verbatim in each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/* A simple parser for XML, HTML, and a variety of template schemes. It
 beautifies, minifies, and peforms a series of analysis*/
var markuppretty = function markuppretty_(options) {
    "use strict";
    var safeSort = global.safeSort,
        stats      = {
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
        //* attrs is a list of arrays, each of which contains (if any) parsed attributes
        //* jscom stores true/false if the current token is a JS comment from JSX format
        //* level describes the indentation of a given token level is only used in beautify and diff modes
        //* linen stores the input line number on which the token occurs
        //* lines describes the preceeding space using: 2, 1, or 0 lines is populated in markuppretty__tokenize_spacer
        //* presv whether a given token should be preserved as provided
        //* token stores parsed tokens
        //* types segments tokens into named groups
        attrs      = [],
        jscom      = [],
        level      = [],
        linen      = [],
        lines      = [],
        token      = [],
        types      = [],
        presv      = [],
        reqs       = [],
        ids        = [],
        parseError = [],
        line       = 1,
        wrap       = 0,
        objsortop  = false,
        lf         = (options.crlf === true || options.crlf === "true")
            ? "\r\n"
            : "\n",
        sourceSize = options.source.length,
        //What is the lowercase tag name of the provided token?
        tagName    = function markuppretty__tagName(el) {
            var space = el
                    .replace(/\s+/, " ")
                    .indexOf(" "),
                name  = (space < 0)
                    ? el
                        .slice(1, el.length - 1)
                        .toLowerCase()
                    : el
                        .slice(1, space)
                        .toLowerCase();
            return name;
        },
        attrName   = function markuppretty__attrName(atty) {
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
            if (options.html === true) {
                return [
                    name.toLowerCase(),
                    value.toLowerCase()
                ];
            }
            return [name, value];
        };

    (function markuppretty__options() {
        objsortop             = (options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "markup");
        options.accessibility = (options.accessibility === true || options.accessibility === "true");
        options.inchar        = (typeof options.inchar === "string" && options.inchar.length > 0)
            ? options.inchar
            : " ";
        options.comments      = (typeof options.comments === "string" && options.comments === "noindent")
            ? "noindent"
            : (options.comments === "nocomment")
                ? "nocomment"
                : "indent";
        options.commline      = (options.commline === true || options.commline === "true");
        options.conditional   = (options.html === true || options.conditional === true || options.conditional === "true");
        options.content       = (options.content === true || options.content === "true");
        options.correct       = (options.correct === true || options.correct === "true");
        options.dustjs        = (options.dustjs === true || options.dustjs === "true");
        options.force_indent  = (options.force_indent === true || options.force_indent === "true");
        options.html          = (options.html === true || options.html === "true");
        options.inlevel       = (isNaN(options.inlevel) === true || options.inlevel < 0)
            ? 0
            : Number(options.inlevel);
        options.jsx           = (options.jsx === true || options.jsx === "true");
        options.mode          = (options.mode === "parse" || options.mode === "diff" || options.mode === "minify")
            ? options.mode
            : "beautify";
        options.preserve      = (options.preserve !== false && options.preserve !== "false");
        options.quoteConvert  = (options.quoteConvert === "single" || options.quoteConvert === "double")
            ? options.quoteConvert
            : "none";
        options.insize        = (isNaN(options.insize) === true)
            ? 4
            : Number(options.insize);
        options.source        = (typeof options.source === "string" && options.source.length > 0)
            ? options
                .source
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
            : "Error: no source code supplied to markuppretty!";
        options.spaceclose    = (options.spaceclose === true || options.spaceclose === "true");
        options.style         = (typeof options.style === "string" && options.style === "noindent")
            ? "noindent"
            : "indent";
        options.tagmerge      = (options.tagmerge === true || options.tagmerge === "true");
        options.tagsort       = (options.tagsort === true || options.tagsort === "true");
        options.textpreserve  = (options.textpreserve === true || options.textpreserve === "true");
        options.vertical      = (options.vertical === "jsonly")
            ? "jsonly"
            : (options.vertical === true || options.vertical === "true");
        wrap                  = (isNaN(options.wrap) === true || options.mode === "diff" || options.textpreserve === true)
            ? 0
            : Number(options.wrap);
    }());
    //type definitions:
    //start      end     type
    //<![CDATA[   ]]>     cdata
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
    //{@}else{@}         template_else
    //<%}else{%>         template_else
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
    if (options.mode !== "diff") {
        options.content = false;
    }
    if (options.jsx === true) {
        options.dustjs = false;
    }
    (function markuppretty__tokenize() {
        var a        = 0,
            b        = options
                .source
                .split(""),
            c        = b.length,
            minspace = "",
            space    = "",
            list     = 0,
            litag    = 0,
            linepreserve = 0,
            cftransaction = false,
            ext      = false,
            //determine if spaces between nodes are absent, multiline, or merely there
            //2 - multiline
            //1 - space present
            //0 - no space present
            spacer   = function markuppretty__tokenize_spacer() {
                if (space.length > 0) {
                    stats.space += space.length;
                    if (options.preserve === true && space.split("\n").length > 2) {
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
                    attribute = [],
                    presend   = {
                        cfquery: true,
                    },
                    //cftags is a list of supported coldfusion tags
                    //* required - means must have a separate matching end tag
                    //* optional - means the tag could have a separate end tag, but is probably a singleton
                    //* prohibited - means there is not corresponding end tag
                    cftags    = {
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
                        cftransaction         : (cftransaction === true)
                            ? "prohibited"
                            : "required",
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
                            atty = attribute
                                .join("")
                                .replace(/\s+/g, " ");
                            name = attrName(atty)[0];
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
                        atty = atty
                            .replace(/^\ /, "")
                            .replace(/\ $/, "");
                        attribute = atty.replace(/\r\n/g, "\n").split("\n");
                        bb = attribute.length;
                        for (aa = 0; aa < bb; aa += 1) {
                            attribute[aa] = attribute[aa].replace(/(\s+)$/, "");
                        }
                        atty = attribute.join(lf);
                        if (atty === "=") {
                            attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] = attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] + "=";
                        } else if (atty.charAt(0) === "=" && attrs[attrs.length - 1].length > 0 && attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1].indexOf("=") < 0) {
                            //if an attribute starts with a `=` then adjoin it to the last attribute
                            attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] = attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] + atty;
                        } else if (atty.charAt(0) !== "=" && attrs[attrs.length - 1].length > 0 && attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1].indexOf("=") === attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1].length - 1) {
                            //if an attribute follows an attribute ending with `=` then adjoin it to the
                            //last attribute
                            attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] = attrs[attrs.length - 1][attrs[attrs.length - 1].length - 1] + atty;
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
                if (end === "]>") {
                    end = ">";
                    types.push("template_end");
                } else if (b[a] === "<") {
                    if (b[a + 1] === "!") {
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
                                    nopush = true;
                                } else {
                                    preserve = true;
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
                        end = ">";
                        linepreserve += 1;
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
                    if (options.jsx === true) {
                        end = "}";
                        types.push("script");
                    } else if (options.dustjs === true) {
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
                    if (b[a + 1] === "@" && b[a + 2] === "}" && b[a + 3] === "e" && b[a + 4] === "l" && b[a + 5] === "s" && b[a + 6] === "e" && b[a + 7] === "{" && b[a + 8] === "@" && b[a + 9] === "}") {
                        a                       += 9;
                        types[types.length - 1] = "template_else";
                        return token.push("{@}else{@}");
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
                    if (preserve === true || (/\s/).test(b[a]) === false) {
                        output.push(b[a]);
                    } else if (output[output.length - 1] !== " ") {
                        output.push(" ");
                    }
                    if (comment === true) {
                        quote = "";
                    }
                    if (comment === true) {
                        //comments must ignore fancy encapsulations and attribute parsing
                        if (b[a] === lastchar && output.length > end.length + 1) {
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
                    } else {
                        if (quote === "") {
                            if (options.jsx === true) {
                                if (b[a] === "{") {
                                    jsxcount += 1;
                                } else if (b[a] === "}") {
                                    jsxcount -= 1;
                                }
                            }
                            if (types[types.length - 1] === "sgml" && b[a] === "[" && output.length > 4) {
                                types[types.length - 1] = "template_start";
                                break;
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

                                    if ((b[a] === "<" || b[a] === ">") && (quote === "" || quote === ">") && options.jsx === false) {
                                        if (quote === "" && b[a] === "<") {
                                            quote     = ">";
                                            braccount = 1;
                                        } else if (quote === ">") {
                                            if (b[a] === "<") {
                                                braccount += 1;
                                            } else if (b[a] === ">") {
                                                braccount -= 1;
                                                if (braccount === 0) {
                                                    //the following detects if a coldfusion tag is embedded within another markup
                                                    //tag
                                                    tname = tagName(attribute.join(""));
                                                    if (cftags[tname] === "required") {
                                                        quote = "</" + tname + ">";
                                                    } else {
                                                        quote = "";
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
                                                a -= 1;
                                            }
                                            if (attribute.length > 0) {
                                                attrpush(false);
                                            }
                                            break;
                                        }
                                        if (b[a] === "\"" || b[a] === "'") {
                                            quote = b[a];
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
                                        } else if (output[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                                    } else if (b[a] === "(" && quote === ")") {
                                        parncount += 1;
                                    } else if (b[a] === ")" && quote === ")") {
                                        parncount -= 1;
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
                                                bcount += 1;
                                            } else if (b[a] === quote) {
                                                bcount -= 1;
                                                if (bcount === 0) {
                                                    jsxcount  = 0;
                                                    quote     = "";
                                                    element   = attribute
                                                        .join("")
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
                                    } else if (quote !== ">") {
                                        //terminate attribute at the conclusion of a quote pair
                                        f     = 0;
                                        tname = output[1] + output[2];
                                        tname = tname.toLowerCase();
                                        //in coldfusion quotes are escaped in a string with double the characters:
                                        //"cat"" and dog"
                                        if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "\'")) {
                                            attribute.push(b[a + 1]);
                                            a += 1;
                                        } else {
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
                                }
                            } else if (b[a] === "\"" || b[a] === "'") {
                                //opening quote
                                quote = b[a];
                            } else if (comment === false && b[a] === "<" && b[a + 1] === "!" && b[a + 2] === "-" && b[a + 3] === "-" && types[types.length - 1] !== "conditional") {
                                quote = "-->";
                            } else if (output[0] !== "{" && b[a] === "{" && end !== "%>" && end !== "%]" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                            } else if (simple === true && (/\s/).test(b[a]) === true && b[a - 1] !== "<") {
                                //identify a space in a regular start or singleton tag
                                stest = true;
                            } else if (simple === true && options.jsx === true && b[a] === "/" && (b[a + 1] === "*" || b[a + 1] === "/")) {
                                //jsx comment immediately following tag name
                                stest                     = true;
                                output[output.length - 1] = " ";
                                attribute.push(b[a]);
                                if (b[a + 1] === "*") {
                                    jsxquote = "*/";
                                } else {
                                    jsxquote = "\n";
                                }
                            } else if (b[a] === lastchar && (output.length > end.length + 1 || output[0] === "]") && (options.jsx === false || jsxcount === 0)) {
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
                            f     = 0;
                            tname = output[1] + output[2];
                            tname = tname.toLowerCase();
                            //in coldfusion quotes are escaped in a string with double the characters:
                            //"cat"" and dog"
                            if (tname === "cf" && b[a] === b[a + 1] && (b[a] === "\"" || b[a] === "\'")) {
                                attribute.push(b[a + 1]);
                                a += 1;
                            } else {
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
                //nopush flags mean an early exit
                if (nopush === true) {
                    attrs.pop();
                    jscom.pop();
                    linen.pop();
                    lines.pop();
                    space = minspace;
                    return;
                }

                if (preserve === true) {
                    presv.push(true);
                } else {
                    presv.push(false);
                }

                element = output.join("");
                tname   = tagName(element);

                //fix singleton tags and sort attributes
                if (attrs[attrs.length - 1].length > 0) {
                    attribute = attrs[attrs.length - 1];
                    if (attribute[attribute.length - 1] === "/") {
                        attribute.pop();
                        output.splice(output.length - 1, 0, "/");
                    }
                    f = attribute.length;
                    for (e = 1; e < f; e += 1) {
                        quote = attribute[e - 1];
                        if (quote.charAt(quote.length - 1) === "=" && attribute[e].indexOf("=") < 0) {
                            attribute[e - 1] = quote + attribute[e];
                            attribute.splice(e, 1);
                            f -= 1;
                            e -= 1;
                        }
                    }
                    if (objsortop === true && jscom[jscom.length - 1] === false && options.jsx === false && nosort === false && tname !== "cfif" && tname !== "cfelseif" && tname !== "cfset") {
                        attribute = safeSort(attribute);
                    }
                }

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
                    var atts         = attrs[attrs.length - 1],
                        atty         = [],
                        attn         = token[token.length - 1],
                        value        = "",
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
                            for (aa = token.length - 1; aa > -1; aa -= 1) {
                                if (types[aa] === "end") {
                                    bb += 1;
                                } else if (types[aa] === "start") {
                                    bb -= 1;
                                    if (bb < 0) {
                                        return false;
                                    }
                                }
                                if (bb === 0 && token[aa].toLowerCase().indexOf(vname) === 1) {
                                    if (cftags[tagName(token[aa])] !== undefined) {
                                        types[aa] = "template_start";
                                    } else {
                                        types[aa] = "start";
                                    }
                                    if (attrs[aa].length > 0) {
                                        token[aa] = token[aa].replace(/(\s*\/>)$/, " >");
                                    } else {
                                        token[aa] = token[aa].replace(/(\s*\/>)$/, ">");
                                    }
                                    return false;
                                }
                            }
                        };
                    if (presend["/" + tname] === true) {
                        linepreserve -= 1;
                    }
                    if (types[types.length - 1] === "end" && tname.slice(0, 3) !== "/cf") {
                        if (types[types.length - 2] === "singleton" && attn.charAt(attn.length - 2) !== "/" && "/" + tagName(attn) === tname) {
                            types[types.length - 2] = "start";
                        } else if (types[types.length - 2] === "start" && tname !== "/span" && tname !== "/div" && tname !== "/script" && (options.html === false || (options.html === true && tname !== "/li")) && tname === "/" + tagName(token[token.length - 1]) && options.tagmerge === true) {
                            types.pop();
                            attrs.pop();
                            jscom.pop();
                            linen.pop();
                            lines.pop();
                            presv.pop();
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

                    if (tname === "script" || tname === "style" || tname === "cfscript") {
                        //identify if there is embedded code requiring an external parser
                        if (tname === "script" && (type === "" || type === "text/javascript" || type === "application/javascript" || type === "application/x-javascript" || type === "text/ecmascript" || type === "application/ecmascript" || type === "text/jsx" || type === "application/jsx" || type === "text/cjs")) {
                            ext = true;
                        } else if (tname === "style" && (quote === "" || quote === "text/css")) {
                            ext = true;
                        } else if (tname === "cfscript") {
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
                    if (options.html === true) {
                        //simple means of looking for missing li end tags
                        if (options.jsx === false && token.length > 0) {
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
                            }
                        }
                        if (types[types.length - 1] === "end" && htmlsings[tname.slice(1)] === "singleton" && tname !== "/cftransaction") {
                            return fixsingleton();
                        }
                        if (htmlsings[tname] === "singleton") {
                            if (options.correct === true && ender.test(element) === false) {
                                output.pop();
                                output.push(" ");
                                output.push("/");
                                output.push(">");
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
                            token.push(output.join(""));
                            singleton = true;
                            return false;
                        }
                        cfval = cftags[tname];
                        if (cfval === "optional" || cfval === "prohibited" || tname.slice(0, 3) === "cf_") {
                            if (options.correct === true && ender.test(element) === false) {
                                output.pop();
                                output.push(" ");
                                output.push("/");
                                output.push(">");
                            }
                            types.push("template");
                            token.push(output.join("").replace(/\s+/, " "));
                            singleton = true;
                            return false;
                        }
                        if (cfval === "required" && tname !== "cfquery") {
                            if (tname === "cftransaction" && cftransaction === false) {
                                cftransaction = true;
                            }
                            types.push("template_start");
                            token.push(output.join(""));
                            singleton = true;
                        }
                        return false;
                    }
                    if (options.dustjs === true && types[types.length - 1] === "template_start") {
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
                        preserve                = true;
                        presv[presv.length - 1] = true;
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
                                } else if (output[0] !== "{" && b[a] === "{" && (options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
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
                    if (element.indexOf("else") > 2) {
                        types[types.length - 1] = "template_else";
                    } else if ((/^(<%\s*\})/).test(element) === true || (/^(\[%\s*\})/).test(element) === true || (/^(\{@\s*\})/).test(element) === true) {
                        types[types.length - 1] = "template_end";
                    } else if ((/(\{\s*%>)$/).test(element) === true || (/(\{\s*%\])$/).test(element) === true || (/(\{\s*@\})$/).test(element) === true) {
                        types[types.length - 1] = "template_start";
                    }
                }
                //HTML5 does not require an end tag for an opening list item <li>
                //this logic temprorarily creates a pseudo end tag
                if (liend === true && (options.mode === "beautify" || options.mode === "diff")) {
                    token.push("</prettydiffli>");
                    lines.push(lines[lines.length - 1]);
                    linen.push(line);
                    lines[lines.length - 2] = 0;
                    attrs.splice(attrs.length - 1, 0, []);
                    types.splice(types.length - 1, 0, "end");
                    presv.push(false);
                    jscom.push(false);
                }
                if (preserve === true) {
                    token.push(element);
                } else {
                    token.push(element.replace(/\s+/g, " "));
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
                                jscom: [],
                                linen: [],
                                lines: [],
                                presv: [],
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
                                store
                                    .attrs
                                    .push(attrs[index]);
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
                        endData.presv = presv.pop();
                        endData.token = token.pop();
                        endData.types = types.pop();
                        attrs         = attrs
                            .slice(0, startStore)
                            .concat(store.attrs);
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
                        attrs.push(endData.attrs);
                        jscom.push(endData.jscom);
                        linen.push(endData.linen);
                        lines.push(endData.lines);
                        presv.push(endData.presv);
                        token.push(endData.token);
                        types.push(endData.types);
                    }());
                }
            },
            content  = function markuppretty__tokenize_content() {
                var output    = [],
                    quote     = "",
                    square    = (types[types.length - 1] === "template_start" && token[token.length - 1].indexOf("<!") === 0 && token[token.length - 1].indexOf("<![") < 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === "["),
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
                        for (aa = a - 1; aa > -1; aa -= 1) {
                            if (b[aa] !== "\\") {
                                break;
                            }
                            bb += 1;
                        }
                        if (bb % 2 === 1) {
                            return true;
                        }
                        return false;
                    },
                    name      = "";
                spacer();
                attrs.push([]);
                jscom.push(false);
                linen.push(line);
                if (linepreserve > 0) {
                    presv.push(true);
                } else {
                    presv.push(false);
                }
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
                            if ((b[a] === "\"" || b[a] === "'" || b[a] === "/" || b[a] === "`") && esctest() === false) {
                                quote = b[a];
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
                                    presv.pop();
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
                                    presv.pop();
                                    return lines.pop();
                                }
                                token.push(output.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                if (typeof global.csspretty === "function") {
                                    return types.push(name);
                                }
                                return types.push("content");
                            }
                            if (name === "cfscript" && b[a] === "<" && b[a + 1] === "/" && b[a + 2] === "c" && b[a + 3] === "f" && b[a + 4] === "s" && b[a + 5] === "c" && b[a + 6] === "r" && b[a + 7] === "i" && b[a + 8] === "p" && b[a + 9] === "t") {
                                a   -= 1;
                                ext = false;
                                if (output.length < 2) {
                                    attrs.pop();
                                    jscom.pop();
                                    linen.pop();
                                    presv.pop();
                                    return lines.pop();
                                }
                                token.push(output.join("").replace(/^(\s+)/, "").replace(/(\s+)$/, ""));
                                if (typeof global.jspretty === "function") {
                                    return types.push(name);
                                }
                                return types.push("content");
                            }
                        } else if (quote === b[a] && (quote === "\"" || quote === "'" || quote === "/" || quote === "`") && esctest() === false) {
                            quote = "";
                        } else if (quote === "`" && b[a] === "$" && b[a + 1] === "{" && esctest() === false) {
                            quote = "}";
                        } else if (quote === "}" && b[a] === "}" && esctest() === false) {
                            quote = "`";
                        } else if (quote === "*" && b[a + 1] === "/") {
                            quote = "";
                        } else if (quote === "/" && b[a] === "\n") {
                            quote = "";
                        }
                    }
                    if (square === true && b[a] === "]") {
                        a -= 1;
                        spacer();
                        if (options.content === true) {
                            token.push("text");
                        } else if (options.textpreserve === true) {
                            token.push(minspace + output.join(""));
                            lines[lines.length - 1] = 0;
                        } else if (linepreserve > 0) {
                            token.push(minspace + output.join("").replace(/(\s+)$/, tailSpace));
                            lines[lines.length - 1] = 0;
                        } else {
                            token.push(output.join("").replace(/(\s+)$/, tailSpace).replace(/\s+/g, " "));
                        }
                        return types.push("content");
                    }

                    if (ext === false && output.length > 0 && ((b[a] === "<" && b[a + 1] !== "=" && (/\s|\d/).test(b[a + 1]) === false) || (b[a] === "[" && b[a + 1] === "%") || (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")))) {
                        if (options.dustjs === true && b[a] === "{" && b[a + 1] === ":" && b[a + 2] === "e" && b[a + 3] === "l" && b[a + 4] === "s" && b[a + 5] === "e" && b[a + 6] === "}") {
                            a += 6;
                            if (options.content === true) {
                                token.push("text");
                            } else if (options.textpreserve === true) {
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
                            presv.push(false);
                            token.push("{:else}");
                            return types.push("template_else");
                        }
                        a -= 1;
                        if (options.content === true) {
                            token.push("text");
                        } else if (options.textpreserve === true) {
                            token.push(minspace + output.join(""));
                            lines[lines.length - 1] = 0;
                        } else if (linepreserve > 0) {
                            token.push(minspace + output.join("").replace(/(\s+)$/, tailSpace));
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
            } else if (b[a] === "{" && (options.jsx === true || options.dustjs === true || b[a + 1] === "{" || b[a + 1] === "%" || b[a + 1] === "@" || b[a + 1] === "#")) {
                tag("");
            } else if (b[a] === "]") {
                tag("]>");
            } else {
                content();
            }
        }
        lines[0] = 0;
    }());

    if (options.mode === "parse") {
        (function markuppretty__parse() {
            var a        = 0,
                c        = token.length,
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
                    token.splice(a, 0, string);
                    types.splice(a, 0, "content");
                    lines.splice(a, 0, 1);
                    attrs.splice(a, 0, []);
                    c += 1;
                    a += 1;
                },
                attApply = function markuppretty__parse_attApply() {
                    var string = "",
                        xlen   = 0,
                        toke   = token[a],
                        atty   = attrs[a];
                    if (presv[a] === true) {
                        token[a] = toke.replace(" ", " " + atty);
                    } else {
                        string   = ((/(\/>)$/).test(toke) === true)
                            ? "/>"
                            : ">";
                        xlen     = (string === "/>")
                            ? 3
                            : 2;
                        token[a] = (toke.slice(0, toke.length - xlen) + " " + atty + string);
                    }
                };
            for (a = 0; a < c; a += 1) {
                if (attrs[a].length > 0) {
                    attApply();
                }
                if (token[a] === "</prettydiffli>") {
                    if (options.correct === true) {
                        token[a] = "</li>";
                    } else {
                        token[a] = "";
                        types[a] = "";
                    }
                }
                if (lines[a] === 2) {
                    if (options.preserve === true) {
                        insert(lf + lf);
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
        return {token: token, types: types};
    }

    if (options.mode === "minify") {
        (function markuppretty__minify() {
            var a      = 0,
                c      = token.length,
                script = function markuppretty__minify_script() {
                    options.source = token[a];
                    token[a]       = global.jspretty(options);
                    level.push("x");
                },
                style  = function markuppretty__minify_style() {
                    options.source = token[a];
                    token[a]       = global.csspretty(options);
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

    if (options.mode === "beautify" || options.mode === "diff") {
        (function markuppretty__beautify() {
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
                    var b      = options.insize,
                        output = [];
                    for (b = b; b > -1; b -= 1) {
                        output.push(options.inchar);
                    }
                    return new RegExp("^(" + output.join("") + "+)");
                }()),
                end          = function markuppretty__beautify_end() {
                    var b = 0;
                    indent -= 1;
                    if ((types[a] === "end" && ltype === "start") || (types[a] === "template_end" && ltype === "template_start") || (options.jsx === true && (/^\s+\{/).test(token[a - 1]) === true && lines[a] === 0)) {
                        return level.push("x");
                    }
                    if (options.force_indent === false) {
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
                    if (lines[a] === 0 && options.force_indent === false && (presv[a] === false || types[a] !== "content")) {
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
                        source    = "",
                        bracetest = false,
                        jsxstart  = function markuppretty__beautify_script_jsxstart(spaces) {
                            return spaces + "{";
                        },
                        inle      = options.inlevel,
                        mode      = options.mode,
                        vertical  = options.vertical;
                    stats.script[0] += 1;
                    stats.script[1] += token[a]
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
                    source = token[a];
                    if (options.jsx === true && source.charAt(0) === "{") {
                        source    = source.slice(1, source.length - 1);
                        bracetest = true;
                    }
                    options.source   = source;
                    options.inlevel  = (options.style === "noinde")
                        ? 0
                        : indent;
                    options.mode     = "beautify";
                    options.vertical = (options.vertical === "jsonly" || options.vertical === true || options.vertical === "true");
                    token[a]         = global.jspretty(options);
                    options.inlevel  = inle;
                    options.mode     = mode;
                    options.vertical = vertical;
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
                        token[a] = token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        token[a] = token[a] + lf + tabs + commentE;
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
                    var list     = [],
                        inle     = options.inlevel,
                        mode     = options.mode,
                        vertical = options.vertical;
                    stats.style[0] += 1;
                    stats.style[1] += token[a]
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
                    options.inlevel  = (options.style === "noindent")
                        ? 0
                        : indent;
                    options.mode     = "beautify";
                    options.source   = token[a];
                    options.vertical = (options.vertical === true || options.vertical === "true");
                    token[a]         = global.csspretty(options);
                    options.inlevel  = inle;
                    options.mode     = mode;
                    options.vertical = vertical;
                    list             = tab.exec(token[a]);
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
                    level.push(0);
                };
            for (a = 0; a < c; a += 1) {
                if (types[a] === "start") {
                    level.push(indent);
                    indent         += 1;
                    stats.start[0] += 1;
                    stats.start[1] += token[a].length;
                    xslline();
                } else if (types[a] === "template_start" || types[a] === "linepreserve") {
                    if (types[a] === "linepreserve") {
                        lprescount.push(tagName(token[a]));
                    }
                    level.push(indent);
                    indent            += 1;
                    stats.template[0] += 1;
                    stats.template[1] += token[a].length;
                } else if (types[a] === "template_else") {
                    level.push(indent - 1);
                    stats.template[0] += 1;
                    stats.template[1] += token[a].length;
                } else if (types[a] === "end") {
                    end();
                    stats.end[0] += 1;
                    stats.end[1] += token[a].length;
                } else if (types[a] === "template_end") {
                    if (lprescount.length > 0 && tagName(token[a]) === "/" + lprescount[lprescount.length - 1]) {
                        lprescount.pop();
                    }
                    end();
                    stats.template[0] += 1;
                    stats.template[1] += token[a].length;
                } else if (lines[a] === 0 && (types[a] === "singleton" || types[a] === "content" || types[a] === "template")) {
                    if (types[a] === "content" && options.textpreserve === true) {
                        level.push("x");
                    } else {
                        content();
                    }
                    xslline();
                    stats[types[a]][0] += 1;
                    stats[types[a]][1] += token[a].length;
                } else if (types[a] === "script" || types[a] === "cfscript") {
                    stats.script[0] += 1;
                    stats.script[1] += token[a].length;
                    script();
                } else if (types[a] === "style") {
                    stats.style[0] += 1;
                    stats.style[1] += token[a].length;
                    style();
                } else if (types[a] === "comment" && options.comments === "noindent") {
                    level.push(0);
                    stats.comment[0] += 1;
                    stats.comment[1] += token[a].length;
                } else if (types[a] === "linepreserve") {
                    level.push(indent);
                    stats.ignore[0] += 1;
                    stats.ignore[1] += token[a].length;
                } else {
                    level.push(indent);
                    stats[types[a]][0] += 1;
                    stats[types[a]][1] += token[a].length;
                    xslline();
                }
                if (types[a] !== "content" && types[a] !== "comment" && types[a - 1] === "content" && types[a - 2] !== "linepreserve" && lprescount.length > 0) {
                    level[a]     = "x";
                }
                ltype = types[a];
                lline = lines[a];
            }
            level[0] = 0;
        }());
    }

    if (token.length === 0) {
        return "Error: source does not appear to be markup.";
    }

    return (function markuppretty__apply() {
        var a            = 0,
            c            = level.length,
            build        = [],
            output       = "",
            //tab builds out the character sequence for one step of indentation
            tab          = (function markuppretty__apply_tab() {
                var aa   = 0,
                    ind  = [options.inchar],
                    size = options.insize - 1;
                for (aa = 0; aa < size; aa += 1) {
                    ind.push(options.inchar);
                }
                return ind.join("");
            }()),
            //a new line character plus the correct amount of identation for the given line
            //of code
            nl           = function markuppretty__apply_nl(ind, item) {
                var aa          = 0,
                    indentation = [lf];
                if (options.mode === "minify") {
                    return build.push(lf);
                }
                if (lines[a] === 2 && item === build) {
                    indentation.push(lf);
                }
                for (aa = 0; aa < ind; aa += 1) {
                    indentation.push(tab);
                }
                item.push(indentation.join(""));
            },
            //populates attributes onto start and singleton tags
            //it also checks to see if a tag or content should wrap
            wrapper      = function markuppretty__apply_wrapper() {
                var b        = 0,
                    len      = 0,
                    xlen     = 0,
                    list     = attrs[a],
                    lev      = level[a],
                    atty     = "",
                    string   = "",
                    content  = [],
                    tname    = tagName(token[a]);
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
                if (lev === 0) {
                    lev += options.inlevel;
                }
                if (list.length > 0) {
                    if ((types[a] === "template_start" || types[a] === "template" || types[a] === "template_else") && options.jsx === false && typeof global.jspretty === "function") {
                        len = list.length;
                        for (b = 0; b < len; b += 1) {
                            xlen = list[b].indexOf("{");
                            if (list[b].indexOf("}") > xlen && xlen > 0) {
                                options.source = list[b].slice(xlen, list[b].indexOf("}") + 1);
                                options.inlevel = lev;
                                list[b] = list[b].slice(0, xlen) + jspretty(options).replace(/^(\s+)/, "") + list[b].slice(list[b].indexOf("}") + 1);
                            }
                        }
                    }
                    atty   = list.join(" ");
                    string = tagName(token[a]);
                    len    = string.length + 3 + atty.length;
                    if (token[a].charAt(token[a].length - 2) === "/") {
                        len += 1;
                    }
                    if (wrap === 0 || len <= wrap || tname === "cfset"|| tname === "cfreturn" || tname === "cfif" || tname === "cfelseif") {
                        if (presv[a] === true) {
                            token[a] = token[a].replace(" ", " " + atty);
                        } else {
                            string   = ((/(\/>)$/).test(token[a]) === true)
                                ? "/>"
                                : ">";
                            xlen     = (string === "/>")
                                ? 3
                                : 2;
                            token[a] = (token[a].slice(0, token[a].length - xlen) + " " + atty + string);
                        }
                        if (types[a] === "singleton" || types[a] === "template") {
                            if (options.spaceclose === true) {
                                token[a] = token[a].replace(/(\ *\/>)$/, " />");
                            } else {
                                token[a] = token[a].replace(/(\ *\/>)$/, "/>");
                            }
                        }
                        return;
                    }
                    content.push(token[a].slice(0, token[a].indexOf(" ")));
                    len      = list.length;
                    for (b = 0; b < len; b += 1) {
                        nl(lev + 1, content);
                        content.push(list[b]);
                    }
                    content.push(token[a].slice(token[a].indexOf(" ") + 1));
                    token[a] = content.join("");
                    if (types[a] === "singleton" || types[a] === "template") {
                        if (options.spaceclose === true) {
                            token[a] = token[a].replace(/(\ *\/>)$/, " />");
                        } else {
                            token[a] = token[a].replace(/(\ *\/>)$/, "/>");
                        }
                    }
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
                        if (list[b + 1] !== undefined && string.length + list[b + 1].length + 1 > wrap - xlen) {
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
                    if (content.length > 0 && (content[content.length - 1].charAt(0) === "\n" || (content[content.length - 1].charAt(0) + content[content.length - 1].charAt(1) === "\r\n"))) {
                        content.pop();
                    }
                    token[a] = content.join("");
                    if (types[a] === "singleton") {
                        if (options.spaceclose === true) {
                            token[a] = token[a].replace(/(\ *\/>)$/, " />");
                        } else {
                            token[a] = token[a].replace(/(\ *\/>)$/, "/>");
                        }
                    }
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
                        temp = (lf === "\r\n")
                            ? attr[b].split("\r\n")
                            : attr[b].split("\n");
                        tempx.push(temp[0]);
                        y = temp.length;
                        for (x = 0; x < y; x += 1) {
                            if (temp[x] === "") {
                                temp[x] = lf;
                            } else {
                                nl(level[a] + 1, tempx);
                                tempx.push(temp[x].replace(/^(\s+)/, ""));
                            }
                        }
                        tempx.push(lf);
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
                var attr     = attrs[a],
                    b        = 0,
                    x        = attr.length,
                    value    = [],
                    inlevel  = options.inlevel + level[a],
                    inle     = options.inlevel,
                    mode     = options.mode,
                    vertical = options.vertical;
                if (level[a] === "x") {
                    inlevel = options.inlevel;
                } else if (level[a] > 0) {
                    inlevel = level[a];
                }
                for (b = 0; b < x; b += 1) {
                    value = attrName(attr[b]);
                    if (value[1].charAt(0) === "{") {
                        options.mode     = "beautify";
                        options.inlevel  = inlevel;
                        options.source   = value[1].slice(1, value[1].length - 1);
                        options.vertical = (options.vertical === "jsonly" || options.vertical === true || options.vertical === "true");
                        value[1]         = global.jspretty(options);
                        options.mode     = mode;
                        options.inlevel  = inle;
                        options.vertical = vertical;
                        attrs[a][b]      = value[0] + "={" + value[1].replace(/^\s+/, "") + "}";
                    }
                }
            },
            linepreserve = function markuppretty__apply_linepreserve() {
                var str  = token[a].replace(/\r\n/g, "\n").replace(/^(\n)/, ""),
                    item = str.split("\n"),
                    aa   = 0,
                    bb   = item.length,
                    out  = [],
                    taby = new RegExp("^(" + tab + "+)");
                lines[a] = 1;
                for (aa = 0; aa < bb; aa += 1) {
                    item[aa] = item[aa].replace(/^(\s+)/, "").replace(taby, "");
                    if (item[aa] === "" && item[aa - 1] !== "" && aa < bb - 1) {
                        nl(0, out);
                    } else if (item[aa] !== "") {
                        if (aa > 0) {
                            nl(level[a], out);
                        }
                        if (item[aa].indexOf(tab) === 0) {
                            do {
                                item[aa] = item[aa].slice(tab.length);
                            } while (item[aa].indexOf(tab) === 0);
                        }
                        out.push(item[aa].replace(/(\s+)$/, ""));
                    }
                }
                if (out[out.length - 1] === "") {
                    out.pop();
                }
                if (types[a + 1] === "template_end" && out[out.length - 1].indexOf(tab) > 0) {
                    out.pop();
                }
                token[a] = out.join("");
            };
        for (a = 0; a < c; a += 1) {
            if (options.jsx === true && attrs[a].length > 0) {
                jsxattribute();
            }
            if (jscom[a] === true) {
                attrcom();
            } else if (types[a] === "content") {
                if (presv[a] === true) {
                    linepreserve();
                } else if (wrap > 0 && token[a].length > wrap && options.mode === "beautify") {
                    wrapper();
                }
            } else if ((attrs[a].length > 0 || (wrap > 0 && token[a].length > wrap)) && (types[a] === "content" || types[a] === "start" || types[a] === "singleton" || types[a] === "template_start" || types[a] === "template") && options.mode === "beautify" && (types[a] !== "singleton" || token[a].charAt(0) !== "{")) {
                wrapper();
            } else if (attrs[a].length > 0) {
                token[a] = token[a].replace(" ", " " + attrs[a].join(" "));
            } else if (types[a] === "singleton") {
                if (options.spaceclose === true) {
                    token[a] = token[a].replace(/(\ *\/>)$/, " />");
                } else {
                    token[a] = token[a].replace(/(\ *\/>)$/, "/>");
                }
            }
            if (token[a] === "</prettydiffli>" && options.correct === true) {
                token[a] = "</li>";
            }
            if (token[a] !== "</prettydiffli>" && jscom[a] === false) {
                if ((types[a] === "template" || types[a] === "template_start") && types[a - 1] === "content" && presv[a - 1] === true && options.mode === "beautify" && level[a] === "x") {
                    build.push(" ");
                }
                if (isNaN(level[a]) === false) {
                    if (options.mode === "minify") {
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
        if (build[0] === lf) {
            build[0] = "";
        }
        output = build.join("");
        if (options.mode === "beautify") {
            global.report = (function markuppretty__apply_summary() {
                var len           = token.length,
                    sum           = [],
                    data          = {
                        violations: 0
                    },
                    startend      = stats.start[0] - stats.end[0],
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
                            adata   = [],
                            content = [];
                        if (x > 0) {
                            arr = safeSort(arr);
                            for (y = 0; y < x; y += 1) {
                                if (arr[y] === arr[y + 1]) {
                                    if (idtest === true && (adata.length === 0 || adata[adata.length - 1][1] !== arr[y])) {
                                        adata.push([2, arr[y]]);
                                    }
                                    if (adata.length > 0) {
                                        adata[adata.length - 1][0] += 1;
                                    }
                                } else if (idtest === false) {
                                    adata.push([1, arr[y]]);
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
                            for (y = 0; y < x; y += 1) {
                                if (idtest === true && adata[y][0] > 1) {
                                    data.violations += (adata[y][0] - 1);
                                }
                                content.push("<li>");
                                content.push(adata[y][0]);
                                content.push("x - ");
                                content.push(adata[y][1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
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
                                var b         = 0,
                                    x         = 0,
                                    y         = 0,
                                    z         = 0,
                                    tagname   = "",
                                    alttest   = false,
                                    id        = false,
                                    fortest   = false,
                                    hidden    = false,
                                    html      = false,
                                    headtest  = (/^(h\d)$/),
                                    attr      = [],
                                    formID    = [],
                                    labelFor  = [],
                                    nofor     = [],
                                    namestack = [];

                                //badnest - checks for improperly orderd tags
                                //[tagname, start index, end index]
                                data.badnest      = [];
                                //obsoleteTags - checks for obsolete or presentation only tag names of start and
                                //singleton tags
                                //token index
                                data.obsoleteTags = [];
                                //obsoleteAttr - checks for obsolete or presentation attribute names
                                //[token index, attr index]
                                data.obsoleteAttr = [];
                                //headings - stores heading tag data
                                //[token index, number from tag name, if violation]
                                data.headings     = [];
                                //emptyalt - if an img tag contains an alt attribute with no values
                                //token index
                                data.emptyalt     = [];
                                //noalt - if an img tag does not contain an alt attribute
                                //token index
                                data.noalt        = [];
                                //formNoId - if a form control is missing an id attribute
                                //token index
                                data.formNoId     = [];
                                //formNoLabel - if a form control is missing a binding to a label
                                //[token index, id attr index]
                                data.formNoLabel  = [];
                                //tabindex - identifies elements with a tabindex attribute
                                //[token index, if value is greater than 0]
                                data.tabindex     = [];
                                //htmllang - if there is an <html> tag does it contain a lang or xml:lang
                                //attribute?
                                //boolean
                                data.htmllang     = false;

                                for (b = 0; b < c; b += 1) {
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
                                                data.violations += 1;
                                                data
                                                    .headings
                                                    .push([b, z, true]);
                                            } else {
                                                data
                                                    .headings
                                                    .push([b, z, false]);
                                            }
                                        }
                                        y = attrs[b].length;
                                        for (x = 0; x < y; x += 1) {
                                            attr = attrName(attrs[b][x]);
                                            if (attr[0] === "alt" && tagname === "img") {
                                                alttest = true;
                                                if (attr[1] === "") {
                                                    data
                                                        .emptyalt
                                                        .push(b);
                                                }
                                            }
                                            if (tagname === "label" && attr[0] === "for") {
                                                labelFor.push(attr[1]);
                                                fortest = true;
                                            } else if (tagname === "select" || tagname === "input" || tagname === "textarea") {
                                                if (attr[0] === "id" || (attr[0] === "type" && (attr[1].toLowerCase() === "hidden" || attr[1].toLowerCase() === "submit"))) {
                                                    id = true;
                                                    if (tagname === "input" && attr[0] === "type" && attr[1] === "hidden") {
                                                        hidden = true;
                                                    }
                                                    if (attr[0] === "id") {
                                                        formID.push([b, x]);
                                                    }
                                                } else {
                                                    z = namestack.length;
                                                    if (z > 0) {
                                                        do {
                                                            z -= 1;
                                                        } while (z > 0 && namestack[z][0] === "span");
                                                        if (namestack[z][0] === "label") {
                                                            hidden = true;
                                                        }
                                                    }
                                                }
                                            } else if (tagname === "html") {
                                                html = true;
                                                if (attr[0] === "lang" || attr[0] === "xml:lang") {
                                                    data.htmllang = true;
                                                }
                                            }
                                            if (data.obsoleteTags[data.obsoleteTags.length - 1] !== b && (attr[0] === "alink" || attr[0] === "align" || attr[0] === "background" || attr[0] === "border" || attr[0] === "color" || attr[0] === "compact" || attr[0] === "face" || attr[0] === "height" || attr[0] === "language" || attr[0] === "link" || (attr[0] === "name" && tagname !== "meta" && tagname !== "iframe" && tagname !== "select" && tagname !== "input" && tagname !== "textarea") || attr[0] === "nowrap" || attr[0] === "size" || attr[0] === "start" || attr[0] === "text" || (attr[0] === "type" && tagname !== "script" && tagname !== "style" && tagname !== "input" && tagname !== "button" && tagname !== "link") || (attr[0] === "value" && tagname !== "input" && tagname !== "option" && tagname !== "textarea" && tagname !== "button") || attr[0] === "version" || attr[0] === "vlink" || attr[0] === "width")) {
                                                data
                                                    .obsoleteAttr
                                                    .push([b, x]);
                                            }
                                            if (attr[0] === "tabindex") {
                                                if (isNaN(Number(attr[1])) === true || Number(attr[1]) > 0) {
                                                    data
                                                        .tabindex
                                                        .push([b, true]);
                                                    data.violations += 1;
                                                } else {
                                                    data
                                                        .tabindex
                                                        .push([b, false]);
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
                                attr.push("<div>");
                                if (data.htmllang === false) {
                                    data.violations += 1;
                                    attr.push("<h4>HTML tag is a <strong>missing</strong> lang or xml:lang attribute</h4>");
                                } else {
                                    attr.push("<h4>HTML lang or xml:lang attribute is present</h4>");
                                }
                                attr.push("<p>The lang attribute ensures the natural language is properly understood by ass" +
                                        "isting applications.</p>");
                                attr.push("</div><div>");
                                //improperly nested tags
                                b               = data.badnest.length;
                                data.violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> improperly nested tag");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push("</h4> <p>Improperly nested tags produce unexpected behaviors.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[data.badnest[x][2]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.badnest[x][2]]);
                                        attr.push(" does not match start tag <code>");
                                        attr.push(token[data.badnest[x][1]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> from input line number ");
                                        attr.push(linen[data.badnest[x][1]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> improperly nested tags</h4>");
                                    attr.push("<p>Improperly nested tags produce unexpected behaviors.</p>");
                                }
                                attr.push("</div><div>");
                                //obsolete tags
                                b               = data.obsoleteTags.length;
                                data.violations += b;
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
                                        attr.push(token[data.obsoleteTags[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.obsoleteTags[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> obsolete HTML tags</h4>");
                                    attr.push("<p>Obsolete elements do not appropriately describe content.</p>");
                                }
                                attr.push("</div><div>");
                                //obsolete attributes
                                b = data.obsoleteAttr.length;
                                if (b > 0) {
                                    z = 0;
                                    attr.push("<h4><strong>");
                                    y = attr.length;
                                    attr.push("</strong> HTML tag");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" containing obsolete or inappropriate attributes</h4> <p>Obsolete attributes do " +
                                            "not appropriately describe content.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        tagname = token[data.obsoleteAttr[x][0]]
                                            .replace(/&/g, "&amp;")
                                            .replace(/</g, "&lt;")
                                            .replace(/>/g, "&gt;")
                                            .replace(attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x][1]], "<strong>" + attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x][1]] + "</strong>");
                                        if (x < b - 1 && data.obsoleteAttr[x][0] === data.obsoleteAttr[x + 1][0]) {
                                            do {
                                                tagname = tagname.replace(attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x + 1][1]], "<strong>" + attrs[data.obsoleteAttr[x][0]][data.obsoleteAttr[x + 1][1]] + "</strong>");
                                                x       += 1;
                                            } while (x < b - 1 && data.obsoleteAttr[x][0] === data.obsoleteAttr[x + 1][0]);
                                        }
                                        z += 1;
                                        attr.push("<li><code>");
                                        attr.push(tagname);
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.obsoleteAttr[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.splice(y, 0, z);
                                    data.violations += z;
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> HTML tags containing obsolete or inappropriate attributes" +
                                            "</h4>");
                                    attr.push("<p>Obsolete attributes do not appropriately describe content.</p>");
                                }
                                attr.push("</div><div>");
                                //form controls missing a required 'id' attribute
                                b               = data.formNoId.length;
                                data.violations += b;
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
                                        attr.push(token[data.formNoId[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.formNoId[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> form control elements missing a required <em>id</em> attr" +
                                            "ibute</h4> <p>The id attribute is required to bind a point of interaction to an " +
                                            "HTML label.</p>");
                                }
                                attr.push("</div><div>");
                                //form controls missing a binding to a label
                                b                = formID.length;
                                data.formNoLabel = [];
                                for (x = 0; x < b; x += 1) {
                                    for (y = labelFor.length - 1; y > -1; y -= 1) {
                                        if (attrName(attrs[formID[x][0]][formID[x][1]])[1] === labelFor[y]) {
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
                                data.violations += b;
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
                                        attr.push(token[data.formNoLabel[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.formNoLabel[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> form control elements not bound to a label</h4> <p>The <e" +
                                            "m>id</em> of a form control must match the <em>for</em> of a label.</p>");
                                }
                                attr.push("</div><div>");
                                //elements with tabindex
                                b = data.tabindex.length;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    y = attr.length;
                                    z = 0;
                                    attr.push(0);
                                    attr.push("</strong> <em>tabindex</em>");
                                    attr.push(" violation");
                                    attr.push("</h4> <p>The tabindex attribute should have a 0 or -1 value and should not be ov" +
                                            "er used. Only tabindexes with a value greater than 0 are counted as violations, " +
                                            "but every element with a tabindex attribute is listed to quickly indicate if it " +
                                            "used excessively.</p> <ol>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        if (data.tabindex[x][1] === true) {
                                            attr.push("<strong>");
                                            z += 1;
                                        }
                                        attr.push(token[data.tabindex[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
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
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> elements with a <em>tabindex</em> attribute</h4> <p>The t" +
                                            "abindex attribute should have a 0 or -1 value and should not be over used.</p>");
                                }
                                attr.push("</div><div>");
                                //headings
                                b = data.headings.length;
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
                                        if (data.headings[x][2] === true) {
                                            attr.push("<strong>");
                                        }
                                        attr.push(token[data.headings[x][0]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        if (data.headings[x][2] === true) {
                                            attr.push("</strong>");
                                        }
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.headings[x][0]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> HTML heading elements</h4>");
                                    attr.push("<p>When heading tags are present it is important they are properly ordered so th" +
                                            "at the content they describe can be navigated in the proper order.</p>");
                                }
                                attr.push("</div><div>");
                                //missing alt attributes on images
                                b               = data.noalt.length;
                                data.violations += b;
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
                                        attr.push(token[data.noalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.noalt[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> images missing a required <em>alt</em> attribute</h4> <p>" +
                                            "The alt attribute is required even if it contains no value.</p>");
                                }
                                attr.push("</div><div>");
                                //alt attributes with empty values
                                b               = data.emptyalt.length;
                                data.violations += b;
                                if (b > 0) {
                                    attr.push("<h4><strong>");
                                    attr.push(b);
                                    attr.push("</strong> image");
                                    if (b > 1) {
                                        attr.push("s");
                                    }
                                    attr.push(" have an empty <em>alt</em> attribute value</h4> <p>Empty alt text is not necess" +
                                            "arily a violation, such as the case of tracking pixels. If an image has embedded" +
                                            " text this content should be supplied in the alt attribute.</p>");
                                    for (x = 0; x < b; x += 1) {
                                        attr.push("<li><code>");
                                        attr.push(token[data.emptyalt[x]].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        attr.push("</code> on input line number ");
                                        attr.push(linen[data.emptyalt[x]]);
                                        attr.push("</li>");
                                    }
                                    attr.push("</ol>");
                                } else {
                                    attr.push("<h4><strong>0</strong> images have an empty <em>alt</em> attribute value</h4>");
                                    attr.push("<p>Empty alt text is not necessarily a violation, such as the case of tracking p" +
                                            "ixels. If an image has embedded text this content should be supplied in the alt " +
                                            "attribute.</p>");
                                }
                                attr.push("</div>");
                                attr.push("</div>");
                                return attr.join("");
                            };
                        if (options.accessibility === false) {
                            return "";
                        }
                        findings.push(tagsbyname());
                        return findings.join("");
                    }()),
                    parseErrors   = (function markuppretty__apply_summary_parseErrors() {
                        var x     = parseError.length,
                            y     = 0,
                            fails = [];
                        data.violations += x;
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
                            outlines   = output
                                .split(lf)
                                .length,
                            outsize    = output.length,
                            linechange = (outlines / line) * 100,
                            charchange = (outsize / sourceSize) * 100;
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
                        table.push(numformat(sourceSize));
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
                        wordlist = safeSort(wordlist.join(" ").replace(binfix, "").toLowerCase().replace(/&nbsp;/gi, " ").replace(/(,|\.|\?|!|:|\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").split(" "));
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
                        wordtotal  = wordtotal
                            .sort(sortchild)
                            .slice(0, 11);
                        wordproper = wordproper
                            .sort(sortchild)
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
                if (options.accessibility === true) {
                    sum.push(accessibility);
                }
                sum.push(statistics);
                sum.push(analysis(reqs));
                sum.push(zipf);
                sum.push("</div>");
                if (options.accessibility === true) {
                    return sum
                        .join("")
                        .replace("<div class='doc'>", "<p><strong>Total potential accessibility violations:</strong> <em>" + data.violations + "</em></p> <div class='doc'>");
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
        var localPath = (typeof process === "object" && typeof process.cwd === "function" && (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true) && typeof __dirname === "string")
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
    exports.api = function commonjs(x) {
        "use strict";
        return markuppretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api = function requirejs_export(x) {
            return markuppretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
