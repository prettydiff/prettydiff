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
 http://prettydiff.com/fulljsmin.js

 Minification is achieved according to this pattern:

 1) It looks for syntax characters inside tags.  Whitespace is
 tokenized inside tags and removes all whitespace directly next to
 a syntax character except quotes that do not occur directly next
 or one space away from an equal sign. Numbers, hypens (dash,
 minus), underscores, alpha characters, and ampersands were not
 considered in this logic.
 3) It takes the contents of script and style tags, runs jsmin against
 this content, removes the original content, and then returns the
 code minified with jsmin.
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
var markupmin = function (y, comments, presume_html, top_comments) {
        "use strict";
        var i = 0,
            x = y.split(""),

            //This closure performs checks for excessive whitespace
            //inside markup tags.  Whitespace around certain syntax
            //characters is collapsed and all remaining whitespace is
            //tokenized.
            markupspace = function () {
                var a = 0,
                    c = [],
                    Y = x.length;
                for (a = i; a < Y; a += 1) {
                    if (x[a] === ">") {
                        break;
                    } else {
                        c.push(x[a]);
                        x[a] = "";
                    }
                }
                i = a;
                x[i] = c.join("").replace(/\s+/g, " ").replace(/\s*,\s+/g, ", ").replace(/\s*\/\s*/g, "/").replace(/\s*=\s*/g, "=").replace(/\s*:\s*/g, ":").replace(/ \="/g, "=\"").replace(/ \='/g, "='") + ">";
            },

            //This function looks for markup comments and removes all
            //contained characters until the comment is properly closed.
            //If a comment is not properly close then all remaining
            //characters will be removed, which is fine because they
            //would not be parsed by a browser anyways.
            markupcomment = function () {
                var Y = x.length,
                    b = 0,
                    c = [];
                for (b = i; b < Y; b += 1) {
                    if (x[b] === "-" && x[b + 1] === "-" && x[b + 2] === ">") {
                        x[b] = "";
                        x[b + 1] = "";
                        x[b + 2] = "";
                        i = b + 2;
                        break;
                    } else {
                        if (comments === "beautify" || comments === "comments") {

                            c.push(x[b]);
                        }
                        x[b] = "";
                    }
                }
                if (comments === "comments" || comments === "beautify") {
                    x[i] = " " + c.join("") + "-->";
                }
            },

            //This function passes the content of script and style
            //blocks off to jsmin.
            markupscript = function (z) {
                var c = 0,
                    e = [],
                    f = 0,
                    g = "",
                    h = "",
                    j = "</" + z,
                    m = "",
                    Y = x.length,
                    cdataStart = (/^(\s*\/+<!\[+[A-Z]+\[+)/),
                    cdataEnd = (/(\/+\]+>\s*)$/),
                    scriptStart = (/^(\s*<\!\-\-)/),
                    scriptEnd = (/(\/+\-\->\s*)$/),
                    cs = "",
                    ce = "";
                if (typeof jsmin === "undefined") {
                    return;
                }
                for (c = i; c < Y; c += 1) {
                    if ((y.slice(c, c + j.length)).toLowerCase() === j) {
                        f = c;
                        break;
                    }
                }
                for (c = i; c < f; c += 1) {
                    if (x[c - 1] !== ">") {
                        e.push(x[c]);
                        x[c] = "";
                    } else {
                        break;
                    }
                }
                m = e[0];
                e.splice(0, 1);
                if ((/\s/).test(e[0])) {
                    e.splice(0, 1);
                }
                for (f; f < Y; f += 1) {
                    if (x[f] !== ">") {
                        h = h + x[f];
                        x[f] = "";
                    } else {
                        break;
                    }
                }
                h = h + ">";
                i = f;
                if (e.join("") === "") {
                    x[i] = m + h;
                    return;
                }
                g = e.join("");
                if (comments !== "beautify") {
                    if (cdataStart.test(g)) {
                        cs = g.match(cdataStart)[0];
                        g = g.replace(cdataStart, "");
                    } else if (scriptStart.test(g)) {
                        cs = g.match(scriptStart)[0];
                        g = g.replace(scriptStart, "");
                    }
                    if (cdataEnd.test(g)) {
                        ce = g.match(cdataEnd)[0];
                        g = g.replace(cdataEnd, "");
                    } else if (scriptEnd.test(g)) {
                        ce = g.match(scriptEnd)[0];
                        g = g.replace(scriptEnd, "");
                    }
                    if (z === "style") {
                        g = cs + jsmin(g, 3, "css", true, top_comments) + ce;
                    } else {
                        g = cs + jsmin(g, 3, "javascript", false, top_comments) + ce;
                    }
                }
                Y = g.length;
                for (c = 0; c < Y; c += 1) {
                    if ((/\s/).test(g.charAt(c))) {
                        g = g.substr(c + 1);
                    } else {
                        break;
                    }
                }
                x[i] = m + g + h;
            },

            preserve = function (end) {
                var Y = x.length,
                    a = 0,
                    b = [],
                    c = 0;
                for (c = i; c < Y; c += 1) {
                    if (x[c - 1] + x[c] === end) {
                        break;
                    }
                }
                for (a = i; a < c; a += 1) {
                    b.push(x[a]);
                    x[a] = "";
                }
                x[i] = b.join("");
                i = c;
            },

            content = function () {
                var Y = x.length,
                    a = 0,
                    b = [];
                for (a = i; a < Y; a += 1) {
                    if (x[a] === "<") {
                        break;
                    } else {
                        b.push(x[a]);
                        x[a] = "";
                    }
                }
                i = a - 1;
                x[i] = b.join("").replace(/\s+/g, " ");
            },

            //This self invocating function is the action piece of
            //markupmin. It is a single loop that execute the closures
            //described above when comments, tags, style blocks, and/or
            //script blocks are encountered.  No logic is performed on
            //content, aside from whitespace tokenization.
            it = (function () {
                var a = [],
                    b = 0,
                    c = x.length,
                    d = "";
                for (i = 0; i < x.length; i += 1) {

                    //If markupmin is requested by markup_beauty then do
                    //not process scripts or styles.
                    if ((y.slice(i, i + 7)).toLowerCase() === "<script") {
                        a = [];
                        for (b = i + 8; b < c; b += 1) {
                            if (y.charAt(b) === ">") {
                                break;
                            }
                            a.push(y.charAt(b));
                        }
                        d = a.join("").toLowerCase().replace(/'/g, "\"");
                        if (comments !== "beautify" && comments !== "diff") {
                            markupspace();
                        }
                        if (d.indexOf("type=\"") === -1 || d.indexOf("type=\"text/javascript\"") !== -1 || d.indexOf("type=\"application/javascript\"") !== -1 || d.indexOf("type=\"application/x-javascript\"") !== -1 || d.indexOf("type=\"text/ecmascript\"") !== -1 || d.indexOf("type=\"application/ecmascript\"") !== -1) {
                            markupscript("script");
                        }
                    } else if ((y.slice(i, i + 6)).toLowerCase() === "<style") {
                        a = [];
                        for (b = i + 7; b < c; b += 1) {
                            if (y.charAt(b) === ">") {
                                break;
                            }
                            a.push(y.charAt(b));
                        }
                        d = a.join("").toLowerCase().replace(/'/g, "\"");
                        if (comments !== "beautify" && comments !== "diff") {
                            markupspace();
                        }
                        if (d.indexOf("type=\"") === -1 || d.indexOf("type=\"text/css\"") !== -1) {
                            markupscript("style");
                        }
                    } else if (y.slice(i, i + 4) === "<!--" && x[i + 4] !== "#") {
                        markupcomment();
                    } else if (y.slice(i, i + 5) === "<?php") {
                        preserve("?>");
                    } else if (y.slice(i, i + 2) === "<%") {
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

        return (function () {
            var a = 0,
                b = [],
                c = false,
                d = 0,
                f = 0,
                g = "",
                i = [],
                Y = x.length,
                html = ["br", "meta", "link", "img", "hr", "base", "basefont", "area", "col", "frame", "input", "param"],
                e = html.length;

            //The following loop pushes not empty indexes from the "x" array
            //into another temporary array: "i".
            for (a = 0; a < Y; a += 1) {
                if (x[a] !== "") {
                    i.push(x[a]);
                }
            }
            //The following loop pushes indexes from temporary array "i"
            //into the newly emptied array "x" that are not consecutive runs
            //of white space.
            x = [];
            Y = i.length;
            for (a = 0; a < Y; a += 1) {
                c = (/^\s+$/).test(i[a]);
                if (!c || (c && !(/^\s+$/).test(i[a + 1]))) {
                    x.push(i[a]);
                }
            }
            //The following loop converts indexes in the array that contain
            //only whitespace to an empty string if that index does not
            //align with a syntax formatted singleton.
            Y = x.length;
            for (a = 2; a < Y; a += 1) {
                c = false;

                //This is a cheat to look at vocabulary to determine if a
                //tag is a singleton opposed to looking at only syntax.
                if (presume_html === true) {
                    b = [];
                    f = x[a].length;
                    for (d = 1; d < f; d += 1) {
                        if (/[a-z]/i.test(x[a].charAt(d))) {
                            b.push(x[a].charAt(d));
                        } else {
                            break;
                        }
                    }
                    for (d = 0; d < e; d += 1) {
                        if (b.join("") === html[d] && x[a].charAt(0) === "<") {
                            c = true;
                            break;
                        }
                    }
                }

                //This removes spaces between elements except between two
                //closing tags following content or any space around a
                //singleton tag.
                if ((/^\s+$/).test(x[a - 1])) {
                    if (!c && (x[a].charAt(0) === "<" && x[a].charAt(1) === "/" && x[a - 1] !== " " && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/" && x[a - 3].charAt(0) !== "<") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/") && (x[a].charAt(0) === "<" && x[a].charAt(x[a].length - 2) !== "/" && x[a - 2].charAt(0) === "<" && x[a - 2].charAt(1) === "/")) {
                        x[a - 1] = "";
                    }
                }
            }
            g = x.join("").replace(/-->\s+/g, "--> ").replace(/\s+<\?php/g, " <?php").replace(/\s+<%/g, " <%").replace(/\s*>\s+/g, "> ").replace(/\s+<\s*/g, " <").replace(/\s+\/>/g, "/>").replace(/\s+>/g, ">");
            if ((/\s/).test(g.charAt(0))) {
                g = g.slice(1, g.length);
            }
            return g;
        }());
    };