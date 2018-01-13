/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */
(function pdNodeLocal() {
    "use strict";
    const startTime:[number, number]      = process.hrtime(),
        node:pdNode           = {
            fs   : require("fs"),
            http : require("http"),
            https: require("https"),
            path : require("path")
        },
        args:string[] = process.argv.slice(2),
        readmethod = function (input:string):string {
            if (input.indexOf("http") === 0) {
                return "http";
            }
            if (input.indexOf(":") > -1) {
                input = input.slice(input.indexOf(":") + 1);
            }
        };
    let sourcetype:string = "file",
        difftype:string = "file";
}());
