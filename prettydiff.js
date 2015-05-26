/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " ", api.vertical: true */
/*global pd, exports, define */
/*

 Execute in a NodeJS app:

    npm install prettydiff        (local install)

    var prettydiff = require("prettydiff"),
        args       = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output     = prettydiff.api(args);

 Execute on command line with NodeJS:

    npm install prettydiff -g     (global install)

    prettydiff source:"c:\mydirectory\myfile.js" readmethod:"file" diff:"c:\myotherfile.js"

 Execute with WSH:
    cscript prettydiff.wsf /source:"myFile.xml" /mode:"beautify"

 Execute from JavaScript:
    var args   = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output = prettydiff(args);


                *******   license start   *******
 @source: http://prettydiff.com/prettydiff.js
 @documentation - English: http://prettydiff.com/documentation.php

 @licstart  The following is the entire license notice for Pretty Diff.

 This code may not be used or redistributed unless the following
 conditions are met:

 * Prettydiff created by Austin Cheney originally on 3 Mar 2009.
 http://prettydiff.com/

 * The use of diffview.js and prettydiff.js must contain the following
 copyright:
 Copyright (c) 2007, Snowtide Informatics Systems, Inc.
 All rights reserved.
     - Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
     - Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the
 distribution.
     - Neither the name of the Snowtide Informatics Systems nor the
 names of its contributors may be used to endorse or promote products
 derived from this software without specific prior written
 permission.
     - used as diffview function
     http://prettydiff.com/lib/diffview.js

 * The code mentioned above has significantly expanded documentation in
 each of the respective function's external JS file as linked from the
 documentation page:
 http://prettydiff.com/documentation.php

 * In addition to the previously stated requirements any use of any
 component, aside from directly using the full files in their entirety,
 must restate the license mentioned at the top of each concerned file.

 If each and all these conditions are met use, extension, alteration,
 and redistribution of Pretty Diff and its required assets is unlimited
 and free without author permission.

 @licend  The above is the entire license notice for Pretty Diff.
                *******   license end   *******


 Join the Pretty Diff mailing list at:
 https://groups.google.com/d/forum/pretty-diff

 Special thanks to:

 * Harry Whitfield for the numerous test cases provided against
 JSPretty.  http://g6auc.me.uk/

 * Andreas Greuel for contributing samples to test diffview.js
 https://plus.google.com/105958105635636993368/posts

 */
