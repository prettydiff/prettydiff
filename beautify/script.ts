/*global global*/
(function beautify_script_init():void {
    "use strict";
    const script = function beautify_script():string {
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
        const data:parsedArray = options.parsed,
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
                            for (aa = 0; aa < bb; aa = aa + wrap) {
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
                            }
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
                        } else if (data.lines[a - 1] === 0 && data.types[a - 1] !== "comment" && data.types[a - 1] !== "comment-inline") {
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
                                        if (data.token[c] === ";" || data.token[c] === "," || data.types[c] === "operator" || data.token[c] === "return" || data.token[c] === "break" || data.token[c] === "continue" || data.types[c] === "comment" || data.types[c] === "comment-inline") {
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
                                for (e = c; e < a; e = e + 1) {
                                    if (data.token[e] === "." && data.begin[e] === d) {
                                        level[e - 1] = indent;
                                    } else if (level[e] > -9) {
                                        level[e] = level[e] + 1;
                                    }
                                }
                                level[a - 1] = indent;
                                ei.push(a);
                            };
                        if (ctoke === "::") {
                            level[a - 1] = -20;
                            level.push(-20);
                            return;
                        }
                        if ((options.methodchain === "chain" || (options.methodchain === "none" && data.lines[a] < 1)) && data.types[a - 1] === "comment-inline" && a > 1) {
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
                                    data.types[c] = "comment-inline";
                                    a        = a - 1;
                                    break;
                                }
                                c = c + 1;
                            } while (c < d);
                            data.token[c - 1] = last;
                            data.types[c - 1] = "comment-inline";
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
                            if ((options.methodchain === "chain" || (options.methodchain === "none" && data.lines[a] < 1)) && ltype !== "comment" && ltype !== "comment-inline") {
                                level[a - 1] = -20;
                            } else {
                                if (data.token[data.begin[a]] !== "(" && data.token[data.begin[a]] !== "x(" && (data.types[a + 2] === "start" || ltoke === ")" || (data.token[ei[ei.length - 1]] !== "."))) {
                                    if (data.token[ei[ei.length - 1]] !== "." && options.nochainindent === false) {
                                        propertybreak();
                                    } else {
                                        level[a - 1] = indent;
                                    }
                                } else if (data.token[ei[ei.length - 1]] === ".") {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = -20;
                                }
                            }
                            if (data.types[a - 1] === "comment" || data.types[a - 1] === "comment-inline") {
                                if (ei[ei.length - 1] > 0) {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = indent + 1;
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
                                                for (d = a - 2; d > c; d = d - 2) {
                                                    if (data.token[d] !== "+") {
                                                        break;
                                                    }
                                                    if (data.token[d - 1].charAt(0) !== "\"" && data.token[d - 1].charAt(0) !== "'") {
                                                        level[d] = -10;
                                                    }
                                                }
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
                        const deep:string   = data.stack[a],
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
                            if (data.types[a - 1] !== "comment" && data.types[a - 1] !== "comment-inline") {
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
                            if (ltype === "end" && deeper !== "if" && deeper !== "for" && deeper !== "catch" && deeper !== "else" && deeper !== "do" && deeper !== "try" && deeper !== "finally" && deeper !== "catch") {
                                if (data.types[a - 1] === "comment" || data.types[a - 1] === "comment-inline") {
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
                            } else if (data.types[a - 1] !== "comment" && data.types[a - 1] !== "comment-inline" && data.stack[a - 1] !== "attribute" && (ltype === "end" || ltype === "word")) {
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
                            if (data.types[a - 1] !== "comment" && data.types[a - 1] !== "comment-inline" && ltoke !== "{" && ltoke !== "x{" && ltype !== "end" && ltype !== "literal" && ltype !== "separator" && ltoke !== "++" && ltoke !== "--" && varline[varline.length - 1] === false && (a < 2 || data.token[a - 2] !== ";" || data.token[a - 2] !== "x;" || ltoke === "break" || ltoke === "return")) {
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
                                    if (data.token[c] !== build[build.length - 1]) {
                                        build.push(data.token[c]);
                                    } else if (d === 1 && data.token[c] === ")") {
                                        paren = true;
                                    } else if (d === 1 && paren === true && data.types[c] === "word" && data.token[c] !== build[build.length - 1]) {
                                        build.push(data.token[c]);
                                    }
                                    if (c === lettest) {
                                        build   = [];
                                        lettest = -1;
                                    }
                                    if (c > 0 && data.token[c - 1] === "function" && data.types[c] === "word" && data.token[c] !== build[build.length - 1]) {
                                        build.push(data.token[c]);
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
                        } else if ((data.types[a - 1] === "comment" && data.token[a - 1].substr(0, 2) === "//") || data.types[a - 1] === "comment-inline") {
                            if (data.token[a - 2] === "x}") {
                                level[a - 3] = indent + 1;
                            }
                            level[a - 1] = indent;
                            level.push(-20);
                        } else if (data.types[a - 1] !== "comment" && data.types[a - 1] !== "comment-inline" && ((ltoke === "{" && ctoke === "}") || (ltoke === "[" && ctoke === "]"))) {
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
                        if (data.types[a - 1] !== "comment" && data.types[a - 1] !== "comment-inline") {
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
                            let c:number       = 0,
                                nextish:string = (typeof next === "string")
                                    ? next
                                    : "",
                                apiword:string[] = (nextish === "")
                                    ? []
                                    : [
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
                                    ],
                                apilen:number  = apiword.length;
                            do {
                                if (nextish === apiword[c]) {
                                    break;
                                }
                                c = c + 1;
                            } while(c < apilen);
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
                    ctype = data.types[a];
                    ctoke = data.token[a];
                    if (ctype === "comment") {
                        comment();
                    } else if (ctype === "comment-inline") {
                        commentInline();
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
                    if (ctype !== "comment" && ctype !== "comment-inline") {
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
                    pres:number = options.preserve + 1,
                    nl = function beautify_script_output_nl(tabs):string {
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
                let a:number = 0;
                do {
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
    global.prettydiff.beautify.script = script;
}());