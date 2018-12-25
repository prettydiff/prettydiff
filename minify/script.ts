/*global global, prettydiff*/
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
        const data:parsedArray = options.parsed,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            lexer:string = "script",
            invisibles:string[] = ["x;", "x}", "x{", "x(", "x)"],
            end:number  = (options.end < 1 || options.end > data.token.length)
                ? data.token.length
                : options.end + 1,
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
                        }
                        return;
                    }
                    aa = aa - 1;
                } while (aa > -1);
            };
        let a:number        = options.start,
            external:string = "",
            linelen:number  = 0;
        if (options.top_comments === true && data.types[a] === "comment" && options.start === 0) {
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
                if (data.types[a] !== "comment") {
                    if (data.types[a - 1] === "operator" && data.types[a] === "operator" && data.token[a] !== "!") {
                        build.push(" ");
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
                        }
                        build.push(data.token[a]);
                        build.push(" ");
                    } else if (data.token[a] === "x;" && data.token[a + 1] !== "}") {
                        build.push(";");
                    } else if (data.token[a] === ";" && data.token[a + 1] === "}") {
                        lastsemi();
                    } else if (invisibles.indexOf(data.token[a]) < 0) {
                        build.push(data.token[a]);
                    }
                    if (options.wrap > 0) {
                        linelen = linelen + data.token[a].length;
                        if (
                            (
                                data.types[a] === "operator" ||
                                data.types[a] === "separator" ||
                                data.types[a] === "start"
                            ) &&
                            a < length - 1 &&
                            linelen + data.token[a + 1].length > options.wrap
                        ) {
                            build.push(lf);
                            linelen = 0;
                        }
                    }
                }
            } else {
                let skip:number = a;
                do {
                    if (data.lexer[a + 1] === lexer && data.begin[a + 1] < skip) {
                        break;
                    }
                    if (data.token[skip - 1] === "return" && data.types[a] === "end" && data.begin[a] === skip) {
                        break;
                    }
                    a = a + 1;
                } while (a < end);
                options.start = skip;
                options.end = a;
                external = prettydiff.minify[data.lexer[a]](options).replace(/\s+$/, "");
                build.push(external);
            }
            a = a + 1;
        } while (a < end);
        prettydiff.iterator = end - 1;
        if (options.new_line === true) {
            if (options.crlf === true) {
                build.push("\r\n");
            } else {
                build.push("\n");
            }
        }
        return build.join("");
    };
    global.prettydiff.minify.script = script;
}());