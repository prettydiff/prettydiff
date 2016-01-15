# Pretty Diff change log

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
