Pretty Diff
===========

Try it online at http://prettydiff.com/ or [join the mailing list](https://groups.google.com/d/forum/pretty-diff "Pretty Diff mailing list").
---------------------------------------------------------------------

Node.js
-------

Node.js support is provided by api/node-local.js.  This file can execute
in the following modes:

  * screen - code input is on the command line and output is to the command line
  * filescreen - code input is in a file and the output is to the command line
  * file - the input and the output reside in files
  * directory - everything in a directory is processed into a specified output directory except ".", "..", and subdirectories

In your Node.js script include Pretty Diff with this code:

    var prettydiff = require("prettydiff");

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

   @source: http://prettydiff.com/documentation.php

   @licstart  The following is the entire license notice for the
   JavaScript code in this page.


 Created by Austin Cheney originally on 3 Mar 2009.
 This code may not be used or redistributed unless the following
 conditions are met:

 There is no licensing associated with diffview.css.  Please use,
 redistribute, and alter to your content.  However, diffview.css
 provided from Pretty Diff is different from and not aligned with
 diffview.css originally from Snowtide Informatics.

 * The use of diffview.js and prettydiff.js must contain the following
 copyright:
 Copyright (c) 2007, Snowtide Informatics Systems, Inc.
 All rights reserved.

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the
 distribution.
 * Neither the name of the Snowtide Informatics Systems nor the names
 of its contributors may be used to endorse or promote products
 derived from this software without specific prior written
 permission.

 - used as diffview function
 <http://prettydiff.com/lib/diffview.js>

 * The author of fulljsmin.js and date of creation must be stated as:
 Franck Marcia - 31 Aug 2006

 - used as jsmin function:
 <http://prettydiff.com/lib/fulljsmin.js>

 * The fulljsmin.js is used with permission from the author of jsminc.c
 and such must be stated as:
 Copyright (c) 2002 Douglas Crockford  (www.crockford.com)

 * JSPretty is written by Austin Cheney.  Use of this function requires
 that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as jspretty function
 <http://prettydiff.com/lib/jspretty.js>

 * cleanCSS.js is originally written by Anthony Lieuallen
 http://tools.arantius.com/tabifier

 - used as cleanCSS function
 <http://prettydiff.com/lib/cleanCSS.js>

 * charDecoder.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as charDecoder function
 <http://prettydiff.com/lib/charDecoder.js>

 * csvbeauty.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as csvbeauty function
 <http://prettydiff.com/lib/csvbeauty.js>

 * csvmin.js is written by Austin Cheney.  Use of this function requires
 that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as csvmin function
 <http://prettydiff.com/lib/csvmin.js>

 * markupmin.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as markupmin function
 <http://prettydiff.com/lib/markupmin.js>

 * markup_beauty.js is written by Austin Cheney.  Use of this function
 requires that credit be given to Austin Cheney.
 http://prettydiff.com/

 - used as markup-beauty function
 <http://prettydiff.com/lib/markup_beauty.js>

 * pd.o object literal is in the api/dom.js file and exists to provide a
 one time and external means of access to the DOM.

 -----------------------------------------------------------------------
 * The code mentioned above has significantly expanded documentation in
 each of the respective function's external JS file as linked from the
 documentation page:
 <http://prettydiff.com/documentation.php>

 * The compilation of cssClean, csvbeauty, csvmin, jsmin, jsdifflib,
 markup_beauty, markupmin, and js-beautify in this manner is a result of
 the prettydiff() function contained in prettydiff.js.  The per
 character highlighting is the result of the charcomp() function also
 contained in prettydiff.js. Any use or redistribution of these
 functions must mention the following:
 Prettydiff created by Austin Cheney originally on 3 Mar 2009.
 <http://prettydiff.com/>

 Join the Pretty Diff mailing list at:
 https://groups.google.com/d/forum/pretty-diff

 * In addition to the previously stated requirements any use of any
 component, aside from directly using the full files in their entirety,
 must restate the license mentioned at the top of each concerned file.


 If each and all these conditions are met use and redistribution of
 prettydiff and its required assets is unlimited without author
 permission.



   @licend  The above is the entire license notice for the JavaScript
   code in this page.