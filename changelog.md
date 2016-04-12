# Pretty Diff change log

## v2.0.0

* Fixed some missing semicolon insertion during JavaScript parsing.
* Fixed a curly brace insertion bug in JavaScript do/while loops.
* Fixes a javascript defect in generated diff report HTML files.
* Expands JavaScript conversion of operators `++` and `--` under the *correct* option.
* Fixes #294
* Fixes #293
* Modified markup `</li>` insertion logic
* Updated test runner file system simulation to work correctly on Windows.
* Added option "parseRecord".  If false the output of mode "parse" is a collection of *parallel* data types. If the option is true the output is a *sequential* array where each index is a child array of data respective to a given parsed token.
* Added option "parseSpace". Determines whether white space content tokens should exist in the parse tree output of the parse mode.
* Enabling accessibility analysis and reporting in the new "analysis" mode.
* **Breaking change** - Updated mode "parse" to output an object with two keys: *definition* and *data*.  The definition property stores a text description of each data type supplied in the data property.  The data property stores the parsed data.
* **Breaking change** - Added mode "analysis" to generate reports of code evaluation.  The program now outputs only the desired data instead of an array of desired data plus a report.
* **Breaking change** - Due to the other changes the Node.js only option *report* is removed.
* **Breaking change** - There is no longer a `global.report` property to store extra information. This is replaced with `global.meta` which stores parse errors, execution duration, number of differences, input size, output size, and can be extended to store additional metadata into the future.
* **Breaking change** - Pretty Diff will no longer publish to NPM.

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
