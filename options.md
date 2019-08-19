# Pretty Diff Options

## attribute_sort
property | value
-----------|---
api        | any
default    | false
definition | Alphanumerically sort markup attributes. Attribute sorting is ignored on tags that contain attributes template attributes.
label      | Sort Attributes
lexer      | markup
mode       | any
type       | boolean

## attribute_sort_list
property | value
-----------|---
api        | any
default    | 
definition | A comma separated list of attribute names. Attributes will be sorted according to this list and then alphanumerically. This option requires 'attribute_sort' have a value of true.
label      | Sort Attribute List
lexer      | markup
mode       | any
type       | string

## brace_line
property | value
-----------|---
api        | any
default    | false
definition | If true an empty line will be inserted after opening curly braces and before closing curly braces.
label      | Brace Lines
lexer      | script
mode       | beautify
type       | boolean

## brace_padding
property | value
-----------|---
api        | any
default    | false
definition | Inserts a space after the start of a container and before the end of the container if the contents of that container are not indented; such as: conditions, function arguments, and escaped sequences of template strings.
label      | Brace Padding
lexer      | script
mode       | beautify
type       | boolean

## brace_style
property | value
-----------|---
api        | any
default    | none
definition | Emulates JSBeautify's brace_style option using existing Pretty Diff options.
label      | Brace Style
lexer      | script
mode       | beautify
type       | string
values | collapse, collapse-preserve-inline, expand, none

### Value Definitions
* **collapse** - Sets options.format_object to 'indent' and options.neverflatten to true.
* **collapse-preserve-inline** - Sets options.bracepadding to true and options.format_object to 'inline'.
* **expand** - Sets options.braces to true, options.format_object to 'indent', and options.neverflatten to true.
* **none** - Ignores this option

## braces
property | value
-----------|---
api        | any
default    | false
definition | Determines if opening curly braces will exist on the same line as their condition or be forced onto a new line. (Allman style indentation).
label      | Style of Indent
lexer      | script
mode       | beautify
type       | boolean

## case_space
property | value
-----------|---
api        | any
default    | false
definition | If the colon separating a case's expression (of a switch/case block) from its statement should be followed by a space instead of indentation, thereby keeping the case on a single line of code.
label      | Space Following Case
lexer      | script
mode       | beautify
type       | boolean

## color
property | value
-----------|---
api        | any
default    | white
definition | The color scheme of the reports.
label      | Color
lexer      | any
mode       | any
type       | string
values | canvas, shadow, white

### Value Definitions
* **canvas** - A light brown color scheme
* **shadow** - A black and ashen color scheme
* **white** - A white and pale grey color scheme

## comment_line
property | value
-----------|---
api        | any
default    | false
definition | If a blank new line should be forced above comments.
label      | Force an Empty Line Above Comments
lexer      | markup
mode       | beautify
type       | boolean

## comments
property | value
-----------|---
api        | any
default    | false
definition | This will determine whether comments should always start at position 0 of each line or if comments should be indented according to the code.
label      | Indent Comments
lexer      | any
mode       | beautify
type       | boolean

## complete_document
property | value
-----------|---
api        | any
default    | false
definition | Allows a preference for generating a complete HTML document instead of only generating content.
label      | Generate A Complete HTML File
lexer      | markup
mode       | any
type       | boolean

## compressed_css
property | value
-----------|---
api        | any
default    | false
definition | If CSS should be beautified in a style where the properties and values are minifed for faster reading of selectors.
label      | Compressed CSS
lexer      | style
mode       | beautify
type       | boolean

## conditional
property | value
-----------|---
api        | any
default    | false
definition | If true then conditional comments used by Internet Explorer are preserved at minification of markup.
label      | IE Comments (HTML Only)
lexer      | markup
mode       | minify
type       | boolean

