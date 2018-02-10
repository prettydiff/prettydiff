/*jslint node:true*/
/*eslint-env node*/
/*eslint no-console: 0*/
(function build():void {
    "use strict";
    const order = [
            "typescript",
            "options",
            //"dom",
            "lint"
        ],
        startTime:[number, number] = process.hrtime(),
        node = {
            child: require("child_process").exec,
            fs: require("fs"),
            path: require("path")
        },
        projectPath:string = (function build_project() {
            const dirs:string[] = __dirname.split(node.path.sep);
            return dirs.slice(0, dirs.length - 1).join(node.path.sep) + node.path.sep;
        }()),
        js:string = `${projectPath}js${node.path.sep}`,
        orderlen:number = order.length,
        humantime  = function build_humantime(finished:boolean):string {
            let minuteString:string = "",
                hourString:string   = "",
                secondString:string = "",
                finalTime:string    = "",
                finalMem:string     = "",
                strSplit:string[]     = [],
                minutes:number      = 0,
                hours:number        = 0,
                memory,
                elapsed:number      = (function build_humantime_elapsed():number {
                    const endtime:[number, number] = process.hrtime();
                    let dtime:[number, number] = [endtime[0] - startTime[0], endtime[1] - startTime[1]];
                    if (dtime[1] === 0) {
                        return dtime[0];
                    }
                    if (dtime[1] < 0) {
                        dtime[1] = ((1000000000 + endtime[1]) - startTime[1]);
                    }
                    return dtime[0] + (dtime[1] / 1000000000);
                }());
            const prettybytes  = function build_humantime_prettybytes(an_integer:number):string {
                    //find the string length of input and divide into triplets
                    let output:string = "",
                        length:number  = an_integer
                            .toString()
                            .length;
                    const triples:number = (function build_humantime_prettybytes_triples():number {
                            if (length < 22) {
                                return Math.floor((length - 1) / 3);
                            }
                            //it seems the maximum supported length of integer is 22
                            return 8;
                        }()),
                        //each triplet is worth an exponent of 1024 (2 ^ 10)
                        power:number   = (function build_humantime_prettybytes_power():number {
                            let a = triples - 1,
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
                        ];

                    if (typeof an_integer !== "number" || Number.isNaN(an_integer) === true || an_integer < 0 || an_integer % 1 > 0) {
                        //input not a positive integer
                        output = "0.00B";
                    } else if (triples === 0) {
                        //input less than 1000
                        output = `${an_integer}B`;
                    } else {
                        //for input greater than 999
                        length = Math.floor((an_integer / power) * 100) / 100;
                        output = length.toFixed(2) + unit[triples];
                    }
                    return output;
                },
                plural       = function build_proctime_plural(x:number, y:string):string {
                    if (x !== 1) {
                        return `${x + y}s `;
                    }
                    return `${x + y} `;
                },
                minute       = function build_proctime_minute():void {
                    minutes      = parseInt((elapsed / 60).toString(), 10);
                    minuteString = (finished === true)
                        ? plural(minutes, " minute")
                        : (minutes < 10)
                            ? `0${minutes}`
                            : String(minutes);
                    minutes      = elapsed - (minutes * 60);
                    secondString = (finished === true)
                        ? (minutes === 1)
                            ? " 1 second "
                            : `${minutes.toFixed(3)} seconds `
                        : minutes.toFixed(3);
                };
            memory       = process.memoryUsage();
            finalMem     = prettybytes(memory.rss);

            //last line for additional instructions without bias to the timer
            secondString = String(elapsed);
            strSplit     = secondString.split(".");
            if (strSplit[1].length < 9) {
                do {
                    strSplit[1]  = strSplit[1] + 0;
                } while (strSplit[1].length < 9);
                secondString = `${strSplit[0]}.${strSplit[1]}`;
            } else if (strSplit[1].length > 9) {
                secondString = `${strSplit[0]}.${strSplit[1].slice(0, 9)}`;
            }
            if (elapsed >= 60 && elapsed < 3600) {
                minute();
            } else if (elapsed >= 3600) {
                hours      = parseInt((elapsed / 3600).toString(), 10);
                elapsed    = elapsed - (hours * 3600);
                hourString = (finished === true)
                    ? plural(hours, " hour")
                    : (hours < 10)
                        ? `0${hours}`
                        : String(hours);
                minute();
            } else {
                secondString = (finished === true)
                    ? plural(elapsed, " second")
                    : secondString;
            }
            if (finished === true) {
                finalTime = hourString + minuteString + secondString;
                console.log(`${finalMem} of memory consumed`);
                console.log(`${finalTime}total time`);
                console.log("");
            } else {
                if (hourString === "") {
                    hourString = "00";
                }
                if (minuteString === "") {
                    minuteString = "00";
                }
                if ((/^([0-9]\.)/).test(secondString) === true) {
                    secondString = `0${secondString}`;
                }
                return `\u001b[36m[${hourString}:${minuteString}:${secondString}]\u001b[39m `;
            }
        },
        errout     = function build_errout(errtext:string):void {
            let stack:string = new Error().stack;
            console.log("");
            console.log("\u001b[31mScript error\u001b[39m");
            console.log("------------");
            if (errtext === "") {
                console.log("\u001b[33mNo error message supplied\u001b[39m");
            } else {
                console.log(errtext);
            }
            console.log("");
            if (process.platform.toLowerCase() === "win32") {
                stack = stack.replace("Error", "\u001b[36mStack trace\u001b[39m\r\n-----------");
            } else {
                stack = stack.replace("Error", "\u001b[36mStack trace\u001b[39m\n-----------");
            }
            console.log(stack);
            process.exit(1);
        },
        next = function build_next():void {
            let phase = order[0];
            const complete = function build_complete() {
                    console.log("");
                    console.log("All tasks complete... Exiting clean!");
                    humantime(true);
                    if (process.argv[1].indexOf("validate.js") > -1) {
                        process.exit(0);
                    }
                };
            if (order.length < orderlen) {
                console.log("________________________________________________________________________");
                console.log("");
            }
            if (order.length < 1) {
                return complete();
            }
            order.splice(0, 1);
            phases[phase]();
        },
        phases = {
            lint     : function build_lint():void {
                const ignoreDirectory = [
                        ".git",
                        ".vscode",
                        "bin",
                        "coverage",
                        "guide",
                        "ignore",
                        "node_modules",
                        "test"
                    ],
                    files:string[]           = [],
                    lintrun         = function build_lint_lintrun() {
                        let filesCount:number = 0;
                        const filesTotal = files.length,
                            lintit = function build_lint_lintrun_lintit(val:string):void {
                                node.child(`eslint ${val}`, {
                                    cwd: projectPath
                                }, function build_lint_lintrun_lintit_eslint(err, stdout, stderr) {
                                    if (stdout === "" || stdout.indexOf("0:0  warning  File ignored because of a matching ignore pattern.") > -1) {
                                        if (err !== null) {
                                            errout(err);
                                            return;
                                        }
                                        if (stderr !== null && stderr !== "") {
                                            errout(stderr);
                                            return;
                                        }
                                        filesCount = filesCount + 1;
                                        console.log(`${humantime(false)}\u001b[32mLint passed:\u001b[39m ${val}`);
                                        if (filesCount === filesTotal) {
                                            console.log("\u001b[32mLint complete!\u001b[39m");
                                            next();
                                            return;
                                        }
                                    } else {
                                        console.log(stdout);
                                        errout("Lint failure.");
                                        return;
                                    }
                                })
                            };
                        files.forEach(lintit);
                    };
                console.log("\u001b[36mBeautifying and Linting\u001b[39m");
                console.log("");
                (function build_lint_getFiles():void {
                    let total:number    = 1,
                        count:number    = 0;
                    const idLen:number    = ignoreDirectory.length,
                        readDir  = function build_lint_getFiles_readDir(filepath:string):void {
                            node.fs.readdir(
                                filepath,
                                function build_lint_getFiles_readDir_callback(erra, list) {
                                    const fileEval = function build_lint_getFiles_readDir_callback_fileEval(val:string):void {
                                        const filename:string = (filepath.charAt(filepath.length - 1) === node.path.sep)
                                            ? filepath + val
                                            : filepath + node.path.sep + val;
                                        node.fs.stat(
                                            filename,
                                            function build_lint_getFiles_readDir_callback_fileEval_stat(errb, stat) {
                                                let a:number         = 0,
                                                    ignoreDir:boolean = false;
                                                const dirtest:string   = `${filepath.replace(/\\/g, "/")}/${val}`;
                                                if (errb !== null) {
                                                    return errout(errb);
                                                }
                                                count = count + 1;
                                                if (stat.isFile() === true && (/(\.js)$/).test(val) === true) {
                                                    files.push(filename);
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
                                                        if (count === total) {
                                                            lintrun();
                                                        }
                                                    } else {
                                                        total = total + 1;
                                                        build_lint_getFiles_readDir(filename);
                                                    }
                                                } else if (count === total) {
                                                    lintrun();
                                                }
                                            }
                                        );
                                    };
                                    if (erra !== null) {
                                        return errout(`Error reading path: ${filepath}\n${erra}`);
                                    }
                                    total = total + list.length - 1;
                                    list.forEach(fileEval);
                                }
                            );
                        };
                    readDir(js);
                }());
            },
            options: function build_options():void {
                const flag = {
                        documentation: false,
                        dom: false,
                        html: false,
                        node: false
                    },
                    modifyFile = function build_options_modifyFile(file:string, fileFlag:string):void {
                        node.fs.readFile(file, "utf8", function build_options_documentation(err:Error, data:string):void {
                            let start:number = 0,
                                end: number = 0,
                                built:string = "";
                            if (err !== null && err.toString() !== "") {
                                errout(err.toString());
                                return;
                            }
                            if (fileFlag === "documentation") {
                                start = data.indexOf("<!-- option list start -->") + 26;
                                end = data.indexOf("<!-- option list end -->");
                                built = [data.slice(0, start), global.prettydiff.optionDef.buildDocumentation, data.slice(end)].join("");
                            } else if (fileFlag === "dom") {
                                data = data.replace("// start option defaults\s+", "// start option defaults\n");
                                data = data.replace("// end option defaults\s+", "// end option defaults\n");
                                start = data.indexOf("// start option defaults\n") + 17;
                                end = data.indexOf("// end option defaults\n");
                                built = [data.slice(0, start), global.prettydiff.optionDef.buildDomDefaults, data.slice(end)].join("");
                            }
                            node.fs.writeFile(file, built, function build_options_documentation_write(errw:Error) {
                                if (errw !== null && errw.toString() !== "") {
                                    errout(errw.toString());
                                    return;
                                }
                                flag[fileFlag] = true;
                                if (flag.documentation === true && flag.dom === true && flag.html === true && flag.node === true) {
                                    next();
                                }
                            });
                        });
                    };
                require(`${js}api${node.path.sep}options`);
                modifyFile(`${projectPath}documentation.xhtml`, "documentation");
                modifyFile(`${js}api${node.path.sep}dom.js`, "dom");
            },
            typescript: function build_typescript():void {
                console.log("\u001b[36mTypeScript Compilation\u001b[39m");
                console.log("");
                node.child("tsc --pretty", {
                    cwd: projectPath
                }, function build_typescript_callback(err, stdout, stderr):void {
                    if (stdout !== "" && stdout.indexOf(" \u001b[91merror\u001b[0m ") > -1) {
                        console.log("\u001b[31mTypeScript reported warnings.\u001b[39m");
                        errout(stdout);
                        return;
                    }
                    if (err !== null) {
                        errout(err);
                        return;
                    }
                    if (stderr !== null && stderr !== "") {
                        errout(stderr);
                        return;
                    }
                    console.log(`${humantime(false)}\u001b[32mTypeScript build completed without warnings.\u001b[39m`);
                    return next();
                });
            }
        };
    require(`${js}prettydiff`);
    console.log("");
    next();
}());