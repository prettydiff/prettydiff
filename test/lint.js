/*jslint node:true*/
//JS files must pass jslint prior to publication
(function lintrunner() {
    "use strict";
    var files           = [],
        fs              = require("fs"),
        startTime       = Date.now(),
        humantime       = function lintrunner_humantime() {
            var minuteString = "",
                hourString   = "",
                minutes      = 0,
                hours        = 0,
                elapsed      = (Date.now() - startTime) / 1000,
                secondString = elapsed.toFixed(3),
                plural       = function core__proctime_plural(x, y) {
                    var a = "";
                    if (x !== 1) {
                        a = x + y + "s ";
                    } else {
                        a = x + y + " ";
                    }
                    return a;
                },
                minute       = function core__proctime_minute() {
                    minutes      = parseInt((elapsed / 60), 10);
                    minuteString = plural(minutes, " minute");
                    minutes      = elapsed - (minutes * 60);
                    secondString = (minutes === 1)
                        ? "1 second"
                        : minutes.toFixed(3) + " seconds";
                };
            if (elapsed >= 60 && elapsed < 3600) {
                minute();
            } else if (elapsed >= 3600) {
                hours      = parseInt((elapsed / 3600), 10);
                hourString = hours.toString();
                elapsed    = elapsed - (hours * 3600);
                hourString = plural(hours, " hour");
                minute();
            } else {
                secondString = plural(secondString, " second");
            }
            console.log("Duration: " + hourString + minuteString + secondString);
            console.log("");
        },
        jslint          = function lintrunner_declareJSLINT() {
            return;
        },
        prettydiff      = require("../prettydiff.js").api,
        ignoreDirectory = [
            ".vscode",
            "ace",
            "bin",
            "ignore",
            "node_modules",
            "test/samples_correct",
            "test/samples_raw"
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
            humantime();
            process.exit(0);
        },
        errout          = function lintrunner_errout(errtext) {
            console.log("");
            console.log(errtext);
            humantime();
            process.exit(1);
        },
        unitTest        = function lintrunner_unitTest() {
            var raw     = [],
                correct = [],
                countr  = 0,
                countc  = 0,
                utflag  = {
                    correct: false,
                    raw    : false
                },
                sort    = function lintrunner_unitTest_sort(a, b) {
                    if (a > b) {
                        return 1;
                    }
                    return -1;
                },
                compare = function lintrunner_unitTest_compare() {
                    var len       = (raw.length > correct.length)
                            ? raw.length
                            : correct.length,
                        a         = 0,
                        output    = "",
                        report    = [],
                        diffFiles = function lintrunner_unitTest_compare_diffFiles() {
                            var aa     = 0,
                                line   = 0,
                                pdlen  = report[0].length,
                                count  = [
                                    0, 0
                                ],
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
                            //report indexes from diffcli feature of diffview.js
                            //0 - source line number
                            //1 - source code line
                            //2 - diff line number
                            //3 - diff code line
                            //4 - change
                            //5 - index of options.context (not parallel)
                            //6 - total count of differences
                            if (report[0][0] < 2) {
                                console.log("");
                                console.log(colors.filepath.start + correct[a][0]);
                                console.log("Line: 1" + colors.filepath.end);
                            }
                            for (aa = 0; aa < pdlen; aa += 1) {
                                if (report[4][aa] === "equal" && report[4][aa + 1] === "equal" && report[4][aa + 2] !== undefined && report[4][aa + 2] !== "equal") {
                                    count[1] += 1;
                                    if (count[1] === 51) {
                                        break;
                                    }
                                    line = report[0][aa] + 2;
                                    console.log("");
                                    console.log(colors.filepath.start + correct[a][0]);
                                    console.log("Line: " + line + colors.filepath.end);
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
                            errout("Pretty Diff " + colors.del.lineStart + "failed" + colors.del.lineEnd + " on file: " + colors.filepath.start + correct[a][0] + colors.filepath.end);
                        };
                    raw.sort(sort);
                    correct.sort(sort);
                    options.lang         = "auto";
                    options.correct      = true;
                    options.spaceclose   = true;
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
                            a   -= 1;
                            if (a === len - 1) {
                                complete();
                            }
                        } else if (raw[a][0] === correct[a][0]) {
                            options.source = raw[a][1];
                            output         = prettydiff(options)[0];
                            if (output.charAt(output.length - 1) !== "\n") {
                                output = output + "\n";
                            }
                            if (output === correct[a][1]) {
                                console.log("\x1B[32mPretty Diff is good with file:\x1B[39m " + correct[a][0]);
                                if (a === len - 1) {
                                    complete();
                                }
                            } else {
                                options.mode    = "diff";
                                options.source  = output;
                                options.diff    = correct[a][1];
                                options.diffcli = true;
                                options.context = 2;
                                options.lang    = "text";
                                report          = prettydiff(options);
                                diffFiles();
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
                            a   -= 1;
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
                            fs
                                .readFile(__dirname + "/samples_" + type + "/" + val, "utf8", function lintrunner_unitTest_readDir_callback_pusher_readFile(erra, fileData) {
                                    if (erra !== null && erra !== undefined) {
                                        errout("Error reading file: " + __dirname + "/samples_" + type + "/" + val);
                                    }
                                    if (type === "raw") {
                                        raw.push([val, fileData]);
                                        countr += 1;
                                        if (countr === arr.length) {
                                            utflag.raw = true;
                                            if (utflag.correct === true) {
                                                compare();
                                            }
                                        }
                                    } else if (type === "correct") {
                                        correct.push([val, fileData]);
                                        countc += 1;
                                        if (countc === arr.length) {
                                            utflag.correct = true;
                                            if (utflag.raw === true) {
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
            console.log("\x1B[36mUnit Testing\x1B[39m");
            console.log("");
            readDir("raw");
            readDir("correct");
        },
        packageTest     = function lintrunner_unitTest() {
            console.log("");
            console.log("\x1B[36mTesting package.json beautification...\x1B[39m");
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
                    errout("\x1B[31mPretty Diff corrupted package.json\x1B[36m");
                }
                console.log("\x1B[32mThe package.json file is beautified properly.\x1B[36m");
                unitTest();
            });
            options.correct = true;
        },
        prettylint      = function lintrunner_prettylint() {
            var lintit = function lintrunner_prettylint_lintit(val, ind, arr) {
                var JSLINT = jslint,
                    ltext = new JSLINT({edition: "latest", for: true, node: true, white: true});
                options.source = val[1];
                ltext.write({
                    body: prettydiff(options)[0],
                    file: val[0]
                });
                ltext.on("data", function lintrunner_prettylint_lintit_lintOn(chunk) {
                    var errors = chunk.linted.errors,
                        failed = false,
                        ecount = 0,
                        report = function lintrunner_prettylint_lintit_lintOn_report(val) {
                            if (val === null || val.message.indexOf("Unexpected dangling '_'") === 0 || (/Bad\ property\ name\ '\w+_'\./).test(val.message) === true) {
                                return;
                            }
                            failed = true;
                            if (ecount === 0) {
                                console.log("\x1B[31mJSLint errors on\x1B[39m " + chunk.file);
                                console.log("");
                            }
                            ecount += 1;
                            console.log("On line " + val.line + " at column: " + val.column);
                            console.log(val.message);
                            console.log("");
                        };
                    if (chunk.linted.ok === false) {
                        errors.forEach(report);
                        if (failed === true) {
                            errout("\x1B[31mLint fail\x1B[39m :(");
                        }
                    }
                    console.log("\x1B[32mLint is good for file " + (ind + 1) + ":\x1B[39m " + val[0]);
                    if (ind === arr.length - 1) {
                        console.log("");
                        console.log("\x1B[32mLint operation complete!\x1B[36m");
                        console.log("");
                        packageTest();
                    }
                });
            };
            console.log("");
            console.log("");
            console.log("\x1B[36mBeautifying and Linting\x1B[39m");
            console.log("** Note that line numbers of error messaging reflects beautified code line.");
            console.log("");
            files.forEach(lintit);
        };
    (function lintrunner_install() {
        var dateobj = new Date(),
            date    = Number("" + dateobj.getFullYear() + (dateobj.getMonth() + 1) + dateobj.getDate()),
            today   = require("./today.js").date,
            child   = require("child_process").exec;
        if (date > today) {
            console.log("\x1B[36mInstalling JSLint...\x1B[36m");
            child("npm install jslint", {
                timeout: 30000
            }, function lintrunner_install_callback(error, stdout, stderr) {
                if (error !== null) {
                    return errout(error);
                }
                if (typeof stderr === "string" && stderr.length > 0) {
                    return errout(stderr);
                }
                jslint = require("jslint").LintStream;
                console.log("\x1B[32mInstalled JSLint edition:\x1B[39m " + jslint({edition: "latest"}).JSlint.edition);
                flag.lint = true;
                if (flag.fs === true) {
                    prettylint();
                }
                return stdout;
            });
            fs.writeFile("test/today.js", "var today=" + date + ";exports.date=today;");
        } else {
            jslint = require("jslint").LintStream;
            console.log("\x1B[36mJSLint edition:\x1B[39m " + jslint({edition: "latest"}).JSlint.edition);
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
                        console.log("\x1B[36mReading file:\x1B[39m " + filePath);
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
