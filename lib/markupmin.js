/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
/*global jspretty, csspretty*/
/*
 This code may be used internally to Travelocity without limitation,
 exclusion, or restriction.  If this code is used externally the
 following comment must be included everywhere this code is used.
 */

/***********************************************************************
 This is written by Austin Cheney on 7 May 2009.  Anybody may use this
 code without permission so long as this comment exists verbatim in each
 instance of its use.

 http://www.travelocity.com/
 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
var summary   = "",
    markupmin = function markupmin(args) {
        "use strict";
        var i             = 0,
            x             = (typeof args.source === "string") ? args.source.split("") : [
                "E", "r", "r", "o", "r", ":", " ", "n", "o", " ", "c", "o", "n", "t", "e", "n", "t", " ", "s", "u", "p", "p", "l", "i", "e", "d", " ", "t", "o", " ", "m", "a", "r", "k", "u", "p", "."
            ],
            id            = [],
            comments      = (args.comments !== "comments" && args.comments !== "beautify" && args.comments !== "nocomment") ? "" : args.comments,
            correct       = (args.correct === true || args.correct === "true") ? true : false,
            inchar        = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
            insize        = (isNaN(args.insize) === false && Number(args.insize) >= 0) ? Number(args.insize) : 4,
            minjsscope    = (args.jsscope !== "html" && args.jsscope !== "report") ? "none" : args.jsscope,
            minjsx        = (args.jsx === true || args.jsx === "true") ? true : false,
            obfuscate     = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
            objsort       = (args.objsort === true || args.objsort === "true") ? true : false,
            presume_html  = (args.presume_html === true || args.presume_html === "true") ? true : false,
            quoteConvert  = (args.quoteConvert === "single" || args.quoteConvert === "double") ? args.quoteConvert : "none",
            styleguide    = (typeof args.styleguide === "string") ? args.styleguide : "none",
            top_comments  = (args.top_comments === true || args.top_comments === "true") ? true : false,
            wrap          = (isNaN(args.wrap) === false) ? Number(args.wrap) : 0,
            conditional   = (presume_html === true || args.conditional === true || args.conditional === "true") ? true : false,
            //preserve is necessary for tags that should not be beautified or minified
            preserve      = function markupmin__preserve(start, endTag) {
                var a     = 0,
                    end   = x.length,
                    store = [],
                    count = 0;
                for (a = i; a < end; a += 1) {
                    store.push(x[a]);
                    x[a] = "";
                    if (start !== "" && store.slice(store.length - start.length).join("") === start) {
                        count += 1;
                    }
                    if (store.slice(store.length - endTag.length).join("") === endTag) {
                        count -= 1;
                        if (count < 1) {
                            break;
                        }
                    }
                }
                x[i] = store.join("");
                i    = a;
            },
            //jsxItem jsxItem finds JavaScript tokens in JSX code
            //as delimited by curly braces
            jsxItem       = function markupmin__jsxItem(index, space) {
                var a      = 0,
                    end    = x.length,
                    count  = 0,
                    store  = [],
                    tabReg = (function markupmin__jsxItem_tabReg() {
                        var b     = 0,
                            tabby = [];
                        for (b = 0; b < insize; b += 1) {
                            tabby.push("\\");
                            tabby.push(inchar);
                        }
                        return new RegExp("^(\\s*\\{+\\s*" + tabby.join("") + "+)");
                    }());
                if (space === undefined) {
                    space = "";
                }
                for (a = index; a < end; a += 1) {
                    store.push(x[a]);
                    if (x[a] === "{") {
                        count += 1;
                    }
                    if (x[a] === "}") {
                        count -= 1;
                        if (count === 0) {
                            x[a] = "";
                            break;
                        }
                    }
                    x[a] = "";
                }
                if (store[0] + store[1] === "{{" && store[store.length - 2] + store[store.length - 1] === "}}") {
                    x[a] = store.join("");
                    return a;
                }
                x[a] = space + jspretty({
                    inchar : inchar,
                    insize : insize,
                    jsscope: minjsscope,
                    jsx    : true,
                    mode   : (comments === "beautify") ? "beautify" : "minify",
                    source : store.join("")
                }).replace(tabReg, "{").replace(/(\s*\}\s*)$/, "}");
                if (x[a] === "{};" || x[a] === "{}") {
                    x[a] = "";
                }
                return a;
            },
            //This closure performs checks for excessive whitespace
            //inside markup tags.  Whitespace around certain syntax
            //characters is collapsed and all remaining whitespace is
            //tokenized.
            markupspace   = function markupmin__markupspace() {
                var a          = 0,
                    b          = -1,
                    store      = [],
                    end        = x.length,
                    item       = "",
                    jsxtest    = "",
                    attrs      = "",
                    ignore     = false,
                    attributes = function markupmin_markupspace_attribute(tag) {
                        var aa          = 0,
                            attribute   = [],
                            comment     = [],
                            tagLength   = 0,
                            starter     = "",
                            openchar    = "",
                            spaceAfter  = tag.indexOf(" ") + 1,
                            attribIndex = 0,
                            nameSpace   = "",
                            counter     = 0,
                            ending      = (tag.charAt(tag.length - 2) === "/") ? "/>" : ">",
                            space       = (tag.charAt(0) === " ") ? " " : "",
                            qConvert    = function markupmin__markupspace_attribute_qConvert(item) {
                                var dub   = (quoteConvert === "double") ? true : false,
                                    qchar = (dub === true) ? "\"" : "'",
                                    eq    = item.indexOf("="),
                                    name  = item.slice(0, eq + 1);
                                item = item.slice(eq + 2, item.length - 1);
                                if (name.toLowerCase() === "script=" || name.toLowerCase() === "style") {
                                    if (dub === true) {
                                        item = item.replace(/"/g, "'");
                                    } else {
                                        item = item.replace(/'/g, "\"");
                                    }
                                } else if (dub === true) {
                                    item = item.replace(/"/g, "&#x22;");
                                } else {
                                    item = item.replace(/'/g, "&#x27;");
                                }
                                return name + qchar + item.split(qchar).join("\\" + qchar) + qchar;
                            },
                            sortfunc    = function markup_beauty__algorithm_loop_attributeOrder_sortfunc(aaa, bbb) {
                                if (aaa > bbb) {
                                    return 1;
                                }
                                return 0;
                            },
                            pusher      = function markup_beauty__algorithm_loop_attributeOrder_pusher(attr) {
                                var last = (attribute.length > 0) ? attribute[attribute.length - 1] : "";
                                if (attr.indexOf("data-prettydiff-ignore" +
                                    "=") === 0) {
                                    ignore = true;
                                    return;
                                }
                                if (attr.indexOf("id=") === 0 || attr.indexOf("ID=") === 0) {
                                    id.push(attr.slice(4, attr.length - 1));
                                }
                                if ((quoteConvert === "single" && attr.charAt(attr.length - 1) === "\"") || (quoteConvert === "double" && attr.charAt(attr.length - 1) === "'")) {
                                    attr = qConvert(attr);
                                }
                                if ((attr.charAt(0) === "=" && last.indexOf("=") < 0) || (last.charAt(last.length - 1) === "=" && (attr.charAt(0) === "\"" || attr.charAt(0) === "'" || attr.indexOf("=") < 0))) {
                                    attribute[attribute.length - 1] = last + attr;
                                } else if (attr !== undefined && (/^(\s+)$/).test(attr) === false && attr !== "") {
                                    attribute.push(attr);
                                }
                                openchar    = "";
                                attribIndex = aa + 1;
                            },
                            joinchar    = (tag.length > wrap && wrap > 0 && comments === "beautify" && minjsx === false) ? "\n" : " ";
                        if (space === " ") {
                            tag        = tag.substr(1);
                            spaceAfter = tag.indexOf(" ") + 1;
                        }
                        nameSpace = tag.substring(0, spaceAfter - 1);
                        tagLength = tag.length;
                        tag       = tag.substring(spaceAfter, tagLength - ending.length) + " ";
                        for (aa = 0; aa < tagLength; aa += 1) {
                            if (starter === "") {
                                if (tag.charAt(aa - 1) === "=" && openchar === "" && counter === 0) {
                                    openchar = tag.charAt(aa);
                                }
                                if (tag.charAt(aa) === "\"") {
                                    starter = "\"";
                                } else if (tag.charAt(aa) === "'") {
                                    starter = "'";
                                } else if (tag.charAt(aa) === "[") {
                                    starter = "[";
                                    counter = 1;
                                } else if (tag.charAt(aa) === "{") {
                                    starter = "{";
                                    counter = 1;
                                } else if (tag.charAt(aa) === "(") {
                                    starter = "(";
                                    counter = 1;
                                } else if (tag.charAt(aa) === "<" && tag.charAt(aa + 1) === "%") {
                                    starter     = "<%";
                                    counter     = 1;
                                    attribIndex = aa;
                                } else if ((tag.charAt(aa) === " " || (minjsx === true && tag.charAt(aa) === "\n")) && counter === 0) {
                                    if (tag.charAt(attribIndex) === "\n") {
                                        attribIndex += 1;
                                    }
                                    pusher(tag.substring(attribIndex, aa));
                                    if (ignore === true) {
                                        return;
                                    }
                                } else if (minjsx === true && tag.charAt(aa) === "/" && (tag.charAt(aa + 1) === "*" || tag.charAt(aa + 1) === "/")) {
                                    if (tag.charAt(aa + 1) === "*") {
                                        starter = "/*";
                                    } else {
                                        starter = "//";
                                    }
                                    attribIndex = aa;
                                }
                            } else if (starter === "\"" && tag.charAt(aa) === "\"") {
                                starter = "";
                            } else if (starter === "'" && tag.charAt(aa) === "'") {
                                starter = "";
                            } else if (starter === "[") {
                                if (tag.charAt(aa) === "]") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(aa) === "[") {
                                    counter += 1;
                                }
                            } else if (starter === "{") {
                                if (tag.charAt(aa) === "}") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                    if (openchar === "{" && counter === 0) {
                                        pusher(tag.substring(attribIndex, aa + 1));
                                        if (ignore === true) {
                                            return;
                                        }
                                    }
                                } else if (tag.charAt(aa) === "{") {
                                    counter += 1;
                                }
                            } else if (starter === "(") {
                                if (tag.charAt(aa) === ")") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(aa) === "(") {
                                    counter += 1;
                                }
                            } else if (starter === "<%") {
                                if (tag.charAt(aa) === ">" && tag.charAt(aa - 1) === "%") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(aa) === "<" && tag.charAt(aa + 1) === "%") {
                                    counter += 1;
                                }
                            } else if (minjsx === true && starter === "/*" && tag.charAt(aa - 1) === "*" && tag.charAt(aa) === "/") {
                                starter = "";
                                comment.push(tag.substring(attribIndex, aa + 1));
                                aa          += 1;
                                attribIndex = aa;
                            } else if (minjsx === true && starter === "//" && tag.charAt(aa) === "\n") {
                                starter = "";
                                comment.push(tag.substring(attribIndex, aa));
                                attribIndex = aa;
                            }
                        }
                        tagLength = id.length;
                        attribute.sort(sortfunc);
                        if (minjsx === true) {
                            if (comment.length > 0) {
                                return space + nameSpace + "\n" + comment.join("\n") + attribute.join(" ").replace(/\n \n?\//g, "\n/") + ending;
                            }
                            return space + nameSpace + " " + attribute.join(" ").replace(/\n \n?\//g, "\n/") + ending;
                        }
                        return space + nameSpace + joinchar + attribute.join(joinchar) + ending;
                    };
                for (a = i; a < end; a += 1) {
                    if (minjsx === true) {
                        if (x[a - 1] === "/" && jsxtest === "") {
                            if (x[a] === "*") {
                                if (comments === "beautify") {
                                    if (store[store.length - 3].indexOf("\n") < 0 && store[store.length - 2].indexOf("\n") < 0) {
                                        store[store.length - 1] = "\n/";
                                    } else if (store[store.length - 2] === " ") {
                                        store[store.length - 2] = "";
                                    }
                                }
                                jsxtest = "*\/";
                            }
                            if (x[a] === "/") {
                                if (comments === "beautify") {
                                    if (store[store.length - 3].indexOf("\n") < 0 && store[store.length - 2].indexOf("\n") < 0) {
                                        store[store.length - 1] = "\n/";
                                    } else if (store[store.length - 2] === " ") {
                                        store[store.length - 2] = "";
                                    }
                                }
                                jsxtest = "\n";
                            }
                        }
                        if (jsxtest === "" && x[a] === "{" && typeof jspretty === "function") {
                            jsxtest = x[a - 1];
                            a = jsxItem(a, "");
                            if (x[a + 1] !== ">" && x[a + 1] !== jsxtest) {
                                x[a] = x[a] + " ";
                            }
                            jsxtest = "";
                        }
                    }
                    if ((jsxtest === "*\/" && x[a - 2] + x[a - 1] === "*\/") || (jsxtest === "\n" && x[a - 1] === "\n")) {
                        if (x[a - 2] === "*" && comments === "beautify") {
                            store[store.length - 1] = "/\n";
                        }
                        if (comments !== "beautify") {
                            store.pop();
                            if (store[store.length - 1] === " " && x[a] === " ") {
                                store.pop();
                            }
                        }
                        jsxtest = "";
                    }
                    if (jsxtest === "") {
                        if ((/\s/).test(x[a]) === true && x[a].length === 1) {
                            if ((/\s/).test(x[a - 1]) === true) {
                                do {
                                    a        += 1;
                                    x[a - 1] = "";
                                } while ((/\s/).test(x[a]) === true && x[a].length === 1 && a < end);
                            } else {
                                x[a] = " ";
                            }
                        }
                        if ((x[a] === " " && store.length > 0 && store[store.length - 1].indexOf("\n") < 0) || x[a] !== " ") {
                            store.push(x[a]);
                        }
                        if (x[a] === ">") {
                            b = a + 1;
                            break;
                        }
                    } else if (comments === "beautify") {
                        store.push(x[a]);
                    }
                }
                if (b < 0) {
                    b = x.length;
                }
                x[i] = store.join("");
                if (x[i].charAt(1) !== "/" && x[i].charAt(1) !== "!" && x[i].indexOf(" ") > 0 && x[i].indexOf("<%") !== 0 && x[i].indexOf("<?") !== 0 && x[i].indexOf("<!--#")) {
                    attrs = attributes(x[i]);
                    if (ignore === false) {
                        x[i] = attrs;
                    }
                }

                if (ignore === true) {
                    item = x[i].substring(1, x[i].indexOf(" "));
                    x[i] = x[i].charAt(0);
                    preserve("", "</" + item + ">");
                    return;
                }
                for (a = i + 1; a < b; a += 1) {
                    x[a] = "";
                }
                i = b - 1;
                if (minjsx === true && x[i + 1] === "{") {
                    i = jsxItem(i, "");
                }
            },
            //This function looks for markup comments and removes all
            //contained characters until the comment is properly closed.
            //If a comment is not properly close then all remaining
            //characters will be removed, which is fine because they
            //would not be parsed by a browser anyways.
            markupcomment = function markupmin__markupcomment(ending) {
                var a     = 0,
                    store = [],
                    end   = x.length;
                for (a = i; a < end; a += 1) {
                    if ((a < end - 8 && x[a] + x[a + 1] + x[a + 2] + x[a + 3] + x[a + 4] + x[a + 5] + x[a + 6] + x[a + 7] + x[a + 8] + x[a + 9] + x[a + 10] + x[a + 11] === ending) || (a < end - 4 && x[a] + x[a + 1] + x[a + 2] + x[a + 3] === ending) || (a < end - 3 && x[a] + x[a + 1] + x[a + 2] === ending)) {
                        x[a]     = "";
                        x[a + 1] = "";
                        x[a + 2] = "";
                        if (ending.length > 3) {
                            x[a + 3] = "";
                            if (ending.length === 12) {
                                x[a + 4]  = "";
                                x[a + 5]  = "";
                                x[a + 6]  = "";
                                x[a + 7]  = "";
                                x[a + 8]  = "";
                                x[a + 9]  = "";
                                x[a + 10] = "";
                                x[a + 11] = "";
                                i         = a + 11;
                            } else {
                                i = a + 3;
                            }
                        } else {
                            i = a + 2;
                        }
                        break;
                    }
                    if ((conditional === true && ending.length === 12) || comments === "beautify" || comments === "comments") {
                        store.push(x[a]);
                    }
                    x[a] = "";
                }
                if ((conditional === true && ending.length === 12) || comments === "comments" || comments === "beautify") {
                    x[i] = store.join("");
                    if (x[i].indexOf(ending) !== x[i].length - ending.length) {
                        x[i] = x[i] + ending;
                    }
                }
                i += 1;
                if ((/\s/).test(x[i]) === true) {
                    x[i] = " ";
                }
                if (i < end - 1 && (/\s/).test(x[i + 1]) === true) {
                    do {
                        i    += 1;
                        x[i] = "";
                    } while ((/\s/).test(x[i]) === true && i < end);
                }
            },
            //This function passes the content of script and style
            //blocks off to jsmin.
            markupscript  = function markupmin__markupscript(type) {
                var a           = 0,
                    store       = [],
                    endIndex    = 0,
                    script      = "",
                    endTag      = "",
                    endTagBuild = "</" + type,
                    noEnd       = false,
                    stoken      = "",
                    end         = x.length,
                    cdataStart  = (/^(\s*\/+<!\[+[A-Z]+\[+)/),
                    cdataEnd    = (/(\/+\]+>\s*)$/),
                    scriptStart = (/^(\s*<\!\-\-)/),
                    scriptEnd   = (/(\/+\-\->\s*)$/),
                    cdataS      = "",
                    cdataE      = "",
                    source      = args.source;
                for (a = i; a < end; a += 1) {
                    if ((source.slice(a, a + endTagBuild.length)).toLowerCase() === endTagBuild) {
                        endIndex = a;
                        break;
                    }
                }
                if (endIndex === 0) {
                    endIndex = end;
                    noEnd    = true;
                }
                for (a = i; a < endIndex; a += 1) {
                    if (x[a - 1] !== ">") {
                        store.push(x[a]);
                        x[a] = "";
                    } else {
                        break;
                    }
                }
                if (store.length > 0) {
                    stoken = store[0];
                    store.splice(0, 1);
                    if ((/\s/).test(store[0])) {
                        store.splice(0, 1);
                    }
                }
                for (endIndex; endIndex < end; endIndex += 1) {
                    if (x[endIndex] !== ">") {
                        endTag      = endTag + x[endIndex];
                        x[endIndex] = "";
                    } else {
                        break;
                    }
                }
                endTag = endTag + ">";
                i      = endIndex;
                if (store.join("") === "") {
                    x[i] = stoken + endTag;
                    return;
                }
                script = store.join("");
                if (comments !== "beautify") {
                    if (cdataStart.test(script) === true) {
                        cdataS = script.match(cdataStart)[0];
                        script = script.replace(cdataStart, "");
                    } else if (scriptStart.test(script)) {
                        cdataS = script.match(scriptStart)[0];
                        script = script.replace(scriptStart, "");
                    }
                    if (cdataEnd.test(script) === true) {
                        cdataE = script.match(cdataEnd)[0];
                        script = script.replace(cdataEnd, "");
                    } else if (scriptEnd.test(script)) {
                        cdataE = script.match(scriptEnd)[0];
                        script = script.replace(scriptEnd, "");
                    }
                    if (comments === "" && (store[store.length - 1] !== ">" || (type === "script" && store[store.length - 3] === "]" && store[store.length - 2] === "]" && store[store.length - 1] === ">"))) {
                        if (type === "style") {
                            if (typeof csspretty !== "function") {
                                x[i] = cdataS + script + cdataE;
                                return;
                            }
                            script = cdataS + csspretty({
                                mode   : "minify",
                                objsort: objsort,
                                source : script,
                                topcoms: top_comments
                            }) + cdataE;
                        } else {
                            if (typeof jspretty !== "function") {
                                x[i] = cdataS + script + cdataE;
                                return;
                            }
                            script = cdataS + jspretty({
                                correct     : correct,
                                mode        : "minify",
                                obfuscate   : obfuscate,
                                quoteConvert: quoteConvert,
                                source      : script,
                                styleguide  : styleguide,
                                topcoms     : top_comments
                            }) + cdataE;
                        }
                    }
                }
                end = script.length;
                for (a = 0; a < end; a += 1) {
                    if ((/\s/).test(script.charAt(a)) === true) {
                        script = script.substr(a + 1);
                    } else {
                        break;
                    }
                }
                if (noEnd === true) {
                    x[i] = stoken + script.replace(/(>\s+)$/, ">");
                } else {
                    x[i] = stoken + script.replace(/(>\s+)$/, ">") + endTag;
                }
            },
            content       = function markupmin__content() {
                var a       = 0,
                    end     = x.length,
                    store   = [],
                    comment = "",
                    jsxtest = (minjsx === true) ? true : false;
                if (x[i] === "\n") {
                    x[i] = " ";
                    if (minjsx === true && x[i + 1] === "/") {
                        if (x[i + 2] === "/") {
                            comment = "//";
                        } else if (x[i + 2] === "*") {
                            comment = "/*";
                        }
                    }
                } else if (minjsx === true && x[i] === "/") {
                    if (x[i + 1] === "/") {
                        comment = "//";
                    } else if (x[i + 1] === "*") {
                        comment = "/*";
                    }
                }
                for (a = i; a < end; a += 1) {
                    if (x[a] === "<") {
                        break;
                    }
                    if (jsxtest === true && (/\s/).test(x[a]) === false) {
                        if (x[a] === "{" && typeof jspretty === "function") {
                            i = jsxItem(a, " ");
                            return;
                        }
                        jsxtest = false;
                    }
                    store.push(x[a]);
                    x[a] = "";
                    if (comment !== "" && ((store[store.length - 2] === "*" && store[store.length - 1] === "/" && comment === "/*") || (store[store.length - 1] === "\n" && comment === "//"))) {
                        break;
                    }
                }
                i    = a - 1;
                x[i] = store.join("");
                if (comment === "") {
                    x[i] = x[i].replace(/\s+/g, " ");
                }
            };
        //This self invocating function is the action piece of
        //markupmin. It is a single loop that execute the closures
        //described above when comments, tags, style blocks, and/or
        //script blocks are encountered.  No logic is performed on
        //content, aside from whitespace tokenization.
        (function markupmin__algorithm() {
            var a      = 0,
                store  = [],
                end    = x.length,
                part   = "",
                source = args.source;
            for (i = 0; i < end; i += 1) {
                //If markupmin is requested by markup_beauty then do
                //not process scripts or styles.
                if ((source.slice(i, i + 7)).toLowerCase() === "<script") {
                    store = [];
                    for (a = i + 8; a < end; a += 1) {
                        if (source.charAt(a) === ">") {
                            break;
                        }
                        store.push(source.charAt(a));
                    }
                    part = store.join("").toLowerCase().replace(/"/g, "'");
                    if (comments !== "beautify" && comments !== "nocomment") {
                        markupspace();
                    }
                    if (part.indexOf("type='syntaxhighlighter'") > -1) {
                        preserve("", "</script>");
                    }
                    if (part.indexOf("type='") < 0 || part.indexOf("type='text/javascript'") > -1 || part.indexOf("type='application/javascript'") > -1 || part.indexOf("type='application/x-javascript'") > -1 || part.indexOf("type='text/ecmascript'") > -1 || part.indexOf("type='application/ecmascript'") > -1 || part.indexOf("type='text/cjs'") > -1) {
                        markupscript("script");
                    }
                } else if ((source.slice(i, i + 6)).toLowerCase() === "<style") {
                    store = [];
                    for (a = i + 7; a < end; a += 1) {
                        if (source.charAt(a) === ">") {
                            break;
                        }
                        store.push(source.charAt(a));
                    }
                    part = store.join("").toLowerCase().replace(/"/g, "'");
                    if (comments !== "beautify" && comments !== "nocomment") {
                        markupspace();
                    }
                    if (part.indexOf("type='") < 0 || part.indexOf("type='text/css'") > -1) {
                        markupscript("style");
                    }
                } else if (minjsx === true && x[i] === "{" && typeof jspretty === "function") {
                    i = jsxItem(i, " ");
                } else if ((conditional === true || (presume_html === true && comments === "beautify")) && source.slice(i, i + 8) === "<!--[if " && source.slice(i, i + 10) !== "<!--[if !") {
                    markupcomment("<![endif]-->");
                } else if (source.slice(i, i + 4) === "<!--" && x[i + 4] !== "#") {
                    markupcomment("-->");
                } else if (source.slice(i, i + 4) === "<%--") {
                    markupcomment("--%>");
                } else if (source.slice(i, i + 5) === "<?php") {
                    preserve("<?php", "?>");
                } else if (source.slice(i, i + 4).toLowerCase() === "<pre" && presume_html === true) {
                    preserve("<pre", "</pre>");
                } else if (source.slice(i, i + 2) === "<%") {
                    preserve("<%", "%>");
                } else if (source.slice(i, i + 2) === "[%") {
                    preserve("[%", "%]");
                } else if (source.slice(i, i + 2) === "{@") {
                    preserve("{@", "@}");
                } else if (x[i] === "<" && (source.slice(i, i + 4) !== "<!--" || source.slice(i, i + 5) === "<!--#")) {
                    markupspace();
                } else if (x[i] === undefined) {
                    x[i] = "";
                } else if (x[i - 1] !== undefined) {
                    content();
                }
            }
        }());
        if (minjsx === true) {
            return (function markupmin__jsxOutput() {
                var a       = 0,
                    b       = x.length,
                    output  = [],
                    newline = false;
                for (a = 0; a < b; a += 1) {
                    if (x[a] !== "") {
                        if (x[a] === "\n") {
                            newline = true;
                        } else if (output[output.length - 1] === " " && x[a] !== " ") {
                            output[output.length - 1] = " " + x[a];
                        } else if (x[a] !== " " || (x[a] === " " && output[output.length - 1] !== " ")) {
                            if (newline === true && x[a].charAt(0) !== " ") {
                                x[a] = " " + x[a];
                            }
                            newline = false;
                            output.push(x[a]);
                        }
                    }
                }
                if (comments === "beautify") {
                    return output.join("pdjsxSep").replace(/(\s*)$/, "");
                }
                return output.join("").replace(/(\s*)$/, "");
            }());
        }
        if (id.length > 0) {
            (function markupmin_idNormalize() {
                var a          = 0,
                    len        = id.length,
                    value      = "",
                    duplicates = [];
                id.sort();
                for (a = 0; a < len; a += 1) {
                    if (id[a] === id[a + 1] && id[a] !== value) {
                        duplicates.push(id[a]);
                    }
                    value = id[a];
                }
                if (duplicates.length > 0) {
                    summary = duplicates.join(", ");
                }
            }());
        }
        return (function markupmin__finalTouches() {
            var a         = 0,
                b         = 0,
                htmlStore = [],
                htmlEnd   = 0,
                test      = false,
                output    = "",
                build     = [],
                end       = x.length,
                html      = [
                    "area", "base", "basefont", "br", "col", "embed", "eventsource", "frame", "hr", "img", "input", "keygen", "link", "meta", "param", "progress", "source", "wbr"
                ],
                htmlLen   = html.length;
            //The following loop pushes not empty indexes from the "x"
            //array into another temporary array: "build".
            for (a = 0; a < end; a += 1) {
                if (x[a] !== "") {
                    build.push(x[a]);
                }
            }
            //The following loop pushes indexes from temporary array
            //"build" into the newly emptied array "x" that are not
            //consecutive runs of white space.
            x   = [];
            end = build.length;
            for (a = 0; a < end; a += 1) {
                test = (/^(\s+)$/).test(build[a]);
                if (test === false || (test === true && (/^(\s+)$/).test(build[a + 1]) === false)) {
                    x.push(build[a]);
                }
            }
            //The following loop converts indexes in the array that
            //contain only whitespace to an empty string if that index
            //does not align with a syntax formatted singleton.
            end = x.length;
            for (a = 2; a < end; a += 1) {
                test = false;
                //This is a cheat to look at vocabulary to determine if
                //a tag is a singleton opposed to looking at only
                //syntax.
                if (presume_html === true) {
                    htmlStore = [];
                    htmlEnd   = x[a].length;
                    for (b = 1; b < htmlEnd; b += 1) {
                        if (/[a-z]/i.test(x[a].charAt(b))) {
                            htmlStore.push(x[a].charAt(b));
                        } else {
                            break;
                        }
                    }
                    for (b = 0; b < htmlLen; b += 1) {
                        if (htmlStore.join("") === html[b] && x[a].charAt(0) === "<") {
                            test = true;
                            break;
                        }
                    }
                }
                //This removes spaces between elements except between
                //two closing tags following content or any space around
                //a singleton tag.
                if ((/^\s+$/).test(x[a - 1]) === true) {
                    if (test === false && (x[a].charAt(0) === "<" && x[a].charAt(1) === "/" && x[a - 1] !== " " && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/" && x[a - 3].charAt(0) !== "<") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/" && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/")) {
                        x[a - 1] = "";
                    }
                }
            }

            if (minjsx === true && comments === "beautify") {
                output = x.join("");
            } else {
                output = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/<(\s*)/g, "<").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">");
                if (comments === "") {
                    output = output.replace(/<%\s+/g, "<%").replace(/\s+%>/g, "%>").replace(/\[%\s+/g, "[%").replace(/\s+%\]/g, "%]").replace(/\{@\s+/g, "{@").replace(/\s+@\}/g, "@}");
                }
            }

            if ((/\s/).test(output.charAt(0)) === true) {
                output = output.slice(1, output.length);
            }
            return output;
        }());
    };