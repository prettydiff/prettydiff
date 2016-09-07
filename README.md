Try it online at [http://prettydiff.com/](http://prettydiff.com/).

# ![Pretty Diff logo](http://prettydiff.com/images/pdlogoxs.svg) Pretty Diff

[![Travis CI Build](https://travis-ci.org/prettydiff/prettydiff.svg)](https://travis-ci.org/prettydiff/prettydiff)
[![AppVeyor Build](https://ci.appveyor.com/api/projects/status/github/prettydiff/prettydiff?branch=master&svg=true)](https://ci.appveyor.com/project/prettydiff/prettydiff)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/prettydiff/prettydiff?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Twitter Tweets](https://img.shields.io/twitter/url/http/prettydiff.com.svg?style=social)](https://twitter.com/intent/tweet?text=Handy%20web%20development%20tool:%20%20url=http%3A%2F%2Fprettydiff.com)

## Summary

Language aware code comparison tool for several web based languages. It also beautifies, minifies, and a few other things.

## Benefits - see [overview page](http://prettydiff.com/overview.xhtml) for more details

* ES6 / JS2015 ready
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

    var prettydiff = require("prettydiff"),
        args       = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output     = prettydiff(args);

#### Execute from the command line

Run in windows

    node api/node-local.js source:"c:\myDirectory" readmethod:"subdirectory" diff:"c:\myOtherDirectory"

Run in Linux and OSX

    node api/node-local.js source:"myDirectory" mode:"beautify" readmethod:"subdirectory" output:"path/to/outputDirectory"

To see a *man* page provide no arguments or these: help, man, manual

    node api/node-local.js h
    node api/node-local.js help
    node api/node-local.js man
    node api/node-local.js manual

To see only the version number supply only *v* or *version* as an argument:

    node api/node-local.js v
    node api/node-local.js version

To see a list of current settings on the console supply *list* as an argument:

    node api/node-local.js l
    node api/node-local.js list

#### Set configurations with a **.prettydiffrc** file.

Pretty Diff will first look for a .prettydiffrc file from the current directory in the command prompt. If the .prettydiffrc is not present in the current directory it will then look for it in the application's directory.

The .prettydiffrc first checks for JSON format. This allows a simple means of defining options in a file. It also allows a [JavaScript application format](http://prettydiff.com/.prettydiffrc) so that options can be set conditionally.

### Run in a web browser with api/dom.js

Please feel free to use index.xhtml file to supplement dom.js.  Otherwise, dom.js requires supplemental assistance to map DOM nodes from an HTML source.  dom.js is fault tolerant so nodes mapped to the supplied index.xhtml don't need to be supported from custom HTML.

To run Pretty Diff using dom.js include the following two script tags and bind the global.prettydiff.pd.recycle() function to the executing event.  Please refer to index.xhtml for an HTML example and documentation.xhtml for option and execution information.

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

### Execute with vanilla JS

    var global = {},
        args   = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output = prettydiff(args);

### Run Pretty Diff in [Atom](https://atom.io/) code editor with the [atom-beautify](https://atom.io/packages/atom-beautify) package.

### Run the unit tests

    cd prettydiff
    node test/lint.js

## License:

 **@source** http://prettydiff.com/prettydiff.js

 **@documentation** English: http://prettydiff.com/documentation.xhtml

 **@licstart** The following is the entire license notice for Pretty Diff.

 This code may not be used or redistributed unless the following
 conditions are met:

* Prettydiff created by Austin Cheney originally on 3 Mar 2009. http://prettydiff.com/
* The use of diffview.js and prettydiff.js must contain the following copyright:
* Copyright (c) 2007, Snowtide Informatics Systems, Inc. All rights reserved.
  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of the Snowtide Informatics Systems nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
  - used as diffview function http://prettydiff.com/lib/diffview.js
* The code mentioned above has significantly expanded documentation in each of the respective function's external JS file as linked from the documentation page: http://prettydiff.com/documentation.xhtml
* In addition to the previously stated requirements any use of any component, aside from directly using the full files in their entirety, must restate the license mentioned at the top of each concerned file.

 If each and all these conditions are met use, extension, alteration,
 and redistribution of Pretty Diff and its required assets is unlimited
 and free without author permission.

 **@licend** The above is the entire license notice for Pretty Diff.

## Acknowledgements

 * Harry Whitfield - http://g6auc.me.uk/
  - JS Pretty QA
  - JS Pretty widget
 * Andreas Greuel - https://plus.google.com/105958105635636993368/posts
  - diffview.js QA
