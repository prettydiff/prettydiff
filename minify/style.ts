/*global global*/
(function beautify_style_init():void {
    "use strict";
    const style = function beautify_style(options:any):string {
        const data:parsedArray = options.parsed,
            lf         = (options.crlf === true)
                ? "\r\n"
                : "\n",
            len:number      = (options.end > 0)
                ? options.end
                : data.token.length,
            build:string[]    = [];
        let output:string     = "",
            a:number        = options.start;

        //beautification loop
        if (options.topcoms === true && data.types[a] === "comment") {
            do {
                build.push(data.token[a]);
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
        if (options.newline === true) {
            if (options.crlf === true) {
                build.push("\r\n");
            } else {
                build.push("\n");
            }
        }
        if (options.preserve > 0 && (data.lines[data.lines.length - 1] > 0)) {
            output = build
                .join("")
                .replace(/(\s+)$/, lf);
        } else {
            output = build
                .join("")
                .replace(/(\s+)$/, "");
        }
        return output;
    };
    global.prettydiff.minify.style = style;
}());
