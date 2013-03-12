/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
/*global markupmin, jspretty, cleanCSS*/
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
 This application serves to beautify markup languages.  The intent of
 this application is to be language independant so long as the language
 is tag based using "<" as the tag opening delimiter and ">" as the tag
 ending delimiter.  The input does not have to be well formed or valid
 by any means so long as it can be determined where a tag begins and
 where a tag ends.  Additionally, the code also supports nested tags,
 such as JSTL tags <c:out value="<em>text</em>"/>.

 The only HTML specific area always inferred by this application is that
 the contents of "script" tags are presumed to be JavaScript and the
 contents of "style" tags are presumed to be CSS when these tags do not
 contain a "type" attribute.

 Since this code is entirely language independant it does not make
 assumptions on vocabulary.  This means singleton tags, tags that occur
 in a singular use opposed to tags that exist as a pair with one to
 serve as an opening and the other to serve as the closing tag, are only
 identified if they end with "/>".  Otherwise singleton tags are
 presumed to be opening tags will indent following tags as such. I do
 provide an "html" argument to identify singletons in HTML by tag name.

 This code was created for three reasons:
 1) Create an application that is more open and friendly to
 customization.

 2) Provide an application that recognizes many various tag grammars
 The default recognized tag types are:
 * SGML comments "<!-- x -->"
 * SSI tags "<!--#command -->"
 * ASP tags "<% x %>"
 * PHP tags "<?php x ?>" - Please note that php tags must begin with
 "<?php" and not "<?" to prevent collision with XML parsing
 statements.  No support is provided for tags that start with
 only "<?", and so they are considered to be just another start
 tag.
 * XML parsing commands "<?xml x ?>"
 * SGML parsing commands "<!command x>"
 * start tags "<div>"
 * closing tags "</div>"
 * singleton tags "<link/>" or "<link />"

 !! It should be noted that at this time the contents of ASP and PHP
 tags are completely preserved, which means white space as well.  The
 only impact is that the opening line of these tags is indented exactly
 like a singleton tag up to the first line break.

 3) This provides beautification that does not insert extra white space
 into the default white space parsed, tokenized, output.  This is
 accomplished by defining content as four different types:
 * content - This type does not begin or end with whitespace
 * mixed_start - This type begins but not ends with whitespace
 * mixed_end - This type ends but not begins with whitespace
 * mixed_both - This type ends and begins with whitespace

 External Requirements:
 1) cleanCSS function - This stand alone application is the
 beautification engine used for the contents of "style" tags
 2) jspretty function - This stand alone application is the
 beautification engine used for the contents of "script" tags
 3) markupmin - This application is the minifier for markup langauges.
 This is the first executed instruction so that we can start fresh
 without any unneeded trash that may provide interference.
 3a) markupmin requires the jsmin function for its standard
 minification of JavaScript and CSS, but that portion of markupmin
 is not accessed by markup_beauty.

 Options:
 Options are properties of a single object literal named "args".

 1) args.source - This is the source content to parse.

 2) args.insize - This is the number of characters that make up a single
 indentation.  The default value is 4.

 3) args.inchar - This is the character used for indentation.  The
 default character is a space.

 4) args.mode - This argument accepts a value of 'beautify' or 'diff'.
 The value 'beautify' informs the markupmin function to preserve markup
 comments and not to minify CSS or JavaScript.  The value 'diff'
 informs markupmin to not minify CSS or JavaScript and does not
 preserve markup comments.

 5) args.comments - This determines whether comments should be indented
 in accordance with the markup or flush to the left.  The acceptable
 values are 'noindent' or 'indent'.  'noindent' is the default value.

 6) args.style - This determines whether the contents of script or
 style tags should be indented starting from the opening script or
 style tag or if this code should start indentation independent of the
 markup.  Acceptable values are true or false.  The default value is
 false.

 7) args.html - If this argument is supplied the boolean value true,
 and not string "true", then tags with certain tag names are converted
 to singleton types after the type assignment is performed.  This
 correction occurs regardless of syntax.

 8) args.content - This argument is only used in "diff" mode and not
 "beautify" mode.  This argument nullifies text nodes so as to allow a
 comparison of tags only.

 9) args.force_indent - If this argument is supplied the boolean value
 true then all parts of the source code are always indented without
 regard for white space tokens.
 
 10) args.wrap - This argument must be supplied with a number greater
 than 0 or else it is ignored.  This determines the length of text
 content before it should wrap onto a new line.  Wrapping only occurs at
 the space, if any, prior to the wrapping point.  The default value is
 72.

 summary
 Variable "summary" is used in an unassigned anonymous function at the
 very bottom of markup_beauty, but is not scoped by markup_beauty.  It
 is intended for use as closure to markup_beauty, because the variable
 name markup_summary is intended for use outside of markup_beauty, but
 it requires access to the variables and arrays of markup_beauty.

 Markup Summary is a small HTML table and some conditional warning
 statements to prodive statistics for analysis of processed markup and
 to alter users if to possibly flaws in the input that may likely
 interefere with processing of beautification.
 -----------------------------------------------------------------------
 */
