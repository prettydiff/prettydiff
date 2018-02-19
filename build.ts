import { Stats } from "fs";

/*jslint node:true*/
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global*/
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
        sep:string = node.path.sep,
        projectPath:string = (function build_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        js:string = `${projectPath}js${sep}`,
        api:string = `${js}api${sep}`,
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
                                        const filename:string = (filepath.charAt(filepath.length - 1) === sep)
                                            ? filepath + val
                                            : filepath + sep + val;
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
                require(`${api}options`);
                let libs:string = "";
                const flag = {
                        documentation: false,
                        dom: false,
                        html: false,
                        node: false
                    },
                    definitions = global.prettydiff.optionDef.definitions,
                    optkeys:string[] = Object.keys(definitions),
                    keyslen:number = optkeys.length,
                    versionData = {
                        number: "",
                        date: ""
                    },
                    modifyFile = function build_options_modifyFile(file:string, fileFlag:string):void {
                        node.fs.readFile(file, "utf8", function build_options_modifyFile(err:Error, data:string):void {
                            const modify = function build_options_modifyFile_modify(ops:modifyOps):void {
                                    const start:number = (function build_options_modifyFile_modify_startBuild():number {
                                            const len = (ops.start.indexOf("//") === 0)
                                                ? (function build_options_modifyFile_modify_startBuild_lineStart():number {
                                                    data = data.replace(new RegExp(ops.start + "\s+"), ops.start + "\n");
                                                    return ops.start.length + 1;
                                                }())
                                                : ops.start.length;
                                            return data.indexOf(ops.start) + len;
                                        }()),
                                        end:number = data.indexOf(ops.end);
                                    if (ops.end.indexOf("//") === 0) {
                                        data = data.replace(new RegExp(ops.end + "\s+"), ops.end + "\n");
                                    }
                                    data = [data.slice(0, start), ops.injectFlag + "\n", data.slice(end)].join("");
                                },
                                buildDefaults = function build_options_modifyFile_buildDefault(api:string):string {
                                    const obj:any = {};
                                    let a:number = 0,
                                        apikey = "";
                                    do {
                                        apikey = definitions[optkeys[a]].api;
                                        if (apikey === "any" || apikey === api) {
                                            obj[optkeys[a]] = definitions[optkeys[a]].default;
                                        }
                                        a = a + 1;
                                    } while (a < keyslen);
                                    return "options=" + JSON.stringify(obj) + ",";
                                },
                                buildDocumentation = function build_options_modifyFile_buildDocumentation():string {
                                    const allOptions:string[] = [];
                                    let a:number = 0,
                                        b:number = 0,
                                        vals:string[],
                                        vallen:number,
                                        item:string[],
                                        optName:string,
                                        opt:option;
                                    do {
                                        optName = optkeys[a];
                                        opt = definitions[optName];
                                        item = [`<li id="${optName}">`];
                                        item.push(`<h4>${optName}</h4>`);
                                        item.push(`<ul><li><h5>Description</h5>`);
                                        item.push(opt.definition);
                                        item.push(`</li><li><h5>Environment</h5>`);
                                        item.push(opt.api);
                                        item.push(`</li><li><h5>Type</h5>`);
                                        item.push(opt.type);
                                        item.push(`</li><li><h5>Mode</h5>`);
                                        item.push(opt.mode);
                                        item.push(`</li><li><h5>Lexer</h5>`);
                                        item.push(opt.lexer);
                                        if (opt.values !== undefined) {
                                            b = 0;
                                            vals = Object.keys(opt.values);
                                            vallen = vals.length;
                                            item.push(`</li><li><h5>Accepted Values</h5><dl>`);
                                            do {
                                                item.push(`<dt>${vals[b]}</dt><dd>${opt.values[vals[b]]}</dd>`);
                                                b = b + 1;
                                            } while (b < vallen);
                                            item.push(`</dl>`);
                                        }
                                        item.push(`</li><li><h5>Default</h5>`);
                                        item.push(String(opt.default));
                                        item.push(`</li><li><h5>As labeled in the HTML tool</h5>`);
                                        item.push(opt.label);
                                        item.push(`</li></ul></li>`);
                                        allOptions.push(item.join(""));
                                        a = a + 1;
                                    } while (a < keyslen);
                                    return allOptions.join("");
                                },
                                buildDomInterface = function build_options_modifyFile_buildDomInterface():string {
                                    const allItems:string[] = [],
                                        exclusions = {
                                            "diff": "",
                                            "difflabel": "",
                                            "source": "",
                                            "sourcelabel": ""
                                        };
                                    let a:number = 0,
                                        b:number = 0,
                                        item:string[],
                                        optName:string,
                                        opt:option,
                                        vals:string[],
                                        vallen:number;
                                    do {
                                        optName = optkeys[a];
                                        opt = definitions[optName];
                                        if (exclusions[optName] !== "" && (opt.api === "any" || opt.api === "dom")) {
                                            item = [`<li data-mode="${opt.mode}">`];
                                            if (opt.type === "boolean") {
                                                item.push(`<p class="label">${opt.label} <a class="apiname" href="documentation.xhtml#${optName}">(${optName})</a></p>`);
                                                if (opt.default === true) {
                                                    item.push(`<span><input type="radio" id="option-false-${optName}" name="option-${optName}" value="false"/> <label for="option-false-${optName}">false</label></span>`);
                                                    item.push(`<span><input type="radio" checked="checked" id="option-true-${optName}" name="option-${optName}" value="true"/> <label for="option-true-${optName}">true</label></span>`);
                                                } else {
                                                    item.push(`<span><input type="radio" checked="checked" id="option-false-${optName}" name="option-${optName}" value="false"/> <label for="option-false-${optName}">false</label></span>`);
                                                    item.push(`<span><input type="radio" id="option-true-${optName}" name="option-${optName}" value="true"/> <label for="option-true-${optName}">true</label></span>`);
                                                }
                                            } else {
                                                item.push(`<label for="option-${optName}" class="label">${opt.label}`);
                                                item.push(` <a class="apiname" href="documentation.xhtml#${optName}">(${optName})</a>`);
                                                item.push(`</label>`);
                                                if (opt.type === "number" || (opt.type === "string" && opt.values === undefined)) {
                                                    item.push(`<input type="text" id="option-${optName}" value="${opt.default}" data-type="${opt.type}"/>`);
                                                } else {
                                                    item.push(`<select id="option-${optName}">`);
                                                    vals = Object.keys(opt.values);
                                                    vallen = vals.length;
                                                    b = 0;
                                                    do {
                                                        item.push(`<option data-description="${opt.values[vals[b]].replace(/"/g, "&quot;")}" ${
                                                            (opt.default === vals[b])
                                                                ? "selected=\"selected\""
                                                                : ""
                                                        }>${vals[b]}</option>`);
                                                        b = b + 1;
                                                    } while (b < vallen);
                                                    item.push(`</select>`);
                                                }
                                            }
                                            item.push(`<p class="option-description">${opt.definition.replace(/"/g, "&quot;")}</p>`);
                                            item.push(`<div class="disabled" style="display:none"></div>`);
                                            item.push(`</li>`);
                                            allItems.push(item.join(""));
                                        }
                                        a = a + 1;
                                    } while (a < keyslen);
                                    return allItems.join("");
                                };
                            if (err !== null && err.toString() !== "") {
                                errout(err.toString());
                                return;
                            }
                            if (fileFlag === "documentation") {
                                modify({
                                    end: "<!-- option list end -->",
                                    injectFlag: buildDocumentation(),
                                    start: "<!-- option list start -->"
                                });
                            } else if (fileFlag === "html") {
                                modify({
                                    end: "<!-- documented options end -->",
                                    injectFlag: buildDomInterface(),
                                    start: "<!-- documented options start -->"
                                });
                                modify({
                                    end: "<!-- end version data -->",
                                    injectFlag: `<strong>${versionData.date}</strong> <span>Version: <strong>${versionData.number}</strong></span>`,
                                    start: "<!-- start version data -->"
                                });
                            } else if (fileFlag === "dom") {
                                modify({
                                    end: "// end option defaults",
                                    injectFlag: buildDefaults("dom"),
                                    start:"// start option defaults"
                                });
                                modify({
                                    end: "// prettydiff insertion end",
                                    injectFlag: libs.replace(/global\.prettydiff/g, "prettydiff"),
                                    start: "// prettydiff insertion start"
                                });
                            }
                            node.fs.writeFile(file, data, function build_options_documentation_write(errw:Error) {
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
                    },
                    version = function build_options_version(file:string, fileFlag:string):void {
                        node.child(`git log -1 --branches`, function build_options_version_child(err:Error, stderr:string):void {
                            if (err !== null) {
                                errout(err.toString());
                                return;
                            }
                            const date:string[] = stderr.slice(stderr.indexOf("Date:") + 12).split(" ");
                            versionData.date = `${date[1]} ${date[0]} ${date[3]}`;
                            node.fs.readFile(`${projectPath}package.json`, "utf8", function build_options_version_child_readPackage(errp:Error, data:string):void {
                                if (errp !== null) {
                                    errout(errp.toString());
                                    return;
                                }
                                versionData.number = JSON.parse(data).version;
                                modifyFile(file, fileFlag);
                            });
                        })
                    },
                    libraries = function build_options_libraries(callback:Function) {
                        const pathes:string[] = [`${js}beautify`, `${api}diffview.js`, `${api}finalFile.js`, `${api}language.js`, `${projectPath}node_modules${sep}file-saver${sep}FileSaver.min.js`],
                            len:number = pathes.length,
                            appendFile = function build_options_libraries_appendFile(filePath:string):void {
                                node.fs.readFile(filePath, "utf8", function build_options_libraries_appendFile_read(errr:Error, filedata:string):void {
                                    if (errr !== null) {
                                        errout(errr.toString());
                                        return;
                                    }
                                    if (filePath.indexOf("FileSaver") > 0) {
                                        filedata = filedata.replace("var saveAs=saveAs||function(", "prettydiff.saveAs=function prettydiff_saveAs(").replace(/[\{|\}|;|(*/)]\s*var\s/g, function build_options_libraries_appendFile_read_saveAsFix(str:string) {
                                            return str.replace("var", "let");
                                        });
                                    }
                                    libs = libs + filedata;
                                    b = b + 1;
                                    if (b === filelen) {
                                        callback();
                                    }
                                });
                            },
                            stat = function build_options_libraries_stat(pathitem:string) {
                                node.fs.stat(pathitem, function build_options_libraries_stat_callback(errs:Error, stats:Stats):void {
                                    if (errs !== null) {
                                        errout(errs.toString());
                                        return;
                                    }
                                    if (stats.isDirectory() === true) {
                                        node.fs.readdir(pathitem, "utf8", function build_options_libraries_stat_callback_readdir(errd:Error, filelist:string[]):void {
                                            if (errd !== null) {
                                                errout(errd.toString());
                                                return;
                                            }
                                            filelen = filelen + (filelist.length - 1);
                                            filelist.forEach(function build_options_libraries_stat_callback_readdir_each(value:string):void {
                                                build_options_libraries_stat(pathitem + sep + value);
                                            });
                                        });
                                    } else if (stats.isFile() === true) {
                                        appendFile(pathitem);
                                    } else {
                                        filelen = filelen - 1;
                                    }
                                });
                            };
                        let a:number = 0,
                            b:number = 0,
                            filelen: number = len;
                        do {
                            stat(pathes[a]);
                            a = a + 1;
                        } while (a < len);
                    };
                libraries(function build_options_libraryCallback() {
                    modifyFile(`${api}dom.js`, "dom");
                });
                version(`${projectPath}index.xhtml`, "html");
                modifyFile(`${projectPath}documentation.xhtml`, "documentation");
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
    global.prettydiff = {};
    console.log("");
    next();
}());