/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
/*global jsmin*/
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
/*
 If the comments argument is supplied with the value "comments" this
 function presumes it is being used as a tool of beautification.  In
 this case JSMin is not used or needed and the next statements are
 irrelevant.  This is a minification application for markup languages.
 Its only requirement is that the modified jsmin.js be included prior to
 the inclusion of this code.  The required jsmin.js is customized to
 independently support CSS and JavaScript minification.  It must be
 obtained from the following location.
 http://prettydiff.com/lib/jspretty.js
 http://prettydiff.com/lib/fulljsmin.js

 At this time (17 Feb 2014) JSMin is a custom fork of the well known
 library, but is a legacy library that will be dropped in the near
 future once I have written a faster CSS parser.  JSMin is only being
 used for CSS support.  JSPretty is now used to minify JavaScript.

 Minification is achieved according to this pattern:

 1) It looks for syntax characters inside tags.  Whitespace is
 tokenized inside tags and removes all whitespace directly next to
 a syntax character except quotes that do not occur directly next
 or one space away from an equal sign. Numbers, hypens (dash,
 minus), underscores, alpha characters, and ampersands were not
 considered in this logic.
 3) It takes the contents of script and style tags, runs jsmin against
 the style content and jspretty against the script content, removes the
 original content, and then returns the code minified.
 4) It removes all comments.
 5) Then at the end it removes even more spaces, using loops and the
 replace method, to tokenize additional spaces introduced by the
 prior logic except single spaces adjacent to singleton tags or
 content.


 Arguments:
 * x = source code

 * comments = whether or not to preserve comments.  Accepted values are
 "comments" and "beautify".  The only difference is that "beautify"
 will preserve the comments with inline CSS and JavaScript for use
 with the markup_beauty.js application.

 * presume_html = This lets the application know to expect HTML with
 singleton tags that look like starting tags, such as "<br>" instead
 of "<br/>".  The tag names usedbythis argument are located in the array
 named "HTML" at the top of this code.  This argument accepts a Boolean
 value.

 * top_comments is passed through to the modified fulljsmin.js.  This
 informs JSMin to preserve all comments before the first line of code
 in CSS and JavaScript code.  This argument accepts a Boolean value.

 * conditional determines whether the application should retain HTML
 conditional comments used by Internet Explorer.  Only boolean type
 accepted and this defaults to false.

 markupmin is composed of these child objects:
 * it: This self initiating function performs a single pass through
 the data looking for markup tags, script blocks, style blocks, and
 comments.
 * markupspace: This function is executed by the it function when a
 tag is encountered that is not a comment, style block, or script
 block.  This function serves to remove all spaces around syntax
 characters inside tags except double and single quotes.
 * markupcomment: This function removes opening comment characters and
 every character after until the closing comment is found.
 * markupscript: This function is fired if a script or style tag is
 found.  It checks if jsmin exists as a named object, or otherwise
 immediately exits.  This function finds the opening tag, and
 records it.  Then it takes all the characters inside the concerned
 tag and passes them to jsmin.  The opening tag and output of jsmin
 is returned only after the original opening tag and tag content are
 removed.

 At the end all other white space is tokenized and spaces around the
 opening and closing of tags, except those adjacent to content, is
 removed.
 */
