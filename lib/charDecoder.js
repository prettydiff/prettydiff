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
 back.  The variable "pd.o.report.beau" represents the arbitrary XML or HTML
 element and is not defined in this function.  Therefore this function
 requires access to a DOM with an arbitrary element mapped to a variable
 named "pd.o.report.beau".  If that element is not present and does not have the
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
        var a = 0,
            b = 0,
            index = 0,
            inputLenA = 0,
            inputLenB = 0,
            output = [],
            entity = [],
            type = [],
            uni = (/u\+[0-9a-f]{4,5}\+/),
            unit = (/u\![0-9a-f]{4,5}\+/),
            htmln = (/\&\#[0-9]{1,6}\;/),
            htmlt = (/\&\![0-9]{1,6}\;/);
        if ((pd === undefined || pd.o.report.beau === null || pd.o.report.beau === undefined || typeof pd.o.report.beau.innerHTML !== "string") || (input.search(unit) === -1 && input.search(uni) === -1 && input.search(htmlt) === -1 && input.search(htmln) === -1)) {
            return input;
        }
        inputLenA = input.length;
        for (b = 0; b < inputLenA; b += 1) {
            if (input.search(htmln) === -1 || (input.search(uni) < input.search(htmln) && input.search(uni) !== -1)) {
                index = input.search(uni);
                type.push(index + "|h");
                inputLenB = input.length;
                for (a = index; a < inputLenB; a += 1) {
                    if (input.charAt(a) === "+" && input.charAt(a - 1) === "u") {
                        input = input.slice(0, a) + "!" + input.slice(a + 1);
                    }
                    if (input.charAt(a) === "+" && input.charAt(a - 1) !== "u") {
                        a += 1;
                        break;
                    }
                }
                entity.push(input.slice(index + 2, a - 1));
                input = input.replace(unit, "");
            } else if (input.search(uni) === -1 || (input.search(htmln) < input.search(uni) && input.search(htmln) !== -1)) {
                index = input.search(htmln);
                type.push(index + "|d");
                inputLenB = input.length;
                for (a = index; a < inputLenB; a += 1) {
                    if (input.charAt(a) === "#") {
                        input = input.slice(0, a) + "!" + input.slice(a + 1);
                    }
                    if (input.charAt(a) === ";") {
                        a += 1;
                        break;
                    }
                }
                entity.push(input.slice(index + 2, a - 1));
                input = input.replace(htmlt, "");
            }
            if (input.search(uni) === -1 && input.search(htmln) === -1) {
                break;
            }
        }
        input = input.replace(/u\![0-9a-f]{4,5}\+/g, "").replace(/\&\![0-9]{1,6}\;/g, "").split("");
        index = entity.length;
        for (b = 0; b < index; b += 1) {
            type[b] = type[b].split("|");
            if (type[b][1] === "h") {
                entity[b] = parseInt(entity[b], 16);
            }

            //pd.o.report.beau represents a pointer to an object in a DOM and is not
            //defined in charDecoder
            pd.o.report.beau.innerHTML = "&#" + parseInt(entity[b], 10) + ";";
            entity[b] = pd.o.report.beau.innerHTML;
            output.push(entity[b]);
        }
        return output.join("");
    };