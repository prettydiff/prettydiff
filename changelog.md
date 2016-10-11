# Pretty Diff change log

## v2.1.14

* A string wrap adjustment in support of https://github.com/prettydiff/biddle and in conformance to JSLint

## v2.1.13

* Fixing a minor incompatibility with JSLint

## v2.1.12

### Defect resolutions
* Fixes #370, JavaScript string wrapping defect
* Fixes #372, edge case failure of JavaScript ASI
* Fixes #373, fixes two Twig issues
* Fixes a minor JavaScript indentation problem of method arguments following a long wrapped string

## v2.1.11

### Defect resolutions
* Fixes #363, resolves several defects with option `bracepadding`
* Fixes #365, catastrophic parsing flaw for Liquid HTML templates

### Enhancement
* Fixes #366, adding support for GoHTML template language

## v2.1.10

### Defect resolutions
* Fixes #360, incorrect markup parsing for multiple tag structures in a single JSX return
* Reverting code validation back to 2.1.8 version for stability

### Enhancement
* Fixes #362, providing support for Flow.js
* Better TSX support

## v2.1.9
* Better comment beautification
* Language identification for some forms of C/C++ (not supported)

## v2.1.8

### Defect resolutions
* Fixed #356 - C# code sample defect: binary literal notation, inline comments between `)` and `{` of blocks
* Fixed #352 - a TypeScript defect that left code with too much indentation.

### Enhancement
* Fixed #354 - ERB tag indentation
* Fixed #353 - Upgrading markup attribute parsing to parse values apart from attribute names.
* Modified code in support of a JSLint enhancement.

## v2.1.7

### Defect resolutions
* Fixed #349 - Added curly braces as markup attribute delimiters in support of RiotJS

## v2.1.6

### Defect resolutions
* Fixed a defect in the HTML instructional guides

## v2.1.5

### Defect resolutions
* Fixed #346 - Fixed CSS defect where `selector :first-child` becomes `selector:first-child`

### Enhancement
* #202, #344 - Adding support for TypeScript, TSX, Java, and C# languages with unit tests

## v2.1.4
* bug fixes

## v2.1.3

### Defect resolutions
* Fixed #338 - Fixed defective support of SCSS maps
* Fixed #340 - Fixed a collision with Twig and Liquid syntaxes

### Enhancement
* #334 - Centralized and isolated options management

## v2.1.1

### Defect resolutions
* Fixed #330 - Corrupted markup parsing when encountering style properties parsed as JavaScript regex
* Fixed #331 - Empty lines scrubbed from CSS prior to *@media* declarations
* Fixed #332 - Broken code on an edge case with diff option `diffspaceignore`
* Fixed #333 - `summaryonly` diff option was broken

### Enhancement
* #334 - Advanced markup attribute parsing so that attributes can contain child tags with quoted attributes identical to the quotes encapsulating this child tag without collision and without regression

### New Options
* **endcomma** - Prior existing option `endcomma` converted from boolean to string to add value `multiline` so that terminal commas are only added to arrays and objects spanning multiple lines. issue #335
* **brace_style** - Adds a new option similar to JSBeautify's brace_style option. issue #326


## v2.1.0

### Defect resolutions
* Fixed #289 - Minor enhancement to the fuzzy string comparison of the diff library.
* Fixed #321 - Several edge case markup parsing defects
* Fixed #324 - JSX parsing defect related to XML tags inside JS arrays

### New Options
* **apacheVelocity** - Supplies support Apache Velocity with a variety of delimiters. issue #280
* **qml** - Adds support for QML language using the JavaScript parser. issue #278

## v2.0.5

### Defect resolutions
* Fixed #262 - Adds substantially greater depth to the parsers' direct output.
* Fixed #317 - The JavaScript keyword `export` was not properly supported resulting in a semicolon being injected into the object body.
* Fixed #318 - An enhancement to autocorrect for markup tags that contain an extra brace at the front or back. This minor enhancement also exposed a defect in support of `<<` and `<<<` delimited tags.

### New Options
* **functionname** - Supplies a space after a function's name. issue #312
* **jekyll** - Adds support for YAML Jekyll HTML template comments delimited by `---`. issue #311

## v2.0.2

* **attributetoken**.  Whether attributes should be parsed as a data property of the element or a separate token in the parse table.
* Markup code now outputs two additional data facets on the parse table: begin and daddy.  Daddy stores the tag name of a token's parent element.  Begin stores the index of that parent element.

## v2.0.1

### Defect resolutions
* Fixed a defect in the markup parser regarding properly parsing JavaScript and CSS comments
* Fixed a JSScope defect when functions are incomplete
* Fixed issue #290

### New Options
* formatArray - Determines whether JavaScript array indexes should always indented, remain on a single line, or left to the default formatting. issue #276
* formatObject - Determines whether JavaScript object properties should always indented, remain on a single line, or left to the default formatting. issue #277

## v2.0.0

### Breaking changes
* Updated mode "parse" to output an object with two keys: *definition* and *data*.  The definition property stores a text description of each data type supplied in the data property.  The data property stores the parsed data.
* Added mode "analysis" to generate reports of code evaluation.  The program now outputs only the desired data instead of an array of desired data plus a report.
* Due to the other changes the Node.js only option *report* is removed.
* There is no longer a `global.report` property to store extra information. This is replaced with `global.meta` which stores parse errors, execution duration, number of differences, input size, output size, and can be extended to store additional metadata into the future.
* **Pretty Diff will no longer publish to NPM.** - https://github.com/prettydiff/prettydiff/issues/291