var markupmin = function markupmin(args) {
        "use strict";
        var i             = 0,
            x             = (typeof args.source === "string") ? args.source.split("") : "Error: no content supplied to markup.",
            comments      = (args.comments !== "comments" && args.comments !== "beautify" && args.comments !== "diff") ? "" : args.comments,
            presume_html  = (args.presume_html === true || args.presume_html === "true") ? true : false,
            top_comments  = (args.top_comments === true || args.top_comments === "true") ? true : false,
            conditional   = (args.conditional === true || args.conditional === "true") ? true : false,
            correct       = (args.correct === true || args.correct === "true") ? true : false,
            obfuscate     = (args.obfuscate === true || args.obfuscate === "true") ? true : false,
            //This closure performs checks for excessive whitespace
            //inside markup tags.  Whitespace around certain syntax
            //characters is collapsed and all remaining whitespace is
            //tokenized.
            markupspace   = function markupmin__markupspace() {
                var a     = 0,
                    store = [],
                    end   = x.length;
                for (a = i; a < end; a += 1) {
                    if (x[a] === ">") {
                        break;
                    }
                    store.push(x[a]);
                    x[a] = "";
                }
                i    = a;
                x[i] = store.join("").replace(/\s+/g, " ").replace(/\s*,\s+/g, ", ").replace(/\s*\/(\s*)/g, "/").replace(/\s+\="/g, "=\"").replace(/\s+\='/g, "='") + ">";
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
                    } while ((/\s/).test(x[i]) === true);
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
                    stoken      = "",
                    end         = x.length,
                    cdataStart  = (/^(\s*\/+<!\[+[A-Z]+\[+)/),
                    cdataEnd    = (/(\/+\]+>\s*)$/),
                    scriptStart = (/^(\s*<\!\-\-)/),
                    scriptEnd   = (/(\/+\-\->\s*)$/),
                    cdataS      = "",
                    cdataE      = "",
                    source      = args.source;
                if (typeof jsmin !== "function") {
                    return;
                }
                for (a = i; a < end; a += 1) {
                    if ((source.slice(a, a + endTagBuild.length)).toLowerCase() === endTagBuild) {
                        endIndex = a;
                        break;
                    }
                }
                for (a = i; a < endIndex; a += 1) {
                    if (x[a - 1] !== ">") {
                        store.push(x[a]);
                        x[a] = "";
                    } else {
                        break;
                    }
                }
                stoken = store[0];
                store.splice(0, 1);
                if ((/\s/).test(store[0])) {
                    store.splice(0, 1);
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
                    if (store[store.length - 1] !== ">" || (type === "script" && store[store.length - 3] === "]" && store[store.length - 2] === "]" && store[store.length - 1] === ">")) {
                        if (type === "style") {
                            script = cdataS + jsmin({
                                source  : script,
                                level   : 3,
                                type    : "css",
                                alter   : true,
                                fcomment: top_comments
                            }) + cdataE;
                        } else {
                            script = cdataS + jspretty({
                                source   : script,
                                correct  : correct,
                                mode     : "minify",
                                topcoms  : top_comments,
                                obfuscate: obfuscate
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
                x[i] = stoken + script + endTag;
            },
            preserve      = function markupmin__preserve(endTag) {
                var a     = 0,
                    c     = 0,
                    end   = x.length,
                    store = [];
                for (c = i; c < end; c += 1) {
                    if (endTag === "</script>" && c > 8 && (x[c - 8] + x[c - 7] + x[c - 6] + x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</script>") {
                        break;
                    }
                    if (endTag === "</pre>" && c > 5 && (x[c - 5] + x[c - 4] + x[c - 3] + x[c - 2] + x[c - 1] + x[c]).toLowerCase() === "</pre>") {
                        break;
                    }
                    if (x[c - 1] + x[c] === endTag) {
                        break;
                    }
                }
                for (a = i; a < c; a += 1) {
                    store.push(x[a]);
                    x[a] = "";
                }
                x[i] = store.join("");
                i    = c;
            },
            content       = function markupmin__content() {
                var a     = 0,
                    end   = x.length,
                    store = [];
                for (a = i; a < end; a += 1) {
                    if (x[a] === "<") {
                        break;
                    }
                    store.push(x[a]);
                    x[a] = "";
                }
                i    = a - 1;
                x[i] = store.join("").replace(/\s+/g, " ");
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
            for (i = 0; i < x.length; i += 1) {
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
                    part = store.join("").toLowerCase().replace(/'/g, "\"");
                    if (comments !== "beautify" && comments !== "diff") {
                        markupspace();
                    }
                    if (part.indexOf("type=\"syntaxhighlighter\"") > -1) {
                        preserve("</script>");
                    }
                    if (part.indexOf("type=\"") < 0 || part.indexOf("type=\"text/javascript\"") > -1 || part.indexOf("type=\"application/javascript\"") > -1 || part.indexOf("type=\"application/x-javascript\"") > -1 || part.indexOf("type=\"text/ecmascript\"") > -1 || part.indexOf("type=\"application/ecmascript\"") > -1 || part.indexOf("type=\"text/cjs\"") > -1) {
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
                    part = store.join("").toLowerCase().replace(/'/g, "\"");
                    if (comments !== "beautify" && comments !== "diff") {
                        markupspace();
                    }
                    if (part.indexOf("type=\"") < 0 || part.indexOf("type=\"text/css\"") > -1) {
                        markupscript("style");
                    }
                } else if ((conditional === true || (presume_html === true && comments === "beautify")) && source.slice(i, i + 8) === "<!--[if ") {
                    markupcomment("<![endif]-->");
                } else if (source.slice(i, i + 4) === "<!--" && x[i + 4] !== "#") {
                    markupcomment("-->");
                } else if (source.slice(i, i + 4) === "<%--") {
                    markupcomment("--%>");
                } else if (source.slice(i, i + 5) === "<?php") {
                    preserve("?>");
                } else if (source.slice(i, i + 4).toLowerCase() === "<pre" && presume_html === true) {
                    preserve("</pre>");
                } else if (source.slice(i, i + 2) === "<%") {
                    preserve("%>");
                } else if ((x[i] === "<" && x[i + 1] !== "!") || (x[i] === "<" && x[i + 1] === "!" && x[i + 2] !== "-")) {
                    markupspace();
                } else if (x[i] === undefined) {
                    x[i] = "";
                } else if (x[i - 1] !== undefined && x[i - 1].charAt(x[i - 1].length - 1) === ">") {
                    content();
                }
            }
        }());
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
                test = (/^\s+$/).test(build[a]);
                if (test === false || (test === true && (/^\s+$/).test(build[a + 1]) === false)) {
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
            output = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/<(\s*)/g, "<").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">");
            if ((/\s/).test(output.charAt(0)) === true) {
                output = output.slice(1, output.length);
            }
            return output;
        }());
    };