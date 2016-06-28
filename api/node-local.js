/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " ", api.vertical: true */
/*jshint laxbreak: true*/
/*jslint node: true*/
/***********************************************************************
 node-local is written by Austin Cheney on 6 Nov 2012.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/*

http://prettydiff.com/

Command line API for Prettydiff for local execution only.  This API is
not intended for execution as a service on a remote server.

Arguments entered from the command line are separated by spaces and
values are separated from argument names by a colon.  For safety
argument values should always be quoted.

Examples:

> node node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file"
 diff:"c:\myotherfile.js"
> node node-local.js source:"c:\mydirectory\myfile.js" mode:"beautify"
 readmethod:"file" output:"c:\output\otherfile.js"
> node node-local.js source:"../package.json" mode:"beautify"
 readmethod:"filescreen"
*/
//schema for global.meta
//lang - array, language detection
//time - string, proctime (total execution time minus visual rendering)
//insize - number, input size
//outsize - number, output size
//difftotal - number, difference count
//difflines - number, difference lines
(function pdNodeLocal() {
    "use strict";
    var localPath      = (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true)
            ? __dirname.replace(/(api)$/, "")
            : "../",
        cwd            = (process.cwd() === "/")
            ? __dirname
            : process.cwd(),
        libs           = (function pdNodeLocal__libs() {
            global.safeSort     = require(localPath + "lib/safeSort.js").api;
            global.csspretty    = require(localPath + "lib/csspretty.js").api;
            global.csvpretty    = require(localPath + "lib/csvpretty.js").api;
            global.diffview     = require(localPath + "lib/diffview.js").api;
            global.finalFile    = require(localPath + "lib/finalFile.js").api;
            global.jspretty     = require(localPath + "lib/jspretty.js").api;
            global.markuppretty = require(localPath + "lib/markuppretty.js").api;
            global.jsxstatus    = global.jspretty.jsxstatus;
            return localPath;
        }()),
        options        = {
            api            : "node",
            attributetoken : false,
            braceline      : false,
            bracepadding   : false,
            braces         : "knr",
            color          : "white",
            comments       : "indent",
            commline       : false,
            compressedcss  : false,
            conditional    : false,
            content        : false,
            context        : "",
            correct        : false,
            crlf           : false,
            cssinsertlines : false,
            csvchar        : ",",
            diff           : "",
            diffcli        : false,
            diffcomments   : false,
            difflabel      : "new",
            diffspaceignore: false,
            diffview       : "sidebyside",
            dustjs         : false,
            elseline       : false,
            endcomma       : false,
            endquietly     : "",
            force_attribute: false,
            force_indent   : false,
            formatArray    : "default",
            formatObject   : "default",
            functionname   : false,
            html           : false,
            inchar         : " ",
            inlevel        : 0,
            insize         : 4,
            jekyll         : false,
            jsscope        : "none",
            lang           : "auto",
            langdefault    : "text",
            listoptions    : false,
            methodchain    : "indent",
            miniwrap       : false,
            mode           : "diff",
            neverflatten   : false,
            nocaseindent   : false,
            nochainindent  : false,
            nodeasync      : false,
            nodeerror      : false,
            noleadzero     : false,
            objsort        : "js",
            output         : "",
            parseFormat    : "parallel",
            parseSpace     : false,
            preserve       : 1,
            qml            : false,
            quote          : false,
            quoteConvert   : "none",
            readmethod     : "auto",
            selectorlist   : false,
            semicolon      : false,
            source         : "",
            sourcelabel    : "base",
            space          : true,
            spaceclose     : false,
            style          : "indent",
            styleguide     : "none",
            summaryonly    : false,
            tagmerge       : false,
            tagsort        : false,
            ternaryline    : false,
            textpreserve   : false,
            titanium       : false,
            topcoms        : false,
            unformatted    : false,
            varword        : "none",
            version        : false,
            vertical       : "js",
            wrap           : 80
        },
        diffCount      = [
            0, 0, 0, 0, 0
        ],
        method         = "auto",
        pdapp          = require(libs + "prettydiff.js"),
        html           = [
            global.finalFile.html.head, //0
            global.finalFile.css.color.canvas, //1
            global.finalFile.css.color.shadow, //2
            global.finalFile.css.color.white, //3
            global.finalFile.css.reports, //4
            global.finalFile.css.global, //5
            global.finalFile.html.body, //6
            global.finalFile.html.color, //7
            global.finalFile.html.intro, //8
            "", //9 - for meta analysis, like stats and accessibility
            "", //10 - for generated report
            global.finalFile.html.script, //11
            global.finalFile.script.minimal, //12
            global.finalFile.html.end //13
        ],
        prettydiff     = function pdNodeLocal__prettydiff() {
            var pdresponse = pdapp.api(options),
                data       = (options.nodeasync === true)
                    ? (options.mode === "parse" && method !== "screen" && method !== "filescreen" && options.parseFormat !== "htmltable")
                        ? JSON.stringify(pdresponse[0])
                        : pdresponse[0]
                    : (options.mode === "parse" && method !== "screen" && method !== "filescreen" && options.parseFormat !== "htmltable")
                        ? JSON.stringify(pdresponse)
                        : pdresponse,
                meta       = (options.nodeasync === true)
                    ? pdresponse[1]
                    : global.meta;
            if (options.nodeerror === true) {
                console.log(meta.error);
            }
            if (options.diffcli === true) {
                diffCount[0] += pdresponse[1];
                if (pdresponse[1] > 0) {
                    diffCount[1] += 1;
                }
                return pdresponse[0];
            }
            diffCount[0] += meta.difftotal;
            if (meta.difftotal > 0) {
                diffCount[1] += 1;
            }
            diffCount[2] += 1;
            diffCount[3] += meta.insize;
            diffCount[4] += meta.outsize;
            if (meta.error !== "") {
                html[9] = "<p><strong>Error:</strong> " + meta.error + "</p>";
            }
            if (options.mode === "diff" || options.mode === "analysis" || (options.mode === "parse" && options.parseFormat === "htmltable")) {
                html[7]  = options.color;
                html[10] = data;
                if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                    html[12] = global.finalFile.script.beautify;
                } else if (options.mode === "diff") {
                    html[12] = global.finalFile.script.diff;
                }
                return html.join("");
            }
            return data;
        },
        fs             = require("fs"),
        http           = require("http"),
        path           = require("path"),
        sfiledump      = [],
        dfiledump      = [],
        sState         = [],
        dState         = [],
        clidata        = [
            [], [], []
        ],
        lf             = "\n",
        startTime      = Date.now(),
        versionString  = (function pdNodeLocal__versionString() {
            var dstring = "",
                mstring = 0,
                month   = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December"
                ];
            global.edition = pdapp.edition;
            dstring        = global
                .edition
                .latest
                .toString();
            mstring        = Number(dstring.slice(2, 4)) - 1;
            return "\x1B[36mVersion\x1B[39m: " + global.edition.version + " \x1B[36mDated\x1B[39m: " + dstring.slice(4, 6) + " " + month[mstring] + " 20" + dstring.slice(0, 2);
        }()),
        dir            = [
            0, 0, 0
        ],
        address        = {
            dabspath: "",
            dorgpath: "",
            oabspath: "",
            oorgpath: "",
            sabspath: "",
            sorgpath: ""
        },
        help           = false,
        total          = [
            0, 0
        ],
        colors         = {
            del     : {
                charEnd  : "\x1B[22m",
                charStart: "\x1B[1m",
                lineEnd  : "\x1B[39m",
                lineStart: "\x1B[31m"
            },
            filepath: {
                end  : "\x1B[39m",
                start: "\x1B[36m"
            },
            ins     : {
                charEnd  : "\x1B[22m",
                charStart: "\x1B[1m",
                lineEnd  : "\x1B[39m",
                lineStart: "\x1B[32m"
            }
        },
        enderflag      = false,

        //ending messaging with stats
        ender          = function pdNodeLocal__ender() {
            var plural = (function pdNodeLocal__ender_plural() {
                    var a   = 0,
                        len = diffCount.length,
                        arr = [];
                    for (a = 0; a < len; a += 1) {
                        if (diffCount[a] === 1) {
                            arr.push("");
                        } else {
                            arr.push("s");
                        }
                    }
                    if (clidata[1].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    if (clidata[0].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    return arr;
                }()),
                log    = [],
                time   = 0;
            if (enderflag === true) {
                return;
            }
            if (options.endquietly !== "log" && (method === "filescreen" || method === "screen")) {
                return;
            }

            // indexes of diffCount array
            //* 0 - total number of differences
            //* 1 - the number of files containing those differences
            //* 2 - total file count (not counting sub)directories)
            //* 3 - total input size (in characters from all files)
            //* 4 - total output size (in characters from all files)
            if ((method !== "directory" && method !== "subdirectory") || sfiledump.length === 1) {
                plural[1] = "";
            }
            if (options.diffcli === true && options.mode === "diff") {
                if (options.summaryonly === true && clidata[2].length > 0) {
                    log.push(lf + "Files changed:" + lf);
                    log.push(colors.filepath.start);
                    log.push(clidata[2].join(lf));
                    log.push(colors.filepath.end);
                    log.push(lf + lf);
                }
                if (clidata[0].length > 0) {
                    log.push(lf + "Files deleted:" + lf);
                    log.push(colors.del.lineStart);
                    log.push(clidata[0].join(lf));
                    log.push(colors.del.lineEnd);
                    log.push(lf + lf);
                }
                if (clidata[1].length > 0) {
                    log.push(lf + "Files inserted:" + lf);
                    log.push(colors.ins.lineStart);
                    log.push(clidata[1].join(lf));
                    log.push(colors.ins.lineEnd);
                    log.push(lf + lf);
                }
            }
            log.push(lf + "Pretty Diff ");
            if (options.mode === "diff") {
                if (method !== "directory" && method !== "subdirectory") {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(". ");
                } else {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(" in ");
                    log.push(diffCount[1]);
                    log.push(" file");
                    log.push(plural[1]);
                    log.push(" out of ");
                }
            } else if (options.mode === "beautify") {
                log.push("beautified ");
            } else if (options.mode === "minify") {
                log.push("minified ");
            } else if (options.mode === "parse") {
                log.push("parsed ");
            }
            if (options.mode !== "diff" || method === "directory" || method === "subdirectory") {
                log.push(diffCount[2]);
                log.push(" file");
                log.push(plural[2]);
                log.push(". ");
            }
            if (options.mode === "diff" && (method === "directory" || method === "subdirectory")) {
                log.push(clidata[1].length);
                log.push(" file");
                log.push(plural[2]);
                log.push(" added. ");
                log.push(clidata[0].length);
                log.push(" file");
                log.push(plural[3]);
                log.push(" deleted. Executed in ");
            } else {
                log.push("Executed in ");
            }
            time = (Date.now() - startTime) / 1000;
            log.push(time);
            log.push(" second");
            if (time !== 1) {
                log.push("s");
            }
            log.push("." + lf);
            console.log(log.join(""));
            enderflag = true;
        },

        //instructions
        error          = (function pdNodeLocal__error() {
            var a       = [],
                color   = {
                    accepted: "\x1B[31m",
                    bool    : "\x1B[35m",
                    number  : "\x1B[36m",
                    string  : "\x1B[33m",
                    word    : "\x1B[32m"
                },
                opname  = function pdNodeLocal__opname(x) {
                    var value = x.match(/\w+/);
                    return x.replace(value, color.word + value + "\x1B[39m");
                },
                vallist = function pdNodeLocal__vallist(x) {
                    var value = x.split(":\x1B[39m"),
                        items = value[1].split(","),
                        len   = items.length,
                        b     = 0;
                    for (b = 0; b < len; b += 1) {
                        items[b] = items[b].replace(/\s(?=\w)/, " " + color.string) + "\x1B[39m";
                    }
                    return value[0] + ":\x1B[39m" + items.join(",");
                };
            a.push(lf);
            a.push("\x1B[1mOptions\x1B[22m");
            a.push("");
            a.push("Arguments      - Type    - Definition");
            a.push("-------------------------------------");
            a.push("* attributetoken - boolean - If true markup attributes are provided as separate");
            a.push("                           tokens in the parse table of mode parse. Otherwise");
            a.push("                           attributes are a data property of their respective");
            a.push("                           element. Default is false.");
            a.push("");
            a.push("* braceline    - boolean - If true a new line character will be inserted after");
            a.push("                           opening curly braces and before closing curly");
            a.push("                           braces. Default is false.");
            a.push("");
            a.push("* bracepadding - boolean - Inserts a space after the start of a contain and");
            a.push("                           before the end of the container in JavaScript if the");
            a.push("                           contents of that container are not indented; such");
            a.push("                           as: conditions, function arguments, and escaped");
            a.push("                           sequences of template strings. Default is false.");
            a.push("");
            a.push("* braces       - string  - If lang is 'javascript' and mode is 'beautify' this");
            a.push("                           determines if opening curly braces will exist on the");
            a.push("                           same line as their condition or be forced onto a new");
            a.push("                           line. Defaults to 'knr'.");
            a.push("                 Accepted values: knr, allman");
            a.push("");
            a.push("* color        - string  - The color scheme of the reports. Default is shadow.");
            a.push("                 Accepted values: default, canvas, shadow, white");
            a.push("");
            a.push("* comments     - string  - If mode is 'beautify' this will determine whether");
            a.push("                           comments should always start at position 0 of each");
            a.push("                           line or if comments should be indented according to");
            a.push("                           sthe code. Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* commline     - boolean - If a blank new line should be forced above comments");
            a.push("                           in markup. Default is false.");
            a.push("");
            a.push("* compressedcss - boolean - If CSS should be beautified in a style where the");
            a.push("                           properties and values are minifed for faster reading");
            a.push("                           of selectors. Default is false.");
            a.push("");
            a.push("* conditional  - boolean - If true then conditional comments used by Internet");
            a.push("                           Explorer are preserved at minification of markup.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* content      - boolean - If true and mode is 'diff' this will normalize all");
            a.push("                           string literals in JavaScript to 'text' and all");
            a.push("                           content in markup to 'text' so as to eliminate some");
            a.push("                           differences from the HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* context      - number  - This shortens the diff output by allowing a");
            a.push("                           specified number of equivalent lines between each");
            a.push("                           line of difference. Defaults to an empty string,");
            a.push("                           which nullifies its use.");
            a.push("");
            a.push("* correct      - boolean - Automatically correct some sloppiness in JavaScript.");
            a.push("                           The default is 'false' and it is only applied during");
            a.push("                           JavaScript beautification.");
            a.push("");
            a.push("* crlf         - boolean - If line termination should be Windows (LF) format.");
            a.push("                           Unix (LF) format is the default.");
            a.push("");
            a.push("* cssinsertlines - boolean - Inserts new line characters between every CSS code");
            a.push("                           block. Default is false.");
            a.push("");
            a.push("* csvchar      - string  - The character to be used as a separator if lang is");
            a.push("                           'csv'. Any string combination is accepted. Defaults");
            a.push("                           to a comma ','.");
            a.push("");
            a.push("* diff         - string  - The file to be compared to the source file. This is");
            a.push("                           required if mode is 'diff'.");
            a.push("");
            a.push("* diffcli      - boolean - If true only text lines of the code differences are");
            a.push("                           returned instead of an HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* diffcomments - boolean - If true then comments will be preserved so that both");
            a.push("                           code and comments are compared by the diff engine.");
            a.push("");
            a.push("* difflabel    - string  - This allows for a descriptive label for the diff");
            a.push("                           file code of the diff HTML output. Defaults to new'.");
            a.push("");
            a.push("* diffspaceignore - boolean - If white space only differences should be ignored");
            a.push("                           by the diff tool.  Default is false.");
            a.push("");
            a.push("* diffview     - string  - This determines whether the diff HTML output should");
            a.push("                           display as a side-by-side comparison or if the");
            a.push("                           differences should display in a single table column.");
            a.push("                           Defaults to 'sidebyside'.");
            a.push("                 Accepted values: sidebyside, inline");
            a.push("");
            a.push("* dustjs       - boolean - If the provided markup code is a Dust.js template.");
            a.push("                           Takes a boolean and defaults to false.");
            a.push("");
            a.push("* elseline     - boolean - If elseline is true then the keyword 'else' is forced");
            a.push("                           onto a new line in JavaScript beautification.");
            a.push("                           Defaults to false.");
            a.push("");
            a.push("* endcomma     - boolean - If there should be a trailing comma in JavaScript");
            a.push("                           arrays and objects.");
            a.push("");
            a.push("* endquietly   - string  - Determine if terminal logging should be allowed or ");
            a.push("                           suppressed.  The value 'quiet' eliminates terminal");
            a.push("                           logging and the value 'log' forces it to appear.");
            a.push("                 Accepted values: quiet, log, empty string");
            a.push("");
            a.push("* force_attribute - boolean - If all markup attributes should be indented each");
            a.push("                           onto their own line.  Default is false.");
            a.push("");
            a.push("* force_indent - boolean - If lang is 'markup' this will force indentation upon");
            a.push("                           all content and tags without regard for the creation");
            a.push("                           of new text nodes. Default is false.");
            a.push("");
            a.push("* formatArray  - string  - Determines if all JavaScript array indexes should be");
            a.push("                           indented, never indented, or left to the default.");
            a.push("                 Accepted values: default, indent, inline");
            a.push("");
            a.push("* formatObject - string  - Determines if all JavaScript object properties should");
            a.push("                           be indented, never indented, or left to the default.");
            a.push("                 Accepted values: default, indent, inline");
            a.push("");
            a.push("* functionname - boolean - If a space should follow a JavaScript function name.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* help         - string  - This list of argument definitions. The value is");
            a.push("                           unnecessary and is required only to pass in use of");
            a.push("                           the parameter.");
            a.push("");
            a.push("* html         - boolean - If lang is 'markup' this will provide an override so");
            a.push("                           that some tags are treated as singletons and not");
            a.push("                           start tags, such as '<br>' opposed to '<br/>'.");
            a.push("");
            a.push("* inchar       - string  - The string characters to comprise a single");
            a.push("                           indentation. Any string combination is accepted.");
            a.push("                           Defaults to space ' '.");
            a.push("");
            a.push("* inlevel      - number  - How much indentation padding should be applied to");
            a.push("                           JavaScript beautification?  Default is 0.");
            a.push("");
            a.push("* insize       - number  - The number of characters to comprise a single");
            a.push("                           indentation. Defaults to '4'.");
            a.push("");
            a.push("* jekyll       - boolean - If YAML Jekyll HTML template comments are supported.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* jsscope      - string  - If 'html' JavaScript beautification produces HTML");
            a.push("                           formatted output coloring function scope and");
            a.push("                           variables to indicate scope depth and inheritance.");
            a.push("                           The value 'report' is similar to the value 'html',");
            a.push("                           except that it forms the entirety of an HTML");
            a.push("                           document. Default is 'none', which just returns");
            a.push("                           beautified JavaScript in text format.");
            a.push("                 Accepted values: none, report, html");
            a.push("");
            a.push("* lang         - string  - The programming language of the source file.");
            a.push("                           Defaults to auto.");
            a.push("                 Accepted values: auto, markup, javascript, css, html, csv, text");
            a.push("");
            a.push("* langdefault  - string  - The fallback option if lang is set to 'auto' and a");
            a.push("                           language cannot be detected.");
            a.push("                 Accepted values: markup, javascript, css, html, csv, text");
            a.push("");
            a.push("* methodchain  - string  - Whether consecutive JavaScript methods should be");
            a.push("                           chained onto a single line of code instead of");
            a.push("                           indented. Default is 'indent'.");
            a.push("                 Accepted values: chain, indent, none");
            a.push("");
            a.push("* miniwrap     - boolean - Whether minified JavaScript should wrap after a");
            a.push("                           specified character width. This option requires a");
            a.push("                           value from option 'wrap'.");
            a.push("");
            a.push("* mode         - string  - The operation to be performed. Defaults to 'diff'.");
            a.push("                           * analysis - returns an evaluation report.");
            a.push("                           * diff     - returns either command line list of");
            a.push("                                        differences or an HTML report");
            a.push("                           * beautify - beautifies code and returns a string");
            a.push("                           * minify   - minifies code and returns a string");
            a.push("                           * parse    - returns an object with shallow arrays");
            a.push("                 Accepted values: diff, beautify, minify, parse");
            a.push("");
            a.push("* neverflatten - boolean - If destructured lists in JavaScript should never be");
            a.push("                           flattend. Default is false.");
            a.push("");
            a.push("* nocaseindent - boolean - If a case statement should receive the same");
            a.push("                           indentation as the containing switch block.");
            a.push("");
            a.push("* nochainindent - boolean - If indentation should be prevent of JavaScript method");
            a.push("                           chains broken onto multiple lines. Default is false.");
            a.push("");
            a.push("* noleadzero   - boolean - If in CSS values leading 0s immediately preceeding a");
            a.push("                           decimal should be removed or prevented.");
            a.push("");
            a.push("* objsort      - string  - Sorts properties by key name in JavaScript and/or");
            a.push("                           CSS. Defaults to 'js'.");
            a.push("                 Accepted values: all, css, js, markup, none");
            a.push("");
            a.push("* output       - string  - The path of the directory, if readmethod is value");
            a.push("                           'directory', or path and name of the file to write");
            a.push("                           the output.  If the directory path or file exists it");
            a.push("                           will be over written else it will be created.");
            a.push("");
            a.push("* parseFormat  - string  - When in parse mode if the output should be an array of");
            a.push("                           records (sequential), arrays of data types (parallel),");
            a.push("                           or an HTML table.  Default is parallel.");
            a.push("                 Accepted values: parallel, sequential, htmltable");
            a.push("");
            a.push("* parseSpace   - boolean - Whether whitespace tokens should be included. Default");
            a.push("                           is false.");
            a.push("");
            a.push("* preserve     - number  - The maximum number of empty lines to retain.");
            a.push("");
            a.push("* qml          - boolean - Enable syntax support for QML. Default is false and is");
            a.push("                           not supported with minification or option objsort.");
            a.push("");
            a.push("* quote        - boolean - If true and mode is 'diff' then all single quote");
            a.push("                           characters will be replaced by double quote");
            a.push("                           characters in both the source and diff file input so");
            a.push("                           as to eliminate some differences from the diff");
            a.push("                           report HTML output.");
            a.push("");
            a.push("* quoteConvert - string  - If the quotes of JavaScript strings or markup");
            a.push("                           attributes should be converted to single quotes or");
            a.push("                           double quotes. The default is 'none', which performs");
            a.push("                           no conversion.");
            a.push("                 Accepted values: double, single, none");
            a.push("");
            a.push("* readmethod   - string  - The readmethod determines if operating with IO from");
            a.push("                           command line or IO from files.  Default value is");
            a.push("                           'screen':");
            a.push("                           * auto         - changes to value subdirectory,");
            a.push("                                            file, or screen depending on the");
            a.push("                                            source");
            a.push("                           * screen       - reads from screen and outputs to");
            a.push("                                            screen");
            a.push("                           * file         - reads a file and outputs to a file");
            a.push("                                          - file requires option 'output'");
            a.push("                           * filescreen   - reads a file and writes to screen");
            a.push("                           * directory    - process all files in the immediate");
            a.push("                                            directory");
            a.push("                           * subdirectory - process all files in a directory");
            a.push("                                            and its subdirectories");
            a.push("                 Accepted values: auto, screen, file, filescreen, directory,");
            a.push("                                  subdirectory");
            a.push("");
            a.push("* selectorlist - boolean - If comma separated CSS selectors should be retained");
            a.push("                           on a single line of code.");
            a.push("");
            a.push("* semicolon    - boolean - If true and mode is 'diff' and lang is 'javascript'");
            a.push("                           all semicolon characters that immediately preceed");
            a.push("                           any white space containing a new line character will");
            a.push("                           be removed so as to elimate some differences from");
            a.push("                           the diff report HTML output.");
            a.push("");
            a.push("* source       - string  - The file source for interpretation. This is required.");
            a.push("");
            a.push("* sourcelabel  - string  - This allows for a descriptive label of the source");
            a.push("                           file code of the diff HTML output.");
            a.push("");
            a.push("* space        - boolean - If false the space following the function keyword");
            a.push("                           for anonymous functions is removed. Default is true.");
            a.push("");
            a.push("* spaceclose   - boolean - If false markup self-closing tags end with '/>' and");
            a.push("                           ' />' if true. Default is false.");
            a.push("");
            a.push("* style        - string  - If mode is 'beautify' and lang is 'markup' or 'html'");
            a.push("                           this will determine whether the contents of script");
            a.push("                           and style tags should always start at position 0 of");
            a.push("                           each line or if such content should be indented");
            a.push("                           starting from the opening script or style tag.");
            a.push("                           Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* styleguide   - string  - Provides a collection of option presets to easily");
            a.push("                           conform to popular JavaScript style guides. Default");
            a.push("                           is 'none'.");
            a.push("                 Accepted values: airbnb, crockford, google, grunt, jquery,");
            a.push("                                  mediawiki, meteor, yandex, none");
            a.push("");
            a.push("* summaryonly  - boolean - Node only option to output only number of");
            a.push("                           differences and generate no reports. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* tagmerge     - boolean - Allows immediately adjacement start and end markup");
            a.push("                           tags of the same name to be combined into a single");
            a.push("                           self-closing tag. Default is false.");
            a.push("");
            a.push("* tagsort      - boolean - Sort child items of each respective markup parent");
            a.push("                           element.");
            a.push("");
            a.push("* textpreserve - boolean - If text in the provided markup code should be");
            a.push("                           preserved exactly as provided. This option");
            a.push("                           eliminates beautification and wrapping of text");
            a.push("                           content.  Takes a boolean and defaults to false.");
            a.push("");
            a.push("* ternaryline  - boolean - If ternary operators in JavaScript (? and :) should");
            a.push("                           remain on the same line.  Defaults to false.");
            a.push("");
            a.push("* titanium     - boolean - Forces the JavaScript parser to parse Titanium Style");
            a.push("                           Sheets instead of JavaScript. Default is false.");
            a.push("");
            a.push("* topcoms      - boolean - If mode is 'minify' this determines whether comments");
            a.push("                           above the first line of code should be kept. Default");
            a.push("                           is false.");
            a.push("");
            a.push("* unformatted  - boolean - If markup tags should have their insides preserved.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* varword      - string  - If consecutive JavaScript variables should be merged");
            a.push("                           into a comma separated list ('list') or the opposite");
            a.push("                           ('each'). Default is 'none'.");
            a.push("                 Accepted values: each, list, none");
            a.push("");
            a.push("* vertical     - string  - If lists of assignments and properties should be");
            a.push("                           vertically aligned. Default is 'js'.");
            a.push("                 Accepted values: all, css, js, none");
            a.push("");
            a.push("* wrap         - number  - How many characters text content in markup or");
            a.push("                           strings in JavaScript can be before wrapping. The");
            a.push("                           default value is 80. A value of turns this feature");
            a.push("                           off. A value of -1 will concatenate strings in");
            a.push("                           JavaScript separated by a '+' operator. In markup");
            a.push("                           wrapping occurs on the last space character prior to");
            a.push("                           the given character width");
            a.push("");
            a.push("\x1B[1mUsage\x1B[22m");
            a.push(color.bool + "node api/node-local.js\x1B[39m " + color.word + "option1:\x1B[39m" + color.string + "\"value\"\x1B[39m " + color.word + "option2:\x1B[39m" + color.string + "\"value\"\x1B[39m ...");
            a.push(color.bool + "node api/node-local.js\x1B[39m " + color.word + "source:\x1B[39m" + color.string + "\"myApplication.js\"\x1B[39m " + color.word + "readmethod:\x1B[39m" + color.string + "\"filescreen\"\x1B[39m " + color.word + "mode:\x1B[39m" + color.string + "\"beautify\"\x1B[39m");
            a.push(color.bool + "node api/node-local.js\x1B[39m " + color.word + "source:\x1B[39m" + color.string + "\"old_directory\"\x1B[39m " + color.word + "diff:\x1B[39m" + color.string + "\"new_directory\"\x1B[39m " + color.word + "readmethod:\x1B[39m" + color.string + "\"subdirectory\"\x1B[39m");
            a.push("");
            a.push(color.bool + "node api/node-local.js\x1B[39m " + color.word + "help\x1B[39m        to see this help message");
            a.push(color.bool + "node api/node-local.js\x1B[39m " + color.word + "version\x1B[39m     to see only the version line");
            a.push(color.bool + "node api/node-local.js\x1B[39m " + color.word + "list\x1B[39m        to see the current settings");
            a.push(versionString);
            a.push("");
            if (options.source === "" && options.help === false && options.version === false && options.listoptions === false) {
                a.push("options.source does not have a value!");
            }
            return a
                .join(lf)
                .replace(/\r?\n\*\ \w+\s+-/g, opname)
                .replace(/-\ boolean\ -/g, "- " + color.bool + "boolean\x1B[39m -")
                .replace(/-\ string\ {2,}-/g, "- " + color.string + "string\x1B[39m  -")
                .replace(/-\ number\ {2,}-/g, "- " + color.number + "number\x1B[39m  -")
                .replace(/\r?\n\ {17,}Accepted\ values:/g, lf + "                 " + color.accepted + "Accepted values:\x1B[39m")
                .replace(/Accepted\ values:\\x1B\[39m(\s+\w+,?)+/g, vallist);
        }()),

        //write output to a file executed from fileComplete
        fileWrite      = function pdNodeLocal__fileWrite(data) {
            var dirs     = data
                    .localpath
                    .split(path.sep),
                suffix   = (options.mode === "diff")
                    ? "-diff.html"
                    : "-report.html",
                filename = dirs[dirs.length - 1],
                count    = 1,
                writing  = function pdNodeLocal__fileWrite_writing(ending, dataA) {
                    if (dataA.binary === true) {
                        //binary
                        fs
                            .writeFile(dataA.finalpath, dataA.file, function pdNodeLocal__fileWrite_writing_writeFileBinary(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing binary output." + lf);
                                    console.log(err);
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else if (dataA.file === "") {
                        //empty files
                        fs
                            .writeFile(dataA.finalpath + ending, "", function pdNodeLocal__fileWrite_writing_writeFileEmpty(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing empty output." + lf);
                                    console.log(err);
                                } else if (method === "file" && options.endquietly !== "quiet") {
                                    console.log(lf + "Empty file successfully written to file.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else {
                        fs
                            .writeFile(dataA.finalpath + ending, dataA.file, function pdNodeLocal__fileWrite_writing_writeFileText(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing file output." + lf);
                                    console.log(err);
                                } else if (method === "file" && options.endquietly !== "quiet") {
                                    if (ending.indexOf("-report") === 0) {
                                        console.log(lf + "Report successfully written to file.");
                                    } else {
                                        console.log(lf + "File successfully written.");
                                    }
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    }
                },
                files    = function pdNodeLocal__fileWrite_files(dataB) {
                    if (dataB.binary === true) {
                        writing("", dataB);
                    } else if (options.mode === "diff" || options.mode === "analysis" || (options.mode === "beautify" && options.jsscope !== "none")) {
                        writing(suffix, dataB);
                    } else {
                        writing("", dataB);
                    }
                },
                newdir   = function pdNodeLocal__fileWrite_newdir(dataC) {
                    fs
                        .mkdir(address.oabspath + dirs.slice(0, count).join(path.sep), function pdNodeLocal__fileWrite_newdir_callback() {
                            count += 1;
                            if (count < dirs.length) {
                                pdNodeLocal__fileWrite_newdir(dataC);
                            } else {
                                files(dataC);
                            }
                        });
                };
            options.source = sfiledump[data.index];
            if (options.mode === "diff") {
                if (method === "file") {
                    data.finalpath = options.output;
                } else {
                    data.finalpath = address.oabspath + dirs.join("__") + "__" + filename;
                }
                options.diff   = dfiledump[data.index];
            } else if (method === "file") {
                data.finalpath = options.output;
            } else {
                data.finalpath = address.oabspath + dirs.join(path.sep);
            }
            if (data.binary === true) {
                if (dirs.length > 1 && options.mode !== "diff") {
                    newdir(data);
                } else {
                    files(data);
                }
                return;
            }
            data.file = prettydiff();
            if (global.meta.error !== "") {
                if (data.last === true) {
                    ender();
                }
                console.log("Error with file: " + data.localpath);
                console.log(global.meta.error);
                console.log("");
            }
            if (dirs.length > 1 && options.mode !== "diff") {
                newdir(data);
            } else {
                files(data);
            }
        },

        //write output to terminal for diffcli option
        cliWrite       = function pdNodeLocal__cliWrite(output, itempath, last) {
            var a      = 0,
                plural = "",
                pdlen  = output[0].length;
            if (options.summaryonly === true) {
                clidata[2].push(itempath);
            } else {
                if (diffCount[0] !== 1) {
                    plural = "s";
                }
                if (options.readmethod === "screen" || (options.readmethod === "auto" && method === "screen")) {
                    console.log(lf + "Screen input with " + diffCount[0] + " difference" + plural);
                } else if (output[5].length === 0) {
                    console.log(lf + colors.filepath.start + itempath + lf + "Line: " + output[0][a] + colors.filepath.end);
                }
                for (a = 0; a < pdlen; a += 1) {
                    if (output[0][a + 1] !== undefined && output[0][a] === output[2][a + 1] && output[2][a] === output[0][a + 1] && output[0][a] !== output[2][a]) {
                        if (options.readmethod === "screen" || (options.readmethod === "auto" && method === "screen")) {
                            console.log(lf + "Line: " + output[0][a] + colors.filepath.end);
                        } else {
                            console.log(lf + colors.filepath.start + itempath + lf + "Line: " + output[0][a] + colors.filepath.end);
                        }
                        if (output[3][a - 2] !== undefined) {
                            console.log(output[3][a - 2]);
                        }
                        if (output[3][a - 1] !== undefined) {
                            console.log(output[3][a - 1]);
                        }
                    }
                    if (output[4][a] === "delete") {
                        console.log(colors.del.lineStart + output[1][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                    } else if (output[4][a] === "insert") {
                        console.log(colors.ins.lineStart + output[3][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    } else if (output[4][a] === "equal" && a > 1) {
                        console.log(output[3][a]);
                    } else if (output[4][a] === "replace") {
                        console.log(colors.del.lineStart + output[1][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                        console.log(colors.ins.lineStart + output[3][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    }
                }
            }
            if (last === true) {
                ender();
            }
        },

        //write output to screen executed from fileComplete
        screenWrite    = function pdNodeLocal__screenWrite() {
            var report = [];
            if (options.mode === "diff" && options.diffcli === true) {
                return cliWrite(prettydiff(), "", false);
            }
            if (options.mode === "diff") {
                return console.log(prettydiff());
            }
            if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                return console.log(prettydiff());
            }
            report = prettydiff();
            if (options.mode === "parse" && options.parseFormat !== "htmltable") {
                report = JSON.stringify(report);
            }
            total[1] += 1;
            console.log(report);
            if (total[0] === total[1] || options.readmethod === "screen" || options.readmethod === "auto") {
                ender();
            }
        },

        //generate the diff output for CLI from files
        cliFile        = function pdNodeLocal__cliFile(data) {
            options.source = sfiledump[data.index];
            options.diff   = dfiledump[data.index];
            if (options.source.indexOf("undefined") === 0) {
                options.source = options
                    .source
                    .replace("undefined", "");
            }
            if (options.diff.indexOf("undefined") === 0) {
                options.diff = options
                    .diff
                    .replace("undefined", "");
            }
            if (typeof options.context !== "number" || options.context < 0) {
                console.log(lf + colors.filepath.start + data.localpath + colors.filepath.end);
            }
            cliWrite(prettydiff(), data.localpath, data.last);
        },

        // is a file read operation complete? executed from readLocalFile executed from
        // readHttpFile
        fileComplete   = function pdNodeLocal__fileComplete(data) {
            var totalCalc = function pdNodeLocal__fileComplete_totalCalc() {
                total[1] += 1;
                if (total[1] === total[0]) {
                    ender();
                }
            };
            if (data.binary === true) {
                total[0] -= 1;
            }
            if (options.mode !== "diff" || (options.mode === "diff" && data.type === "diff")) {
                total[0] += 1;
            }
            if (data.type === "diff") {
                dfiledump[data.index] = data.file;
                dState[data.index]    = true;
            } else {
                sfiledump[data.index] = data.file;
                sState[data.index]    = true;
            }
            if (data.index !== sfiledump.length - 1) {
                data.last = false;
            }
            if (sState[data.index] === true && ((options.mode === "diff" && dState[data.index] === true) || options.mode !== "diff")) {
                if (options.mode === "diff" && sfiledump[data.index] !== dfiledump[data.index]) {
                    if (dfiledump[data.index] === "" || dfiledump[data.index] === "\n") {
                        total[1]     += 1;
                        console.log("Diff file at " + data.localpath + " is \x1B[31mempty\x1B[39m but the source file is not.");
                        if (total[0] === total[1]) {
                            ender();
                        }
                    } else if (sfiledump[data.index] === "" || sfiledump[data.index] === "\n") {
                        total[1]     += 1;
                        console.log("Source file at " + data.localpath + " is \x1B[31mempty\x1B[39m but the diff file is not.");
                        if (total[0] === total[1]) {
                            ender();
                        }
                    } else if (options.diffcli === true) {
                        cliFile(data);
                    } else if (method === "filescreen") {
                        options.diff   = dfiledump[data.index];
                        options.source = sfiledump[data.index];
                        screenWrite();
                    } else if (method === "file" || method === "directory" || method === "subdirectory") {
                        fileWrite(data);
                    }
                    sState[data.index] = false;
                    if (options.mode === "diff") {
                        dState[data.index] = false;
                    }
                } else if (options.mode !== "diff" && (method === "file" || method === "directory" || method === "subdirectory")) {
                    fileWrite(data);
                } else if (options.mode !== "diff" && (method === "screen" || method === "filescreen")) {
                    options.source = data.file;
                    screenWrite();
                } else {
                    totalCalc();
                }
            }
        },

        //read from a binary file
        readBinaryFile = function pdNodeLocal__readBinaryFile(data) {
            fs
                .open(data.absolutepath, "r", function pdNodeLocal__readBinaryFile_open(err, fd) {
                    var buff = new Buffer(data.size);
                    if (err !== null) {
                        return pdNodeLocal__readBinaryFile(data);
                    }
                    fs
                        .read(fd, buff, 0, data.size, 0, function pdNodeLocal__readBinaryFile_open_read(erra, bytesRead, buffer) {
                            if (erra !== null) {
                                return pdNodeLocal__readBinaryFile(data);
                            }
                            if (bytesRead > 0) {
                                data.file = buffer;
                            }
                            fileComplete(data);
                        });
                });
        },

        //read from a file and determine if text
        readLocalFile  = function pdNodeLocal__readLocalFile(data) {
            var open = function pdNodeLocal__readLocalFile_open() {
                fs
                    .open(data.absolutepath, "r", function pdNodeLocal__readLocalFile_open_callback(err, fd) {
                        var msize = (data.size < 100)
                                ? data.size
                                : 100,
                            buff  = new Buffer(msize);
                        if (err !== null) {
                            return pdNodeLocal__readLocalFile(data);
                        }
                        fs
                            .read(fd, buff, 0, msize, 1, function pdNodeLocal__readLocalFile_open_callback_read(erra, bytes, buffer) {
                                if (erra !== null) {
                                    return pdNodeLocal__readLocalFile(data);
                                }
                                var bstring = buffer.toString("utf8", 0, buffer.length);
                                bstring = bstring.slice(2, bstring.length - 2);
                                if ((/[\u0002-\u0008]|[\u000e-\u001f]/).test(bstring) === true) {
                                    data.binary = true;
                                    readBinaryFile(data);
                                } else {
                                    data.binary = false;
                                    fs.readFile(data.absolutepath, {
                                        encoding: "utf8"
                                    }, function pdNodeLocal__readLocalFile_open_callback_read_readFile(errb, dump) {
                                        if (errb !== null && errb !== undefined) {
                                            return pdNodeLocal__readLocalFile(data);
                                        }
                                        if (data.file === undefined) {
                                            data.file = "";
                                        }
                                        data.file += dump;
                                        fileComplete(data);
                                        return bytes;
                                    });
                                }
                            });
                    });
            };
            if (data.size === undefined) {
                fs
                    .stat(data.absolutepath, function pdNodeLocal__readLocalFile_stat(errx, stat) {
                        if (errx !== null) {
                            if ((typeof errx === "string" && errx.indexOf("no such file or directory") > 0) || (typeof errx === "object" && errx.code === "ENOENT")) {
                                return console.log(errx);
                            }
                            return pdNodeLocal__readLocalFile(data);
                        }
                        data.size = stat.size;
                        if (data.size > 0) {
                            open();
                        } else {
                            data.binary = false;
                            data.file   = "";
                            fileComplete(data);
                        }
                    });
            } else {
                if (data.size > 0) {
                    open();
                } else {
                    data.binary = false;
                    fileComplete(data);
                }
            }
        },

        //resolve file contents from a web address executed from init
        readHttpFile   = function pdNodeLocal__readHttpFile(data) {
            var file = ["", 0];
            http.get(data.absolutepath, function pdNodeLocal__readHttpFile_get(res) {
                file[1] = Number(res.headers["content-length"]);
                res.setEncoding("utf8");
                res.on("data", function pdNodeLocal__readHttpFile_get_response(chunk) {
                    file[0] += chunk;
                    if (file[0].length === file[1]) {
                        data.file = file[0];
                        if (data.type === "diff") {
                            dfiledump[data.index] = file[0];
                        } else {
                            sfiledump[data.index] = file[0];
                        }
                        fileComplete(data);
                    }
                });
            });
        },

        //gather files in directory and sub directories executed from init
        directory      = function pdNodeLocal__directory() {
            // the following four are necessary because you can walk a directory tree from a
            // relative path but you cannot read file contents with a relative path in node
            // at this time
            var sfiles  = {
                    abspath    : [],
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                dfiles  = {
                    abspath    : [],
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                readDir = function pdNodeLocal__directory_readDir(start, listtype) {
                    fs
                        .stat(start, function pdNodeLocal__directory_readDir_stat(erra, stat) {
                            var item    = {},
                                dirtest = function pdNodeLocal__directory_readDir_stat_dirtest(itempath) {
                                    var pusher     = function pdNodeLocal__directory_readDir_stat_dirtest_pusher(itempath) {
                                            if (listtype === "diff") {
                                                dfiles
                                                    .filepath
                                                    .push([
                                                        itempath.replace(address.dabspath + path.sep, ""),
                                                        itempath
                                                    ]);
                                            } else if (listtype === "source") {
                                                sfiles
                                                    .filepath
                                                    .push([
                                                        itempath.replace(address.sabspath + path.sep, ""),
                                                        itempath
                                                    ]);
                                            }
                                            item.count += 1;
                                        },
                                        preprocess = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess() {
                                            var b      = 0,
                                                length = (options.mode === "diff")
                                                    ? Math.min(sfiles.filepath.length, dfiles.filepath.length)
                                                    : sfiles.filepath.length,
                                                end    = false,
                                                sizer  = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer(index, type, filename, finalone) {
                                                    fs
                                                        .stat(filename[1], function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer_stat(errc, statb) {
                                                            var filesize = 0;
                                                            if (errc === null) {
                                                                filesize = statb.size;
                                                            }
                                                            readLocalFile({
                                                                absolutepath: filename[1],
                                                                index       : index,
                                                                last        : finalone,
                                                                localpath   : filename[0],
                                                                size        : filesize,
                                                                type        : type
                                                            });
                                                        });
                                                },
                                                sorter = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sorter(a, b) {
                                                    if (a[0] < b[0]) {
                                                        return -1;
                                                    }
                                                    return 1;
                                                };
                                            sfiles
                                                .filepath
                                                .sort(sorter);
                                            if (options.mode === "diff") {
                                                dfiles
                                                    .filepath
                                                    .sort(sorter);
                                                for (b = 0; b < length; b += 1) {
                                                    dState.push(false);
                                                    sState.push(false);
                                                    sfiledump.push("");
                                                    dfiledump.push("");
                                                    if (sfiles.filepath[b][0] === dfiles.filepath[b][0]) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        sizer(b, "diff", dfiles.filepath[b], end);
                                                        sizer(b, "source", sfiles.filepath[b], end);
                                                    } else {
                                                        if (sfiles.filepath[b][0] < dfiles.filepath[b][0]) {
                                                            if (options.diffcli === true) {
                                                                clidata[0].push(sfiles.filepath[b][0]);
                                                            }
                                                            if (length === dfiles.filepath.length) {
                                                                length += 1;
                                                            }
                                                            dfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        } else if (dfiles.filepath[b][0] < sfiles.filepath[b][0]) {
                                                            if (options.diffcli === true) {
                                                                clidata[1].push(dfiles.filepath[b][0]);
                                                            }
                                                            if (length === sfiles.filepath.length) {
                                                                length += 1;
                                                            }
                                                            sfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        }
                                                        if (b === length - 1) {
                                                            ender();
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (options.output !== "") {
                                                    for (b = 0; b < length; b += 1) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        if (sfiles.filepath[b] !== undefined) {
                                                            sizer(b, "source", sfiles.filepath[b], end);
                                                        }
                                                    }
                                                } else {
                                                    ender();
                                                }
                                            }
                                        };
                                    if (itempath === "") {
                                        preprocess();
                                    } else {
                                        fs
                                            .stat(itempath, function pdNodeLocal__directory_readDir_stat_dirtest_stat(errb, stata) {
                                                if (errb !== null) {
                                                    return console.log(errb);
                                                }
                                                if (stata.isDirectory() === true) {
                                                    if (method === "subdirectory") {
                                                        item.directories += 1;
                                                        pdNodeLocal__directory_readDir(itempath, listtype);
                                                        item.count += 1;
                                                    }
                                                    if (method === "directory") {
                                                        item.total       -= 1;
                                                        item.directories = 0;
                                                    }
                                                } else if (stata.isFile() === true) {
                                                    pusher(itempath);
                                                } else {
                                                    if (listtype === "diff") {
                                                        dfiles.total -= 1;
                                                    } else {
                                                        sfiles.total -= 1;
                                                    }
                                                    console.log(itempath + lf + "is an unsupported type");
                                                }
                                                if (options.mode === "diff" && sfiles.count === sfiles.total && dfiles.count === dfiles.total && sfiles.directories === 0 && dfiles.directories === 0)  {
                                                    return preprocess();
                                                }
                                                if (options.mode !== "diff" && item.directories === 0 && item.count === item.total) {
                                                    return preprocess();
                                                }
                                            });
                                    }
                                };
                            if (erra !== null) {
                                return console.log(erra);
                            }
                            if (stat.isDirectory() === true) {
                                fs
                                    .readdir(start, function pdNodeLocal__directory_readDir_stat_readdir(errd, files) {
                                        var x         = 0,
                                            filetotal = files.length;
                                        if (errd !== null || filetotal === 0) {
                                            if (method === "subdirectory") {
                                                if (listtype === "diff") {
                                                    dfiles.directories -= 1;
                                                } else {
                                                    sfiles.directories -= 1;
                                                }
                                            }
                                            if (errd !== null) {
                                                return console.log(errd);
                                            }
                                            if ((options.mode === "diff" && sfiles.count === sfiles.total && dfiles.count === dfiles.total && sfiles.directories === 0 && dfiles.directories === 0) || (options.mode !== "diff" && sfiles.directories === 0 && sfiles.count === sfiles.total)) {
                                                dirtest("");
                                            }
                                            return;
                                        }
                                        if (listtype === "diff") {
                                            item = dfiles;
                                        } else {
                                            item = sfiles;
                                        }
                                        item.total += filetotal;
                                        for (x = 0; x < filetotal; x += 1) {
                                            if (x === filetotal - 1) {
                                                item.directories -= 1;
                                                dirtest(start + path.sep + files[x]);
                                            } else {
                                                dirtest(start + path.sep + files[x]);
                                            }
                                        }
                                    });
                            } else {
                                return console.log("path: " + start + " is not a directory");
                            }
                        });
                };
            readDir(address.sabspath, "source");
            if (options.mode === "diff") {
                readDir(address.dabspath, "diff");
            }
        };

    //defaults for the options
    (function pdNodeLocal__start() {
        var a         = process
                .argv
                .slice(2),
            b         = 0,
            c         = a.length,
            d         = [],
            e         = [],
            f         = 0,
            alphasort = false,
            outready  = false,
            pdrcpath  = __dirname.replace(/(api)$/, "") + ".prettydiffrc",
            pathslash = function pdNodeLocal__start_pathslash(name, x) {
                var y        = x.indexOf("://"),
                    z        = "",
                    itempath = "",
                    ind      = "",
                    odirs    = [],
                    olen     = 0,
                    basepath = "",
                    makeout  = function pdNodeLocal__start_pathslash_makeout() {
                        basepath = basepath + odirs[olen] + path.sep;
                        fs.mkdir(basepath, function pdNodeLocal__start_pathslash_makeout_mkdir(err) {
                            if (err !== undefined && err !== null && err.code !== "EEXIST") {
                                console.log(err);
                                outready = true;
                            } else if (olen < odirs.length) {
                                olen += 1;
                                if (olen < odirs.length) {
                                    pdNodeLocal__start_pathslash_makeout();
                                } else {
                                    outready = true;
                                }
                            } else {
                                outready = true;
                            }
                        });
                    },
                    abspath  = function pdNodeLocal__start_pathslash_abspath() {
                        var tree  = cwd.split(path.sep),
                            ups   = [],
                            uplen = 0;
                        if (itempath.indexOf("..") === 0) {
                            ups   = itempath
                                .replace(/\.\.\//g, ".." + path.sep)
                                .split(".." + path.sep);
                            uplen = ups.length;
                            do {
                                uplen -= 1;
                                tree.pop();
                            } while (uplen > 1);
                            return tree.join(path.sep) + path.sep + ups[ups.length - 1];
                        }
                        if ((/^([a-z]:(\\|\/))/).test(itempath) === true || itempath.indexOf(path.sep) === 0) {
                            return itempath;
                        }
                        return path.join(cwd, itempath);
                    };
                if (name === "diff") {
                    ind = 0;
                }
                if (name === "output") {
                    ind = 1;
                }
                if (name === "source") {
                    ind = 2;
                }
                if (x.indexOf("http://") === 0 || x.indexOf("https://") === 0) {
                    dir[ind] = 3;
                    return x;
                }
                if (y < 0) {
                    itempath = x.replace(/\\/g, "/");
                } else {
                    z        = x.slice(0, y);
                    x        = x.slice(y + 3);
                    itempath = z + "://" + x.replace(/\\/g, "/");
                }
                fs
                    .stat(itempath, function pdNodeLocal__start_pathslash_stat(err, stat) {
                        if (err !== null) {
                            dir[ind] = -1;
                            return "";
                        }
                        if (stat.isDirectory() === true) {
                            dir[ind] = 1;
                        } else if (stat.isFile() === true) {
                            dir[ind] = 2;
                            if (name === "output") {
                                outready = true;
                            }
                        } else {
                            dir[ind] = -1;
                            if (name === "output") {
                                outready = true;
                            }
                        }
                    });
                if (name === "diff") {
                    address.dabspath = abspath();
                    address.dorgpath = itempath;
                }
                if (name === "output") {
                    if (method === "file") {
                        outready = true;
                    } else if (x === ".") {
                        address.oabspath = cwd;
                        address.oorgpath = cwd;
                        outready         = true;
                    } else {
                        itempath         = itempath.replace(/\//g, path.sep);
                        address.oabspath = abspath();
                        address.oorgpath = itempath;
                        if (address.oabspath.charAt(address.oabspath.length - 1) !== path.sep) {
                            address.oabspath = address.oabspath + path.sep;
                        }
                        basepath = address
                            .oabspath
                            .replace(path.sep + address.oorgpath, "");
                        odirs    = address
                            .oorgpath
                            .split(path.sep);
                        makeout();
                    }
                }
                if (name === "source") {
                    address.sabspath = abspath();
                    address.sorgpath = itempath;
                }
                return itempath;
            };
        for (b = 0; b < c; b += 1) {
            e = [];
            f = a[b].indexOf(":");
            e.push(a[b].substring(0, f).replace(/(\s+)$/, ""));
            e.push(a[b].substring(f + 1).replace(/^(\s+)/, ""));
            d.push(e);
        }
        c = d.length;
        for (b = 0; b < c; b += 1) {
            if (d[b].length === 2) {
                if (options.version === false && options.listoptions === false && d[b][0] === "" && (d[b][1] === "help" || d[b][1] === "man" || d[b][1] === "manual")) {
                    help = true;
                } else if (help === false && d[b][0] === "" && (d[b][1] === "v" || d[b][1] === "version")) {
                    options.version = true;
                } else if (help === false && d[b][0] === "" && (d[b][1] === "l" || d[b][1] === "list")) {
                    options.listoptions = true;
                } else if (d[b][0] === "api") {
                    options.api = "node";
                } else if (d[b][0] === "attributetoken" && d[b][1] === "true") {
                    options.attributetoken = true;
                } else if (d[b][0] === "braceline" && d[b][1] === "true") {
                    options.braceline = true;
                } else if (d[b][0] === "bracepadding" && d[b][1] === "true") {
                    options.bracepadding = true;
                } else if ((d[b][0] === "braces" && d[b][1] === "allman") || (d[b][0] === "indent" && d[b][1] === "allman")) {
                    options.braces = "allman";
                } else if (d[b][0] === "color" && (d[b][1] === "canvas" || d[b][1] === "shadow")) {
                    options.color = d[b][1];
                } else if (d[b][0] === "comments" && d[b][1] === "noindent") {
                    options.comments = "noindent";
                } else if (d[b][0] === "commline" && d[b][1] === "true") {
                    options.commline = true;
                } else if (d[b][0] === "compressedcss" && d[b][1] === "true") {
                    options.compressedcss = true;
                } else if (d[b][0] === "conditional" && d[b][1] === "true") {
                    options.conditional = true;
                } else if (d[b][0] === "content" && d[b][1] === "true") {
                    options.content = true;
                } else if (d[b][0] === "context" && isNaN(d[b][1]) === false) {
                    options.context = Number(d[b][1]);
                } else if (d[b][0] === "correct" && d[b][1] === "true") {
                    options.correct = true;
                } else if (d[b][0] === "crlf" && d[b][1] === "true") {
                    options.crlf = true;
                    lf           = "\r\n";
                } else if (d[b][0] === "cssinsertlines" && d[b][1] === "true") {
                    options.cssinsertlines = true;
                } else if (d[b][0] === "csvchar" && d[b][1].length > 0) {
                    options.csvchar = d[b][1];
                } else if (d[b][0] === "diff" && d[b][1].length > 0) {
                    options.diff = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "diffcli" && d[b][1] === "true") {
                    options.diffcli = true;
                } else if (d[b][0] === "diffcomments" && d[b][1] === "true") {
                    options.diffcomments = true;
                } else if (d[b][0] === "difflabel" && d[b][1].length > 0) {
                    options.difflabel = d[b][1];
                } else if (d[b][0] === "diffspaceignore" && d[b][1] === "true") {
                    options.diffspaceignore = true;
                } else if (d[b][0] === "diffview" && d[b][1] === "inline") {
                    options.diffview = "inline";
                } else if (d[b][0] === "dustjs" && d[b][1] === "true") {
                    options.dustjs = true;
                } else if (d[b][0] === "elseline" && d[b][1] === "true") {
                    options.elseline = true;
                } else if (d[b][0] === "endcomma" && d[b][1] === "true") {
                    options.endcomma = true;
                } else if (d[b][0] === "endquietly") {
                    if (d[b][1] === "quiet") {
                        enderflag = true;
                        options.endquietly = "quiet";
                    } else if (d[b][1] === "log") {
                        options.endquietly = "log";
                    }
                } else if (d[b][0] === "force_attribute" && d[b][1] === "true") {
                    options.force_attribute = true;
                } else if (d[b][0] === "force_indent" && d[b][1] === "true") {
                    options.force_indent = true;
                } else if (d[b][0] === "formatArray" && (d[b][1] === "indent" || d[b][1] === "inline")) {
                    options.formatArray = d[b][1];
                } else if (d[b][0] === "formatObject" && (d[b][1] === "indent" || d[b][1] === "inline")) {
                    options.formatObject = d[b][1];
                } else if (d[b][0] === "functionname" && d[b][1] === "true") {
                    options.functionname = true;
                } else if (d[b][0] === "html" && d[b][1] === "true") {
                    options.html = true;
                } else if (d[b][0] === "inchar" && d[b][1].length > 0) {
                    d[b][1]        = d[b][1]
                        .replace(/\\t/g, "\u0009")
                        .replace(/\\n/g, "\u000a")
                        .replace(/\\r/g, "\u000d")
                        .replace(/\\f/g, "\u000c")
                        .replace(/\\b/g, "\u0008");
                    options.inchar = d[b][1];
                } else if (d[b][0] === "inlevel" && isNaN(d[b][1]) === false) {
                    options.inlevel = Number(d[b][1]);
                } else if (d[b][0] === "insize" && isNaN(d[b][1]) === false) {
                    options.insize = Number(d[b][1]);
                } else if (d[b][0] === "jekyll" && d[b][1] === "true") {
                    options.jekyll = true;
                } else if (d[b][0] === "jsscope") {
                    if (d[b][1] === "true") {
                        options.jsscope = "report";
                    } else if (d[b][1] === "report" || d[b][1] === "html") {
                        options.jsscope = d[b][1];
                    } else {
                        options.jsscope = "none";
                    }
                } else if (d[b][0] === "lang" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv" || d[b][1] === "text")) {
                    options.lang = d[b][1];
                    if (d[b][1] === "html") {
                        options.html = true;
                    }
                } else if (d[b][0] === "langdefault" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv")) {
                    options.langdefault = d[b][1];
                } else if (d[b][0] === "methodchain") {
                    if (d[b][1] === "true" || d[b][1] === "chain") {
                        options.methodchain = "chain";
                    } else if (d[b][1] === "none") {
                        options.methodchain = "none";
                    } else {
                        options.methodchain = "indent";
                    }
                } else if (d[b][0] === "miniwrap" && d[b][1] === "true") {
                    options.miniwrap = true;
                } else if (d[b][0] === "mode" && (d[b][1] === "minify" || d[b][1] === "beautify" || d[b][1] === "parse" || d[b][1] === "analysis")) {
                    options.mode = d[b][1];
                } else if (d[b][0] === "neverflatten" && d[b][1] === "true") {
                    options.neverflatten = true;
                } else if (d[b][0] === "nocaseindent" && d[b][1] === "true") {
                    options.nocaseindent = true;
                } else if (d[b][0] === "nochainindent" && d[b][1] === "true") {
                    options.nochainindent = true;
                } else if (d[b][0] === "noleadzero" && d[b][1] === "true") {
                    options.noleadzero = true;
                } else if (d[b][0] === "objsort") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js" || d[b][1] === "markup") {
                        options.objsort = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.objsort = "js";
                    }
                } else if (d[b][0] === "output" && d[b][1].length > 0) {
                    options.output = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "parseFormat" && (d[b][1] === "sequential" || d[b][1] === "htmltable")) {
                    options.parseFormat = d[b][1];
                } else if (d[b][0] === "parseSpace" && d[b][1] === "true") {
                    options.parseSpace = true;
                } else if (d[b][0] === "preserve") {
                    if (d[b][1] === 1 || d[b][1] === undefined || d[b][1] === "true" || d[b][1] === "all" || d[b][1] === "js" || d[b][1] === "css") {
                        options.preserve = 1;
                    } else if (d[b][1] === "false" || isNaN(d[b][1]) === true || Number(d[b][1]) < 1 || d[b][1] === "none") {
                        options.preserve = 0;
                    } else {
                        options.preserve = Number(d[b][1]);
                    }
                } else if (d[b][0] === "qml" && d[b][1] === "true") {
                    options.qml = true;
                } else if (d[b][0] === "quote" && d[b][1] === "true") {
                    options.quote = true;
                } else if (d[b][0] === "quoteConvert" && (d[b][1] === "single" || d[b][1] === "double")) {
                    options.quoteConvert = d[b][1];
                } else if (d[b][0] === "readmethod") {
                    if (d[b][1] === "auto") {
                        options.readmethod = "auto";
                    }
                    if (d[b][1] === "file") {
                        options.readmethod = "file";
                    }
                    if (d[b][1] === "filescreen") {
                        options.readmethod = "filescreen";
                    }
                    if (d[b][1] === "directory") {
                        options.readmethod = "directory";
                    }
                    if (d[b][1] === "subdirectory") {
                        options.readmethod = "subdirectory";
                    }
                    method = options.readmethod;
                } else if (d[b][0] === "selectorlist" && d[b][1] === "true") {
                    options.selectorlist = true;
                } else if (d[b][0] === "semicolon" && d[b][1] === "true") {
                    options.semicolon = true;
                } else if (d[b][0] === "source" && d[b][1].length > 0) {
                    options.source = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "sourcelabel" && d[b][1].length > 0) {
                    options.sourcelabel = d[b][1];
                } else if (d[b][0] === "space" && d[b][1] === "false") {
                    options.space = false;
                } else if (d[b][0] === "spaceclose" && d[b][1] === "true") {
                    options.spaceclose = true;
                } else if (d[b][0] === "style" && d[b][1] === "noindent") {
                    options.style = "noindent";
                } else if (d[b][0] === "styleguide") {
                    options.styleguide = d[b][1];
                } else if (d[b][0] === "summaryonly" && d[b][1] === "true") {
                    options.summaryonly = true;
                } else if (d[b][0] === "tagmerge" && d[b][1] === "true") {
                    options.tagmerge = true;
                } else if (d[b][0] === "tagsort" && d[b][1] === "true") {
                    options.tagsort = true;
                } else if (d[b][0] === "ternaryline" && d[b][1] === "true") {
                    options.ternaryline = true;
                } else if (d[b][0] === "textpreserve" && d[b][1] === "true") {
                    options.textpreserve = true;
                } else if (d[b][0] === "titanium" && d[b][1] === "true") {
                    options.titanium = true;
                } else if (d[b][0] === "topcoms" && d[b][1] === "true") {
                    options.topcoms = true;
                } else if (d[b][0] === "unformatted" && d[b][1] === "true") {
                    options.unformatted = true;
                } else if (d[b][0] === "varword" && (d[b][1] === "each" || d[b][1] === "list")) {
                    options.varword = d[b][1];
                } else if (d[b][0] === "vertical") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js") {
                        options.vertical = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.vertical = "all";
                    }
                } else if (d[b][0] === "wrap") {
                    if (isNaN(d[b][1]) === true) {
                        options.wrap = 80;
                    } else {
                        options.wrap = Number(d[b][1]);
                    }
                }
            } else if (help === false && options.version === false) {
                if (d[b] === "help" || d[b][0] === "help" || d[b][0] === "man" || d[b][0] === "manual") {
                    help = true;
                } else if (d[b] === "v" || d[b] === "version" || d[b][0] === "v" || d[b][0] === "version") {
                    options.version = true;
                } else if (d[b] === "l" || d[b] === "list" || d[b][0] === "l" || d[b][0] === "list") {
                    options.listoptions = true;
                }
            }
        }

        if (options.output === "") {
            outready = true;
        }

        fs
            .stat(pdrcpath, function pdNodeLocal__start_stat(err, stats) {
                var init = function pdNodeLocal__start_stat_init() {
                    var state   = true,
                        cliflag = false,
                        status  = function pdNodeLocal__start_stat_init_status() {
                            var tempaddy = "";
                            // status codes
                            //* -1 is not file or directory
                            //* 0 is status pending
                            //* 1 is directory
                            //* 2 is file 3 is file via http/s
                            //
                            //* dir[0] - diff
                            //* dir[1] - output
                            //* dir[2] - source
                            if (dir[2] === 0) {
                                return;
                            }
                            if (method === "auto") {
                                if (dir[2] === 1) {
                                    method = "subdirectory";
                                } else if (dir[2] > 1) {
                                    if (options.output === "") {
                                        method = "filescreen";
                                    } else {
                                        if (options.output === "" && options.mode !== "diff") {
                                            console.log("");
                                            console.log("\x1B[91mNo output option is specified, so no files written.\x1B[39m");
                                            console.log("");
                                        }
                                        method = "file";
                                        if (options.output === "") {
                                            return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                                        }
                                    }
                                } else if (dir[2] < 0) {
                                    method = "screen";
                                }
                            }
                            if (dir[2] < 0) {
                                state = false;
                                if (options.readmethod === "screen" && options.mode !== "diff") {
                                    return screenWrite();
                                }
                                if (options.readmethod !== "screen") {
                                    if (options.readmethod === "auto") {
                                        method = "screen";
                                        if (options.mode !== "diff") {
                                            return screenWrite();
                                        }
                                    } else {
                                        return console.log("source is not a directory or file");
                                    }
                                }
                            }
                            if (dir[2] === 1 && method !== "directory" && method !== "subdirectory") {
                                state = false;
                                return console.log("source is a directory but readmethod option is not 'auto', 'directory', or 'subd" +
                                        "irectory'");
                            }
                            if (dir[2] > 1) {
                                if (method === "directory" || method === "subdirectory") {
                                    state = false;
                                    return console.log("source is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (method === "screen") {
                                    method = "filescreen";
                                }
                            }
                            if (options.mode === "diff") {
                                if (dir[0] === 0 || dir[2] === 0) {
                                    return;
                                }
                                if (dir[0] < 0) {
                                    state = false;
                                    if (options.readmethod === "auto" || (dir[2] < 0 && options.readmethod === "screen")) {
                                        if (options.readmethod === "auto" && method === "screen" && cliflag === true && options.diffcli === false) {
                                            options.diffcli = false;
                                        }
                                        if (options.diffcli === true) {
                                            return cliWrite(prettydiff(), "", false);
                                        }
                                        return screenWrite();
                                    }
                                    return console.log("diff is not a directory or file");
                                }
                                if (dir[0] === 1 && method !== "directory" && method !== "subdirectory") {
                                    state = false;
                                    return console.log("diff is a directory but readmethod option is not 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 2 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return console.log("diff is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 1 && method === "screen") {
                                    method = "filescreen";
                                }
                                if (dir[0] > 1 && dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = false;
                                    dState.push(false);
                                    sState.push(false);
                                    if (dir[0] === 3) {
                                        readHttpFile({absolutepath: options.diff, index: 0, last: true, localpath: options.diff, type: "diff"});
                                    } else {
                                        tempaddy = options
                                            .diff
                                            .replace(/(\/|\\)/g, path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "diff"});
                                    }
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        tempaddy = options
                                            .source
                                            .replace(/(\/|\\)/g, path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[0] === 1 && dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    options.nodeasync = true;
                                    return directory();
                                }
                            } else {
                                if (dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = false;
                                    sState.push(false);
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        readLocalFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    options.nodeasync = true;
                                    return directory();
                                }
                            }
                        },
                        delay   = function pdNodeLocal__start_stat_init_delay() {
                            if (state === true || outready === false) {
                                status();
                                setTimeout(function pdNodeLocal__start_stat_init_delay_setTimeout() {
                                    pdNodeLocal__start_stat_init_delay();
                                }, 50);
                            }
                        };
                    if (alphasort === true) {
                        options.objsort = "all";
                    }
                    if (options.lang === "tss") {
                        options.titanium = true;
                        options.lang     = "javascript";
                    }
                    if (options.mode !== "diff") {
                        options.diffcli     = false;
                        options.summaryonly = false;
                    }
                    if (options.summaryonly === true) {
                        options.diffcli = true;
                    }

                    if (help === true) {
                        return console.log(error);
                    }
                    if (c === 1 && options.version === true) {
                        return console.log(versionString);
                    }
                    if (options.listoptions === true) {
                        (function pdNodeLocal__start_stat_init_listoptions() {
                            var sample = JSON.stringify(options),
                                mode   = options.mode,
                                source = options.source,
                                vert   = options.vertical;
                            options.mode     = "beautify";
                            options.source   = sample;
                            options.vertical = "all";
                            sample           = pdapp.api(options);
                            console.log("");
                            console.log(colors.filepath.start + "Current option settings:" + colors.filepath.end);
                            console.log(sample.slice(1, sample.length - 1));
                            options.mode     = mode;
                            options.source   = source;
                            options.vertical = vert;
                        }());
                        if (c === 1) {
                            return;
                        }
                    }
                    if (options.source === "") {
                        return console.log("Error: 'source' argument is empty");
                    }
                    if (options.mode === "diff" && options.diff === "") {
                        return console.log("Error: 'diff' argument is empty");
                    }
                    if ((options.output === "" || options.summaryonly === true) && options.mode === "diff") {
                        if (options.readmethod !== "screen") {
                            if (options.readmethod === "auto") {
                                cliflag = true;
                            } else {
                                options.diffcli = true;
                            }
                        }
                        if (process.argv.join(" ").indexOf(" context:") === -1) {
                            options.context = 2;
                        }
                    }
                    if (method === "file" && options.output === "" && options.summaryonly === false && options.diffcli === false) {
                        return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                    }
                    if (dir[2] === 0 || outready === false || (options.mode === "diff" && dir[0] === 0)) {
                        delay();
                    } else {
                        status();
                    }
                };

                if (err !== null) {
                    if (c === 0) {
                        help = true;
                    }
                    init();
                } else if (stats.isFile() === true) {
                    fs
                        .readFile(pdrcpath, {
                            encoding: "utf8"
                        }, function pdNodeLocal__start_stat_readFile(error, data) {
                            var s       = options.source,
                                dd      = options.diff,
                                o       = options.output,
                                h       = false,
                                pdrc    = {},
                                pdkeys  = [],
                                eachkey = function pdNodeLocal__start_stat_readFile_eachkey(val) {
                                    if (val !== "help" && val !== "version" && val !== "v" && val !== "man" && val !== "manual") {
                                        b += 1;
                                        if (options[val] !== undefined) {
                                            options[val] = pdrc[val];
                                            if (val === "help" && pdrc[val] === true) {
                                                h = true;
                                                b -= 1;
                                            }
                                        }
                                    }
                                };
                            if (error !== null && error !== undefined) {
                                return init();
                            }
                            if ((/^(\s*\{)/).test(data) === true && (/(\}\s*)$/).test(data) === true) {
                                pdrc   = JSON.parse(data);
                                pdkeys = Object.keys(pdrc);
                                b      = 0;
                                pdkeys.forEach(eachkey);
                                if (b > 0 && h === false) {
                                    help = false;
                                }
                                method = options.readmethod;
                                if (s !== options.source) {
                                    pathslash("source", options.source);
                                }
                                if (dd !== options.diff) {
                                    pathslash("diff", options.diff);
                                }
                                if (o !== options.output) {
                                    pathslash("output", options.output);
                                }
                                init();
                            } else {
                                pdrc = require(pdrcpath);
                                if (pdrc.preset !== undefined) {
                                    options = pdrc.preset(options);
                                    method  = options.readmethod;
                                    if (s !== options.source) {
                                        pathslash("source", options.source);
                                    }
                                    if (dd !== options.diff) {
                                        pathslash("diff", options.diff);
                                    }
                                    if (o !== options.output) {
                                        pathslash("output", options.output);
                                    }
                                    help = false;
                                    if (options.help === true && options.version === false && options.listoptions === false && (process.argv.length < 3 || options.source === undefined || options.source === "")) {
                                        help = true;
                                    }
                                    init();
                                }
                            }
                        });
                } else {
                    init();
                }
                if (c === 0) {
                    help = true;
                }
            });
    }());
}());
