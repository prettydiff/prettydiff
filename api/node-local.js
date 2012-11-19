(function () {
"use strict";
var prettydiff = require('../prettydiff.js'),
    fs = require("fs"),
    source = "",
    diff = "",
    result = [],
    options = {
        source: "",
        diff: "",
        mode: "diff",
        html: false,
        lang: "auto",
        topcoms: false,
        csvchar: ",",
        comments: "indent",
        content: false,
        force_indent: false,
        context: "",
        diffview: "sidebyside",
        insize: 4,
        inchar: " ",
        indent: "",
        quote: false,
        semicolon: false,
        style: "indent",
        sourcelabel: "base",
        difflabel: "new",
        conditional: false,
        diffcomments: false,
        readmethod: "screen",
        output: ""
    },
    args = (function () {
        var a = process.argv.slice(2),
            b = 0,
            c = a.length,
            d = [],
            e = [],
            f = 0;
        for (b = 0; b < c; b += 1) {
            e = [];
            f = a[b].indexOf(":");
            e.push(a[b].substring(0, f).replace(/(\s+)$/, "").toLowerCase());
            e.push(a[b].substring(f + 1).replace(/^(\s+)/, "").toLowerCase());
            d.push(e);
        }
        c = d.length;
        for (b = 0; b < c; b += 1) {
            if (d[b].length === 2) {
                if (d[b][0] === "source" && d[b][1].length > 0) {
                    source = d[b][1];
                }
                if (d[b][0] === "diff" && d[b][1].length > 0) {
                    diff = d[b][1];
                }
                if (d[b][0] === "mode" && (d[b][1] === "minify" ||  d[b][1] === "beautify")) {
                    options.mode = d[b][1];
                }
                if (d[b][0] === "html" && d[b][1] === "true") {
                    options.html = true;
                }
                if (d[b][0] === "lang" && (d[b][1] === "markup" || d[b][1] === "javascript" || d[b][1] === "css" || d[b][1] === "html" || d[b][1] === "csv" || d[b][1] === "text")) {
                    options.lang = d[b][1];
                    if (d[b][1] === "html") {
                        options.html = true;
                    }
                }
                if (d[b][0] === "topcoms" && d[b][1] === "true") {
                    options.topcoms = true;
                }
                if (d[b][0] === "csvchar" && d[b][1].length > 0) {
                    options.csvchar = d[b][1];
                }
                if (d[b][0] === "comments" && d[b][1] === "noindent") {
                    options.comments = "noindent";
                }
                if (d[b][0] === "content" && d[b][1] === "true") {
                    options.content = true;
                }
                if (d[b][0] === "force_indent" && d[b][1] === "true") {
                    options.force_indent = true;
                }
                if (d[b][0] === "context" && !isNaN(d[b][1])) {
                    options.context = Number(d[b][1]);
                }
                if (d[b][0] === "diffview" && d[b][1] === "inline") {
                    options.diffview = "inline";
                }
                if (d[b][0] === "insize" && !isNaN(d[b][1])) {
                    options.insize = Number(d[b][1]);
                }
                if (d[b][0] === "inchar" && d[b][1].length > 0) {
                    options.inchar = d[b][1];
                }
                if (d[b][0] === "indent" && d[b][1] === "allman") {
                    options.indent = "allman";
                }
                if (d[b][0] === "quote" && d[b][1] === "true") {
                    options.quote = true;
                }
                if (d[b][0] === "semicolon" && d[b][1] === "true") {
                    options.semicolon = true;
                }
                if (d[b][0] === "style" && d[b][1] === "noindent") {
                    options.style = "noindent";
                }
                if (d[b][0] === "sourcelabel" && d[b][1].length > 0) {
                    options.sourcelabel = d[b][1];
                }
                if (d[b][0] === "difflabel" && d[b][1].length > 0) {
                    options.difflabel = d[b][1];
                }
                if (d[b][0] === "conditional" && d[b][1] === "true") {
                    options.conditional = true;
                }
                if (d[b][0] === "diffcomments" && d[b][1] === "true") {
                    options.diffcomments = true;
                }
                if (d[b][0] === "readmethod" && d[b][1] === "file") {
                    options.readmethod = "file";
                }
                if (d[b][0] === "output" && d[b][1].length > 0) {
                    options.output = d[b][1];
                }
            }
        }
        return a.length;
    }()),
    report = "",
    error = (function () {
        var a = [];
        a.push("Arguments      - Type    - Definition");
        a.push("-------------------------------------");
        a.push("* source       - string  - The file source for interpretation. This is required.");
        a.push("* help         - string  - This list of argument definitions. The value is");
        a.push("                           unnecessary and is required only to pass in use of");
        a.push("                           the parameter.");
        a.push("");
        a.push("* mode         - string  - The operation to be performed. Defaults to 'diff'.");
        a.push("                 Accepted values: diff, beautify, minify.");
        a.push("");
        a.push("* diff         - string  - The file to be compared to the source file. This is");
        a.push("                           required if mode is 'diff'.");
        a.push("");
        a.push("* output       - string  - The file to store the output. If this argument is");
        a.push("                           absent the output will appear on the command line.");
        a.push("                           If the file specified does not exist it will be");
        a.push("                           created.");
        a.push("");
        a.push("* lang         - string  - The programming language of the source file.");
        a.push("                           Defaults to auto.");
        a.push("                 Accepted values: auto, markup, javascript, css, html, csv, text");
        a.push("* context      - number  - This shortens the diff output by allowing a");
        a.push("                           specified number of equivalent lines between each");
        a.push("                           line of difference. Defaults to an empty string,");
        a.push("                           which nullifies its use.");
        a.push("");
        a.push("* sourcelabel  - string  - This allows for a descriptive label of the source");
        a.push("                           file code of the diff HTML output. Defaults to 'base'");
        a.push("* difflabel    - string  - This allows for a descriptive label for the diff");
        a.push("                           file code of the diff HTML output. Defaults to new'.");
        a.push("");
        a.push("* diffview     - string  - This determines whether the diff HTML output should");
        a.push("                           display as a side-by-side comparison or if the");
        a.push("                           differences should display in a single table column.");
        a.push("                           Defaults to 'sidebyside'.");
        a.push("                 Accepted values: sidebyside, inline");
        a.push("");
        a.push("* topcoms      - boolean - If mode is 'minify' this determines whether comments");
        a.push("                           above the first line of code should be kept. Default");
        a.push("                           is false.");
        a.push("");
        a.push("* csvchar      - string  - The character to be used as a separator if lang is");
        a.push("                           'csv'. Any string combination is accepted. Defaults");
        a.push("                           to a comma ','.");
        a.push("");
        a.push("* insize       - number  - The number of characters to comprise a single");
        a.push("                           indentation. Defaults to '4'.");
        a.push("");
        a.push("* inchar       - string  - The string characters to comprise a single");
        a.push("                           indentation. Any string combination is accepted.");
        a.push("                           Defaults to space ' '.");
        a.push("");
        a.push("* indent       - string  - If lang is 'javascript' and mode is 'beautify' this");
        a.push("                           determines if opening curly braces will exist on the");
        a.push("                           same line as their condition or be forced onto a new");
        a.push("                           line. Defaults to 'knr'.");
        a.push("                 Accepted values: knr, allman");
        a.push("");
        a.push("* quote        - boolean - If true and mode is 'diff' then all single quote");
        a.push("                           characters will be replaced by double quote");
        a.push("                           characters in both the source and diff file input so");
        a.push("                           as to eliminate some differences from the diff");
        a.push("                           report HTML output.");
        a.push("");
        a.push("* semicolon    - boolean - If true and mode is 'diff' and lang is 'javascript'");
        a.push("                           all semicolon characters that immediately preceed");
        a.push("                           any white space containing a new line character will");
        a.push("                           be removed so as to elimate some differences from");
        a.push("                           the diff report HTML output.");
        a.push("");
        a.push("* comments     - string  - If mode is 'beautify' this will determine whether");
        a.push("                           comments should always start at position 0 of each");
        a.push("                           line or if comments should be indented according to");
        a.push("                           sthe code. Default is 'indent'.");
        a.push("                 Accepted values: indent, noindent");
        a.push("");
        a.push("* style        - string  - If mode is 'beautify' and lang is 'markup' or 'html'");
        a.push("                           this will determine whether the contents of script");
        a.push("                           and style tags should always start at position 0 of");
        a.push("                           each line or if such content should be indented");
        a.push("                           starting from the opening script or style tag.");
        a.push("                           Default is 'indent'.");
        a.push("                 Accepted values: indent, noindent");
        a.push("");
        a.push("* html         - boolean - If lang is 'markup' this will provide an override so");
        a.push("                           that some tags are treated as singletons and not");
        a.push("                           start tags, such as '<br>' opposed to '<br/>'.");
        a.push("");
        a.push("* content      - boolean - If true and mode is 'diff' this will normalize all");
        a.push("                           string literals in JavaScript to 'text' and all");
        a.push("                           content in markup to 'text' so as to eliminate some");
        a.push("                           differences from the HTML diff report. Default is");
        a.push("                           false.");
        a.push("");
        a.push("* force_indent - boolean - If lang is 'markup' this will force indentation upon");
        a.push("                           all content and tags without regard for the creation");
        a.push("                           of new text nodes. Default is false.");
        a.push("");
        a.push("* conditional  - boolean - If true then conditional comments used by Internet");
        a.push("                           Explorer are preserved at minification of markup.");
        a.push("                           Default is false.");
        a.push("");
        a.push("* diffcomments - boolean - If true then comments will be preserved so that both");
        a.push("                           code and comments are compared by the diff engine.");
        a.push("");
        a.push("* output       - string  - The location of the output file. If the file does");
        a.push("                           not exist it will be created. If this argument is");
        a.push("                           missing output will print to screen.");
        a.push("");
        a.push("* color        - string  - The color scheme of the reports. Default is shadow.");
        a.push("                 Accepted values: default, coffee, dark, canvas, shadow, white");
        a.push("");
        a.push("* readmethod   - string  - The readmethod determines if operating with IO from");
        a.push("                           command line or IO from files.  Default value is");
        a.push("                           'screen' which expects code to be entered on the");
        a.push("                           command line and returns the result to the command");
        a.push("                           line. The value 'file' reads from files and writes");
        a.push("                           to the file specific in the 'output' argument.");
        a.push("                 Accepted values: screen, file");
        a.push("");
        a.push("* output       - string  - The path and name of the file to write the output.");
        a.push("                           If the file exists it will be over written else it");
        a.push("                           will be created.");
        a.push("");
        return a.join("\n");
    }());
    if (args === 0) {
        return console.log(error);
    }
    if (source === "") {
        return console.log("Error: 'source' argument is empty");
    }
    if (options.mode === "diff" && diff === "") {
        return console.log("Error: 'diff' argument is empty");
    }
    if (options.readmethod === "file" && options.output === "") {
        return console.log("Error: 'output' argument is empty");
    }
    if (options.readmethod === "screen") {
        options.source = source;
        options.diff = diff;
        result = prettydiff.api(options);
        return console.log(result[0]);
    }
    options.source = fs.readFileSync(source, "utf8");
    if (options.mode === "diff") {
        options.diff = fs.readFileSync(diff, "utf8");
    }
    report = (function () {
        var a = options.output,
            b = a.lastIndexOf(".");
        return a.substring(0, b) + "-report.html";
    }());
    result = prettydiff.api(options);
    fs.writeFile(options.output, result[0], function (err) {
        if (err) {
            console.log("\nError writing code output.\n");
            return console.log(err);
        }
        console.log("\nCode successfully written to file.");
    });
    fs.writeFile(report, result[1], function (err) {
        if (err) {
            console.log("\nError writing report output.\n");
            return console.log(err);
        }
        console.log("\nReport successfully written to file.");
    });
}());