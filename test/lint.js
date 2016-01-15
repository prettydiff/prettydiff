/*jslint node:true*/
//The order array determines which tests run in which order (from last to first index)
(function taskrunner() {
    "use strict";
    var order       = [
            "lint", //        - run jslint on all unexcluded files in the repo
            "packagejson", // - beautify the package.json file and compare it to itself
            "coreunits", //   - run a variety of files through the application and compare the result to a known good file
            "simulations" //  - simulate a variety of execution steps and options from the command line
        ],
        startTime   = Date.now(),
        fs          = require("fs"),
        path        = require("path"),
        humantime   = function taskrunner_humantime() {
            var minuteString = "",
                hourString   = "",
                secondString = "",
                finalTime    = "",
                finalMem     = "",
                minutes      = 0,
                hours        = 0,
                elapsed      = 0,
                memory       = {},
                prettybytes  = function taskrunner_humantime_prettybytes(an_integer) {
                    //find the string length of input and divide into triplets
                    var length  = an_integer
                            .toString()
                            .length,
                        triples = (function taskrunner_humantime_prettybytes_triples() {
                            if (length < 22) {
                                return Math.floor((length - 1) / 3);
                            }
                            //it seems the maximum supported length of integer is 22
                            return 8;
                        }()),
                        //each triplet is worth an exponent of 1024 (2 ^ 10)
                        power   = (function taskrunner_humantime_prettybytes_power() {
                            var a = triples - 1,
                                b = 1024;
                            if (triples === 0) {
                                return 0;
                            }
                            if (triples === 1) {
                                return 1024;
                            }
                            do {
                                b = b * 1024;
                                a -= 1;
                            } while (a > 0);
                            return b;
                        }()),
                        //kilobytes, megabytes, and so forth...
                        unit    = [
                            "",
                            "KB",
                            "MB",
                            "GB",
                            "TB",
                            "PB",
                            "EB",
                            "ZB",
                            "YB"
                        ],
                        output  = "";

                    if (typeof an_integer !== "number" || isNaN(an_integer) === true || an_integer < 0 || an_integer % 1 > 0) {
                        //input not a positive integer
                        output = "0.00B";
                    } else if (triples === 0) {
                        //input less than 1000
                        output = an_integer + "B";
                    } else {
                        //for input greater than 999
                        length = Math.floor((an_integer / power) * 100) / 100;
                        output = length.toFixed(2) + unit[triples];
                    }
                    return output;
                },
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
            memory       = process.memoryUsage();
            finalMem     = prettybytes(memory.rss);

            //last line for additional instructions without bias to the timer
            elapsed      = (Date.now() - startTime) / 1000;
            secondString = elapsed.toFixed(3);
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
            finalTime = hourString + minuteString + secondString;
            console.log(finalMem + " of memory consumed");
            console.log(finalTime + " total time");
            console.log("");
        },
        prettydiff  = require("../prettydiff.js").api,
        options     = {},
        errout      = function taskrunner_errout(errtext) {
            console.log("");
            console.error(errtext);
            humantime();
            process.exit(1);
        },
        next        = function taskrunner_nextInit() {
            return;
        },
        phases = {
            coreunits: function taskrunner_coreunits() {
                var raw     = [],
                    correct = [],
                    countr  = 0,
                    countc  = 0,
                    utflag  = {
                        correct: false,
                        raw    : false
                    },
                    sort    = function taskrunner_coreunits_sort(a, b) {
                        if (a > b) {
                            return 1;
                        }
                        return -1;
                    },
                    compare = function taskrunner_coreunits_compare() {
                        var len       = (raw.length > correct.length)
                                ? raw.length
                                : correct.length,
                            a         = 0,
                            output    = "",
                            filecount = 0,
                            diffFiles = function taskrunner_coreunits_compare_diffFiles() {
                                var aa     = 0,
                                    line   = 0,
                                    pdlen  = 0,
                                    count  = [
                                        0, 0
                                    ],
                                    diffs  = 0,
                                    lcount = 0,
                                    report = [],
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
                                options.mode    = "diff";
                                options.source  = output;
                                options.diff    = correct[a][1];
                                options.diffcli = true;
                                options.context = 2;
                                options.lang    = "text";
                                report          = prettydiff(options);
                                pdlen           = report[0].length;
                                count[0]        += report[report.length - 1];
                                //report indexes from diffcli feature of diffview.js
                                //0 - source line number
                                //1 - source code line
                                //2 - diff line number
                                //3 - diff code line
                                //4 - change
                                //5 - index of options.context (not parallel)
                                //6 - total count of differences
                                if (report[0][0] < 2) {
                                    diffs += 1;
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
                                        line   = report[0][aa] + 2;
                                        lcount = 0;
                                        diffs  += 1;
                                        console.log("");
                                        console.log(colors.filepath.start + correct[a][0]);
                                        console.log("Line: " + line + colors.filepath.end);
                                        if (aa === 0) {
                                            console.log(report[3][aa]);
                                            console.log(report[3][aa + 1]);
                                        }
                                    }
                                    if (lcount < 7) {
                                        lcount += 1;
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
                                }
                                console.log("");
                                console.log(diffs + colors.filepath.start + " differences counted." + colors.filepath.end);
                                errout("Pretty Diff " + colors.del.lineStart + "failed" + colors.del.lineEnd + " on file: " + colors.filepath.start + correct[a][0] + colors.filepath.end);
                            };
                        raw.sort(sort);
                        correct.sort(sort);
                        options = {
                            correct     : true,
                            crlf        : false,
                            html        : true,
                            inchar      : " ",
                            insize      : 4,
                            lang        : "auto",
                            methodchain : false,
                            mode        : "beautify",
                            nocaseindent: false,
                            objsort     : "all",
                            preserve    : true,
                            quoteConvert: "double",
                            spaceclose  : true,
                            varword     : "none",
                            vertical    : "all",
                            wrap        : 80
                        };
                        for (a = 0; a < len; a += 1) {
                            if (raw[a] === undefined || correct[a] === undefined) {
                                if (raw[a] === undefined) {
                                    console.log("\x1B[33msamples_raw directory is missing file:\x1B[39m " + correct[a][0]);
                                    correct.splice(a, 1);
                                } else {
                                    console.log("\x1B[33msamples_correct directory is missing file:\x1B[39m " + raw[a][0]);
                                    raw.splice(a, 1);
                                }
                                len = (raw.length > correct.length)
                                    ? raw.length
                                    : correct.length;
                                a   -= 1;
                                if (a === len - 1) {
                                    console.log("");
                                    console.log("\x1B[32mCore Unit Testing Complete\x1B[39m");
                                    return next();
                                }
                            } else if (raw[a][0] === correct[a][0]) {
                                options.source = raw[a][1];
                                output         = prettydiff(options)[0];
                                if (output.charAt(output.length - 1) !== "\n") {
                                    output = output + "\n";
                                }
                                if (output === correct[a][1]) {
                                    filecount += 1;
                                    console.log("\x1B[32mPretty Diff is good with file " + filecount + ":\x1B[39m " + correct[a][0]);
                                    if (a === len - 1) {
                                        return next();
                                    }
                                } else {
                                    diffFiles();
                                }
                            } else {
                                if (raw[a][0] < correct[a][0]) {
                                    console.log("\x1B[33mCorrect samples directory is missing file:\x1B[39m " + raw[a][0]);
                                    raw.splice(a, 1);
                                } else {
                                    console.log("\x1B[33mRaw samples directory is missing file:\x1B[39m " + correct[a][0]);
                                    correct.splice(a, 1);
                                }
                                len = (raw.length > correct.length)
                                    ? raw.length
                                    : correct.length;
                                a   -= 1;
                                if (a === len - 1) {
                                    return next();
                                }
                            }
                        }
                    },
                    readDir = function taskrunner_coreunits_readDir(type) {
                        var dirpath = __dirname + "/samples_" + type;
                        fs.readdir(dirpath, function taskrunner_coreunits_readDir_callback(err, list) {
                            var pusher = function taskrunner_coreunits_readDir_callback_pusher(val, ind, arr) {
                                fs
                                    .readFile(__dirname + "/samples_" + type + "/" + val, "utf8", function taskrunner_coreunits_readDir_callback_pusher_readFile(erra, fileData) {
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
                console.log("");
                console.log("\x1B[36mCore Unit Testing\x1B[39m");
                console.log("");
                readDir("raw");
                readDir("correct");
            },
            lint: function taskrunner_lint() {
                var ignoreDirectory = [
                        ".vscode",
                        "ace",
                        "bin",
                        "coverage",
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
                    files           = [],
                    jslint          = function taskrunner_declareJSLINT() {
                        return;
                    },
                    lintrun         = function taskrunner_lint_lintrun() {
                        var lintit = function taskrunner_lint_lintrun_lintit(val, ind, arr) {
                            var JSLINT = jslint,
                                ltext  = new JSLINT({edition: "latest", for: true, node: true, white: true});
                            options.source = val[1];
                            ltext.write({
                                body: prettydiff(options)[0],
                                file: val[0]
                            });
                            ltext.on("data", function taskrunner_lint_lintrun_lintit_lintOn(chunk) {
                                var errors = chunk.linted.errors,
                                    failed = false,
                                    ecount = 0,
                                    report = function taskrunner_lint_lintrun_lintit_lintOn_report(val) {
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
                                    console.log("\x1B[32mLint operation complete!\x1B[39m");
                                    console.log("");
                                    return next();
                                }
                            });
                        };
                        options = {
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
                        };
                        files.forEach(lintit);
                    };
                console.log("");
                console.log("");
                console.log("\x1B[36mBeautifying and Linting\x1B[39m");
                console.log("** Note that line numbers of error messaging reflects beautified code line.");
                console.log("");
                (function taskrunner_lint_install() {
                    var dateobj = new Date(),
                        day     = (dateobj.getDate() > 9)
                            ? "" + dateobj.getDate()
                            : "0" + dateobj.getDate(),
                        month   = (dateobj.getMonth() > 9)
                            ? "" + (dateobj.getMonth() + 1)
                            : "0" + (dateobj.getMonth() + 1),
                        date    = Number("" + dateobj.getFullYear() + month + day),
                        today   = require("./today.js").date,
                        child   = require("child_process").exec,
                        caller  = function taskrunner_lint_install_caller() {
                            console.log("\x1B[36mInstalling JSLint...\x1B[36m");
                            child("npm install jslint", {
                                timeout: 30000
                            }, function taskrunner_lint_install_caller_callback(error, stdout, stderr) {
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
                                    lintrun();
                                }
                                return stdout;
                            });
                            fs.writeFile("test/today.js", "var today=" + date + ";exports.date=today;");
                        };
                    if (date > today) {
                        caller();
                    } else {
                        fs
                            .stat("/node_modules/jslint", function taskrunner_lint_install_stat(err) {
                                if (typeof err === "string") {
                                    if (err.indexOf("no such file or directory") > 0) {
                                        caller();
                                    } else {
                                        errout(err);
                                    }
                                } else {
                                    jslint = require("jslint").LintStream;
                                    console.log("\x1B[36mJSLint edition:\x1B[39m " + jslint({edition: "latest"}).JSlint.edition);
                                    flag.lint = true;
                                    if (flag.fs === true) {
                                        lintrun();
                                    }
                                }
                            });
                    }
                }());
                (function taskrunner_lint_getFiles() {
                    var fc       = 0,
                        ft       = 0,
                        total    = 0,
                        count    = 0,
                        idLen    = ignoreDirectory.length,
                        readFile = function taskrunner_lint_getFiles_readFile(filePath) {
                            fs
                                .readFile(filePath, "utf8", function taskrunner_lint_getFiles_readFile_callback(err, data) {
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
                                    if (flag.files === true && flag.items === true) {
                                        flag.fs = true;
                                        if (flag.lint === true) {
                                            flag.files = false;
                                            lintrun();
                                        }
                                    }
                                });
                        },
                        readDir  = function taskrunner_lint_getFiles_readDir(path) {
                            fs
                                .readdir(path, function taskrunner_lint_getFiles_readDir_callback(erra, list) {
                                    var fileEval = function taskrunner_lint_getFiles_readDir_callback_fileEval(val) {
                                        var filename = path + "/" + val;
                                        fs.stat(filename, function taskrunner_lint_getFiles_readDir_callback_fileEval_stat(errb, stat) {
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
                                                            lintrun();
                                                        }
                                                    }
                                                } else {
                                                    taskrunner_lint_getFiles_readDir(filename);
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
            },
            packagejson: function taskrunner_packagejson() {
                fs.readFile("package.json", "utf8", function taskrunner_packagejson_readFile(err, data) {
                    var prettydata = "";
                    if (err !== null && err !== undefined) {
                        errout("Cannot read package.json");
                    }
                    if (data.indexOf("_requiredBy") > 0) {
                        return next();
                    }
                    console.log("");
                    console.log("\x1B[36mTesting package.json beautification...\x1B[39m");
                    options.source = data;
                    prettydata     = prettydiff(options)[0];
                    if (data !== prettydata) {
                        console.log("");
                        console.log(prettydata);
                        errout("\x1B[31mPretty Diff corrupted package.json\x1B[36m");
                    }
                    console.log("\x1B[32mThe package.json file is beautified properly.\x1B[36m");
                    return next();
                });
            },
            simulations: function taskrunner_simulations() {
                var passcount = [], //passing tests in local group
                    finished  = [], //completed tests in local group
                    grouplen  = [], //length of local group
                    groupname = [], //name of current group
                    teardowns = [], //a list of tear down lists
                    units     = [], //test unit arrays
                    index     = [], //current array index of current group
                    total     = 0, //total number of tests
                    gcount    = 0, //total number of groups
                    fgroup    = 0, //total number of groups containing failed tests
                    fails     = 0, //total number of failed tests
                    depth     = -1, //current depth
                    single    = false, //look for the unit test file
                    tablen    = 2, //size of indentation in spaces
                    tests     = [
                        {
                            group: "api simulation - node-local.js",
                            buildup: ["mkdir test/simulation", "echo \"<a><b> <c/>    </b></a>\" > test/simulation/testa.txt", "echo \"<a><b> <d/>    </b></a>\" > test/simulation/testb.txt", "echo \"\" > test/simulation/testa1.txt", "echo \"\" > test/simulation/testb1.txt", "echo \"some simple text for an example\" > test/simulation/testc1.txt", "echo \"\" > test/simulation/testd1.txt"],
                            teardown: ["rm -rf test/simulation"],
                            units: [
                                {
                                    group: "readmethod: screen",
                                    units: [
                                        {
                                            check: "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" mode:\"beautify\"",
                                            name: "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check: "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" mode:\"minify\"",
                                            name: "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check: "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" mode:\"parse\"",
                                            name: "Parse markup.",
                                            verify: "{\"token\":[\"<a>\",\"<b>\",\" \",\"<c/>\",\" \",\"</b>\",\"</a>\"],\"types\":[\"start\",\"start\",\"content\",\"singleton\",\"content\",\"end\",\"end\"]}"
                                        }, {
                                            check: "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\"",
                                            name: "Diff markup.",
                                            verify: "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www.w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool</title><meta name='robots' content='index, follow'/> <meta name='DC.title' content='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://prettydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' content='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' content='text/css'/><style type='text/css'>body{font-family:'Arial';font-size:10px;overflow-y:scroll}#announcement.big{color:#00c;font-weight:bold;height:auto;left:14em;margin:0;overflow:hidden;position:absolute;text-overflow:ellipsis;top:4.5em;white-space:nowrap;width:50%;z-index:5}#announcement.big strong.duplicate{display:block}#announcement.big span{display:block}#announcement.normal{color:#000;font-weight:normal;height:2.5em;margin:0 -5em -4.75em;position:static;width:27.5em}#apireturn textarea{font-size:1.2em;height:50em;width:100%}#apitest input,#apitest label,#apitest select,#apitest textarea{float:left}#apitest input,#apitest select,#apitest textarea{width:30em}#apitest label{width:20em}#apitest p{clear:both;padding-top:0.75em}#beau-other-span,#diff-other-span{left:-20em;position:absolute;width:0}#beauops p strong,#options p strong,#diffops p strong,#miniops p strong,#options .label,#diffops .label,#miniops .label,#beauops .label{display:block;float:left;font-size:1.2em;font-weight:bold;margin-bottom:1em;width:17.5em}#beauops span strong,#miniops span strong,#diffops span strong{display:inline;float:none;font-size:1em;width:auto}#feedreport{right:38.8em}#beautyinput,#minifyinput,#baseText,#newText,#beautyoutput,#minifyoutput{font-size:1em}#Beautify,#Minify,#diffBase,#diffNew{border-radius:0.4em;padding:1em 1.25em 0}#Beautify .input,#Minify .input,#Beautify .output,#Minify .output{width:49%}#Beautify .input label,#Beautify .output label,#Minify .input label,#Minify .output label{display:block;font-size:1.05em;font-weight:bold}#Beautify p.file,#Minify p.file{clear:none;float:none}#Beautify textarea,#Minify textarea{margin-bottom:0.75em}#checklist_option li{font-weight:bold}#checklist_option li li{font-weight:normal}#codeInput{margin-bottom:1em;margin-top:-3.5em}#codeInput #diffBase p,#codeInput #diffNew p{clear:both;float:none}#codeInput .input{clear:none;float:left}#codeInput .output{clear:none;float:right;margin-top:-2.4em}#cssreport.doc table{position:absolute}#css-size{left:24em}#css-uri{left:40em}#css-uri td{text-align:left}#csvchar{width:11.8em}#dcolorScheme{float:right;margin:-2em 0 0}#dcolorScheme label{display:inline-block;font-size:1em}#diff .addsource{cursor:pointer;margin-bottom:1em;padding:0}#diff .addsource input{display:block;float:left;margin:0.5em 0.5em -1.5em}#diff .addsource label{cursor:pointer;display:inline-block;font-size:1.2em;padding:0.5em 0.5em 0.5em 2em}#diffBase,#diffNew,#Beautify,#Minify,#doc div,#doc div div,#doc ol,#option_comment,#update,#thirdparties img,#diffoutput #thirdparties,.box h3.heading,.box .body,.options,.diff .replace em,.diff .delete em,.diff .insert em,button,fieldset{border-style:solid;border-width:0.1em}#diffBase,#diffNew{padding:1.25em 1%;width:47%}#diffBase textarea,#diffNew textarea{width:99.5%}#diffBase{float:left;margin-right:1%}#diffNew{float:right}#diffoutput{width:100%}#diffoutput #thirdparties li{display:inline-block;list-style-type:none}#diffoutput li em,#diffoutput p em,.analysis .bad,.analysis .good{font-weight:bold}#diffoutput ul{font-size:1.2em;margin-top:1em}#diffoutput ul li{display:list-item;list-style-type:disc}#displayOps{float:right;font-size:1.5em;font-weight:bold;margin:0 1em 0 0;position:relative;width:22.5em;z-index:10}#displayOps #displayOps-hide{clear:both;float:none;position:absolute;top:-20em}#displayOps.default{position:static}#displayOps.maximized{margin-bottom:-2em;position:relative}#displayOps a{border-style:solid;border-width:0.1em;height:1.2em;line-height:1.4;margin:0.1em 0 0 5em;padding:0.05em 0 0.3em;text-align:center;text-decoration:none}#displayOps button,#displayOps a{font-size:1em}#displayOps li{clear:none;display:block;float:left;list-style:none;margin:0;text-align:right;width:9em}#doc_contents a{text-decoration:none}#doc_contents ol{padding-bottom:1em}#doc_contents ol ol li{font-size:0.75em;list-style:lower-alpha;margin:0.5em 0 1em 3em}#doc #doc_contents ol ol{background-color:inherit;border-style:none;margin:0.25em 0.3em 0 0;padding-bottom:0}#doc div.beautify{border-style:none}#doc #execution h3{background:transparent;border-style:none;font-size:1em;font-weight:bold}#doc code,.doc code{display:block;font-family:'Courier New',Courier,'Lucida Console',monospace;font-size:1.1em}#doc div,.doc div{margin-bottom:2em;padding:0 0.5em 0.5em}#doc div div,.doc div div{clear:both;margin-bottom:1em}#doc em,.doc em,.box .body em{font-style:normal;font-weight:bold}#doc h2,.doc h2{font-size:1.6em;margin:0.5em 0.5em 0.5em 0}#doc h3,.doc h3{margin-top:0.5em}#doc ol,.doc ol{clear:both;padding:0}#doc ol li span,.doc ol li span{display:block;margin-left:2em}#doc ol ol,#doc ul ol,.doc ol ol,.doc ul ol{margin-right:0.5em}#doc td span,.doc td span{display:block}#doc table,.doc table,.box .body table{border-collapse:collapse;border-style:solid;border-width:0.2em;clear:both}#doc table,.doc table{font-size:1.2em}#doc td,#doc th,.doc td,.doc th{border-left-style:solid;border-left-width:0.1em;border-top-style:solid;border-top-width:0.1em;padding:0.5em}#doc th,.doc th{font-weight:bold}#doc ul,.doc ul{margin-top:1em}#doc ul li,.doc ul li{font-size:1.2em}#feedemail{display:block;width:100%}#feedreportbody{text-align:center}#feedreportbody .radiogroup .feedlabel{display:block;margin:0 0 1em;width:auto;font-size:1.4em}#feedreportbody .radiogroup span{margin:0 0 2em;display:inline-block;width:5em}#feedreportbody .radiogroup input{position:absolute;top:-2000em}#feedreportbody .radiogroup label{display:inline-block;border-style:solid;border-width:0.1em;line-height:1.5;text-align:center;height:1.5em;width:1.5em;border-radius:50%;cursor:pointer}#feedreportbody .radiogroup span span{font-size:0.8em;display:block;margin:0;width:auto}#feedsubmit{position:static;width:50%;float:none;text-shadow:none;height:3em;margin:2.5em auto 0;font-family:inherit}#function_properties h4{font-size:1.2em;float:none}#function_properties h4 strong{color:#c00}#function_properties h5{margin:0 0 0 -2.5em;font-size:1em}#function_properties ol{padding-right:1em}#functionGroup.append{border-radius:0.2em;border-style:solid;border-width:0.1em;padding:0.7em 1.2em;position:relative;top:-2.625em}#functionGroup.append input{cursor:pointer}#functionGroup.append label{cursor:pointer;font-size:1em}#functionGroup.append span{display:inline-block;margin-left:2em}#hideOptions{margin-left:5em}#introduction{clear:both;margin:0 0 0 5.6em;position:relative;top:-2.75em}#introduction .information,#webtool #introduction h2{left:-90em;position:absolute;top:0;width:10em}#introduction h2{float:none}#introduction li{clear:none;display:block;float:left;font-size:1.4em;margin:0 4.95em -1em 0}#introduction li li{font-size:1em;margin-left:2em}#introduction ul{clear:both;height:3em;margin:0 0 0 -5.5em;overflow:hidden;width:100em}#modalSave p{background:#eee;color:#333;font-size:3em;padding:1em;position:absolute;text-align:center;top:10em;width:25em;z-index:9001}#modalSave p em{display:block;font-size:0.75em;margin-top:1em}#modalSave p strong{color:#c00;font-weight:bold}#modalSave span{background:#000;display:block;left:0;opacity:0.5;position:absolute;top:0;z-index:9000}#codereport{right:19.8em}#option_comment{font-size:1.2em;height:2.5em;margin-bottom:-1.5em;width:100%}#option_commentClear{float:right;height:2em;margin:-0.5em -0.25em 0 0;padding:0;width:15em}#options{margin:0 0 1em}#options label{width:auto}#options p,#addOptions p{clear:both;font-size:1em;margin:0;padding:1em 0 0}#options p span{height:2em;margin:0 0 0 1em}#pdsamples{list-style-position:inside;margin:0;padding:0;position:relative;z-index:10}#pdsamples li{border-radius:1em;border-style:solid;border-width:0.1em;margin:0 0 3em;padding:1em}#pdsamples li div{border-radius:1em;border-style:solid;border-width:0.1em;margin:0;padding:1em}#pdsamples li p{display:inline-block;font-size:1em;margin:0}#pdsamples li p a{display:block;margin:0 0 1em 2em}#pdsamples li ul{margin:0 0 0 2em}#reports{height:4em}#reports h2{display:none}#samples #dcolorScheme{position:relative;z-index:1000}#samples #pdsamples li li{background:none transparent;border-style:none;display:list-item;list-style:disc outside;margin:0;padding:0.5em}#samples h1{float:none}#samples h2{float:none;font-size:1.5em;border-style:none;margin:1em 0}#showOptionsCallOut{background:#fff;border:0.1em solid #000;box-shadow:0.2em 0.2em 0.4em rgba(0,0,0,.15);left:28.6%;padding:0.5em;position:absolute;top:4.6em;width:20%;z-index:1000}#showOptionsCallOut a{color:#66f;font-weight:bold}#showOptionsCallOut em{color:#c00}#showOptionsCallOut strong{color:#090}#statreport{right:0.8em}#statreport .body p,#statreport .body li,#statreport .body h3{font-size:1.2em}#statreport .body h3{margin-top:0}#statreport .body ul{margin-top:1em}#textareaTabKey{position:absolute;border-width:0.1em;border-style:solid;padding:0.5em;width:24em;right:51%}#textareaTabKey strong{text-decoration:underline}#textreport{width:100%}#thirdparties a{border-style:none;display:block;height:4em;text-decoration:none}#title_text{border-style:solid;border-width:0.05em;display:block;float:left;font-size:1em;margin-left:0.55em;padding:0.1em}#top{left:0;overflow:scroll;position:absolute;top:-200em;width:1em}#top em{font-weight:bold}#update{clear:left;float:right;font-weight:bold;padding:0.5em;position:absolute;right:1.25em;top:4.75em}#webtool .diff h3{border-style:none solid solid;border-width:0 0.1em 0.2em;box-shadow:none;display:block;font-family:Verdana;margin:0 0 0 -.1em;padding:0.2em 2em;text-align:left}#webtool .options input[type=text]{margin-right:1em;width:11.6em}#webtool .options input[type=text],div input,textarea{border-style:inset;border-width:0.1em}.analysis th{text-align:left}.analysis td{text-align:right}.beautify,.diff{border-style:solid;border-width:0.2em;display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;margin:0 1em 1em 0;position:relative}.beautify .count,.diff .count{border-style:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;text-align:right}.beautify .count li,.diff .count li{padding-left:2em}.beautify .count li{padding-top:0.5em}.beautify .count li.fold,.diff .count li.fold{color:#900;cursor:pointer;font-weight:bold;padding-left:0.5em}.beautify .data,.diff .data{text-align:left;white-space:pre}.beautify .data em{display:inline-block;font-style:normal;font-weight:bold;padding-top:0.5em}.beautify .data li,.diff .data li{padding-left:0.5em;white-space:pre}.beautify li,.diff li{border-style:none none solid;border-width:0 0 0.1em;display:block;line-height:1.2;list-style-type:none;margin:0;padding-bottom:0;padding-right:0.5em}.beautify ol,.diff ol{display:table-cell;margin:0;padding:0}.box{border-style:solid;border-width:0;left:auto;margin:0;padding:0;position:absolute;z-index:10}.box button{border-radius:0;border-style:solid;border-width:0.1em;display:block;float:right;font-family:'Lucida Console','Trebuchet MS','Arial';height:1.75em;padding:0;position:absolute;right:0;text-align:center;top:0;width:1.75em;z-index:7}.box button.resize{border-width:0.05em;cursor:se-resize;font-size:1.667em;font-weight:normal;height:0.8em;line-height:0.5em;margin:-.85em 0 0;position:absolute;right:0.05em;top:100%;width:0.85em}.box button.minimize{margin:0.35em 4em 0 0}.box button.maximize{margin:0.35em 1.75em 0 0}.box button.save{margin:0.35em 6.25em 0 0}.box .buttons{float:right;margin:0}.box h3.heading{cursor:pointer;float:left;font-size:1em;height:3em;margin:0 0 -3.2em;position:relative;width:17em;z-index:6}.box h3.heading span{display:block;font-size:1.8em;padding:0.25em 0 0 0.5em}.box .body{clear:both;height:20em;margin-top:-.1em;overflow:scroll;padding:4.25em 1em 1em;position:relative;right:0;top:0;width:75em;z-index:5}.button{margin:1em 0;text-align:center}.button button{display:block;font-size:2em;height:1.5em;margin:0 auto;padding:0;width:50%}.clear{clear:both;display:block}.diff .skip{border-style:none none solid;border-width:0 0 0.1em}.diff .diff-left,.diff .diff-right{display:table-cell}.diff .diff-left{border-style:none none none solid;border-width:0 0 0 0.1em}.diff .diff-right{border-style:none none none solid;border-width:0 0 0 0.1em;margin-left:-.1em;min-width:16.5em;right:0;top:0}.diff-right .data ol{min-width:16.5em}.diff-right .data{border-style:none solid none none;border-width:0 0.1em 0 0;width:100%}.diff-right .data li{min-width:16.5em}.diff li,.diff p,.diff h3,.beautify li{font-size:1.1em}.diff li{padding-top:0.5em}.diff li em{font-style:normal;margin:0 -.09em;padding:0.05em 0}.diff p.author{border-style:solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4em;text-align:right}.difflabel{display:block;height:0}.file,.labeltext{font-size:0.9em;font-weight:bold;margin-bottom:1em}.file input,.labeltext input{display:inline-block;margin:0 0.7em 0 0;width:16em}.input,.output{margin:0}.options{border-radius:0.4em;clear:both;margin-bottom:1em;padding:1em 1em 3.5em;width:auto}.options input,.options label{border-style:none;display:block;float:left}.output label{text-align:right}.options p span label{font-size:1em}.options p span{display:block;float:left;font-size:1.2em;min-width:14em;padding-bottom:0.5em}.options select,#csvchar{margin:0 0 0 1em}.options span label{margin-left:0.4em}body#doc{font-size:0.8em;margin:0 auto;max-width:80em}body#doc #function_properties ul{margin:0}body#doc #function_properties ul li{font-size:0.9em;margin:0.5em 0 0 4em}body#doc ul li,body#doc ol li{font-size:1.1em}body#doc table{font-size:1em}button,a.button{border-radius:0.15em;display:block;font-weight:bold;padding:0.2em 0;width:100%}div .button{text-align:center}div button,div a.button{display:inline-block;font-weight:bold;margin:1em 0;padding:1em 2em}button:hover,a.button:hover{cursor:pointer}fieldset{border-radius:0.9em;clear:both;margin:3.5em 0 -2em;padding:0 0 0 1em}h1{float:left;font-size:2em;margin:0 0.5em 0.5em 0}h1 svg,h1 img{border-style:solid;border-width:0.05em;float:left;height:1.5em;margin-right:0.5em;width:1.5em}h1 span{font-size:0.5em}h2,h3{background:#fff;border-style:solid;border-width:0.075em;display:inline-block;font-size:1.8em;font-weight:bold;margin:0 0.5em 0.5em 0;padding:0 0.2em}h3{font-size:1.6em}h4{font-size:1.4em}input[type='radio']{margin:0 0.25em}input[type='file']{box-shadow:none}label{display:inline;font-size:1.4em}legend{border-style:solid;border-width:0.1em;font-size:1.2em;font-weight:bold;margin-left:-.25em}li{clear:both;margin:1em 0 1em 3em}li h4{display:inline;float:left;margin:0.4em 0;text-align:left;width:14em}ol li{font-size:1.4em;list-style-type:decimal}ol li li{font-size:1em}p{clear:both;font-size:1.2em;margin:0 0 1em}select{border-style:inset;border-width:0.1em;width:11.85em}strong.new{background:#ff6;font-style:italic}strong label{font-size:1em;width:inherit}textarea{display:inline-block;font-family:'Courier New',Courier,'Lucida Console',monospace;height:10em;margin:0 0 -.1em;width:100%}ul{margin:-1.4em 0 2em;padding:0}ul li{list-style-type:none}@media print{div{width:100%}html td{font-size:0.8em;white-space:normal}p,.options,#Beautify,#Minify,#diff,ul{display:none}}@media screen and (-webkit-min-device-pixel-ratio:0){.beautify .count li{padding-top:0.546em}.beautify .data li{line-height:1.3}}@media (max-width: 640px){#functionGroup{height:4em}#functionGroup.append span{margin-left:0.5em;position:relative;z-index:10}#displayOps{margin-bottom:-2em;padding-right:0.75em;width:auto}#displayOps li{padding-top:2em}#displayOps a{margin-left:1em}#diffBase,#diffNew{width:46%}#reports{display:none}.labeltext input,.file input{width:12em}#update{margin-top:2.75em}#codeInput label{display:none}#doc #dcolorScheme{margin:0 0 1em}}#webtool.white input.unchecked{background:#ccc;color:#666}.white *:focus,.white .filefocus,.white #feedreportbody .focus,.white #feedreportbody .active-focus{outline:0.1em dashed #00f}.white #beautyoutput,.white #minifyoutput{background:#ddd}.white #Beautify,.white #Minify,.white #diffBase,.white #diffNew{background:#eee;border-color:#ccc;box-shadow:0 0.2em 0.4em rgba(64,64,64,0.15)}.white #diffoutput #thirdparties{background:#eee}.white #diffoutput p em,.white #diffoutput li em{color:#c00}.white #doc .analysis thead th,.white #doc .analysis th[colspan],.white .doc .analysis thead th,.white .doc .analysis th[colspan]{background:#eef}.white #doc div,.white .doc div,#doc.white div{background:#ddd;border-color:#999}.white #doc div:hover,.white .doc div:hover,#doc.white div:hover{background:#ccc}.white #doc div div,.white .doc div div,#doc.white div div{background:#eee;border-color:#999}.white #doc div div:hover,.white .doc div div:hover,#doc.white div div:hover,#doc.white div ol:hover{background:#fff}.white #doc em,.white .doc em,#doc.white em{color:#060}.white #doc ol,.white .doc ol,#doc.white ol{background:#f8f8f8;border-color:#999}.white #doc strong,.white .doc strong,.white .box .body strong{color:#c00}#doc.white table,.white #doc table,.white .doc table,.white .box .body table{background:#fff;border-color:#999}.white #doc th,.white .doc th,#doc.white th{background:#ddd;border-left-color:#999;border-top-color:#999}.white #doc tr:hover,.white .doc tr:hover,#doc.white tr:hover{background:#ddd}.white #feedreportbody .radiogroup label{background:#f8f8f8}.white #feedreportbody .feedradio1:hover,.white #feedreportbody .active .feedradio1,.white #feedreportbody .active-focus .feedradio1{background:#f66}.white #feedreportbody .feedradio2:hover,.white #feedreportbody .active .feedradio2,.white #feedreportbody .active-focus .feedradio2{background:#f96}.white #feedreportbody .feedradio3:hover,.white #feedreportbody .active .feedradio3,.white #feedreportbody .active-focus .feedradio3{background:#fc9}.white #feedreportbody .feedradio4:hover,.white #feedreportbody .active .feedradio4,.white #feedreportbody .active-focus .feedradio4{background:#ff9}.white #feedreportbody .feedradio5:hover,.white #feedreportbody .active .feedradio5,.white #feedreportbody .active-focus .feedradio5{background:#eea}.white #feedreportbody .feedradio6:hover,.white #feedreportbody .active .feedradio6,.white #feedreportbody .active-focus .feedradio6{background:#cd9}.white #feedreportbody .feedradio7:hover,.white #feedreportbody .active .feedradio7,.white #feedreportbody .active-focus .feedradio7{background:#8d8}.white #functionGroup.append{background:#eee;border-color:#ccc;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15)}.white #introduction h2{border-color:#999;color:#333}.white #option_comment{background:#ddd;border-color:#999}.white #pdsamples li{background:#eee;border-color:#999}.white #pdsamples li div{background:#ddd;border-color:#999}.white #pdsamples li div a{color:#47a}.white #pdsamples li p a{color:#009}.white #thirdparties img,.white #diffoutput #thirdparties{border-color:#999}.white #textareaTabKey{background:#fff;border-color:#ccf}.white #thirdparties img{box-shadow:0.2em 0.2em 0.4em #999}.white #title_text{border-color:#fff;color:#333}.white #top em{color:#00f}.white #update{background:#ddd;border-color:#999;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15)}.white .analysis .bad{background-color:#ebb;color:#400}.white .analysis .good{background-color:#cec;color:#040}.white .beautify .data .l0{background:#fff}.white .beautify .data .l1{background:#fed}.white .beautify .data .l2{background:#def}.white .beautify .data .l3{background:#efe}.white .beautify .data .l4{background:#fef}.white .beautify .data .l5{background:#eef}.white .beautify .data .l6{background:#fff8cc}.white .beautify .data .l7{background:#ede}.white .beautify .data .l8{background:#efc}.white .beautify .data .l9{background:#ffd}.white .beautify .data .l10{background:#edc}.white .beautify .data .l11{background:#fdb}.white .beautify .data .l12{background:#f8f8f8}.white .beautify .data .l13{background:#ffb}.white .beautify .data .l14{background:#eec}.white .beautify .data .l15{background:#cfc}.white .beautify .data .l16{background:#eea}.white .beautify .data .c0{background:#ddd}.white .beautify .data em.s0,#doc.white .beautify .data em.s0{color:#000}.white .beautify .data em.s1,#doc.white .beautify .data em.s1{color:#f66}.white .beautify .data em.s2,#doc.white .beautify .data em.s2{color:#12f}.white .beautify .data em.s3,#doc.white .beautify .data em.s3{color:#090}.white .beautify .data em.s4,#doc.white .beautify .data em.s4{color:#d6d}.white .beautify .data em.s5,#doc.white .beautify .data em.s5{color:#7cc}.white .beautify .data em.s6,#doc.white .beautify .data em.s6{color:#c85}.white .beautify .data em.s7,#doc.white .beautify .data em.s7{color:#737}.white .beautify .data em.s8,#doc.white .beautify .data em.s8{color:#6d0}.white .beautify .data em.s9,#doc.white .beautify .data em.s9{color:#dd0}.white .beautify .data em.s10,#doc.white .beautify .data em.s10{color:#893}.white .beautify .data em.s11,#doc.white .beautify .data em.s11{color:#b97}.white .beautify .data em.s12,#doc.white .beautify .data em.s12{color:#bbb}.white .beautify .data em.s13,#doc.white .beautify .data em.s13{color:#cc3}.white .beautify .data em.s14,#doc.white .beautify .data em.s14{color:#333}.white .beautify .data em.s15,#doc.white .beautify .data em.s15{color:#9d9}.white .beautify .data em.s16,#doc.white .beautify .data em.s16{color:#880}.white .beautify .data li{color:#777}.white .box{background:#666;border-color:#999;box-shadow:0 0.4em 0.8em rgba(64,64,64,0.25)}.white .box .body{background:#eee;border-color:#888;box-shadow:0 0 0.4em rgba(64,64,64,0.75)}.white .box .body em,.white .box .body .doc em{color:#090}.white .box button{box-shadow:0 0.1em 0.2em rgba(0,0,0,0.25);text-shadow:0.1em 0.1em 0.1em rgba(0,0,0,.25)}.white .box button.maximize{background:#9c9;border-color:#030;color:#030}.white .box button.maximize:hover{background:#cfc;border-color:#060;color:#060}.white .box button.minimize{background:#bbf;border-color:#006;color:#006}.white .box button.minimize:hover{background:#eef;border-color:#228;color:#228}.white .box button.resize{background:#bbf;border-color:#446;color:#446}.white .box button.resize:hover{background:#ddf;border-color:#228;color:#228}.white .box button.save{background:#d99;border-color:#300;color:#300}.white .box button.save:hover{background:#fcc;border-color:#822;color:#822}.white .box h3.heading{background:#ddd;border-color:#888;box-shadow:0.2em 0.2em 0.4em #ccc}.white .box h3.heading:hover{background:#333;color:#eee}.white .diff,.white .beautify,.white .diff ol,.white .beautify ol,.white .diff .diff-left,.white .diff .diff-right,.white h3,.white p.author{border-color:#999}.white .diff .count li,.white .beautify .count li{background:#eed;border-color:#bbc;color:#886}.white .diff .data .delete em{background-color:#fdd;border-color:#700;color:#600}.white .diff .data .insert em{background-color:#efc;border-color:#070;color:#050}.white .diff .data .replace em{background-color:#ffd;border-color:#963;color:#630}.white .diff .delete{background-color:#fbb;border-color:#eaa}.white .diff .equal,.white .beautify .data li{background-color:#fff;border-color:#eee}.white .diff .empty{background-color:#ddd;border-color:#ccc}.white .diff .insert{background-color:#bfb;border-color:#aea}.white .diff .replace{background-color:#fea;border-color:#dd8}.white .diff .skip{background-color:#efefef;border-color:#ddd}.white .diff h3{background:#ddd;border-bottom-color:#bbc}.white .diff p.author{background:#efefef;border-top-color:#bbc}.white .file input,.white .labeltext input{border-color:#fff}.white .options{background:#eee;border-color:#ccc;box-shadow:0 0.2em 0.4em rgba(64,64,64,0.15);text-shadow:0.05em 0.05em 0.1em #ddd}.white .options input[type=text],.white .options select{border-color:#999}.white .options h2,.white #Beautify h2,.white #Minify h2,.white #diffBase h2,.white #diffNew h2{background:#eee;border-color:#eee;box-shadow:none;text-shadow:none}.white a{color:#009}.white a.button:hover,.white a.button:active,.white button:hover,.white button:active{background:#fee;border-color:#cbb;color:#966;text-shadow:0.05em 0.05em 0.1em #f8e8e8}.white fieldset{background:#ddd;border-color:#999}.white h1 svg{background:#eee;border-color:#999;box-shadow:0 0.1em 0.2em rgba(150,150,150,0.5)}.white h2,.white h3{background:#fefefe;border-color:#999;box-shadow:none;text-shadow:none}.white legend{background:#fff;border-color:#999;color:#333;text-shadow:none}.white div input{border-color:#999}.white textarea{border-color:#ccc;border-style:solid}.white textarea:hover{background:#eef8ff}body.white button,body.white a.button{background:#f8f8f8;border-color:#bbb;box-shadow:0 0.1em 0.2em rgba(64,64,64,0.15);color:#666;text-shadow:0.05em 0.05em 0.1em #e0e0e0}html .white,body.white{color:#333}#about_license a{display:block}</style></head><body class='white'><h1><a href='http://prettydiff.com/'>Pretty Diff - The difference tool</a></h1><div id='doc'><p>Code type set to <strong>auto</strong>. Presumed language is <em>XML</em>.</p><p><strong>Execution time:</strong> <em>0</em></p><p><strong>Number of differences:</strong> <em>1</em> difference from <em>1</em> line of code.</p> <p>Accessibility note. &lt;em&gt; tags in the output represent character differences per lines compared.</p></div><div class='diff'><div class='diff-left'><h3 class='texttitle'>base</h3><ol class='count'><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ol><ol class='data'><li class='equal'>&lt;a&gt;&#10;</li><li class='equal'>    &lt;b&gt;&#10;</li><li class='replace'>        &lt;<em>c</em>/&gt;&#10;</li><li class='equal'>    &lt;/b&gt;&#10;</li><li class='equal'>&lt;/a&gt;&#10;</li></ol></div><div class='diff-right'><h3 class='texttitle'>new</h3><ol class='count' style='cursor:w-resize'><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li></ol><ol class='data'><li class='equal'>&lt;a&gt;&#10;</li><li class='equal'>    &lt;b&gt;&#10;</li><li class='replace'>        &lt;<em>d</em>/&gt;&#10;</li><li class='equal'>    &lt;/b&gt;&#10;</li><li class='equal'>&lt;/a&gt;&#10;</li></ol></div><p class='author'>Diff view written by <a href='http://prettydiff.com/'>Pretty Diff</a>.</p></div><script type='application/javascript'><![CDATA[var pd={};pd.colSliderProperties=[];(function(){var d=document.getElementsByTagName('ol'),cells=d[0].getElemensByTagName('li'),len=cells.length,a=0;pd.colSliderProperties=[d[0].clientWidth,d[1].clientWidth,d[2].parentNode.clientWidth,d[2].parentNode.parentNode.clientWidth,d[2].parentNode.offsetLeft-d[2].parentNode.parentNode.offsetLeft,];for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')==='fold'){cells[a].onmousedown=pd.difffold;}}if(d.length>3){d[2].onmousedown=pd.colSliderGrab;d[2].ontouchstart=pd.colSliderGrab;}}());pd.difffold=function dom__difffold(){var a=0,b=0,self=this,title=self.getAttribute('title').split('line '),min=Number(title[1].substr(0,title[1].indexOf(' '))),max=Number(title[2]),inner=self.innerHTML,lists=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('class')==='diff')?parent.getElementsByTagName('ol'):parent.parentNode.getElementsByTagName('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a].getElementsByTagName('li'));}if(lists.length>3){for(a=0;a<min;a+=1){if(lists[0][a].getAttribute('class')==='empty'){min+=1;max+=1;}}}max=(max>=lists[0].length)?lists[0].length:max;if(inner.charAt(0)==='-'){self.innerHTML='+'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='none';}}}else{self.innerHTML='-'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display='block';}}}};pd.colSliderGrab=function dom__colSliderGrab(e){var event=e||window.event,touch=(e.type==='touchstart')?true:false,node=this,diffRight=node.parentNode,diff=diffRight.parentNode,subOffset=0,counter=pd.colSliderProperties[0],data=pd.colSliderProperties[1],width=pd.colSliderProperties[2],total=pd.colSliderProperties[3],offset=pd.colSliderProperties[4],min=0,max=data-1,status='ew',minAdjust=min+15,maxAdjust=max-15,withinRange=false,diffLeft=diffRight.previousSibling,drop=function dom__colSliderGrab_drop(f){f=f||window.event;f.preventDefault();node.style.cursor=status+'-resize';if(touch===true){document.ontouchmove=null;document.ontouchend=null;}else{document.onmousemove=null;document.onmouseup=null;}},boxmove=function dom__colSliderGrab_boxmove(f){f=f||window.event;f.preventDefault();if(touch===true){subOffset=offset-f.touches[0].clientX;}else{subOffset=offset-f.clientX;}if(subOffset>minAdjust&&subOffset<maxAdjust){withinRange=true;}if(withinRange===true&&subOffset>maxAdjust){diffRight.style.width=((total-counter-2)/10)+'em';status='e';}else if(withinRange===true&&subOffset<minAdjust){diffRight.style.width=(width/10)+'em';status='w';}else if(subOffset<max&&subOffset>min){diffRight.style.width=((width+subOffset)/10)+'em';status='ew';}if(touch===true){document.ontouchend=drop;}else{document.onmouseup=drop;}};event.preventDefault();if(typeof pd.o==='object'&&pd.o.report.code.box!==null){offset+=pd.o.report.code.box.offsetLeft;offset-=pd.o.report.code.body.scrollLeft;}else{subOffset=(document.body.parentNode.scrollLeft>document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLeft;offset-=subOffset;}offset+=node.clientWidth;node.style.cursor='ew-resize';diff.style.width=(total/10)+'em';diff.style.display='inline-block';if(diffLeft.nodeType!==1){do{diffLeft=diffLeft.previousSibling;}while(diffLeft.nodeType!==1);}diffLeft.style.display='block';diffRight.style.width=(diffRight.clientWidth/10)+'em';diffRight.style.position='absolute';if(touch===true){document.ontouchmove=boxmove;document.ontouchstart=false;}else{document.onmousemove=boxmove;document.onmousedown=null;}};]]></script></body></html>"
                                        }
                                    ]
                                },
                                {
                                    group: "readmethod: filescreen",
                                    units: [
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"beautify\"",
                                            name: "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"minify\"",
                                            name: "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"parse\"",
                                            name: "Parse markup.",
                                            verify: "{\"token\":[\"<a>\",\"<b>\",\" \",\"<c/>\",\" \",\"</b>\",\"</a>\"],\"types\":[\"start\",\"start\",\"content\",\"singleton\",\"content\",\"end\",\"end\"]}"
                                        }
                                    ]
                                },
                                {
                                    group: "simple file tests",
                                    units: [
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" mode:\"beautify\"",
                                            name: "Verify `readmethod:file` throws error on missing output option",
                                            verify: "Error: 'readmethod' is value 'file' and argument 'output' is empty"
                                        },
                                        {
                                            check: "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\" diffcli:true",
                                            name: "Test diffcli option",
                                            verify: "\nScreen input with 1 difference\n\nLine: 3\x1b[39m\n<a>\n    <b>\n\x1B[31m        <\x1B[1mc\x1B[22m/>\x1B[39m\n\x1B[32m        <\x1B[1md\x1B[22m/>\x1B[39m\n    </b>\n</a>"
                                        },
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa1.txt\" readmethod:\"filescreen\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name: "Source file is empty",
                                            verify: "Source file at - is \x1B[31mempty\x1B[39m but the diff file is not."
                                        },
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"diff\" diff:\"test/simulation/testa1.txt\"",
                                            name: "Diff file is empty",
                                            verify: "Diff file at - is \x1B[31mempty\x1B[39m but the source file is not."
                                        },
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"diff\" diff:\"test/simulation/testa1.txt\" diffcli:\"true\"",
                                            name: "Diff file is empty with diffcli option",
                                            verify: "Diff file at - is \x1B[31mempty\x1B[39m but the source file is not."
                                        },
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name: "Diff file and source file are same file, readmethod filescreen",
                                            verify: "\nPretty Diff found 0 differences. Executed in."
                                        },
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" output:\"test/simulation\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name: "Diff file and source file are same file, readmethod file",
                                            verify: "\nPretty Diff found 0 differences. Executed in."
                                        },
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" output:\"test/simulation\" mode:\"diff\" diff:\"test/simulation/testc1.txt\"",
                                            name: "compare xml file to text file",
                                            verify: "\nFile successfully written.\n\nPretty Diff found -10 differences. Executed in."
                                        }
                                    ]
                                },
                                {
                                    group: "directory tests",
                                    units: [
                                        {
                                            check: "node api/node-local.js source:\"../prettydiff\" mode:\"beautify\" readmethod:\"directory\" output:\"test/simulation/prettydiff\" correct:\"true\" crlf:\"false\" html:\"true\" inchar:\" \" insize:4 lang:\"auto\" methodchain:\"false\" nocaseindent:\"false\" objsort:\"all\" preserve:\"true\" quoteConvert:\"double\" spaceclose:\"true\" varword:\"none\" vertical:\"all\" wrap:80",
                                            name: "beautify Pretty Diff directory",
                                            verify: "\nPretty Diff beautified -10 files. Executed in."
                                        }
                                    ]
                                },
                                {
                                    group: "readmethod: file",
                                    units: [
                                        {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"beautify\"",
                                            name: "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"minify\"",
                                            name: "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check: "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescreen\" mode:\"parse\"",
                                            name: "Parse markup.",
                                            verify: "{\"token\":[\"<a>\",\"<b>\",\" \",\"<c/>\",\" \",\"</b>\",\"</a>\"],\"types\":[\"start\",\"start\",\"content\",\"singleton\",\"content\",\"end\",\"end\"]}"
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    unitsort  = function taskrunner_simulations_unitsort(aa, bb) {
                        if (aa.group === undefined && bb.group !== undefined) {
                            return 1;
                        }
                        return -1;
                    },
                    slashfix  = function taskrunner_simulations_slashfix(command) {
                        var comchars = [],
                            a        = 0,
                            dirchar  = "\\",
                            output   = "";
                        if (path.sep === "/") {
                            return command;
                        }
                        if (path.sep !== "\\") {
                            dirchar = path.sep;
                        }
                        comchars = command.split("");
                        for (a = comchars.length - 1; a > -1; a -= 1) {
                            if (comchars[a] === "/" && comchars[a - 1] !== "<" && comchars[a + 1] !== ">") {
                                comchars[a] = dirchar;
                            }
                        }
                        output = comchars.join("");
                        if (dirchar === "\\") {
                            if (output.indexOf("node api/node-local.js") === 0) {
                                output = output + " crlf:\"true\"";
                            } else if (output.indexOf("rm ") === 0) {
                                output = output.replace(/rm\ (-r?f?)?\ /, "rmdir /Q /S ");
                            }
                        }
                        return output;
                    },
                    shell     = function taskrunner_simulations_shell(testData) {
                        var childExec = require("child_process").exec,
                            tab       = (function taskrunner_simulations_shell_child_writeLine_tab() {
                                var a   = 0,
                                    b   = 0,
                                    str = "";
                                for (a = depth + 2; a > 0; a -= 1) {
                                    for (b = tablen; b > 0; b -= 1) {
                                        str += " ";
                                    }
                                }
                                return str;
                            }()),
                            child     = function taskrunner_simulations_shell_child(param) {
                                param.check = slashfix(param.check);
                                childExec(param.check, function taskrunner_simulations_shell_child_childExec(err, stdout, stderr) {
                                    var data      = [param.name],
                                        //what to do when a group concludes
                                        writeLine = function taskrunner_simulations_shell_child_childExec_writeLine(item) {
                                            var fail          = 0,
                                                failper       = 0,
                                                plural        = "",
                                                groupn        = single
                                                    ? ""
                                                    : " for group: \x1B[39m\x1B[33m" + groupname[depth] + "\x1B[39m",
                                                totaln        = single
                                                    ? ""
                                                    : " in current group, " + total + " total",
                                                status        = (item[1] === "pass")
                                                    ? "\x1B[32mPass\x1B[39m test "
                                                    : "\x1B[31mFail\x1B[39m test ",
                                                groupComplete = function taskrunner_simulations_shell_child_childExec_writeLint_groupCompleteInit() {
                                                    return;
                                                },
                                                groupEnd      = function taskrunner_simulations_shell_child_childExec_writeLine_groupEnd() {
                                                    var groupPass = false;
                                                    if (teardowns[depth].length === 0) {
                                                        console.log("");
                                                    }
                                                    if (passcount[depth] === finished[depth]) {
                                                        if (grouplen[depth] === 1) {
                                                            console.log(tab.slice(tablen) + "\x1B[32mThe test passed" + groupn + "\x1B[39m");
                                                        } else {
                                                            console.log(tab.slice(tablen) + "\x1B[32mAll " + grouplen[depth] + " tests/groups passed" + groupn + "\x1B[39m");
                                                        }
                                                        groupPass = true;
                                                    } else {
                                                        if (passcount[depth] === 0) {
                                                            if (grouplen[depth] === 1) {
                                                                console.log(tab.slice(tablen) + "\x1B[31mThe test failed" + groupn + "\x1B[39m");
                                                            } else {
                                                                console.log(tab.slice(tablen) + "\x1B[31mAll " + grouplen[depth] + " tests/groups failed" + groupn + "\x1B[39m");
                                                            }
                                                        } else {
                                                            fgroup  += 1;
                                                            fail    = finished[depth] - passcount[depth];
                                                            failper = (fail / grouplen[depth]) * 100;
                                                            if (fail === 1) {
                                                                plural = "";
                                                            } else {
                                                                plural = "s";
                                                            }
                                                            console.log(tab.slice(tablen) + "\x1B[31m" + fail + "\x1B[39m test" + plural + " (" + failper.toFixed(0) + "%) failed of \x1B[32m" + finished[depth] + "\x1B[39m tests" + groupn + ".");
                                                        }
                                                    }
                                                    teardowns.pop();
                                                    grouplen.pop();
                                                    groupname.pop();
                                                    passcount.pop();
                                                    finished.pop();
                                                    units.pop();
                                                    index.pop();
                                                    depth -= 1;
                                                    if (depth > -1) {
                                                        tab             = tab.slice(tablen);
                                                        finished[depth] += 1;
                                                        groupn          = " for group: \x1B[39m\x1B[33m" + groupname[depth] + "\x1B[39m";
                                                        if (groupPass === true) {
                                                            passcount[depth] += 1;
                                                        }
                                                        if (finished[depth] < grouplen[depth]) {
                                                            index[depth] += 1;
                                                            if (units[depth][index].group !== undefined) {
                                                                taskrunner_simulations_shell(units[depth][index]);
                                                            } else {
                                                                taskrunner_simulations_shell_child(units[depth][index]);
                                                            }
                                                        }
                                                    } else {
                                                        console.log("");
                                                        console.log("All tests complete.");
                                                        plural = (total === 1)
                                                            ? ""
                                                            : "s";
                                                        totaln = (fails === 1)
                                                            ? ""
                                                            : "s";
                                                        groupn = (fgroup === 1)
                                                            ? ""
                                                            : "s";
                                                        status = (gcount === 1)
                                                            ? ""
                                                            : "s";
                                                        gcount -= 1;
                                                        if (fails === 0) {
                                                            console.log("\x1B[32mPassed all " + total + " test" + plural + " from all " + gcount + " groups.\x1B[39m");
                                                            console.log("");
                                                            console.log("\x1B[32mCLI simulation complete\x1B[39m");
                                                            return next();
                                                        }
                                                        if (fails === total) {
                                                            errout("\x1B[31mFailed all " + total + " test" + plural + " from all " + gcount + " groups.\x1B[39m");
                                                        } else {
                                                            if (fgroup === 1) {
                                                                groupn = "";
                                                            }
                                                            errout("\x1B[31mFailed " + fails + " test" + totaln + " from " + fgroup + " group" + groupn + "\x1B[39m out of " + total + " total tests across " + gcount + " group" + status + ".");
                                                        }
                                                        return stdout;
                                                    }
                                                    if (depth > -1 && finished[depth] === grouplen[depth]) {
                                                        groupComplete();
                                                    }
                                                },
                                                teardown      = function taskrunner_simulations_shell_child_writeLine_teardown(tasks) {
                                                    var a    = 0,
                                                        len  = tasks.length,
                                                        task = function taskrunner_simulations_shell_child_writeLine_teardown_task() {
                                                            tasks[a] = slashfix(tasks[a]);
                                                            console.log(tab + "  " + tasks[a]);
                                                            childExec(tasks[a], function taskrunner_simulations_shell_child_writeLine_teardown_task_exec(err, stdout, stderr) {
                                                                a += 1;
                                                                if (typeof err === "string") {
                                                                    console.log(err);
                                                                } else if (typeof stderr === "string" && stderr !== "") {
                                                                    console.log(stderr);
                                                                } else {
                                                                    if (a === len) {
                                                                        console.log(tab + "\x1B[36mTeardown\x1B[39m for group: \x1B[33m" + groupname[depth] + "\x1B[39m \x1B[32mcomplete\x1B[39m.");
                                                                        console.log("");
                                                                        groupEnd();
                                                                        return stdout;
                                                                    }
                                                                    taskrunner_simulations_shell_child_writeLine_teardown_task();
                                                                }
                                                            });
                                                        };
                                                    console.log("");
                                                    console.log(tab + "\x1B[36mTeardown\x1B[39m for group: \x1B[33m" + groupname[depth] + "\x1B[39m \x1B[36mstarted\x1B[39m.");
                                                    task();
                                                };
                                            groupComplete   = function taskrunner_simulations_shell_child_writeLine_groupComplete() {
                                                if (teardowns[depth].length > 0) {
                                                    teardown(teardowns[depth]);
                                                } else {
                                                    groupEnd();
                                                }
                                            };
                                            finished[depth] += 1;
                                            if (single === false && finished[depth] === 1) {
                                                if (depth === 0) {
                                                    console.log("");
                                                    console.log(tab.slice(tablen) + "\x1B[36mTest group: \x1B[39m\x1B[33m" + groupname[depth] + "\x1B[39m");
                                                } else {
                                                    console.log("");
                                                    console.log(tab.slice(tablen) + "Test unit " + (finished[depth - 1] + 1) + " of " + grouplen[depth - 1] + ", \x1B[36mtest group: \x1B[39m\x1B[33m" + groupname[depth] + "\x1B[39m");
                                                }
                                            }
                                            console.log(tab + item[0]);
                                            console.log(tab + status + finished[depth] + " of " + grouplen[depth] + totaln);
                                            if (item[1] !== "pass") {
                                                fails += 1;
                                                console.log(tab + item[2]);
                                            }
                                            if (finished[depth] === grouplen[depth]) {
                                                groupComplete();
                                            } else if (units[finished[depth]] !== undefined && units[finished[depth]].group !== undefined) {
                                                taskrunner_simulations_shell(units[finished[depth]]);
                                            }
                                        };
                                    //determine pass/fail status of a given test unit
                                    if (stdout.indexOf("Source file at ") === 0 && stdout.indexOf("is \x1B[31mempty\x1B[39m but the diff file is not.") > 0) {
                                        stdout = "Source file at - is \x1B[31mempty\x1B[39m but the diff file is not.";
                                    } else if (stdout.indexOf("Diff file at ") === 0 && stdout.indexOf("is \x1B[31mempty\x1B[39m but the source file is not.") > 0) {
                                        stdout = "Diff file at - is \x1B[31mempty\x1B[39m but the source file is not.";
                                    }
                                    stdout = stdout.replace(/(\s+)$/, "");
                                    stdout = stdout.replace(/<strong>Execution\ time:<\/strong>\ <em>([0-9]+\ hours\ )?([0-9]+\ minutes\ )?[0-9]+(\.[0-9]+)?\ seconds\ <\/em>/g, "<strong>Execution time:</strong> <em>0</em>");
                                    stdout = stdout.replace(/Executed\ in\ ([0-9]+\ hours\ )?([0-9]+\ minutes\ )?[0-9]+(\.[0-9]+)?\ seconds/g, "Executed in");
                                    stdout = stdout.replace(/\ \d+\ files\./, " -10 files.");
                                    if (stdout.indexOf("Pretty Diff found 0 differences.") < 0) {
                                        stdout = stdout.replace(/Pretty\ Diff\ found\ \d+\ differences./, "Pretty Diff found -10 differences.");
                                    }
                                    if (typeof err === "string") {
                                        data.push("fail");
                                        data.push(err);
                                    } else if (typeof stderr === "string" && stderr !== "") {
                                        data.push("fail");
                                        data.push(stderr);
                                    } else if (stdout !== param.verify) {
                                        data.push("fail");
                                        data.push("Unexpected output:  " + stdout);
                                    } else {
                                        passcount[depth] += 1;
                                        data.push("pass");
                                        data.push(stdout);
                                    }
                                    total += 1;
                                    writeLine(data);
                                });
                            },
                            buildup   = function taskrunner_simulations_shell_buildup(tasks) {
                                var a    = 0,
                                    len  = tasks.length,
                                    echo = [],
                                    task = function taskrunner_simulations_shell_buildup_task() {
                                        var buildstep = function taskrunner_simulations_shell_buildup_task_buildstep(err, stdout, stderr) {
                                            a += 1;
                                            if (typeof err === "string") {
                                                console.log("\x1B[31mError:\x1B[39m " + err);
                                                console.log("Terminated early");
                                            } else if (typeof stderr === "string" && stderr !== "") {
                                                console.log("\x1B[31mError:\x1B[39m " + stderr);
                                                console.log("Terminated early");
                                            } else {
                                                if (a < len) {
                                                    taskrunner_simulations_shell_buildup_task();
                                                } else {
                                                    console.log(tab + "\x1B[36mBuildup\x1B[39m for group: \x1B[33m" + testData.group + "\x1B[39m \x1B[32mcomplete\x1B[39m.");
                                                    if (index[depth] === 0 && units[depth][index[depth]].group !== undefined) {
                                                        taskrunner_simulations_shell(units[depth][index[depth]]);
                                                        return stdout;
                                                    }
                                                    for (index[depth] = index[depth]; index[depth] < grouplen[depth]; index[depth] += 1) {
                                                        if (units[depth][index[depth]].group === undefined) {
                                                            child(units[depth][index[depth]]);
                                                            if (units[depth][index[depth] + 1] !== undefined && units[depth][index[depth] + 1].group !== undefined) {
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        };
                                        tasks[a] = slashfix(tasks[a]);
                                        console.log(tab + "  " + tasks[a]);
                                        if (path.sep === "\\" && (/^(echo\s+("|'))/).test(tasks[a]) === true) {
                                            //windows will write CLI strings to files including the containing quotes
                                            options.source = tasks[a];
                                            options.mode   = "parse";
                                            options.lang   = "javascript";
                                            echo           = prettydiff(options);
                                            fs.writeFile(echo[0].token.slice(3).join(""), echo[0].token[1].slice(1, echo[0].token[1].length - 1), buildstep);
                                        } else {
                                            childExec(tasks[a], buildstep);
                                        }
                                    };
                                console.log("");
                                console.log(tab + "\x1B[36mBuildup\x1B[39m for group: \x1B[33m" + testData.group + "\x1B[39m \x1B[36mstarted\x1B[39m.");
                                task();
                            };
                        passcount.push(0);
                        if (single === false) {
                            groupname.push(testData.group);
                            finished.push(0);
                            index.push(0);
                            gcount += 1;
                            depth  += 1;
                            units.push(testData.units);
                            units[depth].sort(unitsort);
                            grouplen.push(units[depth].length);
                            if (testData.teardown !== undefined && testData.teardown.length > 0) {
                                teardowns.push(testData.teardown);
                            } else {
                                teardowns.push([]);
                            }
                            if (testData.buildup !== undefined && testData.buildup.length > 0) {
                                buildup(testData.buildup);
                            } else if (index[depth] === 0 && units[depth][index[depth]].group !== undefined) {
                                taskrunner_simulations_shell(units[depth][index[depth]]);
                            } else {
                                for (index[depth] = index[depth]; index[depth] < grouplen[depth]; index[depth] += 1) {
                                    if (units[depth][index[depth]].group === undefined) {
                                        child(units[depth][index[depth]]);
                                        if (units[depth][index[depth] + 1] !== undefined && units[depth][index[depth] + 1].group !== undefined) {
                                            break;
                                        }
                                    }
                                }
                            }
                        } else {
                            grouplen.push(tests.length);
                            child(testData);
                        }
                    };
                console.log("");
                console.log("");
                console.log("\x1B[36mCLI simulation tests\x1B[39m");
                tests.sort(unitsort);
                if (tests[tests.length - 1].group === undefined) {
                    single = true;
                }
                tests.forEach(shell);
            }
        };
    next = function taskrunner_next() {
        var complete = function taskrunner_complete() {
                console.log("");
                console.log("All tasks complete... Exiting clean!");
                humantime();
                process.exit(0);
            };
        if (order.length < 1) {
            return complete();
        }
        phases[order[0]]();
        order.splice(0, 1);
    };
    next();
}());
