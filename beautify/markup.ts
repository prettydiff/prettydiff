/*global global, prettydiff*/
(function beautify_markup_init():void {
    "use strict";
    const markup = function beautify_markup(options:any):string {
        const data:parsedArray = options.parsed,
            lexer:string = "markup",
            c:number            = (options.end < 1 || options.end > data.token.length)
                ? data.token.length
                : options.end,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            levels:number[] = (function beautify_markup_levels():number[] {
                const level:number[]      = (options.start > 0)
                        ? Array(options.start).fill(0, 0, options.start)
                        : [],
                    nextIndex = function beautify_markup_levels_next():number {
                        let x:number = a + 1,
                            y:number = 0;
                        if (data.types[x] === "comment" || data.types[x] === "attribute" || data.types[x] === "jsx_attribute_start") {
                            do {
                                if (data.types[x] === "jsx_attribute_start") {
                                    y = x;
                                    do {
                                        if (data.types[x] === "jsx_attribute_end" && data.begin[x] === y) {
                                            break;
                                        }
                                        x = x + 1;
                                    } while (x < c);
                                } else if (data.types[x] !== "comment" && data.types[x] !== "attribute") {
                                    return x;
                                }
                                x = x + 1;
                            } while (x < c);
                        }
                        return x;
                    },
                    comment = function beautify_markup_levels_comment():void {
                        let x:number = a,
                            test:boolean = false;
                        if (data.lines[a + 1] === 0) {
                            do {
                                if (data.lines[x] > 0) {
                                    test = true;
                                    break;
                                }
                                x = x - 1;
                            } while (x > comstart);
                            x = a;
                        } else {
                            test = true;
                        }

                        // the first condition applies indentation while the else block does not
                        if (test === true) {
                            let ind = (data.types[next] === "end" || data.types[next] === "template_end")
                                ? indent + 1
                                : indent;
                            do {
                                level.push(ind);
                                x = x - 1;
                            } while (x > comstart);

                            // correction so that a following end tag is not indented 1 too much
                            if (ind === indent + 1) {
                                level[a] = indent;
                            }

                            // indentation must be applied to the tag preceeding the comment
                            if (data.types[x] === "attribute" || data.types[x] === "jsx_attribute_start") {
                                level[data.begin[x]] = ind;
                            } else {
                                level[x] = ind;
                            }
                        } else {
                            do {
                                level.push(-20);
                                x = x - 1;
                            } while (x > comstart);
                            level[x] = -20;
                        }
                        comstart = -1;
                    };
                let a:number     = options.start,
                    comstart:number = -1,
                    next:number = 0,
                    skip:number     = 0,
                    indent:number       = (isNaN(options.inlevel) === true)
                        ? 0
                        : Number(options.inlevel);
                // data.lines -> space before token
                // level -> space after token
                do {
                    if (data.lexer[a] === lexer) {
                        if (data.types[a] === "attribute") {
                            level.push(-10);
                        } else if (data.types[a] === "jsx_attribute_start") {
                            level.push(-20);
                        } else if (data.types[a] === "jsx_attribute_end") {
                            level.push(-10);
                        } else if (data.types[a] === "comment") {
                            if (comstart < 0) {
                                comstart = a;
                            }
                            if (data.types[a + 1] !== "comment") {
                                comment();
                            }
                        } else if (data.types[a] !== "comment") {
                            next = nextIndex();
                            if (data.types[next] === "end" || data.types[next] === "template_end") {
                                indent = indent - 1;
                            }
                            if (data.lines[next] === 0 && (data.types[a] === "content" || data.types[a] === "singleton")) {
                                level.push(-20);
                            } else if (data.types[a] === "start" || data.types[a] === "template_start") {
                                indent = indent + 1;
                                if (data.types[a] === "start" && data.types[next] === "end") {
                                    level.push(-20);
                                } else if (data.types[a] === "template_start" && data.types[next] === "template_end") {
                                    level.push(-20);
                                } else if (data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                    level.push(-20);
                                } else {
                                    level.push(indent);
                                }
                            } else if (data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                level.push(-20);
                            } else {
                                level.push(indent);
                            }
                        }
                    } else {
                        if (data.lexer[a - 1] === lexer) {
                            skip = a;
                            do {
                                if (data.lexer[skip + 1] === lexer && data.lexer[data.begin[skip + 1]] === lexer) {
                                    break;
                                }
                                skip = skip + 1;
                            } while (skip < c);
                            level.push(skip + 1);
                        } else {
                            level.push(skip);
                        }
                    }
                    a = a + 1;
                } while (a < c);
                return level;
            }());
        return (function beautify_markup_apply():string {
            const build:string[]        = [],
                len:number = levels.length,
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
                nl           = function beautify_markup_apply_nl(tabs:number):string {
                    const linesout:string[] = [],
                        pres:number = options.preserve + 1,
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
                            linesout.push(ind);
                            index = index + 1;
                        } while (index < tabs);
                    }
                    return linesout.join("");
                },
                attribute = function beautify_markup_apply_attribute():void {
                    const end:string[]|null = (/\/?>$/).exec(data.token[a]),
                        findEnd = function beautify_markup_apply_attribute_findEnd() {
                            const begin:number = y;
                            if (data.types[y] === "jsx_attribute_start") {
                                do {
                                    if (data.types[y] === "jsx_attribute_end" && data.begin[y] === begin) {
                                        break;
                                    }
                                    y = y + 1;
                                } while (y < len);
                            }
                            y = y + 1;
                            if (data.types[y] === "attribute" || data.types[y] === "jsx_attribute_start") {
                                beautify_markup_apply_attribute_findEnd();
                            } else {
                                levels[y - 1] = lev;
                                data.token[y - 1] = data.token[y - 1] + ending;
                            }
                        };
                    if (end === null) {
                        return;
                    }
                    let y:number = a + 1,
                        lev:number = levels[a],
                        ending:string = end[0];
                    data.token[a] = data.token[a].replace(ending, "");
                    levels[a] = -10;
                    findEnd();
                };
            let a:number            = options.start,
                external:string = "",
                lastLevel:number = 0;
            do {
                if (data.lexer[a] === lexer) {
                    if (data.token[a] === "</prettydiffli>" && options.correct === true) {
                        data.token[a] = "</li>";
                    }
                    if (a < len - 1 && data.types[a + 1].indexOf("attribute") > -1 && data.types[a].indexOf("attribute") < 0) {
                        attribute();
                    }
                    if (data.token[a] !== "</prettydiffli>" && data.token[a].slice(0, 2) !== "//" && data.token[a].slice(0, 2) !== "/*") {
                        build.push(data.token[a]);
                        if ((data.types[a] === "template" || data.types[a] === "template_start") && data.types[a - 1] === "content" && data.presv[a - 1] === true && options.mode === "beautify" && levels[a] === -20) {
                            build.push(" ");
                        }
                        if (levels[a] > -1) {
                            lastLevel = levels[a];
                            build.push(nl(levels[a]));
                        } else if (levels[a] === -10) {
                            build.push(" ");
                        }
                    }
                } else {
                    options.end = levels[a];
                    options.inlevel = lastLevel + 1;
                    options.start = a;
                    external = nl(lastLevel + 1) + prettydiff.beautify[data.lexer[a]](options).replace(/\s+$/, "") + nl(lastLevel);
                    build.push(external);
                    a = levels[a] - 1;
                }
                a = a + 1;
            } while (a < len);
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
        }());
    };
    global.prettydiff.beautify.markup = markup;
}());