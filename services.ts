import { Stats } from "fs";
/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */
(function node():void {
    "use strict";
    const startTime:[number, number]      = process.hrtime(),
        node = {
            child: require("child_process").exec,
            fs   : require("fs"),
            http : require("http"),
            https: require("https"),
            path : require("path")
        },
        stats = {
            source: "",
            diff: ""
        },
        sep:string = node.path.sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        js:string = `${projectPath}js${sep}`,
        api:string = `${js}api${sep}`,
        libs:string = (function node_libs():string {
            require(`${api}diffview`);
            require(`${api}finalFile`);
            require(`${api}language`);
            require(`${api}options`);
            return "";
        }()),
        // node option default start
        options:any = {},
        version:any = {},
        // node option default end
        text:any     = {
            blue     : "\u001b[34m",
            bold     : "\u001b[1m",
            cyan     : "\u001b[36m",
            green    : "\u001b[32m",
            nocolor  : "\u001b[39m",
            none     : "\u001b[0m",
            purple   : "\u001b[35m",
            red      : "\u001b[31m",
            underline: "\u001b[4m",
            yellow   : "\u001b[33m"
        },
        commands:any = {
            analysis: "Perform Pretty Diff's code analysis operation.",
            beautify: "Perform Pretty Diff's code beautification.",
            build: "Rebuilds the application",
            commands: "List the support command to the console.",
            copy: "Copy files or directories from one location to another on the local file system.",
            diff: "Compare code samples the Pretty Diff way.",
            get: "Retrieve a resource via a URI.",
            hash: "Generate a SHA512 hash of a file.",
            help: "Introductory information to Pretty Diff on the command line.",
            minify: "Remove all unnecessary white space and comments from code.",
            options: "List Pretty Diff's options to the console.",
            parse: "Generate a parse table of a code sample.",
            remove: "Remove a file or directory tree from the local file system.",
            test: "Run the validation tests.",
            version: "Prints the current version number and date of prior modification to the console."
        },
        humantime  = function node_humantime(finished:boolean):string {
            let minuteString:string = "",
                hourString:string   = "",
                secondString:string = "",
                finalTime:string    = "",
                finalMem:string     = "",
                strSplit:string[]     = [],
                minutes:number      = 0,
                hours:number        = 0,
                memory,
                elapsed:number      = (function node_humantime_elapsed():number {
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
            const prettybytes  = function node_humantime_prettybytes(an_integer:number):string {
                    //find the string length of input and divide into triplets
                    let output:string = "",
                        length:number  = an_integer
                            .toString()
                            .length;
                    const triples:number = (function node_humantime_prettybytes_triples():number {
                            if (length < 22) {
                                return Math.floor((length - 1) / 3);
                            }
                            //it seems the maximum supported length of integer is 22
                            return 8;
                        }()),
                        //each triplet is worth an exponent of 1024 (2 ^ 10)
                        power:number   = (function node_humantime_prettybytes_power():number {
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
                plural       = function node_proctime_plural(x:number, y:string):string {
                    if (x !== 1) {
                        return `${x + y}s `;
                    }
                    return `${x + y} `;
                },
                minute       = function node_proctime_minute():void {
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
                console.log("");
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
        errout     = function node_errout(errtext:string):void {
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
        args:nodeArgs = (function node_args():nodeArgs {
            const list:string[] = process.argv.slice(2),
                out:nodeArgs = [],
                def = global.prettydiff.optionDef.definitions;
            let len:number = list.length,
                split:string = "",
                value:string = "",
                name:string = "",
                a:number = 0;
            if (len < 1) {
                return [];
            }
            do {
                list[a] = list[a].replace(/^(-+)/, "");
                if (a < 1 && commands[list[a]] !== undefined) {
                    if (list[a] === "options" && options[list[a + 1]] !== undefined) {
                        out.push([list[a], list[a + 1]]);
                        a = a + 1;
                    } else {
                        out.push([list[a], true]);
                    }
                } else {
                    if ((list[a].indexOf("=") < list[a].indexOf(":") && list[a].indexOf("=") > 0) || (list[a].indexOf("=") > 0 && list[a].indexOf(":") < 0)) {
                        split = "=";
                    } else {
                        split = ":";
                    }
                    if (options[list[a]] !== undefined && options[list[a + 1]] === undefined) {
                        options[list[a]] = list[a + 1];
                        a = a + 1;
                    } else if (list[a].indexOf(split) > 0) {
                        name = list[a].slice(0, list[a].indexOf(split));
                        value = list[a].slice(list[a].indexOf(split) + 1);
                        if (options[name] !== undefined) {
                            if (value === "true" && def[name].type === "boolean") {
                                options[name] = true;
                            } else if (value === "false" && def[name].type === "boolean") {
                                options[name] = false;
                            } else if (isNaN(Number(value)) === false && def[name].type === "number") {
                                options[name] = Number(value);
                            } else if (def[name].values !== undefined && def[name].values[value] !== undefined) {
                                options[name] = value;
                            } else if (def[name].values === undefined) {
                                options[name] = value;
                            }
                        }
                    }
                }
                a = a + 1;
            } while (a < len);
            return out;
        }()),
        apps:any = {};
    apps.analysis = function node_apps_analysis():void {
        options.mode = "analysis";
        apps.mode();
    };
    apps.beautify = function node_apps_beautify():void {
        options.mode = "beautify";
        apps.mode();
    };
    apps.build = function node_apps_build():void {
        let firstOrder:boolean = true;
        const order = [
                "typescript",
                "options",
                "lint"
            ],
            orderlen:number = order.length,
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
                if (order.length < 1) {
                    return complete();
                }
                order.splice(0, 1);
                phases[phase]();
            },
            heading = function build_heading(message:string):void {
                if (firstOrder === true) {
                    console.log("");
                    firstOrder = false;
                } else if (order.length < orderlen) {
                    console.log("________________________________________________________________________");
                    console.log("");
                }
                console.log(`\u001b[36m${message}\u001b[39m`);
                console.log("");
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
                    heading("Linting");
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
                                    buildDefaults = function build_options_modifyFile_buildDefault(api:"dom"|"node"):string {
                                        const obj:any = {},
                                            verse:string = (api === "node")
                                                ? `version=${JSON.stringify(versionData)},`
                                                : "";
                                        let a:number = 0,
                                            apikey = "";
                                        do {
                                            apikey = definitions[optkeys[a]].api;
                                            if (apikey === "any" || apikey === api) {
                                                obj[optkeys[a]] = definitions[optkeys[a]].default;
                                            }
                                            a = a + 1;
                                        } while (a < keyslen);
                                        return `options=${JSON.stringify(obj)},${verse}`;
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
                                } else if (fileFlag === "node") {
                                    modify({
                                        end: "// node option default end",
                                        injectFlag: buildDefaults("node"),
                                        start:"// node option default start"
                                    });
                                }
                                node.fs.writeFile(file, data, function build_options_documentation_write(errw:Error) {
                                    if (errw !== null && errw.toString() !== "") {
                                        errout(errw.toString());
                                        return;
                                    }
                                    flag[fileFlag] = true;
                                    if (flag.documentation === true && flag.dom === true && flag.html === true && flag.node === true) {
                                        console.log(`${humantime(false)}\u001b[32mOption details written to files.\u001b[39m`);
                                        next();
                                    }
                                });
                            });
                        },
                        version = function build_options_version(file:string, fileFlag:string):void {
                            if (versionData.number !== "") {
                                return modifyFile(file, fileFlag);
                            }
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
                    heading("Building Options");
                    libraries(function build_options_libraryCallback() {
                        modifyFile(`${api}dom.js`, "dom");
                        version(`${api}node.js`, "node");
                    });
                    version(`${projectPath}index.xhtml`, "html");
                    modifyFile(`${projectPath}documentation.xhtml`, "documentation");
                },
                typescript: function build_typescript():void {
                    heading("TypeScript Compilation");
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
        next();
    };
    apps.diff = function node_apps_diff():void {
        options.mode = "diff";
        apps.mode();
    };
    apps.commands = function node_apps_commands():void {
        const keys:string[] = Object.keys(commands),
            len:number  = keys.length;
        let comm:string = "",
            lens:number = 0,
            a:number    = 0,
            b:number    = 0;
        apps.heading("Commands");
        do {
            if (keys[a].length > lens) {
                lens = keys[a].length;
            }
            a = a + 1;
        } while (a < len);
        a = 0;
        do {
            comm = keys[a];
            b    = comm.length;
            if (b < lens) {
                do {
                    comm = comm + " ";
                    b    = b + 1;
                } while (b < lens);
            }
            console.log(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}: ${commands[keys[a]]}`);
            a = a + 1;
        } while (a < len);
        apps.version();
    };
    apps.heading = function node_apps_heading(message:string):void {
        console.log("");
        console.log(`${text.underline + text.bold}Pretty Diff - ${message + text.none}`);
        console.log("");
    };
    apps.help = function node_apps_help():void {
        console.log("");
        console.log(`${text.bold + text.underline}Pretty Diff${text.none}`);
        console.log("");
        console.log("Pretty Diff is a language aware diff tool.");
        console.log(`To get started try the ${text.green}commands${text.none} command.`);
        console.log("");
        console.log(`${text.cyan}prettydiff commands${text.none}`);
        console.log("");
        console.log("");
        apps.version();
    };
    apps.minify = function node_apps_minify():void {
        options.mode = "minify";
        apps.mode();
    };
    apps.mode = function node_apps_mode():void {
        return;
    };
    apps.options = function node_apps_options():void {
        const def:any = global.prettydiff.optionDef.definitions,
            defPresent = function node_apps_options_defPresent(heading:string, obj:any):void {
                const keys:string[] = Object.keys(obj).sort(),
                    displayKeys = function node_apps_options_defPresent_displayKeys(option:string, keylist:string[]):void {
                        const len:number = keylist.length;
                        let a:number = 0,
                            b:number = 0,
                            c:number = 0,
                            lens:number = 0,
                            comm:string = "";
                        do {
                            if (keylist[a].length > lens) {
                                lens = keylist[a].length;
                            }
                            a = a + 1;
                        } while (a < len);
                        do {
                            comm = keylist[b];
                            c    = comm.length;
                            if (c < lens) {
                                do {
                                    comm = comm + " ";
                                    c    = c + 1;
                                } while (c < lens);
                            }
                            if (option !== "") {
                                console.log(`   ${text.red + text.bold}- ${text.none + text.cyan + comm + text.nocolor}: ${def[option].values[keylist[b]]}`);
                            } else if (obj === def[args[0][1]]) {
                                if (keylist[b] === "values") {
                                    console.log(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}:`);
                                    displayKeys(args[0][1], Object.keys(def[args[0][1]][keylist[b]]).sort());
                                } else {
                                    console.log(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}: ${def[args[0][1]][keylist[b]]}`);
                                }
                            } else {
                                console.log(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}: ${def[keylist[b]].definition}`);
                            }
                            b = b + 1;
                        } while (b < len);
                    };
                apps.heading(heading);
                displayKeys("", keys);
            };
        if (options[args[0][1]] !== undefined) {
            defPresent(`Option: ${text.green + args[0][1] + text.nocolor}`, def[args[0][1]]);
        } else {
            defPresent("Options", options);
        }
        humantime(true);
    };
    apps.parse = function node_apps_parse():void {
        options.mode = "parse";
        apps.mode();
    };
    apps.version = function node_apps_version():void {
        console.log("");
        console.log(`Pretty Diff version ${text.red + text.bold + version.number + text.none} dated ${text.cyan + version.date + text.none}`);
        humantime(true);
    };
    // resolve relative paths into absolute from process.cwd
    //if ((/^(\w+:\/\/)/).test(options.source) === true && (options.readmethod === "auto" || options.readmethod === "")) {}
    // rethink flags for things such as help, version
    // allow =, :, and space as name/value separators
    //
    // command list
    // * get
    // * copy
    // * remove
    if (args[0] === undefined || apps[args[0][0]] === undefined) {
        // libs reference is included only to tease off a lint warning
        errout(`${libs}Please use a supported command.  Example: ${text.cyan}prettydiff help${text.none}`);
        return;
    }
    apps[args[0][0]]();
}());
