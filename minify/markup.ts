/*global prettydiff*/
(function minify_markup_init():void {
    "use strict";
    const markup = function minify_markup(options:any):string {
        const data:data = options.parsed,
            lexer:string = "markup",
            c:number            = (prettydiff.end < 1 || prettydiff.end > data.token.length)
                ? data.token.length
                : prettydiff.end + 1,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            externalIndex:externalIndex = {},
            levels:number[] = (function minify_markup_levels():number[] {
                const level:number[]      = (prettydiff.start > 0)
                        ? Array(prettydiff.start).fill(0, 0, prettydiff.start)
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
                    external = function minify_markup_levels_external():void {
                        let skip = a;
                        do {
                            if (data.lexer[a + 1] === lexer && data.begin[a + 1] < skip && data.types[a + 1] !== "start" && data.types[a + 1] !== "singleton") {
                                break;
                            }
                            level.push(-20);
                            a = a + 1;
                        } while (a < c);
                        externalIndex[skip] = a;
                        level.push(-20);
                        next = nextIndex();
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
                let a:number     = prettydiff.start,
                    next:number = 0,
                    comstart:number = -1;
                // data.lines -> space before token
                // level -> space after token
                do {
                    if (data.lexer[a] === lexer) {
                        if (data.types[a].indexOf("attribute") > -1) {
                            if (data.types[a] === "attribute") {
                                data.token[a] = data.token[a].replace(/\s+/g, " ");
                            }
                            if (data.types[a - 1].indexOf("attribute") < 0) {
                                level[a - 1] = -10;
                            }
                            if (data.types[a] === "comment_attribute" && data.token[a].slice(0, 2) === "//") {
                                level.push(-10);
                            } else if (data.types[a] === "jsx_attribute_start") {
                                level.push(-20);
                            } else if (data.types[a] === "jsx_attribute_end") {
                                level.push(-10);
                            } else if (a < c - 1 && data.types[a + 1].indexOf("attribute") < 0) {
                                if (data.lines[a + 1] > 0 && data.lexer[a + 1] === lexer && data.types[a + 1] !== "start" && data.types[a + 1] !== "xml" && data.types[a + 1] !== "sgml") {
                                    level.push(-10);
                                } else {
                                    level.push(-20);
                                }
                            } else {
                                level.push(-10);
                            }
                        } else if (data.types[a] === "comment") {
                            if (options.minify_keep_comments === true) {
                                level.push(0);
                            } else {
                                if (comstart < 0) {
                                    comstart = a;
                                }
                                if (data.types[a + 1] !== "comment") {
                                    comment();
                                }
                            }
                        } else if (data.types[a] !== "comment") {
                            if (data.types[a] === "content") {
                                data.token[a] = data.token[a].replace(/\s+/g, " ");
                            }
                            next = nextIndex();
                            if (data.lines[next] > 0 && (
                                data.types[a] === "content" ||
                                data.types[a] === "singleton" ||
                                data.types[next] === "content" ||
                                data.types[next] === "singleton" ||
                                (data.types[next] !== undefined && data.types[next].indexOf("attribute") > 0)
                            )) {
                                level.push(-10);
                            } else {
                                level.push(-20);
                            }
                        }
                    } else {
                        external();
                    }
                    a = a + 1;
                } while (a < c);
                return level;
            }());
        return (function minify_markup_apply():string {
            const build:string[]        = [],
                // a new line character plus the correct amount of identation for the given line
                // of code
                attributeEnd = function minify_markup_apply_attributeEnd():void {
                    const parent:string = data.token[a],
                        regend:RegExp = (/(\/|\?)?>$/),
                        end:string[]|null = regend.exec(parent);
                    let y:number = a + 1,
                        x:number = 0,
                        jsx:boolean = false;
                    if (end === null) {
                        return;
                    }
                    data.token[a] = parent.replace(regend, "");
                    do {
                        if (data.types[y] === "jsx_attribute_end" && data.begin[data.begin[y]] === a) {
                            jsx = false;
                        } else if (data.begin[y] === a) {
                            if (data.types[y] === "jsx_attribute_start") {
                                jsx = true;
                            } else if (data.types[y].indexOf("attribute") < 0 && jsx === false) {
                                break;
                            }
                        } else if (jsx === false && (data.begin[y] < a || data.types[y].indexOf("attribute") < 0)) {
                            break;
                        }
                        y = y + 1;
                    } while (y < c);
                    if (data.types[y - 1] === "comment_attribute") {
                        x = y;
                        do {
                            y = y - 1;
                        } while (y > a && data.types[y - 1] === "comment_attribute");
                        if (data.lines[x] < 1) {
                            levels[y - 1] = -20;
                        }
                    }
                    data.token[y - 1] = data.token[y - 1] + end[0];
                };
            let a:number            = prettydiff.start,
                b:number         = 0,
                next:number      = 0,
                external:string = "",
                lastLevel:number = 0,
                count:number     = 0,
                linelen:number   = 0,
                lines:string[]   = [];
            if (options.top_comments === true && data.types[a] === "comment" && prettydiff.start === 0) {
                if (a > 0) {
                    build.push(lf);
                }
                do {
                    build.push(data.token[a]);
                    build.push(lf);
                    a = a + 1;
                } while (a < c && data.types[a] === "comment");
            }
            do {
                if (data.lexer[a] === lexer || prettydiff.minify[data.lexer[a]] === undefined) {
                    if ((data.types[a] === "start" || data.types[a] === "singleton" || data.types[a] === "xml" || data.types[a] === "sgml") && data.types[a].indexOf("attribute") < 0 && a < c - 1 && data.types[a + 1] !== undefined && data.types[a + 1].indexOf("attribute") > -1) {
                        attributeEnd();
                    }
                    if (options.minify_keep_comments === true || (data.types[a] !== "comment" && data.types[a] !== "comment_attribute")) {
                        if (data.types[a] === "comment") {
                            if (data.types[a - 1] !== "comment") {
                                build.push(lf);
                                build.push(lf);
                            }
                            build.push(data.token[a]);
                            if (data.types[a + 1] !== "comment") {
                                build.push(lf);
                            }
                            build.push(lf);
                        } else {
                            build.push(data.token[a]);
                        }
                        count = count + data.token[a].length;
                        if ((data.types[a] === "template" || data.types[a] === "template_start") && data.types[a - 1] === "content" && options.mode === "minify" && levels[a] === -20) {
                            build.push(" ");
                            count = count + 1;
                        }
                        if (levels[a] > -1) {
                            lastLevel = levels[a];
                        } else if (levels[a] === -10 && data.types[a] !== "jsx_attribute_start") {
                            build.push(" ");
                            count = count + 1;
                        }
                    }
                    next = a + 1;
                    if (next < c - 1 && data.types[next].indexOf("comment") > -1 && options.minify_keep_comments === false) {
                        do {
                            next = next + 1;
                        } while (next < c - 1 && data.types[next].indexOf("comment") > -1);
                    }
                    if (next < c - 1 && count + data.token[next].length > options.wrap && options.wrap > 0 && options.minify_wrap === true) {
                        if (build[build.length - 1] === " ") {
                            build.pop();
                        }
                        if ((data.types[next] === "content" || data.types[next] === "attribute") && data.token[next].indexOf(" ") > 0) {
                            lines = data.token[next].split(" ");
                            b = 0;
                            linelen = lines.length;
                            if (count + lines[0] + 1 > options.wrap) {
                                build.push(lf);
                                count = 0;
                            }
                            do {
                                count = count + lines[b].length + 1;
                                if (count > options.wrap) {
                                    count = lines[b].length + 1;
                                    build.push(lf);
                                }
                                build.push(lines[b]);
                                build.push(" ");
                                b = b + 1;
                            } while (b < linelen);
                            if (next < c - 2 && count + data.token[next + 1].length > options.wrap) {
                                if (build[build.length - 1] === " ") {
                                    build.pop();
                                }
                                build.push(lf);
                                count = 0;
                            }
                            a = next;
                        } else {
                            build.push(lf);
                            count = 0;
                        }
                    }
                } else {
                    if (externalIndex[a] === a && data.types[a] !== "reference") {
                        if (data.types[a] !== "comment") {
                            build.push(data.token[a]);
                            count = count + data.token[a].length;
                        }
                    } else {
                        prettydiff.end = externalIndex[a];
                        options.indent_level = lastLevel;
                        prettydiff.start = a;
                        external = prettydiff.minify[data.lexer[a]](options).replace(/\s+$/, "");
                        if (options.wrap > 0 && options.minify_wrap === true) {
                            build.push(lf);
                        }
                        build.push(external);
                        if (levels[prettydiff.iterator] > -1 && externalIndex[a] > a) {
                            build.push(lf);
                        } else if (options.wrap > 0 && options.minify_wrap === true) {
                            build.push(lf);
                        }
                        a = prettydiff.iterator;
                    }
                }
                a = a + 1;
            } while (a < c);
            prettydiff.iterator = c - 1;
            if (build[0] === lf || build[0] === " ") {
                build[0] = "";
            }
            if (options.new_line === true && a === data.token.length && build[build.length - 1].indexOf(lf) < 0) {
                build.push(lf);
            }
            return build.join("");
        }());
    };
    global.prettydiff.minify.markup = markup;
}());