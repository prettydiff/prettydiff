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
var summary = "",
    cleanCSS = function cleanCSS(args) {
        "use strict";
        var x = (typeof args.source !== "string" || args.source === "") ? "Error: no source supplied to cleanCSS." : args.source,
            size = (typeof args.size !== "number" || args.size < 0) ? 4 : args.size,
            character = (typeof args.character !== "string") ? " " : args.character,
            comment = (args.comment === "noindent") ? "noindent" : "",
            alter = (args.alter === true) ? true : false,
            q = x.length,
            a = 0,
            b = 0,
            c = [],
            commstor = [],

            //This finds all the charset declarations.
            atchar = x.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
            tab = "",
            nsize = Number(size),

            //fixURI forcefully inserts double quote characters into URI
            //fragments.  If parenthesis characters are included as part of
            //the URI fragment they must be escaped with a backslash
            //character in accordance with the CSS specification: "\( \)".
            //If parenthesis iscincluded as part of the URI string and not
            //escaped fixURI will break your code.
            fixURI = function cleanCSS__fixURI(y) {
                var aa = 0,
                    bb = [],
                    cc = "",
                    xx = y.replace(/\\\)/g, "~PDpar~").split("url("),
                    d = xx.length,
                    e = "",
                    f = (y.indexOf("data~PrettyDiffColon~") > -1 && y.indexOf("~PrettyDiffSemi~base64") > y.indexOf("data~PrettyDiffColon~")) ? true : false;
                for (aa = 1; aa < d; aa += 1) {
                    e = "\"";
                    if (xx[aa].charAt(0) === "\"") {
                        e = "";
                    } else if (xx[aa].charAt(0) === "'") {
                        xx[aa] = xx[aa].substr(1, xx[aa].length - 1);
                    }
                    bb = xx[aa].split(")");
                    cc = bb[0];
                    if (cc.charAt(cc.length - 1) !== "\"" && cc.charAt(cc.length - 1) !== "'") {
                        cc = cc + "\"";
                    } else if (cc.charAt(cc.length - 1) === "'" || cc.charAt(cc.length - 1) === "\"") {
                        cc = cc.substr(0, cc.length - 1) + "\"";
                    }
                    if (f === true) {
                        bb[0] = cc.replace(/ ?\/ ?/g, "/").replace(/\n{2}/g, "\n");
                    } else {
                        bb[0] = cc.replace(/\s*\/(\s*)/g, "/");
                    }
                    xx[aa] = "url(" + e + bb.join(")");
                }
                return xx.join("").replace(/~PDpar~/g, "\\)");
            },

            //sameDist is used by a replace method to remove redundant
            //distance values amongst a single property declaration.
            sameDist = function cleanCSS__sameDist(x) {
                var y = [],
                    z = x.split(": ");
                if (z[0].indexOf("background") > -1 || z.length > 2) {
                    return x;
                }
                y = z[1].split(" ");
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
                return z[0] + ": " + y.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
            },

            //endZero is used by a replace method to remove extraneous
            //decimal characters if they are followed by 0 or more zero
            //characters.
            endZero = function cleanCSS__endZero(y) {
                var z = y.indexOf(".");
                return y.substr(0, z);
            },

            //runZero suppresses continuous runs of 0 to a single 0 if they
            //are not preceeded by a period (.), number sign (#), or a hex
            //digit (0-9, a-f)
            runZero = function cleanCSS__runZero(y) {
                var z = y.charAt(0);
                if (z === "#" || z === "." || /[a-f0-9]/.test(z)) {
                    return y;
                }
                return z + "0;";
            },

            //startZero is used to add a leading zero character to positive
            //numbers less than 1.
            startZero = function cleanCSS__startZero(y) {
                return y.replace(/ \./g, " 0.");
            },

            //emptyend is used to remove properties that are absent a value
            //and semicolon at the end of a property list
            emptyend = function cleanCSS__emptyend(y) {
                var z = y.match(/^(\s*)/)[0],
                    cc = z.substr(0, z.length - tab.length);
                if (y.charAt(y.length - 1) === "}") {
                    return cc + "}";
                }
                return cc.replace(/(\s+)$/, "");
            },

            //This prevents percentage numbers from running together
            fixpercent = function cleanCSS__fixpercent(y) {
                return y.replace(/%/, "% ");
            },

            //removes semicolons that appear between closing curly braces
            nestblock = function cleanCSS__nestblock(y) {
                return y.replace(/\s*;\n/, "\n");
            },

            //cleanAsync is the core of cleanCSS.  This function applies
            //most of the new line characters and all the indentation.
            cleanAsync = function cleanCSS__cleanAsync() {
                var i = 0,
                    j = 0,
                    z = x.length,
                    tabs = [],
                    tabb = "",
                    out = [tab],
                    y = x.split("");
                for (i = 0; i < z; i += 1) {
                    if ("{" === y[i]) {
                        tabs.push(tab);
                        tabb = tabs.join("");
                        out.push(" {\n");
                        out.push(tabb);
                    } else if ("\n" === y[i]) {
                        out.push("\n");
                        out.push(tabb);
                    } else if ("}" === y[i]) {
                        out[out.length - 1] = out[out.length - 1].replace(/\s*$/, "");
                        tabs = tabs.slice(0, tabs.length - 1);
                        tabb = tabs.join("");
                        if (y[i + 1] + y[i + 2] !== "*\/") {
                            out.push("\n");
                            out.push(tabb);
                            out.push("}\n");
                            out.push(tabb);
                        } else {
                            out.push("\n");
                            out.push(tabb);
                            out.push("}");
                        }
                    } else if (y[i - 1] === "," && (/\s/).test(y[i]) === false) {
                        out.push(" ");
                        out.push(y[i]);
                    } else if (";" === y[i] && "}" !== y[i + 1]) {
                        out.push(";\n");
                        out.push(tabb);
                    } else if (i > 3 && y[i - 3] === "u" && y[i - 2] === "r" && y[i - 1] === "l" && y[i] === "(") {
                        for (j = i; j < z; j += 1) {
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
                if (i >= z) {
                    out = [out.join("").replace(/^(\s*)/, "").replace(/(\s*)$/, "")];
                    x = out.join("");
                    tabs = [];
                }
            },

            //This function is used to provide some minor algorithms to
            //combine some CSS properties than can be combined and provides
            //some advanced beautification.  This function does not condense
            //the font or border properties at this time.
            reduction = function cleanCSS__reduction(x) {
                var aa = 0,
                    e = 0,
                    f = 0,
                    g = -1,
                    m = 0,
                    p = 0,
                    r = 0,
                    qq = "",
                    bb = x.length,
                    cc = [],
                    d = [],
                    h = [],
                    i = [],
                    test = false,

                    //colorLow is used by a replace method to convert hex
                    //color codes to lowercase alpha characters and in some
                    //cases reduce the character count from 6 to 3.
                    colorLow = function cleanCSS__reduction_colorLow(y) {
                        var aaa = y.charAt(0),
                            bbb = false;
                        if (y.length === 8 || y.length === 5) {
                            y = y.substr(1);
                            bbb = true;
                        }
                        y = y.toLowerCase();
                        if (y.length === 7 && y.charAt(1) === y.charAt(2) && y.charAt(3) === y.charAt(4) && y.charAt(5) === y.charAt(6)) {
                            y = "#" + y.charAt(1) + y.charAt(3) + y.charAt(5);
                        }
                        if (aaa === ":") {
                            y = aaa + "PDpoundPD" + y;
                        } else if (bbb && !(/\s/).test(aaa) && aaa !== "(") {
                            y = aaa + " " + y;
                        } else if (bbb && ((/\s/).test(aaa) || aaa === "(")) {
                            y = aaa + y;
                        }
                        return y;
                    },
                    ccex = (/[\w\s:#\-\=\!\(\)"'\[\]\.%-\_\?\/\\]\/(\*)/),
                    cceg = function cleanCSS__reduction_cceg(z) {
                        if (z.indexOf("\n/*") === 0) {
                            return z;
                        }
                        return z.replace(/\s*\/(\*)/, ";/*");
                    },
                    commfix = function cleanCSS_reduction_commfix(y) {
                        if (y.charAt(y.length - 1) === "}") {
                            return y.replace(";", "");
                        }
                        return y.replace(";", "\n");
                    };

                //create an initial structured array to parse
                (function cleanCSS__reduction_missingSemicolon() {
                    var misssemi = function cleanCSS__reduction_missingSemicolon_misssemi(y) {
                            if (y.indexOf("\n") === -1) {
                                return y;
                            }
                            return y.replace(/\s+/, ";");
                        },
                        z = x.length,
                        ccc = [],
                        eee = 0,
                        qqq = "";
                    for (aa = 0; aa < z; aa += 1) {
                        if (x.charAt(aa) === "/" && x.charAt(aa + 1) === "*") {
                            d.push(ccc.join(""));
                            ccc = [];
                            if ((/\s/).test(x.charAt(aa - 1)) === true) {
                                for (m = aa - 1; m > -1; m -= 1) {
                                    if (x.charAt(m) === "\n") {
                                        ccc.push("\n");
                                        break;
                                    }
                                    if ((/\s/).test(x.charAt(m)) === false) {
                                        break;
                                    }
                                }
                            }
                            do {
                                ccc.push(x.charAt(aa));
                                aa += 1;
                            } while (x.charAt(aa - 2) !== "*" || (x.charAt(aa - 2) === "*" && x.charAt(aa - 1) !== "/"));
                            if (x.charAt(aa) === "\n") {
                                ccc.push("\n");
                            }
                            d.push(ccc.join(""));
                            ccc = [];
                            if (x.charAt(aa) === "}") {
                                d.push("}");
                            }
                        } else {
                            ccc.push(x.charAt(aa));
                            if (x.charAt(aa) === "{" || x.charAt(aa + 1) === "}") {
                                if (ccc[0] === "}") {
                                    d.push("}");
                                    ccc[0] = "";
                                }
                                qqq = ccc.join("");
                                if (qqq.indexOf("{") > -1 && (qqq.indexOf("\n") > -1 || qqq.indexOf(";") > -1)) {
                                    eee = Math.max(qqq.lastIndexOf("\n"), qqq.lastIndexOf(";"));
                                    d.push(qqq.substring(0, eee + 1).replace(/(\w|\)|"|')\s+/g, misssemi));
                                    d.push(qqq.substring(eee + 1));
                                } else {
                                    d.push(qqq.replace(/(\w|\)|"|')\s+/g, misssemi));
                                }
                                ccc = [];
                            }
                        }
                    }
                    d.push("}");
                }());
                for (bb = aa - 1; bb > 0; bb -= 1) {
                    if (x.charAt(bb) === "/" && x.charAt(bb - 1) && x.charAt(bb - 1) === "*") {
                        for (e = bb - 1; e > 0; e -= 1) {
                            if (x.charAt(e) === "/" && x.charAt(e + 1) === "*") {
                                bb = e;
                                break;
                            }
                        }
                    } else if (!/[\}\s]/.test(x.charAt(bb))) {
                        break;
                    }
                }

                //looks for multidimensional structures, SCSS, and pulls
                //direct properties above child structures
                (function cleanCSS__reduction_scss() {
                    var aaa = 0,
                        bbb = d.length,
                        ccc = 0,
                        eee = 0,
                        fff = 1,
                        ggg = [],
                        hhh = [],
                        iii = [],
                        ttt = false;
                    for (aaa = 0; aaa < bbb; aaa += 1) {
                        if (d[aaa] === "}") {
                            eee -= 1;
                            if (eee === fff - 1 && ggg.length > 0) {
                                hhh = d.slice(0, aaa);
                                iii = d.slice(aaa, d.length);
                                d = [].concat(hhh, ggg, iii);
                                ggg = [];
                                aaa = hhh.length - 1;
                                bbb = d.length;
                            }
                        } else if (d[aaa].indexOf("{") > -1 && (d[aaa].indexOf("/*") === 0 || d[aaa].indexOf("\n/*") === 0)) {
                            eee += 1;
                            if (eee > fff) {
                                ttt = true;
                                fff = eee - 1;
                                ggg.push(d[aaa]);
                                d[aaa] = "";
                                for (ccc = aaa + 1; ccc < bbb; ccc += 1) {
                                    ggg.push(d[ccc]);
                                    if (d[ccc].indexOf("{") > -1) {
                                        eee += 1;
                                        d[ccc] = "";
                                    } else if (d[ccc] === "}") {
                                        eee -= 1;
                                        d[ccc] = "";
                                        if (eee === fff) {
                                            break;
                                        }
                                    } else {
                                        d[ccc] = "";
                                    }
                                }
                            }
                        }
                    }
                    if (ttt === true) {
                        bbb = d.length;
                        ggg = [];
                        for (aaa = 0; aaa < bbb; aaa += 1) {
                            if (ggg.length > 0 && ggg[ggg.length - 1].indexOf("{") === -1 && d[aaa] !== "}" && d[aaa].indexOf("{") === -1 && d[aaa].indexOf("/*") !== 0 && d[aaa].indexOf("\n/*") !== 0) {
                                ggg[ggg.length - 1] = ggg[ggg.length - 1] + d[aaa];
                            } else if (d[aaa] !== "") {
                                ggg.push(d[aaa]);
                            }
                        }
                        d = [].concat(ggg);
                    }
                }());
                for (aa = d.length - 1; aa > 0; aa -= 1) {
                    if (d[aa] === "}") {
                        bb += 1;
                    } else {
                        break;
                    }
                }
                bb = d.length;
                for (aa = 0; aa < bb; aa += 1) {
                    if (d[aa].charAt(d[aa].length - 1) === "{") {
                        d[aa] = d[aa].replace(/>/g, " > ");
                    } else {
                        if (d[aa].indexOf("url(") > -1) {
                            h = d[aa].split("");
                            f = h.length;
                            for (e = 3; e < f; e += 1) {
                                if (h[e - 3] === "u" && h[e - 2] === "r" && h[e - 1] === "l" && h[e] === "(") {
                                    test = true;
                                }
                                if (test === true) {
                                    if (h[e - 1] !== "\\" && h[e] === ")") {
                                        test = false;
                                    } else if (h[ e] === ";") {
                                        h[e] = "~PrettyDiffSemi~";
                                    } else if (h[e] === ":") {
                                        h[e] = "~PrettyDiffColon~";
                                    }
                                }
                            }
                            d[aa] = h.join("");
                        }
                        if (d[aa].charAt(d[aa].length - 1) === ";") {
                            d[aa] = d[aa].substr(0, d[aa].length - 1);
                        }
                        qq = d[aa].replace(ccex, cceg);
                        cc = qq.replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))/g, colorLow).replace(/\*\//g, "*\/;").replace(/:/g, "~PDCSEP~").split(";");
                        f = cc.length;
                        h = [];
                        i = [];
                        for (e = 0; e < f; e += 1) {
                            if (/^(\n?\/\*)/.test(cc[e])) {
                                h.push(cc[e].replace(/\/\*\s+/, "/* "));
                            } else if (cc[e] !== "") {
                                i.push(cc[e].replace(/^(\s*)/, ""));
                            }
                        }
                        i = i.sort();
                        f = i.length;
                        cc = [];
                        for (e = 0; e < f; e += 1) {
                            if (i[e].charAt(0) === "_") {
                                i.push(i[e]);
                                i.splice(e, 1);
                            }
                            cc.push(i[e].split("~PDCSEP~"));
                        }
                        cc = h.concat(cc);
                        f = cc.length;
                        m = 0;
                        p = 0;
                        g = -1;

                        //This small loop removes duplicate CSS
                        //properties from a sorted list
                        for (e = 1; e < f; e += 1) {
                            if (cc[e].length > 1 && cc[e][0] === cc[e - 1][0]) {
                                cc[e - 1] = ["", ""];
                            }
                        }
                        for (e = 0; e < f; e += 1) {
                            if (cc[e - 1] && cc[e - 1][0] === cc[e][0] && (/\-[a-z]/).test(cc[e - 1][1]) === false && (/\-[a-z]/).test(cc[e][1]) === false) {
                                cc[e - 1] = ["", ""];
                            }
                            if (cc[e].length > 1 && typeof cc[e][1] === "string" && cc[e][1].length > 2) {
                                cc[e][1] = cc[e][1].replace(/\//g, " / ").replace(/(\*)/g, "* ");
                            }
                            if (cc[e][0] !== "margin" && cc[e][0].indexOf("margin") !== -1) {
                                m += 1;
                                if (m === 4) {
                                    i = [cc[e][1]];
                                    r = e;
                                    do {
                                        r -= 1;
                                        if (cc[r].length > 1 && cc[r][1] !== "") {
                                            i.push(cc[r][1]);
                                            cc[r] = ["", ""];
                                        }
                                    } while (i.length < 4 && r > 0);
                                    cc[e] = ["margin", i[0] + " " + i[1] + " " + i[3] + " " + i[2]];
                                    m = 0;
                                }
                            } else if (cc[e][0] !== "padding" && cc[e][0].indexOf("padding") !== -1) {
                                p += 1;
                                if (p === 4) {
                                    i = [cc[e][1]];
                                    r = e;
                                    do {
                                        r -= 1;
                                        if (cc[r].length > 1 && cc[r][1] !== "") {
                                            i.push(cc[r][1]);
                                            cc[r] = ["", ""];
                                        }
                                    } while (i.length < 4 && r > 0);
                                    cc[e] = ["padding", i[0] + " " + i[1] + " " + i[3] + " " + i[2]];
                                    p = 0;
                                }
                            }
                            if (g === -1 && cc[e + 1] && cc[e][0].charAt(0) !== "-" && (cc[e][0].indexOf("cue") !== -1 || cc[e][0].indexOf("list-style") !== -1 || cc[e][0].indexOf("outline") !== -1 || cc[e][0].indexOf("overflow") !== -1 || cc[e][0].indexOf("pause") !== -1) && (cc[e][0] === cc[e + 1][0].substring(0, cc[e + 1][0].lastIndexOf("-")) || cc[e][0].substring(0, cc[e][0].lastIndexOf("-")) === cc[e + 1][0].substring(0, cc[e + 1][0].lastIndexOf("-")))) {
                                g = e;
                                if (cc[g][0].indexOf("-") !== -1 && cc[g][0] !== "list-style") {
                                    cc[g][0] = cc[g][0].substring(0, cc[g][0].lastIndexOf("-"));
                                }
                            } else if (g !== -1 && cc[g][0] === cc[e][0].substring(0, cc[e][0].lastIndexOf("-"))) {
                                if (cc[g][0] === "cue" || cc[g][0] === "pause") {
                                    cc[g][1] = cc[e][1] + " " + cc[g][1];
                                } else {
                                    cc[g][1] = cc[g][1] + " " + cc[e][1];
                                }
                                cc[e] = ["", ""];
                            } else if (g !== -1) {
                                g = -1;
                            }
                        }
                        for (e = 0; e < f; e += 1) {
                            if (cc[e].length > 1 && cc[e][0] !== "") {
                                for (r = e + 1; r < f; r += 1) {
                                    if (cc[r].length > 1 && cc[e][0] === cc[r][0]) {
                                        cc[e] = ["", ""];
                                    }
                                }
                            }
                        }
                        h = [];
                        for (e = 0; e < f; e += 1) {
                            if (typeof cc[e] !== "string" && cc[e] !== undefined && cc[e][0] !== "") {
                                if (cc[e][1] === undefined || cc[e][1] === "before" || cc[e][1] === "after" || cc[e][1] === "hover" || cc[e][1] === "link" || cc[e][1] === "visited" || cc[e][1] === "active" || cc[e][1] === "focus" || cc[e][1] === "first-child" || cc[e][1] === "lang" || cc[e][1] === "first-line" || cc[e][1] === "first-letter") {
                                    h.push(cc[e].join(":"));
                                } else {
                                    h.push(cc[e].join(": "));
                                }
                            } else if (typeof cc[e] === "string") {
                                h.push(cc[e].replace(/~PDCSEP~/g, ": "));
                            }
                        }
                        d[aa] = (h.join(";") + ";").replace(/^;/, "");
                    }
                    if (d[aa].charAt(d[aa].length - 1) === "{") {
                        d[aa] = d[aa].replace(/\,/g, "\,\n");
                    }
                }
                return d.join("").replace(/\*\/\s*;\s*\}?/g, commfix).replace(/(\s*[\w\-]+:)$/g, "\n}").replace(/\s*;$/, "").replace(/PDpoundPD#/g, "#");
            };

        (function cleanCSS__tab() {
            var i = 0,
                j = [];
            for (i = 0; i < nsize; i += 1) {
                j.push(character);
            }
            tab = j.join("");
        }());
        if ("\n" === x.charAt(0)) {
            x = x.substr(1);
        }

        //This anonymous function escapes commas and semicolons found in
        //comments
        (function cleanCSS__fixSyntaxReplace() {
            var cc = x.split(""),
                z = cc.length,
                f = 0,
                e = false;
            for (f = 1; f < z; f += 1) {
                if (cc[f] === "*" && cc[f - 1] === "/" && !e) {
                    e = true;
                } else if (e) {
                    if (cc[f] === ",") {
                        cc[f] = "~PrettyDiffComma~";
                    } else if (cc[f] === ";") {
                        cc[f] = "~PrettyDiffSemi~";
                    } else if (cc[f] === "/" && cc[f - 1] === "*") {
                        e = false;
                    }
                }
            }
            x = cc.join("");
        }());
        c = x.split("*\/");
        b = c.length;
        for (a = 0; a < b; a += 1) {
            if (c[a].search(/\s*\/(\*)/) !== 0) {
                commstor = c[a].split("/*");
                commstor[0] = commstor[0].replace(/[ \t\r\v\f]+/g, " ").replace(/\n (?!\*)/g, "\n").replace(/\s?([;:{}+>])\s?/g, "$1").replace(/\{(\.*):(\.*)\}/g, "{$1: $2}").replace(/\b(\*)/g, " *").replace(/\*\/\s?/g, "*\/\n").replace(/\d%\.?\d/g, fixpercent);
                c[a] = commstor.join("/*");
            }
        }
        x = c.join("*\/");
        if (alter === true) {
            x = reduction(x.replace(/\,\s+/g, ","));
        }
        cleanAsync();
        if (alter === true) {
            c = x.split("*\/");
            b = c.length;
            for (a = 0; a < b; a += 1) {
                if (c[a].search(/\s*\/(\*)/) !== 0) {
                    commstor = c[a].split("/*");
                    commstor[0] = commstor[0].replace(/@charset\s*("|')?[\w\-]+("|')?;?(\s*)/gi, "").replace(/(\S|\s)0+(%|in|cm|mm|em|ex|pt|pc)?;/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/:[\w\s\!\.\-%#]* \.\d+/g, startZero).replace(/ \.?0((?=;)|(?= )|%|in|cm|mm|em|ex|pt|pc)/g, " 0px");
                    commstor[0] = commstor[0].replace(/\w+(\-\w+)*: ((((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0) )+(((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0)/g, sameDist).replace(/background\-position: 0px;/g, "background-position: 0px 0px;").replace(/\s+\*\//g, "*\/");
                    commstor[0] = commstor[0].replace(/\s*[\w\-]+\:\s*(\}|;)/g, emptyend).replace(/\{\s+\}/g, "{}").replace(/\}\s*;\s*\}/g, nestblock).replace(/:\s+#/g, ": #").replace(/(\s+;+\n)+/g, "\n");
                    c[a] = commstor.join("/*");
                }
            }
            x = c.join("*\/");

            //This logic is used to push the first "@charset"
            //declaration to the top of the page.
            if (atchar === null) {
                atchar = [""];
            } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                atchar[0] = atchar[0] + ";\n";
            } else {
                atchar[0] = atchar[0] + "\n";
            }
            x = atchar[0].replace(/@charset/i, "@charset") + fixURI(x).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";").replace(/~PrettyDiffComma~/g, ",");
        }
        if (comment === "noindent") {
            x = x.replace(/\s+\/(\*)/g, "\n/*").replace(/\n\s+\*\//g, "\n*\/");
        }
        if (summary !== "diff") {
            (function cleanCSS__report() {
                var aa = 0,
                    bb = [],
                    cc = x.split("\n"),
                    d = cc.length,
                    e = [],
                    f = q.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    g = x.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    h = 0,
                    i = "",
                    j = 0;
                for (aa = 0; aa < d; aa += 1) {
                    if (cc[aa].charAt(0) === "/" && cc[aa].charAt(1) === "*") {
                        for (aa; aa < d; aa += 1) {
                            if (cc[aa].charAt(cc[aa].length - 2) === "*" && cc[aa].charAt(cc[aa].length - 1) === "/") {
                                break;
                            }
                        }
                    } else if (cc[aa].indexOf("url") !== -1 && cc[aa].indexOf("url(\"\")") === -1 && cc[aa].indexOf("url('')") === -1 && cc[aa].indexOf("url()") === -1) {
                        bb.push(cc[aa]);
                    }
                }
                d = bb.length;
                for (aa = 0; aa < d; aa += 1) {
                    bb[aa] = bb[aa].substr(bb[aa].indexOf("url(\"") + 5, bb[aa].length);
                    bb[aa] = bb[aa].substr(0, bb[aa].indexOf("\")"));
                }
                for (aa = 0; aa < d; aa += 1) {
                    e[aa] = 1;
                    for (j = aa + 1; j < d; j += 1) {
                        if (bb[aa] === bb[j]) {
                            e[aa] += 1;
                            bb[j] = "";
                        }
                    }
                }
                for (aa = 0; aa < d; aa += 1) {
                    if (bb[aa] !== "") {
                        h += 1;
                        e[aa] = e[aa] + "x";
                        if (e[aa] === "1x") {
                            e[aa] = "<em>" + e[aa] + "</em>";
                        }
                        bb[aa] = "<li>" + e[aa] + " - " + bb[aa] + "</li>";
                    }
                }
                if (d !== 0) {
                    i = "<h4>List of HTTP requests:</h4><ul>" + bb.join("") + "</ul>";
                }
                summary = "<p><strong>Total input size:</strong> <em>" + f + "</em> characters</p><p><strong>Total output size:</strong> <em>" + g + "</em> characters</p><p><strong>Number of HTTP requests:</strong> <em>" + h + "</em></p>" + i;
            }());
        }
        return x;
    };