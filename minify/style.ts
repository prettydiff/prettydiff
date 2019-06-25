/*global prettydiff*/
(function minify_style_init():void {
    "use strict";
    const style = function minify_style(options:any):string {
        const data:data = options.parsed,
            lf:"\r\n"|"\n"         = (options.crlf === true)
                ? "\r\n"
                : "\n",
            len:number      = (prettydiff.end < 1 || prettydiff.end > data.token.length)
                ? data.token.length
                : prettydiff.end + 1,
            build:string[]    = [];
        let a:number        = prettydiff.start,
            b:number        = 0,
            c:number        = 0,
            list:string[]   = [],
            count:number    = 0,
            countx:number   = 0;

        //beautification loop
        if (options.top_comments === true && options.minify_keep_comments === false && data.types[a] === "comment" && prettydiff.start === 0) {
            if (a > 0) {
                build.push(lf);
            }
            do {
                build.push(data.token[a]);
                build.push(lf);
                a = a + 1;
            } while (a < len && data.types[a] === "comment");
        }
        if (a < len) {
            do {
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
                    build.push(data.token[a]);
                    if (options.wrap > 0 && options.minify_wrap === true) {
                        count = count + data.token[a].length;
                        if (a < len - 1) {
                            if (count + data.token[a + 1].length > options.wrap) {
                                countx = count;
                                count = 0;
                                if (data.types[a] === "property") {
                                    build.pop();
                                    a = a - 1;
                                } else if (data.token[a] === ":") {
                                    build.pop();
                                    build.pop();
                                    a = a - 2;
                                }
                                build.push(lf);
                            }
                            b = data.token[a + 1].indexOf(",");
                            if ((data.token[a + 1].length > options.wrap || (b > 0 && countx + b < options.wrap)) && data.types[a + 1] === "selector") {
                                list = data.token[a + 1].split(",");
                                b = 0;
                                c = list.length;
                                if (countx + list[0].length + 1 < options.wrap) {
                                    build.pop();
                                    do {
                                        countx = countx + list[b].length + 1;
                                        if (countx > options.wrap) {
                                            break;
                                        }
                                        build.push(list[b]);
                                        build.push(",");
                                        b = b + 1;
                                    } while (b < c);
                                } else {
                                    countx = 0;
                                }
                                if (b < c) {
                                    do {
                                        countx = countx + list[b].length + 1;
                                        if (countx > options.wrap) {
                                            countx = list[b].length + 1;
                                            build.push(lf);
                                        }
                                        build.push(list[b]);
                                        build.push(",");
                                        b = b + 1;
                                    } while (b < c);
                                    build.pop();
                                }
                                count = countx;
                                countx = 0;
                                a = a + 1;
                            }
                        }
                    }
                }
                a = a + 1;
            } while (a < len);
            prettydiff.iterator = len - 1;
        }
        if (options.new_line === true && a === data.token.length && build[build.length - 1].indexOf(lf) < 0) {
            build.push(lf);
        }
        return build.join("");
    };
    global.prettydiff.minify.style = style;
}());
