import { Stats, fstat, ReadStream } from "fs";
import * as http from "http";
import { Stream, Writable } from "stream";
import { Hash } from "crypto";
type directoryItem = [string, "file" | "directory" | "link" | "screen", number, number, Stats];
interface directoryList extends Array<directoryItem> {
    [key:number]: directoryItem;
}
interface diffStore {
    diff: directoryList;
    source: directoryList;
}
interface readFile {
    callback: Function;
    index: number;
    path: string;
    stat: Stats;
}

/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
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
        cli:string = process.argv.join(" "),
        sep:string = node.path.sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        js:string = `${projectPath}js${sep}`,
        api:string = `${js}api${sep}`,
        libFiles:string[] = [api, `${js}beautify${sep}`, `${js}minify${sep}`],
        text:any     = {
            angry    : "\u001b[1m\u001b[31m", // bold, red
            blue     : "\u001b[34m",
            bold     : "\u001b[1m",
            clear    : "\u001b[24m\u001b[22m", // remove color, remove underline
            cyan     : "\u001b[36m",
            diffchar : "\u001b[1m\u001b[4m", // bold, underline
            green    : "\u001b[32m",
            nocolor  : "\u001b[39m",
            none     : "\u001b[0m",
            purple   : "\u001b[35m",
            red      : "\u001b[31m",
            underline: "\u001b[4m",
            yellow   : "\u001b[33m"
        },
        diffStatus:diffStatus = {
            diff: false,
            source: false
        },
        diffStore:diffStore = {
            diff: [],
            source: []
        },
        commands:commandList = {
            //analysis: {
            //    description: "Perform Pretty Diff's code analysis operation.",
            //    example: [{
            //        code: "",
            //        defined: "Performs Pretty Diff's code analysis operation."
            //    }]
            //},
            base64: {
                description: "Convert a file or string into a base64 encoding.",
                example: [
                    {
                        code: "prettydiff base64 encode string:\"my string to encode\"",
                        defined: "Converts the provided string into a base64 encoding."
                    },
                    {
                        code: "prettydiff base64 encode path/to/file",
                        defined: "Converts the provided file into a base64 encoding."
                    },
                    {
                        code: "prettydiff base64 encode http://file.from.internet.com",
                        defined: "Reads a file from a URI and outputs a base64 encoding."
                    },
                    {
                        code: "prettydiff base64 decode string:\"a big base64 string\"",
                        defined: "Decodes base64 strings into decoded output."
                    }
                ]
            },
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
                        defined: "Compiles from TypeScript into JavaScript and puts libraries together."
                    },
                    {
                        code: "prettydiff build incremental",
                        defined: "Use the TypeScript incremental build, which takes about half the time."
                    },
                    {
                        code: "prettydiff build local",
                        defined: "The default behavior assumes TypeScript is installed globally. Use the 'local' argument if TypeScript is locally installed in node_modules."
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
                        code: "prettydiff commands directory",
                        defined: "Details the mentioned command with examples."
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
                        code: "prettydiff copy source destination ignore [build, .git, node_modules]",
                        defined: "Exclusions are permitted as a comma separated list in square brackets following the ignore keyword."
                    },
                    {
                        code: "prettydiff copy source destination ignore[build, .git, node_modules]",
                        defined: "A space between the 'ignore' keyword and the opening square brace is optional."
                    },
                    {
                        code: "prettydiff copy ../prettydiff3 ../prettydiffXX ignore [build, .git, node_modules]",
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
            directory: {
                description: "Traverses a directory in the local file system and generates a list.",
                example: [
                    {
                        code: "prettydiff directory source:\"my/directory/path\"",
                        defined: "Returns an array where each index is an array of [absolute path, type, parent index, file count, stat]. Type can refer to 'file', 'directory', or 'link' for symbolic links.  The parent index identify which index in the array is the objects containing directory and the file count is the number of objects a directory type object contains."
                    },
                    {
                        code: "prettydiff directory source:\"my/directory/path\" shallow",
                        defined: "Does not traverse child directories."
                    },
                    {
                        code: "prettydiff directory source:\"my/directory/path\" listonly",
                        defined: "Returns an array of strings where each index is an absolute path"
                    },
                    {
                        code: "prettydiff directory source:\"my/directory/path\" symbolic",
                        defined: "Identifies symbolic links instead of the object the links point to"
                    },
                    {
                        code: "prettydiff directory source:\"my/directory/path\" ignore [.git, node_modules, \"program files\"]",
                        defined: "Sets an exclusion list of things to ignore"
                    },
                    {
                        code: "prettydiff directory source:\"my/path\" typeof",
                        defined: "returns a string describing the artifact type"
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
                        defined: "Prints a SHA512 hash to the shell for the specified file's contents in the local file system."
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
                        code: "prettydiff hash https://prettydiff.com/",
                        defined: "Hash a resource from the web."
                    },
                    {
                        code: "prettydiff hash path/to/directory",
                        defined: "Directory hash recursively gathers all descendant artifacts and hashes the contents of each of those items that are files, hashes the paths of directories, sorts this list, and then hashes the list of hashes."
                    },
                    {
                        code: "prettydiff hash path/to/directory list",
                        defined: "Returns a JSON string listing all scanned file system objects and each respective hash."
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
            performance: {
                description: "Executes the Pretty Diff application 11 times.  The first execution is dropped and the remaining 10 are averaged.  Specify a complete Pretty Diff terminal command.",
                example: [
                        {
                        code: "prettydiff performance beautify source:\"js/services.js\" method_chain:3",
                        defined: "Just specify the actual command to execute.  Pretty Diff will execute the provided command as though the 'performance' command weren't there."
                    },
                    {
                        code: "prettydiff performance base64 js/services.js",
                        defined: "The command to test may be any command supported by Pretty Diff's terminal services."
                    }
                ]
            },
            prettydiff_debug: {
                description: "Generates a debug statement in markdown format.",
                example: [{
                    code: "prettydiff prettydiff_debug",
                    defined: "Produces a report directly to the shell that can be copied to anywhere else. This report contains environmental details."
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
            test: {
                description: "Builds the application and then runs all the test commands",
                example: [{
                    code: "prettydiff test",
                    defined: "After building the code, it will lint the JavaScript output, test Node.js commands as simulations, and validate the Pretty Diff modes against test samples."
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
        exclusions = (function node_exclusions():string[] {
            const args = process.argv.join(" "),
                match = args.match(/\signore\s*\[/);
            if (match !== null) {
                const list:string[] = [],
                    listBuilder = function node_exclusions_listBuilder():void {
                        do {
                            if (process.argv[a] === "]" || process.argv[a].charAt(process.argv[a].length - 1) === "]") {
                                if (process.argv[a] !== "]") {
                                    list.push(process.argv[a].replace(/,$/, "").slice(0, process.argv[a].length - 1));
                                }
                                process.argv.splice(igindex, (a + 1) - igindex);
                                break;
                            }
                            list.push(process.argv[a].replace(/,$/, ""));
                            a = a + 1;
                        } while (a < len);
                    };
                let a:number = 0,
                    len:number = process.argv.length,
                    igindex:number = process.argv.indexOf("ignore");
                if (igindex > -1 && igindex < len - 1 && process.argv[igindex + 1].charAt(0) === "[") {
                    a = igindex + 1;
                    if (process.argv[a] !== "[") {
                        process.argv[a] = process.argv[a].slice(1).replace(/,$/, "");
                    }
                    listBuilder();
                } else {
                    do {
                        if (process.argv[a].indexOf("ignore[") === 0) {
                            igindex = a;
                            break;
                        }
                        a = a + 1;
                    } while (a < len);
                    if (process.argv[a] !== "ignore[") {
                        process.argv[a] = process.argv[a].slice(7);
                        if (process.argv[a].charAt(process.argv[a].length - 1) === "]") {
                            list.push(process.argv[a].replace(/,$/, "").slice(0, process.argv[a].length - 1));
                        } else {
                            listBuilder();
                        }
                    }
                }
                return list;
            }
            return [];
        }()),
        performance:perform = {
            codeLength: 0,
            diff: "",
            end: [0,0],
            index: 0,
            source: "",
            start: [0,0],
            store: [],
            test: false
        },
        apps:any = {},
        args = function node_args():void {
            const terminalOptions = function node_args_terminalOptions():void {
                const list:string[] = process.argv,
                    def:optionDef = prettydiff.api.optionDef,
                    keys:string[] = (command === "options")
                        ? Object.keys(def.mode)
                        : [],
                    obj = (command === "options")
                        ? def.mode
                        : options,
                    optionName = function node_args_terminalOptions_optionName(bindArgument:boolean):void {
                        if (a === 0 || options[list[a]] === undefined) {
                            if (keys.indexOf(list[a]) < 0 && def[list[a]] === undefined) {
                                list.splice(a, 1);
                                len = len - 1;
                                a = a - 1;
                            }
                            return;
                        }
                        if (bindArgument === true && list[a + 1] !== undefined && list[a + 1].length > 0) {
                            list[a] = `${list[a]}:${list[a + 1]}`;
                            list.splice(a + 1, 1);
                            len = len - 1;
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
                                name = list[a].slice(0, list[a].indexOf(split)).toLowerCase();
                                value = list[a].slice(list[a].indexOf(split) + 1);
                            } else {
                                name = list[a].toLowerCase();
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
                if (options.source === "" && process.argv.length > 0 && process.argv[0].indexOf("=") < 0 && process.argv[0].replace(/^[a-zA-Z]:\\/, "").indexOf(":") < 0) {
                    if (command === "performance") {
                        options.source = (process.argv.length < 1)
                            ? ""
                            : process.argv[1];
                    } else {
                        options.source = process.argv[0];
                    }
                }
            };
            options = prettydiff.options;
            if (process.argv.length > 0) {
                terminalOptions();
            }
            options.api = "node";
            options.binary_check = (
                // eslint-disable-next-line
                /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
            );
            apps[command]();
        };
    let verbose:boolean = false,
        errorflag:boolean = false,
        command:string = (function node_command():string {
            let comkeys:string[] = Object.keys(commands),
                filtered:string[] = [],
                a:number = 0,
                b:number = 0,
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
                len:number = arg.length + 1,
                commandFilter = function node_command_commandFilter(item:string):boolean {
                    if (item.indexOf(arg.slice(0, a)) === 0) {
                        return true;
                    }
                    return false;
                },
                // determines if mode option is specified, and so it will become the command in the absense of an accepted command
                modeval = function node_command_modeval():boolean {
                    let a:number = 0,
                        diff:boolean = false,
                        source:boolean = false;
                    const len:number = process.argv.length;
                    if (len > 0) {
                        do {
                            if (process.argv[a].indexOf("mode") === 0) {
                                if (process.argv[a].indexOf("beautify") > 0) {
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
                            if (process.argv[a].replace(/\s+/g, "").indexOf("source:") === 0 || process.argv[a].replace(/\s+/g, "").indexOf("source=") === 0 || process.argv[a].replace(/\s+/g, "").indexOf("source\"") === 0 || process.argv[a].replace(/\s+/g, "").indexOf("source'") === 0) {
                                source = true;
                            } else if (process.argv[a].replace(/\s+/g, "").indexOf("diff:") === 0 || process.argv[a].replace(/\s+/g, "").indexOf("diff=") === 0 || process.argv[a].replace(/\s+/g, "").indexOf("diff\"") === 0 || process.argv[a].replace(/\s+/g, "").indexOf("diff'") === 0) {
                                diff = true;
                            }
                            a = a + 1;
                        } while (a < len);
                        if (source === true || arg.replace(/\s+/g, "").indexOf("source:") === 0 || arg.replace(/\s+/g, "").indexOf("source=") === 0 || arg.replace(/\s+/g, "").indexOf("source\"") === 0 || arg.replace(/\s+/g, "").indexOf("source'") === 0) {
                            if (source === false) {
                                process.argv.push(arg);
                            }
                            if (diff === true || arg.replace(/\s+/g, "").indexOf("diff:") === 0 || arg.replace(/\s+/g, "").indexOf("diff=") === 0 || arg.replace(/\s+/g, "").indexOf("diff\"") === 0 || arg.replace(/\s+/g, "").indexOf("diff'") === 0) {
                                if (diff === false) {
                                    process.argv.push(arg);
                                }
                                mode = "diff";
                            } else {
                                mode = "beautify";
                            }
                            console.log("");
                            console.log(`No supported command found.  Pretty Diff is assuming command ${text.bold + text.cyan + mode + text.none}.`);
                            console.log("");
                            return true;
                        }
                    }
                    return false;
                };
            
            if (process.argv[2] === "prettydiff_debug") {
                process.argv = process.argv.slice(3);
                return "prettydiff_debug";
            }

            process.argv = process.argv.slice(2);

            // trim empty values
            b = process.argv.length;
            do {
                if (process.argv[a] === "") {
                    process.argv.splice(a, 1);
                    b = b - 1;
                }
                a = a + 1;
            } while (a < b);

            // filter available commands against incomplete input
            a = 1;
            do {
                filtered = comkeys.filter(commandFilter);
                a = a + 1;
            } while (filtered.length > 1 && a < len);

            if (filtered.length < 1 || (filtered[0] === "prettydiff_debug" && filtered.length < 2)) {
                if (modeval() === true) {
                    return mode;
                }
                console.log(`Command ${boldarg} is not a supported command.`);
                console.log("");
                console.log("Please try:");
                console.log(`  ${text.angry}*${text.none} globally installed - ${text.cyan}prettydiff commands${text.none}`);
                console.log(`  ${text.angry}*${text.none} locally installed  - ${text.cyan}node js/services commands${text.none}`);
                console.log("");
                process.exit(1);
                return "";
            }
            if (filtered.length > 1 && comkeys.indexOf(arg) < 0) {
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
            process.argv = process.argv.slice(1);
            return filtered[0];
        }()),
        prettydiff:pd,
        options:any = {},
        writeflag:string = ""; // location of written assets in case of an error and they need to be deleted

    (function node_prettytest():void {
        node.fs.stat(`${js}prettydiff.js`, function node_prettytest_stat(ers:Error) {
            if (ers !== null) {
                let err:string = ers.toString();
                if (err.indexOf("no such file or directory") > 0) {
                    if (command === "build") {
                        global.prettydiff = (function node_prettytest_stat_dummy():pd {
                            let func:any = function () {};
                                func.api = {};
                                func.beautify = {};
                                func.end = 0;
                                func.iterator = 0;
                                func.meta = {
                                    error: "",
                                    lang: ["", "", ""],
                                    time: "",
                                    insize: 0,
                                    outsize: 0,
                                    difftotal: 0,
                                    difflines: 0
                                };
                                func.minify = {};
                                func.options = {};
                                func.scopes = [];
                                func.start = 0;
                                func.version = {
                                    date: "",
                                    number: "",
                                    parse: ""
                                };
                            return func;
                        }());
                        require(`${js}api${sep}optionDef.js`);
                        prettydiff = global.prettydiff
                        args();
                    } else {
                        console.log(`The file js/prettydiff.js has not been written.  Please run the build: ${text.cyan}node ${projectPath}js${sep}services build${text.none}`);
                        process.exit(1);
                        return;
                    }
                } else {
                    console.log(err);
                    process.exit(1);
                    return;
                }
            } else {
                prettydiff = require(`${js}prettydiff.js`);
                args();
            }
        });
    }());
    apps.base64 = function node_apps_base64():void {
        let direction:string = (process.argv[0] === "encode" || process.argv[0] === "decode")
                ? process.argv[0]
                : "encode",
            http:boolean = false,
            path:string = (process.argv[0] === "encode" || process.argv[0] === "decode")
                ? process.argv[1]
                : process.argv[0];
        const screen = function node_apps_base64_screen(string:string) {
                const output = (direction === "decode")
                    ? Buffer.from(string, "base64").toString("utf8")
                    : Buffer.from(string).toString("base64");
                apps.log([""], output, path);
            },
            fileWrapper = function node_apps_base64_fileWrapper(filepath):void {
                node
                .fs
                .stat(filepath, function node_apps_base64_fileWrapper_stat(er:Error, stat:Stats):void {
                    const angrypath:string = `filepath ${text.angry + filepath + text.none} is not a file or directory.`,
                        file = function node_apps_base64_fileWrapper_stat_file():void {
                            node
                            .fs
                            .open(filepath, "r", function node_apps_base64_fileWrapper_stat_file_open(ero:Error, fd:number):void {
                                let buff  = Buffer.alloc(stat.size);
                                if (ero !== null) {
                                    if (http === true) {
                                        apps.remove(filepath);
                                    }
                                    apps.errout([ero.toString()]);
                                    return;
                                }
                                node
                                    .fs
                                    .read(
                                        fd,
                                        buff,
                                        0,
                                        stat.size,
                                        0,
                                        function node_apps_base64_fileWrapper_stat_file_open_read(erra:Error, bytesa:number, buffera:Buffer):number {
                                            if (http === true) {
                                                apps.remove(filepath);
                                            }
                                            if (erra !== null) {
                                                apps.errout([erra.toString()]);
                                                return;
                                            }
                                            const output = (direction === "decode")
                                                ? Buffer.from(buffera.toString("utf8"), "base64").toString("utf8")
                                                : buffera.toString("base64");
                                            apps.log([""], output, path);
                                        }
                                    );
                            });
                        };
                    if (er !== null) {
                        if (http === true) {
                            apps.remove(filepath);
                        }
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            apps.errout([angrypath]);
                            return;
                        }
                        apps.errout([er.toString()]);
                        return;
                    }
                    if (stat === undefined) {
                        if (http === true) {
                            apps.remove(filepath);
                        }
                        apps.errout([angrypath]);
                        return;
                    }
                    if (stat.isFile() === true) {
                        file();
                    }
                });
            };
        if (path === undefined) {
            apps.errout([`No path to encode.  Please see ${text.cyan}prettydiff commands base64${text.none} for examples.`]);
            return;
        }
        if (path.indexOf("string:") === 0) {
            path = path.replace("string:", "");
            if (path.charAt(0) === "\"" && path.charAt(path.length - 1) === "\"") {
                path.slice(1, path.length - 1);
            } else if (path.charAt(0) === "'" && path.charAt(path.length - 1) === "'") {
                path.slice(1, path.length - 1);
            }
            screen(path);
            return;
        }
        if ((/https?:\/\//).test(path) === true) {
            http = true;
            apps.get(path, "source", screen);
        } else {
            fileWrapper(path);
        }
    };
    // handler for the beautify command
    apps.beautify = function node_apps_beautify():void {
        options.mode = "beautify";
        apps.readMethod(false);
    };
    // build system
    apps.build = function node_apps_build(test:boolean):void {
        let firstOrder:boolean = true,
            sectionTime:[number, number] = [0, 0];
        const order = {
                build: [
                    "npminstall",
                    "sparser",
                    "typescript",
                    "libraries",
                    "css",
                    "optionsMarkdown"
                ],
                test: [
                    "lint",
                    "simulation",
                    "validation"
                ]
            },
            type:string = (test === true)
                ? "test"
                : "build",
            orderlen:number = order[type].length,
            heading = function node_apps_build_heading(message:string):void {
                if (firstOrder === true) {
                    console.log("");
                    firstOrder = false;
                } else if (order[type].length < orderlen) {
                    console.log("________________________________________________________________________");
                    console.log("");
                }
                console.log(text.cyan + message + text.none);
                console.log("");
            },
            sectionTimer = function node_apps_build_sectionTime(input:string):void {
                let now:string[] = input.replace(`${text.cyan}[`, "").replace(`]${text.none} `, "").split(":"),
                    numb:[number, number] = [(Number(now[0]) * 3600) + (Number(now[1]) * 60) + Number(now[2].split(".")[0]), Number(now[2].split(".")[1])],
                    difference:[number, number],
                    times:string[] = [],
                    time:number = 0,
                    str:string = "";
                difference = [numb[0] - sectionTime[0], (numb[1] + 1000000000) - (sectionTime[1] + 1000000000)];
                sectionTime = numb;
                if (difference[1] < 0) {
                    difference[0] = difference[0] - 1;
                    difference[1] = difference[1] + 1000000000;
                }
                if (difference[0] < 3600) {
                    times.push("00");
                } else {
                    time = Math.floor(difference[0] / 3600);
                    difference[0] = difference[0] - (time * 3600);
                    if (time < 10) {
                        times.push(`0${time}`);
                    } else {
                        times.push(String(time));
                    }
                }
                if (difference[0] < 60) {
                    times.push("00");
                } else {
                    time = Math.floor(difference[0] / 60);
                    difference[0] = difference[0] - (time * 60);
                    if (time < 10) {
                        times.push(`0${time}`);
                    } else {
                        times.push(String(time));
                    }
                }
                if (difference[0] < 1) {
                    times.push("00");
                } else if (difference[0] < 10) {
                    times.push(`0${difference[0]}`);
                } else {
                    times.push(String(difference[0]));
                }
                str = String(difference[1]);
                if (str.length < 9) {
                    do {
                        str = `0${str}`;
                    } while (str.length < 9);
                }
                times[2] = `${times[2]}.${str}`;
                console.log(`${text.cyan + text.bold}[${times.join(":")}]${text.none} ${text.green}Total section time.${text.none}`);
            },
            next = function node_apps_build_next(message:string):void {
                let phase = order[type][0],
                    time:string = apps.humantime(false);
                if (message !== "") {
                    console.log(time + message);
                    sectionTimer(time);
                }
                if (order[type].length < 1) {
                    verbose = true;
                    heading(`${text.none}All ${text.green + text.bold + type + text.none} tasks complete... Exiting clean!\u0007`);
                    apps.log([""], "", "");
                    process.exit(0);
                    return;
                }
                order[type].splice(0, 1);
                phases[phase]();
            },
            // These are all the parts of the execution cycle, but their order is dictated by the 'order' object.
            phases = {
                // phase css merges the css for all supported HTML into a single file
                css: function node_apps_build_css():void {
                    heading("Merging CSS");
                    node.fs.readdir(`${projectPath}css`, "utf8", function node_apps_build_css_readdir(erc:Error, fileList:string[]):void {
                        const fileStore:any = {};
                        let filelen:number = fileList.length;
                        if (erc !== null) {
                            apps.errout([erc.toString()]);
                            return;
                        }
                        fileList.forEach(function node_apps_build_css_readdir_each(value:string):void {
                            node.fs.readFile(`${projectPath}css${sep + value}`, "utf8", function node_apps_build_css_readdir_each_readfile(erf:Error, fileData:string) {
                                if (erf !== null) {
                                    apps.errout([erf.toString()]);
                                    return;
                                }
                                if (value !== "index.css") {
                                    let name:string = fileData.slice(0, fileData.indexOf(".")).replace(/\s+$/, "").replace(/(\s*\/\*\s*)/, "");
                                    fileStore[name] = fileData;
                                }
                                filelen = filelen - 1;
                                if (filelen < 1) {
                                    const files:string[] = [
                                            fileStore.color_white,
                                            fileStore.color_canvas,
                                            fileStore.color_shadow,
                                            fileStore.global,
                                            fileStore.reports,
                                            fileStore.documentation,
                                            fileStore.page_specific,
                                            fileStore.webtool_only,
                                            fileStore.media
                                        ],
                                        index:string = `/* This file is dynamically written.  DO NOT EDIT!! */${node.os.EOL + node.os.EOL + files.join(node.os.EOL)}`;
                                    node.fs.writeFile(`${projectPath}css${sep}index.css`, index, function node_apps_build_css_readdir_each_readfile_write(erw:Error):void {
                                        if (erw !== null) {
                                            apps.errout([erw.toString()]);
                                            return;
                                        }
                                        next(`${text.green}CSS combined into a single file.${text.none}`);
                                    });
                                }
                            });
                        });
                    });
                },
                // phase libraries builds the JavaScript that is called for execution
                libraries: function node_apps_build_libraries():void {
                    let complete:string = "",
                        defaults:string = "",
                        langMarkdown:string = "",
                        langHtml:string = "",
                        libraries:string = "",
                        mode:string = "",
                        parser:string = "",
                        saveas:string = "",
                        webtool:string = "";
                    const flag = {
                            documentation: false,
                            html: false,
                            readme: false,
                            webtool: false
                        },
                        date:number = Date.now(),
                        optkeys:string[] = Object.keys(prettydiff.api.optionDef),
                        keyslen:number = optkeys.length,
                        modifyFile = function node_apps_build_libraries_modifyFile(file:string, fileFlag:string):void {
                            node.fs.readFile(file, "utf8", function node_apps_build_libraries_modifyFile_read(err:Error, data:string):void {
                                const modify = function node_apps_build_libraries_modifyFile_read_modify(ops:modifyOps):void {
                                        const start:number = (function node_apps_build_libraries_modifyFile_read_modify_startBuild():number {
                                                const len = (ops.start.indexOf("//") === 0)
                                                    ? (function node_apps_build_libraries_modifyFile_read_modify_startBuild_lineStart():number {
                                                        data = data.replace(new RegExp(ops.start + "\\s+"), ops.start + "\n");
                                                        return ops.start.length + 1;
                                                    }())
                                                    : ops.start.length;
                                                return data.indexOf(ops.start) + len;
                                            }()),
                                            end:number = (ops.end === "")
                                                ? data.length
                                                : data.indexOf(ops.end);
                                        if (start < 0) {
                                            apps.errout([
                                                "The injection start is missing from the file:",
                                                `Injection start: ${ops.start}`,
                                                `File flag: ${fileFlag}`
                                            ]);
                                            return;
                                        }
                                        if (end < start && ops.end !== "") {
                                            apps.errout([
                                                "The injection end is missing from the file:",
                                                `Injection end: ${ops.end}`,
                                                `File flag: ${fileFlag}`
                                            ]);
                                            return;
                                        }
                                        if (ops.end.indexOf("//") === 0) {
                                            data = data.replace(new RegExp(ops.end + "\\s+"), ops.end + "\n");
                                        }
                                        data = [data.slice(0, start), ops.injectFlag + "\n", data.slice(end)].join("");
                                    },
                                    buildDocumentation = function node_apps_build_libraries_modifyFile_read_buildDocumentation():string {
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
                                    buildDomInterface = function node_apps_build_libraries_modifyFile_read_buildDomInterface():string {
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
                                                    item.push(` <span><strong>${opt.default}</strong> &#8212; ${opt.values[String(opt.default)]}</span>`);
                                                }
                                                item.push("</p>");
                                                item.push(`<div class="disabled" style="display:none"></div>`);
                                                item.push(`</li>`);
                                                allItems.push(item.join(""));
                                            }
                                            a = a + 1;
                                        } while (a < keyslen);
                                        return allItems.join("");
                                    },
                                    writeJavaScript = function node_apps_build_libraries_modifyFile_read_writeJavaScript(fileName:string):void {
                                        flag[fileName] = true;
                                        if (flag.documentation === true && flag.html === true && flag.readme === true && flag.webtool === true) {
                                            node.fs.writeFile(`${js}prettydiff.js`, `${complete}module.exports=prettydiff;return prettydiff;}());`, function node_apps_build_libraries_modifyFile_read_write_readParser_writeBrowser(erbr:Error) {
                                                if (erbr !== null && erbr.toString() !== "") {
                                                    apps.errout([erbr.toString()]);
                                                    return;
                                                }
                                                node.fs.writeFile(`${js}browser.js`, `${complete}window.prettydiff=prettydiff;return prettydiff;}());`, function node_apps_build_libraries_modifyFile_read_write_readParser_writeBrowser_writePrettydiff(erth:Error) {
                                                    if (erth !== null && erth.toString() !== "") {
                                                        apps.errout([erth.toString()]);
                                                        return;
                                                    }
                                                    node.fs.writeFile(`${js}webtool.js`, webtool, function node_apps_build_libraries_modifyFile_read_write_readParser_writeBrowser_writePrettydiff_writeWebtool(erwb:Error) {
                                                        if (erwb !== null && erwb.toString() !== "") {
                                                            apps.errout([erwb.toString()]);
                                                            return;
                                                        }
                                                        next(`${text.green}Application files built and written.${text.none}`);
                                                    });
                                                });
                                            });
                                        }
                                    };
                                if (err !== null && err.toString() !== "") {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                // always ensure the start and end points are uniquely named to prevent unintentional collisions
                                if (fileFlag === "documentation") {
                                    modify({
                                        end: "<!-- option list end -->",
                                        injectFlag: buildDocumentation(),
                                        start: "<!-- option list start -->"
                                    });
                                    modify({
                                        end: "<!-- documentation languages end -->",
                                        injectFlag: langHtml,
                                        start: "<!-- documentation languages start -->"
                                    })
                                    data = data
                                        .replace(/Version\s+-\s+<strong>(\d+\.){2}\d+/, `Version - <strong>${prettydiff.version.number}`)
                                        .replace(/Sparser<\/a>\s+<strong>(\d+\.){2}\d+/, `Sparser</a> - <strong>${prettydiff.version.parse}`)
                                        .replace(/(\.css\?\d*)/g, `.css?${date}`).replace(/(\.js\?\d*)/g, `.js?${date}`);
                                } else if (fileFlag === "html") {
                                    modify({
                                        end: "<!-- documented options end -->",
                                        injectFlag: buildDomInterface(),
                                        start: "<!-- documented options start -->"
                                    });
                                    modify({
                                        end: "<!-- end version data -->",
                                        injectFlag: `<strong>${prettydiff.version.date}</strong> <span>Version: <strong>${prettydiff.version.number}</strong></span> <span><a href="https://sparser.io">Sparser</a>: <strong>${prettydiff.version.parse}</strong></span>`,
                                        start: "<!-- start version data -->"
                                    });
                                    data = data.replace(/(\.css\?\d*)/g, `.css?${date}`).replace(/(\.js\?\d*)/g, `.js?${date}`);
                                } else if (fileFlag === "readme") {
                                    modify({
                                        end: "",
                                        injectFlag: langMarkdown,
                                        start: "## Supported Languages"
                                    });
                                    data = data
                                        .replace(/Version\s+-\s+(\d+\.){2}\d+/, `Version - ${prettydiff.version.number}`)
                                        .replace(/\[Sparser\]\(https:\/\/sparser.io\)\s+-\s+(\d+\.){2}\d+/, `[Sparser](https://sparser.io) - ${prettydiff.version.parse}`);
                                } else if (fileFlag === "webtool") {
                                    modify({
                                        end: "// prettydiff dom insertion end",
                                        injectFlag: `prettydiff=${complete.replace(/(\s*\/\*(\w|\s|\d|\.|:|-)+\*\/)+\s*/, "").replace(/\s*("|')use\s+strict("|');/g, "") + saveas}return prettydiff;}());`,
                                        start: "// prettydiff dom insertion start"
                                    });
                                    webtool = data;
                                }
                                if (file.slice(file.length - 3) !== ".js") {
                                    node.fs.writeFile(file, data, function node_apps_build_libraries_modifyFile_write(err:Error) {
                                        if (err !== null) {
                                            apps.errout([err.toString()]);
                                            return;
                                        }
                                        writeJavaScript(fileFlag);
                                    });
                                } else {
                                    writeJavaScript(fileFlag);
                                }
                            });
                        },
                        libraryFiles = function node_apps_build_libraries_libraryFiles() {
                            libFiles.push(`${projectPath}node_modules${sep}file-saver${sep}dist${sep}FileSaver.min.js`);
                            libFiles.push(`${projectPath}node_modules${sep}sparser${sep}js${sep}browser.js`);
                            libFiles.push(`${projectPath}node_modules${sep}sparser${sep}docs-markdown${sep}language-support.md`);
                            libFiles.push(`${projectPath}node_modules${sep}sparser${sep}docs-html${sep}language-support.xhtml`);
                            const appendFile = function node_apps_build_libraries_libraryFiles_appendFile(filePath:string):void {
                                    node.fs.readFile(filePath, "utf8", function node_apps_build_libraries_libraryFiles_appendFile_read(errr:Error, filedata:string):void {
                                        const filenames:string[] = filePath.split(sep),
                                            filename:string = filenames[filenames.length - 1];
                                        if (errr !== null) {
                                            apps.errout([errr.toString()]);
                                            return;
                                        }
                                        if (filename === "FileSaver.min.js" && filePath.indexOf(filename) === filePath.length - filename.length) {
                                            filedata = `// eslint-disable-next-line${node.os.EOL}(${filedata.slice(filedata.indexOf("function(){\"use strict\""))}`;
                                            filedata = filedata
                                                .replace(/,"undefined"!=typeof module&&\(module\.exports=a\)\}\)/, ";}());")
                                                .replace("//# sourceMappingURL=FileSaver.min.js.map", "prettydiff.saveAs=window.saveAs;");
                                            saveas = filedata;
                                        } else if (filePath === `${projectPath}node_modules${sep}sparser${sep}js${sep}browser.js`) {
                                            // both sparser and prettydiff contain a browser.js file, so it is important to target the correct one
                                            filedata = filedata
                                                .replace(/\s*("|')use strict("|');/g, "")
                                                .replace(/\s*const\s+parser/, `"use strict";const parser`)
                                                .replace(/window\.sparser/g, "sparser")
                                                .replace(/sparser\s*=\s*sparser;\s*\}\(\)\);(prettydiff\.beautify=\{\};)?(prettydiff\.api=\{\};)?(prettydiff\.minify=\{\};)?/, "")
                                                .replace(/\s*sparser\.libs\.language\s*=\s*language;/, "sparser.libs.language=language;prettydiff.api.language=language;");
                                            parser = filedata;
                                        } else if (filePath === `${projectPath}node_modules${sep}sparser${sep}docs-markdown${sep}language-support.md`) {
                                            langMarkdown = node.os.EOL + filedata.slice(filedata.indexOf("- markup"));
                                            langMarkdown = `${langMarkdown + node.os.EOL + node.os.EOL}**${langMarkdown.split("](").length}** total languages`; 
                                        } else if (filePath === `${projectPath}node_modules${sep}sparser${sep}docs-html${sep}language-support.xhtml`) {
                                            langHtml = `<ul>${filedata.slice(filedata.indexOf("<li>markup "), filedata.indexOf("</ul></div></div><div id=\"blobs\">"))}</ul>`;
                                            langHtml = `${langHtml}<p><strong>${langHtml.split("href").length}</strong> total languages</p>`
                                        } else {
                                            filedata = filedata
                                                .replace(/(\/\*global\s+global(,\s*options)?(,\s*prettydiff)?\s*\*\/\s*)/, "")
                                                .replace(/global\s*\.\s*prettydiff\s*\./g, "prettydiff.")
                                                .replace(/\s*("|')use strict("|');/, "");
                                            if (filename === "mode.js" && filePath.indexOf(filename) === filePath.length - filename.length) {
                                                mode = filedata
                                                    .replace(/\/\*\s*global\s+prettydiff\s*\*\//, "")
                                                    .replace(/\s+/, "")
                                                    .replace(/\s+$/, ";")
                                                    .replace(/global(API)?\./g, "")
                                                    .replace(/globalAPI\.sparser/g, "sparser")
                                                    .replace(/globalAPI\s*=\s*\(options\.api\s*===\s*"dom"\)\s*\?\s*window\s*:\s*global,/, "")
                                                    .replace(/if\s*\(options\.api\s*===\s*"dom"\)\s*\{\s*globalAPI\s*=\s*window;\s*\}/, "")
                                                    .replace(/,\s*\/\/\s*prettydiff file insertion start\s+prettydiff\s*=\s*\{\};/, ";")
                                                    .replace(/\s*mode\(\);/, "")
                                                    .replace(/\s*prettydiff\s*=\s*prettydiff;/, "") + `prettydiff.api={};prettydiff.beautify={};prettydiff.end=0;prettydiff.iterator=0;prettydiff.meta={error:"",lang:["","",""],time:"",insize:0,outsize:0,difftotal:0,difflines:0};prettydiff.minify={};prettydiff.options=${defaults};prettydiff.scopes=[];prettydiff.start=0;`;
                                            } else if (filename !== "prettydiff-webtool.js") {
                                                libraries = libraries + filedata.replace(/\/\*\s*global\s*prettydiff\s*\*\//, "");
                                            }
                                        }
                                        a = a + 1;
                                        if (a === filelen) {
                                            const inject = function node_apps_build_libraries_libraryFiles_appendFile_read_inject(version:string):string {
                                                return `${version.slice(0, version.length - 1)},prettydiff=${mode}`;
                                            };
                                            complete = `${parser.replace(/version:\{date:"\d+\s+\w+\s+\d{4}",number:"\d+\.\d+\.\d+"\}\s*\};/, inject) + libraries}prettydiff.sparser=sparser;prettydiff.version=${JSON.stringify(prettydiff.version)};`;
                                            modifyFile(`${projectPath}index.xhtml`, "html");
                                            modifyFile(`${js}api${sep}prettydiff-webtool.js`, "webtool");
                                            modifyFile(`${projectPath}documentation.xhtml`, "documentation");
                                            modifyFile(`${projectPath}readme.md`, "readme");
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
                    node.child(`git log -1 --branches`, function node_apps_build_libraries_child(err:Error, stderr:string):void {
                        if (err !== null) {
                            apps.errout([err.toString()]);
                            return;
                        }
                        const date:string[] = stderr.slice(stderr.indexOf("Date:") + 12).split(" ");
                        prettydiff.version.date = `${date[1]} ${date[0]} ${date[3]}`;
                        node.fs.readFile(`${projectPath}package.json`, "utf8", function node_apps_build_libraries_child_readPackage(errp:Error, data:string):void {
                            if (errp !== null) {
                                apps.errout([errp.toString()]);
                                return;
                            }
                            prettydiff.version.number = JSON.parse(data).version;
                            node.fs.readFile(`${projectPath}node_modules${sep}sparser${sep}package.json`, "utf8", function node_apps_build_libraries_child_readPackage_readSparser(errf:Error, frameData:string):void {
                                if (errf !== null) {
                                    apps.errout([errf.toString()]);
                                    return;
                                }
                                prettydiff.version.parse = JSON.parse(frameData).version;
                                // update information for display in current build
                                defaults = (function node_apps_build_libraries_child_readPackage_readSparser_buildDefault():string {
                                    const obj:any = {};
                                    let a:number = 0;
                                    do {
                                        obj[optkeys[a]] = prettydiff.api.optionDef[optkeys[a]].default;
                                        a = a + 1;
                                    } while (a < keyslen);
                                    obj.lexerOptions = {};
                                    return JSON.stringify(obj);
                                }());
                                libraryFiles();
                            });
                        });
                    });
                },
                // phase lint is merely a call to apps.lint
                lint     : function node_apps_build_lint():void {
                    const callback = function node_apps_build_lint_callback(message:string):void {
                        next(message);
                    };
                    heading("Linting");
                    apps.lint(callback);
                },
                // phase npminstall checks if dependencies are absent
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
                                    next(`${text.green}Installed dependencies.${text.none}`);
                                });
                            } else {
                                apps.errout([errs.toString()]);
                                return;
                            }
                        } else {
                            next(`${text.green}Dependencies appear to be already installed...${text.none}`);
                        }
                    });
                },
                // phase optionsMarkdown builds a markdown file of options documentation
                optionsMarkdown: function node_apps_build_optionsMarkdown():void {
                    const def:optionDef = prettydiff.api.optionDef,
                        keys:string[] = Object.keys(def),
                        len:number = keys.length,
                        doc:string[] = ["# Pretty Diff Options"];
                    let a:number = 0,
                        b:number = 0,
                        lenv:number = 0,
                        vals:string[] = [],
                        valstring:string[] = [];
                    heading("Writing options documentation in markdown format");
                    do {
                        doc.push("");
                        doc.push(`## ${keys[a]}`);
                        doc.push("property | value");
                        doc.push("-----------|---");
                        doc.push(`api        | ${def[keys[a]].api}`);
                        doc.push(`default    | ${def[keys[a]].default}`);
                        doc.push(`definition | ${def[keys[a]].definition}`);
                        doc.push(`label      | ${def[keys[a]].label}`);
                        doc.push(`lexer      | ${def[keys[a]].lexer}`);
                        doc.push(`mode       | ${def[keys[a]].mode}`);
                        doc.push(`type       | ${def[keys[a]].type}`);
                        if (def[keys[a]].values !== undefined) {
                            vals = Object.keys(def[keys[a]].values);
                            valstring = [`values | ${vals[0]}`];
                            b = 1;
                            lenv = vals.length;
                            do {
                                valstring.push(vals[b]);
                                b = b + 1;
                            } while (b < lenv);
                            doc.push(valstring.join(", "));
                            b = 0;
                            doc.push("");
                            doc.push("### Value Definitions");
                            do {
                                doc.push(`* **${vals[b]}** - ${def[keys[a]].values[vals[b]]}`);
                                b = b + 1;
                            } while (b < lenv);
                        }
                        a = a + 1;
                    } while (a < len);
                    node.fs.writeFile("options.md", doc.join("\n"), function node_apps_build_optionsMarkdown_writeFile(err:Error) {
                        if (err !== null) {
                            apps.errout([err.toString()]);
                            return;
                        }
                        next(`${text.green}Options documentation successfully written to markdown file.${text.none}`);
                    });
                },
                // phase simulation is merely a call to apps.simulation
                simulation: function node_apps_build_simulation():void {
                    const callback = function node_apps_build_simulation_callback(message:string):void {
                        next(message);
                    };
                    heading("Simulations of Node.js commands from js/services.js");
                    apps.simulation(callback);
                },
                // phase sparser checks if the parser is built and builds it if necessary
                sparser: function node_apps_build_sparser():void {
                    heading("Checking for built sparser (parser tool)");
                    const frame:string = `node_modules${sep}sparser`;
                    node.fs.stat(`${frame + sep}js${sep}parse.js`, function node_apps_build_sparser_stat(ers:nodeError):void {
                        if (ers !== null) {
                            if (ers.code === "ENOENT") {
                                console.log(`${apps.humantime(false)}Sparser does not appear to be built... building now.`);
                                node.child(`tsc`, {
                                    cwd: frame
                                }, function node_apps_build_sparser_stat_tsc(err:Error, stdout:string, stderr:string):void {
                                    if (err !== null) {
                                        apps.errout([err.toString()]);
                                        return;
                                    }
                                    if (stderr !== "") {
                                        apps.errout([stderr]);
                                        return;
                                    }
                                    node.child(`node js${sep}services build`, {
                                        cwd: frame
                                    }, function node_apps_build_sparser_stat_tsc_build(erb:Error, stbout:string, stberr:string):void {
                                        if (erb !== null) {
                                            apps.errout([erb.toString()]);
                                            return;
                                        }
                                        if (stberr !== "") {
                                            apps.errout([stberr]);
                                            return;
                                        }
                                        next(`${text.green}The Sparser dependency is built.${text.none}`);
                                    });
                                });
                            } else {
                                apps.errout([ers]);
                                return;
                            }
                        } else {
                            next(`${text.green}The Sparser dependency appears to already be built.${text.none}`);
                        }
                    });
                },
                // phase typescript compiles the working code into JavaScript
                typescript: function node_apps_build_typescript():void {
                    const flag = {
                            services: false,
                            typescript: false
                        },
                        incremental:string = (process.argv.indexOf("incremental") > -1)
                            ? " --incremental"
                            : "",
                        command:string = (process.argv.indexOf("local") > -1)
                            ? `node_modules\\.bin\\tsc ${incremental}`
                            : `tsc${incremental}`,
                        ts = function node_apps_build_typescript_ts() {
                            node.child(command, {
                                cwd: projectPath
                            }, function node_apps_build_typescript_ts_callback(err:Error, stdout:string, stderr:string):void {
                                if (stdout !== "" && stdout.indexOf(` \u001b[91merror${text.none} `) > -1) {
                                    console.log(`${text.red}TypeScript reported warnings.${text.none}`);
                                    apps.errout([stdout]);
                                    return;
                                }
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (stderr !== "") {
                                    apps.errout([stderr]);
                                    return;
                                }
                                next(`${text.green}TypeScript build completed without warnings.${text.none}`);
                            });
                        };
                    heading("TypeScript Compilation");
                    node.fs.stat(`${projectPath}services.ts`, function node_apps_build_typescript_services(err:Error) {
                        if (err !== null) {
                            if (err.toString().indexOf("no such file or directory") > 0) {
                                flag.services = true;
                                if (flag.typescript === true) {
                                    next(`${text.angry}TypeScript code files not present.${text.none}`);
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
                                console.log(`${text.angry}TypeScript does not appear to be installed.${text.none}`);
                                flag.typescript = true;
                                if (flag.services === true) {
                                    next(`${text.angry}Install TypeScript with this command: ${text.green}npm install typescript -g${text.none}`);
                                }
                            } else {
                                apps.errout([err.toString(), stdout]);
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
                },
                // phase validation is merely a call to apps.validation
                validation: function node_apps_build_validation():void {
                    const callback = function node_apps_build_validation_callback(message:string):void {
                        next(message);
                    };
                    heading("Pretty Diff validation tests");
                    apps.validation(callback);
                }
            };
        next("");
    };
    // CLI commands documentation generator
    apps.commands = function node_apps_commands():void {
        const output:string[] = [];
        verbose = true;
        if (commands[process.argv[0]] === undefined) {
            // all commands in a list
            apps.lists({
                emptyline: false,
                heading: "Commands",
                obj: commands,
                property: "description",
                total: true
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
            apps.log(output, "", "");
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
                .readdir(item, function node_apps_copy_dir_readdir(er:Error, files:string[]):void {
                    const place:string = (item === start)
                        ? dest
                        : dest + item.replace(start + sep, "");
                    if (er !== null) {
                        util.eout(er);
                        return;
                    }
                    apps.makedir(place, function node_apps_copy_dir_readdir_makedir():void {
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
                callback: function node_apps_copy_callback() {
                    const out:string[] = ["Pretty Diff copied "];
                    out.push("");
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
                    apps.log([out.join(""), `Copied ${text.cyan + target + text.none} to ${text.green + destination + text.none}`], "", "");
                },
                exclusions: exclusions,
                destination: process.argv[1].replace(/(\\|\/)/g, sep),
                target: process.argv[0].replace(/(\\|\/)/g, sep)
            };
        }
        writeflag = target;
        target =  params.target.replace(/(\\|\/)/g, sep);
        destination = params.destination.replace(/(\\|\/)/g, sep);
        exlen = params.exclusions.length;
        dest          = node.path.resolve(destination) + sep;
        start         = node.path.resolve(target);
        util.stat(start, start);
    };
    // mode diff
    apps.diff = function node_apps_diff():void {
        if (options.diff === "" || options.source === "") {
            apps.errout([
                `Pretty Diff requires option ${text.angry}diff${text.none} and option ${text.angry}source${text.none} when using command diff. Example:`,
                `${text.cyan}prettydiff diff source:"myFile.js" diff:"myFile1.js"${text.none}`
            ]);
            return;
        }
        options.mode = "diff";
        apps.readMethod(false);
        apps.readMethod(true);
    };
    // similar to node's fs.readdir, but recursive
    apps.directory = function node_apps_directory(args:readDirectory):void {
        // arguments:
        // * callback - function - the output is passed into the callback as an argument
        // * exclusions - string array - a list of items to exclude
        // * path - string - where to start in the local file system
        // * recursive - boolean - if child directories should be scanned
        // * symbolic - boolean - if symbolic links should be identified
        let dirtest:boolean = false,
            size:number = 0,
            dirs:number = 0;
        const dircount:number[] = [],
            dirnames:string[] = [],
            listonly:boolean = (command === "directory" && process.argv.indexOf("listonly") > -1),
            type:boolean = (function node_apps_directory_typeof():boolean {
                const typeindex:number = process.argv.indexOf("typeof");
                if (command === "directory" && typeindex > -1) {
                    process.argv.splice(typeindex, 1);
                    return true;
                }
                return false;
            }()),
            startPath:string = (function node_apps_directory_startPath():string {
                if (command === "directory") {
                    const len:number = process.argv.length;
                    let a:number = 0;
                    args = {
                        callback: function node_apps_directory_startPath_callback(result:string[]|directoryList) {
                            const output:string[] = [];
                            if (verbose === true) {
                                apps.wrapit(output, `Pretty Diff found ${text.green + apps.commas(result.length) + text.none} matching items from address ${text.cyan + startPath + text.none} with a total file size of ${text.green + apps.commas(size) + text.none} bytes.`);
                            }
                            apps.log(output, JSON.stringify(result), node.path.resolve(process.argv[0]));
                        },
                        exclusions: exclusions,
                        path: "",
                        recursive: (process.argv.indexOf("shallow") > -1)
                            ? (function node_apps_directory_startPath_recursive():boolean {
                                process.argv.splice(process.argv.indexOf("shallow"), 1);
                                return false;
                            }())
                            : true,
                        symbolic: (process.argv.indexOf("symbolic") > -1)
                            ? (function node_apps_directory_startPath_symbolic():boolean {
                                process.argv.splice(process.argv.indexOf("symbolic"), 1);
                                return true;
                            }())
                            : false
                    };
                    if (process.argv.length < 1) {
                        apps.errout([
                            "No path supplied for the directory command. For an example please see:",
                            `    ${text.cyan}prettydiff commands directory${text.none}`
                        ]);
                        return "";
                    }
                    do {
                        if (process.argv[a].indexOf("source:") === 0) {
                            return node.path.resolve(process.argv[a].replace(/source:("|')?/, "").replace(/("|')$/, ""));
                        }
                        a = a + 1;
                    } while (a < len);
                    return node.path.resolve(process.argv[0]);
                }
                return node.path.resolve(args.path);
            }()),
            list:directoryList = [],
            filelist:string[] = [],
            method:string = (args.symbolic === true)
                ? "lstat"
                : "stat",
            dirCounter = function node_apps_directory_dirCounter(item:string):void {
                let dirlist:string[] = item.split(sep),
                    dirpath:string = "",
                    index:number = 0;
                dirlist.pop();
                dirpath = dirlist.join(sep);
                index = dirnames.indexOf(dirpath);
                dircount[index] = dircount[index] - 1;
                if (dircount[index] < 1) {
                    // dircount and dirnames are parallel arrays
                    dircount.splice(index, 1);
                    dirnames.splice(index, 1);
                    dirs = dirs - 1;
                    if (dirs < 1) {
                        if (listonly === true) {
                            args.callback(filelist.sort());
                        } else {
                            args.callback(list);
                        }
                    } else {
                        node_apps_directory_dirCounter(dirpath);
                    }
                }
            },
            statWrapper = function node_apps_directory_wrapper(filepath:string, parent:number):void {
                node.fs[method](filepath, function node_apps_directory_wrapper_stat(er:Error, stat:Stats):void {
                    const angrypath:string = `Filepath ${text.angry + filepath + text.none} is not a file or directory.`,
                        dir = function node_apps_directory_wrapper_stat_dir(item:string):void {
                            node.fs.readdir(item, {encoding: "utf8"}, function node_apps_directory_wrapper_stat_dir_readdirs(erd:Error, files:string[]):void {
                                if (erd !== null) {
                                    apps.errout([erd.toString()]);
                                    return;
                                }
                                const index:number = list.length;
                                if (listonly === true) {
                                    filelist.push(item);
                                } else {
                                    list.push([item, "directory", parent, files.length, stat]);
                                }
                                if (files.length < 1) {
                                    dirCounter(item);
                                } else {
                                    // dircount and dirnames are parallel arrays
                                    dircount.push(files.length);
                                    dirnames.push(item);
                                    dirs = dirs + 1;
                                }
                                files.forEach(function node_apps_directory_wrapper_stat_dir_readdirs_each(value:string):void {
                                    node_apps_directory_wrapper(item + sep + value, index);
                                });
                            });
                        },
                        populate = function node_apps_directory_wrapper_stat_populate(type:"link"|"file"|"directory"):void {
                            if (exclusions.indexOf(filepath.replace(startPath + sep, "")) < 0) {
                                if (listonly === true) {
                                    filelist.push(filepath);
                                } else {
                                    list.push([filepath, type, parent, 0, stat]);
                                }
                            }
                            if (dirs > 0) {
                                dirCounter(filepath);
                            } else {
                                if (listonly === true) {
                                    args.callback(filelist.sort());
                                } else {
                                    args.callback(list);
                                }
                            }
                        };
                    if (er !== null) {
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            if (errorflag === true) {
                                args.callback([]);
                                return;
                            }
                            if (type === true) {
                                apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`], "",  "");
                                return;
                            }
                            apps.errout([angrypath]);
                            return;
                        }
                        apps.errout([er.toString()]);
                        return;
                    }
                    if (stat === undefined) {
                        if (type === true) {
                            apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`], "", "");
                            return;
                        }
                        apps.errout([angrypath]);
                        return;
                    }
                    if (stat.isDirectory() === true) {
                        if (type === true) {
                            apps.log(["directory"], "", "");
                            return;
                        }
                        if ((args.recursive === true || dirtest === false) && exclusions.indexOf(filepath.replace(startPath + sep, "")) < 0) {
                            dirtest = true;
                            dir(filepath);
                        } else {
                            populate("directory");
                        }
                    } else if (stat.isSymbolicLink() === true) {
                        if (type === true) {
                            apps.log(["symbolicLink"], "", "");
                            return;
                        }
                        populate("link");
                    } else if (stat.isFile() === true || stat.isBlockDevice() === true || stat.isCharacterDevice() === true) {
                        if (type === true) {
                            if (stat.isBlockDevice() === true) {
                                apps.log(["blockDevice"], "", "");
                            } else if (stat.isCharacterDevice() === true) {
                                apps.log(["characterDevice"], "", "");
                            } else {
                                apps.log(["file"], "", "");
                            }
                            return;
                        }
                        size = size + stat.size;
                        populate("file");
                    } else {
                        if (type === true) {
                            if (stat.isFIFO() === true) {
                                apps.log(["FIFO"], "", "");
                            } else if (stat.isSocket() === true) {
                                apps.log(["socket"], "", "");
                            } else {
                                apps.log(["unknown"], "", "");
                            }
                            return;
                        }
                        list[parent][3] = list[parent][3] - 1;
                    }
                });
            };
        statWrapper(startPath, 0);
    };
    // uniform error formatting
    apps.errout = function node_apps_errout(errtext:string[]):void {
        const bell = function node_apps_errout_bell():void {
                apps.humantime(true);
                if (command === "build" || command === "simulation" || command === "test" || command === "validation") {
                    console.log("\u0007"); // bell sound
                } else {
                    console.log("");
                }
                if (command !== "prettydiff_debug") {
                    process.exit(1);
                }
            },
            error = function node_apps_errout_error():void {
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
                bell();
            },
            debug = function node_apps_errout_debug():void {
                const stack:string = new Error().stack,
                    source:string = options.source,
                    diff:string = options.diff,
                    totalmem:number = node.os.totalmem(),
                    freemem:number = node.os.freemem();
                delete options.source;
                delete options.diff;
                console.log("");
                console.log("---");
                console.log("");
                console.log("");
                console.log("# Pretty Diff - Debug Report");
                console.log("");
                console.log(`${text.green}## Error Message${text.none}`);
                if (errtext[0] === "" && errtext.length < 2) {
                    console.log(`${text.yellow}No error message supplied${text.none}`);
                } else {
                    console.log("```");
                    errtext.forEach(function node_apps_errout_debug_each(value:string):void {
                        // eslint-disable-next-line
                        console.log(value.replace(/\u001b/g, "\\u001b"));
                    });
                    console.log("```");
                }
                console.log("");
                console.log(`${text.green}## Stack Trace${text.none}`);
                console.log("```");
                console.log(stack.replace(/\s*Error\s+/, "    "));
                console.log("```");
                console.log("");
                console.log(`${text.green}## Environment${text.none}`);
                console.log(`* OS - **${node.os.platform()} ${node.os.release()}**`);
                console.log(`* Mem - ${apps.commas(totalmem)} - ${apps.commas(freemem)} = **${apps.commas(totalmem - freemem)}**`);
                console.log(`* CPU - ${node.os.arch()} ${node.os.cpus().length} cores`);
                console.log("");
                console.log(`${text.green}## Command Line Instruction${text.none}`);
                console.log("```");
                console.log(cli);
                console.log("```");
                console.log("");
                if (command === "beautify" || command === "diff" || command === "minify" || command === "parse") {
                    console.log(`${text.green}## Source Sample${text.none}`);
                    console.log("```");
                    console.log(source);
                    console.log("```");
                    console.log("");
                } else {
                    delete options.parsed;
                }
                if (command === "diff") {
                    console.log(`${text.green}## Diff Sample${text.none}`);
                    console.log("```");
                    console.log(diff);
                    console.log("```");
                    console.log("");
                }
                console.log(`${text.green}## Options${text.none}`);
                console.log("```");
                console.log(options);
                console.log("```");
                console.log("");
                console.log(`${text.green}## Time${text.none}`);
                bell();
            };
        errorflag = true;
        if (writeflag !== "") {
            apps.remove(writeflag, error);
            writeflag = "";
        } else if (process.argv.indexOf("prettydiff_debug") > -1) {
            debug();
        } else {
            error();
        }
    };
    // http(s) get function
    apps.get = function node_apps_get(address:string, flag:"source"|"diff", callback:Function|null):void {
        if (command === "get") {
            address = process.argv[0];
        }
        if (address === undefined) {
            apps.errout([
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan}prettydiff commands get${text.none} for examples.`
            ]);
            return;
        }
        let file:string = "";
        const scheme:string = (address.indexOf("https") === 0)
                ? "https"
                : "http";
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
                        if (verbose === true) {
                            console.log(`${res.statusCode} ${node.http.STATUS_CODES[res.statusCode]} - ${address}`);
                        }
                        process.argv[0] = res.headers.location;
                        address = process.argv[0];
                        apps.get(address, flag, callback);
                        return;
                    }
                    apps.errout([`${scheme}.get failed with status code ${res.statusCode}`]);
                    return;
                }
                if (command === "get") {
                    apps.log([""], file.toString(), "");
                } else if (callback !== null) {
                    callback(file);
                }
            });
        });
    };
    // hash utility for strings or files
    apps.hash = function node_apps_hash(filepath:string):void {
        let limit:number = 0,
            shortlimit:number = 0,
            hashlist:boolean = false;
        const http:RegExp = (/^https?:\/\//),
            dirComplete = function node_apps_hash_dirComplete(list:directoryList):void {
                let a:number = 0,
                    c:number = 0;
                const listlen:number = list.length,
                    listObject:any = {},
                    hashes:string[] = [],
                    hashComplete = function node_apps_hash_dirComplete_hashComplete():void {
                        const hash:Hash = node.crypto.createHash("sha512");
                        let hashstring:string = "";
                        if (verbose === true) {
                            console.log(`${apps.humantime(false)}File hashing complete. Working on a final hash to represent the directory structure.`);
                        }
                        hash.update(hashes.join(""));
                        hashstring = (hashlist === true)
                            ? JSON.stringify(listObject)
                            : hash.digest("hex").replace(/\s+$/, "");
                        if (verbose === true) {
                            apps.log([`Pretty Diff hashed ${text.cyan + filepath + text.none}`], hashstring, filepath);
                        }else{
                            apps.log([""], hashstring, filepath);
                        }
                    },
                    hashback = function node_apps_hash_dirComplete_hashback(data:readFile, item:string|Buffer, callback:Function):void {
                        const hash:Hash = node.crypto.createHash("sha512");
                        hash.on("readable", function node_apps_hash_dirComplete_hashback_hash():void {
                            let hashstring:string = "";
                            const hashdata:Buffer = <Buffer>hash.read();
                            if (hashdata !== null) {
                                hashstring = hashdata.toString("hex").replace(/\s+/g, "");
                                callback(hashstring, data.index);
                            }
                        });
                        hash.write(item);
                        hash.end();
                        if (http.test(filepath) === true) {
                            apps.remove(data.path, function node_apps_hash_dirComplete_hashback_hash_remove():boolean {
                                return true;
                            });
                        }
                    },
                    typeHash = function node_apps_hash_dirComplete_typeHash(index:number, end:number) {
                        const terminate = function node_apps_hash_dirComplete_typeHash_terminate():void {
                            c = c + 1;
                            if (c === end) {
                                if (a === listlen) {
                                    hashComplete();
                                } else {
                                    if (verbose === true) {
                                        console.log(`${apps.humantime(false)}${text.green + apps.commas(a) + text.none} files hashed so far...`);
                                    }
                                    c = 0;
                                    recurse();
                                }
                            }
                        };
                        if (list[index][1] === "directory" || list[index][1] === "link") {
                            const hash:Hash = node.crypto.createHash("sha512");
                            hash.update(list[index][0]);
                            if (hashlist === true) {
                                listObject[list[index][0]] = hash.digest("hex");
                            } else {
                                hashes[index] = hash.digest("hex");
                            }
                            terminate();
                        } else {
                            apps.readFile({
                                path: list[index][0],
                                stat: list[index][4],
                                index: index,
                                callback: function node_apps_hash_dirComplete_typehash_callback(data:readFile, item:string|Buffer):void {
                                    hashback(data, item, function node_apps_hash_dirComplete_typeHash_callback_hashback(hashstring:string, item:number) {
                                        hashes[item[0]] = hashstring;
                                        if (hashlist === true) {
                                            listObject[data.path] = hashstring;
                                        } else {
                                            hashes[item[0]] = hashstring;
                                        }
                                        terminate();
                                    });
                                }
                            });
                        }
                    },
                    recurse = function node_apps_hash_dirComplete_recurse():void {
                        let b = 0,
                            end = (listlen - a < shortlimit)
                                ? listlen - a
                                : shortlimit;
                        do {
                            typeHash(a, end);
                            a = a + 1;
                            b = b + 1;
                        } while (b < shortlimit && a < listlen);
                    },
                    sorty = function node_apps_hash_dirComplete_sorty(a:directoryItem, b:directoryItem) {
                        if (a[0] < b[0]) {
                            return -1;
                        }
                        return 1;
                    };
                list.sort(sorty);
                if (verbose === true) {
                    console.log(`${apps.humantime(false)}Completed analyzing the directory tree in the file system and found ${text.green + apps.commas(listlen) + text.none} file system objects.`);
                }
                if (limit < 1 || listlen < limit) {
                    do {
                        if (list[a][1] === "directory" || list[a][1] === "link") {
                            const hash:Hash = node.crypto.createHash("sha512");
                            hash.update(list[a][0]);
                            if (hashlist === true) {
                                listObject[list[a][0]] = hash.digest("hex");
                            } else {
                                hashes[a] = hash.digest("hex");
                            }
                            c = c + 1;
                            if (c === listlen) {
                                hashComplete();
                            }
                        } else {
                            apps.readFile({
                                path: list[a][0],
                                stat: list[a][4],
                                index: a,
                                callback: function node_apps_hash_dirComplete_file(data:readFile, item:string|Buffer):void {
                                    hashback(data, item, function node_apps_hash_dirComplete_file_hashback(hashstring:string, item:number):void {
                                        if (hashlist === true) {
                                            listObject[data.path] = hashstring;
                                        } else {
                                            hashes[item[0]] = hashstring;
                                        }
                                        c = c + 1;
                                        if (c === listlen) {
                                            hashComplete();
                                        }
                                    });
                                }
                            });
                        }
                        a = a + 1;
                    } while (a < listlen);
                } else {
                    if (verbose === true) {
                        console.log(`Due to a ulimit setting of ${text.angry + apps.commas(limit) + text.none} Pretty Diff will read only ${text.cyan + apps.commas(shortlimit) + text.none} files at a time.`);
                        console.log("");
                    }
                    recurse();
                }
            };
        if (command === "hash") {
            const listIndex:number = process.argv.indexOf("list");
            if (process.argv[0] === undefined) {
                apps.errout([`Command ${text.cyan}hash${text.none} requires some form of address of something to analyze, ${text.angry}but no address is provided${text.none}.`]);
                return;
            }
            if (process.argv.indexOf("string") > -1) {
                const hash:Hash = node.crypto.createHash("sha512");
                process.argv.splice(process.argv.indexOf("string"), 1);
                hash.update(process.argv[0]);
                apps.log([""], hash.digest("hex"), "");
                return;
            }
            if (listIndex > -1 && process.argv.length > 1) {
                hashlist = true;
                process.argv.splice(listIndex, 1);
            }
            filepath = process.argv[0];
            if (http.test(filepath) === false) {
                filepath = node.path.resolve(process.argv[0]);
            }
        }
        if (http.test(filepath) === true) {
            apps.get(filepath, "source", function node_apps_hash_get(filedata:string) {
                const hash:Hash = node.crypto.createHash("sha512");
                hash.update(filedata);
                apps.log([""], hash.digest("hex"), filepath);
            });
        } else {
            node.child("ulimit -n", function node_apps_hash_ulimit(uerr:Error, uout:string) {
                if (uerr === null && uout !== "unlimited" && isNaN(Number(uout)) === false) {
                    limit = Number(uout);
                    shortlimit = Math.ceil(limit / 5);
                }
                apps.directory({
                    callback: function node_apps_hash_localCallback(list:directoryList) {
                        dirComplete(list);
                    },
                    exclusions: exclusions,
                    path: filepath,
                    recursive: true,
                    symbolic: true
                });
            });
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
        apps.log(output, "", "");
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
                if (strSplit.length > 1) {
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
                }
                return `${strSplit[0]}`;
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
            plural       = function node_apps_humantime_plural(x:number, y:string):string {
                if (x !== 1) {
                    return `${numberString(x) + y}s `;
                }
                return `${numberString(x) + y} `;
            },
            minute       = function node_apps_humantime_minute():void {
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
                        : `${numberString(minutes)} seconds `
                    : numberString(minutes);
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
            // pad single digit seconds with a 0
            if ((/^([0-9]\.)/).test(secondString) === true) {
                secondString = `0${secondString}`;
            }
        }
        return `${text.cyan}[${hourString}:${minuteString}:${secondString}]${text.none} `;
    };
    // wrapper for ESLint usage
    apps.lint = function node_apps_lint(callback:Function):void {
        node.child("eslint", function node_apps_lint_eslintCheck(eserr:Error) {
            const lintpath:string = (command === "lint" && process.argv[0] !== undefined)
                ? node.path.resolve(process.argv[0])
                : js;
            if (eserr !== null) {
                console.log("ESLint is not globally installed or is corrupt.");
                console.log(`Install ESLint using the command: ${text.green}npm install eslint -g${text.none}`);
                console.log("");
                if (callback !== undefined) {
                    callback("Skipping code validation...");
                } else {
                    console.log("Skipping code validation...");
                }
                return;
            }
            if (command === "lint") {
                verbose = true;
                callback = function node_apps_lint_eslintCheck_callback():void {
                    apps.log([`Lint complete for ${lintpath}`], "", lintpath);
                };
            }
            (function node_apps_lint_eslintCheck_getFiles():void {
                const lintrun         = function node_apps_lint_eslintCheck_getFiles_lintrun(list:directoryList) {
                    let filesRead:number = 0,
                        filesLinted:number = 0,
                        a:number = 0,
                        first:boolean = false;
                    const len = list.length,
                        lintit = function node_apps_lint_eslintCheck_getFiles_lintrun_lintit(val:string):void {
                            console.log(`${apps.humantime(false)}Starting lint: ${val}`);
                            filesRead = filesRead + 1;
                            node.child(`eslint ${val}`, {
                                cwd: projectPath
                            }, function node_apps_lint_eslintCheck_getFiles_lintrun_lintit_eslint(err:Error, stdout:string, stderr:string) {
                                if (stdout === "" || stdout.indexOf("0:0  warning  File ignored because of a matching ignore pattern.") > -1) {
                                    if (err !== null) {
                                        apps.errout([err.toString()]);
                                        return;
                                    }
                                    if (stderr !== null && stderr !== "") {
                                        apps.errout([stderr]);
                                        return;
                                    }
                                    filesLinted = filesLinted + 1;
                                    if (first === false) {
                                        first = true;
                                        console.log("");
                                    }
                                    console.log(`${apps.humantime(false) + text.green}Lint ${filesLinted} passed:${text.none} ${val}`);
                                    if (filesRead === filesLinted) {
                                        console.log("");
                                        if (callback !== undefined) {
                                            callback(`${text.green}Lint complete for ${filesLinted} files!${text.none}`);
                                        } else {
                                            console.log(`${text.green}Lint complete for ${filesLinted} files!${text.none}`);
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
                    console.log(`${apps.humantime(false)}Linting files...`);
                    console.log("");
                    do {
                        if (list[a][1] === "file" && (/\.js$/).test(list[a][0]) === true) {
                            lintit(list[a][0]);
                        }
                        a = a + 1;
                    } while (a < len);
                };
                console.log(`${apps.humantime(false)}Gathering JavaScript files from directory: ${text.green + lintpath + text.none}`);
                apps.directory({
                    callback: lintrun,
                    exclusions: (command === "lint" && process.argv[0] !== undefined)
                        ? exclusions
                        : [],
                    path      : lintpath,
                    recursive: true,
                    symbolic: false
                });
            }());
        });
    };
    // CLI string output formatting for lists of items
    apps.lists = function node_apps_lists(lists:nodeLists):void {
        // * lists.emptyline - boolean - if each key should be separated by an empty line
        // * lists.heading   - string  - a text heading to precede the list
        // * lists.obj       - object  - an object to traverse
        // * lists.property  - string  - The child property to read from or "eachkey" to
        // * lists.total     - number  - To display a count
        // access a directly assigned primitive
        const keys:string[] = Object.keys(lists.obj).sort(),
            output:string[] = [],
            lenn:number = keys.length,
            plural = (lenn === 1)
                ? ""
                : "s",
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
                        apps.wrapit(output, `   ${text.angry}- ${text.none + text.cyan + comm + text.none}: ${lists.obj.values[keylist[b]]}`);
                    } else {
                        // list all items
                        if (lists.property === "eachkey") {
                            if (command === "options" && keylist[b] === "values") {
                                // "values" keyname of options
                                output.push(`${text.angry}* ${text.none + text.cyan + comm + text.none}:`);
                                node_apps_lists_displayKeys(command, Object.keys(lists.obj.values).sort());
                            } else {
                                // all items keys and their primitive value
                                apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.none}: ${lists.obj[keylist[b]]}`);
                            }
                        } else {
                            // a list by key and specified property
                            apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.none}: ${lists.obj[keylist[b]][lists.property]}`);
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
            output.push("");
            output.push(`Commands are tested using the ${text.green}simulation${text.none} command.`);
        } else if (command === "options" && lists.total === true) {
            output.push(`${text.green + lenn + text.none} matching option${plural}.`);
        }
        apps.log(output, "", "");
    };
    // verbose metadata printed to the shell about Pretty Diff
    apps.log = function node_apps_log(output:string[], code:string, path:string):void {
        const tense:string = (function node_apps_log_tense():string {
                if (command === "beautify") {
                    return "Beautified";
                }
                if (command === "minify") {
                    return "Minified";
                }
                if (command === "parse") {
                    return "Parsed";
                }
                return "";
            }()),
            diffOutput = function node_apps_log_diff() {
                const count:string[] = path.split(","),
                    plural:[string, string] = ["", ""];
                if (count[0] !== "1") {
                    plural[0] = "s";
                }
                if (count[1] !== "1") {
                    plural[1] = "s";
                }
                if (options.diff_format === "text" && code === "") {
                    output.push(`${text.green}Pretty Diff found no differences.${text.none}`);
                } else {
                    output.push("");
                    output.push(`Pretty Diff found ${text.cyan + count[0] + text.none} difference${plural[0]} on ${text.cyan + count[1] + text.none} line${plural[1]}.`);
                }
            },
            conclusion = function node_apps_log_conclusion():void {
                if (process.argv.indexOf("debug") > -1 || process.argv.indexOf("prettydiff_debug") > -1) {
                    process.argv[2] = "prettydiff_debug";
                    return apps.errout(["Debug statement requested."]);
                }
                if (verbose === true && (output.length > 1 || output[0] !== "")) {
                    console.log("");
                }
                if (output[output.length - 1] === "") {
                    output.pop();
                }
                output.forEach(function node_apps_log_conclusion_each(value:string) {
                    console.log(value);
                });
                if (verbose === true) {
                    console.log("");
                    console.log(`Sparser version ${text.angry + prettydiff.version.parse + text.none}`);
                    console.log(`Pretty Diff version ${text.angry + prettydiff.version.number + text.none} dated ${text.cyan + prettydiff.version.date + text.none}`);
                    apps.humantime(true);
                }
            };
        if (performance.test === true) {
            performance.end = process.hrtime(performance.start);
            const time = (performance.end[0] * 1e9) + performance.end[1];
            performance.store.push(time);
            if (performance.index > 0) {
                if (performance.index < 10) {
                    console.log(`${text.yellow + performance.index + text.none}:  ${time}`);
                } else {
                    console.log(`${text.yellow + performance.index + text.none}: ${time}`);
                }
            } else {
                console.log(`${text.yellow}0:${text.none}  ${time} ${text.angry}(first run is ignored)${text.none}`);
            }
            options.diff = performance.diff;
            options.source = performance.source;
            performance.codeLength = code.length;
            performance.index = performance.index + 1;
            // specifying a delay between intervals allows for garbage collection without interference to the performance testing
            setTimeout(apps.performance, 400);
            return;
        }
        if (command === "diff" && options.read_method !== "directory" && options.read_method !== "subdirectory") {
            diffOutput();
        } else if (verbose === true && tense !== "" && command !== "performance") {
            if (options.read_method === "screen") {
                output.push(`${tense} input from terminal.`);
            } else if (verbose === true && options.read_method === "file") {
                output.push(`${tense} input from file ${text.cyan + path + text.none}`);
            }
        }
        if (code !== "") {
            if (options.output === "" || options.output === undefined) {
                console.log(code);
                conclusion();
            } else {
                const out:string = node.path.resolve(options.output);
                node.fs.writeFile(out, code, function node_apps_log_writeFile(err:Error):void {
                    if (err !== null) {
                        apps.errout([err.toString()]);
                        return;
                    }
                    output.push(`Wrote output to ${text.green + out + text.none} at ${text.green + apps.commas(code.length) + text.none} characters.`);
                    conclusion();
                });
            }
        } else if (code === "" || options.output === "") {
            conclusion();
        }
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
    // handler for the minify command
    apps.minify = function node_apps_minify():void {
        options.mode = "minify";
        apps.readMethod(false);
    };
    // CLI documentation for supported Pretty Diff options
    apps.options = function node_apps_options():void {
        const def:optionDef = prettydiff.api.optionDef;
        if (def[process.argv[0]] === undefined) {
            if (process.argv.length < 1) {
                // all options in a list
                apps.lists({
                    emptyline: true,
                    heading: "Options",
                    obj: def,
                    property: "definition",
                    total: true
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
                    value:string = "",
                    isArray:boolean = false;
                do {
                    namevalue(process.argv[a]);
                    b = 0;
                    do {
                        isArray = Array.isArray(def[keys[b]][name]);
                        if (def[keys[b]][name] === undefined || (isArray === true && def[keys[b]][name].indexOf(value) < 0) || (isArray === false && value !== "" && def[keys[b]][name] !== value)) {
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
                    apps.log([`${text.angry}Pretty Diff has no options matching the query criteria.${text.none}`], "", "");
                } else {
                    apps.lists({
                        emptyline: true,
                        heading: "Options",
                        obj: output,
                        property: "definition",
                        total: true
                    });
                }
            }
        } else {
            // specificly mentioned option
            apps.lists({
                emptyLine: false,
                heading: `Option: ${text.green + process.argv[0] + text.none}`,
                obj: def[process.argv[0]],
                property: "eachkey",
                total: false
            });
        }
        verbose = true;
        apps.log([""], "");
    };
    // handler for the parse command
    apps.parse = function node_apps_parse():void {
        if (options.parse_format === "table") {
            verbose = true;
        }
        options.mode = "parse";
        apps.readMethod(false);
    };
    // handler for the performance command
    apps.performance = function node_apps_performance():void {
        if (performance.test === false) {
            if (process.argv.length < 1) {
                return apps.errout([
                    `The ${text.angry}performance${text.none} command requires a Pretty Diff command to performance test.`,
                    `Example: ${text.cyan}prettydiff performance ${text.bold}beautify js/services.js${text.none}`,
                    "",
                    `See available commands with ${text.cyan}prettydiff commands${text.none}`
                ]);
            }
            command = process.argv[0];
            if (command === "build") {
                apps.errout(["The performance tool cannot test the build command.  This creates too much noise and potential for corruption."]);
                return;
            }
            if (command === "performance") {
                apps.errout(["The performance tool cannot test itself.  This creates an endless loop."]);
                return;
            }
            if (commands[command] === undefined) {
                apps.errout([`Command ${text.angry + command + text.none} is not defined.`]);
                return;
            }
            console.log("");
            console.log(`${text.bold}Pretty Diff - Performance Test Tool${text.none}`);
            console.log(`There is a ${text.cyan}400ms delay between intervals${text.none} to allow for garbage collection to complete before adversely impacting the next test cycle.`);
            console.log("");
            performance.diff = options.diff;
            performance.source = options.source;
            performance.test = true;
            verbose = false;
            process.argv.splice(0, 1);
        }
        if (performance.index < 11) {
            performance.start = process.hrtime();
            apps[command]();
        } else {
            let total:number = 0,
                low:number = 0,
                high:number = 0;
            console.log("");
            performance.store.forEach(function node_apps_performance_total(value:number) {
                total = total + value;
                if (value > high) {
                    high = value;
                } else if (value < low) {
                    low = value;
                }
            });
            performance.test = false;
            verbose = true;
            command = "performance";
            apps.log([
                    `[${text.bold + text.green + (total / 1e7) + text.none}] Milliseconds, \u00b1${text.cyan + ((((high - low) / total) / 2) * 100).toFixed(2) + text.none}%`,
                    `[${text.cyan + apps.commas(performance.codeLength) + text.none}] Character size of task's output to terminal.`
                ], "", "");
        }
    };
    // for testing the debug report generation
    // * the debug report is a markdown report for posting online
    // to aid with troubleshooting a defect
    apps.prettydiff_debug = function node_apps_debug():void {
        process.argv.push("prettydiff_debug");
        apps.errout(["Debug Command"]);
    };
    // similar to node's fs.readFile, but determines if the file is binary or text so that it can create either a buffer or text dump
    apps.readFile = function node_apps_readFile(args:readFile):void {
        // arguments
        // * callback - function - What to do next, the file data is passed into the callback as an argument
        // * index - number - if the file is opened as a part of a directory operation then the index represents the index out of the entire directory list
        // * path - string - the file to open
        // * stat - Stats - the Stats object for the given file
        node
            .fs
            .open(args.path, "r", function node_apps_readFile_file_open(ero:Error, fd:number):void {
                const failure = function node_apps_readFile_file_open_failure(message:string) {
                        if (args.index > 0) {
                            apps.errout([
                                `Failed after ${args.index} files.`,
                                message
                            ]);
                        } else {
                            apps.errout([message]);
                        }
                    },
                    msize = (args.stat.size < 100)
                        ? args.stat.size
                        : 100;
                let buff  = Buffer.alloc(msize);
                if (ero !== null) {
                    failure(ero.toString());
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
                        function node_apps_readFile_file_open_read(erra:Error, bytesa:number, buffera:Buffer):number {
                            let bstring:string = "";
                            if (erra !== null) {
                                failure(erra.toString());
                                return;
                            }
                            bstring = buffera.toString("utf8", 0, buffera.length);
                            bstring = bstring.slice(2, bstring.length - 2);
                            if (options.binary_check.test(bstring) === true) {
                                buff = Buffer.alloc(args.stat.size);
                                node
                                    .fs
                                    .read(
                                        fd,
                                        buff,
                                        0,
                                        args.stat.size,
                                        0,
                                        function node_apps_readFile_file_open_read_readBinary(errb:Error, bytesb:number, bufferb:Buffer):void {
                                            if (errb !== null) {
                                                failure(errb.toString());
                                                return;
                                            }
                                            if (bytesb > 0) {
                                                node.fs.close(fd, function node_apps_readFile_file_open_read_readBinary_close():void {
                                                    args.callback(args, bufferb);
                                                });
                                            }
                                        }
                                    );
                            } else {
                                node
                                    .fs
                                    .readFile(args.path, {
                                        encoding: "utf8"
                                    }, function node_apps_readFile_file_open_read_readFile(errc:Error, dump:string):void {
                                        if (errc !== null && errc !== undefined) {
                                            failure(errc.toString());
                                            return;
                                        }
                                        node.fs.close(fd, function node_apps_readFile_file_open_read_readFile_close() {
                                            args.callback(args, dump);
                                        });
                                    });
                            }
                            return bytesa;
                        }
                    );
            });
    };
    // processes Pretty Diff mode commands, the primary functionality
    apps.readMethod = function node_apps_readMethod(diff:boolean):void {
        if (options.source === "") {
            apps.errout([
                `Pretty Diff requires option ${text.cyan}source${text.none} when using command ${text.green + command + text.none}. Example:`,
                `${text.cyan}prettydiff ${command} source:"myFile.js"${text.none}`
            ]);
            return;
        }
        if (options.language === "text" && options.mode !== "diff") {
            apps.errout([`Language value ${text.angry}text${text.none} is not compatible with command ${text.green + command + text.none}.`]);
            return;
        }
        let rcdata:Object = {};
        const item:string = (diff === true)
                ? "diff"
                : "source",
            def:optionDef = prettydiff.api.optionDef,
            prettydiffrc = function node_apps_readMethod_prettydiffrc(callback:Function):void {
                const keys:string[] = Object.keys(rcdata),
                    len:number = keys.length;
                let a:number = 0;
                if (len < 1) {
                    callback();
                    return;
                }
                do {
                    if (keys[a] !== "api" && keys[a] !== "source" && keys[a] !== "diff" && def[keys[a]] !== undefined && def[keys[a]].type === typeof rcdata[keys[a]]) {
                        if (def[keys[a]].values === undefined || def[keys[a]].values[rcdata[keys[a]]] !== undefined) {
                            options[keys[a]] = rcdata[keys[a]];
                        }
                    }
                    a = a + 1;
                } while (a < len);
                callback();
            },
            resolve = function node_apps_readMethod_resolve() {
                const screen = function node_apps_readMethod_resolve_screen():void {
                        diffStatus[item] = true;
                        if (options.mode === "diff") {
                            if (diffStatus.source === true && diffStatus.diff === true) {
                                prettydiffrc(function node_apps_readMethod_resolve_screen_diffrc():void {
                                    let meta:any = {
                                        differences: 0,
                                        lines: 0
                                    };
                                    const result:string = prettydiff(meta);
                                    apps.log([""], result, `${meta.differences},${meta.lines}`);
                                });
                            }
                        } else {
                            prettydiffrc(function node_apps_readMethod_resolve_screen_rc():void {
                                apps.log([""], prettydiff(), "");
                            });
                        }
                    },
                    createrc = function node_apps_readMethod_resolve_createrc(callback:Function):void {
                        const start:string = (options.config !== "")
                                ? options.config
                                : (callback === screen)
                                    ? process.cwd()
                                    : (options.read_method === "directory" || options.read_method === "subdirectory")
                                        ? node.path.resolve(options.source)
                                        : (function node_apps_readMethod_resolve_createrc_fileStart():string {
                                            const dirs:string[] = options.source.replace(/\\/g, "/").split("/");
                                            dirs.pop();
                                            return node.path.resolve(dirs.join(sep));
                                        }()),
                            stat = function node_apps_readMethod_resolve_createrc_wrapper(location:string) {
                                const rc:string = (start === options.config)
                                    ? start
                                    : `${location + sep}.prettydiffrc`;
                                node.fs.stat(rc, function node_apps_readMethod_resolve_createrc_wrapper_stat(ers:Error):void {
                                    if (ers !== null) {
                                        const erstring:string = ers.toString();
                                        if (erstring.indexOf("no such file or directory") > 0) {
                                            const locations:string[] = location.split(sep);
                                            if (locations.length < 2) {
                                                // continue silently if .prettydiffrc is not found
                                                callback();
                                            } else if (start !== options.config) {
                                                // try the parent directory if not at root
                                                locations.pop();
                                                node_apps_readMethod_resolve_createrc_wrapper(locations.join(sep));
                                            }
                                        } else {
                                            apps.errout([erstring]);
                                        }
                                        return;
                                    }
                                    node.fs.readFile(rc, "utf8", function node_apps_readMethod_resolve_createrc_wrapper_stat_read(err:Error, fileData:string):void {
                                        if (err !== null) {
                                            apps.errout([err.toString()]);
                                            return;
                                        }
                
                                        const nospace:string = fileData.replace(/\s+/g, "");
                                        
                                        // process .prettydiffrc as JSON
                                        if (nospace.charAt(0) === "{" && nospace.charAt(nospace.length - 1) === "}") {
                                            rcdata = JSON.parse(fileData);
                                            callback();
                                            return;
                                        }
                
                                        // process as JavaScript logic
                                        if (
                                            nospace.indexOf("constrclogic=functionrc_logic(options){") > 0 &&
                                            nospace.indexOf("returnoptions;};module.exports=rclogic;") > 0 &&
                                            nospace.indexOf("require") < 0 &&
                                            nospace.replace("returnoptions;};module.exports=rclogic;", "").indexOf("export") < 0 &&
                                            nospace.indexOf("import") < 0
                                        ) {
                                            const rcLogic:any = require(rc),
                                                defkeys:string[] = Object.keys(def),
                                                deflen:number = defkeys.length;
                                            let a:number = 0;
                                            do {
                                                if (options[defkeys[a]] !== def[defkeys[a]].default) {
                                                    rcdata[defkeys[a]] = options[defkeys[a]];
                                                } else {
                                                    rcdata[defkeys[a]] = def[defkeys[a]].default;
                                                }
                                                a = a + 1;
                                            } while (a < deflen);
                                            rcdata = rcLogic(rcdata);
                                            callback();
                                            return;
                                        }
                
                                        // ignoring .prettydiffrc file
                                        console.log(`${text.angry}Ignoring .prettydiffrc file.${text.none} The file is present, but not in a supported format.`);
                                        callback();
                                    });
                                });
                            };
                        if (diff === true) {
                            callback();
                            return;
                        }
                        if (options.config === "none") {
                            callback();
                        } else {
                            stat(start);
                        }
                    };
                if (options.read_method === "screen") {
                    createrc(screen);
                } else {
                    node.fs.stat(options[item], function node_apps_readMethod_resolve_stat(err:Error, stat:Stats):void {
                        const resolveItem = function node_apps_readMethod_resolve_stat_resolveItem() {
                            if (options.read_method === "directory" || options.read_method === "subdirectory") {
                                const callback_diff = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff(list:directoryList):void {
                                        diffStatus[item] = true;
                                        diffStore[item] = list;
                                        if (diffStatus.diff === true && diffStatus.source === true) {
                                            const fileStatus:any = {},
                                                output:string[] = [],
                                                dirs:any = {
                                                    diff: [],
                                                    source: []
                                                },
                                                files:any = {
                                                    diff: [],
                                                    source: []
                                                },
                                                fileStats:any = {},
                                                links:any = {
                                                    diff: [],
                                                    source: []
                                                },
                                                modified:string[] = [],
                                                start:any = {
                                                    diff: diffStore.diff[0][0] + sep,
                                                    source: diffStore.source[0][0] + sep
                                                },
                                                sort = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_sort(a, b):number {
                                                    if (a[1] > b[1]) {
                                                        return 1;
                                                    }
                                                    if (a[1] === b[1] && a[0] > b[0]) {
                                                        return 1;
                                                    }
                                                    return -1;
                                                },
                                                populate = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_populate(diffitem:"source"|"diff"):void {
                                                    let len:number = diffStore[diffitem].length,
                                                        aa:number = 1;
                                                    do {
                                                        if (diffStore[diffitem][aa][1] !== "directory") {
                                                            break;
                                                        }
                                                        dirs[diffitem].push(diffStore[diffitem][aa][0].replace(start[diffitem], ""));
                                                        aa = aa + 1;
                                                    } while (aa < len && diffStore[diffitem][aa][1] === "directory");
                                                    if (aa < len && diffStore[diffitem][aa][1] === "file") {
                                                        do {
                                                            if (diffStore[diffitem][aa][1] !== "file") {
                                                                break;
                                                            }
                                                            files[diffitem].push(diffStore[diffitem][aa][0].replace(start[diffitem], ""));
                                                            fileStats[diffStore[diffitem][aa][0]] = diffStore[diffitem][aa][4];
                                                            aa = aa + 1;
                                                        } while (aa < len && diffStore[diffitem][aa][1] === "file");
                                                    }
                                                    if (aa < len && diffStore[diffitem][aa][1] === "link") {
                                                        do {
                                                            if (diffStore[diffitem][aa][1] !== "link") {
                                                                break;
                                                            }
                                                            links[diffitem].push(diffStore[diffitem][aa][0].replace(start[diffitem], ""));
                                                            aa = aa + 1;
                                                        } while (aa < len && diffStore[diffitem][aa][1] === "link");
                                                    }
                                                },
                                                byType = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_byType(type:"directory"|"file"|"link"):void {
                                                    let del:string[] = [],
                                                        ins:string[] = [],
                                                        aa:number = 0,
                                                        dlen:number = del.length,
                                                        ilen:number = ins.length;
                                                    const formal = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_byType_formal(arr:string[]):string {
                                                        if (type === "directory") {
                                                            if (arr.length === 1) {
                                                                return "directory";
                                                            }
                                                            return "directories";
                                                        }
                                                        if (type === "file") {
                                                            if (arr.length === 1) {
                                                                return "file";
                                                            }
                                                            return "files";
                                                        }
                                                        if (arr.length === 1) {
                                                            return "symbolic link";
                                                        }
                                                        return "symbolic links";
                                                    };
                                                    if (type !== "directory") {
                                                        if (type === "file") {
                                                            options.source = files.source;
                                                            options.diff = files.diff;
                                                        } else {
                                                            options.source = links.source;
                                                            options.diff = links.diff;
                                                        }
                                                        json = JSON.parse(prettydiff.api.diffview(options)[0]).diff;
                                                        len = json.length;
                                                    }
                                                    if (len > 0) {
                                                        do {
                                                            if (json[aa][0] === "-") {
                                                                del.push(json[aa][1]);
                                                            } else if (json[aa][0] === "+") {
                                                                ins.push(json[aa][1]);
                                                            } else if (json[aa][0] === "r") {
                                                                del.push(json[aa][1]);
                                                                ins.push(json[aa][2]);
                                                            }
                                                            aa = aa + 1;
                                                        } while (aa < len);
                                                    }
                                                    dlen = del.length;
                                                    ilen = ins.length;
                                                    output.push(`${dlen} ${formal(del)} ${text.angry}deleted${text.none}.`);
                                                    if (dlen > 0) {
                                                        del.forEach(function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_byType_delEach(value:string):void {
                                                            output.push(`  ${text.angry}*${text.none} ${value}`);
                                                        });
                                                    }
                                                    output.push("");
                                                    output.push(`${ilen} ${formal(ins)} ${text.green + text.bold}inserted${text.none}.`);
                                                    if (ilen > 0) {
                                                        ins.forEach(function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_byType_insEach(value:string):void {
                                                            output.push(`  ${text.green + text.bold}*${text.none} ${value}`);
                                                        });
                                                    }
                                                    output.push("");
                                                },
                                                fileCompare = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_fileCompare(fileArgs:readFile, filedata:string|Buffer):void {
                                                    const fd:string = (typeof filedata === "string")
                                                        ? filedata
                                                        : filedata.toString("utf8");
                                                    let plural:string = "";
                                                    if (fileStatus[fileArgs.index] === undefined) {
                                                        fileStatus[fileArgs.index] = {
                                                            diff: "",
                                                            source: ""
                                                        };
                                                    }
                                                    if (fileArgs.path.indexOf(start.source) === 0) {
                                                        fileStatus[fileArgs.index].source = fd;
                                                    } else {
                                                        fileStatus[fileArgs.index].diff = fd;
                                                    }
                                                    if (fileStatus[fileArgs.index].source !== "" && fileStatus[fileArgs.index].diff !== "") {
                                                        b = b + 1;
                                                        if (fileStatus[fileArgs.index].source !== fileStatus[fileArgs.index].diff) {
                                                            modified.push(fileArgs.path);
                                                        }
                                                        if (b === len) {
                                                            len = modified.length;
                                                            if (len !== 1) {
                                                                plural = "s";
                                                            }
                                                            output.push(`${len} file${plural} ${text.cyan + text.bold}modified${text.none}.`);
                                                            if (len > 0) {
                                                                modified.forEach(function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_fileCompare_each(value:string) {
                                                                    output.push(`  ${text.cyan + text.bold}*${text.none} ${value}`);
                                                                });
                                                            }
                                                            if (options.output === "") {
                                                                apps.log(output, "", "");
                                                            } else {
                                                                apps.log([""], output, "");
                                                            }
                                                        }
                                                    }
                                                };
                                            let json:diffJSON,
                                                a:number = 0,
                                                b:number = 0,
                                                len:number = 0,
                                                readtest:boolean = false;
                                            diffStore.diff.sort(sort);
                                            diffStore.source.sort(sort);
                                            populate("diff");
                                            populate("source");
                                            options.diff_format = "json";
                                            options.source = dirs.source;
                                            options.diff = dirs.diff;
                                            json = JSON.parse(prettydiff.api.diffview(options)[0]).diff;
                                            len = json.length;
                                            
                                            if (options.read_method === "subdirectory") {
                                                const sanitize = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_sanitize(item_type:"source"|"diff", string_purge:string):void {
                                                    const arrays = function node_apps_readMethod_resolve_stat_resolveItem_callbackDiff_sanitize_arrays(arr:string[]):void {
                                                        let c:number = 0,
                                                            d:number = -1,
                                                            flen:number = arr.length;
                                                        if (flen < 1) {
                                                            return;
                                                        }
                                                        do {
                                                            if (d < 0 && arr[c].indexOf(string_purge) === 0) {
                                                                d = c;
                                                            } else if (d > -1 && arr[c].indexOf(string_purge) !== 0) {
                                                                arr.splice(d, c - d);
                                                                return;
                                                            }
                                                            c = c + 1;
                                                        } while (c < flen);
                                                        if (d > 0) {
                                                            arr.splice(d, c - d);
                                                        }
                                                    };
                                                    arrays(files[item_type]);
                                                    arrays(links[item_type]);
                                                };
                                                // File systems are tree structures, so this loop normalizes artificats against changes to directory structures.
                                                // If a directory is removed then indicate such without listing its thousands of descendant artifacts.
                                                do {
                                                    if (json[a][0] !== "=") {

                                                        // modify the directory lists
                                                        if (a < len - 1 && json[a + 1][1].indexOf(json[a][1] + sep) === 0) {
                                                            b = a;
                                                            do {
                                                                b = b + 1;
                                                            } while (b < len && json[b][1].indexOf(json[a][1] + sep) === 0);
                                                            len = len - (b - (a + 1));
                                                            json.splice(a + 1, b - (a + 1));
                                                        }

                                                        // modify the file and symbolic link lists
                                                        if (json[a][0] === "r") {
                                                            sanitize("source", json[a][1] + sep);
                                                            sanitize("diff", json[a][2] + sep);
                                                        } else if (json[a][0] === "+") {
                                                            sanitize("diff", json[a][1] + sep);
                                                        } else {
                                                            sanitize("source", json[a][1] + sep);
                                                        }
                                                    }
                                                    a = a + 1;
                                                } while (a < len);
                                                a = 0;
                                            }

                                            byType("directory");
                                            byType("link");
                                            byType("file");

                                            a = 0;
                                            b = 0;
                                            len = json.length;
                                            do {
                                                if (json[a][0] === "=") {
                                                    readtest = true;
                                                    apps.readFile({
                                                        callback: fileCompare,
                                                        index: a,
                                                        path: start.source + json[a][1],
                                                        stat: fileStats[start.source + json[a][1]]
                                                    });
                                                    apps.readFile({
                                                        callback: fileCompare,
                                                        index: a,
                                                        path: start.diff + json[a][1],
                                                        stat: fileStats[start.diff + json[a][1]]
                                                    });
                                                } else {
                                                    b = b + 1;
                                                }
                                                a = a + 1;
                                            } while (a < len);

                                            if (readtest === false) {
                                                output.push(`0 files ${text.cyan}modified${text.none}.`);
                                                if (options.output === "") {
                                                    apps.log(output, "", "");
                                                } else {
                                                    apps.log([""], output, "");
                                                }
                                            }
                                            
                                            // 1. inserted directories
                                            // 2. deleted directories
                                            // 3. inserted symlinks
                                            // 4. deleted symlinks
                                            // 5. inserted files
                                            // 6. deleted files
                                            // 7. diff of modified files
                                        }
                                    },
                                    callback_other = function node_apps_readMethod_resolve_stat_resolveItem_callbackOther(list:directoryList):void {
                                        const source:string = options.source.slice(0, options.source.lastIndexOf(sep) + 1),
                                            listlen:number = list.length,
                                            out:string = node.path.resolve(options.output),
                                            plural:string = (listlen === 1)
                                                ? ""
                                                : "s",
                                            parse:string = (options.mode === "parse")
                                                ? ".parse"
                                                : "",
                                            address = function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_address(addy:string, directory:boolean):string {
                                                if (directory === true) {
                                                    return out + sep + addy.replace(source, "");
                                                }
                                                return out + sep + addy.replace(source, "") + parse;
                                            },
                                            writeFile = function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_writeWrapper(itempath:string, dump:string|Buffer):void {
                                                node.fs.writeFile(itempath, dump, function ode_apps_readMethod_resolve_stat_resolveItem_callbackOther_writeWrapper_writeFile():void {
                                                    b = b + 1;
                                                    if (b === listlen) {
                                                        apps.log([`${text.green + c + text.none} file${plural} written to ${text.cyan + out + text.none}.`], "", "");
                                                    }
                                                });
                                            },
                                            readFiles = function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_readFiles():void {
                                                a = 0;
                                                do {
                                                    if (list[a][1] === "file") {
                                                        c = c + 1;
                                                        apps.readFile({
                                                            callback: function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_readFiles_callback(args:readFile, dump:string|Buffer):void {
                                                                if (typeof dump === "string") {
                                                                    prettydiffrc(function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_readFiles_callback_rc():void {
                                                                        options.source = dump;
                                                                        const result:string = prettydiff();
                                                                        if (result.indexOf("Error: ") === 0) {
                                                                            apps.errout([result.replace("Error: ", "")]);
                                                                            fail = true;
                                                                            return;
                                                                        }
                                                                        writeFile(address(args.path, false), result);
                                                                    });
                                                                } else {
                                                                    writeFile(address(args.path, false), dump);
                                                                }
                                                            },
                                                            index: a,
                                                            path: list[a][0],
                                                            stat: stat
                                                        });
                                                    } else {
                                                        b = b + 1;
                                                        if (b === listlen && c > 0) {
                                                            apps.log([`${text.green + c + text.none} file${plural} written to ${text.cyan + source + text.none}.`], "", "");
                                                        }
                                                    }
                                                    a = a + 1;
                                                } while (a < listlen && fail === false);
                                                if (c < 1) {
                                                    apps.log([`${text.green}0${text.none} files written to ${text.cyan + source + text.none}.`], "", "");
                                                }
                                            },
                                            makedir = function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_makedir():void {
                                                do {
                                                    if (list[a][1] === "directory") {
                                                        apps.makedir(address(list[a][0], true), function node_apps_readMethod_resolve_stat_resolveItem_callbackOther_makedir_callback():void {
                                                            if (a < listlen) {
                                                                node_apps_readMethod_resolve_stat_resolveItem_callbackOther_makedir();
                                                            } else {
                                                                readFiles();
                                                            }
                                                        });
                                                        a = a + 1;
                                                        return;
                                                    }
                                                    a = a + 1;
                                                } while (a < listlen);
                                                readFiles();
                                            };
                                        let a:number = 0,
                                            b:number = 0,
                                            c:number = 0,
                                            fail:boolean = false;
                                        options.output = "";
                                        makedir();
                                    };
                                apps.directory({
                                    callback:(options.mode === "diff")
                                        ? callback_diff
                                        : callback_other,
                                    exclusions: exclusions,
                                    path: options[item],
                                    recursive: (options.read_method === "auto" || options.read_method === "subdirectory"),
                                    symbolic: false
                                });
                            } else {
                                apps.readFile({
                                    callback: function node_apps_readMethod_resolve_stat_resolveItem_fileCallback(args:readFile, dump:string|Buffer):void {
                                        if (typeof dump === "string") {
                                            options[item] = dump;
                                            diffStatus[item] = true;
                                            if (options.mode !== "diff" || (diffStatus.diff === true && diffStatus.source === true)) {
                                                prettydiffrc(function node_apps_readMethod_resolve_stat_resolveItem_fileCallback_diffrc():void {
                                                    let meta:any = {
                                                            differences: 0,
                                                            lines: 0
                                                        };
                                                    const result:string = prettydiff(meta),
                                                        path = (options.mode === "diff")
                                                            ? `${meta.differences},${meta.lines}`
                                                            : args.path;
                                                    apps.log([""], result, path);
                                                });
                                            }
                                        } else {
                                            apps.log([`The file at ${args.path} contains a binary buffer.  Pretty Diff does not analyze binary at this time.`], "", args.path);
                                        }
                                    },
                                    index: 0,
                                    path: options[item],
                                    stat: stat
                                });
                            }
                        };
                        if (options.read_method === "auto") {
                            if (err !== null) {
                                const index:any = {
                                    "sep": options[item].indexOf(sep),
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
                                    // read_method:auto evaluated as "screen"
                                    options.read_method = "screen";
                                    createrc(screen);
                                } else {
                                    // read_method:auto evaluated as filesystem path pointing to missing resource
                                    apps.errout([err.toString()]);
                                }
                                return;
                            }
                            if (stat.isDirectory() === true) {
                                options.read_method = "subdirectory";
                            } else if (stat.isDirectory() === false && stat.isSymbolicLink() === false && stat.isFIFO() === false) {
                                options.read_method = "file";
                            }
                        }
                        if (err !== null) {
                            apps.errout([err.toString()]);
                            return;
                        }
                        options[item] = node.path.resolve(options[item]);
                        if (stat.isDirectory() === false && (options.read_method === "directory" || options.read_method === "subdirectory")) {
                            apps.errout([`Option ${text.cyan}read_method${text.none} has value ${text.green + options.read_method + text.none} but ${text.angry}option ${item} does not point to a directory${text.none}.`]);
                            return;
                        }
                        if ((stat.isDirectory() === true || stat.isSymbolicLink() === true || stat.isFIFO() === true) && options.read_method === "file") {
                            apps.errout([`Option ${text.cyan}read_method${text.none} has value ${text.green + options.read_method + text.none} but ${text.angry}option ${item} does not point to a file${text.none}.`]);
                            return;
                        }
                        createrc(resolveItem);
                    });
                }
            };
        resolve();
    };
    // similar to posix "rm -rf" command
    apps.remove = function node_apps_remove(filepath:string, callback:Function):void {
        const numb:any = {
                dirs: 0,
                file: 0,
                link: 0,
                size: 0
            },
            removeItems = function node_apps_remove_removeItems(filelist:directoryList):void {
                let a:number = 0;
                const len:number = filelist.length,
                    destroy = function node_apps_remove_removeItems_destroy(item:directoryItem) {
                        const type:"rmdir"|"unlink" = (item[1] === "directory")
                            ? "rmdir"
                            : "unlink";
                        node.fs[type](item[0], function node_apps_remove_removeItems_destroy_callback(er:nodeError):void {
                            if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                                if (er.code === "ENOTEMPTY") {
                                    node_apps_remove_removeItems_destroy(item);
                                    return;
                                }
                                apps.errout([er.toString()]);
                                return;
                            }
                            if (item[0] === filelist[0][0]) {
                                callback();
                            } else {
                                filelist[item[2]][3] = filelist[item[2]][3] - 1;
                                if (filelist[item[2]][3] < 1) {
                                    node_apps_remove_removeItems_destroy(filelist[item[2]]);
                                }
                            }
                        });
                    };
                if (filelist.length < 1) {
                    callback();
                    return;
                }
                do {
                    if (command === "remove") {
                        if (filelist[a][1] === "file") {
                            numb.file = numb.file + 1;
                            numb.size = numb.size + filelist[a][4].size;
                        } else if (filelist[a][1] === "directory") {
                            numb.dirs = numb.dirs + 1;
                        } else if (filelist[a][1] === "link") {
                            numb.link = numb.link + 1;
                        }
                    }
                    if ((filelist[a][1] === "directory" && filelist[a][3] === 0) || filelist[a][1] !== "directory") {
                        destroy(filelist[a]);
                    }
                    a = a + 1;
                } while (a < len);
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
                const out = ["Pretty Diff removed "];
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
                out.push(String(numb.link));
                out.push(text.none);
                out.push(" symbolic link");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(" at ");
                out.push(text.angry);
                out.push(apps.commas(numb.size));
                out.push(text.none);
                out.push(" bytes.");
                apps.log([out.join(""), `Removed ${text.cyan + filepath + text.none}`], "", "");
            };
        }
        apps.directory({
            callback: removeItems,
            exclusions: [],
            path: filepath,
            recursive: true,
            symbolic: true
        });
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
                        : request.url;
                const localpath:string = (uri === "/")
                    ? `${projectPath}index.xhtml`
                    : projectPath + uri.slice(1).replace(/\/$/, "").replace(/\//g, sep);
                node.fs.stat(localpath, function node_apps_server_create_stat(ers:nodeError, stat:Stats):void {
                    const random:number = Math.random(),
                        page:string = `<!doctype html><html><head><title>Pretty Diff - Local Service</title><meta content="text/html;charset=UTF-8" http-equiv="Content-Type"/><link href="/css/index.css?${random}" media="all" rel="stylesheet" type="text/css"/></head><body class="white" id="prettydiff"><div class="contentarea" id="page"><section role="heading"><h1><svg height="2000.000000pt" id="pdlogo" preserveAspectRatio="xMidYMid meet" version="1.0" viewBox="0 0 2000.000000 2000.000000" width="2000.000000pt" xmlns="http://www.w3.org/2000/svg"><g fill="#999" stroke="none" transform="translate(0.000000,2000.000000) scale(0.100000,-0.100000)"><path d="M14871 18523 c-16 -64 -611 -2317 -946 -3588 -175 -660 -319 -1202 -320 -1204 -2 -2 -50 39 -107 91 -961 876 -2202 1358 -3498 1358 -1255 0 -2456 -451 -3409 -1279 -161 -140 -424 -408 -560 -571 -507 -607 -870 -1320 -1062 -2090 -58 -232 -386 -1479 -2309 -8759 -148 -563 -270 -1028 -270 -1033 0 -4 614 -8 1365 -8 l1364 0 10 38 c16 63 611 2316 946 3587 175 660 319 1202 320 1204 2 2 50 -39 107 -91 543 -495 1169 -862 1863 -1093 1707 -568 3581 -211 4965 946 252 210 554 524 767 796 111 143 312 445 408 613 229 406 408 854 525 1320 57 225 380 1451 2310 8759 148 563 270 1028 270 1033 0 4 -614 8 -1365 8 l-1364 0 -10 -37z m-4498 -5957 c477 -77 889 -256 1245 -542 523 -419 850 -998 954 -1689 18 -121 18 -549 0 -670 -80 -529 -279 -972 -612 -1359 -412 -480 -967 -779 -1625 -878 -121 -18 -549 -18 -670 0 -494 74 -918 255 -1283 548 -523 419 -850 998 -954 1689 -18 121 -18 549 0 670 104 691 431 1270 954 1689 365 293 828 490 1283 545 50 6 104 13 120 15 72 10 495 -3 588 -18z"/></g></svg> <a href="/">Pretty Diff</a> - Local Server</h1><p id="dcolorScheme"><label class="label" for="option-color">Color Scheme</label> <select id="option-color"><option>Canvas</option><option>Shadow</option><option selected="selected">White</option></select></p><p>Browse Pretty Diff on <a href="https://github.com/prettydiff/prettydiff">GitHub</a> or <a href="https://www.npmjs.com/package/prettydiff">NPM</a>.</p></section><section role="main">insertme</section></div><script src="/js/webtool.js?${random}" type="application/javascript"></script></body></html>`;
                    if (ers !== null) {
                        if (ers.code === "ENOENT") {
                            console.log(`${text.angry}404${text.none} for ${uri}`);
                            response.writeHead(200, {"Content-Type": "text/html"});
                            if (request.headers.referer.indexOf("http") === 0 && (/((:\d+)|(\.\w+))\/?$/).test(request.headers.referer) === true) {
                                response.write("");
                            } else {
                                response.write(page.replace("insertme", `<p>HTTP 404: ${uri}</p>`));
                            }
                            response.end();
                        } else {
                            apps.errout([ers.toString()]);
                        }
                        return;
                    }
                    if (request.url.indexOf("favicon.ico") < 0 && request.url.indexOf("images/apple") < 0) {
                        if (stat.isDirectory() === true) {
                            node.fs.readdir(localpath, function node_apps_server_create_stat_dir(erd:Error, list:string[]) {
                                const dirlist:string[] = [`<p>directory of ${localpath}</p> <ul>`];
                                if (erd !== null) {
                                    apps.errout([erd.toString()]);
                                    return;
                                }
                                list.forEach(function node_apps_server_create_stat_dir_list(value:string) {
                                    if ((/\.x?html?$/).test(value.toLowerCase()) === true) {
                                        dirlist.push(`<li><a href="${uri.replace(/\/$/, "")}/${value}">${value}</a></li>`);
                                    } else {
                                        dirlist.push(`<li><a href="${uri.replace(/\/$/, "")}/${value}?${random}">${value}</a></li>`);
                                    }
                                });
                                dirlist.push("</ul>");
                                response.writeHead(200, {"Content-Type": "text/html"});
                                response.write(page.replace("insertme", dirlist.join("")));
                                response.end();
                            });
                            return;
                        }
                        if (stat.isFile() === true) {
                            node.fs.readFile(localpath, "utf8", function node_apps_server_create_stat_readFile(err:Error, data:string):void {
                                if (err !== undefined && err !== null) {
                                    if (err.toString().indexOf("no such file or directory") > 0) {
                                        response.writeHead(404, {"Content-Type": "text/plain"});
                                        if (localpath.indexOf("apple-touch") < 0 && localpath.indexOf("favicon") < 0) {
                                            console.log(`${text.angry}404${text.none} for ${localpath}`);
                                        }
                                        return;
                                    }
                                    response.write(JSON.stringify(err));
                                    console.log(err);
                                    return;
                                }
                                if (localpath.indexOf(".js") === localpath.length - 3) {
                                    response.writeHead(200, {"Content-Type": "application/javascript"});
                                } else if (localpath.indexOf(".css") === localpath.length - 4) {
                                    response.writeHead(200, {"Content-Type": "text/css"});
                                } else if (localpath.indexOf(".xhtml") === localpath.length - 6) {
                                    response.writeHead(200, {"Content-Type": "application/xhtml+xml"});
                                } else if (localpath.indexOf(".html") === localpath.length - 5 || localpath.indexOf(".htm") === localpath.length - 4) {
                                    response.writeHead(200, {"Content-Type": "text/html"});
                                } else {
                                    response.writeHead(200, {"Content-Type": "text/plain"});
                                }
                                response.write(data);
                                response.end();
                            });
                        } else {
                            response.end();
                        }
                        return;
                    }
                });
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
            if ((extension === "ts" || extension === "css") && timeStore < Date.now() - 1000 && filename !== `css${sep}index.css`) {
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
                        console.log(`[${text.bold + text.purple + list.join(":") + text.none}] Total compile time.\u0007`);
                    };
                console.log("");
                start = time(`Compiling for ${text.green + filename + text.none}`);
                node.child(`node js/services build incremental`, {
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
    apps.simulation = function node_apps_simulation(callback:Function):void {
        const rc:string = `${projectPath}.prettydiffrc`,
            tests:simulationItem[] = require(`${js}tests${sep}simulations.js`),
            len:number = tests.length, // all tests except the last two, which are reserved for testing the .prettydiffrc file
            cwd:string = __dirname.replace(/(\/|\\)js$/, ""),
            fileContents:string = `{\n    "compilerOptions": {\n        "outDir": "js",\n        "pretty": true,\n        "target": "ES6"\n    },\n    "include": [\n        "*.ts", "**/*.ts"\n    ],\n    "exclude": ["2", "3", "js", "ignore", "node_modules"]\n}`,
            writerc = function node_apps_simulation_writerc(message:string):void {
                node.fs.writeFile(rc, rcfile, function node_apps_simulation_writerc_writeFile(erw:Error) {
                    if (erw !== null) {
                        apps.errout([erw.toString()]);
                        return;
                    }
                    if (a === len) {
                        callback(message);
                    } else {
                        apps.errout([message]);
                    }
                });
            },
            increment = function node_apps_simulation_increment(irr:string):void {
                const interval = function node_apps_simulation_increment_interval():void {
                    a = a + 1;
                    if (a < len) {
                        // rctest function provides special instructions for testing the .prettydiffrc file
                        if (tests[a].command.indexOf("prettydiffrc-json-file-child") > 0) {
                            rctest(cwd, `${projectPath}tests${sep}.prettydiffrc`, "{\"indent_size\": 6}");
                        } else if (tests[a].command.indexOf("prettydiffrc-json-file-local") > 0) {
                            rctest(cwd, rc, "{\"indent_size\": 3}");
                        } else if (tests[a].command.indexOf("prettydiffrc-json-file-parent") > 0) {
                            node.fs.writeFile(`${projectPath}tests${sep}test.txt`, fileContents, function node_apps_simulation_increment_writeParent(erw:Error):void {
                                if (erw !== null) {
                                    apps.errout([erw.toString()]);
                                    return;
                                }
                                rctest(cwd, rc, "{\"indent_size\": 6}");
                            });
                        } else if (tests[a].command.indexOf("prettydiffrc-json-screen-parent") > 0) {
                            rctest(`${projectPath}tests${sep}diffbase`, rc, "{\"indent_size\": 10}");
                        } else if (tests[a].command.indexOf("prettydiffrc-javascript-file-local") > 0) {
                            rctest(cwd, rc, `(function rc() {"use strict";const rclogic = function rc_logic(options) {options.indent_size = 8;return options;};module.exports = rclogic;}());`);
                        } else {
                            wrapper(cwd, increment);
                        }
                    } else {
                        console.log("");
                        writerc(`${text.green}Successfully completed all ${text.cyan + len + text.green} simulation tests.${text.none}`);
                    }
                };
                if (irr !== "") {
                    console.log(`${apps.humantime(false) + text.underline}Test ${a + 1} ignored (${text.angry + irr + text.none + text.underline}):${text.none} ${tests[a].command}`);
                } else {
                    console.log(`${apps.humantime(false) + text.green}Passed simulation ${a + 1}: ${text.none + tests[a].command}`);
                }
                if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                    interval();
                } else {
                    apps.remove(tests[a].artifact, function node_apps_simulation_increment_remove():void {
                        interval();
                    });
                }
            },
            rctest = function node_apps_simulation_rctest(dir:string, path:string, contents:string):void {
                node.fs.writeFile(path, contents, function node_apps_simulation_rctest_write(erw:Error):void {
                    if (erw !== null) {
                        writerc(erw.toString());
                        return;
                    }
                    wrapper(dir, function node_apps_simulation_rctest_write_wrapper():void {
                        node.fs.unlink(path, function node_apps_simulation_rctest_write_wrapper_unlink(eru:Error):void {
                            if (eru !== null) {
                                apps.errout([eru.toString()]);
                                return;
                            }
                            increment("");
                        });
                    });
                });
            },
            errout = function node_apps_simulation_errout(message:string, stdout:string) {
                writerc([
                    `Simulation test string ${text.angry + tests[a].command + text.none} ${message}:`,
                    tests[a].test,
                    "",
                    "",
                    `${text.green}Actual output:${text.none}`,
                    stdout
                ].join(node.os.EOL));
            },
            wrapper = function node_apps_simulation_wrapper(cwd:string, callback:Function):void {
                node.child(`node ${projectPath}js/services ${tests[a].command}`, {cwd: cwd, maxBuffer: 2048 * 500}, function node_apps_simulation_wrapper_child(errs:nodeError, stdout:string, stderror:string|Buffer) {
                    if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                        writeflag = "";
                    } else {
                        tests[a].artifact = node.path.resolve(tests[a].artifact);
                        writeflag = tests[a].artifact;
                    }
                    if (errs !== null) {
                        if (errs.toString().indexOf("getaddrinfo ENOTFOUND") > -1) {
                            increment("no internet connection");
                            return;
                        }
                        if (errs.toString().indexOf("certificate has expired") > -1) {
                            increment("TLS certificate expired on HTTPS request");
                            return;
                        }
                        if (stdout === "") {
                            writerc(errs.toString());
                            return;
                        }
                    }
                    if (stderror !== "") {
                        writerc(stderror.toString());
                        return;
                    }
                    if (typeof stdout === "string") {
                        stdout = stdout.replace(/\s+$/, "").replace(/^\s+/, "").replace(/\s\d+(\.\d+)*\s/g, " XXXX ");
                    }
                    if (tests[a].qualifier.indexOf("file") === 0) {
                        if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                            writerc(`Tests ${text.cyan + tests[a].command + text.none} uses ${text.angry + tests[a].qualifier + text.none} as a qualifier but does not mention an artifact to remove.`);
                            return;
                        }
                        if (tests[a].qualifier.indexOf("file ") === 0) {
                            tests[a].file = node.path.resolve(tests[a].file);
                            node.fs.readFile(tests[a].file, "utf8", function node_apps_simulation_wrapper_file(err:Error, dump:string) {
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (tests[a].qualifier === "file begins" && dump.indexOf(tests[a].test) !== 0) {
                                    errout(`is not starting in file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file contains" && dump.indexOf(tests[a].test) < 0) {
                                    errout(`is not anywhere in file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file ends" && dump.indexOf(tests[a].test) === dump.length - tests[a].test.length) {
                                    errout(`is not at end of file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file is" && dump !== tests[a].test) {
                                    errout(`does not match the file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file not" && dump === tests[a].test) {
                                    errout(`matches this file, but shouldn't: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file not contains" && dump.indexOf(tests[a].test) > -1) {
                                    errout(`is contained in this file, but shouldn't be: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                callback("");
                            });
                        } else if (tests[a].qualifier.indexOf("filesystem ") === 0) {
                            tests[a].test = node.path.resolve(tests[a].test);
                            node.fs.stat(tests[a].test, function node_apps_simulation_wrapper_filesystem(ers:Error) {
                                if (ers !== null) {
                                    if (tests[a].qualifier === "filesystem contains" && ers.toString().indexOf("ENOENT") > -1) {
                                        writerc([
                                            `Simulation test string ${text.angry + tests[a].command + text.none} does not see this address in the local file system:`,
                                            text.cyan + tests[a].test + text.none
                                        ].join(node.os.EOL));
                                        return;
                                    }
                                    writerc(ers.toString());
                                    return;
                                }
                                if (tests[a].qualifier === "filesystem not contains") {
                                    writerc([
                                        `Simulation test string ${text.angry + tests[a].command + text.none} sees the following address in the local file system, but shouldn't:`,
                                        text.cyan + tests[a].test + text.none
                                    ].join(node.os.EOL));
                                    return;
                                }
                                callback("");
                            });
                        }
                    } else {
                        if (tests[a].qualifier === "begins" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) !== 0)) {
                            errout("does not begin with the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "contains" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) < 0)) {
                            errout("does not contain the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "ends" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) !== stdout.length - tests[a].test.length)) {
                            errout("does not end with the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "is" && stdout !== tests[a].test) {
                            errout("does not match the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "not" && stdout === tests[a].test) {
                            errout("must not be this output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "not contains" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) > -1)) {
                            errout("must not contain this output", stdout)
                            return;
                        }
                        callback("");
                    }
                });
            };

        let a:number = 0,
            rcfile:string = "";
        if (command === "simulation") {
            callback = function node_apps_simulation_callback(message:string):void {
                apps.log([message, "\u0007"], "", ""); // bell sound
            };
            verbose = true;
            console.log("");
            console.log(`${text.underline + text.bold}Pretty Diff - services.ts simulation tests${text.none}`);
            console.log("");
        }
        node.fs.stat(rc, function node_apps_simulation_rcstat(ers:Error):void {
            if (ers !== null) {
                const erstring:string = ers.toString();
                if (erstring.indexOf("no such file or directory") > 0) {
                    wrapper(cwd, increment);
                    return;
                }
                apps.errout([erstring]);
                return;
            }
            node.fs.readFile(rc, "utf8", function node_apps_simulation_rcstat_read(err:Error, fileData:string):void {
                if (err !== null) {
                    apps.errout([err.toString()]);
                    return;
                }
                rcfile = fileData;
                node.fs.unlink(rc, function node_apps_simulation_rcstat_read_unlink(eru:Error) {
                    if (eru !== null) {
                        apps.errout([eru.toString()]);
                        return;
                    }
                    wrapper(cwd, increment);
                });
            });
        });
    };
    // runs all the tests
    apps.test = function node_apps_test():void {
        apps.build(true);
    };
    // unit test validation runner for Pretty Diff mode commands
    apps.validation = function node_apps_validation(callback:Function):void {
        let count_raw = 0,
            count_formatted = 0;
        const flag = {
                raw: false,
                formatted: false
            },
            raw:[string, string][] = [],
            formatted:[string, string][] = [],
            reset = function node_apps_validation_reset():void {
                const key:string[] = Object.keys(prettydiff.api.optionDef),
                    len:number = key.length;
                let a:number = 0;
                do {
                    options[key[a]] = prettydiff.api.optionDef[key[a]].default;
                    a = a + 1;
                } while (a < len);
                options.correct      = true;
                options.crlf         = false;
                options.diff_context = 4;
                options.end_comma    = "none";
                options.lexerOptions = {};
                options.mode         = "diff";
                options.new_line     = true;
                options.object_sort  = true;
                options.preserve     = 2;
                options.read_method  = "screen";
                options.vertical     = true;
                options.wrap         = 80;
            },
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
                    b:number = 0,
                    missing:number = 0,
                    filecount:number = 0,
                    noteslen:number = 0,
                    notes:string[] = [],
                    output:string = "";
                raw.sort(sort);
                formatted.sort(sort);
                if (command === "validation") {
                    console.log("");
                }
                do {
                    if (raw[a] === undefined || formatted[a] === undefined) {
                        if (raw[a] === undefined && formatted[a] !== undefined) {
                            console.log(`${text.angry}raw directory is missing file:${text.none} ${formatted[a][0]}`);
                            formatted.splice(a, 1);
                        } else if (formatted[a] === undefined && raw[a] !== undefined) {
                            console.log(`${text.angry}formatted directory is missing file:${text.none} ${raw[a][0]}`);
                            raw.splice(a, 1);
                        }
                    } else if (raw[a][0] === formatted[a][0]) {
                        let value:string = "",
                            numb:number = 0,
                            name:string = "";
                        reset();
                        notes = raw[a][0].split("_");
                        noteslen = notes.length;
                        options.language   = notes[2];
                        options.lexer      = notes[1];
                        options.mode       = notes[0].replace(/^\./, "");
                        options.source     = raw[a][1];
                        if (noteslen > 3) {
                            b = 3;
                            do {
                                if (b < noteslen - 2 && notes[b].indexOf("-") < 0 && notes[b + 1].indexOf("-") < 0) {
                                    name = `${notes[b]}_${notes[b + 1]}_${notes[b + 2].replace(".txt", "")}`;
                                    if (name.indexOf("-") > 0) {
                                        name = name.slice(0, name.indexOf("-"));
                                    }
                                    if (options[name] !== undefined) {
                                        notes[b + 2] = `${notes[b]}_${notes[b + 1]}_${notes[b + 2]}`;
                                        b = b + 2;
                                    } else if (b < noteslen - 1 && notes[b].indexOf("-") < 0) {
                                        name = `${notes[b]}_${notes[b + 1].replace(".txt", "")}`;
                                        if (name.indexOf("-") > 0) {
                                            name = name.slice(0, name.indexOf("-"));
                                        }
                                        if (options[name] !== undefined) {
                                            notes[b + 1] = `${notes[b]}_${notes[b + 1]}`;
                                            b = b + 1;
                                        }
                                    }
                                } else if (b < noteslen - 1 && notes[b].indexOf("-") < 0) {
                                    name = `${notes[b]}_${notes[b + 1].replace(".txt", "")}`;
                                    if (name.indexOf("-") > 0) {
                                        name = name.slice(0, name.indexOf("-"));
                                    }
                                    if (options[name] !== undefined) {
                                        notes[b + 1] = `${notes[b]}_${notes[b + 1]}`;
                                        b = b + 1;
                                    }
                                }
                                notes[b] = notes[b].replace(".txt", "");
                                if (notes[b].indexOf("-") > 0 && options[notes[b].slice(0, notes[b].indexOf("-"))] !== undefined) {
                                    value = notes[b].slice(notes[b].indexOf("-") + 1);
                                    notes[b] = notes[b].slice(0, notes[b].indexOf("-"));
                                    numb = Number(value);
                                    if (value === "true" && prettydiff.api.optionDef[notes[b]].type === "boolean") {
                                        options[notes[b]] = true;
                                    } else if (value === "false" && prettydiff.api.optionDef[notes[b]].type === "boolean") {
                                        options[notes[b]] = false;
                                    } else if (isNaN(numb) === true) {
                                        options[notes[b]] = value;
                                    } else {
                                        options[notes[b]] = numb;
                                    }
                                } else if (options[notes[b]] !== undefined && prettydiff.api.optionDef[notes[b]].type === "boolean") {
                                    options[notes[b]] = true;
                                }
                                b = b + 1;
                            } while (b < noteslen);
                        }
                        output = prettydiff();
                        if (output === formatted[a][1]) {
                            filecount = filecount + 1;
                            console.log(`${apps.humantime(false) + text.green}Pass ${filecount}:${text.none} ${formatted[a][0]}`);
                        } else {
                            console.log(`${apps.humantime(false) + text.angry}Fail: ${text.cyan + raw[a][0] + text.none}`);
                            console.log("");
                            console.log(`Diff output colors: ${text.angry + text.underline}red = generated${text.none} and ${text.green + text.underline}green = saved file${text.none}`);
                            reset();
                            options.diff         = formatted[a][1];
                            options.language     = "text";
                            options.mode         = "diff";
                            options.source       = output;
                            options.source_label = raw[a][1];
                            apps.errout([prettydiff.api.diffview(options)[0], "", `${text.angry}Validation test failure${text.none}`, `Failed on file ${text.cyan + text.bold + raw[a][0] + text.none}`, ""]);
                            return;
                        }
                    } else {
                        missing = missing + 1;
                        if (raw[a][0] < formatted[a][0]) {
                            console.log(`${text.angry}formatted directory is missing file:${text.none} ${raw[a][0]}`);
                            raw.splice(a, 1);
                        } else {
                            console.log(`${text.angry}raw directory is missing file:${text.none} ${formatted[a][0]}`);
                            formatted.splice(a, 1);
                        }
                    }
                    a = a + 1;
                } while (a < len);
                if (a === len) {
                    if (command === "validation") {
                        verbose = true;
                        if (missing > 0) {
                            let plural:string = (missing === 1)
                                ? " is"
                                : "s are";
                            apps.log([`${text.green + text.bold + filecount + text.none} files passed, but ${text.angry + missing} file${plural} missing${text.none}.`], "", "");
                        } else {
                            apps.log([`${text.green}All ${filecount} files passed.${text.none}`], "", "");
                        }
                    } else {
                        let msg:string = "";
                        console.log("");
                        if (missing > 0) {
                            let plural:string = (missing === 1)
                                ? " is"
                                : "s are";
                            msg = `${text.green + text.bold + filecount + text.none} files passed, but ${text.angry + missing} file${plural} missing${text.none}.`;
                        } else {
                            msg = `${text.green}All ${filecount} files passed.${text.none}`;
                        }
                        callback(msg);
                    }
                }
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
        if (command === "validation") {
            verbose = true;
        }
        readDir("raw");
        readDir("formatted");
    };
    // runs apps.log
    apps.version = function ():void {
        verbose = true;
        apps.log([""], "", "");
    };
    // performs word wrap when printing text to the shell
    apps.wrapit = function node_apps_wrapit(outputArray:string[], string:string):void {
        const wrap:number = 100;
        if (string.length > wrap) {
            const indent:string = (function node_apps_wrapit_indent():string {
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
                formLine = function node_apps_wrapit_formLine():void {
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
                    inc = wrapper;
                    if (string.charAt(wrapper) !== " " && string.length > wrapper) {
                        do {
                            wrapper = wrapper - 1;
                        } while (wrapper > 0 && string.charAt(wrapper) !== " ");
                        if (wrapper === 0 || wrapper === indent.length - 1) {
                            wrapper = inc;
                            do {
                                wrapper = wrapper + 1;
                            } while (wrapper < string.length && string.charAt(wrapper) !== " ");
                        }
                    }
                    outputArray.push(string.slice(0, wrapper).replace(/\s+$/, ""));
                    string = string.slice(wrapper + 1).replace(/^\s+/, "");
                    if (string.length + indent.length > wrap) {
                        string = indent + string;
                        node_apps_wrapit_formLine();
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