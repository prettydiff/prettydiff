/*global global*/
(function beautify_markup_init():void {
    "use strict";
    const prettydiff = global.prettydiff,
        markup = function beautify_markup(options: options):string {
            let a:number     = 0,
                indent:number       = (isNaN(options.inlevel) === true)
                    ? 0
                    : Number(options.inlevel),
                lprescount:string[]   = [],
                ltype:string        = "",
                lline:number        = 0,
                cdataS:string       = "",
                cdataE:string       = "",
                commentS:string     = "",
                commentE:string     = "",
                tabs:string         = "",
                lf                  = (options.crlf === true)
                    ? "\r\n"
                    : "\n";
            const data:parsedArray = options.parsed,
                c:number            = data.token.length,
                cdataStart:RegExp   = (/^(\s*(\/)*<!?\[+[A-Z]+\[+)/),
                cdataEnd:RegExp     = (/((\/)*\]+>\s*)$/),
                commentStart:RegExp = (/^(\s*<!--)/),
                commentEnd:RegExp   = (/((\/\/)?-->\s*)$/),
                twigStart:RegExp    = (/^(\{%\s+)/),
                twigEnd:RegExp      = (/(\s%\})$/),
                level:number[]      = [],
                tab          = (function beautify_markup_tab():RegExp {
                    let b:number   = options.insize;
                    const ind:string[] = [],
                        inchar:string = options.inchar;
                    do {
                        ind.push(inchar);
                        b = b - 1;
                    } while (b > 0);
                    return new RegExp("^(" + ind.join("") + "+)");
                }()),
                extlib      = function beautify_markup_extlib(type:string):string {
                    let result:string = "";
                    const newline:boolean = options.newline;
                    if (type === "script" && typeof prettydiff.beautify[type] !== "function") {
                        return options.source;
                    }
                    options.newline = false;
                    result = prettydiff.beautify[type](options);
                    options.newline = newline;
                    return result;
                },
                tagName     = function beautify_markup_tagName(el:string):string {
                    const space:number = el
                            .replace(/^(\{((%-?)|\{-?)\s*)/, "%")
                            .replace(/\s+/, " ")
                            .indexOf(" ");
                    let name:string  = (space < 0)
                            ? el
                                .replace(/^(\{((%-?)|\{-?)\s*)/, " ")
                                .slice(1, el.length - 1)
                                .toLowerCase()
                            : el
                                .replace(/^(\{((%-?)|\{-?)\s*)/, " ")
                                .slice(1, space)
                                .toLowerCase();
                    name = name.replace(/(\}\})$/, "");
                    if (name.indexOf("(") > 0) {
                        name = name.slice(0, name.indexOf("("));
                    }
                    return name;
                },
                xslline      = function beautify_markup_xslline():void {
                    if (data.lines[a] > 1 || (data.types[a] !== "start" && data.types[a] !== "singleton") || (data.types[a - 1] === "comment" && data.lines[a - 1] > 1)) {
                        return;
                    }
                    if (tagName(data.token[a]).indexOf("xsl:") !== 0) {
                        return;
                    }
                    if (data.types[a] === "start") {
                        data.lines[a] = 2;
                    } else if (data.types[a - 1] !== "start" || data.types[a + 1] !== "end" || (data.types[a - 1] !== "start" && data.types[a + 1] !== "end")) {
                        data.lines[a] = 2;
                    }
                },
                end          = function beautify_markup_end():number {
                    let b:number = 0;
                    indent = indent - 1;
                    if ((data.types[a] === "end" && ltype === "start") || (data.types[a] === "template_end" && ltype === "template_start") || (options.lang === "jsx" && (/^\s+\{/).test(data.token[a - 1]) === true && data.lines[a] === 0)) {
                        return level.push(-20);
                    }
                    if (data.lines[a] < 1 && options.lang === "html" && a > 0 && tagName(data.token[a - 1]) === "/span") {
                        b = a;
                        do {
                            b = b - 1;
                        } while (data.lines[b] < 1);
                        if (data.types[b] === "content" || data.types[b] === "singleton" || data.types[b] === "start" || data.types[b] === "comment" || data.types[b].indexOf("template") > -1) {
                            level[a - 1] = -20;
                            return level.push(-20);
                        }
                    }
                    if (options.force_indent === false) {
                        if (data.lines[a] === 0 && (ltype === "singleton" || ltype === "content" || (ltype === "template" && data.types[a] !== "template_end"))) {
                            return level.push(-20);
                        }
                        if (ltype === "comment") {
                            b = a - 1;
                            if (b > -1) {
                                do {
                                    if (data.types[b] !== "comment") {
                                        if (data.lines[b + 1] === 0 && (data.types[b] === "singleton" || data.types[b] === "content")) {
                                            do {
                                                level[b] = -20;
                                                b = b + 1;
                                            } while (b < a);
                                            return level.push(-20);
                                        }
                                        return level.push(indent);
                                    }
                                    b = b - 1;
                                } while (b > -1);
                            }
                        }
                        return level.push(indent);
                    }
                    return level.push(indent);
                },
                content      = function beautify_markup_content():number {
                    let b:number = 0;
                    const spanfix = function beautify_markup_content_spanfix():void {
                            b = b - 1;
                            if (data.types[b] === "comment") {
                                do {
                                    b = b - 1;
                                } while (b > 0 && data.types[b] === "comment" && data.lines[b] < 1);
                            }
                            if (data.lines[b] === 0 && tagName(data.token[b]) === "span" && (tagName(data.token[b - 1]) === "span" || tagName(data.token[b - 1]) === "/span")) {
                                do {
                                    level[b] = -20;
                                    b        = b - 1;
                                } while (
                                    b > 0 && data.lines[b] < 1 && (tagName(data.token[b]) === "span" || data.types[b] === "comment")
                                );
                            }
                        };
                    if (data.lines[a] === 0 && options.force_indent === false && (data.presv[a] === false || data.types[a] !== "content")) {
                        if (ltype === "comment" && lline === 0) {
                            b = a - 1;
                            if (b > -1) {
                                do {
                                    if (data.types[b - 1] !== "comment" && data.types[b] === "comment") {
                                        if (data.lines[b] === 0) {
                                            do {
                                                level[b] = -20;
                                                b = b + 1;
                                            } while (b < a);
                                            if (options.lang === "html" && tagName(data.token[data.begin[a]]) === "span") {
                                                spanfix();
                                            }
                                            return level.push(-20);
                                        }
                                        return level.push(indent);
                                    }
                                    if (data.lines[b] > 0) {
                                        return level.push(indent);
                                    }
                                    b = b - 1;
                                } while (b > -1);
                            }
                            return level.push(indent);
                        }
                        if (options.lang === "html" && data.begin[a] > -1 && tagName(data.token[data.begin[a]]) === "span") {
                            b = a;
                            spanfix();
                        }
                        return level.push(-20);
                    }
                    return level.push(indent);
                },
                script       = function beautify_markup_script(twig:boolean):void {
                    let list:string[]    = [],
                        inle:number    = options.inlevel,
                        mode:mode    = options.mode,
                        source:string  = "";
                    const twigfix = function beautify_markup_script_twigfix(item:string):string {
                            const fixnumb = function beautify_markup_script_twigfix_fixnumb(xx:string):string {
                                return xx.replace(". .", "..");
                            };
                            item = item
                                .replace(tab, "")
                                .replace(/\)\s*and\s*\(/g, ") and (")
                                .replace(/in\u0020?\(?\d+\.\u0020\.\d\(?/g, fixnumb);
                            if (options.correct === true) {
                                item = item.replace(/;$/, "") + " %}";
                            } else {
                                item = item + " %}";
                            }
                            return "{% " + item;
                        };
                    if (twig === true) {
                        options.lang = "twig";
                        data.token[a]     = data.token[a]
                            .replace(twigStart, "")
                            .replace(twigEnd, "");
                    }
                    if (cdataStart.test(data.token[a]) === true) {
                        cdataS   = cdataStart
                            .exec(data.token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        data.token[a] = data.token[a].replace(cdataStart, "");
                    } else if (commentStart.test(data.token[a]) === true) {
                        commentS = commentStart
                            .exec(data.token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        data.token[a] = data.token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(data.token[a]) === true) {
                        cdataE   = cdataEnd.exec(data.token[a])[0];
                        data.token[a] = data.token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(data.token[a]) === true) {
                        commentE = commentEnd.exec(data.token[a])[0];
                        data.token[a] = data.token[a].replace(commentEnd, "");
                    }
                    source          = data.token[a].replace(/^(\s+)/, "");
                    options.source  = source;
                    options.inlevel = (options.style === false)
                        ? 0
                        : indent;
                    options.mode    = "beautify";
                    data.token[a]        = extlib("script");
                    options.inlevel = inle;
                    options.mode    = mode;
                    list            = tab.exec(data.token[a]);
                    if (list !== null) {
                        tabs = list[0];
                    }
                    if (cdataS !== "") {
                        data.token[a] = tabs + cdataS + data.token[a];
                        cdataS   = "";
                    } else if (commentS !== "") {
                        data.token[a] = tabs + commentS + data.token[a];
                        commentS = "";
                    }
                    if (cdataE !== "") {
                        data.token[a] = data.token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        data.token[a] = data.token[a] + lf + tabs + commentE;
                        commentE = "";
                    }
                    if ((/^(\s+\{)/).test(data.token[a]) === true && options.lang === "jsx") {
                        if (ltype === "content" || ltype === "singleton" || ltype === "template") {
                            data.token[a] = data.token[a].replace(/^(\s+)/, "");
                            if (data.lines[a] < 1) {
                                level.push(-20);
                            } else {
                                level.push(-10);
                            }
                        } else {
                            data.token[a] = data.token[a].replace(/^(\s+)/, "");
                            if (data.lines[a] === 0) {
                                level.push(-20);
                            } else {
                                level.push(indent);
                                data.token[a] = data.token[a].replace(/(\r?\n\})$/, lf + tabs + "}");
                            }
                        }
                        if (data.token[a].indexOf(";") < 0 && data.token[a].replace(/^(\{\s+)/, "").replace(/(\s+\})$/, "").indexOf("\n") < 0) {
                            data.token[a] = data.token[a]
                                .replace(/^(\{\s+)/, "{")
                                .replace(/(\s+\})$/, "}");
                        }
                    } else if (twig === true && data.lines[a] === 0) {
                        level.push(-20);
                        data.types[a] = "singleton";
                    } else if (twig === true) {
                        data.token[a] = twigfix(data.token[a]);
                    } else {
                        level.push(0);
                    }
                },
                style        = function beautify_markup_style():void {
                    let list = [],
                        inle = options.inlevel,
                        mode = options.mode;
                    if (cdataStart.test(data.token[a]) === true) {
                        cdataS   = cdataStart
                            .exec(data.token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        data.token[a] = data.token[a].replace(cdataStart, "");
                    } else if (commentStart.test(data.token[a]) === true) {
                        commentS = commentStart
                            .exec(data.token[a])[0]
                            .replace(/^\s+/, "") + lf;
                        data.token[a] = data.token[a].replace(commentStart, "");
                    }
                    if (cdataEnd.test(data.token[a]) === true) {
                        cdataE   = cdataEnd.exec(data.token[a])[0];
                        data.token[a] = data.token[a].replace(cdataEnd, "");
                    } else if (commentEnd.test(data.token[a]) === true) {
                        commentE = commentEnd.exec(data.token[a])[0];
                        data.token[a] = data.token[a].replace(commentEnd, "");
                    }
                    options.inlevel = (options.style === false)
                        ? 0
                        : indent;
                    options.mode    = "beautify";
                    options.source  = data.token[a].replace(/^(\s+)/, "");
                    data.token[a]        = extlib("style");
                    options.inlevel = inle;
                    options.mode    = mode;
                    list            = tab.exec(data.token[a]);
                    if (list !== null) {
                        tabs = list[0];
                    }
                    if (cdataS !== "") {
                        data.token[a] = tabs + cdataS + data.token[a];
                        cdataS   = "";
                    } else if (commentS !== "") {
                        data.token[a] = tabs + commentS + data.token[a];
                        commentS = "";
                    }
                    if (cdataE !== "") {
                        data.token[a] = data.token[a] + lf + tabs + cdataE;
                        cdataE   = "";
                    } else if (commentE !== "") {
                        data.token[a] = data.token[a] + lf + tabs + commentE;
                        commentE = "";
                    }
                    data.token[a] = data.token[a].replace(/(\s+)$/, "");
                    level.push(0);
                },
                apply        = function beautify_markup_apply():string {
                    const build:string[]        = [],
                        y:number = level.length,
                        //tab builds out the character sequence for one step of indentation
                        ind          = (function beautify_markup_apply_tab():string {
                            const indy:string[] = [options.inchar],
                                size:number = options.insize - 1;
                            let aa:number   = 0;
                            if (aa < size) {
                                do {
                                    indy.push(options.inchar);
                                    aa = aa + 1;
                                } while (aa < size);
                            }
                            return indy.join("");
                        }()),
                        // a new line character plus the correct amount of identation for the given line
                        // of code
                        nl           = function beautify_markup_apply_nl(indy:number, item:string[]):void {
                            let aa:number          = 0;
                            const indentation:string[] = [lf];
                            if (options.mode === "minify") {
                                build.push(lf);
                                return;
                            }
                            if (indy === -10) {
                                item.push(" ");
                            } else if (indy > -9) {
                                if (data.lines[x] > 1 && item === build) {
                                    do {
                                        data.lines[x] = data.lines[x] - 1;
                                        indentation.push(lf);
                                    } while (data.lines[x] > 1);
                                }
                                if (aa < indy) {
                                    do {
                                        indentation.push(ind);
                                        aa = aa + 1;
                                    } while (aa < indy);
                                }
                                item.push(indentation.join(""));
                            }
                        },
                        // populates attributes onto start and singleton tags it also checks to see if a
                        // tag or content should wrap
                        wrapper      = function beautify_markup_apply_wrapper():void {
                            const list:string[] = data.token[x].replace(/\s+/g, " ").split(" "),
                                len:number = list.length;
                                //tname:string  = tagName(data.token[x]),
                            let b:number      = 0,
                                xlen:number   = 0,
                                lev:number    = level[x],
                                string:string = "",
                                text:string[]   = [];
                            if (lev === -20) {
                                b = x;
                                do {
                                    b    = b - 1;
                                    lev  = level[b];
                                    xlen = xlen + data.token[b].length;
                                } while (lev === -20 && b > -1);
                                if (lev === -20) {
                                    lev = 1;
                                }
                            }
                            if (lev === 0) {
                                lev = lev + options.inlevel;
                            }
                            if (level[x] === -20 && data.types[x - 1] === "end") {
                                b   = x - 1;
                                lev = 1;
                                do {
                                    b = b - 1;
                                    if (data.types[b] === "start") {
                                        lev = lev - 1;
                                    } else if (data.types[b] === "end") {
                                        lev = lev + 1;
                                    }
                                } while (lev > 0 && b > 0);
                                lev = level[b];
                            }
                            b = 0;
                            do {
                                string = string + list[b];
                                if (list[b + 1] !== undefined && string.length + list[b + 1].length + 1 > options.wrap - xlen) {
                                    text.push(string);
                                    xlen = 0;
                                    if (level[x] === -20 && data.types[x - 1] !== "end") {
                                        nl(lev + 1, text);
                                    } else {
                                        nl(lev, text);
                                    }
                                    string = "";
                                } else {
                                    string = string + " ";
                                }
                                b = b + 1;
                            } while (b < len);
                            text.push(string.replace(/\s$/, ""));
                            data.token[x] = text.join("");
                            if (data.types[x] === "singleton") {
                                if (options.spaceclose === true) {
                                    data.token[x] = data.token[x].replace(/(\u0020*\/>)$/, " />");
                                } else {
                                    data.token[x] = data.token[x].replace(/(\u0020*\/>)$/, "/>");
                                }
                            }
                        },
                        /*// JSX tags may contain comments, which are captured as attributes in this
                        // parser.  These attributes demand unique care to be correctly applied.
                        attrcom      = function beautify_markup_apply_attrcom():void {
                            const toke:string[]  = data.token[x].split(" "),
                                attr:string = data.token[x],
                                item :string[] = [toke[0]],
                                tempx:string[] = [];
                            let ilen:number  = 0,
                                index:number = 0,
                                b:number     = 0,
                                xx:number    = 0,
                                yy:number    = 0,
                                temp:string[]  = [];
                            nl(level[x], build);
                            index = data.token[x].indexOf("\n");
                            if (index > 0 && index !== attr.length - 1 && attr.indexOf("/*") === 0) {
                                temp = (lf === "\r\n")
                                    ? attr.split("\r\n")
                                    : attr.split("\n");
                                yy   = temp.length;
                                do {
                                    if (temp[xx] === "") {
                                        temp[xx] = lf;
                                    } else {
                                        nl(level[x] + 1, tempx);
                                        tempx.push(temp[xx].replace(/^(\s+)/, ""));
                                    }
                                    xx = xx + 1;
                                } while (xx < yy);
                                tempx.push(lf);
                                data.token[x] = tempx.join("");
                            }
                            if (b > 0 && attr[b - 1].charAt(attr[b - 1].length - 1) === "\n" && (/^(\s*\/\/)/).test(attr[b]) === false) {
                                nl(level[x] + 1, item);
                                ilen       = item.length - 1;
                                item[ilen] = item[ilen].slice(1);
                            } else if ((/^\s/).test(attr[b]) === false && (/^(\s*\/\/)/).test(attr[b - 1]) === false) {
                                item.push(" ");
                            }
                            item.push(attr[b]);
                            if (attr.charAt(attr.length - 1) === "\n") {
                                nl(level[x], item);
                                ilen       = item.length - 1;
                                item[ilen] = item[ilen].slice(1);
                            }
                            item.push(toke[1]);
                            build.push(item.join(""));
                        },
                        jsxattribute = function beautify_markup_apply_jsxattribute():void {
                            let attr     = Object.keys(attrs[x]),
                                b:number        = 0,
                                yy:number       = 0,
                                xx:number       = attr.length,
                                inle:number     = options.inlevel,
                                mode:mode     = options.mode,
                                vertical:boolean = options.vertical,
                                builder:string  = "";
                            const inlevel:number  = (level[x] < 1)
                                    ? options.inlevel + 1
                                    : level[x] + 1;
                            if (data.token[x].charAt(0) === "{") {
                                options.mode      = "beautify";
                                options.inlevel   = inlevel;
                                options.source    = data.token[x].slice(1, data.token[x].length - 1);
                                attrs[x][attr[b]] = extlib("script");
                                options.mode      = mode;
                                options.inlevel   = inle;
                                options.vertical  = vertical;
                                attrib[b]         = attr[b] + "={" + attrs[x][attr[b]].replace(/^\s+/, "") + "}";
                            } else if (attr[b].charAt(0) === "/" && attr[b].charAt(1) === "/" && attr[b].charAt(attr[b].length - 1) === "\n") {
                                builder = "";
                                yy      = inlevel;
                                do {
                                    builder = builder + ind;
                                    yy      = yy - 1;
                                } while (yy > 0);
                                if (b < attrib.length - 1) {
                                    builder = lf + builder + attr[b].slice(0, attr[b].length - 1) + lf +
                                            builder;
                                } else {
                                    builder = lf + builder + attr[b].slice(0, attr[b].length - 1) + lf;
                                }
                                attrib[b] = builder;
                            }
                        },*/
                        linepreserve = function beautify_markup_apply_linepreserve():void {
                            let aa:number   = 0;
                            const taby = new RegExp("^(" + ind + "+)"),
                                out:string[]  = [],
                                str:string  = data.token[x]
                                    .replace(/\r\n/g, "\n")
                                    .replace(/^(\n)/, ""),
                                item:string[] = str.split("\n"),
                                bb:number   = item.length;
                            data.lines[x] = 1;
                            do {
                                item[aa] = item[aa]
                                    .replace(/^(\s+)/, "")
                                    .replace(taby, "");
                                if (item[aa] === "" && item[aa - 1] !== "" && aa < bb - 1) {
                                    nl(0, out);
                                } else if (item[aa] !== "") {
                                    if (aa > 0) {
                                        nl(level[x], out);
                                    }
                                    if (item[aa].indexOf(ind) === 0) {
                                        do {
                                            item[aa] = item[aa].slice(ind.length);
                                        } while (item[aa].indexOf(ind) === 0);
                                    }
                                    out.push(item[aa].replace(/(\s+)$/, ""));
                                }
                                aa = aa + 1;
                            } while (aa < bb);
                            if (out[out.length - 1] === "") {
                                out.pop();
                            }
                            if (data.types[x + 1] === "template_end" && out[out.length - 1].indexOf(ind) > 0 && (/^(\s+)$/).test(out[out.length - 1]) === false) {
                                out.pop();
                            }
                            data.token[x] = out.join("");
                        };
                    let x:number            = 0;
                    do {
                        /*if (data.types[x] === "attribute" && options.lang === "jsx") {
                            if (data.token[x].slice(0, 2) === "//" || data.token[x].slice(0, 2) === "/*") {
                                attrcom();
                            }
                        } else */
                        if (data.types[x] === "content" && x < y - 1) {
                            if (data.presv[x] === true) {
                                linepreserve();
                            } else if (options.wrap > 0 && data.token[x].length > options.wrap && (options.mode === "beautify" || options.mode === "diff")) {
                                wrapper();
                            }
                        } else if (
                            data.types[x] !== "content" &&
                            options.unformatted === false &&
                            (
                                options.mode === "beautify" ||
                                options.mode === "diff"
                            ) &&
                            data.presv[x] === false &&
                            options.wrap > 0 &&
                            data.token[x].length > options.wrap &&
                            (
                                data.types[x] === "content" ||
                                data.types[x] === "start" ||
                                data.types[x] === "singleton" ||
                                data.types[x] === "template_start" ||
                                data.types[x] === "template" ||
                                data.types[x] === "comment"
                            ) && (
                                data.types[x] !== "singleton" ||
                                data.token[x].charAt(0) !== "{"
                            )
                        ) {
                            wrapper();
                        } else if (data.types[x] === "singleton") {
                            if (options.spaceclose === true) {
                                data.token[x] = data.token[x].replace(/(\u0020*\/>)$/, " />");
                            } else {
                                data.token[x] = data.token[x].replace(/(\u0020*\/>)$/, "/>");
                            }
                        }
                        if (data.token[x] === "</prettydiffli>" && options.correct === true) {
                            data.token[x] = "</li>";
                        }
                        if (data.token[x] !== "</prettydiffli>" && (data.types[x] !== "attribute" || (data.token[x].slice(0, 2) !== "//" && data.token[x].slice(0, 2) !== "/*"))) {
                            if ((data.types[x] === "template" || data.types[x] === "template_start") && data.types[x - 1] === "content" && data.presv[x - 1] === true && options.mode === "beautify" && level[x] === -20) {
                                build.push(" ");
                            }
                            if (level[x] > -9) {
                                if (options.mode === "minify") {
                                    build.push(" ");
                                } else {
                                    nl(level[x], build);
                                }
                            } else if (level[x] === -10) {
                                build.push(" ");
                            }
                            build.push(data.token[x]);
                        }
                        x = x + 1;
                    } while (x < y);
                    if (build[0] === lf || build[0] === " ") {
                        build[0] = "";
                    }
                    if (options.newline === true) {
                        if (options.crlf === true) {
                            build.push("\r\n");
                        } else {
                            build.push("\n");
                        }
                    }
                    return build.join("");
                };

            do {
                if (twigStart.test(data.token[a]) === true && twigEnd.test(data.token[a]) === true && (a === 0 || (tagName(data.token[a - 1]) !== "script" && tagName(data.token[a - 1]) !== "style")) && (/\D-+\D/).test(data.token[a]) === false && (/^(\{%\s*((comment)|(else))\s*)/).test(data.token[a]) === false) {
                    script(true);
                }
                if (data.types[a] === "start") {
                    level.push(indent);
                    indent = indent + 1;
                    xslline();
                } else if (data.types[a] === "template_start" || data.types[a] === "linepreserve") {
                    if (data.types[a] === "linepreserve") {
                        lprescount.push(tagName(data.token[a]));
                    }
                    level.push(indent);
                    indent = indent + 1;
                } else if (data.types[a] === "template_else") {
                    level.push(indent - 1);
                } else if (data.types[a] === "end") {
                    end();
                } else if (data.types[a] === "template_end") {
                    if (lprescount.length > 0 && tagName(data.token[a]) === "/" + lprescount[lprescount.length - 1]) {
                        lprescount.pop();
                    }
                    end();
                } else if (data.lines[a] === 0 && (data.types[a] === "singleton" || data.types[a] === "content" || data.types[a] === "template")) {
                    if (data.types[a] === "content" && options.textpreserve === true) {
                        level.push(-20);
                    } else {
                        content();
                    }
                    xslline();
                } else if (data.types[a] === "script" || data.types[a] === "cfscript") {
                    script(false);
                } else if (data.types[a] === "style") {
                    style();
                } else if (data.types[a] === "comment" && options.comments === false) {
                    level.push(0);
                } else if (data.types[a] === "linepreserve") {
                    level.push(indent);
                } else {
                    level.push(indent);
                    xslline();
                }
                if (data.types[a] !== "content" && data.types[a] !== "comment" && data.types[a - 1] === "content" && data.types[a - 2] !== "linepreserve" && lprescount.length > 0) {
                    level[a] = -20;
                }
                if (data.lines[a] === 0 && (ltype === "content" || (ltype === "script" && data.token[a - 1].charAt(0) === "{" && options.lang === "jsx"))) {
                    level[a] = -20;
                }
                ltype = data.types[a];
                lline = data.lines[a];
                a = a + 1;
            } while (a < c);
            level[0] = 0;
            return apply();
        };
    prettydiff.beautify.markup = markup;
}());