var summary = "",
    markup_beauty = function markup_beauty(args) {
        "use strict";
        //This function only normalizes input to the application
        var token = [],
            build = [],
            cinfo = [],
            level = [],
            inner = [],
            sum = [],
            x = (typeof args.source === "string") ? args.source : "",
            msize = (isNaN(args.insize)) ? 4 : Number(args.insize),
            mchar = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
            mmode = (typeof args.mode === "string" && args.mode === "diff") ? "diff" : "beautify",
            mcomm = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : "indent",
            mstyle = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
            mhtml = (typeof args.html === "boolean") ? args.html : false,
            mcont = (typeof args.content === "boolean") ? args.content : false,
            mforce = (typeof args.force_indent === "boolean") ? args.force_indent : false,
            mcond = (typeof args.conditional === "boolean") ? args.conditional : false,
            mwrap = (isNaN(args.wrap)) ? 0 : Number(args.wrap);
        //cdatafix temporarily transforms angle brackets in cdata
        //declarations to prevent contamination.  This mutation is
        //corrected at the top of the code_type function.
        (function markup_beauty__replaceCdata() {
            var a = function markup_beauty__replaceCdata_start(y) {
                    y = y.replace(/</g, "\nprettydiffcdatas");
                    return y;
                },
                b = function markup_beauty__replaceCdata_end(y) {
                    y = y.replace(/>/g, "\nprettydiffcdatae");
                    return y;
                };
            x = x.replace(/\/+<!\[+[A-Z]+\[+/g, a).replace(/\/+\]+>/g, b);
        }());
        //this function is the logic that intelligently identifies the
        //angle brackets nested inside quotes and converts them to
        //square brackets to prevent interference of beautification.
        //This is the logic that allows JSP beautification to occur.
        (function markup_beauty__findNestedTags() {
            var d = (function markup_beauty__findNestedTags_angleBraces() {
                    var a = 0,
                        b = 0,
                        c = x.length,
                        d = [],
                        e = 0,
                        h = -1,
                        i = 0,
                        j = 0,
                        k = -1,
                        l = 0,
                        m = 0,
                        n = false,
                        o = false,
                        p = 0,
                        q = [">"],
                        r = false,
                        s = 0;
                    for (a = 0; a < c; a += 1) {
                        //if in HTML mode and a pre tag is found then
                        //pass over
                        if (mhtml === true && x.substr(a, 4).toLowerCase() === "<pre") {
                            for (b = a + 4; b < c; b += 1) {
                                if (x.charAt(b) + x.charAt(b + 1) + x.charAt(b + 2).toLowerCase() + x.charAt(b + 3).toLowerCase() + x.charAt(b + 4).toLowerCase() + x.charAt(b + 5) === "</pre>") {
                                    if (/></.test(x.substr(a, b))) {
                                        h += 2;
                                    } else {
                                        h += 3;
                                    }
                                    a = b + 5;
                                    break;
                                }
                            }
                            //if PHP, ASP, script, or style found then
                            //pass over
                        } else if (x.substr(a, 7).toLowerCase() === "<script") {
                            for (b = a + 7; b < c; b += 1) {
                                if (x.charAt(b) + x.charAt(b + 1) + x.charAt(b + 2).toLowerCase() + x.charAt(b + 3).toLowerCase() + x.charAt(b + 4).toLowerCase() + x.charAt(b + 5).toLowerCase() + x.charAt(b + 6).toLowerCase() + x.charAt(b + 7).toLowerCase() + x.charAt(b + 8) === "</script>") {
                                    //h counts the index of the future
                                    //build array
                                    if (/></.test(x.substr(a, b))) {
                                        h += 2;
                                    } else {
                                        h += 3;
                                    }
                                    a = b + 8;
                                    break;
                                }
                            }
                        } else if (x.substr(a, 6).toLowerCase() === "<style") {
                            for (b = a + 6; b < c; b += 1) {
                                if (x.charAt(b) + x.charAt(b + 1) + x.charAt(b + 2).toLowerCase() + x.charAt(b + 3).toLowerCase() + x.charAt(b + 4).toLowerCase() + x.charAt(b + 5).toLowerCase() + x.charAt(b + 6).toLowerCase() + x.charAt(b + 7) === "</style>") {
                                    //h counts the index of the future
                                    //build array
                                    if (/></.test(x.substr(a, b))) {
                                        h += 2;
                                    } else {
                                        h += 3;
                                    }
                                    a = b + 7;
                                    break;
                                }
                            }
                        } else if (x.substr(a, 5) === "<?php") {
                            for (b = a + 5; b < c; b += 1) {
                                if (x.charAt(b - 1) === "?" && x.charAt(b) === ">") {
                                    a = b;
                                    h += 1;
                                    break;
                                }
                            }
                        } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "%") {
                            for (b = a + 2; b < c; b += 1) {
                                if (x.charAt(b - 1) === "%" && x.charAt(b) === ">") {
                                    a = b;
                                    h += 1;
                                    break;
                                }
                            }
                        } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && x.charAt(a + 2) === "[") {
                            for (b = a + 2; b < c; b += 1) {
                                if (x.charAt(b - 1) === "]" && x.charAt(b) === ">") {
                                    a = b;
                                    h += 1;
                                    break;
                                }
                            }
                            //This section identifies SGML tags and the
                            //location of internally contained angle
                            //brackets.
                        } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && /[A-Z]|\[/.test(x.charAt(a + 2))) {
                            for (b = a + 3; b < c; b += 1) {
                                //This first condition identifies
                                //comments nested in SGML type compound
                                //tags, because these should allow
                                //literal expression of reserved
                                //characters since this is not impactful
                                if (x.charAt(b) === "<" && c > b + 3 && x.charAt(b + 1) === "!" && x.charAt(b + 2) === "-" && x.charAt(b + 3) === "-") {
                                    for (s = b + 4; s < c; s += 1) {
                                        if (x.charAt(s - 2) === "-" && x.charAt(s - 1) === "-" && x.charAt(s) === ">") {
                                            b = s;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(b) === ">" && q[q.length - 1] === ">" && q.length === 1) {
                                    h += 1;
                                    if (r) {
                                        d.push([
                                            a, b, h, a
                                        ]);
                                    }
                                    r = false;
                                    a = b;
                                    q = [">"];
                                    break;
                                } else if (x.charAt(b) === "<") {
                                    q.push(">");
                                    r = true;
                                } else if (x.charAt(b) === ">" && q.length > 1) {
                                    q.pop();
                                    r = true;
                                } else if (x.charAt(b) === "[") {
                                    q.push("]");
                                } else if (x.charAt(b) === "]") {
                                    q.pop();
                                } else if (x.charAt(b) === "\"") {
                                    if (q[q.length - 1] === "\"") {
                                        q.pop();
                                    } else {
                                        q.push("\"");
                                    }
                                } else if (x.charAt(b) === "'") {
                                    if (q[q.length - 1] === "'") {
                                        q.pop();
                                    } else {
                                        q.push("'");
                                    }
                                }
                            }
                            //Don't even bother with empty qutoes: "" or ''
                        } else if (x.charAt(a) === x.charAt(a + 1) && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                            a += 1;
                        } else if (x.charAt(a - 1) === "=" && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                            //This first bit with the "m" and "o"
                            //variables instructs the principle loop of
                            //innerset of ignore quote characters that
                            //fall outside of tags.
                            o = false;
                            for (m = a - 1; m > 0; m -= 1) {
                                if ((x.charAt(m) === "\"" && x.charAt(a) === "\"") || (x.charAt(m) === "'" && x.charAt(a) === "'") || x.charAt(m) === "<") {
                                    break;
                                } else if (x.charAt(m) === ">") {
                                    o = true;
                                    break;
                                }
                            }
                            if (!o) {
                                //n is reset to be used as a switch.
                                n = false;
                                for (b = a + 1; b < c; b += 1) {
                                    //Ignore closing quotes if they
                                    //reside inside a script, style,
                                    //ASP, or PHP block.
                                    if (x.substr(b, 7).toLowerCase() === "<script") {
                                        for (p = b + 7; p < c; p += 1) {
                                            if (x.charAt(p) + x.charAt(p + 1) + x.charAt(p + 2).toLowerCase() + x.charAt(p + 3).toLowerCase() + x.charAt(p + 4).toLowerCase() + x.charAt(p + 5).toLowerCase() + x.charAt(p + 6).toLowerCase() + x.charAt(p + 7).toLowerCase() + x.charAt(p + 8) === "</script>") {
                                                b = p + 8;
                                                break;
                                            }
                                        }
                                    } else if (x.substr(b, 6).toLowerCase() === "<style") {
                                        for (p = b + 6; p < c; p += 1) {
                                            if (x.charAt(p) + x.charAt(p + 1) + x.charAt(p + 2).toLowerCase() + x.charAt(p + 3).toLowerCase() + x.charAt(p + 4).toLowerCase() + x.charAt(p + 5).toLowerCase() + x.charAt(p + 6).toLowerCase() + x.charAt(p + 7) === "</style>") {
                                                b = p + 7;
                                                break;
                                            }
                                        }
                                    } else if (x.substr(b, 5) === "<?php") {
                                        for (p = b + 5; p < c; p += 1) {
                                            if (x.charAt(p - 1) === "?" && x.charAt(p) === ">") {
                                                b = p;
                                                break;
                                            }
                                        }
                                    } else if (x.charAt(b) === "<" && x.charAt(b + 1) === "%") {
                                        for (p = b + 5; p < c; p += 1) {
                                            if (x.charAt(p - 1) === "%" && x.charAt(p) === ">") {
                                                b = p;
                                                break;
                                            }
                                        }
                                    } else if (x.charAt(b) === ">" || x.charAt(b) === "<") {
                                        //There is no reason to push every
                                        //set of quotes into the "d" array
                                        //if those quotes do not contain
                                        //angle brackets.  This is a switch
                                        //to test for such.
                                        n = true;
                                    } else if ((x.charAt(b - 1) !== "\\" && ((x.charAt(a) === "\"" && x.charAt(b) === "\"") || (x.charAt(a) === "'" && x.charAt(b) === "'"))) || b === c - 1) {
                                        //The "l" variable is used as an
                                        //on/off switch to allow content,
                                        //but not sequentially.  Tags with
                                        //quotes following content with
                                        //quotes need to be decremented to
                                        //correct an inflated count
                                        if (k !== h && l === 1) {
                                            l = 0;
                                            h -= 1;
                                            k -= 1;
                                        } else if (k === h) {
                                            for (e = i + 1; e > a; e += 1) {
                                                if (!/\s/.test(x.charAt(e))) {
                                                    break;
                                                }
                                            }
                                            j = e;
                                            //This condition is for
                                            //nonsequential content pieces
                                            if (i < a && l !== 1) {
                                                l = 1;
                                                h += 1;
                                                k += 1;
                                            }
                                        }
                                        //a = index of opening quotes
                                        //    from a quote pair
                                        //b = index of closing quotes
                                        //    from a quote pair
                                        //h = tag and content count
                                        //j = the index where tag "h" starts
                                        if (n) {
                                            d.push([
                                                a, b, h, j
                                            ]);
                                        }
                                        a = b;
                                        break;
                                    }
                                }
                            }
                        } else if (x.charAt(a) === "<") {
                            //If a HTML/XML comment is encountered then skip
                            if (x.charAt(a + 1) === "!" && x.charAt(a + 2) === "-" && x.charAt(a + 3) === "-") {
                                for (b = a + 4; b < x.length; b += 1) {
                                    if (x.charAt(b) === "-" && x.charAt(b + 1) === "-" && x.charAt(b + 2) === ">") {
                                        break;
                                    }
                                }
                                h += 1;
                                a = b + 2;
                                //If not a HTML/XML comment increase the tag
                                //count
                            } else {
                                h += 1;
                                j = a;
                            }
                        } else if (x.charAt(a + 1) === "<" && x.charAt(a) !== ">") {
                            //Acount for content outside of tags
                            for (b = a; b > 0; b -= 1) {
                                if (!/\s/.test(x.charAt(b)) && x.charAt(b) !== ">") {
                                    h += 1;
                                    k += 1;
                                    j = a;
                                    break;
                                } else if (x.charAt(b) === ">") {
                                    if (h !== k) {
                                        k += 1;
                                        i = a;
                                    }
                                    break;
                                }
                            }
                            //Count for the closing of tags
                        } else if (x.charAt(a) === ">") {
                            k += 1;
                            i = a;
                        }
                    }
                    return d;
                }());
            (function markup_beauty__findNestedTags_replaceBraces() {
                var a = 0,
                    b = 0,
                    c = d.length,
                    e = 0,
                    f = 0,
                    g = 0,
                    h = 0,
                    i = 0,
                    j = 0,
                    k = 0,
                    y = x.split("");
                //Code hand off must occur between quote discovery and
                //tag count.  Hand off must allow for discovery to be
                //repacked into numbers relevant to postcomputation and
                //not to input.  This hand off produces the "inner"
                //array for consumption by the innerfix array.
                for (a = 0; a < c; a += 1) {
                    i = d[a][0] + 1;
                    f = d[a][1];
                    g = d[a][2];
                    j = d[a][3];
                    //This loop converts quotes angle brackets to square
                    //brackets and simultaneously builds out the "inner"
                    //arrry.  The inner array contains the reference
                    //locations of the converted angle brackets so the
                    //program can put the angle brackets back after
                    //JavaScript and CSS are beautified.
                    for (e = i; e < f; e += 1) {
                        //h is the character index of a converted angle
                        //bracket in a given tag
                        h = 0;
                        if (y[e] === "<") {
                            y[e] = "[";
                            for (b = e; b > j; b -= 1) {
                                h += 1;
                                if (/\s/.test(y[b])) {
                                    for (k = b - 1; k > j; k -= 1) {
                                        if (!/\s/.test(y[k])) {
                                            //This condition accounts
                                            //for white space
                                            //normalization around equal
                                            //characters that is
                                            //supplied by markupmin,
                                            //otherwise h is incremented
                                            //for runs of white space
                                            //characters prior to
                                            //accounting for
                                            //tokenization.
                                            if (y[k] !== "=") {
                                                h += 1;
                                            } else if (/\s/.test(y[k - 1])) {
                                                h -= 1;
                                            }
                                            b = k;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (/\s/.test(y[i])) {
                                h -= 1;
                            }
                            inner.push([
                                "<", h, g
                            ]);
                        } else if (y[e] === ">") {
                            y[e] = "]";
                            for (b = e; b > j; b -= 1) {
                                h += 1;
                                if (/\s/.test(y[b])) {
                                    for (k = b - 1; k > j; k -= 1) {
                                        if (!/\s/.test(y[k])) {
                                            if (y[k] !== "=") {
                                                h += 1;
                                            } else if (/\s/.test(y[k - 1])) {
                                                h -= 1;
                                            }
                                            b = k;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (/\s/.test(y[i])) {
                                h -= 1;
                            }
                            inner.push([
                                ">", h, g
                            ]);
                        }
                    }
                }
                //x must be joined back into a string so that it can
                //pass through the markupmin function.
                x = y.join("");
            }());
        }());
        //This function builds full tags and content into an array named
        //build and names the tag types or content into elements of a
        //separate array that I have named token.
        (function markup_beauty__createBuild() {
            var i = 0,
                j = 0,
                y = markupmin({
                    source: x,
                    comments: mmode,
                    presume_html: mhtml,
                    conditional: mcond
                }).split(""),
                a = "",
                //This function looks for the end of a designated tag
                //and then returns the entire tag as a single output.
                b = function markup_beauty__createBuild_endFinder(end) {
                    var a = [],
                        b = end.length,
                        c = end.split("").reverse(),
                        d = 0,
                        e = "",
                        f = true,
                        loop = y.length;
                    if (i > 0 && y[i - 1] === " ") {
                        e = " ";
                    }
                    for (i; i < loop; i += 1) {
                        a.push(y[i]);
                        if (end === "]>") {
                            if (y[i] === "[") {
                                f = false;
                            }
                            if (f && y[i] === ">") {
                                c = [">"];
                                b = 1;
                            }
                        }
                        if (a[a.length - 1] === c[0]) {
                            if (b === 1) {
                                return e + a.join("");
                            }
                            for (d = 0; d < b; d += 1) {
                                if (c[d] !== a[a.length - (d + 1)]) {
                                    break;
                                }
                            }
                            if (d === b) {
                                return e + a.join("");
                            }
                        }
                    }
                    return e + a.join("");
                },
                c = [],
                //This function builds content into isolated usable
                //content units.  This is for content only.
                cgather = function markup_beauty__createBuild_buildContent(z) {
                    var c = 0,
                        d = "",
                        e = 0,
                        q = "",
                        loop = y.length;
                    for (c = i; c < loop; c += 1) {
                        //Verifies if the end script tag is quoted
                        if (q === "" && (y[c - 1] !== "\\" || (c > 2 && y[c - 2] === "\\"))) {
                            if (y[c] === "/" && y[c + 1] && y[c + 1] === "/") {
                                q = "//";
                            } else if (y[c] === "/" && y[c + 1] && y[c + 1] === "*") {
                                q = "/*";
                            } else if (y[c] === "'" || y[c] === "\"" || y[c] === "/") {
                                //It is necessary to determine if a
                                //forward slash character is division or
                                //the opening of a regular expression.
                                //If division then ignore and move on.
                                //I am presuming division is only when
                                //the forward slash follows a closing
                                //container or word character.
                                if (y[c] === "/") {
                                    for (e = c - 1; e > 0; e -= 1) {
                                        if (!/\s/.test(y[e])) {
                                            break;
                                        }
                                    }
                                    if (y[e] === ")" || y[e] === "]" || y[e] === "}" || /\w/.test(y[e])) {
                                        q = "";
                                    } else {
                                        q = "/";
                                    }
                                } else {
                                    q = y[c];
                                }
                            }
                        } else if ((y[c - 1] !== "\\" || (c > 2 && y[c - 2] === "\\")) && ((q === "'" && y[c] === "'") || (q === "\"" && y[c] === "\"") || (q === "/" && y[c] === "/") || (q === "//" && (y[c] === "\n" || (y[c - 4] && y[c - 4] === "/" && y[c - 3] === "/" && y[c - 2] === "-" && y[c - 1] === "-" && y[c] === ">"))) || (q === "/*" && y[c - 1] === "*" && y[c] === "/"))) {
                            q = "";
                        }
                        if (((z === "script" && q === "") || z === "style") && y[c] === "<" && y[c + 1] === "/" && y[c + 2].toLowerCase() === "s") {
                            if (z === "script" && (y[c + 3].toLowerCase() === "c" && y[c + 4].toLowerCase() === "r" && y[c + 5].toLowerCase() === "i" && y[c + 6].toLowerCase() === "p" && y[c + 7].toLowerCase() === "t")) {
                                break;
                            } else if (z === "style" && (y[c + 3].toLowerCase() === "t" && y[c + 4].toLowerCase() === "y" && y[c + 5].toLowerCase() === "l" && y[c + 6].toLowerCase() === "e")) {
                                break;
                            }
                        } else if (z === "other" && y[c] === "<") {
                            break;
                        } else {
                            d = d + y[c];
                        }
                    }
                    i = c - 1;
                    if (mcont) {
                        if (d.charAt(0) === " " && d.charAt(d.length - 1) === " ") {
                            d = " text ";
                        } else if (d.charAt(0) === " ") {
                            d = " text";
                        } else if (d.charAt(d.length - 1) === " ") {
                            d = "text ";
                        } else {
                            d = "text";
                        }
                    }
                    return d;
                },
                loop = y.length;
            //This loop sorts markup code into various designated types.
            //The build array holds particular code while the token
            //array olds the designation for that code.  The argument
            //supplied to the "b" function is the syntax ending for a
            //given tag type.  I have designed these types but others
            //can be added:
            //   * SGML and XML tag comments
            //   * SSI Apache instructions
            //   * SGML declarations, such as the HTML Doctype
            //   * XML processing declarations
            //   * PHP tags - These tags must be opened with
            //         <?php and not <?.
            //   * SCRIPT tags for html
            //   * STYLE tags for html
            //   * ASP tags
            //   * ending tags of a tag pair
            //   * singelton tags, such as
            //         <br/>, <meta/>, <link/>
            //   * starting tags of a tag pair
            //
            //   !Tags starting with only <? are not considered, so by
            //default these are treated as a start tag.
            //Use the correct PHP tags!!!!
            //   !Singelton tags must end with "/>" or they will
            //also be regarded as start tags, with exception to the HTML
            //option.  This code is vocabulary independent and I will
            //not guess at best intentions.
            for (i = 0; i < loop; i += 1) {
                if (token[token.length - 1] === "T_script" && !(y[i] === "<" && y[i + 1] === "/" && y[i + 2].toLowerCase() === "s" && y[i + 3].toLowerCase() === "c" && y[i + 4].toLowerCase() === "r" && y[i + 5].toLowerCase() === "i" && y[i + 6].toLowerCase() === "p" && y[i + 7].toLowerCase() === "t")) {
                    build.push(cgather("script"));
                    token.push("T_content");
                } else if (token[token.length - 1] === "T_style" && !(y[i] === "<" && y[i + 1] === "/" && y[i + 2].toLowerCase() === "s" && y[i + 3].toLowerCase() === "t" && y[i + 4].toLowerCase() === "y" && y[i + 5].toLowerCase() === "l" && y[i + 6].toLowerCase() === "e")) {
                    build.push(cgather("style"));
                    token.push("T_content");
                } else if (y[i] === "<" && y[i + 1] === "!" && y[i + 2] === "-" && y[i + 3] === "-" && y[i + 4] !== "#" && token[token.length - 1] !== "T_style") {
                    build.push(b("-->"));
                    token.push("T_comment");
                } else if (y[i] === "<" && y[i + 1] === "%" && y[i + 2] === "-" && y[i + 3] === "-") {
                    build.push(b("--%>"));
                    token.push("T_comment");
                } else if (y[i] === "<" && y[i + 1] === "!" && y[i + 2] === "-" && y[i + 3] === "-" && y[i + 4] === "#") {
                    build.push(b("-->"));
                    token.push("T_ssi");
                } else if (y[i] === "<" && y[i + 1] === "!" && y[i + 2] !== "-") {
                    build.push(b("]>"));
                    token.push("T_sgml");
                } else if (y[i] === "<" && y[i + 1] === "?" && y[i + 2].toLowerCase() === "x" && y[i + 3].toLowerCase() === "m" && y[i + 4].toLowerCase() === "l") {
                    build.push(b("?>"));
                    token.push("T_xml");
                } else if (mhtml === true && y[i] === "<" && y[i + 1].toLowerCase() === "p" && y[i + 2].toLowerCase() === "r" && y[i + 3].toLowerCase() === "e") {
                    build.push(b("</pre>"));
                    token.push("T_pre");
                } else if (y[i] === "<" && y[i + 1] === "?" && y[i + 2].toLowerCase() === "p" && y[i + 3].toLowerCase() === "h" && y[i + 4].toLowerCase() === "p") {
                    build.push(b("?>"));
                    token.push("T_php");
                } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "c" && y[i + 3].toLowerCase() === "r" && y[i + 4].toLowerCase() === "i" && y[i + 5].toLowerCase() === "p" && y[i + 6].toLowerCase() === "t") {
                    j = i;
                    build.push(b(">"));
                    //contents of a script tag are JavaScript if value
                    //of type attribute is:
                    //* not present
                    //text/javascript
                    //application/javascript
                    //application/x-javascript
                    //text/ecmascript
                    //application/ecmascript
                    a = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                    if (a.indexOf(" type=\"syntaxhighlighter\"") !== -1) {
                        i = j;
                        build[build.length - 1] = b("</script>");
                        token.push("T_pre");
                    } else if (a.charAt(a.length - 2) === "/") {
                        token.push("T_singleton");
                    } else if (a.indexOf(" type=\"") === -1 || a.indexOf(" type=\"text/javascript\"") !== -1 || a.indexOf(" type=\"application/javascript\"") !== -1 || a.indexOf(" type=\"application/x-javascript\"") !== -1 || a.indexOf(" type=\"text/ecmascript\"") !== -1 || a.indexOf(" type=\"application/ecmascript\"") !== -1) {
                        token.push("T_script");
                    } else {
                        token.push("T_tag_start");
                    }
                } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "t" && y[i + 3].toLowerCase() === "y" && y[i + 4].toLowerCase() === "l" && y[i + 5].toLowerCase() === "e") {
                    build.push(b(">"));
                    //contents of a style tag are CSS if value of type
                    //attribute is:
                    //* not present
                    //text/css
                    a = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                    if (a.indexOf(" type=\"") === -1 || a.indexOf(" type=\"text/css\"") !== -1) {
                        token.push("T_style");
                    } else {
                        token.push("T_tag_start");
                    }
                } else if (y[i] === "<" && y[i + 1] === "%") {
                    build.push(b("%>"));
                    token.push("T_asp");
                } else if (y[i] === "<" && y[i + 1] === "/") {
                    build.push(b(">"));
                    token.push("T_tag_end");
                } else if (y[i] === "<" && token[token.length - 1] !== "T_script" && token[token.length - 1] !== "T_style" && (y[i + 1] !== "!" || y[i + 1] !== "?" || y[i + 1] !== "/" || y[i + 1] !== "%")) {
                    for (c = i; c < loop; c += 1) {
                        if (y[c] !== "?" && y[c] !== "%") {
                            if (y[c] === "/" && y[c + 1] === ">") {
                                build.push(b("/>"));
                                token.push("T_singleton");
                                break;
                            } else if (y[c + 1] === ">") {
                                build.push(b(">"));
                                token.push("T_tag_start");
                                break;
                            }
                        }
                    }
                } else if (y[i - 1] === ">" && (y[i] !== "<" || (y[i] !== " " && y[i + 1] !== "<"))) {
                    if (token[token.length - 1] === "T_script") {
                        build.push(cgather("script"));
                        token.push("T_content");
                    } else if (token[token.length - 1] === "T_style") {
                        build.push(cgather("style"));
                        token.push("T_content");
                    } else if (y[i - 1] + y[i] + y[i + 1] !== "> <") {
                        build.push(cgather("other"));
                        token.push("T_content");
                    }
                }
            }
        }());
        //This function provides structual relevant descriptions for
        //content and groups tags into categories.
        (function markup_beauty__createCinfo() {
            var i = 0,
                Z = token.length;
            for (i = 0; i < Z; i += 1) {
                build[i] = build[i].replace(/\s*prettydiffcdatas/g, "<").replace(/\s*prettydiffcdatae/g, ">");
                if (token[i] === "T_sgml" || token[i] === "T_xml") {
                    cinfo.push("parse");
                } else if (token[i] === "T_asp" || token[i] === "T_php" || token[i] === "T_ssi" || token[i] === "T_pre") {
                    cinfo.push("singleton");
                } else if (token[i] === "T_comment") {
                    cinfo.push("comment");
                } else if ((token[i] === "T_content" && build[i] !== " ") && token[i - 1] === "T_script") {
                    cinfo.push("external");
                } else if (token[i] === "T_content" && token[i - 1] === "T_style") {
                    cinfo.push("external");
                } else if (token[i] === "T_content" && build[i].charAt(0) === " " && build[i].charAt(build[i].length - 1) === " ") {
                    cinfo.push("mixed_both");
                } else if (token[i] === "T_content" && build[i].charAt(0) === " " && build[i].charAt(build[i].length - 1) !== " ") {
                    cinfo.push("mixed_start");
                } else if (token[i] === "T_content" && build[i].charAt(0) !== " " && build[i].charAt(build[i].length - 1) === " ") {
                    cinfo.push("mixed_end");
                } else if (token[i] === "T_content") {
                    cinfo.push("content");
                } else if (token[i] === "T_tag_start") {
                    cinfo.push("start");
                } else if (token[i] === "T_style") {
                    build[i] = build[i].replace(/\s+/g, " ");
                    cinfo.push("start");
                } else if (token[i] === "T_script") {
                    build[i] = build[i].replace(/\s+/g, " ");
                    cinfo.push("start");
                } else if (token[i] === "T_singleton") {
                    cinfo.push("singleton");
                } else if (token[i] === "T_tag_end") {
                    cinfo.push("end");
                }
            }
            //summary is a replica of the build array prior to any
            //beautification for use in the markup_summary function
            sum = [].concat(build);
        }());
        //this function cheats the structure and looks at tag names
        (function markup_beauty__htmlCheat() {
            var a = 0,
                b = "",
                i = 0,
                loop = 0;
            if (mhtml === false) {
                return;
            }
            loop = cinfo.length;
            for (i = 0; i < loop; i += 1) {
                if (cinfo[i] === "start") {
                    a = build[i].indexOf(" ");
                    if (build[i].length === 3) {
                        b = build[i].charAt(1).toLowerCase();
                    } else if (a === -1) {
                        b = build[i].slice(1, build[i].length - 1).toLowerCase();
                    } else if (a === 0) {
                        b = build[i].slice(1, build[i].length);
                        a = b.indexOf(" ");
                        b = b.slice(1, a).toLowerCase();
                    } else {
                        b = build[i].slice(1, a).toLowerCase();
                    }
                    if (b === "area" || b === "base" || b === "basefont" || b === "br" || b === "col" || b === "embed" || b === "eventsource" || b === "frame" || b === "hr" || b === "img" || b === "input" || b === "keygen" || b === "link" || b === "meta" || b === "param" || b === "progress" || b === "source" || b === "wbr") {
                        cinfo[i] = "singleton";
                        token[i] = "T_singleton";
                    }
                }
            }
        }());
        //This function sets the tab levels for the code.  It is set to
        //use the cinfo array definitions but could be rewritten to use
        //the token array.
        (function markup_beauty__algorithm() {
            var i = 0,
                //This function looks back to the most previous indented
                //tag that is not an end tag and returns a count based
                //upon the number between the current tag and this
                //previous indented tag.  If the argument has a value of
                //"start" then indentation is increased by 1.
                c = function markup_beauty__algorithm_commonStart(x) {
                    var k = 0,
                        m = 0;
                    if (x === "start") {
                        m += 1;
                    }
                    for (k = i - 1; k > -1; k -= 1) {
                        if (cinfo[k] === "start" && level[k] === "x") {
                            m += 1;
                        } else if (cinfo[k] === "end") {
                            m -= 1;
                        } else if (cinfo[k] === "start" && level[k] !== "x") {
                            return level.push(level[k] + m);
                        }
                        if (k === 0) {
                            if (cinfo[k] !== "start") {
                                return level.push(0);
                            }
                            if (cinfo[i] === "mixed_start" || cinfo[i] === "content" || (cinfo[i] === "singleton" && build[i].charAt(0) !== " ")) {
                                return level.push("x");
                            }
                            return level.push(1);
                        }
                    }
                },
                //This function is used by end tags to determine
                //indentation.
                e = function markup_beauty__algorithm_end() {
                    var z = function markup_beauty__algorithm_end_xTester(y) {
                            for (y; y > 0; y -= 1) {
                                if (level[y] !== "x") {
                                    return level.push(level[y] + 1);
                                }
                            }
                        },
                        //If prior item is an end tag or content ending
                        //with space black box voodoo magic must occur.
                        w = function markup_beauty__algorithm_end_computation() {
                            var k = 0,
                                q = false,
                                //This function finds the prior
                                //existing indented start tag.  This
                                //start tag may not be the current
                                //end tag's matching pair.  If the
                                //tag prior to this indented start
                                //tag is not an end tag this
                                //function escapes and later logic
                                //is used.
                                u = function markup_beauty__algorithm_end_computation_primary() {
                                    //t() is executed if the prior
                                    //indented start tag exists
                                    //directly after an end tag.
                                    //This function is necessary to
                                    //determine if indentation must
                                    //be subtracted from the prior
                                    //indented start tag.
                                    var y = 0,
                                        t = function markup_beauty__algorithm_end_computation_primary_vooDoo() {
                                            var k = 0,
                                                s = 0,
                                                l = 0;
                                            //Finds the prior start
                                            //tag followed by a
                                            //start tag where both
                                            //have indentation.
                                            //This creates a frame
                                            //of reference for
                                            //performing reflexive
                                            //calculation.
                                            for (s = i - 1; s > 0; s -= 1) {
                                                if ((cinfo[s] === "start" && cinfo[s + 1] === "start" && level[s] === level[s + 1] - 1) || (cinfo[s] === "start" && cinfo[s - 1] !== "start" && level[s] === level[s - 1])) {
                                                    break;
                                                }
                                            }
                                            //Incrementor is
                                            //increased if indented
                                            //content found followed
                                            //by unindented end tag
                                            //by looping up from the
                                            //frame of reference.
                                            for (k = s + 1; k < i; k += 1) {
                                                if (cinfo[k] === "mixed_start" && cinfo[k + 1] === "end") {
                                                    l += 1;
                                                }
                                            }
                                            //If prior logic fails
                                            //and frame of reference
                                            //follows an indented
                                            //end tag the
                                            //incrementor is
                                            //increased.
                                            if (cinfo[s - 1] === "end" && level[s - 1] !== "x" && l === 0) {
                                                l += 1;
                                            }
                                            //All prior logic can
                                            //fail and so a
                                            //redundant check was
                                            //added.
                                            if (l !== 0) {
                                                if (level[i - 1] === "x") {
                                                    return l - 1;
                                                }
                                                return l;
                                            }
                                            for (s; s < i; s += 1) {
                                                if (cinfo[s] === "start") {
                                                    l += 1;
                                                } else if (cinfo[s] === "end") {
                                                    l -= 1;
                                                }
                                            }
                                            return l;
                                        };
                                    for (y = i - 1; y > 0; y -= 1) {
                                        if (cinfo[y] !== "mixed_end" || (cinfo[y] === "start" && level[y] !== "x")) {
                                            if (cinfo[y - 1] === "end") {
                                                q = true;
                                                if (cinfo[i - 1] === "mixed_both" && level[i - 1] === level[y] - t()) {
                                                    return level.push(level[y] - (t() + 1));
                                                }
                                                if (cinfo[i - 2] === "start" && (cinfo[i - 1] === "mixed_end" || cinfo[i - 1] === "mixed_both")) {
                                                    return level.push(level[y]);
                                                }
                                                if (level[y] !== "x") {
                                                    if (cinfo[y] === "mixed_both" && y !== i - t()) {
                                                        if (y === i - 1) {
                                                            return level.push(level[y] - 1);
                                                        }
                                                        return level.push(level[y] + t());
                                                    }
                                                    if (cinfo[i - 1] === "mixed_end" && t() === 0) {
                                                        return level.push(level[y] - 1);
                                                    }
                                                    if (level[i - 1] === "x" && (cinfo[i - 2] !== "end" || (cinfo[i - 2] === "end" && level[i - 2] !== "x"))) {
                                                        return level.push(level[y] + t());
                                                    }
                                                    return level.push(level[y] - t());
                                                }
                                            } else {
                                                q = false;
                                                return;
                                            }
                                        }
                                    }
                                },
                                //This seeks to find a frame of
                                //reference by looking for the first
                                //start tag outside a counted pair
                                //not counting the current end tag.
                                r = function markup_beauty__algorithm_end_computation_resultant() {
                                    var l = 0,
                                        k = 0;
                                    for (k = i; k > 0; k -= 1) {
                                        if (cinfo[k] === "end") {
                                            l += 1;
                                        } else if (cinfo[k] === "start") {
                                            l -= 1;
                                        }
                                        if (l === 0) {
                                            return k;
                                        }
                                    }
                                };
                            //If the prior two elements are an empty
                            //pair.
                            if (cinfo[i - 1] === "end" && level[i - 1] !== "x") {
                                if (cinfo[i - 2] === "start" && level[i - 2] === "x") {
                                    for (k = i - 2; k > 0; k -= 1) {
                                        if (level[k] !== "x") {
                                            break;
                                        }
                                    }
                                    if (cinfo[k] === "start") {
                                        return c("end");
                                    }
                                    return level.push(level[k] - 1);
                                }
                                if (cinfo[i - 2] === "start" && level[i - 2] !== "x") {
                                    return level.push(level[i - 2] - 1);
                                }
                                return level.push(level[i - 1] - 1);
                                //If the prior two elements are not
                                //an empty pair voodoo magic must
                                //occur.
                            }
                            //u() makes a context decision based
                            //upon the placement of the current
                            //end tag relevant to the prior
                            //indented start tag.
                            u();
                            if (q) {
                                return;
                            }
                            return (function markup_beauty__end_computation_whenAllElseFails() {
                                var y = 0,
                                    q = 0;
                                for (q = r(); q > 0; q -= 1) {
                                    if (cinfo[q] === "start") {
                                        y += 1;
                                    } else if (cinfo[q] === "end") {
                                        y -= 1;
                                    }
                                    if (level[q] !== "x") {
                                        if (cinfo[q] === "end" && cinfo[q - 1] === "start" && level[q - 1] !== "x") {
                                            return level.push(level[q]);
                                        }
                                        if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_end" && (cinfo[i - 2] !== "end" || level[i - 2] !== "x") && (cinfo[i - 3] !== "end" || level[i - 3] !== "x")) {
                                            return level.push("x");
                                        }
                                        return level.push(level[q] + (y - 1));
                                    }
                                }
                                y = 0;
                                for (q = i; q > -1; q -= 1) {
                                    if (cinfo[q] === "start") {
                                        y += 1;
                                    } else if (cinfo[q] === "end") {
                                        y -= 1;
                                    }
                                }
                                return level.push(y);
                            }());
                        };
                    if (cinfo[i - 1] === "end" || cinfo[i - 1] === "mixed_both" || cinfo[i - 1] === "mixed_end") {
                        return w();
                    }
                    if (cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content") {
                        return level.push("x");
                    }
                    if (cinfo[i - 1] === "external") {
                        return (function markup_beauty__algorithm_end_external() {
                            var a = 0,
                                yy = -1;
                            for (a = i - 2; a > 0; a -= 1) {
                                if (cinfo[a] === "start") {
                                    yy += 1;
                                } else if (cinfo[a] === "end") {
                                    yy -= 1;
                                }
                                if (level[a] !== "x") {
                                    break;
                                }
                            }
                            if (cinfo[a] === "end") {
                                yy += 1;
                            }
                            return level.push(level[a] + yy);
                        }());
                    }
                    if (build[i].charAt(0) !== " ") {
                        if (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content") {
                            return level.push("x");
                        }
                        return (function markup_beauty__algorithm_end_singletonContent() {
                            var a = 0,
                                yy = 0;
                            for (a = i - 1; a > 0; a -= 1) {
                                //Find the previous indention and if not
                                //a start
                                if (cinfo[a] === "singleton" && level[a] === "x" && ((cinfo[a - 1] === "singleton" && level[a - 1] !== "x") || cinfo[a - 1] !== "singleton")) {
                                    yy += 1;
                                }
                                if (level[a] !== 0 && level[a] !== "x" && cinfo[i - 1] !== "start") {
                                    if (cinfo[a] === "mixed_both" || cinfo[a] === "mixed_start") {
                                        return level.push(level[a] - yy);
                                    }
                                    if (level[a] === yy || (cinfo[a] === "singleton" && (cinfo[a - 1] === "content" || cinfo[a - 1] === "mixed_start"))) {
                                        return level.push(level[a]);
                                    }
                                    return level.push(level[a] - 1);
                                    //Find the previous start that is
                                    //not indented
                                }
                                if (cinfo[a] === "start" && level[a] === "x") {
                                    return z(a);
                                    //If the previous tag is an indented
                                    //start
                                }
                                if (cinfo[i - 1] === "start") {
                                    return level.push(level[a]);
                                }
                            }
                            return level.push(0);
                        }());
                    }
                    return c("end");
                },
                //This function is used by cinfo values of "start" and
                //"singleton" through the "g" function.
                f = function markup_beauty__algorithm_start(z) {
                    //The n() function is only a container.  It sets the
                    //values of k, l, m.  If not a comment k = i - 1,
                    //and if not a comment l = k - i, and if not a
                    //comment m = l - 1.
                    var k = 0,
                        l = 0,
                        m = 0,
                        //This is executed if the prior non-comment
                        //item is not any form of content and is
                        //indented.
                        p = function markup_beauty__algorithm_start_complexity() {
                            var j = 0,
                                v = 1,
                                u = -1;
                            for (j = k; j > 0; j -= 1) {
                                if (cinfo[j] === "start") {
                                    u -= 1;
                                    if (level[j] === "x") {
                                        v += 1;
                                    }
                                } else if (cinfo[j] === "end") {
                                    u += 1;
                                    v -= 1;
                                }
                                if (level[j] === 0) {
                                    k = 0;
                                    for (l = i - 1; l > j; l -= 1) {
                                        if (cinfo[l] === "start") {
                                            k += 1;
                                        } else if (cinfo[l] === "end") {
                                            k -= 1;
                                        }
                                    }
                                    if (k > 0) {
                                        if (level[j + 1] === "x") {
                                            return level.push((u * -1) - 1);
                                        }
                                        if (cinfo[j] !== "external" && (mcomm !== "noindent" || (mcomm === "noindent" && cinfo[j] !== "comment"))) {
                                            return level.push((u + 1) * -1);
                                        }
                                    } else {
                                        for (k = i - 1; k > 0; k -= 1) {
                                            if (level[k] !== "x") {
                                                return level.push(level[k]);
                                            }
                                        }
                                    }
                                }
                                if (level[j] !== "x" && level[i - 1] !== "x") {
                                    if (cinfo[j] === "start" || cinfo[j] === "end") {
                                        return level.push(level[j] + v);
                                    }
                                    return level.push(level[j] + v - 1);
                                }
                                if (u === -1 && level[j] === "x") {
                                    break;
                                } else if (u === 1 && level[j] !== "x" && cinfo[j] !== "mixed_start" && cinfo[j] !== "content") {
                                    if (cinfo[j - 1] === "mixed_end" || (level[i - 1] === "x" && cinfo[i - 1] === "end" && cinfo[j] !== "end")) {
                                        return level.push(level[j] - u - 1);
                                    }
                                    return level.push(level[j] - u);
                                }
                                if (u === 0 && level[j] !== "x") {
                                    return c("start");
                                }
                            }
                            return c("start");
                        };
                    (function markup_beauty__algorithm_start_referrenceFinder() {
                        var j = 0;
                        if (z === 1) {
                            k = 0;
                            l = 0;
                            m = 0;
                        } else {
                            for (j = z - 1; j > 0; j -= 1) {
                                if (cinfo[j] !== "comment") {
                                    k = j;
                                    break;
                                }
                            }
                            if (k === 1) {
                                l = 0;
                                m = 0;
                            } else {
                                for (j = k - 1; j > 0; j -= 1) {
                                    if (cinfo[j] !== "comment") {
                                        l = j;
                                        break;
                                    }
                                }
                                if (l === 1) {
                                    m = 0;
                                } else {
                                    for (j = l - 1; j > 0; j -= 1) {
                                        if (cinfo[j] !== "comment") {
                                            m = j;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }());
                    //A one time fail safe to prevent a referential
                    //anomoly.
                    if (i - 1 === 0 && cinfo[0] === "start") {
                        return level.push(1);
                    }
                    //For a tag to become void of whitespace cushioning.
                    if (cinfo[k] === "mixed_start" || cinfo[k] === "content" || cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i] === "singleton" && (cinfo[i - 1] === "start" || cinfo[i - 1] === "singleton" || cinfo[i - 1] === "end") && build[i].charAt(0) !== " ")) {
                        return level.push("x");
                    }
                    //Simple regular tabbing
                    if ((cinfo[i - 1] === "comment" && level[i - 1] === 0) || ((cinfo[m] === "mixed_start" || cinfo[m] === "content") && cinfo[l] === "end" && (cinfo[k] === "mixed_end" || cinfo[k] === "mixed_both"))) {
                        return c("start");
                    }
                    //if the prior item is an indented comment then go
                    //with it
                    if (cinfo[i - 1] === "comment" && level[i - 1] !== "x") {
                        return level.push(level[i - 1]);
                    }
                    if ((cinfo[k] === "start" && level[k] === "x") || (cinfo[k] !== "mixed_end" && cinfo[k] !== "mixed_both" && level[k] === "x")) {
                        if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "start" && build[i - 1].charAt(build[i - 1].length - 1) !== " ") {
                            if ((cinfo[i - 1] === "end" && cinfo[i - 2] === "end") || (cinfo[i - 1] === "end" && cinfo[i] !== "end" && cinfo[i + 1] !== "mixed_start" && cinfo[i + 1] !== "content")) {
                                return c("start");
                            }
                            return level.push("x");
                        }
                        return p();
                    }
                    if (cinfo[k] === "end" && level[k] !== "x" && (cinfo[k - 1] !== "start" || (cinfo[k - 1] === "start" && level[k - 1] !== "x"))) {
                        if (level[k] < 0) {
                            return c("start");
                        }
                        return level.push(level[k]);
                    }
                    if (cinfo[m] !== "mixed_start" && cinfo[m] !== "content" && (cinfo[k] === "mixed_end" || cinfo[k] === "mixed_both")) {
                        return (function markup_beauty__algorithm_start_notContentNotMixedstart() {
                            var a = 0,
                                l = 0,
                                p = 0,
                                m = 0;
                            for (a = k; a > 0; a -= 1) {
                                if (cinfo[a] === "end") {
                                    l += 1;
                                }
                                if (cinfo[a] === "start") {
                                    p += 1;
                                }
                                if (level[a] === 0 && a !== 0) {
                                    m = a;
                                }
                                if (cinfo[k] === "mixed_both" && level[a] !== "x") {
                                    return level.push(level[a]);
                                }
                                if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end" && level[a] !== "x") {
                                    if (cinfo[a] === "start" && level[a] !== "x") {
                                        if (cinfo[i - 1] !== "end") {
                                            return level.push(level[a] + (p - l));
                                        }
                                        if ((level[a] === level[a - 1] && cinfo[a - 1] !== "end" && level[a + 1] !== "x") || (cinfo[i - 2] === "start" && level[i - 2] !== "x" && level[i - 1] === "x")) {
                                            return level.push(level[a] + 1);
                                        }
                                        if (p <= 1) {
                                            return level.push(level[a]);
                                        }
                                    } else if (l > 0) {
                                        if (p > 1) {
                                            if (m !== 0) {
                                                return c("start");
                                            }
                                            return level.push(level[a] + 1);
                                        }
                                        return level.push(level[a] - l + 1);
                                    }
                                    return level.push(level[a] + p);
                                }
                            }
                            return c("start");
                        }());
                    }
                    if (cinfo[k] === "start" && level[k] !== "x") {
                        //This looks for the most previous level
                        //that is not set for the noted cinfo
                        //values.  Once that value is found it is
                        //increased plus 1 and added to the level
                        //array.
                        return (function markup_beauty__algorithm_start_referenceKStartNotX() {
                            var a = 0;
                            for (a = i - 1; a > -1; a -= 1) {
                                if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end") {
                                    if (cinfo[i + 1] && build[i].charAt(0) !== " " && (cinfo[i + 1] === "mixed_end" || cinfo[i + 1] === "content" || (build[i + 1].charAt(0) !== " " && cinfo[i + 1] === "singleton"))) {
                                        return level.push("x");
                                    }
                                    return level.push(level[a] + 1);
                                }
                            }
                            return level.push(0);
                        }());
                    }
                    if (build[i].charAt(0) !== " " && (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content" || cinfo[i - 1] === "mixed_start")) {
                        return level.push("x");
                    }
                    return c("start");
                },
                //This merely verifies if a singleton element is used as
                //content.
                h = function markup_beauty__algorithm_initialTest() {
                    var z = 0;
                    if (cinfo[i] !== "start" && level[i - 1] === "x" && cinfo[i - 1] !== "content" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_start" && cinfo[i - 1] !== "mixed_end") {
                        return level.push("x");
                    }
                    if (cinfo[i] !== "start" && build[i] === " ") {
                        build[i] = "";
                        return level.push("x");
                    }
                    //This section corrects a calculation malfunction
                    //that only occurs to start type elements if they
                    //occur directly prior to a comment.  This function
                    //is executed
                    //through h().
                    if (cinfo[i - 1] !== "comment") {
                        f(i);
                    } else {
                        for (z = i - 1; z > 0; z -= 1) {
                            if (cinfo[z] !== "comment") {
                                break;
                            }
                        }
                        f(z + 1);
                    }
                };
            //This function undoes all the changes made for compound
            //tags, such like JSP tags.
            (function markup_beauty__algorithm_innerFix() {
                var a = 0,
                    b = "",
                    c = 0,
                    d = 0,
                    e = inner.length,
                    f = [];
                for (a = 0; a < e; a += 1) {
                    b = inner[a][0];
                    c = inner[a][1];
                    d = inner[a][2];
                    if (typeof build[d] === "string") {
                        if (build[d].charAt(0) === " ") {
                            c += 1;
                        }
                        f = build[d].split("");
                        if (b === "<" && f[c] === "[") {
                            f[c] = "<";
                        } else if (b === ">" && f[c] === "]") {
                            f[c] = ">";
                        }
                        build[d] = f.join("");
                    }
                }
            }());
            //This logic only serves to assign the previously defined
            //subfunctions to each of the cinfo values.
            (function markup_beauty__algorithm_loop() {
                var test = false,
                    test1 = false,
                    svg = false,
                    cdata = [],
                    cdata1 = [],
                    cdataStart = (/^(\s*\/*<\!\[+[A-Z]+\[+)/),
                    cdataEnd = (/(\/*\]+>\s*)$/),
                    scriptStart = (/^(\s*<\!\-\-)/),
                    scriptEnd = (/(\-\->\s*)$/),
                    loop = cinfo.length,
                    disqualify = (mhtml === true) ? (/^(\s?<((pre)|(script)))/) : (/^(\s?<script)/),
                    //attrib sorts attributes in start and singleton
                    //tags, but it must not execute before the inner
                    //array is consumed as in the function immediately
                    //prior
                    attrib = function markup_beauty__algorithm_loop_attributeOrder(tag, end) {
                        var a = [],
                            b = 0,
                            c = 0,
                            d = "",
                            e = tag.indexOf(" ") + 1,
                            f = 0,
                            g = "",
                            h = 0,
                            space = (tag.charAt(0) === " ") ? true : false,
                            //svg attributes receive special treatment
                            //because their values can be extremely long
                            joinchar = (svg === true) ? "\n" + (function markup_beauty__apply_tab() {
                                var a = 0,
                                    b = msize,
                                    c = mchar,
                                    d = [],
                                    tab = "";
                                for (a = 0; a < b; a += 1) {
                                    d.push(c);
                                }
                                tab = d.join("");
                                b = level[i];
                                d = [];
                                for (a = 0; a < b; a += 1) {
                                    d.push(tab);
                                }
                                return d.join("") + tab;
                            }()) : " ";
                        if (space) {
                            tag = tag.substr(1);
                            e = tag.indexOf(" ") + 1;
                        }
                        g = tag.substring(0, e);
                        tag = tag.substring(e, tag.length - end.length) + " ";
                        b = tag.length;
                        for (c = 0; c < b; c += 1) {
                            if (d === "") {
                                if (tag.charAt(c) === "\"") {
                                    d = "\"";
                                } else if (tag.charAt(c) === "'") {
                                    d = "'";
                                } else if (tag.charAt(c) === "[") {
                                    d = "[";
                                    h = 1;
                                } else if (tag.charAt(c) === "{") {
                                    d = "{";
                                    h = 1;
                                } else if (tag.charAt(c) === "(") {
                                    d = "(";
                                    h = 1;
                                } else if (tag.charAt(c) === " " && h === 0) {
                                    a.push(tag.substring(f, c));
                                    f = c + 1;
                                }
                            } else if (d === "\"" && tag.charAt(c) === "\"") {
                                d = "";
                            } else if (d === "'" && tag.charAt(c) === "'") {
                                d = "";
                            } else if (d === "[") {
                                if (tag.charAt(c) === "]") {
                                    h -= 1;
                                    if (h === 0) {
                                        d = "";
                                    }
                                } else if (tag.charAt(c) === "[") {
                                    h += 1;
                                }
                            } else if (d === "{") {
                                if (tag.charAt(c) === "}") {
                                    h -= 1;
                                    if (h === 0) {
                                        d = "";
                                    }
                                } else if (tag.charAt(c) === "{") {
                                    h += 1;
                                }
                            } else if (d === "(") {
                                if (tag.charAt(c) === ")") {
                                    h -= 1;
                                    if (h === 0) {
                                        d = "";
                                    }
                                } else if (tag.charAt(c) === "(") {
                                    h += 1;
                                }
                            }
                        }
                        if (space) {
                            return " " + g + a.sort().join(joinchar) + end;
                        }
                        return g + a.sort().join(joinchar) + end;
                    };
                for (i = 0; i < loop; i += 1) {
                    test = false;
                    test1 = false;
                    cdata = [""];
                    cdata1 = [""];
                    if (build[i].indexOf("<svg") === 0 || build[i].indexOf(" <svg") === 0) {
                        svg = true;
                    } else if (build[i] === "</svg>" || build[i] === " </svg>") {
                        svg = false;
                    }
                    if (i === 0) {
                        level.push(0);
                    } else if (mforce) {
                        if (cinfo[i] === "end") {
                            if (cinfo[i - 1] === "start") {
                                level.push(level[i - 1]);
                            } else {
                                level.push(level[i - 1] - 1);
                            }
                        } else {
                            if (cinfo[i - 1] === "start") {
                                level.push(level[i - 1] + 1);
                            } else {
                                level.push(level[i - 1]);
                            }
                            if (cinfo[i] === "mixed_end") {
                                build[i] = build[i].slice(0, build[i].length - 1);
                            }
                        }
                    } else if (cinfo[i] === "external") {
                        if (/\s*<\!\-\-\s*\-\->\s*/.test(build[i])) {
                            //If the contents are of a script or
                            //style tag are only a single HTML
                            //comment then lets treat it as a
                            //comment
                            if (build[i].charAt(0) === " ") {
                                build[i] = build[i].substr(1);
                            }
                            if (build[i].charAt(build[i].length - 1) === " ") {
                                build[i] = build[i].substr(0, build[i].length - 1);
                            }
                            cinfo[i] = "comment";
                            token[i] = "T_comment";
                            if (mcomm !== "noindent") {
                                h();
                            } else {
                                level.push(0);
                            }
                        } else if (token[i - 1] === "T_script") {
                            //If script begins with an HTML
                            //comment then the comment must be
                            //removed, and returned.  Starting
                            //script with a HTML comment can
                            //confuse markupmin, so it has to be
                            //temporarily removed.  This logic
                            //is repeated for CSS styles. CDATA
                            //blocks are also removed because
                            //they are line comments in
                            //JavaScript and may harm CSS
                            level.push(0);
                            if (scriptStart.test(build[i])) {
                                test = true;
                                build[i] = build[i].replace(scriptStart, "");
                            } else if (cdataStart.test(build[i])) {
                                cdata = cdataStart.exec(build[i]);
                                build[i] = build[i].replace(cdataStart, "");
                            }
                            if (scriptEnd.test(build[i]) && !/(\/\/\-\->\s*)$/.test(build[i])) {
                                test1 = true;
                                build[i] = build[i].replace(scriptEnd, "");
                            } else if (cdataEnd.test(build[i])) {
                                cdata1 = cdataEnd.exec(build[i]);
                                build[i] = build[i].replace(cdataEnd, "");
                            }
                            if (typeof jspretty === "function") {
                                build[i] = jspretty({
                                    source: build[i],
                                    insize: msize,
                                    inchar: mchar,
                                    preserve: true,
                                    inlevel: 0,
                                    space: true,
                                    braces: args.indent,
                                    comments: mcomm
                                });
                            }
                            if (test) {
                                build[i] = "<!--\n" + build[i];
                            } else if (cdata[0] !== "") {
                                build[i] = cdata[0] + "\n" + build[i];
                            }
                            if (test1) {
                                build[i] = build[i] + "\n-->";
                            } else if (cdata1[0] !== "") {
                                build[i] = build[i] + "\n" + cdata1[0];
                            }
                            build[i] = build[i].replace(/(\/\/(\s)+\-\->(\s)*)$/, "//-->").replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                        } else if (token[i - 1] === "T_style") {
                            level.push(0);
                            if (scriptStart.test(build[i])) {
                                test = true;
                                build[i] = build[i].replace(scriptStart, "");
                            } else if (cdataStart.test(build[i])) {
                                cdata = cdataStart.exec(build[i]);
                                build[i] = build[i].replace(cdataStart, "");
                            }
                            if (scriptEnd.test(build[i]) && !/(\/\/\-\->\s*)$/.test(build[i])) {
                                test1 = true;
                                build[i].replace(scriptEnd, "");
                            } else if (cdataEnd.test(build[i])) {
                                cdata1 = cdataEnd.exec(build[i]);
                                build[i] = build[i].replace(cdataEnd, "");
                            }
                            if (typeof cleanCSS === "function") {
                                build[i] = cleanCSS({
                                    source: build[i],
                                    size: msize,
                                    character: mchar,
                                    comment: mcomm,
                                    alter: true
                                });
                            }
                            if (test) {
                                build[i] = "<!--\n" + build[i];
                            } else if (cdata[0] !== "") {
                                build[i] = cdata[0] + "\n" + build[i];
                            }
                            if (test1) {
                                build[i] = build[i] + "\n-->";
                            } else if (cdata1[0] !== "") {
                                build[i] = build[i] + "\n" + cdata1[0];
                            }
                            build[i] = build[i].replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                        }
                    } else {
                        if (cinfo[i] === "comment" && mcomm !== "noindent") {
                            if (build[i].charAt(0) === " ") {
                                h();
                            } else {
                                level.push("x");
                            }
                        } else if (cinfo[i] === "comment" && mcomm === "noindent") {
                            level.push(0);
                        } else if (cinfo[i] === "content") {
                            level.push("x");
                        } else if (cinfo[i] === "parse") {
                            h();
                        } else if (cinfo[i] === "mixed_both") {
                            //The next line merely removes the
                            //space at front and back
                            h();
                        } else if (cinfo[i] === "mixed_start") {
                            //The next line removes space at the
                            //front
                            h();
                        } else if (cinfo[i] === "mixed_end") {
                            //The next line removes the space at
                            //the end
                            build[i] = build[i].slice(0, build[i].length - 1);
                            level.push("x");
                        } else if (cinfo[i] === "start") {
                            h();
                        } else if (cinfo[i] === "end") {
                            e();
                        } else if (cinfo[i] === "singleton") {
                            if (svg === true) {
                                if (cinfo[i - 1] === "start") {
                                    level.push(level[i - 1] + 1);
                                } else {
                                    level.push(level[i - 1]);
                                }
                            } else {
                                h();
                            }
                        }
                    }
                    if ((cinfo[i] === "start" || cinfo[i] === "singleton") && token[i] !== "T_asp" && token[i] !== "T_php" && token[i] !== "T_ssi" && disqualify.test(build[i]) === false && build[i].substr(1).indexOf(" ") > 1) {
                        if (build[i].lastIndexOf("/>") === build[i].length - 2) {
                            build[i] = attrib(build[i], "/>");
                        } else {
                            build[i] = attrib(build[i], ">");
                        }
                    }
                }
            }());
        }());
        //This function writes the indentation to those elements in the
        //build array that need to be indented.  The length of build
        //indentation is designated by the values in the level array.
        (function markup_beauty__apply() {
            //The function creates the tab stops from the values supplied by
            //the indent_character and indent_size arguments. If no values
            //are supplied or are supplied improperly a reasonable default
            //is created.
            var tab = (function markup_beauty__apply_tab() {
                    var a = 0,
                        b = msize,
                        c = mchar,
                        d = [];
                    for (a = 0; a < b; a += 1) {
                        d.push(c);
                    }
                    return d.join("");
                }()),
                i = 0,
                loop = build.length,
                indents = "",
                //This function writes the standard indentation
                //output
                tab_math = function markup_beauty__apply_indentation(x) {
                    var a = 0,
                        b = (typeof level[i] === "number") ? level[i] : 0,
                        c = 0,
                        d = 0,
                        indent = [],
                        parse = [],
                        pad = function markup_beauty__apply_indentation_pad() {
                            var s = indents,
                                t = c;
                            if (t === 0) {
                                return s;
                            }
                            do {
                                s += tab;
                                t -= 1;
                            } while (t > 0);
                            return s;
                        };
                    for (a = 0; a < b; a += 1) {
                        indent.push(tab);
                    }
                    if (cinfo[i] === "mixed_both" && mwrap === 0) {
                        x = x.slice(0, x.length - 1);
                    }
                    indents = indent.join("");
                    x = "\n" + indents + x;
                    //This area beautifies multidimensional SGML tags
                    if (cinfo[i] === "parse" && /\[\s*</.test(build[i])) {
                        build[i] = build[i].replace(/\[\s+</g, "[<");
                        parse = build[i].split("");
                        b = parse.length;
                        for (a = 0; a < b; a += 1) {
                            if (parse[a] === "[") {
                                c += 1;
                                parse[a] = "[\n" + pad();
                            } else if (parse[a] === "]") {
                                c -= 1;
                                parse[a] = "\n" + pad() + "]";
                            } else if (parse[a] === "<" && b > a + 3 && parse[a + 1] === "!" && parse[a + 2] === "-" && parse[a + 3] === "-") {
                                if (a === 0 || parse[a - 1].charAt(0) !== "[") {
                                    parse[a] = "\n" + pad() + "<";
                                }
                                for (d = a + 4; d < b; d += 1) {
                                    if (parse[d - 2] === "-" && parse[d - 1] === "-" && parse[d] === ">") {
                                        a = d;
                                        break;
                                    }
                                }
                            } else if (parse[a] === "<" && (a === 0 || parse[a - 1].charAt(0) !== "[")) {
                                parse[a] = "\n" + pad() + "<";
                            }
                        }
                        x = parse.join("").replace(/\s>/g, ">");
                    }
                    return x;
                },
                //This function writes the indentation output for
                //cinfo values of "end".  This function is different
                //in that some end elements do not receive
                //indentation.
                end_math = function markup_beauty__apply_end(x) {
                    var a = 0,
                        b = 0,
                        indent = [];
                    for (b = i; b > 0; b -= 1) {
                        if (level[b] !== "x") {
                            break;
                        }
                    }
                    for (a = 0; a < level[b]; a += 1) {
                        indent.push(tab);
                    }
                    x = "\n" + indent.join("") + x;
                    return x;
                },
                script_math = function markup_beauty__apply_script(x) {
                    var a = 0,
                        b = 0,
                        c = 0,
                        d = "",
                        indent = [];
                    if (level[i - 1] === "x") {
                        for (b = i - 1; b > 0; b -= 1) {
                            if (cinfo[b] === "start") {
                                a += 1;
                            } else if (cinfo[b] === "end") {
                                a -= 1;
                            }
                            if (level[b] !== "x") {
                                break;
                            }
                        }
                        if (cinfo[b] === "end") {
                            a += 1;
                        }
                        for (c = 0; c < level[b] + a; c += 1) {
                            indent.push(tab);
                        }
                    } else {
                        for (c = 0; c < level[i - 1] + 1; c += 1) {
                            indent.push(tab);
                        }
                    }
                    d = indent.join("");
                    return "\n" + d + x.replace(/\n/g, "\n" + d);
                },
                text_wrap = function markup_beauty__apply_wrap() {
                    var a = i,
                        b = 0,
                        c = build[i].replace(/^(\s+)/, "").replace(/(\s+)$/, "").split(" "),
                        d = c.length - 1,
                        e = [c[0]],
                        f = c[0].length,
                        ind = (function markup_beauty__apply_wrap_ind() {
                            var a = 0,
                                b = [],
                                c = level[i];
                            for (a = i - 1; a > -1; a -= 1) {
                                if (token[a] === "T_content" || (cinfo[a] === "end" && level[a] !== "x")) {
                                    if (cinfo[a] === "end" && level[i] !== "x" && level[i] !== indents.length / tab.length) {
                                        for (a = 0; a < c; a += 1) {
                                            b.push(tab);
                                        }
                                        return b.join("");
                                    }
                                    return indents;
                                }
                                if (cinfo[a] !== "singleton" && cinfo[a] !== "end") {
                                    return indents + tab;
                                }
                            }
                        }());
                    if (c.length === 1) {
                        return;
                    }
                    if (level[i] === "x") {
                        for (a = i - 1; a > -1; a -= 1) {
                            if (level[a] !== "x") {
                                b += build[a].replace(indents, "").length;
                                break;
                            }
                            b += build[a].length;
                        }
                    }
                    f += b;
                    if (c.length > 1 && c[0] !== "") {
                        if (f + c[1].length > mwrap) {
                            e.push("\n");
                            e.push(ind);
                            f = 0;
                        } else {
                            e.push(" ");
                        }
                    }
                    for (a = 1; a < d; a += 1) {
                        e.push(c[a]);
                        if (c[a].length + c[a + 1].length + 1 + f > mwrap) {
                            e.push("\n");
                            e.push(ind);
                            f = 0;
                        } else {
                            e.push(" ");
                            f += 1 + c[a].length;
                        }
                    }
                    if (e.length > 1) {
                        e.pop();
                    }
                    if (e[e.length - 1] !== "\n" && i < loop - 1 && level[i + 1] === "x") {
                        f += build[i + 1].length;
                    }
                    if (f + c[d].length > mwrap) {
                        e.push("\n");
                        e.push(ind);
                    } else if (f === 0) {
                        e.push(ind);
                    } else {
                        e.push(" ");
                    }
                    e.push(c[d]);
                    build[i] = e.join("");
                };
            //This is the logic for assigning execution of the prior
            //three functions.
            for (i = 0; i < loop; i += 1) {
                if (mwrap > 0 && (cinfo[i] === "content" || cinfo[i] === "mixed_start" || cinfo[i] === "mixed_both" || cinfo[i] === "mixed_end")) {
                    text_wrap(build[i]);
                }
                if (cinfo[i] === "end" && (mforce || (cinfo[i - 1] !== "content" && cinfo[i - 1] !== "mixed_start"))) {
                    if (build[i].charAt(0) === " ") {
                        build[i] = build[i].substr(1);
                    }
                    if (level[i] !== "x" && cinfo[i - 1] !== "start") {
                        build[i] = end_math(build[i]);
                    }
                } else if (cinfo[i] === "external" && mstyle === "indent") {
                    build[i] = script_math(build[i]);
                } else if (level[i] !== "x" && (cinfo[i - 1] !== "content" && (cinfo[i - 1] !== "mixed_start" || mforce))) {
                    if (build[i].charAt(0) === " ") {
                        build[i] = build[i].substr(1);
                    }
                    build[i] = tab_math(build[i]);
                }
            }
        }());
        if (summary !== "diff") {
            (function markup_beauty__report() {
                var m = [],
                    g = cinfo.length,
                    f = sum.join("").length,
                    b = (function markup_beauty__report_tagTypesCount() {
                        var a = 0,
                            b = [
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                            ],
                            c = [
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                            ],
                            d = [],
                            e = [],
                            f = [],
                            h = [];
                        for (a = 0; a < g; a += 1) {
                            switch (cinfo[a]) {
                            case "end":
                                b[1] += 1;
                                c[1] += sum[a].length;
                                if (sum[a].charAt(0) === " " && cinfo[a - 1] === "singleton") {
                                    c[1] -= 1;
                                    c[2] += 1;
                                }
                                break;
                            case "singleton":
                                b[2] += 1;
                                c[2] += sum[a].length;
                                if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                    m.push(build[a]);
                                }
                                break;
                            case "comment":
                                b[3] += 1;
                                c[3] += sum[a].length;
                                break;
                            case "content":
                                b[4] += 1;
                                c[4] += sum[a].length;
                                break;
                            case "mixed_start":
                                b[5] += 1;
                                c[5] += (sum[a].length - 1);
                                break;
                            case "mixed_end":
                                b[6] += 1;
                                c[6] += (sum[a].length - 1);
                                break;
                            case "mixed_both":
                                b[7] += 1;
                                c[7] += (sum[a].length - 2);
                                break;
                            case "parse":
                                b[10] += 1;
                                c[10] += sum[a].length;
                                break;
                            case "external":
                                b[17] += 1;
                                c[17] += sum[a].length;
                                if (((build[a].indexOf("<script") !== -1 || build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                    m.push(build[a]);
                                }
                                break;
                            default:
                                switch (token[a]) {
                                case "T_tag_start":
                                    b[0] += 1;
                                    c[0] += sum[a].length;
                                    if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                        m.push(build[a]);
                                    }
                                    break;
                                case "T_sgml":
                                    b[8] += 1;
                                    c[8] += sum[a].length;
                                    break;
                                case "T_xml":
                                    b[9] += 1;
                                    c[9] += sum[a].length;
                                    break;
                                case "T_ssi":
                                    b[11] += 1;
                                    c[11] += sum[a].length;
                                    break;
                                case "T_asp":
                                    b[12] += 1;
                                    c[12] += sum[a].length;
                                    break;
                                case "T_php":
                                    b[13] += 1;
                                    c[13] += sum[a].length;
                                    break;
                                case "T_script":
                                    b[15] += 1;
                                    c[15] += sum[a].length;
                                    if (build[a].indexOf(" src") !== -1) {
                                        m.push(build[a]);
                                    }
                                    break;
                                case "T_style":
                                    b[16] += 1;
                                    c[16] += sum[a].length;
                                    break;
                                }
                            }
                        }
                        d = [
                            b[0] + b[1] + b[2] + b[3], b[4] + b[5] + b[6] + b[7], b[15] + b[16] + b[17], b[11] + b[12] + b[13]
                        ]; //f  (d)
                        e = [
                            c[0] + c[1] + c[2] + c[3], c[4] + c[5] + c[6] + c[7], c[15] + c[16] + c[17], c[11] + c[12] + c[13]
                        ];
                        f = [
                            d[0], d[0], d[0], d[0], d[1], d[1], d[1], d[1], b[10], b[10], b[10], d[3], d[3], d[3], d[3], d[2], d[2], d[2]
                        ]; //g  (f)
                        h = [
                            e[0], e[0], e[0], e[0], e[1], e[1], e[1], e[1], c[10], c[10], c[10], e[3], e[3], e[3], e[3], e[2], e[2], e[2]
                        ]; //k  (g)
                        b[2] = b[2] - d[3];
                        c[2] = c[2] - e[3];
                        return [
                            b, c, d, e, f, h
                        ];
                    }()),
                    p = function markup_beauty__report_goodOrBad(x) {
                        var u = function markup_beauty__report_goodOrBad_extreme1(x) {
                                if (b[3][x] === 0) {
                                    return "0.00%";
                                }
                                return "100.00%";
                            },
                            v = function markup_beauty__report_goodOrBad_extreme2(x) {
                                if (b[2][x] === 0) {
                                    return "0.00%";
                                }
                                return "100.00%";
                            },
                            w = [],
                            y = "",
                            z = "";
                        switch (x) {
                        case 0:
                            if ((b[2][x] / g) < 0.7) {
                                y = "bad";
                            } else {
                                y = "good";
                            }
                            if ((b[3][x] / f) > 0.4) {
                                z = "bad";
                            } else {
                                z = "good";
                            }
                            break;
                        case 1:
                            if ((b[2][x] / g) < 0.25) {
                                y = "bad";
                            } else {
                                y = "good";
                            }
                            if ((b[3][x] / f) < 0.6) {
                                z = "bad";
                            } else {
                                z = "good";
                            }
                            break;
                        case 2:
                            if ((b[2][x] / g) > 0.05) {
                                y = "bad";
                            } else {
                                y = "good";
                            }
                            if ((b[3][x] / f) > 0.05) {
                                z = "bad";
                            } else {
                                z = "good";
                            }
                            break;
                        }
                        w = ["</th><td>"];
                        w.push(b[2][x]);
                        w.push("</td><td>");
                        w.push(v(x));
                        w.push("</td><td class='");
                        w.push(y);
                        w.push("'>");
                        w.push(((b[2][x] / g) * 100).toFixed(2));
                        w.push("%</td><td>");
                        w.push(b[3][x]);
                        w.push("</td><td>");
                        w.push(u(x));
                        w.push("</td><td class='");
                        w.push(z);
                        w.push("'>");
                        w.push(((b[3][x] / f) * 100).toFixed(2));
                        w.push("%</td></tr>");
                        return w.join("");
                    },
                    o = (function markup_beauty__report_buildOutput() {
                        var a = 0,
                            c = "",
                            d = [],
                            e = [],
                            h = (function markup_beauty__report_buildOutput_resultTable() {
                                var a = 0,
                                    c = [
                                        "*** Start Tags", "End Tags", "Singleton Tags", "Comments", "Flat String", "String with Space at Start", "String with Space at End", "String with Space at Start and End", "SGML", "XML", "Total Parsing Declarations", "SSI", "ASP", "PHP", "Total Server Side Tags", "*** Script Tags", "*** Style Tags", "JavaScript/CSS Code"
                                    ],
                                    d = [],
                                    h = "",
                                    l = "",
                                    z = b[0].length;
                                for (a = 0; a < z; a += 1) {
                                    if (b[4][a] === 0) {
                                        h = "0.00%";
                                    } else if (b[0][a] === b[4][a]) {
                                        h = "100.00%";
                                    } else {
                                        h = ((b[0][a] / b[4][a]) * 100).toFixed(2) + "%";
                                    }
                                    if (b[5][a] === 0) {
                                        l = "0.00%";
                                    } else if (b[1][a] === b[5][a]) {
                                        l = "100.00%";
                                    } else {
                                        l = ((b[1][a] / b[5][a]) * 100).toFixed(2) + "%";
                                    }
                                    d = ["<tr><th>" + c[a]];
                                    d.push("</th><td>");
                                    d.push(b[0][a]);
                                    d.push("</td><td>");
                                    d.push(h);
                                    d.push("</td><td>");
                                    d.push(((b[0][a] / g) * 100).toFixed(2));
                                    d.push("%</td><td>");
                                    d.push(b[1][a]);
                                    d.push("</td><td>");
                                    d.push(l);
                                    d.push("</td><td>");
                                    d.push(((b[1][a] / f) * 100).toFixed(2));
                                    d.push("%</td></tr>");
                                    if (a === 3) {
                                        d.push("<tr><th>Total Common Tags");
                                        d.push(p(0));
                                        d.push("<tr><th colspan='7'>Content</th></tr>");
                                    } else if (a === 7) {
                                        d.push("<tr><th>Total Content");
                                        d.push(p(1));
                                        d.push("<tr><th colspan='7'>Parsing Declarations</th></tr>");
                                    } else if (a === 10) {
                                        d.push("<tr><th colspan='7'>Server Side Tags</th></tr>");
                                    } else if (a === 14) {
                                        d.push("<tr><th colspan='7'>Style and Script Code/Tags</th></tr>");
                                    } else if (a === 17) {
                                        d.push("<tr><th>Total Script and Style Tags/Code");
                                        d.push(p(2));
                                    }
                                    c[a] = d.join("");
                                }
                                return c.join("");
                            }()),
                            i = ["<div id='doc'>"],
                            z = m.length;
                        i.push((function markup_beauty__report_buildOutput_content() {
                            var a = 0,
                                b = 0,
                                z = g,
                                h = [],
                                i = [],
                                j = 0,
                                k = 0,
                                l = [],
                                m = [],
                                n = [],
                                o = "",
                                p = [],
                                w = [],
                                x = "",
                                punctuation = function markup_beauty__report_buildOutput_punctuation(y) {
                                    return y.replace(/(\,|\.|\?|\!|\:) /, " ");
                                };
                            for (a = 0; a < z; a += 1) {
                                if (cinfo[a] === "content") {
                                    l.push(" ");
                                    l.push(build[a]);
                                } else if (cinfo[a] === "mixed_start") {
                                    l.push(build[a]);
                                } else if (cinfo[a] === "mixed_both") {
                                    l.push(build[a].substr(0, build[a].length));
                                } else if (cinfo[a] === "mixed_end") {
                                    l.push(" ");
                                    l.push(build[a].substr(0, build[a].length));
                                }
                            }
                            x = l.join("");
                            if (x.length === 0) {
                                return "";
                            }
                            x = x.substr(1, x.length).toLowerCase();
                            w = x.replace(/\&nbsp;?/gi, " ").replace(/[a-z](\,|\.|\?|\!|\:) /gi, punctuation).replace(/(\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").split(" ");
                            z = w.length;
                            for (a = 0; a < z; a += 1) {
                                if (w[a] !== "") {
                                    h.push([
                                        1, w[a]
                                    ]);
                                    j += 1;
                                    for (b = a + 1; b < z; b += 1) {
                                        if (w[b] === w[a]) {
                                            h[h.length - 1][0] += 1;
                                            w[b] = "";
                                            j += 1;
                                        }
                                    }
                                }
                            }
                            z = h.length;
                            for (a = 0; a < z; a += 1) {
                                k = a;
                                for (b = a + 1; b < z; b += 1) {
                                    if (h[b][0] > h[k][0] && h[b][1] !== "") {
                                        k = b;
                                    }
                                }
                                o = h[k][1];
                                if (o.length < 3 || o.length > 30 || !(/[a-zA-Z]/).test(o) || (/&\#?\w+;/).test(o) || o === "the" || o === "and" || o === "for" || o === "are" || o === "this" || o === "from" || o === "with" || o === "that") {
                                    m.push(h[k]);
                                } else {
                                    m.push(h[k]);
                                    n.push(h[k]);
                                }
                                if (h[k] !== h[a]) {
                                    h[k] = h[a];
                                } else {
                                    h[k] = [
                                        0, ""
                                    ];
                                }
                                if (n.length === 11) {
                                    break;
                                }
                            }
                            if (m.length < 2) {
                                return "";
                            }
                            b = m.length;
                            for (a = 0; a < b; a += 1) {
                                if (a > 9) {
                                    m[a] = "";
                                } else {
                                    p[a] = (m[a + 1]) ? (m[a][0] / m[a + 1][0]).toFixed(2) : "1.00";
                                    m[a] = "<tr><th>" + (a + 1) + "</th><td>" + m[a][1].replace(/&/g, "&amp;") + "</td><td>" + m[a][0] + "</td><td>" + p[a] + "</td><td>" + ((m[a][0] / j) * 100).toFixed(2) + "%</td></tr>";
                                }
                            }
                            if (m[10]) {
                                m[10] = "";
                            }
                            if (n.length > 10) {
                                b = 10;
                            } else {
                                b = n.length;
                            }
                            p = [];
                            for (a = 0; a < b; a += 1) {
                                p[a] = (n[a + 1]) ? (n[a][0] / n[a + 1][0]).toFixed(2) : "1.00";
                                n[a] = "<tr><th>" + (a + 1) + "</th><td>" + n[a][1].replace(/&/g, "&amp;") + "</td><td>" + n[a][0] + "</td><td>" + p[a] + "</td><td>" + ((n[a][0] / j) * 100).toFixed(2) + "%</td></tr>";
                            }
                            if (n[10]) {
                                n[10] = "";
                            }
                            if (b > 10) {
                                n[n.length - 1] = "";
                            }
                            i.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrates <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content and the number of times they occurred.</caption>");
                            i.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Percentage from ");
                            i.push(j.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                            if (j > 1) {
                                i.push(" Total");
                            }
                            i.push(" Word");
                            if (j > 1) {
                                i.push("s");
                            }
                            o = m.join("");
                            x = n.join("");
                            i.push("</th></tr></thead><tbody><tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                            i.push(o);
                            if (o !== x && n.length > 2) {
                                i.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                i.push(x);
                            }
                            i.push("</tbody></table>");
                            return i.join("");
                        }()));
                        i.push("<table class='analysis' summary='Analysis of markup pieces.'><caption>Analysis of markup pieces.</caption><thead><tr><th>Type</th><th>Quantity of Tags/Content</th><th>Percentage Quantity in Section</th><th>Percentage Quantity of Total</th><th>** Character Size</th><th>Percentage Size in Section</th><th>Percentage Size of Total</th></tr></thead><tbody><tr><th>Total Pieces</th><td>");
                        i.push(g);
                        i.push("</td><td>100.00%</td><td>100.00%</td><td>");
                        i.push(f);
                        i.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Common Tags</th></tr>");
                        i.push(h);
                        d = [];
                        for (a = 0; a < z; a += 1) {
                            if (m[a]) {
                                e = ["<li>"];
                                e.push(m[a].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;"));
                                e.push("</li>");
                                d[a] = e.join("");
                            }
                        }
                        if (d.length > 0) {
                            c = "<h4>HTML elements making HTTP requests:</h4><ul>" + d.join("") + "</ul>";
                        } else {
                            c = "";
                        }
                        i.push("</tbody></table></div><p>* The number of requests is determined from the input submitted only and does not count the additional HTTP requests supplied from dynamically executed code, frames, iframes, css, or other external entities.</p><p>**");
                        i.push("Character size is measured from the individual pieces of tags and content specifically between minification and beautification.</p><p>*** The number of starting &lt;script&gt; and &lt;style&gt; tags is subtracted from the total number of start tags.");
                        i.push("The combination of those three values from the table above should equal the number of end tags or the code is in error.</p>");
                        i.push(c);
                        return i.join("");
                    }()),
                    r = function markup_beauty__report_ratios(x, y) {
                        return (((b[3][0] + x) / f) / ((b[3][1] * y) / f));
                    },
                    n = (function markup_beauty__report_efficiencyScore() {
                        var a = "",
                            c = f / 7500,
                            d = build.join("").length,
                            e = args.source.length,
                            h = 0,
                            i = ["<p>If the input is content it receives an efficiency score of <strong>"],
                            k = "",
                            l = "",
                            t = "",
                            u = "";
                        a = c.toFixed(0);
                        if (c > 0) {
                            c = (m.length - a) * 4;
                        } else {
                            c = 0;
                        }
                        if (b[3][1] === 0) {
                            b[2][1] = 0.00000001;
                            b[3][1] = 0.00000001;
                        }
                        h = (((b[2][0] + b[2][2] - c) / g) / (b[2][1] / g));
                        k = (h / r(b[3][2], 1)).toPrecision(2);
                        l = (h / r(b[1][15], 1)).toPrecision(2);
                        t = (h / r(b[3][2], 4)).toPrecision(2);
                        u = (h / r(b[1][15], 4)).toPrecision(2);
                        if (k === l) {
                            l = "";
                            u = "";
                        } else {
                            l = ", or <strong>" + l + "</strong> if inline script code and style tags are removed";
                            u = ", or <strong>" + u + "</strong> if inline script code and style tags are removed";
                        }
                        i.push(k);
                        i.push("</strong>");
                        i.push(l);
                        i.push(". The efficiency score if this input is a large form or application is <strong>");
                        i.push(t);
                        i.push("</strong>");
                        i.push(u);
                        i.push(". Efficient markup achieves scores higher than 2.00 and excellent markup achieves scores higher than 4.00. The score reflects the highest number of tags to pieces of content where the weight of those tags is as small as possible compared to the weight of the content.");
                        i.push("The score is a performance metric only and is not associated with validity or well-formedness, but semantic code typically achieves the highest scores. All values are rounded to the nearest hundreth.</p><p><strong>Total input size:</strong> <em>");
                        i.push(e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                        i.push("</em> characters</p><p><strong>Total output size:</strong> <em>");
                        i.push(d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                        i.push("</em> characters</p><p><strong>* Total number of HTTP requests in supplied HTML:</strong> <em>");
                        i.push(m.length);
                        i.push("</em></p>");
                        return i.join("");
                    }()),
                    s = (function markup_beauty__report_summary() {
                        var a = 0,
                            c = ["<p><strong>"],
                            q = "";
                        if (b[0][0] + b[0][15] + b[0][16] !== b[0][1]) {
                            q = "s";
                            a = (b[0][0] + b[0][15] + b[0][16]) - b[0][1];
                            if (a > 0) {
                                if (a === 1) {
                                    q = "";
                                }
                                c.push(a);
                                c.push(" more start tag");
                                c.push(q);
                                c.push(" than end tag");
                                c.push(q);
                                c.push("!");
                            } else {
                                if (a === -1) {
                                    q = "";
                                }
                                c.push(a * -1);
                                c.push(" more end tag");
                                c.push(q);
                                c.push(" than start tag");
                                c.push(q);
                                c.push("!");
                            }
                            c.push("</strong> The combined total number of start tags, script tags, and style tags should equal the number of end tags. For HTML this problem may be solved by selecting the '<em>Presume SGML type HTML</em>' option.</p>");
                        } else {
                            return "";
                        }
                        return c.join("");
                    }());
                summary = s + n + o;
            }());
        }
        token = [];
        cinfo = [];
        level = [];
        inner = [];
        sum = [];
        return build.join("").replace(/^\s+/, "");
    };