/*global global, prettydiff*/
(function beautify_style_init():void {
    "use strict";
    const style = function beautify_style(options:any):string {
        const data:parsedArray = options.parsed,
            lf:"\r\n"|"\n"         = (options.crlf === true)
                ? "\r\n"
                : "\n",
            len:number      = (options.end > 0)
                ? options.end + 1
                : data.token.length,
            build:string[]    = [],
            //a single unit of indentation
            tab:string      = (function beautify_style_tab():string {
                let aa:number = 0,
                    bb:string[] = [];
                do {
                    bb.push(options.indent_char);
                    aa = aa + 1;
                } while (aa < options.indent_size);
                return bb.join("");
            }()),
            pres:number = options.preserve + 1,
            //new lines plus indentation
            nl       = function beautify_style_nl(tabs:number):void {
                const linesout:string[] = [],
                    total:number = (function beautify_style_nl_total():number {
                        if (a === len - 1) {
                            return 1;
                        }
                        if (data.lines[a + 1] - 1 > pres) {
                            return pres;
                        }
                        if (data.lines[a + 1] > 1) {
                            return data.lines[a + 1] - 1;
                        }
                        return 1;
                    }());
                let index = 0;
                if (tabs < 0) {
                    tabs = 0;
                }
                do {
                    linesout.push(lf);
                    index = index + 1;
                } while (index < total);
                if (tabs > 0) {
                    index = 0;
                    do {
                        linesout.push(tab);
                        index = index + 1;
                    } while (index < tabs);
                }
                build.push(linesout.join(""));
            },
            //breaks selector lists onto newlines
            selector = function beautify_style_selector(item:string):void {
                let aa:number    = 0,
                    bb:number    = 0,
                    cc:number    = 0,
                    leng:number  = item.length,
                    block:string = "";
                const items:string[] = [];
                if (options.compressed_css === true && (/\)\s*when\s*\(/).test(item) === true) {
                    item = item.replace(
                        /\)\s*when\s*\(/,
                        ")" + lf + (function beautify_style_selector_whenTab():string {
                            let wtab = "",
                                aaa  = indent + 1;
                            do {
                                wtab = wtab + tab;
                                aaa  = aaa - 1;
                            } while (aaa > 0);
                            return wtab;
                        }()) + "when ("
                    );
                }
                do {
                    if (block === "") {
                        if (item.charAt(aa) === "\"") {
                            block = "\"";
                            bb    = bb + 1;
                        } else if (item.charAt(aa) === "'") {
                            block = "'";
                            bb    = bb + 1;
                        } else if (item.charAt(aa) === "(") {
                            block = ")";
                            bb    = bb + 1;
                        } else if (item.charAt(aa) === "[") {
                            block = "]";
                            bb    = bb + 1;
                        }
                    } else if ((item.charAt(aa) === "(" && block === ")") || (item.charAt(aa) === "[" && block === "]")) {
                        bb = bb + 1;
                    } else if (item.charAt(aa) === block) {
                        bb = bb - 1;
                        if (bb === 0) {
                            block = "";
                        }
                    }
                    if (block === "" && item.charAt(aa) === ",") {
                        items.push(item.substring(cc, aa + 1));
                        cc = aa + 1;
                    }
                    aa = aa + 1;
                } while (aa < leng);
                if (cc > 0) {
                    items.push(item.substr(cc));
                }
                leng = items.length;
                if (leng === 0) {
                    items.push(item);
                }
                if (options.selector_list === true || leng < 2) {
                    if (options.compressed_css === true) {
                        build.push(items.join(" ").replace(/(\s*,\s*)/g, ","));
                    } else {
                        build.push(items.join(" ").replace(/(\s*,\s*)/g, ", "));
                    }
                } else {
                    aa = 1;
                    if (options.compressed_css === true) {
                        build.push(items[0].replace(/(\s*,\s*)/g, ","));
                    } else {
                        build.push(items[0].replace(/(\s*,\s*)/g, ", ").replace(/(,\u0020)$/, ","));
                    }
                    do {
                        nl(indent);
                        if (options.compressed_css === true) {
                            build.push(items[aa].replace(/(\s*,\s*)/g, ","));
                        } else {
                            build.push(items[aa].replace(/(\s*,\s*)/g, ", ").replace(/(,\u0020)$/, ","));
                        }
                        aa = aa + 1;
                    } while (aa < leng);
                }
                if (options.compressed_css === false) {
                    build.push(" ");
                }
            },
            vertical = function beautify_style_vertical():void {
                const start:number = data.begin[a],
                    startChar:string = data.token[start],
                    endChar:string = data.token[a],
                    store:compareStore = [];
                let b:number = a,
                    c:number = 0,
                    item:[number, number],
                    longest:number = 0;
                if (start < 0 || b <= start) {
                    return;
                }
                do {
                    b = b - 1;
                    if (data.begin[b] === start) {
                        if (data.token[b] === ":") {
                            item = [b - 1, 0];
                            do {
                                b = b - 1;
                                if ((((data.token[b] === ";" && startChar === "{") || (data.token[b] === "," && startChar === "(")) && data.begin[b] === start) || (data.token[b] === endChar && data.begin[data.begin[b]] === start)) {
                                    break;
                                }
                                if (data.types[b] !== "comment" && data.types[b] !== "selector" && data.token[b] !== startChar && data.begin[b] === start) {
                                    item[1] = data.token[b].length + item[1];
                                }
                            } while (b > start + 1);
                            if (item[1] > longest) {
                                longest = item[1];
                            }
                            store.push(item);
                        }
                    } else if (data.types[b] === "end") {
                        if (b < data.begin[b]) {
                            break;
                        }
                        b = data.begin[b];
                    }
                } while (b > start);
                b = store.length;
                if (b < 2) {
                    return;
                }
                do {
                    b = b - 1;
                    if (store[b][1] < longest) {
                        c = store[b][1];
                        do {
                            data.token[store[b][0]] = data.token[store[b][0]] + " ";
                            c = c + 1;
                        } while (c < longest);
                    }
                } while (b > 0);
            };
        let output:string     = "",
            indent:number   = options.indent_level,
            mixin:boolean    = false,
            a:number        = 0;
        if (options.vertical === true && options.compressed_css === false) {
            a = len;
            do {
                a = a - 1;
                if (data.token[a] === "}" || data.token[a] === ")") {
                    vertical();
                }
            } while (a > 0);
        }

        //beautification loop
        a = options.start;
        do {
            if (data.types[a + 1] === "end" && mixin === false) {
                indent = indent - 1;
            }
            if (data.types[a] === "start") {
                if (data.types[a - 1] === "propvar" && options.compressed_css === false) {
                    build.push(" ");
                }
                if (a > 0 && data.token[a - 1].charAt(data.token[a - 1].length - 1) === "#") {
                    if (options.compressed_css === true) {
                        build.push(data.token[a].replace(/(\s*,\s*)/g, ","));
                    } else {
                        build.push(data.token[a].replace(/(\s*,\s*)/g, ", "));
                    }
                } else {
                    if (options.braces === true) {
                        if (build[build.length - 1] === " ") {
                            build.pop();
                        }
                        nl(indent);
                    } else if (data.types[a - 1] === "colon") {
                        build.push(" ");
                    }
                    if (options.compressed_css === true) {
                        build.push(data.token[a].replace(/(\s*,\s*)/g, ","));
                    } else {
                        build.push(data.token[a].replace(/(\s*,\s*)/g, ", "));
                    }
                    indent = indent + 1;
                    if ((options.compressed_css === false || (options.compressed_css === true && data.types[a + 1] === "start")) && (data.types[a + 1] !== "selector" || options.css_insert_lines === false)) {
                        nl(indent);
                    }
                }
            } else if (data.types[a] === "end") {
                if (data.types[a + 1] === "external_else") {
                    nl(indent);
                    build.push(data.token[a]);
                    build.push(" ");
                    build.push(data.token[a + 1]);
                    build.push(" ");
                    a = a + 1;
                } else if (mixin === true) {
                    mixin = false;
                    build.push(data.token[a]);
                    build.push(" ");
                } else {
                    if ((/^\s+$/).test(build[build.length - 1]) === false && (options.compressed_css === false || (options.compressed_css === true && data.types[data.begin[a] + 1] === "start")) && (data.types[data.begin[a] + 1] !== "selector" || options.css_insert_lines === false)) {
                        nl(indent);
                    }
                    build.push(data.token[a]);
                    if (options.compressed_css === true && data.types[a + 1] === "end") {
                        nl(indent - 1);
                    } else if (options.css_insert_lines === true && data.types[a + 1] === "selector" && data.lines[a] < 2 && data.token[a - 1] !== "{") {
                        build.push(lf);
                    } else if (data.types[a + 1] !== "semi") {
                        nl(indent);
                    }
                }
            } else if (data.types[a] === "semi") {
                if (data.token[a] !== "x;" && (options.compressed_css === false || (options.compressed_css === true && data.types[a + 1] !== "end"))) {
                    build.push(data.token[a]);
                }
                if (options.compressed_css === false) {
                    if (options.css_insert_lines === true && data.types[a + 1] === "selector") {
                        build.push(lf);
                    } else if (data.lines[a + 1] > 0 || (data.types[a + 1] !== undefined && data.types[a + 1].indexOf("external") < 0)) {
                        nl(indent);
                    }
                } else if (data.types[a + 1] === "comment") {
                    nl(indent);
                }
            } else if (data.types[a] === "selector") {
                if (a > 0 && 
                    (data.types[a - 1] !== "comment" ||
                        (data.types[a - 1] === "comment" && data.lines[a] < 2)
                    ) && (options.css_insert_lines === true ||
                        (options.compressed_css === true && (
                                data.types[a - 1] === "start" || data.types[a - 1] === "semi"
                            )
                        )
                    )
                ) {
                    nl(indent);
                }
                if (data.token[a].charAt(data.token[a].length - 1) === "#") {
                    build.push(data.token[a]);
                    mixin = true;
                } else if (data.token[a].indexOf(",") > -1) {
                    selector(data.token[a]);
                } else {
                    if (data.token[a].charAt(0) === ":" && data.token[a - 1] === "}" && build[build.length - 1] === " ") {
                        build.pop();
                    }
                    build.push(data.token[a]);
                    if (options.compressed_css === false) {
                        build.push(" ");
                    }
                }
            } else if (data.types[a] === "comment") {
                if (options.css_insert_lines === true && data.types[a - 1] !== "comment" && a > 0) {
                    if (data.types[a + 1] === "selector") {
                        nl(indent);
                    } else if (data.types[a + 1] === "comment") {
                        let b:number = a + 1;
                        do {
                            b = b + 1;
                        } while (b < len && data.types[b] === "comment");
                        if (data.types[b] === "selector") {
                            if ((/\n\s+$/).test(build[build.length - 1]) === true) {
                                build[build.length - 1] = lf;
                            }
                            nl(indent);
                        }
                    }
                } else if (data.lines[a] < 2) {
                    if (data.types[a + 1] === "selector" && a > 0) {
                        nl(indent);
                    } else {
                        let blen:number = build.length - 1;
                        do {
                            build.pop();
                            blen = blen - 1;
                        } while (blen > 0 && (/^\s+$/).test(build[blen]) === true);
                        if (a > 0) {
                            build.push(" ");
                        }
                    }
                } else if (a > 0 && data.lines[a] > 2 && data.token[a - 1] !== ";" && (/\n\s*$/).test(build[build.length - 1]) === false) {
                    nl(indent);
                }
                build.push(data.token[a]);
                if (data.lines[a + 1] > 1 || data.token[a].slice(0, 2) === "//") {
                    nl(indent);
                }
            } else {
                if (data.types[a - 1] !== "semi" && options.compressed_css === false && (mixin === false || data.token[a - 1] === ":") && data.token[a - 2] !== "filter" && data.token[a - 2] !== "progid") {
                    if (data.types[a] === "value" || (data.types[a].indexOf("external") > -1 && data.types[a - 1] === "colon")) {
                        build.push(" ");
                    }
                }
                if (data.types[a] === "value" || data.types[a] === "variable") {
                    if (options.compressed_css === true) {
                        data.token[a] = data.token[a].replace(/(\s*,\s*)/g, ",");
                    } else {
                        data.token[a] = data.token[a].replace(/(\s*,\s*)/g, ", ");
                    }
                }
                if (data.types[a] === "external_start") {
                    indent = indent + 1;
                } else if (data.types[a] === "external_end") {
                    indent = indent - 1;
                    if (build[build.length - 1] === tab) {
                        build.pop();
                    }
                } else if (data.types[a] === "external_else" && build[build.length - 1] === tab) {
                    build.pop();
                }
                build.push(data.token[a]);
                if (data.types[a] === "variable" && data.token[a + 1] === "{") {
                    build.push(" ");
                } else if (data.types[a].indexOf("external") > -1 && data.types[a + 1] !== "semi") {
                    if ((data.types[a + 1] !== undefined && data.types[a + 1].indexOf("external") > -1) || data.lines[a + 1] > 1) {
                        nl(indent);
                    }
                }
            }
            a = a + 1;
        } while (a < len);
        prettydiff.iterator = len - 1;
        if (options.new_line === true && a === data.token.length && build[build.length - 1].indexOf(lf) < 0) {
            build.push(lf);
        }
        output = build.join("");
        return output;
    };
    global.prettydiff.beautify.style = style;
}());
