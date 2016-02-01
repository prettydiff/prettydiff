/*prettydiff.com api.topcoms: true, api.inchar: " ", api.insize: 4, api.vertical: true */
/*global ace, ActiveXObject, ArrayBuffer, AudioContext, console, csspretty, csvpretty, diffview, document, FileReader, global, jspretty, localStorage, location, markuppretty, prettydiff, navigator, safeSort, setTimeout, Uint8Array, window, XMLHttpRequest*/
/*jshint laxbreak: true*/
/*jslint for: true, this: true*/
/***********************************************************************
 This is written by Austin Cheney on 3 Mar 2009. Anybody may use this
 code without permission so long as this comment exists verbatim in each
 instance of its use.

 http: //mailmarkup.org/
 http: //prettydiff.com/

 ***********************************************************************/
var pd     = {},
    global = {};

(function dom__init() {
    "use strict";
    var load     = function dom__load_init() {
            return;
        },
        loadPrep = function dom__loadPrep() {
            pd.data.node = {
                announce    : pd.id("announcement"),
                beau        : pd.id("Beautify"),
                beauOps     : pd.id("beauops"),
                codeBeauIn  : pd.id("beautyinput"),
                codeBeauOut : pd.id("beautyoutput"),
                codeDiffBase: pd.id("baseText"),
                codeDiffNew : pd.id("newText"),
                codeMinnIn  : pd.id("minifyinput"),
                codeMinnOut : pd.id("minifyoutput"),
                codeParsIn  : pd.id("parseinput"),
                codeParsOut : pd.id("parseoutput"),
                comment     : pd.id("option_comment"),
                diffBase    : pd.id("diffBase"),
                diffNew     : pd.id("diffNew"),
                diffOps     : pd.id("diffops"),
                headline    : pd.id("headline"),
                jsscope     : pd.id("jsscope-yes"),
                lang        : pd.id("language"),
                langdefault : pd.id("lang-default"),
                maxInputs   : pd.id("hideOptions"),
                minn        : pd.id("Minify"),
                minnOps     : pd.id("miniops"),
                modeBeau    : pd.id("modebeautify"),
                modeDiff    : pd.id("modediff"),
                modeMinn    : pd.id("modeminify"),
                modePars    : pd.id("modeparse"),
                page        : (function dom__dataPage() {
                    var divs = document.getElementsByTagName("div");
                    if (divs.length === 0) {
                        return null;
                    }
                    return divs[0];
                }()),
                pars        : pd.id("Parse"),
                parsOps     : pd.id("parseops"),
                report      : {
                    code: {
                        box: pd.id("codereport")
                    },
                    feed: {
                        box: pd.id("feedreport")
                    },
                    stat: {
                        box: pd.id("statreport")
                    }
                },
                save        : pd.id("diff-save")
            };
            load();
        };

    if (location.href.indexOf("codemirror=") > 0) {
        (function dom__codemirror() {
            var loc     = location
                    .href
                    .split("codemirror="),
                value   = "",
                address = "";
            if (loc[1].indexOf("&") > 0) {
                value   = loc[1].slice(0, loc[1].indexOf("&"));
                address = loc[0] + loc[1].slice(loc[1].indexOf("&") + 1);
            } else {
                value   = loc[1];
                address = loc[0];
            }
            if (address.indexOf("?ace=") > 0 || address.indexOf("&ace=") > 0) {
                if (address.charAt(address.length - 1) === "&") {
                    return location.replace(address.slice(0, address.length - 1));
                }
                return location.replace(address);
            }
            if (address.indexOf("?&") > 0) {
                return location.replace(address.replace("?&", "?ace=" + value + "&"));
            }
            if (address.indexOf("&&") > 0) {
                return location.replace(address.replace("&&", "&ace=" + value + "&"));
            }
            return location.replace(address + "ace=" + value);
        }());
    }

    pd.id   = function dom__id(x) {
        if (document.getElementById === undefined) {
            return;
        }
        return document.getElementById(x);
    };

    //namespace to test for web browser features for progressive enhancement
    pd.test = {
        // accessibility analysis is locked behind a flag, this param will bypass the
        // flag
        accessibility : (location.href.toLowerCase().indexOf("accessibility=true") > 0),
        //delect if Ace Code Editor is supported
        ace           : (location.href.toLowerCase().indexOf("ace=false") < 0 && typeof ace === "object"),
        //get the lowercase useragent string
        agent         : (typeof navigator === "object")
            ? navigator
                .userAgent
                .toLowerCase()
            : "",
        //test for standard web audio support
        audio         : ((typeof AudioContext === "function" || typeof AudioContext === "object") && AudioContext !== null)
            ? new AudioContext()
            : null,
        //delays the toggling of pd.test.load to false for asynchronous code sources
        delayExecution: false,
        //am I served from the Pretty Diff domain
        domain        : (location.href.indexOf("prettydiff.com") < 15 && location.href.indexOf("prettydiff.com") > -1),
        //If the output is too large the report must open and minimize in a single step
        filled        : {
            code: false,
            feed: false,
            stat: false
        },
        //test for support of the file api
        fs            : (typeof FileReader === "function"),
        //check for native JSON support
        json          : (JSON !== undefined),
        // stores keypress state to avoid execution of pd.event.recycle from certain key
        // combinations
        keypress      : false,
        keysequence   : [],
        // supplement to ensure keypress is returned to false only after other keys
        // other than ctrl are released
        keystore      : [],
        //some operations should not occur as the page is initially loading
        load          : true,
        //test for localStorage and assign the result of the test
        ls            : (typeof localStorage === "object" && localStorage !== null && typeof localStorage.getItem === "function" && typeof localStorage.hasOwnProperty === "function"),
        // Ace will only render correctly if the parent container is visible, this test
        // solves for this problem
        render        : {
            beau: false,
            diff: false,
            minn: false,
            pars: false
        },
        //supplies alternate keyboard navigation to editable text areas
        tabesc        : [],
        //check of native AJAX support
        xhr           : (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object" || typeof ActiveXObject === "function")
    };
    if (pd.test.agent.indexOf("msie 8.0;") > 0) {
        document.getElementsByTagName("body")[0].innerHTML = "<h1>Pretty Diff</h1> <p>Sorry, but Pretty Diff no longer supports IE8. <a href='" +
                "http://www.microsoft.com/en-us/download/internet-explorer.aspx'>Please upgrade</";
        return;
    }
    //namespace for data points and dom nodes
    pd.data             = {
        announcetext       : "",
        audio              : {},
        builder            : {
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
        color              : "white", //for use with HTML themes
        colSliderProperties: [],
        commentString      : [],
        diff               : "",
        html               : [],
        langvalue          : [],
        mode               : "diff",
        node               : {
            announce    : pd.id("announcement"),
            beau        : pd.id("Beautify"),
            beauOps     : pd.id("beauops"),
            codeBeauIn  : pd.id("beautyinput"),
            codeBeauOut : pd.id("beautyoutput"),
            codeDiffBase: pd.id("baseText"),
            codeDiffNew : pd.id("newText"),
            codeMinnIn  : pd.id("minifyinput"),
            codeMinnOut : pd.id("minifyoutput"),
            codeParsIn  : pd.id("parseinput"),
            codeParsOut : pd.id("parseoutput"),
            comment     : pd.id("option_comment"),
            diffBase    : pd.id("diffBase"),
            diffNew     : pd.id("diffNew"),
            diffOps     : pd.id("diffops"),
            headline    : pd.id("headline"),
            jsscope     : pd.id("jsscope-yes"),
            lang        : pd.id("language"),
            langdefault : pd.id("lang-default"),
            maxInputs   : pd.id("hideOptions"),
            minn        : pd.id("Minify"),
            minnOps     : pd.id("miniops"),
            modeBeau    : pd.id("modebeautify"),
            modeDiff    : pd.id("modediff"),
            modeMinn    : pd.id("modeminify"),
            modePars    : pd.id("modeparse"),
            page        : (function dom__dataPage() {
                var divs = document.getElementsByTagName("div");
                if (divs.length === 0) {
                    return null;
                }
                return divs[0];
            }()),
            pars        : pd.id("Parse"),
            parsOps     : pd.id("parseops"),
            report      : {
                code: {
                    box: pd.id("codereport")
                },
                feed: {
                    box: pd.id("feedreport")
                },
                stat: {
                    box: pd.id("statreport")
                }
            },
            save        : pd.id("diff-save")
        },
        settings           : {},
        source             : "",
        sourceLength       : {
            beau    : 0,
            diffBase: 0,
            diffNew : 0,
            minn    : 0,
            pars    : 0
        },
        stat               : {
            avday : 1,
            beau  : 0,
            css   : 0,
            csv   : 0,
            diff  : 0,
            fdate : 0,
            js    : 0,
            large : 0,
            markup: 0,
            minn  : 0,
            pars  : 0,
            pdate : "",
            text  : 0,
            usage : 0,
            useday: 0,
            visit : 0
        },
        tabtrue            : false,
        zIndex             : 10
    };
    pd.data.html        = [
        pd.data.builder.html.head, //0
        pd.data.builder.css.color.canvas, //1
        pd.data.builder.css.color.shadow, //2
        pd.data.builder.css.color.white, //3
        pd.data.builder.css.reports, //4
        pd.data.builder.css.global, //5
        pd.data.builder.html.body, //6
        pd.data.builder.html.color, //7
        pd.data.builder.html.intro, //8
        "", //9 - for meta analysis, like stats and accessibility
        "", //10 - for generated report
        pd.data.builder.html.script, //11
        pd.data.builder.script.diff, //12
        pd.data.builder.html.end //13
    ];

    //namespace for Ace editors
    pd.ace              = {};
    //namespace for internal functions
    pd.app              = {
        //builds the Ace editors
        aceApply : function dom__app_aceApply(nodeName, className, maxWidth) {
            var div        = document.createElement("div"),
                span       = document.createElement("span"),
                node       = pd.data.node[nodeName],
                parent     = node.parentNode.parentNode,
                attributes = node.attributes,
                len        = attributes.length,
                a          = 0,
                edit       = {},
                dollar     = "$";
            for (a = 0; a < len; a += 1) {
                if (attributes[a].name !== "rows" && attributes[a].name !== "cols" && attributes[a].name !== "wrap") {
                    div.setAttribute(attributes[a].name, attributes[a].value);
                }
            }
            parent.appendChild(div);
            if (className === "output") {
                span.setAttribute("class", "clear");
                parent.appendChild(span);
            }
            parent.removeChild(node.parentNode);
            div.setAttribute("class", className);
            if (maxWidth === true) {
                div.style.width = "100%";
            }
            div.style.fontSize              = "1.4em";
            edit                            = ace.edit(div);
            pd.data.node[nodeName]          = div.getElementsByTagName("textarea")[0];
            edit[dollar + "blockScrolling"] = Infinity;
            return edit;
        },
        // Readjusts the heights of the editors to compensate for various changes to the
        // interface, like screen resize
        fixHeight: function dom__app_fixHeight() {
            var baseText = pd.id("baseText"),
                newText  = pd.id("newText"),
                beauIn   = pd.id("beautyinput"),
                beauOut  = pd.id("beautyoutput"),
                minnIn   = pd.id("minifyinput"),
                minnOut  = pd.id("minifyoutput"),
                parsIn   = pd.id("parseinput"),
                parsOut  = pd.id("parseoutput"),
                math     = 0,
                height   = window.innerHeight || document.getElementsByTagName("body")[0].clientHeight,
                headline = 0;
            if (pd.data.node.headline !== null && pd.data.node.headline.style.display === "block") {
                headline = 3.8;
            }
            if (pd.test.ace === true) {
                if (baseText !== null && newText !== null) {
                    math                  = (height / 14) - (16.5 + headline);
                    baseText.style.height = math + "em";
                    newText.style.height  = math + "em";
                    pd
                        .ace
                        .diffBase
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .diffNew
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .diffBase
                        .resize();
                    pd
                        .ace
                        .diffNew
                        .resize();
                }
                math = (height / 14) - (14.31 + headline);
                if (pd.data.node.codeBeauIn !== null) {
                    beauIn.style.height = math + "em";
                    pd
                        .ace
                        .beauIn
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .beauIn
                        .resize();
                }
                if (pd.data.node.codeMinnIn !== null) {
                    minnIn.style.height = math + "em";
                    pd
                        .ace
                        .minnIn
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .minnIn
                        .resize();
                }
                if (pd.data.node.codeParsIn !== null) {
                    parsIn.style.height = math + "em";
                    pd
                        .ace
                        .parsIn
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .parsIn
                        .resize();
                }
                if (pd.data.node.codeBeauOut !== null) {
                    beauOut.style.height = math + "em";
                    pd
                        .ace
                        .beauOut
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .beauOut
                        .resize();
                }
                if (pd.data.node.codeMinnOut !== null) {
                    minnOut.style.height = math + "em";
                    pd
                        .ace
                        .minnOut
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .minnOut
                        .resize();
                }
                if (pd.data.node.codeParsOut !== null) {
                    parsOut.style.height = math + "em";
                    pd
                        .ace
                        .parsOut
                        .setStyle("height:" + math + "em");
                    pd
                        .ace
                        .parsOut
                        .resize();
                }
            } else {
                if (baseText !== null && newText !== null) {
                    math                  = (height / 14.4) - (16.25 + headline);
                    baseText.style.height = math + "em";
                    newText.style.height  = math + "em";
                }
                math = (height / 14.4) - (15.425 + headline);
                if (pd.data.node.codeBeauIn !== null) {
                    pd.data.node.codeBeauIn.style.height = math + "em";
                }
                if (pd.data.node.codeMinnIn !== null) {
                    pd.data.node.codeMinnIn.style.height = math + "em";
                }
                if (pd.data.node.codeParsIn !== null) {
                    pd.data.node.codeParsIn.style.height = math + "em";
                }
                if (pd.data.node.codeBeauOut !== null) {
                    pd.data.node.codeBeauOut.style.height = math + "em";
                }
                if (pd.data.node.codeMinnOut !== null) {
                    pd.data.node.codeMinnOut.style.height = math + "em";
                }
                if (pd.data.node.codeParsOut !== null) {
                    pd.data.node.codeParsOut.style.height = math + "em";
                }
            }
        },
        //sets indentation size in Ace editors
        insize   : function dom__app_insize() {
            var that  = this,
                value = Number(that.value);
            if (that === pd.id("diff-quan")) {
                if (pd.data.node.codeDiffBase !== null) {
                    pd
                        .ace
                        .diffBase
                        .getSession()
                        .setTabSize(value);
                }
                if (pd.data.node.codeDiffNew !== null) {
                    pd
                        .ace
                        .diffNew
                        .getSession()
                        .setTabSize(value);
                }
            } else if (that === pd.id("beau-quan")) {
                if (pd.data.node.codeBeauIn !== null) {
                    pd
                        .ace
                        .beauIn
                        .getSession()
                        .setTabSize(value);
                }
                if (pd.data.node.codeBeauOut !== null) {
                    pd
                        .ace
                        .beauOut
                        .getSession()
                        .setTabSize(value);
                }
            } else if (that === pd.id("minn-quan")) {
                if (pd.data.node.codeMinnIn !== null) {
                    pd
                        .ace
                        .minnIn
                        .getSession()
                        .setTabSize(value);
                }
                if (pd.data.node.codeMinnOut !== null) {
                    pd
                        .ace
                        .minnOut
                        .getSession()
                        .setTabSize(value);
                }
            } else if (that === pd.id("pars-quan")) {
                if (pd.data.node.codeMinnIn !== null) {
                    pd
                        .ace
                        .minnIn
                        .getSession()
                        .setTabSize(value);
                }
                if (pd.data.node.codeMinnOut !== null) {
                    pd
                        .ace
                        .minnOut
                        .getSession()
                        .setTabSize(value);
                }
            }
        },
        // determine the specific language if auto or unknown all - change all language
        // modes? comes from pd.codeops, which is      fired on change of language
        // select list obj - the ace obj passed in. {} empty object if `all` is true
        // lang - a language passed in. "" empty string means auto detect
        langkey  : function dom__app_langkey(all, obj, lang) {
            var value       = [],
                sample      = "",
                setlangmode = function dom__app_langkey_setlangmode(input) {
                    if (input === "css" || input === "less" || input === "scss") {
                        return "css";
                    }
                    if (input.indexOf("html") > -1 || input === "html" || input === "ejs" || input === "html_ruby" || input === "handlebars" || input === "swig" || input === "twig" || input === "php" || input === "dustjs") {
                        return "html";
                    }
                    if (input === "markup" || input === "jsp" || input === "xml" || input === "xhtml" || input === "coldfusion") {
                        return "markup";
                    }
                    if (input === "javascript" || input === "json" || input === "jsx") {
                        return "javascript";
                    }
                    if (input === "text" || input === "csv") {
                        return "text";
                    }
                    if (input === "csv") {
                        return "csv";
                    }
                    return "javascript";
                },
                nameproper  = function dom__app_langkey_nameproper(input) {
                    if (input === "javascript") {
                        return "JavaScript";
                    }
                    if (input === "text") {
                        return "Plain Text";
                    }
                    if (input === "jsx") {
                        return "React JSX";
                    }
                    if (input === "scss") {
                        return "SCSS (Sass)";
                    }
                    if (input === "ejs") {
                        return "EJS Template";
                    }
                    if (input === "handlebars") {
                        return "Handlebars Template";
                    }
                    if (input === "html_ruby") {
                        return "ERB (Ruby) Template";
                    }
                    if (input === "tss" || input === "titanium") {
                        return "Titanium Stylesheets";
                    }
                    if (input === "typescript") {
                        return "TypeScript (not supported yet)";
                    }
                    if (input === "twig") {
                        return "HTML TWIG Template";
                    }
                    if (input === "jsp") {
                        return "JSTL (JSP)";
                    }
                    if (input === "java") {
                        return "Java (not supported yet)";
                    }
                    if (input === "dustjs") {
                        return "Dust.js";
                    }
                    if (input === "coldfusion") {
                        return "ColdFusion";
                    }
                    return input.toUpperCase();
                },
                defaultt    = (pd.data.node.langdefault === null || pd.data.node.langdefault.nodeName.toLowerCase() !== "select")
                    ? "javascript"
                    : setlangmode(pd.data.node.langdefault[pd.data.node.langdefault.selectedIndex].value),
                // defaultt      = actual default lang value from the select list [0]
                // = language value for ace mode [1]           = prettydiff language category
                // from [0] [2]           = pretty formatting for text output to user

                auto = function dom__app_langkey_auto(a) {
                    var b      = [],
                        c      = 0,
                        d      = 0,
                        join   = "",
                        flaga  = false,
                        flagb  = false,
                        output = function dom__app_langkey_auto_output(langname) {
                            if (langname === "unknown") {
                                return [defaultt, setlangmode(defaultt), "unknown"];
                            }
                            if (langname === "xhtml" || langname === "markup") {
                                return ["xml", "html", "XHTML"];
                            }
                            if (langname === "tss") {
                                return ["tss", "tss", "Titanium Stylesheets"];
                            }
                            return [langname, setlangmode(langname), nameproper(langname)];
                        };
                    if (a === null) {
                        return;
                    }
                    if ((/\sclass\s+\w/).test(a) === false && (/(\s|;|\})((if)|(for)|(function\s*\w*))\s*\(/).test(a) === false && (/((var)|(let)|(const))\s*\w/).test(a) === false && (/return\s*\w*\s*(;|\})/).test(a) === false && (a === undefined || (/^(\s*#(?!(!\/)))/).test(a) === true || (/\n\s*(\.|@)\w+(\(?|(\s*:))/).test(a) === true)) {
                        if ((/\$[a-zA-Z]/).test(a) === true || (/\{\s*(\w|\.|\$|#)+\s*\{/).test(a) === true) {
                            return output("scss");
                        }
                        if ((/@[a-zA-Z]/).test(a) === true || (/\{\s*(\w|\.|@|#)+\s*\{/).test(a) === true) {
                            return output("less");
                        }
                        return output("css");
                    }
                    b = a
                        .replace(/\[[a-zA-Z][\w\-]*\=("|')?[a-zA-Z][\w\-]*("|')?\]/g, "")
                        .split("");
                    c = b.length;
                    if ((/^([\s\w\-]*<)/).test(a) === false && (/(>[\s\w\-]*)$/).test(a) === false) {
                        for (d = 1; d < c; d += 1) {
                            if (flaga === false) {
                                if (b[d] === "*" && b[d - 1] === "/") {
                                    b[d - 1] = "";
                                    flaga    = true;
                                } else if (flagb === false && b[d] === "f" && d < c - 6 && b[d + 1] === "i" && b[d + 2] === "l" && b[d + 3] === "t" && b[d + 4] === "e" && b[d + 5] === "r" && b[d + 6] === ":") {
                                    flagb = true;
                                }
                            } else if (flaga === true && b[d] === "*" && d !== c - 1 && b[d + 1] === "/") {
                                flaga    = false;
                                b[d]     = "";
                                b[d + 1] = "";
                            } else if (flagb === true && b[d] === ";") {
                                flagb = false;
                                b[d]  = "";
                            }
                            if (flaga === true || flagb === true) {
                                b[d] = "";
                            }
                        }
                        join = b.join("");
                        if ((/^(\s*(\{|\[)(?!%))/).test(a) === true && (/((\]|\})\s*)$/).test(a) && a.indexOf(",") !== -1) {
                            return output("json");
                        }
                        if ((/((\}?(\(\))?\)*;?\s*)|([a-z0-9]("|')?\)*);?(\s*\})*)$/i).test(a) === true && ((/(((var)|(let)|(const))\s+(\w|\$)+[a-zA-Z0-9]*)/).test(a) === true || (/console\.log\(/).test(a) === true || (/export\s+default\s+class\s+/).test(a) === true || (/document\.get/).test(a) === true || (/((\=|(\$\())\s*function)|(\s*function\s+(\w*\s+)?\()/).test(a) === true || a.indexOf("{") === -1 || (/^(\s*if\s+\()/).test(a) === true)) {
                            if (a.indexOf("(") > -1 || a.indexOf("=") > -1 || (a.indexOf(";") > -1 && a.indexOf("{") > -1)) {
                                if ((/:\s*((number)|(string))/).test(a) === true && (/((public)|(private))\s+/).test(a) === true) {
                                    return output("typescript");
                                }
                                return output("javascript");
                            }
                            return output("unknown");
                        }
                        if (a.indexOf("{") !== -1 && (/^(\s*[\{\$\.#@a-z0-9])|^(\s*\/(\*|\/))|^(\s*\*\s*\{)/i).test(a) === true && (/^(\s*if\s*\()/).test(a) === false && (/\=\s*(\{|\[|\()/).test(join) === false && (((/(\+|-|\=|\?)\=/).test(join) === false || (/\/\/\s*\=+/).test(join) === true) || ((/\=+('|")?\)/).test(a) === true && (/;\s*base64/).test(a) === true)) && (/function(\s+\w+)*\s*\(/).test(join) === false) {
                            if ((/:\s*((number)|(string))/).test(a) === true && (/((public)|(private))\s+/).test(a) === true) {
                                return output("typescript");
                            }
                            if ((/((public)|(private))\s+(((static)?\s+(v|V)oid)|(class)|(final))/).test(a) === true) {
                                return output("java");
                            }
                            if ((/\sclass\s+\w/).test(a) === false && (/<[a-zA-Z]/).test(a) === true && (/<\/[a-zA-Z]/).test(a) === true && ((/\s?\{%/).test(a) === true || (/\{(\{|#)(?!(\{|#|\=))/).test(a) === true)) {
                                return output("twig");
                            }
                            if ((/^\s*(\$|@)/).test(a) === false && ((/:\s*(\{|\(|\[)/).test(a) === true || (/(\{|\s|;)render\s*\(\)\s*\{/).test(a) === true || (/^(\s*return;?\s*\{)/).test(a) === true) && (/(\};?\s*)$/).test(a) === true) {
                                return output("javascript");
                            }
                            if ((/\{\{#/).test(a) === true && (/\{\{\//).test(a) === true && (/<\w/).test(a) === true) {
                                return output("handlebars");
                            }
                            if ((/\{\s*(\w|\.|@|#)+\s*\{/).test(a) === true) {
                                return output("less");
                            }
                            if ((/\$(\w|-)/).test(a) === true) {
                                return output("scss");
                            }
                            if ((/(;|\{|:)\s*@\w/).test(a) === true) {
                                return output("less");
                            }
                            return output("css");
                        }
                        if ((/"\s*:\s*\{/).test(a) === true) {
                            return output("tss");
                        }
                        if (a.indexOf("{%") > -1) {
                            return output("twig");
                        }
                        return output("unknown");
                    }
                    if ((((/(>[\w\s:]*)?<(\/|!)?[\w\s:\-\[]+/).test(a) === true || (/^(\s*<\?xml)/).test(a) === true) && ((/^([\s\w]*<)/).test(a) === true || (/(>[\s\w]*)$/).test(a) === true)) || ((/^(\s*<s((cript)|(tyle)))/i).test(a) === true && (/(<\/s((cript)|(tyle))>\s*)$/i).test(a) === true)) {
                        if ((/^(\s*<!doctype\ html>)/i).test(a) === true || (/^(\s*<html)/i).test(a) === true || ((/^(\s*<!DOCTYPE\s+((html)|(HTML))\s+PUBLIC\s+)/).test(a) === true && (/XHTML\s+1\.1/).test(a) === false && (/XHTML\s+1\.0\s+(S|s)((trict)|(TRICT))/).test(a) === false)) {
                            if ((/<%\s*\}/).test(a) === true) {
                                return output("ejs");
                            }
                            if ((/<%\s*end/).test(a) === true) {
                                return output("html_ruby");
                            }
                            if ((/\{\{(#|\/|\{)/).test(a) === true) {
                                return output("handlebars");
                            }
                            if ((/\{\{end\}\}/).test(a) === true) {
                                //place holder for Go lang templates

                                return output("html");
                            }
                            if ((/\s?\{%/).test(a) === true && (/\{(\{|#)(?!(\{|#|\=))/).test(a) === true) {
                                return output("twig");
                            }
                            if ((/<\?/).test(a) === true) {
                                return output("php");
                            }
                            if ((/<jsp:include\s/).test(a) === true || (/<c:((set)|(if))\s/).test(a) === true) {
                                return output("jsp");
                            }
                            if ((/\{(#|\?|\^|@|<|\+|~)/).test(a) === true && (/\{\//).test(a) === true) {
                                return output("dustjs");
                            }
                            return output("html");
                        }
                        if ((/<jsp:include\s/).test(a) === true || (/<c:((set)|(if))\s/).test(a) === true) {
                            return output("jsp");
                        }
                        if ((/<%\s*\}/).test(a) === true) {
                            return output("ejs");
                        }
                        if ((/<%\s*end/).test(a) === true) {
                            return output("html_ruby");
                        }
                        if ((/\{\{(#|\/|\{)/).test(a) === true) {
                            return output("handlebars");
                        }
                        if ((/\{\{end\}\}/).test(a) === true) {
                            //place holder for Go lang templates

                            return output("xml");
                        }
                        if ((/\s?\{%/).test(a) === true && (/\{\{(?!(\{|#|\=))/).test(a) === true) {
                            return output("twig");
                        }
                        if ((/<\?(?!(xml))/).test(a) === true) {
                            return output("php");
                        }
                        if ((/\{(#|\?|\^|@|<|\+|~)/).test(a) === true && (/\{\//).test(a) === true) {
                            return output("dustjs");
                        }
                        if ((/<jsp:include\s/).test(a) === true || (/<c:((set)|(if))\s/).test(a) === true) {
                            return output("jsp");
                        }
                        return output("xml");
                    }
                    return output("unknown");
                };
            if (obj !== undefined && obj !== null) {
                if (pd.test.ace === true && obj.getValue !== undefined) {
                    sample = obj.getValue();
                } else if (typeof obj.value === "string") {
                    sample = obj.value;
                }
            }
            if (pd.data.node.lang !== null && pd.data.node.lang.selectedIndex > 0) {
                all  = true;
                lang = pd.data.node.lang[pd.data.node.lang.selectedIndex].value;
            }
            if (lang === "csv") {
                pd.data.langvalue = ["plain_text", "csv", "CSV"];
                value             = pd.data.langvalue;
            } else if (lang === "text") {
                pd.data.langvalue = ["plain_text", "text", "Plain Text"];
                value             = pd.data.langvalue;
            } else if (lang !== "") {
                pd.data.langvalue = [lang, setlangmode(lang), nameproper(lang)];
                value             = pd.data.langvalue;
            } else if (sample !== "" || pd.test.ace === false) {
                pd.data.langvalue = auto(sample);
                value             = pd.data.langvalue;
            } else {
                pd.data.langvalue = [defaultt, setlangmode(defaultt), nameproper(defaultt)];
                value             = pd.data.langvalue;
            }
            if (pd.test.ace === true) {
                if (value[0] === "tss") {
                    value[0] = "javascript";
                } else if (value[0] === "dustjs") {
                    value[0] = "html";
                } else if (value[0] === "markup") {
                    value[0] = "xml";
                }
                if (all === true || pd.data.mode === "beau") {
                    if (all === true && lang === "") {
                        value             = auto(pd.ace.beauIn.getValue());
                        pd.data.langvalue = value;
                    }
                    if (pd.data.node.codeBeauIn !== null) {
                        pd
                            .ace
                            .beauIn
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                    if (pd.data.node.codeBeauOut !== null) {
                        pd
                            .ace
                            .beauOut
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                }
                if (all === true || pd.data.mode === "minn") {
                    if (all === true && lang === "") {
                        value             = auto(pd.ace.minnIn.getValue());
                        pd.data.langvalue = value;
                    }
                    if (pd.data.node.codeMinnIn !== null) {
                        pd
                            .ace
                            .minnIn
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                    if (pd.data.node.codeMinnOut !== null) {
                        pd
                            .ace
                            .minnOut
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                }
                if (all === true || pd.data.mode === "pars") {
                    if (all === true && lang === "") {
                        value             = auto(pd.ace.parsIn.getValue());
                        pd.data.langvalue = value;
                    }
                    if (pd.data.node.codeParsIn !== null) {
                        pd
                            .ace
                            .parsIn
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                    if (pd.data.node.codeParsOut !== null) {
                        pd
                            .ace
                            .parsOut
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                }
                if (all === true || pd.data.mode === "diff") {
                    if (all === true && lang === "") {
                        value             = auto(pd.ace.diffBase.getValue());
                        pd.data.langvalue = value;
                    }
                    if (pd.data.node.codeDiffBase !== null) {
                        pd
                            .ace
                            .diffBase
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                    if (pd.data.node.codeDiffNew !== null) {
                        pd
                            .ace
                            .diffNew
                            .getSession()
                            .setMode("ace/mode/" + value[0]);
                    }
                }
            }
            if (all === true && lang !== "") {
                return lang;
            }
            if (value.length < 1 && lang === "") {
                if (pd.data.mode === "beau" && pd.data.node.codeBeauIn !== null) {
                    value = auto(pd.data.node.codeBeauIn.value);
                } else if (pd.data.mode === "minn" && pd.data.node.codeMinnIn !== null) {
                    value = auto(pd.data.node.codeMinnIn.value);
                } else if (pd.data.mode === "pars" && pd.data.node.codeParsIn !== null) {
                    value = auto(pd.data.node.codeParsIn.value);
                } else {
                    if (pd.data.node.codeDiffBase !== null) {
                        value = auto(pd.data.node.codeDiffBase.value);
                    } else if (pd.data.node.codeDiffNew !== null) {
                        value = auto(pd.data.node.codeDiffNew.value);
                    }
                }
                if (value.length < 1) {
                    return "javascript";
                }
                pd.data.langvalue = value;
            }
            if (lang === "text") {
                return "text";
            }
            if (lang !== "") {
                return setlangmode(lang);
            }
            return pd.data.langvalue[1];
        },
        //store tool changes into localStorage to maintain state
        options  : function dom__app_options(x) {
            var item   = {},
                node   = "",
                name   = "",
                type   = "",
                id     = "",
                classy = "",
                h3     = {},
                body   = {};
            if (x !== undefined && x.nodeType === 1) {
                if (x.nodeName.toLowerCase() === "input" || x.nodeName.toLowerCase() === "select" || x.nodeName.toLowerCase() === "div") {
                    item = x;
                } else {
                    item = x.getElementsByTagName("input")[0];
                    if (item === undefined) {
                        return;
                    }
                }
            } else if (this.nodeName.toLowerCase() === "input" || this.nodeName.toLowerCase() === "select" || this.nodeName.toLowerCase() === "div") {
                item = this;
            } else {
                item = this.getElementsByTagName("input")[0];
            }
            if (item.nodeType !== 1) {
                return;
            }
            if (item.nodeName.toLowerCase() !== "div" && pd.test.load === false && item !== pd.data.node.lang) {
                item.focus();
            }
            node   = item
                .nodeName
                .toLowerCase();
            name   = item.getAttribute("name");
            type   = item.getAttribute("type");
            id     = item.getAttribute("id");
            classy = item.getAttribute("class");
            if (pd.test.load === true) {
                return;
            }
            if (node === "input") {
                if (type === "radio") {
                    if (id === "beau-other") {
                        pd.data.settings.beauchar = pd
                            .id("beau-char")
                            .value;
                    } else {
                        pd.data.settings[name] = id;
                    }
                    if (id === "diff-other") {
                        pd.data.settings.diffchar = pd
                            .id("diff-char")
                            .value;
                    } else {
                        pd.data.settings[name] = id;
                    }
                } else if (type === "text") {
                    if (id === "beau-char") {
                        pd.data.settings.beauchar = item.value;
                    } else if (id === "diff-char") {
                        pd.data.settings.diffchar = item.value;
                    } else {
                        pd.data.settings[id] = item.value;
                    }
                }
            } else if (node === "select") {
                pd.data.settings[id] = item.selectedIndex;
            } else if (node === "div" && classy === "box") {
                h3   = item.getElementsByTagName("h3")[0];
                body = item.getElementsByTagName("div")[0];
                if (pd.data.settings[id] === undefined) {
                    pd.data.settings[id] = {};
                }
                if (body.style.display === "none" && h3.clientWidth < 175) {
                    pd.data.settings[id].min = true;
                    pd.data.settings[id].max = false;
                } else if (pd.data.settings[id].max === false || pd.data.settings[id].max === undefined) {
                    pd.data.settings[id].min  = false;
                    pd.data.settings[id].left = item.offsetLeft;
                    pd.data.settings[id].top  = item.offsetTop;
                    if (pd.test.agent.indexOf("macintosh") > 0) {
                        pd.data.settings[id].width  = (body.clientWidth - 20);
                        pd.data.settings[id].height = (body.clientHeight - 53);
                    } else {
                        pd.data.settings[id].width  = (body.clientWidth - 4);
                        pd.data.settings[id].height = (body.clientHeight - 36);
                    }
                }
            } else if (node === "button" && id !== null) {
                pd.data.settings[id] = item
                    .innerHTML
                    .replace(/\s+/g, " ");
            }
            if (pd.test.json === true && pd.test.ls === true) {
                localStorage.settings = JSON.stringify(pd.data.settings);
            }

            //pd.comment additions

            if (pd.data.node.comment !== null && id !== null) {
                (function dom__app_options_comment() {
                    var a    = 0,
                        data = [];
                    if (id === "baselabel") {
                        data = ["sourcelabel", item.value];
                    } else if (id === "bbraceline-no" || id === "dbraceline-no") {
                        data = ["braceline", "false"];
                    } else if (id === "bbraceline-yes" || id === "dbraceline-yes") {
                        data = ["braceline", "true"];
                    } else if (id === "bcommline-no") {
                        data = ["commline", "false"];
                    } else if (id === "bcommline-yes") {
                        data = ["commline", "true"];
                    } else if (id === "bdustno" || id === "ddustno" || id === "mdustno" || id === "pdustno") {
                        data = ["dustjs", "false"];
                    } else if (id === "bdustyes" || id === "ddustyes" || id === "mdustyes" || id === "pdustyes") {
                        data = ["dustjs", "true"];
                    } else if (id === "beau-wrap" || id === "diff-wrap" || id === "mini-wrap") {
                        data = ["wrap", item.value];
                    } else if (id === "bendcomma-no") {
                        data = ["endcomma", "false"];
                    } else if (id === "bendcomma-yes") {
                        data = ["endcomma", "true"];
                    } else if (id === "bforce_indent-no" || id === "dforce_indent-no") {
                        data = ["force_indent", "false"];
                    } else if (id === "bforce_indent-yes" || id === "dforce_indent-yes") {
                        data = ["force_indent", "true"];
                    } else if (id === "bjslines-all" || id === "djslines-all") {
                        data = ["preserve", "all"];
                    } else if (id === "bjslines-css" || id === "djslines-css") {
                        data = ["preserve", "css"];
                    } else if (id === "bjslines-js" || id === "djslines-js") {
                        data = ["preserve", "js"];
                    } else if (id === "bjslines-none" || id === "djslines-none") {
                        data = ["preserve", "none"];
                    } else if (id === "bmethodchain-chain" || id === "dmethodchain-chain") {
                        data = ["methodchain", "chain"];
                    } else if (id === "bmethodchain-indent" || id === "dmethodchain-indent") {
                        data = ["methodchain", "indent"];
                    } else if (id === "bmethodchain-none" || id === "dmethodchain-none") {
                        data = ["methodchain", "none"];
                    } else if (id === "bnocaseindent-no" || id === "dnocaseindent-no") {
                        data = ["nocaseindent", "false"];
                    } else if (id === "bnocaseindent-yes" || id === "dnocaseindent-yes") {
                        data = ["nocaseindent", "true"];
                    } else if (id === "bnoleadzero-no") {
                        data = ["noleadzero", "false"];
                    } else if (id === "bnoleadzero-yes") {
                        data = ["noleadzero", "true"];
                    } else if (id === "bobjsort-all" || id === "dobjsort-all" || id === "mobjsort-all" || id === "pobjsort-all") {
                        data = ["objsort", "all"];
                    } else if (id === "bobjsort-cssonly" || id === "dobjsort-cssonly" || id === "mobjsort-cssonly" || id === "pobjsort-cssonly") {
                        data = ["objsort", "css"];
                    } else if (id === "bobjsort-jsonly" || id === "dobjsort-jsonly" || id === "mobjsort-jsonly" || id === "pobjsort-jsonly") {
                        data = ["objsort", "js"];
                    } else if (id === "bobjsort-markuponly" || id === "dobjsort-markuponly" || id === "mobjsort-markuponly" || id === "pobjsort-markuponly") {
                        data = ["objsort", "markup"];
                    } else if (id === "bobjsort-none" || id === "dobjsort-none" || id === "mobjsort-none" || id === "pobjsort-none") {
                        data = ["objsort", "none"];
                    } else if (id === "bquoteconvert-double" || id === "mquoteconvert-double") {
                        data = ["quoteConvert", "double"];
                    } else if (id === "bquoteconvert-none" || id === "mquoteconvert-none") {
                        data = ["quoteConvert", "none"];
                    } else if (id === "bquoteconvert-single" || id === "mquoteconvert-single") {
                        data = ["quoteConvert", "single"];
                    } else if (id === "bselectorlist-no" || id === "dselectorlist-no") {
                        data = ["selectorlist", "false"];
                    } else if (id === "bselectorlist-yes" || id === "dselectorlist-yes") {
                        data = ["selectorlist", "true"];
                    } else if (id === "bspaceclose-no") {
                        data = ["spaceclose", "false"];
                    } else if (id === "bspaceclose-yes") {
                        data = ["spaceclose", "true"];
                    } else if (id === "bstyleguide") {
                        if (item[item.selectedIndex].value === "") {
                            data = ["styleguide", ""];
                        } else {
                            data = [
                                "styleguide",
                                item[item.selectedIndex].value
                            ];
                        }
                    } else if (id === "btagmerge-no" || id === "dtagmerge-no" || id === "mtagmerge-no" || id === "ptagmerge-no") {
                        data = ["tagmerge", "false"];
                    } else if (id === "btagmerge-yes" || id === "dtagmerge-yes" || id === "mtagmerge-yes" || id === "ptagmerge-yes") {
                        data = ["tagmerge", "true"];
                    } else if (id === "btagsort-no" || id === "dtagsort-no" || id === "mtagsort-no" || id === "ptagsort-no") {
                        data = ["tagsort", "false"];
                    } else if (id === "btagsort-yes" || id === "dtagsort-yes" || id === "mtagsort-yes" || id === "ptagsort-yes") {
                        data = ["tagsort", "true"];
                    } else if (id === "bternaryline-no" || id === "dternaryline-no") {
                        data = ["ternaryline", "false"];
                    } else if (id === "bternaryline-yes" || id === "dternaryline-yes") {
                        data = ["ternaryline", "true"];
                    } else if (id === "btextpreserveno" || id === "dtextpreserveno" || id === "mtextpreserveno" || id === "ptextpreserveno") {
                        data = ["textpreserve", "false"];
                    } else if (id === "btextpreserveyes" || id === "dtextpreserveyes" || id === "mtextpreserveyes" || id === "ptextpreserveyes") {
                        data = ["textpreserve", "true"];
                    } else if (id === "bvarword-each" || id === "dvarword-each" || id === "mvarword-each" || id === "pvarword-each") {
                        data = ["varword", "each"];
                    } else if (id === "bvarword-list" || id === "dvarword-list" || id === "mvarword-list" || id === "pvarword-list") {
                        data = ["varword", "list"];
                    } else if (id === "bvarword-none" || id === "dvarword-none" || id === "mvarword-none" || id === "pvarword-none") {
                        data = ["varword", "none"];
                    } else if (id === "conditionald-no" || id === "conditionalm-no") {
                        data = ["conditional", "false"];
                    } else if (id === "conditionald-yes" || id === "conditionalm-yes") {
                        data = ["conditional", "true"];
                    } else if (id === "contextSize") {
                        data = ["context", item.value];
                    } else if (id === "csvchar") {
                        data = ["csvchar", item.value];
                    } else if (id === "cssinsertlines-no") {
                        data = ["cssinsertlines", "false"];
                    } else if (id === "cssinsertlines-yes") {
                        data = ["cssinsertlines", "true"];
                    } else if (id === "diff-char" || id === "beau-char") {
                        data = ["inchar", item.value];
                    } else if (id === "diff-line" || id === "beau-line") {
                        data = ["inchar", "\n"];
                    } else if (id === "diff-quan" || id === "beau-quan" || id === "minn-quan") {
                        data = ["insize", item.value];
                    } else if (id === "diff-space" || id === "beau-space") {
                        data = ["inchar", " "];
                    } else if (id === "diff-tab" || id === "beau-tab") {
                        data = ["inchar", "\t"];
                    } else if (id === "diffcontent") {
                        data = ["content", "true"];
                    } else if (id === "diffcontenty") {
                        data = ["content", "false"];
                    } else if (id === "diffcommentsn") {
                        data = ["diffcomments", "false"];
                    } else if (id === "diffcommentsy") {
                        data = ["diffcomments", "true"];
                    } else if (id === "difflabel") {
                        data = ["difflabel", item.value];
                    } else if (id === "diffquote") {
                        data = ["quote", "true"];
                    } else if (id === "diffquotey") {
                        data = ["quote", "false"];
                    } else if (id === "diffscolon") {
                        data = ["semicolon", "true"];
                    } else if (id === "diffscolony") {
                        data = ["semicolon", "false"];
                    } else if (id === "diffspaceignoren") {
                        data = ["diffspaceignore", "false"];
                    } else if (id === "diffspaceignorey") {
                        data = ["diffspaceignore", "true"];
                    } else if (id === "htmld-no" || id === "html-no" || id === "htmlm-no" || id === "phtml-no") {
                        data = ["html", "false"];
                    } else if (id === "htmld-yes" || id === "html-yes" || id === "htmlm-yes" || id === "phtml-yes") {
                        data = ["html", "true"];
                    } else if (id === "incomment-no") {
                        data = ["comments", "noindent"];
                    } else if (id === "incomment-yes") {
                        data = ["comments", "indent"];
                    } else if (id === "inline") {
                        data = ["diffview", "inline"];
                    } else if (id === "inlevel") {
                        data = ["inlevel", item.value];
                    } else if (id === "inscriptd-no" || id === "inscript-no") {
                        data = ["style", "noindent"];
                    } else if (id === "inscriptd-yes" || id === "inscript-yes") {
                        data = ["style", "indent"];
                    } else if (id === "jscorrect-no" || id === "mjscorrect-no") {
                        data = ["correct", "false"];
                    } else if (id === "jscorrect-yes" || id === "mjscorrect-yes") {
                        data = ["correct", "true"];
                    } else if (id === "jselseline-no") {
                        data = ["elseline", "false"];
                    } else if (id === "jselseline-yes") {
                        data = ["elseline", "true"];
                    } else if (id === "jsindentd-all" || id === "jsindent-all") {
                        data = ["indent", "allman"];
                    } else if (id === "jsindentd-knr" || id === "jsindent-knr") {
                        data = ["indent", "knr"];
                    } else if (id === "jsscope-html") {
                        data = ["jsscope", "true"];
                    } else if (id === "jsscope-no") {
                        data = ["jsscope", "false"];
                    } else if (id === "jsscope-yes") {
                        data = ["jsscope", "true"];
                    } else if (id === "jsspaced-no" || id === "jsspace-no") {
                        data = ["jsspace", "false"];
                    } else if (id === "jsspaced-yes" || id === "jsspace-yes") {
                        data = ["jsspace", "true"];
                    } else if (id === "language") {
                        data = [
                            "lang",
                            item[item.selectedIndex].value
                        ];
                    } else if (id === "lang-default") {
                        data = [
                            "langdefault",
                            item[item.selectedIndex].value
                        ];
                    } else if (id === "langauge") {
                        data = ["lang", item.value];
                    } else if (id === "lterminator-crlf") {
                        data = ["crlf", "true"];
                    } else if (id === "lterminator-lf") {
                        data = ["crlf", "false"];
                    } else if (id === "miniwrapm-no") {
                        data = ["miniwrap", "false"];
                    } else if (id === "miniwrapm-yes") {
                        data = ["miniwrap", "true"];
                    } else if (id === "modebeautify") {
                        data = ["mode", "beautify"];
                    } else if (id === "modediff") {
                        data = ["mode", "diff"];
                    } else if (id === "modeminify") {
                        data = ["mode", "minify"];
                    } else if (id === "modeparse") {
                        data = ["mode", "parse"];
                    } else if (id === "sidebyside") {
                        data = ["diffview", "sidebyside"];
                    } else if (id === "topcoms-yes") {
                        data = ["topcoms", "true"];
                    } else if (id === "topcoms-no") {
                        data = ["topcoms", "false"];
                    } else if (id === "vertical-all") {
                        data = ["vertical", "all"];
                    } else if (id === "vertical-cssonly") {
                        data = ["vertical", "css"];
                    } else if (id === "vertical-jsonly") {
                        data = ["vertical", "js"];
                    } else if (id === "vertical-none") {
                        data = ["vertical", "none"];
                    }
                    if (data.length === 0) {
                        return;
                    }
                    if (data[1] !== "true" && data[1] !== "false") {
                        data[1] = "\"" + data[1] + "\"";
                    }
                    for (a = pd.data.commentString.length - 1; a > -1; a -= 1) {
                        if (pd.data.commentString[a].indexOf(data[0]) > -1) {
                            pd.data.commentString[a] = data.join(": ");
                            break;
                        }
                    }
                    if (a < 0) {
                        pd
                            .data
                            .commentString
                            .push(data.join(": "));
                        pd
                            .data
                            .commentString
                            .sort();
                    }
                    if (pd.data.node.comment !== null) {
                        if (pd.data.commentString.length === 0) {
                            pd.data.node.comment.innerHTML = "/*prettydiff.com */";
                        } else if (pd.data.commentString.length === 1) {
                            pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                                .data
                                .commentString[0]
                                .replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/api\./g, "") + " */";
                        } else {
                            pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                                .data
                                .commentString
                                .join(", ")
                                .replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/api\./g, "") + " */";
                        }
                    }
                    if (pd.test.ls === true && pd.test.json === true) {
                        localStorage.commentString = JSON
                            .stringify(pd.data.commentString)
                            .replace(/api\./g, "");
                    }
                }());
            }
        },
        //intelligently raise the z-index of the report windows
        zTop     : function dom__app_top(x) {
            var indexListed = pd.data.zIndex,
                indexes     = [
                    (pd.data.node.report.feed.box === null)
                        ? 0
                        : Number(pd.data.node.report.feed.box.style.zIndex),
                    (pd.data.node.report.code.box === null)
                        ? 0
                        : Number(pd.data.node.report.code.box.style.zIndex),
                    (pd.data.node.report.stat.box === null)
                        ? 0
                        : Number(pd.data.node.report.stat.box.style.zIndex)
                ],
                indexMax    = Math.max(indexListed, indexes[0], indexes[1], indexes[2]) + 1;
            if (indexMax < 11) {
                indexMax = 11;
            }
            pd.data.zIndex = indexMax;
            if (x.nodeType === 1) {
                x.style.zIndex = indexMax;
            }
        }
    };
    //namespace for event handlers
    pd.event            = {
        //fixing areaTabOut in the case of unintentional back tabs
        areaShiftUp  : function dom__event_areaShiftUp(e) {
            var event = e || window.event;
            if (event.keyCode === 16 && pd.test.tabesc.length > 0) {
                pd.test.tabesc = [];
            }
            if (event.keyCode === 17 || event.keyCode === 224) {
                pd.data.tabtrue = true;
            }
        },
        //allows visual folding of function in the JSPretty jsscope HTML output
        beaufold     : function dom__event_beaufold() {
            var self  = this,
                title = self
                    .getAttribute("title")
                    .split("line "),
                min   = Number(title[1].substr(0, title[1].indexOf(" "))),
                max   = Number(title[2]),
                a     = 0,
                b     = "",
                list  = [
                    self
                        .parentNode
                        .getElementsByTagName("li"),
                    self
                        .parentNode
                        .nextSibling
                        .getElementsByTagName("li")
                ];
            if (self.innerHTML.charAt(0) === "-") {
                for (a = min; a < max; a += 1) {
                    list[0][a].style.display = "none";
                    list[1][a].style.display = "none";
                }
                self.innerHTML = "+" + self
                    .innerHTML
                    .substr(1);
            } else {
                for (a = min; a < max; a += 1) {
                    list[0][a].style.display = "block";
                    list[1][a].style.display = "block";
                    if (list[0][a].getAttribute("class") === "fold" && list[0][a].innerHTML.charAt(0) === "+") {
                        b = list[0][a].getAttribute("title");
                        b = b.substring(b.indexOf("to line ") + 1);
                        a = Number(b) - 1;
                    }
                }
                self.innerHTML = "-" + self
                    .innerHTML
                    .substr(1);
            }
        },
        //clears the Pretty Diff comment string
        clearComment : function dom__event_clearComment() {
            localStorage.commentString = "[]";
            pd.data.commentString      = [];
            if (pd.data.node.comment !== null) {
                pd.data.node.comment.innerHTML = "/*prettydiff.com */";
            }
        },
        //change the color scheme of the web UI
        colorScheme  : function dom__event_colorScheme(node) {
            var x         = (node !== undefined && node.nodeType === 1)
                    ? node
                    : this,
                option    = x.getElementsByTagName("option"),
                optionLen = option.length,
                index     = (function dom__event_colorScheme_indexLen() {
                    if (x.selectedIndex < 0 || x.selectedIndex > optionLen) {
                        x.selectedIndex = optionLen - 1;
                        return optionLen - 1;
                    }
                    return x.selectedIndex;
                }()),
                color     = option[index]
                    .innerHTML
                    .toLowerCase()
                    .replace(/\s+/g, ""),
                theme     = "",
                logoColor = "",
                logo      = pd.id("pdlogo");
            document
                .getElementsByTagName("body")[0]
                .setAttribute("class", color);
            if (pd.test.ace === true) {
                if (color === "white") {
                    theme = "ace/theme/textmate";
                }
                if (color === "shadow") {
                    theme = "ace/theme/idle_fingers";
                }
                if (color === "canvas") {
                    theme = "ace/theme/canvas";
                }
                pd
                    .ace
                    .diffBase
                    .setTheme(theme);
                pd
                    .ace
                    .diffNew
                    .setTheme(theme);
                pd
                    .ace
                    .beauIn
                    .setTheme(theme);
                pd
                    .ace
                    .beauOut
                    .setTheme(theme);
                pd
                    .ace
                    .minnIn
                    .setTheme(theme);
                pd
                    .ace
                    .minnOut
                    .setTheme(theme);
            }
            pd.data.color = color;
            if (logo !== null) {
                if (color === "canvas") {
                    logoColor = "664";
                } else if (color === "shadow") {
                    logoColor = "999";
                } else if (color === "white") {
                    logoColor = "666";
                } else {
                    logoColor = "000";
                }
                logo.style.borderColor = "#" + logoColor;
                logo
                    .getElementsByTagName("g")[0]
                    .setAttribute("fill", "#" + logoColor);
            }
            if (pd.test.load === false) {
                pd
                    .app
                    .options(x);
            }
        },
        // allows grabbing and resizing columns (from the third column) in the diff
        // side-by-side report
        colSliderGrab: function dom__event_colSliderGrab(e) {
            var event       = e || window.event,
                touch       = (e !== null && e.type === "touchstart"),
                node        = this,
                diffRight   = node.parentNode,
                diff        = diffRight.parentNode,
                subOffset   = 0,
                counter     = pd.data.colSliderProperties[0],
                data        = pd.data.colSliderProperties[1],
                width       = pd.data.colSliderProperties[2],
                total       = pd.data.colSliderProperties[3],
                offset      = pd.data.colSliderProperties[4],
                min         = 0,
                max         = data - 1,
                status      = "ew",
                minAdjust   = min + 15,
                maxAdjust   = max - 15,
                withinRange = false,
                diffLeft    = diffRight.previousSibling,
                drop        = function dom__event_colSliderGrab_drop(f) {
                    f = f || window.event;
                    f.preventDefault();
                    node.style.cursor = status + "-resize";
                    if (touch === true) {
                        document.ontouchmove = null;
                        document.ontouchend  = null;
                    } else {
                        document.onmousemove = null;
                        document.onmouseup   = null;
                    }
                },
                boxmove     = function dom__event_colSliderGrab_boxmove(f) {
                    f = f || window.event;
                    f.preventDefault();
                    if (touch === true) {
                        subOffset = offset - f.touches[0].clientX;
                    } else {
                        subOffset = offset - f.clientX;
                    }
                    if (subOffset > minAdjust && subOffset < maxAdjust) {
                        withinRange = true;
                    }
                    if (withinRange === true && subOffset > maxAdjust) {
                        diffRight.style.width = ((total - counter - 2) / 10) + "em";
                        status                = "e";
                    } else if (withinRange === true && subOffset < minAdjust) {
                        diffRight.style.width = (width / 10) + "em";
                        status                = "w";
                    } else if (subOffset < max && subOffset > min) {
                        diffRight.style.width = ((width + subOffset) / 10) + "em";
                        status                = "ew";
                    }
                    if (touch === true) {
                        document.ontouchend = drop;
                    } else {
                        document.onmouseup = drop;
                    }
                };
            event.preventDefault();
            if (typeof pd.data.node === "object" && pd.data.node.report.code.box !== null) {
                offset += pd.data.node.report.code.box.offsetLeft;
                offset -= pd.data.node.report.code.body.scrollLeft;
            } else {
                subOffset = (document.body.parentNode.scrollLeft > document.body.scrollLeft)
                    ? document.body.parentNode.scrollLeft
                    : document.body.scrollLeft;
                offset    -= subOffset;
            }
            offset             += node.clientWidth;
            node.style.cursor  = "ew-resize";
            diff.style.width   = (total / 10) + "em";
            diff.style.display = "inline-block";
            if (diffLeft.nodeType !== 1) {
                do {
                    diffLeft = diffLeft.previousSibling;
                } while (diffLeft.nodeType !== 1);
            }
            diffLeft.style.display   = "block";
            diffRight.style.width    = (diffRight.clientWidth / 10) + "em";
            diffRight.style.position = "absolute";
            if (touch === true) {
                document.ontouchmove  = boxmove;
                document.ontouchstart = false;
            } else {
                document.onmousemove = boxmove;
                document.onmousedown = null;
            }
        },
        //allows visual folding of consecutive equal lines in a diff report
        difffold     : function dom__event_difffold() {
            var a         = 0,
                b         = 0,
                self      = this,
                title     = self
                    .getAttribute("title")
                    .split("line "),
                min       = Number(title[1].substr(0, title[1].indexOf(" "))),
                max       = Number(title[2]),
                inner     = self.innerHTML,
                lists     = [],
                parent    = self.parentNode.parentNode,
                listnodes = (parent.getAttribute("class") === "diff")
                    ? parent.getElementsByTagName("ol")
                    : parent
                        .parentNode
                        .getElementsByTagName("ol"),
                listLen   = listnodes.length;
            for (a = 0; a < listLen; a += 1) {
                lists.push(listnodes[a].getElementsByTagName("li"));
            }
            if (lists.length > 3) {
                for (a = 0; a < min; a += 1) {
                    if (lists[0][a].getAttribute("class") === "empty") {
                        min += 1;
                        max += 1;
                    }
                }
            }
            max = (max >= lists[0].length)
                ? lists[0].length
                : max;
            if (inner.charAt(0) === "-") {
                self.innerHTML = "+" + inner.substr(1);
                for (a = min; a < max; a += 1) {
                    for (b = 0; b < listLen; b += 1) {
                        lists[b][a].style.display = "none";
                    }
                }
            } else {
                self.innerHTML = "-" + inner.substr(1);
                for (a = min; a < max; a += 1) {
                    for (b = 0; b < listLen; b += 1) {
                        lists[b][a].style.display = "block";
                    }
                }
            }
        },
        //submits the comment card
        feedsubmit   : function dom__event_feedsubmit(auto) {
            var datapack  = {},
                namecheck = (localStorage.settings !== undefined)
                    ? JSON.parse(localStorage.settings)
                    : {},
                radios    = [],
                text      = (pd.id("feedtextarea") === null)
                    ? ""
                    : pd
                        .id("feedtextarea")
                        .value,
                a         = 0,
                email     = (pd.id("feedemail") === null)
                    ? ""
                    : pd
                        .id("feedemail")
                        .value,
                xhr       = {},
                sendit    = function dom__event_feedsubmit_sendit() {
                    var node = pd.id("feedintro");
                    xhr.withCredentials = true;
                    xhr.open("POST", "http://prettydiff.com:8000/feedback/", true);
                    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
                    xhr.send(JSON.stringify(datapack));
                    pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("button")[1]
                        .click();
                    if (node !== null) {
                        node.innerHTML = "Please feel free to submit feedback about Pretty Diff at any time by answering t" +
                                "he following questions.";
                    }
                };
            if (pd.test.xhr === false || pd.test.json === false) {
                return;
            }
            xhr = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object")
                ? new XMLHttpRequest()
                : new ActiveXObject("Microsoft.XMLHTTP");
            if (auto === true) {
                datapack = {
                    name    : pd.data.settings.knownname,
                    settings: pd.data.settings,
                    stats   : pd.data.stat,
                    type    : "auto"
                };
                sendit();
                return;
            }
            if (pd.id("feedradio1") === null || namecheck.knownname !== pd.data.settings.knownname) {
                return;
            }
            radios = pd
                .id("feedradio1")
                .parentNode
                .parentNode
                .getElementsByTagName("input");
            for (a = radios.length - 1; a > -1; a -= 1) {
                if (radios[a].checked === true) {
                    break;
                }
            }
            if (a < 0) {
                return;
            }
            datapack = {
                comment : text,
                email   : email,
                name    : pd.data.settings.knownname,
                rating  : a + 1,
                settings: pd.data.settings,
                stats   : pd.data.stat,
                type    : "feedback"
            };
            sendit();
        },
        //nullifies the current "file" event
        filenull     : function dom__event_filenull(e) {
            var event = e || window.event;
            event.stopPropagation();
            event.preventDefault();
        },
        // this function allows typing of tab characters into textareas without the
        // textarea loosing focus
        fixtabs      : function dom__event_fixtabs(e, node) {
            var x     = node || this,
                start = "",
                end   = "",
                val   = "",
                sel   = 0,
                event = e || window.event;
            if (typeof event !== "object" || event === null || event.type !== "keydown" || event.keyCode !== 9 || typeof x.selectionStart !== "number" || typeof x.selectionEnd !== "number") {
                return true;
            }
            val              = x.value;
            sel              = x.selectionStart;
            start            = val.substring(0, sel);
            end              = val.substring(sel, val.length);
            x.value          = start + "\t" + end;
            x.selectionStart = sel + 1;
            x.selectionEnd   = sel + 1;
            event.preventDefault();
            return false;
        },
        //tests if a key press is a short command
        keydown      : function dom__event_keydown(e) {
            var event = e || window.event;
            if (pd.test.keypress === true && (pd.test.keystore.length === 0 || event.keyCode !== pd.test.keystore[pd.test.keystore.length - 1]) && event.keyCode !== 17 && event.keyCode !== 224) {
                pd
                    .test
                    .keystore
                    .push(event.keyCode);
            }
            if (event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) {
                pd.test.keypress = true;
            }
        },
        //alters available options depending upon language selection
        langOps      : function dom__event_langOps(node) {
            var x    = {},
                lang = "",
                xml  = false,
                dqp  = pd.id("diffquanp"),
                dqt  = pd.id("difftypep"),
                db   = pd.id("diffbeautify"),
                csvp = pd.id("csvcharp"),
                hd   = pd.id("htmld-yes"),
                he   = pd.id("htmld-no"),
                hm   = pd.id("htmlm-yes"),
                hn   = pd.id("htmlm-no"),
                hp   = pd.id("phtml-yes"),
                hq   = pd.id("phtml-no"),
                hy   = pd.id("html-yes"),
                hz   = pd.id("html-no");
            if (node.nodeType === 1) {
                if (node.nodeName.toLowerCase() === "input" || node.nodeName.toLowerCase() === "select") {
                    x = node;
                } else {
                    x = node.getElementsByTagName("input")[0];
                }
            } else if (this.nodeName.toLowerCase() === "input" || this.nodeName.toLowerCase() === "select") {
                x = this;
            } else {
                x = this.getElementsByTagName("input")[0];
            }
            xml  = (x.getElementsByTagName("option")[x.selectedIndex].innerHTML === "XML" || x.getElementsByTagName("option")[x.selectedIndex].innerHTML === "JSTL");
            lang = (pd.data.node.lang === null)
                ? "javascript"
                : (pd.data.node.lang.nodeName === "select")
                    ? pd.data.node.lang[pd.data.node.lang.selectedIndex].value
                    : pd.data.node.lang.value;
            if (pd.data.langvalue[0] === undefined) {
                pd.data.langvalue[0] = lang;
            }
            if (pd.data.node.modeDiff !== null && pd.data.node.modeDiff.checked === true) {
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (lang === "text" || lang === "csv") {
                    if (dqp !== null) {
                        dqp.style.display = "none";
                    }
                    if (dqt !== null) {
                        dqt.style.display = "none";
                    }
                } else {
                    if (dqp !== null) {
                        dqp.style.display = "block";
                    }
                    if (dqt !== null) {
                        dqt.style.display = "block";
                    }
                }
            } else if (pd.data.node.modeBeau !== null && pd.data.node.modeBeau.checked === true) {
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (pd.data.node.beauOps !== null) {
                    if (lang === "csv") {
                        pd.data.node.beauOps.style.display = "none";
                    } else {
                        pd.data.node.beauOps.style.display = "block";
                    }
                }
            } else if (pd.data.node.modeMinn !== null && pd.data.node.modeMinn.checked === true) {
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    if (lang === "csv") {
                        pd.data.node.minnOps.style.display = "none";
                    } else {
                        pd.data.node.minnOps.style.display = "block";
                    }
                }
            } else if (pd.data.node.modePars !== null && pd.data.node.modePars.checked === true) {
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    if (lang === "csv") {
                        pd.data.node.parsOps.style.display = "none";
                    } else {
                        pd.data.node.parsOps.style.display = "block";
                    }
                }
            }
            if (csvp !== null) {
                if (lang === "csv") {
                    csvp.style.display = "block";
                } else {
                    csvp.style.display = "none";
                }
            }
            if (db !== null) {
                if (lang === "csv" || lang === "text") {
                    db.style.display = "none";
                } else {
                    db.style.display = "block";
                }
            }
            if (lang === "html") {
                if (hd !== null) {
                    hd.checked = true;
                }
                if (hm !== null) {
                    hm.checked = true;
                }
                if (hy !== null) {
                    hy.checked = true;
                }
                if (hp !== null) {
                    hp.checked = true;
                }
            } else if (xml === true) {
                if (he !== null) {
                    he.checked = true;
                }
                if (hn !== null) {
                    hn.checked = true;
                }
                if (hz !== null) {
                    hz.checked = true;
                }
                if (hq !== null) {
                    hq.checked = true;
                }
            } else {
                if (pd.data.settings.presumehtmld === "htmld-no" && he !== null) {
                    he.checked = true;
                }
                if (pd.data.settings.presumehtmlm === "htmlm-no" && hn !== null) {
                    hn.checked = true;
                }
                if (pd.data.settings.presumehtml === "html-no" && hz !== null) {
                    hz.checked = true;
                }
                if (pd.data.settings.presumehtml === "phtml-no" && hq !== null) {
                    hq.checked = true;
                }
                if (pd.data.settings.presumehtmld === "htmld-yes" && hd !== null) {
                    hd.checked = true;
                }
                if (pd.data.settings.presumehtmlm === "htmlm-yes" && hm !== null) {
                    hm.checked = true;
                }
                if (pd.data.settings.presumehtml === "html-yes" && hy !== null) {
                    hy.checked = true;
                }
                if (pd.data.settings.presumehtml === "phtml-yes" && hp !== null) {
                    hp.checked = true;
                }
            }
            if (x === pd.data.node.lang) {
                if (pd.data.node.langdefault !== null) {
                    if (lang === "auto") {
                        pd.data.node.langdefault.parentNode.style.display = "block";
                        pd.data.node.langdefault.disabled                 = false;
                    } else {
                        pd.data.node.langdefault.parentNode.style.display = "none";
                    }
                }
                if (lang === "auto") {
                    pd
                        .app
                        .langkey(true, {}, "");
                } else {
                    pd
                        .app
                        .langkey(true, {}, lang);
                }
                if (pd.test.load === false && pd.data.mode !== "diff") {
                    pd
                        .app
                        .hideOutput(x);
                }
                pd
                    .app
                    .options(x);
            } else {
                pd
                    .app
                    .options(x);
            }
        },
        //maximize report window to available browser window
        maximize     : function dom__event_maximize(node) {
            var x       = (node.nodeType === 1)
                    ? node
                    : this,
                parent  = {},
                save    = false,
                box     = {},
                id      = "",
                heading = {},
                body    = {},
                top     = (document.body.parentNode.scrollTop > document.body.scrollTop)
                    ? document.body.parentNode.scrollTop
                    : document.body.scrollTop,
                left    = (document.body.parentNode.scrollLeft > document.body.scrollLeft)
                    ? document.body.parentNode.scrollLeft
                    : document.body.scrollLeft,
                buttons = [],
                resize  = {};
            pd
                .app
                .zTop(box);
            if (x.nodeType !== 1) {
                return;
            }
            buttons = x
                .parentNode
                .getElementsByTagName("button");
            resize  = buttons[buttons.length - 1];
            parent  = x.parentNode;
            save    = (parent.innerHTML.indexOf("save") > -1);
            box     = parent.parentNode;
            id      = box.getAttribute("id");
            heading = box.getElementsByTagName("h3")[0];
            body    = box.getElementsByTagName("div")[0];

            //maximize

            if (x.innerHTML === "\u2191") {
                x.innerHTML = "\u2193";
                x.setAttribute("title", "Return this dialogue to its prior size and location.");
                pd.data.settings[id].max = true;
                pd.data.settings[id].min = false;
                if (pd.test.ls === true && pd.test.json === true) {
                    localStorage.settings = JSON.stringify(pd.data.settings);
                }
                pd.data.settings[id].top    = box.offsetTop;
                pd.data.settings[id].left   = box.offsetLeft;
                pd.data.settings[id].height = body.clientHeight - 36;
                pd.data.settings[id].width  = body.clientWidth - 3;
                pd.data.settings[id].zindex = box.style.zIndex;
                box.style.top               = (top / 10) + "em";
                box.style.left              = (left / 10) + "em";
                if (typeof window.innerHeight === "number") {
                    body.style.height = ((window.innerHeight / 10) - 5.5) + "em";
                    if (save === true) {
                        heading.style.width = ((window.innerWidth / 10) - 13.76) + "em";
                    } else {
                        heading.style.width = ((window.innerWidth / 10) - 10.76) + "em";
                    }
                    body.style.width = ((window.innerWidth / 10) - 4.1) + "em";
                }
                resize.style.display = "none";

                //return to normal size

            } else {
                pd.data.settings[id].max = false;
                x.innerHTML              = "\u2191";
                x.setAttribute("title", "Maximize this dialogue to the browser window.");
                box.style.top  = (pd.data.settings[id].top / 10) + "em";
                box.style.left = (pd.data.settings[id].left / 10) + "em";
                if (save === true) {
                    heading.style.width = ((pd.data.settings[id].width / 10) - 9.76) + "em";
                } else {
                    heading.style.width = ((pd.data.settings[id].width / 10) - 6.76) + "em";
                }
                body.style.width     = (pd.data.settings[id].width / 10) + "em";
                body.style.height    = (pd.data.settings[id].height / 10) + "em";
                box.style.zIndex     = pd.data.settings[id].zindex;
                resize.style.display = "block";
                pd
                    .app
                    .options(box);
            }
        },
        //minimize report windows to the default size and location
        minimize     : function dom__event_minimize(e, steps, node) {
            var x         = node || this,
                parent    = {},
                box       = {},
                finale    = 0,
                id        = "",
                body      = {},
                heading   = {},
                buttons   = [],
                save      = false,
                buttonMin = {},
                buttonMax = {},
                left      = 0,
                top       = 0,
                buttonRes = {},
                step      = (typeof steps !== "number")
                    ? 50
                    : (steps < 1)
                        ? 1
                        : steps,
                growth    = function dom__event_minimize_growth() {
                    var boxLocal     = box,
                        bodyLocal    = body,
                        headingLocal = heading,
                        leftLocal    = left,
                        topLocal     = (top > 1)
                            ? top
                            : 1,
                        width        = 17,
                        height       = 3,
                        leftTarget   = 0,
                        topTarget    = 0,
                        widthTarget  = 0,
                        heightTarget = 0,
                        incW         = 0,
                        incH         = 0,
                        incL         = 0,
                        incT         = 0,
                        saveSpace    = (save === true)
                            ? 9.45
                            : 6.45,
                        grow         = function dom__event_minimize_growth_grow() {
                            width                    += incW;
                            height                   += incH;
                            leftLocal                += incL;
                            topLocal                 += incT;
                            bodyLocal.style.width    = width + "em";
                            bodyLocal.style.height   = height + "em";
                            headingLocal.style.width = (width - saveSpace) + "em";
                            boxLocal.style.left      = leftLocal + "em";
                            boxLocal.style.top       = topLocal + "em";
                            if (width + incW < widthTarget || height + incH < heightTarget) {
                                setTimeout(dom__event_minimize_growth_grow, 1);
                            } else {
                                boxLocal.style.left      = leftTarget + "em";
                                boxLocal.style.top       = topTarget + "em";
                                bodyLocal.style.width    = widthTarget + "em";
                                bodyLocal.style.height   = heightTarget + "em";
                                headingLocal.style.width = (widthTarget - saveSpace) + "em";
                                pd
                                    .app
                                    .options(boxLocal);
                                return false;
                            }
                        };
                    pd
                        .app
                        .zTop(box);
                    buttonMin.innerHTML   = "\u035f";
                    parent.style.display  = "block";
                    box.style.borderWidth = ".1em";
                    box.style.right       = "auto";
                    body.style.display    = "block";
                    heading.getElementsByTagName("button")[0].style.cursor = "move";
                    heading.style.borderLeftStyle                          = "none";
                    heading.style.borderTopStyle                           = "none";
                    heading.style.margin                                   = "-0.1em 1.7em -3.2em -0.1em";
                    if (pd.test.agent.indexOf("macintosh") > 0) {
                        saveSpace = (save === true)
                            ? 8
                            : 5;
                    }
                    if (typeof pd.data.settings[id].left === "number") {
                        leftTarget   = (pd.data.settings[id].left / 10);
                        topTarget    = (pd.data.settings[id].top / 10);
                        widthTarget  = (pd.data.settings[id].width / 10);
                        heightTarget = (pd.data.settings[id].height / 10);
                    } else {
                        topLocal                    += 4;
                        pd.data.settings[id].left   = 200;
                        pd.data.settings[id].top    = (topLocal * 10);
                        pd.data.settings[id].width  = 550;
                        pd.data.settings[id].height = 450;
                        leftTarget                  = 10;
                        topTarget                   = 2;
                        widthTarget                 = 55;
                        heightTarget                = 45;
                    }
                    widthTarget  = widthTarget - 0.3;
                    heightTarget = heightTarget - 3.55;
                    if (step === 1) {
                        boxLocal.style.left    = leftTarget + "em";
                        boxLocal.style.top     = ((window.innerHeight / 10) - 30) + "em";
                        bodyLocal.style.width  = widthTarget + "em";
                        bodyLocal.style.height = heightTarget + "em";
                        heading.style.width    = (widthTarget - saveSpace) + "em";
                        pd
                            .app
                            .options(boxLocal);
                        return false;
                    }
                    incW                    = (widthTarget > width)
                        ? ((widthTarget - width) / step)
                        : ((width - widthTarget) / step);
                    incH                    = (heightTarget > height)
                        ? ((heightTarget - height) / step)
                        : ((height - heightTarget) / step);
                    incL                    = (leftTarget - leftLocal) / step;
                    incT                    = (topTarget - topLocal) / step;
                    boxLocal.style.right    = "auto";
                    bodyLocal.style.display = "block";
                    grow();
                    return false;
                },
                shrinkage = function dom__event_minimize_shrinkage() {
                    var leftLocal    = left,
                        topLocal     = top,
                        boxLocal     = box,
                        bodyLocal    = body,
                        headingLocal = heading,
                        finalLocal   = finale,
                        topmin       = box.parentNode.offsetTop,
                        width        = bodyLocal.clientWidth / 10,
                        height       = bodyLocal.clientHeight / 10,
                        incL         = (((window.innerWidth / 10) - finalLocal - 17) - leftLocal) / step,
                        incT         = (((topmin / 10) - topLocal) / step),
                        incW         = (width === 17)
                            ? 0
                            : (width > 17)
                                ? ((width - 17) / step)
                                : ((17 - width) / step),
                        incH         = height / step,
                        shrink       = function dom__event_minimize_shrinkage_shrink() {
                            leftLocal                += incL;
                            topLocal                 += incT;
                            width                    -= incW;
                            height                   -= incH;
                            bodyLocal.style.width    = width + "em";
                            headingLocal.style.width = width + "em";
                            bodyLocal.style.height   = height + "em";
                            boxLocal.style.left      = leftLocal + "em";
                            boxLocal.style.top       = topLocal + "em";
                            if (width - incW > 16.8) {
                                setTimeout(dom__event_minimize_shrinkage_shrink, 1);
                            } else {
                                boxLocal.style.left      = "auto";
                                boxLocal.style.top       = "auto";
                                boxLocal.style.right     = finalLocal + "em";
                                pd.data.settings[id].max = false;
                                bodyLocal.style.display  = "none";
                                headingLocal.getElementsByTagName("button")[0].style.cursor = "pointer";
                                headingLocal.style.margin                                   = "-0.1em 0em -3.2em -0.1em";
                                box.style.zIndex                                            = "2";
                                pd
                                    .app
                                    .options(boxLocal);
                                return false;
                            }
                        };
                    buttonMin.innerHTML = "\u2191";
                    //if a maximized window is minimized
                    if (buttonMax.innerHTML === "\u2191") {
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            pd.data.settings[id].top    = box.offsetTop;
                            pd.data.settings[id].left   = box.offsetLeft;
                            pd.data.settings[id].height = body.clientHeight - 17;
                            pd.data.settings[id].width  = body.clientWidth - 17;
                        } else {
                            pd.data.settings[id].top    = box.offsetTop;
                            pd.data.settings[id].left   = box.offsetLeft;
                            pd.data.settings[id].height = body.clientHeight;
                            pd.data.settings[id].width  = body.clientWidth;
                        }
                        if (pd.data.zIndex > 2) {
                            pd.data.zIndex      -= 3;
                            parent.style.zIndex = pd.data.zIndex;
                        }
                    } else {
                        buttonMax.innerHTML         = "\u2191";
                        pd.data.settings[id].top    += 1;
                        pd.data.settings[id].left   -= 7;
                        pd.data.settings[id].height += 35.5;
                        pd.data.settings[id].width  += 3;
                    }
                    parent.style.display = "none";
                    shrink();
                    return false;
                };
            if (x.parentNode.nodeName.toLowerCase() === "h3") {
                heading = x.parentNode;
                box     = heading.parentNode;
                parent  = box.getElementsByTagName("p")[0];
            } else {
                parent  = (x.parentNode.nodeName.toLowerCase() === "a")
                    ? x.parentNode.parentNode
                    : x.parentNode;
                box     = parent.parentNode;
                heading = box.getElementsByTagName("h3")[0];
            }
            id                      = box.getAttribute("id");
            body                    = box.getElementsByTagName("div")[0];
            buttons                 = parent.getElementsByTagName("button");
            save                    = (parent.innerHTML.indexOf("save") > -1);
            buttonMin               = (save === true)
                ? buttons[1]
                : buttons[0];
            buttonMax               = (save === true)
                ? buttons[2]
                : buttons[1];
            left                    = (box.offsetLeft / 10);
            top                     = (box.offsetTop / 10);
            buttonRes               = (save === true)
                ? buttons[3]
                : buttons[2];
            buttonRes.style.display = "block";
            if (box === pd.data.node.report.feed.box) {
                if (pd.test.filled.feed === true) {
                    step = 1;
                }
                finale = 38.8;
            }
            if (box === pd.data.node.report.code.box) {
                if (pd.test.filled.code === true) {
                    step = 1;
                }
                finale = 19.8;
            }
            if (box === pd.data.node.report.stat.box) {
                if (pd.test.filled.stat === true) {
                    step = 1;
                }
                finale = 0.8;
            }
            e = e || window.event;
            if (typeof e.preventDefault === "function") {
                e.preventDefault();
            }
            if (buttonMin.innerHTML === "\u035f") {
                shrinkage();
            } else {
                growth();
            }
            return false;
        },
        //toggles between modes
        modeToggle   : function dom__event_modeToggle(x) {
            var a           = {},
                b           = 0,
                lang        = (pd.data.node.lang === null)
                    ? "javascript"
                    : ((pd.data.node.lang.nodeName === "select")
                        ? pd.data.node.lang[pd.data.node.lang.selectedIndex].value
                        : pd.data.node.lang.value),
                langOps     = [],
                node        = {},
                storage     = "",
                db          = pd.id("diffbeautify"),
                csvp        = pd.id("csvcharp"),
                langtest    = (pd.data.node.lang !== null && pd.data.node.lang.nodeName.toLowerCase() === "select"),
                optioncheck = function dom__event_modeToggle_optioncheck() {
                    var c     = 0,
                        langs = [];
                    langs = pd
                        .data
                        .node
                        .lang
                        .getElementsByTagName("option");
                    for (c = langs.length - 1; c > -1; c -= 1) {
                        if (langs[c].value === "text") {
                            if (pd.data.node.lang.selectedIndex === c) {
                                pd.data.node.lang.selectedIndex = 0;
                                pd
                                    .app
                                    .langkey(true, null, "auto");
                            }
                            langs[c].disabled = true;
                        }
                    }
                };
            if (x === null) {
                return;
            }
            if (x.nodeType === 1) {
                if (x.nodeName.toLowerCase() === "input") {
                    a = x;
                } else {
                    a = x.getElementsByTagName("input")[0];
                }
            } else if (this.nodeName.toLowerCase() === "input") {
                a = this;
            } else {
                a = this.getElementsByTagName("input")[0];
            }
            node = pd.id("showOptionsCallOut");
            if (node !== null) {
                node
                    .parentNode
                    .removeChild(node);
            }
            if (a === pd.data.node.modeBeau) {
                pd.data.mode = "beau";
                if (langtest === true) {
                    optioncheck();
                }
                if (pd.data.node.codeBeauIn !== null) {
                    if (pd.data.node.codeBeauIn.value === "" && pd.data.node.codeMinnIn !== null && pd.data.node.codeMinnIn.value !== "") {
                        pd.data.node.codeBeauIn.value = pd.data.node.codeMinnIn.value;
                    } else if (pd.data.node.codeBeauIn.value === "" && pd.data.node.codeBeauOut !== null && pd.data.node.codeBeauOut.value !== "") {
                        pd.data.node.codeBeauIn.value = pd.data.node.codeBeauOut.value;
                    }
                }
                if (pd.data.node.beau !== null) {
                    pd.data.node.beau.style.display = "block";
                }
                if (pd.data.node.minn !== null) {
                    pd.data.node.minn.style.display = "none";
                }
                if (pd.data.node.pars !== null) {
                    pd.data.node.pars.style.display = "none";
                }
                if (pd.data.node.diffBase !== null) {
                    pd.data.node.diffBase.style.display = "none";
                }
                if (pd.data.node.diffNew !== null) {
                    pd.data.node.diffNew.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (lang === "csv" && pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                } else if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "block";
                }
                if (pd.test.render.beau === false) {
                    if (pd.data.node.codeBeauIn !== null) {
                        if (pd.test.ls === true && localStorage.codeBeautify !== undefined) {
                            storage = localStorage.codeBeautify;
                            if ((/^(\s+)$/).test(storage) === true) {
                                storage = "";
                            }
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .beauIn
                                    .setValue(storage);
                                pd
                                    .ace
                                    .beauIn
                                    .clearSelection();
                                pd
                                    .app
                                    .langkey(false, pd.ace.beauIn, "");
                            } else {
                                pd.data.node.codeBeauIn.value = storage;
                            }
                        } else if (pd.test.ace === true) {
                            pd
                                .ace
                                .beauIn
                                .setValue(" ");
                        }
                    }
                    if (pd.test.ace === true && pd.data.node.codeBeauOut !== null) {
                        pd
                            .ace
                            .beauOut
                            .setValue(" ");
                    }
                }
                if (pd.test.load === false && pd.data.node.jsscope !== null && pd.data.node.jsscope.checked === true) {
                    pd
                        .app
                        .hideOutput(pd.data.node.jsscope);
                }
                pd.test.render.beau = true;
            }
            if (a === pd.data.node.modeMinn) {
                pd.data.mode = "minn";
                if (langtest === true) {
                    optioncheck();
                }
                if (pd.data.node.codeMinnIn !== null) {
                    if (pd.data.node.codeMinnIn.value === "" && pd.data.node.codeBeauIn !== null && pd.data.node.codeBeauIn.value !== "") {
                        pd.data.node.codeMinnIn.value = pd.data.node.codeBeauIn.value;
                    } else if (pd.data.node.codeMinnIn.value === "" && pd.data.node.codeBeauOut !== null && pd.data.node.codeBeauOut.value !== "") {
                        pd.data.node.codeMinnIn.value = pd.data.node.codeBeauOut.value;
                    }
                }
                if (pd.data.node.minnOps !== null) {
                    if (lang === "text" || lang === "csv") {
                        pd.data.node.minnOps.style.display = "none";
                    } else {
                        pd.data.node.minnOps.style.display = "block";
                    }
                }
                if (pd.data.node.minn !== null) {
                    pd.data.node.minn.style.display = "block";
                }
                if (pd.data.node.beau !== null) {
                    pd.data.node.beau.style.display = "none";
                }
                if (pd.data.node.pars !== null) {
                    pd.data.node.pars.style.display = "none";
                }
                if (pd.data.node.diffBase !== null) {
                    pd.data.node.diffBase.style.display = "none";
                }
                if (pd.data.node.diffNew !== null) {
                    pd.data.node.diffNew.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (pd.test.render.minn === false) {
                    if (pd.data.node.codeMinnIn !== null) {
                        if (pd.test.ls === true && localStorage.codeMinify !== undefined) {
                            storage = localStorage.codeMinify;
                            if ((/^(\s+)$/).test(storage) === true) {
                                storage = "";
                            }
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .minnIn
                                    .setValue(storage);
                                pd
                                    .ace
                                    .minnIn
                                    .clearSelection();
                                pd
                                    .app
                                    .langkey(false, pd.ace.minnIn, "");
                            } else {
                                pd.data.node.codeMinnIn.value = storage;
                            }
                        } else if (pd.test.ace === true) {
                            pd
                                .ace
                                .minnIn
                                .setValue(" ");
                        }
                    }
                    if (pd.test.ace === true && pd.data.node.codeMinnOut !== null) {
                        pd
                            .ace
                            .minnOut
                            .setValue(" ");
                    }
                }
                pd.test.render.minn = true;
            }
            if (a === pd.data.node.modeDiff) {
                pd.data.mode = "diff";
                if (langtest === true) {
                    langOps = pd
                        .data
                        .node
                        .lang
                        .getElementsByTagName("option");
                    for (b = langOps.length - 1; b > -1; b -= 1) {
                        langOps[b].disabled = false;
                    }
                }
                if (pd.data.node.codeBeauOut !== null) {
                    if (pd.data.node.codeBeauOut.value === "" && pd.data.node.codeBeauIn !== null && pd.data.node.codeBeauIn.value !== "") {
                        pd.data.node.codeBeauOut.value = pd.data.node.codeBeauIn.value;
                    } else if (pd.data.node.codeBeauOut.value === "" && pd.data.node.codeMinnIn !== null && pd.data.node.codeMinnIn.value !== "") {
                        pd.data.node.codeBeauOut.value = pd.data.node.codeMinnIn.value;
                    }
                }
                if (pd.data.node.diffBase !== null) {
                    pd.data.node.diffBase.style.display = "block";
                }
                if (pd.data.node.diffNew !== null) {
                    pd.data.node.diffNew.style.display = "block";
                }
                if (pd.data.node.beau !== null) {
                    pd.data.node.beau.style.display = "none";
                }
                if (pd.data.node.minn !== null) {
                    pd.data.node.minn.style.display = "none";
                }
                if (pd.data.node.pars !== null) {
                    pd.data.node.pars.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "block";
                }
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.data.node.parsOps !== null) {
                    pd.data.node.parsOps.style.display = "none";
                }
                if (lang === "csv" || lang === "text") {
                    node = pd.id("diffquanp");
                    if (node !== null) {
                        node.style.display = "none";
                    }
                    node = pd.id("difftypep");
                    if (node !== null) {
                        node.style.display = "none";
                    }
                    node = pd.id("diffbeautify");
                    if (node !== null) {
                        node.style.display = "none";
                    }
                } else {
                    node = pd.id("diffquanp");
                    if (node !== null) {
                        node.style.display = "block";
                    }
                    node = pd.id("difftypep");
                    if (node !== null) {
                        node.style.display = "block";
                    }
                    node = pd.id("diffbeautify");
                    if (node !== null) {
                        node.style.display = "block";
                    }
                }
                if (pd.test.render.diff === false) {
                    if (pd.data.node.codeDiffBase !== null) {
                        if (pd.test.ls === true && localStorage.codeDiffBase !== undefined) {
                            storage = localStorage.codeDiffBase;
                            if ((/^(\s+)$/).test(storage) === true) {
                                storage = "";
                            }
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .diffBase
                                    .setValue(storage);
                                pd
                                    .ace
                                    .diffBase
                                    .clearSelection();
                                if (lang !== "text") {
                                    pd
                                        .app
                                        .langkey(false, pd.ace.diffBase, "");
                                }
                            } else {
                                pd.data.node.codeDiffBase.value = storage;
                            }
                        } else if (pd.test.ace === true) {
                            pd
                                .ace
                                .diffBase
                                .setValue(" ");
                        }
                    }
                    if (pd.data.node.codeDiffNew !== null) {
                        if (pd.test.ls === true && localStorage.codeDiffNew !== undefined) {
                            storage = localStorage.codeDiffNew;
                            if ((/^(\s+)$/).test(storage) === true) {
                                storage = "";
                            }
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .diffNew
                                    .setValue(storage);
                                pd
                                    .ace
                                    .diffNew
                                    .clearSelection();
                                if (lang !== "text") {
                                    pd
                                        .app
                                        .langkey(false, pd.ace.diffNew, "");
                                }
                            } else {
                                pd.data.node.codeDiffNew.value = storage;
                            }
                        } else if (pd.test.ace === true) {
                            pd
                                .ace
                                .diffNew
                                .setValue(" ");
                        }
                    }
                    pd.test.render.diff = true;
                }
            }
            if (a === pd.data.node.modePars) {
                pd.data.mode = "pars";
                if (langtest === true) {
                    optioncheck();
                }
                if (pd.data.node.codeParsIn !== null) {
                    if (pd.data.node.codeParsIn.value === "" && pd.data.node.codeBeauIn !== null && pd.data.node.codeBeauIn.value !== "") {
                        pd.data.node.codeParsIn.value = pd.data.node.codeBeauIn.value;
                    } else if (pd.data.node.codeParsIn.value === "" && pd.data.node.codeBeauOut !== null && pd.data.node.codeBeauOut.value !== "") {
                        pd.data.node.codeParsIn.value = pd.data.node.codeBeauOut.value;
                    }
                }
                if (pd.data.node.parsOps !== null) {
                    if (lang === "text" || lang === "csv") {
                        pd.data.node.parsOps.style.display = "none";
                    } else {
                        pd.data.node.parsOps.style.display = "block";
                    }
                }
                if (pd.data.node.minn !== null) {
                    pd.data.node.minn.style.display = "none";
                }
                if (pd.data.node.beau !== null) {
                    pd.data.node.beau.style.display = "none";
                }
                if (pd.data.node.pars !== null) {
                    pd.data.node.pars.style.display = "block";
                }
                if (pd.data.node.diffBase !== null) {
                    pd.data.node.diffBase.style.display = "none";
                }
                if (pd.data.node.diffNew !== null) {
                    pd.data.node.diffNew.style.display = "none";
                }
                if (pd.data.node.diffOps !== null) {
                    pd.data.node.diffOps.style.display = "none";
                }
                if (pd.data.node.beauOps !== null) {
                    pd.data.node.beauOps.style.display = "none";
                }
                if (pd.data.node.minnOps !== null) {
                    pd.data.node.minnOps.style.display = "none";
                }
                if (pd.test.render.pars === false) {
                    if (pd.data.node.codeParsIn !== null) {
                        if (pd.test.ls === true && localStorage.codeParse !== undefined) {
                            storage = localStorage.codeParse;
                            if ((/^(\s+)$/).test(storage) === true) {
                                storage = "";
                            }
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .parsIn
                                    .setValue(storage);
                                pd
                                    .ace
                                    .parsIn
                                    .clearSelection();
                                pd
                                    .app
                                    .langkey(false, pd.ace.parsIn, "");
                            } else {
                                pd.data.node.codeParsIn.value = storage;
                            }
                        } else if (pd.test.ace === true) {
                            pd
                                .ace
                                .parsIn
                                .setValue(" ");
                        }
                    }
                    if (pd.test.ace === true && pd.data.node.codeParsOut !== null) {
                        pd
                            .ace
                            .parsOut
                            .setValue(" ");
                    }
                }
                pd.test.render.pars = true;
            }
            if (pd.data.node.announce !== null && (a === pd.data.node.modeBeau || a === pd.data.node.modeMinn || a === pd.data.node.modeDiff)) {
                pd.data.node.announce.innerHTML = "";
            }
            if (a.nodeType === undefined) {
                return;
            }
            if (pd.test.load === true && (lang === "csv" || lang === "text")) {
                if (csvp !== null && lang === "csv") {
                    csvp.style.display = "block";
                    if (csvp.previousSibling !== null) {
                        csvp = csvp.previousSibling;
                        if (csvp.nodeType > 1 && csvp.previousSibling !== null) {
                            csvp = csvp.previousSibling;
                        }
                        if (csvp.nodeType === 1) {
                            csvp.style.display = "none";
                        }
                    }
                }
                if (db !== null) {
                    db.style.display = "none";
                }
            }
            if (pd.test.load === false) {
                if (a !== pd.data.node.modeDiff) {
                    pd
                        .app
                        .hideOutput(a);
                } else {
                    pd
                        .app
                        .options(a);
                }
            }
        },
        //reset tool to default configuration
        reset        : function dom__event_reset() {
            var nametry = "",
                name    = "";
            localStorage.codeBeautify  = "";
            localStorage.codeDiffBase  = "";
            localStorage.codeDiffNew   = "";
            localStorage.codeMinify    = "";
            localStorage.codeParse     = "";
            localStorage.commentString = "[]";
            if (pd.data.settings === undefined || pd.data.settings.knownname === undefined) {
                if (pd.data.settings === undefined) {
                    pd.data.settings = {
                        feedback: {
                            newb   : false,
                            veteran: false
                        }
                    };
                }
                if (localStorage.settings !== undefined) {
                    nametry = JSON.stringify(localStorage.settings);
                }
                if (localStorage.settings === undefined || nametry.knownname === undefined || nametry === "" || nametry.indexOf("knownname") < 0) {
                    name = "\"" + Math
                        .random()
                        .toString()
                        .slice(2) + Math
                        .random()
                        .toString()
                        .slice(2) + "\"";
                }
                pd.data.settings.knownname = name;
            }
            if (pd.data.settings.feedback === undefined) {
                pd.data.settings.feedback = {
                    newb   : false,
                    veteran: false
                };
            }
            localStorage.settings = "{\"feedback\":{\"newb\":" + pd.data.settings.feedback.newb + ",\"veteran\":" + pd.data.settings.feedback.veteran + "},\"codereport\":{},\"statreport\":{},\"knownname\":" + pd.data.settings.knownname + "}";
            pd.data.commentString = [];
            if (pd.data.node.comment !== null) {
                pd.data.node.comment.innerHTML = "/*prettydiff.com */";
            }
            pd.data.node.modeDiff.checked = true;
            location.reload();
        },
        //resize report window to custom width and height on drag
        resize       : function dom__event_resize(e, x) {
            var parent     = x.parentNode,
                save       = (parent.innerHTML.indexOf("save") > -1),
                box        = parent.parentNode,
                body       = box.getElementsByTagName("div")[0],
                heading    = box.getElementsByTagName("h3")[0],
                bodyWidth  = body.clientWidth,
                bodyHeight = body.clientHeight,
                mac        = (pd.test.agent.indexOf("macintosh") > 0),
                offsetw    = (mac === true)
                    ? 20
                    : 4,
                offseth    = (mac === true)
                    ? 54
                    : 36,
                drop       = function dom__event_resize_drop() {
                    document.onmousemove = null;
                    bodyWidth            = body.clientWidth;
                    bodyHeight           = body.clientHeight;
                    pd
                        .app
                        .options(box);
                    document.onmouseup = null;
                },
                boxsize    = function dom__event_resize_boxsize(f) {
                    f                = f || window.event;
                    body.style.width = ((bodyWidth + ((f.clientX - offsetw) - body.mouseX)) / 10) + "em";
                    if (save === true) {
                        heading.style.width = (((bodyWidth + (f.clientX - body.mouseX)) / 10) - 10.15) + "em";
                    } else {
                        heading.style.width = (((bodyWidth + (f.clientX - body.mouseX)) / 10) - 7.15) + "em";
                    }
                    body.style.height  = ((bodyHeight + ((f.clientY - offseth) - body.mouseY)) / 10) + "em";
                    document.onmouseup = drop;
                };
            pd
                .app
                .zTop(box);
            e                    = e || window.event;
            body.mouseX          = e.clientX;
            body.mouseY          = e.clientY;
            document.onmousemove = boxsize;
            document.onmousedown = null;
        },
        //toggle between parsed html diff report and raw text representation
        save         : function dom__event_save(x) {
            var anchor     = (x.nodeName.toLowerCase() === "a"),
                top        = (x.parentNode.parentNode.nodeName.toLowerCase() === "p")
                    ? x.parentNode.parentNode.parentNode
                    : x.parentNode.parentNode,
                button     = (anchor === true)
                    ? x.getElementsByTagName("button")[0]
                    : x,
                body       = top.getElementsByTagName("div")[0],
                bodyInner  = body
                    .innerHTML
                    .replace(/\ xmlns\=("|')http:\/\/www\.w3\.org\/1999\/xhtml("|')/g, ""),
                lastChild  = {},
                content    = [],
                pageHeight = 0,
                ro         = pd.id("savepref-report"),
                reportonly = (ro !== null && ro.checked === true),
                span       = pd.id("inline");
            if (bodyInner.innerHTML === "") {
                return;
            }

            if (reportonly === true && anchor === true) {
                x.removeAttribute("href");
            }

            // added support for Firefox and Opera because they support long URIs.  This
            // extra support allows for local file creation.
            if (anchor === true && button.innerHTML === "S" && reportonly === false) {
                if (bodyInner === "" || ((/Please\ try\ using\ the\ option\ labeled\ ((&lt;)|<)em((&gt;)|>)Plain\ Text\ \(diff\ only\)((&lt;)|<)\/em((&gt;)|>)\./).test(bodyInner) === true && (/div\ class\=("|')diff("|')/).test(bodyInner) === false)) {
                    return false;
                }
                if (reportonly === true) {
                    x.setAttribute("href", "data:text/prettydiff;charset=utf-8," + encodeURIComponent(bodyInner));
                } else {
                    x.setAttribute("href", "data:text/prettydiff;charset=utf-8," + encodeURIComponent(pd.data.html.join("")));
                }
                x.onclick = function dom__event_save_rebind() {
                    pd
                        .event
                        .save(this);
                };

                // prompt to save file created above.  below is the creation of the modal with
                // instructions about file extension.
                lastChild = pd.data.node.page.lastChild;
                if (lastChild.nodeType > 1 || lastChild.nodeName.toLowerCase() === "script") {
                    do {
                        lastChild = lastChild.previousSibling;
                    } while (lastChild.nodeType > 1 || lastChild.nodeName.toLowerCase() === "script");
                }
                pageHeight = lastChild.offsetTop + lastChild.clientHeight + 20;
                lastChild  = document.createElement("div");
                lastChild.setAttribute("onmousedown", "this.parentNode.removeChild(this)");
                lastChild.setAttribute("id", "modalSave");
                span              = document.createElement("span");
                span.style.width  = (pd.data.node.page.clientWidth + 10) + "px";
                span.style.height = pageHeight + "px";
                lastChild.appendChild(span);
                span           = document.createElement("p");
                span.innerHTML = "Just rename the file extension from '<strong>.part</strong>' to '<strong>.xhtml<" +
                                     "/strong>'. <em>Click anywhere to close this reminder.</em>";
                lastChild.appendChild(span);
                pd
                    .data
                    .node
                    .page
                    .appendChild(lastChild);
                span.style.left = (((pd.data.node.page.clientWidth + 10) - span.clientWidth) / 2) + "px";
                return false;
            }
            // Webkit and IE get the old functionality of a textarea with HTML text content
            // to copy and paste into a text file.
            pd
                .app
                .zTop(top);
            pd.data.html[7] = pd.data.color;
            if (button.innerHTML === "S") {
                if (pd.data.mode === "diff") {
                    pd.data.node.save.checked = true;
                }
                button.innerHTML = "H";
                button.setAttribute("title", "Convert output to rendered HTML.");
                body.innerHTML = "<textarea rows='40' cols='80'>" + pd
                    .data
                    .html
                    .join("")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;") + "</textarea>";
                return false;
            }
            if (pd.data.mode === "diff") {
                pd.data.node.save.checked = false;
            }
            button.innerHTML = "S";
            button.setAttribute("title", "Convert report to text that can be saved.");
            body.innerHTML = pd.data.html[10];
            content        = body.getElementsByTagName("ol");
            if (content.length > 0) {
                if (pd.data.mode === "diff") {
                    pd.data.colSliderProperties = [
                        content[0].clientWidth, content[1].clientWidth, content[2].parentNode.clientWidth, content[2].parentNode.parentNode.clientWidth, content[2].parentNode.offsetLeft - content[2].parentNode.parentNode.offsetLeft
                    ];
                    content[2].onmousedown      = pd.event.colSliderGrab;
                    content[2].ontouchstart     = pd.event.colSliderGrab;
                }
                content = content[0].getElementsByTagName("li");
                for (pageHeight = content.length - 1; pageHeight > -1; pageHeight -= 1) {
                    if (content[pageHeight].getAttribute("class") === "fold") {
                        if (pd.data.mode === "beau") {
                            content[pageHeight].onclick = pd.event.beaufold;
                        } else if (pd.data.mode === "diff") {
                            content[pageHeight].onclick = pd.event.difffold;
                        }
                    }
                }
            }
            pd
                .app
                .options(x.parentNode);
            return false;
        },
        //analyzes combinations of consecutive key presses
        sequence     : function dom__event_sequence(e) {
            var seq   = pd.test.keysequence,
                len   = seq.length,
                event = e || window.event,
                key   = event.keyCode;
            if (len === 0 || len === 1) {
                if (key === 38) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 2 || len === 3) {
                if (key === 40) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 4 || len === 6) {
                if (key === 37) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 5 || len === 7) {
                if (key === 39) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 8) {
                if (key === 66) {
                    pd
                        .test
                        .keysequence
                        .push(true);
                } else {
                    pd.test.keysequence = [];
                }
            } else if (len === 9) {
                if (key === 65) {
                    if (pd.data.audio !== undefined) {
                        pd
                            .data
                            .audio
                            .play();
                    }
                    // (function dom__event_sequence_blinky() {    var color = pd.id("colorScheme"),
                    //        ind = color.selectedIndex,        y = 0,        z = ind,
                    // change = function dom__event_sequence_blinky_change() {            z -= 1;  y
                    // += 1;            if (z < 0) {                z =
                    // color.getElementsByTagName("option").length - 1;            }
                    // color.selectedIndex = z;            pd.event.colorScheme(color); if (y < 20)
                    // {                setTimeout(change, 50);            } else {
                    // color.selectedIndex = ind; pd.event.colorScheme(color);            }
                    // };    setTimeout(change, 50); }());

                    (function dom__event_sequence_colorChange() {
                        var active = document.activeElement,
                            color  = pd.id("colorScheme"),
                            ind    = color.selectedIndex,
                            max    = color
                                .getElementsByTagName("option")
                                .length - 1,
                            change = function dom__event_sequence_colorChange_change() {
                                color.selectedIndex = ind;
                                pd
                                    .event
                                    .colorScheme(color);
                                if (active === document.documentElement || active === null || active === document.getElementsByTagName("body")[0]) {
                                    color.blur();
                                } else {
                                    active.focus();
                                }
                            };
                        ind -= 1;
                        if (ind < 0) {
                            ind = max;
                        }
                        change();
                        ind += 1;
                        if (ind > max) {
                            ind = 0;
                        }
                        setTimeout(change, 1500);
                    }());
                }
                pd.test.keysequence = [];
            }
        }
    };

    // recycle bundles arguments in preparation for executing prettydiff references
    // events: beaufold, colSliderGrab, difffold, minimize, save
    pd.event.recycle    = function dom__event_recycle(e) {
        var api         = {},
            output      = [],
            domain      = (/^((https?:\/\/)|(file:\/\/\/))/),
            event       = e || window.event,
            lang        = "",
            errortext   = "",
            node        = pd.id("jsscope-html"),
            requests    = false,
            requestd    = false,
            completes   = false,
            completed   = false,
            autotest    = false,
            crlf        = pd.id("lterminator-crlf"),
            textout     = ((pd.data.node.jsscope === null || pd.data.node.jsscope.checked === false) && (node === null || node.checked === false)),
            app         = function dom__event_recycle_appInit() {
                return;
            },
            application = function dom__event_recycle_application(lang) {
                if (typeof prettydiff === "function") {
                    return prettydiff;
                }
                if (pd.data.mode === "diff" && typeof global.diffview === "function") {
                    api.lang = "text";
                    return global.diffview;
                }
                if (typeof global.markuppretty === "function" && (lang === "markup" || lang === "html")) {
                    return function dom__event_recycle_application_markuppretty() {
                        var code = global.markupprettyy(api),
                            sum  = (global.report === undefined)
                                ? ""
                                : global.report;
                        return [code, sum];
                    };
                }
                if (typeof global.csvpretty === "function" && lang === "csv") {
                    return global.csvpretty;
                }
                if (typeof global.csspretty === "function" && lang === "css") {
                    return function dom__event_recycle_application_csspretty() {
                        var code = global.csspretty(api),
                            sum  = (global.report === undefined)
                                ? ""
                                : global.report;
                        return [code, sum];
                    };
                }
                if (typeof global.jspretty === "function") {
                    return function dom__event_recycle_application_jspretty() {
                        var code = global.jspretty(api),
                            sum  = (global.report === undefined)
                                ? ""
                                : global.report;
                        return [code, sum];
                    };
                }
            },
            execOutput  = function dom__event_recycle_execOutput() {
                var diffList   = [],
                    button     = {},
                    buttons    = {},
                    pdlang     = "",
                    chromeSave = false;
                node           = pd.id("showOptionsCallOut");
                pd.data.zIndex += 1;
                if (autotest === true) {
                    if (pd.data.langvalue[1] === "javascript") {
                        if (output[1] !== undefined && output[1].indexOf("React JSX") > 0 && ((api.jsscope === "report" && (/Code\ type\ is\ presumed\ to\ be\ React\ JSX/).test(output[1]) === false && (/Presumed\ language\ is\ &lt;em&gt;React\ JSX/).test(output[1]) === false) || api.jsscope !== "report")) {
                            if (pd.test.ace === true) {
                                if (pd.data.mode === "beau") {
                                    pd
                                        .app
                                        .langkey(false, pd.ace.beauIn, "jsx");
                                    pd
                                        .app
                                        .langkey(false, pd.ace.beauOut, "jsx");
                                } else if (pd.data.mode === "minn") {
                                    pd
                                        .app
                                        .langkey(false, pd.ace.minnIn, "jsx");
                                    pd
                                        .app
                                        .langkey(false, pd.ace.minnOut, "jsx");
                                } else if (pd.data.mode === "pars") {
                                    pd
                                        .app
                                        .langkey(false, pd.ace.parsIn, "jsx");
                                    pd
                                        .app
                                        .langkey(false, pd.ace.parsOut, "jsx");
                                } else if (pd.data.mode === "minn") {
                                    pd
                                        .app
                                        .langkey(false, pd.ace.diffBase, "jsx");
                                    pd
                                        .app
                                        .langkey(false, pd.ace.diffNew, "jsx");
                                }
                            } else {
                                pd.data.langvalue = ["jsx", "javascript", "React JSX"];
                            }
                        }
                    }
                    api.lang = "auto";
                }
                button           = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("p")[0]
                    .getElementsByTagName("button")[0];
                pd.data.html[10] = output[0];
                if (button.getAttribute("class") === "save" && button.innerHTML === "H") {
                    chromeSave       = true;
                    button.innerHTML = "S";
                }
                if (api.mode === "parse" || (api.lang === "csv" && pd.data.mode !== "diff")) {
                    pdlang = JSON.stringify(output[0]);
                    if (pdlang.length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if (pd.data.node.codeParsOut !== null && api.lang !== "csv") {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .parsOut
                                .setValue(pdlang);
                            pd
                                .ace
                                .parsOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeParsOut.value = pdlang;
                        }
                    }
                    if (pd.data.node.report.code.box !== null) {
                        if (api.lang === "csv") {
                            (function dom__event_recycle_execOutput_csvTable() {
                                var a       = 0,
                                    b       = output[0].length,
                                    c       = 0,
                                    d       = 0,
                                    cells   = 0,
                                    heading = false,
                                    tr      = {},
                                    table   = {},
                                    td      = {},
                                    body    = {},
                                    div     = {};
                                for (a = 0; a < b; a += 1) {
                                    if (output[0][a].length > cells) {
                                        cells = output[0][a].length;
                                    }
                                }
                                if (b > 5) {
                                    c = output[0][0].length;
                                    for (a = 0; a < c; a += 1) {
                                        if (isNaN(output[0][0][a]) === false || (output[0][0][a].length < 4 && output[0][0][a].length < output[0][1][a].length && output[0][0][a].length < output[0][2][a].length)) {
                                            break;
                                        }
                                    }
                                    if (a === c) {
                                        for (a = 0; a < c; a += 1) {
                                            if (output[0][1][a] !== undefined && (isNaN(output[0][1][a].charAt(0)) === false || output[0][1][a].length < 4)) {
                                                break;
                                            }
                                        }
                                        if (a < c) {
                                            for (d = 0; d < c; d += 1) {
                                                if (output[0][2][d] !== undefined && (isNaN(output[0][2][d].charAt(0)) === false || output[0][2][d].length < 4)) {
                                                    if (d === a) {
                                                        heading = true;
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                div   = document.createElement("div");
                                table = document.createElement("table");
                                div.setAttribute("class", "doc");
                                table.setAttribute("class", "analysis");
                                table.setAttribute("summary", "CSV data");
                                a = 0;
                                if (heading === true) {
                                    a            = 1;
                                    body         = document.createElement("thead");
                                    tr           = document.createElement("tr");
                                    td           = document.createElement("th");
                                    td.innerHTML = "Index";
                                    tr.appendChild(td);
                                    for (c = 0; c < cells; c += 1) {
                                        td = document.createElement("th");
                                        if (output[0][0][c] !== undefined) {
                                            td.innerHTML = output[0][0][c];
                                        }
                                        tr.appendChild(td);
                                    }
                                    body.appendChild(tr);
                                    table.appendChild(body);
                                }
                                body = document.createElement("tbody");
                                for (a = a; a < b; a += 1) {
                                    tr = document.createElement("tr");
                                    td = document.createElement("td");
                                    if (a === 0) {
                                        td.innerHTML = "Index";
                                    } else {
                                        td.innerHTML = a;
                                    }
                                    tr.appendChild(td);
                                    for (c = 0; c < cells; c += 1) {
                                        td = document.createElement("td");
                                        if (output[0][a][c] !== undefined) {
                                            td.innerHTML = output[0][a][c];
                                        }
                                        tr.appendChild(td);
                                    }
                                    body.appendChild(tr);
                                }
                                table.appendChild(body);
                                div.appendChild(table);
                                pd.data.node.report.code.body.innerHTML = output[1];
                                pd
                                    .data
                                    .node
                                    .report
                                    .code
                                    .body
                                    .appendChild(div);
                                if (pd.test.ls === true) {
                                    if (pd.data.mode === "beau") {
                                        pd.data.stat.beau += 1;
                                        node              = pd.id("stbeau");
                                        if (node !== null) {
                                            node.innerHTML = pd.data.stat.beau;
                                        }
                                    } else if (pd.data.mode === "minn") {
                                        pd.data.stat.minn += 1;
                                        node              = pd.id("stminn");
                                        if (node !== null) {
                                            node.innerHTML = pd.data.stat.minn;
                                        }
                                    } else if (pd.data.mode === "pars") {
                                        pd.data.stat.pars += 1;
                                        node              = pd.id("stpars");
                                        if (node !== null) {
                                            node.innerHTML = pd.data.stat.pars;
                                        }
                                    }
                                }
                            }());
                        } else {
                            (function dom__event_recycle_execOutput_parseTable() {
                                var table = [],
                                    token = output[0].token,
                                    types = output[0].types,
                                    a     = 0,
                                    len   = 0,
                                    build = "";
                                if (token === undefined) {
                                    pd.data.node.report.code.body.innerHTML = output[1];
                                    return;
                                }
                                len = token.length;
                                if (types !== undefined) {
                                    table.push("<div class='doc'><table class='analysis' summary='Parsed Arrays'><thead><tr> <th" +
                                            ">Index</th><th>types</th><th>token</th> </tr></thead><tbody class='parseData'>");
                                    for (a = 0; a < len; a += 1) {
                                        table.push("<tr> <td>");
                                        table.push(a);
                                        table.push("</td><td>");
                                        table.push(types[a]);
                                        table.push("</td><td>");
                                        table.push(token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                        table.push("</td> </tr>");
                                    }
                                    table.push("</tbody></table></div>");
                                }
                                build = table.join("");
                                if (output[1].length + build.length > 75000) {
                                    pd.test.filled.code = true;
                                } else {
                                    pd.test.filled.code = false;
                                }
                                pd.data.node.report.code.body.innerHTML = output[1] + build;
                                if (autotest === true && pd.data.node.report.code.body.firstChild !== null) {
                                    if (pd.data.node.report.code.body.firstChild.nodeType > 1) {
                                        pd
                                            .data
                                            .node
                                            .report
                                            .code
                                            .body
                                            .removeChild(pd.data.node.report.code.body.firstChild);
                                    }
                                    pd.data.node.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span>";
                                }
                                if (pd.test.ls === true) {
                                    pd.data.stat.pars += 1;
                                    node              = pd.id("stpars");
                                    if (node !== null) {
                                        node.innerHTML = pd.data.stat.pars;
                                    }
                                }
                            }());
                        }
                        if (pd.data.node.report.code.body.style.display === "none") {
                            pd
                                .event
                                .grab({
                                    type: "onmousedown"
                                }, pd.data.node.report.code.box.getElementsByTagName("h3")[0]);
                        }
                        pd.data.node.report.code.box.style.top   = (pd.data.settings.codereport.top / 10) + "em";
                        pd.data.node.report.code.box.style.right = "auto";
                    }
                } else if (api.mode === "beautify") {
                    pd.data.html[11] = pd.data.builder.script.beautify;
                    if (pd.data.node.codeBeauOut !== null && api.jsscope !== "report") {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .beauOut
                                .setValue(output[0]);
                            pd
                                .ace
                                .beauOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeBeauOut.value = output[0];
                        }
                    }
                    if (pd.data.node.report.code.box !== null) {
                        if (output[1] !== "") {
                            pd.data.node.report.code.body.innerHTML = output[1];
                            if (autotest === true) {
                                if (pd.data.node.report.code.body.firstChild.nodeType > 1) {
                                    pd
                                        .data
                                        .node
                                        .report
                                        .code
                                        .body
                                        .removeChild(pd.data.node.report.code.body.firstChild);
                                }
                                pd.data.node.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span>";
                            }
                            pd.data.node.report.code.box.style.zIndex  = pd.data.zIndex;
                            pd.data.node.report.code.box.style.display = "block";
                        }
                        if (api.jsscope === "report" && pd.data.langvalue[1] === "javascript" && output[0].indexOf("Error:") !== 0) {
                            pd.data.node.report.code.body.innerHTML = pd.data.node.report.code.body.innerHTML + output[0];
                            if (api.lang === "auto" && pdlang === "" && output[1].indexOf("Presumed language is <em>") > 0) {
                                pdlang = output[1].split("Presumed language is <em>")[1];
                                pdlang = pdlang.substring(0, pdlang.indexOf("</em>"));
                            }
                            if (pd.data.node.report.code.body.style.display === "none") {
                                pd
                                    .event
                                    .grab({
                                        type: "onmousedown"
                                    }, pd.data.node.report.code.box.getElementsByTagName("h3")[0]);
                            }
                            pd.data.node.report.code.box.style.top   = (pd.data.settings.codereport.top / 10) + "em";
                            pd.data.node.report.code.box.style.right = "auto";
                            diffList                                 = pd
                                .data
                                .node
                                .report
                                .code
                                .body
                                .getElementsByTagName("ol");
                            if (diffList.length > 0) {
                                (function dom__event_recycle_execOutput_beauList() {
                                    var a    = 0,
                                        list = diffList[0].getElementsByTagName("li"),
                                        b    = list.length;
                                    for (a = 0; a < b; a += 1) {
                                        if (list[a].getAttribute("class") === "fold") {
                                            list[a].onmousedown = pd.event.beaufold;
                                        }
                                    }
                                }());
                            }
                        }
                        if (output[1] !== undefined && output[1].length > 125000) {
                            pd.test.filled.code = true;
                        } else {
                            pd.test.filled.code = false;
                        }
                    }
                    if (pd.test.ls === true) {
                        pd.data.stat.beau += 1;
                        node              = pd.id("stbeau");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.beau;
                        }
                    }
                } else if (api.mode === "diff" && pd.data.node.report.code.box !== null) {
                    buttons          = pd
                        .data
                        .node
                        .report
                        .code
                        .box
                        .getElementsByTagName("p")[0]
                        .getElementsByTagName("button");
                    pd.data.html[11] = pd.data.builder.script.diff;
                    if (output.length > 0 && output[0].length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }console.log(output[0]);
                    pd.data.node.report.code.body.innerHTML = output[1] + output[0];
                    if (autotest === true && pd.data.node.report.code.body.firstChild !== null) {
                        if (pd.data.node.report.code.body.firstChild.nodeType > 1) {
                            pd
                                .data
                                .node
                                .report
                                .code
                                .body
                                .removeChild(pd.data.node.report.code.body.firstChild);
                        }
                        pd.data.node.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span>";
                    }
                    if (pd.data.node.report.code.body.innerHTML.toLowerCase().indexOf("<textarea") === -1) {
                        diffList = pd
                            .data
                            .node
                            .report
                            .code
                            .body
                            .getElementsByTagName("ol");
                        if (diffList.length > 0) {
                            (function dom__event_recycle_execOutput_diffList() {
                                var cells = diffList[0].getElementsByTagName("li"),
                                    len   = cells.length,
                                    a     = 0;
                                for (a = 0; a < len; a += 1) {
                                    if (cells[a].getAttribute("class") === "fold") {
                                        cells[a].onmousedown = pd.event.difffold;
                                    }
                                }
                            }());
                        }
                        if (api.diffview === "sidebyside") {
                            if (diffList.length < 3 || diffList[0] === null || diffList[1] === null || diffList[2] === null) {
                                pd.data.colSliderProperties = [0, 0, 0, 0, 0];
                            } else {
                                pd.data.colSliderProperties = [
                                    diffList[0].clientWidth, diffList[1].clientWidth, diffList[2].parentNode.clientWidth, diffList[2].parentNode.parentNode.clientWidth, diffList[2].parentNode.offsetLeft - diffList[2].parentNode.parentNode.offsetLeft
                                ];
                                diffList[2].onmousedown     = pd.event.colSliderGrab;
                                diffList[2].ontouchstart    = pd.event.colSliderGrab;
                            }
                        }
                    }
                    if (pd.test.ls === true) {
                        pd.data.stat.diff += 1;
                        node              = pd.id("stdiff");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.diff;
                        }
                    }
                } else if (api.mode === "minify") {
                    if (output[0].length > 125000) {
                        pd.test.filled.code = true;
                    } else {
                        pd.test.filled.code = false;
                    }
                    if (pd.data.node.codeMinnOut !== null) {
                        if (pd.test.ace === true) {
                            pd
                                .ace
                                .minnOut
                                .setValue(output[0]);
                            pd
                                .ace
                                .minnOut
                                .clearSelection();
                        } else {
                            pd.data.node.codeMinnOut.value = output[0];
                        }
                    }
                    if (pd.data.node.report.code.box !== null) {
                        if (autotest === true) {
                            output[1] = output[1].replace("seconds </em></p>", "seconds </em></p> <p>Language is set to <strong>auto</strong>. Presumed language" +
                                    " is <em>" + pd.data.langvalue[2] + "</em>.</p>");
                            api.lang  = "auto";
                        }
                        pd.data.node.report.code.body.innerHTML = output[1];
                        if (autotest === true && pd.data.node.report.code.body.firstChild !== null) {
                            if (pd.data.node.report.code.body.firstChild.nodeType > 1) {
                                pd
                                    .data
                                    .node
                                    .report
                                    .code
                                    .body
                                    .removeChild(pd.data.node.report.code.body.firstChild);
                            }
                            pd.data.node.report.code.body.firstChild.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span>";
                        }
                        pd.data.node.report.code.box.style.zIndex  = pd.data.zIndex;
                        pd.data.node.report.code.box.style.display = "block";
                    }
                    if (pd.test.ls === true) {
                        pd.data.stat.minn += 1;
                        node              = pd.id("stminn");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.minn;
                        }
                    }
                }
                if (pd.data.node.announce !== null) {
                    if (pd.data.langvalue[1] === "markup" || pd.data.langvalue[1] === "html") {
                        errortext = (function dom__event_recycle_execOutput_errortext() {
                            var a      = 0,
                                p      = output[1].split("<p><strong"),
                                length = p.length;
                            for (a = 0; a < length; a += 1) {
                                if (p[a].indexOf(" more ") > -1 && p[a].indexOf("start tag") > -1 && p[a].indexOf("end tag") > -1) {
                                    return "Notice: " + p[a].substring(1, p[a].indexOf("<"));
                                }
                                if (p[a].indexOf("Duplicate id") > -1) {
                                    if (p[a].indexOf("Execution time") > -1) {
                                        return p[a].slice(p[a].indexOf("<strong class='duplicate"), p[a].length - 4);
                                    }
                                    return "<strong>" + p[a].slice(p[a].indexOf(">") + 1, p[a].indexOf("</p"));
                                }
                            }
                            return "";
                        }());
                    }
                    if (errortext.indexOf("end tag") > 0 || errortext.indexOf("Duplicate id") > 0) {
                        pd
                            .data
                            .node
                            .announce
                            .setAttribute("class", "error");
                        pd.data.node.announce.innerHTML = errortext;
                    } else if (pd.id("jserror") !== null) {
                        pd
                            .data
                            .node
                            .announce
                            .removeAttribute("class");
                        pd.data.node.announce.innerHTML = "<strong>" + pd
                            .id("jserror")
                            .getElementsByTagName("strong")[0]
                            .innerHTML + "</strong> <span>See 'Code Report' for details</span>";
                    } else {
                        if (autotest === true) {
                            pd
                                .data
                                .node
                                .announce
                                .setAttribute("class", "alert");
                            pd.data.node.announce.innerHTML = "Code type is set to <strong>auto</strong>. <span>Presumed language is <em>" + pd.data.langvalue[2] + "</em>.</span>";
                        } else {
                            pd.data.node.announce.innerHTML = "Language set to <em>" + pd.data.langvalue[2] + "</em>.";
                        }
                    }
                }
                buttons = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("p")[0]
                    .getElementsByTagName("button");
                if (chromeSave === true) {
                    pd
                        .event
                        .save(buttons[0]);
                } else if (pd.data.node.save !== null && pd.data.node.save.checked === true) {
                    if (buttons[0].parentNode.nodeName.toLowerCase() === "a") {
                        pd
                            .event
                            .save(buttons[0].parentNode);
                    } else {
                        pd
                            .event
                            .save(buttons[0]);
                    }
                }
                if (buttons[1].parentNode.style.display === "none" && (pd.data.mode === "diff" || (pd.data.mode === "beau" && api.jsscope === "report" && lang === "javascript"))) {
                    pd
                        .event
                        .minimize(buttons[1].onclick, 1, buttons[1]);
                }
                if (pd.test.ls === true) {
                    (function dom__event_recycle_stats() {
                        var size = 0;
                        lang = lang.toLowerCase();
                        if (pd.data.langvalue[1] === "csv") {
                            pd.data.stat.csv += 1;
                            node             = pd.id("stcsv");
                            if (node !== null) {
                                node.innerHTML = pd.data.stat.csv;
                            }
                        } else if (pd.data.langvalue[1] === "plain text") {
                            pd.data.stat.text += 1;
                            node              = pd.id("sttext");
                            if (node !== null) {
                                node.innerHTML = pd.data.stat.text;
                            }
                        } else if (pd.data.langvalue[1] === "javascript") {
                            pd.data.stat.js += 1;
                            node            = pd.id("stjs");
                            if (node !== null) {
                                node.innerHTML = pd.data.stat.js;
                            }
                        } else if (pd.data.langvalue[1] === "markup" || pd.data.langvalue[1] === "html" || pd.data.langvalue[1] === "xml" || pd.data.langvalue[1] === "xhtml") {
                            pd.data.stat.markup += 1;
                            node                = pd.id("stmarkup");
                            if (node !== null) {
                                node.innerHTML = pd.data.stat.markup;
                            }
                        } else if (pd.data.langvalue[1] === "css") {
                            pd.data.stat.css += 1;
                            node             = pd.id("stcss");
                            if (node !== null) {
                                node.innerHTML = pd.data.stat.css;
                            }
                        }
                        if (api.mode === "diff" && api.source !== undefined && api.diff !== undefined && api.diff.length > api.source.length) {
                            size = api.diff.length;
                        } else if (api.source !== undefined) {
                            size = api.source.length;
                        }
                        if (size > pd.data.stat.large) {
                            pd.data.stat.large = size;
                            node               = pd.id("stlarge");
                            if (node !== null) {
                                node.innerHTML = size;
                            }
                        }
                        if (pd.test.json === true) {
                            localStorage.stat = JSON.stringify(pd.data.stat);
                        }
                    }());
                }
            };

        node = pd.id("showOptionsCallOut");
        if (node !== null) {
            node
                .parentNode
                .removeChild(node);
        }
        if (pd.test.accessibility === true) {
            api.accessibility = true;
        }
        if (crlf !== null && crlf.checked === true) {
            api.crlf = true;
        }
        if (typeof event === "object" && event !== null && event.type === "keyup") {
            // jsscope does not get the convenience of keypress execution, because its
            // overhead is costly do not execute keypress from alt, home, end, or arrow keys
            if ((textout === false && pd.data.mode === "beau") || event.altKey === true || event.keyCode === 16 || event.keyCode === 18 || event.keyCode === 35 || event.keyCode === 36 || event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40) {
                return false;
            }
            if (pd.test.keypress === true) {
                if (pd.test.keystore.length > 0) {
                    pd
                        .test
                        .keystore
                        .pop();
                    if (event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) {
                        pd.test.keypress = false;
                        pd.test.keystore = [];
                    } else {
                        if (pd.test.keystore.length === 0) {
                            pd.test.keypress = false;
                        }
                        return false;
                    }
                }
            }
            if ((event.keyCode === 17 || event.ctrlKey === true || event.keyCode === 224) && pd.test.keypress === true && pd.test.keystore.length === 0) {
                pd.test.keypress = false;
                return false;
            }
        }

        //gather updated dom nodes
        api.lang        = (pd.data.node.lang === null)
            ? "javascript"
            : (pd.data.node.lang.nodeName.toLowerCase() === "select")
                ? pd
                    .data
                    .node
                    .lang[pd.data.node.lang.selectedIndex]
                    .value
                    .toLowerCase()
                : pd
                    .data
                    .node
                    .lang
                    .value
                    .toLowerCase();
        api.langdefault = (pd.data.node.langdefault !== null)
            ? pd.data.node.langdefault[pd.data.node.langdefault.selectedIndex].value
            : "javascript";
        node            = pd.id("csvchar");
        api.csvchar     = (node === null || node.value.length === 0)
            ? ","
            : node.value;
        node            = pd.id("lterminator-crlf");
        api.crlf        = (node !== null && node.checked === true);
        api.api         = "dom";
        if (api.lang === "auto") {
            autotest = true;
        }

        //determine options based upon mode of operations
        if (pd.data.mode === "beau") {
            (function dom__event_recycle_beautify() {
                var braceline    = pd.id("bbraceline-no"),
                    bracepadding = pd.id("bracepadding-no"),
                    braces       = pd.id("jsindent-all"),
                    chars        = pd.id("beau-space"),
                    comments     = pd.id("incomment-no"),
                    commline     = pd.id("bcommline-yes"),
                    csslines     = pd.id("cssinsertlines-yes"),
                    dustjs       = pd.id("bdustyes"),
                    elseline     = pd.id("jselseline-yes"),
                    endcomma     = pd.id("bendcomma-yes"),
                    forceIndent  = pd.id("bforce_indent-yes"),
                    html         = pd.id("html-yes"),
                    jscorrect    = pd.id("jscorrect-yes"),
                    jshtml       = pd.id("jsscope-html"),
                    jslinesa     = pd.id("bjslines-all"),
                    jsspace      = pd.id("jsspace-no"),
                    methodchainc = pd.id("bmethodchain-chain"),
                    methodchaini = pd.id("bmethodchain-indent"),
                    methodchainn = pd.id("bmethodchain-none"),
                    neverflatten = pd.id("bneverflatten-yes"),
                    nocaseindent = pd.id("bnocaseindent-yes"),
                    noleadzero   = pd.id("bnoleadzero-yes"),
                    objsorta     = pd.id("bobjsort-all"),
                    objsortc     = pd.id("bobjsort-cssonly"),
                    objsortj     = pd.id("bobjsort-jsonly"),
                    objsortm     = pd.id("bobjsort-markuponly"),
                    offset       = pd.id("inlevel"),
                    quantity     = pd.id("beau-quan"),
                    quotecond    = pd.id("bquoteconvert-double"),
                    quotecons    = pd.id("bquoteconvert-single"),
                    selectorlist = pd.id("bselectorlist-yes"),
                    spaceclose   = pd.id("bspaceclose-yes"),
                    style        = pd.id("inscript-no"),
                    styleguide   = pd.id("bstyleguide"),
                    tagmerge     = pd.id("btagmerge-yes"),
                    tagsort      = pd.id("btagsort-yes"),
                    ternaryline  = pd.id("bternaryline-yes"),
                    textpreserve = pd.id("btextpreserveyes"),
                    varworde     = pd.id("bvarword-each"),
                    varwordl     = pd.id("bvarword-list"),
                    verticala    = pd.id("vertical-all"),
                    verticalc    = pd.id("vertical-cssonly"),
                    verticalj    = pd.id("vertical-jsonly"),
                    wrap         = pd.id("beau-wrap");
                if (pd.data.node.codeBeauIn !== null) {
                    if (api.lang === "auto" && pd.data.langvalue.length === 0) {
                        if (pd.test.ace === true) {
                            pd
                                .app
                                .langkey(false, pd.ace.beauIn, "");
                        } else {
                            pd
                                .app
                                .langkey(false, pd.data.node.codeBeauIn, "");
                        }
                    }
                    if (pd.test.ace === true) {
                        api.source = pd
                            .ace
                            .beauIn
                            .getValue();
                    } else {
                        api.source = pd.data.node.codeBeauIn.value;
                    }
                }
                api.braceline    = (braceline === null || braceline.checked === false);
                api.bracepadding = (bracepadding === null || bracepadding.checked === false);
                api.braces       = (braces === null || braces.checked === false)
                    ? "knr"
                    : "allman";
                if (chars === null || chars.checked === false) {
                    chars = pd.id("beau-tab");
                    if (chars === null || chars.checked === false) {
                        chars = pd.id("beau-line");
                        if (chars === null || chars.checked === false) {
                            chars = pd.id("beau-other");
                            if (chars === null || chars.checked === false) {
                                api.inchar = " ";
                            } else {
                                chars = pd.id("beau-char");
                                if (chars === null) {
                                    api.inchar = " ";
                                } else {
                                    api.inchar = chars.value;
                                }
                            }
                        } else {
                            api.inchar = "\n";
                        }
                    } else {
                        api.inchar = "\t";
                    }
                } else {
                    api.inchar = " ";
                }
                api.comments       = (comments !== null && comments.checked === true)
                    ? "noindent"
                    : "indent";
                api.commline       = (commline !== null && commline.checked === true);
                api.correct        = (jscorrect !== null && jscorrect.checked === true);
                api.cssinsertlines = (csslines !== null && csslines.checked === true);
                api.dustjs         = (pd.data.langvalue[0] === "dustjs" || (dustjs !== null && dustjs.checked === true));
                api.dustjs         = (dustjs !== null && dustjs.checked === true);
                api.elseline       = (elseline !== null && elseline.checked === true);
                api.endcomma       = (endcomma !== null && endcomma.checked === true);
                api.force_indent   = (forceIndent !== null && forceIndent.checked === true);
                api.html           = (html !== null && html.checked === true);
                api.inlevel        = (offset === null || isNaN(offset.value) === true)
                    ? 0
                    : Number(offset.value);
                api.insize         = (quantity === null || isNaN(quantity.value) === true)
                    ? 4
                    : Number(quantity.value);
                if (pd.data.node.jsscope !== null && pd.data.node.jsscope.checked === true) {
                    api.jsscope = "report";
                } else if (jshtml !== null && jshtml.checked === true) {
                    api.jsscope = "html";
                } else {
                    api.jsscope = "none";
                }
                if (methodchainc !== null && methodchainc.checked === true) {
                    api.methodchain = "chain";
                } else if (methodchaini !== null && methodchaini.checked === true) {
                    api.methodchain = "indent";
                } else if (methodchainn !== null && methodchainn.checked === true) {
                    api.methodchain = "none";
                }
                api.neverflatten = (neverflatten !== null && neverflatten.checked === true);
                api.nocaseindent = (nocaseindent !== null && nocaseindent.checked === true);
                api.noleadzero   = (noleadzero !== null && noleadzero.checked === true);
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else if (objsortm !== null && objsortm.checked === true) {
                    api.objsort = "markup";
                } else {
                    api.objsort = "none";
                }
                if (jslinesa !== null && jslinesa.checked === true) {
                    api.preserve = "all";
                } else {
                    api.preserve = "none";
                }
                if (quotecond !== null && quotecond.checked === true) {
                    api.quoteConvert = "double";
                } else if (quotecons !== null && quotecons.checked === true) {
                    api.quoteConvert = "single";
                } else {
                    api.quoteConvert = "none";
                }
                api.selectorlist = (selectorlist !== null && selectorlist.checked === true);
                api.space        = (jsspace === null || jsspace.checked === false);
                api.spaceclose   = (spaceclose !== null && spaceclose.checked === true);
                api.style        = (style === null || style.checked === false)
                    ? "indent"
                    : "noindent";
                api.styleguide   = (styleguide !== null)
                    ? styleguide[styleguide.selectedIndex].value
                    : "";
                api.tagmerge     = (tagmerge !== null && tagmerge.checked === true);
                api.tagsort      = (tagsort !== null && tagsort.checked === true);
                api.ternaryline  = (ternaryline !== null && ternaryline.checked === true);
                api.textpreserve = (textpreserve !== null && textpreserve.checked === true);
                if (varworde !== null && varworde.checked === true) {
                    api.varword = "each";
                } else if (varwordl !== null && varwordl.checked === true) {
                    api.varword = "list";
                } else {
                    api.varword = "none";
                }
                if (verticala !== null && verticala.checked === true) {
                    api.vertical = "all";
                } else if (verticalc !== null && verticalc.checked === true) {
                    api.vertical = "css";
                } else if (verticalj !== null && verticalj.checked === true) {
                    api.vertical = "js";
                } else {
                    api.vertical = "none";
                }
                api.wrap = (wrap === null || isNaN(wrap.value) === true)
                    ? 80
                    : Number(wrap.value);
            }());
            api.mode = "beautify";
        }
        if (pd.data.mode === "minn") {
            (function dom__event_recycle_minify() {
                var conditional  = pd.id("conditionalm-yes"),
                    dustjs       = pd.id("mdustyes"),
                    html         = pd.id("htmlm-yes"),
                    correct      = pd.id("mjscorrect-yes"),
                    miniwrap     = pd.id("miniwrapm-yes"),
                    objsorta     = pd.id("mobjsort-all"),
                    objsortc     = pd.id("mobjsort-cssonly"),
                    objsortj     = pd.id("mobjsort-jsonly"),
                    objsortm     = pd.id("mobjsort-markuponly"),
                    quotecond    = pd.id("mquoteconvert-double"),
                    quotecons    = pd.id("mquoteconvert-single"),
                    tagmerge     = pd.id("mtagmerge-yes"),
                    tagsort      = pd.id("mtagsort-yes"),
                    textpreserve = pd.id("mtextpreserveyes"),
                    topcoms      = pd.id("topcoms-yes"),
                    wrap         = pd.id("mini-wrap");
                if (pd.data.node.codeMinnIn !== null) {
                    if (api.lang === "auto" && pd.data.langvalue.length === 0) {
                        if (pd.test.ace === true) {
                            pd
                                .app
                                .langkey(false, pd.ace.minnIn, "");
                        } else {
                            pd
                                .app
                                .langkey(false, pd.data.node.codeMinnIn, "");
                        }
                    }
                    pd.data.node.codeMinnIn = pd.id("minifyinput");
                    if (pd.test.ace === true) {
                        api.source = pd
                            .ace
                            .minnIn
                            .getValue();
                    } else {
                        api.source = pd.data.node.codeMinnIn.value;
                    }
                }
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else if (objsortm !== null && objsortm.checked === true) {
                    api.objsort = "markup";
                } else {
                    api.objsort = "none";
                }
                if (quotecond !== null && quotecond.checked === true) {
                    api.quoteConvert = "double";
                } else if (quotecons !== null && quotecons.checked === true) {
                    api.quoteConvert = "single";
                } else {
                    api.quoteConvert = "none";
                }
                api.conditional  = (conditional !== null && conditional.checked === true);
                api.correct      = (correct !== null && correct.checked === true);
                api.dustjs       = (dustjs !== null && dustjs.checked === true);
                api.html         = (html !== null && html.checked === true);
                api.miniwrap     = (miniwrap !== null && miniwrap.checked === true);
                api.tagmerge     = (tagmerge !== null && tagmerge.checked === true);
                api.tagsort      = (tagsort !== null && tagsort.checked === true);
                api.textpreserve = (textpreserve !== null && textpreserve.checked === true);
                api.topcoms      = (topcoms !== null && topcoms.checked === true);
                api.wrap         = (wrap !== null && isNaN(wrap.value) === false)
                    ? wrap.value
                    : -1;
            }());
            api.mode = "minify";
        }
        if (pd.data.mode === "diff") {
            api.jsscope = false;
            (function dom__event_recycle_diff() {
                var braceline       = pd.id("dbraceline-no"),
                    bracepadding    = pd.id("dbracepadding-no"),
                    braces          = pd.id("jsindentd-all"),
                    baseLabel       = pd.id("baselabel"),
                    chars           = pd.id("diff-space"),
                    comments        = pd.id("diffcommentsy"),
                    conditional     = pd.id("conditionald-yes"),
                    content         = pd.id("diffcontentn"),
                    context         = pd.id("contextSize"),
                    diffspaceignore = pd.id("diffspaceignorey"),
                    dustjs          = pd.id("ddustyes"),
                    elseline        = pd.id("jselselined-yes"),
                    forceIndent     = pd.id("dforce_indent-yes"),
                    html            = pd.id("htmld-yes"),
                    inline          = pd.id("inline"),
                    jslinesa        = pd.id("djslines-all"),
                    methodchain     = pd.id("dmethodchain-yes"),
                    newLabel        = pd.id("newlabel"),
                    nocaseindent    = pd.id("dnocaseindent-yes"),
                    objsorta        = pd.id("dobjsort-all"),
                    objsortc        = pd.id("dobjsort-cssonly"),
                    objsortj        = pd.id("dobjsort-jsonly"),
                    objsortm        = pd.id("dobjsort-markuponly"),
                    quantity        = pd.id("diff-quan"),
                    quote           = pd.id("diffquoten"),
                    selectorlist    = pd.id("dselectorlist-yes"),
                    semicolon       = pd.id("diffscolonn"),
                    style           = pd.id("inscriptd-no"),
                    space           = pd.id("jsspaced-no"),
                    tagmerge        = pd.id("dtagmerge-yes"),
                    tagsort         = pd.id("dtagsort-yes"),
                    ternaryline     = pd.id("dternaryline-yes"),
                    textpreserve    = pd.id("dtextpreserveyes"),
                    wrap            = pd.id("diff-wrap");
                pd.data.node.codeDiffBase = pd.id("baseText");
                pd.data.node.codeDiffNew  = pd.id("newText");
                if (pd.data.node.codeDiffBase !== null && api.lang === "auto" && pd.data.langvalue.length === 0) {
                    if (pd.test.ace === true) {
                        pd
                            .app
                            .langkey(false, pd.ace.diffBase, "");
                    } else {
                        pd
                            .app
                            .langkey(false, pd.data.node.codeDiffBase, "");
                    }
                }
                api.braceline    = (braceline === null || braceline.checked === false);
                api.bracepadding = (bracepadding === null || bracepadding.checked === false);
                api.braces       = (braces === null || braces.checked === false)
                    ? "knr"
                    : "allman";
                api.conditional  = (conditional !== null && conditional.checked === true);
                api.content      = (content !== null && content.checked !== false);
                api.context      = (context !== null && context.value !== "" && isNaN(context.value) === false)
                    ? Number(context.value)
                    : "";
                api.diffcomments = (comments === null || comments.checked === true);
                if (api.diffcomments === false) {
                    api.comments = "nocomment";
                }
                api.difflabel       = (newLabel === null)
                    ? "new"
                    : newLabel.value;
                api.diffspaceignore = (diffspaceignore !== null && diffspaceignore.checked === true);
                api.diffview        = (inline === null || inline.checked === false)
                    ? "sidebyside"
                    : "inline";
                api.dustjs          = (dustjs !== null && dustjs.checked === true);
                api.elseline        = (elseline !== null && elseline.checked !== false);
                api.force_indent    = (forceIndent !== null && forceIndent.checked === true);
                api.html            = (html !== null && html.checked === true);
                api.insize          = (quantity === null || isNaN(quantity.value) === true)
                    ? 4
                    : Number(quantity.value);
                api.methodchain     = (methodchain !== null && methodchain.checked === true);
                api.nocaseindent    = (nocaseindent !== null && nocaseindent.checked === true);
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else if (objsortm !== null && objsortm.checked === true) {
                    api.objsort = "markup";
                } else {
                    api.objsort = "none";
                }
                if (jslinesa !== null && jslinesa.checked === true) {
                    api.preserve = "all";
                } else {
                    api.preserve = "none";
                }
                api.quote        = (quote !== null && quote.checked !== false);
                api.selectorlist = (selectorlist !== null && selectorlist.checked === true);
                api.semicolon    = (semicolon !== null && semicolon.checked !== false);
                api.sourcelabel  = (baseLabel === null)
                    ? "base"
                    : baseLabel.value;
                api.space        = (space === null || space.checked === false);
                api.style        = (style === null || style.checked === false)
                    ? "indent"
                    : "noindent";
                api.tagmerge     = (tagmerge !== null && tagmerge.checked === true);
                api.tagsort      = (tagsort !== null && tagsort.checked === true);
                api.ternaryline  = (ternaryline !== null && ternaryline.checked === true);
                api.textpreserve = (textpreserve !== null && textpreserve.checked === true);
                api.wrap         = (wrap === null || isNaN(wrap.value) === true)
                    ? 72
                    : Number(wrap.value);
                if (chars === null || chars.checked === false) {
                    chars = pd.id("diff-tab");
                    if (chars === null || chars.checked === false) {
                        chars = pd.id("diff-line");
                        if (chars === null || chars.checked === false) {
                            chars = pd.id("diff-other");
                            if (chars === null || chars.checked === false) {
                                api.inchar = " ";
                            } else {
                                chars = pd.id("diff-char");
                                if (chars === null) {
                                    api.inchar = " ";
                                } else {
                                    api.inchar = chars.value;
                                }
                            }
                        } else {
                            api.inchar = "\n";
                        }
                    } else {
                        api.inchar = "\t";
                    }
                } else {
                    api.inchar = " ";
                }
                if (pd.data.node.codeDiffBase !== null && (pd.data.node.codeDiffBase.value === "" || pd.data.node.codeDiffBase.value === "Error: source code is missing.")) {
                    pd.data.node.codeDiffBase.value = "Error: source code is missing.";
                    return;
                }
                if (pd.data.node.codeDiffNew !== null && (pd.data.node.codeDiffNew.value === "" || pd.data.node.codeDiffNew.value === "Error: diff code is missing.")) {
                    pd.data.node.codeDiffNew.value = "Error: diff code is missing.";
                    return;
                }
                if (pd.data.node.codeDiffBase !== null) {
                    if (pd.test.ace === true) {
                        api.source = pd
                            .ace
                            .diffBase
                            .getValue();
                    } else {
                        api.source = pd.data.node.codeDiffBase.value;
                    }
                } else {
                    api.source = "";
                }
                if (pd.data.node.codeDiffNew !== null) {
                    if (pd.test.ace === true) {
                        api.diff = pd
                            .ace
                            .diffNew
                            .getValue();
                    } else {
                        api.diff = pd.data.node.codeDiffNew.value;
                    }
                } else {
                    api.diff = "";
                }
                api.mode = "diff";
                if (domain.test(api.diff) === true && pd.test.xhr === true) {
                    (function dom__event_recycle_xhrDiff() {
                        var filetest       = (api.diff.indexOf("file:///") === 0),
                            protocolRemove = (filetest === true)
                                ? api
                                    .diff
                                    .split(":///")[1]
                                : api
                                    .diff
                                    .split("://")[1],
                            slashIndex     = (protocolRemove !== undefined)
                                ? protocolRemove.indexOf("/")
                                : 0,
                            xhr            = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object")
                                ? new XMLHttpRequest()
                                : new ActiveXObject("Microsoft.XMLHTTP");
                        if (typeof protocolRemove !== "string" || protocolRemove.length === 0) {
                            return;
                        }
                        requestd = true;
                        if (slashIndex > 0 || api.diff.indexOf("http") === 0) {
                            xhr.onreadystatechange = function dom__event_recycle_xhrDiff_stateChange() {
                                var appDelay = function dom__event_recycle_xhrDiff_statechange_appDelay() {
                                    var apptest = application(api.lang);
                                    if (apptest === undefined) {
                                        setTimeout(dom__event_recycle_xhrDiff_statechange_appDelay, 100);
                                    } else {
                                        output = apptest(api);
                                        execOutput();
                                    }
                                };
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200 || xhr.status === 0) {
                                        api.diff = xhr
                                            .responseText
                                            .replace(/\r\n/g, "\n");
                                        if (completes === true) {
                                            pd.data.source = api.source;
                                            if (pd.data.langvalue[1] === "text") {
                                                api.lang = "text";
                                            } else {
                                                if (pd.test.ace === true) {
                                                    api.lang = pd
                                                        .app
                                                        .langkey(false, pd.ace.diffBase, "");
                                                } else {
                                                    api.lang = pd
                                                        .app
                                                        .langkey(false, {
                                                            value: pd.data.source
                                                        }, "");
                                                }
                                            }
                                            if (pd.data.mode === "diff") {
                                                pd.data.diff = api.diff;
                                            } else {
                                                pd.data.diff = "";
                                            }
                                            app = application(api.lang);
                                            if (app === undefined) {
                                                if (pd.test.delayExecution === true) {
                                                    pd.test.delayExecution = false;
                                                    setTimeout(appDelay, 100);
                                                }
                                            } else {
                                                output = app(api);
                                                execOutput();
                                            }
                                            return;
                                        }
                                        completed = true;
                                    } else {
                                        api.diff = "Error: transmission failure receiving diff code from address.";
                                    }
                                }
                            };
                            if (filetest === true) {
                                xhr.open("GET", api.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                            } else {
                                xhr.open("GET", "proxy.php?x=" + api.diff.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                            }
                            xhr.send();
                        }
                    }());
                }
            }());
        }
        if (pd.data.mode === "pars") {
            if (pd.data.node.codeParsIn !== null) {
                if (api.lang === "auto" && pd.data.langvalue.length === 0) {
                    if (pd.test.ace === true) {
                        pd
                            .app
                            .langkey(false, pd.ace.parsIn, "");
                    } else {
                        pd
                            .app
                            .langkey(false, pd.data.node.codeParsIn, "");
                    }
                } else if (api.lang === "csv") {
                    if (pd.test.ace === true) {
                        pd
                            .ace
                            .parsIn
                            .setValue("CSV is not supported in 'Parse Only' mode.");
                    } else {
                        pd.data.node.codeParsIn.value = "CSV is not supported in 'Parse Only' mode.";
                    }
                    return;
                }
            }
            (function dom__event_recycle_parse() {
                var dustjs       = pd.id("pdustyes"),
                    html         = pd.id("phtml-yes"),
                    jscorrect    = pd.id("pjscorrect-yes"),
                    methodchainc = pd.id("dmethodchain-chain"),
                    methodchaini = pd.id("dmethodchain-indent"),
                    methodchainn = pd.id("dmethodchain-none"),
                    objsorta     = pd.id("pobjsort-all"),
                    objsortc     = pd.id("pobjsort-cssonly"),
                    objsortj     = pd.id("pobjsort-jsonly"),
                    objsortm     = pd.id("pobjsort-markuponly"),
                    quotecond    = pd.id("pquoteconvert-double"),
                    quotecons    = pd.id("pquoteconvert-single"),
                    tagmerge     = pd.id("ptagmerge-yes"),
                    tagsort      = pd.id("ptagsort-yes"),
                    textpreserve = pd.id("ptextpreserveyes"),
                    varworde     = pd.id("pvarword-each"),
                    varwordl     = pd.id("pvarword-list");
                if (pd.data.node.codeParsIn !== null) {
                    if (pd.test.ace === true) {
                        api.source = pd
                            .ace
                            .parsIn
                            .getValue();
                    } else {
                        api.source = pd.data.node.codeParsIn.value;
                    }
                }
                api.correct      = (jscorrect !== null && jscorrect.checked === true);
                api.dustjs       = (dustjs !== null && dustjs.checked === true);
                api.html         = (html !== null && html.checked === true);
                api.tagmerge     = (tagmerge !== null && tagmerge.checked === true);
                api.tagsort      = (tagsort !== null && tagsort.checked === true);
                api.textpreserve = (textpreserve !== null && textpreserve.checked === true);
                if (methodchainc !== null && methodchainc.checked === true) {
                    api.methodchain = "chain";
                } else if (methodchaini !== null && methodchaini.checked === true) {
                    api.methodchain = "indent";
                } else if (methodchainn !== null && methodchainn.checked === true) {
                    api.methodchain = "none";
                }
                if (objsorta !== null && objsorta.checked === true) {
                    api.objsort = "all";
                } else if (objsortc !== null && objsortc.checked === true) {
                    api.objsort = "css";
                } else if (objsortj !== null && objsortj.checked === true) {
                    api.objsort = "js";
                } else if (objsortm !== null && objsortm.checked === true) {
                    api.objsort = "markup";
                } else {
                    api.objsort = "none";
                }
                if (quotecond !== null && quotecond.checked === true) {
                    api.quoteConvert = "double";
                } else if (quotecons !== null && quotecons.checked === true) {
                    api.quoteConvert = "single";
                } else {
                    api.quoteConvert = "none";
                }
                if (varworde !== null && varworde.checked === true) {
                    api.varword = "each";
                } else if (varwordl !== null && varwordl.checked === true) {
                    api.varword = "list";
                } else {
                    api.varword = "none";
                }
            }());
            api.mode = "parse";
        }
        if (domain.test(api.source) === true && pd.test.xhr === true) {
            (function dom__event_recycle_xhrSource() {
                var filetest       = (api.source.indexOf("file:///") === 0),
                    protocolRemove = (filetest === true)
                        ? api
                            .source
                            .split(":///")[1]
                        : api
                            .source
                            .split("://")[1],
                    slashIndex     = (protocolRemove !== undefined)
                        ? protocolRemove.indexOf("/")
                        : 0,
                    xhr            = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object")
                        ? new XMLHttpRequest()
                        : new ActiveXObject("Microsoft.XMLHTTP");
                if (typeof protocolRemove !== "string" || protocolRemove.length === 0) {
                    return;
                }
                requests = true;
                if (slashIndex > 0 || api.source.indexOf("http") === 0) {
                    xhr.onreadystatechange = function dom__event_recycle_xhrSource_statechange() {
                        var appDelay = function dom__event_recycle_xhrSource_statechange_appDelay() {
                            var apptest = application(api.lang);
                            if (apptest === undefined) {
                                setTimeout(dom__event_recycle_xhrSource_statechange_appDelay, 100);
                            } else {
                                output = apptest(api);
                                execOutput();
                            }
                        };
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200 || xhr.status === 0) {
                                api.source = xhr
                                    .responseText
                                    .replace(/\r\n/g, "\n");
                                if (pd.data.mode !== "diff" || (requestd === true && completed === true)) {
                                    pd.data.source = api.source;
                                    if (pd.test.ace === true) {
                                        if (pd.data.mode !== "diff") {
                                            api.lang = pd
                                                .app
                                                .langkey(false, pd.ace[pd.data.mode + "In"], "");
                                        } else if (pd.data.langvalue[1] === "text") {
                                            api.lang = "text";
                                        } else {
                                            api.lang = pd
                                                .app
                                                .langkey(false, pd.ace.diffBase, "");
                                        }
                                    } else if (pd.data.mode === "diff" && pd.data.langvalue[1] === "text") {
                                        api.lang = "text";
                                    } else {
                                        api.lang = pd
                                            .app
                                            .langkey(false, {
                                                value: pd.data.source
                                            }, "");
                                    }
                                    if (pd.data.mode === "diff") {
                                        pd.data.diff = api.diff;
                                    } else {
                                        pd.data.diff = "";
                                    }
                                    app = application(api.lang);
                                    if (app === undefined) {
                                        if (pd.test.delayExecution === true) {
                                            pd.test.delayExecution = false;
                                            setTimeout(appDelay, 100);
                                        }
                                    } else {
                                        output = app(api);
                                        execOutput();
                                    }
                                    return;
                                }
                                completes = true;
                            } else {
                                api.source = "Error: transmission failure receiving source code from address.";
                            }
                        }
                    };
                    if (filetest === true) {
                        xhr.open("GET", api.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                    } else {
                        xhr.open("GET", "proxy.php?x=" + api.source.replace(/(\s*)$/, "").replace(/%26/g, "&").replace(/%3F/, "?"), true);
                    }
                    xhr.send();
                }
            }());
        }
        if (pd.test.ls === true) {
            if (pd.data.node.report.stat.box !== null) {
                pd.data.stat.usage  += 1;
                pd.data.stat.useday = Math.round(pd.data.stat.usage / ((Date.now() - pd.data.stat.fdate) / 86400000));
                node                = pd.id("stusage");
                if (node !== null) {
                    node.innerHTML = pd.data.stat.usage;
                }
                node = pd.id("stuseday");
                if (node !== null) {
                    node.innerHTML = pd.data.stat.useday;
                }
            }
            (function dom__event_recycle_storage() {
                var codesize = 0;
                if (api.source === undefined || (pd.data.mode === "diff" && api.diff === undefined)) {
                    return;
                }
                // this logic attempts to prevent writes to localStorage if they are likely to
                // exceed 5mb of storage

                if (api.mode === "beautify") {
                    codesize = api.source.length + pd.data.sourceLength.diffBase + pd.data.sourceLength.diffNew + pd.data.sourceLength.minn + pd.data.sourceLength.pars;
                    if (api.source.length < 2096000 && codesize < 4800000) {
                        localStorage.codeBeautify = api.source;
                        pd.data.sourceLength.beau = api.source.length;
                    } else {
                        localStorage.codeBeautify = "";
                        pd.data.sourceLength.beau = 0;
                    }
                } else if (api.mode === "minify") {
                    codesize = api.source.length + pd.data.sourceLength.beau + pd.data.sourceLength.diffBase + pd.data.sourceLength.diffNew + pd.data.sourceLength.pars;
                    if (api.source.length < 2096000 && codesize < 4800000) {
                        localStorage.codeMinify   = api.source;
                        pd.data.sourceLength.minn = api.source.length;
                    } else {
                        localStorage.codeMinify   = "";
                        pd.data.sourceLength.minn = 0;
                    }
                } else if (api.mode === "parse") {
                    codesize = api.source.length + pd.data.sourceLength.beau + pd.data.sourceLength.diffBase + pd.data.sourceLength.diffNew + pd.data.sourceLength.minn;
                    if (api.source.length < 2096000 && codesize < 4800000) {
                        localStorage.codeParse    = api.source;
                        pd.data.sourceLength.pars = api.source.length;
                    } else {
                        localStorage.codeParse    = "";
                        pd.data.sourceLength.pars = 0;
                    }
                } else if (api.mode === "diff") {
                    codesize = pd.data.sourceLength.beau + pd.data.sourceLength.minn + api.source.length + api.diff.length;
                    if (api.source.length < 2096000 && api.diff.length < 2096000 && codesize < 4800000) {
                        localStorage.codeDiffBase     = api.source;
                        localStorage.codeDiffNew      = api.diff;
                        pd.data.sourceLength.diffBase = api.source.length;
                        pd.data.sourceLength.diffNew  = api.diff.length;
                    } else {
                        localStorage.codeDiffBase     = "";
                        localStorage.codeDiffNew      = "";
                        pd.data.sourceLength.diffBase = 0;
                        pd.data.sourceLength.diffNew  = 0;
                    }
                }
            }());
        }
        if (requests === false && requestd === false) {
            // sometimes the Ace getValue method fires too early on copy/paste.  I put in a
            // 50ms delay in this case to prevent operations from old input

            if (pd.test.ace === true && api.mode !== "diff") {
                if (api.mode === "beautify") {
                    setTimeout(function dom__event_recycle_beautifyPromise() {
                        api.source     = pd
                            .ace
                            .beauIn
                            .getValue();
                        api.lang       = (pd.data.langvalue[0] !== "plain_text")
                            ? pd
                                .app
                                .langkey(false, pd.ace.beauIn, "")
                            : api.lang;
                        pd.data.source = api.source;
                        pd.data.diff   = "";
                        app            = application(api.lang);
                        if (app !== undefined) {
                            output = app(api);
                        }
                        execOutput();
                    }, 50);
                }
                if (api.mode === "minify") {
                    setTimeout(function dom__event_recycle_minifyPromise() {
                        api.source     = pd
                            .ace
                            .minnIn
                            .getValue();
                        api.lang       = (pd.data.langvalue[0] !== "plain_text")
                            ? pd
                                .app
                                .langkey(false, pd.ace.minnIn, "")
                            : api.lang;
                        pd.data.source = api.source;
                        pd.data.diff   = "";
                        app            = application(api.lang);
                        if (app !== undefined) {
                            output = app(api);
                        }
                        execOutput();
                    }, 50);
                }
                if (api.mode === "parse") {
                    setTimeout(function dom__event_recycle_parsePromise() {
                        api.source     = pd
                            .ace
                            .parsIn
                            .getValue();
                        api.lang       = (pd.data.langvalue[0] !== "plain_text")
                            ? pd
                                .app
                                .langkey(false, pd.ace.parsIn, "")
                            : api.lang;
                        pd.data.source = api.source;
                        pd.data.diff   = "";
                        app            = application(api.lang);
                        if (app !== undefined) {
                            output = app(api);
                        }
                        execOutput();
                    }, 50);
                }
            } else {
                pd.data.source = api.source;
                if (pd.data.langvalue[1] === "text") {
                    api.lang = "text";
                } else if (pd.data.langvalue[1] === "csv") {
                    api.lang = "csv";
                } else if (pd.test.ace === true) {
                    api.lang = pd
                        .app
                        .langkey(false, pd.ace.diffBase, "");
                } else {
                    api.lang = pd
                        .app
                        .langkey(false, {
                            value: api.source
                        }, "");
                }
                if (pd.data.mode === "diff") {
                    pd.data.diff = api.diff;
                } else {
                    pd.data.diff = "";
                }
                app = application(api.lang);
                if (app !== undefined) {
                    output = app(api);
                }
                execOutput();
            }
        }
    };

    // toggles an editor between 100% and 50% width if the output isn't textual
    // references apps: langkey, options references events: recycle
    pd.app.hideOutput   = function dom__app_hideOutput(x) {
        var node      = {},
            state     = false,
            targetOut = {},
            targetIn  = {},
            inprop    = "",
            restore   = function dom__app_hideOutput_restore() {
                targetOut.parentNode.style.display = "block";
                if (targetOut !== null) {
                    node             = targetIn.parentNode;
                    node.style.width = "49%";
                    if (pd.test.ace === true) {
                        pd
                            .ace[inprop]
                            .resize();
                    }
                    targetIn.onkeyup   = pd.event.recycle;
                    targetIn.onkeydown = function dom_app_hideOutput_restore_bindTargetInDown(e) {
                        var event = e || window.event;
                        if (pd.test.ace === false) {
                            pd
                                .event
                                .fixtabs(event, targetIn);
                        }
                        pd
                            .event
                            .keydown(event);
                        pd
                            .event
                            .recycle(event);
                    };
                }
                if (x === undefined) {
                    return;
                }
                pd
                    .app
                    .options(x);
            },
            langval   = (pd.data.node.lang === null)
                ? "javascript"
                : ((pd.data.node.lang.nodeName === "select")
                    ? pd.data.node.lang[pd.data.node.lang.selectedIndex].value
                    : pd.data.node.lang.value);
        if (x.nodeType === 1 && x.nodeName.toLowerCase() !== "input" && x !== pd.data.node.lang) {
            x = x.getElementsByTagName("input")[0];
        }
        state = (x === pd.data.node.jsscope || langval === "csv");
        if (pd.data.mode === "minn") {
            targetOut = pd.data.node.codeMinnOut;
            targetIn  = pd.data.node.codeMinnIn;
            inprop    = "minnIn";
        } else if (pd.data.mode === "pars") {
            targetOut = pd.data.node.codeParsOut;
            targetIn  = pd.data.node.codeParsIn;
            inprop    = "parsIn";
        } else {
            targetOut = pd.data.node.codeBeauOut;
            targetIn  = pd.data.node.codeBeauIn;
            inprop    = "beauIn";
        }
        if (targetOut === null || (state === true && targetOut.parentNode.style.display === "none") || (state === false && targetOut.parentNode.style.display === "block")) {
            if (pd.test.load === false) {
                pd
                    .app
                    .options(x);
            }
            return;
        }
        if (langval !== "csv" && pd.data.mode !== "beau") {
            state = false;
        }
        if (langval === "auto" || langval === "javascript" || langval === "csv") {
            if (state === true) {
                targetOut.parentNode.style.display = "none";
                if (targetIn !== null) {
                    node             = targetIn.parentNode;
                    node.style.width = "100%";
                    if (pd.test.ace === true) {
                        pd
                            .ace[inprop]
                            .resize();
                    }
                    if (pd.test.ace === true) {
                        targetIn.onkeyup = function dom__app_hideOutput_langkeyEditor(e) {
                            var event = e || window.event;
                            pd
                                .app
                                .langkey(false, pd.ace[inprop], "");
                            pd
                                .event
                                .recycle(event);
                        };
                    } else {
                        targetIn.onkeyup = function dom__app_hideOutput_langkeyTextarea(e) {
                            var event = e || window.event;
                            pd
                                .event
                                .recycle(event);
                        };
                    }
                }
                if (langval === "csv") {
                    x = pd.data.node.lang;
                }
                if (pd.test.load === false) {
                    pd
                        .app
                        .options(x);
                }
            } else if (x === pd.data.node.modeBeau) {
                restore();
            }
        } else if (x === pd.data.node.modeBeau) {
            restore();
        }
    };

    // provides interaction to simulate a text input into a radio buttonset with
    // appropriate accessibility response references app: options
    pd.app.indentchar   = function dom__app_indentchar(x) {
        var node      = {},
            quan      = {},
            beauChar  = pd.id("beau-char"),
            diffChar  = pd.id("diff-char"),
            beauOther = pd.id("beau-other"),
            diffOther = pd.id("diff-other");
        if (x.nodeType === 1) {
            if (x.nodeName.toLowerCase() === "input") {
                node = x;
            } else {
                node = x.getElementsByTagName("input")[0];
            }
        } else if (this.nodeName.toLowerCase() === "input") {
            node = this;
        } else {
            node = this.getElementsByTagName("input")[0];
        }
        if (pd.data.mode === "beau" && beauOther !== null && beauChar !== null) {
            if (node === beauOther || node === beauChar) {
                beauOther.checked = true;
                beauChar.setAttribute("class", "checked");
                if (beauChar.value === "Click me for custom input") {
                    beauChar.value = "";
                }
            } else {
                beauOther.checked = false;
                beauChar.setAttribute("class", "unchecked");
                if (beauChar.value === "") {
                    beauChar.value = "Click me for custom input";
                }
            }
        } else if (pd.data.mode === "diff" && diffOther !== null && diffChar !== null) {
            if (node === diffOther || node === diffChar) {
                diffOther.checked = true;
                diffChar.setAttribute("class", "checked");
                if (diffChar.value === "Click me for custom input") {
                    diffChar.value = "";
                }
            } else {
                diffOther.checked = false;
                diffChar.setAttribute("class", "unchecked");
                if (diffChar.value === "") {
                    diffChar.value = "Click me for custom input";
                }
            }
        }
        if (pd.test.ace === true) {
            if (pd.data.mode === "diff") {
                if (node === pd.id("diff-space")) {
                    pd
                        .ace
                        .diffBase
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .diffNew
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .minnIn
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .minnOut
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .parsIn
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .parsOut
                        .getSession()
                        .setUseSoftTabs(true);
                    quan = pd.id("diff-quan");
                    if (quan !== null && isNaN(Number(quan.value)) === false) {
                        pd
                            .ace
                            .diffBase
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .diffNew
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .minnIn
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .minnOut
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .parsIn
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .parsOut
                            .getSession()
                            .setTabSize(Number(node.value));
                    }
                } else {
                    pd
                        .ace
                        .diffBase
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .diffNew
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .minnIn
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .minnOut
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .parsIn
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .parsOut
                        .getSession()
                        .setUseSoftTabs(false);
                }
            }
            if (pd.data.mode === "beau") {
                if (node === pd.id("beau-space")) {
                    pd
                        .ace
                        .beauIn
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .beauOut
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .minnIn
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .minnOut
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .parsIn
                        .getSession()
                        .setUseSoftTabs(true);
                    pd
                        .ace
                        .parsOut
                        .getSession()
                        .setUseSoftTabs(true);
                    quan = pd.id("beau-quan");
                    if (quan !== null && isNaN(Number(quan.value)) === false) {
                        pd
                            .ace
                            .beauIn
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .beauOut
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .minnIn
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .minnOut
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .parsIn
                            .getSession()
                            .setTabSize(Number(node.value));
                        pd
                            .ace
                            .parsOut
                            .getSession()
                            .setTabSize(Number(node.value));
                    }
                } else {
                    pd
                        .ace
                        .beauIn
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .beauOut
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .minnIn
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .minnOut
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .parsIn
                        .getSession()
                        .setUseSoftTabs(false);
                    pd
                        .ace
                        .parsOut
                        .getSession()
                        .setUseSoftTabs(false);
                }
            }
        }
        if (pd.test.load === false) {
            if (node === beauChar) {
                pd
                    .app
                    .options(beauChar);
            } else if (node === diffChar) {
                pd
                    .app
                    .options(diffChar);
            } else {
                pd
                    .app
                    .options(node);
            }
        }
    };

    // provide a means for keyboard users to escape a textarea references events:
    // sequence
    pd.event.areaTabOut = function dom__event_areaTabOut(e, node) {
        var len   = pd.test.tabesc.length,
            esc   = false,
            key   = 0,
            event = e || window.event;
        node = node || this;
        key  = event.keyCode;
        if (key === 17 || key === 224) {
            if (pd.data.tabtrue === false && (pd.test.tabesc[0] === 17 || pd.test.tabesc[0] === 224 || len > 1)) {
                return;
            }
            pd.data.tabtrue = false;
        }
        if (node.nodeName.toLowerCase() === "textarea") {
            if (pd.test.ace === true) {
                if (node === pd.data.node.codeBeauOut || node === pd.data.node.codeMinnOut || node === pd.data.node.codeParsOut) {
                    esc = true;
                }
            }
            if (node === pd.data.node.codeDiffBase || node === pd.data.node.codeDiffNew || node === pd.data.node.codeBeauIn || node === pd.data.node.codeMinnIn || node === pd.data.node.codeParsIn) {
                esc = true;
            }
        }
        if (esc === true) {
            esc             = false;
            pd.data.tabtrue = false;
            if ((len === 1 && pd.test.tabesc[0] !== 16 && key !== pd.test.tabesc[0]) || (len === 2 && key !== pd.test.tabesc[1])) {
                pd.test.tabesc = [];
                return;
            }
            if (len === 0 && (key === 16 || key === 17 || key === 224)) {
                return pd
                    .test
                    .tabesc
                    .push(key);
            }
            if (len === 1 && (key === 17 || key === 224)) {
                if (pd.test.tabesc[0] === 17 || pd.test.tabesc[0] === 224) {
                    esc = true;
                } else {
                    return pd
                        .test
                        .tabesc
                        .push(key);
                }
            } else if (len === 2 && (key === 17 || key === 224)) {
                esc = true;
            } else if (len > 0) {
                pd.test.tabesc = [];
            }
            if (esc === true) {
                if (len === 2) {
                    //back tab

                    if (node === pd.data.node.codeDiffBase) {
                        pd
                            .id("diffbasefile")
                            .focus();
                    } else if (node === pd.data.node.codeDiffNew) {
                        pd
                            .id("diffnewfile")
                            .focus();
                    } else if (node === pd.data.node.codeBeauIn) {
                        pd
                            .id("beautyfile")
                            .focus();
                    } else if (node === pd.data.node.codeBeauOut) {
                        pd
                            .data
                            .node
                            .codeBeauIn
                            .focus();
                    } else if (node === pd.data.node.codeMinnIn) {
                        pd
                            .id("minifyfile")
                            .focus();
                    } else if (node === pd.data.node.codeMinnOut) {
                        pd
                            .data
                            .node
                            .codeMinnIn
                            .focus();
                    } else if (node === pd.data.node.codeParsIn) {
                        pd
                            .id("parsefile")
                            .focus();
                    } else if (node === pd.data.node.codeParsOut) {
                        pd
                            .data
                            .node
                            .codeParsIn
                            .focus();
                    }
                } else {
                    //forward tab

                    if (node === pd.data.node.codeDiffBase) {
                        pd
                            .id("newlabel")
                            .focus();
                    } else if (node === pd.data.node.codeDiffNew || node === pd.data.node.codeBeauOut || node === pd.data.node.codeMinnOut) {
                        pd
                            .id("button-primary")
                            .getElementsByTagName("button")[0]
                            .focus();
                    } else if (node === pd.data.node.codeBeauIn) {
                        pd
                            .data
                            .node
                            .codeBeauOut
                            .focus();
                    } else if (node === pd.data.node.codeMinnIn) {
                        pd
                            .data
                            .node
                            .codeMinnOut
                            .focus();
                    } else if (node === pd.data.node.codeParsIn) {
                        pd
                            .data
                            .node
                            .codeParsOut
                            .focus();
                    }
                }
                if (pd.test.tabesc[0] === 16) {
                    pd.test.tabesc = [16];
                } else {
                    pd.test.tabesc = [];
                }
            }
        }
        pd
            .event
            .sequence(event);
    };

    //read from files if the W3C File API is supported references events: recycle
    pd.event.file       = function dom__event_file() {
        var a         = 0,
            input     = this,
            id        = "",
            files     = [],
            reader    = {},
            fileStore = [],
            fileCount = 0,
            fileLoad  = function dom__event_file_init1() {
                return;
            },
            fileError = function dom__event_file_init2() {
                return;
            };
        if (input === null || typeof input !== "object" || input.nodeType > 1 || files === undefined || input.nodeType !== 1) {
            return;
        }
        id    = input.getAttribute("id");
        files = input.files;
        if (pd.test.fs === true && files[0] !== null && typeof files[0] === "object") {
            if (input.nodeName === "input") {
                input = input
                    .parentNode
                    .parentNode
                    .getElementsByTagName("textarea")[0];
            }
            fileLoad  = function dom__event_file_onload(e) {
                var event = e || window.event;
                fileStore.push(event.target.result);
                if (a === fileCount) {
                    if (pd.test.ace === true) {
                        if (id === "beautyfile") {
                            pd
                                .ace
                                .beauIn
                                .setValue(fileStore.join("\n\n"));
                            pd
                                .ace
                                .beauIn
                                .clearSelection();
                        } else if (id === "minifyfile") {
                            pd
                                .ace
                                .minnIn
                                .setValue(fileStore.join("\n\n"));
                            pd
                                .ace
                                .minnIn
                                .clearSelection();
                        } else if (id === "diffbasefile") {
                            pd
                                .ace
                                .diffBase
                                .setValue(fileStore.join("\n\n"));
                            pd
                                .ace
                                .diffBase
                                .clearSelection();
                        } else if (id === "diffnewfile") {
                            pd
                                .ace
                                .diffNew
                                .setValue(fileStore.join("\n\n"));
                            pd
                                .ace
                                .diffNew
                                .clearSelection();
                        }
                    } else {
                        if (id === "beautyfile") {
                            pd.data.node.codeBeauIn.value = fileStore.join("\n\n");
                        } else if (id === "minifyfile") {
                            pd.data.node.codeMinnIn.value = fileStore.join("\n\n");
                        } else if (id === "diffbasefile") {
                            pd.data.node.codeDiffBase.value = fileStore.join("\n\n");
                        } else if (id === "diffnewfile") {
                            pd.data.node.codeDiffNew.value = fileStore.join("\n\n");
                        }
                    }
                    if (pd.data.mode !== "diff") {
                        pd
                            .event
                            .recycle();
                    }
                }
            };
            fileError = function dom__event_file_onerror(e) {
                var event = e || window.event;
                input.value = "Error reading file:\n\nThis is the browser's descriptiong: " + event.target.error.name;
                fileCount   = -1;
            };
            fileCount = files.length;
            for (a = 0; a < fileCount; a += 1) {
                reader         = new FileReader();
                reader.onload  = fileLoad;
                reader.onerror = fileError;
                if (files[a] !== undefined) {
                    reader.readAsText(files[a], "UTF-8");
                }
            }
            if (pd.data.mode !== "diff") {
                pd
                    .event
                    .recycle();
            }
        }
    };

    //callback for filedrop event references events: file
    pd.event.filedrop   = function dom__event_filedrop(e) {
        var event = e || window.event;
        event.stopPropagation();
        event.preventDefault();
        pd
            .event
            .file();
    };

    //basic drag and drop for the report windows references events: minimize
    pd.event.grab       = function dom__event_grab(e, x) {
        var box        = (x.nodeName.toLowerCase() === "h3")
                ? x.parentNode
                : x.parentNode.parentNode,
            parent     = box.getElementsByTagName("p")[0],
            save       = (parent.innerHTML.indexOf("save") > -1),
            minifyTest = (parent.style.display === "none"),
            buttons    = box
                .getElementsByTagName("p")[0]
                .getElementsByTagName("button"),
            minButton  = (save === true)
                ? buttons[1]
                : buttons[0],
            resize     = (save === true)
                ? buttons[3]
                : buttons[2],
            body       = box.getElementsByTagName("div")[0],
            heading    = (box.firstChild.nodeType > 1)
                ? box.firstChild.nextSibling
                : box.firstChild,
            boxLeft    = box.offsetLeft,
            boxTop     = box.offsetTop,
            touchXNow  = 0,
            touchYNow  = 0,
            event      = e || window.event,
            touch      = (e !== null && e.type === "touchstart"),
            filled     = ((box === pd.data.node.report.stat.box && pd.test.filled.stat === true) || (box === pd.data.node.report.feed.box && pd.test.filled.feed === true) || (box === pd.data.node.report.code.box && pd.test.filled.code === true)),
            max        = document.getElementsByTagName("body")[0].clientHeight,
            drop       = function dom__event_grab_drop() {
                var headingWidth = box.getElementsByTagName("h3")[0].clientWidth;
                boxLeft = box.offsetLeft;
                boxTop  = box.offsetTop;
                if (touch === true) {
                    document.ontouchmove = null;
                    document.ontouchend  = null;
                } else {
                    document.onmousemove = null;
                    document.onmouseup   = null;
                }
                if (boxTop < 10) {
                    box.style.top = "1em";
                } else if (boxTop > (max - 40)) {
                    box.style.top = ((max / 10) - 4) + "em";
                } else {
                    box.style.top = (boxTop / 10) + "em";
                }
                if (boxLeft < ((headingWidth * -1) + 40)) {
                    box.style.left = (((headingWidth * -1) + 40) / 10) + "em";
                }
                body.style.opacity = "1";
                box.style.height   = "auto";
                heading.style.top  = "100%";
                resize.style.top   = "100%";
                pd
                    .app
                    .options(box);
                event.preventDefault();
                return false;
            },
            boxmove    = function dom__event_grab_boxmove(f) {
                f = f || window.event;
                f.preventDefault();
                box.style.right = "auto";
                if (touch === true) {
                    box.style.left      = ((boxLeft + (f.touches[0].clientX - touchXNow)) / 10) + "em";
                    box.style.top       = ((boxTop + (f.touches[0].clientY - touchYNow)) / 10) + "em";
                    document.ontouchend = drop;
                } else {
                    box.style.left     = ((boxLeft + (f.clientX - box.mouseX)) / 10) + "em";
                    box.style.top      = ((boxTop + (f.clientY - box.mouseY)) / 10) + "em";
                    document.onmouseup = drop;
                }
                return false;
            };
        e = e || window.event;
        if (minifyTest === true) {
            if (filled === true) {
                box.style.right = "auto";
            } else {
                box.style.left = "auto";
            }
            pd
                .event
                .minimize(e, 50, minButton);
            return false;
        }
        pd
            .app
            .zTop(box);
        if (e.preventDefault !== undefined) {
            e.preventDefault();
        }
        if (body.nodeType !== 1) {
            do {
                body = body.previousSibling;
            } while (body.nodeType !== 1);
        }
        if (heading.nodeType !== 1) {
            do {
                heading = heading.nextSibling;
            } while (heading.nodeType !== 1);
        }
        heading = heading.lastChild;
        if (heading.nodeType !== 1) {
            do {
                heading = heading.previousSibling;
            } while (heading.nodeType !== 1);
        }
        body.style.opacity = ".5";
        heading.style.top  = (box.clientHeight / 20) + "0em";
        box.style.height   = ".1em";
        resize.style.top   = ((Number(body.style.height.replace("em", "")) + 5.27) / 1.9925) + "em";
        box.mouseX         = e.clientX;
        box.mouseY         = e.clientY;
        if (touch === true) {
            touchXNow             = e.touches[0].clientX;
            touchYNow             = e.touches[0].clientY;
            document.ontouchmove  = boxmove;
            document.ontouchstart = null;
        } else {
            document.onmousemove = boxmove;
            document.onmousedown = null;
        }
        pd
            .app
            .options(box);
        return false;
    };

    //alter tool on page load in reflection to saved state
    load                = function dom__load() {
        var a               = 0,
            inputs          = [],
            inputsLen       = 0,
            id              = "",
            name            = "",
            type            = "",
            page            = (pd.data.node.page === null || pd.data.node.page === undefined || pd.data.node.page.getAttribute("id") === null)
                ? ""
                : pd
                    .data
                    .node
                    .page
                    .getAttribute("id"),
            node            = {},
            buttons         = {},
            title           = {},
            statdump        = [],
            thirdparty      = function dom__load_thirdparty() {
                var that = this,
                    href = that.getAttribute("href");
                window.open(href, "thirdparty");
                return false;
            },
            resize          = function dom__load_resize(e) {
                var that = this;
                pd
                    .event
                    .resize(e, that);
            },
            save            = function dom__load_save() {
                var that = this;
                pd
                    .event
                    .save(that);
            },
            grab            = function dom__load_grab(e) {
                var that = this;
                pd
                    .event
                    .grab(e, that);
            },
            top             = function dom__load_top() {
                var that = this;
                pd
                    .app
                    .zTop(that.parentNode);
            },
            backspace       = function dom__load_backspace(event) {
                var aa = event || window.event,
                    bb = aa.srcElement || aa.target;
                if (aa.keyCode === 8) {
                    if (bb.nodeName === "textarea" || (bb.nodeName === "input" && (bb.getAttribute("type") === "text" || bb.getAttribute("type") === "password"))) {
                        return true;
                    }
                    return false;
                }
                if (aa.type === "keydown") {
                    pd
                        .event
                        .sequence(aa);
                }
            },
            acedisable      = function dom__load_acedisable(x) {
                var el     = (typeof x === "object" && x.nodeType === 1)
                        ? x
                        : this,
                    addy   = "",
                    elId   = el.getAttribute("id"),
                    loc    = location
                        .href
                        .indexOf("ace=false"),
                    place  = [],
                    symbol = "?";
                pd
                    .app
                    .options(el);
                if (elId.indexOf("-yes") > 0 && loc > 0) {
                    place = location
                        .href
                        .split("ace=false");
                    if (place[1].indexOf("&") < 0 && place[1].indexOf("%26") < 0) {
                        place[0] = place[0].slice(0, place[0].length - 1);
                    }
                    location.href = place.join("");
                } else if (elId.indexOf("-no") > 0 && loc < 0) {
                    addy = location.href;
                    addy = addy.slice(0, addy.indexOf("#") + 1);
                    if (location.href.indexOf("?") < location.href.length - 1 && location.href.indexOf("?") > 0) {
                        symbol = "&";
                    }
                    location.href = addy + symbol + "ace=false";
                }
            },
            hideOutput      = function dom__load_hideOutput() {
                pd
                    .app
                    .hideOutput(this);
            },
            feedradio       = function dom__load_feedradio(e) {
                var event  = e || window.event,
                    item   = this.parentNode,
                    radio  = item.getElementsByTagName("input")[0],
                    radios = item
                        .parentNode
                        .getElementsByTagName("input"),
                    aa     = 0;
                for (aa = radios.length - 1; aa > -1; aa -= 1) {
                    radios[aa]
                        .parentNode
                        .removeAttribute("class");
                    radios[aa].checked = false;
                }
                radio.checked = true;
                radio.focus();
                item.setAttribute("class", "active-focus");
                event.preventDefault();
                return false;
            },
            feedblur        = function dom__load_feedblur() {
                var label = this.parentNode;
                label.setAttribute("class", "active");
            },
            textareafocus   = function dom__load_textareafocus() {
                var tabkey = pd.id("textareaTabKey"),
                    aria   = pd.id("arialive");
                if (tabkey === null) {
                    return;
                }
                tabkey.style.zIndex = pd.data.zIndex + 10;
                if (aria !== null) {
                    aria.innerHTML = tabkey.innerHTML;
                }
                if (pd.data.mode === "diff") {
                    tabkey.style.right = "51%";
                    tabkey.style.left  = "auto";
                } else {
                    tabkey.style.left  = "51%";
                    tabkey.style.right = "auto";
                }
                tabkey.style.display = "block";
                if (pd.test.ace === true) {
                    this
                        .parentNode
                        .setAttribute("class", this.parentNode.getAttribute("class") + " filefocus");
                }
            },
            textareablur    = function dom__load_textareablur() {
                var tabkey = pd.id("textareaTabKey");
                if (tabkey === null) {
                    return;
                }
                tabkey.style.display = "none";
                if (pd.test.ace === true) {
                    this
                        .parentNode
                        .setAttribute("class", this.parentNode.getAttribute("class").replace(" filefocus", ""));
                }
            },
            filefocus       = function dom__load_filefocus() {
                this.setAttribute("class", "filefocus");
            },
            fileblur        = function dom__load_fileblur() {
                this.removeAttribute("class");
            },
            savecheck       = function dom__load_savecheck() {
                var button = {};
                if (pd.data.node.report.code.box === null) {
                    return;
                }
                button = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("button")[0];
                if (button.getAttribute("class") !== "save") {
                    return;
                }
                if (this.checked === true) {
                    button.innerHTML = "H";
                } else {
                    button.innerHTML = "S";
                }
            },
            headerfocus     = function dom__load_headerfocus() {
                this.onclick = pd.event.minimize;
            },
            headerblur      = function dom__load_headerblur() {
                this.onclick = null;
            },
            checkForEdition = function dom__load_documentation_checkForEdition() {
                var target     = (page === "webtool")
                        ? pd.id("update")
                        : pd.id("components"),
                    outputTool = function dom__load_documentation_checkForEdition_outputTool() {
                        var str   = String(global.edition.latest),
                            list  = [
                                str.charAt(0) + str.charAt(1),
                                Number(str.charAt(2) + str.charAt(3)),
                                str.charAt(4) + str.charAt(5)
                            ],
                            month = [
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
                        list[1] -= 1;
                        if (list[2].charAt(0) === "0") {
                            list[2] = list[2].substr(1);
                        }
                        return "Updated: " + list[2] + " " + month[list[1]] + " 20" + list[0] + "<span>Version: <span>" + global.edition.version + "</span></span>";
                    },
                    outputDoc  = function dom__load_documentation_checkForEdition_outputDoc() {
                        var b          = 0,
                            date       = 0,
                            row        = [],
                            rowLen     = 0,
                            dateCell   = {},
                            dateList   = [],
                            lib        = "",
                            output     = [],
                            conversion = function dom__load_documentation_checkForEdition_outputDoc_conversion(dateInstance) {
                                var str   = String(dateInstance),
                                    list  = [
                                        str.charAt(0) + str.charAt(1),
                                        Number(str.charAt(2) + str.charAt(3)),
                                        str.charAt(4) + str.charAt(5)
                                    ],
                                    month = [
                                        "Jan",
                                        "Feb",
                                        "Mar",
                                        "Apr",
                                        "May",
                                        "Jun",
                                        "Jul",
                                        "Aug",
                                        "Sep",
                                        "Oct",
                                        "Nov",
                                        "Dec"
                                    ];
                                list[1] -= 1;
                                return list[2] + " " + month[list[1]] + " 20" + list[0];
                            };
                        dateList = target.getElementsByTagName("tfoot");
                        if (dateList[0] !== undefined) {
                            dateCell           = dateList[0].getElementsByTagName("td")[0];
                            dateCell.innerHTML = global.edition.version;
                        }
                        target   = target.getElementsByTagName("tbody")[0];
                        row      = target.getElementsByTagName("tr");
                        rowLen   = row.length;
                        dateList = [];
                        for (b = 0; b < rowLen; b += 1) {
                            dateCell = row[b].getElementsByTagName("td")[3];
                            lib      = row[b].getElementsByTagName("a")[0].innerHTML;
                            if (lib === "csspretty.js") {
                                date               = global.edition.csspretty;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "csvpretty.js") {
                                date               = global.edition.csvpretty;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "diffview.css") {
                                date               = global.edition.css;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "diffview.js") {
                                date               = global.edition.diffview;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "documentation.xhtml") {
                                date               = global.edition.documentation;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "dom.js") {
                                date               = global.edition.api.dom;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "jspretty.js") {
                                date               = global.edition.jspretty;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "lint.js") {
                                date               = global.edition.lint;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "markuppretty.js") {
                                date               = global.edition.markuppretty;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "node-local.js") {
                                date               = global.edition.api.nodeLocal;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "prettydiff.com.xhtml") {
                                date               = global.edition.webtool;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "prettydiff.js") {
                                date               = global.edition.prettydiff;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "prettydiff.wsf") {
                                date               = global.edition.api.wsh;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "safeSort.js") {
                                date               = global.edition.safeSort;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            } else if (lib === "ace") {
                                date               = global.edition.addon.ace;
                                dateCell.innerHTML = conversion(date);
                                dateList.push([date, row[b].innerHTML]);
                            }
                        }
                        rowLen   = dateList.length;
                        dateList = dateList.sort(function dom__load_documentation_sortForward(target, row) {
                            return target[1] === row[1];
                        })
                            .reverse()
                            .sort(function dom__load_documentation_sortReverse(target, row) {
                                return target[0] - row[0];
                            });
                        for (b = dateList.length - 1; b > -1; b -= 1) {
                            output.push("<tr>");
                            output.push(dateList[b][1]);
                            output.push("</tr>");
                        }
                        target.innerHTML = output.join("");
                    },
                    delay      = function dom__load_documentation_checkForEdition_delay() {
                        if (global.edition === undefined) {
                            setTimeout(dom__load_documentation_checkForEdition_delay, 100);
                        } else {
                            if (target !== null && typeof global.edition === "object") {
                                if (page === "webtool") {
                                    target.innerHTML = outputTool();
                                } else {
                                    outputDoc();
                                }
                            }
                        }
                    };
                delay();
            };
        if (page === "webtool") {
            if (typeof safeSort === "function") {
                global.safeSort = safeSort;
            }
            if (typeof csspretty === "function") {
                global.csspretty = csspretty;
            }
            if (typeof csvpretty === "function") {
                global.csvpretty = csvpretty;
            }
            if (typeof diffview === "function") {
                global.diffview = diffview;
            }
            if (typeof jspretty === "function") {
                global.jspretty = jspretty;
            }
            if (typeof markuppretty === "function") {
                global.markuppretty = markuppretty;
            }
            pd.data.node.report.feed.body = (pd.data.node.report.feed.box === null)
                ? null
                : pd
                    .data
                    .node
                    .report
                    .feed
                    .box
                    .getElementsByTagName("div")[0];
            pd.data.node.report.code.body = (pd.data.node.report.code.box === null)
                ? null
                : pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("div")[0];
            pd.data.node.report.stat.body = (pd.data.node.report.stat.box === null)
                ? null
                : pd
                    .data
                    .node
                    .report
                    .stat
                    .box
                    .getElementsByTagName("div")[0];

            if (pd.test.ace === true) {
                if (pd.data.node.codeDiffBase !== null) {
                    pd.ace.diffBase = pd
                        .app
                        .aceApply("codeDiffBase", "input", true);
                }
                if (pd.data.node.codeDiffNew !== null) {
                    pd.ace.diffNew = pd
                        .app
                        .aceApply("codeDiffNew", "input", true);
                }
                if (pd.data.node.codeBeauIn !== null) {
                    pd.ace.beauIn = pd
                        .app
                        .aceApply("codeBeauIn", "input", false);
                }
                if (pd.data.node.codeBeauOut !== null) {
                    pd.ace.beauOut = pd
                        .app
                        .aceApply("codeBeauOut", "output", false);
                    pd
                        .ace
                        .beauOut
                        .setReadOnly(true);
                }
                if (pd.data.node.codeMinnIn !== null) {
                    pd.ace.minnIn = pd
                        .app
                        .aceApply("codeMinnIn", "input", false);
                }
                if (pd.data.node.codeMinnOut !== null) {
                    pd.ace.minnOut = pd
                        .app
                        .aceApply("codeMinnOut", "output", false);
                    pd
                        .ace
                        .minnOut
                        .setReadOnly(true);
                }
                if (pd.data.node.codeParsIn !== null) {
                    pd.ace.parsIn = pd
                        .app
                        .aceApply("codeParsIn", "input", false);
                }
                if (pd.data.node.codeParsOut !== null) {
                    pd.ace.parsOut = pd
                        .app
                        .aceApply("codeParsOut", "output", false);
                    pd
                        .ace
                        .parsOut
                        .setReadOnly(true);
                }
            }

            pd
                .app
                .fixHeight();
            if (pd.data.node.announce !== null) {
                pd.data.announcetext = pd.data.node.announce.innerHTML;
            }
            node = pd.id("hideOptions");
            if (pd.id("option_commentClear") !== null) {
                pd
                    .id("option_commentClear")
                    .onclick = pd.event.clearComment;
            }
            pd.data.settings.feedreport       = {};
            pd.data.settings.codereport       = {};
            pd.data.settings.statreport       = {};
            pd.data.settings.feedback         = {};
            pd.data.settings.feedback.newb    = false;
            pd.data.settings.feedback.veteran = false;
            pd.data.settings.knownname        = "\"" + Math
                .random()
                .toString()
                .slice(2) + Math
                .random()
                .toString()
                .slice(2) + "\"";
            pd.keypress                       = {
                date    : {},
                keys    : [],
                state   : false,
                throttle: 0
            };
            if (pd.test.fs === false) {
                node = pd.id("diffbasefile");
                if (node !== null) {
                    node.disabled = true;
                }
                node = pd.id("diffnewfile");
                if (node !== null) {
                    node.disabled = true;
                }
                node = pd.id("beautyfile");
                if (node !== null) {
                    node.disabled = true;
                }
                node = pd.id("minifyfile");
                if (node !== null) {
                    node.disabled = true;
                }
            }
            if (pd.test.ls === true) {
                if (localStorage.webtool !== undefined) {
                    delete localStorage.webtool;
                    delete localStorage.optionString;
                }
                if (localStorage.bl !== undefined) {
                    delete localStorage.bl;
                }
                if (localStorage.nl !== undefined) {
                    delete localStorage.nl;
                }
                if (localStorage.bo !== undefined) {
                    name = localStorage.bo;
                    delete localStorage.bo;
                    localStorage.codeDiffBase = name;
                }
                if (localStorage.nx !== undefined) {
                    name = localStorage.nx;
                    delete localStorage.nx;
                    localStorage.codeDiffNew = name;
                }
                if (localStorage.bi !== undefined) {
                    name = localStorage.bi;
                    delete localStorage.bi;
                    localStorage.codeBeautify = name;
                }
                if (localStorage.mi !== undefined) {
                    name = localStorage.mi;
                    delete localStorage.mi;
                    localStorage.codeMinify = name;
                }
                if (localStorage.statdata !== undefined) {
                    delete localStorage.statdata;
                }
                if (pd.data.stat.fdate === 0) {
                    pd.data.stat.fdate = Date.now();
                }
                if (pd.test.json === true) {
                    if (localStorage.commentString !== undefined && localStorage.commentString !== null && localStorage.commentString !== "") {
                        pd.data.commentString = JSON.parse(localStorage.commentString.replace(/api\./g, ""));
                    }
                    if (localStorage.settings !== undefined && localStorage.settings !== null) {
                        if (localStorage.settings.indexOf(":undefined") > 0) {
                            localStorage.settings = localStorage
                                .settings
                                .replace(/:undefined/g, ":false");
                        }
                        pd.data.settings = JSON.parse(localStorage.settings);
                        if (pd.data.settings.knownname === undefined || typeof pd.data.settings.knownname === "number") {
                            pd.data.settings.knownname = "\"" + Math
                                .random()
                                .toString()
                                .slice(2) + Math
                                .random()
                                .toString()
                                .slice(2) + "\"";
                            localStorage.settings      = JSON.stringify(pd.data.settings);
                        }
                        if (pd.data.settings.diffreport !== undefined) {
                            delete pd.data.settings.diffreport;
                            delete pd.data.settings.beaureport;
                            delete pd.data.settings.minnreport;
                            pd.data.settings.feedreport = {};
                            pd.data.settings.codereport = {};
                        }
                    } else if (pd.data.settings.knownname === undefined || typeof pd.data.settings.knownname === "number") {
                        pd.data.settings.knownname = "\"" + Math
                            .random()
                            .toString()
                            .slice(2) + Math
                            .random()
                            .toString()
                            .slice(2) + "\"";
                        localStorage.settings      = JSON.stringify(pd.data.settings);
                    }
                    if (localStorage.stat !== undefined) {
                        if (statdump.length === 0) {
                            pd.data.stat       = JSON.parse(localStorage.stat);
                            pd.data.stat.visit = Number(pd.data.stat.visit) + 1;
                            if (typeof pd.data.stat.fdate === "string") {
                                pd.data.stat.fdate = Date.parse(pd.data.stat.fdate);
                            }
                            if (pd.data.stat.fdate === 0 || pd.data.stat.fdate === null || isNaN(pd.data.stat.fdate) === true) {
                                pd.data.stat.fdate = Date.now();
                            }
                            a = (Date.now() - pd.data.stat.fdate) / 86400000;
                            if (a < 1) {
                                a = 1;
                            }
                            pd.data.stat.avday  = Math.round(pd.data.stat.visit / a);
                            pd.data.stat.useday = Math.round(pd.data.stat.usage / a);
                        }
                        node = pd.id("stvisit");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.visit;
                        }
                        node = pd.id("stusage");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.usage;
                        }
                        node = pd.id("stuseday");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.useday;
                        }
                        node = pd.id("stfdate");
                        if (node !== null) {
                            node.innerHTML = new Date(pd.data.stat.fdate).toLocaleDateString();
                        }
                        node = pd.id("stavday");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.avday;
                        }
                        node = pd.id("stlarge");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.large;
                        }
                        node = pd.id("stdiff");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.diff;
                        }
                        node = pd.id("stbeau");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.beau;
                        }
                        node = pd.id("stminn");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.minn;
                        }
                        node = pd.id("stpars");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.pars;
                        }
                        node = pd.id("stmarkup");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.markup;
                        }
                        node = pd.id("stjs");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.js;
                        }
                        node = pd.id("stcss");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.css;
                        }
                        node = pd.id("stcsv");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.csv;
                        }
                        node = pd.id("sttext");
                        if (node !== null) {
                            node.innerHTML = pd.data.stat.text;
                        }
                    }
                    localStorage.stat = JSON.stringify(pd.data.stat);
                }
                if (statdump.length > 0) {
                    delete localStorage.statdata;
                }
            }
            if (pd.test.agent.indexOf("webkit") > 0 || pd.test.agent.indexOf("blink") > 0) {
                inputs    = document.getElementsByTagName("textarea");
                inputsLen = inputs.length;
                for (a = 0; a < inputsLen; a += 1) {
                    inputs[a].removeAttribute("wrap");
                }
            }
            if (pd.test.domain === false) {
                pd.data.node.report.feed.box.style.display = "none";
            } else if (pd.data.node.report.feed.box !== null) {
                if (pd.test.fs === true) {
                    pd.data.node.report.feed.box.ondragover  = pd.event.filenull;
                    pd.data.node.report.feed.box.ondragleave = pd.event.filenull;
                    pd.data.node.report.feed.box.ondrop      = pd.event.filedrop;
                }
                pd.data.node.report.feed.body.onmousedown = top;
                title                                     = pd
                    .data
                    .node
                    .report
                    .feed
                    .box
                    .getElementsByTagName("h3")[0]
                    .getElementsByTagName("button")[0];
                title.onmousedown                         = grab;
                title.ontouchstart                        = grab;
                title.onfocus                             = headerfocus;
                title.onblur                              = headerblur;
                if (pd.data.settings.feedreport === undefined) {
                    pd.data.settings.feedreport = {};
                }
                if (pd.data.settings.feedreport !== undefined && pd.data.settings.feedreport.min === false) {
                    buttons               = pd
                        .data
                        .node
                        .report
                        .feed
                        .box
                        .getElementsByTagName("p")[0];
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            title.parentNode.style.width = ((pd.data.settings.feedreport.width / 10) - 8.15) + "em";
                        } else {
                            title.parentNode.style.width = ((pd.data.settings.feedreport.width / 10) - 9.75) + "em";
                        }
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            title.parentNode.style.width = ((pd.data.settings.feedreport.width / 10) - 5.15) + "em";
                        } else {
                            title.parentNode.style.width = ((pd.data.settings.feedreport.width / 10) - 6.75) + "em";
                        }
                    }
                    if (pd.data.settings.feedreport.top < 15) {
                        pd.data.settings.feedreport.top = 15;
                    }
                    pd.data.node.report.feed.box.style.right    = "auto";
                    pd.data.node.report.feed.box.style.left     = (pd.data.settings.feedreport.left / 10) + "em";
                    pd.data.node.report.feed.box.style.top      = (pd.data.settings.feedreport.top / 10) + "em";
                    pd.data.node.report.feed.body.style.width   = (pd.data.settings.feedreport.width / 10) + "em";
                    pd.data.node.report.feed.body.style.height  = (pd.data.settings.feedreport.height / 10) + "em";
                    pd.data.node.report.feed.body.style.display = "block";
                }
                pd
                    .id("feedsubmit")
                    .onclick = pd.event.feedsubmit;
            }
            if (pd.data.node.report.code.box !== null) {
                if (pd.test.fs === true) {
                    pd.data.node.report.code.box.ondragover  = pd.event.filenull;
                    pd.data.node.report.code.box.ondragleave = pd.event.filenull;
                    pd.data.node.report.code.box.ondrop      = pd.event.filedrop;
                }
                pd.data.node.report.code.body.onmousedown = top;
                title                                     = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("h3")[0]
                    .getElementsByTagName("button")[0];
                title.onmousedown                         = grab;
                title.ontouchstart                        = grab;
                title.onfocus                             = headerfocus;
                title.onblur                              = headerblur;
                buttons                                   = pd
                    .data
                    .node
                    .report
                    .code
                    .box
                    .getElementsByTagName("p")[0];
                node                                      = pd.id("jsscope-yes");
                if (node !== null && node.checked === true && buttons.innerHTML.indexOf("save") < 0) {
                    if (pd.test.agent.indexOf("firefox") > 0 || pd.test.agent.indexOf("presto") > 0) {
                        node = document.createElement("a");
                        node.setAttribute("href", "#");
                        node.onclick   = save;
                        node.innerHTML = "<button class='save' title='Convert report to text that can be saved.' tabindex=" +
                                             "'-1'>S</button>";
                        buttons.insertBefore(node, buttons.firstChild);
                    } else {
                        node = document.createElement("button");
                        node.setAttribute("class", "save");
                        node.setAttribute("title", "Convert report to text that can be saved.");
                        node.innerHTML = "S";
                        buttons.insertBefore(node, buttons.firstChild);
                    }
                }
                if (pd.data.settings.codereport !== undefined && pd.data.settings.codereport.min === false) {
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            title.parentNode.style.width = ((pd.data.settings.codereport.width / 10) - 8.15) + "em";
                        } else {
                            title.parentNode.style.width = ((pd.data.settings.codereport.width / 10) - 9.75) + "em";
                        }
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            title.parentNode.style.width = ((pd.data.settings.codereport.width / 10) - 5.15) + "em";
                        } else {
                            title.parentNode.style.width = ((pd.data.settings.codereport.width / 10) - 6.75) + "em";
                        }
                    }
                    if (pd.data.settings.codereport.top < 15) {
                        pd.data.settings.codereport.top = 15;
                    }
                    pd.data.node.report.code.box.style.right    = "auto";
                    pd.data.node.report.code.box.style.left     = (pd.data.settings.codereport.left / 10) + "em";
                    pd.data.node.report.code.box.style.top      = (pd.data.settings.codereport.top / 10) + "em";
                    pd.data.node.report.code.body.style.width   = (pd.data.settings.codereport.width / 10) + "em";
                    pd.data.node.report.code.body.style.height  = (pd.data.settings.codereport.height / 10) + "em";
                    pd.data.node.report.code.body.style.display = "block";
                }
            }
            if (pd.data.node.report.stat.box !== null) {
                if (pd.test.fs === true) {
                    pd.data.node.report.stat.box.ondragover  = pd.event.filenull;
                    pd.data.node.report.stat.box.ondragleave = pd.event.filenull;
                    pd.data.node.report.stat.box.ondrop      = pd.event.filedrop;
                }
                pd.data.node.report.stat.body.onmousedown = top;
                title                                     = pd
                    .data
                    .node
                    .report
                    .stat
                    .box
                    .getElementsByTagName("h3")[0]
                    .getElementsByTagName("button")[0];
                title.onmousedown                         = grab;
                title.ontouchstart                        = grab;
                title.onfocus                             = headerfocus;
                title.onblur                              = headerblur;
                if (pd.data.settings.statreport !== undefined && pd.data.settings.statreport.min === false) {
                    buttons               = pd
                        .data
                        .node
                        .report
                        .stat
                        .box
                        .getElementsByTagName("p")[0];
                    buttons.style.display = "block";
                    title.style.cursor    = "move";
                    if (buttons.innerHTML.indexOf("save") > 0) {
                        buttons.getElementsByTagName("button")[1].innerHTML = "\u035f";
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            title.parentNode.style.width = ((pd.data.settings.statreport.width / 10) - 8.15) + "em";
                        } else {
                            title.parentNode.style.width = ((pd.data.settings.statreport.width / 10) - 6.75) + "em";
                        }
                    } else {
                        buttons.getElementsByTagName("button")[0].innerHTML = "\u035f";
                        if (pd.test.agent.indexOf("macintosh") > 0) {
                            title.parentNode.style.width = ((pd.data.settings.statreport.width / 10) - 5.15) + "em";
                        } else {
                            title.parentNode.style.width = ((pd.data.settings.statreport.width / 10) - 6.75) + "em";
                        }
                    }
                    if (pd.data.settings.statreport.top < 15) {
                        pd.data.settings.statreport.top = 15;
                    }
                    pd.data.node.report.stat.box.style.right    = "auto";
                    pd.data.node.report.stat.box.style.left     = (pd.data.settings.statreport.left / 10) + "em";
                    pd.data.node.report.stat.box.style.top      = (pd.data.settings.statreport.top / 10) + "em";
                    pd.data.node.report.stat.body.style.width   = (pd.data.settings.statreport.width / 10) + "em";
                    pd.data.node.report.stat.body.style.height  = (pd.data.settings.statreport.height / 10) + "em";
                    pd.data.node.report.stat.body.style.display = "block";
                }
            }
            inputs    = document.getElementsByTagName("input");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                type = inputs[a].getAttribute("type");
                id   = inputs[a].getAttribute("id");
                if (type === "radio") {
                    name = inputs[a].getAttribute("name");
                    if (id === pd.data.settings[name]) {
                        inputs[a].checked = true;
                        if (name === "beauchar" || name === "diffchar") {
                            pd
                                .app
                                .indentchar(inputs[a]);
                        }
                    }
                    if (id.indexOf("feedradio") === 0) {
                        inputs[a].onfocus = feedradio;
                        inputs[a].onblur  = feedblur;
                        inputs[a].onclick = feedradio;
                        inputs[a]
                            .parentNode
                            .getElementsByTagName("label")[0]
                            .onclick = feedradio;
                    }
                    if (name === "mode") {
                        inputs[a].onclick = pd.event.modeToggle;
                        if (pd.data.settings.mode === id) {
                            pd
                                .event
                                .modeToggle(inputs[a]);
                        } else if (pd.data.settings.mode === undefined) {
                            pd
                                .event
                                .modeToggle(pd.data.node.modeDiff);
                        }
                    } else if (name === "diffchar") {
                        inputs[a].onclick = pd.app.indentchar;
                        if (pd.data.settings.diffchar === inputs[a].getAttribute("id")) {
                            inputs[a].checked = true;
                            inputs[a].click();
                        } else if (pd.data.settings.diffchar !== undefined && pd.data.settings.diffchar !== "diff-space" && pd.data.settings.diffchar !== "diff-tab" && pd.data.settings.diffchar !== "diff-line") {
                            node = pd.id("diff-char");
                            if (node !== null) {
                                node.value = pd.data.settings.diffchar;
                            }
                            node = pd.id("diff-other");
                            if (node !== null) {
                                node.checked = true;
                                node.click();
                            }
                        }
                    } else if (name === "beauchar") {
                        inputs[a].onclick = pd.app.indentchar;
                        if (pd.data.settings.beauchar === inputs[a].getAttribute("id")) {
                            inputs[a].checked = true;
                            inputs[a].click();
                        } else if (pd.data.settings.beauchar !== undefined && pd.data.settings.beauchar !== "beau-space" && pd.data.settings.beauchar !== "beau-tab" && pd.data.settings.beauchar !== "beau-line") {
                            node = pd.id("beau-char");
                            if (node !== null) {
                                node.value = pd.data.settings.beauchar;
                            }
                            node = pd.id("beau-other");
                            if (node !== null) {
                                node.checked = true;
                                node.click();
                            }
                        }
                    } else if (name === "jsscope") {
                        inputs[a].onclick = hideOutput;
                        if (id === "jsscope-yes" && inputs[a].checked === true) {
                            pd
                                .app
                                .hideOutput(inputs[a]);
                        }
                    } else if (name === "ace-radio") {
                        if (id === "ace-no" && inputs[a].checked === true && pd.test.ace === true) {
                            acedisable(inputs[a]);
                        }
                        if (id === "ace-yes" && inputs[a].checked === true && pd.test.ace === false) {
                            pd
                                .id("ace-no")
                                .checked = true;
                        }
                        inputs[a].onclick = acedisable;
                    } else {
                        inputs[a].onclick = pd.app.options;
                    }
                } else if (type === "text") {
                    if (pd.test.ace === true && (id === "diff-quan" || id === "beau-quan" || id === "minn-quan")) {
                        inputs[a].onkeyup = pd.app.insize;
                        if (pd.data.settings[id] !== undefined && pd.data.settings[id] !== "4" && isNaN(pd.data.settings[id]) === false) {
                            if (id === "diff-quan") {
                                if (pd.data.node.codeDiffBase !== null) {
                                    pd
                                        .ace
                                        .diffBase
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                                if (pd.data.node.codeDiffNew !== null) {
                                    pd
                                        .ace
                                        .diffNew
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                            } else if (id === "beau-quan") {
                                if (pd.data.node.codeBeauIn !== null) {
                                    pd
                                        .ace
                                        .beauIn
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                                if (pd.data.node.codeBeauOut !== null) {
                                    pd
                                        .ace
                                        .beauOut
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                            } else if (id === "minn-quan") {
                                if (pd.data.node.codeMinnIn !== null) {
                                    pd
                                        .ace
                                        .minnIn
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                                if (pd.data.node.codeMinnOut !== null) {
                                    pd
                                        .ace
                                        .minnOut
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                            } else if (id === "pars-quan") {
                                if (pd.data.node.codeParsIn !== null) {
                                    pd
                                        .ace
                                        .parsIn
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                                if (pd.data.node.codeParsOut !== null) {
                                    pd
                                        .ace
                                        .parsOut
                                        .getSession()
                                        .setTabSize(Number(pd.data.settings[id]));
                                }
                            }
                        }
                    } else {
                        inputs[a].onkeyup = pd.app.options;
                    }
                    if (pd.data.settings[id] !== undefined) {
                        inputs[a].value = pd.data.settings[id];
                    }
                    if (id === "diff-char" || id === "beau-char") {
                        inputs[a].onclick = pd.app.indentchar;
                    }
                } else if (type === "file") {
                    inputs[a].onchange = pd.event.file;
                    inputs[a].onfocus  = filefocus;
                    inputs[a].onblur   = fileblur;
                }
            }
            node = pd.id("ace-no");
            if (pd.test.ace === false && node !== null && node.checked === false) {
                node.checked = true;
            }
            inputs    = document.getElementsByTagName("select");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                id = inputs[a].getAttribute("id");
                if (id === "colorScheme") {
                    inputs[a].onchange = pd.event.colorScheme;
                    if (pd.data.settings.colorScheme !== undefined) {
                        inputs[a].selectedIndex = Number(pd.data.settings.colorScheme);
                        pd
                            .event
                            .colorScheme(inputs[a]);
                    }
                } else if (id === "language") {
                    inputs[a].onchange = pd.event.langOps;
                    if (pd.data.settings.language !== undefined) {
                        inputs[a].selectedIndex = Number(pd.data.settings.language);
                        if (pd.data.node.lang[pd.data.node.lang.selectedIndex].value === "text" && pd.data.mode !== "diff") {
                            inputs[a].selectedIndex = 0;
                        }
                        if (pd.data.node.lang[pd.data.node.lang.selectedIndex].value === "csv" && pd.data.mode !== "diff") {
                            pd
                                .app
                                .hideOutput(inputs[a]);
                        }
                    }
                } else {
                    if (typeof pd.data.settings[id] === "number") {
                        inputs[a].selectedIndex = pd.data.settings[id];
                    }
                    inputs[a].onchange = pd.app.options;
                }
            }
            inputs    = document.getElementsByTagName("button");
            inputsLen = inputs.length;
            for (a = 0; a < inputsLen; a += 1) {
                name = inputs[a].getAttribute("class");
                id   = inputs[a].getAttribute("id");
                if (name === null) {
                    if (inputs[a].value === "Execute") {
                        inputs[a].onclick = pd.event.recycle;
                    } else if (id === "resetOptions") {
                        inputs[a].onclick = pd.event.reset;
                    }
                } else if (name === "minimize") {
                    inputs[a].onclick = pd.event.minimize;
                } else if (name === "maximize") {
                    inputs[a].onclick = pd.event.maximize;
                    if (pd.data.settings[
                        inputs[a]
                            .parentNode
                            .parentNode
                            .getAttribute("id")
                    ] !== undefined && pd.data.settings[
                        inputs[a]
                            .parentNode
                            .parentNode
                            .getAttribute("id")
                    ].max === true) {
                        inputs[a].click();
                    }
                } else if (name === "resize") {
                    inputs[a].onmousedown = resize;
                } else if (name === "save") {
                    node  = inputs[a];
                    title = inputs[a].parentNode;
                    if (title.nodeName.toLowerCase() === "a") {
                        if (pd.test.agent.indexOf("firefox") < 0 && pd.test.agent.indexOf("presto") < 0) {
                            buttons      = title.parentNode;
                            node.onclick = save;
                            title.removeChild(node);
                            buttons.removeChild(title);
                            buttons.insertBefore(node, buttons.firstChild);
                            inputs[a].removeAttribute("tabindex");
                        } else {
                            title.onclick = save;
                        }
                    } else {
                        node.onclick = save;
                    }
                }
            }
            if (pd.data.node.save !== null) {
                pd.data.node.save.onclick = savecheck;
            }
            node = pd.id("thirdparties");
            if (node !== null) {
                inputs    = node.getElementsByTagName("a");
                inputsLen = inputs.length;
                for (a = 0; a < inputsLen; a += 1) {
                    inputs[a].onclick = thirdparty;
                }
            }
            if (pd.data.node.comment !== null) {
                if (pd.data.commentString.length === 0) {
                    pd.data.node.comment.innerHTML = "/*prettydiff.com */";
                } else if (pd.data.commentString.length === 1) {
                    pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                        .data
                        .commentString[0]
                        .replace("api.", "") + " */";
                } else {
                    pd.data.node.comment.innerHTML = "/*prettydiff.com " + pd
                        .data
                        .commentString
                        .join(", ")
                        .replace(/api\./g, "") + " */";
                }
            }
            node = pd.id("button-primary");
            if (node !== null) {
                node.onmouseover = pd.comment;
            }
            node = pd.id("feedsubmit");
            if (node !== null) {
                node.onclick = pd.event.feedsubmit;
            }
            if (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1) {
                (function dom__load_queryString() {
                    var b        = 0,
                        c        = 0,
                        color    = pd.id("colorScheme"),
                        colors   = (color !== null)
                            ? color.getElementsByTagName("option")
                            : [],
                        options  = (pd.data.node.lang !== null)
                            ? pd
                                .data
                                .node
                                .lang
                                .getElementsByTagName("option")
                            : [],
                        params   = location
                            .href
                            .split("?")[1]
                            .split("&"),
                        paramLen = params.length,
                        value    = "",
                        source   = "",
                        diff     = "";
                    for (b = 0; b < paramLen; b += 1) {
                        if (params[b].indexOf("m=") === 0) {
                            value = params[b]
                                .toLowerCase()
                                .substr(2);
                            if (value === "beautify" && pd.data.node.modeBeau !== null) {
                                pd
                                    .event
                                    .modeToggle(pd.data.node.modeBeau);
                                pd.data.node.modeBeau.checked = true;
                            } else if (value === "minify" && pd.data.node.modeMinn !== null) {
                                pd
                                    .event
                                    .modeToggle(pd.data.node.modeMinn);
                                pd.data.node.modeMinn.checked = true;
                            } else if (value === "diff" && pd.data.node.modeDiff !== null) {
                                pd
                                    .event
                                    .modeToggle(pd.data.node.modeDiff);
                                pd.data.node.modeDiff.checked = true;
                            } else if (value === "parse" && pd.data.node.modePars !== null) {
                                pd
                                    .event
                                    .modeToggle(pd.data.node.modePars);
                                pd.data.node.modePars.checked = true;
                            }
                        } else if (params[b].indexOf("s=") === 0) {
                            source = params[b].substr(2);
                        } else if (params[b].indexOf("d=") === 0 && pd.data.node.codeDiffNew !== null) {
                            diff = params[b].substr(2);
                            if (pd.data.node.codeDiffNew !== null) {
                                if (pd.test.ace === true) {
                                    pd
                                        .ace
                                        .diffNew
                                        .setValue(diff);
                                    pd
                                        .ace
                                        .diffNew
                                        .clearSelection();
                                } else {
                                    pd.data.node.codeDiffNew.value = diff;
                                }
                            }
                        } else if (params[b].indexOf("l=") === 0 && pd.data.node.lang !== null) {
                            value = params[b]
                                .toLowerCase()
                                .substr(2);
                            if (value === "text" || value === "plain" || value === "plaintext") {
                                value = "text";
                                pd
                                    .event
                                    .modeToggle(pd.data.node.modeDiff);
                            } else if (value === "js" || value === "") {
                                value = "javascript";
                            } else if (value === "markup") {
                                value = "xml";
                            } else if (value === "jstl") {
                                value = "jsp";
                            } else if (value === "erb" || value === "ejs") {
                                value = "html_ruby";
                            } else if (value === "tss" || value === "titanium") {
                                value = "tss";
                            }
                            for (c = options.length - 1; c > -1; c -= 1) {
                                if (options[c].value === value) {
                                    pd.data.node.lang.selectedIndex = c;
                                    break;
                                }
                            }
                            if (pd.test.ace === true && c > -1) {
                                pd
                                    .ace
                                    .diffBase
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .diffNew
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .beauIn
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .beauOut
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .minnIn
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .minnOut
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .parsIn
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                                pd
                                    .ace
                                    .parsOut
                                    .getSession()
                                    .setMode("ace/mode/" + value);
                            }
                            pd
                                .event
                                .langOps(pd.data.node.lang);
                        } else if (params[b].indexOf("c=") === 0) {
                            value = params[b]
                                .toLowerCase()
                                .substr(2);
                            for (c = colors.length - 1; c > -1; c -= 1) {
                                if (colors[c].innerHTML.toLowerCase() === value) {
                                    color.selectedIndex = c;
                                    pd
                                        .event
                                        .colorScheme(color);
                                    break;
                                }
                            }
                        } else if (params[b].indexOf("jsscope") === 0) {
                            if (pd.data.node.jsscope !== null) {
                                pd.data.node.jsscope.checked = true;
                            }
                            pd
                                .app
                                .hideOutput(pd.data.node.jsscope);
                        } else if (params[b].indexOf("jscorrect") === 0 || params[b].indexOf("correct") === 0) {
                            node = pd.id("jscorrect-yes");
                            if (node !== null) {
                                node.checked = true;
                            }
                        } else if (params[b].indexOf("html") === 0) {
                            node = pd.id("html-yes");
                            if (node !== null) {
                                pd
                                    .app
                                    .options(node);
                            }
                            node = pd.id("htmld-yes");
                            if (node !== null) {
                                pd
                                    .app
                                    .options(node);
                            }
                            value = params[b]
                                .toLowerCase()
                                .substr(2);
                            for (c = options.length - 1; c > -1; c -= 1) {
                                if (options[c].value === "html") {
                                    pd.data.node.lang.selectedIndex = c;
                                    pd
                                        .event
                                        .langOps(pd.data.node.lang);
                                    break;
                                }
                            }
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .diffBase
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .diffNew
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .beauIn
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .beauOut
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .minnIn
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .minnOut
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .parsIn
                                    .getSession()
                                    .setMode("ace/mode/html");
                                pd
                                    .ace
                                    .parsOut
                                    .getSession()
                                    .setMode("ace/mode/html");
                            }
                        }
                    }
                    if (source !== "") {
                        if (pd.data.node.codeBeauIn !== null && pd.data.mode === "beau") {
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .beauIn
                                    .setValue(source);
                                pd
                                    .ace
                                    .beauIn
                                    .clearSelection();
                            } else {
                                pd.data.node.codeBeauIn.value = source;
                            }
                            pd
                                .event
                                .recycle();
                            pd.test.delayExecution = true;
                        } else if (pd.data.node.codeMinnIn !== null && pd.data.mode === "minn") {
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .minnIn
                                    .setValue(source);
                                pd
                                    .ace
                                    .minnIn
                                    .clearSelection();
                            } else {
                                pd.data.node.codeMinnIn.value = source;
                            }
                            pd
                                .event
                                .recycle();
                            pd.test.delayExecution = true;
                        } else if (pd.data.node.codeParsIn !== null && pd.data.mode === "pars") {
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .parsIn
                                    .setValue(source);
                                pd
                                    .ace
                                    .parsIn
                                    .clearSelection();
                            } else {
                                pd.data.node.codeParsIn.value = source;
                            }
                            pd
                                .event
                                .recycle();
                            pd.test.delayExecution = true;
                        } else if (pd.data.node.codeDiffBase !== null && pd.data.mode === "diff") {
                            if (pd.test.ace === true) {
                                pd
                                    .ace
                                    .diffBase
                                    .setValue(source);
                                pd
                                    .ace
                                    .diffBase
                                    .clearSelection();
                            } else {
                                pd.data.node.codeDiffBase.value = source;
                            }
                            if (diff !== "") {
                                pd
                                    .event
                                    .recycle();
                                pd.test.delayExecution = true;
                            }
                        }
                    }
                }());
            }
            if (pd.test.ace === true) {
                node = pd.id("minn-quan");
                if (node !== null) {
                    node.parentNode.parentNode.style.display = "block";
                }
                node = pd.id("minn-space");
                if (node !== null) {
                    node.parentNode.parentNode.style.display = "block";
                }
            }
            if (pd.data.settings.feedback === undefined) {
                pd.data.settings.feedback = {
                    newb   : false,
                    veteran: false
                };
            }
            if (pd.data.settings.feedback.newb === false && pd.data.stat.usage > 2 && pd.data.stat.visit < 5 && pd.test.domain === true && pd.data.node.report.feed.box !== null) {
                pd.data.settings.feedback.newb = true;
                node                           = pd.id("feedintro");
                if (node !== null) {
                    node.innerHTML = "Thank you for trying Pretty Diff. Please let me know what you think of this tool" +
                            ".";
                }
                if (pd.test.json === true && pd.test.ls === true) {
                    localStorage.settings = JSON.stringify(pd.data.settings);
                }
                pd
                    .data
                    .node
                    .report
                    .feed
                    .box
                    .getElementsByTagName("button")[0]
                    .click();
            }
            if (pd.data.settings.feedback.veteran === false && pd.data.stat.usage > 2500 && pd.test.domain === true && pd.data.node.report.feed.box !== null) {
                pd.data.settings.feedback.veteran = true;
                if (node !== null) {
                    node.innerHTML = "Thank you for the loyal and frequent use of this tool. Would you mind sparing a " +
                            "few seconds on a brief survey?";
                }
                if (pd.test.json === true && pd.test.ls === true) {
                    localStorage.settings = JSON.stringify(pd.data.settings);
                }
                pd
                    .data
                    .node
                    .report
                    .feed
                    .box
                    .getElementsByTagName("button")[0]
                    .click();
            }
            if (pd.test.audio !== null) {
                pd.data.audio.binary = window.atob("SUQzBAAAAAAAFlRFTkMAAAAMAAADTGF2ZjUyLjMxLjD/+9RkAA/wAABpAAAACAAADSAAAAEAAAGkAAAA" +
                        "IAAANIAAAARMQU1FMy45OSAoYWxwaGEpVQA9wAChVSyrkSX4folg8BYiJjMKc1SuX4pepo4ETrVZqIv8" +
                        "yVbycShK30LFEUoSgZEwWmjGlgnGrAwdrjrvkt5GpJlQtbjNmCpnFAUz040+FdsMdODIjEn9bVbUD/GH" +
                        "rmrGxrYmFXK1CjhKYXw2h5lgR6aPs1CbmOaiPWFtYVaoVa0yq5QqI4TGK0iyKIgm5wLaygjEJOXtCFGr" +
                        "IcBrUyhOE1jwVbirkaa5YDIOs/EmijlMokozg3hERLk0NcxSuGYIGOsmhxqBzcGdWKdhcnCPp8yrSaSq" +
                        "XRijeP7/+9RkbgD3z2gkMfh7cAAADSAAAAEnEdL1rGsNwAAANIAAAAQkd04uTi7mduDmyRH7yWE9cnTt" +
                        "acXJ6rlCjjaL2fYACDje3+kRAWpAcNLEell9dc63jCNp8rZuBKHoRk6Z9/I+ONSZSccFukZeBP02rMFH" +
                        "jQkyEEYgYZYwDgpmUpp1ZqzJCKOXHKJ4CICIQayIcRgDiI0PIAJsFAKCmTJlmjKDkxUF4XEEMzDkTIh0" +
                        "14eL+LFMCFMKHDhKP8rZejYv1CW5z8RBcimlFUpLETl9d0BlJ5eMiNQHlTITxMQHyYAwSUw3LlyLEf5U" +
                        "juIYKtLLsfooAWupQ1Z+1KE6IphKH/h+maQsR1IDZ2u9alXudPK7TsQ5DcXsPvFnIglicqgeGJSztr7/" +
                        "xu5YqUMPxxyKKn79eN2rG+wxRSuWSiMXrdSWYyt/JZdp7kYsVKR/3Lh+1KLG5XL6S9K43brv/TP5RyiW" +
                        "blb/0fJXDmPZRjG7dSxUsTcbp60MTkMJiCmopmXHJyQFDC2ODQwlKqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqiqqqqqqVU11qbBQICDUy9HDGIzoqMNJThqI5pIM5jzj0cEMRxEMfY4tcErDTkDF" +
                        "BAMdOPXB1o1ywxBU0J8wo43KcAjDQGE8FUwEHUm5q0jDmTMhQMPpjBmzTwzq3xLuap8euaZkCY1ibset" +
                        "Bo8DKrxp/4LcpgCcjhpj3Gwkg0BI0v4HVuTFSHL3hAtscMoPtStTK938AQQxYsxJs06cwEQ4SoYFhcMZ" +
                        "48GBWSPIsO/7KHE7AEMOVYABAyg4OAjpE2JMGEjLBkW0f0109JE3kNxDHGXo9oVrOAhAFNH/+9RkbgD6" +
                        "UHTBy3rTcAAADSAAAAEpsYUZjm9twAAANIAAAAQOaV6/UeGoUDOIpMMnfx+qJm6PkPr/LQGKCOiYoUg6" +
                        "y+H371VdeR7jdvOcsUsrrVYIzmd1ok/FFOS61qmppnGnuSCcsyK1EHUnX/3djmWGEstztfn0lPyfld6j" +
                        "xz7Yyq53r163/1blLyvRZYdv2RAAgAxJGuGulUaOOBvI1GrYiZnRZqt0m+YWeR+J2sRH6dedvEZyaFGm" +
                        "GEacZBnoSGYAKCMysvM+PjOiomSDWjACIBloWDDcwkkM6FAq9n22ZlZkbIUm9qoFFjEgZvAIHGDiZlKK" +
                        "Z2OmMgpgZKYOPmAhosvGekJmQMabEmukZhyMa0xGpEyAlKJJBllInI9a12kBQQMSADGjQ1ElMDNzdXEx" +
                        "0GMEEgceFo5e7C1J2miEoxWEW+3QiBBIbYOY/BHGMQZemWhRhQeYSMlBQ28skLiSzC9VfdJYwwKCpCBi" +
                        "Y0Y0M0PDBAZfr8IjsueBYR5JTIWGNvEHjaSYqOgk4NKFk2BgACAtMhJB97/Lcjt08aYCLEQOJTGxA0pQ" +
                        "MIHxCDhwSEBjB2dRWHH81R8y7Y5Uwwwp+/y7WdiZge7hvv7//3/73+Ws9y/Kx9Uo3k+vtrTEFNRTMuOT" +
                        "kgKGFscGhhKaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qoEA4VA/MGQGMwdgfzB2BVMFYIcwcgczBgAhHAIjBPEKNPAvQxGQpjCXAsMBgBEwKABwQCWZeGZhIRmA" +
                        "A6YADQFD5QDQoAy8oEB5MJjDwOYIY+VJx7EAo1mJSMYLHJkcECAKmBhAJAd9REATAAJMGA0w4HTCwZDA" +
                        "ikCYXARiINmEGia9RhgMLR0eC4jAyIgJAKMtNLITDLUygGl9izxgYJmFgSYQTZw8HlUJjQVRUtLpcpcN" +
                        "G685i/8VvrvUwBwJKpENEgstxFHbgCQxuVYRubl8ca64AoDEUSUHmFH/+9RkbgT6c2BIk9zjcgAADSAA" +
                        "AAEnVYEdL3eNwAAANIAAAARYKB0xMD1M26RB9OP/GWSxt9HuZNFGgKLIiGCzsCmIAAA3VYk9MPJn3djO" +
                        "KtIvEgRVrEIZNdhI14LzD4IFhIYOCgCEjXUfJa0td9Spfjl7X3L2rVeelfYAXEHAlKOQ2d59w//33djd" +
                        "G7Cihg4BNYdxz8emAAAAbigYAYCgGBYA5QEKABGAUAAYBwCphsivmyOmCYl4HpgbAemCoAUYE4Ayz50w" +
                        "RBwBBEhyLfKmLLFtgcCUcMNwfMBw9MA0OOVGvMThyMJxxDgwWHXrBTWn0dZ4b0hmn5JgMMAwAMBAbMYj" +
                        "nOXiMMSgZIAfBQHmAQApQv+70apZZXdVOQs014wMBEwQEDBr9NopAwWGkdS8qhDpSVrT9SyE35yA2xqq" +
                        "rMWCMWkgDn9fEEBwCksW1JrvIfjM5MMFghEkKgUxNMjCwCAoAa2wWOymNS54pZqNQS1pU0XlJgcGGRRU" +
                        "amBJctCBosw6V7jA7OW6asnstYABAgCZiCJhQGiMCJ0Lef9+ZqeVCgfzGr3vf/+/+p7Wc8YMJhZYtKgN" +
                        "cWxlu9F888s/uxmAQoEAMa1NVFoWzX0fa+pMQU1FMy45OSAoYWxwaGEpqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgCAAtSPpWqmHQBU" +
                        "UiAAUwWgHTGeC+NlyGgwNAYTADB3MFoCNJ4aBJIACk4miqKrma+/jbIKCEC0wCANDAvASMIcA41uxLTB" +
                        "XA1MDAAMKgDhgAik1ms3npyHKZrrLDAFANDARwsAOYEYCxgVCPGUsI+NBSmBWBCEAGA0CVoErkr21nVj" +
                        "UMpMo9LAGBEAaNBYxtWT7B4MPD8s0mPFZVZymQuC5Tcj94UAjixYwKDDII5P+heVA4EqFXtOC+NKYMA0" +
                        "FO0/0llrdFSlyDEegNqA4oCbiO1NupnKC/ze56z/+9RkbgP5zWBFq97jdAAADSAAAAEm/YUUr3utwAAA" +
                        "NIAAAARpZVKX6MDA8xrdTLRRBIGHRC5LsuVa2yVx8vxzXwW0TsKoSNMCw0mDgQABYEFUBsxoK7wEAyWC" +
                        "p87178f/us///6z0wCEZHqHv/9doZP+//94RgIDsp1Tcqy5VuUCSAFMlVnGQYTkQdBICZg6ATmNuLqZ0" +
                        "NcJg5ghmDMEWGA2KUAYD0wEAAWvSwWAHa3DzAR4AdS0GgFGFADKYSAG5gZCemhkcMYJgLpgGgBGAIACs" +
                        "MylpUWleEaraVtMAUAgwHQDkVTAcAXMF0S40LxQRIQIoARCABzAMA1GgJ45DkNrKXBcqKNvBClTK7MUA" +
                        "bO7ALMMASZLDD90mGNcs6xexE3BLdp+tuwAAFicigQXDAwVKusXLvp2A0CHvf5/qe3HpADAXMD0MNCgU" +
                        "bKySmn8844Oguvy//LtSA2kLZMgmXCF/MAAiBQWsNpmZ19LSbF/KtZVBkZWDghEIGKoYlgYHAzG1wUMH" +
                        "7uAUByIDbeNBW/L7m95c/+7gMwUARvpuO6//40ak/n//9gAwDAZ3qazX+mGFKOC7Ly6UxBTUUzLjk5IC" +
                        "hhbHBoYSmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhQAVpJeBWpuAyAGAAJDBfAnMk4Moyn7" +
                        "tjCdDDMFoGACgPIWAEABfygL7GAAIiQPUjXw4ITAkADBwEDKEJzIMNDAZoDxr9zHIRhEDo6ATLY0/cCQ" +
                        "5T3OyxiZEGAKGASBoLhYYdsGc3x0YUgeYGAEpuYFCIRCm7kYaOVAATDsT40AbTJGm4MhCYDNkceGSYhh" +
                        "k57sQHNSyvoVABzqKu4pgkBBAAoGDwUAQw3U84zDYLgOGC099TDPEkAgRAgi1vdLnJE+2tmCiUG1APNO" +
                        "fiX54fUEYQpY4XdU1SBmkAb/+9Rkbgn552BEg93rcAAADSAAAAElXYMXD3uNwAAANIAAAAQGjBQVTXMP" +
                        "2/EIAP03ZJfHY4BSEPPywZ0raDgAMFAuM8xuMnhVEgLVXQKVUm6kBhYJV10F6nz/9RDLn563hdbgFw4G" +
                        "gIiExb5vu0y7P5f/749BgEC8P02ZyzIOYKnlHUMQaECgA9MhlKFabwQAQYC4CpgaAZGLeDmavUgJgag0" +
                        "BgVJgDAUmASAgYCgAqq7V1ASy6C0XgxfxZgRAImBIDAFAFjBXCJNR8WIwiwDRIERSafD5zlPd3Vpplny" +
                        "EkwBACUARgEgEGCgEmZiQYRg3AOkwCTahcDxZ0P7svUTAL9n0mmWsGEYAwEEIzcjaKLKoELgtKjtrlvG" +
                        "O4TldWYwAC1gzAANDgWYLn4LYQODaj12k53EqAAVBUsz5+pKLBdBEYxKQ+9U7b2ef/5IF4d1vK1Sy50U" +
                        "NjP0WNpj4QCMLgWIzzAa9wgCD2dyuVaQZBbChQCmFK6ZBCI0DodYO/Uh7XL0FAPw1Q7/9Nyvf//ruoLM" +
                        "Dh9dOoe5//udn94///psANAEK1lf95VCBeBKWmkxBTUUzLjk5IChhbHBoYSmqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgEAAVgHSBlxdNJIwBwCzAAAeMFUCcxmgKzhzhIMR0CUeClM" +
                        "BQCxuIqAYrAyuGDAEAEDgJKSkKgAzFiEAowUgPzBCBfMNIOM00h4jBkBhAwBQGAJTCZa60syxv0FO0ge" +
                        "APMDMA2EJ9GD8PcZDQq4GAJDgH06DADAKatDcvoHLHgFqOVpxO4+zzmDIbmDpVHXIXmB4FhgBw1O3N5b" +
                        "yxorDwGDoFEIBhYBgaA5gmx5lKGQsSpQAHO715YAICgAqDtLTRpVUEAgDQNMiRZNagZMHAQbWeu007aI" +
                        "AXTjwx//+9Rkbg355WDFK97rdAAADSAAAAEl7YMUL3et0AAANIAAAATKvEFgwYBBhu1xjKBpUBAZBDkN" +
                        "4VNF1pfPcxrVSEHREDYyERpoNRk2HTTqRDFUtq7EB0Gk4s88cN/tmfP//538wMFBQA0zDP/r9w9B+9f/" +
                        "/7YgsC8tyt3ox6UpvIMcxbTEEJZQAAgNIgBExwYA0TARAgIgxeQzjouQ9MJwB4weALzAeA3MBUCYwAgA" +
                        "4NFQAZuWuAID0iAsQAK9osEhj+C5iuEBkqyhuFa5iOLRgcDoMA4LAGsA3OWUlPhymeEmAIwvBADACYBA" +
                        "mZOx4cknWZGisDgRXssKrX/+m+kFuCazP8KcxEB4xxIg7VIswSBUoDuXVL/NdzzpaRRdF1cokMIOFkwi" +
                        "RM1bEEAAyUAhzPmsUpg4HiYBLd2mjTWDAoFzCwQTCh7zBIGTA8C35rbyznxwBygE+d3ZnpazdB0x5KEI" +
                        "CgaGNP18InKJVVIQFSj7zeErHAPLLjoPGdI5DQol85t/GAS/9g0G1a8s92v11mML/973/xAoBd3uTXf/" +
                        "e52FZ/ruvwtgoJm8v9v65yoD6anJTEFNRTMuOTkgKGFscGhhKaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
                        "qqqqqqqqqqqqqqqqqiqAUYAAAqHAwAQA1KDADAfMBwB4wKwOzDiItPpsY4FGrGACCAYO4GY6BKpk4LDW" +
                        "GLAmAMAtDZe1EdWwkAlMEQIgwGAVDB9CRNw0iAwpQKQ4HFPJKBxoEv51LlA+ih5gAAFGAQAwo2CgGTBv" +
                        "EFNDMQQwVQNQwCwoAGLwEwBbySi2WAB6ahh0MAAZszIlAAMHQMMOUhOyywKgVBwzNffyG5+QV69Dcjzd" +
                        "1kL4FQYMBgbMDWRNdRgMMQVHgAp7mHeN2HhLJgVgizLqZKowdCYWHMwmgkBOmYmgs5cUpKf/+9Rkbgf6" +
                        "a2jEA97rcgAADSAAAAEoAZUSr3uNyAAANIAAAASWytsxWDN6pZ3NR+4VAbMHFNHjPTeGgQeOEUtyOF8S" +
                        "IAoco61XpYAUiCowhC8hZEiKtEJtFdsXkOqYSBUoBrmFDd/GstiBu5Y//4U4kDrz0M3r9/phE1MXv5l+" +
                        "o+EBLBdixZ///9d5e1/N5YWEO/Or7IhLmNIS0PTABAFAoAUVGAVDB4G2PAI7owXANzC5AlKALzAdAYgV" +
                        "tl3MeTHR5LaAwAZoSb4qBYYNQK5gZADmDALGaqRPhhTAQmAuAYEAAq6ZbFoE52pGmPUxa0wLgAwEAsTA" +
                        "PmBkLaZRg4RgHAgmAmAMoC1qDaS7aTJFgCLqlAkAg4aNJgIAAiECGAeSYiPxjcEmFQEzOGJXnYv3o4oQ" +
                        "nunOsOw5OwoI5h/PmiwkJFOrhSd1hQg4RhwMT4byAGBgYJggDkQtMaWkTNaJUTjH27OY4DCsFxuV4V87" +
                        "bgiMDmKmeazG4kWCgPSeUTcEt2GAk1Nqsjop+zLAqBDAI8NEIQMr6eD6EoDWzTSx4BUWWoH3d/X+zKWU" +
                        "NJRc3916CwFIcpKT+fvb7OJKef+/7KDBIIZNqi1++/937mPviFn99V9LCYgpqKZlxyckBQwtjg0MJTVV" +
                        "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV" +
                        "VUAAAQAEMBAIBBgEgALZMB8CclAbMCQG8xPx2TtdbFMUUGgwZAKQEAiYJgAokAwnUDQCwCAsicAgHjAO" +
                        "AKMCgCBQAv2YEACBhVgqmDiCKYBgzBgEojmFIEAYAgCJf5kL/N3ormMy3cwCQCbo8AuYB4DYjABMCMBE" +
                        "wwhIjQ6EJMCID4IBLQVaG2kjjdWbGgGZgcAEV0iqYFYBJgKAKmAYAGFCwnmxqGDIMiwfNNkVeYneQAma" +
                        "RAIAAAEgCBgJkQYo/onmI71jIOI4OlDuH41JQYOgiYBAAmMuVlLLTBD/+9Rkbgf7aGlEK97rdgAADSAA" +
                        "AAEt+akSD3utwAAANIAAAAQBULyAJjCJUzcUNQMCj+0Vzcdl4qBCebOVdLEgqMzw4B5IEhk4kBlmHQIA" +
                        "UOAWUxKC0rxgBiwDkCgYE3fWS9zPC6IBAQGBwCWoMBgQRXTTyhwKAUyV/RCBAGACOoiSi5v9unOR9pTe" +
                        "fr/4YAg7e+Rf/dVWZt3aBl//z4bMBglgWYxw/n/+G8sefhze7GjNac8EBgCaWIVAQBwD6toOBNMAQDYw" +
                        "MQkDFiFMN1B9Aw6AUzA4CGCwEpCA0QgFjQCoUAMMCMAMDALFgCMtsYDAA4OAoBgAQKAMMJACAlAQMGkQ" +
                        "E0xyljCrBxMEICRR9DR4+PNF68wkuWjS7ihECcQgMiwUBgKCsGR+IWYTYKgcBiDAGoTDUNy7B6mC0BIA" +
                        "MYCADYkAODgJjAQAeMFBHMMSMOlh/MHAkHgP+H3IhyZ2wgUAAHACAQKAwOGAwPAQBTAABwMDxgozplwC" +
                        "4oAojAGjpNbyaIFQnQEiIFGcKSFAMMDwVGgeJAdMGh3NewOC4D0+f7icbnnGXaNAOrGLABGYaV6YAAQY" +
                        "AskYKBAPAKrFAlMvEoCJQIYAILgSEBeW+Tvb9O4UAcwVAgOAAxrD0WMgWAdkAXABR5EUmBRcxVCFENJ9" +
                        "tML//9n2RsPq9/vKYAAQ89eZ///UCsEZflj/799AqB1Xsxe5/P7vm8//vP3zVvyibq1AADT7QzEACwGB" +
                        "BMAUAQvSYFIFxgLACmLuGWZfLZJiLAsAkCkwTwCw4EUwLwGQQHBg8B4YAYFBUiBEVAowqA0wXAtxDBwQ" +
                        "jDAdzFADjEw0T/gwDMIODEgQR4PC75IAaB+EU3ImNiICEU0IjDILAICgCAoxTNE5BJQxFAdMomIlzUH4" +
                        "GlbbtvIqVBEW/MGwCMAQfMHQoMSgYKww0QWSsNwlWylicohtrcvEILS9BwMCAuYBA4GARbMDEcwzETZg" +
                        "WFQCXSTrjbiUjkNkU1L+pqw6qun8nSDACUB8xWD/+9RkbYT7PWBFk93jcAAADSAAAAEuCX8czvNtwAAA" +
                        "NIAAAASg7zCwLR0TUYnIoQ0tMcOA6NagAIA4NBYQA25kwLV2YXPRmoCtVZonRYbu3yGCpQMDFXqUGDQA" +
                        "oJICYDjwHHQaYkcJg0chgOHgcxJlCOIcH2EvtNQwsXHnf5zSyVjSf5RFFzqzGEQ4sRuDkQ3bp5fHmxiE" +
                        "BBwGpOcu9fxoQ6JwcBGvtfMEFxRx3epqnVQAAARhWFBQBRKApguA5g2EJjSH5gCHJmagIOUcx55oxfHs" +
                        "w5C8Kg6YHgIYYg+DgkYLD5i8LmDAoYCDA4CDFwcMbEwxkGDAAoMoPo0YBDUVeNI4EVB4GUQNAZgMCo/o" +
                        "HOulujzB6MqHNmYhE5j0qgIxmaUuaNZZsJFEI6MEhYWBCvFmOWytQdp6eiIheAw4IjJQeMFhEy0TDMBw" +
                        "xh4OxESJTagveXQxD9WKrBmDkaqhhZiZqImJGhiYOYacg4vMRaxeUgoeJE23Cc+PJlqZMQEhAywiMUFz" +
                        "JwEyowMOCmzAYkMmeg1CMbB30XksZ9GqgUNMLATBwEvmYQWGhEQOFi8CR7UkizKT0DVBEDTrqwtE8IBF" +
                        "NR0DrovmIhZMCKwTAEHDGgYuWTQAshhwOkIwEwsNBoAYOKmNg4iCjICAxwMBwuruXOw5Egf993eCANwI" +
                        "DdftyUhQVVgnZBR9s3KWsKAJEGS+v3GrL3bSWb3pn4r7lpiCmhAAqYAwAwOBNTWMBQEUhABMBUCUwQBK" +
                        "TKuR+M+gXUwOgGgAAfAAKAVBgBxgCBIgA8wIAEwjBowIAIGgCVAuMFwwEQimEIkGQ4yGfd/mNBPGGo7G" +
                        "CICGJgFJ5JtBQAoOeDILAqrEwIBEALBGYLDSKj+Z+oUYDAgBgTMNgVi6txgqCxZR5oEi7cxICyUBgaD6" +
                        "Uxh0HhhYKBrQMhh6AiyzATgzsoQ2fJYGG25QSra1wGgZgokDg9aZl2YbuOmGE4hEUmTFj0iTU5kG4CTc" +
                        "i7M2rCyUHCBjRewAxb9LJjz/+9Rkbg/7WWPHg93bcgAADSAAAAEuuZMcD3eNwAAANIAAAATAYKFCAKSM" +
                        "MBDhoCSAf6JKxQQr0yoQAwGYoUA0xOtPjSicIIkVXJl7NQsBgIVlENMNT1HSYYAQqKlUTMJBzoiwLhRg" +
                        "oG0BXhf0IDWWofDxE08EhZVCw4YEi4xQLMVKArOFAEUIhCCKOriklSXRlsKbQFAnpl8ov6r8nv//z/DK" +
                        "WFYFTWL/ddxx////+pepEY0AEYAwBZKAKpWAQDTBeAcCgDJgshKGCu+QYrAwJg8gMDwQZgZAiggAAkAN" +
                        "MEAEMMgiMAAHMAQQX0BQlEYSDwhGGwDmGwGGGgIG/D1GbANiQ/M9MSwHfNOMwUBYuixYKA8YGguUCuKA" +
                        "MYUigBggMEwkMVQuOYi3MYQBGAtSKQbGgOMCQUMCASf1T6AwRAEwckA4eBMwWBYoGcZRYz8JUw9AIcC7" +
                        "+xIiAkYEQAceAyYCPxSCgZMPDBOwxABTBFQNDhAODQKJxhcEgYTEQVDgAilZIAI2dsBgMGGEAYYYAQhB" +
                        "RCKjNSEMrgxzAKUTEgKDgSXWGhIKgBvE3k47JCCiwIAuDEjRUHG9gqZcBphYPA4FxOlehoCV1LuehtCF" +
                        "lYWDRgcGmRCAZwEZigGgYODQTbOoMVgSlhtQNQIAAJbpkURmBgs7ZhYShdRAYvEIZCAK1dqdn9Ze7xQD" +
                        "IR2z//EaPf///9xJwmBtLrV////////047ZrG/fRJgRAUBmDgMwoAuIQJBIMACAQmAMBIYWc1BqIhomB" +
                        "2CwDgXCqEMAgDCqAYLAsYIgKPAaggBwzxYwICAaH8MNAxaKcxMJA7HpwzfFox2CIeDswqCBX4IAcMAx5" +
                        "4GHRGBQjDwtJvgUdwwGRwTRoKzuM0zF4HgMNhgkEJjOAip0jDBAHFMFThcLBGCSTAiAowdG0eEcwDBgw" +
                        "vTg3NLEgDMxWGGZg4RlYAZWs5oMdEh0phCwIEjKRDJhCGFYY6yQwYOTJ4kEJoBIGWyCQGvaEiMCAYNph" +
                        "rWMlggz/+9Rka437vGRGA93jcAAADSAAAAEuFZEaL3eNwAAANIAAAASgCjDglMIio2fNAEuRYylUTmAg" +
                        "MVgowMLAUKiUU+FwGpKqVAELGIxUAgwlGEC4c5CotEQqDhUFY9bIHAZpNvBu7higlMciMwSB0dTEpkOK" +
                        "kEx2LjAgCHg+v5BKmq+Kt7ZGnFQHpzgwWiICF4C04AXRmMDIjgIDP+1P//PiLpZm9jrn/QSfe///zqF/" +
                        "yIM4/c1//v//693VdQ1Qiywp7XteoKToIAWEQB4QAwKgBGBIAYLBNGE4FcZIp8RsmgOGC4AsBgEjAXAB" +
                        "FgPCAAEwLB5IgtmWABMOwRMHAWFgXCovjQuGAobmG4hmZXBgJlQ4EEwjAIAWnCAECEDxIQrxCEEGCwTQ" +
                        "WYQAuNAeYAgUHAIcRMYY5haFQVMAAtAoDQyQAGBgUW5BIqHJYAUeABdRhCCAQJpIDxgWQZymPAkDJgsD" +
                        "GDAwAQG44KB5CE6R9CYUkQEhANGA8JwMKhgAGO8AZuIBgIJGIwQYnDC5UsQuCiIQQcvAWI4sCk7DAQRI" +
                        "kAYVEhIMzLMZMPCUDCIwEJAsI3sBIICoBMRgpm5CG3YfisDUSKAMVAxg0UG6AiChesgvLJr/qVl+s6RZ" +
                        "bBhkRmNhMQAkCAwQFE4KRggROKTBF1HKfqqHAF24FCwEZ8YDFZhEFrNFQIYCUA8h2sp0vq5/7/CvOlBC" +
                        "nuVuf/5f////sgB7a9/t7//f//1YVzQiAz81HfR1qjALAIJACSsDkwDgBTAvAkDgljBdAbMBABMxg2MT" +
                        "aPF2MMYBUwNQHDA+B9MC8CIqAKmEwKCgKlYBGEAAGIIMgIERYNioMIUBMGAcYpiMbzcIYvFWYahgYPAC" +
                        "IAAiYFAoRBmPEFFRCBRhQGw0G6jg6OFcCBKYYD0aQ2iYFggYVhcYFCaELQvEGheYIAgNAgCAWHhBMAw/" +
                        "b9DkY2BeYGgWYBAkYurOZ0l0YaAALGQwqOgwCI1IGmIgRGodMPjdF+GTBYvM9iNn6zQpLjj/+9RkZQf7" +
                        "8mRFg93jcAAADSAAAAEtLZEYr3eNwAAANIAAAASwAHSAJFccMYgC7HVWGCwfQIdA4UGDgInWFyOHNEYA" +
                        "zemukCaRE4XEJk8EmISEuARgIwiJQ4OPqMB8FBQoBCXxjIoAo1oARUIHJySYXBz1iIAVMY+MAEiAM7dQ" +
                        "GLeTtLQoXGAAiYUBYK8AcLUOYYDVey6zNKVs2dth8aERJMakAMALgGL20PH5MJMaMt93D9V0tBQARXKz" +
                        "//z/3///6IAKkB/0P//7//+gWfnKAaCGz07+t/oQQEmAeAklQglCAJA4KowGwBTAsBlMQmdsyIRLDCyB" +
                        "PMDUC4lBeMBkBUEANGEoJhcCAQDYwAYCCgMDBVgWFEDB2FgFMOAeOXTCNHSYMGALSkMEgsTggodBdTNz" +
                        "2vmCQhKqQCYOhymSBAAMKRJNRZAMFQOCAxIAAAR+RoKBSRAORCgDQOMFwqMDgqdZVMDG8MgIqIwkOM2+" +
                        "FoBC4YgAYqBofdYwaRxAAa78FYaMQAqSAwnmQxcyZUpiFfHNAASiQBAYwsGkzpAwYwWBosouPHAWOKXo" +
                        "gFZjAFgQHiEVGBrMYfDhhYFCwTMXCEmCKyhwCFYUnBUQmLAE3rPTGYyKBOuosA82gVgcNUUgcDZDlVdm" +
                        "hjE2KgpoC+RIDrHGhWYAMRoAklABgRXzb4fdUwrM9IgA+wABpkYKiQNpjASCT7duDZBB//+6jIhoayHv" +
                        "////6///+DINVDh2p3/////p02e1RGB2nYu6zfPpTSoAIHAghACpKAEYAQBZgVgIiAEQwSQeTDInrNBo" +
                        "PIwWgN3wEIJ5gTgJGAuAUBgRIgJMCwFMDwHDBsLWyswMAsmHsFAoYPiubGcqZvAyjAlEYSje/UsJAHGh" +
                        "JXGKgyogPBjCjBoCRYDgqAI6IxzAtIyBqWogDQwgB16BAAZgCGJWDAJBEwFB8DBex1G0MNwrCwwLBMw0" +
                        "Gw3WFkt0iuCBdEKgQMV0N9D6YQEBr1CAKjS9cVBGYfAp0AGBUUKHGCz/+9RkXw764WRGA93jcAAADSAA" +
                        "AAEufZEWT3uNwAAANIAAAARIPAS2tkmGF4Rg1VZN2cFAewRUQgApoMxgpmGGgYYnFRisDOom4CgKXxoB" +
                        "kbmIgBNEADMCBcSAVoqAc0W0QEQfLpWsfu0tSaZOli6YiPpQHx4IGBygaNEavpSutm1nLBu958RYTx0l" +
                        "DxkAJ2qAYPBgYAjQDqw22f//8F9pTyLH/3r/1zPv/q6QAV1cvy/Wvz//+CW25NoevxkO6CuhlYBgIBEH" +
                        "A5gIE8wAADjAKA1MB0AcwHgXDBRBTMuhns3NgODBFANMDIAYwCgKBYCIOAgMBEAAwGwEx4AQcAkQdQcm" +
                        "BYDASBuC4BZYBcMR5IowfwfzAzASMAIBUwJwZlB3+fIwGACpGYBgFJgRAWpipSBcGIvQpqYDYHpmSiFC" +
                        "gAJZIlBMEIGCaj/mAACKIgAQYAqYCwAosB66cBGCuA2BgU1RmAoJUYGwQ4KBXGi0FCkxWkHgeRFUoAc0" +
                        "YBAhEGVXigcASp8vaYNS51wHjA0ZKFSqtXjM0t4iOAAxmBBI7yIGkkHC2YMHi8yxaTS4qMOi0woHwMKG" +
                        "StyEiuGFPIqDkwEBpYkoYcFJEA35AoNNVOwHFB+wEBdc/e/rCgFYi3IwIgkOhZktObnGC02xtReS/jWj" +
                        "WL0A4AM5HQ4PKZNJnJglTBiiDAFILrU9fv9uyBgFPcw1ZpdZXLFjv8+CRgSoiX+Svlabz1hh/4yPl15V" +
                        "+2y+SXVujQBMAUAwwJgEAqAkxMlAxKAdTAmAuMG0AMxxEbjgUDBDhdwwG0wMQFDAuAfL8lAIGHoLGAgG" +
                        "mA4CGE4FAID0dDDISAwNi04cBB3TEZomcBh8EaNRjMGb+R8gAZCxoJhCGYYFiczNTEUgQwKQCARhgIZ2" +
                        "wVBhqGhg0BYsExjWNtV1QQArDGuAAPjBsFntj5i8HghCYwqB0xnMQ5rKkwFDkwuCAaFDEwAZGBBgXKIg" +
                        "tA4WIJVAFYhDhlsJrGUzMH006sDwYIAMCBIipZT/+9RkZQ77wm/FC93jdAAADSAAAAEpJZEaD3eNwAAA" +
                        "NIAAAAS4ZBoQOJK2ABEYBE6nGUyYcCCToAIRnyvGoQIEBcoHYGKcystDiPIaRlgamHg0mmWBMYPLw0Ap" +
                        "SBhCb5a5jsXtWBQmm9cy3T0sqfBBgwaDQ4mmAwcCSeaEGCadGkAt2ex1YycJHuQGBxWZhBBZd3zBy2Mv" +
                        "kdFpw2Butj//caIFAA5vbud6/rdTtDn/51CAAg4B39y238u+hjF7f1tb0k48uXf/9/rmH/+u///h//WB" +
                        "wBgBALJgJSUAcCgHA4H0CAJmBGCAYiTjhmmBvmDyAEDARyoBG6EPEgDkQSGAoAtIGhSQvjRggHzcQYAh" +
                        "hWE5vtCJo8EqnkpDAICGSdKgAPOmo0UvxSOEYWBCJAWMgCYBhEamrOYNA+XCCgJmBYQJxyth79soAQFm" +
                        "BwCrAJSGAYZgYFQCAgwS5saMxhYCqsAyDR4g5lqQKHUSmuGAwUpexcvGCis4WZgWJmjgClcAgQMh5MRr" +
                        "JUBaRdOIg4EFgHDSHCA1mKAC74iEhn9HFZKMDAYFEAwoEGCPwXVSeqjgPRxWALAMMIiKVvQIwIYyMxjU" +
                        "IQSJAGQd5vP7cqVcjoYKB11dpgQGE2IZJAj/RvD93qq/h4AUgMDYsSEfVJGBB4ZHDyTbD4JhqWc/7krL" +
                        "wyHvP//3/a2ff/SL6tXfrf//ukvf///G5T2vpSmIKaimZccnKk+zANAAMB0A8wCwBjAWAmMAYAgMBAME" +
                        "gLAw7YbjJVEFMEkGYwTAMzAbBcMA4A8iA7DgRMGwXYaCgZMNQBMDQEHAhMCQOC4HDQ2GDI3GBf6GHgdm" +
                        "FYBDQCCQXFAYQIoaLAkQgCYEBGn8oKKAAYJi0hyAgBmA5QmGTNGDAWDQOOQg5IEEbKmKEIBmAQNjISML" +
                        "BoOmEYZDQtGBAMGEKPmGQ8GCgQBwxHRqYaAKcxggIggVAoNpvGDgcGAVf4hB4IASywsATDFjAx1BAWDg" +
                        "4ABK2IIDYjCqIjAzCYpEiqD/+9Rkbg77mWTGA93jcAAADSAAAAEtYZMaL3ON0AAANIAAAAThwmCFCul2" +
                        "ocKgMVkZg4ACQrDBsYND7d4gKAkSGqlBgAFiQVFgiooFQ8wR6EvTIqTMOglTseA89vv25W7CmbfFgHGN" +
                        "SGEAYwOCRgoGAyGnpinmp+9344xRGhlceFQel2YMCRe8wEXAUGhIHK2Mla1Eef+bZQCB4P/v//4fqZge" +
                        "//+i+hff+r//92J3v///BmcOTvdYC6V1BRDEgPC8hgDAJEgFxgKgJGCWA6YLwLRirqSGkSFSYHQLhgqg" +
                        "Sg4GtvTATAJDiKJEEwADzAgjEQSIQyYVE4kcTEAyMBDUQhU/PnzFqAAxtLJKLjQkaoBQmDgsBgwEAN3w" +
                        "gXEACEAJAABQHmShOdgq5goJoPhUJGFgIuAUBKeag4gDQ6HjA4MFACgMMQAcvSYfBJjIkneBGYKDRgQM" +
                        "gUUkxBYgDQgFwsFgMp0MA4ChVS8VA4sYRwViADmKIaZjBoECIVDIkJkZjDgMTVGg+j6YCA6PQBALMxEO" +
                        "QCAjAAACwGMmAoMT6HcsiYKEDKWBESBlCnRgEIllQggEgGU2WilcYQDRhhfA4lQEjDXzv0liG2VKIgEI" +
                        "AYHA0hFzzBAGQ7DT+ySqRwhqWXrcQgZIiBGJkghMVhGAnLMKGwITSOyQadLbK15c+vGV9Qr+8/f1OV6V" +
                        "ZsL1hgVQaJAaL6w/f5xNC+9z+Z99AtTi93u1VTAQAJDAHhQAkQANEoC48DsYIAHaSpiXh2mmqFItMwaQ" +
                        "KzACAJAQDw8DyNBsyAC1zmAgaCg6AQaYBCKtYFDphgsGLz2eKhZsJJsoRnRyGhwIwKYEAAKBSWg8DDAw" +
                        "kMGBsxOCwEMSENlmAwBnd14YeFUbAAHMPA2TJ6FYGCwIMAAMw2CwCDTCoaQUHjGGE8RCgGGA38ZwxOGK" +
                        "k5hiSODZh4eOkIFFyqBvyJGo8IrTEh4SRFBBARmDfZuoWGBxkgYYWPGKhQkQphmLBjJAUJjJcCj8aESA" +
                        "jCwcIR3/+9RkbI/7YmRGg9zbcAAADSAAAAEuHY8eD3NNyAAANIAAAAQwYkMP2A50AQAFhZfqGwAAkuy1" +
                        "YcGhcAMIADCAFIpXpMcLaALMaI6mEB4cMJRudFJJB7caSYIQxGsgBjFlG0q4BApl5AYAIiACEhGXNPcx" +
                        "nDSF2BgE4b9kpCAA4iE2HhR2MlEFrtIKA1TaAK1nHt2m7/9/HvKfWpJa7KK6io8BzF/Hv7wnJJdw32it" +
                        "SJShTjpvK/oVvEgADA1A9MFEDswWwWzBtAdMG8Msx0SJzKdSDMssK0wIQPDAjANDAmzAPADMEsCUxKGT" +
                        "BILGjKYhEpjEwmQSWZnUJu+CmwU+Mn8xuQTe/CMbgEDFhfLLCYODgOIhCDRAY+ERllHmtU+ZrKo8Swgz" +
                        "gANmIwcCA8cYOYYUVwGAR8HCaNCooMgGwywYBZIjoXMBiMxCGTDoRHhCOgIIChkZZGbwyNDEAhwEwM9c" +
                        "N0CAJkxBYgIMwNWREQ1NMDLE1CoYMAmNRLPq7NcGNgLOKzBKArGJ1DUUFXBIABkAsFMIeAxxzwwcZs+c" +
                        "WCcJgJOwMfBAwGFkNS1BhRC0xkeELAUgTbAhQLDTJgQ5WfmkKCkE7LJ6W0kngtL8VAAkcZ4soIpkJEyq" +
                        "GDh55JYyBLspEOHD8U2FR5sVo06MGNKAY8JVXlrOATsFkYMEln27wuTRicvZ93///f7y9nQKIZV6leHU" +
                        "gq+FbWuS2PSHG9zm8dLyloCqAEwGwGjAiAnkoKBBMDcD0ABDkwqhtCGZGK6BEYSAMpgRgkmBeAyRAvmA" +
                        "GCMYBIExhIBoWCoxeDgwOCgw1C0w6Hsw+Hk6WdAzRAooBMxWD0xuEkQAGMAHBTES1gMDIKAAYJAcVgyZ" +
                        "BEuadM0Y4jYIwTcMwPB8x6A5FMhEAmBxawAA4mA13jAwKAqIhjqn5g0GqRIsHQoFZQNBhQG6XDsFtjAM" +
                        "Fm7jAJBBhqMa5+gwHEAkDhkGBQODDNBFr4sUjokAkwAiw8pF+CVyOwsQ4wMAHTEgUlNBofD/+9Rka4z7" +
                        "a2NHi93bdgAADSAAAAEswX8eL3dtwAAANIAAAARwGgcXBL7uIWmIgJfBi5ecyyGWC66xYNEAU3ZNdDNc" +
                        "phoyRHZeJNEYBEbDgRJCaysWNYQqaK2I1flLssrS4IgAnA1TjgA0gs6LJZgIQmsianTN37EBAQWN8bBG" +
                        "CGCCztmFhsNv6/KYxh4EWuZC/bC3mQNWpnh+8f/8rXflWadyANp2dndlWiW0tLj/8okYZFPf+PK0qBNi" +
                        "APAwmAeCGAAUQIASAgZTAlApAoPhtxkWmECAIYIANhgYhbGCECSWxDATQKAMYHgyYHgEYcC8YQg+YCAg" +
                        "YQEkYLCQccu2JA2GF6YKAuYJg4Ypg+FgAp3jJQJBIIKRMIQWS7MVw8MxW5BAPmBwWqVGFoJA4fTAcCQw" +
                        "I1wwwYCgAngrIsODAcC6rGCwMjoKmKQCGBQXAocTAIJUgSECCoATrEQBCMQMIAjPSI824ByMMCYkWIPG" +
                        "bDJgwwxlOtdhfYWDgcYBUIMHBj6WwwUUAgNBJhAwaaBEQk7KAEABQqRBgorcYuDokAeBEQsYcCL7MAHg" +
                        "hGS4L8tZBxCYSGjgEChItEECxwBAYkEDQ+XYAoSJCjZsuZc6FANKIEDZsy8TCsNpSGCD4CLl0q3P7AEH" +
                        "PrEi64FCAu0iMWEACRA5gwKLH+GDNF6zyOsojJEupXp4w7///////6uRdGq///Xt/////AcBz3Z9aYgp" +
                        "tQSAUFwGDACBJMDkBgZAZMGIC0wPQrTmwJoMBMC0wZQWTB6FPMFoFMwZABgwCUKALDwLGDQemC4liwnD" +
                        "REAkSh0jjozODCUAjCoDzCgQwuGhh+LSRN12zAoIzBcbVhQMQBhKAA8LJldQgOFsxFBQDB2YLjEYKBmg" +
                        "HMEAPUiiCDQlDgRa+AhnMHiGNHovMXAuAwmGH4HmA4dGJwBkoAuNOGDoWGBgqFADioOAo2MkA88UvxkF" +
                        "DgRUFSFMWCgLgEYCcOAkPmCxkyIwsEUNmmHeg+YeJBMBzBAHBxOMoh3/+9RkbgD71GTGA93jcAAADSAA" +
                        "AAEvPYEa73eNwAAANIAAAAQeIZEDIYJiMYAARMfFMgSCDJIAOan9ohMPBYbmVzkYZEaAsMCbaBceGEAI" +
                        "VhCwlOBDEbNJ5dILAGBxU1gIUybPn7lCCwcBzCoEEKBHhIk6qJd5hgFpHWYJdCXxp7hIArsNYi4qh0aA" +
                        "4sBTEwsEidZbIsWcjS3mWocDAoKEgmiq/WeH//////0yT7Et6/6u////DbwkQan6L////t3nVrggAEAA" +
                        "IYAQBJgHgPGASA8YF4AYJAAMDkDgwJwFDe9LVMDYG0qAUGEGF8AAIgEFqYDgAJABEIQGBoEGAIUmCwAJ" +
                        "CiIMQgFDiOmTCwKigaDBUDBGHxhODJMBrXXuKoJGBghhwrmFINDxLmBwTAGJzAgDzD8BTBMASQNDCcEj" +
                        "A0AQsAAIAd4woBr3oumAQBGHIPGu6zGQI2gIMzEQODAIjELh4ikLFZSAHTBUBQUMy2S/gBAB382CAHqy" +
                        "NcStMvAwIHQgApENzAgZMXjcEAMGhQAgIAgg6OfSYIMSbiYaBACebJC97xmAAKYHHIGCtgwGFzCA7NCK" +
                        "gwMGQwCmCgOYwBAcRxYtooUhgsNhYePo/zxlYHMjlIxIE3+UwLMo/w9O2t4RMQARxBCKzOo+DAeFgI8a" +
                        "iAjAbMIr+/ehvUA2zeAIMAgVl0BGCQ4PBafjzkyKPQI01rq1YF8vRZ//5j37N/GrdSNCDRGcudxtf+tf" +
                        "UiYoBjBICgNze3V1MSoABgAAdAGgHmAAC40gwCAAwcAynucHSBxgyBagoMcwrgvTADAqIgHRoC9I0wYB" +
                        "kLAsYEh0TDY2IEAiCAnORsqMYgSLrmAgQiAJjBkAluBAKqWBcDDCIRh4hgcMhMJRg+H5jvNgEBwLBQRB" +
                        "uAQOMWwhTRZQNAaDQYCwUN87BgsB4gCA3OQUxADLhgCEJgKFBiiAJhqDEFtzEAgmAIryR/R0AAwAnnhA" +
                        "YUAw8GQ4EGAguPGEDF51ExAoVhkRhAjXS6AgGZv/+9RkYYv68F/GQ93jcAAADSAAAAEtUYEUD3eNwAAA" +
                        "NIAAAATpfPwsMpMwYFTK4BKAyGDKKUZeUmIbPAwVLGMQPF9WaGBweFS4ZXCwqCEpXTEA3HQGk0+SUpgg" +
                        "fGpkKZJAiZIcAYeBwGnuZ6rxxGdko6NTcBCaUjnLGd1WxWMM8Vg2WrxHQgbHIK929LTIJlTW7rlT1ppF" +
                        "KulzWYLBA4E2M9/3v/rD/p0TyIM4f//+////BsQkBI2juU9lxpqGlTARAOEAGJgZgVGCEBSYE4EwWAvF" +
                        "QbTpZYnMBgBIwNghTCxEKHALDBDAZBwKQwAitpBEYEBwNBykWXRKowG1v6mLQNIBjAMAkbgULIgAAHAS" +
                        "UCQIwZMECAMJQGMTQtAwBgomTXy4TEoBkZQEBQ6Bpi2CYFAoFAQYABgWWCgVCwYI9MiMKASOiT4MNxHX" +
                        "2YHBEn4AhuMFQUrt3HRSMAgPCAtiCHgkGz37PBQFIAqCAQYMI5kkOBCibkRAUwqEjGwYCB2AiEpssgzH" +
                        "cQUSWGlgOmPCOGJcyUFQMMIdRsMFEwcAEwuQGBU23FiQFshBwgUQIoGYeAKGUXAgpMIEFVkthJCYDwaQ" +
                        "Fk+mq8SEBbezreGUtEgcoMXNNpmdCpFSHiwFxkANYo9XINSpfdPYRjMzc2gUFH5Dgal4gbIL0C003BLW" +
                        "2wwlyyQGEQGtc/f//7//Z6AgI2HDfP5rv//58ZGYAAL39c/iJVCxj3zxegCAQAJgOADGBMACYBoJ5gLA" +
                        "HhUA8OAnCoMZ0tOCGCCE8YCgI5hnCKiACgwZQEx4D4mAXi4jAFMAAFBTN42GA0DUwuEIDByAPYZARgJA" +
                        "JEwPghAGGgFgcAqIQSzADAqFgBDA2AkBABpgtgRmUKSULATK+YoKgamECA8YCAAIQBiAQBDAQA/AIBJg" +
                        "OADOa+xgdgmGWUAaYFAJhgJABCoJZewwvQSzAYBBGgBy9hggAHCgTUEw8jcGA08FTDBgODC0OgYkGpm8" +
                        "siROg8SJb9mDi8WsFg4rkGD/+9Rkawn7o2BFM97jcAAADSAAAAEvDZkUL3uN0AAANIAAAAQMxRXCzUmJ" +
                        "AiYSHphsJDRlBwdqJLGFQwRGVuTVyUEHZFmNAhrAKCYXE4KRwcC3zpUEYMDySN5hAFBRqIDAZKQxKE5y" +
                        "INQfv+8nh4CpEooGMXAoG60tWiwRtcv7UCwOYYpWCAYDoKAlIW4JgMp9o0CRSJbqyhbmqeWOM31vD//X" +
                        "6y5+V0IBQ0F7XP/////X4EoDBoOa1m/LqTRcUe9zwwJCIoAoMA0HEt2YBYBRZ0wLgOzpRbfMJEEMwHAY" +
                        "jE3EMMAsAkwSwCTAwAUL8OGOAGmAGCMJAvzDRxgBIwFkAyYIxndoeBzKwLJcYDIBCA8CAYmA6B6TAcGB" +
                        "SCeFgCjANA0Mqwd0BAeOG3QqAdmDUA4YGQHoCBIC4E4YBiYBIKY4BLPJemAEBKZQIaYsEeIwCzAbBYMA" +
                        "cEswWQQTCGBOnioAQYFIK4MB0CAq3Kf0wKQjiujMJBFHBVIQBUzOQwMElVU9CA0mBR+UEAwyCR4BFQvH" +
                        "GImYmDqu5CYCGpjoMEQpSumHjMKkdDF3n5ZsA4UTCdeZABhQomHxEYuBUHRMYBphkYDQLtMRMDlU0+0T" +
                        "LIDSgf8LCIoF79ayw7SAoDq6HDcbGMYQHJLGFKyEHtnsYbrJXwHLEAZvEOhxJcphQVE4qD5VFafDOJp1" +
                        "Xt6YW/3f5v//8McqxKA05CI3yLCtLZ7P99/85ggBoCH66aDv61z/1v/s0C7o+4wuMAEBwwAwEDAAAfMC" +
                        "0AgCgAAYCIAgxnOYyoYPwPZhTABmGQHmYBwBBgSgHGBIA6PAaQpPEwjCsFCs3FSodCkzt/gRAW4D7mJQ" +
                        "lAEE2tqZEQFGAAHGBoilnzBITh0FjBwPzyFeo22r5iIDxYtAoB4jBFCSYCgkQBqXbU+VAEMEAxObFEWF" +
                        "mDCAFQgETBMDjBABV6PM5BhaD4QIywq2hGSzBnEXiUASAiEJGgwajQ6qrTBgkMCFcDAMCBRpwNDx71JG" +
                        "MwlB8iD/+9RkYoz67WBFA93jcAAADSAAAAEuwY8ST3uNyAAANIAAAASwRHmgzipt/zEA/IjHJnCAgDOQ" +
                        "IwaBMQDgKMlUwUIjEgVjEPp8CEOjQKay/RgQ2mKI0HKey6AULBlsHv1Zy3cgscBihxh0Km90k0uEy4cD" +
                        "JiYVRXPdyWMRga0VB+a4HQcJYKQkhYfmQQJGrMUz5DScu/ybiNAS9++a//wx5uZIAKtLPXZLR7/8f/WZ" +
                        "CAw4FxjZ/bTroHPeaLgIARagwJwHDAiBEMGsBpnBgHglmDQFgdBLw5g3BMmDgDoYj4hwFBHMGgDYwBwD" +
                        "0HXCc8KhOg4BhS0v+MASGO4jCKgBAEAsvkYLIOBgFgRK0NWixgGgkCQNJECsIQWwgBAwBgNTL+D7GgaH" +
                        "K03pgeABGBuACYEoBCiiAswEAPjAVBgDAAFNzA9AsMa0akEgKMlMFMDIwHwJRgBcwCwJWLx0EAXAQLMI" +
                        "A4cxY5goeHRuyNJFb80MkYaX4kLXYXiYfAZkAADxmCwhXKoCeKBAYFXWqvyPLEOKbKM1BjAxqHjM+jPy" +
                        "AXGuYCXehkWGwNQJoAKCwueaGBEMiExjwgsNbMJFQ0cjyoCmtuoYhApoUQP7as1rskBIRaYYSQJwgoEw" +
                        "keasDAsZYE7HLffcIgBDxNHFAea5U7U6UaCxILSsJWIcjOFyGVZt/mvgvzru+fjlnn+OLpmCASPDF8rc" +
                        "cCgUimqvd63UjaIoOBDawJ3//9XcDNfx9D727YAAQAKagMAXMAoHAwGgElVDAsAeEgljk0cWMBQNAwCw" +
                        "zzEEEBMA0FgwiAEwEBMJATDIAZf8wLAWzA6AXEAA40BOh2Mh1QYwJAVxABAvAwHgaTCEAMS5JgDEDVbj" +
                        "AkBuEACwIBsThAQBZl1hqDQDLeQGSgXGDQAWBgWgcAylWvMLgxMiHgOQqBOCgKTE0HWMA0BVQcwZgGTB" +
                        "QADMH4E0HAxmA+AOwcwJQAjBUAbAQRrTnkMEg487RBpZLcXcMkwwMPBCAWyP+ABOBTkXqC7/+9RkZoT7" +
                        "z2ZEs97jcgAADSAAAAErlYEWD3eNwAAANIAAAAQWiyZx3k+pXRmRiAMBypGicwhIRK4wSBkW2fFUEGAg" +
                        "+YzjgsA0vwwMmDgiAmir2JwgwOHCULAoWr2RDBpeHx0X7TgcswYES8MRnsfzokOTXjAxGNnjtBSOzRCN" +
                        "DGQec3+ZSxONAko4QD0zynggRvuNBERBElA7luZPd5WS1/WKUgOBcn5+8//ef/yZIBEumx9hNljkxc5/" +
                        "db03IMIMMxb////f4Z2/P+XUwrT34joBJgEgMmAOBYLAol5wSBCRAwG16tqYMAHhgHAXGH6EMYFwGAVA" +
                        "1JgY0WyqDrTzBYRAgTSgARICyQFDYrz2kGBIIkIEGBAfDxkmAgAqXjQLkALmDINGHgUFULyYXjCEVjkA" +
                        "YR4pH2ZSBAoAIXwADhbl5aUwRAswMCdIF3C5hiytJgkCTskwxGA4ABg4GCIQN1THLymBglL3ctqQoADn" +
                        "R9Gg63yCoNEBgoHDwWtS5I0wWIBoaDgLQkmCAub0SBQHZJbEQeMNANGpNwtenUBgg1wIApgESigGNcMs" +
                        "wQCg4EmDwCSCgaIgyBF/RNdhkMhDwDyEQHCoeNXAYwOF4EZeKgwIL7Quf3kBLpgUdBxjM1AwAuNDJUER" +
                        "j4Hzmf/K26g4COYhgaKEZg4APQ/4yHSYvrvbN+e2yrYzrVJoSBUn5+e/3+t/qyqsknf5koDj+f//7wZ/" +
                        "SzVZ3SeOaiKbXKVkpgGADgUAcwSARTAhAXFQbBkHg33HwjBUA5BQJxhZBchwEJgggWmA4A6gyQBGCgXM" +
                        "DhwMChJBQRkQzGJIonT/sGApgmIwLjQ9qDCROGEgJBgtgoICACDBkTzEICzBwSgwpzCAoj3E0TJUSTCM" +
                        "ByAIgMABQZZg4CZg2BESAgTAgVSEGV+OIY2DWZXwUEDYHB8YRAEYlAIDhpJQNiYVBpGkwnE4oDqCQEJE" +
                        "jD0I2BQ+DAeWSV8Z0KjOpXEioCjG5lGiKWzAwLMTDg3HNTDYTBQXUFD/+9RkaQT7rGBEg93jcAAADSAA" +
                        "AAEvIYEWz3eNwAAANIAAAARAuMFgVYgUBTCgwTJbAECGBQQPGQxaMzmrIJgbDAkGCYYGMgQjoDAozVAM" +
                        "ZHIaAYwUAlOCUrGuxyJJpKGWCIYGKhhCNY4bU6V6CQCSkQ2QoygJJN3iqBAqAIP/VWCxwAMkUPRuNUms" +
                        "wCAYbWcOkEwEJmcxXB79QAp2zSGY41VVbHL9c/7t3v6rwWHA7vM0kst4b//1tKcaAcioXRyZR6XlDvKB" +
                        "yACADMF4HABA2GBmByYCwRZgsgymAoAWYUQZRqSqlmG0DAChDTCrCuMDcB8wQQBTA8AMAQGsDpzkAfJ1" +
                        "F1TCcMwoOJu5XIkHhhOJQYHq7AoEYUBpAEEAOYNBQDQnMEBPMDg1AAORU4iPYxwE8yhB0qgIECqBgiMG" +
                        "gJgVuA6BAMAcwDCeJFgbDDIODLpazK0JzG4gDGkHQUAxgOAhgUDYVBUwrAMweCQwdEswFAZUpZsRDc6Q" +
                        "CjGguJAAWtAIJMDAdLhc8HsWAgLdoiEAGCBicKGWXY7gsMp8gDQkHmGJkGBxeZZEIoDCYKmDwqEFcoHZ" +
                        "swMmEA2gEJASQi4xgHQUHjAgRfddsTWBMGhdxQgRGHjoDiUFwGkASgJBK1btSxchx2y06qhqELIrJBs4" +
                        "XuxOGKKk1HV5MiYixMwEek0VWKIAgDmHAK/M9YkfZW6V2HpqHXplnP1/co7SUeFaaaipxefRuJa1h8HR" +
                        "vLDeU2761SgdsGoSAg7bfxiFAEwuCIHDMYSgOYnDwYSD2ZShEYsAMeLWYEDEYViOYpAqChwcoiFQwmCw" +
                        "kEpjcRqCmJSGYPGhgcKGHQidpxxgISBZFjyMMMDkyYMiQOmAQW65gUFJMAoCmCwgYpDyipuVYmICEncF" +
                        "wIYgFZg0CIgg4KEQaDAARBQxCCwuChEAkqTPKgCA4h6YGAgOA6hZiYWCETmAwWKBoWApcRiJcgeGzlzc" +
                        "wEEHgUvWCQebVw1yW+/JctYYyAfFRg1RRIgViY7/+9RkX4/6kWDHi7zbdAAADSAAAAEtDZMgDvdt2AAA" +
                        "NIAAAASAoLLQQVIQUuyYOFmFkQ0iJKGDB46DG8naPhg4wDgcCBxhgyCQVDZ614tupuWlXkYMNGTF7MRA" +
                        "AxSmlc9agtU8WnHtRvV2BlAEB6p1Lx0LSLjidEPRx9HoepB8xAQNOJyITMMBHpRrnIvjtaa62imBhZEB" +
                        "piQLFn8hzGxvuP///llKo1b1hGqaz+X85uzTM6xsfwwFw/MQgdMVxiMiy+McrvMm8iMGDTM1gDAwNGEI" +
                        "RGGIoGD4emGAPGDYLhQVDF+KzX8qDEkMDCkWDDEPjC8OTHAXzIwrTI4ezCgIjHkdjJ4szIQWwMTAOGlW" +
                        "4wJAJgYcAJegRAeYUnCZrhEYFgiW5WcnoXraUGAsYEhMYEhQYjDaYXhMYiiEDQ7MHg7MTAPMBgzTdLAB" +
                        "gIEzAkpDMABgwEQEFyfaKYQCTKTCh0KDxZg1cKDH0xgPFgtO5yoMIAFKsHEZlyGdabmEkphZcZ+UGHgC" +
                        "QwJBku0o2oi0KNaCmhiIASgxCJrRFiwlAzBAowwRNnMQKQsCX85TIYZQ5I2CIGNAQBo+BRdLk60nJ+GK" +
                        "SOkIUaEkIDH+Yi9d1/oJUxyEJqCgpwlH3JfOck8wjaWqMhJR4OElxCSsBC5dUfGiMIIBEDEosmaxtFlc" +
                        "rixnHu/y59u3r///1SxeKY4d/98xzleev//w5gw9r9lUxBTUVS8ZgogzGCQDqYDwUJi6B0HrUFKYmwDY" +
                        "OBIMFYMEwFQCC9RgBgDGA2BMYAIKBhPgcmm1Wn258mOhFGOQzDBfmAQMqgAQRBUFTAoRDAIHT21ajBEC" +
                        "TFQSwUJKgTXoFLoGAgFhQUzKZizekhTDIFh4Fh0CVrCIBl/FQBlymB4nGhrRGFgcGAIBIRICRQADAEAS" +
                        "2RQCQWBMwrUY00DMwaBIwyEQuUl+0d+AsDUMTGofNeakwOSzCAAbkmC4AVABhMNAgImHgoZMjZjE3GTh" +
                        "MukWGpQALsqcoQBMxIYzF8v/+9Rkbgb7vmTFg93jcAAADSAAAAEuEZUUz3uNwAAANIAAAAQMsolKEDAV" +
                        "ORSTu0IkETBQvMDiU0cqDDIvIifepWJQ90cAicxgc/GXxQk8zp8XlcKQM6SmAJhNCkMyEFUKC9E/aqTU" +
                        "EkgrMUOEMPIGKsIVWSgf6lgpfZhMDGRl4CQGDA+DgbuVV7lp+TJYBNqC0Rl1mr9Q+3Key3//vJuAYALH" +
                        "/+GvwzaYn3N3////UyX8pMf/98vVkTULu5NTj6QQCFQAAcAYYLYRxgCBymF2pgbR7cpkagwGCgByFQEU" +
                        "ERgWgTGBgA6YE4ABgAALGBuGOZKyWRlkhoGCyCECgByQF0wBwAxwAZro0AyEALGDqEAZ1QuBhagcmBwA" +
                        "a0VgrXuIfA0EcwTgTTAwC3MscH8OAlcd2IMLdpjO2vkwGQKTE8IzMGgCNM+RSVu0Cp0t3BgCpgYDAGEa" +
                        "BWYIwCBgsAItMSanp1gBcUxMSTUVoMIhaLkoAeVymcAkDKqqmMEH8+oTDYQlMUDNCpK2NV5xTIxYFDco" +
                        "MNnoEw4DlEmvzDR4EJg2W2HimakQph4ijyOhFPI62TKi65kKSEgzS1pO7+1OrDGEC+awKhlIFKGiwF7+" +
                        "VNJV4mMB2auFCw8DwAYbBDXJ2oy6GTV41DgqmIgih2tdqRNgJg4Tmmh0ZED5EDrKZcuw7/6+tNl9goEX" +
                        "4z7Ut3/5EhAHBIpQXF8v5z8lFwSH3gr6/WPOTS8pVZNPTcUriFWACAgEQgEGBEBEYJ4CZhoBGGNCiufJ" +
                        "5cBmVgumFkBYYFIG5gYgUmA4BsFQIw4DUwMQXQqEQYFLtBhtCUDwdwKD+MCYCYFALGBqAORAKGAqAIYA" +
                        "gIJg6iLGaOXSCgpAEAUTAAtOkuciMAQI8wIgRTAKCRMwcHUqgRNMSNjICAES/3HjBWBoMQEjgwWgHB4C" +
                        "KmaxOTD8xpvDAOHMMg0GIwXwEAUBarFRXqgqBgUgjLB4O8so2gcgw4JgN0gVF4uEkMDRWFF4dGVIc3wA" +
                        "UjFYET7/+9RkZ4X7mGVEs97jcAAADSAAAAEuqZUQr3uNyAAANIAAAATjGMPpCESaHMqZ5LRiMts1lFuo" +
                        "6KWwoAjCI1O4h0zmVFBoblDJqeWMxf8sNAxkUCYVQ5L6m6uUyQjYzetRpaLufrP/1JU9DEZ3NkD0wQGn" +
                        "tfABCVnHewYBRqauNY0S0NRkAw5vtI6Y4CjH7FMSA40mHmsUZZiRY63+vzsoyDSzk9jCvnvWMGEhQaFI" +
                        "e38f3hXTkMChy7bz//pu6Smhuw/PSdcKjAQLOMDECYwOAPzA3EkMgpmM8cIljCSC5BwPZgMANmBmBuYD" +
                        "QJo0A8YMAFydJgLBHGUGe4ahAihhIgZGBMBKYGQVAFAsCgK67jAgA9AABZiBB8mRAb8YJAFiVqtS4Y1N" +
                        "tKGAZxEAAIwAyZ38wagAEwYYiyV6wDfpaGCiEMYchhpgygQJyN87sB2b0NggAowMxXDKPDTMIoFppjQp" +
                        "z4gpmJI40ORzgHdM8nMWWrB3fZg6ztsqBAVMQjw5GvzHaEAgtEgGJAp/ZqJv4YsZJlCUmmiUPQcaCTFb" +
                        "c6+YYITBAHMnKc1Y7jER3CBE/Ldog/85HyYQmF2MaYIUZikvsX8pmOLzMcsgHLmGK9TmVWODIPMwlM3A" +
                        "LTGQtex9lCm5S2YbmMDk1+qAoKBoCFvKe9+7jRzFSLNfgUSE5fl0jAYeW5X1/eZXYIEIPMIhaO1L0/O2" +
                        "fzjBgUJBgkaRGq/919RjxgoNyqBb//2fntlUAEQD/feMegOb2LYVgAAABGBABsGALmAkC4YMYD5juIyH" +
                        "bkq+YnAbxMJWYGAHwiAEMAsCEvGDgOzAnAKMC4JcxSUOzN6CVMB8DYwRQHTAVBmFQDDASAaJgHzADAgC" +
                        "4ChglB2GKkV+YHAGI8B9LYer0kBDAI6apgSAJGTmBYDgSVyclSNDHnlQLQUMHomIEgQuTHo3HrM+74MA" +
                        "KMHMC0yKQTjBKAHREd+GI9HR0CrsMWHoxhiDF5jCoBeqkg+UvbRpOmPUWdBJRkoMiIDIqtf/+9RkYQb7" +
                        "CGVFM97jcAAADSAAAAEwFbEOD/uNyAAANIAAAAQoblCvoRIgzJYgQIwoHk14tYja5C9YhC4NGhrpSmHS" +
                        "EJAt5Jc0iUxpwnRMos820FVuVe7xxpn1RuMzJcmJMVtc53dMlqZWJ4dbTF4FVdTu262FeCAsLTALBMLA" +
                        "wHB9JODr9i3DDthYEmpQgSAZJiGx0HynL//X/k3UWLMHdz/f87YQbKwg+FjHWWeErcQHHKTtrr/uz29J" +
                        "2Le/HNoBh2gwBAAqAwByYDOAwGBJABphRYpEaXCKtmDCgYhgawFGYCKAMjoBYYAeAmFAEgYAuAOiMANM" +
                        "AmAazEQefMHQRMCBJGEgDUNA5hgHBVBmDgDDAOBBJQPjDVDdNEcu4wmgqgMAQxeMSiieAqg6iQFZgZCU" +
                        "A5mcFBghALDUW7GASAFAMEs+MAYFowpTizAcAyEgAoJcprj/Ok0cGgLmDuKGZFoZhg0AOsAf+BIS6wMB" +
                        "4OLhik8nS02GgQoWSXDWFtu43JxQSNREtTZT4MJCEMKYYLA4Ou1BLdEnTG5+NA4I1uWjGIgLeQqljys5" +
                        "IBBQDmMwOd1KJmoDlAEe+WMtfKRNyKgJMpYEwIZUxoZmquVarTFUPnO70YFCLTqXv6wmywEkjDNx0NBj" +
                        "J+rDIW7crSkuUZQjxmMggoPGCADD1Lclb+AkGgw0G2QyYXN7yLLLlQNe3z+71dbEDhHW3vV/LeqEQiVS" +
                        "OVTn/+ekCgMVJNKbP/V/dIWAgp/eX71vXf7z7e6zBfkqAEmA9MA4CgYBVMA8KwxaUvTXXY0MS0RcwXwZ" +
                        "DBpAiMAMBMSAsBQFxekwIANDBxAtM+P1OwxPMIgoMMAnMCRPFANGACKwSCocCEETCosD/QozCMRTAQC0" +
                        "tn9eqOvsQiCECGYcK0cahAYtA0EADIZeWxUCmYyGAWZqQcYgguIgeTwjsCVn+Z6IgLACOmAI5JVNYlc5" +
                        "SwY6IsLDEQWNLXMw+MC8jE37ZZKI27AJJ5lQ2HejKZDCA0FFLpXMRh//+9RkXg76mmVFC93jcAAADSAA" +
                        "AAEsxZMQD/eNwAAANIAAAATLhiQpmZ16ZvJhk4BkwUhykvQEkCYMExErjYCSMYh9d0Ryg6kv0zMTDbVB" +
                        "TSYNM3Lty5Zf8EAo2gu0JzQ5y3nrfGZMrNWA4yqJ1fxO0+nb0iCgJNElUx0LXKTSpdbuR9uIyQhAUBaH" +
                        "kQKZyjY8vcf/+dwUXGhvC8Ob3z8KcGAdScfq65v+YNbBIFpod7z/v74lNB/+5MwJgqALmARgIhgJQCCY" +
                        "EmAImETBCJoHgGMYM4AcGAfgEJgCYB6BgGEwAcAjbQHADCEQGARjbDDj9cGjDABDDUXhGQpgEDaRQYIp" +
                        "gOIpgACpgsgR+2+5icJRiCBxbVTB5aNGokEExHCUyCt46XFoaHooE6IyoGgYt2WI5GAQCGrskhBkmJoL" +
                        "kwQqfgVpDfpVuCYVquamCoIQBaxGZc+jLF2BYCmUxoY08hl8nCxNeaslopYSAuAgIYzP0eNBGk0QME+i" +
                        "IPkQehLlJYBQHCAvDmlDo6Z8Dj9vI0yONdKAmYbJxk5AG7GCY6FD7xCA21lnaQVBYMe5tEJsEi+Hf5bd" +
                        "wUKhwcIixPFgJbww1nUWwYcFJq4MmRhsNAph7DYCtTcALLNWAExkGjHoHLZyGm3MQG3pYHAGMgBHC1nE" +
                        "GA3Vy53//eiQDohW+Yfz9byIAkv7HHL+b/cgEYCrxLDX/ai/kgEhXD6AdYMeSUmINQAAMssAgQTAFBGM" +
                        "AYM0wQleDDTarMJsNIwEgbzA8BKHADjABAjMAkA8wPQEDAGArIQjDCOTAMbkO4GANhAcJgTARiQDZgDg" +
                        "PmAgAeCAAQaBEMAAGP0T0jMBgQR4EJOVdypSEAAYBBMEsAcwbyyDGNA2MCMCcSCHdu4oq4CgC8AoBUYs" +
                        "Q3xgGg0AgD1d8kY2kWlY18qADAEJsWPlFgJHzk0NrITkaarYZABJwVrmLjPK4o8Bc4kBBAFQwHmBgIYS" +
                        "PR6sqmQye0cSBaa1IqigJAQnMVhoyItDSidAhcj/+9RkbgT7r2TEk97jcgAADSAAAAEtlZUUz3eNwAAA" +
                        "NIAAAAQuNK9cpHwUAAGBYECxu8FCR/VzDUmeSKy+QA0KmHhWLVJbtPG3fw5alJhkjm9iyYBAg8AIrD+H" +
                        "NbJQIYDHRoAcGEh0yOLt2hjLHJjRmUNGjRaUJ9KbDHvJUrYYDGpr5JgUeDwwlybKnNjvMP5YiQWEpENY" +
                        "r3dz93OwyJCJCB9IKpe447mHKMGBWy4H/h/Z7IsATD4L5vxUcdPVAgABNJHAASUA8wSgWjFFEpO0cboy" +
                        "GwAQwRgwGwKQ4EsHAHGA6AeYDQA4hAYMAICA1p+I2OLoUD8wJBcwMCxQIKhOLBaYChMYCAIFxoNoI9ME" +
                        "whJhDMAAKTcZiYBg9FzCcKCgyjAh2DIUKDDcDDAEAqfBIJmyh9wwFDo1zTEAhKNDaTA9IHbBgEA4BBIX" +
                        "wKDZEA4lxACKiNyjMVAAwECgUJBI4GHQua+U4FEZEEpmDQCIQqHxGGxYBjgyMRos2WmjGI8XWJB1XKt4" +
                        "qCX+MMBZSwwrEDNo5MNBABCNykKEBAsAU4QoHzBozMuD4FJCemUgkhAQBL/qqmQEUajCreXlbE4/q0zo" +
                        "gAKg6nmJAEjgwWCLljuD/mIRkVo4y0O0yEU17Q939MbMPIcwaWxURgoRyD/xrOGKGsWE5i4ZgYIu+IwB" +
                        "B////+uoT1H5FvPG/+tR0KBNjurG8dfrN0CYXT05//rLek7p3tMILcQNXpVAsEGAUQjhoJQwDgqEJhOJ" +
                        "hi5RZ/NphiwHphCIxh4JJb0wuA4wxAoSEAaA4wqDU1GmT1g8MGBdXIhIRKBETRQOMtJQUYDFp7OcCIUI" +
                        "8EwcBALWiYCJ5gMimkiCabLJh2kGbRUCQaxeF2xEESsGioAL3MsNsHoVCZgcaNpT8GQgYADRg0OAoamI" +
                        "T4cqDY0qIrcfpNMwcCDCguBoJMOCchtxkg7CQLgSUmGAgFAsYYF6Y4BDxgNBm7AQZmA6XymhWEhkQhAD" +
                        "S8MEi9aRjkDGfQMBRKDi0MD/+9RkaoD7SmTG07zjcAAADSAAAAEtpZUWL3dtwAAANIAAAARgmELD4DTr" +
                        "biQg0xcUSABy56wSERYXx697PjDhAMXi5ZrgJlhxbnvtx8QkczkljDgCCAwkiiKoJO0GBKCyEXGRgUkm" +
                        "X4QFuVDXdTKsxgoqGLyEW9LZvnjzKrGyqFQdFjKYFLpSkqAF57/4f/1YIHBCYrDEooLWN6zli6YwIV15" +
                        "xGB/vaxjxVAQGTCXqnP/+tf9HZPagBBAB5gUgdGBkC4YLYKZgWktG9EdOYMQDhgfgChAQhgOAZDoHoFA" +
                        "EEgYwSA+YDgNJjjv5oEGJiMCb/mCIHO+j6YMg6BAaMUBMMKSZOoDbMLwRQkmF4CgIi3WBgFAkETDoOzE" +
                        "cQjCdmDE8LiYHzDQAGuWiqARg2JAKDMDCmYBgYapkyYEBYKhKTADLngLnhAnAUCgcCZgKbRkcDQWAOtW" +
                        "9EEzslMEBBooEIoa6zmlBBeivmYSEKGmbByyGRmDjh+RqiwwhIoMCgAAApaL0jhMneY7ktgM/CHQMNBU" +
                        "b0zkxmsLUMQEzr0QzkEjq+zCi8lGjAQxQiHSUUMa8jCg0vSIwYACoYTb1GemEABto+Z+Ahh6ugvyPEFm" +
                        "tUKoKDVw0okCosIhQvcPAFJfwrvgZKLq1lgWFBCf//+MggUOZDDQQ5pNEi60L8MsN/vJRsWMHt08msP/" +
                        "8lMHulbv0fPw39ORBdO5///8/2ezlvStVXJqAAAAFBwQxgEAAGB0DQYHgC5ibjKGpaOuYRIOSA8wIABi" +
                        "ABwwHAECIEACAFDQJBguiImQcfhDPmKgCmAwPDIHjgOhYDhINAIHRgkKJjaERsGTojAMaB5CSAgmzEQO" +
                        "gAJEEhgeIoMU4waDAvEBQTb+MMJMCQJMJAOAwdmNQKBiGGFoHl+X/f1k6aJgCGINCkWBEwwKIIBYeBJx" +
                        "lYIZBgFAgCI5ZoxIXAH4VlUqmbueMgeN4OMgPAy9cohcGlYoLzK/2BGQRAwis9hrtm8PnAOJIl7RAFQf" +
                        "MqGIlj3/+9RkbQD7RWXGm93TcAAADSAAAAEtKZcfT3dtwAAANIAAAARqYAwmdZYPgHyXwYIkYgcKoYbn" +
                        "1VDe2g+6562zFjxYvM1JLWRONk0MMFCCI8vFAKi7/Tt92TEHgCVa+a0aapUTIIP13CC1ijUUSvoaxmtv" +
                        "tSDSoOL3Argtd/5AnnzJwbP/9G0k0iNZiR40Fpsu1c5gwpZ1CQKHMoI7bp71mHChKvtp3///+mFw7FN1" +
                        "Pve3WAECQQAAAgNBAMC0DYwTQEzBmCjMNIx82UwfDBtA7MAcAkwHATSwAsNAfgYAEwAQB0AhgLEfnCpf" +
                        "FCjGEAHmBIBiIBzAYDhEChgOBBggHxgq6JjOKRlKHRiOEqGphMEalrSTAMLBgKjIE4zL4EDI8NzBsNlw" +
                        "mA4IKbu4qMwOBQyFCsyhEgwZE0wTCZR67RxgRgKWAKMADDMbQWMBwMMAxWAwrJxSmatgQNCTlN/CgE1I" +
                        "cgiGTvltNAQBDjZ5sKDpMvPQFQkwsgEhKC7heg7NpMKPyIbqsaCp4ZQIzsBGCCRoIiaYajyQ+1x+TDiQ" +
                        "BCbthUDMhLkCQY8NS1ESgRLltCYYZAsLdgb7FlRQZHXkFQY1A4DgQSCpT344FwIBGQwAGpJRhJeUAt7/" +
                        "/GoIRABRQ0WQvHv3GkLaUiBBYMTHzbE9/7Zlr/3uClIWYQ8GeG8dbWi3pYAw4bpdZ9wxrEQGwsSCMf//" +
                        "/4/m0DiYgpqKZlxyc0AMAkBcWBKFgMDCpCJMMwmU5bwVTDtA3AoIBgRgKGBAAGAgQQMBOYAgB5gNgCGE" +
                        "IZOdoiuYUAYYDBqYFA45JgWIZAChg4IJgiQBiJXodSZKUo8YxgCBZgAA40Cy0TA4JRAARhdRZikJ5iMA" +
                        "5hkDxg4AocBL5SJRYDCSYMRCY8j4ChdMABOGgIhqMtGGARMDASMxkoMyQ0MDAAMEALGQQc4cAMvagsYQ" +
                        "hUZOARnMKDwkWmYYHoYA2dROyYBBJqxGmbRSYHBk8CAiW6Y5ERgCBUIGcJSVRWHAKG1HjBb/+9Rkbg37" +
                        "0GXGC93jcAAADSAAAAEucZcWD3eNwAAANIAAAAQVijvqyGEw8Y6lJgwyhwpgqLaFhAWSdcSGhhd1iEtg" +
                        "olO5ZfQwmCiQIK+WQZ5VJl0giwLkr1P8mUvpFZLYziazCprY8OgCizwYmWhJQsaJBaA4oBOrOs6CAxAF" +
                        "DLhVASUdS/ruaRabxhMBmXjWYYDaUUw0KX5ISbvf/dZ3cJeLBDHv/+sbL6g4STvf/86CGJgiBP//8/5T" +
                        "Biked7oxqgUAgimLA4joVZhtkKnU6EYYSIFJguAZEABBgRgFr9AoAJgcAEGA+AQYPw24/rwYeANDMwrD" +
                        "NMoDCaBQFMKggMQwFMPJtN9w6MOCRAwtCELQAD40ETHwsEZgmGxj1IJqGPZhaIJh4JKsD3O4u8vIChnM" +
                        "XH3M4gMMBgDC4UlYLSt3GXmAADGFI3GLsDGLwWGJgRkQmhwewMjY3EvkWAIMnZAGn4wyAWiAIWBBGS6U" +
                        "pGgKMjMyNaDN5sGAOPAoMBZhAB7f4dBpmEQmQJgYxLxg4Cv04Y6CU4BCCC1iEk1BBBULAYZ0UuaMCgeE" +
                        "BCcMHj02wcgCJjCALjPaEAANSDehUAGdAyKBcoGUfS9ZSo8DgsvFFI4ELTKIEGQGhzrYYpSr0FQ4aoBJ" +
                        "ggOqa/nrO5DRUEhqE4DoHatlypijYIAMYJFZs0dGNxpLofoIw3Qu9W//+rTaQ/GhDY///CenmqBQDzmX" +
                        "/3KpStij9Nv/5/6bBBeWKpsiNcAAAQAwBQOgoA6YBwFxgJgUmJkP2dMIGBgogFmAcACgGMAIBItOYAwA" +
                        "YNAmMBUH8wkAxTRnBLMDoAkCgXmAoAoAgDjAjAdJAGTAiABKgCJhrAlmReDaHAqBcBAwAwOxgBktsMgR" +
                        "mBQCkYIoB5hABVgo+cwFwdxEA6CgBk7XIYOhgYBIRpEQYYYgCRgEAgCwCyrIi+DcxABQYB4ARglhKGIg" +
                        "BkCANRIB+XtxAQGxIAsWYJQJAfNG0GAGDGAF8AcJJbx8y9FMYFDi3A7/+9RkZQT73mVFw97bcAAADSAA" +
                        "AAErOZcY73eNwAAANIAAAARBGCouimHL7xNSpCURNQVDoXoyReMrAOyhSJakSOxYzTmOLSDClIEibV6N" +
                        "u4QHI9rnMGODy4gAJwsGMe3HnaJgGGWUnltQkSoVROBHIkhWAo+GnIx064YuGA4CGACLczKgO4pKKAtC" +
                        "GQp1pzv/uXjJgdkMmPCaWdjLG2hxUwBhieQCGLH7ydykcSKBF+8v//x4SALe65//jhqGwwOr0Xf1hcp1" +
                        "5lA3f5///8tJ5HkKe7UkUQAAAEMAAIQIjARAKMA4EswQAAzljAtDApjAhAhMCYAUcADQ4tcJAKwoDCYA" +
                        "Y2QL7siDdTEIK6GwIGqkUUTBMPgu4xwCFQ0CsqIArYnMAAPhoagAL5iAyxqiDhgkVpgGFJg2DBeFX5aB" +
                        "1QoN5g4+wckIODVIV+J2XPkFQGEAGGP61mPQSmDQEioCVpSYIBGqsIA/LADhaugEGBBAhjTLn4aQYeJB" +
                        "g8GBaJkoHMDAMxSHAcPnu+WLDGEBuYgiZhsaiwof99WzxMHJQLBB0TFTrMIjcxULw4Tyx9c2lNVMJhcy" +
                        "M3TBIbIgg1enrRtyZoRiUx0fSIIRmxp+4goqKAQKkMzEWQCPXRZHKs9Mhhy8ZoHo8KXDr63hddAChAyC" +
                        "bgCEEor2vsJ7UohDJm8hhiSbPY3S5jwWf7n///6+XGx/+c7YnVsl2LGXO8vdlBUBLKt6////5W5qsItU" +
                        "lUAUEMAUAwwIAJQQDmYQw+B2riAGCyA0IQHDAzAYIgJjAXACSgHQcSgDMwTDYjQREgVgEIBhgcAmjQDZ" +
                        "gEAO2h0AkZAkMJAxAxoQwAgB18jAKAfCAH3fAQFZguAUmBIA6QE/GEKBAYIAAosCWnEtRWNBILAHmAsA" +
                        "mYKZCxhrhTmC4BUv2Wyhy1MDADAhMA4BQwfB1zDDBHMEwBUwOAB4S1owCQJjAFAXMAMCokAnNTPMIzRi" +
                        "YBts7qM7PoeMdkEwORzQA2NrlcwCGx5HLufeNOn/+9RkaAH76GZFC97jcAAADSAAAAErfZcVD3eNwAAA" +
                        "NIAAAAQIguYVChnBeGRyqrO5TzPMIhUZXGpggMmAQsaAlxlMskodHh1F6dlMoRtEiCY6fgUEKJcFTkrj" +
                        "r2T44BwamCUQlYBaW/yvL9wqAgwAMzK6aMQEuDk6MdWq0uIAMafPlcBAzuXa19RRBs0QHzFQsk+WX4Cw" +
                        "BUtBg5MpCgwkCI/O44x0wYAZbZ/n//HrFgjPc/Heu/GAUGdWf/ePMUdSYE493//3mVWi+ukcBawgGEIA" +
                        "BAulbYFAkMGkJsQH+HTCEmEAJmAoASLAdAQDNB1XhgOAJmB2AYYFyGh26H5hwApEDhhQIhgqARICrEhA" +
                        "BohFIwf7YILgSAkMBcwIAQwTABG9wURxwJjDOADPYXDGAQAECz/wJJ4ca8YMCMZVlsGY0Y0BC7K3ZVBa" +
                        "2hwKyAFzLBQDPcCBYO2FSmHy0IjA1AMYCC4Y82AVGIKH6V0MxpOcKAQMFJhYqGO9IYgHpisVkwGd1Wxt" +
                        "I0BRICBMaLfxmAFCxbcxo8uHQgYjCiCxbE12YjOQuMcidBND9D1ZJQD0ojP6hMeDQeB07MQzMWmkEgnE" +
                        "MbMMD5rCuIZU5sXR0EGCRWYSUKiakEL5N37tZuRn5OiEWEwdncsM5huyeJl0SmTATT0fPzZNApCCRhig" +
                        "oqyC3+6dEeBbXPx//ekWE2HP5++2ok1qF46/P5vJ9YLy/X///E3DvOtpW48sNkTxGA8YDgAJgaAcGQpB" +
                        "0eI4XQcLgIQBjAfAMMDQAcwLgIwIAMBAWjAdAyMBtkQ79PYAguY+g6YsgCrYIARVEmmYdDYZr+od2E0K" +
                        "hCJAmYGCMGBQt8EB9E1mmK4zHChBGSQpA0HGiv1XfZZRiCIJgJD5pWKRgMA4YByVLzOYscFAgYXhqYD3" +
                        "AEFMChVRSelpYUAoQgohmIRmNI4o3EejMY5BRUdogAjOEbjBgkMVio4atzNBCCC01xoTGjA4NcktyKn8" +
                        "yrpzLB4AoIbq3aIreBSbdIL/+9RkaY/7l23EA93jcAAADSAAAAEv7a8OD3eNyAAANIAAAASA81VdwKfg" +
                        "wAgItxCkm3cAyBAoUNFMU1GDEWWvxODJXFpSQgk2tKDNppEgCJDdi6SNqkTeBwDMRO4xaXx4Oos7uZzU" +
                        "fLVGjykZPIRQYeYZ2ImnY7xzQmmJjGRCO5vVcvjdQYM1LgmAUNWu1CoAwMIoxOZ//fyrEQ9mcv//mMJW" +
                        "JAKFb/lTlJNJPjQyo/yx//4o6UAO/h/93lre+/X5y3jQCQLDAqAoHQYDBxCIMcemI9owjDDqBZMCQE4w" +
                        "RgGTArASMCsAZIwwOwPxEDEYRTgBnGeQEEMx0GoWJBK9EhQYtMYGkwYc1sfYBiYKgaoaIyIMSQPQXMDR" +
                        "bViMBhFMhabOGiMMKBOMCgmGgFak1GgaCYGG+YuYaZoCeBgBUyXRF1yITzAIRAwMjT9RjQQCAgG0WFP3" +
                        "gSBRKCxbUqiWa36pz4AGJwoYSBMoQZe0LgEEocZVprr+mJCoAQoYAHDQBGDTI4GUahseHBzpLmryIDmI" +
                        "x9UDSQsDTIRAAgBMLjwxJWjAwIMIDkKAKVyd1WMGRQIYEKBpOxAgaiQTgjk/K2rKxoGm4SCaIMRgUCoT" +
                        "i8BfSb2vIQAsza/TBJiWqCgU/NqzPRkKjkw+4wIXTCIRZtS2r0laYIhuctLJnAQDw2in/dLbZJFGUWeT" +
                        "AaMaw04IONELluX/38Ed0w3mxy5/44OyHDBs3f+zRdgBDiAhxKdbw/m9Id3Yt5fr95c/n2b/TLbqQAMB" +
                        "TMC0AsMAiEYJ4Ug0OdkIEwUABzAfAmQiMA4CYgARi5gDAYmAUBoYVadgtzocL5gwIZguFDJUQmLo7Dgy" +
                        "mXKIneQkkwppOlUNDB0IHLMGAkTSAI2mH1shwVCQ3iwwEwEI1IoIVgwHDAYOjGImTSAaSIEpS+0Mv0n6" +
                        "BQQEATGTLTmZwNjQNL1tQIhLJALWSYQACZCtpnkhDI+BRvjCadMu0wuTBgsGeowaXIAkRQCQAMJC9oOA" +
                        "EeXKDS3/+9RkXgT7GmXEi93jdgAADSAAAAEvqZkS73eNwAAANIAAAAQaPthhcigIetiae/yUhh4TuSYC" +
                        "EptULmUgqYVEokQNSmSJukwcHCSFn+YGC4cGqXKI5w/BxKBTa0bGmwNEoBBl2mt8fhuxYARqZDA4EtDL" +
                        "i2seTMoCw/MwhowAATBoGnv/OMM3ScNGC8vQrFM631QmEjoRMZHYiF7+0v3VkDAFyv/3+/XlpMHoP5//" +
                        "y1abIh/R8//7/W4BAZsZ/v//NuokAL3FXfw/YgIQAAAMQABGBAASKglmCwBAYrULRx2hTGBeAaYA4Hpg" +
                        "WAGEwAIXAMVMIwQ1uGBCg0cFEkYYgIY2hoYGBytsqAg19DkDBfMFIhNgiRMPwEMAwHMBweBQ6pcA4MxY" +
                        "ADA0ezFh7TWcTzGouTIgRzAIAkawoAyIZgULxiGP5kU/RnsRoYMSwrQ2os3SNCoIigNGADLmKoYoVSmw" +
                        "8Q4AJUAURgKIxeNEUQ1SVjDBkGk8yxQ50jA4IMNBsxqJTQNYMzF8vSDRgYaBZhEDhAhiLBzAopNAts0A" +
                        "H2bNWykSbRisKM+BQMMfNUyGHhgFllZiIU8fQlGFxAakUBjMlKcXH/poOnJlAgZLSQjGpgoKAoJQO2a2" +
                        "OgJlCpDTpzBgGa0X+7nlYggkA5mxOgImhwNlsvt/UlIyDzIomJiFNU/M4+q+aayY8OZiwNQfYzweIrAs" +
                        "Uy//5nKBwAGHBA8mVjuFeMWI2YbBjF6K18ai8Tl4qCAcN5dzL+f+3QTVvfag0eihCYoAIAABLuDQD4qB" +
                        "GYCIGxhWunG1CGIVAKDAABVSrAoHJgQAQhAA5gAgMhYBYwbSbDugPzJMDyYTE9HjMAgiQ4iwVmBIqmH9" +
                        "rmQwoGDoFQhhzBGGkIBxswNFcwNKU1xC4ACuSgamkriOIcACApjaDxiFABlOG4CEpkrMkUKrVDAIGyoK" +
                        "5iMQhnOLTVlHmov+sIl0TAEYNgkYJqRjgYGNCoYnADcGeJUqmlJjIlmS46ZqM4cT0xDAYTL/+9RkW4b7" +
                        "O21FQ93jcAAADSAAAAEtHY0WD3dtwAAANIAAAATPOmsduAkFDNTvMdhFlgNAbfxFZebBTA48MYOQyych" +
                        "4WoVtEgd0XYUdMACU1KWjGQfiiOd/Kafd6FvBZdmNQMwEWDqgbbt0EQPgkMExpAuBhkSTXLLMcUh5KmQ" +
                        "YdQxEGEoUJ8itOg1iHEPzKAcARLLvxCXxiMqUQao4Y1HhjcILMz19Mji9v8+V67qRBcF853n8lfxAaFF" +
                        "bncsKlikj5ebf7+vf/Ws///338/1rP/3VQwJIYDA2mBeCGYRzmhqzg2GDoA6YBoFYsAS3g4A4YDgFBga" +
                        "AJBQB4wdQ2jyonTGAdDEIMTAACQ4GwIFAKCAHB6YNhYYByCZ0hGYaCYgwW7L+joKAAGBEB5hGEpjIrhr" +
                        "OLxgEDq0R4M0cUN0LgEGhigJpmyYBm+MCQbnBYFg4TUBgUCABDoSA2YNLcYBg8NAwYBgPvqeg6DJgiAZ" +
                        "h8CZ0KqbgWmSJhgYOmMjSt0xQMJAIGkRvFmBgsx8BApIh6UBkkUAU7MnCzPMgxkMd0LBiuGYLOirHUBp" +
                        "soYKFNdKxEplgODFL0EAQTGmV4KIxgFCAKaoomyN2isRM+ogCvI+KcJwLkd5IRc5EAD3GMDpgQci9CNs" +
                        "wKBEvIQCA4tmJgIsEFQHIgvKDL6B8Cm/m4jGwcNP+7MCp3tTVcgKNQRRY4SZtc+ontO9/6kv/dhR63//" +
                        "/3Ox4SAsOf+8fr1VYf//ob4bJZMoyACTd2WqQBAMgBEp8wKDy54CG4GEgVwhzU7mZyCQFY0IVjGIbMfi" +
                        "8w2CTAIDR5MViM4gKLQBYQMRBQCBmDgJZ8eBjECYzYxNfPTBwYQhgCBAhgLAMXptkRAWF5Spgaz0YzEi" +
                        "AxICU8HB6+zCzMFH8CTTPIZGARCQxUUADDQoxIMEgyBpfbp4YpkJBgpYqPLURVlbvA0aYcCShUOBgGRp" +
                        "QC0C9zk3ZS7ktBgRFtU6e4GB0aGC14IL6K4MkbLSkQpKtoagjiKPqnH/+9RkYQD5xGPLU5vTcAAADSAA" +
                        "AAEsrZEiD3NtyAAANIAAAAQIUCHiEAvRWF3LFJGXmBwwifMCEjAsbQTpdptK8S/a2CC6IKNq13EjEAJH" +
                        "ggItsw5wSAokRmEonruAxguwIghIKBBhYRhwIEFqAUAQLUHCxAAghQLKdc/Xd/hXgONRvKVLtou77r7u" +
                        "5Whxc63vXdcwycL///pJ8WA5bkFAHQwDgwIRAjDHD0MK0MwwHk6jKEFpMK8LgaD7MBMDAwBAJzAxAcMC" +
                        "IC8xMEQMNoHKB4YzBhi4gGKQeZnOBlvjHcgMaEH5i4ugIlhQHAoLGFwYk1Bjql5Qw5CodBwHMilYBcsz" +
                        "MRQUmTFgNDBMYWAJhkFNdglYJOIaBaShgELDwcMDjQ3q+TBgzEiAzwaAwwDjAQEScc4MFzDhorOJay1C" +
                        "UZwUmyTgBEUOoXBBUAVWdKVypmRKFAASEIeYomhiYaAumPrwBCgMNpvGPgAcCtylzI0wkxR4GBgWKBpW" +
                        "dDiucKFBAGka8qIIgAYu/MbYYDQRIJA0MGDGB0cPzaw0dCgsMmKB6uTCxAMPocRqWGTvXWxBnRdwEiI0" +
                        "ZAocaACAcWEDCxIMC1BwwNHQIxUALRKrJ1mIAxg6yDAAGB6eBZ1TRg1Wdq9+7bj7S1ObGsuf////+PKs" +
                        "n5////r/3leqv9CtTJiCmopmXHJyQFDC2ODQwlNVVVVVVVVVVVVVVVVVVVVVVVVVVQAAMFALCwDJgMAF" +
                        "IQGByA0YKYEZgYgTGCarsZ8gCJgxA+GBuAKYFIEhgEABCwHIYACDgO2JAgDQKWAKBRuKBEFAs1rkzpQb" +
                        "HRMOlwx0FjAYdMKDIwIB2ztVHAEKAlrBhQKpcmIiyaU7JiozmGByBgOW9BgcBQObWVqJFsyYdsBbkjWj" +
                        "gb0IxhcSjQBSqMPiIwyMzLQtTqS9MCDwAUBcLa8pMdBAwcMt/SYbRjQ6jBKYEjlm4QyddwiFgIBjo2FA" +
                        "Uw0KIBg/QrATJIkbAMNGXDTQlkSuyIgK664ECRD/+9Rkbg77KmNIE9zbcgAADSAAAAEtGZMcD3eNwAAA" +
                        "NIAAAASBCNRN+CBYwCCsdAUESFFBTv8k8uJegVBC64cDGUmIKtgEnCARX4FwBYNQZ0oAVlEgRibpPuXH" +
                        "MsrRCHiILVsZOYEFBgoqi4LyPow1Pp/gSDBQdBDuJERgokuFdaj4cBxqnws/O9eYCC5MZZw/HqWxU3lh" +
                        "vcTm6gCAF1QdrleX288u/lhuq5IfjtpwNAhMCUDVL0KgVBgBpgkAVmR2oIa4QWRgCCYGESB4MAGjAHRg" +
                        "WgJq1AwETAgBUA4OK0RgMYCgOKg2YZDCYzd2CRdBofmFQLjQRmBgGGHACDAGJRNxKgGGAwEoRGCADFqQ" +
                        "KAhmY1hmaEQKQEoEtniHIw7AFyHKZoVQFMMgSCoGCgvF5wsGRrmZhigCaa66DCUPCUMyAEgwBqQQgggB" +
                        "QKQTnMJIQoZLF5mV3GECM7aphAHhASCITqMTcpIBEJFQv4MAgLhswgPDg57FgswUmAYOBpi8XIWNrYlQ" +
                        "oQFU6ytieRhoKHLgWNB0YAjTTAoOABHU/Lca5MCmmhAMRaTAFG+DmcXlHQALAhJUxOHW3dnryEwgIgVK" +
                        "nbAoCMIH0wyMk+rL4AgeDyFAAMg6m0FwUEBxgKwSSRkYdB0SL5QwqiSC8ymBHfoaXDLLtK1gmBX/jQSb" +
                        "n//61ueGQcrTjrc3J/////7JBkBSq11MQU1FMy45OSAoYWxwaBwABhhgxAGlgCNAgYBwApgmAMGEONYc" +
                        "HABhgdDSBYBQwAgFk5zB7ABQZAgBGCAUEAFmO4ODgNGFoIM1MABhMmHZPQxfMkgJLAamDoBhQOjGQHzA" +
                        "ABoGbEOgYYUhgDhaQkqTMCwXNtXyB0MmAQGgYDhGAIyJBieC7T4FjYoAwcWJhACpgqDI8BxguE5wQ7YC" +
                        "IMvVTGB4HGDooiECGlPyFwuQCcaMbB34iDqHIpyBkKNANMUlAhgk0BgcZu2RNYkIgcAFdBAOJQcYPK5u" +
                        "tyI8ryMCAEDBIw4Y064RbjD/+9Rkbg/7nGRGA93jcAAADSAAAAEvIY8WD3uNwAAANIAAAARgkaJ7OoBQ" +
                        "FFQoljORJSZGAOBAAncYDJCMXcnJGhIrehoiokkOs8wGDkQQAAU6R0IGLjkWYkifCGZiceLqrxkSEhiF" +
                        "6lQMyWmaQVB4CAMGB2dxbKBSCLEFvXEHQYCWIZ1Cg4D2xuKOk8OLqdtrPX/jBRVBifW/5NLcx//3cmrz" +
                        "sg0DpA2uextcff/n//wYo/FJ1mUttHtapl1owUwPAcAoQgFGAqAIYFgCpipo6nJYFOYGw5xgSAkAQAsK" +
                        "AYgkCRWZ2jAHAKVoMEQBslADAACgUAVMBEHAxPEFDJrAcJgXhgBAmAMLAMBgMAXoir0nRAAsYHwCjbEo" +
                        "AoBACJAczAaM3MH4C9NRmbmDgDgOD/KABphsrJzB5A/MAUAAwEAJAEBEYCwChiYk8GAGAIjWzARAMmBk" +
                        "A+XqsQIEAghHpgoUR+CGoGDA6eNdgIFyYzUoFMRnEHCmLuhIjAYkAREQJo4q1GCBufwDoYUE12nBUECq" +
                        "UVWidNJRgIDQ8fK0IgCSkg6aTy5S/QSCCQBAQpqi/FO4QEcoNZgAEjwNQ8MINc1oEHhZLDYoTDVAzDjQ" +
                        "shMYVFICQ7sz7MB4JGOzWY8AyeW1UBQImeREhQ8srcgxMPB4aw6sEXcMlpgyIOi54cA14GBg2ZgCQhAM" +
                        "OY5c/ekETNP/BmaNPf/us6HlKCAuxexnpAuAM/5z//cBJuM1fY3eQqklctxTAaCTKwHTAIACDAXjBSAn" +
                        "MPWA04ThRzC6GmMJIFAwIgAywAeCg6S/CsTuoBTCBAqBgBYQAIKASgQEoxI1qDDaDWFAETAWAYEgEDAF" +
                        "BoMB0AtdLQVURCBQPA5iQDSQwEAPMCUDQx2hMgUNMYJQCKQTFR4AYSFGQuoX0LAJ5gSgXCQC4sCOXdAI" +
                        "Chg0FdjAC7cpahkYCIWgOBAkToICiAFyZMVqyQVABKw4uPMwZCNkcGINmHQ0kwnssgZuQNAUSGmXt2HA" +
                        "JGBqNKz/+9RkZY/8AGRFA97rcAAADSAAAAEsrZkWD3eNwAAANIAAAAT7MAwAiL9IJTDUaR4JYtZxCoOE" +
                        "wwLASUGAAYTiuasjoAQLT4UNMAgcMRxUr0mMKMExAAwzIGQ2W6HSzMygTbWBmcmAoIGQogjQk0y5hCE5" +
                        "jgCBQA25QOhKYmjWUIpO10OwiFEwiGYHCCsNdeIw1G1xbzK0EphGLZmoArMR4DkbgAGQQloUAliuGf6/" +
                        "FDwoAz/9R0SAeRb//xmbT7CIFl7Y99KVFj/w5+/zwLPU9mMUx70mktYNQSp1mBIA8JAjsjMAkBgwCAdz" +
                        "D7qRNQoCUwpg3DCuA6MAwAsVAmMDwBFdj61XqMKArWcoSPAcYdAWagnIc/BEZEgmAgwRsMAwyMVwUZ1L" +
                        "3CKgHCIUF0KYDoFmBQxGwdbGeAdBwFtIbmn+Y9gZD0hf4KAuY/BMmwYKAOCgCEYYGQkWAoYpTLnRJRQD" +
                        "CUDgIgJny9jMgBkk635gcQHwSqYwCiEphq5jAB4MRgImAFaHggCGAAE2jlomGFTecpUBicBooM4XeY2F" +
                        "LjSmSEoJMRlceDrPLCBQNUZswnFuWfSsQhgzQMX7pI2pQYeAwGBjVWZRYxAVxLOLgft8DAADMWEweILY" +
                        "k1RQGmGxssJH3gLAjC5PAWgazTO8YEEAdISgEOjSSMx0PCYDRmVIJSqrRQP5UizyErDSUJAC0DX//++y" +
                        "kb/M51PKRc//1QY2AUAk4LfOvCTAjmtc///YwBYxa7qpFGqqU46pKgEABOmAEAIYCIIAIAEMAEC0LgWC" +
                        "EH8wm6+zJSBpMG8Acw9gFDAaAZAoDBgpgHsnclnQUAIMEsDxoyE0LgIGAcCiYVaJJisBIhwGIVADYuiC" +
                        "YMoATFmuRwGAcA4DUiA4YCBQCCqE+Yg5mZhVApigASmsvUFMGMAF1a1YQABGBcBelwYCIDidIWALMU0e" +
                        "Nry/pKXsMDEDYFBoDQGMqVSMEEgGAeBqVuYIBB2JbCELoiyJ3DB5CMICFYemd8lIBh4KyKH/+9RkYIv7" +
                        "SmZFq97jcAAADSAAAAEtOZsUD3eNwAAANIAAAATVTGECyd0PA0KW/eueMVlxICVxAsBUxEOQ4WPct2Gg" +
                        "UKTtAbVC87kN0MBlpWCnxeIxeZSIEPvDzKjBRSNVBOWWsRCEDACRdHaUbVhEJB4QU8wVQaYsKISCJ61S" +
                        "ipeAIxcaGr6nSDKoL8gT7MrJ8DQZrjwEADMAjQAC8vOzXW+c1xRdZnedWwmlZ7v/yw5MjofiOXO3EScP" +
                        "y///6zWH5vf8wxyUlVwKFkrDgJjACAXMFYCoQATmAEBKIwNjBRCrMeK7Ex0xwTB7CVMYgCUwHgBACAoY" +
                        "FQEkWfyTjIIERskwUlnwAAxhqJ5rJmpxmIphUAhheAquwcAqeg6ALsLAlURDF0AyIKF3EQCmFIrgM/RK" +
                        "MxoVGXJ8gAKjDsIJm+7YoEBh0ACAEwED9L4iBI28WwMINM2FDASGFwdAYaCgCIYRuMOj4w4GHOwZIME4" +
                        "5bMQwcFYBhMFIemSAeTC9VSFmAQoVAYtdwEQwAcjUjpAwITDjwUAJgspkQdrU4hDJjoBmBge+r1CoFCy" +
                        "gOACMvM9MkSaMKHdEWNRRVMhCalzN4GdIEpY4oRmmxO0/ZjdFEQjfdJhBow6EiYe3KsPmREwaoIpa50W" +
                        "4BAKMqhpobuU6hxIC1BX4dleRDGDHICYLKkMWSmfRQ1+U/z+6zLATguxnSMyDBLIN//3Zn64MA6WfO/U" +
                        "h3vdd/f/milLKP/eJQn3HCtkEgEAAGAFJUGDCBUngYEoFIkBAYCoARiPR7mjSBMYH4oJiLAOmBIBgYAI" +
                        "DxgHgEqkZDHiEATDEbS9aXQYEBgyLRq1whwGGRi0AhgiABhGC4MBgOR0wMABxIfEgHBxNFv0BxAA5gEK" +
                        "BoXqBisJwBA0CAAmaYCEEYGga3BkDKBgFjFcTUFgIITEQACpvaGoiApOJcpgKCBgaIAAABi9OrYYGBBQ" +
                        "1XmbAWkSwMzYZAAsVrzWTBZFMKBpQJdEZGAOULSlgdegYKz2I6EiGrz/+9RkZQv7f2bFK93jcgAADSAA" +
                        "AAEtzZkWD3eNwAAANIAAAARoCSZigkqcvJGy2phYFBcCSFyiqIzC6WNmksVADXU/BAEzDBGbaDcwuA7q" +
                        "aRdtK5OcqLA5cPBIWqAOo6xlYVhwchhqa8zHY/EgBAii8MgmPGahQyaHY0QBkz8Eoq3SJEAEMMBhAAiJ" +
                        "C0LQqtjOAOYm7aRgVCJbWpGM//92lQlYDvZ60TBu9//+NW1HhQONOs/8FUd/ff/9c2X9h3DXvgrT/Tee" +
                        "+crWFgBRGAKYDgIKNwGA3CAVACCGYnSX5rdiZmA+JCYVwEYQD4swwhQBy74XBVTcVCMxKFpIswLAEkBg" +
                        "wABQxV+IyAHQwNBIskDQIAIVGLwBAENRoDh4SAqAoGKwDBmFgBMAQEMFhdNG3hBTmiEBC1AkAhAMwNBp" +
                        "jKnE0VQHMKQ8FgPBocwIFwfNajZMNwJLxGDgCBUCTAQDzDwOBoB2wLChUZEoTbYcCysIoUjWFdBAZQOp" +
                        "XfMJEkSFTSmuSxO8ITFaCVbgISTfymMOAcwCBElUEhgA0SyBaakEQUIiI2CugJMFh8nR4GB7c0M5eZVE" +
                        "bkr0wCgFFRquIv2sJZCqQNcCEWDqNgcBS94GZSzHAdgZAJiISMiX4OgVnhkJtGLhDIpxgahhiAMhwKcC" +
                        "Dl8GOxsEBys/oKBJg0HkUVgZdaHQKAUBChNOtr//4mMhhi2OW44JAG3z//VbdlJp7Pw33XOf//+9CMBS" +
                        "P/+Zc2p84Br6KgEACYAIAr8FQFYtGYFwBRgKACmBUB4YGhTpsmgvmBEIaYLoGoGCJHQKzAjAcQ4IwlYb" +
                        "MPAsx6K1yhg0EY+MHDM431juBMEh8YkEZlAEKFJImSxcYLAI8YCIDGHQwTFJZLRjBIhOTXU0aJxoUEgQ" +
                        "lAVHwsRRQDgIJoZgUAGVg8jaShAODg6AzheMYUHB4w8FTAYRMIkUqg9RxApAxNIMP7TCULAYJAYbnIYQ" +
                        "YDAjex90gATkwggBwB0LAwHJWLwAz0hGBn5TqLj/+9RkY4v7gmbGK9zjdAAADSAAAAEtGZkcD3dtwAAA" +
                        "NIAAAAQoEI7oAzEo1R/ucjAjAZWJGjR0KikwuSTMYsbZkjeigKMcAynU3ayDQKTEESNaKZeQYCZhRKGL" +
                        "Aay1coGBENDwpGhDSPizEwKCgEAGgJvoyGLzUPGdxlN0xwqAjF4CLhgUDt+KgUxYMRCAV8LcAAFMGssB" +
                        "AlZDUkGh0IGOgsgRc693/+lEQKX5n/0JZrXP/n/SxMRAmA6n/+PLnf///iBcus5blch/pqJF0tggBUwB" +
                        "wETASALMD0BUlA4MCEC4wxhvjRjB4MGUNkwMwVTAQAPKAIjAmAEDgFjAYFl7hUFA4GCsA0XTA0RgQNpo" +
                        "7C5oQBph2BgVBMwqAssAGYhguHBKOAeYJg+iWMgwHAdohAELgkMLUYEhUkuOgEGAuVQkWSMgiHAkuUwJ" +
                        "BCCAaC5CAJgCAYAAcysUMwCB0wJAGLjQJmAQZqxKpqoFo1HQcVDpKUKxQNiQQdk+mfl4YRwNFQwSRpWL" +
                        "A0PA4LDBGD4fj6ix26MgcWxTVIgAsoTJ9JyoFhEeAYlKS1JjCCd4FKRKBpM4wUtMPByYCL3L/RZBpoRH" +
                        "S1laVGzDX4SA4WyUHAZgZIY+LmDAA8Dqxv+gyYYBI0L0Fhsx9QMTA1L8IUFQExsOYSmgo8X0MXLgENsJ" +
                        "QkNXMsaTQRNCfEo0QjQQmwav////oEODeZ/qpekHf1zP+QWuiBquP//////4XGsxW1+71nTZ6wAAIwwC" +
                        "Iw+CwiFgUAYwcDwMIYwaHQ0izo/nm88CgIz6IoxxEkwtE4wkAIwmFwxUCFAVRpfMSEI+MJFAwMBjglbM" +
                        "2g0yoMDHw0BRHEAzNks0zKSTExCMdh0aEYFB5QCpejuYCAZocUmpjUkClEJCYqCIQgIAAdhYFHBlo7GR" +
                        "AIWAGIBIIAUh8ZVWAYfzHQlMAhpkrFDD4xQBNJARUm6iqYinmTkpppubOJnIjBjJKDgZ6GuvyW0MOEAM" +
                        "AGBAivFfRFx4fMBQTLiwyIj/+9RkZQ77wGTHk7zbdgAADSAAAAErHY0kb3NtyAAANIAAAAQMuJgcjqQM" +
                        "UDgYAMjiT+ROGYwwtHsuKApkOGyYYFiEAEYAKDLDIxIKZWBQFFNg4hDFaRYrEJEAmcGiCA0dBDBQYw0e" +
                        "MPC11RNjJjJKYeAgwELzuYYyeDw2AgwxQSEgguYwxTAEgcv6YEEgwMhbJDAhQOJQyDMHAw4AgQwQQMIA" +
                        "HCnq28P5IhQOBQC1t0pyOSmh3EGYKUs2h/FkZAHPJGc4g/GH9uV/zqdj6yr2F6UACppDQByA9W1QUwBQ" +
                        "QjAXAwMG0KwwEwCzCHD0NKQGAwighzAMAXMCQGEQAIGIA+xUGBAwEEiIEmCgyDQoYEGhiUeGBBiUEwIE" +
                        "IKDRgYEmFl6fjDIyMDEYQAQWBAWadEYIQfMDCFmbLrqklrEwgZQYEBIJHBgcnHJAyYBAZhwBiAHq3gIC" +
                        "iwrX0XkX6/TvixFnxYMYam2IA4YCAArh/GCQcUAzBg32sMXboFR0hCho0FAoSDM2dN3AgmjiYKNJ7DcW" +
                        "YWNBQGM2D3Ho68sYArmAS/q7EPC7S3i8yMhhZKMDRzw+YqQt0TvgteC9E+zDxoBIQUD2GttL56njz/Mx" +
                        "MBOzfSIwcOMYBVQqlbVN9RMvOXxrJpKBQ43VhzNEC0MhCTGzA5IHl6SgJYC3ZRx6KT7OW91XdW5J7NmX" +
                        "8fV32v5iEfARo/cbZynuUAsTZejU8sRnu2L/859DK4tAAACwApgHAcMSMAUBICAXmAaCsYCIKJgACPAU" +
                        "EcxGCRDhqDOMGAEUwBgEzAHALMCACcwmAJhxgWCBg4LKMZhqAhYDVtTAkCTAAAzBcBBYFzDIBRGDRiWt" +
                        "J7GShMHxhCDRgGFKRQcAyXU2YOBgRB+paYCiEVgYvYICZC0wHBkxEAMwDCowTRQDhCIRBDB1MDQMhwsk" +
                        "IwEQxMIRbYaygwBE3YyA4cBZlqgCBpiEXmOXeetDYXASuR0EpqJ7DwRWMYAMiRgwGxEHwUPGmKDJzBcD" +
                        "LvMKA0z/+9Rkaof7wWTHK93jcAAADSAAAAEu4ZEYD3eNwAAANIAAAAQEaDnIRDAOYZCAMCwsBnetuOAQ" +
                        "ATBRLQWCCMyjS1HUQfRqMFAkwwYjbw7ScFAqwRuLmuDDxUABgIBpwgQFOxB6wheOTy5pRiBHmgwYChiY" +
                        "HCAKAygxEAQsDwAAjEgyHhOo8utrr8vUrhDYwOJDCovMhmwwkFS8UNdTlQzR6dVzL3d/uUujRYZfr/xm" +
                        "o2kqPBh+cv3hlNLC2cdY/38qavYX/drYEQAxgigtlQAxcpgDACGAqAwSgKAkVYwlQgTEjNuOnQQEwuQQ" +
                        "jC4A8DAOh0EcLgcRAQXNMGBkHhTAgamEQaCQXJemDYVhgMGCYSIKhcMDGGRz/cIDCAOzCEADCgAFXlUS" +
                        "xICHZMNxzHgzMEBIMYxnFg1TvMJANgUGCGEJIYBFiYWtQAxJTQMEg3QCI8AYAxACRbowqFIOCYt8QgsP" +
                        "BEKBO988mGYzGwOOxi/JnM04EEcVEJgsGjwgMBA4eHifBk0YmMA6w0eKoKEjLJ+iLxmCAukOFZYY/ERh" +
                        "4XiMLEwEbJTugkuY0DxELG2Mng8RgEwGCVBWtGDQOFw8ogadgBgZQjR0EQFkUAtvlARgIejQLLVCIXtC" +
                        "qIdhILVn1T2MYpkS+Cc7tOiEA8mCpYApigNGM0gAhYxUWAqNNlsCAaCQCCDCgdBwcNjllHuKuw9JgQCj" +
                        "IWlL+///+npivNf//vV1I0WBOX/+X5pzXv/////SMhWA6G27WsU1KkAAAHAAmAsB0DQCQMA0YEQC40Aq" +
                        "YBwEJgiiLGESA0KktHF8BmYE4GZgLAKM2WHMPQpb12TEsR0NjAoBQKHoYGxgKC5hUFgXA4qgANCEYAg4" +
                        "YjVudFicYgCICQGEIFSgwQCYIAWNBAyA4GEszC4DmcwNGnJMAAUMOAtHQAMYHeNRAlMHQeLAPkwC3zAc" +
                        "DxCEsYMOQkWYyMwnAp30EgYLoFKojAgEXSYqvpnQ0AgEEIlHh0UBQhIgcGXXMXD0OAJaUqj/+9RkYIL7" +
                        "DGNGq93jcAAADSAAAAEumY8Wr3eNwAAANIAAAARRWGHcrJUCYshpOFnEbSDBgIFiE2DxKfidfd1DE6IQ" +
                        "BPWZQFZb9PFGt9gqBQEeU+AaPDf4MnXFdaK2cpcYHJw0mzAoXMkkSXWIejFeULBmHASbIAConXg0eArk" +
                        "0IODphlEhxVXWYjHocH6lBF1glrykwOJzSo8JguqonBafcZD0D67//+DCL3f////0m2uy///h91Hnn//" +
                        "///pGZbwu/+usAgS+JgjgkkQCpgLgMBUBoQALggAowLxNjCvAoMSg6g62APjBDAaMKEBUwEQCTAUAbMD" +
                        "AYIgCBAJGMwwBwMIehYXBYIiEKzAQAzBkCDBYOKwBAIyR207PG4mEUcCYRgmtwwnCBnT1GJIdjIClUHz" +
                        "BsAAcGDzGD4WJJBUJjHUIQuBg7NBgeL6rjAMPSYGaUwKCgwNCpSswmGNp+ZjgGosHYcARjMCxsYGJjIF" +
                        "mAQIYstp6IgBxtJBOFhkDhSYTC6B6IRickEoMBRCEJTFgG5laGh0flBLCAQYjOh8ANGIg+YKHxQGopFa" +
                        "zYjFR5FhoQAow2ml0CgPFgk0UAAceNhIADCqVN7gJRFuT9yCIQ6u1pBg4JGBhuYaBaIuVLhVbIhmYGHx" +
                        "oIsiQCht9HYc1sYKGRkYtlnFigpIkSTrafGymSkSDCuZ2IUOioATNf6HB0IUd/8u/+knZ3///13lwlBp" +
                        "MLOd/9f5ZK/jzv8//07Cz64dxptPeqoBAAPYYEAIBdwhAeMCABEs0MACmBuKUYc4JZhgplHPgMiYNwEg" +
                        "GBKMB0CAwDQFy90sBoJGMYnwy65g2NMTHQjMNAyXOWBAHghMBgcMSN9NrxGCoWgQIobeQwYBF/aYxMBM" +
                        "OF4LAEEEiRDKsCQCmj43cwBAgwkCcwVlA15EEBA0WAtJgMgQwRBsCAWzgRjolm2QxZJQiBogBcwMBiPo" +
                        "MhhICAATBIvTogQQEIpKApi8ESBoQDg0FSSpgSRqS4EAMYFAaAKT3r7/+9RkYwr7JGRFq93rcAAADSAA" +
                        "AAEvuacUL3utwAAANIAAAARCI4kK5cAwpKk2wFMu2IgDKwbitS4nsYCkkYTACzsxJG8v6FgDBwGNqGA6" +
                        "gJa0Iz9MMR6YHWzibB6jtGCQkmCYHigDhcBVCr2W8ZpRsAGAaBgeJB1KYh2dR1d8xBLQIK0YAIlA4FCN" +
                        "dtwzHE5LRggAhmQD7QG3j9BKnWX/a5//91W7H/////ukIDoQ6//y/ReH/////5peScVem1FtEWC/QWBb" +
                        "URMBQB4wEwDmQAQEEwMRVDEhAmMLZnQ6BhOzCtAJMKsDgGALiEBYYASJgEBAA0YOgHgcAWyUwNAbmKjI" +
                        "C5gpAYxIcA4Y6FwNDBDQPML0K4wbwIR0CJ7IAMAsChq62DBRBaU5VQCAoh4FmCjAuAqGgCWcEIAyKJga" +
                        "kDGY+FCEA1BQDcSBEqGBcAtF0XTAnBrWugRMAgHsaAzKgBZhGEcyMA8GA6TAWY+GgdYCSEAAYCAgYpAY" +
                        "i2YAiE/CDQOOUOGJnZguJ7I5LhPBYTR4RC+gMUE0qAxTYQgeh0lMUYGOAeZBigWmJQDMSggIhPHACBQE" +
                        "rEDgZEiDS+MJjxM+gEBwYtelNx3WTjgGGDxqGGoCCABzCoUmmz9ivLYfSsMHxoKIjBQHOZIpyWRkhBEL" +
                        "CiYAAWmMYTgOJANFdYxoQgKtMqkQY/BG2CC5fIZGvtX1/n//6AAB4d/fP/9bIQpVfa5/9xjgCAq1/97/" +
                        "7/ayEz47T//8/L/+52fKMSPqR0MA4GxHMRACAICUGABo4mAqLsBiNjExbSOcAWgwTwagMAoNBFAoD0wJ" +
                        "AcoDgRgUYngKPAUh4YKkK2JNEw+ChawwExEHIjCwwE+M3eMYWLYwBCJ5YSFA3qNwMRhtIgCKgAGIAwjQ" +
                        "KtyMJQKa8o0WWLeGIaCHmo0ExDmAAJiwq2zDEDVjwUYmDgyJgg6Dg8KxYDECiyyQDAOS7WzB+0N8FkVA" +
                        "wWJxkIFBgjMDh9PlhBn0lLEh0xQNk1nEwlwEC4H/+9RkX4/65mTFA93jcAAADSAAAAEvvZMSD3utwAAA" +
                        "NIAAAASNDADCddOMocYBQKCb8wc4yRA6KzHydDCIXYEaaZFISsEtEGAOBjs+ZgAanwhIJDVTmMwEsYRg" +
                        "EQBIxKMx4gI6GFCqrFP3r9aJigAMGsc12ZgMAXYu0kkQtRDDEALL5W0wkQkCVLjQQIQgxpIhMxuMNqZS" +
                        "HKMv2z93N6/X/pK7+f/8//8qh8iA/f/8+UCAHv8//73/Q6IE6GN96mJZqMAIBgwHAZ1egUAAFA1pjmBG" +
                        "AEDBRjFZA4MQxyo7JATTALABAAPBgFgCGAmAOYAQNoCAJHQCDByA9EgYnGMB4JyICIAAwQgO1TCAAIwU" +
                        "gAwsBUYLyF5nEALI0BUBRt2tAADp32bGB2E4y9Uxg/gxEQEA4ACYAwCamzkKSBgCxgigimdOEol6BACy" +
                        "IGWFCwNJEBM4Bg/gokQAgyA8YEQS5eIEAMmIQNtIEYVGJ4HCMETAiEjDoNWZBUaDBAER4NjCYEGIJ+mL" +
                        "hSsBh8DC0w1oc7IwYDxkQCa+zC46zekSQKEhEMZEAcGqooisQMfCQMCgBXkLA0NBww9YJG4wFAsUAQgA" +
                        "Uw6LQ2KJkSEhWN+H/fVD9TAHBmBhJHQEMJQaUsoaK1DUtSGGTlNOh9BAAsSlr/tYQNaIYZHIVg7gl4PB" +
                        "Rb7NOsQBe1oFAWaDgsHAG2kQh90Zas3X5d/8VQzuv3v//8xGF6EWv33fNBAFd////5/koFEQFVaa+3RB" +
                        "p7xpUDUAgKGB+CMFwFQwEQwBAEzAtAIMCYD8wNQ5DE3AqMHlz43jhGzBbAmAAJiEZgEgGEwOJWJ0FBTC" +
                        "wrJMmGodiwCsOCoPLuRdMLAHAwLGMOWnzwHjwGp7KKRkwdCcgAAeAkVGVTVaZgQIpMBMGgodHSkK71DD" +
                        "E91TmMDgEDJgEAAkIqdwhDZXSlZi0FIkB4MEQwuAIIBRk7XlMgYIAwLCAFmN7kcZI5dwEigiIY0GgcPk" +
                        "fVhgCTEtGZmIBaoE+UP7FCn/+9RkYA/7GmtFA93jcgAADSAAAAEv3ZUSD3utwAAANIAAAAQNDcVAZhon" +
                        "H6QMYNFBEK0bIbSElYUCwYWw4PNbMFgUMBq7n0aYDgENEwlAZhVpGOUiYFAUVuZTisogAxgsGF2lHEh1" +
                        "BVtyGpL6qRZjQCnBA2PDKRyy+NBd+2mmKwoUG9zk5lcSypK1lhUTINBQngksLCwxYk7mRSJ4fz/3QRbn" +
                        "////fzEQjVHzP/z3cL88/////8CoBFvZyrXP///XP3vG7vr2kRDA6BzcktkYJIFosB+QgrmAGHkYvoDx" +
                        "hPP+G+cCcEA8pGCABdUhgkgDiAAsBADmCsC2HA5K/AwZqmYkAMYGgEokAYDQGU+E0jBwLTNCICUFAGAk" +
                        "BwDAQpbmA8BqDgJQQAAYNwJyyGhmCiBksdJQDBUxyNPvRFUq0x9QUEzDAoADCAMSqAIx9VrkGA6EclQI" +
                        "wQDCpB/cNTomC5jQ6BwyBwMAUYL44ZD1CNAWFQbHgLMHgnBwdq1mF41pUoSTCMOkR35iRgABgwKBguBi" +
                        "nJhwkhoSKhAEA8Cxg+D7lAwSBYBHvMGxxHhIIABMGxpa6o60hXYNBoweAURACYEiAa9kSYOgIDQXfuFN" +
                        "MJQBGgNMAxLY+VQAAANiQRp+zetFqBEAojNQyOGcDBu9K04PMMBGDgQUfBg2gYPhgCjFIKE6FLIVVggw" +
                        "CBVhAsCAROA8AL3zckiEy89fX//3M+Yf/P73kcJAJHgXw7jzfMA4C5/////f1SoAir68XvZOrO0TrgCq" +
                        "AIAABiEAECgfFuSQBcVASVVLeEITRhwgZGB6q8aQwAZgegVmAEAmYAQFQjAEDhgRmAADmEY/AkAi6gCH" +
                        "9F0v8JA8CgTGQnDAOMDgoMcD3O3gUWSDQcMHgAhBUB4VCAWCIw7DFUwVBsDDbTFQAGOXnzWWlsYnNyYH" +
                        "hYIgTMLwNT4Q+FAFWmXXEIfpWhcAjEYDiYPGkuHXUDARcTpMMiI9mBn6FQKYQBbMCoACIVAIKGKgORC9" +
                        "TIwqHQ7/+9RkXIr7CmRGM93jcAAADSAAAAEtCZMYD3eNwAAANIAAAAQC20vzAIJGQUUAcEhswBBjDgIY" +
                        "WsccC1kGhwrBkqMKHJL1c5hgToOMoTcU89ACG84YLDpp0hBcJmAgqJCNBmOrLjoADqTqpkdSIXRmtjMq" +
                        "xIYihqMulsmXTspfSMwyEhYMwMOFYHDdKQGgpGl/G/wVvGjW18AD4yoI0xH/znItTKca/v/+udz+5cqX" +
                        "LfYaEAbIi33Hv18KwsKVx87/7//0mQxerNvsK8XUEMAYDcOANR/MAEAtL4LAMmAAEoViImAMoQaIgFxg" +
                        "zAGGA2BWYCoHwiAeMDxDJglMMQXMKgnSOMCQFEhoAQGpmDIAiEAgsAYUAIwCIALEWd/AemiUAECAFZwI" +
                        "QWAQsIPFA4MbMBgLMLgOqDIFDQKKZt87LGDDNowMko4EoFBAmCUZABl5CCJgWAJgQGCkiqAAsKQEAwLg" +
                        "UPC9W8RAUwICwEDDBatOFj4FAFNMGAVSwKgswGAkaTA4aHgMIwOYQDSmD0hcDCQhMBhUWHzDjALeN5DJ" +
                        "MdD4xcA0+FH0sFKDDoAGg8xsAlAt6ysCBYHAwFBADApzAufRI4FohgNFrnYDAcnIoojsx58y9aFVLljA" +
                        "qIDcRoXGqTMEH5MwtwYCAyPaDKYZisHJ5lpQCMxYPob5O+Iw2YzAAhAINIwOW63YjOcjbdnhsf/////P" +
                        "7vv9+bXyVgfn/+91y/0oz////+4rM1LHK/VulDy6AAA1BTAbAoC4AIsAAIQAhIAowAwJTA+ByMQMHUwk" +
                        "WfDLyD1MBsLswPwNAEBojuYKA4YihWYEAYMBIAAGHhWMJQtDgJKAcFAYGgZMAQPMCwwMKBsMQQ+O5BPM" +
                        "IQJEIBgAAwMH5fAwBBMFAkYTi4FgKBAjEAG0IIAQwhA9Bxr0CmAoNmCDCmjAiGCAPmAoBKLkgBGBoClU" +
                        "CwQBYNAcqAdB5hMJoCA9fA6FkYDBIRHiAYAFhi93iT2ZSq4WBKloJD6XwFBwiJYkFkZTHoP/+9RkZY77" +
                        "2GRGE93jcAAADSAAAAErLY0eLvNtwAAANIAAAASQxT3Ehyw4FBExMFAYGjA4KH1ii6IgQAg2UBYKAJgb" +
                        "cAQFVYnMAQtSJQRmFwIXQdNLZnZhQtjUFdwMAbZHUXxDpdwcBaiCfSDxQDbFzMkACrQSBxCTTCYFMUgV" +
                        "aaE8tyJAIwIGxQNmFAymi25ZwaG4sAC4btgAJiw8UdC4HNhiMOATXW0xj80llRc////uWK93u8NZwSqU" +
                        "oJ34czu5M9AgDKwVn+OWX/+l5Ljq0zOjkwtdMCgTFQALzgEEQaAujCMGTJspDPv0DbQjhpPTFMtTEUej" +
                        "KgTjH5FMdgQwkNDBoDQXR8KAyDg8HAAHAVTYqAEgFQXMIAOAD2hhEjCIOhxuMNBREsxkCDBgbMFikxAK" +
                        "DAQVBwTVOh6YDAjPmSPSQhsyIpwGeBCATEYXDgPHVnM+MNA8KgVToWC48DwEGzAYNZe0xHkwgBLVGIO5" +
                        "pxRBK/C04IAQARKqAoHGg8SA4CAguLGDSRoTSHEYCABEyETMnXTbh0BGQhDzGxEmB4Pak0qVRiUDwAs2" +
                        "NhURZKDBJHcOHDBiQ4IdAQgYMMBQDKAsxAOQLJgkZDTEQFlz8vvWj8iSmMMCg4pADqZMWBQFMIHjAgUm" +
                        "DxCGlwAgsGgRCtS9CcYWDhAOjgyRFQHCr6hAuZWMFYEhA9bzwJRQLX/v9//5zfP//1UiDTq+X/v8YbkP" +
                        "///+sORyBku/tRVAAAAEIQGiIAdayvRUAdCSFwAjAHAHMDEGEwhQpDETEqME8HE0lESDEnCBMLoMkw4E" +
                        "IyJAgxZE8xXDYwFB4eGkIB0wUAhaREAiZiQwXAgwfBAmDsw8AkwqB8LAeYFAYLA+YHi6YHiAZIwiaziY" +
                        "OBaYNCGNEODQDDgXGgNKoHyuJLJMLhfMOA3MEAzMIAABQjMMLAFJ6AYKTAEAQUDZEIQwAJgkR5tQcAgD" +
                        "AcAJCgozMTCDHlE2ZHL0tACAkkFDDQIqBphwOOg0CIczARYWQyENMED/+9RkaQb8BWPIM93bcgAADSAA" +
                        "AAEsYY8eD3dtyAAANIAAAASgoEGIkpghWcFkGAEZqpkZmEiEBLnExFGaSreYO0VgKQIAD3wMZEk4xAHs" +
                        "LMQAUJZni8ZMQGGWZ4aMaMFgwbMKFzNgkwEOMnGrLtLqtI/FUMMbDhgfMaKTJB0IJRAPgYpAo0YELGAl" +
                        "pkhAZSAHDPhiQiYeBkSyjoIwdOtDBBAYKHAQFMgCQwRKAiMONJ7GO7n5fr+4/l/dd1T8rOZy1bu53JKs" +
                        "BYfyvhzv77fqSfa1p3wUASX+XWFwDi8IVA6JAHwcDkYLgXBgBgdGnCfkNGaGCSBIZCEuYXAWYBAUAg9M" +
                        "NhFULHQLEYBJCBACmBQAs9nkGTAQDzBkBVkAUEDDwHTFABjA4NoIMTZXNFwZMMQkMOAOCgFFQFwgT32A" +
                        "QApxuVbHASIAFFQmMEQQAwEuKhsjSYBAmxERB4Yii0TBYYHoSZ7qqaSRAUgMGLgMpFQQFAkCg4cBKnLl" +
                        "CRMGAoEGgCOGOCSdKCEwgBHABD0ibDB1k1YICoeenEmhJZjosZGIAQKAokuyOJ9MVkbYVk+tILgSZbMS" +
                        "IigsWAC5pkLmcqGp7GFkZ3I8YcGGUnBlA4iyjTRNReGpS2lOntDAm0XEXopWBAcuYXbApOZSGGKFRti6" +
                        "NMpiocZOemMiLF23MCAVqhYJMWFSsAVrJgAQAUvlMPNjdiXqrq7lt//1//////uzjzP8foVMhoXvdzwr" +
                        "9+tvKFbN2jAJABL0BwEZgLgEmAMAeFgHQ4CgwKQL1CjAaAPMDYJgwTBbTFCwJMCkHcwOwfDHUNzBsDxY" +
                        "gjCoF1pmDwQIxDw0BAWBwSCIGIgYBguJAOnWFgrEYHGDIgmBIklBOGGIkmLQGGT/8m9ogmMAYmC4QjR+" +
                        "EAijRnMJCghK6S8CgJmAoDjoEBUCTBoHjAMFGZCEFyqEIICEwsAsxPBMxHEEw0HUwqEo5vY4HGswSRTE" +
                        "wLEYHMUgYwEBEFomLAILBowIBUrzGghRFTLexer/+9RkZQD78mNGA93jcAAADSAAAAEr7Y0fL3eNwAAA" +
                        "NIAAAAQKFoGAI8RxwCmACWaEDZCSDmVLMDgcCCUxUDDB4CEYRKx03MwMF02cLyGLfyswSEgcJzDwMDkO" +
                        "7BioMO4YYYJohHMTBKzN3rMOJIOFYsThoKogpRqM2uzWa7lTogLApiNacdks6XbHEUXVMTkQ7SRS+4VM" +
                        "pj8TGOQMhg0WHrWVZlbZgaEDDwDacxKMlQEkQI2vkeB03nzv61/6/n///yZj2tVWkiw6x5r5Xf//pbYg" +
                        "s8YxbHqwABAAQoMB8BIIABAgBTXwEACYBYBLfmAsAcrwwFQDDA4AbMFUP4z0lgDGNB2MEoEswtDQwEB0" +
                        "GAkAgNT6AAHz6WA0CCmgMAWiGgIHgOpTAoDHsMCg1BQLhA+mHwbGB4KmEVBm2oniwcGHgziMDxwIS1XQ" +
                        "gFxICVUpShyMCwAbRIYEAW94iAkQgXSmEwFBABmDwho6mEBCG+Q6GNgOYPOoOCTOwg8hcCCMFskYWYlB" +
                        "qlI6AC76KwOFb+ogIeQ4JBlgiwYkkRgIGgaIYaABZwDIUeAghJq8bIiC0u3dYeLAeoYEAzFguCS0TIjB" +
                        "oLURGBeZeLaUBiQQBlmJAQASQYtBqGIiAZZJQr+7uQKXBWMHAJ5FlMGZU1W0YYAIKNAVOJoc7CIOiAWG" +
                        "IQ2BQYjgi2/OW/ZDQLnY1Il8xckA5MHYIAAUgjcza5///71///6/4F5ywqmPA/n/qMf//Wpjt39NBwDB" +
                        "EAMYEgBzSzASAgC4FCKxgBgGkQCRABgYNgH5hnBCHBumAZqgFxhAghhieM7MICGGgnBoLkgDJNBgOhAg" +
                        "igBI2O2YDhNECABjBICwUFpg0JBgMHoOMgxNHkwGDMsdOevheDAcMIAmMPQaQCkQ6K4MBBPJgrGQBMZQ" +
                        "ibALBSYOAGMAkYCAoyYKhEmWyAwoCIwaAow4HIgDwyTR00QcswDBQwMIEDFGkiHDmWvGAfEhMLAOjwPJ" +
                        "mgEC12ggBRYA3lGQcJAzCwD/+9RkZA/7zmpFg93rcAAADSAAAAEs0YEWD3eNwAAANIAAAARmJ4GNEQ4m" +
                        "OwAGCQ7mbMTmGgChUHgaAgBAMeF4SB6UjoSwzftl6BoXo4Cg+DghBgIiwMOAYQCSYGgCDgUMyQcGg2Cq" +
                        "BGpYEl+BENbZkc1H1ew9v8M4bjjjMGYQ6ebrx9I4wODEaA4HAgbNA2qwHAWGDGXcBAvIsv3r9ZRpoys8" +
                        "wX8kTDWA0hgaBxMCEARzusv3v/////zyyZbTsHxa6LBFn/M1B///1a///v5/U/X3v56swBgA2MBgH8lM" +
                        "AADQwCQE0xRCB83oqCYYJQMRgViymdtfGYfIk5gIA/GQQ3mAQGGEYFkxBAAIQwNFyioBBwYpaA4SngFQ" +
                        "hJgBJQKMAQtYgOjQMhCYgBGYpi0YFiUYGdSdxiYHBaHA20whBQw0AdmoUCZZAWA8BEqjQYGhCPBKKg4Q" +
                        "Aq9BgABrlAAHDCYIygFTD8fjBYFzEYbT5EagUqjDgNKHeukxMWlKRAJQwcq4ZctYRDcaFxUAYYIG1JQE" +
                        "YRDCmxmAU3yQDGkAWTAc7klhp7GEQ+ZZHbGzJgUDgIl4YoDEKymguBhYBPGYGH4YFEVA5Cs5AhSMFghN" +
                        "IxAOGeiKQAdpBgbFQQYIDYsAmerj7/9+AZbRdmYm+qq6riwFDJxuRBEJsM5oEwOADBSkBAKZyAQaLCG/" +
                        "z/yxl7/TyJUgrtebCOjVeuVqz3H8Ncx/////JuDfy4OBL9KVs2zw+6uRtrUWKVrU+tUIAwCcHAElqxID" +
                        "QcAiCwA5gTgGCEFMwHwGjA/CCMDQG0wlRqjUklcMpcPgwYgGTK0MBIEQIGZEFZICpgWBq1TAwHCIMV9G" +
                        "AoGxkwEAxyVjjwZpRGCIAGHQThw8mTgUmEIhGH0tnb4blAOwC/pADBEBr9FQCBIB3uMGgJUrEgPHgVFA" +
                        "0MDgQdowJASGkJggAkUAMwdK0wCA8wuTg3OXYzMNSVmGfQc0IyWS0KhEIx4Aig2JAk4pgYQBBEKofAQv" +
                        "a8rePA//+9RkYYf7Q2BFi93jdAAADSAAAAEt7YEUr3etyAAANIAAAASKGSwYqMcDwQ9TAAoOc5IzcAjB" +
                        "gVMOkhvizw8XBkJKCsktxN4IpHiEQDRQKoGMDgFa5gY/ERMEYHMLDFrYIuhs8lGAAKLDowADJOw2Rd/v" +
                        "/llllTMch9QBQtD40iNx4CGFRKdXHhQDwADjH4DUiHAOEQ1X//+AXKsrNkF2igMwIARYFwHJdb/8fzz7" +
                        "//rf6gdoU0YBB0CIvoDM8Oabq7CK1b5Mg/KwGBOAQrEYBwFoQASDAFDAGAOAQAYABmR2JQNjCvAVMLIL" +
                        "I4DzxDPoBKMKUFcxLAIwDAcQhWkYkaYRBcLA4YEBWRCItMHDss8wBCZsxAC5gmHihpgmJJgsGphAAxmO" +
                        "B5hYPxi7RZ8SDMmtUoyERgqALxILBwcGAwPCQVSIw2ENlojEAZBl2AYCr9mBoSCw/uMYtC+YThAZAh2d" +
                        "JKyYmAkYLkUYhAotkwyICEGAgKBgJkIUA0C4ZIQuMCQJKgSmBgTNWC4XpRxUaKCQjAUCR+EoZmGlCmBY" +
                        "NtJJiRIgRMGQHGiRTHMUQFj9hkkRpY+DQrFhZbsBQMTjMGxiIjUGQNMWQOipgw5BkSEoQAhi0HTA5aru" +
                        "D/////79CPAO9RgoJyoSUDxCOIKBIwCHMzgJ4iCEHBGYIBEpg7CWEg7//2s/9I39LrceEAZDwHTN3vNf" +
                        "f5rff//1vjIWpzJACLylgBSsIMe/Wbs9+h5u3Q3/cY+38QBhCPAUCoBhgDgKiECJPMBAkBYBYwFQWwIA" +
                        "ASgCGC2CIYK4sZpCYmmKCJCHBKGNAxv0SDCJBAwAwvFMMBQwHC4eFELhGhUmcCQFDgHBgJkQGA4DTBwa" +
                        "zCMTwEJJkIJhgIGojm0T2trFM8iAMmO9YYAh60cwTAYwqAKMGEYPjQTiEGjCoIGqEofL0MDgZMAwAR2C" +
                        "phFAjGCBbnh5dmgwQYeORpQAJqmPSqjQAQsY8CgjDhm4POCNA8WV5ACxoUjQRHCKNC2FGTT/+9RkY4D7" +
                        "YGBFK93jcAAADSAAAAEtYXcUr3eN0AAANIAAAAQG6YiLhlICmAxMcg6BmEGFQYGhAupeYJPIsEWAmaBI" +
                        "8sNv/KkkImYOIxfmCy7ycxh0smSgSKAY1cDBAHDEkuMjj5VAxmCiIZPDBrTquW//f/qDUAECmKSWzcqg" +
                        "sw8O0KDDBqOcJMwcAh0VmPgiQAwwuK1OdY9/98s5x2mwzfQCh5Sx9Jrtyzj+6v3v//7VqrYXE8CdEuSN" +
                        "Hjhzv40h7FHrcGsqWieAAAGCEAQYCwAQgAeZStowMABQKAUYDAGhgJgFCIBwwYQZzCHFcNJqsIyaQ8DA" +
                        "oB1MahkLvmDQQA4VWDhAEK/W2TBSIgbC4HSEwQBAaA4UAAwCDWPBQCQgjygRTBEfwsDRiM558uBCMLJw" +
                        "4GBGH5iGAT/mBwNg4IwMEAhAFDUoCQaD8ZAAwYDN3TA8Q2omC4OosRkw3BMLgmYsIQIGkCwJMKl4zgAX" +
                        "OMFBhp5bcxIBUbhAEXEMDA8wCAqQxQJU+QcCRYkPOZAHDJRg3BglEhCejDQOgBIVjGQITfMbAMFC8RAQ" +
                        "wAK4cYYyy2EAuUFAPUQHQCEENyjCRzMXgERi4zWSQuGjFfoGqpApiY1BAOIAyPJaf5//rvP3cJAURAEw" +
                        "wNw41pqmTB4GKEwmdjppvMSgYwGSRYXkACMrCZV+WP7//x7aqwjUEmBRa7OpVepOb5+v7r+/+83/g+VA" +
                        "EAyeXjQ1ON6xkkB2RQskPhwAgBLTAYBUwGAHioAQIwDzAIA8HgGh0CsDAEmBkB2YOYFphYA1m32IgAmZ" +
                        "TBrCRGAhDAmCxODwB9MHgHLvmGYUDQOBQEWgKtMEwYQoGQCMOQJKAPGQMMNBNBQOmC41BcSDApOz5ECQ" +
                        "gBFYSIJCQPTCQAF4iATlNhCERgaAioAADQ0CyVJguFz/GDwWM3MDgZDAcVVEBDmGwIGMIMHhxcgqGmNS" +
                        "GZyAKXZiUipxjQdAgCT1AQGZQYBLxQHHjKAO84gGBQPXCMblecJTdHj/+9RkZg37VWDFE93jcAAADSAA" +
                        "AAEt1YUUL3etwAAANIAAAAQKDzu3xMmg0HAYyyIVFAuCg4hFUCGHgc9z3kQYJQOPDKByUGqTWyDiw5Jg" +
                        "AVBx+FQqYRG0iMQ4g3oFnbMeiAwkBgQKRAFJTW3r//vMp1XRMLUcisdiASGAEiDhSYJPZt9DCxHFhaGD" +
                        "ZZJf+GaHLf/v+75WY5hKzBwHHgnAcdwdqTb5h+v/9/hd+PKcqzmAwZE7w8Kdb7g3LnXUU1HFn0BSrRHM" +
                        "BkARK8LAUmBMAGHASEIHhgHACGAQCmYI4SBgcjMmgtNSYv4bZgmAbCSpGAgDGFYWjQjMEMJQDRlBABhg" +
                        "UA0EwMCsuAgHjwKDoBmAIHKuMAgMMJAbAAMGPgzhgFARAT78B1YTDMCCIQBwFR4qHYAQbqQQImBQAoog" +
                        "oLlPkIBGDQIzxEIbEE3QgqI+YXBoHHmYFoKc7q2YzhEYbDWhspiYKBcnGrsMAl8FAXdBoLhgMwWHC5Aw" +
                        "hCZGl4zCIWHhIB6MLwPHBSMVZGCgMEAAs4BQDmGYhDwLEAIA0AYoQgOJCoVQJKAskQiCEmBdRRAtnZgU" +
                        "Kw0DReUxiAtppgaiACjRsJhMBJgoCYwAokFvLWH//938GGBAgiwCskDBCMBQqMNAcQeMDgrNMiqJhIME" +
                        "Q8MMwFIQBQnxu93//eGv4vtju5IShUmdM49gmd/n//93+896SeW83EFBTVCwIEwEzmfcVH7ftucpoXMb" +
                        "lMpVAMAA4EldJgBgFGAYACIAMy75f4wKATzABAKAoGJgCAxmD+KcaIFPxkBh+GBcDGYLQNBgDAKmAsA+" +
                        "UAHQUYEwBTiJ5iQHoBAFMAIBB4wsA4PAQI2jQOkUMB0FkwBgOUJhhagKK5MA4N80RQAR0AUwCAuQuAGF" +
                        "gAgEETAZgNAZuFGzAUArVtAQNqtUwX8lgQB7AY4AEDgqWABULgICFMIAMox8x2DEJHMigkwEAUUhCaRY" +
                        "xDwJsDIEKgGGQGYfNIckyoLi+scKgub5lAoS4cL/+9RkZw37mGlEk97jcgAADSAAAAEvYZ0QD3uNyAAA" +
                        "NIAAAASh+MmggLBk6DwTOgFasFB8YGAJjYyDRAXsHH6yrQJIEVFYsenRMEhVCJOYBBdb5iE0EQoT5NKh" +
                        "1FIwWpDsQdFQEBAMBAs4qPUu7l+//+2XbMOgl0CEDJhPyatOhgIKBRBGsnuBh47Rh4TFgDmBQWwaly5/" +
                        "9y1+2Ey3tkGhBMyISrb63//////9Ydyeij7DV8qihu+H/peFr///y///V23/8vdn+qlLlIAwDgJTALAL" +
                        "FAIx0E4wDAETAIBaMAQBkwLgbwCAQYawMZGFkTO8GEOA+YdQBI8AWYAIGJgLABDgAQhApTKFQGwMA6Cg" +
                        "ATAsAXYsEAVjQEpAAQYFQGrCxQDUwKgUwYAiYMQGAsAkYC4FBo+g2IMmAIB0LA/kAFAVARKgBooCkyAD" +
                        "AGBUDFEoMAyaRJBICWMGA2AlBI4BUVAEVNTBlCdMCgAIwYQxDPUAkM/AEwulzFYJYkIj4phHnygJ448Y" +
                        "yDhMEl9gY3vcFQAoi0oQAREswiShJHmEQafUV5psJgUBmZCWDAQYTMaarcQUjGoKHExgLBBAyRhRiYZw" +
                        "YMhcxqGkejBZlJgYYQNBoBkEQgMWmQFigFBItEMhtWhO7X//7/XcEXyYKNbhtK0QCExApzNQvMNhoPu5" +
                        "MVzABSM5CVVooTICt8/L/gt1f62G/qAQqI3juTV5olz/x/8f138ufMU0TWnmQiIWD9HzDTj4f/6+9+99" +
                        "+zaNZ8GdtKwNHgJ0ogKBGnkAQFzAfAxCAHAIBmCgJTAOBTMFYEAwJRfTTUnBMbEP0wKgPDF8JTBgAgAJ" +
                        "JgEBaihhCAymQCD4iBQWAwwWCR4AYHKY5fYwdBlTNUhiCFbXzCsSSQBjC0oCfBy8I4DZEJQyAw0OwVBM" +
                        "EA0YHgKChPMAwATHAwBpYhcCTAICHGMDAPmRkBCYik9zEwdwSBhhukpnyvZgEFGLCWPOpfgwPyYIsaVu" +
                        "h620QwqQEwECJhYMSxrCMcr/+9RkXg/7JGVEg93jcAAADSAAAAEspY0QD3etyAAANIAAAARHAkscGBw0" +
                        "GBwYIjgvaMHBwLBgmN5WBRgJCwvGAEOANljvDQZHBGYLATAjBoiV4IgaLEhUBigVDwrMOg4wAPRIgGET" +
                        "meGCTpGFTAEBKBVsXOc//x5/xFkEDyaKioLLyC0KCqBMlJovqYLBhggELOBItU0l2Ouf8GuZ3bxz+EvM" +
                        "CAtFqJ0OolIN/+/y///H9clT4yK+MgQrCtH+vmb/P//7/3lihx8i6fj1lOIiEXaLAAoKAnBoAJgMAZF6" +
                        "mFGF4DmYJYkBmBW6GPeHUYGwP5jCAQAA8wGG4MDJCIwMDMiAtZJQCgWAIwgCNXpgQBwGCoZAUFCEpMwA" +
                        "CQwND0wHCcw5EYhBgQKwT8Ol4YPGwvIKguNEUSBCYGBeicCgwIg1aQYdBizQcCEwSBmCjAUJmgCEAwgc" +
                        "lBjAgmDEkHzIQHDq1BAcLZggJgOOp7TBMFmSrKMDQNe2/GVqhgoxowQBlXCpygD7CG71BUADJ0CBkOTA" +
                        "WWSUEwSDZjyCwoAZgqHBEGa0jBMEnsUcgkgCMmHF/DAwGRIAX8MGAzVjMEw4GhrMEApMUQQUQEZ1mmQT" +
                        "rVMExvAwzqhSOs93///PzmFuyZusWdgx2F4wDAgGAWa7BqRBISgaDjBbR9EWuf/6963s/b+vddmiULH6" +
                        "xpb+OPe9w7/f//1at6lBMCtMz4iCLPDD5VTf/9uVKqXF++sX9bkqKwOh4CgwKgJjANAGCwCxgPgGAQBs" +
                        "KggiACswLgBAUICYWgaZwOl2mgAAYYXoAo0OAVgNmAIEMRAdjIApgggfCQBwAAWFgVDAJAcAwGDzmAmA" +
                        "nTFQAswJgAm6DgNRgAATmASAEYVQF4iAWMD4d40oQHDACABMHMJ9ZghBBEYBAgATKoN4cBKXZDgE4sYK" +
                        "oDw8AQOAQiIBy0FAO5SMALjQO7KDBHBSMGQBwwIw9DL6EEMpAEwWlhYhLmMUDWFCoPMRh6nVPBYNDgKF" +
                        "bQzD4CX/+9RkZw/78mvDg97jcgAADSAAAAErbYEQD3eNyAAANIAAAAT+CRCTAKSl/XzBoXBTSMHhg7V2" +
                        "BJvFUnmHhSW3MUApOa0YIBBQAVjlAHQZBQtWk2OREIACoaZOYaNQGKxfwzcCgwUmT7OcMCrlkRFMBB1t" +
                        "2qSz+c1nlnzdZX0wg1PiAFGcyqChaNAY2+rxIJGChOYlA77CgAUlfw3/6bDKfyvudt9RoXEQAgCSfc/v" +
                        "4ZfzDn97+4YjEcHhlUa2PAr9f/cr34/cu583a/+75/97ju/aqYHAEssMBMAgHAHEoDgQB2AAADAPBABI" +
                        "B4jAcMFQEowQRUTSAk7McUMMwUghhYuTA4GAwDxot0NRoPGJFqyYUSAFgMETFTAYERIBGYBgkt4EBMYa" +
                        "BuGCECkrLNGADzFODhUATGwJigKwsEYkSAYAI8DReovoYDAAqqYTBaNAKSAaYJAm3QwKCp2hgDwECSaJ" +
                        "gqSZMABiud5nQy5gsNFg3AoGRAwiTGmGAgESBOMiAHPIFAUIAUqmLBdCswGDYpJUQlvjI9FkuYIBR0tM" +
                        "GcgMAgYZUHT+mAwCTAFshgELtqm7DDMXSdMv84q/wMc6MxiIR4DAUnGWRukSYurppoBr5DCOKgCBoKov" +
                        "/H+fh/2Fiw2wmaaEYmKoYHgqfzjp2MCgMwCBxgFPo+EZ5//zcdtf7CJFp6QIIWg3L17/7zn17l7+/z8Z" +
                        "VHXxVRl5KAxoF9//u4yNALseKWj/jowH3QCAAGAfQ8YBIAwAAEJALAAASpSYEwJJMCeYHYLRglBCmAqM" +
                        "QZc1KxjzhoGBYBKYwiMYJACYdi+YDgZHwwMwKA5gSABQNCNwwDrwBgHFYPL6BQjtxKoTmDocmFoSmMgm" +
                        "AQLzDaVD8kHEejCcdFhFmjRqiAGCzUDA0GjBYB4MAIQwYOgGYGAQ4hg6Ea/IZMQgAZeDicMHwbMTCtPL" +
                        "ymElsMFQMSGxATVmkQvMOgh2B0CqeCAmYEAcFjRQBwBLlkwFhwwoCF2FUzhyqBIZNse8xeH/+9RkaAv7" +
                        "R21Dq93jcgAADSAAAAEu4Z0MD3etyAAANIAAAARQSDAIQ1GAaNwwDsyLkuu7CXLGJatkZCanIgA4kkoo" +
                        "HFEOFQyPDEZiCwBMV5MDMVUhkoTDwdjMNSH//mWu/qmWG7DrOkyjBp2MCgow4eTphiCAqYcEgBCsQnZf" +
                        "K//Pu6S9npRJ05+mCgjVHE7uX5f/eVM//8tVK0FrjjowBJcVQegOz/98wn8qlj8/53+61hh+vy5+PMr2" +
                        "M2AkBWAgFDAqAHRRBIEhIBEOADmA+CUYDIAYJAeMIMEAw2AMzdjG9GnVDCJBlAIOKYmNwVhwQCMAzAoD" +
                        "F0mBobiwwmAAPGBYEFpjB0DwcGIqAIcD0XCgYgwKTDUKzHcaTA0KTHG3j6EWpsFB0PCqSBQYeAaOAwYM" +
                        "BSgTHQKDgaZ2IQYbuShSEBi4Q8NKZ4oEgcWqHAwZKwOAAweNA2mZQxUBkMD4FGaqIEiA25gMJIOENaCL" +
                        "7ExECphoCgwABhABJgQC4wBBWACyTEED2WiEcyIohUQjFiTjCkDi/xhmJ4QFY4CI0JSyHHbZ0o1M3oBC" +
                        "gEkQJAkFQUDq7zBMBigAhGExhgK6QpisyZgiCIjA0wnHcwoAaVS+Q///rdfH4JcGINyclkphSDZggBoM" +
                        "IY0aLUxSCwwJHIqAQy+NwLJ8P13lbkzL3aJAFhyJCgMKFUMV/e99+/nc//19DyDYepGcwIVAZZJS/jhz" +
                        "HCvvPvP1rHG1fXybji3qFU4AQ4BkwCABzAVAfBoBZdYOA9IgEREByCgUQcAWYNoABgVh0moFFqY+ofIk" +
                        "FwYuBKYKAIYLgOGCSiCYGguOgQBQQFgJMBQKDgLXcAQBCATLAImCILLcAgJGAgYmF4pmH4uGEQGmAVsH" +
                        "wIQkAHmFYpg4ESEMjCkBVggEGgkFxKBBh4BD2BASyAqBGly0YwbBB1yAODBoBVQmHIamHgOGMZDnCi5m" +
                        "NgMBSqPIGHjCgrhIVGJjwHbLAYqJGDoPcUmPZgUCggCKtqgZWusCDmD/+9RkZg77ZWhDC93jcgAADSAA" +
                        "AAEvQcEID3eNwAAANIAAAASgMFAScloo0wBABTOIqYCYcGQcHoDQTpn3tLAWsQSHVNhACQQFm6CIMOEM" +
                        "BYyKJRoTmCZiGFcYEZmgbAYa0kRov///lXWqjDLsph2WmICeZBBZg8iHdySYiA46VgEOGSSiYi3dTX83" +
                        "yhsvGOAtfksT2X5MVs997ctU9y7zO3uu/V6UxnULg4kDo8RLO6SzhzCzna/nedv56xu4jMo96yYkoCAF" +
                        "xQBUsgqMDAFRkwNQDDAEBEaUYHoMxg9gXGFyPIZJFrRiEimGA8C6DlgMDABEQ3A4NRAGRieFBKBAwBoO" +
                        "DwmBQwLBKHgwMiIUioBpiAD63SEUDA0GTDkCTLoQzCEFjDfmD+cYC8QGWVHJBoWNJMMwUEqViMKDFgGa" +
                        "QwzAODxwL2aaMFgVcsLiEChXCoAmHxGmE4DmER2nx5QmYwsYSU4YCWemPRMoGAhaYyAq2BgQqtVugkhD" +
                        "JhYGEw7MIBxr6SgQrkwCU7hw0C4NO+NsziEwqVTBgHMNBYyqKEaGymEBtJKeYIAolA/xhgFr9MBDIxYG" +
                        "1LE7mGDo0MfKgDBsw5RTWIJBwJM8nWURNpdLzvPw/D+vRBrwuizoQgYwEHjAxGMCn04K2DAIDFRYYNGK" +
                        "3MGtS7e6/MsfjybjqhYAp0ykEg9mtSgs190lbd+3Wzxn/xZxIbdmzAMOkoTKxBSdwytY0urt+9IualGv" +
                        "iWedaxf3vHDudW3V1h3CrQBgEARgBgGAYA0AgNF2TABAHDgGB4AowDgI1zGBaAUYLIBZgfAKmimNmZAA" +
                        "P5gUgfFUGxoRwuIQkAw6CggAEgAJA8ODECgIYJgMpqIwxYEo8XVfoZB4wWBcwpAEiJ4KAaYNTUUkutYx" +
                        "bE4oBQRgaAgqZ2TAuTAA3wsF7WzAoBrxIBqoIuAQGnBkChIVl3GDAyFAfGIxVGBqOGIiyDEmDjfLQxMs" +
                        "QKgCBypCgWMvAyC2IDQCGQ2YEHIgADH0W74CHrX/+9RkYIL7CmxDs93jcgAADSAAAAEugbkIr3eNyAAA" +
                        "NIAAAATxAPU1RgJGoasAhQg6Y8ATDEXFeqdAgFoQSuZBoLh2gMEgJXgVChiUJreC4LpRGLhImsEMGKMF" +
                        "TqOhhtQcfyC/yy73f9uWIMl8k4+abwMJhh4GmDAaAs4RBlMNtWv085hh+u8/GbizRJiIVwsBWp16/42p" +
                        "HYq5Zc1VkWMxHa8Yaeo8CgRiBAKUDV8sc5Jrm9czw5+PcOby3nl3//VbpZb5EAABQCAOAoGQCjAFAHEI" +
                        "GYVAhQeKoIRgAARGA2CCYDoJxg6gkmqo+KZIoOIcAgZIi0EAQYKhGUDWMAoEAwCgCMEAPR3LTmBoDhAA" +
                        "ggGw4QHpEh7LpiwHmHgImIYDgo6DAUNDFPEjpUfk5zDQuy8pKDphoAypDBMAh4LSoCYUAB4jAYKb4jC0" +
                        "SCR7TAwG9wOYTgEXQMPxGMMBEMHSQOijdCCQGBQMXTLDKoBbVCeDkAKDoxuRS3hdJkQyNzDoqMKAkMI5" +
                        "QFkrzCIkUCCxHMkBYkJZmXsmMgik4EANdJkoQumn8YPABEMW7SIMFixn1IR+rSkOAAANBswEDVdlgQGV" +
                        "wa2ILBs4GDS2DFVY2oM/nda3hvurkbtlnnEZ2s9splEQofCMrGFUahUKBMDBRmmFn88+f3CdiF5bLZ35" +
                        "phQKIx3aW12tR7mNbz5uM38nnvwVcTKGQHNJSF4bH/QY6xore5ZnSbxrWaWzhjj9Be/lNc5yrsAClQgA" +
                        "QAMNVOCQAQwBwEnmBoEoOBXHAETAcAtCAHhCCWAQWQAGQYATGxhzhEGBEDKAiJMBQGGQlBwNEQLBgwRE" +
                        "eApWccAUmAt3xEAxEDJfUMAIlA0VB1HMiDYEgKLACYCQoa7gqYNAkYXCczItaFQFUSMIgPJgRZyl7FgS" +
                        "AULEQKkwERIVBCuOACvxI0wFEEwJAcGjOadmOdKODK0GY4yDmiDIhAQuQmHAoqKExSGBQMCwcAChqDBI" +
                        "uqYQIl+3JFQpeooJhj6oye7/+9RkY4D7VnBDS93bcAAADSAAAAEulcEGzvdtwAAANIAAAAQ7Bku2YxsR" +
                        "S7QGlAlGBkHJhBGt0ACGLd0IAZZ6wICBGTCMQXlEVDJSY4MnZhhcwrFjJjOSjACudicN37VJF+1GHrYM" +
                        "uGDBgQw4uL6CMPEokxENDhM/saBRmRAAJA10Sqfr59zz/lFTS5+X/b+JgkCVxUuflSzNDvDutZ0FzlNT" +
                        "wBBzrgYalCTzJLksn5Vn/LN76vLWf3LH853v/zvdVLn83qtlWAGAQKIPr4JglKwIGQBMFwiC4EgwFgsE" +
                        "xgATpgoMAFG88h+E3uGEyeCEyaAMxBEhMNLowCBUxcC0AAkYTBOYLAuYVBCAgnT7SnMJwPIQFAQYEgFD" +
                        "IGmDgQjRFmE4REIrGR9vG9ZWGKYJmGIdCQWOCYHAIDQPamWzWO3COFYDKCiAGxICYKEALq0JkmDQAp5j" +
                        "w4kwrmJAAmX6fHnkJpokDloWDjQxBPIYEQUoqDGBohEDCMPLKkgGZIOhCSYUSprKbCEtRZHCEIdDIFg/" +
                        "/qL6KlFTJTELjw8PXCZmV4IAdMxWxPmAwwPd5gCmDpmBAziqTMSK09SqlH/lQFNDbzAiAAgSUfqPBOyy" +
                        "nkVeVr6TBRMDnYmMAM3jSbdMtMBUkMDezuqRH4wouAoXx678gkm4jILVagdmLyyNIDH6EIimq7F2Yqx6" +
                        "7WlO89/X5coZBD7I4Q2V/ao6CMNu1a1JU5Y7rmWfbXJRuUcywryrn559vWbve42Z66oDAMYFAoBAJQfH" +
                        "QQFQRMCwnCoQmAIAGNwSGEQLGGIPHrW0mlICmGgPmgTmYHFgWDZjIWA4WEIIMRA5wjBAUMTAZqZhIHBA" +
                        "OL1mDwmIQqIgyw8IMyHxhYqhxhMf/o4uMzIIYMSFdCQiqTBtdgcNgMBkVQgJwAAQTP0rL5Skm28NrFYU" +
                        "YFDxiULABFHQFGCl1JJkjWxIllaOxEKluQ4jVYlurFAA4FtxQkP5PhQCUmKApmgQZaNG0YZexRUOHXcC" +
                        "4Av4hEX/+9RkYY76b29CA7zbcgAADSAAAAEtZcD8Lu9NwAAANIAAAAScQCYaEZITGCyRH2C1lGCg8hEI" +
                        "o1pVYUJi7RiSEEcyepMKN0eeK54WM92bV+PT7opaF6wYFqhZwDBcwYHKCU0ozZAOjRElSaOxu5M6zq6z" +
                        "52Ot2cdCGH2Es6l92W54Z2/qbz1rDHK9MR2L2Y1WZkmy/Xbn1aW9/61Ytbzq50ljG3rudn981hf5vV9I" +
                        "ICAmNAYW2RtMFADRFAgTmKQQlsTFEbDHUkjH1VDml6DU8VDGQExg7MwNzL3Q0IQMdGjFwQdGDFggx4LB" +
                        "oKZQIgAJMnBi2RiJEY2LBcSMjMEIjIVg0MsNCTwrXHP2hwIqYyaPiqA0oTGRsZDzGAERiy0EuwsEMHLq" +
                        "FBGtkQAipy5qvJaYWOGUmhvLkYoZHVcGTDArciECiUnEQwxp4RDwQTT5CpMmeodQsHLdjyy7OpjToiCG" +
                        "jOGnmGxPDRUKiwEtQIqblApxASEajBKa6KjoxYqimTQtyy7UbRih5NI3IQ3Pg86IwY8kBCwFbzm14zef" +
                        "qpFJmldhvmFv6BQDRJaVBBhxxZ8xTY1+oOZAlECgy14cbjOOtAbJ5C2CGazDnlQ6shdRnyJK1XWWFZvA" +
                        "kBcybNXfiehx6o+8Mvwrs6lzxzdE14DGvhmdkktcJl8PZSiHHr+IuPCnizdOKQzT1IRKIcgyXxH43Wr7" +
                        "tSCYTEFNRTMuOTkgKAgAALBg5EJD0TWETsXKylWMLiJkROaEdmOjJrMIECghHABXCRplRpwVhSTGwxnx" +
                        "ppDILNBAE6lcIiGfNmoHgUW2UDEzBjUlwKZFDAkiM5tNsCMkkOhdHiCVx8WQEIA0usI2E1JZJcygZPsV" +
                        "KDUppxlAidwUKmwByA1R8yQQyL4ieLzB2QKsUUIT34FYkUjJWCg8BkoYlWKGnVO3A4AYLaURER8RnDyx" +
                        "CidahshpxRAQgGAbkDxVYAAIaoRMyZtQc+CBjdKYovorAJkkvXcGC2kAFoHJGYodMod6BDD/+9Rkbgb7" +
                        "eXA9M3rLcAAADSAAAAEtucDwLOstwAAANIAAAARYNFRWJCakSketxWO496AFoCwazCE0uNGh0IHDEiYC" +
                        "GIFR44s0FBm+eNiTshYAcHAppII4qt8OL2zLflhaTmQADWi8Q8alsuhF2DmesMZpK39cx0GPIaw7LFzN" +
                        "Pa87aqals0pmGKN1VbKnZgiCmxwfXgZQ2ag5p000qMOysKull8CvjWiVWwy6PxOSNBeVc8DLUbPwLJij" +
                        "QCgLkFAyhp8LPoFZzK6BrRqMmqoDigi41ZQ6cUx6AyCgBfTDFDWhiofIJC+jVAzahjIgiwrNAaN+MNET" +
                        "HYhQjMUFNCIEIcFaTIpUmTTpgcYLMnCXiBOVRqFIFJFUWZAgRMgcEBJgEiE2mQt1ZKuwQgDPoILQGFvF" +
                        "vGXUwewDmmpCMQyUzZOMw9S0uaGCIagQ0aGM4djBCmDQBEISGAZU6QjIAIZkGweEX7UAHnAa2GWgwxYA" +
                        "xBBhwBLILuwXhTCMwcS2CgiT5EYygyAzPNOIsZHBo4tMYoMvLzFyEJKSKdLDV+xZnD6l9S1ggGFk1cA0" +
                        "oGHmtCWfEmwQAXvQRPG/6DLFkcXpLtOIqq1BxJc7jRnDSRTOXeg4sVoMRSTboqm0B0IdhaxFtwW6kDJF" +
                        "O6xlqcy+IAAam0pS2ma+q9pAwHBkof0kFUzep91GYLelMWJJzLvTVnGBM1VEkM0huzHX/Ysr+G5uE0Rf" +
                        "1r8IEZxYSECUkmas/cgmEmAHIqGBTgWGYpkascbJSY4QmNQhijEYICmyC4XCDAV5aIJBzPQgWDBQFTdF" +
                        "hUaGVuIyorKGBYkKpWZyEPyZQMAYzEgVOlNUxcSHQND8kAy1KJhkYS1EFBIJAkjZU8Smz9EwOjO65aAw" +
                        "QUCGEFgDxyA4qBgEAWNTIlIgANVIdEJXRwYMXVhCx6SA0ITEjx6mIqEUFBTMgEaYRGpiyZiDQ062DBwo" +
                        "8WiG9wOPBhaYwwSgcmQNAs5SCHBhHaaQxhkmOYDQOKXp8tEbGsotUjv/+9RkbY37aXA7C1vLcAAADSAA" +
                        "AAEr2cDsDWstwAAANIAAAAQgSYnD6WyNSSSaSOxdpnzAyEFdS5AxlGRUK8QYCIglEwwMuiX3RuaNF0w1" +
                        "/L+XAvJCerYXmQ+RQLx8LwJel4S2qJCwqNJZlQ9DghcpUOhJ9pKoqslR6kEEv0ugZBcNo0XWUVgM7Vte" +
                        "hFeGkvgc0XOgR/GPpuO/ApfxiDfsyV23zFUAbTjBATeYiy0tyrbXWEYW/ogAuijYpWLAFtAg8LXDhkQu" +
                        "MMShM8JBK404YKjE5zU+zggTKjBY1FgNbB0lUphpIyLHgDbuG2RYF9Etx4osQDblbDVk0KhLIKCFbRQK" +
                        "QhC2iOjHC1D/hDEvMDhqhxZhpKQqFSTCsRdIoJAVANUTFABYcu6hkWYXuXogFq6vy66YalpYAgF3lotM" +
                        "BxgiKBQqygCEbfLDiqCa8SbiP0FDhDJUwIZHQEjgcU7jWVaRIdhap0c0xV7l4xEKb4wQMPPGIGrADSAC" +
                        "gXbQjVMrYl6qsXnXWwVp6wagREKvdGYAjr/ToSmWFT0LMFBIsChewNc1d2k3goYBQAAGy0LgRpI9LpL9" +
                        "FZPMWSeh5SoC8aonysLpS7RxEZasTvrEQEpDsPe5MFMcqDuONPNKlax0e1kSpxY0qdIFoLRFSuEhPYav" +
                        "u0oBKQQRGREEqAt4lemPk1B8mnMPAgbUXDUpXQpJnbXWaJiCmopmXHJyQFDC2ODQwoRABWFL4OBMKXUp" +
                        "sFShv6gC1NiV+u1cKTpbVWERlGOGYIZtJlsTWZModCQZZSEtJlMWC1cmpGZCJkMHvIJTFnUHgQmZwpMK" +
                        "k0nY0JQMiYZqZUIRSYLByxBDwJGTXS2eBdylKqqeDJmirCGK8awqeoYSmkaKAoeHGo5GQSgmMSMBKhhK" +
                        "TxtrLDGWYg8zgCRhmqmyDqZZoDssCyaZ7orVTcByTWmAtUBJRmFw6oKpFNYQiL30YIgFCQxaymK12ODI" +
                        "xulJDQYsEquoKzwQClkVWshSqXs8xf1rj7KDAEL/+9Rkbg368HA5E1nLcAAADSAAAAEkwcDMR+MNwAAA" +
                        "NIAAAAR2S2qtr2LBL+Vuhcw+6Jy6iUEMVSNcgKCl+ZqhaQnkiiDBxYV/l4rtSKSNLgoUGSQAkpGgKT6x" +
                        "Yk1lxaBOZx3sSGBiZuHq4ctrMHIJVFkByplyqlclR5K56WsswIQEckxmplsVbEgn5dxTBAWDgUfYS65Z" +
                        "1NV6GUJ1JhL6QeL1O4h1YAFkGUENMghUMvp4A5gxhawjI5jyN1mqJySrO21jLAmtr9YdK4y7yqq7AwwU" +
                        "GlQkEiqwphi40fQqAlOHIAXjE1NpnDQozS1qGUQphrPWmK6Wi7jLoJaarc0Z24YftpqtzA0kQaJQxA4v" +
                        "6yBjzTX6VKXmSkTzTBfRYy+WoLueNrzIWoKBN3aCzqS8cJbK9EASZK3EVmlqWpytIeeQQ2+SpmEtMZy9" +
                        "DBlKWuJ1LxagqaCG2jONlpTc1Ilwk/lXp0tyhcO4U33neZC3Bv2WvtT0VmNPrAEDvzKr9mzGnZeiB3Fh" +
                        "q3KbT6yiBpTZoH6XK2NzYaizgv406AYS4MAPM7NFDUja6zKBGdRN+aBymxq9LrJtK1qavVCozjOtabE5" +
                        "6wrRGLJCsIU5TEFNRTMuOTkgKGFscGhhKao=");
                pd.data.audio.play   = function dom__load_audio() {
                    var source  = pd
                            .test
                            .audio
                            .createBufferSource(),
                        buff    = new ArrayBuffer(pd.data.audio.binary.length),
                        bytes   = new Uint8Array(buff),
                        z       = 0,
                        bytelen = buff.byteLength;
                    for (z = 0; z < bytelen; z += 1) {
                        bytes[z] = pd
                            .data
                            .audio
                            .binary
                            .charCodeAt(z);
                    }
                    pd
                        .test
                        .audio
                        .decodeAudioData(buff, function dom__load_audio_decode(buffer) {
                            source.buffer = buffer;
                            source.loop   = false;
                            source.connect(pd.test.audio.destination);
                            source.start(0, 0, 1.8);
                            console.log("You found a secret!");
                        });
                };
            }
            if (pd.data.node.codeBeauIn !== null) {
                pd.data.node.codeBeauIn.onkeyup = function dom__load_bindBeauInUp(e) {
                    var event = e || window.event;
                    pd
                        .event
                        .recycle(event);
                };
                if (pd.test.ace === true) {
                    pd.data.node.codeBeauIn.onfocus   = textareafocus;
                    pd.data.node.codeBeauIn.onblur    = textareablur;
                    pd.data.node.codeBeauIn.onkeydown = function dom__load_bindBeauInDownCM(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .areaTabOut(event, this);
                        pd
                            .event
                            .keydown(event);
                    };
                } else {
                    pd.data.node.codeBeauIn.onfocus   = textareafocus;
                    pd.data.node.codeBeauIn.onblur    = textareablur;
                    pd.data.node.codeBeauIn.onkeydown = function dom__load_bindBeauInDown(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .fixtabs(event, pd.data.node.codeBeauIn);
                        pd
                            .event
                            .areaTabOut(event, this);
                        pd
                            .event
                            .keydown(event);
                    };
                }
            }
            if (pd.data.node.codeBeauOut !== null && pd.test.ace === true) {
                pd.data.node.codeBeauOut.onfocus   = textareafocus;
                pd.data.node.codeBeauOut.onblur    = textareablur;
                pd.data.node.codeBeauOut.onkeydown = pd.event.areaTabOut;
            }
            if (pd.data.node.codeMinnIn !== null) {
                pd.data.node.codeMinnIn.onkeyup = function dom__load_bindMinnInUp(e) {
                    var event = e || window.event;
                    pd
                        .event
                        .recycle(event);
                };
                if (pd.test.ace === true) {
                    pd.data.node.codeMinnIn.onfocus   = textareafocus;
                    pd.data.node.codeMinnIn.onblur    = textareablur;
                    pd.data.node.codeMinnIn.onkeydown = function dom__load_bindMinnInDownCM(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .areaTabOut(event, this);
                        pd
                            .event
                            .keydown(event);
                    };
                } else {
                    pd.data.node.codeMinnIn.onfocus   = textareafocus;
                    pd.data.node.codeMinnIn.onblur    = textareablur;
                    pd.data.node.codeMinnIn.onkeydown = function dom__load_bindMinnInDown(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .fixtabs(event, this);
                        pd
                            .event
                            .areaTabOut(event, this);
                        pd
                            .event
                            .keydown(event);
                    };
                }
            }
            if (pd.data.node.codeMinnOut !== null && pd.test.ace === true) {
                pd.data.node.codeMinnOut.onfocus   = textareafocus;
                pd.data.node.codeMinnOut.onblur    = textareablur;
                pd.data.node.codeMinnOut.onkeydown = pd.event.areaTabOut;
            }
            if (pd.data.node.codeParsIn !== null) {
                pd.data.node.codeParsIn.onkeyup = function dom__load_bindParsInUp(e) {
                    var event = e || window.event;
                    pd
                        .event
                        .recycle(event);
                };
                if (pd.test.ace === true) {
                    pd.data.node.codeParsIn.onfocus   = textareafocus;
                    pd.data.node.codeParsIn.onblur    = textareablur;
                    pd.data.node.codeParsIn.onkeydown = function dom__load_bindParsInDownCM(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .areaTabOut(event, this);
                        pd
                            .event
                            .keydown(event);
                    };
                } else {
                    pd.data.node.codeParsIn.onfocus   = textareafocus;
                    pd.data.node.codeParsIn.onblur    = textareablur;
                    pd.data.node.codeParsIn.onkeydown = function dom__load_bindParsInDown(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .fixtabs(event, pd.data.node.codeParsIn);
                        pd
                            .event
                            .areaTabOut(event, this);
                        pd
                            .event
                            .keydown(event);
                    };
                }
            }
            if (pd.data.node.codeParsOut !== null && pd.test.ace === true) {
                pd.data.node.codeParsOut.onfocus   = textareafocus;
                pd.data.node.codeParsOut.onblur    = textareablur;
                pd.data.node.codeParsOut.onkeydown = pd.event.areaTabOut;
            }
            if (pd.data.node.codeDiffBase !== null) {
                if (pd.test.ace === true) {
                    pd.data.node.codeDiffBase.onkeyup   = function dom__load_bindAutoDiffBase() {
                        pd
                            .app
                            .langkey(false, pd.ace.diffBase, "");
                    };
                    pd.data.node.codeDiffBase.onfocus   = textareafocus;
                    pd.data.node.codeDiffBase.onblur    = textareablur;
                    pd.data.node.codeDiffBase.onkeydown = pd.event.areaTabOut;
                } else {
                    pd.data.node.codeDiffBase.onfocus   = textareafocus;
                    pd.data.node.codeDiffBase.onblur    = textareablur;
                    pd.data.node.codeDiffBase.onkeydown = function dom__load_bindDiffBaseDown(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .fixtabs(event, this);
                        pd
                            .event
                            .areaTabOut(event, this);
                    };
                }
            }
            if (pd.data.node.codeDiffNew !== null) {
                if (pd.test.ace === true) {
                    pd.data.node.codeDiffNew.onkeyup   = function dom__load_bindAutoDiffNew() {
                        pd
                            .app
                            .langkey(false, pd.ace.diffNew, "");
                    };
                    pd.data.node.codeDiffNew.onfocus   = textareafocus;
                    pd.data.node.codeDiffNew.onblur    = textareablur;
                    pd.data.node.codeDiffNew.onkeydown = pd.event.areaTabOut;
                } else {
                    pd.data.node.codeDiffNew.onfocus   = textareafocus;
                    pd.data.node.codeDiffNew.onblur    = textareablur;
                    pd.data.node.codeDiffNew.onkeydown = function dom__load_bindDiffNewDown(e) {
                        var event = e || window.event;
                        pd
                            .event
                            .fixtabs(event, this);
                        pd
                            .event
                            .areaTabOut(event, this);
                    };
                }
            }
            window.onresize     = pd.app.fixHeight;
            window.onkeyup      = pd.event.areaShiftUp;
            document.onkeypress = backspace;
            document.onkeydown  = backspace;
            checkForEdition();
        }
        if (page === "documentation") {
            (function dom__load_documentation() {
                var b           = 0,
                    docbuttons  = document.getElementsByTagName("button"),
                    colorParam  = (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1)
                        ? location
                            .href
                            .toLowerCase()
                            .split("?")[1]
                        : "",
                    colorScheme = pd.id("colorScheme"),
                    hashgo      = function dom__load_documentation_hashgo() {
                        var hash     = "",
                            test     = false,
                            hashnode = {},
                            parent   = {},
                            body     = document.getElementsByTagName("body")[0];
                        if (location.href.indexOf("#") > 0) {
                            hash     = location
                                .href
                                .split("#")[1];
                            hashnode = document.getElementById(hash);
                            if (hashnode !== null) {
                                parent = hashnode.parentNode;
                                test   = (parent.nodeName.toLowerCase() === "h2" || parent.getAttribute("class") === "content-hide");
                                if (test === true) {
                                    parent
                                        .parentNode
                                        .getElementsByTagName("button")[0]
                                        .click();
                                } else {
                                    do {
                                        parent = parent.parentNode;
                                        test   = (parent.nodeName.toLowerCase() === "h2" || parent.getAttribute("class") === "content-hide");
                                    } while (test === false && parent.nodeName.toLowerCase() !== "body");
                                    if (test === true) {
                                        parent
                                            .parentNode
                                            .getElementsByTagName("button")[0]
                                            .click();
                                    }
                                }
                                document.documentElement.scrollTop = hashnode.offsetTop;
                                body.scrollTop                     = hashnode.offsetTop;
                            }
                        }
                    },
                    showhide    = function dom__load_documentation_showhide() {
                        var span   = this.getElementsByTagName("span")[0],
                            target = this
                                .parentNode
                                .parentNode
                                .getElementsByTagName("div")[0];
                        if (target === undefined) {
                            return;
                        }
                        if (span.innerHTML === "Show") {
                            target.setAttribute("class", "content-show");
                            span.innerHTML = "Hide";
                        } else {
                            target.setAttribute("class", "content-hide");
                            span.innerHTML = "Show";
                        }
                    },
                    colorChange = function dom__load_documentation_colorChange() {
                        var options = colorScheme.getElementsByTagName("option"),
                            olen    = options.length;
                        if (localStorage !== null && localStorage.settings !== undefined && localStorage.settings !== null && localStorage.settings.indexOf(":undefined") > 0) {
                            localStorage.settings = localStorage
                                .settings
                                .replace(/:undefined/g, ":false");
                        }
                        pd.data.settings = (pd.test.ls === true && pd.test.json === true && localStorage.settings !== undefined)
                            ? JSON.parse(localStorage.settings)
                            : {};
                        if (colorParam.indexOf("c=") === 0 || colorParam.indexOf("&c=") > -1) {
                            if (colorParam.indexOf("&c=") > -1) {
                                colorParam.substr(colorParam.indexOf("&c=") + 1);
                            }
                            colorParam = colorParam.split("&")[0];
                            colorParam = colorParam.substr(colorParam.indexOf("=") + 1);
                            for (b = 0; b < olen; b += 1) {
                                if (options[b].value.toLowerCase() === colorParam) {
                                    node.selectedIndex = b;
                                    break;
                                }
                            }
                        }
                        if (((olen > 0 && b !== olen) || olen === 0) && pd.data.settings.colorScheme !== undefined) {
                            colorScheme.selectedIndex = pd.data.settings.colorScheme;
                        }
                        pd
                            .event
                            .colorScheme(colorScheme);
                        colorScheme.onchange = pd.event.colorScheme;
                    };
                b = docbuttons.length;
                for (a = 0; a < b; a += 1) {
                    if (docbuttons[a].parentNode.nodeName.toLowerCase() === "h2") {
                        docbuttons[a].onclick = showhide;
                    }
                }
                if (colorScheme !== null) {
                    colorChange();
                }
                checkForEdition();
                window.onhashchange = hashgo;
                hashgo();
            }());
        }
        if (page === "page") {
            (function dom__load_doc() {
                var b          = 0,
                    colorParam = (typeof location === "object" && typeof location.href === "string" && location.href.indexOf("?") > -1)
                        ? location
                            .href
                            .toLowerCase()
                            .split("?")[1]
                        : "",
                    options    = [],
                    olen       = 0;
                node    = pd.id("colorScheme");
                options = node.getElementsByTagName("option");
                olen    = options.length;
                if (node !== null) {
                    if (localStorage !== null && localStorage.settings !== undefined && localStorage.settings !== null && localStorage.settings.indexOf(":undefined") > 0) {
                        localStorage.settings = localStorage
                            .settings
                            .replace(/:undefined/g, ":false");
                    }
                    pd.data.settings = (pd.test.ls === true && pd.test.json === true && localStorage.settings !== undefined)
                        ? JSON.parse(localStorage.settings)
                        : {};
                    if (colorParam.indexOf("c=") === 0 || colorParam.indexOf("&c=") > -1) {
                        if (colorParam.indexOf("&c=") > -1) {
                            colorParam.substr(colorParam.indexOf("&c=") + 1);
                        }
                        colorParam = colorParam.split("&")[0];
                        colorParam = colorParam.substr(colorParam.indexOf("=") + 1);
                        for (b = 0; b < olen; b += 1) {
                            if (options[b].value.toLowerCase() === colorParam) {
                                node.selectedIndex = b;
                                break;
                            }
                        }
                    }
                    if (((olen > 0 && b !== olen) || olen === 0) && pd.data.settings.colorScheme !== undefined) {
                        node.selectedIndex = pd.data.settings.colorScheme;
                    }
                    pd
                        .event
                        .colorScheme(node);
                    node.onchange = pd.event.colorScheme;
                }
                (function dom__doc_foldSearch() {
                    var div   = document.getElementsByTagName("div"),
                        len   = div.length,
                        inca  = 0,
                        incb  = 0,
                        ol    = [],
                        li    = [],
                        lilen = 0;
                    for (inca = 0; inca < len; inca += 1) {
                        if (div[inca].getAttribute("class") === "beautify") {
                            ol = div[inca].getElementsByTagName("ol");
                            if (ol[0].getAttribute("class") === "count") {
                                li    = ol[0].getElementsByTagName("li");
                                lilen = li.length;
                                for (incb = 0; incb < lilen; incb += 1) {
                                    if (li[incb].getAttribute("class") === "fold") {
                                        li[incb].onmousedown = pd.event.beaufold;
                                    }
                                }
                            }
                        }
                    }
                }());
            }());
        }
        pd.test.load = false;
    };
    if (pd.data.node.page === null || pd.data.node.page === undefined || pd.data.node.page.getAttribute("id") === null) {
        window.onload = loadPrep;
    } else {
        load();
    }
}());
