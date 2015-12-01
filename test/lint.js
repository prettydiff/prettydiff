/*jslint node:true*/
//JS files must pass jslint prior to publication
(function lintrunner() {
    "use strict";
    var files           = [],
        fs              = require("fs"),
        JSLINT          = function lintrunner_declareJSLINT() {
            return;
        },
        prettydiff      = require("../prettydiff.js").api,
        ignoreDirectory = [
            ".vscode", "ace", "bin", "ignore", "node_modules", "test/samples_correct", "test/samples_raw"
        ],
        flag            = {
            files: false,
            fs   : false,
            items: false,
            lint : false
        },
        options         = {
            correct     : false,
            crlf        : false,
            html        : true,
            inchar      : " ",
            insize      : 4,
            lang        : "javascript",
            methodchain : false,
            mode        : "beautify",
            nocaseindent: false,
            objsort     : "all",
            preserve    : true,
            varword     : "none",
            vertical    : "all",
            wrap        : 80
        },
        complete        = function lintrunner_complete() {
            console.log("");
            console.log("All tasks complete... Exiting clean!");
            process.exit(0);
        },
        errout          = function lintrunner_errout(errtext) {
            console.log(errtext);
            process.exit(1);
        },
        unitTest        = function lintrunner_unitTest() {
            var raw     = [],
                correct = [],
                countr  = 0,
                countc  = 0,
                flag    = {
                    raw    : false,
                    correct: false
                },
                sort    = function lintrunner_unitTest_sort(a, b) {
                    if (a > b) {
                        return 1;
                    }
                    return -1;
                },
                compare = function lintrunner_unitTest_compare() {
                    var len    = (raw.length > correct.length)
                            ? raw.length
                            : correct.length,
                        a      = 0,
                        output = "",
                        clistr = [],
                        report = [],
                        child  = require("child_process").exec;
                    raw.sort(sort);
                    correct.sort(sort);
                    options.lang = "auto";
                    options.correct = true;
                    options.quoteConvert = "double";
                    for (a = 0; a < len; a += 1) {
                        if (raw[a] === undefined || correct[a] === undefined) {
                            if (raw[a] === undefined) {
                                console.log("\x1B[31mRaw samples directory is missing file:\x1B[39m " + correct[a][0]);
                                correct.splice(a, 1);
                            } else {
                                console.log("\x1B[31mCorrect samples directory is missing file:\x1B[39m " + raw[a][0]);
                                raw.splice(a, 1);
                            }
                            len = (raw.length > correct.length)
                                ? raw.length
                                : correct.length;
                            a -= 1;
                            if (a === len - 1) {
                                complete();
                            }
                        } else if (raw[a][0] === correct[a][0]) {
                            options.source = raw[a][1];
                            output = prettydiff(options)[0];
                            if (output.charAt(output.length - 1) !== "\n") {
                                output = output + "\n";
                            }
                            if (output === correct[a][1]) {
                                console.log("\x1B[32mPretty Diff is good with file:\x1B[39m " + correct[a][0]);
                                if (a === len - 1) {
                                    complete();
                                }
                            } else {
                                options.mode = "diff";
                                options.source = output;
                                options.diff = correct[a][1];
                                options.diffcli = true;
                                options.context = 2;
                                options.lang = "text";
                                report = prettydiff(options);
                                (function () {
                                    var aa     = 0,
                                        plural = "",
                                        pdlen  = report[0].length,
                                        count  = [0, 0],
                                        colors = {
                                            del     : {
                                                charEnd  : "\x1B[22m",
                                                charStart: "\x1B[1m",
                                                lineEnd  : "\x1B[39m",
                                                lineStart: "\x1B[31m"
                                            },
                                            filepath: {
                                                end  : "\x1B[39m",
                                                start: "\x1B[36m"
                                            },
                                            ins     : {
                                                charEnd  : "\x1B[22m",
                                                charStart: "\x1B[1m",
                                                lineEnd  : "\x1B[39m",
                                                lineStart: "\x1B[32m"
                                            }
                                        };
                                    count[0] += report[report.length - 1];
                                    if (count[0] !== 1) {
                                        plural = "s";
                                    }
                                    //report indexes from diffcli feature of diffview.js
                                    //0 - source line number
                                    //1 - source code line
                                    //2 - diff line number
                                    //3 - diff code line
                                    //4 - change
                                    //5 - index of options.context (not parallel)
                                    //6 - total count of differences
                                    for (aa = 0; aa < pdlen; aa += 1) {
                                        if (report[4][aa] === "equal" && report[4][aa + 1] === "equal" && report[4][aa + 2] !== undefined && report[4][aa + 2] !== "equal") {
                                            count[1] += 1;
                                            if (count[1] === 51) {
                                                break;
                                            }
                                            console.log("");
                                            console.log(colors.filepath.start + correct[a][0]);
                                            console.log("Line: " + report[0][aa] + colors.filepath.end);
                                            if (aa === 0) {
                                                console.log(report[3][aa]);
                                                console.log(report[3][aa + 1]);
                                            }
                                        }
                                        if (report[4][aa] === "delete") {
                                            if (report[1][aa] === "") {
                                                report[1][aa] = "(empty line)";
                                            } else if (report[1][aa].replace(/\ +/g, "") === "") {
                                                report[1][aa] = "(indentation)";
                                            }
                                            console.log(colors.del.lineStart + report[1][aa].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                                        } else if (report[4][aa] === "insert") {
                                            if (report[3][aa] === "") {
                                                report[3][aa] = "(empty line)";
                                            } else if (report[3][aa].replace(/\ +/g, "") === "") {
                                                report[3][aa] = "(indentation)";
                                            }
                                            console.log(colors.ins.lineStart + report[3][aa].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                                        } else if (report[4][aa] === "equal" && aa > 1) {
                                            console.log(report[3][aa]);
                                        } else if (report[4][aa] === "replace") {
                                            console.log(colors.del.lineStart + report[1][aa].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                                            console.log(colors.ins.lineStart + report[3][aa].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                                        }
                                    }
                                    errout("Pretty Diff failed on file: " + colors.filepath.start + correct[a][0] + colors.filepath.end);
                                }());
                            }
                        } else {
                            if (raw[a][0] < correct[a][0]) {
                                console.log("\x1B[31mCorrect samples directory is missing file:\x1B[39m " + raw[a][0]);
                                raw.splice(a, 1);
                            } else {
                                console.log("\x1B[31mRaw samples directory is missing file:\x1B[39m " + correct[a][0]);
                                correct.splice(a, 1);
                            }
                            len = (raw.length > correct.length)
                                ? raw.length
                                : correct.length;
                            a -= 1;
                            if (a === len - 1) {
                                complete();
                            }
                        }
                    }
                },
                readDir = function lintrunner_unitTest_readDir(type) {
                    var path = __dirname + "/samples_" + type;
                    fs.readdir(path, function lintrunner_unitTest_readDir_callback(err, list) {
                        var pusher = function lintrunner_unitTest_readDir_callback_pusher(val, ind, arr) {
                            fs.readFile(__dirname + "/samples_" + type + "/" + val, "utf8", function lintrunner_unitTest_readDir_callback_pusher_readFile(erra, fileData) {
                                if (erra !== null && erra !== undefined) {
                                    errout("Error reading file: " + __dirname + "/samples_" + type + "/" + val);
                                }
                                if (type === "raw") {
                                    raw.push([val, fileData]);
                                    countr += 1;
                                    if (countr === arr.length) {
                                        flag.raw = true;
                                        if (flag.correct === true) {
                                            compare();
                                        }
                                    }
                                } else if (type === "correct") {
                                    correct.push([val, fileData]);
                                    countc += 1;
                                    if (countc === arr.length) {
                                        flag.correct = true;
                                        if (flag.raw === true) {
                                            compare();
                                        }
                                    }
                                }
                                return ind;
                            });
                        };
                        if (err !== null) {
                            errout("Error reading from directory: /samples_" + type);
                        }
                        list.forEach(pusher);
                    });
                };
            console.log("");
            console.log("Unit Testing");
            console.log("");
            readDir("raw");
            readDir("correct");
        },
        packageTest     = function lintrunner_unitTest() {
            console.log("");
            console.log("Testing package.json beautification...");
            fs.readFile("package.json", "utf8", function lintrunner_prettylint_lintit_lintOn_json(err, data) {
                var prettydata = "";
                if (err !== null && err !== undefined) {
                    errout("Cannot read package.json");
                }
                options.source = data;
                prettydata     = prettydiff(options)[0];
                if (data !== prettydata) {
                    console.log("");
                    console.log(prettydata);
                    errout("Pretty Diff corrupted package.json");
                }
                console.log("The package.json file is beautified properly.");
                unitTest();
            });
            options.correct = true;
        },
        prettylint      = function lintrunner_prettylint() {
            var lintit = function lintrunner_prettylint_lintit(val, ind, arr) {
                var ltext = new JSLINT({
                    edition: "latest",
                    for    : true,
                    node   : true,
                    white  : false
                });
                options.source = val[1];
                ltext.write({
                    body: prettydiff(options)[0],
                    file: val[0]
                });
                ltext.on("data", function lintrunner_prettylint_lintit_lintOn(chunk) {
                    var errors = chunk.linted.errors,
                        ecount = 0,
                        report = function lintrunner_prettylint_lintit_lintOn_report(val) {
                            if (val === null || val.reason.indexOf("Unexpected dangling '_'") === 0) {
                                return;
                            }
                            if (ecount === 0) {
                                console.log("JSLint errors on " + chunk.file);
                                console.log("");
                            }
                            ecount += 1;
                            console.log("On line " + val.line + " at column: " + val.character + " " + val.reason);
                            console.log(val.evidence);
                            console.log("");
                        };
                    if (chunk.ok === false) {
                        errors.forEach(report);
                        errout("Lint fail :(");
                    }
                    console.log("Lint good for file " + (ind + 1) + ": " + val[0]);
                    if (ind === arr.length - 1) {
                        console.log("Lint operation complete!");
                        console.log("");
                        packageTest();
                    }
                });
            };
            console.log("\n\nBeautifying and Linting\n");
            files.forEach(lintit);
        };
    (function lintrunner_install() {
        var dateobj = new Date(),
            date    = Number("" + dateobj.getFullYear() + (dateobj.getMonth() + 1) + dateobj.getDate()),
            today   = require("./today.js").date,
            child   = require("child_process").exec;
        if (date > today) {
            console.log("Installing JSLint...");
            child("npm install jslint", {
                timeout: 30000
            }, function lintrunner_install_callback(error, stdout, stderr) {
                if (error !== null) {
                    return errout(error);
                }
                if (typeof stderr === "string" && stderr.length > 0) {
                    return errout(stderr);
                }
                JSLINT    = require("jslint").LintStream;
                console.log("Installed JSLint edition: " + JSLINT({edition: "latest"}).JSlint.edition);
                flag.lint = true;
                if (flag.fs === true) {
                    prettylint();
                }
                return stdout;
            });
            fs.writeFile("test/today.js", "var today=" + date + ";exports.date=today;");
        } else {
            JSLINT    = require("jslint").LintStream;
            console.log("JSLint edition: " + JSLINT({edition: "latest"}).JSlint.edition);
            flag.lint = true;
            if (flag.fs === true) {
                prettylint();
            }
        }
    }());
    (function lintrunner_getFiles() {
        var fc       = 0,
            ft       = 0,
            total    = 0,
            count    = 0,
            idLen    = ignoreDirectory.length,
            readFile = function lintrunner_getFiles_readFile(filePath) {
                fs
                    .readFile(filePath, "utf8", function lintrunner_getFiles_readFile_callback(err, data) {
                        if (err !== null && err !== undefined) {
                            errout(err);
                        }
                        fc += 1;
                        if (ft === fc) {
                            flag.files = true;
                        }
                        files.push([
                            filePath.slice(filePath.indexOf("/prettydiff/") + 12),
                            data
                        ]);
                        console.log("Reading file: " + filePath);
                        if (flag.files === true && flag.items === true) {
                            flag.fs = true;
                            if (flag.lint === true) {
                                flag.files = false;
                                prettylint();
                            }
                        }
                    });
            },
            readDir  = function lintrunner_getFiles_readDir(path) {
                fs
                    .readdir(path, function lintrunner_getFiles_readDir_callback(erra, list) {
                        var fileEval = function lintrunner_getFiles_readDir_callback_fileEval(val) {
                            var filename = path + "/" + val;
                            fs.stat(filename, function lintrunner_getFiles_readDir_callback_fileEval_stat(errb, stat) {
                                var a         = 0,
                                    ignoreDir = false;
                                if (errb !== null) {
                                    return errout(errb);
                                }
                                count += 1;
                                if (count === total) {
                                    flag.items = true;
                                }
                                if (stat.isFile() === true && (/(\.js)$/).test(val) === true) {
                                    ft += 1;
                                    readFile(filename);
                                }
                                if (stat.isDirectory() === true) {
                                    do {
                                        if (val === ignoreDirectory[a]) {
                                            ignoreDir = true;
                                            break;
                                        }
                                        a += 1;
                                    } while (a < idLen);
                                    if (ignoreDir === true) {
                                        if (flag.files === true && flag.items === true) {
                                            flag.fs = true;
                                            if (flag.lint === true) {
                                                flag.items = false;
                                                prettylint();
                                            }
                                        }
                                    } else {
                                        lintrunner_getFiles_readDir(filename);
                                    }
                                }
                            });
                        };
                        if (erra !== null) {
                            return errout("Error reading path: " + path + "\n" + erra);
                        }
                        total += list.length;
                        list.forEach(fileEval);
                    });
            };
        readDir(__dirname.replace(/((\/|\\)test)$/, ""));
    }());
}());
