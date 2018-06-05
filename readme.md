# Pretty Diff version 3

A language aware diff, beautification, and minification tool.

## Build

```
git clone git@github.com:prettydiff/prettydiff.git -b 3.0.0 prettydiff3
cd prettydiff3

npm install typescript -g
npm install eslint -g

node js/services build
```

## Usage
The application run on the terminal with Node.js and in a web browser.

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