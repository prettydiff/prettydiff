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
        humantime  = function taskrunner_humantime(finished) {
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
                    minuteString = (finished === true)
                        ? plural(minutes, " minute")
                        : (minutes < 10)
                            ? "0" + minutes
                            : "" + minutes;
                    minutes      = elapsed - (minutes * 60);
                    secondString = (finished === true)
                        ? (minutes === 1)
                            ? " 1 second "
                            : minutes.toFixed(3) + " seconds "
                        : minutes.toFixed(3);
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
                elapsed    = elapsed - (hours * 3600);
                hourString = (finished === true)
                    ? plural(hours, " hour")
                    : (hours < 10)
                        ? "0" + hours
                        : "" + hours;
                minute();
            } else {
                secondString = (finished === true)
                    ? plural(secondString, " second")
                    : secondString;
            }
            if (finished === true) {
                finalTime = hourString + minuteString + secondString;
                console.log(finalMem + " of memory consumed");
                console.log(finalTime + "total time");
                console.log("");
            } else {
                if (hourString === "") {
                    hourString = "00";
                }
                if (minuteString === "") {
                    minuteString = "00";
                }
                if ((/^([0-9]\.)/).test(secondString) === true) {
                    secondString = "0" + secondString;
                }
                return "\u001B[36m[" + hourString + ":" + minuteString + ":" + secondString + "]\u001B[39m ";
            }
        },
        prettydiff = require("../prettydiff.js"),
        options    = {},
        errout     = function taskrunner_errout(errtext) {
            console.log("");
            console.error(errtext);
            humantime(true);
            process.exit(1);
        },
        next       = function taskrunner_nextInit() {
            return;
        },
        diffFiles  = function taskrunner_diffFiles(sampleName, sampleSource, sampleDiff) {
            var aa     = 0,
                line   = 0,
                pdlen  = 0,
                count  = 0,
                diffs  = 0,
                lcount = 0,
                report = [],
                colors = {
                    del     : {
                        charEnd  : "\u001b[22m",
                        charStart: "\u001b[1m",
                        lineEnd  : "\u001b[39m",
                        lineStart: "\u001b[31m"
                    },
                    filepath: {
                        end  : "\u001b[39m",
                        start: "\u001b[36m"
                    },
                    ins     : {
                        charEnd  : "\u001b[22m",
                        charStart: "\u001b[1m",
                        lineEnd  : "\u001b[39m",
                        lineStart: "\u001b[32m"
                    }
                };
            options.mode    = "diff";
            options.source  = sampleSource;
            options.diff    = sampleDiff;
            options.diffcli = true;
            options.context = 2;
            options.lang    = "text";
            report          = prettydiff(options)[0];
            pdlen           = report[0].length;
            if (report.length < 3) {
                console.log("");
                console.log(colors.del.lineStart + "Test diff operation provided a bad code sample:" + colors.del.lineEnd);
                console.log(report[0]);
                return errout(colors.del.lineStart + "bad test" + colors.del.lineEnd);
            }
            // report indexes from diffcli feature of diffview.js 0 - source line number 1 -
            // source code line 2 - diff line number 3 - diff code line 4 - change 5 - index
            // of options.context (not parallel) 6 - total count of differences
            if (sampleName !== "phases.simulations" && report[0][0] < 2) {
                diffs += 1;
                console.log("");
                console.log(colors.filepath.start + sampleName);
                console.log("Line: 1" + colors.filepath.end);
            }
            for (aa = 0; aa < pdlen; aa += 1) {
                if (report[4][aa] === "equal" && report[4][aa + 1] === "equal" && report[4][aa + 2] !== undefined && report[4][aa + 2] !== "equal") {
                    count += 1;
                    if (count === 51) {
                        break;
                    }
                    line   = report[0][aa] + 2;
                    lcount = 0;
                    diffs  += 1;
                    console.log("");
                    console.log(colors.filepath.start + sampleName);
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
                        } else if (report[1][aa].replace(/\u0020+/g, "") === "") {
                            report[1][aa] = "(indentation)";
                        }
                        console.log(colors.del.lineStart + report[1][aa].replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                    } else if (report[4][aa] === "insert" && report[2][aa] !== report[2][aa + 1]) {
                        if (report[3][aa] === "") {
                            report[3][aa] = "(empty line)";
                        } else if (report[3][aa].replace(/\u0020+/g, "") === "") {
                            report[3][aa] = "(indentation)";
                        }
                        console.log(colors.ins.lineStart + report[3][aa].replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    } else if (report[4][aa] === "equal" && aa > 1) {
                        console.log(report[3][aa]);
                    } else if (report[4][aa] === "replace") {
                        console.log(colors.del.lineStart + report[1][aa].replace(/<p(d)>/g, colors.del.charStart).replace(/<\/pd>/g, colors.del.charEnd) + colors.del.lineEnd);
                        console.log(colors.ins.lineStart + report[3][aa].replace(/<p(d)>/g, colors.ins.charStart).replace(/<\/pd>/g, colors.ins.charEnd) + colors.ins.lineEnd);
                    }
                }
            }
            if (sampleName !== "phases.simulations") {
                console.log("");
                console.log(diffs + colors.filepath.start + " differences counted." + colors.filepath.end);
                errout("Pretty Diff " + colors.del.lineStart + "failed" + colors.del.lineEnd + " on file: " + colors.filepath.start + sampleName + colors.filepath.end);
            }
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
                            filecount = 0;
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
                                    console.log("\u001B[33msamples_raw directory is missing file:\u001B[39m " + correct[a][0]);
                                    correct.splice(a, 1);
                                } else {
                                    console.log("\u001B[33msamples_correct directory is missing file:\u001B[39m " + raw[a][0]);
                                    raw.splice(a, 1);
                                }
                                len = (raw.length > correct.length)
                                    ? raw.length
                                    : correct.length;
                                a   -= 1;
                                if (a === len - 1) {
                                    console.log("");
                                    console.log("\u001B[32mCore Unit Testing Complete\u001B[39m");
                                    return next();
                                }
                            } else if (raw[a][0] === correct[a][0]) {
                                options.source = raw[a][1];
                                output         = prettydiff(options);
                                if (output.charAt(output.length - 1) !== "\n") {
                                    output = output + "\n";
                                }
                                if (output === correct[a][1]) {
                                    filecount += 1;
                                    console.log(humantime(false) + "\u001B[32mPass " + filecount + ":\u001B[39m " + correct[a][0]);
                                    if (a === len - 1) {
                                        return next();
                                    }
                                } else {
                                    diffFiles(correct[a][0], output, correct[a][1]);
                                }
                            } else {
                                if (raw[a][0] < correct[a][0]) {
                                    console.log("\u001B[33mCorrect samples directory is missing file:\u001B[39m " + raw[a][0]);
                                    raw.splice(a, 1);
                                } else {
                                    console.log("\u001B[33mRaw samples directory is missing file:\u001B[39m " + correct[a][0]);
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
                                                    compare("");
                                                }
                                            }
                                        } else if (type === "correct") {
                                            correct.push([val, fileData]);
                                            countc += 1;
                                            if (countc === arr.length) {
                                                utflag.correct = true;
                                                if (utflag.raw === true) {
                                                    compare("");
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
                console.log("\u001B[36mCore Unit Testing\u001B[39m");
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
                        "guide",
                        "ignore",
                        "JSLint",
                        "node_modules",
                        "test/samples_correct",
                        "test/samples_raw"
                    ],
                    flag            = {
                        files: false,
                        fs   : false,
                        items: false,
                        lint : false,
                        today: false
                    },
                    files           = [],
                    jslint          = function taskrunner_declareJSLINT() {
                        return;
                    },
                    lintrun         = function taskrunner_lint_lintrun() {
                        var lintit = function taskrunner_lint_lintrun_lintit(val, ind, arr) {
                            var result = {},
                                failed = false,
                                ecount = 0,
                                report = function taskrunner_lint_lintrun_lintit_lintOn_report(warning) {
                                    //start with an exclusion list.  There are some warnings that I don't care about
                                    if (warning === null) {
                                        return;
                                    }
                                    if (warning.message.indexOf("Unexpected dangling '_'") === 0) {
                                        return;
                                    }
                                    if ((/Bad\u0020property\u0020name\u0020'\w+_'\./).test(warning.message) === true) {
                                        return;
                                    }
                                    if (warning.message.indexOf("/*global*/ requires") === 0) {
                                        return;
                                    }
                                    failed = true;
                                    if (ecount === 0) {
                                        console.log("\u001B[31mJSLint errors on\u001B[39m " + val[0]);
                                        console.log("");
                                    }
                                    ecount += 1;
                                    console.log("On line " + warning.line + " at column: " + warning.column);
                                    console.log(warning.message);
                                    console.log("");
                                };
                            options.source = val[1];
                            result         = jslint(prettydiff(options), {"for": true});
                            if (result.ok === true) {
                                console.log(humantime(false) + "\u001B[32mLint is good for file " + (ind + 1) + ":\u001B[39m " + val[0]);
                                if (ind === arr.length - 1) {
                                    console.log("");
                                    console.log("\u001B[32mLint operation complete!\u001B[39m");
                                    console.log("");
                                    return next();
                                }
                            } else {
                                result
                                    .warnings
                                    .forEach(report);
                                if (failed === true) {
                                    errout("\u001B[31mLint fail\u001B[39m :(");
                                } else {
                                    console.log(humantime(false) + "\u001B[32mLint is good for file " + (ind + 1) + ":\u001B[39m " + val[0]);
                                    if (ind === arr.length - 1) {
                                        console.log("");
                                        console.log("\u001B[32mLint operation complete!\u001B[39m");
                                        console.log("");
                                        return next();
                                    }
                                }
                            }
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
                            styleguide  : "jslint",
                            wrap        : 80
                        };
                        files.forEach(lintit);
                    };
                console.log("");
                console.log("");
                console.log("\u001B[36mBeautifying and Linting\u001B[39m");
                console.log("** Note that line numbers of error messaging reflects beautified code line.");
                console.log("");
                (function taskrunner_lint_install() {
                    var dateobj = new Date(),
                        day     = (dateobj.getDate() > 9)
                            ? "" + dateobj.getDate()
                            : "0" + dateobj.getDate(),
                        month   = (dateobj.getMonth() > 8)
                            ? "" + (dateobj.getMonth() + 1)
                            : "0" + (dateobj.getMonth() + 1),
                        date    = Number("" + dateobj.getFullYear() + month + day),
                        today   = require("./today.js");
                    fs.stat("JSLint", function taskrunner_lint_install_stat(erstat, stats) {
                        var child     = require("child_process").exec,
                            command   = "git submodule foreach git reset --hard origin/master",
                            childtask = function taskrunner_lint_install_stat_childtask() {
                                child(command, {
                                    timeout: 30000
                                }, function taskrunner_lint_install_stat_childtask_child(childerror, childstdout, childstderr) {
                                    var cdupcallback = function taskrunner_lint_install_stat_childtask_child_cdupcallback() {
                                            fs
                                                .readFile("JSLint/jslint.js", "utf8", function taskrunner_lint_install_stat_childtask_child_cdupcallback_readFile(erread, data) {
                                                    var moduleready = function taskrunner_lint_install_stat_childtask_child_cdupcallback_readFile_moduleready() {
                                                        var todaystring = "/*global module*/(function () {\"use strict\";var today=" + date + ";module.exports=today;}());";
                                                        jslint = require(process.cwd() + "/JSLint/jslint.js");
                                                        fs.writeFile("test/today.js", todaystring, function taskrunner_lint_install_stat_childtask_child_cdupcallback_readFile_moduleready_writeFile(werr) {
                                                            if (werr !== null && werr !== undefined) {
                                                                errout(werr);
                                                            }
                                                            flag.today = true;
                                                            if (flag.fs === true && flag.lint === true) {
                                                                lintrun();
                                                            }
                                                        });
                                                        console.log("\u001B[36mInstalled JSLint edition:\u001B[39m " + jslint().edition);
                                                        flag.lint = true;
                                                        if (flag.fs === true && flag.today === true) {
                                                            lintrun();
                                                        }
                                                    };
                                                    if (erread !== null && erread !== undefined) {
                                                        return errout(erread);
                                                    }
                                                    // Only modify the jslint.js file once, so we have to check to see if it is
                                                    // already modified
                                                    if (data.slice(data.length - 30).indexOf("\nmodule.exports = jslint;") < 0) {
                                                        data = data + "\nmodule.exports = jslint;";
                                                        return fs.writeFile("JSLint/jslint.js", data, "utf8", function taskrunner_lint_install_stat_childtask_child_readFile_writeFile(erwrite) {
                                                            if (erwrite !== null && erwrite !== undefined) {
                                                                return errout(erwrite);
                                                            }
                                                            moduleready();
                                                        });
                                                    }
                                                    moduleready();
                                                });
                                        },
                                        errorhandle  = function taskrunner_lint_install_stat_childtask_child_errorhandle(errormsg, stderror, execution) {
                                            if (errormsg !== null) {
                                                if (stderror.indexOf("Could not resolve host: github.com") > 0) {
                                                    return fs.stat("JSLint/jslint.js", function taskrunner_lint_install_stat_childtask_child_errorhandle_filestat(jerstat, jstats) {
                                                        if (typeof jerstat === "string") {
                                                            return errout(jerstat);
                                                        }
                                                        if (jstats.isFile() === true) {
                                                            console.log("Could not connect to Github, but it looks like JSLint is installed.  Running pri" +
                                                                    "or installed JSLint.");
                                                            return cdupcallback();
                                                        }
                                                        console.log("Could not connect to Github, and JSLint does not appear to be installed.  Skippi" +
                                                                "ng to next phase.");
                                                        return next();
                                                    });
                                                }
                                                return errout(errormsg);
                                            }
                                            if (typeof stderror === "string" && stderror.length > 0 && stderror.indexOf("Cloning into") < 0 && stderror.indexOf("From http") < 0) {
                                                return errout(stderror);
                                            }
                                            execution();
                                        },
                                        childproc    = function taskrunner_lint_install_stat_childtask_child_childproc() {
                                            child("git submodule foreach git pull origin master", {
                                                timeout: 30000
                                            }, function taskrunner_lint_install_stat_childtask_child_moduleinstall(erchild, stdout, stderr) {
                                                errorhandle(erchild, stderr, cdupcallback);
                                                return stdout;
                                            });
                                        };
                                    errorhandle(childerror, childstderr, childproc);
                                    return childstdout;
                                });
                            },
                            absentfun = function taskrunner_lint_install_stat_absentfun() {
                                // we only need to install once per day, so determine if JSLint has already
                                // installed today
                                if (today < date) {
                                    console.log("Pulling latest JSLint...");
                                    return childtask();
                                }
                                jslint = require(process.cwd() + "/JSLint/jslint.js");
                                console.log("Running prior installed JSLint version " + jslint().edition + ".");
                                flag.lint  = true;
                                flag.today = true;
                                if (flag.fs === true) {
                                    lintrun();
                                }
                            },
                            initfun   = function taskrunner_lint_install_stat_initfun() {
                                child("git submodule init", function (initerr, initout, initstd) {
                                    if (typeof initerr === "string") {
                                        return errout(initerr);
                                    }
                                    if (typeof initstd === "string" && initstd.length > 0) {
                                        return errout(initstd);
                                    }
                                    console.log("git submodule init");
                                    child("git submodule update", function (suberr, subout, substd) {
                                        if (typeof suberr === "string") {
                                            return errout(suberr);
                                        }
                                        if (typeof substd === "string" && substd.length > 0 && substd.indexOf("Cloning into") < 0) {
                                            return errout(substd);
                                        }
                                        console.log("git submodule update");
                                        absentfun();
                                        return subout;
                                    });
                                    return initout;
                                });
                            };
                        if (erstat !== null && erstat !== undefined) {
                            return errout(erstat);
                        }
                        if (stats.isDirectory() === true) {
                            return fs.readdir("JSLint", function (direrr, files) {
                                if (typeof direrr === "string") {
                                    return errout(direrr);
                                }
                                if (files.length < 1) {
                                    return initfun();
                                }
                                return absentfun();
                            });
                        }
                        console.log("Cloning JSLint...");
                        command = "git submodule add https://github.com/douglascrockford/JSLint.git";
                        childtask();
                    });
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
                                    if (path.sep === "\\") {
                                        files.push([
                                            filePath.slice(filePath.indexOf("\\prettydiff\\") + 14),
                                            data
                                        ]);
                                    } else {
                                        files.push([
                                            filePath.slice(filePath.indexOf("/prettydiff/") + 12),
                                            data
                                        ]);
                                    }
                                    if (flag.files === true && flag.items === true) {
                                        flag.fs = true;
                                        if (flag.lint === true && flag.today === true) {
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
                        var prettydata = "",
                            globalmeta = "{\"difflines\":0,\"difftotal\":0,\"error\":\"\",\"insize\":xxx,\"lang\":[\"json" +
                                    "\",\"javascript\",\"JSON\"],\"outsize\":xxx,\"time\":\"0.000 seconds\"}",
                            strmeta    = "";
                        if (err !== null && err !== undefined) {
                            errout("Cannot read package.json");
                        }
                        if (data.indexOf("_requiredBy") > 0) {
                            return next();
                        }
                        console.log("");
                        console.log("\u001B[36mTesting package.json beautification...\u001B[39m");
                        options.lang       = "auto";
                        options.mode       = "beautify";
                        options.objsort    = "all";
                        options.source     = data;
                        options.styleguide = "none";
                        options.vertical   = "all";
                        prettydata         = prettydiff(options);
                        strmeta            = JSON
                            .stringify(global.prettydiff.meta)
                            .replace(/size":\d+/g, "size\":xxx")
                            .replace(/\d+\.\d+\u0020seconds/, "0.000 seconds");
                        if (data.replace(/(\s+)$/, "") !== prettydata.replace(/(\s+)$/, "")) {
                            diffFiles("package.json", data, prettydata);
                            errout("\u001B[31mPretty Diff corrupted package.json\u001B[36m");
                        }
                        console.log(humantime(false) + "\u001B[32mThe package.json file is beautified properly.\u001B[36m");
                        if (strmeta !== globalmeta) {
                            diffFiles("package.json", strmeta, globalmeta);
                            errout("\u001B[31mglobal.prettydiff.meta is broken from package.json beautification.1B[3" +
                                    "9m");
                            console.log("");
                        }
                        console.log(humantime(false) + "\u001B[32mglobal.prettydiff.meta global object is properly constructed.\u001B[39" +
                                "m");
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
                                function taskrunner_simulations_buildup0() {
                                    fs
                                        .mkdir("test/simulation", function taskrunner_simulations_buildup0_callback(err) {
                                            if (err !== null) {
                                                return errout(err);
                                            }
                                        });
                                },
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
                                            verify: "{\"data\":{\"attrs\":[{},{},{},{},{}],\"begin\":[0,0,1,1,0],\"daddy\":[\"root\"," +
                                                        "\"a\",\"b\",\"b\",\"a\"],\"jscom\":[false,false,false,false,false],\"linen\":[1," +
                                                        "1,1,1,1],\"lines\":[0,0,1,1,0],\"presv\":[false,false,false,false,false],\"token" +
                                                        "\":[\"<a>\",\"<b>\",\"<c/>\",\"</b>\",\"</a>\"],\"types\":[\"start\",\"start\"," +
                                                        "\"singleton\",\"end\",\"end\"]},\"definition\":{\"attrs\":\"array - List of attr" +
                                                        "ibutes (if any) for the given token.\",\"begin\":\"number - Index where the pare" +
                                                        "nt element occurs.\",\"daddy\":\"string - Tag name of the parent element. Tokens" +
                                                        " of type 'template_start' are not considered as parent elements.  End tags refle" +
                                                        "ct their matching start tag.\",\"jscom\":\"boolean - Whether the token is a Java" +
                                                        "Script comment if in JSX format.\",\"linen\":\"number - The line number in the o" +
                                                        "riginal source where the token started, which is used for reporting and analysis" +
                                                        ".\",\"lines\":\"number - Whether the token is preceeded any space and/or line br" +
                                                        "eaks in the original code source.\",\"presv\":\"boolean - Whether the token is p" +
                                                        "reserved verbatim as found.  Useful for comments and HTML 'pre' tags.\",\"token" +
                                                        "\":\"string - The parsed code tokens.\",\"types\":\"string - Data types of the t" +
                                                        "okens: cdata, comment, conditional, content, end, ignore, linepreserve, script, " +
                                                        "sgml, singleton, start, template, template_else, template_end, template_start, x" +
                                                        "ml\"}}"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen\" " +
                                                        "mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\"",
                                            name  : "Diff markup.",
                                            verify: "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><!DOCTYPE html PUBLIC \"-//W3C//DTD X" +
                                                        "HTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\"><html xmlns=\"ht" +
                                                        "tp://www.w3.org/1999/xhtml\" xml:lang=\"en\"><head><title>Pretty Diff - The diff" +
                                                        "erence tool</title><meta name=\"robots\" content=\"index, follow\"/> <meta name=" +
                                                        "\"DC.title\" content=\"Pretty Diff - The difference tool\"/> <link rel=\"canonic" +
                                                        "al\" href=\"http://prettydiff.com/\" type=\"application/xhtml+xml\"/><meta http-" +
                                                        "equiv=\"Content-Type\" content=\"application/xhtml+xml;charset=UTF-8\"/><meta ht" +
                                                        "tp-equiv=\"Content-Style-Type\" content=\"text/css\"/><style type=\"text/css\">/" +
                                                        "*<![CDATA[*/#prettydiff.canvas{background:#986 url(\"data:image/png;base64,iVBOR" +
                                                        "w0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQa" +
                                                        "G90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSogho" +
                                                        "dkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWS" +
                                                        "DNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQ" +
                                                        "plcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVA" +
                                                        "aCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDII" +
                                                        "yN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g8" +
                                                        "8wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoX" +
                                                        "gugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyX" +
                                                        "YFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+" +
                                                        "wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkL" +
                                                        "lTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdN" +
                                                        "MBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRN" +
                                                        "UgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaP" +
                                                        "Yw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd" +
                                                        "0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSi" +
                                                        "UMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U" +
                                                        "+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr" +
                                                        "+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvV" +
                                                        "Vgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHq" +
                                                        "meob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5Q" +
                                                        "zNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedp" +
                                                        "r1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+" +
                                                        "hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGX" +
                                                        "OMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2u" +
                                                        "GVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22f" +
                                                        "WFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLK" +
                                                        "cRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0n" +
                                                        "ymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeW" +
                                                        "V/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj" +
                                                        "4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6R" +
                                                        "JZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvy" +
                                                        "F1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7" +
                                                        "JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lt" +
                                                        "y8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLV" +
                                                        "y0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1" +
                                                        "+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXD" +
                                                        "m4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07" +
                                                        "NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr6" +
                                                        "0cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T" +
                                                        "8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i" +
                                                        "+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1" +
                                                        "tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGh" +
                                                        "YPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/b" +
                                                        "Xyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzL" +
                                                        "dsAAEFdaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1T" +
                                                        "TBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvI" +
                                                        "iB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6N" +
                                                        "TM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5O" +
                                                        "S8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiC" +
                                                        "iAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgI" +
                                                        "CAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgI" +
                                                        "CAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFd" +
                                                        "mVudCMiCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc" +
                                                        "1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL" +
                                                        "2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlL" +
                                                        "mNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlL" +
                                                        "mNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZ" +
                                                        "XhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxN" +
                                                        "CAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxN" +
                                                        "i0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhd" +
                                                        "GFEYXRlPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgI" +
                                                        "Dx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTEzVDEzOjE4OjA3LTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KI" +
                                                        "CAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iY" +
                                                        "jM5NjA0MDVhOWQ8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb" +
                                                        "2JlOmRvY2lkOnBob3Rvc2hvcDoxYzM3NjE4MS1mOWU4LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htc" +
                                                        "E1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2Y" +
                                                        "jI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJR" +
                                                        "D4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgI" +
                                                        "CAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0R" +
                                                        "XZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppb" +
                                                        "nN0YW5jZUlEPnhtcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2d" +
                                                        "DppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0O" +
                                                        "jM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2Vud" +
                                                        "D5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KI" +
                                                        "CAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZ" +
                                                        "T0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY" +
                                                        "3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtY" +
                                                        "TVmMi00ODQ3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgI" +
                                                        "CAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgI" +
                                                        "CAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoT" +
                                                        "WFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoY" +
                                                        "W5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgI" +
                                                        "CAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFd" +
                                                        "nQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhc" +
                                                        "mFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5wa" +
                                                        "G90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgI" +
                                                        "CAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgP" +
                                                        "HN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6a" +
                                                        "W5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFd" +
                                                        "nQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxM" +
                                                        "zoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlb" +
                                                        "nQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+C" +
                                                        "iAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgI" +
                                                        "CAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291c" +
                                                        "mNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5kZXJpdmVkPC9zdEV2dDphY3Rpb24+C" +
                                                        "iAgICAgICAgICAgICAgICAgIDxzdEV2dDpwYXJhbWV0ZXJzPmNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0a" +
                                                        "W9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nPC9zdEV2dDpwYXJhbWV0ZXJzPgogICAgI" +
                                                        "CAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZ" +
                                                        "XNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvb" +
                                                        "j4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyL" +
                                                        "TQ0MGUtYjA5OS1iYjM5NjA0MDVhOWQ8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgI" +
                                                        "DxzdEV2dDp3aGVuPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgI" +
                                                        "CAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpb" +
                                                        "nRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZ" +
                                                        "D4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZ" +
                                                        "GY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvb" +
                                                        "SByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtc" +
                                                        "C5paWQ6ODNhNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjppbnN0YW5jZUlEP" +
                                                        "gogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOjgzYTc5MGFkLWMwZWQtNGIzYS05Z" +
                                                        "DJhLWE5YzQ2MWRmMzVhMTwvc3RSZWY6ZG9jdW1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9yaWdpb" +
                                                        "mFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwvc" +
                                                        "3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8L3htcE1NOkRlcml2ZWRGcm9tPgogICAgI" +
                                                        "CAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvb" +
                                                        "G9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2Zpb" +
                                                        "GU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPc" +
                                                        "mllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4zM" +
                                                        "DAwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4zM" +
                                                        "DAwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pd" +
                                                        "D4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q" +
                                                        "29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjQ8L2V4aWY6UGl4ZWxYRGltZ" +
                                                        "W5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFlEaW1lbnNpb" +
                                                        "24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                        "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                        "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3I" +
                                                        "j8+bleIyQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAANElEQVR42" +
                                                        "mJ89+4uAwMDAwPD6lkTGd69u/vu3d2ZHXnv3t1lgLPevbvLrCTIEJqWD1EJGADaTRll80WcLAAAAABJR" +
                                                        "U5ErkJggg==\");color:#420}#prettydiff.canvas *:focus{outline:0.1em dashed #f00}#" +
                                                        "prettydiff.canvas a{color:#039}#prettydiff.canvas .contentarea,#prettydiff.canva" +
                                                        "s legend,#prettydiff.canvas fieldset select,#prettydiff.canvas .diff td,#prettyd" +
                                                        "iff.canvas .report td,#prettydiff.canvas .data li,#prettydiff.canvas .diff-right" +
                                                        ",#prettydiff.canvas fieldset input{background:#eeeee8;border-color:#420}#prettyd" +
                                                        "iff.canvas select,#prettydiff.canvas input,#prettydiff.canvas .diff,#prettydiff." +
                                                        "canvas .beautify,#prettydiff.canvas .report,#prettydiff.canvas .beautify h3,#pre" +
                                                        "ttydiff.canvas .diff h3,#prettydiff.canvas .beautify h4,#prettydiff.canvas .diff" +
                                                        " h4,#prettydiff.canvas #report,#prettydiff.canvas #report .author,#prettydiff.ca" +
                                                        "nvas fieldset{background:#ddddd8;border-color:#420}#prettydiff.canvas fieldset f" +
                                                        "ieldset{background:#eeeee8}#prettydiff.canvas fieldset fieldset input,#prettydif" +
                                                        "f.canvas fieldset fieldset select{background:#ddddd8}#prettydiff.canvas h2,#pret" +
                                                        "tydiff.canvas h2 button,#prettydiff.canvas h3,#prettydiff.canvas legend{color:#9" +
                                                        "00}#prettydiff.canvas .contentarea{box-shadow:0 1em 1em #b8a899}#prettydiff.canv" +
                                                        "as .segment{background:#fff}#prettydiff.canvas h2 button,#prettydiff.canvas .seg" +
                                                        "ment,#prettydiff.canvas ol.segment li{border-color:#420}#prettydiff.canvas th{ba" +
                                                        "ckground:#e8ddcc}#prettydiff.canvas li h4{color:#06f}#prettydiff.canvas code{bac" +
                                                        "kground:#eee;border-color:#eee;color:#00f}#prettydiff.canvas ol.segment h4 stron" +
                                                        "g{color:#c00}#prettydiff.canvas button{background-color:#ddddd8;border-color:#42" +
                                                        "0;box-shadow:0 0.25em 0.5em #b8a899;color:#900}#prettydiff.canvas button:hover{b" +
                                                        "ackground-color:#ccb;border-color:#630;box-shadow:0 0.25em 0.5em #b8a899;color:#" +
                                                        "630}#prettydiff.canvas th{background:#ccccc8}#prettydiff.canvas thead th,#pretty" +
                                                        "diff.canvas th.heading{background:#ccb}#prettydiff.canvas .diff h3{background:#d" +
                                                        "dd;border-color:#999}#prettydiff.canvas td,#prettydiff.canvas th,#prettydiff.can" +
                                                        "vas .segment,#prettydiff.canvas .count li,#prettydiff.canvas .data li,#prettydif" +
                                                        "f.canvas .diff-right{border-color:#ccccc8}#prettydiff.canvas .count{background:#" +
                                                        "eed;border-color:#999}#prettydiff.canvas .count li.fold{color:#900}#prettydiff.c" +
                                                        "anvas h2 button{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettydif" +
                                                        "f.canvas li h4{color:#00f}#prettydiff.canvas code{background:#eee;border-color:#" +
                                                        "eee;color:#009}#prettydiff.canvas ol.segment h4 strong{color:#c00}#prettydiff.ca" +
                                                        "nvas .data .delete{background:#ffd8d8}#prettydiff.canvas .data .delete em{backgr" +
                                                        "ound:#fff8f8;border-color:#c44;color:#900}#prettydiff.canvas .data .insert{backg" +
                                                        "round:#d8ffd8}#prettydiff.canvas .data .insert em{background:#f8fff8;border-colo" +
                                                        "r:#090;color:#363}#prettydiff.canvas .data .replace{background:#fec}#prettydiff." +
                                                        "canvas .data .replace em{background:#ffe;border-color:#a86;color:#852}#prettydif" +
                                                        "f.canvas .data .empty{background:#ddd}#prettydiff.canvas .data em.s0{color:#000}" +
                                                        "#prettydiff.canvas .data em.s1{color:#f66}#prettydiff.canvas .data em.s2{color:#" +
                                                        "12f}#prettydiff.canvas .data em.s3{color:#090}#prettydiff.canvas .data em.s4{col" +
                                                        "or:#d6d}#prettydiff.canvas .data em.s5{color:#7cc}#prettydiff.canvas .data em.s6" +
                                                        "{color:#c85}#prettydiff.canvas .data em.s7{color:#737}#prettydiff.canvas .data e" +
                                                        "m.s8{color:#6d0}#prettydiff.canvas .data em.s9{color:#dd0}#prettydiff.canvas .da" +
                                                        "ta em.s10{color:#893}#prettydiff.canvas .data em.s11{color:#b97}#prettydiff.canv" +
                                                        "as .data em.s12{color:#bbb}#prettydiff.canvas .data em.s13{color:#cc3}#prettydif" +
                                                        "f.canvas .data em.s14{color:#333}#prettydiff.canvas .data em.s15{color:#9d9}#pre" +
                                                        "ttydiff.canvas .data em.s16{color:#880}#prettydiff.canvas .data .l0{background:#" +
                                                        "eeeee8}#prettydiff.canvas .data .l1{background:#fed}#prettydiff.canvas .data .l2" +
                                                        "{background:#def}#prettydiff.canvas .data .l3{background:#efe}#prettydiff.canvas" +
                                                        " .data .l4{background:#fef}#prettydiff.canvas .data .l5{background:#eef}#prettyd" +
                                                        "iff.canvas .data .l6{background:#fff8cc}#prettydiff.canvas .data .l7{background:" +
                                                        "#ede}#prettydiff.canvas .data .l8{background:#efc}#prettydiff.canvas .data .l9{b" +
                                                        "ackground:#ffd}#prettydiff.canvas .data .l10{background:#edc}#prettydiff.canvas " +
                                                        ".data .l11{background:#fdb}#prettydiff.canvas .data .l12{background:#f8f8f8}#pre" +
                                                        "ttydiff.canvas .data .l13{background:#ffb}#prettydiff.canvas .data .l14{backgrou" +
                                                        "nd:#eec}#prettydiff.canvas .data .l15{background:#cfc}#prettydiff.canvas .data ." +
                                                        "l16{background:#eea}#prettydiff.canvas .data .c0{background:inherit}#prettydiff." +
                                                        "canvas #report p em{color:#060}#prettydiff.canvas #report p strong{color:#009}#p" +
                                                        "rettydiff.shadow{background:#333 url(\"data:image/png;base64,iVBORw0KGgoAAAANSUh" +
                                                        "EUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUN" +
                                                        "DIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8i" +
                                                        "giAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeC" +
                                                        "Dx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kTh" +
                                                        "LCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg" +
                                                        "7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc" +
                                                        "88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P" +
                                                        "9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLU" +
                                                        "AoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKU" +
                                                        "cz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXu" +
                                                        "RLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKC" +
                                                        "BKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW" +
                                                        "4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI" +
                                                        "9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8" +
                                                        "+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7" +
                                                        "YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFT" +
                                                        "SEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU" +
                                                        "05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9B" +
                                                        "X0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpV" +
                                                        "KlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/Yk" +
                                                        "GWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8" +
                                                        "H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0o" +
                                                        "nXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/V" +
                                                        "HDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgY" +
                                                        "mISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrx" +
                                                        "uhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6" +
                                                        "TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e" +
                                                        "5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+B" +
                                                        "R5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8N" +
                                                        "vnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOy" +
                                                        "QrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1" +
                                                        "KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxa" +
                                                        "pLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW" +
                                                        "5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAV" +
                                                        "ZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjx" +
                                                        "xedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1Yfq" +
                                                        "GnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO3" +
                                                        "19kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7Jvtt" +
                                                        "VAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0" +
                                                        "NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9s" +
                                                        "fD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPK" +
                                                        "y2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/f" +
                                                        "F9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+" +
                                                        "Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28b" +
                                                        "Cxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEQFaVRYdFh" +
                                                        "NTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJ" +
                                                        "lU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJ" +
                                                        "BZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICA" +
                                                        "gICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGY" +
                                                        "tc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICA" +
                                                        "gIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM" +
                                                        "6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN" +
                                                        "0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICA" +
                                                        "gICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3V" +
                                                        "yY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzE" +
                                                        "uMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3N" +
                                                        "ob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzE" +
                                                        "uMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4" +
                                                        "KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3N" +
                                                        "oKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjo" +
                                                        "yNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTY" +
                                                        "tMDEtMTNUMTU6MTE6MzMtMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ" +
                                                        "5RGF0ZT4yMDE2LTAxLTEzVDE1OjExOjMzLTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHh" +
                                                        "tcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo4MDAwYTE3Zi1jZTY1LTQ5NTUtYjFmMS05YjVkODIwNDIyNjU" +
                                                        "8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnB" +
                                                        "ob3Rvc2hvcDoxZmZhNDk1Yy1mYTU2LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW5" +
                                                        "0SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZjA" +
                                                        "3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICA" +
                                                        "gPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmx" +
                                                        "pIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5" +
                                                        "jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnh" +
                                                        "tcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZUl" +
                                                        "EPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9" +
                                                        "zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG9" +
                                                        "0b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICA" +
                                                        "gICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2U" +
                                                        "iPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICA" +
                                                        "gICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LTh" +
                                                        "jNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ" +
                                                        "6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICA" +
                                                        "gICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTw" +
                                                        "vc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3R" +
                                                        "FdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGk" +
                                                        "gcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmR" +
                                                        "lcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29" +
                                                        "udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3N" +
                                                        "0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmR" +
                                                        "mOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGl" +
                                                        "vbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD5" +
                                                        "4bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2V" +
                                                        "JRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMDw" +
                                                        "vc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGh" +
                                                        "vdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICA" +
                                                        "gICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmR" +
                                                        "mOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICA" +
                                                        "gICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICA" +
                                                        "gICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjA0ZGYyNDk5LWE1NTktNDE4MC1iNjA1LWI2MTk" +
                                                        "3MWMxNWEwMzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjA" +
                                                        "xNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ" +
                                                        "0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnN" +
                                                        "vZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5" +
                                                        "nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJ" +
                                                        "zZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZWQ" +
                                                        "8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcHB" +
                                                        "saWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz4" +
                                                        "KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHl" +
                                                        "wZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ" +
                                                        "0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20" +
                                                        "gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZXR" +
                                                        "lcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJ" +
                                                        "zZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3R" +
                                                        "FdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgwMDB" +
                                                        "hMTdmLWNlNjUtNDk1NS1iMWYxLTliNWQ4MjA0MjI2NTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICA" +
                                                        "gICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4" +
                                                        "KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDI" +
                                                        "wMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV" +
                                                        "2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICA" +
                                                        "gICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtcE1NOkR" +
                                                        "lcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgPHN0UmVmOmluc3R" +
                                                        "hbmNlSUQ+eG1wLmlpZDowNGRmMjQ5OS1hNTU5LTQxODAtYjYwNS1iNjE5NzFjMTVhMDM8L3N0UmVmOml" +
                                                        "uc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODNhNzkwYWQtYzB" +
                                                        "lZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjpkb2N1bWVudElEPgogICAgICAgICAgICA8c3R" +
                                                        "SZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzE" +
                                                        "xZDc0MDMxPC9zdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZ" +
                                                        "yb20+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG9" +
                                                        "0b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A" +
                                                        "6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICA" +
                                                        "gIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXN" +
                                                        "vbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXN" +
                                                        "vbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29" +
                                                        "sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U" +
                                                        "+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjp" +
                                                        "QaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGV" +
                                                        "sWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1" +
                                                        "ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2t" +
                                                        "ldCBlbmQ9InciPz5hSvvCAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUY" +
                                                        "AAAAlSURBVHjaPMYxAQAwDAMgVkv1VFFRuy9cvN0F7m66JNNhOvwBAPyqCtNeO5K2AAAAAElFTkSuQmC" +
                                                        "C\");color:#fff}#prettydiff.shadow *:focus{outline:0.1em dashed #ff0}#prettydiff" +
                                                        ".shadow a:visited{color:#f93}#prettydiff.shadow a{color:#cf3}#prettydiff.shadow " +
                                                        ".contentarea,#prettydiff.shadow legend,#prettydiff.shadow fieldset select,#prett" +
                                                        "ydiff.shadow .diff td,#prettydiff.shadow .report td,#prettydiff.shadow .data li," +
                                                        "#prettydiff.shadow .diff-right,#prettydiff.shadow fieldset input{background:#333" +
                                                        ";border-color:#666}#prettydiff.shadow select,#prettydiff.shadow input,#prettydif" +
                                                        "f.shadow .diff,#prettydiff.shadow .beautify,#prettydiff.shadow .report,#prettydi" +
                                                        "ff.shadow .beautify h3,#prettydiff.shadow .diff h3,#prettydiff.shadow .beautify " +
                                                        "h4,#prettydiff.shadow .diff h4,#prettydiff.shadow #report,#prettydiff.shadow #re" +
                                                        "port .author,#prettydiff.shadow fieldset{background:#222;border-color:#666}#pret" +
                                                        "tydiff.shadow fieldset fieldset{background:#333}#prettydiff.shadow fieldset fiel" +
                                                        "dset input,#prettydiff.shadow fieldset fieldset select{background:#222}#prettydi" +
                                                        "ff.shadow h2,#prettydiff.shadow h2 button,#prettydiff.shadow h3,#prettydiff.shad" +
                                                        "ow input,#prettydiff.shadow option,#prettydiff.shadow select,#prettydiff.shadow " +
                                                        "legend{color:#ccc}#prettydiff.shadow .contentarea{box-shadow:0 1em 1em #000}#pre" +
                                                        "ttydiff.shadow .segment{background:#222}#prettydiff.shadow h2 button,#prettydiff" +
                                                        ".shadow td,#prettydiff.shadow th,#prettydiff.shadow .segment,#prettydiff.shadow " +
                                                        "ol.segment li{border-color:#666}#prettydiff.shadow .count li.fold{color:#cf3}#pr" +
                                                        "ettydiff.shadow th{background:#000}#prettydiff.shadow h2 button{background:#5858" +
                                                        "58;box-shadow:0.1em 0.1em 0.25em #000}#prettydiff.shadow li h4{color:#ff0}#prett" +
                                                        "ydiff.shadow code{background:#585858;border-color:#585858;color:#ccf}#prettydiff" +
                                                        ".shadow ol.segment h4 strong{color:#f30}#prettydiff.shadow button{background-col" +
                                                        "or:#333;border-color:#666;box-shadow:0 0.25em 0.5em #000;color:#ccc}#prettydiff." +
                                                        "shadow button:hover{background-color:#777;border-color:#aaa;box-shadow:0 0.25em " +
                                                        "0.5em #222;color:#fff}#prettydiff.shadow th{background:#444}#prettydiff.shadow t" +
                                                        "head th,#prettydiff.shadow th.heading{background:#444}#prettydiff.shadow .diff h" +
                                                        "3{background:#000;border-color:#666}#prettydiff.shadow .segment,#prettydiff.shad" +
                                                        "ow .data li,#prettydiff.shadow .diff-right{border-color:#444}#prettydiff.shadow " +
                                                        ".count li{border-color:#333}#prettydiff.shadow .count{background:#555;border-col" +
                                                        "or:#333}#prettydiff.shadow li h4{color:#ff0}#prettydiff.shadow code{background:#" +
                                                        "000;border-color:#000;color:#ddd}#prettydiff.shadow ol.segment h4 strong{color:#" +
                                                        "c00}#prettydiff.shadow .data .delete{background:#300}#prettydiff.shadow .data .d" +
                                                        "elete em{background:#200;border-color:#c63;color:#c66}#prettydiff.shadow .data ." +
                                                        "insert{background:#030}#prettydiff.shadow .data .insert em{background:#010;borde" +
                                                        "r-color:#090;color:#6c0}#prettydiff.shadow .data .replace{background:#345}#prett" +
                                                        "ydiff.shadow .data .replace em{background:#023;border-color:#09c;color:#7cf}#pre" +
                                                        "ttydiff.shadow .data .empty{background:#111}#prettydiff.shadow .diff .author{bor" +
                                                        "der-color:#666}#prettydiff.shadow .data em.s0{color:#fff}#prettydiff.shadow .dat" +
                                                        "a em.s1{color:#d60}#prettydiff.shadow .data em.s2{color:#aaf}#prettydiff.shadow " +
                                                        ".data em.s3{color:#0c0}#prettydiff.shadow .data em.s4{color:#f6f}#prettydiff.sha" +
                                                        "dow .data em.s5{color:#0cc}#prettydiff.shadow .data em.s6{color:#dc3}#prettydiff" +
                                                        ".shadow .data em.s7{color:#a7a}#prettydiff.shadow .data em.s8{color:#7a7}#pretty" +
                                                        "diff.shadow .data em.s9{color:#ff6}#prettydiff.shadow .data em.s10{color:#33f}#p" +
                                                        "rettydiff.shadow .data em.s11{color:#933}#prettydiff.shadow .data em.s12{color:#" +
                                                        "990}#prettydiff.shadow .data em.s13{color:#987}#prettydiff.shadow .data em.s14{c" +
                                                        "olor:#fc3}#prettydiff.shadow .data em.s15{color:#897}#prettydiff.shadow .data em" +
                                                        ".s16{color:#f30}#prettydiff.shadow .data .l0{background:#333}#prettydiff.shadow " +
                                                        ".data .l1{background:#633}#prettydiff.shadow .data .l2{background:#335}#prettydi" +
                                                        "ff.shadow .data .l3{background:#353}#prettydiff.shadow .data .l4{background:#636" +
                                                        "}#prettydiff.shadow .data .l5{background:#366}#prettydiff.shadow .data .l6{backg" +
                                                        "round:#640}#prettydiff.shadow .data .l7{background:#303}#prettydiff.shadow .data" +
                                                        " .l8{background:#030}#prettydiff.shadow .data .l9{background:#660}#prettydiff.sh" +
                                                        "adow .data .l10{background:#003}#prettydiff.shadow .data .l11{background:#300}#p" +
                                                        "rettydiff.shadow .data .l12{background:#553}#prettydiff.shadow .data .l13{backgr" +
                                                        "ound:#432}#prettydiff.shadow .data .l14{background:#640}#prettydiff.shadow .data" +
                                                        " .l15{background:#562}#prettydiff.shadow .data .l16{background:#600}#prettydiff." +
                                                        "shadow .data .c0{background:inherit}#prettydiff.white{background:#f8f8f8 url(\"d" +
                                                        "ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4" +
                                                        "jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEt" +
                                                        "vUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a" +
                                                        "89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsA" +
                                                        "HvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFA" +
                                                        "tAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMD" +
                                                        "OEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkk" +
                                                        "XKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF" +
                                                        "0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5" +
                                                        "nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5" +
                                                        "EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c9" +
                                                        "3/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmS" +
                                                        "AHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjgg" +
                                                        "XmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag" +
                                                        "3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhq" +
                                                        "wVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjI" +
                                                        "xh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIX" +
                                                        "kneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR" +
                                                        "1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+" +
                                                        "YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1P" +
                                                        "jqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTX" +
                                                        "EJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVx" +
                                                        "rqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6Ubobt" +
                                                        "Ed79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6V" +
                                                        "hlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0" +
                                                        "x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZ" +
                                                        "nw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpz" +
                                                        "uP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vW" +
                                                        "dm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V" +
                                                        "3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp" +
                                                        "8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVe" +
                                                        "GP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5Liq" +
                                                        "uNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJ" +
                                                        "nIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqo" +
                                                        "hTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cy" +
                                                        "zytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1" +
                                                        "rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qav" +
                                                        "EuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPR" +
                                                        "U+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwP" +
                                                        "SA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x9" +
                                                        "2HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GD" +
                                                        "borZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7n" +
                                                        "uer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3Yf" +
                                                        "VP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/su" +
                                                        "uFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j" +
                                                        "5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADo2aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQ" +
                                                        "gYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5" +
                                                        "zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY" +
                                                        "3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR" +
                                                        "0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3J" +
                                                        "pcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmN" +
                                                        "vbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGF" +
                                                        "wLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8" +
                                                        "xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5" +
                                                        "vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnM" +
                                                        "uYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnM" +
                                                        "uYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2J" +
                                                        "lLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCB" +
                                                        "DQyAyMDE0IChNYWNpbnRvc2gpPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF" +
                                                        "0ZT4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDp" +
                                                        "NZXRhZGF0YURhdGU+MjAxNi0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICA" +
                                                        "gICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3htcDpNb2RpZnl" +
                                                        "EYXRlPgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOmQ1M2M3ODQzLWE1ZjItNDg0Ny0" +
                                                        "4YzQzLTZlMmMwYTQ2OGJlYjwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW5" +
                                                        "0SUQ+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjFjMzc2MTgxLWY5ZTgtMTE3OC05YTljLWQ4MjVkZmIwYTQ" +
                                                        "3MDwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXA" +
                                                        "uZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwveG1wTU06T3JpZ2luYWxEb2N" +
                                                        "1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICA" +
                                                        "gICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICA" +
                                                        "gICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN" +
                                                        "0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE" +
                                                        "8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJ" +
                                                        "UMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2F" +
                                                        "yZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUF" +
                                                        "nZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGF" +
                                                        "yc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N" +
                                                        "0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpkNTN" +
                                                        "jNzg0My1hNWYyLTQ4NDctOGM0My02ZTJjMGE0NjhiZWI8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICA" +
                                                        "gICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4" +
                                                        "+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyA" +
                                                        "yMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3R" +
                                                        "FdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICA" +
                                                        "gICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3J" +
                                                        "tYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3B" +
                                                        "ob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzY" +
                                                        "xOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE" +
                                                        "8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA" +
                                                        "8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA" +
                                                        "8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmV" +
                                                        "zb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgo" +
                                                        "gICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICA" +
                                                        "gICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9" +
                                                        "yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5cKgaXAAAAIGN" +
                                                        "IUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAkSURBVHjaPMahAQAwDMCg7P+" +
                                                        "/KnsPcq4oHqpqdwNmBt3QDX8AeAUmcrZLnM4AAAAASUVORK5CYII=\")}#prettydiff.white *:foc" +
                                                        "us{outline:0.1em dashed #06f}#prettydiff.white .contentarea,#prettydiff.white le" +
                                                        "gend,#prettydiff.white fieldset select,#prettydiff.white .diff td,#prettydiff.wh" +
                                                        "ite .report td,#prettydiff.white .data li,#prettydiff.white .diff-right,#prettyd" +
                                                        "iff.white fieldset input{background:#fff;border-color:#999}#prettydiff.white sel" +
                                                        "ect,#prettydiff.white input,#prettydiff.white .diff,#prettydiff.white .beautify," +
                                                        "#prettydiff.white .report,#prettydiff.white .beautify h3,#prettydiff.white .diff" +
                                                        " h3,#prettydiff.white .beautify h4,#prettydiff.white .diff h4,#prettydiff.white " +
                                                        "#pdsamples li div,#prettydiff.white #report,#prettydiff.white .author,#prettydif" +
                                                        "f.white #report .author,#prettydiff.white fieldset{background:#eee;border-color:" +
                                                        "#999}#prettydiff.white .diff h3{background:#ddd;border-color:#999}#prettydiff.wh" +
                                                        "ite fieldset fieldset{background:#ddd}#prettydiff.white .contentarea{box-shadow:" +
                                                        "0 1em 1em #999}#prettydiff.white button{background-color:#eee;border-color:#999;" +
                                                        "box-shadow:0 0.25em 0.5em #ccc;color:#666}#prettydiff.white button:hover{backgro" +
                                                        "und-color:#def;border-color:#03c;box-shadow:0 0.25em 0.5em #ccf;color:#03c}#pret" +
                                                        "tydiff.white h2,#prettydiff.white h2 button,#prettydiff.white h3{color:#b00}#pre" +
                                                        "ttydiff.white th{background:#eee;color:#333}#prettydiff.white thead th{backgroun" +
                                                        "d:#eef}#prettydiff.white .report strong{color:#009}#prettydiff.white .report em{" +
                                                        "color:#080}#prettydiff.white h2 button,#prettydiff.white td,#prettydiff.white th" +
                                                        ",#prettydiff.white .segment,#prettydiff.white .count li,#prettydiff.white .diff-" +
                                                        "right #prettydiff.white ol.segment li{border-color:#ccc}#prettydiff.white .data " +
                                                        "li{border-color:#ccc}#prettydiff.white .count li.fold{color:#900}#prettydiff.whi" +
                                                        "te .count{background:#eed;border-color:#999}#prettydiff.white h2 button{backgrou" +
                                                        "nd:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettydiff.white li h4{color:#00f" +
                                                        "}#prettydiff.white code{background:#eee;border-color:#eee;color:#009}#prettydiff" +
                                                        ".white ol.segment h4 strong{color:#c00}#prettydiff.white .data .delete{backgroun" +
                                                        "d:#ffd8d8}#prettydiff.white .data .delete em{background:#fff8f8;border-color:#c4" +
                                                        "4;color:#900}#prettydiff.white .data .insert{background:#d8ffd8}#prettydiff.whit" +
                                                        "e .data .insert em{background:#f8fff8;border-color:#090;color:#363}#prettydiff.w" +
                                                        "hite .data .replace{background:#fec}#prettydiff.white .data .replace em{backgrou" +
                                                        "nd:#ffe;border-color:#a86;color:#852}#prettydiff.white .data .empty{background:#" +
                                                        "ddd}#prettydiff.white .data em.s0{color:#000}#prettydiff.white .data em.s1{color" +
                                                        ":#f66}#prettydiff.white .data em.s2{color:#12f}#prettydiff.white .data em.s3{col" +
                                                        "or:#090}#prettydiff.white .data em.s4{color:#d6d}#prettydiff.white .data em.s5{c" +
                                                        "olor:#7cc}#prettydiff.white .data em.s6{color:#c85}#prettydiff.white .data em.s7" +
                                                        "{color:#737}#prettydiff.white .data em.s8{color:#6d0}#prettydiff.white .data em." +
                                                        "s9{color:#dd0}#prettydiff.white .data em.s10{color:#893}#prettydiff.white .data " +
                                                        "em.s11{color:#b97}#prettydiff.white .data em.s12{color:#bbb}#prettydiff.white .d" +
                                                        "ata em.s13{color:#cc3}#prettydiff.white .data em.s14{color:#333}#prettydiff.whit" +
                                                        "e .data em.s15{color:#9d9}#prettydiff.white .data em.s16{color:#880}#prettydiff." +
                                                        "white .data .l0{background:#fff}#prettydiff.white .data .l1{background:#fed}#pre" +
                                                        "ttydiff.white .data .l2{background:#def}#prettydiff.white .data .l3{background:#" +
                                                        "efe}#prettydiff.white .data .l4{background:#fef}#prettydiff.white .data .l5{back" +
                                                        "ground:#eef}#prettydiff.white .data .l6{background:#fff8cc}#prettydiff.white .da" +
                                                        "ta .l7{background:#ede}#prettydiff.white .data .l8{background:#efc}#prettydiff.w" +
                                                        "hite .data .l9{background:#ffd}#prettydiff.white .data .l10{background:#edc}#pre" +
                                                        "ttydiff.white .data .l11{background:#fdb}#prettydiff.white .data .l12{background" +
                                                        ":#f8f8f8}#prettydiff.white .data .l13{background:#ffb}#prettydiff.white .data .l" +
                                                        "14{background:#eec}#prettydiff.white .data .l15{background:#cfc}#prettydiff.whit" +
                                                        "e .data .l16{background:#eea}#prettydiff.white .data .c0{background:inherit}#pre" +
                                                        "ttydiff.white #report p em{color:#080}#prettydiff.white #report p strong{color:#" +
                                                        "009}#prettydiff #report.contentarea{font-family:\"Lucida Sans Unicode\",\"Helvet" +
                                                        "ica\",\"Arial\",sans-serif;max-width:none;overflow:scroll}#prettydiff .diff .rep" +
                                                        "lace em,#prettydiff .diff .delete em,#prettydiff .diff .insert em{border-style:s" +
                                                        "olid;border-width:0.1em}#prettydiff #report dd,#prettydiff #report dt,#prettydif" +
                                                        "f #report p,#prettydiff #report li,#prettydiff #report td,#prettydiff #report bl" +
                                                        "ockquote,#prettydiff #report th{font-family:\"Lucida Sans Unicode\",\"Helvetica" +
                                                        "\",\"Arial\",sans-serif;font-size:1.2em}#prettydiff div#webtool{background:trans" +
                                                        "parent;font-size:inherit;margin:0;padding:0}#prettydiff #jserror span{display:bl" +
                                                        "ock}#prettydiff #a11y{background:transparent;padding:0}#prettydiff #a11y div{mar" +
                                                        "gin:0.5em 0;border-style:solid;border-width:0.1em}#prettydiff #a11y h4{margin:0." +
                                                        "25em 0}#prettydiff #a11y ol{border-style:solid;border-width:0.1em}#prettydiff #c" +
                                                        "ssreport.doc table{clear:none;float:left;margin-left:1em}#prettydiff #css-size{l" +
                                                        "eft:24em}#prettydiff #css-uri{left:40em}#prettydiff #css-uri td{text-align:left}" +
                                                        "#prettydiff .report .analysis th{text-align:left}#prettydiff .report .analysis ." +
                                                        "parseData td{font-family:\"Courier New\",Courier,\"Lucida Console\",monospace;te" +
                                                        "xt-align:left;white-space:pre}#prettydiff .report .analysis td{text-align:right}" +
                                                        "#prettydiff .analysis{float:left;margin:0 1em 1em 0}#prettydiff .analysis td,#pr" +
                                                        "ettydiff .analysis th{padding:0.5em}#prettydiff #statreport div{border-style:non" +
                                                        "e}#prettydiff .diff,#prettydiff .beautify{border-style:solid;border-width:0.1em;" +
                                                        "display:inline-block;margin:0 1em 1em 0;position:relative}#prettydiff .diff,#pre" +
                                                        "ttydiff .diff li #prettydiff .diff h3,#prettydiff .diff h4,#prettydiff .beautify" +
                                                        ",#prettydiff .beautify li,#prettydiff .beautify h3,#prettydiff .beautify h4{font" +
                                                        "-family:\"Courier New\",Courier,\"Lucida Console\",monospace}#prettydiff .diff l" +
                                                        "i,#prettydiff .beautify li,#prettydiff .diff h3,#prettydiff .diff h4,#prettydiff" +
                                                        " .beautify h3,#prettydiff .beautify h4{border-style:none none solid none;border-" +
                                                        "width:0 0 0.1em 0;box-shadow:none;display:block;font-size:1.2em;margin:0 0 0 -.1" +
                                                        "em;padding:0.2em 2em;text-align:left}#prettydiff .diff .skip{border-style:none n" +
                                                        "one solid;border-width:0 0 0.1em}#prettydiff .diff .diff-left{border-style:none;" +
                                                        "display:table-cell}#prettydiff .diff .diff-right{border-style:none none none sol" +
                                                        "id;border-width:0 0 0 0.1em;display:table-cell;margin-left:-.1em;min-width:16.5e" +
                                                        "m;right:0;top:0}#prettydiff .diff .data li,#prettydiff .beautify .data li{min-wi" +
                                                        "dth:16.5em;padding:0.5em}#prettydiff .diff li,#prettydiff .diff p,#prettydiff .d" +
                                                        "iff h3,#prettydiff .beautify li,#prettydiff .beautify p,#prettydiff .beautify h3" +
                                                        "{font-size:1.2em}#prettydiff .diff li em,#prettydiff .beautify li em{font-style:" +
                                                        "normal;font-weight:bold;margin:-0.5em -0.09em}#prettydiff .diff p.author{border-" +
                                                        "style:solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4e" +
                                                        "m;text-align:right}#prettydiff .difflabel{display:block;height:0}#prettydiff .co" +
                                                        "unt{border-style:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;tex" +
                                                        "t-align:right}#prettydiff .count li{padding:0.5em 1em;text-align:right}#prettydi" +
                                                        "ff .count li.fold{cursor:pointer;font-weight:bold;padding-left:0.5em}#prettydiff" +
                                                        " .data{text-align:left;white-space:pre}#prettydiff .beautify .data em{display:in" +
                                                        "line-block;font-style:normal;font-weight:bold}#prettydiff .beautify li,#prettydi" +
                                                        "ff .diff li{border-style:none none solid;border-width:0 0 0.1em;display:block;he" +
                                                        "ight:1em;line-height:1.2;list-style-type:none;margin:0;white-space:pre}#prettydi" +
                                                        "ff .beautify ol,#prettydiff .diff ol{display:table-cell;margin:0;padding:0}#pret" +
                                                        "tydiff .beautify em.l0,#prettydiff .beautify em.l1,#prettydiff .beautify em.l2,#" +
                                                        "prettydiff .beautify em.l3,#prettydiff .beautify em.l4,#prettydiff .beautify em." +
                                                        "l5,#prettydiff .beautify em.l6,#prettydiff .beautify em.l7,#prettydiff .beautify" +
                                                        " em.l8,#prettydiff .beautify em.l9,#prettydiff .beautify em.l10,#prettydiff .bea" +
                                                        "utify em.l11,#prettydiff .beautify em.l12,#prettydiff .beautify em.l13,#prettydi" +
                                                        "ff .beautify em.l14,#prettydiff .beautify em.l15,#prettydiff .beautify em.l16{he" +
                                                        "ight:2.2em;margin:0 0 -1em;position:relative;top:-0.5em}#prettydiff .beautify em" +
                                                        ".l0{margin-left:-0.5em;padding-left:0.5em}#prettydiff #report .beautify,#prettyd" +
                                                        "iff #report .beautify li,#prettydiff #report .diff,#prettydiff #report .diff li{" +
                                                        "font-family:\"Courier New\",Courier,\"Lucida Console\",monospace}#prettydiff #re" +
                                                        "port .beautify{border-style:solid}#prettydiff #report .diff h3,#prettydiff #repo" +
                                                        "rt .beautify h3{margin:0}#prettydiff{text-align:center;font-size:10px;overflow-y" +
                                                        ":scroll}#prettydiff .contentarea{border-style:solid;border-width:0.1em;font-fami" +
                                                        "ly:\"Century Gothic\",\"Trebuchet MS\";margin:0 auto;max-width:93em;padding:1em;" +
                                                        "text-align:left}#prettydiff dd,#prettydiff dt,#prettydiff p,#prettydiff li,#pret" +
                                                        "tydiff td,#prettydiff blockquote,#prettydiff th{clear:both;font-family:\"Palatin" +
                                                        "o Linotype\",\"Book Antiqua\",Palatino,serif;font-size:1.6em;line-height:1.6em;t" +
                                                        "ext-align:left}#prettydiff blockquote{font-style:italic}#prettydiff dt{font-size" +
                                                        ":1.4em;font-weight:bold;line-height:inherit}#prettydiff li li,#prettydiff li p{f" +
                                                        "ont-size:1em}#prettydiff th,#prettydiff td{border-style:solid;border-width:0.1em" +
                                                        ";padding:0.1em 0.2em}#prettydiff td span{display:block}#prettydiff code,#prettyd" +
                                                        "iff textarea{font-family:\"Courier New\",Courier,\"Lucida Console\",monospace}#p" +
                                                        "rettydiff code,#prettydiff textarea{display:block;font-size:0.8em;width:100%}#pr" +
                                                        "ettydiff code span{display:block;white-space:pre}#prettydiff code{border-style:s" +
                                                        "olid;border-width:0.2em;line-height:1em}#prettydiff textarea{line-height:1.4em}#" +
                                                        "prettydiff label{display:inline;font-size:1.4em}#prettydiff legend{border-radius" +
                                                        ":1em;border-style:solid;border-width:0.1em;font-size:1.4em;font-weight:bold;marg" +
                                                        "in-left:-0.25em;padding:0 0.5em}#prettydiff fieldset fieldset legend{font-size:1" +
                                                        ".2em}#prettydiff table{border-collapse:collapse}#prettydiff div.report{border-st" +
                                                        "yle:none}#prettydiff h2,#prettydiff h3,#prettydiff h4{clear:both}#prettydiff tab" +
                                                        "le{margin:0 0 1em}#prettydiff .analysis .bad,#prettydiff .analysis .good{font-we" +
                                                        "ight:bold}#prettydiff h1{font-size:3em;font-weight:normal;margin-top:0}#prettydi" +
                                                        "ff h1 span{font-size:0.5em}#prettydiff h1 svg{border-style:solid;border-width:0." +
                                                        "05em;float:left;height:1.5em;margin-right:0.5em;width:1.5em}#prettydiff h2{borde" +
                                                        "r-style:none;background:transparent;font-size:1em;box-shadow:none;margin:0}#pret" +
                                                        "tydiff h2 button{background:transparent;border-style:solid;cursor:pointer;displa" +
                                                        "y:block;font-size:2.5em;font-weight:normal;text-align:left;width:100%;border-wid" +
                                                        "th:0.05em;font-weight:normal;margin:1em 0 0;padding:0.1em}#prettydiff h2 span{di" +
                                                        "splay:block;float:right;font-size:0.5em}#prettydiff h3{font-size:2em;margin:0;ba" +
                                                        "ckground:transparent;box-shadow:none;border-style:none}#prettydiff h4{font-size:" +
                                                        "1.6em;font-family:\"Century Gothic\",\"Trebuchet MS\";margin:0}#prettydiff li h4" +
                                                        "{font-size:1em}#prettydiff button,#prettydiff fieldset,#prettydiff div input,#pr" +
                                                        "ettydiff textarea{border-style:solid;border-width:0.1em}#prettydiff section{bord" +
                                                        "er-style:none}#prettydiff h2 button,#prettydiff select,#prettydiff option{font-f" +
                                                        "amily:inherit}#prettydiff select{border-style:inset;border-width:0.1em;width:13." +
                                                        "5em}#prettydiff #dcolorScheme{float:right;margin:-3em 0 0}#prettydiff #dcolorSch" +
                                                        "eme label,#prettydiff #dcolorScheme label{display:inline-block;font-size:1em}#pr" +
                                                        "ettydiff .clear{clear:both;display:block}#prettydiff caption,#prettydiff .conten" +
                                                        "t-hide{height:1em;left:-1000em;overflow:hidden;position:absolute;top:-1000em;wid" +
                                                        "th:1em}/*]]>*/</style></head><body id=\"prettydiff\" class=\"white\"><div class=" +
                                                        "\"contentarea\" id=\"report\"><section role=\"heading\"><h1><svg height=\"2000.0" +
                                                        "00000pt\" id=\"pdlogo\" preserveAspectRatio=\"xMidYMid meet\" version=\"1.0\" vi" +
                                                        "ewBox=\"0 0 2000.000000 2000.000000\" width=\"2000.000000pt\" xmlns=\"http://www" +
                                                        ".w3.org/2000/svg\"><g fill=\"#999\" stroke=\"none\" transform=\"translate(0.0000" +
                                                        "00,2000.000000) scale(0.100000,-0.100000)\"> <path d=\"M14871 18523 c-16 -64 -61" +
                                                        "1 -2317 -946 -3588 -175 -660 -319 -1202 -320 -1204 -2 -2 -50 39 -107 91 -961 876" +
                                                        " -2202 1358 -3498 1358 -1255 0 -2456 -451 -3409 -1279 -161 -140 -424 -408 -560 -" +
                                                        "571 -507 -607 -870 -1320 -1062 -2090 -58 -232 -386 -1479 -2309 -8759 -148 -563 -" +
                                                        "270 -1028 -270 -1033 0 -4 614 -8 1365 -8 l1364 0 10 38 c16 63 611 2316 946 3587 " +
                                                        "175 660 319 1202 320 1204 2 2 50 -39 107 -91 543 -495 1169 -862 1863 -1093 1707 " +
                                                        "-568 3581 -211 4965 946 252 210 554 524 767 796 111 143 312 445 408 613 229 406 " +
                                                        "408 854 525 1320 57 225 380 1451 2310 8759 148 563 270 1028 270 1033 0 4 -614 8 " +
                                                        "-1365 8 l-1364 0 -10 -37z m-4498 -5957 c477 -77 889 -256 1245 -542 523 -419 850 " +
                                                        "-998 954 -1689 18 -121 18 -549 0 -670 -80 -529 -279 -972 -612 -1359 -412 -480 -9" +
                                                        "67 -779 -1625 -878 -121 -18 -549 -18 -670 0 -494 74 -918 255 -1283 548 -523 419 " +
                                                        "-850 998 -954 1689 -18 121 -18 549 0 670 104 691 431 1270 954 1689 365 293 828 4" +
                                                        "90 1283 545 50 6 104 13 120 15 72 10 495 -3 588 -18z\"/></g></svg><a href=\"pret" +
                                                        "tydiff.com.xhtml\">Pretty Diff</a></h1><p id=\"dcolorScheme\"><label class=\"lab" +
                                                        "el\" for=\"colorScheme\">Color Scheme</label><select id=\"colorScheme\"><option>" +
                                                        "Canvas</option><option>Shadow</option><option selected=\"selected\">White</optio" +
                                                        "n></select></p><p>Find <a href=\"https://github.com/prettydiff/prettydiff\">Pret" +
                                                        "ty Diff on GitHub</a>.</p></section><section role=\"main\"><p><strong>Number of " +
                                                        "differences:</strong> <em>1</em> differences from <em>1</em> line of code.</p><d" +
                                                        "iv class='diff'><div class='diff-left'><h3 class='texttitle'>Source Sample</h3><" +
                                                        "ol class='count'><li class=\"fold\" title=\"folds from line 1 to line 2\">- 1</l" +
                                                        "i><li>2</li><li class=\"fold\" title=\"folds from line 3 to line 3\">- 3</li><li" +
                                                        " class=\"fold\" title=\"folds from line 4 to line 5\">- 4</li><li>5</li></ol><ol" +
                                                        " class=\"data\" data-prettydiff-ignore=\"true\"><li class=\"equal\">&lt;a&gt;&#1" +
                                                        "0;</li><li class=\"equal\">    &lt;b&gt;&#10;</li><li class=\"replace\">        " +
                                                        "&lt;<em>c</em>/&gt;&#10;</li><li class=\"equal\">    &lt;/b&gt;&#10;</li><li cla" +
                                                        "ss=\"equal\">&lt;/a&gt;&#10;</li></ol></div><div class='diff-right'><h3 class='t" +
                                                        "exttitle'>New Sample</h3><ol class='count' style='cursor:w-resize'><li>1</li><li" +
                                                        ">2</li><li>3</li><li>4</li><li>5</li></ol><ol class=\"data\" data-prettydiff-ign" +
                                                        "ore=\"true\"><li class=\"equal\">&lt;a&gt;&#10;</li><li class=\"equal\">    &lt;" +
                                                        "b&gt;&#10;</li><li class=\"replace\">        &lt;<em>d</em>/&gt;&#10;</li><li cl" +
                                                        "ass=\"equal\">    &lt;/b&gt;&#10;</li><li class=\"equal\">&lt;/a&gt;&#10;</li></" +
                                                        "ol></div><p class=\"author\">Diff view written by <a href=\"http://prettydiff.co" +
                                                        "m/\">Pretty Diff</a>.</p></div></section></div><script type=\"application/javasc" +
                                                        "ript\">//<![CDATA[\r\nvar pd={};pd.colorchange=function(){\"use strict\";var opt" +
                                                        "ions=this.getElementsByTagName(\"option\");document.getElementsByTagName(\"body" +
                                                        "\")[0].setAttribute(\"class\",options[this.selectedIndex].innerHTML.toLowerCase(" +
                                                        "))};pd.difffold=function dom__difffold(){\"use strict\";var a=0,b=0,self=this,ti" +
                                                        "tle=self.getAttribute(\"title\").split(\"line \"),min=Number(title[1].substr(0,t" +
                                                        "itle[1].indexOf(\" \"))),max=Number(title[2]),inner=self.innerHTML,lists=[],pare" +
                                                        "nt=self.parentNode.parentNode,listnodes=(parent.getAttribute(\"class\")===\"diff" +
                                                        "\")?parent.getElementsByTagName(\"ol\"):parent.parentNode.getElementsByTagName(" +
                                                        "\"ol\"),listLen=listnodes.length;for(a=0;a<listLen;a+=1){lists.push(listnodes[a]" +
                                                        ".getElementsByTagName(\"li\"))}max=(max>=lists[0].length)?lists[0].length:max;if" +
                                                        "(inner.charAt(0)===\"-\"){self.innerHTML=\"+\"+inner.substr(1);for(a=min;a<max;a" +
                                                        "+=1){for(b=0;b<listLen;b+=1){lists[b][a].style.display=\"none\"}}}else{self.inne" +
                                                        "rHTML=\"-\"+inner.substr(1);for(a=min;a<max;a+=1){for(b=0;b<listLen;b+=1){lists[" +
                                                        "b][a].style.display=\"block\"}}}};pd.colSliderGrab=function(e){\"use strict\";va" +
                                                        "r event=e||window.event,touch=(e!==null&&e.type===\"touchstart\"),node=this,diff" +
                                                        "Right=node.parentNode,diff=diffRight.parentNode,subOffset=0,lists=diff.getElemen" +
                                                        "tsByTagName(\"ol\"),counter=lists[0].clientWidth,data=lists[1].clientWidth,width" +
                                                        "=lists[2].parentNode.clientWidth,total=lists[2].parentNode.parentNode.clientWidt" +
                                                        "h,offset=lists[2].parentNode.offsetLeft-lists[2].parentNode.parentNode.offsetLef" +
                                                        "t,min=((total-counter-data-2)-width),max=(total-width-counter),status=\"ew\",min" +
                                                        "Adjust=min+15,maxAdjust=max-15,withinRange=false,diffLeft=diffRight.previousSibl" +
                                                        "ing,drop=function dom__event_colSliderGrab_drop(f){f=f||window.event;f.preventDe" +
                                                        "fault();node.style.cursor=status+\"-resize\";if(touch===true){document.ontouchmo" +
                                                        "ve=null;document.ontouchend=null}else{document.onmousemove=null;document.onmouse" +
                                                        "up=null}},boxmove=function dom__event_colSliderGrab_boxmove(f){f=f||window.event" +
                                                        ";f.preventDefault();if(touch===true){subOffset=offset-f.touches[0].clientX}else{" +
                                                        "subOffset=offset-f.clientX}if(subOffset>minAdjust&&subOffset<maxAdjust){withinRa" +
                                                        "nge=true}if(withinRange===true&&subOffset>maxAdjust){diffRight.style.width=((tot" +
                                                        "al-counter-2)/10)+\"em\";status=\"e\"}else if(withinRange===true&&subOffset<minA" +
                                                        "djust){diffRight.style.width=((total-counter-data-2)/10)+\"em\";status=\"w\"}els" +
                                                        "e if(subOffset<max&&subOffset>min){diffRight.style.width=((width+subOffset)/10)+" +
                                                        "\"em\";status=\"ew\"}if(touch===true){document.ontouchend=drop}else{document.onm" +
                                                        "ouseup=drop}};event.preventDefault();if(typeof pd.data===\"object\"&&pd.data.nod" +
                                                        "e.report.code.box!==null){offset+=pd.data.node.report.code.box.offsetLeft;offset" +
                                                        "-=pd.data.node.report.code.body.scrollLeft}else{subOffset=(document.body.parentN" +
                                                        "ode.scrollLeft>document.body.scrollLeft)?document.body.parentNode.scrollLeft:doc" +
                                                        "ument.body.scrollLeft;offset-=subOffset}offset+=node.clientWidth;node.style.curs" +
                                                        "or=\"ew-resize\";diff.style.width=(total/10)+\"em\";diff.style.display=\"inline-" +
                                                        "block\";if(diffLeft.nodeType!==1){do{diffLeft=diffLeft.previousSibling}while(dif" +
                                                        "fLeft.nodeType!==1)}diffLeft.style.display=\"block\";diffRight.style.width=(diff" +
                                                        "Right.clientWidth/10)+\"em\";diffRight.style.position=\"absolute\";if(touch===tr" +
                                                        "ue){document.ontouchmove=boxmove;document.ontouchstart=false}else{document.onmou" +
                                                        "semove=boxmove;document.onmousedown=null}return false};(function(){\"use strict" +
                                                        "\";var lists=document.getElementById(\"prettydiff\").getElementsByTagName(\"ol\"" +
                                                        "),cells=lists[0].getElementsByTagName(\"li\"),len=cells.length,a=0;for(a=0;a<len" +
                                                        ";a+=1){if(cells[a].getAttribute(\"class\")===\"fold\"){cells[a].onclick=pd.difff" +
                                                        "old}}if(lists.length>3){lists[2].onmousedown=pd.colSliderGrab;lists[2].ontouchst" +
                                                        "art=pd.colSliderGrab}pd.colorscheme=document.getElementById(\"colorScheme\");pd." +
                                                        "colorscheme.onchange=pd.colorchange}());//]]>\r\n</script></body></html>"
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
                                            verify: "\nScreen input with 1 difference\n\n\u001B[36mLine: 3\u001B[39m\n<a>\n    <b>\n" +
                                                    "\u001B[31m        <\u001B[1mc\u001B[22m/>\u001B[39m\n\u001B[32m        <\u001B[" +
                                                    "1md\u001B[22m/>\u001B[39m\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa1.txt\" readmethod:\"filesc" +
                                                        "reen\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Source file is empty",
                                            verify: "Source file at - is \u001B[31mempty\u001B[39m but the diff file is not."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"diff\" diff:\"test/simulation/testa1.txt\"",
                                            name  : "Diff file is empty",
                                            verify: "Diff file at - is \u001B[31mempty\u001B[39m but the source file is not."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"diff\" diff:\"test/simulation/testa1.txt\" diffcli:\"true\"",
                                            name  : "Diff file is empty with diffcli option",
                                            verify: "Diff file at - is \u001B[31mempty\u001B[39m but the source file is not."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"filescr" +
                                                        "een\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Diff file and source file are same file, readmethod filescreen",
                                            verify: ""
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" " +
                                                        "output:\"test/simulation/testaxx.txt\" mode:\"diff\" diff:\"test/simulation/test" +
                                                        "a.txt\"",
                                            name  : "Diff file and source file are same file, readmethod file",
                                            verify: "\nPretty Diff found 0 differences. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file\" " +
                                                        "output:\"test/simulation/testayy.txt\" mode:\"beautify\" endquietly:\"quiet\"",
                                            name  : "option endquietly",
                                            verify: ""
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
                                            verify: "{\"data\":{\"attrs\":[{},{},{},{},{}],\"begin\":[0,0,1,1,0],\"daddy\":[\"root\"," +
                                                        "\"a\",\"b\",\"b\",\"a\"],\"jscom\":[false,false,false,false,false],\"linen\":[1," +
                                                        "1,1,1,1],\"lines\":[0,0,1,1,0],\"presv\":[false,false,false,false,false],\"token" +
                                                        "\":[\"<a>\",\"<b>\",\"<c/>\",\"</b>\",\"</a>\"],\"types\":[\"start\",\"start\"," +
                                                        "\"singleton\",\"end\",\"end\"]},\"definition\":{\"attrs\":\"array - List of attr" +
                                                        "ibutes (if any) for the given token.\",\"begin\":\"number - Index where the pare" +
                                                        "nt element occurs.\",\"daddy\":\"string - Tag name of the parent element. Tokens" +
                                                        " of type 'template_start' are not considered as parent elements.  End tags refle" +
                                                        "ct their matching start tag.\",\"jscom\":\"boolean - Whether the token is a Java" +
                                                        "Script comment if in JSX format.\",\"linen\":\"number - The line number in the o" +
                                                        "riginal source where the token started, which is used for reporting and analysis" +
                                                        ".\",\"lines\":\"number - Whether the token is preceeded any space and/or line br" +
                                                        "eaks in the original code source.\",\"presv\":\"boolean - Whether the token is p" +
                                                        "reserved verbatim as found.  Useful for comments and HTML 'pre' tags.\",\"token" +
                                                        "\":\"string - The parsed code tokens.\",\"types\":\"string - Data types of the t" +
                                                        "okens: cdata, comment, conditional, content, end, ignore, linepreserve, script, " +
                                                        "sgml, singleton, start, template, template_else, template_end, template_start, x" +
                                                        "ml\"}}"
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
                                            check : "node api/node-local.js source:\"test/today.js\" readmdethod:\"filescreen\" mode:" +
                                                        "\"analysis\"",
                                            name  : "Analysis of today.js",
                                            verify: "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><!DOCTYPE html PUBLIC \"-//W3C//DTD X" +
                                                        "HTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\"><html xmlns=\"ht" +
                                                        "tp://www.w3.org/1999/xhtml\" xml:lang=\"en\"><head><title>Pretty Diff - The diff" +
                                                        "erence tool</title><meta name=\"robots\" content=\"index, follow\"/> <meta name=" +
                                                        "\"DC.title\" content=\"Pretty Diff - The difference tool\"/> <link rel=\"canonic" +
                                                        "al\" href=\"http://prettydiff.com/\" type=\"application/xhtml+xml\"/><meta http-" +
                                                        "equiv=\"Content-Type\" content=\"application/xhtml+xml;charset=UTF-8\"/><meta ht" +
                                                        "tp-equiv=\"Content-Style-Type\" content=\"text/css\"/><style type=\"text/css\">/" +
                                                        "*<![CDATA[*/#prettydiff.canvas{background:#986 url(\"data:image/png;base64,iVBOR" +
                                                        "w0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQa" +
                                                        "G90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSogho" +
                                                        "dkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWS" +
                                                        "DNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQ" +
                                                        "plcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVA" +
                                                        "aCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDII" +
                                                        "yN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g8" +
                                                        "8wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoX" +
                                                        "gugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyX" +
                                                        "YFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+" +
                                                        "wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkL" +
                                                        "lTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdN" +
                                                        "MBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRN" +
                                                        "UgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaP" +
                                                        "Yw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd" +
                                                        "0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSi" +
                                                        "UMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U" +
                                                        "+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr" +
                                                        "+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvV" +
                                                        "Vgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHq" +
                                                        "meob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5Q" +
                                                        "zNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedp" +
                                                        "r1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+" +
                                                        "hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGX" +
                                                        "OMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2u" +
                                                        "GVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22f" +
                                                        "WFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLK" +
                                                        "cRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0n" +
                                                        "ymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeW" +
                                                        "V/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj" +
                                                        "4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6R" +
                                                        "JZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvy" +
                                                        "F1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7" +
                                                        "JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lt" +
                                                        "y8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLV" +
                                                        "y0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1" +
                                                        "+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXD" +
                                                        "m4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07" +
                                                        "NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr6" +
                                                        "0cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T" +
                                                        "8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i" +
                                                        "+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1" +
                                                        "tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGh" +
                                                        "YPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/b" +
                                                        "Xyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzL" +
                                                        "dsAAEFdaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1T" +
                                                        "TBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvI" +
                                                        "iB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6N" +
                                                        "TM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5O" +
                                                        "S8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiC" +
                                                        "iAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgI" +
                                                        "CAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgI" +
                                                        "CAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFd" +
                                                        "mVudCMiCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc" +
                                                        "1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL" +
                                                        "2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlL" +
                                                        "mNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlL" +
                                                        "mNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZ" +
                                                        "XhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxN" +
                                                        "CAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxN" +
                                                        "i0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhd" +
                                                        "GFEYXRlPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgI" +
                                                        "Dx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTEzVDEzOjE4OjA3LTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KI" +
                                                        "CAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iY" +
                                                        "jM5NjA0MDVhOWQ8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb" +
                                                        "2JlOmRvY2lkOnBob3Rvc2hvcDoxYzM3NjE4MS1mOWU4LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htc" +
                                                        "E1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2Y" +
                                                        "jI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJR" +
                                                        "D4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgI" +
                                                        "CAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0R" +
                                                        "XZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppb" +
                                                        "nN0YW5jZUlEPnhtcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2d" +
                                                        "DppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0O" +
                                                        "jM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2Vud" +
                                                        "D5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KI" +
                                                        "CAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZ" +
                                                        "T0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY" +
                                                        "3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtY" +
                                                        "TVmMi00ODQ3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgI" +
                                                        "CAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgI" +
                                                        "CAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoT" +
                                                        "WFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoY" +
                                                        "W5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgI" +
                                                        "CAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFd" +
                                                        "nQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhc" +
                                                        "mFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5wa" +
                                                        "G90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgI" +
                                                        "CAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgP" +
                                                        "HN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6a" +
                                                        "W5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFd" +
                                                        "nQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxM" +
                                                        "zoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlb" +
                                                        "nQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+C" +
                                                        "iAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgI" +
                                                        "CAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291c" +
                                                        "mNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5kZXJpdmVkPC9zdEV2dDphY3Rpb24+C" +
                                                        "iAgICAgICAgICAgICAgICAgIDxzdEV2dDpwYXJhbWV0ZXJzPmNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0a" +
                                                        "W9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nPC9zdEV2dDpwYXJhbWV0ZXJzPgogICAgI" +
                                                        "CAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZ" +
                                                        "XNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvb" +
                                                        "j4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyL" +
                                                        "TQ0MGUtYjA5OS1iYjM5NjA0MDVhOWQ8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgI" +
                                                        "DxzdEV2dDp3aGVuPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgI" +
                                                        "CAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpb" +
                                                        "nRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZ" +
                                                        "D4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZ" +
                                                        "GY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvb" +
                                                        "SByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtc" +
                                                        "C5paWQ6ODNhNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjppbnN0YW5jZUlEP" +
                                                        "gogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOjgzYTc5MGFkLWMwZWQtNGIzYS05Z" +
                                                        "DJhLWE5YzQ2MWRmMzVhMTwvc3RSZWY6ZG9jdW1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9yaWdpb" +
                                                        "mFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwvc" +
                                                        "3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8L3htcE1NOkRlcml2ZWRGcm9tPgogICAgI" +
                                                        "CAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvb" +
                                                        "G9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2Zpb" +
                                                        "GU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPc" +
                                                        "mllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4zM" +
                                                        "DAwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4zM" +
                                                        "DAwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pd" +
                                                        "D4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q" +
                                                        "29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjQ8L2V4aWY6UGl4ZWxYRGltZ" +
                                                        "W5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFlEaW1lbnNpb" +
                                                        "24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                        "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                        "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                        "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3I" +
                                                        "j8+bleIyQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAANElEQVR42" +
                                                        "mJ89+4uAwMDAwPD6lkTGd69u/vu3d2ZHXnv3t1lgLPevbvLrCTIEJqWD1EJGADaTRll80WcLAAAAABJR" +
                                                        "U5ErkJggg==\");color:#420}#prettydiff.canvas *:focus{outline:0.1em dashed #f00}#" +
                                                        "prettydiff.canvas a{color:#039}#prettydiff.canvas .contentarea,#prettydiff.canva" +
                                                        "s legend,#prettydiff.canvas fieldset select,#prettydiff.canvas .diff td,#prettyd" +
                                                        "iff.canvas .report td,#prettydiff.canvas .data li,#prettydiff.canvas .diff-right" +
                                                        ",#prettydiff.canvas fieldset input{background:#eeeee8;border-color:#420}#prettyd" +
                                                        "iff.canvas select,#prettydiff.canvas input,#prettydiff.canvas .diff,#prettydiff." +
                                                        "canvas .beautify,#prettydiff.canvas .report,#prettydiff.canvas .beautify h3,#pre" +
                                                        "ttydiff.canvas .diff h3,#prettydiff.canvas .beautify h4,#prettydiff.canvas .diff" +
                                                        " h4,#prettydiff.canvas #report,#prettydiff.canvas #report .author,#prettydiff.ca" +
                                                        "nvas fieldset{background:#ddddd8;border-color:#420}#prettydiff.canvas fieldset f" +
                                                        "ieldset{background:#eeeee8}#prettydiff.canvas fieldset fieldset input,#prettydif" +
                                                        "f.canvas fieldset fieldset select{background:#ddddd8}#prettydiff.canvas h2,#pret" +
                                                        "tydiff.canvas h2 button,#prettydiff.canvas h3,#prettydiff.canvas legend{color:#9" +
                                                        "00}#prettydiff.canvas .contentarea{box-shadow:0 1em 1em #b8a899}#prettydiff.canv" +
                                                        "as .segment{background:#fff}#prettydiff.canvas h2 button,#prettydiff.canvas .seg" +
                                                        "ment,#prettydiff.canvas ol.segment li{border-color:#420}#prettydiff.canvas th{ba" +
                                                        "ckground:#e8ddcc}#prettydiff.canvas li h4{color:#06f}#prettydiff.canvas code{bac" +
                                                        "kground:#eee;border-color:#eee;color:#00f}#prettydiff.canvas ol.segment h4 stron" +
                                                        "g{color:#c00}#prettydiff.canvas button{background-color:#ddddd8;border-color:#42" +
                                                        "0;box-shadow:0 0.25em 0.5em #b8a899;color:#900}#prettydiff.canvas button:hover{b" +
                                                        "ackground-color:#ccb;border-color:#630;box-shadow:0 0.25em 0.5em #b8a899;color:#" +
                                                        "630}#prettydiff.canvas th{background:#ccccc8}#prettydiff.canvas thead th,#pretty" +
                                                        "diff.canvas th.heading{background:#ccb}#prettydiff.canvas .diff h3{background:#d" +
                                                        "dd;border-color:#999}#prettydiff.canvas td,#prettydiff.canvas th,#prettydiff.can" +
                                                        "vas .segment,#prettydiff.canvas .count li,#prettydiff.canvas .data li,#prettydif" +
                                                        "f.canvas .diff-right{border-color:#ccccc8}#prettydiff.canvas .count{background:#" +
                                                        "eed;border-color:#999}#prettydiff.canvas .count li.fold{color:#900}#prettydiff.c" +
                                                        "anvas h2 button{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettydif" +
                                                        "f.canvas li h4{color:#00f}#prettydiff.canvas code{background:#eee;border-color:#" +
                                                        "eee;color:#009}#prettydiff.canvas ol.segment h4 strong{color:#c00}#prettydiff.ca" +
                                                        "nvas .data .delete{background:#ffd8d8}#prettydiff.canvas .data .delete em{backgr" +
                                                        "ound:#fff8f8;border-color:#c44;color:#900}#prettydiff.canvas .data .insert{backg" +
                                                        "round:#d8ffd8}#prettydiff.canvas .data .insert em{background:#f8fff8;border-colo" +
                                                        "r:#090;color:#363}#prettydiff.canvas .data .replace{background:#fec}#prettydiff." +
                                                        "canvas .data .replace em{background:#ffe;border-color:#a86;color:#852}#prettydif" +
                                                        "f.canvas .data .empty{background:#ddd}#prettydiff.canvas .data em.s0{color:#000}" +
                                                        "#prettydiff.canvas .data em.s1{color:#f66}#prettydiff.canvas .data em.s2{color:#" +
                                                        "12f}#prettydiff.canvas .data em.s3{color:#090}#prettydiff.canvas .data em.s4{col" +
                                                        "or:#d6d}#prettydiff.canvas .data em.s5{color:#7cc}#prettydiff.canvas .data em.s6" +
                                                        "{color:#c85}#prettydiff.canvas .data em.s7{color:#737}#prettydiff.canvas .data e" +
                                                        "m.s8{color:#6d0}#prettydiff.canvas .data em.s9{color:#dd0}#prettydiff.canvas .da" +
                                                        "ta em.s10{color:#893}#prettydiff.canvas .data em.s11{color:#b97}#prettydiff.canv" +
                                                        "as .data em.s12{color:#bbb}#prettydiff.canvas .data em.s13{color:#cc3}#prettydif" +
                                                        "f.canvas .data em.s14{color:#333}#prettydiff.canvas .data em.s15{color:#9d9}#pre" +
                                                        "ttydiff.canvas .data em.s16{color:#880}#prettydiff.canvas .data .l0{background:#" +
                                                        "eeeee8}#prettydiff.canvas .data .l1{background:#fed}#prettydiff.canvas .data .l2" +
                                                        "{background:#def}#prettydiff.canvas .data .l3{background:#efe}#prettydiff.canvas" +
                                                        " .data .l4{background:#fef}#prettydiff.canvas .data .l5{background:#eef}#prettyd" +
                                                        "iff.canvas .data .l6{background:#fff8cc}#prettydiff.canvas .data .l7{background:" +
                                                        "#ede}#prettydiff.canvas .data .l8{background:#efc}#prettydiff.canvas .data .l9{b" +
                                                        "ackground:#ffd}#prettydiff.canvas .data .l10{background:#edc}#prettydiff.canvas " +
                                                        ".data .l11{background:#fdb}#prettydiff.canvas .data .l12{background:#f8f8f8}#pre" +
                                                        "ttydiff.canvas .data .l13{background:#ffb}#prettydiff.canvas .data .l14{backgrou" +
                                                        "nd:#eec}#prettydiff.canvas .data .l15{background:#cfc}#prettydiff.canvas .data ." +
                                                        "l16{background:#eea}#prettydiff.canvas .data .c0{background:inherit}#prettydiff." +
                                                        "canvas #report p em{color:#060}#prettydiff.canvas #report p strong{color:#009}#p" +
                                                        "rettydiff.shadow{background:#333 url(\"data:image/png;base64,iVBORw0KGgoAAAANSUh" +
                                                        "EUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUN" +
                                                        "DIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8i" +
                                                        "giAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeC" +
                                                        "Dx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kTh" +
                                                        "LCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg" +
                                                        "7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc" +
                                                        "88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P" +
                                                        "9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLU" +
                                                        "AoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKU" +
                                                        "cz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXu" +
                                                        "RLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKC" +
                                                        "BKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW" +
                                                        "4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI" +
                                                        "9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8" +
                                                        "+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7" +
                                                        "YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFT" +
                                                        "SEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU" +
                                                        "05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9B" +
                                                        "X0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpV" +
                                                        "KlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/Yk" +
                                                        "GWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8" +
                                                        "H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0o" +
                                                        "nXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/V" +
                                                        "HDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgY" +
                                                        "mISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrx" +
                                                        "uhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6" +
                                                        "TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e" +
                                                        "5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+B" +
                                                        "R5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8N" +
                                                        "vnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOy" +
                                                        "QrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1" +
                                                        "KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxa" +
                                                        "pLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW" +
                                                        "5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAV" +
                                                        "ZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjx" +
                                                        "xedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1Yfq" +
                                                        "GnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO3" +
                                                        "19kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7Jvtt" +
                                                        "VAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0" +
                                                        "NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9s" +
                                                        "fD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPK" +
                                                        "y2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/f" +
                                                        "F9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+" +
                                                        "Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28b" +
                                                        "Cxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEQFaVRYdFh" +
                                                        "NTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJ" +
                                                        "lU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJ" +
                                                        "BZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICA" +
                                                        "gICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGY" +
                                                        "tc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICA" +
                                                        "gIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM" +
                                                        "6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN" +
                                                        "0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICA" +
                                                        "gICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3V" +
                                                        "yY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzE" +
                                                        "uMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3N" +
                                                        "ob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzE" +
                                                        "uMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4" +
                                                        "KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3N" +
                                                        "oKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjo" +
                                                        "yNDozOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTY" +
                                                        "tMDEtMTNUMTU6MTE6MzMtMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ" +
                                                        "5RGF0ZT4yMDE2LTAxLTEzVDE1OjExOjMzLTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHh" +
                                                        "tcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo4MDAwYTE3Zi1jZTY1LTQ5NTUtYjFmMS05YjVkODIwNDIyNjU" +
                                                        "8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnB" +
                                                        "ob3Rvc2hvcDoxZmZhNDk1Yy1mYTU2LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW5" +
                                                        "0SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZjA" +
                                                        "3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICA" +
                                                        "gPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmx" +
                                                        "pIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5" +
                                                        "jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnh" +
                                                        "tcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZUl" +
                                                        "EPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9" +
                                                        "zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG9" +
                                                        "0b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICA" +
                                                        "gICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2U" +
                                                        "iPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICA" +
                                                        "gICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LTh" +
                                                        "jNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ" +
                                                        "6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICA" +
                                                        "gICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTw" +
                                                        "vc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3R" +
                                                        "FdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGk" +
                                                        "gcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmR" +
                                                        "lcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29" +
                                                        "udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3N" +
                                                        "0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmR" +
                                                        "mOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGl" +
                                                        "vbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD5" +
                                                        "4bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2V" +
                                                        "JRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMDw" +
                                                        "vc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGh" +
                                                        "vdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICA" +
                                                        "gICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmR" +
                                                        "mOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICA" +
                                                        "gICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICA" +
                                                        "gICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjA0ZGYyNDk5LWE1NTktNDE4MC1iNjA1LWI2MTk" +
                                                        "3MWMxNWEwMzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjA" +
                                                        "xNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ" +
                                                        "0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnN" +
                                                        "vZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5" +
                                                        "nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJ" +
                                                        "zZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZWQ" +
                                                        "8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcHB" +
                                                        "saWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz4" +
                                                        "KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHl" +
                                                        "wZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ" +
                                                        "0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20" +
                                                        "gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZXR" +
                                                        "lcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJ" +
                                                        "zZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3R" +
                                                        "FdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgwMDB" +
                                                        "hMTdmLWNlNjUtNDk1NS1iMWYxLTliNWQ4MjA0MjI2NTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICA" +
                                                        "gICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4" +
                                                        "KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDI" +
                                                        "wMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV" +
                                                        "2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICA" +
                                                        "gICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtcE1NOkR" +
                                                        "lcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgPHN0UmVmOmluc3R" +
                                                        "hbmNlSUQ+eG1wLmlpZDowNGRmMjQ5OS1hNTU5LTQxODAtYjYwNS1iNjE5NzFjMTVhMDM8L3N0UmVmOml" +
                                                        "uc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODNhNzkwYWQtYzB" +
                                                        "lZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjpkb2N1bWVudElEPgogICAgICAgICAgICA8c3R" +
                                                        "SZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzE" +
                                                        "xZDc0MDMxPC9zdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZ" +
                                                        "yb20+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG9" +
                                                        "0b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A" +
                                                        "6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICA" +
                                                        "gIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXN" +
                                                        "vbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXN" +
                                                        "vbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29" +
                                                        "sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U" +
                                                        "+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjp" +
                                                        "QaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGV" +
                                                        "sWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1" +
                                                        "ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2t" +
                                                        "ldCBlbmQ9InciPz5hSvvCAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUY" +
                                                        "AAAAlSURBVHjaPMYxAQAwDAMgVkv1VFFRuy9cvN0F7m66JNNhOvwBAPyqCtNeO5K2AAAAAElFTkSuQmC" +
                                                        "C\");color:#fff}#prettydiff.shadow *:focus{outline:0.1em dashed #ff0}#prettydiff" +
                                                        ".shadow a:visited{color:#f93}#prettydiff.shadow a{color:#cf3}#prettydiff.shadow " +
                                                        ".contentarea,#prettydiff.shadow legend,#prettydiff.shadow fieldset select,#prett" +
                                                        "ydiff.shadow .diff td,#prettydiff.shadow .report td,#prettydiff.shadow .data li," +
                                                        "#prettydiff.shadow .diff-right,#prettydiff.shadow fieldset input{background:#333" +
                                                        ";border-color:#666}#prettydiff.shadow select,#prettydiff.shadow input,#prettydif" +
                                                        "f.shadow .diff,#prettydiff.shadow .beautify,#prettydiff.shadow .report,#prettydi" +
                                                        "ff.shadow .beautify h3,#prettydiff.shadow .diff h3,#prettydiff.shadow .beautify " +
                                                        "h4,#prettydiff.shadow .diff h4,#prettydiff.shadow #report,#prettydiff.shadow #re" +
                                                        "port .author,#prettydiff.shadow fieldset{background:#222;border-color:#666}#pret" +
                                                        "tydiff.shadow fieldset fieldset{background:#333}#prettydiff.shadow fieldset fiel" +
                                                        "dset input,#prettydiff.shadow fieldset fieldset select{background:#222}#prettydi" +
                                                        "ff.shadow h2,#prettydiff.shadow h2 button,#prettydiff.shadow h3,#prettydiff.shad" +
                                                        "ow input,#prettydiff.shadow option,#prettydiff.shadow select,#prettydiff.shadow " +
                                                        "legend{color:#ccc}#prettydiff.shadow .contentarea{box-shadow:0 1em 1em #000}#pre" +
                                                        "ttydiff.shadow .segment{background:#222}#prettydiff.shadow h2 button,#prettydiff" +
                                                        ".shadow td,#prettydiff.shadow th,#prettydiff.shadow .segment,#prettydiff.shadow " +
                                                        "ol.segment li{border-color:#666}#prettydiff.shadow .count li.fold{color:#cf3}#pr" +
                                                        "ettydiff.shadow th{background:#000}#prettydiff.shadow h2 button{background:#5858" +
                                                        "58;box-shadow:0.1em 0.1em 0.25em #000}#prettydiff.shadow li h4{color:#ff0}#prett" +
                                                        "ydiff.shadow code{background:#585858;border-color:#585858;color:#ccf}#prettydiff" +
                                                        ".shadow ol.segment h4 strong{color:#f30}#prettydiff.shadow button{background-col" +
                                                        "or:#333;border-color:#666;box-shadow:0 0.25em 0.5em #000;color:#ccc}#prettydiff." +
                                                        "shadow button:hover{background-color:#777;border-color:#aaa;box-shadow:0 0.25em " +
                                                        "0.5em #222;color:#fff}#prettydiff.shadow th{background:#444}#prettydiff.shadow t" +
                                                        "head th,#prettydiff.shadow th.heading{background:#444}#prettydiff.shadow .diff h" +
                                                        "3{background:#000;border-color:#666}#prettydiff.shadow .segment,#prettydiff.shad" +
                                                        "ow .data li,#prettydiff.shadow .diff-right{border-color:#444}#prettydiff.shadow " +
                                                        ".count li{border-color:#333}#prettydiff.shadow .count{background:#555;border-col" +
                                                        "or:#333}#prettydiff.shadow li h4{color:#ff0}#prettydiff.shadow code{background:#" +
                                                        "000;border-color:#000;color:#ddd}#prettydiff.shadow ol.segment h4 strong{color:#" +
                                                        "c00}#prettydiff.shadow .data .delete{background:#300}#prettydiff.shadow .data .d" +
                                                        "elete em{background:#200;border-color:#c63;color:#c66}#prettydiff.shadow .data ." +
                                                        "insert{background:#030}#prettydiff.shadow .data .insert em{background:#010;borde" +
                                                        "r-color:#090;color:#6c0}#prettydiff.shadow .data .replace{background:#345}#prett" +
                                                        "ydiff.shadow .data .replace em{background:#023;border-color:#09c;color:#7cf}#pre" +
                                                        "ttydiff.shadow .data .empty{background:#111}#prettydiff.shadow .diff .author{bor" +
                                                        "der-color:#666}#prettydiff.shadow .data em.s0{color:#fff}#prettydiff.shadow .dat" +
                                                        "a em.s1{color:#d60}#prettydiff.shadow .data em.s2{color:#aaf}#prettydiff.shadow " +
                                                        ".data em.s3{color:#0c0}#prettydiff.shadow .data em.s4{color:#f6f}#prettydiff.sha" +
                                                        "dow .data em.s5{color:#0cc}#prettydiff.shadow .data em.s6{color:#dc3}#prettydiff" +
                                                        ".shadow .data em.s7{color:#a7a}#prettydiff.shadow .data em.s8{color:#7a7}#pretty" +
                                                        "diff.shadow .data em.s9{color:#ff6}#prettydiff.shadow .data em.s10{color:#33f}#p" +
                                                        "rettydiff.shadow .data em.s11{color:#933}#prettydiff.shadow .data em.s12{color:#" +
                                                        "990}#prettydiff.shadow .data em.s13{color:#987}#prettydiff.shadow .data em.s14{c" +
                                                        "olor:#fc3}#prettydiff.shadow .data em.s15{color:#897}#prettydiff.shadow .data em" +
                                                        ".s16{color:#f30}#prettydiff.shadow .data .l0{background:#333}#prettydiff.shadow " +
                                                        ".data .l1{background:#633}#prettydiff.shadow .data .l2{background:#335}#prettydi" +
                                                        "ff.shadow .data .l3{background:#353}#prettydiff.shadow .data .l4{background:#636" +
                                                        "}#prettydiff.shadow .data .l5{background:#366}#prettydiff.shadow .data .l6{backg" +
                                                        "round:#640}#prettydiff.shadow .data .l7{background:#303}#prettydiff.shadow .data" +
                                                        " .l8{background:#030}#prettydiff.shadow .data .l9{background:#660}#prettydiff.sh" +
                                                        "adow .data .l10{background:#003}#prettydiff.shadow .data .l11{background:#300}#p" +
                                                        "rettydiff.shadow .data .l12{background:#553}#prettydiff.shadow .data .l13{backgr" +
                                                        "ound:#432}#prettydiff.shadow .data .l14{background:#640}#prettydiff.shadow .data" +
                                                        " .l15{background:#562}#prettydiff.shadow .data .l16{background:#600}#prettydiff." +
                                                        "shadow .data .c0{background:inherit}#prettydiff.white{background:#f8f8f8 url(\"d" +
                                                        "ata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4" +
                                                        "jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEt" +
                                                        "vUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a" +
                                                        "89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsA" +
                                                        "HvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFA" +
                                                        "tAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMD" +
                                                        "OEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkk" +
                                                        "XKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF" +
                                                        "0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5" +
                                                        "nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5" +
                                                        "EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c9" +
                                                        "3/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmS" +
                                                        "AHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjgg" +
                                                        "XmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag" +
                                                        "3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhq" +
                                                        "wVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjI" +
                                                        "xh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIX" +
                                                        "kneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR" +
                                                        "1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+" +
                                                        "YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1P" +
                                                        "jqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTX" +
                                                        "EJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVx" +
                                                        "rqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6Ubobt" +
                                                        "Ed79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6V" +
                                                        "hlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0" +
                                                        "x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZ" +
                                                        "nw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpz" +
                                                        "uP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vW" +
                                                        "dm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V" +
                                                        "3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp" +
                                                        "8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVe" +
                                                        "GP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5Liq" +
                                                        "uNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJ" +
                                                        "nIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqo" +
                                                        "hTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cy" +
                                                        "zytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1" +
                                                        "rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qav" +
                                                        "EuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPR" +
                                                        "U+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwP" +
                                                        "SA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x9" +
                                                        "2HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GD" +
                                                        "borZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7n" +
                                                        "uer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3Yf" +
                                                        "VP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/su" +
                                                        "uFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j" +
                                                        "5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADo2aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQ" +
                                                        "gYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5" +
                                                        "zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY" +
                                                        "3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR" +
                                                        "0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3J" +
                                                        "pcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmN" +
                                                        "vbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGF" +
                                                        "wLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8" +
                                                        "xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5" +
                                                        "vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnM" +
                                                        "uYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnM" +
                                                        "uYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2J" +
                                                        "lLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCB" +
                                                        "DQyAyMDE0IChNYWNpbnRvc2gpPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF" +
                                                        "0ZT4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDp" +
                                                        "NZXRhZGF0YURhdGU+MjAxNi0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICA" +
                                                        "gICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3htcDpNb2RpZnl" +
                                                        "EYXRlPgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOmQ1M2M3ODQzLWE1ZjItNDg0Ny0" +
                                                        "4YzQzLTZlMmMwYTQ2OGJlYjwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW5" +
                                                        "0SUQ+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjFjMzc2MTgxLWY5ZTgtMTE3OC05YTljLWQ4MjVkZmIwYTQ" +
                                                        "3MDwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXA" +
                                                        "uZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwveG1wTU06T3JpZ2luYWxEb2N" +
                                                        "1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICA" +
                                                        "gICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICA" +
                                                        "gICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN" +
                                                        "0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE" +
                                                        "8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJ" +
                                                        "UMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2F" +
                                                        "yZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUF" +
                                                        "nZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGF" +
                                                        "yc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N" +
                                                        "0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpkNTN" +
                                                        "jNzg0My1hNWYyLTQ4NDctOGM0My02ZTJjMGE0NjhiZWI8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICA" +
                                                        "gICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4" +
                                                        "+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyA" +
                                                        "yMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3R" +
                                                        "FdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICA" +
                                                        "gICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3J" +
                                                        "tYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3B" +
                                                        "ob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzY" +
                                                        "xOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE" +
                                                        "8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA" +
                                                        "8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA" +
                                                        "8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmV" +
                                                        "zb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgo" +
                                                        "gICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICA" +
                                                        "gICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9" +
                                                        "yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                        "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5cKgaXAAAAIGN" +
                                                        "IUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAkSURBVHjaPMahAQAwDMCg7P+" +
                                                        "/KnsPcq4oHqpqdwNmBt3QDX8AeAUmcrZLnM4AAAAASUVORK5CYII=\")}#prettydiff.white *:foc" +
                                                        "us{outline:0.1em dashed #06f}#prettydiff.white .contentarea,#prettydiff.white le" +
                                                        "gend,#prettydiff.white fieldset select,#prettydiff.white .diff td,#prettydiff.wh" +
                                                        "ite .report td,#prettydiff.white .data li,#prettydiff.white .diff-right,#prettyd" +
                                                        "iff.white fieldset input{background:#fff;border-color:#999}#prettydiff.white sel" +
                                                        "ect,#prettydiff.white input,#prettydiff.white .diff,#prettydiff.white .beautify," +
                                                        "#prettydiff.white .report,#prettydiff.white .beautify h3,#prettydiff.white .diff" +
                                                        " h3,#prettydiff.white .beautify h4,#prettydiff.white .diff h4,#prettydiff.white " +
                                                        "#pdsamples li div,#prettydiff.white #report,#prettydiff.white .author,#prettydif" +
                                                        "f.white #report .author,#prettydiff.white fieldset{background:#eee;border-color:" +
                                                        "#999}#prettydiff.white .diff h3{background:#ddd;border-color:#999}#prettydiff.wh" +
                                                        "ite fieldset fieldset{background:#ddd}#prettydiff.white .contentarea{box-shadow:" +
                                                        "0 1em 1em #999}#prettydiff.white button{background-color:#eee;border-color:#999;" +
                                                        "box-shadow:0 0.25em 0.5em #ccc;color:#666}#prettydiff.white button:hover{backgro" +
                                                        "und-color:#def;border-color:#03c;box-shadow:0 0.25em 0.5em #ccf;color:#03c}#pret" +
                                                        "tydiff.white h2,#prettydiff.white h2 button,#prettydiff.white h3{color:#b00}#pre" +
                                                        "ttydiff.white th{background:#eee;color:#333}#prettydiff.white thead th{backgroun" +
                                                        "d:#eef}#prettydiff.white .report strong{color:#009}#prettydiff.white .report em{" +
                                                        "color:#080}#prettydiff.white h2 button,#prettydiff.white td,#prettydiff.white th" +
                                                        ",#prettydiff.white .segment,#prettydiff.white .count li,#prettydiff.white .diff-" +
                                                        "right #prettydiff.white ol.segment li{border-color:#ccc}#prettydiff.white .data " +
                                                        "li{border-color:#ccc}#prettydiff.white .count li.fold{color:#900}#prettydiff.whi" +
                                                        "te .count{background:#eed;border-color:#999}#prettydiff.white h2 button{backgrou" +
                                                        "nd:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettydiff.white li h4{color:#00f" +
                                                        "}#prettydiff.white code{background:#eee;border-color:#eee;color:#009}#prettydiff" +
                                                        ".white ol.segment h4 strong{color:#c00}#prettydiff.white .data .delete{backgroun" +
                                                        "d:#ffd8d8}#prettydiff.white .data .delete em{background:#fff8f8;border-color:#c4" +
                                                        "4;color:#900}#prettydiff.white .data .insert{background:#d8ffd8}#prettydiff.whit" +
                                                        "e .data .insert em{background:#f8fff8;border-color:#090;color:#363}#prettydiff.w" +
                                                        "hite .data .replace{background:#fec}#prettydiff.white .data .replace em{backgrou" +
                                                        "nd:#ffe;border-color:#a86;color:#852}#prettydiff.white .data .empty{background:#" +
                                                        "ddd}#prettydiff.white .data em.s0{color:#000}#prettydiff.white .data em.s1{color" +
                                                        ":#f66}#prettydiff.white .data em.s2{color:#12f}#prettydiff.white .data em.s3{col" +
                                                        "or:#090}#prettydiff.white .data em.s4{color:#d6d}#prettydiff.white .data em.s5{c" +
                                                        "olor:#7cc}#prettydiff.white .data em.s6{color:#c85}#prettydiff.white .data em.s7" +
                                                        "{color:#737}#prettydiff.white .data em.s8{color:#6d0}#prettydiff.white .data em." +
                                                        "s9{color:#dd0}#prettydiff.white .data em.s10{color:#893}#prettydiff.white .data " +
                                                        "em.s11{color:#b97}#prettydiff.white .data em.s12{color:#bbb}#prettydiff.white .d" +
                                                        "ata em.s13{color:#cc3}#prettydiff.white .data em.s14{color:#333}#prettydiff.whit" +
                                                        "e .data em.s15{color:#9d9}#prettydiff.white .data em.s16{color:#880}#prettydiff." +
                                                        "white .data .l0{background:#fff}#prettydiff.white .data .l1{background:#fed}#pre" +
                                                        "ttydiff.white .data .l2{background:#def}#prettydiff.white .data .l3{background:#" +
                                                        "efe}#prettydiff.white .data .l4{background:#fef}#prettydiff.white .data .l5{back" +
                                                        "ground:#eef}#prettydiff.white .data .l6{background:#fff8cc}#prettydiff.white .da" +
                                                        "ta .l7{background:#ede}#prettydiff.white .data .l8{background:#efc}#prettydiff.w" +
                                                        "hite .data .l9{background:#ffd}#prettydiff.white .data .l10{background:#edc}#pre" +
                                                        "ttydiff.white .data .l11{background:#fdb}#prettydiff.white .data .l12{background" +
                                                        ":#f8f8f8}#prettydiff.white .data .l13{background:#ffb}#prettydiff.white .data .l" +
                                                        "14{background:#eec}#prettydiff.white .data .l15{background:#cfc}#prettydiff.whit" +
                                                        "e .data .l16{background:#eea}#prettydiff.white .data .c0{background:inherit}#pre" +
                                                        "ttydiff.white #report p em{color:#080}#prettydiff.white #report p strong{color:#" +
                                                        "009}#prettydiff #report.contentarea{font-family:\"Lucida Sans Unicode\",\"Helvet" +
                                                        "ica\",\"Arial\",sans-serif;max-width:none;overflow:scroll}#prettydiff .diff .rep" +
                                                        "lace em,#prettydiff .diff .delete em,#prettydiff .diff .insert em{border-style:s" +
                                                        "olid;border-width:0.1em}#prettydiff #report dd,#prettydiff #report dt,#prettydif" +
                                                        "f #report p,#prettydiff #report li,#prettydiff #report td,#prettydiff #report bl" +
                                                        "ockquote,#prettydiff #report th{font-family:\"Lucida Sans Unicode\",\"Helvetica" +
                                                        "\",\"Arial\",sans-serif;font-size:1.2em}#prettydiff div#webtool{background:trans" +
                                                        "parent;font-size:inherit;margin:0;padding:0}#prettydiff #jserror span{display:bl" +
                                                        "ock}#prettydiff #a11y{background:transparent;padding:0}#prettydiff #a11y div{mar" +
                                                        "gin:0.5em 0;border-style:solid;border-width:0.1em}#prettydiff #a11y h4{margin:0." +
                                                        "25em 0}#prettydiff #a11y ol{border-style:solid;border-width:0.1em}#prettydiff #c" +
                                                        "ssreport.doc table{clear:none;float:left;margin-left:1em}#prettydiff #css-size{l" +
                                                        "eft:24em}#prettydiff #css-uri{left:40em}#prettydiff #css-uri td{text-align:left}" +
                                                        "#prettydiff .report .analysis th{text-align:left}#prettydiff .report .analysis ." +
                                                        "parseData td{font-family:\"Courier New\",Courier,\"Lucida Console\",monospace;te" +
                                                        "xt-align:left;white-space:pre}#prettydiff .report .analysis td{text-align:right}" +
                                                        "#prettydiff .analysis{float:left;margin:0 1em 1em 0}#prettydiff .analysis td,#pr" +
                                                        "ettydiff .analysis th{padding:0.5em}#prettydiff #statreport div{border-style:non" +
                                                        "e}#prettydiff .diff,#prettydiff .beautify{border-style:solid;border-width:0.1em;" +
                                                        "display:inline-block;margin:0 1em 1em 0;position:relative}#prettydiff .diff,#pre" +
                                                        "ttydiff .diff li #prettydiff .diff h3,#prettydiff .diff h4,#prettydiff .beautify" +
                                                        ",#prettydiff .beautify li,#prettydiff .beautify h3,#prettydiff .beautify h4{font" +
                                                        "-family:\"Courier New\",Courier,\"Lucida Console\",monospace}#prettydiff .diff l" +
                                                        "i,#prettydiff .beautify li,#prettydiff .diff h3,#prettydiff .diff h4,#prettydiff" +
                                                        " .beautify h3,#prettydiff .beautify h4{border-style:none none solid none;border-" +
                                                        "width:0 0 0.1em 0;box-shadow:none;display:block;font-size:1.2em;margin:0 0 0 -.1" +
                                                        "em;padding:0.2em 2em;text-align:left}#prettydiff .diff .skip{border-style:none n" +
                                                        "one solid;border-width:0 0 0.1em}#prettydiff .diff .diff-left{border-style:none;" +
                                                        "display:table-cell}#prettydiff .diff .diff-right{border-style:none none none sol" +
                                                        "id;border-width:0 0 0 0.1em;display:table-cell;margin-left:-.1em;min-width:16.5e" +
                                                        "m;right:0;top:0}#prettydiff .diff .data li,#prettydiff .beautify .data li{min-wi" +
                                                        "dth:16.5em;padding:0.5em}#prettydiff .diff li,#prettydiff .diff p,#prettydiff .d" +
                                                        "iff h3,#prettydiff .beautify li,#prettydiff .beautify p,#prettydiff .beautify h3" +
                                                        "{font-size:1.2em}#prettydiff .diff li em,#prettydiff .beautify li em{font-style:" +
                                                        "normal;font-weight:bold;margin:-0.5em -0.09em}#prettydiff .diff p.author{border-" +
                                                        "style:solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4e" +
                                                        "m;text-align:right}#prettydiff .difflabel{display:block;height:0}#prettydiff .co" +
                                                        "unt{border-style:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;tex" +
                                                        "t-align:right}#prettydiff .count li{padding:0.5em 1em;text-align:right}#prettydi" +
                                                        "ff .count li.fold{cursor:pointer;font-weight:bold;padding-left:0.5em}#prettydiff" +
                                                        " .data{text-align:left;white-space:pre}#prettydiff .beautify .data em{display:in" +
                                                        "line-block;font-style:normal;font-weight:bold}#prettydiff .beautify li,#prettydi" +
                                                        "ff .diff li{border-style:none none solid;border-width:0 0 0.1em;display:block;he" +
                                                        "ight:1em;line-height:1.2;list-style-type:none;margin:0;white-space:pre}#prettydi" +
                                                        "ff .beautify ol,#prettydiff .diff ol{display:table-cell;margin:0;padding:0}#pret" +
                                                        "tydiff .beautify em.l0,#prettydiff .beautify em.l1,#prettydiff .beautify em.l2,#" +
                                                        "prettydiff .beautify em.l3,#prettydiff .beautify em.l4,#prettydiff .beautify em." +
                                                        "l5,#prettydiff .beautify em.l6,#prettydiff .beautify em.l7,#prettydiff .beautify" +
                                                        " em.l8,#prettydiff .beautify em.l9,#prettydiff .beautify em.l10,#prettydiff .bea" +
                                                        "utify em.l11,#prettydiff .beautify em.l12,#prettydiff .beautify em.l13,#prettydi" +
                                                        "ff .beautify em.l14,#prettydiff .beautify em.l15,#prettydiff .beautify em.l16{he" +
                                                        "ight:2.2em;margin:0 0 -1em;position:relative;top:-0.5em}#prettydiff .beautify em" +
                                                        ".l0{margin-left:-0.5em;padding-left:0.5em}#prettydiff #report .beautify,#prettyd" +
                                                        "iff #report .beautify li,#prettydiff #report .diff,#prettydiff #report .diff li{" +
                                                        "font-family:\"Courier New\",Courier,\"Lucida Console\",monospace}#prettydiff #re" +
                                                        "port .beautify{border-style:solid}#prettydiff #report .diff h3,#prettydiff #repo" +
                                                        "rt .beautify h3{margin:0}#prettydiff{text-align:center;font-size:10px;overflow-y" +
                                                        ":scroll}#prettydiff .contentarea{border-style:solid;border-width:0.1em;font-fami" +
                                                        "ly:\"Century Gothic\",\"Trebuchet MS\";margin:0 auto;max-width:93em;padding:1em;" +
                                                        "text-align:left}#prettydiff dd,#prettydiff dt,#prettydiff p,#prettydiff li,#pret" +
                                                        "tydiff td,#prettydiff blockquote,#prettydiff th{clear:both;font-family:\"Palatin" +
                                                        "o Linotype\",\"Book Antiqua\",Palatino,serif;font-size:1.6em;line-height:1.6em;t" +
                                                        "ext-align:left}#prettydiff blockquote{font-style:italic}#prettydiff dt{font-size" +
                                                        ":1.4em;font-weight:bold;line-height:inherit}#prettydiff li li,#prettydiff li p{f" +
                                                        "ont-size:1em}#prettydiff th,#prettydiff td{border-style:solid;border-width:0.1em" +
                                                        ";padding:0.1em 0.2em}#prettydiff td span{display:block}#prettydiff code,#prettyd" +
                                                        "iff textarea{font-family:\"Courier New\",Courier,\"Lucida Console\",monospace}#p" +
                                                        "rettydiff code,#prettydiff textarea{display:block;font-size:0.8em;width:100%}#pr" +
                                                        "ettydiff code span{display:block;white-space:pre}#prettydiff code{border-style:s" +
                                                        "olid;border-width:0.2em;line-height:1em}#prettydiff textarea{line-height:1.4em}#" +
                                                        "prettydiff label{display:inline;font-size:1.4em}#prettydiff legend{border-radius" +
                                                        ":1em;border-style:solid;border-width:0.1em;font-size:1.4em;font-weight:bold;marg" +
                                                        "in-left:-0.25em;padding:0 0.5em}#prettydiff fieldset fieldset legend{font-size:1" +
                                                        ".2em}#prettydiff table{border-collapse:collapse}#prettydiff div.report{border-st" +
                                                        "yle:none}#prettydiff h2,#prettydiff h3,#prettydiff h4{clear:both}#prettydiff tab" +
                                                        "le{margin:0 0 1em}#prettydiff .analysis .bad,#prettydiff .analysis .good{font-we" +
                                                        "ight:bold}#prettydiff h1{font-size:3em;font-weight:normal;margin-top:0}#prettydi" +
                                                        "ff h1 span{font-size:0.5em}#prettydiff h1 svg{border-style:solid;border-width:0." +
                                                        "05em;float:left;height:1.5em;margin-right:0.5em;width:1.5em}#prettydiff h2{borde" +
                                                        "r-style:none;background:transparent;font-size:1em;box-shadow:none;margin:0}#pret" +
                                                        "tydiff h2 button{background:transparent;border-style:solid;cursor:pointer;displa" +
                                                        "y:block;font-size:2.5em;font-weight:normal;text-align:left;width:100%;border-wid" +
                                                        "th:0.05em;font-weight:normal;margin:1em 0 0;padding:0.1em}#prettydiff h2 span{di" +
                                                        "splay:block;float:right;font-size:0.5em}#prettydiff h3{font-size:2em;margin:0;ba" +
                                                        "ckground:transparent;box-shadow:none;border-style:none}#prettydiff h4{font-size:" +
                                                        "1.6em;font-family:\"Century Gothic\",\"Trebuchet MS\";margin:0}#prettydiff li h4" +
                                                        "{font-size:1em}#prettydiff button,#prettydiff fieldset,#prettydiff div input,#pr" +
                                                        "ettydiff textarea{border-style:solid;border-width:0.1em}#prettydiff section{bord" +
                                                        "er-style:none}#prettydiff h2 button,#prettydiff select,#prettydiff option{font-f" +
                                                        "amily:inherit}#prettydiff select{border-style:inset;border-width:0.1em;width:13." +
                                                        "5em}#prettydiff #dcolorScheme{float:right;margin:-3em 0 0}#prettydiff #dcolorSch" +
                                                        "eme label,#prettydiff #dcolorScheme label{display:inline-block;font-size:1em}#pr" +
                                                        "ettydiff .clear{clear:both;display:block}#prettydiff caption,#prettydiff .conten" +
                                                        "t-hide{height:1em;left:-1000em;overflow:hidden;position:absolute;top:-1000em;wid" +
                                                        "th:1em}/*]]>*/</style></head><body id=\"prettydiff\" class=\"white\"><div class=" +
                                                        "\"contentarea\" id=\"report\"><section role=\"heading\"><h1><svg height=\"2000.0" +
                                                        "00000pt\" id=\"pdlogo\" preserveAspectRatio=\"xMidYMid meet\" version=\"1.0\" vi" +
                                                        "ewBox=\"0 0 2000.000000 2000.000000\" width=\"2000.000000pt\" xmlns=\"http://www" +
                                                        ".w3.org/2000/svg\"><g fill=\"#999\" stroke=\"none\" transform=\"translate(0.0000" +
                                                        "00,2000.000000) scale(0.100000,-0.100000)\"> <path d=\"M14871 18523 c-16 -64 -61" +
                                                        "1 -2317 -946 -3588 -175 -660 -319 -1202 -320 -1204 -2 -2 -50 39 -107 91 -961 876" +
                                                        " -2202 1358 -3498 1358 -1255 0 -2456 -451 -3409 -1279 -161 -140 -424 -408 -560 -" +
                                                        "571 -507 -607 -870 -1320 -1062 -2090 -58 -232 -386 -1479 -2309 -8759 -148 -563 -" +
                                                        "270 -1028 -270 -1033 0 -4 614 -8 1365 -8 l1364 0 10 38 c16 63 611 2316 946 3587 " +
                                                        "175 660 319 1202 320 1204 2 2 50 -39 107 -91 543 -495 1169 -862 1863 -1093 1707 " +
                                                        "-568 3581 -211 4965 946 252 210 554 524 767 796 111 143 312 445 408 613 229 406 " +
                                                        "408 854 525 1320 57 225 380 1451 2310 8759 148 563 270 1028 270 1033 0 4 -614 8 " +
                                                        "-1365 8 l-1364 0 -10 -37z m-4498 -5957 c477 -77 889 -256 1245 -542 523 -419 850 " +
                                                        "-998 954 -1689 18 -121 18 -549 0 -670 -80 -529 -279 -972 -612 -1359 -412 -480 -9" +
                                                        "67 -779 -1625 -878 -121 -18 -549 -18 -670 0 -494 74 -918 255 -1283 548 -523 419 " +
                                                        "-850 998 -954 1689 -18 121 -18 549 0 670 104 691 431 1270 954 1689 365 293 828 4" +
                                                        "90 1283 545 50 6 104 13 120 15 72 10 495 -3 588 -18z\"/></g></svg><a href=\"pret" +
                                                        "tydiff.com.xhtml\">Pretty Diff</a></h1><p id=\"dcolorScheme\"><label class=\"lab" +
                                                        "el\" for=\"colorScheme\">Color Scheme</label><select id=\"colorScheme\"><option>" +
                                                        "Canvas</option><option>Shadow</option><option selected=\"selected\">White</optio" +
                                                        "n></select></p><p>Find <a href=\"https://github.com/prettydiff/prettydiff\">Pret" +
                                                        "ty Diff on GitHub</a>.</p></section><section role=\"main\"><div class='report'><" +
                                                        "p><em>0</em> instances of <strong>missing semicolons</strong> counted.</p><p><em" +
                                                        ">0</em> unnessary instances of the keyword <strong>new</strong> counted.</p><tab" +
                                                        "le class='analysis' summary='JavaScript character size comparison'><caption>Java" +
                                                        "Script data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Outp" +
                                                        "ut</th><th>Literal Increase</th><th>Percentage Increase</th></tr></thead><tbody>" +
                                                        "<tr><th>Total Character Size</th><td>89</td><td>109</td><td>20</td><td>22.47%</t" +
                                                        "d></tr><tr><th>Total Lines of Code</th><td>1</td><td>24</td><td>23</td><td>2300." +
                                                        "00%</td></tr></tbody></table><table class='analysis' summary='JavaScript compone" +
                                                        "nt analysis'><caption>JavaScript component analysis</caption><thead><tr><th>Java" +
                                                        "Script Component</th><th>Component Quantity</th><th>Percentage Quantity from Sec" +
                                                        "tion</th><th>Percentage Qauntity from Total</th><th>Character Length</th><th>Per" +
                                                        "centage Length from Section</th><th>Percentage Length from Total</th></tr></thea" +
                                                        "d><tbody><tr><th>Total Accounted</th><td>29</td><td>100.00%</td><td>100.00%</td>" +
                                                        "<td>89</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th" +
                                                        "></tr><tr><th>Block Comments</th><td>1</td><td>100.00%</td><td>3.45%</td><td>17<" +
                                                        "/td><td>100.00%</td><td>19.10%</td></tr><tr><th>Inline Comments</th><td>0</td><t" +
                                                        "d>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</td></tr><tr><th>Com" +
                                                        "ment Total</th><td>1</td><td>100.00%</td><td>3.45%</td><td>17</td><td>100.00%</t" +
                                                        "d><td>19.10%</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comm" +
                                                        "ents</th></tr><tr><th>New Lines</th><td>0</td><td>0.00%</td><td>0.00%</td><td>0<" +
                                                        "/td><td>0.00%</td><td>0.00%</td></tr><tr><th>Spaces</th><td>3</td><td>100.00%</t" +
                                                        "d><td>10.34%</td><td>3</td><td>100.00%</td><td>3.37%</td></tr><tr><th>Tabs</th><" +
                                                        "td>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</td></tr>" +
                                                        "<tr><th>Other Whitespace</th><td>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td" +
                                                        ">0.00%</td><td>0.00%</td></tr><tr><th>Total Whitespace</th><td>3</td><td>100.00%" +
                                                        "</td><td>10.34%</td><td>3</td><td>100.00%</td><td>3.37%</td></tr><tr><th colspan" +
                                                        "='7'>Literals</th></tr><tr><th>Strings</th><td>1</td><td>50.00%</td><td>3.45%</t" +
                                                        "d><td>10</td><td>55.56%</td><td>11.24%</td></tr><tr><th>Numbers</th><td>1</td><t" +
                                                        "d>50.00%</td><td>3.45%</td><td>8</td><td>44.44%</td><td>8.99%</td></tr><tr><th>R" +
                                                        "egular Expressions</th><td>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00%" +
                                                        "</td><td>0.00%</td></tr><tr><th>Total Literals</th><td>2</td><td>100.00%</td><td" +
                                                        ">6.90%</td><td>18</td><td>100.00%</td><td>20.22%</td></tr><tr><th colspan='7'>Sy" +
                                                        "ntax Characters</th></tr><tr><th>Quote Characters</th><td>2</td><td>11.76%</td><" +
                                                        "td>6.90%</td><td>2</td><td>11.76%</td><td>2.25%</td></tr><tr><th>Commas</th><td>" +
                                                        "0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</td></tr><tr" +
                                                        "><th>Containment Characters</th><td>8</td><td>47.06%</td><td>27.59%</td><td>8</t" +
                                                        "d><td>47.06%</td><td>8.99%</td></tr><tr><th>Semicolons</th><td>4</td><td>23.53%<" +
                                                        "/td><td>13.79%</td><td>4</td><td>23.53%</td><td>4.49%</td></tr><tr><th>Operators" +
                                                        "</th><td>3</td><td>17.65%</td><td>10.34%</td><td>3</td><td>17.65%</td><td>3.37%<" +
                                                        "/td></tr><tr><th>Total Syntax Characters</th><td>17</td><td>100.00%</td><td>58.6" +
                                                        "2%</td><td>17</td><td>100.00%</td><td>19.10%</td></tr><tr><th colspan='7'>Keywor" +
                                                        "ds and Variables</th></tr><tr><th>Words</th><td>6</td><td>100.00%</td><td>20.69%" +
                                                        "</td><td>34</td><td>100.00%</td><td>38.20%</td></tr><tr><th colspan='7'>Server-s" +
                                                        "ide Tags</th></tr><tr><th>Server Tags</th><td>0</td><td>100.00%</td><td>0.00%</t" +
                                                        "d><td>0</td><td>100.00%</td><td>0.00%</td></tr></tbody></table></div></section><" +
                                                        "/div><script type=\"application/javascript\">//<![CDATA[\r\nvar pd={};pd.colorch" +
                                                        "ange=function(){\"use strict\";var options=this.getElementsByTagName(\"option\")" +
                                                        ";document.getElementsByTagName(\"body\")[0].setAttribute(\"class\",options[this." +
                                                        "selectedIndex].innerHTML.toLowerCase())};document.getElementById(\"colorScheme\"" +
                                                        ").onchange=pd.colorchange;//]]>\r\n</script></body></html>"
                                        }
                                    ]
                                }, {
                                    group: "write to new locations",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"inch.json\" readmethod:\"file\" mode:\"beautify" +
                                                    "\" output:\"test/simulation/inch.json\"",
                                            name  : "Beautify inch.json",
                                            verify: "\nFile successfully written.\n\nPretty Diff beautified x files. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"api\" readmethod:\"directory\" mode:\"beautify\"" +
                                                        " output:\"test/simulation/api\"",
                                            name  : "Beautify api directory",
                                            verify: "\nPretty Diff beautified x files. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test\" readmethod:\"subdirectory\" mode:\"parse" +
                                                    "\" output:\"test/simulation/all/big\"",
                                            name  : "Subdirectory parse all prettydiff",
                                            verify: "\nPretty Diff parsed x files. Executed in."
                                        }
                                    ]
                                }, {
                                    group: "file system checks",
                                    units: [
                                        {
                                            check : "cat test/simulation/inch.json",
                                            name  : "print out test/simulation/inch.json",
                                            verify: "{\n    \"files\": {\n        \"included\": [\"prettydiff.js\"]\n    }\n}"
                                        }, {
                                            check : "ls test/simulation/api",
                                            name  : "check for 2 files in api directory",
                                            verify: (path.sep === "\\")
                                                ? "dom.js\r\nnode-local.js"
                                                : "dom.js\nnode-local.js"
                                        }, {
                                            check : "cat test/simulation/all/big/today.js",
                                            name  : "check for a file in a subdirectory operation",
                                            verify: "{\"data\":{\"begin\":[0,1,1,3,3,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,20,20,1,0],\"depth" +
                                                        "\":[\"global\",\"paren\",\"paren\",\"expression\",\"expression\",\"function\",\"" +
                                                        "function\",\"function\",\"function\",\"function\",\"function\",\"function\",\"fu" +
                                                        "nction\",\"function\",\"function\",\"function\",\"function\",\"function\",\"func" +
                                                        "tion\",\"function\",\"method\",\"method\",\"paren\",\"global\"],\"lines\":[0,0,0" +
                                                        ",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\"token\":[\"/*global module*/\",\"(" +
                                                        "\",\"function\",\"(\",\")\",\"{\",\"\\\"use strict\\\"\",\";\",\"var\",\"today\"" +
                                                        ",\"=\",\"20999999\",\";\",\"module\",\".\",\"exports\",\"=\",\"today\",\";\",\"}" +
                                                        "\",\"(\",\")\",\")\",\";\"],\"types\":[\"comment\",\"start\",\"word\",\"start\"," +
                                                        "\"end\",\"start\",\"literal\",\"separator\",\"word\",\"word\",\"operator\",\"lit" +
                                                        "eral\",\"separator\",\"word\",\"separator\",\"word\",\"operator\",\"word\",\"sep" +
                                                        "arator\",\"end\",\"start\",\"end\",\"end\",\"separator\"]},\"definition\":{\"beg" +
                                                        "in\":\"number - The index where the current container starts\",\"depth\":\"strin" +
                                                        "g - The name of the current container\",\"lines\":\"number - Whether the token i" +
                                                        "s preceeded any space and/or line breaks in the original code source\",\"token\"" +
                                                        ":\"string - The parsed code tokens\",\"types\":\"string - Data types of the toke" +
                                                        "ns: comment, comment-inline, end, literal, markup, operator, regex, separator, s" +
                                                        "tart, template, template_else, template_end, template_start, word\"}}"
                                        }, {
                                            check : "cat test/simulation/all/big/samples_correct/beautification_markup_comment.txt",
                                            name  : "check for a deeper file in a subdirectory operation",
                                            verify: "{\"data\":{\"attrs\":[{},{},{},{},{},{}],\"begin\":[0,0,0,2,2,0],\"daddy\":[\"ro" +
                                                        "ot\",\"person\",\"person\",\"name\",\"name\",\"person\"],\"jscom\":[false,false," +
                                                        "false,false,false,false],\"linen\":[1,2,3,3,3,4],\"lines\":[0,1,1,0,0,1],\"presv" +
                                                        "\":[false,true,false,false,false,false],\"token\":[\"<person>\",\"<!-- comment -" +
                                                        "->\",\"<name>\",\"bob\",\"</name>\",\"</person>\"],\"types\":[\"start\",\"commen" +
                                                        "t\",\"start\",\"content\",\"end\",\"end\"]},\"definition\":{\"attrs\":\"array - " +
                                                        "List of attributes (if any) for the given token.\",\"begin\":\"number - Index wh" +
                                                        "ere the parent element occurs.\",\"daddy\":\"string - Tag name of the parent ele" +
                                                        "ment. Tokens of type 'template_start' are not considered as parent elements.  En" +
                                                        "d tags reflect their matching start tag.\",\"jscom\":\"boolean - Whether the tok" +
                                                        "en is a JavaScript comment if in JSX format.\",\"linen\":\"number - The line num" +
                                                        "ber in the original source where the token started, which is used for reporting " +
                                                        "and analysis.\",\"lines\":\"number - Whether the token is preceeded any space an" +
                                                        "d/or line breaks in the original code source.\",\"presv\":\"boolean - Whether th" +
                                                        "e token is preserved verbatim as found.  Useful for comments and HTML 'pre' tags" +
                                                        ".\",\"token\":\"string - The parsed code tokens.\",\"types\":\"string - Data typ" +
                                                        "es of the tokens: cdata, comment, conditional, content, end, ignore, linepreserv" +
                                                        "e, script, sgml, singleton, start, template, template_else, template_end, templa" +
                                                        "te_start, xml\"}}"
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
                            }
                            if ((/^(rm\u0020(-\w+\u0020)*)/).test(output) === true) {
                                output = output.replace(/^(rm\u0020(-\w+\u0020)*)/, "powershell.exe -nologo -noprofile -command \"rm ") + " -r -force\"";
                            }
                            output = output.replace(/^(cat\u0020)/, "type ");
                            output = output.replace(/^(ls\u0020(-\w+\u0020)*)/, "dir /b ");
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
                                childExec(param.check, {
                                    timeout: 1200000
                                }, function taskrunner_simulations_shell_child_childExec(err, stdout, stderr) {
                                    var failflag  = false,
                                        data      = [param.name],
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
                                            data.push("Unexpected output:");
                                            failflag = true;
                                        },
                                        //what to do when a group concludes
                                        writeLine = function taskrunner_simulations_shell_child_childExec_writeLine(item) {
                                            var fail          = 0,
                                                failper       = 0,
                                                plural        = "",
                                                groupn        = single
                                                    ? ""
                                                    : " for group: \u001B[39m\u001B[33m" + groupname[depth] + "\u001B[39m",
                                                totaln        = single
                                                    ? ""
                                                    : " in current group, " + total + " total",
                                                status        = (item[1] === "pass")
                                                    ? humantime(false) + "\u001B[32mPass\u001B[39m test "
                                                    : humantime(false) + "\u001B[31mFail\u001B[39m test ",
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
                                                            console.log(tab.slice(tablen) + "\u001B[32mThe test passed" + groupn + "\u001B[39m");
                                                        } else {
                                                            console.log(tab.slice(tablen) + "\u001B[32mAll " + grouplen[depth] + " tests/groups passed" + groupn + "\u001B[39m");
                                                        }
                                                        groupPass = true;
                                                    } else {
                                                        if (passcount[depth] === 0) {
                                                            if (grouplen[depth] === 1) {
                                                                console.log(tab.slice(tablen) + "\u001B[31mThe test failed" + groupn + "\u001B[39m");
                                                            } else {
                                                                console.log(tab.slice(tablen) + "\u001B[31mAll " + grouplen[depth] + " tests/groups failed" + groupn + "\u001B[39m");
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
                                                            console.log(tab.slice(tablen) + "\u001B[31m" + fail + "\u001B[39m test" + plural + " (" + failper.toFixed(0) + "%) failed of \u001B[32m" + finished[depth] + "\u001B[39m tests" + groupn + ".");
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
                                                        groupn          = " for group: \u001B[39m\u001B[33m" + groupname[depth] + "\u001B[39m";
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
                                                            console.log("\u001B[32mPassed all " + total + " test" + plural + " from all " + gcount + " groups.\u001B[39m");
                                                            console.log("");
                                                            console.log("\u001B[32mCLI simulation complete\u001B[39m");
                                                            return next();
                                                        }
                                                        if (fails === total) {
                                                            errout("\u001B[31mFailed all " + total + " test" + plural + " from all " + gcount + " groups.\u001B[39m");
                                                        } else {
                                                            // a hack, this should not increment when a test failure occurred in a child
                                                            // group
                                                            fgroup -= 1;
                                                            if (fgroup === 1) {
                                                                groupn = "";
                                                            }
                                                            errout("\u001B[31mFailed " + fails + " test" + totaln + " from " + fgroup + " group" + groupn + "\u001B[39m out of " + total + " total tests across " + gcount + " group" + status + ".");
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
                                                            var execCallback = function taskrunner_simulations_shell_child_writeLine_teardown_task_exec(err, stdout, stderr) {
                                                                a += 1;
                                                                if (typeof err === "string") {
                                                                    console.log(err);
                                                                    if (err.indexOf("The directory is not empty.") > 0) {
                                                                        console.log("(err) Async error in Windows file system.  Trying one more time...");
                                                                        a -= 1;
                                                                        return setTimeout(childExec(tasks[a], taskrunner_simulations_shell_child_writeLine_teardown_task_exec), 1000);
                                                                    }
                                                                } else if (typeof stderr === "string" && stderr !== "") {
                                                                    console.log(stderr);
                                                                    if (stderr.indexOf("The directory is not empty.") > 0) {
                                                                        console.log("(stderr) Async error in Windows file system.  Trying one more time...");
                                                                        a -= 1;
                                                                        return setTimeout(childExec(tasks[a], taskrunner_simulations_shell_child_writeLine_teardown_task_exec), 1000);
                                                                    }
                                                                } else {
                                                                    if (stdout.indexOf("The directory s not empty.") > 0) {
                                                                        console.log("(stdout) Async error in Windows file system.  Trying one more time...");
                                                                        a -= 1;
                                                                        return setTimeout(childExec(tasks[a], taskrunner_simulations_shell_child_writeLine_teardown_task_exec), 1000);
                                                                    }
                                                                    if (a === len) {
                                                                        console.log(tab + "\u001B[36mTeardown\u001B[39m for group: \u001B[33m" + groupname[depth] + "\u001B[39m \u001B[32mcomplete\u001B[39m.");
                                                                        console.log("");
                                                                        groupEnd();
                                                                        return stdout;
                                                                    }
                                                                    taskrunner_simulations_shell_child_writeLine_teardown_task();
                                                                }
                                                            };
                                                            if (typeof tasks[a] === "function") {
                                                                tasks[a]();
                                                            } else {
                                                                tasks[a] = slashfix(tasks[a]);
                                                                console.log(tab + "  " + tasks[a]);
                                                                childExec(tasks[a], execCallback);
                                                            }
                                                        };
                                                    console.log("");
                                                    console.log(tab + "\u001B[36mTeardown\u001B[39m for group: \u001B[33m" + groupname[depth] + "\u001B[39m \u001B[36mstarted\u001B[39m.");
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
                                                    console.log(tab.slice(tablen) + "\u001B[36mTest group: \u001B[39m\u001B[33m" + groupname[depth] + "\u001B[39m");
                                                } else {
                                                    console.log(tab.slice(tablen) + "Test unit " + (finished[depth - 1] + 1) + " of " + grouplen[depth - 1] + ", \u001B[36mtest group: \u001B[39m\u001B[33m" + groupname[depth] + "\u001B[39m");
                                                }
                                            }
                                            console.log("");
                                            console.log(tab.slice(tab.length - 2) + "\u001B[36m*\u001B[39m " + item[0]);
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
                                    stdout = stdout.replace(/<strong>Execution\u0020time:<\/strong>\u0020<em>([0-9]+\u0020hours\u0020)?([0-9]+\u0020minutes\u0020)?[0-9]+(\.[0-9]+)?\u0020seconds\u0020<\/em>/g, "<strong>Execution time:</strong> <em>0</em>");
                                    stdout = stdout.replace(/Executed\u0020in\u0020([0-9]+\u0020hours?\u0020)?([0-9]+\u0020minutes?\u0020)?[0-9]+(\.[0-9]+)?\u0020seconds?/g, "Executed in");
                                    stdout = stdout.replace(/\u0020\d+\u0020files?\./, " x files.");
                                    stdout = stdout.replace(/20\d{6}/, "20999999");
                                    //determine pass/fail status of a given test unit
                                    if (stdout.indexOf("Source file at ") > -1 && stdout.indexOf("is \u001B[31mempty\u001B[39m but the diff file is not.") > 0) {
                                        stdout = stdout.slice(0, stdout.indexOf("Source file at") + 14) + " - " + stdout.slice(stdout.indexOf("is \u001B[31mempty\u001B[39m but the diff file is not."));
                                    } else if (stdout.indexOf("Diff file at ") > -1 && stdout.indexOf("is \u001B[31mempty\u001B[39m but the source file is not.") > 0) {
                                        stdout = stdout.slice(0, stdout.indexOf("Diff file at") + 12) + " - " + stdout.slice(stdout.indexOf("is \u001B[31mempty\u001B[39m but the source file is not."));
                                    }
                                    if (stdout.indexOf("Pretty Diff found 0 differences.") < 0) {
                                        stdout = stdout.replace(/Pretty\u0020Diff\u0020found\u0020\d+\u0020differences./, "Pretty Diff found x differences.");
                                    }
                                    if (typeof err === "string") {
                                        data.push("fail");
                                        data.push(err);
                                    } else if (typeof stderr === "string" && stderr !== "") {
                                        data.push("fail");
                                        data.push(stderr);
                                    } else if (stdout !== param.verify) {
                                        if (typeof param.verify === "string" || (typeof param.verify !== "string" && param.verify.length === 0)) {
                                            data.push("fail");
                                            data.push("Unexpected output:");
                                            failflag = true;
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
                                    if (failflag === true) {
                                        failflag = false;
                                        diffFiles("phases.simulations", stdout, param.verify);
                                    }
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
                                                console.log("\u001B[31mError:\u001B[39m " + err);
                                                console.log("Terminated early");
                                            } else if (typeof stderr === "string" && stderr !== "") {
                                                console.log("\u001B[31mError:\u001B[39m " + stderr);
                                                console.log("Terminated early");
                                            } else {
                                                if (a < len) {
                                                    taskrunner_simulations_shell_buildup_task();
                                                } else {
                                                    console.log(tab + "\u001B[36mBuildup\u001B[39m for group: \u001B[33m" + testData.group + "\u001B[39m \u001B[32mcomplete\u001B[39m.");
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
                                        if (typeof tasks[a] === "function") {
                                            tasks[a]();
                                            a += 1;
                                            if (a < len) {
                                                taskrunner_simulations_shell_buildup_task();
                                            }
                                        } else if (path.sep === "\\" && (/^(echo\s+("|'))/).test(tasks[a]) === true) {
                                            tasks[a]       = slashfix(tasks[a]);
                                            //windows will write CLI strings to files including the containing quotes
                                            options.source = tasks[a];
                                            options.mode   = "parse";
                                            options.lang   = "javascript";
                                            echo           = prettydiff(options);
                                            fs.writeFile(echo.data.token.slice(3).join("").replace(/(x?;)$/, ""), echo.data.token[1].slice(1, echo.data.token[1].length - 1), buildstep);
                                        } else {
                                            tasks[a] = slashfix(tasks[a]);
                                            childExec(tasks[a], buildstep);
                                        }
                                    };
                                console.log("");
                                console.log(tab + "\u001B[36mBuildup\u001B[39m for group: \u001B[33m" + testData.group + "\u001B[39m \u001B[36mstarted\u001B[39m.");
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
                console.log("\u001B[36mCLI simulation tests\u001B[39m");
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
            humantime(true);
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
