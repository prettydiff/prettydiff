/*global __dirname, ace, define, exports, global, language, localStorage, pd, process, require*/
/*
 How to define a new option:

 1. Define the new option in validate. The definition will include data type, default value, and acceptable values.
 2. Add DOM controls features to domops. At the minimum this will require the use translating id values into option values
 3. If the option takes specific string values then it must be added to pdcomment.


 - I need to bring node error messaging to here, make it wrap dynamically
*/
if (typeof require === "function" && typeof ace !== "object") {
    (function glib_prettydiff() {
        "use strict";
        var localPath = (typeof process === "object" && typeof process.cwd === "function" && (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true) && typeof __dirname === "string")
            ? __dirname
            : ".";
        if (global.language === undefined) {
            global.language = require(localPath + "/lib/language.js").api;
        }
    }());
} else {
    global.language     = language;
}
var options = (function prettydiff_options_() {
    "use strict";
    var optionobj = {
        functions      : {
            pdcomment: function options_pdcomment_init() {
                return true;
            },
            validate: function options_validate_init() {
                return true;
            }
        }
    };
    return optionobj;
}());

options.functions.pdcomment = function options_pdcomment() {
    "use strict";
    var comment    = options.source,
        a          = 0,
        b          = options.source.length,
        str        = "/*prettydiff.com",
        c          = options
            .source
            .indexOf(str) + 16,
        build      = [],
        comma      = -1,
        g          = 0,
        sourceChar = [],
        quote      = "",
        sind       = options
            .source
            .indexOf(str),
        dind       = options
            .diff
            .indexOf(str);
    if (sind < 0) {
        str  = "<!--prettydiff.com";
        sind = options
            .source
            .indexOf(str);
        c    = sind + 18;
    }
    if (dind < 0) {
        dind = options
            .source
            .indexOf("<!--prettydiff.com");
    }
    if ((options.source.charAt(c - 17) === "\"" && options.source.charAt(c) === "\"") || (sind < 0 && dind < 0)) {
        return;
    }
    if (sind > -1 && (/^(\s*\{\s*"token"\s*:\s*\[)/).test(options.source) === true && (/\],\s*"types"\s*:\s*\[/).test(options.source) === true) {
        return;
    }
    if (sind < 0 && dind > -1 && (/^(\s*\{\s*"token"\s*:\s*\[)/).test(options.diff) === true && (/\],\s*"types"\s*:\s*\[/).test(options.diff) === true) {
        return;
    }
    if (c === 15 && typeof options.diff === "string") {
        c       = options
            .diff
            .indexOf("/*prettydiff.com") + 16;
        comment = options.diff;
    } else if (c === 17 && typeof options.diff === "string") {
        str     = "<!--prettydiff.com";
        c       = options
            .diff
            .indexOf(str) + 18;
        comment = options.diff;
    } else if (c === 17) {
        return;
    }
    for (c = c; c < b; c += 1) {
        if (quote === "") {
            if (comment.charAt(c) === "\"" || comment.charAt(c) === "'") {
                quote = comment.charAt(c);
            } else {
                if (comment.charAt(c) === "*" && comment.charAt(c + 1) === "/" && str === "/*prettydiff.com") {
                    break;
                }
                if (comment.charAt(c) === "-" && comment.charAt(c + 1) === "-" && comment.charAt(c + 2) === ">" && str === "<!--prettydiff.com") {
                    break;
                }
                sourceChar.push(comment.charAt(c));
            }
        } else if (comment.charAt(c) === quote) {
            quote = "";
        }
    }
    comment = sourceChar
        .join("");
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
                options[build[c][0]] = language.setlangmode(build[c][1]);
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
            } else if (build[c][0] === "varword") {
                if (build[c][1] === "each" || build[c][1] === "list" || build[c][1] === "none") {
                    options.varword = build[c][1];
                }
            } else if (build[c][0] === "vertical") {
                if (build[c][1] === "all" || build[c][1] === "css" || build[c][1] === "js" || build[c][1] === "none") {
                    options.vertical = build[c][1];
                }
            } else if (options[build[c][0]] !== undefined) {
                if (build[c][1] === "true") {
                    options[build[c][0]] = true;
                } else if (build[c][1] === "false") {
                    options[build[c][0]] = false;
                } else if (isNaN(build[c][1]) === false) {
                    options[build[c][0]] = Number(build[c][1]);
                } else {
                    options[build[c][0]] = build[c][1];
                }
            }
        }
    }
};
options.functions.validate = function options_validate(api) {
    "use strict";
    // apacheVelocity - provides support for Apache Velocity markup templates
    options.apacheVelocity = (api.apacheVelocity === true || api.apacheVelocity === "true");
    // determines api source as necessary to make a decision about whether to supply
    // externally needed JS functions to reports
    options.api            = (api.api === undefined || api.api.length === 0)
        ? "node"
        : api.api;
    // attributetoken - whether attributes should be represented as token items in
    // the parse table or whether they should be a data properties of their element
    options.attributetoken = (api.attributetoken === true || api.attributetoken === "true");
    // brace-style - provided to emulate JSBeautify's brace-style option
    options.brace_style    = (api.brace_style === "collapse" || api.brace_style === "collapse-preserve-inline" || api.brace_style === "expand")
        ? api.brace_style
        : "none";
    // braceline - should a new line pad the interior of blocks (curly braces) in
    // JavaScript
    options.braceline      = (api.braceline === true || api.braceline === "true");
    //bracepadding - should curly braces be padded with a space in JavaScript?
    options.bracepadding   = (api.bracepadding === true || api.bracepadding === "true");
    // indent - should JSPretty format JavaScript in the normal KNR style or push
    // curly braces onto a separate line like the "allman" style
    options.braces         = (api.braces === true || api.braces === "true" || api.braces === "allman")
        ? "allman"
        : "knr";
    //color scheme of generated HTML artifacts
    options.color          = (api.color === "canvas" || api.color === "shadow")
        ? api.color
        : "white";
    //comments - if comments should receive indentation or not
    options.comments       = (api.comments === "noindent")
        ? "noindent"
        : ((api.comments === "nocomment")
            ? "nocomment"
            : "indent");
    //commline - If in markup a newline should be forced above comments
    options.commline       = (api.commline === true || api.commline === "true");
    // compressedcss - If the beautified CSS should contain minified properties
    options.compressedcss  = (api.compressedcss === true || api.compressedcss === "true");
    // conditional - should IE conditional comments be preserved during markup
    // minification
    options.conditional    = (api.conditional === true || api.conditional === "true");
    //content - should content be normalized during a diff operation
    options.content        = (api.content === true || api.content === "true");
    // context - should the diff report only include the differences, if so then
    // buffered by how many lines of code
    options.context        = (isNaN(api.context) === true)
        ? ""
        : Number(api.context);
    //correct - should JSPretty make some corrections for sloppy JS
    options.correct        = (api.correct === true || api.correct === "true");
    //crlf - if output should use \r\n (Windows compatible) for line termination
    options.crlf           = (api.crlf === true || api.crlf === "true");
    //cssinsertlines = if a new line should be forced between each css block
    options.cssinsertlines = (api.cssinsertlines === true || api.cssinsertlines === "true");
    //csvchar - what character should be used as a separator
    options.csvchar        = (typeof api.csvchar === "string" && api.csvchar.length > 0)
        ? api.csvchar
        : ",";
    //diff - source code to compare with
    options.diff           = (typeof api.diff === "string" && api.diff.length > 0 && (/^(\s+)$/).test(api.diff) === false)
        ? api.diff
        : "";
    // diffcli - if operating from Node.js and set to true diff output will be
    // printed to stdout just like git diff
    options.diffcli        = (api.diffcli === true || api.diffcli === "true");
    //diffcomments - should comments be included in the diff operation
    options.diffcomments   = (api.diffcomments === true || api.diffcomments === "true");
    //difflabel - a text label to describe the diff code
    options.difflabel      = (typeof api.difflabel === "string" && api.difflabel.length > 0)
        ? api.difflabel
        : "new";
    // diffspaceignore - If white space differences should be ignored by the diff
    // tool
    options.diffspaceignore= (api.diffspaceignore === true || api.diffspaceignore === "true");
    // diffview - should the diff report be a single column showing both sources
    // simultaneously "inline" or showing the sources in separate columns
    // "sidebyside"
    options.diffview       = (api.diffview === "inline")
        ? "inline"
        : "sidebyside";
    //dustjs - support for this specific templating scheme
    options.dustjs         = (api.dustjs === true || api.dustjs === "true");
    //elseline - for the 'else' keyword onto a new line in JavaScript
    options.elseline       = (api.elseline === true || api.elseline === "true");
    // endcomma - if a trailing comma should be injected at the end of arrays and
    // object literals in JavaScript
    options.endcomma       = (api.endcomma === true || api.endcomma === "true" || api.endcomma === "always")
        ? "always"
        : (api.endcomma === "multiline")
            ? "multiline"
            : "never";
    // endquietly - a node only option to prevent writing anything to console as stdout
    options.endquietly     = (api.endquietly === "log" || api.endquietly === "quiet")
        ? api.endquietly
        : "";
    // force_attribute - forces indentation of all markup attriubtes
    options.force_attribute= (api.force_attribute === true || api.force_attribute === "true");
    // force_indent - should markup beautification always force indentation even if
    // disruptive
    options.force_indent   = (api.force_indent === true || api.force_indent === "true");
    // formatArray - defines whether JavaScript array keys should be indented or kept on a single line
    options.formatArray    = (api.formatArray === "indent" || api.formatArray === "inline")
        ? api.formatArray
        : "default";
    // formatObject - defines whether JavaScript object properties should be indented or kept on a single line
    options.formatObject   = (api.formatObject === "indent" || api.formatObject === "inline")
        ? api.formatObject
        : "default";
    //functionname - if a space should occur between a function name and its arguments paren
    options.functionname   = (api.functionname === true || api.functionname === "true");
    // html - should markup be presumed to be HTML with all the aloppiness HTML
    // allows
    options.html           = (api.html === true || api.html === "true" || api.html === "html-yes");
    //inchar - what character(s) should be used to create a single identation
    options.inchar         = (typeof api.inchar === "string" && api.inchar.length > 0)
        ? api.inchar
        : " ";
    // inlevel - should indentation in JSPretty be buffered with additional
    // indentation?  Useful when supplying code to sites accepting markdown
    options.inlevel        = (isNaN(api.inlevel) === true || Number(api.inlevel) < 1)
        ? 0
        : Number(api.inlevel);
    // insize - how many characters from api.inchar should constitute a single
    // indentation
    options.insize         = (isNaN(api.insize) === true)
        ? 4
        : Number(api.insize);
    // jekyll - If the delimiter "---" should be used to create comments in markup.
    options.jekyll         = (api.jekyll === true || api.jekyll === "true");
    // jsscope - do you want to enable the jsscope feature of JSPretty?  This
    // feature will output formatted HTML instead of text code showing which
    // variables are declared at which functional depth
    options.jsscope        = (api.jsscope === true || api.jsscope === "true")
        ? "report"
        : (api.jsscope === "html" || api.jsscope === "report")
            ? api.jsscope
            : "none";
    //lang - which programming language will we be analyzing
    options.lang           = (typeof api.lang === "string" && api.lang !== "auto")
        ? language.setlangmode(api.lang.toLowerCase())
        : "auto";
    // langdefault - what language should lang value "auto" resort to when it cannot
    // determine the language
    options.langdefault    = (typeof api.langdefault === "string")
        ? language.setlangmode(api.langdefault.toLowerCase())
        : "text";
    // listoptions - a node only option to output the current options object to the console
    options.listoptions    = (api.listoptions === true || api.listoptions === "true" || api.listoptions === "l" || api.listoptions === "list")
    // methodchain - if JavaScript method chains should be strung onto a single line
    // instead of indented
    options.methodchain    = (api.methodchain === "chain" || api.methodchain === "none")
        ? api.methodchain
        : "indent";
    // miniwrap - when language is JavaScript and mode is 'minify' if option 'jwrap'
    // should be applied to all code
    options.miniwrap       = (api.miniwrap === true || api.miniwrap === "true");
    //mode - is this a minify, beautify, or diff operation
    options.mode           = (api.mode === "minify" || api.mode === "beautify" || api.mode === "parse" || api.mode === "analysis")
        ? api.mode
        : "diff";
    //neverflatten - prevent flattening of destructured lists in JavaScript
    options.neverflatten   = (api.neverflatten === true || api.neverflatten === "true");
    //nocaseindent - if a 'case' should be indented to its parent 'switch'
    options.nocaseindent   = (api.nocaseindent === true || api.nocaseindent === "true");
    // nochainindent - prevent indentation when JavaScript chains of methods are
    // broken onto multiple lines
    options.nochainindent  = (api.nochainindent === true || api.nochainindent === "true");
    // nodeasync - meta data has to be passed in the output for bulk async
    // operations otherwise there is cross-talk, which means prettydiff has to return
    // an array of [data, meta] instead of a single string
    options.nodeasync      = (api.nodeasync === true || api.nodeasync === "true");
    // nodeerror - nodeonly rule about whether parse errors should be logged to the
    // console
    options.nodeerror      = (api.nodeerror === true || api.nodeerror === "true");
    // noleadzero - in CSS removes and prevents a run of 0s from appearing
    // immediately before a value's decimal.
    options.noleadzero     = (api.noleadzero === true || api.noleadzero === "true");
    //objsort will alphabetize object keys in JavaScript
    options.objsort        = (api.objsort === "all" || api.objsort === "js" || api.objsort === "css" || api.objsort === "markup" || api.objsort === true || api.objsort === "true")
        ? api.objsort
        : "none";
    // output - a node only option of where to write the output into the file system
    options.output         = (typeof api.output === "string" && api.output.length > 0 && (/^(\s+)$/).test(api.output) === false)
        ? api.output
        : "";
    //parseFormat - determine how the parse tree should be organized and formatted
    options.parseFormat    = (api.parseFormat === "sequential" || api.parseFormat === "htmltable")
        ? api.parseFormat
        : "parallel";
    // parseSpace - whether whitespace tokens between tags should be included in the
    // parse tree output
    options.parseSpace     = (api.parseSpace === true || api.parseSpace === "true");
    //preserve - should empty lines be preserved in beautify operations of JSPretty?
    options.preserve       = (function core__optionPreserve() {
        if (api.preserve === 1 || api.preserve === undefined || api.preserve === true || api.preserve === "all" || api.preserve === "js" || api.preserve === "css") {
            return 1;
        }
        if (api.preserve === false || isNaN(api.preserve) === true || Number(api.preserve) < 1 || api.preserve === "none") {
            return 0;
        }
        return Number(api.preserve);
    }());
    // qml - if the language is qml (beautified as JavaScript that looks like CSS)
    options.qml            = (api.qml === true || api.qml === "true");
    // quote - should all single quote characters be converted to double quote
    // characters during a diff operation to reduce the number of false positive
    // comparisons
    options.quote          = (api.quote === true || api.quote === "true");
    // quoteConvert - convert " to ' (or ' to ") of string literals or markup
    // attributes
    options.quoteConvert   = (api.quoteConvert === "single" || api.quoteConvert === "double")
        ? api.quoteConvert
        : "none";
    // readmethod - a node only option to determine scope of operations (how to proceeed with source and diff options as text or file system properties)
    options.readmethod     = (api.readmethod === "subdirectory" || api.readmethod === "directory" || api.readmethod === "file" || api.readmethod === "filescreen" || api.readmethod === "screen")
        ? api.readmethod
        : "auto";
    //selectorlist - should comma separated CSS selector lists be on one line
    options.selectorlist   = (api.selectorlist === true || api.selectorlist === "true");
    // semicolon - should trailing semicolons be removed during a diff operation to
    // reduce the number of false positive comparisons
    options.semicolon      = (api.semicolon === true || api.semicolon === "true");
    // source - the source code in minify and beautify operations or "base" code in
    // operations
    options.source         = (typeof api.source === "string" && api.source.length > 0 && (/^(\s+)$/).test(api.source) === false)
        ? api.source
        : "";
    //sourcelabel - a text label to describe the api.source code for the diff report
    options.sourcelabel    = (typeof api.sourcelabel === "string" && api.sourcelabel.length > 0)
        ? api.sourcelabel
        : "base";
    // space - should JSPretty include a space between a function keyword and the
    // next adjacent opening parenthesis character in beautification operations
    options.space          = (api.space !== false && api.space !== "false");
    //spaceclose - If markup self-closing tags should end with " />" instead of "/>"
    options.spaceclose     = (api.spaceclose === true || api.spaceclose === "true");
    // style - should JavaScript and CSS code receive indentation if embedded inline
    // in markup
    options.style          = (api.style === "noindent")
        ? "noindent"
        : "indent";
    // styleguide - preset of beautification options to bring a JavaScript sample
    // closer to conformance of a given style guide
    options.styleguide     = (typeof api.styleguide === "string")
        ? api.styleguide
        : "none";
    // summaryonly - node only option to output only the diff summary
    options.summaryonly    = (api.summaryonly === true || api.summaryonly === "true");
    // tagmerge - Allows combining immediately adjacent start and end tags of the
    // same name into a single self-closing tag:  <a href="home"></a> into
    // <a//href="home"/>
    options.tagmerge       = (api.tagmerge === true || api.tagmerge === "true");
    //sort markup child nodes alphabetically
    options.tagsort        = (api.tagsort === true || api.tagsort === "true");
    // textpreserve - Force the markup beautifier to retain text (white space and
    // all) exactly as provided.
    options.ternaryline    = (api.ternaryline === true || api.ternaryline === "true");
    options.textpreserve   = (api.textpreserve === true || api.textpreserve === "true");
    // titanium - TSS document support via option, because this is a uniquely
    // modified form of JSON
    options.titanium       = (api.titanium === true || api.titanium === "true");
    // topcoms - should comments at the top of a JavaScript or CSS source be
    // preserved during minify operations
    options.topcoms        = (api.topcoms === true || api.topcoms === "true");
    // unformatted - if the internals of markup tags should be preserved
    options.unformatted    = (api.unformatted === true || api.unformatted === "true");
    // varword - should consecutive variables be merged into a comma separated list
    // or the opposite
    options.varword        = (api.varword === "each" || api.varword === "list")
        ? api.varword
        : "none";
    // version - a node only option to output the version number to command line
    options.version        = (api.version === true || api.version === "true" || api.version === "version" || api.version === "v");
    // vertical - whether or not to vertically align lists of assigns in CSS and
    // JavaScript
    options.vertical       = (api.vertical === "all" || api.vertical === "css" || api.vertical === "js" || api.vertical === true || api.vertical === "true")
        ? api.vertical
        : "none";
    // wrap - in markup beautification should text content wrap after the first
    // complete word up to a certain character length
    options.wrap           = (isNaN(api.wrap) === true)
        ? 80
        : Number(api.wrap);
    options.autoval = [
        "", "", ""
    ];
    if (options.lang === "auto") {
        options.autoval      = language.auto(options.source, options.langdefault);
        options.lang = options.autoval[1];
    } else if (options.lang === "qml") {
        options.qml = true;
        options.lang = "javascript";
    } else if (options.lang === "velocity") {
        options.apacheVelocity = true;
        options.lang = "markup";
    } else if (options.api === "dom") {
        options.autoval = [options.lang, options.lang, options.lang];
    } else {
        options.lang = language.setlangmode(options.lang);
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
    global.jsxstatus = false;
    options.functions.pdcomment();
    return options;
};
options.functions.domops = function options_domops(x) {
    var item   = {},
        node   = "",
        name   = "",
        type   = "",
        id     = "",
        classy = "",
        h3     = {},
        body   = {};
    if (x !== undefined && x.nodeType === 1) {
        if (x.nodeName.toLowerCase() === "input" || x.nodeName.toLowerCase() === "select" || x.nodeName.toLowerCase() === "div") {
            item = x;
        } else {
            item = x.getElementsByTagName("input")[0];
            if (item === undefined) {
                return;
            }
        }
    } else if (this.nodeName.toLowerCase() === "input" || this.nodeName.toLowerCase() === "select" || this.nodeName.toLowerCase() === "div") {
        item = this;
    } else {
        item = this.getElementsByTagName("input")[0];
    }
    if (item.nodeType !== 1) {
        return;
    }
    if (item.nodeName.toLowerCase() !== "div" && pd.test.load === false && item !== pd.data.node.lang) {
        item.focus();
    }
    node   = item
        .nodeName
        .toLowerCase();
    name   = item.getAttribute("name");
    type   = item.getAttribute("type");
    id     = item.getAttribute("id");
    classy = item.getAttribute("class");
    if (pd.test.load === true) {
        return;
    }
    if (node === "input") {
        if (type === "radio") {
            if (id === "beau-other") {
                pd.data.settings.beauchar = pd
                    .id("beau-char")
                    .value;
            } else {
                pd.data.settings[name] = id;
            }
            if (id === "diff-other") {
                pd.data.settings.diffchar = pd
                    .id("diff-char")
                    .value;
            } else {
                pd.data.settings[name] = id;
            }
        } else if (type === "text") {
            if (id === "beau-char") {
                pd.data.settings.beauchar = item.value;
            } else if (id === "diff-char") {
                pd.data.settings.diffchar = item.value;
            } else {
                pd.data.settings[id] = item.value;
            }
        }
    } else if (node === "select") {
        pd.data.settings[id] = item.selectedIndex;
    } else if (node === "div" && classy === "box") {
        h3   = item.getElementsByTagName("h3")[0];
        body = item.getElementsByTagName("div")[0];
        if (pd.data.settings[id] === undefined) {
            pd.data.settings[id] = {};
        }
        if (body.style.display === "none" && h3.clientWidth < 175) {
            pd.data.settings[id].min = true;
            pd.data.settings[id].max = false;
        } else if (pd.data.settings[id].max === false || pd.data.settings[id].max === undefined) {
            pd.data.settings[id].min  = false;
            pd.data.settings[id].left = item.offsetLeft;
            pd.data.settings[id].top  = item.offsetTop;
            if (pd.test.agent.indexOf("macintosh") > 0) {
                pd.data.settings[id].width  = (body.clientWidth - 20);
                pd.data.settings[id].height = (body.clientHeight - 53);
            } else {
                pd.data.settings[id].width  = (body.clientWidth - 4);
                pd.data.settings[id].height = (body.clientHeight - 36);
            }
        }
    } else if (node === "button" && id !== null) {
        pd.data.settings[id] = item
            .innerHTML
            .replace(/\s+/g, " ");
    }
    if (pd.test.json === true && pd.test.ls === true) {
        localStorage.settings = JSON.stringify(pd.data.settings);
    }

    //pd.comment additions

    if (pd.data.node.comment !== null && id !== null) {
        (function dom__app_options_comment() {
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
                data = ["sourcelabel", item.value];
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
                data = ["wrap", item.value];
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
            } else if (id === "bjslines-all" || id === "djslines-all") {
                data = ["preserve", "all"];
            } else if (id === "bjslines-css" || id === "djslines-css") {
                data = ["preserve", "css"];
            } else if (id === "bjslines-js" || id === "djslines-js") {
                data = ["preserve", "js"];
            } else if (id === "bjslines-none" || id === "djslines-none") {
                data = ["preserve", "none"];
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
                if (item[item.selectedIndex].value === "") {
                    data = ["styleguide", ""];
                } else {
                    data = [
                        "styleguide",
                        item[item.selectedIndex].value
                    ];
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
                data = ["context", item.value];
            } else if (id === "csvchar") {
                data = ["csvchar", item.value];
            } else if (id === "cssinsertlines-no") {
                data = ["cssinsertlines", "false"];
            } else if (id === "cssinsertlines-yes") {
                data = ["cssinsertlines", "true"];
            } else if (id === "diff-char" || id === "beau-char") {
                data = ["inchar", item.value];
            } else if (id === "diff-line" || id === "beau-line") {
                data = ["inchar", "\n"];
            } else if (id === "diff-quan" || id === "beau-quan" || id === "minn-quan") {
                data = ["insize", item.value];
            } else if (id === "diff-space" || id === "beau-space") {
                data = ["inchar", " "];
            } else if (id === "diff-tab" || id === "beau-tab") {
                data = ["inchar", "\t"];
            } else if (id === "diffcontent") {
                data = ["content", "true"];
            } else if (id === "diffcontenty") {
                data = ["content", "false"];
            } else if (id === "diffcommentsn") {
                data = ["diffcomments", "false"];
            } else if (id === "diffcommentsy") {
                data = ["diffcomments", "true"];
            } else if (id === "difflabel") {
                data = ["difflabel", item.value];
            } else if (id === "diffquote") {
                data = ["quote", "true"];
            } else if (id === "diffquotey") {
                data = ["quote", "false"];
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
                data = ["inlevel", item.value];
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
                data = [
                    "lang",
                    item[item.selectedIndex].value
                ];
            } else if (id === "lang-default") {
                data = [
                    "langdefault",
                    item[item.selectedIndex].value
                ];
            } else if (id === "langauge") {
                data = ["lang", item.value];
            } else if (id === "lterminator-crlf") {
                data = ["crlf", "true"];
            } else if (id === "lterminator-lf") {
                data = ["crlf", "false"];
            } else if (id === "miniwrapm-no") {
                data = ["miniwrap", "false"];
            } else if (id === "miniwrapm-yes") {
                data = ["miniwrap", "true"];
            } else if (id === "modebeautify") {
                data = ["mode", "beautify"];
            } else if (id === "modediff") {
                data = ["mode", "diff"];
            } else if (id === "modeminify") {
                data = ["mode", "minify"];
            } else if (id === "modeparse") {
                data = ["mode", "parse"];
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
                return;
            }
            if (data[1] !== "true" && data[1] !== "false") {
                data[1] = "\"" + data[1] + "\"";
            }
            for (a = pd.data.commentString.length - 1; a > -1; a -= 1) {
                if (pd.data.commentString[a].indexOf(data[0]) > -1) {
                    pd.data.commentString[a] = data.join(": ");
                    break;
                }
            }
            if (a < 0) {
                pd
                    .data
                    .commentString
                    .push(data.join(": "));
                pd
                    .data
                    .commentString
                    .sort();
            }
            if (pd.data.node.comment !== null) {
                if (pd.data.commentString.length === 0) {
                    pd.data.node.comment.innerHTML = "/*prettydiff.com */";
                } else if (pd.data.commentString.length === 1) {
                    pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                        .data
                        .commentString[0]
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/api\./g, "") + " */";
                } else {
                    pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                        .data
                        .commentString
                        .join(", ")
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/api\./g, "") + " */";
                }
            }
            if (pd.test.ls === true && pd.test.json === true) {
                localStorage.commentString = JSON
                    .stringify(pd.data.commentString)
                    .replace(/api\./g, "");
            }
        }());
    }
}

if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api = function commonjs() {
        "use strict";
        return options;
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.prettydiffid === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api = function requirejs_export() {
            return options;
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
