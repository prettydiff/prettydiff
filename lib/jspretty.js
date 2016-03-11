/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*jshint laxbreak: true*/
/*global __dirname, ace, define, exports, global, markuppretty, process, require*/
/*
 This code may be used internally to Travelocity without limitation,
 exclusion, or restriction.  If this code is used externally the
 following comment must be included everywhere this code is used.

 Special thanks to Harry Whitfield for assistance in providing test
 cases.
 */
/***********************************************************************
 jspretty is written by Austin Cheney on 2 Nov 2012.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/*
 This application beautifies JavaScript code. This application was
 written with extension in mind using the same array based architecture
 used for the markup_beauty application.  The architecture focuses on
 separation of roles.  The first area of the application reads the code
 and writes an array of tokens.  The second area is the algorithm that
 determines what white space and indentation should be applied.  The
 third area applies the white space.  The final area is a report on the
 analysis of the code.

 -----------------------------------------------------------------------
 */
global.jsxstatus = false;
var jspretty = function jspretty_(options) {
    "use strict";
    var sourcemap    = [
            0, ""
        ],
        // all data that is created from the tokization process is stored in the
        // following four arrays: token, types, level, and lines.  All of this data
        // passes from the tokenization process to be analyzed by the algorithm
        token        = [], //stores parsed tokens
        types        = [], //parallel array that describes the tokens
        level        = [], //parallel array that list indentation per token
        lines        = [], //used to preserve empty lines
        depth        = [], //provides context into the current container
        globals      = [], //which variables are declared globals
        // meta used to find scope and variables for jsscope these values are assigned in parallel to the other arrays
        //* irrelevant tokens are represented with an empty string
        //* first '(' following 'function' is token index number of function's closing
        // curly brace
        //* variables are represented with the value 'v'
        //* the closing brace of a function is an array of variables
        meta         = [],
        // lists a number at the opening paren of a function that points to the token
        // index of the function's closing curly brace.  At the closing curly brace
        // index this array stores an array indicating the names of variables declared
        // in the current function for coloring by function depth in jsscope.  This
        // array is ignored if jsscope is false
        varlist      = [],
        // groups variables from a variable list into a child array as well as properties
        // of objects.  This array for adding extra space so that the "=" following
        // declared variables of a variable list is vertically aligned and likewise of
        // the ":" with object properties
        markupvar    = [],
        // notes a token index of a JSX markup tag assigned to JavaScript variable. This
        // is necessary for indentation apart from syntactical factors.
        error        = [],
        news         = 0,
        scolon       = 0,
        // counts uncessary use of 'new' keyword variables j, k, l, m, n, o, p, q, and w
        // are used as various counters for the reporting only.  These variables do not
        // store any tokens and are not used in the algorithm j counts line comments
        stats        = {
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
        result       = "",
        objsortop    = false,
        verticalop   = false,
        originalSize = options.source.length,
        lf           = (options.crlf === true || options.crlf === "true")
            ? "\r\n"
            : "\n";
    (function jspretty__options() {
        objsortop            = (options.objsort === true || options.objsort === "true" || options.objsort === "all" || options.objsort === "js" || options.objsort === "jsonly");
        options.braceline    = (options.braceline === true || options.braceline === "true");
        options.bracepadding = (options.bracepadding === true || options.bracepadding === "true");
        options.braces       = (options.braces === true || options.braces === "allman");
        options.comments     = (options.comments === "noindent" || options.comments === "nocomment")
            ? options.comments
            : "indent";
        options.correct      = (options.correct === true || options.correct === "true");
        options.elseline     = (options.elseline === true || options.elseline === "true");
        options.endcomma     = (options.endcomma === true || options.endcomma === "true");
        options.inchar       = (typeof options.inchar === "string" && options.inchar.length > 0)
            ? options.inchar
            : " ";
        options.inlevel      = (isNaN(options.inlevel) === true || options.inlevel < 0)
            ? 0
            : Number(options.inlevel);
        options.insize       = (isNaN(options.insize) === false && Number(options.insize) >= 0)
            ? Number(options.insize)
            : 4;
        if (options.jsscope === true || options.jsscope === "true") {
            options.jsscope = "report";
        }
        options.jsscope = (options.jsscope === "html" || options.jsscope === "report")
            ? options.jsscope
            : "none";
        if (options.methodchain !== "chain" && options.methodchain !== "none" && options.methodchain !== "indent") {
            if (options.methodchain === true || options.methodchain === "true") {
                options.methodchain = "chain";
            } else {
                options.methodchain = "indent";
            }
        }
        options.jsx          = (options.jsx === true || options.jsx === "true");
        options.miniwrap     = (options.miniwrap === true || options.miniwrap === "true");
        options.mode         = (options.mode === "minify" || options.mode === "parse" || options.mode === "diff")
            ? options.mode
            : "beautify";
        options.neverflatten = (options.neverflatten === true || options.neverflatten === "true");
        options.nocaseindent = (options.nocaseindent === true || options.nocaseindent === "true");
        options.nochainindent = (options.nochainindent === true || options.nochainindent === "true");
        options.preserve     = (function jspretty__options_preserve() {
            if (options.preserve === 1 || options.preserve === undefined || options.preserve === true || options.preserve === "all" || options.preserve === "js" || options.preserve === "css") {
                return 1;
            }
            if (options.preserve === false || isNaN(options.preserve) === true || Number(options.preserve) < 1 || options.preserve === "none") {
                return 0;
            }
            return Number(options.preserve);
        }());
        options.quoteConvert = (options.quoteConvert === "double" || options.quoteConvert === "single")
            ? options.quoteConvert
            : "none";
        options.source       = (typeof options.source === "string" && options.source.length > 0)
            ? options
                .source
                .replace(/\r\n?/g, "\n") + " "
            : "Error: no source code supplied to jspretty!";
        options.space        = (options.space !== false && options.space !== "false");
        options.styleguide   = (typeof options.styleguide === "string")
            ? options
                .styleguide
                .toLowerCase()
                .replace(/\s/g, "")
            : "";
        options.ternaryline  = (options.ternaryline === true || options.ternaryline === "true");
        options.titanium     = (options.titanium === true || options.titanium === "true");
        options.topcoms      = (options.topcoms === true || options.topcoms === "true");
        options.varword      = (options.varword === "each" || options.varword === "list")
            ? options.varword
            : "none";
        options.wrap         = (isNaN(Number(options.wrap)) === true)
            ? 0
            : Number(options.wrap);
        verticalop           = (options.vertical === true || options.vertical === "true" || options.vertical === "all" || options.vertical === "js");
    }());
    if (options.source === "Error: no source code supplied to jspretty!") {
        return options.source;
    }
    if (options.mode === "minify") {
        if (options.wrap < 1) {
            options.miniwrap = false;
        } else if (options.miniwrap === false) {
            options.wrap = -1;
        }
        options.correct = true;
    } else if (options.jsscope !== "none") {
        options.wrap = 0;
    }
    if (options.styleguide === "airbnb") {
        options.bracepadding = true;
        options.correct      = true;
        options.endcomma     = true;
        options.inchar       = " ";
        options.insize       = 2;
        options.preserve     = 1;
        options.quoteConvert = "single";
        options.varword      = "each";
        options.wrap         = 80;
    } else if (options.styleguide === "crockford" || options.styleguide === "jslint") {
        options.bracepadding = false;
        options.correct      = true;
        options.elseline     = false;
        options.endcomma     = false;
        options.inchar       = " ";
        options.insize       = 4;
        options.nocaseindent = true;
        options.nochainindent = false;
        options.space        = true;
        options.varword      = "list";
        verticalop           = false;
    } else if (options.styleguide === "google") {
        options.correct      = true;
        options.inchar       = " ";
        options.insize       = 4;
        options.preserve     = 1;
        options.quoteConvert = "single";
        verticalop           = false;
        options.wrap         = -1;
    } else if (options.styleguide === "grunt") {
        options.inchar       = " ";
        options.insize       = 2;
        options.quoteConvert = "single";
        options.varword      = "each";
    } else if (options.styleguide === "jquery") {
        options.bracepadding = true;
        options.correct      = true;
        options.inchar       = "\u0009";
        options.insize       = 1;
        options.quoteConvert = "double";
        options.varword      = "each";
        options.wrap         = 80;
    } else if (options.styleguide === "mrdoobs") {
        options.braceline    = true;
        options.bracepadding = true;
        options.correct      = true;
        options.inchar       = "\u0009";
        options.insize       = 1;
        verticalop           = false;
    } else if (options.styleguide === "mediawiki") {
        options.bracepadding = true;
        options.correct      = true;
        options.inchar       = "\u0009";
        options.insize       = 1;
        options.preserve     = 1;
        options.quoteConvert = "single";
        options.space        = false;
        options.wrap         = 80;
    } else if (options.styleguide === "meteor") {
        options.correct = true;
        options.inchar  = " ";
        options.insize  = 2;
        options.wrap    = 80;
    } else if (options.styleguide === "yandex") {
        options.bracepadding = false;
        options.correct      = true;
        options.quoteConvert = "single";
        options.varword      = "each";
        verticalop           = false;
    }
    if (options.titanium === true) {
        options.correct = false;
        token.push("x{");
        types.push("start");
        lines.push(0);
        depth.push(["global", 0]);
    }

    (function jspretty__tokenize() {
        var a              = 0,
            b              = options.source.length,
            c              = options
                .source
                .split(""),
            ltoke          = "",
            ltype          = "",
            lword          = [],
            brace          = [],
            pword          = "",
            lengtha        = 0,
            lengthb        = 0,
            wordTest       = -1,
            classy         = [],
            depthlist      = [
                ["global", 0]
            ],
            pdepth         = [],
            //depth and status of templateStrings
            templateString = [],
            //identify variable declarations
            vart           = {
                count: [],
                index: [],
                len  : -1
            },
            //peek at whats up next
            nextchar       = function jspretty__tokenize_nextchar(len, current) {
                var cc    = 0,
                    dd    = "",
                    start = (current === true)
                        ? a
                        : a + 1;
                if (typeof len !== "number" || len < 1) {
                    len = 1;
                }
                if (c[a] === "/") {
                    if (c[a + 1] === "/") {
                        dd = "\n";
                    } else if (c[a + 1] === "*") {
                        dd = "/";
                    }
                }
                for (cc = start; cc < b; cc += 1) {
                    if ((/\s/).test(c[cc]) === false) {
                        if (c[cc] === "/") {
                            if (dd === "") {
                                if (c[cc + 1] === "/") {
                                    dd = "\n";
                                } else if (c[cc + 1] === "*") {
                                    dd = "/";
                                }
                            } else if (dd === "/" && c[cc - 1] === "*") {
                                dd = "";
                            }
                        }
                        if (dd === "" && c[cc - 1] + c[cc] !== "*/") {
                            return c
                                .slice(cc, cc + len)
                                .join("");
                        }
                    } else if (dd === "\n" && c[cc] === "\n") {
                        dd = "";
                    }
                }
                return "";
            },
            //cleans up improperly applied ASI
            asifix         = function jspretty__tokenize_asifix() {
                var len = types.length;
                do {
                    len -= 1;
                } while (len > 0 && (types[len] === "comment" || types[len] === "comment-inline"));
                if (token[len] === "from") {
                    len -= 2;
                }
                if (token[len] === "x;") {
                    token.splice(len, 1);
                    types.splice(len, 1);
                    lines.splice(len, 1);
                    depth.splice(len, 1);
                }
            },
            //determine the definition of containment by depth
            depthPush      = function jspretty__tokenize_depthPush() {
                // block      : if, for, while, catch, function, class immediates : else, do,
                // try, finally, switch paren based: method, expression, paren data       :
                // array, object
                var last  = 0,
                    aa    = 0,
                    wordx = "",
                    wordy = "";
                lengtha = token.length;
                last    = lengtha - 1;
                aa      = last - 1;
                wordx   = token[aa];
                wordy   = (depth[aa] === undefined)
                    ? ""
                    : token[depth[aa][1] - 1];
                if (types[aa] === "comment" || types[aa] === "comment-inline") {
                    do {
                        aa -= 1;
                    } while (aa > 0 && (types[aa] === "comment" || types[aa] === "comment-inline"));
                    wordx = token[aa];
                }
                if ((token[last] === "{" || token[last] === "x{") && ((wordx === "else" && token[last] !== "if") || wordx === "do" || wordx === "try" || wordx === "finally" || wordx === "switch")) {
                    depth.push([wordx, last]);
                } else if (token[last] === "{" || token[last] === "x{") {
                    if (classy[classy.length - 1] === 0 && wordx !== "return") {
                        classy.pop();
                        depth.push(["class", last]);
                    } else if (token[last] === "{" && wordx === ")" && (types[depth[aa][1] - 1] === "word" || token[depth[aa][1] - 1] === "]")) {
                        if (wordy === "if") {
                            depth.push(["if", last]);
                        } else if (wordy === "for") {
                            depth.push(["for", last]);
                        } else if (wordy === "while") {
                            depth.push(["while", last]);
                        } else if (wordy === "class") {
                            depth.push(["class", last]);
                        } else if (wordy === "switch") {
                            depth.push(["switch", last]);
                        } else if (wordy === "catch") {
                            depth.push(["catch", last]);
                        } else {
                            depth.push(["function", last]);
                        }
                    } else if (token[last] === "{" && (wordx === ";" || wordx === "x;")) {
                        //ES6 block
                        depth.push(["block", last]);
                    } else if (token[last] === "{" && token[aa] === ":" && depth[aa] !== undefined && depth[aa][0] === "switch") {
                        //ES6 block
                        depth.push(["block", last]);
                    } else if (token[aa - 1] === "import" || token[aa - 2] === "import") {
                        depth.push(["object", last]);
                    } else if (wordx === ")" && (pword[0] === "function" || pword[0] === "if" || pword[0] === "for" || pword[0] === "class" || pword[0] === "while" || pword[0] === "switch" || pword[0] === "catch")) {
                        // if preceeded by a paren the prior containment is preceeded by a keyword if
                        // (...) {
                        depth.push([pword[0], last]);
                    } else if (depth[aa] !== undefined && depth[aa][0] === "notation") {
                        //if following a TSX array type declaration
                        depth.push(["function", last]);
                    } else if ((types[aa] === "literal" || types[aa] === "word") && types[aa - 1] === "word" && depth[aa] !== undefined && token[depth[aa][1] - 1] !== "for") {
                        //if preceed by a word and either string or word public class {
                        depth.push(["function", last]);
                    } else if (depthlist.length > 0 && token[aa] !== ":" && depthlist[depthlist.length - 1][0] === "object" && depth[aa] !== undefined && (token[depth[aa][1] - 2] === "{" || token[depth[aa][1] - 2] === ",")) {
                        // if an object wrapped in some containment which is itself preceeded by a curly
                        // brace or comma var a={({b:{cat:"meow"}})};
                        depth.push(["function", last]);
                    } else if (wordx === ":" && (token[aa - 2] === "var" || token[aa - 2] === "let" || token[aa - 2] === "const")) {
                        // tsx object type assignment
                        depth.push(["function", last]);
                    } else if (types[pword[1] - 1] === "markup" && token[pword[1] - 3] === "function") {
                        //checking for TSX function using an angle brace name
                        depth.push(["function", last]);
                    } else if (wordx === "=>") {
                        //checking for fat arrow assignment
                        depth.push(["function", last]);
                    } else if (wordx === ")" && depth[aa] !== undefined && depth[aa][0] === "method" && types[depth[aa][1] - 1] === "word") {
                        depth.push(["function", last]);
                    } else {
                        depth.push(["object", last]);
                    }
                } else if (token[last] === "[") {
                    if (types[aa] === "word" && wordx !== "return") {
                        depth.push(["notation", last]);
                    } else {
                        depth.push(["array", last]);
                    }
                } else if (token[last] === "(") {
                    if (token[aa] === "}" && depth[aa] !== undefined && depth[aa] === "function") {
                        depth.push(["method", last]);
                    } else if (wordx === "if" || wordx === "for" || wordx === "function" || wordx === "class" || wordx === "while" || wordx === "catch" || wordx === "switch" || wordx === "with") {
                        depth.push(["expression", last]);
                    } else if ((types[aa] === "word" && wordx !== "return") || (wordx === "}" && (depth[aa][0] === "function" || depth[aa][0] === "class"))) {
                        depth.push(["method", last]);
                    } else {
                        depth.push(["paren", last]);
                    }
                } else if (depthlist.length === 0) {
                    depth.push(["global", 0]);
                } else {
                    depth.push(depthlist[depthlist.length - 1]);
                }
            },
            //populate various parallel arrays
            tokenpush      = function jspretty__tokenize_tokenpush(comma, lin) {
                if (comma === true) {
                    token.push(",");
                    types.push("separator");
                } else {
                    token.push(ltoke);
                    types.push(ltype);
                }
                lengtha = token.length;
                lines.push(lin);
                depthPush();
            },
            //inserts ending curly brace
            blockinsert    = function jspretty__tokenize_blockinsert() {
                var next  = nextchar(4),
                    build = [],
                    g     = lengtha - 1;
                if (ltoke === ";" && token[g - 1] === "x{") {
                    //to prevent the semicolon from inserting between the braces --> while (x) {};
                    build = [token[g], types[g], lines[g], depth[g]];
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                    ltoke = "x}";
                    ltype = "end";
                    tokenpush(false, 0);
                    brace.pop();
                    pdepth = depthlist.pop();
                    ltoke  = ";";
                    ltype  = "end";
                    token.push(build[0]);
                    types.push(build[1]);
                    lines.push(build[2]);
                    depth.push(build[3]);
                    return;
                }
                ltoke = "x}";
                ltype = "end";
                if (token[lengtha - 1] === "x}") {
                    return;
                }
                if (depth[lengtha - 1][0] === "if" && (token[lengtha - 1] === ";" || token[lengtha - 1] === "x;") && next === "else") {
                    tokenpush(false, 0);
                    brace.pop();
                    pdepth = depthlist.pop();
                    return;
                }
                do {
                    tokenpush(false, 0);
                    brace.pop();
                    pdepth = depthlist.pop();
                } while (brace[brace.length - 1] === "x{");
            },
            //remove "vart" object data
            vartpop        = function jspretty__tokenize_vartpop() {
                vart
                    .count
                    .pop();
                vart
                    .index
                    .pop();
                vart.len -= 1;
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
                } while (c[f] !== "\n" && f > 0);
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
                    error = [message, error[1]];
                }
            },
            //A tokenizer for keywords, reserved words, and variables
            word           = function jspretty__tokenize_word() {
                var f        = wordTest,
                    g        = 1,
                    build    = [],
                    output   = "",
                    nextitem = "",
                    elsefix  = function jspretty__tokenize_word_elsefix(dist) {
                        brace.push("x{");
                        depthlist.push(["else", lengtha]);
                        token.splice(lengtha - dist, 1);
                        types.splice(lengtha - dist, 1);
                        lines.splice(lengtha - dist, 1);
                        depth.splice(lengtha - dist, 1);
                    };
                do {
                    build.push(c[f]);
                    if (c[f] === "\\") {
                        logError("Illegal escape in JavaScript.", a);
                    }
                    f += 1;
                } while (f < a);
                output   = build.join("");
                wordTest = -1;
                if (types.length > 1 && output === "function" && token[lengtha - 1] === "(" && (token[token.length - 2] === "{" || token[token.length - 2] === "x{")) {
                    types[types.length - 1] = "start";
                }
                if (types.length > 2 && output === "function" && ltoke === "(" && (token[token.length - 2] === "}" || token[token.length - 2] === "x}")) {
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
                if (options.correct === true && (output === "Object" || output === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && token[lengtha - 2] === "=" && token[lengtha - 1] === "new") {
                    if (output === "Object") {
                        token[lengtha - 1] = "{";
                        ltoke              = "}";
                    } else {
                        token[lengtha - 1] = "[";
                        ltoke              = "]";
                    }
                    types[lengtha - 1] = "start";
                    ltype              = "end";
                    c[a + 1]           = "";
                    c[a + 2]           = "";
                    stats.container    += 2;
                    a                  += 2;
                } else {
                    g = types.length - 1;
                    f = g;
                    if (options.varword !== "none" && output === "var") {
                        if (types[g] === "comment" || types[g] === "comment-inline") {
                            do {
                                g -= 1;
                            } while (g > 0 && (types[g] === "comment" || types[g] === "comment-inline"));
                        }
                        if (options.varword === "list" && vart.len > -1 && vart.index[vart.len] === g) {
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
                        vart
                            .count
                            .push(0);
                        vart
                            .index
                            .push(g);
                        g = f;
                    } else if (vart.len > -1 && output !== "var" && token.length === vart.index[vart.len] + 1 && token[vart.index[vart.len]] === ";" && ltoke !== "var" && options.varword === "list") {
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
                            depth.splice(f, 1);
                            g -= 1;
                            f -= 1;
                        }
                        do {
                            build = [token[g], types[g], lines[g], depth[g]];
                            token.pop();
                            types.pop();
                            lines.pop();
                            depth.pop();
                            token.splice(g - 3, 0, build[0]);
                            types.splice(g - 3, 0, build[1]);
                            lines.splice(g - 3, 0, build[2]);
                            depth.splice(g - 3, 0, build[3]);
                            f += 1;
                        } while (f < g);
                    }
                    if (output === "from" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                        asifix();
                    }
                    if (output === "while" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                        (function jspretty__tokenize_word_whilefix() {
                            var d = 0,
                                e = 0;
                            for (e = lengtha - 3; e > -1; e -= 1) {
                                if (types[e] === "end") {
                                    d += 1;
                                } else if (types[e] === "start") {
                                    d -= 1;
                                }
                                if (d < 0) {
                                    if (token[e] === "{" && token[e - 1] === "do") {
                                        asifix();
                                    }
                                    return;
                                }
                            }
                        }());
                    }
                    ltoke            = output;
                    ltype            = "word";
                    stats.word.token += 1;
                    stats.word.chars += output.length;
                    if (output === "from" && token[lengtha - 1] === "}") {
                        asifix();
                    }
                }
                tokenpush(false, 0);
                if (output === "class") {
                    classy.push(0);
                }
                if (output === "do") {
                    nextitem = nextchar();
                    if (nextitem !== "{") {
                        ltoke = "x{";
                        ltype = "start";
                        brace.push("x{");
                        tokenpush(false, 0);
                        depthlist.push([
                            "do", lengtha - 1
                        ]);
                    }
                }
                if (output === "else") {
                    nextitem = nextchar(2, true);
                    if (nextitem !== "if" && nextitem.charAt(0) !== "{") {
                        ltoke = "x{";
                        ltype = "start";
                        brace.push("x{");
                        tokenpush(false, 0);
                        depthlist.push([
                            "else", lengtha - 1
                        ]);
                    }
                    if (token[lengtha - 3] === "x}") {
                        if (token[lengtha - 2] === "else") {
                            if (token[lengtha - 4] === "x}" && pdepth[0] !== "if" && depth[depth.length - 2][0] === "else") {
                                elsefix(3);
                            } else if (token[lengtha - 4] === "}" && depth[lengtha - 4][0] !== "function" && depth[lengtha - 4][0] !== "object" && pdepth[0] === "if" && token[pdepth[1] - 1] === "if") {
                                elsefix(3);
                            }
                        } else if (token[lengtha - 2] === "x}" && depth[depth.length - 2][0] === "if") {
                            elsefix(3);
                        }
                    }
                }
            },
            //sort object properties
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
                    pairLines = [],
                    pairDepth = [];
                if (token[end] === "," || types[end] === "comment") {
                    do {
                        end -= 1;
                    } while (end > 0 && (token[end] === "," || types[end] === "comment"));
                }
                for (cc = end; cc > -1; cc -= 1) {
                    if (types[cc] === "end") {
                        dd += 1;
                    }
                    if (types[cc] === "start") {
                        dd -= 1;
                    }
                    if (dd === 0) {
                        if (types[cc].indexOf("template") > -1) {
                            return;
                        }
                        if (token[cc] === ",") {
                            commaTest = true;
                            start     = cc + 1;
                        }
                        if (commaTest === true && token[cc] === "," && start < end) {
                            if (token[end] !== ",") {
                                end += 1;
                            }
                            if (types[start] === "comment-inline") {
                                start += 1;
                            }
                            keys.push([start, end]);
                            end = start - 1;
                        }
                    }
                    if (dd < 0 && cc < startlen) {
                        if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                            ee = keys[keys.length - 1][0];
                            if (types[ee - 1] !== "comment-inline") {
                                ee -= 1;
                            }
                            keys.push([
                                cc + 1,
                                ee
                            ]);
                        }
                        if (token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "(" || token[cc - 1] === "[" || token[cc - 1] === "," || types[cc - 1] === "word" || cc === 0) {
                            if (keys.length > 1) {
                                keys.sort(sort);
                                keylen    = keys.length;
                                commaTest = false;
                                for (dd = 0; dd < keylen; dd += 1) {
                                    keyend = keys[dd][1];
                                    if (lines[keys[dd][0] - 1] > 1 && pairLines.length > 0) {
                                        pairLines[pairLines.length - 1] = lines[keys[dd][0] - 1];
                                    }
                                    for (ee = keys[dd][0]; ee < keyend; ee += 1) {
                                        pairToken.push(token[ee]);
                                        pairTypes.push(types[ee]);
                                        pairLines.push(lines[ee]);
                                        pairDepth.push(depth[ee]);

                                        //remove extra commas
                                        if (token[ee] === ",") {
                                            commaTest = true;
                                        } else if (token[ee] !== "," && types[ee] !== "comment" && types[ee] !== "comment-inline") {
                                            commaTest = false;
                                        }
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
                                        pairLines.splice(ee, 0, pairLines[ee - 1]);
                                        pairDepth.splice(ee, 0, ["object", cc]);
                                        pairLines[ee - 1] = 0;
                                    }
                                }
                                ee = pairTypes.length;
                                do {
                                    ee -= 1;
                                } while (ee > 0 && (pairTypes[ee] === "comment" || pairTypes[ee] === "comment-inline"));
                                if (options.endcomma === false) {
                                    pairToken.splice(ee, 1);
                                    pairTypes.splice(ee, 1);
                                    pairLines.splice(ee, 1);
                                    pairDepth.splice(ee, 1);
                                }
                                keylen = token.length - (cc + 1);
                                token.splice(cc + 1, keylen);
                                types.splice(cc + 1, keylen);
                                lines.splice(cc + 1, keylen);
                                depth.splice(cc + 1, keylen);
                                token     = token.concat(pairToken);
                                types     = types.concat(pairTypes);
                                lines     = lines.concat(pairLines);
                                depth     = depth.concat(pairDepth);
                                lengtha   = token.length;
                                pairToken = [cc];
                                for (cc = cc + 1; cc < lengtha; cc += 1) {
                                    if (types[cc] === "start") {
                                        pairToken.push(cc);
                                    }
                                    depth[cc][1] = pairToken[pairToken.length - 1];
                                    if (types[cc] === "end") {
                                        pairToken.pop();
                                    }
                                }
                            } else if (options.endcomma === true && types[lengtha - 1] !== "start") {
                                tokenpush(true, 0);
                            }
                        }
                        return;
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
            // commaComment ensures that commas immediately precede comments instead of
            // immediately follow
            commaComment   = function jspretty__tokenize_commacomment() {
                var x = types.length;
                if (depth[lengtha - 1][0] === "object" && objsortop === true) {
                    ltoke = ",";
                    ltype = "separator";
                    asifix();
                    tokenpush(false, 0);
                } else {
                    do {
                        x -= 1;
                    } while (x > 0 && (types[x - 1] === "comment" || types[x - 1] === "comment-inline"));
                    token.splice(x, 0, ",");
                    types.splice(x, 0, "separator");
                    lines.splice(x, 0, 0);
                    depthPush();
                }
            },
            //injects a comma into the end of arrays for use with endcomma option
            endCommaArray  = function jspretty__tokenize_endCommaArray() {
                var d = 0,
                    e = 0;
                for (d = lengtha; d > 0; d -= 1) {
                    if (types[d] === "end") {
                        e += 1;
                    } else if (types[d] === "start") {
                        e -= 1;
                    }
                    if (e < 0) {
                        return;
                    }
                    if (e === 0 && token[d] === ",") {
                        return tokenpush(true, 0);
                    }
                }
            },
            //automatic semicolon insertion
            asi            = function jspretty__tokenize_asi(isEnd) {
                var len   = token.length - 1,
                    aa    = 0,
                    next  = nextchar(1),
                    tokel = token[len],
                    typel = types[len],
                    deepl = depth[len],
                    clist = (depthlist.length === 0)
                        ? ""
                        : depthlist[depthlist.length - 1][0];
                if (tokel === ";" || tokel === "," || (typel !== undefined && typel.indexOf("template") > -1) || (next === ";" && isEnd === false)) {
                    return;
                }
                if (tokel === "}" && (deepl[0] === "function" || deepl[0] === "if" || deepl[0] === "else" || deepl[0] === "for" || deepl[0] === "do" || deepl[0] === "while" || deepl[0] === "switch" || deepl[0] === "class" || deepl[0] === "try" || deepl[0] === "catch" || deepl[0] === "finally" || deepl[0] === "block")) {
                    if (token[deepl[1] - 1] === ")") {
                        aa = depth[deepl[1] - 1][1] - 1;
                        if (token[aa - 1] === "function") {
                            aa -= 1;
                        }
                        if (depth[aa - 1] !== undefined && (depth[aa - 1][0] === "object" || depth[aa - 1][0] === "switch")) {
                            return;
                        }
                        if (token[aa - 1] !== "=" && token[aa - 1] !== "return" && token[aa - 1] !== ":") {
                            return;
                        }
                    } else {
                        return;
                    }
                }
                if (typel === "comment" || typel === "comment-inline" || clist === "method" || clist === "paren" || clist === "expression" || clist === "array" || clist === "object" || (clist === "switch" && token[depth[lengtha - 1][1]] === "(") || (lengtha > 0 && depth[lengtha - 1] !== undefined && depth[lengtha - 1][0] === "expression")) {
                    return;
                }
                if (next !== "" && "=<>+*?|^:&%~,.()]".indexOf(next) > -1 && isEnd === false) {
                    return;
                }
                if (typel === "comment" || typel === "comment-inline") {
                    do {
                        len -= 1;
                    } while (len > 0 && (types[len] === "comment" || types[len] === "comment-inline"));
                    if (len < 1) {
                        return;
                    }
                    tokel = token[len];
                    typel = types[len];
                    deepl = depth[len][0];
                }
                if (tokel === undefined || typel === "start" || typel === "separator" || typel === "operator" || tokel === "x}" || tokel === "var" || tokel === "let" || tokel === "const" || tokel === "else" || tokel.indexOf("#!/") === 0 || tokel === "instanceof") {
                    return;
                }
                if (deepl[0] === "method" && (token[deepl[1] - 1] === "function" || token[deepl[1] - 2] === "function")) {
                    return;
                }
                ltoke = ";";
                ltype = "separator";
                token.splice(len + 1, 0, "x;");
                types.splice(len + 1, 0, "separator");
                lines.splice(len, 0, 0);
                depthPush();
                if (brace[brace.length - 1] === "x{" && nextchar !== "}") {
                    blockinsert();
                }
            },
            //convert ++ and -- into += and -= in most cases
            plusplus       = function jspretty__tokenize_plusplus() {
                var store = [],
                    pre   = true,
                    toke  = "+=",
                    tokea = "",
                    tokeb = "",
                    tokec = "",
                    inc   = 0,
                    ind   = 0,
                    next  = "";
                lengtha = token.length;
                tokea   = token[lengtha - 1];
                tokeb   = token[lengtha - 2];
                tokec   = token[lengtha - 3];
                if (options.correct === false || (tokea !== "++" && tokea !== "--" && tokeb !== "++" && tokeb !== "--")) {
                    return;
                }
                next = nextchar(1);
                if ((tokea === "++" || tokea === "--") && (c[a] === ";" || next === ";")) {
                    toke = depth[lengtha - 1][0];
                    if (toke === "array" || toke === "method" || toke === "object" || toke === "paren" || toke === "notation" || token[depth[lengtha - 1][1] - 1] === "while") {
                        return;
                    }
                    inc = lengtha - 1;
                    do {
                        inc -= 1;
                        if (token[inc] === "return") {
                            return;
                        }
                        if (types[inc] === "end") {
                            do {
                                inc = depth[inc][1] - 1;
                            } while (types[inc] === "end" && inc > 0);
                        }
                    } while (inc > 0 && (token[inc] === "." || types[inc] === "word" || types[inc] === "end"));
                    if (token[inc] === ",") {
                        return;
                    }
                    if (types[inc] === "operator") {
                        if (depth[inc][0] === "switch" && token[inc] === ":") {
                            do {
                                inc -= 1;
                                if (types[inc] === "start") {
                                    ind -= 1;
                                    if (ind < 0) {
                                        break;
                                    }
                                } else if (types[inc] === "end") {
                                    ind += 1;
                                }
                                if (token[inc] === "?" && ind === 0) {
                                    return;
                                }
                            } while (inc > 0);
                        } else {
                            return;
                        }
                    }
                    pre = false;
                    if (tokea === "--") {
                        toke = "-=";
                    } else {
                        toke = "+=";
                    }
                } else if (tokec === "[" || tokec === ";" || tokec === "x;" || tokec === "}" || tokec === "{" || tokec === "(" || tokec === ")" || tokec === "," || tokec === "return") {
                    if (tokea === "++" || tokea === "--") {
                        if (tokec === "[" || tokec === "(" || tokec === "," || tokec === "return") {
                            return;
                        }
                        if (tokea === "--") {
                            toke = "-=";
                        }
                        pre = false;
                    } else if (tokeb === "--" || tokea === "--") {
                        toke = "-=";
                    }
                } else {
                    return;
                }
                if (pre === true) {
                    store.push(tokea);
                    store.push(types[lengtha - 1]);
                    store.push(lines[lengtha - 1]);
                    store.push(depth[lengtha - 1]);
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                    token.push(store[0]);
                    types.push(store[1]);
                    lines.push(store[2]);
                    depth.push(store[3]);
                    ltoke = toke;
                    ltype = "operator";
                    tokenpush(false, 0);
                    ltoke = "1";
                    ltype = "literal";
                    tokenpush(false, 0);
                } else {
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                    ltoke = toke;
                    ltype = "operator";
                    tokenpush(false, 0);
                    ltoke = "1";
                    ltype = "literal";
                    tokenpush(false, 0);
                }
                ltoke = token[lengtha - 1];
                ltype = types[lengtha - 1];
                if (next === "}" && c[a] !== ";") {
                    asi(false);
                }
            },
            //fixes asi location if inserted after an inserted brace
            asibrace       = function jspretty__tokenize_asibrace() {
                var aa = token.length;
                do {
                    aa -= 1;
                } while (aa > -1 && token[aa] === "x}");
                if (depth[aa][0] === "else") {
                    return tokenpush(false, 0);
                }
                aa += 1;
                token.splice(aa, 0, ltoke);
                types.splice(aa, 0, ltype);
                lines.push(0);
                depthPush();
            },
            //convert double quotes to single or the opposite
            quoteConvert   = function jspretty__tokenize_quoteConvert(item) {
                var dub   = (options.quoteConvert === "double"),
                    qchar = (dub === true)
                        ? "\""
                        : "'";
                item = item.slice(1, item.length - 1);
                if (dub === true) {
                    item = item.replace(/"/g, "'");
                } else {
                    item = item.replace(/'/g, "\"");
                }
                return qchar + item + qchar;
            },
            //manage comments beginning with "//"
            linecomment    = function jspretty__tokenize_commentLine(comment) {
                var prior        = "",
                    ptype        = "",
                    xblock       = (function jspretty__tokenize_commentLine_xblock() {
                        if (token[lengtha - 1] !== "x}" || (lines[lengtha - 1] > 0 && nextchar(4) !== "else") || (token[lengtha - 1] === "x}" && (token[lengtha - 2] === "}" || token[lengtha - 2] === "x}"))) {
                            return false;
                        }
                        token.pop();
                        types.pop();
                        lines.pop();
                        depth.pop();
                        return true;
                    }()),
                    empty        = (/^(\/\/\s*)$/),
                    list         = (/^(\/\/\s*(\*|-|(\d+\.))\s)/),
                    remind       = (/^(\/\/\s*((todo)|(note:)))/i),
                    commentSplit = function jspretty__tokenize_commentLine_commentSplit() {
                        var start   = options.wrap,
                            spacely = (comment.indexOf(" ") > 0);
                        comment = comment.slice(2);
                        if (spacely === true) {
                            start = options.wrap - 2;
                            do {
                                //split comments by word if possible
                                if (comment.charAt(start) !== " " && start < comment.length) {
                                    do {
                                        start -= 1;
                                    } while (start > 0 && comment.charAt(start) !== " ");
                                }
                                if (start > 0) {
                                    //if a comment is being split by word
                                    if (comment.charAt(0) === " ") {
                                        ltoke = "//" + comment
                                            .slice(0, start)
                                            .replace(/(\s+)$/, "");
                                    } else {
                                        ltoke = "// " + comment
                                            .slice(0, start)
                                            .replace(/(\s+)$/, "");
                                    }
                                    tokenpush(false, 0);
                                } else {
                                    //if a comment is a run of characters that is not space separated
                                    start = options.wrap - 2;
                                    if (comment.charAt(0) === " ") {
                                        ltoke = "//" + comment
                                            .slice(0, start)
                                            .replace(/(\s+)$/, "");
                                    } else {
                                        ltoke = "// " + comment
                                            .slice(0, start)
                                            .replace(/(\s+)$/, "");
                                    }
                                    tokenpush(false, 0);
                                }
                                if ((start === options.wrap - 3 && comment.charAt(0) === " ") || (start === options.wrap - 2)) {
                                    comment = comment.slice(start);
                                } else {
                                    comment = comment.slice(start + 1);
                                }
                                start = options.wrap - 2;
                                if (comment.charAt(0) === " ") {
                                    start -= 1;
                                }
                            } while (comment.length > start);
                            if (comment !== "") {
                                if (comment.charAt(0) === " ") {
                                    ltoke = "//" + comment
                                        .slice(0, start)
                                        .replace(/(\s+)$/, "");
                                } else {
                                    ltoke = "// " + comment
                                        .slice(0, start)
                                        .replace(/(\s+)$/, "");
                                }
                                tokenpush(false, 0);
                            }
                        } else {
                            if (prior.indexOf("//") === 0 && prior.length < start && prior.indexOf(" ") === -1 && comment.indexOf(" ") === -1) {
                                start              = start - prior.length;
                                token[lengtha - 1] = prior + comment.slice(0, start);
                                comment            = comment.slice(start);
                                start              = options.wrap;
                            }
                            start -= 2;
                            do {
                                ltoke = "//" + comment
                                    .slice(0, start)
                                    .replace(/(\s+)$/, "");
                                tokenpush(false, 0);
                                comment = comment.slice(start);
                            } while (comment.length > start);
                            if (comment !== "") {
                                ltoke = "//" + comment
                                    .slice(0, start)
                                    .replace(/(\s+)$/, "");
                                tokenpush(false, 0);
                            }
                        }
                    };

                lengtha = token.length;
                if (lengtha > 0) {
                    prior = token[lengtha - 1];
                    ptype = types[lengtha - 1];
                }
                if (lines[lines.length - 1] === 0 && ltype !== "comment" && ltype !== "comment-inline" && options.styleguide !== "mrdoobs") {
                    ltype = "comment-inline";
                } else {
                    ltype = "comment";
                }
                if (ltype === "comment" && ptype !== "comment-inline" && options.wrap > 0 && empty.test(comment) === false && (comment.length > options.wrap || prior.indexOf("//") === 0)) {
                    if (lengtha > 0 && token[lengtha - 1].indexOf("//") === 0 && empty.test(token[lengtha - 1]) === false && list.test(comment) === false && remind.test(comment) === false) {
                        if (comment.charAt(2) !== " ") {
                            comment = prior + " " + comment.slice(2);
                        } else {
                            comment = prior + comment.slice(2);
                        }
                        token.pop();
                        types.pop();
                        lines.pop();
                        depth.pop();
                        lengtha -= 1;
                    }
                    if (comment.length > options.wrap - 2) {
                        commentSplit();
                    } else {
                        ltoke = comment;
                        tokenpush(false, 0);
                    }
                } else if (options.wrap < 0 && prior.indexOf("//") === 0) {
                    if (comment.charAt(2) !== " ") {
                        token[lengtha - 1] = prior + " " + comment.slice(2);
                    } else {
                        token[lengtha - 1] = prior + comment.slice(2);
                    }
                } else {
                    ltoke = comment;
                    tokenpush(false, 0);
                }
                if (xblock === true) {
                    token.push("x}");
                    types.push("end");
                    lines.push(0);
                    depth[lengtha - 1] = pdepth;
                    depth.push(pdepth);
                }
            },
            //breaks long string down into smaller chunks defined by options.wrap
            strlen         = function jspretty__tokenize_strlen(item) {
                var aa    = 0,
                    bb    = 0,
                    cc    = 0,
                    dd    = 0,
                    ee    = 0,
                    ff    = 0,
                    uchar = (/u[0-9a-fA-F]{4}/),
                    xchar = (/x[0-9a-fA-F]{2}/),
                    qchar = item.charAt(0),
                    paren = (c[a + 1] === "." && (item.charAt(0) === "\"" || item.charAt(0) === "''"));
                if (item.length > options.wrap + 2) {
                    if (paren === true) {
                        ltoke = "(";
                        ltype = "start";
                        tokenpush(false, 0);
                        dd = -1;
                    }
                    item = item.slice(1, item.length - 1);
                    bb   = parseInt(item.length / options.wrap, 10) * options.wrap;
                    for (aa = 0; aa < bb; aa += options.wrap) {
                        cc = aa + options.wrap + dd - ff;
                        if (item.charAt(cc - 5) === "\\" && uchar.test(item.slice(cc - 4, cc + 1)) === true) {
                            ff += 5;
                            cc -= 5;
                        } else if (item.charAt(cc - 4) === "\\" && uchar.test(item.slice(cc - 3, cc + 2)) === true) {
                            ff += 4;
                            cc -= 4;
                        } else if (item.charAt(cc - 3) === "\\" && (uchar.test(item.slice(cc - 2, cc + 3)) === true || xchar.test(item.slice(cc - 2, cc + 1)) === true)) {
                            ff += 3;
                            cc -= 3;
                        } else if (item.charAt(cc - 2) === "\\" && (uchar.test(item.slice(cc - 1, cc + 4)) === true || xchar.test(item.slice(cc - 1, cc + 2)) === true)) {
                            ff += 2;
                            cc -= 2;
                        } else if (item.charAt(cc - 1) === "\\" && (uchar.test(item.slice(cc, cc + 5)) === true || xchar.test(item.slice(cc, cc + 3)) === true)) {
                            ff += 1;
                            cc -= 1;
                        }
                        if (aa > 0 && dd < 0) {
                            aa -= 1;
                            dd = 0;
                        }
                        if (item.charAt(cc - 1) === "\\") {
                            ltoke = qchar + item.slice(ee, cc - 1) + qchar;
                            ee    = cc - 1;
                            aa    -= 1;
                        } else {
                            ltoke = qchar + item.slice(ee, cc) + qchar;
                            ee    = cc;
                        }
                        ltype = "literal";
                        tokenpush(false, 0);
                        ltoke = "+";
                        ltype = "operator";
                        tokenpush(false, 0);
                    }
                    if (aa < item.length) {
                        ltoke = qchar + item.slice(aa, aa + options.wrap) + qchar;
                        ltype = "literal";
                        tokenpush(false, 0);
                    } else {
                        token.pop();
                        types.pop();
                        lines.pop();
                        depth.pop();
                        lengtha = token.length;
                    }
                    if (paren === true) {
                        ltoke = ")";
                        ltype = "end";
                        tokenpush(false, 0);
                    }
                } else {
                    ltoke = item;
                    ltype = "literal";
                    tokenpush(false, 0);
                }
                ltoke = token[lengtha - 1];
                ltype = types[lengtha - 1];
            },
            //merges strings separated by "+" if options.wrap is less than 0
            strmerge       = function jspretty__tokenize_strmerge(item, wrap) {
                var aa = 0,
                    bb = "";
                item = item.slice(1, item.length - 1);
                token.pop();
                types.pop();
                lines.pop();
                depth.pop();
                aa = token.length - 1;
                bb = token[aa];
                if (wrap === true) {
                    bb = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                    strlen(bb);
                } else {
                    token[aa] = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                }
            },
            newarray       = function jspretty__tokenize_newarray() {
                var aa       = token.length - 1,
                    bb       = 0,
                    cc       = aa,
                    arraylen = 0;
                for (aa = aa; aa > -1; aa -= 1) {
                    if (types[aa] === "end") {
                        bb += 1;
                    }
                    if (types[aa] === "start") {
                        bb -= 1;
                    }
                    if (bb === -1 || (bb === 0 && token[aa] === ";")) {
                        break;
                    }
                }
                if (token[aa] === "(" && token[aa - 1] === "Array" && token[aa - 2] === "new") {
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
                        depth.pop();
                        depth.pop();
                        depth.pop();
                        token[token.length - 1] = "[";
                        types[types.length - 1] = "start";
                        lines[lines.length - 1] = 0;
                        depth[depth.length - 1] = [
                            "array", token.length - 1
                        ];
                        do {
                            tokenpush(true, 0);
                            arraylen -= 1;
                        } while (arraylen > 0);
                    } else {
                        token[aa] = "[";
                        types[aa] = "start";
                        token.splice(aa - 2, 2);
                        types.splice(aa - 2, 2);
                        lines.splice(aa - 2, 2);
                        depth.splice(aa - 2, 2);
                        lengtha = token.length;
                        bb      = aa - 2;
                        cc      = 0;
                        do {
                            if (types[bb] === "start") {
                                cc           += 1;
                                depth[bb][1] -= 2;
                            } else if (types[bb] === "end") {
                                cc           -= 1;
                                depth[bb][1] -= 2;
                            }
                            if (cc === 0) {
                                depth[bb] = ["array", aa];
                            } else if (types[bb] !== "end") {
                                depth[bb][1] -= 2;
                            }
                            bb += 1;
                        } while (bb < lengtha);
                    }
                    ltoke = "]";
                } else {
                    ltoke = ")";
                }
                ltype = "end";
                tokenpush(false, 0);
            },
            // the generic function is a generic tokenizer start argument contains the
            // token's starting syntax offset argument is length of start minus control
            // chars end is how is to identify where the token ends
            generic        = function jspretty__tokenize_genericBuilder(starting, ending) {
                var ee     = 0,
                    ender  = ending.split(""),
                    endlen = ender.length,
                    jj     = b,
                    build  = [starting],
                    base   = a + starting.length,
                    output = "",
                    escape = false;
                if (wordTest > -1) {
                    word();
                }
                // this insanity is for JSON where all the required quote characters are escaped.
                if (c[a - 1] === "\\" && slashes(a - 1) === true && (c[a] === "\"" || c[a] === "'")) {
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                    if (token[0] === "{") {
                        if (c[a] === "\"") {
                            starting  = "\"";
                            ending = "\\\"";
                            build  = ["\""];
                        } else {
                            starting  = "'";
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
                    if (ee > a + 1) {
                        if (c[ee] === "<" && c[ee + 1] === "?" && c[ee + 2] === "p" && c[ee + 3] === "h" && c[ee + 4] === "p" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                            a = ee;
                            build.push(jspretty__tokenize_genericBuilder("<?php", "?>"));
                            ee += build[build.length - 1].length - 1;
                        } else if (c[ee] === "<" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                            a = ee;
                            build.push(jspretty__tokenize_genericBuilder("<%", "%>"));
                            ee += build[build.length - 1].length - 1;
                        } else if (c[ee] === "{" && c[ee + 1] === "%" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                            a = ee;
                            build.push(jspretty__tokenize_genericBuilder("{%", "%}"));
                            ee += build[build.length - 1].length - 1;
                        } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] === "{" && c[ee + 3] !== starting && starting !== "//" && starting !== "/*") {
                            a = ee;
                            build.push(jspretty__tokenize_genericBuilder("{{{", "}}}"));
                            ee += build[build.length - 1].length - 1;
                        } else if (c[ee] === "{" && c[ee + 1] === "{" && c[ee + 2] !== starting && starting !== "//" && starting !== "/*") {
                            a = ee;
                            build.push(jspretty__tokenize_genericBuilder("{{", "}}"));
                            ee += build[build.length - 1].length - 1;
                        } else if (c[ee] === "<" && c[ee + 1] === "!" && c[ee + 2] === "-" && c[ee + 3] === "-" && c[ee + 4] === "#" && c[ee + 5] !== starting && starting !== "//" && starting !== "/*") {
                            a = ee;
                            build.push(jspretty__tokenize_genericBuilder("<!--#", "-->"));
                            ee += build[build.length - 1].length - 1;
                        } else {
                            build.push(c[ee]);
                        }
                    } else {
                        build.push(c[ee]);
                    }
                    if ((starting === "\"" || starting === "'") && c[ee - 1] !== "\\" && (c[ee] === "\n" || ee === jj - 1)) {
                        logError("Unterminated string in JavaScript.", ee);
                        break;
                    }
                    if (c[ee] === ender[endlen - 1] && (c[ee - 1] !== "\\" || slashes(ee - 1) === false)) {
                        if (endlen === 1) {
                            break;
                        }
                        // `ee - base` is a cheap means of computing length of build array the `ee -
                        // base` and `endlen` are both length based values, so adding two (1 for each)
                        // provides an index based number
                        if (build[ee - base] === ender[0] && build.slice(ee - base - endlen + 2).join("") === ending) {
                            break;
                        }
                    }
                }
                if (escape === true) {
                    output = build[build.length - 1];
                    build.pop();
                    build.pop();
                    build.push(output);
                }
                a = ee;
                if (starting === "//") {
                    stats.space.newline += 1;
                    build.pop();
                }
                output = build.join("");
                if (starting === "//") {
                    output = output.replace(/(\s+)$/, "");
                } else if (starting === "/*") {
                    build = output.split(lf);
                    for (ee = build.length - 1; ee > -1; ee -= 1) {
                        build[ee] = build[ee].replace(/(\s+)$/, "");
                    }
                    output = build.join(lf);
                }
                if (options.jsscope !== "none") {
                    output = output
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                }
                if (starting === "{%") {
                    if (output.indexOf("{%-") < 0) {
                        output = output.replace(/^(\{%\s*)/, "{% ").replace(/(\s*%\})$/, " %}");
                    } else {
                        output = output.replace(/^(\{%-\s*)/, "{%- ").replace(/(\s*-%\})$/, " -%}");
                    }
                }
                return output;
            },
            //a tokenizer for regular expressions
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
                output = build.join("");
                if (options.jsscope !== "none") {
                    output = output
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                }
                return output;
            },
            //a unique tokenizer for operator characters
            operator       = function jspretty__tokenize_operator() {
                var syntax = [
                        "=",
                        "<",
                        ">",
                        "+",
                        "*",
                        "?",
                        "|",
                        "^",
                        ":",
                        "&",
                        "%",
                        "~"
                    ],
                    g      = 0,
                    h      = 0,
                    jj     = b,
                    build  = [c[a]],
                    synlen = syntax.length,
                    output = "";
                if (wordTest > -1) {
                    word();
                }
                if (c[a] === "/" && (lengtha > 0 && (ltype !== "word" || ltoke === "typeof" || ltoke === "return" || ltoke === "else") && ltype !== "literal" && ltype !== "end")) {
                    if (ltoke === "return" || ltoke === "typeof" || ltoke === "else" || ltype !== "word") {
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
                    tokenpush(false, 0);
                    return "regex";
                }
                if (a < b - 1) {
                    if (c[a] !== "<" && c[a + 1] === "<") {
                        return c[a];
                    }
                    if (c[a] === "!" && c[a + 1] === "/") {
                        return "!";
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
                    if ((c[a + 1] === "+" && c[a + 2] === "+") || (c[a + 1] === "-" && c[a + 2] === "-")) {
                        output = c[a];
                    } else {
                        for (g = a + 1; g < jj; g += 1) {
                            if ((c[g] === "+" && c[g + 1] === "+") || (c[g] === "-" && c[g + 1] === "-")) {
                                break;
                            }
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
                }
                a = a + (output.length - 1);
                if (options.jsscope !== "none") {
                    output = output
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                }
                return output;
            },
            //ES6 template string support
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
            //a tokenizer for numbers
            numb           = function jspretty__tokenize_number() {
                var ee    = 0,
                    f     = b,
                    build = [c[a]],
                    test  = /zz/,
                    dot   = (build[0] === ".");
                if (a < b - 2 && c[a] === "0") {
                    if (c[a + 1] === "x") {
                        test = /[0-9a-fA-F]/;
                    } else if (c[a + 1] === "o") {
                        test = /[0-9]/;
                    } else if (c[a + 1] === "b") {
                        test = /0|1/;
                    }
                    if (test.test(c[a + 2]) === true) {
                        build.push(c[a + 1]);
                        ee = a + 1;
                        do {
                            ee += 1;
                            build.push(c[ee]);
                        } while (test.test(c[ee + 1]) === true);
                        a = ee;
                        return build.join("");
                    }
                }
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
            // Not a tokenizer.  This counts white space characters and determines if there
            // are empty lines to be preserved
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
                    schars = output.split("\n");
                    if (schars.length > 2) {
                        emptyline = schars.length - 1;
                        if (token[lengtha - 1].indexOf("//") === 0) {
                            emptyline += 1;
                        }
                        if (emptyline > options.preserve + 1) {
                            emptyline = options.preserve + 1;
                        }
                    } else if (token[lengtha - 1].indexOf("//") === 0) {
                        emptyline = 2;
                    }
                    lines[lines.length - 1] = emptyline;
                }
                if (asitest === true && ltoke !== ";" && lengthb < token.length && c[a + 1] !== "}") {
                    asi(false);
                    lengthb = token.length;
                }
            },
            // Identifies blocks of markup embedded within JavaScript for language supersets
            // like React JSX.
            markup         = function jspretty__tokenize_markup() {
                var output     = [],
                    curlytest  = false,
                    endtag     = false,
                    anglecount = 0,
                    curlycount = 0,
                    tagcount   = 0,
                    d          = 0,
                    syntax     = "=<>+*?|^:&.,;%(){}[]|~0123456789";
                if (wordTest > -1) {
                    word();
                }
                if (syntax.indexOf(c[a + 1]) > -1 || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "literal" || (ltype === "word" && ltoke !== "return")))) {
                    ltype = "operator";
                    return operator();
                }
                d = token.length - 1;
                if (token[d] === "return" || types[d] === "operator" || token[d] === "(") {
                    ltype            = "markup";
                    global.jsxstatus = true;
                } else {
                    ltype = "operator";
                    return operator();
                }
                for (a = a; a < b; a += 1) {
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
                            ltype = "markup";
                            return output.join("");
                        }
                        endtag = false;
                    }
                }
                ltype = "markup";
                return output.join("");
            },
            //operations for start types: (, [, {
            start          = function jspretty__tokenize_start(x) {
                brace.push(x);
                stats.container += 1;
                if (wordTest > -1) {
                    word();
                }
                if (vart.len > -1) {
                    vart.count[vart.len] += 1;
                }
                if (token[lengtha - 2] === "function") {
                    lword.push(["function", lengtha]);
                } else {
                    lword.push([ltoke, lengtha]);
                }
                ltoke = x;
                ltype = "start";
                if (x === "(") {
                    asifix();
                } else if (x === "{") {
                    if (ltoke === ")") {
                        asifix();
                    }
                    if ((ltype === "comment" || ltype === "comment-inline") && token[lengtha - 2] === ")") {
                        ltoke              = token[lengtha - 1];
                        token[lengtha - 1] = "{";
                        ltype              = types[lengtha - 1];
                        types[lengtha - 1] = "start";
                    }
                }
                if (options.braceline === true && x === "{") {
                    tokenpush(false, 2);
                } else {
                    tokenpush(false, 0);
                }
                if (classy.length > 0) {
                    classy[classy.length - 1] += 1;
                }
                depthlist.push(depth[depth.length - 1]);
            },
            //operations for end types: ), ], }
            end            = function jspretty__tokenize_end(x) {
                var insert = false;
                stats.container += 1;
                if (wordTest > -1) {
                    word();
                }
                if (classy.length > 0) {
                    if (classy[classy.length - 1] === 0) {
                        classy.pop();
                    } else {
                        classy[classy.length - 1] -= 1;
                    }
                }
                if (x === ")" || x === "]") {
                    asifix();
                    plusplus();
                }
                if (x === ")") {
                    asi(false);
                }
                if (vart.len > -1) {
                    if (x === "}" && ((options.varword === "list" && vart.count[vart.len] === 0) || (token[token.length - 1] === "x;" && options.varword === "each"))) {
                        vartpop();
                    }
                    vart.count[vart.len] -= 1;
                    if (vart.count[vart.len] < 0) {
                        vartpop();
                    }
                }
                if (ltoke === "," && ((x === "]" && (options.endcomma === false || token[lengtha - 2] === "[")) || x === "}")) {
                    token.pop();
                    types.pop();
                    lines.pop();
                    depth.pop();
                } else if ((x === "]" || x === "}") && options.endcomma === true && ltoke !== ",") {
                    endCommaArray();
                }
                if (x === ")") {
                    ltoke = ")";
                    ltype = "end";
                    if (lword.length > 0) {
                        pword = lword[lword.length - 1];
                        if (pword.length > 1 && nextchar() !== "{" && (pword[0] === "if" || pword[0] === "for" || (pword[0] === "while" && depth[pword[1] - 2] !== undefined && depth[pword[1] - 2][0] !== "do") || pword[0] === "with")) {
                            insert = true;
                        }
                    }
                } else if (x === "]") {
                    ltoke = "]";
                    ltype = "end";
                    pword = [];
                } else if (x === "}") {
                    if (depthlist.length > 0 && depthlist[depthlist.length - 1][0] !== "object") {
                        asi(true);
                    } else if (objsortop === true) {
                        objSort();
                    }
                    if (ltype === "comment" || ltype === "comment-inline") {
                        lengtha = token.length;
                        ltoke   = token[lengtha - 1];
                        ltype   = types[lengtha - 1];
                    }
                    if (options.braceline === true) {
                        lines[lines.length - 1] = 2;
                    }
                    if (ltoke !== "," || options.endcomma === true) {
                        if (ltoke === ";" && options.mode === "minify") {
                            token[token.length - 1] = "x;";
                        }
                        plusplus();
                    }
                    ltoke = "}";
                    ltype = "end";
                    pword = [];
                }
                lword.pop();
                if (x === ")" && options.correct === true) {
                    newarray();
                } else {
                    tokenpush(false, 0);
                }
                pdepth = depthlist.pop();
                // if ((brace[brace.length - 1] === "x{" && x === "}") || (typeof pdepth ===
                // "object" && (pdepth[0] === "function" || pdepth[0] === "object") &&
                // brace[brace.length - 2] === "x{")) {
                if (brace[brace.length - 1] === "x{" && x === "}") {
                    blockinsert();
                }
                brace.pop();
                if (brace[brace.length - 1] === "x{" && x === "}" && depth[lengtha - 1][0] !== "try") {
                    blockinsert();
                }
                if (insert === true) {
                    ltoke = "x{";
                    ltype = "start";
                    tokenpush(false, 0);
                    brace.push("x{");
                    depthlist.push(pword);
                }
            },
            //determines tag names for {% %} based template tags and returns a type
            tname = function jspretty__tokenize_tname(x) {
                var sn = 2,
                    en = 0,
                    st = x.slice(0, 2),
                    len = x.length,
                    name = "",
                    namelist = ["autoescape", "block", "capture", "case", "comment", "embed", "filter", "for", "form", "if", "macro", "paginate", "raw", "sandbox", "spaceless", "tablerow", "unless", "verbatim"];
                if (x.charAt(2) === "-") {
                    sn += 1;
                }
                if ((/\s/).test(x.charAt(sn)) === true) {
                    do {
                        sn += 1;
                    } while ((/\s/).test(x.charAt(sn)) === true && sn < len);
                }
                en = sn;
                do {
                    en += 1;
                } while ((/\s/).test(x.charAt(en)) === false && x.charAt(en) !== "(" && en < len);
                if (en === len) {
                    en = x.length - 2;
                }
                name = x.slice(sn, en);
                if (name === "else" || (st === "{%" && (name === "elseif" || name === "when" || name === "elif"))) {
                    return "template_else";
                }
                if (st === "{{") {
                    if (name === "end") {
                        return "template_end";
                    }
                    if (name === "block" || name === "define" || name === "form" || name === "if" || name === "range" || name === "with") {
                        return "template_start";
                    }
                    return "template";
                }
                for (en = namelist.length - 1; en > -1; en -= 1) {
                    if (name === namelist[en]) {
                        return "template_start";
                    }
                    if (name === "end" + namelist[en]) {
                        return "template_end";
                    }
                }
                return "template";
            };
        for (a = 0; a < b; a += 1) {
            if ((/\s/).test(c[a])) {
                if (wordTest > -1) {
                    word();
                }
                space();
            } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                //php
                ltoke              = generic("<\?php", "?>");
                ltype              = "template";
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "<" && c[a + 1] === "%") {
                //asp
                ltoke              = generic("<%", "%>");
                ltype              = "template";
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "{" && c[a + 1] === "%") {
                //twig
                ltoke              = generic("{%", "%}");
                ltype              = tname(ltoke);
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "{" && c[a + 1] === "{" && c[a + 2] === "{") {
                //mustache
                ltoke              = generic("{{{", "}}}");
                ltype              = "template";
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "{" && c[a + 1] === "{") {
                //handlebars
                ltoke              = generic("{{", "}}");
                ltype              = tname(ltoke);
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                //ssi
                ltoke              = generic("<!--#", "-->");
                ltype              = "template";
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                //markup comment
                ltoke                    = generic("<!--", "-->");
                ltype                    = "comment";
                stats.commentBlock.token += 1;
                stats.commentBlock.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "<") {
                //markup
                ltoke              = markup();
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 0);
            } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                //comment block
                ltoke                    = generic("/*", "*\/");
                stats.commentBlock.token += 1;
                stats.commentBlock.chars += ltoke.length;
                if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                    sourcemap[0] = token.length;
                    sourcemap[1] = ltoke;
                }
                if (options.comments !== "nocomment") {
                    ltype = "comment";
                    tokenpush(false, 0);
                }
            } else if ((lines.length === 0 || lines[lines.length - 1] > 0) && c[a] === "#" && c[a + 1] === "!" && c[a + 2] === "/") {
                //shebang
                ltoke              = generic("#!/", "\n");
                ltoke              = ltoke.slice(0, ltoke.length - 1);
                ltype              = "literal";
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                tokenpush(false, 2);
            } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                //comment line
                asi(false);
                ltoke                   = generic("//", "\n");
                stats.commentLine.token += 1;
                stats.commentLine.chars += ltoke.length;
                if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                    sourcemap[0] = token.length;
                    sourcemap[1] = ltoke;
                }
                if (options.comments !== "nocomment") {
                    linecomment(ltoke);
                }
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
                tokenpush(false, 0);
            } else if (c[a] === "\"" || c[a] === "'") {
                //string
                ltoke = generic(c[a], c[a]);
                ltype = "literal";
                if ((ltoke.charAt(0) === "\"" && options.quoteConvert === "single") || (ltoke.charAt(0) === "'" && options.quoteConvert === "double")) {
                    ltoke = quoteConvert(ltoke);
                }
                stats.string.token += 1;
                if (ltoke.length > 1) {
                    stats.string.chars += ltoke.length - 2;
                }
                stats.string.quote += 2;
                if (token[lengtha - 1] === "+" && (options.mode === "minify" || options.wrap < 0) && (token[lengtha - 2].charAt(0) === "\"" || token[lengtha - 2].charAt(0) === "'")) {
                    strmerge(ltoke, false);
                } else if (options.wrap > 0 && (types[lengtha] !== "operator" || token[lengtha] === "=" || token[lengtha] === ":" || (token[lengtha] === "+" && types[lengtha - 1] === "literal"))) {
                    if ((token[0] === "[" && (/(\]\s*)$/).test(options.source) === true) || (token[0] === "{" && (/(\}\s*)$/).test(options.source) === true)) {
                        tokenpush(false, 0);
                    } else if (types[lengtha - 2] === "literal" && token[lengtha - 1] === "+" && (token[lengtha - 2].charAt(0) === "\"" || token[lengtha - 2].charAt(0) === "'") && token[lengtha - 2].length < options.wrap + 2) {
                        strmerge(ltoke, true);
                    } else {
                        strlen(ltoke);
                    }
                } else {
                    tokenpush(false, 0);
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
                tokenpush(false, 0);
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
                tokenpush(false, 0);
            } else if (c[a] === ",") {
                //comma
                if (wordTest > -1) {
                    word();
                }
                stats.comma += 1;
                if (ltype === "comment" || ltype === "comment-inline") {
                    commaComment();
                } else if (vart.len > -1 && vart.count[vart.len] === 0 && options.varword === "each") {
                    asifix();
                    ltoke = ";";
                    ltype = "separator";
                    tokenpush(false, 0);
                    ltoke = "var";
                    ltype = "word";
                    tokenpush(false, 0);
                    vart.index[vart.len] = token.length - 1;
                } else {
                    ltoke = ",";
                    ltype = "separator";
                    asifix();
                    tokenpush(false, 0);
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
                if ((/\s/).test(c[a - 1]) === true) {
                    tokenpush(false, 1);
                } else {
                    tokenpush(false, 0);
                }
            } else if (c[a] === ";") {
                //semicolon
                if (wordTest > -1) {
                    word();
                }
                if (classy[classy.length - 1] === 0) {
                    classy.pop();
                }
                if (vart.len > -1 && vart.count[vart.len] === 0) {
                    if (options.varword === "each") {
                        vartpop();
                    } else {
                        vart.index[vart.len] = token.length;
                    }
                }
                stats.semicolon += 1;
                plusplus();
                ltoke = ";";
                ltype = "separator";
                if (token[token.length - 1] === "x}") {
                    asibrace();
                } else {
                    tokenpush(false, 0);
                }
                if (brace[brace.length - 1] === "x{" && nextchar() !== "}") {
                    blockinsert();
                }
            } else if (c[a] === "(" || c[a] === "[" || c[a] === "{") {
                start(c[a]);
            } else if (c[a] === ")" || c[a] === "]" || c[a] === "}") {
                end(c[a]);
            } else if (c[a] === "*" && depth[lengtha - 1] !== undefined && depth[lengtha - 1][0] === "object" && (/\s/).test(c[a + 1]) === false && c[a + 1] !== "=") {
                wordTest = a;
            } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                //operator
                ltoke = operator();
                if (ltoke === "regex") {
                    ltoke = token[lengtha - 1];
                } else {
                    ltype                = "operator";
                    stats.operator.token += 1;
                    stats.operator.chars += ltoke.length;
                    if (ltoke !== "!" && ltoke !== "++" && ltoke !== "--") {
                        asifix();
                    }
                    tokenpush(false, 0);
                }
            } else if (wordTest < 0 && c[a] !== "") {
                wordTest = a;
            }
            if (vart.len > -1 && token.length === vart.index[vart.len] + 2 && token[vart.index[vart.len]] === ";" && ltoke !== "var" && options.varword === "list") {
                vartpop();
            }
        }
        if (options.jsx === false && ((token[token.length - 1] !== "}" && token[0] === "{") || token[0] !== "{") && ((token[token.length - 1] !== "]" && token[0] === "[") || token[0] !== "[")) {
            asi(false);
        }
        if (sourcemap[0] === token.length - 1) {
            ltoke = "\n" + sourcemap[1];
            ltype = "literal";
            tokenpush(false, 0);
        }
        if (token[token.length - 1] === "x;" && (token[token.length - 2] === "}" || token[token.length - 2] === "]") && depth[depth.length - 2][1] === 0) {
            token.pop();
            types.pop();
            lines.pop();
            depth.pop();
        }
    }());

    if (options.correct === true) {
        (function jspretty__correct() {
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

    if (options.mode === "parse") {
        return {token: token, types: types};
    }

    if (global.jsxstatus === true && options.jsscope !== "none" && token[0] === "{") {
        options.jsscope = "none";
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
    if (options.mode === "beautify" || options.mode === "diff") {
        //this function is the pretty-print algorithm
        (function jspretty__algorithm() {
            var a           = 0,
                b           = token.length,
                indent      = options.inlevel, //will store the current level of indentation
                list        = [], //stores comma status of current block
                lastlist    = false, //remembers the list status of the most recently closed block
                ternary     = [], //used to identify ternary statments
                varline     = [], //determines if a current list of the given block is a list of variables following the "var" keyword
                ctype       = "", //ctype stands for "current type"
                ctoke       = "", //ctoke standa for "current token"
                ltype       = types[0], //ltype stands for "last type"
                ltoke       = token[0], //ltype stands for "last token"
                lettest     = -1,
                varlen      = [
                    []
                ], //stores lists of variables, assignments, and object properties for white space padding
                methodbreak = [false], //are methods being broken
                arrbreak    = [], //array where a methodbreak has occurred
                destruct    = [], //attempt to identify object destructuring
                itemcount   = [], //counts items in destructured lists
                assignlist  = [false], //are you in a list right now?
                tern        = function jspretty__algorithm_tern(x) {
                    var aa       = 0,
                        bb       = depth[a][1],
                        lasttest = false;
                    if (ternary.length < 1 || ternary[ternary.length - 1] < depth[a][1] || options.ternaryline === true) {
                        return;
                    }
                    for (aa = ternary.length - 1; aa > -1; aa -= 1) {
                        if (ternary[aa] > bb) {
                            if (ctoke === ":") {
                                if (x > -1 && ternary[aa] === x) {
                                    ternary[aa] = a;
                                } else if (x < 0) {
                                    if (token[ternary[aa]] === ":") {
                                        do {
                                            ternary.pop();
                                            indent -= 1;
                                            aa     -= 1;
                                        } while (aa > -1 && token[ternary[aa]] === ":");
                                    }
                                    if (token[ternary[aa]] === "?") {
                                        level[a - 1] = level[ternary[aa] - 1];
                                        if (ternary.length > 1 && ternary[aa - 1] > depth[a][1]) {
                                            ternary[aa] = ternary[aa - 1];
                                        }
                                        break;
                                    }
                                }
                            } else {
                                indent -= 1;
                                if (ctoke === ":" && ternary.length === 1) {
                                    lasttest = true;
                                    break;
                                }
                                ternary.pop();
                            }
                        } else {
                            if (ctoke === ":" && x < 0) {
                                level[a - 1] = level[ternary[ternary.length - 1] - 1];
                            }
                            return;
                        }
                    }
                    if (lasttest === true) {
                        level[a - 1] = level[ternary[ternary.length - 1] - 1];
                        ternary.pop();
                    }
                },
                listend     = function jspretty__algorithm_listend() {
                    var aa    = 0,
                        bb    = 0,
                        nt    = token[a + 1],
                        endit = function jspretty__algorithm_listend_endit() {
                            if (varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                varlist.push(varlen[varlen.length - 1]);
                            }
                            varlen[varlen.length - 1] = [];
                        };
                    if (nt === "function" || nt === "class" || token[a + 2] === "function") {
                        return endit();
                    }
                    if (types[a + 1] === "word" && (types[a + 2] === "word" || types[a + 2] === "literal")) {
                        return endit();
                    }
                    if (token[a + 2] === "(" && depth[a + 2] !== undefined && depth[a + 2][0] !== "method") {
                        return endit();
                    }
                    for (aa = a - 1; aa > -1; aa -= 1) {
                        if (types[aa] === "end") {
                            bb += 1;
                        } else if (types[aa] === "start") {
                            bb -= 1;
                        }
                        if (bb < 0) {
                            return;
                        }
                        if (bb === 0 && token[aa] === ";") {
                            return endit();
                        }
                        if (bb === 0 && types[aa] === "operator" && (token[aa].indexOf("=") > -1 || token[aa].indexOf(":") > -1)) {
                            return;
                        }
                    }
                },
                destructfix = function jspretty__algorithm_destructFix(listFix, override) {
                    // listfix  - at the end of a list correct the containing list override - to
                    // break arrays with more than 4 items into a vertical list
                    var c          = 0,
                        d          = (listFix === true)
                            ? 0
                            : 1,
                        arrayCheck = (override === false && depth[a][0] === "array" && listFix === true && ctoke !== "[");
                    if (destruct[destruct.length - 1] === false) {
                        return;
                    }
                    destruct[destruct.length - 1] = false;
                    for (c = a - 1; c > -1; c -= 1) {
                        if (types[c] === "end") {
                            d += 1;
                        } else if (types[c] === "start") {
                            d -= 1;
                        }
                        if (depth[c][0] === "global") {
                            return;
                        }
                        if (d === 0) {
                            if (arrayCheck === false && ((listFix === false && token[c] !== "(") || (listFix === true && token[c] === ","))) {
                                if (types[c + 1] === "template_start") {
                                    if (lines[c] < 1) {
                                        level[c] = "x";
                                    } else {
                                        level[c] = indent - 1;
                                    }
                                } else if (methodbreak[methodbreak.length - 1] === true) {
                                    level[c] = indent - 1;
                                } else {
                                    level[c] = indent;
                                }
                            }
                            if (listFix !== true) {
                                return;
                            }
                        }
                        if (d < 0) {
                            if (types[c + 1] === "template_start") {
                                if (lines[c] < 1) {
                                    level[c] = "x";
                                } else {
                                    level[c] = indent - 1;
                                }
                            } else if (methodbreak[methodbreak.length - 1] === true) {
                                level[c] = indent - 1;
                            } else {
                                level[c] = indent;
                            }
                            return;
                        }
                    }
                },
                separator   = function jspretty__algorithm_separator() {
                    var methtest      = false,
                        functest      = false,
                        funcargs      = false,
                        propertybreak = function jspretty__algorithm_separator_propertybreak(funcarg) {
                            var c = 0,
                                d = 0,
                                e = 0;
                            methodbreak[methodbreak.length - 1] = true;
                            if (options.nochainindent === false) {
                                indent += 1;
                            }
                            if (funcarg === true) {
                                methtest = true;
                            }
                            for (c = a - 1; c > -1; c -= 1) {
                                if (types[c] === "end") {
                                    d += 1;
                                    if (types[c + 1] !== "end" && types[c + 1] !== "start" && token[c + 1] !== ".") {
                                        break;
                                    }
                                } else if (types[c] === "start") {
                                    d -= 1;
                                }
                                if (d === 0) {
                                    if (token[c] === ".") {
                                        if (token[c - 1] === "}") {
                                            break;
                                        }
                                        e        = c - 1;
                                        level[e] = indent;
                                        methtest = true;
                                    } else if (types[c] === "separator" || types[c] === "operator" || token[c] === "return" || token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                        if (methtest === true && token[c] === "," && types[c + 1] === "word") {
                                            level[c] = indent - 1;
                                        }
                                        if (e === 0) {
                                            methtest = false;
                                        }
                                        break;
                                    }
                                } else if (d > 0) {
                                    if (token[c] === "function") {
                                        methtest = true;
                                        functest = true;
                                        break;
                                    }
                                    if (methtest === true && (d > 1 || token[c + 1] !== ".") && level[c] !== "x" && level[c] !== "s" && token[c] !== "]") {
                                        if (depth[c][0] === "function") {
                                            return;
                                        }
                                        level[c] += 1;
                                    }
                                }
                                if (d < 0) {
                                    if (methtest === true) {
                                        level[c] = indent - 1;
                                    }
                                    break;
                                }
                            }
                            if (funcarg === false && methtest === true && types[e] !== "comment" && types[e] !== "comment-inline") {
                                if (e > 0) {
                                    level[e] = indent;
                                } else {
                                    level[a - 1] = "x";
                                }
                            }
                        };
                    if ((options.methodchain === "chain" || (options.methodchain === "none" && lines[a] < 1)) && types[a - 1] === "comment-inline" && a > 1) {
                        return (function jspretty__algorithm_separator_commentfix() {
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
                        if (token[depth[a][1]] !== "(" && methodbreak[methodbreak.length - 1] === true) {
                            if (depth[a][0] === "object" || depth[a][0] === "array") {
                                destructfix(true, false);
                            } else {
                                destructfix(false, false);
                            }
                        }
                        if ((options.methodchain === "chain" || (options.methodchain === "none" && lines[a] < 1)) && ltype !== "comment" && ltype !== "comment-inline") {
                            level[a - 1] = "x";
                        } else {
                            if (token[depth[a][1]] !== "(" && (ltoke === ")" || methodbreak[methodbreak.length - 1] === true || (types[a + 1] === "word" && depth[a + 2] !== undefined && depth[a + 2][0] === "method"))) {
                                if (methodbreak[methodbreak.length - 1] === false) {
                                    funcargs = (function jspretty__algorithm_separator_funcargs() {
                                        var aa        = 0,
                                            bb        = b,
                                            cc        = 0,
                                            firstmeth = false;
                                        for (aa = a + 1; aa < bb; aa += 1) {
                                            if (types[aa] === "end") {
                                                cc += 1;
                                                if (cc > 1 || (cc === 0 && token[aa] === ")")) {
                                                    return false;
                                                }
                                            } else if (types[aa] === "start") {
                                                cc -= 1;
                                                if (firstmeth === false && cc === -1 && depth[aa][0] === "method") {
                                                    firstmeth = true;
                                                }
                                            }
                                            if (cc === -1 && token[aa] === "function") {
                                                return true;
                                            }
                                        }
                                    }());
                                    propertybreak(funcargs);
                                    if (token[depth[a][1]] !== "(") {
                                        if (depth[a][0] === "object" || depth[a][0] === "array") {
                                            destructfix(true, false);
                                        } else {
                                            destructfix(false, false);
                                        }
                                    }
                                    if (methtest === true) {
                                        if (functest === false) {
                                            level[a - 1] = indent;
                                        } else {
                                            level[a - 1] = "x";
                                        }
                                    } else {
                                        if (options.nochainindent === false) {
                                            indent -= 1;
                                        }
                                        methodbreak[methodbreak.length - 1] = false;
                                        level[a - 1]                        = "x";
                                    }
                                } else {
                                    level[a - 1] = indent;
                                }
                            } else {
                                level[a - 1] = "x";
                            }
                        }
                        if (types[a - 1] === "comment" || types[a - 1] === "comment-inline") {
                            if (methodbreak[methodbreak.length - 1] === true) {
                                level[a - 1] = indent;
                            } else {
                                level[a - 1] = indent + 1;
                            }
                        }
                        return level.push("x");
                    }
                    if (ctoke === ",") {
                        tern(-1);
                        level[a - 1]                    = "x";
                        itemcount[itemcount.length - 1] += 1;
                        if (destruct[destruct.length - 1] === true && itemcount[itemcount.length - 1] > 4 && (depth[a][0] === "array" || depth[a][0] === "object")) {
                            destructfix(true, true);
                        }
                        if (list[list.length - 1] === false && (depth[a][0] === "object" || depth[a][0] === "array" || depth[a][0] === "paren" || depth[a][0] === "expression" || depth[a][0] === "method")) {
                            list[list.length - 1] = true;
                        }
                        if (depth[a][0] === "object" && destruct[destruct.length - 1] === true && types[depth[a][1] - 1] !== "word" && token[depth[a][1] - 1] !== "(") {
                            (function jspretty__algorithm_separator_objDestruct() {
                                var aa = 0,
                                    bb = 0;
                                for (aa = a - 1; aa > -1; aa -= 1) {
                                    if (types[aa] === "end") {
                                        bb += 1;
                                    } else if (types[aa] === "start") {
                                        bb -= 1;
                                    }
                                    if (bb < 0 || (bb === 0 && token[aa] === ",")) {
                                        return;
                                    }
                                    if (bb === 0 && token[aa] === ":") {
                                        return destructfix(true, false);
                                    }
                                }
                            }());
                        }
                        if (methodbreak[methodbreak.length - 1] === true) {
                            indent                              -= 1;
                            methodbreak[methodbreak.length - 1] = false;
                            methtest                            = true;
                            if (depth[a][0] === "array") {
                                arrbreak[arrbreak.length - 1] = true;
                                return level.push(indent);
                            }
                        }
                        if (types[a - 1] === "word" && token[a - 2] === "for") {
                            //This is for Volt templates
                            return level.push("s");
                        }
                        if (destruct[destruct.length - 1] === false || (token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'"))) {
                            if (token[a - 2] !== "+" && depth[a][0] === "method") {
                                return level.push("s");
                            }
                            return level.push(indent);
                        }
                        if (list[list.length - 1] === true) {
                            if (assignlist[assignlist.length - 1] === true && varline[varline.length - 1] === false) {
                                assignlist[assignlist.length - 1] = false;
                                varlen[varlen.length - 1]         = [];
                            }
                            return (function jspretty__algorithm_separator_inList() {
                                var c = 0,
                                    d = 0;
                                for (c = a - 1; c > -1; c -= 1) {
                                    if (types[c] === "end") {
                                        d += 1;
                                    }
                                    if (types[c] === "start") {
                                        d -= 1;
                                    }
                                    if (d === -1) {
                                        if (token[c] === "[" && token[c + 1] !== "]" && token[c + 2] !== "]") {
                                            if (destruct[destruct.length - 1] === false || arrbreak[arrbreak.length - 1] === true) {
                                                level[c] = indent;
                                            } else if (methtest === false && destruct[destruct.length - 1] === true) {
                                                level[c] = "x";
                                            }
                                            if (token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                                for (d = a - 2; d > c; d -= 2) {
                                                    if (token[d] !== "+") {
                                                        return;
                                                    }
                                                    if (token[d - 1].charAt(0) !== "\"" && token[d - 1].charAt(0) !== "'") {
                                                        level[d] = "s";
                                                    }
                                                }
                                                return;
                                            }
                                        }
                                        if (arrbreak[arrbreak.length - 1] === true) {
                                            return level.push(indent);
                                        }
                                        return level.push("s");
                                    }
                                }
                                if (arrbreak[arrbreak.length - 1] === true) {
                                    return level.push(indent);
                                }
                                return level.push("s");
                            }());
                        }
                        if (varline[varline.length - 1] === true && token[depth[a][1] - 1] !== "for") {
                            if (ltoke !== "]") {
                                (function jspretty__algorithm_separator_varline() {
                                    var c     = 0,
                                        brace = false;
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if (token[c] === "]") {
                                            brace = true;
                                        }
                                        if (types[c] === "start") {
                                            if (token[c] === "[" && token[c + 1] !== "]" && brace === false) {
                                                level[c] = indent;
                                            }
                                            return;
                                        }
                                    }
                                }());
                            }
                            if (ltype === "literal" && token[a - 2] === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                return level.push(indent);
                            }
                            return level.push(indent);
                        }
                        if (destruct[destruct.length - 1] === true && depth[a][0] !== "object") {
                            return level.push("s");
                        }
                        return level.push(indent);
                    }
                    if (ctoke === ";" || ctoke === "x;") {
                        tern(-1);
                        listend();
                        if (ctoke === "x;") {
                            scolon += 1;
                        }
                        if (methodbreak[methodbreak.length - 1] === true) {
                            indent                              -= 1;
                            methodbreak[methodbreak.length - 1] = false;
                        }
                        level[a - 1] = "x";
                        if (varline[varline.length - 1] === true) {
                            varline[varline.length - 1] = false;
                            if (depth[a][0] !== "method" && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                varlist.push(varlen[varlen.length - 1]);
                            }
                            varlen[varlen.length - 1] = [];
                            (function jspretty__algorithm_separator_varlinefix() {
                                var c = 0,
                                    d = 0;
                                for (c = a - 1; c > -1; c -= 1) {
                                    if (types[c] === "start") {
                                        d += 1;
                                    }
                                    if (types[c] === "end") {
                                        d -= 1;
                                    }
                                    if (d > 0) {
                                        return;
                                    }
                                    if (d === 0) {
                                        if (token[c] === "var" || token[c] === "let" || token[c] === "const") {
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
                        if (depth[a][1] > 0 && token[depth[a][1] - 1] === "for" && depth[a][0] !== "for") {
                            return level.push("s");
                        }
                        return level.push(indent);
                    }
                },
                start       = function jspretty__algorithm_start() {
                    var deep   = depth[a][0],
                        deeper = (a === 0)
                            ? depth[a]
                            : depth[a - 1];
                    if (ltoke === ")" || ((deeper[0] === "object" || deeper[0] === "array") && ltoke !== "]")) {
                        if (deep !== "method" || (deep === "method" && token[a + 1] !== ")" && token[a + 2] !== ")")) {
                            if (ltoke === ")" && (deep !== "function" || (depth[a - 1] !== undefined && depth[depth[a - 1][1] - 1] !== undefined && token[depth[depth[a - 1][1] - 1][1]] === "("))) {
                                destructfix(false, false);
                            } else if (types[a + 1] !== "end" && types[a + 2] !== "end") {
                                destructfix(true, false);
                            }
                        }
                    }
                    list.push(false);
                    methodbreak.push(false);
                    assignlist.push(false);
                    arrbreak.push(false);
                    itemcount.push(0);
                    varlen.push([]);
                    if (options.neverflatten === true) {
                        destruct.push(false);
                    } else {
                        if (deep === "object" && (ltoke === "(" || ltype === "word")) {
                            //array or object literal following `return` or `(`
                            destruct.push(true);
                        } else if (deep === "array" || ctoke === "(") {
                            //array, method, paren
                            destruct.push(true);
                        } else if (ctoke === "{" && deep === "object" && ltype !== "operator" && ltype !== "start" && ltype !== "literal" && deeper[0] !== "object" && deeper[0] !== "array" && a > 0) {
                            //curly brace not in a list and not assigned
                            destruct.push(true);
                        } else {
                            //not destructured (multiline)
                            destruct.push(false);
                        }
                    }
                    if (ctoke !== "(") {
                        indent += 1;
                    }
                    if (ctoke === "{" || ctoke === "x{") {
                        if (ctoke === "{") {
                            varline.push(false);
                        }
                        if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline") {
                            if (ltype === "markup") {
                                level[a - 1] = indent;
                            } else if (options.braces === true && ltype !== "operator" && ltoke !== "return") {
                                level[a - 1] = indent - 1;
                            } else if (deep === "function" || ltoke === ")" || ltoke === "," || ltype === "markup") {
                                level[a - 1] = "s";
                            } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                                level[a - 1] = indent - 1;
                            }
                        }
                        if (deep === "switch") {
                            if (options.nocaseindent === true) {
                                return level.push(indent - 1);
                            }
                            indent += 1;
                            return level.push(indent);
                        }
                        if (destruct[destruct.length - 1] === true) {
                            if (options.bracepadding === true && types[a + 1] !== "start") {
                                return level.push("s");
                            }
                            return level.push("x");
                        }
                        return level.push(indent);
                    }
                    if (ctoke === "(") {
                        if (ltoke === "-" && token[a - 2] === "(") {
                            level[a - 2] = "x";
                        }
                        // the start of scope, at least for counting, is pushed back from the opening of
                        // the block to the paranthesis containing arguments so that the arguments can
                        // be tagged as variables of the coming scope
                        if (options.jsscope !== "none" || options.mode === "minify") {
                            // a 0 is pushed into the start of scope, but this number is updated in the
                            // "end" function to indicate the index where the scope ends
                            if (ltoke === "function" || token[a - 2] === "function") {
                                meta[meta.length - 1] = 0;
                            }
                        }
                        if (ltype === "end" && deeper[0] !== "if" && deeper[0] !== "for" && deeper[0] !== "catch" && deeper[0] !== "else" && deeper[0] !== "do" && deeper[0] !== "try" && deeper[0] !== "finally" && deeper[0] !== "catch") {
                            if (types[a - 1] === "comment" || types[a - 1] === "comment-inline") {
                                level[a - 1] = indent;
                            } else {
                                level[a - 1] = "x";
                            }
                        }
                        if (deep === "method" || (token[a - 2] === "function" && ltype === "word")) {
                            if (ltoke === "import") {
                                level[a - 1] = "s";
                            } else {
                                level[a - 1] = "x";
                            }
                        }
                        if (ltoke === "}" || ltoke === "x}") {
                            return level.push("x");
                        }
                        if ((ltoke === "-" && (a < 2 || (token[a - 2] !== ")" && token[a - 2] !== "]" && types[a - 2] !== "word" && types[a - 2] !== "literal"))) || (options.space === false && ltoke === "function")) {
                            level[a - 1] = "x";
                        }
                        if (options.bracepadding === true && types[a + 1] !== "start") {
                            return level.push("s");
                        }
                        return level.push("x");
                    }
                    if (ctoke === "[") {
                        if (ltoke === "[") {
                            list[list.length - 2] = true;
                        }
                        if (ltoke === "return" || ltoke === "var" || ltoke === "let" || ltoke === "const") {
                            level[a - 1] = "s";
                        } else if (ltype === "end" || ltype === "word") {
                            level[a - 1] = "x";
                        } else if (ltoke === "[" || ltoke === "{" || ltoke === "x{") {
                            level[a - 1] = indent - 1;
                        }
                        if (deep === "method" || destruct[destruct.length - 1] === true) {
                            return level.push("x");
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
                },
                end         = function jspretty__algorithm_end() {
                    tern(-1);
                    if (token[a + 1] === "," && (depth[a][0] === "object" || depth[a][0] === "array")) {
                        destructfix(true, false);
                    }
                    if (methodbreak[methodbreak.length - 1] === true) {
                        indent -= 1;
                    }
                    if (ctoke !== ")" && (ltype !== "markup" || (ltype === "markup" && token[a - 2] !== "return"))) {
                        indent -= 1;
                    }
                    if (ctoke === "}" && depth[a][0] === "switch" && options.nocaseindent === false) {
                        indent -= 1;
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
                                    if (types[c] === "start") {
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
                                        if ((token[c] === ":" && ternary.length === 0) || (token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                            return;
                                        }
                                        if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var" || token[c] === "let" || token[c] === "const" || token[c] === "with") {
                                            if (list[listlen - 1] === false && listlen > 1 && (a === b - 1 || token[a + 1] !== ")") && depth[a][0] !== "object") {
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
                        //this is the bulk of logic identifying scope start and end
                        if (depth[a][0] === "function" && (options.jsscope !== "none" || options.mode === "minify")) {
                            (function jspretty__algorithm_end_jsscope() {
                                var c     = 0,
                                    d     = 1,
                                    build = [],
                                    paren = false;
                                for (c = a - 1; c > -1; c -= 1) {
                                    if (types[c] === "end") {
                                        d += 1;
                                    } else if (types[c] === "start") {
                                        d -= 1;
                                    }
                                    if (d < 0) {
                                        return;
                                    }
                                    if (meta[c] === "v" && token[c] !== build[build.length - 1]) {
                                        build.push(token[c]);
                                    } else if (d === 1 && token[c] === ")") {
                                        paren = true;
                                    } else if (d === 1 && paren === true && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                        build.push(token[c]);
                                    }
                                    if (c === lettest) {
                                        meta[c] = a - 1;
                                        if (token[c] === "let" || token[c] === "const") {
                                            meta[meta.length - 2] = [build, true];
                                        }
                                        build   = [];
                                        lettest = -1;
                                    }
                                    if (c > 0 && token[c - 1] === "function" && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                        build.push(token[c]);
                                    }
                                    if (d === 0) {
                                        if (token[c] === "function") {
                                            if (types[c + 1] === "word") {
                                                meta[c + 2] = a;
                                            } else {
                                                meta[c + 1] = a;
                                            }
                                            meta[meta.length - 1] = [build, false];
                                            return;
                                        }
                                    }
                                }
                            }());
                        }
                    }
                    if (ctoke === "]" && (methodbreak[methodbreak.length - 1] === true || arrbreak[arrbreak.length - 1] === true)) {
                        level[a - 1] = indent;
                        level.push("x");
                    } else if (destruct[destruct.length - 1] === true) {
                        if (options.bracepadding === true && types[a - 1] !== "end") {
                            level[a - 1] = "s";
                        } else {
                            level[a - 1] = "x";
                        }
                        if (ctoke === "]" && depth[a][1] - 1 > 0 && token[depth[depth[a][1] - 1][1]] === "[") {
                            destruct[destruct.length - 2] = false;
                        } else {
                            if (options.bracepadding === true && ltype !== "end") {
                                level[depth[a][1]] = "s";
                            } else {
                                level[depth[a][1]] = "x";
                            }
                        }
                        level.push("x");
                    } else if ((types[a - 1] === "comment" && token[a - 1].substr(0, 2) === "//") || types[a - 1] === "comment-inline") {
                        if (token[a - 2] === "x}") {
                            level[a - 3] = indent + 1;
                        }
                        level[a - 1] = indent;
                        level.push("x");
                    } else if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]"))) {
                        level[a - 1] = "x";
                        if (ctoke === "}" && options.titanium === true) {
                            level.push(indent);
                        } else {
                            level.push("x");
                        }
                    } else if (ctoke === "]") {
                        if ((list[list.length - 1] === true && destruct[destruct.length - 1] === false) || (ltoke === "]" && level[a - 2] === indent + 1)) {
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
                                    if (d === 1 && token[c] === "+" && level[c] > 0) {
                                        level[c] -= 1;
                                    }
                                }
                            }());
                        }
                        level.push("x");
                    } else if (ctoke === ")" && ltype !== "markup") {
                        if (destruct[destruct.length - 1] === true) {
                            if (options.bracepadding === true && ltype !== "end" && ltype !== "start") {
                                level[a - 1] = "s";
                            } else {
                                level[a - 1] = "x";
                            }
                        } else {
                            level[a - 1] = "x";
                        }
                        level.push("s");
                    } else if ((ctoke === "}" || ctoke === "x}") && depth[a][0] !== "object" && ltype === "word" && list[list.length - 1] === false) {
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
                    methodbreak.pop();
                    arrbreak.pop();
                    itemcount.pop();
                    if (ctoke === "}") {
                        if (varline[varline.length - 1] === true || ((depth[a][0] === "object" || depth[a][0] === "function") && ltoke !== "{") || token[depth[a][1] - 2] === "interface") {
                            if (varlen.length > 0 && varlen[varlen.length - 1].length > 1 && assignlist[assignlist.length - 1] === false && destruct[destruct.length - 1] === false) {
                                varlist.push(varlen[varlen.length - 1]);
                            }
                        }
                        varline.pop();
                    }
                    varlen.pop();
                    destruct.pop();
                    assignlist.pop();
                },
                operator    = function jspretty__algorithm_operator() {
                    if (methodbreak[methodbreak.length - 1] === true) {
                        indent                              -= 1;
                        methodbreak[methodbreak.length - 1] = false;
                        if (depth[a][0] === "array") {
                            arrbreak[arrbreak.length - 1] = true;
                        }
                    }
                    if (ctoke !== ":" && token[depth[a][1]] !== "(" && destruct.length > 0) {
                        destructfix(true, false);
                    }
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
                        if (token[depth[a][1] - 1] !== "for") {
                            level[a - 1] = indent;
                        }
                        return level.push("x");
                    }
                    if (ctoke === "?") {
                        if (options.ternaryline === true) {
                            level[a - 1] = "s";
                        } else {
                            if (ternary.length > 0 && token[ternary[ternary.length - 1]] === ":" && ternary[ternary.length - 1] > depth[a][1]) {
                                ternary[ternary.length - 1] = a;
                            }
                            indent       += 1;
                            level[a - 1] = indent;
                        }
                        ternary.push(a);
                    }
                    if (ctoke === ":") {
                        if (methodbreak[methodbreak.length - 1] === true) {
                            indent                              -= 1;
                            methodbreak[methodbreak.length - 1] = false;
                        }
                        if (depth[a][0] === "switch" && (ternary.length < 1 || ternary[ternary.length - 1] < depth[a][1])) {
                            level[a - 1] = "x";
                            return level.push(indent);
                        }
                        if (ternary.length > 0) {
                            (function jspretty__algorithm_operator_ternObj() {
                                var c = a - 1,
                                    d = 0;
                                for (c = c; c > 0; c -= 1) {
                                    if (types[c] === "end") {
                                        d += 1;
                                    } else if (types[c] === "start") {
                                        d -= 1;
                                        if (d < 0) {
                                            if (depth[a][0] === "object") {
                                                level[a - 1] = "x";
                                                varlen[varlen.length - 1].push(a - 1);
                                            }
                                            return;
                                        }
                                    }
                                    if (d === 0) {
                                        if (token[c] === "," && depth[a][0] === "object") {
                                            level[a - 1] = "x";
                                            varlen[varlen.length - 1].push(a - 1);
                                            return;
                                        }
                                        if (token[c] === ":") {
                                            if (depth[a][0] === "object") {
                                                return;
                                            }
                                            if (options.ternaryline === true) {
                                                level[a - 1] = "s";
                                            } else {
                                                tern(-1);
                                            }
                                            break;
                                        }
                                        if (token[c] === "?") {
                                            if (options.ternaryline === true) {
                                                level[a - 1] = "s";
                                            } else {
                                                level[a - 1] = level[c - 1];
                                                tern(c);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }());
                        } else if (depth[a][0] === "object") {
                            level[a - 1] = "x";
                            varlen[varlen.length - 1].push(a - 1);
                        } else if (ternary.length > 0) {
                            level[a - 1] = indent;
                        } else {
                            level[a - 1] = "s";
                        }
                        return level.push("s");
                    }
                    if (ctoke === "?:") {
                        if (ltype === "word") {
                            level[a - 1] = "x";
                            varlen[varlen.length - 1].push(a - 1);
                        }
                        return level.push("s");
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
                    if (ctoke === "+") {
                        if (ltoke.length < options.wrap + 3 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && (token[a + 1].charAt(0) === "\"" || token[a + 1].charAt(0) === "'")) {
                            if (token[a - 2] === "(") {
                                level[a - 2] = "x";
                            }
                            if (list[list.length - 1] === true || depth[a][0] === "object" || depth[a][0] === "method" || ((token[a - 1].charAt(0) === "\"" || token[a - 1].charAt(0) === "'") && (token[a - 2] === "+" || token[a - 2].indexOf("=") > -1 || types[a - 2] === "start"))) {
                                return level.push(indent + 2);
                            }
                            return level.push(indent + 1);
                        }
                        if ((ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && token[a + 1] !== undefined && (token[a + 1].charAt(0) === "\"" || token[a + 1].charAt(0) === "'") && (token[a - 2] === "=" || token[a - 2] === "(" || (token[a - 2] === "+" && level[a - 2] > 0))) {
                            if (ltoke.length + 3 + token[a + 1].length < options.wrap) {
                                level.push("s");
                            } else if (varline[varline.length - 1] === true) {
                                level.push(indent);
                            } else {
                                level.push(indent + 1);
                            }
                            return;
                        }
                    }
                    if (ctoke === "*" && depth[a][0] === "object" && types[a + 1] === "word" && (ltoke === "{" || ltoke === ",")) {
                        level[a - 1] = indent;
                    } else if (ltype !== "comment" && ltype !== "comment-inline" && (ctoke !== "?" || ternary.length === 0)) {
                        level[a - 1] = "s";
                    }
                    if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && depth[a][0] !== "method" && depth[a][0] !== "object") {
                        if (assignlist[assignlist.length - 1] === true && token[depth[a][1] - 1] !== "for") {
                            (function jspretty__algorithm_operator_assignTest() {
                                var c = 0,
                                    d = "";
                                for (c = a - 1; c > -1; c -= 1) {
                                    d = token[c];
                                    if (d === ";" || d === "x;" || d === "," || d === "?" || d === ":") {
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
                                if (types[c] === "start") {
                                    if (e === true && token[c] !== "[") {
                                        if (assignlist[assignlist.length - 1] === true) {
                                            assignlist[assignlist.length - 1] = false;
                                            if (varlen[varlen.length - 1].length > 1) {
                                                varlist.push(varlen[varlen.length - 1]);
                                            }
                                            varlen[varlen.length - 1] = [];
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
                                        varlen[varlen.length - 1] = [];
                                    }
                                    break;
                                }
                                if (d === 0) {
                                    f = token[c];
                                    if (e === true) {
                                        if (types[c] === "operator" || token[c] === ";" || token[c] === "x;" || token[c] === "?" || token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                            if (f !== undefined && (f === "?" || (f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<="))) {
                                                if (assignlist[assignlist.length - 1] === false) {
                                                    varlen[varlen.length - 1].push(a - 1);
                                                    assignlist[assignlist.length - 1] = true;
                                                }
                                            }
                                            if ((f === ";" || f === "x;" || f === "var" || f === "let" || f === "const") && assignlist[assignlist.length - 1] === true) {
                                                assignlist[assignlist.length - 1] = false;
                                                if (varlen[varlen.length - 1].length > 1) {
                                                    varlist.push(varlen[varlen.length - 1]);
                                                }
                                                varlen[varlen.length - 1] = [];
                                            }
                                            break;
                                        }
                                        if (assignlist[assignlist.length - 1] === true && (f === "return" || f === "break" || f === "continue" || f === "throw")) {
                                            assignlist[assignlist.length - 1] = false;
                                            if (varlen[varlen.length - 1].length > 1) {
                                                varlist.push(varlen[varlen.length - 1]);
                                            }
                                            varlen[varlen.length - 1] = [];
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
                word        = function jspretty__algorithm_word() {
                    var next    = token[a + 1],
                        compare = (next !== undefined && next !== "==" && next !== "===" && next !== "!=" && next !== "!==" && next === ">=" && next !== "<=" && next.indexOf("=") > -1);
                    if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var" || ltoke === "let" || ltoke === "const")) {
                        if (token[depth[a][1] - 1] !== "for" && depth[a][0] !== "method") {
                            if (types[a + 1] === "operator" && compare === true && token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ":") {
                                varlen[varlen.length - 1].push(a);
                            }
                        }
                        if (options.jsscope !== "none" || options.mode === "minify") {
                            meta[meta.length - 1] = "v";
                        }
                    } else if ((options.jsscope !== "none" || options.mode === "minify") && ltoke === "function") {
                        meta[meta.length - 1] = "v";
                    }
                    if (ltoke === "}" || ltoke === "x}") {
                        level[a - 1] = indent;
                    }
                    if (ctoke === "else" && ltoke === "}" && token[a - 2] === "x}") {
                        level[a - 3] -= 1;
                    }
                    if (varline.length === 1 && varline[0] === true && (ltoke === "var" || ltoke === "let" || ltoke === "const" || ltoke === "," || (ltoke === "function" && depth[a + 1] !== undefined && depth[a + 1][0] === "method"))) {
                        globals.push(ctoke);
                    }
                    if ((ctoke === "let" || ctoke === "const") && lettest < 0) {
                        lettest = a;
                    }
                    if (ctoke === "new") {
                        (function jspretty__algorithm_word_new() {
                            var c       = 0,
                                nextish = (typeof next === "string")
                                    ? next
                                    : "",
                                apiword = (nextish === "")
                                    ? []
                                    : [
                                        "ActiveXObject",
                                        "ArrayBuffer",
                                        "AudioContext",
                                        "Canvas",
                                        "CustomAnimation",
                                        "DOMParser",
                                        "DataView",
                                        "Date",
                                        "Error",
                                        "EvalError",
                                        "FadeAnimation",
                                        "FileReader",
                                        "Flash",
                                        "Float32Array",
                                        "Float64Array",
                                        "FormField",
                                        "Frame",
                                        "Generator",
                                        "HotKey",
                                        "Image",
                                        "Iterator",
                                        "Intl",
                                        "Int16Array",
                                        "Int32Array",
                                        "Int8Array",
                                        "InternalError",
                                        "Loader",
                                        "Map",
                                        "MenuItem",
                                        "MoveAnimation",
                                        "Notification",
                                        "ParallelArray",
                                        "Point",
                                        "Promise",
                                        "Proxy",
                                        "RangeError",
                                        "Rectangle",
                                        "ReferenceError",
                                        "Reflect",
                                        "RegExp",
                                        "ResizeAnimation",
                                        "RotateAnimation",
                                        "Set",
                                        "SQLite",
                                        "ScrollBar",
                                        "Set",
                                        "Shadow",
                                        "StopIteration",
                                        "Symbol",
                                        "SyntaxError",
                                        "Text",
                                        "TextArea",
                                        "Timer",
                                        "TypeError",
                                        "URL",
                                        "Uint16Array",
                                        "Uint32Array",
                                        "Uint8Array",
                                        "Uint8ClampedArray",
                                        "URIError",
                                        "WeakMap",
                                        "WeakSet",
                                        "Web",
                                        "Window",
                                        "XMLHttpRequest"
                                    ],
                                apilen  = apiword.length;
                            for (c = 0; c < apilen; c += 1) {
                                if (nextish === apiword[c]) {
                                    return;
                                }
                            }
                            news += 1;
                            if (options.jsscope !== "none") {
                                token[a] = "<strong class='new'>new</strong>";
                            }
                        }());
                    }
                    if (ctoke === "from" && ltype === "end" && a > 0 && (token[depth[a - 1][1] - 1] === "import" || token[depth[a - 1][1] - 1] === ",")) {
                        level[a - 1] = "s";
                    }
                    if (ctoke === "this" && options.jsscope !== "none") {
                        token[a] = "<strong class='new'>this</strong>";
                    }
                    if (ctoke === "function") {
                        if (options.space === false && a < b - 1 && token[a + 1] === "(") {
                            return level.push("x");
                        }
                        return level.push("s");
                    }
                    if (ltype === "literal" && ltoke.charAt(ltoke.length - 1) === "{" && options.bracepadding === false) {
                        level[a - 1] = "x";
                    } else if (ltoke === "-" && a > 1) {
                        if (types[a - 2] === "operator" || token[a - 2] === ",") {
                            level[a - 1] = "x";
                        } else if (types[a - 2] === "start") {
                            level[a - 2] = "x";
                            level[a - 1] = "x";
                        }
                    } else if (ctoke === "while" && (ltoke === "}" || ltoke === "x}")) {
                        //verify if this is a do/while block
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
                    } else if (ctoke === "in" || (((ctoke === "else" && options.elseline === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                        level[a - 1] = "s";
                    } else if (ctoke === "var" || ctoke === "let" || ctoke === "const") {
                        if (depth[a][0] !== "method") {
                            varlen[varlen.length - 1] = [];
                        }
                        if (ltype === "end") {
                            level[a - 1] = indent;
                        }
                        if (token[depth[a][1] - 1] !== "for") {
                            if (varline.length === 0) {
                                varline.push(true);
                            } else {
                                varline[varline.length - 1] = true;
                            }
                            (function jspretty__algorithm_word_varlisttest() {
                                var c = 0,
                                    d = 0;
                                for (c = a + 1; c < b; c += 1) {
                                    if (types[c] === "end") {
                                        d -= 1;
                                    }
                                    if (types[c] === "start") {
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
                    } else if ((ctoke === "default" || ctoke === "case") && ltype !== "word" && depth[a][0] === "switch") {
                        level[a - 1] = indent - 1;
                        return level.push("s");
                    }
                    if (ctoke === "catch" && ltoke === ".") {
                        level[a - 1] = "x";
                        return level.push("x");
                    }
                    if (ctoke === "catch" || ctoke === "finally") {
                        level[a - 1] = "s";
                        return level.push("s");
                    }
                    if (options.bracepadding === false && a < b - 1 && token[a + 1].charAt(0) === "}") {
                        return level.push("x");
                    }
                    if (depth[a][0] === "object" && (ltoke === "{" || ltoke === ",") && token[a + 1] === "(") {
                        return level.push("x");
                    }
                    level.push("s");
                };
            if (options.titanium === true) {
                indent -= 1;
            }
            for (a = 0; a < b; a += 1) {
                if (options.jsscope !== "none" || options.mode === "minify") {
                    meta.push("");
                }
                ctype = types[a];
                ctoke = token[a];
                if (ctype === "comment") {
                    destructfix(false, false);
                    if (token[a - 1] === ",") {
                        level[a - 1] = indent;
                    } else if (lines[a - 1] === 0 && types[a - 1] !== "comment" && types[a - 1] !== "comment-inline") {
                        level[a - 1] = "x";
                    } else if (ltoke === "=" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                        level[a - 1] = "s";
                    } else {
                        level[a - 1] = indent;
                    }
                    level.push(indent);
                } else if (ctype === "comment-inline") {
                    destructfix(false, false);
                    if (a < b - 1 && depth[a + 1][0] !== "block" && (token[a + 1] === "{" || token[a + 1] === "x{")) {
                        token[a]     = token[a + 1];
                        types[a]     = "start";
                        token[a + 1] = ctoke;
                        types[a + 1] = ctype;
                        a            -= 1;
                    } else {
                        level[a - 1] = "s";
                    }
                    if (depth[a][0] === "paren" || depth[a][0] === "method") {
                        level.push(indent + 2);
                    } else {
                        level.push(indent);
                    }
                } else if (ctype === "regex") {
                    level.push("x");
                } else if (ctype === "literal") {
                    if (ctoke.indexOf("#!/") === 0) {
                        level.push(indent);
                    } else {
                        if (ctoke.charAt(0) === "}") {
                            if (options.bracepadding === true) {
                                level[a - 1] = "s";
                            } else {
                                level[a - 1] = "x";
                            }
                        }
                        level.push("s");
                    }
                    if ((ltoke === "," || ltype === "start") && (depth[a][0] === "object" || depth[a][0] === "array") && destruct[destruct.length - 1] === false && a > 0) {
                        level[a - 1] = indent;
                    }
                } else if (ctype === "separator") {
                    separator();
                } else if (ctype === "start") {
                    start();
                } else if (ctype === "end") {
                    end();
                } else if (ctype === "operator") {
                    operator();
                } else if (ctype === "word") {
                    word();
                } else if (ctype === "markup") {
                    if ((token[a + 1] !== "," && ctoke.indexOf("/>") !== ctoke.length - 2) || (token[a + 1] === "," && token[depth[a][1] - 3] !== "React")) {
                        destructfix(false, false);
                    }
                    if (ltoke === "return" || ltoke === "?" || ltoke === ":") {
                        level[a - 1] = "s";
                        level.push("x");
                    } else if (ltype === "start" || (token[a - 2] === "return" && depth[a - 1] !== undefined && depth[a - 1][0] === "method")) {
                        level.push(indent);
                    } else {
                        level.push("x");
                    }
                    if (token[a - 1] === "(" && types[a - 1] === "start") {
                        level[a - 1] = indent;
                    }
                    if (varline[varline.length - 1] === true) {
                        markupvar.push(a);
                    }
                } else if (ctype === "template_else") {
                    level[a - 1] = indent - 1;
                    level.push(indent);
                } else if (ctype === "template_start") {
                    indent += 1;
                    if (lines[a - 1] < 1) {
                        level[a - 1] = "x";
                    }
                    if (lines[a] > 0) {
                        level.push(indent);
                    } else {
                        level.push("x");
                    }
                } else if (ctype === "template_end") {
                    indent -= 1;
                    if (ltype === "template_start" || lines[a - 1] < 1) {
                        level[a - 1] = "x";
                    } else {
                        level[a - 1] = indent;
                    }
                    if (lines[a] > 0) {
                        level.push(indent);
                    } else {
                        level.push("x");
                    }
                } else if (ctype === "template") {
                    if (lines[a] > 0) {
                        level.push(indent);
                    } else {
                        level.push("x");
                    }
                }
                if (ctype !== "comment" && ctype !== "comment-inline") {
                    ltype = ctype;
                    ltoke = ctoke;
                }
            }
            if (assignlist[assignlist.length - 1] === true && varlen[varlen.length - 1].length > 1 && ltoke === ";") {
                varlist.push(varlen[varlen.length - 1]);
            }
        }());
    }

    if (options.titanium === true) {
        token[0] = "";
        types[0] = "";
        lines[0] = 0;
    }

    if (options.mode === "minify") {
        result = (function jspretty__minify() {
            var a        = 0,
                linelen  = 0,
                length   = token.length,
                comtest  = (options.topcoms === false),
                build    = [],
                output   = [],
                lastsemi = function jspretty__minify_lastsemi() {
                    var aa = 0,
                        bb = 0;
                    for (aa = a; aa > -1; aa -= 1) {
                        if (types[aa] === "end") {
                            bb += 1;
                        } else if (types[aa] === "start") {
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
            for (a = 0; a < length; a += 1) {
                if (types[a] !== "comment") {
                    comtest = true;
                }
                if (types[a - 1] === "operator" && types[a] === "operator" && token[a] !== "!") {
                    build.push(" ");
                }
                if (types[a] === "markup" && typeof global.markuppretty === "function") {
                    build.push(global.markuppretty({jsx: true, mode: "minify", source: token[a]}));
                } else if (types[a] === "word" && (types[a + 1] === "word" || types[a + 1] === "literal" || token[a + 1] === "x{" || types[a + 1] === "comment" || types[a + 1] === "comment-inline")) {
                    if (types[a - 1] === "literal" && token[a - 1].charAt(0) !== "\"" && token[a - 1].charAt(0) !== "'") {
                        build.push(" ");
                    }
                    build.push(token[a]);
                    build.push(" ");
                } else if (types[a] === "comment" && comtest === false) {
                    build.push(token[a]);
                    build.push(lf);
                } else if (token[a] === "x;" && token[a + 1] !== "}") {
                    build.push(";");
                } else if (token[a] === ";" && token[a + 1] === "}") {
                    lastsemi();
                } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && types[a] !== "comment" && types[a] !== "comment-inline") {
                    build.push(token[a]);
                }
                if (options.wrap > 0) {
                    if (types[a] !== "comment" && types[a] !== "comment-inline") {
                        linelen += token[a].length;
                    }
                    if ((types[a] === "operator" || types[a] === "separator" || types[a] === "start") && a < length - 1 && linelen + token[a + 1].length > options.wrap) {
                        build.push(lf);
                        linelen = 0;
                    }
                }
            }
            if (error.length > 0) {
                output.push("<p id='jserror'><strong>Error: ");
                output.push(error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, ""));
                output.push("</strong> <code><span>");
                error[1] = error[1]
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                    .replace(/^(\s+)/, "");
                if (error.indexOf(lf) > 0) {
                    output.push(error[1].replace(lf, "</span>"));
                } else {
                    output.push(error[1]);
                    output.push("</span>");
                }
                output.push("</code></p>");
                global.report = output.join("");
            }
            return build.join("");
        }());
    } else {
        //the result function generates the out
        if (options.jsscope !== "none") {
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
                        return bb + 1;
                    }()),
                    folderItem  = [],
                    comfold     = -1,
                    //if current folding is for comment
                    data        = [
                        "<div class='beautify' data-prettydiff-ignore='true'><ol class='count'>", "<li>", 1, "</li>"
                    ],
                    //defines the character(s) and character length of a single indentation
                    tab         = (function jspretty__resultScope_tab() {
                        var aa = options.inchar,
                            bb = options.insize,
                            cc = [];
                        for (bb = bb; bb > 0; bb -= 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    //applies folding to comments and functions
                    //
                    // Folder uses the i variable to determine how far back into the data array to
                    // look.  i must be multiplied by 3 because each line number is three indexes in
                    // the data array: <li>, line #, </li>.
                    //
                    //i is incremented for:
                    // * block comments following one or more line  comments that follow one or more
                    // block comments
                    //* if last comment in a series is a block comment  and not the first token
                    // * block comments with a new line that are either  the first token or not
                    // followed by another block
                    //* if a block comment is followed by another block  comment
                    //
                    //i is decremented for:
                    //* line comment following a block comment
                    //* block comment if "i" is greater than 1 and  inside a function fold
                    // * if a line comment is not preceeded by another  comment and is followed by a
                    // block comment
                    //
                    // If closing a fold and token is a comment and not token 0 then decrement by
                    // commentfix.
                    folder      = function jspretty__resultScope_folder() {
                        var datalen = (data.length - (commentfix * 3) > 0)
                                ? data.length - (commentfix * 3)
                                : 1,
                            index   = a,
                            start   = data[datalen + 1] || 1,
                            assign  = true,
                            kk      = index;
                        if (types[a] === "comment" && comfold === -1) {
                            comfold = a;
                        } else if (types[a] !== "comment") {
                            index = meta[a];
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
                        if (types[a] === "comment" && lines[a] > 1) {
                            datalen -= 3;
                            start   -= 1;
                        }
                        data[datalen]     = "<li class='fold' title='folds from line " + start + " to line xxx'>";
                        data[datalen + 1] = "- " + start;
                        folderItem.push([datalen, index, assign]);
                    },
                    // determines where folding ends function assignments require one more line for
                    // closing than everything else
                    foldclose   = function jspretty__resultScope_foldclose() {
                        var end  = (function jspretty__resultScope_foldclose_end() {
                                if (comfold > -1 || folderItem[folderItem.length - 1][2] === true) {
                                    return linecount - commentfix - 1;
                                }
                                return linecount - commentfix;
                            }()),
                            semi = (/(>;<\/em>)$/).test(token[a]),
                            gg   = 0,
                            lets = false;
                        if (semi === true) {
                            end -= 1;
                            for (gg = build.length - 1; gg > 0; gg -= 1) {
                                if (build[gg] === "let" || build[gg] === "const") {
                                    lets = true;
                                }
                                if (build[gg].indexOf("><li") > 0) {
                                    build[gg] = build[gg].replace(/class\='l\d+'/, "class='l" + (scope + 1) + "'");
                                    if (lets === true) {
                                        break;
                                    }
                                }
                                if (build[gg].indexOf("<em class='l" + scope + "'>" + tab) > -1) {
                                    build[gg] = build[gg].replace("<em class='l" + scope + "'>" + tab, "<em class='l" + (scope + 1) + "'>" + tab);
                                }
                            }
                        }
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
                    // splits block comments, which are single tokens, into multiple lines of output
                    blockline   = function jspretty__resultScope_blockline(x) {
                        var commentLines = x.split(lf),
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
                        return commentLines.join("");
                    },
                    //finds the variables if the jsscope option is true
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
                            letcomma      = function jspretty__resultScope_findvars_letcomma() {
                                var aa = 0,
                                    bb = 0;
                                for (aa = a; aa > -1; aa -= 1) {
                                    if (types[aa] === "end") {
                                        bb -= 1;
                                    }
                                    if (types[aa] === "start") {
                                        bb += 1;
                                    }
                                    if (bb > 0) {
                                        return;
                                    }
                                    if (bb === 0) {
                                        if (token[aa] === "var" || token[aa] === ";" || token[aa] === "x;") {
                                            return;
                                        }
                                        if (token[aa] === "let" || token[aa] === "const") {
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
                            for (ee = ee; ee > a; ee -= 1) {
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
                                                    if (token[ee - 1] === "let" || token[ee - 1] === "const") {
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
                                    } else if (types[ee] === "start") {
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
                            for (ee = ee; ee < metax; ee += 1) {
                                if (types[ee] === "end") {
                                    adjustment -= 1;
                                } else if (types[ee] === "start") {
                                    adjustment += 1;
                                }
                                if (adjustment === 1 && token[ee] === "{") {
                                    token[ee] = "<em class='s" + scope + "'>{</em>";
                                    return;
                                }
                            }
                        }
                    },
                    indent      = options.inlevel,
                    //some prebuilt color coded tabs
                    lscope      = [
                        "<em class='l0'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>",
                        "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                    ],
                    //a function for calculating indentation after each new line
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
                        for (dd = dd; dd < x; dd += 1) {
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
                                var item    = "",
                                    emscope = function jsscope__resultScope_markupBuild_varscope_emscope(x) {
                                        return "<em class='s" + x
                                            .replace("[pdjsxem", "")
                                            .replace("]", "") + "'>";
                                    },
                                    word    = "",
                                    newword = "",
                                    inca    = 0,
                                    incb    = 0,
                                    lena    = meta.length,
                                    lenb    = 0,
                                    vars    = [],
                                    mode    = options.mode,
                                    inle    = options.inlevel,
                                    jsx     = options.jsx;
                                options.source  = token[a];
                                options.mode    = "beautify";
                                options.inlevel = mindent;
                                options.jsx     = true;
                                item            = global
                                    .markuppretty(options)
                                    .replace(/return\s+</g, "return <");
                                options.mode    = mode;
                                options.inlevel = inle;
                                options.jsx     = jsx;
                                if (item.indexOf("[pdjsxscope]") < 0) {
                                    return item
                                        .replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .split(lf);
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
                                return item
                                    .replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    .replace(/\[pdjsxem\d+\]/g, emscope)
                                    .replace(/\[\/pdjsxem\]/g, "</em>")
                                    .split(lf);
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
                                spaces = markup[c - 1]
                                    .split(tab)
                                    .length - 1;
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
                    multiline   = function jspretty__resultScope_multiline(x) {
                        var temparray = x.split(lf),
                            c         = 0,
                            d         = temparray.length;
                        build.push(temparray[0]);
                        for (c = 1; c < d; c += 1) {
                            nl(indent);
                            build.push(temparray[c]);
                        }
                    };
                if (verticalop === true) {
                    (function jspretty__resultScope_varSpaces() {
                        var aa          = 0,
                            lastListLen = 0,
                            cc          = 0,
                            dd          = 0,
                            longest     = 0,
                            longTest    = 0,
                            strlongest  = 0,
                            isvar       = false,
                            isvartoken  = 0,
                            strspace    = "",
                            tokenInList = "",
                            longList    = [],
                            joins       = function jspretty__resultScope_varSpaces_joins(x, vars) {
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
                                    } while (x > 1 && token[x - 1] === "." && level[x - 2] === "x");
                                    if (token[x - 1] === "." && level[x - 2] !== "x") {
                                        xlen += (options.inchar.length * options.insize) + 2;
                                        return;
                                    }
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
                                        if (types[x] === "start") {
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
                                        if (level[x - 2] === "x") {
                                            period();
                                        } else {
                                            xlen += (options.inchar.length * options.insize) + 2;
                                            return;
                                        }
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
                                    if (level[x - 2] === "x") {
                                        period();
                                    } else {
                                        xlen += (options.inchar.length * options.insize) + 2;
                                        if (token[x - 1] === "(") {
                                            do {
                                                xlen += 1;
                                                x    -= 1;
                                            } while (token[x - 1] === "(");
                                        }
                                        if (token[x - 1] === "?" || (token[x - 1] === ":" && level[x - 2] > 0)) {
                                            if (token[depth[x][1]] === "(") {
                                                xlen += 2;
                                            } else {
                                                xlen += (options.inchar.length * options.insize) + 2;
                                            }
                                        } else if (token[x - 1] === "return") {
                                            xlen += 7;
                                        }
                                        return xlen;
                                    }
                                } else if (token[x] === ")" || token[x] === "]") {
                                    ending();
                                    if (perTest === false) {
                                        xlen += 1;
                                    }
                                } else {
                                    xlen += 1;
                                }
                                if (vars === true && token[x - 1] === "," && token[varlist[aa][cc] + 1] !== ":" && token[varlist[aa][0] - 1] !== "var" && token[varlist[aa][0] - 1] !== "let" && token[varlist[aa][0] - 1] !== "const") {
                                    xlen += options.insize;
                                }
                                if (token[x - 1] === "(") {
                                    do {
                                        xlen += 1;
                                        x    -= 1;
                                    } while (token[x - 1] === "(");
                                }
                                if (token[x - 1] === "?" || (token[x - 1] === ":" && level[x - 2] > 0)) {
                                    if (token[depth[x][1]] === "(") {
                                        xlen += 2;
                                    } else {
                                        xlen += (options.inchar.length * options.insize) + 2;
                                    }
                                } else if (token[x - 1] === "return") {
                                    xlen += 7;
                                }
                                return xlen;
                            };
                        for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                            if (varlist[aa] !== undefined) {
                                lastListLen = varlist[aa].length;
                                longest     = 0;
                                longList    = [];
                                isvartoken  = token[varlist[aa][0] - 1];
                                isvar       = (isvartoken === "var" || isvartoken === "let" || isvartoken === "const");
                                for (cc = 0; cc < lastListLen; cc += 1) {
                                    longTest = joins(varlist[aa][cc], isvar);
                                    if (longTest > longest) {
                                        longest = longTest;
                                    }
                                    longList.push(longTest);
                                }
                                strspace = "";
                                if (longest > options.insize) {
                                    strlongest = longest - options.insize;
                                } else if (longest < options.insize) {
                                    strlongest = options.insize - longest;
                                }
                                if (token[varlist[aa][0] - 1] === "var") {
                                    strlongest = strlongest - options.insize;
                                } else if (token[varlist[aa][0] + 1] === "=") {
                                    strlongest += 1;
                                }
                                if (longest !== options.insize && strlongest > 0) {
                                    do {
                                        strspace   += " ";
                                        strlongest -= 1;
                                    } while (strlongest > -1);
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
                                    if (token[varlist[aa][cc] + 2] !== undefined && token[varlist[aa][cc] + 2].length === options.wrap + 2 && token[varlist[aa][cc] + 3] === "+" && token[varlist[aa][cc] + 4] !== undefined && options.styleguide !== "crockford" && options.styleguide !== "jslint" && (token[varlist[aa][cc] + 4].charAt(0) === "\"" || token[varlist[aa][cc] + 4].charAt(0) === "'")) {
                                        dd = varlist[aa][cc] + 4;
                                        do {
                                            token[dd] = strspace + token[dd];
                                            dd        += 2;
                                        } while (types[dd] === "literal" && types[dd - 1] !== "separator");
                                    }
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
                // its important to find the variables separately from building the output so
                // that recursive flows in the loop incrementation do not present simple
                // counting collisions as to what gets modified versus what gets included
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
                                    if (token[aa - 1] === "function" && depth[aa + 1] !== undefined && depth[aa + 1][0] === "method") {
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
                // this loops combines the white space as determined from the algorithm with the
                // tokens to create the output
                for (a = 0; a < b; a += 1) {
                    if (typeof meta[a] === "number") {
                        folder();
                    }
                    if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || lines[a] > 1)) {
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
                                if (typeof global.markuppretty === "function") {
                                    markupBuild();
                                } else {
                                    build.push(token[a].replace(/\r?\n(\s*)/g, " "));
                                }
                            } else if (types[a] === "comment") {
                                if (a === 0) {
                                    build[0] = "<ol class='data'><li class='c0'>";
                                } else {
                                    buildlen = build.length - 1;
                                    if (build[buildlen].indexOf("<li") < 0) {
                                        do {
                                            build[buildlen] = build[buildlen]
                                                .replace(/<em\ class\='[a-z]\d+'>/g, "")
                                                .replace(/<\/em>/g, "");
                                            buildlen        -= 1;
                                            if (buildlen > 0 && build[buildlen] === undefined) {
                                                buildlen -= 1;
                                            }
                                        } while (buildlen > 0 && build[buildlen - 1] !== undefined && build[buildlen].indexOf("<li") < 0);
                                    }
                                    if ((/^(<em>&#xA;<\/em><\/li><li\ class='l\d+'>)$/).test(build[buildlen - 1]) === true) {
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
                    // this condition performs additional calculations for options.preserve.
                    // options.preserve determines whether empty lines should be preserved from the
                    // code input
                    if (options.preserve > 0 && lines[a] > 0 && level[a] !== "x" && level[a] !== "s" && token[a] !== "+") {
                        //special treatment for math operators
                        if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                            //comments get special treatment
                            if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                nl(level[a]);
                                build.push(tab);
                                level[a] = "x";
                            } else {
                                indent = level[a];
                                if (lines[a] > 1) {
                                    do {
                                        build.push(lf);
                                        lines[a] -= 1;
                                    } while (lines[a] > 1);
                                }
                                nl(indent);
                                build.push(tab);
                                build.push(token[a + 1]);
                                nl(indent);
                                build.push(tab);
                                level[a + 1] = "x";
                                a            += 1;
                            }
                        } else if (lines[a] > 1 && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                            if ((token[a] !== "x}" || isNaN(level[a]) === true) && (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && types[a + 1] !== "separator")))) {
                                do {
                                    nl(0, true);
                                    lines[a] -= 1;
                                } while (lines[a] > 1);
                                if (types[a] === "comment") {
                                    build.push("<em>&#xA;</em></li><li class='c0'>");
                                } else {
                                    commentfix += 1;
                                    nl(level[a], true);
                                }
                            }
                        }
                    }
                    if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && ((/<em\ class='s\d+'>\}<\/em>/).test(token[a + 2]) === true || token[a + 2] === "x}")) {
                        rl(indent);
                    } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                        build.push("");
                    } else if (a < b - 1 && types[a + 1] === "comment" && options.comments === "noindent") {
                        nl(options.inlevel);
                    } else if (level[a] === "s" && token[a] !== "x}") {
                        build.push(" ");
                    } else if (token[a] !== "" && level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || lines[a] > 1)) {
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
                //this logic is necessary to some line counting corrections to the HTML output
                last = build[build.length - 1];
                if (last.indexOf("<li") > 0) {
                    build[build.length - 1] = "<em>&#xA;</em></li>";
                } else if (last.indexOf("</li>") < 0) {
                    build.push("<em>&#xA;</em></li>");
                }
                build.push("</ol></div>");
                last = build.join("");
                if (last.match(/<li/g) !== null) {
                    scope = last
                        .match(/<li/g)
                        .length;
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
                if (options.jsscope === "html") {
                    data.push(last);
                    return data.join("");
                }
                build         = [
                    "<p>Scope analysis does not provide support for undeclared variables.</p>",
                    "<p><em>",
                    scolon,
                    "</em> instances of <strong>missing semicolons</strong> counted.</p>",
                    "<p><em>",
                    news,
                    "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>",
                    data.join(""),
                    last
                ];
                global.report = build.join("");
                data          = [];
                build         = [];
                return "";
            }())
                .replace(/(\s+)$/, "")
                .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "");
        } else {
            result = (function jspretty__result() {
                var a             = 0,
                    b             = token.length,
                    build         = [],
                    indent        = options.inlevel,
                    //defines the character(s) and character length of a single indentation
                    tab           = (function jspretty__result_tab() {
                        var aa = options.inchar,
                            bb = 0,
                            cc = [];
                        for (bb = options.insize; bb > 0; bb -= 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    //a function for calculating indentation after each new line
                    nl            = function jspretty__result_nl(x) {
                        var dd = 0;
                        build.push(lf);
                        for (dd = 0; dd < x; dd += 1) {
                            build.push(tab);
                        }
                    },
                    rl            = function jspretty__result_rl(x) {
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
                    markupwrapper = function jspretty__result_markupwrapper() {
                        var inle = options.inlevel,
                            mode = options.mode,
                            jsx  = options.jsx;
                        options.source = token[a];
                        options.jsx    = true;
                        options.mode   = "beautify";
                        if (level[a] === "x" || level[a] === "s") {
                            options.inlevel = indent;
                        } else {
                            options.inlevel = indent + 1;
                        }
                        build.push(global.markuppretty(options));
                        options.jsx     = jsx;
                        options.mode    = mode;
                        options.inlevel = inle;
                    };
                if (verticalop === true) {
                    (function jspretty__result_varSpaces() {
                        var aa          = 0,
                            varListLen  = 0,
                            cc          = 0,
                            dd          = 0,
                            longest     = 0,
                            longTest    = 0,
                            strlongest  = 0,
                            isvar       = false,
                            isvartoken  = 0,
                            strspace    = "",
                            tokenInList = "",
                            longList    = [],
                            joins       = function jspretty__result_varSpaces_joins(x, vars) {
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
                                    } while (x > 1 && token[x - 1] === "." && level[x - 2] === "x");
                                    if (token[x - 1] === "." && level[x - 2] !== "x") {
                                        xlen += (options.inchar.length * options.insize) + 2;
                                        return;
                                    }
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
                                        if (types[x] === "start") {
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
                                        if (level[x - 2] === "x") {
                                            period();
                                        } else {
                                            xlen += (options.inchar.length * options.insize) + 2;
                                            return;
                                        }
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
                                    if (level[x - 2] === "x") {
                                        period();
                                    } else {
                                        xlen += (options.inchar.length * options.insize) + 2;
                                        if (token[x - 1] === "(") {
                                            do {
                                                xlen += 1;
                                                x    -= 1;
                                            } while (token[x - 1] === "(");
                                        }
                                        if (token[x - 1] === "?" || (token[x - 1] === ":" && level[x - 2] > 0)) {
                                            if (token[depth[x][1]] === "(") {
                                                xlen += 2;
                                            } else {
                                                xlen += (options.inchar.length * options.insize) + 2;
                                            }
                                        } else if (token[x - 1] === "return") {
                                            xlen += 7;
                                        }
                                        return xlen;
                                    }
                                } else if (token[x] === ")" || token[x] === "]") {
                                    ending();
                                    if (perTest === false) {
                                        xlen += 1;
                                    }
                                } else {
                                    xlen += 1;
                                }
                                if (vars === true && token[x - 1] === "," && token[varlist[aa][0] - 1] !== "[" && token[varlist[aa][cc] + 1] !== ":" && token[varlist[aa][0] - 1] !== "var" && token[varlist[aa][0] - 1] !== "let" && token[varlist[aa][0] - 1] !== "const") {
                                    xlen += options.insize;
                                }
                                if (token[x - 1] === "(") {
                                    do {
                                        xlen += 1;
                                        x    -= 1;
                                    } while (token[x - 1] === "(");
                                }
                                if (token[x - 1] === "?" || (token[x - 1] === ":" && level[x - 2] > 0)) {
                                    if (token[depth[x][1]] === "(") {
                                        xlen += 2;
                                    } else {
                                        xlen += (options.inchar.length * options.insize) + 2;
                                    }
                                } else if (token[x - 1] === "return") {
                                    xlen += 7;
                                }
                                return xlen;
                            };
                        for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                            if (varlist[aa] !== undefined) {
                                varListLen = varlist[aa].length;
                                longest    = 0;
                                longList   = [];
                                isvartoken = token[varlist[aa][0] - 1];
                                isvar      = (isvartoken === "var" || isvartoken === "let" || isvartoken === "const");
                                for (cc = 0; cc < varListLen; cc += 1) {
                                    longTest = joins(varlist[aa][cc], isvar);
                                    if (longTest > longest) {
                                        longest = longTest;
                                    }
                                    longList.push(longTest);
                                }
                                strspace = "";
                                if (longest > options.insize) {
                                    strlongest = longest - options.insize;
                                } else if (longest < options.insize) {
                                    strlongest = options.insize - longest;
                                }
                                if (token[varlist[aa][0] - 1] === "var") {
                                    strlongest = strlongest - options.insize;
                                } else if (token[varlist[aa][0] + 1] === "=") {
                                    strlongest += 1;
                                }
                                if (longest !== options.insize && strlongest > 0) {
                                    do {
                                        strspace   += " ";
                                        strlongest -= 1;
                                    } while (strlongest > -1);
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
                                    if (token[varlist[aa][cc] + 2] !== undefined && token[varlist[aa][cc] + 2].length === options.wrap + 2 && token[varlist[aa][cc] + 3] === "+" && token[varlist[aa][cc] + 4] !== undefined && options.styleguide !== "crockford" && options.styleguide !== "jslint" && (token[varlist[aa][cc] + 4].charAt(0) === "\"" || token[varlist[aa][cc] + 4].charAt(0) === "'")) {
                                        dd = varlist[aa][cc] + 4;
                                        do {
                                            token[dd] = strspace + token[dd];
                                            dd        += 2;
                                        } while (types[dd] === "literal" && types[dd - 1] !== "separator");
                                    }
                                }
                            }
                        }
                    }());
                }
                for (a = 0; a < indent; a += 1) {
                    build.push(tab);
                }
                // this loops combines the white space as determined from the algorithm with the
                // tokens to create the output
                for (a = 0; a < b; a += 1) {
                    if (types[a] === "comment" || (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}")) {
                        if (types[a] === "markup") {
                            if (level[a - 1] !== "x" && level[a - 1] !== "s" && token[a - 1] !== "return" && depth[a][0] !== "global") {
                                build.push(tab);
                            }
                            if (typeof global.markuppretty === "function") {
                                markupwrapper();
                            } else {
                                build.push(token[a].replace(/\r?\n(\s*)/g, " "));
                            }
                        } else {
                            build.push(token[a]);
                        }
                    }
                    // this condition performs additional calculations if options.preserve === true.
                    // options.preserve determines whether empty lines should be preserved from the
                    // code input
                    if (options.preserve > 0 && lines[a] > 0 && level[a] !== "x" && level[a] !== "s" && token[a] !== "+") {
                        //special treatment for math operators
                        if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                            //comments get special treatment
                            if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                nl(level[a]);
                                build.push(tab);
                                level[a] = "x";
                            } else {
                                indent = level[a];
                                if (lines[a] > 1) {
                                    do {
                                        build.push(lf);
                                        lines[a] -= 1;
                                    } while (lines[a] > 1);
                                }
                                nl(indent);
                                build.push(tab);
                                build.push(token[a + 1]);
                                nl(indent);
                                build.push(tab);
                                level[a + 1] = "x";
                                a            += 1;
                            }
                        } else if (lines[a] > 1 && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                            if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && types[a + 1] !== "separator"))) {
                                if (token[a] !== "x}" || isNaN(level[a]) === true || level[a] === "x") {
                                    do {
                                        build.push(lf);
                                        lines[a] -= 1;
                                    } while (lines[a] > 1);
                                }
                            }
                        }
                    }
                    if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && (token[a + 2] === "}" || token[a + 2] === "x}")) {
                        rl(indent);
                    } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                        build.push("");
                        //adds a new line and no indentation
                    } else if (a < b - 1 && types[a + 1] === "comment" && options.comments === "noindent") {
                        nl(options.inlevel);
                    } else if (level[a] === "s" && token[a] !== "x}") {
                        build.push(" ");
                        //adds a new line and indentation
                    } else if (token[a] !== "" && level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || lines[a] > 1)) {
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
                if (options.preserve > 0 && lines[lines.length - 1] > 0) {
                    return build
                        .join("")
                        .replace(/(\s+)$/, lf);
                }
                return build
                    .join("")
                    .replace(/(\s+)$/, "");
            }());
        }
        //the analysis report is generated in this function
        if (options.jsscope !== "report") {
            if (global.report !== "diff") {
                stats.space.space -= 1;
                (function jspretty__report() {
                    var noOfLines = result
                            .split(lf)
                            .length,
                        newlines  = stats.space.newline,
                        percent   = 0,
                        total     = {
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
                        output    = [],
                        zero      = function jspretty__report_zero(x, y) {
                            var ratio = 0;
                            if (y === 0) {
                                return "0.00%";
                            }
                            ratio = ((x / y) * 100);
                            return ratio.toFixed(2) + "%";
                        };
                    total.syntax.chars = total.syntax.token + stats.operator.chars;
                    total.syntax.token += stats.operator.token;
                    total.token        = stats.server.token + stats.word.token + total.comment.token + total.literal.token + total.space + total.syntax.token;
                    total.chars        = stats.server.chars + stats.word.chars + total.comment.chars + total.literal.chars + total.space + total.syntax.chars;
                    if (newlines === 0) {
                        newlines = 1;
                    }
                    output.push("<div class='report'>");
                    if (error.length > 0) {
                        output.push("<p id='jserror'><strong>Error: ");
                        output.push(error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, ""));
                        output.push("</strong> <code><span>");
                        error[1] = error[1]
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                            .replace(/^(\s+)/, "");
                        if (error.indexOf("\n") > 0) {
                            output.push(error[1].replace(lf, "</span>"));
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
                    percent = (((result.length - originalSize) / originalSize) * 100);
                    output.push(percent.toFixed(2));
                    output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
                    output.push(newlines);
                    output.push("</td><td>");
                    output.push(noOfLines);
                    output.push("</td><td>");
                    output.push(noOfLines - newlines);
                    output.push("</td><td>");
                    percent = (((noOfLines - newlines) / newlines) * 100);
                    output.push(percent.toFixed(2));
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
                    global.report = output.join("");
                }());
            } else {
                global.report = "";
            }
        }
    }

    return result;
};
if (typeof require === "function" && typeof ace !== "object") {
    (function glib_jspretty() {
        "use strict";
        var localPath = (typeof process === "object" && typeof process.cwd === "function" && (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true) && typeof __dirname === "string")
            ? __dirname
            : ".";
        if (global.markuppretty === undefined) {
            global.markuppretty = require(localPath + "/markuppretty.js").api;
        }
    }());
} else {
    if (typeof markuppretty === "function") {
        global.markuppretty = markuppretty;
    }
}
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.jsxstatus = global.jsxstatus;
    exports.api       = function commonjs(x) {
        "use strict";
        return jspretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.prettydiffid === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.jsxstatus = global.jsxstatus;
        exports.api       = function requirejs_export(x) {
            return jspretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