## config
property | value
-----------|---
api        | node
default    | 
definition | By default Pretty Diff will look into the directory structure contain the value of option 'source' for a file named `.prettydiffrc` for saved option settings. This option allows a user to specify any file at any location in the local file system for configuration settings. A value of 'none' tells the application to bypass reading any configuration file.
label      | Custom Config File Location
lexer      | any
mode       | any
type       | string

## content
property | value
-----------|---
api        | any
default    | false
definition | This will normalize all string content to 'text' so as to eliminate some differences from the output.
label      | Ignore Content
lexer      | any
mode       | diff
type       | boolean

## correct
property | value
-----------|---
api        | any
default    | false
definition | Automatically correct some sloppiness in code.
label      | Fix Sloppy Code
lexer      | any
mode       | any
type       | boolean

## crlf
property | value
-----------|---
api        | any
default    | false
definition | If line termination should be Windows (CRLF) format.  Unix (LF) format is the default.
label      | Line Termination
lexer      | any
mode       | any
type       | boolean

## css_insert_lines
property | value
-----------|---
api        | any
default    | false
definition | Inserts new line characters between every CSS code block.
label      | Insert Empty Lines
lexer      | style
mode       | beautify
type       | boolean

## diff
property | value
-----------|---
api        | any
default    | 
definition | The code sample to be compared to 'source' option.  This is required if mode is 'diff'.
label      | Code to Compare
lexer      | any
mode       | diff
type       | string

## diff_comments
property | value
-----------|---
api        | any
default    | false
definition | If true then comments will be preserved so that both code and comments are compared by the diff engine.
label      | Code Comments
lexer      | any
mode       | diff
type       | boolean

## diff_context
property | value
-----------|---
api        | any
default    | -1
definition | This shortens the diff output by allowing a specified number of equivalent lines between each line of difference.  This option is only used with diff_format:html.
label      | Context Size
lexer      | any
mode       | diff
type       | number

## diff_format
property | value
-----------|---
api        | any
default    | text
definition | The format of the output.  The command line output format is text, similar to Unix 'diff'.
label      | Diff Format
lexer      | any
mode       | diff
type       | string
values | html, json, text

### Value Definitions
* **html** - An HTML format for embedding in web pages, or as a complete web page if document_complete is true.
* **json** - A JSON format.
* **text** - Formatted similar to the Unix 'diff' command line utility.

## diff_label
property | value
-----------|---
api        | any
default    | New Sample
definition | This allows for a descriptive label for the diff file code of the diff HTML output.
label      | Label for Diff Sample
lexer      | any
mode       | diff
type       | string

## diff_rendered_html
property | value
-----------|---
api        | any
default    | false
definition | Compares complete HTML documents and injects custom CSS so that the differences display not in the code, but in the rendered page in a browser.  This option is currently confined only to markup languages, read_method file, and mode diff.  Option diff_format is ignored.
label      | Compare Rendered HTML
lexer      | markup
mode       | diff
type       | boolean

## diff_space_ignore
property | value
-----------|---
api        | any
default    | false
definition | If white space only differences should be ignored by the diff tool.
label      | Remove White Space
lexer      | any
mode       | diff
type       | boolean

## diff_view
property | value
-----------|---
api        | any
default    | sidebyside
definition | This determines whether the diff HTML output should display as a side-by-side comparison or if the differences should display in a single table column.
label      | Diff View Type
lexer      | any
mode       | diff
type       | string
values | inline, sidebyside

### Value Definitions
* **inline** - A single column where insertions and deletions are vertically adjacent.
* **sidebyside** - Two column comparison of changes.

## else_line
property | value
-----------|---
api        | any
default    | false
definition | If else_line is true then the keyword 'else' is forced onto a new line.
label      | Else On New Line
lexer      | script
mode       | beautify
type       | boolean

## end_comma
property | value
-----------|---
api        | any
default    | never
definition | If there should be a trailing comma in arrays and objects. Value "multiline" only applies to modes beautify and diff.
label      | Trailing Comma
lexer      | script
mode       | beautify
type       | string
values | always, never, none

