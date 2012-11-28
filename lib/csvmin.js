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
 This code merely returns code transformed by csvbeauty back into its
 former state.
 */
/*global charDecoder*/
/*
 This code may be used internally to Travelocity without limitation,
 exclusion, or restriction.  If this code is used externally the
 following comment must be included everywhere this code is used.
 */

/*
 This code merely returns code transformed by csvbeauty back into its
 former state.
 */
var csvmin = function csvmin(source, ch) {
        "use strict";
        if (ch === "") {
            ch = ",";
        } else {
            ch = charDecoder(ch);
        }
        (function csvmin__logic() {
            var multiline = function csvmin__logic_multiline(x) {
                    var w = [],
                        y = 0,
                        z = x.length - 2;
                    if (x.length === 2) {
                        return "{ }";
                    }
                    for (y = 0; y < z; y += 1) {
                        w.push(ch);
                    }
                    return w.join("") + "{ }";
                },
                a = 0,
                c = [],
                d = "",
                e = 0,
                f = [],
                g = source.replace(/\n\n\{\-\}\n\n/g, "{-}").replace(/\n{2,}/g, multiline).split("\n"),
                b = g.length,
                err = "",
                error = "Error: Unterminated String begging at character number ";
            for (a = 0; a < b; a += 1) {
                c = [];
                if (typeof g[a] === "string" && g[a].indexOf("\"") !== -1) {
                    f = g[a].split("");
                    e = f.length;
                    for (b = 0; b < e; b += 1) {
                        if (f[b] === "\"") {
                            c.push(b);
                        }
                    }
                    if (c.length === 1) {
                        d = error;
                        g[a] = f.join("");
                        err = g[a].slice(c[0], c[0] + 9);
                        return;
                    }
                    if (c.length > 2) {
                        e = c.length - 1;
                        for (d = 1; d < e; d += 1) {
                            f[c[d]] = "\"\"";
                        }
                    }
                    g[a] = f.join("");
                }
            }
            if (d === error) {
                return error + (g.join(ch).indexOf(g[a]) + c[0]) + " or value number " + (a + 1) + ", '" + err + "'.";
            }
            if (g[g.length - 1] === "{|}") {
                g[g.length - 1] = "";
            }
            source = g.join(ch).replace(/\n/g, ch);
        }());
        do {
            source = source.replace("{ }", "\n");
        } while (source.indexOf("{ }") !== -1);
        source = source.replace(/\n{2}/g, "\n");
        if (source.indexOf("{|}") === source.length - 3) {
            source = source.slice(0, source.length - 3) + ch;
        }
        return source.replace(/\{\-\}/g, "\n");
    };