/*global prettydiff*/
(function beautify_markup_init():void {
    "use strict";
    const markup = function beautify_markup(options:any):string {
        const data:data = options.parsed,
            lexer:string = "markup",
            c:number            = (prettydiff.end < 1 || prettydiff.end > data.token.length)
                ? data.token.length
                : prettydiff.end + 1,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            externalIndex:externalIndex = {},
            levels:number[] = (function beautify_markup_levels():number[] {
                const level:number[]      = (prettydiff.start > 0)
                        ? Array(prettydiff.start).fill(0, 0, prettydiff.start)
                        : [],
                    nextIndex = function beautify_markup_levels_next():number {
                        let x:number = a + 1,
                            y:number = 0;
                        if (data.types[x] === undefined) {
                            return x - 1;
                        }
                        if (data.types[x] === "comment" || (a < c - 1 && data.types[x].indexOf("attribute") > -1)) {
                            do {
                                if (data.types[x] === "jsx_attribute_start") {
                                    y = x;
                                    do {
                                        if (data.types[x] === "jsx_attribute_end" && data.begin[x] === y) {
                                            break;
                                        }
                                        x = x + 1;
                                    } while (x < c);
                                } else if (data.types[x] !== "comment" && data.types[x].indexOf("attribute") < 0) {
                                    return x;
                                }
                                x = x + 1;
                            } while (x < c);
                        }
                        return x;
                    },
                    anchorList = function beautify_markup_levels_anchorList():void {
                        let aa:number = a;
                        const stop:number = data.begin[a];
                        // verify list is only a link list before making changes
                        do {
                            aa = aa - 1;
                            if (data.token[aa] === "</li>" && data.begin[data.begin[aa]] === stop && data.token[aa - 1] === "</a>" && data.begin[aa - 1] === data.begin[aa] + 1) {
                                aa = data.begin[aa];
                            } else {
                                return;
                            }
                        } while (aa > stop + 1);

                        // now make the changes
                        aa = a;
                        do {
                            aa = aa - 1;
                            if (data.types[aa + 1] === "attribute") {
                                level[aa] = -10;
                            } else if (data.token[aa] !== "</li>") {
                                level[aa] = -20;
                            }
                        } while (aa > stop + 1);
                    },
                    comment = function beautify_markup_levels_comment():void {
                        let x:number = a,
                            test:boolean = false;
                        if (data.lines[a + 1] === 0 && options.force_indent === false) {
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
                            if (data.types[x] === "attribute" || data.types[x] === "template_attribute" || data.types[x] === "jsx_attribute_start") {
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
                    },
                    content = function beautify_markup_levels_content():void {
                        let ind:number = indent;
                        if (options.force_indent === true || options.force_attribute === true) {
                            level.push(indent);
                            return;
                        }
                        if (next < c && (data.types[next].indexOf("end") > -1 || data.types[next].indexOf("start") > -1) && data.lines[next] > 0) {
                            level.push(indent);
                            ind = ind + 1;
                            if (data.types[a] === "singleton" && a > 0 && data.types[a - 1].indexOf("attribute") > -1 && data.types[data.begin[a - 1]] === "singleton") {
                                if (data.begin[a] < 0 || (data.types[data.begin[a - 1]] === "singleton" && data.begin[data.ender[a] - 1] !== a)) {
                                    level[a - 1] = indent;
                                } else {
                                    level[a - 1] = indent + 1;
                                }
                            }
                        } else if (data.types[a] === "singleton" && a > 0 && data.types[a - 1].indexOf("attribute") > -1) {
                            level[a - 1] = indent;
                            count = data.token[a].length;
                            level.push(-10);
                        } else if (data.lines[next] === 0) {
                            level.push(-20);
                        } else if (
                            // wrap if
                            // * options.wrap is 0
                            // * next token is singleton with an attribute and exceeds wrap
                            // * next token is template or singleton and exceeds wrap
                            (
                                options.wrap === 0 ||
                                (a < c - 2 && data.token[a].length + data.token[a + 1].length + data.token[a + 2].length + 1 > options.wrap && data.types[a + 2].indexOf("attribute") > -1) ||
                                (data.token[a].length + data.token[a + 1].length > options.wrap)
                            ) &&
                            (data.types[a + 1] === "singleton" || data.types[a + 1] === "template")) {
                            level.push(indent);
                        } else {
                            count = count + 1;
                            level.push(-10);
                        }
                        if (a > 0 && data.types[a - 1].indexOf("attribute") > -1 && data.lines[a] < 1) {
                            level[a - 1] = -20;
                        }
                        if (count > options.wrap) {
                            let d:number = a,
                                e:number = Math.max(data.begin[a], 0);
                            if (data.types[a] === "content" && options.preserve_text === false) {
                                let countx:number = 0,
                                    chars:string[] = data.token[a].replace(/\s+/g, " ").split(" ");
                                do {
                                    d = d - 1;
                                    if (level[d] < 0) {
                                        countx = countx + data.token[d].length;
                                        if (level[d] === -10) {
                                            countx = countx + 1;
                                        }
                                    } else {
                                        break;
                                    }
                                } while (d > 0);
                                d = 0;
                                e = chars.length;
                                do {
                                    if (chars[d].length + countx > options.wrap) {
                                        chars[d] = lf + chars[d];
                                        countx = chars[d].length;
                                    } else {
                                        chars[d] = ` ${chars[d]}`;
                                        countx = countx + chars[d].length;
                                    }
                                    d = d + 1;
                                } while (d < e);
                                if (chars[0].charAt(0) === " ") {
                                    data.token[a] = chars.join("").slice(1);
                                } else {
                                    level[a - 1] = ind;
                                    data.token[a] = chars.join("").replace(lf, "");
                                }
                                if (data.token[a].indexOf(lf) > 0) {
                                    count = data.token[a].length - data.token[a].lastIndexOf(lf);
                                }
                            } else {
                                do {
                                    d = d - 1;
                                    if (level[d] > -1) {
                                        count = data.token[a].length;
                                        if (data.lines[a + 1] > 0) {
                                            count = count + 1;
                                        }
                                        return;
                                    }
                                    if (data.types[d].indexOf("start") > -1) {
                                        count = 0;
                                        return;
                                    }
                                    if ((data.types[d] !== "attribute" || (data.types[d] === "attribute" && data.types[d + 1] !== "attribute")) && data.lines[d + 1] > 0) {
                                        if (data.types[d] !== "singleton" || (data.types[d] === "singleton" && data.types[d + 1] !== "attribute")) {
                                            count = data.token[a].length;
                                            if (data.lines[a + 1] > 0) {
                                                count = count + 1;
                                            }
                                            break;
                                        }
                                    }
                                } while (d > e);
                                level[d] = ind;
                            }
                        }
                    },
                    external = function beautify_markup_levels_external():void {
                        let skip:number = a;
                        do {
                            if (data.lexer[a + 1] === lexer && data.begin[a + 1] < skip && data.types[a + 1] !== "start" && data.types[a + 1] !== "singleton") {
                                break;
                            }
                            level.push(0);
                            a = a + 1;
                        } while (a < c);
                        externalIndex[skip] = a;
                        level.push(indent - 1);
                        next = nextIndex();
                        if (data.lexer[next] === lexer && data.stack[a].indexOf("attribute") < 0 && (data.types[next] === "end" || data.types[next] === "template_end")) {
                            indent = indent - 1;
                        }
                    },
                    attribute = function beautify_markup_levels_attribute():void {
                        const parent:number = a - 1,
                            wrap = function beautify_markup_levels_attribute_wrap(index:number):void {
                                const item:string[] = data.token[index].replace(/\s+/g, " ").split(" "),
                                    ilen:number = item.length;
                                let bb:number = 1,
                                    acount:number = item[0].length;
                                if ((/=("|')?(<|(\{(\{|%|#|@|!|\?|^))|(\[%))/).test(data.token[index]) === true) {
                                    return;
                                }
                                do {
                                    if (acount + item[bb].length > options.wrap) {
                                        acount = item[bb].length;
                                        item[bb] = lf + item[bb];
                                    } else {
                                        item[bb] = ` ${item[bb]}`;
                                        acount = acount + item[bb].length;
                                    }
                                    bb = bb + 1;
                                } while (bb < ilen);
                                data.token[index] = item.join("");
                            };
                        let y:number = a,
                            len:number = data.token[parent].length + 1,
                            plural:boolean = false,
                            lev:number = (function beautify_markup_levels_attribute_level():number {
                                if (data.types[a].indexOf("start") > 0) {
                                    let x:number = a;
                                    do {
                                        if (data.types[x].indexOf("end") > 0 && data.begin[x] === a) {
                                            if (x < c - 1 && data.types[x + 1].indexOf("attribute") > -1) {
                                                plural = true;
                                                break;
                                            }
                                        }
                                        x = x + 1;
                                    } while (x < c);
                                } else if (a < c - 1 && data.types[a + 1].indexOf("attribute") > -1) {
                                    plural = true;
                                }
                                if (data.types[next] === "end" || data.types[next] === "template_end") {
                                    if (data.types[parent] === "singleton") {
                                        return indent + 2;
                                    }
                                    return indent + 1;
                                }
                                if (data.types[parent] === "singleton") {
                                    return indent + 1;
                                }
                                return indent;
                            }()),
                            earlyexit:boolean = false,
                            attStart:boolean = false;
                        
                        if (plural === false && data.types[a] === "comment_attribute") {
                            // lev must be indent unless the "next" type is end then its indent + 1
                            level.push(indent);
                            if (data.types[parent] === "singleton") {
                                level[parent] = indent + 1;
                            } else {
                                level[parent] = indent;
                            }
                            return;
                        }

                        if (lev < 1) {
                            lev = 1;
                        }

                        // first, set levels and determine if there are template attributes
                        do {
                            count = count + data.token[a].length + 1;
                            if (data.types[a].indexOf("attribute") > 0) {
                                if (data.types[a] === "template_attribute") {
                                    level.push(-10);
                                } else if (data.types[a] === "comment_attribute") {
                                    level.push(lev);
                                } else if (data.types[a].indexOf("start") > 0) {
                                    attStart = true;
                                    if (a < c - 2 && data.types[a + 2].indexOf("attribute") > 0) {
                                        level.push(-20);
                                        a = a + 1;
                                        externalIndex[a] = a;
                                    } else {
                                        if (parent === a - 1 && plural === false) {
                                            level.push(lev);
                                        } else {
                                            level.push(lev + 1);
                                        }
                                        if (data.lexer[a + 1] !== lexer) {
                                            a = a + 1;
                                            external();
                                        }
                                    }
                                } else if (data.types[a].indexOf("end") > 0) {
                                    if (level[a - 1] !== -20) {
                                        level[a - 1] = level[data.begin[a]] - 1;
                                    }
                                    if (data.lexer[a + 1] !== lexer) {
                                        level.push(-20);
                                    } else {
                                        level.push(lev);
                                    }
                                } else {
                                    level.push(lev);
                                }
                                earlyexit = true;
                            } else if (data.types[a] === "attribute") {
                                len = len + data.token[a].length + 1;
                                if (options.unformatted === true) {
                                    level.push(-10);
                                } else if (options.force_attribute === true || attStart === true || (a < c - 1 && data.types[a + 1] !== "template_attribute" && data.types[a + 1].indexOf("attribute") > 0)) {
                                    level.push(lev);
                                } else {
                                    level.push(-10);
                                }
                            } else if (data.begin[a] < parent + 1) {
                                break;
                            }
                            a = a + 1;
                        } while (a < c);

                        a = a - 1;
                        if (level[a - 1] > 0 && data.types[a].indexOf("end") > 0 && data.types[a].indexOf("attribute") > 0 && data.types[parent] !== "singleton" && plural === true) {
                            level[a - 1] = level[a - 1] - 1;
                        }
                        if (level[a] !== -20) {
                            if (options.language === "jsx" && data.types[parent].indexOf("start") > -1 && data.types[a + 1] === "script_start") {
                                level[a] = lev;
                            } else {
                                level[a] = level[parent];
                            }
                        }
                        if (options.force_attribute === true) {
                            count = 0;
                            level[parent] = lev;
                        } else {
                            level[parent] = -10;
                        }
                        if (earlyexit === true || options.unformatted === true || data.token[parent] === "<%xml%>" || data.token[parent] === "<?xml?>") {
                            count = 0;
                            return;
                        }
                        y = a;

                        // second, ensure tag contains more than one attribute
                        if (y > parent + 1) {

                            // finally, indent attributes if tag length exceeds the wrap limit
                            if (options.space_close === false) {
                                len = len - 1;
                            }
                            if (len > options.wrap && options.wrap > 0 && options.force_attribute === false) {
                                count = data.token[a].length;
                                do {
                                    if (data.token[y].length > options.wrap && (/\s/).test(data.token[y]) === true) {
                                        wrap(y);
                                    }
                                    y = y - 1;
                                    level[y] = lev;
                                } while (y > parent);
                            }
                        } else if (options.wrap > 0 && data.types[a] === "attribute" && data.token[a].length > options.wrap && (/\s/).test(data.token[a]) === true) {
                            wrap(a);
                        }
                    };
                let a:number     = prettydiff.start,
                    comstart:number = -1,
                    next:number = 0,
                    count:number = 0,
                    indent:number       = (isNaN(options.indent_level) === true)
                        ? 0
                        : Number(options.indent_level);
                // data.lines -> space before token
                // level -> space after token
                do {
                    if (data.lexer[a] === lexer) {
                        if (data.token[a].toLowerCase().indexOf("<!doctype") === 0) {
                            level[a - 1] = indent;
                        }
                        if (data.types[a].indexOf("attribute") > -1) {
                            attribute();
                        } else if (data.types[a] === "comment") {
                            if (comstart < 0) {
                                comstart = a;
                            }
                            if (data.types[a + 1] !== "comment" || (a > 0 && data.types[a - 1].indexOf("end") > -1)) {
                                comment();
                            }
                        } else if (data.types[a] !== "comment") {
                            next = nextIndex();
                            if (data.types[next] === "end" || data.types[next] === "template_end") {
                                indent = indent - 1;
                                if (data.types[next] === "template_end" && data.types[data.begin[next] + 1] === "template_else") {
                                    indent = indent - 1;
                                }
                                if (data.token[a] === "</ol>" || data.token[a] === "</ul>") {
                                    anchorList();
                                }
                            }
                            if (data.types[a] === "script_end" && data.types[a + 1] === "end") {
                                if (data.lines[a + 1] < 1) {
                                    level.push(-20);
                                } else {
                                    level.push(-10);
                                }
                            } else if ((options.force_indent === false || (options.force_indent === true && data.types[next] === "script_start")) && (data.types[a] === "content" || data.types[a] === "singleton" || data.types[a] === "template")) {
                                count = count + data.token[a].length;
                                if (data.lines[next] > 0 && data.types[next] === "script_start") {
                                    level.push(-10);
                                } else if (options.wrap > 0 && (data.types[a].indexOf("template") < 0 || (next < c && data.types[a].indexOf("template") > -1 && data.types[next].indexOf("template") < 0))) {
                                    content();
                                } else if (next < c && (data.types[next].indexOf("end") > -1 || data.types[next].indexOf("start") > -1) && (data.lines[next] > 0 || data.types[next].indexOf("template_") > -1)) {
                                    level.push(indent);
                                } else if (data.lines[next] === 0) {
                                    level.push(-20);
                                } else {
                                    level.push(indent);
                                }
                            } else if (data.types[a] === "start" || data.types[a] === "template_start") {
                                indent = indent + 1;
                                if (data.types[a] === "template_start" && data.types[a + 1] === "template_else") {
                                    indent = indent + 1;
                                }
                                if (options.language === "jsx" && data.token[a + 1] === "{") {
                                    if (data.lines[a + 1] === 0) {
                                        level.push(-20);
                                    } else {
                                        level.push(-10);
                                    }
                                } else if (data.types[a] === "start" && data.types[next] === "end") {
                                    level.push(-20);
                                } else if (data.types[a] === "start" && data.types[next] === "script_start") {
                                    level.push(-10);
                                } else if (options.force_indent === true) {
                                    level.push(indent);
                                } else if (data.types[a] === "template_start" && data.types[next] === "template_end") {
                                    level.push(-20);
                                } else if (data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton" || (data.types[a] === "start" && data.types[next] === "template"))) {
                                    level.push(-20);
                                } else {
                                    level.push(indent);
                                }
                            } else if (options.force_indent === false && data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                level.push(-20);
                            } else if (data.types[a + 2] === "script_end") {
                                level.push(-20);
                            } else if (data.types[a] === "template_else") {
                                if (data.types[next] === "template_end") {
                                    level[a - 1] = indent + 1;
                                } else {
                                    level[a - 1] = indent - 1;
                                }
                                level.push(indent);
                            } else {
                                level.push(indent);
                            }
                        }
                        if (data.types[a] !== "content" && data.types[a] !== "singleton" && data.types[a] !== "template" && data.types[a] !== "attribute") {
                            count = 0;
                        }
                    } else {
                        count = 0;
                        external();
                    }
                    a = a + 1;
                } while (a < c);
                return level;
            }());
        return (function beautify_markup_apply():string {
            const build:string[]        = [],
                ind:string          = (function beautify_markup_apply_tab():string {
                    const indy:string[] = [options.indent_char],
                        size:number = options.indent_size - 1;
                    let aa:number   = 0;
                    if (aa < size) {
                        do {
                            indy.push(options.indent_char);
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
                        total:number = Math.min(data.lines[a + 1] - 1, pres);
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
                            linesout.push(ind);
                            index = index + 1;
                        } while (index < tabs);
                    }
                    return linesout.join("");
                },
                multiline = function beautify_markup_apply_multiline():void {
                    const lines:string[] = data.token[a].split(lf),
                        line:number = data.lines[a + 1],
                        lev:number = (levels[a - 1] > -1)
                            ? (data.types[a] === "attribute")
                                ? levels[a - 1] + 1
                                : levels[a - 1]
                            : (function beautify_markup_apply_multiline_lev():number {
                                let bb:number = a - 1,
                                    start:boolean = (bb > -1 && data.types[bb].indexOf("start") > -1);
                                if (levels[a] > -1 && data.types[a] === "attribute") {
                                    return levels[a] + 1;
                                }
                                do {
                                    bb = bb - 1;
                                    if (levels[bb] > -1) {
                                        if (data.types[a] === "content" && start === false) {
                                            return levels[bb];
                                        }
                                        return levels[bb] + 1;
                                    }
                                    if (data.types[bb].indexOf("start") > -1) {
                                        start = true;
                                    }
                                } while (bb > 0);
                                return 1;
                            }());
                    let aa:number = 0,
                        len:number = lines.length - 1;
                    data.lines[a + 1] = 0;
                    do {
                        build.push(lines[aa]);
                        build.push(nl(lev));
                        aa = aa + 1;
                    } while (aa < len);
                    data.lines[a + 1] = line;
                    build.push(lines[len]);
                    if (levels[a] === -10) {
                        build.push(" ");
                    } else if (levels[a] > -1) {
                        build.push(nl(levels[a]));
                    }
                },
                attributeEnd = function beautify_markup_apply_attributeEnd():void {
                    const parent:string = data.token[a],
                        regend:RegExp = (/(\/|\?)?>$/),
                        end:string[]|null = regend.exec(parent);
                    let y:number = a + 1,
                        space:string = (options.space_close === true && end !== null && end[0] === "/>")
                            ? " "
                            : "",
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
                        space = nl(levels[y - 2] - 1);
                    }
                    data.token[y - 1] = data.token[y - 1] + space + end[0];
                };
            let a:number            = prettydiff.start,
                external:string = "",
                lastLevel:number = options.indent_level;
            do {
                if (data.lexer[a] === lexer || prettydiff.beautify[data.lexer[a]] === undefined) {
                    if ((data.types[a] === "start" || data.types[a] === "singleton" || data.types[a] === "xml" || data.types[a] === "sgml") && data.types[a].indexOf("attribute") < 0 && a < c - 1 && data.types[a + 1] !== undefined && data.types[a + 1].indexOf("attribute") > -1) {
                        attributeEnd();
                    }
                    if (data.token[a] !== undefined && data.token[a].indexOf(lf) > 0 && ((data.types[a] === "content" && options.preserve_text === false) || data.types[a] === "comment" || data.types[a] === "attribute")) {
                        multiline();
                    } else {
                        build.push(data.token[a]);
                        if (levels[a] === -10 && a < c - 1) {
                            build.push(" ");
                        } else if (levels[a] > -1) {
                            lastLevel = levels[a];
                            build.push(nl(levels[a]));
                        }
                    }
                } else {
                    if (externalIndex[a] === a && data.types[a] !== "reference") {
                        build.push(data.token[a]);
                    } else {
                        prettydiff.end = externalIndex[a];
                        options.indent_level = lastLevel;
                        prettydiff.start = a;
                        external = prettydiff.beautify[data.lexer[a]](options).replace(/\s+$/, "");
                        build.push(external);
                        if (levels[prettydiff.iterator] > -1 && externalIndex[a] > a) {
                            build.push(nl(levels[prettydiff.iterator]));
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
            return build.join("");
        }());
    };
    global.prettydiff.beautify.markup = markup;
}());