/*global global*/
(function pdcomment_init():void {
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
    "use strict";
    const pdcomment = function pdcomment_(options:any):void {
        if (options.source.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/) > -1 || (options.mode === "diff" && options.diff.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/) > -1)) {
            let pdcom:number = options.source.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/),
                a:number = (pdcom > -1)
                    ? pdcom
                    : options.diff.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/),
                b:number = 0,
                quote:string = "",
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
                esc = function pdcomment_esc():boolean {
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
                        } else if (source.charAt(a) === "'") {
                            quote = "'";
                        } else if (source.charAt(a) === "`") {
                            quote = "`";
                        } else if ((/\s/).test(source.charAt(a)) === false && b === 0) {
                            b = a;
                        } else if ((/\s/).test(source.charAt(a)) === true && b > 0) {
                            ops.push(source.slice(b, a));
                            b = 0;
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
                        if (global.prettydiff.api.optionDef[op[0]].type === "number" && isNaN(Number(op[1])) === false) {
                            options[op[0]] = Number(op[1]);
                        } else if (global.prettydiff.api.optionDef[op[0]].type === "boolean") {
                            if (op[1] === "true") {
                                options[op[0]] = true;
                            } else if (op[1] === "false") {
                                options[op[0]] = false;
                            }
                        } else {
                            if (global.prettydiff.api.optionDef[op[0]].values === undefined) {
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
    };
    global.prettydiff.api.pdcomment = pdcomment;
}());