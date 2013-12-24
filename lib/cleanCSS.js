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
var summary  = "",
    cleanCSS = function cleanCSS(args) {
        "use strict";
        var source     = (typeof args.source !== "string" || args.source === "") ? "Error: no source supplied to cleanCSS." : args.source,
            size       = (typeof args.size !== "number" || args.size < 0) ? 4 : args.size,
            character  = (typeof args.character !== "string") ? " " : args.character,
            comment    = (args.comment === "noindent") ? "noindent" : "",
            alter      = (args.alter === true) ? true : false,
            sourceLen  = source.length,
            a          = 0,
            commsLen   = 0,
            comments   = [],
            commstor   = [],

            //This finds all the charset declarations.
            atchar     = source.match(/\@charset\s+("|')[\w\-]+("|');?/gi),
            tab        = "",
            nsize      = Number(size),

            //fixURI forcefully inserts double quote characters into URI
            //fragments.  If parenthesis characters are included as part of
            //the URI fragment they must be escaped with a backslash
            //character in accordance with the CSS specification: "\( \)".
            //If parenthesis iscincluded as part of the URI string and not
            //escaped fixURI will break your code.
            fixURI     = function cleanCSS__fixURI(y) {
                var aa          = 0,
                    uriFragment = [],
                    c           = "",
                    uris        = y.replace(/\\\)/g, "~PDpar~").split("url("),
                    uriLen      = uris.length,
                    quote       = "",
                    process     = (y.indexOf("data~PrettyDiffColon~") > -1 && y.indexOf("~PrettyDiffSemi~base64") > y.indexOf("data~PrettyDiffColon~")) ? true : false;
                for (aa = 1; aa < uriLen; aa += 1) {
                    quote = "\"";
                    if (uris[aa].charAt(0) === "\"") {
                        quote = "";
                    } else if (uris[aa].charAt(0) === "'") {
                        uris[aa] = uris[aa].substr(1, uris[aa].length - 1);
                    }
                    uriFragment = uris[aa].split(")");
                    c           = uriFragment[0];
                    if (c.charAt(c.length - 1) !== "\"" && c.charAt(c.length - 1) !== "'") {
                        c = c + "\"";
                    } else if (c.charAt(c.length - 1) === "'" || c.charAt(c.length - 1) === "\"") {
                        c = c.substr(0, c.length - 1) + "\"";
                    }
                    if (process === true) {
                        uriFragment[0] = c.replace(/ ?\/ ?/g, "/").replace(/\n{2}/g, "\n");
                    } else {
                        uriFragment[0] = c.replace(/\s*\/(\s*)/g, "/");
                    }
                    uris[aa] = "url(" + quote + uriFragment.join(")");
                }
                return uris.join("").replace(/~PDpar~/g, "\\)");
            },

            //sameDist is used by a replace method to remove redundant
            //distance values amongst a single property declaration.
            sameDist   = function cleanCSS__sameDist(y) {
                var cssProperty = y.split(": "),
                    x           = [];
                if (cssProperty[0].indexOf("background") > -1 || cssProperty.length > 2) {
                    return y;
                }
                x = cssProperty[1].split(" ");
                if (x.length === 4) {
                    if (x[0] === x[1] && x[1] === x[2] && x[2] === x[3]) {
                        x[1] = "";
                        x[2] = "";
                        x[3] = "";
                    } else if (x[0] === x[2] && x[1] === x[3] && x[0] !== x[1]) {
                        x[2] = "";
                        x[3] = "";
                    } else if (x[0] !== x[2] && x[1] === x[3]) {
                        x[3] = "";
                    }
                } else if (x.length === 3 && x[0] === x[2] && x[0] !== x[1]) {
                    x[2] = "";
                } else if (x.length === 2 && x[0] === x[1]) {
                    x[1] = "";
                }
                return cssProperty[0] + ": " + x.join(" ").replace(/\s+/g, " ").replace(/\s+$/, "");
            },

            //endZero is used by a replace method to remove extraneous
            //decimal characters if they are followed by 0 or more zero
            //characters.
            endZero    = function cleanCSS__endZero(y) {
                var dot = y.indexOf(".");
                return y.substr(0, dot);
            },

            //runZero suppresses continuous runs of 0 to a single 0 if they
            //are not preceeded by a period (.), number sign (#), or a hex
            //digit (0-9, a-f)
            runZero    = function cleanCSS__runZero(y) {
                var first = y.charAt(0);
                if (first === "#" || first === "." || (/[a-f0-9]/).test(first) === true) {
                    return y;
                }
                return first + "0;";
            },

            //startZero is used to add a leading zero character to positive
            //numbers less than 1.
            startZero  = function cleanCSS__startZero(y) {
                return y.replace(/ \./g, " 0.");
            },

            //emptyend is used to remove properties that are absent a value
            //and semicolon at the end of a property list
            emptyend   = function cleanCSS__emptyend(y) {
                var spaceStart = y.match(/^(\s*)/)[0],
                    noTab      = spaceStart.substr(0, spaceStart.length - tab.length);
                if (y.charAt(y.length - 1) === "}") {
                    return noTab + "}";
                }
                return noTab.replace(/(\s+)$/, "");
            },

            //This prevents percentage numbers from running together
            fixpercent = function cleanCSS__fixpercent(y) {
                return y.replace(/%/, "% ");
            },

            //removes semicolons that appear between closing curly braces
            nestblock  = function cleanCSS__nestblock(y) {
                return y.replace(/\s*;\n/, "\n");
            },

            //cleanAsync is the core of cleanCSS.  This function applies
            //most of the new line characters and all the indentation.
            cleanAsync = function cleanCSS__cleanAsync() {
                var i        = 0,
                    j        = 0,
                    localLen = sourceLen,
                    tabs     = [],
                    tabb     = "",
                    out      = [tab],
                    build    = source.split("");
                for (i = 0; i < localLen; i += 1) {
                    if ("{" === build[i]) {
                        tabs.push(tab);
                        tabb = tabs.join("");
                        out.push(" {\n");
                        out.push(tabb);
                    } else if ("\n" === build[i]) {
                        out.push("\n");
                        out.push(tabb);
                    } else if ("}" === build[i]) {
                        out[out.length - 1] = out[out.length - 1].replace(/\s*$/, "");
                        tabs                = tabs.slice(0, tabs.length - 1);
                        tabb                = tabs.join("");
                        if (build[i + 1] + build[i + 2] !== "*\/") {
                            out.push("\n");
                            out.push(tabb);
                            out.push("}\n");
                            out.push(tabb);
                        } else {
                            out.push("\n");
                            out.push(tabb);
                            out.push("}");
                        }
                    } else if (build[i - 1] === "," && (/\s/).test(build[i]) === false) {
                        out.push(" ");
                        out.push(build[i]);
                    } else if (";" === build[i] && "}" !== build[i + 1]) {
                        out.push(";\n");
                        out.push(tabb);
                    } else if (i > 3 && build[i - 3] === "u" && build[i - 2] === "r" && build[i - 1] === "l" && build[i] === "(") {
                        for (j = i; j < localLen; j += 1) {
                            out.push(build[j]);
                            if (build[j] === ")" && build[j - 1] !== "\\") {
                                i = j;
                                break;
                            }
                        }
                    } else {
                        out.push(build[i]);
                    }
                }
                if (i >= localLen) {
                    out    = [out.join("").replace(/^(\s*)/, "").replace(/(\s*)$/, "")];
                    source = out.join("");
                    tabs   = [];
                }
            },

            //This function is used to provide some minor algorithms to
            //combine some CSS properties than can be combined and provides
            //some advanced beautification.  This function does not condense
            //the font or border properties at this time.
            reduction  = function cleanCSS__reduction(x) {
                var aa                 = 0,
                    e                  = 0,
                    length             = 0,
                    noWordIndex        = -1,
                    marginCount        = 0,
                    paddingCount       = 0,
                    marginIndex        = 0,
                    buildLen           = x.length,
                    cc                 = [],
                    build              = [],
                    fragment           = [],
                    margin             = [],
                    test               = false,

                    //colorLow is used by a replace method to convert hex
                    //color codes to lowercase alpha characters and in some
                    //cases reduce the character count from 6 to 3.
                    colorLow           = function cleanCSS__reduction_colorLow(colorInput) {
                        var firstChar = colorInput.charAt(0),
                            tooLong   = false;
                        if (colorInput.length === 8 || colorInput.length === 5) {
                            colorInput = colorInput.substr(1);
                            tooLong    = true;
                        }
                        colorInput = colorInput.toLowerCase();
                        if (colorInput.length === 7 && colorInput.charAt(1) === colorInput.charAt(2) && colorInput.charAt(3) === colorInput.charAt(4) && colorInput.charAt(5) === colorInput.charAt(6)) {
                            colorInput = "#" + colorInput.charAt(1) + colorInput.charAt(3) + colorInput.charAt(5);
                        }
                        if (firstChar === ":") {
                            colorInput = firstChar + "PDpoundPD" + colorInput;
                        } else if (tooLong === true && (/\s/).test(firstChar) === false && firstChar !== "(") {
                            colorInput = firstChar + " " + colorInput;
                        } else if (tooLong === true && ((/\s/).test(firstChar) === true || firstChar === "(")) {
                            colorInput = firstChar + colorInput;
                        }
                        return colorInput;
                    },
                    propertyComment    = "",
                    propertyCommentIn  = (/[\w\s:#\-\=\!\(\)"'\[\]\.%-\_\?\/\\]\/(\*)/),
                    propertyCommentOut = function cleanCSS__reduction_propertyCommentOut(z) {
                        if (z.indexOf("\n/*") === 0) {
                            return z;
                        }
                        return z.replace(/\s*\/(\*)/, ";/*");
                    },
                    commfix            = function cleanCSS_reduction_commfix(y) {
                        if (y.charAt(y.length - 1) === "}") {
                            return y.replace(";", "");
                        }
                        return y.replace(";", "\n");
                    };

                //create an initial structured array to parse
                (function cleanCSS__reduction_missingSemicolon() {
                    var misssemi   = function cleanCSS__reduction_missingSemicolon_misssemi(cssSample) {
                            if (cssSample.indexOf("\n") === -1) {
                                return cssSample;
                            }
                            return cssSample.replace(/\s+/, ";");
                        },
                        lengthSemi = x.length,
                        fragments  = [],
                        semiIndex  = 0,
                        fragmenta  = "";
                    for (aa = 0; aa < lengthSemi; aa += 1) {
                        if (x.charAt(aa) === "/" && x.charAt(aa + 1) === "*") {
                            build.push(fragments.join(""));
                            fragments = [];
                            if ((/\s/).test(x.charAt(aa - 1)) === true) {
                                for (marginCount = aa - 1; marginCount > -1; marginCount -= 1) {
                                    if (x.charAt(marginCount) === "\n") {
                                        fragments.push("\n");
                                        break;
                                    }
                                    if ((/\s/).test(x.charAt(marginCount)) === false) {
                                        break;
                                    }
                                }
                            }
                            do {
                                fragments.push(x.charAt(aa));
                                aa += 1;
                            } while (x.charAt(aa - 2) !== "*" || (x.charAt(aa - 2) === "*" && x.charAt(aa - 1) !== "/"));
                            if (x.charAt(aa) === "\n") {
                                fragments.push("\n");
                            }
                            build.push(fragments.join(""));
                            fragments = [];
                            if (x.charAt(aa) === "}") {
                                build.push("}");
                            }
                        } else {
                            fragments.push(x.charAt(aa));
                            if (x.charAt(aa) === "{" || x.charAt(aa + 1) === "}") {
                                if (fragments[0] === "}") {
                                    build.push("}");
                                    fragments[0] = "";
                                }
                                fragmenta = fragments.join("");
                                if (fragmenta.indexOf("{") > -1 && (fragmenta.indexOf("\n") > -1 || fragmenta.indexOf(";") > -1)) {
                                    semiIndex = Math.max(fragmenta.lastIndexOf("\n"), fragmenta.lastIndexOf(";"));
                                    build.push(fragmenta.substring(0, semiIndex + 1).replace(/(\w|\)|"|')\s+/g, misssemi));
                                    build.push(fragmenta.substring(semiIndex + 1));
                                } else {
                                    build.push(fragmenta.replace(/(\w|\)|"|')\s+/g, misssemi));
                                }
                                fragments = [];
                            }
                        }
                    }
                    build.push("}");
                }());

                //looks for multidimensional structures, SCSS, and pulls
                //direct properties above child structures
                (function cleanCSS__reduction_scss() {
                    var aaa          = 0,
                        ccc          = 0,
                        lengthScss   = build.length,
                        blockCounter = 0,
                        blockState   = 1,
                        subBuild     = [],
                        partFirst    = [],
                        partSecond   = [],
                        blockTest    = false;
                    for (aaa = 0; aaa < lengthScss; aaa += 1) {
                        if (build[aaa] === "}") {
                            blockCounter -= 1;
                            if (blockCounter === blockState - 1 && subBuild.length > 0) {
                                partFirst  = build.slice(0, aaa);
                                partSecond = build.slice(aaa, build.length);
                                build      = [].concat(partFirst, subBuild, partSecond);
                                subBuild   = [];
                                aaa        = partFirst.length - 1;
                                lengthScss = build.length;
                            }
                        } else if (build[aaa].indexOf("{") > -1 && (build[aaa].indexOf("/*") === 0 || build[aaa].indexOf("\n/*") === 0)) {
                            blockCounter += 1;
                            if (blockCounter > blockState) {
                                blockTest  = true;
                                blockState = blockCounter - 1;
                                subBuild.push(build[aaa]);
                                build[aaa] = "";
                                for (ccc = aaa + 1; ccc < lengthScss; ccc += 1) {
                                    subBuild.push(build[ccc]);
                                    if (build[ccc].indexOf("{") > -1) {
                                        blockCounter += 1;
                                        build[ccc]   = "";
                                    } else if (build[ccc] === "}") {
                                        blockCounter -= 1;
                                        build[ccc]   = "";
                                        if (blockCounter === blockState) {
                                            break;
                                        }
                                    } else {
                                        build[ccc] = "";
                                    }
                                }
                            }
                        }
                    }
                    if (blockTest === true) {
                        lengthScss = build.length;
                        subBuild   = [];
                        for (aaa = 0; aaa < lengthScss; aaa += 1) {
                            if (subBuild.length > 0 && subBuild[subBuild.length - 1].indexOf("{") === -1 && build[aaa] !== "}" && build[aaa].indexOf("{") === -1 && build[aaa].indexOf("/*") !== 0 && build[aaa].indexOf("\n/*") !== 0) {
                                subBuild[subBuild.length - 1] = subBuild[subBuild.length - 1] + build[aaa];
                            } else if (build[aaa] !== "") {
                                subBuild.push(build[aaa]);
                            }
                        }
                        build = [].concat(subBuild);
                    }
                }());
                buildLen = build.length;
                for (aa = 0; aa < buildLen; aa += 1) {
                    if (build[aa].charAt(build[aa].length - 1) === "{") {
                        build[aa] = build[aa].replace(/>/g, " > ");
                    } else {
                        if (build[aa].indexOf("url(") > -1) {
                            fragment = build[aa].split("");
                            length   = fragment.length;
                            for (e = 3; e < length; e += 1) {
                                if (fragment[e - 3] === "u" && fragment[e - 2] === "r" && fragment[e - 1] === "l" && fragment[e] === "(") {
                                    test = true;
                                }
                                if (test === true) {
                                    if (fragment[e - 1] !== "\\" && fragment[e] === ")") {
                                        test = false;
                                    } else if (fragment[e] === ";") {
                                        fragment[e] = "~PrettyDiffSemi~";
                                    } else if (fragment[e] === ":") {
                                        fragment[e] = "~PrettyDiffColon~";
                                    }
                                }
                            }
                            build[aa] = fragment.join("");
                        }
                        if (build[aa].charAt(build[aa].length - 1) === ";") {
                            build[aa] = build[aa].substr(0, build[aa].length - 1);
                        }
                        propertyComment = build[aa].replace(propertyCommentIn, propertyCommentOut);
                        cc              = propertyComment.replace(/(\w|\W)?#[a-fA-F0-9]{3,6}(?!(\w*\)))/g, colorLow).replace(/\*\//g, "*\/;").replace(/:/g, "~PDCSEP~").split(";");
                        length          = cc.length;
                        fragment        = [];
                        margin          = [];
                        for (e = 0; e < length; e += 1) {
                            if (/^(\n?\/\*)/.test(cc[e])) {
                                fragment.push(cc[e].replace(/\/\*\s+/, "/* "));
                            } else if (cc[e] !== "") {
                                margin.push(cc[e].replace(/^(\s*)/, ""));
                            }
                        }
                        margin = margin.sort();
                        length = margin.length;
                        cc     = [];
                        for (e = 0; e < length; e += 1) {
                            if (margin[e].charAt(0) === "_") {
                                margin.push(margin[e]);
                                margin.splice(e, 1);
                            }
                            cc.push(margin[e].split("~PDCSEP~"));
                        }
                        cc           = fragment.concat(cc);
                        length       = cc.length;
                        marginCount  = 0;
                        paddingCount = 0;
                        noWordIndex  = -1;

                        //This small loop removes duplicate CSS
                        //properties from a sorted list
                        for (e = 1; e < length; e += 1) {
                            if (cc[e].length > 1 && cc[e][0] === cc[e - 1][0]) {
                                cc[e - 1] = [
                                    "", ""
                                ];
                            }
                        }
                        for (e = 0; e < length; e += 1) {
                            if (cc[e - 1] && cc[e - 1][0] === cc[e][0] && (/\-[a-z]/).test(cc[e - 1][1]) === false && (/\-[a-z]/).test(cc[e][1]) === false) {
                                cc[e - 1] = [
                                    "", ""
                                ];
                            }
                            if (cc[e].length > 1 && typeof cc[e][1] === "string" && cc[e][1].length > 2) {
                                cc[e][1] = cc[e][1].replace(/\//g, " / ").replace(/(\*)/g, "* ");
                            }
                            if (cc[e][0] !== "margin" && cc[e][0].indexOf("margin") !== -1) {
                                marginCount += 1;
                                if (marginCount === 4) {
                                    margin      = [cc[e][1]];
                                    marginIndex = e;
                                    do {
                                        marginIndex -= 1;
                                        if (cc[marginIndex].length > 1 && cc[marginIndex][1] !== "") {
                                            margin.push(cc[marginIndex][1]);
                                            cc[marginIndex] = [
                                                "", ""
                                            ];
                                        }
                                    } while (margin.length < 4 && marginIndex > 0);
                                    cc[e]       = [
                                        "margin", margin[0] + " " + margin[1] + " " + margin[3] + " " + margin[2]
                                    ];
                                    marginCount = 0;
                                }
                            } else if (cc[e][0] !== "padding" && cc[e][0].indexOf("padding") !== -1) {
                                paddingCount += 1;
                                if (paddingCount === 4) {
                                    margin      = [cc[e][1]];
                                    marginIndex = e;
                                    do {
                                        marginIndex -= 1;
                                        if (cc[marginIndex].length > 1 && cc[marginIndex][1] !== "") {
                                            margin.push(cc[marginIndex][1]);
                                            cc[marginIndex] = [
                                                "", ""
                                            ];
                                        }
                                    } while (margin.length < 4 && marginIndex > 0);
                                    cc[e]        = [
                                        "padding", margin[0] + " " + margin[1] + " " + margin[3] + " " + margin[2]
                                    ];
                                    paddingCount = 0;
                                }
                            }
                            if (noWordIndex === -1 && cc[e + 1] && cc[e][0].charAt(0) !== "-" && (cc[e][0].indexOf("cue") !== -1 || cc[e][0].indexOf("list-style") !== -1 || cc[e][0].indexOf("outline") !== -1 || cc[e][0].indexOf("overflow") !== -1 || cc[e][0].indexOf("pause") !== -1) && (cc[e][0] === cc[e + 1][0].substring(0, cc[e + 1][0].lastIndexOf("-")) || cc[e][0].substring(0, cc[e][0].lastIndexOf("-")) === cc[e + 1][0].substring(0, cc[e + 1][0].lastIndexOf("-")))) {
                                noWordIndex = e;
                                if (cc[noWordIndex][0].indexOf("-") !== -1 && cc[noWordIndex][0] !== "list-style") {
                                    cc[noWordIndex][0] = cc[noWordIndex][0].substring(0, cc[noWordIndex][0].lastIndexOf("-"));
                                }
                            } else if (noWordIndex !== -1 && cc[noWordIndex][0] === cc[e][0].substring(0, cc[e][0].lastIndexOf("-"))) {
                                if (cc[noWordIndex][0] === "cue" || cc[noWordIndex][0] === "pause") {
                                    cc[noWordIndex][1] = cc[e][1] + " " + cc[noWordIndex][1];
                                } else {
                                    cc[noWordIndex][1] = cc[noWordIndex][1] + " " + cc[e][1];
                                }
                                cc[e] = [
                                    "", ""
                                ];
                            } else if (noWordIndex !== -1) {
                                noWordIndex = -1;
                            }
                        }
                        for (e = 0; e < length; e += 1) {
                            if (cc[e].length > 1 && cc[e][0] !== "") {
                                for (marginIndex = e + 1; marginIndex < length; marginIndex += 1) {
                                    if (cc[marginIndex].length > 1 && cc[e][0] === cc[marginIndex][0]) {
                                        cc[e] = [
                                            "", ""
                                        ];
                                    }
                                }
                            }
                        }
                        fragment = [];
                        for (e = 0; e < length; e += 1) {
                            if (typeof cc[e] !== "string" && cc[e] !== undefined && cc[e][0] !== "") {
                                if (cc[e][1] === undefined || cc[e][1] === "before" || cc[e][1] === "after" || cc[e][1] === "hover" || cc[e][1] === "link" || cc[e][1] === "visited" || cc[e][1] === "active" || cc[e][1] === "focus" || cc[e][1] === "first-child" || cc[e][1] === "lang" || cc[e][1] === "first-line" || cc[e][1] === "first-letter") {
                                    fragment.push(cc[e].join(":"));
                                } else {
                                    fragment.push(cc[e].join(": "));
                                }
                            } else if (typeof cc[e] === "string") {
                                fragment.push(cc[e].replace(/~PDCSEP~/g, ": "));
                            }
                        }
                        build[aa] = (fragment.join(";") + ";").replace(/^;/, "");
                    }
                    if (build[aa].charAt(build[aa].length - 1) === "{") {
                        build[aa] = build[aa].replace(/\,/g, ",\n");
                    }
                }
                return build.join("").replace(/\*\/\s*;\s*\}?/g, commfix).replace(/(\s*[\w\-]+:)$/g, "\n}").replace(/\s*;$/, "").replace(/PDpoundPD#/g, "#");
            };

        (function cleanCSS__tab() {
            var i      = 0,
                output = [];
            for (i = 0; i < nsize; i += 1) {
                output.push(character);
            }
            tab = output.join("");
        }());
        if ("\n" === source.charAt(0)) {
            source = source.substr(1);
        }

        //This anonymous function escapes commas and semicolons found in
        //comments
        (function cleanCSS__fixSyntaxReplace() {
            var chars        = source.split(""),
                buildLen     = chars.length,
                f            = 0,
                blockComment = false;
            for (f = 1; f < buildLen; f += 1) {
                if (chars[f] === "*" && chars[f - 1] === "/" && blockComment === false) {
                    blockComment = true;
                } else if (blockComment === true) {
                    if (chars[f] === ",") {
                        chars[f] = "~PrettyDiffComma~";
                    } else if (chars[f] === ";") {
                        chars[f] = "~PrettyDiffSemi~";
                    } else if (chars[f] === "/" && chars[f - 1] === "*") {
                        blockComment = false;
                    }
                }
            }
            source = chars.join("");
        }());
        comments = source.split("*\/");
        commsLen = comments.length;
        for (a = 0; a < commsLen; a += 1) {
            if (comments[a].search(/\s*\/(\*)/) !== 0) {
                commstor    = comments[a].split("/*");
                commstor[0] = commstor[0].replace(/[ \t\r\v\f]+/g, " ").replace(/\n (?!\*)/g, "\n").replace(/\s?([;:{}+>])\s?/g, "$1").replace(/\{(\.*):(\.*)\}/g, "{$1: $2}").replace(/\b(\*)/g, " *").replace(/\*\/\s?/g, "*\/\n").replace(/\d%\.?\d/g, fixpercent);
                comments[a] = commstor.join("/*");
            }
        }
        source = comments.join("*\/");
        if (alter === true) {
            source = reduction(source.replace(/\,\s+/g, ","));
        }
        cleanAsync();
        if (alter === true) {
            comments = source.split("*\/");
            commsLen = comments.length;
            for (a = 0; a < commsLen; a += 1) {
                if (comments[a].search(/\s*\/(\*)/) !== 0) {
                    commstor    = comments[a].split("/*");
                    commstor[0] = commstor[0].replace(/@charset\s*("|')?[\w\-]+("|')?;?(\s*)/gi, "").replace(/(\S|\s)0+(%|in|cm|mm|em|ex|pt|pc)?;/g, runZero).replace(/:[\w\s\!\.\-%]*\d+\.0*(?!\d)/g, endZero).replace(/:[\w\s\!\.\-%#]* \.\d+/g, startZero).replace(/ \.?0((?=;)|(?= )|%|in|cm|mm|em|ex|pt|pc)/g, " 0px");
                    commstor[0] = commstor[0].replace(/\w+(\-\w+)*: ((((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0) )+(((\-?(\d*\.\d+)|\d+)[a-zA-Z]+)|0)/g, sameDist).replace(/background\-position: 0px;/g, "background-position: 0px 0px;").replace(/\s+\*\//g, "*\/");
                    commstor[0] = commstor[0].replace(/\s*[\w\-]+\:\s*(\}|;)/g, emptyend).replace(/\{\s+\}/g, "{}").replace(/\}\s*;\s*\}/g, nestblock).replace(/:\s+#/g, ": #").replace(/(\s+;+\n)+/g, "\n");
                    comments[a] = commstor.join("/*");
                }
            }
            source = comments.join("*\/");

            //This logic is used to push the first "@charset"
            //declaration to the top of the page.
            if (atchar === null) {
                atchar = [""];
            } else if (atchar[0].charAt(atchar[0].length - 1) !== ";") {
                atchar[0] = atchar[0] + ";\n";
            } else {
                atchar[0] = atchar[0] + "\n";
            }
            source = atchar[0].replace(/@charset/i, "@charset") + fixURI(source).replace(/~PrettyDiffColon~/g, ":").replace(/~PrettyDiffSemi~/g, ";").replace(/~PrettyDiffComma~/g, ",");
        }
        if (comment === "noindent") {
            source = source.replace(/\s+\/(\*)/g, "\n/*").replace(/\n\s+\*\//g, "\n*\/");
        }
        if (summary !== "diff") {
            (function cleanCSS__report() {
                var aa           = 0,
                    build        = [],
                    lines        = source.split("\n"),
                    lineLen      = lines.length,
                    requests     = [],
                    lengthInput  = sourceLen.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    lengthOutput = source.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    requestCount = 0,
                    requestList  = "",
                    j            = 0;
                for (aa = 0; aa < lineLen; aa += 1) {
                    if (lines[aa].charAt(0) === "/" && lines[aa].charAt(1) === "*") {
                        for (aa; aa < lineLen; aa += 1) {
                            if (lines[aa].charAt(lines[aa].length - 2) === "*" && lines[aa].charAt(lines[aa].length - 1) === "/") {
                                break;
                            }
                        }
                    } else if (lines[aa].indexOf("url") !== -1 && lines[aa].indexOf("url(\"\")") === -1 && lines[aa].indexOf("url('')") === -1 && lines[aa].indexOf("url()") === -1) {
                        build.push(lines[aa]);
                    }
                }
                lineLen = build.length;
                for (aa = 0; aa < lineLen; aa += 1) {
                    build[aa] = build[aa].substr(build[aa].indexOf("url(\"") + 5, build[aa].length);
                    build[aa] = build[aa].substr(0, build[aa].indexOf("\")"));
                }
                for (aa = 0; aa < lineLen; aa += 1) {
                    requests[aa] = 1;
                    for (j = aa + 1; j < lineLen; j += 1) {
                        if (build[aa] === build[j]) {
                            requests[aa] += 1;
                            build[j]     = "";
                        }
                    }
                }
                for (aa = 0; aa < lineLen; aa += 1) {
                    if (build[aa] !== "") {
                        requestCount += 1;
                        requests[aa] = requests[aa] + "x";
                        if (requests[aa] === "1x") {
                            requests[aa] = "<em>" + requests[aa] + "</em>";
                        }
                        build[aa] = "<li>" + requests[aa] + " - " + build[aa] + "</li>";
                    }
                }
                if (lineLen !== 0) {
                    requestList = "<h4>List of HTTP requests:</h4><ul>" + build.join("") + "</ul>";
                }
                summary = "<p><strong>Total input size:</strong> <em>" + lengthInput + "</em> characters</p><p><strong>Total output size:</strong> <em>" + lengthOutput + "</em> characters</p><p><strong>Number of HTTP requests:</strong> <em>" + requestCount + "</em></p>" + requestList;
            }());
        }
        return source;
    };