### Value Definitions
* **always** - Always ensure there is a tailing comma
* **never** - Remove trailing commas
* **none** - Ignore this option

## end_quietly
property | value
-----------|---
api        | node
default    | default
definition | A node only option to determine if terminal summary data should be logged to the console.
label      | Log Summary to Console
lexer      | any
mode       | any
type       | string
values | default, log, quiet

### Value Definitions
* **default** - Default minimal summary
* **log** - Verbose logging
* **quiet** - No extraneous logging

## force_attribute
property | value
-----------|---
api        | any
default    | false
definition | If all markup attributes should be indented each onto their own line.
label      | Force Indentation of All Attributes
lexer      | markup
mode       | beautify
type       | boolean

## force_indent
property | value
-----------|---
api        | any
default    | false
definition | Will force indentation upon all content and tags without regard for the creation of new text nodes.
label      | Force Indentation of All Content
lexer      | markup
mode       | beautify
type       | boolean

## format_array
property | value
-----------|---
api        | any
default    | default
definition | Determines if all array indexes should be indented, never indented, or left to the default.
label      | Formatting Arrays
lexer      | script
mode       | beautify
type       | string
values | default, indent, inline

### Value Definitions
* **default** - Default formatting
* **indent** - Always indent each index of an array
* **inline** - Ensure all array indexes appear on a single line

## format_object
property | value
-----------|---
api        | any
default    | default
definition | Determines if all object keys should be indented, never indented, or left to the default.
label      | Formatting Objects
lexer      | script
mode       | beautify
type       | string
values | default, indent, inline

### Value Definitions
* **default** - Default formatting
* **indent** - Always indent each key/value pair
* **inline** - Ensure all key/value pairs appear on the same single line

## function_name
property | value
-----------|---
api        | any
default    | false
definition | If a space should follow a JavaScript function name.
label      | Space After Function Name
lexer      | script
mode       | beautify
type       | boolean

## help
property | value
-----------|---
api        | node
default    | 80
definition | A node only option to print documentation to the console. The value determines where to wrap text.
label      | Help Wrapping Limit
lexer      | any
mode       | any
type       | number

## indent_char
property | value
-----------|---
api        | any
default    |  
definition | The string characters to comprise a single indentation. Any string combination is accepted.
label      | Indentation Characters
lexer      | any
mode       | beautify
type       | string

## indent_level
property | value
-----------|---
api        | any
default    | 0
definition | How much indentation padding should be applied to beautification? This option is internally used for code that requires switching between libraries.
label      | Indentation Padding
lexer      | any
mode       | beautify
type       | number

## indent_size
property | value
-----------|---
api        | any
default    | 4
definition | The number of 'indent_char' values to comprise a single indentation.
label      | Indent Size
lexer      | any
mode       | beautify
type       | number

## jsscope
property | value
-----------|---
api        | any
default    | none
definition | An educational tool to generate HTML output of JavaScript code to identify scope regions and declared references by color.  This option is ignored unless the code language is JavaScript or TypeScript.
label      | JavaScript Scope Identification
lexer      | script
mode       | beautify
type       | string
values | html, none, report

### Value Definitions
* **html** - generates HTML output with escaped angle braces and ampersands for embedding as code, which is handy in code producing tools
* **none** - prevents use of this option
* **report** - generates HTML output that renders in web browsers

## language
property | value
-----------|---
api        | any
default    | auto
definition | The lowercase single word common name of the source code's programming language. The value 'auto' imposes language and lexer auto-detection, which ignores deliberately specified lexer values. The value 'text' is converted to 'auto' if options 'mode' is not 'diff'. Value 'text' allows literal comparisons.
label      | Language
lexer      | any
mode       | any
type       | string

## language_default
property | value
-----------|---
api        | any
default    | text
definition | The fallback option if option 'lang' is set to 'auto' and a language cannot be detected.
label      | Language Auto-Detection Default
lexer      | any
mode       | any
type       | string

