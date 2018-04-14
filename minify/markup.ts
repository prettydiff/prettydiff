/*global global, prettydiff*/
(function minify_markup_init():void {
    "use strict";
    const markup = function minify_markup(options:any):string {
        const data:parsedArray = options.parsed,
            lexer:string = "markup",
            c:number            = (options.end < 1)
                ? data.token.length
                : options.end,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            levels:number[] = (function minify_markup_levels():number[] {
                const level:number[]      = (options.start > 0)
                        ? Array(options.start).fill(0, 0, options.start)
                        : [],
                    nextIndex = function minify_markup_levels_next():number {
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
                    comment = function minify_markup_levels_comment():void {
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
                        do {
                            level.push(-20);
                            x = x - 1;
                        } while (x > comstart);
                        if (test === true) {
                            if (data.types[x] === "attribute" || data.types[x] === "jsx_attribute_start") {
                                level[data.begin[x]] = -10;
                            } else {
                                level[x] = -10;
                            }
                        } else {
                            level[x] = -20;
                        }
                        comstart = -1;
                    };
                let a:number     = options.start,
                    next:number = 0,
                    comstart:number = -1,
                    skip:number     = 0;
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
                            if (data.lines[next] > 0 && (
                                data.types[a] === "content" ||
                                data.types[a] === "singleton" ||
                                data.types[next] === "content" ||
                                data.types[next] === "singleton"
                            )) {
                                level.push(-10);
                            } else {
                                level.push(-20);
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
        return (function minify_markup_apply():string {
            const build:string[]        = [],
                len:number = levels.length,
                // a new line character plus the correct amount of identation for the given line
                // of code
                attribute = function minify_markup_apply_attribute():void {
                    const end:string[]|null = (/\/?>$/).exec(data.token[a]),
                        findEnd = function minify_markup_apply_attribute_findEnd() {
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
                                minify_markup_apply_attribute_findEnd();
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
            if (options.topcoms === true && data.types[a] === "comment") {
                if (a > 0) {
                    build.push(lf);
                }
                do {
                    build.push(data.token[a]);
                    build.push(lf);
                    a = a + 1;
                } while (a < len && data.types[a] === "comment");
            }
            do {
                if (data.lexer[a] === lexer || prettydiff.minify[data.lexer[a]] === undefined) {
                    if (a < len - 1 && data.types[a + 1].indexOf("attribute") > -1 && data.types[a].indexOf("attribute") < 0) {
                        attribute();
                    }
                    if (data.types[a] !== "comment") {
                        build.push(data.token[a]);
                        if ((data.types[a] === "template" || data.types[a] === "template_start") && data.types[a - 1] === "content" && data.presv[a - 1] === true && options.mode === "minify" && levels[a] === -20) {
                            build.push(" ");
                        }
                        if (levels[a] > -1) {
                            lastLevel = levels[a];
                        } else if (levels[a] === -10) {
                            build.push(" ");
                        }
                    }
                } else {
                    options.end = levels[a];
                    options.inlevel = lastLevel + 1;
                    options.start = a;
                    external = prettydiff.minify[data.lexer[a]](options).replace(/\s+$/, "");
                    build.push(external);
                    a = levels[a] - 1;
                }
                a = a + 1;
            } while (a < len);
            if (build[0] === lf || build[0] === " ") {
                build[0] = "";
            }
            if (options.newline === true && options.end === data.token.length) {
                build.push(lf);
            }
            return build.join("");
        }());
    };
    global.prettydiff.minify.markup = markup;
}());