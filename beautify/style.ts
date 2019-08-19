/*global prettydiff*/
(function beautify_style_init():void {
    "use strict";
    const style = function beautify_style(options:any):string {
        const data:data = options.parsed,
            lf:"\r\n"|"\n"         = (options.crlf === true)
                ? "\r\n"
                : "\n",
            len:number      = (prettydiff.end > 0)
                ? prettydiff.end + 1
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
        let indent:number   = options.indent_level,
            a:number        = prettydiff.start,
            when:string[] = ["", ""];
        if (options.vertical === true && options.compressed_css === false) {
            a = len;
            do {
                a = a - 1;
                if (data.token[a] === "}" || data.token[a] === ")") {
                    vertical();
                }
            } while (a > 0);
            a = prettydiff.start;
        }

        //beautification loop
        do {
            if (data.types[a + 1] === "end" || data.types[a + 1] === "template_end" || data.types[a + 1] === "template_else") {
                indent = indent - 1;
            }
            if (data.types[a] === "template" && data.lines[a] > 0) {
                build.push(data.token[a]);
                nl(indent);
            } else if (data.types[a] === "template_else") {
                build.push(data.token[a]);
                indent = indent + 1;
                nl(indent);
            } else if (data.types[a] === "start" || data.types[a] === "template_start") {
                indent = indent + 1;
                build.push(data.token[a]);
                if (data.types[a + 1] !== "end" && data.types[a + 1] !== "template_end" && (options.compressed_css === false || (options.compressed_css === true && data.types[a + 1] === "selector"))) {
                    nl(indent);
                }
            } else if ((data.token[a] === ";" && (options.compressed_css === false || (options.compressed_css === true && data.types[a + 1] === "selector"))) || data.types[a] === "end" || data.types[a] === "template_end" || data.types[a] === "comment") {
                build.push(data.token[a]);
                if (data.types[a + 1] === "value") {
                    if (data.lines[a + 1] === 1) {
                        build.push(" ");
                    } else if (data.lines[a + 1] > 1) {
                        nl(indent);
                    }
                } else if (data.types[a + 1] !== "separator") {
                    if (data.types[a + 1] !== "comment" || (data.types[a + 1] === "comment" && data.lines[a + 1] > 1)) {
                        nl(indent);
                    } else {
                        build.push(" ");
                    }
                }
            } else if (data.token[a] === ":") {
                build.push(data.token[a]);
                if (options.compressed_css === false) {
                    build.push(" ");
                }
            } else if (data.types[a] === "selector") {
                if (options.css_insert_lines === true && data.types[a - 1] === "end" && data.lines[a] < 3) {
                    build.push(lf);
                }
                if (data.token[a].indexOf("when(") > 0) {
                    when = data.token[a].split("when(");
                    build.push(when[0].replace(/\s+$/, ""));
                    nl(indent + 1);
                    build.push(`when (${when[1]}`);
                } else {
                    build.push(data.token[a]);
                }
                if (data.types[a + 1] === "start") {
                    if (options.braces === true) {
                        nl(indent);
                    } else if (options.compressed_css === false) {
                        build.push(" ");
                    }
                }
            } else if (data.token[a] === ",") {
                build.push(data.token[a]);
                if (data.types[a + 1] === "selector" || data.types[a + 1] === "property") {
                    nl(indent);
                } else if (options.compressed_css === false) {
                    build.push(" ");
                }
            } else if (data.stack[a] === "map" && data.token[a + 1] === ")" && a - data.begin[a] > 5) {
                build.push(data.token[a]);
                nl(indent);
            } else if (data.token[a] === "x;") {
                nl(indent);
            } else if ((data.types[a] === "variable" || data.types[a] === "function") && options.css_insert_lines === true && data.types[a - 1] === "end" && data.lines[a] < 3) {
                build.push(lf);
                build.push(data.token[a]);
            } else if (data.token[a] !== ";" || (data.token[a] === ";" && (options.compressed_css === false || (options.compressed_css === true && data.token[a + 1] !== "}")))) {
                build.push(data.token[a]);
            }
            a = a + 1;
        } while (a < len);
        prettydiff.iterator = len - 1;
        return build.join("");
    };
    global.prettydiff.beautify.style = style;
}());
