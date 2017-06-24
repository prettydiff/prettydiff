/*jslint node:true*/
/*jshint laxbreak: true*/
// The order array determines which tests run in which order (from last to first
// index)
module.exports = (function taskrunner() {
    "use strict";
    var order      = [
            "lint", //        - run jslint on all unexcluded files in the repo
            "coreunits", //   - run a variety of files through the application and compare the result to a known good file
            //"diffunits",    - unit tests for the diff process
            "simulations" //  - simulate a variety of execution steps and options from the command line
        ],
        startTime  = process.hrtime(),
        node       = {
            child: require("child_process").exec,
            fs   : require("fs"),
            path : require("path")
        },
        humantime  = function taskrunner_humantime(finished) {
            var minuteString = "",
                hourString   = "",
                secondString = "",
                finalTime    = "",
                finalMem     = "",
                strSplit     = [],
                minutes      = 0,
                hours        = 0,
                elapsed      = (function taskrunner_humantime_elapsed() {
                    var endtime = process.hrtime(),
                        dtime = [endtime[0] - startTime[0], endtime[1] - startTime[1]];
                    if (dtime[1] === 0) {
                        return dtime[0];
                    }
                    if (dtime[1] < 0) {
                        dtime[1] = ((1000000000 + endtime[1]) - startTime[1]);
                    }
                    return dtime[0] + (dtime[1] / 1000000000);
                }()),
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
                                a = a - 1;
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
            secondString = elapsed + "";
            strSplit     = secondString.split(".");
            if (strSplit[1].length < 9) {
                do {
                    strSplit[1]  = strSplit[1] + 0;
                } while (strSplit[1].length < 9);
                secondString = strSplit[0] + "." + strSplit[1];
            } else if (strSplit[1].length > 9) {
                secondString = strSplit[0] + "." + strSplit[1].slice(0, 9);
            }
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
                return "\u001B[36m[" + hourString + ":" + minuteString + ":" +
                        secondString + "]\u001B[39m ";
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
                pdlen  = 0,
                plus   = "",
                plural = "",
                output = [],
                report = [],
                total  = 0;
            options.mode    = "diff";
            options.source  = sampleSource;
            options.diff    = sampleDiff;
            options.diffcli = true;
            options.context = 2;
            options.lang    = "text";
            output          = prettydiff(options);
            report          = output;
            pdlen           = report.length;
            total           = global.prettydiff.meta.difftotal;
            if (total > 50) {
                plus = "+";
            }
            if (total !== 1) {
                plural = "s";
            }
            // report indexes from diffcli feature of diffview.js 0 - source line number 1 -
            // source code line 2 - diff line number 3 - diff code line 4 - change 5 - index
            // of options.context (not parallel) 6 - total count of differences
            do {
                if (report[aa].indexOf("\u001b[36m") === 0) {
                    console.log("\u001b[36m" + sampleName + "\u001b[36m");
                }
                console.log(report[aa]);
                aa = aa + 1;
            } while (aa < pdlen);
            if (sampleName !== "phases.simulations") {
                console.log("");
                console.log(
                    total + plus + " \u001b[32mdifference" + plural + " counted.\u001b[39m"
                );
                errout(
                    "Pretty Diff \u001b[31mfailed\u001b[39m on file: \u001b[36m" + sampleName + "" +
                    "\u001b[39m"
                );
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
                            methodchain : "indent",
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
                        for (a = 0; a < len; a = a + 1) {
                            if (raw[a] === undefined || correct[a] === undefined) {
                                if (raw[a] === undefined) {
                                    console.log(
                                        "\u001B[33msamples_raw directory is missing file:\u001B[39m " + correct[a][0]
                                    );
                                    correct.splice(a, 1);
                                } else {
                                    console.log(
                                        "\u001B[33msamples_correct directory is missing file:\u001B[39m " + raw[a][0]
                                    );
                                    raw.splice(a, 1);
                                }
                                len = (raw.length > correct.length)
                                    ? raw.length
                                    : correct.length;
                                a   = a - 1;
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
                                    filecount = filecount + 1;
                                    console.log(
                                        humantime(false) + "\u001B[32mPass " + filecount + ":\u001B[39m " + correct[a][0]
                                    );
                                    if (a === len - 1) {
                                        return next();
                                    }
                                } else {
                                    diffFiles(correct[a][0], output, correct[a][1]);
                                }
                            } else {
                                if (raw[a][0] < correct[a][0]) {
                                    console.log(
                                        "\u001B[33mCorrect samples directory is missing file:\u001B[39m " + raw[a][0]
                                    );
                                    raw.splice(a, 1);
                                } else {
                                    console.log(
                                        "\u001B[33mRaw samples directory is missing file:\u001B[39m " + correct[a][0]
                                    );
                                    correct.splice(a, 1);
                                }
                                len = (raw.length > correct.length)
                                    ? raw.length
                                    : correct.length;
                                a   = a - 1;
                                if (a === len - 1) {
                                    return next();
                                }
                            }
                        }
                    },
                    readDir = function taskrunner_coreunits_readDir(type) {
                        var dirpath = __dirname + "/samples_" + type;
                        node.fs.readdir(dirpath, function taskrunner_coreunits_readDir_callback(err, list) {
                            var pusher = function taskrunner_coreunits_readDir_callback_pusher(
                                val,
                                ind,
                                arr
                            ) {
                                node.fs.readFile(
                                    __dirname + "/samples_" + type + "/" + val,
                                    "utf8",
                                    function taskrunner_coreunits_readDir_callback_pusher_readFile(erra, fileData) {
                                        if (erra !== null && erra !== undefined) {
                                            errout("Error reading file: " + __dirname + "/samples_" + type + "/" + val);
                                        } else if (type === "raw") {
                                            raw.push([val, fileData]);
                                            countr = countr + 1;
                                            if (countr === arr.length) {
                                                utflag.raw = true;
                                                if (utflag.correct === true) {
                                                    compare("");
                                                }
                                            }
                                        } else if (type === "correct") {
                                            correct.push([val, fileData]);
                                            countc = countc + 1;
                                            if (countc === arr.length) {
                                                utflag.correct = true;
                                                if (utflag.raw === true) {
                                                    compare("");
                                                }
                                            }
                                        }
                                        return ind;
                                    }
                                );
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
                        "biddle",
                        "bin",
                        "coverage",
                        "guide",
                        "ignore",
                        "jslint",
                        "node_modules",
                        "test/barebones",
                        "test/samples_correct",
                        "test/samples_raw"
                    ],
                    flag            = {
                        files: false,
                        items: false
                    },
                    files           = [],
                    jslint          = require(".." + node.path.sep + "jslint" + node.path.sep + "jslint"),
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
                                    ecount = ecount + 1;
                                    console.log("On line " + warning.line + " at column: " + warning.column);
                                    console.log(warning.message);
                                    console.log("");
                                };
                            options.source = val[1];
                            result         = jslint(prettydiff(options), {"for": true});
                            if (result.ok === true) {
                                console.log(
                                    humantime(false) + "\u001B[32mLint is good for file " + (
                                        ind + 1
                                    ) + ":\u001B[39m " + val[0]
                                );
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
                                    console.log(
                                        humantime(false) + "\u001B[32mLint is good for file " + (
                                            ind + 1
                                        ) + ":\u001B[39m " + val[0]
                                    );
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
                            methodchain : "indent",
                            mode        : "beautify",
                            nocaseindent: false,
                            objsort     : "all",
                            preserve    : 2,
                            styleguide  : "jslint",
                            wrap        : 80
                        };
                        files.forEach(lintit);
                    };
                console.log("");
                console.log("");
                console.log("\u001B[36mBeautifying and Linting\u001B[39m");
                console.log(
                    "** Note that line numbers of error messaging reflects beautified code line."
                );
                console.log("");
                (function taskrunner_lint_getFiles() {
                    var fc       = 0,
                        ft       = 0,
                        total    = 0,
                        count    = 0,
                        idLen    = ignoreDirectory.length,
                        readFile = function taskrunner_lint_getFiles_readFile(filePath) {
                            node.fs.readFile(
                                filePath,
                                "utf8",
                                function taskrunner_lint_getFiles_readFile_callback(err, data) {
                                    if (err !== null && err !== undefined) {
                                        errout(err);
                                    }
                                    fc = fc + 1;
                                    if (ft === fc) {
                                        flag.files = true;
                                    }
                                    files.push([
                                        filePath.slice(filePath.indexOf(node.path.sep + "prettydiff" + node.path.sep) + 12),
                                        data
                                    ]);
                                    if (flag.files === true && flag.items === true) {
                                        lintrun();
                                    }
                                }
                            );
                        },
                        readDir  = function taskrunner_lint_getFiles_readDir(filepath) {
                            node.fs.readdir(
                                filepath,
                                function taskrunner_lint_getFiles_readDir_callback(erra, list) {
                                    var fileEval = function taskrunner_lint_getFiles_readDir_callback_fileEval(val) {
                                        var filename = filepath + node.path.sep + val;
                                        node.fs.stat(
                                            filename,
                                            function taskrunner_lint_getFiles_readDir_callback_fileEval_stat(errb, stat) {
                                                var a         = 0,
                                                    ignoreDir = false,
                                                    dirtest   = filepath.replace(/\\/g, "/") + "/" + val;
                                                if (errb !== null) {
                                                    return errout(errb);
                                                }
                                                count = count + 1;
                                                if (count === total) {
                                                    flag.items = true;
                                                }
                                                if (stat.isFile() === true && (/(\.js)$/).test(val) === true) {
                                                    ft = ft + 1;
                                                    readFile(filename);
                                                }
                                                if (stat.isDirectory() === true) {
                                                    do {
                                                        if (dirtest.indexOf(ignoreDirectory[a]) === dirtest.length - ignoreDirectory[a].length) {
                                                            ignoreDir = true;
                                                            break;
                                                        }
                                                        a = a + 1;
                                                    } while (a < idLen);
                                                    if (ignoreDir === true) {
                                                        if (flag.files === true && flag.items === true) {
                                                            lintrun();
                                                        }
                                                    } else {
                                                        taskrunner_lint_getFiles_readDir(filename);
                                                    }
                                                }
                                            }
                                        );
                                    };
                                    if (erra !== null) {
                                        return errout("Error reading path: " + filepath + "\n" + erra);
                                    }
                                    total = total + list.length;
                                    list.forEach(fileEval);
                                }
                            );
                        };
                    readDir(__dirname.replace(/((\/|\\)test)$/, ""));
                }());
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
                                    node.fs.mkdir(
                                        "test/simulation",
                                        function taskrunner_simulations_buildup0_callback(err) {
                                            if (err !== null) {
                                                return errout(err);
                                            }
                                        }
                                    );
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
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen" +
                                                    "\" mode:\"beautify\"",
                                            name  : "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen" +
                                                    "\" mode:\"minify\"",
                                            name  : "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen" +
                                                    "\" mode:\"parse\"",
                                            name  : "Parse markup.",
                                            verify: "{\"data\":{\"attrs\":[{},{},{},{},{}],\"begin\":[0,0,1,1,0],\"daddy\":[\"root" +
                                                    "\",\"a\",\"b\",\"b\",\"a\"],\"jscom\":[false,false,false,false,false],\"linen" +
                                                    "\":[1,1,1,1,1],\"lines\":[0,0,1,1,0],\"presv\":[false,false,false,false,false]" +
                                                    ",\"token\":[\"<a>\",\"<b>\",\"<c/>\",\"</b>\",\"</a>\"],\"types\":[\"start\"," +
                                                    "\"start\",\"singleton\",\"end\",\"end\"]},\"definition\":{\"attrs\":\"array - " +
                                                    "List of attributes (if any) for the given token.\",\"begin\":\"number - Index " +
                                                    "where the parent element occurs.\",\"daddy\":\"string - Tag name of the parent" +
                                                    " element. Tokens of type 'template_start' are not considered as parent element" +
                                                    "s.  End tags reflect their matching start tag.\",\"jscom\":\"boolean - Whether" +
                                                    " the token is a JavaScript comment if in JSX format.\",\"linen\":\"number - Th" +
                                                    "e line number in the original source where the token started, which is used fo" +
                                                    "r reporting and analysis.\",\"lines\":\"number - Whether the token is preceede" +
                                                    "d any space and/or line breaks in the original code source.\",\"presv\":\"bool" +
                                                    "ean - Whether the token is preserved verbatim as found.  Useful for comments a" +
                                                    "nd HTML 'pre' tags.\",\"token\":\"string - The parsed code tokens.\",\"types\"" +
                                                    ":\"string - Data types of the tokens: cdata, comment, conditional, content, en" +
                                                    "d, ignore, linepreserve, script, sgml, singleton, start, template, template_el" +
                                                    "se, template_end, template_start, xml\"}}"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen" +
                                                    "\" mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\"",
                                            name  : "Diff markup.",
                                            verify: "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><!DOCTYPE html PUBLIC \"-//W3C//DTD" +
                                                    " XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\"><html xmlns=" +
                                                    "\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\"><head><title>Pretty Diff - Th" +
                                                    "e difference tool</title><meta name=\"robots\" content=\"index, follow\"/> <me" +
                                                    "ta name=\"DC.title\" content=\"Pretty Diff - The difference tool\"/> <link rel" +
                                                    "=\"canonical\" href=\"http://prettydiff.com/\" type=\"application/xhtml+xml\"/" +
                                                    "><meta http-equiv=\"Content-Type\" content=\"application/xhtml+xml;charset=UTF" +
                                                    "-8\"/><meta http-equiv=\"Content-Style-Type\" content=\"text/css\"/><style typ" +
                                                    "e=\"text/css\">/*<![CDATA[*/#prettydiff.canvas{background:#986 url(\"data:imag" +
                                                    "e/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuI" +
                                                    "wF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhU" +
                                                    "IIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89" +
                                                    "+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsA" +
                                                    "HvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjA" +
                                                    "FAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC" +
                                                    "3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXL" +
                                                    "h4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+" +
                                                    "rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKx" +
                                                    "EJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK" +
                                                    "5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b" +
                                                    "8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/x" +
                                                    "gNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRBy" +
                                                    "AgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvy" +
                                                    "GvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAux" +
                                                    "sNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwk" +
                                                    "DhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksq" +
                                                    "Zs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaO" +
                                                    "aUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6" +
                                                    "AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyo" +
                                                    "vVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw" +
                                                    "09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45h" +
                                                    "x+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onX" +
                                                    "CdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/V" +
                                                    "HDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJ" +
                                                    "gYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRapln" +
                                                    "utrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt" +
                                                    "8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVO" +
                                                    "b00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeW" +
                                                    "TNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/" +
                                                    "MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj" +
                                                    "4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T" +
                                                    "6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F" +
                                                    "5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kg" +
                                                    "qTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlh" +
                                                    "bL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsI" +
                                                    "S4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6" +
                                                    "wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6eb" +
                                                    "eLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdt" +
                                                    "WHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6" +
                                                    "217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL" +
                                                    "2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ" +
                                                    "752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nue" +
                                                    "r21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3Yf" +
                                                    "VP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/" +
                                                    "suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8" +
                                                    "o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEFdaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwY" +
                                                    "WNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXR" +
                                                    "hIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxN" +
                                                    "CA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5" +
                                                    "zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgI" +
                                                    "DxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDo" +
                                                    "vL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9uc" +
                                                    "y5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnM" +
                                                    "uYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zO" +
                                                    "nN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICA" +
                                                    "gICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgI" +
                                                    "CAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyI" +
                                                    "KICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgI" +
                                                    "CAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICA" +
                                                    "gICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwve" +
                                                    "G1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjoyNDo" +
                                                    "zOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtM" +
                                                    "DEtMTNUMTM6MTg6MDctMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ" +
                                                    "5RGF0ZT4yMDE2LTAxLTEzVDEzOjE4OjA3LTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgP" +
                                                    "HhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iYjM5NjA0MDV" +
                                                    "hOWQ8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY" +
                                                    "2lkOnBob3Rvc2hvcDoxYzM3NjE4MS1mOWU4LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkR" +
                                                    "vY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0Z" +
                                                    "TI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4" +
                                                    "KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgI" +
                                                    "CAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN" +
                                                    "0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2d" +
                                                    "DppbnN0YW5jZUlEPnhtcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9" +
                                                    "zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyV" +
                                                    "DEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHd" +
                                                    "hcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhc" +
                                                    "mVBZ2VudD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmR" +
                                                    "mOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhd" +
                                                    "mVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5" +
                                                    "paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEP" +
                                                    "gogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9" +
                                                    "zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQa" +
                                                    "G90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICA" +
                                                    "gICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgP" +
                                                    "C9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgo" +
                                                    "gICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgI" +
                                                    "CAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHR" +
                                                    "vIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgI" +
                                                    "CAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJ" +
                                                    "lc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0a" +
                                                    "W9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWM" +
                                                    "wZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgI" +
                                                    "CAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICA" +
                                                    "gICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwM" +
                                                    "TQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV" +
                                                    "2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgI" +
                                                    "CAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICA" +
                                                    "gICAgPHN0RXZ0OmFjdGlvbj5kZXJpdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgI" +
                                                    "DxzdEV2dDpwYXJhbWV0ZXJzPmNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG9" +
                                                    "0b3Nob3AgdG8gaW1hZ2UvcG5nPC9zdEV2dDpwYXJhbWV0ZXJzPgogICAgICAgICAgICAgICA8L3JkZ" +
                                                    "jpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICA" +
                                                    "gICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgI" +
                                                    "CAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1" +
                                                    "iYjM5NjA0MDVhOWQ8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3a" +
                                                    "GVuPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICA" +
                                                    "gIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpP" +
                                                    "C9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9" +
                                                    "zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U" +
                                                    "2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSB" +
                                                    "yZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtc" +
                                                    "C5paWQ6ODNhNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjppbnN0YW5jZUl" +
                                                    "EPgogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOjgzYTc5MGFkLWMwZWQtNGIzY" +
                                                    "S05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RSZWY6ZG9jdW1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9" +
                                                    "yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3N" +
                                                    "DAzMTwvc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8L3htcE1NOkRlcml2ZWRGcm9" +
                                                    "tPgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvd" +
                                                    "G9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9" +
                                                    "wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgI" +
                                                    "CAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjp" +
                                                    "YUmVzb2x1dGlvbj4zMDAwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZ" +
                                                    "jpZUmVzb2x1dGlvbj4zMDAwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGl" +
                                                    "mZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb" +
                                                    "2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9" +
                                                    "uPjQ8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+N" +
                                                    "DwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjp" +
                                                    "SREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                    "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+bleIyQAAACBjSFJNAAB6JQAAgIMAAPn/A" +
                                                    "ACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAANElEQVR42mJ89+4uAwMDAwPD6lkTGd69u/vu3d2ZHXn" +
                                                    "v3t1lgLPevbvLrCTIEJqWD1EJGADaTRll80WcLAAAAABJRU5ErkJggg==\");color:#420}#prett" +
                                                    "ydiff.canvas *:focus{outline:0.1em dashed #f00}#prettydiff.canvas a{color:#039" +
                                                    "}#prettydiff.canvas .contentarea,#prettydiff.canvas legend,#prettydiff.canvas " +
                                                    "fieldset select,#prettydiff.canvas .diff td,#prettydiff.canvas .report td,#pre" +
                                                    "ttydiff.canvas .data li,#prettydiff.canvas .diff-right,#prettydiff.canvas fiel" +
                                                    "dset input{background:#eeeee8;border-color:#420}#prettydiff.canvas select,#pre" +
                                                    "ttydiff.canvas input,#prettydiff.canvas .diff,#prettydiff.canvas .beautify,#pr" +
                                                    "ettydiff.canvas .report,#prettydiff.canvas .beautify h3,#prettydiff.canvas .di" +
                                                    "ff h3,#prettydiff.canvas .beautify h4,#prettydiff.canvas .diff h4,#prettydiff." +
                                                    "canvas #report,#prettydiff.canvas #report .author,#prettydiff.canvas fieldset{" +
                                                    "background:#ddddd8;border-color:#420}#prettydiff.canvas fieldset fieldset{back" +
                                                    "ground:#eeeee8}#prettydiff.canvas fieldset fieldset input,#prettydiff.canvas f" +
                                                    "ieldset fieldset select{background:#ddddd8}#prettydiff.canvas h2,#prettydiff.c" +
                                                    "anvas h2 button,#prettydiff.canvas h3,#prettydiff.canvas legend{color:#900}#pr" +
                                                    "ettydiff.canvas .contentarea{box-shadow:0 1em 1em #b8a899}#prettydiff.canvas ." +
                                                    "segment{background:#fff}#prettydiff.canvas h2 button,#prettydiff.canvas .segme" +
                                                    "nt,#prettydiff.canvas ol.segment li{border-color:#420}#prettydiff.canvas th{ba" +
                                                    "ckground:#e8ddcc}#prettydiff.canvas li h4{color:#06f}#prettydiff.canvas code{b" +
                                                    "ackground:#eee;border-color:#eee;color:#00f}#prettydiff.canvas ol.segment h4 s" +
                                                    "trong{color:#c00}#prettydiff.canvas button{background-color:#ddddd8;border-col" +
                                                    "or:#420;box-shadow:0 0.25em 0.5em #b8a899;color:#900}#prettydiff.canvas button" +
                                                    ":hover{background-color:#ccb;border-color:#630;box-shadow:0 0.25em 0.5em #b8a8" +
                                                    "99;color:#630}#prettydiff.canvas th{background:#ccccc8}#prettydiff.canvas thea" +
                                                    "d th,#prettydiff.canvas th.heading{background:#ccb}#prettydiff.canvas .diff h3" +
                                                    "{background:#ddd;border-color:#999}#prettydiff.canvas td,#prettydiff.canvas th" +
                                                    ",#prettydiff.canvas .segment,#prettydiff.canvas .count li,#prettydiff.canvas ." +
                                                    "data li,#prettydiff.canvas .diff-right{border-color:#ccccc8}#prettydiff.canvas" +
                                                    " .count{background:#eed;border-color:#999}#prettydiff.canvas .count li.fold{co" +
                                                    "lor:#900}#prettydiff.canvas h2 button{background:#f8f8f8;box-shadow:0.1em 0.1e" +
                                                    "m 0.25em #ddd}#prettydiff.canvas li h4{color:#00f}#prettydiff.canvas code{back" +
                                                    "ground:#eee;border-color:#eee;color:#009}#prettydiff.canvas ol.segment h4 stro" +
                                                    "ng{color:#c00}#prettydiff.canvas .data .delete{background:#ffd8d8}#prettydiff." +
                                                    "canvas .data .delete em{background:#fff8f8;border-color:#c44;color:#900}#prett" +
                                                    "ydiff.canvas .data .insert{background:#d8ffd8}#prettydiff.canvas .data .insert" +
                                                    " em{background:#f8fff8;border-color:#090;color:#363}#prettydiff.canvas .data ." +
                                                    "replace{background:#fec}#prettydiff.canvas .data .replace em{background:#ffe;b" +
                                                    "order-color:#a86;color:#852}#prettydiff.canvas .data .empty{background:#ddd}#p" +
                                                    "rettydiff.canvas .data em.s0{color:#000}#prettydiff.canvas .data em.s1{color:#" +
                                                    "f66}#prettydiff.canvas .data em.s2{color:#12f}#prettydiff.canvas .data em.s3{c" +
                                                    "olor:#090}#prettydiff.canvas .data em.s4{color:#d6d}#prettydiff.canvas .data e" +
                                                    "m.s5{color:#7cc}#prettydiff.canvas .data em.s6{color:#c85}#prettydiff.canvas ." +
                                                    "data em.s7{color:#737}#prettydiff.canvas .data em.s8{color:#6d0}#prettydiff.ca" +
                                                    "nvas .data em.s9{color:#dd0}#prettydiff.canvas .data em.s10{color:#893}#pretty" +
                                                    "diff.canvas .data em.s11{color:#b97}#prettydiff.canvas .data em.s12{color:#bbb" +
                                                    "}#prettydiff.canvas .data em.s13{color:#cc3}#prettydiff.canvas .data em.s14{co" +
                                                    "lor:#333}#prettydiff.canvas .data em.s15{color:#9d9}#prettydiff.canvas .data e" +
                                                    "m.s16{color:#880}#prettydiff.canvas .data .l0{background:#eeeee8}#prettydiff.c" +
                                                    "anvas .data .l1{background:#fed}#prettydiff.canvas .data .l2{background:#def}#" +
                                                    "prettydiff.canvas .data .l3{background:#efe}#prettydiff.canvas .data .l4{backg" +
                                                    "round:#fef}#prettydiff.canvas .data .l5{background:#eef}#prettydiff.canvas .da" +
                                                    "ta .l6{background:#fff8cc}#prettydiff.canvas .data .l7{background:#ede}#pretty" +
                                                    "diff.canvas .data .l8{background:#efc}#prettydiff.canvas .data .l9{background:" +
                                                    "#ffd}#prettydiff.canvas .data .l10{background:#edc}#prettydiff.canvas .data .l" +
                                                    "11{background:#fdb}#prettydiff.canvas .data .l12{background:#f8f8f8}#prettydif" +
                                                    "f.canvas .data .l13{background:#ffb}#prettydiff.canvas .data .l14{background:#" +
                                                    "eec}#prettydiff.canvas .data .l15{background:#cfc}#prettydiff.canvas .data .l1" +
                                                    "6{background:#eea}#prettydiff.canvas .data .c0{background:inherit}#prettydiff." +
                                                    "canvas #report p em{color:#060}#prettydiff.canvas #report p strong{color:#009}" +
                                                    "#prettydiff.shadow{background:#333 url(\"data:image/png;base64,iVBORw0KGgoAAAA" +
                                                    "NSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob" +
                                                    "3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcE" +
                                                    "RRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRN" +
                                                    "YAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQpl" +
                                                    "cAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVA" +
                                                    "aCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGD" +
                                                    "IIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBN" +
                                                    "A/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qI" +
                                                    "l7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14" +
                                                    "L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcU" +
                                                    "l0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZ" +
                                                    "kmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQii" +
                                                    "GzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIB" +
                                                    "BKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogv" +
                                                    "QZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu" +
                                                    "4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1h" +
                                                    "ILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkn" +
                                                    "eTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR" +
                                                    "1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3G" +
                                                    "K+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZ" +
                                                    "VM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq" +
                                                    "4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y" +
                                                    "0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1r" +
                                                    "i6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8f" +
                                                    "b8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx" +
                                                    "83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1ru" +
                                                    "tu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdW" +
                                                    "h1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lps" +
                                                    "bxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ" +
                                                    "0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r" +
                                                    "/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pD" +
                                                    "oVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo" +
                                                    "3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZAT" +
                                                    "IhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLx" +
                                                    "MDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2Q" +
                                                    "qboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxeds" +
                                                    "K4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGn" +
                                                    "Rs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO3" +
                                                    "19kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7Jv" +
                                                    "ttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3" +
                                                    "vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3" +
                                                    "nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDv" +
                                                    "OXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeO" +
                                                    "T3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYP" +
                                                    "P/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/b" +
                                                    "Xyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GM" +
                                                    "zLdsAAEQFaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9I" +
                                                    "lc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1" +
                                                    "ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvM" +
                                                    "jAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5" +
                                                    "vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmO" +
                                                    "mFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4" +
                                                    "wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tb" +
                                                    "S8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R" +
                                                    "5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvY" +
                                                    "mUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR" +
                                                    "0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvc" +
                                                    "D0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGl" +
                                                    "mZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9I" +
                                                    "mh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5" +
                                                    "BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgI" +
                                                    "CAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOkNyZWF0ZUR" +
                                                    "hdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtMDEtMTNUMTU6MTE6MzMtMDY6MDA8L" +
                                                    "3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTEzVDE1OjE" +
                                                    "xOjMzLTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wL" +
                                                    "mlpZDo4MDAwYTE3Zi1jZTY1LTQ5NTUtYjFmMS05YjVkODIwNDIyNjU8L3htcE1NOkluc3RhbmNlSUQ" +
                                                    "+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZmZhNDk1Y" +
                                                    "y1mYTU2LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx" +
                                                    "4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02O" +
                                                    "DEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3R" +
                                                    "vcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZ" +
                                                    "VR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9" +
                                                    "zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6N" +
                                                    "mIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZUlEPgogICA" +
                                                    "gICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2d" +
                                                    "Dp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3N" +
                                                    "ob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgI" +
                                                    "CAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2U" +
                                                    "iPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgI" +
                                                    "CAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ" +
                                                    "3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c" +
                                                    "3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICA" +
                                                    "gICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFja" +
                                                    "W50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5" +
                                                    "nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgI" +
                                                    "CAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3R" +
                                                    "FdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0O" +
                                                    "nBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9" +
                                                    "iZS5waG90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogI" +
                                                    "CAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICA" +
                                                    "gICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgI" +
                                                    "CA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWR" +
                                                    "mMzVhMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxN" +
                                                    "i0wMS0xM1QxMzoxMzoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ" +
                                                    "0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0O" +
                                                    "nNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmN" +
                                                    "oYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZ" +
                                                    "jpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZ" +
                                                    "lZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAua" +
                                                    "WlkOjA0ZGYyNDk5LWE1NTktNDE4MC1iNjA1LWI2MTk3MWMxNWEwMzwvc3RFdnQ6aW5zdGFuY2VJRD4" +
                                                    "KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc" +
                                                    "3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGh" +
                                                    "vdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgI" +
                                                    "CAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDw" +
                                                    "vcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KI" +
                                                    "CAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZWQ8L3N0RXZ0OmFjdGlvbj4KICA" +
                                                    "gICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvY" +
                                                    "mUucGhvdG9zaG9wIHRvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz4KICAgICAgICAgICAgICA" +
                                                    "gPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiP" +
                                                    "gogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICA" +
                                                    "gICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gYXBwbGljYXRpb" +
                                                    "24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICA" +
                                                    "gICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9I" +
                                                    "lJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN" +
                                                    "0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgwMDBhMTdmL" +
                                                    "WNlNjUtNDk1NS1iMWYxLTliNWQ4MjA0MjI2NTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICA" +
                                                    "gICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4KI" +
                                                    "CAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDI" +
                                                    "wMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzd" +
                                                    "EV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICA" +
                                                    "gICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtc" +
                                                    "E1NOkRlcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgPHN0UmV" +
                                                    "mOmluc3RhbmNlSUQ+eG1wLmlpZDowNGRmMjQ5OS1hNTU5LTQxODAtYjYwNS1iNjE5NzFjMTVhMDM8L" +
                                                    "3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODN" +
                                                    "hNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjpkb2N1bWVudElEPgogICAgI" +
                                                    "CAgICAgICA8c3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6NmIyNGUyN2EtY2YwNy00OWQ" +
                                                    "xLTliMGQtNjgxMzExZDc0MDMxPC9zdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDwve" +
                                                    "G1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ" +
                                                    "+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgI" +
                                                    "CAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOkl" +
                                                    "DQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+C" +
                                                    "iAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24" +
                                                    "+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb" +
                                                    "24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiA" +
                                                    "gICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZ" +
                                                    "jpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlB" +
                                                    "peGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3Jpc" +
                                                    "HRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                    "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5hSvvCAAAAIGN" +
                                                    "IUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAlSURBVHjaPMYxAQAwDAMgV" +
                                                    "kv1VFFRuy9cvN0F7m66JNNhOvwBAPyqCtNeO5K2AAAAAElFTkSuQmCC\");color:#fff}#prettyd" +
                                                    "iff.shadow *:focus{outline:0.1em dashed #ff0}#prettydiff.shadow a:visited{colo" +
                                                    "r:#f93}#prettydiff.shadow a{color:#cf3}#prettydiff.shadow .contentarea,#pretty" +
                                                    "diff.shadow legend,#prettydiff.shadow fieldset select,#prettydiff.shadow .diff" +
                                                    " td,#prettydiff.shadow .report td,#prettydiff.shadow .data li,#prettydiff.shad" +
                                                    "ow .diff-right,#prettydiff.shadow fieldset input{background:#333;border-color:" +
                                                    "#666}#prettydiff.shadow select,#prettydiff.shadow input,#prettydiff.shadow .di" +
                                                    "ff,#prettydiff.shadow .beautify,#prettydiff.shadow .report,#prettydiff.shadow " +
                                                    ".beautify h3,#prettydiff.shadow .diff h3,#prettydiff.shadow .beautify h4,#pret" +
                                                    "tydiff.shadow .diff h4,#prettydiff.shadow #report,#prettydiff.shadow #report ." +
                                                    "author,#prettydiff.shadow fieldset{background:#222;border-color:#666}#prettydi" +
                                                    "ff.shadow fieldset fieldset{background:#333}#prettydiff.shadow fieldset fields" +
                                                    "et input,#prettydiff.shadow fieldset fieldset select{background:#222}#prettydi" +
                                                    "ff.shadow h2,#prettydiff.shadow h2 button,#prettydiff.shadow h3,#prettydiff.sh" +
                                                    "adow input,#prettydiff.shadow option,#prettydiff.shadow select,#prettydiff.sha" +
                                                    "dow legend{color:#ccc}#prettydiff.shadow .contentarea{box-shadow:0 1em 1em #00" +
                                                    "0}#prettydiff.shadow .segment{background:#222}#prettydiff.shadow h2 button,#pr" +
                                                    "ettydiff.shadow td,#prettydiff.shadow th,#prettydiff.shadow .segment,#prettydi" +
                                                    "ff.shadow ol.segment li{border-color:#666}#prettydiff.shadow .count li.fold{co" +
                                                    "lor:#cf3}#prettydiff.shadow th{background:#000}#prettydiff.shadow h2 button{ba" +
                                                    "ckground:#585858;box-shadow:0.1em 0.1em 0.25em #000}#prettydiff.shadow li h4{c" +
                                                    "olor:#ff0}#prettydiff.shadow code{background:#585858;border-color:#585858;colo" +
                                                    "r:#ccf}#prettydiff.shadow ol.segment h4 strong{color:#f30}#prettydiff.shadow b" +
                                                    "utton{background-color:#333;border-color:#666;box-shadow:0 0.25em 0.5em #000;c" +
                                                    "olor:#ccc}#prettydiff.shadow button:hover{background-color:#777;border-color:#" +
                                                    "aaa;box-shadow:0 0.25em 0.5em #222;color:#fff}#prettydiff.shadow th{background" +
                                                    ":#444}#prettydiff.shadow thead th,#prettydiff.shadow th.heading{background:#44" +
                                                    "4}#prettydiff.shadow .diff h3{background:#000;border-color:#666}#prettydiff.sh" +
                                                    "adow .segment,#prettydiff.shadow .data li,#prettydiff.shadow .diff-right{borde" +
                                                    "r-color:#444}#prettydiff.shadow .count li{border-color:#333}#prettydiff.shadow" +
                                                    " .count{background:#555;border-color:#333}#prettydiff.shadow li h4{color:#ff0}" +
                                                    "#prettydiff.shadow code{background:#000;border-color:#000;color:#ddd}#prettydi" +
                                                    "ff.shadow ol.segment h4 strong{color:#c00}#prettydiff.shadow .data .delete{bac" +
                                                    "kground:#300}#prettydiff.shadow .data .delete em{background:#200;border-color:" +
                                                    "#c63;color:#c66}#prettydiff.shadow .data .insert{background:#030}#prettydiff.s" +
                                                    "hadow .data .insert em{background:#010;border-color:#090;color:#6c0}#prettydif" +
                                                    "f.shadow .data .replace{background:#345}#prettydiff.shadow .data .replace em{b" +
                                                    "ackground:#023;border-color:#09c;color:#7cf}#prettydiff.shadow .data .empty{ba" +
                                                    "ckground:#111}#prettydiff.shadow .diff .author{border-color:#666}#prettydiff.s" +
                                                    "hadow .data em.s0{color:#fff}#prettydiff.shadow .data em.s1{color:#d60}#pretty" +
                                                    "diff.shadow .data em.s2{color:#aaf}#prettydiff.shadow .data em.s3{color:#0c0}#" +
                                                    "prettydiff.shadow .data em.s4{color:#f6f}#prettydiff.shadow .data em.s5{color:" +
                                                    "#0cc}#prettydiff.shadow .data em.s6{color:#dc3}#prettydiff.shadow .data em.s7{" +
                                                    "color:#a7a}#prettydiff.shadow .data em.s8{color:#7a7}#prettydiff.shadow .data " +
                                                    "em.s9{color:#ff6}#prettydiff.shadow .data em.s10{color:#33f}#prettydiff.shadow" +
                                                    " .data em.s11{color:#933}#prettydiff.shadow .data em.s12{color:#990}#prettydif" +
                                                    "f.shadow .data em.s13{color:#987}#prettydiff.shadow .data em.s14{color:#fc3}#p" +
                                                    "rettydiff.shadow .data em.s15{color:#897}#prettydiff.shadow .data em.s16{color" +
                                                    ":#f30}#prettydiff.shadow .data .l0{background:#333}#prettydiff.shadow .data .l" +
                                                    "1{background:#633}#prettydiff.shadow .data .l2{background:#335}#prettydiff.sha" +
                                                    "dow .data .l3{background:#353}#prettydiff.shadow .data .l4{background:#636}#pr" +
                                                    "ettydiff.shadow .data .l5{background:#366}#prettydiff.shadow .data .l6{backgro" +
                                                    "und:#640}#prettydiff.shadow .data .l7{background:#303}#prettydiff.shadow .data" +
                                                    " .l8{background:#030}#prettydiff.shadow .data .l9{background:#660}#prettydiff." +
                                                    "shadow .data .l10{background:#003}#prettydiff.shadow .data .l11{background:#30" +
                                                    "0}#prettydiff.shadow .data .l12{background:#553}#prettydiff.shadow .data .l13{" +
                                                    "background:#432}#prettydiff.shadow .data .l14{background:#640}#prettydiff.shad" +
                                                    "ow .data .l15{background:#562}#prettydiff.shadow .data .l16{background:#600}#p" +
                                                    "rettydiff.shadow .data .c0{background:inherit}#prettydiff.white{background:#f8" +
                                                    "f8f8 url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpA" +
                                                    "AAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFP" +
                                                    "pFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkI" +
                                                    "aKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAi" +
                                                    "zZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGA" +
                                                    "YCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABR" +
                                                    "mS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4m" +
                                                    "bI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo6" +
                                                    "2Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+" +
                                                    "H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGL" +
                                                    "c5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdY" +
                                                    "wP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrB" +
                                                    "BG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4D" +
                                                    "j1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI" +
                                                    "9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2" +
                                                    "o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFh" +
                                                    "MWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQA" +
                                                    "kmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUsp" +
                                                    "qShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0u" +
                                                    "hHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVg" +
                                                    "qtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHq" +
                                                    "meob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE" +
                                                    "5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7" +
                                                    "aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6f" +
                                                    "eeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGj" +
                                                    "UYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2B" +
                                                    "aeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZs" +
                                                    "OXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2d" +
                                                    "YzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o2" +
                                                    "6/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc" +
                                                    "+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OP" +
                                                    "zrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45" +
                                                    "wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquN" +
                                                    "m5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJ" +
                                                    "nIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQ" +
                                                    "qohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarniv" +
                                                    "N7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5euf" +
                                                    "r0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+" +
                                                    "Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJz" +
                                                    "s07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvt" +
                                                    "tXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceD" +
                                                    "Tradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2f" +
                                                    "yz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/" +
                                                    "pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xc" +
                                                    "n7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP" +
                                                    "3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70Vvv" +
                                                    "twXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADo2aVRYdFhNTDpjb20uYWRvY" +
                                                    "mUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M" +
                                                    "5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYT" +
                                                    "VAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiA" +
                                                    "gIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3lud" +
                                                    "GF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHh" +
                                                    "tbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6e" +
                                                    "G1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN" +
                                                    "0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgI" +
                                                    "CAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICA" +
                                                    "gICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvI" +
                                                    "gogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICA" +
                                                    "gICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgI" +
                                                    "CAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9" +
                                                    "4bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDE2LTAxLTEyVDEyOjI0O" +
                                                    "jM4LTA2OjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNi0" +
                                                    "wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcDpNb2RpZ" +
                                                    "nlEYXRlPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA" +
                                                    "8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOmQ1M2M3ODQzLWE1ZjItNDg0Ny04YzQzLTZlMmMwYTQ2O" +
                                                    "GJlYjwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+YWRvYmU6ZG9" +
                                                    "jaWQ6cGhvdG9zaG9wOjFjMzc2MTgxLWY5ZTgtMTE3OC05YTljLWQ4MjVkZmIwYTQ3MDwveG1wTU06R" +
                                                    "G9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjR" +
                                                    "lMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEP" +
                                                    "gogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICA" +
                                                    "gICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c" +
                                                    "3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ" +
                                                    "0Omluc3RhbmNlSUQ+eG1wLmlpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L" +
                                                    "3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJ" +
                                                    "UMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d" +
                                                    "2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2F" +
                                                    "yZUFnZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZ" +
                                                    "GY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F" +
                                                    "2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wL" +
                                                    "mlpZDpkNTNjNzg0My1hNWYyLTQ4NDctOGM0My02ZTJjMGE0NjhiZWI8L3N0RXZ0Omluc3RhbmNlSUQ" +
                                                    "+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L" +
                                                    "3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFB" +
                                                    "ob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgI" +
                                                    "CAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA" +
                                                    "8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+C" +
                                                    "iAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3N" +
                                                    "ob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6S" +
                                                    "UNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICA" +
                                                    "gIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZ" +
                                                    "XNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOll" +
                                                    "SZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmO" +
                                                    "lJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9" +
                                                    "yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+N" +
                                                    "DwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9" +
                                                    "leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJER" +
                                                    "j4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                    "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5cKgaXAAAAIGNIUk0AAHolAACAgwAA+f8AAID" +
                                                    "pAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAkSURBVHjaPMahAQAwDMCg7P+/KnsPcq4oHqpqdwNmBt3QD" +
                                                    "X8AeAUmcrZLnM4AAAAASUVORK5CYII=\")}#prettydiff.white *:focus{outline:0.1em das" +
                                                    "hed #06f}#prettydiff.white .contentarea,#prettydiff.white legend,#prettydiff.w" +
                                                    "hite fieldset select,#prettydiff.white .diff td,#prettydiff.white .report td,#" +
                                                    "prettydiff.white .data li,#prettydiff.white .diff-right,#prettydiff.white fiel" +
                                                    "dset input{background:#fff;border-color:#999}#prettydiff.white select,#prettyd" +
                                                    "iff.white input,#prettydiff.white .diff,#prettydiff.white .beautify,#prettydif" +
                                                    "f.white .report,#prettydiff.white .beautify h3,#prettydiff.white .diff h3,#pre" +
                                                    "ttydiff.white .beautify h4,#prettydiff.white .diff h4,#prettydiff.white #pdsam" +
                                                    "ples li div,#prettydiff.white #report,#prettydiff.white .author,#prettydiff.wh" +
                                                    "ite #report .author,#prettydiff.white fieldset{background:#eee;border-color:#9" +
                                                    "99}#prettydiff.white .diff h3{background:#ddd;border-color:#999}#prettydiff.wh" +
                                                    "ite fieldset fieldset{background:#ddd}#prettydiff.white .contentarea{box-shado" +
                                                    "w:0 1em 1em #999}#prettydiff.white button{background-color:#eee;border-color:#" +
                                                    "999;box-shadow:0 0.25em 0.5em #ccc;color:#666}#prettydiff.white button:hover{b" +
                                                    "ackground-color:#def;border-color:#03c;box-shadow:0 0.25em 0.5em #ccf;color:#0" +
                                                    "3c}#prettydiff.white h2,#prettydiff.white h2 button,#prettydiff.white h3{color" +
                                                    ":#b00}#prettydiff.white th{background:#eee;color:#333}#prettydiff.white thead " +
                                                    "th{background:#eef}#prettydiff.white .report strong{color:#009}#prettydiff.whi" +
                                                    "te .report em{color:#080}#prettydiff.white h2 button,#prettydiff.white td,#pre" +
                                                    "ttydiff.white th,#prettydiff.white .segment,#prettydiff.white .count li,#prett" +
                                                    "ydiff.white .diff-right #prettydiff.white ol.segment li{border-color:#ccc}#pre" +
                                                    "ttydiff.white .data li{border-color:#ccc}#prettydiff.white .count li.fold{colo" +
                                                    "r:#900}#prettydiff.white .count{background:#eed;border-color:#999}#prettydiff." +
                                                    "white h2 button{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettyd" +
                                                    "iff.white li h4{color:#00f}#prettydiff.white code{background:#eee;border-color" +
                                                    ":#eee;color:#009}#prettydiff.white ol.segment h4 strong{color:#c00}#prettydiff" +
                                                    ".white .data .delete{background:#ffd8d8}#prettydiff.white .data .delete em{bac" +
                                                    "kground:#fff8f8;border-color:#c44;color:#900}#prettydiff.white .data .insert{b" +
                                                    "ackground:#d8ffd8}#prettydiff.white .data .insert em{background:#f8fff8;border" +
                                                    "-color:#090;color:#363}#prettydiff.white .data .replace{background:#fec}#prett" +
                                                    "ydiff.white .data .replace em{background:#ffe;border-color:#a86;color:#852}#pr" +
                                                    "ettydiff.white .data .empty{background:#ddd}#prettydiff.white .data em.s0{colo" +
                                                    "r:#000}#prettydiff.white .data em.s1{color:#f66}#prettydiff.white .data em.s2{" +
                                                    "color:#12f}#prettydiff.white .data em.s3{color:#090}#prettydiff.white .data em" +
                                                    ".s4{color:#d6d}#prettydiff.white .data em.s5{color:#7cc}#prettydiff.white .dat" +
                                                    "a em.s6{color:#c85}#prettydiff.white .data em.s7{color:#737}#prettydiff.white " +
                                                    ".data em.s8{color:#6d0}#prettydiff.white .data em.s9{color:#dd0}#prettydiff.wh" +
                                                    "ite .data em.s10{color:#893}#prettydiff.white .data em.s11{color:#b97}#prettyd" +
                                                    "iff.white .data em.s12{color:#bbb}#prettydiff.white .data em.s13{color:#cc3}#p" +
                                                    "rettydiff.white .data em.s14{color:#333}#prettydiff.white .data em.s15{color:#" +
                                                    "9d9}#prettydiff.white .data em.s16{color:#880}#prettydiff.white .data .l0{back" +
                                                    "ground:#fff}#prettydiff.white .data .l1{background:#fed}#prettydiff.white .dat" +
                                                    "a .l2{background:#def}#prettydiff.white .data .l3{background:#efe}#prettydiff." +
                                                    "white .data .l4{background:#fef}#prettydiff.white .data .l5{background:#eef}#p" +
                                                    "rettydiff.white .data .l6{background:#fff8cc}#prettydiff.white .data .l7{backg" +
                                                    "round:#ede}#prettydiff.white .data .l8{background:#efc}#prettydiff.white .data" +
                                                    " .l9{background:#ffd}#prettydiff.white .data .l10{background:#edc}#prettydiff." +
                                                    "white .data .l11{background:#fdb}#prettydiff.white .data .l12{background:#f8f8" +
                                                    "f8}#prettydiff.white .data .l13{background:#ffb}#prettydiff.white .data .l14{b" +
                                                    "ackground:#eec}#prettydiff.white .data .l15{background:#cfc}#prettydiff.white " +
                                                    ".data .l16{background:#eea}#prettydiff.white .data .c0{background:inherit}#pre" +
                                                    "ttydiff.white #report p em{color:#080}#prettydiff.white #report p strong{color" +
                                                    ":#009}#prettydiff #report.contentarea{font-family:\"Lucida Sans Unicode\",\"He" +
                                                    "lvetica\",\"Arial\",sans-serif;max-width:none;overflow:scroll}#prettydiff .dif" +
                                                    "f .replace em,#prettydiff .diff .delete em,#prettydiff .diff .insert em{border" +
                                                    "-style:solid;border-width:0.1em}#prettydiff #report dd,#prettydiff #report dt," +
                                                    "#prettydiff #report p,#prettydiff #report li,#prettydiff #report td,#prettydif" +
                                                    "f #report blockquote,#prettydiff #report th{font-family:\"Lucida Sans Unicode" +
                                                    "\",\"Helvetica\",\"Arial\",sans-serif;font-size:1.2em}#prettydiff div#webtool{" +
                                                    "background:transparent;font-size:inherit;margin:0;padding:0}#prettydiff #jserr" +
                                                    "or span{display:block}#prettydiff #a11y{background:transparent;padding:0}#pret" +
                                                    "tydiff #a11y div{margin:0.5em 0;border-style:solid;border-width:0.1em}#prettyd" +
                                                    "iff #a11y h4{margin:0.25em 0}#prettydiff #a11y ol{border-style:solid;border-wi" +
                                                    "dth:0.1em}#prettydiff #cssreport.doc table{clear:none;float:left;margin-left:1" +
                                                    "em}#prettydiff #css-size{left:24em}#prettydiff #css-uri{left:40em}#prettydiff " +
                                                    "#css-uri td{text-align:left}#prettydiff .report .analysis th{text-align:left}#" +
                                                    "prettydiff .report .analysis .parseData td{font-family:\"Courier New\",Courier" +
                                                    ",\"Lucida Console\",monospace;text-align:left;white-space:pre}#prettydiff .rep" +
                                                    "ort .analysis td{text-align:right}#prettydiff .analysis{float:left;margin:0 1e" +
                                                    "m 1em 0}#prettydiff .analysis td,#prettydiff .analysis th{padding:0.5em}#prett" +
                                                    "ydiff #statreport div{border-style:none}#prettydiff .diff,#prettydiff .beautif" +
                                                    "y{border-style:solid;border-width:0.1em;display:inline-block;margin:0 1em 1em " +
                                                    "0;position:relative}#prettydiff .diff,#prettydiff .diff li #prettydiff .diff h" +
                                                    "3,#prettydiff .diff h4,#prettydiff .beautify,#prettydiff .beautify li,#prettyd" +
                                                    "iff .beautify h3,#prettydiff .beautify h4{font-family:\"Courier New\",Courier," +
                                                    "\"Lucida Console\",monospace}#prettydiff .diff li,#prettydiff .beautify li,#pr" +
                                                    "ettydiff .diff h3,#prettydiff .diff h4,#prettydiff .beautify h3,#prettydiff .b" +
                                                    "eautify h4{border-style:none none solid none;border-width:0 0 0.1em 0;box-shad" +
                                                    "ow:none;display:block;font-size:1.2em;margin:0 0 0 -.1em;padding:0.2em 2em;tex" +
                                                    "t-align:left}#prettydiff .diff .skip{border-style:none none solid;border-width" +
                                                    ":0 0 0.1em}#prettydiff .diff .diff-left{border-style:none;display:table-cell}#" +
                                                    "prettydiff .diff .diff-right{border-style:none none none solid;border-width:0 " +
                                                    "0 0 0.1em;display:table-cell;margin-left:-.1em;min-width:16.5em;right:0;top:0}" +
                                                    "#prettydiff .diff .data li,#prettydiff .beautify .data li{min-width:16.5em;pad" +
                                                    "ding:0.5em}#prettydiff .diff li,#prettydiff .diff p,#prettydiff .diff h3,#pret" +
                                                    "tydiff .beautify li,#prettydiff .beautify p,#prettydiff .beautify h3{font-size" +
                                                    ":1.2em}#prettydiff .diff li em,#prettydiff .beautify li em{font-style:normal;f" +
                                                    "ont-weight:bold;margin:-0.5em -0.09em}#prettydiff .diff p.author{border-style:" +
                                                    "solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4em;te" +
                                                    "xt-align:right}#prettydiff .difflabel{display:block;height:0}#prettydiff .coun" +
                                                    "t{border-style:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;tex" +
                                                    "t-align:right}#prettydiff .count li{padding:0.5em 1em;text-align:right}#pretty" +
                                                    "diff .count li.fold{cursor:pointer;font-weight:bold;padding-left:0.5em}#pretty" +
                                                    "diff .data{text-align:left;white-space:pre}#prettydiff .beautify .data em{disp" +
                                                    "lay:inline-block;font-style:normal;font-weight:bold}#prettydiff .beautify li,#" +
                                                    "prettydiff .diff li{border-style:none none solid;border-width:0 0 0.1em;displa" +
                                                    "y:block;height:1em;line-height:1.2;list-style-type:none;margin:0;white-space:p" +
                                                    "re}#prettydiff .beautify ol,#prettydiff .diff ol{display:table-cell;margin:0;p" +
                                                    "adding:0}#prettydiff .beautify em.l0,#prettydiff .beautify em.l1,#prettydiff ." +
                                                    "beautify em.l2,#prettydiff .beautify em.l3,#prettydiff .beautify em.l4,#pretty" +
                                                    "diff .beautify em.l5,#prettydiff .beautify em.l6,#prettydiff .beautify em.l7,#" +
                                                    "prettydiff .beautify em.l8,#prettydiff .beautify em.l9,#prettydiff .beautify e" +
                                                    "m.l10,#prettydiff .beautify em.l11,#prettydiff .beautify em.l12,#prettydiff .b" +
                                                    "eautify em.l13,#prettydiff .beautify em.l14,#prettydiff .beautify em.l15,#pret" +
                                                    "tydiff .beautify em.l16{height:2.2em;margin:0 0 -1em;position:relative;top:-0." +
                                                    "5em}#prettydiff .beautify em.l0{margin-left:-0.5em;padding-left:0.5em}#prettyd" +
                                                    "iff #report .beautify,#prettydiff #report .beautify li,#prettydiff #report .di" +
                                                    "ff,#prettydiff #report .diff li{font-family:\"Courier New\",Courier,\"Lucida C" +
                                                    "onsole\",monospace}#prettydiff #report .beautify{border-style:solid}#prettydif" +
                                                    "f #report .diff h3,#prettydiff #report .beautify h3{margin:0}#prettydiff{text-" +
                                                    "align:center;font-size:10px;overflow-y:scroll}#prettydiff .contentarea{border-" +
                                                    "style:solid;border-width:0.1em;font-family:\"Century Gothic\",\"Trebuchet MS\"" +
                                                    ";margin:0 auto;max-width:93em;padding:1em;text-align:left}#prettydiff dd,#pret" +
                                                    "tydiff dt,#prettydiff p,#prettydiff li,#prettydiff td,#prettydiff blockquote,#" +
                                                    "prettydiff th{clear:both;font-family:\"Palatino Linotype\",\"Book Antiqua\",Pa" +
                                                    "latino,serif;font-size:1.6em;line-height:1.6em;text-align:left}#prettydiff blo" +
                                                    "ckquote{font-style:italic}#prettydiff dt{font-size:1.4em;font-weight:bold;line" +
                                                    "-height:inherit}#prettydiff li li,#prettydiff li p{font-size:1em}#prettydiff t" +
                                                    "h,#prettydiff td{border-style:solid;border-width:0.1em;padding:0.1em 0.2em}#pr" +
                                                    "ettydiff td span{display:block}#prettydiff code,#prettydiff textarea{font-fami" +
                                                    "ly:\"Courier New\",Courier,\"Lucida Console\",monospace}#prettydiff code,#pret" +
                                                    "tydiff textarea{display:block;font-size:0.8em;width:100%}#prettydiff code span" +
                                                    "{display:block;white-space:pre}#prettydiff code{border-style:solid;border-widt" +
                                                    "h:0.2em;line-height:1em}#prettydiff textarea{line-height:1.4em}#prettydiff lab" +
                                                    "el{display:inline;font-size:1.4em}#prettydiff legend{border-radius:1em;border-" +
                                                    "style:solid;border-width:0.1em;font-size:1.4em;font-weight:bold;margin-left:-0" +
                                                    ".25em;padding:0 0.5em}#prettydiff fieldset fieldset legend{font-size:1.2em}#pr" +
                                                    "ettydiff table{border-collapse:collapse}#prettydiff div.report{border-style:no" +
                                                    "ne}#prettydiff h2,#prettydiff h3,#prettydiff h4{clear:both}#prettydiff table{m" +
                                                    "argin:0 0 1em}#prettydiff .analysis .bad,#prettydiff .analysis .good{font-weig" +
                                                    "ht:bold}#prettydiff h1{font-size:3em;font-weight:normal;margin-top:0}#prettydi" +
                                                    "ff h1 span{font-size:0.5em}#prettydiff h1 svg{border-style:solid;border-width:" +
                                                    "0.05em;float:left;height:1.5em;margin-right:0.5em;width:1.5em}#prettydiff h2{b" +
                                                    "order-style:none;background:transparent;font-size:1em;box-shadow:none;margin:0" +
                                                    "}#prettydiff h2 button{background:transparent;border-style:solid;cursor:pointe" +
                                                    "r;display:block;font-size:2.5em;font-weight:normal;text-align:left;width:100%;" +
                                                    "border-width:0.05em;font-weight:normal;margin:1em 0 0;padding:0.1em}#prettydif" +
                                                    "f h2 span{display:block;float:right;font-size:0.5em}#prettydiff h3{font-size:2" +
                                                    "em;margin:0;background:transparent;box-shadow:none;border-style:none}#prettydi" +
                                                    "ff h4{font-size:1.6em;font-family:\"Century Gothic\",\"Trebuchet MS\";margin:0" +
                                                    "}#prettydiff li h4{font-size:1em}#prettydiff button,#prettydiff fieldset,#pret" +
                                                    "tydiff div input,#prettydiff textarea{border-style:solid;border-width:0.1em}#p" +
                                                    "rettydiff section{border-style:none}#prettydiff h2 button,#prettydiff select,#" +
                                                    "prettydiff option{font-family:inherit}#prettydiff select{border-style:inset;bo" +
                                                    "rder-width:0.1em;width:13.5em}#prettydiff #dcolorScheme{float:right;margin:-3e" +
                                                    "m 0 0}#prettydiff #dcolorScheme label,#prettydiff #dcolorScheme label{display:" +
                                                    "inline-block;font-size:1em}#prettydiff .clear{clear:both;display:block}#pretty" +
                                                    "diff caption,#prettydiff .content-hide{height:1em;left:-1000em;overflow:hidden" +
                                                    ";position:absolute;top:-1000em;width:1em}/*]]>*/</style></head><body id=\"pret" +
                                                    "tydiff\" class=\"white\"><div class=\"contentarea\" id=\"report\"><section rol" +
                                                    "e=\"heading\"><h1><svg height=\"2000.000000pt\" id=\"pdlogo\" preserveAspectRa" +
                                                    "tio=\"xMidYMid meet\" version=\"1.0\" viewBox=\"0 0 2000.000000 2000.000000\" " +
                                                    "width=\"2000.000000pt\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"#999\" " +
                                                    "stroke=\"none\" transform=\"translate(0.000000,2000.000000) scale(0.100000,-0." +
                                                    "100000)\"> <path d=\"M14871 18523 c-16 -64 -611 -2317 -946 -3588 -175 -660 -31" +
                                                    "9 -1202 -320 -1204 -2 -2 -50 39 -107 91 -961 876 -2202 1358 -3498 1358 -1255 0" +
                                                    " -2456 -451 -3409 -1279 -161 -140 -424 -408 -560 -571 -507 -607 -870 -1320 -10" +
                                                    "62 -2090 -58 -232 -386 -1479 -2309 -8759 -148 -563 -270 -1028 -270 -1033 0 -4 " +
                                                    "614 -8 1365 -8 l1364 0 10 38 c16 63 611 2316 946 3587 175 660 319 1202 320 120" +
                                                    "4 2 2 50 -39 107 -91 543 -495 1169 -862 1863 -1093 1707 -568 3581 -211 4965 94" +
                                                    "6 252 210 554 524 767 796 111 143 312 445 408 613 229 406 408 854 525 1320 57 " +
                                                    "225 380 1451 2310 8759 148 563 270 1028 270 1033 0 4 -614 8 -1365 8 l-1364 0 -" +
                                                    "10 -37z m-4498 -5957 c477 -77 889 -256 1245 -542 523 -419 850 -998 954 -1689 1" +
                                                    "8 -121 18 -549 0 -670 -80 -529 -279 -972 -612 -1359 -412 -480 -967 -779 -1625 " +
                                                    "-878 -121 -18 -549 -18 -670 0 -494 74 -918 255 -1283 548 -523 419 -850 998 -95" +
                                                    "4 1689 -18 121 -18 549 0 670 104 691 431 1270 954 1689 365 293 828 490 1283 54" +
                                                    "5 50 6 104 13 120 15 72 10 495 -3 588 -18z\"/></g></svg><a href=\"prettydiff.c" +
                                                    "om.xhtml\">Pretty Diff</a></h1><p id=\"dcolorScheme\"><label class=\"label\" f" +
                                                    "or=\"colorScheme\">Color Scheme</label><select id=\"colorScheme\"><option>Canv" +
                                                    "as</option><option>Shadow</option><option selected=\"selected\">White</option>" +
                                                    "</select></p><p>Find <a href=\"https://github.com/prettydiff/prettydiff\">Pret" +
                                                    "ty Diff on GitHub</a>.</p></section><section role=\"main\"><p><strong>Number o" +
                                                    "f differences:</strong> <em>1</em> differences from <em>1</em> line of code.</" +
                                                    "p><div class='diff'><div class='diff-left'><h3 class='texttitle'>Source Sample" +
                                                    "</h3><ol class='count'><li class=\"fold\" title=\"folds from line 1 to line 2" +
                                                    "\">- 1</li><li>2</li><li>3</li><li class=\"fold\" title=\"folds from line 4 to" +
                                                    " line 5\">- 4</li><li>5</li></ol><ol class=\"data\" data-prettydiff-ignore=\"t" +
                                                    "rue\"><li class=\"equal\">&lt;a&gt;&#10;</li><li class=\"equal\">    &lt;b&gt;" +
                                                    "&#10;</li><li class=\"replace\">        &lt;<em>c</em>/&gt;&#10;</li><li class" +
                                                    "=\"equal\">    &lt;/b&gt;&#10;</li><li class=\"equal\">&lt;/a&gt;&#10;</li></o" +
                                                    "l></div><div class='diff-right'><h3 class='texttitle'>New Sample</h3><ol class" +
                                                    "='count' style='cursor:w-resize'><li>1</li><li>2</li><li>3</li><li>4</li><li>5" +
                                                    "</li></ol><ol class=\"data\" data-prettydiff-ignore=\"true\"><li class=\"equal" +
                                                    "\">&lt;a&gt;&#10;</li><li class=\"equal\">    &lt;b&gt;&#10;</li><li class=\"r" +
                                                    "eplace\">        &lt;<em>d</em>/&gt;&#10;</li><li class=\"equal\">    &lt;/b&g" +
                                                    "t;&#10;</li><li class=\"equal\">&lt;/a&gt;&#10;</li></ol></div><p class=\"auth" +
                                                    "or\">Diff view written by <a href=\"http://prettydiff.com/\">Pretty Diff</a>.<" +
                                                    "/p></div></section></div><script type=\"application/javascript\">//<![CDATA[\r" +
                                                    "\nvar pd={};pd.colorchange=function(){\"use strict\";var options=this.getEleme" +
                                                    "ntsByTagName(\"option\");document.getElementsByTagName(\"body\")[0].setAttribu" +
                                                    "te(\"class\",options[this.selectedIndex].innerHTML.toLowerCase())};pd.difffold" +
                                                    "=function dom__difffold(){\"use strict\";var a=0,b=0,self=this,title=self.getA" +
                                                    "ttribute(\"title\").split(\"line \"),min=Number(title[1].substr(0,title[1].ind" +
                                                    "exOf(\" \"))),max=Number(title[2]),inner=self.innerHTML,lists=[],parent=self.p" +
                                                    "arentNode.parentNode,listnodes=(parent.getAttribute(\"class\")===\"diff\")?par" +
                                                    "ent.getElementsByTagName(\"ol\"):parent.parentNode.getElementsByTagName(\"ol\"" +
                                                    "),listLen=listnodes.length;for(a=0;a<listLen;a=a+1){lists.push(listnodes[a].ge" +
                                                    "tElementsByTagName(\"li\"))}max=(max>=lists[0].length)?lists[0].length:max;if(" +
                                                    "inner.charAt(0)===\"-\"){self.innerHTML=\"+\"+inner.substr(1);for(a=min;a<max;" +
                                                    "a=a+1){for(b=0;b<listLen;b=b+1){lists[b][a].style.display=\"none\"}}}else{self" +
                                                    ".innerHTML=\"-\"+inner.substr(1);for(a=min;a<max;a=a+1){for(b=0;b<listLen;b=b+" +
                                                    "1){lists[b][a].style.display=\"block\"}}}};pd.colSliderGrab=function(e){\"use " +
                                                    "strict\";var event=e||window.event,touch=(e!==null&&e.type===\"touchstart\"),n" +
                                                    "ode=this,diffRight=node.parentNode,diff=diffRight.parentNode,subOffset=0,lists" +
                                                    "=diff.getElementsByTagName(\"ol\"),counter=lists[0].clientWidth,data=lists[1]." +
                                                    "clientWidth,width=lists[2].parentNode.clientWidth,total=lists[2].parentNode.pa" +
                                                    "rentNode.clientWidth,offset=lists[2].parentNode.offsetLeft-lists[2].parentNode" +
                                                    ".parentNode.offsetLeft,min=((total-counter-data-2)-width),max=(total-width-cou" +
                                                    "nter),status=\"ew\",minAdjust=min+15,maxAdjust=max-15,withinRange=false,diffLe" +
                                                    "ft=diffRight.previousSibling,drop=function dom__event_colSliderGrab_drop(f){f=" +
                                                    "f||window.event;f.preventDefault();node.style.cursor=status+\"-resize\";if(tou" +
                                                    "ch===true){document.ontouchmove=null;document.ontouchend=null}else{document.on" +
                                                    "mousemove=null;document.onmouseup=null}},boxmove=function dom__event_colSlider" +
                                                    "Grab_boxmove(f){f=f||window.event;f.preventDefault();if(touch===true){subOffse" +
                                                    "t=offset-f.touches[0].clientX}else{subOffset=offset-f.clientX}if(subOffset>min" +
                                                    "Adjust&&subOffset<maxAdjust){withinRange=true}if(withinRange===true&&subOffset" +
                                                    ">maxAdjust){diffRight.style.width=((total-counter-2)/10)+\"em\";status=\"e\"}e" +
                                                    "lse if(withinRange===true&&subOffset<minAdjust){diffRight.style.width=((total-" +
                                                    "counter-data-2)/10)+\"em\";status=\"w\"}else if(subOffset<max&&subOffset>min){" +
                                                    "diffRight.style.width=((width+subOffset)/10)+\"em\";status=\"ew\"}if(touch===t" +
                                                    "rue){document.ontouchend=drop}else{document.onmouseup=drop}};event.preventDefa" +
                                                    "ult();if(typeof pd.data===\"object\"&&pd.data.node.report.code.box!==null){off" +
                                                    "set=offset+pd.data.node.report.code.box.offsetLeft;offset=offset-pd.data.node." +
                                                    "report.code.body.scrollLeft}else{subOffset=(document.body.parentNode.scrollLef" +
                                                    "t>document.body.scrollLeft)?document.body.parentNode.scrollLeft:document.body." +
                                                    "scrollLeft;offset=offset-subOffset}offset=offset+node.clientWidth;node.style.c" +
                                                    "ursor=\"ew-resize\";diff.style.width=(total/10)+\"em\";diff.style.display=\"in" +
                                                    "line-block\";if(diffLeft.nodeType!==1){do{diffLeft=diffLeft.previousSibling}wh" +
                                                    "ile(diffLeft.nodeType!==1)}diffLeft.style.display=\"block\";diffRight.style.wi" +
                                                    "dth=(diffRight.clientWidth/10)+\"em\";diffRight.style.position=\"absolute\";if" +
                                                    "(touch===true){document.ontouchmove=boxmove;document.ontouchstart=false}else{d" +
                                                    "ocument.onmousemove=boxmove;document.onmousedown=null}return false};(function(" +
                                                    "){\"use strict\";var lists=document.getElementById(\"prettydiff\").getElements" +
                                                    "ByTagName(\"ol\"),cells=lists[0].getElementsByTagName(\"li\"),len=cells.length" +
                                                    ",a=0;for(a=0;a<len;a=a+1){if(cells[a].getAttribute(\"class\")===\"fold\"){cell" +
                                                    "s[a].onclick=pd.difffold}}if(lists.length>3){lists[2].onmousedown=pd.colSlider" +
                                                    "Grab;lists[2].ontouchstart=pd.colSliderGrab}pd.colorscheme=document.getElement" +
                                                    "ById(\"colorScheme\");pd.colorscheme.onchange=pd.colorchange}());//]]>\r\n</sc" +
                                                    "ript></body></html>"
                                        }
                                    ]
                                }, {
                                    group: "simple file tests",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file" +
                                                    "\" mode:\"beautify\"",
                                            name  : "Verify `readmethod:file` throws error on missing output option",
                                            verify: "Error: 'readmethod' is value 'file' and argument 'output' is empty"
                                        }, {
                                            check : "node api/node-local.js source:\"<a><b> <c/>    </b></a>\" readmethod:\"screen" +
                                                    "\" mode:\"diff\" diff:\"<a><b> <d/>    </b></a>\" diffcli:true",
                                            name  : "Test diffcli option",
                                            verify: "\nScreen input with 1 difference\n\n\u001b[36mLine: 3\u001b[39m\n<a>\n    <b>" +
                                                    "\n\u001b[31m        <\u001b[1mc\u001b[22m/>\u001b[39m\n\u001b[32m        <" +
                                                    "\u001b[1md\u001b[22m/>\u001b[39m\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa1.txt\" readmethod:\"file" +
                                                    "screen\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Source file is empty",
                                            verify: "Source file at - is \u001B[31mempty\u001B[39m but the diff file is not.\n\nPre" +
                                                    "tty Diff found 0 differences. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"diff\" diff:\"test/simulation/testa1.txt\"",
                                            name  : "Diff file is empty",
                                            verify: "Diff file at - is \u001B[31mempty\u001B[39m but the source file is not.\n\nPre" +
                                                    "tty Diff found 0 differences. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"diff\" diff:\"test/simulation/testa1.txt\" diffcli:\"true\"",
                                            name  : "Diff file is empty with diffcli option",
                                            verify: "Diff file at - is \u001B[31mempty\u001B[39m but the source file is not.\n\nPre" +
                                                    "tty Diff found 0 differences. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"diff\" diff:\"test/simulation/testa.txt\"",
                                            name  : "Diff file and source file are same file, readmethod filescreen",
                                            verify: "\nPretty Diff found 0 differences. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file" +
                                                    "\" output:\"test/simulation/testaxx.txt\" mode:\"diff\" diff:\"test/simulation" +
                                                    "/testa.txt\"",
                                            name  : "Diff file and source file are same file, readmethod file",
                                            verify: "\nPretty Diff found 0 differences. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"file" +
                                                    "\" output:\"test/simulation/testayy.txt\" mode:\"beautify\" endquietly:\"quiet" +
                                                    "\"",
                                            name  : "option endquietly",
                                            verify: ""
                                        }
                                    ]
                                }, {
                                    group: "readmethod: filescreen",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"beautify\"",
                                            name  : "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"minify\"",
                                            name  : "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"parse\"",
                                            name  : "Parse markup.",
                                            verify: "{\"data\":{\"attrs\":[{},{},{},{},{}],\"begin\":[0,0,1,1,0],\"daddy\":[\"root" +
                                                    "\",\"a\",\"b\",\"b\",\"a\"],\"jscom\":[false,false,false,false,false],\"linen" +
                                                    "\":[1,1,1,1,1],\"lines\":[0,0,1,1,0],\"presv\":[false,false,false,false,false]" +
                                                    ",\"token\":[\"<a>\",\"<b>\",\"<c/>\",\"</b>\",\"</a>\"],\"types\":[\"start\"," +
                                                    "\"start\",\"singleton\",\"end\",\"end\"]},\"definition\":{\"attrs\":\"array - " +
                                                    "List of attributes (if any) for the given token.\",\"begin\":\"number - Index " +
                                                    "where the parent element occurs.\",\"daddy\":\"string - Tag name of the parent" +
                                                    " element. Tokens of type 'template_start' are not considered as parent element" +
                                                    "s.  End tags reflect their matching start tag.\",\"jscom\":\"boolean - Whether" +
                                                    " the token is a JavaScript comment if in JSX format.\",\"linen\":\"number - Th" +
                                                    "e line number in the original source where the token started, which is used fo" +
                                                    "r reporting and analysis.\",\"lines\":\"number - Whether the token is preceede" +
                                                    "d any space and/or line breaks in the original code source.\",\"presv\":\"bool" +
                                                    "ean - Whether the token is preserved verbatim as found.  Useful for comments a" +
                                                    "nd HTML 'pre' tags.\",\"token\":\"string - The parsed code tokens.\",\"types\"" +
                                                    ":\"string - Data types of the tokens: cdata, comment, conditional, content, en" +
                                                    "d, ignore, linepreserve, script, sgml, singleton, start, template, template_el" +
                                                    "se, template_end, template_start, xml\"}}"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"beautify\"",
                                            name  : "Beautify markup.",
                                            verify: "<a>\n    <b>\n        <c/>\n    </b>\n</a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/simulation/testa.txt\" readmethod:\"files" +
                                                    "creen\" mode:\"minify\"",
                                            name  : "Minify markup.",
                                            verify: "<a><b> <c/> </b></a>"
                                        }, {
                                            check : "node api/node-local.js source:\"test/today.js\" readmdethod:\"filescreen\" mod" +
                                                    "e:\"analysis\"",
                                            name  : "Analysis of today.js",
                                            verify: "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><!DOCTYPE html PUBLIC \"-//W3C//DTD" +
                                                    " XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\"><html xmlns=" +
                                                    "\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\"><head><title>Pretty Diff - Th" +
                                                    "e difference tool</title><meta name=\"robots\" content=\"index, follow\"/> <me" +
                                                    "ta name=\"DC.title\" content=\"Pretty Diff - The difference tool\"/> <link rel" +
                                                    "=\"canonical\" href=\"http://prettydiff.com/\" type=\"application/xhtml+xml\"/" +
                                                    "><meta http-equiv=\"Content-Type\" content=\"application/xhtml+xml;charset=UTF" +
                                                    "-8\"/><meta http-equiv=\"Content-Style-Type\" content=\"text/css\"/><style typ" +
                                                    "e=\"text/css\">/*<![CDATA[*/#prettydiff.canvas{background:#986 url(\"data:imag" +
                                                    "e/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuI" +
                                                    "wF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhU" +
                                                    "IIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89" +
                                                    "+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsA" +
                                                    "HvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjA" +
                                                    "FAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC" +
                                                    "3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXL" +
                                                    "h4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+" +
                                                    "rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKx" +
                                                    "EJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK" +
                                                    "5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b" +
                                                    "8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/x" +
                                                    "gNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRBy" +
                                                    "AgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvy" +
                                                    "GvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAux" +
                                                    "sNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwk" +
                                                    "DhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksq" +
                                                    "Zs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaO" +
                                                    "aUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6" +
                                                    "AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyo" +
                                                    "vVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw" +
                                                    "09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45h" +
                                                    "x+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onX" +
                                                    "CdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/V" +
                                                    "HDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJ" +
                                                    "gYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRapln" +
                                                    "utrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt" +
                                                    "8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVO" +
                                                    "b00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeW" +
                                                    "TNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/" +
                                                    "MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj" +
                                                    "4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T" +
                                                    "6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F" +
                                                    "5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kg" +
                                                    "qTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlh" +
                                                    "bL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsI" +
                                                    "S4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6" +
                                                    "wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6eb" +
                                                    "eLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdt" +
                                                    "WHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6" +
                                                    "217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL" +
                                                    "2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ" +
                                                    "752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nue" +
                                                    "r21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3Yf" +
                                                    "VP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/" +
                                                    "suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8" +
                                                    "o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAEFdaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwY" +
                                                    "WNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXR" +
                                                    "hIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxN" +
                                                    "CA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5" +
                                                    "zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgI" +
                                                    "DxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDo" +
                                                    "vL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9uc" +
                                                    "y5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnM" +
                                                    "uYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zO" +
                                                    "nN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICA" +
                                                    "gICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgI" +
                                                    "CAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyI" +
                                                    "KICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgI" +
                                                    "CAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICA" +
                                                    "gICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwve" +
                                                    "G1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjoyNDo" +
                                                    "zOC0wNjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtM" +
                                                    "DEtMTNUMTM6MTg6MDctMDY6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ" +
                                                    "5RGF0ZT4yMDE2LTAxLTEzVDEzOjE4OjA3LTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgP" +
                                                    "HhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1iYjM5NjA0MDV" +
                                                    "hOWQ8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY" +
                                                    "2lkOnBob3Rvc2hvcDoxYzM3NjE4MS1mOWU4LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkR" +
                                                    "vY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0Z" +
                                                    "TI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4" +
                                                    "KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgI" +
                                                    "CAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN" +
                                                    "0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2d" +
                                                    "DppbnN0YW5jZUlEPnhtcC5paWQ6NmIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9" +
                                                    "zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyV" +
                                                    "DEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHd" +
                                                    "hcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhc" +
                                                    "mVBZ2VudD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmR" +
                                                    "mOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhd" +
                                                    "mVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5" +
                                                    "paWQ6ZDUzYzc4NDMtYTVmMi00ODQ3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEP" +
                                                    "gogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9" +
                                                    "zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQa" +
                                                    "G90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICA" +
                                                    "gICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgP" +
                                                    "C9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgo" +
                                                    "gICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgI" +
                                                    "CAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHR" +
                                                    "vIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgI" +
                                                    "CAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJ" +
                                                    "lc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0a" +
                                                    "W9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWM" +
                                                    "wZWQtNGIzYS05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgI" +
                                                    "CAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxMzoxMzoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICA" +
                                                    "gICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwM" +
                                                    "TQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV" +
                                                    "2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgI" +
                                                    "CAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICA" +
                                                    "gICAgPHN0RXZ0OmFjdGlvbj5kZXJpdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgI" +
                                                    "DxzdEV2dDpwYXJhbWV0ZXJzPmNvbnZlcnRlZCBmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG9" +
                                                    "0b3Nob3AgdG8gaW1hZ2UvcG5nPC9zdEV2dDpwYXJhbWV0ZXJzPgogICAgICAgICAgICAgICA8L3JkZ" +
                                                    "jpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICA" +
                                                    "gICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgI" +
                                                    "CAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDoxZGYzYjhkMy03NzgyLTQ0MGUtYjA5OS1" +
                                                    "iYjM5NjA0MDVhOWQ8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3a" +
                                                    "GVuPjIwMTYtMDEtMTNUMTM6MTg6MDctMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICA" +
                                                    "gIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpP" +
                                                    "C9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9" +
                                                    "zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U" +
                                                    "2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSB" +
                                                    "yZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtc" +
                                                    "C5paWQ6ODNhNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjppbnN0YW5jZUl" +
                                                    "EPgogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOjgzYTc5MGFkLWMwZWQtNGIzY" +
                                                    "S05ZDJhLWE5YzQ2MWRmMzVhMTwvc3RSZWY6ZG9jdW1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9" +
                                                    "yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjRlMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3N" +
                                                    "DAzMTwvc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8L3htcE1NOkRlcml2ZWRGcm9" +
                                                    "tPgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvd" +
                                                    "G9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9" +
                                                    "wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgI" +
                                                    "CAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjp" +
                                                    "YUmVzb2x1dGlvbj4zMDAwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZ" +
                                                    "jpZUmVzb2x1dGlvbj4zMDAwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGl" +
                                                    "mZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb" +
                                                    "2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9" +
                                                    "uPjQ8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+N" +
                                                    "DwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjp" +
                                                    "SREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                    "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+bleIyQAAACBjSFJNAAB6JQAAgIMAAPn/A" +
                                                    "ACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAANElEQVR42mJ89+4uAwMDAwPD6lkTGd69u/vu3d2ZHXn" +
                                                    "v3t1lgLPevbvLrCTIEJqWD1EJGADaTRll80WcLAAAAABJRU5ErkJggg==\");color:#420}#prett" +
                                                    "ydiff.canvas *:focus{outline:0.1em dashed #f00}#prettydiff.canvas a{color:#039" +
                                                    "}#prettydiff.canvas .contentarea,#prettydiff.canvas legend,#prettydiff.canvas " +
                                                    "fieldset select,#prettydiff.canvas .diff td,#prettydiff.canvas .report td,#pre" +
                                                    "ttydiff.canvas .data li,#prettydiff.canvas .diff-right,#prettydiff.canvas fiel" +
                                                    "dset input{background:#eeeee8;border-color:#420}#prettydiff.canvas select,#pre" +
                                                    "ttydiff.canvas input,#prettydiff.canvas .diff,#prettydiff.canvas .beautify,#pr" +
                                                    "ettydiff.canvas .report,#prettydiff.canvas .beautify h3,#prettydiff.canvas .di" +
                                                    "ff h3,#prettydiff.canvas .beautify h4,#prettydiff.canvas .diff h4,#prettydiff." +
                                                    "canvas #report,#prettydiff.canvas #report .author,#prettydiff.canvas fieldset{" +
                                                    "background:#ddddd8;border-color:#420}#prettydiff.canvas fieldset fieldset{back" +
                                                    "ground:#eeeee8}#prettydiff.canvas fieldset fieldset input,#prettydiff.canvas f" +
                                                    "ieldset fieldset select{background:#ddddd8}#prettydiff.canvas h2,#prettydiff.c" +
                                                    "anvas h2 button,#prettydiff.canvas h3,#prettydiff.canvas legend{color:#900}#pr" +
                                                    "ettydiff.canvas .contentarea{box-shadow:0 1em 1em #b8a899}#prettydiff.canvas ." +
                                                    "segment{background:#fff}#prettydiff.canvas h2 button,#prettydiff.canvas .segme" +
                                                    "nt,#prettydiff.canvas ol.segment li{border-color:#420}#prettydiff.canvas th{ba" +
                                                    "ckground:#e8ddcc}#prettydiff.canvas li h4{color:#06f}#prettydiff.canvas code{b" +
                                                    "ackground:#eee;border-color:#eee;color:#00f}#prettydiff.canvas ol.segment h4 s" +
                                                    "trong{color:#c00}#prettydiff.canvas button{background-color:#ddddd8;border-col" +
                                                    "or:#420;box-shadow:0 0.25em 0.5em #b8a899;color:#900}#prettydiff.canvas button" +
                                                    ":hover{background-color:#ccb;border-color:#630;box-shadow:0 0.25em 0.5em #b8a8" +
                                                    "99;color:#630}#prettydiff.canvas th{background:#ccccc8}#prettydiff.canvas thea" +
                                                    "d th,#prettydiff.canvas th.heading{background:#ccb}#prettydiff.canvas .diff h3" +
                                                    "{background:#ddd;border-color:#999}#prettydiff.canvas td,#prettydiff.canvas th" +
                                                    ",#prettydiff.canvas .segment,#prettydiff.canvas .count li,#prettydiff.canvas ." +
                                                    "data li,#prettydiff.canvas .diff-right{border-color:#ccccc8}#prettydiff.canvas" +
                                                    " .count{background:#eed;border-color:#999}#prettydiff.canvas .count li.fold{co" +
                                                    "lor:#900}#prettydiff.canvas h2 button{background:#f8f8f8;box-shadow:0.1em 0.1e" +
                                                    "m 0.25em #ddd}#prettydiff.canvas li h4{color:#00f}#prettydiff.canvas code{back" +
                                                    "ground:#eee;border-color:#eee;color:#009}#prettydiff.canvas ol.segment h4 stro" +
                                                    "ng{color:#c00}#prettydiff.canvas .data .delete{background:#ffd8d8}#prettydiff." +
                                                    "canvas .data .delete em{background:#fff8f8;border-color:#c44;color:#900}#prett" +
                                                    "ydiff.canvas .data .insert{background:#d8ffd8}#prettydiff.canvas .data .insert" +
                                                    " em{background:#f8fff8;border-color:#090;color:#363}#prettydiff.canvas .data ." +
                                                    "replace{background:#fec}#prettydiff.canvas .data .replace em{background:#ffe;b" +
                                                    "order-color:#a86;color:#852}#prettydiff.canvas .data .empty{background:#ddd}#p" +
                                                    "rettydiff.canvas .data em.s0{color:#000}#prettydiff.canvas .data em.s1{color:#" +
                                                    "f66}#prettydiff.canvas .data em.s2{color:#12f}#prettydiff.canvas .data em.s3{c" +
                                                    "olor:#090}#prettydiff.canvas .data em.s4{color:#d6d}#prettydiff.canvas .data e" +
                                                    "m.s5{color:#7cc}#prettydiff.canvas .data em.s6{color:#c85}#prettydiff.canvas ." +
                                                    "data em.s7{color:#737}#prettydiff.canvas .data em.s8{color:#6d0}#prettydiff.ca" +
                                                    "nvas .data em.s9{color:#dd0}#prettydiff.canvas .data em.s10{color:#893}#pretty" +
                                                    "diff.canvas .data em.s11{color:#b97}#prettydiff.canvas .data em.s12{color:#bbb" +
                                                    "}#prettydiff.canvas .data em.s13{color:#cc3}#prettydiff.canvas .data em.s14{co" +
                                                    "lor:#333}#prettydiff.canvas .data em.s15{color:#9d9}#prettydiff.canvas .data e" +
                                                    "m.s16{color:#880}#prettydiff.canvas .data .l0{background:#eeeee8}#prettydiff.c" +
                                                    "anvas .data .l1{background:#fed}#prettydiff.canvas .data .l2{background:#def}#" +
                                                    "prettydiff.canvas .data .l3{background:#efe}#prettydiff.canvas .data .l4{backg" +
                                                    "round:#fef}#prettydiff.canvas .data .l5{background:#eef}#prettydiff.canvas .da" +
                                                    "ta .l6{background:#fff8cc}#prettydiff.canvas .data .l7{background:#ede}#pretty" +
                                                    "diff.canvas .data .l8{background:#efc}#prettydiff.canvas .data .l9{background:" +
                                                    "#ffd}#prettydiff.canvas .data .l10{background:#edc}#prettydiff.canvas .data .l" +
                                                    "11{background:#fdb}#prettydiff.canvas .data .l12{background:#f8f8f8}#prettydif" +
                                                    "f.canvas .data .l13{background:#ffb}#prettydiff.canvas .data .l14{background:#" +
                                                    "eec}#prettydiff.canvas .data .l15{background:#cfc}#prettydiff.canvas .data .l1" +
                                                    "6{background:#eea}#prettydiff.canvas .data .c0{background:inherit}#prettydiff." +
                                                    "canvas #report p em{color:#060}#prettydiff.canvas #report p strong{color:#009}" +
                                                    "#prettydiff.shadow{background:#333 url(\"data:image/png;base64,iVBORw0KGgoAAAA" +
                                                    "NSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob" +
                                                    "3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcE" +
                                                    "RRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRN" +
                                                    "YAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQpl" +
                                                    "cAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVA" +
                                                    "aCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGD" +
                                                    "IIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBN" +
                                                    "A/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qI" +
                                                    "l7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14" +
                                                    "L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcU" +
                                                    "l0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZ" +
                                                    "kmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQii" +
                                                    "GzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIB" +
                                                    "BKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogv" +
                                                    "QZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu" +
                                                    "4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1h" +
                                                    "ILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkn" +
                                                    "eTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR" +
                                                    "1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3G" +
                                                    "K+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZ" +
                                                    "VM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq" +
                                                    "4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y" +
                                                    "0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1r" +
                                                    "i6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8f" +
                                                    "b8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx" +
                                                    "83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1ru" +
                                                    "tu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdW" +
                                                    "h1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lps" +
                                                    "bxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ" +
                                                    "0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r" +
                                                    "/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pD" +
                                                    "oVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo" +
                                                    "3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZAT" +
                                                    "IhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLx" +
                                                    "MDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2Q" +
                                                    "qboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxeds" +
                                                    "K4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGn" +
                                                    "Rs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO3" +
                                                    "19kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7Jv" +
                                                    "ttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3" +
                                                    "vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3" +
                                                    "nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDv" +
                                                    "OXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeO" +
                                                    "T3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYP" +
                                                    "P/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/b" +
                                                    "Xyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GM" +
                                                    "zLdsAAEQFaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9I" +
                                                    "lc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1" +
                                                    "ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvM" +
                                                    "jAtMDk6NTM6MDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5" +
                                                    "vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmO" +
                                                    "mFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4" +
                                                    "wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tb" +
                                                    "S8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R" +
                                                    "5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvY" +
                                                    "mUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpkYz0iaHR" +
                                                    "0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvc" +
                                                    "D0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGl" +
                                                    "mZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9I" +
                                                    "mh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5" +
                                                    "BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgI" +
                                                    "CAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOkNyZWF0ZUR" +
                                                    "hdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtMDEtMTNUMTU6MTE6MzMtMDY6MDA8L" +
                                                    "3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTEzVDE1OjE" +
                                                    "xOjMzLTA2OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wL" +
                                                    "mlpZDo4MDAwYTE3Zi1jZTY1LTQ5NTUtYjFmMS05YjVkODIwNDIyNjU8L3htcE1NOkluc3RhbmNlSUQ" +
                                                    "+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZmZhNDk1Y" +
                                                    "y1mYTU2LTExNzgtOWE5Yy1kODI1ZGZiMGE0NzA8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx" +
                                                    "4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02O" +
                                                    "DEzMTFkNzQwMzE8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3R" +
                                                    "vcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZ" +
                                                    "VR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9" +
                                                    "zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6N" +
                                                    "mIyNGUyN2EtY2YwNy00OWQxLTliMGQtNjgxMzExZDc0MDMxPC9zdEV2dDppbnN0YW5jZUlEPgogICA" +
                                                    "gICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2d" +
                                                    "Dp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3N" +
                                                    "ob3AgQ0MgMjAxNCAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgI" +
                                                    "CAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2U" +
                                                    "iPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgI" +
                                                    "CAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDUzYzc4NDMtYTVmMi00ODQ" +
                                                    "3LThjNDMtNmUyYzBhNDY4YmViPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c" +
                                                    "3RFdnQ6d2hlbj4yMDE2LTAxLTEyVDEyOjI0OjM4LTA2OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICA" +
                                                    "gICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFja" +
                                                    "W50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5" +
                                                    "nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgI" +
                                                    "CAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3R" +
                                                    "FdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0O" +
                                                    "nBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gaW1hZ2UvcG5nIHRvIGFwcGxpY2F0aW9uL3ZuZC5hZG9" +
                                                    "iZS5waG90b3Nob3A8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogI" +
                                                    "CAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICA" +
                                                    "gICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgI" +
                                                    "CA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgzYTc5MGFkLWMwZWQtNGIzYS05ZDJhLWE5YzQ2MWR" +
                                                    "mMzVhMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxN" +
                                                    "i0wMS0xM1QxMzoxMzoyMy0wNjowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ" +
                                                    "0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0O" +
                                                    "nNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmN" +
                                                    "oYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZ" +
                                                    "jpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZ" +
                                                    "lZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAua" +
                                                    "WlkOjA0ZGYyNDk5LWE1NTktNDE4MC1iNjA1LWI2MTk3MWMxNWEwMzwvc3RFdnQ6aW5zdGFuY2VJRD4" +
                                                    "KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc" +
                                                    "3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGh" +
                                                    "vdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgI" +
                                                    "CAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDw" +
                                                    "vcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KI" +
                                                    "CAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZWQ8L3N0RXZ0OmFjdGlvbj4KICA" +
                                                    "gICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvY" +
                                                    "mUucGhvdG9zaG9wIHRvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz4KICAgICAgICAgICAgICA" +
                                                    "gPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiP" +
                                                    "gogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICA" +
                                                    "gICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gYXBwbGljYXRpb" +
                                                    "24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICA" +
                                                    "gICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9I" +
                                                    "lJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN" +
                                                    "0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjgwMDBhMTdmL" +
                                                    "WNlNjUtNDk1NS1iMWYxLTliNWQ4MjA0MjI2NTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICA" +
                                                    "gICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0xM1QxNToxMTozMy0wNjowMDwvc3RFdnQ6d2hlbj4KI" +
                                                    "CAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDI" +
                                                    "wMTQgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzd" +
                                                    "EV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICA" +
                                                    "gICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtc" +
                                                    "E1NOkRlcml2ZWRGcm9tIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgPHN0UmV" +
                                                    "mOmluc3RhbmNlSUQ+eG1wLmlpZDowNGRmMjQ5OS1hNTU5LTQxODAtYjYwNS1iNjE5NzFjMTVhMDM8L" +
                                                    "3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODN" +
                                                    "hNzkwYWQtYzBlZC00YjNhLTlkMmEtYTljNDYxZGYzNWExPC9zdFJlZjpkb2N1bWVudElEPgogICAgI" +
                                                    "CAgICAgICA8c3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6NmIyNGUyN2EtY2YwNy00OWQ" +
                                                    "xLTliMGQtNjgxMzExZDc0MDMxPC9zdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDwve" +
                                                    "G1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ" +
                                                    "+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgI" +
                                                    "CAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOkl" +
                                                    "DQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+C" +
                                                    "iAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24" +
                                                    "+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb" +
                                                    "24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiA" +
                                                    "gICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZ" +
                                                    "jpQaXhlbFhEaW1lbnNpb24+NDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlB" +
                                                    "peGVsWURpbWVuc2lvbj40PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3Jpc" +
                                                    "HRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                    "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5hSvvCAAAAIGN" +
                                                    "IUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAlSURBVHjaPMYxAQAwDAMgV" +
                                                    "kv1VFFRuy9cvN0F7m66JNNhOvwBAPyqCtNeO5K2AAAAAElFTkSuQmCC\");color:#fff}#prettyd" +
                                                    "iff.shadow *:focus{outline:0.1em dashed #ff0}#prettydiff.shadow a:visited{colo" +
                                                    "r:#f93}#prettydiff.shadow a{color:#cf3}#prettydiff.shadow .contentarea,#pretty" +
                                                    "diff.shadow legend,#prettydiff.shadow fieldset select,#prettydiff.shadow .diff" +
                                                    " td,#prettydiff.shadow .report td,#prettydiff.shadow .data li,#prettydiff.shad" +
                                                    "ow .diff-right,#prettydiff.shadow fieldset input{background:#333;border-color:" +
                                                    "#666}#prettydiff.shadow select,#prettydiff.shadow input,#prettydiff.shadow .di" +
                                                    "ff,#prettydiff.shadow .beautify,#prettydiff.shadow .report,#prettydiff.shadow " +
                                                    ".beautify h3,#prettydiff.shadow .diff h3,#prettydiff.shadow .beautify h4,#pret" +
                                                    "tydiff.shadow .diff h4,#prettydiff.shadow #report,#prettydiff.shadow #report ." +
                                                    "author,#prettydiff.shadow fieldset{background:#222;border-color:#666}#prettydi" +
                                                    "ff.shadow fieldset fieldset{background:#333}#prettydiff.shadow fieldset fields" +
                                                    "et input,#prettydiff.shadow fieldset fieldset select{background:#222}#prettydi" +
                                                    "ff.shadow h2,#prettydiff.shadow h2 button,#prettydiff.shadow h3,#prettydiff.sh" +
                                                    "adow input,#prettydiff.shadow option,#prettydiff.shadow select,#prettydiff.sha" +
                                                    "dow legend{color:#ccc}#prettydiff.shadow .contentarea{box-shadow:0 1em 1em #00" +
                                                    "0}#prettydiff.shadow .segment{background:#222}#prettydiff.shadow h2 button,#pr" +
                                                    "ettydiff.shadow td,#prettydiff.shadow th,#prettydiff.shadow .segment,#prettydi" +
                                                    "ff.shadow ol.segment li{border-color:#666}#prettydiff.shadow .count li.fold{co" +
                                                    "lor:#cf3}#prettydiff.shadow th{background:#000}#prettydiff.shadow h2 button{ba" +
                                                    "ckground:#585858;box-shadow:0.1em 0.1em 0.25em #000}#prettydiff.shadow li h4{c" +
                                                    "olor:#ff0}#prettydiff.shadow code{background:#585858;border-color:#585858;colo" +
                                                    "r:#ccf}#prettydiff.shadow ol.segment h4 strong{color:#f30}#prettydiff.shadow b" +
                                                    "utton{background-color:#333;border-color:#666;box-shadow:0 0.25em 0.5em #000;c" +
                                                    "olor:#ccc}#prettydiff.shadow button:hover{background-color:#777;border-color:#" +
                                                    "aaa;box-shadow:0 0.25em 0.5em #222;color:#fff}#prettydiff.shadow th{background" +
                                                    ":#444}#prettydiff.shadow thead th,#prettydiff.shadow th.heading{background:#44" +
                                                    "4}#prettydiff.shadow .diff h3{background:#000;border-color:#666}#prettydiff.sh" +
                                                    "adow .segment,#prettydiff.shadow .data li,#prettydiff.shadow .diff-right{borde" +
                                                    "r-color:#444}#prettydiff.shadow .count li{border-color:#333}#prettydiff.shadow" +
                                                    " .count{background:#555;border-color:#333}#prettydiff.shadow li h4{color:#ff0}" +
                                                    "#prettydiff.shadow code{background:#000;border-color:#000;color:#ddd}#prettydi" +
                                                    "ff.shadow ol.segment h4 strong{color:#c00}#prettydiff.shadow .data .delete{bac" +
                                                    "kground:#300}#prettydiff.shadow .data .delete em{background:#200;border-color:" +
                                                    "#c63;color:#c66}#prettydiff.shadow .data .insert{background:#030}#prettydiff.s" +
                                                    "hadow .data .insert em{background:#010;border-color:#090;color:#6c0}#prettydif" +
                                                    "f.shadow .data .replace{background:#345}#prettydiff.shadow .data .replace em{b" +
                                                    "ackground:#023;border-color:#09c;color:#7cf}#prettydiff.shadow .data .empty{ba" +
                                                    "ckground:#111}#prettydiff.shadow .diff .author{border-color:#666}#prettydiff.s" +
                                                    "hadow .data em.s0{color:#fff}#prettydiff.shadow .data em.s1{color:#d60}#pretty" +
                                                    "diff.shadow .data em.s2{color:#aaf}#prettydiff.shadow .data em.s3{color:#0c0}#" +
                                                    "prettydiff.shadow .data em.s4{color:#f6f}#prettydiff.shadow .data em.s5{color:" +
                                                    "#0cc}#prettydiff.shadow .data em.s6{color:#dc3}#prettydiff.shadow .data em.s7{" +
                                                    "color:#a7a}#prettydiff.shadow .data em.s8{color:#7a7}#prettydiff.shadow .data " +
                                                    "em.s9{color:#ff6}#prettydiff.shadow .data em.s10{color:#33f}#prettydiff.shadow" +
                                                    " .data em.s11{color:#933}#prettydiff.shadow .data em.s12{color:#990}#prettydif" +
                                                    "f.shadow .data em.s13{color:#987}#prettydiff.shadow .data em.s14{color:#fc3}#p" +
                                                    "rettydiff.shadow .data em.s15{color:#897}#prettydiff.shadow .data em.s16{color" +
                                                    ":#f30}#prettydiff.shadow .data .l0{background:#333}#prettydiff.shadow .data .l" +
                                                    "1{background:#633}#prettydiff.shadow .data .l2{background:#335}#prettydiff.sha" +
                                                    "dow .data .l3{background:#353}#prettydiff.shadow .data .l4{background:#636}#pr" +
                                                    "ettydiff.shadow .data .l5{background:#366}#prettydiff.shadow .data .l6{backgro" +
                                                    "und:#640}#prettydiff.shadow .data .l7{background:#303}#prettydiff.shadow .data" +
                                                    " .l8{background:#030}#prettydiff.shadow .data .l9{background:#660}#prettydiff." +
                                                    "shadow .data .l10{background:#003}#prettydiff.shadow .data .l11{background:#30" +
                                                    "0}#prettydiff.shadow .data .l12{background:#553}#prettydiff.shadow .data .l13{" +
                                                    "background:#432}#prettydiff.shadow .data .l14{background:#640}#prettydiff.shad" +
                                                    "ow .data .l15{background:#562}#prettydiff.shadow .data .l16{background:#600}#p" +
                                                    "rettydiff.shadow .data .c0{background:inherit}#prettydiff.white{background:#f8" +
                                                    "f8f8 url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpA" +
                                                    "AAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFP" +
                                                    "pFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkI" +
                                                    "aKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAi" +
                                                    "zZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGA" +
                                                    "YCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABR" +
                                                    "mS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4m" +
                                                    "bI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo6" +
                                                    "2Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+" +
                                                    "H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGL" +
                                                    "c5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdY" +
                                                    "wP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrB" +
                                                    "BG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4D" +
                                                    "j1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI" +
                                                    "9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2" +
                                                    "o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFh" +
                                                    "MWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQA" +
                                                    "kmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUsp" +
                                                    "qShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0u" +
                                                    "hHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVg" +
                                                    "qtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHq" +
                                                    "meob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE" +
                                                    "5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7" +
                                                    "aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6f" +
                                                    "eeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGj" +
                                                    "UYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2B" +
                                                    "aeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZs" +
                                                    "OXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2d" +
                                                    "YzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o2" +
                                                    "6/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc" +
                                                    "+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OP" +
                                                    "zrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45" +
                                                    "wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquN" +
                                                    "m5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJ" +
                                                    "nIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQ" +
                                                    "qohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarniv" +
                                                    "N7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5euf" +
                                                    "r0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+" +
                                                    "Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJz" +
                                                    "s07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvt" +
                                                    "tXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceD" +
                                                    "Tradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2f" +
                                                    "yz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/" +
                                                    "pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xc" +
                                                    "n7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP" +
                                                    "3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70Vvv" +
                                                    "twXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADo2aVRYdFhNTDpjb20uYWRvY" +
                                                    "mUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M" +
                                                    "5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYT" +
                                                    "VAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+CiA" +
                                                    "gIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3lud" +
                                                    "GF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHh" +
                                                    "tbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6e" +
                                                    "G1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN" +
                                                    "0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgI" +
                                                    "CAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICA" +
                                                    "gICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvI" +
                                                    "gogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICA" +
                                                    "gICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgI" +
                                                    "CAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9" +
                                                    "4bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDE2LTAxLTEyVDEyOjI0O" +
                                                    "jM4LTA2OjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNi0" +
                                                    "wMS0xMlQxMjoyNDozOC0wNjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcDpNb2RpZ" +
                                                    "nlEYXRlPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA" +
                                                    "8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOmQ1M2M3ODQzLWE1ZjItNDg0Ny04YzQzLTZlMmMwYTQ2O" +
                                                    "GJlYjwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+YWRvYmU6ZG9" +
                                                    "jaWQ6cGhvdG9zaG9wOjFjMzc2MTgxLWY5ZTgtMTE3OC05YTljLWQ4MjVkZmIwYTQ3MDwveG1wTU06R" +
                                                    "G9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjZiMjR" +
                                                    "lMjdhLWNmMDctNDlkMS05YjBkLTY4MTMxMWQ3NDAzMTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEP" +
                                                    "gogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICA" +
                                                    "gICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c" +
                                                    "3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ" +
                                                    "0Omluc3RhbmNlSUQ+eG1wLmlpZDo2YjI0ZTI3YS1jZjA3LTQ5ZDEtOWIwZC02ODEzMTFkNzQwMzE8L" +
                                                    "3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJ" +
                                                    "UMTI6MjQ6MzgtMDY6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d" +
                                                    "2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2F" +
                                                    "yZUFnZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZ" +
                                                    "GY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F" +
                                                    "2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wL" +
                                                    "mlpZDpkNTNjNzg0My1hNWYyLTQ4NDctOGM0My02ZTJjMGE0NjhiZWI8L3N0RXZ0Omluc3RhbmNlSUQ" +
                                                    "+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDEtMTJUMTI6MjQ6MzgtMDY6MDA8L" +
                                                    "3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFB" +
                                                    "ob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgI" +
                                                    "CAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA" +
                                                    "8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+C" +
                                                    "iAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3N" +
                                                    "ob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6S" +
                                                    "UNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICA" +
                                                    "gIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZ" +
                                                    "XNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOll" +
                                                    "SZXNvbHV0aW9uPjMwMDAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmO" +
                                                    "lJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9" +
                                                    "yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+N" +
                                                    "DwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40PC9" +
                                                    "leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJER" +
                                                    "j4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "AogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
                                                    "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKI" +
                                                    "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
                                                    "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgI" +
                                                    "CAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5cKgaXAAAAIGNIUk0AAHolAACAgwAA+f8AAID" +
                                                    "pAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAkSURBVHjaPMahAQAwDMCg7P+/KnsPcq4oHqpqdwNmBt3QD" +
                                                    "X8AeAUmcrZLnM4AAAAASUVORK5CYII=\")}#prettydiff.white *:focus{outline:0.1em das" +
                                                    "hed #06f}#prettydiff.white .contentarea,#prettydiff.white legend,#prettydiff.w" +
                                                    "hite fieldset select,#prettydiff.white .diff td,#prettydiff.white .report td,#" +
                                                    "prettydiff.white .data li,#prettydiff.white .diff-right,#prettydiff.white fiel" +
                                                    "dset input{background:#fff;border-color:#999}#prettydiff.white select,#prettyd" +
                                                    "iff.white input,#prettydiff.white .diff,#prettydiff.white .beautify,#prettydif" +
                                                    "f.white .report,#prettydiff.white .beautify h3,#prettydiff.white .diff h3,#pre" +
                                                    "ttydiff.white .beautify h4,#prettydiff.white .diff h4,#prettydiff.white #pdsam" +
                                                    "ples li div,#prettydiff.white #report,#prettydiff.white .author,#prettydiff.wh" +
                                                    "ite #report .author,#prettydiff.white fieldset{background:#eee;border-color:#9" +
                                                    "99}#prettydiff.white .diff h3{background:#ddd;border-color:#999}#prettydiff.wh" +
                                                    "ite fieldset fieldset{background:#ddd}#prettydiff.white .contentarea{box-shado" +
                                                    "w:0 1em 1em #999}#prettydiff.white button{background-color:#eee;border-color:#" +
                                                    "999;box-shadow:0 0.25em 0.5em #ccc;color:#666}#prettydiff.white button:hover{b" +
                                                    "ackground-color:#def;border-color:#03c;box-shadow:0 0.25em 0.5em #ccf;color:#0" +
                                                    "3c}#prettydiff.white h2,#prettydiff.white h2 button,#prettydiff.white h3{color" +
                                                    ":#b00}#prettydiff.white th{background:#eee;color:#333}#prettydiff.white thead " +
                                                    "th{background:#eef}#prettydiff.white .report strong{color:#009}#prettydiff.whi" +
                                                    "te .report em{color:#080}#prettydiff.white h2 button,#prettydiff.white td,#pre" +
                                                    "ttydiff.white th,#prettydiff.white .segment,#prettydiff.white .count li,#prett" +
                                                    "ydiff.white .diff-right #prettydiff.white ol.segment li{border-color:#ccc}#pre" +
                                                    "ttydiff.white .data li{border-color:#ccc}#prettydiff.white .count li.fold{colo" +
                                                    "r:#900}#prettydiff.white .count{background:#eed;border-color:#999}#prettydiff." +
                                                    "white h2 button{background:#f8f8f8;box-shadow:0.1em 0.1em 0.25em #ddd}#prettyd" +
                                                    "iff.white li h4{color:#00f}#prettydiff.white code{background:#eee;border-color" +
                                                    ":#eee;color:#009}#prettydiff.white ol.segment h4 strong{color:#c00}#prettydiff" +
                                                    ".white .data .delete{background:#ffd8d8}#prettydiff.white .data .delete em{bac" +
                                                    "kground:#fff8f8;border-color:#c44;color:#900}#prettydiff.white .data .insert{b" +
                                                    "ackground:#d8ffd8}#prettydiff.white .data .insert em{background:#f8fff8;border" +
                                                    "-color:#090;color:#363}#prettydiff.white .data .replace{background:#fec}#prett" +
                                                    "ydiff.white .data .replace em{background:#ffe;border-color:#a86;color:#852}#pr" +
                                                    "ettydiff.white .data .empty{background:#ddd}#prettydiff.white .data em.s0{colo" +
                                                    "r:#000}#prettydiff.white .data em.s1{color:#f66}#prettydiff.white .data em.s2{" +
                                                    "color:#12f}#prettydiff.white .data em.s3{color:#090}#prettydiff.white .data em" +
                                                    ".s4{color:#d6d}#prettydiff.white .data em.s5{color:#7cc}#prettydiff.white .dat" +
                                                    "a em.s6{color:#c85}#prettydiff.white .data em.s7{color:#737}#prettydiff.white " +
                                                    ".data em.s8{color:#6d0}#prettydiff.white .data em.s9{color:#dd0}#prettydiff.wh" +
                                                    "ite .data em.s10{color:#893}#prettydiff.white .data em.s11{color:#b97}#prettyd" +
                                                    "iff.white .data em.s12{color:#bbb}#prettydiff.white .data em.s13{color:#cc3}#p" +
                                                    "rettydiff.white .data em.s14{color:#333}#prettydiff.white .data em.s15{color:#" +
                                                    "9d9}#prettydiff.white .data em.s16{color:#880}#prettydiff.white .data .l0{back" +
                                                    "ground:#fff}#prettydiff.white .data .l1{background:#fed}#prettydiff.white .dat" +
                                                    "a .l2{background:#def}#prettydiff.white .data .l3{background:#efe}#prettydiff." +
                                                    "white .data .l4{background:#fef}#prettydiff.white .data .l5{background:#eef}#p" +
                                                    "rettydiff.white .data .l6{background:#fff8cc}#prettydiff.white .data .l7{backg" +
                                                    "round:#ede}#prettydiff.white .data .l8{background:#efc}#prettydiff.white .data" +
                                                    " .l9{background:#ffd}#prettydiff.white .data .l10{background:#edc}#prettydiff." +
                                                    "white .data .l11{background:#fdb}#prettydiff.white .data .l12{background:#f8f8" +
                                                    "f8}#prettydiff.white .data .l13{background:#ffb}#prettydiff.white .data .l14{b" +
                                                    "ackground:#eec}#prettydiff.white .data .l15{background:#cfc}#prettydiff.white " +
                                                    ".data .l16{background:#eea}#prettydiff.white .data .c0{background:inherit}#pre" +
                                                    "ttydiff.white #report p em{color:#080}#prettydiff.white #report p strong{color" +
                                                    ":#009}#prettydiff #report.contentarea{font-family:\"Lucida Sans Unicode\",\"He" +
                                                    "lvetica\",\"Arial\",sans-serif;max-width:none;overflow:scroll}#prettydiff .dif" +
                                                    "f .replace em,#prettydiff .diff .delete em,#prettydiff .diff .insert em{border" +
                                                    "-style:solid;border-width:0.1em}#prettydiff #report dd,#prettydiff #report dt," +
                                                    "#prettydiff #report p,#prettydiff #report li,#prettydiff #report td,#prettydif" +
                                                    "f #report blockquote,#prettydiff #report th{font-family:\"Lucida Sans Unicode" +
                                                    "\",\"Helvetica\",\"Arial\",sans-serif;font-size:1.2em}#prettydiff div#webtool{" +
                                                    "background:transparent;font-size:inherit;margin:0;padding:0}#prettydiff #jserr" +
                                                    "or span{display:block}#prettydiff #a11y{background:transparent;padding:0}#pret" +
                                                    "tydiff #a11y div{margin:0.5em 0;border-style:solid;border-width:0.1em}#prettyd" +
                                                    "iff #a11y h4{margin:0.25em 0}#prettydiff #a11y ol{border-style:solid;border-wi" +
                                                    "dth:0.1em}#prettydiff #cssreport.doc table{clear:none;float:left;margin-left:1" +
                                                    "em}#prettydiff #css-size{left:24em}#prettydiff #css-uri{left:40em}#prettydiff " +
                                                    "#css-uri td{text-align:left}#prettydiff .report .analysis th{text-align:left}#" +
                                                    "prettydiff .report .analysis .parseData td{font-family:\"Courier New\",Courier" +
                                                    ",\"Lucida Console\",monospace;text-align:left;white-space:pre}#prettydiff .rep" +
                                                    "ort .analysis td{text-align:right}#prettydiff .analysis{float:left;margin:0 1e" +
                                                    "m 1em 0}#prettydiff .analysis td,#prettydiff .analysis th{padding:0.5em}#prett" +
                                                    "ydiff #statreport div{border-style:none}#prettydiff .diff,#prettydiff .beautif" +
                                                    "y{border-style:solid;border-width:0.1em;display:inline-block;margin:0 1em 1em " +
                                                    "0;position:relative}#prettydiff .diff,#prettydiff .diff li #prettydiff .diff h" +
                                                    "3,#prettydiff .diff h4,#prettydiff .beautify,#prettydiff .beautify li,#prettyd" +
                                                    "iff .beautify h3,#prettydiff .beautify h4{font-family:\"Courier New\",Courier," +
                                                    "\"Lucida Console\",monospace}#prettydiff .diff li,#prettydiff .beautify li,#pr" +
                                                    "ettydiff .diff h3,#prettydiff .diff h4,#prettydiff .beautify h3,#prettydiff .b" +
                                                    "eautify h4{border-style:none none solid none;border-width:0 0 0.1em 0;box-shad" +
                                                    "ow:none;display:block;font-size:1.2em;margin:0 0 0 -.1em;padding:0.2em 2em;tex" +
                                                    "t-align:left}#prettydiff .diff .skip{border-style:none none solid;border-width" +
                                                    ":0 0 0.1em}#prettydiff .diff .diff-left{border-style:none;display:table-cell}#" +
                                                    "prettydiff .diff .diff-right{border-style:none none none solid;border-width:0 " +
                                                    "0 0 0.1em;display:table-cell;margin-left:-.1em;min-width:16.5em;right:0;top:0}" +
                                                    "#prettydiff .diff .data li,#prettydiff .beautify .data li{min-width:16.5em;pad" +
                                                    "ding:0.5em}#prettydiff .diff li,#prettydiff .diff p,#prettydiff .diff h3,#pret" +
                                                    "tydiff .beautify li,#prettydiff .beautify p,#prettydiff .beautify h3{font-size" +
                                                    ":1.2em}#prettydiff .diff li em,#prettydiff .beautify li em{font-style:normal;f" +
                                                    "ont-weight:bold;margin:-0.5em -0.09em}#prettydiff .diff p.author{border-style:" +
                                                    "solid;border-width:0.2em 0.1em 0.1em;margin:0;overflow:hidden;padding:0.4em;te" +
                                                    "xt-align:right}#prettydiff .difflabel{display:block;height:0}#prettydiff .coun" +
                                                    "t{border-style:solid;border-width:0 0.1em 0 0;font-weight:normal;padding:0;tex" +
                                                    "t-align:right}#prettydiff .count li{padding:0.5em 1em;text-align:right}#pretty" +
                                                    "diff .count li.fold{cursor:pointer;font-weight:bold;padding-left:0.5em}#pretty" +
                                                    "diff .data{text-align:left;white-space:pre}#prettydiff .beautify .data em{disp" +
                                                    "lay:inline-block;font-style:normal;font-weight:bold}#prettydiff .beautify li,#" +
                                                    "prettydiff .diff li{border-style:none none solid;border-width:0 0 0.1em;displa" +
                                                    "y:block;height:1em;line-height:1.2;list-style-type:none;margin:0;white-space:p" +
                                                    "re}#prettydiff .beautify ol,#prettydiff .diff ol{display:table-cell;margin:0;p" +
                                                    "adding:0}#prettydiff .beautify em.l0,#prettydiff .beautify em.l1,#prettydiff ." +
                                                    "beautify em.l2,#prettydiff .beautify em.l3,#prettydiff .beautify em.l4,#pretty" +
                                                    "diff .beautify em.l5,#prettydiff .beautify em.l6,#prettydiff .beautify em.l7,#" +
                                                    "prettydiff .beautify em.l8,#prettydiff .beautify em.l9,#prettydiff .beautify e" +
                                                    "m.l10,#prettydiff .beautify em.l11,#prettydiff .beautify em.l12,#prettydiff .b" +
                                                    "eautify em.l13,#prettydiff .beautify em.l14,#prettydiff .beautify em.l15,#pret" +
                                                    "tydiff .beautify em.l16{height:2.2em;margin:0 0 -1em;position:relative;top:-0." +
                                                    "5em}#prettydiff .beautify em.l0{margin-left:-0.5em;padding-left:0.5em}#prettyd" +
                                                    "iff #report .beautify,#prettydiff #report .beautify li,#prettydiff #report .di" +
                                                    "ff,#prettydiff #report .diff li{font-family:\"Courier New\",Courier,\"Lucida C" +
                                                    "onsole\",monospace}#prettydiff #report .beautify{border-style:solid}#prettydif" +
                                                    "f #report .diff h3,#prettydiff #report .beautify h3{margin:0}#prettydiff{text-" +
                                                    "align:center;font-size:10px;overflow-y:scroll}#prettydiff .contentarea{border-" +
                                                    "style:solid;border-width:0.1em;font-family:\"Century Gothic\",\"Trebuchet MS\"" +
                                                    ";margin:0 auto;max-width:93em;padding:1em;text-align:left}#prettydiff dd,#pret" +
                                                    "tydiff dt,#prettydiff p,#prettydiff li,#prettydiff td,#prettydiff blockquote,#" +
                                                    "prettydiff th{clear:both;font-family:\"Palatino Linotype\",\"Book Antiqua\",Pa" +
                                                    "latino,serif;font-size:1.6em;line-height:1.6em;text-align:left}#prettydiff blo" +
                                                    "ckquote{font-style:italic}#prettydiff dt{font-size:1.4em;font-weight:bold;line" +
                                                    "-height:inherit}#prettydiff li li,#prettydiff li p{font-size:1em}#prettydiff t" +
                                                    "h,#prettydiff td{border-style:solid;border-width:0.1em;padding:0.1em 0.2em}#pr" +
                                                    "ettydiff td span{display:block}#prettydiff code,#prettydiff textarea{font-fami" +
                                                    "ly:\"Courier New\",Courier,\"Lucida Console\",monospace}#prettydiff code,#pret" +
                                                    "tydiff textarea{display:block;font-size:0.8em;width:100%}#prettydiff code span" +
                                                    "{display:block;white-space:pre}#prettydiff code{border-style:solid;border-widt" +
                                                    "h:0.2em;line-height:1em}#prettydiff textarea{line-height:1.4em}#prettydiff lab" +
                                                    "el{display:inline;font-size:1.4em}#prettydiff legend{border-radius:1em;border-" +
                                                    "style:solid;border-width:0.1em;font-size:1.4em;font-weight:bold;margin-left:-0" +
                                                    ".25em;padding:0 0.5em}#prettydiff fieldset fieldset legend{font-size:1.2em}#pr" +
                                                    "ettydiff table{border-collapse:collapse}#prettydiff div.report{border-style:no" +
                                                    "ne}#prettydiff h2,#prettydiff h3,#prettydiff h4{clear:both}#prettydiff table{m" +
                                                    "argin:0 0 1em}#prettydiff .analysis .bad,#prettydiff .analysis .good{font-weig" +
                                                    "ht:bold}#prettydiff h1{font-size:3em;font-weight:normal;margin-top:0}#prettydi" +
                                                    "ff h1 span{font-size:0.5em}#prettydiff h1 svg{border-style:solid;border-width:" +
                                                    "0.05em;float:left;height:1.5em;margin-right:0.5em;width:1.5em}#prettydiff h2{b" +
                                                    "order-style:none;background:transparent;font-size:1em;box-shadow:none;margin:0" +
                                                    "}#prettydiff h2 button{background:transparent;border-style:solid;cursor:pointe" +
                                                    "r;display:block;font-size:2.5em;font-weight:normal;text-align:left;width:100%;" +
                                                    "border-width:0.05em;font-weight:normal;margin:1em 0 0;padding:0.1em}#prettydif" +
                                                    "f h2 span{display:block;float:right;font-size:0.5em}#prettydiff h3{font-size:2" +
                                                    "em;margin:0;background:transparent;box-shadow:none;border-style:none}#prettydi" +
                                                    "ff h4{font-size:1.6em;font-family:\"Century Gothic\",\"Trebuchet MS\";margin:0" +
                                                    "}#prettydiff li h4{font-size:1em}#prettydiff button,#prettydiff fieldset,#pret" +
                                                    "tydiff div input,#prettydiff textarea{border-style:solid;border-width:0.1em}#p" +
                                                    "rettydiff section{border-style:none}#prettydiff h2 button,#prettydiff select,#" +
                                                    "prettydiff option{font-family:inherit}#prettydiff select{border-style:inset;bo" +
                                                    "rder-width:0.1em;width:13.5em}#prettydiff #dcolorScheme{float:right;margin:-3e" +
                                                    "m 0 0}#prettydiff #dcolorScheme label,#prettydiff #dcolorScheme label{display:" +
                                                    "inline-block;font-size:1em}#prettydiff .clear{clear:both;display:block}#pretty" +
                                                    "diff caption,#prettydiff .content-hide{height:1em;left:-1000em;overflow:hidden" +
                                                    ";position:absolute;top:-1000em;width:1em}/*]]>*/</style></head><body id=\"pret" +
                                                    "tydiff\" class=\"white\"><div class=\"contentarea\" id=\"report\"><section rol" +
                                                    "e=\"heading\"><h1><svg height=\"2000.000000pt\" id=\"pdlogo\" preserveAspectRa" +
                                                    "tio=\"xMidYMid meet\" version=\"1.0\" viewBox=\"0 0 2000.000000 2000.000000\" " +
                                                    "width=\"2000.000000pt\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"#999\" " +
                                                    "stroke=\"none\" transform=\"translate(0.000000,2000.000000) scale(0.100000,-0." +
                                                    "100000)\"> <path d=\"M14871 18523 c-16 -64 -611 -2317 -946 -3588 -175 -660 -31" +
                                                    "9 -1202 -320 -1204 -2 -2 -50 39 -107 91 -961 876 -2202 1358 -3498 1358 -1255 0" +
                                                    " -2456 -451 -3409 -1279 -161 -140 -424 -408 -560 -571 -507 -607 -870 -1320 -10" +
                                                    "62 -2090 -58 -232 -386 -1479 -2309 -8759 -148 -563 -270 -1028 -270 -1033 0 -4 " +
                                                    "614 -8 1365 -8 l1364 0 10 38 c16 63 611 2316 946 3587 175 660 319 1202 320 120" +
                                                    "4 2 2 50 -39 107 -91 543 -495 1169 -862 1863 -1093 1707 -568 3581 -211 4965 94" +
                                                    "6 252 210 554 524 767 796 111 143 312 445 408 613 229 406 408 854 525 1320 57 " +
                                                    "225 380 1451 2310 8759 148 563 270 1028 270 1033 0 4 -614 8 -1365 8 l-1364 0 -" +
                                                    "10 -37z m-4498 -5957 c477 -77 889 -256 1245 -542 523 -419 850 -998 954 -1689 1" +
                                                    "8 -121 18 -549 0 -670 -80 -529 -279 -972 -612 -1359 -412 -480 -967 -779 -1625 " +
                                                    "-878 -121 -18 -549 -18 -670 0 -494 74 -918 255 -1283 548 -523 419 -850 998 -95" +
                                                    "4 1689 -18 121 -18 549 0 670 104 691 431 1270 954 1689 365 293 828 490 1283 54" +
                                                    "5 50 6 104 13 120 15 72 10 495 -3 588 -18z\"/></g></svg><a href=\"prettydiff.c" +
                                                    "om.xhtml\">Pretty Diff</a></h1><p id=\"dcolorScheme\"><label class=\"label\" f" +
                                                    "or=\"colorScheme\">Color Scheme</label><select id=\"colorScheme\"><option>Canv" +
                                                    "as</option><option>Shadow</option><option selected=\"selected\">White</option>" +
                                                    "</select></p><p>Find <a href=\"https://github.com/prettydiff/prettydiff\">Pret" +
                                                    "ty Diff on GitHub</a>.</p></section><section role=\"main\"><div class='report'" +
                                                    "><p><em>0</em> instances of <strong>missing semicolons</strong> counted.</p><p" +
                                                    "><em>0</em> unnessary instances of the keyword <strong>new</strong> counted.</" +
                                                    "p><table class='analysis' summary='JavaScript character size comparison'><capt" +
                                                    "ion>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</t" +
                                                    "h><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr></t" +
                                                    "head><tbody><tr><th>Total Character Size</th><td>89</td><td>109</td><td>20</td" +
                                                    "><td>22.47%</td></tr><tr><th>Total Lines of Code</th><td>1</td><td>24</td><td>" +
                                                    "23</td><td>2300.00%</td></tr></tbody></table><table class='analysis' summary='" +
                                                    "JavaScript component analysis'><caption>JavaScript component analysis</caption" +
                                                    "><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percen" +
                                                    "tage Quantity from Section</th><th>Percentage Qauntity from Total</th><th>Char" +
                                                    "acter Length</th><th>Percentage Length from Section</th><th>Percentage Length " +
                                                    "from Total</th></tr></thead><tbody><tr><th>Total Accounted</th><td>29</td><td>" +
                                                    "100.00%</td><td>100.00%</td><td>89</td><td>100.00%</td><td>100.00%</td></tr><t" +
                                                    "r><th colspan='7'>Comments</th></tr><tr><th>Block Comments</th><td>1</td><td>1" +
                                                    "00.00%</td><td>3.45%</td><td>17</td><td>100.00%</td><td>19.10%</td></tr><tr><t" +
                                                    "h>Inline Comments</th><td>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00" +
                                                    "%</td><td>0.00%</td></tr><tr><th>Comment Total</th><td>1</td><td>100.00%</td><" +
                                                    "td>3.45%</td><td>17</td><td>100.00%</td><td>19.10%</td></tr><tr><th colspan='7" +
                                                    "'>Whitespace Outside of Strings and Comments</th></tr><tr><th>New Lines</th><t" +
                                                    "d>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</td></tr" +
                                                    "><tr><th>Spaces</th><td>3</td><td>100.00%</td><td>10.34%</td><td>3</td><td>100" +
                                                    ".00%</td><td>3.37%</td></tr><tr><th>Tabs</th><td>0</td><td>0.00%</td><td>0.00%" +
                                                    "</td><td>0</td><td>0.00%</td><td>0.00%</td></tr><tr><th>Other Whitespace</th><" +
                                                    "td>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</td></t" +
                                                    "r><tr><th>Total Whitespace</th><td>3</td><td>100.00%</td><td>10.34%</td><td>3<" +
                                                    "/td><td>100.00%</td><td>3.37%</td></tr><tr><th colspan='7'>Literals</th></tr><" +
                                                    "tr><th>Strings</th><td>1</td><td>50.00%</td><td>3.45%</td><td>10</td><td>55.56" +
                                                    "%</td><td>11.24%</td></tr><tr><th>Numbers</th><td>1</td><td>50.00%</td><td>3.4" +
                                                    "5%</td><td>8</td><td>44.44%</td><td>8.99%</td></tr><tr><th>Regular Expressions" +
                                                    "</th><td>0</td><td>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</" +
                                                    "td></tr><tr><th>Total Literals</th><td>2</td><td>100.00%</td><td>6.90%</td><td" +
                                                    ">18</td><td>100.00%</td><td>20.22%</td></tr><tr><th colspan='7'>Syntax Charact" +
                                                    "ers</th></tr><tr><th>Quote Characters</th><td>2</td><td>11.76%</td><td>6.90%</" +
                                                    "td><td>2</td><td>11.76%</td><td>2.25%</td></tr><tr><th>Commas</th><td>0</td><t" +
                                                    "d>0.00%</td><td>0.00%</td><td>0</td><td>0.00%</td><td>0.00%</td></tr><tr><th>C" +
                                                    "ontainment Characters</th><td>8</td><td>47.06%</td><td>27.59%</td><td>8</td><t" +
                                                    "d>47.06%</td><td>8.99%</td></tr><tr><th>Semicolons</th><td>4</td><td>23.53%</t" +
                                                    "d><td>13.79%</td><td>4</td><td>23.53%</td><td>4.49%</td></tr><tr><th>Operators" +
                                                    "</th><td>3</td><td>17.65%</td><td>10.34%</td><td>3</td><td>17.65%</td><td>3.37" +
                                                    "%</td></tr><tr><th>Total Syntax Characters</th><td>17</td><td>100.00%</td><td>" +
                                                    "58.62%</td><td>17</td><td>100.00%</td><td>19.10%</td></tr><tr><th colspan='7'>" +
                                                    "Keywords and Variables</th></tr><tr><th>Words</th><td>6</td><td>100.00%</td><t" +
                                                    "d>20.69%</td><td>34</td><td>100.00%</td><td>38.20%</td></tr><tr><th colspan='7" +
                                                    "'>Server-side Tags</th></tr><tr><th>Server Tags</th><td>0</td><td>100.00%</td>" +
                                                    "<td>0.00%</td><td>0</td><td>100.00%</td><td>0.00%</td></tr></tbody></table></d" +
                                                    "iv></section></div><script type=\"application/javascript\">//<![CDATA[\r\nvar " +
                                                    "pd={};pd.colorchange=function(){\"use strict\";var options=this.getElementsByT" +
                                                    "agName(\"option\");document.getElementsByTagName(\"body\")[0].setAttribute(\"c" +
                                                    "lass\",options[this.selectedIndex].innerHTML.toLowerCase())};document.getEleme" +
                                                    "ntById(\"colorScheme\").onchange=pd.colorchange;//]]>\r\n</script></body></htm" +
                                                    "l>"
                                        }
                                    ]
                                }, {
                                    group: "write to new locations",
                                    units: [
                                        {
                                            check : "node api/node-local.js source:\"inch.json\" readmethod:\"file\" mode:\"beautif" +
                                                    "y\" output:\"test/simulation/inch.json\"",
                                            name  : "Beautify inch.json",
                                            verify: "\nFile successfully written.\n\nPretty Diff beautified x files. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"api\" readmethod:\"directory\" mode:\"beautify" +
                                                    "\" output:\"test/simulation/api\"",
                                            name  : "Beautify api directory",
                                            verify: "\nPretty Diff beautified x files. Executed in."
                                        }, {
                                            check : "node api/node-local.js source:\"test\" readmethod:\"subdirectory\" mode:\"pars" +
                                                    "e\" output:\"test/simulation/all/big\"",
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
                                            verify: (node.path.sep === "\\")
                                                ? "dom.js\r\nnode-local.js"
                                                : "dom.js\nnode-local.js"
                                        }, {
                                            check : "cat test/simulation/all/big/today.js",
                                            name  : "check for a file in a subdirectory operation",
                                            verify: "{\"data\":{\"begin\":[0,1,1,3,3,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,20,20,1,0],\"dep" +
                                                    "th\":[\"global\",\"paren\",\"paren\",\"expression\",\"expression\",\"function" +
                                                    "\",\"function\",\"function\",\"function\",\"function\",\"function\",\"function" +
                                                    "\",\"function\",\"function\",\"function\",\"function\",\"function\",\"function" +
                                                    "\",\"function\",\"function\",\"method\",\"method\",\"paren\",\"global\"],\"lin" +
                                                    "es\":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\"token\":[\"/*global m" +
                                                    "odule*/\",\"(\",\"function\",\"(\",\")\",\"{\",\"\\\"use strict\\\"\",\";\",\"" +
                                                    "var\",\"today\",\"=\",\"20999999\",\";\",\"module\",\".\",\"exports\",\"=\",\"" +
                                                    "today\",\";\",\"}\",\"(\",\")\",\")\",\";\"],\"types\":[\"comment\",\"start\"," +
                                                    "\"word\",\"start\",\"end\",\"start\",\"literal\",\"separator\",\"word\",\"word" +
                                                    "\",\"operator\",\"literal\",\"separator\",\"word\",\"separator\",\"word\",\"op" +
                                                    "erator\",\"word\",\"separator\",\"end\",\"start\",\"end\",\"end\",\"separator" +
                                                    "\"]},\"definition\":{\"begin\":\"number - The index where the current containe" +
                                                    "r starts\",\"depth\":\"string - The name of the current container\",\"lines\":" +
                                                    "\"number - Whether the token is preceeded any space and/or line breaks in the " +
                                                    "original code source\",\"token\":\"string - The parsed code tokens\",\"types\"" +
                                                    ":\"string - Data types of the tokens: comment, comment-inline, end, literal, m" +
                                                    "arkup, operator, regex, separator, start, template, template_else, template_en" +
                                                    "d, template_start, word\"}}"
                                        }, {
                                            check : "cat test/simulation/all/big/samples_correct/beautification_markup_comment.txt",
                                            name  : "check for a deeper file in a subdirectory operation",
                                            verify: "{\"data\":{\"attrs\":[{},{},{},{},{},{}],\"begin\":[0,0,0,2,2,0],\"daddy\":[\"" +
                                                    "root\",\"person\",\"person\",\"name\",\"name\",\"person\"],\"jscom\":[false,fa" +
                                                    "lse,false,false,false,false],\"linen\":[1,2,3,3,3,4],\"lines\":[0,1,1,0,0,1]," +
                                                    "\"presv\":[false,false,false,false,false,false],\"token\":[\"<person>\",\"<!-- " +
                                                    "comment -->\",\"<name>\",\"bob\",\"</name>\",\"</person>\"],\"types\":[\"start" +
                                                    "\",\"comment\",\"start\",\"content\",\"end\",\"end\"]},\"definition\":{\"attrs" +
                                                    "\":\"array - List of attributes (if any) for the given token.\",\"begin\":\"nu" +
                                                    "mber - Index where the parent element occurs.\",\"daddy\":\"string - Tag name " +
                                                    "of the parent element. Tokens of type 'template_start' are not considered as p" +
                                                    "arent elements.  End tags reflect their matching start tag.\",\"jscom\":\"bool" +
                                                    "ean - Whether the token is a JavaScript comment if in JSX format.\",\"linen\":" +
                                                    "\"number - The line number in the original source where the token started, whi" +
                                                    "ch is used for reporting and analysis.\",\"lines\":\"number - Whether the toke" +
                                                    "n is preceeded any space and/or line breaks in the original code source.\",\"p" +
                                                    "resv\":\"boolean - Whether the token is preserved verbatim as found.  Useful f" +
                                                    "or comments and HTML 'pre' tags.\",\"token\":\"string - The parsed code tokens" +
                                                    ".\",\"types\":\"string - Data types of the tokens: cdata, comment, conditional" +
                                                    ", content, end, ignore, linepreserve, script, sgml, singleton, start, template" +
                                                    ", template_else, template_end, template_start, xml\"}}"
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
                        if (node.path.sep === "/") {
                            return command;
                        }
                        if (node.path.sep !== "\\") {
                            dirchar = node.path.sep;
                        }
                        comchars = command.split("");
                        for (a = comchars.length - 1; a > -1; a = a - 1) {
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
                                output = output.replace(
                                    /^(rm\u0020(-\w+\u0020)*)/,
                                    "powershell.exe -nologo -noprofile -command \"rm "
                                ) + " -r -force\"";
                            }
                            output = output.replace(/^(cat\u0020)/, "type ");
                            output = output.replace(/^(ls\u0020(-\w+\u0020)*)/, "dir /b ");
                        }
                        return output;
                    },
                    shell     = function taskrunner_simulations_shell(testData) {
                        var tab       = (function taskrunner_simulations_shell_child_writeLine_tab() {
                                var a   = 0,
                                    b   = 0,
                                    str = "";
                                for (a = depth + 2; a > 0; a = a - 1) {
                                    for (b = tablen; b > 0; b = b - 1) {
                                        str = str + " ";
                                    }
                                }
                                return str;
                            }()),
                            child     = function taskrunner_simulations_shell_child(param) {
                                param.check = slashfix(param.check);
                                node.child(param.check, {
                                    timeout: 1200000
                                }, function taskrunner_simulations_shell_child_childExec(err, stdout, stderr) {
                                    var failflag  = false,
                                        data      = [param.name],
                                        verifies  = function taskrunner_simulations_shell_child_childExec_verifies(
                                            output,
                                            list
                                        ) {
                                            var aa  = 0,
                                                len = list.length;
                                            if (output === list[0]) {
                                                passcount[depth] = passcount[depth] + 1;
                                                data.push("pass");
                                                return data.push(stdout);
                                            }
                                            do {
                                                aa = aa + 1;
                                                if (output === list[aa]) {
                                                    passcount[depth] = passcount[depth] + 1;
                                                    data.push("pass");
                                                    return data.push(stdout);
                                                }
                                            } while (aa < len);
                                            data.push("fail");
                                            data.push("Unexpected output:");
                                            failflag = true;
                                        },
                                        //what to do when a group concludes
                                        writeLine = function taskrunner_simulations_shell_child_childExec_writeLine(
                                            item
                                        ) {
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
                                                            console.log(
                                                                tab.slice(tablen) + "\u001B[32mThe test passed" + groupn + "\u001B[39m"
                                                            );
                                                        } else {
                                                            console.log(
                                                                tab.slice(tablen) + "\u001B[32mAll " + grouplen[depth] +
                                                                " tests/groups passed" + groupn + "\u001B[39m"
                                                            );
                                                        }
                                                        groupPass = true;
                                                    } else {
                                                        if (passcount[depth] === 0) {
                                                            if (grouplen[depth] === 1) {
                                                                console.log(
                                                                    tab.slice(tablen) + "\u001B[31mThe test failed" + groupn + "\u001B[39m"
                                                                );
                                                            } else {
                                                                console.log(
                                                                    tab.slice(tablen) + "\u001B[31mAll " + grouplen[depth] +
                                                                    " tests/groups failed" + groupn + "\u001B[39m"
                                                                );
                                                            }
                                                        } else {
                                                            fgroup  = fgroup + 1;
                                                            fail    = finished[depth] - passcount[depth];
                                                            failper = (fail / grouplen[depth]) * 100;
                                                            if (fail === 1) {
                                                                plural = "";
                                                            } else {
                                                                plural = "s";
                                                            }
                                                            console.log(
                                                                tab.slice(tablen) + "\u001B[31m" + fail + "\u001B[39m test" + plural + " (" +
                                                                failper.toFixed(0) + "%) failed of \u001B[32m" + finished[depth] + "\u001B[39m " +
                                                                "tests" + groupn + "."
                                                            );
                                                        }
                                                    }
                                                    teardowns.pop();
                                                    grouplen.pop();
                                                    groupname.pop();
                                                    passcount.pop();
                                                    finished.pop();
                                                    units.pop();
                                                    index.pop();
                                                    depth = depth - 1;
                                                    if (depth > -1) {
                                                        tab             = tab.slice(tablen);
                                                        finished[depth] = finished[depth] + 1;
                                                        groupn          = " for group: \u001B[39m\u001B[33m" + groupname[depth] + "\u001B[39m";
                                                        if (groupPass === true) {
                                                            passcount[depth] = passcount[depth] + 1;
                                                        }
                                                        if (finished[depth] < grouplen[depth]) {
                                                            index[depth] = index[depth] + 1;
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
                                                        gcount = gcount - 1;
                                                        if (fails === 0) {
                                                            console.log(
                                                                "\u001B[32mPassed all " + total + " test" + plural + " from all " + gcount + " " +
                                                                "groups.\u001B[39m"
                                                            );
                                                            console.log("");
                                                            console.log("\u001B[32mCLI simulation complete\u001B[39m");
                                                            return next();
                                                        }
                                                        if (fails === total) {
                                                            errout(
                                                                "\u001B[31mFailed all " + total + " test" + plural + " from all " + gcount + " " +
                                                                "groups.\u001B[39m"
                                                            );
                                                        } else {
                                                            // a hack, this should not increment when a test failure occurred in a child
                                                            // group
                                                            fgroup = fgroup - 1;
                                                            if (fgroup === 1) {
                                                                groupn = "";
                                                            }
                                                            errout(
                                                                "\u001B[31mFailed " + fails + " test" + totaln + " from " + fgroup + " group" +
                                                                groupn + "\u001B[39m out of " + total + " total tests across " + gcount + " gro" +
                                                                "up" + status + "."
                                                            );
                                                        }
                                                        return stdout;
                                                    }
                                                    if (depth > -1 && finished[depth] === grouplen[depth]) {
                                                        groupComplete();
                                                    }
                                                },
                                                teardown      = function taskrunner_simulations_shell_child_writeLine_teardown(
                                                    tasks
                                                ) {
                                                    var a    = 0,
                                                        len  = tasks.length,
                                                        task = function taskrunner_simulations_shell_child_writeLine_teardown_task() {
                                                            var execCallback = function taskrunner_simulations_shell_child_writeLine_teardown_task_exec(
                                                                err,
                                                                stdout,
                                                                stderr
                                                            ) {
                                                                a = a + 1;
                                                                if (typeof err === "string") {
                                                                    console.log(err);
                                                                    if (err.indexOf("The directory is not empty.") > 0) {
                                                                        console.log(
                                                                            "(err) Async error in Windows file system.  Trying one more time..."
                                                                        );
                                                                        a = a - 1;
                                                                        return setTimeout(
                                                                            node.child(tasks[a], taskrunner_simulations_shell_child_writeLine_teardown_task_exec),
                                                                            1000
                                                                        );
                                                                    }
                                                                } else if (typeof stderr === "string" && stderr !== "") {
                                                                    console.log(stderr);
                                                                    if (stderr.indexOf("The directory is not empty.") > 0) {
                                                                        console.log(
                                                                            "(stderr) Async error in Windows file system.  Trying one more time..."
                                                                        );
                                                                        a = a - 1;
                                                                        return setTimeout(
                                                                            node.child(tasks[a], taskrunner_simulations_shell_child_writeLine_teardown_task_exec),
                                                                            1000
                                                                        );
                                                                    }
                                                                } else {
                                                                    if (stdout.indexOf("The directory s not empty.") > 0) {
                                                                        console.log(
                                                                            "(stdout) Async error in Windows file system.  Trying one more time..."
                                                                        );
                                                                        a = a - 1;
                                                                        return setTimeout(
                                                                            node.child(tasks[a], taskrunner_simulations_shell_child_writeLine_teardown_task_exec),
                                                                            1000
                                                                        );
                                                                    }
                                                                    if (a === len) {
                                                                        console.log(
                                                                            tab + "\u001B[36mTeardown\u001B[39m for group: \u001B[33m" + groupname[depth] + "\u001B[39m \u001B[32mcomplete\u001B[39m."
                                                                        );
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
                                                                node.child(tasks[a], execCallback);
                                                            }
                                                        };
                                                    console.log("");
                                                    console.log(
                                                        tab + "\u001B[36mTeardown\u001B[39m for group: \u001B[33m" + groupname[depth] + "\u001B[39m \u001B[36mstarted\u001B[39m."
                                                    );
                                                    task();
                                                };
                                            groupComplete   = function taskrunner_simulations_shell_child_writeLine_groupComplete() {
                                                if (teardowns[depth].length > 0) {
                                                    teardown(teardowns[depth]);
                                                } else {
                                                    groupEnd();
                                                }
                                            };
                                            finished[depth] = finished[depth] + 1;
                                            if (single === false && finished[depth] === 1) {
                                                if (depth === 0) {
                                                    console.log(
                                                        tab.slice(tablen) + "\u001B[36mTest group: \u001B[39m\u001B[33m" + groupname[depth] +
                                                        "\u001B[39m"
                                                    );
                                                } else {
                                                    console.log(
                                                        tab.slice(tablen) + "Test unit " + (
                                                            finished[depth - 1] + 1
                                                        ) + " of " + grouplen[depth - 1] +
                                                        ", \u001B[36mtest group: \u001B[39m\u001B[33m" + groupname[depth] +
                                                        "\u001B[39m"
                                                    );
                                                }
                                            }
                                            console.log("");
                                            console.log(
                                                tab.slice(tab.length - 2) + "\u001B[36m*\u001B[39m " + item[0]
                                            );
                                            console.log(
                                                tab + status + finished[depth] + " of " + grouplen[depth] + totaln
                                            );
                                            if (item[1] !== "pass") {
                                                fails = fails + 1;
                                                console.log(tab + item[2]);
                                            }
                                            if (finished[depth] === grouplen[depth]) {
                                                groupComplete();
                                            } else if (units[finished[depth]] !== undefined && units[finished[depth]].group !== undefined) {
                                                taskrunner_simulations_shell(units[finished[depth]]);
                                            }
                                        };
                                    stdout = stdout.replace(/(\s+)$/, "");
                                    stdout = stdout.replace(
                                        /<strong>Execution\u0020time:<\/strong>\u0020<em>([0-9]+\u0020hours\u0020)?([0-9]+\u0020minutes\u0020)?[0-9]+(\.[0-9]+)?\u0020seconds\u0020<\/em>/g,
                                        "<strong>Execution time:</strong> <em>0</em>"
                                    );
                                    stdout = stdout.replace(
                                        /Executed\u0020in\u0020([0-9]+\u0020hours?\u0020)?([0-9]+\u0020minutes?\u0020)?[0-9]+(\.[0-9]+)?\u0020seconds?/g,
                                        "Executed in"
                                    );
                                    stdout = stdout.replace(/\u0020\d+\u0020files?\./, " x files.");
                                    stdout = stdout.replace(/20\d{6}/, "20999999");
                                    //determine pass/fail status of a given test unit
                                    if (stdout.indexOf("Source file at ") > -1 && stdout.indexOf("is \u001B[31mempty\u001B[39m but the diff file is not.") > 0) {
                                        stdout = stdout.slice(0, stdout.indexOf("Source file at") + 14) + " - " +
                                                stdout.slice(
                                            stdout.indexOf("is \u001B[31mempty\u001B[39m but the diff file is not.")
                                        );
                                    } else if (stdout.indexOf("Diff file at ") > -1 && stdout.indexOf("is \u001B[31mempty\u001B[39m but the source file is not.") > 0) {
                                        stdout = stdout.slice(0, stdout.indexOf("Diff file at") + 12) + " - " +
                                                stdout.slice(
                                            stdout.indexOf("is \u001B[31mempty\u001B[39m but the source file is not.")
                                        );
                                    }
                                    if (stdout.indexOf("Pretty Diff found 0 differences.") < 0) {
                                        stdout = stdout.replace(
                                            /Pretty\u0020Diff\u0020found\u0020\d+\u0020differences./,
                                            "Pretty Diff found x differences."
                                        );
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
                                        passcount[depth] = passcount[depth] + 1;
                                        data.push("pass");
                                        data.push(stdout);
                                    }
                                    total = total + 1;
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
                                        var buildstep = function taskrunner_simulations_shell_buildup_task_buildstep(
                                            err,
                                            stdout,
                                            stderr
                                        ) {
                                            a = a + 1;
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
                                                    console.log(
                                                        tab + "\u001B[36mBuildup\u001B[39m for group: \u001B[33m" + testData.group + "" +
                                                        "\u001B[39m \u001B[32mcomplete\u001B[39m."
                                                    );
                                                    if (index[depth] === 0 && units[depth][index[depth]].group !== undefined) {
                                                        taskrunner_simulations_shell(units[depth][index[depth]]);
                                                        return stdout;
                                                    }
                                                    for (
                                                        index[depth] = index[depth];
                                                        index[depth] < grouplen[depth];
                                                        index[depth] = index[depth] + 1
                                                    ) {
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
                                            a = a + 1;
                                            if (a < len) {
                                                taskrunner_simulations_shell_buildup_task();
                                            }
                                        } else if (node.path.sep === "\\" && (/^(echo\s+("|'))/).test(tasks[a]) === true) {
                                            tasks[a]       = slashfix(tasks[a]);
                                            //windows will write CLI strings to files including the containing quotes
                                            options.source = tasks[a];
                                            options.mode   = "parse";
                                            options.lang   = "javascript";
                                            echo           = prettydiff(options);
                                            node.fs.writeFile(
                                                echo.data.token.slice(3).join("").replace(/(x?;)$/, ""),
                                                echo.data.token[1].slice(1, echo.data.token[1].length - 1),
                                                buildstep
                                            );
                                        } else {
                                            tasks[a] = slashfix(tasks[a]);
                                            node.child(tasks[a], buildstep);
                                        }
                                    };
                                console.log("");
                                console.log(
                                    tab + "\u001B[36mBuildup\u001B[39m for group: \u001B[33m" + testData.group + "" +
                                    "\u001B[39m \u001B[36mstarted\u001B[39m."
                                );
                                task();
                            };
                        passcount.push(0);
                        if (single === false) {
                            groupname.push(testData.group);
                            finished.push(0);
                            index.push(0);
                            gcount = gcount + 1;
                            depth  = depth + 1;
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
                                for (
                                    index[depth] = index[depth];
                                    index[depth] < grouplen[depth];
                                    index[depth] = index[depth] + 1
                                ) {
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
    return "";
}());
