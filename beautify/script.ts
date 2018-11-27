/*global global, prettydiff*/
(function beautify_script_init():void {
    "use strict";
    const script = function beautify_script(options:any):string {
        (function beautify_script_options() {
            let styleguide = {
                    airbnb: function beautify_script_options_styleairbnb() {
                        options.brace_padding = true;
                        options.correct      = true;
                        options.end_comma     = "always";
                        options.indent_char       = " ";
                        options.indent_size       = 2;
                        options.preserve     = 1;
                        options.quote_convert = "single";
                        options.variable_list      = "each";
                        options.wrap         = 80;
                    },
                    crockford: function beautify_script_options_stylecrockford() {
                        options.brace_padding  = false;
                        options.correct       = true;
                        options.else_line      = false;
                        options.end_comma      = "never";
                        options.indent_char        = " ";
                        options.indent_size        = 4;
                        options.no_case_indent  = true;
                        options.space         = true;
                        options.variable_list      = "each";
                        options.vertical            = false;
                    },
                    google: function beautify_script_options_stylegoogle() {
                        options.correct      = true;
                        options.indent_char       = " ";
                        options.indent_size       = 4;
                        options.preserve     = 1;
                        options.quote_convert = "single";
                        options.vertical           = false;
                        options.wrap         = -1;
                    },
                    jquery: function beautify_script_options_stylejquery() {
                        options.brace_padding = true;
                        options.correct      = true;
                        options.indent_char       = "\u0009";
                        options.indent_size       = 1;
                        options.quote_convert = "double";
                        options.variable_list      = "each";
                        options.wrap         = 80;
                    },
                    jslint: function beautify_script_options_stylejslint() {
                        options.brace_padding  = false;
                        options.correct       = true;
                        options.else_line      = false;
                        options.end_comma      = "never";
                        options.indent_char        = " ";
                        options.indent_size        = 4;
                        options.no_case_indent  = true;
                        options.space         = true;
                        options.variable_list       = "each";
                        options.vertical            = false;
                    },
                    mrdoobs: function beautify_script_options_stylemrdoobs() {
                        options.brace_line    = true;
                        options.brace_padding = true;
                        options.correct      = true;
                        options.indent_char       = "\u0009";
                        options.indent_size       = 1;
                        options.vertical           = false;
                    },
                    mediawiki: function beautify_script_options_stylemediawiki() {
                        options.brace_padding = true;
                        options.correct      = true;
                        options.indent_char       = "\u0009";
                        options.indent_size       = 1;
                        options.preserve     = 1;
                        options.quote_convert = "single";
                        options.space        = false;
                        options.wrap         = 80;
                    },
                    meteor: function beautify_script_options_stylemeteor() {
                        options.correct = true;
                        options.indent_char  = " ";
                        options.indent_size  = 2;
                        options.wrap    = 80;
                    },
                    yandex: function beautify_script_options_styleyandex() {
                        options.brace_padding = false;
                        options.correct      = true;
                        options.quote_convert = "single";
                        options.variable_list      = "each";
                        options.vertical           = false;
                    }
                },
                brace_style = {
                    collapse: function beautify_brace_options_collapse() {
                        options.brace_line    = false;
                        options.brace_padding = false;
                        options.braces       = false;
                        options.format_object = "indent";
                        options.never_flatten = true;
                    },
                    "collapse-preserve-inline": function beautify_brace_options_collapseInline() {
                        options.brace_line    = false;
                        options.brace_padding = true;
                        options.braces       = false;
                        options.format_object = "inline";
                        options.never_flatten = false;
                    },
                    expand: function beautify_brace_options_expand() {
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
        }());
        let scolon:number = 0,
            news:number = 0;
        const data:parsedArray = options.parsed,
            lexer:string = "script",
            scopes:scriptScopes = [],
            b:number = (options.end < 1 || options.end > data.token.length)
                ? data.token.length
                : options.end,
            // levels sets the white space value between the current token and the next token
            // * -20 value means no white space
            // * -10 means to separate with a space
            // * 0 and above is the number of indentation to insert
            levels:number[] = (function beautify_script_level():number[] {
                let a             = options.start, //will store the current level of indentation
                    indent:number        = (isNaN(options.indent_level) === true)
                        ? 0
                        : Number(options.indent_level),
                    notcomment:boolean = false, // if in comments before any code
                    lastlist:boolean      = false, //remembers the list status of the most recently closed block
                    ctype:string         = "", //ctype stands for "current type"
                    ctoke:string         = "", //ctoke standa for "current token"
                    ltype:string         = data.types[0], //ltype stands for "last type"
                    ltoke:string         = data.token[0]; //ltype stands for "last token"
                const varindex:number[] = [-1], //index in current scope of last var, let, or const keyword
                    list:boolean[]          = [], //stores comma status of current block
                    level:number[] = (options.start > 0)
                        ? Array(options.start).fill(0, 0, options.start)
                        : [],
                    ternary:number[]       = [], //used to identify ternary statments
                    extraindent   = [
                        []
                    ], //stores token indexes where extra indentation occurs from ternaries and broken method chains
                    arrbreak:boolean[]      = [], //array where a method break has occurred
                    destruct:boolean[]      = [], //attempt to identify object destructuring
                    itemcount:number[]      = [], //counts items in destructured lists
                    assignlist:boolean[]    = [false], //are you in a list right now?
                    wordlist:boolean[]      = [],
                    comment       = function beautify_script_comment():void {
                        destructfix(false, false);
                        let ind:number = (options.comments === true)
                            ? 0
                            : indent;
                        if (notcomment === false && (/\/\u002a\s*global\s/).test(data.token[a]) === true) {
                            let globallist:string[] = data.token[a].replace(/\/\u002a\s*global\s+/, "").replace(/\s*\u002a\/$/, "").split(","),
                                aa:number = globallist.length;
                            do {
                                aa = aa - 1;
                                globallist[aa] = globallist[aa].replace(/\s+/g, "");
                                if (globallist[aa] !== "") {
                                    scopes.push([globallist[aa], -1, -10]);
                                }
                            } while (aa > 0);
                        }
                        if (data.types[a - 1] === "comment" || data.types[a + 1] === "comment") {
                            level[a - 1] = ind;
                        } else if (data.lines[a] < 2) {
                            let aa:number = a + 1;
                            if (data.types[aa] === "comment") {
                                do {
                                    aa = aa + 1;
                                } while (aa < b && data.types[aa] === "comment");
                            }
                            if (a < b - 1 && data.stack[aa] !== "block" && (data.token[aa] === "{" || data.token[aa] === "x{")) {
                                let bb:number = scopes.length;
                                data.begin.splice(a, 0, data.begin[aa]);
                                data.lexer.splice(a, 0, data.lexer[aa]);
                                data.lines.splice(a, 0, data.lines[aa]);
                                data.presv.splice(a, 0, data.presv[aa]);
                                data.stack.splice(a, 0, data.stack[aa]);
                                data.token.splice(a, 0, data.token[aa]);
                                data.types.splice(a, 0, data.types[aa]);
                                if (bb > 0) {
                                    do {
                                        bb = bb - 1;
                                        if (scopes[bb][1] === aa) {
                                            scopes[bb][1] = a;
                                        } else if (scopes[bb][1] < a) {
                                            break;
                                        }
                                    } while (bb > 0);
                                }
                                aa = aa + 1;
                                data.begin.splice(aa, 1);
                                data.lexer.splice(aa, 1);
                                data.lines.splice(aa, 1);
                                data.presv.splice(aa, 1);
                                data.stack.splice(aa, 1);
                                data.token.splice(aa, 1);
                                data.types.splice(aa, 1);
                                bb = a + 1;
                                do {
                                    data.begin[bb] = a;
                                    data.stack[bb] = data.stack[aa];
                                    bb = bb + 1;
                                } while (bb < aa);
                                bb = bb + 1;
                                do {
                                    if (data.begin[bb] === data.begin[aa]) {
                                        data.begin[bb] = a;
                                        if (data.types[bb] === "end") {
                                            break;
                                        }
                                    }
                                    bb = bb + 1;
                                } while (bb < b - 1);
                                data.begin[aa] = a;
                                a = a - 1;
                            } else {
                                level[a - 1] = -10;
                                if (data.stack[a] === "paren" || data.stack[a] === "method") {
                                    level.push(indent + 2);
                                } else {
                                    level.push(indent);
                                }
                            }
                            if (data.types[a + 1] !== "comment") {
                                notcomment = true;
                            }
                            return;
                        } else if (data.token[a - 1] === ",") {
                            level[a - 1] = ind;
                        } else if (ltoke === "=" && data.types[a - 1] !== "comment" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                            level[a - 1] = -10;
                        } else if (ltoke === "{" && data.types[a - 1] !== "comment" && data.lines[0] < 2) {
                            level[a - 1] = -10;
                        } else {
                            level[a - 1] = ind;
                        }
                        if (data.types[a + 1] !== "comment") {
                            notcomment = true;
                        }
                        if (data.token[data.begin[a]] === "(") {
                            level.push(indent + 1);
                        } else {
                            level.push(indent);
                        }
                    },
                    destructfix   = function beautify_script_destructFix(listFix:boolean, override:boolean):void {
                        // listfix  - at the end of a list correct the containing list override - to
                        // break arrays with more than 4 items into a vertical list
                        let c:number          = a - 1,
                            d:number          = (listFix === true)
                                ? 0
                                : 1;
                        const ei:number[]         = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            arrayCheck:boolean = (
                                override === false && data.stack[a] === "array" && listFix === true && ctoke !== "["
                            );
                        if (destruct[destruct.length - 1] === false || (data.stack[a] === "array" && options.formatArray === "inline") || (data.stack[a] === "object" && options.format_object === "inline")) {
                            return;
                        }
                        destruct[destruct.length - 1] = false;
                        do {
                            if (data.types[c] === "end") {
                                d = d + 1;
                            } else if (data.types[c] === "start") {
                                d = d - 1;
                            }
                            if (data.stack[c] === "global") {
                                break;
                            }
                            if (d === 0) {
                                if (data.stack[a] === "class" || data.stack[a] === "map" || (arrayCheck === false && ((listFix === false && data.token[c] !== "(" && data.token[c] !== "x(") || (listFix === true && data.token[c] === ",")))) {
                                    if (data.types[c + 1] === "template_start") {
                                        if (data.lines[c] < 1) {
                                            level[c] = -20;
                                        } else {
                                            level[c] = indent - 1;
                                        }
                                    } else if (ei.length > 0 && ei[ei.length - 1] > -1) {
                                        level[c] = indent - 1;
                                    } else {
                                        level[c] = indent;
                                    }
                                }
                                if (listFix === false) {
                                    break;
                                }
                            }
                            if (d < 0) {
                                if (data.types[c + 1] === "template_start") {
                                    if (data.lines[c] < 1) {
                                        level[c] = -20;
                                    } else {
                                        level[c] = indent - 1;
                                    }
                                } else if (ei.length > 0 && ei[ei.length - 1] > -1) {
                                    level[c] = indent - 1;
                                } else {
                                    level[c] = indent;
                                }
                                break;
                            }
                            c = c - 1;
                        } while (c > -1);
                    },
                    end           = function beautify_script_end():void {
                        const ei:number[] = (extraindent[extraindent.length - 1] === undefined)
                            ? []
                            : extraindent[extraindent.length - 1];
                        if (ctoke === ")" && data.token[a + 1] === "." && ei[ei.length - 1] > -1 && data.token[ei[0]] !== ":") {
                            let c:number = data.begin[a],
                                d:boolean = false,
                                e:boolean = false;
                            do {
                                c = c - 1;
                            } while (c > 0 && level[c] < -9);
                            d = (level[c] === indent);
                            c = a + 1;
                            do {
                                c = c + 1;
                                if (data.token[c] === "{") {
                                    e = true;
                                    break;
                                }
                                if (data.begin[c] === data.begin[a + 1] && (data.types[c] === "separator" || data.types[c] === "end")) {
                                    break;
                                }
                            } while (c < b);
                            if (d === false && e === true && extraindent.length > 1) {
                                extraindent[extraindent.length - 2].push(data.begin[a]);
                                indent = indent + 1;
                            }
                        }
                        if (data.token[a + 1] === "," && (data.stack[a] === "object" || data.stack[a] === "array")) {
                            destructfix(true, false);
                        }
                        if ((data.token[a + 1] === "}" || data.token[a + 1] === "]") && (data.stack[a] === "object" || data.stack[a] === "array") && data.token[data.begin[a] - 1] === ",") {
                            destructfix(true, false);
                        }
                        if (data.stack[a] !== "attribute") {
                            if (ctoke !== ")" && ctoke !== "x)" && (ltype !== "markup" || (ltype === "markup" && data.token[a - 2] !== "return"))) {
                                indent = indent - 1;
                            }
                            if (ctoke === "}" && data.stack[a] === "switch" && options.no_case_indent === false) {
                                indent = indent - 1;
                            }
                        }
                        if (ctoke === "}" || ctoke === "x}") {
                            if (
                                data.types[a - 1] !== "comment" &&
                                ltoke !== "{" &&
                                ltoke !== "x{" &&
                                ltype !== "end" &&
                                ltype !== "string" &&
                                ltype !== "number" &&
                                ltype !== "separator" &&
                                ltoke !== "++" &&
                                ltoke !== "--" &&
                                (a < 2 || data.token[a - 2] !== ";" || data.token[a - 2] !== "x;" || ltoke === "break" || ltoke === "return")
                            ) {
                                let c:number       = a - 1,
                                    d:number       = 1,
                                    assign:boolean  = false,
                                    listlen:number = list.length;
                                do {
                                    if (data.types[c] === "end") {
                                        d = d + 1;
                                    }
                                    if (data.types[c] === "start") {
                                        d = d - 1;
                                    }
                                    if (d === 1) {
                                        if (data.token[c] === "=" || data.token[c] === ";" || data.token[c] === "x;") {
                                            assign = true;
                                        }
                                        if (c > 0 && data.token[c] === "return" && (data.token[c - 1] === ")" || data.token[c - 1] === "x)" || data.token[c - 1] === "{" || data.token[c - 1] === "x{" || data.token[c - 1] === "}" || data.token[c - 1] === "x}" || data.token[c - 1] === ";" || data.token[c - 1] === "x;")) {
                                            indent       = indent - 1;
                                            level[a - 1] = indent;
                                            break;
                                        }
                                        if (
                                            (data.token[c] === ":" && ternary.length === 0) ||
                                            (data.token[c] === "," && assign === false)
                                        ) {
                                            break;
                                        }
                                        if ((c === 0 || data.token[c - 1] === "{" || data.token[c - 1] === "x{") || data.token[c] === "for" || data.token[c] === "if" || data.token[c] === "do" || data.token[c] === "function" || data.token[c] === "while" || data.token[c] === "var" || data.token[c] === "let" || data.token[c] === "const" || data.token[c] === "with") {
                                            if (list[listlen - 1] === false && listlen > 1 && (a === b - 1 || (data.token[a + 1] !== ")" && data.token[a + 1] !== "x)")) && data.stack[a] !== "object") {
                                                indent = indent - 1;
                                            }
                                            break;
                                        }
                                    }
                                    c = c - 1;
                                } while (c > -1);
                            }
                            varindex.pop();
                        }
                        if (options.brace_padding === false && ctoke !== "}" && ltype !== "markup") {
                            level[a - 1] = -20;
                        }
                        if (options.brace_padding === true && ltype !== "start" && ltoke !== ";" && (level[data.begin[a]] < -9 || destruct[destruct.length - 1] === true)) {
                            level[data.begin[a]] = -10;
                            level[a - 1]    = -10;
                            level.push(-20);
                        } else if (options.language === "qml") {
                            if (ltype === "start" || ctoke === ")" || ctoke === "x)") {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = indent;
                            }
                            level.push(indent);
                        } else if (data.stack[a] === "attribute") {
                            level[a - 1] = -20;
                            level.push(indent);
                        } else if (data.stack[a] === "array" && (ei.length > 0 || arrbreak[arrbreak.length - 1] === true)) {
                            endExtraInd();
                            destruct[destruct.length - 1] = false;
                            level[data.begin[a]]               = indent + 1;
                            level[a - 1]                  = indent;
                            level.push(-20);
                        } else if ((data.stack[a] === "object" || (data.begin[a] === 0 && ctoke === "}")) && ei.length > 0) {
                            endExtraInd();
                            destruct[destruct.length - 1] = false;
                            level[data.begin[a]]               = indent + 1;
                            level[a - 1]                  = indent;
                            level.push(-20);
                        } else if (ctoke === ")" || ctoke === "x)") {
                            if (options.wrap > 0 && ctoke === ")" && a > data.begin[a] - 2) {
                                let len   = 0,
                                    aa    = 0,
                                    short = 0,
                                    first = 0,
                                    inc   = 0,
                                    comma = false,
                                    array = false,
                                    wrap  = options.wrap,
                                    open  = data.begin[a],
                                    ind   = (indent + 1),
                                    exl   = ei.length,
                                    ready = false,
                                    mark  = false,
                                    tern  = false;
                                if (level[open] < -9) {
                                    aa = open;
                                    do {
                                        aa = aa + 1;
                                    } while (aa < a && level[aa] < -9);
                                    first = aa;
                                    do {
                                        len = len + data.token[aa].length;
                                        if (level[aa] === -10) {
                                            len = len + 1;
                                        }
                                        if (data.token[aa] === "(" && short > 0 && short < wrap - 1 && first === a) {
                                            short = -1;
                                        }
                                        if (data.token[aa] === ")") {
                                            inc = inc - 1;
                                        } else if (data.token[aa] === "(") {
                                            inc = inc + 1;
                                        }
                                        if (aa === open && inc > 0) {
                                            short = len;
                                        }
                                        aa = aa - 1;
                                    } while (aa > 0 && level[aa] < -9);
                                    if (data.token[aa + 1] === ".") {
                                        ind = level[aa] + 1;
                                    }
                                    if (len > wrap - 1 && ltoke !== "(" && short !== -1 && destruct[destruct.length - 2] === false) {
                                        if ((data.token[open - 1] === "if" && list[list.length - 1] === true) || data.token[open - 1] !== "if") {
                                            level[open] = ind;
                                            if (data.token[open - 1] === "for") {
                                                aa = open;
                                                do {
                                                    aa = aa + 1;
                                                    if (data.token[aa] === ";" && data.begin[aa] === open) {
                                                        level[aa] = ind;
                                                    }
                                                } while (aa < a);
                                            }
                                        }
                                    }
                                }
                                aa  = a;
                                len = 0;
                                if (open < 0) {
                                    open = 0;
                                }
                                do {
                                    aa = aa - 1;
                                    if (data.stack[aa] === "function") {
                                        aa = data.begin[aa];
                                    } else if (data.begin[aa] === open) {
                                        if (data.token[aa] === "?") {
                                            tern = true;
                                        } else if (data.token[aa] === "," && comma === false) {
                                            comma = true;
                                            if (len >= wrap) {
                                                ready = true;
                                            }
                                        } else if (data.types[aa] === "markup" && mark === false) {
                                            mark = true;
                                        }
                                        if (level[aa] > -9 && data.token[aa] !== "," && data.types[aa] !== "markup") {
                                            len = 0;
                                        } else {
                                            if (level[aa] === -10) {
                                                len = len + 1;
                                            }
                                            len = len + data.token[aa].length;
                                            if (len >= wrap && (comma === true || mark === true)) {
                                                ready = true;
                                            }
                                        }
                                    } else {
                                        if (level[aa] > -9) {
                                            len = 0;
                                        } else {
                                            len = len + data.token[aa].length;
                                            if (len >= wrap && (comma === true || mark === true)) {
                                                ready = true;
                                            }
                                        }
                                    }
                                } while (aa > open && ready === false);
                                if (comma === false && data.token[data.begin[a] + 1].charAt(0) === "`") {
                                    level[data.begin[a]] = -20;
                                    level[a - 1] = -20;
                                } else if (((comma === true || mark === true) && len >= wrap) || level[open] > -9) {
                                    if (tern === true) {
                                        ind = level[open];
                                        if (data.token[open - 1] === "[") {
                                            aa = a;
                                            do {
                                                aa = aa + 1;
                                                if (data.types[aa] === "end" || data.token[aa] === "," || data.token[aa] === ";") {
                                                    break;
                                                }
                                            } while (aa < b);
                                            if (data.token[aa] === "]") {
                                                ind = ind - 1;
                                                array = true;
                                            }
                                        }
                                    } else if (exl > 0 && ei[exl - 1] > aa) {
                                        ind = ind - exl;
                                    }
                                    destruct[destruct.length - 1] = false;
                                    aa = a;
                                    do {
                                        aa = aa - 1;
                                        if (data.begin[aa] === open) {
                                            if (data.token[aa].indexOf("=") > -1 && data.types[aa] === "operator" && data.token[aa].indexOf("!") < 0 && data.token[aa].indexOf("==") < 0 && data.token[aa] !== "<=" && data.token[aa].indexOf(">") < 0) {
                                                len = aa;
                                                do {
                                                    len = len - 1;
                                                    if (data.begin[len] === open && (data.token[len] === ";" || data.token[len] === "," || len === open)) {
                                                        break;
                                                    }
                                                } while (len > open);
                                            } else if (data.token[aa] === ",") {
                                                level[aa] = ind;
                                            } else if (level[aa] > -9 && array === false && (data.token[open - 1] !== "for" || data.token[aa + 1] === "?" || data.token[aa + 1] === ":") && (data.token[data.begin[a]] !== "(" || data.token[aa] !== "+")) {
                                                level[aa] = level[aa] + 1;
                                            }
                                        } else if (level[aa] > -9 && array === false) {
                                            level[aa] = level[aa] + 1;
                                        }
                                    } while (aa > open);
                                    level[open]  = ind;
                                    level[a - 1] = ind - 1;
                                } else {
                                    level[a - 1] = -20;
                                }
                                if (data.token[data.begin[a] - 1] === "+" && level[data.begin[a]] > -9) {
                                    level[data.begin[a] - 1] = -10;
                                }
                            } else {
                                level[a - 1] = -20;
                            }
                            level.push(-20);
                        } else if (destruct[destruct.length - 1] === true) {
                            if (ctoke === "]" && data.begin[a] - 1 > 0 && data.token[data.begin[data.begin[a] - 1]] === "[") {
                                destruct[destruct.length - 2] = false;
                            }
                            if (data.begin[a] < level.length) {
                                level[data.begin[a]] = -20;
                            }
                            level[a - 1] = -20;
                            level.push(-20);
                        } else if (data.types[a - 1] === "comment" && data.token[a - 1].substr(0, 2) === "//") {
                            if (data.token[a - 2] === "x}") {
                                level[a - 3] = indent + 1;
                            }
                            level[a - 1] = indent;
                            level.push(-20);
                        } else if (data.types[a - 1] !== "comment" && ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]"))) {
                            level[a - 1] = -20;
                            if (ctoke === "}" && options.language === "titanium") {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        } else if (ctoke === "]") {
                            if ((list[list.length - 1] === true && destruct[destruct.length - 1] === false) || (ltoke === "]" && level[a - 2] === indent + 1)) {
                                level[a - 1]    = indent;
                                level[data.begin[a]] = indent + 1;
                            } else if (level[a - 1] === -10) {
                                level[a - 1] = -20;
                            }
                            if (data.token[data.begin[a] + 1] === "function") {
                                level[a - 1] = indent;
                            } else if (list[list.length - 1] === false) {
                                if (ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent;
                                }
                                let c = a - 1,
                                    d = 1;
                                do {
                                    if (data.token[c] === "]") {
                                        d = d + 1;
                                    }
                                    if (data.token[c] === "[") {
                                        d = d - 1;
                                        if (d === 0) {
                                            if (c > 0 && (data.token[c + 1] === "{" || data.token[c + 1] === "x{" || data.token[c + 1] === "[")) {
                                                level[c] = indent + 1;
                                                break;
                                            }
                                            if (data.token[c + 1] !== "[" || lastlist === false) {
                                                level[c] = -20;
                                                break;
                                            }
                                            break;
                                        }
                                    }
                                    if (d === 1 && data.token[c] === "+" && level[c] > 1) {
                                        level[c] = level[c] - 1;
                                    }
                                    c = c - 1;
                                } while (c > -1);
                            }
                            level.push(-20);
                        } else if (ctoke === "}" || ctoke === "x}" || list[list.length - 1] === true) {
                            if (ctoke === "}" && ltoke === "x}" && data.token[a + 1] === "else") {
                                level[a - 2] = indent + 2;
                                level.push(-20);
                            } else {
                                level.push(indent);
                            }
                            level[a - 1] = indent;
                        } else {
                            level.push(-20);
                        }
                        if (data.types[a - 1] === "comment") {
                            level[a - 1] = indent;
                        }
                        endExtraInd();
                        lastlist = list[list.length - 1];
                        list.pop();
                        extraindent.pop();
                        arrbreak.pop();
                        itemcount.pop();
                        wordlist.pop();
                        destruct.pop();
                        assignlist.pop();
                    },
                    endExtraInd   = function beautify_script_endExtraInd():void {
                        const ei:number[] = extraindent[extraindent.length - 1];
                        let c:number  = 0;
                        if (ei === undefined) {
                            return;
                        }
                        c = ei.length - 1;
                        if (c < 1 && ei[c] < 0 && (ctoke === ";" || ctoke === "x;" || ctoke === ")" || ctoke === "x)" || ctoke === "}" || ctoke === "x}")) {
                            ei.pop();
                            return;
                        }
                        if (c < 0 || ei[c] < 0) {
                            return;
                        }
                        if (ctoke === ":") {
                            if (data.token[ei[c]] !== "?") {
                                do {
                                    ei.pop();
                                    c      = c - 1;
                                    indent = indent - 1;
                                } while (c > -1 && ei[c] > -1 && data.token[ei[c]] !== "?");
                            }
                            ei[c]        = a;
                            level[a - 1] = indent;
                        } else {
                            do {
                                ei.pop();
                                c      = c - 1;
                                indent = indent - 1;
                            } while (c > -1 && ei[c] > -1);
                        }
                        if ((data.stack[a] === "array" || ctoke === ",") && ei.length < 1) {
                            ei.push(-1);
                        }
                    },
                    string       = function beautify_script_string():void {
                        if (ctoke.indexOf("#!/") === 0) {
                            level.push(indent);
                        } else {
                            if (ctoke.charAt(0) === "}") {
                                level[a - 1] = -20;
                            }
                            if (options.brace_padding === true && ctoke.charAt(0) === "}" && ctoke.charAt(ctoke.length - 1) === "`") {
                                level[a - 1] = -10;
                            }
                            level.push(-10);
                        }
                        if ((ltoke === "," || ltype === "start") && (data.stack[a] === "object" || data.stack[a] === "array") && destruct[destruct.length - 1] === false && a > 0) {
                            level[a - 1] = indent;
                        }
                    },
                    markup        = function beautify_script_markup():void {
                        if ((data.token[a + 1] !== "," && ctoke.indexOf("/>") !== ctoke.length - 2) || (data.token[a + 1] === "," && data.token[data.begin[a] - 3] !== "React")) {
                            destructfix(false, false);
                        }
                        if (ltoke === "return" || ltoke === "?" || ltoke === ":") {
                            level[a - 1] = -10;
                            level.push(-20);
                        } else if (ltype === "start" || (data.token[a - 2] === "return" && data.stack[a - 1] === "method")) {
                            level.push(indent);
                        } else {
                            level.push(-20);
                        }
                    },
                    operator      = function beautify_script_operator():void {
                        const ei:number[] = (extraindent[extraindent.length - 1] === undefined)
                            ? []
                            : extraindent[extraindent.length - 1];
                        if (ei.length > 0 && ei[ei.length - 1] > -1 && data.stack[a] === "array") {
                            arrbreak[arrbreak.length - 1] = true;
                        }
                        if (ctoke !== ":") {
                            if (data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(" && destruct.length > 0) {
                                destructfix(true, false);
                            }
                            if (ctoke !== "?" && data.token[ei[ei.length - 1]] === ".") {
                                let c:number = a,
                                    d:number = data.begin[c],
                                    e:number = 0;
                                do {
                                    if (data.begin[c] === d) {
                                        if (data.token[c + 1] === "{" || data.token[c + 1] === "[" || data.token[c] === "function") {
                                            break;
                                        }
                                        if (data.token[c] === "," || data.token[c] === ";" || data.types[c] === "end" || data.token[c] === ":") {
                                            ei.pop();
                                            indent = indent - 1;
                                            break;
                                        }
                                        if (data.token[c] === "?" || data.token[c] === ":") {
                                            if (data.token[ei[ei.length - 1]] === "." && e < 2) {
                                                ei[ei.length - 1] = d + 1;
                                            }
                                            break;
                                        }
                                        if (data.token[c] === ".") {
                                            e = e + 1;
                                        }
                                    }
                                    c = c + 1;
                                } while (c < b);
                            }
                        }
                        if (ctoke === "!" || ctoke === "...") {
                            if (ltoke === "}" || ltoke === "x}") {
                                level[a - 1] = indent;
                            }
                            level.push(-20);
                            return;
                        }
                        if (ltoke === ";" || ltoke === "x;") {
                            if (data.token[data.begin[a] - 1] !== "for") {
                                level[a - 1] = indent;
                            }
                            level.push(-20);
                            return;
                        }
                        if (ctoke === "*") {
                            if (ltoke === "function" || ltoke === "yield") {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = -10;
                            }
                            level.push(-10);
                            return;
                        }
                        if (ctoke === "?") {
                            if (data.lines[a] === 0 && data.types[a - 2] === "word" && data.token[a - 2] !== "return" && data.token[a - 2] !== "in" && data.token[a - 2] !== "instanceof" && data.token[a - 2] !== "typeof" && (ltype === "reference" || ltype === "word")) {
                                if (data.types[a + 1] === "word" || data.types[a + 1] === "reference" || ((data.token[a + 1] === "(" || data.token[a + 1] === "x(") && data.token[a - 2] === "new")) {
                                    level[a - 1] = -20;
                                    if (data.types[a + 1] === "word" || data.types[a + 1] === "reference") {
                                        level.push(-10);
                                        return;
                                    }
                                    level.push(-20);
                                    return;
                                }
                            }
                            if (data.token[a + 1] === ":") {
                                level[a - 1] = -20;
                                level.push(-20);
                                return;
                            }
                            ternary.push(a);
                            if (options.ternary_line === true) {
                                level[a - 1] = -10;
                            } else {
                                let c = a - 1;
                                do {
                                    c = c - 1;
                                } while (c > -1 && level[c] < -9);
                                ei.push(a);
                                indent = indent + 1;
                                if (level[c] === indent && data.token[c + 1] !== ":") {
                                    indent = indent + 1;
                                    ei.push(a);
                                }
                                level[a - 1] = indent;
                                if (data.token[data.begin[a]] === "(" && (ei.length < 2 || ei[0] === ei[1])) {
                                    destruct[destruct.length - 1] = false;
                                    if (a - 2 === data.begin[a]) {
                                        level[data.begin[a]] = indent - 1;
                                    } else {
                                        level[data.begin[a]] = indent;
                                    }
                                    c = a - 2;
                                    do {
                                        if (data.types[c] === "end" && level[c - 1] > -1) {
                                            break;
                                        }
                                        if (level[c] > -1) {
                                            level[c] = level[c] + 1;
                                        }
                                        c = c - 1;
                                    } while (c > data.begin[a]);
                                }
                            }
                        }
                        if (ctoke === ":") {
                            if (ternary.length > 0 && data.begin[ternary[ternary.length - 1]] === data.begin[a]) {
                                let c:number = a,
                                    d:number = data.begin[a];
                                do {
                                    c = c - 1;
                                    if (data.begin[c] === d) {
                                        if (data.token[c] === "," || data.token[c] === ";") {
                                            level[a - 1] = -20;
                                            break;
                                        }
                                        if (data.token[c] === "?") {
                                            ternary.pop();
                                            endExtraInd();
                                            if (options.ternary_line === true) {
                                                level[a - 1] = -10;
                                            }
                                            level.push(-10);
                                            return;
                                        }
                                    } else if (data.types[c] === "end") {
                                        c = data.begin[c];
                                    }
                                } while (c > d);
                            }
                            if (data.token[a - 2] === "where" && data.stack[a - 2] === data.stack[a]) {
                                level[a - 1] = -10;
                                level.push(-10);
                                return;
                            }
                            if (ltype === "reference" && data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(") {
                                level[a - 1] = -20;
                                level.push(-10);
                                return;
                            }
                            if ((ltoke === ")" || ltoke === "x)") && data.token[data.begin[a - 1] - 2] === "function") {
                                level[a - 1] = -20;
                                level.push(-10);
                                return;
                            }
                            if (data.stack[a] === "attribute") {
                                level[a - 1] = -20;
                                level.push(-10);
                                return;
                            }
                            if (
                                data.token[data.begin[a]] !== "(" &&
                                data.token[data.begin[a]] !== "x(" &&
                                (ltype === "reference" || ltoke === ")" || ltoke === "]" || ltoke === "?") &&
                                (data.stack[a] === "map" || data.stack[a] === "class" || data.types[a + 1] === "reference") &&
                                (ternary.length === 0 || ternary[ternary.length - 1] < data.begin[a]) &&
                                ("mapclassexpressionmethodglobalparen".indexOf(data.stack[a]) > -1 || (data.types[a - 2] === "word" && data.stack[a] !== "switch"))
                            ) {
                                level[a - 1] = -20;
                                level.push(-10);
                                return;
                            }
                            if (data.stack[a] === "switch" && (ternary.length < 1 || ternary[ternary.length - 1] < data.begin[a])) {
                                level[a - 1] = -20;
                                level.push(indent);
                                return;
                            }
                            if (data.stack[a] === "object") {
                                level[a - 1] = -20;
                            } else if (ternary.length > 0) {
                                level[a - 1] = indent;
                            } else {
                                level[a - 1] = -10;
                            }
                            level.push(-10);
                            return;
                        }
                        if (ctoke === "++" || ctoke === "--") {
                            if (ltype === "number" || ltype === "reference") {
                                level[a - 1] = -20;
                                level.push(-10);
                            } else if (a < b - 1 && (data.types[a + 1] === "number" || data.types[a + 1] === "reference")) {
                                level.push(-20);
                            } else {
                                level.push(-10);
                            }
                            return;
                        }
                        if (ctoke === "+") {
                            if (ltype === "start") {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = -10;
                            }
                            if (options.wrap < 1 || data.token[data.begin[a]] === "x(") {
                                level.push(-10);
                                return;
                            }
                            let line:number = 0,
                                next:number = 0,
                                c:number    = a,
                                ind:number  = indent + 2,
                                aa:string   = data.token[a + 1],
                                meth:number = 0;
                            if (aa === undefined) {
                                level.push(-10);
                                return;
                            }
                            if (data.types[a - 1] === "operator" || data.types[a - 1] === "start") {
                                if (data.types[a + 1] === "reference" || aa === "(" || aa === "[") {
                                    level.push(-20);
                                    return;
                                }
                                if (Number(aa.slice(1, -1)) > -1 && ((/\d/).test(aa.charAt(1)) === true || aa.charAt(1) === "." || aa.charAt(1) === "-" || aa.charAt(1) === "+")) {
                                    level.push(-20);
                                    return;
                                }
                            }
                            do {
                                c = c - 1;
                                if (data.token[data.begin[a]] === "(") {
                                    if (c === data.begin[a]) {
                                        meth = line;
                                    }
                                    if (data.token[c] === "," && data.begin[c] === data.begin[a] && list[list.length - 1] === true) {
                                        break;
                                    }
                                }
                                if (line > options.wrap - 1) {
                                    break;
                                }
                                if (level[c] > -9) {
                                    break;
                                }
                                if (data.types[c] === "operator" && data.token[c] !== "=" && data.token[c] !== "+" && data.begin[c] === data.begin[a]) {
                                    break;
                                }
                                line = line + data.token[c].length;
                                if (c === data.begin[a] && data.token[c] === "[" && line < options.wrap - 1) {
                                    break;
                                }
                                if (data.token[c] === "." && level[c] > -9) {
                                    break;
                                }
                                if (level[c] === -10) {
                                    line = line + 1;
                                }
                            } while (c > 0);
                            if (meth > 0) {
                                meth = meth + aa.length;
                            }
                            line = line + aa.length;
                            next = c;
                            if (line > options.wrap - 1 && level[c] < -9) {
                                do {
                                    next = next - 1;
                                } while (next > 0 && level[next] < -9);
                            }
                            if (data.token[next + 1] === "." && data.begin[a] <= data.begin[next]) {
                                ind = ind + 1;
                            } else if (data.token[next] === "+") {
                                ind = level[next];
                            }
                            next = aa.length;
                            if (line + next < options.wrap) {
                                level.push(-10);
                                return;
                            }
                            if (data.token[data.begin[a]] === "(" && (data.token[ei[0]] === ":" || data.token[ei[0]] === "?")) {
                                ind = indent + 3;
                            } else if (data.stack[a] === "method") {
                                level[data.begin[a]] = indent;
                                if (list[list.length - 1] === true) {
                                    ind = indent + 3;
                                } else {
                                    ind = indent + 1;
                                }
                            } else if (data.stack[a] === "object" || data.stack[a] === "array") {
                                destructfix(true, false);
                            }
                            if (data.token[c] === "var" || data.token[c] === "let" || data.token[c] === "const") {
                                line = line - (options.indent_size * options.indent_char.length * 2);
                            }
                            if (meth > 0) {
                                c = options.wrap - meth;
                            } else {
                                c = options.wrap - line;
                            }
                            if (c > 0 && c < 5) {
                                level.push(ind);
                                if (data.token[a].charAt(0) === "\"" || data.token[a].charAt(0) === "'") {
                                    a = a + 1;
                                    level.push(-10);
                                    return;
                                }
                            } else if (data.token[data.begin[a]] !== "(" || meth > options.wrap - 1 || meth === 0) {
                                if (meth > 0) {
                                    line = meth;
                                }
                                if (line - aa.length < options.wrap - 1 && (aa.charAt(0) === "\"" || aa.charAt(0) === "'")) {
                                    a = a + 1;
                                    line = line + 3;
                                    if (line - aa.length > options.wrap - 4) {
                                        level.push(ind);
                                        return;
                                    }
                                    level.push(-10);
                                    return;
                                }
                                level.push(ind);
                                return;
                            }
                            level.push(-10);
                            return;
                        }
                        if (data.types[a - 1] !== "comment") {
                            if (ltoke === "(") {
                                level[a - 1] = -20;
                            } else if (ctoke === "*" && data.stack[a] === "object" && data.types[a + 1] === "reference" && (ltoke === "{" || ltoke === ",")) {
                                level[a - 1] = indent;
                            } else if (ctoke !== "?" || ternary.length === 0) {
                                level[a - 1] = -10;
                            }
                        }
                        if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && ctoke !== "=>" && data.stack[a] !== "method" && data.stack[a] !== "object") {
                            let c:number = a + 1,
                                d:number = 0,
                                e:boolean = false,
                                f:string = "";
                            if ((data.token[data.begin[a]] === "(" || data.token[data.begin[a]] === "x(") && data.token[a + 1] !== "function") {
                                return;
                            }
                            do {
                                if (data.types[c] === "start") {
                                    if (e === true && data.token[c] !== "[") {
                                        if (assignlist[assignlist.length - 1] === true) {
                                            assignlist[assignlist.length - 1] = false;
                                        }
                                        break;
                                    }
                                    d = d + 1;
                                }
                                if (data.types[c] === "end") {
                                    d = d - 1;
                                }
                                if (d < 0) {
                                    if (assignlist[assignlist.length - 1] === true) {
                                        assignlist[assignlist.length - 1] = false;
                                    }
                                    break;
                                }
                                if (d === 0) {
                                    f = data.token[c];
                                    if (e === true) {
                                        if (data.types[c] === "operator" || data.token[c] === ";" || data.token[c] === "x;" || data.token[c] === "?" || data.token[c] === "var" || data.token[c] === "let" || data.token[c] === "const") {
                                            if (f !== undefined && (f === "?" || (f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<="))) {
                                                if (assignlist[assignlist.length - 1] === false) {
                                                    assignlist[assignlist.length - 1] = true;
                                                }
                                            }
                                            if ((f === ";" || f === "x;" || f === "var" || f === "let" || f === "const") && assignlist[assignlist.length - 1] === true) {
                                                assignlist[assignlist.length - 1] = false;
                                            }
                                            break;
                                        }
                                        if (assignlist[assignlist.length - 1] === true && (f === "return" || f === "break" || f === "continue" || f === "throw")) {
                                            assignlist[assignlist.length - 1] = false;
                                        }
                                    }
                                    if (f === ";" || f === "x;" || f === ",") {
                                        e = true;
                                    }
                                }
                                c = c + 1;
                            } while (c < b);
                        }
                        if ((ctoke === "-" && ltoke === "return") || ltoke === "=") {
                            level.push(-20);
                            return;
                        }
                        if (ltype === "operator" && data.types[a + 1] === "reference" && ltoke !== "--" && ltoke !== "++" && ctoke !== "&&" && ctoke !== "||") {
                            level.push(-20);
                            return;
                        }
                        level.push(-10);
                    },
                    reference     = function beautify_script_reference():void {
                        const hoist = function beautify_script_reference_hoist():void {
                                let func:number = data.begin[a];
                                if (func < 0) {
                                    scopes.push([data.token[a], -1, -10]);
                                } else {
                                    if (data.stack[func + 1] !== "function") {
                                        do {
                                            func = data.begin[func];
                                        } while (func > -1 && data.stack[func + 1] !== "function");
                                    }
                                    scopes.push([data.token[a], func, -10]);
                                }
                            };
                        if (ltype !== "separator" && ltype !== "start" && ltype !== "end") {
                            if (ltype === "word" || ltype === "operator") {
                                level[a - 1] = -10;
                            } else {
                                level[a - 1] = -20;
                            }
                        }
                        if (ltoke === "var") {
                            // hoisted references following declaration keyword
                            hoist();
                        } else if (ltoke === "function") {// && (data.token[a - 2] === "=" || data.types[a - 2] !== "operator") && data.types[a - 2] !== "start" && data.types[a - 2] !== "end") {
                            scopes.push([data.token[a], a, -10]);
                        } else if (ltoke === "let" || ltoke === "const") {
                            // not hoisted references following declaration keyword
                            scopes.push([data.token[a], a, -10]);
                        } else if (data.stack[a] === "arguments") {
                            scopes.push([data.token[a], a, -10]);
                        } else if (ltoke === ",") {
                            // references following a comma, must be tested to see if a declaration list
                            let index:number = a;
                            do {
                                index = index - 1;
                            } while (index > data.begin[a] && data.token[index] !== "var" && data.token[index] !== "let" && data.token[index] !== "const");
                            if (data.token[index] === "var") {
                                hoist();
                            } else if (data.token[index] === "let" || data.token[index] === "const") {
                                scopes.push([data.token[a], a, -10]);
                            }
                        }
                        level.push(-10);
                    },
                    separator     = function beautify_script_separator():void {
                        let methtest:boolean      = false;
                        const ei:number[]           = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            propertybreak = function beautify_script_separator_propertybreak():void {
                                if (options.method_chain > 0) {
                                    let x:number = a,
                                        y:number = data.begin[a],
                                        z:number[] = [];
                                    do {
                                        if (data.types[x] === "end") {
                                            x = data.begin[x];
                                        }
                                        if (data.begin[x] === y) {
                                            if (data.token[x] === ".") {
                                                if (level[x - 1] > 0) {
                                                    level[a - 1] = indent + 1;
                                                    return;
                                                }
                                                z.push(x);
                                            } else if (
                                                data.token[x] === ";" ||
                                                data.token[x] === "," ||
                                                data.types[x] === "operator" ||
                                                (
                                                    (data.types[x] === "word" || data.types[x] === "reference") &&
                                                    (data.types[x - 1] === "word" || data.types[x - 1] === "reference")
                                                )
                                             ) {
                                                break;
                                            }
                                        }
                                        x = x - 1;
                                    } while (x > y);
                                    if (z.length < options.method_chain) {
                                        level[a - 1] = -20;
                                        return;
                                    }
                                    x = 0;
                                    y = z.length;
                                    do {
                                        level[z[x] - 1] = indent;
                                        x = x + 1;
                                    } while (x < y);
                                    x = z[z.length - 1] - 1;
                                    do {
                                        if (level[x] > -1) {
                                            level[x] = level[x] + 1;
                                        }
                                        x = x + 1;
                                    } while (x < a);
                                }
                                level[a - 1] = indent + 1;
                            };
                        if (ctoke === "::") {
                            level[a - 1] = -20;
                            level.push(-20);
                            return;
                        }
                        if (ctoke === ".") {
                            if (data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(" && ei.length > 0) {
                                if (data.stack[a] === "object" || data.stack[a] === "array") {
                                    destructfix(true, false);
                                } else {
                                    destructfix(false, false);
                                }
                            }
                            if (options.method_chain === 0) {
                                // methodchain is 0 so methods and properties should be chained together
                                level[a- 1] = -20;
                            } else if (options.method_chain < 0) {
                                if (data.lines[a] > 0) {
                                    propertybreak();
                                } else {
                                    level[a - 1] = -20;
                                }
                            } else {
                                // methodchain is greater than 0 and should break methods if the chain reaches this value
                                propertybreak();
                            }
                            level.push(-20);
                            return;
                        }
                        if (ctoke === ",") {
                            if (list[list.length - 1] === false && (data.stack[a] === "object" || data.stack[a] === "array" || data.stack[a] === "paren" || data.stack[a] === "expression" || data.stack[a] === "method")) {
                                list[list.length - 1] = true;
                                if (data.token[data.begin[a]] === "(") {
                                    let aa:number = a;
                                    do {
                                        aa = aa - 1;
                                        if (data.begin[aa] === data.begin[a] && data.token[aa] === "+" && level[aa] > -9) {
                                            level[aa] = level[aa] + 2;
                                        }
                                    } while (aa > data.begin[a]);
                                }
                            }
                            if (ei.length > 0) {
                                if (ei[ei.length - 1] > -1) {
                                    endExtraInd();
                                }
                                level[a - 1] = -20;
                                level.push(indent);
                                return;
                            }
                            if (data.token[a - 2] === ":" && data.token[a - 4] === "where") {
                                level[a - 1] = -20;
                                level.push(-10);
                                return;
                            }
                            level[a - 1]                    = -20;
                            itemcount[itemcount.length - 1] = itemcount[itemcount.length - 1] + 1;
                            if ((data.token[data.begin[a]] === "(" || data.token[data.begin[a]] === "x(") && options.language !== "jsx" && data.stack[a] !== "global" && ((data.types[a - 1] !== "string" && data.types[a - 1] !== "number") || data.token[a - 2] !== "+" || (data.types[a - 1] === "string" && data.types[a - 1] !== "number" && data.token[a - 2] === "+" && data.types[a - 3] !== "string" && data.types[a - 3] !== "number"))) {
                                level.push(-10);
                                return;
                            }
                            if (ltype === "reference" && data.types[a - 2] === "word" && "var-let-const-from".indexOf(data.token[a - 2]) < 0 && (data.types[a - 3] === "end" || data.token[a - 3] === ";")) {
                                wordlist[wordlist.length - 1] = true;
                                level.push(-10);
                                return;
                            }
                            if (wordlist[wordlist.length - 1] === true || data.stack[a] === "notation") {
                                level.push(-10);
                                return;
                            }
                            if (destruct[destruct.length - 1] === true && itemcount[itemcount.length - 1] > 4 && (data.stack[a] === "array" || data.stack[a] === "object")) {
                                destructfix(true, true);
                            }
                            if (data.stack[a] === "object") {
                                if (destruct[destruct.length - 1] === true && data.types[data.begin[a] - 1] !== "word" && data.types[data.begin[a] - 1] !== "reference" && data.token[data.begin[a] - 1] !== "(" && data.token[data.begin[a] - 1] !== "x(") {
                                    const bb:number = data.begin[a];
                                    let aa:number = a - 1;
                                    do {
                                        if (data.begin[aa] === bb) {
                                            if (data.token[aa] === ",") {
                                                break;
                                            }
                                            if (data.token[aa] === ":") {
                                                destructfix(true, false);
                                                break;
                                            }
                                        }
                                        aa = aa - 1;
                                    } while (aa > bb);
                                }
                            }
                            if ((data.types[a - 1] === "word" || data.types[a - 1] === "reference") && data.token[a - 2] === "for") {
                                //This is for Volt templates
                                level.push(-10);
                                return;
                            }
                            if (destruct[destruct.length - 1] === false || (data.token[a - 2] === "+" && (ltype === "string" || ltype === "number") && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'"))) {
                                if (data.stack[a] === "method") {
                                    if (data.token[a - 2] === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'") && (data.token[a - 3].charAt(0) === "\"" || data.token[a - 3].charAt(0) === "'")) {
                                        level.push(indent + 2);
                                        return;
                                    }
                                    if (data.token[a - 2] !== "+") {
                                        level.push(-10);
                                        return;
                                    }
                                }
                                level.push(indent);
                                return;
                            }
                            if (list[list.length - 1] === true) {
                                let c:number = 0,
                                    d:number = 0;
                                do {
                                    if (data.types[c] === "end") {
                                        d = d + 1;
                                    }
                                    if (data.types[c] === "start") {
                                        d = d - 1;
                                    }
                                    if (d === -1) {
                                        if (data.token[c] === "[" && data.token[c + 1] !== "]" && data.token[c + 2] !== "]") {
                                            if (destruct[destruct.length - 1] === false || arrbreak[arrbreak.length - 1] === true) {
                                                level[c] = indent;
                                            } else if (methtest === false && destruct[destruct.length - 1] === true) {
                                                level[c] = -20;
                                            }
                                            if (data.token[a - 2] === "+" && ltype === "string" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                                d = a - 2;
                                                do {
                                                    if (data.token[d] !== "+") {
                                                        break;
                                                    }
                                                    if (data.token[d - 1].charAt(0) !== "\"" && data.token[d - 1].charAt(0) !== "'") {
                                                        level[d] = -10;
                                                    }
                                                    d = d - 2;
                                                } while (d > c);
                                                break;
                                            }
                                        }
                                        if (arrbreak[arrbreak.length - 1] === true) {
                                            level.push(indent);
                                            return;
                                        }
                                        level.push(-10);
                                        return;
                                    }
                                    c = c - 1;
                                } while (c > -1);
                                if (arrbreak[arrbreak.length - 1] === true) {
                                    level.push(indent);
                                    return;
                                }
                                level.push(-10);
                                return;
                            }
                            if (destruct[destruct.length - 1] === true && data.stack[a] !== "object") {
                                level.push(-10);
                                return;
                            }
                            level.push(indent);
                            return;
                        }
                        if (ctoke === ";" || ctoke === "x;") {
                            if (varindex[varindex.length - 1] > -1) {
                                let aa = a;
                                do {
                                    aa = aa - 1;
                                    if (data.token[aa] === ";") {
                                        break;
                                    }
                                    if (data.token[aa] === ",") {
                                        indent = indent - 1;
                                        break;
                                    }
                                    if (data.types[aa] === "end") {
                                        aa = data.begin[aa];
                                    }
                                } while (aa > 0 && aa > data.begin[a]);
                                varindex[varindex.length - 1] = -1;
                            }
                            endExtraInd();
                            if (data.token[data.begin[a] - 1] !== "for") {
                                destructfix(false, false);
                            }
                            if (ctoke === "x;") {
                                scolon = scolon + 1;
                            }
                            wordlist[wordlist.length - 1] = false;
                            level[a - 1] = -20;
                            if (data.begin[a] > 0 && data.token[data.begin[a] - 1] === "for" && data.stack[a] !== "for") {
                                level.push(-10);
                                return;
                            }
                            level.push(indent);
                            return;
                        }
                        level.push(-20);
                    },
                    start         = function beautify_script_start():void {
                        const deep:string   = data.stack[a + 1],
                            deeper:string = (a === 0)
                                ? data.stack[a]
                                : data.stack[a - 1];
                        if (ltoke === ")" || ((deeper === "object" || deeper === "array") && ltoke !== "]")) {
                            if (deep !== "method" || (deep === "method" && data.token[a + 1] !== ")" && data.token[a + 2] !== ")")) {
                                if (ltoke === ")" && (deep !== "function" || data.token[data.begin[data.begin[a - 1] - 1]] === "(" || data.token[data.begin[data.begin[a - 1] - 1]] === "x(")) {
                                    destructfix(false, false);
                                } else if (data.types[a + 1] !== "end" && data.types[a + 2] !== "end") {
                                    destructfix(true, false);
                                }
                            }
                        }
                        list.push(false);
                        extraindent.push([]);
                        assignlist.push(false);
                        arrbreak.push(false);
                        wordlist.push(false);
                        itemcount.push(0);
                        if (options.never_flatten === true || options.language === "qml" || deep === "attribute" || ltype === "generic" || (deep === "class" && ltoke !== "(" && ltoke !== "x(") || (ctoke === "[" && data.token[a + 1] === "function")) {
                            destruct.push(false);
                        } else {
                            if (deep === "expression" || deep === "method") {
                                destruct.push(true);
                            } else if ((deep === "object" || deep === "class") && (ltoke === "(" || ltoke === "x(" || ltype === "word" || ltype === "reference")) {
                                //array or object literal following `return` or `(`
                                destruct.push(true);
                            } else if (deep === "array" || ctoke === "(" || ctoke === "x(") {
                                //array, method, paren
                                destruct.push(true);
                            } else if (ctoke === "{" && deep === "object" && ltype !== "operator" && ltype !== "start" && ltype !== "string" && ltype !== "number" && deeper !== "object" && deeper !== "array" && a > 0) {
                                //curly brace not in a list and not assigned
                                destruct.push(true);
                            } else {
                                //not destructured (multiline)
                                destruct.push(false);
                            }
                        }
                        if (ctoke !== "(" && ctoke !== "x(" && data.stack[a + 1] !== "attribute") {
                            indent = indent + 1;
                        }
                        if (ctoke === "{" || ctoke === "x{") {
                            varindex.push(-1);
                            if (data.types[a - 1] !== "comment") {
                                if (ltype === "markup") {
                                    level[a - 1] = indent;
                                } else if (options.braces === true && ltype !== "operator" && ltoke !== "return") {
                                    level[a - 1] = indent - 1;
                                } else if (data.stack[a + 1] !== "block" && (deep === "function" || ltoke === ")" || ltoke === "x)" || ltoke === "," || ltoke === "}" || ltype === "markup")) {
                                    level[a - 1] = -10;
                                } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent - 1;
                                }
                            }
                            if (deep === "object") {
                                if (options.format_object === "indent") {
                                    destruct[destruct.length - 1] = false;
                                    level.push(indent);
                                    return;
                                }
                                if (options.format_object === "inline") {
                                    destruct[destruct.length - 1] = true;
                                    level.push(-20);
                                    return;
                                }
                            }
                            if (deep === "switch") {
                                if (options.no_case_indent === true) {
                                    level.push(indent - 1);
                                    return;
                                }
                                indent = indent + 1;
                                level.push(indent);
                                return;
                            }
                            if (destruct[destruct.length - 1] === true) {
                                if (ltype !== "word" && ltype !== "reference") {
                                    level.push(-20);
                                    return;
                                }
                            }
                            level.push(indent);
                            return;
                        }
                        if (ctoke === "(" || ctoke === "x(") {
                            if (ltoke === "-" && (data.token[a - 2] === "(" || data.token[a - 2] === "x(")) {
                                level[a - 2] = -20;
                            }
                            if (ltype === "end" && deeper !== "if" && deeper !== "for" && deeper !== "catch" && deeper !== "else" && deeper !== "do" && deeper !== "try" && deeper !== "finally" && deeper !== "catch") {
                                if (data.types[a - 1] === "comment") {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = -20;
                                }
                            }
                            if (ltoke === "async") {
                                level[a - 1] = -10;
                            } else if (deep === "method" || (data.token[a - 2] === "function" && ltype === "reference")) {
                                if (ltoke === "import" || ltoke === "in" || options.function_name === true) {
                                    level[a - 1] = -10;
                                } else if ((ltoke === "}" && data.stack[a - 1] === "function") || ltype === "word" || ltype === "reference") {
                                    level[a - 1] = -20;
                                } else if (deeper !== "method" && deep !== "method") {
                                    level[a - 1] = indent;
                                }
                            }
                            if (ltoke === "+" && (data.token[a - 2].charAt(0) === "\"" || data.token[a - 2].charAt(0) === "'")) {
                                level.push(indent);
                                return;
                            }
                            if (ltoke === "}" || ltoke === "x}") {
                                level.push(-20);
                                return;
                            }
                            if ((ltoke === "-" && (a < 2 || (data.token[a - 2] !== ")" && data.token[a - 2] !== "x)" && data.token[a - 2] !== "]" && data.types[a - 2] !== "reference" && data.types[a - 2] !== "string" && data.types[a - 2] !== "number"))) || (options.space === false && ltoke === "function")) {
                                level[a - 1] = -20;
                            }
                            level.push(-20);
                            return;
                        }
                        if (ctoke === "[") {
                            if (ltoke === "[") {
                                list[list.length - 2] = true;
                            }
                            if (ltoke === "return" || ltoke === "var" || ltoke === "let" || ltoke === "const") {
                                level[a - 1] = -10;
                            } else if (data.types[a - 1] !== "comment" && data.stack[a - 1] !== "attribute" && (ltype === "end" || ltype === "word" || ltype === "reference")) {
                                level[a - 1] = -20;
                            } else if (ltoke === "[" || ltoke === "{" || ltoke === "x{") {
                                level[a - 1] = indent - 1;
                            }
                            if (data.stack[a] === "attribute") {
                                level.push(-20);
                                return;
                            }
                            if (options.format_array === "indent") {
                                destruct[destruct.length - 1] = false;
                                level.push(indent);
                                return;
                            }
                            if (options.format_array === "inline") {
                                destruct[destruct.length - 1] = true;
                                level.push(-20);
                                return;
                            }
                            if (deep === "method" || destruct[destruct.length - 1] === true) {
                                level.push(-20);
                                return;
                            }
                            let c:number = a + 1;
                            do {
                                if (data.token[c] === "]") {
                                    level.push(-20);
                                    return;
                                }
                                if (data.token[c] === ",") {
                                    level.push(indent);
                                    return;
                                }
                                c = c + 1;
                            } while (c < b);
                            level.push(-20);
                            return;
                        }
                    },
                    template      = function beautify_script_template():void {
                        if (ctype === "template_else") {
                            level[a - 1] = indent - 1;
                            level.push(indent);
                        } else if (ctype === "template_start") {
                            indent = indent + 1;
                            if (data.lines[a - 1] < 1) {
                                level[a - 1] = -20;
                            }
                            if (data.lines[a] > 0) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        } else if (ctype === "template_end") {
                            indent = indent - 1;
                            if (ltype === "template_start" || data.lines[a - 1] < 1) {
                                level[a - 1] = -20;
                            } else {
                                level[a - 1] = indent;
                            }
                            if (data.lines[a] > 0) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        } else if (ctype === "template") {
                            if (data.lines[a] > 0) {
                                level.push(indent);
                            } else {
                                level.push(-20);
                            }
                        }
                    },
                    word          = function beautify_script_word():void {
                        if ((ltoke === ")" || ltoke === "x)") && data.stack[a] === "class" && (data.token[data.begin[a - 1] - 1] === "static" || data.token[data.begin[a - 1] - 1] === "final" || data.token[data.begin[a - 1] - 1] === "void")) {
                            level[a - 1]            = -10;
                            level[data.begin[a - 1] - 1] = -10;
                        }
                        if (ltoke === "]") {
                            level[a - 1] = -10;
                        }
                        if (ltoke === "}" || ltoke === "x}") {
                            level[a - 1] = indent;
                        }
                        if (ctoke === "else" && ltoke === "}" && data.token[a - 2] === "x}") {
                            level[a - 3] = level[a - 3] - 1;
                        }
                        if (ctoke === "new") {
                            let apiword:string[] = [
                                    "ActiveXObject",
                                    "ArrayBuffer",
                                    "AudioContext",
                                    "Canvas",
                                    "CustomAnimation",
                                    "DOMParser",
                                    "DataView",
                                    "Date",
                                    "Error",
                                    "EvalError",
                                    "FadeAnimation",
                                    "FileReader",
                                    "Flash",
                                    "Float32Array",
                                    "Float64Array",
                                    "FormField",
                                    "Frame",
                                    "Generator",
                                    "HotKey",
                                    "Image",
                                    "Iterator",
                                    "Intl",
                                    "Int16Array",
                                    "Int32Array",
                                    "Int8Array",
                                    "InternalError",
                                    "Loader",
                                    "Map",
                                    "MenuItem",
                                    "MoveAnimation",
                                    "Notification",
                                    "ParallelArray",
                                    "Point",
                                    "Promise",
                                    "Proxy",
                                    "RangeError",
                                    "Rectangle",
                                    "ReferenceError",
                                    "Reflect",
                                    "RegExp",
                                    "ResizeAnimation",
                                    "RotateAnimation",
                                    "Set",
                                    "SQLite",
                                    "ScrollBar",
                                    "Set",
                                    "Shadow",
                                    "StopIteration",
                                    "Symbol",
                                    "SyntaxError",
                                    "Text",
                                    "TextArea",
                                    "Timer",
                                    "TypeError",
                                    "URL",
                                    "Uint16Array",
                                    "Uint32Array",
                                    "Uint8Array",
                                    "Uint8ClampedArray",
                                    "URIError",
                                    "WeakMap",
                                    "WeakSet",
                                    "Web",
                                    "Window",
                                    "XMLHttpRequest"
                                ];
                            if (apiword.indexOf(data.token[a + 1]) < 0) {
                                news = news + 1;
                            }
                            if (options.jsscope !== "none") {
                                data.token[a] = "<strong class='new'>new</strong>";
                            }
                        }
                        if (ctoke === "from" && ltype === "end" && a > 0 && (data.token[data.begin[a - 1] - 1] === "import" || data.token[data.begin[a - 1] - 1] === ",")) {
                            level[a - 1] = -10;
                        }
                        if (ctoke === "this" && options.jsscope !== "none") {
                            data.token[a] = "<strong class='new'>this</strong>";
                        }
                        if (ctoke === "function") {
                            if (options.space === false && a < b - 1 && (data.token[a + 1] === "(" || data.token[a + 1] === "x(")) {
                                level.push(-20);
                                return;
                            }
                            level.push(-10);
                            return;
                        }
                        if ((ltype === "string" || ltype === "number") && ltoke.charAt(ltoke.length - 1) === "{" && options.brace_padding === false) {
                            level[a - 1] = -20;
                        } else if (ltoke === "-" && a > 1) {
                            if (data.types[a - 2] === "operator" || data.token[a - 2] === ",") {
                                level[a - 1] = -20;
                            } else if (data.types[a - 2] === "start") {
                                level[a - 2] = -20;
                                level[a - 1] = -20;
                            }
                        } else if (ctoke === "while" && (ltoke === "}" || ltoke === "x}")) {
                            //verify if this is a do/while block
                            let c = a - 1,
                                d = 0;
                            do {
                                if (data.token[c] === "}" || data.token[c] === "x}") {
                                    d = d + 1;
                                }
                                if (data.token[c] === "{" || data.token[c] === "x{") {
                                    d = d - 1;
                                }
                                if (d === 0) {
                                    if (data.token[c - 1] === "do") {
                                        level[a - 1] = -10;
                                        break;
                                    }
                                    level[a - 1] = indent;
                                    break;
                                }
                                c = c - 1;
                            } while (c > -1);
                        } else if (ctoke === "in" || (((ctoke === "else" && options.else_line === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                            level[a - 1] = -10;
                        } else if (ctoke === "var" || ctoke === "let" || ctoke === "const") {
                            varindex[varindex.length - 1] = a;
                            if (ltype === "end") {
                                level[a - 1] = indent;
                            }
                            if (data.token[data.begin[a] - 1] !== "for") {
                                let c:number = a + 1,
                                    d:number = 0;
                                do {
                                    if (data.types[c] === "end") {
                                        d = d - 1;
                                    }
                                    if (data.types[c] === "start") {
                                        d = d + 1;
                                    }
                                    if (d < 0 || (d === 0 && (data.token[c] === ";" || data.token[c] === ","))) {
                                        break;
                                    }
                                    c = c + 1;
                                } while (c < b);
                                if (data.token[c] === ",") {
                                    indent = indent + 1;
                                }
                            }
                            level.push(-10);
                            return;
                        }
                        if ((ctoke === "default" || ctoke === "case") && ltype !== "word" && data.stack[a] === "switch") {
                            level[a - 1] = indent - 1;
                            level.push(-10);
                            return;
                        }
                        if (ctoke === "catch" && ltoke === ".") {
                            level[a - 1] = -20;
                            level.push(-20);
                            return;
                        }
                        if (ctoke === "catch" || ctoke === "finally") {
                            level[a - 1] = -10;
                            level.push(-10);
                            return;
                        }
                        if (options.brace_padding === false && a < b - 1 && data.token[a + 1].charAt(0) === "}") {
                            level.push(-20);
                            return;
                        }
                        if (data.stack[a] === "object" && (ltoke === "{" || ltoke === ",") && (data.token[a + 1] === "(" || data.token[a + 1] === "x(")) {
                            level.push(-20);
                            return;
                        }
                        if (data.types[a - 1] === "comment" && data.token[data.begin[a]] === "(") {
                            level[a - 1] = indent + 1;
                        }
                        level.push(-10);
                    };
                if (options.language === "titanium") {
                    indent = indent - 1;
                }
                do {
                    if (data.lexer[a] === lexer) {
                        ctype = data.types[a];
                        ctoke = data.token[a];
                        if (ctype === "comment") {
                            comment();
                        } else if (ctype === "regex") {
                            level.push(-20);
                        } else if (ctype === "string") {
                            string();
                        } else if (ctype === "separator") {
                            separator();
                        } else if (ctype === "start") {
                            start();
                        } else if (ctype === "end") {
                            end();
                        } else if (ctype === "operator") {
                            operator();
                        } else if (ctype === "word") {
                            word();
                        } else if (ctype === "reference") {
                            reference();
                        } else if (ctype === "markup") {
                            markup();
                        } else if (ctype.indexOf("template") === 0) {
                            template();
                        } else if (ctype === "generic") {
                            if (ltoke !== "return" && ltoke.charAt(0) !== "#" && ltype !== "operator" && ltoke !== "public" && ltoke !== "private" && ltoke !== "static" && ltoke !== "final" && ltoke !== "implements" && ltoke !== "class" && ltoke !== "void") {
                                level[a - 1] = -20;
                            }
                            if (data.token[a + 1] === "(" || data.token[a + 1] === "x(") {
                                level.push(-20);
                            } else {
                                level.push(-10);
                            }
                        } else {
                            level.push(-10);
                        }
                        if (ctype !== "comment") {
                            ltype = ctype;
                            ltoke = ctoke;
                        }
                    } else {
                        if (data.lexer[a + 1] === lexer && (data.begin[a + 1] === data.begin[a] || data.begin[a + 1] === undefined)) {
                            level.push(a);
                        } else {
                            const skip:number = a;
                            do {
                                if (data.lexer[a] === lexer && data.begin[a] < 0) {
                                    break;
                                }
                                a = a + 1;
                            } while (a < b && (data.lexer[a + 1] !== lexer || data.begin[a + 1] >= skip));
                            level.push(a);
                        }
                    }
                    a = a + 1;
                } while (a < b);
                return level;
            }()),
            output:string = (function beautify_script_output():string {
                const build:string[] = [],
                    tab:string = (function beautify_script_output_tab():string {
                        const ch:string = options.indent_char,
                            tabby:string[] = [];
                        let index:number = options.indent_size;
                        if (typeof index !== "number" || index < 1) {
                            return "";
                        }
                        do {
                            tabby.push(ch);
                            index = index - 1;
                        } while (index > 0);
                        return tabby.join("");
                    }()),
                    lf:"\r\n"|"\n" = (options.crlf === true)
                        ? "\r\n"
                        : "\n",
                    pres:number = options.preserve + 1,
                    nl = function beautify_script_output_outnl(tabs:number):string {
                        const linesout:string[] = [],
                            total:number = (function beautify_script_output_outnl_total():number {
                                if (a === b - 1) {
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
                        return linesout.join("");
                    },
                    invisibles:string[] = ["x;", "x}", "x{", "x(", "x)"];
                let a:number = options.start,
                    external:string = "",
                    lastLevel:number = 0;
                if (options.vertical === true) {
                    const 
                    vertical = function beautify_script_output_vertical(end:number):void {
                        let longest:number = 0,
                            complex:number = 0,
                            aa:number = end - 1,
                            bb:number = 0,
                            cc:number = 0;
                        const begin:number = data.begin[a],
                            list:[number, number][] = [];
                        do {
                            if ((data.begin[aa] === begin || data.token[aa] === "]" || data.token[aa] === ")") && ((data.token[aa + 1] === ":" && data.stack[aa] === "object") || data.token[aa + 1] === "=")) {
                                bb = aa;
                                complex = 0;
                                do {
                                    if (data.begin[bb] === begin) {
                                        if (data.token[bb] === "," || data.token[bb] === ";" || data.token[bb] === "x;" || levels[bb] > -1) {
                                            if (data.token[bb + 1] === ".") {
                                                complex = complex + (options.indent_size * options.indent_char.length);
                                            }
                                            break;
                                        }
                                    } else if (levels[bb] > -1) {
                                        break;
                                    }
                                    if (data.types[bb] !== "comment") {
                                        if (levels[bb - 1] === -10) {
                                            complex = complex + 1;
                                        }
                                        complex = data.token[bb].length + complex;
                                    }
                                    bb = bb - 1;
                                } while (bb > begin);
                                cc = bb;
                                if (data.token[cc] === "," && data.token[aa + 1] === "=") {
                                    do {
                                        if (data.types[cc] === "end") {
                                            cc = data.begin[cc];
                                        }
                                        if (data.begin[cc] === begin) {
                                            if (data.token[cc] === ";" || data.token[cc] === "x;") {
                                                break;
                                            }
                                            if (data.token[cc] === "var" || data.token[cc] === "const" || data.token[cc] === "let") {
                                                complex = complex + (options.indent_size * options.indent_char.length);
                                                break;
                                            }
                                        }
                                        cc = cc - 1;
                                    } while (cc > begin);
                                }
                                if (complex > longest) {
                                    longest = complex;
                                }
                                list.push([aa, complex]);
                                aa = bb;
                            } else if (data.types[aa] === "end") {
                                aa = data.begin[aa];
                            }
                            aa = aa - 1;
                        } while (aa > begin);
                        aa = list.length;
                        if (aa > 0) {
                            do {
                                aa = aa - 1;
                                bb = list[aa][1];
                                if (bb < longest) {
                                    do {
                                        data.token[list[aa][0]] = data.token[list[aa][0]] + " ";
                                        bb = bb + 1;
                                    } while (bb < longest);
                                }
                            } while (aa > 0);
                        }
                    };
                    a = b - 1;
                    do {
                        a = a - 1;
                        if (data.lexer[a] === "script") {
                            if (data.token[a] === "}" && data.token[a - 1] !== "{") {
                                vertical(a);
                            }
                        } else {
                            a = data.begin[a];
                        }
                    } while (a > 0);
                }
                if (options.jsscope !== "none" && options.language === "javascript") {
                    let linecount:number          = 1,
                        last:string               = "",
                        scope:number              = 0,
                        scoped:boolean[] = [],
                        indent:number             = options.indent_level,
                        foldindex:[number, number][] = [];
                    const code:string[] = [],
                        foldstart = function beautify_script_output_scope_foldstart():void {
                            let index:number = code.length;
                            do {
                                index = index - 1;
                            } while (index > 0 && code[index] !== "<li>");
                            if (code[index] === "<li>") {
                                code[index] = `<li class="fold" title="folds from line ${linecount} to line xxx">`;
                                code[index + 1] = `-${code[index + 1]}`;
                                foldindex.push([index, a]);
                            }
                        },
                        foldend = function beautify_script_output_scope_foldend():void {
                            const lastfold:[number, number] = foldindex[foldindex.length - 1];
                            if (data.types[a] === "end" && lastfold[1] === data.begin[a]) {
                                code[lastfold[0]] = code[lastfold[0]].replace("xxx", String(linecount));
                                foldindex.pop();
                            } else if (data.types[a - 1] === "comment") {
                                let endfold:number = (a === b - 1)
                                    ? linecount
                                    : linecount - 1;
                                code[lastfold[0]] = code[lastfold[0]].replace("xxx", String(endfold));
                                foldindex.pop();
                            }
                        },
                        reference = function beautify_script_output_scope_reference():void {
                            let i:number = 0,
                                s:number = scopes.length - 1;
                            const applyScope = function beautify_script_output_scope_reference_applyScope(scopeValue:number, token:string):void {
                                // applyScope function exists to prevent presenting spaces as part of reference names if option 'vertical' is set to true
                                const spaceIndex:number = token.indexOf(" ");
                                let space:string = "";
                                if (spaceIndex > 0) {
                                    space = token.slice(spaceIndex);
                                    token = token.slice(0, spaceIndex);
                                }
                                build.push(`<em class="s${scopeValue}">${token}</em>${space}`);
                            };
                            if (scopes.length < 1) {
                                return;
                            }
                            if (data.stack[a] === "arguments") {
                                if (scopes[s - 1][1] > a) {
                                    do {
                                        s = s - 1;
                                    } while (s > 0 && scopes[s][1] > a);
                                }
                                do {
                                    if (scopes[s][1] === a) {
                                        scopes[s][2] = scope + 1;
                                        break;
                                    }
                                    s = s - 1;
                                } while (s > -1);
                                build.push(`<em class="s${scope + 1}">${data.token[a]}</em>`);
                                return;
                            }
                            if (data.stack[a + 2] === "arguments" || data.token[a - 1] === "let" || data.token[a - 1] === "const" || data.token[a - 1] === "var") {
                                if (s > 0 && scopes[s - 1][1] > a) {
                                    do {
                                        s = s - 1;
                                    } while (s > 0 && scopes[s][1] > a);
                                }
                                do {
                                    if (scopes[s][1] === a) {
                                        scopes[s][2] = scope;
                                        break;
                                    }
                                    s = s - 1;
                                } while (s > -1);
                                applyScope(scope, data.token[a]);
                                return;
                            }
                            if (s > 0 && scopes[s - 1][1] > a) {
                                do {
                                    s = s - 1;
                                } while (s > 0 && scopes[s][1] > a);
                            }
                            if (scopes[s][0] === data.token[a]) {
                                if (scopes[s][2] === -10) {
                                    applyScope(scope, data.token[a]);
                                    scopes[s][2] = scope;
                                } else {
                                    applyScope(scopes[s][2], data.token[a]);
                                }
                                return;
                            }
                            do {
                                s = s - 1;
                                if (scopes[s][0] === data.token[a]) {
                                    i = scopes[s][1];
                                    if (i === -1) {
                                        applyScope(0, data.token[a]);
                                    } else if (i === data.begin[a]) {
                                        applyScope(scope, data.token[a]);
                                    } else if (scopes[s].length < 3) {
                                        applyScope(scope, data.token[a]);
                                        scopes[s].push(scope);
                                    } else {
                                        applyScope(scopes[s][2], data.token[a]);
                                    }
                                    return;
                                }
                            } while (s > 0);
                            build.push(data.token[a]);
                        },
                        // splits block comments, which are single tokens, into multiple lines of output
                        blockline          = function beautify_script_output_scope_blockline(x:string):void {
                            const commentLines:string[] = x.split(lf),
                                ii:number           = commentLines.length - 1;
                            let hh:number           = 0;
                            if (levels[a] > 0) {
                                do {
                                    commentLines[0] = tab + commentLines[0];
                                    hh = hh + 1;
                                } while (hh < levels[a]);
                                hh = 0;
                            }
                            if (a === 0) {
                                build.push(`${commentLines[hh]}`);
                                hh = 1;
                            }
                            if (hh < ii) {
                                do {
                                    linecount = linecount + 1;
                                    code.push("<li>");
                                    code.push(String(linecount));
                                    code.push("</li>");
                                    build.push(`<em class="line">&#xA;</em></li><li class="c0">${commentLines[hh]}`);
                                    hh = hh + 1;
                                } while (hh < ii);
                            }
                        },
                        //a function for calculating indentation after each new line
                        nlscope            = function beautify_script_output_scope_nlscope(x:number):void {
                            let dd = 0;
                            const total:number = (function beautify_script_output_outnl_total():number {
                                    if (a === b - 1) {
                                        return 0;
                                    }
                                    if (data.lines[a + 1] - 1 > pres) {
                                        return pres - 1;
                                    }
                                    if (data.lines[a + 1] > 1) {
                                        return data.lines[a + 1] - 2;
                                    }
                                    return 0;
                                }()),
                                scopepush = function beautify_script_output_scope_nlscope_scopepush():void {
                                    let aa:number = 0,
                                        bb:number = 0;
                                    if (x > 0) {
                                        do {
                                            build.push(`<span class="l${bb}">${tab}</span>`);
                                            if (scoped[aa] === true) {
                                                bb = bb + 1;
                                            }
                                            aa = aa + 1;
                                        } while (aa < x);
                                    }
                                };
                            if (data.token[a] !== "x}" || (data.token[a] === "x}" && data.token[a + 1] !== "}")) {
                                let index:number = 0;
                                if (total > 0) {
                                    do {
                                        linecount = linecount + 1;
                                        code.push("<li>");
                                        code.push(String(linecount));
                                        code.push("</li>");
                                        build.push(`<em class="line">&#xA;</em></li><li class="s0">`);
                                        index = index + 1;
                                    } while (index < total);
                                }
                                linecount = linecount + 1;
                                code.push("<li>");
                                code.push(String(linecount));
                                code.push("</li>");
                                if (a < b - 1 && data.types[a + 1] === "comment") {
                                    build.push(`<em class="line">&#xA;</em></li><li class="c0">`);
                                    do {
                                        build.push(tab);
                                        dd = dd + 1;
                                    } while (dd < levels[a]);
                                } else {
                                    if (data.token[a + 1] === "}" && data.stack[a + 1] !== "object" && data.stack[a + 1] !== "class") {
                                        build.push(`<em class="line">&#xA;</em></li><li class="l${scope - 1}">`);
                                    } else {
                                        build.push(`<em class="line">&#xA;</em></li><li class="l${scope}">`);
                                    }
                                    scopepush();
                                }
                            } else {
                                scopepush();
                            }
                        },
                        multiline          = function beautify_script_output_scope_multiline(x:string):void {
                            const temparray:string[] = x.split(lf),
                                d:number         = temparray.length;
                            let c:number         = 1;
                            build.push(temparray[0]);
                            do {
                                nlscope(indent);
                                build.push(temparray[c]);
                                c = c + 1;
                            } while (c < d);
                        };
                    code.push("<div class=\"beautify\" data-prettydiff-ignore=\"true\"><ol class=\"count\">");
                    code.push("<li>");
                    code.push("1");
                    code.push("</li>");
                    if (data.types[a] === "comment" && data.token[a].indexOf("/*") === 0) {
                        build.push("<ol class=\"data\"><li class=\"c0\">");
                    } else {
                        build.push("<ol class=\"data\"><li>");
                    }
                    if (indent > 0) {
                        do {
                            build.push(tab);
                            a = a + 1;
                        } while (a < indent);
                    }
                    scope = 0;
                    // this loops combines the white space as determined from the algorithm with the
                    // tokens to create the output
                    a = 0;
                    do {
                        if (levels[a] > -1 && a < b - 1) {
                            if (levels[a] < scoped.length) {
                                do {
                                    scoped.pop();
                                } while (levels[a] < scoped.length);
                            }
                        }
                        if (data.types[a] === "comment" && data.token[a].indexOf("/*") === 0) {
                            blockline(data.token[a]);
                        } else if (invisibles.indexOf(data.token[a]) < 0) {
                            if (data.types[a] === "start" && (levels[a] > -1 || data.types[a + 1] === "comment")) {
                                foldstart();
                            } else if (data.token[a].indexOf("//") === 0 && a < b - 1 && data.token[a + 1].indexOf("//") === 0 && data.token[a - 1].indexOf("//") !== 0 && levels[a - 1] > -1) {
                                foldstart();
                            } else if (foldindex.length > 0) {
                                if (data.types[a] === "end") {
                                    foldend();
                                } else if ((data.token[a].indexOf("//") !== 0 || a === b - 1) && data.token[foldindex[foldindex.length - 1][1]].indexOf("//") === 0) {
                                    foldend();
                                }
                            }
                            if (data.types[a] === "reference") {
                                reference();
                            } else if (data.token[a] === "{") {
                                if (data.stack[a + 1] === "object" || data.stack[a + 1] === "class") {
                                    scoped.push(false);
                                    build.push("{");
                                } else {
                                    if (scoped.length === levels[a]) {
                                        if (scoped[scoped.length - 1] === false) {
                                            scoped[scoped.length - 1] = true;
                                            scope = scope + 1;
                                        }
                                    } else {
                                        scoped.push(true);
                                        scope = scope + 1;
                                    }
                                    build.push(`<em class="s${scope}">{</em>`);
                                }
                                if (levels[a] > scoped.length) {
                                    do {
                                        scoped.push(false);
                                    } while (levels[a] > scoped.length);
                                }
                            } else if (data.token[a] === "}") {
                                if (data.stack[a] === "object" || data.stack[a] === "class") {
                                    build.push("}");
                                } else {
                                    build.push(`<em class="s${scope}">}</em>`);
                                    scope = scope - 1;
                                }
                            } else {
                                if (data.types[a] === "string" && data.token[a].indexOf("\n") > 0) {
                                    multiline(data.token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                } else if (data.types[a] === "operator" || data.types[a] === "comment" || data.types[a] === "string" || data.types[a] === "regex") {
                                    build.push(data.token[a].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
                                } else {
                                    if (data.types[a] === "start" && levels[a] > -1) {
                                        scoped.push(false);
                                    }
                                    build.push(data.token[a]);
                                }
                            }
                        }
                        if (levels[a] === -10) {
                            build.push(" ");
                        } else if (levels[a] > -1 && a < b - 1 && data.token[a + 1].slice(0, 2) !== "/*") {
                            if (levels[a] > scoped.length) {
                                do {
                                    scoped.push(false);
                                } while (levels[a] > scoped.length);
                            }
                            if (((levels[a] > -1 && data.token[a] === "{") || (levels[a] > -1 && data.token[a + 1] === "}")) && data.lines[a] < 3 && options.brace_line === true) {
                                nlscope(levels[a]);
                            }
                            nlscope(levels[a]);
                        }
                        a = a + 1;
                    } while (a < b);
                    a = build.length - 1;
                    do {
                        if (build[a] === tab) {
                            build.pop();
                        } else {
                            break;
                        }
                        a = a - 1;
                    } while (a > -1);
                    //this logic is necessary to some line counting corrections to the HTML output
                    last = build[build.length - 1];
                    if (last.indexOf("<li") > 0) {
                        build[build.length - 1] = "<em class=\"line\">&#xA;</em></li>";
                    } else if (last.indexOf("</li>") < 0) {
                        build.push("<em class=\"line\">&#xA;</em></li>");
                    }
                    build.push("</ol></div>");
                    last = build.join("");
                    if (last.match(/<li/g) !== null) {
                        scope = last
                            .match(/<li/g)
                            .length;
                        if (linecount - 1 > scope) {
                            linecount = linecount - 1;
                            do {
                                code.pop();
                                code.pop();
                                code.pop();
                                linecount = linecount - 1;
                            } while (linecount > scope);
                        }
                    }
                    code.push("</ol>");
                    code.push(last);
                    if (options.new_line === true) {
                        code.push(lf);
                    }
                    return [
                        "<p>Scope analysis does not provide support for undeclared variables.</p>",
                        "<p><em>",
                        scolon,
                        "</em> instances of <strong>missing semicolons</strong> counted.</p>",
                        "<p><em>",
                        news,
                        "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>",
                        code.join("")
                    ].join("").replace(/(\s+)$/, "").replace(options.binary_check, "");
                }
                a = options.start;
                do {
                    if (data.lexer[a] === lexer || prettydiff.beautify[data.lexer[a]] === undefined) {
                        if (invisibles.indexOf(data.token[a]) < 0) {
                            build.push(data.token[a]);
                        }
                        if (data.lexer[a + 1] !== lexer && data.begin[a] === data.begin[a + 1] && data.types[a + 1].indexOf("end") < 0) {
                            build.push(" ");
                        } else if (levels[a] > -1) {
                            if (((levels[a] > -1 && data.token[a] === "{") || (levels[a] > -1 && data.token[a + 1] === "}")) && data.lines[a] < 3 && options.brace_line === true) {
                                build.push(nl(0));
                            }
                            lastLevel = levels[a];
                            build.push(nl(levels[a]));
                        } else if (levels[a] === -10) {
                            build.push(" ");
                            if (data.lexer[a + 1] !== lexer) {
                                lastLevel = lastLevel + 1;
                            }
                        }
                    } else {
                        if (data.types[a - 1] !== "operator" && data.token[a - 1] !== "return") {
                            build.push(nl(lastLevel + 1));
                        }
                        if (levels[a] - a < 1) {
                            build.push(data.token[a]);
                        } else {
                            options.end = levels[a] + 1;
                            options.indent_level = lastLevel + 1;
                            options.start = a;
                            external = prettydiff.beautify[data.lexer[a]](options).replace(/\s+$/, "");
                            build.push(external);
                            a = levels[a];
                            if (data.token[a + 1] === ")") {
                                build.push(nl(lastLevel));
                            }
                        }
                    }
                    a = a + 1;
                } while (a < b);
                if (options.new_line === true && options.end === data.token.length) {
                    build.push(lf);
                }
                return build.join("");
            }());
        return output;
    };
    global.prettydiff.beautify.script = script;
}());