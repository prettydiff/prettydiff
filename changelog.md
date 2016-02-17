# Pretty Diff change log

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
