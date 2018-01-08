/*jslint node:true */
/*eslint-env node*/
/*global global, window*/

(function prettydiff_init() {
    "use strict";

    const prettydiff = function prettydiff_(options):string {
        let prettyout:string = "";
        if (options.lexer === undefined) {
            console.log("Missing required option: lexer.");
            return "Missing required option: lexer.";
        }
        options.parsed = window.parseFramework.parserArrays(options);
        if (options.mode === "parse") {
            return options.parsed;
        }
        let str = "",
            fun = (options.mode === "diff")
                ? global.prettydiff.beautify[options.parsed.lexer[0]]
                : global.prettydiff[options.mode][options.parsed.lexer[0]]
        if (fun === undefined) {
            if (options.mode === "diff") {
                str = `Function global.prettydiff.beautify.${options.lexer} is undefined.`;
                console.log(str);
                return str;
            }
            str = `Function global.prettydiff.${options.mode}.${options.lexer} is undefined.`;
            console.log(str);
            return str;
        }
        options.insize = 4;
        options.inchar = " ";
        prettyout = fun(options);
        return prettyout;
    };
    global.prettydiff = {
        analyze: {},
        app: prettydiff,
        beautify: {},
        minify: {}
    };
}());