## language_name
property | value
-----------|---
api        | any
default    | JavaScript
definition | The formatted proper name of the code sample's language for use in reports read by people.
label      | Formatted Name of the Code's Language
lexer      | any
mode       | any
type       | string

## lexer
property | value
-----------|---
api        | any
default    | auto
definition | This option determines which sets of rules to use in the language parser. If option 'language' has a value of 'auto', which is the default value, this option is ignored. The value 'text' is converted to 'auto' if options 'mode' is not 'diff'. Value 'text' allows literal comparisons.
label      | Parsing Lexer
lexer      | any
mode       | any
type       | string
values | auto, markup, script, style

### Value Definitions
* **auto** - The value 'auto' imposes language and lexer auto-detection, which ignores deliberately specified language values.
* **markup** - parses languages like XML and HTML
* **script** - parses languages with a C style syntax, such as JavaScript
* **style** - parses CSS like languages

## list_options
property | value
-----------|---
api        | node
default    | false
definition | A Node.js only option that writes current option settings to the console.
label      | Options List
lexer      | any
mode       | any
type       | boolean

## method_chain
property | value
-----------|---
api        | any
default    | 3
definition | When to break consecutively chained methods and properties onto separate lines. A negative value disables this option. A value of 0 ensures method chains are never broken.
label      | Method Chains
lexer      | script
mode       | beautify
type       | number

## minify_keep_comments
property | value
-----------|---
api        | any
default    | false
definition | Prevents minification from stripping out comments.
label      | Keep Comments
lexer      | any
mode       | minify
type       | boolean

## minify_wrap
property | value
-----------|---
api        | any
default    | false
definition | Whether minified script should wrap after a specified character width.  This option requires a value from option 'wrap'.
label      | Minification Wrapping
lexer      | script
mode       | minify
type       | boolean

## mode
property | value
-----------|---
api        | any
default    | diff
definition | The operation to be performed.
label      | Mode
lexer      | any
mode       | any
type       | string
values | beautify, diff, minify, parse

### Value Definitions
* **beautify** - beautifies code and returns a string
* **diff** - returns either command line list of differences or an HTML report
* **minify** - minifies code and returns a string
* **parse** - using option 'parseFormat' returns an object with shallow arrays, a multidimensional array, or an HTML report

## never_flatten
property | value
-----------|---
api        | any
default    | false
definition | If destructured lists in script should never be flattend.
label      | Never Flatten Destructured Lists
lexer      | script
mode       | beautify
type       | boolean

## new_line
property | value
-----------|---
api        | any
default    | false
definition | Insert an empty line at the end of output.
label      | New Line at End of Code
lexer      | any
mode       | any
type       | boolean

## no_case_indent
property | value
-----------|---
api        | any
default    | false
definition | If a case statement should receive the same indentation as the containing switch block.
label      | Case Indentation
lexer      | script
mode       | beautify
type       | boolean

## no_lead_zero
property | value
-----------|---
api        | any
default    | false
definition | Whether leading 0s in CSS values immediately preceding a decimal should be removed or prevented.
label      | Leading 0s
lexer      | style
mode       | any
type       | boolean

## no_semicolon
property | value
-----------|---
api        | any
default    | false
definition | Removes semicolons that would be inserted by ASI. This option is in conflict with option 'correct' and takes precedence over conflicting features. Use of this option is a possible security/stability risk.
label      | No Semicolons
lexer      | script
mode       | beautify
type       | boolean

## node_error
property | value
-----------|---
api        | node
default    | false
definition | A Node.js only option if parse errors should be written to the console.
label      | Write Parse Errors in Node
lexer      | any
mode       | any
type       | boolean

## object_sort
property | value
-----------|---
api        | any
default    | false
definition | Sorts markup attributes and properties by key name in script and style.
label      | Object/Attribute Sort
lexer      | any
mode       | beautify
type       | boolean

