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
var summary       = "",
    markup_beauty = function markup_beauty(args) {
        "use strict";
        //This function only normalizes input to the application
        var token     = [],
            build     = [],
            cinfo     = [],
            level     = [],
            inner     = [],
            sum       = [],
            x         = (typeof args.source === "string") ? args.source : "",
            mchar     = (typeof args.inchar === "string" && args.inchar.length > 0) ? args.inchar : " ",
            mcomm     = (typeof args.comments === "string" && args.comments === "noindent") ? "noindent" : "indent",
            mcond     = (args.conditional === "true" || args.conditional === true) ? true : false,
            mcont     = (args.content === "true" || args.content === true) ? true : false,
            mforce    = (args.force_indent === "true" || args.force_indent === true) ? true : false,
            mhtml     = (args.html === "true" || args.html === true) ? true : false,
            mmode     = (typeof args.mode === "string" && args.mode === "diff") ? "diff" : "beautify",
            msize     = (isNaN(args.insize) === true) ? 4 : Number(args.insize),
            mstyle    = (typeof args.style === "string" && args.style === "noindent") ? "noindent" : "indent",
            mwrap     = (isNaN(args.wrap) === true) ? 0 : Number(args.wrap),
            mvarspace = (args.varspace === false || args.varspace === "false") ? false : true;
        if (mhtml === true) {
            x = x.replace(/<\!\[if /g, "<!--[if ").replace(/<\!\[endif\]>/g, "<![endif]-->");
        }
        //this function is the logic that intelligently identifies the
        //angle brackets nested inside quotes and converts them to
        //square brackets to prevent interference of beautification.
        //This is the logic that allows JSP beautification to occur.
        (function markup_beauty__findNestedTags() {
            var data = (function markup_beauty__findNestedTags_angleBraces() {
                    var a               = 0,
                        b               = 0,
                        c               = 0,
                        end             = x.length,
                        tagEnd          = 0,
                        tagCount        = -1,
                        ltIndex         = 0,
                        quoteEnd        = 0,
                        ltCount         = -1,
                        quoteSwitch     = false,
                        braceTest       = false,
                        quotedBraceTest = false,
                        quoteless       = false,
                        quoteBuild      = [">"],
                        output          = [];
                    for (a = 0; a < end; a += 1) {
                        //if in HTML mode and a pre tag is found then
                        //pass over
                        if (mhtml === true && x.substr(a, 4).toLowerCase() === "<pre") {
                            for (b = a + 4; b < end; b += 1) {
                                if (tagEnd === 0 && x.charAt(b) === ">") {
                                    tagEnd = b;
                                }
                                if (x.slice(b, b + 6).toLowerCase() === "</pre>") {
                                    if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 6)) === true) {
                                        tagCount += 2;
                                    } else {
                                        tagCount += 3;
                                    }
                                    a      = b + 5;
                                    tagEnd = 0;
                                    break;
                                }
                            }
                            //if PHP, ASP, script, or style found then
                            //pass over
                        } else if (x.substr(a, 7).toLowerCase() === "<script") {
                            for (b = a + 7; b < end; b += 1) {
                                if (tagEnd === 0 && x.charAt(b) === ">") {
                                    tagEnd = b;
                                }
                                if (x.slice(b, b + 9).toLowerCase() === "</script>") {
                                    //tagCount counts the index of the
                                    //future build array
                                    if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 9)) === true) {
                                        tagCount += 2;
                                    } else {
                                        tagCount += 3;
                                    }
                                    a      = b + 8;
                                    tagEnd = 0;
                                    break;
                                }
                            }
                        } else if (x.substr(a, 6).toLowerCase() === "<style") {
                            for (b = a + 6; b < end; b += 1) {
                                if (tagEnd === 0 && x.charAt(b) === ">") {
                                    tagEnd = b;
                                }
                                if (x.slice(b, b + 8).toLowerCase() === "</style>") {
                                    //tagCount counts the index of the
                                    //future build array
                                    if (b - tagEnd === 1 || (/^(>\s*<)$/).test(x.substr(tagEnd, b - 8)) === true) {
                                        tagCount += 2;
                                    } else {
                                        tagCount += 3;
                                    }
                                    a      = b + 7;
                                    tagEnd = 0;
                                    break;
                                }
                            }
                        } else if (x.substr(a, 5) === "<?php") {
                            for (b = a + 5; b < end; b += 1) {
                                if (x.charAt(b - 1) === "?" && x.charAt(b) === ">") {
                                    a        = b;
                                    tagCount += 1;
                                    break;
                                }
                            }
                        } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "%") {
                            for (b = a + 2; b < end; b += 1) {
                                if (x.charAt(b - 1) === "%" && x.charAt(b) === ">") {
                                    a        = b;
                                    tagCount += 1;
                                    break;
                                }
                            }
                        } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && x.charAt(a + 2) === "[") {
                            for (b = a + 2; b < end; b += 1) {
                                if (x.charAt(b - 1) === "]" && x.charAt(b) === ">") {
                                    a        = b;
                                    tagCount += 1;
                                    break;
                                }
                            }
                            //This section identifies SGML tags and the
                            //location of internally contained angle
                            //brackets.
                        } else if (x.charAt(a) === "<" && x.charAt(a + 1) === "!" && (/[A-Za-z]|\[/).test(x.charAt(a + 2)) === true) {
                            for (b = a + 3; b < end; b += 1) {
                                //This first condition identifies
                                //comments nested in SGML type compound
                                //tags, because these should allow
                                //literal expression of reserved
                                //characters since this is not impactfull
                                if (x.slice(b, b + 4) === "<!--") {
                                    for (c = b + 4; c < end; c += 1) {
                                        if (x.slice(c - 2, c + 1) === "-->") {
                                            b = c + 1;
                                            break;
                                        }
                                    }
                                } else if (x.charAt(b) === ">" && quoteBuild.length === 1 && quoteBuild[0] === ">") {
                                    tagCount += 1;
                                    if (quoteless === true) {
                                        output.push([
                                            a, b, tagCount, a
                                        ]);
                                    }
                                    quoteless  = false;
                                    a          = b;
                                    quoteBuild = [">"];
                                    break;
                                }
                                if (x.charAt(b) === "<") {
                                    quoteBuild.push(">");
                                    quoteless = true;
                                } else if (x.charAt(b) === ">" && quoteBuild.length > 1) {
                                    quoteBuild.pop();
                                    if (quoteBuild.length === 1 && quoteless === true) {
                                        tagCount += 1;
                                        output.push([
                                            a, b, tagCount, a
                                        ]);
                                        quoteless  = false;
                                        a          = b;
                                        quoteBuild = [">"];
                                        break;
                                    }
                                    quoteless = true;
                                } else if (x.charAt(b) === "[") {
                                    quoteBuild.push("]");
                                } else if (x.charAt(b) === "]") {
                                    quoteBuild.pop();
                                } else if (x.charAt(b) === "\"") {
                                    if (quoteBuild[quoteBuild.length - 1] === "\"") {
                                        quoteBuild.pop();
                                    } else {
                                        quoteBuild.push("\"");
                                    }
                                } else if (x.charAt(b) === "'") {
                                    if (quoteBuild[quoteBuild.length - 1] === "'") {
                                        quoteBuild.pop();
                                    } else {
                                        quoteBuild.push("'");
                                    }
                                }
                            }
                            //Don't even bother with empty qutoes: "" or ''
                        } else if (x.charAt(a) === x.charAt(a + 1) && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                            a += 1;
                        } else if (x.charAt(a - 1) === "=" && (x.charAt(a) === "\"" || x.charAt(a) === "'")) {
                            //This first bit with the "c" and "quotedBraceTest"
                            //variables instructs the principle loop of
                            //innerset of ignore quote characters that
                            //fall outside of tags.
                            quotedBraceTest = false;
                            for (c = a - 1; c > 0; c -= 1) {
                                if ((x.charAt(c) === "\"" && x.charAt(a) === "\"") || (x.charAt(c) === "'" && x.charAt(a) === "'") || x.charAt(c) === "<") {
                                    break;
                                }
                                if (x.charAt(c) === ">") {
                                    quotedBraceTest = true;
                                    break;
                                }
                            }
                            if (quotedBraceTest === false) {
                                //braceTest is reset to be used as a switch.
                                braceTest = false;
                                for (b = a + 1; b < end; b += 1) {
                                    //Ignore closing quotes if they
                                    //reside inside a script, style,
                                    //ASP, or PHP block.
                                    if (x.substr(b, 7).toLowerCase() === "<script") {
                                        for (c = b + 7; c < end; c += 1) {
                                            if (x.slice(c, c + 9).toLowerCase() === "</script>") {
                                                b = c + 9;
                                                break;
                                            }
                                        }
                                    } else if (x.substr(b, 6).toLowerCase() === "<style") {
                                        for (c = b + 6; c < end; c += 1) {
                                            if (x.slice(c, c + 8).toLowerCase() === "</style>") {
                                                b = c + 8;
                                                break;
                                            }
                                        }
                                    } else if (x.substr(b, 5) === "<?php") {
                                        for (c = b + 5; c < end; c += 1) {
                                            if (x.charAt(c - 1) === "?" && x.charAt(c) === ">") {
                                                b = c;
                                                break;
                                            }
                                        }
                                    } else if (x.charAt(b) === "<" && x.charAt(b + 1) === "%") {
                                        for (c = b + 5; c < end; c += 1) {
                                            if (x.charAt(c - 1) === "%" && x.charAt(c) === ">") {
                                                b = c;
                                                break;
                                            }
                                        }
                                    } else if (x.charAt(b) === ">" || x.charAt(b) === "<") {
                                        //There is no reason to push every
                                        //set of quotes into the "output" array
                                        //if those quotes do not contain
                                        //angle brackets.  This is a switch
                                        //to test for such.
                                        braceTest = true;
                                    } else if ((x.charAt(b - 1) !== "\\" && ((x.charAt(a) === "\"" && x.charAt(b) === "\"") || (x.charAt(a) === "'" && x.charAt(b) === "'"))) || b === end - 1) {
                                        //The "quoteSwtich" variable is used as an
                                        //on/off switch to allow content,
                                        //but not sequentially.  Tags with
                                        //quotes following content with
                                        //quotes need to be decremented to
                                        //correct an inflated count
                                        if (ltCount !== tagCount && quoteSwitch === true) {
                                            quoteSwitch = false;
                                            tagCount    -= 1;
                                            ltCount     -= 1;
                                        } else if (ltCount === tagCount) {
                                            for (c = ltIndex + 1; c > a; c += 1) {
                                                if ((/\s/).test(x.charAt(c)) === false) {
                                                    break;
                                                }
                                            }
                                            quoteEnd = c;
                                            //This condition is for
                                            //nonsequential content pieces
                                            if (ltIndex < a && quoteSwitch === false) {
                                                quoteSwitch = true;
                                                tagCount    += 1;
                                                ltCount     += 1;
                                            }
                                        }
                                        //a = index of opening quotes
                                        //    from a quote pair
                                        //b = index of closing quotes
                                        //    from a quote pair
                                        //tagCount = tag and content count
                                        //quoteEnd = the index where tag "tagCount" starts
                                        if (braceTest === true) {
                                            output.push([
                                                a, b, tagCount, quoteEnd
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
                                if (mhtml === true && x.charAt(a + 4) === "[" && x.charAt(a + 5).toLowerCase() === "i" && x.charAt(a + 6).toLowerCase() === "f") {
                                    for (b = a + 7; b < end; b += 1) {
                                        if (x.charAt(b) === "]" && x.charAt(b + 1) === "-" && x.charAt(b + 2) === "-" && x.charAt(b + 3) === ">") {
                                            break;
                                        }
                                    }
                                    a = b + 3;
                                } else {
                                    for (b = a + 4; b < end; b += 1) {
                                        if (x.charAt(b) === "-" && x.charAt(b + 1) === "-" && x.charAt(b + 2) === ">") {
                                            break;
                                        }
                                    }
                                    a = b + 2;
                                }
                                tagCount += 1;
                                //If not a HTML/XML comment increase the tag
                                //count
                            } else {
                                tagCount += 1;
                                quoteEnd = a;
                            }
                        } else if (x.charAt(a + 1) === "<" && x.charAt(a) !== ">") {
                            //Acount for content outside of tags
                            for (b = a; b > 0; b -= 1) {
                                if ((/\s/).test(x.charAt(b)) === false && x.charAt(b) !== ">") {
                                    tagCount += 1;
                                    ltCount  += 1;
                                    quoteEnd = a;
                                    break;
                                }
                                if (x.charAt(b) === ">") {
                                    if (tagCount !== ltCount) {
                                        ltCount += 1;
                                        ltIndex = a;
                                    }
                                    break;
                                }
                            }
                            //Count for the closing of tags
                        } else if (x.charAt(a) === ">") {
                            ltCount += 1;
                            ltIndex = a;
                        }
                    }
                    return output;
                }());
            (function markup_beauty__findNestedTags_replaceBraces() {
                var a          = 0,
                    b          = 0,
                    c          = 0,
                    d          = 0,
                    dataEnd    = data.length,
                    tagEnd     = 0,
                    tagCount   = 0,
                    braceIndex = 0,
                    tagStart   = 0,
                    quoteEnd   = 0,
                    source     = x.split("");
                //Code hand off must occur between quote discovery and
                //tag count.  Hand off must allow for discovery to be
                //repacked into numbers relevant to postcomputation and
                //not to input.  This hand off produces the "inner"
                //array for consumption by the innerfix array.
                for (a = 0; a < dataEnd; a += 1) {
                    tagStart = data[a][0] + 1;
                    tagEnd   = data[a][1];
                    tagCount = data[a][2];
                    quoteEnd = data[a][3];
                    //This loop converts quotes angle brackets to square
                    //brackets and simultaneously builds out the "inner"
                    //arrry.  The inner array contains the reference
                    //locations of the converted angle brackets so the
                    //program can put the angle brackets back after
                    //JavaScript and CSS are beautified.
                    for (b = tagStart; b < tagEnd; b += 1) {
                        //braceIndex is the character index of a converted
                        //angle bracket in a given tag
                        braceIndex = 0;
                        if (source[b] === "<") {
                            source[b] = "[";
                            for (c = b; c > quoteEnd; c -= 1) {
                                braceIndex += 1;
                                if ((/\s/).test(source[c]) === true) {
                                    for (d = c - 1; d > quoteEnd; d -= 1) {
                                        if ((/\s/).test(source[d]) === false) {
                                            //This condition accounts
                                            //for white space
                                            //normalization around equal
                                            //characters that is
                                            //supplied by markupmin,
                                            //otherwise braceIndex is incremented
                                            //for runs of white space
                                            //characters prior to
                                            //accounting for
                                            //tokenization.
                                            if (source[d] !== "=") {
                                                braceIndex += 1;
                                            } else if ((/\s/).test(source[d - 1]) === true) {
                                                braceIndex -= 1;
                                            }
                                            c = d;
                                            break;
                                        }
                                    }
                                }
                            }
                            if ((/\s/).test(source[tagStart]) === true && source[tagStart - 1] !== "\"" && source[tagStart - 1] !== "'") {
                                braceIndex -= 1;
                            }
                            inner.push([
                                "<", braceIndex, tagCount
                            ]);
                        } else if (source[b] === ">") {
                            source[b] = "]";
                            for (c = b; c > quoteEnd; c -= 1) {
                                braceIndex += 1;
                                if ((/\s/).test(source[c]) === true) {
                                    for (d = c - 1; d > quoteEnd; d -= 1) {
                                        if ((/\s/).test(source[d]) === false) {
                                            if (source[d] !== "=") {
                                                braceIndex += 1;
                                            } else if ((/\s/).test(source[d - 1]) === true) {
                                                braceIndex -= 1;
                                            }
                                            c = d;
                                            break;
                                        }
                                    }
                                }
                            }
                            if ((/\s/).test(source[tagStart]) === true && source[tagStart - 1] !== "\"" && source[tagStart - 1] !== "'") {
                                braceIndex -= 1;
                            }
                            inner.push([
                                ">", braceIndex, tagCount
                            ]);
                        }
                    }
                }
                //x must be joined back into a string so that it can
                //pass through the markupmin function.
                x = source.join("");
            }());
        }());
        //This function builds full tags and content into an array named
        //build and names the tag types or content into elements of a
        //separate array that I have named token.
        (function markup_beauty__createBuild() {
            var i          = 0,
                inc        = 0,
                scriptflag = 0,
                y          = markupmin({
                    source      : x,
                    comments    : mmode,
                    presume_html: mhtml,
                    conditional : mcond
                }).split(""),
                last       = "",
                //This function looks for the end of a designated tag
                //and then returns the entire tag as a single output.
                builder    = function markup_beauty__createBuild_endFinder(ending) {
                    var a          = 0,
                        b          = 0,
                        c          = 0,
                        buildLen   = 0,
                        part       = [],
                        endLen     = ending.length,
                        endParse   = ending.split("").reverse(),
                        space      = "",
                        name       = "",
                        braceCount = 0,
                        ename      = "",
                        previous   = "",
                        loop       = y.length,
                        quote      = "";
                    if (i > 0 && y[i - 1] === " ") {
                        space = " ";
                    }
                    for (i; i < loop; i += 1) {
                        part.push(y[i]);
                        if (ending === ">" && y[i] === "%") {
                            if (y[i - 1] === "<") {
                                braceCount += 1;
                            }
                            if (y[i + 1] === ">") {
                                braceCount -= 1;
                                i          += 1;
                                part.pop();
                                part.push("%>");
                            }
                        }
                        if (quote === "") {
                            if (y[i] === "\"") {
                                quote = "\"";
                            } else if (y[i] === "'") {
                                quote = "'";
                            } else if (y[i] === "[" && part[0] === "<" && part[1] === "!" && part[2] !== "-") {
                                ending   = "]>";
                                endLen   = 2;
                                endParse = [
                                    ">", "]"
                                ];
                            } else {
                                if (part[part.length - 1] === endParse[0] && braceCount === 0) {
                                    if (endLen === 1) {
                                        if (mhtml === true && (part[3] === ">" || part[3] === " " || part[3] === "l" || part[3] === "L")) {
                                            name = part.slice(1, 5).join("").toLowerCase();
                                            if (name.slice(0, 2) === "li") {
                                                name = name.slice(0, 4);
                                            }
                                            buildLen = build.length - 1;
                                            b        = buildLen;
                                            if (b > -1) {
                                                if (token[b] === "T_asp" || token[b] === "T_php" || token[b] === "T_ssi" || token[b] === "T_sgml" || token[b] === "T_xml" || token[b] === "T_comment") {
                                                    do {
                                                        b -= 1;
                                                    } while (b > 0 && (token[b] === "T_asp" || token[b] === "T_php" || token[b] === "T_ssi" || token[b] === "T_sgml" || token[b] === "T_xml" || token[b] === "T_comment"));
                                                }
                                                previous = build[b].toLowerCase();
                                                ename    = previous.substr(1);
                                                if (ename.charAt(0) === "<") {
                                                    ename = ename.substr(1);
                                                }
                                                if (((name === "li " || name === "li>") && (ename === "/ul>" || ename === "/ol>" || (ename !== "/li>" && ename !== "ul>" && ename !== "ol>" && ename.indexOf("ul ") !== 0 && ename.indexOf("ol ") !== 0))) || (((name === "/ul>" && previous.indexOf("<ul") < 0) || (name === "/ol>" && previous.indexOf("<ol") < 0)) && ename !== "/li>")) {
                                                    build.push("</prettydiffli>");
                                                    token.push("T_tag_end");
                                                    buildLen += 1;
                                                    for (c = inner.length - 1; c > -1; c -= 1) {
                                                        if (inner[c][2] < buildLen) {
                                                            break;
                                                        }
                                                        inner[c][2] += 1;
                                                    }
                                                }
                                            }
                                        }
                                        return space + part.join("");
                                    }
                                    for (a = 0; a < endLen; a += 1) {
                                        if (endParse[a] !== part[part.length - (a + 1)]) {
                                            break;
                                        }
                                    }
                                    if (a === endLen) {
                                        return space + part.join("");
                                    }
                                }
                            }
                        } else if (y[i] === quote) {
                            quote = "";
                        }
                    }
                    return space + part.join("");
                },
                //This function builds content into isolated usable
                //content units.  This is for content only.
                cgather    = function markup_beauty__createBuild_buildContent(type) {
                    var a       = 0,
                        b       = 0,
                        output  = "",
                        comment = "",
                        endd    = y.length;
                    for (a = i; a < endd; a += 1) {
                        //Verifies if the end script tag is quoted
                        if (comment === "" && (y[a - 1] !== "\\" || (a > 2 && y[a - 2] === "\\"))) {
                            if (y[a] === "/" && y[a + 1] && y[a + 1] === "/") {
                                comment = "//";
                            } else if (y[a] === "/" && y[a + 1] && y[a + 1] === "*") {
                                comment = "/" + "*";
                            } else if (y[a] === "'" || y[a] === "\"" || y[a] === "/") {
                                //It is necessary to determine if a
                                //forward slash character is division or
                                //the opening of a regular expression.
                                //If division then ignore and move on.
                                //I am presuming division is only when
                                //the forward slash follows a closing
                                //container or word character.
                                if (y[a] === "/") {
                                    for (b = a - 1; b > 0; b -= 1) {
                                        if ((/\s/).test(y[b]) === false) {
                                            break;
                                        }
                                    }
                                    if (y[b] === ")" || y[b] === "]" || y[b] === "}" || (/\w/).test(y[b]) === true) {
                                        comment = "";
                                    } else {
                                        comment = "/";
                                    }
                                } else {
                                    comment = y[a];
                                }
                            }
                        } else if ((y[a - 1] !== "\\" || y[a - 2] === "\\") && ((comment === "'" && y[a] === "'") || (comment === "\"" && y[a] === "\"") || (comment === "/" && y[a] === "/") || (comment === "//" && (y[a] === "\n" || (y[a - 4] && y[a - 4] === "/" && y[a - 3] === "/" && y[a - 2] === "-" && y[a - 1] === "-" && y[a] === ">"))) || (comment === ("/" + "*") && y[a - 1] === "*" && y[a] === "/"))) {
                            comment = "";
                        }
                        if (((type === "script" && comment === "") || type === "style") && y[a] === "<" && y[a + 1] === "/" && y[a + 2].toLowerCase() === "s") {
                            if (type === "script" && (y[a + 3].toLowerCase() === "c" && y[a + 4].toLowerCase() === "r" && y[a + 5].toLowerCase() === "i" && y[a + 6].toLowerCase() === "p" && y[a + 7].toLowerCase() === "t")) {
                                break;
                            }
                            if (type === "style" && (y[a + 3].toLowerCase() === "t" && y[a + 4].toLowerCase() === "y" && y[a + 5].toLowerCase() === "l" && y[a + 6].toLowerCase() === "e")) {
                                break;
                            }
                        } else if (type === "other" && y[a] === "<") {
                            break;
                        }
                        output = output + y[a];
                    }
                    i = a - 1;
                    if (mcont === true) {
                        if (output.charAt(0) === " " && output.charAt(output.length - 1) === " ") {
                            output = " text ";
                        } else if (output.charAt(0) === " ") {
                            output = " text";
                        } else if (output.charAt(output.length - 1) === " ") {
                            output = "text ";
                        } else {
                            output = "text";
                        }
                    }
                    return output;
                },
                end        = y.length;
            //This loop sorts markup code into various designated types.
            //The build array holds particular code while the token
            //array olds the designation for that code.  The argument
            //supplied to the "builder" function is the syntax ending
            //for a given tag type.  I have designed these types but
            //others can be added:
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
            //   * HTML only IE conditional tags
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
            for (i = 0; i < end; i += 1) {
                if (token[token.length - 1] === "T_script" && (i > end - 8 || y.slice(i, i + 8).join("").toLowerCase() !== "</script")) {
                    build.push(cgather("script"));
                    if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                        build.pop();
                    } else {
                        token.push("T_content");
                    }
                } else if (token[token.length - 1] === "T_style" && (i > end - 7 || y.slice(i, i + 7).join("").toLowerCase() !== "</style")) {
                    build.push(cgather("style"));
                    if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                        build.pop();
                    } else {
                        token.push("T_content");
                    }
                } else if (y[i] === "<" && y[i + 1] === "!") {
                    if (y[i + 2] === "-" && y[i + 3] === "-") {
                        if (mhtml === true && y[i + 3] === "-" && y[i + 4] === "[" && y[i + 5] === "i" && y[i + 6] === "f") {
                            build.push(builder("]-->"));
                            token.push("T_comment");
                        } else if (y[i + 3] === "-" && y[i + 4] !== "#" && token[token.length - 1] !== "T_style") {
                            build.push(builder("-->"));
                            token.push("T_comment");
                        } else if (y[i + 3] === "-" && y[i + 4] === "#") {
                            build.push(builder("-->"));
                            token.push("T_ssi");
                        } else {
                            build.push(builder(">"));
                            token.push("T_tag_start");
                        }
                    } else if (y[i + 2] !== "-") {
                        build.push(builder(">"));
                        token.push("T_sgml");
                    } else {
                        build.push(builder(">"));
                        token.push("T_tag_start");
                    }
                } else if (y[i] === "<" && y[i + 1] === "%") {
                    if (y[i + 2] === "-" && y[i + 3] === "-") {
                        build.push(builder("--%>"));
                        token.push("T_comment");
                    } else {
                        build.push(builder("%>"));
                        token.push("T_asp");
                    }
                } else if (y[i] === "<" && y[i + 1] === "?") {
                    if (y[i + 2].toLowerCase() === "x" && y[i + 3].toLowerCase() === "m" && y[i + 4].toLowerCase() === "l") {
                        token.push("T_xml");
                    } else if (y[i + 2].toLowerCase() === "p" && y[i + 3].toLowerCase() === "h" && y[i + 4].toLowerCase() === "p") {
                        token.push("T_php");
                    }
                    build.push(builder("?>"));
                } else if (mhtml === true && y[i] === "<" && y[i + 1].toLowerCase() === "p" && y[i + 2].toLowerCase() === "r" && y[i + 3].toLowerCase() === "e") {
                    build.push(builder("</pre>"));
                    token.push("T_pre");
                } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "c" && y[i + 3].toLowerCase() === "r" && y[i + 4].toLowerCase() === "i" && y[i + 5].toLowerCase() === "p" && y[i + 6].toLowerCase() === "t") {
                    scriptflag = i;
                    build.push(builder(">"));
                    //contents of a script tag are JavaScript if value
                    //of type attribute is:
                    // * not present
                    //text/javascript
                    //application/javascript
                    //application/x-javascript
                    //text/ecmascript
                    //application/ecmascript
                    last = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                    if (last.indexOf(" type=\"syntaxhighlighter\"") !== -1) {
                        i                       = scriptflag;
                        build[build.length - 1] = builder("</script>");
                        token.push("T_pre");
                    } else if (last.charAt(last.length - 2) === "/") {
                        token.push("T_singleton");
                    } else if (last.indexOf(" type=\"") === -1 || last.indexOf(" type=\"text/javascript\"") !== -1 || last.indexOf(" type=\"application/javascript\"") !== -1 || last.indexOf(" type=\"application/x-javascript\"") !== -1 || last.indexOf(" type=\"text/ecmascript\"") !== -1 || last.indexOf(" type=\"application/ecmascript\"") !== -1 || last.indexOf(" type=\"text/cjs\"") !== -1) {
                        token.push("T_script");
                    } else {
                        token.push("T_tag_start");
                    }
                } else if (y[i] === "<" && y[i + 1].toLowerCase() === "s" && y[i + 2].toLowerCase() === "t" && y[i + 3].toLowerCase() === "y" && y[i + 4].toLowerCase() === "l" && y[i + 5].toLowerCase() === "e") {
                    build.push(builder(">"));
                    //contents of a style tag are CSS if value of type
                    //attribute is:
                    // * not present
                    //text/css
                    last = build[build.length - 1].toLowerCase().replace(/'/g, "\"");
                    if (last.indexOf(" type=\"") === -1 || last.indexOf(" type=\"text/css\"") !== -1) {
                        token.push("T_style");
                    } else {
                        token.push("T_tag_start");
                    }
                } else if (y[i] === "<" && y[i + 1] === "/") {
                    build.push(builder(">"));
                    token.push("T_tag_end");
                } else if (y[i] === "<" && token[token.length - 1] !== "T_script" && token[token.length - 1] !== "T_style" && (y[i + 1] !== "!" || y[i + 1] !== "?" || y[i + 1] !== "/" || y[i + 1] !== "%")) {
                    for (inc = i; inc < end; inc += 1) {
                        if (y[inc] !== "?" && y[inc] !== "%") {
                            if (y[inc] === "/" && y[inc + 1] === ">") {
                                build.push(builder("/>"));
                                token.push("T_singleton");
                                break;
                            }
                            if (y[inc + 1] === ">") {
                                build.push(builder(">"));
                                token.push("T_tag_start");
                                break;
                            }
                        }
                    }
                } else if (y[i - 1] === ">" && (y[i] !== "<" || (y[i] !== " " && y[i + 1] !== "<"))) {
                    if (token[token.length - 1] === "T_script") {
                        build.push(cgather("script"));
                        if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                            build.pop();
                        } else {
                            token.push("T_content");
                        }
                    } else if (token[token.length - 1] === "T_style") {
                        build.push(cgather("style"));
                        if ((/^(\s+)$/).test(build[build.length - 1]) === true) {
                            build.pop();
                        } else {
                            token.push("T_content");
                        }
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
            var i   = 0,
                end = token.length;
            for (i = 0; i < end; i += 1) {
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
                //summary is a replica of the build array prior to any
                //beautification for use in the markup_summary function
                if (build[i] !== "</prettydiffli>") {
                    sum.push(build[i]);
                }
            }
        }());
        //this function cheats the structure and looks at tag names
        (function markup_beauty__htmlCheat() {
            var i          = 0,
                indexSpace = 0,
                tag        = "",
                end        = cinfo.length,
                next       = "";
            if (mhtml === false) {
                return;
            }
            for (i = 0; i < end; i += 1) {
                if (cinfo[i] === "start") {
                    indexSpace = build[i].indexOf(" ");
                    if (build[i].length === 3) {
                        tag = build[i].charAt(1).toLowerCase();
                    } else if (indexSpace === -1) {
                        tag = build[i].slice(1, build[i].length - 1).toLowerCase();
                    } else if (indexSpace === 0) {
                        tag        = build[i].slice(1, build[i].length);
                        indexSpace = tag.indexOf(" ");
                        tag        = tag.slice(1, indexSpace).toLowerCase();
                    } else {
                        tag = build[i].slice(1, indexSpace).toLowerCase();
                    }
                    if (cinfo[i + 1] === "end") {
                        next = (build[i + 1].charAt(0) === " ") ? build[i + 1].toLowerCase().substr(1) : build[i + 1].toLowerCase();
                    } else {
                        next = "";
                    }
                    if (next !== "</" + tag + ">") {
                        if (tag === "area" || tag === "base" || tag === "basefont" || tag === "br" || tag === "col" || tag === "embed" || tag === "eventsource" || tag === "frame" || tag === "hr" || tag === "img" || tag === "input" || tag === "keygen" || tag === "param" || tag === "progress" || tag === "source" || tag === "wbr") {
                            cinfo[i] = "singleton";
                            token[i] = "T_singleton";
                        }
                        if (tag === "link" || tag === "meta") {
                            cinfo[i] = "mixed_both";
                            token[i] = "T_singleton";
                        }
                    }
                }
            }
        }());
        //This function undoes all the changes made for compound
        //tags, such like JSP tags.
        (function markup_beauty__innerFix() {
            var a          = 0,
                braceType  = "",
                braceIndex = 0,
                tagCount   = 0,
                endInner   = inner.length,
                tag        = [];
            for (a = 0; a < endInner; a += 1) {
                braceType  = inner[a][0];
                braceIndex = inner[a][1];
                tagCount   = inner[a][2];
                if (typeof build[tagCount] === "string") {
                    if (build[tagCount].charAt(0) === " ") {
                        braceIndex += 1;
                    }
                    tag = build[tagCount].split("");
                    if (braceType === "<" && tag[braceIndex] === "[") {
                        tag[braceIndex] = "<";
                    } else if (braceType === ">" && tag[braceIndex] === "]") {
                        tag[braceIndex] = ">";
                    }
                    build[tagCount] = tag.join("");
                }
            }
        }());
        //This function sets the tab levels for the code.  It is set to
        //use the cinfo array definitions but could be rewritten to use
        //the token array.
        (function markup_beauty__algorithm() {
            var i           = 0,
                //This function looks back to the most previous indented
                //tag that is not an end tag and returns a count based
                //upon the number between the current tag and this
                //previous indented tag.  If the argument has a value of
                //"start" then indentation is increased by 1.
                commonStart = function markup_beauty__algorithm_commonStart(isStart) {
                    var a       = 0,
                        counter = 0;
                    if (isStart === "start") {
                        counter += 1;
                    }
                    for (a = i - 1; a > -1; a -= 1) {
                        if (cinfo[a] === "start" && level[a] === "x") {
                            counter += 1;
                        } else if (cinfo[a] === "end") {
                            counter -= 1;
                        } else if (cinfo[a] === "start" && level[a] !== "x") {
                            return level.push(level[a] + counter);
                        }
                        if (a === 0) {
                            if (cinfo[a] !== "start") {
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
                end         = function markup_beauty__algorithm_end() {
                    var xTester     = function markup_beauty__algorithm_end_xTester(a) {
                            for (a; a > 0; a -= 1) {
                                if (level[a] !== "x") {
                                    return level.push(level[a] + 1);
                                }
                            }
                        },
                        //If prior item is an end tag or content ending
                        //with space black box voodoo magic must occur.
                        computation = function markup_beauty__algorithm_end_computation() {
                            var a            = 0,
                                mixendTest   = false,
                                //This function finds the prior
                                //existing indented start tag.  This
                                //start tag may not be the current
                                //end tag's matching pair.  If the
                                //tag prior to this indented start
                                //tag is not an end tag this
                                //function escapes and later logic
                                //is used.
                                primary      = function markup_beauty__algorithm_end_computation_primary() {
                                    //mixAnalysis() is executed if the
                                    //prior indented start tag exists
                                    //directly after an end tag.
                                    //This function is necessary to
                                    //determine if indentation must
                                    //be subtracted from the prior
                                    //indented start tag.
                                    var b           = 0,
                                        mixAnalysis = function markup_beauty__algorithm_end_computation_primary_vooDoo() {
                                            var c       = 0,
                                                d       = 0,
                                                counter = 0;
                                            //Finds the prior start
                                            //tag followed by a
                                            //start tag where both
                                            //have indentation.
                                            //This creates a frame
                                            //of reference for
                                            //performing reflexive
                                            //calculation.
                                            for (c = i - 1; c > 0; c -= 1) {
                                                if ((cinfo[c] === "start" && cinfo[c + 1] === "start" && level[c] === level[c + 1] - 1) || (cinfo[c] === "start" && cinfo[c - 1] !== "start" && level[c] === level[c - 1])) {
                                                    break;
                                                }
                                            }
                                            //Incrementor is
                                            //increased if indented
                                            //content found followed
                                            //by unindented end tag
                                            //by looping up from the
                                            //frame of reference.
                                            for (d = c + 1; d < i; d += 1) {
                                                if (cinfo[d] === "mixed_start" && cinfo[d + 1] === "end") {
                                                    counter += 1;
                                                }
                                            }
                                            //If prior logic fails
                                            //and frame of reference
                                            //follows an indented
                                            //end tag the
                                            //incrementor is
                                            //increased.
                                            if (cinfo[c - 1] === "end" && level[c - 1] !== "x" && counter === 0) {
                                                counter += 1;
                                            }
                                            //All prior logic can
                                            //fail and so a
                                            //redundant check was
                                            //added.
                                            if (counter !== 0) {
                                                if (level[i - 1] === "x") {
                                                    return counter - 1;
                                                }
                                                return counter;
                                            }
                                            for (c; c < i; c += 1) {
                                                if (cinfo[c] === "start") {
                                                    counter += 1;
                                                } else if (cinfo[c] === "end") {
                                                    counter -= 1;
                                                }
                                            }
                                            return counter;
                                        };
                                    for (b = i - 1; b > 0; b -= 1) {
                                        if (cinfo[b] !== "mixed_end" || (cinfo[b] === "start" && level[b] !== "x")) {
                                            if (cinfo[b - 1] === "end") {
                                                mixendTest = true;
                                                if (cinfo[i - 1] === "mixed_both" && level[i - 1] === level[b] - mixAnalysis()) {
                                                    return level.push(level[b] - (mixAnalysis() + 1));
                                                }
                                                if (cinfo[i - 2] === "start" && (cinfo[i - 1] === "mixed_end" || cinfo[i - 1] === "mixed_both")) {
                                                    return level.push(level[b]);
                                                }
                                                if (level[b] !== "x") {
                                                    if (cinfo[b] === "mixed_both" && b !== i - mixAnalysis()) {
                                                        if (b === i - 1) {
                                                            return level.push(level[b] - 1);
                                                        }
                                                        return level.push(level[b] + mixAnalysis());
                                                    }
                                                    if (cinfo[i - 1] === "mixed_end" && mixAnalysis() === 0) {
                                                        return level.push(level[b] - 1);
                                                    }
                                                    if (level[i - 1] === "x" && (cinfo[i - 2] !== "end" || (cinfo[i - 2] === "end" && level[i - 2] !== "x"))) {
                                                        return level.push(level[b] + mixAnalysis());
                                                    }
                                                    return level.push(level[b] - mixAnalysis());
                                                }
                                            } else {
                                                mixendTest = false;
                                                return;
                                            }
                                        }
                                    }
                                },
                                //This seeks to find a frame of
                                //reference by looking for the first
                                //start tag outside a counted pair
                                //not counting the current end tag.
                                neutralStart = function markup_beauty__algorithm_end_computation_resultant() {
                                    var b       = 0,
                                        counter = 0;
                                    for (b = i; b > 0; b -= 1) {
                                        if (cinfo[b] === "end") {
                                            counter += 1;
                                        } else if (cinfo[b] === "start") {
                                            counter -= 1;
                                        }
                                        if (counter === 0) {
                                            return b;
                                        }
                                    }
                                };
                            //If the prior two elements are an empty
                            //pair.
                            if (cinfo[i - 1] === "end" && level[i - 1] !== "x") {
                                if (cinfo[i - 2] === "start" && level[i - 2] === "x") {
                                    for (a = i - 2; a > 0; a -= 1) {
                                        if (level[a] !== "x") {
                                            break;
                                        }
                                    }
                                    if (cinfo[a] === "start") {
                                        return commonStart("end");
                                    }
                                    return level.push(level[a] - 1);
                                }
                                if (cinfo[i - 2] === "start" && level[i - 2] !== "x") {
                                    return level.push(level[i - 2] - 1);
                                }
                                return level.push(level[i - 1] - 1);
                                //If the prior two elements are not
                                //an empty pair voodoo magic must
                                //occur.
                            }
                            //primary() makes a context decision based
                            //upon the placement of the current
                            //end tag relevant to the prior
                            //indented start tag.
                            primary();
                            if (mixendTest === true) {
                                return;
                            }
                            return (function markup_beauty__algorithm_end_computation_whenAllElseFails() {
                                var b       = 0,
                                    counter = 0;
                                for (b = neutralStart(); b > 0; b -= 1) {
                                    if (cinfo[b] === "start") {
                                        counter += 1;
                                    } else if (cinfo[b] === "end") {
                                        counter -= 1;
                                    }
                                    if (level[b] !== "x") {
                                        if (cinfo[b] === "end" && cinfo[b - 1] === "start" && level[b - 1] !== "x") {
                                            return level.push(level[b]);
                                        }
                                        if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "mixed_end" && (cinfo[i - 2] !== "end" || level[i - 2] !== "x") && (cinfo[i - 3] !== "end" || level[i - 3] !== "x")) {
                                            return level.push("x");
                                        }
                                        return level.push(level[b] + (counter - 1));
                                    }
                                }
                                counter = 0;
                                for (b = i; b > -1; b -= 1) {
                                    if (cinfo[b] === "start") {
                                        counter += 1;
                                    } else if (cinfo[b] === "end") {
                                        counter -= 1;
                                    }
                                }
                                return level.push(counter);
                            }());
                        };
                    if (cinfo[i - 1] === "end" || cinfo[i - 1] === "mixed_both" || cinfo[i - 1] === "mixed_end") {
                        return computation();
                    }
                    if (build[i].charAt(0) !== " " && (cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i - 1] === "comment" && (cinfo[i - 2] === "start" || (level[i - 1] === "x" && level[i - 2] === "x"))))) {
                        return level.push("x");
                    }
                    if (cinfo[i - 1] === "external") {
                        return (function markup_beauty__algorithm_end_external() {
                            var a       = 0,
                                counter = -1;
                            for (a = i - 2; a > 0; a -= 1) {
                                if (cinfo[a] === "start") {
                                    counter += 1;
                                } else if (cinfo[a] === "end") {
                                    counter -= 1;
                                }
                                if (level[a] !== "x") {
                                    break;
                                }
                            }
                            if (cinfo[a] === "end") {
                                counter += 1;
                            }
                            return level.push(level[a] + counter);
                        }());
                    }
                    if (build[i].charAt(0) !== " ") {
                        if (cinfo[i - 1] === "singleton" || cinfo[i - 1] === "content") {
                            return level.push("x");
                        }
                        return (function markup_beauty__algorithm_end_singletonContent() {
                            var a       = 0,
                                counter = 0;
                            for (a = i - 1; a > 0; a -= 1) {
                                //Find the previous indention and if not
                                //a start
                                if (cinfo[a] === "singleton" && level[a] === "x" && ((cinfo[a - 1] === "singleton" && level[a - 1] !== "x") || cinfo[a - 1] !== "singleton")) {
                                    counter += 1;
                                }
                                if (level[a] !== 0 && level[a] !== "x" && cinfo[i - 1] !== "start") {
                                    if (cinfo[a] === "mixed_both" || cinfo[a] === "mixed_start") {
                                        return level.push(level[a] - counter);
                                    }
                                    if (level[a] === counter || (cinfo[a] === "singleton" && (cinfo[a - 1] === "content" || cinfo[a - 1] === "mixed_start"))) {
                                        return level.push(level[a]);
                                    }
                                    return level.push(level[a] - 1);
                                    //Find the previous start that is
                                    //not indented
                                }
                                if (cinfo[a] === "start" && level[a] === "x") {
                                    return xTester(a);
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
                    return commonStart("end");
                },
                //This function is used by cinfo values of "start" and
                //"singleton" through the "g" function.
                startSafety = function markup_beauty__algorithm_startSafety() {
                    var e     = 0,
                        start = function markup_beauty__algorithm_startSafety_start(noComIndex) {
                            //The referenceFinder function is only a container.
                            //It sets the values of refA, refB, refC.  If not a
                            //comment refA = i - 1, and if not a comment
                            //refB = refA - i, and if not a comment
                            //refC = refB - 1.
                            var refA    = 0,
                                refB    = 0,
                                refC    = 0,
                                //This is executed if the prior non-comment
                                //item is not any form of content and is
                                //indented.
                                xTester = function markup_beauty__algorithm_start_complexity() {
                                    var a       = 0,
                                        xCount  = 1,
                                        counter = -1;
                                    for (a = refA; a > 0; a -= 1) {
                                        if (cinfo[a] === "start") {
                                            counter -= 1;
                                            if (level[a] === "x") {
                                                xCount += 1;
                                            }
                                        } else if (cinfo[a] === "end") {
                                            counter += 1;
                                            xCount  -= 1;
                                        }
                                        if (level[a] === 0) {
                                            refA = 0;
                                            for (refB = i - 1; refB > a; refB -= 1) {
                                                if (cinfo[refB] === "start") {
                                                    refA += 1;
                                                } else if (cinfo[refB] === "end") {
                                                    refA -= 1;
                                                }
                                            }
                                            if (refA > 0) {
                                                if (level[a + 1] === "x") {
                                                    return level.push((counter * -1) - 1);
                                                }
                                                if (cinfo[a] !== "external" && (mcomm !== "noindent" || (mcomm === "noindent" && cinfo[a] !== "comment"))) {
                                                    return level.push((counter + 1) * -1);
                                                }
                                            } else {
                                                for (refA = i - 1; refA > 0; refA -= 1) {
                                                    if (level[refA] !== "x") {
                                                        return level.push(level[refA]);
                                                    }
                                                }
                                            }
                                        }
                                        if (level[a] !== "x" && level[i - 1] !== "x") {
                                            if (cinfo[a] === "start" || cinfo[a] === "end") {
                                                return level.push(level[a] + xCount);
                                            }
                                            return level.push(level[a] + xCount - 1);
                                        }
                                        if (counter === -1 && level[a] === "x") {
                                            break;
                                        }
                                        if (counter === 1 && level[a] !== "x" && cinfo[a] !== "mixed_start" && cinfo[a] !== "content") {
                                            if (cinfo[a - 1] === "mixed_end" || (level[i - 1] === "x" && cinfo[i - 1] === "end" && cinfo[a] !== "end")) {
                                                return level.push(level[a] - counter - 1);
                                            }
                                            return level.push(level[a] - counter);
                                        }
                                        if (counter === 0 && level[a] !== "x") {
                                            return commonStart("start");
                                        }
                                    }
                                    return commonStart("start");
                                };
                            (function markup_beauty__algorithm_start_referrenceFinder() {
                                var a = 0;
                                if (noComIndex === 1) {
                                    refA = 0;
                                    refB = 0;
                                    refC = 0;
                                } else {
                                    for (a = noComIndex - 1; a > 0; a -= 1) {
                                        if (cinfo[a] !== "comment") {
                                            refA = a;
                                            break;
                                        }
                                    }
                                    if (refA === 1) {
                                        refB = 0;
                                        refC = 0;
                                    } else {
                                        for (a = refA - 1; a > 0; a -= 1) {
                                            if (cinfo[a] !== "comment") {
                                                refB = a;
                                                break;
                                            }
                                        }
                                        if (refB === 1) {
                                            refC = 0;
                                        } else {
                                            for (a = refB - 1; a > 0; a -= 1) {
                                                if (cinfo[a] !== "comment") {
                                                    refC = a;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }());
                            //A one time fail safe to prevent a referential
                            //anomoly.
                            if (i - 1 === 0 && cinfo[0] === "start" && (build[i].charAt(0) === " " || cinfo[i] !== "singleton")) {
                                return level.push(1);
                            }
                            //For a tag to become void of whitespace cushioning.
                            if (cinfo[refA] === "mixed_start" || cinfo[refA] === "content" || cinfo[i - 1] === "mixed_start" || cinfo[i - 1] === "content" || (cinfo[i] === "singleton" && (cinfo[i - 1] === "start" || cinfo[i - 1] === "singleton" || cinfo[i - 1] === "end") && build[i].charAt(0) !== " ")) {
                                return level.push("x");
                            }
                            //Simple regular tabbing
                            if ((cinfo[i - 1] === "comment" && level[i - 1] === 0) || ((cinfo[refC] === "mixed_start" || cinfo[refC] === "content") && cinfo[refB] === "end" && (cinfo[refA] === "mixed_end" || cinfo[refA] === "mixed_both"))) {
                                return commonStart("start");
                            }
                            //if the prior item is an indented comment then go
                            //with it
                            if (cinfo[i - 1] === "comment" && level[i - 1] !== "x") {
                                return level.push(level[i - 1]);
                            }
                            if (refA < i - 1 && ((cinfo[refA] === "start" && level[refA] === "x") || (cinfo[refA] !== "mixed_end" && cinfo[refA] !== "mixed_both" && level[refA] === "x"))) {
                                if (level[i - 1] === "x" && build[i].charAt(0) !== " " && cinfo[i - 1] !== "start" && build[i - 1].charAt(build[i - 1].length - 1) !== " ") {
                                    if ((cinfo[i - 1] === "end" && cinfo[i - 2] === "end") || (cinfo[i - 1] === "end" && cinfo[i] !== "end" && cinfo[i + 1] !== "mixed_start" && cinfo[i + 1] !== "content")) {
                                        return commonStart("start");
                                    }
                                    return level.push("x");
                                }
                                return xTester();
                            }
                            if (cinfo[refA] === "end" && level[refA] !== "x" && (cinfo[refA - 1] !== "start" || (cinfo[refA - 1] === "start" && level[refA - 1] !== "x"))) {
                                if (level[refA] < 0) {
                                    return commonStart("start");
                                }
                                return level.push(level[refA]);
                            }
                            if (cinfo[refC] !== "mixed_start" && cinfo[refC] !== "content" && (cinfo[refA] === "mixed_end" || cinfo[refA] === "mixed_both")) {
                                return (function markup_beauty__algorithm_start_notContentNotMixedstart() {
                                    var a          = 0,
                                        countEnd   = 0,
                                        countStart = 0,
                                        indexZero  = 0;
                                    for (a = refA; a > 0; a -= 1) {
                                        if (cinfo[a] === "end") {
                                            countEnd += 1;
                                        }
                                        if (cinfo[a] === "start") {
                                            countStart += 1;
                                        }
                                        if (level[a] === 0 && a !== 0) {
                                            indexZero = a;
                                        }
                                        if (cinfo[refA] === "mixed_both" && level[a] !== "x") {
                                            return level.push(level[a]);
                                        }
                                        if (cinfo[a] !== "comment" && cinfo[a] !== "content" && cinfo[a] !== "external" && cinfo[a] !== "mixed_end" && level[a] !== "x") {
                                            if (cinfo[a] === "start" && level[a] !== "x") {
                                                if (cinfo[i - 1] !== "end") {
                                                    return level.push(level[a] + (countStart - countEnd));
                                                }
                                                if ((level[a] === level[a - 1] && cinfo[a - 1] !== "end" && level[a + 1] !== "x") || (cinfo[i - 2] === "start" && level[i - 2] !== "x" && level[i - 1] === "x")) {
                                                    return level.push(level[a] + 1);
                                                }
                                                if (countStart <= 1) {
                                                    return level.push(level[a]);
                                                }
                                            } else if (countEnd > 0) {
                                                if (countStart > 1) {
                                                    if (indexZero !== 0) {
                                                        return commonStart("start");
                                                    }
                                                    return level.push(level[a] + 1);
                                                }
                                                return level.push(level[a] - countEnd + 1);
                                            }
                                            return level.push(level[a] + countStart);
                                        }
                                    }
                                    return commonStart("start");
                                }());
                            }
                            if (cinfo[refA] === "start" && level[refA] !== "x") {
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
                            return commonStart("start");
                        };
                    //This merely verifies if a singleton element is used as
                    //content.
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
                        start(i);
                    } else {
                        for (e = i - 1; e > 0; e -= 1) {
                            if (cinfo[e] !== "comment") {
                                break;
                            }
                        }
                        start(e + 1);
                    }
                };
            //This logic only serves to assign the previously defined
            //subfunctions to each of the cinfo values.
            (function markup_beauty__algorithm_loop() {
                var test        = false,
                    test1       = false,
                    svg         = false,
                    cdata       = [],
                    cdata1      = [],
                    cdataStart  = (/^(\s*(\/)*<\!\[+[A-Z]+\[+)/),
                    cdataEnd    = (/((\/)*\]+>\s*)$/),
                    scriptStart = (/^(\s*<\!\-\-)/),
                    scriptEnd   = (/(\-\->\s*)$/),
                    loop        = cinfo.length,
                    //attrib sorts attributes in start and singleton
                    //tags, but it must not execute before the inner
                    //array is consumed as in the function immediately
                    //prior
                    attrib      = function markup_beauty__algorithm_loop_attributeOrder(tag, end) {
                        var a           = 0,
                            attribute   = [],
                            tagLength   = 0,
                            starter     = "",
                            spaceAfter  = tag.indexOf(" ") + 1,
                            attribIndex = 0,
                            nameSpace   = "",
                            counter     = 0,
                            space       = (tag.charAt(0) === " ") ? " " : "",
                            //svg attributes receive special treatment
                            //because their values can be extremely long
                            joinchar    = (svg === true) ? "\n" + (function markup_beauty__algorithm_loop_attributeOrder_joinchar() {
                                var b       = 0,
                                    size    = msize,
                                    tabChar = mchar,
                                    output  = [],
                                    tab     = "";
                                for (b = 0; b < size; b += 1) {
                                    output.push(tabChar);
                                }
                                tab    = output.join("");
                                size   = level[i];
                                output = [];
                                for (b = 0; b < size; b += 1) {
                                    output.push(tab);
                                }
                                return output.join("") + tab;
                            }()) : " ";
                        if (space === " ") {
                            tag        = tag.substr(1);
                            spaceAfter = tag.indexOf(" ") + 1;
                        }
                        nameSpace = tag.substring(0, spaceAfter);
                        tagLength = tag.length;
                        tag       = tag.substring(spaceAfter, tagLength - end.length) + " ";
                        for (a = 0; a < tagLength; a += 1) {
                            if (starter === "") {
                                if (tag.charAt(a) === "\"") {
                                    starter = "\"";
                                } else if (tag.charAt(a) === "'") {
                                    starter = "'";
                                } else if (tag.charAt(a) === "[") {
                                    starter = "[";
                                    counter = 1;
                                } else if (tag.charAt(a) === "{") {
                                    starter = "{";
                                    counter = 1;
                                } else if (tag.charAt(a) === "(") {
                                    starter = "(";
                                    counter = 1;
                                } else if (tag.charAt(a) === "<" && tag.charAt(a + 1) === "%") {
                                    starter     = "<%";
                                    counter     = 1;
                                    attribIndex = a;
                                } else if (tag.charAt(a) === " " && counter === 0) {
                                    attribute.push(tag.substring(attribIndex, a));
                                    attribIndex = a + 1;
                                }
                            } else if (starter === "\"" && tag.charAt(a) === "\"") {
                                starter = "";
                            } else if (starter === "'" && tag.charAt(a) === "'") {
                                starter = "";
                            } else if (starter === "[") {
                                if (tag.charAt(a) === "]") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(a) === "[") {
                                    counter += 1;
                                }
                            } else if (starter === "{") {
                                if (tag.charAt(a) === "}") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(a) === "{") {
                                    counter += 1;
                                }
                            } else if (starter === "(") {
                                if (tag.charAt(a) === ")") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(a) === "(") {
                                    counter += 1;
                                }
                            } else if (starter === "<%") {
                                if (tag.charAt(a) === ">" && tag.charAt(a - 1) === "%") {
                                    counter -= 1;
                                    if (counter === 0) {
                                        starter = "";
                                    }
                                } else if (tag.charAt(a) === "<" && tag.charAt(a + 1) === "%") {
                                    counter += 1;
                                }
                            }
                        }
                        return space + nameSpace + attribute.sort().join(joinchar) + end;
                    };
                for (i = 0; i < loop; i += 1) {
                    test   = false;
                    test1  = false;
                    cdata  = [""];
                    cdata1 = [""];
                    if (build[i].indexOf("<svg") === 0 || build[i].indexOf(" <svg") === 0) {
                        svg = true;
                    } else if (build[i] === "</svg>" || build[i] === " </svg>") {
                        svg = false;
                    }
                    if (i === 0) {
                        level.push(0);
                    } else if (mforce === true) {
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
                        if ((/^(\s*<\!\-\-\s*\-\->(\s*))$/).test(build[i]) === true) {
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
                                startSafety();
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
                            startSafety();
                            if (scriptStart.test(build[i]) === true) {
                                test     = true;
                                build[i] = build[i].replace(scriptStart, "");
                            } else if (cdataStart.test(build[i]) === true) {
                                cdata    = cdataStart.exec(build[i]);
                                build[i] = build[i].replace(cdataStart, "");
                            }
                            if (scriptEnd.test(build[i]) === true && (/(\/\/\-\->\s*)$/).test(build[i]) === false) {
                                test1    = true;
                                build[i] = build[i].replace(scriptEnd, "");
                            } else if (cdataEnd.test(build[i]) === true) {
                                cdata1   = cdataEnd.exec(build[i]);
                                build[i] = build[i].replace(cdataEnd, "");
                            }
                            if (typeof jspretty === "function") {
                                build[i] = jspretty({
                                    source  : build[i],
                                    insize  : msize,
                                    inchar  : mchar,
                                    preserve: true,
                                    inlevel : level[i],
                                    space   : true,
                                    braces  : args.indent,
                                    comments: mcomm,
                                    varspace: mvarspace
                                });
                            }
                            if (test === true) {
                                build[i] = "<!--\n" + build[i];
                            } else if (cdata[0] !== "") {
                                build[i] = cdata[0] + "\n" + build[i];
                            }
                            if (test1 === true) {
                                level.push(level[i]);
                                build.splice(i + 1, 0, "-->");
                                cinfo.splice(i + 1, 0, "external");
                                token.splice(i + 1, 0, "T_content");
                                loop += 1;
                            } else if (cdata1[0] !== "") {
                                level.push(level[i]);
                                build.splice(i + 1, 0, cdata1[0]);
                                cinfo.splice(i + 1, 0, "external");
                                token.splice(i + 1, 0, "T_content");
                                loop += 1;
                            }
                            build[i] = build[i].replace(/(\/\/(\s)+\-\->(\s)*)$/, "//-->").replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                        } else if (token[i - 1] === "T_style") {
                            level.push(0);
                            if (scriptStart.test(build[i]) === true) {
                                test     = true;
                                build[i] = build[i].replace(scriptStart, "");
                            } else if (cdataStart.test(build[i]) === true) {
                                cdata    = cdataStart.exec(build[i]);
                                build[i] = build[i].replace(cdataStart, "");
                            }
                            if (scriptEnd.test(build[i]) === true && (/(\/\/\-\->\s*)$/).test(build[i]) === false) {
                                test1 = true;
                                build[i].replace(scriptEnd, "");
                            } else if (cdataEnd.test(build[i]) === true) {
                                cdata1   = cdataEnd.exec(build[i]);
                                build[i] = build[i].replace(cdataEnd, "");
                            }
                            if (typeof cleanCSS === "function") {
                                build[i] = cleanCSS({
                                    source   : build[i],
                                    size     : msize,
                                    character: mchar,
                                    comment  : mcomm,
                                    alter    : true
                                });
                            }
                            if (test === true) {
                                build[i] = "<!--\n" + build[i];
                            } else if (cdata[0] !== "") {
                                build[i] = cdata[0] + "\n" + build[i];
                            }
                            if (test1 === true) {
                                build[i] = build[i] + "\n-->";
                            } else if (cdata1[0] !== "") {
                                build[i] = build[i] + "\n" + cdata1[0];
                            }
                            build[i] = build[i].replace(/^(\s*)/, "").replace(/(\s*)$/, "");
                        }
                    } else {
                        if (cinfo[i] === "comment" && mcomm !== "noindent") {
                            if (build[i].charAt(0) === " ") {
                                startSafety();
                            } else {
                                level.push("x");
                            }
                        } else if (cinfo[i] === "comment" && mcomm === "noindent") {
                            level.push(0);
                        } else if (cinfo[i] === "content") {
                            level.push("x");
                        } else if (cinfo[i] === "parse") {
                            startSafety();
                        } else if (cinfo[i] === "mixed_both") {
                            //The next line merely removes the
                            //space at front and back
                            startSafety();
                        } else if (cinfo[i] === "mixed_start") {
                            //The next line removes space at the
                            //front
                            startSafety();
                        } else if (cinfo[i] === "mixed_end") {
                            //The next line removes the space at
                            //the end
                            build[i] = build[i].slice(0, build[i].length - 1);
                            level.push("x");
                        } else if (cinfo[i] === "start") {
                            if (svg === true && level[i - 1] !== "x" && (cinfo[i - 1] === "start" || (/^( ?<svg)/).test(build[i - 1]) === true)) {
                                level.push(level[i - 1] + 1);
                            } else {
                                startSafety();
                            }
                        } else if (cinfo[i] === "end") {
                            end();
                        } else if (cinfo[i] === "singleton") {
                            if (svg === true && level[i - 1] !== "x") {
                                if (cinfo[i - 1] === "start" || (/^( ?<svg)/).test(build[i - 1]) === true) {
                                    level.push(level[i - 1] + 1);
                                } else {
                                    level.push(level[i - 1]);
                                }
                            } else {
                                startSafety();
                            }
                        }
                    }
                    if ((cinfo[i] === "start" || cinfo[i] === "singleton") && token[i] !== "T_asp" && token[i] !== "T_php" && token[i] !== "T_ssi" && build[i].substr(1).indexOf(" ") > 0) {
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
            var i          = 0,
                end        = build.length,
                indents    = "",
                tab        = (function markup_beauty__apply_tab() {
                    var a       = 0,
                        size    = msize,
                        tabChar = mchar,
                        output  = [];
                    for (a = 0; a < size; a += 1) {
                        output.push(tabChar);
                    }
                    return output.join("");
                }()),
                comment    = function markup_beauty__apply_comment(item) {
                    var regress = {},
                        a       = i - 1;
                    if (level[a] === "x") {
                        do {
                            a -= 1;
                        } while (typeof level[a] !== "number");
                    }
                    regress = new RegExp("\n(" + tab + "){" + level[a] + "}", "g");
                    if (cinfo[i - 1] === "start" || (level[i - 1] === "x" && level[i] !== "x")) {
                        item = item.replace(tab, "");
                    }
                    return item.replace(regress, "\n").split("\n").join("\n" + indents);
                },
                //This function writes the standard indentation
                //output
                tab_math   = function markup_beauty__apply_indentation(item) {
                    var a       = 0,
                        b       = 0,
                        loopEnd = (typeof level[i] === "number") ? level[i] : 0,
                        square  = 0,
                        indent  = [],
                        parse   = [],
                        pad     = function markup_beauty__apply_indentation_pad() {
                            var ins     = indents,
                                squares = square;
                            if (squares === 0) {
                                return ins;
                            }
                            do {
                                ins     += tab;
                                squares -= 1;
                            } while (squares > 0);
                            return ins;
                        };
                    for (a = 0; a < loopEnd; a += 1) {
                        indent.push(tab);
                    }
                    if (cinfo[i] === "mixed_both" && mwrap === 0) {
                        item = item.slice(0, item.length - 1);
                    }
                    indents = indent.join("");
                    item    = "\n" + indents + item;
                    //This area beautifies multidimensional SGML tags
                    if (cinfo[i] === "parse" && (/\[\s*</).test(build[i])) {
                        build[i] = build[i].replace(/\[\s+</g, "[<");
                        parse    = build[i].split("");
                        loopEnd  = parse.length;
                        for (a = 0; a < loopEnd; a += 1) {
                            if (parse[a] === "[") {
                                square   += 1;
                                parse[a] = "[\n" + pad();
                            } else if (parse[a] === "]") {
                                square   -= 1;
                                parse[a] = "\n" + pad() + "]";
                            } else if (parse[a] === "<" && loopEnd > a + 3 && parse[a + 1] === "!" && parse[a + 2] === "-" && parse[a + 3] === "-") {
                                if (a === 0 || parse[a - 1].charAt(0) !== "[") {
                                    parse[a] = "\n" + pad() + "<";
                                }
                                for (b = a + 4; b < loopEnd; b += 1) {
                                    if (parse[b - 2] === "-" && parse[b - 1] === "-" && parse[b] === ">") {
                                        a = b;
                                        break;
                                    }
                                }
                            } else if (parse[a] === "<" && (a === 0 || parse[a - 1].charAt(0) !== "[")) {
                                parse[a] = "\n" + pad() + "<";
                            }
                        }

                        item = parse.join("").replace(/\s>/g, ">");
                    }
                    if (cinfo[i] === "comment" && build[i].indexOf("\n") > 0 && mcomm !== "noindent") {
                        item = comment(item);
                    }
                    return item;
                },
                //This function writes the indentation output for
                //cinfo values of "end".  This function is different
                //in that some end elements do not receive
                //indentation.
                end_math   = function markup_beauty__apply_end(item) {
                    var a      = 0,
                        b      = 0,
                        indent = [];
                    for (b = i; b > 0; b -= 1) {
                        if (level[b] !== "x") {
                            break;
                        }
                    }
                    for (a = 0; a < level[b]; a += 1) {
                        indent.push(tab);
                    }
                    item = "\n" + indent.join("") + item;
                    return item;
                },
                style_math = function markup_beauty__apply_style(item) {
                    var a       = 0,
                        b       = 0,
                        counter = 0,
                        ins     = "",
                        indent  = [];
                    if (level[i - 1] === "x") {
                        for (a = i - 1; a > 0; a -= 1) {
                            if (cinfo[a] === "start") {
                                counter += 1;
                            } else if (cinfo[a] === "end") {
                                counter -= 1;
                            }
                            if (level[a] !== "x") {
                                break;
                            }
                        }
                        if (cinfo[a] === "end") {
                            counter += 1;
                        }
                        for (b = 0; b < level[a] + counter; b += 1) {
                            indent.push(tab);
                        }
                    } else {
                        for (b = 0; b < level[i - 1] + 1; b += 1) {
                            indent.push(tab);
                        }
                    }
                    ins = indent.join("");
                    return "\n" + ins + item.replace(/\n(?!\n)/g, "\n" + ins);
                },
                text_wrap  = function markup_beauty__apply_wrap() {
                    var a                = 0,
                        itemLengthNative = 0,
                        item             = build[i].replace(/^(\s+)/, "").replace(/(\s+)$/, "").split(" "),
                        itemLength       = item.length - 1,
                        output           = [item[0]],
                        firstLen         = item[0].length,
                        ind              = (function markup_beauty__apply_wrap_ind() {
                            var b       = 0,
                                tabs    = [],
                                levels  = level[i],
                                counter = 0;
                            if (cinfo[i - 1] === "end" && level[i - 1] === "x") {
                                for (b = i - 1; b > -1; b -= 1) {
                                    if (cinfo[b] === "end") {
                                        counter += 1;
                                    }
                                    if (cinfo[b] === "start") {
                                        counter -= 1;
                                    }
                                    if (counter === -1 && cinfo[b] === "start") {
                                        if (i > b + 2 && level[b + 2] !== "x") {
                                            return indents;
                                        }
                                        return indents + tab;
                                    }

                                }
                            }
                            for (b = i - 1; b > -1; b -= 1) {
                                if (token[b] === "T_content" || (cinfo[b] === "end" && level[b] !== "x")) {
                                    if (cinfo[b] === "end" && level[i] !== "x" && level[i] !== indents.length / tab.length) {
                                        for (b = 0; b < levels; b += 1) {
                                            tabs.push(tab);
                                        }
                                        return tabs.join("");
                                    }
                                    return indents;
                                }
                                if (cinfo[b] !== "singleton" && cinfo[b] !== "end") {
                                    if (cinfo[b] === "start" && cinfo[b - 1] === "end" && b === i - 1 && level[b] === "x") {
                                        return indents;
                                    }
                                    return indents + tab;
                                }
                            }
                        }());
                    if (itemLength === 0) {
                        return;
                    }
                    if (level[i] === "x") {
                        for (a = i - 1; a > -1; a -= 1) {
                            if (level[a] !== "x") {
                                itemLengthNative += build[a].replace(indents, "").length;
                                break;
                            }
                            itemLengthNative += build[a].length;
                        }
                    }
                    firstLen += itemLengthNative;
                    if (itemLength > 0 && item[0] !== "") {
                        if (firstLen + item[1].length > mwrap) {
                            output.push("\n");
                            output.push(ind);
                            firstLen = 0;
                        } else {
                            output.push(" ");
                        }
                    }
                    for (a = 1; a < itemLength; a += 1) {
                        output.push(item[a]);
                        if (item[a].length + item[a + 1].length + 1 + firstLen > mwrap) {
                            output.push("\n");
                            output.push(ind);
                            firstLen = 0;
                        } else {
                            output.push(" ");
                            firstLen += 1 + item[a].length;
                        }
                    }
                    if (output.length > 1) {
                        output.pop();
                    }
                    if (output[output.length - 1] !== "\n" && i < end - 1 && level[i + 1] === "x") {
                        firstLen += build[i + 1].length;
                    }
                    if (firstLen + item[itemLength].length > mwrap) {
                        output.push("\n");
                        output.push(ind);
                    } else if (firstLen === 0) {
                        output.push(ind);
                    } else {
                        output.push(" ");
                    }
                    output.push(item[itemLength]);
                    build[i] = output.join("");
                };
            //This is the logic for assigning execution of the prior
            //three functions.
            for (i = 0; i < end; i += 1) {
                if (mwrap > 0 && (cinfo[i] === "content" || cinfo[i] === "mixed_start" || cinfo[i] === "mixed_both" || cinfo[i] === "mixed_end")) {
                    text_wrap(build[i]);
                }
                if (build[i] === "</prettydiffli>" || build[i] === " </prettydiffli>") {
                    build[i] = "";
                } else if (cinfo[i] === "end" && (mforce === true || (cinfo[i - 1] !== "content" && cinfo[i - 1] !== "mixed_start"))) {
                    if (build[i].charAt(0) === " ") {
                        build[i] = build[i].substr(1);
                    }
                    if (level[i] !== "x" && cinfo[i - 1] !== "start") {
                        build[i] = end_math(build[i]);
                    }
                } else if (cinfo[i] === "external" && mstyle === "indent" && build[i - 1].toLowerCase().indexOf("<style") > -1) {
                    build[i] = style_math(build[i]);
                } else if (level[i] !== "x" && (cinfo[i - 1] !== "content" && (cinfo[i - 1] !== "mixed_start" || mforce === true))) {
                    if (build[i].charAt(0) === " ") {
                        build[i] = build[i].substr(1);
                    }
                    build[i] = tab_math(build[i]);
                } else if (cinfo[i] === "comment" && build[i].indexOf("\n") > 0 && mcomm !== "noindent" && level[i] === "x") {
                    build[i] = comment(build[i]);
                }
            }
        }());
        if (summary !== "diff") {
            (function markup_beauty__report() {
                var requests        = [],
                    lengthToken     = sum.length,
                    lengthChars     = sum.join("").length,
                    stats           = (function markup_beauty__report_tagTypesCount() {
                        var a          = 0,
                            types      = [
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                            ],
                            chars      = [
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                            ],
                            totalTypes = [
                                0, 0, 0, 0
                            ],
                            totalChars = [],
                            avgTypes   = [],
                            avgChars   = [];
                        for (a = 0; a < lengthToken; a += 1) {
                            switch (cinfo[a]) {
                            case "end":
                                types[1]      += 1;
                                totalTypes[0] += 1;
                                chars[1]      += sum[a].length;
                                if (sum[a].charAt(0) === " " && cinfo[a - 1] === "singleton") {
                                    chars[1] -= 1;
                                    chars[2] += 1;
                                }
                                break;
                            case "singleton":
                                types[2]      += 1;
                                totalTypes[0] += 1;
                                chars[2]      += sum[a].length;
                                if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                    requests.push(build[a]);
                                }
                                break;
                            case "comment":
                                types[3]      += 1;
                                totalTypes[0] += 1;
                                chars[3]      += sum[a].length;
                                break;
                            case "content":
                                types[4]      += 1;
                                totalTypes[1] += 1;
                                chars[4]      += sum[a].length;
                                break;
                            case "mixed_start":
                                types[5]      += 1;
                                totalTypes[1] += 1;
                                chars[5]      += (sum[a].length - 1);
                                break;
                            case "mixed_end":
                                types[6]      += 1;
                                totalTypes[1] += 1;
                                chars[6]      += (sum[a].length - 1);
                                break;
                            case "mixed_both":
                                types[7]      += 1;
                                totalTypes[1] += 1;
                                chars[7]      += (sum[a].length - 2);
                                break;
                            case "parse":
                                types[10] += 1;
                                chars[10] += sum[a].length;
                                break;
                            case "external":
                                types[17]     += 1;
                                totalTypes[2] += 1;
                                chars[17]     += sum[a].length;
                                if (((build[a].indexOf("<script") !== -1 || build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                    requests.push(build[a]);
                                }
                                break;
                            default:
                                switch (token[a]) {
                                case "T_tag_start":
                                    types[0]      += 1;
                                    totalTypes[0] += 1;
                                    chars[0]      += sum[a].length;
                                    if (((build[a].indexOf("<embed ") !== -1 || build[a].indexOf("<img ") !== -1 || build[a].indexOf("<iframe ") !== -1) && (build[a].indexOf("src") !== -1 && build[a].indexOf("src=\"\"") === -1 && build[a].indexOf("src=''") === -1)) || (build[a].indexOf("<link ") !== -1 && build[a].indexOf("rel") !== -1 && build[a].indexOf("canonical") === -1)) {
                                        requests.push(build[a]);
                                    }
                                    break;
                                case "T_sgml":
                                    types[8] += 1;
                                    chars[8] += sum[a].length;
                                    break;
                                case "T_xml":
                                    types[9] += 1;
                                    chars[9] += sum[a].length;
                                    break;
                                case "T_ssi":
                                    types[11]     += 1;
                                    totalTypes[3] += 1;
                                    chars[11]     += sum[a].length;
                                    break;
                                case "T_asp":
                                    types[12]     += 1;
                                    totalTypes[3] += 1;
                                    chars[12]     += sum[a].length;
                                    break;
                                case "T_php":
                                    types[13]     += 1;
                                    totalTypes[3] += 1;
                                    chars[13]     += sum[a].length;
                                    break;
                                case "T_script":
                                    types[15]     += 1;
                                    totalTypes[2] += 1;
                                    chars[15]     += sum[a].length;
                                    if (build[a].indexOf(" src") !== -1) {
                                        requests.push(build[a]);
                                    }
                                    break;
                                case "T_style":
                                    types[16]     += 1;
                                    totalTypes[2] += 1;
                                    chars[16]     += sum[a].length;
                                    break;
                                }
                            }
                        }
                        totalChars.push(chars[0] + chars[1] + chars[2] + chars[3]);
                        totalChars.push(chars[4] + chars[5] + chars[6] + chars[7]);
                        totalChars.push(chars[15] + chars[16] + chars[17]);
                        totalChars.push(chars[11] + chars[12] + chars[13]);
                        avgTypes = [
                            totalTypes[0], totalTypes[0], totalTypes[0], totalTypes[0], totalTypes[1], totalTypes[1], totalTypes[1], totalTypes[1], types[10], types[10], types[10], totalTypes[3], totalTypes[3], totalTypes[3], totalTypes[3], totalTypes[2], totalTypes[2], totalTypes[2]
                        ];
                        avgChars = [
                            totalChars[0], totalChars[0], totalChars[0], totalChars[0], totalChars[1], totalChars[1], totalChars[1], totalChars[1], chars[10], chars[10], chars[10], totalChars[3], totalChars[3], totalChars[3], totalChars[3], totalChars[2], totalChars[2], totalChars[2]
                        ];
                        types[2] = types[2] - totalTypes[3];
                        chars[2] = chars[2] - totalChars[3];
                        return [
                            types, chars, totalTypes, totalChars, avgTypes, avgChars
                        ];
                    }()),
                    goodOrBad       = function markup_beauty__report_goodOrBad(x) {
                        var extreme1 = function markup_beauty__report_goodOrBad_extreme1(x) {
                                if (stats[3][x] === 0) {
                                    return "0.00%";
                                }
                                return "100.00%";
                            },
                            extreme2 = function markup_beauty__report_goodOrBad_extreme2(x) {
                                if (stats[2][x] === 0) {
                                    return "0.00%";
                                }
                                return "100.00%";
                            },
                            output   = [],
                            types    = "",
                            chars    = "";
                        switch (x) {
                        case 0:
                            if ((stats[2][x] / lengthToken) < 0.7) {
                                types = "bad";
                            } else {
                                types = "good";
                            }
                            if ((stats[3][x] / lengthChars) > 0.4) {
                                chars = "bad";
                            } else {
                                chars = "good";
                            }
                            break;
                        case 1:
                            if ((stats[2][x] / lengthToken) < 0.25) {
                                types = "bad";
                            } else {
                                types = "good";
                            }
                            if ((stats[3][x] / lengthChars) < 0.6) {
                                chars = "bad";
                            } else {
                                chars = "good";
                            }
                            break;
                        case 2:
                            if ((stats[2][x] / lengthToken) > 0.05) {
                                types = "bad";
                            } else {
                                types = "good";
                            }
                            if ((stats[3][x] / lengthChars) > 0.05) {
                                chars = "bad";
                            } else {
                                chars = "good";
                            }
                            break;
                        }
                        output = ["</th><td>"];
                        output.push(stats[2][x]);
                        output.push("</td><td>");
                        output.push(extreme2(x));
                        output.push("</td><td class='");
                        output.push(types);
                        output.push("'>");
                        output.push(((stats[2][x] / lengthToken) * 100).toFixed(2));
                        output.push("%</td><td>");
                        output.push(stats[3][x]);
                        output.push("</td><td>");
                        output.push(extreme1(x));
                        output.push("</td><td class='");
                        output.push(chars);
                        output.push("'>");
                        output.push(((stats[3][x] / lengthChars) * 100).toFixed(2));
                        output.push("%</td></tr>");
                        return output.join("");
                    },
                    tables          = (function markup_beauty__report_buildOutput() {
                        var a             = 0,
                            requestOutput = "",
                            requestList   = [],
                            requestItem   = [],
                            requestLength = requests.length,
                            resultsTable  = (function markup_beauty__report_buildOutput_resultTable() {
                                var b            = 0,
                                    output       = [
                                        "*** Start Tags", "End Tags", "Singleton Tags", "Comments", "Flat String", "String with Space at Start", "String with Space at End", "String with Space at Start and End", "SGML", "XML", "Total Parsing Declarations", "SSI", "ASP", "PHP", "Total Server Side Tags", "*** Script Tags", "*** Style Tags", "JavaScript/CSS Code"
                                    ],
                                    section      = [],
                                    percentTypes = "",
                                    percentChars = "",
                                    length       = stats[0].length;
                                for (b = 0; b < length; b += 1) {
                                    if (stats[4][b] === 0) {
                                        percentTypes = "0.00%";
                                    } else if (stats[0][b] === stats[4][b]) {
                                        percentTypes = "100.00%";
                                    } else {
                                        percentTypes = ((stats[0][b] / stats[4][b]) * 100).toFixed(2) + "%";
                                    }
                                    if (stats[5][b] === 0) {
                                        percentChars = "0.00%";
                                    } else if (stats[1][b] === stats[5][b]) {
                                        percentChars = "100.00%";
                                    } else {
                                        percentChars = ((stats[1][b] / stats[5][b]) * 100).toFixed(2) + "%";
                                    }
                                    section = ["<tr><th>" + output[b]];
                                    section.push("</th><td>");
                                    section.push(stats[0][b]);
                                    section.push("</td><td>");
                                    section.push(percentTypes);
                                    section.push("</td><td>");
                                    section.push(((stats[0][b] / lengthToken) * 100).toFixed(2));
                                    section.push("%</td><td>");
                                    section.push(stats[1][b]);
                                    section.push("</td><td>");
                                    section.push(percentChars);
                                    section.push("</td><td>");
                                    section.push(((stats[1][b] / lengthChars) * 100).toFixed(2));
                                    section.push("%</td></tr>");
                                    if (b === 3) {
                                        section.push("<tr><th>Total Common Tags");
                                        section.push(goodOrBad(0));
                                        section.push("<tr><th colspan='7'>Content</th></tr>");
                                    } else if (b === 7) {
                                        section.push("<tr><th>Total Content");
                                        section.push(goodOrBad(1));
                                        section.push("<tr><th colspan='7'>Parsing Declarations</th></tr>");
                                    } else if (b === 10) {
                                        section.push("<tr><th colspan='7'>Server Side Tags</th></tr>");
                                    } else if (b === 14) {
                                        section.push("<tr><th colspan='7'>Style and Script Code/Tags</th></tr>");
                                    } else if (b === 17) {
                                        section.push("<tr><th>Total Script and Style Tags/Code");
                                        section.push(goodOrBad(2));
                                    }
                                    output[b] = section.join("");
                                }
                                return output.join("");
                            }()),
                            report        = ["<div id='doc'>"];
                        report.push((function markup_beauty__report_buildOutput_content() {
                            var b            = 0,
                                c            = 0,
                                d            = 0,
                                length       = lengthToken,
                                words        = [],
                                word         = "",
                                zipf         = [],
                                wordCount    = 0,
                                spacer       = [],
                                wordAnalyzer = [],
                                topTen       = [],
                                ratio        = [],
                                wordList     = [],
                                wordString   = "",
                                punctuation  = function markup_beauty__report_buildOutput_punctuation(y) {
                                    return y.replace(/(\,|\.|\?|\!|\:) /, " ");
                                };
                            for (b = 0; b < length; b += 1) {
                                if (cinfo[b] === "content") {
                                    spacer.push(" ");
                                    spacer.push(build[b]);
                                } else if (cinfo[b] === "mixed_start") {
                                    spacer.push(build[b]);
                                } else if (cinfo[b] === "mixed_both") {
                                    spacer.push(build[b].substr(0, build[b].length));
                                } else if (cinfo[b] === "mixed_end") {
                                    spacer.push(" ");
                                    spacer.push(build[b].substr(0, build[b].length));
                                }
                            }
                            wordString = spacer.join("");
                            if (wordString.length === 0) {
                                return "";
                            }
                            wordString = wordString.substr(1, wordString.length).toLowerCase();
                            wordList   = wordString.replace(/\&nbsp;?/gi, " ").replace(/[a-z](\,|\.|\?|\!|\:) /gi, punctuation).replace(/(\(|\)|"|\{|\}|\[|\])/g, "").replace(/\s+/g, " ").split(" ");
                            length     = wordList.length;
                            for (b = 0; b < length; b += 1) {
                                if (wordList[b] !== "") {
                                    words.push([
                                        1, wordList[b].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                                    ]);
                                    wordCount += 1;
                                    for (c = b + 1; c < length; c += 1) {
                                        if (wordList[c] === wordList[b]) {
                                            words[words.length - 1][0] += 1;
                                            wordList[c]                = "";
                                            wordCount                  += 1;
                                        }
                                    }
                                }
                            }
                            length = words.length;
                            for (b = 0; b < length; b += 1) {
                                d = b;
                                for (c = b + 1; c < length; c += 1) {
                                    if (words[c][0] > words[d][0] && words[c][1] !== "") {
                                        d = c;
                                    }
                                }
                                word = words[d][1];
                                if (word.length < 3 || word.length > 30 || (/&\#?\w+;/).test(word) === true || word === "the" || word === "and" || word === "for" || word === "are" || word === "this" || word === "from" || word === "with" || word === "that" || word === "to") {
                                    wordAnalyzer.push(words[d]);
                                } else {
                                    wordAnalyzer.push(words[d]);
                                    topTen.push(words[d]);
                                }
                                if (words[d] !== words[b]) {
                                    words[d] = words[b];
                                } else {
                                    words[d] = [
                                        0, ""
                                    ];
                                }
                                if (topTen.length === 11) {
                                    break;
                                }
                            }
                            if (wordAnalyzer.length < 2) {
                                return "";
                            }
                            c = wordAnalyzer.length;
                            for (b = 0; b < c; b += 1) {
                                if (b > 9) {
                                    wordAnalyzer[b] = "";
                                } else {
                                    ratio[b]        = (wordAnalyzer[b + 1]) ? (wordAnalyzer[b][0] / wordAnalyzer[b + 1][0]).toFixed(2) : "1.00";
                                    wordAnalyzer[b] = "<tr><th>" + (b + 1) + "</th><td>" + wordAnalyzer[b][1] + "</td><td>" + wordAnalyzer[b][0] + "</td><td>" + ratio[b] + "</td><td>" + ((wordAnalyzer[b][0] / wordCount) * 100).toFixed(2) + "%</td></tr>";
                                }
                            }
                            if (wordAnalyzer[10]) {
                                wordAnalyzer[10] = "";
                            }
                            if (topTen.length > 10) {
                                c = 10;
                            } else {
                                c = topTen.length;
                            }
                            ratio = [];
                            for (b = 0; b < c; b += 1) {
                                ratio[b]  = (topTen[b + 1]) ? (topTen[b][0] / topTen[b + 1][0]).toFixed(2) : "1.00";
                                topTen[b] = "<tr><th>" + (b + 1) + "</th><td>" + topTen[b][1] + "</td><td>" + topTen[b][0] + "</td><td>" + ratio[b] + "</td><td>" + ((topTen[b][0] / wordCount) * 100).toFixed(2) + "%</td></tr>";
                            }
                            if (topTen[10]) {
                                topTen[10] = "";
                            }
                            if (c > 10) {
                                topTen[topTen.length - 1] = "";
                            }
                            zipf.push("<table class='analysis' summary='Zipf&#39;s Law'><caption>This table demonstrates <em>Zipf&#39;s Law</em> by listing the 10 most occuring words in the content and the number of times they occurred.</caption>");
                            zipf.push("<thead><tr><th>Word Rank</th><th>Most Occurring Word by Rank</th><th>Number of Instances</th><th>Ratio Increased Over Next Most Frequence Occurance</th><th>Percentage from ");
                            zipf.push(wordCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                            if (wordCount > 1) {
                                zipf.push(" Total");
                            }
                            zipf.push(" Word");
                            if (wordCount > 1) {
                                zipf.push("s");
                            }
                            word       = wordAnalyzer.join("");
                            wordString = topTen.join("");
                            zipf.push("</th></tr></thead><tbody><tr><th colspan='5'>Unfiltered Word Set</th></tr>");
                            zipf.push(word);
                            if (word !== wordString && topTen.length > 2) {
                                zipf.push("<tr><th colspan='5'>Filtered Word Set</th></tr>");
                                zipf.push(wordString);
                            }
                            zipf.push("</tbody></table>");
                            return zipf.join("");
                        }()));
                        report.push("<table class='analysis' summary='Analysis of markup pieces.'><caption>Analysis of markup pieces.</caption><thead><tr><th>Type</th><th>Quantity of Tags/Content</th><th>Percentage Quantity in Section</th><th>Percentage Quantity of Total</th><th>** Character Size</th><th>Percentage Size in Section</th><th>Percentage Size of Total</th></tr></thead><tbody><tr><th>Total Pieces</th><td>");
                        report.push(lengthToken);
                        report.push("</td><td>100.00%</td><td>100.00%</td><td>");
                        report.push(lengthChars);
                        report.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Common Tags</th></tr>");
                        report.push(resultsTable);
                        requestList = [];
                        for (a = 0; a < requestLength; a += 1) {
                            if (requests[a] !== undefined) {
                                requestItem = ["<li>"];
                                requestItem.push(requests[a].replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;"));
                                requestItem.push("</li>");
                                requestList[a] = requestItem.join("");
                            }
                        }
                        if (requestList.length > 0) {
                            requestOutput = "<h4>HTML elements making HTTP requests:</h4><ul>" + requestList.join("") + "</ul>";
                        } else {
                            requestOutput = "";
                        }
                        report.push("</tbody></table></div><p>* The number of requests is determined from the input submitted only and does not count the additional HTTP requests supplied from dynamically executed code, frames, iframes, css, or other external entities.</p><p>**");
                        report.push("Character size is measured from the individual pieces of tags and content specifically between minification and beautification.</p><p>*** The number of starting &lt;script&gt; and &lt;style&gt; tags is subtracted from the total number of start tags.");
                        report.push("The combination of those three values from the table above should equal the number of end tags or the code is in error.</p>");
                        report.push(requestOutput);
                        return report.join("");
                    }()),
                    score           = (function markup_beauty__report_efficiencyScore() {
                        var charMath    = lengthChars / 7500,
                            charFixed   = Number(charMath.toFixed(2)),
                            reqLen      = requests.length,
                            reduction   = 0,
                            output      = ["<p>If the input is content it receives an efficiency score of <strong>"],
                            normScript  = "",
                            normContent = "",
                            appScript   = "",
                            appContent  = "",
                            ratioMath   = function markup_beauty__report_ratios(x, y) {
                                return (((stats[3][0] + x) / lengthChars) / ((stats[3][1] * y) / lengthChars));
                            };
                        if (charMath > 0) {
                            charMath = (reqLen - charFixed) * 4;
                        } else {
                            charMath = 0;
                        }
                        if (stats[3][1] === 0) {
                            stats[2][1] = 0.00000001;
                            stats[3][1] = 0.00000001;
                        }
                        reduction   = (((stats[2][0] + stats[2][2] - charFixed) / lengthToken) / (stats[2][1] / lengthToken));
                        normScript  = (reduction / ratioMath(stats[3][2], 1)).toPrecision(2);
                        normContent = (reduction / ratioMath(stats[1][15], 1)).toPrecision(2);
                        appScript   = (reduction / ratioMath(stats[3][2], 4)).toPrecision(2);
                        appContent  = (reduction / ratioMath(stats[1][15], 4)).toPrecision(2);
                        if (normScript === normContent) {
                            normContent = "";
                            appContent  = "";
                        } else {
                            normContent = ", or <strong>" + normContent + "</strong> if inline script code and style tags are removed";
                            appContent  = ", or <strong>" + appContent + "</strong> if inline script code and style tags are removed";
                        }
                        output.push(normScript);
                        output.push("</strong>");
                        output.push(normContent);
                        output.push(". The efficiency score if this input is a large form or application is <strong>");
                        output.push(appScript);
                        output.push("</strong>");
                        output.push(appContent);
                        output.push(". Efficient markup achieves scores higher than 2.00 and excellent markup achieves scores higher than 4.00. The score reflects the highest number of tags to pieces of content where the weight of those tags is as small as possible compared to the weight of the content.");
                        output.push("The score is a performance metric only and is not associated with validity or well-formedness, but semantic code typically achieves the highest scores. All values are rounded to the nearest hundreth.</p><p><strong>Total input size:</strong> <em>");
                        output.push(args.source.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                        output.push("</em> characters</p><p><strong>Total output size:</strong> <em>");
                        output.push(build.join("").length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
                        output.push("</em> characters</p><p><strong>* Total number of HTTP requests in supplied HTML:</strong> <em>");
                        output.push(reqLen);
                        output.push("</em></p>");
                        return output.join("");
                    }()),
                    summaryLanguage = (function markup_beauty__report_summary() {
                        var startTags = 0,
                            output    = ["<p><strong>"],
                            plural    = "";
                        if (stats[0][0] + stats[0][15] + stats[0][16] !== stats[0][1]) {
                            plural    = "s";
                            startTags = (stats[0][0] + stats[0][15] + stats[0][16]) - stats[0][1];
                            if (startTags > 0) {
                                if (startTags === 1) {
                                    plural = "";
                                }
                                output.push(startTags);
                                output.push(" more start tag");
                                output.push(plural);
                                output.push(" than end tag");
                                output.push(plural);
                                output.push("!");
                            } else {
                                if (startTags === -1) {
                                    plural = "";
                                }
                                output.push(startTags * -1);
                                output.push(" more end tag");
                                output.push(plural);
                                output.push(" than start tag");
                                output.push(plural);
                                output.push("!");
                            }
                            output.push("</strong> The combined total number of start tags, script tags, and style tags should equal the number of end tags. For HTML this problem may be solved by selecting the '<em>Presume SGML type HTML</em>' option.</p>");
                        } else {
                            return "";
                        }
                        return output.join("");
                    }());
                summary = summaryLanguage + score + tables;
            }());
        }
        return build.join("").replace(/^\s+/, "");
    };