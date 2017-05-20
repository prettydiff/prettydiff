/*prettydiff.com topcoms: true, insize: 4, inchar: " ", vertical: true */
/*jshint laxbreak: true*/
/*jslint node: true*/
/***********************************************************************
 node-local is written by Austin Cheney on 6 Nov 2012.

 Please see the license.txt file associated with the Pretty Diff
 application for license information.
 **********************************************************************/
/*

http://prettydiff.com/

Command line API for Prettydiff for local execution only.  This API is
not intended for execution as a service on a remote server.

Arguments entered from the command line are separated by spaces and
values are separated from argument names by a colon.  For safety
argument values should always be quoted.

Examples:

> node node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file" diff:"c:\myotherfile.js"
> node node-local.js source:"c:\mydirectory\myfile.js" mode:"beautify" readmethod:"file" output:"c:\output\otherfile.js"
> node node-local.js source:"../package.json" mode:"beautify" readmethod:"filescreen"

Manage with biddle

> biddle install http://prettydiff.com/downloads/prettydiff/prettydiff_latest.zip
> biddle global prettydiff
> prettydiff source:"c:\mydirectory\myfile.js" readmethod:"file" diff:"c:\myotherfile.js"

*/
//schema for global.prettydiff.meta
//lang - array, language detection
//time - string, proctime (total execution time minus visual rendering)
//insize - number, input size
//outsize - number, output size
//difftotal - number, difference count
//difflines - number, difference lines
(function pdNodeLocal() {
    "use strict";
    var startTime      = process.hrtime(),
        node           = {
            fs   : require("fs"),
            http : require("http"),
            https: require("https"),
            path : require("path")
        },
        localPath      = (process.cwd() === "/" || (/^([a-z]:\\)$/).test(process.cwd()) === true)
            ? __dirname.replace(/(api)$/, "")
            : "../",
        cwd            = (process.cwd() === "/")
            ? __dirname
            : process.cwd(),
        options        = {},
        diffCount      = [
            0, 0, 0, 0, 0
        ],
        method         = "auto",
        langauto       = false,
        prettydiff     = function pdNodeLocal__prettydiff() {
            var lang       = (function pdNodeLocal__prettydiff_lang() {
                    if (langauto === true) {
                        options.lang = "auto";
                    }
                    return options.lang;
                }()),
                pdresponse = global.prettydiff.prettydiff(options),
                data       = (options.nodeasync === true)
                    ? (options.mode === "parse" && method !== "screen" && method !== "filescreen" && options.parseFormat !== "htmltable")
                        ? JSON.stringify(pdresponse[0])
                        : pdresponse[0]
                    : (options.mode === "parse" && method !== "screen" && method !== "filescreen" && options.parseFormat !== "htmltable")
                        ? JSON.stringify(pdresponse)
                        : pdresponse,
                meta       = (options.nodeasync === true)
                    ? pdresponse[1]
                    : global.prettydiff.meta;
            if (options.nodeerror === true) {
                console.log(meta.error);
            }
            diffCount[0] = diffCount[0] + meta.difftotal;
            if (meta.difftotal > 0) {
                diffCount[1] = diffCount[1] + 1;
            }
            diffCount[2] = diffCount[2] + 1;
            diffCount[3] = diffCount[3] + meta.insize;
            diffCount[4] = diffCount[4] + meta.outsize;
            if (options.diffcli === true) {
                return pdresponse;
            }
            if (typeof pdresponse === "string") {
                pdresponse = pdresponse.replace(/(\s+)$/, "");
            }
            if (meta.error !== "") {
                global.prettydiff.finalFile.order[9] = "<p><strong>Error:</strong> " + meta.error + "</p>";
            }
            if (options.mode === "diff" || options.mode === "analysis" || (options.mode === "parse" && options.parseFormat === "htmltable")) {
                global.prettydiff.finalFile.order[7]  = options.color;
                global.prettydiff.finalFile.order[10] = data;
                if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                    global.prettydiff.finalFile.order[12] = global.prettydiff.finalFile.script.beautify;
                } else if (options.mode === "diff") {
                    global.prettydiff.finalFile.order[12] = global.prettydiff.finalFile.script.diff;
                }
                return global.prettydiff.finalFile.order.join("");
            }
            if (lang === null) {
                return lang;
            }
            return data;
        },
        sfiledump      = [],
        dfiledump      = [],
        sState         = [],
        dState         = [],
        clidata        = [
            [], [], []
        ],
        lf             = "\n",
        dir            = [
            0, 0, 0
        ],
        address        = {
            dabspath: "",
            dorgpath: "",
            oabspath: "",
            oorgpath: "",
            sabspath: "",
            sorgpath: ""
        },
        help           = false,
        total          = [
            0, 0
        ],
        colors         = {
            del     : {
                charEnd  : "\u001B[22m",
                charStart: "\u001B[1m",
                lineEnd  : "\u001B[39m",
                lineStart: "\u001B[31m"
            },
            filepath: {
                end  : "\u001B[39m",
                start: "\u001B[36m"
            },
            ins     : {
                charEnd  : "\u001B[22m",
                charStart: "\u001B[1m",
                lineEnd  : "\u001B[39m",
                lineStart: "\u001B[32m"
            }
        },
        enderflag      = false,

        //ending messaging with stats
        ender          = function pdNodeLocal__ender() {
            var plural = (function pdNodeLocal__ender_plural() {
                    var a   = 0,
                        len = diffCount.length,
                        arr = [];
                    for (a = 0; a < len; a = a + 1) {
                        if (diffCount[a] === 1) {
                            arr.push("");
                        } else {
                            arr.push("s");
                        }
                    }
                    if (clidata[1].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    if (clidata[0].length === 1) {
                        arr.push("");
                    } else {
                        arr.push("s");
                    }
                    return arr;
                }()),
                log    = [],
                time   = 0;
            if (enderflag === true) {
                return;
            }
            if (options.endquietly !== "log" && options.summaryonly === false && options.diffcli === false && (method === "filescreen" || method === "screen")) {
                return;
            }

            // indexes of diffCount array
            //* 0 - total number of differences
            //* 1 - the number of files containing those differences
            //* 2 - total file count (not counting (sub)directories)
            //* 3 - total input size (in characters from all files)
            //* 4 - total output size (in characters from all files)
            if ((method !== "directory" && method !== "subdirectory") || sfiledump.length === 1) {
                plural[1] = "";
            }
            if (options.diffcli === true && options.mode === "diff") {
                if (options.summaryonly === true && options.readmethod !== "screen" && clidata[2].length > 0) {
                    log.push(lf + "Files changed:" + lf);
                    log.push(colors.filepath.start);
                    log.push(clidata[2].join(lf));
                    log.push(colors.filepath.end);
                    log.push(lf + lf);
                }
                if (clidata[0].length > 0) {
                    log.push(lf + "Files deleted:" + lf);
                    log.push(colors.del.lineStart);
                    log.push(clidata[0].join(lf));
                    log.push(colors.del.lineEnd);
                    log.push(lf + lf);
                }
                if (clidata[1].length > 0) {
                    log.push(lf + "Files inserted:" + lf);
                    log.push(colors.ins.lineStart);
                    log.push(clidata[1].join(lf));
                    log.push(colors.ins.lineEnd);
                    log.push(lf + lf);
                }
            }
            log.push(lf + "Pretty Diff ");
            if (options.mode === "diff") {
                if (method !== "directory" && method !== "subdirectory") {
                    log.push("found ");
                    log.push(diffCount[0]);
                    if (diffCount[1] < 0) {
                        log.push("+");
                    }
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(". ");
                } else {
                    log.push("found ");
                    log.push(diffCount[0]);
                    log.push(" difference");
                    log.push(plural[0]);
                    log.push(" in ");
                    log.push(diffCount[1]);
                    log.push(" file");
                    log.push(plural[1]);
                    log.push(" out of ");
                }
            } else if (options.mode === "beautify") {
                log.push("beautified ");
            } else if (options.mode === "minify") {
                log.push("minified ");
            } else if (options.mode === "parse") {
                log.push("parsed ");
            }
            if (options.mode !== "diff" || method === "directory" || method === "subdirectory") {
                log.push(diffCount[2]);
                log.push(" file");
                log.push(plural[2]);
                log.push(". ");
            }
            if (options.mode === "diff" && (method === "directory" || method === "subdirectory")) {
                log.push(clidata[1].length);
                log.push(" file");
                log.push(plural[2]);
                log.push(" added. ");
                log.push(clidata[0].length);
                log.push(" file");
                log.push(plural[3]);
                log.push(" deleted. Executed in ");
            } else {
                log.push("Executed in ");
            }
            time = (function pdNodeLocal_ender_time() {
                var endtime = process.hrtime(),
                    dtime   = [endtime[0] - startTime[0], endtime[1] - startTime[1]],
                    strTime = "";
                if (dtime[1] === 0) {
                    return dtime[0] + "";
                }
                if (dtime[1] < 0) {
                    dtime[1] = ((1000000000 + endtime[1]) - startTime[1]);
                }
                strTime = dtime[1] + "";
                if (strTime.length < 9) {
                    do {
                        strTime = strTime + 0;
                    } while (strTime.length < 9);
                } else if (strTime.length > 9) {
                    strTime = strTime.slice(0, 9);
                }
                return dtime[0] + "." + strTime;
            }());
            log.push(time);
            log.push(" second");
            if (time !== 1) {
                log.push("s");
            }
            log.push("." + lf);
            console.log(log.join(""));
            enderflag = true;
        },

        //write output to a file executed from fileComplete
        fileWrite      = function pdNodeLocal__fileWrite(data) {
            var dirs     = data
                    .localpath
                    .split(node.path.sep),
                suffix   = (options.mode === "diff")
                    ? "-diff.html"
                    : "-report.html",
                filename = dirs[dirs.length - 1],
                count    = 1,
                writing  = function pdNodeLocal__fileWrite_writing(ending, dataA) {
                    if (dataA.binary === true) {
                        //binary
                        node
                            .fs
                            .writeFile(dataA.finalpath, dataA.file, function pdNodeLocal__fileWrite_writing_writeFileBinary(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing binary output." + lf);
                                    console.log(err);
                                }
                                total[1] = total[1] + 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else if (dataA.file === "") {
                        //empty files
                        node
                            .fs
                            .writeFile(dataA.finalpath + ending, "", function pdNodeLocal__fileWrite_writing_writeFileEmpty(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing empty output." + lf);
                                    console.log(err);
                                } else if (method === "file" && options.endquietly !== "quiet") {
                                    console.log(lf + "Empty file successfully written to file.");
                                }
                                total[1] = total[1] + 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    } else {
                        node
                            .fs
                            .writeFile(dataA.finalpath + ending, dataA.file, function pdNodeLocal__fileWrite_writing_writeFileText(err) {
                                if (err !== null) {
                                    console.log(lf + "Error writing file output." + lf);
                                    console.log(err);
                                } else if (method === "file" && options.endquietly !== "quiet") {
                                    if (ending.indexOf("-report") === 0) {
                                        console.log(lf + "Report successfully written to file.");
                                    } else {
                                        console.log(lf + "File successfully written.");
                                    }
                                }
                                total[1] = total[1] + 1;
                                if (total[1] === total[0]) {
                                    ender();
                                }
                            });
                    }
                },
                files    = function pdNodeLocal__fileWrite_files(dataB) {
                    if (dataB.binary === true) {
                        writing("", dataB);
                    } else if (options.mode === "diff" || options.mode === "analysis" || (options.mode === "beautify" && options.jsscope !== "none")) {
                        writing(suffix, dataB);
                    } else {
                        writing("", dataB);
                    }
                },
                newdir   = function pdNodeLocal__fileWrite_newdir(dataC) {
                    node
                        .fs
                        .mkdir(address.oabspath + dirs.slice(0, count).join(node.path.sep), function pdNodeLocal__fileWrite_newdir_callback() {
                            count = count + 1;
                            if (count < dirs.length) {
                                pdNodeLocal__fileWrite_newdir(dataC);
                            } else {
                                files(dataC);
                            }
                        });
                };
            options.source = sfiledump[data.index];
            if (options.mode === "diff") {
                if (method === "file") {
                    data.finalpath = options.output;
                } else {
                    data.finalpath = address.oabspath + dirs.join("__") + "__" + filename;
                }
                options.diff   = dfiledump[data.index];
            } else if (method === "file") {
                data.finalpath = options.output;
            } else {
                data.finalpath = address.oabspath + dirs.join(node.path.sep);
            }
            if (data.binary === true) {
                if (dirs.length > 1 && options.mode !== "diff") {
                    newdir(data);
                } else {
                    files(data);
                }
                return;
            }
            data.file = prettydiff();
            if (global.prettydiff.meta.error !== "") {
                if (data.last === true) {
                    ender();
                }
                console.log("Error with file: " + data.localpath);
                console.log(global.prettydiff.meta.error);
                console.log("");
            }
            if (dirs.length > 1 && options.mode !== "diff") {
                newdir(data);
            } else {
                files(data);
            }
        },

        //write output to terminal for diffcli option
        cliWrite       = function pdNodeLocal__cliWrite(output, itempath, last) {
            var a      = 0,
                plural = "",
                pdlen  = output.length;
            if (options.summaryonly === true) {
                clidata[2].push(itempath);
                if (method === "screen" || method === "filescreen") {
                    return ender();
                }
            } else {
                if (diffCount[0] !== 1) {
                    plural = "s";
                }
                if (options.readmethod === "screen" || (options.readmethod === "auto" && method === "screen")) {
                    console.log(lf + "Screen input with " + diffCount[0] + " difference" + plural);
                }
                for (a = 0; a < pdlen; a = a + 1) {
                    if (output[a].indexOf("\u001b[36m") === 0 && itempath !== "") {
                        console.log("\u001b[36m" + itempath + "\u001b[39m");
                    }
                    console.log(output[a]);
                }
            }
            if (last === true) {
                ender();
            }
        },

        //write output to screen executed from fileComplete
        screenWrite    = function pdNodeLocal__screenWrite() {
            var report = [];
            if (options.mode === "diff" && options.diffcli === true) {
                return cliWrite(prettydiff(), "", false);
            }
            if (options.mode === "diff") {
                return console.log(prettydiff());
            }
            if (options.jsscope !== "none" && options.mode === "beautify" && (options.lang === "javascript" || options.lang === "auto")) {
                return console.log(prettydiff());
            }
            report = prettydiff();
            if (options.mode === "parse" && options.parseFormat !== "htmltable") {
                report = JSON.stringify(report);
            }
            total[1] = total[1] + 1;
            console.log(report);
            if (total[0] === total[1] || options.readmethod === "screen" || options.readmethod === "auto") {
                ender();
            }
        },

        //generate the diff output for CLI from files
        cliFile        = function pdNodeLocal__cliFile(data) {
            options.source = sfiledump[data.index];
            options.diff   = dfiledump[data.index];
            if (options.source.indexOf("undefined") === 0) {
                options.source = options
                    .source
                    .replace("undefined", "");
            }
            if (options.diff.indexOf("undefined") === 0) {
                options.diff = options
                    .diff
                    .replace("undefined", "");
            }
            if (typeof options.context !== "number" || options.context < 0) {
                console.log(lf + colors.filepath.start + data.localpath + colors.filepath.end);
            }
            cliWrite(prettydiff(), data.localpath, data.last);
        },

        // is a file read operation complete? executed from readLocalFile executed from
        // readHttpFile
        fileComplete   = function pdNodeLocal__fileComplete(data) {
            var totalCalc = function pdNodeLocal__fileComplete_totalCalc() {
                total[1] = total[1] + 1;
                if (total[1] === total[0]) {
                    ender();
                }
            };
            if (data.binary === true) {
                total[0] = total[0] - 1;
            }
            if (options.mode !== "diff" || (options.mode === "diff" && data.type === "diff")) {
                total[0] = total[0] + 1;
            }
            if (data.type === "diff") {
                dfiledump[data.index] = data.file;
                dState[data.index]    = true;
            } else {
                sfiledump[data.index] = data.file;
                sState[data.index]    = true;
            }
            if (data.index !== sfiledump.length - 1) {
                data.last = false;
            }
            if (sState[data.index] === true && ((options.mode === "diff" && dState[data.index] === true) || options.mode !== "diff")) {
                if (options.mode === "diff" && sfiledump[data.index] !== dfiledump[data.index]) {
                    if (dfiledump[data.index] === "" || dfiledump[data.index] === "\n") {
                        total[1]     = total[1] + 1;
                        console.log("Diff file at " + data.localpath + " is \u001B[31mempty\u001B[39m but the source file is not.");
                        if (total[0] === total[1]) {
                            ender();
                        }
                    } else if (sfiledump[data.index] === "" || sfiledump[data.index] === "\n") {
                        total[1]     = total[1] + 1;
                        console.log("Source file at " + data.localpath + " is \u001B[31mempty\u001B[39m but the diff file is not.");
                        if (total[0] === total[1]) {
                            ender();
                        }
                    } else if (options.diffcli === true) {
                        cliFile(data);
                    } else if (method === "filescreen") {
                        options.diff   = dfiledump[data.index];
                        options.source = sfiledump[data.index];
                        screenWrite();
                    } else if (method === "file" || method === "directory" || method === "subdirectory") {
                        fileWrite(data);
                    }
                    sState[data.index] = false;
                    if (options.mode === "diff") {
                        dState[data.index] = false;
                    }
                } else if (options.mode !== "diff" && (method === "file" || method === "directory" || method === "subdirectory")) {
                    fileWrite(data);
                } else if (options.mode !== "diff" && (method === "screen" || method === "filescreen")) {
                    options.source = data.file;
                    screenWrite();
                } else {
                    totalCalc();
                }
            }
        },

        //read from a binary file
        readBinaryFile = function pdNodeLocal__readBinaryFile(data) {
            node
                .fs
                .open(data.absolutepath, "r", function pdNodeLocal__readBinaryFile_open(err, fd) {
                    var buff = new Buffer(data.size);
                    if (err !== null) {
                        return pdNodeLocal__readBinaryFile(data);
                    }
                    node
                        .fs
                        .read(fd, buff, 0, data.size, 0, function pdNodeLocal__readBinaryFile_open_read(erra, bytesRead, buffer) {
                            if (erra !== null) {
                                return pdNodeLocal__readBinaryFile(data);
                            }
                            if (bytesRead > 0) {
                                data.file = buffer;
                            }
                            fileComplete(data);
                        });
                });
        },

        //read from a file and determine if text
        readLocalFile  = function pdNodeLocal__readLocalFile(data) {
            var open = function pdNodeLocal__readLocalFile_open() {
                node
                    .fs
                    .open(data.absolutepath, "r", function pdNodeLocal__readLocalFile_open_callback(err, fd) {
                        var msize = (data.size < 100)
                                ? data.size
                                : 100,
                            buff  = new Buffer(msize);
                        if (err !== null) {
                            return pdNodeLocal__readLocalFile(data);
                        }
                        node
                            .fs
                            .read(fd, buff, 0, msize, 1, function pdNodeLocal__readLocalFile_open_callback_read(erra, bytes, buffer) {
                                if (erra !== null) {
                                    return pdNodeLocal__readLocalFile(data);
                                }
                                var bstring = buffer.toString("utf8", 0, buffer.length);
                                bstring = bstring.slice(2, bstring.length - 2);
                                if ((/[\u0002-\u0008]|[\u000e-\u001f]/).test(bstring) === true) {
                                    data.binary = true;
                                    readBinaryFile(data);
                                } else {
                                    data.binary = false;
                                    node
                                        .fs
                                        .readFile(data.absolutepath, {
                                            encoding: "utf8"
                                        }, function pdNodeLocal__readLocalFile_open_callback_read_readFile(errb, dump) {
                                            if (errb !== null && errb !== undefined) {
                                                return pdNodeLocal__readLocalFile(data);
                                            }
                                            if (data.file === undefined) {
                                                data.file = "";
                                            }
                                            data.file = data.file + dump;
                                            fileComplete(data);
                                            return bytes;
                                        });
                                }
                            });
                    });
            };
            if (data.size === undefined) {
                node
                    .fs
                    .stat(data.absolutepath, function pdNodeLocal__readLocalFile_stat(errx, stat) {
                        if (errx !== null) {
                            if ((typeof errx === "string" && errx.indexOf("no such file or directory") > 0) || (typeof errx === "object" && errx.code === "ENOENT")) {
                                return console.log(errx);
                            }
                            return pdNodeLocal__readLocalFile(data);
                        }
                        data.size = stat.size;
                        if (data.size > 0) {
                            open();
                        } else {
                            data.binary = false;
                            data.file   = "";
                            fileComplete(data);
                        }
                    });
            } else {
                if (data.size > 0) {
                    open();
                } else {
                    data.binary = false;
                    fileComplete(data);
                }
            }
        },

        //resolve file contents from a web address executed from init
        readHttpFile   = function pdNodeLocal__readHttpFile(data) {
            var file     = "",
                protocol = data.absolutepath.indexOf("s://"),
                callback = function pdNodeLocal__readHttpFile_callback(res) {
                    res.setEncoding("utf8");
                    res.on("data", function pdNodeLocal__readHttpFile_callback_response(chunk) {
                        file = file + chunk;
                    });
                    res.on("end", function pdNodeLocal__readHttpFile_callback_end() {
                        data.file = file;
                        if (data.type === "diff") {
                            dfiledump[data.index] = file;
                        } else {
                            sfiledump[data.index] = file;
                        }
                        fileComplete(data);
                    });
                    res.on("error", function pdNodeLocal__readHttpFile_callback_error(error) {
                        console.log("Error downloading file via HTTP:");
                        console.log("");
                        console.log(error);
                    });
                };
            if (protocol > 0 && protocol < 10) {
                node
                    .https
                    .get(data.absolutepath, callback);
            } else {
                node
                    .http
                    .get(data.absolutepath, callback);
            }
        },

        //gather files in directory and sub directories executed from init
        directory      = function pdNodeLocal__directory() {
            // the following four are necessary because you can walk a directory tree from a
            // relative path but you cannot read file contents with a relative path in node
            // at this time
            var sfiles  = {
                    abspath    : [],
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                dfiles  = {
                    abspath    : [],
                    count      : 0,
                    directories: 1,
                    filepath   : [],
                    total      : 0
                },
                readDir = function pdNodeLocal__directory_readDir(start, listtype) {
                    node
                        .fs
                        .stat(start, function pdNodeLocal__directory_readDir_stat(erra, stat) {
                            var item    = {},
                                dirtest = function pdNodeLocal__directory_readDir_stat_dirtest(itempath) {
                                    var pusher     = function pdNodeLocal__directory_readDir_stat_dirtest_pusher(itempath) {
                                            if (listtype === "diff") {
                                                dfiles
                                                    .filepath
                                                    .push([
                                                        itempath.replace(address.dabspath + node.path.sep, ""),
                                                        itempath
                                                    ]);
                                            } else if (listtype === "source") {
                                                sfiles
                                                    .filepath
                                                    .push([
                                                        itempath.replace(address.sabspath + node.path.sep, ""),
                                                        itempath
                                                    ]);
                                            }
                                            item.count = item.count + 1;
                                        },
                                        preprocess = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess() {
                                            var b      = 0,
                                                length = (options.mode === "diff")
                                                    ? Math.min(sfiles.filepath.length, dfiles.filepath.length)
                                                    : sfiles.filepath.length,
                                                end    = false,
                                                sizer  = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer(index, type, filename, finalone) {
                                                    node
                                                        .fs
                                                        .stat(filename[1], function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sizer_stat(errc, statb) {
                                                            var filesize = 0;
                                                            if (errc === null) {
                                                                filesize = statb.size;
                                                            }
                                                            readLocalFile({
                                                                absolutepath: filename[1],
                                                                index       : index,
                                                                last        : finalone,
                                                                localpath   : filename[0],
                                                                size        : filesize,
                                                                type        : type
                                                            });
                                                        });
                                                },
                                                sorter = function pdNodeLocal__directory_readDir_stat_dirtest_stat_preprocess_sorter(a, b) {
                                                    if (a[0] < b[0]) {
                                                        return -1;
                                                    }
                                                    return 1;
                                                };
                                            sfiles
                                                .filepath
                                                .sort(sorter);
                                            if (options.mode === "diff") {
                                                dfiles
                                                    .filepath
                                                    .sort(sorter);
                                                for (b = 0; b < length; b = b + 1) {
                                                    dState.push(false);
                                                    sState.push(false);
                                                    sfiledump.push("");
                                                    dfiledump.push("");
                                                    if (sfiles.filepath[b][0] === dfiles.filepath[b][0]) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        sizer(b, "diff", dfiles.filepath[b], end);
                                                        sizer(b, "source", sfiles.filepath[b], end);
                                                    } else {
                                                        if (sfiles.filepath[b][0] < dfiles.filepath[b][0]) {
                                                            if (options.diffcli === true) {
                                                                clidata[0].push(sfiles.filepath[b][0]);
                                                            }
                                                            if (length === dfiles.filepath.length) {
                                                                length = length + 1;
                                                            }
                                                            dfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        } else if (dfiles.filepath[b][0] < sfiles.filepath[b][0]) {
                                                            if (options.diffcli === true) {
                                                                clidata[1].push(dfiles.filepath[b][0]);
                                                            }
                                                            if (length === sfiles.filepath.length) {
                                                                length = length + 1;
                                                            }
                                                            sfiles
                                                                .filepath
                                                                .splice(b, 0, "");
                                                        }
                                                        if (b === length - 1) {
                                                            ender();
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (options.output !== "") {
                                                    for (b = 0; b < length; b = b + 1) {
                                                        if (b === length - 1) {
                                                            end = true;
                                                        }
                                                        if (sfiles.filepath[b] !== undefined) {
                                                            sizer(b, "source", sfiles.filepath[b], end);
                                                        }
                                                    }
                                                } else {
                                                    ender();
                                                }
                                            }
                                        };
                                    if (itempath === "") {
                                        preprocess();
                                    } else {
                                        node
                                            .fs
                                            .stat(itempath, function pdNodeLocal__directory_readDir_stat_dirtest_stat(errb, stata) {
                                                if (errb !== null) {
                                                    return console.log(errb);
                                                }
                                                if (stata.isDirectory() === true) {
                                                    if (method === "subdirectory") {
                                                        item.directories = item.directories + 1;
                                                        pdNodeLocal__directory_readDir(itempath, listtype);
                                                        item.count = item.count + 1;
                                                    }
                                                    if (method === "directory") {
                                                        item.total       = item.total - 1;
                                                        item.directories = 0;
                                                    }
                                                } else if (stata.isFile() === true) {
                                                    pusher(itempath);
                                                } else {
                                                    if (listtype === "diff") {
                                                        dfiles.total = dfiles.total - 1;
                                                    } else {
                                                        sfiles.total = sfiles.total - 1;
                                                    }
                                                    console.log(itempath + lf + "is an unsupported type");
                                                }
                                                if (options.mode === "diff" && sfiles.count === sfiles.total && dfiles.count === dfiles.total && sfiles.directories === 0 && dfiles.directories === 0)  {
                                                    return preprocess();
                                                }
                                                if (options.mode !== "diff" && item.directories === 0 && item.count === item.total) {
                                                    return preprocess();
                                                }
                                            });
                                    }
                                };
                            if (erra !== null) {
                                return console.log(erra);
                            }
                            if (stat.isDirectory() === true) {
                                node
                                    .fs
                                    .readdir(start, function pdNodeLocal__directory_readDir_stat_readdir(errd, files) {
                                        var x         = 0,
                                            filetotal = files.length;
                                        if (errd !== null || filetotal === 0) {
                                            if (method === "subdirectory") {
                                                if (listtype === "diff") {
                                                    dfiles.directories = dfiles.directories - 1;
                                                } else {
                                                    sfiles.directories = sfiles.directories - 1;
                                                }
                                            }
                                            if (errd !== null) {
                                                return console.log(errd);
                                            }
                                            if ((options.mode === "diff" && sfiles.count === sfiles.total && dfiles.count === dfiles.total && sfiles.directories === 0 && dfiles.directories === 0) || (options.mode !== "diff" && sfiles.directories === 0 && sfiles.count === sfiles.total)) {
                                                dirtest("");
                                            }
                                            return;
                                        }
                                        if (listtype === "diff") {
                                            item = dfiles;
                                        } else {
                                            item = sfiles;
                                        }
                                        item.total = item.total + filetotal;
                                        for (x = 0; x < filetotal; x = x + 1) {
                                            if (x === filetotal - 1) {
                                                item.directories = item.directories - 1;
                                                dirtest(start + node.path.sep + files[x]);
                                            } else {
                                                dirtest(start + node.path.sep + files[x]);
                                            }
                                        }
                                    });
                            } else {
                                return console.log("path: " + start + " is not a directory");
                            }
                        });
                };
            readDir(address.sabspath, "source");
            if (options.mode === "diff") {
                readDir(address.dabspath, "diff");
            }
        };

    global.prettydiff              = {};
    global.prettydiff.language     = require(localPath + "lib/language.js");
    global.prettydiff.safeSort     = require(localPath + "lib/safeSort.js");
    global.prettydiff.options      = require(localPath + "lib/options.js");
    global.prettydiff.csspretty    = require(localPath + "lib/csspretty.js");
    global.prettydiff.csvpretty    = require(localPath + "lib/csvpretty.js");
    global.prettydiff.diffview     = require(localPath + "lib/diffview.js");
    global.prettydiff.finalFile    = require(localPath + "lib/finalFile.js");
    global.prettydiff.jspretty     = require(localPath + "lib/jspretty.js");
    global.prettydiff.markuppretty = require(localPath + "lib/markuppretty.js");
    global.prettydiff.prettydiff   = require(localPath + "prettydiff.js");
    options                        = global.prettydiff.options;

    //defaults for the options
    (function pdNodeLocal__start() {
        var argument  = process
                .argv
                .slice(2),
            opreturn  = [],
            alphasort = false,
            outready  = false,
            pdrcpath  = __dirname.replace(/(api)$/, "") + ".prettydiffrc",
            pathslash = function pdNodeLocal__start_pathslash(name, x) {
                var y        = x.indexOf("://"),
                    z        = "",
                    itempath = "",
                    ind      = "",
                    odirs    = [],
                    olen     = 0,
                    basepath = "",
                    makeout  = function pdNodeLocal__start_pathslash_makeout() {
                        basepath = basepath + odirs[olen];
                        basepath = basepath.replace(/(\/|\\)+$/, "") + node.path.sep;
                        node
                            .fs
                            .mkdir(basepath, function pdNodeLocal__start_pathslash_makeout_mkdir(err) {
                                if (err !== undefined && err !== null && err.code !== "EEXIST") {
                                    console.log(err);
                                    outready = true;
                                } else if (olen < odirs.length) {
                                    olen = olen + 1;
                                    if (olen < odirs.length) {
                                        pdNodeLocal__start_pathslash_makeout();
                                    } else {
                                        outready = true;
                                    }
                                } else {
                                    outready = true;
                                }
                            });
                    },
                    abspath  = function pdNodeLocal__start_pathslash_abspath() {
                        var tree  = cwd.split(node.path.sep),
                            ups   = [],
                            uplen = 0;
                        if (itempath.indexOf("..") === 0) {
                            ups   = itempath
                                .replace(/\.\.\//g, ".." + node.path.sep)
                                .split(".." + node.path.sep);
                            uplen = ups.length;
                            do {
                                uplen = uplen - 1;
                                tree.pop();
                            } while (uplen > 1);
                            return tree.join(node.path.sep) + node.path.sep + ups[ups.length - 1];
                        }
                        if ((/^([a-z]:(\\|\/))/).test(itempath) === true || itempath.indexOf(node.path.sep) === 0) {
                            return itempath;
                        }
                        return node.path.join(cwd, itempath);
                    };
                if (name === "diff") {
                    ind = 0;
                }
                if (name === "output") {
                    ind = 1;
                }
                if (name === "source") {
                    ind = 2;
                }
                if (x.indexOf("http://") === 0 || x.indexOf("https://") === 0) {
                    dir[ind] = 3;
                    return x;
                }
                if (y < 0) {
                    itempath = x.replace(/\\/g, "/");
                } else {
                    z        = x.slice(0, y);
                    x        = x.slice(y + 3);
                    itempath = z + "://" + x.replace(/\\/g, "/");
                }
                node
                    .fs
                    .stat(itempath, function pdNodeLocal__start_pathslash_stat(err, stat) {
                        if (err !== null) {
                            dir[ind] = -1;
                            return "";
                        }
                        if (stat.isDirectory() === true) {
                            dir[ind] = 1;
                        } else if (stat.isFile() === true) {
                            dir[ind] = 2;
                            if (name === "output") {
                                outready = true;
                            }
                        } else {
                            dir[ind] = -1;
                            if (name === "output") {
                                outready = true;
                            }
                        }
                    });
                if (name === "diff") {
                    address.dabspath = abspath();
                    address.dorgpath = itempath;
                }
                if (name === "output") {
                    if (method === "file") {
                        outready = true;
                    } else if (x === ".") {
                        address.oabspath = cwd;
                        address.oorgpath = cwd;
                        outready         = true;
                    } else {
                        itempath         = itempath.replace(/\//g, node.path.sep);
                        address.oabspath = abspath();
                        address.oorgpath = itempath;
                        if (address.oabspath.charAt(address.oabspath.length - 1) !== node.path.sep) {
                            address.oabspath = address.oabspath + node.path.sep;
                        }
                        basepath = address
                            .oabspath
                            .replace(node.path.sep + address.oorgpath, "");
                        odirs    = address
                            .oorgpath
                            .split(node.path.sep);
                        if (odirs[0] === "..") {
                            (function pdNodeLocal__start_pathslash_stat() {
                                var abs = node
                                        .path
                                        .resolve()
                                        .split(node.path.sep),
                                    a   = 0;
                                do {
                                    a = a + 1;
                                } while (odirs[a] === "..");
                                odirs.splice(0, a);
                                abs.splice(0, a);
                                do {
                                    odirs.splice(0, 0, abs.pop());
                                } while (abs.length > 0);
                                if (node.path.sep === "/") {
                                    odirs.splice(0, 0, "");
                                }
                            }());
                        }
                        if (options.readmethod === "file") {
                            odirs.pop();
                        }
                        makeout();
                    }
                }
                if (name === "source") {
                    address.sabspath = abspath();
                    address.sorgpath = itempath;
                }
                return itempath;
            };
        opreturn = options.functions.node(argument);
        help     = opreturn[0];
        langauto = opreturn[1];
        if (options.diff !== "") {
            options.diff = pathslash("diff", options.diff);
        }
        if (options.output !== "") {
            options.output = pathslash("output", options.output);
        }
        if (options.source !== "") {
            options.source = pathslash("source", options.source);
        }
        method = options.readmethod;
        options.api = "none";
        if (options.output === "") {
            outready = true;
        }
        if (options.endquietly === "quiet") {
            enderflag = true;
        }
        if (options.crlf === true) {
            lf = "\r\n";
        }

        node
            .fs
            .stat(pdrcpath, function pdNodeLocal__start_stat(err, stats) {
                var init = function pdNodeLocal__start_stat_init() {
                    var state   = false,
                        cliflag = false,
                        status  = function pdNodeLocal__start_stat_init_status() {
                            var tempaddy = "";
                            // status codes
                            //* -1 is not file or directory
                            //* 0 is status pending
                            //* 1 is directory
                            //* 2 is file 3 is file via http/s
                            //
                            //* dir[0] - diff
                            //* dir[1] - output
                            //* dir[2] - source
                            if (dir[2] === 0) {
                                return;
                            }
                            if (method === "auto") {
                                if (dir[2] === 1) {
                                    method = "subdirectory";
                                } else if (dir[2] > 1) {
                                    if (options.output === "") {
                                        method = "filescreen";
                                    } else {
                                        if (options.output === "" && options.mode !== "diff") {
                                            console.log("");
                                            console.log("\u001B[91mNo output option is specified, so no files written.\u001B[39m");
                                            console.log("");
                                        }
                                        method = "file";
                                        if (options.output === "") {
                                            return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                                        }
                                    }
                                } else if (dir[2] < 0) {
                                    method = "screen";
                                }
                            }
                            if (dir[2] < 0) {
                                state = true;
                                if (options.readmethod === "screen" && options.mode !== "diff") {
                                    return screenWrite();
                                }
                                if (options.readmethod !== "screen") {
                                    if (options.readmethod === "auto") {
                                        method = "screen";
                                        if (options.mode !== "diff") {
                                            return screenWrite();
                                        }
                                    } else {
                                        return console.log("source is not a directory or file");
                                    }
                                }
                            }
                            if (dir[2] === 1 && method !== "directory" && method !== "subdirectory") {
                                state = true;
                                return console.log("source is a directory but readmethod option is not 'auto', 'directory', or 'subd" +
                                        "irectory'");
                            }
                            if (dir[2] > 1) {
                                if (method === "directory" || method === "subdirectory") {
                                    state = true;
                                    return console.log("source is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (method === "screen") {
                                    method = "filescreen";
                                }
                            }
                            if (options.mode === "diff") {
                                if (dir[0] === 0 || dir[2] === 0) {
                                    return;
                                }
                                if (dir[0] < 0) {
                                    state = true;
                                    if (options.readmethod === "auto" || (dir[2] < 0 && options.readmethod === "screen")) {
                                        if (options.readmethod === "auto" && method === "screen" && cliflag === true && options.diffcli === false) {
                                            options.diffcli = false;
                                        }
                                        if (options.diffcli === true) {
                                            return cliWrite(prettydiff(), "", false);
                                        }
                                        return screenWrite();
                                    }
                                    return console.log("diff is not a directory or file");
                                }
                                if (dir[0] === 1 && method !== "directory" && method !== "subdirectory") {
                                    state = true;
                                    return console.log("diff is a directory but readmethod option is not 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 2 && (method === "directory" || method === "subdirectory")) {
                                    state = true;
                                    return console.log("diff is a file but readmethod option is 'directory' or 'subdirectory'");
                                }
                                if (dir[0] > 1 && method === "screen") {
                                    method = "filescreen";
                                }
                                if (dir[0] > 1 && dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = true;
                                    dState.push(false);
                                    sState.push(false);
                                    if (dir[0] === 3) {
                                        readHttpFile({absolutepath: options.diff, index: 0, last: true, localpath: options.diff, type: "diff"});
                                    } else {
                                        tempaddy = options
                                            .diff
                                            .replace(/(\/|\\)/g, node.path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "diff"});
                                    }
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        tempaddy = options
                                            .source
                                            .replace(/(\/|\\)/g, node.path.sep);
                                        readLocalFile({absolutepath: tempaddy, index: 0, last: true, localpath: tempaddy, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[0] === 1 && dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = true;
                                    options.nodeasync = true;
                                    return directory();
                                }
                            } else {
                                if (dir[2] > 1 && (method === "file" || method === "filescreen")) {
                                    state = true;
                                    sState.push(false);
                                    if (dir[2] === 3) {
                                        readHttpFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    } else {
                                        readLocalFile({absolutepath: options.source, index: 0, last: true, localpath: options.source, type: "source"});
                                    }
                                    return;
                                }
                                if (dir[2] === 1 && (method === "directory" || method === "subdirectory")) {
                                    state = true;
                                    options.nodeasync = true;
                                    return directory();
                                }
                            }
                        },
                        delay   = function pdNodeLocal__start_stat_init_delay() {
                            if (state === false || outready === false) {
                                status();
                                setTimeout(function pdNodeLocal__start_stat_init_delay_setTimeout() {
                                    pdNodeLocal__start_stat_init_delay();
                                }, 50);
                            }
                        };
                    if (alphasort === true) {
                        options.objsort = "all";
                    }
                    if (options.mode !== "diff") {
                        options.diffcli     = false;
                        options.summaryonly = false;
                    }
                    if (options.summaryonly === true) {
                        options.diffcli = true;
                    }

                    if (help === true) {
                        return console.log(options.functions.consolePrint());
                    }
                    if (help === true && options.version === true) {
                        return console.log(options.functions.versionString);
                    }
                    if (options.listoptions === true) {
                        (function pdNodeLocal__start_stat_init_listoptions() {
                            var sample = JSON.stringify(options),
                                mode   = options.mode,
                                source = options.source,
                                vert   = options.vertical;
                            options.mode     = "beautify";
                            options.source   = sample;
                            options.vertical = "all";
                            sample           = global.prettydiff.prettydiff(options);
                            console.log("");
                            console.log(colors.filepath.start + "Current option settings:" + colors.filepath.end);
                            console.log(sample.slice(1, sample.length - 1));
                            options.mode     = mode;
                            options.source   = source;
                            options.vertical = vert;
                        }());
                        if (help === true) {
                            return;
                        }
                    }
                    if (options.source === "") {
                        return console.log("Error: 'source' argument is empty");
                    }
                    if (options.mode === "diff" && options.diff === "") {
                        return console.log("Error: 'diff' argument is empty");
                    }
                    if ((options.output === "" || options.summaryonly === true) && options.mode === "diff") {
                        if (options.readmethod !== "screen") {
                            if (options.readmethod === "auto") {
                                cliflag = true;
                            } else {
                                options.diffcli = true;
                            }
                        }
                        if (process.argv.join(" ").indexOf(" context:") === -1) {
                            options.context = 2;
                        }
                    }
                    if (method === "file" && options.output === "" && options.summaryonly === false && options.diffcli === false) {
                        return console.log("Error: 'readmethod' is value 'file' and argument 'output' is empty");
                    }
                    if (dir[2] === 0 || outready === false || (options.mode === "diff" && dir[0] === 0)) {
                        delay();
                    } else {
                        status();
                    }
                };

                if (err !== null) {
                    init();
                } else if (stats.isFile() === true) {
                    node
                        .fs
                        .readFile(pdrcpath, {
                            encoding: "utf8"
                        }, function pdNodeLocal__start_stat_readFile(error, data) {
                            var s       = options.source,
                                dd      = options.diff,
                                o       = options.output,
                                h       = false,
                                pdrc    = {},
                                pdkeys  = [],
                                b       = 0,
                                eachkey = function pdNodeLocal__start_stat_readFile_eachkey(val) {
                                    if (val !== "help" && val !== "version" && val !== "v" && val !== "man" && val !== "manual") {
                                        b = b + 1;
                                        if (options[val] !== undefined) {
                                            options[val] = pdrc[val];
                                            if (val === "help" && pdrc[val] === true) {
                                                h = true;
                                                b = b - 1;
                                            }
                                        }
                                    }
                                };
                            if (error !== null && error !== undefined) {
                                return init();
                            }
                            if ((/^(\s*\{)/).test(data) === true && (/(\}\s*)$/).test(data) === true) {
                                pdrc   = JSON.parse(data);
                                pdkeys = Object.keys(pdrc);
                                b      = 0;
                                pdkeys.forEach(eachkey);
                                if (b > 0 && h === false) {
                                    help = false;
                                }
                                method = options.readmethod;
                                if (s !== options.source) {
                                     pathslash("source", options.source);
                                }
                                if (dd !== options.diff) {
                                    pathslash("diff", options.diff);
                                }
                                if (o !== options.output) {
                                    pathslash("output", options.output);
                                }
                                init();
                            } else {
                                global.prettydiff.prettydiffrc = require(pdrcpath);
                                if (global.prettydiff.prettydiffrc !== undefined) {
                                    options = global.prettydiff.prettydiffrc(options);
                                    method  = options.readmethod;
                                    if (s !== options.source) {
                                        pathslash("source", options.source);
                                    }
                                    if (dd !== options.diff) {
                                        pathslash("diff", options.diff);
                                    }
                                    if (o !== options.output) {
                                        pathslash("output", options.output);
                                    }
                                    help = false;
                                    if (options.version === false && options.listoptions === false && (process.argv.length < 3 || options.source === undefined || options.source === "")) {
                                        help = true;
                                    }
                                    init();
                                }
                            }
                        });
                } else {
                    init();
                }
            });
    }());
}());
