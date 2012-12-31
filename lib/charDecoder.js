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
 This code transforms any combination of decimal and hexidecimal Unicode
 character entities into character literals.  This function accepts
 entities as decimal and hex entities.  This code does not provide a
 Unicode character map.  Instead it is reliant upon the character map
 available by the interpreting software.  In order to use the processing
 application's character map the function must fill an arbitrary XML or
 HTML element with a processed character entity and then retrieve it
 back.  The variable "pd.o.rh" represents the arbitrary XML or HTML
 element and is not defined in this function.  Therefore this function
 requires access to a DOM with an arbitrary element mapped to a variable
 named "pd.o.rh".  If that element is not present and does not have the
 innerHTML property then this function terminates without altering the
 input.

 If the processing software does not recognize characters supplied by
 the provided entity then this function should not expect to work.  The
 limitation, in this case, is not my code.

 Decimal input requirements:
 This function will only recognize decimal entities if they begin with
 ampersand and pound characters "&#", a decimal number one to six digits
 long and terminated by a simicolon.

 Decimal input examples:
 &#9;
 &#37;
 &#203875;

 Hexidecimal input requirements:
 This function will only recognize hexidecimal entities if they begin
 with a lowercase u, a plus, a four or five digit hexidecimal value and
 terminated by a plus.  Since a proper Unicode entity in hexidecimal may
 be four or five digits a terminating character is required so that my
 code knows in advance if the entity ends at only four digits.  If a
 numeric value less than four digits is supplied it must be padded with
 0s until it becomes four characters.

 Hexidecimal input examples:
 u+0009+
 u+004b+
 u+1037a+
 */
var charDecoder = function charDecoder(input) {
        "use strict";
        var b = 0,
            d = 0,
            a = 0,
            f = 0,
            g = 0,
            c = input,
            e = [],
            x = [],
            y = [],
            uni = (/u\+[0-9a-f]{4,5}\+/),
            unit = (/u\![0-9a-f]{4,5}\+/),
            htmln = (/\&\#[0-9]{1,6}\;/),
            htmlt = (/\&\![0-9]{1,6}\;/);
        if ((pd === undefined || pd.o.rh === null || pd.o.rh === undefined || typeof pd.o.rh.innerHTML !== "string") || (c.search(unit) === -1 && c.search(uni) === -1 && c.search(htmlt) === -1 && c.search(htmln) === -1)) {
            return input;
        }
        f = input.length;
        for (b = 0; b < f; b += 1) {
            if (c.search(htmln) === -1 || (c.search(uni) < c.search(htmln) && c.search(uni) !== -1)) {
                d = c.search(uni);
                y.push(d + "|h");
                g = c.length;
                for (a = d; a < g; a += 1) {
                    if (c.charAt(a) === "+" && c.charAt(a - 1) === "u") {
                        e = c.split("");
                        e.splice(a, 1, "!");
                        c = e.join("");
                    }
                    if (c.charAt(a) === "+" && c.charAt(a - 1) !== "u") {
                        a += 1;
                        break;
                    }
                }
                x.push(c.slice(d + 2, a - 1));
                c = c.replace(unit, "");
            } else if (c.search(uni) === -1 || (c.search(htmln) < c.search(uni) && c.search(htmln) !== -1)) {
                d = c.search(htmln);
                y.push(d + "|d");
                g = c.length;
                for (a = d; a < g; a += 1) {
                    if (c.charAt(a) === "#") {
                        e = c.split("");
                        e.splice(a, 1, "!");
                        c = e.join("");
                    }
                    if (c.charAt(a) === ";") {
                        a += 1;
                        break;
                    }
                }
                x.push(c.slice(d + 2, a - 1));
                c = c.replace(htmlt, "");
            }
            if (c.search(uni) === -1 && c.search(htmln) === -1) {
                break;
            }
        }
        c = c.replace(/u\![0-9a-f]{4,5}\+/g, "").replace(/\&\![0-9]{1,6}\;/g, "").split("");
        d = x.length;
        e = [];
        for (b = 0; b < d; b += 1) {
            y[b] = y[b].split("|");
            if (y[b][1] === "h") {
                x[b] = parseInt(x[b], 16);
            }

            //o.rh represents a pointer to an object in a DOM and is not
            //defined in charDecoder
            o.rh.innerHTML = "&#" + parseInt(x[b], 10) + ";";
            x[b] = o.rh.innerHTML;
            e.push(x[b]);
        }
        return e.join("");
    };