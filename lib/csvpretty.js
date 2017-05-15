/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" ",api.vertical:true */
/*global ace, define, global, module*/
/***********************************************************************
 csvpretty is written by Austin Cheney on 2 Oct 2015.

 Please see the license.txt file associated with the Pretty Diff
 application for license information.
 **********************************************************************/
(function () {
    "use strict";
    var csvpretty = function csvpretty_(options) {
        var token = [];
        options.csvchar = (typeof options.csvchar === "string")
            ? options.csvchar
            : ",";
        options.source  = (
            typeof options.source !== "string" || options.source === "" || (/^(\s+)$/).test(options.source) === true
        )
            ? "Error: no source supplied to csvpretty."
            : options
                .source
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
        (function csvpretty__tokenize() {
            var input      = options
                    .source
                    .split(""),
                d          = options.csvchar.length,
                e          = 0,
                cell       = [],
                row        = [],
                quote      = false,
                cellCrunch = function csvpretty__tokenize_cellCrunch() {
                    var str = cell.join("");
                    cell = [];
                    if (str !== "") {
                        row.push(str);
                    }
                },
                parse      = function csvpretty__tokenize_parse(item, index, arr) {
                    if (quote === false) {
                        if (cell.length === 0 && item === "\"" && (arr[index + 1] !== "\"" || arr[index + 2] === "\"")) {
                            quote = true;
                        } else if (item === "\"" && arr[index + 1] === "\"") {
                            cell.push("\"");
                            arr[index + 1] = "";
                        } else if (item === "\n") {
                            cellCrunch();
                            token.push(row);
                            row = [];
                        } else if (item === options.csvchar.charAt(0)) {
                            if (d === 1) {
                                cellCrunch();
                            } else {
                                e = 0;
                                do {
                                    e = e + 1;
                                } while (e < d && arr[index + e] === options.csvchar.charAt(e));
                                if (e === d) {
                                    cellCrunch();
                                    e = 1;
                                    do {
                                        arr[index + e] = "";
                                        e              = e + 1;
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
    if ((typeof define === "object" || typeof define === "function") && (typeof ace !== "object" || ace.prettydiffid === undefined)) {
        //requirejs support
        define(function csvpretty_requirejs() {
            return function csvpretty_requirejs_wrapper(x) {
                return csvpretty(x);
            };
        });
    } else if (typeof module === "object" && typeof module.parent === "object") {
        //commonjs and nodejs support
        module.exports = function commonjs_csvpretty(x) {
            return csvpretty(x);
        };
    } else {
        global.prettydiff.csvpretty = csvpretty;
    }
}());
