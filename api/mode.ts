/*global prettydiff*/
function mode(diffmeta?:diffmeta):string {
    "use strict";
    const pdcomment = function mode_pdcomment():void {
            const ops:any = prettydiff.sparser.options;
            let sindex:number = options.source.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/),
                dindex:number = options.diff.search(/((\/(\*|\/))|<!--*)\s*prettydiff\.com/),
                a:number = 0,
                b:number = 0,
                keys:string[],
                def:any,
                len:number;
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
        
            if ((sindex > -1 && (sindex === 0 || "\"':".indexOf(options.source.charAt(sindex - 1)) < 0)) || (options.mode === "diff" && dindex > -1 && (dindex === 0 || "\"':".indexOf(options.diff.charAt(dindex - 1)) < 0))) {
                let pdcom:number = sindex,
                    a:number = (pdcom > -1)
                        ? pdcom
                        : dindex,
                    b:number = 0,
                    quote:string = "",
                    item:string = "",
                    lang:string = "",
                    lex:string = "",
                    valkey:string[] = [],
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
                                if (ops.length > 0 && (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=")) {
                                    b = a;
                                }
                            } else if (source.charAt(a) === "'") {
                                quote = "'";
                                if (ops.length > 0 && (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=")) {
                                    b = a;
                                }
                            } else if (source.charAt(a) === "`") {
                                quote = "`";
                                if (ops.length > 0 && (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=")) {
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
                                    } else if (ops.length > 0 && (ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === ":" || ops[ops.length - 1].charAt(ops[ops.length - 1].length - 1) === "=")) {
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
                        } else if (prettydiff.api.optionDef[ops[a]] !== undefined && prettydiff.api.optionDef[ops[a]].type === "boolean") {
                            options[ops[a]] = true;
                        }
                        if (op.length === 2 && prettydiff.api.optionDef[op[0]] !== undefined) {
                            if ((op[1].charAt(0) === "\"" || op[1].charAt(0) === "'" || op[1].charAt(0) === "`") && op[1].charAt(op[1].length - 1) === op[1].charAt(0)) {
                                op[1] = op[1].slice(1, op[1].length - 1);
                            }
                            if (prettydiff.api.optionDef[op[0]].type === "number" && isNaN(Number(op[1])) === false) {
                                options[op[0]] = Number(op[1]);
                            } else if (prettydiff.api.optionDef[op[0]].type === "boolean") {
                                if (op[1] === "true") {
                                    options[op[0]] = true;
                                } else if (op[1] === "false") {
                                    options[op[0]] = false;
                                }
                            } else {
                                if (prettydiff.api.optionDef[op[0]].values !== undefined) {
                                    valkey = Object.keys(prettydiff.api.optionDef[op[0]].values);
                                    b = valkey.length;
                                    do {
                                        b = b - 1;
                                        if (valkey[b] === op[1]) {
                                            options[op[0]] = op[1];
                                            break;
                                        }
                                    } while (b > 0);
                                } else {
                                    if (op[0] === "language") {
                                        lang = op[1];
                                    } else if (op[0] === "lexer") {
                                        lex = op[1];
                                    }
                                    options[op[0]] = op[1];
                                }
                            }
                        }
                    } while (a > 0);
                    if (lex === "" && lang !== "") {
                        lex = prettydiff.api.language.setlexer(lang);
                    }
                }
            }
            if (options.mode === "diff") {
                modeValue = "beautify";
            }
            if (options.mode === "minify" && options.minify_wrap === false) {
                options.wrap = -1;
            }
            if (options.lexer === "script") {
                let styleguide = {
                        airbnb: function mode_pdcomment_styleairbnb() {
                            options.brace_padding = true;
                            options.correct      = true;
                            options.lexerOptions.script.end_comma     = "always";
                            options.indent_char       = " ";
                            options.indent_size       = 2;
                            options.preserve     = 1;
                            options.quote_convert = "single";
                            options.variable_list      = "each";
                            options.wrap         = 80;
                        },
                        crockford: function mode_pdcomment_stylecrockford() {
                            options.brace_padding  = false;
                            options.correct       = true;
                            options.else_line      = false;
                            options.lexerOptions.script.end_comma      = "never";
                            options.indent_char        = " ";
                            options.indent_size        = 4;
                            options.no_case_indent  = true;
                            options.space         = true;
                            options.variable_list      = "each";
                            options.vertical            = false;
                        },
                        google: function mode_pdcomment_stylegoogle() {
                            options.correct      = true;
                            options.indent_char       = " ";
                            options.indent_size       = 4;
                            options.preserve     = 1;
                            options.quote_convert = "single";
                            options.vertical           = false;
                            options.wrap         = -1;
                        },
                        jquery: function mode_pdcomment_stylejquery() {
                            options.brace_padding = true;
                            options.correct      = true;
                            options.indent_char       = "\u0009";
                            options.indent_size       = 1;
                            options.quote_convert = "double";
                            options.variable_list      = "each";
                            options.wrap         = 80;
                        },
                        jslint: function mode_pdcomment_stylejslint() {
                            options.brace_padding  = false;
                            options.correct       = true;
                            options.else_line      = false;
                            options.lexerOptions.script.end_comma      = "never";
                            options.indent_char        = " ";
                            options.indent_size        = 4;
                            options.no_case_indent  = true;
                            options.space         = true;
                            options.variable_list       = "each";
                            options.vertical            = false;
                        },
                        mrdoobs: function mode_pdcomment_stylemrdoobs() {
                            options.brace_line    = true;
                            options.brace_padding = true;
                            options.correct      = true;
                            options.indent_char       = "\u0009";
                            options.indent_size       = 1;
                            options.vertical           = false;
                        },
                        mediawiki: function mode_pdcomment_stylemediawiki() {
                            options.brace_padding = true;
                            options.correct      = true;
                            options.indent_char       = "\u0009";
                            options.indent_size       = 1;
                            options.preserve     = 1;
                            options.quote_convert = "single";
                            options.space        = false;
                            options.wrap         = 80;
                        },
                        meteor: function mode_pdcomment_stylemeteor() {
                            options.correct = true;
                            options.indent_char  = " ";
                            options.indent_size  = 2;
                            options.wrap    = 80;
                        },
                        semistandard: function mode_pdcomment_stylessemistandard() {
                            options.brace_line = false;
                            options.brace_padding = false;
                            options.braces = false;
                            options.correct = true;
                            options.end_comma = "never";
                            options.indent_char = " ";
                            options.indent_size = 2;
                            options.new_line = false;
                            options.no_semicolon = false;
                            options.preserve = 1;
                            options.quote_convert = "single";
                            options.space = true;
                            options.ternary_line = false;
                            options.variable_list = "each";
                            options.vertical = false;
                            options.wrap = 0;
                        },
                        standard: function mode_pdcomment_stylestandard() {
                            options.brace_line = false;
                            options.brace_padding = false;
                            options.braces = false;
                            options.correct = true;
                            options.end_comma = "never";
                            options.indent_char = " ";
                            options.indent_size = 2;
                            options.new_line = false;
                            options.no_semicolon = true;
                            options.preserve = 1;
                            options.quote_convert = "single";
                            options.space = true;
                            options.ternary_line = false;
                            options.variable_list = "each";
                            options.vertical = false;
                            options.wrap = 0;
                        },
                        yandex: function mode_pdcomment_styleyandex() {
                            options.brace_padding = false;
                            options.correct      = true;
                            options.quote_convert = "single";
                            options.variable_list      = "each";
                            options.vertical           = false;
                        }
                    },
                    brace_style = {
                        collapse: function mode_pdcomment_collapse() {
                            options.brace_line    = false;
                            options.brace_padding = false;
                            options.braces       = false;
                            options.format_object = "indent";
                            options.never_flatten = true;
                        },
                        "collapse-preserve-inline": function mode_pdcomment_collapseInline() {
                            options.brace_line    = false;
                            options.brace_padding = true;
                            options.braces       = false;
                            options.format_object = "inline";
                            options.never_flatten = false;
                        },
                        expand: function mode_pdcomment_expand() {
                            options.brace_line    = false;
                            options.brace_padding = false;
                            options.braces       = true;
                            options.format_object = "indent";
                            options.never_flatten = true;
                        }
                    };
                if (styleguide[options.styleguide] !== undefined) {
                    styleguide[options.styleguide]();
                }
                if (brace_style[options.brace_style] !== undefined) {
                    brace_style[options.brace_style]();
                }
                if (options.language === "json") {
                    options.wrap = 0;
                } else if (options.language === "titanium") {
                    options.correct = false;
                }
                if (options.language !== "javascript" && options.language !== "typescript" && options.language !== "jsx") {
                    options.jsscope = "none";
                }
            }
            if (options.lexer !== "markup" || options.language === "text") {
                options.diff_rendered_html = false;
            } else if (options.api === "node" && options.read_method !== "file") {
                options.diff_rendered_html = false;
            }
            def = prettydiff.sparser.libs.optionDef;
            keys = Object.keys(def);
            len = keys.length;
            do {
                if (options[keys[a]] !== undefined) {
                    if (def[keys[a]].lexer[0] === "all") {
                        ops[keys[a]] = options[keys[a]];
                    } else {
                        b = def[keys[a]].lexer.length;
                        do {
                            b = b - 1;
                            if (keys[a] !== "parse_space" || (options.mode === "parse" && keys[a] === "parse_space" && options[keys[a]] === true)) {
                                ops.lexer_options[def[keys[a]].lexer[b]][keys[a]] = options[keys[a]];
                            }
                        } while (b > 0);
                    }
                }
                a = a + 1;
            } while (a < len);
        },
        options:any = prettydiff.options,
        lf:string = (options.crlf === true)
            ? "\r\n"
            : "\n";
    let modeValue:"beautify"|"minify" = options.mode,
        result:string = "";
    if (options.api === "node" && (options.read_method === "directory" || options.read_method === "subdirectory")) {
        if (options.mode === "parse" && options.parse_format === "table") {
            return "Error: option parse_format with value 'table' is not available with read_method directory or subdirectory.";
        }
    }
    if (options.language === "text" && options.mode !== "diff") {
        options.language = "auto";
    }
    if (options.lexer === "text" && options.mode !== "diff") {
        options.lexer = "auto";
    }
    if (options.language === "text" || options.lexer === "text") {
        options.language = "text";
        options.language_name = "Plain Text";
        options.lexer = "text";
    } else if (options.language === "auto" || options.lexer === "auto") {
        const def:string = (options.language_default === "" || options.language_default === null || options.language_default === undefined)
                ? "javascript"
                : options.language_default;
        let lang:[string, string, string] = prettydiff.api.language.auto(options.source, def);
        if (lang[0] === "text") {
            if (options.mode === "diff") {
                lang[2] = "Plain Text";
            } else {
                lang = ["javascript", "script", "JavaScript"];
            }
        } else if (lang[0] === "csv") {
            lang[2] = "CSV";
        }
        if (options.language === "auto") {
            options.language = lang[0];
            options.language_name = lang[2];
        }
        if (options.lexer === "auto") {
            options.lexer = lang[1];
        }
    }

    pdcomment();
    if (options.mode === "parse") {
        const parse_format = (options.parse_format === "htmltable")
                ? "table"
                : options.parse_format,
            api = (options.parse_format === "htmltable")
                ? "dom"
                : options.api;

        options.parsed = prettydiff.sparser.parser();
        if (parse_format === "table") {
            if (api === "dom") {
                const parsLen:number = options.parsed.token.length,
                    keys = Object.keys(options.parsed),
                    keylen:number = keys.length,
                    headingString:string = (function mode_parseHeading():string {
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
                    row = function mode_parseRow():string {
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
                const outputArrays:data = options.parsed,
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
                    heading:string = "index | begin | ender | lexer  | lines | stack       | types       | token",
                    bar:string     = "------|-------|-------|--------|-------|-------------|-------------|------";
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
                    pad(outputArrays.ender[a].toString(), 5);
                    pad(outputArrays.lexer[a].toString(), 5);
                    pad(outputArrays.lines[a].toString(), 5);
                    pad(outputArrays.stack[a].toString(), 11);
                    pad(outputArrays.types[a].toString(), 11);
                    str.push(outputArrays.token[a].replace(/\s/g, " "));
                    str.push(nodeText.none);
                    output.push(str.join(""));
                    a = a + 1;
                } while (a < b);
                result = output.join(lf);
            }
        } else {
            result = JSON.stringify(options.parsed);
        }
    } else {
        if (prettydiff[modeValue][options.lexer] === undefined && ((options.mode !== "diff" && options.language === "text") || options.language !== "text")) {
            result = `Error: Library prettydiff.${modeValue}.${options.lexer} does not exist.`;
        } else if (options.mode === "diff") {
            let diffoutput:[string, number, number];

            if (options.diff_format === "json") {
                options.complete_document = false;
            }
            if (options.language === "text") {
                diffoutput = prettydiff.api.diffview(options);
                result = diffoutput[0];
            } else {
                const ind:number = options.indent;
                if (options.diff_rendered_html === true) {
                    const lexers:any = {
                            del: 0,
                            insert: 0,
                            replace: 0
                        },
                        typeIgnore:string[] = [
                            "attribute",
                            "cdata",
                            "comment",
                            "conditional",
                            "ignore",
                            "jsx_attribute_end",
                            "jsx_attribute_start",
                            "script",
                            "sgml",
                            "style",
                            "xml"
                        ],
                        tab = function mode_diffhtmlTab(indentation:number):string {
                            const tabout:string[] = (options.crlf === true)
                                ? ["\r\n"]
                                : ["\n"];
                            let a:number = 0,
                                b:number = options.indent_size * indentation;
                            if (b > 1) {
                                do {
                                    tabout.push(options.indent_char);
                                    a = a + 1;
                                } while (a < b);
                            } else {
                                tabout.push(options.indent_char);
                                tabout.push(options.indent_char);
                            }
                            return tabout.join("");
                        },
                        css:string[] = [
                            `${tab(2)}<style type="text/css">`,
                            "#prettydiff_summary{background:#eef8ff;border:2px solid #069}",
                            ".prettydiff_rendered{border-style:solid;border-width:2px;display:inline-block}",
                            ".prettydiff_delete{background:#ffd8d8;border-color:#c44}",
                            ".prettydiff_insert{background:#d8ffd8;border-color:#090}",
                            ".prettydiff_replace{background:#fec;border-color:#a86}"
                        ],
                        insert = function mode_insert():void {
                            const inject:string[] = [`<span class="prettydiff_rendered prettydiff_insert">`];
                            if (json[a + 1][0] === "+") {
                                do {
                                    inject.push(json[a][1]);
                                    count[1] = count[1] + 1;
                                    a = a + 1;
                                } while (json[a + 1][0] === "+");
                            }
                            inject.push(json[a][1]);
                            inject.push("</span>");
                            options.parsed.token[count[0]] = `${inject.join("")} ${options.parsed.token[count[0]]}`;
                            lexers.insert = lexers.insert + 1;
                        },
                        del = function mode_del():void {
                            const symb:string = json[a][0],
                                change:string = (symb === "-")
                                    ? "delete"
                                    : "replace";
                            options.parsed.token[count[0]] = `<span class="prettydiff_rendered prettydiff_${change}">${options.parsed.token[count[0]]}`;
                            if (json[a + 1][0] === symb) {
                                do {
                                    count[0] = count[0] + 1;
                                    if (change === "replace") {
                                        count[1] = count[1] + 1;
                                    }
                                    a = a + 1;
                                } while (json[a + 1][0] === symb);
                            }
                            options.parsed.token[count[0]] = `${options.parsed.token[count[0]]}</span>`;
                            if (change === "delete") {
                                lexers.del = lexers.del + 1;
                            } else {
                                lexers.replace = lexers.replace + 1;
                            }
                        },
                        summary = function mode_summary():void {
                            const keys:string[] = Object.keys(lexers),
                                len:number = keys.length,
                                output:string[] = [],
                                lex:string[] = [];
                            let a:number = 0,
                                lextest:boolean = false;
                            output.push(`<div id="prettydiff_summary"><h1>Pretty Diff - Summary</h1>`);
                            output.push("<p>This is the count of identified differences starting with visual differences colored in the document first.</p><ul>");
                            output.push(`<li>Deletions - <strong>${lexers.del}</strong></li>`);
                            output.push(`<li>Insertions - <strong>${lexers.insert}</strong></li>`);
                            output.push(`<li>Replacements - <strong>${lexers.replace}</strong></li>`);
                            output.push("</ul>");
                            if (len > 3) {
                                lexers.del = 0;
                                lexers.insert = 0;
                                lexers.replace = 0;
                                lex.push("<hr/><p>This list of differences is not visible in the rendered HTML.</p><ul>");
                                do {
                                    if (lexers[keys[a]] > 0) {
                                        lextest = true;
                                        lex.push(`<li>${keys[a]} - ${lexers[keys[a]]}</li>`);
                                    }
                                    a = a + 1;
                                } while (a < len);
                                lex.push("</ul>");
                            }
                            if (lextest === true) {
                                output.push(lex.join(""));
                            }
                            output.push("</div>");
                            options.parsed.token[body] = `${options.parsed.token[body]} ${output.join("")}`;
                        };
                    let diff_parsed:data,
                        json:any,
                        a:number = 0,
                        count:[number, number] = [0, 0],
                        len:number = 0,
                        body:number = 0,
                        head:boolean = false;
                    options.diff_format = "json";
                    options.parsed = prettydiff.sparser.parser();
                    options.source = options.parsed.token;
                    prettydiff.start = 0;
                    prettydiff.end = 0;
                    options.indent_level = ind;
                    prettydiff.sparser.options.source = options.diff;
                    diff_parsed = prettydiff.sparser.parser();
                    options.diff = diff_parsed.token;
                    diffoutput = prettydiff.api.diffview(options);
                    json = JSON.parse(diffoutput[0]).diff;
                    len = json.length;
                    do {
                        if (head === false && options.parsed.types[count[0]] === "start" && options.parsed.lexer[count[0]] === "markup" && json[a][1].toLowerCase().indexOf("<head") === 0) {
                            options.parsed.token[count[0]] = `${options.parsed.token[count[0]] + css.join(tab(3)) + tab(2)}</style>${tab(0)}`;
                            head = true;
                        } else if (body < 1 && options.parsed.types[count[0]] === "start" && options.parsed.lexer[count[0]] === "markup" && options.parsed.token[count[0]].toLowerCase().indexOf("<body") === 0) {
                            body = count[0];
                        }
                        if (json[a][0] === "=") {
                            count[0] = count[0] + 1;
                            count[1] = count[1] + 1;
                        } else if (
                            body > 1 &&
                            options.parsed.lexer[count[0]] === "markup" &&
                            options.parsed.token[count[0]].indexOf(`<span class="prettydiff_`) !== 0 &&
                            ((json[a][0] === "+" && typeIgnore.indexOf(diff_parsed.types[count[1]]) < 0) || (json[a][0] !== "+" && typeIgnore.indexOf(options.parsed.types[count[0]]) < 0))
                        ) {
                            if (json[a][0] === "+") {
                                insert();
                            } else {
                                del();
                            }
                        } else {
                            if (json[a][0] === "-") {
                                count[0] = count[0] + 1;
                            } else if (json[a][0] === "+") {
                                count[1] = count[1] + 1;
                            } else {
                                count[0] = count[0] + 1;
                                count[1] = count[1] + 1;
                            }
                            if (lexers[options.parsed.lexer[count[0]]] === undefined) {
                                lexers[options.parsed.lexer[count[0]]] = 1;
                            } else {
                                lexers[options.parsed.lexer[count[0]]] = lexers[options.parsed.lexer[count[0]]] + 1;
                            }
                        }
                        a = a + 1;
                    } while (a < len);
                    summary();
                    result = prettydiff.beautify.markup(options);
                } else {
                    options.parsed = prettydiff.sparser.parser();
                    options.source = prettydiff.beautify[options.lexer](options);
                    prettydiff.start = 0;
                    prettydiff.end = 0;
                    options.indent_level = ind;
                    // diff text formatting
                    prettydiff.sparser.options.source = options.diff;
                    options.parsed = prettydiff.sparser.parser();
                    options.diff = prettydiff.beautify[options.lexer](options);
                    // comparison
                    diffoutput = prettydiff.api.diffview(options);
                    result = diffoutput[0];
                }
            }
            if (diffmeta !== undefined) {
                diffmeta.differences = diffoutput[1];
                diffmeta.lines = diffoutput[2];
            }
        } else {
            options.parsed = prettydiff.sparser.parser();
            result = prettydiff[modeValue][options.lexer](options);
        }
    }
    if (options.new_line === true) {
        result = result.replace(/\s*$/, lf);
    } else {
        result = result.replace(/\s+$/, "");
    }
    if (options.complete_document === true && options.jsscope !== "report") {
        let finalFile:finalFile = prettydiff.api.finalFile;
        finalFile.order[7] = options.color;
        finalFile.order[10] = result;
        if (options.crlf === true) {
            finalFile.order[12] = "\r\n";
            finalFile.order[15] = "\r\n";
        }
        if (options.mode === "diff") {
            finalFile.order[13] = finalFile.script.diff;
        } else if (options.mode === "beautify" && options.language === "javascript" && options.jsscope !== "none") {
            finalFile.order[13] = finalFile.script.beautify;
        } else {
            finalFile.order[13] = finalFile.script.minimal;
        }
        // escape changes characters that result in xml wellformedness errors
        prettydiff.end = 0;
        prettydiff.start = 0;
        return finalFile.order.join("");
    }
    prettydiff.end = 0;
    prettydiff.start = 0;
    return result;
}
mode();