Try it online at [http://prettydiff.com/](http://prettydiff.com/).

# ![Pretty Diff logo](http://prettydiff.com/images/pdlogoxs.svg) Pretty Diff

[![Travis CI Build](https://travis-ci.org/prettydiff/prettydiff.svg)](https://travis-ci.org/prettydiff/prettydiff)
[![AppVeyor Build](https://ci.appveyor.com/api/projects/status/github/prettydiff/prettydiff?branch=master&svg=true)](https://ci.appveyor.com/project/prettydiff/prettydiff)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/prettydiff/prettydiff?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Twitter Tweets](https://img.shields.io/twitter/url/http/prettydiff.com.svg?style=social)](https://twitter.com/intent/tweet?text=Handy%20web%20development%20tool:%20%20url=http%3A%2F%2Fprettydiff.com)

## Summary

[Download](http://prettydiff.com/downloads/prettydiff) with [biddle](https://github.com/prettydiff/biddle)

Language aware code comparison tool for several web based languages. It also beautifies, minifies, and a few other things.

## Benefits - see [overview page](http://prettydiff.com/overview.xhtml) for more details

* ES6 / ES2015 ready
* [React JSX format support](http://prettydiff.com/guide/react_jsx.xhtml)
* LESS, SCSS (Sass), and CSS support
* Separate support for XML and HTML
* [Recursive command line directory diff](http://prettydiff.com/guide/diffcli.xhtml)
* [JavaScript scope in colors](http://prettydiff.com/guide/jshtml.xhtml)
* [Supports presets for popular styleguides](http://prettydiff.com/guide/styleguide.xhtml)
* [Markup beautification with optional opt out](http://prettydiff.com/guide/tag_ignore.xhtml)
* [JavaScript auto correction](http://prettydiff.com/guide/jscorrect.xhtml)
* [Supports a ton of options](http://prettydiff.com/documentation.php#function_properties)
* [Default beautifier](https://atom.io/packages/atom-beautify/) for several languages in [Atom.io](https://atom.io/)

## Executing Pretty Diff

### Run with Node.js / CommonJS / RequireJS

A Node.js command line utility is provided by api/node-local.js.  This file can execute in the following modes:

* auto - Determine if the resource is text, a file, or a directory and process as such (except that directories are processed with the subdirectory option)
* screen - code input is on the command line and output is to the command line
* filescreen - code input is in a file and the output is to the command line
* file - the input and the output reside in files
* directory - everything in a directory is processed into a specified output directory except ".", "..", and subdirectories
* subdirectory - process the entire directory tree

#### Execute in the context of a NodeJS application

Add this code to your application

```javascript
var prettydiff = require("prettydiff"),
    args       = {
        source: "asdf",
        diff  : "asdd",
        lang  : "text"
    },
    output     = prettydiff(args);
```

#### Execute in the browser as a vanilla or RequireJS app

Please see the [barebones code samples](test/barebones)

#### Execute from the command line

Run in windows

```shell
node api/node-local.js source:"c:\myDirectory" readmethod:"subdirectory" diff:"c:\myOtherDirectory"
```

Run in Linux and OSX

```shell
node api/node-local.js source:"myDirectory" mode:"beautify" readmethod:"subdirectory" output:"path/to/outputDirectory"
```

To see a *man* page provide no arguments or these: help, man, manual

```shell
node api/node-local.js h
node api/node-local.js help
node api/node-local.js man
node api/node-local.js manual
```

To see only the version number supply only *v* or *version* as an argument:

```shell
node api/node-local.js v
node api/node-local.js version
```

To see a list of current settings on the console supply *list* as an argument:

```shell
node api/node-local.js l
node api/node-local.js list
```

#### Set configurations with a **.prettydiffrc** file.

Pretty Diff will first look for a .prettydiffrc file from the current directory in the command prompt. If the .prettydiffrc is not present in the current directory it will then look for it in the application's directory.

The .prettydiffrc first checks for JSON format. This allows a simple means of defining options in a file. It also allows a [JavaScript application format](http://prettydiff.com/.prettydiffrc) so that options can be set conditionally.

### Run in a web browser with api/dom.js

Please feel free to use index.xhtml file to supplement dom.js.  Otherwise, dom.js requires supplemental assistance to map DOM nodes from an HTML source.  dom.js is fault tolerant so nodes mapped to the supplied index.xhtml don't need to be supported from custom HTML.

To run Pretty Diff using dom.js include the following two script tags and bind the global.prettydiff.pd.recycle() function to the executing event.  Please refer to index.xhtml for an HTML example and documentation.xhtml for option and execution information.

```html
<script src="lib/global.js" type="application/javascript"></script>
<script src="lib/language.js" type="application/javascript"></script>
<script src="lib/options.js" type="application/javascript"></script>
<script src="lib/finalFile.js" type="application/javascript"></script>
<script src="lib/safeSort.js" type="application/javascript"></script>
<script src="ace/ace.js" type="application/javascript"></script> **(optional)**
<script src="api/dom.js" type="application/javascript"></script>
<script src="lib/csspretty.js" type="application/javascript"></script>
<script src="lib/csvpretty.js" type="application/javascript"></script>
<script src="lib/diffview.js" type="application/javascript"></script>
<script src="lib/jspretty.js" type="application/javascript"></script>
<script src="lib/markuppretty.js" type="application/javascript"></script>
<script src="prettydiff.js" type="application/javascript"></script>
```

### Execute with vanilla JS

```javascript
var global = {},
    args   = {
        source: "asdf",
        diff  : "asdd",
        lang  : "text"
    },
    output = prettydiff(args);
```

### Run Pretty Diff in [Atom](https://atom.io/) code editor with the [atom-beautify](https://atom.io/packages/atom-beautify) package.

### Run the unit tests

```shell
cd prettydiff
node test/lint.js
```

## License:

This project is mostly written by and managed by Austin Cheney and licensed under CC0 as of version 2.1.17.  Please see license.txt for license langauge.

## Acknowledgements

 * Harry Whitfield - http://g6auc.me.uk/
  - JS Pretty QA
  - JS Pretty widget
 * Andreas Greuel - https://plus.google.com/105958105635636993368/posts
  - diffview.js QA
