/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/
/*global global */
(function node():void {
    "use strict";
    const startTime:[number, number]      = process.hrtime(),
        node = {
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
            return dirs.slice(0, dirs.length - 2).join(sep) + sep;
        }()),
        js:string = `${projectPath}js${sep}`,
        api:string = `${js}api${sep}`,
        // node option default start
        options:any = {},
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
            global.prettydiff = {};
            require(`${api}options`);
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
                        out.push([list[a], options[list[a + 1]]]);
                        a = a + 1;
                    } else if (list[a].indexOf(split) > 0) {
                        name = list[a].slice(0, list[a].indexOf(split));
                        value = list[a].slice(list[a].indexOf(split) + 1);
                        if (options[name] !== undefined) {
                            if (value === "true" && def[name].type === "boolean") {
                                out.push([name, true]);
                            } else if (value === "false" && def[name].type === "boolean") {
                                out.push([name, false]);
                            } else if (isNaN(Number(value)) === false && def[name].type === "number") {
                                out.push([name, Number(value)]);
                            } else if (def[name].values !== undefined && def[name].values[value] !== undefined) {
                                out.push([name, value]);
                            } else if (def[name].values === undefined) {
                                out.push([name, value]);
                            }
                        }
                    }
                }
                a = a + 1;
            } while (a < len);
            return out;
        }()),
        apps:any = {};
    apps.commands = function node_apps_commands() {
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
    };
    apps.heading = function node_apps_heading(message:string):void {
        console.log("");
        console.log(`${text.underline + text.bold}Pretty Diff - ${message + text.none}`);
        console.log("");
    };
    apps.options = function node_apps_options() {
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
                            if (keys[a].length > lens) {
                                lens = keys[a].length;
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
            defPresent(`Option: ${args[0][1]}`, def[args[0][1]]);
        } else {
            defPresent("Options", options);
        }
    };
    let sourcetype:string = "",
        difftype:string = "";
    // resolve relative paths into absolute from process.cwd
    //if ((/^(\w+:\/\/)/).test(options.source) === true && (options.readmethod === "auto" || options.readmethod === "")) {}
    // rethink flags for things such as help, version
    // allow =, :, and space as name/value separators
    //
    // command list
    // * commands - list of supported commands
    // * options - list of supported options
    // * version - last date and version
    // * get
    // * beautify
    // * diff
    // * analyze
    // * minify
    // * parse
    // * copy
    // * remove
    if (apps[args[0][0]] === undefined) {
        errout("Please use a supported command.  Example: prettydiff help");
        return;
    }
    apps[args[0][0]]();
    humantime(true);
}());
