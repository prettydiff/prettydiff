# Pretty Diff version 3
A language aware diff, beautification, and minification tool.

[![Build Status](https://semaphoreci.com/api/v1/prettydiff/prettydiff/branches/3-0-0/badge.svg)](https://semaphoreci.com/prettydiff/prettydiff)

**This version of Pretty Diff is still in development and is not released to NPM.  For the current production version use branch 2.2.9 and NPM package [prettydiff2](https://www.npmjs.com/package/prettydiff2)**

## Build

```
git clone git@github.com:prettydiff/prettydiff.git
cd prettydiff

npm install typescript -g
npm install eslint -g
tsc --pretty

node js/services build nocheck
```

## Usage
The application runs on the terminal with Node.js and in a web browser.

* To get started with Node try `node js/services commands`
* To get started in a browser try this command with Node: `node js/services server` and then in your web browser go to http://localhost:9001

### Web Browser
Executing in the web browser presents a handy GUI with interactive documentation immediately available. This is convenient when Node.js is not available or installing software is not allowed.

* To execute immediately simply open **index.xhtml** using the local file system path in your web browser.
* To test and automatically rebuild and refresh upon code modification launch the server:
   - `node js/services server`
   - Open http://localhost:9001/ in your web browser

### Terminal
Executing in a terminal shell is powerful when you need access to additional tools, the local file system, or wish to integrate Pretty Diff output into other application tasks.  The application comes with some additional utilities not available to the browser, such as: hashing, base64 encoding, file system tools, and other features.

* To get started execute `node js/services commands` for a list of available commands.
* For detailed documentation on a specific command supply the command name: `node js/services commands base64`
* To see a list of available Pretty Diff options execute `node js/services options`
* The option list supports filtering against the documentation headings and values: `node js/services options mode:diff api:node`
* For detailed documentation about a specific option execute the option command with the named option: `node js/services options readmethod`
* To see execution details of a specific command specify the *verbose* flag: `node js/services options readmethod --verbose`