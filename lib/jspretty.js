/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
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

 Arguments:

 * source - The code to process as a string.
 * insize - The size of a single indentation.  The type is number and
 the default is 4.
 * inchar - The string character(s) to make up an indentation.  The
 default is a single space.
 * preserve - Determines whether empty lines should be kept in the code
 for organizational reasons.  The type is boolean and the default
 value is true.
 * inlevel - Sets the starting point for indentation.  The type is
 number and the default value is 0.
 * space - Type is boolean.  If true a space will be applied between
 the function keyword and the first opening parenthesis.  The default
 is true.
 * braces - This accepts the string values "knr" or "allman".  The
 default is "knr".  The value "allman" will push curly braces that do
 not immediately follow an operator onto a newline.
 * comments - Determines whether comments should be indented with the
 rest of the code or flush to the left side.  Accepted values are
 "indent" (the default) and "noindent".
 -----------------------------------------------------------------------
 */
var summary = "",
    jspretty = function jspretty(args) {
        "use strict";
        var source = (typeof args.source === "string" && args.source.length > 0) ? args.source + " " : "Error: no source code supplied to jspretty!",
            jsize = (args.insize > 0) ? args.insize : ((Number(args.insize) > 0) ? Number(args.insize) : 4),
            jchar = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
            jpres = (args.preserve === false) ? false : true,
            jlevel = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
            jspace = (args.space === false) ? false : true,
            jbrace = (args.braces === "allman") ? true : false,
            jcomment = (args.comments === "noindent") ? "noindent" : (args.comments === "nocomment") ? "nocomment" : "indent",
            jsscope = (args.jsscope === true) ? true : false,
            jscorrect = (args.correct === true) ? true : false,
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
            meta = [], //lists a number at the opening paren of a
            //function that points to the token index of the function's
            //closing curly brace.  At the closing curly brace index
            //this array stores an array indicating the names of
            //variables declared in the current function for coloring by
            //function depth in jsscope.  This array is ignored if
            //jsscope is false
            varlist = [], //groups variables from a variable list into
            //a child array as well as properties of objects.  This
            //array for adding extra space so that the "=" following
            //declared variables of a variable list is vertically
            //aligned and likewise of the ":" with object properties
            news = 0, //counts uncessary use of 'new' keyword
            //variables j, k, l, m, n, o, p, q, and w are used as
            //various counters for the reporting only.  These variables
            //do not store any tokens and are not used in the algorithm
            //j counts line comments
            j = [
                0, 0
            ],
            //k counts block comments
            k = [
                0, 0
            ],
            //l counts quote characters
            l = [
                0, 0, 0
            ],
            //m counts word types
            m = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            //n counts syntax characters
            n = [
                0, 0, 0, 0, 0
            ],
            //o counts words not specified by 'm'
            o = [
                0, 0
            ],
            //p counts regex
            p = [
                0, 0
            ],
            //q counts number literals
            q = [
                0, 0
            ],
            v = 0,
            //w counts white space characters
            w = [
                0, -1, 0, 0
            ],
            result = "";
        if (source === "Error: no source code supplied to jspretty!") {
            return source;
        }
        //this function tokenizes the source code into an array
        //of literals and syntax tokens
        //token types are populated into the "types" array and are:
        // * comment - any comment other than "comment-inline"
        // * comment-inline - this is any "//" comment following code
        // * end - ] ) }
        // * literal - quoted strings and numbers
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
                b = source.length,
                c = source.split(""),
                e = [],
                t = "",
                u = "",
                V = 0,
                Y = 0,
                //curly brace insertion - the primary data package
                block = {
                    count: 0, //paren count off
                    start: -1, //prevent some interference
                    dotest: false, //check for alignment of do and while
                    flag: false, //move between keywords and condition end
                    bcount: [], //counting braces present since recent start insertion
                    brace: [], //list of indexes prior to missing brace
                    method: [], //if in a method move to next end brace
                    pcount: [], //block count off for prior block tests
                    prev: [], //block.prior value of prior closed block
                    prior: [], //does a brace already exist following a missing brace
                    simple: [], //is a condition expected?
                    word: [], //a list from the code sample of the words:  if, else, for, do, while
                    cs: (jscorrect === true) ? "{" : "x{",
                    ce: (jscorrect === true) ? "}" : "x}"
                },
                blockpop = function jspretty__tokenize_blockpop() {
                    block.bcount.pop();
                    block.brace.pop();
                    block.method.pop();
                    block.pcount.pop();
                    block.prior.pop();
                    block.simple.pop();
                },
                //a check to prevent comments from algorithmic
                //interference in the brace insertion algorithm of the
                //jscorrect feature
                commentcheck = function jspretty__tokenize_commentcheck() {
                    var aa = 0,
                        bb = 0,
                        cc = token.length - 1;
                    if ((token[cc] !== "}" && token[cc] !== "x}") || block.prior[block.prior.length - 1] === true) {
                        return;
                    }
                    for (aa = cc - 1; aa > -1; aa -= 1) {
                        if (types[aa] === "end") {
                            bb += 1;
                        }
                        if (types[aa] === "start" || types[aa] === "method") {
                            bb -= 1;
                        }
                        if (bb === -1) {
                            break;
                        }
                    }
                    if ((token[aa] === "{" || token[aa] === "x{") && (types[aa - 1] === "comment" || types[aa - 1] === "comment-inline")) {
                        token.pop();
                        types.pop();
                        token.splice(aa, 1);
                        types.splice(aa, 1);
                    }
                },
                //curly brace insertion - demystify "else" complexity
                elsestart = function jspretty__tokenize_elsestart() {
                    var bb = 0,
                        r = 0,
                        x = block.word.length - 1,
                        y = token.length - 1,
                        z = 0,
                        test = (function () {
                            var g = a + 1,
                                space = /\s/;
                            for (g; g < b; g += 1) {
                                if (c[g] === "{") {
                                    return true;
                                }
                                if (space.test(c[g]) === false) {
                                    return false;
                                }
                            }
                        }());
                    if (test === true) {
                        return;
                    }
                    block.bcount.push(0);
                    block.brace.push("else");
                    block.method.push(0);
                    block.pcount.push(0);
                    block.prior.push(false);
                    block.simple.push(true);
                    block.flag = false;
                    block.count = 0;
                    types.pop();
                    token.pop();
                    for (y; y > -1; y -= 1) {
                        if (token[y] === "}" || token[y] === "x}") {
                            r += 1;
                        }
                        if (token[y] === "{" || token[y] === "x{") {
                            r -= 1;
                        }
                        if (token[y] === "if") {
                            bb += 1;
                        }
                        if (token[y] === "else" && token[y + 1] !== "if") {
                            bb -= 1;
                        }
                        if (r < 0) {
                            break;
                        }
                    }
                    for (x; x > -1; x -= 1) {
                        if (block.word[x] !== "if" && block.word[x] !== "else") {
                            bb -= 1;
                        }
                        if (block.word[x] === "if") {
                            if (block.prev[x] === true) {
                                bb -= 1;
                            }
                            break;
                        }
                    }
                    if (block.prev[block.prev.length - 1] === true || (token[token.length - 2] !== "}" && token[token.length - 2] !== "x}" && block.prev[block.prev.length - 1] === false)) {
                        token.push("else");
                        types.push("word");
                        return;
                    }
                    r = a - 4;
                    if ((/\s/).test(c[r]) === true) {
                        do {
                            r -= 1;
                        } while ((/\s/).test(c[r]) === true);
                    }
                    if (c[r] === "}" || c[r] === "x}") {
                        token.push("else");
                        types.push("word");
                        return;
                    }
                    for (bb -= 1; bb > -1; bb -= 1) {
                        z -= 1;
                        if ((token[token.length - 2] !== "}" && token[token.length - 2] !== "x}") || block.prev[z] === true) {
                            break;
                        }
                        token.pop();
                        types.pop();
                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                            lines[lines.length - 1][0] -= 1;
                        }
                        block.bcount.push(0);
                        block.brace.push("else");
                        block.method.push(0);
                        block.pcount.push(0);
                        block.prior.push(false);
                        block.simple.push(true);
                    }
                    token.push("else");
                    types.push("word");
                },
                //curly brace insertion - test if you are inside "(" ")"
                methodtest = function jspretty__tokenize_methodtest() {
                    var cc = 0,
                        dd = 0;
                    for (cc = token.length - 2; cc > -1; cc -= 1) {
                        if (types[cc] === "end") {
                            dd += 1;
                        }
                        if (types[cc] === "start" || types[cc] === "method") {
                            dd -= 1;
                        }
                        if (dd === -1) {
                            if (types[cc] === "method") {
                                block.method[block.method.length - 1] += 1;
                            }
                            return;
                        }
                    }
                },
                //curly brace insertion - test if you are inside a obj
                objtest = function jspretty__tokenize_objtest() {
                    var cc = 0,
                        dd = 0;
                    if (block.method[block.method.length - 1] > 0) {
                        block.method[block.method.length - 1] -= 1;
                        return;
                    }
                    for (cc = token.length - 2; cc > -1; cc -= 1) {
                        if (types[cc] === "end") {
                            dd += 1;
                        }
                        if (types[cc] === "start" || types[cc] === "method") {
                            dd -= 1;
                        }
                        if (dd === -1) {
                            if (token[cc - 1] !== "=" && token[cc - 1] !== "==" && token[cc - 1] !== "===" && (token[cc] === "{" || token[cc] === "x{") && block.method.length > 0 && ((types[cc - 1] === "operator" && token[cc - 1] !== ":") || token[cc - 1] === "{" || token[cc - 1] === "x{" || token[cc - 1] === "[")) {
                                block.method[block.method.length - 1] -= 1;
                            }
                            return;
                        }
                    }
                },
                //curly brace insertion - test if while is for "do"
                whiletest = function jspretty__tokenize_whiletest() {
                    var cc = 0,
                        dd = 1;
                    for (cc = token.length - 3; cc > -1; cc -= 1) {
                        if (token[cc] === "}" || token[cc] === "x}") {
                            dd += 1;
                        }
                        if (token[cc] === "{" || token[cc] === "x{") {
                            dd -= 1;
                        }
                        if (dd > 0 && token[cc] === "do") {
                            block.dotest = true;
                            token.pop();
                            types.pop();
                            do {
                                dd -= 1;
                                block.brace.push(-1);
                                block.simple.push(false);
                                block.method.push(0);
                                token.pop();
                                types.pop();
                            } while (dd > 0);
                            if (block.start === -1) {
                                block.start = 0;
                            }
                            block.flag = false;
                            block.count = 0;
                            token.push("while");
                            return types.push("word");
                        }
                        if (dd === 0) {
                            if (token[cc - 1] === "do") {
                                block.dotest = true;
                            }
                            return;
                        }
                    }
                },
                //convert ++ and -- into += and -= in most cases
                plusplus = function jspretty__tokenize_plusplus(x, y) {
                    var aa = [],
                        bb = "",
                        cc = 0,
                        dd = 0;
                    if (y === "post" && c[a] === ")" && token[V - 3] === ",") {
                        for (cc = V - 1; cc > -1; cc -= 1) {
                            if (types[cc] === "end") {
                                dd += 1;
                            }
                            if (types[cc] === "start" || types[cc] === "method") {
                                dd -= 1;
                            }
                            if (dd < 0) {
                                if (types[cc] === "method" || token[cc - 1] === "function") {
                                    return;
                                }
                                break;
                            }
                        }
                    }
                    if (token[x] === "++") {
                        bb = "+=";
                    } else {
                        bb = "-=";
                    }
                    if (y === "pre") {
                        aa.push(token[x + 1]);
                        aa.push(types[x + 1]);
                        token.pop();
                        types.pop();
                        token.pop();
                        types.pop();
                        token.push(aa[0]);
                        types.push(aa[1]);
                        token.push(bb);
                        types.push("operator");
                        token.push("1");
                        types.push("literal");
                    } else {
                        token.pop();
                        types.pop();
                        token.push(bb);
                        types.push("operator");
                        token.push("1");
                        types.push("literal");
                    }
                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                        lines[lines.length - 1][0] += 1;
                    }
                },
                //automatic semicolon insertion
                asi = function jspretty__tokenize_asi(z) {
                    var y = token.length - 1,
                        dd = token[y],
                        ee = c[z],
                        f = c[z + 1],
                        g = false,
                        h = (/[\(\)\[\]\{\}\=&<>\+\-\*\/\!\?\|\^:%(0-9)\\]/),
                        i = u,
                        jj = 0,
                        kk = 0,
                        ll = 0,
                        mm = [],
                        s = (/\s/),
                        colon = false,
                        elsetest = false;
                    if (dd === "else") {
                        return;
                    }
                    if (dd === "return" || dd === "break" || dd === "continue" || dd === "throw") {
                        g = true;
                    }
                    if (g === false && dd === ")") {
                        for (jj = y - 1; jj > -1; jj -= 1) {
                            if (types[jj] === "end") {
                                kk += 1;
                            }
                            if (types[jj] === "start" || types[jj] === "method") {
                                kk -= 1;
                            }
                            if (kk === -1) {
                                if (token[jj] === "(" && (token[jj - 1] === "function" || token[jj - 2] === "function" || token[jj - 1] === "if" || token[jj - 1] === "for" || token[jj - 1] === "while" || token[jj - 1] === "catch" || token[jj - 1] === "switch")) {
                                    return;
                                }
                                break;
                            }
                        }
                    }
                    if (g === false && (dd === "}" || dd === "x}")) {
                        for (jj = a; jj < b; jj += 1) {
                            if (s.test(c[jj]) === false) {
                                break;
                            }
                        }
                        if (c[jj] === "e" && c[jj + 1] === "l" && c[jj + 2] === "s" && c[jj + 3] === "e") {
                            return;
                        }
                    }
                    if (g === false && (f + c[z + 2] === "++" || f + c[z + 2] === "--")) {
                        if (s.test(c[z]) === true) {
                            for (jj = z; jj > -1; jj -= 1) {
                                if (c[jj] === "\n" || c[jj] === "\r" || s.test(c[jj]) === false) {
                                    break;
                                }
                            }
                            if (c[jj] === "\n" || c[jj] === "\r") {
                                for (jj = z + 3; jj < b; jj += 1) {
                                    if (s.test(c[jj]) === false) {
                                        if (h.test(c[jj]) === true) {
                                            c.splice(jj, 0, ";");
                                            b += 1;
                                            v += 1;
                                            return;
                                        }
                                        g = true;
                                        f = "";
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (g === false && (dd === ";" || dd === "x;" || dd === "," || dd === ":" || dd === "{" || dd === "x{" || dd === "[" || f === "]" || (ee !== "}" && (f === ";" || f === "," || f === "." || f === "(")) || f === "+" || f === "*" || f === "-" || f === "%" || f === "!" || f === "=" || f === "^" || f === "?" || i === "operator" || i === "comment" || i === "comment-inline" || (f === "/" && c[z + 2] !== "/" && c[z + 2] !== "*"))) {
                        return;
                    }
                    if (g === false && (dd === ")" || dd === "]" || token[y - 1] === "break" || token[y - 1] === "return" || token[y - 1] === "continue" || token[y - 1] === "throw" || (ee === "}" && (token[y - 1] === "{" || token[y - 1] === "x{")))) {
                        kk = 0;
                        for (jj = y; jj > -1; jj -= 1) {
                            if (types[jj] === "end") {
                                kk += 1;
                            }
                            if (types[jj] === "start" || types[jj] === "method") {
                                kk -= 1;
                            }
                            if (kk < 0 && jj < y - 1) {
                                if (((token[y - 1] === "{" || token[y - 1] === "x{") && (token[jj - 1] === "if" || token[jj - 1] === "for" || token[jj - 1] === "while")) || ((token[jj] === "{" || token[jj] === "x{") && jj < y - 1 && colon === false)) {
                                    kk = 0;
                                    g = true;
                                    break;
                                }
                                return;
                            }
                            if (kk === 0) {
                                if (token[jj] === ":") {
                                    colon = true;
                                }
                                if (token[jj] === "=" || token[jj] === "return" || token[jj] === ";") {
                                    break;
                                }
                                if (c[a] === ")" && token[jj] === "(" && (token[jj - 1] === "function" || (types[jj - 1] === "word" && token[jj - 2] === "function"))) {
                                    return;
                                }
                            }
                        }
                        kk = 0;
                        g = true;
                    }
                    if (g === false && ee !== "}" && f + c[z + 2] + c[z + 3] + c[z + 4] === "else") {
                        g = true;
                        elsetest = true;
                    }
                    if (g === false) {
                        for (jj = y; jj > -1; jj -= 1) {
                            if (types[jj] === "end") {
                                kk += 1;
                                colon = false;
                            }
                            if (types[jj] === "start" || types[jj] === "method") {
                                kk -= 1;
                            }
                            if (kk < 0) {
                                if (((token[jj] === "{" || token[jj] === "x{") && token[jj - 1] === ")") || ((token[y - 1] === "{" || token[y - 1] === "x{") && ee === "}") || token[jj + 1] === "return" || token[jj + 1] === "break" || token[jj + 1] === "continue" || token[jj + 1] === "throw") {
                                    g = true;
                                    break;
                                }
                                return;
                            }
                            if (kk === 0) {
                                if (ee === "}" || (ee !== "}" && f === "}")) {
                                    if (token[jj] === ":") {
                                        colon = true;
                                    }
                                    if (token[jj] === "," && colon === true) {
                                        return;
                                    }
                                }
                                if (token[jj] === "return" || token[jj] === "=" || (token[jj] === "else" && token[jj + 1] !== "{" && token[jj + 1] !== "x{" && token[jj + 1] !== "if")) {
                                    g = true;
                                    break;
                                }
                                if (token[jj - 1] === "while") {
                                    for (ll = jj - 2; ll > -1; ll -= 1) {
                                        if (token[jj - 2] !== "}" && token[jj - 2] !== "x}" && token[ll] === ";" && ll < jj - 2 && kk === 0) {
                                            return;
                                        }
                                        if (types[ll] === "end") {
                                            kk += 1;
                                        }
                                        if (types[ll] === "start" || types[ll] === "method") {
                                            kk -= 1;
                                        }
                                        if (kk < 0) {
                                            return;
                                        }
                                        if (kk === 0 && token[ll] === "do") {
                                            break;
                                        }
                                    }
                                    if (ll === -1) {
                                        return;
                                    }
                                    break;
                                }
                                if (token[jj] === "do" && token[jj + 1] !== "{" && token[jj + 1] !== "x{") {
                                    g = true;
                                    break;
                                }
                                if (types[jj] === "start" || types[jj] === "method" || token[jj] === ";" || token[jj] === "," || token[jj] === "do") {
                                    if (((token[jj - 1] === "else" || token[jj - 1] === "for" || token[jj - 1] === "catch" || token[jj - 1] === "if") && elsetest === false) || ((token[jj] === "{" || token[jj] === "x{") && token[jj - 1] === "do")) {
                                        if (token[jj - 1] !== "if" && token[jj - 1] !== "for") {
                                            if (types[y] === "end") {
                                                return;
                                            }
                                            g = true;
                                            break;
                                        }
                                        kk = 1;
                                        for (ll = jj + 1; ll < y + 1; ll += 1) {
                                            if (token[ll] === "(") {
                                                kk += 1;
                                            }
                                            if (token[ll] === ")") {
                                                kk -= 1;
                                                if (kk === 0) {
                                                    if (token[ll + 1] === undefined) {
                                                        return;
                                                    }
                                                    dd = token[ll + 1];
                                                    if (dd === "{" || dd === "x{" || dd === "for" || dd === "if" || dd === "while" || dd === "do") {
                                                        return;
                                                    }
                                                    dd = token[y];
                                                    break;
                                                }
                                            }
                                        }
                                        kk = 0;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if (g === false) {
                        colon = false;
                        if (token[jj - 1] === ":") {
                            if (token[jj] === "{") {
                                return;
                            }
                            kk = 0;
                            for (jj -= 1; jj > -1; jj -= 1) {
                                if (types[jj] === "end") {
                                    kk += 1;
                                }
                                if (types[jj] === "start" || types[jj] === "method") {
                                    kk -= 1;
                                }
                                if (kk === 1) {
                                    return;
                                }
                            }
                        }
                        if (token[jj - 1] === ")") {
                            kk = 0;
                            for (jj -= 1; jj > -1; jj -= 1) {
                                if (types[jj] === "end") {
                                    kk += 1;
                                }
                                if (types[jj] === "start" || types[jj] === "method") {
                                    kk -= 1;
                                }
                                if (kk === 0) {
                                    if (ee === "}" || (ee !== "}" && f === "}")) {
                                        if (token[jj] === ":") {
                                            colon = true;
                                        }
                                        if (token[jj] === "," && colon === true) {
                                            return;
                                        }
                                    }
                                    if (token[jj] === ";") {
                                        break;
                                    }
                                    if (token[jj] === "(") {
                                        jj -= 1;
                                        if (token[jj] === "if" || token[jj] === "for" || token[jj] === "switch" || token[jj] === "catch" || token[jj] === "while") {
                                            if (types[y] === "end") {
                                                return;
                                            }
                                            g = true;
                                            break;
                                        }
                                        if (token[jj - 1] === "function") {
                                            jj -= 1;
                                        }
                                        if (token[jj] === "function") {
                                            if ((types[jj - 1] === "operator" && token[jj - 1] !== ":") || token[jj - 1] === "(" || token[jj - 1] === "[") {
                                                g = true;
                                            } else {
                                                return;
                                            }
                                        } else {
                                            g = true;
                                        }
                                    }
                                }
                            }
                        } else if (token[jj] !== ",") {
                            g = true;
                        }
                    }
                    if (g === true) {
                        if (jscorrect === true) {
                            token.push(";");
                        } else {
                            token.push("x;");
                        }
                        t = ";";
                        u = "separator";
                        types.push("separator");
                        V += 1;
                        v += 1;
                        if (block.prior[block.prior.length - 1] === false && block.start > -1 && block.count === 0 && block.simple.length > 0 && block.method[block.method.length - 1] === 0) {
                            if (token[V - 3] === "else" && token[V - 2] !== "{" && token[V - 2] !== "x{" && token[V - 2] !== "if") {
                                mm.push(token[token.length - 2]);
                                mm.push(types[types.length - 2]);
                                token.pop();
                                types.pop();
                                token.pop();
                                types.pop();
                                token.push(block.cs);
                                types.push("start");
                                token.push(mm[0]);
                                types.push(mm[1]);
                                token.push(t);
                                types.push(u);
                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                    lines[lines.length - 1][0] -= 1;
                                }
                                V += 1;
                            }
                            do {
                                if (block.prior[block.prior.length - 1] === false) {
                                    token.push(block.ce);
                                    types.push("end");
                                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                        lines[lines.length - 1][0] += 1;
                                    }
                                }
                                blockpop();
                                V += 1;
                            } while (block.simple.length > 0 && block.prior[block.prior.length - 1] === false);
                            t = "}";
                            u = "end";
                            if (block.simple.length === 0) {
                                block.start = -1;
                            }
                        }
                    }
                },
                //newarray converts new Array(x) into an array literal
                newarray = function jspretty__tokenize_newarray() {
                    var aa = token.length - 1,
                        bb = 0,
                        cc = aa,
                        dd = 0;
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
                            dd = token[cc] - 1;
                            token.pop();
                            token.pop();
                            token.pop();
                            token.pop();
                            types.pop();
                            types.pop();
                            types.pop();
                            types.pop();
                            token.push("[");
                            types.push("start");
                            do {
                                token.push(",");
                                types.push("separator");
                                dd -= 1;
                            } while (dd > 0);
                        } else {
                            token[aa] = "[";
                            types[aa] = "start";
                            token.splice(aa - 2, 2);
                            types.splice(aa - 2, 2);
                        }
                        token.push("]");
                    } else {
                        token.push(")");
                    }
                    types.push("end");
                },
                //the "d" function is a generic tokenizer
                //start argument contains the token's starting syntax
                //offset argument is length of start minus control chars
                //end is how is to identify where the token ends
                d = function jspretty__tokenize_genericBuilder(start, offset, end) {
                    var ee = 0,
                        f = 0,
                        g = 0,
                        h = end.split(""),
                        i = h.length - 1,
                        jj = b,
                        kk = false,
                        ll = [start],
                        mm = (h[0] === "\r") ? true : false,
                        nn = a + offset,
                        oo = "",
                        escape = false;
                    //this insanity is for JSON where all the required
                    //quote characters are escaped.
                    if (c[a - 2] !== "\\" && c[a - 1] === "\\" && (c[a] === "\"" || c[a] === "'")) {
                        token.pop();
                        types.pop();
                        if (token[0] === "{") {
                            if (c[a] === "\"") {
                                start = "\"";
                                end = "\\\"";
                                ll = ["\""];
                            } else {
                                start = "'";
                                end = "\\'";
                                ll = ["'"];
                            }
                            escape = true;
                        } else {
                            if (c[a] === "\"") {
                                return "\\\"";
                            }
                            return "\\'";
                        }
                    }
                    for (ee = nn; ee < jj; ee += 1) {
                        ll.push(c[ee]);
                        if (c[ee] === h[i] || (mm === true && (c[ee] === "\n" || ee === jj - 1))) {
                            if (i > 0) {
                                g = i;
                                for (f = ee; g > -1; f -= 1) {
                                    if (c[f] !== h[g]) {
                                        break;
                                    }
                                    g -= 1;
                                }
                                if (g === -1) {
                                    kk = true;
                                }
                            } else {
                                kk = true;
                            }
                            //this condition identifies a series of
                            //character escapes
                            if (ee > i + 1 && c[ee - i - 1] === "\\" && end.charAt(0) !== "\\") {
                                g = 1;
                                for (f = ee - 2; f > -1; f -= 1) {
                                    if (c[f] === "\\") {
                                        g += 1;
                                    } else {
                                        break;
                                    }
                                }
                                if (g % 2 === 1) {
                                    kk = false;
                                }
                            }
                            if (kk === true) {
                                break;
                            }
                        }
                    }
                    if (escape === true) {
                        oo = ll[ll.length - 1];
                        ll.pop();
                        ll.pop();
                        ll.push(oo);
                    }
                    //j is a local for closure "b", which stands for end
                    //of input, basically i am just making sure i have
                    //exceeded the last character of code input
                    if (ee < jj) {
                        a = ee;
                        if (start === "//") {
                            w[0] += 1;
                            ll.pop();
                        }
                        if (jsscope === true) {
                            oo = ll.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            oo = ll.join("");
                        }
                        return oo;
                    }
                    return "";
                },
                //this allows more specific identification for comments
                comtest = function jspretty__tokenize_commentTester() {
                    var z = 0;
                    if (u === "comment" || u === "comment-inline") {
                        return "comment";
                    }
                    for (z = a - 1; z > -1; z -= 1) {
                        if ((/\S/).test(c[z]) === true) {
                            return "comment-inline";
                        }
                        if (c[z] === "\n" || c[z] === "\r") {
                            return "comment";
                        }
                    }
                    return "comment";
                },
                //a unique tokenizer for operator characters
                operator = function jspretty__tokenize_operator() {
                    var ee = [
                            "=", "<", ">", "+", "*", "?", "|", "^", ":", "&"
                        ],
                        f = [c[a]],
                        g = 0,
                        h = 0,
                        ii = ee.length,
                        jj = b,
                        kk = "";
                    if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === token.length - 1) {
                        lines.pop();
                    }
                    if (a < b - 1) {
                        if (c[a] === "!" && c[a + 1] === "/") {
                            return "!";
                        }
                        if (c[a] === ":" && c[a + 1] !== ":") {
                            return ":";
                        }
                        if (c[a] === "-") {
                            if (c[a + 1] === "-") {
                                kk = "--";
                            } else if (c[a + 1] === "=") {
                                kk = "-=";
                            }
                            if (kk === "") {
                                return "-";
                            }
                        }
                    }
                    if (kk === "") {
                        for (g = a + 1; g < jj; g += 1) {
                            for (h = 0; h < ii; h += 1) {
                                if (c[g] === ee[h]) {
                                    f.push(ee[h]);
                                    break;
                                }
                            }
                            if (h === ii) {
                                break;
                            }
                        }
                        kk = f.join("");
                    }
                    a = a + (kk.length - 1);
                    if (jsscope === true) {
                        kk = kk.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                    return kk;
                },
                //a tokenizer for regular expressions
                regex = function jspretty__tokenize_regex() {
                    var ee = 0,
                        f = b,
                        g = ["/"],
                        h = 0,
                        i = 0,
                        jj = "";
                    for (ee = a + 1; ee < f; ee += 1) {
                        g.push(c[ee]);
                        if (c[ee] === "/") {
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
                        g.push(c[ee + 1]);
                        if (c[ee + 2] !== c[ee + 1] && (c[ee + 2] === "g" || c[ee + 2] === "i" || c[ee + 2] === "m" || c[ee + 2] === "y")) {
                            g.push(c[ee + 2]);
                            if (c[ee + 3] !== c[ee + 1] && c[ee + 3] !== c[ee + 2] && (c[ee + 3] === "g" || c[ee + 3] === "i" || c[ee + 3] === "m" || c[ee + 3] === "y")) {
                                g.push(c[ee + 3]);
                                if (c[ee + 4] !== c[ee + 1] && c[ee + 4] !== c[ee + 2] && c[ee + 4] !== c[ee + 3] && (c[ee + 4] === "g" || c[ee + 4] === "i" || c[ee + 4] === "m" || c[ee + 4] === "y")) {
                                    g.push(c[ee + 4]);
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
                    if (jsscope === true) {
                        jj = g.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    } else {
                        jj = g.join("");
                    }
                    return jj;
                },
                //a tokenizer for numbers
                numb = function jspretty__tokenize_number() {
                    var ee = 0,
                        f = b,
                        g = [c[a]],
                        h = (g[0] === ".") ? true : false;
                    if (a < b - 2 && c[a + 1] === "x" && (/[0-9A-Fa-f]/).test(c[a + 2])) {
                        g.push("x");
                        for (ee = a + 2; ee < f; ee += 1) {
                            if ((/[0-9A-Fa-f]/).test(c[ee])) {
                                g.push(c[ee]);
                            } else {
                                break;
                            }
                        }
                    } else {
                        for (ee = a + 1; ee < f; ee += 1) {
                            if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && h === false)) {
                                g.push(c[ee]);
                                if (c[ee] === ".") {
                                    h = true;
                                }
                            } else {
                                break;
                            }
                        }
                    }
                    if (ee < f - 1 && (c[ee] === "e" || c[ee] === "E")) {
                        g.push(c[ee]);
                        if (c[ee + 1] === "-") {
                            g.push("-");
                            ee += 1;
                        }
                        h = false;
                        for (ee += 1; ee < f; ee += 1) {
                            if ((/[0-9]/).test(c[ee]) || (c[ee] === "." && h === false)) {
                                g.push(c[ee]);
                                if (c[ee] === ".") {
                                    h = true;
                                }
                            } else {
                                break;
                            }
                        }
                    }
                    a = ee - 1;
                    return g.join("");
                },
                //Not a tokenizer.  This counts white space characters
                //and determines if there are empty lines to be
                //preserved
                space = function jspretty__tokenize_space() {
                    var ee = [],
                        f = 0,
                        g = b,
                        h = false,
                        i = "",
                        s = (/\s/),
                        asitest = false;
                    for (f = a; f < g; f += 1) {
                        if (c[f] === "\n") {
                            w[0] += 1;
                            asitest = true;
                        } else if (c[f] === " ") {
                            w[1] += 1;
                        } else if (c[f] === "\t") {
                            w[2] += 1;
                        } else if (s.test(c[f])) {
                            w[3] += 1;
                            if (c[f] === "\r") {
                                asitest = true;
                            }
                        } else {
                            break;
                        }
                        ee.push(c[f]);
                    }
                    a = f - 1;
                    if (token.length === 0) {
                        return;
                    }
                    i = ee.join("");
                    if (jpres === true && i.indexOf("\n") > -1) {
                        if (i.indexOf("\n") !== i.lastIndexOf("\n") || token[token.length - 1].indexOf("//") === 0) {
                            h = true;
                        }
                        lines.push([
                            token.length - 1, h
                        ]);
                    }
                    if (asitest === true && t !== ";" && Y < token.length) {
                        asi(a);
                        Y = token.length;
                    }
                },
                //A tokenizer for keywords, reserved words, and
                //variables
                word = function jspretty__tokenize_word() {
                    var ee = [],
                        f = a,
                        g = b,
                        h = "";
                    do {
                        ee.push(c[f]);
                        f += 1;
                    } while (f < g && " \f\n\r\t\v\u00A0\u2028\u2029;=.,&<>+-/*!?|^:\"'\\(){}[]%".indexOf(c[f]) === -1);
                    h = ee.join("");
                    if (types.length > 1 && h === "function" && types[types.length - 1] === "method" && (token[token.length - 2] === "{" || token[token.length - 2] === "x{")) {
                        types[types.length - 1] = "start";
                    }
                    a = f - 1;
                    if (types.length > 2 && h === "function" && u === "method" && (token[token.length - 2] === "}" || token[token.length - 2] === "x}")) {
                        types[types.length - 1] = "start";
                    }
                    return h;
                };
            for (a = 0; a < b; a += 1) {
                V = token.length;
                if ((/\s/).test(c[a])) {
                    space();
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    t = d("/*", 2, "*\/");
                    if (jcomment !== "nocomment") {
                        u = "comment";
                        k[0] += 1;
                        k[1] += t.length;
                        token.push(t);
                        types.push(u);
                    }
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    if (jcomment !== "nocomment") {
                        u = comtest();
                    }
                    t = d("//", 2, "\r");
                    if (jcomment !== "nocomment") {
                        j[0] += 1;
                        j[1] += t.length;
                        token.push(t);
                        types.push(u);
                    }
                } else if (c[a] === "/" && (V > 0 && u !== "word" && u !== "literal" && u !== "end")) {
                    t = regex();
                    u = "regex";
                    p[0] += 1;
                    p[1] += t.length;
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "\"") {
                    t = d("\"", 1, "\"");
                    u = "literal";
                    l[0] += 1;
                    l[1] += t.length - 2;
                    l[2] += 2;
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "'") {
                    t = d("'", 1, "'");
                    u = "literal";
                    l[0] += 1;
                    l[1] += t.length - 2;
                    l[2] += 2;
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (u === "literal" || u === "word") && t !== "return" && (t === ")" || t === "]" || u === "word" || u === "literal")) {
                    n[0] += 1;
                    n[1] += 1;
                    t = "-";
                    u = "operator";
                    token.push(t);
                    types.push(u);
                } else if ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1]))) {
                    if (u === "end" && c[a] === "-") {
                        t = "-";
                        u = "operator";
                        n[0] += 1;
                        n[1] += 1;
                    } else {
                        t = numb();
                        u = "literal";
                        q[0] += 1;
                        q[1] += t.length;
                    }
                    token.push(t);
                    types.push(u);
                } else if (c[a] === ",") {
                    n[2] += 1;
                    t = ",";
                    u = "separator";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === ".") {
                    n[0] += 1;
                    n[1] += 1;
                    if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === V - 1) {
                        lines.pop();
                    }
                    t = ".";
                    u = "separator";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === ";") {
                    n[3] += 1;
                    if ((token[V - 3] === ";" || token[V - 3] === "}" || token[V - 3] === "[" || token[V - 3] === "(" || token[V - 3] === ")" || token[V - 3] === "," || token[V - 3] === "return") && jscorrect === true) {
                        if (t === "++" || t === "--") {
                            plusplus(V - 1, "post");
                        } else if (token[V - 2] === "++" || token[V - 2] === "--") {
                            plusplus(V - 2, "pre");
                        }
                    }
                    t = ";";
                    u = "separator";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "(") {
                    n[4] += 1;
                    if (u === "comment" || u === "comment-inline" || u === "start") {
                        u = "start";
                    } else if (V > 2 && token[V - 2] === "function") {
                        u = "method";
                    } else if (V === 0 || t === "return" || t === "function" || t === "for" || t === "if" || t === "while" || t === "switch" || t === "catch" || u === "separator" || u === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
                        u = "start";
                    } else {
                        u = "method";
                    }
                    t = "(";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "[") {
                    n[4] += 1;
                    t = "[";
                    u = "start";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "{") {
                    n[4] += 1;
                    if ((u === "comment" || u === "comment-inline") && token[V - 2] === ")") {
                        t = token[V - 1];
                        token[V - 1] = "{";
                        u = types[V - 1];
                        types[V - 1] = "start";
                    } else {
                        t = "{";
                        u = "start";
                    }
                    if (jscorrect === true && block.start > -1) {
                        if (types[types.length - 1] === "method" || token[token.length - 1] === "=") {
                            block.method[block.method.length - 1] += 1;
                        }
                        if (token[V - 1] === ",") {
                            methodtest();
                        }
                    }
                    token.push(t);
                    types.push(u);
                } else if (c[a] === ")") {
                    n[4] += 1;
                    if ((token[V - 3] === ";" || token[V - 3] === "}" || token[V - 3] === "[" || token[V - 3] === "(" || token[V - 3] === ")" || token[V - 3] === "," || token[V - 3] === "return") && jscorrect === true) {
                        if (types[V - 3] !== "method" && (t === "++" || t === "--")) {
                            plusplus(V - 1, "post");
                        } else if (token[V - 2] === "++" || token[V - 2] === "--") {
                            plusplus(V - 2, "pre");
                        }
                    }
                    t = ")";
                    u = "end";
                    if (jscorrect === true) {
                        newarray();
                    } else {
                        token.push(t);
                        types.push(u);
                    }
                } else if (c[a] === "]") {
                    n[4] += 1;
                    if ((token[V - 3] === "[" || token[V - 3] === ";" || token[V - 3] === "}" || token[V - 3] === "(" || token[V - 3] === ")" || token[V - 3] === "," || token[V - 3] === "return") && jscorrect === true) {
                        if (t === "++" || t === "--") {
                            plusplus(V - 1, "post");
                        } else if (token[V - 2] === "++" || token[V - 2] === "--") {
                            plusplus(V - 2, "pre");
                        }
                    }
                    t = "]";
                    u = "end";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "}") {
                    if (t !== ";" && Y < token.length) {
                        asi(a);
                        Y = token.length;
                    }
                    if ((token[V - 3] === ";" || token[V - 3] === "}" || token[V - 3] === "[" || token[V - 3] === "(" || token[V - 3] === ")" || token[V - 3] === "," || token[V - 3] === "return") && jscorrect === true) {
                        if (token[V - 1] === "++" || token[V - 1] === "--") {
                            plusplus(V - 1, "post");
                            token.push(";");
                            types.push("separator");
                        } else if (token[V - 2] === "++" || token[V - 2] === "--") {
                            plusplus(V - 2, "pre");
                            token.push(";");
                            types.push("separator");
                        }
                    }
                    n[4] += 1;
                    t = "}";
                    u = "end";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%") {
                    t = operator();
                    u = "operator";
                    n[0] += 1;
                    n[1] += t.length;
                    token.push(t);
                    types.push(u);
                } else {
                    t = word();
                    u = "word";
                    if (t === "function" && block.start > -1) {
                        if (types[V - 1] === "method" || token[V - 1] === "=") {
                            block.method[block.method.length - 1] += 1;
                        }
                        if (token[V - 1] === ",") {
                            methodtest();
                        }
                    }
                    if (jscorrect === true && (t === "Object" || t === "Array") && c[a + 1] === "(" && c[a + 2] === ")" && token[V - 2] === "=" && token[V - 1] === "new") {
                        if (t === "Object") {
                            token[V - 1] = "{";
                            token.push("}");
                        } else {
                            token[V - 1] = "[";
                            token.push("]");
                        }
                        types[V - 1] = "start";
                        types.push("end");
                        n[4] += 2;
                        m[28] -= 1;
                        a += 2;
                    } else {
                        token.push(t);
                        types.push(u);
                        //the "m" array is used in the reporting at the end
                        //and is not used in the algorithm
                        if (jsscope === false) {
                            if (t === "alert") {
                                m[0] += 1;
                            } else if (t === "break") {
                                m[2] += 1;
                            } else if (t === "case") {
                                m[4] += 1;
                            } else if (t === "catch") {
                                m[48] += 1;
                            } else if (t === "console") {
                                m[54] += 1;
                            } else if (t === "continue") {
                                m[6] += 1;
                            } else if (t === "default") {
                                m[8] += 1;
                            } else if (t === "delete") {
                                m[10] += 1;
                            } else if (t === "do") {
                                m[12] += 1;
                            } else if (t === "document") {
                                m[44] += 1;
                            } else if (t === "else") {
                                m[14] += 1;
                            } else if (t === "eval") {
                                m[16] += 1;
                            } else if (t === "for") {
                                m[18] += 1;
                            } else if (t === "function") {
                                m[20] += 1;
                            } else if (t === "if") {
                                m[22] += 1;
                            } else if (t === "in") {
                                m[24] += 1;
                            } else if (t === "label") {
                                m[26] += 1;
                            } else if (t === "new") {
                                m[28] += 1;
                            } else if (t === "return") {
                                m[30] += 1;
                            } else if (t === "switch") {
                                m[32] += 1;
                            } else if (t === "this") {
                                m[34] += 1;
                            } else if (t === "throw") {
                                m[50] += 1;
                            } else if (t === "try") {
                                m[52] += 1;
                            } else if (t === "typeof") {
                                m[36] += 1;
                            } else if (t === "var") {
                                m[38] += 1;
                            } else if (t === "while") {
                                m[40] += 1;
                            } else if (t === "with") {
                                m[42] += 1;
                            } else if (t === "window") {
                                m[46] += 1;
                            } else {
                                o[0] += 1;
                                o[1] += t.length;
                            }
                        }
                    }
                }
                if (V < token.length) {
                    V = token.length;
                    e = [
                        token[V - 2], types[V - 2]
                    ];
                    if (V === 0) {
                        V += 1;
                    }
                    if (t === "}") {
                        block.bcount[block.bcount.length - 1] -= 1;
                        if (block.prior[block.prior.length - 1] === true) {
                            block.pcount[block.pcount.length - 1] -= 1;
                        }
                        if (block.method > 0 && block.method[block.method.length - 1] > 0) {
                            block.method[block.method.length - 1] -= 1;
                        }
                        objtest();
                    }
                    if (t === "{") {
                        block.bcount[block.bcount.length - 1] += 1;
                        if (block.prior[block.prior.length - 1] === true) {
                            block.pcount[block.pcount.length - 1] += 1;
                        }
                        if (e[0] === "else" || (block.word[block.word.length - 2] === "else" && block.word[block.word.length - 1] === "if")) {
                            block.prev[block.prev.length - 1] = true;
                        }
                    }
                    if (token[V - 3] === "else" && e[0] !== "{" && e[0] !== "x{" && e[0] !== "if") {
                        token.pop();
                        types.pop();
                        token.pop();
                        types.pop();
                        token.push(block.cs);
                        types.push("start");
                        block.prev.push(false);
                        token.push(e[0]);
                        types.push(e[1]);
                        token.push(t);
                        types.push(u);
                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                            lines[lines.length - 1][0] += 1;
                        }
                        V += 1;
                    }
                    if ((t === "}" || t === ";") && block.count === 0 && block.simple.length > 0 && block.method[block.method.length - 1] === 0) {
                        if (t === "}" && block.prior[block.prior.length - 1] === true && block.pcount[block.pcount.length - 1] === 0) {
                            blockpop();
                            if (block.simple.length === 0) {
                                block.start = -1;
                            }
                        } else if (t === ";" && (block.brace[block.brace.length - 1] === "else" || (block.prior[block.prior.length - 1] === false && block.start > -1))) {
                            if ((token[block.start - 1] === "while" && token[block.start] === "(" && V - 1 === block.brace[block.brace.length - 1]) || (block.word[block.word.length - 1] === "while" && V - 2 === block.brace[block.brace.length - 1])) {
                                blockpop();
                                if (block.simple.length === 0) {
                                    block.start = -1;
                                }
                            } else if (block.bcount[block.bcount.length - 1] === 0) {
                                //verify else is connected to the
                                //correct "if" before closing it
                                do {
                                    if (block.prior[block.prior.length - 1] === false) {
                                        token.push(block.ce);
                                        types.push("end");
                                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                            lines[lines.length - 1][0] += 1;
                                        }
                                    }
                                    commentcheck();
                                    V += 1;
                                    blockpop();
                                } while (block.simple.length > 0 && block.prior[block.prior.length - 1] === false && block.bcount[block.bcount.length - 1] === 0);
                                t = "}";
                                u = "end";
                                if (block.simple.length === 0) {
                                    block.start = -1;
                                }
                            }
                        }
                    }
                    if (block.flag === false && (t === "for" || t === "if" || t === "while" || t === "do" || t === "else") && (block.brace.length === 0 || block.brace[block.brace.length - 1] === "else" || block.brace[block.brace.length - 1] < V - 1)) {
                        if (t === "while" && (e[0] === "}" || e[0] === "x}")) {
                            whiletest();
                        }
                        if (block.dotest === true) {
                            block.dotest = false;
                        } else {
                            if ((t === "if" && e[0] === "else") || (t === "while" && token[block.start] === "do")) {
                                blockpop();
                            } else if (t === "if" && (e[0] === "{" || e[0] === "x{") && token[V - 3] === "else" && block.word[block.word.length - 2] === "else" && block.word[block.word.length - 1] === "if") {
                                token.pop();
                                types.pop();
                                token.pop();
                                types.pop();
                                token.push("if");
                                types.push("word");
                            }
                            if (t === "do") {
                                block.bcount.push(0);
                                block.brace.push(V - 1);
                                block.method.push(0);
                                block.pcount.push(0);
                                block.prior.push(false);
                                block.simple.push(true);
                                block.flag = false;
                                block.count = 0;
                            } else if (t === "else") {
                                elsestart();
                            } else {
                                block.method.push(0);
                                block.pcount.push(0);
                                block.prior.push(false);
                                block.simple.push(false);
                                block.flag = true;
                            }
                            block.start = a;
                            block.word.push(t);
                        }
                    }
                    if (block.start > -1) {
                        if (block.flag === true && block.simple[block.simple.length - 1] === false) {
                            if (t === "(") {
                                block.count += 1;
                            }
                            if (t === ")") {
                                block.count -= 1;
                                if (block.count === 0) {
                                    block.bcount.push(0);
                                    block.brace.push(V - 1);
                                    block.flag = false;
                                }
                            }
                        }
                        if (t === "for" && e[0] === "else") {
                            token.pop();
                            types.pop();
                            token.push(block.cs);
                            types.push("start");
                            token.push(t);
                            types.push(u);
                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                lines[lines.length - 1][0] += 1;
                            }
                            V += 1;
                        } else if ((block.flag === false || e[0] === "else" || (e[0] === ")" && (t === "if" || t === "for" || t === "while"))) && block.count === 0 && V - 2 === block.brace[block.brace.length - 1]) {
                            if (block.word[block.word.length - 1] === "else" && (t === "{" || e[0] === "{" || e[0] === "x{")) {
                                if (e[0] === "{" || e[0] === "x{") {
                                    token[token.length - 2] = token[token.length - 1];
                                    types[types.length - 2] = types[types.length - 1];
                                    token.pop();
                                    types.pop();
                                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                        lines[lines.length - 1][0] -= 1;
                                    }
                                }
                                block.prev.push(true);
                            } else if (t === "{") {
                                block.prior[block.prior.length - 1] = true;
                                block.pcount[block.pcount.length - 1] = 1;
                                block.prev.push(true);
                            } else if (block.brace[block.brace.length - 1] !== -1) {
                                token.pop();
                                types.pop();
                                token.push(block.cs);
                                types.push("start");
                                token.push(t);
                                types.push(u);
                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                    lines[lines.length - 1][0] += 1;
                                }
                                block.prev.push(false);
                                V += 1;
                            }
                        } else if (t === "{" && e[0] === "else" && block.brace[block.brace.length - 1] === "else") {
                            blockpop();
                            block.prev.push(true);
                        }
                    }
                }
            }
            lines.push([
                token.length, false
            ]);
            asi(a);
        }());
        //this function is the pretty-print algorithm
        (function jspretty__algorithm() {
            var a = 0,
                b = token.length,
                ll = 0,
                indent = jlevel, //will store the current level of
                //indentation
                obj = [], //stores if current block is an object literal
                list = [], //stores comma status of current block
                listtest = [], //determines the comma evaluation must
                //run for the current block
                lastlist = false, //remembers the list status of the
                //most recently closed block
                ternary = false, //used to identify ternary statments
                //which is important to know as the only time a space
                //should preceede a ":" operator
                question = false, //used to identify a "?" operator in
                //order to better identify ternary statements
                varline = [], //determines if a current list of the
                //given block is a list of variables following the "var"
                //keyword
                casetest = [], //is the current block a switch/case?
                fortest = 0, //used for counting the arguments of a
                //"for" loop
                ctype = "", //ctype stands for "current type"
                ctoke = "", //ctoke standa for "current token"
                ltype = types[0], //ltype stands for "last type"
                ltoke = token[0], //ltype stands for "last token"
                varlen = [],
                methodtest = [],
                separator = function jspretty__algorithm_separator() {
                    if (types[a - 1] === "comment-inline" && a > 1) {
                        return (function jspretty__algorithm_commentfix() {
                            var c = 0,
                                d = b,
                                e = token[a - 1];
                            level[a - 2] = "x";
                            level[a - 1] = "x";
                            for (c = a; c < d; c += 1) {
                                token[c - 1] = token[c];
                                types[c - 1] = types[c];
                                if (token[c] === ";" || token[c] === "x;" || token[c] === "{" || token[c] === "x{" || c === lines[ll][0]) {
                                    token[c] = e;
                                    types[c] = "comment-inline";
                                    a -= 1;
                                    return;
                                }
                            }
                            token[c - 1] = e;
                            types[c - 1] = "comment-inline";
                            a -= 1;
                        }());
                    }
                    if (ctoke === ".") {
                        level[a - 1] = "x";
                        return level.push("x");
                    }
                    if (ctoke === ",") {
                        level[a - 1] = "x";
                        if (obj[obj.length - 1] === true) {
                            ternary = false;
                        }
                        //this is the test of whether a comma separated
                        //list should be treated as a proper list, such
                        //as an array or if the list should be treated
                        //like a wild bunch of unordered mess
                        if (listtest[listtest.length - 1] === false) {
                            listtest[listtest.length - 1] = true;
                            (function jspretty__algorithm_separator_listTest() {
                                var c = 0,
                                    d = 0,
                                    e = false,
                                    f = false,
                                    g = false,
                                    h = 0,
                                    i = 2;
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
                                        if (g === false && token[c] === "return") {
                                            list[list.length - 1] = true;
                                            return;
                                        }
                                        if (e === false && (token[c] === "=" || token[c] === ";")) {
                                            e = true;
                                        }
                                        if (f === false && (token[c] === "&&" || token[c] === "||")) {
                                            f = true;
                                        }
                                        if (g === false && token[c] === ";") {
                                            g = true;
                                        }
                                    }
                                    if (d === -1) {
                                        if (types[c] === "method") {
                                            list[list.length - 1] = true;
                                        } else if (token[c] === "{" || token[c] === "x{") {
                                            if (token[c - 1] !== ")") {
                                                obj[obj.length - 1] = true;
                                                for (h = c; h < a; h += 1) {
                                                    if (token[h] === ":") {
                                                        if (types[h] === "comment" || types[h] === "comment-inline") {
                                                            i += 1;
                                                        }
                                                        if (h - c === i) {
                                                            varlen.push([h - 1]);
                                                        } else {
                                                            varlen.push([]);
                                                        }
                                                        break;
                                                    }
                                                }
                                            } else if (f === false && g === false) {
                                                for (c = c - 1; c > -1; c -= 1) {
                                                    if (types[c] === "end") {
                                                        d += 1;
                                                    }
                                                    if (types[c] === "start" || types[c] === "method") {
                                                        d -= 1;
                                                    }
                                                    if (d === -1 && token[c] === "(") {
                                                        if (token[c - 1] === "function" || token[c - 2] === "function" || token[c - 1] === "if" || token[c - 1] === "for") {
                                                            return;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        } else if (f === false && g === false && ((token[c] === "(" && token[c - 1] === "for") || token[c] === "[")) {
                                            list[list.length - 1] = true;
                                            return;
                                        }
                                        if (f === false && g === false && varline[varline.length - 1] === false && (e === false || token[c] === "(")) {
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
                                    var c = 0,
                                        d = false;
                                    for (c = a - 1; c > -1; c -= 1) {
                                        if (token[c] === "]") {
                                            d = true;
                                        }
                                        if (types[c] === "method" || types[c] === "start") {
                                            if (token[c] === "[" && token[c + 1] !== "]" && d === false) {
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
                        question = false;
                        level[a - 1] = "x";
                        if (fortest === 0) {
                            if (varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                                varlist.push(varlen[varlen.length - 1]);
                                varlen.pop();
                                indent -= 1;
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
                start = function jspretty__algorithm_start() {
                    list.push(false);
                    listtest.push(false);
                    methodtest.push(false);
                    if (ctoke !== "(") {
                        indent += 1;
                    }
                    if (ltoke === "for") {
                        fortest = 1;
                    }
                    if (ctoke === "{" || ctoke === "x{") {
                        ternary = false;
                        casetest.push(false);
                        if (ctoke === "{") {
                            varline.push(false);
                        }
                        if (ltoke === "=" || ltoke === ":" || ltoke === "return") {
                            obj.push(true);
                        } else {
                            obj.push(false);
                        }
                        if (jbrace && ltype !== "operator" && ltoke !== "return") {
                            level[a - 1] = indent - 1;
                        } else if (ltoke === ")") {
                            level[a - 1] = "s";
                        } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                            level[a - 1] = indent - 1;
                        }
                        if (jsscope === true) {
                            meta.push("");
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
                        //the start of scope, at least for counting, is
                        //pushed back from the opening of the block to
                        //the paranthesis containing arguments so that
                        //the arguments can be tagged as variables of
                        //the coming scope
                        if (jsscope === true) {
                            //a 0 is pushed into the start of scope, but
                            //this number is updated in the "end"
                            //function to indicate the index where the
                            //scope ends
                            if (ltoke === "function" || token[a - 2] === "function") {
                                meta.push(0);
                            } else {
                                meta.push("");
                            }
                        }
                        if (fortest > 0 && ltoke !== "for") {
                            fortest += 1;
                        }
                        if (ltoke === "}" || ltoke === "x}") {
                            level[a - 1] = indent;
                            return level.push("x");
                        }
                        if ((ltoke === "-" && (a < 2 || (token[a - 2] !== ")" && token[a - 2] !== "]" && types[a - 2] !== "word" && types[a - 2] !== "literal"))) || (jspace === false && ltoke === "function")) {
                            level[a - 1] = "x";
                        }
                        return level.push("x");
                    }
                    if (ctoke === "[") {
                        if (jsscope === true) {
                            meta.push("");
                        }
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
                    if (jsscope === true && meta[a] === undefined) {
                        meta.push("");
                    }
                    return level.push("x");
                },
                end = function jspretty__algorithm_end() {
                    if (fortest === 1 && ctoke === ")" && varline[varline.length - 1] === true) {
                        varline[varline.length - 1] = false;
                    }
                    if (ctoke !== ")") {
                        indent -= 1;
                    } else if (fortest > 0 && ctoke === ")") {
                        fortest -= 1;
                    }
                    if (ctoke === "}" || ctoke === "x}") {
                        if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || ltoke === "break" || ltoke === "return")) {
                            (function jspretty__algorithm_end_curlyBrace() {
                                var c = 0,
                                    d = 1,
                                    e = false,
                                    f = list.length;
                                for (c = a - 1; c > -1; c -= 1) {
                                    if (types[c] === "end") {
                                        d += 1;
                                    }
                                    if (types[c] === "start" || types[c] === "method") {
                                        d -= 1;
                                    }
                                    if (d === 1) {
                                        if (token[c] === "=" || token[c] === ";") {
                                            e = true;
                                        }
                                        if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "{" || token[c - 1] === "x{" || token[c - 1] === "}" || token[c - 1] === "x}" || token[c - 1] === ";")) {
                                            indent -= 1;
                                            level[a - 1] = indent;
                                            return;
                                        }
                                        if ((token[c] === ":" && ternary === false) || (token[c] === "," && e === false && varline[varline.length - 1] === false)) {
                                            return;
                                        }
                                        if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var") {
                                            if (list[f - 1] === false && f > 1 && (a === b - 1 || token[a + 1] !== ")") && obj[obj.length - 1] === false) {
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
                        if (jsscope === true) {
                            (function jspretty__algorithm_end_jsscope() {
                                var c = 0,
                                    d = 1,
                                    e = [],
                                    f = false;
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
                                        if (meta[c] === "v" && token[c] !== e[e.length - 1]) {
                                            e.push(token[c]);
                                        } else if (token[c] === ")") {
                                            f = true;
                                        } else if (f === true && types[c] === "word" && token[c] !== e[e.length - 1]) {
                                            e.push(token[c]);
                                        }
                                    }
                                    if (c > 0 && token[c - 1] === "function" && types[c] === "word" && token[c] !== e[e.length - 1]) {
                                        e.push(token[c]);
                                    }
                                    if (d === 0) {
                                        if (types[c] === "separator" || types[c] === "operator" || types[c] === "literal" || token[c] === "if" || token[c] === "else" || token[c] === "for" || token[c] === "switch" || token[c] === "do" || token[c] === "return" || token[c] === "while" || token[c] === "catch" || token[c] === "try") {
                                            return;
                                        }
                                        if (token[c] === "function") {
                                            if (types[c + 1] === "word") {
                                                meta[c + 2] = a;
                                            } else {
                                                meta[c + 1] = a;
                                            }
                                            meta.push(e);
                                            return;
                                        }
                                    }
                                }
                            }());
                        }
                        casetest.pop();
                    }
                    if ((types[a - 1] === "comment" && token[a - 1].substr(0, 2) === "//") || types[a - 1] === "comment-inline") {
                        level[a - 1] = indent;
                        level.push("x");
                    } else if ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]")) {
                        level[a - 1] = "x";
                        level.push("x");
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
                    } else if (ctoke === ")") {
                        level[a - 1] = "x";
                        level.push("s");
                    } else if ((ctoke === "}" || ctoke === "x}") && obj[obj.length - 1] === false && ltype === "word" && list[list.length - 1] === false && casetest[casetest.length - 1] === false) {
                        indent += 1;
                        level[a - 1] = indent;
                        level.push(indent);
                    } else if (ctoke === "}" || ctoke === "x}" || list[list.length - 1] === true) {
                        level[a - 1] = indent;
                        level.push("x");
                    } else {
                        level.push("x");
                    }
                    lastlist = list[list.length - 1];
                    list.pop();
                    listtest.pop();
                    methodtest.pop();
                    if (ctoke === "}") {
                        ternary = false;
                        if (varline[varline.length - 1] === true || (obj[obj.length - 1] === true && ltoke !== "{")) {
                            varlist.push(varlen[varlen.length - 1]);
                            varlen.pop();
                        }
                        varline.pop();
                    }
                    obj.pop();
                    if (jsscope === true && meta[a] === undefined) {
                        meta.push("");
                    }
                },
                operator = function jspretty__algorithm_operator() {
                    if (ctoke === "!") {
                        if (ltoke === "(") {
                            level[a - 1] = "x";
                        }
                        if (ltoke === "}" || ltoke === "x}") {
                            level[a - 1] = indent;
                        }
                        return level.push("x");
                    }
                    if (ctoke === "?") {
                        question = true;
                    }
                    if (ctoke === ":") {
                        //ternary verification test, because from syntax
                        //alone a ternary statement could be challenging
                        //to identify when moving backwards through the
                        //tokens.  This is especially true if one of the
                        //values is function or object
                        return (function jspretty__algorithm_operator_colon() {
                            var c = 0,
                                d = 0,
                                e = false,
                                f = 2;
                            for (c = a - 1; c > -1; c -= 1) {
                                if (types[c] === "end") {
                                    d += 1;
                                }
                                if (types[c] === "start" || types[c] === "method") {
                                    d -= 1;
                                }
                                if (types[c] === "comment" || types[c] === "comment-inline") {
                                    f += 1;
                                }
                                if (d === 0) {
                                    if (token[c] === "," && obj[obj.length - 1] === true && ternary === false) {
                                        level[a - 1] = "x";
                                        if (c === a - f && varlen.length > 0) {
                                            varlen[varlen.length - 1].push(a - 1);
                                        }
                                        return level.push("s");
                                    }
                                    if ((token[c] === "case" || token[c] === "default") && casetest[casetest.length - 1] === true && question === false) {
                                        if (a < b - 1 && token[a + 1] !== "case" && token[a + 1] !== "default") {
                                            indent += 1;
                                        }
                                        level[a - 1] = "x";
                                        return level.push(indent);
                                    }
                                    if (token[c] === "?") {
                                        ternary = true;
                                        level[a - 1] = "s";
                                        return level.push("s");
                                    }
                                    if (types[c] === "method" && (token[c + 1] === "function" || token[c + 1] === "if" || token[c + 1] === "for" || token[c + 1] === "switch")) {
                                        e = true;
                                    }
                                    if (types[c - 1] === "start" || token[c] === ";" || (ll > 0 && e === false && token[c] !== "+" && token[c] !== "-" && token[c] !== "*" && token[c] !== "/" && c === lines[ll - 1][0])) {
                                        obj[obj.length - 1] = true;
                                        level[a - 1] = "x";
                                        return level.push("s");
                                    }
                                }
                            }
                        }());
                    }
                    if (ltoke === ":") {
                        level.push("x");
                        return;
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
                    level[a - 1] = "s";
                    if ((ctoke === "-" && ltoke === "return") || ltoke === "=") {
                        return level.push("x");
                    }
                    level.push("s");
                },
                word = function jspretty__algorithm_word() {
                    if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var")) {
                        if (fortest === 0 && (methodtest[methodtest.length - 1] === false || methodtest.length === 0)) {
                            if (ltoke === "var") {
                                if (token[a + 1] === "=") {
                                    varlen.push([a]);
                                } else {
                                    varlen.push([]);
                                }
                            } else if (token[a + 1] === "=" && varlen.length > 0) {
                                varlen[varlen.length - 1].push(a);
                            }
                            meta.push("v");
                        }
                        if (jsscope === true) {
                            meta.push("v");
                        }
                    } else if (jsscope === true) {
                        if (ltoke === "function") {
                            meta.push("v");
                        } else {
                            meta.push("");
                        }
                    }
                    if (ltoke === "}" || ltoke === "x}") {
                        level[a - 1] = indent;
                    }
                    if (ctoke === "else" && ltoke === "}" && token[a - 2] === "x}") {
                        level[a - 3] -= 1;
                    }
                    if (varline.length === 1 && varline[0] === true && (ltoke === "var" || ltoke === "," || (ltoke === "function" && types[a + 1] === "method"))) {
                        globals.push(ctoke);
                    }
                    if (ctoke === "new") {
                        (function jspretty__algorithm_word_new() {
                            var c = 0,
                                d = (typeof token[a + 1] === "string") ? token[a + 1] : "",
                                e = (d === "") ? [] : [
                                    "Date", "RegExp", "Error", "XMLHttpRequest", "FileReader", "ActiveXObject", "DataView", "ArrayBuffer", "Proxy", "DOMParser", "ParallelArray", "Int8Array", "Uint8Array", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "Canvas", "CustomAnimation", "FadeAnimation", "Flash", "FormField", "Frame", "HotKey", "Image", "MenuItem", "MoveAnimation", "Point", "Rectangle", "ResizeAnimation", "RotateAnimation", "ScrollBar", "Shadow", "SQLite", "Text", "TextArea", "Timer", "URL", "Web", "Window"
                                ],
                                f = e.length;
                            for (c = 0; c < f; c += 1) {
                                if (d === e[c]) {
                                    return;
                                }
                            }
                            news += 1;
                            if (jsscope === true) {
                                token[a] = "<strong class='new'>" + token[a] + "</strong>";
                            }
                        }());
                    }
                    if (ctoke === "function" && jspace === false && a < b - 1 && token[a + 1] === "(") {
                        return level.push("x");
                    }
                    //comma operators following a return should be
                    //treated as a list, so reevaluate the list criteria
                    if (ctoke === "return") {
                        listtest[listtest.length - 1] = false;
                    }
                    if (ltoke === "-" && a > 1) {
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
                    } else if (ctoke === "in" || ((ctoke === "else" || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                        level[a - 1] = "s";
                    } else if (ctoke === "var") {
                        if (ltype === "end") {
                            level[a - 1] = indent;
                        }
                        if (varline.length === 0) {
                            varline.push(true);
                        } else {
                            varline[varline.length - 1] = true;
                        }
                        if (fortest === 0) {
                            indent += 1;
                        }
                    } else if (ctoke === "switch") {
                        question = false;
                    } else if (ctoke === "default" || ctoke === "case") {
                        if (casetest[casetest.length - 1] === false) {
                            if (ltoke === "{" || ltoke === "x{") {
                                indent -= 1;
                            }
                            level[a - 1] = indent;
                            casetest[casetest.length - 1] = true;
                        } else if ((ltoke === ":" && (types[a - 1] === "comment-inline" || types[a - 1] === "comment")) || ltoke !== ":") {
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
                    }
                    level.push("s");
                };
            for (a = 0; a < b; a += 1) {
                if (jsscope === true && types[a] !== "start" && types[a] !== "word" && types[a] !== "end") {
                    meta.push("");
                }
                ctype = types[a];
                ctoke = token[a];
                if (a - 1 > lines[ll][0]) {
                    ll += 1;
                }
                if (ctype === "comment") {
                    if (ltoke === "=" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                        level[a - 1] = "s";
                    } else {
                        level[a - 1] = indent;
                    }
                    level.push(indent);
                }
                if (ctype === "comment-inline") {
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
                }
                if (ctype === "regex") {
                    level.push("x");
                }
                if (ctype === "literal") {
                    level.push("s");
                }
                if (ctype === "separator") {
                    separator();
                }
                if (ctype === "method") {
                    level[a - 1] = "x";
                    level.push("x");
                    list.push(false);
                    listtest.push(false);
                    methodtest.push(true);
                    obj.push(false);
                    if (fortest > 0) {
                        fortest += 1;
                    }
                }
                if (ctype === "start") {
                    start();
                }
                if (ctype === "end") {
                    end();
                }
                if (ctype === "operator") {
                    operator();
                }
                if (ctype === "word") {
                    word();
                }
                if (ctype !== "comment" && ctype !== "comment-inline") {
                    ltype = ctype;
                    ltoke = ctoke;
                }
            }
        }());
        //the result function generates the out
        if (jsscope === true) {
            result = (function jspretty__resultJSScope() {
                var a = 0,
                    b = token.length,
                    c = [],
                    d = 0,
                    e = 2,
                    f = "",
                    g = 1,
                    h = 0,
                    i = (function () {
                        var aa = 1,
                            bb = 1;
                        if (types[0] !== "comment" || (token[0].indexOf("//") === 0 && (lines.length === 0 || lines[0][0] > 0)) || types[1] !== "comment") {
                            return 1;
                        }
                        do {
                            if (token[aa].indexOf("/*") === 0) {
                                bb += 1;
                            }
                            aa += 1;
                        } while (types[aa] === "comment");
                        return bb;
                    }()),
                    jj = [],
                    comfold = -1, //if current folding is for comment
                    data = [
                        "<div class='beautify' id='pd-jsscope'><ol class='count'>", "<li>", 1, "</li>"
                    ],
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
                    //token 0 then decrement i.
                    folder = function jspretty__result_folder() {
                        var ff = (data.length - (i * 3) > 0) ? data.length - (i * 3) : 1,
                            gg = a,
                            hh = data[ff + 1] || 1,
                            ii = true,
                            kk = gg;
                        if (types[a] === "comment" && comfold === -1) {
                            comfold = a;
                        } else if (types[a] !== "comment") {
                            gg = meta[a];
                            do {
                                kk -= 1;
                            } while (token[kk] !== "function");
                            kk -= 1;
                            if (token[kk] === "(" && types[kk] === "start") {
                                do {
                                    kk -= 1;
                                } while (types[kk] === "start" && token[kk] === "(");
                            }
                            if (token[kk] === "=" || token[kk] === ":" || token[kk] === "," || (token[kk + 1] === "(" && types[kk + 1] === "start")) {
                                ii = false;
                            }
                        }
                        if (types[a] === "comment" && lines[d - 1] !== undefined && lines[d - 1][1] === true) {
                            ff -= 3;
                            hh -= 1;
                        }
                        data[ff] = "<li class='fold' onclick='pd.beaufold(this," + hh + ",xxx);'>";
                        data[ff + 1] = "- " + hh;
                        jj.push([
                            ff, gg, ii
                        ]);
                    },
                    //determines where folding ends
                    //function assignments require one more line for
                    //closing than everything else
                    foldclose = function jspretty__result_foldclose() {
                        var ff = (function jspretty_result_foldclose_end() {
                                if (comfold > -1 || jj[jj.length - 1][2] === true) {
                                    return e - i - 1;
                                }
                                return e - i;
                            }()),
                            gg = 0;
                        if (a > 1 && token[a].indexOf("}</em>") === token[a].length - 6 && token[a - 1].indexOf("{</em>") === token[a - 1].length - 6) {
                            for (gg = data.length - 1; gg > 0; gg -= 1) {
                                if (typeof data[gg] === "string" && data[gg].charAt(0) === "-") {
                                    data[gg - 1] = "<li>";
                                    data[gg] = Number(data[gg].substr(1));
                                    jj.pop();
                                    return;
                                }
                            }
                        }
                        if (jj[jj.length - 1][1] === b - 1 && token[a].indexOf("<em ") === 0) {
                            ff += 1;
                        }
                        data[jj[jj.length - 1][0]] = data[jj[jj.length - 1][0]].replace("xxx", ff);
                        jj.pop();
                    },
                    //splits block comments, which are single tokens,
                    //into multiple lines of output
                    blockline = function jspretty__result_blockline(x) {
                        var ff = x.split("\n"),
                            hh = 0,
                            ii = ff.length - 1;
                        if (lines[d] !== undefined && lines[d][0] === a && d === a && d > 0) {
                            data.push("<li>");
                            data.push(e);
                            data.push("</li>");
                            e += 1;
                        }
                        for (hh = 0; hh < ii; hh += 1) {
                            data.push("<li>");
                            data.push(e);
                            data.push("</li>");
                            e += 1;
                            ff[hh] = ff[hh] + "<em>&#xA;</em></li><li class='c0'>";
                        }
                        return ff.join("").replace(/\r/g, "");
                    },
                    //finds the variables if the jsscope option is true
                    findvars  = function jspretty__result_findvars(x) {
                        var cc  = meta[x],
                            dd  = meta[cc],
                            ee  = 0,
                            ff  = 0,
                            hh  = dd.length,
                            ii  = 1,
                            jjj = true,
                            kkk = [],
                            lll = 0;
                        if (types[a - 1] === "word" && token[a - 1] !== "function") {
                            kkk = token[a - 1].split(" ");
                            token[a - 1] = "<em class='s" + g + "'>" + kkk[0] + "</em>";
                            lll = kkk.length;
                            if (lll > 1) {
                                do {
                                    token[ee] = token[ee] + " ";
                                    lll -= 1;
                                } while (lll > 1);
                            }
                        }
                        if (hh > 0) {
                            for (ee = cc - 1; ee > a; ee -= 1) {
                                kkk = token[ee].split(" ");
                                if (types[ee] === "word") {
                                    for (ff = 0; ff < hh; ff += 1) {
                                        if (kkk[0] === dd[ff] && token[ee - 1] !== ".") {
                                            if (token[ee - 1] === "function" && token[ee + 1] === "(") {
                                                token[ee] = "<em class='s" + (g + 1) + "'>" + kkk[0] + "</em>";
                                                lll = kkk.length;
                                                if (lll > 1) {
                                                    do {
                                                        token[ee] = token[ee] + " ";
                                                        lll -= 1;
                                                    } while (lll > 1);
                                                }
                                            } else if (token[ee + 1] !== ":" || (token[ee + 1] === ":" && level[ee] !== "x")) {
                                                token[ee] = "<em class='s" + g + "'>" + kkk[0] + "</em>";
                                                lll = kkk.length;
                                                if (lll > 1) {
                                                    do {
                                                        token[ee] = token[ee] + " ";
                                                        lll -= 1;
                                                    } while (lll > 1);
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                                if (jjj === true) {
                                    if (types[ee] === "end") {
                                        ii += 1;
                                    } else if (types[ee] === "start" || types[ee] === "method") {
                                        ii -= 1;
                                    }
                                    if (ii === 0 && token[ee] === "{") {
                                        token[ee] = "<em class='s" + g + "'>{</em>";
                                        jjj = false;
                                    }
                                }
                            }
                        } else {
                            for (ee = a + 1; ee < cc; ee += 1) {
                                if (types[ee] === "end") {
                                    ii -= 1;
                                } else if (types[ee] === "start" || types[ee] === "method") {
                                    ii += 1;
                                }
                                if (ii === 1 && token[ee] === "{") {
                                    token[ee] = "<em class='s" + g + "'>{</em>";
                                    return;
                                }
                            }
                        }
                    },
                    indent = jlevel,
                    removeEm = function jspretty__result_removeEm(x) {
                        var bb = x.lastIndexOf("<em "),
                            cc = x.substring(bb),
                            dd = cc.indexOf("'>");
                        return x.substring(0, bb) + cc.substring(dd + 2).replace("</em>", "");
                    },
                    //defines the character(s) and character length of a
                    //single indentation
                    tab = (function jspretty__result_tabScope() {
                        var aa = jchar,
                            bb = jsize,
                            cc = [];
                        for (bb; bb > 0; bb -= 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    //some prebuilt color coded tabs
                    lscope = [
                        "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                    ],
                    //a function for calculating indentation after each new
                    //line
                    nl = function jspretty__result_nlScope(x) {
                        var dd = 0;
                        data.push("<li>");
                        data.push(e);
                        data.push("</li>");
                        e += 1;
                        if (a < b - 1 && token[a + 1].indexOf("/*") === 0) {
                            c.push("<em>&#xA;</em></li><li class='c0'>");
                        } else {
                            c.push("<em>&#xA;</em></li><li class='l" + g + "'>");
                            if (x > 0) {
                                dd = g;
                                if (g > 0) {
                                    if (g === x + 1 && x > 0) {
                                        dd -= 1;
                                    }
                                    c.push(lscope[dd - 1]);
                                }
                            }
                        }
                        for (dd; dd < x; dd += 1) {
                            c.push(tab);
                        }
                    };
                (function jspretty__result_varSpaces() {
                    var aa = 0,
                        bb = 0,
                        cc = 0,
                        dd = 0,
                        ee  = 0,
                        ff  = "";
                    for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                        if (varlist[aa] !== undefined) {
                            bb = varlist[aa].length;
                            if (bb > 1) {
                                dd = token[varlist[aa][0]].length;
                                for (cc = 1; cc < bb; cc += 1) {
                                    ee = token[varlist[aa][cc]].length;
                                    if (ee > dd) {
                                        dd = ee;
                                    }
                                }
                                for (cc = 0; cc < bb; cc += 1) {
                                    ff = token[varlist[aa][cc]];
                                    ee = ff.length;
                                    if (ee < dd) {
                                        do {
                                            ff += " ";
                                            ee += 1;
                                        } while (ee < dd);
                                    }
                                    token[varlist[aa][cc]] = ff;
                                }
                            }
                        }
                    }
                }());
                if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                    c.push("<ol class='data'><li class='c0'>");
                } else {
                    c.push("<ol class='data'><li>");
                }
                for (a = 0; a < indent; a += 1) {
                    c.push(tab);
                }
                //its important to find the variables separately from
                //building the output so that recursive flows in the loop
                //incrementation do not present simple counting collisions
                //as to what gets modified versus what gets included
                for (a = b - 1; a > -1; a -= 1) {
                    if (typeof meta[a] === "number") {
                        g -= 1;
                        findvars(a);
                    } else if (meta[a] !== undefined && typeof meta[a] !== "string" && typeof meta[a] !== "number" && a > 0) {
                        token[a] = "<em class='s" + g + "'>" + token[a] + "</em>";
                        g += 1;
                        if (g > 16) {
                            g = 16;
                        }
                    }
                }
                (function jspretty__result_globals() {
                    var aa = 0,
                        bb = token.length,
                        cc = globals,
                        dd = cc.length,
                        ee = 0,
                        ff = [],
                        gg = 0;
                    for (aa = bb - 1; aa > 0; aa -= 1) {
                        if (types[aa] === "word" && (token[aa + 1] !== ":" || (token[aa + 1] === ":" && level[aa + 1] === "x")) && token[aa].indexOf("<em ") < 0) {
                            ff = token[aa].split(" ");
                            for (ee = dd - 1; ee > -1; ee -= 1) {
                                if (ff[0] === cc[ee] && token[aa - 1] !== ".") {
                                    if (token[aa - 1] === "function" && types[aa + 1] === "method") {
                                        token[aa] = "<em class='s1'>" + ff[0] + "</em>";
                                        gg = ff.length;
                                        if (gg > 1) {
                                            do {
                                                token[aa] = token[aa] + " ";
                                                gg -= 1;
                                            } while (gg > 1);
                                        }
                                    } else {
                                        token[aa] = "<em class='s0'>" + ff[0] + "</em>";
                                        gg = ff.length;
                                        if (gg > 1) {
                                            do {
                                                token[aa] = token[aa] + " ";
                                                gg -= 1;
                                            } while (gg > 1);
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }());
                g = 0;
                //this loops combines the white space as determined from the
                //algorithm with the tokens to create the output
                for (a = 0; a < b; a += 1) {
                    if (typeof meta[a] === "number") {
                        folder();
                    }
                    if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || (lines[d] !== undefined && lines[d][1] === true))) {
                        folder();
                        comfold = a;
                    }
                    if (comfold > -1 && types[a] !== "comment") {
                        foldclose();
                        comfold = -1;
                    }
                    if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                        c.push(blockline(token[a]));
                    } else {
                        if (typeof meta[a] === "number") {
                            g += 1;
                            if (g > 16) {
                                g = 16;
                            }
                            c.push(token[a]);
                        } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                            c.push(token[a]);
                            g -= 1;
                            h = c.length - 1;
                            do {
                                h -= 1;
                            } while (h > 0 && c[h].indexOf("</li><li") < 0);
                            c[h] = c[h].replace(/class\='l\d+'/, "class='l" + g + "'");
                        } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}") {
                            if (types[a] === "comment") {
                                if (a === 0) {
                                    c[0] = "<ol class='data'><li class='c0'>";
                                } else {
                                    h = c.length - 1;
                                    if (c[h].indexOf("<li") < 0) {
                                        do {
                                            c[h] = c[h].replace(/<em class\='[a-z]\d+'>/g, "").replace(/<\/em>/g, "");
                                            h -= 1;
                                            if (h > 0 && c[h] === undefined) {
                                                h -= 1;
                                            }
                                        } while (h > 0 && c[h - 1] !== undefined && c[h].indexOf("<li") < 0);
                                    }
                                    c[h] = c[h].replace(/class\='l\d+'/, "class='c0'");
                                }
                            }
                            c.push(token[a]);
                        }
                    }
                    //this condition performs additional calculations if
                    //jpres === true.  jpres determines whether empty lines
                    //should be preserved from the code input
                    if (jpres === true && lines[d] !== undefined && a === lines[d][0] && level[a] !== "x" && level[a] !== "s") {
                        //special treatment for math operators
                        if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                            //comments get special treatment
                            if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                nl(indent);
                                c.push(tab);
                                level[a] = "x";
                            } else {
                                indent = level[a];
                                if (lines[d][1] === true) {
                                    c.push("\n");
                                }
                                nl(indent);
                                c.push(tab);
                                c.push(token[a + 1]);
                                nl(indent);
                                c.push(tab);
                                level[a + 1] = "x";
                                a += 1;
                            }
                        } else if (lines[d][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                            if ((token[a] !== "x}" || isNaN(level[a]) === true) && (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator")))) {
                                data.push("<li>");
                                data.push(e);
                                data.push("</li>");
                                e += 1;
                                if (types[a] === "comment") {
                                    c.push("<em>&#xA;</em></li><li class='c0'>");
                                } else {
                                    i += 1;
                                    nl(indent);
                                }
                            }
                        }
                        d += 1;
                    }
                    //adds a new line and no indentation
                    if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                        nl(jlevel);
                    } else if (level[a] === "s" && token[a] !== "x}") {
                        c.push(" ");
                        //adds a new line and indentation
                    } else if (level[a] !== "x" && token[a] === "x}" && typeof meta[a + 1] !== "string" && typeof meta[a + 1] !== "number") {
                        c[c.length - 1] = removeEm(c[c.length - 1]);
                    } else if (level[a] !== "x" && (token[a] !== "x}" || (d > 0 && lines[d - 1][1] === true && lines[d - 1][0] === a))) {
                        indent = level[a];
                        nl(indent);
                    }
                    if (lines[d] !== undefined && lines[d][0] < a) {
                        d += 1;
                    }
                    if (jj.length > 0) {
                        if (a === jj[jj.length - 1][1] && comfold === -1) {
                            foldclose();
                        }
                    }
                }
                //this logic is necessary to some line counting corrections
                //to the HTML output
                f = c[c.length - 1];
                if (f.indexOf("<li") > 0) {
                    c[c.length - 1] = "<em>&#xA;</em></li>";
                } else if (f.indexOf("</li>") < 0) {
                    c.push("<em>&#xA;</em></li>");
                }
                c.push("</ol></div>");
                f = c.join("");
                g = f.match(/<li/g).length;
                if (e - 1 > g) {
                    e -= 1;
                    do {
                        data.pop();
                        data.pop();
                        data.pop();
                        e -= 1;
                    } while (e > g);
                }
                data.push("</ol>");
                c = [
                    "<p>Scope analysis does not provide support for undeclared variables.</p>", "<p><em>", v, "</em> instances of <strong>missing semicolons</strong> counted.</p>", "<p><em>", news, "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>", data.join(""), f
                ];
                summary = c.join("");
                data = [];
                c = [];
                return "";
            }()).replace(/(\s+)$/, "");
        } else {
            result = (function jspretty__resultRegular() {
                var a = 0,
                    b = token.length,
                    c = [],
                    d = 0,
                    blockspace = function jspretty__result_blockspace(x) {
                        var y = x.replace(/\n/g, "");
                        x = x.substr(1);
                        if (x.indexOf("\n") === 0 && y === "") {
                            return "\n\n";
                        }
                        if (x.indexOf("\n") > -1) {
                            return "\n\n ";
                        }
                        return "\n ";
                    },
                    indent = jlevel,
                    //defines the character(s) and character length of a
                    //single indentation
                    tab = (function jspretty__result_tab() {
                        var aa = jchar,
                            bb = jsize,
                            cc = [];
                        for (bb; bb > 0; bb -= 1) {
                            cc.push(aa);
                        }
                        return cc.join("");
                    }()),
                    //a function for calculating indentation after each new
                    //line
                    nl = function jspretty__result_nl(x) {
                        var dd = 0;
                        c.push("\n");
                        for (dd; dd < x; dd += 1) {
                            c.push(tab);
                        }
                    };
                (function jspretty__result_varSpaces() {
                    var aa = 0,
                        bb = 0,
                        cc = 0,
                        dd = 0,
                        e  = 0,
                        f  = "";
                    for (aa = varlist.length - 1; aa > -1; aa -= 1) {
                        if (varlist[aa] !== undefined) {
                            bb = varlist[aa].length;
                            if (bb > 1) {
                                dd = token[varlist[aa][0]].length;
                                for (cc = 1; cc < bb; cc += 1) {
                                    e = token[varlist[aa][cc]].length;
                                    if (e > dd) {
                                        dd = e;
                                    }
                                }
                                for (cc = 0; cc < bb; cc += 1) {
                                    f = token[varlist[aa][cc]];
                                    e = f.length;
                                    if (e < dd) {
                                        do {
                                            f += " ";
                                            e += 1;
                                        } while (e < dd);
                                    }
                                    token[varlist[aa][cc]] = f;
                                }
                            }
                        }
                    }
                }());
                for (a = 0; a < indent; a += 1) {
                    c.push(tab);
                }
                //this loops combines the white space as determined from the
                //algorithm with the tokens to create the output
                for (a = 0; a < b; a += 1) {
                    if (types[a] === "comment") {
                        c.push(token[a].replace(/\n\s+/g, blockspace));
                    } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}") {
                        c.push(token[a]);
                    }
                    //this condition performs additional calculations if
                    //jpres === true.  jpres determines whether empty lines
                    //should be preserved from the code input
                    if (jpres === true && lines[d] !== undefined && a === lines[d][0] && level[a] !== "x" && level[a] !== "s") {
                        //special treatment for math operators
                        if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                            //comments get special treatment
                            if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                nl(indent);
                                c.push(tab);
                                level[a] = "x";
                            } else {
                                indent = level[a];
                                if (lines[d][1] === true) {
                                    c.push("\n");
                                }
                                nl(indent);
                                c.push(tab);
                                c.push(token[a + 1]);
                                nl(indent);
                                c.push(tab);
                                level[a + 1] = "x";
                                a += 1;
                            }
                        } else if (lines[d][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                            if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator"))) {
                                if (token[a] !== "x}" || isNaN(level[a]) === true || level[a] === "x") {
                                    c.push("\n");
                                }
                            }
                        }
                        d += 1;
                    }
                    //adds a new line and no indentation
                    if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                        nl(jlevel);
                    } else if (level[a] === "s" && token[a] !== "x}") {
                        c.push(" ");
                        //adds a new line and indentation
                    } else if (level[a] !== "x" && (token[a] !== "x}" || (d > 0 && lines[d - 1][1] === true && lines[d - 1][0] === a))) {
                        indent = level[a];
                        nl(indent);
                    }
                    if (lines[d] !== undefined && lines[d][0] < a) {
                        d += 1;
                    }
                }
                return c.join("");
            }()).replace(/(\s+)$/, "");
        }
        //the analysis report is generated in this function
        if (summary !== "diff" && jsscope === false) {
            (function jspretty__report() {
                var e = source.length - 1,
                    f = result.split("\n").length,
                    i = 0,
                    s = [],
                    z = [],
                    ww = w[0],
                    output,
                    zero = function jspretty__report_zero(x, y) {
                        if (y === 0) {
                            return "0.00%";
                        }
                        return ((x / y) * 100).toFixed(2) + "%";
                    },
                    drawRow = function jspretty__report_drawRow(w, x, y, z, Z) {
                        var aa = ["<tr><th>Keyword '"];
                        aa.push(w);
                        aa.push("'</th><td ");
                        aa.push(x);
                        aa.push(">");
                        aa.push(y);
                        aa.push("</td><td>");
                        aa.push(zero(y, m[54]));
                        aa.push("</td><td>");
                        aa.push(zero(y, Z[0]));
                        aa.push("</td><td>");
                        aa.push(z);
                        aa.push("</td><td>");
                        aa.push(zero(z, m[55]));
                        aa.push("</td><td>");
                        aa.push(zero(z, Z[1]));
                        aa.push("</td></tr>");
                        return aa.join("");
                    };
                if (m[0] > 0) {
                    s[0] = " class='bad'";
                } else {
                    s[0] = "";
                }
                if (m[6] > 0) {
                    s[1] = " class='bad'";
                } else {
                    s[1] = "";
                }
                if (m[16] > 0) {
                    s[2] = " class='bad'";
                } else {
                    s[2] = "";
                }
                if (m[42] > 0) {
                    s[3] = " class='bad'";
                } else {
                    s[3] = "";
                }
                if (m[54] > 0) {
                    s[4] = " class='bad'";
                } else {
                    s[4] = "";
                }
                if (news > 0) {
                    s[5] = " class='bad'";
                } else {
                    s[5] = "";
                }
                i = (w[0] + w[1] + w[2] + w[3]);
                n.push(l[2] + n[0] + n[2] + n[3] + n[4]);
                n.push(l[2] + n[1] + n[2] + n[3] + n[4]);
                j.push(j[0] + k[0]);
                j.push(j[1] + k[1]);
                m[1] = m[0] * 5;
                m[3] = m[2] * 5;
                m[5] = m[4] * 4;
                m[7] = m[6] * 8;
                m[9] = m[8] * 7;
                m[11] = m[10] * 6;
                m[13] = m[12] * 2;
                m[15] = m[14] * 4;
                m[17] = m[16] * 4;
                m[19] = m[18] * 3;
                m[21] = m[20] * 8;
                m[23] = m[22] * 2;
                m[25] = m[24] * 2;
                m[27] = m[26] * 5;
                m[29] = m[28] * 3;
                m[31] = m[30] * 6;
                m[33] = m[32] * 6;
                m[35] = m[34] * 4;
                m[37] = m[36] * 6;
                m[39] = m[38] * 3;
                m[41] = m[40] * 5;
                m[43] = m[42] * 4;
                m[45] = m[44] * 8;
                m[47] = m[46] * 6;
                m[49] = m[48] * 5;
                m[51] = m[50] * 5;
                m[53] = m[52] * 3;
                m[55] = m[54] * 7;
                m[56] = m[0] + m[2] + m[4] + m[6] + m[8] + m[10] + m[12] + m[14] + m[16] + m[18] + m[20] + m[22] + m[24] + m[26] + m[28] + m[30] + m[32] + m[34] + m[36] + m[38] + m[40] + m[42] + m[44] + m[46] + m[48] + m[50] + m[52] + m[54];
                m[57] = m[1] + m[3] + m[5] + m[7] + m[9] + m[11] + m[13] + m[15] + m[17] + m[19] + m[21] + m[23] + m[25] + m[27] + m[29] + m[31] + m[33] + m[35] + m[37] + m[39] + m[41] + m[43] + m[45] + m[47] + m[49] + m[51] + m[53] + m[55];
                z.push(j[2] + l[0] + n[5] + m[56] + o[0] + p[0] + q[0] + i);
                z.push(j[3] + l[1] + n[6] + m[57] + o[1] + p[1] + q[1] + i);
                if (ww === 0) {
                    ww = 1;
                }
                //The fastest way to build a string dynamically is by
                //pushing into an array, because the push method creates
                //a new index at the end of the array without checking
                //for length.  String concatenation on the other hand
                //always checks string length, so the operation becomes
                //progressively slower with each operation.
                output = ["<div id='doc'>"];
                output.push("<p><em>");
                output.push(v);
                output.push("</em> instance");
                if (v !== 1) {
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
                output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>");
                output.push("</thead><tbody><tr><th>Total Character Size</th><td>");
                output.push(e);
                output.push("</td><td>");
                output.push(result.length);
                output.push("</td><td>");
                output.push(result.length - e);
                output.push("</td><td>");
                output.push((((result.length - e) / e) * 100).toFixed(2));
                output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
                output.push(ww);
                output.push("</td><td>");
                output.push(f);
                output.push("</td><td>");
                output.push(f - ww);
                output.push("</td><td>");
                output.push((((f - ww) / ww) * 100).toFixed(2));
                output.push("%</td></tr></tbody></table>");
                output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScript component analysis</caption><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percentage Quantity from Section</th>");
                output.push("<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage Length from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
                output.push("<tr><th>Total Accounted</th><td>");
                output.push(z[0]);
                output.push("</td><td>100.00%</td><td>100.00%</td><td>");
                output.push(z[1]);
                output.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></tr><tr><th>Block Comments</th><td>");
                output.push(j[0]);
                output.push("</td><td>");
                output.push(zero(j[0], j[2]));
                output.push("</td><td>");
                output.push(zero(j[0], z[0]));
                output.push("</td><td>");
                output.push(j[1]);
                output.push("</td><td>");
                output.push(zero(j[1], j[3]));
                output.push("</td><td>");
                output.push(zero(j[1], z[1]));
                output.push("</td></tr><tr><th>Inline Comments</th><td>");
                output.push(k[0]);
                output.push("</td><td>");
                output.push(zero(k[0], j[2]));
                output.push("</td><td>");
                output.push(zero(k[0], z[0]));
                output.push("</td><td>");
                output.push(k[1]);
                output.push("</td><td>");
                output.push(zero(k[1], j[3]));
                output.push("</td><td>");
                output.push(zero(k[1], z[1]));
                output.push("</td></tr><tr><th>Comment Total</th><td>");
                output.push(j[2]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(j[2], z[0]));
                output.push("</td><td>");
                output.push(j[3]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(j[3], z[1]));
                output.push("</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></tr><tr><th>New Lines</th><td>");
                output.push(w[0]);
                output.push("</td><td>");
                output.push(zero(w[0], i));
                output.push("</td><td>");
                output.push(zero(w[0], z[0]));
                output.push("</td><td>");
                output.push(w[0]);
                output.push("</td><td>");
                output.push(zero(w[0], i));
                output.push("</td><td>");
                output.push(zero(w[0], z[1]));
                output.push("</td></tr><tr><th>Spaces</th><td>");
                output.push(w[1]);
                output.push("</td><td>");
                output.push(zero(w[1], i));
                output.push("</td><td>");
                output.push(zero(w[1], z[0]));
                output.push("</td><td>");
                output.push(w[1]);
                output.push("</td><td>");
                output.push(zero(w[1], i));
                output.push("</td><td>");
                output.push(zero(w[1], z[1]));
                output.push("</td></tr><tr><th>Tabs</th><td>");
                output.push(w[2]);
                output.push("</td><td>");
                output.push(zero(w[2], i));
                output.push("</td><td>");
                output.push(zero(w[2], z[0]));
                output.push("</td><td>");
                output.push(w[2]);
                output.push("</td><td>");
                output.push(zero(w[2], i));
                output.push("</td><td>");
                output.push(zero(w[2], z[1]));
                output.push("</td></tr><tr><th>Other Whitespace</th><td>");
                output.push(w[3]);
                output.push("</td><td>");
                output.push(zero(w[3], i));
                output.push("</td><td>");
                output.push(zero(w[3], z[0]));
                output.push("</td><td>");
                output.push(w[3]);
                output.push("</td><td>");
                output.push(zero(w[3], i));
                output.push("</td><td>");
                output.push(zero(w[3], z[1]));
                output.push("</td></tr><tr><th>Total Whitespace</th><td>");
                output.push(i);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(i, z[0]));
                output.push("</td><td>");
                output.push(i);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(i, z[1]));
                output.push("</td></tr><tr><th colspan='7'>Literals</th></tr><tr><th>Strings</th><td>");
                output.push(l[0]);
                output.push("</td><td>");
                output.push(zero(l[0], l[0] + p[0] + q[0]));
                output.push("</td><td>");
                output.push(zero(l[0], z[0]));
                output.push("</td><td>");
                output.push(l[1]);
                output.push("</td><td>");
                output.push(zero(l[1], l[1] + p[1] + q[1]));
                output.push("</td><td>");
                output.push(zero(l[1], z[1]));
                output.push("</td></tr><tr><th>Numbers</th><td>");
                output.push(q[0]);
                output.push("</td><td>");
                output.push(zero(q[0], l[0] + p[0] + q[0]));
                output.push("</td><td>");
                output.push(zero(q[0], z[0]));
                output.push("</td><td>");
                output.push(q[1]);
                output.push("</td><td>");
                output.push(zero(q[1], l[1] + p[1] + q[1]));
                output.push("</td><td>");
                output.push(zero(q[1], z[1]));
                output.push("</td></tr><tr><th>Regular Expressions</th><td>");
                output.push(p[0]);
                output.push("</td><td>");
                output.push(zero(p[0], l[0] + p[0] + q[0]));
                output.push("</td><td>");
                output.push(zero(p[0], z[0]));
                output.push("</td><td>");
                output.push(p[1]);
                output.push("</td><td>");
                output.push(zero(p[1], l[1] + p[1] + q[1]));
                output.push("</td><td>");
                output.push(zero(p[1], z[1]));
                output.push("</td></tr><tr><th>Total Literals</th><td>");
                output.push(l[0] + p[0] + q[0]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(l[0] + p[0] + q[0], z[0]));
                output.push("</td><td>");
                output.push(l[1] + p[1] + q[1]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(l[1] + p[1] + q[1], z[1]));
                output.push("</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Characters</th><td>");
                output.push(l[2]);
                output.push("</td><td>");
                output.push(zero(l[2], n[5]));
                output.push("</td><td>");
                output.push(zero(l[2], z[0]));
                output.push("</td><td>");
                output.push(l[2]);
                output.push("</td><td>");
                output.push(zero(l[2], n[6]));
                output.push("</td><td>");
                output.push(zero(l[2], z[1]));
                output.push("</td></tr><tr><th>Commas</th><td>");
                output.push(n[2]);
                output.push("</td><td>");
                output.push(zero(n[2], n[5]));
                output.push("</td><td>");
                output.push(zero(n[2], z[0]));
                output.push("</td><td>");
                output.push(n[2]);
                output.push("</td><td>");
                output.push(zero(n[2], n[6]));
                output.push("</td><td>");
                output.push(zero(n[2], z[1]));
                output.push("</td></tr><tr><th>Containment Characters</th><td>");
                output.push(n[4]);
                output.push("</td><td>");
                output.push(zero(n[4], n[5]));
                output.push("</td><td>");
                output.push(zero(n[4], z[0]));
                output.push("</td><td>");
                output.push(n[4]);
                output.push("</td><td>");
                output.push(zero(n[4], n[6]));
                output.push("</td><td>");
                output.push(zero(n[4], z[1]));
                output.push("</td></tr><tr><th>Semicolons</th><td>");
                output.push(n[3]);
                output.push("</td><td>");
                output.push(zero(n[3], n[5]));
                output.push("</td><td>");
                output.push(zero(n[3], z[0]));
                output.push("</td><td>");
                output.push(n[3]);
                output.push("</td><td>");
                output.push(zero(n[3], n[6]));
                output.push("</td><td>");
                output.push(zero(n[3], z[1]));
                output.push("</td></tr><tr><th>Operators</th><td>");
                output.push(n[0]);
                output.push("</td><td>");
                output.push(zero(n[0], n[5]));
                output.push("</td><td>");
                output.push(zero(n[0], z[0]));
                output.push("</td><td>");
                output.push(n[1]);
                output.push("</td><td>");
                output.push(zero(n[1], n[6]));
                output.push("</td><td>");
                output.push(zero(n[1], z[1]));
                output.push("</td></tr><tr><th>Total Syntax Characters</th><td>");
                output.push(n[5]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(n[5], z[0]));
                output.push("</td><td>");
                output.push(n[6]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(n[6], z[1]));
                output.push("</td></tr>");
                output.push("<tr><th colspan='7'>Keywords</th></tr>");
                output.push(drawRow("alert", s[0], m[0], m[1], z));
                output.push(drawRow("break", "", m[2], m[3], z));
                output.push(drawRow("case", "", m[4], m[5], z));
                output.push(drawRow("catch", "", m[48], m[49], z));
                output.push(drawRow("console", s[4], m[54], m[55], z));
                output.push(drawRow("continue", s[1], m[6], m[7], z));
                output.push(drawRow("default", "", m[8], m[9], z));
                output.push(drawRow("delete", "", m[10], m[11], z));
                output.push(drawRow("do", "", m[12], m[13], z));
                output.push(drawRow("document", "", m[44], m[45], z));
                output.push(drawRow("else", "", m[14], m[15], z));
                output.push(drawRow("eval", s[2], m[16], m[17], z));
                output.push(drawRow("for", "", m[18], m[19], z));
                output.push(drawRow("function", "", m[20], m[21], z));
                output.push(drawRow("if", "", m[22], m[23], z));
                output.push(drawRow("in", "", m[24], m[25], z));
                output.push(drawRow("label", "", m[26], m[27], z));
                output.push(drawRow("new", s[5], m[28], m[29], z));
                output.push(drawRow("return", "", m[30], m[31], z));
                output.push(drawRow("switch", "", m[32], m[33], z));
                output.push(drawRow("this", "", m[34], m[35], z));
                output.push(drawRow("throw", "", m[50], m[51], z));
                output.push(drawRow("typeof", "", m[36], m[37], z));
                output.push(drawRow("var", "", m[38], m[39], z));
                output.push(drawRow("while", "", m[40], m[41], z));
                output.push(drawRow("with", s[3], m[42], m[43], z));
                output.push(drawRow("window", "", m[46], m[47], z));
                output.push(drawRow("try", "", m[52], m[53], z));
                output.push("<tr><th>Total Keywords</th><td>");
                output.push(m[56]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(m[56], z[0]));
                output.push("</td><td>");
                output.push(m[57]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(m[57], z[1]));
                output.push("</td></tr>");
                output.push("<tr><th colspan='7'>Variables and Other Keywords</th></tr><tr><th>Variable Instances</th><td>");
                output.push(o[0]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(o[0], z[0]));
                output.push("</td><td>");
                output.push(o[1]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(o[1], z[1]));
                output.push("</td></tr></tbody></table></div>");
                summary = output.join("");
            }());
        }
        //Some interpreters are not very efficient with large scale
        //garbage collection, which can result in memory leaks.
        //This assignment over the data is a means to purge the data so
        //that if garbage collection is missed the fragments remaining
        //are small references.
        token = [];
        types = [];
        level = [];
        lines = [];
        meta = [];
        varlist = [];
        return result;
    },
    //the edition values use the format YYMMDD for dates.
    edition = {
        jspretty: 131202
    };
edition.latest = edition.jspretty;