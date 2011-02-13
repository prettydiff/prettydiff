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
***********************************************************************/

/*
This code merely returns code transformed by csvbeauty back into its
former state.
*/
var csvmin = function (source, ch) {
    "use strict";
    var a, b, c, err, d = "",
    error = "Error: Unterminated String begging at character number ",
    src = function () {
        for (a = 0; a < source.length; a += 1) {
            c = [];
            if (source[a].indexOf("\"") !== -1) {
                source[a] = source[a].split("");
                for (b = 0; b < source[a].length; b += 1) {
                    if (source[a][b] === "\"") {
                        c.push(b);
                    }
                }
                if (c.length === 1) {
                    d = error;
                    source[a] = source[a].join("");
                    err = source[a].slice(c[0], c[0] + 9);
                    return;
                } else if (c.length > 2) {
                    for (d = 1; d < c.length - 1; d += 1) {
                        source[a][c[d]] = "\"\"";
                    }
                }
                source[a] = source[a].join("");
            }
        }
	},
    multiline = function (x) {
                    var w = [],
                        y,
                        z = x.length - 2;
                    if (x.length === 2) {
                        return "{ }";
                    } else {
                        for (y = 0; y < z; y += 1) {
                            w.push(ch);
                        }
                        return w.join('') + "{ }";
                    }
                };
            if (ch === "") {
                ch = ",";
            } else {
                ch = charDecoder(ch);
            }
            source = source.replace(/\n\n\{\-\}\n\n/g, "{-}").replace(/\n{2,}/g, multiline).split("\n");
            src();
    if (d === error) {
        return error + (source.join(ch).indexOf(source[a]) + c[0]) + " or value number " + (a + 1) + ", '" + err + "'.";
    }
    if (source[source.length - 1] === "{|}") {
                source[source.length - 1] = "";
            }
            source = source.join(ch).replace(/\n/g, ch);
            do {
        source = source.replace("{ }", "\n");
    } while (source.indexOf("{ }") !== -1);
    source = source.replace(/\n{2}/g, "\n");
    if (source.indexOf("{|}") === source.length - 3) {
        source = source.slice(0, source.length - 3) + ch;
    }
    return source.replace(/\{\-\}/g, "\n");
};