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
var summary  = "",
    jspretty = function jspretty(args) {
        "use strict";
        var source     = (typeof args.source === "string" && args.source.length > 0) ? args.source + " " : "Error: no source code supplied to jspretty!",
            jbrace     = (args.braces === "allman") ? true : false,
            jchar      = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
            jcomment   = (args.comments === "noindent") ? "noindent" : (args.comments === "nocomment") ? "nocomment" : "indent",
            jelseline  = (args.elseline === true || args.elseline === "true") ? true : false,
            jlevel     = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
            jmode      = (args.mode !== undefined && args.mode.toLowerCase() === "minify") ? "minify" : "beautify",
            jobfuscate = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
            jpres      = (args.preserve === false || args.preserve === "false") ? false : true,
            jscorrect  = (args.correct === true || args.correct === "true") ? true : false,
            jsize      = (args.insize > 0) ? args.insize : ((Number(args.insize) > 0) ? Number(args.insize) : 4),
            jspace     = (args.space === false || args.space === "false") ? false : true,
            jsscope    = (args.jsscope === true || args.jsscope === "true" || (jmode === "minify" && jobfuscate === true)) ? true : false,
            jtopcoms   = (args.topcoms === true || args.topcoms === "true") ? true : false,
            jvarspace  = (args.varspace === false || args.varspace === "false") ? false : true,
            sourcemap  = [
                0, ""
            ],
            //all data that is created from the tokization process is
            //stored in the following four arrays: token, types, level,
            //and lines.  All of this data passes from the tokenization
            //process to be analyzed by the algorithm
            token      = [], //stores parsed tokens
            types      = [], //parallel array that describes the tokens
            level      = [], //parallel array that list indentation per token
            lines      = [], //used to preserve empty lines
            globals    = [], //which variables are declared globals
            //meta used to find scope and variables for jsscope
            //these values are assigned in parallel to the other arrays
            //* irrelevant tokens are represented with an empty string
            //* first '(' following 'function' is token index number of
            //  function's closing curly brace
            //* variables are represented with the value 'v'
            //* the closing brace of a function is an array of variables
            meta       = [], //lists a number at the opening paren of a
            //function that points to the token index of the function's
            //closing curly brace.  At the closing curly brace index
            //this array stores an array indicating the names of
            //variables declared in the current function for coloring by
            //function depth in jsscope.  This array is ignored if
            //jsscope is false
            varlist    = [], //groups variables from a variable list into
            //a child array as well as properties of objects.  This
            //array for adding extra space so that the "=" following
            //declared variables of a variable list is vertically
            //aligned and likewise of the ":" with object properties
            news       = 0, //counts uncessary use of 'new' keyword
            //variables j, k, l, m, n, o, p, q, and w are used as
            //various counters for the reporting only.  These variables
            //do not store any tokens and are not used in the algorithm
            //j counts line comments
            stats      = {
                comma       : 0,
                commentBlock: {
                    token: 0,
                    chars: 0
                },
                commentLine : {
                    token: 0,
                    chars: 0
                },
                container   : 0,
                number      : {
                    token: 0,
                    chars: 0
                },
                operator    : {
                    token: 0,
                    chars: 0
                },
                regex       : {
                    token: 0,
                    chars: 0
                },
                semicolon   : 0,
                server      : {
                    token: 0,
                    chars: 0
                },
                space       : {
                    newline: 0,
                    other  : 0,
                    space  : 0,
                    tab    : 0
                },
                string      : {
                    token: 0,
                    chars: 0,
                    quote: 0
                },
                word        : {
                    token: 0,
                    chars: 0
                }
            },
            semi       = 0,
            result     = "";
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
            var a            = 0,
                b            = source.length,
                c            = source.split(""),
                lasttwo      = [],
                fstart       = false,
                ltoke        = "",
                ltype        = "",
                lengtha      = 0,
                lengthb      = 0,
                wordTest     = -1,
                //curly brace insertion - the primary data package
                block        = {
                    count : 0, //paren count off
                    start : -1, //prevent some interference
                    dotest: false, //check for alignment of do and while
                    flag  : false, //move between keywords and condition end
                    bcount: [], //counting braces present since recent start insertion
                    brace : [], //list of indexes prior to missing brace
                    method: [], //if in a method move to next end brace
                    pcount: [], //block count off for prior block tests
                    prev  : [], //block.prior value of prior closed block
                    prior : [], //does a brace already exist following a missing brace
                    simple: [], //is a condition expected?
                    word  : [] //a list from the code sample of the words:  if, else, for, do, while
                },
                blockpop     = function jspretty__tokenize_blockpop() {
                    block.bcount.pop();
                    block.brace.pop();
                    block.method.pop();
                    block.pcount.pop();
                    block.prior.pop();
                    block.simple.pop();
                },
                //commaComment ensures that commas immediately precede
                //comments instead of immediately follow
                commaComment = function jspretty__tokenize_commacomment() {
                    var x = types.length;
                    do {
                        x -= 1;
                    } while (types[x - 1] === "comment" || types[x - 1] === "comment-inline");
                    token.splice(x, 0, ",");
                    types.splice(x, 0, "separator");
                },
                //curly brace insertion - test if you are inside "(" ")"
                methodtest   = function jspretty__tokenize_methodtest() {
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
                objtest      = function jspretty__tokenize_objtest(ifMethod) {
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
                            if (ifMethod === true) {
                                if (types[cc] === "start" && types[cc + 1] === "start" && token[cc + 2] !== "function") {
                                    do {
                                        cc += 1;
                                    } while (types[cc] === "start");
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
                            if (token[cc - 1] !== "=" && token[cc - 1] !== "==" && token[cc - 1] !== "===" && (token[cc] === "{" || token[cc] === "x{") && block.method.length > 0 && ((types[cc - 1] === "operator" && token[cc - 1] !== ":") || token[cc - 1] === "{" || token[cc - 1] === "x{" || token[cc - 1] === "[")) {
                                block.method[block.method.length - 1] -= 1;
                            }
                            return;
                        }
                    }
                },
                //convert ++ and -- into += and -= in most cases
                plusplus     = function jspretty__tokenize_plusplus(x, y) {
                    var store = [],
                        op    = "",
                        cc    = 0,
                        dd    = 0;
                    if (y === "post" && c[a] === ")" && token[lengtha - 3] === ",") {
                        for (cc = lengtha - 1; cc > -1; cc -= 1) {
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
                        op = "+=";
                    } else {
                        op = "-=";
                    }
                    if (y === "pre") {
                        store.push(token[x + 1]);
                        store.push(types[x + 1]);
                        token.pop();
                        types.pop();
                        token.pop();
                        types.pop();
                        token.push(store[0]);
                        types.push(store[1]);
                        token.push(op);
                        types.push("operator");
                        token.push("1");
                        types.push("literal");
                    } else {
                        token.pop();
                        types.pop();
                        token.push(op);
                        types.push("operator");
                        token.push("1");
                        types.push("literal");
                    }
                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                        lines[lines.length - 1][0] += 1;
                    }
                },
                //find missing curly braces
                braceFinder  = function jspretty__tokenize_braceFinder() {
                    //curly brace insertion - demystify "else" complexity
                    var elsestart    = function jspretty__tokenize_braceFinder_elsestart() {
                    var bb       = 0,
                        r        = 0,
                        x        = block.word.length - 1,
                        y        = token.length - 1,
                        z        = 0,
                        comments = [],
                        endtest  = "",
                        btest    = (block.bcount[block.bcount.length - 1] > 0) ? true : false,
                        iftest   = (token[token.length - 2] === "x}" && token[token.length - 3] === "x}") ? true : false,
                        test     = (function jspretty__tokenize_braceFinder_elsestart_test() {
                            var g     = a + 1,
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
                    if (token[token.length - 2] === "}" || btest === true || block.simple.length === 0) {
                        blockpop();
                        block.bcount.push(0);
                        block.brace.push("else");
                        block.method.push(0);
                        block.pcount.push(0);
                        block.prior.push(false);
                        block.simple.push(true);
                        block.flag  = false;
                        block.count = 0;
                        block.start = a;
                        return;
                    }
                    types.pop();
                    token.pop();
                    if (btest === false && (iftest === false || (iftest === true && (block.word[block.word.length - 1] !== "if" || block.word[block.word.length - 2] !== "if")))) {
                        block.bcount.push(0);
                        block.brace.push("else");
                        block.method.push(0);
                        block.pcount.push(0);
                        block.prior.push(false);
                        block.simple.push(true);
                        block.flag  = false;
                        block.count = 0;
                        block.start = a;
                    }
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
                        if (types[types.length - 1] === "comment" || types[types.length - 1] === "comment-inline") {
                            comments.push([
                                token[token.length - 1], types[types.length - 1]
                            ]);
                            if (lines[lines.length - 1][0] === token.length - 2) {
                                lines[lines.length - 1][0] -= 3;
                            }
                            token.pop();
                            types.pop();
                        }
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
                        block.start = a;
                    }
                    if (types[types.length - 1] === "end") {
                        endtest = token[token.length - 1];
                        token.pop();
                        types.pop();
                    }
                    for (r = comments.length - 1; r > -1; r -= 1) {
                        token.push(comments[r][0]);
                        types.push(comments[r][1]);
                    }
                    if (endtest !== "") {
                        token.push(endtest);
                        types.push("end");
                    }
                    token.push("else");
                    types.push("word");
                },
                //curly brace insertion - test if while is for "do"
                whiletest    = function jspretty__tokenize_braceFinder_whiletest() {
                    var cc = 0,
                        dd = 1;
                    for (cc = token.length - 3; cc > -1; cc -= 1) {
                        if (token[cc] === "}" || token[cc] === "x}") {
                            dd += 1;
                        }
                        if (token[cc] === "{" || token[cc] === "x{") {
                            dd -= 1;
                        }
                        if (dd === 0 && token[cc] === "do") {
                            block.dotest = true;
                            token.pop();
                            types.pop();
                            do {
                                dd -= 1;
                                block.brace.push(-1);
                                block.simple.push(false);
                                block.method.push(0);
                                block.start = a;
                                token.pop();
                                types.pop();
                            } while (dd > 0);
                            if (block.start === -1) {
                                block.start = 0;
                            }
                            block.flag  = false;
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
                //a check to prevent comments from algorithmic
                //interference in the brace insertion algorithm of the
                //jscorrect feature
                commentcheck = function jspretty__tokenize_braceFinder_commentcheck() {
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
                lstart = false;
                    if (lengtha < token.length) {
                        lengtha = token.length - 2;
                        if (types[lengtha] === "comment" || types[lengtha] === "comment-inline") {
                            do {
                                lengtha -= 1;
                            } while (lengtha > -1 && (types[lengtha] === "comment" || types[lengtha] === "comment-inline"));
                        }
                        lasttwo = [
                            token[lengtha], types[lengtha]
                        ];
                        lengtha = token.length;
                        if (lengtha === 0) {
                            lengtha = 1;
                        }
                        if (ltoke === "}") {
                            if (block.bcount.length > 0) {
                                block.bcount[block.bcount.length - 1] -= 1;
                            }
                            if (block.prior[block.prior.length - 1] === true) {
                                block.pcount[block.pcount.length - 1] -= 1;
                            }
                            if (block.method > 0 && block.method[block.method.length - 1] > 0) {
                                block.method[block.method.length - 1] -= 1;
                            }
                            if (block.method[block.method.length - 1] > 0) {
                                block.method[block.method.length - 1] -= 1;
                            } else if (token[lengtha - 2] !== "{" && types[lengtha - 3] !== "operator") {
                                objtest();
                            }
                        }
                        if (ltoke === "{") {
                            if (block.bcount.length > 0) {
                                block.bcount[block.bcount.length - 1] += 1;
                            }
                            if (block.prior[block.prior.length - 1] === true) {
                                block.pcount[block.pcount.length - 1] += 1;
                            }
                            if (lasttwo[0] === "else" || (block.word[block.word.length - 2] === "else" && block.word[block.word.length - 1] === "if")) {
                                block.prev[block.prev.length - 1] = true;
                            }
                        }
                        if (token[lengtha - 3] === "else" && lasttwo[0] !== "{" && lasttwo[0] !== "x{" && lasttwo[0] !== "if") {
                            token.pop();
                            types.pop();
                            token.pop();
                            types.pop();
                            token.push("x{");
                            types.push("start");
                            block.prev.push(false);
                            token.push(lasttwo[0]);
                            types.push(lasttwo[1]);
                            token.push(ltoke);
                            types.push(ltype);
                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                lines[lines.length - 1][0] += 1;
                            }
                            lengtha += 1;
                        }
                        if ((ltoke === "}" || ltoke === ";") && block.count === 0 && block.simple.length > 0 && block.method[block.method.length - 1] === 0) {
                            if (ltoke === "}" && block.prior[block.prior.length - 1] === true && block.prior[block.prior.length - 2] !== false && block.pcount[block.pcount.length - 1] === 0 && block.bcount[block.bcount.length - 1] > -1) {
                                blockpop();
                                if (block.simple.length === 0) {
                                    block.start = -1;
                                }
                            } else if ((ltoke === "}" && block.prior[block.prior.length - 1] === true && block.prior[block.prior.length - 2] === false) || ((ltoke === ";" || block.bcount[block.bcount.length - 1] < 0) && (block.brace[block.brace.length - 1] === "else" || (block.prior[block.prior.length - 1] === false && block.start > -1)))) {
                                if ((token[block.start - 1] === "while" && token[block.start] === "(" && lengtha - 1 === block.brace[block.brace.length - 1]) || (block.word[block.word.length - 1] === "while" && lengtha - 2 === block.brace[block.brace.length - 1])) {
                                    blockpop();
                                    if (block.simple.length === 0) {
                                        block.start = -1;
                                    }
                                } else if (block.bcount[block.bcount.length - 1] < 1) {
                                    //verify else is connected to the
                                    //correct "if" before closing it
                                    do {
                                        if (block.prior[block.prior.length - 1] === false && block.brace[block.brace.length - 1] !== lengtha - 2) {
                                            if (lstart === false) {
                                                token.push("x}");
                                                types.push("end");
                                            } else {
                                                fstart = true;
                                                return;
                                            }
                                            if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                                lines[lines.length - 1][0] += 1;
                                            }
                                        }
                                        commentcheck();
                                        lengtha += 1;
                                        blockpop();
                                    } while (block.simple.length > 0 && block.prior[block.prior.length - 1] === false && block.bcount[block.bcount.length - 1] === 0);
                                    ltoke = "}";
                                    ltype = "end";
                                    if (block.simple.length === 0) {
                                        block.start = -1;
                                    }
                                }
                            }
                        }
                        if (block.flag === false && (ltoke === "for" || ltoke === "if" || ltoke === "while" || ltoke === "do" || ltoke === "else") && (block.brace.length === 0 || block.brace[block.brace.length - 1] === "else" || block.brace[block.brace.length - 1] < lengtha - 1)) {
                            if (ltoke === "while" && (lasttwo[0] === "}" || lasttwo[0] === "x}")) {
                                whiletest();
                            }
                            if (block.dotest === true) {
                                block.dotest = false;
                            } else {
                                if ((ltoke === "if" && lasttwo[0] === "else") || (ltoke === "while" && token[block.start] === "do")) {
                                    blockpop();
                                } else if (ltoke === "if" && (lasttwo[0] === "{" || lasttwo[0] === "x{") && token[lengtha - 3] === "else" && block.word[block.word.length - 2] === "else" && block.word[block.word.length - 1] === "if") {
                                    token.pop();
                                    types.pop();
                                    token.pop();
                                    types.pop();
                                    token.push("if");
                                    types.push("word");
                                }
                                if (ltoke === "do") {
                                    block.bcount.push(0);
                                    block.brace.push(lengtha - 1);
                                    block.method.push(0);
                                    block.pcount.push(0);
                                    block.prior.push(false);
                                    block.simple.push(true);
                                    block.flag  = false;
                                    block.count = 0;
                                    block.start = a;
                                } else {
                                    if (ltoke === "else") {
                                        return elsestart();
                                    }
                                    block.method.push(0);
                                    block.pcount.push(0);
                                    block.prior.push(false);
                                    block.simple.push(false);
                                    block.flag  = true;
                                    block.start = a;
                                }
                                block.start = lengtha;
                                block.word.push(ltoke);
                            }
                        }
                        if (block.start > -1) {
                            if (block.flag === true && block.simple[block.simple.length - 1] === false) {
                                if (ltoke === "(") {
                                    block.count += 1;
                                }
                                if (ltoke === ")") {
                                    block.count -= 1;
                                    if (block.count === 0) {
                                        block.bcount.push(0);
                                        block.brace.push(lengtha - 1);
                                        block.flag = false;
                                    }
                                }
                            }
                            if (ltoke === "for" && lasttwo[0] === "else") {
                                token.pop();
                                types.pop();
                                token.push("x{");
                                types.push("start");
                                token.push(ltoke);
                                types.push(ltype);
                                if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                    lines[lines.length - 1][0] += 1;
                                }
                                lengtha += 1;
                            } else if ((block.flag === false || lasttwo[0] === "else" || (lasttwo[0] === ")" && (ltoke === "if" || ltoke === "for" || ltoke === "while"))) && block.count === 0 && lengtha - 2 === block.brace[block.brace.length - 1]) {
                                if (block.word[block.word.length - 1] === "else" && (ltoke === "{" || lasttwo[0] === "{" || lasttwo[0] === "x{")) {
                                    if (lasttwo[0] === "{" || lasttwo[0] === "x{") {
                                        token[token.length - 2] = token[token.length - 1];
                                        types[types.length - 2] = types[types.length - 1];
                                        token.pop();
                                        types.pop();
                                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                            lines[lines.length - 1][0] -= 1;
                                        }
                                    }
                                    block.prev.push(true);
                                } else if (ltoke === "{") {
                                    block.prior[block.prior.length - 1]   = true;
                                    block.pcount[block.pcount.length - 1] = 1;
                                    block.prev.push(true);
                                } else if (block.brace[block.brace.length - 1] !== -1) {
                                    token.pop();
                                    types.pop();
                                    token.push("x{");
                                    types.push("start");
                                    token.push(ltoke);
                                    types.push(ltype);
                                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                        lines[lines.length - 1][0] += 1;
                                    }
                                    block.prev.push(false);
                                    lengtha += 1;
                                }
                            } else if (ltoke === "{" && lasttwo[0] === "else" && block.brace[block.brace.length - 1] === "else") {
                                blockpop();
                                block.prev.push(true);
                            }
                        }
                    }
                },
                //automatic semicolon insertion
                asi          = function jspretty__tokenize_asi(z) {
                    var length     = token.length - 1,
                        last       = token[length],
                        nextCharA  = c[z],
                        nextCharB  = c[z + 1],
                        asiTest    = false,
                        syntax     = (/[\(\)\[\]\{\}\=&<>\+\-\*\/\!\?\|\^:%(0-9)\\]/),
                        jj         = 0,
                        kk         = 0,
                        ll         = 0,
                        store      = [],
                        space      = (/\s/),
                        colon      = false,
                        elsetest   = false,
                        earlyflag  = false,
                        futureTest = function (x) {
                            if (space.test(c[x]) === true) {
                                do {
                                    x += 1;
                                } while (x < b && space.test(c[x]) === true);
                            }
                            if (c[x] === "/" && c[x + 1] === "/") {
                                x += 1;
                                do {
                                    x += 1;
                                } while (x < b && c[x] !== "\n" && c[x] !== "\r");
                            }
                            if (c[x] === "/" && c[x + 1] === "*") {
                                x += 1;
                                do {
                                    x += 1;
                                } while (x < b && c[x - 1] === "*" && c[x] === "/");
                            }
                            if (space.test(c[x]) === true || (c[x] === "/" && c[x + 1] === "/") || (c[x] === "/" && c[x + 1] === "*")) {
                                futureTest(x);
                            }
                            if (c[x] === ":" || c[x] === "," || c[x] === "]" || c[x] === ")") {
                                earlyflag = true;
                                return;
                            }
                            nextCharA = c[x];
                            nextCharB = c[x + 1];
                            z         = x;
                        };
                    //check for the next two characters after white-
                    //space and comments
                    futureTest(z);
                    if (types[length] === "comment" || types[length] === "comment-inline") {
                        jj = length - 1;
                        if (types[jj] === "comment" || types[jj] === "comment-inline") {
                            do {
                                jj -= 1;
                            } while (types[jj] === "comment" || types[jj] === "comment-inline");
                        }
                        last = token[jj];
                    }
                    if (asiTest === false && (earlyflag === true || last === "else" || last === "var" || last === ";" || last === "x;" || nextCharA === ";" || (last === "}" && nextCharA === "c" && nextCharB === "a" && c[z + 2] === "t" && c[z + 3] === "c" && c[z + 4] === "h") || types[length] === "start" || types[length] === "method" || last === "," || last === ":" || last === "{" || last === "x{" || last === "[" || nextCharB === "]" || last === "." || (last !== ")" && nextCharA !== "}" && c[z] !== "\n" && c[z] !== "\r" && (nextCharB === ";" || nextCharB === "," || nextCharB === "." || nextCharB === "(")) || nextCharB === "+" || nextCharB === "*" || nextCharB === "-" || nextCharB === "%" || nextCharB === "!" || nextCharB === "=" || nextCharB === "^" || nextCharB === "?" || (ltype === "operator" && types[lengtha - 1] !== "word") || ltype === "comment" || (ltype === "comment-inline" && nextCharA === "}") || (nextCharB === "/" && c[z + 2] !== "/" && c[z + 2] !== "*"))) {
                        return;
                    }
                    if (last === "return" || last === "break" || last === "continue" || last === "throw") {
                        jj = length - 1;
                        if (types[jj] === "comment" || types[jj] === "comment-inline") {
                            do {
                                jj -= 1;
                            } while (types[jj] === "comment" || types[jj] === "comment-inline");
                        }
                        if (token[jj] !== ":") {
                            asiTest = true;
                        }
                    }
                    if (asiTest === false && (last === ")" || (last === "}" && token[length - 1] === "{" && token[length - 2] === ")"))) {
                        for (jj = (last === ")") ? length - 1 : length - 3; jj > -1; jj -= 1) {
                            if (types[jj] === "end") {
                                kk += 1;
                            }
                            if (types[jj] === "start" || types[jj] === "method") {
                                kk -= 1;
                            }
                            if (kk === -1) {
                                if (token[jj] === "(" && ((token[jj - 1] === "function" && types[jj - 2] !== "operator" && token[jj - 2] !== "(") || token[jj - 1] === "catch" || token[jj - 2] === "function" || token[jj - 1] === "if" || token[jj - 1] === "for" || (token[jj - 1] === "while" && token[jj - 2] !== "}") || token[jj - 1] === "catch" || token[jj - 1] === "switch")) {
                                    return;
                                }
                                break;
                            }
                        }
                    }
                    if (asiTest === false && (last === "}" || last === "x}")) {
                        for (jj = a; jj < b; jj += 1) {
                            if (space.test(c[jj]) === false) {
                                break;
                            }
                        }
                        if (c[jj] === "e" && c[jj + 1] === "l" && c[jj + 2] === "s" && c[jj + 3] === "e") {
                            return;
                        }
                    }
                    if (asiTest === false && (nextCharB + c[z + 2] === "++" || nextCharB + c[z + 2] === "--")) {
                        if (space.test(c[z]) === true) {
                            for (jj = z; jj > -1; jj -= 1) {
                                if (c[jj] === "\n" || c[jj] === "\r" || space.test(c[jj]) === false) {
                                    break;
                                }
                            }
                            if (c[jj] === "\n" || c[jj] === "\r") {
                                for (jj = z + 3; jj < b; jj += 1) {
                                    if (space.test(c[jj]) === false) {
                                        if (syntax.test(c[jj]) === true) {
                                            c.splice(jj, 0, ";");
                                            b    += 1;
                                            semi += 1;
                                            return;
                                        }
                                        asiTest   = true;
                                        nextCharB = "";
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (asiTest === false && (last === ")" || last === "]" || token[length - 1] === "break" || token[length - 1] === "return" || token[length - 1] === "continue" || token[length - 1] === "throw" || (nextCharA === "}" && (token[length - 1] === "{" || token[length - 1] === "x{")))) {
                        kk = 0;
                        for (jj = length; jj > -1; jj -= 1) {
                            if (types[jj] === "end") {
                                kk += 1;
                            }
                            if (types[jj] === "start" || types[jj] === "method") {
                                kk -= 1;
                            }
                            if (kk < 0 && jj < length - 1) {
                                if (token[jj - 1] === "function" || token[jj] === "else" || token[jj] === "try" || ((token[length - 1] === "{" || token[length - 1] === "x{") && (token[jj - 1] === "if" || token[jj - 1] === "for" || token[jj - 1] === "while" || token[jj - 1] === "catch")) || ((token[jj] === "{" || token[jj] === "x{") && jj < length - 1 && colon === false)) {
                                    kk      = 0;
                                    asiTest = true;
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
                                if (token[jj - 1] === "catch" && token[jj] === "(") {
                                    return;
                                }
                                if (c[a] === ")" && token[jj] === "(" && (token[jj - 1] === "function" || (types[jj - 1] === "word" && token[jj - 2] === "function"))) {
                                    return;
                                }
                            }
                        }
                        kk      = 0;
                        asiTest = true;
                    }
                    if (asiTest === false && nextCharA !== "}" && nextCharB + c[z + 2] + c[z + 3] + c[z + 4] === "else") {
                        asiTest  = true;
                        elsetest = true;
                    }
                    if (asiTest === false) {
                        for (jj = length; jj > -1; jj -= 1) {
                            if (types[jj] === "end") {
                                kk    += 1;
                                colon = false;
                            }
                            if (types[jj] === "start" || types[jj] === "method") {
                                kk -= 1;
                            }
                            if (kk < 0) {
                                if (((token[jj] === "{" || token[jj] === "x{") && (token[jj - 1] === ")" || token[jj - 1] === "else")) || ((token[length - 1] === "{" || token[length - 1] === "x{") && nextCharA === "}") || token[jj + 1] === "return" || token[jj + 1] === "break" || token[jj + 1] === "continue" || token[jj + 1] === "throw") {
                                    asiTest = true;
                                    break;
                                }
                                return;
                            }
                            if (kk === 0) {
                                if (nextCharA === "}" || (nextCharA !== "}" && nextCharB === "}")) {
                                    if (token[jj] === ":") {
                                        colon = true;
                                    }
                                    if (token[jj] === "," && colon === true) {
                                        return;
                                    }
                                }
                                if (token[jj] === "return" || token[jj] === "=" || (token[jj] === "else" && token[jj + 1] !== "{" && token[jj + 1] !== "x{" && token[jj + 1] !== "if")) {
                                    asiTest = true;
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
                                    asiTest = true;
                                    break;
                                }
                                if (types[jj] === "start" || types[jj] === "method" || token[jj] === ";" || token[jj] === "," || token[jj] === "do") {
                                    if (((token[jj - 1] === "else" || token[jj - 1] === "for" || token[jj - 1] === "catch" || token[jj - 1] === "if") && elsetest === false) || ((token[jj] === "{" || token[jj] === "x{") && token[jj - 1] === "do")) {
                                        if (token[jj - 1] !== "if" && token[jj - 1] !== "for") {
                                            if (types[length] === "end") {
                                                return;
                                            }
                                            asiTest = true;
                                            break;
                                        }
                                        kk = 1;
                                        for (ll = jj + 1; ll < length + 1; ll += 1) {
                                            if (token[ll] === "(") {
                                                kk += 1;
                                            }
                                            if (token[ll] === ")") {
                                                kk -= 1;
                                                if (kk === 0) {
                                                    if (token[ll + 1] === undefined) {
                                                        return;
                                                    }
                                                    last = token[ll + 1];
                                                    if (last === "{" || last === "x{" || last === "for" || last === "if" || last === "while" || last === "do") {
                                                        return;
                                                    }
                                                    last = token[length];
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
                    if (asiTest === false) {
                        colon = false;
                        if (token[jj - 1] === ":") {
                            if (token[jj] === "{") {
                                ll = 0;
                                for (kk = jj - 2; kk > -1; kk -= 1) {
                                    if (types[kk] === "start" && token[kk] !== "(") {
                                        ll += 1;
                                    }
                                    if (types[kk] === "end" && token[kk] !== ")") {
                                        ll -= 1;
                                    }
                                    if (ll === 0) {
                                        if (token[kk] === "?") {
                                            asiTest = true;
                                            break;
                                        }
                                        if (token[kk] === ",") {
                                            break;
                                        }
                                    }
                                    if (ll > 1) {
                                        return;
                                    }
                                }
                            }
                            if (asiTest === false) {
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
                        }
                        if (token[jj - 1] === ")" && asiTest === false) {
                            kk = 0;
                            for (jj -= 1; jj > -1; jj -= 1) {
                                if (types[jj] === "end") {
                                    kk += 1;
                                }
                                if (types[jj] === "start" || types[jj] === "method") {
                                    kk -= 1;
                                }
                                if (kk === 0) {
                                    if (types[jj] === "operator" && token[jj + 1] === "function") {
                                        asiTest = true;
                                        break;
                                    }
                                    if (nextCharA === "}" || (nextCharA !== "}" && nextCharB === "}")) {
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
                                            if (types[length] === "end") {
                                                return;
                                            }
                                            asiTest = true;
                                            break;
                                        }
                                        if (token[jj - 1] === "function") {
                                            jj -= 1;
                                        }
                                        if (token[jj] === "function") {
                                            if ((types[jj - 1] === "operator" && token[jj - 1] !== ":") || token[jj - 1] === "(" || token[jj - 1] === "[") {
                                                asiTest = true;
                                                break;
                                            }
                                            return;
                                        }
                                        asiTest = true;
                                        break;
                                    }
                                }
                            }
                        } else if (jj > -1 && token[jj] !== ",") {
                            asiTest = true;
                        }
                    }
                    if (asiTest === true) {
                        token.push("x;");
                        if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                            lines[lines.length - 1][0] += 1;
                        }
                        ltoke = ";";
                        ltype = "separator";
                        types.push("separator");
                        lengtha += 1;
                        semi    += 1;
                        if (block.prior[block.prior.length - 1] === false && block.start > -1 && block.count === 0 && block.simple.length > 0 && block.method[block.method.length - 1] === 0) {
                            if (token[lengtha - 3] === "else" && token[lengtha - 2] !== "{" && token[lengtha - 2] !== "x{" && token[lengtha - 2] !== "if") {
                                store.push(token[token.length - 2]);
                                store.push(types[types.length - 2]);
                                token.pop();
                                types.pop();
                                token.pop();
                                types.pop();
                                token.push("x{");
                                types.push("start");
                                token.push(store[0]);
                                types.push(store[1]);
                                token.push(ltoke);
                                types.push(ltype);
                                lengtha += 1;
                            }
                            if (block.bcount[block.bcount.length - 1] < 1) {
                                jj = block.simple.length;
                                do {
                                    token.push("x}");
                                    types.push("end");
                                    if (lines.length > 0 && types[lines[lines.length - 1][0]] !== "comment") {
                                        lines[lines.length - 1][0] += 1;
                                    }
                                    blockpop();
                                    lengtha += 1;
                                    jj      -= 1;
                                } while (jj > 0 && block.prior[block.prior.length - 1] === false && block.prior[block.prior.length - 1] === false && block.bcount[block.bcount.length - 1] < 1);
                            }
                            ltoke = "}";
                            ltype = "end";
                            if (block.simple.length === 0) {
                                block.start = -1;
                            }
                        }
                        braceFinder();
                    }
                },
                //newarray converts new Array(x) into an array literal
                newarray     = function jspretty__tokenize_newarray() {
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
                                arraylen -= 1;
                            } while (arraylen > 0);
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
                //the generic function is a generic tokenizer
                //start argument contains the token's starting syntax
                //offset argument is length of start minus control chars
                //end is how is to identify where the token ends
                generic      = function jspretty__tokenize_genericBuilder(start, ending) {
                    var ee       = 0,
                        f        = 0,
                        g        = 0,
                        end      = ending.split(""),
                        endlen   = end.length - 1,
                        jj       = b,
                        exittest = false,
                        build    = [start],
                        rtest    = (end[0] === "\r") ? true : false,
                        base     = a + start.length,
                        output   = "",
                        escape   = false;
                    //this insanity is for JSON where all the required
                    //quote characters are escaped.
                    if (c[a - 2] !== "\\" && c[a - 1] === "\\" && (c[a] === "\"" || c[a] === "'")) {
                        token.pop();
                        types.pop();
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
                        if (c[ee] === end[endlen] || (rtest === true && (c[ee] === "\n" || ee === jj - 1))) {
                            if (endlen > 0) {
                                g = endlen;
                                for (f = ee; g > -1; f -= 1) {
                                    if (c[f] !== end[g]) {
                                        break;
                                    }
                                    g -= 1;
                                }
                                if (g === -1) {
                                    exittest = true;
                                }
                            } else {
                                exittest = true;
                            }
                            //this condition identifies a series of
                            //character escapes
                            if (ee > endlen + 1 && c[ee - endlen - 1] === "\\" && ending.charAt(0) !== "\\") {
                                g = 1;
                                for (f = ee - 2; f > -1; f -= 1) {
                                    if (c[f] === "\\") {
                                        g += 1;
                                    } else {
                                        break;
                                    }
                                }
                                if (g % 2 === 1) {
                                    exittest = false;
                                }
                            }
                            if (exittest === true) {
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
                    //j is a local for closure "b", which stands for end
                    //of input, basically i am just making sure i have
                    //exceeded the last character of code input
                    if (ee < jj) {
                        a = ee;
                        if (start === "//") {
                            stats.space.newline += 1;
                            build.pop();
                        }
                        if (jsscope === true && jmode === "beautify") {
                            output = build.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            output = build.join("");
                        }
                        return output;
                    }
                    return "";
                },
                //this allows more specific identification for comments
                comtest      = function jspretty__tokenize_commentTester() {
                    var z = 0;
                    if (ltype === "comment" || ltype === "comment-inline") {
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
                operator     = function jspretty__tokenize_operator() {
                    var syntax = [
                            "=", "<", ">", "+", "*", "?", "|", "^", ":", "&"
                        ],
                        g      = 0,
                        h      = 0,
                        jj     = b,
                        build  = [c[a]],
                        synlen = syntax.length,
                        output = "";
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
                    if (jsscope === true && jmode === "beautify") {
                        output = output.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    }
                    return output;
                },
                //a tokenizer for regular expressions
                regex        = function jspretty__tokenize_regex() {
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
                    if (jsscope === true && jmode === "beautify") {
                        output = build.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    } else {
                        output = build.join("");
                    }
                    return output;
                },
                //a tokenizer for numbers
                numb         = function jspretty__tokenize_number() {
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
                //Not a tokenizer.  This counts white space characters
                //and determines if there are empty lines to be
                //preserved
                space        = function jspretty__tokenize_space() {
                    var schars    = [],
                        f         = 0,
                        locallen  = b,
                        emptyline = false,
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
                    if (jpres === true && output.indexOf("\n") > -1) {
                        if (output.indexOf("\n") !== output.lastIndexOf("\n") || token[token.length - 1].indexOf("//") === 0) {
                            emptyline = true;
                        }
                        lines.push([
                            token.length - 1, emptyline
                        ]);
                    }
                    if (asitest === true && ltoke !== ";" && lengthb < token.length) {
                        asi(a);
                        lengthb = token.length;
                    }
                },
                //A tokenizer for keywords, reserved words, and
                //variables
                word         = function jspretty__tokenize_word() {
                    var f      = wordTest,
                        g      = 1,
                        build  = [],
                        output = "";
                    do {
                        build.push(c[f]);
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
                    if (output === "function" && block.start > -1) {
                        if (types[lengtha - 1] === "method" || token[lengtha - 1] === "=") {
                            block.method[block.method.length - 1] += 1;
                        }
                        if (token[lengtha - 1] === ",") {
                            methodtest();
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
                        token.push(output);
                        types.push("word");
                        ltoke            = output;
                        ltype            = "word";
                        stats.word.token += 1;
                        stats.word.chars += output.length;
                    }
                    braceFinder();
                };
            for (a = 0; a < b; a += 1) {
                lengtha = token.length;
                if ((/\s/).test(c[a])) {
                    if (wordTest > -1) {
                        word();
                    }
                    space();
                } else if (c[a] === "<" && c[a + 1] === "?" && c[a + 2] === "p" && c[a + 3] === "h" && c[a + 4] === "p") {
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke              = generic("<?php", "?>");
                    ltype              = "literal";
                    stats.server.token += 1;
                    stats.server.chars += ltoke.length;
                    token.push(ltoke);
                    types.push(ltype);
                } else if (c[a] === "<" && c[a + 1] === "%") {
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke              = generic("<%", "%>");
                    ltype              = "literal";
                    stats.server.token += 1;
                    stats.server.chars += ltoke.length;
                    token.push(ltoke);
                    types.push(ltype);
                } else if (c[a] === "<" && c[a + 1] === "!" && c[a + 2] === "-" && c[a + 3] === "-" && c[a + 4] === "#") {
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke              = generic("<!--#", "--" + ">");
                    ltype              = "literal";
                    stats.server.token += 1;
                    stats.server.chars += ltoke.length;
                    token.push(ltoke);
                    types.push(ltype);
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
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
                    }
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    if (wordTest > -1) {
                        word();
                    }
                    if (jcomment !== "nocomment") {
                        ltype = comtest();
                    }
                    ltoke                   = generic("//", "\r");
                    stats.commentLine.token += 1;
                    stats.commentLine.chars += ltoke.length;
                    if (ltoke.indexOf("# sourceMappingURL=") === 2) {
                        sourcemap[0] = token.length;
                        sourcemap[1] = ltoke;
                    }
                    if (jcomment !== "nocomment") {
                        token.push(ltoke);
                        types.push(ltype);
                    }
                } else if (c[a] === "/" && wordTest === -1 && (lengtha > 0 && (types[lengtha - 1] !== "word" || ltoke === "typeof" || ltoke === "return") && ltype !== "literal" && ltype !== "end")) {
                    ltoke             = regex();
                    ltype             = "regex";
                    stats.regex.token += 1;
                    stats.regex.chars += ltoke.length;
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "\"") {
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke              = generic("\"", "\"");
                    ltype              = "literal";
                    stats.string.token += 1;
                    stats.string.chars += ltoke.length - 2;
                    stats.string.quote += 2;
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "'") {
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke              = generic("'", "'");
                    ltype              = "literal";
                    stats.string.token += 1;
                    stats.string.chars += ltoke.length - 2;
                    stats.string.quote += 2;
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "-" && (a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-") && (ltype === "literal" || ltype === "word") && ltoke !== "return" && (ltoke === ")" || ltoke === "]" || ltype === "word" || ltype === "literal")) {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.operator.token += 1;
                    stats.operator.chars += 1;
                    ltoke                = "-";
                    ltype                = "operator";
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (wordTest === -1 && ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1])))) {
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
                    braceFinder();
                } else if (c[a] === ",") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.comma += 1;
                    if (ltype === "comment" || ltype === "comment-inline") {
                        commaComment();
                    } else {
                        ltoke = ",";
                        ltype = "separator";
                        token.push(ltoke);
                        types.push(ltype);
                    }
                    braceFinder();
                } else if (c[a] === ".") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.operator.token += 1;
                    stats.operator.chars += 1;
                    if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === lengtha - 1) {
                        lines.pop();
                    }
                    ltoke = ".";
                    ltype = "separator";
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === ";") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.semicolon += 1;
                    if ((token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "[" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                        if (ltoke === "++" || ltoke === "--") {
                            plusplus(lengtha - 1, "post");
                        } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                            plusplus(lengtha - 2, "pre");
                        }
                    }
                    ltoke = ";";
                    ltype = "separator";
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "(") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.container += 1;
                    if (ltype === "comment" || ltype === "comment-inline" || ltype === "start") {
                        ltype = "start";
                    } else if (lengtha > 2 && token[lengtha - 2] === "function") {
                        ltype = "method";
                    } else if (lengtha === 0 || ltoke === "return" || ltoke === "function" || ltoke === "for" || ltoke === "if" || ltoke === "while" || ltoke === "switch" || ltoke === "catch" || ltype === "separator" || ltype === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
                        ltype = "start";
                    } else if (ltype === "end") {
                        ltype = objtest(true);
                    } else {
                        ltype = "method";
                    }
                    ltoke = "(";
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "[") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.container += 1;
                    ltoke           = "[";
                    ltype           = "start";
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "{") {
                    if (wordTest > -1) {
                        word();
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
                    if (jscorrect === true && block.start > -1) {
                        if (types[types.length - 1] === "method" || token[token.length - 1] === "=") {
                            block.method[block.method.length - 1] += 1;
                        }
                        if (token[lengtha - 1] === ",") {
                            methodtest();
                        }
                    }
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === ")") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.container += 1;
                    if ((token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "[" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                        if (types[lengtha - 3] !== "method" && (ltoke === "++" || ltoke === "--")) {
                            plusplus(lengtha - 1, "post");
                        } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                            plusplus(lengtha - 2, "pre");
                        }
                    }
                    ltoke = ")";
                    ltype = "end";
                    if (jscorrect === true) {
                        newarray();
                    } else {
                        token.push(ltoke);
                        types.push(ltype);
                    }
                    braceFinder();
                } else if (c[a] === "]") {
                    if (wordTest > -1) {
                        word();
                    }
                    stats.container += 1;
                    if ((token[lengtha - 3] === "[" || token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                        if (ltoke === "++" || ltoke === "--") {
                            plusplus(lengtha - 1, "post");
                        } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                            plusplus(lengtha - 2, "pre");
                        }
                    }
                    ltoke = "]";
                    ltype = "end";
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (c[a] === "}") {
                    if (wordTest > -1) {
                        word();
                    }
                    if (ltoke !== ";" && lengthb < token.length) {
                        asi(a);
                        lengthb = token.length;
                    }
                    if (ltoke === ";" && jmode === "minify" && jobfuscate === true) {
                        token[token.length - 1] = "x;";
                    }
                    if ((token[lengtha - 3] === ";" || token[lengtha - 3] === "}" || token[lengtha - 3] === "[" || token[lengtha - 3] === "(" || token[lengtha - 3] === ")" || token[lengtha - 3] === "," || token[lengtha - 3] === "return") && jscorrect === true) {
                        if (token[lengtha - 1] === "++" || token[lengtha - 1] === "--") {
                            plusplus(lengtha - 1, "post");
                            token.push(";");
                            types.push("separator");
                        } else if (token[lengtha - 2] === "++" || token[lengtha - 2] === "--") {
                            plusplus(lengtha - 2, "pre");
                            token.push(";");
                            types.push("separator");
                        }
                    }
                    stats.container += 1;
                    ltoke           = "}";
                    ltype           = "end";
                    token.push(ltoke);
                    types.push(ltype);
                    if (fstart === true) {
                        fstart = false;
                        token.push("x}");
                        types.push("end");
                    }
                    braceFinder();
                } else if (c[a] === "=" || c[a] === "&" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "%") {
                    if (wordTest > -1) {
                        word();
                    }
                    ltoke                = operator();
                    ltype                = "operator";
                    stats.operator.token += 1;
                    stats.operator.chars += ltoke.length;
                    token.push(ltoke);
                    types.push(ltype);
                    braceFinder();
                } else if (wordTest < 0 && c[a] !== "") {
                    wordTest = a;
                }
            }
            lines.push([
                token.length, false
            ]);
            asi(a);
            if (sourcemap[0] === token.length - 1) {
                token.push("\n" + sourcemap[1]);
                types.push("literal");
            }
        }());
        if (jmode === "beautify" || (jmode === "minify" && jobfuscate === true)) {
            //this function is the pretty-print algorithm
            (function jspretty__algorithm() {
                var a          = 0,
                    b          = token.length,
                    lcount     = 0, //counter for the lines array
                    indent     = jlevel, //will store the current level of indentation
                    obj        = [], //stores if current block is an object literal
                    list       = [], //stores comma status of current block
                    listtest   = [], //determines the comma evaluation must run for the current block
                    lastlist   = false, //remembers the list status of the most recently closed block
                    ternary    = [], //used to identify ternary statments
                    varline    = [], //determines if a current list of the given block is a list of variables following the "var" keyword
                    casetest   = [], //is the current block a switch/case?
                    fortest    = 0, //used for counting the arguments of a "for" loop
                    ctype      = "", //ctype stands for "current type"
                    ctoke      = "", //ctoke standa for "current token"
                    ltype      = types[0], //ltype stands for "last type"
                    ltoke      = token[0], //ltype stands for "last token"
                    varlen     = [], //stores lists of variables, assignments, and object properties for white space padding
                    methodtest = [], //is the current block inside a method?
                    assignlist = [false], //are you in a list right now?
                    functest   = function () {
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
                                    if (token[c] === ";" || token[c] === "x;" || token[c] === "{" || token[c] === "x{" || c === lines[lcount][0]) {
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
                            //this is the test of whether a comma separated
                            //list should be treated as a proper list, such
                            //as an array or if the list should be treated
                            //like a wild bunch of unordered mess
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
                                            //a special test for the return
                                            //keyword, because anything
                                            //following a return is easier
                                            //to read on a single line
                                            if (semicolon === false && token[c] === "return") {
                                                list[list.length - 1] = true;
                                                return;
                                            }
                                            if (assign === false && (token[c] === "=" || token[c] === ";")) {
                                                assign = true;
                                            }
                                            if (compare === false && (token[c] === "&&" || token[c] === "||")) {
                                                compare = true;
                                            }
                                            if (semicolon === false && token[c] === ";") {
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
                                                            if (token[c - 1] === "function" || token[c - 2] === "function" || token[c - 1] === "if" || token[c - 1] === "for") {
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
                            level[a - 1] = "x";
                            if (fortest === 0) {
                                if (varline[varline.length - 1] === true) {
                                    varline[varline.length - 1] = false;
                                    if ((methodtest.length === 0 || methodtest[methodtest.length - 1] === false) && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                        varlist.push(varlen[varlen.length - 1]);
                                    }
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
                    method     = function jspretty__algorithm_method() {
                        level[a - 1] = "x";
                        level.push("x");
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
                            if (ltoke === "=" || ltoke === ";" || ltoke === "," || ltoke === ":" || ltoke === "?" || ltoke === "return" || ltoke === "in" || ltype === "start" || ltype === "method") {
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
                            if (ltoke === "}" || ltoke === ")") {
                                if (functest() === true) {
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
                    end        = function jspretty__algorithm_end() {
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
                                            if (token[c] === "=" || token[c] === ";") {
                                                assign = true;
                                            }
                                            if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "{" || token[c - 1] === "x{" || token[c - 1] === "}" || token[c - 1] === "x}" || token[c - 1] === ";")) {
                                                indent       -= 1;
                                                level[a - 1] = indent;
                                                return;
                                            }
                                            if ((token[c] === ":" && ternary[ternary.length - 1] === false) || (token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                                return;
                                            }
                                            if ((c === 0 || token[c - 1] === "{" || token[c - 1] === "x{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var") {
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
                            if (jsscope === true) {
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
                                        }
                                        if (c > 0 && token[c - 1] === "function" && types[c] === "word" && token[c] !== build[build.length - 1]) {
                                            build.push(token[c]);
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
                                                meta.push(build);
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
                                }(function jspretty__algorithm_end_squareBrace() {
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
                            indent       += 1;
                            level[a - 1] = indent;
                            level.push(indent);
                        } else if (ctoke === "}" || ctoke === "x}" || list[list.length - 1] === true) {
                            if (ctoke === "}" && ltoke === "x}" && token[a + 1] === "else") {
                                level[a - 2] = indent + 2;
                            }
                            level[a - 1] = indent;
                            level.push("x");
                        } else {
                            level.push("x");
                        }
                        if (ctoke === "x}" && types[a + 1] !== "word" && a < b - 1 && types[a + 1] !== "end" && (ltoke === ";" || ltoke === "x;")) {
                            level[a - 1] = "x";
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
                        if (jsscope === true && meta[a] === undefined) {
                            meta.push("");
                        }
                    },
                    operator   = function jspretty__algorithm_operator() {
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
                            //ternary verification test, because from syntax
                            //alone a ternary statement could be challenging
                            //to identify when moving backwards through the
                            //tokens.  This is especially true if one of the
                            //values is function or object
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
                                        } while (types[c] === "comment" || types[c] === "comment-inline");
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
                        level[a - 1] = "s";
                        if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && varline[varline.length - 1] === false && methodtest[methodtest.length - 1] === false && obj[obj.length - 1] === false) {
                            if (assignlist[assignlist.length - 1] === true) {
                                (function jspretty__algorithm_operator_assignTest() {
                                    var c = 0,
                                        d = "";
                                    for (c = a - 1; c > -1; c -= 1) {
                                        d = token[c];
                                        if (d === ";") {
                                            return varlen[varlen.length - 1].push(a - 1);
                                        }
                                        if (d.indexOf("=") > -1 && d !== "==" && d !== "===" && d !== "!=" && d !== "!==" && d !== ">=" && d !== "<=") {
                                            return;
                                        }
                                    }
                                }());
                            }(function jspretty__algorithm_operator_assignSpaces() {
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
                                        if (e === true) {
                                            if (types[c] === "operator" || token[c] === ";" || token[c] === "var") {
                                                f = token[c];
                                                if (f !== undefined && f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<=") {
                                                    if (assignlist[assignlist.length - 1] === false) {
                                                        varlen.push([a - 1]);
                                                        assignlist[assignlist.length - 1] = true;
                                                    }
                                                }
                                                if ((token[c] === ";" || token[c] === "var") && assignlist[assignlist.length - 1] === true) {
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
                                            if (assignlist[assignlist.length - 1] === true && (token[c] === "return" || token[c] === "break" || token[c] === "continue" || token[c] === "throw")) {
                                                assignlist[assignlist.length - 1] = false;
                                                if (varlen[varlen.length - 1].length > 1) {
                                                    varlist.push(varlen[varlen.length - 1]);
                                                }
                                                varlen.pop();
                                            }
                                        }
                                        if (token[c] === ";") {
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
                        if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var")) {
                            if (fortest === 0 && (methodtest[methodtest.length - 1] === false || methodtest.length === 0)) {
                                if (types[a + 1] === "operator" && compare === true && varlen.length > 0 && token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ":") {
                                    varlen[varlen.length - 1].push(a);
                                }
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
                                var c       = 0,
                                    nextish = (typeof next === "string") ? next : "",
                                    apiword = (nextish === "") ? [] : [
                                        "Date", "RegExp", "Error", "XMLHttpRequest", "FileReader", "ActiveXObject", "DataView", "ArrayBuffer", "Proxy", "DOMParser", "ParallelArray", "Int8Array", "Uint8Array", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "Canvas", "CustomAnimation", "FadeAnimation", "Flash", "FormField", "Frame", "HotKey", "Image", "MenuItem", "MoveAnimation", "Point", "Rectangle", "ResizeAnimation", "RotateAnimation", "ScrollBar", "Shadow", "SQLite", "Text", "TextArea", "Timer", "URL", "Web", "Window"
                                    ],
                                    apilen  = apiword.length;
                                for (c = 0; c < apilen; c += 1) {
                                    if (nextish === apiword[c]) {
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
                        } else if (ctoke === "in" || (((ctoke === "else" && jelseline === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                            level[a - 1] = "s";
                        } else if (ctoke === "var") {
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
                                indent += 1;
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
                        }
                        level.push("s");
                    };
                for (a = 0; a < b; a += 1) {
                    if (jsscope === true && types[a] !== "start" && types[a] !== "word" && types[a] !== "end") {
                        meta.push("");
                    }
                    ctype = types[a];
                    ctoke = token[a];
                    if (a - 1 > lines[lcount][0]) {
                        lcount += 1;
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
                            token[a]     = token[a + 1];
                            types[a]     = "start";
                            token[a + 1] = ctoke;
                            types[a + 1] = ctype;
                            a            -= 1;
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
                        method();
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
        }

        if (jscorrect === true) {
            (function () {
                var a = 0,
                    b = token.length;
                for (a = 0; a < b; a += 1) {
                    if (token[a] === "x;") {
                        token[a] = ";";
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

        if (jmode === "minify") {
            result = (function jspretty__minify() {
                var a        = 0,
                    length   = token.length,
                    comtest  = (jtopcoms === false) ? true : false,
                    build    = [],
                    letter   = [65],
                    gg       = 0,
                    minmeta  = [],
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
                    rename   = function (x) {
                        var b        = 0,
                            len      = x.length,
                            array    = [],
                            inc      = function jspretty__minify_findvars_inc() {
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
                            toLetter = function jspretty__minify_findvars_toLetter() {
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
                    if (types[a] === "word" && (types[a + 1] === "word" || types[a + 1] === "literal" || token[a + 1] === "x{" || types[a + 1] === "comment" || types[a + 1] === "comment-inline")) {
                        build.push(token[a]);
                        build.push(" ");
                    } else if (types[a] === "comment" && comtest === false) {
                        build.push(token[a]);
                        build.push("\n");
                    } else if (token[a] === "x;" && token[a + 1] !== "}") {
                        build.push(";");
                    } else if (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}" && types[a] !== "comment" && types[a] !== "comment-inline") {
                        build.push(token[a]);
                    }
                }
                return build.join("");
            }());
        } else {
            //the result function generates the out
            if (jsscope === true) {
                result = (function jspretty__resultScope() {
                    var a          = 0,
                        b          = token.length,
                        build      = [],
                        linesinc   = 0,
                        linecount  = 2,
                        last       = "",
                        scope      = 1,
                        buildlen   = 0,
                        commentfix = (function jspretty__resultScope_i() {
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
                        folderItem = [],
                        comfold    = -1, //if current folding is for comment
                        data       = [
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
                        //token 0 then decrement by commentfix.
                        folder     = function jspretty__resultScope_folder() {
                            var datalen = (data.length - (commentfix * 3) > 0) ? data.length - (commentfix * 3) : 1,
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
                                } while (token[kk] !== "function");
                                kk -= 1;
                                if (token[kk] === "(" && types[kk] === "start") {
                                    do {
                                        kk -= 1;
                                    } while (types[kk] === "start" && token[kk] === "(");
                                }
                                if (token[kk] === "=" || token[kk] === ":" || token[kk] === "," || (token[kk + 1] === "(" && types[kk + 1] === "start")) {
                                    assign = false;
                                }
                            }
                            if (types[a] === "comment" && lines[linesinc - 1] !== undefined && lines[linesinc - 1][1] === true) {
                                datalen -= 3;
                                start   -= 1;
                            }
                            data[datalen]     = "<li class=\"fold\" title=\"folds from line " + start + " to line xxx\">";
                            data[datalen + 1] = "- " + start;
                            folderItem.push([
                                datalen, index, assign
                            ]);
                        },
                        //determines where folding ends
                        //function assignments require one more line for
                        //closing than everything else
                        foldclose  = function jspretty__resultScope_foldclose() {
                            var end = (function jspretty_resultScope_foldclose_end() {
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
                        //splits block comments, which are single tokens,
                        //into multiple lines of output
                        blockline  = function jspretty__resultScope_blockline(x) {
                            var commentLines = x.split("\n"),
                                hh           = 0,
                                ii           = commentLines.length - 1;
                            if (lines[linesinc] !== undefined && lines[linesinc][0] === a && linesinc === a && linesinc > 0) {
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
                        //finds the variables if the jsscope option is true
                        findvars   = function jspretty__resultScope_findvars(x) {
                            var metax         = meta[x],
                                metameta      = meta[metax],
                                ee            = 0,
                                ff            = 0,
                                hh            = metameta.length,
                                adjustment    = 1,
                                functionBlock = true,
                                varbuild      = [],
                                varbuildlen   = 0;
                            if (types[a - 1] === "word" && token[a - 1] !== "function") {
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
                                for (ee = metax - 1; ee > a; ee -= 1) {
                                    varbuild = token[ee].split(" ");
                                    if (types[ee] === "word") {
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
                                                    token[ee]   = "<em class='s" + scope + "'>" + varbuild[0] + "</em>";
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
                                for (ee = a + 1; ee < metax; ee += 1) {
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
                        indent     = jlevel,
                        //defines the character(s) and character length of a
                        //single indentation
                        tab        = (function jspretty__resultScope_tab() {
                            var aa = jchar,
                                bb = jsize,
                                cc = [];
                            for (bb; bb > 0; bb -= 1) {
                                cc.push(aa);
                            }
                            return cc.join("");
                        }()),
                        //some prebuilt color coded tabs
                        lscope     = [
                            "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                        ],
                        //a function for calculating indentation after each new
                        //line
                        nl         = function jspretty__resultScope_nl(x) {
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
                                            if (scope === x + 1 && x > 0) {
                                                dd -= 1;
                                            }
                                            build.push(lscope[dd - 1]);
                                        }
                                    }
                                }
                            } else {
                                if (x > 0) {
                                    dd = scope;
                                    if (scope > 0) {
                                        if (scope === x + 1 && x > 0) {
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
                        };
                    if (jvarspace === true) {
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
                                        endTest = false,
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
                                        do {
                                            x    -= 2;
                                            xlen += token[x].length + 1;
                                        } while (x > 1 && token[x - 1] === ".");
                                        if (token[x] === ")" || token[x] === "]") {
                                            x       += 1;
                                            xlen    -= 1;
                                            mixTest = true;
                                            ending();
                                        }
                                    };
                                    ending = function jspretty__resultScope_varSpaces_joins_ending() {
                                        var yy = 0;
                                        endTest = true;
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
                                        if (endTest === false) {
                                            xlen += 1;
                                        }
                                    } else if (token[x] === ")" || token[x] === "]") {
                                        ending();
                                        if (perTest === false) {
                                            xlen += 1;
                                        }
                                    } else {
                                        xlen += 1;
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
                    //this loops combines the white space as determined from the
                    //algorithm with the tokens to create the output
                    for (a = 0; a < b; a += 1) {
                        if (typeof meta[a] === "number") {
                            folder();
                        }
                        if (comfold === -1 && types[a] === "comment" && ((token[a].indexOf("/*") === 0 && token[a].indexOf("\n") > 0) || types[a + 1] === "comment" || (lines[linesinc] !== undefined && lines[linesinc - 1][1] === true))) {
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
                                if (types[a] === "comment") {
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
                                        build[buildlen] = build[buildlen].replace(/class\='l\d+'/, "class='c0'");
                                    }
                                    build.push(token[a]);
                                    nl(indent);
                                    build.push(tab);
                                } else {
                                    build.push(token[a]);
                                }
                            }
                        }
                        //this condition performs additional calculations if
                        //jpres === true.  jpres determines whether empty lines
                        //should be preserved from the code input
                        if (jpres === true && lines[linesinc] !== undefined && a === lines[linesinc][0] && level[a] !== "x" && level[a] !== "s") {
                            //special treatment for math operators
                            if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                //comments get special treatment
                                if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                    nl(indent);
                                    build.push(tab);
                                    level[a] = "x";
                                } else {
                                    indent = level[a];
                                    if (lines[linesinc][1] === true) {
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
                            } else if (lines[linesinc][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                if ((token[a] !== "x}" || isNaN(level[a]) === true) && (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator")))) {
                                    data.push("<li>");
                                    data.push(linecount);
                                    data.push("</li>");
                                    linecount += 1;
                                    if (types[a] === "comment") {
                                        build.push("<em>&#xA;</em></li><li class='c0'>");
                                    } else {
                                        commentfix += 1;
                                        nl(indent);
                                    }
                                }
                            }
                            linesinc += 1;
                        }
                        if ((token[a] === ";" || token[a] === "x;") && token[a + 1] === "x}" && ((/<em class='s\d+'>\}<\/em>/).test(token[a + 2]) === true || token[a + 2] === "x}")) {
                            rl(indent);
                        } else if (token[a] === "x{" && level[a] === "s" && level[a - 1] === "s") {
                            build.push("");
                        } else if (a < b - 1 && types[a + 1] === "comment" && jcomment === "noindent") {
                            nl(jlevel);
                        } else if (level[a] === "s" && token[a] !== "x}") {
                            build.push(" ");
                        } else if (level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || (linesinc > 0 && lines[linesinc - 1][1] === true && lines[linesinc - 1][0] === a))) {
                            indent = level[a];
                            nl(indent);
                        }
                        if (lines[linesinc] !== undefined && lines[linesinc][0] < a) {
                            linesinc += 1;
                        }
                        if (folderItem.length > 0) {
                            if (a === folderItem[folderItem.length - 1][1] && comfold === -1) {
                                foldclose();
                            }
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
                    build   = [
                        "<p>Scope analysis does not provide support for undeclared variables.</p>", "<p><em>", semi, "</em> instances of <strong>missing semicolons</strong> counted.</p>", "<p><em>", news, "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>", data.join(""), last
                    ];
                    summary = build.join("");
                    data    = [];
                    build   = [];
                    return "";
                }()).replace(/(\s+)$/, "");
            } else {
                result = (function jspretty__result() {
                    var a       = 0,
                        b       = token.length,
                        build   = [],
                        lineinc = 0,
                        indent  = jlevel,
                        //defines the character(s) and character length of a
                        //single indentation
                        tab     = (function jspretty__result_tab() {
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
                        nl      = function jspretty__result_nl(x) {
                            var dd = 0;
                            build.push("\n");
                            for (dd; dd < x; dd += 1) {
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
                    if (jvarspace === true) {
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
                                        endTest = false,
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
                                        do {
                                            x    -= 2;
                                            xlen += token[x].length + 1;
                                        } while (x > 1 && token[x - 1] === ".");
                                        if (token[x] === ")" || token[x] === "]") {
                                            x       += 1;
                                            xlen    -= 1;
                                            mixTest = true;
                                            ending();
                                        }
                                    };
                                    ending = function jspretty__result_varSpaces_joins_ending() {
                                        var yy = 0;
                                        endTest = true;
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
                                        if (endTest === false) {
                                            xlen += 1;
                                        }
                                    } else if (token[x] === ")" || token[x] === "]") {
                                        ending();
                                        if (perTest === false) {
                                            xlen += 1;
                                        }
                                    } else {
                                        xlen += 1;
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
                    //this loops combines the white space as determined from the
                    //algorithm with the tokens to create the output
                    for (a = 0; a < b; a += 1) {
                        if (types[a] === "comment" || (token[a] !== "x;" && token[a] !== "x{" && token[a] !== "x}")) {
                            build.push(token[a]);
                            if (token[a].indexOf("//") === 0 && types[a + 1] === "operator") {
                                nl(indent);
                                build.push(tab);
                            }
                        }
                        //this condition performs additional calculations if
                        //jpres === true.  jpres determines whether empty lines
                        //should be preserved from the code input
                        if (jpres === true && lines[lineinc] !== undefined && a === lines[lineinc][0] && level[a] !== "x" && level[a] !== "s") {
                            //special treatment for math operators
                            if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                                //comments get special treatment
                                if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                                    nl(indent);
                                    build.push(tab);
                                    level[a] = "x";
                                } else {
                                    indent = level[a];
                                    if (lines[lineinc][1] === true) {
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
                            } else if (lines[lineinc][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                                if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator"))) {
                                    if (token[a] !== "x}" || isNaN(level[a]) === true || level[a] === "x") {
                                        build.push("\n");
                                    }
                                }
                            }
                            lineinc += 1;
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
                        } else if (level[a] !== "x" && (token[a] !== "x}" || (token[a] === "x}" && (token[a - 1] === "x;" || token[a - 1] === ";") && types[a + 1] !== "word") || (lineinc > 0 && lines[lineinc - 1][1] === true && lines[lineinc - 1][0] === a))) {
                            indent = level[a];
                            nl(indent);
                        }
                        if (lines[lineinc] !== undefined && lines[lineinc][0] < a) {
                            lineinc += 1;
                        }
                    }
                    return build.join("").replace(/(\s+)$/, "");
                }());
            }

            //the analysis report is generated in this function
            if (summary !== "diff" && jsscope === false) {
                stats.space.space -= 1;
                (function jspretty__report() {
                    var originalSize = source.length - 1,
                        noOfLines    = result.split("\n").length,
                        newlines     = stats.space.newline,
                        total        = {
                            chars  : 0,
                            comment: {
                                token: stats.commentBlock.token + stats.commentLine.token,
                                chars: stats.commentBlock.chars + stats.commentLine.chars
                            },
                            literal: {
                                token: stats.number.token + stats.regex.token + stats.string.token,
                                chars: stats.number.chars + stats.regex.chars + stats.string.chars
                            },
                            space  : stats.space.newline + stats.space.other + stats.space.space + stats.space.tab,
                            syntax : {
                                token: stats.string.quote + stats.comma + stats.semicolon + stats.container,
                                chars: 0
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
                    output.push("<div id='doc'>");
                    output.push("<p><em>");
                    output.push(semi);
                    output.push("</em> instance");
                    if (semi !== 1) {
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
                    output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScript component analysis</caption><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percentage Quantity from Section</th>");
                    output.push("<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage Length from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
                    output.push("<tr><th>Total Accounted</th><td>");
                    output.push(total.token);
                    output.push("</td><td>100.00%</td><td>100.00%</td><td>");
                    output.push(total.chars);
                    output.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></tr><tr><th>Block Comments</th><td>");
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
                    output.push("</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></tr><tr><th>New Lines</th><td>");
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
                    output.push("</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Characters</th><td>");
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
    },
    //the edition values use the format YYMMDD for dates.
    edition  = {
        jspretty: 140806
    };
edition.latest = edition.jspretty;