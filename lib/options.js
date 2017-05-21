/*global __dirname, ace, define, global, module, process, require, WScript*/
/*jslint for: true, this: true*/
/*

 Please see the license.txt file associated with the Pretty Diff
 application for license information.

 How to define a new option:

 1. definitions - define the option
 2. validate    - logic to assign values against accepted criteria
 3. pdcomment   - only necessary if option is string type with a list of accepted values
 4. domops      - associate ID names (from HTML) to values for populating the pretty diff comment in the web tool

 Functions map:

 * definitions   - a big object defining all the options
 * default       - pulls default values out of the definitions object. This is necessary to prevent collisions when processing multiple files simultanesouly
 * versionString - a function to build out human readable messaging about the current version from data in prettydiff.js
 * consolePrint  - a handy function to print documentation on all options and usage data to the console in the browser or command line.
    ** to execute in the browser console: global.prettydiff.options.functions.consolePrint()
    ** or use the alias document.consolePrint() from api/dom.js
 * pdcomment     - processes option overrides from the prettydiff.com code comment
 * validate      - process user input against supported options and their acceptable values.  I have plans to merge this into the definitions object
 * domops        - updates the comment string that appears in the options area of the web tool
 * node          - parses node arguments into options for submission to the validate function
 * binary        - a handy dandy tool to remove control characters from text output
*/
(function options_init() {
    "use strict";
    var options = {
        functions: {}
    };
    global.prettydiff.options = options;
    options.functions.definitions   = {
        apacheVelocity : {
            type      : "boolean",
            definition: "Provides support for Apache Velocity template language.",
            default   : false
        },
        api            : {
            type      : "string",
            definition: "An enternal option to help identify environment specific needs.",
            default   : false
        },
        attributetoken : {
            type      : "boolean",
            definition: "Provides markups attributes as separate tokens in the parse table of mode pars" +
                    "e, otherwise attributes are a data property of their respective element.",
            default   : false
        },
        brace_style    : {
            type      : "string",
            definition: "Emulates JSBeautify's brace_style option using existing Pretty Diff options.",
            values    : [
                "collapse", "collapse-preserve-inline", "expand", "none"
            ],
            default   : "none"
        },
        braceline      : {
            type      : "boolean",
            definition: "If true a new line character will be inserted after opening curly braces and b" +
                    "efore closing curly braces.",
            default   : false
        },
        bracepadding   : {
            type      : "boolean",
            definition: "Inserts a space after the start of a contain and before the end of the contain" +
                    "er in JavaScript if the contents of that container are not indented; such as: " +
                    "conditions, function arguments, and escaped sequences of template strings.",
            default   : false
        },
        braces         : {
            type      : "string",
            definition: "If lang is 'javascript' and mode is 'beautify' this determines if opening curl" +
                    "y braces will exist on the same line as their condition or be forced onto a ne" +
                    "w line.",
            values    : [
                "knr", "allman"
            ],
            default   : "knr"
        },
        color          : {
            type      : "string",
            definition: "The color scheme of the reports.",
            default   : "white",
            values    : ["canvas", "shadow", "white"]
        },
        comments       : {
            type      : "string",
            definition: "If mode is 'beautify' this will determine whether comments should always start" +
                    " at position 0 of each line or if comments should be indented according to the" +
                    " code.",
            default   : "indent",
            values    : ["indent", "noindent"]
        },
        commline       : {
            type      : "boolean",
            definition: "If a blank new line should be forced above comments in markup.",
            default   : false
        },
        compressedcss  : {
            type      : "boolean",
            definition: "If CSS should be beautified in a style where the properties and values are min" +
                    "ifed for faster reading of selectors.",
            default   : false
        },
        conditional    : {
            type      : "boolean",
            definition: "If true then conditional comments used by Internet Explorer are preserved at m" +
                    "inification of markup.",
            default   : false
        },
        content        : {
            type      : "boolean",
            definition: "If true and mode is 'diff' this will normalize all string literals in JavaScri" +
                    "pt to 'text' and all content in markup to 'text' so as to eliminate some diffe" +
                    "rences from the HTML diff report.",
            default   : false
        },
        context        : {
            type      : "number",
            definition: "This shortens the diff output by allowing a specified number of equivalent lin" +
                    "es between each line of difference.",
            default   : -1
        },
        correct        : {
            type      : "boolean",
            definition: "Automatically correct some sloppiness in JavaScript and markup.",
            default   : false
        },
        crlf           : {
            type      : "boolean",
            definition: "If line termination should be Windows (CRLF) format.  Unix (LF) format is the " +
                    "default.",
            default   : false
        },
        cssinsertlines : {
            type      : "boolean",
            definition: "Inserts new line characters between every CSS code block.",
            default   : false
        },
        csvchar        : {
            type      : "string",
            definition: "The character to be used as a separator if lang is 'csv'.  Any string combinat" +
                    "ion is accepted.",
            default   : ","
        },
        diff           : {
            type      : "string",
            definition: "The code sample to be compared to 'source' option. This is required if mode is" +
                    " 'diff'.",
            default   : ""
        },
        diffcli        : {
            type      : "boolean",
            definition: "If true only text lines of the code differences are returned instead of an HTM" +
                    "L diff report.",
            default   : false
        },
        diffcomments   : {
            type      : "boolean",
            definition: "If true then comments will be preserved so that both code and comments are com" +
                    "pared by the diff engine.",
            default   : false
        },
        difflabel      : {
            type      : "string",
            definition: "This allows for a descriptive label for the diff file code of the diff HTML ou" +
                    "tput.",
            default   : "New Sample"
        },
        diffspaceignore: {
            type      : "boolean",
            definition: "If white space only differences should be ignored by the diff tool.",
            default   : false
        },
        diffview       : {
            type      : "string",
            definition: "This determines whether the diff HTML output should display as a side-by-side " +
                    "comparison or if the differences should display in a single table column.",
            values    : [
                "inline", "sidebyside"
            ],
            default   : "sidebyside"
        },
        dustjs         : {
            type      : "boolean",
            definition: "If the provided markup code is a Dust.js template.",
            default   : false
        },
        elseline       : {
            type      : "boolean",
            definition: "If elseline is true then the keyword 'else' is forced onto a new line in JavaS" +
                    "cript beautification.",
            default   : false
        },
        endcomma       : {
            type      : "string",
            definition: "If there should be a trailing comma in JavaScript arrays and objects. Value \"" +
                    "multiline\" only applies to modes beautify and diff.",
            values    : [
                "always", "multiline", "never"
            ],
            default   : "never"
        },
        endquietly     : {
            type      : "string",
            definition: "A node only option to determine if terminal logging should be allowed or suppr" +
                    "essed.",
            values    : [
                "", "log", "quiet"
            ],
            default   : ""
        },
        force_attribute: {
            type      : "boolean",
            definition: "If all markup attributes should be indented each onto their own line.",
            default   : false
        },
        force_indent   : {
            type      : "boolean",
            definition: "If lang is 'markup' this will force indentation upon all content and tags with" +
                    "out regard for the creation of new text nodes.",
            default   : false
        },
        formatArray    : {
            type      : "string",
            definition: "Determines if all JavaScript array indexes should be indented, never indented," +
                    " or left to the default.",
            values    : [
                "default", "indent", "inline"
            ],
            default   : "default"
        },
        formatObject   : {
            type      : "string",
            definition: "Determines if all JavaScript array indexes should be indented, never indented," +
                    " or left to the default.",
            values    : [
                "default", "indent", "inline"
            ],
            default   : "default"
        },
        functionname   : {
            type      : "boolean",
            definition: "If a space should follow a JavaScript function name.",
            default   : false
        },
        help           : {
            type      : "number",
            definition: "A node only option to print documentation to the console. The value determines" +
                    " where to wrap text.",
            default   : 80
        },
        html           : {
            type      : "boolean",
            definition: "If lang is 'markup' this will provide extra support for HTML specific sloppine" +
                    "ss.",
            default   : false
        },
        inchar         : {
            type      : "string",
            definition: "The string characters to comprise a single indentation. Any string combination" +
                    " is accepted.",
            default   : " "
        },
        inlevel        : {
            type      : "number",
            definition: "How much indentation padding should be applied to JavaScript beautification?",
            default   : 0
        },
        insize         : {
            type      : "number",
            definition: "The number of characters to comprise a single indentation.",
            default   : 4
        },
        jekyll         : {
            type      : "boolean",
            definition: "If YAML Jekyll HTML template comments are supported.",
            default   : false
        },
        jsscope        : {
            type      : "string",
            definition: "An educational tool to generate HTML output of JavaScript code to identify sco" +
                    "pe regions and declared references by color.",
            values    : {
                none  : "prevents use of this option",
                report: "generates HTML output that renders in web browsers",
                html  : "generates HTML output with escaped angle braces and ampersands for embedding a" +
                        "s code, which is handy in code producing tools"
            },
            default   : "none"
        },
        jsx            : {
            type      : "boolean",
            definition: "An internal flag used to identify if a given code sample is React JSX code.",
            default   : false
        },
        lang           : {
            type      : "string",
            definition: "The programming language of the source file.",
            values    : [
                "auto",
                "markup",
                "javascript",
                "css",
                "html",
                "csv",
                "text"
            ],
            default   : "auto"
        },
        langdefault    : {
            type      : "string",
            definition: "The fallback option if option 'lang' is set to 'auto' and a language cannot be" +
                    " detected.",
            values    : [
                "markup",
                "javascript",
                "css",
                "html",
                "csv",
                "text"
            ],
            default   : "text"
        },
        listoptions    : {
            type      : "boolean",
            definition: "A Node.js only option that writes current option settings to the console.",
            default   : false
        },
        methodchain    : {
            type      : "string",
            definition: "Whether consecutive JavaScript methods should be chained onto a single line of" +
                    " code instead of indented.",
            values    : [
                "chain", "indent", "none"
            ],
            default   : "indent"
        },
        miniwrap       : {
            type      : "boolean",
            definition: "Whether minified JavaScript should wrap after a specified character width.  Th" +
                    "is option requires a value from option 'wrap'.",
            default   : false
        },
        mode           : {
            type      : "string",
            definition: "The operation to be performed.",
            values    : {
                analysis: "returns a code examination report",
                beautify: "beautifies code and returns a string",
                diff    : "returns either command line list of differences or an HTML report",
                minify  : "minifies code and returns a string",
                parse   : "using option 'parseFormat' returns an object with shallow arrays, a multidimen" +
                        "sional array, or an HTML report"
            },
            default   : "diff"
        },
        newline        : {
            type      : "boolean",
            definition: "Insert an empty line at the end of output.",
            default   : false
        },
        neverflatten   : {
            type      : "boolean",
            definition: "If destructured lists in JavaScript should never be flattend.",
            default   : false
        },
        nocaseindent   : {
            type      : "boolean",
            definition: "If a case statement should receive the same indentation as the containing swit" +
                    "ch block.",
            default   : false
        },
        nochainindent  : {
            type      : "boolean",
            definition: "If indentation should be prevent of JavaScript method chains broken onto multi" +
                    "ple lines.",
            default   : false
        },
        nodeasync      : {
            type      : "boolean",
            definition: "An internal option manage processing of multiple files simultanously",
            default   : false
        },
        nodeerror      : {
            type      : "boolean",
            definition: "A Node.js only option if parse errors should be written to the console.",
            default   : false
        },
        noleadzero     : {
            type      : "boolean",
            definition: "Whether leading 0s in CSS values immediately preceeding a decimal should be re" +
                    "moved or prevented.",
            default   : false
        },
        objsort        : {
            type      : "string",
            definition: "Sorts markup attributes and properties by key name in JavaScript and CSS.",
            values    : [
                "all", "css", "js", "markup", "none"
            ],
            default   : "none"
        },
        output         : {
            type      : "string",
            definition: "The path of the directory, if readmethod is value 'directory', or path and nam" +
                    "e of the file to write the output.  The path will be created or overwritten.",
            default   : ""
        },
        parseFormat    : {
            type      : "string",
            definition: "Determines the output format for 'parse' mode.",
            values    : {
                htmltable : "generates a human readable report in the format of an HTML table",
                parallel  : "returns a series of parallel arrays",
                sequential: "returns an array where each index is a child array containing the parsed token" +
                        " and all descriptive data"
            },
            default   : "parallel"
        },
        parseSpace     : {
            type      : "boolean",
            definition: "Whether whitespace tokens should be included.",
            default   : false
        },
        preserve       : {
            type      : "number",
            definition: "The maximum number of empty lines to retain.",
            default   : 0
        },
        preserveComment: {
            type      : "boolean",
            definition: "Prevent comment reformatting due to option wrap.",
            default   : false
        },
        qml            : {
            type      : "boolean",
            definition: "Enables QML syntax support in the jspretty library.",
            default   : false
        },
        quote          : {
            type      : "boolean",
            definition: "If true and mode is 'diff' then all single quote characters will be replaced b" +
                    "y double quote characters in both the source and diff file input so as to elim" +
                    "inate some differences from the diff report HTML output.",
            default   : false
        },
        quoteConvert   : {
            type      : "string",
            definition: "If the quotes of JavaScript strings or markup attributes should be converted t" +
                    "o single quotes or double quotes.",
            values    : [
                "double", "single", "none"
            ],
            default   : "none"
        },
        readmethod     : {
            type      : "string",
            definition: "The readmethod determines how Node.js should receive input and output.",
            values    : {
                auto        : "changes to value subdirectory, file, or screen depending on source resolution",
                screen      : "reads from screen and outputs to screen",
                file        : "reads a file and outputs to a file.  file requires option 'output'",
                filescreen  : "reads a file and writes to screen",
                directory   : "process all files in the specified directory only",
                subdirectory: "process all files in a directory and its subdirectories"
            },
            default   : "auto"
        },
        selectorlist   : {
            type      : "boolean",
            definition: "If comma separated CSS selectors should be retained on a single line of code.",
            default   : false
        },
        semicolon      : {
            type      : "boolean",
            definition: "If true and mode is 'diff' and lang is 'javascript' all semicolon characters t" +
                    "hat immediately preceed any white space containing a new line character will b" +
                    "e removed so as to elimate some differences from the code comparison.",
            default   : false
        },
        source         : {
            type      : "string",
            definition: "The source code or location for interpretation. This option is required for al" +
                    "l modes.",
            default   : ""
        },
        sourcelabel    : {
            type      : "string",
            definition: "This allows for a descriptive label of the source file code of the diff HTML o" +
                    "utput.",
            default   : "Source Sample"
        },
        space          : {
            type      : "boolean",
            definition: "Inserts a space following the function keyword for anonymous functions.",
            default   : true
        },
        spaceclose     : {
            type      : "boolean",
            definition: "Markup self-closing tags end will end with ' />' instead of '/>'.",
            default   : false
        },
        style          : {
            type      : "string",
            definition: "If mode is 'beautify' and lang is 'markup' or 'html' this will determine wheth" +
                    "er the contents of script and style tags should always start at position 0 of " +
                    "each line or if such content should be indented starting from the opening scri" +
                    "pt or style tag.",
            values    : [
                "indent", "noindent"
            ],
            default   : "indent"
        },
        styleguide     : {
            type      : "string",
            definition: "Provides a collection of option presets to easily conform to popular JavaScrip" +
                    "t style guides.",
            values    : [
                "airbnb",
                "crockford",
                "google",
                "grunt",
                "jquery",
                "jslint",
                "mediawiki",
                "meteor",
                "yandex",
                "none"
            ],
            default   : "none"
        },
        summaryonly    : {
            type      : "boolean",
            definition: "Node only option to output only number of differences.",
            default   : false
        },
        tagmerge       : {
            type      : "boolean",
            definition: "Allows immediately adjacement start and end markup tags of the same name to be" +
                    " combined into a single self-closing tag.",
            default   : false
        },
        tagsort        : {
            type      : "boolean",
            definition: "Sort child items of each respective markup parent element.",
            default   : false
        },
        textpreserve   : {
            type      : "boolean",
            definition: "If text in the provided markup code should be preserved exactly as provided. T" +
                    "his option eliminates beautification and wrapping of text content.",
            default   : false
        },
        ternaryline    : {
            type      : "boolean",
            definition: "If ternary operators in JavaScript (? and :) should remain on the same line.",
            default   : false
        },
        titanium       : {
            type      : "boolean",
            definition: "Forces the JavaScript parser to parse Titanium Style Sheets instead of JavaScr" +
                    "ipt.",
            default   : false
        },
        topcoms        : {
            type      : "boolean",
            definition: "If mode is 'minify' this determines whether comments above the first line of c" +
                    "ode should be kept.",
            default   : false
        },
        twig           : {
            type      : "boolean",
            definition: "If markuppretty is passing twig tag data to jspretty.",
            default   : false
        },
        typescript     : {
            type      : "boolean",
            definition: "Identifies certain edge cases where TypeScript is in conflict with React JSX r" +
                    "egarding type generics",
            default   : false
        },
        unformatted    : {
            type      : "boolean",
            definition: "If markup tags should have their insides preserved.",
            default   : false
        },
        varword        : {
            type      : "string",
            definition: "If consecutive JavaScript variables should be merged into a comma separated li" +
                    "st or if variables in a list should be separated.",
            values    : [
                "each", "list", "none"
            ],
            default   : "none"
        },
        version        : {
            type      : "boolean",
            definition: "A Node.js only option to write the version information to the console.",
            default   : false
        },
        vertical       : {
            type      : "string",
            definition: "If lists of assignments and properties should be vertically aligned.",
            values    : [
                "all", "css", "js", "none"
            ],
            default   : "none"
        },
        wrap           : {
            type      : "number",
            definition: "How many characters long text content in markup or strings in JavaScript can b" +
                    "e before wrapping. A value of 0 turns this feature off. A value of -1 will con" +
                    "catenate strings in JavaScript if separated by a '+' operator.",
            default   : 0
        }
    };
    options.functions.default       = function options_default() {
        var keys     = Object.keys(options.functions.definitions),
            populate = function options_default_populate(name) {
                if (name !== "api" && name !== "diff" && name !== "output" && name !== "source" && name !== "nodeasync" && (options.functions.nodeArgs === undefined || options.functions.nodeArgs[name] === undefined)) {
                    options[name] = options
                        .functions
                        .definitions[name]
                        .default;
                }
            };
        keys.forEach(populate);
    };
    options.functions.versionString = function options__versionString() {
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
        if (global.prettydiff.edition === undefined) {
            return "";
        }
        dstring = global
            .prettydiff
            .edition
            .latest
            .toString();
        mstring = Number(dstring.slice(2, 4)) - 1;
        return "\u001B[36mVersion\u001B[39m: " + global.prettydiff.edition.version + " " +
                "\u001B[36mDated\u001B[39m: " + dstring.slice(4, 6) + " " + month[mstring] + " " +
                "20" + dstring.slice(0, 2);
    };
    options.functions.consolePrint  = function options_consolePrint() {
        var list      = Object.keys(options.functions.definitions),
            a         = 0,
            b         = 0,
            longest   = 0,
            len       = list.length,
            def       = "",
            name      = "",
            type      = "",
            vlist     = [],
            names     = [],
            vals      = [],
            lf        = (options.crlf === true)
                ? "\r\n"
                : "\n",
            limit     = (options.help === undefined)
                ? 78
                : options.help - 2,
            namecolor = function options_colorPrint_namecolor(item) {
                return "  * \"\u001B[32m" + item.replace("  * \"", "") + "\u001B[39m";
            },
            vertical  = function options_consolePrint_vertical(items) {
                var mostest  = 0,
                    x        = 0,
                    y        = 0,
                    leng     = items.length,
                    newitems = [];
                for (x = 0; x < leng; x = x + 1) {
                    if (items[x].length > mostest) {
                        mostest = items[x].length;
                    }
                }
                for (x = 0; x < leng; x = x + 1) {
                    y = items[x].length;
                    newitems.push(items[x]);
                    if (y < mostest) {
                        do {
                            y           = y + 1;
                            newitems[x] = newitems[x] + " ";
                        } while (y < mostest);
                    }
                }
                return [newitems, mostest];
            },
            wrap      = function options_consolePrint_wrap(values) {
                var start   = true,
                    wrapper = [],
                    wrappit = function options_consolePrint_wrap_wrappit() {
                        var indent = (values === true && start === false)
                                ? "     "
                                : "  ",
                            c      = limit - indent.length;
                        name = name.replace(/^(\s+)/, "");
                        if (name.length < c) {
                            wrapper.push(indent + name);
                            name = "";
                            return;
                        }
                        if (name.charAt(c) !== " " || name.charAt(c - 1) === " ") {
                            do {
                                c = c - 1;
                            } while (c > 0 && (name.charAt(c) !== " " || name.charAt(c - 1) === " "));
                        }
                        if (c === 0) {
                            wrapper.push(indent + name);
                            name = "";
                            return;
                        }
                        wrapper.push(indent + name.slice(0, c));
                        name = name.slice(c);
                    };
                do {
                    wrappit();
                    start = false;
                } while (name.length > 0);
                if (options.crlf === true) {
                    return wrapper.join("\r\n");
                }
                return wrapper.join("\n");
            },
            output    = ["", "\u001B[1mOptions\u001B[22m"];
        names   = vertical(list);
        longest = names[1];
        names   = names[0];
        name    = "  Name";
        b       = name.length;
        if (b < longest) {
            do {
                b    = b + 1;
                name = name + " ";
            } while (b < longest);
        }
        name = name + "   - Type    - Default";
        output.push("");
        output.push(name);
        b    = 0;
        name = "";
        do {
            b    = b + 1;
            name = name + "-";
        } while (b < limit + 2);
        output.push(name);
        for (a = 0; a < len; a = a + 1) {
            name = "* \u001B[32m" + names[a] + "\u001B[39m";
            type = options
                .functions
                .definitions[list[a]]
                .type;
            if (type === "string") {
                type = "\u001B[33m" + type + "\u001B[39m ";
                def  = options
                    .functions
                    .definitions[list[a]]
                    .default;
                if (def === " ") {
                    def = "(space)";
                } else if (def === "") {
                    def = "(empty string)";
                } else {
                    def = "\"" + def + "\"";
                }
            } else if (type === "number") {
                type = "\u001B[36m" + type + "\u001B[39m ";
                def  = options
                    .functions
                    .definitions[list[a]]
                    .default
                    .toString();
            } else {
                type = "\u001B[35m" + type + "\u001B[39m";
                def  = options
                    .functions
                    .definitions[list[a]]
                    .default
                    .toString();
            }
            name = name + " - " + type + " - " + def;
            output.push(name);
            name = options
                .functions
                .definitions[list[a]]
                .definition;
            if (name.length < limit) {
                output.push("  " + name);
            } else {
                output.push(wrap(false));
            }
            vlist = options
                .functions
                .definitions[list[a]]
                .values;
            if (vlist !== undefined) {
                if (typeof vlist.length === "number") {
                    name = "Accepted values: \"" + vlist
                        .toString()
                        .replace(/,/g, "\", \"") + "\"";
                    name = "\u001B[31m" + wrap(false);
                    name = name.replace(
                        "Accepted values: \"",
                        "Accepted values:\u001B[39m \"\u001B[32m"
                    );
                    name = name.replace(/,\u0020"/g, ", \"\u001B[32m");
                    name = name.replace(/",/g, "\u001B[39m\",");
                    output.push(name);
                } else {
                    output.push("  \u001B[31mAccepted values:\u001B[39m");
                    vlist = Object.keys(options.functions.definitions[list[a]].values);
                    vals  = vertical(vlist)[0];
                    b     = 0;
                    do {
                        vals[b] = vals[b] + " ";
                        name    = "  * \"" + vals[b].replace(" ", "\"") + " - " + options
                            .functions
                            .definitions[list[a]]
                            .values[vlist[b]];
                        name    = wrap(true);
                        name    = name.replace(/\u0020\u0020\*\u0020"\w+/, namecolor);
                        output.push(name);
                        b = b + 1;
                    } while (b < vlist.length);
                }
            }
            output.push("");
        }
        if (options.api === "node") {
            output.push("\u001B[1mUsage\u001B[22m");
            output.push(
                "\u001B[35mnode api/node-local.js\u001B[39m \u001B[32moption1:\u001B[39m\u001B[" +
                "33m\"value\"\u001B[39m \u001B[32moption2:\u001B[39m\u001B[33m\"value\"\u001B[3" +
                "9m ..."
            );
            output.push(
                "\u001B[35mnode api/node-local.js\u001B[39m \u001B[32msource:\u001B[39m\u001B[3" +
                "3m\"myApplication.js\"\u001B[39m \u001B[32mreadmethod:\u001B[39m\u001B[33m\"fi" +
                "lescreen\"\u001B[39m \u001B[32mmode:\u001B[39m\u001B[33m\"beautify\"\u001B[39m"
            );
            output.push(
                "\u001B[35mnode api/node-local.js\u001B[39m \u001B[32msource:\u001B[39m\u001B[3" +
                "3m\"old_directory\"\u001B[39m \u001B[32mdiff:\u001B[39m\u001B[33m\"new_directo" +
                "ry\"\u001B[39m \u001B[32mreadmethod:\u001B[39m\u001B[33m\"subdirectory\"\u001B" +
                "[39m"
            );
            output.push(
                "\u001B[35mnode api/node-local.js\u001B[39m \u001B[32mhelp\u001B[39m:80     to " +
                "see this help message, the number value sets word wrap"
            );
            output.push(
                "\u001B[35mnode api/node-local.js\u001B[39m \u001B[32mversion\u001B[39m     to " +
                "see only the version line"
            );
            output.push(
                "\u001B[35mnode api/node-local.js\u001B[39m \u001B[32mlist\u001B[39m        to " +
                "see the current settings"
            );
            output.push("");
            output.push(options.functions.versionString());
            output.push("");
            return output.join(lf);
        }
        output.push("");
        output.push(options.functions.versionString());
        output.push("");
        return output
            .join(lf)
            .replace(/\u001b\[\d+m/g, "");
    };
    options.functions.pdcomment     = function options_pdcomment() {
        var comment    = options.source,
            type       = "source",
            a          = 0,
            b          = options.source.length,
            strl       = 0,
            strm       = "",
            c          = -1,
            build      = [],
            comma      = -1,
            g          = 0,
            sourceChar = [],
            quote      = "",
            sind       = -1,
            dind       = -1,
            ss         = null,
            sd         = null;
        ss = options
            .source
            .match(/\/\*\s*prettydiff.com/);
        sd = options
            .diff
            .match(/\/\*\s*prettydiff.com/);
        if (ss === null) {
            ss = options
                .source
                .match(/<\!--+\s*prettydiff.com/);
            if (ss !== null) {
                strm = ss[0];
                strl = strm.length;
                sind = options
                    .source
                    .indexOf(strm);
                c    = sind + strl;
            }
        } else {
            strm = ss[0];
            strl = strm.length;
            sind = options
                .source
                .indexOf(strm);
            c    = sind + strl;
        }
        if (c < 0) {
            if (sd === null) {
                sd = options
                    .diff
                    .match(/<\!--+\s*prettydiff.com/);
                if (sd !== null) {
                    strm    = sd[0];
                    strl    = strm.length;
                    dind    = options
                        .diff
                        .indexOf(strm);
                    c       = dind + strl;
                    comment = options.diff;
                    type    = "diff";
                }
            } else {
                strm    = sd[0];
                strl    = strm.length;
                dind    = options
                    .diff
                    .indexOf(strm);
                c       = dind + strl;
                comment = options.diff;
                type    = "diff";
            }
        }
        if (c < 0) {
            return;
        }
        if ((options.source.charAt(c - (strl + 1)) === "\"" && options.source.charAt(c) === "\"") || (sind < 0 && dind < 0)) {
            return;
        }
        if (type === "source" && (/^(\s*\{\s*"token"\s*:\s*\[)/).test(options.source) === true && (/\],\s*"types"\s*:\s*\[/).test(options.source) === true) {
            return;
        }
        if (type === "diff" && (/^(\s*\{\s*"token"\s*:\s*\[)/).test(options.diff) === true && (/\],\s*"types"\s*:\s*\[/).test(options.diff) === true) {
            return;
        }
        for (c = c; c < b; c = c + 1) {
            if (quote === "") {
                if (comment.charAt(c) === "\"" || comment.charAt(c) === "'") {
                    quote = comment.charAt(c);
                    if (comment.charAt(c + 1) === " " && sourceChar[sourceChar.length - 1] === ":") {
                        sourceChar.push("\\ ");
                        c = c + 1;
                    }
                } else {
                    if (comment.charAt(c) === "*" && comment.charAt(c + 1) === "/" && strm.slice(0, 2) === "/*") {
                        break;
                    }
                    if (comment.charAt(c) === "-" && comment.charAt(c + 1) === "-" && comment.charAt(
                        c + 2
                    ) === ">" && strm.slice(0, 4) === "<!--") {
                        break;
                    }
                    if (sourceChar[sourceChar.length - 1] !== ":" || (sourceChar[sourceChar.length - 1] === ":" && comment.charAt(c) !== " ")) {
                        sourceChar.push(comment.charAt(c));
                    }
                }
            } else if (comment.charAt(c) === quote) {
                quote = "";
            }
        }
        comment = sourceChar.join("");
        b       = comment.length;
        for (c = 0; c < b; c = c + 1) {
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
                    if ((/(\:\\\s+)$/).test(comment.slice(g, comma)) === true) {
                        build.push(comment.slice(g, comma).replace(/^(\s*)/, "").replace(/:\\/, ":"));
                    } else {
                        build.push(comment.slice(g, comma).replace(/^(\s*)/, "").replace(/(\s*)$/, ""));
                    }
                }
            }
        }
        g     = comma + 1;
        comma = comment.length;
        if ((/(\:\\\s+)$/).test(comment.slice(g, comma)) === true) {
            build.push(comment.slice(g, comma).replace(/^(\s*)/, "").replace(/:\\/, ":"));
        } else {
            build.push(comment.slice(g, comma).replace(/^(\s*)/, "").replace(/(\s*)$/, ""));
        }
        quote      = "";
        b          = build.length;
        sourceChar = [];
        for (c = 0; c < b; c = c + 1) {
            a = build[c].length;
            for (g = 0; g < a; g = g + 1) {
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
                        sourceChar.push(build[c].substring(g + 1));
                        if (sourceChar[1].charAt(0) === sourceChar[1].charAt(sourceChar[1].length - 1) && sourceChar[1].charAt(sourceChar[1].length - 2) !== "\\" && (sourceChar[1].charAt(0) === "\"" || sourceChar[1].charAt(0) === "'")) {
                            sourceChar[1] = sourceChar[1].substring(1, sourceChar[1].length - 1);
                        }
                        build[c] = sourceChar;
                        break;
                    }
                }
            }
        }
        for (c = 0; c < b; c = c + 1) {
            if (typeof build[c][1] === "string") {
                build[c][0] = build[c][0].replace("api.", "");
                if (build[c][0] === "brace_style") {
                    if (build[c][1] === "collapse" || build[c][1] === "collapse-preserve-inline" || build[c][1] === "expand" || build[c][1] === "none") {
                        options.brace_style = build[c][1];
                    }
                }
                if (build[c][0] === "braces" || build[c][0] === "indent") {
                    if (build[c][1] === "knr" || build[c][1] === "allman") {
                        options.braces = build[c][1];
                    }
                } else if (build[c][0] === "color") {
                    if (typeof b[c][1] === "string" && b[c][1] !== "") {
                        options.color = b[c][1];
                    }
                } else if (build[c][0] === "comments") {
                    if (build[c][1] === "indent" || build[c][1] === "noindent") {
                        options.comments = "noindent";
                    }
                } else if (build[c][0] === "diffview") {
                    if (build[c][1] === "sidebyside" || build[c][1] === "inline") {
                        options.diffview = build[c][1];
                    }
                } else if (build[c][0] === "endcomma") {
                    if (build[c][1] === "true" || build[c][1] === "always") {
                        options.endcomma = "always";
                    } else if (build[c][1] === "false" || build[c][1] === "never") {
                        options.endcomma = "never";
                    } else if (build[c][1] === "multiline") {
                        options.endcomma = "multiline";
                    }
                } else if (build[c][0] === "formatArray" || build[c][0] === "formatObject") {
                    if (build[c][1] === "default" || build[c][1] === "indent" || build[c][1] === "inline") {
                        options[build[c][0]] = build[c][1];
                    }
                } else if (build[c][0] === "jsscope") {
                    if (build[c][1] === "html" || build[c][1] === "none" || build[c][1] === "report") {
                        options.jsscope = build[c][1];
                    }
                } else if (build[c][0] === "lang" || build[c][0] === "langdefault") {
                    options[build[c][0]] = global
                        .prettydiff
                        .language
                        .setlangmode(build[c][1]);
                } else if (build[c][0] === "mode") {
                    if (build[c][1] === "beautify" || build[c][1] === "minify" || build[c][1] === "diff" || build[c][1] === "parse" || build[c][1] === "analysis") {
                        options.mode = build[c][1];
                    }
                } else if (build[c][0] === "objsort") {
                    if (build[c][1] === "all" || build[c][1] === "js" || build[c][1] === "css" || build[c][1] === "markup" || build[c][1] === "none" || build[c][1] === "true" || build[c][1] === "false") {
                        options.objsort = build[c][1];
                    }
                } else if (build[c][0] === "parseFormat") {
                    if (build[c][1] === "htmltable" || build[c][1] === "parallel" || build[c][1] === "sequential") {
                        options.parseFormat = build[c][1];
                    }
                } else if (build[c][0] === "quoteConvert") {
                    if (build[c][1] === "single" || build[c][1] === "double" || build[c][1] === "none") {
                        options.quoteConvert = build[c][1];
                    }
                } else if (build[c][0] === "style") {
                    if (build[c][1] === "indent" || build[c][1] === "noindent") {
                        options.style = build[c][1];
                    }
                } else if (build[c][0] === "typescript" && build[c][1] === "true") {
                    options.typescript = true;
                    options.lang       = "typescript";
                } else if (build[c][0] === "varword") {
                    if (build[c][1] === "each" || build[c][1] === "list" || build[c][1] === "none") {
                        options.varword = build[c][1];
                    }
                } else if (build[c][0] === "vertical") {
                    if (build[c][1] === "all" || build[c][1] === "css" || build[c][1] === "js" || build[c][1] === "none") {
                        options.vertical = build[c][1];
                    }
                } else if (options[build[c][0]] !== undefined && options[build[c][1]] !== "") {
                    if (build[c][1] === "true") {
                        options[build[c][0]] = true;
                    } else if (build[c][1] === "false") {
                        options[build[c][0]] = false;
                    } else if (isNaN(build[c][1]) === false && (/\s+/).test(build[c][1]) === false) {
                        options[build[c][0]] = Number(build[c][1]);
                    } else {
                        if (options.functions.definitions[build[c][0]].type === "string") {
                            options[build[c][0]] = build[c][1];
                        } else {
                            options[build[c][0]] = options
                                .functions
                                .definitions[build[c][0]]
                                .default;
                        }
                    }
                }
            }
        }
    };
    options.functions.validate      = function options_validate(api) {
        var braceEscape = function diffview__options_braceEscape(input) {
            return input
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        };
        if (options.api !== "dom") {
            options
                .functions
                .default();
        }
        // apacheVelocity - provides support for Apache Velocity markup templates
        options.apacheVelocity  = (
            api.apacheVelocity === true || api.apacheVelocity === "true"
        );
        // determines api source as necessary to make a decision about whether to supply
        // externally needed JS functions to reports
        options.api             = (api.api === undefined || api.api.length === 0)
            ? "node"
            : api.api;
        // attributetoken - whether attributes should be represented as token items in
        // the parse table or whether they should be a data properties of their element
        options.attributetoken  = (
            api.attributetoken === true || api.attributetoken === "true"
        );
        // brace-style - provided to emulate JSBeautify's brace-style option
        options.brace_style     = (
            api.brace_style === "collapse" || api.brace_style === "collapse-preserve-inline" || api.brace_style === "expand"
        )
            ? api.brace_style
            : "none";
        // braceline - should a new line pad the interior of blocks (curly braces) in
        // JavaScript
        options.braceline       = (api.braceline === true || api.braceline === "true");
        //bracepadding - should curly braces be padded with a space in JavaScript?
        options.bracepadding    = (
            api.bracepadding === true || api.bracepadding === "true"
        );
        // indent - should JSPretty format JavaScript in the normal KNR style or push
        // curly braces onto a separate line like the "allman" style
        options.braces          = (
            api.braces === true || api.braces === "true" || api.braces === "allman"
        )
            ? "allman"
            : "knr";
        //color scheme of generated HTML artifacts
        options.color           = (api.color === "canvas" || api.color === "shadow")
            ? api.color
            : "white";
        //comments - if comments should receive indentation or not
        options.comments        = (api.comments === "noindent")
            ? "noindent"
            : ((api.comments === "nocomment")
                ? "nocomment"
                : "indent");
        //commline - If in markup a newline should be forced above comments
        options.commline        = (api.commline === true || api.commline === "true");
        // compressedcss - If the beautified CSS should contain minified properties
        options.compressedcss   = (
            api.compressedcss === true || api.compressedcss === "true"
        );
        // conditional - should IE conditional comments be preserved during markup
        // minification
        options.conditional     = (
            api.conditional === true || api.conditional === "true" || api.html === true
        );
        //content - should content be normalized during a diff operation
        options.content         = (api.content === true || api.content === "true");
        // context - should the diff report only include the differences, if so then
        // buffered by how many lines of code
        options.context         = (
            isNaN(api.context) === true || api.context === "" || Number(api.context) < 0
        )
            ? -1
            : Number(api.context);
        //correct - should JSPretty make some corrections for sloppy JS
        options.correct         = (api.correct === true || api.correct === "true");
        //crlf - if output should use \r\n (Windows compatible) for line termination
        options.crlf            = (api.crlf === true || api.crlf === "true");
        //cssinsertlines = if a new line should be forced between each css block
        options.cssinsertlines = (
            api.cssinsertlines === true || api.cssinsertlines === "true"
        );
        //csvchar - what character should be used as a separator
        options.csvchar         = (typeof api.csvchar === "string" && api.csvchar.length > 0)
            ? api.csvchar
            : ",";
        //diff - source code to compare with
        options.diff            = (
            typeof api.diff === "string" && api.diff.length > 0 && (/^(\s+)$/).test(api.diff) === false
        )
            ? api.diff
            : "";
        // diffcli - if operating from Node.js and set to true diff output will be
        // printed to stdout just like git diff
        options.diffcli         = (api.diffcli === true || api.diffcli === "true");
        //diffcomments - should comments be included in the diff operation
        options.diffcomments    = (
            api.diffcomments === true || api.diffcomments === "true"
        );
        //difflabel - a text label to describe the diff code
        options.difflabel       = (
            typeof api.difflabel === "string" && api.difflabel.length > 0
        )
            ? braceEscape(api.difflabel)
            : "New Sample";
        // diffspaceignore - If white space differences should be ignored by the diff
        // tool
        options.diffspaceignore = (
            api.diffspaceignore === true || api.diffspaceignore === "true"
        );
        // diffview - should the diff report be a single column showing both sources
        // simultaneously "inline" or showing the sources in separate columns
        // "sidebyside"
        options.diffview        = (api.diffview === "inline")
            ? "inline"
            : "sidebyside";
        //dustjs - support for this specific templating scheme
        options.dustjs          = (api.dustjs === true || api.dustjs === "true");
        //elseline - for the 'else' keyword onto a new line in JavaScript
        options.elseline        = (api.elseline === true || api.elseline === "true");
        // endcomma - if a trailing comma should be injected at the end of arrays and
        // object literals in JavaScript
        options.endcomma        = (
            api.endcomma === true || api.endcomma === "true" || api.endcomma === "always"
        )
            ? "always"
            : (api.endcomma === "multiline")
                ? "multiline"
                : "never";
        // endquietly - a node only option to prevent writing anything to console as
        // stdout
        options.endquietly      = (api.endquietly === "log" || api.endquietly === "quiet")
            ? api.endquietly
            : "";
        // force_attribute - forces indentation of all markup attriubtes
        options.force_attribute = (
            api.force_attribute === true || api.force_attribute === "true"
        );
        // force_indent - should markup beautification always force indentation even if
        // disruptive
        options.force_indent    = (
            api.force_indent === true || api.force_indent === "true"
        );
        // formatArray - defines whether JavaScript array keys should be indented or
        // kept on a single line
        options.formatArray     = (
            api.formatArray === "indent" || api.formatArray === "inline"
        )
            ? api.formatArray
            : "default";
        // formatObject - defines whether JavaScript object properties should be
        // indented or kept on a single line
        options.formatObject    = (
            api.formatObject === "indent" || api.formatObject === "inline"
        )
            ? api.formatObject
            : "default";
        // functionname - if a space should occur between a function name and its
        // arguments paren
        options.functionname    = (
            api.functionname === true || api.functionname === "true"
        );
        options.help            = (isNaN(api.help) === true || api.help === "")
            ? 80
            : Number(api.help);
        // html - should markup be presumed to be HTML with all the aloppiness HTML
        // allows
        options.html            = (
            api.html === true || api.html === "true" || api.html === "html-yes"
        );
        //inchar - what character(s) should be used to create a single identation
        options.inchar          = (typeof api.inchar === "string" && api.inchar.length > 0)
            ? api
                .inchar
                .replace(/\\t/g, "\u0009")
                .replace(/\\n/g, "\u000a")
                .replace(/\\r/g, "\u000d")
                .replace(/\\f/g, "\u000c")
                .replace(/\\b/g, "\u0008")
            : " ";
        // inlevel - should indentation in JSPretty be buffered with additional
        // indentation?  Useful when supplying code to sites accepting markdown
        options.inlevel         = (
            isNaN(api.inlevel) === true || api.inlevel === "" || Number(api.inlevel) < 1
        )
            ? 0
            : Number(api.inlevel);
        // insize - how many characters from api.inchar should constitute a single
        // indentation
        options.insize          = (isNaN(api.insize) === true || api.insize === "")
            ? 4
            : Number(api.insize);
        // jekyll - If the delimiter "---" should be used to create comments in markup.
        options.jekyll          = (api.jekyll === true || api.jekyll === "true");
        // jsscope - do you want to enable the jsscope feature of JSPretty?  This
        // feature will output formatted HTML instead of text code showing which
        // variables are declared at which functional depth
        options.jsscope         = (
            api.jsscope === true || api.jsscope === "true" || api.jsscope === "report"
        )
            ? "report"
            : (api.jsscope === "html")
                ? "html"
                : "none";
        // jsx - an internal option that is tripped to true when JSX code is
        // encountered.  This option allows the markuppretty and jspretty parsers know
        // to recursively hand off to each other.
        options.jsx             = false;
        //lang - which programming language will we be analyzing
        options.lang            = (typeof api.lang === "string" && api.lang !== "auto")
            ? global
                .prettydiff
                .language
                .setlangmode(api.lang.toLowerCase())
            : "auto";
        // langdefault - what language should lang value "auto" resort to when it cannot
        // determine the language
        options.langdefault     = (typeof api.langdefault === "string")
            ? global
                .prettydiff
                .language
                .setlangmode(api.langdefault.toLowerCase())
            : "text";
        // listoptions - a node only option to output the current options object to the
        // console
        options.listoptions     = (
            api.listoptions === true || api.listoptions === "true" || api.listoptions === "l" || api.listoptions === "list"
        );
        // methodchain - if JavaScript method chains should be strung onto a single line
        // instead of indented
        options.methodchain     = (
            api.methodchain === true || api.methodchain === "true" || api.methodchain === "chain"
        )
            ? "chain"
            : (api.methodchain === "none")
                ? "none"
                : "indent";
        // miniwrap - when language is JavaScript and mode is 'minify' if option 'jwrap'
        // should be applied to all code
        options.miniwrap        = (api.miniwrap === true || api.miniwrap === "true");
        //mode - is this a minify, beautify, or diff operation
        options.mode            = (
            api.mode === "minify" || api.mode === "beautify" || api.mode === "parse" || api.mode === "analysis"
        )
            ? api.mode
            : "diff";
        //newline - Insert an empty line at the end of output.
        options.newline         = (
            api.newline === true || api.newline === "true"
        );
        //neverflatten - prevent flattening of destructured lists in JavaScript
        options.neverflatten    = (
            api.neverflatten === true || api.neverflatten === "true"
        );
        //nocaseindent - if a 'case' should be indented to its parent 'switch'
        options.nocaseindent    = (
            api.nocaseindent === true || api.nocaseindent === "true"
        );
        // nochainindent - prevent indentation when JavaScript chains of methods are
        // broken onto multiple lines
        options.nochainindent   = (
            api.nochainindent === true || api.nochainindent === "true"
        );
        // nodeasync - meta data has to be passed in the output for bulk async
        // operations otherwise there is cross-talk, which means prettydiff has to
        // return an array of [data, meta] instead of a single string
        options.nodeasync       = (api.nodeasync === true || api.nodeasync === "true");
        // nodeerror - nodeonly rule about whether parse errors should be logged to the
        // console
        options.nodeerror       = (api.nodeerror === true || api.nodeerror === "true");
        // noleadzero - in CSS removes and prevents a run of 0s from appearing
        // immediately before a value's decimal.
        options.noleadzero      = (api.noleadzero === true || api.noleadzero === "true");
        //objsort will alphabetize object keys in JavaScript
        options.objsort         = (
            api.objsort === "all" || api.objsort === "js" || api.objsort === "css" || api.objsort === "markup" || api.objsort === true || api.objsort === "true"
        )
            ? api.objsort
            : "none";
        // output - a node only option of where to write the output into the file system
        options.output          = (
            typeof api.output === "string" && api.output.length > 0 && (/^(\s+)$/).test(api.output) === false
        )
            ? api.output
            : "";
        //parseFormat - determine how the parse tree should be organized and formatted
        options.parseFormat     = (
            api.parseFormat === "sequential" || api.parseFormat === "htmltable"
        )
            ? api.parseFormat
            : "parallel";
        // parseSpace - whether whitespace tokens between tags should be included in the
        // parse tree output
        options.parseSpace      = (api.parseSpace === true || api.parseSpace === "true");
        //preserve - should empty lines be preserved in beautify operations of JSPretty?
        options.preserve        = (function core__optionPreserve() {
            if (api.preserve === 1 || api.preserve === undefined || api.preserve === true || api.preserve === "all" || api.preserve === "js" || api.preserve === "css") {
                return 1;
            }
            if (api.preserve === false || api.preserve === "" || isNaN(api.preserve) === true || Number(api.preserve) < 1 || api.preserve === "none") {
                return 0;
            }
            return Number(api.preserve);
        }());
        // preserveComment - prevent comment reformatting due to option wrap
        options.preserveComment = (api.preserveComment === true || api.preserveComment === "true");
        // qml - if the language is qml (beautified as JavaScript that looks like CSS)
        options.qml             = (api.qml === true || api.qml === "true");
        // quoteConvert - convert " to ' (or ' to ") of string literals or markup
        // attributes
        options.quoteConvert    = (
            api.quoteConvert === "single" || api.quoteConvert === "double"
        )
            ? api.quoteConvert
            : "none";
        // readmethod - a node only option to determine scope of operations (how to
        // proceeed with source and diff options as text or file system properties)
        options.readmethod      = (
            api.readmethod === "subdirectory" || api.readmethod === "directory" || api.readmethod === "file" || api.readmethod === "filescreen" || api.readmethod === "screen"
        )
            ? api.readmethod
            : "auto";
        //selectorlist - should comma separated CSS selector lists be on one line
        options.selectorlist    = (
            api.selectorlist === true || api.selectorlist === "true"
        );
        // semicolon - should trailing semicolons be removed during a diff operation to
        // reduce the number of false positive comparisons
        options.semicolon       = (api.semicolon === true || api.semicolon === "true");
        // source - the source code in minify and beautify operations or "base" code in
        // operations
        options.source          = (
            typeof api.source === "string" && api.source.length > 0 && (/^(\s+)$/).test(api.source) === false
        )
            ? api.source
            : "";
        //sourcelabel - a text label to describe the api.source code for the diff report
        options.sourcelabel     = (
            typeof api.sourcelabel === "string" && api.sourcelabel.length > 0
        )
            ? braceEscape(api.sourcelabel)
            : "Base Sample";
        // space - should JSPretty include a space between a function keyword and the
        // next adjacent opening parenthesis character in beautification operations
        options.space           = (api.space !== false && api.space !== "false");
        //spaceclose - If markup self-closing tags should end with " />" instead of "/>"
        options.spaceclose      = (api.spaceclose === true || api.spaceclose === "true");
        // style - should JavaScript and CSS code receive indentation if embedded inline
        // in markup
        options.style           = (api.style === "noindent")
            ? "noindent"
            : "indent";
        // styleguide - preset of beautification options to bring a JavaScript sample
        // closer to conformance of a given style guide
        options.styleguide      = (typeof api.styleguide === "string")
            ? api
                .styleguide
                .toLowerCase()
                .replace(/\s+/g, "")
            : "none";
        // summaryonly - node only option to output only the diff summary
        options.summaryonly     = (api.summaryonly === true || api.summaryonly === "true");
        // tagmerge - Allows combining immediately adjacent start and end tags of the
        // same name into a single self-closing tag:  <a href="home"></a> into
        // <a//href="home"/>
        options.tagmerge = (api.tagmerge === true || api.tagmerge === "true");
        //sort markup child nodes alphabetically
        options.tagsort         = (api.tagsort === true || api.tagsort === "true");
        // textpreserve - Force the markup beautifier to retain text (white space and
        // all) exactly as provided.
        options.ternaryline     = (api.ternaryline === true || api.ternaryline === "true");
        options.textpreserve    = (
            api.textpreserve === true || api.textpreserve === "true"
        );
        // titanium - TSS document support via option, because this is a uniquely
        // modified form of JSON
        options.titanium        = (api.titanium === true || api.titanium === "true");
        // topcoms - should comments at the top of a JavaScript or CSS source be
        // preserved during minify operations
        options.topcoms         = (api.topcoms === true || api.topcoms === "true");
        // twig - if markuppretty is passing twig tag data to jspretty
        options.twig            = (api.twig === true || api.twig === "true");
        options.typescript      = (api.typescript === true || api.typescript === "true");
        // unformatted - if the internals of markup tags should be preserved
        options.unformatted     = (api.unformatted === true || api.unformatted === "true");
        // varword - should consecutive variables be merged into a comma separated list
        // or the opposite
        options.varword         = (api.varword === "each" || api.varword === "list")
            ? api.varword
            : "none";
        // version - a node only option to output the version number to command line
        options.version         = (
            api.version === true || api.version === "true" || api.version === "version" || api.version === "v"
        );
        // vertical - whether or not to vertically align lists of assigns in CSS and
        // JavaScript
        options.vertical        = (
            api.vertical === "all" || api.vertical === "css" || api.vertical === "js"
        )
            ? api.vertical
            : "none";
        // wrap - in markup beautification should text content wrap after the first
        // complete word up to a certain character length
        options.wrap            = (
            isNaN(api.wrap) === true || api.wrap === "" || options.textpreserve === true
        )
            ? 0
            : Number(api.wrap);
        options.autoval         = ["", "", ""];
        if (options.lang === "auto") {
            options.autoval = global
                .prettydiff
                .language
                .auto(options.source, options.langdefault);
            options.lang    = options.autoval[1];
        } else if (options.lang === "qml") {
            options.qml  = true;
            options.lang = "javascript";
        } else if (options.lang === "velocity") {
            options.apacheVelocity = true;
            options.lang           = "markup";
        } else if (options.api === "dom") {
            options.autoval = [options.lang, options.lang, options.lang];
        } else {
            options.lang = global
                .prettydiff
                .language
                .setlangmode(options.lang);
        }
        if (options.lang === "typescript") {
            options.lang       = "javascript";
            options.typescript = true;
        }
        if (options.apacheVelocity === true) {
            if (options.mode === "minify") {
                options.apacheVelocity = false;
            } else {
                options.lang = "markup";
            }
        }
        if (options.qml === true) {
            if (options.mode === "minify") {
                options.qml = false;
            } else {
                options.lang = "javascript";
            }
        }
        if (api.alphasort === true || api.alphasort === "true" || api.objsort === true || api.objsort === "true") {
            options.objsort = "all";
        }
        if (api.indent === "allman") {
            options.braces = "allman";
        }
        if (api.methodchain === true || api.methodchain === "true") {
            options.methodchain = "chain";
        } else if (api.methodchain === false || api.methodchain === "false") {
            options.methodchain = "indent";
        }
        if (api.vertical === true || api.vertical === "true") {
            options.vertical = "all";
        } else if (api.vertical === "cssonly") {
            options.vertical = "css";
        } else if (api.vertical === "jsonly") {
            options.vertical = "js";
        }
        if (options.autoval[0] === "dustjs") {
            options.dustjs = true;
        }
        if (options.lang === "html") {
            options.html = true;
            options.lang = "markup";
        } else if (options.lang === "tss" || options.lang === "titanium") {
            options.titanium = true;
            options.lang     = "javscript";
        }
        if (options.qml === true) {
            options.correct = false;
            options.jsx     = false;
        }
        if (options.mode !== "beautify" && options.mode !== "diff" && options.endcomma === "multiline") {
            options.endcomma = "never";
        }
        if (options.mode === "minify") {
            if (options.wrap < 1) {
                options.miniwrap = false;
            } else if (options.miniwrap === false) {
                options.wrap = -1;
            }
            options.correct = true;
        } else if (options.jsscope !== "none") {
            if (options.mode !== "beautify") {
                options.jsscope = "none";
            } else {
                // wrap is disabled for jsscope because it can break HTML character entities in
                // strings, which is fine in JS, but breaks things when rendered in the browser.
                options.wrap = 0;
            }
        }

        // old diff api
        if (typeof options.baseTextLines === "string") {
            options.source = options
                .baseTextLines
                .replace(options.functions.binaryCheck, "")
                .replace(/\r\n?/g, "\n");
        }
        if (typeof options.baseTextName === "string") {
            options.sourcelabel = braceEscape(options.baseTextName);
        }
        if (typeof options.newTextLines === "string") {
            options.diff = options
                .newTextLines
                .replace(options.functions.binaryCheck, "")
                .replace(/\r\n?/g, "\n");
        }
        if (typeof options.newTextName === "string") {
            options.difflabel = braceEscape(options.newTextName);
        }
        if ((/^([0-9]+)$/).test(options.contextSize) === true) {
            options.context = Number(options.contextSize);
        }
        if (typeof options.tchar === "string") {
            options.inchar = options.tchar;
        }
        if ((/^([0-9]+)$/).test(options.tsize) === true) {
            options.insize = Number(options.tsize);
        }
        //end old diff api

        options
            .functions
            .pdcomment();
        return options;
    };
    options.functions.domops        = function options_domops(id, value, commentString) {
        var a    = 0,
            data = [];
        if (id === "adustno" || id === "bdustno" || id === "ddustno" || id === "mdustno" || id === "pdustno") {
            data = ["dustjs", "false"];
        } else if (id === "adustyes" || id === "bdustyes" || id === "ddustyes" || id === "mdustyes" || id === "pdustyes") {
            data = ["dustjs", "true"];
        } else if (id === "ahtml-no" || id === "htmld-no" || id === "html-no" || id === "htmlm-no" || id === "phtml-no") {
            data = ["html", "false"];
        } else if (id === "ahtml-no" || id === "htmld-yes" || id === "html-yes" || id === "htmlm-yes" || id === "phtml-yes") {
            data = ["html", "true"];
        } else if (id === "ajekyll-no" || id === "bjekyll-no" || id === "djekyll-no" || id === "mjekyll-no" || id === "pjekyll-no") {
            data = ["jekyll", "false"];
        } else if (id === "ajekyll-yes" || id === "bjekyll-yes" || id === "djekyll-yes" || id === "mjekyll-yes" || id === "pjekyll-yes") {
            data = ["jekyll", "true"];
        } else if (id === "attributetoken-no") {
            data = ["attributetoken", "false"];
        } else if (id === "attributetoken-yes") {
            data = ["attributetoken", "true"];
        } else if (id === "baselabel") {
            data = ["sourcelabel", value];
        } else if (id === "bbracestyle-collapse" || id === "dbracestyle-collapse") {
            data = ["brace_style", "collapse"];
        } else if (id === "bbracestyle-expand" || id === "dbracestyle-expand") {
            data = ["brace_style", "expand"];
        } else if (id === "bbracestyle-inline" || id === "dbracestyle-inline") {
            data = ["brace_style", "collapse-preserve-inline"];
        } else if (id === "bbracestyle-none" || id === "dbracestyle-none") {
            data = ["brace_style", "none"];
        } else if (id === "bbraceline-no" || id === "dbraceline-no") {
            data = ["braceline", "false"];
        } else if (id === "bbraceline-yes" || id === "dbraceline-yes") {
            data = ["braceline", "true"];
        } else if (id === "bbracepadding-no" || id === "dbracepadding-no") {
            data = ["bracepadding", "false"];
        } else if (id === "bbracepadding-yes" || id === "dbracepadding-yes") {
            data = ["bracepadding", "true"];
        } else if (id === "bcommline-no") {
            data = ["commline", "false"];
        } else if (id === "bcommline-yes") {
            data = ["commline", "true"];
        } else if (id === "bcompressedcss-no" || id === "dcompressedcss-no") {
            data = ["compressedcss", "false"];
        } else if (id === "bcompressedcss-yes" || id === "dcompressedcss-yes") {
            data = ["compressedcss", "true"];
        } else if (id === "beau-wrap" || id === "diff-wrap" || id === "mini-wrap") {
            data = ["wrap", value];
        } else if (id === "bendcomma-always" || id === "dendcomma-always") {
            data = ["endcomma", "always"];
        } else if (id === "bendcomma-multiline" || id === "dendcomma-multiline") {
            data = ["endcomma", "multiline"];
        } else if (id === "bendcomma-never" || id === "dendcomma-never") {
            data = ["endcomma", "never"];
        } else if (id === "bforce_attribute-no" || id === "dforce_attribute-no") {
            data = ["force_attribute", "false"];
        } else if (id === "bforce_attribute-yes" || id === "dforce_attribute-yes") {
            data = ["force_attribute", "true"];
        } else if (id === "bforce_indent-no" || id === "dforce_indent-no") {
            data = ["force_indent", "false"];
        } else if (id === "bforce_indent-yes" || id === "dforce_indent-yes") {
            data = ["force_indent", "true"];
        } else if (id === "bformatarray-default" || id === "dformatarray-default") {
            data = ["formatArray", "default"];
        } else if (id === "bformatarray-indent" || id === "dformatarray-indent") {
            data = ["formatArray", "indent"];
        } else if (id === "bformatarray-inline" || id === "dformatarray-inline") {
            data = ["formatArray", "inline"];
        } else if (id === "bformatobject-default" || id === "dformatobject-default") {
            data = ["formatObject", "default"];
        } else if (id === "bformatobject-indent" || id === "dformatobject-indent") {
            data = ["formatObject", "indent"];
        } else if (id === "bformatobject-inline" || id === "dformatobject-inline") {
            data = ["formatObject", "inline"];
        } else if (id === "bfunctionname-no" || id === "dfunctionname-no") {
            data = ["functionname", "false"];
        } else if (id === "bfunctionname-yes" || id === "dfunctionname-yes") {
            data = ["functionname", "true"];
        } else if (id === "bpreserve" || id === "dpreserve") {
            data = ["preserve", value];
        } else if (id === "bpreserveComment-false" || id === "dpreserveComment-false") {
            data = ["preserveComment", "false"];
        } else if (id === "bpreserveComment-true" || id === "dpreserveComment-true") {
            data = ["preserveComment", "true"];
        } else if (id === "bmethodchain-chain" || id === "dmethodchain-chain") {
            data = ["methodchain", "chain"];
        } else if (id === "bmethodchain-indent" || id === "dmethodchain-indent") {
            data = ["methodchain", "indent"];
        } else if (id === "bmethodchain-none" || id === "dmethodchain-none") {
            data = ["methodchain", "none"];
        } else if (id === "bnocaseindent-no" || id === "dnocaseindent-no") {
            data = ["nocaseindent", "false"];
        } else if (id === "bnocaseindent-yes" || id === "dnocaseindent-yes") {
            data = ["nocaseindent", "true"];
        } else if (id === "bnochainindent-no" || id === "dnochainindent-no") {
            data = ["nochainindent", "false"];
        } else if (id === "bnochainindent-yes" || id === "dnochainindent-yes") {
            data = ["nochainindent", "true"];
        } else if (id === "bnoleadzero-no") {
            data = ["noleadzero", "false"];
        } else if (id === "bnoleadzero-yes") {
            data = ["noleadzero", "true"];
        } else if (id === "bobjsort-all" || id === "dobjsort-all" || id === "mobjsort-all" || id === "pobjsort-all") {
            data = ["objsort", "all"];
        } else if (id === "bobjsort-cssonly" || id === "dobjsort-cssonly" || id === "mobjsort-cssonly" || id === "pobjsort-cssonly") {
            data = ["objsort", "css"];
        } else if (id === "bobjsort-jsonly" || id === "dobjsort-jsonly" || id === "mobjsort-jsonly" || id === "pobjsort-jsonly") {
            data = ["objsort", "js"];
        } else if (id === "bobjsort-markuponly" || id === "dobjsort-markuponly" || id === "mobjsort-markuponly" || id === "pobjsort-markuponly") {
            data = ["objsort", "markup"];
        } else if (id === "bobjsort-none" || id === "dobjsort-none" || id === "mobjsort-none" || id === "pobjsort-none") {
            data = ["objsort", "none"];
        } else if (id === "bquoteconvert-double" || id === "mquoteconvert-double") {
            data = ["quoteConvert", "double"];
        } else if (id === "bquoteconvert-none" || id === "mquoteconvert-none") {
            data = ["quoteConvert", "none"];
        } else if (id === "bquoteconvert-single" || id === "mquoteconvert-single") {
            data = ["quoteConvert", "single"];
        } else if (id === "bselectorlist-no" || id === "dselectorlist-no") {
            data = ["selectorlist", "false"];
        } else if (id === "bselectorlist-yes" || id === "dselectorlist-yes") {
            data = ["selectorlist", "true"];
        } else if (id === "bspaceclose-no") {
            data = ["spaceclose", "false"];
        } else if (id === "bspaceclose-yes") {
            data = ["spaceclose", "true"];
        } else if (id === "bstyleguide") {
            if (value === "") {
                data = ["styleguide", ""];
            } else {
                data = ["styleguide", value];
            }
        } else if (id === "btagmerge-no" || id === "dtagmerge-no" || id === "mtagmerge-no" || id === "ptagmerge-no") {
            data = ["tagmerge", "false"];
        } else if (id === "btagmerge-yes" || id === "dtagmerge-yes" || id === "mtagmerge-yes" || id === "ptagmerge-yes") {
            data = ["tagmerge", "true"];
        } else if (id === "btagsort-no" || id === "dtagsort-no" || id === "mtagsort-no" || id === "ptagsort-no") {
            data = ["tagsort", "false"];
        } else if (id === "btagsort-yes" || id === "dtagsort-yes" || id === "mtagsort-yes" || id === "ptagsort-yes") {
            data = ["tagsort", "true"];
        } else if (id === "bternaryline-no" || id === "dternaryline-no") {
            data = ["ternaryline", "false"];
        } else if (id === "bternaryline-yes" || id === "dternaryline-yes") {
            data = ["ternaryline", "true"];
        } else if (id === "btextpreserveno" || id === "dtextpreserveno" || id === "mtextpreserveno" || id === "ptextpreserveno") {
            data = ["textpreserve", "false"];
        } else if (id === "btextpreserveyes" || id === "dtextpreserveyes" || id === "mtextpreserveyes" || id === "ptextpreserveyes") {
            data = ["textpreserve", "true"];
        } else if (id === "bunformatted-no" || id === "dunformatted-no" || id === "munformatted-no" || id === "punformatted-no") {
            data = ["unformatted", "false"];
        } else if (id === "bunformatted-yes" || id === "dunformatted-yes" || id === "munformatted-yes" || id === "punformatted-yes") {
            data = ["unformatted", "true"];
        } else if (id === "bvarword-each" || id === "dvarword-each" || id === "mvarword-each" || id === "pvarword-each") {
            data = ["varword", "each"];
        } else if (id === "bvarword-list" || id === "dvarword-list" || id === "mvarword-list" || id === "pvarword-list") {
            data = ["varword", "list"];
        } else if (id === "bvarword-none" || id === "dvarword-none" || id === "mvarword-none" || id === "pvarword-none") {
            data = ["varword", "none"];
        } else if (id === "conditionald-no" || id === "conditionalm-no") {
            data = ["conditional", "false"];
        } else if (id === "conditionald-yes" || id === "conditionalm-yes") {
            data = ["conditional", "true"];
        } else if (id === "contextSize") {
            data = ["context", value];
        } else if (id === "csvchar") {
            data = ["csvchar", value];
        } else if (id === "cssinsertlines-no") {
            data = ["cssinsertlines", "false"];
        } else if (id === "cssinsertlines-yes") {
            data = ["cssinsertlines", "true"];
        } else if (id === "diff-char" || id === "beau-char") {
            data = ["inchar", value];
        } else if (id === "diff-line" || id === "beau-line") {
            data = ["inchar", "\n"];
        } else if (id === "diff-quan" || id === "beau-quan" || id === "minn-quan") {
            data = ["insize", value];
        } else if (id === "diff-space" || id === "beau-space") {
            data = ["inchar", " "];
        } else if (id === "diff-tab" || id === "beau-tab") {
            data = ["inchar", "\t"];
        } else if (id === "diffcontent") {
            data = ["content", "true"];
        } else if (id === "diffcontenty") {
            data = ["content", "false"];
        } else if (id === "diffcli-false") {
            data = ["diffcli", "false"];
        } else if (id === "diffcli-true") {
            data = ["diffcli", "true"];
        } else if (id === "diffcommentsn") {
            data = ["diffcomments", "false"];
        } else if (id === "diffcommentsy") {
            data = ["diffcomments", "true"];
        } else if (id === "difflabel") {
            data = ["difflabel", value];
        } else if (id === "diffscolon") {
            data = ["semicolon", "true"];
        } else if (id === "diffscolony") {
            data = ["semicolon", "false"];
        } else if (id === "diffspaceignoren") {
            data = ["diffspaceignore", "false"];
        } else if (id === "diffspaceignorey") {
            data = ["diffspaceignore", "true"];
        } else if (id === "incomment-no") {
            data = ["comments", "noindent"];
        } else if (id === "incomment-yes") {
            data = ["comments", "indent"];
        } else if (id === "inline") {
            data = ["diffview", "inline"];
        } else if (id === "inlevel") {
            data = ["inlevel", value];
        } else if (id === "inscriptd-no" || id === "inscript-no") {
            data = ["style", "noindent"];
        } else if (id === "inscriptd-yes" || id === "inscript-yes") {
            data = ["style", "indent"];
        } else if (id === "jscorrect-no" || id === "mjscorrect-no") {
            data = ["correct", "false"];
        } else if (id === "jscorrect-yes" || id === "mjscorrect-yes") {
            data = ["correct", "true"];
        } else if (id === "jselseline-no") {
            data = ["elseline", "false"];
        } else if (id === "jselseline-yes") {
            data = ["elseline", "true"];
        } else if (id === "jsindentd-all" || id === "jsindent-all") {
            data = ["indent", "allman"];
        } else if (id === "jsindentd-knr" || id === "jsindent-knr") {
            data = ["indent", "knr"];
        } else if (id === "jsscope-html") {
            data = ["jsscope", "true"];
        } else if (id === "jsscope-no") {
            data = ["jsscope", "none"];
        } else if (id === "jsscope-yes") {
            data = ["jsscope", "html"];
        } else if (id === "jsscope-html") {
            data = ["jsscope", "report"];
        } else if (id === "jsspaced-no" || id === "jsspace-no") {
            data = ["jsspace", "false"];
        } else if (id === "jsspaced-yes" || id === "jsspace-yes") {
            data = ["jsspace", "true"];
        } else if (id === "language") {
            data = ["lang", value];
        } else if (id === "lang-default") {
            data = ["langdefault", value];
        } else if (id === "langauge") {
            data = ["lang", value];
        } else if (id === "lterminator-crlf") {
            data = ["crlf", "true"];
        } else if (id === "lterminator-lf") {
            data = ["crlf", "false"];
        } else if (id === "miniwrapm-no") {
            data = ["miniwrap", "false"];
        } else if (id === "miniwrapm-yes") {
            data = ["miniwrap", "true"];
        } else if (id === "modeanalysis") {
            data = ["mode", "analysis"];
        } else if (id === "modebeautify") {
            data = ["mode", "beautify"];
        } else if (id === "modediff") {
            data = ["mode", "diff"];
        } else if (id === "modeminify") {
            data = ["mode", "minify"];
        } else if (id === "modeparse") {
            data = ["mode", "parse"];
        } else if (id === "newline-no") {
            data = ["newline", "false"];
        } else if (id === "newline-yes") {
            data = ["newline", "true"];
        } else if (id === "parseFormat-htmltable") {
            data = ["parseFormat", "htmltable"];
        } else if (id === "parseFormat-parallel") {
            data = ["parseFormat", "parallel"];
        } else if (id === "parseFormat-sequential") {
            data = ["parseFormat", "sequential"];
        } else if (id === "parsespace-no") {
            data = ["parseSpace", "false"];
        } else if (id === "parsespace-yes") {
            data = ["parseSpace", "true"];
        } else if (id === "sidebyside") {
            data = ["diffview", "sidebyside"];
        } else if (id === "topcoms-yes") {
            data = ["topcoms", "true"];
        } else if (id === "topcoms-no") {
            data = ["topcoms", "false"];
        } else if (id === "vertical-all") {
            data = ["vertical", "all"];
        } else if (id === "vertical-cssonly") {
            data = ["vertical", "css"];
        } else if (id === "vertical-jsonly") {
            data = ["vertical", "js"];
        } else if (id === "vertical-none") {
            data = ["vertical", "none"];
        }
        if (data.length === 0) {
            return commentString;
        }
        if (data[1] !== "true" && data[1] !== "false") {
            data[1] = "\"" + data[1] + "\"";
        }
        for (a = commentString.length - 1; a > -1; a = a - 1) {
            if (commentString[a].indexOf(data[0]) > -1) {
                commentString[a] = data.join(": ");
                break;
            }
        }
        if (a < 0) {
            commentString.push(data.join(": "));
            commentString.sort();
        }
        return commentString;
    };
    options.functions.node          = function options_node(a) {
        var b        = 0,
            c        = a.length,
            d        = [],
            e        = [],
            f        = 0,
            opts     = {},
            help     = false,
            langauto = true;
        for (b = 0; b < c; b = b + 1) {
            e = [];
            f = a[b].indexOf(":");
            e.push(a[b].substring(0, f).replace(/(\s+)$/, ""));
            e.push(a[b].substring(f + 1).replace(/^(\s+)/, ""));
            d.push(e);
        }
        c = d.length;
        for (b = 0; b < c; b = b + 1) {
            if (d[b].length === 2) {
                opts[d[b][0]] = d[b][1];
                if (d[b][0] === "lang" && d[b][1] !== "auto") {
                    langauto = false;
                }
            } else {
                if (d[b] === "help" || d[b][0] === "help" || d[b][0] === "man" || d[b][0] === "manual") {
                    help = true;
                } else if (d[b] === "v" || d[b] === "version" || d[b][0] === "v" || d[b][0] === "version") {
                    options.version = true;
                } else if (d[b] === "l" || d[b] === "list" || d[b][0] === "l" || d[b][0] === "list") {
                    options.listoptions = true;
                }
            }
        }
        if (Object.keys(opts).length < 2) {
            help = true;
        }
        options.functions.nodeArgs = opts;
        options
            .functions
            .validate(opts);
        return [help, langauto];
    };
    options.functions.binaryCheck   = (
        /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
    );
    if ((typeof define === "object" || typeof define === "function") && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
        //requirejs support
        define(function options_requirejs() {
            return global.prettydiff.options;
        });
    } else if (typeof module === "object" && typeof module.parent === "object") {
        //commonjs and nodejs support
        module.exports = global.prettydiff.options;
        if (typeof require === "function" && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
            (function glib_options() {
                var localPath = (
                    typeof process === "object" && typeof process.cwd === "function" && (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true) && typeof __dirname === "string"
                )
                    ? __dirname
                    : ".";
                if (global.prettydiff.language === undefined) {
                    global.prettydiff.language = require(
                        localPath + "/lib/language.js"
                    );
                }
            }());
        }
    } 
}());
