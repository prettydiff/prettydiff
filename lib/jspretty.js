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
 * insize - The size of a single indentation.  The type is number and the
   default is 4.
 * inchar - The string character(s) to make up an indentation.  The
   default is a single space.
 * preserve - Determines whether empty lines should be kept in the code for
   organizational reasons.  The type is boolean and the default value is
   true.
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
        var source = (typeof args.source === "string" && args.source.length > 0) ? args.source : "Error: no source code supplied to jsbeauty!",
            jsize = (args.insize > 0) ? args.insize : ((Number(args.insize) > 0) ? Number(args.insize) : 4),
            jchar = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
            jpres = (typeof args.preserve === "boolean") ? args.preserve : true,
            jlevel = (args.inlevel > -1) ? args.inlevel : ((Number(args.inlevel) > -1) ? Number(args.inlevel) : 0),
            jspace = (typeof args.space === "boolean") ? args.space : true,
            jbrace = (args.braces === "allman") ? true : false,
            jcomment = (args.comments === "noindent") ? true : false,
            jsscope = (args.jsscope === true) ? true : false,
            //all data that is created from the tokization process is
            //stored in the following four arrays: token, types, level,
            //and lines.  All of this data passes from the tokenization
            //process to be analyzed by the algorithm
            token = [],
            types = [],
            level = [],
            lines = [],
            meta = [], //used to find scope and variables for jsscope
            //variables j, k, l, m, n, o, p, q, and w are used as
            //various counters for the reporting only.  These variables
            //do not store any tokens and are not used in the algorithm
            j = [
                0, 0
            ],
            k = [
                0, 0
            ],
            l = [
                0, 0, 0
            ],
            m = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            n = [
                0, 0, 0, 0, 0
            ],
            o = [
                0, 0
            ],
            p = [
                0, 0
            ],
            q = [
                0, 0
            ],
            w = [
                0, 0, 0, 0
            ],
            result = "";
        if (source === "Error: no source code supplied to jsbeauty!") {
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
                t = "",
                u = "",
                //the "d" function is a generic tokenizer
                //start argument contains the token's starting syntax
                //offset argument is length of start minus control chars
                //end is how is to identify where the token ends
                d = function jspretty__tokenize_genericBuilder(start, offset, end) {
                    var e = 0,
                        f = 0,
                        g = 0,
                        h = end.split(""),
                        i = h.length - 1,
                        j = b,
                        k = false,
                        l = [start],
                        m = (h[0] === "\r") ? true : false,
                        n = a + offset,
                        o = "";
                    for (e = n; e < j; e += 1) {
                        l.push(c[e]);
                        if (c[e] === h[i] || (m === true && (c[e] === "\n" || e === j - 1))) {
                            if (i > 0) {
                                g = i;
                                for (f = e; g > -1; f -= 1) {
                                    if (c[f] !== h[g]) {
                                        break;
                                    }
                                    g -= 1;
                                }
                                if (g === -1) {
                                    k = true;
                                }
                            } else {
                                k = true;
                            }
                            //this condition identifies a series of
                            //character escapes
                            if (e > i + 1 && c[e - i - 1] === "\\") {
                                g = 1;
                                for (f = e - 2; f > -1; f -= 1) {
                                    if (c[f] === "\\") {
                                        g += 1;
                                    } else {
                                        break;
                                    }
                                }
                                if (g % 2 === 1) {
                                    k = false;
                                }
                            }
                            if (k) {
                                break;
                            }
                        }
                    }
                    //j is a local for closure "b", which stands for end
                    //of input, basically i am just making sure i have
                    //exceeded the last character of code input
                    if (e < j) {
                        a = e;
                        if (start === "//") {
                            l.pop();
                        }
                        if (jsscope === true) {
                            o = l.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        } else {
                            o = l.join("");
                        }
                        return o;
                    }
                    return "";
                },
                //this allows more specific identification for comments
                comtest = function jspretty__tokenize_commentTester() {
                    var z = 0;
                    for (z = a - 1; z > -1; z -= 1) {
                        if (!(/\s/).test(c[z])) {
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
                    var e = [
                            "=", "<", ">", "+", "*", "?", "|", "^", ":", "&"
                        ],
                        f = [c[a]],
                        g = 0,
                        h = 0,
                        i = e.length,
                        j = b,
                        k = "";
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
                                a += 1;
                                return "--";
                            }
                            if (c[a + 1] === "=") {
                                a += 1;
                                return "-=";
                            }
                            return "-";
                        }
                    }
                    for (g = a + 1; g < j; g += 1) {
                        for (h = 0; h < i; h += 1) {
                            if (c[g] === e[h]) {
                                f.push(e[h]);
                                break;
                            }
                        }
                        if (h === i) {
                            break;
                        }
                    }
                    a = a + (f.length - 1);
                    if (jsscope === true) {
                        k = f.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    } else {
                        k = f.join("");
                    }
                    return k;
                },
                //a tokenizer for regular expressions
                regex = function jspretty__tokenize_regex() {
                    var e = 0,
                        f = b,
                        g = ["/"],
                        h = 0,
                        i = 0,
                        j = "";
                    for (e = a + 1; e < f; e += 1) {
                        g.push(c[e]);
                        if (c[e] === "/") {
                            if (c[e - 1] === "\\") {
                                i = 0;
                                for (h = e - 1; h > 0; h -= 1) {
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
                    if (c[e + 1] === "g" || c[e + 1] === "i" || c[e + 1] === "m" || c[e + 1] === "y") {
                        g.push(c[e + 1]);
                        if (c[e + 2] !== c[e + 1] && (c[e + 2] === "g" || c[e + 2] === "i" || c[e + 2] === "m" || c[e + 2] === "y")) {
                            g.push(c[e + 2]);
                            if (c[e + 3] !== c[e + 1] && c[e + 3] !== c[e + 2] && (c[e + 3] === "g" || c[e + 3] === "i" || c[e + 3] === "m" || c[e + 3] === "y")) {
                                g.push(c[e + 3]);
                                if (c[e + 4] !== c[e + 1] && c[e + 4] !== c[e + 2] && c[e + 4] !== c[e + 3] && (c[e + 4] === "g" || c[e + 4] === "i" || c[e + 4] === "m" || c[e + 4] === "y")) {
                                    g.push(c[e + 4]);
                                    a = e + 4;
                                } else {
                                    a = e + 3;
                                }
                            } else {
                                a = e + 2;
                            }
                        } else {
                            a = e + 1;
                        }
                    } else {
                        a = e;
                    }
                    if (jsscope === true) {
                        j = g.join("").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    } else {
                        j = g.join("");
                    }
                    return j;
                },
                //a tokenizer for numbers
                numb = function jspretty__tokenize_number() {
                    var e = 0,
                        f = b,
                        g = [c[a]],
                        h = (g[0] === ".") ? true : false;
                    if (a < b - 2 && c[a + 1] === "x" && (/[0-9A-Fa-f]/).test(c[a + 2])) {
                        g.push("x");
                        for (e = a + 2; e < f; e += 1) {
                            if ((/[0-9A-Fa-f]/).test(c[e])) {
                                g.push(c[e]);
                            } else {
                                break;
                            }
                        }
                    } else {
                        for (e = a + 1; e < f; e += 1) {
                            if ((/[0-9]/).test(c[e]) || (c[e] === "." && h === false)) {
                                g.push(c[e]);
                                if (c[e] === ".") {
                                    h = true;
                                }
                            } else {
                                break;
                            }
                        }
                    }
                    if (e < f - 1 && (c[e] === "e" || c[e] === "E")) {
                        g.push(c[e]);
                        if (c[e + 1] === "-") {
                            g.push("-");
                            e += 1;
                        }
                        h = false;
                        for (e += 1; e < f; e += 1) {
                            if ((/[0-9]/).test(c[e]) || (c[e] === "." && h === false)) {
                                g.push(c[e]);
                                if (c[e] === ".") {
                                    h = true;
                                }
                            } else {
                                break;
                            }
                        }
                    }
                    a = e - 1;
                    return g.join("");
                },
                //Not a tokenizer.  This counts white space characters
                //and determines if there are empty lines to be
                //preserved
                space = function jspretty__tokenize_space() {
                    var e = [],
                        f = 0,
                        g = b,
                        h = false;
                    for (f = a; f < g; f += 1) {
                        if (c[f] === "\n") {
                            w[0] += 1;
                        } else if (c[f] === " ") {
                            w[1] += 1;
                        } else if (c[f] === "\t") {
                            w[2] += 1;
                        } else if ((/\s/).test(c[f])) {
                            w[3] += 1;
                        } else {
                            break;
                        }
                        e.push(c[f]);
                    }
                    a = f - 1;
                    if (token.length === 0) {
                        return;
                    }
                    g = e.join("");
                    if (jpres && g.indexOf("\n") > -1) {
                        if ((g.indexOf("\n") !== g.lastIndexOf("\n")) || token[token.length - 1].indexOf("//") === 0) {
                            h = true;
                        }
                        lines.push([
                            token.length - 1, h
                        ]);
                    }
                },
                //A tokenizer for keywords, reserved words, and
                //variables
                word = function jspretty__tokenize_word() {
                    var e = [],
                        f = a,
                        g = b,
                        h = "";
                    do {
                        e.push(c[f]);
                        f += 1;
                    } while (f < g && !((/\s/).test(c[f]) || c[f] === ";" || c[f] === "=" || c[f] === "." || c[f] === "," || c[f] === "&" || c[f] === "<" || c[f] === ">" || c[f] === "+" || c[f] === "-" || c[f] === "*" || c[f] === "/" || c[f] === "!" || c[f] === "?" || c[f] === "|" || c[f] === "^" || c[f] === ":" || c[f] === "\"" || c[f] === "'" || c[f] === "\\" || c[f] === "/" || c[f] === "(" || c[f] === ")" || c[f] === "{" || c[f] === "}" || c[f] === "[" || c[f] === "]" || c[f] === "%"));
                    h = e.join("");
                    if (types.length > 1 && h === "function" && types[types.length - 1] === "method" && token[token.length - 2] === "{") {
                        types[types.length - 1] = "start";
                    }
                    a = f - 1;
                    if (types.length > 2 && h === "function" && u === "method" && token[token.length - 2] === "}") {
                        types[types.length - 1] = "start";
                    }
                    return h;
                };
            for (a = 0; a < b; a += 1) {
                if (c[a] === "/" && (a === b - 1 || c[a + 1] === "*")) {
                    t = d("/*", 2, "*\/");
                    u = "comment";
                    k[0] += 1;
                    k[1] += t.length;
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "/" && (a === b - 1 || c[a + 1] === "/")) {
                    u = comtest();
                    types.push(u);
                    t = d("//", 2, "\r");
                    j[0] += 1;
                    j[1] += t.length;
                    token.push(t);
                } else if (c[a] === "/" && (types.length > 0 && u !== "word" && u !== "literal" && u !== "end")) {
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
                    if (u === "end") {
                        t = "-";
                        u = "operator";
                    } else {
                        t = numb();
                        u = "literal";
                    }
                    q[0] += 1;
                    q[1] += t.length;
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
                    if (lines[lines.length - 1] !== undefined && lines[lines.length - 1][0] === token.length - 1) {
                        lines.pop();
                    }
                    t = ".";
                    u = "separator";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === ";") {
                    n[3] += 1;
                    t = ";";
                    u = "separator";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "(") {
                    n[4] += 1;
                    if (token.length > 2 && token[token.length - 2] === "function") {
                        u = "method";
                    } else if (types.length === 0 || t === "return" || t === "function" || t === "for" || t === "if" || t === "while" || t === "switch" || u === "separator" || u === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
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
                    t = "{";
                    u = "start";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === ")") {
                    n[4] += 1;
                    t = ")";
                    u = "end";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "]") {
                    n[4] += 1;
                    t = "]";
                    u = "end";
                    token.push(t);
                    types.push(u);
                } else if (c[a] === "}") {
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
                } else if ((/\s/).test(c[a])) {
                    space();
                } else {
                    t = word();
                    u = "word";
                    token.push(t);
                    types.push(u);
                    //the "m" array is used in the reporting at the end
                    //and is not used in the algorithm
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
            lines.push([
                token.length, false
            ]);
        }());
        //this function is the pretty-print algorithm
        (function jspretty__algorithm() {
            var a = 0,
                b = token.length,
                l = 0,
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
                                if (token[c] === ";" || token[c] === "{" || c === lines[l][0]) {
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
                                    g = false;
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
                                        if (token[c] === "{") {
                                            if (token[c - 1] !== ")") {
                                                obj[obj.length - 1] = true;
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
                                        } else if (f === false && g === false && token[c] === "(" && token[c - 1] === "for") {
                                            list[list.length - 1] = true;
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
                            if (ltype !== "]") {
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
                    if (ctoke === ";") {
                        question = false;
                        level[a - 1] = "x";
                        if (fortest === 0) {
                            if (varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                                indent -= 1;
                            }
                            return level.push(indent);
                        }
                        if (fortest > 0) {
                            return level.push("s");
                        }
                        return level.push("s");
                    }
                },
                start = function jspretty__algorithm_start() {
                    varline.push(false);
                    list.push(false);
                    listtest.push(false);
                    if (ctoke !== "(") {
                        indent += 1;
                    }
                    if (ltoke === "for") {
                        fortest = 1;
                    }
                    if (ctoke === "{") {
                        ternary = false;
                        casetest.push(false);
                        if (ltoke === "=" || ltoke === ":" || ltoke === "return") {
                            obj.push(true);
                        } else {
                            obj.push(false);
                        }
                        if (jbrace && ltype !== "operator" && ltoke !== "return") {
                            level[a - 1] = indent - 1;
                        } else if (ltoke === ")") {
                            level[a - 1] = "s";
                        } else if (ltoke === "{" || ltoke === "[" || ltoke === "}") {
                            level[a - 1] = indent - 1;
                        }
                        if (jsscope === true) {
                            meta.push("");
                        }
                        return level.push(indent);
                    }
                    obj.push(false);
                    if (ctoke === "(") {
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
                            if (ltoke === "function" || (a < 1 && token[a - 2] === "function")) {
                                meta.push(0);
                            } else {
                                meta.push("");
                            }
                        }
                        if (fortest > 0 && ltoke !== "for") {
                            fortest += 1;
                        }
                        if (ltoke === "}") {
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
                        } else if (ltoke === "[" || ltoke === "{") {
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
                    //this block of conditions is for ASI.  Don't rely
                    //upon ASI if you care at all for security or
                    //performance
                    if (ctoke === "}" && ltype === "end" && varline[varline.length - 1] === true) {
                        ltoke = ";";
                        ltype = "separator";
                        indent -= 1;
                        level[a - 1] = indent - 1;
                        varline[varline.length - 1] = false;
                    } else if ((a - 1 === lines[l][0] || (ctoke === "}" && casetest.length > 1 && obj.length > 1 && casetest[casetest.length - 2] === true && obj[obj.length - 1] === false && obj[obj.length - 2] === false)) && ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start" && ltoke !== "}") {
                        if (varline[varline.length - 1] === true) {
                            varline[varline.length - 1] = false;
                            indent -= 1;
                        }
                        if (ltoke === "}" || ltoke === "]") {
                            level[a - 1] = indent - 1;
                        } else {
                            level[a - 1] = indent;
                        }
                        if (a - 1 === lines[l][0]) {
                            l += 1;
                        }
                        ltoke = ";";
                        ltype = "separator";
                    } else if (ctoke === "}" && a > 1) {
                        if (varline[varline.length - 1] === true && ((token[a - 2] === "," && ltype === "word") || (token[a - 2] === "=" && (ltype === "literal" || ltype === "word")))) {
                            ltoke = ";";
                            ltype = "separator";
                            varline[varline.length - 1] = false;
                            indent -= 1;
                            level[a - 1] = indent - 1;
                        } else if ((token[a - 2] === ";" || types[a - 2] === "end" || types[a - 2] === "operator") && (ltype === "word" || ltype === "literal")) {
                            ltoke = ";";
                            ltype = "separator";
                            level[a - 1] = indent - 1;
                        }
                    }
                    if (ctoke !== ")") {
                        indent -= 1;
                    } else if (fortest > 0 && ctoke === ")") {
                        fortest -= 1;
                    }
                    if (ctoke === "}") {
                        if (types[a - 1] !== "comment" && types[a - 1] !== "comment-inline" && ltoke !== "{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || ltoke === "break" || ltoke === "return")) {
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
                                        if (c > 0 && token[c] === "return" && (token[c - 1] === ")" || token[c - 1] === "{" || token[c - 1] === "}" || token[c - 1] === ";")) {
                                            indent -= 1;
                                            level[a - 1] = indent;
                                            return;
                                        }
                                        if ((token[c] === ":" && ternary === false) || (token[c] === "," && e === false && varline[varline.length - 1] === false)) {
                                            return;
                                        }
                                        if ((c === 0 || token[c - 1] === "{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var") {
                                            if (list[f - 1] === false && f > 1 && (a === b - 1 || token[a + 1] !== ")")) {
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
                                        if (meta[c] === "v") {
                                            e.push(token[c]);
                                        } else if (token[c] === ")") {
                                            f = true;
                                        } else if (f === true && types[c] === "word") {
                                            meta[c] = "v";
                                            e.push(token[c]);
                                        }
                                    }
                                    if (c > 0 && token[c - 1] === "function" && types[c] === "word") {
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
                            if (ltoke === "}") {
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
                                            if (c > 0 && (token[c + 1] === "{" || token[c + 1] === "[")) {
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
                    } else if (ctoke === "}" && obj[obj.length - 1] === false && ltype === "word" && list[list.length - 1] === false && casetest[casetest.length - 1] === false) {
                        indent += 1;
                        level[a - 1] = indent;
                        level.push(indent);
                    } else if (ctoke === "}" || list[list.length - 1] === true) {
                        level[a - 1] = indent;
                        level.push("x");
                    } else {
                        level.push("x");
                    }
                    if (varline[varline.length - 1] === true) {
                        indent -=1;
                    }
                    lastlist = list[list.length - 1];
                    list.pop();
                    listtest.pop();
                    varline.pop();
                    obj.pop();
                    if (ctoke === "}") {
                        ternary = false;
                    }
                    if (jsscope === true && meta[a] === undefined) {
                        meta.push("");
                    }
                },
                operator = function jspretty__algorithm_operator() {
                    //this block of conditions is for ASI.  Don't rely
                    //upon ASI if you care at all for security or
                    //performance
                    if (a - 1 === lines[l][0] && ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start") {
                        ltoke = ";";
                        ltype = "separator";
                        if (varline[varline.length - 1] === true) {
                            varline[varline.length - 1] = false;
                            indent -= 1;
                        }
                        level[a - 1] = indent;
                        l += 1;
                    }
                    if (ctoke === "!") {
                        if (ltoke === "(") {
                            level[a - 1] = "x";
                        }
                        if (ltoke === "}") {
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
                                d = 0;
                            for (c = a - 1; c > -1; c -= 1) {
                                if (types[c] === "end") {
                                    d += 1;
                                }
                                if (types[c] === "start" || types[c] === "method") {
                                    d -= 1;
                                }
                                if (d === 0) {
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
                                    if ((c > 0 && types[c - 1] === "start") || token[c] === ";" || (l > 0 && token[c] !== "+" && token[c] !== "-" && token[c] !== "*" && token[c] !== "/" && c === lines[l - 1][0])) {
                                        obj[obj.length - 1] = true;
                                        level[a - 1] = "x";
                                        return level.push("s");
                                    }
                                }
                            }
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
                    if (ctoke === "-" && ltoke === "return") {
                        return level.push("x");
                    }
                    level.push("s");
                },
                word = function jspretty__algorithm_word() {
                    //this block of conditions is for ASI.  Don't rely
                    //upon ASI if you care at all for security or
                    //performance
                    if (a - 1 !== lines[l][0] && ltoke === "}" && varline.length > 1 && varline[varline.length - 1] === true && ctoke !== "else" && ctoke !== "while" && ctoke !== "catch") {
                        ltoke = ";";
                        ltype = "separator";
                        indent -= 1;
                        level[a - 1] = indent;
                        varline[varline.length - 1] = false;
                    } else if (a - 1 === lines[l][0] && ((varline[varline.length - 1] === true && ltoke === "}") || (ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start" && ltoke !== "}"))) {
                        ltoke = ";";
                        ltype = "separator";
                        if (ltoke !== "}") {
                            l += 1;
                        }
                        if (varline[varline.length - 1] === true) {
                            varline[varline.length - 1] = false;
                            indent -= 1;
                        }
                        level[a - 1] = indent;
                    }
                    if (jsscope === true) {
                        if (ltoke === "function" || (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var"))) {
                            meta.push("v");
                        } else {
                            meta.push("");
                        }
                    }
                    if (ltoke === "}") {
                        level[a - 1] = indent;
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
                    } else if (ctoke === "while" && ltoke === "}") {
                        //verify if this is a do/while block
                        (function jspretty__algorithm_word_curlyBrace() {
                            var c = 0,
                                d = 0;
                            for (c = a - 1; c > -1; c -= 1) {
                                if (token[c] === "}") {
                                    d += 1;
                                }
                                if (token[c] === "{") {
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
                    } else if ((ctoke === "else" || ctoke === "catch") && ltoke === "}") {
                        level[a - 1] = "s";
                    } else if (ctoke === "var") {
                        if (ltype === "end") {
                            level[a - 1] = indent;
                        }
                        if (indent === 0) {
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
                            if (ltoke === "{") {
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
                                if (token[c] === "}") {
                                    casetest[casetest.length - 1] = false;
                                    return;
                                }
                                if (token[c] === "{" || token[c] === "[") {
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
                if (a - 1 > lines[l][0]) {
                    l += 1;
                }
                if (ctype === "comment") {
                    level[a - 1] = indent;
                    level.push(indent);
                }
                if (ctype === "comment-inline") {
                    if (a < b - 1 && token[a + 1] === "{") {
                        token[a + 1] = ctoke;
                        types[a + 1] = ctype;
                        token[a] = "{";
                        types[a] = "start";
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
                    varline.push(false);
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
        result = (function jspretty__result() {
            var a = 0,
                b = token.length,
                c = [],
                d = 0,
                e = 2,
                f = "",
                g = 0,
                h = 0,
                scope = jsscope,
                data = ["<div class='beautify'><ol class='count'><li>1</li>"],
                //if the scope option is true blockline changes block
                //comments into lines of HTML coded representations
                blockline = function jspretty__result_blockline(x) {
                    var f = x.split("\n"),
                        h = 0,
                        i = f.length - 1;
                    data.push("<li>");
                    data.push(e);
                    data.push("</li>");
                    e += 1;
                    if (lines[d][0] === a && d === a && d > 0) {
                        data.push("<li>");
                        data.push(e);
                        data.push("</li>");
                        e += 1;
                    }
                    for (h = 0; h < i; h += 1) {
                        data.push("<li>");
                        data.push(e);
                        data.push("</li>");
                        e += 1;
                        f[h] = f[h] + "<em>&#10;</em></li><li class='c0'>";
                    }
                    return f.join("");
                },
                //finds the variables if the scope option is true
                findvars = function jspretty__result_findvars(x) {
                    var c = meta[x],
                        d = meta[c],
                        e = 0,
                        f = 0,
                        h = d.length,
                        i = 1,
                        j = true;
                    if (h > 0) {
                        for (e = c - 1; e > a; e -= 1) {
                            if (types[e] === "word") {
                                for (f = 0; f < h; f += 1) {
                                    if (token[e] === d[f]) {
                                        token[e] = "<em class='s" + g + "'>" + token[e] + "</em>";
                                        break;
                                    }
                                }
                            }
                            if (j === true) {
                                if (types[e] === "end") {
                                    i += 1;
                                } else if (types[e] === "start" || types[e] === "method") {
                                    i -= 1;
                                }
                                if (i === 0 && token[e] === "{") {
                                    token[e] = "<em class='s" + g + "'>{</em>";
                                    j = false;
                                }
                            }
                        }
                    } else {
                        for (e = a + 1; e < c; e += 1) {
                            if (types[e] === "end") {
                                i -= 1;
                            } else if (types[e] === "start" || types[e] === "method") {
                                i += 1;
                            }
                            if (i === 1 && token[e] === "{") {
                                token[e] = "<em class='s" + g + "'>{</em>";
                                return;
                            }
                        }
                    }
                },
                indent = jlevel,
                //defines the character(s) and character length of a
                //single indentation
                tab = (function jspretty__result_tab() {
                    var a = jchar,
                        b = jsize,
                        c = [];
                    for (b; b > 0; b -= 1) {
                        c.push(a);
                    }
                    return c.join("");
                }()),
                //some prebuilt color coded tabs
                lscope = (scope === true) ? [
                    "<em class='l0'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em>", "<em class='l0'>" + tab + "</em><em class='l1'>" + tab + "</em><em class='l2'>" + tab + "</em><em class='l3'>" + tab + "</em><em class='l4'>" + tab + "</em><em class='l5'>" + tab + "</em><em class='l6'>" + tab + "</em><em class='l7'>" + tab + "</em><em class='l8'>" + tab + "</em><em class='l9'>" + tab + "</em><em class='l10'>" + tab + "</em><em class='l11'>" + tab + "</em><em class='l12'>" + tab + "</em><em class='l13'>" + tab + "</em><em class='l14'>" + tab + "</em><em class='l15'>" + tab + "</em><em class='l16'>" + tab + "</em>"
                ] : [],
                //a function for calculating indentation after each new
                //line
                nl = function jspretty__result_nl(x) {
                    var c = (scope === true) ? ["<em>&#10;</em></li><li class='l" + g + "'>"] : ["\n"],
                        d = 0;
                    if (scope === true) {
                        data.push("<li>");
                        data.push(e);
                        data.push("</li>");
                        e += 1;
                        if (a < b - 1 && token[a + 1].indexOf("/*") === 0) {
                            c[0] = "<em>&#10;</em></li><li class='c0'>";
                        } else if (x > 0) {
                            if (x > 16) {
                                d = 17;
                            } else {
                                d = g;
                            }
                            if (g === x + 1 && x > 0) {
                                d -= 1;
                            }
                            c.push(lscope[d - 1]);
                        }
                    }
                    for (d; d < x; d += 1) {
                        c.push(tab);
                    }
                    f = c.join("");
                    return f;
                };
            if (scope === true) {
                if (types[a] === "comment" && token[a].indexOf("/*") === 0) {
                    c.push("<ol class='data'><li class='c0'>");
                } else {
                    c.push("<ol class='data'><li>");
                }
            }
            for (a = 0; a < indent; a += 1) {
                c.push(tab);
            }
            //its important to find the variables separately from
            //building the output so that recursive flows in the loop
            //incrementation do not present simple counting collisions
            //as to what gets modified versus what gets included
            if (scope === true) {
                g = 1;
                for (a = b - 1; a > -1; a -= 1) {
                    if (typeof meta[a] === "number") {
                        g -= 1;
                        findvars(a);
                    } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                        token[a] = "<em class='s" + g + "'>" + token[a] + "</em>";
                        g += 1;
                    }
                }
                g = 0;
            }
            //this loops combines the white space as determined from the
            //algorithm with the tokens to create the output
            for (a = 0; a < b; a += 1) {
                if (scope === true && types[a] === "comment" && token[a].indexOf("/*") === 0) {
                    c.push(blockline(token[a]));
                } else if (scope === true) {
                    if (typeof meta[a] === "number") {
                        g += 1;
                        c.push(token[a]);
                    } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                        c.push(token[a]);
                        g -= 1;
                        h = c.length - 1;
                        do {
                            h -= 1;
                        } while (c[h].indexOf("</li><li") < 0);
                        c[h] = c[h].replace(/class\='l\d+'/, "class='l" + g + "'");
                    } else {
                        c.push(token[a]);
                    }
                } else {
                    c.push(token[a]);
                }
                //this condition performs additional calculations if
                //jpres === true.  jpres determines whether empty lines
                //should be preserved from the code input
                if (jpres === true && a === lines[d][0] && level[a] !== "x" && level[a] !== "s") {
                    //special treatment for math operators
                    if (token[a] === "+" || token[a] === "-" || token[a] === "*" || token[a] === "/") {
                        //comments get special treatment
                        if (a < b - 1 && types[a + 1] !== "comment" && types[a + 1] !== "comment-inline") {
                            c.push(nl(indent));
                            c.push(tab);
                            level[a] = "x";
                        } else {
                            indent = level[a];
                            if (lines[d][1] === true) {
                                c.push("\n");
                            }
                            c.push(nl(indent));
                            c.push(tab);
                            c.push(token[a + 1]);
                            c.push(nl(indent));
                            c.push(tab);
                            level[a + 1] = "x";
                            a += 1;
                        }
                    } else if (lines[d][1] === true && token[a].charAt(0) !== "=" && token[a].charAt(0) !== "!" && (types[a] !== "start" || (a < b - 1 && types[a + 1] !== "end"))) {
                        if (a < b - 1 && (types[a + 1] === "comment" || types[a + 1] === "comment-inline" || (token[a] !== "." && token[a] !== "," && types[a + 1] !== "separator"))) {
                            if (scope === true) {
                                c.push("<em>&#10;</em></li><li>");
                            } else {
                                c.push("\n");
                            }
                            if (level[a] === "x" && scope === false) {
                                c.push("\n");
                            }
                        }
                    }
                    d += 1;
                }
                //adds a new line and no indentation
                if (a < b - 1 && types[a + 1] === "comment" && jcomment === true) {
                    c.push(nl(jlevel));
                } else if (level[a] === "s") {
                    c.push(" ");
                //adds a new line and indentation
                } else if (level[a] !== "x") {
                    indent = level[a];
                    c.push(nl(indent));
                }
            }
            //this logic is necessary to some line counting corrections
            //to the HTML output
            if (scope === true) {
                f = c[c.length - 1];
                if (f.indexOf("<li") > 0) {
                    c[c.length - 1] = "<em>&#10;</em></li>";
                } else if (f.indexOf("</li>") < 0) {
                    c.push("<em>&#10;</em></li>");
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
                summary = data.join("") + f;
                data = [];
                c = [];
                return "";
            }
            return c.join("");
        }()).replace(/(\s+)$/, "");
        //the analysis report is generated in this function
        if (summary !== "diff" && jsscope === false) {
            (function jspretty__report() {
                var a = 0,
                    b = 0,
                    e = 1,
                    f = 1,
                    g = 0,
                    h = 0,
                    i = 0,
                    r = 0,
                    s = [],
                    z = [],
                    output,
                    zero = function jspretty__report_zero(x, y) {
                        if (y === 0) {
                            return "0.00%";
                        }
                        return ((x / y) * 100).toFixed(2) + "%";
                    },
                    drawRow = function jspretty__report_drawRow(w, x, y, z, Z) {
                        var a = ["<tr><th>Keyword '"];
                        a.push(w);
                        a.push("'</th><td ");
                        a.push(x);
                        a.push(">");
                        a.push(y);
                        a.push("</td><td>");
                        a.push(zero(y, m[54]));
                        a.push("</td><td>");
                        a.push(zero(y, Z[0]));
                        a.push("</td><td>");
                        a.push(z);
                        a.push("</td><td>");
                        a.push(zero(z, m[55]));
                        a.push("</td><td>");
                        a.push(zero(z, Z[1]));
                        a.push("</td></tr>");
                        return a.join("");
                    };
                if (result.length <= source.length) {
                    b = source.length;
                } else {
                    b = result.length;
                }
                for (a = 0; a < b; a += 1) {
                    if (args.source.charAt(a) === " ") {
                        g += 1;
                    } else if (args.source.charAt(a) === "\t") {
                        h += 1;
                    } else if (args.source.charAt(a) === "\n") {
                        e += 1;
                    } else if (args.source.charAt(a) === "\r" || args.source.charAt(a) === "\f" || args.source.charAt(a) === "\v") {
                        r += 1;
                    }
                    if (result.charAt(a) === "\n") {
                        f += 1;
                    }
                }
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
                g = g - w[1];
                h = h - w[2];
                r = r - w[3];
                i = ((e - 1 - w[0]) + g + h + r);
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
                //The fastest way to build a string dynamically is by
                //pushing into an array, because the push method creates
                //a new index at the end of the array without checking
                //for length.  String concatenation on the other hand
                //always checks string length, so the operation becomes
                //progressively slower with each operation.
                output = ["<div id='doc'>"];
                output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>");
                output.push("</thead><tbody><tr><th>Total Character Size</th><td>");
                output.push(source.length);
                output.push("</td><td>");
                output.push(result.length);
                output.push("</td><td>");
                output.push(result.length - source.length);
                output.push("</td><td>");
                output.push((((result.length - source.length) / source.length) * 100).toFixed(2));
                output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
                output.push(e);
                output.push("</td><td>");
                output.push(f);
                output.push("</td><td>");
                output.push(f - e);
                output.push("</td><td>");
                output.push((((f - e) / e) * 100).toFixed(2));
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
                output.push(e - 1 - w[0]);
                output.push("</td><td>");
                output.push(zero(e - 1 - w[0], i));
                output.push("</td><td>");
                output.push(zero(e - 1 - w[0], z[0]));
                output.push("</td><td>");
                output.push(e - 1 - w[0]);
                output.push("</td><td>");
                output.push(zero(e - 1 - w[0], i));
                output.push("</td><td>");
                output.push(zero(e - 1 - w[0], z[1]));
                output.push("</td></tr><tr><th>Spaces</th><td>");
                output.push(g);
                output.push("</td><td>");
                output.push(zero(g, i));
                output.push("</td><td>");
                output.push(zero(g, z[0]));
                output.push("</td><td>");
                output.push(g);
                output.push("</td><td>");
                output.push(zero(g, i));
                output.push("</td><td>");
                output.push(zero(g, z[1]));
                output.push("</td></tr><tr><th>Tabs</th><td>");
                output.push(h);
                output.push("</td><td>");
                output.push(zero(h, i));
                output.push("</td><td>");
                output.push(zero(h, z[0]));
                output.push("</td><td>");
                output.push(h);
                output.push("</td><td>");
                output.push(zero(h, i));
                output.push("</td><td>");
                output.push(zero(h, z[1]));
                output.push("</td></tr><tr><th>Other Whitespace</th><td>");
                output.push(r);
                output.push("</td><td>");
                output.push(zero(r, i));
                output.push("</td><td>");
                output.push(zero(r, z[0]));
                output.push("</td><td>");
                output.push(r);
                output.push("</td><td>");
                output.push(zero(r, i));
                output.push("</td><td>");
                output.push(zero(r, z[1]));
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
                output.push(drawRow("new", "", m[28], m[29], z));
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
        return result;
    },
    //the edition values use the format YYMMDD for dates.
    edition = {
        jspretty: 130311
    };
edition.latest = edition.jspretty;