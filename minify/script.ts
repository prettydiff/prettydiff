/*global prettydiff*/
(function minify_script_init():void {
    "use strict";
    const script = function minify_script(options:any):string {
        (function minify_script_options() {
            if (options.language === "json") {
                options.wrap = 0;
            } else if (options.language === "titanium") {
                options.correct = false;
            }
        }());
        const data:data = options.parsed,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            lexer:string = "script",
            invisibles:string[] = ["x;", "x}", "x{", "x(", "x)"],
            end:number  = (prettydiff.end < 1 || prettydiff.end > data.token.length)
                ? data.token.length
                : prettydiff.end + 1,
            build:string[]    = [],
            lastsemi = function minify_script_lastsemi() {
                let aa:number = a,
                    bb:number = 0;
                do {
                    if (data.types[aa] === "end") {
                        bb = bb + 1;
                    } else if (data.types[aa] === "start") {
                        bb = bb - 1;
                    }
                    if (bb < 0) {
                        if (data.token[aa - 1] === "for") {
                            build.push(";");
                            count = count + 1;
                        }
                        return;
                    }
                    aa = aa - 1;
                } while (aa > -1);
            };
        let a:number        = prettydiff.start,
            count:number    = 0,
            external:string = "";
        if (options.top_comments === true && options.minify_keep_comments === false && data.types[a] === "comment" && prettydiff.start === 0) {
            if (a > 0) {
                build.push(lf);
            }
            do {
                build.push(data.token[a]);
                build.push(lf);
                a = a + 1;
            } while (a < end && data.types[a] === "comment");
        }
        do {
            if (data.lexer[a] === lexer || prettydiff.minify[data.lexer[a]] === undefined) {
                if (data.types[a] === "comment" && options.minify_keep_comments === true) {
                    if (data.types[a - 1] !== "comment" && a > 0) {
                        build.push(lf);
                        build.push(lf);
                    }
                    build.push(data.token[a]);
                    if (data.types[a + 1] !== "comment") {
                        build.push(lf);
                    }
                    build.push(lf);
                } else if (data.types[a] !== "comment") {
                    if (data.types[a - 1] === "operator" && data.types[a] === "operator" && data.token[a] !== "!") {
                        build.push(" ");
                        count = count + 1;
                    }
                    if ((data.types[a] === "word" || data.types[a] === "references") && (
                        data.types[a + 1] === "word" ||
                        data.types[a + 1] === "reference" ||
                        data.types[a + 1] === "literal" ||
                        data.types[a + 1] === "number" ||
                        data.token[a + 1] === "x{"
                    )) {
                        if (
                            data.types[a - 1] === "literal" &&
                            data.token[a - 1].charAt(0) !== "\"" &&
                            data.token[a - 1].charAt(0) !== "'"
                        ) {
                            build.push(" ");
                            count = count + 1;
                        }
                        build.push(data.token[a]);
                        build.push(" ");
                        count = count + data.token[a].length + 1;
                    } else if (data.token[a] === "x;" && data.token[a + 1] !== "}") {
                        build.push(";");
                        count = count + 1;
                    } else if (data.token[a] === ";" && data.token[a + 1] === "}") {
                        lastsemi();
                    } else if (invisibles.indexOf(data.token[a]) < 0) {
                        build.push(data.token[a]);
                        count = count + data.token[a].length;
                    }
                }
                if (a < end - 1 && count + data.token[a + 1].length > options.wrap && options.wrap > 0 && options.minify_wrap === true) {
                    if (build[build.length - 1] === " ") {
                        build.pop();
                    }
                    if (data.token[a + 1] === ";") {
                        build.pop();
                        build.push(lf);
                        build.push(data.token[a]);
                    } else {
                        build.push(lf);
                    }
                    count = 0;
                }
            } else {
                let skip:number = a,
                    quit:boolean = false;
                do {
                    if (data.lexer[a + 1] === lexer && data.begin[a + 1] < skip) {
                        break;
                    }
                    if (data.token[skip - 1] === "return" && data.types[a] === "end" && data.begin[a] === skip) {
                        break;
                    }
                    a = a + 1;
                } while (a < end);
                prettydiff.start = skip;
                prettydiff.end = a;
                if (a > end - 1) {
                    a = skip;
                    quit = true;
                    prettydiff.end = end - 2;
                }
                external = prettydiff.minify[data.lexer[a]](options).replace(/\s+$/, "");
                if (options.wrap > 0 && options.minify_wrap === true && data.token[skip - 1] !== "return") {
                    build.push(lf);
                }
                build.push(external);
                if (quit === true) {
                    break;
                }
                if (options.wrap > 0 && options.minify_wrap === true) {
                    build.push(lf);
                    count = 0;
                }
            }
            a = a + 1;
        } while (a < end);
        prettydiff.iterator = end - 1;
        if (options.new_line === true && a === data.token.length && build[build.length - 1].indexOf(lf) < 0) {
            build.push(lf);
        }
        return build.join("");
    };
    global.prettydiff.minify.script = script;
}());