### New Options
* **nodeasync**.  Asynchronous bulk operations like reading from a directory produces cross-talk when assigning meta data to a global object.  The desired goal of version 2 is to have the prettydiff function return a single string and meta data to a global object.  In this case, for reliability, the prettydiff function will return an array of [data, meta] where data is the desired string output and meta is the metadata object similar to Pretty Diff version 1.
* **nodeerror**.  Sometimes it is desirable and informative to log parse errors to the console.  Such a feature can become excessive noise and break unit tests though.
* **parseRecord**.  If false the output of mode "parse" is a collection of *parallel* data types. If the option is true the output is a *sequential* array where each index is a child array of data respective to a given parsed token.
* **parseSpace**.  Determines whether white space content tokens should exist in the parse tree output of the parse mode.

### Minor fixes:
* Enabling accessibility analysis and reporting in the new "analysis" mode.
* Fixed some missing semicolon insertion during JavaScript parsing.
* Fixed a curly brace insertion bug in JavaScript do/while loops.
* Fixes a javascript defect in generated diff report HTML files.
* Fixes a defect in "varword: list" where comments precede the reference.
* Option varword now accounts for var, let, and const
* Expands JavaScript conversion of operators `++` and `--` under the *correct* option.
* Fixes #294
* Fixes #293
* Modified markup `</li>` insertion logic
* Updated test runner file system simulation to work correctly on Windows.

## v1.16.37

* Stronger CSS edge case parsing support
* Including NPM package 5028 as a devDependency

## v1.16.30

* Adding support for Volt templates
* Fixed a URI resolution defect in the web tool.

## v1.16.29

* Fixed #287
* Added new option `nochainindent`
* Adding support for Elm templates
* Fixing a minor bug in the web tool between changing languages and use the Ace editor

## v1.16.28

* Adding support for Liquid templates
* Adding extend general templating support to CSS and JS
* Provided contribution guidance to the documentation
* Fixed https://github.com/Glavin001/atom-beautify/issues/848#issuecomment-192880016
* Fixed a collision between Ace editor, Pretty Diff library support, and require.js

## v1.16.26

* Fixed a minor CSS defect related as exposed by https://github.com/Glavin001/atom-beautify/issues/840
* Fixed a JSX spacing error as exposed by https://github.com/Glavin001/atom-beautify/issues/838

## v1.16.25

* Fixed a minor markup defect regarding improperly inserting `</li>` tags if code samples start with `<ul>` or `<ol>`
* Minor improvements to the documentation
* A minor adjustment to the resolution for #281.

## v1.16.24

* Fixed #281

## v1.16.23

* Changed option `preserve` to a numeric type.  This change allows preservation of a series of empty lines up to the indicated maximum.
* Fixed a markup defect related to files terminating in a closing script or style tag.
* Removed a rare instability in command line operations.

## v1.16.22

* Fixed #274
* Adjusted safeSort library to fix a compatibility problem with recursive function references in V8 and legacy versions of Node

## v1.16.21

* Fixed https://github.com/Glavin001/atom-beautify/issues/403#issuecomment-188458019
* Fixed a minor defect in associating the value "log" with the new option `endquietly`

## v1.16.20

 * Fixed #273

## v1.16.19

 * Fixed #272

## v1.16.18

 * Improved folding in the HTML diff reports
 * Improved column sliding interaction on the HTML diff reports (sidebyside view)
 * Fixed #271
 * Fixed #218 (providing additional requirements to an incomplete implementation)

## v1.16.17

 * Fixed https://github.com/Glavin001/atom-beautify/issues/812
 * Fixed https://github.com/Glavin001/atom-beautify/issues/811

## v1.16.16

 * Fixed a critical EJS defect - https://github.com/Glavin001/atom-beautify/issues/806

## v1.16.15

 * Fixed #218 - support for TWIG template language
 * Fixed #265
 * Fixed #266
 * Fixed #267
 * Fixed comment bug in lib/jspretty.js
 * Smarter ASI (automatic semicolon insertion in JavaScript)

## v1.16.14

 * Added option `compressedcss` - http://prettydiff.com/documentation.xhtml#compressedcss
 * Added option `force_attribute` - http://prettydiff.com/documentation.xhtml#force_attribute
 * Updated unit tests and fixed some directory level file reading/write issues from api/node-local.js
 * Fixed two issues with CSS in issue #260
 * Simplified JSX parsing in issue #261
 * Minor bug fixes

## v1.16.13

 * Fixed #257
 * Fixed #258
 * Fixed a couple minor defects
 * Rewrote CSS code from scratch
 * Rewrote HTML document generation from scratch

## v1.16.12

 * Fixed #252
 * Fixes a minor CSS empty line issue.
 * PHP tags and ASP tags embedded in JavaScript string literals are now supported.

## v1.16.11

 * Fixed #251
 * Fixes numerous issues with JavaScript comment beautification

## v1.16.10

 * Added error messaging to markuppretty.js library for some cases where it receives code that is not markup
 * Added ES6 blocks as a unique structure form to jspretty.js library
    - This only applies to blocks immediately following semicolons
 * Adjusting file counting in node-local.js to increase unit test predictability against directories

## v1.16.9

 * New documentation
 * More predictable unit tests, specifically the simulation and node interaction
 * Minor bug fixes

## v1.16.8

 * Fixing a major regression issues from v1.16.7 for CLI operation and unit testing on Windows only

## v1.16.7

 * Updates to the api/node-local.js
 * Simulations for api/node-local.js added to the unit tests
 * Unit test phases are now plug and play and their order is now customizable
 * Minor update to lib/jspretty.js
 * Better word identification in diffs