## output
property | value
-----------|---
api        | node
default    | 
definition | A file path for which to write output. If this option is not specified output will be printed to the shell.
label      | Output Location
lexer      | any
mode       | any
type       | string

## parse_format
property | value
-----------|---
api        | any
default    | parallel
definition | Determines the output format for 'parse' mode.
label      | Parse Format
lexer      | any
mode       | parse
type       | string
values | htmltable, parallel, sequential, table

### Value Definitions
* **htmltable** - generates the 'table' type output for the DOM but escapes the HTML tags for rendering as HTML code in a HTML tool
* **parallel** - returns an object containing series of parallel arrays
* **sequential** - returns an array where each index is a child object containing the parsed token and all descriptive data
* **table** - generates a colorful grid of output for either the dom or command line interface

## parse_space
property | value
-----------|---
api        | any
default    | false
definition | Whether whitespace tokens should be included in markup parse output.
label      | Retain White Space Tokens in Parse Output
lexer      | markup
mode       | parse
type       | boolean

## preserve
property | value
-----------|---
api        | any
default    | 0
definition | The maximum number of consecutive empty lines to retain.
label      | Preserve Consecutive New Lines
lexer      | any
mode       | beautify
type       | number

## preserve_comment
property | value
-----------|---
api        | any
default    | false
definition | Prevent comment reformatting due to option wrap.
label      | Eliminate Word Wrap Upon Comments
lexer      | any
mode       | beautify
type       | boolean

## preserve_text
property | value
-----------|---
api        | any
default    | false
definition | If text in the provided markup code should be preserved exactly as provided. This option eliminates beautification and wrapping of text content.
label      | Preserve Markup Text White Space
lexer      | markup
mode       | any
type       | boolean

## quote
property | value
-----------|---
api        | any
default    | false
definition | If true and mode is 'diff' then all single quote characters will be replaced by double quote characters in both the source and diff file input so as to eliminate some differences from the diff report HTML output.
label      | Normalize Quotes
lexer      | any
mode       | diff
type       | boolean

## quote_convert
property | value
-----------|---
api        | any
default    | none
definition | If the quotes of script strings or markup attributes should be converted to single quotes or double quotes.
label      | Indent Size
lexer      | any
mode       | any
type       | string
values | double, none, single

### Value Definitions
* **double** - Converts single quotes to double quotes
* **none** - Ignores this option
* **single** - Converts double quotes to single quotes

## read_method
property | value
-----------|---
api        | node
default    | auto
definition | The option determines how Node.js should receive input.  All output will be printed to the shell unless the option 'output' is specified, which will write output to a file.
label      | Read Method
lexer      | any
mode       | any
type       | string
values | auto, directory, file, screen, subdirectory

### Value Definitions
* **auto** - changes to value subdirectory, file, or screen depending on source resolution
* **directory** - process all files in the specified directory only
* **file** - reads a file and outputs to a file.  file requires option 'output'
* **screen** - reads from screen and outputs to screen
* **subdirectory** - process all files in a directory and its subdirectories

## selector_list
property | value
-----------|---
api        | any
default    | false
definition | If comma separated CSS selectors should present on a single line of code.
label      | Indent Size
lexer      | style
mode       | beautify
type       | boolean

## semicolon
property | value
-----------|---
api        | any
default    | false
definition | If true and mode is 'diff' and lang is 'javascript' all semicolon characters that immediately precede any white space containing a new line character will be removed so as to eliminate some differences from the code comparison.
label      | Indent Size
lexer      | script
mode       | diff
type       | boolean

## source
property | value
-----------|---
api        | any
default    | 
definition | The source code or location for interpretation. This option is required for all modes.
label      | Source Sample
lexer      | any
mode       | any
type       | string

## source_label
property | value
-----------|---
api        | any
default    | Source Sample
definition | This allows for a descriptive label of the source file code for the diff HTML output.
label      | Label for Source Sample
lexer      | any
mode       | diff
type       | string

