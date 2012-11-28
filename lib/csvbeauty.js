/*global charDecoder*/
/*
 This code may be used internally to Travelocity without limitation,
 exclusion, or restriction.  If this code is used externally the
 following comment must be included everywhere this code is used.
 */

/***********************************************************************
 This is written by Austin Cheney on 21 Apr 2010.  Anybody may use this
 code without permission so long as this comment exists verbatim in each
 instance of its use.

 http://www.travelocity.com/
 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/

/*
 This code beautifies character separated values into new lines at each
 split in the output.  Prior existing new lines are converted into
 braces containing a space if the prior existing new line was quoted.
 Unquoted new lines are converted to two sequential new lines.  In CSV
 format double quote characters are syntax characters.  To exist as
 string literals they must be contained in a string that is wrapped in
 double quote characters and must be escaped by immediately following
 double quote character with another double quote character.  This
 function replaces the two simultaneous double quote characters with a
 single double quote character for ledgibility.  The charDecoder
 function is used on the separating character sequence to convert any
 sequence of decimal and hexidecimal Unicode character entities into
 character literals.
 */

var csvbeauty = function csvbeauty(source, ch) {
        "use strict";
        var err = "",
            a = 0,
            b = 0,
            c = [],
            error = "Error: Unterminated string begging at character number ";
        (function csvbeauty__logic() {
            var b = 0,
                d = 0,
                e = 0,
                src = "";
            source = source.replace(/"{2}/g, "{csvquote}");
            src = source;
            source = source.split("");
            e = source.length;
            for (a = 0; a < e; a += 1) {
                if (source[a] === "\"") {
                    d = source.length;
                    for (b = a + 1; b < d; b += 1) {
                        if (source[b] === "\"") {
                            c.push(src.slice(a, b + 1));
                            source[a] = "{csvstring}";
                            source[b] = "";
                            a = b + 1;
                            break;
                        }
                        source[b] = "";
                    }
                    if (b === source.length) {
                        err = source.join("").slice(a, a + 9);
                        source = error;
                        return;
                    }
                }
            }
            source = source.join("").replace(/\{csvquote\}/g, "\"\"");
        }());
        if (ch === "") {
            ch = ",";
        } else {
            ch = charDecoder(ch);
        }
        if (ch.length > source.length) {
            return source;
        }
        if (source === error) {
            if (a !== source.length - 1) {
                return source + a + ", '" + err + "'.";
            }
            return source + a + ".";
        }
        source = source.replace(/\n/g, "\n\n{-}\n\n");
        if (source.charAt(source.length - ch.length) === ch) {
            source = source.slice(0, source.length + 1 - ch.length) + "{|}";
        }
        do {
            source = source.replace(ch, "\n");
        } while (source.indexOf(ch) !== -1);
        b = c.length;
        for (a = 0; a < b; a += 1) {
            c[a] = c[a].replace(/\n/g, "{ }");
            source = source.replace("{csvstring}", c[a]);
        }
        return source.replace(/\{csvquote\}/g, "\"");
    };