/*global global*/
(function minify_style_init():void {
    "use strict";
    const style = function minify_style(options:any):string {
        const data:parsedArray = options.parsed,
            lf:"\r\n"|"\n"         = (options.crlf === true)
                ? "\r\n"
                : "\n",
            len:number      = (options.end < 1 || options.end > data.token.length)
                ? data.token.length
                : options.end + 1,
            build:string[]    = [];
        let a:number        = options.start;

        //beautification loop
        if (options.topcoms === true && data.types[a] === "comment" && options.start === 0) {
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
                if (data.types[a] !== "comment") {
                    build.push(data.token[a]);
                }
                a = a + 1;
            } while (a < len);
        }
        prettydiff.iterator = len - 1;
        if (options.new_line === true && options.end === data.token.length) {
            build.push(lf);
        }
        return build.join("");
    };
    global.prettydiff.minify.style = style;
}());
