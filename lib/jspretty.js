/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
/*global markupmin, js_beautify, cleanCSS*/
/*
 This code may be used internally to Travelocity without limitation,
 exclusion, or restriction.  If this code is used externally the
 following comment must be included everywhere this code is used.
 
 Special thanks to Harry Whitfield for assistance in providing test
 cases.
 */
/***********************************************************************
 This is written by Austin Cheney on 2 Nov 2012.  Anybody may use this
 code without permission so long as this comment exists verbatim in each
 instance of its use.

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
            token = [],
            types = [],
            level = [],
            lines = [],
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
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
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
        (function jspretty__tokenize() {
            var a = 0,
                b = source.length,
                c = source.split(""),
                t = "",
                u = "",
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
                        n = a + offset;
                    for (e = n; e < j; e += 1) {
                        l.push(c[e]);
                        if (c[e] === h[i] || (m && (c[e] === "\n" || e === j - 1))) {
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
                    if (e < j) {
                        a = e;
                        if (start === "//") {
                            l.pop();
                        }
                        return l.join("");
                    }
                    return "";
                },
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
                operator = function jspretty__tokenize_operator() {
                    var e = [
                            "=", "<", ">", "+", "-", "*", "?", "|", "^", ":", "&"
                        ],
                        f = [c[a]],
                        g = 0,
                        h = 0,
                        i = e.length,
                        j = b;
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
                    return f.join("");
                },
                regex = function jspretty__tokenize_regex() {
                    var e = 0,
                        f = b,
                        g = ["/"],
                        h = 0,
                        i = 0;
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
                    return g.join("");
                },
                numb = function jspretty__tokenize_number() {
                    var e = 0,
                        f = b,
                        g = [c[a]];
                    for (e = a + 1; e < f; e += 1) {
                        if ((/[0-9]/).test(c[e]) || c[e] === ".") {
                            g.push(c[e]);
                        } else {
                            break;
                        }
                    }
                    a = e - 1;
                    return g.join("");
                },
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
                word = function jspretty__tokenize_word() {
                    var e = [],
                        f = a,
                        g = b,
                        h = "";
                    do {
                        e.push(c[f]);
                        f += 1;
                    } while (f < g && !((/\s/).test(c[f]) || c[f] === ";" || c[f] === "=" || c[f] === "." || c[f] === "," || c[f] === "<" || c[f] === ">" || c[f] === "+" || c[f] === "-" || c[f] === "*" || c[f] === "/" || c[f] === "!" || c[f] === "?" || c[f] === "|" || c[f] === "^" || c[f] === ":" || c[f] === "\"" || c[f] === "'" || c[f] === "\\" || c[f] === "/" || c[f] === "(" || c[f] === ")" || c[f] === "{" || c[f] === "}" || c[f] === "[" || c[f] === "]" || c[f] === "&"));
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
                } else if (c[a] === "-" && a < b - 1 && c[a + 1] !== "=" && c[a + 1] !== "-" && (u === "literal" || u === "word") && t !== "return") {
                    n[0] += 1;
                    n[1] += 1;
                    t = "-";
                    u = "operator";
                    token.push(t);
                    types.push(u);
                } else if ((/\d/).test(c[a]) || (a !== b - 2 && c[a] === "-" && c[a + 1] === "." && (/\d/).test(c[a + 2])) || (a !== b - 1 && (c[a] === "-" || c[a] === ".") && (/\d/).test(c[a + 1]))) {
                    t = numb();
                    u = "literal";
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
                    } else if (types.length === 0 || t === "function" || t === "for" || t === "if" || t === "while" || t === "switch" || u === "separator" || u === "operator" || (a > 0 && (/\s/).test(c[a - 1]))) {
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
                } else if (c[a] === "=" || c[a] === "<" || c[a] === ">" || c[a] === "+" || c[a] === "-" || c[a] === "*" || c[a] === "/" || c[a] === "!" || c[a] === "?" || c[a] === "|" || c[a] === "^" || c[a] === ":" || c[a] === "&") {
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
                    if (t === "alert") {
                        m[0] += 1;
                    } else if (t === "break") {
                        m[2] += 1;
                    } else if (t === "case") {
                        m[4] += 1;
                    } else if (t === "catch") {
                        m[48] += 1;
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
                indent = jlevel,
                obj = [],
                list = [],
                lastlist = false,
                ternary = false,
                varline = [],
                casetest = [],
                fortest = 0,
                ctype = "",
                ctoke = "",
                ltype = types[0],
                ltoke = token[0],
                separator = function jspretty__algorithm_separator() {
                    if (ctoke === ".") {
                        level[a - 1] = "x";
                        return level.push("x");
                    }
                    if (ctoke === ",") {
                        level[a - 1] = "x";
                        if (list[list.length - 1] === false) {
                            (function jspretty__algorithm_separator_listTest() {
                                var c = 0,
                                    d = 0;
                                for (c = a - 1; c > -1; c -= 1) {
                                    if (token[c] === "]" || token[c] === "}") {
                                        d += 1;
                                    }
                                    if (token[c] === "[" || token[c] === "{") {
                                        d -= 1;
                                        if (token[c] === "[" && d === -1) {
                                            obj[obj.length - 1] = false;
                                        }
                                    }
                                    if (d === -1) {
                                        if (token[c] === "{" && token[c - 1] !== ")") {
                                            obj[obj.length - 1] = true;
                                        }
                                        if (varline[varline.length - 1] === false) {
                                            list[list.length - 1] = true;
                                        }
                                        return;
                                    }
                                    if (types[c] === "method" || token[c] === "(" || (token[c] === ";" && d === 0)) {
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
                                    if (token[c] === "}" || token[c] === "]") {
                                        d += 1;
                                    }
                                    if (token[c] === "{" || token[c] === "[") {
                                        d -= 1;
                                    }
                                    if (d === -1 && token[c] === "[" && token[c + 1] !== "]" && token[c + 2] !== "]") {
                                        level[c] = indent;
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
                        return level.push("s");
                    }
                    if (ctoke === ";") {
                        if (fortest === 0) {
                            if (varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                                indent -= 1;
                            }
                            level[a - 1] = "x";
                            return level.push(indent);
                        }
                        if (fortest > 0) {
                            level[a - 1] = "x";
                            return level.push("s");
                        }
                        return level.push("s");
                    }
                },
                start = function jspretty__algorithm_start() {
                    varline.push(false);
                    list.push(false);
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
                        return level.push(indent);
                    }
                    obj.push(false);
                    if (ctoke === "(") {
                        if (fortest > 0 && ltoke !== "for") {
                            fortest += 1;
                        }
                        if (ltoke === "}") {
                            level[a - 1] = indent;
                            return level.push("x");
                        }
                        if (jspace === false && ltoke === "function") {
                            level[a - 1] = "x";
                        }
                        return level.push("x");
                    }
                    if (ctoke === "[") {
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
                    return level.push("x");
                },
                end = function jspretty__algorithm_end() {
                    if (a - 1 === lines[l][0] && ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start" && ltoke !== "}") {
                        if (varline[varline.length - 1] === true) {
                            varline[varline.length - 1] = false;
                            indent -= 1;
                        }
                        if (ltoke === "}" || ltoke === "]") {
                            level[a - 1] = indent - 1;
                        } else {
                            level[a - 1] = indent;
                        }
                        l += 1;
                        ltoke = ";";
                        ltype = "separator";
                    }
                    if (ctoke !== ")") {
                        indent -= 1;
                    } else if (fortest > 0 && ctoke === ")") {
                        fortest -= 1;
                    }
                    if (ctoke === "}" && ltoke !== "{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || token[a - 2] !== ";" || ltoke === "break" || ltoke === "return")) {
                        (function jspretty__algorithm_end_curlyBrace() {
                            var c = 0,
                                d = 1,
                                e = false;
                            for (c = a - 1; c > -1; c -= 1) {
                                if (types[c] === "end") {
                                    d += 1;
                                }
                                if (types[c] === "start" || types[c] === "method") {
                                    d -= 1;
                                }
                                if (token[c] === "=" || token[c] === ";") {
                                    e = true;
                                }
                                if (d === 1) {
                                    if ((token[c] === ":" && ternary === false) || (token[c] === "," && e === false && varline[varline.length - 1] === false)) {
                                        return;
                                    }
                                    if ((c === 0 || token[c - 1] === "{") || token[c] === "for" || token[c] === "if" || token[c] === "do" || token[c] === "function" || token[c] === "while" || token[c] === "var") {
                                        if (list[list.length - 1] === false) {
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
                    if (ctoke === "}") {
                        casetest.pop();
                    }
                    if ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]")) {
                        level[a - 1] = "x";
                        level.push("x");
                    } else if (ctoke === "]") {
                        if (a > 1 && token[a - 2] === "[") {
                            level[a - 1] = "x";
                        } else if (list[list.length - 1] === true || (ltoke === "]" && level[level.length - 2] === indent + 1)) {
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
                    lastlist = list[list.length - 1];
                    list.pop();
                    varline.pop();
                    obj.pop();
                    if (ctoke !== ")") {
                        ternary = false;
                    }
                },
                operator = function jspretty__algorithm_operator() {
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
                        if (ltype === "start") {
                            level[a - 1] = "x";
                        }
                        if (ltoke === "}") {
                            level[a - 1] = indent;
                        }
                        return level.push("x");
                    }
                    if (ctoke === ":") {
                        if (casetest[casetest.length - 1] === true) {
                            if (a < b - 1 && token[a + 1] !== "case" && token[a + 1] !== "default") {
                                indent += 1;
                            }
                            level[a - 1] = "x";
                            return level.push(indent);
                        }
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
                                    if (token[c] === "?") {
                                        ternary = true;
                                        level[a - 1] = "s";
                                        return level.push("s");
                                    }
                                    if ((c > 0 && types[c - 1] === "start") || token[c] === ";" || (l > 0 && c === lines[l - 1][0])) {
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
                    level.push("s");
                },
                word = function jspretty__algorithm_word() {
                    if (a - 1 === lines[l][0] && ltype !== "method" && ltype !== "separator" && ltype !== "operator" && ltype !== "start" && ltoke !== "}") {
                        ltoke = ";";
                        ltype = "separator";
                        if (varline[varline.length - 1] === true) {
                            varline[varline.length - 1] = false;
                            indent -= 1;
                        }
                        level[a - 1] = indent;
                        l += 1;
                    }
                    if (ctoke === "function" && jspace === false && a < b - 1 && token[a + 1] === "(") {
                        return level.push("x");
                    }
                    if (ltoke === "}" && ctoke === "while") {
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
                    } else if (ltoke === "}" && ctoke === "else") {
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
                    } else if (ctoke === "switch" && casetest[casetest.length - 1] === true) {
                        casetest[casetest.length - 1] = false;
                    } else if (ctoke === "default" || ctoke === "case") {
                        if (casetest[casetest.length - 1] === false) {
                            if (ltoke === "{") {
                                level[a - 1] -= 1;
                            }
                            if (ltoke === "{") {
                                indent -= 1;
                            }
                            casetest[casetest.length - 1] = true;
                        } else if (ltoke !== ":") {
                            indent -= 1;
                            level[a - 1] = indent;
                        }
                        if (ltoke === "}") {
                            indent -= 1;
                            level[a - 1] = indent;
                        }
                    } else if ((ctoke === "break" || ctoke === "return") && casetest[casetest.length - 1] === true) {
                        level[a - 1] = indent;
                        (function jspretty__algorithm_word_break() {
                            var c = 0;
                            for (c = a + 1; c < b; c += 1) {
                                if (token[c] === "}") {
                                    return;
                                }
                                if (token[c] === "case" || token[c] === "default" || token[c] === "switch") {
                                    indent -= 1;
                                    return;
                                }
                            }
                        }());
                        casetest[casetest.length - 1] = false;
                    } else if (ltoke === "}" && level[a - 1] === "x") {
                        level[a - 1] = indent;
                    }
                    level.push("s");
                };
            for (a = 0; a < b; a += 1) {
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
                    level[a - 1] = "s";
                    level.push(indent);
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
                tab = (function jspretty__result_tab() {
                    var a = jchar,
                        b = jsize,
                        c = [];
                    for (b; b > 0; b -= 1) {
                        c.push(a);
                    }
                    return c.join("");
                }()),
                nl = function jspretty__result_nl(a) {
                    var b = ["\n"],
                        c = 0;
                    for (c = 0; c < a; c += 1) {
                        b.push(tab);
                    }
                    return b.join("");
                };
            for (a = 0; a < b; a += 1) {
                c.push(token[a]);
                if (jpres && a === lines[d][0]) {
                    if (lines[d][1] === true && (types[a] !== "start" || (a < b - 1 && (types[a + 1] !== "end")))) {
                        c.push("\n");
                        if (level[a] === "x") {
                            c.push("\n");
                        }
                    }
                    d += 1;
                }
                if (types[a] === "comment" && jcomment) {
                    c.push(nl(0));
                } else if (level[a] === "s") {
                    c.push(" ");
                } else if (level[a] !== "x") {
                    c.push(nl(level[a]));
                }
            }
            return c.join("");
        }()).replace(/(\s+)$/, "");
        //the analysis report is generated in this function
        if (summary !== "diff") {
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
                m[54] = m[0] + m[2] + m[4] + m[6] + m[8] + m[10] + m[12] + m[14] + m[16] + m[18] + m[20] + m[22] + m[24] + m[26] + m[28] + m[30] + m[32] + m[34] + m[36] + m[38] + m[40] + m[42] + m[44] + m[46] + m[48] + m[50] + m[52];
                m[55] = m[1] + m[3] + m[5] + m[7] + m[9] + m[11] + m[13] + m[15] + m[17] + m[19] + m[21] + m[23] + m[25] + m[27] + m[29] + m[31] + m[33] + m[35] + m[37] + m[39] + m[41] + m[43] + m[45] + m[47] + m[49] + m[51] + m[53];
                z.push(j[2] + l[0] + n[5] + m[54] + o[0] + p[0] + q[0] + i);
                z.push(j[3] + l[1] + n[6] + m[55] + o[1] + p[1] + q[1] + i);
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
                output.push(m[54]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(m[54], z[0]));
                output.push("</td><td>");
                output.push(m[55]);
                output.push("</td><td>100.00%</td><td>");
                output.push(zero(m[55], z[1]));
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
        return result;
    };