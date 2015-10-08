/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global __dirname, ace, define, exports, global, process*/
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

 http://www.travelocity.com/
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
var jspretty = function jspretty_(args) {
    "use strict";
    var jbraceline = (args.braceline === true || args.braceline === "true"),
        jbracepadding = (args.bracepadding === true || args.bracepadding === "true"),
        jbraces = (args.braces === "allman"),
        jchar = (typeof args.inchar === "string" && args.inchar.length > 0)
            ? args.inchar
            : " ",
        jcomment = (args.comments === "noindent")
            ? "noindent"
            : (args.comments === "nocomment")
                ? "nocomment"
                : "indent",
        jelseline = (args.elseline === true || args.elseline === "true"),
        jendcomma = (args.endcomma === true || args.endcomma === "true"),
        jlevel = (args.inlevel > -1)
            ? args.inlevel
            : ((Number(args.inlevel) > -1)
                ? Number(args.inlevel)
                : 0),
        jmethodchain = (args.methodchain === true || args.methodchain === "true"),
        jminiwrap = (args.miniwrap === true || args.miniwrap === "true"),
        jmode = (args.mode === "minify" || args.mode === "parse" || args.mode === "diff")
            ? args.mode
            : "beautify",
        jobjsort = (args.objsort === true || args.objsort === "true"),
        jpres = (args.preserve !== false && args.preserve !== "false"),
        jquoteConvert = (args.quoteConvert === "double" || args.quoteConvert === "single")
            ? args.quoteConvert
            : "none",
        jscorrect = (args.correct === true || args.correct === "true"),
        jsize = (isNaN(args.insize) === false && Number(args.insize) >= 0)
            ? Number(args.insize)
            : 4,
        jsource = (typeof args.source === "string" && args.source.length > 0)
            ? args.source + " "
            : "Error: no source code supplied to jspretty!",
        jspace = (args.space !== false && args.space !== "false"),
        jsscope = (args.jsscope === true || args.jsscope === "true")
            ? "report"
            : (args.jsscope !== "html" && args.jsscope !== "report")
                ? "none"
                : args.jsscope,
        jstyleguide = (typeof args.styleguide === "string")
            ? args.styleguide
                .toLowerCase()
                .replace(/\s/g, "")
            : "",
        jtitanium = (args.titanium === true || args.titanium === "true"),
        jtopcoms = (args.topcoms === true || args.topcoms === "true"),
        jvarword = (args.varword === "each" || args.varword === "list")
            ? args.varword
            : "none",
        jvertical = (args.vertical !== false && args.vertical !== "false"),
        jwrap = (isNaN(Number(args.wrap)) === true)
            ? 0
            : Number(args.wrap),
        sourcemap = [
            0, ""
        ],
        //all data that is created from the tokization process is
        //stored in the following four arrays: token, types, level,
        //and lines.  All of this data passes from the tokenization
        //process to be analyzed by the algorithm
        token = [], //stores parsed tokens
        types = [], //parallel array that describes the tokens
        level = [], //parallel array that list indentation per token
        lines = [], //used to preserve empty lines
        globals = [], //which variables are declared globals
        //meta used to find scope and variables for jsscope
        //these values are assigned in parallel to the other arrays
        //* irrelevant tokens are represented with an empty string
        //* first '(' following 'function' is token index number of
        //  function's closing curly brace
        //* variables are represented with the value 'v'
        //* the closing brace of a function is an array of variables
        meta = [],
        //lists a number at the opening paren of a
        //function that points to the token index of the function's
        //closing curly brace.  At the closing curly brace index
        //this array stores an array indicating the names of
        //variables declared in the current function for coloring by
        //function depth in jsscope.  This array is ignored if
        //jsscope is false
        varlist = [],
        //groups variables from a variable list into
        //a child array as well as properties of objects.  This
        //array for adding extra space so that the "=" following
        //declared variables of a variable list is vertically
        //aligned and likewise of the ":" with object properties
        markupvar = [],
        //notes a token index of a JSX markup tag
        //assigned to JavaScript variable. This is necessary for
        //indentation apart from syntactical factors.
        error = [],
        news = 0,
        scolon = 0,
        //counts uncessary use of 'new' keyword
        //variables j, k, l, m, n, o, p, q, and w are used as
        //various counters for the reporting only.  These variables
        //do not store any tokens and are not used in the algorithm
        //j counts line comments
        stats = {
            comma: 0,
            commentBlock: {
                chars: 0,
                token: 0
            },
            commentLine: {
                chars: 0,
                token: 0
            },
            container: 0,
            number: {
                chars: 0,
                token: 0
            },
            operator: {
                chars: 0,
                token: 0
            },
            regex: {
                chars: 0,
                token: 0
            },
            semicolon: 0,
            server: {
                chars: 0,
                token: 0
            },
            space: {
                newline: 0,
                other: 0,
                space: 0,
                tab: 0
            },
            string: {
                chars: 0,
                quote: 0,
                token: 0
            },
            word: {
                chars: 0,
                token: 0
            }
        },
        result = "";
    if (jsource === "Error: no source code supplied to jspretty!") {
        return jsource;
    }
    if (jmode === "minify") {
        if (jwrap < 1) {
            jminiwrap = false;
        } else if (jminiwrap === false) {
            jwrap = -1;
        }
    } else if (jsscope !== "none") {
        jwrap = 0;
    }
    if (jstyleguide === "airbnb") {
        jchar = " ";
        jendcomma = true;
        jpres = true;
        jquoteConvert = "single";
        jscorrect = true;
        jsize = 2;
        jvarword = "each";
        jwrap = 80;
    } else if (jstyleguide === "crockford" || jstyleguide === "jslint") {
        jbracepadding = false;
        jelseline = false;
        jendcomma = false;
        jchar = " ";
        jscorrect = true;
        jsize = 4;
        jspace = true;
        jvarword = "list";
        jvertical = false;
    } else if (jstyleguide === "google") {
        jchar = " ";
        jpres = true;
        jquoteConvert = "single";
        jscorrect = true;
        jsize = 4;
        jvertical = false;
        jwrap = -1;
    } else if (jstyleguide === "grunt") {
        jchar = " ";
        jsize = 2;
        jquoteConvert = "single";
        jvarword = "each";
    } else if (jstyleguide === "jquery") {
        jbracepadding = true;
        jchar = "\u0009";
        jquoteConvert = "double";
        jscorrect = true;
        jsize = 1;
        jvarword = "each";
        jwrap = 80;
    } else if (jstyleguide === "mrdoobs") {
        jbraceline = true;
        jbracepadding = true;
        jchar = "\u0009";
        jscorrect = true;
        jsize = 1;
        jvertical = false;
    } else if (jstyleguide === "mediawiki") {
        jbracepadding = true;
        jchar = "\u0009";
        jpres = true;
        jquoteConvert = "single";
        jscorrect = true;
        jsize = 1;
        jspace = false;
        jwrap = 80;
    } else if (jstyleguide === "meteor") {
        jchar = " ";
        jscorrect = true;
        jsize = 2;
        jwrap = 80;
    } else if (jstyleguide === "yandex") {
        jbracepadding = false;
        jquoteConvert = "single";
        jscorrect = true;
        jvarword = "each";
        jvertical = false;
    }
    if (jtitanium === true) {
        jscorrect = false;
        token.push("x{");
        types.push("start");
        lines.push(0);
    }

    //this function tokenizes the source code into an array
    //of literals and syntax tokens
    //token types are populated into the "types" array and are:
    // * comment - any comment other than "comment-inline"
    // * comment-inline - this is any "//" comment following code
    // * end - ] ) }
    // * literal - quoted strings and numbers
    // * markup - for supporting JSX
    // * method - any left parenthesis character immediately
    //   following a word type, and by immediately following I mean
    //   not separated by any characters in the input include spaces
    // * operator - special characters that are not quotes or
    //   containment characters
    // * regex - regular expression plus trailing switches
    // * separator - all commas, semicolons and periods outside of
    //   numbers
    // * start - all left square braces, all left curly braces, and
    //   all left parentheses not immediately following a word type
    // * word - keywords, reserved words, and variables
    (function jspretty__tokenize() {
        var a = 0,
            b = jsource.length,
            c = jsource.split(""),
            ltoke = "",
            ltype = "",
            lengtha = 0,
            lengthb = 0,
            wordTest = -1,
            //depth and status of templateStrings
            templateString = [],
            //tell while loops apart from do/while loops
            dostate = {
                count: [],
                index: 0,
                len: -1,
                state: []
            },
            //determine if in an object literal
            obj = {
                count: [],
                len: -1,
                status: []
            },
            //identify blocks missing braces and where to insert
            block = {
                consec: [],
                count: [],
                index: [],
                len: -1,
                priorreturn: [],
                semi: [],
                word: []
            },
            //identify variable declarations
            vart = {
                count: [],
                index: [],
                len: -1
            },
            //peek at whats up next
            nextchar = function jspretty__tokenize_nextchar() {
                var cc = 0,
                    dd = "";
                if (c[a] === "/") {
                    if (c[a + 1] === "/") {
                        dd = "\n";
                    } else if (c[a + 1] === "*") {
                        dd = "/";
                    }
                }
                for (cc = a + 1; cc < b; cc += 1) {
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
                            return c[cc];
                        }
                    } else if (dd === "\n" && (c[cc] === "\n" || c[cc] === "\r")) {
                        dd = "";
                    }
                }
                return "";
            },
            //sort object properties
            objSort = function jspretty__tokenize_objSort() {
                var cc = 0,
                    dd = 0,
                    ee = 0,
                    startlen = token.length - 1,
                    end = startlen,
                    keys = [],
                    keylen = 0,
                    keyend = 0,
                    start = 0,
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
                            start = cc + 1;
                        }
                        if (commaTest === true && token[cc] === "," && start < end) {
                            keys.push([
                                start, end + 1
                            ]);
                            end = start - 1;
                        }
                    }
                    if (dd < 0 && cc < startlen) {
                        if (keys.length > 0 && keys[keys.length - 1][0] > cc + 1) {
                            keys.push([
                                cc + 1, keys[keys.length - 1][0] - 1
                            ]);
                        }
                        if (token[cc - 1] === "=" || token[cc - 1] === ":" || token[cc - 1] === "(" || token[cc - 1] === "[" || token[cc - 1] === "," || types[cc - 1] === "word" || cc === 0) {
                            if (keys.length > 1) {
                                keys.sort(sort);
                                keylen = keys.length;
                                commaTest = false;
                                for (dd = 0; dd < keylen; dd += 1) {
                                    keyend = keys[dd][1];
                                    if (lines[keys[dd][0] - 1] === 2 && pairLines.length > 0) {
                                        pairLines[pairLines.length - 1] = 2;
                                    }
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
                                        pairLines[ee - 1] = 0;
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
                                if (jendcomma === true && types[lengtha - 1] !== "start" && types[lengtha - 1] !== "method") {
                                    token.push(",");
                                    types.push("separator");
                                    lines.push(0);
                                }
                            } else if (jendcomma === true && types[lengtha - 1] !== "start" && types[lengtha - 1] !== "method") {
                                token.push(",");
                                types.push("separator");
                                lines.push(0);
                            }
                        }
                        return;
                    }
                }
            },
            //remove "obj" object data
            objpop = function jspretty__tokenize_objpop() {
                obj.count
                    .pop();
                obj.len -= 1;
                obj.status
                    .pop();
                if (jobjsort === true) {
                    objSort();
                }
            },
            //remove "block" object data
            blockpop = function jspretty__tokenize_blockpop() {
                var pass = true,
                    bword = block.word[block.len];
                if (ltoke === ")" && (bword === "if" || bword === "for" || bword === "while" || bword === "with")) {
                    (function jspretty__tokenize_blockpop_pcheck() {
                        var aa = 0,
                            bb = 0;
                        for (aa = lengtha - 1; aa > -1; aa -= 1) {
                            if (types[aa] === "end") {
                                bb += 1;
                            } else if (types[aa] === "start" || types[aa] === "method") {
                                bb -= 1;
                            }
                            if (bb === 0) {
                                if (token[aa - 1] === "function" || token[aa - 2] === "function") {
                                    pass = false;
                                }
                                return;
                            }
                        }
                    }());
                }
                if (pass === true) {
                    block.consec
                        .pop();
                    block.count
                        .pop();
                    block.index
                        .pop();
                    block.len -= 1;
                    block.priorreturn
                        .pop();
                    block.semi
                        .pop();
                    block.word
                        .pop();
                }
            },
            //remove "vart" object data
            vartpop = function jspretty__tokenize_vartpop() {
                vart.count
                    .pop();
                vart.index
                    .pop();
                vart.len -= 1;
            },
            //insert curly braces where they are missing
            blockinsert = function jspretty__tokenize_blockinsert() {
                var index = block.index[block.len],
                    consec = block.consec[block.len],
                    last = lines.length - 1,
                    early = false,
                    next = nextchar(),
                    linel = lines[last],
                    ifword = (block.word[block.len] === "if"),
                    ifelse = (block.word[block.len - 1] === "if" && ifword === false),
                    elseme = (function jspretty__tokenize_blockinsert_elseme() {
                        var d = 0,
                            elser = "",
                            spacetest = (/\s/);
                        for (d = a + 1; d < b; d += 1) {
                            if (spacetest.test(c[d]) === false) {
                                elser += c[d];
                            }
                            if (elser.length === 4) {
                                return elser;
                            }
                        }
                        return elser;
                    }()),
                    elseco = (ifelse === true && consec === true && elseme === "else");
                if (block.len < 0) {
                    return;
                }
                if (ifword === true && elseme === "else") {
                    (function jspretty__tokenize_blockinsert_early() {
                        var d = 0,
                            e = 0;
                        for (d = token.length - 1; d > -1; d -= 1) {
                            if (types[d] === "end") {
                                e += 1;
                            } else if (types[d] === "start" || types[d] === "method") {
                                e -= 1;
                            }
                            if (e === 0) {
                                if (token[d] === "{" && token[d - 1] === ")") {
                                    for (d = d - 1; d > -1; d -= 1) {
                                        if (types[d] === "end") {
                                            e += 1;
                                        } else if (types[d] === "start" || types[d] === "method") {
                                            e -= 1;
                                        }
                                        if (e === 0) {
                                            if (token[d - 1] === "if") {
                                                early = true;
                                            }
                                            return;
                                        }
                                        if (e < 0) {
                                            return;
                                        }
                                    }
                                }
                                return;
                            }
                            if (e < 0) {
                                return;
                            }
                        }
                    }());
                    if (early === true) {
                        return;
                    }
                }
                if (types[index] === "comment" || types[index] === "comment-inline") {
                    do {
                        index -= 1;
                    } while (index > 0 && (types[index] === "comment" || types[index] === "comment-inline"));
                    index += 1;
                }
                if (block.word[block.len] === "else" && token[index] === "else") {
                    index += 1;
                }
                if (block.len > -1 && block.count[block.len] === 0 && (next === "" || ".,".indexOf(next) < 0)) {
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
                    ltoke = "x}";
                    ltype = "end";
                    if (block.priorreturn[block.len] === true) {
                        token.push("x;");
                        types.push("separator");
                        ltoke = "x;";
                        ltype = "separator";
                        lines.push(0);
                    }
                    if (token[block.index[block.len] - 1] === "}" && block.word[block.len] === "else") {
                        elseco = true;
                    }
                    blockpop();
                    if (c[a] === "}" && (block.word[block.len] === "if" || block.word[block.len] === "else")) {
                        (function jspretty__tokenize_blockinsert_expression() {
                            var d = 0,
                                e = 0,
                                f = block.index[block.len];
                            for (d = token.length - 1; d > f; d -= 1) {
                                if (types[d] === "end") {
                                    e += 1;
                                } else if (types[d] === "start" || types[d] === "method") {
                                    e -= 1;
                                    if (e < 0) {
                                        if (token[d] === "(") {
                                            block.count[block.len] -= 1;
                                        }
                                        return;
                                    }
                                }
                            }
                        }());
                    }
                    if (elseco === true) {
                        jspretty__tokenize_blockinsert();
                    }
                }
            },
            terncheck = function jspretty__tokenize_ternCheck() {
                var d = 0,
                    spacetest = (/\s/);
                if (block.count[block.len] > 0) {
                    block.count[block.len] -= 1;
                }
                for (d = a + 1; d < b; d += 1) {
                    if (c[d] === ":") {
                        return;
                    }
                    if (spacetest.test(c[d]) === false) {
                        break;
                    }
                }
                if (block.count[block.len] === 0) {
                    blockinsert();
                }
            },
            slashes = function jspretty__tokenize_slashes(index) {
                var slashy = index;
                do {
                    slashy -= 1;
                } while (c[slashy] === "\\" && slashy > 0);
                if ((index - slashy) % 2 === 1) {
                    return true;
                }
                return false;
            },
            //commaComment ensures that commas immediately precede
            //comments instead of immediately follow
            commaComment = function jspretty__tokenize_commacomment() {
                var x = types.length;
                do {
                    x -= 1;
                } while (x > 0 && (types[x - 1] === "comment" || types[x - 1] === "comment-inline"));
                token.splice(x, 0, ",");
                types.splice(x, 0, "separator");
            },
            //injects a comma into the end of arrays for use with endcomma option
            endCommaArray = function jspretty__tokenize_endCommaArray() {
                var d = 0,
                    e = 0;
                for (d = lengtha; d > 0; d -= 1) {
                    if (types[d] === "end") {
                        e += 1;
                    } else if (types[d] === "start" || types[d] === "method") {
                        e -= 1;
                    }
                    if (e < 0) {
                        return;
                    }
                    if (e === 0 && token[d] === ",") {
                        token.push(",");
                        types.push("separator");
                        lines.push(0);
                        return;
                    }
                }
            },
            //convert ++ and -- into += and -= in most cases
            plusplus = function jspretty__tokenize_plusplus() {
                var store = [],
                    pre = true,
                    toke = "+=",
                    tokea = "",
                    tokeb = "",
                    tokec = "";
                lengtha = token.length;
                tokea = token[lengtha - 1];
                tokeb = token[lengtha - 2];
                tokec = token[lengtha - 3];
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
                lengtha = token.length;
                ltoke = token[lengtha - 1];
                ltype = types[lengtha - 1];
            },
            //automatic semicolon insertion
            asi = function jspretty__tokenize_asi(isEnd) {
                var len = token.length - 1,
                    aa = len,
                    bb = 0,
                    next = nextchar(),
                    tokel = token[len],
                    typel = types[len],
                    colon = false,
                    early = false,
                    paren = false,
                    opers = false;
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
                }
                if (tokel === undefined || typel === "start" || typel === "separator" || typel === "operator" || tokel === "x}" || tokel === ";" || tokel === "x;" || tokel === "var" || tokel === "else" || tokel.indexOf("#!/") === 0 || tokel === "instanceof") {
                    return;
                }
                if (obj.len > -1 && obj.status[obj.len] === true && obj.count[obj.len] === 0) {
                    return;
                }
                if ((typel === "literal" && types[len - 1] !== "start") || typel !== "literal") {
                    for (aa = aa; aa > -1; aa -= 1) {
                        if (types[aa] === "end") {
                            bb += 1;
                        } else if (types[aa] === "start" || types[aa] === "method") {
                            bb -= 1;
                        }
                        if (bb < 0) {
                            if (token[aa - 1] === "import") {
                                return;
                            }
                            if (token[aa - 1] === "do" || typel === "word" || typel === "literal" || (opers === true && colon === false)) {
                                break;
                            }
                            return;
                        }
                        if (bb === 0) {
                            if (token[aa] === "," && aa < len && isEnd === true) {
                                if (jendcomma === true && token[lengtha - 1] !== "," && types[lengtha - 1] !== "start" && types[lengtha - 1] !== "method") {
                                    token.push(",");
                                    types.push("separator");
                                    lines.push(0);
                                }
                                return;
                            }
                            if (aa === 0 && ((token[0] === "{" && tokel === "}") || (token[0] === "[" && tokel === "]"))) {
                                return;
                            }
                            if (token[aa] === "(" && (token[aa - 1] === "function" || token[aa - 2] === "function" || (tokel === ")" && token[aa - 1] === block.word[block.len]))) {
                                return;
                            }
                            if (token[aa] === "do" || token[aa] === block.word[block.len]) {
                                break;
                            }
                            if (isEnd === true && (types[aa] === "start" || types[aa] === "method")) {
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
                                        if (token[aa] === "function" && token[aa - 1] === "async") {
                                            aa -= 1;
                                        }
                                        if (((token[aa] === "function" || token[aa] === "async") && ((types[aa - 1] === "operator" && token[aa - 1] !== ":") || token[aa - 1] === "return")) || (token[aa - 1] === "function" && (types[aa - 2] === "operator" || token[aa - 2] === "return"))) {
                                            early = true;
                                            break;
                                        }
                                        if ((token[aa] === "function" || token[aa] === "async") && token[aa - 1] === ":") {
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
                lines.splice(len, 0, 0);
                if (block.len > -1 && block.count[block.len] === 0) {
                    blockinsert();
                }
            },
            //cleans up improperly applied ASI
            asifix = function jspretty__tokenize_asifix() {
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
                }
            },
            //fixes asi location if inserted after an inserted brace
            asibrace = function jspretty__tokenize_asibrace() {
                var aa = token.length;
                do {
                    aa -= 1;
                } while (aa > -1 && token[aa] === "x}");
                aa += 1;
                token.splice(aa, 0, ltoke);
                types.splice(aa, 0, ltype);
            },
            //convert double quotes to single or the opposite
            quoteConvert = function jspretty__tokenize_quoteConvert(item) {
                var dub = (jquoteConvert === "double"),
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
            //splits and merges line comments to conform to jwrap
            commentSplit = function jspretty__tokenize_commentSplit(item) {
                var tokel = token[token.length - 1],
                    start = jwrap,
                    spacely = (item.indexOf(" ") > 0);
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
                            item = item.slice(start + 1);
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
                        item = item.slice(start + 1);
                        start = jwrap - 2;
                    } while (item.length > start);
                    if (item !== "") {
                        token.push("//" + item.slice(0, start));
                        types.push("comment");
                        lines.push(0);
                    }
                } else {
                    if (tokel.indexOf("//") === 0 && tokel.length < start && tokel.indexOf(" ") === -1 && item.indexOf(" ") === -1) {
                        start = start - tokel.length;
                        token[token.length - 1] = tokel + item.slice(0, start);
                        item = item.slice(start);
                        start = jwrap;
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
            //breaks long string down into smaller chunks defined by jwrap
            strlen = function jspretty__tokenize_strlen(item) {
                var aa = 0,
                    bb = 0,
                    cc = 0,
                    dd = 0,
                    ee = 0,
                    ff = 0,
                    str = "",
                    uchar = (/u[0-9a-fA-F]{4}/),
                    xchar = (/x[0-9a-fA-F]{2}/),
                    qchar = item.charAt(0),
                    paren = (c[a + 1] === "." && (item.charAt(0) === "\"" || item.charAt(0) === "''"));
                if (item.length > jwrap + 2) {
                    if (paren === true) {
                        token.push("(");
                        types.push("start");
                        lines.push(0);
                        dd = -1;
                    }
                    item = item.slice(1, item.length - 1);
                    bb = parseInt(item.length / jwrap, 10) * jwrap;
                    for (aa = 0; aa < bb; aa += jwrap) {
                        cc = aa + jwrap + dd - ff;
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
                            token.push(qchar + item.slice(ee, cc - 1) + qchar);
                            ee = cc - 1;
                            aa -= 1;
                        } else {
                            str = qchar + item.slice(ee, cc) + qchar;
                            ee = cc;
                            token.push(str);
                        }
                        types.push("literal");
                        lines.push(0);
                        token.push("+");
                        types.push("operator");
                        lines.push(0);
                    }
                    if (aa < item.length) {
                        token.push(qchar + item.slice(aa, aa + jwrap) + qchar);
                        types.push("literal");
                        lines.push(0);
                    } else {
                        token.pop();
                        types.pop();
                        lines.pop();
                    }
                    if (paren === true) {
                        token.push(")");
                        types.push("end");
                        lines.push(0);
                    }
                } else {
                    token.push(item);
                    types.push("literal");
                    lines.push(0);
                }
                lengtha = token.length;
                ltoke = token[lengtha - 1];
                ltype = types[lengtha - 1];
            },
            //merges strings separated by "+" if jwrap is less than 0
            strmerge = function jspretty__tokenize_strmerge(item, wrap) {
                var aa = 0,
                    bb = "";
                item = item.slice(1, item.length - 1);
                token.pop();
                types.pop();
                lines.pop();
                aa = token.length - 1;
                bb = token[aa];
                if (wrap === true) {
                    bb = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                    token.pop();
                    types.pop();
                    lines.pop();
                    strlen(bb);
                } else {
                    token[aa] = bb.slice(0, bb.length - 1) + item + bb.charAt(0);
                }
            },
            //a handy little helper to determine if an opening paren
            //'(' is a method or start token after simple logic as failed
            methodTest = function jspretty__tokenize_methodTest() {
                var cc = 0,
                    dd = 0,
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
            newarray = function jspretty__tokenize_newarray() {
                var aa = token.length - 1,
                    bb = 0,
                    cc = aa,
                    arraylen = 0;
                for (aa = aa; aa > -1; aa -= 1) {
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
            logError = function jspretty__tokenize_logError(message, start) {
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
            //the generic function is a generic tokenizer
            //start argument contains the token's starting syntax
            //offset argument is length of start minus control chars
            //end is how is to identify where the token ends
            generic = function jspretty__tokenize_genericBuilder(start, ending) {
                var ee = 0,
                    g = 0,
                    end = ending.split(""),
                    endlen = end.length - 1,
                    jj = b,
                    build = [start],
                    base = a + start.length,
                    output = "",
                    escape = false;
                if (ending === "\r") {
                    end = ["\n"];
                }
                //this insanity is for JSON where all the required
                //quote characters are escaped.
                if (c[a - 1] === "\\" && slashes(a - 1) === true && (c[a] === "\"" || c[a] === "'")) {
                    token.pop();
                    types.pop();
                    lines.pop();
                    if (token[0] === "{") {
                        if (c[a] === "\"") {
                            start = "\"";
                            ending = "\\\"";
                            build = ["\""];
                        } else {
                            start = "'";
                            ending = "\\'";
                            build = ["'"];
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
                output = build.join("");
                if (jsscope !== "none") {
                    output = output.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                }
                return output;
            },
            //a tokenizer for regular expressions
            regex = function jspretty__tokenize_regex() {
                var ee = 0,
                    f = b,
                    h = 0,
                    i = 0,
                    build = ["/"],
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
                if (jsscope !== "none") {
                    output = output.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                }
                return output;
            },
            //a unique tokenizer for operator characters
            operator = function jspretty__tokenize_operator() {
                var syntax = [
                        "=", "<", ">", "+", "*", "?", "|", "^", ":", "&", "%", "~"
                    ],
                    g = 0,
                    h = 0,
                    jj = b,
                    build = [c[a]],
                    synlen = syntax.length,
                    output = "";
                if (c[a] === "/" && (lengtha > 0 && (ltype !== "word" || ltoke === "typeof" || ltoke === "return" || ltoke === "else") && ltype !== "literal" && ltype !== "end")) {
                    if (ltoke === "return" || ltoke === "typeof" || ltoke === "else" || ltype !== "word") {
                        ltoke = regex();
                        ltype = "regex";
                        stats.regex.token += 1;
                        stats.regex.chars += ltoke.length;
                    } else {
                        stats.operator.token += 1;
                        stats.operator.chars += 1;
                        ltoke = "/";
                        ltype = "operator";
                    }
                    token.push(ltoke);
                    types.push(ltype);
                    lines.push(0);
                    return "regex";
                }
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
                if (jsscope !== "none") {
                    output = output.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                }
                if (output === "?" && obj.len > -1 && obj.count[obj.len] === 0 && obj.status[obj.len] === false) {
                    obj.count[obj.len] += 1;
                }
                return output;
            },
            //ES6 template string support
            tempstring = function jspretty__tokenize_tempstring() {
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
            numb = function jspretty__tokenize_number() {
                var ee = 0,
                    f = b,
                    build = [c[a]],
                    dot = (build[0] === ".");
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
            //Not a tokenizer.  This counts white space characters
            //and determines if there are empty lines to be
            //preserved
            space = function jspretty__tokenize_space() {
                var schars = [],
                    f = 0,
                    locallen = b,
                    emptyline = 1,
                    output = "",
                    stest = (/\s/),
                    asitest = false;
                for (f = a; f < locallen; f += 1) {
                    if (c[f] === "\n") {
                        stats.space.newline += 1;
                        asitest = true;
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
                if (asitest === true && ltoke !== ";" && lengthb < token.length && c[a + 1] !== "}") {
                    asi(false);
                    lengthb = token.length;
                }
            },
            //A tokenizer for keywords, reserved words, and
            //variables
            word = function jspretty__tokenize_word() {
                var f = wordTest,
                    g = 1,
                    build = [],
                    output = "",
                    dotest = false;
                do {
                    build.push(c[f]);
                    if (c[f] === "\\") {
                        logError("Illegal escape in JavaScript.", a);
                    }
                    f += 1;
                } while (f < a);
                output = build.join("");
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
                    c[a + 1] = "";
                    c[a + 2] = "";
                    stats.container += 2;
                    a += 2;
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
                            stats.word.token += 1;
                            stats.word.chars += output.length;
                            ltoke = ",";
                            ltype = "separator";
                            token[g] = ltoke;
                            types[g] = ltype;
                            vart.count[vart.len] = 0;
                            vart.index[vart.len] = g;
                            return;
                        }
                        vart.len += 1;
                        vart.count
                            .push(0);
                        vart.index
                            .push(g);
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
                    if (output === "try" && block.len > -1) {
                        block.count[block.len] += 1;
                    } else if (output === "catch" && block.len > -1) {
                        block.count[block.len] -= 1;
                    }
                    if (output === "do") {
                        dostate.count
                            .push(0);
                        dostate.state
                            .push(output);
                        dostate.len += 1;
                    }
                    if (output === "while" && dostate.state[dostate.len] === "do" && dostate.count[dostate.len] === 0) {
                        if (output === "while") {
                            dotest = true;
                        }
                        if (ltoke === "}") {
                            asifix();
                        }
                        dostate.count
                            .pop();
                        dostate.state
                            .pop();
                        dostate.len -= 1;
                        dostate.index = token.length - 1;
                        blockinsert();
                    }
                    if (output === "if" && block.len > -1 && token[lengtha - 1] === "else") {
                        blockpop();
                    }
                    if (output === "from" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                        asifix();
                    }
                    if (output === "if" || output === "for" || output === "with" || (output === "while" && dotest === false) || output === "else" || output === "do") {
                        if (output === "else" && ltoke === ";") {
                            blockinsert();
                        }
                        if ((block.len > -1 && block.index[block.len] === token.length) || ltoke === "else") {
                            block.consec
                                .push(true);
                        } else {
                            block.consec
                                .push(false);
                        }
                        if (ltoke === "return") {
                            block.priorreturn
                                .push(true);
                        } else {
                            block.priorreturn
                                .push(false);
                        }
                        block.word
                            .push(output);
                        block.count
                            .push(0);
                        if (output === "do") {
                            block.index
                                .push(token.length + 1);
                        } else {
                            block.index
                                .push(token.length);
                        }
                        block.semi
                            .push(false);
                        block.len += 1;
                    }
                    if (output === "while" && token[lengtha - 1] === "x;" && token[lengtha - 2] === "}") {
                        (function jspretty__tokenize_word_whilefix() {
                            var d = 0,
                                e = 0;
                            for (e = lengtha - 3; e > -1; e -= 1) {
                                if (types[e] === "end") {
                                    d += 1;
                                } else if (types[e] === "start" || types[e] === "method") {
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
                    token.push(output);
                    types.push("word");
                    ltoke = output;
                    ltype = "word";
                    stats.word.token += 1;
                    stats.word.chars += output.length;
                    if (output === "from" && token[lengtha - 1] === "}") {
                        asifix();
                    }
                    lengtha = token.length;
                }
                lines.push(0);
            },
            //Identifies blocks of markup embedded within JavaScript
            //for language supersets like React JSX.
            markup = function jspretty__tokenize_markup() {
                var output = [],
                    curlytest = false,
                    endtag = false,
                    anglecount = 0,
                    curlycount = 0,
                    tagcount = 0,
                    d = 0,
                    syntax = "=<>+*?|^:&.,;%(){}[]|~";
                if (syntax.indexOf(c[a + 1]) > -1 || (/\s/).test(c[a + 1]) === true || ((/\d/).test(c[a + 1]) === true && (ltype === "operator" || ltype === "literal" || (ltype === "word" && ltoke !== "return")))) {
                    ltype = "operator";
                    return operator();
                }
                for (d = token.length - 1; d > -1; d -= 1) {
                    if (token[d] === "return" || types[d] === "operator" || types[d] === "method") {
                        ltype = "markup";
                        global.jsxstatus = true;
                        break;
                    }
                    if (token[d] !== "(") {
                        ltype = "operator";
                        return operator();
                    }
                }
                for (a = a; a < b; a += 1) {
                    output.push(c[a]);
                    if (c[a] === "{") {
                        curlycount += 1;
                        curlytest = true;
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
                if (wordTest > -1) {
                    word();
                }
                space();
            } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                //php
                if (wordTest > -1) {
                    word();
                }
                ltoke = generic("<?php", "?>");
                ltype = "literal";
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
                ltoke = generic("<%", "%>");
                ltype = "literal";
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
                ltoke = generic("<!--#", "-->");
                ltype = "literal";
                stats.server.token += 1;
                stats.server.chars += ltoke.length;
                token.push(ltoke);
                types.push(ltype);
                lines.push(0);
            } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-") {
                //markup comment
                if (wordTest > -1) {
                    word();
                }
                ltoke = generic("<!--", "-->");
                ltype = "comment";
                stats.commentBlock.token += 1;
                stats.commentBlock.chars += ltoke.length;
                token.push(ltoke);
                types.push(ltype);
                lines.push(0);
            } else if (c[a] === "<") {
                //markup
                if (wordTest > -1) {
                    word();
                }
                ltoke = markup();
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
                ltoke = generic("/*", "*\/");
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
                ltoke = generic("#!/", "\r");
                ltoke = ltoke.slice(0, ltoke.length - 1);
                ltype = "literal";
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
                asi(false);
                ltoke = generic("//", "\r");
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
                ltoke = tempstring();
                ltype = "literal";
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
                if (token[lengtha] === "+" && jwrap < 0 && (token[lengtha - 1].charAt(0) === "\"" || token[lengtha - 1].charAt(0) === "'")) {
                    strmerge(ltoke, false);
                } else if (jwrap > 0 && (types[lengtha] !== "operator" || token[lengtha] === "=" || token[lengtha] === ":" || (token[lengtha] === "+" && types[lengtha - 1] === "literal"))) {
                    if (types[lengtha - 2] === "literal" && token[lengtha - 1] === "+" && (token[lengtha - 2].charAt(0) === "\"" || token[lengtha - 2].charAt(0) === "'") && token[lengtha - 2].length < jwrap + 2) {
                        strmerge(ltoke, true);
                    } else {
                        strlen(ltoke);
                    }
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
                ltoke = "-";
                ltype = "operator";
                token.push(ltoke);
                types.push(ltype);
                lines.push(0);
            } else if (wordTest === -1 && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
                //number
                if (wordTest > -1) {
                    word();
                }
                if (ltype === "end" && c[a] === "-") {
                    ltoke = "-";
                    ltype = "operator";
                    stats.operator.token += 1;
                    stats.operator.chars += 1;
                } else {
                    ltoke = numb();
                    ltype = "literal";
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
                    ltoke = "...";
                    ltype = "operator";
                    stats.operator.chars += 3;
                    a += 2;
                } else {
                    asifix();
                    ltoke = ".";
                    ltype = "separator";
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
                if (block.len > -1 && block.count[block.len] === 0) {
                    blockinsert();
                }
            } else if (c[a] === "(") {
                //paren open
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
                } else if ((token[lengtha - 1] === "function" && jspace === false) || token[token.length - 2] === "function") {
                    ltype = "method";
                } else if (lengtha === 0 || ltoke === "return" || ltoke === "function" || ltoke === "for" || ltoke === "if" || ltoke === "with" || ltoke === "while" || ltoke === "switch" || ltoke === "catch" || ltype === "separator" || ltype === "operator" || (a > 0 && (/\s/).test(c[a - 1]) === true)) {
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
                ltoke = "[";
                ltype = "start";
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
                if (ltoke !== ")" && ltoke !== "else" && ltoke !== "do" && ltoke !== "import" && ltoke !== "let" && ltoke !== "var" && ltoke !== "const") {
                    obj.count
                        .push(0);
                    obj.status
                        .push(false);
                    obj.len += 1;
                } else if (obj.len > -1) {
                    obj.count[obj.len] += 1;
                }
                if (ltoke === "else" || ltoke === "do" || (ltoke === ")" && block.len > -1 && block.count[block.len] === 0 && token[token.length - 4] !== "catch" && (block.word[block.len] === "if" || block.word[block.len] === "for" || block.word[block.len] === "while" || block.word[block.len] === "with"))) {
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
                    ltoke = token[lengtha - 1];
                    token[lengtha - 1] = "{";
                    ltype = types[lengtha - 1];
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
                //paren close
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
                        asi(false);
                        dostate.count
                            .pop();
                        dostate.state
                            .pop();
                        dostate.len -= 1;
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
                if ((jendcomma === false || token[lengtha - 2] === "[") && ltoke === ",") {
                    token.pop();
                    types.pop();
                    lines.pop();
                } else if (jendcomma === true && ltoke !== ",") {
                    endCommaArray();
                }
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
                asi(true);
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
                    lengtha = token.length;
                    ltoke = token[lengtha - 1];
                    ltype = types[lengtha - 1];
                }
                if (jbraceline === true) {
                    lines[lines.length - 1] = 2;
                }
                if (ltoke === "," && jendcomma === false) {
                    stats.container += 1;
                    ltoke = "}";
                    ltype = "end";
                    token.push(ltoke);
                    types.push(ltype);
                    lines.push(0);
                } else {
                    if (ltoke === ";" && jmode === "minify") {
                        token[token.length - 1] = "x;";
                    }
                    plusplus();
                    stats.container += 1;
                    ltoke = "}";
                    ltype = "end";
                    token.push(ltoke);
                    types.push(ltype);
                    lines.push(0);
                }
                if (block.len > -1) {
                    terncheck();
                }
            } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%" || c[a] === "~") {
                //operator
                if (wordTest > -1) {
                    word();
                }
                ltoke = operator();
                if (ltoke === "regex") {
                    ltoke = token[lengtha - 1];
                } else {
                    ltype = "operator";
                    stats.operator.token += 1;
                    stats.operator.chars += ltoke.length;
                    if (ltoke !== "!" && ltoke !== "++" && ltoke !== "--") {
                        asifix();
                    }
                    token.push(ltoke);
                    types.push(ltype);
                    lines.push(0);
                }
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
            asi(false);
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
                    scolon += 1;
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

    if (global.jsxstatus === true && jsscope !== "none" && token[0] === "{") {
        jsscope = "none";
        (function jspretty__jsxScope() {
            var a = 0,
                len = token.length;
            for (a = 0; a < len; a += 1) {
                if (types[a] === "word" && token[a - 1] !== ".") {
                    token[a] = "[pdjsxscope]" + token[a] + "[/pdjsxscope]";
                }
            }
        }());
    }

    if (jmode === "beautify" || jmode === "diff") {
        //this function is the pretty-print algorithm
        (function jspretty__algorithm() {
            var a = 0,
                b = token.length,
                indent = jlevel, //will store the current level of indentation
                obj = [], //stores if current block is an object literal
                list = [], //stores comma status of current block
                listtest = [], //determines the comma evaluation must run for the current block
                lastlist = false, //remembers the list status of the most recently closed block
                ternary = [], //used to identify ternary statments
                varline = [], //determines if a current list of the given block is a list of variables following the "var" keyword
                casetest = [], //is the current block a switch/case?
                fortest = 0, //used for counting the arguments of a "for" loop
                ctype = "", //ctype stands for "current type"
                ctoke = "", //ctoke standa for "current token"
                ltype = types[0], //ltype stands for "last type"
                ltoke = token[0], //ltype stands for "last token"
                lettest = -1,
                varlen = [], //stores lists of variables, assignments, and object properties for white space padding
                methodtest = [], //is the current block inside a method?
                starttype = [], //describes the current container
                methodbreak = [false], //are methods being broken
                arrbreak = [], //array where a methodbreak has occurred
                destruct = [], //attempt to identify object destructuring
                assignlist = [false], //are you in a list right now?
                destructfix = function jspretty__algorithm_destructFix() {
                    var c = 0,
                        d = 1;
                    for (c = a - 1; c > -1; c -= 1) {
                        if (types[c] === "end") {
                            d += 1;
                        } else if (types[c] === "start" || types[c] === "method") {
                            d -= 1;
                        }
                        if (d === 0) {
                            level[c] = indent;
                            return;
                        }
                    }
                },
                tern = function jspretty__algorithm_tern() {
                    var c = 0,
                        d = 0;
                    for (c = a - 1; c > -1; c -= 1) {
                        if (types[c] === "end") {
                            d += 1;
                        } else if (types[c] === "start" || types[c] === "method") {
                            d -= 1;
                            if (d < 0) {
                                return;
                            }
                        }
                        if (d === 0 && token[c] === "?") {
                            indent -= 1;
                            ternary.pop();
                            if (ternary.length === 0) {
                                return;
                            }
                        }
                    }
                },
                separator = function jspretty__algorithm_separator() {
                    var methtest = false,
                        functest = false,
                        funcargs = false,
                        propertybreak = function jspretty__algorithm_separator_propertybreak(funcarg) {
                            var c = 0,
                                d = 0,
                                e = 0;
                            methodbreak[methodbreak.length - 1] = true;
                            indent += 1;
                            if (funcarg === true) {
                                methtest = true;
                            }
                            for (c = a - 1; c > -1; c -= 1) {
                                if (types[c] === "end") {
                                    d += 1;
                                    if (types[c + 1] !== "end" && types[c + 1] !== "start" && token[c + 1] !== ".") {
                                        break;
                                    }
                                } else if (types[c] === "start" || types[c] === "method") {
                                    d -= 1;
                                }
                                if (d === 0) {
                                    if (token[c] === ".") {
                                        if (token[c - 1] === "}") {
                                            break;
                                        }
                                        e = c - 1;
                                        level[e] = indent;
                                        methtest = true;
                                    } else if (types[c] === "separator" || types[c] === "operator" || token[c] === "return" || token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                        if (methtest === true && token[c] === "," && types[c + 1] === "word") {
                                            level[c] = indent - 1;
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
                                        level[c] += 1;
                                    }
                                }
                                if (d < 0) {
                                    if (token[c] === "[") {
                                        level[c] = indent - 1;
                                    }
                                    break;
                                }
                            }
                            if (funcarg === false && methtest === true && types[e] !== "comment" && types[e] !== "comment-inline") {
                                if (e > 0) {
                                    level[e] = "x";
                                } else {
                                    level[a - 1] = "x";
                                }
                            }
                        };
                    if (ternary.length > 0 && ctoke !== ".") {
                        tern();
                    }
                    if (jmethodchain === true && types[a - 1] === "comment-inline" && a > 1) {
                        return (function jspretty__algorithm_separator_commentfix() {
                            var c = 0,
                                d = b,
                                last = token[a - 1];
                            level[a - 2] = "x";
                            level[a - 1] = "x";
                            for (c = a; c < d; c += 1) {
                                token[c - 1] = token[c];
                                types[c - 1] = types[c];
                                if (token[c] === ";" || token[c] === "x;" || token[c] === "{" || token[c] === "x{" || lines[c] > 0) {
                                    token[c] = last;
                                    types[c] = "comment-inline";
                                    a -= 1;
                                    return;
                                }
                            }
                            token[c - 1] = last;
                            types[c - 1] = "comment-inline";
                            a -= 1;
                        }());
                    }
                    if (ctoke === ".") {
                        if (jmethodchain === true && ltype !== "comment" && ltype !== "comment-inline") {
                            level[a - 1] = "x";
                        } else {
                            if (starttype[starttype.length - 1] !== "paren" && starttype[starttype.length - 1] !== "method" && (ltoke === ")" || methodbreak[methodbreak.length - 1] === true || (types[a + 1] === "word" && types[a + 2] === "method"))) {
                                if (methodbreak[methodbreak.length - 1] === false) {
                                    funcargs = (function jspretty__algorithm_separator_funcargs() {
                                        var aa = 0,
                                            bb = b,
                                            cc = 0,
                                            firstmeth = false;
                                        for (aa = a + 1; aa < bb; aa += 1) {
                                            if (types[aa] === "end") {
                                                cc += 1;
                                                if (cc > 1 || (cc === 0 && token[aa] === ")")) {
                                                    return false;
                                                }
                                            } else if (types[aa] === "start" || types[aa] === "method") {
                                                cc -= 1;
                                                if (firstmeth === false && cc === -1 && types[aa] === "method") {
                                                    firstmeth = true;
                                                }
                                            }
                                            if (cc === -1 && token[aa] === "function") {
                                                return true;
                                            }
                                        }
                                    }());
                                    propertybreak(funcargs);
                                    if (methtest === true) {
                                        if (functest === false) {
                                            level[a - 1] = indent;
                                        } else {
                                            level[a - 1] = "x";
                                        }
                                    } else {
                                        indent -= 1;
                                        methodbreak[methodbreak.length - 1] = false;
                                        level[a - 1] = "x";
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
                        level[a - 1] = "x";
                        //this is the test of whether a comma separated
                        //list should be treated as a proper list, such
                        //as an array or if the list should be treated
                        //like a wild bunch of unordered mess
                        if (listtest[listtest.length - 1] === false) {
                            listtest[listtest.length - 1] = true;
                            (function jspretty__algorithm_separator_listTest() {
                                var c = 0,
                                    d = 0,
                                    assign = false,
                                    compare = false,
                                    semicolon = false,
                                    colon = false;
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
                                        //a special test for the return
                                        //keyword, because anything
                                        //following a return is easier
                                        //to read on a single line
                                        if (semicolon === false && token[c] === "return") {
                                            list[list.length - 1] = true;
                                            return;
                                        }
                                        if (token[c] === ":") {
                                            colon = true;
                                        }
                                        if (token[c] === "?") {
                                            colon = false;
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
                                            if (colon === true) {
                                                if (token[c + 1] === "var" || token[c + 1] === "let" || token[c + 1] === "const") {
                                                    level[c] = indent - 1;
                                                } else {
                                                    level[c] = indent;
                                                }
                                            }
                                            if (colon === false && token[c - 1] !== ")" && token[c] !== "x{" && types[c - 1] !== "word") {
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
                        if (methodbreak[methodbreak.length - 1] === true) {
                            indent -= 1;
                            methodbreak[methodbreak.length - 1] = false;
                            methtest = true;
                            if (starttype[starttype.length - 1] === "array") {
                                arrbreak[arrbreak.length - 1] = true;
                            }
                        }
                        if ((obj[obj.length - 1] === true && destruct[destruct.length - 1] === false) || (token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'"))) {
                            level.push(indent);
                            return;
                        }
                        if (list[list.length - 1] === true) {
                            if (assignlist[assignlist.length - 1] === true && varline[varline.length - 1] === false) {
                                assignlist[assignlist.length - 1] = false;
                                varlen = [];
                            }
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
                                            if (obj[obj.length - 1] === true || destruct[destruct.length - 1] === false || arrbreak[arrbreak.length - 1] === true) {
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
                        if (varline[varline.length - 1] === true && fortest === 0) {
                            if (ltoke !== "]") {
                                (function jspretty__algorithm_separator_varline() {
                                    var c = 0,
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
                            if (ltype === "literal" && token[a - 2] === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                level[a] = indent;
                                return;
                            }
                            return level.push(indent);
                        }
                        if (destruct[destruct.length - 1] === true && obj[obj.length - 1] === false) {
                            return level.push("s");
                        }
                        return level.push(indent);
                    }
                    if (ctoke === ";" || ctoke === "x;") {
                        if (ctoke === "x;") {
                            scolon += 1;
                        }
                        if (methodbreak[methodbreak.length - 1] === true) {
                            indent -= 1;
                            methodbreak[methodbreak.length - 1] = false;
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
                method = function jspretty__algorithm_method() {
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
                    starttype.push("method");
                    methodbreak.push(false);
                    obj.push(false);
                    assignlist.push(false);
                    arrbreak.push(false);
                    destruct.push(false);
                    if (fortest > 0) {
                        fortest += 1;
                    }
                },
                start = function jspretty__algorithm_start() {
                    var functest = function jspretty__algorithm_start_functest() {
                        var aa = 0,
                            bb = 0;
                        for (aa = a - 1; aa > -1; aa -= 1) {
                            if (types[aa] === "end") {
                                bb += 1;
                            } else if (types[aa] === "start" || types[aa] === "method") {
                                bb -= 1;
                                if (bb === 0) {
                                    if (token[aa - 1] === "function" || token[aa - 2] === "function") {
                                        return true;
                                    }
                                }
                                if (bb < 0) {
                                    return false;
                                }
                            }
                        }
                        return false;
                    };
                    list.push(false);
                    listtest.push(false);
                    methodtest.push(false);
                    methodbreak.push(false);
                    assignlist.push(false);
                    arrbreak.push(false);
                    if (ctoke === "{" && ltoke === ")" && destruct[destruct.length - 1] === true) {
                        destructfix();
                    }
                    if (ctoke !== "[" && destruct.length > 0) {
                        destruct[destruct.length - 1] = false;
                    }
                    if ((ltoke === "(" && types[a - 2] === "word" && token[a - 2] !== "if" && token[a - 2] !== "for" && token[a - 2] !== "catch" && token[a - 2] !== "while" && token[a - 2] !== "return" && token[a - 2] !== "typeof" && token[a - 3] !== "function") || (ctoke !== "(" && ltype === "word" && ltoke !== "else" && ltoke !== "do" && ltoke !== "try" && ltoke !== "catch" && ltoke !== "finally")) {
                        destruct.push(true);
                    } else {
                        destruct.push(false);
                    }
                    if (ltoke === "for") {
                        fortest = 1;
                    }
                    if (ctoke === "{" || ctoke === "x{") {
                        indent += 1;
                        if (ltype === "operator" || ltype === "start") {
                            starttype.push("obj");
                        } else if (functest() === true) {
                            starttype.push("function");
                        } else {
                            starttype.push("curly");
                        }
                        casetest.push(false);
                        varlen.push([]);
                        if (ctoke === "{") {
                            varline.push(false);
                        }
                        if (ltoke === "=" || ltoke === ";" || ltoke === "x;" || ltoke === "," || ltoke === ":" || ltoke === "?" || ltoke === "(" || ltoke === "return" || ltoke === "in" || ltype === "start" || ltype === "method") {
                            obj.push(true);
                        } else {
                            obj.push(false);
                        }
                        if (jbraces === true && ltype !== "operator" && ltoke !== "return") {
                            level[a - 1] = indent - 1;
                        } else if (ltoke === ")" || ltoke === ",") {
                            level[a - 1] = "s";
                        } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                            level[a - 1] = indent - 1;
                        }
                        if (destruct[destruct.length - 1] === true) {
                            return level.push("x");
                        }
                        return level.push(indent);
                    }
                    obj.push(false);
                    if (ctoke === "(") {
                        starttype.push("paren");
                        if (ltoke === "-" && token[a - 2] === "(") {
                            level[a - 2] = "x";
                        }
                        if (ltoke === "function" || ltoke === "switch" || ltoke === "for" || ltoke === "while") {
                            methodtest[methodtest.length - 1] = true;
                        }
                        //the start of scope, at least for counting, is
                        //pushed back from the opening of the block to
                        //the paranthesis containing arguments so that
                        //the arguments can be tagged as variables of
                        //the coming scope
                        if (jsscope !== "none" || jmode === "minify") {
                            //a 0 is pushed into the start of scope, but
                            //this number is updated in the "end"
                            //function to indicate the index where the
                            //scope ends
                            if (ltoke === "function" || token[a - 2] === "function") {
                                meta[meta.length - 1] = 0;
                            }
                        }
                        if (fortest > 0 && ltoke !== "for") {
                            fortest += 1;
                        }
                        if (ltoke === "}" || ltoke === ")") {
                            if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && starttype[starttype.length - 1] === "function") {
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
                        indent += 1;
                        starttype.push("array");
                        if (ltoke === "[") {
                            list[list.length - 2] = true;
                        }
                        if (ltoke === "return" || ltoke === "var" || ltoke === "let" || ltoke === "const") {
                            level[a - 1] = "s";
                        } else if (ltoke === "]" || ltype === "word" || ltoke === ")") {
                            level[a - 1] = "x";
                        } else if (ltoke === "[" || ltoke === "{" || ltoke === "x{") {
                            level[a - 1] = indent - 1;
                        }
                        if (methodtest[methodtest.length - 2] === true || destruct[destruct.length - 1] === true) {
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
                    return level.push("x");
                },
                end = function jspretty__algorithm_end() {
                    if (ternary.length > 0 && token[a + 1] !== "?" && token[a + 1] !== ":") {
                        tern();
                    }
                    if (fortest === 1 && ctoke === ")" && varline[varline.length - 1] === true) {
                        varline[varline.length - 1] = false;
                    }
                    if (methodbreak[methodbreak.length - 1] === true) {
                        indent -= 1;
                    }
                    if (ctoke !== ")" && (ltype !== "markup" || (ltype === "markup" && token[a - 2] !== "return"))) {
                        indent -= 1;
                    } else if (fortest > 0 && ctoke === ")") {
                        fortest -= 1;
                    }
                    if (ctoke === "}" || ctoke === "x}") {
                        if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || token[a - 2] !== "x;" || ltoke === "break" || ltoke === "return")) {
                            (function jspretty__algorithm_end_curlyBrace() {
                                var c = 0,
                                    d = 1,
                                    assign = false,
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
                                            indent -= 1;
                                            level[a - 1] = indent;
                                            return;
                                        }
                                        if ((token[c] === ":" && ternary.length === 0) || (token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                            return;
                                        }
                                        if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var" || token[c] === "let" || token[c] === "const" || token[c] === "with") {
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
                        //this is the bulk of logic identifying scope
                        //start and end
                        if (jsscope !== "none" || jmode === "minify") {
                            (function jspretty__algorithm_end_jsscope() {
                                var c = 0,
                                    d = 1,
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
                                            meta[c] = a - 1;
                                            if (token[c] === "let" || token[c] === "const") {
                                                meta[meta.length - 2] = [
                                                    build, true
                                                ];
                                            }
                                            build = [];
                                            lettest = -1;
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
                    if (ctoke === "]" && (methodbreak[methodbreak.length - 1] === true || arrbreak[arrbreak.length - 1] === true)) {
                        level[a - 1] = indent;
                        level.push("x");
                    } else if (destruct[destruct.length - 1] === true) {
                        level[a - 1] = "x";
                        level.push("x");
                    } else if ((types[a - 1] === "comment" && token[a - 1].substr(0, 2) === "//") || types[a - 1] === "comment-inline") {
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
                        if (jbracepadding === true && ltype !== "end" && ltype !== "start" && ltype !== "method") {
                            level[a - 1] = "s";
                        } else {
                            level[a - 1] = "x";
                        }
                        level.push("s");
                    } else if ((ctoke === "}" || ctoke === "x}") && obj[obj.length - 1] === false && ltype === "word" && list[list.length - 1] === false && casetest[casetest.length - 1] === false) {
                        indent += 1;
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
                    methodbreak.pop();
                    arrbreak.pop();
                    starttype.pop();
                    destruct.pop();
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
                operator = function jspretty__algorithm_operator() {
                    if (methodbreak[methodbreak.length - 1] === true) {
                        indent -= 1;
                        methodbreak[methodbreak.length - 1] = false;
                        if (starttype[starttype.length - 1] === "array") {
                            arrbreak[arrbreak.length - 1] = true;
                        }
                    }
                    if (destruct[destruct.length - 1] === true) {
                        destructfix();
                    }
                    if (destruct.length > 0) {
                        destruct[destruct.length - 1] = false;
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
                        if (fortest === 0) {
                            level[a - 1] = indent;
                        }
                        return level.push("x");
                    }
                    if (ctoke === "?") {
                        ternary.push(a);
                        indent += 1;
                        level[a - 1] = indent;
                    }
                    if (ctoke === ":") {
                        if (methodbreak[methodbreak.length - 1] === true) {
                            indent -= 1;
                            methodbreak[methodbreak.length - 1] = false;
                        }
                        if (obj[obj.length - 1] === true) {
                            if (ternary.length > 0) {
                                (function jspretty__algorithm_operator_ternObj() {
                                    var c = 0,
                                        d = 0,
                                        e = ternary[ternary.length - 1];
                                    for (c = a - 1; c > e; c -= 1) {
                                        if (types[c] === "end") {
                                            d += 1;
                                        } else if (types[c] === "start" || types[c] === "method") {
                                            d -= 1;
                                        }
                                        if (d < 0) {
                                            return;
                                        }
                                    }
                                    if (d === 0) {
                                        level[a - 1] = indent;
                                    } else if (obj[obj.length - 1] === true) {
                                        level[a - 1] = "x";
                                    }
                                }());
                            } else {
                                level[a - 1] = "x";
                            }
                        } else if (ternary.length > 0) {
                            level[a - 1] = indent;
                        } else {
                            level[a - 1] = "s";
                        }
                        //ternary verification test, because from syntax
                        //alone a ternary statement could be challenging
                        //to identify when moving backwards through the
                        //tokens.  This is especially true if one of the
                        //values is function or object
                        return (function jspretty__algorithm_operator_colon() {
                            var c = 0,
                                d = 0,
                                listin = (varlen.length > 0)
                                    ? varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1
                                    : 0,
                                listop = token[listin],
                                assign = (listop !== undefined && listop.indexOf("=") < 0);
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
                                if (ternary.length === 0) {
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
                                    if (d === 1 && token[c] === "{" && ternary.length === 0) {
                                        obj[obj.length - 1] = true;
                                        if (types[c + 1] !== "comment") {
                                            level[c + 1] = "x";
                                            if (varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] !== c + 1) {
                                                varlen[varlen.length - 1].push(c + 1);
                                            }
                                        }
                                    }
                                    break;
                                }
                                if (d === 0) {
                                    if (ternary.length === 0 && (token[c] === "case" || token[c] === "default")) {
                                        if (token[a + 1] !== "case") {
                                            indent += 1;
                                        }
                                        return level.push(indent);
                                    }
                                    if (token[c] === "," && ternary.length === 0) {
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
                    if (ctoke === "+") {
                        if (ltoke.length < jwrap + 3 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && (token[a + 1].charAt(0) === "\"" || token[a + 1].charAt(0) === "'")) {
                            if (list[list.length - 1] === true || obj[obj.length - 1] === true || methodtest[methodtest.length - 1] === true || ((token[a - 1].charAt(0) === "\"" || token[a - 1].charAt(0) === "'") && (token[a - 2] === "+" || token[a - 2].indexOf("=") > -1 || types[a - 2] === "start"))) {
                                return level.push(indent + 2);
                            }
                            return level.push(indent + 1);
                        }
                        if ((ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && token[a + 1] !== undefined && (token[a + 1].charAt(0) === "\"" || token[a + 1].charAt(0) === "'") && (token[a - 2] === "=" || token[a - 2] === "(" || (token[a - 2] === "+" && level[a - 2] > 0))) {
                            if (ltoke.length + 3 + token[a + 1].length < jwrap) {
                                level.push("s");
                            } else if (varline[varline.length - 1] === true) {
                                level.push(indent);
                            } else {
                                level.push(indent + 1);
                            }
                            return;
                        }
                    }
                    if (ctoke !== "?" || ternary.length === 0) {
                        level[a - 1] = "s";
                    }
                    if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && varlen.length > 0 && (methodtest.length === 0 || methodtest[methodtest.length - 1] === false) && (obj.length === 0 || obj[obj.length - 1] === false)) {
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
                                        if (types[c] === "operator" || token[c] === ";" || token[c] === "x;" || token[c] === "var" || token[c] === "let" || token[c] === "const") {
                                            if (f !== undefined && f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<=") {
                                                if (assignlist[assignlist.length - 1] === false) {
                                                    varlen.push([a - 1]);
                                                    assignlist[assignlist.length - 1] = true;
                                                }
                                            }
                                            if ((f === ";" || f === "x;" || f === "var" || f === "let" || f === "const") && assignlist[assignlist.length - 1] === true) {
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
                word = function jspretty__algorithm_word() {
                    var next = token[a + 1],
                        compare = (next !== undefined && next !== "==" && next !== "===" && next !== "!=" && next !== "!==" && next === ">=" && next !== "<=" && next.indexOf("=") > -1);
                    if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var" || ltoke === "let" || ltoke === "const")) {
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
                    if (varline.length === 1 && varline[0] === true && (ltoke === "var" || ltoke === "let" || ltoke === "const" || ltoke === "," || (ltoke === "function" && types[a + 1] === "method"))) {
                        globals.push(ctoke);
                    }
                    if ((ctoke === "let" || ctoke === "const") && lettest < 0) {
                        lettest = a;
                    }
                    if (ctoke === "new") {
                        (function jspretty__algorithm_word_new() {
                            var c = 0,
                                nextish = (typeof next === "string")
                                    ? next
                                    : "",
                                apiword = (nextish === "")
                                    ? []
                                    : [
                                        "ActiveXObject", "ArrayBuffer", "AudioContext", "Canvas", "CustomAnimation", "DOMParser", "DataView", "Date", "Error", "EvalError", "FadeAnimation", "FileReader", "Flash", "Float32Array", "Float64Array", "FormField", "Frame", "Generator", "HotKey", "Image", "Iterator", "Intl", "Int16Array", "Int32Array", "Int8Array", "InternalError", "Loader", "Map", "MenuItem", "MoveAnimation", "Notification", "ParallelArray", "Point", "Promise", "Proxy", "RangeError", "Rectangle", "ReferenceError", "Reflect", "RegExp", "ResizeAnimation", "RotateAnimation", "Set", "SQLite", "ScrollBar", "Set", "Shadow", "StopIteration", "Symbol", "SyntaxError", "Text", "TextArea", "Timer", "TypeError", "URL", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray", "URIError", "WeakMap", "WeakSet", "Web", "Window", "XMLHttpRequest"
                                    ],
                                apilen = apiword.length;
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
                    if (ctoke === "from" && ltoke === "}") {
                        level[a - 1] = "s";
                    }
                    if (ctoke === "this" && jsscope !== "none") {
                        token[a] = "<strong class='new'>this</strong>";
                    }
                    if (ctoke === "function" && jspace === false && a < b - 1 && token[a + 1] === "(") {
                        return level.push("x");
                    }
                    //comma operators following a return should be
                    //treated as a list, so reevaluate the list criteria
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
                    } else if (ctoke === "in" || (((ctoke === "else" && jelseline === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                        level[a - 1] = "s";
                    } else if (ctoke === "var" || ctoke === "let" || ctoke === "const") {
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
                    } else if ((ctoke === "default" || ctoke === "case") && ltype !== "word") {
                        if (casetest[casetest.length - 1] === false) {
                            if (ltoke === "{" || ltoke === "x{") {
                                indent -= 1;
                            }
                            level[a - 1] = indent;
                            casetest[casetest.length - 1] = true;
                        } else if ((ltoke === ":" && (ctoke === "default" || types[a - 1] === "comment-inline" || types[a - 1] === "comment")) || ltoke !== ":") {
                            indent -= 1;
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
                                    indent -= 1;
                                    casetest[casetest.length - 1] = false;
                                    return;
                                }
                            }
                        }());
                    } else if (ctoke === "catch" && ltoke === ".") {
                        level[a - 1] = "x";
                        return level.push("x");
                    }
                    if (ctoke === "catch" || ctoke === "finally") {
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
                    if (a < b - 1 && (token[a + 1] === "{" || token[a + 1] === "x{")) {
                        token[a] = token[a + 1];
                        types[a] = "start";
                        token[a + 1] = ctoke;
                        types[a + 1] = ctype;
                        a -= 1;
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
                    if (ltoke === "return" || ltoke === "?" || ltoke === ":") {
                        level[a - 1] = "s";
                        level.push("x");
                    } else if (ltype === "start" || (token[a - 2] === "return" && ltype === "method")) {
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
            var a = 0,
                linelen = 0,
                length = token.length,
                comtest = (jtopcoms === false),
                build = [],
                output = [],
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
            for (a = 0; a < length; a += 1) {
                if (types[a] !== "comment") {
                    comtest = true;
                }
                if (types[a - 1] === "operator" && types[a] === "operator" && token[a] !== "!") {
                    build.push(" ");
                }
                if (types[a] === "markup" && typeof global.markuppretty === "function") {
                    build.push(global.markuppretty({
                        jsx: true,
                        mode: "minify",
                        source: token[a]
                    }));
                } else if (types[a] === "word" && (types[a + 1] === "word" || types[a + 1] === "literal" || token[a + 1] === "x{" || types[a + 1] === "comment" || types[a + 1] === "comment-inline")) {
                    if (types[a - 1] === "literal" && token[a - 1].charAt(0) !== "\"" && token[a - 1].charAt(0) !== "'") {
                        build.push(" ");
                    }
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
                if (jwrap > 0) {
                    if (types[a] !== "comment" && types[a] !== "comment-inline") {
                        linelen += token[a].length;
                    }
                    if ((types[a] === "operator" || types[a] === "separator" || types[a] === "start") && a < length - 1 && linelen + token[a + 1].length > jwrap) {
                        build.push("\n");
                        linelen = 0;
                    }
                }
            }
            if (error.length > 0) {
                output.push("<p id='jserror'><strong>Error: ");
                output.push(error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, ""));
                output.push("</strong> <code><span>");
                error[1] = error[1].replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                    .replace(/^(\s+)/, "");
                if (error.indexOf("\n") > 0) {
                    output.push(error[1].replace("\n", "</span>"));
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
        if (jsscope !== "none") {
            result = (function jspretty__resultScope() {
                var a = 0,
                    b = token.length,
                    build = [],
                    linecount = 2,
                    last = "",
                    scope = 1,
                    buildlen = 0,
                    commentfix = (function jspretty__resultScope_commentfix() {
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
                    folderItem = [],
                    comfold = -1,
                    //if current folding is for comment
                    data = [
                        "<div class='beautify' data-prettydiff-ignore='true'><ol class='count'>", "<li>", 1, "</li>"
                    ],
                    //defines the character(s) and character length of a
                    //single indentation
                    tab = (function jspretty__resultScope_tab() {
                        var aa = jchar,
                            bb = jsize,
                            cc = [];
                        for (bb = bb; bb > 0; bb -= 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    //applies folding to comments and functions
                    //
                    //Folder uses the i variable to determine how far
                    //back into the data array to look.  i must be
                    //multiplied by 3 because each line number is three
                    //indexes in the data array: <li>, line #, </li>.
                    //
                    //i is incremented for:
                    //* block comments following one or more line
                    //  comments that follow one or more block comments
                    //* if last comment in a series is a block comment
                    //  and not the first token
                    //* block comments with a new line that are either
                    //  the first token or not followed by another block
                    //* if a block comment is followed by another block
                    //  comment
                    //
                    //i is decremented for:
                    //* line comment following a block comment
                    //* block comment if "i" is greater than 1 and
                    //  inside a function fold
                    //* if a line comment is not preceeded by another
                    //  comment and is followed by a block comment
                    //
                    //If closing a fold and token is a comment and not
                    //token 0 then decrement by commentfix.
                    folder = function jspretty__resultScope_folder() {
                        var datalen = (data.length - (commentfix * 3) > 0)
                                ? data.length - (commentfix * 3)
                                : 1,
                            index = a,
                            start = data[datalen + 1] || 1,
                            assign = true,
                            kk = index;
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
                        if (types[a] === "comment" && lines[a] === 2) {
                            datalen -= 3;
                            start -= 1;
                        }
                        data[datalen] = "<li class='fold' title='folds from line " + start + " to line xxx'>";
                        data[datalen + 1] = "- " + start;
                        folderItem.push([datalen, index, assign]);
                    },
                    //determines where folding ends
                    //function assignments require one more line for
                    //closing than everything else
                    foldclose = function jspretty__resultScope_foldclose() {
                        var end = (function jspretty__resultScope_foldclose_end() {
                                if (comfold > -1 || folderItem[folderItem.length - 1][2] === true) {
                                    return linecount - commentfix - 1;
                                }
                                return linecount - commentfix;
                            }()),
                            semi = (/(>;<\/em>)$/).test(token[a]),
                            gg = 0,
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
                                    data[gg] = Number(data[gg].substr(1));
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
                    //splits block comments, which are single tokens,
                    //into multiple lines of output
                    blockline = function jspretty__resultScope_blockline(x) {
                        var commentLines = x.split("\n"),
                            hh = 0,
                            ii = commentLines.length - 1;
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
                            linecount += 1;
                            commentLines[hh] = commentLines[hh] + "<em>&#xA;</em></li><li class='c0'>";
                        }
                        return commentLines.join("")
                            .replace(/\r/g, "");
                    },
                    //finds the variables if the jsscope option is true
                    findvars = function jspretty__resultScope_findvars(x) {
                        var metax = meta[x],
                            metameta = meta[metax][0],
                            lettest = meta[metax][1],
                            ee = 0,
                            ff = 0,
                            hh = metameta.length,
                            adjustment = 1,
                            functionBlock = true,
                            varbuild = [],
                            varbuildlen = 0,
                            letcomma = function jspretty__resultScope_findvars_letcomma() {
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
                                        if (token[aa] === "let" || token[aa] === "const") {
                                            token[ee] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                                        }
                                    }
                                }
                            };
                        if (types[a - 1] === "word" && token[a - 1] !== "function" && lettest === false) {
                            varbuild = token[a - 1].split(" ");
                            token[a - 1] = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
                            varbuildlen = varbuild.length;
                            if (varbuildlen > 1) {
                                do {
                                    token[ee] = token[ee] + " ";
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
                                                token[ee] = "<em class='s" + (scope + 1) + "'>" + varbuild[0] + "</em>";
                                                varbuildlen = varbuild.length;
                                                if (varbuildlen > 1) {
                                                    do {
                                                        token[ee] = token[ee] + " ";
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
                                                        token[ee] = token[ee] + " ";
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
                                        token[ee] = "<em class='s" + scope + "'>{</em>";
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
                    indent = jlevel,
                    //some prebuilt color coded tabs
                    lscope = [
                        "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                    ],
                    //a function for calculating indentation after each new
                    //line
                    nl = function jspretty__resultScope_nl(x, linetest) {
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
                    rl = function jspretty__resultScope_rl(x) {
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
                        var mindent = (function jspretty__resultScope_markupBuild_offset() {
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
                            markup = (function jspretty__resultScope_markupBuild_varscope() {
                                var item = global.markuppretty({
                                        inchar: jchar,
                                        inlevel: mindent,
                                        insize: jsize,
                                        jsscope: true,
                                        jsx: true,
                                        methodchain: jmethodchain,
                                        mode: "beautify",
                                        source: token[a]
                                    })
                                        .replace(/return\s+</g, "return <"),
                                    emscope = function jsscope__resultScope_markupBuild_varscope_emscope(x) {
                                        return "<em class='s" + x.replace("[pdjsxem", "")
                                            .replace("]", "") + "'>";
                                    },
                                    word = "",
                                    newword = "",
                                    inca = 0,
                                    incb = 0,
                                    lena = meta.length,
                                    lenb = 0,
                                    vars = [];
                                if (item.indexOf("[pdjsxscope]") < 0) {
                                    return item.replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .split("\n");
                                }
                                do {
                                    newword = "";
                                    vars = [];
                                    word = item.substring(item.indexOf("[pdjsxscope]") + 12, item.indexOf("[/pdjsxscope]"));
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
                                return item.replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    .replace(/\[pdjsxem\d+\]/g, emscope)
                                    .replace(/\[\/pdjsxem\]/g, "</em>")
                                    .split("\n");
                            }()),
                            len = 0,
                            c = 0,
                            spaces = 0,
                            synthtab = "\\" + tab.charAt(0),
                            tabreg = {};
                        len = tab.length;
                        for (c = 1; c < len; c += 1) {
                            synthtab = synthtab + "\\" + tab.charAt(c);
                        }
                        tabreg = new RegExp("^(" + synthtab + "+)");
                        mindent = indent + 2;
                        if (level[a] === "x" || level[a] === "s") {
                            markup[0] = markup[0].replace(tabreg, "");
                            mindent -= 1;
                        }
                        len = markup.length;
                        for (c = 0; c < len - 1; c += 1) {
                            if (markup[c].indexOf(tab) !== 0 && c > 0) {
                                spaces = markup[c - 1].split(tab)
                                    .length - 1;
                                do {
                                    spaces -= 1;
                                    markup[c] = tab + markup[c];
                                } while (spaces > 0);
                            }
                            build.push(markup[c]);
                            nl(mindent - 1);
                        }
                        build.push(markup[markup.length - 1]);
                    },
                    multiline = function jspretty__resultScope_multiline(x) {
                        var temparray = x.split("\n"),
                            c = 0,
                            d = temparray.length;
                        build.push(temparray[0]);
                        for (c = 1; c < d; c += 1) {
                            nl(indent);
                            build.push(temparray[c]);
                        }
                    };
                if (jvertical === true) {
                    (function jspretty__resultScope_varSpaces() {
                        var aa = 0,
                            lastListLen = 0,
                            cc = 0,
                            dd = 0,
                            longest = 0,
                            longTest = 0,
                            strlongest = 0,
                            strspace = "",
                            tokenInList = "",
                            longList = [],
                            joins = function jspretty__resultScope_varSpaces_joins(x) {
                                var xlen = token[x].length,
                                    mixTest = false,
                                    perTest = false,
                                    period = function jspretty__resultScope_varSpaces_joins_periodInit() {
                                        return;
                                    },
                                    ending = function jspretty__resultScope_varSpaces_joins_endingInit() {
                                        return;
                                    };
                                period = function jspretty__resultScope_varSpaces_joins_period() {
                                    perTest = true;
                                    xlen += 1;
                                    do {
                                        x -= 2;
                                        xlen += token[x].length + 1;
                                    } while (x > 1 && token[x - 1] === "." && level[x - 2] === "x");
                                    if (token[x - 1] === "." && level[x - 2] !== "x") {
                                        xlen += (jchar.length * jsize) + 2;
                                        return;
                                    }
                                    if (token[x] === ")" || token[x] === "]") {
                                        x += 1;
                                        xlen -= 2;
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
                                        x -= 1;
                                        xlen += token[x].length;
                                    }
                                    if (types[x] === "word" && token[x - 1] === ".") {
                                        if (level[x - 2] === "x") {
                                            period();
                                        } else {
                                            xlen += (jchar.length * jsize) + 2;
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
                                        xlen += (jchar.length * jsize) + 2;
                                        return;
                                    }
                                } else if (token[x] === ")" || token[x] === "]") {
                                    ending();
                                    if (perTest === false) {
                                        xlen += 1;
                                    }
                                } else {
                                    xlen += 1;
                                }
                                if (token[x - 1] === "," && token[varlist[aa][cc] + 1] !== ":" && token[varlist[aa][0] - 1] !== "var" && token[varlist[aa][0] - 1] !== "let" && token[varlist[aa][0] - 1] !== "const") {
                                    xlen += jsize;
                                }
                                return xlen;
                            };
                        for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                            if (varlist[aa] !== undefined) {
                                lastListLen = varlist[aa].length;
                                longest = 0;
                                longList = [];
                                for (cc = 0; cc < lastListLen; cc += 1) {
                                    longTest = joins(varlist[aa][cc]);
                                    if (longTest > longest) {
                                        longest = longTest;
                                    }
                                    longList.push(longTest);
                                }
                                strspace = "";
                                if (longest > jsize) {
                                    strlongest = longest - jsize;
                                } else if (longest < jsize) {
                                    strlongest = jsize - longest;
                                }
                                if (token[varlist[aa][0] - 1] === "var") {
                                    strlongest = strlongest - jsize;
                                } else if (token[varlist[aa][0] + 1] === "=") {
                                    strlongest += 1;
                                }
                                if (longest !== jsize && strlongest > 0) {
                                    do {
                                        strspace += " ";
                                        strlongest -= 1;
                                    } while (strlongest > -1);
                                }
                                for (cc = 0; cc < lastListLen; cc += 1) {
                                    tokenInList = token[varlist[aa][cc]];
                                    if (longList[cc] < longest) {
                                        do {
                                            tokenInList += " ";
                                            longList[cc] += 1;
                                        } while (longList[cc] < longest);
                                    }
                                    token[varlist[aa][cc]] = tokenInList;
                                    if (token[varlist[aa][cc] + 2] !== undefined && token[varlist[aa][cc] + 2].length === jwrap + 2 && token[varlist[aa][cc] + 3] === "+" && token[varlist[aa][cc] + 4] !== undefined && (token[varlist[aa][cc] + 4].charAt(0) === "\"" || token[varlist[aa][cc] + 4].charAt(0) === "'")) {
                                        dd = varlist[aa][cc] + 4;
                                        do {
                                            token[dd] = strspace + token[dd];
                                            dd += 2;
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
                //its important to find the variables separately from
                //building the output so that recursive flows in the loop
                //incrementation do not present simple counting collisions
                //as to what gets modified versus what gets included
                for (a = b - 1; a > -1; a -= 1) {
                    if (typeof meta[a] === "number") {
                        scope -= 1;
                        findvars(a);
                    } else if (meta[a] !== undefined && typeof meta[a] !== "string" && typeof meta[a] !== "number" && a > 0 && token[a] !== "x;" && token[a] !== "x}" && token[a] !== "x{") {
                        token[a] = "<em class='s" + scope + "'>" + token[a] + "</em>";
                        scope += 1;
                        if (scope > 16) {
                            scope = 16;
                        }
                    }
                }
                (function jspretty__resultScope_globals() {
                    var aa = 0,
                        bb = token.length,
                        globalLocal = globals,
                        dd = globalLocal.length,
                        ee = 0,
                        word = [],
                        wordlen = 0;
                    for (aa = bb - 1; aa > 0; aa -= 1) {
                        if (types[aa] === "word" && (token[aa + 1] !== ":" || (token[aa + 1] === ":" && level[aa + 1] === "x")) && token[aa].indexOf("<em ") < 0) {
                            word = token[aa].split(" ");
                            for (ee = dd - 1; ee > -1; ee -= 1) {
                                if (word[0] === globalLocal[ee] && token[aa - 1] !== ".") {
                                    if (token[aa - 1] === "function" && types[aa + 1] === "method") {
                                        token[aa] = "<em class='s1'>" + word[0] + "</em>";
                                        wordlen = word.length;
                                        if (wordlen > 1) {
                                            do {
                                                token[aa] = token[aa] + " ";
                                                wordlen -= 1;
                                            } while (wordlen > 1);
                                        }
                                    } else {
                                        token[aa] = "<em class='s0'>" + word[0] + "</em>";
                                        wordlen = word.length;
                                        if (wordlen > 1) {
                                            do {
                                                token[aa] = token[aa] + " ";
                                                wordlen -= 1;
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
                //this loops combines the white space as determined from the
                //algorithm with the tokens to create the output
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
                        } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                            build.push(token[a]);
                            scope -= 1;
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
                                    build.push(token[a].replace(/\n(\s*)/g, " "));
                                }
                            } else if (types[a] === "comment") {
                                if (a === 0) {
                                    build[0] = "<ol class='data'><li class='c0'>";
                                } else {
                                    buildlen = build.length - 1;
                                    if (build[buildlen].indexOf("<li") < 0) {
                                        do {
                                            build[buildlen] = build[buildlen].replace(/<em\ class\='[a-z]\d+'>/g, "")
                                                .replace(/<\/em>/g, "");
                                            buildlen -= 1;
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
                    //this condition performs additional calculations if
                    //jpres === true.  jpres determines whether empty lines
                    //should be preserved from the code input
                    if (jpres === true && lines[a] > 0 && level[a] !== "x" && level[a] !== "s" && token[a] !== "+") {
                        //special treatment for math operators
                        if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                            //comments get special treatment
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
                                a += 1;
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
                    if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && ((/<em\ class='s\d+'>\}<\/em>/).test(token[a + 2]) === true || token[a + 2] === "x}")) {
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
                //this logic is necessary to some line counting corrections
                //to the HTML output
                last = build[build.length - 1];
                if (last.indexOf("<li") > 0) {
                    build[build.length - 1] = "<em>&#xA;</em></li>";
                } else if (last.indexOf("</li>") < 0) {
                    build.push("<em>&#xA;</em></li>");
                }
                build.push("</ol></div>");
                last = build.join("");
                if (last.match(/<li/g) !== null) {
                    scope = last.match(/<li/g)
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
                if (jsscope === "html") {
                    data.push(last);
                    return data.join("");
                }
                build = [
                    "<p>Scope analysis does not provide support for undeclared variables.</p>", "<p><em>", scolon, "</em> instances of <strong>missing semicolons</strong> counted.</p>", "<p><em>", news, "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>", data.join(""), last
                ];
                global.report = build.join("");
                data = [];
                build = [];
                return "";
            }()).replace(/(\s+)$/, "")
                .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "");
        } else {
            result = (function jspretty__result() {
                var a = 0,
                    b = token.length,
                    build = [],
                    indent = jlevel,
                    //defines the character(s) and character length of a
                    //single indentation
                    tab = (function jspretty__result_tab() {
                        var aa = jchar,
                            bb = jsize,
                            cc = [];
                        for (bb = bb; bb > 0; bb -= 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    //a function for calculating indentation after each new
                    //line
                    nl = function jspretty__result_nl(x) {
                        var dd = 0;
                        build.push("\n");
                        for (dd = 0; dd < x; dd += 1) {
                            build.push(tab);
                        }
                    },
                    rl = function jspretty__result_rl(x) {
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
                    };
                if (jvertical === true) {
                    (function jspretty__result_varSpaces() {
                        var aa = 0,
                            varListLen = 0,
                            cc = 0,
                            dd = 0,
                            longest = 0,
                            longTest = 0,
                            strlongest = 0,
                            strspace = "",
                            tokenInList = "",
                            longList = [],
                            joins = function jspretty__result_varSpaces_joins(x) {
                                var xlen = token[x].length,
                                    mixTest = false,
                                    perTest = false,
                                    period = function jspretty__result_varSpaces_joins_periodInit() {
                                        return;
                                    },
                                    ending = function jspretty__result_varSpaces_joins_endingInit() {
                                        return;
                                    };
                                period = function jspretty__result_varSpaces_joins_period() {
                                    perTest = true;
                                    xlen += 1;
                                    do {
                                        x -= 2;
                                        xlen += token[x].length + 1;
                                    } while (x > 1 && token[x - 1] === "." && level[x - 2] === "x");
                                    if (token[x - 1] === "." && level[x - 2] !== "x") {
                                        xlen += (jchar.length * jsize) + 2;
                                        return;
                                    }
                                    if (token[x] === ")" || token[x] === "]") {
                                        x += 1;
                                        xlen -= 2;
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
                                        x -= 1;
                                        xlen += token[x].length;
                                    }
                                    if (types[x] === "word" && token[x - 1] === ".") {
                                        if (level[x - 2] === "x") {
                                            period();
                                        } else {
                                            xlen += (jchar.length * jsize) + 2;
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
                                        xlen += (jchar.length * jsize) + 2;
                                        return;
                                    }
                                } else if (token[x] === ")" || token[x] === "]") {
                                    ending();
                                    if (perTest === false) {
                                        xlen += 1;
                                    }
                                } else {
                                    xlen += 1;
                                }
                                if (token[x - 1] === "," && token[varlist[aa][0] - 1] !== "[" && token[varlist[aa][cc] + 1] !== ":" && token[varlist[aa][0] - 1] !== "var" && token[varlist[aa][0] - 1] !== "let" && token[varlist[aa][0] - 1] !== "const") {
                                    xlen += jsize;
                                }
                                return xlen;
                            };
                        for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                            if (varlist[aa] !== undefined) {
                                varListLen = varlist[aa].length;
                                longest = 0;
                                longList = [];
                                for (cc = 0; cc < varListLen; cc += 1) {
                                    longTest = joins(varlist[aa][cc]);
                                    if (longTest > longest) {
                                        longest = longTest;
                                    }
                                    longList.push(longTest);
                                }
                                strspace = "";
                                if (longest > jsize) {
                                    strlongest = longest - jsize;
                                } else if (longest < jsize) {
                                    strlongest = jsize - longest;
                                }
                                if (token[varlist[aa][0] - 1] === "var") {
                                    strlongest = strlongest - jsize;
                                } else if (token[varlist[aa][0] + 1] === "=") {
                                    strlongest += 1;
                                }
                                if (longest !== jsize && strlongest > 0) {
                                    do {
                                        strspace += " ";
                                        strlongest -= 1;
                                    } while (strlongest > -1);
                                }
                                for (cc = 0; cc < varListLen; cc += 1) {
                                    tokenInList = token[varlist[aa][cc]];
                                    if (longList[cc] < longest) {
                                        do {
                                            tokenInList += " ";
                                            longList[cc] += 1;
                                        } while (longList[cc] < longest);
                                    }
                                    token[varlist[aa][cc]] = tokenInList;
                                    if (token[varlist[aa][cc] + 2] !== undefined && token[varlist[aa][cc] + 2].length === jwrap + 2 && token[varlist[aa][cc] + 3] === "+" && token[varlist[aa][cc] + 4] !== undefined && (token[varlist[aa][cc] + 4].charAt(0) === "\"" || token[varlist[aa][cc] + 4].charAt(0) === "'")) {
                                        dd = varlist[aa][cc] + 4;
                                        do {
                                            token[dd] = strspace + token[dd];
                                            dd += 2;
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
                //this loops combines the white space as determined from the
                //algorithm with the tokens to create the output
                for (a = 0; a < b; a += 1) {
                    if (types[a] === "comment" || (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}")) {
                        if (types[a] === "markup") {
                            if (level[a - 1] !== "x" && level[a - 1] !== "s" && token[a - 1] !== "return") {
                                build.push(tab);
                            }
                            if (typeof global.markuppretty === "function") {
                                build.push(global.markuppretty({
                                    inchar: jchar,
                                    inlevel: (level[a] === "x")
                                        ? indent
                                        : indent + 1,
                                    insize: jsize,
                                    jsscope: args.jsscope,
                                    jsx: true,
                                    methodchain: jmethodchain,
                                    mode: "beautify",
                                    source: token[a]
                                }));
                            } else {
                                build.push(token[a].replace(/\n(\s*)/g, " "));
                            }
                        } else {
                            build.push(token[a]);
                        }
                        if (token[a].indexOf("//") === 0 && types[a + 1] === "operator") {
                            if (types[a] === "comment") {
                                nl(indent);
                            }
                            build.push(tab);
                        }
                    }
                    //this condition performs additional calculations if
                    //jpres === true.  jpres determines whether empty lines
                    //should be preserved from the code input
                    if (jpres === true && lines[a] > 0 && level[a] !== "x" && level[a] !== "s" && token[a] !== "+") {
                        //special treatment for math operators
                        if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                            //comments get special treatment
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
                                a += 1;
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
                        //adds a new line and no indentation
                    } else if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                        nl(jlevel);
                    } else if (level[a] === "s" && token[a] !== "x}") {
                        build.push(" ");
                        //adds a new line and indentation
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
                    return build.join("")
                        .replace(/(\s+)$/, "\n");
                }
                return build.join("")
                    .replace(/(\s+)$/, "");
            }());
        }
        //the analysis report is generated in this function
        if (global.report !== "diff" && jsscope !== "report") {
            stats.space.space -= 1;
            (function jspretty__report() {
                var originalSize = jsource.length - 1,
                    noOfLines = result.split("\n")
                        .length,
                    newlines = stats.space.newline,
                    percent = 0,
                    total = {
                        chars: 0,
                        comment: {
                            chars: stats.commentBlock.chars + stats.commentLine.chars,
                            token: stats.commentBlock.token + stats.commentLine.token
                        },
                        literal: {
                            chars: stats.number.chars + stats.regex.chars + stats.string.chars,
                            token: stats.number.token + stats.regex.token + stats.string.token
                        },
                        space: stats.space.newline + stats.space.other + stats.space.space + stats.space.tab,
                        syntax: {
                            chars: 0,
                            token: stats.string.quote + stats.comma + stats.semicolon + stats.container
                        },
                        token: 0
                    },
                    output = [],
                    zero = function jspretty__report_zero(x, y) {
                        var ratio = 0;
                        if (y === 0) {
                            return "0.00%";
                        }
                        ratio = ((x / y) * 100);
                        return ratio.toFixed(2) + "%";
                    };
                total.syntax.chars = total.syntax.token + stats.operator.chars;
                total.syntax.token += stats.operator.token;
                total.token = stats.server.token + stats.word.token + total.comment.token + total.literal.token + total.space + total.syntax.token;
                total.chars = stats.server.chars + stats.word.chars + total.comment.chars + total.literal.chars + total.space + total.syntax.chars;
                if (newlines === 0) {
                    newlines = 1;
                }
                output.push("<div class='doc'>");
                if (error.length > 0) {
                    output.push("<p id='jserror'><strong>Error: ");
                    output.push(error[0].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, ""));
                    output.push("</strong> <code><span>");
                    error[1] = error[1].replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008|\u000b|\u000c|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g, "")
                        .replace(/^(\s+)/, "");
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
        }
    }

    return result;
};
if (typeof require === "function" && typeof ace !== "object") {
    (function glib_jspretty() {
        "use strict";
        var localPath = (typeof process === "object" && process.cwd() === "/" && typeof __dirname === "string")
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
    exports.api = function commonjs(x) {
        "use strict";
        return jspretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.jsxstatus = global.jsxstatus;
        exports.api = function requirejs_export(x) {
            return jspretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