## space
property | value
-----------|---
api        | any
default    | true
definition | Inserts a space following the function keyword for anonymous functions.
label      | Function Space
lexer      | script
mode       | beautify
type       | boolean

## space_close
property | value
-----------|---
api        | any
default    | false
definition | Markup self-closing tags end will end with ' />' instead of '/>'.
label      | Close Markup Self-Closing Tags with a Space
lexer      | markup
mode       | beautify
type       | boolean

## styleguide
property | value
-----------|---
api        | any
default    | none
definition | Provides a collection of option presets to easily conform to popular JavaScript style guides.
label      | Script Styleguide
lexer      | script
mode       | beautify
type       | string
values | airbnb, crockford, google, jquery, jslint, mediawiki, mrdoob, none, semistandard, standard, yandex

### Value Definitions
* **airbnb** - https://github.com/airbnb/javascript
* **crockford** - http://jslint.com/
* **google** - https://google.github.io/styleguide/jsguide.html
* **jquery** - https://contribute.jquery.org/style-guide/js/
* **jslint** - http://jslint.com/
* **mediawiki** - https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript
* **mrdoob** - https://github.com/mrdoob/three.js/wiki/Mr.doob's-Code-Style%E2%84%A2
* **none** - Ignores this option
* **semistandard** - https://github.com/Flet/semistandard
* **standard** - https://standardjs.com/
* **yandex** - https://github.com/ymaps/codestyle/blob/master/javascript.md

## summary_only
property | value
-----------|---
api        | node
default    | false
definition | Node only option to output only number of differences.
label      | Output Diff Only Without A Summary
lexer      | any
mode       | diff
type       | boolean

## tag_merge
property | value
-----------|---
api        | any
default    | false
definition | Allows immediately adjacement start and end markup tags of the same name to be combined into a single self-closing tag.
label      | Merge Adjacent Start and End tags
lexer      | markup
mode       | any
type       | boolean

## tag_sort
property | value
-----------|---
api        | any
default    | false
definition | Sort child items of each respective markup parent element.
label      | Sort Markup Child Items
lexer      | markup
mode       | any
type       | boolean

## ternary_line
property | value
-----------|---
api        | any
default    | false
definition | If ternary operators in JavaScript ? and : should remain on the same line.
label      | Keep Ternary Statements On One Line
lexer      | script
mode       | beautify
type       | boolean

## top_comments
property | value
-----------|---
api        | any
default    | false
definition | If mode is 'minify' this determines whether comments above the first line of code should be kept.
label      | Retain Comment At Code Start
lexer      | any
mode       | minify
type       | boolean

## unformatted
property | value
-----------|---
api        | any
default    | false
definition | If markup tags should have their insides preserved. This option is only available to markup and does not support child tokens that require a different lexer.
label      | Markup Tag Preservation
lexer      | markup
mode       | any
type       | boolean

## variable_list
property | value
-----------|---
api        | any
default    | none
definition | If consecutive JavaScript variables should be merged into a comma separated list or if variables in a list should be separated.
label      | Variable Declaration Lists
lexer      | script
mode       | any
type       | string
values | each, list, none

### Value Definitions
* **each** - Ensurce each reference is a single declaration statement.
* **list** - Ensure consecutive declarations are a comma separated list.
* **none** - Ignores this option.

## version
property | value
-----------|---
api        | node
default    | false
definition | A Node.js only option to write the version information to the console.
label      | Version
lexer      | any
mode       | any
type       | boolean

## vertical
property | value
-----------|---
api        | any
default    | false
definition | If lists of assignments and properties should be vertically aligned. This option is not used with the markup lexer.
label      | Vertical Alignment
lexer      | any
mode       | beautify
type       | boolean

## wrap
property | value
-----------|---
api        | any
default    | 0
definition | Character width limit before applying word wrap. A 0 value disables this option. A negative value concatenates script strings.
label      | Wrap
lexer      | any
mode       | any
type       | number