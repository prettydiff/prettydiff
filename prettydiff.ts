/*global global, window*/
(function mode_init() {
    "use strict";
    const mode = function mode_(options:any, diffmeta?:diffmeta):string {
        let parseMethod:string = "parserArrays",
            globalAPI:any = (options.api === "dom")
                ? window
                : global,
            modeValue:"beautify"|"minify" = options.mode,
            result:string = "";
        const pdcomment = function mode_pdcomment(options:any):void {
                // parses the prettydiff settings comment
                //
                // - Source Priorities:
                // * the prettydiff comment is only accepted if it occurs before non-comments (near the top)
                // * options.source is the priority material for reading the comment
                // * the prettydiff comment will be processed from options.diff only if it present there, missing from options.source, and options.mode is diff
                //
                // - Examples:
                //    /*prettydiff.com width:80 preserve:4*/
                //    /* prettydiff.com width:80 preserve:4 */
                //    /*prettydiff.com width=80 preserve=4 */
                //    // prettydiff.com width=80 preserve:4
                //    <!-- prettydiff.com width:80 preserve=4 -->
                //    <!--prettydiff.com width:40 preserve:2-->
                //
                // - Parsing Considerations:
                // * there may be any amount of space at the start or end of the comment
                // * "prettydiff.com" must exist at the start of the comment
                // * comment must exist prior to non-comment tokens (near top of code)
                // * parameters are name value pairs separated by white space
                // * the delimiter separating name and value is either ":" or "=" characters
            
                if (options.source.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/) > -1 || (options.mode === "diff" && options.diff.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/) > -1)) {
                    let pdcom:number = options.source.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/),
                        a:number = (pdcom > -1)
                            ? pdcom
                            : options.diff.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/),
                        b:number = 0,
                        quote:string = "",
                        item:string = "",
                        op:string[] = [];
                    const ops:string[] = [],
                        source:string = (pdcom > -1)
                            ? options.source
                            : options.diff,
                        len:number = source.length,
                        comment:string = (source.charAt(a) === "<")
                            ? "<!--"
                            : (source.charAt(a + 1) === "/")
                                ? "//"
                                : "/\u002a",
                        esc = function mode_pdcomment_esc():boolean {
                            if (source.charAt(a - 1) !== "\\") {
                                return false;
                            }
                            let x:number = a;
                            do {
                                x = x - 1;
                            } while (x > 0 && source.charAt(x) === "\\");
                            if ((a - x) % 2 === 0) {
                                return true;
                            }
                            return false;
                        };
                    do {
                        if (source.slice(a - 3, a) === "com") {
                            break;
                        }
                        a = a + 1;
                    } while (a < len);
                    do {
                        if (esc() === false) {
                            if (quote === "") {
                                if (source.charAt(a) === "\"") {
                                    quote = "\"";
                                    if (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=") {
                                        b = a;
                                    }
                                } else if (source.charAt(a) === "'") {
                                    quote = "'";
                                    if (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=") {
                                        b = a;
                                    }
                                } else if (source.charAt(a) === "`") {
                                    quote = "`";
                                    if (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=") {
                                        b = a;
                                    }
                                } else if ((/\s/).test(source.charAt(a)) === false && b === 0) {
                                    b = a;
                                } else if (source.charAt(a) === "," || ((/\s/).test(source.charAt(a)) === true && b > 0)) {
                                    item = source.slice(b, a);
                                    if (ops.length > 0) {
                                        if (ops.length > 0 && (item === ":" || item === "=") && ops[ops.length - 1].indexOf("=") < 0 && ops[ops.length - 1].indexOf(":") < 0) {
                                            // for cases where white space is between option name and assignment operator
                                            ops[ops.length - 1] = ops[ops.length - 1] + item;
                                            b = a;
                                        } else if (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=") {
                                            // for cases where white space is between assignment operator and value
                                            ops[ops.length - 1] = ops[ops.length - 1] + item;
                                            b = 0;
                                        } else {
                                            ops.push(item);
                                            b = 0;
                                        }
                                    } else {
                                        ops.push(item);
                                        b = 0;
                                    }
                                }
                                if (comment === "<!--" && source.slice(a - 2, a + 1) === "-->") {
                                    break;
                                }
                                if (comment === "//" && source.charAt(a) === "\n") {
                                    break;
                                }
                                if (comment === "/\u002a" && source.slice(a - 1, a + 1) === "\u002a/") {
                                    break;
                                }
                            } else if (source.charAt(a) === quote && quote !== "${") {
                                quote = "";
                            } else if (quote === "`" && source.slice(a, a + 2) === "${") {
                                quote = "${";
                            } else if (quote === "${" && source.charAt(a) === "}") {
                                quote = "`";
                            }
                        }
                        a = a + 1;
                    } while (a < len);
                    if (b > 0) {
                        quote = source.slice(b, a + 1);
                        if (comment === "<!--") {
                            quote = quote.replace(/\s*-+>$/, "");
                        } else if (comment === "//") {
                            quote = quote.replace(/\s+$/, "");
                        } else {
                            quote = quote.replace(/\s*\u002a\/$/, "");
                        }
                        ops.push(quote);
                    }
                    a = ops.length;
                    if (a > 0) {
                        do {
                            a = a - 1;
                            if (ops[a].indexOf("=") > 0 && ops[a].indexOf(":") > 0) {
                                if (ops[a].indexOf("=") < ops[a].indexOf(":")) {
                                    op = [ops[a].slice(0, ops[a].indexOf("=")), ops[a].slice(ops[a].indexOf("=") + 1)];
                                }
                            } else if (ops[a].indexOf("=") > 0) {
                                op = [ops[a].slice(0, ops[a].indexOf("=")), ops[a].slice(ops[a].indexOf("=") + 1)];
                            } else if (ops[a].indexOf(":") > 0) {
                                op = [ops[a].slice(0, ops[a].indexOf(":")), ops[a].slice(ops[a].indexOf(":") + 1)];
                            } else if (global.prettydiff.api.optionDef[ops[a]] !== undefined && global.prettydiff.api.optionDef[ops[a]].type === "boolean") {
                                options[ops[a]] = true;
                            }
                            if (op.length === 2 && global.prettydiff.api.optionDef[op[0]] !== undefined) {
                                if ((op[1].charAt(0) === "\"" || op[1].charAt(0) === "'" || op[1].charAt(0) === "`") && op[1].charAt(op[1].length - 1) === op[1].charAt(0)) {
                                    op[1] = op[1].slice(1, op[1].length - 1);
                                }
                                if (global.prettydiff.api.optionDef[op[0]].type === "number" && isNaN(Number(op[1])) === false) {
                                    options[op[0]] = Number(op[1]);
                                } else if (global.prettydiff.api.optionDef[op[0]].type === "boolean") {
                                    if (op[1] === "true") {
                                        options[op[0]] = true;
                                    } else if (op[1] === "false") {
                                        options[op[0]] = false;
                                    }
                                } else {
                                    if (global.prettydiff.api.optionDef[op[0]].values !== undefined) {
                                        b = global.prettydiff.api.optionDef[op[0]].values.length;
                                        do {
                                            b = b - 1;
                                            if (global.prettydiff.api.optionDef[op[0]].values[b] === op[1]) {
                                                options[op[0]] = op[1];
                                                break;
                                            }
                                        } while (b > 0);
                                    } else {
                                        options[op[0]] = op[1];
                                    }
                                }
                            }
                        } while (a > 0);
                    }
                }
            },
            // prettydiff insertion start
            prettydiff:any = {};
        // prettydiff insertion end

        if (options.api !== "node") {
            options.diff_cli = false;
        } else if (options.api === "node" && (options.read_method === "directory" || options.read_method === "subdirectory")) {
            if (options.mode === "parse" && options.parse_format === "table") {
                return "Error: option parse_format with value 'table' is not available with read_method directory or subdirectory.";
            }
        }
        if (options.language === "auto") {
            const lang:[string, string, string] = prettydiff.api.language.auto(options.source, "javascript");
            if (lang[0] === "text") {
                lang[2] = "Plain Text";
            } else if (lang[0] === "csv") {
                lang[2] = "CSV";
            }
            options.language = lang[0];
            options.lexer = lang[1];
            options.language_name = lang[2];
        }

        // test complete_document in dom (try to generate xml errors)
        // test updated script strings in finalFile
        // write simulation tests for complete_document
        // write validation tests for complete_document

        pdcomment(options);
        
        if (options.api === "dom") {
            globalAPI = window;
        }
        if (options.mode === "parse" && options.parse_format === "sequential") {
            parseMethod = "parserObjects";
        }
        if (options.mode === "diff") {
            modeValue = "beautify";
        }
        if (options.mode === "minify" && options.minify_wrap === false) {
            options.wrap = -1;
        }
        if (typeof options.lexerOptions !== "object") {
            options.lexerOptions = {};
        }
        if (typeof options.lexerOptions[options.lexer] !== "object") {
            options.lexerOptions[options.lexer] = {};
        }
        if (options.object_sort === true) {
            options.lexerOptions[options.lexer].objectSort = true;
        }
        if (options.lexer === "script") {
            options.lexerOptions.script.varword = options.variable_list;
        }
        if (options.mode === "parse") {
            const parse_format = (options.parse_format === "htmltable")
                    ? "table"
                    : options.parse_format,
                api = (options.parse_format === "htmltable")
                    ? "dom"
                    : options.api;

            options.parsed = globalAPI.parseFramework[parseMethod](options);
            if (parse_format === "table") {
                if (api === "dom") {
                    const parsLen:number = options.parsed.token.length,
                        keys = Object.keys(options.parsed),
                        keylen:number = keys.length,
                        headingString:string = (function dom_event_execute_app_renderOutput_heading():string {
                            const hout:string[] = ["<tr><th>index</th>"];
                            let b:number = 0;
                            do {
                                if (keys[b] !== "token") {
                                    hout.push(`<th>${keys[b]}</th>`);
                                }
                                b = b + 1;
                            } while (b < keylen);
                            hout.push("<th>token</th></tr>");
                            return hout.join("");
                        }()),
                        row = function dom_event_execute_app_renderOutput_row():string {
                            const hout:string[] = ["<tr>"];
                            let b = 0;
                            hout.push(`<td>${a}</td>`);
                            do {
                                if (keys[b] !== "token") {
                                    hout.push(`<td>${options.parsed[keys[b]][a].toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`);
                                }
                                b = b + 1;
                            } while (b < keylen);
                            hout.push(`<td>${options.parsed.token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td></tr>`);
                            return hout.join("");
                        },
                        parsOut:string[] = [];
                    parsOut.push(`<p><strong>${parsLen}</strong> total parsed tokens</p>`);
                    parsOut.push("<table><thead>");
                    parsOut.push(headingString);
                    parsOut.push("</thead><tbody>");
                    let a:number = 0;
                    do {
                        if (a % 100 === 0 && a > 0) {
                            parsOut.push(headingString);
                        }
                        parsOut.push(row());
                        a = a + 1;
                    } while (a < parsLen);
                    parsOut.push("</tbody></table>");
                    result = parsOut.join("");
                } else {
                    let a:number   = 0,
                        str:string[] = [];
                    const os = require("os"),
                        outputArrays:parsedArray = options.parsed,
                        nodeText:any     = {
                            angry    : "\u001b[1m\u001b[31m",
                            blue     : "\u001b[34m",
                            bold     : "\u001b[1m",
                            cyan     : "\u001b[36m",
                            green    : "\u001b[32m",
                            nocolor  : "\u001b[39m",
                            none     : "\u001b[0m",
                            purple   : "\u001b[35m",
                            red      : "\u001b[31m",
                            underline: "\u001b[4m",
                            yellow   : "\u001b[33m"
                        },
                        output:string[] = [],
                        b:number = outputArrays.token.length,
                        pad = function mode_parsePad(x:string, y:number):void {
                            const cc:string = x
                                    .toString()
                                    .replace(/\s/g, " ");
                            let dd:number = y - cc.length;
                            str.push(cc);
                            if (dd > 0) {
                                do {
                                    str.push(" ");
                                    dd = dd - 1;
                                } while (dd > 0);
                            }
                            str.push(" | ");
                        },
                        heading:string = "index | begin | lexer  | lines | presv | stack       | types       | token",
                        bar:string     = "------|-------|--------|-------|-------|-------------|-------------|------";
                    output.push("");
                    output.push(heading);
                    output.push(bar);
                    do {
                        if (a % 100 === 0 && a > 0) {
                            output.push("");
                            output.push(heading);
                            output.push(bar);
                        }
                        str = [];
                        if (outputArrays.lexer[a] === "markup") {
                            str.push(nodeText.red);
                        } else if (outputArrays.lexer[a] === "script") {
                            str.push(nodeText.green);
                        } else if (outputArrays.lexer[a] === "style") {
                            str.push(nodeText.yellow);
                        }
                        pad(a.toString(), 5);
                        pad(outputArrays.begin[a].toString(), 5);
                        pad(outputArrays.lexer[a].toString(), 5);
                        pad(outputArrays.lines[a].toString(), 5);
                        pad(outputArrays.presv[a].toString(), 5);
                        pad(outputArrays.stack[a].toString(), 11);
                        pad(outputArrays.types[a].toString(), 11);
                        str.push(outputArrays.token[a].replace(/\s/g, " "));
                        str.push(nodeText.none);
                        output.push(str.join(""));
                        a = a + 1;
                    } while (a < b);
                    result = output.join(os.EOL);
                }
            } else {
                result = JSON.stringify(options.parsed);
            }
        } else {
            if (global.prettydiff[modeValue][options.lexer] === undefined && (options.mode !== "diff" || (options.mode === "diff" && options.language !== "text"))) {
                result = `Error: Library prettydiff.${modeValue}.${options.lexer} does not exist.`;
            } else if (options.mode === "diff") {
                let diffoutput:[string, number, number];
                const source:string = options.source,

                // diffview insertion start
                diffview:any = {};
                // diffview insertion end

                if (options.language !== "text") {
                    // this silliness is required because the other libraries only recognize the 'source' option and not the 'diff' option but need to be equally modified
                    options.source = options.diff;
                    options.parsed = globalAPI.parseFramework[parseMethod](options);
                    options.diff = global.prettydiff.beautify[options.lexer](options);
                    options.source = source;
                    options.parsed = globalAPI.parseFramework[parseMethod](options);
                    options.source = global.prettydiff.beautify[options.lexer](options);
                }
                diffoutput = diffview(options);
                result = diffoutput[0];
                if (diffmeta !== undefined) {
                    diffmeta.differences = diffoutput[1];
                    diffmeta.lines = diffoutput[2];
                }
            } else {
                options.parsed = globalAPI.parseFramework[parseMethod](options);
                result = global.prettydiff[modeValue][options.lexer](options);
            }
        }
        if (options.complete_document === true && options.jsscope !== "report") {
            // finalFile insertion start
            let finalFile:finalFile;
            // finalFile insertion end

            finalFile.order[7] = options.color;
            finalFile.order[10] = result;
            if (options.mode === "diff") {
                finalFile.order[12] = finalFile.script.diff;
            } else if (options.mode === "beautify" && options.language === "javascript" && options.jsscope !== "none") {
                finalFile.order[12] = finalFile.script.beautify;
            } else {
                finalFile.order[12] = finalFile.script.minimal;
            }
            // escape changes characters that result in xml wellformedness errors
            return finalFile.order.join("");
        }
        return result;
    };
    global.prettydiff.mode = mode;
}());