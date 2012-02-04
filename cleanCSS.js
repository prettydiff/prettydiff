/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
/*
 cleanCSS.js is originally written by Anthony Lieuallen
 http://tools.arantius.com/tabifier

 This code is used with permission from the original author and is
 modified to meet the strict demands imposed by the Pretty Diff tool and
 JSLint.

 http://prettydiff.com/
 http://jslint.com/

 css_summary is a function that is not provided a scope by the cleanCSS
 function.  It is intended to be provided as a closure that it can
 access the interiors of cleanCSS, but remain accessible outside
 cleanCSS.  This function returns the number of HTTP requests from the
 beautified CSS and what those requests are.

 Arguements:

 * x is the source code input
 * size is the character size of an indentation
 * character is the character that makes up an indentation
 * comment determines whether or not code comments should be indented
 to match the code or whitespace collapsed and left justified if
 passed the value "noindent"
 * alter is whether or not the source code should be manipulated to
 correct some violations
 -----------------------------------------------------------------------
 */
var cleanCSS = function (x, size, character, comment, alter) {
        "use strict";
        var q = x.length,
            a,
            b,

            //This finds all the charset declarations.
            atchar = x.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
            tab = "",

            //fixURI forcefully inserts double quote characters into URI
            //fragments.  If parenthesis characters are included as part of
            //the URI fragment they must be escaped with a backslash
            //character in accordance with the CSS specification: "\( \)".
            //If parenthesis iscincluded as part of the URI string and not
            //escaped fixURI will break your code.
            fixURI = function (y) {
                var a;
                y = y.replace(/\\\)/g, "~PDpar~").split("url(");
                for (a = 1; a < y.length; a += 1) {
                    if (y[a].charAt(0) !== "\"" && y[a].charAt(0) !== "'") {
                        y[a] = ("url(\"" + y[a]).split(")");
                        if (y[a][0].charAt(y[a][0].length - 1) !== "\"" && y[a][0].charAt(y[a][0].length - 1) !== "'") {
                            y[a][0] = y[a][0] + "\"";
                        } else if (y[a][0].charAt(y[a][0].length - 1) === "'" || y[a][0].charAt(y[a][0].length - 1) === "\"") {
                            y[a][0] = y[a][0].substr(0, y[a][0].length - 1) + "\"";
                        }
                        y[a] = y[a].join(")");
                    } else if (y[a].charAt(0) === "\"") {
                        y[a] = ("url(" + y[a]).split(")");
                        if (y[a][0].charAt(y[a][0].length - 1) !== "\"" && y[a][0].charAt(y[a][0].length - 1) !== "'") {
                            y[a][0] = y[a][0] + "\"";
                        } else if (y[a][0].charAt(y[a][0].length - 1) === "'" || y[a][0].charAt(y[a][0].length - 1) === "\"") {
                            y[a][0] = y[a][0].substr(0, y[a][0].length - 1) + "\"";
                        }
                        y[a] = y[a].join(")");
                    } else {
                        y[a] = ("url(\"" + y[a].substr(1, y[a].length - 1)).split(")");
                        if (y[a][0].charAt(y[a][0].length - 1) !== "\"" && y[a][0].charAt(y[a][0].length - 1) !== "'") {
                            y[a][0] = y[a][0] + "\"";
                        } else if (y[a][0].charAt(y[a][0].length - 1) === "'" || y[a][0].charAt(y[a][0].length - 1) === "\"") {
                            y[a][0] = y[a][0].substr(0, y[a][0].length - 1) + "\"";
                        }
                        y[a] = y[a].join(")");
                    }
                }
                return y.join("").replace(/~PDpar~/g, "\\)");
            },
            tabmaker = (function () {
                var i;
                for (i = 0; i < Number(size); i += 1) {
                    tab += character;
                }
            }()),

            //sameDist is used by a replace method to remove redundant
            //distance values amongst a single property declaration.
            sameDist = function (y) {
                if (y === "0") {
                    return y;
                }
                y = y.substr(2, y.length);
                y = y.split(" ");
                if (y.length === 4) {
                    if (y[0] === y[1] && y[1] === y[2] && y[2] === y[3]) {
                        y[1] = "";
                        y[2] = "";
                        y[3] = "";
                    } else if (y[0] === y[2] && y[1] === y[3] && y[0] !== y[1]) {
                        y[2] = "";
                        y[3] = "";
                    } else if (y[0] !== y[2] && y[1] === y[3]) {
                        y[3] = "";
                    }
                } else if (y.length === 3 && y[0] === y[2] && y[0] !== y[1]) {
                    y[2] = "";
                } else if (y.length === 2 && y[0] === y[1]) {
                    y[1] = "";
                }
                return ": " + y.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
            },

            //endZero is used by a replace method to remove extraneous
            //decimal characters if they are followed by 0 or more zero
            //characters.
            endZero = function (y) {
                var a = y.indexOf(".");
                return y.substr(0, a);
            },

            //runZero suppresses continuous runs of 0 to a single 0 if they
            //are not preceeded by a period (.), number sign (#), or a hex
            //digit (0-9, a-f)
            runZero = function (y) {
                var a = y.charAt(0);
                if (a === "#" || a === "." || /[a-f0-9]/.test(a)) {
                    return y;
                } else {
                    return a + "0;";
                }
            },

            //startZero is used to add a leading zero character to positive
            //numbers less than 1.
            startZero = function (y) {
                return y.replace(/ \./g, " 0.");
            },

            //emptyend is used to remove properties that are absent a value
            //and semicolon at the end of a property list
            emptyend = function (y) {
                var b = y.match(/^(\s*)/)[0],
                    c = b.substr(0, b.length - tab.length);
                if (y.charAt(y.length - 1) === "}") {
                    return c + "}";
                } else {
                    return c.replace(/(\s+)$/, "");
                }
            },

            //This prevents percentage numbers from running together
            fixpercent = function (y) {
                return y.replace(/%/, "% ");
            },

            //removes semicolons that appear between closing curly braces
            nestblock = function (y) {
                return y.replace(/\s*;\n/, "\n");
            },

            //cleanAsync is the core of cleanCSS.  This function applies
            //most of the new line characters and all the indentation.
            cleanAsync = function () {
                var i,
                    j,
                    b = x.length,
                    tabs = [],
                    tabb = "",
                    out = [tab],
                    y = x.split("");
                for (i = 0; i < b; i += 1) {
                    if ("{" === y[i]) {
                        tabs.push(tab);
                        tabb = tabs.join("");
                        out.push(" {\n" + tabb);
                    } else if ("\n" === y[i]) {
                        out.push("\n" + tabb);
                    } else if ("}" === y[i]) {
                        out[out.length - 1] = out[out.length - 1].replace(/\s*$/, "");
                        tabs = tabs.slice(0, tabs.length - 1);
                        tabb = tabs.join("");
                        if (y[i + 1] + y[i + 2] !== "*/") {
                            out.push("\n" + tabb + "}\n" + tabb);
                        } else {
                            out.push("\n" + tabb + "}");
                        }
                    } else if (y[i - 1] === "," && (/\s/).test(y[i]) === false) {
                        out.push(" ");
                        out.push(y[i]);
                    } else if (";" === y[i] && "}" !== y[i + 1]) {
                        out.push(";\n" + tabb);
                    } else if (i > 3 && y[i - 3] === "u" && y[i - 2] === "r" && y[i - 1] === "l" && y[i] === "(") {
                        for (j = i; j < b; j += 1) {
                            out.push(y[j]);
                            if (y[j] === ")" && y[j - 1] !== "\\") {
                                i = j;
                                break;
                            }
                        }
                    } else {
                        out.push(y[i]);
                    }
                }
                if (i >= b) {
                    out = [out.join("").replace(/^(\s*)/, "").replace(/(\s*)$/, "")];
                    x = out.join("");
                    tabs = [];
                }
            },

            //This function is used to provide some minor algorithms to
            //combine some CSS properties than can be combined and provides
            //some advanced beautification.  This function does not condense
            //the font or border properties at this time.
            reduction = function () {
                var a,
                    e,
                    f,
                    g,
                    m,
                    p,
                    b = x.length,
                    c = "",
                    d = [],
                    h = [],
                    test = false,

                    //colorLow is used by a replace method to convert hex
                    //color codes to lowercase alpha characters and in some
                    //cases reduce the character count from 6 to 3.
                    colorLow = function (y) {
                        y = y.toLowerCase();
                        if (y.length === 7 && y.charAt(1) === y.charAt(2) && y.charAt(3) === y.charAt(4) && y.charAt(5) === y.charAt(6)) {
                            y = "#" + y.charAt(1) + y.charAt(3) + y.charAt(5);
                        }
                        return y;
                    },
                    ccex = (/[\w\s:#\-\=\!\(\)"'\[\]\.%-\_\?\/\\]\/\*/),
                    cceg = function (a) {
                        return a.replace(/\s*\/\*/, ";/*");
                    };
                for (a = 0; a < b; a += 1) {
                    c += x.charAt(a);
                    if (x.charAt(a) === "{" || x.charAt(a + 1) === "}") {
                        d.push(c);
                        c = "";
                    }
                }
                for (b = a - 1; b > 0; b -= 1) {
                    if (x.charAt(b) === "/" && x.charAt(b - 1) && x.charAt(b - 1) === "*") {
                        for (c = b - 1; c > 0; c -= 1) {
                            if (x.charAt(c) === "/" && x.charAt(c + 1) === "*") {
                                b = c;
                                break;
                            }
                        }
                    } else if (!/[\}\s]/.test(x.charAt(b))) {
                        break;
                    }
                }
                for (a = d.length - 1; a > 0; a -= 1) {
                    if (d[a] === "}") {
                        b += 1;
                    } else {
                        break;
                    }
                }
                if (b === x.length || x.substring(b + 1, x.length - 1) === d[d.length - 1]) {
                    d.push("}");
                } else {
                    d.push(x.substring(b + 1, x.length));
                }
                b = d.length;
                for (a = 0; a < b; a += 1) {
                    if (d[a].charAt(d[a].length - 1) === "{") {
                        d[a] = d[a].replace(/,\s*/g, ",\n").replace(/>/g, " > ");
                    } else {
                        if (d[a].indexOf("url(") > -1) {
                            h = d[a].split("");
                            f = h.length;
                            for (e = 3; e < f; e += 1) {
                                if (h[e - 3] === "u" && h[e - 2] === "r" && h[e - 1] === "l" && h[e] === "(") {
                                    test = true;
                                }
                                if (test) {
                                    if (h[e - 1] !== "\\" && h[e] === ")") {
                                        test = false;
                                    } else if (h[e] === ";") {
                                        h[e] = "~PrettyDiffSemi~";
                                    } else if (h[e] === ":") {
                                        h[e] = "~PrettyDiffColon~";
                                    }
                                }
                            }
                            d[a] = h.join("");
                        }
                        if (d[a].charAt(d[a].length - 1) === ";") {
                            d[a] = d[a].substr(0, d[a].length - 1);
                        }
                        c = d[a].replace(ccex, cceg);
                        (function () {
                            var a = c.split(""),
                                b = c.length,
                                d = 0,
                                e = false;
                            for (d = 1; d < b; d += 1) {
                                if (a[d] === "*" && a[d - 1] === "/" && !e) {
                                    e = true
                                } else if (e) {
                                    if (a[d] === ";") {
                                        a[d] = "~PrettyDiffS~";
                                    } else if (a[d] === "/" && a[d - 1] === "*") {
                                        e = false;
                                    }
                                }
                            }
                            c = a.join("");
                        }());
                        c = c.replace(/\*\//g, "*/;").replace(/\:(?!(\/\/))/g, "$").replace(/#[a-fA-F0-9]{3,6}(?!(\w*\)))/g, colorLow).split(";");
                        f = c.length;
                        m = [];
                        p = [];
                        for (e = 0; e < f; e += 1) {
                            if (/^(\/\*)/.test(c[e])) {
                                m.push(c[e].replace(/\/\*\s*/, "/* "));
                            } else if (c[e] !== "") {
                                p.push(c[e].replace(/^\s*/, ""));
                            }
                        }

                        p = p.sort();
                        f = p.length;
                        c = p[p.length - 1];
                        for (e = 0; e < f; e += 1) {
                            if (p[e] === c) {
                                break;
                            }
                            if (p[e].charAt(0) === "_") {
                                p.push(p[e]);
                                p.splice(e, 1);
                            }
                        }
                        c = m.sort().concat(p);
                        f = c.length;
                        for (e = 0; e < f; e += 1) {
                            c[e] = c[e].split("$");
                        }
                        g = -1;
                        m = 0;
                        p = 0;
                        for (e = 0; e < f; e += 1) {
                            if (c[e - 1] && c[e - 1][0] === c[e][0] && /\-[a-z]/.test(c[e - 1][1]) === false) {
                                c[e - 1] = "";
                            }
                            if (c[e][0] !== "margin" && c[e][0].indexOf("margin") !== -1) {
                                m += 1;
                                if (m === 4) {
                                    c[e][0] = "margin";
                                    c[e][1] = c[e][1] + " " + c[e - 1][1] + " " + c[e - 3][1] + " " + c[e - 2][1];
                                    c[e - 3] = "";
                                    c[e - 2] = "";
                                    c[e - 1] = "";
                                    if (c[e - 4] && c[e - 4][0] === "margin") {
                                        c[e - 4] = "";
                                    }
                                }
                            } else if (c[e][0] !== "padding" && c[e][0].indexOf("padding") !== -1) {
                                p += 1;
                                if (p === 4) {
                                    c[e][0] = "padding";
                                    c[e][1] = c[e][1] + " " + c[e - 1][1] + " " + c[e - 3][1] + " " + c[e - 2][1];
                                    c[e - 3] = "";
                                    c[e - 2] = "";
                                    c[e - 1] = "";
                                    if (c[e - 4] && c[e - 4][0] === "padding") {
                                        c[e - 4] = "";
                                    }
                                }
                            }
                            if (g === -1 && c[e + 1] && c[e][0].charAt(0) !== "-" && (c[e][0].indexOf("cue") !== -1 || c[e][0].indexOf("list-style") !== -1 || c[e][0].indexOf("outline") !== -1 || c[e][0].indexOf("overflow") !== -1 || c[e][0].indexOf("pause") !== -1) && (c[e][0] === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")) || c[e][0].substring(0, c[e][0].lastIndexOf("-")) === c[e + 1][0].substring(0, c[e + 1][0].lastIndexOf("-")))) {
                                g = e;
                                if (c[g][0].indexOf("-") !== -1) {
                                    c[g][0] = c[g][0].substring(0, c[g][0].lastIndexOf("-"));
                                }
                            } else if (g !== -1 && c[g][0] === c[e][0].substring(0, c[e][0].lastIndexOf("-"))) {
                                if (c[g][0] === "cue" || c[g][0] === "pause") {
                                    c[g][1] = c[e][1] + " " + c[g][1];
                                } else {
                                    c[g][1] = c[g][1] + " " + c[e][1];
                                }
                                c[e] = "";
                            } else if (g !== -1) {
                                g = -1;
                            }
                        }
                        for (e = 0; e < f; e += 1) {
                            if (c[e] !== "") {
                                c[e] = c[e].join(": ");
                            }
                        }
                        d[a] = (c.join(";") + ";").replace(/^;/, "");
                    }
                }
                x = d.join("").replace(/\*\/\s*;\s*/g, "*/\n").replace(/(\s*[\w\-]+:)$/g, "\n}").replace(/\s*;$/, "");
            };

        if ("\n" === x.charAt(0)) {
            x = x.substr(1);
        }
        x = x.replace(/[ \t\r\v\f]+/g, " ").replace(/\n /g, "\n").replace(/\s?([;:{},+>])\s?/g, "$1").replace(/\{(\.*):(\.*)\}/g, "{$1: $2}").replace(/\b\*/g, " *").replace(/\*\/\s?/g, "*/\n").replace(/\d%\d/g, fixpercent).replace(/\/\*\s+/g, "/* ");
        if (alter === true) {
            reduction();
        }
        cleanAsync();
        if (alter === true) {
            x = x.replace(/~PrettyDiffS~/g, "; ").split("*/");
            b = x.length;
            for (a = 0; a < b; a += 1) {
                if (x[a].search(/\s*\/\*/) !== 0) {
                    x[a] = x[a].replace(/@charset\s*("|')?[\w\-]+("|')?;?\s*/gi, "").replace(/(\S|\s)0+(%|in|cm|mm|em|ex|pt|pc)?;/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/:[\w\s\!\.\-%]* \.\d+/g, startZero).replace(/ \.?0((?=;)|(?= )|%|in|cm|mm|em|ex|pt|pc)/g, " 0px");
                    x[a] = x[a].replace(/: ((\.\d+|\d+\.\d+|\d+)[a-zA-Z]+|0 )+((\.\d+|\d+\.\d+|\d+)[a-zA-Z]+)|0/g, sameDist).replace(/background\-position: 0px;/g, "background-position: 0px 0px;").replace(/\s+\*\//g, "*/");
                    x[a] = x[a].replace(/\s*[\w\-]+\:\s*(\}|;)/g, emptyend).replace(/\{\s+\}/g, "{}").replace(/\}\s*;\s*\}/g, nestblock).replace(/:\s+#/g, ": #").replace(/(\s+;+\n)+/g, "\n");
                }
            }
            x = x.join("*/");

            //This logic is used to push the first "@charset" declaration to
            //the top of the page.
            if (atchar === null) {
                atchar = [""];
            } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                atchar[0] = atchar[0] + ";\n";
            } else {
                atchar[0] = atchar[0] + "\n";
            }
            x = atchar[0].replace(/@charset/i, "@charset") + fixURI(x).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";");
        }
        if (comment === "noindent") {
            x = x.replace(/\s+\/\*/g, "\n/*").replace(/\n\s+\*\//g, "\n*/");
        }
        (function () {
            var a,
                b = [],
                c = x.split("\n"),
                d = c.length,
                e = [],
                f = q.toString().split("").reverse(),
                g = x.length.toString().split("").reverse(),
                h = 0;
            for (a = 0; a < d; a += 1) {
                if (c[a].charAt(0) === "/" && c[a].charAt(1) === "*") {
                    for (a; a < d; a += 1) {
                        if (c[a].charAt(c[a].length - 2) === "*" && c[a].charAt(c[a].length - 1) === "/") {
                            break;
                        }
                    }
                } else if (c[a].indexOf("url") !== -1 && c[a].indexOf("url(\"\")") === -1 && c[a].indexOf("url('')") === -1 && c[a].indexOf("url()") === -1) {
                    b.push(c[a]);
                }
            }
            d = b.length;
            for (a = 0; a < d; a += 1) {
                b[a] = b[a].substr(b[a].indexOf("url(\"") + 5, b[a].length);
                b[a] = b[a].substr(0, b[a].indexOf("\")"));
            }
            for (a = 0; a < d; a += 1) {
                e[a] = 1;
                for (c = a + 1; c < d; c += 1) {
                    if (b[a] === b[c]) {
                        e[a] += 1;
                        b[c] = "";
                    }
                }
            }
            for (a = 0; a < d; a += 1) {
                if (b[a] !== "") {
                    h += 1;
                    e[a] = e[a] + "x";
                    if (e[a] === "1x") {
                        e[a] = "<em>" + e[a] + "</em>";
                    }
                    b[a] = "<li>" + e[a] + " - " + b[a] + "</li>";
                }
            }
            if (d === 0) {
                b = "";
            } else {
                b = "<h4>List of HTTP requests:</h4><ul>" + b.join("") + "</ul>";
            }
            c = f.length;
            for (a = 2; a < c; a += 3) {
                f[a] = "," + f[a];
            }
            c = g.length;
            for (a = 2; a < c; a += 3) {
                g[a] = "," + g[a];
            }
            f = f.reverse().join("");
            g = g.reverse().join("");
            if (f.charAt(0) === ",") {
                f = f.slice(1, f.length);
            }
            if (g.charAt(0) === ",") {
                g = g.slice(1, g.length);
            }
            summary = "<p><strong>Total input size:</strong> <em>" + f + "</em> characters</p><p><strong>Total output size:</strong> <em>" + g + "</em> characters</p><p><strong>Number of HTTP requests:</strong> <em>" + h + "</em></p>" + b;
        }());
        return x;
    };