# Pretty Diff version 100
A language aware diff, beautification, and minification tool.

## Try it out
* Current version - https://prettydiff.com/
* Prior version - https://prettydiff.com/2

[![Build Status](https://semaphoreci.com/api/v1/prettydiff/prettydiff/branches/3-0-0/badge.svg)](https://semaphoreci.com/prettydiff/prettydiff)

## Build
### Local install for development
```
git clone https://github.com/prettydiff/prettydiff.git
cd prettydiff

npm install typescript -g
npm install eslint -g
tsc --pretty

node js/services build nocheck
```

### Global install with NPM
```
npm install typescript -g
npm install eslint -g
npm install prettydiff -g
prettydiff build nocheck
```

## Usage
The application runs on the terminal with Node.js and in a web browser.

### Terminal
Executing in a terminal shell is powerful when you need access to additional tools, the local file system, or wish to integrate Pretty Diff output into other application tasks.  The application comes with some additional utilities not available to the browser, such as: hashing, base64 encoding, file system tools, and other features.

* To get started execute `prettydiff commands` (global)  or `node js/services commands` (local) for a list of available commands.
* For detailed documentation on a specific command supply the command's name: `prettydiff commands base64` (global) or `node js/services commands base64` (local)
* To see execution details of a specific command specify the *verbose* flag: `node js/services beautify source:myFile.js --verbose`

### Browser
Pretty Diff is written in TypeScript, and so once built runs directly in all modern web browsers.

To get started immediately simply navigate your browser to the project's *index.xhtml* file in the local filesystem.  Browsers restrict some capabilities when executing web applications from the *file* scheme.  The included *index.xhtml* has all supported options dynamically built-in with updated documentation.

To run the web tool in a browser with all capabilities launch a local web server with this command: `prettydiff server` (global) or `node js/services server` (local) and then in your web browser go to http://localhost:9001.  This features a handy file system watcher and a web sockets service for users wanting to experiment with the code.  Once the server is active and the page is open in a web browser any changes to the code will automatically rebuild the project and reload the page.

To run the application as a third party application in the browser use the *js/thirdparty.js* file. See the [third party demo](thirdparty.md) for an example.  This provides all the necessary code in a single file without any DOM bindings.

### Options
For supported option documentation you may read the *documentation.xhtml* file in a browser, [options.md](options.md) markdown file, or use these commands on the terminal:

* Lists all available options: `prettydiff options` (global) or `node js/services options` (local)
* For option specific details specify the option's name: `prettydiff option mode` (global) or `node js/services options mode` (local)
* The option list supports filtering against the documentation headings and values: `prettydiff options mode:diff api:node` (global) or `node js/services options mode:diff api:node` (local)
* All options, configuration, and documentation are located in the file *api/optionsDef.ts* file.  All option related documentation, features, configurations, and defaults are built from this file for all supported environments.