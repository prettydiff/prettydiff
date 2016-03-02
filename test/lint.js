/*jslint node:true*/
/*jshint laxbreak: true*/
// The order array determines which tests run in which order (from last to first
// index)
(function taskrunner() {
    "use strict";
    var order      = [
            "lint", //        - run jslint on all unexcluded files in the repo
            "packagejson", // - beautify the package.json file and compare it to itself
            "coreunits", //   - run a variety of files through the application and compare the result to a known good file
            //"diffunits", //   - unit tests for the diff process
            "simulations" //  - simulate a variety of execution steps and options from the command line
        ],
        startTime  = Date.now(),
        fs         = require("fs"),
        path       = require("path"),
        humantime  = function taskrunner_humantime() {
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
                        ? " 1 second "
                        : minutes.toFixed(3) + " seconds ";
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
            console.log(finalTime + "total time");
            console.log("");
        },
        prettydiff = require("../prettydiff.js").api,
        options    = {},
        errout     = function taskrunner_errout(errtext) {
            console.log("");
            console.error(errtext);
            humantime();
            process.exit(1);
        },
        next       = function taskrunner_nextInit() {
            return;
        },
        phases     = {
            coreunits  : function taskrunner_coreunits() {
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
                                options.source  = output.replace(/\/\*prettydiff\.com\ /g, "/*");
                                options.diff    = correct[a][1].replace(/\/\*prettydiff\.com\ /g, "/*");
                                options.diffcli = true;
                                options.context = 2;
                                options.lang    = "text";
                                report          = prettydiff(options);
                                pdlen           = report[0].length;
                                if (report.length < 3) {
                                    console.log("");
                                    console.log(colors.del.lineStart + "Test diff operation provided a bad code sample:" + colors.del.lineEnd);
                                    console.log(report[0]);
                                    return errout(colors.del.lineStart + "bad test" + colors.del.lineEnd);
                                }
                                count[0] += report[report.length - 1];
                                // report indexes from diffcli feature of diffview.js 0 - source line number 1 -
                                // source code line 2 - diff line number 3 - diff code line 4 - change 5 -
                                // index of options.context (not parallel) 6 - total count of differences
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
                                        if (report[4][aa] === "delete" && report[0][aa] !== report[0][aa + 1]) {
                                            if (report[1][aa] === "") {
                                                report[1][aa] = "(empty line)";
                                            } else if (report[1][aa].replace(/\ +/g, "") === "") {
                                                report[1][aa] = "(indentation)";
                                            }
                                            console.log(colors.del.lineStart + report[1][aa].replace(/\\x1B/g, "\\x1B").replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                                        } else if (report[4][aa] === "insert" && report[2][aa] !== report[2][aa + 1]) {
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
                            preserve    : 2,
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
                                        } else if (type === "raw") {
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
            diffunits  : function taskrunner_diffunits() {
                return;
            },
            lint       : function taskrunner_lint() {
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
                fs
                    .readFile("package.json", "utf8", function taskrunner_packagejson_readFile(err, data) {
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
                        if (data.replace(/(\s+)$/, "") !== prettydata) {
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
                            buildup : [
                                "mkdir test/simulation",
                                "echo \"<a><b> <c/>    </b></a>\" > test/simulation/testa.txt",
                                "echo \"<a><b> <d/>    </b></a>\" > test/simulation/testb.txt",
                                "echo \"\" > test/simulation/testa1.txt",
                                "echo \"\" > test/simulation/testb1.txt",
                                "echo \"some simple text for an example\" > test/simulation/testc1.txt",
                                "echo \"\" > test/simulation/testd1.txt"
                            ],
                            group   : "api simulation - node-local.js",
                            teardown: ["rm -rf test/simulation"],
                            units   : [
                                {
                                    group: "readmethod: screen",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" " +
                                                        "mode:\"beautify\"",
                                            name  : "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" " +
                                                        "mode:\"minify\"",
                                            name  : "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" " +
                                                        "mode:\"parse\"",
                                            name  : "Parse markup.",
                                            verify: "{\"token\":[\"<a>\",\"<b>\",\" \",\"<c/>\",\" \",\"</b>\",\"</a>\"],\"types\":[" +
                                                    "\"start\",\"start\",\"content\",\"singleton\",\"content\",\"end\",\"end\"]}"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" " +
                                                        "mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\"",
                                            name  : "Diff markup.",
                                            verify: "<?xml version='1.0' encoding='UTF-8' ?><!DOCTYPE html PUBLIC '-//W3C//DTD XHTML " +
                                                        "1.1//EN' 'http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd'><html xmlns='http://www." +
                                                        "w3.org/1999/xhtml' xml:lang='en'><head><title>Pretty Diff - The difference tool<" +
                                                        "/title><meta name='robots' content='index, follow'/> <meta name='DC.title' conte" +
                                                        "nt='Pretty Diff - The difference tool'/> <link rel='canonical' href='http://pret" +
                                                        "tydiff.com/' type='application/xhtml+xml'/><meta http-equiv='Content-Type' conte" +
                                                        "nt='application/xhtml+xml;charset=UTF-8'/><meta http-equiv='Content-Style-Type' " +
                                                        "content='text/css'/><style type='text/css'>/*<![CDATA[*/#prettydiff.canvas{backg" +
                                                        "round:#986 url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkw" +
                                                        "kpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVF" +
                                                        "PpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIa" +
                                                        "KOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZC" +
                                                        "Fz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmC" +
                                                        "ZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5AN" +
                                                        "gtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RY" +
                                                        "FbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/y" +
                                                        "JiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2e" +
                                                        "Xk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0y" +
                                                        "LESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAP" +
                                                        "K7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/" +
                                                        "xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByA" +
                                                        "gTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvE" +
                                                        "cxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsT" +
                                                        "gsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJy" +
                                                        "KTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8" +
                                                        "naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY" +
                                                        "9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4" +
                                                        "hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81" +
                                                        "XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2" +
                                                        "MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3h" +
                                                        "TvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpx" +
                                                        "ZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbz" +
                                                        "wdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TD" +
                                                        "tMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1r" +
                                                        "utu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh" +
                                                        "1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt" +
                                                        "3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7" +
                                                        "XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngC" +
                                                        "UBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0A" +
                                                        "dh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZl" +
                                                        "nM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqB" +
                                                        "aMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG" +
                                                        "0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2" +
                                                        "a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km" +
                                                        "3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3H" +
                                                        "jlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PL" +
                                                        "i8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqu" +
                                                        "n4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/" +
                                                        "ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2" +
                                                        "fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/p" +
                                                        "PTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q" +
                                                        "28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96f" +
                                                        "ynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx" +
                                                        "3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEFdaVRYdFhNTDpjb20uYWRvYmUueG1wAA" +
                                                        "AAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eD" +
                                                        "p4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1Lj" +
                                                        "YtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIH" +
                                                        "htbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgIC" +
                                                        "AgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cD" +
                                                        "ovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy" +
                                                        "5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYW" +
                                                        "RvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOnN0Um" +
                                                        "VmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgIC" +
                                                        "AgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIH" +
                                                        "htbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgIC" +
                                                        "AgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIH" +
                                                        "htbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcm" +
                                                        "VhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb2" +
                                                        "9sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOk" +
                                                        "NyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtMDEtMTNUMTM6MTg6MDctMD" +
                                                        "Y6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTEzVD" +
                                                        "EzOjE4OjA3LTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG" +
                                                        "1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iYjM5NjA0MDVhOWQ8L3htcE1NOkluc3RhbmNlSU" +
                                                        "Q+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxYzM3NjE4MS" +
                                                        "1mOWU4LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bX" +
                                                        "BNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMT" +
                                                        "FkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+Ci" +
                                                        "AgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9Il" +
                                                        "Jlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3" +
                                                        "Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6NmIyNGUyN2EtY2" +
                                                        "YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgIC" +
                                                        "AgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgIC" +
                                                        "AgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTW" +
                                                        "FjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgIC" +
                                                        "AgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgIC" +
                                                        "AgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdE" +
                                                        "V2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LThjNDMtNmUyYzBhNDY4YmViPC" +
                                                        "9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVD" +
                                                        "EyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcm" +
                                                        "VBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2" +
                                                        "VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgIC" +
                                                        "AgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUm" +
                                                        "Vzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdG" +
                                                        "lvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2" +
                                                        "UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+Ci" +
                                                        "AgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cG" +
                                                        "U9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YW" +
                                                        "N0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLW" +
                                                        "MwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgIC" +
                                                        "AgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgIC" +
                                                        "AgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE" +
                                                        "1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaG" +
                                                        "FuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgIC" +
                                                        "AgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RX" +
                                                        "Z0OmFjdGlvbj5kZXJpdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpwYX" +
                                                        "JhbWV0ZXJzPmNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW" +
                                                        "1hZ2UvcG5nPC9zdEV2dDpwYXJhbWV0ZXJzPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgIC" +
                                                        "AgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgID" +
                                                        "xzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Om" +
                                                        "luc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iYjM5NjA0MDVhOWQ8L3N0RX" +
                                                        "Z0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTNUMTM6MT" +
                                                        "g6MDctMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW" +
                                                        "50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50Pg" +
                                                        "ogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgIC" +
                                                        "AgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3" +
                                                        "Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+Ci" +
                                                        "AgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6ODNhNzkwYWQtYzBlZC00YjNhLTlkMm" +
                                                        "EtYTljNDYxZGYzNWExPC9zdFJlZjppbnN0YW5jZUlEPgogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbn" +
                                                        "RJRD54bXAuZGlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RSZWY6ZG9jdW" +
                                                        "1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMj" +
                                                        "dhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwvc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPgogIC" +
                                                        "AgICAgICA8L3htcE1NOkRlcml2ZWRGcm9tPgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZG" +
                                                        "M6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2" +
                                                        "RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2" +
                                                        "hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW" +
                                                        "9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4zMDAwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW" +
                                                        "9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4zMDAwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW" +
                                                        "9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogIC" +
                                                        "AgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UG" +
                                                        "l4ZWxYRGltZW5zaW9uPjQ8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbF" +
                                                        "lEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPg" +
                                                        "ogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                                        "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                                        "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+bleIyQAAACBjSFJNAAB6JQAAgIMAAPn/AA" +
                                                        "CA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAANElEQVR42mJ89+4uAwMDAwPD6lkTGd69u/vu3d2ZHXnv3t" +
                                                        "1lgLPevbvLrCTIEJqWD1EJGADaTRll80WcLAAAAABJRU5ErkJggg==');color:#420}#prettydiff." +
                                                        "canvas *:focus{outline:0.1em dashed #f00}#prettydiff.canvas a{color:#039}#pretty" +
                                                        "diff.canvas .contentarea,#prettydiff.canvas legend,#prettydiff.canvas fieldset s" +
                                                        "elect,#prettydiff.canvas .diff td,#prettydiff.canvas .report td,#prettydiff.canv" +
                                                        "as .data li,#prettydiff.canvas .diff-right,#prettydiff.canvas fieldset input{bac" +
                                                        "kground:#eeeee8;border-color:#420}#prettydiff.canvas select,#prettydiff.canvas i" +
                                                        "nput,#prettydiff.canvas .diff,#prettydiff.canvas .beautify,#prettydiff.canvas .r" +
                                                        "eport,#prettydiff.canvas .beautify h3,#prettydiff.canvas .diff h3,#prettydiff.ca" +
                                                        "nvas .beautify h4,#prettydiff.canvas .diff h4,#prettydiff.canvas #report,#pretty" +
                                                        "diff.canvas #report .author,#prettydiff.canvas fieldset{background:#ddddd8;borde" +
                                                        "r-color:#420}#prettydiff.canvas fieldset fieldset{background:#eeeee8}#prettydiff" +
                                                        ".canvas fieldset fieldset input,#prettydiff.canvas fieldset fieldset select{back" +
                                                        "ground:#ddddd8}#prettydiff.canvas h2,#prettydiff.canvas h2 button,#prettydiff.ca" +
                                                        "nvas h3,#prettydiff.canvas legend{color:#900}#prettydiff.canvas .contentarea{box" +
                                                        "-shadow:0 1em 1em #b8a899}#prettydiff.canvas .segment{background:#fff}#prettydif" +
                                                        "f.canvas h2 button,#prettydiff.canvas .segment,#prettydiff.canvas ol.segment li{" +
                                                        "border-color:#420}#prettydiff.canvas th{background:#e8ddcc}#prettydiff.canvas li" +
                                                        " h4{color:#06f}#prettydiff.canvas code{background:#eee;border-color:#eee;color:#" +
                                                        "00f}#prettydiff.canvas ol.segment h4 strong{color:#c00}#prettydiff.canvas button" +
                                                        "{background-color:#ddddd8;border-color:#420;box-shadow:0 0.25em 0.5em #b8a899;co" +
                                                        "lor:#900}#prettydiff.canvas button:hover{background-color:#ccb;border-color:#630" +
                                                        ";box-shadow:0 0.25em 0.5em #b8a899;color:#630}#prettydiff.canvas th{background:#" +
                                                        "ccccc8}#prettydiff.canvas thead th,#prettydiff.canvas th.heading{background:#ccb" +
                                                        "}#prettydiff.canvas .diff h3{background:#ddd;border-color:#999}#prettydiff.canva" +
                                                        "s td,#prettydiff.canvas th,#prettydiff.canvas .segment,#prettydiff.canvas .count" +
                                                        " li,#prettydiff.canvas .data li,#prettydiff.canvas .diff-right{border-color:#ccc" +
                                                        "cc8}#prettydiff.canvas .count{background:#eed;border-color:#999}#prettydiff.canv" +
                                                        "as .count li.fold{color:#900}#prettydiff.canvas h2 button{background:#f8f8f8;box" +
                                                        "-shadow:0.1em 0.1em 0.25em #ddd}#prettydiff.canvas li h4{color:#00f}#prettydiff." +
                                                        "canvas code{background:#eee;border-color:#eee;color:#009}#prettydiff.canvas ol.s" +
                                                        "egment h4 strong{color:#c00}#prettydiff.canvas .data .delete{background:#ffd8d8}" +
                                                        "#prettydiff.canvas .data .delete em{background:#fff8f8;border-color:#c44;color:#" +
                                                        "900}#prettydiff.canvas .data .insert{background:#d8ffd8}#prettydiff.canvas .data" +
                                                        " .insert em{background:#f8fff8;border-color:#090;color:#363}#prettydiff.canvas ." +
                                                        "data .replace{background:#fec}#prettydiff.canvas .data .replace em{background:#f" +
                                                        "fe;border-color:#a86;color:#852}#prettydiff.canvas .data .empty{background:#ddd}" +
                                                        "#prettydiff.canvas .data em.s0{color:#000}#prettydiff.canvas .data em.s1{color:#" +
                                                        "f66}#prettydiff.canvas .data em.s2{color:#12f}#prettydiff.canvas .data em.s3{col" +
                                                        "or:#090}#prettydiff.canvas .data em.s4{color:#d6d}#prettydiff.canvas .data em.s5" +
                                                        "{color:#7cc}#prettydiff.canvas .data em.s6{color:#c85}#prettydiff.canvas .data e" +
                                                        "m.s7{color:#737}#prettydiff.canvas .data em.s8{color:#6d0}#prettydiff.canvas .da" +
                                                        "ta em.s9{color:#dd0}#prettydiff.canvas .data em.s10{color:#893}#prettydiff.canva" +
                                                        "s .data em.s11{color:#b97}#prettydiff.canvas .data em.s12{color:#bbb}#prettydiff" +
                                                        ".canvas .data em.s13{color:#cc3}#prettydiff.canvas .data em.s14{color:#333}#pret" +
                                                        "tydiff.canvas .data em.s15{color:#9d9}#prettydiff.canvas .data em.s16{color:#880" +
                                                        "}#prettydiff.canvas .data .l0{background:#eeeee8}#prettydiff.canvas .data .l1{ba" +
                                                        "ckground:#fed}#prettydiff.canvas .data .l2{background:#def}#prettydiff.canvas .d" +
                                                        "ata .l3{background:#efe}#prettydiff.canvas .data .l4{background:#fef}#prettydiff" +
                                                        ".canvas .data .l5{background:#eef}#prettydiff.canvas .data .l6{background:#fff8c" +
                                                        "c}#prettydiff.canvas .data .l7{background:#ede}#prettydiff.canvas .data .l8{back" +
                                                        "ground:#efc}#prettydiff.canvas .data .l9{background:#ffd}#prettydiff.canvas .dat" +
                                                        "a .l10{background:#edc}#prettydiff.canvas .data .l11{background:#fdb}#prettydiff" +
                                                        ".canvas .data .l12{background:#f8f8f8}#prettydiff.canvas .data .l13{background:#" +
                                                        "ffb}#prettydiff.canvas .data .l14{background:#eec}#prettydiff.canvas .data .l15{" +
                                                        "background:#cfc}#prettydiff.canvas .data .l16{background:#eea}#prettydiff.canvas" +
                                                        " .data .c0{background:inherit}#prettydiff.canvas #report p em{color:#060}#pretty" +
                                                        "diff.canvas #report p strong{color:#009}#prettydiff.shadow{background:#333 url('" +
                                                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC" +
                                                        "4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlE" +
                                                        "tvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9" +
                                                        "a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIs" +
                                                        "AHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAF" +
                                                        "AtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AM" +
                                                        "DOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozk" +
                                                        "kXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAO" +
                                                        "F0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff" +
                                                        "5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY" +
                                                        "5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c" +
                                                        "93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCm" +
                                                        "SAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjg" +
                                                        "gXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDua" +
                                                        "g3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxh" +
                                                        "qwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYj" +
                                                        "Ixh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryI" +
                                                        "XkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEz" +
                                                        "R1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK" +
                                                        "+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1" +
                                                        "PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gT" +
                                                        "XEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZV" +
                                                        "xrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6Ubob" +
                                                        "tEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6" +
                                                        "VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz" +
                                                        "0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rnt" +
                                                        "Znw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azp" +
                                                        "zuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60v" +
                                                        "Wdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6" +
                                                        "V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+H" +
                                                        "p8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhV" +
                                                        "eGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5Li" +
                                                        "quNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHc" +
                                                        "JnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQq" +
                                                        "ohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7c" +
                                                        "yzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek" +
                                                        "1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qa" +
                                                        "vEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVP" +
                                                        "RU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxw" +
                                                        "PSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x" +
                                                        "92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753G" +
                                                        "DborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7" +
                                                        "nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3Y" +
                                                        "fVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/s" +
                                                        "uuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2" +
                                                        "j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEQFaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZX" +
                                                        "QgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG" +
                                                        "5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNT" +
                                                        "Y3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaH" +
                                                        "R0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3" +
                                                        "JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLm" +
                                                        "NvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veG" +
                                                        "FwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC" +
                                                        "8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbn" +
                                                        "MuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz" +
                                                        "0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2" +
                                                        "hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dG" +
                                                        "lmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Im" +
                                                        "h0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG" +
                                                        "9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgIC" +
                                                        "A8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+Ci" +
                                                        "AgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtMDEtMTNUMTU6MTE6MzMtMDY6MDA8L3htcDpNZX" +
                                                        "RhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTEzVDE1OjExOjMzLTA2Oj" +
                                                        "AwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo4MDAwYT" +
                                                        "E3Zi1jZTY1LTQ5NTUtYjFmMS05YjVkODIwNDIyNjU8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgID" +
                                                        "x4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZmZhNDk1Yy1mYTU2LTExNzgtOW" +
                                                        "E5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbE" +
                                                        "RvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE" +
                                                        "1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgID" +
                                                        "xyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KIC" +
                                                        "AgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgIC" +
                                                        "AgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMG" +
                                                        "QtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2" +
                                                        "hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgIC" +
                                                        "A8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3" +
                                                        "RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgID" +
                                                        "xyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YW" +
                                                        "N0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZU" +
                                                        "lEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW" +
                                                        "5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2Oj" +
                                                        "AwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZS" +
                                                        "BQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgIC" +
                                                        "AgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC" +
                                                        "9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogIC" +
                                                        "AgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgIC" +
                                                        "AgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcG" +
                                                        "xpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgIC" +
                                                        "AgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj" +
                                                        "4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgIC" +
                                                        "AgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZD" +
                                                        "JhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0On" +
                                                        "doZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgIC" +
                                                        "AgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3" +
                                                        "N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RX" +
                                                        "Z0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIH" +
                                                        "JkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYX" +
                                                        "ZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaW" +
                                                        "lkOjA0ZGYyNDk5LWE1NTktNDE4MC1iNjA1LWI2MTk3MWMxNWEwMzwvc3RFdnQ6aW5zdGFuY2VJRD4KIC" +
                                                        "AgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdn" +
                                                        "Q6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG" +
                                                        "9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIC" +
                                                        "AgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPg" +
                                                        "ogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgIC" +
                                                        "AgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgIC" +
                                                        "AgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIH" +
                                                        "RvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgIC" +
                                                        "AgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgIC" +
                                                        "AgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPH" +
                                                        "N0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2" +
                                                        "hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPg" +
                                                        "ogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgIC" +
                                                        "AgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgIC" +
                                                        "A8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgwMDBhMTdmLWNlNjUtNDk1NS1iMWYxLTliNWQ4MjA0Mj" +
                                                        "I2NTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS" +
                                                        "0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZn" +
                                                        "R3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YX" +
                                                        "JlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+Ci" +
                                                        "AgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG" +
                                                        "1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtcE1NOkRlcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc2" +
                                                        "91cmNlIj4KICAgICAgICAgICAgPHN0UmVmOmluc3RhbmNlSUQ+eG1wLmlpZDowNGRmMjQ5OS1hNTU5LT" +
                                                        "QxODAtYjYwNS1iNjE5NzFjMTVhMDM8L3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZj" +
                                                        "pkb2N1bWVudElEPnhtcC5kaWQ6ODNhNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdF" +
                                                        "JlZjpkb2N1bWVudElEPgogICAgICAgICAgICA8c3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaW" +
                                                        "Q6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdFJlZjpvcmlnaW5hbERvY3VtZW" +
                                                        "50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2" +
                                                        "UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcD" +
                                                        "pDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMT" +
                                                        "wvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3" +
                                                        "JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WF" +
                                                        "Jlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WV" +
                                                        "Jlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvbl" +
                                                        "VuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgIC" +
                                                        "A8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleG" +
                                                        "lmOlBpeGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3" +
                                                        "JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                                        "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA" +
                                                        "ogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCi" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgIC" +
                                                        "AgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5hSvvCAAAAIGNIUk0AAHolAA" +
                                                        "CAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAlSURBVHjaPMYxAQAwDAMgVkv1VFFRuy9cvN" +
                                                        "0F7m66JNNhOvwBAPyqCtNeO5K2AAAAAElFTkSuQmCC');color:#fff}#prettydiff.shadow *:foc" +
                                                        "us{outline:0.1em dashed #ff0}#prettydiff.shadow a:visited{color:#f93}#prettydiff" +
                                                        ".shadow a{color:#cf3}#prettydiff.shadow .contentarea,#prettydiff.shadow legend,#" +
                                                        "prettydiff.shadow fieldset select,#prettydiff.shadow .diff td,#prettydiff.shadow" +
                                                        " .report td,#prettydiff.shadow .data li,#prettydiff.shadow .diff-right,#prettydi" +
                                                        "ff.shadow fieldset input{background:#333;border-color:#666}#prettydiff.shadow se" +
                                                        "lect,#prettydiff.shadow input,#prettydiff.shadow .diff,#prettydiff.shadow .beaut" +
                                                        "ify,#prettydiff.shadow .report,#prettydiff.shadow .beautify h3,#prettydiff.shado" +
                                                        "w .diff h3,#prettydiff.shadow .beautify h4,#prettydiff.shadow .diff h4,#prettydi" +
                                                        "ff.shadow #report,#prettydiff.shadow #report .author,#prettydiff.shadow fieldset" +
                                                        "{background:#222;border-color:#666}#prettydiff.shadow fieldset fieldset{backgrou" +
                                                        "nd:#333}#prettydiff.shadow fieldset fieldset input,#prettydiff.shadow fieldset f" +
                                                        "ieldset select{background:#222}#prettydiff.shadow h2,#prettydiff.shadow h2 butto" +
                                                        "n,#prettydiff.shadow h3,#prettydiff.shadow input,#prettydiff.shadow option,#pret" +
                                                        "tydiff.shadow select,#prettydiff.shadow legend{color:#ccc}#prettydiff.shadow .co" +
                                                        "ntentarea{box-shadow:0 1em 1em #000}#prettydiff.shadow .segment{background:#222}" +
                                                        "#prettydiff.shadow h2 button,#prettydiff.shadow td,#prettydiff.shadow th,#pretty" +
                                                        "diff.shadow .segment,#prettydiff.shadow ol.segment li{border-color:#666}#prettyd" +
                                                        "iff.shadow .count li.fold{color:#cf3}#prettydiff.shadow th{background:#000}#pret" +
                                                        "tydiff.shadow h2 button{background:#585858;box-shadow:0.1em 0.1em 0.25em #000}#p" +
                                                        "rettydiff.shadow li h4{color:#ff0}#prettydiff.shadow code{background:#585858;bor" +
                                                        "der-color:#585858;color:#ccf}#prettydiff.shadow ol.segment h4 strong{color:#f30}" +
                                                        "#prettydiff.shadow button{background-color:#333;border-color:#666;box-shadow:0 0" +
                                                        ".25em 0.5em #000;color:#ccc}#prettydiff.shadow button:hover{background-color:#77" +
                                                        "7;border-color:#aaa;box-shadow:0 0.25em 0.5em #222;color:#fff}#prettydiff.shadow" +
                                                        " th{background:#444}#prettydiff.shadow thead th,#prettydiff.shadow th.heading{ba" +
                                                        "ckground:#444}#prettydiff.shadow .diff h3{background:#000;border-color:#666}#pre" +
                                                        "ttydiff.shadow .segment,#prettydiff.shadow .data li,#prettydiff.shadow .diff-rig" +
                                                        "ht{border-color:#444}#prettydiff.shadow .count li{border-color:#333}#prettydiff." +
                                                        "shadow .count{background:#555;border-color:#333}#prettydiff.shadow li h4{color:#" +
                                                        "ff0}#prettydiff.shadow code{background:#000;border-color:#000;color:#ddd}#pretty" +
                                                        "diff.shadow ol.segment h4 strong{color:#c00}#prettydiff.shadow .data .delete{bac" +
                                                        "kground:#300}#prettydiff.shadow .data .delete em{background:#200;border-color:#c" +
                                                        "63;color:#c66}#prettydiff.shadow .data .insert{background:#030}#prettydiff.shado" +
                                                        "w .data .insert em{background:#010;border-color:#090;color:#6c0}#prettydiff.shad" +
                                                        "ow .data .replace{background:#234}#prettydiff.shadow .data .replace em{backgroun" +
                                                        "d:#023;border-color:#09c;color:#7cf}#prettydiff.shadow .data .empty{background:#" +
                                                        "111}#prettydiff.shadow .diff .author{border-color:#666}#prettydiff.shadow .data " +
                                                        "em.s0{color:#fff}#prettydiff.shadow .data em.s1{color:#d60}#prettydiff.shadow .d" +
                                                        "ata em.s2{color:#aaf}#prettydiff.shadow .data em.s3{color:#0c0}#prettydiff.shado" +
                                                        "w .data em.s4{color:#f6f}#prettydiff.shadow .data em.s5{color:#0cc}#prettydiff.s" +
                                                        "hadow .data em.s6{color:#dc3}#prettydiff.shadow .data em.s7{color:#a7a}#prettydi" +
                                                        "ff.shadow .data em.s8{color:#7a7}#prettydiff.shadow .data em.s9{color:#ff6}#pret" +
                                                        "tydiff.shadow .data em.s10{color:#33f}#prettydiff.shadow .data em.s11{color:#933" +
                                                        "}#prettydiff.shadow .data em.s12{color:#990}#prettydiff.shadow .data em.s13{colo" +
                                                        "r:#987}#prettydiff.shadow .data em.s14{color:#fc3}#prettydiff.shadow .data em.s1" +
                                                        "5{color:#897}#prettydiff.shadow .data em.s16{color:#f30}#prettydiff.shadow .data" +
                                                        " .l0{background:#333}#prettydiff.shadow .data .l1{background:#633}#prettydiff.sh" +
                                                        "adow .data .l2{background:#335}#prettydiff.shadow .data .l3{background:#353}#pre" +
                                                        "ttydiff.shadow .data .l4{background:#636}#prettydiff.shadow .data .l5{background" +
                                                        ":#366}#prettydiff.shadow .data .l6{background:#640}#prettydiff.shadow .data .l7{" +
                                                        "background:#303}#prettydiff.shadow .data .l8{background:#030}#prettydiff.shadow " +
                                                        ".data .l9{background:#660}#prettydiff.shadow .data .l10{background:#003}#prettyd" +
                                                        "iff.shadow .data .l11{background:#300}#prettydiff.shadow .data .l12{background:#" +
                                                        "553}#prettydiff.shadow .data .l13{background:#432}#prettydiff.shadow .data .l14{" +
                                                        "background:#640}#prettydiff.shadow .data .l15{background:#562}#prettydiff.shadow" +
                                                        " .data .l16{background:#600}#prettydiff.shadow .data .c0{background:inherit}#pre" +
                                                        "ttydiff.white{background:#f8f8f8 url('data:image/png;base64,iVBORw0KGgoAAAANSUhE" +
                                                        "UgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUND" +
                                                        "IHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8ig" +
                                                        "iAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCD" +
                                                        "x8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThL" +
                                                        "CIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7" +
                                                        "AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc8" +
                                                        "8SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9" +
                                                        "eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUA" +
                                                        "oOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUc" +
                                                        "z5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuR" +
                                                        "LahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCB" +
                                                        "KrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4" +
                                                        "Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9" +
                                                        "cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+" +
                                                        "Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7Y" +
                                                        "SKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTS" +
                                                        "EtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU0" +
                                                        "5QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX" +
                                                        "0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVK" +
                                                        "lSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkG" +
                                                        "WcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H" +
                                                        "45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0on" +
                                                        "XCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VH" +
                                                        "DFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYm" +
                                                        "ISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxu" +
                                                        "hVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6T" +
                                                        "vZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5" +
                                                        "c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR" +
                                                        "5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nv" +
                                                        "nl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQ" +
                                                        "rSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1K" +
                                                        "NSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxap" +
                                                        "LhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5" +
                                                        "hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZ" +
                                                        "LQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxx" +
                                                        "edsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqG" +
                                                        "nRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO31" +
                                                        "9kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttV" +
                                                        "AVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0N" +
                                                        "Ng1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sf" +
                                                        "D5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy" +
                                                        "2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF" +
                                                        "9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Z" +
                                                        "j8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bC" +
                                                        "xh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADo2aVRYdFhN" +
                                                        "TDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJl" +
                                                        "U3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJB" +
                                                        "ZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAg" +
                                                        "ICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYt" +
                                                        "c3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAg" +
                                                        "IHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6" +
                                                        "eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0" +
                                                        "RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAg" +
                                                        "ICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAg" +
                                                        "ICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAg" +
                                                        "ICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAg" +
                                                        "ICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1w" +
                                                        "OkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC94bXA6Q3JlYXRv" +
                                                        "clRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC94" +
                                                        "bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNi0wMS0xMlQxMjoyNDoz" +
                                                        "OC0wNjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTYtMDEt" +
                                                        "MTJUMTI6MjQ6MzgtMDY6MDA8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJ" +
                                                        "RD54bXAuaWlkOmQ1M2M3ODQzLWE1ZjItNDg0Ny04YzQzLTZlMmMwYTQ2OGJlYjwveG1wTU06SW5zdGFu" +
                                                        "Y2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjFjMzc2" +
                                                        "MTgxLWY5ZTgtMTE3OC05YTljLWQ4MjVkZmIwYTQ3MDwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAg" +
                                                        "PHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4" +
                                                        "MTMxMWQ3NDAzMTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9y" +
                                                        "eT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlw" +
                                                        "ZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0" +
                                                        "OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo2YjI0ZTI3" +
                                                        "YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAg" +
                                                        "ICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAg" +
                                                        "ICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0" +
                                                        "IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4K" +
                                                        "ICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAg" +
                                                        "ICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAg" +
                                                        "PHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpkNTNjNzg0My1hNWYyLTQ4NDctOGM0My02ZTJjMGE0Njhi" +
                                                        "ZWI8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEt" +
                                                        "MTJUMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0" +
                                                        "d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2Fy" +
                                                        "ZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgog" +
                                                        "ICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3ht" +
                                                        "cE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAg" +
                                                        "ICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxw" +
                                                        "aG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+" +
                                                        "CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0" +
                                                        "aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0" +
                                                        "aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0" +
                                                        "aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNv" +
                                                        "bG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+" +
                                                        "NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9l" +
                                                        "eGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4K" +
                                                        "PC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAK" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAog" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAK" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAog" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAg" +
                                                        "Cjw/eHBhY2tldCBlbmQ9InciPz5cKgaXAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqY" +
                                                        "AAAXb5JfxUYAAAAkSURBVHjaPMahAQAwDMCg7P+/KnsPcq4oHqpqdwNmBt3QDX8AeAUmcrZLnM4AAAAA" +
                                                        "SUVORK5CYII=')}#prettydiff.white *:focus{outline:0.1em dashed #06f}#prettydiff.w" +
                                                        "hite .contentarea,#prettydiff.white legend,#prettydiff.white fieldset select,#pr" +
                                                        "ettydiff.white .diff td,#prettydiff.white .report td,#prettydiff.white .data li," +
                                                        "#prettydiff.white .diff-right,#prettydiff.white fieldset input{background:#fff;b" +
                                                        "order-color:#999}#prettydiff.white select,#prettydiff.white input,#prettydiff.wh" +
                                                        "ite .diff,#prettydiff.white .beautify,#prettydiff.white .report,#prettydiff.whit" +
                                                        "e .beautify h3,#prettydiff.white .diff h3,#prettydiff.white .beautify h4,#pretty" +
                                                        "diff.white .diff h4,#prettydiff.white #pdsamples li div,#prettydiff.white #repor" +
                                                        "t,#prettydiff.white .author,#prettydiff.white #report .author,#prettydiff.white " +
                                                        "fieldset{background:#eee;border-color:#999}#prettydiff.white .diff h3{background" +
                                                        ":#ddd;border-color:#999}#prettydiff.white fieldset fieldset{background:#ddd}#pre" +
                                                        "ttydiff.white .contentarea{box-shadow:0 1em 1em #999}#prettydiff.white button{ba" +
                                                        "ckground-color:#eee;border-color:#999;box-shadow:0 0.25em 0.5em #ccc;color:#666}" +
                                                        "#prettydiff.white button:hover{background-color:#def;border-color:#03c;box-shado" +
                                                        "w:0 0.25em 0.5em #ccf;color:#03c}#prettydiff.white h2,#prettydiff.white h2 butto" +
                                                        "n,#prettydiff.white h3{color:#b00}#prettydiff.white th{background:#eee;color:#33" +
                                                        "3}#prettydiff.white thead th{background:#eef}#prettydiff.white .report strong{co" +
                                                        "lor:#009}#prettydiff.white .report em{color:#080}#prettydiff.white h2 button,#pr" +
                                                        "ettydiff.white td,#prettydiff.white th,#prettydiff.white .segment,#prettydiff.wh" +
                                                        "ite .count li,#prettydiff.white .diff-right #prettydiff.white ol.segment li{bord" +
                                                        "er-color:#ccc}#prettydiff.white .data li{border-color:#ccc}#prettydiff.white .co" +
                                                        "unt li.fold{color:#900}#prettydiff.white .count{background:#eed;border-color:#99" +
                                                        "9}#prettydiff.white h2 button{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #" +
                                                        "ddd}#prettydiff.white li h4{color:#00f}#prettydiff.white code{background:#eee;bo" +
                                                        "rder-color:#eee;color:#009}#prettydiff.white ol.segment h4 strong{color:#c00}#pr" +
                                                        "ettydiff.white .data .delete{background:#ffd8d8}#prettydiff.white .data .delete " +
                                                        "em{background:#fff8f8;border-color:#c44;color:#900}#prettydiff.white .data .inse" +
                                                        "rt{background:#d8ffd8}#prettydiff.white .data .insert em{background:#f8fff8;bord" +
                                                        "er-color:#090;color:#363}#prettydiff.white .data .replace{background:#fec}#prett" +
                                                        "ydiff.white .data .replace em{background:#ffe;border-color:#a86;color:#852}#pret" +
                                                        "tydiff.white .data .empty{background:#ddd}#prettydiff.white .data em.s0{color:#0" +
                                                        "00}#prettydiff.white .data em.s1{color:#f66}#prettydiff.white .data em.s2{color:" +
                                                        "#12f}#prettydiff.white .data em.s3{color:#090}#prettydiff.white .data em.s4{colo" +
                                                        "r:#d6d}#prettydiff.white .data em.s5{color:#7cc}#prettydiff.white .data em.s6{co" +
                                                        "lor:#c85}#prettydiff.white .data em.s7{color:#737}#prettydiff.white .data em.s8{" +
                                                        "color:#6d0}#prettydiff.white .data em.s9{color:#dd0}#prettydiff.white .data em.s" +
                                                        "10{color:#893}#prettydiff.white .data em.s11{color:#b97}#prettydiff.white .data " +
                                                        "em.s12{color:#bbb}#prettydiff.white .data em.s13{color:#cc3}#prettydiff.white .d" +
                                                        "ata em.s14{color:#333}#prettydiff.white .data em.s15{color:#9d9}#prettydiff.whit" +
                                                        "e .data em.s16{color:#880}#prettydiff.white .data .l0{background:#fff}#prettydif" +
                                                        "f.white .data .l1{background:#fed}#prettydiff.white .data .l2{background:#def}#p" +
                                                        "rettydiff.white .data .l3{background:#efe}#prettydiff.white .data .l4{background" +
                                                        ":#fef}#prettydiff.white .data .l5{background:#eef}#prettydiff.white .data .l6{ba" +
                                                        "ckground:#fff8cc}#prettydiff.white .data .l7{background:#ede}#prettydiff.white ." +
                                                        "data .l8{background:#efc}#prettydiff.white .data .l9{background:#ffd}#prettydiff" +
                                                        ".white .data .l10{background:#edc}#prettydiff.white .data .l11{background:#fdb}#" +
                                                        "prettydiff.white .data .l12{background:#f8f8f8}#prettydiff.white .data .l13{back" +
                                                        "ground:#ffb}#prettydiff.white .data .l14{background:#eec}#prettydiff.white .data" +
                                                        " .l15{background:#cfc}#prettydiff.white .data .l16{background:#eea}#prettydiff.w" +
                                                        "hite .data .c0{background:inherit}#prettydiff.white #report p em{color:#080}#pre" +
                                                        "ttydiff.white #report p strong{color:#009}#prettydiff #report.contentarea{font-f" +
                                                        "amily:'Lucida Sans Unicode','Helvetica','Arial',sans-serif;max-width:none;overfl" +
                                                        "ow:scroll}#prettydiff .diff .replace em,#prettydiff .diff .delete em,#prettydiff" +
                                                        " .diff .insert em{border-style:solid;border-width:0.1em}#prettydiff #report dd,#" +
                                                        "prettydiff #report dt,#prettydiff #report p,#prettydiff #report li,#prettydiff #" +
                                                        "report td,#prettydiff #report blockquote,#prettydiff #report th{font-family:'Luc" +
                                                        "ida Sans Unicode','Helvetica','Arial',sans-serif;font-size:1.2em}#prettydiff div" +
                                                        "#webtool{background:transparent;font-size:inherit;margin:0;padding:0}#prettydiff" +
                                                        " #jserror span{display:block}#prettydiff #a11y{background:transparent;padding:0}" +
                                                        "#prettydiff #a11y div{margin:0.5em 0;border-style:solid;border-width:0.1em}#pret" +
                                                        "tydiff #a11y h4{margin:0.25em 0}#prettydiff #a11y ol{border-style:solid;border-w" +
                                                        "idth:0.1em}#prettydiff #cssreport.doc table{clear:none;float:left;margin-left:1e" +
                                                        "m}#prettydiff #css-size{left:24em}#prettydiff #css-uri{left:40em}#prettydiff #cs" +
                                                        "s-uri td{text-align:left}#prettydiff .report .analysis th{text-align:left}#prett" +
                                                        "ydiff .report .analysis .parseData td{font-family:'Courier New',Courier,'Lucida " +
                                                        "Console',monospace;text-align:left;white-space:pre}#prettydiff .report .analysis" +
                                                        " td{text-align:right}#prettydiff .analysis{float:left;margin:0 1em 1em 0}#pretty" +
                                                        "diff .analysis td,#prettydiff .analysis th{padding:0.5em}#prettydiff #statreport" +
                                                        " div{border-style:none}#prettydiff .diff,#prettydiff .beautify{border-style:soli" +
                                                        "d;border-width:0.1em;display:inline-block;margin:0 1em 1em 0;position:relative}#" +
                                                        "prettydiff .diff,#prettydiff .diff li #prettydiff .diff h3,#prettydiff .diff h4," +
                                                        "#prettydiff .beautify,#prettydiff .beautify li,#prettydiff .beautify h3,#prettyd" +
                                                        "iff .beautify h4{font-family:'Courier New',Courier,'Lucida Console',monospace}#p" +
                                                        "rettydiff .diff li,#prettydiff .beautify li,#prettydiff .diff h3,#prettydiff .di" +
                                                        "ff h4,#prettydiff .beautify h3,#prettydiff .beautify h4{border-style:none none s" +
                                                        "olid none;border-width:0 0 0.1em 0;box-shadow:none;display:block;font-size:1.2em" +
                                                        ";margin:0 0 0 -.1em;padding:0.2em 2em;text-align:left}#prettydiff .diff .skip{bo" +
                                                        "rder-style:none none solid;border-width:0 0 0.1em}#prettydiff .diff .diff-left{b" +
                                                        "order-style:none;display:table-cell}#prettydiff .diff .diff-right{border-style:n" +
                                                        "one none none solid;border-width:0 0 0 0.1em;display:table-cell;margin-left:-.1e" +
                                                        "m;min-width:16.5em;right:0;top:0}#prettydiff .diff .data li,#prettydiff .beautif" +
                                                        "y .data li{min-width:16.5em;padding:0.5em}#prettydiff .diff li,#prettydiff .diff" +
                                                        " p,#prettydiff .diff h3,#prettydiff .beautify li,#prettydiff .beautify p,#pretty" +
                                                        "diff .beautify h3{font-size:1.2em}#prettydiff .diff li em,#prettydiff .beautify " +
                                                        "li em{font-style:normal;font-weight:bold;margin:-0.5em -0.09em}#prettydiff .diff" +
                                                        " p.author{border-style:solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hi" +
                                                        "dden;padding:0.4em;text-align:right}#prettydiff .difflabel{display:block;height:" +
                                                        "0}#prettydiff .count{border-style:solid;border-width:0 0.1em 0 0;font-weight:nor" +
                                                        "mal;padding:0;text-align:right}#prettydiff .count li{padding:0.5em 1em;text-alig" +
                                                        "n:right}#prettydiff .count li.fold{cursor:pointer;font-weight:bold;padding-left:" +
                                                        "0.5em}#prettydiff .data{text-align:left;white-space:pre}#prettydiff .beautify .d" +
                                                        "ata em{display:inline-block;font-style:normal;font-weight:bold}#prettydiff .beau" +
                                                        "tify li,#prettydiff .diff li{border-style:none none solid;border-width:0 0 0.1em" +
                                                        ";display:block;line-height:1.2;list-style-type:none;margin:0;white-space:pre}#pr" +
                                                        "ettydiff .beautify ol,#prettydiff .diff ol{display:table-cell;margin:0;padding:0" +
                                                        "}#prettydiff .beautify em.l0,#prettydiff .beautify em.l1,#prettydiff .beautify e" +
                                                        "m.l2,#prettydiff .beautify em.l3,#prettydiff .beautify em.l4,#prettydiff .beauti" +
                                                        "fy em.l5,#prettydiff .beautify em.l6,#prettydiff .beautify em.l7,#prettydiff .be" +
                                                        "autify em.l8,#prettydiff .beautify em.l9,#prettydiff .beautify em.l10,#prettydif" +
                                                        "f .beautify em.l11,#prettydiff .beautify em.l12,#prettydiff .beautify em.l13,#pr" +
                                                        "ettydiff .beautify em.l14,#prettydiff .beautify em.l15,#prettydiff .beautify em." +
                                                        "l16{height:2.2em;margin:0 0 -1em;position:relative;top:-0.5em}#prettydiff .beaut" +
                                                        "ify em.l0{margin-left:-0.5em;padding-left:0.5em}#prettydiff #report .beautify,#p" +
                                                        "rettydiff #report .beautify li,#prettydiff #report .diff,#prettydiff #report .di" +
                                                        "ff li{font-family:'Courier New',Courier,'Lucida Console',monospace}#prettydiff #" +
                                                        "report .beautify{border-style:solid}#prettydiff #report .diff h3,#prettydiff #re" +
                                                        "port .beautify h3{margin:0}#prettydiff{text-align:center;font-size:10px;overflow" +
                                                        "-y:scroll}#prettydiff .contentarea{border-style:solid;border-width:0.1em;font-fa" +
                                                        "mily:'Century Gothic','Trebuchet MS';margin:0 auto;max-width:93em;padding:1em;te" +
                                                        "xt-align:left}#prettydiff dd,#prettydiff dt,#prettydiff p,#prettydiff li,#pretty" +
                                                        "diff td,#prettydiff blockquote,#prettydiff th{clear:both;font-family:'Palatino L" +
                                                        "inotype','Book Antiqua',Palatino,serif;font-size:1.6em;line-height:1.6em;text-al" +
                                                        "ign:left}#prettydiff blockquote{font-style:italic}#prettydiff dt{font-size:1.4em" +
                                                        ";font-weight:bold;line-height:inherit}#prettydiff li li,#prettydiff li p{font-si" +
                                                        "ze:1em}#prettydiff th,#prettydiff td{border-style:solid;border-width:0.1em;paddi" +
                                                        "ng:0.1em 0.2em}#prettydiff td span{display:block}#prettydiff code,#prettydiff te" +
                                                        "xtarea{font-family:'Courier New',Courier,'Lucida Console',monospace}#prettydiff " +
                                                        "code,#prettydiff textarea{display:block;font-size:0.8em;width:100%}#prettydiff c" +
                                                        "ode span{display:block;white-space:pre}#prettydiff code{border-style:solid;borde" +
                                                        "r-width:0.2em;line-height:1em}#prettydiff textarea{line-height:1.4em}#prettydiff" +
                                                        " label{display:inline;font-size:1.4em}#prettydiff legend{border-radius:1em;borde" +
                                                        "r-style:solid;border-width:0.1em;font-size:1.4em;font-weight:bold;margin-left:-0" +
                                                        ".25em;padding:0 0.5em}#prettydiff fieldset fieldset legend{font-size:1.2em}#pret" +
                                                        "tydiff table{border-collapse:collapse}#prettydiff div.report{border-style:none}#" +
                                                        "prettydiff h2,#prettydiff h3,#prettydiff h4{clear:both}#prettydiff table{margin:" +
                                                        "0 0 1em}#prettydiff .analysis .bad,#prettydiff .analysis .good{font-weight:bold}" +
                                                        "#prettydiff h1{font-size:3em;font-weight:normal;margin-top:0}#prettydiff h1 span" +
                                                        "{font-size:0.5em}#prettydiff h1 svg{border-style:solid;border-width:0.05em;float" +
                                                        ":left;height:1.5em;margin-right:0.5em;width:1.5em}#prettydiff h2{border-style:no" +
                                                        "ne;background:transparent;font-size:1em;box-shadow:none;margin:0}#prettydiff h2 " +
                                                        "button{background:transparent;border-style:solid;cursor:pointer;display:block;fo" +
                                                        "nt-size:2.5em;font-weight:normal;text-align:left;width:100%;border-width:0.05em;" +
                                                        "font-weight:normal;margin:1em 0 0;padding:0.1em}#prettydiff h2 span{display:bloc" +
                                                        "k;float:right;font-size:0.5em}#prettydiff h3{font-size:2em;margin:0;background:t" +
                                                        "ransparent;box-shadow:none;border-style:none}#prettydiff h4{font-size:1.6em;font" +
                                                        "-family:'Century Gothic','Trebuchet MS';margin:0}#prettydiff li h4{font-size:1em" +
                                                        "}#prettydiff button,#prettydiff fieldset,#prettydiff div input,#prettydiff texta" +
                                                        "rea{border-style:solid;border-width:0.1em}#prettydiff section{border-style:none}" +
                                                        "#prettydiff h2 button,#prettydiff select,#prettydiff option{font-family:inherit}" +
                                                        "#prettydiff select{border-style:inset;border-width:0.1em;width:13.5em}#prettydif" +
                                                        "f #dcolorScheme{float:right;margin:-3em 0 0}#prettydiff #dcolorScheme label,#pre" +
                                                        "ttydiff #dcolorScheme label{display:inline-block;font-size:1em}#prettydiff .clea" +
                                                        "r{clear:both;display:block}#prettydiff caption,#prettydiff .content-hide{height:" +
                                                        "1em;left:-1000em;overflow:hidden;position:absolute;top:-1000em;width:1em}/*]]>*/" +
                                                        "</style></head><body id='prettydiff' class='white'><div class='contentarea' id='" +
                                                        "report'><section role='heading'><h1><svg height='2000.000000pt' id='pdlogo' pres" +
                                                        "erveAspectRatio='xMidYMid meet' version='1.0' viewBox='0 0 2000.000000 2000.0000" +
                                                        "00' width='2000.000000pt' xmlns='http://www.w3.org/2000/svg'><g fill='#999' stro" +
                                                        "ke='none' transform='translate(0.000000,2000.000000) scale(0.100000,-0.100000)'>" +
                                                        " <path d='M14871 18523 c-16 -64 -611 -2317 -946 -3588 -175 -660 -319 -1202 -320 " +
                                                        "-1204 -2 -2 -50 39 -107 91 -961 876 -2202 1358 -3498 1358 -1255 0 -2456 -451 -34" +
                                                        "09 -1279 -161 -140 -424 -408 -560 -571 -507 -607 -870 -1320 -1062 -2090 -58 -232" +
                                                        " -386 -1479 -2309 -8759 -148 -563 -270 -1028 -270 -1033 0 -4 614 -8 1365 -8 l136" +
                                                        "4 0 10 38 c16 63 611 2316 946 3587 175 660 319 1202 320 1204 2 2 50 -39 107 -91 " +
                                                        "543 -495 1169 -862 1863 -1093 1707 -568 3581 -211 4965 946 252 210 554 524 767 7" +
                                                        "96 111 143 312 445 408 613 229 406 408 854 525 1320 57 225 380 1451 2310 8759 14" +
                                                        "8 563 270 1028 270 1033 0 4 -614 8 -1365 8 l-1364 0 -10 -37z m-4498 -5957 c477 -" +
                                                        "77 889 -256 1245 -542 523 -419 850 -998 954 -1689 18 -121 18 -549 0 -670 -80 -52" +
                                                        "9 -279 -972 -612 -1359 -412 -480 -967 -779 -1625 -878 -121 -18 -549 -18 -670 0 -" +
                                                        "494 74 -918 255 -1283 548 -523 419 -850 998 -954 1689 -18 121 -18 549 0 670 104 " +
                                                        "691 431 1270 954 1689 365 293 828 490 1283 545 50 6 104 13 120 15 72 10 495 -3 5" +
                                                        "88 -18z'/></g></svg><a href='prettydiff.com.xhtml'>Pretty Diff</a></h1><p id='dc" +
                                                        "olorScheme'><label class='label' for='colorScheme'>Color Scheme</label><select i" +
                                                        "d='colorScheme'><option>Canvas</option><option>Shadow</option><option selected='" +
                                                        "selected'>White</option></select></p><p>Find <a href='https://github.com/prettyd" +
                                                        "iff/prettydiff'>Pretty Diff on GitHub</a> and <a href='http://www.npmjs.com/pack" +
                                                        "ages/prettydiff'>NPM</a>.</p></section><section role='main'><div class='diff'><d" +
                                                        "iv class='diff-left'><h3 class='texttitle'>base</h3><ol class='count'><li>1</li>" +
                                                        "<li>2</li><li>3</li><li>4</li><li>5</li></ol><ol class='data'><li class='equal'>" +
                                                        "&lt;a&gt;&#10;</li><li class='equal'>    &lt;b&gt;&#10;</li><li class='replace'>" +
                                                        "        &lt;<em>c</em>/&gt;&#10;</li><li class='equal'>    &lt;/b&gt;&#10;</li><" +
                                                        "li class='equal'>&lt;/a&gt;&#10;</li></ol></div><div class='diff-right'><h3 clas" +
                                                        "s='texttitle'>new</h3><ol class='count' style='cursor:w-resize'><li>1</li><li>2<" +
                                                        "/li><li>3</li><li>4</li><li>5</li></ol><ol class='data'><li class='equal'>&lt;a&" +
                                                        "gt;&#10;</li><li class='equal'>    &lt;b&gt;&#10;</li><li class='replace'>      " +
                                                        "  &lt;<em>d</em>/&gt;&#10;</li><li class='equal'>    &lt;/b&gt;&#10;</li><li cla" +
                                                        "ss='equal'>&lt;/a&gt;&#10;</li></ol></div><p class='author'>Diff view written by" +
                                                        " <a href='http://prettydiff.com/'>Pretty Diff</a>.</p></div></section></div><scr" +
                                                        "ipt type='application/javascript'>//<![CDATA[\r\nvar pd={};pd.colorchange=functi" +
                                                        "on(){'use strict';var options=this.getElementsByTagName('option');document.getEl" +
                                                        "ementsByTagName('body')[0].setAttribute('class',options[this.selectedIndex].inne" +
                                                        "rHTML.toLowerCase())};pd.difffold=function dom__difffold(){'use strict';var a=0," +
                                                        "b=0,self=this,title=self.getAttribute('title').split('line '),min=Number(title[1" +
                                                        "].substr(0,title[1].indexOf(' '))),max=Number(title[2]),inner=self.innerHTML,lis" +
                                                        "ts=[],parent=self.parentNode.parentNode,listnodes=(parent.getAttribute('class')=" +
                                                        "=='diff')?parent.getElementsByTagName('ol'):parent.parentNode.getElementsByTagNa" +
                                                        "me('ol'),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a" +
                                                        "].getElementsByTagName('li'))}max=(max>=lists[0].length)?lists[0].length:max;if(" +
                                                        "inner.charAt(0)==='-'){self.innerHTML='+'+inner.substr(1);for(a=min;a<max;a+=1){" +
                                                        "for(b=0;b<listLen;b+=1){lists[b][a].style.display='none'}}}else{self.innerHTML='" +
                                                        "-'+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[b][a].sty" +
                                                        "le.display='block'}}}};pd.colSliderGrab=function(e){'use strict';var event=e||wi" +
                                                        "ndow.event,touch=(e!==null&&e.type==='touchstart'),node=this,diffRight=node.pare" +
                                                        "ntNode,diff=diffRight.parentNode,subOffset=0,lists=diff.getElementsByTagName('ol" +
                                                        "'),counter=lists[0].clientWidth,data=lists[1].clientWidth,width=lists[2].parentN" +
                                                        "ode.clientWidth,total=lists[2].parentNode.parentNode.clientWidth,offset=lists[2]" +
                                                        ".parentNode.offsetLeft-lists[2].parentNode.parentNode.offsetLeft,min=((total-cou" +
                                                        "nter-data-2)-width),max=(total-width-counter),status='ew',minAdjust=min+15,maxAd" +
                                                        "just=max-15,withinRange=false,diffLeft=diffRight.previousSibling,drop=function d" +
                                                        "om__event_colSliderGrab_drop(f){f=f||window.event;f.preventDefault();node.style." +
                                                        "cursor=status+'-resize';if(touch===true){document.ontouchmove=null;document.onto" +
                                                        "uchend=null}else{document.onmousemove=null;document.onmouseup=null}},boxmove=fun" +
                                                        "ction dom__event_colSliderGrab_boxmove(f){f=f||window.event;f.preventDefault();i" +
                                                        "f(touch===true){subOffset=offset-f.touches[0].clientX}else{subOffset=offset-f.cl" +
                                                        "ientX}if(subOffset>minAdjust&&subOffset<maxAdjust){withinRange=true}if(withinRan" +
                                                        "ge===true&&subOffset>maxAdjust){diffRight.style.width=((total-counter-2)/10)+'em" +
                                                        "';status='e'}else if(withinRange===true&&subOffset<minAdjust){diffRight.style.wi" +
                                                        "dth=((total-counter-data-2)/10)+'em';status='w'}else if(subOffset<max&&subOffset" +
                                                        ">min){diffRight.style.width=((width+subOffset)/10)+'em';status='ew'}if(touch===t" +
                                                        "rue){document.ontouchend=drop}else{document.onmouseup=drop}};event.preventDefaul" +
                                                        "t();if(typeof pd.data.node==='object'&&pd.data.node.report.code.box!==null){offs" +
                                                        "et+=pd.data.node.report.code.box.offsetLeft;offset-=pd.data.node.report.code.bod" +
                                                        "y.scrollLeft}else{subOffset=(document.body.parentNode.scrollLeft>document.body.s" +
                                                        "crollLeft)?document.body.parentNode.scrollLeft:document.body.scrollLeft;offset-=" +
                                                        "subOffset}offset+=node.clientWidth;node.style.cursor='ew-resize';diff.style.widt" +
                                                        "h=(total/10)+'em';diff.style.display='inline-block';if(diffLeft.nodeType!==1){do" +
                                                        "{diffLeft=diffLeft.previousSibling}while(diffLeft.nodeType!==1)}diffLeft.style.d" +
                                                        "isplay='block';diffRight.style.width=(diffRight.clientWidth/10)+'em';diffRight.s" +
                                                        "tyle.position='absolute';if(touch===true){document.ontouchmove=boxmove;document." +
                                                        "ontouchstart=false}else{document.onmousemove=boxmove;document.onmousedown=null}r" +
                                                        "eturn false};(function(){'use strict';var cells=pd.d[0].getElementsByTagName('li" +
                                                        "'),len=cells.length,a=0;for(a=0;a<len;a+=1){if(cells[a].getAttribute('class')===" +
                                                        "'fold'){cells[a].onclick=pd.difffold}}if(pd.d.length>3){pd.d[2].onmousedown=pd.c" +
                                                        "olSliderGrab;pd.d[2].ontouchstart=pd.colSliderGrab}pd.colorscheme=document.getEl" +
                                                        "ementById('colorScheme');pd.colorscheme.onchange=pd.colorchange}());//]]>\r\n</s" +
                                                        "cript></body></html>"
                                        }
                                    ]
                                }, {
                                    group: "simple file tests",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" " +
                                                        "mode:\"beautify\"",
                                            name  : "Verify `readmethod:file` throws error on missing output option",
                                            verify: "Error: 'readmethod' is value 'file' and argument 'output' is empty"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" " +
                                                        "mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\" diffcli:true",
                                            name  : "Test diffcli option",
                                            verify: "\nScreen input with 1 difference\n\nLine: 3\x1b[39m\n<a>\n    <b>\n\x1B[31m     " +
                                                        "   <\x1B[1mc\x1B[22m/>\x1B[39m\n\x1B[32m        <\x1B[1md\x1B[22m/>\x1B[39m\n   " +
                                                        " </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa1.txt\" readmethod:\"filesc" +
                                                        "reen\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Source file is empty",
                                            verify: "Source file at - is \x1B[31mempty\x1B[39m but the diff file is not."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"diff\" diff:\"test/simulation/testa1.txt\"",
                                            name  : "Diff file is empty",
                                            verify: "Diff file at - is \x1B[31mempty\x1B[39m but the source file is not."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"diff\" diff:\"test/simulation/testa1.txt\" diffcli:\"true\"",
                                            name  : "Diff file is empty with diffcli option",
                                            verify: "Diff file at - is \x1B[31mempty\x1B[39m but the source file is not."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Diff file and source file are same file, readmethod filescreen",
                                            verify: ""
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" " +
                                                        "output:\"test/simulation\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Diff file and source file are same file, readmethod file",
                                            verify: "\nPretty Diff found 0 differences. Executed in."
                                        }
                                    ]
                                }, {
                                    group: "readmethod: filescreen",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"beautify\"",
                                            name  : "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"minify\"",
                                            name  : "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"parse\"",
                                            name  : "Parse markup.",
                                            verify: "{\"token\":[\"<a>\",\"<b>\",\" \",\"<c/>\",\" \",\"</b>\",\"</a>\"],\"types\":[" +
                                                    "\"start\",\"start\",\"content\",\"singleton\",\"content\",\"end\",\"end\"]}"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"beautify\"",
                                            name  : "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"minify\"",
                                            name  : "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"parse\"",
                                            name  : "Parse markup.",
                                            verify: "{\"token\":[\"<a>\",\"<b>\",\" \",\"<c/>\",\" \",\"</b>\",\"</a>\"],\"types\":[" +
                                                    "\"start\",\"start\",\"content\",\"singleton\",\"content\",\"end\",\"end\"]}"
                                        }
                                    ]
                                }, {
                                    group: "write to new locations",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"inch.json\" readmethod:\"file\" mode:\"beautify" +
                                                    "\" output:\"test/simulation/inch\"",
                                            name  : "Beautify inch.json",
                                            verify: [
                                                "\nFile successfully written.\n\nReport successfully written to file.\n\nPretty D" +
                                                        "iff beautified 1 file. Executed in.",
                                                "\nReport successfully written to file.\n\nFile successfully written.\n\nPretty D" +
                                                        "iff beautified 1 file. Executed in."
                                            ]
                                        }, {
                                            check : "node api/node-local.js source:\"api\" readmethod:\"directory\" mode:\"beautify\"" +
                                                        " output:\"test/simulation/api\"",
                                            name  : "Beautify api directory",
                                            verify: "\nPretty Diff beautified -10 files. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test\" readmethod:\"subdirectory\" mode:\"parse" +
                                                    "\" output:\"test/simulation/all/big\"",
                                            name  : "Subdirectory parse all prettydiff",
                                            verify: "\nPretty Diff parsed -10 files. Executed in."
                                        }
                                    ]
                                }, {
                                    group: "file system checks",
                                    units: [
                                        {
                                            check : "cat test/simulation/inch/inch.json",
                                            name  : "print out asdf/inch.json",
                                            verify: "{\n    \"files\": {\n        \"included\": [\"prettydiff.js\"]\n    }\n}"
                                        }, {
                                            check : "ls test/simulation/api",
                                            name  : "check for 3 files in api directory",
                                            verify: "dom.js\ndom.js-report.html\nnode-local.js\nnode-local.js-report.html\nprettydiff" +
                                                        ".wsf\nprettydiff.wsf-report.html"
                                        }, {
                                            check : "cat test/simulation/all/big/today.js",
                                            name  : "check for a file in a subdirectory operation",
                                            verify: "{\"token\":[\"var\",\"today\",\"=\",\"20999999\",\";\",\"exports\",\".\",\"date" +
                                                    "\",\"=\",\"today\",\";\"],\"types\":[\"word\",\"word\",\"operator\",\"literal\"," +
                                                    "\"separator\",\"word\",\"separator\",\"word\",\"operator\",\"word\",\"separator" +
                                                    "\"]}"
                                        }, {
                                            check : "cat test/simulation/all/big/samples_correct/beautification_markup_comment.txt",
                                            name  : "check for a deeper file in a subdirectory operation",
                                            verify: "{\"token\":[\"<person>\",\"<!-- comment -->\",\"<name>\",\"bob\",\"</name>\",\"<" +
                                                        "/person>\"],\"types\":[\"start\",\"comment\",\"start\",\"content\",\"end\",\"end" +
                                                        "\"]}"
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
                                        verifies  = function taskrunner_simulations_shell_child_childExec_verifies(output, list) {
                                            var aa  = 0,
                                                len = list.length;
                                            if (output === list[0]) {
                                                passcount[depth] += 1;
                                                data.push("pass");
                                                return data.push(stdout);
                                            }
                                            do {
                                                aa += 1;
                                                if (output === list[aa]) {
                                                    passcount[depth] += 1;
                                                    data.push("pass");
                                                    return data.push(stdout);
                                                }
                                            } while (aa < len);
                                            data.push("fail");
                                            data.push("Unexpected output:  " + stdout);
                                        },
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
                                                            // a hack, this should not increment when a test failure occurred in a child
                                                            // group
                                                            fgroup -= 1;
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
                                    stdout = stdout.replace(/(\s+)$/, "");
                                    stdout = stdout.replace(/<strong>Execution\ time:<\/strong>\ <em>([0-9]+\ hours\ )?([0-9]+\ minutes\ )?[0-9]+(\.[0-9]+)?\ seconds\ <\/em>/g, "<strong>Execution time:</strong> <em>0</em>");
                                    stdout = stdout.replace(/Executed\ in\ ([0-9]+\ hours\ )?([0-9]+\ minutes\ )?[0-9]+(\.[0-9]+)?\ seconds/g, "Executed in");
                                    stdout = stdout.replace(/\ \d+\ files\./, " -10 files.");
                                    stdout = stdout.replace(/20\d{6}/, "20999999");
                                    //determine pass/fail status of a given test unit
                                    if (stdout.indexOf("Source file at ") > -1 && stdout.indexOf("is \x1B[31mempty\x1B[39m but the diff file is not.") > 0) {
                                        stdout = stdout.slice(0, stdout.indexOf("Source file at") + 14) + " - " + stdout.slice(stdout.indexOf("is \x1B[31mempty\x1B[39m but the diff file is not."));
                                    } else if (stdout.indexOf("Diff file at ") > -1 && stdout.indexOf("is \x1B[31mempty\x1B[39m but the source file is not.") > 0) {
                                        stdout = stdout.slice(0, stdout.indexOf("Diff file at") + 12) + " - " + stdout.slice(stdout.indexOf("is \x1B[31mempty\x1B[39m but the source file is not."));
                                    }
                                    if (stdout.indexOf("Pretty Diff found 0 differences.") < 0) {
                                        stdout = stdout.replace(/Pretty\ Diff\ found\ \d+\ differences./, "Pretty Diff found -10 differences.");
                                    }
                                    if (path.slash === "\\") {
                                        param.verify = param
                                            .verify
                                            .replace(/^(cat\ )/, "type ");
                                    }
                                    if (typeof err === "string") {
                                        data.push("fail");
                                        data.push(err);
                                    } else if (typeof stderr === "string" && stderr !== "") {
                                        data.push("fail");
                                        data.push(stderr);
                                    } else if (stdout !== param.verify) {
                                        if (typeof param.verify === "string" || param.verify.length === 0) {
                                            data.push("fail");
                                            data.push("Unexpected output:  " + stdout);
                                        } else {
                                            verifies(stdout, param.verify);
                                        }
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
