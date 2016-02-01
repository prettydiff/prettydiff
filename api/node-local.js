/*prettydiff.com api.topcoms: true, api.insize: 4, api.inchar: " ", api.vertical: true */
/*jshint laxbreak: true*/
/***********************************************************************
 node-local is written by Austin Cheney on 6 Nov 2012.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://www.travelocity.com/
 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
/*

http://prettydiff.com/

Command line API for Prettydiff for local execution only.  This API is
not intended for execution as a service on a remote server.

Arguments entered from the command line are separated by spaces and
values are separated from argument names by a colon.  For safety
argument values should always be quoted.

Examples:

> node node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file"
 diff:"c:\myotherfile.js"
> node node-local.js source:"c:\mydirectory\myfile.js" mode:"beautify"
 readmethod:"file" output:"c:\output\otherfile.js"
> node node-local.js source:"../package.json" mode:"beautify"
 readmethod:"filescreen"
*/

(function pdNodeLocal() {
    "use strict";
    var localPath      = (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true)
            ? __dirname.replace(/(api)$/, "")
            : "../",
        cwd            = (process.cwd() === "/")
            ? __dirname
            : process.cwd(),
        libs           = (function pdNodeLocal__libs() {
            global.safeSort     = require(localPath + "lib/safeSort.js").api;
            global.csspretty    = require(localPath + "lib/csspretty.js").api;
            global.csvpretty    = require(localPath + "lib/csvpretty.js").api;
            global.diffview     = require(localPath + "lib/diffview.js").api;
            global.jspretty     = require(localPath + "lib/jspretty.js").api;
            global.markuppretty = require(localPath + "lib/markuppretty.js").api;
            global.jsxstatus    = global.jspretty.jsxstatus;
            return localPath;
        }()),
        prettydiff     = require(libs + "prettydiff.js"),
        fs             = require("fs"),
        http           = require("http"),
        path           = require("path"),
        sfiledump      = [],
        dfiledump      = [],
        sState         = [],
        dState         = [],
        clidata        = [
            [], [], []
        ],
        builder        = {
            css   : {
                color  : {
                    canvas: "#prettydiff.canvas{background:#986 url('data:image/png;base64,iVBORw0KGgoAAAANSU" +
                                "hEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSU" +
                                "NDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8" +
                                "igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEe" +
                                "CDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kT" +
                                "hLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAG" +
                                "g7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8l" +
                                "c88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/" +
                                "P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQL" +
                                "UAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TK" +
                                "Ucz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AX" +
                                "uRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARK" +
                                "CBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwl" +
                                "W4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHf" +
                                "I9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o" +
                                "8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE" +
                                "7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpF" +
                                "TSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEO" +
                                "U05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9" +
                                "BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCp" +
                                "VKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/Y" +
                                "kGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj" +
                                "8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0" +
                                "onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/" +
                                "VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJg" +
                                "YmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutr" +
                                "xuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+" +
                                "6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2" +
                                "e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+" +
                                "BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8" +
                                "Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyO" +
                                "yQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry" +
                                "1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpx" +
                                "apLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLO" +
                                "W5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrA" +
                                "VZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sj" +
                                "xxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1Yf" +
                                "qGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO" +
                                "319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7Jvt" +
                                "tVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy" +
                                "0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9" +
                                "sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dP" +
                                "Ky2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/" +
                                "fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY" +
                                "+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28" +
                                "bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEFdaVRYdF" +
                                "hNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIen" +
                                "JlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPS" +
                                "JBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgIC" +
                                "AgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZG" +
                                "Ytc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgIC" +
                                "AgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbn" +
                                "M6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOn" +
                                "N0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgIC" +
                                "AgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3" +
                                "VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLz" +
                                "EuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3" +
                                "Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLz" +
                                "EuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj" +
                                "4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3" +
                                "NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMj" +
                                "oyNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMT" +
                                "YtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaW" +
                                "Z5RGF0ZT4yMDE2LTAxLTEzVDEzOjE4OjA3LTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPH" +
                                "htcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iYjM5NjA0MDVhOW" +
                                "Q8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOn" +
                                "Bob3Rvc2hvcDoxYzM3NjE4MS1mOWU4LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW" +
                                "50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZj" +
                                "A3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgIC" +
                                "AgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOm" +
                                "xpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj" +
                                "5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPn" +
                                "htcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZU" +
                                "lEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC" +
                                "9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG" +
                                "90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgIC" +
                                "AgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2" +
                                "UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgIC" +
                                "AgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LT" +
                                "hjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdn" +
                                "Q6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgIC" +
                                "AgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKT" +
                                "wvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3" +
                                "RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bG" +
                                "kgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPm" +
                                "Rlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y2" +
                                "9udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3" +
                                "N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cm" +
                                "RmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdG" +
                                "lvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD" +
                                "54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2" +
                                "VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMD" +
                                "wvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUG" +
                                "hvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgIC" +
                                "AgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcm" +
                                "RmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgIC" +
                                "AgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5kZXJpdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgIC" +
                                "AgICAgICAgIDxzdEV2dDpwYXJhbWV0ZXJzPmNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG" +
                                "9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nPC9zdEV2dDpwYXJhbWV0ZXJzPgogICAgICAgICAgICAgIC" +
                                "A8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+Ci" +
                                "AgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgIC" +
                                "AgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS" +
                                "1iYjM5NjA0MDVhOWQ8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aG" +
                                "VuPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgID" +
                                "xzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdE" +
                                "V2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dD" +
                                "pjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogIC" +
                                "AgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2" +
                                "VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6ODNhNz" +
                                "kwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjppbnN0YW5jZUlEPgogICAgICAgIC" +
                                "AgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MW" +
                                "RmMzVhMTwvc3RSZWY6ZG9jdW1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9yaWdpbmFsRG9jdW1lbn" +
                                "RJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwvc3RSZWY6b3JpZ2" +
                                "luYWxEb2N1bWVudElEPgogICAgICAgICA8L3htcE1NOkRlcml2ZWRGcm9tPgogICAgICAgICA8ZGM6Zm" +
                                "9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC" +
                                "9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRU" +
                                "M2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj" +
                                "4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4zMDAwMDAwLzEwMD" +
                                "AwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4zMDAwMDAwLzEwMD" +
                                "AwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOl" +
                                "Jlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT" +
                                "4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjQ8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogIC" +
                                "AgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgID" +
                                "wvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+bleIyQAAAC" +
                                "BjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAANElEQVR42mJ89+4uAwMDAw" +
                                "PD6lkTGd69u/vu3d2ZHXnv3t1lgLPevbvLrCTIEJqWD1EJGADaTRll80WcLAAAAABJRU5ErkJggg==')" +
                                ";color:#420}#prettydiff.canvas *:focus{outline:0.1em dashed #f00}#prettydiff.can" +
                                "vas a{color:#039}#prettydiff.canvas .contentarea,#prettydiff.canvas legend,#pret" +
                                "tydiff.canvas fieldset select,#prettydiff.canvas .diff td,#prettydiff.canvas .re" +
                                "port td,#prettydiff.canvas .data li,#prettydiff.canvas .diff-right,#prettydiff.c" +
                                "anvas fieldset input{background:#eeeee8;border-color:#420}#prettydiff.canvas sel" +
                                "ect,#prettydiff.canvas input,#prettydiff.canvas .diff,#prettydiff.canvas .beauti" +
                                "fy,#prettydiff.canvas .report,#prettydiff.canvas .beautify h3,#prettydiff.canvas" +
                                " .diff h3,#prettydiff.canvas .beautify h4,#prettydiff.canvas .diff h4,#prettydif" +
                                "f.canvas #report,#prettydiff.canvas #report .author,#prettydiff.canvas fieldset{" +
                                "background:#ddddd8;border-color:#420}#prettydiff.canvas fieldset fieldset{backgr" +
                                "ound:#eeeee8}#prettydiff.canvas fieldset fieldset input,#prettydiff.canvas field" +
                                "set fieldset select{background:#ddddd8}#prettydiff.canvas h2,#prettydiff.canvas " +
                                "h2 button,#prettydiff.canvas h3,#prettydiff.canvas legend{color:#900}#prettydiff" +
                                ".canvas .contentarea{box-shadow:0 1em 1em #b8a899}#prettydiff.canvas .segment{ba" +
                                "ckground:#fff}#prettydiff.canvas h2 button,#prettydiff.canvas .segment,#prettydi" +
                                "ff.canvas ol.segment li{border-color:#420}#prettydiff.canvas th{background:#e8dd" +
                                "cc}#prettydiff.canvas li h4{color:#06f}#prettydiff.canvas code{background:#eee;b" +
                                "order-color:#eee;color:#00f}#prettydiff.canvas ol.segment h4 strong{color:#c00}#" +
                                "prettydiff.canvas button{background-color:#ddddd8;border-color:#420;box-shadow:0" +
                                " 0.25em 0.5em #b8a899;color:#900}#prettydiff.canvas button:hover{background-colo" +
                                "r:#ccb;border-color:#630;box-shadow:0 0.25em 0.5em #b8a899;color:#630}#prettydif" +
                                "f.canvas th{background:#ccccc8}#prettydiff.canvas thead th,#prettydiff.canvas th" +
                                ".heading{background:#ccb}#prettydiff.canvas .diff h3{background:#ddd;border-colo" +
                                "r:#999}#prettydiff.canvas td,#prettydiff.canvas th,#prettydiff.canvas .segment,#" +
                                "prettydiff.canvas .count li,#prettydiff.canvas .data li,#prettydiff.canvas .diff" +
                                "-right{border-color:#ccccc8}#prettydiff.canvas .count{background:#eed;border-col" +
                                "or:#999}#prettydiff.canvas .count li.fold{color:#900}#prettydiff.canvas h2 butto" +
                                "n{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettydiff.canvas li h4" +
                                "{color:#00f}#prettydiff.canvas code{background:#eee;border-color:#eee;color:#009" +
                                "}#prettydiff.canvas ol.segment h4 strong{color:#c00}#prettydiff.canvas .data .de" +
                                "lete{background:#ffd8d8}#prettydiff.canvas .data .delete em{background:#fff8f8;b" +
                                "order-color:#c44;color:#900}#prettydiff.canvas .data .insert{background:#d8ffd8}" +
                                "#prettydiff.canvas .data .insert em{background:#f8fff8;border-color:#090;color:#" +
                                "363}#prettydiff.canvas .data .replace{background:#fec}#prettydiff.canvas .data ." +
                                "replace em{background:#ffe;border-color:#a86;color:#852}#prettydiff.canvas .data" +
                                " .empty{background:#ddd}#prettydiff.canvas .data em.s0{color:#000}#prettydiff.ca" +
                                "nvas .data em.s1{color:#f66}#prettydiff.canvas .data em.s2{color:#12f}#prettydif" +
                                "f.canvas .data em.s3{color:#090}#prettydiff.canvas .data em.s4{color:#d6d}#prett" +
                                "ydiff.canvas .data em.s5{color:#7cc}#prettydiff.canvas .data em.s6{color:#c85}#p" +
                                "rettydiff.canvas .data em.s7{color:#737}#prettydiff.canvas .data em.s8{color:#6d" +
                                "0}#prettydiff.canvas .data em.s9{color:#dd0}#prettydiff.canvas .data em.s10{colo" +
                                "r:#893}#prettydiff.canvas .data em.s11{color:#b97}#prettydiff.canvas .data em.s1" +
                                "2{color:#bbb}#prettydiff.canvas .data em.s13{color:#cc3}#prettydiff.canvas .data" +
                                " em.s14{color:#333}#prettydiff.canvas .data em.s15{color:#9d9}#prettydiff.canvas" +
                                " .data em.s16{color:#880}#prettydiff.canvas .data .l0{background:#eeeee8}#pretty" +
                                "diff.canvas .data .l1{background:#fed}#prettydiff.canvas .data .l2{background:#d" +
                                "ef}#prettydiff.canvas .data .l3{background:#efe}#prettydiff.canvas .data .l4{bac" +
                                "kground:#fef}#prettydiff.canvas .data .l5{background:#eef}#prettydiff.canvas .da" +
                                "ta .l6{background:#fff8cc}#prettydiff.canvas .data .l7{background:#ede}#prettydi" +
                                "ff.canvas .data .l8{background:#efc}#prettydiff.canvas .data .l9{background:#ffd" +
                                "}#prettydiff.canvas .data .l10{background:#edc}#prettydiff.canvas .data .l11{bac" +
                                "kground:#fdb}#prettydiff.canvas .data .l12{background:#f8f8f8}#prettydiff.canvas" +
                                " .data .l13{background:#ffb}#prettydiff.canvas .data .l14{background:#eec}#prett" +
                                "ydiff.canvas .data .l15{background:#cfc}#prettydiff.canvas .data .l16{background" +
                                ":#eea}#prettydiff.canvas .data .c0{background:inherit}#prettydiff.canvas #report" +
                                " p em{color:#060}#prettydiff.canvas #report p strong{color:#009}",
                    shadow: "#prettydiff.shadow{background:#333 url('data:image/png;base64,iVBORw0KGgoAAAANSU" +
                                "hEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSU" +
                                "NDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8" +
                                "igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEe" +
                                "CDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kT" +
                                "hLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAG" +
                                "g7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8l" +
                                "c88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/" +
                                "P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQL" +
                                "UAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TK" +
                                "Ucz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AX" +
                                "uRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARK" +
                                "CBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwl" +
                                "W4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHf" +
                                "I9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o" +
                                "8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE" +
                                "7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpF" +
                                "TSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEO" +
                                "U05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9" +
                                "BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCp" +
                                "VKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/Y" +
                                "kGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj" +
                                "8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0" +
                                "onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/" +
                                "VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJg" +
                                "YmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutr" +
                                "xuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+" +
                                "6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2" +
                                "e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+" +
                                "BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8" +
                                "Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyO" +
                                "yQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry" +
                                "1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpx" +
                                "apLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLO" +
                                "W5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrA" +
                                "VZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sj" +
                                "xxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1Yf" +
                                "qGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO" +
                                "319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7Jvt" +
                                "tVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy" +
                                "0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9" +
                                "sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dP" +
                                "Ky2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/" +
                                "fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY" +
                                "+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28" +
                                "bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEQFaVRYdF" +
                                "hNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIen" +
                                "JlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPS" +
                                "JBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgIC" +
                                "AgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZG" +
                                "Ytc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgIC" +
                                "AgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbn" +
                                "M6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOn" +
                                "N0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgIC" +
                                "AgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3" +
                                "VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLz" +
                                "EuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3" +
                                "Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLz" +
                                "EuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj" +
                                "4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3" +
                                "NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMj" +
                                "oyNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMT" +
                                "YtMDEtMTNUMTU6MTE6MzMtMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaW" +
                                "Z5RGF0ZT4yMDE2LTAxLTEzVDE1OjExOjMzLTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPH" +
                                "htcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo4MDAwYTE3Zi1jZTY1LTQ5NTUtYjFmMS05YjVkODIwNDIyNj" +
                                "U8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOn" +
                                "Bob3Rvc2hvcDoxZmZhNDk1Yy1mYTU2LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW" +
                                "50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZj" +
                                "A3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgIC" +
                                "AgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOm" +
                                "xpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj" +
                                "5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPn" +
                                "htcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZU" +
                                "lEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC" +
                                "9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG" +
                                "90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgIC" +
                                "AgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2" +
                                "UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgIC" +
                                "AgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LT" +
                                "hjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdn" +
                                "Q6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgIC" +
                                "AgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKT" +
                                "wvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3" +
                                "RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bG" +
                                "kgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPm" +
                                "Rlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y2" +
                                "9udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3" +
                                "N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cm" +
                                "RmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdG" +
                                "lvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD" +
                                "54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2" +
                                "VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMD" +
                                "wvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUG" +
                                "hvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgIC" +
                                "AgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcm" +
                                "RmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgIC" +
                                "AgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgIC" +
                                "AgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjA0ZGYyNDk5LWE1NTktNDE4MC1iNjA1LWI2MT" +
                                "k3MWMxNWEwMzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+Mj" +
                                "AxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RX" +
                                "Z0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0On" +
                                "NvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW" +
                                "5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYX" +
                                "JzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZW" +
                                "Q8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcH" +
                                "BsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz" +
                                "4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVH" +
                                "lwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RX" +
                                "Z0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb2" +
                                "0gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZX" +
                                "RlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYX" +
                                "JzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3" +
                                "RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgwMD" +
                                "BhMTdmLWNlNjUtNDk1NS1iMWYxLTliNWQ4MjA0MjI2NTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgIC" +
                                "AgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj" +
                                "4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDID" +
                                "IwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdE" +
                                "V2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgIC" +
                                "AgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtcE1NOk" +
                                "Rlcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgPHN0UmVmOmluc3" +
                                "RhbmNlSUQ+eG1wLmlpZDowNGRmMjQ5OS1hNTU5LTQxODAtYjYwNS1iNjE5NzFjMTVhMDM8L3N0UmVmOm" +
                                "luc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODNhNzkwYWQtYz" +
                                "BlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjpkb2N1bWVudElEPgogICAgICAgICAgICA8c3" +
                                "RSZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMz" +
                                "ExZDc0MDMxPC9zdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZE" +
                                "Zyb20+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG" +
                                "90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3" +
                                "A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgIC" +
                                "AgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZX" +
                                "NvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZX" +
                                "NvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc2" +
                                "9sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2" +
                                "U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZj" +
                                "pQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9leGlmOlBpeG" +
                                "VsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG" +
                                "1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2" +
                                "tldCBlbmQ9InciPz5hSvvCAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxU" +
                                "YAAAAlSURBVHjaPMYxAQAwDAMgVkv1VFFRuy9cvN0F7m66JNNhOvwBAPyqCtNeO5K2AAAAAElFTkSuQm" +
                                "CC');color:#fff}#prettydiff.shadow *:focus{outline:0.1em dashed #ff0}#prettydiff" +
                                ".shadow a:visited{color:#f93}#prettydiff.shadow a{color:#cf3}#prettydiff.shadow " +
                                ".contentarea,#prettydiff.shadow legend,#prettydiff.shadow fieldset select,#prett" +
                                "ydiff.shadow .diff td,#prettydiff.shadow .report td,#prettydiff.shadow .data li," +
                                "#prettydiff.shadow .diff-right,#prettydiff.shadow fieldset input{background:#333" +
                                ";border-color:#666}#prettydiff.shadow select,#prettydiff.shadow input,#prettydif" +
                                "f.shadow .diff,#prettydiff.shadow .beautify,#prettydiff.shadow .report,#prettydi" +
                                "ff.shadow .beautify h3,#prettydiff.shadow .diff h3,#prettydiff.shadow .beautify " +
                                "h4,#prettydiff.shadow .diff h4,#prettydiff.shadow #report,#prettydiff.shadow #re" +
                                "port .author,#prettydiff.shadow fieldset{background:#222;border-color:#666}#pret" +
                                "tydiff.shadow fieldset fieldset{background:#333}#prettydiff.shadow fieldset fiel" +
                                "dset input,#prettydiff.shadow fieldset fieldset select{background:#222}#prettydi" +
                                "ff.shadow h2,#prettydiff.shadow h2 button,#prettydiff.shadow h3,#prettydiff.shad" +
                                "ow input,#prettydiff.shadow option,#prettydiff.shadow select,#prettydiff.shadow " +
                                "legend{color:#ccc}#prettydiff.shadow .contentarea{box-shadow:0 1em 1em #000}#pre" +
                                "ttydiff.shadow .segment{background:#222}#prettydiff.shadow h2 button,#prettydiff" +
                                ".shadow td,#prettydiff.shadow th,#prettydiff.shadow .segment,#prettydiff.shadow " +
                                "ol.segment li{border-color:#666}#prettydiff.shadow .count li.fold{color:#cf3}#pr" +
                                "ettydiff.shadow th{background:#000}#prettydiff.shadow h2 button{background:#5858" +
                                "58;box-shadow:0.1em 0.1em 0.25em #000}#prettydiff.shadow li h4{color:#ff0}#prett" +
                                "ydiff.shadow code{background:#585858;border-color:#585858;color:#ccf}#prettydiff" +
                                ".shadow ol.segment h4 strong{color:#f30}#prettydiff.shadow button{background-col" +
                                "or:#333;border-color:#666;box-shadow:0 0.25em 0.5em #000;color:#ccc}#prettydiff." +
                                "shadow button:hover{background-color:#777;border-color:#aaa;box-shadow:0 0.25em " +
                                "0.5em #222;color:#fff}#prettydiff.shadow th{background:#444}#prettydiff.shadow t" +
                                "head th,#prettydiff.shadow th.heading{background:#444}#prettydiff.shadow .diff h" +
                                "3{background:#000;border-color:#666}#prettydiff.shadow .segment,#prettydiff.shad" +
                                "ow .data li,#prettydiff.shadow .diff-right{border-color:#444}#prettydiff.shadow " +
                                ".count li{border-color:#333}#prettydiff.shadow .count{background:#555;border-col" +
                                "or:#333}#prettydiff.shadow li h4{color:#ff0}#prettydiff.shadow code{background:#" +
                                "000;border-color:#000;color:#ddd}#prettydiff.shadow ol.segment h4 strong{color:#" +
                                "c00}#prettydiff.shadow .data .delete{background:#300}#prettydiff.shadow .data .d" +
                                "elete em{background:#200;border-color:#c63;color:#c66}#prettydiff.shadow .data ." +
                                "insert{background:#030}#prettydiff.shadow .data .insert em{background:#010;borde" +
                                "r-color:#090;color:#6c0}#prettydiff.shadow .data .replace{background:#234}#prett" +
                                "ydiff.shadow .data .replace em{background:#023;border-color:#09c;color:#7cf}#pre" +
                                "ttydiff.shadow .data .empty{background:#111}#prettydiff.shadow .diff .author{bor" +
                                "der-color:#666}#prettydiff.shadow .data em.s0{color:#fff}#prettydiff.shadow .dat" +
                                "a em.s1{color:#d60}#prettydiff.shadow .data em.s2{color:#aaf}#prettydiff.shadow " +
                                ".data em.s3{color:#0c0}#prettydiff.shadow .data em.s4{color:#f6f}#prettydiff.sha" +
                                "dow .data em.s5{color:#0cc}#prettydiff.shadow .data em.s6{color:#dc3}#prettydiff" +
                                ".shadow .data em.s7{color:#a7a}#prettydiff.shadow .data em.s8{color:#7a7}#pretty" +
                                "diff.shadow .data em.s9{color:#ff6}#prettydiff.shadow .data em.s10{color:#33f}#p" +
                                "rettydiff.shadow .data em.s11{color:#933}#prettydiff.shadow .data em.s12{color:#" +
                                "990}#prettydiff.shadow .data em.s13{color:#987}#prettydiff.shadow .data em.s14{c" +
                                "olor:#fc3}#prettydiff.shadow .data em.s15{color:#897}#prettydiff.shadow .data em" +
                                ".s16{color:#f30}#prettydiff.shadow .data .l0{background:#333}#prettydiff.shadow " +
                                ".data .l1{background:#633}#prettydiff.shadow .data .l2{background:#335}#prettydi" +
                                "ff.shadow .data .l3{background:#353}#prettydiff.shadow .data .l4{background:#636" +
                                "}#prettydiff.shadow .data .l5{background:#366}#prettydiff.shadow .data .l6{backg" +
                                "round:#640}#prettydiff.shadow .data .l7{background:#303}#prettydiff.shadow .data" +
                                " .l8{background:#030}#prettydiff.shadow .data .l9{background:#660}#prettydiff.sh" +
                                "adow .data .l10{background:#003}#prettydiff.shadow .data .l11{background:#300}#p" +
                                "rettydiff.shadow .data .l12{background:#553}#prettydiff.shadow .data .l13{backgr" +
                                "ound:#432}#prettydiff.shadow .data .l14{background:#640}#prettydiff.shadow .data" +
                                " .l15{background:#562}#prettydiff.shadow .data .l16{background:#600}#prettydiff." +
                                "shadow .data .c0{background:inherit}",
                    white : "#prettydiff.white{background:#f8f8f8 url('data:image/png;base64,iVBORw0KGgoAAAAN" +
                                "SUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3Ag" +
                                "SUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUE" +
                                "G8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIe" +
                                "EeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0" +
                                "kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhE" +
                                "AGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG" +
                                "8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHg" +
                                "g/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIP" +
                                "QLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0" +
                                "TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+" +
                                "AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAA" +
                                "RKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4u" +
                                "wlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVI" +
                                "HfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP" +
                                "2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhM" +
                                "WE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmx" +
                                "pFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnl" +
                                "EOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5O" +
                                "l9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHK" +
                                "CpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z" +
                                "/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOU" +
                                "Zj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5B" +
                                "x0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36" +
                                "p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423Gbcaj" +
                                "JgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnu" +
                                "trxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wu" +
                                "w+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dn" +
                                "F2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPI" +
                                "Q+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfL" +
                                "T8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFo" +
                                "yOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85" +
                                "ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSF" +
                                "pxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOl" +
                                "LOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQ" +
                                "rAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5" +
                                "sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1" +
                                "YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9W" +
                                "tO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7J" +
                                "vttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3v" +
                                "dy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8" +
                                "R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4" +
                                "dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6" +
                                "b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9D" +
                                "BY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv" +
                                "28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADo2aVRY" +
                                "dFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlI" +
                                "enJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRr" +
                                "PSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAg" +
                                "ICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1y" +
                                "ZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAg" +
                                "ICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1s" +
                                "bnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5z" +
                                "OnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAg" +
                                "ICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAg" +
                                "ICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgog" +
                                "ICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAg" +
                                "ICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8" +
                                "eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC94bXA6Q3Jl" +
                                "YXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAw" +
                                "PC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNi0wMS0xMlQxMjoy" +
                                "NDozOC0wNjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTYt" +
                                "MDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wTU06SW5zdGFu" +
                                "Y2VJRD54bXAuaWlkOmQ1M2M3ODQzLWE1ZjItNDg0Ny04YzQzLTZlMmMwYTQ2OGJlYjwveG1wTU06SW5z" +
                                "dGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjFj" +
                                "Mzc2MTgxLWY5ZTgtMTE3OC05YTljLWQ4MjVkZmIwYTQ3MDwveG1wTU06RG9jdW1lbnRJRD4KICAgICAg" +
                                "ICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBk" +
                                "LTY4MTMxMWQ3NDAzMTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlz" +
                                "dG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNl" +
                                "VHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0" +
                                "RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo2YjI0" +
                                "ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAg" +
                                "ICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+" +
                                "CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAy" +
                                "MDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICA8L3JkZjps" +
                                "aT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAg" +
                                "ICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAg" +
                                "ICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpkNTNjNzg0My1hNWYyLTQ4NDctOGM0My02ZTJjMGE0" +
                                "NjhiZWI8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYt" +
                                "MDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpz" +
                                "b2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0" +
                                "d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2Vk" +
                                "PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8" +
                                "L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAg" +
                                "ICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAg" +
                                "IDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2Zp" +
                                "bGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAg" +
                                "IDx0aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAg" +
                                "IDx0aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAg" +
                                "IDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlm" +
                                "OkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNp" +
                                "b24+NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40" +
                                "PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJE" +
                                "Rj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAK" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAog" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAK" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAog" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAg" +
                                "ICAgCjw/eHBhY2tldCBlbmQ9InciPz5cKgaXAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAA" +
                                "ADqYAAAXb5JfxUYAAAAkSURBVHjaPMahAQAwDMCg7P+/KnsPcq4oHqpqdwNmBt3QDX8AeAUmcrZLnM4A" +
                                "AAAASUVORK5CYII=')}#prettydiff.white *:focus{outline:0.1em dashed #06f}#prettydi" +
                                "ff.white .contentarea,#prettydiff.white legend,#prettydiff.white fieldset select" +
                                ",#prettydiff.white .diff td,#prettydiff.white .report td,#prettydiff.white .data" +
                                " li,#prettydiff.white .diff-right,#prettydiff.white fieldset input{background:#f" +
                                "ff;border-color:#999}#prettydiff.white select,#prettydiff.white input,#prettydif" +
                                "f.white .diff,#prettydiff.white .beautify,#prettydiff.white .report,#prettydiff." +
                                "white .beautify h3,#prettydiff.white .diff h3,#prettydiff.white .beautify h4,#pr" +
                                "ettydiff.white .diff h4,#prettydiff.white #pdsamples li div,#prettydiff.white #r" +
                                "eport,#prettydiff.white .author,#prettydiff.white #report .author,#prettydiff.wh" +
                                "ite fieldset{background:#eee;border-color:#999}#prettydiff.white .diff h3{backgr" +
                                "ound:#ddd;border-color:#999}#prettydiff.white fieldset fieldset{background:#ddd}" +
                                "#prettydiff.white .contentarea{box-shadow:0 1em 1em #999}#prettydiff.white butto" +
                                "n{background-color:#eee;border-color:#999;box-shadow:0 0.25em 0.5em #ccc;color:#" +
                                "666}#prettydiff.white button:hover{background-color:#def;border-color:#03c;box-s" +
                                "hadow:0 0.25em 0.5em #ccf;color:#03c}#prettydiff.white h2,#prettydiff.white h2 b" +
                                "utton,#prettydiff.white h3{color:#b00}#prettydiff.white th{background:#eee;color" +
                                ":#333}#prettydiff.white thead th{background:#eef}#prettydiff.white .report stron" +
                                "g{color:#009}#prettydiff.white .report em{color:#080}#prettydiff.white h2 button" +
                                ",#prettydiff.white td,#prettydiff.white th,#prettydiff.white .segment,#prettydif" +
                                "f.white .count li,#prettydiff.white .diff-right #prettydiff.white ol.segment li{" +
                                "border-color:#ccc}#prettydiff.white .data li{border-color:#ccc}#prettydiff.white" +
                                " .count li.fold{color:#900}#prettydiff.white .count{background:#eed;border-color" +
                                ":#999}#prettydiff.white h2 button{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25" +
                                "em #ddd}#prettydiff.white li h4{color:#00f}#prettydiff.white code{background:#ee" +
                                "e;border-color:#eee;color:#009}#prettydiff.white ol.segment h4 strong{color:#c00" +
                                "}#prettydiff.white .data .delete{background:#ffd8d8}#prettydiff.white .data .del" +
                                "ete em{background:#fff8f8;border-color:#c44;color:#900}#prettydiff.white .data ." +
                                "insert{background:#d8ffd8}#prettydiff.white .data .insert em{background:#f8fff8;" +
                                "border-color:#090;color:#363}#prettydiff.white .data .replace{background:#fec}#p" +
                                "rettydiff.white .data .replace em{background:#ffe;border-color:#a86;color:#852}#" +
                                "prettydiff.white .data .empty{background:#ddd}#prettydiff.white .data em.s0{colo" +
                                "r:#000}#prettydiff.white .data em.s1{color:#f66}#prettydiff.white .data em.s2{co" +
                                "lor:#12f}#prettydiff.white .data em.s3{color:#090}#prettydiff.white .data em.s4{" +
                                "color:#d6d}#prettydiff.white .data em.s5{color:#7cc}#prettydiff.white .data em.s" +
                                "6{color:#c85}#prettydiff.white .data em.s7{color:#737}#prettydiff.white .data em" +
                                ".s8{color:#6d0}#prettydiff.white .data em.s9{color:#dd0}#prettydiff.white .data " +
                                "em.s10{color:#893}#prettydiff.white .data em.s11{color:#b97}#prettydiff.white .d" +
                                "ata em.s12{color:#bbb}#prettydiff.white .data em.s13{color:#cc3}#prettydiff.whit" +
                                "e .data em.s14{color:#333}#prettydiff.white .data em.s15{color:#9d9}#prettydiff." +
                                "white .data em.s16{color:#880}#prettydiff.white .data .l0{background:#fff}#prett" +
                                "ydiff.white .data .l1{background:#fed}#prettydiff.white .data .l2{background:#de" +
                                "f}#prettydiff.white .data .l3{background:#efe}#prettydiff.white .data .l4{backgr" +
                                "ound:#fef}#prettydiff.white .data .l5{background:#eef}#prettydiff.white .data .l" +
                                "6{background:#fff8cc}#prettydiff.white .data .l7{background:#ede}#prettydiff.whi" +
                                "te .data .l8{background:#efc}#prettydiff.white .data .l9{background:#ffd}#pretty" +
                                "diff.white .data .l10{background:#edc}#prettydiff.white .data .l11{background:#f" +
                                "db}#prettydiff.white .data .l12{background:#f8f8f8}#prettydiff.white .data .l13{" +
                                "background:#ffb}#prettydiff.white .data .l14{background:#eec}#prettydiff.white ." +
                                "data .l15{background:#cfc}#prettydiff.white .data .l16{background:#eea}#prettydi" +
                                "ff.white .data .c0{background:inherit}#prettydiff.white #report p em{color:#080}" +
                                "#prettydiff.white #report p strong{color:#009}"
                },
                global : "#prettydiff{text-align:center;font-size:10px;overflow-y:scroll}#prettydiff .cont" +
                             "entarea{border-style:solid;border-width:0.1em;font-family:'Century Gothic','Treb" +
                             "uchet MS';margin:0 auto;max-width:93em;padding:1em;text-align:left}#prettydiff d" +
                             "d,#prettydiff dt,#prettydiff p,#prettydiff li,#prettydiff td,#prettydiff blockqu" +
                             "ote,#prettydiff th{clear:both;font-family:'Palatino Linotype','Book Antiqua',Pal" +
                             "atino,serif;font-size:1.6em;line-height:1.6em;text-align:left}#prettydiff blockq" +
                             "uote{font-style:italic}#prettydiff dt{font-size:1.4em;font-weight:bold;line-heig" +
                             "ht:inherit}#prettydiff li li,#prettydiff li p{font-size:1em}#prettydiff th,#pret" +
                             "tydiff td{border-style:solid;border-width:0.1em;padding:0.1em 0.2em}#prettydiff " +
                             "td span{display:block}#prettydiff code,#prettydiff textarea{font-family:'Courier" +
                             " New',Courier,'Lucida Console',monospace}#prettydiff code,#prettydiff textarea{d" +
                             "isplay:block;font-size:0.8em;width:100%}#prettydiff code span{display:block;whit" +
                             "e-space:pre}#prettydiff code{border-style:solid;border-width:0.2em;line-height:1" +
                             "em}#prettydiff textarea{line-height:1.4em}#prettydiff label{display:inline;font-" +
                             "size:1.4em}#prettydiff legend{border-radius:1em;border-style:solid;border-width:" +
                             "0.1em;font-size:1.4em;font-weight:bold;margin-left:-0.25em;padding:0 0.5em}#pret" +
                             "tydiff fieldset fieldset legend{font-size:1.2em}#prettydiff table{border-collaps" +
                             "e:collapse}#prettydiff div.report{border-style:none}#prettydiff h2,#prettydiff h" +
                             "3,#prettydiff h4{clear:both}#prettydiff table{margin:0 0 1em}#prettydiff .analys" +
                             "is .bad,#prettydiff .analysis .good{font-weight:bold}#prettydiff h1{font-size:3e" +
                             "m;font-weight:normal;margin-top:0}#prettydiff h1 span{font-size:0.5em}#prettydif" +
                             "f h1 svg{border-style:solid;border-width:0.05em;float:left;height:1.5em;margin-r" +
                             "ight:0.5em;width:1.5em}#prettydiff h2{border-style:none;background:transparent;f" +
                             "ont-size:1em;box-shadow:none;margin:0}#prettydiff h2 button{background:transpare" +
                             "nt;border-style:solid;cursor:pointer;display:block;font-size:2.5em;font-weight:n" +
                             "ormal;text-align:left;width:100%;border-width:0.05em;font-weight:normal;margin:1" +
                             "em 0 0;padding:0.1em}#prettydiff h2 span{display:block;float:right;font-size:0.5" +
                             "em}#prettydiff h3{font-size:2em;margin:0;background:transparent;box-shadow:none;" +
                             "border-style:none}#prettydiff h4{font-size:1.6em;font-family:'Century Gothic','T" +
                             "rebuchet MS';margin:0}#prettydiff li h4{font-size:1em}#prettydiff button,#pretty" +
                             "diff fieldset,#prettydiff div input,#prettydiff textarea{border-style:solid;bord" +
                             "er-width:0.1em}#prettydiff section{border-style:none}#prettydiff h2 button,#pret" +
                             "tydiff select,#prettydiff option{font-family:inherit}#prettydiff select{border-s" +
                             "tyle:inset;border-width:0.1em;width:13.5em}#prettydiff #dcolorScheme{float:right" +
                             ";margin:-3em 0 0}#prettydiff #dcolorScheme label,#prettydiff #dcolorScheme label" +
                             "{display:inline-block;font-size:1em}#prettydiff .clear{clear:both;display:block}" +
                             "#prettydiff caption,#prettydiff .content-hide{height:1em;left:-1000em;overflow:h" +
                             "idden;position:absolute;top:-1000em;width:1em}",
                reports: "#prettydiff #report.contentarea{font-family:'Lucida Sans Unicode','Helvetica','A" +
                             "rial',sans-serif;max-width:none;overflow:scroll}#prettydiff .diff .replace em,#p" +
                             "rettydiff .diff .delete em,#prettydiff .diff .insert em{border-style:solid;borde" +
                             "r-width:0.1em}#prettydiff #report dd,#prettydiff #report dt,#prettydiff #report " +
                             "p,#prettydiff #report li,#prettydiff #report td,#prettydiff #report blockquote,#" +
                             "prettydiff #report th{font-family:'Lucida Sans Unicode','Helvetica','Arial',sans" +
                             "-serif;font-size:1.2em}#prettydiff div#webtool{background:transparent;font-size:" +
                             "inherit;margin:0;padding:0}#prettydiff #jserror span{display:block}#prettydiff #" +
                             "a11y{background:transparent;padding:0}#prettydiff #a11y div{margin:0.5em 0;borde" +
                             "r-style:solid;border-width:0.1em}#prettydiff #a11y h4{margin:0.25em 0}#prettydif" +
                             "f #a11y ol{border-style:solid;border-width:0.1em}#prettydiff #cssreport.doc tabl" +
                             "e{clear:none;float:left;margin-left:1em}#prettydiff #css-size{left:24em}#prettyd" +
                             "iff #css-uri{left:40em}#prettydiff #css-uri td{text-align:left}#prettydiff .repo" +
                             "rt .analysis th{text-align:left}#prettydiff .report .analysis .parseData td{font" +
                             "-family:'Courier New',Courier,'Lucida Console',monospace;text-align:left;white-s" +
                             "pace:pre}#prettydiff .report .analysis td{text-align:right}#prettydiff .analysis" +
                             "{float:left;margin:0 1em 1em 0}#prettydiff .analysis td,#prettydiff .analysis th" +
                             "{padding:0.5em}#prettydiff #statreport div{border-style:none}#prettydiff .diff,#" +
                             "prettydiff .beautify{border-style:solid;border-width:0.1em;display:inline-block;" +
                             "margin:0 1em 1em 0;position:relative}#prettydiff .diff,#prettydiff .diff li #pre" +
                             "ttydiff .diff h3,#prettydiff .diff h4,#prettydiff .beautify,#prettydiff .beautif" +
                             "y li,#prettydiff .beautify h3,#prettydiff .beautify h4{font-family:'Courier New'" +
                             ",Courier,'Lucida Console',monospace}#prettydiff .diff li,#prettydiff .beautify l" +
                             "i,#prettydiff .diff h3,#prettydiff .diff h4,#prettydiff .beautify h3,#prettydiff" +
                             " .beautify h4{border-style:none none solid none;border-width:0 0 0.1em 0;box-sha" +
                             "dow:none;display:block;font-size:1.2em;margin:0 0 0 -.1em;padding:0.2em 2em;text" +
                             "-align:left}#prettydiff .diff .skip{border-style:none none solid;border-width:0 " +
                             "0 0.1em}#prettydiff .diff .diff-left{border-style:none;display:table-cell}#prett" +
                             "ydiff .diff .diff-right{border-style:none none none solid;border-width:0 0 0 0.1" +
                             "em;display:table-cell;margin-left:-.1em;min-width:16.5em;right:0;top:0}#prettydi" +
                             "ff .diff .data li,#prettydiff .beautify .data li{min-width:16.5em;padding:0.5em}" +
                             "#prettydiff .diff li,#prettydiff .diff p,#prettydiff .diff h3,#prettydiff .beaut" +
                             "ify li,#prettydiff .beautify p,#prettydiff .beautify h3{font-size:1.2em}#prettyd" +
                             "iff .diff li em,#prettydiff .beautify li em{font-style:normal;font-weight:bold;m" +
                             "argin:-0.5em -0.09em}#prettydiff .diff p.author{border-style:solid;border-width:" +
                             "0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4em;text-align:right}#prett" +
                             "ydiff .difflabel{display:block;height:0}#prettydiff .count{border-style:solid;bo" +
                             "rder-width:0 0.1em 0 0;font-weight:normal;padding:0;text-align:right}#prettydiff" +
                             " .count li{padding:0.5em 1em;text-align:right}#prettydiff .count li.fold{cursor:" +
                             "pointer;font-weight:bold;padding-left:0.5em}#prettydiff .data{text-align:left;wh" +
                             "ite-space:pre}#prettydiff .beautify .data em{display:inline-block;font-style:nor" +
                             "mal;font-weight:bold}#prettydiff .beautify li,#prettydiff .diff li{border-style:" +
                             "none none solid;border-width:0 0 0.1em;display:block;line-height:1.2;list-style-" +
                             "type:none;margin:0;white-space:pre}#prettydiff .beautify ol,#prettydiff .diff ol" +
                             "{display:table-cell;margin:0;padding:0}#prettydiff .beautify em.l0,#prettydiff ." +
                             "beautify em.l1,#prettydiff .beautify em.l2,#prettydiff .beautify em.l3,#prettydi" +
                             "ff .beautify em.l4,#prettydiff .beautify em.l5,#prettydiff .beautify em.l6,#pret" +
                             "tydiff .beautify em.l7,#prettydiff .beautify em.l8,#prettydiff .beautify em.l9,#" +
                             "prettydiff .beautify em.l10,#prettydiff .beautify em.l11,#prettydiff .beautify e" +
                             "m.l12,#prettydiff .beautify em.l13,#prettydiff .beautify em.l14,#prettydiff .bea" +
                             "utify em.l15,#prettydiff .beautify em.l16{height:2.2em;margin:0 0 -1em;position:" +
                             "relative;top:-0.5em}#prettydiff .beautify em.l0{margin-left:-0.5em;padding-left:" +
                             "0.5em}#prettydiff #report .beautify,#prettydiff #report .beautify li,#prettydiff" +
                             " #report .diff,#prettydiff #report .diff li{font-family:'Courier New',Courier,'L" +
                             "ucida Console',monospace}#prettydiff #report .beautify{border-style:solid}#prett" +
                             "ydiff #report .diff h3,#prettydiff #report .beautify h3{margin:0}"
            },
            html  : {
                body  : "/*]]>*/</style></head><body id='prettydiff' class='",
                color : "white",
                end   : "//]]>\r\n</script></body></html>",
                head  : "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML " +
                            "1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www." +
                            "w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool<" +
                            "/title><meta name='robots' content='index, follow'/> <meta name='DC.title' conte" +
                            "nt='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://pret" +
                            "tydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' conte" +
                            "nt='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' " +
                            "content='text/css'/><style type='text/css'>/*<![CDATA[*/",
                intro : "'><div class='contentarea' id='report'><section role='heading'><h1><svg height='" +
                            "2000.000000pt' id='pdlogo' preserveAspectRatio='xMidYMid meet' version='1.0' vie" +
                            "wBox='0 0 2000.000000 2000.000000' width='2000.000000pt' xmlns='http://www.w3.or" +
                            "g/2000/svg'><g fill='#999' stroke='none' transform='translate(0.000000,2000.0000" +
                            "00) scale(0.100000,-0.100000)'> <path d='M14871 18523 c-16 -64 -611 -2317 -946 -" +
                            "3588 -175 -660 -319 -1202 -320 -1204 -2 -2 -50 39 -107 91 -961 876 -2202 1358 -3" +
                            "498 1358 -1255 0 -2456 -451 -3409 -1279 -161 -140 -424 -408 -560 -571 -507 -607 " +
                            "-870 -1320 -1062 -2090 -58 -232 -386 -1479 -2309 -8759 -148 -563 -270 -1028 -270" +
                            " -1033 0 -4 614 -8 1365 -8 l1364 0 10 38 c16 63 611 2316 946 3587 175 660 319 12" +
                            "02 320 1204 2 2 50 -39 107 -91 543 -495 1169 -862 1863 -1093 1707 -568 3581 -211" +
                            " 4965 946 252 210 554 524 767 796 111 143 312 445 408 613 229 406 408 854 525 13" +
                            "20 57 225 380 1451 2310 8759 148 563 270 1028 270 1033 0 4 -614 8 -1365 8 l-1364" +
                            " 0 -10 -37z m-4498 -5957 c477 -77 889 -256 1245 -542 523 -419 850 -998 954 -1689" +
                            " 18 -121 18 -549 0 -670 -80 -529 -279 -972 -612 -1359 -412 -480 -967 -779 -1625 " +
                            "-878 -121 -18 -549 -18 -670 0 -494 74 -918 255 -1283 548 -523 419 -850 998 -954 " +
                            "1689 -18 121 -18 549 0 670 104 691 431 1270 954 1689 365 293 828 490 1283 545 50" +
                            " 6 104 13 120 15 72 10 495 -3 588 -18z'/></g></svg><a href='prettydiff.com.xhtml" +
                            "'>Pretty Diff</a></h1><p id='dcolorScheme'><label class='label' for='colorScheme" +
                            "'>Color Scheme</label><select id='colorScheme'><option>Canvas</option><option>Sh" +
                            "adow</option><option selected='selected'>White</option></select></p><p>Find <a h" +
                            "ref='https://github.com/prettydiff/prettydiff'>Pretty Diff on GitHub</a> and <a " +
                            "href='http://www.npmjs.com/packages/prettydiff'>NPM</a>.</p></section><section r" +
                            "ole='main'>",
                script: "</section></div><script type='application/javascript'>//<![CDATA[\r\n"
            },
            script: {
                beautify: "var pd={};pd.colorchange=function(){'use strict';var options=this.getElementsByT" +
                              "agName('option');document.getElementsByTagName('body')[0].setAttribute('class',o" +
                              "ptions[this.selectedIndex].innerHTML.toLowerCase());};pd.colorscheme=document.ge" +
                              "tElementById('colorScheme');pd.colorscheme.onchange=pd.colorchange;pd.beaufold=f" +
                              "unction dom__beaufold(){'use strict';var self=this,title=self.getAttribute('titl" +
                              "e').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Numb" +
                              "er(title[2]),a=0,b='',list=[self.parentNode.getElementsByTagName('li'),self.pare" +
                              "ntNode.nextSibling.getElementsByTagName('li')];if(self.innerHTML.charAt(0)==='-'" +
                              "){for(a=min;a<max;a+=1){list[0][a].style.display='none';list[1][a].style.display" +
                              "='none';}self.innerHTML='+'+self.innerHTML.substr(1);}else{for(a=min;a<max;a+=1)" +
                              "{list[0][a].style.display='block';list[1][a].style.display='block';if(list[0][a]" +
                              ".getAttribute('class')==='fold'&&list[0][a].innerHTML.charAt(0)==='+'){b=list[0]" +
                              "[a].getAttribute('title');b=b.substring(b.indexOf('to line ')+1);a=Number(b)-1;}" +
                              "}self.innerHTML='-'+self.innerHTML.substr(1);}};(function(){'use strict';var lis" +
                              "ts=document.getElementsByTagName('ol'),listslen=lists.length,list=[],listlen=0,a" +
                              "=0,b=0;for(a=0;a<listslen;a+=1){if(lists[a].getAttribute('class')==='count'&&lis" +
                              "ts[a].parentNode.getAttribute('class')==='beautify'){list=lists[a].getElementsBy" +
                              "TagName('li');listlen=list.length;for(b=0;b<listlen;b+=1){if(list[b].getAttribut" +
                              "e('class')==='fold'){list[b].onmousedown=pd.beaufold;}}}}}());",
                diff    : "var pd={};pd.colorchange=function(){'use strict';var options=this.getElementsByT" +
                              "agName('option');document.getElementsByTagName('body')[0].setAttribute('class',o" +
                              "ptions[this.selectedIndex].innerHTML.toLowerCase())};pd.colorscheme=document.get" +
                              "ElementById('colorScheme');pd.colorscheme.onchange=pd.colorchange;pd.d=document." +
                              "getElementsByTagName('ol');pd.difffold=function dom__difffold(){'use strict';var" +
                              " self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].s" +
                              "ubstr(0,title[1].indexOf(' '))),max=Number(title[2]),a=0,b=0,inner=self.innerHTM" +
                              "L,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('cla" +
                              "ss'==='diff'))?parent.getElementsByTagName('ol'):parent.parentNode.getElementsBy" +
                              "TagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listno" +
                              "des[a].getElementsByTagName('li'))}if(lists.length>3){for(a=0;a<min;a+=1){if(lis" +
                              "ts[0][a].getAttribute('class')==='empty'){min+=1;max+=1}}}max=(max>=lists[0].len" +
                              "gth)?lists[0].length:max;if(inner.charAt(0)==='-'){self.innerHTML='+'+inner.subs" +
                              "tr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='n" +
                              "one'}}}else{self.innerHTML='-'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<l" +
                              "istLen;b+=1){lists[b][a].style.display='block'}}}};pd.colSliderProperties=[pd.d[" +
                              "0].clientWidth,pd.d[1].clientWidth,pd.d[2].parentNode.clientWidth,pd.d[2].parent" +
                              "Node.parentNode.clientWidth,pd.d[2].parentNode.offsetLeft-pd.d[2].parentNode.par" +
                              "entNode.offsetLeft];pd.colSliderGrab=function(e){'use strict';var x=this,a=x.par" +
                              "entNode,b=a.parentNode,c=0,event=e||window.event,counter=pd.colSliderProperties[" +
                              "0],data=pd.colSliderProperties[1],width=pd.colSliderProperties[2],total=pd.colSl" +
                              "iderProperties[3],offset=(pd.colSliderProperties[4]),min=0,max=data-1,status='ew" +
                              "',g=min+15,h=max-15,k=false,z=a.previousSibling,drop=function(g){x.style.cursor=" +
                              "status+'-resize';g=null;document.onmousemove=null;document.onmouseup=null},boxmo" +
                              "ve=function(f){f=f||window.event;c=offset-f.clientX;if(c>g&&c<h){k=true}if(k===t" +
                              "rue&&c>h){a.style.width=((total-counter-2)/10)+'em';status='e'}else if(k===true&" +
                              "&c<g){a.style.width=(width/10)+'em';status='w'}else if(c<max&&c>min){a.style.wid" +
                              "th=((width+c)/10)+'em';status='ew'}document.onmouseup=drop};event.preventDefault" +
                              "();if(typeof pd.o==='object'&&typeof pd.o.re==='object'){offset+=pd.o.re.offsetL" +
                              "eft;offset-=pd.o.rf.scrollLeft}else{c=(document.body.parentNode.scrollLeft>docum" +
                              "ent.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLef" +
                              "t;offset-=c}offset+=x.clientWidth;x.style.cursor='ew-resize';b.style.width=(tota" +
                              "l/10)+'em';b.style.display='inline-block';if(z.nodeType!==1){do{{z=z.previousSib" +
                              "ling}}while(z.nodeType!==1)}z.style.display='block';a.style.width=(a.clientWidth" +
                              "/10)+'em';a.style.position='absolute';document.onmousemove=boxmove;document.onmo" +
                              "usedown=null;return false};(function(){'use strict';var cells=pd.d[0].getElement" +
                              "sByTagName('li'),len=cells.length,a=0;for(a=0;a<len;a+=1){if(cells[a].getAttribu" +
                              "te('class')==='fold'){cells[a].onclick=pd.difffold}}if(pd.d.length>3){pd.d[2].on" +
                              "mousedown=pd.colSliderGrab;pd.d[2].ontouchstart=pd.colSliderGrab}}());"
            }
        },
        html           = [
            builder.html.head, //0
            builder.css.color.canvas, //1
            builder.css.color.shadow, //2
            builder.css.color.white, //3
            builder.css.reports, //4
            builder.css.global, //5
            builder.html.body, //6
            builder.html.color, //7
            builder.html.intro, //8
            "", //9 - for meta analysis, like stats and accessibility
            "", //10 - for generated report
            builder.html.script, //11
            builder.script.diff, //12
            builder.html.end //13
        ],
        lf             = "\n",
        method         = "auto",
        startTime      = Date.now(),
        versionString  = (function pdNodeLocal__versionString() {
            var dstring = "",
                mstring = 0,
                month   = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December"
                ];
            global.edition = prettydiff.edition;
            global.report  = prettydiff.report;
            dstring        = global
                .edition
                .latest
                .toString();
            mstring        = Number(dstring.slice(2, 4)) - 1;
            return "\x1B[36mVersion\x1B[39m: " + global.edition.version + " \x1B[36mDated\x1B[39m: " + dstring.slice(4, 6) + " " + month[mstring] + " 20" + dstring.slice(0, 2);
        }()),
        dir            = [
            0, 0, 0
        ],
        address        = {
            dabspath: "",
            dorgpath: "",
            oabspath: "",
            oorgpath: "",
            sabspath: "",
            sorgpath: ""
        },
        help           = false,
        diffCount      = [
            0, 0
        ],
        total          = [
            0, 0
        ],
        options        = {
            api            : "node",
            braceline      : false,
            bracepadding   : false,
            braces         : "knr",
            color          : "white",
            comments       : "indent",
            commline       : false,
            conditional    : false,
            content        : false,
            context        : "",
            correct        : false,
            crlf           : false,
            cssinsertlines : false,
            csvchar        : ",",
            diff           : "",
            diffcli        : false,
            diffcomments   : false,
            difflabel      : "new",
            diffspaceignore: false,
            diffview       : "sidebyside",
            dustjs         : false,
            elseline       : false,
            endcomma       : false,
            force_indent   : false,
            html           : false,
            inchar         : " ",
            inlevel        : 0,
            insize         : 4,
            jsscope        : "none",
            lang           : "auto",
            langdefault    : "text",
            methodchain    : "indent",
            miniwrap       : false,
            mode           : "diff",
            neverflatten   : false,
            nocaseindent   : false,
            noleadzero     : false,
            objsort        : "js",
            output         : "",
            preserve       : "all",
            quote          : false,
            quoteConvert   : "none",
            readmethod     : "auto",
            report         : true,
            selectorlist   : false,
            semicolon      : false,
            source         : "",
            sourcelabel    : "base",
            space          : true,
            spaceclose     : false,
            style          : "indent",
            styleguide     : "none",
            summaryonly    : false,
            tagmerge       : false,
            tagsort        : false,
            ternaryline    : false,
            textpreserve   : false,
            titanium       : false,
            topcoms        : false,
            varword        : "none",
            version        : false,
            vertical       : "js",
            wrap           : 80
        },
        colors         = {
            del     : {
                charEnd  : "\x1B[22m",
                charStart: "\x1B[1m",
                lineEnd  : "\x1B[39m",
                lineStart: "\x1B[31m"
            },
            filepath: {
                end  : "\x1B[39m",
                start: "\x1B[36m"
            },
            ins     : {
                charEnd  : "\x1B[22m",
                charStart: "\x1B[1m",
                lineEnd  : "\x1B[39m",
                lineStart: "\x1B[32m"
            }
        },
        enderflag = false,

        //ending messaging with stats
        ender          = function pdNodeLocal__ender() {
            var plural = (function pdNodeLocal__ender_plural() {
                    var a   = 0,
                        len = diffCount.length,
                        arr = [];
                    for (a = 0; a < len; a += 1) {
                        if (diffCount[a] === 1) {
                            arr.push("");
                        } else {
                            arr.push("s");
                        }
                    }
                    if (clidata[1].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    if (clidata[0].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    return arr;
                }()),
                log    = [],
                time   = 0;
            if (enderflag === true) {
                return;
            }

            //indexes of diffCount array
            //0 - total number of differences
            //1 - the number of files containing those differences
            //last - total file count (not counting (sub)directories)
            if ((method !== "directory" && method !== "subdirectory") || sfiledump.length === 1) {
                diffCount[1] = 1;
                diffCount.push("1 file");
                plural[1] = "";
            } else {
                diffCount.push(sfiledump.length + " files");
            }
            if (options.diffcli === true && options.mode === "diff") {
                if (options.summaryonly === true && clidata[2].length > 0) {
                    log.push(lf + "Files changed:" + lf);
                    log.push(colors.filepath.start);
                    log.push(clidata[2].join(lf));
                    log.push(colors.filepath.end);
                    log.push(lf + lf);
                }
                if (clidata[0].length > 0) {
                    log.push(lf + "Files deleted:" + lf);
                    log.push(colors.del.lineStart);
                    log.push(clidata[0].join(lf));
                    log.push(colors.del.lineEnd);
                    log.push(lf + lf);
                }
                if (clidata[1].length > 0) {
                    log.push(lf + "Files inserted:" + lf);
                    log.push(colors.ins.lineStart);
                    log.push(clidata[1].join(lf));
                    log.push(colors.ins.lineEnd);
                    log.push(lf + lf);
                }
            }
            log.push(lf + "Pretty Diff ");
            if (options.mode === "diff") {
                if (method !== "directory" && method !== "subdirectory") {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(". ");
                } else {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(" in ");
                    log.push(diffCount[1]);
                    log.push(" file");
                    log.push(plural[1]);
                    log.push(" out of ");
                }
            } else if (options.mode === "beautify") {
                log.push("beautified ");
            } else if (options.mode === "minify") {
                log.push("minified ");
            }
            if (options.mode !== "diff" || method === "directory" || method === "subdirectory") {
                log.push(diffCount[diffCount.length - 1]);
                log.push(". ");
            }
            if (options.mode === "diff" && (method === "directory" || method === "subdirectory")) {
                log.push(clidata[1].length);
                log.push(" file");
                log.push(plural[2]);
                log.push(" added. ");
                log.push(clidata[0].length);
                log.push(" file");
                log.push(plural[3]);
                log.push(" deleted. Executed in ");
            } else {
                log.push("Executed in ");
            }
            time = (Date.now() - startTime) / 1000;
            log.push(time);
            log.push(" second");
            if (time !== 1) {
                log.push("s");
            }
            log.push("." + lf);
            console.log(log.join(""));
            enderflag = true;
        },

        //extract errorcount from diff
        //report files for ender stats
        counter        = function pdNodeLocal__counter(x) {
            var num = Number(x.substring(x.indexOf("<em>") + 4, x.indexOf("</em>")));
            if (num > 0) {
                diffCount[0] += num;
                diffCount[1] += 1;
            }
            return x;
        },

        //html report template
        reports        = function pdNodeLocal__reports() {
            var result = prettydiff.api(options);
            if (result[0].indexOf("Error: ") === 0) {
                return [result[0], ""];
            }
            html[7] = options.color;
            html[10] = result[0];
            if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                html[12] = builder.script.beautify;
                return html.join("");
            }
            if (options.mode === "diff") {
                return [html.join(""), ""];
            }
            return [result[0], html.join("")];
        },

        //instructions
        error          = (function pdNodeLocal__error() {
            var a       = [],
                color   = {
                    accepted: "\x1B[31m",
                    bool    : "\x1B[35m",
                    number  : "\x1B[36m",
                    string  : "\x1B[33m",
                    word    : "\x1B[32m"
                },
                opname  = function pdNodeLocal__opname(x) {
                    var value = x.match(/\w+/);
                    return x.replace(value, color.word + value + "\x1B[39m");
                },
                vallist = function pdNodeLocal__vallist(x) {
                    var value = x.split(":\x1B[39m"),
                        items = value[1].split(","),
                        len   = items.length,
                        b     = 0;
                    for (b = 0; b < len; b += 1) {
                        items[b] = items[b].replace(/\s(?=\w)/, " " + color.string) + "\x1B[39m";
                    }
                    return value[0] + ":\x1B[39m" + items.join(",");
                };
            a.push(lf);
            a.push("\x1B[1mOptions\x1B[22m");
            a.push("");
            a.push("Arguments      - Type    - Definition");
            a.push("-------------------------------------");
            a.push("* braceline    - boolean - If true a new line character will be inserted after");
            a.push("                           opening curly braces and before closing curly");
            a.push("                            braces. Default is false.");
            a.push("");
            a.push("* bracepadding - boolean - Inserts a space after the start of a contain and");
            a.push("                           before the end of the container in JavaScript if the");
            a.push("                           contents of that container are not indented; such");
            a.push("                           as: conditions, function arguments, and escaped");
            a.push("                           sequences of template strings. Default is false.");
            a.push("");
            a.push("* braces       - string  - If lang is 'javascript' and mode is 'beautify' this");
            a.push("                           determines if opening curly braces will exist on the");
            a.push("                           same line as their condition or be forced onto a new");
            a.push("                           line. Defaults to 'knr'.");
            a.push("                 Accepted values: knr, allman");
            a.push("");
            a.push("* color        - string  - The color scheme of the reports. Default is shadow.");
            a.push("                 Accepted values: default, canvas, shadow, white");
            a.push("");
            a.push("* comments     - string  - If mode is 'beautify' this will determine whether");
            a.push("                           comments should always start at position 0 of each");
            a.push("                           line or if comments should be indented according to");
            a.push("                           sthe code. Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* commline     - boolean - If a blank new line should be forced above comments");
            a.push("                           in markup. Default is false.");
            a.push("");
            a.push("* conditional  - boolean - If true then conditional comments used by Internet");
            a.push("                           Explorer are preserved at minification of markup.");
            a.push("                           Default is false.");
            a.push("");
            a.push("* content      - boolean - If true and mode is 'diff' this will normalize all");
            a.push("                           string literals in JavaScript to 'text' and all");
            a.push("                           content in markup to 'text' so as to eliminate some");
            a.push("                           differences from the HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* context      - number  - This shortens the diff output by allowing a");
            a.push("                           specified number of equivalent lines between each");
            a.push("                           line of difference. Defaults to an empty string,");
            a.push("                           which nullifies its use.");
            a.push("");
            a.push("* correct      - boolean - Automatically correct some sloppiness in JavaScript.");
            a.push("                           The default is 'false' and it is only applied during");
            a.push("                           JavaScript beautification.");
            a.push("");
            a.push("* crlf         - boolean - If line termination should be Windows (LF) format.");
            a.push("                           Unix (LF) format is the default.");
            a.push("");
            a.push("* cssinsertlines - boolean - Inserts new line characters between every CSS code");
            a.push("                           block. Default is false.");
            a.push("");
            a.push("* csvchar      - string  - The character to be used as a separator if lang is");
            a.push("                           'csv'. Any string combination is accepted. Defaults");
            a.push("                           to a comma ','.");
            a.push("");
            a.push("* diff         - string  - The file to be compared to the source file. This is");
            a.push("                           required if mode is 'diff'.");
            a.push("");
            a.push("* diffcli      - boolean - If true only text lines of the code differences are");
            a.push("                           returned instead of an HTML diff report. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* diffcomments - boolean - If true then comments will be preserved so that both");
            a.push("                           code and comments are compared by the diff engine.");
            a.push("");
            a.push("* difflabel    - string  - This allows for a descriptive label for the diff");
            a.push("                           file code of the diff HTML output. Defaults to new'.");
            a.push("");
            a.push("* diffspaceignore - boolean - If white space only differences should be ignored");
            a.push("                           by the diff tool.  Default is false.");
            a.push("");
            a.push("* diffview     - string  - This determines whether the diff HTML output should");
            a.push("                           display as a side-by-side comparison or if the");
            a.push("                           differences should display in a single table column.");
            a.push("                           Defaults to 'sidebyside'.");
            a.push("                 Accepted values: sidebyside, inline");
            a.push("");
            a.push("* dustjs       - boolean - If the provided markup code is a Dust.js template.");
            a.push("                           Takes a boolean and defaults to false.");
            a.push("");
            a.push("* elseline     - boolean - If elseline is true then the keyword 'else' is forced");
            a.push("                           onto a new line in JavaScript beautification.");
            a.push("                           Defaults to false.");
            a.push("");
            a.push("* endcomma     - boolean - If there should be a trailing comma in JavaScript");
            a.push("                           arrays and objects.");
            a.push("");
            a.push("* force_indent - boolean - If lang is 'markup' this will force indentation upon");
            a.push("                           all content and tags without regard for the creation");
            a.push("                           of new text nodes. Default is false.");
            a.push("");
            a.push("* help         - string  - This list of argument definitions. The value is");
            a.push("                           unnecessary and is required only to pass in use of");
            a.push("                           the parameter.");
            a.push("");
            a.push("* html         - boolean - If lang is 'markup' this will provide an override so");
            a.push("                           that some tags are treated as singletons and not");
            a.push("                           start tags, such as '<br>' opposed to '<br/>'.");
            a.push("");
            a.push("* inchar       - string  - The string characters to comprise a single");
            a.push("                           indentation. Any string combination is accepted.");
            a.push("                           Defaults to space ' '.");
            a.push("");
            a.push("* inlevel      - number  - How much indentation padding should be applied to");
            a.push("                           JavaScript beautification?  Default is 0.");
            a.push("");
            a.push("* insize       - number  - The number of characters to comprise a single");
            a.push("                           indentation. Defaults to '4'.");
            a.push("");
            a.push("* jsscope      - string  - If 'html' JavaScript beautification produces HTML");
            a.push("                           formatted output coloring function scope and");
            a.push("                           variables to indicate scope depth and inheritance.");
            a.push("                           The value 'report' is similar to the value 'html',");
            a.push("                           except that it forms the entirety of an HTML");
            a.push("                           document. Default is 'none', which just returns");
            a.push("                           beautified JavaScript in text format.");
            a.push("                 Accepted values: none, report, html");
            a.push("");
            a.push("* lang         - string  - The programming language of the source file.");
            a.push("                           Defaults to auto.");
            a.push("                 Accepted values: auto, markup, javascript, css, html, csv, text");
            a.push("");
            a.push("* langdefault  - string  - The fallback option if lang is set to 'auto' and a");
            a.push("                           language cannot be detected.");
            a.push("                 Accepted values: markup, javascript, css, html, csv, text");
            a.push("");
            a.push("* methodchain  - string  - Whether consecutive JavaScript methods should be");
            a.push("                           chained onto a single line of code instead of");
            a.push("                           indented. Default is 'indent'.");
            a.push("                 Accepted values: chain, indent, none");
            a.push("");
            a.push("* miniwrap     - boolean - Whether minified JavaScript should wrap after a");
            a.push("                           specified character width. This option requires a");
            a.push("                           value from option 'wrap'.");
            a.push("");
            a.push("* mode         - string  - The operation to be performed. Defaults to 'diff'.");
            a.push("                           * diff     - returns either command line list of");
            a.push("                                        differences or an HTML report");
            a.push("                           * beautify - beautifies code and returns a string");
            a.push("                           * minify   - minifies code and returns a string");
            a.push("                           * parse    - returns an object with shallow arrays");
            a.push("                 Accepted values: diff, beautify, minify, parse");
            a.push("");
            a.push("* neverflatten - boolean - If destructured lists in JavaScript should never be");
            a.push("                           flattend. Default is false.");
            a.push("");
            a.push("* nocaseindent - boolean - If a case statement should receive the same");
            a.push("                           indentation as the containing switch block.");
            a.push("");
            a.push("* noleadzero   - boolean - If in CSS values leading 0s immediately preceeding a");
            a.push("                           decimal should be removed or prevented.");
            a.push("");
            a.push("* objsort      - string  - Sorts properties by key name in JavaScript and/or");
            a.push("                           CSS. Defaults to 'js'.");
            a.push("                 Accepted values: all, css, js, markup, none");
            a.push("");
            a.push("* output       - string  - The path of the directory, if readmethod is value");
            a.push("                           'directory', or path and name of the file to write");
            a.push("                           the output.  If the directory path or file exists it");
            a.push("                           will be over written else it will be created.");
            a.push("");
            a.push("* preserve     - string  - Should empty lines be removed during JavaScript or");
            a.push("                           CSS beautification? Default value is 'js', which");
            a.push("                           retains one empty line for any series of empty lines");
            a.push("                           in the JavaScript code input.");
            a.push("                 Accepted values: all, css, js, none");
            a.push("");
            a.push("* quote        - boolean - If true and mode is 'diff' then all single quote");
            a.push("                           characters will be replaced by double quote");
            a.push("                           characters in both the source and diff file input so");
            a.push("                           as to eliminate some differences from the diff");
            a.push("                           report HTML output.");
            a.push("");
            a.push("* quoteConvert - string  - If the quotes of JavaScript strings or markup");
            a.push("                           attributes should be converted to single quotes or");
            a.push("                           double quotes. The default is 'none', which performs");
            a.push("                           no conversion.");
            a.push("                 Accepted values: double, single, none");
            a.push("");
            a.push("* readmethod   - string  - The readmethod determines if operating with IO from");
            a.push("                           command line or IO from files.  Default value is");
            a.push("                           'screen':");
            a.push("                           * auto         - changes to value subdirectory,");
            a.push("                                            file, or screen depending on the");
            a.push("                                            source");
            a.push("                           * screen       - reads from screen and outputs to");
            a.push("                                            screen");
            a.push("                           * file         - reads a file and outputs to a file");
            a.push("                                          - file requires option 'output'");
            a.push("                           * filescreen   - reads a file and writes to screen");
            a.push("                           * directory    - process all files in the immediate");
            a.push("                                            directory");
            a.push("                           * subdirectory - process all files in a directory");
            a.push("                                            and its subdirectories");
            a.push("                 Accepted values: auto, screen, file, filescreen, directory,");
            a.push("                                  subdirectory");
            a.push("");
            a.push("* report       - boolean - Determines whether a report file should be created.");
            a.push("                           The default value is true.  If false reports will be");
            a.push("                           suppressed for 'beautify' and 'minify' modes if");
            a.push("                           readmethod is 'file' or 'directory'.");
            a.push("");
            a.push("* selectorlist - boolean - If comma separated CSS selectors should be retained");
            a.push("                           on a single line of code.");
            a.push("");
            a.push("* semicolon    - boolean - If true and mode is 'diff' and lang is 'javascript'");
            a.push("                           all semicolon characters that immediately preceed");
            a.push("                           any white space containing a new line character will");
            a.push("                           be removed so as to elimate some differences from");
            a.push("                           the diff report HTML output.");
            a.push("");
            a.push("* source       - string  - The file source for interpretation. This is required.");
            a.push("");
            a.push("* sourcelabel  - string  - This allows for a descriptive label of the source");
            a.push("                           file code of the diff HTML output.");
            a.push("");
            a.push("* space        - boolean - If false the space following the function keyword");
            a.push("                           for anonymous functions is removed. Default is true.");
            a.push("");
            a.push("* spaceclose   - boolean - If false markup self-closing tags end with '/>' and");
            a.push("                           ' />' if true. Default is false.");
            a.push("");
            a.push("* style        - string  - If mode is 'beautify' and lang is 'markup' or 'html'");
            a.push("                           this will determine whether the contents of script");
            a.push("                           and style tags should always start at position 0 of");
            a.push("                           each line or if such content should be indented");
            a.push("                           starting from the opening script or style tag.");
            a.push("                           Default is 'indent'.");
            a.push("                 Accepted values: indent, noindent");
            a.push("");
            a.push("* styleguide   - string  - Provides a collection of option presets to easily");
            a.push("                           conform to popular JavaScript style guides. Default");
            a.push("                           is 'none'.");
            a.push("                 Accepted values: airbnb, crockford, google, grunt, jquery,");
            a.push("                                  mediawiki, meteor, yandex, none");
            a.push("");
            a.push("* summaryonly  - boolean - Node only option to output only number of");
            a.push("                           differences and generate no reports. Default is");
            a.push("                           false.");
            a.push("");
            a.push("* tagmerge     - boolean - Allows immediately adjacement start and end markup");
            a.push("                           tags of the same name to be combined into a single");
            a.push("                           self-closing tag. Default is false.");
            a.push("");
            a.push("* tagsort      - boolean - Sort child items of each respective markup parent");
            a.push("                           element.");
            a.push("");
            a.push("* textpreserve - boolean - If text in the provided markup code should be");
            a.push("                           preserved exactly as provided. This option");
            a.push("                           eliminates beautification and wrapping of text");
            a.push("                           content.  Takes a boolean and defaults to false.");
            a.push("");
            a.push("* ternaryline  - boolean - If ternary operators in JavaScript (? and :) should");
            a.push("                           remain on the same line.  Defaults to false.");
            a.push("");
            a.push("* titanium     - boolean - Forces the JavaScript parser to parse Titanium Style");
            a.push("                           Sheets instead of JavaScript. Default is false.");
            a.push("");
            a.push("* topcoms      - boolean - If mode is 'minify' this determines whether comments");
            a.push("                           above the first line of code should be kept. Default");
            a.push("                           is false.");
            a.push("");
            a.push("* varword      - string  - If consecutive JavaScript variables should be merged");
            a.push("                           into a comma separated list ('list') or the opposite");
            a.push("                           ('each'). Default is 'none'.");
            a.push("                 Accepted values: each, list, none");
            a.push("");
            a.push("* vertical     - string  - If lists of assignments and properties should be");
            a.push("                           vertically aligned. Default is 'js'.");
            a.push("                 Accepted values: all, css, js, none");
            a.push("");
            a.push("* wrap         - number  - How many characters text content in markup or");
            a.push("                           strings in JavaScript can be before wrapping. The");
            a.push("                           default value is 80. A value of turns this feature");
            a.push("                           off. A value of -1 will concatenate strings in");
            a.push("                           JavaScript separated by a '+' operator. In markup");
            a.push("                           wrapping occurs on the last space character prior to");
            a.push("                           the given character width");
            a.push("");
            a.push("\x1B[1mUsage\x1B[22m");
            a.push(color.bool + "prettydiff\x1B[39m " + color.word + "option1:\x1B[39m" + color.string + "\"value\"\x1B[39m " + color.word + "option2:\x1B[39m" + color.string + "\"value\"\x1B[39m ...");
            a.push(color.bool + "prettydiff\x1B[39m " + color.word + "source:\x1B[39m" + color.string + "\"myApplication.js\"\x1B[39m " + color.word + "readmethod:\x1B[39m" + color.string + "\"filescreen\"\x1B[39m " + color.word + "mode:\x1B[39m" + color.string + "\"beautify\"\x1B[39m");
            a.push(color.bool + "prettydiff\x1B[39m " + color.word + "source:\x1B[39m" + color.string + "\"old_directory\"\x1B[39m " + color.word + "diff:\x1B[39m" + color.string + "\"new_directory\"\x1B[39m " + color.word + "readmethod:\x1B[39m" + color.string + "\"subdirectory\"\x1B[39m");
            a.push("");
            a.push(versionString);
            a.push("");
            return a
                .join(lf)
                .replace(/\r?\n\*\ \w+\s+-/g, opname)
                .replace(/-\ boolean\ -/g, "- " + color.bool + "boolean\x1B[39m -")
                .replace(/-\ string\ {2,}-/g, "- " + color.string + "string\x1B[39m  -")
                .replace(/-\ number\ {2,}-/g, "- " + color.number + "number\x1B[39m  -")
                .replace(/\r?\n\ {17,}Accepted\ values:/g, lf + "                 " + color.accepted + "Accepted values:\x1B[39m")
                .replace(/Accepted\ values:\\x1B\[39m(\s+\w+,?)+/g, vallist);
        }()),

        //write output to a file
        //executed from fileComplete
        fileWrite      = function pdNodeLocal__fileWrite(data) {
            var dirs      = data
                    .localpath
                    .split(path.sep),
                suffix    = (options.mode === "diff")
                    ? "-diff.html"
                    : "-report.html",
                filename  = dirs[dirs.length - 1],
                count     = 1,
                finalpath = "",
                report    = [
                    "", ""
                ],
                writing   = function pdNodeLocal__fileWrite_writing(ending) {
                    if (data.binary === true) {
                        fs
                            .writeFile(finalpath, data.file, function pdNodeLocal__fileWrite_writing_writeFileBinary(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing binary output." + lf);
                                    console.log(err);
                                }
                                total[1] += 1;
                                if (options.report === true) {
                                    total[0] -= 1;
                                }
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else if (data.file === "") {
                        fs
                            .writeFile(finalpath + ending, "", function pdNodeLocal__fileWrite_writing_writeFileEmpty(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing empty output." + lf);
                                    console.log(err);
                                } else if (method === "file") {
                                    console.log(lf + "Empty file successfully written to file.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else if (ending.indexOf("-report") === 0) {
                        fs
                            .writeFile(finalpath + ending, report[1], function pdNodeLocal__fileWrite_writing_writeFileReport(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing report output." + lf);
                                    console.log(err);
                                } else if (method === "file") {
                                    console.log(lf + "Report successfully written to file.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else {
                        fs
                            .writeFile(finalpath + ending, report[0], function pdNodeLocal__fileWrite_writing_writeFileText(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing file output." + lf);
                                    console.log(err);
                                } else if (method === "file") {
                                    console.log(lf + "File successfully written.");
                                }
                                total[1] += 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    }
                },
                files     = function pdNodeLocal__fileWrite_files() {
                    if (data.binary === true) {
                        writing("");
                    } else if (options.mode === "diff" || (options.mode === "beautify" && options.jsscope !== "none")) {
                        writing(suffix);
                    } else {
                        if (options.report === true) {
                            writing(suffix);
                        }
                        writing("");
                    }
                },
                newdir    = function pdNodeLocal__fileWrite_newdir() {
                    fs
                        .mkdir(address.oabspath + dirs.slice(0, dirs.length - 2).join(path.sep), function pdNodeLocal__fileWrite_newdir_callback() {
                            count += 1;
                            if (count < dirs.length + 1) {
                                pdNodeLocal__fileWrite_newdir();
                            } else {
                                files();
                            }
                        });
                };
            options.source = sfiledump[data.index];
            if (options.mode === "diff") {
                finalpath = address.oabspath + path.sep + dirs.join("__") + "__" + filename;
                options.diff = dfiledump[data.index];
            } else {
                finalpath = address.oabspath + path.sep + dirs.join(path.sep);
            }
            if (data.binary === true) {
                if (dirs.length > 1 && options.mode !== "diff") {
                    newdir();
                } else {
                    files();
                }
                return;
            }
            report = reports();
            if (options.mode === "parse") {
                report[0] = JSON.stringify(report[0]);
            }
            if (options.mode === "diff") {
                report[0].replace(/<strong>Number\ of\ differences:<\/strong>\ <em>\d+<\/em>\ difference/, counter);
            }
            if (report[0].indexOf("Error") === 0) {
                if (data.last === true) {
                    ender();
                }
                return console.log(report[0]);
            }
            if (dirs.length > 1 && options.mode !== "diff") {
                newdir();
            } else {
                files();
            }
        },

        //write output to terminal for diffcli option
        cliWrite       = function pdNodeLocal__cliWrite(output, itempath, last) {
            var a      = 0,
                plural = "",
                pdlen  = output[0].length;
            diffCount[0] += output[output.length - 1];
            diffCount[1] += 1;
            if (options.summaryonly === true) {
                clidata[2].push(itempath);
            } else {
                if (diffCount[0] !== 1) {
                    plural = "s";
                }
                if (options.readmethod === "screen" || (options.readmethod === "auto" && method === "screen")) {
                    console.log(lf + "Screen input with " + diffCount[0] + " difference" + plural);
                } else if (output[5].length === 0) {
                    console.log(lf + colors.filepath.start + itempath + lf + "Line: " + output[0][a] + colors.filepath.end);
                }
                for (a = 0; a < pdlen; a += 1) {
                    if (output[0][a + 1] !== undefined && output[0][a] === output[2][a + 1] && output[2][a] === output[0][a + 1] && output[0][a] !== output[2][a]) {
                        if (options.readmethod === "screen" || (options.readmethod === "auto" && method === "screen")) {
                            console.log(lf + "Line: " + output[0][a] + colors.filepath.end);
                        } else {
                            console.log(lf + colors.filepath.start + itempath + lf + "Line: " + output[0][a] + colors.filepath.end);
                        }
                        if (output[3][a - 2] !== undefined) {
                            console.log(output[3][a - 2]);
                        }
                        if (output[3][a - 1] !== undefined) {
                            console.log(output[3][a - 1]);
                        }
                    }
                    if (output[4][a] === "delete") {
                        console.log(colors.del.lineStart + output[1][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                    } else if (output[4][a] === "insert") {
                        console.log(colors.ins.lineStart + output[3][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    } else if (output[4][a] === "equal" && a > 1) {
                        console.log(output[3][a]);
                    } else if (output[4][a] === "replace") {
                        console.log(colors.del.lineStart + output[1][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                        console.log(colors.ins.lineStart + output[3][a].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    }
                }
            }
            if (last === true) {
                ender();
            }
        },

        //write output to screen
        //executed from fileComplete
        screenWrite    = function pdNodeLocal__screenWrite() {
            var report = [];
            if (options.mode === "diff" && options.diffcli === true) {
                return cliWrite(prettydiff.api(options), "", false);
            }
            if (options.mode === "diff") {
                return console.log(reports()[0]);
            }
            if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                return console.log(reports()[0]);
            }
            report = prettydiff.api(options);
            if (options.mode === "parse") {
                report[0] = JSON.stringify(report[0]);
            }
            return console.log(report[0]);
        },

        //generate the diff output
        //for CLI from files
        cliFile        = function pdNodeLocal__cliFile(data) {
            options.source = sfiledump[data.index];
            options.diff   = dfiledump[data.index];
            if (options.source.indexOf("undefined") === 0) {
                options.source = options
                    .source
                    .replace("undefined", "");
            }
            if (options.diff.indexOf("undefined") === 0) {
                options.diff = options
                    .diff
                    .replace("undefined", "");
            }
            if (typeof options.context !== "number" || options.context < 0) {
                console.log(lf + colors.filepath.start + data.localpath + colors.filepath.end);
            }
            cliWrite(prettydiff.api(options), data.localpath, data.last);
        },

        //is a file read operation complete?
        //executed from readLocalFile
        //executed from readHttpFile
        fileComplete   = function pdNodeLocal__fileComplete(data) {
            if (data.type === "diff") {
                dfiledump[data.index] = data.file;
                dState[data.index]    = true;
            } else {
                sfiledump[data.index] = data.file;
                sState[data.index]    = true;
            }
            if (data.index !== sfiledump.length - 1) {
                data.last = false;
            }
            if (sState[data.index] === true && ((options.mode === "diff" && dState[data.index] === true) || options.mode !== "diff")) {
                if (options.report === true && options.mode !== "diff" && (options.mode !== "beautify" || options.jsscope === "none")) {
                    total[0] += 2;
                } else {
                    total[0] += 1;
                }
                if (sfiledump[data.index] !== dfiledump[data.index]) {
                    if (dfiledump[data.index] === "" || dfiledump[data.index] === "\n") {
                        console.log("Diff file at " + data.localpath + " is \x1B[31mempty\x1B[39m but the source file is not.");
                        diffCount[0] += 1;
                        diffCount[0] += 1;
                    } else if (sfiledump[data.index] === "" || sfiledump[data.index] === "\n") {
                        console.log("Source file at " + data.localpath + " is \x1B[31mempty\x1B[39m but the diff file is not.");
                        diffCount[0] += 1;
                        diffCount[0] += 1;
                    } else if (options.diffcli === true) {
                        cliFile(data);
                    } else if (method === "filescreen") {
                        if (data.type === "diff") {
                            options.diff = data.file;
                        } else {
                            options.source = data.file;
                        }
                        screenWrite();
                    } else if (method === "file" || method === "directory" || method === "subdirectory") {
                        fileWrite(data);
                    }
                    sState[data.index] = false;
                    if (options.mode === "diff") {
                        dState[data.index] = false;
                    }
                } else if (method === "screen" || method === "filescreen" || method === "file" || data.last === true) {
                    ender();
                } else {
                    return;
                }
            } else if (data.last === true && (data.type !== "diff" || (sState[data.index] === true && dState[data.index] === true)) && options.diffcli === false && data.binary === false && total[0] === 0) {
                ender();
            }
        },

        //read from a binary file
        readBinaryFile = function pdNodeLocal__readBinaryFile(data) {
            fs
                .open(data.absolutepath, "r", function pdNodeLocal__readBinaryFile_open(err, fd) {
                    var buff = new Buffer(data.size);
                    if (err !== null) {
                        return pdNodeLocal__readBinaryFile(data);
                    }
                    fs
                        .read(fd, buff, 0, data.size, 0, function pdNodeLocal__readBinaryFile_open_read(erra, bytesRead, buffer) {
                            if (erra !== null) {
                                return pdNodeLocal__readBinaryFile(data);
                            }
                            if (bytesRead > 0) {
                                data.file = buffer;
                            }
                            fileComplete(data);
                        });
                });
        },

        //read from a file and determine if text
        readLocalFile  = function pdNodeLocal__readLocalFile(data) {
            var open = function pdNodeLocal__readLocalFile_open() {
                fs
                    .open(data.absolutepath, "r", function pdNodeLocal__readLocalFile_open_callback(err, fd) {
                        var msize = (data.size < 100)
                                ? data.size
                                : 100,
                            buff  = new Buffer(msize);
                        if (err !== null) {
                            return pdNodeLocal__readLocalFile(data);
                        }
                        fs
                            .read(fd, buff, 0, msize, 1, function pdNodeLocal__readLocalFile_open_callback_read(erra, bytes, buffer) {
                                if (erra !== null) {
                                    return pdNodeLocal__readLocalFile(data);
                                }
                                var bstring = buffer.toString("utf8", 0, buffer.length);
                                bstring = bstring.slice(2, bstring.length - 2);
                                if ((/[\u0002-\u0008]|[\u000e-\u001f]/).test(bstring) === true) {
                                    data.binary = true;
                                    readBinaryFile(data);
                                } else {
                                    data.binary = false;
                                    fs.readFile(data.absolutepath, {
                                        encoding: "utf8"
                                    }, function pdNodeLocal__readLocalFile_open_callback_read_readFile(errb, dump) {
                                        if (errb !== null && errb !== undefined) {
                                            return pdNodeLocal__readLocalFile(data);
                                        }
                                        if (data.file === undefined) {
                                            data.file = "";
                                        }
                                        data.file += dump;
                                        fileComplete(data);
                                        return bytes;
                                    });
                                }
                            });
                    });
            };
            if (data.size === undefined) {
                fs
                    .stat(data.absolutepath, function pdNodeLocal__readLocalFile_stat(errx, stat) {
                        if (errx !== null) {
                            if ((typeof errx === "string" && errx.indexOf("no such file or directory") > 0) || (typeof errx === "object" && errx.code === "ENOENT")) {
                                return console.log(errx);
                            }
                            return pdNodeLocal__readLocalFile(data);
                        }
                        data.size = stat.size;
                        if (data.size > 0) {
                            open();
                        } else {
                            data.binary = false;
                            data.file   = "";
                            fileComplete(data);
                        }
                    });
            } else {
                if (data.size > 0) {
                    open();
                } else {
                    data.binary = false;
                    fileComplete(data);
                }
            }
        },

        //resolve file contents from a web address
        //executed from init
        readHttpFile   = function pdNodeLocal__readHttpFile(data) {
            var file = ["", 0];
            http.get(data.absolutepath, function pdNodeLocal__readHttpFile_get(res) {
                file[1] = Number(res.headers["content-length"]);
                res.setEncoding("utf8");
                res.on("data", function pdNodeLocal__readHttpFile_get_response(chunk) {
                    file[0] += chunk;
                    if (file[0].length === file[1]) {
                        data.file      = file[0];
                        if (data.type === "diff") {
                            dfiledump[data.index] = file[0];
                        } else {
                            sfiledump[data.index] = file[0];
                        }
                        fileComplete(data);
                    }
                });
            });
        },

        //gather files in directory and sub directories
        //executed from init
        directory      = function pdNodeLocal__directory() {
            //the following four are necessary because you can
            //walk a directory tree from a relative path but you
            //cannot read file contents with a relative path in
            //node at this time
            var sfiles  = {
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                dfiles  = {
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                readDir = function pdNodeLocal__directory_readDir(start, listtype) {
                    fs
                        .stat(start, function pdNodeLocal__directory_readDir_stat(erra, stat) {
                            var item    = {},
                                dirtest = function pdNodeLocal__directory_readDir_stat_dirtest(itempath, lastitem) {
                                    var pusher = function pdNodeLocal__directory_readDir_stat_dirtest_pusher(itempath) {
                                        if (listtype === "diff") {
                                            dfiles
                                                .filepath
                                                .push(itempath.replace(address.dabspath + path.sep, ""));
                                        } else {
                                            sfiles
                                                .filepath
                                                .push(itempath.replace(address.sabspath + path.sep, ""));
                                        }
                                        item.count += 1;
                                    };
                                    fs.stat(itempath, function pdNodeLocal__directory_readDir_stat_dirtest_stat(errb, stata) {
                                        var preprocess = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess() {
                                            var b      = 0,
                                                length = (options.mode === "diff")
                                                    ? Math.min(sfiles.filepath.length, dfiles.filepath.length)
                                                    : sfiles.filepath.length,
                                                end    = false,
                                                sizer  = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer(index, type, filename, finalone) {
                                                    fs
                                                        .stat(filename, function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer_stat(errc, statb) {
                                                            var filesize = 0;
                                                            if (errc === null) {
                                                                filesize = statb.size;
                                                            }
                                                            readLocalFile({
                                                                absolutepath: filename,
                                                                index       : index,
                                                                last        : finalone,
                                                                localpath   : filename,
                                                                size        : filesize,
                                                                type        : type
                                                            });
                                                        });
                                                };
                                            sfiles
                                                .filepath
                                                .sort();
                                            if (options.mode === "diff") {
                                                dfiles
                                                    .filepath
                                                    .sort();
                                                for (b = 0; b < length; b += 1) {
                                                    dState.push(false);
                                                    sState.push(false);
                                                    sfiledump.push("");
                                                    dfiledump.push("");
                                                    if (sfiles.filepath[b] === dfiles.filepath[b]) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        sizer(b, "diff", dfiles.filepath[b], end);
                                                        sizer(b, "source", sfiles.filepath[b], end);
                                                    } else {
                                                        if (sfiles.filepath[b] < dfiles.filepath[b]) {
                                                            if (options.diffcli === true) {
                                                                clidata[0].push(sfiles.filepath[b]);
                                                            }
                                                            if (length === dfiles.filepath.length) {
                                                                length += 1;
                                                            }
                                                            dfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        } else if (dfiles.filepath[b] < sfiles.filepath[b]) {
                                                            if (options.diffcli === true) {
                                                                clidata[1].push(dfiles.filepath[b]);
                                                            }
                                                            if (length === sfiles.filepath.length) {
                                                                length += 1;
                                                            }
                                                            sfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        }
                                                        if (b === length - 1) {
                                                            ender();
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (options.output !== "") {
                                                    for (b = 0; b < length; b += 1) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        if (sfiles.filepath[b] !== undefined) {
                                                            sizer(b, "source", sfiles.filepath[b], end);
                                                        }
                                                    }
                                                } else {
                                                    ender();
                                                }
                                            }
                                        };
                                        if (errb !== null) {
                                            return console.log(errb);
                                        }
                                        if (stata.isDirectory() === true) {
                                            if (method === "subdirectory") {
                                                item.directories += 1;
                                                pdNodeLocal__directory_readDir(itempath, listtype);
                                                item.count += 1;
                                            }
                                            if (method === "directory") {
                                                item.total       -= 1;
                                                item.directories = 0;
                                            }
                                        } else if (stata.isFile() === true) {
                                            pusher(itempath);
                                        } else {
                                            if (listtype === "diff") {
                                                dfiles.total -= 1;
                                            } else {
                                                sfiles.total -= 1;
                                            }
                                            console.log(itempath + lf + "is an unsupported type");
                                        }
                                        if (lastitem === true && ((options.mode === "diff" && sfiles.count === sfiles.total && dfiles.count === dfiles.total && sfiles.directories === 0 && dfiles.directories === 0) || (options.mode !== "diff" && item.directories === 0 && item.count === item.total))) {
                                            return preprocess();
                                        }
                                    });
                                };
                            if (erra !== null) {
                                return console.log(erra);
                            }
                            if (stat.isDirectory() === true) {
                                fs
                                    .readdir(start, function pdNodeLocal__directory_readDir_stat_readdir(errd, files) {
                                        var x         = 0,
                                            filetotal = files.length;
                                        if (errd !== null || filetotal === 0) {
                                            if (method === "subdirectory") {
                                                if (listtype === "diff") {
                                                    dfiles.directories -= 1;
                                                } else {
                                                    sfiles.directories -= 1;
                                                }
                                            }
                                            if (errd !== null) {
                                                return console.log(errd);
                                            }
                                            return;
                                        }
                                        if (listtype === "diff") {
                                            item = dfiles;
                                        } else {
                                            item = sfiles;
                                        }
                                        item.total += filetotal;
                                        for (x = 0; x < filetotal; x += 1) {
                                            if (x === filetotal - 1) {
                                                item.directories -= 1;
                                                dirtest(start + path.sep + files[x], true);
                                            } else {
                                                dirtest(start + path.sep + files[x], false);
                                            }
                                        }
                                    });
                            } else {
                                return console.log("path: " + start + " is not a directory");
                            }
                        });
                };
            readDir(address.sabspath, "source");
            if (options.mode === "diff") {
                readDir(address.dabspath, "diff");
            }
        };

    //defaults for the options
    (function pdNodeLocal__start() {
        var a         = process
                .argv
                .slice(2),
            b         = 0,
            c         = a.length,
            d         = [],
            e         = [],
            f         = 0,
            alphasort = false,
            outready  = false,
            pdrcpath  = __dirname.replace(/(api)$/, "") + ".prettydiffrc",
            pathslash = function pdNodeLocal__start_pathslash(name, x) {
                var y        = x.indexOf("://"),
                    z        = "",
                    itempath = "",
                    ind      = "",
                    odirs   = [],
                    olen     = 0,
                    basepath = "",
                    makeout  = function pdNodeLocal__start_pathslash_makeout() {
                        basepath = basepath + odirs[olen] + path.sep;
                        fs.mkdir(basepath, function pdNodeLocal__start_pathslash_makeout_mkdir(err) {
                            if (err !== undefined && err !== null && err.code !== "EEXIST") {
                                console.log(err);
                                outready = true;
                            } else if (olen < odirs.length) {
                                olen += 1;
                                if (olen < odirs.length) {
                                    pdNodeLocal__start_pathslash_makeout();
                                } else {
                                    outready = true;
                                }
                            } else {
                                outready = true;
                            }
                        });
                    },
                    abspath  = function pdNodeLocal__start_pathslash_abspath() {
                        var tree  = cwd.split(path.sep),
                            ups   = [],
                            uplen = 0;
                        if (itempath.indexOf("..") === 0) {
                            ups   = itempath.replace(/\.\.\//g, ".." + path.sep).split(".." + path.sep);
                            uplen = ups.length;
                            do {
                                uplen -= 1;
                                tree.pop();
                            } while (uplen > 1);
                            return tree.join(path.sep) + path.sep + ups[ups.length - 1];
                        }
                        if ((/^([a-z]:(\\|\/))/).test(itempath) === true || itempath.indexOf(path.sep) === 0) {
                            return itempath;
                        }
                        return path.join(cwd, itempath);
                    };
                if (name === "diff") {
                    ind = 0;
                }
                if (name === "output") {
                    ind = 1;
                }
                if (name === "source") {
                    ind = 2;
                }
                if (x.indexOf("http://") === 0 || x.indexOf("https://") === 0) {
                    dir[ind] = 3;
                    return x;
                }
                if (y < 0) {
                    itempath = x.replace(/\\/g, "/");
                } else {
                    z        = x.slice(0, y);
                    x        = x.slice(y + 3);
                    itempath = z + "://" + x.replace(/\\/g, "/");
                }
                fs
                    .stat(itempath, function pdNodeLocal__start_pathslash_stat(err, stat) {
                        if (err !== null) {
                            dir[ind] = -1;
                            return "";
                        }
                        if (stat.isDirectory() === true) {
                            dir[ind] = 1;
                        } else if (stat.isFile() === true) {
                            dir[ind] = 2;
                            if (name === "output") {
                                outready = true;
                            }
                        } else {
                            dir[ind] = -1;
                            if (name === "output") {
                                outready = true;
                            }
                        }
                    });
                if (name === "diff") {
                    address.dabspath = abspath();
                    address.dorgpath = itempath;
                }
                if (name === "output") {
                    if (x === ".") {
                        address.oabspath = cwd;
                        address.oorgpath = cwd;
                        outready = true;
                    } else {
                        itempath = itempath.replace(/\//g, path.sep);
                        address.oabspath = abspath();
                        address.oorgpath = itempath;
                        if (address.oabspath.charAt(address.oabspath.length - 1) !== path.sep) {
                            address.oabspath = address.oabspath + path.sep;
                        }
                        basepath         = address.oabspath.replace(path.sep + address.oorgpath, "");
                        odirs            = address.oorgpath.split(path.sep);
                        makeout();
                    }
                }
                if (name === "source") {
                    address.sabspath = abspath();
                    address.sorgpath = itempath;
                }
                return itempath;
            };
        for (b = 0; b < c; b += 1) {
            e = [];
            f = a[b].indexOf(":");
            e.push(a[b].substring(0, f).replace(/(\s+)$/, ""));
            e.push(a[b].substring(f + 1).replace(/^(\s+)/, ""));
            d.push(e);
        }
        c = d.length;
        for (b = 0; b < c; b += 1) {
            if (d[b].length === 2) {
                if (options.version === false && d[b][0] === "" && (d[b][1] === "help" || d[b][1] === "man" || d[b][1] === "manual")) {
                    help = true;
                } else if (help === false && d[b][0] === "" && (d[b][1] === "v" || d[b][1] === "version")) {
                    options.version = true;
                } else if (d[b][0] === "api") {
                    options.api = "node";
                } else if (d[b][0] === "braceline" && d[b][1] === "true") {
                    options.braceline = true;
                } else if (d[b][0] === "bracepadding" && d[b][1] === "true") {
                    options.bracepadding = true;
                } else if ((d[b][0] === "braces" && d[b][1] === "allman") || (d[b][0] === "indent" && d[b][1] === "allman")) {
                    options.braces = "allman";
                } else if (d[b][0] === "color" && (d[b][1] === "canvas" || d[b][1] === "shadow")) {
                    options.color = d[b][1];
                } else if (d[b][0] === "comments" && d[b][1] === "noindent") {
                    options.comments = "noindent";
                } else if (d[b][0] === "commline" && d[b][1] === "true") {
                    options.commline = true;
                } else if (d[b][0] === "conditional" && d[b][1] === "true") {
                    options.conditional = true;
                } else if (d[b][0] === "content" && d[b][1] === "true") {
                    options.content = true;
                } else if (d[b][0] === "context" && isNaN(d[b][1]) === false) {
                    options.context = Number(d[b][1]);
                } else if (d[b][0] === "correct" && d[b][1] === "true") {
                    options.correct = true;
                } else if (d[b][0] === "crlf" && d[b][1] === "true") {
                    options.crlf = true;
                    lf           = "\r\n";
                } else if (d[b][0] === "cssinsertlines" && d[b][1] === "true") {
                    options.cssinsertlines = true;
                } else if (d[b][0] === "csvchar" && d[b][1].length > 0) {
                    options.csvchar = d[b][1];
                } else if (d[b][0] === "diff" && d[b][1].length > 0) {
                    options.diff = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "diffcli" && d[b][1] === "true") {
                    options.diffcli = true;
                } else if (d[b][0] === "diffcomments" && d[b][1] === "true") {
                    options.diffcomments = true;
                } else if (d[b][0] === "difflabel" && d[b][1].length > 0) {
                    options.difflabel = d[b][1];
                } else if (d[b][0] === "diffspaceignore" && d[b][1] === "true") {
                    options.diffspaceignore = true;
                } else if (d[b][0] === "diffview" && d[b][1] === "inline") {
                    options.diffview = "inline";
                } else if (d[b][0] === "dustjs" && d[b][1] === "true") {
                    options.dustjs = true;
                } else if (d[b][0] === "elseline" && d[b][1] === "true") {
                    options.elseline = true;
                } else if (d[b][0] === "endcomma" && d[b][1] === "true") {
                    options.endcomma = true;
                } else if (d[b][0] === "force_indent" && d[b][1] === "true") {
                    options.force_indent = true;
                } else if (d[b][0] === "html" && d[b][1] === "true") {
                    options.html = true;
                } else if (d[b][0] === "inchar" && d[b][1].length > 0) {
                    d[b][1]        = d[b][1]
                        .replace(/\\t/g, "\u0009")
                        .replace(/\\n/g, "\u000a")
                        .replace(/\\r/g, "\u000d")
                        .replace(/\\f/g, "\u000c")
                        .replace(/\\b/g, "\u0008");
                    options.inchar = d[b][1];
                } else if (d[b][0] === "inlevel" && isNaN(d[b][1]) === false) {
                    options.inlevel = Number(d[b][1]);
                } else if (d[b][0] === "insize" && isNaN(d[b][1]) === false) {
                    options.insize = Number(d[b][1]);
                } else if (d[b][0] === "jsscope") {
                    if (d[b][1] === "true") {
                        options.jsscope = "report";
                    } else if (d[b][1] === "report" || d[b][1] === "html") {
                        options.jsscope = d[b][1];
                    } else {
                        options.jsscope = "none";
                    }
                } else if (d[b][0] === "lang" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv" || d[b][1] === "text")) {
                    options.lang = d[b][1];
                    if (d[b][1] === "html") {
                        options.html = true;
                    }
                } else if (d[b][0] === "langdefault" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv")) {
                    options.langdefault = d[b][1];
                } else if (d[b][0] === "methodchain") {
                    if (d[b][1] === "true" || d[b][1] === "chain") {
                        options.methodchain = "chain";
                    } else if (d[b][1] === "none") {
                        options.methodchain = "none";
                    } else {
                        options.methodchain = "indent";
                    }
                } else if (d[b][0] === "miniwrap" && d[b][1] === "true") {
                    options.miniwrap = true;
                } else if (d[b][0] === "mode" && (d[b][1] === "minify" || d[b][1] === "beautify" || d[b][1] === "parse")) {
                    options.mode = d[b][1];
                } else if (d[b][0] === "neverflatten" && d[b][1] === "true") {
                    options.neverflatten = true;
                } else if (d[b][0] === "nocaseindent" && d[b][1] === "true") {
                    options.nocaseindent = true;
                } else if (d[b][0] === "noleadzero" && d[b][1] === "true") {
                    options.noleadzero = true;
                } else if (d[b][0] === "objsort") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js" || d[b][1] === "markup") {
                        options.objsort = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.objsort = "js";
                    }
                } else if (d[b][0] === "output" && d[b][1].length > 0) {
                    options.output = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "preserve") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js") {
                        options.preserve = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.preserve = "all";
                    }
                } else if (d[b][0] === "quote" && d[b][1] === "true") {
                    options.quote = true;
                } else if (d[b][0] === "quoteConvert" && (d[b][1] === "single" || d[b][1] === "double")) {
                    options.quoteConvert = d[b][1];
                } else if (d[b][0] === "readmethod") {
                    if (d[b][1] === "auto") {
                        options.readmethod = "auto";
                    }
                    if (d[b][1] === "file") {
                        options.readmethod = "file";
                    }
                    if (d[b][1] === "filescreen") {
                        options.readmethod = "filescreen";
                    }
                    if (d[b][1] === "directory") {
                        options.readmethod = "directory";
                    }
                    if (d[b][1] === "subdirectory") {
                        options.readmethod = "subdirectory";
                    }
                    method = options.readmethod;
                } else if (d[b][0] === "report") {
                    options.output = d[b][1];
                } else if (d[b][0] === "selectorlist" && d[b][1] === "true") {
                    options.selectorlist = true;
                } else if (d[b][0] === "semicolon" && d[b][1] === "true") {
                    options.semicolon = true;
                } else if (d[b][0] === "source" && d[b][1].length > 0) {
                    options.source = pathslash(d[b][0], d[b][1]);
                } else if (d[b][0] === "sourcelabel" && d[b][1].length > 0) {
                    options.sourcelabel = d[b][1];
                } else if (d[b][0] === "space" && d[b][1] === "false") {
                    options.space = false;
                } else if (d[b][0] === "spaceclose" && d[b][1] === "true") {
                    options.spaceclose = true;
                } else if (d[b][0] === "style" && d[b][1] === "noindent") {
                    options.style = "noindent";
                } else if (d[b][0] === "styleguide") {
                    options.styleguide = d[b][1];
                } else if (d[b][0] === "summaryonly" && d[b][1] === "true") {
                    options.summaryonly = true;
                } else if (d[b][0] === "tagmerge" && d[b][1] === "true") {
                    options.tagmerge = true;
                } else if (d[b][0] === "tagsort" && d[b][1] === "true") {
                    options.tagsort = true;
                } else if (d[b][0] === "ternaryline" && d[b][1] === "true") {
                    options.ternaryline = true;
                } else if (d[b][0] === "textpreserve" && d[b][1] === "true") {
                    options.textpreserve = true;
                } else if (d[b][0] === "titanium" && d[b][1] === "true") {
                    options.titanium = true;
                } else if (d[b][0] === "topcoms" && d[b][1] === "true") {
                    options.topcoms = true;
                } else if (d[b][0] === "varword" && (d[b][1] === "each" || d[b][1] === "list")) {
                    options.varword = d[b][1];
                } else if (d[b][0] === "vertical") {
                    if (d[b][1] === "all" || d[b][1] === "none" || d[b][1] === "css" || d[b][1] === "js") {
                        options.vertical = d[b][1];
                    } else if (d[b][1] === "true") {
                        options.vertical = "all";
                    }
                } else if (d[b][0] === "wrap") {
                    if (isNaN(d[b][1]) === true) {
                        options.wrap = 80;
                    } else {
                        options.wrap = Number(d[b][1]);
                    }
                }
            } else if (help === false && options.version === false) {
                if (d[b] === "help" || d[b][0] === "help" || d[b][0] === "man" || d[b][0] === "manual") {
                    help = true;
                } else if (d[b] === "v" || d[b] === "version" || d[b][0] === "v" || d[b][0] === "version") {
                    options.version = true;
                }
            }
        }

        if (options.output === "") {
            outready = true;
        }

        fs
            .stat(pdrcpath, function pdNodeLocal__start_stat(err, stats) {
                var init = function pdNodeLocal__start_stat_init() {
                    var state   = true,
                        cliflag = false,
                        status  = function pdNodeLocal__start_stat_init_status() {
                            var tempaddy = "";
                            //status codes
                            //-1 is not file or directory
                            //0 is status pending
                            //1 is directory
                            //2 is file
                            //3 is file via http/s
                            //
                            //dir[0] - diff
                            //dir[1] - output
                            //dir[2] - source
                            if (dir[2] === 0) {
                                return;
                            }
                            if (method === "auto") {
                                if (dir[2] === 1) {
                                    method = "subdirectory";
                                } else if (dir[2] > 1) {
                                    if (options.output === "") {
                                        method = "filescreen";
                                    } else {
                                        if (options.output === "" && options.mode !== "diff") {
                                            console.log("");
                                            console.log("\x1B[91mNo output option is specified, so no files written.\x1B[39m");
                                            console.log("");
                                        }
                                        method = "file";
                                        if (options.output === "") {
                                            return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                                        }
                                    }
                                } else if (dir[2] < 0) {
                                    method = "screen";
                                }
                            }
                            if (dir[2] < 0) {
                                state = false;
                                if (options.readmethod === "screen" && options.mode !== "diff") {
                                    return screenWrite();
                                }
                                if (options.readmethod !== "screen") {
                                    if (options.readmethod === "auto") {
                                        method = "screen";
                                        if (options.mode !== "diff") {
                                            return screenWrite();
                                        }
                                    } else {
                                        return console.log("source is not a directory or file");
                                    }
                                }
                            }
                            if (dir[2] === 1 && method !== "directory" && method !== "subdirectory") {
                                state = false;
                                return console.log("source is a directory but readmethod option is not 'auto', 'directory', or 'subd" +
                                        "irectory'");
                            }
                            if (dir[2] > 1) {
                                if (method === "directory" || method === "subdirectory") {
                                    state = false;
                                    return console.log("source is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (method === "screen") {
                                    method = "filescreen";
                                }
                            }
                            if (options.mode === "diff") {
                                if (dir[0] === 0 || dir[2] === 0) {
                                    return;
                                }
                                if (dir[0] < 0) {
                                    state = false;
                                    if (options.readmethod === "auto" || (dir[2] < 0 && options.readmethod === "screen")) {
                                        if (options.readmethod === "auto" && method === "screen" && cliflag === true && options.diffcli === false) {
                                            options.diffcli = false;
                                        }
                                        if (options.diffcli === true) {
                                            return cliWrite(prettydiff.api(options), "", false);
                                        }
                                        return screenWrite();
                                    }
                                    return console.log("diff is not a directory or file");
                                }
                                if (dir[0] === 1 && method !== "directory" && method !== "subdirectory") {
                                    state = false;
                                    return console.log("diff is a directory but readmethod option is not 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 2 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return console.log("diff is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 1 && method === "screen") {
                                    method = "filescreen";
                                }
                                if (dir[0] > 1 && dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = false;
                                    dState.push(false);
                                    sState.push(false);
                                    if (dir[0] === 3) {
                                        readHttpFile({absolutepath: options.diff, index: 0, last: true, localpath: options.diff, type: "diff"});
                                    } else {
                                        tempaddy = options.diff.replace(/(\/|\\)/g, path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "diff"});
                                    }
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        tempaddy = options.source.replace(/(\/|\\)/g, path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[0] === 1 && dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return directory();
                                }
                            } else {
                                if (dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = false;
                                    sState.push(false);
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        readLocalFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = false;
                                    return directory();
                                }
                            }
                        },
                        delay  = function pdNodeLocal__start_stat_init_delay() {
                            if (state === true || outready === false) {
                                status();
                                setTimeout(function pdNodeLocal__start_stat_init_delay_setTimeout() {
                                    pdNodeLocal__start_stat_init_delay();
                                }, 50);
                            }
                        };
                    if (alphasort === true) {
                        options.objsort = "all";
                    }
                    if (options.lang === "tss") {
                        options.titanium = true;
                        options.lang     = "javascript";
                    }
                    if (options.mode !== "diff") {
                        options.diffcli     = false;
                        options.summaryonly = false;
                    }
                    if (options.summaryonly === true) {
                        options.diffcli = true;
                    }

                    if (help === true) {
                        return console.log(error);
                    }
                    if (c === 1 && options.version === true) {
                        return console.log(versionString);
                    }
                    if (options.source === "") {
                        return console.log("Error: 'source' argument is empty");
                    }
                    if (options.mode === "diff" && options.diff === "") {
                        return console.log("Error: 'diff' argument is empty");
                    }
                    if ((options.mode === "diff" && options.summaryonly === false) || (options.jsscope !== "none" && options.mode === "beautify")) {
                        options.report = true;
                    }
                    if ((options.output === "" || options.summaryonly === true) && options.mode === "diff") {
                        if (options.readmethod !== "screen") {
                            if (options.readmethod === "auto") {
                                cliflag = true;
                            } else {
                                options.diffcli = true;
                            }
                        }
                        if (process.argv.join(" ").indexOf(" context:") === -1) {
                            options.context = 2;
                        }
                    }
                    if (method === "file" && options.output === "" && options.summaryonly === false && options.diffcli === false) {
                        return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                    }
                    if (options.summaryonly === true) {
                        options.report = false;
                    }
                    if (dir[2] === 0 || outready === false || (options.mode === "diff" && dir[0] === 0)) {
                        delay();
                    } else {
                        status();
                    }
                };

                if (err !== null) {
                    if (c === 0) {
                        help = true;
                    }
                    init();
                } else if (stats.isFile() === true) {
                    fs
                        .readFile(pdrcpath, {
                            encoding: "utf8"
                        }, function pdNodeLocal__start_stat_readFile(error, data) {
                            var s       = options.source,
                                dd      = options.diff,
                                o       = options.output,
                                h       = false,
                                pdrc    = {},
                                pdkeys  = [],
                                eachkey = function pdNodeLocal__start_stat_readFile_eachkey(val) {
                                    if (val !== "help" && val !== "version" && val !== "v" && val !== "man" && val !== "manual") {
                                        b += 1;
                                        if (options[val] !== undefined) {
                                            options[val] = pdrc[val];
                                            if (val === "help" && pdrc[val] === true) {
                                                h = true;
                                                b -= 1;
                                            }
                                        }
                                    }
                                };
                            if (error !== null && error !== undefined) {
                                return init();
                            }
                            if ((/^(\s*\{)/).test(data) === true && (/(\}\s*)$/).test(data) === true) {
                                pdrc   = JSON.parse(data);
                                pdkeys = Object.keys(pdrc);
                                b      = 0;
                                pdkeys.forEach(eachkey);
                                if (b > 0 && h === false) {
                                    help = false;
                                }
                                method = options.readmethod;
                                if (s !== options.source) {
                                    pathslash("source", options.source);
                                }
                                if (dd !== options.diff) {
                                    pathslash("diff", options.diff);
                                }
                                if (o !== options.output) {
                                    pathslash("output", options.output);
                                }
                                init();
                            } else {
                                pdrc = require(pdrcpath);
                                if (pdrc.preset !== undefined) {
                                    options = pdrc.preset(options);
                                    method  = options.readmethod;
                                    if (s !== options.source) {
                                        pathslash("source", options.source);
                                    }
                                    if (dd !== options.diff) {
                                        pathslash("diff", options.diff);
                                    }
                                    if (o !== options.output) {
                                        pathslash("output", options.output);
                                    }
                                    help = false;
                                    if (options.help === true && (process.argv.length < 3 || options.source === undefined || options.source === "")) {
                                        help = true;
                                    }
                                    init();
                                }
                            }
                        });
                } else {
                    init();
                }
                if (c === 0) {
                    help = true;
                }
            });
    }());
}());
