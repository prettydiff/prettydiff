Pretty Diff
===========

Try it online at http://prettydiff.com/ or [join the mailing list](https://groups.google.com/d/forum/pretty-diff "Pretty Diff mailing list").
---------------------------------------------------------------------

api/dom.js
----------

Please feel free to use prettydiff.com.xhtml file to supplement dom.js.  Otherwise, dom.js requires supplemental assistance to map DOM nodes from an HTML source to the properties of the pd.o object found in dom.js.  dom.js is fault tolerant so most of the nodes mapped by pd.o need not be supported from custom HTML.

To run Pretty Diff using dom.js include the following two script tags and bind the pd.recycle() function to the executing event.  Please refer to prettydiff.com.xhtml for an HTML example and documentation.xhtml for option and execution information.

    <script type="application/javascript" src="prettydiff.js"></script>
    <script type="application/javascript" src="api/dom.js"></script>

Node.js / CommonJS / RequireJS
------------------------------

Node.js support is provided by api/node-local.js.  This file can execute
in the following modes:

  * screen - code input is on the command line and output is to the command line
  * filescreen - code input is in a file and the output is to the command line
  * file - the input and the output reside in files
  * directory - everything in a directory is processed into a specified output directory except ".", "..", and subdirectories

Execute in the context of a NodeJS application:

    var prettydiff = require("prettydiff"),
        args       = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output     = prettydiff.api(args);

From the command line execute api/node-local.js similar to these
examples:

    >node c:\\prettydiff\\api\\node-local.js source:"c:\mydirectory\myfile.js" readmethod:"file" diff:"c:\myotherfile.js"

    >node c:\\prettydiff\\api\\node-local.js source:"c:\mydirectory\myfile.js" mode:"beautify" readmethod:"file" output:"c:\output\otherfile.js"

WSH
---

Create a WSH script file using XML syntax and with a file extension of
"WSF".  This file must have a tag for each supported argument, must be
capable of reading from a file, and retrieving dependencies.

http://prettydiff.com/api/prettydiff.wsf

Pretty Diff would be executed using the following on CLI:

    cscript prettydiff.wsf
    cscript prettydiff.wsf /source:"myFile.xml" /mode:"beautify"

Execute with vanilla JS
-----------------------

    var args   = {
            source: "asdf",
            diff  : "asdd",
            lang  : "text"
        },
        output = prettydiff(args);

Pre-Inventory:
--------------

  * The component files are provided for access to individual functions
   independent of the Pretty Diff application.  The component code is
   already included in prettydiff.js, so it is not needed in addition to
   prettydiff.js.  The only files not included with prettydiff.js are
   the APIs and the stylesheet - diffview.css.

  * For usage documentation please visit
   http://prettydiff.com/documentation.php

License:
--------

 @source: http://prettydiff.com/prettydiff.js
 @documentation - English: http://prettydiff.com/documentation.php

 @licstart  The following is the entire license notice for Pretty Diff.
 
 This code may not be used or redistributed unless the following
 conditions are met:

 * Prettydiff created by Austin Cheney originally on 3 Mar 2009.
 http://prettydiff.com/
 * The use of diffview.js and prettydiff.js must contain the following
 copyright:
 Copyright (c) 2007, Snowtide Informatics Systems, Inc.
 All rights reserved.
  - Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the
 distribution.
  - Neither the name of the Snowtide Informatics Systems nor the
 names of its contributors may be used to endorse or promote products
 derived from this software without specific prior written
 permission.
  - used as diffview function
  http://prettydiff.com/lib/diffview.js
 * CodeMirror
 Copyright (C) 2013 by Marijn Haverbeke marijnh@gmail.com and others
 http://codemirror.com - MIT License
 * The code mentioned above has significantly expanded documentation in
 each of the respective function's external JS file as linked from the
 documentation page:
 http://prettydiff.com/documentation.php
 * In addition to the previously stated requirements any use of any
 component, aside from directly using the full files in their entirety,
 must restate the license mentioned at the top of each concerned file.

 If each and all these conditions are met use, extension, alteration,
 and redistribution of Pretty Diff and its required assets is unlimited
 and free without author permission.

 @licend  The above is the entire license notice for Pretty Diff.

Acknowledgements
----------------
 
 * Harry Whitfield - http://g6auc.me.uk/
  - JS Pretty QA
  - JS Pretty widget
 * Andreas Greuel - https://plus.google.com/105958105635636993368/posts
  - diffview.js QA