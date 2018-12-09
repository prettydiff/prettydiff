import { join } from "path";
import { types } from "util";

/*global global, prettydiff*/
(function beautify_markup_init():void {
    "use strict";
    const markup = function beautify_markup(options:any):string {
        const data:parsedArray = options.parsed,
            lexer:string = "markup",
            c:number            = (options.end < 1 || options.end > data.token.length)
                ? data.token.length
                : options.end + 1,
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
                                } else if (data.types[x] !== "comment" && data.types[x] !== "attribute" && data.types[x] !== "template_attribute") {
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
                            if (data.token[aa] === "</li>" && data.begin[data.begin[aa]] === stop && data.token[aa - 1] === "</a>" && data.begin[aa - 1] === data.begin[aa] + 1) {
                                level[aa - 1] = -20; 
                                aa = data.begin[aa];
                                level[aa] = -20;
                            }
                        } while (aa > stop + 1);
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
                    external = function beautify_markup_levels_external():void {
                        let skip = a;
                        do {
                            if (data.lexer[a + 1] === lexer && data.begin[a + 1] < skip) {
                                break;
                            }
                            level.push(0);
                            a = a + 1;
                        } while (a < c);
                        level[skip] = a;
                        level.push(indent - 1);
                        next = nextIndex();
                        if (data.lexer[next] === lexer && (data.types[next] === "end" || data.types[next] === "template_end")) {
                            indent = indent - 1;
                        }
                    },
                    attribute = function beautify_markup_levels_attribute():void {
                        const parent:number = a - 1;
                        let y:number = a,
                            len:number = data.token[parent].length + 1,
                            startType:boolean = false,
                            exFirst:number = 0,
                            count:number = 0,
                            lev:number = (data.types[parent] !== "start")
                                ? (data.types[next] === "end" || data.types[next] === "template_end")
                                    ? indent + 2
                                    : indent + 1
                                : indent,
                            earlyexit:boolean = false;

                        // first, set levels and determine if there are template attributes
                        do {
                            if (data.types[a].indexOf("attribute") > 0) {
                                if (data.types[a] === "template_attribute") {
                                    count = count + 1;
                                    level.push(-10);
                                } else if (data.types[a].indexOf("start") > 0) {
                                    count = count + 1;
                                    startType = true;
                                    if (a < c - 2 && data.types[a + 2].indexOf("attribute")  > 0 && data.types[a + 2].indexOf("end") > 0) {
                                        level.push(-20);
                                        level.push(-20);
                                        a = a + 1;
                                    } else {
                                        level.push(lev);
                                        if (data.lexer[a + 1] !== lexer) {
                                            a = a + 1;
                                            exFirst = a;
                                            external();
                                            if (data.types.slice(exFirst, a + 1).indexOf("start") < 0) {
                                                level[exFirst - 1] = -20;
                                                level[a] = -20;
                                            }
                                        }
                                    }
                                } else if (data.types[a].indexOf("end") > 0) {
                                    if (level[a - 1] !== -20) {
                                        level[a - 1] = lev - 1;
                                    }
                                    level.push(lev);
                                } else {
                                    count = count + 1;
                                    level.push(lev);
                                }
                                earlyexit = true;
                            } else if (data.types[a] === "attribute") {
                                count = count + 1;
                                len = len + data.token[a].length + 1;
                                level.push(-10);
                            } else if (data.begin[a] < parent + 1) {
                                break;
                            }
                            a = a + 1;
                        } while (a < c);

                        a = a - 1;
                        level[a] = level[parent];
                        if (startType === true && count > 1) {
                            level[parent] = lev;
                        } else {
                            level[parent] = -10;
                        }
                        if (earlyexit === true) {
                            return;
                        }
                        y = a;

                        // second, ensure tag contains more than one attribute
                        if (y > parent + 2) {
                            let atts:string[] = data.token.slice(parent + 1, y + 1),
                                z:number = 0,
                                zz:number = atts.length;

                            // third, sort attributes alphabetically
                            atts.sort();
                            data.token.splice(parent + 1, y - parent);
                            do {
                                data.token.splice((parent + 1) + z, 0, atts[z]);
                                z = z + 1;
                            } while (z < zz);

                            // finally, indent attributes if tag length exceeds the wrap limit
                            if (options.space_close === false) {
                                len = len - 1;
                            }
                            if (len > options.wrap && options.wrap > 0) {
                                do {
                                    y = y - 1;
                                    level[y] = lev;
                                } while (y > parent);
                            }
                        }
                    };
                let a:number     = options.start,
                    comstart:number = -1,
                    next:number = 0,
                    indent:number       = (isNaN(options.indent_level) === true)
                        ? 0
                        : Number(options.indent_level);
                // data.lines -> space before token
                // level -> space after token
                do {
                    if (data.lexer[a] === lexer) {
                        if (data.types[a].indexOf("attribute") > -1) {
                            attribute();
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
                                if (data.token[a] === "</ol>" || data.token[a] === "</ul>") {
                                    anchorList();
                                }
                            }
                            if (data.token[a] === "}" && data.types[a] === "script" && data.types[a + 1] === "end") {
                                if (data.lines[a + 1] < 1) {
                                    level.push(-20);
                                } else {
                                    level.push(-10);
                                }
                            } else if (options.force_indent === false && (data.types[a] === "content" || data.types[a] === "singleton" || data.types[a] === "template")) {
                                if (next < c && (data.types[next].indexOf("end") > -1 || data.types[next].indexOf("start") > -1) && data.lines[next] > 0) {
                                    level.push(indent);
                                } else if (data.lines[next] === 0) {
                                    level.push(-20);
                                } else if (data.lines[next] === 1) {
                                    level.push(-10);
                                } else {
                                    level.push(indent);
                                }
                            } else if (data.types[a] === "start" || data.types[a] === "template_start") {
                                indent = indent + 1;
                                if (options.language === "jsx" && data.token[a + 1] === "{") {
                                    if (data.lexer[a + 2] !== lexer && data.token[a + 3] === "}" && data.lexer[a + 3] === lexer) {
                                        if (data.types[a + 4] === "end") {
                                            level.push(-20);
                                        } else {
                                            level.push(indent);
                                        }
                                    } else {
                                        level.push(-10);
                                    }
                                } else if (options.force_indent === true) {
                                    level.push(indent);
                                } else if (data.types[a] === "start" && data.types[next] === "end") {
                                    level.push(-20);
                                } else if (data.types[a] === "template_start" && data.types[next] === "template_end") {
                                    level.push(-20);
                                } else if (data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                    level.push(-20);
                                } else {
                                    level.push(indent);
                                }
                            } else if (options.force_indent === false && data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                level.push(-20);
                            } else {
                                level.push(indent);
                            }
                        }
                    } else {
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
                        total:number = Math.min((data.lines[a + 1] - 1), pres);
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
                content = function beautify_markup_apply_content():void {
                    let aa:number  = (levels[a - 1] === -20)
                            ? options.wrap - data.token[a - 1].length
                            : options.wrap,
                        str:string = data.token[a].replace(/\s+/g, " "),
                        len:number = (levels[a - 1] === -20)
                            ? data.token[a - 1].length + str.length
                            : str.length;
                    const wrap:number = options.wrap,
                        indy:string = (function beautify_markup_apply_content_lev():string {
                            let bb:number = a,
                                cc:number = 0,
                                output:string[] = [];
                            if (levels[bb] < 0) {
                                do {
                                    bb = bb - 1;
                                } while (bb > 0 && levels[bb] < 0);
                            }
                            cc = levels[bb] + 1;
                            if (cc > 0) {
                                do {
                                    cc = cc - 1;
                                    output.push(ind);
                                } while (cc > 0);
                            }
                            return lf + output.join("");
                        }()),
                        store:string[] = [],
                        wrapper = function beautify_markup_apply_content_wrapper():void {
                            if (str.charAt(aa) === " ") {
                                store.push(str.slice(0, aa));
                                str = str.slice(aa + 1);
                                len = str.length;
                                aa = wrap;
                                return;
                            }
                            do {
                                aa = aa - 1;
                            } while (aa > 0 && str.charAt(aa) !== " ");
                            if (aa > 0) {
                                store.push(str.slice(0, aa));
                                str = str.slice(aa + 1);
                                len = str.length;
                                aa = wrap;
                            } else {
                                aa = wrap;
                                do {
                                    aa = aa + 1;
                                } while (aa < len && str.charAt(aa) !== " ");
                                store.push(str.slice(0, aa));
                                str = str.slice(aa + 1);
                                len = str.length;
                                aa = wrap;
                            }
                        };
                    // HTML anchor lists do not get wrapping unless the content itself exceeds the wrapping limit
                    if (
                        (data.token[data.begin[a]] === "<a" || data.token[data.begin[a]] === "<a>") &&
                        (data.token[data.begin[data.begin[a]]] === "<li>" || data.token[data.begin[data.begin[a]]] === "<li") &&
                        levels[a - 1] === -20 &&
                        levels[data.begin[a] - 1] === -20 &&
                        data.token[a].length < options.wrap
                    ) {
                        return;
                    }
                    if (len < wrap) {
                        return;
                    }
                    do {
                        wrapper();
                    } while (aa < len);
                    if (str !== "" && str !== " ") {
                        store.push(str);
                    }
                    data.token[a] = store.join(indy);
                },
                attributeEnd = function beautify_markup_apply_attributeEnd():void {
                    const parent:string = data.token[a],
                        regend:RegExp = (/(\/|\?)?>$/),
                        end:string[]|null = regend.exec(parent);
                    let y:number = a + 1,
                        space:string = (options.space_close === true && end[0] === "/>")
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
                        } else if (jsx === false) {
                            break;
                        }
                        y = y + 1;
                    } while (y < c);
                    data.token[y - 1] = data.token[y - 1] + space + end[0];
                };
            let a:number            = options.start,
                external:string = "",
                lastLevel:number = options.indent_level;
            do {
                if (data.lexer[a] === lexer || prettydiff.beautify[data.lexer[a]] === undefined) {
                    if (data.token[a] === "</prettydiffli>" && options.correct === true) {
                        data.token[a] = "</li>";
                    }
                    if ((data.types[a] === "start" || data.types[a] === "singleton" || data.types[a] === "xml" || data.types[a] === "sgml") && data.types[a].indexOf("attribute") < 0 && a < c - 1 && data.types[a + 1].indexOf("attribute") > -1) {
                        attributeEnd();
                    }
                    if ((a < 1 || data.types[a - 1].indexOf("template") < 0) && (a === c - 1 || data.types[a + 1].indexOf("template") < 0) && data.types[a] === "content" && options.wrap > 0) {
                        content();
                    }
                    if (data.token[a] !== "</prettydiffli>") {
                        build.push(data.token[a]);
                        if (levels[a] === -10) {
                            build.push(" ");
                        } else if (levels[a] > -1) {
                            lastLevel = levels[a];
                            build.push(nl(levels[a]));
                        }
                    }
                } else {
                    if (levels[a] - a < 1) {
                        build.push(data.token[a]);
                    } else {
                        options.end = levels[a];
                        options.indent_level = lastLevel;
                        options.start = a;
                        external = prettydiff.beautify[data.lexer[a]](options).replace(/\s+$/, "");
                        build.push(external);
                        a = levels[a];
                        if (levels[a] > -1) {
                            build.push(nl(levels[a]));
                        }
                    }
                }
                a = a + 1;
            } while (a < c);
            if (build[0] === lf || build[0] === " ") {
                build[0] = "";
            }
            if (options.new_line === true && options.end === data.token.length) {
                build.push(lf);
            }
            return build.join("");
        }());
    };
    global.prettydiff.beautify.markup = markup;
}());