var prettydiff = function prettydiff(api) {
        "use strict";
        var startTime     = Date.now(),
            jsxstatus     = false,
            summary       = "",
            charDecoder   = function init_charDecoder() {
                return;
            },
            csspretty     = function init_csspretty() {
                return;
            },
            csvbeauty     = function init_csvbeauty() {
                return;
            },
            csvmin        = function init_csvmin() {
                return;
            },
            diffview      = function init_diffview() {
                return;
            },
            jspretty      = function init_jspretty() {
                return;
            },
            markupmin     = function init_markupmin() {
                return;
            },
            markup_beauty = function init_markup_beauty() {
                return;
            },

            //everything above, except "startTime", "jsxstatus", and
            //"summary" is a library.  Here is the logic that puts it
            //all together into a combined application
            core          = function core(api) {
                var spacetest       = (/^\s+$/g),
                    apioutput       = "",
                    apidiffout      = "",
                    builder         = {},
                    setlangmode = function dom__langkey_setlangmode(input) {
                        if (input === "css" || input === "less" || input === "scss") {
                            return "css";
                        }
                        if (input.indexOf("html") > -1 || input === "html" || input === "ejs" || input === "html_ruby" || input === "handlebars" || input === "twig" || input === "php") {
                            return "html";
                        }
                        if (input === "markup" || input === "jsp" || input === "xml" || input === "xhtml") {
                            return "markup";
                        }
                        if (input === "javascript" || input === "json" || input === "jsx" || input === "tss") {
                            return "javascript";
                        }
                        if (input === "text") {
                            return "text";
                        }
                        if (input === "csv") {
                            return "csv";
                        }
                        return "javascript";
                    },
                    nameproper = function dom__langkey_nameproper(input) {
                        if (input === "javascript") {
                            return "JavaScript";
                        }
                        if (input === "text") {
                            return "Plain Text";
                        }
                        if (input === "jsx") {
                            return "React JSX";
                        }
                        if (input === "scss") {
                            return "SCSS (Sass)";
                        }
                        if (input === "ejs") {
                            return "EJS Template";
                        }
                        if (input === "handlebars") {
                            return "Handlebars Template";
                        }
                        if (input === "html_ruby") {
                            return "ERB (Ruby) Template";
                        }
                        if (input === "typescript") {
                            return "TypeScript (not supported yet)";
                        }
                        if (input === "twig") {
                            return "HTML TWIG Template";
                        }
                        if (input === "jsp") {
                            return "JSTL (JSP)";
                        }
                        if (input === "java") {
                            return "Java (not supported yet)";
                        }
                        return input.toUpperCase();
                    },
                    //determines api source as necessary to make a decision about whether to supply
                    //externally needed JS functions to reports
                    capi            = (api.api === undefined || api.api.length === 0) ? "" : api.api,
                    //braceline - should a new line pad the interior of blocks (curly braces) in
                    //JavaScript
                    cbraceline      = (api.braceline === true || api.braceline === "true") ? true : false,
                    //api.bracepadding - should curly braces be padded with a space in JavaScript?
                    cbracepadding   = (api.bracepadding === true || api.bracepadding === "true") ? true : false,
                    //api.indent - should JSPretty format JavaScript in the normal KNR style or push
                    //curly braces onto a separate line like the "allman" style
                    cbraces         = (api.braces === "allman") ? "allman" : "knr",
                    //api.comments - if comments should receive indentation or not
                    ccomm           = (api.comments === "noindent") ? "noindent" : ((api.comments === "nocomment") ? "nocomment" : "indent"),
                    //api.conditional - should IE conditional comments be preserved during markup
                    //minification
                    ccond           = (api.conditional === true || api.conditional === "true") ? true : false,
                    //api.content - should content be normalized during a diff operation
                    ccontent        = (api.content === true || api.content === "true") ? true : false,
                    //api.context - should the diff report only include the differences, if so then
                    //buffered by how many lines of code
                    ccontext        = (api.context === "" || (/^(\s+)$/).test(api.context) || isNaN(api.context)) ? "" : Number(api.context),
                    //api.correct - should JSPretty make some corrections for sloppy JS
                    ccorrect        = (api.correct === true || api.correct === "true") ? true : false,
                    //api.cssinsertlines = if a new line should be forced between each css block
                    ccssinsertlines = (api.cssinsertlines === true || api.cssinsertlines === "true") ? true : false,
                    //api.csvchar - what character should be used as a separator
                    ccsvchar        = (typeof api.csvchar === "string" && api.csvchar.length > 0) ? api.csvchar : ",",
                    //api.diff - source code to compare with
                    cdiff           = (typeof api.diff === "string" && api.diff.length > 0 && (/^(\s+)$/).test(api.diff) === false) ? api.diff : "",
                    //api.diffcli - if operating from Node.js and set to true diff output will be
                    //printed to stdout just like git diff
                    cdiffcli        = (api.diffcli === true || api.diffcli === "true") ? true : false,
                    //api.diffcomments - should comments be included in the diff operation
                    cdiffcomments   = (api.diffcomments === true || api.diffcomments === "true") ? true : false,
                    //api.difflabel - a text label to describe the diff code
                    cdifflabel      = (typeof api.difflabel === "string" && api.difflabel.length > 0) ? api.difflabel : "new",
                    //api.diffview - should the diff report be a single column showing both sources
                    //simultaneously "inline" or showing the sources in separate columns
                    //"sidebyside"
                    cdiffview       = (api.diffview === "inline") ? "inline" : "sidebyside",
                    //api.elseline - for the 'else' keyword onto a new line in JavaScript
                    celseline       = (api.elseline === true || api.elseline === "true") ? true : false,
                    //api.force_indent - should markup beautification always force indentation even
                    //if disruptive
                    cforce          = (api.force_indent === true || api.force_indent === "true") ? true : false,
                    //api.html - should markup be presumed to be HTML with all the aloppiness HTML
                    //allows
                    chtml           = (api.html === true || api.html === "true" || (typeof api.html === "string" && api.html === "html-yes")) ? true : false,
                    //api.inchar - what character should be used to create a single identation
                    cinchar         = (typeof api.inchar === "string" && api.inchar.length > 0) ? api.inchar : " ",
                    //api.inlevel - should indentation in JSPretty be buffered with additional
                    //indentation?  Useful when supplying code to sites accepting markdown
                    cinlevel        = (isNaN(api.inlevel) || Number(api.inlevel) < 1) ? 0 : Number(api.inlevel),
                    //api.insize - how many characters from api.inchar should constitute a single
                    //indentation
                    cinsize         = (isNaN(api.insize)) ? 4 : Number(api.insize),
                    //api.jsscope - do you want to enable the jsscope feature of JSPretty?  This
                    //feature will output formatted HTML instead of text code showing which
                    //variables are declared at which functional depth
                    cjsscope        = (api.jsscope === true || api.jsscope === "true") ? "report" : (api.jsscope !== "html" && api.jsscope !== "report") ? "none" : api.jsscope,
                    //api.lang - which programming language will we be analyzing
                    clang           = (typeof api.lang === "string") ? setlangmode(api.lang.toLowerCase()) : "auto",
                    //api.langdefault - what language should lang value "auto" resort to when it
                    //cannot determine the language
                    clangdefault    = (typeof api.langdefault === "string") ? setlangmode(api.langdefault.toLowerCase()) : "text",
                    //api.mode - is this a minify, beautify, or diff operation
                    cmode           = (typeof api.mode === "string" && (api.mode === "minify" || api.mode === "beautify" || api.mode === "parse")) ? api.mode : "diff",
                    //api.obfuscate - when minifying code with JSPretty should we make it sloppy and
                    //change variable names to make the code extra small?
                    cobfuscate      = (api.obfuscate === true || api.obfuscate === "true") ? true : false,
                    //api.objsort will alphabetize object keys in JavaScript
                    cobjsort        = (api.objsort === "all" || (api.objsort === "css" && clang !== "javascript") || (api.objsort === "js" && clang !== "css")) ? true : false,
                    //api.preserve - should empty lines be preserved in beautify operations of
                    //JSPretty?
                    cpreserve       = (api.preserve === "all" || (api.preserve === "css" && clang !== "javascript") || (api.preserve === "js" && clang !== "css")) ? true : false,
                    //api.quote - should all single quote characters be converted to double quote
                    //characters during a diff operation to reduce the number of false positive
                    //comparisons
                    cquote          = (api.quote === true || api.quote === "true") ? true : false,
                    //api.quoteConvert - convert " to ' (or ' to ") of string literals or markup
                    //attributes
                    cquoteConvert   = (api.quoteConvert === "single" || api.quoteConvert === "double") ? api.quoteConvert : "none",
                    //api.semicolon - should trailing semicolons be removed during a diff operation
                    //to reduce the number of false positive comparisons
                    csemicolon      = (api.semicolon === true || api.semicolon === "true") ? true : false,
                    //api.source - the source code in minify and beautify operations or "base" code
                    //in operations
                    csource         = (typeof api.source === "string" && api.source.length > 0 && (/^(\s+)$/).test(api.source) === false) ? api.source : ((cmode === "diff") ? "" : "Source sample is missing."),
                    //api.sourcelabel - a text label to describe the api.source code for the diff
                    //report
                    csourcelabel    = (typeof api.sourcelabel === "string" && api.sourcelabel.length > 0) ? api.sourcelabel : "base",
                    //api.space - should JSPretty include a space between a function keyword and the
                    //next adjacent opening parenthesis character in beautification operations
                    cspace          = (api.space === false || api.space === "false") ? false : true,
                    //api.style - should JavaScript and CSS code receive indentation if embedded
                    //inline in markup
                    cstyle          = (api.style === "noindent") ? "noindent" : "indent",
                    //api.styleguide - preset of beautification options to bring a JavaScript sample
                    //closer to conformance of a given style guide
                    cstyleguide     = (typeof api.styleguide === "string") ? api.styleguide : "",
                    //api.titanium - TSS document support via option, because this is a uniquely
                    //modified form of JSON
                    ctitanium       = (api.titanium === true || api.titanium === "true") ? true : false,
                    //api.topcoms - should comments at the top of a JavaScript or CSS source be
                    //preserved during minify operations
                    ctopcoms        = (api.topcoms === true || api.topcoms === "true") ? true : false,
                    //varword - should consecutive variables be merged into a comma separated list
                    //or the opposite
                    cvarword        = (api.varword === "each" || api.varword === "list") ? api.varword : "none",
                    //api.vertical - whether or not to vertically align lists of assigns in CSS and
                    //JavaScript
                    cvertical       = (api.vertical === "all" || (api.vertical === "css" && clang !== "javascript") || (api.vertical === "js" && clang !== "css")) ? true : false,
                    //api.wrap - in markup beautification should text content wrap after the first
                    //complete word up to a certain character length
                    cwrap           = (isNaN(api.wrap) === true) ? 80 : Number(api.wrap),
                    autoval         = [],
                    autostring      = "",
                    auto        = function core__auto(a) {
                        var b        = [],
                            c        = 0,
                            d        = 0,
                            join     = "",
                            flaga    = false,
                            flagb    = false,
                            defaultt = clangdefault,
                            output   = function core__auto_output(langname) {
                                if (langname === "unknown") {
                                    return [
                                        defaultt, setlangmode(defaultt), "unknown"
                                    ];
                                }
                                return [
                                    langname, setlangmode(langname), nameproper(langname)
                                ];
                            };
                        if (a === null) {
                            return;
                        }
                        if (a === undefined || (/^(\s*#(?!(\!\/)))/).test(a) === true || (/\n\s*(\.|@)mixin\(?(\s*)/).test(a) === true) {
                            if ((/\$[a-zA-Z]/).test(a) === true || (/\{\s*(\w|\.|\$|#)+\s*\{/).test(a) === true) {
                                return output("scss");
                            }
                            if ((/@[a-zA-Z]/).test(a) === true || (/\{\s*(\w|\.|@|#)+\s*\{/).test(a) === true) {
                                return output("less");
                            }
                            return output("css");
                        }
                        b = a.replace(/\[[a-zA-Z][\w\-]*\=("|')?[a-zA-Z][\w\-]*("|')?\]/g, "").split("");
                        c = b.length;
                        if ((/^([\s\w\-]*<)/).test(a) === false && (/(>[\s\w\-]*)$/).test(a) === false) {
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
                            if ((/^(\s*(\{|\[))/).test(a) === true && (/((\]|\})\s*)$/).test(a) && a.indexOf(",") !== -1) {
                                return output("json");
                            }
                            if ((/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i).test(a) === true && ((/(var\s+[a-z]+[a-zA-Z0-9]*)/).test(a) === true || (/((\=|(\$\())\s*function)|(\s*function\s+(\w*\s+)?\()/).test(a) === true || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a) === true)) {
                                if (a.indexOf("(") > -1 || a.indexOf("=") > -1 || (a.indexOf(";") > -1 && a.indexOf("{") > -1)) {
                                    if ((/:\s*((number)|(string))/).test(a) === true && (/((public)|(private))\s+/).test(a) === true) {
                                        return output("typescript");
                                    }
                                    return output("javascript");
                                }
                                return output("unknown");
                            }
                            if (a.indexOf("{") !== -1 && (/^(\s*[\{\$\.#@a-z0-9])|^(\s*\/(\*|\/))|^(\s*\*\s*\{)/i).test(a) === true && (/^(\s*if\s*\()/).test(a) === false && (/\=\s*(\{|\[|\()/).test(join) === false && (((/(\+|\-|\=|\*|\?)\=/).test(join) === false || (/\/\/\s*\=+/).test(join) === true) || ((/\=+('|")?\)/).test(a) === true && (/;\s*base64/).test(a) === true)) && (/function(\s+\w+)*\s*\(/).test(join) === false) {
                                if ((/:\s*((number)|(string))/).test(a) === true && (/((public)|(private))\s+/).test(a) === true) {
                                    return output("typescript");
                                }
                                if ((/((public)|(private))\s+(((static)?\s+(v|V)oid)|(class)|(final))/).test(a) === true) {
                                    return output("java");
                                }
                                if ((/<[a-zA-Z]/).test(a) === true && (/<\/[a-zA-Z]/).test(a) === true && ((/\s?\{%/).test(a) === true || (/\{(\{|#)(?!(\{|#|\=))/).test(a) === true)) {
                                    return output("twig");
                                }
                                if ((/^\s*($|@)/).test(a) === false && ((/:\s*(\{|\(|\[)/).test(a) === true || (/^(\s*return;?\s*\{)/).test(a) === true) && (/(\};?\s*)$/).test(a) === true) {
                                    return output("javascript");
                                }
                                if ((/\{\{#/).test(a) === true && (/\{\{\//).test(a) === true && (/<\w/).test(a) === true) {
                                    return output("handlebars");
                                }
                                if ((/\{\s*(\w|\.|@|#)+\s*\{/).test(a) === true) {
                                    return output("less");
                                }
                                if ((/\$(\w|\-)/).test(a) === true) {
                                    return output("scss");
                                }
                                if ((/(:|;|\{)\s*@\w/).test(a) === true) {
                                    return output("less");
                                }
                                return output("css");
                            }
                            if ((/"\s*:\s*\{/).test(a) === true) {
                                return output("tss");
                            }
                            return output("unknown");
                        }
                        if ((((/(>[\w\s:]*)?<(\/|\!)?[\w\s:\-\[]+/).test(a) === true || (/^(\s*<\?xml)/).test(a) === true) && ((/^([\s\w]*<)/).test(a) === true || (/(>[\s\w]*)$/).test(a) === true)) || ((/^(\s*<s((cript)|(tyle)))/i).test(a) === true && (/(<\/s((cript)|(tyle))>\s*)$/i).test(a) === true)) {
                            if (((/\s*<\!doctype html>/i).test(a) === true && (/\s*<html/i).test(a) === true) || ((/^(\s*<\!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/).test(a) === true && (/XHTML\s+1\.1/).test(a) === false && (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === false)) {
                                if ((/<%\s*\}/).test(a) === true) {
                                    return output("ejs");
                                }
                                if ((/<%\s*end/).test(a) === true) {
                                    return output("html_ruby");
                                }
                                if ((/\{\{(#|\/|\{)/).test(a) === true) {
                                    return output("handlebars");
                                }
                                if ((/\{\{end\}\}/).test(a) === true) {
                                    //place holder for Go lang templates
                                    return output("html");
                                }
                                if ((/\s?\{%/).test(a) === true && (/\{(\{|#)(?!(\{|#|\=))/).test(a) === true) {
                                    return output("twig");
                                }
                                if ((/<\?/).test(a) === true) {
                                    return output("php");
                                }
                                if ((/<jsp:include\s/).test(a) === true || (/<c:((set)|(if))\s/).test(a) === true) {
                                    return output("jsp");
                                }
                                return output("html");
                            }
                            if ((/^(\s*<\?xml)/).test(a) === true) {
                                if ((/<%\s*\}/).test(a) === true) {
                                    return output("ejs");
                                }
                                if ((/<%\s*end/).test(a) === true) {
                                    return output("html_ruby");
                                }
                                if ((/\{\{(#|\/|\{)/).test(a) === true) {
                                    return output("handlebars");
                                }
                                if ((/\{\{end\}\}/).test(a) === true) {
                                    //place holder for Go lang templates
                                    return ("xml");
                                }
                                if ((/\s?\{%/).test(a) === true && (/\{\{(?!(\{|#|\=))/).test(a) === true) {
                                    return output("twig");
                                }
                                if ((/<\?(?!(xml))/).test(a) === true) {
                                    return output("php");
                                }
                                if ((/<jsp:include\s/).test(a) === true || (/<c:((set)|(if))\s/).test(a) === true) {
                                    return output("jsp");
                                }
                                if ((/XHTML\s+1\.1/).test(a) === true || (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === true) {
                                    return output("xhtml");
                                }
                                return output("xml");
                            }
                            if ((/<jsp:include\s/).test(a) === true || (/<c:((set)|(if))\s/).test(a) === true) {
                                return output("jsp");
                            }
                            return output("xml");
                        }
                        return output("unknown");
                    },
                    proctime        = function core__proctime() {
                        var minuteString = "",
                            hourString   = "",
                            minutes      = 0,
                            hours        = 0,
                            elapsed      = ((Date.now() - startTime) / 1000),
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
                    pdcomment       = function core__pdcomment() {
                        var comment    = "",
                            a          = 0,
                            b          = csource.length,
                            c          = csource.indexOf("/*prettydiff.com") + 16,
                            difftest   = false,
                            build      = [],
                            comma      = -1,
                            g          = 0,
                            sourceChar = [],
                            quote      = "",
                            sind       = csource.indexOf("/*prettydiff.com"),
                            dind       = cdiff.indexOf("/*prettydiff.com");
                        if (sind < 0 && dind < 0) {
                            return;
                        }
                        if (sind > -1 && (/^(\s*\{\s*"token"\s*:\s*\[)/).test(csource) === true && (/\]\,\s*"types"\s*:\s*\[/).test(csource) === true) {
                            return;
                        }
                        if (sind < 0 && dind > -1 && (/^(\s*\{\s*"token"\s*:\s*\[)/).test(cdiff) === true && (/\]\,\s*"types"\s*:\s*\[/).test(cdiff) === true) {
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
                            if (typeof build[c][1] === "string") {
                                build[c][0] = build[c][0].replace("api.", "");
                                if (build[c][0] === "braceline") {
                                    if (build[c][1] === "true") {
                                        cbraceline = true;
                                    } else if (build[c][1] === "false") {
                                        cbraceline = false;
                                    }
                                } else if (build[c][0] === "bracepadding") {
                                    if (build[c][1] === "true") {
                                        cbracepadding = true;
                                    } else if (build[c][1] === "false") {
                                        cbracepadding = false;
                                    }
                                } else if (build[c][0] === "braces" || build[c][0] === "indent") {
                                    if (build[c][1] === "knr") {
                                        cbraces = "knr";
                                    } else if (build[c][1] === "allman") {
                                        cbraces = "allman";
                                    }
                                } else if (build[c][0] === "comments") {
                                    if (build[c][1] === "indent") {
                                        ccomm = "indent";
                                    } else if (build[c][1] === "noindent") {
                                        ccomm = "noindent";
                                    }
                                } else if (build[c][0] === "conditional") {
                                    if (build[c][1] === "true") {
                                        ccond = true;
                                    } else if (build[c][1] === "false") {
                                        ccond = false;
                                    }
                                } else if (build[c][0] === "content") {
                                    if (build[c][1] === "true") {
                                        ccontent = true;
                                    } else if (build[c][1] === "false") {
                                        ccontent = false;
                                    }
                                } else if (build[c][0] === "context" && ((/\D/).test(build[c][1]) === false || build[c][1] === "")) {
                                    ccontext = build[c][1];
                                } else if (build[c][0] === "correct") {
                                    if (build[c][1] === "true") {
                                        ccorrect = true;
                                    } else if (build[c][1] === "false") {
                                        ccorrect = false;
                                    }
                                } else if (build[c][0] === "csvchar") {
                                    ccsvchar = build[c][1];
                                } else if (build[c][0] === "diffcli") {
                                    if (build[c][1] === "true") {
                                        cdiffcli = true;
                                    } else if (build[c][1] === "false") {
                                        cdiffcli = false;
                                    }
                                } else if (build[c][0] === "diffcomments") {
                                    if (build[c][1] === "true") {
                                        cdiffcomments = true;
                                    } else if (build[c][1] === "false") {
                                        cdiffcomments = false;
                                    }
                                } else if (build[c][0] === "difflabel") {
                                    cdifflabel = build[c][1];
                                } else if (build[c][0] === "diffview") {
                                    if (build[c][1] === "sidebyside") {
                                        cdiffview = "sidebyside";
                                    } else if (build[c][1] === "inline") {
                                        cdiffview = "inline";
                                    }
                                } else if (build[c][0] === "elseline" && build[c][1] === "true") {
                                    celseline = true;
                                } else if (build[c][0] === "force_indent") {
                                    if (build[c][1] === "true") {
                                        cforce = true;
                                    } else if (build[c][1] === "false") {
                                        cforce = false;
                                    }
                                } else if (build[c][0] === "html") {
                                    if (build[c][1] === "html-no") {
                                        chtml = "html-no";
                                    } else if (build[c][1] === "html-yes") {
                                        chtml = "html-yes";
                                    }
                                } else if (build[c][0] === "inchar") {
                                    cinchar = build[c][1];
                                } else if (build[c][0] === "inlevel") {
                                    if (build[c][1] === "true") {
                                        cinlevel = true;
                                    } else if (build[c][1] === "false") {
                                        cinlevel = false;
                                    }
                                } else if (build[c][0] === "insize" && (/\D/).test(build[c][1]) === false) {
                                    cinsize = build[c][1];
                                } else if (build[c][0] === "jslines") {
                                    if (build[c][1] === "true") {
                                        cpreserve = true;
                                    } else if (build[c][1] === "false") {
                                        cpreserve = false;
                                    }
                                } else if (build[c][0] === "jsscope") {
                                    if (build[c][1] === "true") {
                                        cjsscope = true;
                                    } else if (build[c][1] === "false") {
                                        cjsscope = false;
                                    }
                                } else if (build[c][0] === "jsspace") {
                                    if (build[c][1] === "true") {
                                        cspace = true;
                                    } else if (build[c][1] === "false") {
                                        cspace = false;
                                    }
                                } else if (build[c][0] === "lang") {
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
                                } else if (build[c][0] === "langdefault") {
                                    if (build[c][1] === "javascript") {
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
                                } else if (build[c][0] === "mode") {
                                    if (build[c][1] === "beautify") {
                                        cmode = "beautify";
                                    } else if (build[c][1] === "minify") {
                                        cmode = "minify";
                                    } else if (build[c][1] === "diff") {
                                        cmode = "diff";
                                    } else if (build[c][1] === "parse") {
                                        cmode = "parse";
                                    }
                                } else if (build[c][0] === "obfuscate") {
                                    if (build[c][1] === "true") {
                                        cobfuscate = true;
                                    } else if (build[c][1] === "false") {
                                        cobfuscate = false;
                                    }
                                } else if (build[c][0] === "objsort") {
                                    if (build[c][1] === "all" || build[c][1] === "true") {
                                        cobjsort = true;
                                    } else if (build[c][1] === "css" && clang !== "javascript") {
                                        cobjsort = true;
                                    } else if (build[c][1] === "js" && clang !== "css") {
                                        cobjsort = true;
                                    } else if (build[c][1] === "none" || build[c][1] === "false") {
                                        cobjsort = false;
                                    }
                                } else if (build[c][0] === "preserve") {
                                    if (build[c][1] === "all" || build[c][1] === "true") {
                                        cpreserve = true;
                                    } else if (build[c][1] === "css" && clang !== "javascript") {
                                        cpreserve = true;
                                    } else if (build[c][1] === "js" && clang !== "css") {
                                        cpreserve = true;
                                    } else if (build[c][1] === "none" || build[c][1] === "false") {
                                        cpreserve = false;
                                    }
                                } else if (build[c][0] === "quote") {
                                    if (build[c][1] === "true") {
                                        cquote = true;
                                    } else if (build[c][1] === "false") {
                                        cquote = false;
                                    }
                                } else if (build[c][0] === "quoteConvert") {
                                    if (build[c][1] === "single") {
                                        cquoteConvert = "single";
                                    } else if (build[c][1] === "double") {
                                        cquoteConvert = "double";
                                    } else if (build[c][1] === "none") {
                                        cquoteConvert = "none";
                                    }
                                } else if (build[c][0] === "semicolon") {
                                    if (build[c][1] === "true") {
                                        csemicolon = true;
                                    } else if (build[c][1] === "false") {
                                        csemicolon = false;
                                    }
                                } else if (build[c][0] === "sourcelabel") {
                                    csourcelabel = build[c][1];
                                } else if (build[c][0] === "style") {
                                    if (build[c][1] === "indent") {
                                        cstyle = "indent";
                                    } else if (build[c][1] === "noindent") {
                                        cstyle = "noindent";
                                    }
                                } else if (build[c][0] === "styleguide") {
                                    cstyleguide = build[c][1];
                                } else if (build[c][0] === "titanium") {
                                    if (build[c][1] === "true") {
                                        ctitanium = true;
                                    } else if (build[c][1] === "false") {
                                        ctitanium = false;
                                    }
                                } else if (build[c][0] === "topcoms") {
                                    if (build[c][1] === "true") {
                                        ctopcoms = true;
                                    } else if (build[c][1] === "false") {
                                        ctopcoms = false;
                                    }
                                } else if (build[c][0] === "varword") {
                                    if (build[c][1] === "each") {
                                        cvarword = "each";
                                    } else if (build[c][1] === "list") {
                                        cvarword = "list";
                                    } else if (build[c][1] === "none") {
                                        cvarword = "none";
                                    }
                                } else if (build[c][0] === "vertical") {
                                    if (build[c][1] === "all" || build[c][1] === "true") {
                                        cvertical = true;
                                    } else if (build[c][1] === "css" && clang !== "javascript") {
                                        cvertical = true;
                                    } else if (build[c][1] === "js" && clang !== "css") {
                                        cvertical = true;
                                    } else if (build[c][1] === "none" || build[c][1] === "false") {
                                        cvertical = false;
                                    }
                                } else if (build[c][0] === "wrap" && isNaN(build[c][1]) === false) {
                                    cwrap = Number(build[c][1]);
                                }
                            }
                        }
                    };
                if (api.preserve === true || api.preserve === "true") {
                    cpreserve = true;
                }
                if (api.alphasort === true || api.alphasort === "true" || api.objsort === true || api.objsort === "true") {
                    cobjsort = true;
                }
                if (api.indent === "allman") {
                    cbraces = "allman";
                }
                if (api.vertical === true || api.vertical === "true") {
                    cvertical = true;
                }
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
                } else if (clang === "tss") {
                    ctitanium = true;
                    clang     = "javscript";
                }
                if (clang === "auto") {
                    autoval = auto(csource);
                    clang = autoval[1];
                    if (autoval[2] === "unknown") {
                        autostring = "<p>Code type set to <strong>auto</strong>, but language could not be determined. Language defaulted to <em>" + autoval[0] + "</em>.</p>";
                    } else {
                        autostring = "<p>Code type set to <strong>auto</strong>. Presumed language is <em>" + autoval[2] + "</em>.</p>";
                    }
                } else if (capi === "dom") {
                    autoval = [clang, clang, clang];
                    autostring = "<p>Code type is set to <strong>" + clang + "</strong>.</p>";
                } else {
                    clang = setlangmode(clang);
                    autostring = "<p>Code type is set to <strong>" + clang + "</strong>.</p>";
                }
                pdcomment();
                if (clang === "css") {
                    if (api.objsort === "js") {
                        cobjsort = false;
                    }
                    if (api.preserve === "js") {
                        cpreserve = false;
                    }
                    if (api.vertical === "js") {
                        cvertical = false;
                    }
                }
                if (clang === "js") {
                    if (api.objsort === "css") {
                        cobjsort = false;
                    }
                    if (api.preserve === "css") {
                        cpreserve = false;
                    }
                    if (api.vertical === "css") {
                        cvertical = false;
                    }
                }
                if (cmode === "minify") {
                    if (clang === "css") {
                        apioutput = csspretty({
                            mode        : cmode,
                            objsort     : cobjsort,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            topcoms     : ctopcoms
                        });
                    } else if (clang === "csv") {
                        apioutput = csvmin(csource, ccsvchar);
                    } else if (clang === "markup") {
                        apioutput = markupmin({
                            comments    : "",
                            conditional : ccond,
                            objsort     : cobjsort,
                            presume_html: chtml,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            styleguide  : cstyleguide,
                            top_comments: ctopcoms
                        });
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = "";
                    } else {
                        apioutput = jspretty({
                            correct     : ccorrect,
                            mode        : cmode,
                            obfuscate   : cobfuscate,
                            objsort     : cobjsort,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            styleguide  : cstyleguide,
                            titanium    : ctitanium,
                            topcoms     : ctopcoms,
                            varword     : cvarword,
                            wrap        : -1
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
                            if (summary.indexOf("<p id='jserror'>") === 0) {
                                output.push(summary);
                            } else if (summary !== "") {
                                output.push("<p><strong class='duplicate'>Duplicate id attribute values detected:</strong> " + summary + "</p>");
                            }
                            output.push("<div class='doc'><table class='analysis' summary='Minification efficiency report" +
                                "'><caption>Minification efficiency report</caption><thead><tr><th colspan='2'>Ou" +
                                "tput Size</th><th colspan='2'>Number of Lines From Input</th></tr></thead><tbody" +
                                "><tr><td colspan='2'>");
                            output.push(sizeNew);
                            output.push("</td><td colspan='2'>");
                            output.push(lines + 1);
                            output.push("</td></tr><tr><th>Operating System</th><th>Input Size</th><th>Size Difference</t" +
                                "h><th>Percentage of Decrease</th></tr><tr><th>Unix/Linux</th><td>");
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
                        if (jsxstatus === true) {
                            autoval = ["jsx", "javascript", "React JSX"];
                            autostring = "<p>Code type set to <strong>auto</strong>. Presumed language is <em>React JSX</em>.</p>";
                        }
                        return [
                            apioutput, autostring + proctime() + sizediff()
                        ];
                    }());
                }
                if (cmode === "parse") {
                    if (clang === "css") {
                        apioutput = csspretty({
                            mode        : cmode,
                            objsort     : cobjsort,
                            quoteConvert: cquoteConvert,
                            source      : csource
                        });
                    } else if (clang === "csv") {
                        apioutput  = "CSV not supported in parse mode";
                        apidiffout = "";
                    } else if (clang === "markup") {
                        apioutput = markup_beauty({
                            correct     : ccorrect,
                            html        : chtml,
                            mode        : cmode,
                            objsort     : cobjsort,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            varword     : cvarword
                        });
                        autostring = autostring + summary;
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = "";
                    } else {
                        apioutput = jspretty({
                            correct     : ccorrect,
                            mode        : cmode,
                            objsort     : cobjsort,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            titanium    : ctitanium,
                            varword     : cvarword
                        });
                    }
                    if (apidiffout === false) {
                        apidiffout = "";
                    }
                    if (jsxstatus === true) {
                        autostring = "<p>Code type is presumed to be <em>React JSX</em>.</p>";
                    }
                    if (apioutput.token !== undefined) {
                        autostring = autostring + "<p>Total tokens: <strong>" + apioutput.token.length + "</strong></p>";
                    }
                    return [
                        apioutput, autostring + proctime()
                    ];
                }
                if (cmode === "beautify") {
                    if (clang === "css") {
                        apioutput  = csspretty({
                            comm          : ccomm,
                            cssinsertlines: ccssinsertlines,
                            inchar        : cinchar,
                            insize        : cinsize,
                            mode          : cmode,
                            objsort       : cobjsort,
                            preserve      : cpreserve,
                            quoteConvert  : cquoteConvert,
                            source        : csource,
                            vertical      : (api.vertical === "jsonly") ? false : cvertical
                        });
                        apidiffout = summary;
                    } else if (clang === "csv") {
                        apioutput  = csvbeauty(csource, ccsvchar);
                        apidiffout = "";
                    } else if (clang === "markup") {
                        apioutput  = markup_beauty({
                            braceline   : cbraceline,
                            bracepadding: cbracepadding,
                            braces      : cbraces,
                            comments    : ccomm,
                            correct     : ccorrect,
                            force_indent: cforce,
                            html        : chtml,
                            inchar      : cinchar,
                            inlevel     : cinlevel,
                            insize      : cinsize,
                            mode        : cmode,
                            objsort     : cobjsort,
                            preserve    : cpreserve,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            space       : cspace,
                            style       : cstyle,
                            styleguide  : cstyleguide,
                            varword     : cvarword,
                            vertical    : (api.vertical === "jsonly") ? "jsonly" : cvertical,
                            wrap        : cwrap
                        });
                        apidiffout = summary;
                        if (cinchar !== "\t") {
                            apioutput = apioutput.replace(/\n[\t]*\u0020\/>/g, "");
                        }
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = "";
                    } else {
                        apioutput  = jspretty({
                            braceline   : cbraceline,
                            bracepadding: cbracepadding,
                            braces      : cbraces,
                            comments    : ccomm,
                            correct     : ccorrect,
                            elseline    : celseline,
                            inchar      : cinchar,
                            inlevel     : cinlevel,
                            insize      : cinsize,
                            jsscope     : cjsscope,
                            objsort     : cobjsort,
                            preserve    : cpreserve,
                            quoteConvert: cquoteConvert,
                            source      : csource,
                            space       : cspace,
                            styleguide  : cstyleguide,
                            titanium    : ctitanium,
                            varword     : cvarword,
                            vertical    : (api.vertical === "jsonly") ? true : cvertical,
                            wrap        : cwrap
                        });
                        apidiffout = summary;
                    }
                    if (apidiffout === false) {
                        apidiffout = "";
                    }
                    if (jsxstatus === true) {
                        autostring = "<p>Code type is presumed to be <em>React JSX</em>.</p>";
                    }
                    if (capi === "" && cjsscope !== "none" && clang === "javascript") {
                        builder.head       = "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>";
                        builder.cssCore    = "body{font-family:'Arial';font-size:10px;overflow-y:scroll;}#samples #dcolorScheme{position:relative;z-index:1000}#apireturn textarea{font-size:1.2em;height:50em;width:100%}button{border-radius:.9em;display:block;font-weight:bold;width:100%}div .button{text-align:center}div button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover{cursor:pointer}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin-right:1em;width:22.5em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:2em 0 0;text-align:right;width:9em}h1{float:left;font-size:2em;margin:0 .5em .5em 0}#hideOptions{margin-left:5em;padding:0}#title_text{border-style:solid;border-width:.05em;display:block;float:left;font-size:1em;margin-left:.55em;padding:.1em}h1 svg,h1 img{border-style:solid;border-width:.05em;float:left;height:2em;width:2em}h1 span{font-size:.5em}h2,h3{background:#fff;border-style:solid;border-width:.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 .5em .5em 0;padding:0 .2em}#doc h3{margin-top:.5em}h3{font-size:1.6em}h4{font-size:1.4em}fieldset{border-radius:.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}legend{border-style:solid;border-width:.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}#diffreport{right:57.8em}#beaureport{right:38.8em}#minnreport{right:19.8em}#statreport{right:.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#reports{height:4em}#reports h2{display:none}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:.8em;line-height:.5em;margin:-.85em 0 0;position:absolute;right:.05em;top:100%;width:.85em}.box button.minimize{margin:.35em 4em 0 0}.box button.maximize{margin:.35em 1.75em 0 0}.box button.save{margin:.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:.25em 0 0 .5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.options{border-radius:0 0 .9em .9em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}label{display:inline;font-size:1.4em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}body#doc ol li{font-size:1.1em}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:.4em 0;text-align:left;width:14em}p{clear:both;font-size:1.2em;margin:0 0 1em}#option_comment{height:2.5em;margin-bottom:-1.5em;width:100%}.difflabel{display:block;height:0}#beau-other-span,#diff-other-span{text-indent:-200em;width:0}.options p span{display:block;float:left;font-size:1.2em}#top{min-width:80em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:.5em;position:absolute;right:1em;top:11em}#announcement{height:2.5em;margin:0 -5em -4.75em;width:27.5em}#textreport{width:100%}#options{float:left;margin:0;width:19em}#options label{width:auto}#options p{clear:both;font-size:1em;margin:0;padding:0}#options p span{clear:both;float:none;height:2em;margin:0 0 0 2em}#csvchar{width:11.8em}#language,#csvchar,#colorScheme{margin:0 0 1em 2em}#codeInput{margin-left:22.5em}#Beautify.wide p,#Beautify.tall p.file,#Minify.wide p,#Minify.tall p.file{clear:none;float:none}#diffops p,#miniops p,#beauops p{clear:both;font-size:1em;padding-top:1em}#options p strong,#diffops p strong,#miniops p strong,#beauops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}input[type='radio']{margin:0 .25em}input[type='file']{box-shadow:none}select{border-style:inset;border-width:.1em;width:11.85em}.options input,.options label{border-style:none;display:block;float:left}.options span label{margin-left:.4em;white-space:nowrap;width:12em}.options p span label{font-size:1em}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:.1em}textarea{display:inline-block;height:10em;margin:0}strong label{font-size:1em;width:inherit}strong.new{background:#ff6;font-style:italic}#miniops span strong,#diffops span strong,#beauops span strong{display:inline;float:none;font-size:1em;width:auto}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}.clear{clear:both;display:block}.wide,.tall,#diffBase,#diffNew{border-radius:0 0 .9em .9em;margin-bottom:1em}#diffBase,#diffNew{padding:1em}#diffBase p,#diffNew p{clear:none;float:none}#diffBase.wide textarea,#diffNew.wide textarea{height:10.1em}.wide,.tall{padding:1em 1.25em 0}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:.5em .5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:.5em .5em .5em 2em}.wide label{float:none;margin-right:0;width:100%}.wide #beautyinput,.wide #minifyinput,.wide #beautyoutput,.wide #minifyoutput{height:14.8em;margin:0;width:99.5%}.tall .input{clear:none;float:left}.tall .output{clear:none;float:right;margin-top:-2.4em}.tall .input,.tall .output{width:49%}.tall .output label{text-align:right}.tall .input textarea{height:31.7em}.tall .output textarea{height:34em}.tall textarea{margin:0 0 -.1em;width:100%}.tall #beautyinput,.tall #minifyinput{float:left}.tall #beautyoutput,.tall #minifyoutput{float:right}.wide{width:auto}#diffBase.difftall,#diffNew.difftall{margin-bottom:1.3em;padding:1em 1% .9em;width:47.5%}#diffBase.difftall{float:left}#diffNew.difftall{float:right}.file input,.labeltext input{display:inline-block;margin:0 .7em 0 0;width:16em}.labeltext,.file{font-size:.9em;font-weight:bold;margin-bottom:1em}.difftall textarea{height:30.6em;margin-bottom:.5em}#diffBase textarea,#diffNew textarea{width:99.5%}.input,.output{margin:0}#diffBase.wide,#diffNew.wide{padding:.8em 1em}#diffBase.wide{margin-bottom:1.2em}#diffoutput{width:100%}#diffoutput p em,#diffoutput li em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}.analysis th{text-align:left}.analysis td{text-align:right}#doc ul{margin-top:1em}#doc ul li{font-size:1.2em}body#doc ul li{font-size:1.1em}#doc ol li span{display:block;margin-left:2em}.diff,.beautify{border-style:solid;border-width:.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;position:relative}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:.5em}.diff .skip{border-style:none none solid;border-width:0 0 .1em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 .1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 .1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 .1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff ol,.beautify ol{display:table-cell;margin:0;padding:0}.diff li,.beautify li{border-style:none none solid;border-width:0 0 .1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:.5em}.diff li{padding-top:.5em}.beautify .count li{padding-top:.5em}@media screen and (-webkit-min-device-pixel-ratio:0) {.beautify .count li{padding-top:.546em}}#doc .beautify .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:.5em}.diff .count,.beautify .count{border-style:solid;border-width:0 .1em 0 0;font-weight:normal;padding:0;text-align:right}.diff .count li,.beautify .count li{padding-left:2em}.diff .data,.beautify .data{text-align:left;white-space:pre}.diff .data li,.beautify .data li{letter-spacing:.1em;padding-left:.5em;white-space:pre}#webtool .diff h3{border-style:none solid solid;border-width:0 .1em .2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:.2em 2em;text-align:left}.diff li em{font-style:normal;margin:0 -.09em;padding:.05em 0}.diff p.author{border-style:solid;border-width:.2em .1em .1em;margin:0;overflow:hidden;padding:.4em;text-align:right}#dcolorScheme{float:right;margin:-2em 0 0 0}#dcolorScheme label{display:inline-block;font-size:1em;margin-right:1em}body#doc{font-size:.8em;max-width:80em}#doc th{font-weight:bold}#doc td span{display:block}#doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:.2em;clear:both}#doc table{font-size:1.2em}body#doc table{font-size:1em}#doc td,#doc th{border-left-style:solid;border-left-width:.1em;border-top-style:solid;border-top-width:.1em;padding:.5em}#doc em,.box .body em{font-style:normal;font-weight:bold}#doc div{margin-bottom:2em}#doc div div{clear:both;margin-bottom:1em}#doc h2{font-size:1.6em;margin:.5em .5em .5em 0}#doc ol{clear:both}#doc_contents li{font-size:1.75em;margin:1em 0 0}#doc_contents ol ol li{font-size:.75em;list-style:lower-alpha;margin:.5em 0 0}#doc_contents ol{padding-bottom:1em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:.25em .3em 0 0;padding-bottom:0}#doc_contents a{text-decoration:none}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}button,fieldset,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,.wide,.tall,#diffBase,#diffNew,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties{border-style:solid;border-width:.1em}#apitest p{clear:both;padding-top:.75em}#apitest label,#apitest select,#apitest input,#apitest textarea{float:left}#apitest label{width:20em}#apitest select,#apitest input,#apitest textarea{width:30em}#pdsamples{list-style-position:inside;margin:-12em 0 0 0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:.5em}#modalSave span{background:#000;display:block;left:0;opacity:.5;position:absolute;top:0;z-index:9000}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}@media print{p,.options,#Beautify,#Minify,#diff,ul{display:none}div{width:100%}html td{font-size:.8em;white-space:normal}}";
                        builder.cssColor   = "html .white,body.white{color:#333}body.white button{background:#eee;border-color:#222;box-shadow:0 .1em .2em rgba(64,64,64,0.75);color:#666;text-shadow:.05em .05em .1em #ccc}.white button:hover,.white button:active{background:#999;color:#eee;text-shadow:.1em .1em .1em #333}.white a{color:#009}.white #title_text{border-color:#fff;color:#333}.white #introduction h2{border-color:#999;color:#333}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#eee;border-color:#eee;box-shadow:none;padding-left:0;text-shadow:none}.white fieldset{background:#ddd;border-color:#999}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white .box{background:#666;border-color:#999;box-shadow:0 .4em .8em rgba(64,64,64,0.75)}.white .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:.2em .2em .4em #666}.white .box h3.heading:hover{background:#333;color:#eee}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 .4em rgba(64,64,64,0.75)}.white .options{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5);text-shadow:.05em .05em .1em #ccc}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white #option_comment{background:#ddd;border-color:#999}.white #top em{color:#00f}.white #update{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(64,64,64,0.5)}.white .wide,.white .tall,.white #diffBase,.white #diffNew{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5)}.white .file input,.white .labeltext input{border-color:#fff}#webtool.white input.unchecked{background:#ccc;color:#666}.white .options input[type=text],.white .options select{border-color:#999}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white #doc .analysis thead th,.white #doc .analysis th[colspan]{background:#eef}.white div input{border-color:#999}.white textarea{border-color:#999}.white textarea:hover{background:#eef8ff}.white .diff,.white .beautify,.white .diff ol,.white .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{background:#eed;border-color:#bbc;color:#886}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .data .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}.white .diff .data .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .equal,.white .beautify .data li{background-color:#fff;border-color:#eee}.white .beautify .data em.s1{color:#f66}.white .beautify .data em.s2{color:#12f}.white .beautify .data em.s3{color:#090}.white .beautify .data em.s4{color:#d6d}.white .beautify .data em.s5{color:#7cc}.white .beautify .data em.s6{color:#c85}.white .beautify .data em.s7{color:#737}.white .beautify .data em.s8{color:#6d0}.white .beautify .data em.s9{color:#dd0s}.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13{color:#cc3}.white .beautify .data em.s14{color:#333}.white .beautify .data em.s15{color:#9d9}.white .beautify .data em.s16{color:#880}.white .beautify .data .l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify .data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .beautify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.white .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{background:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l11{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautify .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white .beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea}.white .beautify .data .c0{background:#ddd}.white .beautify .data li{color:#777}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff .insert{background-color:#bfb;border-color:#aea}.white .diff .data .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white #doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc strong,.white .box .body strong{color:#c00}.white .box .body em,.white .box .body #doc em{color:#090}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #thirdparties img{box-shadow:.2em .2em .4em #999}.white #diffoutput #thirdparties{background:#eee}.white #doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc ol,#doc.white ol{background:#eee;border-color:#999}.white #doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc table,#doc.white table{background:#fff;border-color:#999}.white #doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,#doc.white tr:hover{background:#ddd}#doc.white em{color:#060}.white #doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}";
                        builder.cssExtra   = "body{background:#eee}#doc p em{color:#090}";
                        builder.body       = "</style></head><body id='webtool' class='";
                        builder.bodyColor  = "white";
                        builder.title      = "'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div class='doc'>";
                        builder.scriptOpen = "<script type='application/javascript'><![CDATA[";
                        builder.scriptBody = "var pd={};pd.beaufold=function dom__beaufold(){'use strict';var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b='',list=[self.parentNode.getElementsByTagName('li'),self.parentNode.nextSibling.getElementsByTagName('li')];if(self.innerHTML.charAt(0)==='-'){for(a=min;a<max;a+=1){list[0][a].style.display='none';list[1][a].style.display='none';}self.innerHTML='+'+self.innerHTML.substr(1);}else{for(a=min;a<max;a+=1){list[0][a].style.display='block';list[1][a].style.display='block';if(list[0][a].getAttribute('class')==='fold'&&list[0][a].innerHTML.charAt(0)==='+'){b=list[0][a].getAttribute('title');b=b.substring(b.indexOf('to line ')+1);a=Number(b)-1;}}self.innerHTML='-'+self.innerHTML.substr(1);}};(function(){'use strict';var lists=document.getElementsByTagName('ol'),listslen=lists.length,list=[],listlen=0,a=0,b=0;for(a=0;a<listslen;a+=1){if(lists[a].getAttribute('class')==='count'&&lists[a].parentNode.getAttribute('class')==='beautify'){list=lists[a].getElementsByTagName('li');listlen=list.length;for(b=0;b<listlen;b+=1){if(list[b].getAttribute('class')==='fold'){list[b].onmousedown=pd.beaufold;}}}}}());";
                        builder.scriptEnd  = "]]></script>";
                        return [
                            [
                                builder.head, builder.cssCore, builder.cssColor, builder.cssExtra, builder.body, builder.bodyColor, builder.title, auto, proctime(), "</div>", apidiffout, builder.scriptOpen, builder.scriptBody, builder.scriptEnd, "</body></html>"
                            ].join(""), ""
                        ];
                    }
                    return [
                        apioutput, autostring + proctime() + apidiffout
                    ];
                }
                if (cmode === "diff") {
                    summary = "diff";
                    if (cdiffcomments === false) {
                        ccomm = "nocomment";
                    }
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
                            objsort : cobjsort,
                            preserve: cpreserve,
                            source  : csource,
                            topcoms : ctopcoms,
                            vertical: false
                        });
                        apidiffout = csspretty({
                            comm    : ccomm,
                            diffcomm: cdiffcomments,
                            inchar  : cinchar,
                            insize  : cinsize,
                            mode    : cmode,
                            objsort : cobjsort,
                            preserve: cpreserve,
                            source  : cdiff,
                            topcoms : ctopcoms,
                            vertical: false
                        });
                    } else if (clang === "csv") {
                        apioutput  = csvbeauty(csource, ccsvchar);
                        apidiffout = csvbeauty(cdiff, ccsvchar);
                    } else if (clang === "markup") {
                        apioutput  = markup_beauty({
                            bracepadding: cbracepadding,
                            braces      : cbraces,
                            comments    : ccomm,
                            conditional : ccond,
                            content     : ccontent,
                            diffcomments: cdiffcomments,
                            force_indent: cforce,
                            html        : chtml,
                            inchar      : cinchar,
                            insize      : cinsize,
                            mode        : (cdiffcomments === true) ? "beautify" : "diff",
                            objsort     : cobjsort,
                            source      : csource,
                            style       : cstyle,
                            styleguide  : cstyleguide,
                            vertical    : false,
                            wrap        : cwrap
                        }).replace(/\n[\t]* \/>/g, "");
                        apidiffout = markup_beauty({
                            bracepadding: cbracepadding,
                            braces      : cbraces,
                            comments    : ccomm,
                            conditional : ccond,
                            content     : ccontent,
                            diffcomments: cdiffcomments,
                            force_indent: cforce,
                            html        : chtml,
                            inchar      : cinchar,
                            insize      : cinsize,
                            mode        : (cdiffcomments === true) ? "beautify" : "diff",
                            objsort     : cobjsort,
                            source      : cdiff,
                            style       : cstyle,
                            styleguide  : cstyleguide,
                            vertical    : false,
                            wrap        : cwrap
                        }).replace(/\n[\t]* \/>/g, "");
                    } else if (clang === "text") {
                        apioutput  = csource;
                        apidiffout = cdiff;
                    } else {
                        apioutput  = jspretty({
                            bracepadding: cbracepadding,
                            braces      : cbraces,
                            comments    : ccomm,
                            correct     : ccorrect,
                            elseline    : celseline,
                            inchar      : cinchar,
                            inlevel     : cinlevel,
                            insize      : cinsize,
                            jsscope     : false,
                            objsort     : cobjsort,
                            preserve    : false,
                            source      : csource,
                            space       : cspace,
                            styleguide  : cstyleguide,
                            titanium    : ctitanium,
                            vertical    : false,
                            wrap        : cwrap
                        });
                        apidiffout = jspretty({
                            bracepadding: cbracepadding,
                            braces      : cbraces,
                            comments    : ccomm,
                            correct     : ccorrect,
                            elseline    : celseline,
                            inchar      : cinchar,
                            inlevel     : cinlevel,
                            insize      : cinsize,
                            jsscope     : false,
                            objsort     : cobjsort,
                            preserve    : false,
                            source      : cdiff,
                            space       : cspace,
                            styleguide  : cstyleguide,
                            titanium    : ctitanium,
                            vertical    : false,
                            wrap        : cwrap
                        });
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
                        if (cdiffcli === true) {
                            return diffview({
                                baseTextLines: apioutput,
                                baseTextName : csourcelabel,
                                contextSize  : ccontext,
                                diffcli      : cdiffcli,
                                inline       : cdiffview,
                                newTextLines : apidiffout,
                                newTextName  : cdifflabel,
                                tchar        : cinchar,
                                tsize        : cinsize
                            });
                        }
                        if (apioutput === "Error: This does not appear to be JavaScript." || apidiffout === "Error: This does not appear to be JavaScript.") {
                            a[1] = [
                                "<p><strong>Error:</strong> Please try using the option labeled <em>Plain Text (d" + "iff only)</em>. <span style='display:block'>The input does not appear to be mark" + "up, CSS, or JavaScript.</span></p>", 0, 0
                            ];
                        } else {
                            if (clang !== "text") {
                                achar = cinchar;
                            }
                            a[1] = diffview({
                                baseTextLines: apioutput,
                                baseTextName : csourcelabel,
                                contextSize  : ccontext,
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
                        if (jsxstatus === true) {
                            autostring = "<p>Code type is presumed to be <em>React JSX</em>.</p>";
                        }
                        if (capi === "") {
                            builder.head          = "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>";
                            builder.cssCore       = "body{font-family:'Arial';font-size:10px;overflow-y:scroll;}#samples #dcolorScheme{position:relative;z-index:1000}#apireturn textarea{font-size:1.2em;height:50em;width:100%}button{border-radius:.9em;display:block;font-weight:bold;width:100%}div .button{text-align:center}div button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover{cursor:pointer}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin-right:1em;width:22.5em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:2em 0 0;text-align:right;width:9em}h1{float:left;font-size:2em;margin:0 .5em .5em 0}#hideOptions{margin-left:5em;padding:0}#title_text{border-style:solid;border-width:.05em;display:block;float:left;font-size:1em;margin-left:.55em;padding:.1em}h1 svg,h1 img{border-style:solid;border-width:.05em;float:left;height:2em;width:2em}h1 span{font-size:.5em}h2,h3{background:#fff;border-style:solid;border-width:.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 .5em .5em 0;padding:0 .2em}#doc h3{margin-top:.5em}h3{font-size:1.6em}h4{font-size:1.4em}fieldset{border-radius:.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}legend{border-style:solid;border-width:.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}#diffreport{right:57.8em}#beaureport{right:38.8em}#minnreport{right:19.8em}#statreport{right:.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#reports{height:4em}#reports h2{display:none}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:.8em;line-height:.5em;margin:-.85em 0 0;position:absolute;right:.05em;top:100%;width:.85em}.box button.minimize{margin:.35em 4em 0 0}.box button.maximize{margin:.35em 1.75em 0 0}.box button.save{margin:.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:.25em 0 0 .5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.options{border-radius:0 0 .9em .9em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}label{display:inline;font-size:1.4em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}body#doc ol li{font-size:1.1em}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:.4em 0;text-align:left;width:14em}p{clear:both;font-size:1.2em;margin:0 0 1em}#option_comment{height:2.5em;margin-bottom:-1.5em;width:100%}.difflabel{display:block;height:0}#beau-other-span,#diff-other-span{text-indent:-200em;width:0}.options p span{display:block;float:left;font-size:1.2em}#top{min-width:80em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:.5em;position:absolute;right:1em;top:11em}#announcement{height:2.5em;margin:0 -5em -4.75em;width:27.5em}#textreport{width:100%}#options{float:left;margin:0;width:19em}#options label{width:auto}#options p{clear:both;font-size:1em;margin:0;padding:0}#options p span{clear:both;float:none;height:2em;margin:0 0 0 2em}#csvchar{width:11.8em}#language,#csvchar,#colorScheme{margin:0 0 1em 2em}#codeInput{margin-left:22.5em}#Beautify.wide p,#Beautify.tall p.file,#Minify.wide p,#Minify.tall p.file{clear:none;float:none}#diffops p,#miniops p,#beauops p{clear:both;font-size:1em;padding-top:1em}#options p strong,#diffops p strong,#miniops p strong,#beauops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}input[type='radio']{margin:0 .25em}input[type='file']{box-shadow:none}select{border-style:inset;border-width:.1em;width:11.85em}.options input,.options label{border-style:none;display:block;float:left}.options span label{margin-left:.4em;white-space:nowrap;width:12em}.options p span label{font-size:1em}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:.1em}textarea{display:inline-block;height:10em;margin:0}strong label{font-size:1em;width:inherit}strong.new{background:#ff6;font-style:italic}#miniops span strong,#diffops span strong,#beauops span strong{display:inline;float:none;font-size:1em;width:auto}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}.clear{clear:both;display:block}.wide,.tall,#diffBase,#diffNew{border-radius:0 0 .9em .9em;margin-bottom:1em}#diffBase,#diffNew{padding:1em}#diffBase p,#diffNew p{clear:none;float:none}#diffBase.wide textarea,#diffNew.wide textarea{height:10.1em}.wide,.tall{padding:1em 1.25em 0}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:.5em .5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:.5em .5em .5em 2em}.wide label{float:none;margin-right:0;width:100%}.wide #beautyinput,.wide #minifyinput,.wide #beautyoutput,.wide #minifyoutput{height:14.8em;margin:0;width:99.5%}.tall .input{clear:none;float:left}.tall .output{clear:none;float:right;margin-top:-2.4em}.tall .input,.tall .output{width:49%}.tall .output label{text-align:right}.tall .input textarea{height:31.7em}.tall .output textarea{height:34em}.tall textarea{margin:0 0 -.1em;width:100%}.tall #beautyinput,.tall #minifyinput{float:left}.tall #beautyoutput,.tall #minifyoutput{float:right}.wide{width:auto}#diffBase.difftall,#diffNew.difftall{margin-bottom:1.3em;padding:1em 1% .9em;width:47.5%}#diffBase.difftall{float:left}#diffNew.difftall{float:right}.file input,.labeltext input{display:inline-block;margin:0 .7em 0 0;width:16em}.labeltext,.file{font-size:.9em;font-weight:bold;margin-bottom:1em}.difftall textarea{height:30.6em;margin-bottom:.5em}#diffBase textarea,#diffNew textarea{width:99.5%}.input,.output{margin:0}#diffBase.wide,#diffNew.wide{padding:.8em 1em}#diffBase.wide{margin-bottom:1.2em}#diffoutput{width:100%}#diffoutput p em,#diffoutput li em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}.analysis th{text-align:left}.analysis td{text-align:right}#doc ul{margin-top:1em}#doc ul li{font-size:1.2em}body#doc ul li{font-size:1.1em}#doc ol li span{display:block;margin-left:2em}.diff,.beautify{border-style:solid;border-width:.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;position:relative}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:.5em}.diff .skip{border-style:none none solid;border-width:0 0 .1em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 .1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 .1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 .1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff ol,.beautify ol{display:table-cell;margin:0;padding:0}.diff li,.beautify li{border-style:none none solid;border-width:0 0 .1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:.5em}.diff li{padding-top:.5em}.beautify .count li{padding-top:.5em}@media screen and (-webkit-min-device-pixel-ratio:0) {.beautify .count li{padding-top:.546em}}#doc .beautify .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:.5em}.diff .count,.beautify .count{border-style:solid;border-width:0 .1em 0 0;font-weight:normal;padding:0;text-align:right}.diff .count li,.beautify .count li{padding-left:2em}.diff .data,.beautify .data{text-align:left;white-space:pre}.diff .data li,.beautify .data li{letter-spacing:.1em;padding-left:.5em;white-space:pre}#webtool .diff h3{border-style:none solid solid;border-width:0 .1em .2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:.2em 2em;text-align:left}.diff li em{font-style:normal;margin:0 -.09em;padding:.05em 0}.diff p.author{border-style:solid;border-width:.2em .1em .1em;margin:0;overflow:hidden;padding:.4em;text-align:right}#dcolorScheme{float:right;margin:-2em 0 0 0}#dcolorScheme label{display:inline-block;font-size:1em;margin-right:1em}body#doc{font-size:.8em;max-width:80em}#doc th{font-weight:bold}#doc td span{display:block}#doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:.2em;clear:both}#doc table{font-size:1.2em}body#doc table{font-size:1em}#doc td,#doc th{border-left-style:solid;border-left-width:.1em;border-top-style:solid;border-top-width:.1em;padding:.5em}#doc em,.box .body em{font-style:normal;font-weight:bold}#doc div{margin-bottom:2em}#doc div div{clear:both;margin-bottom:1em}#doc h2{font-size:1.6em;margin:.5em .5em .5em 0}#doc ol{clear:both}#doc_contents li{font-size:1.75em;margin:1em 0 0}#doc_contents ol ol li{font-size:.75em;list-style:lower-alpha;margin:.5em 0 0}#doc_contents ol{padding-bottom:1em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:.25em .3em 0 0;padding-bottom:0}#doc_contents a{text-decoration:none}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}button,fieldset,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,.wide,.tall,#diffBase,#diffNew,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties{border-style:solid;border-width:.1em}#apitest p{clear:both;padding-top:.75em}#apitest label,#apitest select,#apitest input,#apitest textarea{float:left}#apitest label{width:20em}#apitest select,#apitest input,#apitest textarea{width:30em}#pdsamples{list-style-position:inside;margin:-12em 0 0 0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:.5em}#modalSave span{background:#000;display:block;left:0;opacity:.5;position:absolute;top:0;z-index:9000}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}@media print{p,.options,#Beautify,#Minify,#diff,ul{display:none}div{width:100%}html td{font-size:.8em;white-space:normal}}";
                            builder.cssColor      = "html .white,body.white{color:#333}body.white button{background:#eee;border-color:#222;box-shadow:0 .1em .2em rgba(64,64,64,0.75);color:#666;text-shadow:.05em .05em .1em #ccc}.white button:hover,.white button:active{background:#999;color:#eee;text-shadow:.1em .1em .1em #333}.white a{color:#009}.white #title_text{border-color:#fff;color:#333}.white #introduction h2{border-color:#999;color:#333}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#eee;border-color:#eee;box-shadow:none;padding-left:0;text-shadow:none}.white fieldset{background:#ddd;border-color:#999}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white .box{background:#666;border-color:#999;box-shadow:0 .4em .8em rgba(64,64,64,0.75)}.white .box button{box-shadow:0 .1em .2em rgba(0,0,0,0.75);text-shadow:.1em .1em .1em rgba(0,0,0,.5)}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:.2em .2em .4em #666}.white .box h3.heading:hover{background:#333;color:#eee}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 .4em rgba(64,64,64,0.75)}.white .options{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5);text-shadow:.05em .05em .1em #ccc}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white #option_comment{background:#ddd;border-color:#999}.white #top em{color:#00f}.white #update{background:#eee;border-color:#999;box-shadow:0 .1em .2em rgba(64,64,64,0.5)}.white .wide,.white .tall,.white #diffBase,.white #diffNew{background:#eee;border-color:#999;box-shadow:0 .2em .4em rgba(64,64,64,0.5)}.white .file input,.white .labeltext input{border-color:#fff}#webtool.white input.unchecked{background:#ccc;color:#666}.white .options input[type=text],.white .options select{border-color:#999}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white #doc .analysis thead th,.white #doc .analysis th[colspan]{background:#eef}.white div input{border-color:#999}.white textarea{border-color:#999}.white textarea:hover{background:#eef8ff}.white .diff,.white .beautify,.white .diff ol,.white .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{background:#eed;border-color:#bbc;color:#886}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .data .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}.white .diff .data .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .equal,.white .beautify .data li{background-color:#fff;border-color:#eee}.white .beautify .data em.s1{color:#f66}.white .beautify .data em.s2{color:#12f}.white .beautify .data em.s3{color:#090}.white .beautify .data em.s4{color:#d6d}.white .beautify .data em.s5{color:#7cc}.white .beautify .data em.s6{color:#c85}.white .beautify .data em.s7{color:#737}.white .beautify .data em.s8{color:#6d0}.white .beautify .data em.s9{color:#dd0s}.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13{color:#cc3}.white .beautify .data em.s14{color:#333}.white .beautify .data em.s15{color:#9d9}.white .beautify .data em.s16{color:#880}.white .beautify .data .l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify .data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .beautify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.white .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{background:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l11{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautify .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white .beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea}.white .beautify .data .c0{background:#ddd}.white .beautify .data li{color:#777}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff .insert{background-color:#bfb;border-color:#aea}.white .diff .data .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white #doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc strong,.white .box .body strong{color:#c00}.white .box .body em,.white .box .body #doc em{color:#090}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #thirdparties img{box-shadow:.2em .2em .4em #999}.white #diffoutput #thirdparties{background:#eee}.white #doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc ol,#doc.white ol{background:#eee;border-color:#999}.white #doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc table,#doc.white table{background:#fff;border-color:#999}.white #doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,#doc.white tr:hover{background:#ddd}#doc.white em{color:#060}.white #doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}";
                            builder.cssExtra      = "body{background:#eee}#doc p em{color:#090}";
                            builder.body          = "</style></head><body id='webtool' class='";
                            builder.bodyColor     = "white";
                            builder.title         = "'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div class='doc'>";
                            builder.accessibility = "</div><p>Accessibility note. &lt;em&gt; tags in the output represent character differences per lines compared.</p>";
                            builder.scriptOpen    = "<script type='application/javascript'><![CDATA[var pd={},d=document.getElementsByTagName('ol');";
                            builder.scriptBody    = "(function(){var cells=d[0].getElemensByTagName('li'),len=cells.length,a=0;for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')==='fold'){cells[a].onmousedown=pd.difffold;}}if(d.length>3){d[2].onmousedown=pd.colSliderGrab;d[2].ontouchstart=pd.colSliderGrab;}}());pd.difffold=function dom__difffold(){var self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b=0,inner=self.innerHTML,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('class'==='diff'))?parent.getElementsByTagName('ol'):parent.parentNode.getElementsByTagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a].getElementsByTagName('li'));}if(lists.length>3){for(a=0;a<min;a+=1){if(lists[0][a].getAttribute('class')==='empty'){min+=1;max+=1}}}max=(max>=lists[0].length)?lists[0].length:max;if(inner.charAt(0)===' - '){self.innerHTML='+'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='none';}}}else{self.innerHTML=' - '+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='block';}}}};pd.colSliderProperties=[d[0].clientWidth,d[1].clientWidth,d[2].parentNode.clientWidth,d[2].parentNode.parentNode.clientWidth,d[2].parentNode.offsetLeft-d[2].parentNode.parentNode.offsetLeft,];pd.colSliderGrab=function(){'use strict';var x=this,a=x.parentNode,b=a.parentNode,c=0,counter=pd.colSliderProperties[0],data=pd.colSliderProperties[1],width=pd.colSliderProperties[2],total=pd.colSliderProperties[3],offset=(pd.colSliderProperties[4]),min=0,max=data-1,status='ew',g=min+15,h=max-15,k=false,z=a.previousSibling,drop=function(g){x.style.cursor=status+'-resize';g=null;document.onmousemove=null;document.onmouseup=null;},boxmove=function(f){f=f||window.event;c=offset-f.clientX;if(c>g&&c<h){k=true;}if(k===true&&c>h){a.style.width=((total-counter-2)/10)+'em';status='e';}else if(k===true&&c<g){a.style.width=(width/10)+'em';status='w';}else if(c<max&&c>min){a.style.width=((width+c)/10)+'em';status='ew';}document.onmouseup=drop;};if(typeof pd.o==='object'&&typeof pd.o.re==='object'){offset+=pd.o.re.offsetLeft;offset-=pd.o.rf.scrollLeft;}else{c=(document.body.parentNode.scrollLeft>document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLeft;offset-=c;}offset+=x.clientWidth;x.style.cursor='ew-resize';b.style.width=(total/10)+'em';b.style.display='inline-block';if(z.nodeType!==1){do{z=z.previousSibling;}while(z.nodeType!==1);}z.style.display='block';a.style.width=(a.clientWidth/10)+'em';a.style.position='absolute';document.onmousemove=boxmove;document.onmousedown=null;};";
                            builder.scriptEnd     = "]]></script>";
                            return [
                                [
                                    builder.head, builder.cssCore, builder.cssColor, builder.cssExtra, builder.body, builder.bodyColor, builder.title, auto, proctime(), a[0], builder.accessibility, a[1][0], builder.scriptOpen, builder.scriptBody, builder.scriptEnd, "</body></html>"
                                ].join(""), ""
                            ];
                        }
                        return [
                            a[1][0], autostring + proctime() + a[0] + " <p>Accessibility note. &lt;em&gt; tags in the output represent presentation for variable coloring and scope.</p>"
                        ];
                    }());
                }
            };

        //Library to provide a character entity representation for
        //UTF8/16.  Requires a browser to access the actual characters.
        //This library is ignored in other environments.  Only used in
        //csvmin and csvbeauty libraries.
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
            if ((pd === undefined || pd.o.report.beau === null || pd.o.report.beau === undefined || typeof pd.o.report.beau.innerHTML !== "string") || (input.search(unit) === -1 && input.search(uni) === -1 && input.search(htmlt) === -1 && input.search(htmln) === -1)) {
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
                pd.o.report.beau.innerHTML = "&#" + parseInt(entity[b], 10) + ";";
                entity[b]                  = pd.o.report.beau.innerHTML;
                output.push(entity[b]);
            }
            return output.join("");
        };

        //Library to parse/beautify/minify CSS (and similar languages).
        csspretty     = function csspretty(args) {
            var scssinsertlines = (args.cssinsertlines === true || args.cssinsertlines === "true") ? true : false,
                sdiffcomm       = (args.diffcomm === true || args.diffcomm === "true") ? true : false,
                sinsize         = (isNaN(args.insize) === true) ? 4 : Number(args.insize),
                sinchar         = (typeof args.inchar !== "string" || args.inchar === "") ? " " : args.inchar,
                smode           = (args.mode === "minify" || args.mode === "parse" || args.mode === "diff") ? args.mode : "beautify",
                sobjsort        = (args.objsort === true || args.objsort === "true") ? true : false,
                spres           = (args.preserve === false || args.preserve === "false") ? false : true,
                ssource         = (typeof args.source !== "string" || args.source === "" || (/^(\s+)$/).test(args.source) === true) ? "Error: no source supplied to csspretty." : args.source,
                stopcoms        = (args.topcoms === true || args.topcoms === "true") ? true : false,
                svertical       = (args.vertical === true || args.vertical === "true") ? true : false,
                token           = [],
                types           = [],
                lines           = [],
                uri             = [],
                output          = "",
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
            (function csspretty__tokenize() {
                var a          = 0,
                    b          = ssource.split(""),
                    len        = ssource.length,
                    ltype      = "",
                    itemsize   = 0,
                    space      = "",
                    spacer     = function csspretty__tokenize_space() {
                        var slen = space.split("\n").length;
                        if (types[types.length - 1] !== "comment" && types[types.length - 1] !== "comment-inline" && (slen > 2 || (slen > 1 && b[a] + b[a + 1] === "//"))) {
                            lines[lines.length - 1] = 1;
                        }
                        space = "";
                    },
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
                            sort = function jspretty__tokenize_objSort_sort(x, y) {
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
                                if (token[xx].toLowerCase() < token[yy].toLowerCase()) {
                                    return -1;
                                }
                                return 1;
                            },
                            semiTest = true,
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
                                if (token[cc] === ";" || token[cc] === "}") {
                                    semiTest = true;
                                    start     = cc + 1;
                                    if (types[start] === "comment-inline") {
                                        start += 1;
                                    }
                                }
                                if (semiTest === true && (token[cc] === ";" || token[cc] === "}") && start < end && (keys.length === 0 || start !== keys[keys.length - 1][0])) {
                                    if (lines[start - 1] > 0 && (types[start] === "comment" || types[start] === "selector")) {
                                        lines[start - 1] = 0;
                                        lines[start] = 1;
                                    }
                                    if (types[end + 1] === "comment-inline") {
                                        end += 1;
                                    }
                                    keys.push([
                                        start, end + 1, false
                                    ]);
                                    end = start - 1;
                                }
                            }

                            if (dd < 0 && cc < startlen) {
                                if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                                    keys.push([
                                        cc + 1, keys[keys.length - 1][0] - 1, keys[keys.length - 1][2]
                                    ]);
                                }
                                if (keys.length > 1 && (types[cc - 1] === "selector" || token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "[" || token[cc - 1] === "{" || token[cc - 1] === "," || cc === 0)) {
                                    keys.sort(sort);
                                    keylen    = keys.length;
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
                        if (ltype === "comment" || ltype === "comment-inline") {
                            do {
                                aa    -= 1;
                                ltype = types[aa];
                                coms.push(token[aa]);
                            } while (aa > 0 && (ltype === "comment" || ltype === "comment-inline"));
                        } else {
                            aa -= 1;
                        }
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
                                            cc -= 1;
                                        } while (cc > 0 && types[cc] !== "comment" && types[cc] !== "comment-inline" && types[cc] !== "end" && types[cc] !== "start" && types[cc] !== "semi" && types[cc] !== undefined);
                                        parts.reverse();
                                        cc += 1;
                                        dd = aa - cc;
                                        token.splice(cc, dd);
                                        types.splice(cc, dd);
                                        lines.splice(cc, dd);
                                        aa        -= dd;
                                        token[aa] = parts.join("").replace(/\s*\,(\s*)/g, ",");
                                    }());
                                } else {
                                    token[aa] = token[aa].replace(/\s*\,(\s*)/g, ",");
                                }
                                types[aa] = "selector";
                            } else if (type === "end") {
                                types[aa] = "value";
                                if (smode !== "diff") {
                                    token[aa] = value(token[aa]);
                                }
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
                        var aa        = 0,
                            out       = [b[a]],
                            type      = "",
                            spareType = [],
                            spareToke = [],
                            spareLine = [];
                        spacer();
                        type = (inline === true && lines[lines.length - 1] === 0 && token[token.length - 1] !== "comment" && token[token.length - 1] !== "comment-inline") ? "comment-inline" : "comment";
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
                    buildtoken = function csspretty__tokenize_build() {
                        var aa    = 0,
                            bb    = 0,
                            out   = [],
                            block = "",
                            comma = (token.length > 0 && token[token.length - 1].charAt(token[token.length - 1].length - 1) === ",") ? true : false;
                        spacer();
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
                            token[token.length - 1] = token[token.length - 1] + out.join("").replace(/\s+/g, " ").replace(/^\s/, "").replace(/\s$/, "");
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
                                        if (token[set[xx][2]] !== undefined && token[set[xx][0]].indexOf(name) === 0) {
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
                                        if (token[set[xx][0]].indexOf(name) !== 0 || xx === leng - 1) {
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
                                            break;
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
                        token.splice(next + 1, token.length - next - 1);
                        types.splice(next + 1, types.length - next - 1);
                        lines.splice(next + 1, lines.length - next - 1);
                        token = token.concat(stoke);
                        types = types.concat(stype);
                        lines = lines.concat(sline);
                    };
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
                    } else if (b[a] === "}") {
                        if (types[types.length - 1] === "item" && token[token.length - 2] === "{" && token[token.length - 3] !== undefined && token[token.length - 3].charAt(token[token.length - 3].length - 1) === "@") {
                            //less variable selector
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
                    } else {
                        buildtoken();
                    }
                }
                spacer();
            }());
            if (smode === "parse") {
                return {
                    token: token,
                    types: types
                };
            }
            if (smode !== "minify") {
                output = (function csspretty__beautify() {
                    var a        = 0,
                        len      = token.length,
                        build    = [],
                        indent   = 0,
                        mixin    = false,
                        tab      = (function csspretty__beautify_tab() {
                            var aa = 0,
                                bb = [];
                            for (aa = 0; aa < sinsize; aa += 1) {
                                bb.push(sinchar);
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
                            if (leng === 0) {
                                items.push(item);
                            }
                            build.push(items[0].replace(/\,(\s*)/g, ", ").replace(/(\, )$/, ","));
                            for (aa = 1; aa < leng; aa += 1) {
                                nl(indent);
                                build.push(items[aa].replace(/\,(\s*)/g, ", ").replace(/(\, )$/, ","));
                            }
                            build.push(" ");
                        };
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
                                nl(indent);
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
                                if (types[a + 1] !== "end" && types[a + 1] !== "semi") {
                                    nl(indent);
                                }
                            }
                            if (scssinsertlines === true) {
                                build.push("\n");
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
                            if (spres === true && lines[a - 1] > 0) {
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
                    if (spres === true && lines[lines.length - 1] > 0) {
                        return build.join("").replace(/(\s+)$/, "\n");
                    }
                    return build.join("").replace(/(\s+)$/, "");
                }());
            } else {
                output = token.join("").replace(/;\}/g, "}");
            }
            if (smode === "beautify") {
                summary = (function csspretty__summary() {
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
                        summ.push((((out - inl) / out) * 100).toFixed(2));
                    } else {
                        summ.push("Decrease</th><td>");
                        summ.push(inl - out);
                        summ.push("</td></tr><tr><th>Percent Change</th><td>");
                        summ.push((((inl - out) / inl) * 100).toFixed(2));
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
                    return summ.join("");
                }());
            }
            return output;
        };

        //Library to change CSV (and similar formats) to something
        //human readable.
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
        };

        //Library to regress changes made by csvbeauty back to
        //the standard format.
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
        };

        //Library to compare text input
        diffview      = function diffview(args) {
            var errorout      = 0,
                diffline      = 0,
                baseTextLines = (typeof args.baseTextLines === "string") ? args.baseTextLines.replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "") : "",
                newTextLines  = (typeof args.newTextLines === "string") ? args.newTextLines.replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "") : "",
                baseTextName  = (typeof args.baseTextName === "string") ? args.baseTextName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Base Source",
                newTextName   = (typeof args.newTextName === "string") ? args.newTextName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "New Source",
                diffcli       = (args.diffcli === true || args.diffcli === "true") ? true : false,
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
                    lines = (diffcli === true) ? str : str.replace(/\&/g, "&amp;").replace(/\&#lt;/g, "$#l" + "t;").replace(/\&#gt;/g, "$#g" + "t;").replace(/</g, "$#l" + "t;").replace(/>/g, "$#g" + "t;");
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
                    data           = (diffcli === true) ? [
                        [], [], [], [], [], []
                    ] : [
                        [], [], [], []
                    ],
                    baseStart      = 0,
                    baseEnd        = 0,
                    newStart       = 0,
                    newEnd         = 0,
                    rowcnt         = 0,
                    foldcount      = 0,
                    foldback       = 0,
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
                            dataA         = [],
                            dataB         = [],
                            cleanedA      = (diffcli === true) ? lineA : lineA.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">").replace(/&amp;/g, "&"),
                            cleanedB      = (diffcli === true) ? lineB : lineB.replace(/\&#160;/g, " ").replace(/\&nbsp;/g, " ").replace(/&lt\;/g, "<").replace(/&gt\;/g, ">").replace(/\$#lt\;/g, "<").replace(/\$#gt\;/g, ">").replace(/&amp;/g, "&"),
                            dataMinLength = 0,
                            currentdiff   = [],
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
                            }()),
                            compare       = function diffview__report_charcomp_compare(start) {
                                var x     = 0,
                                    y     = 0,
                                    max   = Math.max(dataA.length, dataB.length),
                                    store = [],
                                    sorta = function diffview__report_charcomp_compare_sorta(a, b) {
                                        if (a[1] - a[0] < b[1] - b[0]) {
                                            return 1;
                                        }
                                        return -1;
                                    },
                                    sortb = function diffview__report_charcomp_compare_sortb(a, b) {
                                        if (a[0] + a[1] > b[0] + b[1]) {
                                            return 1;
                                        }
                                        return -1;
                                    };
                                for (x = start; x < dataMinLength; x += 1) {
                                    for (y = start; y < max; y += 1) {
                                        if (dataA[x] === dataB[y] || dataB[x] === dataA[y]) {
                                            store.push([
                                                x, y
                                            ]);
                                            break;
                                        }
                                    }
                                }
                                if (store.length === 0) {
                                    return [
                                        dataMinLength, max, 0
                                    ];
                                }
                                store.sort(sorta);
                                if (dataMinLength - start < 5000) {
                                    store.sort(sortb);
                                }
                                if (store[0][0] < store[0][1]) {
                                    x = store[0][0];
                                    y = store[0][1];
                                } else {
                                    y = store[0][0];
                                    x = store[0][1];
                                }
                                if (dataA[y] === dataB[x]) {
                                    if (dataA[y - 1] === dataB[x - 1] && x !== start) {
                                        x -= 1;
                                        y -= 1;
                                    }
                                    return [
                                        x, y, 0
                                    ];
                                }
                                if (dataA[x] === dataB[y]) {
                                    if (dataA[x - 1] === dataB[y - 1] && x !== start) {
                                        x -= 1;
                                        y -= 1;
                                    }
                                    return [
                                        x, y, 1
                                    ];
                                }
                            };
                        if (cleanedA === cleanedB) {
                            return [
                                lineA, lineB
                            ];
                        }
                        errorout -= 1;
                        if (tabFix !== "" && cleanedA.length !== cleanedB.length && cleanedA.replace(tabFix, "") === cleanedB.replace(tabFix, "")) {
                            errorout += 1;
                            if (diffcli === true) {
                                return [
                                    (tabdiff[0] + tabdiff[2]).replace(regStart, "<pd>").replace(regEnd, "</pd>"), (tabdiff[1] + tabdiff[3]).replace(regStart, "<pd>").replace(regEnd, "</pd>")
                                ];
                            }
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
                                errorout    += 1;
                                currentdiff = compare(b);
                                if (b > 0) {
                                    dataA[b - 1] = dataA[b - 1] + strStart;
                                    dataB[b - 1] = dataB[b - 1] + strStart;
                                } else {
                                    dataA[b] = strStart + dataA[b];
                                    dataB[b] = strStart + dataB[b];
                                }

                                if (currentdiff[2] === 1) {
                                    if (currentdiff[0] === 0) {
                                        dataA[0] = dataA[0].replace(regStart, strStart + strEnd);
                                    } else if (currentdiff[0] === dataMinLength) {
                                        if (dataB.length === dataMinLength) {
                                            dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                                        } else {
                                            dataA[currentdiff[0] - 1] = dataA[currentdiff[0] - 1] + strEnd;
                                        }
                                    } else {
                                        if (dataA[currentdiff[0]].indexOf(strStart) > -1) {
                                            dataA[currentdiff[0]] = dataA[currentdiff[0]] + strEnd;
                                        } else {
                                            dataA[currentdiff[0]] = strEnd + dataA[currentdiff[0]];
                                        }
                                    }
                                    if (currentdiff[1] > dataB.length - 1 || currentdiff[0] === dataMinLength) {
                                        dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                                    } else {
                                        dataB[currentdiff[1]] = strEnd + dataB[currentdiff[1]];
                                    }
                                } else {
                                    if (currentdiff[0] === 0) {
                                        dataB[0] = dataB[0].replace(regStart, strStart + strEnd);
                                    } else if (currentdiff[0] === dataMinLength) {
                                        if (dataA.length === dataMinLength) {
                                            dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                                        } else {
                                            dataB[currentdiff[0] - 1] = dataB[currentdiff[0] - 1] + strEnd;
                                        }
                                    } else {
                                        if (dataB[currentdiff[0]].indexOf(strStart) > -1) {
                                            dataB[currentdiff[0]] = dataB[currentdiff[0]] + strEnd;
                                        } else {
                                            dataB[currentdiff[0]] = strEnd + dataB[currentdiff[0]];
                                        }
                                    }
                                    if (currentdiff[1] > dataA.length - 1 || currentdiff[0] === dataMinLength) {
                                        dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                                    } else {
                                        dataA[currentdiff[1]] = strEnd + dataA[currentdiff[1]];
                                    }
                                }
                                if (currentdiff[1] > currentdiff[0] && currentdiff[1] - currentdiff[0] < 1000) {
                                    if (currentdiff[2] === 1) {
                                        do {
                                            dataA.unshift("");
                                            currentdiff[0] += 1;
                                        } while (currentdiff[1] > currentdiff[0]);
                                    } else {
                                        do {
                                            dataB.unshift("");
                                            currentdiff[0] += 1;
                                        } while (currentdiff[1] > currentdiff[0]);
                                    }
                                }
                                dataMinLength = Math.min(dataA.length, dataB.length);
                                b             = currentdiff[1];
                            }
                        }
                        if (dataA.length > dataB.length && dataB[dataB.length - 1] !== undefined && dataB[dataB.length - 1].indexOf(strEnd) < 0) {
                            dataB.push(strStart + strEnd);
                            dataA[dataB.length - 1] = strStart + dataA[dataB.length - 1];
                            dataA[dataA.length - 1] = dataA[dataA.length - 1] + strEnd;
                            errorout                += 1;
                        }
                        if (dataB.length > dataA.length && dataA[dataA.length - 1] !== undefined && dataA[dataA.length - 1].indexOf(strEnd) < 0) {
                            dataA.push(strStart + strEnd);
                            dataB[dataA.length - 1] = strStart + dataB[dataA.length - 1];
                            dataB[dataB.length - 1] = dataB[dataB.length - 1] + strEnd;
                            errorout                += 1;
                        }
                        if (diffcli === true) {
                            return [
                                dataA.join("").replace(regStart, "<pd>").replace(regEnd, "</pd>"), dataB.join("").replace(regStart, "<pd>").replace(regEnd, "</pd>")
                            ];
                        }
                        return [
                            dataA.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>"), dataB.join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(regStart, "<em>").replace(regEnd, "</em>")
                        ];
                    };
                if (diffcli === false) {
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
                                baseStart += jump;
                                newStart  += jump;
                                i         += jump - 1;
                                if (diffcli === true) {
                                    data[5].push([
                                        baseStart, newStart
                                    ]);
                                } else {
                                    data[0].push("<li>...</li>");
                                    if (inline === false) {
                                        data[1].push("<li class='skip'>&#10;</li>");
                                    }
                                    data[2].push("<li>...</li>");
                                    data[3].push("<li class='skip'>&#10;</li>");
                                }
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
                        if (diffcli === true) {
                            //data array schema:
                            //0 - base line number
                            //1 - base code line
                            //2 - new line number
                            //3 - new code line
                            //4 - change
                            //5 - index of context (not parallel)
                            if (ntest === true || change === "insert") {
                                data[0].push(0);
                                data[1].push("");
                                data[2].push(newStart + 1);
                                data[3].push(newTextArray[newStart]);
                                data[4].push("insert");
                                errorout += 1;
                            } else if (btest === true || change === "delete") {
                                data[0].push(baseStart + 1);
                                data[1].push(baseTextArray[baseStart]);
                                data[2].push(0);
                                data[3].push("");
                                data[4].push("delete");
                                errorout += 1;
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
                                    data[0].push(baseStart + 1);
                                    if (newStart < newEnd) {
                                        data[1].push(charcompOutput[0]);
                                    } else {
                                        data[1].push(baseTextArray[baseStart]);
                                    }
                                    data[2].push(0);
                                    data[3].push("");
                                    data[4].push("delete");
                                }
                                if (newStart < newEnd) {
                                    data[0].push(0);
                                    data[1].push("");
                                    data[2].push(newStart + 1);
                                    if (baseStart < baseEnd) {
                                        data[3].push(charcompOutput[1]);
                                    } else {
                                        data[3].push(newTextArray[newStart]);
                                    }
                                    data[4].push("insert");
                                }
                                errorout += 1;
                            } else if (baseStart < baseEnd || newStart < newEnd) {
                                data[0].push(baseStart + 1);
                                data[1].push(baseTextArray[baseStart]);
                                data[2].push(newStart + 1);
                                data[3].push(newTextArray[newStart]);
                                data[4].push(change);
                                if (change !== "equal") {
                                    errorout += 1;
                                }
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
                        } else if (inline === true) {
                            if (context < 0 && baseTextArray[baseStart - 1] === newTextArray[newStart - 1] && baseTextArray[baseStart] !== newTextArray[newStart] && foldstart > 0) {
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
                                errorout  += 1;
                            } else if (btest === true || change === "delete") {
                                data[0].push("<li>");
                                data[0].push(baseStart + 1);
                                data[0].push("</li>");
                                data[2].push("<li class='empty'>&#8203;&#10;</li>");
                                data[3].push("<li class='delete'>");
                                data[3].push(baseTextArray[baseStart]);
                                data[3].push("&#10;</li>");
                                foldcount += 1;
                                errorout  += 1;
                            } else if (change === "replace") {
                                if (baseTextArray[baseStart] !== newTextArray[newStart]) {
                                    if (baseTextArray[baseStart] === "") {
                                        charcompOutput = [
                                            "", newTextArray[newStart]
                                        ];
                                        errorout       += 1;
                                    } else if (newTextArray[newStart] === "") {
                                        charcompOutput = [
                                            baseTextArray[baseStart], ""
                                        ];
                                        errorout       += 1;
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
                                            data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (baseEnd + 3) + "'>");
                                        } else {
                                            data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (newEnd + 3) + "'>");
                                        }
                                    } else {
                                        data[0].push("<li class='fold' title='folds from line " + foldcount + " to line xxx'>");
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
                                if (change !== "equal") {
                                    errorout += 1;
                                }
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
                            if (context < 0 && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                            }
                            if (btest === false && ntest === false && typeof baseTextArray[baseStart] === "string" && typeof newTextArray[newStart] === "string") {
                                if (baseTextArray[baseStart] === "" && newTextArray[newStart] !== "") {
                                    change = "insert";
                                }
                                if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                    change = "delete";
                                }
                                if (change === "replace" && baseStart < baseEnd && newStart < newEnd && baseTextArray[baseStart] !== newTextArray[newStart]) {
                                    charcompOutput = charcomp(baseTextArray[baseStart], newTextArray[newStart]);
                                } else {
                                    charcompOutput = [
                                        baseTextArray[baseStart], newTextArray[newStart]
                                    ];
                                }
                                if (baseStart === Number(data[0][data[0].length - 1].substring(data[0][data[0].length - 1].indexOf(">") + 1, data[0][data[0].length - 1].lastIndexOf("<"))) - 1 || newStart === Number(data[2][data[2].length - 1].substring(data[2][data[2].length - 1].indexOf(">") + 1, data[2][data[2].length - 1].lastIndexOf("<"))) - 1) {
                                    repeat = true;
                                }
                                if (repeat === false) {
                                    foldcount += 1;
                                    if (baseStart < baseEnd) {
                                        if (context < 0 && baseTextArray[baseStart] === newTextArray[newStart] && ((baseTextArray[baseStart - 1] !== newTextArray[newStart - 1]) || (a > 1 && opcodes[a - 1][0] !== "equal" && baseStart === opcodes[a - 1][2]) || (baseStart === 0 && newStart === 0)) && baseTextArray[baseStart + 1] === newTextArray[newStart + 1] && ((baseEnd - baseStart > 1) || (newEnd - newStart > 1))) {
                                            if (a === opcodesLength - 1) {
                                                if (baseEnd > newEnd) {
                                                    data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (baseEnd + 2) + "'>- " + (baseStart + 1) + "</li>");
                                                } else {
                                                    data[0].push("<li class='fold' title='folds from line " + foldcount + " to line " + (baseEnd + 1 + foldback) + "'>- " + (baseStart + 1) + "</li>");
                                                }
                                            } else {
                                                foldstart = data[0].length;
                                                data[0].push("<li class='fold' title='folds from line " + (baseStart + 1) + " to line xxx'>- " + (baseStart + 1) + "</li>");
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
                                        data[1].push(charcompOutput[0]);
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
                                            foldback  += 1;
                                            foldcount -= 1;
                                        } else if (newTextArray[newStart] === "" && baseTextArray[baseStart] !== "") {
                                            data[3].push("empty");
                                        } else {
                                            data[3].push(change);
                                        }
                                        data[3].push("'>");
                                        data[3].push(charcompOutput[1]);
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
                if (typeof data[0][foldstart] === "string") {
                    data[0][foldstart] = data[0][foldstart].replace("xxx", foldcount);
                }
                if (diffcli === true) {
                    data.push(errorout);
                    return data;
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
                node.push("<p class='author'>Diff view written by <a href='http://prettydiff.com/'>Pretty D" +
                    "iff</a>.</p></div>");
                return [
                    node.join("").replace(/li class='equal'><\/li/g, "li class='equal'>&#10;</li").replace(/\$#gt;/g, "&gt;").replace(/\$#lt;/g, "&lt;").replace(/\%#lt;/g, "$#lt;").replace(/\%#gt;/g, "$#gt;"), errorout, diffline
                ];
            }());
        };

        //Library to parse/beautify/minify JavaScript.
        jspretty      = function jspretty(args) {
            var jbraceline    = (args.braceline === true || args.braceline === "true") ? true : false,
                jbracepadding = (args.bracepadding === true || args.bracepadding === "true") ? true : false,
                jbraces       = (args.braces === "allman") ? true : false,
                jchar         = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                jcomment      = (args.comments === "noindent") ? "noindent" : (args.comments === "nocomment") ? "nocomment" : "indent",
                jelseline     = (args.elseline === true || args.elseline === "true") ? true : false,
                jlevel        = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
                jmode         = (args.mode === "minify" || args.mode === "parse" || args.mode === "diff") ? args.mode : "beautify",
                jobfuscate    = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
                jobjsort      = (args.objsort === true || args.objsort === "true") ? true : false,
                jpres         = (args.preserve === false || args.preserve === "false") ? false : true,
                jquoteConvert = (args.quoteConvert === "double" || args.quoteConvert === "single") ? args.quoteConvert : "none",
                jscorrect     = (args.correct === true || args.correct === "true") ? true : false,
                jsize         = (isNaN(args.insize) === false && Number(args.insize) >= 0) ? Number(args.insize) : 4,
                jsource       = (typeof args.source === "string" && args.source.length > 0) ? args.source + " " : "Error: no source code supplied to jspretty!",
                jspace        = (args.space === false || args.space === "false") ? false : true,
                jsscope       = (args.jsscope === true || args.jsscope === "true") ? "report" : (args.jsscope !== "html" && args.jsscope !== "report") ? "none" : args.jsscope,
                jstyleguide   = (typeof args.styleguide === "string") ? args.styleguide.toLowerCase().replace(/\s/g, "") : "",
                jtitanium     = (args.titanium === true || args.titanium === "true") ? true : false,
                jtopcoms      = (args.topcoms === true || args.topcoms === "true") ? true : false,
                jvarword      = (args.varword === "each" || args.varword === "list") ? args.varword : "none",
                jvertical     = (args.vertical === false || args.vertical === "false") ? false : true,
                jwrap         = (isNaN(Number(args.wrap)) === true) ? 0 : Number(args.wrap),
                sourcemap     = [
                    0, ""
                ],
                token         = [],
                types         = [],
                level         = [],
                lines         = [],
                globals       = [],
                meta          = [],
                varlist       = [],
                markupvar     = [],
                error         = [],
                news          = 0,
                scolon        = 0,
                stats         = {
                    comma       : 0,
                    commentBlock: {
                        chars: 0,
                        token: 0
                    },
                    commentLine : {
                        chars: 0,
                        token: 0
                    },
                    container   : 0,
                    number      : {
                        chars: 0,
                        token: 0
                    },
                    operator    : {
                        chars: 0,
                        token: 0
                    },
                    regex       : {
                        chars: 0,
                        token: 0
                    },
                    semicolon   : 0,
                    server      : {
                        chars: 0,
                        token: 0
                    },
                    space       : {
                        newline: 0,
                        other  : 0,
                        space  : 0,
                        tab    : 0
                    },
                    string      : {
                        chars: 0,
                        quote: 0,
                        token: 0
                    },
                    word        : {
                        chars: 0,
                        token: 0
                    }
                },
                result        = "";
            if (jsource === "Error: no source code supplied to jspretty!") {
                return jsource;
            }
            if (jsscope !== "none") {
                jwrap = 0;
            }
            if (jstyleguide === "airbnb") {
                jchar         = " ";
                jpres         = true;
                jquoteConvert = "single";
                jscorrect     = true;
                jsize         = 2;
                jvarword      = "each";
                jwrap         = 80;
            } else if (jstyleguide === "crockford") {
                jbracepadding = false;
                jelseline     = false;
                jchar         = " ";
                jscorrect     = true;
                jsize         = 4;
                jspace        = true;
                jvarword      = "list";
            } else if (jstyleguide === "google") {
                jchar         = " ";
                jpres         = true;
                jquoteConvert = "single";
                jscorrect     = true;
                jsize         = 4;
                jvertical     = false;
                jwrap         = -1;
            } else if (jstyleguide === "grunt") {
                jchar         = " ";
                jsize         = 2;
                jquoteConvert = "single";
                jvarword      = "each";
            } else if (jstyleguide === "jquery") {
                jbracepadding = true;
                jchar         = "\u0009";
                jquoteConvert = "double";
                jscorrect     = true;
                jsize         = 1;
                jvarword      = "each";
                jwrap         = 80;
            } else if (jstyleguide === "mrdoobs") {
                jbraceline    = true;
                jbracepadding = true;
                jchar         = "\u0009";
                jscorrect     = true;
                jsize         = 1;
                jvertical     = false;
            } else if (jstyleguide === "mediawiki") {
                jbracepadding = true;
                jchar         = "\u0009";
                jpres         = true;
                jquoteConvert = "single";
                jscorrect     = true;
                jsize         = 1;
                jspace        = false;
                jwrap         = 80;
            } else if (jstyleguide === "meteor") {
                jchar     = " ";
                jscorrect = true;
                jsize     = 2;
                jwrap     = 80;
            } else if (jstyleguide === "yandex") {
                jbracepadding = false;
                jquoteConvert = "single";
                jscorrect     = true;
                jvarword      = "each";
                jvertical     = false;
            }
            if (jtitanium === true) {
                jscorrect = false;
                token.push("x{");
                types.push("start");
                lines.push(0);
            }

            //this function tokenizes the source code into an array
            //of literals and syntax tokens
            (function jspretty__tokenize() {
                var a              = 0,
                    b              = jsource.length,
                    c              = jsource.split(""),
                    ltoke          = "",
                    ltype          = "",
                    lengtha        = 0,
                    lengthb        = 0,
                    wordTest       = -1,
                    templateString = [],
                    dostate        = {
                        count: [],
                        index: 0,
                        len  : -1,
                        state: []
                    },
                    obj            = {
                        count : [],
                        len   : -1,
                        status: []
                    },
                    block          = {
                        consec     : [],
                        count      : [],
                        index      : [],
                        len        : -1,
                        priorreturn: [],
                        semi       : [],
                        word       : []
                    },
                    vart           = {
                        count: [],
                        index: [],
                        len  : -1
                    },
                    objSort        = function jspretty__tokenize_objSort() {
                        var cc        = 0,
                            dd        = 0,
                            ee        = 0,
                            startlen  = token.length - 1,
                            end       = startlen,
                            keys      = [],
                            keylen    = 0,
                            keyend    = 0,
                            start     = 0,
                            sort      = function jspretty__tokenize_objSort_sort(x, y) {
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
                                if (token[xx].toLowerCase() > token[yy].toLowerCase()) {
                                    return 1;
                                }
                                return -1;
                            },
                            commaTest = true,
                            pairToken = [],
                            pairTypes = [],
                            pairLines = [];
                        if (token[end] === "," || types[end] === "comment" || types[end] === "comment-inline") {
                            do {
                                end -= 1;
                            } while (end > 0 && (token[end] === "," || types[end] === "comment" || types[end] === "comment-inline"));
                        }
                        for (cc = end; cc > -1; cc -= 1) {
                            if (types[cc] === "end") {
                                dd += 1;
                            }
                            if (types[cc] === "start" || types[cc] === "method") {
                                dd -= 1;
                            }
                            if (dd === 0) {
                                if (token[cc] === ",") {
                                    commaTest = true;
                                    start     = cc + 1;
                                }
                                if (commaTest === true && token[cc] === "," && start < end) {
                                    keys.push([
                                        start, end + 1, false
                                    ]);
                                    end = start - 1;
                                }
                            }

                            if (dd < 0 && cc < startlen) {
                                if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                                    keys.push([
                                        cc + 1, keys[keys.length - 1][0] - 1, keys[keys.length - 1][2]
                                    ]);
                                }
                                if (keys.length > 1 && (token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "(" || token[cc - 1] === "[" || token[cc - 1] === "," || cc === 0)) {
                                    keys.sort(sort);
                                    keylen    = keys.length;
                                    commaTest = false;
                                    for (dd = 0; dd < keylen; dd += 1) {
                                        keyend = keys[dd][1];
                                        for (ee = keys[dd][0]; ee < keyend; ee += 1) {
                                            pairToken.push(token[ee]);
                                            pairTypes.push(types[ee]);
                                            pairLines.push(lines[ee]);
                                            if (token[ee] === ",") {
                                                commaTest = true;
                                            } else if (token[ee] !== "," && types[ee] !== "comment" && types[ee] !== "comment-inline") {
                                                commaTest = false;
                                            }
                                        }
                                        if (dd < keylen - 1 && keys[dd + 1][2] === true) {
                                            pairLines[pairLines.length - 1] = 2;
                                        } else {
                                            pairLines[pairLines.length - 1] = 0;
                                        }
                                        if (commaTest === false) {
                                            ee = pairTypes.length - 1;
                                            if (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline") {
                                                do {
                                                    ee -= 1;
                                                } while (ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline"));
                                            }
                                            ee += 1;
                                            pairToken.splice(ee, 0, ",");
                                            pairTypes.splice(ee, 0, "separator");
                                            if (pairLines[ee - 1] === 2) {
                                                pairLines[ee - 1] = 0;
                                                pairLines.splice(ee, 0, 2);
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
                                    pairToken.splice(ee, 1);
                                    pairTypes.splice(ee, 1);
                                    pairLines.splice(ee, 1);
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
                    objpop         = function jspretty__tokenize_objpop() {
                        obj.count.pop();
                        obj.len -= 1;
                        obj.status.pop();
                        if (jobjsort === true) {
                            objSort();
                        }
                    },
                    blockpop       = function jspretty__tokenize_blockpop() {
                        block.consec.pop();
                        block.count.pop();
                        block.index.pop();
                        block.len -= 1;
                        block.priorreturn.pop();
                        block.semi.pop();
                        block.word.pop();
                    },
                    vartpop        = function jspretty__tokenize_vartpop() {
                        vart.count.pop();
                        vart.index.pop();
                        vart.len -= 1;
                    },
                    blockinsert    = function jspretty__tokenize_blockinsert() {
                        var index  = 0,
                            consec = false,
                            last   = lines.length - 1,
                            linel  = lines[last];
                        if (block.len < 0) {
                            return;
                        }
                        index  = block.index[block.len];
                        consec = block.consec[block.len];
                        if (types[index] === "comment" || types[index] === "comment-inline") {
                            do {
                                index -= 1;
                            } while (index > 0 && (types[index] === "comment" || types[index] === "comment-inline"));
                            index += 1;
                        }
                        if (block.word[block.len] === "else" && token[index] === block.word[block.len]) {
                            index += 1;
                        }
                        if (block.len > -1 && block.count[block.len] === 0) {
                            token.splice(index, 0, "x{");
                            types.splice(index, 0, "start");
                            if (jbraceline === true) {
                                lines.splice(index, 0, 2);
                                lines[last] = 2;
                                lines.push(0);
                            } else {
                                lines[last] = 0;
                                lines.splice(index, 0, 0);
                                lines.push(linel);
                            }
                            token.push("x}");
                            types.push("end");
                            if (block.priorreturn[block.len] === true) {
                                token.push("x;");
                                types.push("separator");
                                lines.push(0);
                            }
                            blockpop();
                            if (consec === true) {
                                blockinsert();
                            }
                        }
                    },
                    slashes        = function jspretty__tokenize_slashes(index) {
                        var slashy = index;
                        do {
                            slashy -= 1;
                        } while (c[slashy] === "\\" && slashy > 0);
                        if ((index - slashy) % 2 === 1) {
                            return true;
                        }
                        return false;
                    },
                    commaComment   = function jspretty__tokenize_commacomment() {
                        var x = types.length;
                        do {
                            x -= 1;
                        } while (x > 0 && (types[x - 1] === "comment" || types[x - 1] === "comment-inline"));
                        token.splice(x, 0, ",");
                        types.splice(x, 0, "separator");
                    },
                    plusplus       = function jspretty__tokenize_plusplus() {
                        var store = [],
                            pre   = true,
                            toke  = "+=",
                            tokea = "",
                            tokeb = "",
                            tokec = "";
                        lengtha = token.length;
                        tokea   = token[lengtha - 1];
                        tokeb   = token[lengtha - 2];
                        tokec   = token[lengtha - 3];
                        if (jscorrect !== true || (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--")) {
                            return;
                        }
                        if (tokec === "[" || tokec === ";" || tokec === "x;" || tokec === "}" || tokec === "{" || tokec === "(" || tokec === ")" || tokec === "," || tokec === "return") {
                            if (tokea === "++" || tokea === "--") {
                                if (tokec === "[" || tokec === "(" || tokec === "," || tokec === "return") {
                                    return;
                                }
                                if (tokeb === "--") {
                                    toke = "-=";
                                }
                                pre = false;
                            } else if (tokeb === "--") {
                                toke = "-=";
                            }
                        } else {
                            return;
                        }
                        if (pre === true) {
                            store.push(tokea);
                            store.push(types[lengtha - 1]);
                            store.push(lines[lengtha - 1]);
                            token.pop();
                            types.pop();
                            lines.pop();
                            token.pop();
                            types.pop();
                            lines.pop();
                            token.push(store[0]);
                            types.push(store[1]);
                            lines.push(store[2]);
                            token.push(toke);
                            types.push("operator");
                            token.push("1");
                            types.push("literal");
                        } else {
                            token.pop();
                            types.pop();
                            lines.pop();
                            token.push(toke);
                            types.push("operator");
                            lines.push(0);
                            token.push("1");
                            types.push("literal");
                            lines.push(0);
                        }
                    },
                    asi            = function jspretty__tokenize_asi() {
                        var len   = token.length - 1,
                            aa    = len,
                            bb    = 0,
                            tokel = token[len],
                            typel = types[len],
                            colon = false,
                            early = false,
                            paren = false,
                            opers = false;
                        if (typel === "comment" || typel === "comment-inline") {
                            do {
                                len -= 1;
                            } while (len > 0 && (types[len] === "comment" || types[len] === "comment-inline"));
                            if (len < 1) {
                                return;
                            }
                            tokel = token[len];
                            typel = types[len];
                        }
                        if (tokel === undefined || typel === "start" || typel === "separator" || typel === "operator" || tokel === "x}" || tokel === ";" || tokel === "x;" || tokel === "var" || tokel === "else" || tokel.indexOf("#!/") === 0) {
                            return;
                        }
                        if (obj.len > -1 && obj.status[obj.len] === true && obj.count[obj.len] === 0) {
                            return;
                        }
                        if ((typel === "literal" && types[len - 1] !== "start") || typel !== "literal") {
                            for (aa; aa > -1; aa -= 1) {
                                if (types[aa] === "end") {
                                    bb += 1;
                                } else if (types[aa] === "start" || types[aa] === "method") {
                                    bb -= 1;
                                }
                                if (bb < 0) {
                                    if (token[aa - 1] === "do" || typel === "word" || typel === "literal" || (opers === true && colon === false)) {
                                        break;
                                    }
                                    return;
                                }
                                if (bb === 0) {
                                    if (aa === 0 && ((token[0] === "{" && tokel === "}") || (token[0] === "[" && tokel === "]"))) {
                                        return;
                                    }
                                    if (token[aa] === "(" && (token[aa - 1] === "function" || token[aa - 2] === "function" || (tokel === ")" && token[aa - 1] === block.word[block.len]))) {
                                        return;
                                    }
                                    if (token[aa] === "do" || token[aa] === block.word[block.len]) {
                                        break;
                                    }
                                    if (c[a] === "}" && (types[aa] === "start" || types[aa] === "method")) {
                                        aa -= 1;
                                    }
                                    if ((token[aa - 1] === "else" && aa !== len) || token[aa] === "else" || token[aa] === "try" || token[aa] === "finally" || (colon === true && token[aa] === ",") || token[aa - 1] === "catch") {
                                        if (token[aa] === "return") {
                                            break;
                                        }
                                        return;
                                    }
                                    if (tokel === ")") {
                                        if (token[aa - 1] === "if" || token[aa - 1] === "for" || token[aa - 1] === "with") {
                                            return;
                                        }
                                        break;
                                    }
                                    if (token[aa - 1] === "if" || token[aa - 1] === "for" || token[aa - 1] === "else" || token[aa - 1] === "with") {
                                        break;
                                    }
                                    if (token[aa] === ":") {
                                        colon = true;
                                    } else if (types[aa] === "operator") {
                                        opers = true;
                                    }
                                    if (token[aa] === "=" || token[aa] === "return" || token[aa] === "," || token[aa] === ";" || token[aa] === "x;" || (token[aa] === "?" && colon === true)) {
                                        break;
                                    }
                                    if ((token[aa - 1] === ")" && (token[aa] === "{" || token[aa] === "x}")) || (token[aa] === ")" && (token[aa + 1] === "{" || token[aa + 1] === "x{"))) {
                                        bb = 0;
                                        if (token[aa] === ")") {
                                            b += 1;
                                        }
                                        colon = false;
                                        for (aa -= 1; aa > -1; aa -= 1) {
                                            if (types[aa] === "end") {
                                                bb += 1;
                                            } else if (types[aa] === "start" || types[aa] === "method") {
                                                bb -= 1;
                                            }
                                            if (bb < 0) {
                                                return;
                                            }
                                            if (bb === 0 && token[aa] === "(") {
                                                paren = true;
                                                if (token[aa - 1] === "if" || token[aa - 1] === "for" || token[aa - 1] === "with") {
                                                    return;
                                                }
                                            }
                                            if (bb === 0 && paren === true) {
                                                if (colon === true && token[aa] === "?") {
                                                    early = true;
                                                    break;
                                                }
                                                aa -= 1;
                                                if ((token[aa] === "function" && ((types[aa - 1] === "operator" && token[aa - 1] !== ":") || token[aa - 1] === "return")) || (token[aa - 1] === "function" && (types[aa - 2] === "operator" || token[aa - 2] === "return"))) {
                                                    early = true;
                                                    break;
                                                }
                                                if (token[aa] === "function" && token[aa - 1] === ":") {
                                                    colon = true;
                                                } else if (colon === false) {
                                                    return;
                                                }
                                            }
                                        }
                                        if (early === false) {
                                            return;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        if (token[aa] === "if" || token[aa] === "for" || token[aa] === "else" || token[aa] === "with") {
                            return;
                        }
                        ltoke = ";";
                        ltype = "separator";
                        token.splice(len + 1, 0, "x;");
                        types.splice(len + 1, 0, "separator");
                        lines.splice(len + 1, 0, 0);
                        blockinsert();
                    },
                    asifix         = function jspretty__tokenize_asifix() {
                        var len = types.length;
                        do {
                            len -= 1;
                        } while (len > 0 && (types[len] === "comment" || types[len] === "comment-inline"));
                        if (token[len] === "x;") {
                            token.splice(len, 1);
                            types.splice(len, 1);
                            lines.splice(len, 1);
                        }
                    },
                    asibrace       = function jspretty__tokenize_asibrace() {
                        var aa = token.length;
                        do {
                            aa -= 1;
                        } while (aa > -1 && token[aa] === "x}");
                        aa += 1;
                        token.splice(aa, 0, ltoke);
                        types.splice(aa, 0, ltype);
                    },
                    quoteConvert   = function jspretty__tokenize_quoteConvert(item) {
                        var dub   = (jquoteConvert === "double") ? true : false,
                            qchar = (dub === true) ? "\"" : "'";
                        item = item.slice(1, item.length - 1);
                        if (dub === true) {
                            item = item.replace(/"/g, "'");
                        } else {
                            item = item.replace(/'/g, "\"");
                        }
                        return qchar + item + qchar;
                    },
                    commentSplit   = function jspretty__tokenize_commentSplit(item) {
                        var tokel   = token[token.length - 1],
                            start   = jwrap,
                            spacely = (item.indexOf(" ") > 0) ? true : false;
                        if (token.length === 0) {
                            return;
                        }
                        item = item.slice(2);
                        if (spacely === true) {
                            if (tokel.indexOf("//") === 0 && tokel.length < start && tokel.indexOf(" ") > 0) {
                                start = start - tokel.length - 1;
                                if (item.charAt(start) !== " ") {
                                    do {
                                        start -= 1;
                                    } while (start > 0 && item.charAt(start) !== " ");
                                }
                                if (start > 0) {
                                    token[token.length - 1] = tokel + " " + item.slice(0, start);
                                    item                    = item.slice(start + 1);
                                }
                            }
                            start = jwrap - 2;
                            do {
                                if (item.charAt(start) !== " ") {
                                    do {
                                        start -= 1;
                                    } while (start > 0 && item.charAt(start) !== " ");
                                }
                                token.push("//" + item.slice(0, start));
                                types.push("comment");
                                lines.push(0);
                                item  = item.slice(start + 1);
                                start = jwrap - 2;
                            } while (item.length > start);
                            if (item !== "") {
                                token.push("//" + item.slice(0, start));
                                types.push("comment");
                                lines.push(0);
                            }
                        } else {
                            if (tokel.indexOf("//") === 0 && tokel.length < start && tokel.indexOf(" ") === -1 && item.indexOf(" ") === -1) {
                                start                   = start - tokel.length;
                                token[token.length - 1] = tokel + item.slice(0, start);
                                item                    = item.slice(start);
                                start                   = jwrap;
                            }
                            start -= 2;
                            do {
                                token.push("//" + item.slice(0, start));
                                types.push("comment");
                                lines.push(0);
                                item = item.slice(start);
                            } while (item.length > start);
                            if (item !== "") {
                                token.push("//" + item.slice(0, start));
                                types.push("comment");
                                lines.push(0);
                            }
                        }
                    },
                    strlen         = function jspretty__tokenize_strlen(item) {
                        var aa    = 0,
                            bb    = 0,
                            qchar = item.charAt(0);
                        if (item.length > jwrap + 2) {
                            item = item.slice(1, item.length - 1);
                            bb   = parseInt(item.length / jwrap, 10) * jwrap;
                            for (aa = 0; aa < bb; aa += jwrap) {
                                token.push(qchar + item.slice(aa, aa + jwrap) + qchar);
                                types.push("literal");
                                lines.push(0);
                                token.push("+");
                                types.push("operator");
                                lines.push(0);
                            }
                            if (aa - jwrap !== jwrap) {
                                token.push(qchar + item.slice(aa, aa + jwrap) + qchar);
                                types.push("literal");
                                lines.push(0);
                            } else {
                                token.pop();
                                types.pop();
                                lines.pop();
                            }
                        } else {
                            token.push(item);
                            types.push("literal");
                            lines.push(0);
                        }
                    },
                    strmerge       = function jspretty__tokenize_strmerge(item) {
                        var aa = 0,
                            bb = "";
                        item = item.slice(1, item.length - 1);
                        token.pop();
                        types.pop();
                        lines.pop();
                        aa        = token.length - 1;
                        bb        = token[aa];
                        token[aa] = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                    },
                    methodTest     = function jspretty__tokenize_methodTest() {
                        var cc  = 0,
                            dd  = 0,
                            end = token.length - 1;
                        if (token[end] === "," || types[end] === "comment" || types[end] === "comment-inline") {
                            do {
                                end -= 1;
                            } while (end > 0 && (token[end] === "," || types[end] === "comment" || types[end] === "comment-inline"));
                        }
                        for (cc = end; cc > -1; cc -= 1) {
                            if (types[cc] === "end") {
                                dd += 1;
                            }
                            if (types[cc] === "start" || types[cc] === "method") {
                                dd -= 1;
                            }
                            if (dd === 0 && token[cc - 1] === ")" && token[cc] === "{") {
                                for (cc -= 1; cc > -1; cc -= 1) {
                                    if (types[cc] === "end") {
                                        dd += 1;
                                    }
                                    if (types[cc] === "start" || types[cc] === "method") {
                                        dd -= 1;
                                    }
                                    if (dd === 0 && types[cc - 1] === "word") {
                                        if (token[cc - 1] === "function" || token[cc - 2] === "function") {
                                            return "method";
                                        }
                                        return "start";
                                    }
                                }
                                return "start";
                            }
                            if (dd < 0) {
                                if (types[cc] === "start" && types[cc + 1] === "start" && token[cc + 2] !== "function") {
                                    do {
                                        cc += 1;
                                    } while (cc < end && types[cc] === "start");
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
                        }
                        return "start";
                    },
                    newarray       = function jspretty__tokenize_newarray() {
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
                                types.pop();
                                types.pop();
                                types.pop();
                                lines.pop();
                                lines.pop();
                                lines.pop();
                                token[token.length - 1] = "[";
                                types[types.length - 1] = "start";
                                lines[lines.length - 1] = 0;
                                do {
                                    token.push(",");
                                    types.push("separator");
                                    lines.push(0);
                                    arraylen -= 1;
                                } while (arraylen > 0);
                            } else {
                                token[aa] = "[";
                                types[aa] = "start";
                                token.splice(aa - 2, 2);
                                types.splice(aa - 2, 2);
                                lines.splice(aa - 2, 2);
                            }
                            token.push("]");
                        } else {
                            token.push(")");
                        }
                        types.push("end");
                        lines.push(0);
                    },
                    logError       = function jspretty__tokenize_logError(message, start) {
                        var f = a,
                            g = types.length;
                        if (error.length > 0) {
                            return;
                        }
                        error.push(message);
                        do {
                            f -= 1;
                        } while (c[f] !== "\n" && c[f] !== "\r" && f > 0);
                        error.push(c.slice(f, start).join(""));
                        if (g > 1) {
                            do {
                                g -= 1;
                            } while (g > 0 && types[g] !== "comment");
                        }
                        if (g > -1 && g < token.length && token[g].indexOf("//") === 0 && error[1].replace(/^\s+/, "").indexOf(token[g + 1]) === 0 && (token[g].split("\"").length % 2 === 1 || token[g].split("'").length % 2 === 1)) {
                            error = [
                                message, token[g] + error[1]
                            ];
                        } else {
                            error = [
                                message, error[1]
                            ];
                        }
                    },
                    generic        = function jspretty__tokenize_genericBuilder(start, ending) {
                        var ee     = 0,
                            g      = 0,
                            end    = ending.split(""),
                            endlen = end.length - 1,
                            jj     = b,
                            build  = [start],
                            base   = a + start.length,
                            output = "",
                            escape = false;
                        if (ending === "\r") {
                            end = ["\n"];
                        }
                        if (c[a - 1] === "\\" && slashes(a - 1) === true && (c[a] === "\"" || c[a] === "'")) {
                            token.pop();
                            types.pop();
                            lines.pop();
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
                            if ((start === "\"" || start === "'") && c[ee - 1] !== "\\" && (c[ee] === "\n" || c[ee] === "\r" || ee === jj - 1)) {
                                logError("Unterminated string in JavaScript.", ee);
                                break;
                            }
                            if (c[ee] === end[g] && (c[ee - 1] !== "\\" || slashes(ee - 1) === false)) {
                                if (g === endlen) {
                                    break;
                                }
                                g += 1;
                            } else if (c[ee + 1] !== end[g]) {
                                g = 0;
                            }
                        }
                        if (escape === true) {
                            output = build[build.length - 1];
                            build.pop();
                            build.pop();
                            build.push(output);
                        }
                        a = ee;
                        if (start === "//") {
                            stats.space.newline += 1;
                            build.pop();
                        }
                        if (jsscope !== "none") {
                            output = build.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            output = build.join("");
                        }
                        return output;
                    },
                    operator       = function jspretty__tokenize_operator() {
                        var syntax = [
                                "=", "<", ">", "+", "*", "?", "|", "^", ":", "&", "%", "~"
                            ],
                            g      = 0,
                            h      = 0,
                            jj     = b,
                            build  = [c[a]],
                            synlen = syntax.length,
                            output = "";
                        if (a < b - 1) {
                            if (c[a] !== "<" && c[a + 1] === "<") {
                                return c[a];
                            }
                            if (c[a] === "!" && c[a + 1] === "/") {
                                return "!";
                            }
                            if (c[a] === ":" && c[a + 1] !== ":") {
                                if (obj.len > -1 && obj.count[obj.len] === 0) {
                                    obj.status[obj.len] = true;
                                }
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
                        if (jsscope !== "none") {
                            output = output.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        }
                        if (output === "?" && obj.len > -1 && obj.count[obj.len] === 0 && obj.status[obj.len] === false) {
                            obj.count[obj.len] += 1;
                        }
                        return output;
                    },
                    regex          = function jspretty__tokenize_regex() {
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
                        if (jsscope !== "none") {
                            output = build.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            output = build.join("");
                        }
                        return output;
                    },
                    tempstring     = function jspretty__tokenize_tempstring() {
                        var output = [c[a]];
                        for (a += 1; a < b; a += 1) {
                            output.push(c[a]);
                            if (c[a] === "`" && (c[a - 1] !== "\\" || slashes(a - 1) === false)) {
                                templateString.pop();
                                break;
                            }
                            if (c[a - 1] === "$" && c[a] === "{" && (c[a - 2] !== "\\" || slashes(a - 2) === false)) {
                                templateString[templateString.length - 1] = true;
                                break;
                            }
                        }
                        return output.join("");
                    },
                    numb           = function jspretty__tokenize_number() {
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
                    space          = function jspretty__tokenize_space() {
                        var schars    = [],
                            f         = 0,
                            locallen  = b,
                            emptyline = 1,
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
                        if (output.indexOf("\n") > -1 && token[token.length - 1].indexOf("#!/") !== 0) {
                            if (output.indexOf("\n") !== output.lastIndexOf("\n") || token[token.length - 1].indexOf("//") === 0) {
                                emptyline = 2;
                            }
                            lines[lines.length - 1] = emptyline;
                        }
                        if (asitest === true && ltoke !== ";" && lengthb < token.length) {
                            asi();
                            lengthb = token.length;
                        }
                    },
                    word           = function jspretty__tokenize_word() {
                        var f      = wordTest,
                            g      = 1,
                            build  = [],
                            output = "";
                        do {
                            build.push(c[f]);
                            if (c[f] === "\\") {
                                logError("Illegal escape in JavaScript word token.", a);
                            }
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
                            g = types.length - 1;
                            f = g;
                            if (jvarword !== "none" && output === "var") {
                                if (types[g] === "comment" || types[g] === "comment-inline") {
                                    do {
                                        g -= 1;
                                    } while (g > 0 && (types[g] === "comment" || types[g] === "comment-inline"));
                                }
                                if (jvarword === "list" && vart.len > -1 && vart.index[vart.len] === g) {
                                    stats.word.token     += 1;
                                    stats.word.chars     += output.length;
                                    ltoke                = ",";
                                    ltype                = "separator";
                                    token[g]             = ltoke;
                                    types[g]             = ltype;
                                    vart.count[vart.len] = 0;
                                    vart.index[vart.len] = g;
                                    return;
                                }
                                vart.len += 1;
                                vart.count.push(0);
                                vart.index.push(g);
                                g = f;
                            } else if (vart.len > -1 && output !== "var" && token.length === vart.index[vart.len] + 1 && token[vart.index[vart.len]] === ";" && ltoke !== "var" && jvarword === "list") {
                                vartpop();
                            }
                            if (output === "else" && (types[g] === "comment" || types[g] === "comment-inline")) {
                                do {
                                    f -= 1;
                                } while (f > -1 && (types[f] === "comment" || types[f] === "comment-inline"));
                                if (token[f] === "x;" && (token[f - 1] === "}" || token[f - 1] === "x}")) {
                                    token.splice(f, 1);
                                    types.splice(f, 1);
                                    lines.splice(f, 1);
                                    g -= 1;
                                    f -= 1;
                                }
                                do {
                                    build = [
                                        token[g], types[g], lines[g]
                                    ];
                                    token.pop();
                                    types.pop();
                                    lines.pop();
                                    token.splice(g - 3, 0, build[0]);
                                    types.splice(g - 3, 0, build[1]);
                                    lines.splice(g - 3, 0, build[2]);
                                    f += 1;
                                } while (f < g);
                            }
                            if (output === "do") {
                                dostate.count.push(0);
                                dostate.state.push("do");
                                dostate.len += 1;
                            }
                            if (output === "while") {
                                if (dostate.state[dostate.len] === "do" && dostate.count[dostate.len] === 0) {
                                    if (ltoke === "}") {
                                        asifix();
                                    }
                                    dostate.state[dostate.len] = "while";
                                    dostate.index              = token.length;
                                }
                            }
                            if (output === "if" && block.len > -1 && token[block.index[block.len]] === "else") {
                                blockpop();
                            }
                            if (output === "if" || output === "for" || output === "with" || (output === "while" && dostate.index !== token.length) || output === "else" || output === "do") {
                                if (block.len > -1 && block.index[block.len] === token.length) {
                                    block.consec.push(true);
                                } else {
                                    block.consec.push(false);
                                }
                                if (ltoke === "return") {
                                    block.priorreturn.push(true);
                                } else {
                                    block.priorreturn.push(false);
                                }
                                block.word.push(output);
                                block.count.push(0);
                                block.index.push(token.length);
                                block.semi.push(false);
                                block.len += 1;
                            }
                            token.push(output);
                            types.push("word");
                            ltoke            = output;
                            ltype            = "word";
                            stats.word.token += 1;
                            stats.word.chars += output.length;
                        }
                        lines.push(0);
                    },
                    markup         = function jspretty__tokenize_markup() {
                        var output     = [],
                            curlytest  = false,
                            endtag     = false,
                            anglecount = 0,
                            curlycount = 0,
                            tagcount   = 0,
                            d          = 0,
                            syntax     = "=<>+*?|^:&.,;%(){}[]|~";
                        if (syntax.indexOf(c[a + 1]) > -1 || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "literal" || (ltype === "word" && ltoke !== "return")))) {
                            ltype = "operator";
                            return operator();
                        }
                        for (d = token.length - 1; d > -1; d -= 1) {
                            if (token[d] === "return" || types[d] === "operator" || types[d] === "method") {
                                ltype     = "markup";
                                jsxstatus = true;
                                break;
                            }
                            if (token[d] !== "(") {
                                ltype = "operator";
                                return operator();
                            }
                        }
                        for (a; a < b; a += 1) {
                            output.push(c[a]);
                            if (c[a] === "{") {
                                curlycount += 1;
                                curlytest  = true;
                            } else if (c[a] === "}") {
                                curlycount -= 1;
                                if (curlycount === 0) {
                                    curlytest = false;
                                }
                            } else if (c[a] === "<" && curlytest === false) {
                                anglecount += 1;
                                if (c[a + 1] === "/") {
                                    endtag = true;
                                }
                            } else if (c[a] === ">" && curlytest === false) {
                                anglecount -= 1;
                                if (endtag === true) {
                                    tagcount -= 1;
                                } else if (c[a - 1] !== "/") {
                                    tagcount += 1;
                                }
                                if (anglecount === 0 && curlycount === 0 && tagcount < 1) {
                                    return output.join("");
                                }
                                endtag = false;
                            }
                        }
                        return output.join("");
                    };
                for (a = 0; a < b; a += 1) {
                    lengtha = token.length;
                    if ((/\s/).test(c[a])) {
                        //space
                        if (wordTest > -1) {
                            word();
                        }
                        space();
                    } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                        //php
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke              = generic("<?php", "?>");
                        ltype              = "literal";
                        stats.server.token += 1;
                        stats.server.chars += ltoke.length;
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "<" && c[a + 1] === "%") {
                        //asp
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke              = generic("<%", "%>");
                        ltype              = "literal";
                        stats.server.token += 1;
                        stats.server.chars += ltoke.length;
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                        //ssi
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke              = generic("<!--#", "-->");
                        ltype              = "literal";
                        stats.server.token += 1;
                        stats.server.chars += ltoke.length;
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "<") {
                        //markup
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke              = markup();
                        stats.server.token += 1;
                        stats.server.chars += ltoke.length;
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                        //comment block
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
                            lines.push(0);
                        }
                    } else if ((lines.length === 0 || lines[lines.length - 1] > 0) && c[a] === "#" && c[a + 1] === "!" && c[a + 2] === "/") {
                        //shebang
                        ltoke              = generic("#!/", "\r");
                        ltoke              = ltoke.slice(0, ltoke.length - 1);
                        ltype              = "literal";
                        stats.server.token += 1;
                        stats.server.chars += ltoke.length;
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(2);
                    } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                        //comment line
                        if (wordTest > -1) {
                            word();
                        }
                        asi();
                        ltoke                   = generic("//", "\r");
                        stats.commentLine.token += 1;
                        stats.commentLine.chars += ltoke.length;
                        if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                            sourcemap[0] = token.length;
                            sourcemap[1] = ltoke;
                        }
                        if (jcomment !== "nocomment") {
                            if (lines[lines.length - 1] === 0 && ltype !== "comment" && ltype !== "comment-inline" && jstyleguide !== "mrdoobs") {
                                ltype = "comment-inline";
                            } else {
                                ltype = "comment";
                            }
                            if (ltype === "comment" && jwrap > 0 && ltoke.length > jwrap) {
                                commentSplit(ltoke);
                            } else {
                                token.push(ltoke);
                                types.push(ltype);
                                lines.push(0);
                            }
                        }
                    } else if (c[a] === "/" && (lengtha > 0 && (types[lengtha - 1] !== "word" || ltoke === "typeof" || ltoke === "return") && ltype !== "literal" && ltype !== "end")) {
                        //regex
                        if (wordTest > -1) {
                            word();
                        }
                        if (ltoke === "return" || ltype !== "word") {
                            ltoke             = regex();
                            ltype             = "regex";
                            stats.regex.token += 1;
                            stats.regex.chars += ltoke.length;
                        } else {
                            stats.operator.token += 1;
                            stats.operator.chars += 1;
                            ltoke                = "/";
                            ltype                = "operator";
                        }
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "`" || (c[a] === "}" && templateString[templateString.length - 1] === true)) {
                        //template string
                        if (wordTest > -1) {
                            word();
                        }
                        if (c[a] === "`") {
                            templateString.push(false);
                        } else {
                            templateString[templateString.length - 1] = false;
                        }
                        ltoke              = tempstring();
                        ltype              = "literal";
                        stats.string.token += 1;
                        if (ltoke.charAt(ltoke.length - 1) === "{") {
                            stats.string.quote += 3;
                            stats.string.chars += ltoke.length - 3;
                        } else {
                            stats.string.quote += 2;
                            stats.string.chars = ltoke.length - 2;
                        }
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "\"" || c[a] === "'") {
                        //string
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke = generic(c[a], c[a]);
                        ltype = "literal";
                        if ((ltoke.charAt(0) === "\"" && jquoteConvert === "single") || (ltoke.charAt(0) === "'" && jquoteConvert === "double")) {
                            ltoke = quoteConvert(ltoke);
                        }
                        stats.string.token += 1;
                        if (ltoke.length > 1) {
                            stats.string.chars += ltoke.length - 2;
                        }
                        stats.string.quote += 2;
                        if (token[token.length - 1] === "+" && jwrap < 0 && (token[token.length - 2].charAt(0) === "\"" || token[token.length - 2].charAt(0) === "'")) {
                            strmerge(ltoke);
                        } else if (jwrap > 0 && ltoke.length > jwrap && (types[types.length - 1] !== "operator" || (token[token.length - 1] === "+" && types[types.length - 1] === "literal"))) {
                            strlen(ltoke);
                        } else {
                            token.push(ltoke);
                            types.push(ltype);
                            lines.push(0);
                        }
                    } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "literal" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "literal")) {
                        //subtraction
                        if (wordTest > -1) {
                            word();
                        }
                        stats.operator.token += 1;
                        stats.operator.chars += 1;
                        ltoke                = "-";
                        ltype                = "operator";
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (wordTest === -1 && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                        //number
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
                        lines.push(0);
                    } else if (c[a] === ",") {
                        //comma
                        if (wordTest > -1) {
                            word();
                        }
                        stats.comma += 1;
                        if (ltype === "comment" || ltype === "comment-inline") {
                            commaComment();
                        } else if (vart.len > -1 && vart.count[vart.len] === 0 && jvarword === "each") {
                            asifix();
                            ltoke = "var";
                            ltype = "word";
                            token.push(";");
                            types.push("separator");
                            lines.push(0);
                            token.push(ltoke);
                            types.push(ltype);
                            lines.push(0);
                            vart.index[vart.len] = token.length - 1;
                        } else {
                            ltoke = ",";
                            ltype = "separator";
                            asifix();
                            token.push(ltoke);
                            types.push(ltype);
                            lines.push(0);
                        }
                    } else if (c[a] === ".") {
                        //period
                        if (wordTest > -1) {
                            word();
                        }
                        stats.operator.token += 1;
                        if (c[a + 1] === "." && c[a + 2] === ".") {
                            ltoke                = "...";
                            ltype                = "operator";
                            stats.operator.chars += 3;
                            a                    += 2;
                        } else {
                            asifix();
                            ltoke                = ".";
                            ltype                = "separator";
                            stats.operator.chars += 1;
                        }
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === ";") {
                        //semicolon
                        if (wordTest > -1) {
                            word();
                        }
                        if (vart.len > -1 && vart.count[vart.len] === 0) {
                            if (jvarword === "each") {
                                vartpop();
                            } else {
                                vart.index[vart.len] = token.length;
                            }
                        }
                        stats.semicolon += 1;
                        plusplus();
                        ltoke = ";";
                        ltype = "separator";
                        if (dostate.index === token.length - 1) {
                            asifix();
                        }
                        if (token[token.length - 1] === "x}") {
                            asibrace();
                        } else {
                            token.push(ltoke);
                            types.push(ltype);
                        }
                        lines.push(0);
                        blockinsert();
                    } else if (c[a] === "(") {
                        //parenthesis open
                        if (wordTest > -1) {
                            word();
                        }
                        if (block.len > -1) {
                            block.count[block.len] += 1;
                        }
                        if (vart.len > -1) {
                            vart.count[vart.len] += 1;
                        }
                        if (dostate.len > -1) {
                            dostate.count[dostate.len] += 1;
                        }
                        stats.container += 1;
                        if (ltoke === ")" || token[token.length - 1] === "x;") {
                            ltype = "method";
                        } else if (ltype === "comment" || ltype === "comment-inline" || ltype === "start") {
                            ltype = "start";
                        } else if (lengtha > 2 && token[lengtha - 2] === "function") {
                            ltype = "method";
                        } else if (lengtha === 0 || ltoke === "return" || ltoke === "function" || ltoke === "for" || ltoke === "if" || ltoke === "with" || ltoke === "while" || ltoke === "switch" || ltoke === "catch" || ltype === "separator" || ltype === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
                            ltype = "start";
                        } else if (ltype === "end") {
                            ltype = methodTest();
                        } else {
                            ltype = "method";
                        }
                        asifix();
                        ltoke = "(";
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "[") {
                        //square open
                        if (wordTest > -1) {
                            word();
                        }
                        if (block.len > -1) {
                            block.count[block.len] += 1;
                        }
                        if (vart.len > -1) {
                            vart.count[vart.len] += 1;
                        }
                        if (dostate.len > -1) {
                            dostate.count[dostate.len] += 1;
                        }
                        stats.container += 1;
                        ltoke           = "[";
                        ltype           = "start";
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "{") {
                        //curly open
                        if (wordTest > -1) {
                            word();
                        }
                        if (vart.len > -1) {
                            vart.count[vart.len] += 1;
                        }
                        if (dostate.len > -1) {
                            dostate.count[dostate.len] += 1;
                        }
                        if (ltoke !== ")" && ltoke !== "else" && ltoke !== "do") {
                            obj.count.push(0);
                            obj.status.push(false);
                            obj.len += 1;
                        } else if (obj.len > -1) {
                            obj.count[obj.len] += 1;
                        }
                        if (ltoke === "else" || ltoke === "do" || (ltoke === ")" && block.len > -1 && block.count[block.len] === 0 && (block.word[block.len] === "if" || block.word[block.len] === "for" || block.word[block.len] === "while" || block.word[block.len] === "with"))) {
                            blockpop();
                        }
                        if (block.len > -1) {
                            block.count[block.len] += 1;
                        }
                        if (ltoke === ")") {
                            asifix();
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
                        token.push(ltoke);
                        types.push(ltype);
                        if (jbraceline === true) {
                            lines.push(2);
                        } else {
                            lines.push(0);
                        }
                    } else if (c[a] === ")") {
                        //parenthesis close
                        if (wordTest > -1) {
                            word();
                        }
                        if (block.len > -1) {
                            block.count[block.len] -= 1;
                        }
                        if (vart.len > -1) {
                            vart.count[vart.len] -= 1;
                            if (vart.count[vart.len] < 0) {
                                vartpop();
                            }
                        }
                        asifix();
                        stats.container += 1;
                        plusplus();
                        ltoke = ")";
                        ltype = "end";
                        if (jscorrect === true) {
                            newarray();
                        } else {
                            token.push(ltoke);
                            types.push(ltype);
                            lines.push(0);
                        }
                        if (dostate.len > -1) {
                            dostate.count[dostate.len] -= 1;
                            if (dostate.count[dostate.len] === 0 && dostate.state[dostate.len] === "while") {
                                asi();
                                dostate.count.pop();
                                dostate.state.pop();
                                dostate.len   -= 1;
                                dostate.index = token.length - 1;
                            }
                        }
                    } else if (c[a] === "]") {
                        //square close
                        if (wordTest > -1) {
                            word();
                        }
                        if (block.len > -1) {
                            block.count[block.len] -= 1;
                        }
                        if (vart.len > -1) {
                            vart.count[vart.len] -= 1;
                            if (vart.count[vart.len] < 0) {
                                vartpop();
                            }
                        }
                        if (dostate.len > -1) {
                            dostate.count[dostate.len] -= 1;
                        }
                        asifix();
                        stats.container += 1;
                        plusplus();
                        ltoke = "]";
                        ltype = "end";
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (c[a] === "}") {
                        //curly close
                        if (wordTest > -1) {
                            word();
                        }
                        if (ltoke === ",") {
                            token.pop();
                            types.pop();
                            lines.pop();
                        }
                        if (dostate.len > -1) {
                            dostate.count[dostate.len] -= 1;
                        }
                        asi();
                        if (vart.len > -1) {
                            if ((jvarword === "list" && vart.count[vart.len] === 0) || (token[token.length - 1] === "x;" && jvarword === "each")) {
                                vartpop();
                            }
                            vart.count[vart.len] -= 1;
                            if (vart.count[vart.len] < 0) {
                                vartpop();
                            }
                        }
                        if (obj.len > -1) {
                            if (obj.count[obj.len] === 0) {
                                objpop();
                            } else {
                                obj.count[obj.len] -= 1;
                            }
                        }
                        if (ltype === "comment" || ltype === "comment-inline") {
                            do {
                                lengtha -= 1;
                            } while (lengtha > 0 && (types[lengtha] === "comment" || ltype === "comment-inline"));
                            ltoke   = token[lengtha];
                            lengtha = token.length;
                        }
                        if (jbraceline === true) {
                            lines[lines.length - 1] = 2;
                        }
                        if (ltoke === ",") {
                            stats.container += 1;
                            ltoke           = "}";
                            ltype           = "end";
                            token.push(ltoke);
                            types.push(ltype);
                            lines.push(0);
                        } else {
                            if (ltoke === ";" && jmode === "minify" && jobfuscate === true) {
                                token[token.length - 1] = "x;";
                            }
                            plusplus();
                            stats.container += 1;
                            ltoke           = "}";
                            ltype           = "end";
                            token.push(ltoke);
                            types.push(ltype);
                            lines.push(0);
                        }
                        if (block.len > -1) {
                            if (block.count[block.len] > 0) {
                                block.count[block.len] -= 1;
                                if (block.count[block.len] === 0) {
                                    blockinsert();
                                }
                            }
                        }
                    } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                        //operator
                        if (wordTest > -1) {
                            word();
                        }
                        ltoke                = operator();
                        ltype                = "operator";
                        stats.operator.token += 1;
                        stats.operator.chars += ltoke.length;
                        if (ltoke !== "!" && ltoke !== "++" && ltoke !== "--") {
                            asifix();
                        }
                        token.push(ltoke);
                        types.push(ltype);
                        lines.push(0);
                    } else if (wordTest < 0 && c[a] !== "") {
                        wordTest = a;
                    }
                    if (block.len > -1) {
                        if (block.count[block.len] === 0 && token[token.length - 1] === ")" && token[block.index[block.len]] === block.word[block.len] && (block.word[block.len] === "if" || block.word[block.len] === "for" || block.word[block.len] === "while" || block.word[block.len] === "with")) {
                            block.index[block.len] = token.length;
                        }
                    }
                    if (vart.len > -1 && token.length === vart.index[vart.len] + 2 && token[vart.index[vart.len]] === ";" && ltoke !== "var" && jvarword === "list") {
                        vartpop();
                    }
                }
                if (((token[token.length - 1] !== "}" && token[0] === "{") || token[0] !== "{") && ((token[token.length - 1] !== "]" && token[0] === "[") || token[0] !== "[")) {
                    asi();
                }
                if (block.len > -1) {
                    blockinsert();
                }
                if (sourcemap[0] === token.length - 1) {
                    token.push("\n" + sourcemap[1]);
                    types.push("literal");
                    lines.push(0);
                }
            }());

            if (jscorrect === true) {
                (function jspretty__jscorrect() {
                    var a = 0,
                        b = token.length;
                    for (a = 0; a < b; a += 1) {
                        if (token[a] === "x;") {
                            token[a] = ";";
                            scolon   += 1;
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

            if (jmode === "parse") {
                return {
                    token: token,
                    types: types
                };
            }

            if (jsxstatus === true && jsscope !== "none" && token[0] === "{") {
                jsscope = "none";
                (function jspretty__jsxScope() {
                    var a   = 0,
                        len = token.length;
                    for (a = 0; a < len; a += 1) {
                        if (types[a] === "word" && token[a - 1] !== ".") {
                            token[a] = "[pdjsxscope]" + token[a] + "[/pdjsxscope]";
                        }
                    }
                }());
            }

            if (jmode === "beautify" || (jmode === "minify" && jobfuscate === true)) {
                //this function is the pretty-print and var finding algorithm
                (function jspretty__algorithm() {
                    var a          = 0,
                        b          = token.length,
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
                        lettest    = -1,
                        varlen     = [],
                        methodtest = [],
                        assignlist = [false],
                        functest   = function jspretty__algorithm_functest() {
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
                                        if (token[c] === ";" || token[c] === "x;" || token[c] === "{" || token[c] === "x{" || lines[c] > 0) {
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
                                                if (assign === false && (token[c] === "=" || token[c] === ";" || token[c] === "x;")) {
                                                    assign = true;
                                                }
                                                if (compare === false && (token[c] === "&&" || token[c] === "||")) {
                                                    compare = true;
                                                }
                                                if (semicolon === false && (token[c] === ";" || token[c] === "x;")) {
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
                                                                if (token[c - 1] === "function" || token[c - 2] === "function" || token[c - 1] === "if" || token[c - 1] === "for" || token[c - 1] === "with") {
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
                                if (ctoke === "x;") {
                                    scolon += 1;
                                }
                                level[a - 1] = "x";
                                if (fortest === 0) {
                                    if (varline[varline.length - 1] === true) {
                                        varline[varline.length - 1] = false;
                                        if ((methodtest.length === 0 || methodtest[methodtest.length - 1] === false) && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                            varlist.push(varlen[varlen.length - 1]);
                                        }
                                        varlen.pop();
                                        (function jspretty__algorithm_separator_varlinefix() {
                                            var c = 0,
                                                d = 0;
                                            for (c = a - 1; c > -1; c -= 1) {
                                                if (types[c] === "start" || types[c] === "method") {
                                                    d += 1;
                                                }
                                                if (types[c] === "end") {
                                                    d -= 1;
                                                }
                                                if (d > 0) {
                                                    return;
                                                }
                                                if (d === 0) {
                                                    if (token[c] === "var" || token[c] === "let") {
                                                        return;
                                                    }
                                                    if (token[c] === ",") {
                                                        indent -= 1;
                                                        return;
                                                    }
                                                }
                                            }
                                        }());
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
                            if (ltoke === "*" && token[a - 2] === "function") {
                                level[a - 2] = "x";
                                level[a - 1] = "s";
                                level.push("x");
                            } else {
                                level[a - 1] = "x";
                                if (jbracepadding === true) {
                                    level.push("s");
                                } else {
                                    level.push("x");
                                }
                            }
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
                                if (ltoke === "=" || ltoke === ";" || ltoke === "x;" || ltoke === "," || ltoke === ":" || ltoke === "?" || ltoke === "return" || ltoke === "in" || ltype === "start" || ltype === "method") {
                                    obj.push(true);
                                } else {
                                    obj.push(false);
                                }
                                if (jbraces === true && ltype !== "operator" && ltoke !== "return") {
                                    level[a - 1] = indent - 1;
                                } else if (ltoke === ")") {
                                    level[a - 1] = "s";
                                } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent - 1;
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
                                if (jsscope !== "none" || jmode === "minify") {
                                    if (ltoke === "function" || token[a - 2] === "function") {
                                        meta[meta.length - 1] = 0;
                                    }
                                }
                                if (fortest > 0 && ltoke !== "for") {
                                    fortest += 1;
                                }
                                if (ltoke === "}" || ltoke === ")") {
                                    if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && functest() === true) {
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
                                if (jbracepadding === true) {
                                    return level.push("s");
                                }
                                return level.push("x");
                            }
                            if (ctoke === "[") {
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
                            return level.push("x");
                        },
                        end        = function jspretty__algorithm_end() {
                            if (fortest === 1 && ctoke === ")" && varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                            }
                            if (ctoke !== ")" && (ltype !== "markup" || (ltype === "markup" && token[a - 2] !== "return"))) {
                                indent -= 1;
                            } else if (fortest > 0 && ctoke === ")") {
                                fortest -= 1;
                            }
                            if (ctoke === "}" || ctoke === "x}") {
                                if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || token[a - 2] !== "x;" || ltoke === "break" || ltoke === "return")) {
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
                                                if (token[c] === "=" || token[c] === ";" || token[c] === "x;") {
                                                    assign = true;
                                                }
                                                if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "{" || token[c - 1] === "x{" || token[c - 1] === "}" || token[c - 1] === "x}" || token[c - 1] === ";" || token[c - 1] === "x;")) {
                                                    indent       -= 1;
                                                    level[a - 1] = indent;
                                                    return;
                                                }
                                                if ((token[c] === ":" && ternary[ternary.length - 1] === false) || (token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                                    return;
                                                }
                                                if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var" || token[c] === "let" || token[c] === "with") {
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
                                if (jsscope !== "none" || jmode === "minify") {
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
                                                if (c === lettest) {
                                                    meta[c]               = a;
                                                    meta[meta.length - 1] = [
                                                        build, true
                                                    ];
                                                    lettest               = -1;
                                                    return;
                                                }
                                            }
                                            if (c > 0 && token[c - 1] === "function" && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                                build.push(token[c]);
                                            }
                                            if (d === 0) {
                                                if (types[c] === "separator" || types[c] === "operator" || types[c] === "literal" || token[c] === "if" || token[c] === "else" || token[c] === "for" || token[c] === "switch" || token[c] === "do" || token[c] === "return" || token[c] === "while" || token[c] === "catch" || token[c] === "try" || token[c] === "with") {
                                                    return;
                                                }
                                                if (token[c] === "function") {
                                                    if (types[c + 1] === "word") {
                                                        meta[c + 2] = a;
                                                    } else {
                                                        meta[c + 1] = a;
                                                    }
                                                    meta[meta.length - 1] = [
                                                        build, false
                                                    ];
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
                                if (ctoke === "}" && jtitanium === true) {
                                    level.push(indent);
                                } else {
                                    level.push("x");
                                }
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
                            } else if (ctoke === ")" && ltype !== "markup") {
                                if (jbracepadding === true && ltype !== "end" && ltype !== "start" && ltype !== "method") {
                                    level[a - 1] = "s";
                                } else {
                                    level[a - 1] = "x";
                                }
                                level.push("s");
                            } else if ((ctoke === "}" || ctoke === "x}") && obj[obj.length - 1] === false && ltype === "word" && list[list.length - 1] === false && casetest[casetest.length - 1] === false) {
                                indent       += 1;
                                level[a - 1] = indent;
                                level.push(indent);
                            } else if (ctoke === "}" || ctoke === "x}" || list[list.length - 1] === true) {
                                if (ctoke === "}" && ltoke === "x}" && token[a + 1] === "else") {
                                    level[a - 2] = indent + 2;
                                    level.push("x");
                                } else {
                                    level.push(indent);
                                }
                                level[a - 1] = indent;
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
                        },
                        operator   = function jspretty__algorithm_operator() {
                            if (ctoke === "!" || ctoke === "...") {
                                if (ltoke === "(") {
                                    level[a - 1] = "x";
                                }
                                if (ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent;
                                }
                                return level.push("x");
                            }
                            if (ltoke === ";" || ltoke === "x;") {
                                if (fortest === 0) {
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
                                            } while (c > 0 && (types[c] === "comment" || types[c] === "comment-inline"));
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
                                        if (d === 0 && token[c] === "=") {
                                            break;
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
                                                break;
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
                            if (ctoke === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && token[a + 1] !== undefined && (token[a + 1].charAt(0) === "\"" || token[a + 1].charAt(0) === "'") && (token[a - 2] === "=" || token[a - 2] === "(" || (token[a - 2] === "+" && level[a - 2] > 0))) {
                                if (ltoke.length + 3 + token[a + 1].length < jwrap) {
                                    return level.push("s");
                                }
                                if (varline[varline.length - 1] === true) {
                                    level.push(indent);
                                } else {
                                    level.push(indent + 1);
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
                                            if (d === ";" || d === "x;" || d === ",") {
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
                                            f = token[c];
                                            if (e === true) {
                                                if (types[c] === "operator" || token[c] === ";" || token[c] === "x;" || token[c] === "var" || token[c] === "let") {
                                                    if (f !== undefined && f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<=") {
                                                        if (assignlist[assignlist.length - 1] === false) {
                                                            varlen.push([a - 1]);
                                                            assignlist[assignlist.length - 1] = true;
                                                        }
                                                    }
                                                    if ((f === ";" || f === "x;" || f === "var" || f === "let") && assignlist[assignlist.length - 1] === true) {
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
                                                if (assignlist[assignlist.length - 1] === true && (f === "return" || f === "break" || f === "continue" || f === "throw")) {
                                                    assignlist[assignlist.length - 1] = false;
                                                    if (varlen[varlen.length - 1].length > 1) {
                                                        varlist.push(varlen[varlen.length - 1]);
                                                    }
                                                    varlen.pop();
                                                }
                                            }
                                            if (f === ";" || f === "x;" || f === ",") {
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
                            if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var" || ltoke === "let")) {
                                if (fortest === 0 && (methodtest[methodtest.length - 1] === false || methodtest.length === 0)) {
                                    if (types[a + 1] === "operator" && compare === true && varlen.length > 0 && token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ":") {
                                        varlen[varlen.length - 1].push(a);
                                    }
                                }
                                if (jsscope !== "none" || jmode === "minify") {
                                    meta[meta.length - 1] = "v";
                                }
                            } else if ((jsscope !== "none" || jmode === "minify") && ltoke === "function") {
                                meta[meta.length - 1] = "v";
                            }
                            if (ltoke === "}" || ltoke === "x}") {
                                level[a - 1] = indent;
                            }
                            if (ctoke === "else" && ltoke === "}" && token[a - 2] === "x}") {
                                level[a - 3] -= 1;
                            }
                            if (varline.length === 1 && varline[0] === true && (ltoke === "var" || ltoke === "let" || ltoke === "," || (ltoke === "function" && types[a + 1] === "method"))) {
                                globals.push(ctoke);
                            }
                            if (ctoke === "let" && lettest < 0) {
                                lettest = a;
                            }
                            if (ctoke === "new") {
                                (function jspretty__algorithm_word_new() {
                                    var c       = 0,
                                        nextish = (typeof next === "string") ? next : "",
                                        apiword = (nextish === "") ? [] : [
                                            "ActiveXObject", "ArrayBuffer", "AudioContext", "Canvas", "CustomAnimation", "DOMParser", "DataView", "Date", "Error", "EvalError", "FadeAnimation", "FileReader", "Flash", "Float32Array", "Float64Array", "FormField", "Frame", "Generator", "HotKey", "Image", "Iterator", "Intl", "Int16Array", "Int32Array", "Int8Array", "InternalError", "Loader", "Map", "MenuItem", "MoveAnimation", "Notification", "ParallelArray", "Point", "Promise", "Proxy", "RangeError", "Rectangle", "ReferenceError", "Reflect", "RegExp", "ResizeAnimation", "RotateAnimation", "Set", "SQLite", "ScrollBar", "Set", "Shadow", "StopIteration", "Symbol", "SyntaxError", "Text", "TextArea", "Timer", "TypeError", "URL", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray", "URIError", "WeakMap", "WeakSet", "Web", "Window", "XMLHttpRequest"
                                        ],
                                        apilen  = apiword.length;
                                    for (c = 0; c < apilen; c += 1) {
                                        if (nextish === apiword[c]) {
                                            return;
                                        }
                                    }
                                    news += 1;
                                    if (jsscope !== "none") {
                                        token[a] = "<strong class='new'>new</strong>";
                                    }
                                }());
                            }
                            if (ctoke === "this" && jsscope !== "none") {
                                token[a] = "<strong class='new'>this</strong>";
                            }
                            if (ctoke === "function" && jspace === false && a < b - 1 && token[a + 1] === "(") {
                                return level.push("x");
                            }
                            if (ctoke === "return") {
                                listtest[listtest.length - 1] = false;
                            }
                            if (ltype === "literal" && ltoke.charAt(ltoke.length - 1) === "{" && jbracepadding === false) {
                                level[a - 1] = "x";
                            } else if (ltoke === "-" && a > 1) {
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
                            } else if (ctoke === "var" || ctoke === "let") {
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
                                    (function jspretty__algorithm_word_varlisttest() {
                                        var c = 0,
                                            d = 0;
                                        for (c = a + 1; c < b; c += 1) {
                                            if (types[c] === "end") {
                                                d -= 1;
                                            }
                                            if (types[c] === "start" || types[c] === "method") {
                                                d += 1;
                                            }
                                            if (d < 0 || (d === 0 && (token[c] === ";" || token[c] === ","))) {
                                                break;
                                            }
                                        }
                                        if (token[c] === ",") {
                                            indent += 1;
                                        }
                                    }());
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
                            } else if (ctoke === "catch" || ctoke === "finally") {
                                level[a - 1] = "s";
                                return level.push("s");
                            }
                            if (jbracepadding === false && a < b - 1 && token[a + 1].charAt(0) === "}") {
                                return level.push("x");
                            }
                            level.push("s");
                        };
                    if (jtitanium === true) {
                        indent -= 1;
                    }
                    for (a = 0; a < b; a += 1) {
                        if (jsscope !== "none" || jmode === "minify") {
                            meta.push("");
                        }
                        ctype = types[a];
                        ctoke = token[a];
                        if (ctype === "comment") {
                            if (ltoke === "=" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                                level[a - 1] = "s";
                            } else {
                                level[a - 1] = indent;
                            }
                            level.push(indent);
                        } else if (ctype === "comment-inline") {
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
                        } else if (ctype === "regex") {
                            level.push("x");
                        } else if (ctype === "literal") {
                            if (ctoke.indexOf("#!/") === 0) {
                                level.push(indent);
                            } else {
                                level.push("s");
                            }
                        } else if (ctype === "separator") {
                            separator();
                        } else if (ctype === "method") {
                            method();
                        } else if (ctype === "start") {
                            start();
                        } else if (ctype === "end") {
                            end();
                        } else if (ctype === "operator") {
                            operator();
                        } else if (ctype === "word") {
                            word();
                        } else if (ctype === "markup") {
                            if (ltoke === "return") {
                                level[a - 1] = "s";
                                level.push("x");
                            } else if (ltype === "start" || (token[a - 2] === "return" && ltype === "method")) {
                                level.push(indent);
                            } else {
                                level.push("x");
                            }
                            if (varline[varline.length - 1] === true) {
                                markupvar.push(a);
                            }
                        }
                        if (ctype !== "comment" && ctype !== "comment-inline") {
                            ltype = ctype;
                            ltoke = ctoke;
                        }
                    }
                }());
            }

            if (jtitanium === true) {
                token[0] = "";
                types[0] = "";
                lines[0] = 0;
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
                        output   = [],
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
                        rename   = function jspretty__minify_rename(x) {
                            var b        = 0,
                                len      = x.length,
                                array    = [],
                                inc      = function jspretty__minify_rename_inc() {
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
                                toLetter = function jspretty__minify_rename_toLetter() {
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
                        },
                        lastsemi = function jspretty__minify_lastsemi() {
                            var aa = 0,
                                bb = 0;
                            for (aa = a; aa > -1; aa -= 1) {
                                if (types[aa] === "end") {
                                    bb += 1;
                                } else if (types[aa] === "start" || types[aa] === "method") {
                                    bb -= 1;
                                }
                                if (bb < 0) {
                                    if (token[aa - 1] === "for") {
                                        build.push(";");
                                    }
                                    return;
                                }
                            }
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
                        if (types[a - 1] === "operator" && types[a] === "operator") {
                            build.push(" ");
                        }
                        if (types[a] === "markup" && typeof markupmin === "function") {
                            build.push(markupmin({
                                jsx   : true,
                                source: token[a]
                            }));
                        } else if (types[a] === "word" && (types[a + 1] === "word" || types[a + 1] === "literal" || token[a + 1] === "x{" || types[a + 1] === "comment" || types[a + 1] === "comment-inline")) {
                            build.push(token[a]);
                            build.push(" ");
                        } else if (types[a] === "comment" && comtest === false) {
                            build.push(token[a]);
                            build.push("\n");
                        } else if (token[a] === "x;" && token[a + 1] !== "}") {
                            build.push(";");
                        } else if (token[a] === ";" && token[a + 1] === "}") {
                            lastsemi();
                        } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && types[a] !== "comment" && types[a] !== "comment-inline") {
                            build.push(token[a]);
                        }
                    }
                    if (error.length > 0) {
                        output.push("<p id='jserror'><strong>Error: ");
                        output.push(error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, ""));
                        output.push("</strong> <code><span>");
                        error[1] = error[1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "").replace(/^(\s+)/, "");
                        if (error.indexOf("\n") > 0) {
                            output.push(error[1].replace("\n", "</span>"));
                        } else {
                            output.push(error[1]);
                            output.push("</span>");
                        }
                        output.push("</code></p>");
                        summary = output.join("");
                    }
                    return build.join("");
                }());
            } else {
                //the result function generates the output
                if (jsscope !== "none") {
                    result = (function jspretty__resultScope() {
                        var a           = 0,
                            b           = token.length,
                            build       = [],
                            linecount   = 2,
                            last        = "",
                            scope       = 1,
                            buildlen    = 0,
                            commentfix  = (function jspretty__resultScope_commentfix() {
                                var aa = 1,
                                    bb = 1;
                                if (types[0] !== "comment" || (token[0].indexOf("//") === 0 && lines[0] > 0) || types[1] !== "comment") {
                                    return 1;
                                }
                                do {
                                    if (token[aa].indexOf("/*") === 0) {
                                        bb += 1;
                                    }
                                    aa += 1;
                                } while (types[aa] === "comment" && aa < b);
                                return bb;
                            }()),
                            folderItem  = [],
                            comfold     = -1,
                            data        = [
                                "<div class='beautify' data-prettydiff-ignore" + "='true'><ol class='count'>", "<li>", 1, "</li>"
                            ],
                            folder      = function jspretty__resultScope_folder() {
                                var datalen = (data.length - (commentfix * 3) > 0) ? data.length - (commentfix * 3) : 1,
                                    index   = a,
                                    start   = data[datalen + 1] || 1,
                                    assign  = true,
                                    kk      = index;
                                if (types[a] === "comment" && comfold === -1) {
                                    comfold = a;
                                } else if (types[a] !== "comment") {
                                    index = meta[a][0];
                                    do {
                                        kk -= 1;
                                    } while (token[kk] !== "function" && kk > -1);
                                    kk -= 1;
                                    if (token[kk] === "(" && types[kk] === "start") {
                                        do {
                                            kk -= 1;
                                        } while (kk > -1 && types[kk] === "start" && token[kk] === "(");
                                    }
                                    if (token[kk] === "=" || token[kk] === ":" || token[kk] === "," || (token[kk + 1] === "(" && types[kk + 1] === "start")) {
                                        assign = false;
                                    }
                                }
                                if (types[a] === "comment" && lines[a] === 2) {
                                    datalen -= 3;
                                    start   -= 1;
                                }
                                data[datalen]     = "<li class='fold' title='folds from line " + start + " to line xxx'>";
                                data[datalen + 1] = "- " + start;
                                folderItem.push([
                                    datalen, index, assign
                                ]);
                            },
                            foldclose   = function jspretty__resultScope_foldclose() {
                                var end = (function jspretty__resultScope_foldclose_end() {
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
                            blockline   = function jspretty__resultScope_blockline(x) {
                                var commentLines = x.split("\n"),
                                    hh           = 0,
                                    ii           = commentLines.length - 1;
                                if (lines[a] > 0) {
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
                            findvars    = function jspretty__resultScope_findvars(x) {
                                var metax         = meta[x],
                                    metameta      = meta[metax][0],
                                    lettest       = meta[metax][1],
                                    ee            = 0,
                                    ff            = 0,
                                    hh            = metameta.length,
                                    adjustment    = 1,
                                    functionBlock = true,
                                    varbuild      = [],
                                    varbuildlen   = 0,
                                    letcomma      = function jspretty__resultScope_letcomma() {
                                        var aa = 0,
                                            bb = 0;
                                        for (aa = a; aa > -1; aa -= 1) {
                                            if (types[aa] === "end") {
                                                bb -= 1;
                                            }
                                            if (types[aa] === "start" || types[aa] === "method") {
                                                bb += 1;
                                            }
                                            if (bb > 0) {
                                                return;
                                            }
                                            if (bb === 0) {
                                                if (token[aa] === "var" || token[aa] === ";" || token[aa] === "x;") {
                                                    return;
                                                }
                                                if (token[aa] === "let") {
                                                    metameta.splice(ff, 1);
                                                    token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                }
                                            }
                                        }
                                    };
                                if (types[a - 1] === "word" && token[a - 1] !== "function" && lettest === false) {
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
                                    ee = metax - 1;
                                    if (lettest === true) {
                                        ee -= 1;
                                    }
                                    for (ee; ee > a; ee -= 1) {
                                        if (types[ee] === "word") {
                                            varbuild = token[ee].split(" ");
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
                                                        if (lettest === true) {
                                                            if (token[ee - 1] === "let") {
                                                                metameta.splice(ff, 1);
                                                                token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                            } else if (token[ee - 1] === ",") {
                                                                letcomma();
                                                            } else {
                                                                token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                            }
                                                        } else {
                                                            token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                                        }
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
                                    ee = a + 1;
                                    if (lettest === true) {
                                        ee -= 1;
                                    }
                                    for (ee; ee < metax; ee += 1) {
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
                            indent      = jlevel,
                            tab         = (function jspretty__resultScope_tab() {
                                var aa = jchar,
                                    bb = jsize,
                                    cc = [];
                                for (bb; bb > 0; bb -= 1) {
                                    cc.push(aa);
                                }
                                return cc.join("");
                            }()),
                            lscope      = [
                                "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                            ],
                            nl          = function jspretty__resultScope_nl(x, linetest) {
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
                                                if (scope === x + 1 && x > 0 && linetest !== true) {
                                                    dd -= 1;
                                                }
                                                build.push(lscope[dd - 1]);
                                            }
                                        } else if (linetest === true) {
                                            build.push(lscope[0]);
                                        }
                                    }
                                } else {
                                    if (x > 0) {
                                        dd = scope;
                                        if (scope > 0) {
                                            if (scope === x + 1 && x > 0 && linetest !== true) {
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
                            rl          = function jspretty__resultScope_rl(x) {
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
                            },
                            markupBuild = function jspretty__resultScope_markupBuild() {
                                var mindent  = (function jspretty__resultScope_markupBuild_offset() {
                                        var d = 0;
                                        if (a === markupvar[0]) {
                                            markupvar.splice(0, 1);
                                            return 1;
                                        }
                                        if (token[d] === "return" || token[0] === "{") {
                                            return 1;
                                        }
                                        if (level[a] === "x" || level[a] === "s") {
                                            return 0;
                                        }
                                        for (d = a - 1; d > -1; d -= 1) {
                                            if (token[d] !== "(") {
                                                if (token[d] === "=") {
                                                    return 1;
                                                }
                                                return 0;
                                            }
                                        }
                                        return 0;
                                    }()),
                                    markup   = (function jspretty__resultScope_markupBuild_varscope() {
                                        var item    = markup_beauty({
                                                inchar : jchar,
                                                inlevel: mindent,
                                                insize : jsize,
                                                jsscope: true,
                                                jsx    : true,
                                                source : token[a]
                                            }).replace(/return\s+</g, "return <"),
                                            emscope = function jsscope__resultScope_markupBuild_varscope_emscope(x) {
                                                return "<em class='s" + x.replace("[pdjsxem", "").replace("]", "") + "'>";
                                            },
                                            word    = "",
                                            newword = "",
                                            inca    = 0,
                                            incb    = 0,
                                            lena    = meta.length,
                                            lenb    = 0,
                                            vars    = [];
                                        if (item.indexOf("[pdjsxscope]") < 0) {
                                            return item.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").split("\n");
                                        }
                                        do {
                                            newword = "";
                                            vars    = [];
                                            word    = item.substring(item.indexOf("[pdjsxscope]") + 12, item.indexOf("[/pdjsxscope]"));
                                            for (inca = 0; inca < lena; inca += 1) {
                                                if (typeof meta[inca] === "number" && inca < a && a < meta[inca]) {
                                                    vars.push(meta[inca]);
                                                    lenb = meta[meta[inca]].length;
                                                    for (incb = 0; incb < lenb; incb += 1) {
                                                        if (meta[meta[inca]][incb] === word) {
                                                            newword = "[pdjsxem" + (vars.length + 1) + "]" + word + "[/pdjsxem]";
                                                        }
                                                    }
                                                    if (incb < lenb) {
                                                        break;
                                                    }
                                                    vars.pop();
                                                }
                                            }
                                            if (newword === "") {
                                                lenb = globals.length;
                                                for (incb = 0; incb < lenb; incb += 1) {
                                                    if (word === globals[incb]) {
                                                        newword = "[pdjsxem0]" + word + "[/pdjsxem]";
                                                    }
                                                }
                                                if (newword === "") {
                                                    newword = word;
                                                }
                                            }
                                            item = item.replace("[pdjsxscope]" + word + "[/pdjsxscope]", newword);
                                        } while (item.indexOf("[pdjsxscope]") > -1);
                                        return item.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\[pdjsxem\d+\]/g, emscope).replace(/\[\/pdjsxem\]/g, "</em>").split("\n");
                                    }()),
                                    len      = 0,
                                    c        = 0,
                                    spaces   = 0,
                                    synthtab = "\\" + tab.charAt(0),
                                    tabreg   = {};
                                len = tab.length;
                                for (c = 1; c < len; c += 1) {
                                    synthtab = synthtab + "\\" + tab.charAt(c);
                                }
                                tabreg  = new RegExp("^(" + synthtab + "+)");
                                mindent = indent + 2;
                                if (level[a] === "x" || level[a] === "s") {
                                    markup[0] = markup[0].replace(tabreg, "");
                                    mindent   -= 1;
                                }
                                len = markup.length;
                                for (c = 0; c < len - 1; c += 1) {
                                    if (markup[c].indexOf(tab) !== 0 && c > 0) {
                                        spaces = markup[c - 1].split(tab).length - 1;
                                        do {
                                            spaces    -= 1;
                                            markup[c] = tab + markup[c];
                                        } while (spaces > 0);
                                    }
                                    build.push(markup[c]);
                                    nl(mindent - 1);
                                }
                                build.push(markup[markup.length - 1]);
                            },
                            multiline   = function (x) {
                                var temparray = x.split("\n"),
                                    c         = 0,
                                    d         = temparray.length;
                                build.push(temparray[0]);
                                for (c = 1; c < d; c += 1) {
                                    nl(indent);
                                    build.push(temparray[c]);
                                }
                            };
                        if (jvertical === true) {
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
                                            xlen    += 1;
                                            do {
                                                x    -= 2;
                                                xlen += token[x].length + 1;
                                            } while (x > 1 && token[x - 1] === ".");
                                            if (token[x] === ")" || token[x] === "]") {
                                                x       += 1;
                                                xlen    -= 2;
                                                mixTest = true;
                                                ending();
                                            }
                                        };
                                        ending = function jspretty__resultScope_varSpaces_joins_ending() {
                                            var yy = 0;
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
                                        } else if (token[x] === ")" || token[x] === "]") {
                                            ending();
                                            if (perTest === false) {
                                                xlen += 1;
                                            }
                                        } else {
                                            xlen += 1;
                                        }
                                        if (token[x - 1] === "," && token[varlist[aa][cc] + 1] !== ":" && token[varlist[aa][0] - 1] !== "var" && token[varlist[aa][0] - 1] !== "let") {
                                            xlen += jsize;
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
                            if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || lines[a] === 2)) {
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
                                    if (token[a] === "let") {
                                        buildlen = build.length - 1;
                                        do {
                                            buildlen -= 1;
                                        } while (buildlen > 0 && build[buildlen].indexOf("</li><li") < 0);
                                        if (scope > 1) {
                                            build[buildlen]     = build[buildlen].replace(/class\='l\d+'/, "class='l" + scope + "'");
                                            build[buildlen + 1] = build[buildlen + 1] + "<em class='l" + (scope - 1) + "'>" + tab + "</em>";
                                            if (build[buildlen + 2] === tab) {
                                                build.splice(buildlen + 2, 1);
                                            }
                                        }
                                    }
                                } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                                    build.push(token[a]);
                                    scope    -= 1;
                                    buildlen = build.length - 1;
                                    do {
                                        buildlen -= 1;
                                    } while (buildlen > 0 && build[buildlen].indexOf("</li><li") < 0);
                                    build[buildlen] = build[buildlen].replace(/class\='l\d+'/, "class='l" + scope + "'");
                                } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}") {
                                    if (types[a] === "markup") {
                                        if (level[a] !== "x" && level[a] !== "s") {
                                            if (types[a - 1] === "operator") {
                                                nl(indent);
                                            } else if (token[a - 1] !== "return") {
                                                nl(indent + 1);
                                            }
                                        }
                                        if (typeof markup_beauty === "function") {
                                            markupBuild();
                                        } else {
                                            build.push(token[a].replace(/\n(\s*)/g, " "));
                                        }
                                    } else if (types[a] === "comment") {
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
                                            if ((/^(<em>&#xA;<\/em><\/li><li class='l\d+'>)$/).test(build[buildlen - 1]) === true) {
                                                build[buildlen - 1] = build[buildlen - 1].replace(/class\='l\d+'/, "class='c0'");
                                            }
                                            build[buildlen] = build[buildlen].replace(/class\='l\d+'/, "class='c0'");
                                        }
                                        build.push(token[a]);
                                    } else {
                                        if (types[a] === "literal" && token[a].indexOf("\n") > 0) {
                                            multiline(token[a]);
                                        } else {
                                            build.push(token[a]);
                                        }
                                    }
                                }
                            }
                            if (jpres === true && lines[a] > 0 && level[a] !== "x" && level[a] !== "s" && token[a] !== "+") {
                                if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                    if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                        nl(level[a]);
                                        build.push(tab);
                                        level[a] = "x";
                                    } else {
                                        indent = level[a];
                                        if (lines[a] === 2) {
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
                                } else if (lines[a] === 2 && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                    if ((token[a] !== "x}" || isNaN(level[a]) === true) && (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && types[a + 1] !== "separator")))) {
                                        data.push("<li>");
                                        data.push(linecount);
                                        data.push("</li>");
                                        linecount += 1;
                                        if (types[a] === "comment") {
                                            build.push("<em>&#xA;</em></li><li class='c0'>");
                                        } else {
                                            commentfix += 1;
                                            nl(level[a], true);
                                        }
                                    }
                                }
                            }
                            if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && ((/<em class='s\d+'>\}<\/em>/).test(token[a + 2]) === true || token[a + 2] === "x}")) {
                                rl(indent);
                            } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                                build.push("");
                            } else if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                                nl(jlevel);
                            } else if (level[a] === "s" && token[a] !== "x}") {
                                build.push(" ");
                            } else if (token[a] !== "" && level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || lines[a] === 2)) {
                                indent = level[a];
                                nl(indent);
                            }
                            if (folderItem.length > 0) {
                                if (a === folderItem[folderItem.length - 1][1] && comfold === -1) {
                                    foldclose();
                                }
                            }
                        }
                        for (a = build.length - 1; a > -1; a -= 1) {
                            if (build[a] === tab) {
                                build.pop();
                            } else {
                                break;
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
                        if (jsscope === "html") {
                            data.push(last);
                            return data.join("");
                        }
                        build   = [
                            "<p>Scope analysis does not provide support for undeclared variables.</p>", "<p><em>", scolon, "</em> instances of <strong>missing semicolons</strong> counted.</p>", "<p><em>", news, "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>", data.join(""), last
                        ];
                        summary = build.join("");
                        data    = [];
                        build   = [];
                        return "";
                    }()).replace(/(\s+)$/, "").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "");
                } else {
                    result = (function jspretty__result() {
                        var a           = 0,
                            b           = token.length,
                            build       = [],
                            indent      = jlevel,
                            tab         = (function jspretty__result_tab() {
                                var aa = jchar,
                                    bb = jsize,
                                    cc = [];
                                for (bb; bb > 0; bb -= 1) {
                                    cc.push(aa);
                                }
                                return cc.join("");
                            }()),
                            nl          = function jspretty__result_nl(x) {
                                var dd = 0;
                                build.push("\n");
                                for (dd = 0; dd < x; dd += 1) {
                                    build.push(tab);
                                }
                            },
                            rl          = function jspretty__result_rl(x) {
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
                            },
                            markupBuild = function jspretty__result_markupBuild() {
                                var mindent  = (function jspretty__result_markupBuild_offset() {
                                        var d = 0;
                                        if (a === markupvar[0]) {
                                            markupvar.splice(0, 1);
                                            return 1;
                                        }
                                        if (token[d] === "return" || token[0] === "{") {
                                            return 1;
                                        }
                                        if (level[a] === "x" || level[a] === "s") {
                                            return 0;
                                        }
                                        for (d = a - 1; d > -1; d -= 1) {
                                            if (token[d] !== "(") {
                                                if (token[d] === "=") {
                                                    return 1;
                                                }
                                                return 0;
                                            }
                                        }
                                        return 0;
                                    }()),
                                    markup   = markup_beauty({
                                        inchar : jchar,
                                        inlevel: mindent,
                                        insize : jsize,
                                        jsscope: args.jsscope,
                                        jsx    : true,
                                        source : token[a]
                                    }).replace(/return\s+</g, "return <").split("\n"),
                                    len      = 0,
                                    c        = 0,
                                    spaces   = 0,
                                    synthtab = "\\" + tab.charAt(0),
                                    tabreg   = {};
                                len = tab.length;
                                for (c = 1; c < len; c += 1) {
                                    synthtab = synthtab + "\\" + tab.charAt(c);
                                }
                                tabreg  = new RegExp("^(" + synthtab + "+)");
                                mindent = indent + 2;
                                if (level[a] === "x" || level[a] === "s") {
                                    markup[0] = markup[0].replace(tabreg, "");
                                    mindent   -= 1;
                                }
                                len = markup.length;
                                for (c = 0; c < len - 1; c += 1) {
                                    if (markup[c].indexOf(tab) !== 0 && c > 0) {
                                        spaces = markup[c - 1].split(tab).length - 1;
                                        do {
                                            spaces    -= 1;
                                            markup[c] = tab + markup[c];
                                        } while (spaces > 0);
                                    }
                                    build.push(markup[c]);
                                    nl(mindent - 1);
                                }
                                build.push(markup[markup.length - 1]);
                            };
                        if (jvertical === true) {
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
                                            xlen    += 1;
                                            do {
                                                x    -= 2;
                                                xlen += token[x].length + 1;
                                            } while (x > 1 && token[x - 1] === ".");
                                            if (token[x] === ")" || token[x] === "]") {
                                                x       += 1;
                                                xlen    -= 2;
                                                mixTest = true;
                                                ending();
                                            }
                                        };
                                        ending = function jspretty__result_varSpaces_joins_ending() {
                                            var yy = 0;
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
                                        } else if (token[x] === ")" || token[x] === "]") {
                                            ending();
                                            if (perTest === false) {
                                                xlen += 1;
                                            }
                                        } else {
                                            xlen += 1;
                                        }
                                        if (token[x - 1] === "," && token[varlist[aa][cc] + 1] !== ":" && token[varlist[aa][0] - 1] !== "var" && token[varlist[aa][0] - 1] !== "let") {
                                            xlen += jsize;
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
                                if (types[a] === "markup") {
                                    if (level[a] !== "x" && level[a] !== "s") {
                                        if (types[a - 1] === "operator") {
                                            nl(indent);
                                        } else if (token[a - 1] !== "return") {
                                            nl(indent + 1);
                                        }
                                    }
                                    if (typeof markup_beauty === "function") {
                                        markupBuild();
                                    } else {
                                        build.push(token[a].replace(/\n(\s*)/g, " "));
                                    }
                                } else {
                                    build.push(token[a]);
                                }
                                if (token[a].indexOf("//") === 0 && types[a + 1] === "operator") {
                                    nl(indent);
                                    build.push(tab);
                                }
                            }
                            if (jpres === true && lines[a] > 0 && level[a] !== "x" && level[a] !== "s" && token[a] !== "+") {
                                if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                    if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                        nl(level[a]);
                                        build.push(tab);
                                        level[a] = "x";
                                    } else {
                                        indent = level[a];
                                        if (lines[a] === 2) {
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
                                } else if (lines[a] === 2 && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                    if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && types[a + 1] !== "separator"))) {
                                        if (token[a] !== "x}" || isNaN(level[a]) === true || level[a] === "x") {
                                            build.push("\n");
                                        }
                                    }
                                }
                            }
                            if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && (token[a + 2] === "}" || token[a + 2] === "x}")) {
                                rl(indent);
                            } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                                build.push("");
                            } else if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                                nl(jlevel);
                            } else if (level[a] === "s" && token[a] !== "x}") {
                                build.push(" ");
                            } else if (token[a] !== "" && level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || lines[a] === 2)) {
                                indent = level[a];
                                nl(indent);
                            }
                        }
                        for (a = build.length - 1; a > -1; a -= 1) {
                            if (build[a] === tab) {
                                build.pop();
                            } else {
                                break;
                            }
                        }
                        if (jpres === true && lines[lines.length - 1] > 0) {
                            return build.join("").replace(/(\s+)$/, "\n");
                        }
                        return build.join("").replace(/(\s+)$/, "");
                    }());
                }
                if (summary !== "diff" && jsscope !== "report") {
                    stats.space.space -= 1;
                    //the analysis report is generated in this function
                    (function jspretty__report() {
                        var originalSize = jsource.length - 1,
                            noOfLines    = result.split("\n").length,
                            newlines     = stats.space.newline,
                            total        = {
                                chars  : 0,
                                comment: {
                                    chars: stats.commentBlock.chars + stats.commentLine.chars,
                                    token: stats.commentBlock.token + stats.commentLine.token
                                },
                                literal: {
                                    chars: stats.number.chars + stats.regex.chars + stats.string.chars,
                                    token: stats.number.token + stats.regex.token + stats.string.token
                                },
                                space  : stats.space.newline + stats.space.other + stats.space.space + stats.space.tab,
                                syntax : {
                                    chars: 0,
                                    token: stats.string.quote + stats.comma + stats.semicolon + stats.container
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
                        output.push("<div class='doc'>");
                        if (error.length > 0) {
                            output.push("<p id='jserror'><strong>Error: ");
                            output.push(error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, ""));
                            output.push("</strong> <code><span>");
                            error[1] = error[1].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "").replace(/^(\s+)/, "");
                            if (error.indexOf("\n") > 0) {
                                output.push(error[1].replace("\n", "</span>"));
                            } else {
                                output.push(error[1]);
                                output.push("</span>");
                            }
                            output.push("</code></p>");
                        }
                        output.push("<p><em>");
                        output.push(scolon);
                        output.push("</em> instance");
                        if (scolon !== 1) {
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
                        output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>" +
                            "JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>" +
                            "Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>");
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
                        output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScr" +
                            "ipt component analysis</caption><thead><tr><th>JavaScript Component</th><th>Comp" +
                            "onent Quantity</th><th>Percentage Quantity from Section</th>");
                        output.push("<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage L" +
                            "ength from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
                        output.push("<tr><th>Total Accounted</th><td>");
                        output.push(total.token);
                        output.push("</td><td>100.00%</td><td>100.00%</td><td>");
                        output.push(total.chars);
                        output.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></tr>" +
                            "<tr><th>Block Comments</th><td>");
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
                        output.push("</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></t" +
                            "r><tr><th>New Lines</th><td>");
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
                        output.push("</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Character" +
                            "s</th><td>");
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
        };

        //Library to minify markup (HTML/XML)
        markupmin     = function markupmin(args) {
            var i             = 0,
                x             = (typeof args.source === "string") ? args.source.split("") : [
                    "E", "r", "r", "o", "r", ":", " ", "n", "o", " ", "c", "o", "n", "t", "e", "n", "t", " ", "s", "u", "p", "p", "l", "i", "e", "d", " ", "t", "o", " ", "m", "a", "r", "k", "u", "p", "."
                ],
                id            = [],
                comments      = (args.comments !== "comments" && args.comments !== "beautify" && args.comments !== "nocomment") ? "" : args.comments,
                correct       = (args.correct === true || args.correct === "true") ? true : false,
                inchar        = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                insize        = (isNaN(args.insize) === false && Number(args.insize) >= 0) ? Number(args.insize) : 4,
                minjsscope    = (args.jsscope !== "html" && args.jsscope !== "report") ? "none" : args.jsscope,
                minjsx        = (args.jsx === true || args.jsx === "true") ? true : false,
                obfuscate     = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
                objsort       = (args.objsort === true || args.objsort === "true") ? true : false,
                presume_html  = (args.presume_html === true || args.presume_html === "true") ? true : false,
                quoteConvert  = (args.quoteConvert === "single" || args.quoteConvert === "double") ? args.quoteConvert : "none",
                styleguide    = (typeof args.styleguide === "string") ? args.styleguide : "none",
                top_comments  = (args.top_comments === true || args.top_comments === "true") ? true : false,
                wrap          = (isNaN(args.wrap) === false) ? Number(args.wrap) : 0,
                conditional   = (presume_html === true || args.conditional === true || args.conditional === "true") ? true : false,
                preserve      = function markupmin__preserve(start, endTag) {
                    var a     = 0,
                        end   = x.length,
                        store = [],
                        count = 0;
                    for (a = i; a < end; a += 1) {
                        store.push(x[a]);
                        x[a] = "";
                        if (start !== "" && store.slice(store.length - start.length).join("") === start) {
                            count += 1;
                        }
                        if (store.slice(store.length - endTag.length).join("") === endTag) {
                            count -= 1;
                            if (count < 1) {
                                break;
                            }
                        }
                    }
                    x[i] = store.join("");
                    i    = a;
                },
                jsxItem       = function markupmin__jsxItem(index, space) {
                    var a      = 0,
                        end    = x.length,
                        count  = 0,
                        store  = [],
                        tabReg = (function markupmin__jsxItem_tabReg() {
                            var b     = 0,
                                tabby = [];
                            for (b = 0; b < insize; b += 1) {
                                tabby.push("\\");
                                tabby.push(inchar);
                            }
                            return new RegExp("^(\\s*\\{+\\s*" + tabby.join("") + "+)");
                        }());
                    if (space === undefined) {
                        space = "";
                    }
                    for (a = index; a < end; a += 1) {
                        store.push(x[a]);
                        if (x[a] === "{") {
                            count += 1;
                        }
                        if (x[a] === "}") {
                            count -= 1;
                            if (count === 0) {
                                x[a] = "";
                                break;
                            }
                        }
                        x[a] = "";
                    }
                    if (store[0] + store[1] === "{{" && store[store.length - 2] + store[store.length - 1] === "}}") {
                        x[a] = store.join("");
                        return a;
                    }
                    x[a] = space + jspretty({
                        inchar : inchar,
                        insize : insize,
                        jsscope: minjsscope,
                        jsx    : true,
                        mode   : (comments === "beautify") ? "beautify" : "minify",
                        source : store.join("")
                    }).replace(tabReg, "{").replace(/(\s*\}\s*)$/, "}");
                    if (x[a] === "{};" || x[a] === "{}") {
                        x[a] = "";
                    }
                    return a;
                },
                markupspace   = function markupmin__markupspace() {
                    var a          = 0,
                        b          = -1,
                        store      = [],
                        end        = x.length,
                        item       = "",
                        jsxtest    = "",
                        attrs      = "",
                        ignore     = false,
                        attributes = function markupmin_markupspace_attribute(tag) {
                            var aa          = 0,
                                attribute   = [],
                                comment     = [],
                                tagLength   = 0,
                                starter     = "",
                                openchar    = "",
                                spaceAfter  = tag.indexOf(" ") + 1,
                                attribIndex = 0,
                                nameSpace   = "",
                                counter     = 0,
                                ending      = (tag.charAt(tag.length - 2) === "/") ? "/>" : ">",
                                space       = (tag.charAt(0) === " ") ? " " : "",
                                qConvert    = function markupmin__markupspace_attribute_qConvert(item) {
                                    var dub   = (quoteConvert === "double") ? true : false,
                                        qchar = (dub === true) ? "\"" : "'",
                                        eq    = item.indexOf("="),
                                        name  = item.slice(0, eq + 1);
                                    item = item.slice(eq + 2, item.length - 1);
                                    if (name.toLowerCase() === "script=" || name.toLowerCase() === "style") {
                                        if (dub === true) {
                                            item = item.replace(/"/g, "'");
                                        } else {
                                            item = item.replace(/'/g, "\"");
                                        }
                                    } else if (dub === true) {
                                        item = item.replace(/"/g, "&#x22;");
                                    } else {
                                        item = item.replace(/'/g, "&#x27;");
                                    }
                                    return name + qchar + item.split(qchar).join("\\" + qchar) + qchar;
                                },
                                sortfunc    = function markup_beauty__algorithm_loop_attributeOrder_sortfunc(aaa, bbb) {
                                    if (aaa > bbb) {
                                        return 1;
                                    }
                                    return 0;
                                },
                                pusher      = function markup_beauty__algorithm_loop_attributeOrder_pusher(attr) {
                                    var last = (attribute.length > 0) ? attribute[attribute.length - 1] : "";
                                    if (attr.indexOf("data-prettydiff-ignore" + "=") === 0) {
                                        ignore = true;
                                        return;
                                    }
                                    if (attr.indexOf("id=") === 0 || attr.indexOf("ID=") === 0) {
                                        id.push(attr.slice(4, attr.length - 1));
                                    }
                                    if ((quoteConvert === "single" && attr.charAt(attr.length - 1) === "\"") || (quoteConvert === "double" && attr.charAt(attr.length - 1) === "'")) {
                                        attr = qConvert(attr);
                                    }
                                    if ((attr.charAt(0) === "=" && last.indexOf("=") < 0) || (last.charAt(last.length - 1) === "=" && (attr.charAt(0) === "\"" || attr.charAt(0) === "'" || attr.indexOf("=") < 0))) {
                                        attribute[attribute.length - 1] = last + attr;
                                    } else if (attr !== undefined && (/^(\s+)$/).test(attr) === false && attr !== "") {
                                        attribute.push(attr);
                                    }
                                    openchar    = "";
                                    attribIndex = aa + 1;
                                },
                                joinchar    = (tag.length > wrap && wrap > 0 && comments === "beautify" && minjsx === false) ? "\n" : " ";
                            if (space === " ") {
                                tag        = tag.substr(1);
                                spaceAfter = tag.indexOf(" ") + 1;
                            }
                            nameSpace = tag.substring(0, spaceAfter - 1);
                            tagLength = tag.length;
                            tag       = tag.substring(spaceAfter, tagLength - ending.length) + " ";
                            for (aa = 0; aa < tagLength; aa += 1) {
                                if (starter === "") {
                                    if (tag.charAt(aa - 1) === "=" && openchar === "" && counter === 0) {
                                        openchar = tag.charAt(aa);
                                    }
                                    if (tag.charAt(aa) === "\"") {
                                        starter = "\"";
                                    } else if (tag.charAt(aa) === "'") {
                                        starter = "'";
                                    } else if (tag.charAt(aa) === "[") {
                                        starter = "[";
                                        counter = 1;
                                    } else if (tag.charAt(aa) === "{") {
                                        starter = "{";
                                        counter = 1;
                                    } else if (tag.charAt(aa) === "(") {
                                        starter = "(";
                                        counter = 1;
                                    } else if (tag.charAt(aa) === "<" && tag.charAt(aa + 1) === "%") {
                                        starter     = "<%";
                                        counter     = 1;
                                        attribIndex = aa;
                                    } else if ((tag.charAt(aa) === " " || (minjsx === true && tag.charAt(aa) === "\n")) && counter === 0) {
                                        if (tag.charAt(attribIndex) === "\n") {
                                            attribIndex += 1;
                                        }
                                        pusher(tag.substring(attribIndex, aa));
                                        if (ignore === true) {
                                            return;
                                        }
                                    } else if (minjsx === true && tag.charAt(aa) === "/" && (tag.charAt(aa + 1) === "*" || tag.charAt(aa + 1) === "/")) {
                                        if (tag.charAt(aa + 1) === "*") {
                                            starter = "/*";
                                        } else {
                                            starter = "//";
                                        }
                                        attribIndex = aa;
                                    }
                                } else if (starter === "\"" && tag.charAt(aa) === "\"") {
                                    starter = "";
                                } else if (starter === "'" && tag.charAt(aa) === "'") {
                                    starter = "";
                                } else if (starter === "[") {
                                    if (tag.charAt(aa) === "]") {
                                        counter -= 1;
                                        if (counter === 0) {
                                            starter = "";
                                        }
                                    } else if (tag.charAt(aa) === "[") {
                                        counter += 1;
                                    }
                                } else if (starter === "{") {
                                    if (tag.charAt(aa) === "}") {
                                        counter -= 1;
                                        if (counter === 0) {
                                            starter = "";
                                        }
                                        if (openchar === "{" && counter === 0) {
                                            pusher(tag.substring(attribIndex, aa + 1));
                                            if (ignore === true) {
                                                return;
                                            }
                                        }
                                    } else if (tag.charAt(aa) === "{") {
                                        counter += 1;
                                    }
                                } else if (starter === "(") {
                                    if (tag.charAt(aa) === ")") {
                                        counter -= 1;
                                        if (counter === 0) {
                                            starter = "";
                                        }
                                    } else if (tag.charAt(aa) === "(") {
                                        counter += 1;
                                    }
                                } else if (starter === "<%") {
                                    if (tag.charAt(aa) === ">" && tag.charAt(aa - 1) === "%") {
                                        counter -= 1;
                                        if (counter === 0) {
                                            starter = "";
                                        }
                                    } else if (tag.charAt(aa) === "<" && tag.charAt(aa + 1) === "%") {
                                        counter += 1;
                                    }
                                } else if (minjsx === true && starter === "/*" && tag.charAt(aa - 1) === "*" && tag.charAt(aa) === "/") {
                                    starter = "";
                                    comment.push(tag.substring(attribIndex, aa + 1));
                                    aa          += 1;
                                    attribIndex = aa;
                                } else if (minjsx === true && starter === "//" && tag.charAt(aa) === "\n") {
                                    starter = "";
                                    comment.push(tag.substring(attribIndex, aa));
                                    attribIndex = aa;
                                }
                            }
                            tagLength = id.length;
                            attribute.sort(sortfunc);
                            if (minjsx === true) {
                                if (comment.length > 0) {
                                    return space + nameSpace + "\n" + comment.join("\n") + attribute.join(" ").replace(/\n \n?\//g, "\n/") + ending;
                                }
                                return space + nameSpace + " " + attribute.join(" ").replace(/\n \n?\//g, "\n/") + ending;
                            }
                            return space + nameSpace + joinchar + attribute.join(joinchar) + ending;
                        };
                    for (a = i; a < end; a += 1) {
                        if (minjsx === true) {
                            if (x[a - 1] === "/" && jsxtest === "") {
                                if (x[a] === "*") {
                                    if (comments === "beautify") {
                                        if (store[store.length - 3].indexOf("\n") < 0 && store[store.length - 2].indexOf("\n") < 0) {
                                            store[store.length - 1] = "\n/";
                                        } else if (store[store.length - 2] === " ") {
                                            store[store.length - 2] = "";
                                        }
                                    }
                                    jsxtest = "*\/";
                                }
                                if (x[a] === "/") {
                                    if (comments === "beautify") {
                                        if (store[store.length - 3].indexOf("\n") < 0 && store[store.length - 2].indexOf("\n") < 0) {
                                            store[store.length - 1] = "\n/";
                                        } else if (store[store.length - 2] === " ") {
                                            store[store.length - 2] = "";
                                        }
                                    }
                                    jsxtest = "\n";
                                }
                            }
                            if (jsxtest === "" && x[a] === "{" && typeof jspretty === "function") {
                                jsxtest = x[a - 1];
                                a = jsxItem(a, "");
                                if (x[a + 1] !== ">" && x[a + 1] !== jsxtest) {
                                    x[a] = x[a] + " ";
                                }
                                jsxtest = "";
                            }
                        }
                        if ((jsxtest === "*\/" && x[a - 2] + x[a - 1] === "*\/") || (jsxtest === "\n" && x[a - 1] === "\n")) {
                            if (x[a - 2] === "*" && comments === "beautify") {
                                store[store.length - 1] = "/\n";
                            }
                            if (comments !== "beautify") {
                                store.pop();
                                if (store[store.length - 1] === " " && x[a] === " ") {
                                    store.pop();
                                }
                            }
                            jsxtest = "";
                        }
                        if (jsxtest === "") {
                            if ((/\s/).test(x[a]) === true && x[a].length === 1) {
                                if ((/\s/).test(x[a - 1]) === true) {
                                    do {
                                        a        += 1;
                                        x[a - 1] = "";
                                    } while ((/\s/).test(x[a]) === true && x[a].length === 1 && a < end);
                                } else {
                                    x[a] = " ";
                                }
                            }
                            if ((x[a] === " " && store.length > 0 && store[store.length - 1].indexOf("\n") < 0) || x[a] !== " ") {
                                store.push(x[a]);
                            }
                            if (x[a] === ">") {
                                b = a + 1;
                                break;
                            }
                        } else if (comments === "beautify") {
                            store.push(x[a]);
                        }
                    }
                    if (b < 0) {
                        b = x.length;
                    }
                    x[i] = store.join("");
                    if (x[i].charAt(1) !== "/" && x[i].charAt(1) !== "!" && x[i].indexOf(" ") > 0 && x[i].indexOf("<%") !== 0 && x[i].indexOf("<?") !== 0 && x[i].indexOf("<!--#")) {
                        attrs = attributes(x[i]);
                        if (ignore === false) {
                            x[i] = attrs;
                        }
                    }
                    if (ignore === true) {
                        item = x[i].substring(1, x[i].indexOf(" "));
                        x[i] = x[i].charAt(0);
                        preserve("", "</" + item + ">");
                        return;
                    }
                    for (a = i + 1; a < b; a += 1) {
                        x[a] = "";
                    }
                    i = b - 1;
                    if (minjsx === true && x[i + 1] === "{") {
                        i = jsxItem(i, "");
                    }
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
                        } while ((/\s/).test(x[i]) === true && i < end);
                    }
                },
                markupscript  = function markupmin__markupscript(type) {
                    var a           = 0,
                        store       = [],
                        endIndex    = 0,
                        script      = "",
                        endTag      = "",
                        endTagBuild = "</" + type,
                        noEnd       = false,
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
                    if (endIndex === 0) {
                        endIndex = end;
                        noEnd    = true;
                    }
                    for (a = i; a < endIndex; a += 1) {
                        if (x[a - 1] !== ">") {
                            store.push(x[a]);
                            x[a] = "";
                        } else {
                            break;
                        }
                    }
                    if (store.length > 0) {
                        stoken = store[0];
                        store.splice(0, 1);
                        if ((/\s/).test(store[0])) {
                            store.splice(0, 1);
                        }
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
                        if (comments === "" && (store[store.length - 1] !== ">" || (type === "script" && store[store.length - 3] === "]" && store[store.length - 2] === "]" && store[store.length - 1] === ">"))) {
                            if (type === "style") {
                                if (typeof csspretty !== "function") {
                                    x[i] = cdataS + script + cdataE;
                                    return;
                                }
                                script = cdataS + csspretty({
                                    mode   : "minify",
                                    objsort: objsort,
                                    source : script,
                                    topcoms: top_comments
                                }) + cdataE;
                            } else {
                                if (typeof jspretty !== "function") {
                                    x[i] = cdataS + script + cdataE;
                                    return;
                                }
                                script = cdataS + jspretty({
                                    correct     : correct,
                                    mode        : "minify",
                                    obfuscate   : obfuscate,
                                    quoteConvert: quoteConvert,
                                    source      : script,
                                    styleguide  : styleguide,
                                    topcoms     : top_comments
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
                    if (noEnd === true) {
                        x[i] = stoken + script.replace(/(>\s+)$/, ">");
                    } else {
                        x[i] = stoken + script.replace(/(>\s+)$/, ">") + endTag;
                    }
                },
                content       = function markupmin__content() {
                    var a       = 0,
                        end     = x.length,
                        store   = [],
                        comment = "",
                        jsxtest = (minjsx === true) ? true : false;
                    if (x[i] === "\n") {
                        x[i] = " ";
                        if (minjsx === true && x[i + 1] === "/") {
                            if (x[i + 2] === "/") {
                                comment = "//";
                            } else if (x[i + 2] === "*") {
                                comment = "/*";
                            }
                        }
                    } else if (minjsx === true && x[i] === "/") {
                        if (x[i + 1] === "/") {
                            comment = "//";
                        } else if (x[i + 1] === "*") {
                            comment = "/*";
                        }
                    }
                    for (a = i; a < end; a += 1) {
                        if (x[a] === "<") {
                            break;
                        }
                        if (jsxtest === true && (/\s/).test(x[a]) === false) {
                            if (x[a] === "{" && typeof jspretty === "function") {
                                i = jsxItem(a, " ");
                                return;
                            }
                            jsxtest = false;
                        }
                        store.push(x[a]);
                        x[a] = "";
                        if (comment !== "" && ((store[store.length - 2] === "*" && store[store.length - 1] === "/" && comment === "/*") || (store[store.length - 1] === "\n" && comment === "//"))) {
                            break;
                        }
                    }
                    i    = a - 1;
                    x[i] = store.join("");
                    if (comment === "") {
                        x[i] = x[i].replace(/\s+/g, " ");
                    }
                };
            (function markupmin__algorithm() {
                var a      = 0,
                    store  = [],
                    end    = x.length,
                    part   = "",
                    source = args.source;
                for (i = 0; i < end; i += 1) {
                    if ((source.slice(i, i + 7)).toLowerCase() === "<script") {
                        store = [];
                        for (a = i + 8; a < end; a += 1) {
                            if (source.charAt(a) === ">") {
                                break;
                            }
                            store.push(source.charAt(a));
                        }
                        part = store.join("").toLowerCase().replace(/"/g, "'");
                        if (comments !== "beautify" && comments !== "nocomment") {
                            markupspace();
                        }
                        if (part.indexOf("type='syntaxhighlighter'") > -1) {
                            preserve("", "</script>");
                        }
                        if (part.indexOf("type='") < 0 || part.indexOf("type='text/javascript'") > -1 || part.indexOf("type='application/javascript'") > -1 || part.indexOf("type='application/x-javascript'") > -1 || part.indexOf("type='text/ecmascript'") > -1 || part.indexOf("type='application/ecmascript'") > -1 || part.indexOf("type='text/cjs'") > -1) {
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
                        part = store.join("").toLowerCase().replace(/"/g, "'");
                        if (comments !== "beautify" && comments !== "nocomment") {
                            markupspace();
                        }
                        if (part.indexOf("type='") < 0 || part.indexOf("type='text/css'") > -1) {
                            markupscript("style");
                        }
                    } else if (minjsx === true && x[i] === "{" && typeof jspretty === "function") {
                        i = jsxItem(i, " ");
                    } else if ((conditional === true || (presume_html === true && comments === "beautify")) && source.slice(i, i + 8) === "<!--[if " && source.slice(i, i + 10) !== "<!--[if !") {
                        markupcomment("<![endif]-->");
                    } else if (source.slice(i, i + 4) === "<!--" && x[i + 4] !== "#") {
                        markupcomment("-->");
                    } else if (source.slice(i, i + 4) === "<%--") {
                        markupcomment("--%>");
                    } else if (source.slice(i, i + 5) === "<?php") {
                        preserve("<?php", "?>");
                    } else if (source.slice(i, i + 4).toLowerCase() === "<pre" && presume_html === true) {
                        preserve("<pre", "</pre>");
                    } else if (source.slice(i, i + 2) === "<%") {
                        preserve("<%", "%>");
                    } else if (source.slice(i, i + 2) === "[%") {
                        preserve("[%", "%]");
                    } else if (source.slice(i, i + 2) === "{@") {
                        preserve("{@", "@}");
                    } else if (x[i] === "<" && (source.slice(i, i + 4) !== "<!--" || source.slice(i, i + 5) === "<!--#")) {
                        markupspace();
                    } else if (x[i] === undefined) {
                        x[i] = "";
                    } else if (x[i - 1] !== undefined) {
                        content();
                    }
                }
            }());
            if (minjsx === true) {
                return (function markupmin__jsxOutput() {
                    var a       = 0,
                        b       = x.length,
                        output  = [],
                        newline = false;
                    for (a = 0; a < b; a += 1) {
                        if (x[a] !== "") {
                            if (x[a] === "\n") {
                                newline = true;
                            } else if (output[output.length - 1] === " " && x[a] !== " ") {
                                output[output.length - 1] = " " + x[a];
                            } else if (x[a] !== " " || (x[a] === " " && output[output.length - 1] !== " ")) {
                                if (newline === true && x[a].charAt(0) !== " ") {
                                    x[a] = " " + x[a];
                                }
                                newline = false;
                                output.push(x[a]);
                            }
                        }
                    }
                    if (comments === "beautify") {
                        return output.join("pdjsxSep").replace(/(\s*)$/, "");
                    }
                    return output.join("").replace(/(\s*)$/, "");
                }());
            }
            if (id.length > 0) {
                (function markupmin_idNormalize() {
                    var a          = 0,
                        len        = id.length,
                        value      = "",
                        duplicates = [];
                    id.sort();
                    for (a = 0; a < len; a += 1) {
                        if (id[a] === id[a + 1] && id[a] !== value) {
                            duplicates.push(id[a]);
                        }
                        value = id[a];
                    }
                    if (duplicates.length > 0) {
                        summary = duplicates.join(", ");
                    }
                }());
            }
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
                    test = (/^(\s+)$/).test(build[a]);
                    if (test === false || (test === true && (/^(\s+)$/).test(build[a + 1]) === false)) {
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
                if (minjsx === true && comments === "beautify") {
                    output = x.join("");
                } else {
                    output = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/<(\s*)/g, "<").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">");
                    if (comments === "") {
                        output = output.replace(/<%\s+/g, "<%").replace(/\s+%>/g, "%>").replace(/\[%\s+/g, "[%").replace(/\s+%\]/g, "%]").replace(/\{@\s+/g, "{@").replace(/\s+@\}/g, "@}");
                    }
                }
                if ((/\s/).test(output.charAt(0)) === true) {
                    output = output.slice(1, output.length);
                }
                return output;
            }());
        };

        //Library to parse/beautify markup (HTML/XML)
        markup_beauty = function markup_beauty(args) {
            var token           = [],
                build           = [],
                cinfo           = [],
                level           = [],
                inner           = [],
                sum             = [],
                id              = "",
                x               = (typeof args.source === "string") ? args.source : "",
                mbraceline      = (args.braceline === true || args.braceline === "true") ? true : false,
                mbracepadding   = (args.bracepadding === true || args.bracepadding === "true") ? true : false,
                mbraces         = (args.braces === "allman") ? "allman" : "knr",
                mchar           = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
                mcomm           = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : ((args.comments === "nocomment") ? "nocomment" : "indent"),
                mcont           = (args.content === "true" || args.content === true) ? true : false,
                mcorrect        = (args.correct === true || args.correct === "true") ? true : false,
                mcssinsertlines = (args.cssinsertlines === true || args.cssinsertlines === "true") ? true : false,
                mforce          = (args.force_indent === "true" || args.force_indent === true) ? true : false,
                mhtml           = (args.html === "true" || args.html === true) ? true : false,
                minlevel        = (isNaN(args.inlevel) === true) ? 0 : Number(args.inlevel),
                mjsscope        = (args.jsscope !== "html" && args.jsscope !== "report") ? "none" : args.jsscope,
                mjsx            = (args.jsx === true || args.jsx === "true") ? true : false,
                mmode           = (args.mode === "parse" || args.mode === "diff") ? args.mode : "beautify",
                mobjsort        = (args.objsort === "true" || args.objsort === true) ? true : false,
                mpreserve       = (args.preserve === false || args.preserve === "false") ? false : true,
                mquoteConvert   = (args.quoteConvert === "single" || args.quoteConvert === "double") ? args.quoteConvert : "none",
                msize           = (isNaN(args.insize) === true) ? 4 : Number(args.insize),
                mspace          = (args.space === false || args.space === "false") ? false : true,
                mstyle          = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
                mstyleguide     = (typeof args.styleguide === "string") ? args.styleguide : "none",
                mwrap           = (isNaN(args.wrap) === true) ? 0 : Number(args.wrap),
                mvarword        = (args.varword === "each" || args.varword === "list") ? args.varword : "none",
                mvertical       = (args.vertical === "jsonly") ? "jsonly" : ((args.vertical === true || args.vertical === "true") ? true : false);
            if (mmode === "diff") {
                mcomm = "nocomment";
            }
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
                        output          = [],
                        tagname         = "",
                        nestcount       = 0;
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
                        } else if (x.substr(a, a + 24) === " data-prettydiff-ignore" + "=") {
                            for (b = a; b > -1; b -= 1) {
                                if (x.charAt(b) === "<") {
                                    for (c = b + 1; c < a + 1; c += 1) {
                                        if ((/\s/).test(x.charAt(c)) === true) {
                                            tagname = x.slice(b + 1, c);
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            for (b = a + 1; b < end; b += 1) {
                                if (x.substr(b, tagname.length + 1) === "<" + tagname) {
                                    nestcount += 1;
                                }
                                if (x.substr(b, tagname.length + 3) === "</" + tagname + ">") {
                                    nestcount -= 1;
                                    if (nestcount < 0) {
                                        if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 6)) === true) {
                                            tagCount += 2;
                                        } else {
                                            tagCount += 3;
                                        }
                                        a = b + tagname.length + 3;
                                        break;
                                    }
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
                        } else if (x.charAt(a) === "{" && x.charAt(a + 1) === "{") {
                            if (x.charAt(a + 2) === "{") {
                                for (b = a + 2; b < end; b += 1) {
                                    if (x.charAt(b - 2) === "}" && x.charAt(b - 1) === "}" && x.charAt(b) === "}") {
                                        a        = b;
                                        tagCount += 1;
                                        break;
                                    }
                                }
                            } else {
                                for (b = a + 2; b < end; b += 1) {
                                    if (x.charAt(b - 1) === "}" && x.charAt(b) === "}") {
                                        a        = b;
                                        tagCount += 1;
                                        break;
                                    }
                                }
                            }
                        } else if (x.charAt(a) === "[" && x.charAt(a + 1) === "%") {
                            for (b = a + 2; b < end; b += 1) {
                                if (x.charAt(b - 1) === "%" && x.charAt(b) === "]") {
                                    a        = b;
                                    tagCount += 1;
                                    break;
                                }
                            }
                        } else if (x.charAt(a) === "{" && x.charAt(a + 1) === "@") {
                            for (b = a + 2; b < end; b += 1) {
                                if (x.charAt(b - 1) === "@" && x.charAt(b) === "}") {
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
                                        for (c = b + 2; c < end; c += 1) {
                                            if (x.charAt(c - 1) === "%" && x.charAt(c) === ">") {
                                                b = c;
                                                break;
                                            }
                                        }
                                    } else if (x.charAt(b) === "{" && x.charAt(b + 1) === "{") {
                                        if (x.charAt(b + 2) === "{") {
                                            for (c = b + 2; c < end; c += 1) {
                                                if (x.charAt(c - 2) === "}" && x.charAt(c - 1) === "}" && x.charAt(c) === "}") {
                                                    b = c;
                                                    break;
                                                }
                                            }
                                        } else {
                                            for (c = b + 2; c < end; c += 1) {
                                                if (x.charAt(c - 1) === "}" && x.charAt(c) === "}") {
                                                    b = c;
                                                    break;
                                                }
                                            }
                                        }
                                    } else if (x.charAt(b) === "[" && x.charAt(b + 1) === "%") {
                                        for (c = b + 2; c < end; c += 1) {
                                            if (x.charAt(c - 1) === "%" && x.charAt(c) === "]") {
                                                b = c;
                                                break;
                                            }
                                        }
                                    } else if (x.charAt(b) === "{" && x.charAt(b + 1) === "@") {
                                        for (c = b + 2; c < end; c += 1) {
                                            if (x.charAt(c - 1) === "@" && x.charAt(c) === "}") {
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
            if (mjsx === true) {
                (function markup_beauty__createJSXBuild() {
                    var i   = 0,
                        y   = markupmin({
                            comments    : (mmode === "beautify" && mcomm !== "nocomment") ? "beautify" : "nocomment",
                            conditional : (mhtml === true) ? true : false,
                            inchar      : mchar,
                            insize      : msize,
                            jsscope     : mjsscope,
                            jsx         : true,
                            presume_html: false,
                            quoteConvert: mquoteConvert,
                            source      : x
                        }).split("pdjsxSep"),
                        end = y.length;
                    if (summary !== "" && summary !== "diff") {
                        id = summary;
                    }
                    for (i = 0; i < end; i += 1) {
                        build.push(y[i]);
                        if (y[i].slice(0, 4) === "<!--" || y[i].slice(0, 5) === " <!--") {
                            token.push("T_comment");
                        } else if (y[i].charAt(0) === "<" || (y[i].charAt(0) === " " && y[i].charAt(1) === "<")) {
                            if (y[i].charAt(y[i].length - 2) === "/") {
                                token.push("T_singleton");
                            } else if ((y[i].charAt(0) === " " && y[i].charAt(2) === "/") || (y[i].charAt(0) === "<" && y[i].charAt(1) === "/")) {
                                token.push("T_tag_end");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i].charAt(0) === "{" || (y[i].charAt(0) === " " && y[i].charAt(1) === "{")) {
                            token.push("T_script");
                        } else if (y[i].charAt(0) === "/" || (y[i].charAt(0) === " " && y[i].charAt(1) === "/")) {
                            token.push("T_script");
                        } else {
                            token.push("T_content");
                        }
                    }
                }());
            } else {
                (function markup_beauty__createBuild() {
                    var i          = 0,
                        inc        = 0,
                        scriptflag = 0,
                        triplet    = "",
                        space      = false,
                        y          = markupmin({
                            comments    : (mmode === "beautify" && mcomm !== "nocomment") ? "beautify" : "nocomment",
                            conditional : (mhtml === true) ? true : false,
                            jsx         : false,
                            presume_html: mhtml,
                            quoteConvert: mquoteConvert,
                            source      : x,
                            wrap        : mwrap
                        }).split(""),
                        last       = "",
                        li         = [],
                        builder    = function markup_beauty__createBuild_endFinder(ending) {
                            var a          = 0,
                                b          = 0,
                                c          = 0,
                                buildLen   = 0,
                                part       = [],
                                endLen     = ending.length,
                                endParse   = ending.split("").reverse(),
                                start      = (endLen === 1) ? (i + endLen + 1) : (i + endLen),
                                spacestart = "",
                                name       = "",
                                braceCount = 0,
                                ename      = "",
                                previous   = "",
                                loop       = y.length,
                                quote      = "",
                                ignore     = function markup_beauty__createBuild_endFinder_ignore() {
                                    var tag      = "",
                                        d        = i + 1,
                                        tagcount = 0,
                                        tagname  = (function markup_beauty__createBuild_endFinder_ignore_tagname() {
                                            var tempname = [],
                                                f        = 0,
                                                partlen  = part.length;
                                            for (f = 1; f < partlen; f += 1) {
                                                if (part[f] === " ") {
                                                    return tempname.join("");
                                                }
                                                tempname.push(part[f]);
                                            }
                                        }());
                                    for (i += 1; i < loop; i += 1) {
                                        part.push(y[i]);
                                        if (y[i] === ">" && y[i - 1] === "/") {
                                            tagcount -= 1;
                                        }
                                        if (y[i - tagname.length - 2] === "<") {
                                            tag = y.slice(i - tagname.length - 2, i + 1).join("");
                                            if (tag === "</" + tagname + ">") {
                                                tagcount -= 1;
                                            }
                                        }
                                        if (y[i - tagname.length - 1] === "<") {
                                            tag = y.slice(i - tagname.length - 1, i + 1).join("");
                                            if (i > d && (tag === "<" + tagname + ">" || tag === "<" + tagname + " ")) {
                                                tagcount += 1;
                                            }
                                        }
                                        if (tagcount < 0) {
                                            return part.join("");
                                        }
                                    }
                                    return part.join("");
                                };
                            if (i > 0 && y[i - 1] === " ") {
                                spacestart = " ";
                            }
                            for (i; i < loop; i += 1) {
                                part.push(y[i]);
                                if (y[i] === " " && y[i + 22] === "e" && y.slice(i, i + 24).join("") === " data-prettydiff-ignore" + "=") {
                                    return ignore();
                                }
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
                                    if (y[i] === "\"" && ending !== "-->" && ending !== "]]>") {
                                        quote = "\"";
                                    } else if (y[i] === "'" && ending !== "-->" && ending !== "]]>") {
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
                                                if (mhtml === true && li[li.length - 1] === true && (part[3] === ">" || part[3] === " " || part[3] === "l" || part[3] === "L")) {
                                                    name = part.slice(1, 5).join("").toLowerCase();
                                                    if (name.slice(0, 2) === "li") {
                                                        name = name.slice(0, 4);
                                                    }
                                                    buildLen = build.length - 1;
                                                    b        = buildLen;
                                                    if (b > -1) {
                                                        if (token[b] === "T_asp" || token[b] === "T_php" || token[b] === "T_ssi" || token[b] === "T_sgml" || token[b] === "T_xml" || token[b] === "T_comment" || token[b] === "T_ignore") {
                                                            do {
                                                                b -= 1;
                                                            } while (b > 0 && (token[b] === "T_asp" || token[b] === "T_php" || token[b] === "T_ssi" || token[b] === "T_sgml" || token[b] === "T_xml" || token[b] === "T_comment" || token[b] === "T_ignore"));
                                                        }
                                                        previous = build[b].toLowerCase();
                                                        ename    = previous.substr(1);
                                                        if (ename.charAt(0) === "<") {
                                                            ename = ename.substr(1);
                                                        }
                                                        if (((name === "li " || name === "li>") && (ename === "/ul>" || ename === "/ol>" || (ename !== "/li>" && ename !== "ul>" && ename !== "ol>" && ename.indexOf("ul ") !== 0 && ename.indexOf("ol ") !== 0))) || (((name === "/ul>" && previous.indexOf("<ul") < 0) || (name === "/ol>" && previous.indexOf("<ol") < 0)) && ename !== "/li>")) {
                                                            if (mcorrect === true) {
                                                                build.push("</li>");
                                                            } else {
                                                                build.push("</prettydiffli>");
                                                            }
                                                            token.push("T_tag_end");
                                                            li[li.length - 1] = false;
                                                            buildLen          += 1;
                                                            for (c = inner.length - 1; c > -1; c -= 1) {
                                                                if (inner[c][2] < buildLen) {
                                                                    break;
                                                                }
                                                                inner[c][2] += 1;
                                                            }
                                                        }
                                                    }
                                                }
                                                return spacestart + part.join("");
                                            }
                                            if (i > start) {
                                                for (a = 0; a < endLen; a += 1) {
                                                    if (endParse[a] !== part[part.length - (a + 1)]) {
                                                        break;
                                                    }
                                                }
                                                if (a === endLen) {
                                                    return spacestart + part.join("");
                                                }
                                            }
                                        }
                                    }
                                } else if (y[i] === quote) {
                                    quote = "";
                                }
                            }
                            return spacestart + part.join("");
                        },
                        cgather    = function markup_beauty__createBuild_buildContent(type) {
                            var a       = 0,
                                b       = 0,
                                output  = [],
                                comment = "",
                                slashes = function markup_beauty__createBuild_buildContent_slashes(index) {
                                    var slashy = index;
                                    do {
                                        slashy -= 1;
                                    } while (y[slashy] === "\\" && slashy > 0);
                                    if ((index - slashy) % 2 === 1) {
                                        return true;
                                    }
                                    return false;
                                },
                                endd    = y.length;
                            for (a = i; a < endd; a += 1) {
                                if (comment === "" && (y[a - 1] !== "\\" || (a > 2 && y[a - 2] === "\\"))) {
                                    if (y[a] === "/" && y[a + 1] && y[a + 1] === "/") {
                                        comment = "//";
                                    } else if (y[a] === "/" && y[a + 1] && y[a + 1] === "*") {
                                        comment = "/*";
                                    } else if (y[a] === "\"" || y[a] === "'" || (y[a] === "/" && y[a - 1] !== "<")) {
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
                                } else if ((y[a - 1] !== "\\" || slashes(a - 1) === false) && ((comment === "\"" && y[a] === "\"") || (comment === "'" && y[a] === "'") || (comment === "/" && y[a] === "/") || (comment === "//" && (y[a] === "\n" || (y[a - 4] && y[a - 4] === "/" && y[a - 3] === "/" && y[a - 2] === "-" && y[a - 1] === "-" && y[a] === ">"))) || (comment === ("/*") && y[a - 1] === "*" && y[a] === "/"))) {
                                    comment = "";
                                }
                                if (a < endd - 2 && ((type === "script" && comment === "") || type === "style") && y[a] === "<" && y[a + 1] === "/" && y[a + 2].toLowerCase() === "s") {
                                    if (type === "script" && a < endd - 7 && (y[a + 3].toLowerCase() === "c" && y[a + 4].toLowerCase() === "r" && y[a + 5].toLowerCase() === "i" && y[a + 6].toLowerCase() === "p" && y[a + 7].toLowerCase() === "t")) {
                                        break;
                                    }
                                    if (type === "style" && a < endd - 6 && (y[a + 3].toLowerCase() === "t" && y[a + 4].toLowerCase() === "y" && y[a + 5].toLowerCase() === "l" && y[a + 6].toLowerCase() === "e")) {
                                        break;
                                    }
                                } else if (type === "other" && (y[a] === "<" || (y[a] === "[" && y[a + 1] === "%") || (y[a] === "{" && y[a + 1] === "@"))) {
                                    break;
                                }
                                output.push(y[a]);
                            }
                            i       = a - 1;
                            comment = output.join("");
                            if (mcont === true) {
                                if (comment.charAt(0) === " " && comment.charAt(comment.length - 1) === " ") {
                                    comment = " text ";
                                } else if (comment.charAt(0) === " ") {
                                    comment = " text";
                                } else if (comment.charAt(comment.length - 1) === " ") {
                                    comment = "text ";
                                } else {
                                    comment = "text";
                                }
                            }
                            return comment;
                        },
                        end        = y.length,
                        scripttest = function markup_beauty__createBuild_scripttest(item) {
                            if (item === undefined) {
                                return false;
                            }
                            if (item.indexOf(" type='") === -1 || item.indexOf(" type='text/javascript'") > -1 || item.indexOf(" type='application/javascript'") > -1 || item.indexOf(" type='application/x-javascript'") > -1 || item.indexOf(" type='text/ecmascript'") > -1 || item.indexOf(" type='application/ecmascript'") > -1 || item.indexOf(" type='text/cjs'") > -1 || item.indexOf(" type='text/jsx'") > -1) {
                                return true;
                            }
                            return false;
                        },
                        styletest  = function markup_beauty__createBuild_styletest(item) {
                            if (item === undefined) {
                                return false;
                            }
                            if (item.indexOf(" type='") === -1 || item.indexOf(" type='text/css'") !== -1) {
                                return true;
                            }
                            return false;
                        };
                    if (summary !== "" && summary !== "diff") {
                        id = summary;
                    }
                    for (i = 0; i < end; i += 1) {
                        if (build.length > 0) {
                            last = build[build.length - 1].toLowerCase().replace(/"/g, "'");
                        }
                        if (token[token.length - 1] === "T_script" && scripttest(last) === true && (i > end - 8 || y.slice(i, i + 8).join("").toLowerCase() !== "</script")) {
                            build.push(cgather("script"));
                            if ((/^(\s+)$/).test(last) === true) {
                                build.pop();
                            } else {
                                token.push("T_content");
                            }
                        } else if (token[token.length - 1] === "T_style" && styletest(last) === true && (i > end - 7 || y.slice(i, i + 7).join("").toLowerCase() !== "</style")) {
                            build.push(cgather("style"));
                            if ((/^(\s+)$/).test(last) === true) {
                                build.pop();
                            } else {
                                token.push("T_content");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "!") {
                            if (y[i + 2] === "-" && y[i + 3] === "-") {
                                if (mhtml === true && y[i + 4] === "[" && y[i + 5] === "i" && y[i + 6] === "f" && y[i + 7] === " " && y[i + 8] !== "!") {
                                    if (y[i - 1] === " ") {
                                        space = true;
                                    }
                                    build.push(builder("]-->"));
                                    if (space === false) {
                                        build[build.length - 1] = " " + build[build.length - 1];
                                    } else {
                                        space = false;
                                    }
                                    token.push("T_comment");
                                } else if (y[i + 4] !== "#" && token[token.length - 1] !== "T_style") {
                                    build.push(builder("-->"));
                                    token.push("T_comment");
                                } else if (y[i + 4] === "#") {
                                    build.push(builder("-->"));
                                    token.push("T_ssi");
                                } else {
                                    build.push(builder(">"));
                                    token.push("T_tag_start");
                                }
                            } else if (y[i + 2] === "[" && y[i + 3] === "C" && y[i + 4] === "D" && y[i + 5] === "A" && y[i + 6] === "T" && y[i + 7] === "A" && y[i + 8] === "[") {
                                build.push(builder("]]>"));
                                token.push("T_xml");
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
                        } else if ((y[i] === "{" && y[i + 1] === "{" && y[i + 2] === "{") || (y[i] === " " && y[i + 1] === "{" && y[i + 2] === "{" && y[i + 3] === "{")) {
                            build.push(builder("}}}", i + 1));
                            token.push("T_asp");
                        } else if ((y[i] === "{" && y[i + 1] === "{") || (y[i] === " " && y[i + 1] === "{" && y[i + 2] === "{")) {
                            build.push(builder("}}", i + 1));
                            token.push("T_asp");
                        } else if ((y[i] === "{" && y[i + 1] === "%") || (y[i] === " " && y[i + 1] === "{" && y[i + 2] === "%")) {
                            build.push(builder("%}", i + 1));
                            token.push("T_asp");
                        } else if ((y[i] === "[" && y[i + 1] === "%") || (y[i] === " " && y[i + 1] === "[" && y[i + 2] === "%")) {
                            build.push(builder("%]", i + 1));
                            token.push("T_asp");
                        } else if ((y[i] === "{" && y[i + 1] === "@") || (y[i] === " " && y[i + 1] === "{" && y[i + 2] === "@")) {
                            build.push(builder("@}", i + 1));
                            token.push("T_asp");
                        } else if ((y[i] === "{" && y[i + 1] === "#") || (y[i] === " " && y[i + 1] === "{" && y[i + 2] === "#")) {
                            build.push(builder("#}", i + 1));
                            token.push("T_asp");
                        } else if (y[i] === "<" && y[i + 1] === "?" && i < end - 4) {
                            if (y[i + 2].toLowerCase() === "x" && y[i + 3].toLowerCase() === "m" && y[i + 4].toLowerCase() === "l") {
                                token.push("T_xml");
                            } else {
                                token.push("T_php");
                            }
                            build.push(builder("?>"));
                        } else if (mhtml === true && y[i] === "<" && i < end - 3 && y[i + 1].toLowerCase() === "p" && y[i + 2].toLowerCase() === "r" && y[i + 3].toLowerCase() === "e") {
                            build.push(builder("</pre>"));
                            token.push("T_ignore");
                        } else if (y[i] === "<" && i < end - 6 && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "c" && y[i + 3].toLowerCase() === "r" && y[i + 4].toLowerCase() === "i" && y[i + 5].toLowerCase() === "p" && y[i + 6].toLowerCase() === "t") {
                            scriptflag = i;
                            build.push(builder(">"));
                            if (last.indexOf(" type='syntaxhighlighter'") !== -1) {
                                i                       = scriptflag;
                                build[build.length - 1] = builder("</script>");
                                token.push("T_ignore");
                            } else if (last.charAt(last.length - 2) === "/") {
                                token.push("T_singleton");
                            } else if (last.indexOf(" data-prettydiff-ignore" + "=") > 0) {
                                token.push("T_ignore");
                            } else if (scripttest(build[build.length - 1]) === true) {
                                token.push("T_script");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && i < end - 5 && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "t" && y[i + 3].toLowerCase() === "y" && y[i + 4].toLowerCase() === "l" && y[i + 5].toLowerCase() === "e") {
                            build.push(builder(">"));
                            if (styletest(build[build.length - 1]) === true) {
                                token.push("T_style");
                            } else {
                                token.push("T_tag_start");
                            }
                        } else if (y[i] === "<" && y[i + 1] === "/") {
                            build.push(builder(">"));
                            token.push("T_tag_end");
                            if (last === " </ul>" || last === "</ul>" || last === " </ol>" || last === "</ol>") {
                                li.pop();
                            }
                            if (last.indexOf("</li") > -1 && li.length > 0) {
                                li[li.length - 1] = false;
                            }
                        } else if (y[i] === "<" && (y[i + 1] !== "!" || y[i + 1] !== "?" || y[i + 1] !== "/" || y[i + 1] !== "%")) {
                            for (inc = i; inc < end; inc += 1) {
                                if (y[inc] !== "?" && y[inc] !== "%") {
                                    if (y[inc] === "/" && y[inc + 1] === ">") {
                                        build.push(builder("/>"));
                                        token.push("T_singleton");
                                        break;
                                    }
                                    if (y[inc + 1] === ">") {
                                        build.push(builder(">"));
                                        last = build[build.length - 1];
                                        if (last.indexOf("<li") > -1 && last.length > 0) {
                                            li[li.length - 1] = true;
                                        }
                                        if (last === " <ul>" || last === "<ul>" || last === " <ul " || last === "<ul " || last === " </ol>" || last === "</ol>" || last === " </ol " || last === "</ol ") {
                                            li.push(false);
                                        }
                                        if (last.indexOf(" data-prettydiff-ignore" + "=") > 0) {
                                            token.push("T_ignore");
                                        } else {
                                            token.push("T_tag_start");
                                        }
                                        break;
                                    }
                                }
                            }
                        } else if ((y[i - 1] === ">" || i === 0 || token[token.length - 1] === "T_asp") && (y[i] !== "<" || (y[i] !== " " && y[i + 1] !== "<"))) {
                            triplet = y[i - 1] + y[i] + y[i + 1];
                            if (token[token.length - 1] === "T_script") {
                                build.push(cgather("script"));
                                if ((/^(\s+)$/).test(last) === true) {
                                    build.pop();
                                } else {
                                    token.push("T_content");
                                }
                            } else if (token[token.length - 1] === "T_style") {
                                build.push(cgather("style"));
                                if ((/^(\s+)$/).test(last) === true) {
                                    build.pop();
                                } else {
                                    token.push("T_content");
                                }
                            } else if (triplet !== "> <" && (token[token.length - 1] !== "T_asp" || (triplet !== "} <" && triplet !== "] <"))) {
                                last = cgather("other");
                                build.push(last);
                                last = last.replace(" ", "");
                                if (last.indexOf("{{#") === 0) {
                                    token.push("T_tag_start");
                                } else if (last.indexOf("{{/") === 0) {
                                    token.push("T_tag_end");
                                } else {
                                    token.push("T_content");
                                }
                            }
                        }
                    }
                }());
            }
            (function markup_beauty__createCinfo() {
                var i   = 0,
                    end = token.length;
                for (i = 0; i < end; i += 1) {
                    if (token[i] === "T_sgml" || token[i] === "T_xml") {
                        cinfo.push("parse");
                    } else if (token[i] === "T_asp") {
                        if ((/^( ?\{\{\/)/).test(build[i]) === true || (/^( ?<(%)\s*\})/).test(build[i]) === true || (/^( ?\[(%)\s*\})/).test(build[i]) === true || (/^( ?\{(@)\s*\})/).test(build[i]) === true) {
                            cinfo.push("end");
                        } else if ((/^( ?\{\{#)/).test(build[i]) === true || (/(\{\s*%>)$/).test(build[i]) === true || (/(\{\s*%\])$/).test(build[i]) === true || (/(\{\s*@\})$/).test(build[i]) === true) {
                            cinfo.push("start");
                        } else {
                            cinfo.push("singleton");
                        }
                    } else if (token[i] === "T_php" || token[i] === "T_ssi" || token[i] === "T_ignore") {
                        cinfo.push("singleton");
                    } else if (token[i] === "T_comment") {
                        cinfo.push("comment");
                    } else if (mjsx === true && token[i] === "T_script") {
                        cinfo.push("external");
                    } else if (token[i] === "T_content") {
                        if ((build[i] !== " " && token[i - 1] === "T_script") || token[i - 1] === "T_style") {
                            cinfo.push("external");
                        } else if (build[i].charAt(0) === " " && build[i].charAt(build[i].length - 1) === " ") {
                            cinfo.push("mixed_both");
                        } else if (build[i].charAt(0) === " " && build[i].charAt(build[i].length - 1) !== " ") {
                            cinfo.push("mixed_start");
                        } else if (build[i].charAt(0) !== " " && build[i].charAt(build[i].length - 1) === " ") {
                            cinfo.push("mixed_end");
                        } else {
                            cinfo.push("content");
                        }
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
                    firstSpace = 1,
                    indexSpace = 0,
                    tag        = "",
                    end        = cinfo.length,
                    next       = "";
                if (mhtml === false) {
                    return;
                }
                for (i = 0; i < end; i += 1) {
                    if (cinfo[i] === "start") {
                        firstSpace = 1;
                        if (build[i].charAt(0) === " ") {
                            firstSpace = 2;
                        }
                        if (build[i].indexOf("\n") > 0) {
                            indexSpace = build[i].indexOf("\n");
                        } else if (build[i].slice(1).indexOf(" ") > 0) {
                            indexSpace = build[i].slice(1).indexOf(" ") + 1;
                        } else {
                            indexSpace = -1;
                        }
                        if (build[i].length === 3) {
                            tag = build[i].charAt(1).toLowerCase();
                        } else if (indexSpace === -1) {
                            tag = build[i].slice(1, build[i].length - 1).toLowerCase();
                        } else {
                            tag = build[i].slice(firstSpace, indexSpace).toLowerCase();
                        }
                        if (cinfo[i + 1] === "end") {
                            next = (build[i + 1].charAt(0) === " ") ? build[i + 1].toLowerCase().substr(1) : build[i + 1].toLowerCase();
                        } else {
                            next = "";
                        }
                        if (next !== "</" + tag + ">") {
                            if (tag === "area" || tag === "base" || tag === "basefont" || tag === "br" || tag === "col" || tag === "embed" || tag === "eventsource" || tag === "frame" || tag === "hr" || tag === "img" || tag === "input" || tag === "keygen" || tag === "link" || tag === "meta" || tag === "param" || tag === "progress" || tag === "source" || tag === "wbr") {
                                cinfo[i] = "singleton";
                                token[i] = "T_singleton";
                            }
                            if (tag === "link" || tag === "meta") {
                                if (build[i].charAt(0) !== " ") {
                                    build[i] = " " + build[i];
                                }
                                if (i < end - 1 && build[i + 1].charAt(0) !== " ") {
                                    build[i + 1] = " " + build[i + 1];
                                }
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

            if (mmode === "parse") {
                summary = (function markup_beauty__parseSummary() {
                    var output = [],
                        plural = "",
                        a      = 0,
                        len    = cinfo.length,
                        start  = 0,
                        end    = 0;
                    for (a = 0; a < len; a += 1) {
                        if (token[a] === "T_tag_start" || token[a] === "T_script" || token[a] === "T_style") {
                            start += 1;
                        } else if (cinfo[a] === "end" && token[a] !== "T_asp") {
                            if (build[a] === "</prettydiffli>") {
                                build.splice(a, 1);
                                token.splice(a, 1);
                                cinfo.splice(a, 1);
                                len -= 1;
                                a   -= 1;
                            } else {
                                end += 1;
                            }
                        }
                    }
                    start = start - end;
                    if (start !== end && start !== 0) {
                        output.push("<p><strong>");
                        if (start > 0) {
                            if (start > 1) {
                                plural = "s";
                            }
                            output.push(start);
                            output.push(" more start tag");
                            output.push(plural);
                            output.push(" than end tag");
                            output.push(plural);
                            output.push("!");
                        } else {
                            start = start * -1;
                            if (start > 1) {
                                plural = "s";
                            }
                            output.push(start);
                            output.push(" more end tag");
                            output.push(plural);
                            output.push(" than start tag");
                            output.push(plural);
                            output.push("!");
                        }
                        output.push("</strong></p>");
                    }
                    if (summary.indexOf("jserror") > 0) {
                        output.push(summary.slice(summary.indexOf("<p "), summary.indexOf("</p>") + 4));
                    }
                    if (id.length > 0) {
                        output.push("<p><strong class='duplicate'>Duplicate id attribute values detected:</strong> " + id + "</p>");
                    }
                    return output.join("");
                }());
                return {
                    token: build,
                    typea: token,
                    typeb: cinfo
                };
            }

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
                                    return level.push(minlevel);
                                }
                                if (cinfo[i] === "mixed_start" || cinfo[i] === "content" || (cinfo[i] === "singleton" && build[i].charAt(0) !== " ")) {
                                    return level.push("x");
                                }
                                return level.push(minlevel + 1);
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
                                            if (cinfo[b] === "end" && cinfo[b - 1] === "start" && level[b - 1] !== "x" && counter > -1) {
                                                return level.push(level[b]);
                                            }
                                            if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_end" && (cinfo[i - 2] !== "end" || level[i - 2] !== "x") && (cinfo[i - 3] !== "end" || level[i - 3] !== "x")) {
                                                return level.push("x");
                                            }
                                            if (cinfo[b] !== "end") {
                                                return level.push(level[b] + (counter - 1));
                                            }
                                        }
                                    }
                                    counter = minlevel;
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
                        if (build[i].charAt(0) !== " " && (cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i - 1] === "comment" && (cinfo[i - 2] === "start" || (level[i - 1] === "x" && level[i - 2] === "x"))) || (cinfo[i - 1] === "external" && mjsx === true))) {
                            return level.push("x");
                        }
                        if (cinfo[i - 1] === "external") {
                            return (function markup_beauty__algorithm_end_external() {
                                var a       = 0,
                                    counter = -1;
                                if (i < 3) {
                                    return level.push(level[0]);
                                }
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
                            if (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content" || cinfo[i - 1] === "parse") {
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
                                return level.push(minlevel);
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
                                if (i - 1 === 0 && cinfo[0] === "start" && (build[i].charAt(0) === " " || (cinfo[i] !== "singleton" && cinfo[i] !== "parse"))) {
                                    return level.push(minlevel + 1);
                                }
                                if (cinfo[refA] === "mixed_start" || cinfo[refA] === "content" || cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || ((cinfo[i] === "singleton" || cinfo[i] === "parse") && (cinfo[i - 1] === "start" || cinfo[i - 1] === "singleton" || cinfo[i - 1] === "end") && build[i].charAt(0) !== " ")) {
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
                                        return level.push(minlevel);
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
                        if (token[i] === "T_script" && mjsx === true) {
                            if (build[i].charAt(0) === " ") {
                                level.push(level[level.length - 1] + 1);
                            } else {
                                level.push("x");
                            }
                            return;
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
                        cdata       = [],
                        cdata1      = [],
                        cdataStart  = (/^(\s*(\/)*<\!\[+[A-Z]+\[+)/),
                        cdataEnd    = (/((\/)*\]+>\s*)$/),
                        scriptStart = (/^(\s*<\!\-\-)/),
                        scriptEnd   = (/((\/\/)?\-\->\s*)$/),
                        loop        = cinfo.length;
                    for (i = 0; i < loop; i += 1) {
                        test   = false;
                        test1  = false;
                        cdata  = [""];
                        cdata1 = [""];
                        if (i === 0) {
                            level.push(minlevel);
                        } else if (cinfo[i] === "external" && mjsx === false) {
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
                                    level.push(minlevel);
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
                                        braceline   : mbraceline,
                                        bracepadding: mbracepadding,
                                        braces      : mbraces,
                                        comments    : mcomm,
                                        correct     : mcorrect,
                                        inchar      : mchar,
                                        inlevel     : level[i],
                                        insize      : msize,
                                        objsort     : mobjsort,
                                        preserve    : mpreserve,
                                        quoteConvert: mquoteConvert,
                                        source      : build[i],
                                        space       : mspace,
                                        styleguide  : mstyleguide,
                                        varword     : mvarword,
                                        vertical    : (mvertical === "jsonly" || mvertical === true || mvertical === "true") ? true : false
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
                                    sum.splice(i + 1, 0, "-->");
                                    cinfo.splice(i + 1, 0, "external");
                                    token.splice(i + 1, 0, "T_content");
                                    loop += 1;
                                } else if (cdata1[0] !== "") {
                                    level.push(level[i]);
                                    build.splice(i + 1, 0, cdata1[0]);
                                    sum.splice(i + 1, 0, cdata1[0]);
                                    cinfo.splice(i + 1, 0, "external");
                                    token.splice(i + 1, 0, "T_content");
                                    loop += 1;
                                }
                                build[i] = build[i].replace(/(\/\/(\s)+\-\->(\s)*)$/, "//-->").replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                            } else if (token[i - 1] === "T_style") {
                                level.push(minlevel);
                                if (scriptStart.test(build[i]) === true) {
                                    test     = true;
                                    build[i] = build[i].replace(scriptStart, "");
                                } else if (cdataStart.test(build[i]) === true) {
                                    cdata    = cdataStart.exec(build[i]);
                                    build[i] = build[i].replace(cdataStart, "");
                                }
                                if (scriptEnd.test(build[i]) === true && scriptEnd.test(build[i]) === false) {
                                    test1 = true;
                                    build[i].replace(scriptEnd, "");
                                } else if (cdataEnd.test(build[i]) === true) {
                                    cdata1   = cdataEnd.exec(build[i]);
                                    build[i] = build[i].replace(cdataEnd, "");
                                }
                                if (typeof csspretty === "function") {
                                    build[i] = csspretty({
                                        comm          : mcomm,
                                        cssinsertlines: mcssinsertlines,
                                        inchar        : mchar,
                                        insize        : msize,
                                        mode          : "beautify",
                                        objsort       : mobjsort,
                                        source        : build[i],
                                        vertical      : (mvertical === true || mvertical === "true") ? true : false
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
                        } else {
                            if (cinfo[i] === "comment" && mcomm !== "noindent") {
                                if (build[i].charAt(0) === " ") {
                                    startSafety();
                                } else {
                                    level.push("x");
                                }
                            } else if (cinfo[i] === "comment" && mcomm === "noindent") {
                                level.push(minlevel);
                            } else if (cinfo[i] === "content") {
                                level.push("x");
                            } else if (cinfo[i] === "parse") {
                                startSafety();
                            } else if (cinfo[i] === "mixed_both") {
                                startSafety();
                            } else if (cinfo[i] === "mixed_start") {
                                startSafety();
                            } else if (token[i] === "T_script" && mjsx === true) {
                                startSafety();
                            } else if (cinfo[i] === "mixed_end") {
                                build[i] = build[i].slice(0, build[i].length - 1);
                                level.push("x");
                            } else if (cinfo[i] === "start") {
                                startSafety();
                            } else if (cinfo[i] === "end") {
                                end();
                                if (token[i] === "T_asp" && ((/(\{\s*%>)$/).test(build[i]) === true || (/(\{\s*%\])$/).test(build[i]) === true || (/(\{\s*@\})$/).test(build[i]) === true)) {
                                    cinfo[i] = "start";
                                }
                            } else if (cinfo[i] === "singleton") {
                                startSafety();
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
                    text_wrap  = function markup_beauty__apply_wrap(input) {
                        var a                = 0,
                            itemLengthNative = 0,
                            start            = "",
                            smatch           = [],
                            item             = input.replace(/^(\s+)/, "").replace(/(\s+)$/, "").split(" "),
                            itemLength       = item.length - 1,
                            output           = [item[0]],
                            firstLen         = item[0].length,
                            attribute        = (item[0].indexOf("=") > 0) ? true : false,
                            xml              = (token[i] === "T_xml") ? true : false,
                            ind              = (function markup_beauty__apply_wrap_ind() {
                                var b       = 0,
                                    tabs    = [],
                                    levels  = level[i],
                                    counter = 0;
                                if ((attribute === true && level[i] !== "x") || xml === true) {
                                    if (xml === true) {
                                        smatch = input.match(/^(\s+)/);
                                        if (smatch !== null) {
                                            start = smatch[0];
                                        }
                                    }
                                    return indents + tab;
                                }
                                if ((attribute === true && level[i] === "x") || (cinfo[i - 1] === "end" && level[i - 1] === "x")) {
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
                            return [
                                input, 0
                            ];
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
                            if (a < itemLength - 1 && item[a].length + item[a + 1].length + 1 + firstLen > mwrap) {
                                if (xml === true) {
                                    output.push(" ");
                                }
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
                            if (xml === true) {
                                output.push(" ");
                            }
                            output.push("\n");
                            output.push(ind);
                        } else if (firstLen === 0) {
                            output.push(ind);
                        } else {
                            output.push(" ");
                        }
                        output.push(item[itemLength]);
                        return [
                            start + output.join(""), item[itemLength].length
                        ];
                    },
                    attr_wrap  = function markup_beauty__apply_attrwrap(item) {
                        var parse   = item.split("\n"),
                            loopEnd = level[i],
                            a       = 0,
                            b       = parse[0].length,
                            c       = [];
                        if (loopEnd !== "x") {
                            indents = "";
                            for (a = 0; a < loopEnd; a += 1) {
                                indents = tab + indents;
                            }
                        }
                        loopEnd = parse.length;
                        for (a = 1; a < loopEnd; a += 1) {
                            b += parse[a].length;
                            if (b > mwrap) {
                                c        = text_wrap(parse[a]);
                                parse[a] = "\n" + tab + indents + c[0];
                                b        = c[1];
                            } else {
                                parse[a] = " " + parse[a];
                            }
                        }
                        return parse.join("");
                    },
                    comment    = function markup_beauty__apply_comment(item) {
                        var regress = {},
                            a       = i - 1;
                        if (level[a] === "x") {
                            do {
                                a -= 1;
                            } while (typeof level[a] !== "number" && a > -1);
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
                        if (mjsx === true && item.indexOf("\n") > 0 && (/^( ?\/\*)/).test(item) === true) {
                            (function markup_beauty__apply_indentation_jsxComment() {
                                var mline = item.replace(/\s*\*\/(\s*)/, "").split("\n"),
                                    len   = mline.length,
                                    aa    = 0;
                                for (aa = 1; aa < len; aa += 1) {
                                    mline[aa] = tab + tab + mline[aa];
                                }
                                item = mline.join("\n") + "\n" + tab + "*\/";
                            }());
                        }
                        if (i > 0) {
                            item = "\n" + indents + item;
                        } else {
                            item = indents + item;
                        }
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
                    };
                for (i = 0; i < end; i += 1) {
                    if (mwrap > 0 && mjsx === false && (cinfo[i] === "content" || cinfo[i] === "mixed_start" || cinfo[i] === "mixed_both" || cinfo[i] === "mixed_end")) {
                        build[i] = text_wrap(build[i])[0];
                    }
                    if (build[i] === "</prettydiffli>" || build[i] === " </prettydiffli>") {
                        build[i] = "";
                    } else if (cinfo[i] === "end" && (mforce === true || (cinfo[i - 1] !== "content" && cinfo[i - 1] !== "mixed_start"))) {
                        if (build[i].charAt(0) === " ") {
                            build[i] = build[i].slice(1);
                        }
                        if (level[i] !== "x" && cinfo[i - 1] !== "start") {
                            build[i] = end_math(build[i]);
                        }
                    } else if (cinfo[i] === "external" && mstyle === "indent" && build[i - 1].toLowerCase().indexOf("<style") > -1) {
                        build[i] = style_math(build[i]);
                    } else if (cinfo[i - 1] !== "content" && (cinfo[i - 1] !== "mixed_start" || mforce === true)) {
                        if (build[i].charAt(0) === " ") {
                            build[i] = build[i].slice(1);
                        }
                        if (build[i].indexOf("\n") > 0 && mjsx === false && token[i] !== "T_ignore" && (cinfo[i] === "start" || cinfo[i] === "singleton")) {
                            build[i] = attr_wrap(build[i]);
                        }
                        if (level[i] !== "x") {
                            build[i] = tab_math(build[i]);
                        }
                    } else if (cinfo[i] === "comment") {
                        if (build[i].charAt(0) === " ") {
                            build[i] = build[i].slice(1);
                        }
                        if (build[i].indexOf("\n") > 0 && mcomm !== "noindent" && level[i] === "x") {
                            build[i] = comment(build[i]);
                        }
                    } else if (build[i].indexOf("\n") > 0 && token[i] !== "T_ignore" && mjsx === false && (cinfo[i] === "start" || cinfo[i] === "singleton")) {
                        build[i] = attr_wrap(build[i]);
                    }
                    if (token[i] === "T_xml" && mjsx === false) {
                        build[i] = text_wrap(build[i])[0];
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
                                if (cinfo[a] === "end" && token[a] !== "T_asp") {
                                    types[1]      += 1;
                                    totalTypes[0] += 1;
                                    chars[1]      += sum[a].length;
                                    if (sum[a].charAt(0) === " " && cinfo[a - 1] === "singleton") {
                                        chars[1] -= 1;
                                        chars[2] += 1;
                                    }
                                } else if (cinfo[a] === "singleton") {
                                    types[2]      += 1;
                                    totalTypes[0] += 1;
                                    chars[2]      += sum[a].length;
                                    if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                        requests.push(build[a]);
                                    }
                                } else if (cinfo[a] === "comment") {
                                    types[3]      += 1;
                                    totalTypes[0] += 1;
                                    chars[3]      += sum[a].length;
                                } else if (cinfo[a] === "content") {
                                    types[4]      += 1;
                                    totalTypes[1] += 1;
                                    chars[4]      += sum[a].length;
                                } else if (cinfo[a] === "mixed_start") {
                                    types[5]      += 1;
                                    totalTypes[1] += 1;
                                    chars[5]      += (sum[a].length - 1);
                                } else if (cinfo[a] === "mixed_end") {
                                    types[6]      += 1;
                                    totalTypes[1] += 1;
                                    chars[6]      += (sum[a].length - 1);
                                } else if (cinfo[a] === "mixed_both") {
                                    types[7]      += 1;
                                    totalTypes[1] += 1;
                                    chars[7]      += (sum[a].length - 2);
                                } else if (cinfo[a] === "parse") {
                                    types[10] += 1;
                                    chars[10] += sum[a].length;
                                } else if (cinfo[a] === "external") {
                                    types[17]     += 1;
                                    totalTypes[2] += 1;
                                    chars[17]     += sum[a].length;
                                    if (((build[a].indexOf("<script") !== -1 || build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                        requests.push(build[a]);
                                    }
                                } else {
                                    if (token[a] === "T_tag_start") {
                                        types[0]      += 1;
                                        totalTypes[0] += 1;
                                        chars[0]      += sum[a].length;
                                        if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                            requests.push(build[a]);
                                        }
                                    } else if (token[a] === "T_sgml") {
                                        types[8] += 1;
                                        chars[8] += sum[a].length;
                                    } else if (token[a] === "T_xml") {
                                        types[9] += 1;
                                        chars[9] += sum[a].length;
                                    } else if (token[a] === "T_ssi") {
                                        types[11]     += 1;
                                        totalTypes[3] += 1;
                                        chars[11]     += sum[a].length;
                                    } else if (token[a] === "T_asp") {
                                        types[12]     += 1;
                                        totalTypes[3] += 1;
                                        chars[12]     += sum[a].length;
                                    } else if (token[a] === "T_php") {
                                        types[13]     += 1;
                                        totalTypes[3] += 1;
                                        chars[13]     += sum[a].length;
                                    } else if (token[a] === "T_script") {
                                        types[15]     += 1;
                                        totalTypes[2] += 1;
                                        chars[15]     += sum[a].length;
                                        if (build[a].indexOf(" src") !== -1) {
                                            requests.push(build[a]);
                                        }
                                    } else if (token[a] === "T_style") {
                                        types[16]     += 1;
                                        totalTypes[2] += 1;
                                        chars[16]     += sum[a].length;
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
                            if (x === 0) {
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
                            } else if (x === 1) {
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
                            } else if (x === 2) {
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
                                report        = ["<div class='doc'>"];
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
                                zipf.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrate" +
                                    "s <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content a" +
                                    "nd the number of times they occurred.</caption>");
                                zipf.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of I" +
                                    "nstances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Perc" +
                                    "entage from ");
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
                            report.push("<table class='analysis' summary='Analysis of markup pieces.'><caption>Analysis o" +
                                "f markup pieces.</caption><thead><tr><th>Type</th><th>Quantity of Tags/Content</" +
                                "th><th>Percentage Quantity in Section</th><th>Percentage Quantity of Total</th><" +
                                "th>** Character Size</th><th>Percentage Size in Section</th><th>Percentage Size " +
                                "of Total</th></tr></thead><tbody><tr><th>Total Pieces</th><td>");
                            report.push(lengthToken);
                            report.push("</td><td>100.00%</td><td>100.00%</td><td>");
                            report.push(lengthChars);
                            report.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Common Tags</th></" +
                                "tr>");
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
                            report.push("</tbody></table></div><p>* The number of requests is determined from the input s" +
                                "ubmitted only and does not count the additional HTTP requests supplied from dyna" +
                                "mically executed code, frames, iframes, css, or other external entities.</p><p>*" +
                                "*");
                            report.push("Character size is measured from the individual pieces of tags and content specif" +
                                "ically between minification and beautification.</p><p>*** The number of starting" +
                                " &lt;script&gt; and &lt;style&gt; tags is subtracted from the total number of st" +
                                "art tags.");
                            report.push("The combination of those three values from the table above should equal the numb" +
                                "er of end tags or the code is in error.</p>");
                            report.push(requestOutput);
                            return report.join("");
                        }()),
                        score           = (function markup_beauty__report_efficiencyScore() {
                            var reqLen = requests.length,
                                output = ["<p><strong>Total input size:</strong> <em>"];
                            output.push(args.source.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                            output.push("</em> characters</p><p><strong>Total output size:</strong> <em>");
                            output.push(build.join("").length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                            output.push("</em> characters</p><p><strong>* Total number of HTTP requests in supplied HTML:" +
                                "</strong> <em>");
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
                                output.push("</strong></p>");
                            } else {
                                return "";
                            }
                            return output.join("");
                        }()),
                        duplicate       = (id.length > 0) ? "<p><strong class='duplicate'>Duplicate id attribute values detected:</strong> " + id + "</p>" : "",
                        jserror         = (function markup_beauty__report_jserror() {
                            if (summary.indexOf("jserror") > 0) {
                                return summary.slice(summary.indexOf("<p "), summary.indexOf("</p>") + 4);
                            }
                            return "";
                        }());
                    summary = jserror + summaryLanguage + duplicate + score + tables;
                }());
            }
            return build.join("");
        };
        return core(api);
    },

    //the edition values use the format YYMMDD for dates.
    edition    = {
        addon        : {
            ace: 150519
        },
        api          : {
            dom      : 150526,
            nodeLocal: 150415,
            wsh      : 150415
        },
        charDecoder  : 141025,
        css          : 150525, //diffview.css file
        csspretty    : 150526, //csspretty library
        csvbeauty    : 140114, //csvbeauty library
        csvmin       : 131224, //csvmin library
        diffview     : 150501, //diffview library
        documentation: 150509, //documentation.xhtml
        jspretty     : 150526, //jspretty library
        latest       : 0,
        markup_beauty: 150525, //markup_beauty library
        markupmin    : 150525, //markupmin library
        prettydiff   : 150525, //this file
        version      : "1.11.21", //version number
        webtool      : 150509
    };
edition.latest = (function edition_latest() {
    "use strict";
    return Math.max(edition.charDecoder, edition.css, edition.csspretty, edition.csvbeauty, edition.csvmin, edition.diffview, edition.documentation, edition.jspretty, edition.markup_beauty, edition.markupmin, edition.prettydiff, edition.webtool, edition.api.dom, edition.api.nodeLocal, edition.api.wsh);
}());
if (typeof exports === "object" || typeof exports === "function") { //commonjs and nodejs support
    exports.edition = edition;
    exports.api     = function commonjs(x) {
        "use strict";
        return prettydiff(x);
    };
} else if (typeof define === "object" || typeof define === "function") { //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.edition = edition;
        exports.api     = function requirejs_export(x) {
            return prettydiff(x);
        }; //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
