(function beautify_script_init():void {
    "use strict";
    const script = function beautify_script(options:any):string {
        (function beautify_script_options() {
            let styleguide = {
                    airbnb: function beautify_script_options_styleairbnb() {
                        options.bracepadding = true;
                        options.correct      = true;
                        options.endcomma     = "always";
                        options.inchar       = " ";
                        options.insize       = 2;
                        options.preserve     = 1;
                        options.quoteConvert = "single";
                        options.varword      = "each";
                        options.wrap         = 80;
                    },
                    crockford: function beautify_script_options_stylecrockford() {
                        options.bracepadding  = false;
                        options.correct       = true;
                        options.elseline      = false;
                        options.endcomma      = "never";
                        options.inchar        = " ";
                        options.insize        = 4;
                        options.nocaseindent  = true;
                        options.nochainindent = false;
                        options.space         = true;
                        options.varword       = "each";
                        options.vertical            = false;
                    },
                    google: function beautify_script_options_stylegoogle() {
                        options.correct      = true;
                        options.inchar       = " ";
                        options.insize       = 4;
                        options.preserve     = 1;
                        options.quoteConvert = "single";
                        options.vertical           = false;
                        options.wrap         = -1;
                    },
                    jquery: function beautify_script_options_stylejquery() {
                        options.bracepadding = true;
                        options.correct      = true;
                        options.inchar       = "\u0009";
                        options.insize       = 1;
                        options.quoteConvert = "double";
                        options.varword      = "each";
                        options.wrap         = 80;
                    },
                    jslint: function beautify_script_options_stylejslint() {
                        options.bracepadding  = false;
                        options.correct       = true;
                        options.elseline      = false;
                        options.endcomma      = "never";
                        options.inchar        = " ";
                        options.insize        = 4;
                        options.nocaseindent  = true;
                        options.nochainindent = false;
                        options.space         = true;
                        options.varword       = "each";
                        options.vertical            = false;
                    },
                    mrdoobs: function beautify_script_options_stylemrdoobs() {
                        options.braceline    = true;
                        options.bracepadding = true;
                        options.correct      = true;
                        options.inchar       = "\u0009";
                        options.insize       = 1;
                        options.vertical           = false;
                    },
                    mediawiki: function beautify_script_options_stylemediawiki() {
                        options.bracepadding = true;
                        options.correct      = true;
                        options.inchar       = "\u0009";
                        options.insize       = 1;
                        options.preserve     = 1;
                        options.quoteConvert = "single";
                        options.space        = false;
                        options.wrap         = 80;
                    },
                    meteor: function beautify_script_options_stylemeteor() {
                        options.correct = true;
                        options.inchar  = " ";
                        options.insize  = 2;
                        options.wrap    = 80;
                    },
                    yandex: function beautify_script_options_styleyandex() {
                        options.bracepadding = false;
                        options.correct      = true;
                        options.quoteConvert = "single";
                        options.varword      = "each";
                        options.vertical           = false;
                    }
                },
                brace_style = {
                    collapse: function beautify_brace_options_collapse() {
                        options.braceline    = false;
                        options.bracepadding = false;
                        options.braces       = false;
                        options.formatObject = "indent";
                        options.neverflatten = true;
                    },
                    "collapse-preserve-inline": function beautify_brace_options_collapseInline() {
                        options.braceline    = false;
                        options.bracepadding = true;
                        options.braces       = false;
                        options.formatObject = "inline";
                        options.neverflatten = false;
                    },
                    expand: function beautify_brace_options_expand() {
                        options.braceline    = false;
                        options.bracepadding = false;
                        options.braces       = true;
                        options.formatObject = "indent";
                        options.neverflatten = true;
                    }
                };
            if (styleguide[options.styleguide] !== undefined) {
                styleguide[options.styleguide]();
            }
            if (brace_style[options.brace_style] !== undefined) {
                brace_style[options.brace_style]();
            }
            if (options.lang === "json") {
                options.wrap = 0;
            } else if (options.lang === "titanium") {
                options.correct = false;
            }
        }());
        let scolon:number = 0,
            news:number = 0;
        const data:parsedArray = options.parsed,
            markupvar:number[] = [],
            globals:string[] = [],
            meta:any = [],
            levels:number[] = (function beautify_script_level():number[] {
                let a             = 0, //will store the current level of indentation
                    b:number = data.token.length,
                    indent:number        = (isNaN(options.inlevel) === true)
                        ? 0
                        : Number(options.inlevel),
                    lastlist:boolean      = false, //remembers the list status of the most recently closed block
                    ctype:string         = "", //ctype stands for "current type"
                    ctoke:string         = "", //ctoke standa for "current token"
                    ltype:string         = data.types[0], //ltype stands for "last type"
                    ltoke:string         = data.token[0], //ltype stands for "last token"
                    lettest:number       = -1;
                const list:boolean[]          = [], //stores comma status of current block
                    level:number[] = [],
                    ternary:number[]       = [], //used to identify ternary statments
                    varline       = [], //determines if a current list of the given block is a list of variables following the "var" keyword
                    varlist       = [],
                    varlen        = [
                        []
                    ], //stores lists of variables, assignments, and object properties for white space padding
                    extraindent   = [
                        []
                    ], //stores token indexes where extra indentation occurs from ternaries and broken method chains
                    arrbreak:boolean[]      = [], //array where a method break has occurred
                    destruct:boolean[]      = [], //attempt to identify object destructuring
                    itemcount:number[]     = [], //counts items in destructured lists
                    assignlist:boolean[]    = [false], //are you in a list right now?
                    wordlist:boolean[]      = [],
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
                        if (destruct[destruct.length - 1] === false || (data.stack[a] === "array" && options.formatArray === "inline") || (data.stack[a] === "object" && options.formatObject === "inline")) {
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
                    strwrap       = function beautify_script_strwrap(offset:number):void {
                        let aa:number        = 0,
                            bb:number        = 0,
                            cc:number        = 0,
                            dd:number        = 0,
                            ee:number        = 0,
                            ff:number        = 0,
                            x:number         = 0,
                            str:string       = "",
                            bgn:number       = data.begin[a],
                            dep:string       = data.stack[a],
                            item:string      = data.token[a],
                            ind:number       = 0,
                            off:boolean       = false;
                        const ei:number[]        = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            lin:number       = data.lines[a],
                            wrap:number      = options.wrap - 2,
                            paren:boolean     = data.token[a + 1] === ".",
                            uchar:RegExp     = (/u[0-9a-fA-F]{4}/),
                            xchar:RegExp     = (/x[0-9a-fA-F]{2}/),
                            qchar:string     = item.charAt(0),
                            slash     = function beautify_script_strwrap_slash(trim:number, entity:boolean):void {
                                let dist = 0;
                                if (entity === true) {
                                    ff = trim;
                                }
                                do {
                                    dist = dist + 1;
                                } while (item.charAt(cc - (trim + dist)) === "\\" && dist < cc);
                                if (entity === false) {
                                    cc = cc - dist;
                                    ff = ff + dist;
                                } else if (dist % 2 === 1) {
                                    cc = cc - ff;
                                } else {
                                    ff = 0;
                                }
                            },
                            parenpush = function beautify_script_strwrap_parenpush():void {
                                data.token.splice(a, 0, "(");
                                data.types.splice(a, 0, "start");
                                data.lines.splice(a, 0, lin);
                                data.stack.splice(a, 0, "paren");
                                data.begin.splice(a, 0, a);
                                level.push(indent + 1);
                                bgn = a;
                                dep = "paren";
                                a   = a + 1;
                                b   = b + 1;
                                x   = x + 1;
                            },
                            tokenpush = function beautify_script_strwrap_tokenpush(toke:string, type:string):void {
                                data.token.splice(a, 0, toke);
                                data.types.splice(a, 0, type);
                                data.lines.splice(a, 0, lin);
                                data.stack.splice(a, 0, dep);
                                data.begin.splice(a, 0, bgn);
                                if (toke === "+") {
                                    level.push(ind);
                                } else if (toke === ")") {
                                    level.push(indent);
                                    level[a - 1] = indent;
                                } else {
                                    level.push(-10);
                                }
                                a = a + 1;
                                b = b + 1;
                                x = x + 1;
                            };
                        ind = (data.token[data.begin[a]] === "(" && (list[list.length - 1] === true || ei.length > 0))
                            ? indent + 3
                            : indent + 2;
                        aa = a;
                        do {
                            aa = aa - 1;
                            if (aa === data.begin[a] && data.token[aa] === "(") {
                                break;
                            }
                        } while (aa > 0 && level[aa - 1] < -9);
                        if (ltoke === "(") {
                            level[a - 1] = indent + 1;
                        }
                        if (data.token[aa] === "." && data.token[data.begin[a]] !== "(") {
                            ind = ind + 1;
                        }
                        if (data.token[data.begin[a]] === "(" && list[list.length - 1] === false && data.token[aa] !== "?" && data.token[aa] !== ":") {
                            ind = indent + 1;
                        }
                        if (paren === true && data.token[aa] !== "?" && data.token[aa] !== ":") {
                            ind = indent + 1;
                        }
                        if (offset > 1 && item.length > offset) {
                            off = true;
                            if (item.charAt(offset - 5) === "\\" && uchar.test(item.slice(offset - 4, offset + 1)) === true) {
                                str  = item.slice(0, offset - 5) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 5);
                            } else if (item.charAt(offset - 4) === "\\" && uchar.test(item.slice(offset - 3, offset + 2)) === true) {
                                str  = item.slice(0, offset - 4) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 4);
                            } else if (item.charAt(offset - 3) === "\\" && (uchar.test(item.slice(offset - 2, offset + 3)) === true || xchar.test(item.slice(offset - 2, offset + 1)) === true)) {
                                str  = item.slice(0, offset - 3) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 3);
                            } else if (item.charAt(offset - 2) === "\\" && (uchar.test(item.slice(offset - 1, offset + 4)) === true || xchar.test(item.slice(offset - 1, offset + 2)) === true)) {
                                str  = item.slice(0, offset - 2) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 2);
                            } else if (item.charAt(offset - 1) === "\\") {
                                str  = item.slice(0, offset - 1) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset - 1);
                            } else {
                                str  = item.slice(0, offset) + item.charAt(0);
                                item = item.charAt(0) + item.slice(offset);
                            }
                            if (str.charAt(str.length - 2) === "\\") {
                                str = str + str.charAt(0);
                            }
                            tokenpush(str, "literal");
                            tokenpush("+", "operator");
                        }
                        if (item.length > wrap) {
                            if (data.stack[a] === "object" || data.stack[a] === "array") {
                                destructfix(true, false);
                            }
                            if (off === false && paren === true) {
                                parenpush();
                            }
                            data.begin.splice(a, 1);
                            data.lexer.splice(a, 1);
                            data.lines.splice(a, 1);
                            data.presv.splice(a, 1);
                            data.stack.splice(a, 1);
                            data.token.splice(a, 1);
                            data.types.splice(a, 1);
                            b    = b - 1;
                            item = item.slice(1, item.length - 1);
                            bb   = Math.floor(item.length / wrap) * wrap;
                            aa = 0;
                            do {
                                cc = aa + wrap + dd;
                                if (item.charAt(cc - 5) === "\\" && uchar.test(item.slice(cc - 4, cc + 1)) === true) {
                                    slash(5, true);
                                } else if (item.charAt(cc - 4) === "\\" && uchar.test(item.slice(cc - 3, cc + 2)) === true) {
                                    slash(4, true);
                                } else if (item.charAt(cc - 3) === "\\" && (uchar.test(item.slice(cc - 2, cc + 3)) === true || xchar.test(item.slice(cc - 2, cc + 1)) === true)) {
                                    slash(3, true);
                                } else if (item.charAt(cc - 2) === "\\" && (uchar.test(item.slice(cc - 1, cc + 4)) === true || xchar.test(item.slice(cc - 1, cc + 2)) === true)) {
                                    slash(2, true);
                                } else if (item.charAt(cc - 1) === "\\") {
                                    slash(1, true);
                                } else {
                                    ff = 0;
                                }
                                if (item.charAt(cc - 1) === "\\") {
                                    slash(1, false);
                                }
                                if (aa > 0 && dd < 0) {
                                    aa = aa - 1;
                                    dd = 0;
                                }
                                if (item.charAt(cc - 1) === "\\") {
                                    str = qchar + item.slice(ee, cc - 1) + qchar;
                                    ee  = cc - 1;
                                    aa  = aa - 1;
                                } else {
                                    str = qchar + item.slice(ee, cc) + qchar;
                                    ee  = cc;
                                }
                                if (item.charAt(cc) === "\\") {
                                    aa = aa - ff;
                                }
                                tokenpush(str, "literal");
                                if (aa < item.length - wrap) {
                                    tokenpush("+", "operator");
                                }
                                aa = aa + wrap;
                            } while (aa < bb);
                            if (aa < item.length) {
                                tokenpush(qchar + item.slice(aa, aa + wrap) + qchar, "literal");
                            }
                            if (paren === true) {
                                tokenpush(")", "end");
                            }
                            a  = a - 1;
                            x  = x - 1;
                            aa = a + 1;
                            do {
                                aa = aa + 1;
                                if (data.types[aa - 1] === "start") {
                                    data.begin[aa - 1] = (aa - 1);
                                } else if (data.begin[aa - 1] > bgn) {
                                    data.begin[aa - 1] = data.begin[aa - 1] + x;
                                }
                            } while (aa < b);
                            ctoke = data.token[a];
                            ctype = data.types[a];
                            ltoke = data.token[a - 1];
                            ltype = data.types[a - 1];
                        } else {
                            if (off === true) {
                                aa = a;
                                do {
                                    aa = aa + 1;
                                    if (data.types[aa - 1] === "start") {
                                        data.begin[aa - 1] = (aa - 1);
                                    } else if (data.begin[aa - 1] > bgn) {
                                        data.begin[aa - 1] = data.begin[aa - 1] + x;
                                    }
                                } while (aa < b);
                            }
                            data.token[a] = item;
                            level.push(-10);
                        }
                        ctoke = data.token[a];
                        ctype = "string";
                    },
                    literal       = function beautify_script_literal():void {
                        if (ctoke.indexOf("#!/") === 0) {
                            level.push(indent);
                        } else {
                            if (ctoke.charAt(0) === "}") {
                                level[a - 1] = -20;
                            }
                            if (options.bracepadding === true && ctoke.charAt(0) === "}" && ctoke.charAt(ctoke.length - 1) === "`") {
                                level[a - 1] = -10;
                            }
                            if (options.wrap > 0 && ctoke.length > options.wrap && (ctoke.charAt(0) === "\"" || ctoke.charAt(0) === "'")) {
                                strwrap(0);
                            } else {
                                level.push(-10);
                            }
                        }
                        if ((ltoke === "," || ltype === "start") && (data.stack[a] === "object" || data.stack[a] === "array") && destruct[destruct.length - 1] === false && a > 0) {
                            level[a - 1] = indent;
                        }
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
                    comment       = function beautify_script_comment():void {
                        destructfix(false, false);
                        if (data.token[a - 1] === ",") {
                            level[a - 1] = indent;
                        } else if (data.lines[a - 1] === 0 && data.types[a - 1] !== "comment") {
                            level[a - 1] = -20;
                        } else if (ltoke === "=" && (/^(\/\*\*\s*@[a-z_]+\s)/).test(ctoke) === true) {
                            level[a - 1] = -10;
                        } else {
                            level[a - 1] = indent;
                        }
                        level.push(indent);
                    },
                    commentInline = function beautify_script_commentInline():void {
                        destructfix(false, false);
                        if (a < b - 1 && data.stack[a + 1] !== "block" && (data.token[a + 1] === "{" || data.token[a + 1] === "x{")) {
                            data.token[a]     = data.token[a + 1];
                            data.types[a]     = "start";
                            data.stack[a]     = data.stack[a + 1];
                            data.begin[a]     = data.begin[a + 1];
                            data.lines[a]     = data.lines[a + 1];
                            data.token[a + 1] = ctoke;
                            data.types[a + 1] = ctype;
                            a            = a - 1;
                        } else {
                            level[a - 1] = -10;
                            if (data.stack[a] === "paren" || data.stack[a] === "method") {
                                level.push(indent + 2);
                            } else {
                                level.push(indent);
                            }
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
                        if (varline[varline.length - 1] === true) {
                            markupvar.push(a);
                        }
                    },
                    separator     = function beautify_script_separator():void {
                        let methtest:boolean      = false;
                        const ei:number[]           = (extraindent[extraindent.length - 1] === undefined)
                                ? []
                                : extraindent[extraindent.length - 1],
                            propertybreak = function beautify_script_separator_propertybreak():void {
                                let c:number = a - 2,
                                    d:number = data.begin[a],
                                    e:number = 1;
                                if (ctoke === "." && ltype !== "end" && data.types[a + 2] !== "start") {
                                    level[a - 1] = -20;
                                    return;
                                }
                                do {
                                    if (data.begin[c] === d) {
                                        if (data.token[c] === ".") {
                                            e = e + 1;
                                        }
                                        if (data.token[c] === ";" || data.token[c] === "," || data.types[c] === "operator" || data.token[c] === "return" || data.token[c] === "break" || data.token[c] === "continue" || data.types[c] === "comment") {
                                            break;
                                        }
                                        if (data.types[c - 1] === "end") {
                                            if (data.types[c] !== "start" && data.types[c] !== "operator" && data.token[c] !== ".") {
                                                break;
                                            }
                                            c = data.begin[c - 1];
                                        }
                                    }
                                    c = c - 1;
                                } while (c > d);
                                if (e < 2) {
                                    level[a - 1] = -20;
                                    return;
                                }
                                indent = indent + 1;
                                if (data.token[c] !== ".") {
                                    do {
                                        c = c + 1;
                                    } while (c < a && (data.token[c] !== "." || data.begin[c] !== d));
                                }
                                e = c;
                                do {
                                    if (data.token[e] === "." && data.begin[e] === d) {
                                        level[e - 1] = indent;
                                    } else if (level[e] > -9) {
                                        level[e] = level[e] + 1;
                                    }
                                    e = e + 1;
                                } while (e < a);
                                level[a - 1] = indent;
                                ei.push(a);
                            };
                        if (ctoke === "::") {
                            level[a - 1] = -20;
                            level.push(-20);
                            return;
                        }
                        if ((options.methodchain === "chain" || options.methodchain === "none") && data.lines[a] < 2 && data.types[a - 1] === "comment" && a > 1) {
                            let c:number    = a,
                                d:number    = b;
                            const last:string = data.token[a - 1];
                            level[a - 2] = -20;
                            level[a - 1] = -20;
                            do {
                                data.token[c - 1] = data.token[c];
                                data.types[c - 1] = data.types[c];
                                if (data.token[c] === ";" || data.token[c] === "x;" || data.token[c] === "{" || data.token[c] === "x{" || data.lines[c] > 0) {
                                    data.token[c] = last;
                                    data.types[c] = "comment";
                                    a        = a - 1;
                                    break;
                                }
                                c = c + 1;
                            } while (c < d);
                            data.token[c - 1] = last;
                            data.types[c - 1] = "comment";
                            a            = a - 1;
                        }
                        if (ctoke === ".") {
                            if (data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(" && ei.length > 0) {
                                if (data.stack[a] === "object" || data.stack[a] === "array") {
                                    destructfix(true, false);
                                } else {
                                    destructfix(false, false);
                                }
                            }
                            if (data.types[a - 1] === "comment") {
                                if (ei[ei.length - 1] > 0) {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = indent + 1;
                                }
                            } else if (
                                (options.methodchain === "chain" || (options.methodchain === "none" && data.lines[a] < 1)) &&
                                data.types[a - 1] !== "comment"
                            ) {
                                level[a - 1] = -20;
                            } else {
                                if (data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(" && (data.types[a + 2] === "start" || ltoke === ")" || (data.token[ei[ei.length - 1]] !== "."))) {
                                    if (data.token[ei[ei.length - 1]] !== "." && options.nochainindent === false) {
                                        propertybreak();
                                    } else {
                                        level[a - 1] = indent + 1;
                                    }
                                } else if (data.token[ei[ei.length - 1]] === ".") {
                                    level[a - 1] = indent + 1;
                                } else {
                                    level[a - 1] = -20;
                                }
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
                            if ((data.token[data.begin[a]] === "(" || data.token[data.begin[a]] === "x(") && options.lang !== "jsx" && data.stack[a] !== "global" && (data.types[a - 1] !== "literal" || data.token[a - 2] !== "+" || (data.types[a - 1] === "literal" && data.token[a - 2] === "+" && data.types[a - 3] !== "literal"))) {
                                level.push(-10);
                                return;
                            }
                            if (ltype === "word" && data.types[a - 2] === "word" && "var-let-const-from".indexOf(data.token[a - 2]) < 0 && (data.types[a - 3] === "end" || data.token[a - 3] === ";")) {
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
                                if (destruct[destruct.length - 1] === true && data.types[data.begin[a] - 1] !== "word" && data.token[data.begin[a] - 1] !== "(" && data.token[data.begin[a] - 1] !== "x(") {
                                    let aa:number = a - 1,
                                        bb:number = 0;
                                    do {
                                        if (data.types[aa] === "end") {
                                            bb = bb + 1;
                                        } else if (data.types[aa] === "start") {
                                            bb = bb - 1;
                                        }
                                        if (bb < 0 || (bb === 0 && data.token[aa] === ",")) {
                                            break;
                                        }
                                        if (bb === 0 && data.token[aa] === ":") {
                                            destructfix(true, false);
                                            break;
                                        }
                                        aa = aa - 1;
                                    } while (aa > -1);
                                }
                            }
                            if (data.types[a - 1] === "word" && data.token[a - 2] === "for") {
                                //This is for Volt templates
                                level.push(-10);
                                return;
                            }
                            if (destruct[destruct.length - 1] === false || (data.token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'"))) {
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
                                if (assignlist[assignlist.length - 1] === true && varline[varline.length - 1] === false) {
                                    assignlist[assignlist.length - 1] = false;
                                    varlen[varlen.length - 1]         = [];
                                }
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
                                            if (data.token[a - 2] === "+" && ltype === "literal" && level[a - 2] > 0 && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
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
                            if (varline[varline.length - 1] === true && data.token[data.begin[a] - 1] !== "for") {
                                if (ltoke !== "]") {
                                    let c:number     = a - 1,
                                        brace:boolean = false;
                                    do {
                                        if (data.token[c] === "]") {
                                            brace = true;
                                        }
                                        if (data.types[c] === "start") {
                                            if (data.token[c] === "[" && data.token[c + 1] !== "]" && brace === false) {
                                                level[c] = indent;
                                            }
                                            break;
                                        }
                                        c = c - 1;
                                    } while (c > -1);
                                }
                                if (ltype === "literal" && data.token[a - 2] === "+" && (ltoke.charAt(0) === "\"" || ltoke.charAt(0) === "'")) {
                                    level.push(indent);
                                    return;
                                }
                                level.push(indent);
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
                            endExtraInd();
                            if (data.token[data.begin[a] - 1] !== "for") {
                                destructfix(false, false);
                            }
                            if (ctoke === "x;") {
                                scolon = scolon + 1;
                            }
                            wordlist[wordlist.length - 1] = false;
                            level[a - 1] = -20;
                            if (varline[varline.length - 1] === true) {
                                varline[varline.length - 1] = false;
                                if (data.stack[a] !== "method" && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                    varlist.push(varlen[varlen.length - 1]);
                                }
                                varlen[varlen.length - 1] = [];
                                let c:number = a - 1,
                                    d:number = 0;
                                do {
                                    if (data.types[c] === "start") {
                                        d = d + 1;
                                    }
                                    if (data.types[c] === "end") {
                                        d = d - 1;
                                    }
                                    if (d > 0) {
                                        break;
                                    }
                                    if (d === 0) {
                                        if (data.token[c] === "var" || data.token[c] === "let" || data.token[c] === "const") {
                                            break;
                                        }
                                        if (data.token[c] === ",") {
                                            indent = indent - 1;
                                            break;
                                        }
                                    }
                                    c = c - 1;
                                } while (c > -1);
                            }
                            if (data.begin[a] > 0 && data.token[data.begin[a] - 1] === "for" && data.stack[a] !== "for") {
                                level.push(-10);
                                return;
                            }
                            level.push(indent);
                            return;
                        }
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
                        varlen.push([]);
                        if (options.neverflatten === true || options.lang === "qml" || deep === "attribute" || ltype === "generic" || (deep === "class" && ltoke !== "(" && ltoke !== "x(") || (ctoke === "[" && data.token[a + 1] === "function")) {
                            destruct.push(false);
                        } else {
                            if (deep === "expression" || deep === "method") {
                                destruct.push(true);
                            } else if ((deep === "object" || deep === "class") && (ltoke === "(" || ltoke === "x(" || ltype === "word")) {
                                //array or object literal following `return` or `(`
                                destruct.push(true);
                            } else if (deep === "array" || ctoke === "(" || ctoke === "x(") {
                                //array, method, paren
                                destruct.push(true);
                            } else if (ctoke === "{" && deep === "object" && ltype !== "operator" && ltype !== "start" && ltype !== "literal" && deeper !== "object" && deeper !== "array" && a > 0) {
                                //curly brace not in a list and not assigned
                                destruct.push(true);
                            } else {
                                //not destructured (multiline)
                                destruct.push(false);
                            }
                        }
                        if (ctoke !== "(" && ctoke !== "x(" && data.stack[a] !== "attribute") {
                            //if (ctoke !== "[" || (ctoke === "[" && data.token[a + 1] !== "(")) {
                                indent = indent + 1;
                            //}
                        }
                        if (ctoke === "{" || ctoke === "x{") {
                            if (ctoke === "{") {
                                varline.push(false);
                            }
                            if (data.types[a - 1] !== "comment") {
                                if (ltype === "markup") {
                                    level[a - 1] = indent;
                                } else if (options.braces === true && ltype !== "operator" && ltoke !== "return") {
                                    level[a - 1] = indent - 1;
                                } else if (deep === "function" || ltoke === ")" || ltoke === "x)" || ltoke === "," || ltoke === "}" || ltype === "markup") {
                                    level[a - 1] = -10;
                                } else if (ltoke === "{" || ltoke === "x{" || ltoke === "[" || ltoke === "}" || ltoke === "x}") {
                                    level[a - 1] = indent - 1;
                                }
                            }
                            if (deep === "object") {
                                if (options.formatObject === "indent") {
                                    destruct[destruct.length - 1] = false;
                                    level.push(indent);
                                    return;
                                }
                                if (options.formatObject === "inline") {
                                    destruct[destruct.length - 1] = true;
                                    level.push(-20);
                                    return;
                                }
                            }
                            if (deep === "switch") {
                                if (options.nocaseindent === true) {
                                    level.push(indent - 1);
                                    return;
                                }
                                indent = indent + 1;
                                level.push(indent);
                                return;
                            }
                            if (destruct[destruct.length - 1] === true) {
                                if (ltype !== "word") {
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
                            if ((options.jsscope !== "none" || options.mode === "minify") && (ltoke === "function" || data.token[a - 2] === "function")) {
                                meta[meta.length - 1] = 0;
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
                            } else if (deep === "method" || (data.token[a - 2] === "function" && ltype === "word")) {
                                if (ltoke === "import" || ltoke === "in" || options.functionname === true) {
                                    level[a - 1] = -10;
                                } else if ((ltoke === "}" && data.stack[a - 1] === "function") || ltype === "word") {
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
                            if ((ltoke === "-" && (a < 2 || (data.token[a - 2] !== ")" && data.token[a - 2] !== "x)" && data.token[a - 2] !== "]" && data.types[a - 2] !== "word" && data.types[a - 2] !== "literal"))) || (options.space === false && ltoke === "function")) {
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
                            } else if (data.types[a - 1] !== "comment" && data.stack[a - 1] !== "attribute" && (ltype === "end" || ltype === "word")) {
                                level[a - 1] = -20;
                            } else if (ltoke !== "{" && (ltoke === "[" || ltoke === "{" || ltoke === "x{")) {
                                level[a - 1] = indent - 1;
                            }
                            if (data.stack[a] === "attribute") {
                                level.push(-20);
                                return;
                            }
                            if (options.formatArray === "indent") {
                                destruct[destruct.length - 1] = false;
                                level.push(indent);
                                return;
                            }
                            if (options.formatArray === "inline") {
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
                            if (ctoke === "}" && data.stack[a] === "switch" && options.nocaseindent === false) {
                                indent = indent - 1;
                            }
                        }
                        if (ctoke === "}" || ctoke === "x}") {
                            if (data.types[a - 1] !== "comment" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || data.token[a - 2] !== ";" || data.token[a - 2] !== "x;" || ltoke === "break" || ltoke === "return")) {
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
                                        if ((data.token[c] === ":" && ternary.length === 0) || (data.token[c] === "," && assign === false && varline[varline.length - 1] === false)) {
                                            break;
                                        }
                                        if ((c === 0 || data.token[c - 1] === "{" || data.token[c - 1] === "x{") || data.token[c] === "for" || data.token[c] === "if" || data.token[c] === "do" || data.token[c] === "function" || data.token[c] === "while" || data.token[c] === "var" || data.token[c] === "let" || data.token[c] === "const" || data.token[c] === "with") {
                                            if (list[listlen - 1] === false && listlen > 1 && (a === b - 1 || (data.token[a + 1] !== ")" && data.token[a + 1] !== "x)")) && data.stack[a] !== "object") {
                                                indent = indent - 1;
                                            }
                                            if (varline[varline.length - 1] === true) {
                                                indent = indent - 1;
                                            }
                                            break;
                                        }
                                    }
                                    c = c - 1;
                                } while (c > -1);
                            }
                            //this is the bulk of logic identifying scope start and end
                            if (data.stack[a] === "function" && (options.jsscope !== "none" || options.mode === "minify")) {
                                let c:number     = a - 1,
                                    d:number     = 1,
                                    build:string[] = [],
                                    paren:boolean = false;
                                do {
                                    if (data.types[c] === "end") {
                                        d = d + 1;
                                    } else if (data.types[c] === "start") {
                                        d = d - 1;
                                    }
                                    if (d < 0) {
                                        break;
                                    }
                                    if (meta[c] > "v" && data.token[c] !== build[build.length - 1]) {
                                        build.push(data.token[c]);
                                    } else if (d === 1 && data.token[c] === ")") {
                                        paren = true;
                                    } else if (d === 1 && paren === true && data.types[c] === "word" && data.token[c] !== build[build.length - 1]) {
                                        build.push(data.token[c]);
                                    }
                                    if (c === lettest) {
                                        meta[c] = a - 1;
                                        if (data.token[c] === "let" || data.token[c] === "const") {
                                            meta[meta.length - 2] = [build, true];
                                        }
                                        build   = [];
                                        lettest = -1;
                                    }
                                    if (c > 0 && data.token[c - 1] === "function" && data.types[c] === "word" && data.token[c] !== build[build.length - 1]) {
                                        build.push(data.token[c]);
                                    }
                                    if (d === 0) {
                                        if (data.token[c] === "function") {
                                            if (data.types[c + 1] === "word") {
                                                meta[c + 2] = a;
                                            } else {
                                                meta[c + 1] = a;
                                            }
                                            meta[meta.length - 1] = [build, false];
                                            return;
                                        }
                                    }
                                    c = c - 1;
                                } while (c > -1);
                            }
                        }
                        if (options.bracepadding === false && ctoke !== "}" && ltype !== "markup") {
                            level[a - 1] = -20;
                        }
                        if (options.bracepadding === true && ltype !== "start" && ltoke !== ";" && (level[data.begin[a]] < -9 || destruct[destruct.length - 1] === true)) {
                            level[data.begin[a]] = -10;
                            level[a - 1]    = -10;
                            level.push(-20);
                        } else if (options.lang === "qml") {
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
                            if (options.wrap > 0 && ctoke === ")") {
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
                                if (((comma === true || mark === true) && len >= wrap) || level[open] > -9) {
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
                                                if (data.token[len] !== ";" && varlen.length > 0) {
                                                    varlen[varlen.length - 1].push(aa - 1);
                                                }
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
                            if (ctoke === "}" && options.lang === "titanium") {
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
                        endExtraInd();
                        lastlist = list[list.length - 1];
                        list.pop();
                        extraindent.pop();
                        arrbreak.pop();
                        itemcount.pop();
                        if (ctoke === "}" || (ctoke === ")" && level[a - 1] > -9)) {
                            if (varline[varline.length - 1] === true || ltoke !== "{" || data.token[data.begin[a] - 2] === "interface") {
                                if (varlen.length > 0 && varlen[varlen.length - 1].length > 1 && destruct[destruct.length - 1] === false) {
                                    varlist.push(varlen[varlen.length - 1]);
                                }
                            }
                            if (ctoke === "}") {
                                varline.pop();
                            }
                        }
                        wordlist.pop();
                        varlen.pop();
                        destruct.pop();
                        assignlist.pop();
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
                            if (data.lines[a] === 0 && data.types[a - 2] === "word" && data.token[a - 2] !== "return" && data.token[a - 2] !== "in" && data.token[a - 2] !== "instanceof" && data.token[a - 2] !== "typeof" && ltype === "word") {
                                if (data.types[a + 1] === "word" || ((data.token[a + 1] === "(" || data.token[a + 1] === "x(") && data.token[a - 2] === "new")) {
                                    level[a - 1] = -20;
                                    if (data.types[a + 1] === "word") {
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
                            if (options.ternaryline === true) {
                                level[a - 1] = -10;
                            } else {
                                let c = a - 1;
                                do {
                                    c = c - 1;
                                } while (c > -1 && level[c] < -9);
                                ei.push(a);
                                ternary.push(a);
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
                            if (data.token[a - 2] === "where" && data.stack[a - 2] === data.stack[a]) {
                                level[a - 1] = -10;
                                level.push(-10);
                                return;
                            }
                            if ((data.token[a - 2] === "var" || data.token[a - 2] === "let" || data.token[a - 2] === "const" || data.token[a - 2] === "," || (data.stack[a] === "global" && options.lang === "jsx" && ternary.length < 1)) && ltype === "word" && data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(") {
                                level[a - 1] = -20;
                                if (data.stack[a] === "object" || (varline[varline.length - 1] === true && data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(")) {
                                    if (varlen.length > 0 && varlen[varlen.length - 1].length > 0 && data.token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ctoke) {
                                        if (varlen[varlen.length - 1].length > 1) {
                                            varlist.push(varlen[varlen.length - 1]);
                                        }
                                        varlen[varlen.length - 1] = [];
                                    }
                                    varlen[varlen.length - 1].push(a - 1);
                                }
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
                            if (data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(" && (ltype === "word" || ltoke === ")" || ltoke === "]" || ltoke === "?") && (data.stack[a] === "map" || data.stack[a] === "class" || data.types[a + 1] === "word") && (ternary.length === 0 || ternary[ternary.length - 1] < data.begin[a]) && ("mapclassexpressionmethodglobalparen".indexOf(data.stack[a]) > -1 || (data.types[a - 2] === "word" && data.stack[a] !== "switch"))) {
                                level[a - 1] = -20;
                                varlen[varlen.length - 1].push(a - 1);
                                level.push(-10);
                                return;
                            }
                            if (data.stack[a] === "switch" && (ternary.length < 1 || ternary[ternary.length - 1] < data.begin[a])) {
                                level[a - 1] = -20;
                                level.push(indent);
                                return;
                            }
                            if (ternary.length > 0 && ternary[ternary.length - 1] > data.begin[a]) {
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
                                            break;
                                        }
                                    }
                                } while (c > d);
                            } else if (data.stack[a] === "object") {
                                level[a - 1] = -20;
                                varlen[varlen.length - 1].push(a - 1);
                            } else if (ternary.length > 0) {
                                level[a - 1] = indent;
                            } else {
                                level[a - 1] = -10;
                            }
                            level.push(-10);
                            return;
                        }
                        if (ctoke === "++" || ctoke === "--") {
                            if (ltype === "literal" || ltype === "word") {
                                level[a - 1] = -20;
                                level.push(-10);
                            } else if (a < b - 1 && (data.types[a + 1] === "literal" || data.types[a + 1] === "word")) {
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
                                if (data.types[a + 1] === "word" || aa === "(" || aa === "[") {
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
                                line = line - (options.insize * options.inchar.length * 2);
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
                                    if (data.token[a].length > options.wrap) {
                                        strwrap(0);
                                        return;
                                    }
                                    level.push(-10);
                                    return;
                                }
                            } else if (data.token[data.begin[a]] !== "(" || meth > options.wrap - 1 || meth === 0) {
                                if (meth > 0) {
                                    line = meth;
                                }
                                if (line - aa.length < options.wrap - 1 && (aa.charAt(0) === "\"" || aa.charAt(0) === "'")) {
                                    a = a + 1;
                                    if (varline[varline.length - 1] === true && data.token[c] === "=") {
                                        line = line + (options.inchar.length * options.insize) - 1;
                                    } else {
                                        line = line + 3;
                                    }
                                    //strwrap(options.wrap - (line - aa.length));
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
                            } else if (ctoke === "*" && data.stack[a] === "object" && data.types[a + 1] === "word" && (ltoke === "{" || ltoke === ",")) {
                                level[a - 1] = indent;
                            } else if (ctoke !== "?" || ternary.length === 0) {
                                level[a - 1] = -10;
                            }
                        }
                        if (ctoke.indexOf("=") > -1 && ctoke !== "==" && ctoke !== "===" && ctoke !== "!=" && ctoke !== "!==" && ctoke !== ">=" && ctoke !== "<=" && ctoke !== "=>" && data.stack[a] !== "method" && data.stack[a] !== "object") {
                            if (assignlist[assignlist.length - 1] === true && data.token[data.begin[a] - 1] !== "for") {
                                let c:number = a - 1,
                                    d:string = "",
                                    e:number = data.begin[a];
                                if (data.stack[a] === "class") {
                                    varlen[varlen.length - 1].push(a - 1);
                                } else {
                                    do {
                                        d = data.token[c];
                                        if (d === ";" || d === "x;" || d === "," || d === "?" || d === ":" || c === e + 1) {
                                            varlen[varlen.length - 1].push(a - 1);
                                            break;
                                        }
                                        if (d.indexOf("=") > -1 && d !== "==" && d !== "===" && d !== "!=" && d !== "!==" && d !== ">=" && d !== "<=") {
                                            break;
                                        }
                                        c = c - 1;
                                    } while (c > e);
                                }
                            }
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
                                            if (varlen[varlen.length - 1].length > 1) {
                                                varlist.push(varlen[varlen.length - 1]);
                                            }
                                            varlen[varlen.length - 1] = [];
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
                                        if (varlen[varlen.length - 1].length > 1) {
                                            varlist.push(varlen[varlen.length - 1]);
                                        }
                                        varlen[varlen.length - 1] = [];
                                    }
                                    break;
                                }
                                if (d === 0) {
                                    f = data.token[c];
                                    if (e === true) {
                                        if (data.types[c] === "operator" || data.token[c] === ";" || data.token[c] === "x;" || data.token[c] === "?" || data.token[c] === "var" || data.token[c] === "let" || data.token[c] === "const") {
                                            if (f !== undefined && (f === "?" || (f.indexOf("=") > -1 && f !== "==" && f !== "===" && f !== "!=" && f !== "!==" && f !== ">=" && f !== "<="))) {
                                                if (assignlist[assignlist.length - 1] === false && (varlen[varlen.length - 1].length === 0 || data.token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] === ctoke)) {
                                                    varlen[varlen.length - 1].push(a - 1);
                                                    assignlist[assignlist.length - 1] = true;
                                                }
                                            }
                                            if ((f === ";" || f === "x;" || f === "var" || f === "let" || f === "const") && assignlist[assignlist.length - 1] === true) {
                                                assignlist[assignlist.length - 1] = false;
                                                if (varlen[varlen.length - 1].length > 1) {
                                                    varlist.push(varlen[varlen.length - 1]);
                                                }
                                                varlen[varlen.length - 1] = [];
                                            }
                                            break;
                                        }
                                        if (assignlist[assignlist.length - 1] === true && (f === "return" || f === "break" || f === "continue" || f === "throw")) {
                                            assignlist[assignlist.length - 1] = false;
                                            if (varlen[varlen.length - 1].length > 1) {
                                                varlist.push(varlen[varlen.length - 1]);
                                            }
                                            varlen[varlen.length - 1] = [];
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
                        if (ltype === "operator" && data.types[a + 1] === "word" && ltoke !== "--" && ltoke !== "++" && ctoke !== "&&" && ctoke !== "||") {
                            level.push(-20);
                            return;
                        }
                        level.push(-10);
                    },
                    word          = function beautify_script_word():void {
                        const next    = data.token[a + 1],
                            compare = (
                                next !== undefined && next !== "==" && next !== "===" && next !== "!=" && next !== "!==" && next !== ">=" && next !== "<=" && next.indexOf("=") > -1
                            );
                        if (varline[varline.length - 1] === true && (ltoke === "," || ltoke === "var" || ltoke === "let" || ltoke === "const")) {
                            if (data.token[data.begin[a] - 1] !== "for" && data.stack[a] !== "method" && data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(") {
                                if (data.types[a + 1] === "operator" && compare === true && data.token[varlen[varlen.length - 1][varlen[varlen.length - 1].length - 1] + 1] !== ":") {
                                    varlen[varlen.length - 1].push(a);
                                }
                            }
                            if (options.jsscope !== "none" || options.mode === "minify") {
                                meta[meta.length - 1] = "v";
                            }
                        } else if ((options.jsscope !== "none" || options.mode === "minify") && ltoke === "function") {
                            meta[meta.length - 1] = "v";
                        }
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
                        if ((ctoke === "let" || ctoke === "const") && lettest < 0) {
                            lettest = a;
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
                        if (ltype === "literal" && ltoke.charAt(ltoke.length - 1) === "{" && options.bracepadding === false) {
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
                        } else if (ctoke === "in" || (((ctoke === "else" && options.elseline === false) || ctoke === "catch") && (ltoke === "}" || ltoke === "x}"))) {
                            level[a - 1] = -10;
                        } else if (ctoke === "var" || ctoke === "let" || ctoke === "const") {
                            if (assignlist[assignlist.length - 1] === true && varlen.length > 0 && varlen[varlen.length - 1].length > 1) {
                                assignlist[assignlist.length - 1] = false;
                                varlist.push(varlen[varlen.length - 1]);
                                varlen[varlen.length - 1] = [];
                            } else if (data.stack[a] !== "method") {
                                varlen[varlen.length - 1] = [];
                            }
                            if (ltype === "end") {
                                level[a - 1] = indent;
                            }
                            if (data.token[data.begin[a] - 1] !== "for") {
                                if (varline.length === 0) {
                                    varline.push(true);
                                } else {
                                    varline[varline.length - 1] = true;
                                }
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
                        if (options.bracepadding === false && a < b - 1 && data.token[a + 1].charAt(0) === "}") {
                            level.push(-20);
                            return;
                        }
                        if (data.stack[a] === "object" && (ltoke === "{" || ltoke === ",") && (data.token[a + 1] === "(" || data.token[a + 1] === "x(")) {
                            level.push(-20);
                            return;
                        }
                        level.push(-10);
                    };
                if (options.lang === "titanium") {
                    indent = indent - 1;
                }
                do {
                    if (options.jsscope !== "none" || options.mode === "minify") {
                        meta.push("");
                    }
                    ctype = data.types[a];
                    ctoke = data.token[a];
                    if (ctype === "comment") {
                        if (data.lines[a - 1] < 2) {
                            commentInline();
                        } else {
                            comment();
                        }
                    } else if (ctype === "regex") {
                        level.push(-20);
                    } else if (ctype === "literal") {
                        literal();
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
                    a = a + 1;
                } while (a < b);
                if (assignlist[assignlist.length - 1] === true && varlen[varlen.length - 1].length > 1 && ltoke === ";") {
                    varlist.push(varlen[varlen.length - 1]);
                }
                return level;
            }()),
            output:string = (function beautify_script_output():string {
                const build:string[] = [],
                    len:number = levels.length,
                    tab:string = (function beautify_script_output_tab():string {
                        const ch = options.inchar,
                            tabby:string[] = [];
                        let index = options.insize;
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
                    invisibles:string[] = ["x;", "x}", "x{", "x(", "x)"];
                let a:number = 0;
                if (options.jsscope !== "none") {
                    let linecount:number          = 2,
                        last:string               = "",
                        scope:number              = 1,
                        buildlen:number           = 0,
                        commentfix:number         = (function beautify_script_output_scope_commentfix():number {
                            let aa:number = 1,
                                bb:number = 1;
                            if (
                                data.types[0] !== "comment" ||
                                (data.token[0].indexOf("//") === 0 && data.lines[0] > 0) ||
                                data.types[1] !== "comment"
                            ) {
                                return 1;
                            }
                            do {
                                if (data.token[aa].indexOf("/*") === 0) {
                                    bb = bb + 1;
                                }
                                aa = aa + 1;
                            } while (data.types[aa] === "comment" && aa < len);
                            return bb + 1;
                        }()),
                        indent:number             = options.inlevel,
                        comfold:number            = -1;
                    const code:string[] = [],
                        folderItem:[number, number, boolean][]         = [],
                        folder             = function beautify_script_output_scope_folder():void {
                            let codelen:number = (code.length - (commentfix * 3) > 0)
                                    ? code.length - (commentfix * 3)
                                    : 1,
                                index:number   = a,
                                start:number   = Number(code[codelen + 1]) || 1,
                                assign:boolean  = true,
                                kk:number      = index;
                            if (data.types[a] === "comment" && comfold === -1) {
                                comfold = a;
                            } else if (data.types[a] !== "comment") {
                                index = meta[a];
                                do {
                                    kk = kk - 1;
                                } while (data.token[kk] !== "function" && kk > -1);
                                kk = kk - 1;
                                if (data.token[kk] === "(" || data.token[kk] === "x(") {
                                    do {
                                        kk = kk - 1;
                                    } while (kk > -1 && (data.token[kk] === "(" || data.token[kk] === "x("));
                                }
                                if (
                                    data.token[kk] === "=" ||
                                    data.token[kk] === ":" ||
                                    data.token[kk] === "," ||
                                    data.token[kk + 1] === "(" ||
                                    data.token[kk + 1] === "x("
                                ) {
                                    assign = false;
                                }
                            }
                            if (data.types[a] === "comment" && data.lines[a] > 1) {
                                codelen = codelen - 3;
                                start   = start - 1;
                            }
                            code[codelen]     = `<li class="fold" title="folds from line ${start} to line xxx">`;
                            code[codelen + 1] = `- ${start}`;
                            folderItem.push([codelen, index, assign]);
                        },
                        // determines where folding ends function assignments require one more line for
                        // closing than everything else
                        foldclose          = function beautify_script_output_scope_foldclose():void {
                            const semi:boolean = (/(>;<\/em>)$/).test(data.token[a]);
                            let gg:number   = build.length - 1,
                                lets:boolean = false,
                                end:number  = (function beautify_script_output_scope_foldclose_end():number {
                                    if (comfold > -1 || folderItem[folderItem.length - 1][2] === true) {
                                        return linecount - commentfix - 1;
                                    }
                                    return linecount - commentfix;
                                }());
                            if (semi === true) {
                                end = end - 1;
                                do {
                                    if (build[gg] === "let" || build[gg] === "const") {
                                        lets = true;
                                    }
                                    if (build[gg].indexOf("><li") > 0) {
                                        build[gg] = build[gg].replace(/class="l\d+"/, `class="l${scope + 1}"`);
                                        if (lets === true) {
                                            break;
                                        }
                                    }
                                    if (build[gg].indexOf(`<span class="l${scope}">${tab}`) > -1) {
                                        build[gg] = build[gg].replace(
                                            `<span class="l${scope}">${tab}`,
                                            `<span class="l${scope + 1}">${tab}`
                                        );
                                    }
                                    gg = gg - 1;
                                } while (gg > 0);
                            }
                            if (
                                a > 1 &&
                                data.token[a].indexOf("}</em>") === data.token[a].length - 6 &&
                                data.token[a - 1].indexOf("{</em>") === data.token[a - 1].length - 6
                            ) {
                                gg = code.length - 1;
                                do {
                                    if (code[gg].charAt(0) === "-") {
                                        code[gg - 1] = "<li>";
                                        code[gg]     = code[gg].slice(0, 1);
                                        folderItem.pop();
                                        return;
                                    }
                                    gg = gg - 1;
                                } while (gg > 0);
                            }
                            if (folderItem[folderItem.length - 1][1] === len - 1 && data.token[a].indexOf("<em ") === 0) {
                                end = end + 1;
                            }
                            code[folderItem[folderItem.length - 1][0]] = code[folderItem[folderItem.length - 1][0]].replace(
                                "xxx",
                                String(end)
                            );
                            folderItem.pop();
                        },
                        // splits block comments, which are single tokens, into multiple lines of output
                        blockline          = function beautify_script_output_scope_blockline(x:string):string {
                            const commentLines:string[] = x.split(lf),
                                ii:number           = commentLines.length - 1;
                            let hh:number           = 0;
                            if (data.lines[a] > 0) {
                                code.push("<li>");
                                code.push(String(linecount));
                                code.push("</li>");
                                linecount = linecount + 1;
                            }
                            do {
                                code.push("<li>");
                                code.push(String(linecount));
                                code.push("</li>");
                                linecount        = linecount + 1;
                                commentLines[hh] = commentLines[hh] + "<em>&#xA;</em></li><li class=\"c0\">";
                                hh = hh + 1;
                            } while (hh < ii);
                            return commentLines.join("");
                        },
                        findvars           = function beautify_script_output_scope_findvars(x:number):void {
                            let lettest:boolean       = false,
                                ee:number            = 0,
                                ff:number            = 0,
                                hh:number            = 0,
                                adjustment:number    = 1,
                                functionBlock:boolean = true,
                                varbuild:string[]      = [],
                                varbuildlen:number   = 0;
                            const metax         = meta[x],
                                metameta      = meta[metax][0],
                                letcomma      = function beautify_script_output_scope_findvars_letcomma():void {
                                    let aa:number = a,
                                        bb:number = 0;
                                    if (a > -1) {
                                        do {
                                            if (data.types[aa] === "end") {
                                                bb = bb - 1;
                                            }
                                            if (data.types[aa] === "start") {
                                                bb = bb + 1;
                                            }
                                            if (bb > 0) {
                                                return;
                                            }
                                            if (bb === 0) {
                                                if (data.token[aa] === "var" || data.token[aa] === ";" || data.token[aa] === "x;") {
                                                    return;
                                                }
                                                if (data.token[aa] === "let" || data.token[aa] === "const") {
                                                    data.token[ee] = `<em class="s${scope}">${varbuild[0]}</em>`;
                                                }
                                            }
                                            aa = aa - 1;
                                        } while (aa > -1);
                                    }
                                };
                            if (metameta === undefined) {
                                return;
                            }
                            lettest = meta[metax][1];
                            hh      = metameta.length;
                            if (data.types[a - 1] === "word" && data.token[a - 1] !== "function" && lettest === false) {
                                varbuild     = data.token[a - 1].split(" ");
                                data.token[a - 1] = `<em class="s${scope}">${varbuild[0]}</em>`;
                                varbuildlen  = varbuild.length;
                                if (varbuildlen > 1) {
                                    do {
                                        data.token[ee]   = data.token[ee] + " ";
                                        varbuildlen = varbuildlen - 1;
                                    } while (varbuildlen > 1);
                                }
                            }
                            if (hh > 0) {
                                ee = metax - 1;
                                if (lettest === true) {
                                    ee = ee - 1;
                                }
                                do {
                                    if (data.types[ee] === "word") {
                                        varbuild = data.token[ee].split(" ");
                                        ff = 0;
                                        do {
                                            if (varbuild[0] === metameta[ff] && data.token[ee - 1] !== ".") {
                                                if (data.token[ee - 1] === "function" && data.token[ee + 1] === "(") {
                                                    data.token[ee]   = `<em class="s${scope + 1}">${varbuild[0]}</em>`;
                                                    varbuildlen = varbuild.length;
                                                    if (varbuildlen > 1) {
                                                        do {
                                                            data.token[ee]   = data.token[ee] + " ";
                                                            varbuildlen = varbuildlen - 1;
                                                        } while (varbuildlen > 1);
                                                    }
                                                } else if (
                                                    data.token[ee - 1] === "case" ||
                                                    data.token[ee + 1] !== ":" ||
                                                    (data.token[ee + 1] === ":" && levels[ee] > -20)
                                                ) {
                                                    if (lettest === true) {
                                                        if (data.token[ee - 1] === "let" || data.token[ee - 1] === "const") {
                                                            data.token[ee] = `<em class="s${scope}">${varbuild[0]}</em>`;
                                                        } else if (data.token[ee - 1] === ",") {
                                                            letcomma();
                                                        } else {
                                                            data.token[ee] = `<em class="s${scope}">${varbuild[0]}</em>`;
                                                        }
                                                    } else {
                                                        data.token[ee] = `<em class="s${scope}">${varbuild[0]}</em>`;
                                                    }
                                                    varbuildlen = varbuild.length;
                                                    if (varbuildlen > 1) {
                                                        do {
                                                            data.token[ee]   = data.token[ee] + " ";
                                                            varbuildlen = varbuildlen - 1;
                                                        } while (varbuildlen > 1);
                                                    }
                                                }
                                                break;
                                            }
                                            ff = ff + 1;
                                        } while (ff < hh);
                                    }
                                    if (functionBlock === true) {
                                        if (data.types[ee] === "end") {
                                            adjustment = adjustment + 1;
                                        } else if (data.types[ee] === "start") {
                                            adjustment = adjustment - 1;
                                        }
                                        if (adjustment === 0 && data.token[ee] === "{") {
                                            data.token[ee]     = `<em class="s${scope}">{</em>`;
                                            functionBlock = false;
                                        }
                                    }
                                    ee = ee - 1;
                                } while (ee > a);
                            } else {
                                ee = a + 1;
                                if (lettest === true) {
                                    ee = ee - 1;
                                }
                                if (ee < metax) {
                                    do {
                                        if (data.types[ee] === "end") {
                                            adjustment = adjustment - 1;
                                        } else if (data.types[ee] === "start") {
                                            adjustment = adjustment + 1;
                                        }
                                        if (adjustment === 1 && data.token[ee] === "{") {
                                            data.token[ee] = `<em class="s${scope}">{</em>`;
                                            return;
                                        }
                                        ee = ee + 1;
                                    } while (ee < metax);
                                }
                            }
                        },
                        //a function for calculating indentation after each new line
                        nl                 = function beautify_script_output_scope_nl(x:number, linetest:boolean):void {
                            let dd = 0;
                            const lscope             = function beautify_script_output_scope_lscope(depth:number):string {
                                const indentation:string[] = [];
                                let aa:number = 0;
                                do {
                                    indentation.push(`<span class="l${aa}">${tab}</span>`);
                                    aa = aa + 1;
                                } while (aa < depth);
                                return indentation.join("");
                            };
                            if (data.token[a] !== "x}" || (data.token[a] === "x}" && data.token[a + 1] !== "}")) {
                                code.push("<li>");
                                code.push(String(linecount));
                                code.push("</li>");
                                linecount = linecount + 1;
                                if (a < len - 1 && data.token[a + 1].indexOf("/*") === 0) {
                                    build.push("<em>&#xA;</em></li><li class=\"c0\">");
                                } else {
                                    build.push(`<em>&#xA;</em></li><li class="l${scope}">`);
                                    if (x > 0 && scope > 0) {
                                        dd = scope;
                                        if (data.types[a + 1] === "end" || (scope === x + 1 && x > 0 && linetest === false)) {
                                            dd = dd - 1;
                                        }
                                        build.push(lscope(dd));console.log(a+" "+data.types[a + 1]);
                                    } else if (linetest === true) {
                                        build.push(lscope(0));
                                    }
                                }
                            } else if (x > 0 && scope > 0) {
                                dd = scope;
                                if (data.types[a + 1] === "end" || (scope === x + 1 && x > 0 && linetest === false)) {
                                    dd = dd - 1;
                                }
                                build.push(lscope(dd));
                            }
                            if (x > scope) {
                                do {
                                    build.push(tab);
                                    dd = dd + 1;
                                } while (dd < x);
                            }
                        },
                        rl                 = function beautify_script_output_scope_rl(x:number):void {
                            let cc:number = 2,
                                dd:number = a + 2;
                            if (dd < len) {
                                do {
                                    if (data.token[dd] === "x}") {
                                        cc = cc + 1;
                                    } else {
                                        break;
                                    }
                                    dd = dd + 1;
                                } while (dd < len);
                            }
                            nl(x - cc, false);
                            a = a + 1;
                        },
                        /*markupBuild        = function beautify_script_output_scope_markupBuild() {
                            let c:number        = 1,
                                spaces:number   = 0,
                                synthtab:string = "\\" + tab.charAt(0),
                                tabreg:RegExp,
                                markuplen:number      = tab.length,
                                mindent  = (function beautify_script_output_scope_markupBuild_offset():number {
                                    let d = a - 1;
                                    if (a === markupvar[0]) {
                                        markupvar.splice(0, 1);
                                        return 1;
                                    }
                                    if (data.token[d] === "return" || data.token[0] === "{") {
                                        return 1;
                                    }
                                    if (levels[a] < -9) {
                                        return 0;
                                    }
                                    do {
                                        if (data.token[d] !== "(" && data.token[d] !== "x(") {
                                            if (data.token[d] === "=") {
                                                return 1;
                                            }
                                            return 0;
                                        }
                                        d = d - 1;
                                    } while (d > -1);
                                    return 0;
                                }());
                            const markup   = (function beautify_script_output_scope_markupBuild_varscope():string[] {
                                    const lena:number    = meta.length,
                                        emscope = function jsscope__result_scope_markupBuild_varscope_emscope(x:string):string {
                                            return `<em class="s${x.replace("[pdjsxem", "").replace("]", "")}">`;
                                        };
                                    let item:string    = "",
                                        word:string    = "",
                                        newword:string = "",
                                        inca:number    = 0,
                                        incb:number    = 0,
                                        lenb:number    = 0,
                                        vars    = [],
                                        mode:mode    = options.mode,
                                        inle:number    = options.inlevel,
                                        jsx:boolean     = (options.lang === "jsx");
                                    //options.source  = data.token[a];
                                    //options.mode    = "beautify";
                                    //options.inlevel = mindent;
                                    //options.jsx     = true;
                                    //item            = extlib().replace(/return\s+</g, "return <");
                                    //options.mode    = mode;
                                    //options.inlevel = inle;
                                    //options.jsx     = jsx;
                                    //if (item.indexOf("[pdjsxscope]") < 0) {
                                    //    return item
                                    //        .replace(/&/g, "&amp;")
                                    //        .replace(/</g, "&lt;")
                                    //        .replace(/>/g, "&gt;")
                                    //        .split(lf);
                                    //}
                                    do {
                                        newword = "";
                                        vars    = [];
                                        word    = item.slice(
                                            item.indexOf("[pdjsxscope]") + 12,
                                            item.indexOf("[/pdjsxscope]")
                                        );
                                        do {
                                            if (typeof meta[inca] === "number" && inca < a && a < meta[inca]) {
                                                vars.push(meta[inca]);
                                                lenb = meta[meta[inca]].length;
                                                do {
                                                    if (meta[meta[inca]][incb] === word) {
                                                        newword = `[pdjsxem${vars.length + 1}]${word}[/pdjsxem]`;
                                                    }
                                                    incb = incb + 1;
                                                } while (incb < lenb);
                                                if (incb < lenb) {
                                                    break;
                                                }
                                                vars.pop();
                                            }
                                            inca = inca - 1;
                                        } while (inca < lena);
                                        if (newword === "") {
                                            lenb = globals.length;
                                            incb = 0;
                                            do {
                                                if (word === globals[incb]) {
                                                    newword = `[pdjsxem0]${word}[/pdjsxem]`;
                                                }
                                                incb = incb + 1;
                                            } while (incb < lenb);
                                            if (newword === "") {
                                                newword = word;
                                            }
                                        }
                                        item = item.replace(`[pdjsxscope]${word}[/pdjsxscope]`, newword);
                                    } while (item.indexOf("[pdjsxscope]") > -1);
                                    return item
                                        .replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .replace(/\[pdjsxem\d+\]/g, emscope)
                                        .replace(/\[\/pdjsxem\]/g, "</em>")
                                        .split(lf);
                                }());
                            do {
                                synthtab = synthtab + "\\" + tab.charAt(c);
                                c = c + 1;
                            } while (c < markuplen);
                            tabreg  = new RegExp(`^(${synthtab})`);
                            mindent = indent + 2;
                            if (levels[a] < -9) {
                                markup[0] = markup[0].replace(tabreg, "");
                                mindent   = mindent - 1;
                            }
                            markuplen = markup.length;
                            c = 0;
                            do {
                                if (markup[c].indexOf(tab) !== 0 && c > 0) {
                                    spaces = markup[c - 1]
                                        .split(tab)
                                        .length - 1;
                                    do {
                                        spaces    = spaces - 1;
                                        markup[c] = tab + markup[c];
                                    } while (spaces > 0);
                                }
                                build.push(markup[c]);
                                nl(mindent - 1, false);
                                c = c + 1;
                            } while (c < markuplen - 1);
                            build.push(markup[markup.length - 1]);
                        },*/
                        multiline          = function beautify_script_output_scope_multiline(x:string):void {
                            const temparray:string[] = x.split(lf),
                                d:number         = temparray.length;
                            let c:number         = 1;
                            build.push(temparray[0]);
                            do {
                                nl(indent, false);
                                build.push(temparray[c]);
                                c = c + 1;
                            } while (c < d);
                        },
                        endcomma_multiline = function beautify_script_output_scope_endcommaMultiline():void {
                            let c:number = a;
                            if (data.types[c] === "comment") {
                                do {
                                    c = c - 1;
                                } while (c > 0 && data.types[c] === "comment");
                            }
                            data.token[c] = data.token[c] + ",";
                        };
                    code.push("<div class=\"beautify\" data-prettydiff-ignore=\"true\"><ol class=\"count\">");
                    code.push("<li>");
                    code.push("1");
                    code.push("</li>");
                    /*if (options.vertical === true) {
                        vertical();
                    }*/
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
                    // its important to find the variables separately from building the output so
                    // that recursive flows in the loop incrementation do not present simple
                    // counting collisions as to what gets modified versus what gets included
                    a = len - 1;
                    if (a > 0) {
                        do {
                            if (typeof meta[a] === "number") {
                                scope = scope - 1;
                                findvars(a);
                            } else if (
                                meta[a] !== undefined &&
                                typeof meta[a] !== "string" &&
                                typeof meta[a] !== "number" &&
                                a > 0 &&
                                invisibles.indexOf(data.token[a]) < 0
                            ) {
                                data.token[a] = `<em class="s${scope}">${data.token[a]}</em>`;
                                scope    = scope + 1;
                                if (scope > 16) {
                                    scope = 16;
                                }
                            }
                            a = a - 1;
                        } while (a > -1);
                    }
                    (function beautify_script_output_scope_globals():void {
                        let aa:number          = len,
                            ee:number          = globals.length - 1,
                            word:string[]        = [],
                            wordlen:number     = 0;
                        if (ee < 0) {
                            return;
                        }
                        do {
                            if (
                                data.types[aa] === "word" &&
                                (data.token[aa + 1] !== ":" || (data.token[aa + 1] === ":" && levels[aa + 1] === -20)) &&
                                data.token[aa].indexOf("<em ") < 0
                            ) {
                                word = data.token[aa].split(" ");
                                do {
                                    if (word[0] === globals[ee] && data.token[aa - 1] !== ".") {
                                        if (data.token[aa - 1] === "function" && data.stack[aa + 1] === "method") {
                                            data.token[aa] = `<em class="s1">${word[0]}</em>`;
                                            wordlen   = word.length;
                                            if (wordlen > 1) {
                                                do {
                                                    data.token[aa] = data.token[aa] + " ";
                                                    wordlen   = wordlen - 1;
                                                } while (wordlen > 1);
                                            }
                                        } else {
                                            data.token[aa] = `<em class="s0">${word[0]}</em>`;
                                            wordlen   = word.length;
                                            if (wordlen > 1) {
                                                do {
                                                    data.token[aa] = data.token[aa] + " ";
                                                    wordlen   = wordlen - 1;
                                                } while (wordlen > 1);
                                            }
                                        }
                                        break;
                                    }
                                    ee = ee - 1;
                                } while (ee > -1);
                            }
                            aa = aa - 1;
                        } while (a > 0);
                    }());
                    scope = 0;
                    // this loops combines the white space as determined from the algorithm with the
                    // tokens to create the output
                    a = 0;
                    do {
                        if (typeof meta[a] === "number") {
                            folder();
                        }
                        if (
                            comfold === -1 &&
                            data.types[a] === "comment" &&
                            (
                                (data.token[a].indexOf("/*") === 0 && data.token[a].indexOf("\n") > 0) ||
                                data.types[a + 1] === "comment" || data.lines[a] > 1
                            )
                        ) {
                            folder();
                            comfold = a;
                        }
                        if (comfold > -1 && data.types[a] !== "comment") {
                            foldclose();
                            comfold = -1;
                        }
                        if (options.endcomma === "multiline" && (
                            data.token[a + 1] === "]" ||
                            data.token[a + 1] === "}"
                        ) && levels[a] !== -20) {
                            endcomma_multiline();
                        }
                        if (data.types[a] === "comment" && data.token[a].indexOf("/*") === 0) {
                            build.push(blockline(data.token[a]));
                        } else if (invisibles.indexOf(data.token[a]) < 0) {
                            if (typeof meta[a] === "number") {
                                scope = scope + 1;
                                if (scope > 16) {
                                    scope = 16;
                                }
                                build.push(data.token[a]);
                            } else if (typeof meta[a] !== "string" && typeof meta[a] !== "number") {
                                build.push(data.token[a]);
                                scope    = scope - 1;
                                buildlen = build.length - 1;
                                do {
                                    buildlen = buildlen - 1;
                                } while (buildlen > 0 && build[buildlen].indexOf("</li><li") < 0);
                                build[buildlen] = build[buildlen].replace(
                                    /class="l\d+"/,
                                    `class="l${scope}"`
                                );
                            } else if (invisibles.indexOf(data.token[a]) < 0) {
                                if (data.types[a] === "markup") {
                                    if (levels[a] > -9) {
                                        if (data.types[a - 1] === "operator") {
                                            nl(indent, false);
                                        } else if (data.token[a - 1] !== "return") {
                                            nl(indent + 1, false);
                                        }
                                    }
                                    /*if (typeof global.prettydiff.markuppretty === "function") {
                                        markupBuild();
                                    } else {*/
                                        build.push(data.token[a].replace(/\r?\n(\s*)/g, " "));
                                    //}
                                } else if (data.types[a] === "comment") {
                                    if (data.types[a - 1] !== "comment") {
                                        nl(indent, false);
                                    }
                                    if (a === 0) {
                                        build[0] = "<ol class=\"data\"><li class=\"c0\">";
                                    } else {
                                        buildlen = build.length - 1;
                                        if (build[buildlen].indexOf("<li") < 0) {
                                            do {
                                                build[buildlen] = build[buildlen]
                                                    .replace(/<em\u0020class="[a-z]\d+">/g, "")
                                                    .replace(/<\/em>/g, "");
                                                buildlen        = buildlen - 1;
                                                if (buildlen > 0 && build[buildlen] === undefined) {
                                                    buildlen = buildlen - 1;
                                                }
                                            } while (
                                                buildlen > 0 && build[buildlen - 1] !== undefined && build[buildlen].indexOf("<li") < 0
                                            );
                                        }
                                        if ((/^(<em>&#xA;<\/em><\/li><li\u0020class="l\d+">)$/).test(build[buildlen - 1]) === true) {
                                            build[buildlen - 1] = build[buildlen - 1].replace(
                                                /class="l\d+"/,
                                                "class=\"c0\""
                                            );
                                        }
                                        build[buildlen] = build[buildlen].replace(/class="l\d+"/, "class=\"c0\"");
                                    }
                                    build.push(data.token[a]);
                                } else {
                                    if (data.types[a] === "literal" && data.token[a].indexOf("\n") > 0) {
                                        multiline(data.token[a]);
                                    } else {
                                        build.push(data.token[a]);
                                    }
                                }
                            }
                        }
                        // this condition performs additional calculations for options.preserve.
                        // options.preserve determines whether empty lines should be preserved from the
                        // code input
                        if (options.preserve > 0 && data.lines[a] > 0 && levels[a] > -9 && data.token[a] !== "+") {
                            //special treatment for math operators
                            if (data.token[a] === "+" || data.token[a] === "-" || data.token[a] === "*" || data.token[a] === "/") {
                                //comments get special treatment
                                if (a < len - 1 && data.types[a + 1] !== "comment") {
                                    nl(levels[a], false);
                                    build.push(tab);
                                    levels[a] = -20;
                                } else {
                                    indent = levels[a];
                                    if (data.lines[a] > 1) {
                                        do {
                                            build.push(lf);
                                            data.lines[a] = data.lines[a] - 1;
                                        } while (data.lines[a] > 1);
                                    }
                                    nl(indent, false);
                                    build.push(tab);
                                    build.push(data.token[a + 1]);
                                    nl(indent, false);
                                    build.push(tab);
                                    levels[a + 1] = -20;
                                    a            = a + 1;
                                }
                            } else if (
                                data.lines[a] > 1 &&
                                data.token[a].charAt(0) !== "=" &&
                                data.token[a].charAt(0) !== "!" &&
                                (data.types[a] !== "start" || (a < len - 1 && data.types[a + 1] !== "end"))
                            ) {
                                if (
                                    (data.token[a] !== "x}" || levels[a] < 0) &&
                                    (a < len - 1 && (
                                        data.types[a + 1] === "comment" ||
                                        (data.token[a] !== "." && data.types[a + 1] !== "separator")
                                    ))
                                ) {
                                    do {
                                        nl(0, true);
                                        data.lines[a] = data.lines[a] - 1;
                                    } while (data.lines[a] > 1);
                                    if (data.types[a] === "comment") {
                                        build.push("<em>&#xA;</em></li><li class=\"c0\">");
                                    } else {
                                        commentfix = commentfix + 1;
                                        nl(levels[a], true);
                                    }
                                }
                            }
                        }
                        if (
                            (data.token[a] === ";" || data.token[a] === "x;") &&
                            data.token[a + 1] === "x}" &&
                            ((/<em\u0020class="s\d+">\}<\/em>/).test(data.token[a + 2]) === true || data.token[a + 2] === "x}")
                        ) {
                            rl(indent);
                        } else if (data.token[a] === "x{" && levels[a] === -10 && levels[a - 1] === -10) {
                            build.push("");
                        } else if (a < len - 1 && data.types[a + 1] === "comment" && options.comments === "noindent") {
                            nl(options.inlevel, false);
                        } else if (levels[a] === -10 && data.token[a] !== "x}") {
                            build.push(" ");
                        } else if (
                            data.token[a] !== "" &&
                            levels[a] !== -20 &&
                            (data.token[a] !== "x}" || (
                                data.token[a] === "x}" &&
                                (data.token[a - 1] === "x;" || data.token[a - 1] === ";") &&
                                data.types[a + 1] !== "word"
                            ) || data.lines[a] > 1)) {
                            indent = levels[a];
                            nl(indent, false);
                        }
                        if (folderItem.length > 0) {
                            if (a === folderItem[folderItem.length - 1][1] && comfold === -1) {
                                foldclose();
                            }
                        }
                        a = a + 1;
                    } while (a < len);
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
                        build[build.length - 1] = "<em>&#xA;</em></li>";
                    } else if (last.indexOf("</li>") < 0) {
                        build.push("<em>&#xA;</em></li>");
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
                    if (options.jsscope === "html") {
                        code.push(last);
                        if (options.newline === true) {
                            if (options.crlf === true) {
                                code.push("\r\n");
                            } else {
                                code.push("\n");
                            }
                        }
                        return code.join("");
                    }
                    return [
                        "<p>Scope analysis does not provide support for undeclared variables.</p>",
                        "<p><em>",
                        scolon,
                        "</em> instances of <strong>missing semicolons</strong> counted.</p>",
                        "<p><em>",
                        news,
                        "</em> unnecessary instances of the keyword <strong>new</strong> counted.</p>",
                        code.join(""),
                        last
                    ].join("").replace(/(\s+)$/, "").replace(options.binaryCheck, "");
                }
                do {
                    const nl = function beautify_script_output_nl(tabs):string {
                        const linesout:string[] = [],
                            end:string = (options.crlf === true)
                                ? "\r\n"
                                : "\n",
                            total:number = Math.min((data.lines[a + 1] - 1), pres);
                        let index = 0;
                        if (tabs < 0) {
                            tabs = 0;
                        }
                        do {
                            linesout.push(end);
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
                    };
                    if (data.token[a].length === 1 || data.token[a].charAt(0) !== "x") {
                        build.push(data.token[a]);
                        if (levels[a] > -20) {
                            if (levels[a] === -10) {
                                build.push(" ");
                            } else {
                                build.push(nl(levels[a]));
                            }
                        }
                    }
                    a = a + 1;
                } while (a < len);
                return build.join("");
            }());
        return output;
    };
    module.exports = script;
}());