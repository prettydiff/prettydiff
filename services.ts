import { Stats } from "fs";
import { Http2Stream } from "http2";
import { Stream, Writable } from "stream";
import { Hash } from "crypto";
/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */
(function node():void {
    "use strict";
    const startTime:[number, number]      = process.hrtime(),
        node = {
            child : require("child_process").exec,
            crypto: require("crypto"),
            fs    : require("fs"),
            http  : require("http"),
            https : require("https"),
            path  : require("path")
        },
        binaryCheck:RegExp   = (
            /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
        ),
        /*stats = {
            source: "",
            diff: ""
        },*/
        sep:string = node.path.sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        js:string = `${projectPath}js${sep}`,
        api:string = `${js}api${sep}`,
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
        commands:commandList = {
            analysis: {
                description: "Perform Pretty Diff's code analysis operation.",
                example: [{
                    code: "",
                    defined: "Performs Pretty Diff's code analysis operation."
                }]
            },
            beautify: {
                description: "Perform Pretty Diff's code beautification.",
                example: [{
                    code: "",
                    defined: "Performs Pretty Diff's beautify operation."
                }]
            },
            build: {
                description: "Rebuilds the application.",
                example: [{
                    code: "prettydiff build",
                    defined: "Compiles from TypeScript into JavaScript, compiles libraries, and lints the code."
                }]
            },
            commands: {
                description: "List all supported commands to the console or examples of a specific command.",
                example: [
                    {
                        code: "prettydiff commands",
                        defined: "Lists all commands and their definitions to the shell."
                    },
                    {
                        code: "prettydiff commands commands",
                        defined: "Details the mentioned command with code examples."
                    }
                ]
            },
            copy: {
                description: "Copy files or directories from one location to another on the local file system.",
                example: [
                    {
                        code: "prettydiff copy source/file/or/directory destination/path",
                        defined: "Copies the file system artifact at the first address to the second address."
                    },
                    {
                        code: "prettydiff copy \"C:\\Program Files\" destination\\path",
                        defined: "Quote values that contain non-alphanumeric characters."
                    },
                    {
                        code: "prettydiff copy source destination [build, .git, node_modules]",
                        defined: "Exclusions are permitted as a comma separated list in square brackets."
                    },
                    {
                        code: "prettydiff copy ../prettydiff3 ../prettydiffXX [build, .git, node_modules]",
                        defined: "Exclusions are relative to the source directory."
                    }
                ]
            },
            diff: {
                description: "Compare code samples the Pretty Diff way.",
                example: [{
                    code: "",
                    defined: "Performs Pretty Diff's diff operation."
                }]
            },
            get: {
                description: "Retrieve a resource via an absolute URI.",
                example: [
                    {
                        code: "prettydiff get http://example.com/file.txt",
                        defined: "Gets a resource from the web and prints the output to the shell."
                    },
                    {
                        code: "prettydiff get http://example.com/file.txt path/to/file",
                        defined: "Get a resource from the web and writes the resource as UTF8 to a file at the specified path."
                    }
                ]
            },
            hash: {
                description: "Generate a SHA512 hash of a file.",
                example: [
                    {
                        code: "prettydiff hash path/to/file",
                        defined: "Prints a SHA512 hash to the shell for the specified file system resource."
                    },
                    {
                        code: "prettydiff hash explicit path/to/file",
                        defined: "Prints only the SHA512 hash to the shell."
                    },
                    {
                        code: "prettydiff hash string \"I love kittens.\"",
                        defined: "Hash an arbitrary string directly from shell input."
                    }
                ]
            },
            help: {
                description: "Introductory information to Pretty Diff on the command line.",
                example: [{
                    code: "prettydiff help",
                    defined: "Writes help text to shell."
                }]
            },
            minify: {
                description: "Remove all unnecessary white space and comments from code.",
                example: [{
                    code: "",
                    defined: "Performs Pretty Diff's minify operation."
                }]
            },
            options: {
                description: "List all Pretty Diff's options to the console or gather instructions on a specific option.",
                example: [
                    {
                        code: "prettydiff options",
                        defined: "List all options and their definitions to the shell."
                    },
                    {
                        code: "prettydiff options mode",
                        defined: "Writes details about the specified option to the shell."
                    }
                ]
            },
            parse: {
                description: "Generate a parse table of a code sample.",
                example: [{
                    code: "",
                    defined: "Performs Pretty Diff's parse operation."
                }]
            },
            remove: {
                description: "Remove a file or directory tree from the local file system.",
                example: [
                    {
                        code: "prettydiff remove path/to/resource",
                        defined: "Removes the specified resource."
                    },
                    {
                        code: "prettydiff remove \"C:\\Program Files\"",
                        defined: "Quote the path if it contains non-alphanumeric characters."
                    }
                ]
            },
            validation: {
                description: "Run the validation tests.",
                example: [{
                    code: "",
                    defined: ""
                }]
            },
            version: {
                description: "Prints the current version number and date of prior modification to the console.",
                example: [{
                    code: "prettydiff version",
                    defined: "Prints the current version number and date to the shell."
                }]
            }
        },
        command:string = (function node_command():string {
            let comkeys:string[] = Object.keys(commands),
                filtered:string[] = [],
                a:number = 1;
            if (process.argv[2] === undefined) {
                console.log(`Pretty Diff requires a command. Try: ${text.cyan}prettydiff help${text.none}`);
                process.exit(1);
                return;
            }
            const arg:string = process.argv[2],
                len:number = arg.length,
                commandFilter = function node_args_filter(item:string):boolean {
                    if (item.indexOf(arg.slice(0, a)) === 0) {
                        return true;
                    }
                    return false;
                };
            process.argv = process.argv.slice(3);
            do {
                filtered = comkeys.filter(commandFilter);
                a = a + 1;
            } while (filtered.length > 1 && a < len);
            if (filtered.length < 1) {
                console.log(`Command ${text.bold + text.red + arg + text.none} is not a supported command.`);
                process.exit(1);
                return "";
            }
            if (filtered.length > 1) {
                console.log(`Command '${text.bold + text.red + arg + text.none}' is ambiguous as it could refer to any of: [${text.cyan + filtered.join(", ") + text.none}]`);
                process.exit(1);
                return "";
            }
            return filtered[0];
        }()),
        sample = {
            source: "",
            diff: ""
        },
        apps:any = {};
    
    (function node_args():void {
        const list:string[] = process.argv,
            len:number = list.length,
            requireDir = function node_args_requireDir(dirName:string):void {
                let counts = {
                    items: 0,
                    total: 0
                };
                if (dirName !== `${js}api`) {
                    const dirs:string[] = dirName.split(node.path.sep);
                    global.prettydiff[dirs[dirs.length - 1]] = {};
                }
                const completeTest = function node_args_requireDir_completeTest(filesLength:number):boolean {
                        counts.total = counts.total + filesLength;
                        if (counts.total === counts.items) {
                            dirs = dirs + 1;
                            if (dirs === dirstotal) {
                                if (len > 0) {
                                    readOptions();
                                }
                                apps[command]();
                            }
                            return true;
                        }
                        return false;
                    },
                    readdir = function node_args_requireDir_dirwrapper(start:string):void {
                        node.fs.readdir(start, function node_args_requireDir_dirwrapper_readdir(err:Error, files:string[]) {
                            if (err !== null) {
                                apps.errout(err.toString());
                                return;
                            }
                            if (completeTest(files.length) === true) {
                                return;
                            }
                            files.forEach(function node_args_requireDir_dirwrapper_readdir_each(value:string) {
                                const valpath:string = start + node.path.sep + value;
                                if (valpath.indexOf(`api${node.path.sep}dom.js`) > 0) {
                                    counts.items = counts.items + 1;
                                    completeTest(0);
                                    return;
                                }
                                node.fs.stat(valpath, function node_args_requireDir_dirwrapper_readdir_each_stat(errs:Error, stats:Stats):void {
                                    if (errs !== null) {
                                        apps.errout(errs.toString());
                                        return;
                                    }
                                    if (stats.isFile() === true) {
                                        require(valpath);
                                        counts.items = counts.items + 1;
                                    } else if (stats.isDirectory() === true) {
                                        node_args_requireDir_dirwrapper(valpath);
                                    } else {
                                        counts.items = counts.items + 1;
                                    }
                                    if (completeTest(0) === true) {
                                        return;
                                    }
                                });
                            });
                        });
                    };
                dirstotal = dirstotal + 1;
                readdir(dirName);
            },
            readOptions = function node_args_readOptions():void {
                const def = global.prettydiff.optionDef;
                let split:string = "",
                    value:string = "",
                    name:string = "",
                    a:number = 0;
                do {
                    list[a] = list[a].replace(/^(-+)/, "");
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
                    a = a + 1;
                } while (a < len);
            };
        let dirs:number = 0,
            dirstotal:number = 0;
        global.prettydiff = {};
        requireDir(`${js}api`);
        requireDir(`${js}beautify`);
    }());
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
                const complete = function build_complete():void {
                    console.log("");
                    console.log("All tasks complete... Exiting clean!");
                    apps.humantime(true);
                    process.exit(0);
                };
                if (order.length < 1) {
                    complete();
                    return;
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
                                                apps.errout(err);
                                                return;
                                            }
                                            if (stderr !== null && stderr !== "") {
                                                apps.errout(stderr);
                                                return;
                                            }
                                            filesCount = filesCount + 1;
                                            console.log(`${apps.humantime(false)}\u001b[32mLint passed:\u001b[39m ${val}`);
                                            if (filesCount === filesTotal) {
                                                console.log("\u001b[32mLint complete!\u001b[39m");
                                                next();
                                                return;
                                            }
                                        } else {
                                            console.log(stdout);
                                            apps.errout("Lint failure.");
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
                                                        apps.errout(errb);
                                                        return;
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
                                            apps.errout(`Error reading path: ${filepath}\n${erra}`);
                                            return;
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
                        definitions = global.prettydiff.optionDef,
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
                                                        data = data.replace(new RegExp(ops.start + "\\s+"), ops.start + "\n");
                                                        return ops.start.length + 1;
                                                    }())
                                                    : ops.start.length;
                                                return data.indexOf(ops.start) + len;
                                            }()),
                                            end:number = data.indexOf(ops.end);
                                        if (ops.end.indexOf("//") === 0) {
                                            data = data.replace(new RegExp(ops.end + "\\s+"), ops.end + "\n");
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
                                    apps.errout(err.toString());
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
                                        injectFlag: libs
                                            .replace(/\/\*global global, options\*\//g, "/*global global*/")
                                            .replace(/if \(global\.prettydiff === undefined\) \{\s+global\.prettydiff = \{\};\s+\}/g, "")
                                            .replace(/global\.prettydiff/g, "prettydiff")
                                            .replace(/("|')use strict("|');/g, ""),
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
                                        apps.errout(errw.toString());
                                        return;
                                    }
                                    flag[fileFlag] = true;
                                    if (flag.documentation === true && flag.dom === true && flag.html === true && flag.node === true) {
                                        console.log(`${apps.humantime(false)}\u001b[32mOption details written to files.\u001b[39m`);
                                        next();
                                    }
                                });
                            });
                        },
                        version = function build_options_version(file:string, fileFlag:string):void {
                            if (versionData.number !== "") {
                                modifyFile(file, fileFlag);
                                return;
                            }
                            node.child(`git log -1 --branches`, function build_options_version_child(err:Error, stderr:string):void {
                                if (err !== null) {
                                    apps.errout(err.toString());
                                    return;
                                }
                                const date:string[] = stderr.slice(stderr.indexOf("Date:") + 12).split(" ");
                                versionData.date = `${date[1]} ${date[0]} ${date[3]}`;
                                node.fs.readFile(`${projectPath}package.json`, "utf8", function build_options_version_child_readPackage(errp:Error, data:string):void {
                                    if (errp !== null) {
                                        apps.errout(errp.toString());
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
                                            apps.errout(errr.toString());
                                            return;
                                        }
                                        if (filePath.indexOf("FileSaver") > 0) {
                                            filedata = filedata
                                                .replace("var saveAs=saveAs||function(", "// eslint-disable-next-line\r\nprettydiff.saveAs=function prettydiff_saveAs(")
                                                .replace(/[{|}|;|(*/)]\s*var\s/g, function build_options_libraries_appendFile_read_saveAsFix(str:string):string {
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
                                            apps.errout(errs.toString());
                                            return;
                                        }
                                        if (stats.isDirectory() === true) {
                                            node.fs.readdir(pathitem, "utf8", function build_options_libraries_stat_callback_readdir(errd:Error, filelist:string[]):void {
                                                if (errd !== null) {
                                                    apps.errout(errd.toString());
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
                        version(`${js}services.js`, "node");
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
                            apps.errout(stdout);
                            return;
                        }
                        if (err !== null) {
                            apps.errout(err);
                            return;
                        }
                        if (stderr !== null && stderr !== "") {
                            apps.errout(stderr);
                            return;
                        }
                        console.log(`${apps.humantime(false)}\u001b[32mTypeScript build completed without warnings.\u001b[39m`);
                        next();
                    });
                }
            };
        next();
    };
    apps.commands = function node_apps_commands():void {
        if (commands[process.argv[0]] === undefined) {
            // all commands in a list
            apps.lists({
                emptyline: true,
                heading: "Commands",
                obj: commands,
                property: "description"
            });
        } else {
            // specificly mentioned option
            const comm:any = commands[process.argv[0]],
                len:number = comm.example.length,
                plural:string = (len > 1)
                    ? "s"
                    : "";
            let a:number = 0;
            console.log("");
            console.log(`${text.bold + text.underline}Pretty Diff - Command: ${text.green + process.argv[0] + text.none}`);
            console.log("");
            console.log(comm.description);
            console.log("");
            console.log(`${text.underline}Example${plural + text.none}`);
            do {
                console.log(comm.example[a].defined);
                console.log(`   ${text.cyan + comm.example[a].code + text.none}`);
                console.log("");
                a = a + 1;
            } while (a < len);
            apps.version();
        }
    };
    apps.commas   = function node_apps_commas(number:number):string {
        const str:string = String(number);
        let arr:string[] = [],
            a:number   = str.length;
        if (a < 4) {
            return str;
        }
        arr = String(number).split("");
        a   = arr.length;
        do {
            a      = a - 3;
            arr[a] = "," + arr[a];
        } while (a > 3);
        return arr.join("");
    };
    apps.copy = function node_apps_copy(params:nodeCopyParams):void {
        const numb:any  = {
                dirs : 0,
                files: 0,
                link : 0,
                size : 0
            },
            util:any  = {};
        let start:string = "",
            dest:string  = "",
            dirs:any  = {},
            target:string        = "",
            destination:string   = "",
            exlen:number = 0;
        util.complete = function node_apps_copy_complete(item:string):void {
            delete dirs[item];
            if (Object.keys(dirs).length < 1) {
                params.callback();
            }
        };
        util.eout     = function node_apps_copy_eout(er:Error):void {
            const filename:string[] = target.split(node.path.sep);
            apps.remove(
                destination + node.path.sep + filename[filename.length - 1],
                function node_apps_copy_eout_remove() {
                    apps.errout(er);
                }
            );
        };
        util.dir      = function node_apps_copy_dir(item:string):void {
            node
                .fs
                .readdir(item, function node_apps_copy_dir_makedir_readdir(er:Error, files:string[]):void {
                    const place:string = (item === start)
                        ? dest
                        : dest + item.replace(start + node.path.sep, "");
                    if (er !== null) {
                        util.eout(er);
                        return;
                    }
                    apps.makedir(place, function node_apps_copy_dir_makedir():void {
                        const a = files.length;
                        let b = 0;
                        if (a > 0) {
                            delete dirs[item];
                            do {
                                dirs[item + node.path.sep + files[b]] = true;
                                b                                     = b + 1;
                            } while (b < a);
                            b = 0;
                            do {
                                util.stat(item + node.path.sep + files[b], item);
                                b = b + 1;
                            } while (b < a);
                        } else {
                            util.complete(item);
                        }
                    });
                });
        };
        util.file     = function node_apps_copy_file(item:string, dir:string, prop:nodeFileProps):void {
            const place:string       = (item === dir)
                    ? dest + item
                        .split(node.path.sep)
                        .pop()
                    : dest + item.replace(start + node.path.sep, ""),
                readStream:Stream  = node
                    .fs
                    .createReadStream(item),
                writeStream:Writable = node
                    .fs
                    .createWriteStream(place, {mode: prop.mode});
            let errorflag:boolean   = false;
            readStream.on("error", function node_apps_copy_file_readError(error:Error):void {
                errorflag = true;
                util.eout(error);
                return;
            });
            writeStream.on("error", function node_apps_copy_file_writeError(error:Error):void {
                errorflag = true;
                util.eout(error);
                return;
            });
            if (errorflag === false) {
                writeStream.on("open", function node_apps_copy_file_write():void {
                    readStream.pipe(writeStream);
                });
                writeStream.once("finish", function node_apps_copy_file_finish():void {
                    const filename:string[] = item.split(node.path.sep);
                    node
                        .fs
                        .utimes(
                            dest + node.path.sep + filename[filename.length - 1],
                            prop.atime,
                            prop.mtime,
                            function node_apps_copy_file_finish_utimes():void {
                                util.complete(item);
                            }
                        );
                });
            }
        };
        util.link     = function node_apps_copy_link(item:string, dir:string):void {
            node
                .fs
                .readlink(item, function node_apps_copy_link_readlink(err:Error, resolvedlink:string):void {
                    if (err !== null) {
                        util.eout(err);
                        return;
                    }
                    resolvedlink = node.path.resolve(resolvedlink);
                    node
                        .fs
                        .stat(resolvedlink, function node_apps_copy_link_readlink_stat(ers:Error, stats:Stats):void {
                            let type  = "file",
                                place = dest + item;
                            if (ers !== null) {
                                util.eout(ers);
                                return;
                            }
                            if (stats === undefined || stats.isFile === undefined) {
                                util.eout(`Error in performing stat against ${item}`);
                                return;
                            }
                            if (item === dir) {
                                place = dest + item
                                    .split(node.path.sep)
                                    .pop();
                            }
                            if (stats.isDirectory() === true) {
                                type = "junction";
                            }
                            node
                                .fs
                                .symlink(
                                    resolvedlink,
                                    place,
                                    type,
                                    function node_apps_copy_link_readlink_stat_makelink(erl:Error):void {
                                        if (erl !== null) {
                                            util.eout(erl);
                                            return;
                                        }
                                        util.complete(item);
                                    }
                                );
                        });
                });
        };
        util.stat     = function node_apps_copy_stat(item:string, dir:string):void {
            let a    = 0;
            if (exlen > 0) {
                do {
                    if (item.replace(start + node.path.sep, "") === params.exclusions[a]) {
                        params.exclusions.splice(a, 1);
                        exlen = exlen - 1;
                        util.complete(item);
                        return;
                    }
                    a = a + 1;
                } while (a < exlen);
            }
            node.fs.stat(item, function node_apps_copy_stat_callback(er:Error, stats:Stats):void {
                if (er !== null) {
                    util.eout(er);
                    return;
                }
                if (stats === undefined || stats.isFile === undefined) {
                    util.eout("stats object is undefined");
                    return;
                }
                if (stats.isFile() === true) {
                    numb.files = numb.files + 1;
                    numb.size  = numb.size + stats.size;
                    if (item === dir) {
                        apps.makedir(dest, function node_apps_copy_stat_callback_file():void {
                            util.file(item, dir, {
                                atime: (Date.parse(stats.atime.toString()) / 1000),
                                mode : stats.mode,
                                mtime: (Date.parse(stats.mtime.toString()) / 1000)
                            });
                        });
                    } else {
                        util.file(item, dir, {
                            atime: (Date.parse(stats.atime.toString()) / 1000),
                            mode : stats.mode,
                            mtime: (Date.parse(stats.mtime.toString()) / 1000)
                        });
                    }
                } else if (stats.isDirectory() === true) {
                    numb.dirs = numb.dirs + 1;
                    util.dir(item);
                } else if (stats.isSymbolicLink() === true) {
                    numb.link = numb.link + 1;
                    if (item === dir) {
                        apps.makedir(dest, function node_apps_copy_stat_callback_symb() {
                            util.link(item, dir);
                        });
                    } else {
                        util.link(item, dir);
                    }
                } else {
                    util.complete(item);
                }
            });
        };
        if (command === "copy") {
            if (process.argv[0] === undefined || process.argv[1] === undefined) {
                apps.errout("The copy command requires a source path and a destination path.  Please see `prettydiff commands copy` for examples.");
                return;
            }
            params = {
                callback: function node_copy_callback() {
                    const out:string[] = ["Pretty Diff copied "];
                    console.log("");
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(numb.dirs);
                    out.push(text.none);
                    out.push(" director");
                    if (numb.dirs === 1) {
                        out.push("y, ");
                    } else {
                        out.push("ies, ");
                    }
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(numb.files);
                    out.push(text.none);
                    out.push(" file");
                    if (numb.files !== 1) {
                        out.push("s");
                    }
                    out.push(", and ");
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(numb.link);
                    out.push(text.none);
                    out.push(" symbolic link");
                    if (numb.link !== 1) {
                        out.push("s");
                    }
                    out.push(" at ");
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(apps.commas(numb.size));
                    out.push(text.none);
                    out.push(" bytes.");
                    console.log(out.join(""));
                    console.log(`Copied ${text.cyan + target + text.nocolor} to ${text.green + destination + text.nocolor}`);
                    console.log("");
                },
                exclusions: (function node_copy_exclusions():string[] {
                    const out:string[] = [],
                        len:number = process.argv.length;
                    let a:number = 0,
                        length:number = 0,
                        start:number = 0;
                    do {
                        if (out.length < 1 && process.argv[a].indexOf("[") === 0) {
                            out.push(process.argv[a].slice(1));
                            start = a;
                            if (process.argv[a].indexOf("]") === length) {
                                if (process.argv[a].slice(0, length) !== "") {
                                    out.push(process.argv[a].slice(0, length));
                                }
                                process.argv.splice(start, 1);
                                return out;
                            }
                        } else if (out.length > 0) {
                            length = process.argv[a].length - 1;
                            if (process.argv[a].indexOf("]") === length) {
                                if (process.argv[a].slice(0, length) !== "") {
                                    out.push(process.argv[a].slice(0, length));
                                }
                                process.argv.splice(start, a - start);
                                return out;
                            }
                            out.push(process.argv[a]);
                        }
                        a = a + 1;
                    } while (a < len);
                    return out;
                }()),
                destination: process.argv[1].replace(/(\\|\/)/g, node.path.sep),
                target: process.argv[0].replace(/(\\|\/)/g, node.path.sep)
            };
            console.log(params.exclusions);
        }
        target =  params.target.replace(/(\\|\/)/g, node.path.sep);
        destination = params.destination.replace(/(\\|\/)/g, node.path.sep);
        exlen = params.exclusions.length;
        dest          = node.path.resolve(destination) + node.path.sep;
        start         = node.path.resolve(target);
        util.stat(start, start);
    };
    apps.diff = function node_apps_diff():void {
        options.mode = "diff";
        apps.mode();
    };
    apps.errout     = function node_apps_errout(errtext:string):void {
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
    };
    apps.get = function node_apps_get(address:string, flag:"source"|"diff", callback:Function):void {
        const scheme:string = (address.indexOf("https") === 0)
            ? "https"
            : "http";
        let file:string = "";
        if (command === "get") {
            address = process.argv[0];
            callback = function node_apps_getFile_callback() {
                if (process.argv[1] !== undefined) {
                    let path = node.path.resolve(process.argv[1]);
                    node.fs.writeFile(path, sample.source, "utf8", function node_apps_getFile_callback_write(err:Error) {
                        if (err !== null) {
                            apps.errout(err.toString());
                            return;
                        }
                        console.log(`File ${text.cyan + path + text.none} written with ${apps.commas(sample.source.length)} characters.`);
                    });
                } else {
                    console.log(sample.source);
                }
            };
        }
        if (address === undefined) {
            apps.errout("The get command requires an address.  Please see `prettydiff commands get` for examples.");
            return;
        }
        if ((/^(https?:\/\/)/).test(address) === false) {
            console.log(address);
            apps.errout("The get command requires a web address in http/https scheme.  Please see `prettydiff commands get` for examples.");
            return;
        }
        node[scheme].get(address, function node_apps_get_callback(res:Http2Stream) {
            res.setEncoding("utf8");
            res.on("data", function node_apps_get_callback_data(chunk:string):void {
                file = file + chunk;
            });
            res.on("end", function node_apps_get_callback_end() {
                sample[flag] = file;
                callback();
            });
        });
    };
    apps.hash        = function node_apps_hash(filepath:string, callback:Function):void {
        const hash:Hash = node
            .crypto
            .createHash("sha512");
        let explicit:boolean = false;
        if (command === "hash") {
            if (process.argv.indexOf("explicit") > -1) {
                explicit = true;
                process.argv.splice(process.argv.indexOf("explicit"), 1);
            }
            filepath = node.path.resolve(process.argv[0]);
            callback = function node_apps_hash_callback(hash:string):void {
                if (explicit === true) {
                    console.log(hash);
                    return;
                }
                console.log("");
                console.log(`Pretty Diff hashed ${text.cyan + filepath + text.none}`);
                console.log(hash);
                console.log("");
                apps.version();
            };
            if (process.argv.indexOf("string") > -1) {
                process.argv.splice(process.argv.indexOf("string"), 1);
                hash.update(process.argv[0]);
                callback(hash.digest("hex"));
                return;
            }
        }
        node
            .fs
            .stat(filepath, function node_apps_hash_stat(er:Error, stat:Stats):void {
                if (er !== null) {
                    if (er.toString().indexOf("no such file or directory") > 0) {
                        apps.errout(`filepath ${filepath} is not a file.`);
                        return;
                    }
                    apps.errout(er);
                    return;
                }
                if (stat === undefined || stat.isFile() === false) {
                    apps.errout(`filepath ${filepath} is not a file.`);
                    return;
                }
                node
                    .fs
                    .open(filepath, "r", function node_apps_hash_stat_open(ero:Error, fd:number):void {
                        const msize = (stat.size < 100)
                                ? stat.size
                                : 100;
                        let buff  = new Buffer(msize);
                        if (ero !== null) {
                            apps.errout(ero);
                            return;
                        }
                        node
                            .fs
                            .read(
                                fd,
                                buff,
                                0,
                                msize,
                                1,
                                function node_apps_hash_stat_open_read(erra:Error, bytesa:number, buffera:Buffer):number {
                                    let bstring:string = "";
                                    if (erra !== null) {
                                        apps.errout(erra);
                                        return;
                                    }
                                    bstring = buffera.toString("utf8", 0, buffera.length);
                                    bstring = bstring.slice(2, bstring.length - 2);
                                    if (binaryCheck.test(bstring) === true) {
                                        buff = new Buffer(stat.size);
                                        node
                                            .fs
                                            .read(
                                                fd,
                                                buff,
                                                0,
                                                stat.size,
                                                0,
                                                function node_apps_hash_stat_open_read_readBinary(errb:Error, bytesb:number, bufferb:Buffer):void {
                                                    if (errb !== null) {
                                                        apps.errout(errb);
                                                        return;
                                                    }
                                                    if (bytesb > 0) {
                                                        hash.on("readable", function node_apps_hash_stat_open_read_readBinary_hash():void {
                                                            const hashdata = <Buffer>hash.read();
                                                            if (hashdata !== null) {
                                                                callback(hashdata.toString("hex").replace(/\s+/g, ""));
                                                            }
                                                        });
                                                        hash.write(bufferb);
                                                        hash.end();
                                                    }
                                                }
                                            );
                                    } else {
                                        node
                                            .fs
                                            .readFile(filepath, {
                                                encoding: "utf8"
                                            }, function node_apps_hash_stat_open_read_readFile(errc:Error, dump:string):void {
                                                if (errc !== null && errc !== undefined) {
                                                    apps.errout(errc);
                                                    return;
                                                }
                                                hash.on("readable", function node_apps_hash_stat_open_read_readFile_hash():void {
                                                    const hashdata = <Buffer>hash.read();
                                                    if (hashdata !== null) {
                                                        callback(hashdata.toString("hex").replace(/\s+/g, ""));
                                                    }
                                                });
                                                hash.write(dump);
                                                hash.end();
                                            });
                                    }
                                    return bytesa;
                                }
                            );
                    });
            });
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
    apps.humantime  = function node_apps_humantime(finished:boolean):string {
        let minuteString:string = "",
            hourString:string   = "",
            secondString:string = "",
            finalTime:string    = "",
            finalMem:string     = "",
            strSplit:string[]     = [],
            minutes:number      = 0,
            hours:number        = 0,
            memory,
            elapsed:number      = (function node_apps_humantime_elapsed():number {
                const endtime:[number, number] = process.hrtime(),
                    big:number = 1000000000;
                let dtime:[number, number] = [endtime[0] - startTime[0], endtime[1] - startTime[1]];
                if (dtime[1] === 0) {
                    return dtime[0];
                }
                dtime[1] = ((big + endtime[1]) - startTime[1]);
                return dtime[0] + (dtime[1] / big);
            }());
        const prettybytes  = function node_apps_humantime_prettybytes(an_integer:number):string {
                //find the string length of input and divide into triplets
                let output:string = "",
                    length:number  = an_integer
                        .toString()
                        .length;
                const triples:number = (function node_apps_humantime_prettybytes_triples():number {
                        if (length < 22) {
                            return Math.floor((length - 1) / 3);
                        }
                        //it seems the maximum supported length of integer is 22
                        return 8;
                    }()),
                    //each triplet is worth an exponent of 1024 (2 ^ 10)
                    power:number   = (function node_apps_humantime_prettybytes_power():number {
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
        }
        return `\u001b[36m[${hourString}:${minuteString}:${secondString}]\u001b[39m `;
    };
    apps.lists = function node_apps_lists(lists:nodeLists):void {
        // * lists.emptyline - boolean - if each key should be separated by an empty line
        // * lists.heading   - string  - a text heading to precede the list
        // * lists.obj       - object  - an object to traverse
        // * lists.property  - string  - The child property to read from or "eachkey" to
        // access a directly assigned primitive
        const wrap:number = 100,
            wrapit = function node_apps_lists_wrapit(string:string):void {
                if (string.length > wrap) {
                    const indent:string = (function node_apps_options_wrapit_indent():string {
                            const len:number = string.length;
                            let inc:number = 0,
                                num:number = 2,
                                str:string = "";
                            do {
                                if (string.charAt(inc) === ":") {
                                    break;
                                }
                                if (string.charAt(inc) === "\u001b") {
                                    if (string.charAt(inc + 4) === "m") {
                                        inc = inc + 4;
                                    } else {
                                        inc = inc + 3;
                                    }
                                } else {
                                    num = num + 1;
                                }
                                inc = inc + 1;
                            } while (inc < len);
                            inc = 0;
                            do {
                                str = str + " ";
                                inc = inc + 1;
                            } while (inc < num);
                            return str;
                        }()),
                        formLine = function node_apps_options_wrapit_formLine():void {
                            let inc:number = 0,
                                wrapper:number = wrap;
                            do {
                                if (string.charAt(inc) === "\u001b") {
                                    if (string.charAt(inc + 4) === "m") {
                                        wrapper = wrapper + 4;
                                    } else {
                                        wrapper = wrapper + 3;
                                    }
                                }
                                inc = inc + 1;
                            } while (inc < wrapper);
                            if (string.charAt(wrapper) !== " " && string.length > wrapper) {
                                do {
                                    wrapper = wrapper - 1;
                                } while (wrapper > 0 && string.charAt(wrapper) !== " ");
                                if (wrapper === 0) {
                                    console.log(string);
                                    return;
                                }
                            }
                            console.log(string.slice(0, wrapper).replace(/ $/, ""));
                            string = string.slice(wrapper + 1);
                            if (string.length + indent.length > wrap) {
                                string = indent + string;
                                node_apps_options_wrapit_formLine();
                            } else if (string !== "") {
                                console.log(indent + string);
                            }
                        };
                    formLine();
                } else {
                    console.log(string);
                }
            },
            keys:string[] = Object.keys(lists.obj).sort(),
            displayKeys = function node_apps_lists_displayKeys(item:string, keylist:string[]):void {
                const len:number = keylist.length;
                let a:number = 0,
                    b:number = 0,
                    c:number = 0,
                    lens:number = 0,
                    comm:string = "";
                if (len < 1) {
                    apps.errout(`Please run the build: ${text.cyan}prettydiff build${text.none}`);
                    return;
                }
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
                    if (item !== "") {
                        // each of the "values" keys
                        wrapit(`   ${text.red + text.bold}- ${text.none + text.cyan + comm + text.nocolor}: ${lists.obj.values[keylist[b]]}`);
                    } else {
                        // list all items
                        if (lists.property === "eachkey") {
                            if (command === "options" && keylist[b] === "values") {
                                // "values" keyname of options
                                console.log(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}:`);
                                displayKeys(command, Object.keys(lists.obj.values).sort());
                            } else {
                                // all items keys and their primitive value
                                wrapit(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}: ${lists.obj[keylist[b]]}`);
                            }
                        } else {
                            // a list by key and specified property
                            wrapit(`${text.red + text.bold}* ${text.none + text.cyan + comm + text.nocolor}: ${lists.obj[keylist[b]][lists.property]}`);
                        }
                        if (lists.emptyline === true) {
                            console.log("");
                        }
                    }
                    b = b + 1;
                } while (b < len);
            };
        apps.heading(lists.heading);
        displayKeys("", keys);
        apps.humantime(true);
    };
    apps.makedir     = function node_apps_makedir(dirToMake:string, callback:Function):void {
        node
            .fs
            .stat(dirToMake, function node_apps_makedir_stat(err:nodeError, stats:Stats):void {
                let dirs   = [],
                    ind    = 0,
                    len    = 0,
                    ers    = "";
                const restat = function node_apps_makedir_stat_restat():void {
                        node
                            .fs
                            .stat(
                                dirs.slice(0, ind + 1).join(node.path.sep),
                                function node_apps_makedir_stat_restat_callback(erra:nodeError, stata:Stats):void {
                                    let erras:string = "";
                                    ind = ind + 1;
                                    if (erra !== null) {
                                        erras = erra.toString();
                                        if (erras.indexOf("no such file or directory") > 0 || erra.code === "ENOENT") {
                                            node
                                                .fs
                                                .mkdir(
                                                    dirs.slice(0, ind).join(node.path.sep),
                                                    function node_apps_makedir_stat_restat_callback_mkdir(errb:Error):void {
                                                        if (errb !== null && errb.toString().indexOf("file already exists") < 0) {
                                                            apps.errout(errb);
                                                            return;
                                                        }
                                                        if (ind < len) {
                                                            node_apps_makedir_stat_restat();
                                                        } else {
                                                            callback();
                                                        }
                                                    }
                                                );
                                            return;
                                        }
                                        if (erras.indexOf("file already exists") < 0) {
                                            apps.errout(erra);
                                            return;
                                        }
                                    }
                                    if (stata.isFile() === true) {
                                        apps.errout(`Destination directory, '${dirToMake}', is a file.`);
                                        return;
                                    }
                                    if (ind < len) {
                                        node_apps_makedir_stat_restat();
                                    } else {
                                        callback();
                                    }
                                }
                            );
                    };
                if (err !== null) {
                    ers = err.toString();
                    if (ers.indexOf("no such file or directory") > 0 || err.code === "ENOENT") {
                        dirs = dirToMake.split(node.path.sep);
                        if (dirs[0] === "") {
                            ind = ind + 1;
                        }
                        len = dirs.length;
                        restat();
                        return;
                    }
                    if (ers.indexOf("file already exists") < 0) {
                        apps.errout(err);
                        return;
                    }
                }
                if (stats.isFile() === true) {
                    apps.errout(`Destination directory, '${dirToMake}', is a file.`);
                    return;
                }
                callback();
            });
    };
    apps.minify = function node_apps_minify():void {
        options.mode = "minify";
        apps.mode();
    };
    apps.mode = function node_apps_mode():void {
        if (options.source === "") {
            apps.errout(`Pretty Diff requires use of the ${text.red + text.bold}source${text.none} option.`);
        }
        return;
    };
    apps.options = function node_apps_options():void {
        const def:any = global.prettydiff.optionDef;
        if (options[process.argv[0]] === undefined) {
            // all options in a list
            apps.lists({
                emptyline: true,
                heading: "Options",
                obj: def,
                property: "definition"
            });
        } else {
            // specificly mentioned option
            apps.lists({
                emptyLine: false,
                heading: `Option: ${text.green + process.argv[0] + text.nocolor}`,
                obj: def[process.argv[0]],
                property: "eachkey"
            });
        }
    };
    apps.parse = function node_apps_parse():void {
        options.mode = "parse";
        apps.mode();
    };
    apps.remove = function node_apps_remove(filepath:string, callback:Function):void {
        const numb    = {
                dirs: 0,
                file: 0,
                othr: 0,
                size: 0,
                symb: 0
            },
            dirs:any    = {},
            util:any    = {};
        let verbose = true;
        if (command === "copy") {
            verbose = false;
        }
        util.complete = function node_apps_remove_complete():void {
            const out = ["Pretty Diff removed "];
            if (command === "remove") {
                console.log("");
                out.push(text.red);
                out.push(text.bold);
                out.push(String(numb.dirs));
                out.push(text.none);
                out.push(" director");
                if (numb.dirs === 1) {
                    out.push("y, ");
                } else {
                    out.push("ies, ");
                }
                out.push(text.red);
                out.push(text.bold);
                out.push(String(numb.file));
                out.push(text.none);
                out.push(" file");
                if (numb.dirs !== 1) {
                    out.push("s");
                }
                out.push(", ");
                out.push(text.red);
                out.push(text.bold);
                out.push(String(numb.symb));
                out.push(text.none);
                out.push(" symbolic link");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(", and ");
                out.push(text.red);
                out.push(text.bold);
                out.push(String(numb.symb));
                out.push(text.none);
                out.push(" other type");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(" at ");
                out.push(text.red);
                out.push(text.bold);
                out.push(apps.commas(numb.size));
                out.push(text.none);
                out.push(" bytes.");
                console.log(out.join(""));
                console.log(`Removed ${text.cyan + filepath + text.nocolor}`);
                console.log("");
            }
            callback();
        };
        util.destroy  = function node_apps_remove_destroy(item:string, dir:string):void {
            node
                .fs
                .unlink(item, function node_apps_remove_destroy_callback(er:Error):void {
                    if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                        apps.errout(er);
                        return;
                    }
                    if (item === dir) {
                        util.complete();
                    }
                    dirs[dir] = dirs[dir] - 1;
                    if (dirs[dir] < 1) {
                        util.rmdir(dir);
                    }
                });
        };
        util.readdir  = function node_apps_remove_readdir(item:string):void {
            node
                .fs
                .readdir(item, function node_apps_remove_readdir_callback(er:Error, files:string[]):void {
                    if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                        apps.errout(er);
                        return;
                    }
                    dirs[item] = 0;
                    if (files === undefined || files.length < 1) {
                        util.rmdir(item);
                    } else {
                        files.forEach(function node_apps_remove_readdir_callback_each(value) {
                            dirs[item] = dirs[item] + 1;
                            util.stat(item + node.path.sep + value, item);
                        });
                    }
                });
        };
        util.rmdir    = function node_apps_remove_rmdir(item:string):void {
            node
                .fs
                .rmdir(item, function node_apps_remove_delete_callback_rmdir(er:Error):void {
                    const dirlist:string[] = item.split(node.path.sep);
                    let dir:string     = "";
                    if (er !== null && er.toString().indexOf("resource busy or locked") > 0) {
                        setTimeout(function node_apps_remove_rmdir_delay() {
                            node_apps_remove_rmdir(item);
                        }, 1000);
                        return;
                    }
                    if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                        apps.errout(er);
                        return;
                    }
                    delete dirs[item];
                    if (Object.keys(dirs).length < 1) {
                        util.complete();
                    } else {
                        dirlist.pop();
                        dir       = dirlist.join(node.path.sep);
                        dirs[dir] = dirs[dir] - 1;
                        if (dirs[dir] < 1) {
                            node_apps_remove_rmdir(dir);
                        }
                    }
                });
        };
        util.stat     = function node_apps_remove_stat(item:string, dir:string):void {
            node
                .fs
                .lstat(item, function node_apps_remove_stat_callback(er:Error, stats:Stats) {
                    if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                        apps.errout(er);
                        return;
                    }
                    if (stats !== undefined && stats.isFile !== undefined) {
                        if (stats.isDirectory() === true) {
                            numb.dirs = numb.dirs + 1;
                            util.readdir(item);
                        } else {
                            if (stats.isFile() === true) {
                                numb.file = numb.file + 1;
                                numb.size = numb.size + stats.size;
                            } else if (stats.isSymbolicLink() === true) {
                                numb.symb = numb.symb + 1;
                            } else {
                                numb.othr = numb.othr + 1;
                            }
                            util.destroy(item, dir);
                        }
                    } else if (item === dir) {
                        if (command === "remove") {
                            console.log("Item not found - " + text.cyan + filepath + text.nocolor);
                        }
                        callback();
                    }
                });
        };
        if (command === "remove") {
            if (process.argv.length < 1) {
                apps.errout("Command remove requires a filepath");
                return;
            }
            filepath = node.path.resolve(process.argv[0]);
            callback = function node_apps_remove_callback() {
                return;
            };
        }
        util.stat(filepath, filepath);
    };
    apps.version = function node_apps_version():void {
        console.log("");
        console.log(`Pretty Diff version ${text.red + text.bold + version.number + text.none} dated ${text.cyan + version.date + text.none}`);
        apps.humantime(true);
    };

    // if commands[list[0]] !== undefined then assign the command
    // here create the functions to execute the commands
        // checklist of verified commands:
        // * build
        // * commands
        // * copy
        // * get
        // * hash
        // * help - think of better content
        // * options
        // * remove
        // * version
        //
        // remaining
        // * analysis - mode
        // * beautify - mode
        // * diff - mode
        // * minify - mode
        // * parse - mode
        // * validation
}());
