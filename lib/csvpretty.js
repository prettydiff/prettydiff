/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global define, exports, global*/
/***********************************************************************
 csvpretty is written by Austin Cheney on 2 Oct 2015.  Anybody may use
 this code without permission so long as this comment exists verbatim in
 each instance of its use.

 http://mailmarkup.org/
 http://prettydiff.com/
 **********************************************************************/
var csvpretty = function csvpretty_(args) {
    "use strict";
    var token = [],
        vcsvchar = (typeof args.csvchar === "string")
            ? args.csvchar
            : ",",
        vsource = (typeof args.source !== "string" || args.source === "" || (/^(\s+)$/).test(args.source) === true)
            ? "Error: no source supplied to csvpretty."
            : args.source;
    (function csvpretty__tokenize() {
        var input = vsource.split(""),
            d = vcsvchar.length,
            e = 0,
            cell = [],
            row = [],
            quote = false,
            cellCrunch = function csvpretty__tokenize_cellCrunch() {
                var str = cell.join("");
                cell = [];
                if (str !== "") {
                    row.push(str);
                }
            },
            parse = function csvpretty__tokenize_parse(item, index, arr) {
                if (quote === false) {
                    if (cell.length === 0 && item === "\"" && (arr[index + 1] !== "\"" || arr[index + 2] === "\"")) {
                        quote = true;
                    } else if (item === "\"" && arr[index + 1] === "\"") {
                        cell.push("\"");
                        arr[index + 1] = "";
                    } else if (item === "\n" || item === "\r") {
                        cellCrunch();
                        token.push(row);
                        row = [];
                    } else if (item === vcsvchar.charAt(0)) {
                        if (d === 1) {
                            cellCrunch();
                        } else {
                            e = 0;
                            do {
                                e += 1;
                            } while (e < d && arr[index + e] === vcsvchar.charAt(e));
                            if (e === d) {
                                cellCrunch();
                                e = 1;
                                do {
                                    arr[index + e] = "";
                                    e += 1;
                                } while (e < d);
                            } else if (item !== "") {
                                cell.push(item);
                            }
                        }
                    } else if (item !== "") {
                        cell.push(item);
                    }
                } else if (item !== "\"" && item !== "") {
                    cell.push(item);
                } else if (item === "\"" && arr[index + 1] === "\"") {
                    cell.push("\"");
                    arr[index + 1] = "";
                } else if (item === "\"") {
                    cellCrunch();
                    quote = false;
                }
            };
        input.forEach(parse);
        if (cell.length > 0) {
            cellCrunch();
            token.push(row);
        }
    }());
    return token;
};
if (typeof exports === "object" || typeof exports === "function") {
    //commonjs and nodejs support
    exports.api     = function commonjs(x) {
        "use strict";
        return csvpretty(x);
    };
} else if ((typeof define === "object" || typeof define === "function") && (ace === undefined || ace.createEditSession === undefined)) {
    //requirejs support
    define(function requirejs(require, exports) {
        "use strict";
        exports.api     = function requirejs_export(x) {
            return csvpretty(x);
        };
        //worthless if block to appease RequireJS and JSLint
        if (typeof require === "number") {
            return require;
        }
        return exports.api;
    });
}
