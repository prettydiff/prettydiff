/*jslint node:true */
/*eslint-env node*/
/*global global, window*/

(function prettydiff_init() {
    "use strict";

    const prettydiff = function prettydiff_(options):string {
        const mode:mode = (
                options.mode === "analyze" ||
                options.mode === "beautify" ||
                options.mode === "diff" ||
                options.mode === "minify" ||
                options.mode === "parse"
            )
                ? options.mode
                : "diff";
        let prettyout:string = "";
        if (options.lexer === undefined) {
            console.log("Missing required option: lexer.");
            return "Missing required option: lexer.";
        }
        options.parsed = window.parseFramework.parserArrays(options);
        if (options.mode === "parse") {
            return options.parsed;
        }
        let fun = (mode === "diff")
            ? global.prettydiff.beautify[options.parsed.lexer[0]]
            : global.prettydiff[options.mode][options.parsed.lexer[0]]
        if (fun === undefined) {
            if (mode === "diff") {
                console.log(`Function global.prettydiff.beautify.${options.lexer} is undefined.`);
                return `Function global.prettydiff.beautify.${options.lexer} is undefined.`;
            }
            console.log(`Function global.prettydiff.${mode}.${options.lexer} is undefined.`);
            return `Function global.prettydiff.${mode}.${options.lexer} is undefined.`;
        }
        options.insize = 4;
        options.inchar = " ";
        prettyout = fun(options);
        console.log(prettyout.slice(prettyout.length - 100));
    };
    global.prettydiff = {
        analyze: {},
        app: prettydiff,
        beautify: {},
        minify: {}
    };
}());
