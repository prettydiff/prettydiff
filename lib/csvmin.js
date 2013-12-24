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

var csvmin = function csvmin(source, ch) {
        "use strict";
        if (ch === "") {
            ch = ",";
        } else {
            ch = charDecoder(ch);
        }
        (function csvmin__logic() {
            var multiline     = function csvmin__logic_multiline(x) {
                    var output = [],
                        y      = 0,
                        len    = x.length - 2;
                    if (len === 0) {
                        return "{ }";
                    }
                    for (y = 0; y < len; y += 1) {
                        output.push(ch);
                    }
                    return output.join("") + "{ }";
                },
                a             = 0,
                b             = 0,
                segment       = [],
                partLen       = 0,
                part          = [],
                srcLines      = source.replace(/\n\n\{\-\}\n\n/g, "{-}").replace(/\n{2,}/g, multiline).split("\n"),
                srcLen        = srcLines.length,
                errorLocation = "",
                error         = "Error: Unterminated String begging at character number ";
            for (a = 0; a < srcLen; a += 1) {
                segment = [];
                if (typeof srcLines[a] === "string" && srcLines[a].indexOf("\"") !== -1) {
                    part    = srcLines[a].split("");
                    partLen = part.length;
                    for (b = 0; b < partLen; b += 1) {
                        if (part[b] === "\"") {
                            segment.push(b);
                        }
                    }
                    if (segment.length === 1) {
                        srcLines[a]   = part.join("");
                        errorLocation = srcLines[a].slice(segment[0], segment[0] + 9);
                        return error + (srcLines.join(ch).indexOf(srcLines[a]) + segment[0]) + " or value number " + (a + 1) + ", '" + errorLocation + "'.";
                    }
                    if (segment.length > 2) {
                        partLen = segment.length - 1;
                        for (b = 1; b < partLen; b += 1) {
                            part[segment[b]] = "\"\"";
                        }
                    }
                    srcLines[a] = part.join("");
                }
            }
            if (srcLines[srcLines.length - 1] === "{|}") {
                srcLines[srcLines.length - 1] = "";
            }
            source = srcLines.join(ch).replace(/\n/g, ch);
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