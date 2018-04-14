import { Stats } from "fs";
import * as http from "http";
import { Stream, Writable } from "stream";
import { Hash } from "crypto";
import { Http2Stream, Http2Session } from "http2";
/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */

//things to test
//hash get
//get save to file
//get save to file again (same file name already present)
(function node():void {
    "use strict";
    const startTime:[number, number]      = process.hrtime(),
        node = {
            child : require("child_process").exec,
            crypto: require("crypto"),
            fs    : require("fs"),
            http  : require("http"),
            https : require("https"),
            os    : require("os"),
            path  : require("path")
        },
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
        libFiles:string[] = [api, `${js}beautify`, `${js}minify`],
        // node option default start
        options:any = {},
        version:any = {},
        // node option default end
        text:any     = {
            angry    : "\u001b[1m\u001b[31m",
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
        prettydiff:any = {},
        commands:commandList = {
            //analysis: {
            //    description: "Perform Pretty Diff's code analysis operation.",
            //    example: [{
            //        code: "",
            //        defined: "Performs Pretty Diff's code analysis operation."
            //    }]
            //},
            beautify: {
                description: "Perform Pretty Diff's code beautification.",
                example: [
                    {
                        code: "prettydiff beautify my/path/toFile.xml",
                        defined: "Performs Pretty Diff's beautify operation."
                    },
                    {
                        code: "prettydiff beautify http://example.com/webThing.xml",
                        defined: "Performs a HTTP get operation for URI values and then beautifies the specified resource."
                    }
                ]
            },
            build: {
                description: "Rebuilds the application.",
                example: [
                    {
                        code: "prettydiff build",
                        defined: "Compiles from TypeScript into JavaScript, compiles libraries, and lints the code."
                    },
                    {
                        code: "prettydiff build nolint",
                        defined: "Runs the build without running any of the sanity checks."
                    }
                ]
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
                example: [
                    {
                        code: "prettydiff diff firstFile.xml secondFile.xml",
                        defined: "Performs Pretty Diff's diff operation against the specified locations."
                    },
                    {
                        code: "prettydiff diff firstDirectory secondDirectory",
                        defined: "Performs Pretty Diff's diff operation against the files in the specified directories. The two locations must be of the same file system type or Pretty Diff will give you an error."
                    }
                ]
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
                description: "Generate a SHA512 hash of a file or a string.",
                example: [
                    {
                        code: "prettydiff hash path/to/file",
                        defined: "Prints a SHA512 hash to the shell for the specified file in the local file system."
                    },
                    {
                        code: "prettydiff hash verbose path/to/file",
                        defined: "Prints the hash with file path and version data."
                    },
                    {
                        code: "prettydiff hash string \"I love kittens.\"",
                        defined: "Hash an arbitrary string directly from shell input."
                    },
                    {
                        code: "prettydiff hash http://prettydiff.com/",
                        defined: "Hash a resource from the web."
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
            lint: {
                description: "Use ESLint against all JavaScript files in a specified directory tree.",
                example: [
                    {
                        code: "prettydiff lint ../tools",
                        defined: "Lints all the JavaScript files in that location and in its subdirectories."
                    },
                    {
                        code: "prettydiff lint",
                        defined: "Specifying no location defaults to the Pretty Diff application directory."
                    },
                    {
                        code: "prettydiff lint ../tools ignore [node_modules, .git, test, units]",
                        defined: "An ignore list is also accepted if there is a list wrapped in square braces following the word 'ignore'."
                    }
                ]
            },
            minify: {
                description: "Remove all unnecessary white space and comments from code.",
                example: [
                    {
                        code: "prettydiff minify my/file/path/file.js",
                        defined: "Performs Pretty Diff's minify operation."
                    },
                    {
                        code: "prettydiff minify my/file/path/directory",
                        defined: "Performs Pretty Diff's minify operation against all files in the directory."
                    },
                    {
                        code: "prettydiff minify http://example.com/webThing.xml",
                        defined: "Performs a HTTP get operation for URI values and then minifies the specified resource."
                    }
                ]
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
                    },
                    {
                        code: "prettydiff options api:any lexer:script values",
                        defined: "The option list can be queried against key and value (if present) names. This example will return only options that work with the script lexer, takes specific values, and aren't limited to a certain API environment."
                    }
                ]
            },
            parse: {
                description: "Generate a parse table of a code sample.",
                example: [
                    {
                        code: "prettydiff parse my/file/path.js",
                        defined: "Returns the parse table for the specified resource."
                    },
                    {
                        code: "prettydiff parse http://example.com/webThing.xml",
                        defined: "Performs a HTTP get operation for URI values and then returns the parse table for the specified resource."
                    }
                ]
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
            server: {
                description: "Launches a HTTP service and web sockets so that the web tool is automatically refreshed once code changes in the local file system.",
                example: [
                    {
                        code: "prettydiff server",
                        defined: "Launches the server on default port 9001 and web sockets on port 9002."
                    },
                    {
                        code: "prettydiff server 8080",
                        defined: "If a numeric argument is supplied the web server starts on the port specified and web sockets on the following port."
                    }
                ]
            },
            simulation: {
                description: "Launches a test runner to execute the various commands of the services file.",
                example: [{
                    code: "prettydiff simulation",
                    defined: "Runs tests against the commands offered by the services file."
                }]
            },
            validation: {
                description: "Runs Pretty Diff against various code samples and compares the generated output against known good output looking for regression errors.",
                example: [{
                    code: "prettydiff validation",
                    defined: "Runs the unit test runner against Pretty Diff"
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
                a:number = 1,
                mode:string = "";
            if (process.argv[2] === undefined) {
                console.log("");
                console.log("Pretty Diff requires a command. Try:");
                console.log(`global install - ${text.cyan}prettydiff help${text.none}`);
                console.log(`local install  - ${text.cyan}node js/services help${text.none}`);
                console.log("");
                console.log("To see a list of commands try:");
                console.log(`global install - ${text.cyan}prettydiff commands${text.none}`);
                console.log(`local install  - ${text.cyan}node js/services commands${text.none}`);
                console.log("");
                process.exit(1);
                return;
            }
            const arg:string = process.argv[2],
                boldarg:string = text.angry + arg + text.none,
                len:number = arg.length,
                commandFilter = function node_command_commandFilter(item:string):boolean {
                    if (item.indexOf(arg.slice(0, a)) === 0) {
                        return true;
                    }
                    return false;
                },
                modeval = function node_command_modeval():boolean {
                    let a:number = 0;
                    const len:number = process.argv.length;
                    do {
                        if (process.argv[a].indexOf("mode") === 0) {
                            if (process.argv[a].indexOf("analysis") > 0) {
                                mode = "analysis";
                            } else if (process.argv[a].indexOf("beautify") > 0) {
                                mode = "beautify";
                            } else if (process.argv[a].indexOf("diff") > 0) {
                                mode = "diff";
                            } else if (process.argv[a].indexOf("minify") > 0) {
                                mode = "minify";
                            } else if (process.argv[a].indexOf("parse") > 0) {
                                mode = "parse";
                            } else {
                                return false;
                            }
                            console.log("");
                            console.log(`${boldarg} is not a supported command. Pretty Diff is assuming command ${text.bold + text.cyan + mode + text.none}.`);
                            console.log("");
                            return true;
                        }
                        a = a + 1;
                    } while (a < len);
                    return false;
                };
            process.argv = process.argv.slice(3);
            do {
                filtered = comkeys.filter(commandFilter);
                a = a + 1;
            } while (filtered.length > 1 && a < len);
            if (filtered.length < 1) {
                if (modeval() === true) {
                    return mode;
                }
                console.log(`Command ${boldarg} is not a supported command.`);
                process.exit(1);
                return "";
            }
            if (filtered.length > 1) {
                if (modeval() === true) {
                    return mode;
                }
                console.log(`Command '${boldarg}' is ambiguous as it could refer to any of: [${text.cyan + filtered.join(", ") + text.none}]`);
                process.exit(1);
                return "";
            }
            if (arg !== filtered[0]) {
                console.log("");
                console.log(`${boldarg} is not a supported command. Pretty Diff is assuming command ${text.bold + text.cyan + filtered[0] + text.none}.`);
                console.log("");
            }
            return filtered[0];
        }()),
        apps:any = {};
    let verbose:boolean = false;
    
    (function node_args():void {
        const requireDir = function node_args_requireDir(dirName:string):void {
                let counts = {
                    items: 0,
                    total: 0
                };
                const dirlist:string[] = dirName.split(sep),
                    dirname:string = (dirlist[dirlist.length - 1] === "")
                        ? dirlist[dirlist.length - 2]
                        : dirlist[dirlist.length - 1],
                    completeTest = function node_args_requireDir_completeTest(filesLength:number):boolean {
                        counts.total = counts.total + filesLength;
                        if (counts.total === counts.items) {
                            dirs = dirs + 1;
                            if (dirs === dirstotal) {
                                if (process.argv.length > 0) {
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
                                apps.errout([err.toString()]);
                                return;
                            }
                            if (completeTest(files.length) === true) {
                                return;
                            }
                            files.forEach(function node_args_requireDir_dirwrapper_readdir_each(value:string) {
                                const valpath:string = start + sep + value;
                                node.fs.stat(valpath, function node_args_requireDir_dirwrapper_readdir_each_stat(errs:Error, stats:Stats):void {
                                    if (errs !== null) {
                                        apps.errout([errs.toString()]);
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
                prettydiff[dirname] = {};
                dirstotal = dirstotal + 1;
                readdir(dirName);
            },
            readOptions = function node_args_readOptions():void {
                const list:string[] = process.argv,
                    def = prettydiff.api.optionDef,
                    keys:string[] = (command === "options")
                        ? Object.keys(def.mode)
                        : [],
                    obj = (command === "options")
                        ? def.mode
                        : options,
                    optionName = function node_args_optionName(bindArgument:boolean):void {
                        if (a === 0 || options[list[a]] === undefined) {
                            if (keys.indexOf(list[a]) < 0 && options[list[a]] === undefined) {
                                list.splice(a, 1);
                                len = len - 1;
                                a = a - 1;
                            }
                            return;
                        }
                        if (bindArgument === true) {
                            if (list[a + 1] !== undefined && list[a + 1].length > 0) {
                                list[a] = `${list[a]}:${list[a + 1]}`;
                                list.splice(a + 1, 1);
                                len = len - 1;
                            } else {
                                list[a] = list[a];
                            }
                        }
                        list.splice(0, 0, list[a]);
                        list.splice(a + 1, 1);
                    };
                let split:string = "",
                    value:string = "",
                    name:string = "",
                    a:number = 0,
                    si:number = 0,
                    len:number = list.length;
                do {
                    list[a] = list[a].replace(/^(-+)/, "");
                    if (list[a] === "verbose") {
                        verbose = true;
                        list.splice(a, 1);
                        len = len - 1;
                        a = a - 1;
                    } else {
                        si = list[a].indexOf("=");
                        if (
                            si > 0 &&
                            (list[a].indexOf("\"") < 0 || si < list[a].indexOf("\"")) &&
                            (list[a].indexOf("'") < 0 || si < list[a].indexOf("'")) &&
                            (si < list[a].indexOf(":") || list[a].indexOf(":") < 0)
                        ) {
                            split = "=";
                        } else {
                            split = ":";
                        }
                        if (list[a + 1] === undefined) {
                            si = 99;
                        } else {
                            si = list[a + 1].indexOf(split);
                        }
                        if (
                            obj[list[a]] !== undefined &&
                            list[a + 1] !== undefined &&
                            obj[list[a + 1]] === undefined &&
                            (
                                si < 0 || 
                                (si > list[a + 1].indexOf("\"") && list[a + 1].indexOf("\"") > -1) ||
                                (si > list[a + 1].indexOf("'") && list[a + 1].indexOf("'") > -1)
                            )
                        ) {
                            if (command === "options") {
                                optionName(true);
                            } else {
                                options[list[a]] = list[a + 1];
                                a = a + 1;
                            }
                        } else if (list[a].indexOf(split) > 0 || (list[a].indexOf(split) < 0 && list[a + 1] !== undefined && (list[a + 1].charAt(0) === ":" || list[a + 1].charAt(0) === "="))) {
                            if (list[a].indexOf(split) > 0) {
                                name = list[a].slice(0, list[a].indexOf(split));
                                value = list[a].slice(list[a].indexOf(split) + 1);
                            } else {
                                name = list[a];
                                value = list[a + 1].slice(1);
                                list.splice(a + 1, 1);
                                len = len - 1;
                            }
                            if (command === "options") {
                                if (keys.indexOf(name) > -1) {
                                    if (value !== undefined && value.length > 0) {
                                        list[a] = `${name}:${value}`;
                                    } else {
                                        list[a] = name;
                                    }
                                } else {
                                    list.splice(a, 1);
                                    len = len - 1;
                                }
                            } else if (options[name] !== undefined) {
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
                        } else if (command === "options") {
                            optionName(false);
                        }
                    }
                    a = a + 1;
                } while (a < len);
            };
        let dirs:number = 0,
            dirstotal:number = 0;
        options.binaryCheck = (
            // eslint-disable-next-line
            /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
        );
        options.lexerOptions = {};
        global.prettydiff = prettydiff;
        libFiles.forEach(function node_args_each(value:string) {
            requireDir(value);
        });
    }());
    // mode analysis wrapper, see apps.mode
    //apps.analysis = function node_apps_analysis():void {
    //    options.mode = "analysis";
    //    apps.mode();
    //};
    // mode beautify wrapper, see apps.mode
    apps.beautify = function node_apps_beautify():void {
        options.mode = "beautify";
        apps.mode();
    };
    // build system
    apps.build = function node_apps_build():void {
        let firstOrder:boolean = true;
        const order = [
                "npminstall",
                "language",
                "typescript",
                "libraries",
                "lint"
            ],
            orderlen:number = order.length,
            heading = function node_apps_build_heading(message:string):void {
                if (firstOrder === true) {
                    console.log("");
                    firstOrder = false;
                } else if (order.length < orderlen) {
                    console.log("________________________________________________________________________");
                    console.log("");
                }
                console.log(text.cyan + message + text.none);
                console.log("");
            },
            next = function node_apps_build_next():void {
                let phase = order[0];
                if (order.length < 1) {
                    verbose = true;
                    heading("All tasks complete... Exiting clean!");
                    apps.output([""]);
                    process.exit(0);
                    return;
                }
                order.splice(0, 1);
                phases[phase]();
            },
            phases = {
                language: function node_apps_build_language():void {
                    heading("Sourcing Language File");
                    node.fs.readFile(`${projectPath}node_modules${sep}parse-framework${sep}language.ts`, "utf8", function node_args_language(err:Error, fileData:string) {
                        if (err !== null) {
                            console.log(err.toString());
                            return;
                        }
                        fileData = fileData.replace("global.parseFramework.language", "global.prettydiff.api.language");
                        node.fs.writeFile(`api${sep}language.ts`, fileData, function node_args_language_write(errw:Error) {
                            if (errw !== null) {
                                console.log(errw.toString());
                                return;
                            }
                            console.log(`${apps.humantime(false) + text.green}Language dependency file sourced from parse-framework.${text.none}`);
                            next();
                        });
                    });
                },
                libraries: function node_apps_build_libraries():void {
                    let domlibs:string = "";
                    const flag = {
                            documentation: false,
                            dom: false,
                            html: false,
                            node: false
                        },
                        optkeys:string[] = Object.keys(prettydiff.api.optionDef),
                        keyslen:number = optkeys.length,
                        versionData = {
                            number: "",
                            date: ""
                        },
                        modifyFile = function node_apps_build_libraries_modifyFile(file:string, fileFlag:string):void {
                            node.fs.readFile(file, "utf8", function node_apps_build_libraries_modifyFile(err:Error, data:string):void {
                                const modify = function node_apps_build_libraries_modifyFile_modify(ops:modifyOps):void {
                                        const start:number = (function node_apps_build_libraries_modifyFile_modify_startBuild():number {
                                                const len = (ops.start.indexOf("//") === 0)
                                                    ? (function node_apps_build_libraries_modifyFile_modify_startBuild_lineStart():number {
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
                                    buildDefaults = function node_apps_build_libraries_modifyFile_buildDefault(api:"dom"|"node"):string {
                                        const obj:any = {},
                                            verse:string = (api === "node")
                                                ? `version=${JSON.stringify(versionData)},`
                                                : "";
                                        let a:number = 0,
                                            apikey = "";
                                        do {
                                            apikey = prettydiff.api.optionDef[optkeys[a]].api;
                                            if (apikey === "any" || apikey === api) {
                                                obj[optkeys[a]] = prettydiff.api.optionDef[optkeys[a]].default;
                                            }
                                            a = a + 1;
                                        } while (a < keyslen);
                                        return `options=${JSON.stringify(obj)},${verse}`;
                                    },
                                    buildDocumentation = function node_apps_build_libraries_modifyFile_buildDocumentation():string {
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
                                            opt = prettydiff.api.optionDef[optName];
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
                                    buildDomInterface = function node_apps_build_libraries_modifyFile_buildDomInterface():string {
                                        const allItems:string[] = [],
                                            exclusions = {
                                                "diff": "",
                                                "difflabel": "",
                                                "mode": "",
                                                "source": "",
                                                "sourcelabel": ""
                                            };
                                        let a:number = 0,
                                            b:number = 0,
                                            item:string[],
                                            optName:string,
                                            opt:option,
                                            vals:string[],
                                            vallen:number,
                                            select:boolean = false;
                                        do {
                                            optName = optkeys[a];
                                            opt = prettydiff.api.optionDef[optName];
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
                                                    select = false;
                                                } else {
                                                    item.push(`<label for="option-${optName}" class="label">${opt.label}`);
                                                    item.push(` <a class="apiname" href="documentation.xhtml#${optName}">(${optName})</a>`);
                                                    item.push(`</label>`);
                                                    if (opt.type === "number" || (opt.type === "string" && opt.values === undefined)) {
                                                        item.push(`<input type="text" id="option-${optName}" value="${opt.default}" data-type="${opt.type}"/>`);
                                                        select = false;
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
                                                        select = true;
                                                    }
                                                }
                                                item.push(`<p class="option-description">${opt.definition.replace(/"/g, "&quot;")}`);
                                                if (select === true) {
                                                    item.push(` <span><strong>${opt.default}</strong> &mdash; ${opt.values[String(opt.default)]}</span>`);
                                                }
                                                item.push("</p>");
                                                item.push(`<div class="disabled" style="display:none"></div>`);
                                                item.push(`</li>`);
                                                allItems.push(item.join(""));
                                            }
                                            a = a + 1;
                                        } while (a < keyslen);
                                        return allItems.join("");
                                    };
                                if (err !== null && err.toString() !== "") {
                                    apps.errout([err.toString()]);
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
                                        injectFlag: domlibs
                                            .replace(/\/\*global prettydiff\*\//g, "")
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
                                node.fs.writeFile(file, data, function node_apps_build_libraries_documentation_write(errw:Error) {
                                    if (errw !== null && errw.toString() !== "") {
                                        apps.errout([errw.toString()]);
                                        return;
                                    }
                                    flag[fileFlag] = true;
                                    if (flag.documentation === true && flag.dom === true && flag.html === true && flag.node === true) {
                                        console.log(`${apps.humantime(false) + text.green}Option details written to files.${text.none}`);
                                        next();
                                    }
                                });
                            });
                        },
                        version = function node_apps_build_libraries_version(file:string, fileFlag:string):void {
                            if (versionData.number !== "") {
                                modifyFile(file, fileFlag);
                                return;
                            }
                            node.child(`git log -1 --branches`, function node_apps_build_libraries_version_child(err:Error, stderr:string):void {
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                const date:string[] = stderr.slice(stderr.indexOf("Date:") + 12).split(" ");
                                versionData.date = `${date[1]} ${date[0]} ${date[3]}`;
                                node.fs.readFile(`${projectPath}package.json`, "utf8", function node_apps_build_libraries_version_child_readPackage(errp:Error, data:string):void {
                                    if (errp !== null) {
                                        apps.errout([errp.toString()]);
                                        return;
                                    }
                                    versionData.number = JSON.parse(data).version;
                                    modifyFile(file, fileFlag);
                                });
                            })
                        },
                        libraryFiles = function node_apps_build_libraries_libraryFiles(callback:Function) {
                            libFiles.push(`${projectPath}node_modules${sep}file-saver${sep}FileSaver.min.js`);
                            const appendFile = function node_apps_build_libraries_libraryFiles_appendFile(filePath:string):void {
                                    node.fs.readFile(filePath, "utf8", function node_apps_build_libraries_libraryFiles_appendFile_read(errr:Error, filedata:string):void {
                                        if (errr !== null) {
                                            apps.errout([errr.toString()]);
                                            return;
                                        }
                                        if (filePath.indexOf("FileSaver") > 0) {
                                            filedata = filedata
                                                .replace(/var\s+saveAs\s*=\s*saveAs\s*\|\|\s*function\(/, `// eslint-disable-next-line${node.os.EOL}prettydiff.saveAs=function prettydiff_saveAs(`)
                                                .replace(/[{|}|;|(*/)]\s*var\s/g, function node_apps_build_libraries_libraryFiles_appendFile_read_saveAsFix(str:string):string {
                                                return str.replace("var", "let");
                                            });
                                        } else {
                                            filedata = filedata
                                                .replace(/\/\*global\s+global(,\s*prettydiff)?\s*\*\//, "")
                                                .replace("global.prettydiff.", "prettydiff.");
                                        }
                                        domlibs = domlibs + filedata;
                                        a = a + 1;
                                        if (a === filelen) {
                                            callback();
                                        }
                                    });
                                },
                                stat = function node_apps_build_libraries_libraryFiles_stat(pathitem:string) {
                                    node.fs.stat(pathitem, function node_apps_build_libraries_libraryFiles_stat_callback(errs:Error, stats:Stats):void {
                                        if (errs !== null) {
                                            apps.errout([errs.toString()]);
                                            return;
                                        }
                                        if (stats.isDirectory() === true) {
                                            node.fs.readdir(pathitem, "utf8", function node_apps_build_libraries_libraryFiles_stat_callback_readdir(errd:Error, filelist:string[]):void {
                                                if (errd !== null) {
                                                    apps.errout([errd.toString()]);
                                                    return;
                                                }
                                                const dirnames:string[] = pathitem.split(sep).filter(dirs => dirs !== ""),
                                                    groupname:string = dirnames[dirnames.length - 1];
                                                domlibs = domlibs + `prettydiff.${groupname}={};`;
                                                filelen = filelen + (filelist.length - 1);
                                                filelist.forEach(function node_apps_build_libraries_libraryFiles_stat_callback_readdir_each(value:string):void {
                                                    node_apps_build_libraries_libraryFiles_stat(pathitem + sep + value);
                                                });
                                            });
                                        } else if (stats.isFile() === true) {
                                            appendFile(pathitem);
                                        }
                                    });
                                };
                            let a:number = 0,
                                filelen: number = libFiles.length;
                            libFiles.forEach(function node_apps_build_libraries_libraryFiles_each(value:string) {
                                stat(value);
                            });
                        };
                    heading("Building Options");
                    libraryFiles(function node_apps_build_libraries_libraryCallback() {
                        modifyFile(`${js}dom.js`, "dom");
                        version(`${js}services.js`, "node");
                    });
                    version(`${projectPath}index.xhtml`, "html");
                    modifyFile(`${projectPath}documentation.xhtml`, "documentation");
                },
                lint     : function node_apps_build_lint():void {
                    heading("Linting");
                    apps.lint(next);
                },
                npminstall: function node_apps_build_npminstall():void {
                    heading("First Time Developer Dependency Installation");
                    node.fs.stat(`${projectPath}node_modules${sep}ace-builds`, function node_apps_build_npminstall_stat(errs:Error):void {
                        if (errs !== null) {
                            if (errs.toString().indexOf("no such file or directory") > 0) {
                                node.child("npm install", {
                                    cwd: projectPath
                                }, function node_apps_build_npminstall_stat_child(err:Error, stdout:string, stderr:string) {
                                    if (err !== null) {
                                        apps.errout([err.toString()]);
                                        return;
                                    }
                                    if (stderr !== "") {
                                        apps.errout([stderr]);
                                        return;
                                    }
                                    console.log(`${apps.humantime(false) + text.green}Installed dependencies.${text.none}`);
                                    next();
                                });
                            } else {
                                apps.errout([errs.toString()]);
                                return;
                            }
                        } else {
                            console.log(`${apps.humantime(false) + text.green}Dependencies appear to be already installed...${text.none}`);
                            next();
                        }
                    });
                },
                typescript: function node_apps_build_typescript():void {
                    const flag = {
                            services: false,
                            typescript: false
                        },
                        ts = function node_apps_build_typescript_ts() {
                            node.child("tsc --pretty", {
                                cwd: projectPath
                            }, function node_apps_build_typescript_callback(err:Error, stdout:string, stderr:string):void {
                                if (stdout !== "" && stdout.indexOf(` \u001b[91merror${text.none} `) > -1) {
                                    console.log(`${text.red}TypeScript reported warnings.${text.none}`);
                                    apps.errout([stdout]);
                                    return;
                                }
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (stderr !== null && stderr !== "") {
                                    apps.errout([stderr]);
                                    return;
                                }
                                console.log(`${apps.humantime(false) + text.green}TypeScript build completed without warnings.${text.none}`);
                                next();
                            });
                        };
                    heading("TypeScript Compilation");
                    node.fs.stat(`${projectPath}services.ts`, function node_apps_build_typescript_services(err:Error) {
                        if (err !== null) {
                            if (err.toString().indexOf("no such file or directory") > 0) {
                                console.log(`${apps.humantime(false) + text.angry}TypeScript code files not present.${text.none}`);
                                flag.services = true;
                                if (flag.typescript === true) {
                                    next();
                                }
                            } else {
                                apps.errout([err]);
                                return;
                            }
                        } else {
                            flag.services = true;
                            if (flag.typescript === true) {
                                ts();
                            }
                        }
                    });
                    node.child("tsc --version", function node_apps_build_typescript_tsc(err:Error, stdout:string, stderr:string) {
                        if (err !== null) {
                            const str = err.toString();
                            if (str.indexOf("command not found") > 0 || str.indexOf("is not recognized") > 0) {
                                console.log(`${apps.humantime(false) + text.angry}TypeScript does not appear to be installed.`);
                                console.log(`Install TypeScript with this command: ${text.green}npm install typescript -g${text.none}`);
                                flag.typescript = true;
                                if (flag.services === true) {
                                    next();
                                }
                            } else {
                                apps.errout([err]);
                            }
                        } else {
                            if (stderr !== "") {
                                apps.errout([stderr]);
                                return;
                            }
                            flag.typescript = true;
                            if (flag.services === true) {
                                ts();
                            }
                        }
                    });
                }
            };
        if (process.argv.indexOf("nolint") > -1) {
            order.splice(order.indexOf("lint"), 1);
        }
        next();
    };
    // CLI commands documentation generator
    apps.commands = function node_apps_commands():void {
        const output:string[] = [];
        verbose = true;
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
            output.push(`${text.bold + text.underline}Pretty Diff - Command: ${text.green + process.argv[0] + text.none}`);
            output.push("");
            output.push(comm.description);
            output.push("");
            output.push(`${text.underline}Example${plural + text.none}`);
            do {
                apps.wrapit(output, comm.example[a].defined);
                output.push(`   ${text.cyan + comm.example[a].code + text.none}`);
                output.push("");
                a = a + 1;
            } while (a < len);
            apps.output(output);
        }
    };
    // converts numbers into a string of comma separated triplets
    apps.commas = function node_apps_commas(number:number):string {
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
    // bit-by-bit copy stream for the file system
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
            const filename:string[] = target.split(sep);
            apps.remove(
                destination + sep + filename[filename.length - 1],
                function node_apps_copy_eout_remove() {
                    apps.errout([er.toString()]);
                }
            );
        };
        util.dir      = function node_apps_copy_dir(item:string):void {
            node
                .fs
                .readdir(item, function node_apps_copy_dir_makedir_readdir(er:Error, files:string[]):void {
                    const place:string = (item === start)
                        ? dest
                        : dest + item.replace(start + sep, "");
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
                                dirs[item + sep + files[b]] = true;
                                b                                     = b + 1;
                            } while (b < a);
                            b = 0;
                            do {
                                util.stat(item + sep + files[b], item);
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
                        .split(sep)
                        .pop()
                    : dest + item.replace(start + sep, ""),
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
                    const filename:string[] = item.split(sep);
                    node
                        .fs
                        .utimes(
                            dest + sep + filename[filename.length - 1],
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
                                    .split(sep)
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
                    if (item.replace(start + sep, "") === params.exclusions[a]) {
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
                apps.errout([
                    "The copy command requires a source path and a destination path.",
                    `Please execute ${text.cyan}prettydiff commands copy${text.none} for examples.`
                ]);
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
                    verbose = true;
                    apps.output([out.join(""), `Copied ${text.cyan + target + text.nocolor} to ${text.green + destination + text.nocolor}`]);
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
                destination: process.argv[1].replace(/(\\|\/)/g, sep),
                target: process.argv[0].replace(/(\\|\/)/g, sep)
            };
            console.log(params.exclusions);
        }
        target =  params.target.replace(/(\\|\/)/g, sep);
        destination = params.destination.replace(/(\\|\/)/g, sep);
        exlen = params.exclusions.length;
        dest          = node.path.resolve(destination) + sep;
        start         = node.path.resolve(target);
        util.stat(start, start);
    };
    // mode diff wrapper, see apps.mode
    apps.diff = function node_apps_diff():void {
        if (options.diff === "" || options.source === "") {
            apps.errout([
                "Pretty Diff requires option diff when using command diff. Example:",
                `${text.cyan}prettydiff diff source:"myFile.js" diff:"myFile1.js"${text.none}`
            ]);
            return;
        }
        options.mode = "diff";
        apps.mode();
    };
    // uniform error formatting
    apps.errout = function node_apps_errout(errtext:string[]):void {
        const stack:string = new Error().stack.replace("Error", `${text.cyan}Stack trace${text.none + node.os.EOL}-----------`);
        console.log("");
        console.log(stack);
        console.log("");
        console.log(`${text.angry}Error Message${text.none}`);
        console.log("------------");
        if (errtext[0] === "" && errtext.length < 2) {
            console.log(`${text.yellow}No error message supplied${text.none}`);
        } else {
            errtext.forEach(function node_apps_errout_each(value:string):void {
                console.log(value);
            });
        }
        console.log("");
        process.exit(1);
    };
    // http(s) get function
    apps.get = function node_apps_get(address:string, flag:"source"|"diff", callback:Function|null):void {
        let file:string = "";
        const scheme:string = (address.indexOf("https") === 0)
                ? "https"
                : "http",
            getcall = function node_apps_getFile_callback(file:string|Blob) {
                const addy:string = (command === "hash")
                    ? process.argv[0]
                    : process.argv[1];
                if (addy !== undefined) {
                    const dirs:string[] = addy.split("/"),
                        statWrapper = function node_apps_getFile_callback_fileName_statWrapper() {
                            node.fs.stat(process.cwd() + name, function node_apps_getFile_callback_fileName_statWrapper_stat(ers:Error) {
                                if (ers !== null) {
                                    if (ers.toString().indexOf("no such file or directory")) {
                                        node.fs.writeFile(name, file, "utf8", function node_apps_getFile_callback_write(err:Error) {
                                            if (err !== null) {
                                                apps.errout([err.toString()]);
                                                return;
                                            }
                                            if (command === "hash") {
                                                callback(process.cwd() + sep + name);
                                            } else {
                                                apps.output([`File ${text.cyan + name + text.none} written with ${apps.commas(file.toString().length)} characters.`]);
                                            }
                                        });
                                    } else {
                                        apps.errout([ers.toString()]);
                                    }
                                } else {
                                    if (name.indexOf(".") < 0) {
                                        name = `${name}0.txt`;
                                    } else {
                                        const names:string[] = name.split(".");
                                        names[names.length - 2] = names[names.length - 2].replace(/\d+$/, inc.toString());
                                        inc = inc + 1;
                                        node_apps_getFile_callback_fileName_statWrapper();
                                    }
                                }
                            });
                        };
                    let name:string = (dirs.length < 4 || dirs[dirs.length - 1] === "")
                            ? "get.txt"
                            : dirs[dirs.length - 1],
                        inc:number = 0;
                    statWrapper();
                } else {
                    apps.output([file.toString()]);
                }
            };
        if (command === "get") {
            verbose = true;
            address = process.argv[0];
        }
        if (address === undefined) {
            apps.errout([
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan}prettydiff commands get${text.none} for examples.`
            ]);
            return;
        }
        if ((/^(https?:\/\/)/).test(address) === false) {
            apps.errout([
                `Address: ${text.angry + address + text.none}`,
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan}prettydiff commands get${text.none} for examples.`
            ]);
            return;
        }
        node[scheme].get(address, function node_apps_get_callback(res:http.IncomingMessage) {
            res.on("data", function node_apps_get_callback_data(chunk:string):void {
                file = file + chunk;
            });
            res.on("end", function node_apps_get_callback_end() {
                if (res.statusCode !== 200) {
                    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
                        console.log(`${res.statusCode} ${node.http.STATUS_CODES[res.statusCode]}, for request ${address}`);
                        process.argv[0] = res.headers.location;
                        address = process.argv[0];
                        apps.get(address, flag, callback);
                    } else {
                        apps.errout([`${scheme}.get failed with status code ${res.statusCode}`]);
                    }
                } else {
                    if (command === "get" || command === "hash") {
                        getcall(file);
                    } else if (callback !== null) {
                        callback(file);
                    }
                }
            });
        });
    };
    // hash utility for strings or files
    apps.hash = function node_apps_hash(filepath:string):void {
        const http:RegExp = (/^https?:\/\//),
            hash:Hash = node
                .crypto
                .createHash("sha512"),
            statWrapper = function node_apps_hash_wrapper(path:string) {
                node
                .fs
                .stat(path, function node_apps_hash_wrapper_stat(er:Error, stat:Stats):void {
                    if (er !== null) {
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            apps.errout([`filepath ${path} is not a file.`]);
                            return;
                        }
                        apps.errout([er.toString()]);
                        return;
                    }
                    if (stat === undefined || stat.isFile() === false) {
                        apps.errout([`filepath ${path} is not a file.`]);
                        return;
                    }
                    node
                        .fs
                        .open(path, "r", function node_apps_hash_wrapper_stat_open(ero:Error, fd:number):void {
                            const msize = (stat.size < 100)
                                    ? stat.size
                                    : 100;
                            let buff  = new Buffer(msize);
                            if (ero !== null) {
                                apps.errout([ero.toString()]);
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
                                    function node_apps_hash_wrapper_stat_open_read(erra:Error, bytesa:number, buffera:Buffer):number {
                                        const hashit = function node_apps_hash_wrapper_stat_open_read(item:string|Buffer) {
                                            hash.on("readable", function node_apps_hash_wrapper_stat_open_read_readFile_hash():void {
                                                const hashdata = <Buffer>hash.read();
                                                if (hashdata !== null) {
                                                    hashstring = hashdata.toString("hex").replace(/\s+/g, "");
                                                    if (verbose === true) {
                                                        apps.output(hashstring, [
                                                            `Pretty Diff hashed ${text.cyan + path + text.none}`,
                                                            hashstring
                                                        ]);
                                                    } else {
                                                        apps.output([hashstring]);
                                                    }
                                                }
                                            });
                                            hash.write(item);
                                            hash.end();
                                            if (http.test(filepath) === true) {
                                                apps.remove(path, function node_apps_hash_wrapper_stat_open_read_readFile_hash_remove() {
                                                    return true;
                                                });
                                            }
                                        };
                                        let bstring:string = "";
                                        if (erra !== null) {
                                            apps.errout([erra.toString()]);
                                            return;
                                        }
                                        bstring = buffera.toString("utf8", 0, buffera.length);
                                        bstring = bstring.slice(2, bstring.length - 2);
                                        if (options.binaryCheck.test(bstring) === true) {
                                            buff = new Buffer(stat.size);
                                            node
                                                .fs
                                                .read(
                                                    fd,
                                                    buff,
                                                    0,
                                                    stat.size,
                                                    0,
                                                    function node_apps_hash_wrapper_stat_open_read_readBinary(errb:Error, bytesb:number, bufferb:Buffer):void {
                                                        if (errb !== null) {
                                                            apps.errout([errb.toString()]);
                                                            return;
                                                        }
                                                        if (bytesb > 0) {
                                                            hashit(bufferb);
                                                        }
                                                    }
                                                );
                                        } else {
                                            node
                                                .fs
                                                .readFile(path, {
                                                    encoding: "utf8"
                                                }, function node_apps_hash_wrapper_stat_open_read_readFile(errc:Error, dump:string):void {
                                                    if (errc !== null && errc !== undefined) {
                                                        apps.errout([errc.toString()]);
                                                        return;
                                                    }
                                                    hashit(dump);
                                                });
                                        }
                                        return bytesa;
                                    }
                                );
                        });
                });
            };
        let hashstring:string = "";
        if (command === "hash") {
            filepath = process.argv[0];
            if (http.test(filepath) === false) {
                filepath = node.path.resolve(process.argv[0]);
            }
            if (process.argv.indexOf("string") > -1) {
                process.argv.splice(process.argv.indexOf("string"), 1);
                hash.update(process.argv[0]);
                apps.output([hash.digest("hex")]);
                return;
            }
        }
        if (http.test(filepath) === true) {
            apps.get(filepath, "source", statWrapper);
        } else {
            statWrapper(filepath);
        }
    };
    // general static messaging
    apps.help = function node_apps_help():void {
        const output:string[] = [];
        output.push(`${text.bold + text.underline}Pretty Diff${text.none}`);
        output.push("");
        output.push("Pretty Diff is a language aware diff tool.");
        output.push(`To get started try the ${text.green}commands${text.none} command.`);
        output.push("");
        output.push(`${text.cyan}prettydiff commands${text.none}`);
        output.push("");
        output.push("or if not globally installed");
        output.push(`${text.cyan}node js/services commands${text.none}`);
        verbose = true;
        apps.output(output);
    };
    // converting time durations into something people read
    apps.humantime = function node_apps_humantime(finished:boolean):string {
        let minuteString:string = "",
            hourString:string   = "",
            secondString:string = "",
            finalTime:string    = "",
            finalMem:string     = "",
            minutes:number      = 0,
            hours:number        = 0,
            memory,
            elapsed:number      = (function node_apps_humantime_elapsed():number {
                const big:number = 1e9,
                    dtime:[number, number] = process.hrtime(startTime);
                if (dtime[1] === 0) {
                    return dtime[0];
                }
                return dtime[0] + (dtime[1] / big);
            }());
        const numberString = function node_apps_humantime_numberString(numb:number):string {
                const strSplit:string[] = String(numb).split(".");
                if (strSplit[1].length < 9) {
                    do {
                        strSplit[1]  = strSplit[1] + 0;
                    } while (strSplit[1].length < 9);
                    return `${strSplit[0]}.${strSplit[1]}`;
                }
                if (strSplit[1].length > 9) {
                    return `${strSplit[0]}.${strSplit[1].slice(0, 9)}`;
                }
                return `${strSplit[0]}.${strSplit[1]}`;
            },
            prettybytes  = function node_apps_humantime_prettybytes(an_integer:number):string {
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
                    return `${numberString(x) + y}s `;
                }
                return `${numberString(x) + y} `;
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
        secondString = numberString(elapsed);
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
        return `${text.cyan}[${hourString}:${minuteString}:${secondString}]${text.none} `;
    };
    // wrapper for ESLint usage
    apps.lint = function node_apps_lint(callback?:Function):void {
        node.child("eslint", function node_apps_build_lint_eslintCheck(eserr:Error) {
            if (eserr !== null) {
                console.log("ESLint is not globally installed or is corrupt.");
                console.log(`Install ESLint using the command: ${text.green}npm install eslint -g${text.none}`);
                console.log("");
                console.log("Skipping code validation...");
                if (callback !== undefined) {
                    callback();
                }
                return;
            }
            (function node_apps_build_lint_getFiles():void {
                let total:number    = 1,
                    count:number    = 0;
                const files:string[]           = [],
                    lintrun         = function node_apps_build_lint_lintrun() {
                        let filesCount:number = 0;
                        const filesTotal = files.length,
                            lintit = function node_apps_build_lint_lintrun_lintit(val:string):void {
                                node.child(`eslint ${val}`, {
                                    cwd: projectPath
                                }, function node_apps_build_lint_lintrun_lintit_eslint(err:Error, stdout:string, stderr:string) {
                                    if (stdout === "" || stdout.indexOf("0:0  warning  File ignored because of a matching ignore pattern.") > -1) {
                                        if (err !== null) {
                                            apps.errout([err.toString()]);
                                            return;
                                        }
                                        if (stderr !== null && stderr !== "") {
                                            apps.errout([stderr]);
                                            return;
                                        }
                                        filesCount = filesCount + 1;
                                        console.log(`${apps.humantime(false) + text.green}Lint passed:${text.none} ${val}`);
                                        if (filesCount === filesTotal) {
                                            console.log(`${text.green}Lint complete!${text.none}`);
                                            if (callback !== undefined) {
                                                callback();
                                            }
                                            return;
                                        }
                                    } else {
                                        console.log(stdout);
                                        apps.errout(["Lint failure."]);
                                        return;
                                    }
                                })
                            };
                        files.forEach(lintit);
                    },
                    ignoreDirectory:string[] = (function node_apps_build_lint_getFiles_ignoreDirectory():string[] {
                        const defaultList = [
                                ".git",
                                ".vscode",
                                "bin",
                                "coverage",
                                "guide",
                                "ignore",
                                "node_modules",
                                "test"
                            ],
                            igindex:number = process.argv.indexOf("ignore");
                        if (command === "build") {
                            return defaultList;
                        }
                        if (igindex > -1 && process.argv[igindex + 1].charAt(0) === "[") {
                            let str:string = process.argv.join("").replace(/ignore\s+\[/, "ignore["),
                                a:number = 0,
                                len:number = 0,
                                list:string[] = [];
                            str = str.slice(str.indexOf("ignore[") + 7);
                            len = str.length;
                            do {
                                if (str.charAt(a) === "]" && str.charAt(a - 1) !== "\\") {
                                    break;
                                }
                                a = a + 1;
                            } while (a < len);
                            str = str.slice(0, a);
                            list = str.split(",");
                            if (list.length > 0) {
                                return list;
                            }
                        }
                        return defaultList;
                    }()),
                    startDir:string = (command === "lint" && process.argv[0] !== undefined)
                        ? process.argv[0]
                        : js,
                    idLen:number    = ignoreDirectory.length,
                    readDir  = function node_apps_build_lint_getFiles_readDir(filepath:string):void {
                        node.fs.readdir(
                            filepath,
                            function node_apps_build_lint_getFiles_readDir_callback(erra:Error, list:string[]) {
                                const fileEval = function node_apps_build_lint_getFiles_readDir_callback_fileEval(val:string):void {
                                    const filename:string = (filepath.charAt(filepath.length - 1) === sep)
                                        ? filepath + val
                                        : filepath + sep + val;
                                    node.fs.stat(
                                        filename,
                                        function node_apps_build_lint_getFiles_readDir_callback_fileEval_stat(errb:Error, stat:Stats) {
                                            let a:number         = 0,
                                                ignoreDir:boolean = false;
                                            const dirtest:string   = `${filepath.replace(/\\/g, "/")}/${val}`;
                                            if (errb !== null) {
                                                apps.errout([errb.toString()]);
                                                return;
                                            }
                                            count = count + 1;
                                            if (stat.isFile() === true && (/(\.js)$/).test(val) === true) {
                                                files.push(filename);
                                            }
                                            if (stat.isDirectory() === true) {
                                                do {
                                                    if (dirtest.slice(dirtest.lastIndexOf("/") + 1) === ignoreDirectory[a]) {
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
                                                    node_apps_build_lint_getFiles_readDir(filename);
                                                }
                                            } else if (count === total) {
                                                lintrun();
                                            }
                                        }
                                    );
                                };
                                if (erra !== null) {
                                    apps.errout([
                                        `Error reading path: ${filepath}`,
                                        erra.toString()
                                    ]);
                                    return;
                                }
                                total = total + list.length - 1;
                                list.forEach(fileEval);
                            }
                        );
                    };
                readDir(startDir);
            }());
        });
    };
    // CLI string output formatting for lists of items
    apps.lists = function node_apps_lists(lists:nodeLists):void {
        // * lists.emptyline - boolean - if each key should be separated by an empty line
        // * lists.heading   - string  - a text heading to precede the list
        // * lists.obj       - object  - an object to traverse
        // * lists.property  - string  - The child property to read from or "eachkey" to
        // access a directly assigned primitive
        const keys:string[] = Object.keys(lists.obj).sort(),
            output:string[] = [],
            displayKeys = function node_apps_lists_displayKeys(item:string, keylist:string[]):void {
                const len:number = keylist.length;
                let a:number = 0,
                    b:number = 0,
                    c:number = 0,
                    lens:number = 0,
                    comm:string = "";
                if (len < 1) {
                    apps.errout([`Please run the build: ${text.cyan}prettydiff build${text.none}`]);
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
                        apps.wrapit(output, `   ${text.angry}- ${text.none + text.cyan + comm + text.nocolor}: ${lists.obj.values[keylist[b]]}`);
                    } else {
                        // list all items
                        if (lists.property === "eachkey") {
                            if (command === "options" && keylist[b] === "values") {
                                // "values" keyname of options
                                output.push(`${text.angry}* ${text.none + text.cyan + comm + text.nocolor}:`);
                                node_apps_lists_displayKeys(command, Object.keys(lists.obj.values).sort());
                            } else {
                                // all items keys and their primitive value
                                apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.nocolor}: ${lists.obj[keylist[b]]}`);
                            }
                        } else {
                            // a list by key and specified property
                            apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.nocolor}: ${lists.obj[keylist[b]][lists.property]}`);
                        }
                        if (lists.emptyline === true) {
                            output.push("");
                        }
                    }
                    b = b + 1;
                } while (b < len);
            };
        output.push(`${text.underline + text.bold}Pretty Diff - ${lists.heading + text.none}`);
        output.push("");
        displayKeys("", keys);
        if (command === "commands") {
            output.push("");
            output.push("For examples and usage instructions specify a command name, for example:");
            output.push(`globally installed - ${text.green}prettydiff commands hash${text.none}`);
            output.push(`locally installed - ${text.green}node js/services commands hash${text.none}`);
        }
        apps.output(output);
    };
    // makes specified directory structures in the local file system
    apps.makedir = function node_apps_makedir(dirToMake:string, callback:Function):void {
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
                                dirs.slice(0, ind + 1).join(sep),
                                function node_apps_makedir_stat_restat_callback(erra:nodeError, stata:Stats):void {
                                    let erras:string = "";
                                    ind = ind + 1;
                                    if (erra !== null) {
                                        erras = erra.toString();
                                        if (erras.indexOf("no such file or directory") > 0 || erra.code === "ENOENT") {
                                            node
                                                .fs
                                                .mkdir(
                                                    dirs.slice(0, ind).join(sep),
                                                    function node_apps_makedir_stat_restat_callback_mkdir(errb:Error):void {
                                                        if (errb !== null && errb.toString().indexOf("file already exists") < 0) {
                                                            apps.errout([errb.toString()]);
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
                                            apps.errout([erra.toString()]);
                                            return;
                                        }
                                    }
                                    if (stata.isFile() === true) {
                                        apps.errout([`Destination directory, '${text.cyan + dirToMake + text.none}', is a file.`]);
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
                        dirs = dirToMake.split(sep);
                        if (dirs[0] === "") {
                            ind = ind + 1;
                        }
                        len = dirs.length;
                        restat();
                        return;
                    }
                    if (ers.indexOf("file already exists") < 0) {
                        apps.errout([err.toString()]);
                        return;
                    }
                }
                if (stats.isFile() === true) {
                    apps.errout([`Destination directory, '${text.cyan + dirToMake + text.none}', is a file.`]);
                    return;
                }
                callback();
            });
    };
    // mode minify wrapper, see apps.mode
    apps.minify = function node_apps_minify():void {
        options.mode = "minify";
        apps.mode();
    };
    // processes Pretty Diff mode commands
    apps.mode = function node_apps_mode():void {
        if (options.source === "") {
            apps.errout([`Pretty Diff requires use of the ${text.angry}source${text.none} option.`]);
            return;
        }
        require(`${projectPath}node_modules${sep}parse-framework${sep}js${sep}parse`);
        const all = require(`${projectPath}node_modules${sep}parse-framework${sep}js${sep}lexers${sep}all`),
            auto:any = {
                lang: (options.lang === "auto"),
                readmethod: (options.readmethod === "auto")
            },
            status:any = {
                source: false,
                diff: false
            },
            pdwrap = function node_apps_mode_pdwrap(stattype:"directory"|"file"|"screen"):void {
                const output:string[] = [],
                    final = function node_apps_mode_pdwrap_final(inject?:string) {
                        if (verbose === true) {
                            if (auto.lang === true || auto.readmethod === true) {
                                output.push("");
                            }
                            if (auto.readmethod === true) {
                                apps.wrapit(output, `${text.angry}*${text.none} Option ${text.cyan}readmethod${text.none} set to ${text.angry}auto${text.none}. Option ${text.cyan}source${text.none} was not provided a valid file system path so Pretty Diff processed the source value literally.`);
                            }
                            if (auto.lang === true) {
                                apps.wrapit(output, `${text.angry}*${text.none} Option ${text.cyan}lang${text.none} set to ${text.angry}auto${text.none} and evaluated by Pretty Diff as ${text.green + text.bold + lang[2] + text.none} by lexer ${text.green + text.bold + lang[1] + text.none}.`);
                            }
                        }
                        if (inject !== undefined && inject !== "") {
                            output.push(inject);
                        }
                        apps.output(output);
                    };
                if (options.lang === "auto") {
                    lang = prettydiff.api.language.auto(options.source, "javascript");
                    if (lang[2] === "unknown") {
                        lang[2] = "JavaScript";
                    }
                    options.lang = lang[0];
                    options.lexer = lang[1];
                }
                if (options.mode === "diff") {
                    if (options.lang !== "text") {
                        const source:string = options.source;
                        options.source = options.diff;
                        options.parsed = global.parseFramework.parserArrays(options);
                        options.diff = prettydiff.beautify[options.lexer](options);
                        options.source = source;
                        options.parsed = global.parseFramework.parserArrays(options);
                        options.source = prettydiff.beautify[options.lexer](options);
                    }
                    const diff:[string, number, number] = prettydiff.api.diffview(options),
                        plural:string = (diff[2] > 0)
                            ? "s"
                            : "";
                    if (options.readmethod === "screen" || options.readmethod === "filescreen" || options.diffcli === true) {
                        output.push(diff[0]);
                        output.push("");
                        output.push(`Number of differences: ${text.cyan + (diff[1] + diff[2]) + text.none} from ${text.cyan + (diff[2] + 1) + text.none} line${plural} of code.`);
                    }
                } else {
                    if (options.mode === "parse" && options.parseFormat === "sequential") {
                        options.parsed = global.parseFramework.parserObjects(options);
                    } else {
                        options.parsed = global.parseFramework.parserArrays(options);
                    }
                    if (options.mode === "parse") {
                        options.source = JSON.stringify(options.parsed);
                    } else {
                        options.source = prettydiff[options.mode][options.lexer](options);
                    }
                    if (options.mode === "parse" && options.parseFormat === "clitable") {
                        let a:number   = 0,
                            str:string[] = [];
                        const outputArrays:parsedArray = options.parsed,
                            b:number = outputArrays.token.length,
                            pad = function node_apps_mode_pdwrap_pad(x:string, y:number):void {
                                const cc:string = x
                                        .toString()
                                        .replace(/\s/g, " ");
                                let dd:number = y - cc.length;
                                str.push(cc);
                                if (dd > 0) {
                                    do {
                                        str.push(" ");
                                        dd = dd - 1;
                                    } while (dd > 0);
                                }
                                str.push(" | ");
                            },
                            heading:string = "index | begin | lexer  | lines | presv | stack       | types       | token",
                            bar:string     = "------|-------|--------|-------|-------|-------------|-------------|------";
                        console.log("");
                        console.log(heading);
                        console.log(bar);
                        do {
                            if (a % 100 === 0 && a > 0) {
                                console.log("");
                                console.log(heading);
                                console.log(bar);
                            }
                            str = [];
                            if (outputArrays.lexer[a] === "markup") {
                                str.push(text.red);
                            } else if (outputArrays.lexer[a] === "script") {
                                str.push(text.green);
                            } else if (outputArrays.lexer[a] === "style") {
                                str.push(text.yellow);
                            }
                            pad(a.toString(), 5);
                            pad(outputArrays.begin[a].toString(), 5);
                            pad(outputArrays.lexer[a].toString(), 5);
                            pad(outputArrays.lines[a].toString(), 5);
                            pad(outputArrays.presv[a].toString(), 5);
                            pad(outputArrays.stack[a].toString(), 11);
                            pad(outputArrays.types[a].toString(), 11);
                            str.push(outputArrays.token[a].replace(/\s/g, " "));
                            str.push(text.none);
                            console.log(str.join(""));
                            a = a + 1;
                        } while (a < b);
                        options.readmethod = "screen";
                        verbose = true;
                    } else if (options.readmethod === "screen" || options.readmethod === "filescreen") {
                        output.push(options.source);
                    }
                }
                if (options.readmethod === "screen" || options.readmethod === "filescreen") {
                    final();
                } else if (stattype === "file") {
                    if (options.output === "") {
                        apps.errout([
                            `Pretty Diff requires use of option ${text.angry}output${text.none} to indicate where to write output.`,
                            `To print output to the console try using option ${text.cyan}readmethod:screen${text.none} or ${text.cyan}readmethod:filescreen${text.none}`,
                            "Example:",
                            `${text.cyan}prettydiff ${options.mode} source:"myfile1.txt"${(options.mode === "diff") ? " diff:\"myfile2.txt\"" : ""} readmethod:filescreen${text.none}`
                        ]);
                        return;
                    }
                    node.fs.writeFile(options.output, options.source, "utf8", function node_apps_mode_pdwrap_writeFile(err:Error) {
                        if (err !== null) {
                            apps.errout([err.toString()]);
                            return;
                        }
                        final(`${text.angry}*${text.none} Output written to ${text.cyan + node.path.resolve(options.output) + text.none} at ${text.green + apps.commas(options.source.length) + text.none} characters.`);
                    });
                }
                // priorities
                // 1 parse output - line 1904 - determine parse options and tabular output from the parse tool
                // 2 minify output
                // 3 analysis output
                // 4 validation
                // 5 readmethod dir and subdir
                // 6 prettydiff.js file for embedding
                // 7 global installation
                // 8 open defects
            },
            statWrapper = function node_apps_mode_statWrapper(item:"source"|"diff") {
                node.fs.stat(options[item], function node_apps_mode_statWrapper_stat(err:Error, stats:Stats):void {
                    if (auto.readmethod === true) {
                        if (err !== null) {
                            const index:any = {
                                "sep": options[item].indexOf(node.path.sep),
                                "<": options[item].indexOf("<"),
                                "=": options[item].indexOf("="),
                                ";": options[item].indexOf(";"),
                                "{": options[item].indexOf("}")
                            };
                            if (err.toString().indexOf("ENOENT") > -1 && (
                                index["sep"] < 0 ||
                                index["<"] > -1 ||
                                index["="] > -1 ||
                                index[";"] > -1 ||
                                index["{"] > -1
                            )) {
                                // readmethod:auto evaluated as "screen"
                                status[item] = true;
                                if (options.mode !== "diff" || (status.source === true && status.diff === true)) {
                                    pdwrap("screen");
                                }
                            } else {
                                // readmethod:auto evaluated as filesystem path
                                apps.errout([err.toString()]);
                            }
                            return;
                        }
                    } else {
                        if (err !== null) {
                            apps.errout([err.toString()]);
                            return;
                        }
                        if ((options.readmethod === "file" || options.readmethod === "filescreen") && stats.isFile() === false) {
                            apps.errout([`The value for the source option is ${text.angry}not an address to a file${text.none} but option readmethod is ${text.angry + options.readmethod + text.none}.`]);
                            return;
                        }
                        if ((options.readmethod === "directory" || options.readmethod === "subdirectory") && stats.isDirectory() === false) {
                            apps.errout([`The value for the source option is ${text.angry}not an address to a directory${text.none} but option readmethod is ${text.angry + options.readmethod + text.none}.`]);
                            return;
                        }
                    }
                    if (stats.isFile() === true) {
                        node.fs.readFile(options[item], "utf8", function node_apps_mode_statWrapper_stat_readFile(erread:Error, filedata:string):void {
                            if (erread !== null) {
                                apps.errout([erread.toString()]);
                                return;
                            }
                            options[item] = filedata;
                            status[item] = true;
                            if (options.mode !== "diff" || (status.diff === true && status.source === true)) {
                                pdwrap("file");
                            }
                        });
                    }
                })
            };
        let lang:[string, string, string] = ["javascript", "script", "JavaScript"];
        all(options, function node_apps_mode_allLexers() {
            if (options.readmethod === "screen") {
                pdwrap("screen");
            } else {
                statWrapper("source");
            }
        });
        return;
    };
    // CLI documentation for supported Pretty Diff options
    apps.options = function node_apps_options():void {
        const def:any = prettydiff.api.optionDef;
        if (def[process.argv[0]] === undefined) {
            if (process.argv.length < 1) {
                // all options in a list
                apps.lists({
                    emptyline: true,
                    heading: "Options",
                    obj: def,
                    property: "definition"
                });
            } else {
                // queried list of options
                const keys:string[] = Object.keys(def),
                    arglen:number = process.argv.length,
                    output:any = {},
                    namevalue = function node_apps_options_namevalue(item:string):void {
                        const si:number = item.indexOf(":");
                        if (si < 1) {
                            name = item;
                            value = "";
                            return;
                        }
                        if (
                            (si < item.indexOf("\"") && item.indexOf("\"") > -1) ||
                            (si < item.indexOf("'") && item.indexOf("'") > -1) ||
                            (item.indexOf("\"") < 0 && item.indexOf("'") < 0)
                        ) {
                            name = item.slice(0, si);
                            value = item.slice(si + 1);
                            return;
                        }
                        name = item;
                        value = "";
                    };
                let keylen:number = keys.length,
                    a:number = 0,
                    b:number = 0,
                    name:string = "",
                    value:string = "";
                do {
                    namevalue(process.argv[a]);
                    b = 0;
                    do {
                        if (def[keys[b]][name] === undefined || (value !== "" && def[keys[b]][name] !== value)) {
                            keys.splice(b, 1);
                            b = b - 1;
                            keylen = keylen - 1;
                        }
                        b = b + 1;
                    } while (b < keylen);
                    if (keylen < 1) {
                        break;
                    }
                    a = a + 1;
                } while (a < arglen);
                a = 0;
                do {
                    output[keys[a]] = def[keys[a]];
                    a = a + 1;
                } while (a < keylen);
                if (keylen < 1) {
                    apps.output([`${text.angry}Pretty Diff has no options matching the query criteria.${text.none}`]);
                } else {
                    apps.lists({
                        emptyline: true,
                        heading: "Options",
                        obj: output,
                        property: "definition"
                    });
                }
            }
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
    // verbose metadata printed to the shell about Pretty Diff 
    apps.output = function node_apps_output(output:string[]):void {
        if (verbose === true) {
            console.log("");
        }
        if (output[output.length - 1] === "") {
            output.pop();
        }
        output.forEach(function node_apps_output_each(value:string) {
            console.log(value);
        });
        if (verbose === true) {
            console.log("");
            console.log("");
            console.log(`Pretty Diff version ${text.angry + version.number + text.none} dated ${text.cyan + version.date + text.none}`);
            apps.humantime(true);
        }
    };
    // mode parse wrapper, see apps.mode
    apps.parse = function node_apps_parse():void {
        options.mode = "parse";
        apps.mode();
    };
    // similar to posix "rm -rf" command
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
        util.complete = function node_apps_remove_complete():void {
            const out = ["Pretty Diff removed "];
            if (command === "remove") {
                verbose = true;
                console.log("");
                out.push(text.angry);
                out.push(String(numb.dirs));
                out.push(text.none);
                out.push(" director");
                if (numb.dirs === 1) {
                    out.push("y, ");
                } else {
                    out.push("ies, ");
                }
                out.push(text.angry);
                out.push(String(numb.file));
                out.push(text.none);
                out.push(" file");
                if (numb.dirs !== 1) {
                    out.push("s");
                }
                out.push(", ");
                out.push(text.angry);
                out.push(String(numb.symb));
                out.push(text.none);
                out.push(" symbolic link");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(", and ");
                out.push(text.angry);
                out.push(String(numb.symb));
                out.push(text.none);
                out.push(" other type");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(" at ");
                out.push(text.angry);
                out.push(apps.commas(numb.size));
                out.push(text.none);
                out.push(" bytes.");
                apps.output([out.join(""), `Removed ${text.cyan + filepath + text.nocolor}`]);
            }
            callback();
        };
        util.destroy  = function node_apps_remove_destroy(item:string, dir:string):void {
            node
                .fs
                .unlink(item, function node_apps_remove_destroy_callback(er:Error):void {
                    if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                        apps.errout([er.toString()]);
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
                        apps.errout([er.toString()]);
                        return;
                    }
                    dirs[item] = 0;
                    if (files === undefined || files.length < 1) {
                        util.rmdir(item);
                    } else {
                        files.forEach(function node_apps_remove_readdir_callback_each(value) {
                            dirs[item] = dirs[item] + 1;
                            util.stat(item + sep + value, item);
                        });
                    }
                });
        };
        util.rmdir    = function node_apps_remove_rmdir(item:string):void {
            node
                .fs
                .rmdir(item, function node_apps_remove_delete_callback_rmdir(er:Error):void {
                    const dirlist:string[] = item.split(sep);
                    let dir:string     = "";
                    if (er !== null && er.toString().indexOf("resource busy or locked") > 0) {
                        setTimeout(function node_apps_remove_rmdir_delay() {
                            node_apps_remove_rmdir(item);
                        }, 1000);
                        return;
                    }
                    if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                        apps.errout([er.toString()]);
                        return;
                    }
                    delete dirs[item];
                    if (Object.keys(dirs).length < 1) {
                        util.complete();
                    } else {
                        dirlist.pop();
                        dir       = dirlist.join(sep);
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
                        apps.errout([er.toString()]);
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
                apps.errout([
                    "Command remove requires a filepath",
                    `${text.cyan}prettydiff remove ../jsFiles${text.none}`
                ]);
                return;
            }
            filepath = node.path.resolve(process.argv[0]);
            callback = function node_apps_remove_callback() {
                return;
            };
        }
        util.stat(filepath, filepath);
    };
    // runs services: http, web sockets, and file system watch.  Allows rapid testing with automated rebuilds
    apps.server = function node_apps_server():void {
        if (process.argv[0] !== undefined && isNaN(Number(process.argv[0])) === true) {
            apps.errout([`Specified port, ${text.angry + process.argv[0] + text.none}, is not a number.`]);
            return;
        }
        let timeStore:number = 0;
        const port:number = (isNaN(Number(process.argv[0])))
                ? 9001
                : Number(process.argv[0]),
            server = node.http.createServer(function node_apps_server_create(request, response):void {
                let quest:number = request.url.indexOf("?"),
                    uri:string = (quest > 0)
                        ? request.url.slice(0, quest)
                        : request.url,
                    file:string = projectPath + node.path.sep + uri.slice(1);
                if (uri === "/") {
                    file = `${projectPath + node.path.sep}index.xhtml`;
                }
                if (request.url.indexOf("favicon.ico") < 0 && request.url.indexOf("images/apple") < 0) {
                    node.fs.readFile(file, "utf8", function node_apps_server_create_readFile(err:Error, data:string):void {
                        if (err !== undefined && err !== null) {
                            if (err.toString().indexOf("no such file or directory") > 0) {
                                response.writeHead(404, {"Content-Type": "text/plain"});
                                console.log(`${text.angry}404${text.none} for ${file}`);
                                return;
                            }
                            response.write(JSON.stringify(err));
                            console.log(err);
                            return;
                        }
                        if (file.indexOf(".js") === file.length - 3) {
                            response.writeHead(200, {"Content-Type": "application/javascript"});
                        } else if (file.indexOf(".css") === file.length - 4) {
                            response.writeHead(200, {"Content-Type": "text/css"});
                        } else if (file.indexOf(".xhtml") === file.length - 6) {
                            response.writeHead(200, {"Content-Type": "application/xhtml+xml"});
                        }
                        response.write(data);
                        response.end();
                    });
                } else {
                    response.end();
                }
            }),
            serverError = function node_apps_server_serverError(error):void {
                if (error.code === "EADDRINUSE") {
                    if (error.port === port + 1) {
                        apps.errout([`Web socket channel port, ${text.cyan + port + text.none}, is in use!  The web socket channel is 1 higher than the port designated for the HTTP server.`]);
                    } else {
                        apps.errout([`Specified port, ${text.cyan + port + text.none}, is in use!`]);
                    }
                } else {
                    apps.errout([`${error.Error}`]);
                }
                return
            },
            ignore   = function node_apps_server_ignore(input:string|null):boolean {
                if (input.indexOf(".git") === 0) {
                    return true;
                }
                if (input.indexOf("node_modules") === 0) {
                    return true;
                }
                if (input.indexOf("js") === 0) {
                    return true;
                }
                return false;
            },
            socket = require("ws"),
            ws = new socket.Server({port: port + 1});
        if (process.cwd() !== projectPath) {
            process.chdir(projectPath);
        }
        ws.broadcast = function node_apps_server_broadcast(data:string):void {
            ws.clients.forEach(function node_apps_server_broadcast_clients(client):void {
                if (client.readyState === socket.OPEN) {
                    client.send(data);
                }
            });
        };
        console.log(`HTTP server is up at: ${text.bold + text.green}http://localhost:${port + text.none}`);
        console.log(`${text.green}Starting web server and file system watcher!${text.none}`);
        node.fs.watch(projectPath, {
            recursive: true
        }, function node_apps_server_watch(type:"rename"|"change", filename:string|null):void {
            if (filename === null || ignore(filename) === true) {
                return;
            }
            const extension:string = (function node_apps_server_watch_extension():string {
                    const list = filename.split(".");
                    return list[list.length - 1];
                }()),
                time = function node_apps_server_watch_time(message:string):number {
                    const date:Date = new Date(),
                        datearr:string[] = [];
                    let hours:string = String(date.getHours()),
                        minutes:string = String(date.getMinutes()),
                        seconds:string = String(date.getSeconds()),
                        mseconds:string = String(date.getMilliseconds());
                    if (hours.length === 1) {
                        hours = `0${hours}`;
                    }
                    if (minutes.length === 1) {
                        minutes = `0${minutes}`;
                    }
                    if (seconds.length === 1) {
                        seconds = `0${seconds}`;
                    }
                    if (mseconds.length < 3) {
                        do {
                            mseconds = `0${mseconds}`;
                        } while (mseconds.length < 3);
                    }
                    datearr.push(hours);
                    datearr.push(minutes);
                    datearr.push(seconds);
                    datearr.push(mseconds);
                    console.log(`[${text.cyan + datearr.join(":") + text.none}] ${message}`);
                    timeStore = date.valueOf();
                    return timeStore;
                };
            if (extension === "ts" && timeStore < Date.now() - 1000) {
                let start:number,
                    compile:number,
                    duration = function node_apps_server_watch_duration(length:number):void {
                        let hours:number = 0,
                            minutes:number = 0,
                            seconds:number = 0,
                            list:string[] = [];
                        if (length > 3600000) {
                            hours = Math.floor(length / 3600000);
                            length = length - (hours * 3600000);
                        }
                        list.push(hours.toString());
                        if (list[0].length < 2) {
                            list[0] = `0${list[0]}`;
                        }
                        if (length > 60000) {
                            minutes = Math.floor(length / 60000);
                            length = length - (minutes * 60000);
                        }
                        list.push(minutes.toString());
                        if (list[1].length < 2) {
                            list[1] = `0${list[1]}`;
                        }
                        if (length > 1000) {
                            seconds = Math.floor(length / 1000);
                            length = length - (seconds * 1000);
                        }
                        list.push(seconds.toString());
                        if (list[2].length < 2) {
                            list[2] = `0${list[2]}`;
                        }
                        list.push(length.toString());
                        if (list[3].length < 3) {
                            do {
                                list[3] = `0${list[3]}`;
                            } while (list[3].length < 3);
                        }
                        console.log(`[${text.bold + text.purple + list.join(":") + text.none}] Total compile time.`);
                    };
                console.log("");
                start = time(`Compiling TypeScript for ${text.green + filename + text.none}`);
                node.child(`node js/services build nolint`, {
                    cwd: projectPath
                }, function node_apps_server_watch_child(err:Error, stdout:string, stderr:string):void {
                    if (err !== null) {
                        apps.errout([err.toString()]);
                        return;
                    }
                    if (stderr !== "") {
                        apps.errout([stderr]);
                        return;
                    }
                    compile = time("TypeScript Compiled") - start;
                    duration(compile);
                    ws.broadcast("reload");
                    return;
                });
            }
        });
        server.on("error", serverError);
        server.listen(port);
    };
    // tests the commands of the services file
    apps.simulation = function node_apps_simulation():void {};
    // unit test validation runner for Pretty Diff mode commands
    apps.validation = function node_apps_validation():void {
        let count_raw = 0,
            count_formatted = 0;
        const all = require(`${projectPath}node_modules${sep}parse-framework${sep}js${sep}lexers${sep}all`),
            flag = {
                raw: false,
                formatted: false
            },
            raw:[string, string][] = [],
            formatted:[string, string][] = [],
            compare = function node_apps_validation_compare():void {
                const len:number = (raw.length > formatted.length)
                        ? raw.length
                        : formatted.length,
                    sort = function node_apps_validation_compare_sort(a:[string, string], b:[string, string]):number {
                        if (a[0] > b[0]) {
                            return 1;
                        }
                        return -1;
                    };
                let a:number = 0,
                    filecount:number = 0,
                    output:string = "";
                raw.sort(sort);
                formatted.sort(sort);
                options.mode = "diff";
                do {
                    if (raw[a] === undefined || formatted[a] === undefined) {
                        if (raw[a] === undefined) {
                            console.log(`${text.yellow}raw directory is missing file:${text.none} ${formatted[a][0]}`);
                            formatted.splice(a, 1);
                        } else {
                            console.log(`${text.yellow}formatted directory is missing file:${text.none} ${raw[a][0]}`);
                            raw.splice(a, 1);
                        }
                        if (a === len - 1) {
                            console.log("");
                            console.log(`${text.green}ore Unit Testing Complete${text.none}`);
                            return;
                        }
                    } else if (raw[a][0] === formatted[a][0]) {
                        const notes:string[] = raw[a][0].split("_");
                        options.lang       = notes[2];
                        options.lexer      = notes[1];
                        options.mode       = notes[0];
                        options.source     = raw[a][1];
                        options.parsed     = global.parseFramework.parserArrays(options);
                        options.readmethod = "screen";
                        output = prettydiff[options.mode][options.lexer](options);
                        if (output === formatted[a][1]) {
                            filecount = filecount + 1;
                            console.log(`${apps.humantime(false) + text.green}Pass ${filecount}:${text.none} ${formatted[a][0]}`);
                        } else {
                            console.log(`${apps.humantime(false) + text.angry}Fail: ${text.cyan + raw[a][0] + text.none}`);
                            options.diff   = formatted[a][1];
                            options.lang   = "text";
                            options.mode   = "diff";
                            options.source = output;
                            apps.mode();
                            break;
                        }
                    } else {
                        if (raw[a][0] < formatted[a][0]) {
                            console.log(`${text.yellow}formatted directory is missing file:${text.none} ${raw[a][0]}`);
                            raw.splice(a, 1);
                        } else {
                            console.log(`${text.yellow}raw directory is missing file:${text.none} ${formatted[a][0]}`);
                            formatted.splice(a, 1);
                        }
                    }
                    a = a + 1;
                } while (a < len);
            },
            readDir = function node_apps_validation_readDir(type:string):void {
                const dir:string = `${projectPath}tests${sep + type}`;
                node.fs.readdir(dir, function node_apps_validation_readDir_reading(err:Error, list:string[]) {
                    if (err !== null) {
                        apps.errout([err.toString()]);
                        return;
                    }
                    const pusher = function node_apps_validation_readDir_reading_pusher(value:string, index:number, arr:string[]) {
                        node.fs.readFile(dir + sep + value, "utf8", function node_apps_validation_readDir_reading_pusher_readFile(er:Error, fileData:string) {
                            if (er !== null) {
                                apps.errout([er.toString()]);
                                return;
                            }
                            if (type === "raw") {
                                raw.push([value, fileData]);
                                count_raw = count_raw + 1;
                                if (count_raw === arr.length) {
                                    flag.raw = true;
                                    if (flag.formatted === true) {
                                        compare();
                                    }
                                }
                            } else if (type === "formatted") {
                                formatted.push([value, fileData]);
                                count_formatted = count_formatted + 1;
                                if (count_formatted === arr.length) {
                                    flag.formatted = true;
                                    if (flag.raw === true) {
                                        compare();
                                    }
                                }
                            }
                        });
                    };
                    list.forEach(pusher);
                });
            };
        
        require(`${projectPath}node_modules${sep}parse-framework${sep}js${sep}parse`);
        all(options, function node_apps_validation_allLexers() {
            readDir("raw");
            readDir("formatted");
        });
    };
    // runs apps.output
    apps.version = function ():void {
        verbose = true;
        apps.output([""]);
    };
    // performs word wrap when printing text to the shell
    apps.wrapit = function node_apps_lists_wrapit(outputArray:string[], string:string):void {
        const wrap:number = 100;
        if (string.length > wrap) {
            const indent:string = (function node_apps_options_wrapit_indent():string {
                    const len:number = string.length;
                    let inc:number = 0,
                        num:number = 2,
                        str:string = "";
                    // eslint-disable-next-line
                    if ((/^(\s*((\*|-)\s*)?\w+\s*:)/).test(string.replace(/\u001b\[\d+m/g, "")) === false) {
                        return "";
                    }
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
                            outputArray.push(string);
                            return;
                        }
                    }
                    outputArray.push(string.slice(0, wrapper).replace(/ $/, ""));
                    string = string.slice(wrapper + 1);
                    if (string.length + indent.length > wrap) {
                        string = indent + string;
                        node_apps_options_wrapit_formLine();
                    } else if (string !== "") {
                        outputArray.push(indent + string);
                    }
                };
            formLine();
        } else {
            outputArray.push(string);
        }
    };
}());
