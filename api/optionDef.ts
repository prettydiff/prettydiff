(function options_init():void {
    "use strict";
    const optionDef = {
            accessibility    : {
                api       : "any",
                mode      : "analysis",
                lexer     : "markup",
                label     : "Accessibility Analysis",
                type      : "boolean",
                definition: "Whether analysis of HTML should include an accessibility report.",
                default   : false
            },
            brace_style    : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Brace Style",
                type      : "string",
                definition: "Emulates JSBeautify's brace_style option using existing Pretty Diff options.",
                values    : {
                    "collapse": "Sets options.formatObject to 'indent' and options.neverflatten to true.",
                    "collapse-preserve-inline": "Sets options.bracepadding to true and options.formatObject to 'inline'.",
                    "expand": "Sets options.braces to true, options.formatObject to 'indent', and options.neverflatten to true.",
                    "none": "Ignores this option"
                },
                default   : "none"
            },
            braceline      : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Brace Lines",
                type      : "boolean",
                definition: "If true a new line character will be inserted after opening curly braces and b" +
                        "efore closing curly braces.",
                default   : false
            },
            bracepadding   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                type      : "boolean",
                label     : "Brace Padding",
                definition: "Inserts a space after the start of a container and before the end of the contain" +
                        "er if the contents of that container are not indented; such as: " +
                        "conditions, function arguments, and escaped sequences of template strings.",
                default   : false
            },
            braces         : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Style of Indent",
                type      : "boolean",
                definition: "Determines if opening curl" +
                        "y braces will exist on the same line as their condition or be forced onto a ne" +
                        "w line.",
                default   : false
            },
            color          : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Color",
                type      : "string",
                definition: "The color scheme of the reports.",
                default   : "white",
                values    : {
                    "canvas": "A light brown color scheme",
                    "shadow": "A black and ashen color scheme",
                    "white": "A white and pale grey color scheme"
                }
            },
            comments       : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Indent Comments",
                type      : "boolean",
                definition: "This will determine whether comments should always start" +
                        " at position 0 of each line or if comments should be indented according to the" +
                        " code.",
                default   : false
            },
            commline       : {
                api       : "any",
                mode      : "beautify",
                lexer     : "markup",
                label     : "Force an Empty Line Above Comments",
                type      : "boolean",
                definition: "If a blank new line should be forced above comments.",
                default   : false
            },
            compressedcss  : {
                api       : "any",
                mode      : "beautify",
                lexer     : "css",
                label     : "Compressed CSS",
                type      : "boolean",
                definition: "If CSS should be beautified in a style where the properties and values are min" +
                        "ifed for faster reading of selectors.",
                default   : false
            },
            conditional    : {
                api       : "any",
                mode      : "minify",
                lexer     : "markup",
                label     : "IE Comments (HTML Only)",
                type      : "boolean",
                definition: "If true then conditional comments used by Internet Explorer are preserved at m" +
                        "inification of markup.",
                default   : false
            },
            content        : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Ignore Content",
                type      : "boolean",
                definition: "This will normalize all string content to 'text' so as to eliminate some diffe" +
                        "rences from the output.",
                default   : false
            },
            context        : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Context Size",
                type      : "number",
                definition: "This shortens the diff output by allowing a specified number of equivalent lin" +
                        "es between each line of difference.",
                default   : -1
            },
            correct        : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Fix Sloppy Code",
                type      : "boolean",
                definition: "Automatically correct some sloppiness in code.",
                default   : false
            },
            crlf           : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Line Termination",
                type      : "boolean",
                definition: "If line termination should be Windows (CRLF) format.  Unix (LF) format is the " +
                        "default.",
                default   : false
            },
            cssinsertlines : {
                api       : "any",
                mode      : "beautify",
                lexer     : "css",
                label     : "Insert Empty Lines",
                type      : "boolean",
                definition: "Inserts new line characters between every CSS code block.",
                default   : false
            },
            csvchar        : {
                api       : "any",
                mode      : "any",
                lexer     : "csv",
                label     : "Character Separator",
                type      : "string",
                definition: "The character to be used as a separator if lang is 'csv'.  Any string combinat" +
                        "ion is accepted.",
                default   : ","
            },
            diff           : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Code to Compare",
                type      : "string",
                definition: "The code sample to be compared to 'source' option. This is required if mode is" +
                        " 'diff'.",
                default   : ""
            },
            diffcli        : {
                api       : "node",
                mode      : "diff",
                lexer     : "any",
                label     : "Diff Format",
                type      : "boolean",
                definition: "If true only text lines of the code differences are returned instead of an HTM" +
                        "L diff report.",
                default   : true
            },
            diffcomments   : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Code Comments",
                type      : "boolean",
                definition: "If true then comments will be preserved so that both code and comments are com" +
                        "pared by the diff engine.",
                default   : false
            },
            difflabel      : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Label for Diff Sample",
                type      : "string",
                definition: "This allows for a descriptive label for the diff file code of the diff HTML ou" +
                        "tput.",
                default   : "New Sample"
            },
            diffspaceignore: {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Remove White Space",
                type      : "boolean",
                definition: "If white space only differences should be ignored by the diff tool.",
                default   : false
            },
            diffview       : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Diff View Type",
                type      : "string",
                definition: "This determines whether the diff HTML output should display as a side-by-side " +
                        "comparison or if the differences should display in a single table column.",
                values    : {
                    "inline": "A single column where insertions and deletions are vertically adjacent.",
                    "sidebyside": "Two column comparison of changes."
                },
                default   : "sidebyside"
            },
            elseline       : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Else On New Line",
                type      : "boolean",
                definition: "If elseline is true then the keyword 'else' is forced onto a new line.",
                default   : false
            },
            endcomma       : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Indent Comments",
                type      : "string",
                definition: "If there should be a trailing comma in arrays and objects. Value \"" +
                        "multiline\" only applies to modes beautify and diff.",
                values    : {
                    "always": "Always ensure there is a tailing comma",
                    "multiline": "Ignore this option",
                    "never": "Remove trailing commas"
                },
                default   : "never"
            },
            endquietly     : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Log Summary to Console",
                type      : "string",
                definition: "A node only option to determine if terminal summary data should be logged to the console.",
                values    : {
                    "default": "Default minimal summary",
                    "log": "Verbose logging",
                    "quiet": "No extraneous logging"
                },
                default   : "default"
            },
            force_attribute: {
                api       : "any",
                mode      : "beautify",
                lexer     : "markup",
                label     : "Force Indentation of All Attributes",
                type      : "boolean",
                definition: "If all markup attributes should be indented each onto their own line.",
                default   : false
            },
            force_indent   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "markup",
                label     : "Force Indentation of All Content",
                type      : "boolean",
                definition: "Will force indentation upon all content and tags with" +
                        "out regard for the creation of new text nodes.",
                default   : false
            },
            formatArray    : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Formatting Arrays",
                type      : "string",
                definition: "Determines if all array indexes should be indented, never indented," +
                        " or left to the default.",
                values    : {
                    "default": "Default formatting",
                    "indent": "Always indent each index of an array",
                    "inline": "Ensure all array indexes appear on a single line"
                },
                default   : "default"
            },
            formatObject   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Formatting Objects",
                type      : "string",
                definition: "Determines if all object keys should be indented, never indented," +
                        " or left to the default.",
                values    : {
                    "default": "Default formatting",
                    "indent": "Always indent each key/value pair",
                    "inline": "Ensure all key/value pairs appear on the same single line"
                },
                default   : "default"
            },
            functionname   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Space After Function Name",
                type      : "boolean",
                definition: "If a space should follow a JavaScript function name.",
                default   : false
            },
            help           : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Help Wrapping Limit",
                type      : "number",
                definition: "A node only option to print documentation to the console. The value determines" +
                        " where to wrap text.",
                default   : 80
            },
            inchar         : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Indentation Characters",
                type      : "string",
                definition: "The string characters to comprise a single indentation. Any string combination" +
                        " is accepted.",
                default   : " "
            },
            inlevel        : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Indentation Padding",
                type      : "number",
                definition: "How much indentation padding should be applied to beautification?",
                default   : 0
            },
            insize         : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Indent Size",
                type      : "number",
                definition: "The number of 'inchar' values to comprise a single indentation.",
                default   : 4
            },
            jsscope        : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "JavaScript Scope Identification",
                type      : "string",
                definition: "An educational tool to generate HTML output of JavaScript code to identify sco" +
                        "pe regions and declared references by color.",
                values    : {
                    none  : "prevents use of this option",
                    report: "generates HTML output that renders in web browsers",
                    html  : "generates HTML output with escaped angle braces and ampersands for embedding a" +
                            "s code, which is handy in code producing tools"
                },
                default   : "none"
            },
            lang           : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Language",
                type      : "string",
                definition: "The lowercase single word common name of the source code's programming language.",
                default   : "auto"
            },
            langdefault    : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Language Auto-Detection Default",
                type      : "string",
                definition: "The fallback option if option 'lang' is set to 'auto' and a language cannot be" +
                        " detected.",
                default   : "text"
            },
            lexer          : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Parsing Lexer",
                type      : "string",
                definition: "This option determines which sets of rules to use in the language parser. If option 'language' has a value of 'auto' this option is ignored.",
                values    : {
                    markup: "parses languages like XML and HTML",
                    script: "parses languages with a C style syntax, such as JavaScript",
                    style : "parses CSS like languages"
                },
                default   : "script"
            },
            listoptions    : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Options List",
                type      : "boolean",
                definition: "A Node.js only option that writes current option settings to the console.",
                default   : false
            },
            methodchain    : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Method Chains",
                type      : "string",
                definition: "Whether consecutively referenced methods should be chained onto a single line of" +
                        " code instead of indented.",
                values    : {
                    "chain": "Ensure a chain of methods not separated by whitespace",
                    "indent": "Indent each on each method",
                    "none": "Ignore this option"
                },
                default   : "indent"
            },
            miniwrap       : {
                api       : "any",
                mode      : "minify",
                lexer     : "script",
                label     : "Minification Wrapping",
                type      : "boolean",
                definition: "Whether minified script should wrap after a specified character width.  Th" +
                        "is option requires a value from option 'wrap'.",
                default   : false
            },
            mode           : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Mode",
                type      : "string",
                definition: "The operation to be performed.",
                values    : {
                    analysis: "returns a code examination report",
                    beautify: "beautifies code and returns a string",
                    diff    : "returns either command line list of differences or an HTML report",
                    minify  : "minifies code and returns a string",
                    parse   : "using option 'parseFormat' returns an object with shallow arrays, a multidimen" +
                            "sional array, or an HTML report"
                },
                default   : "diff"
            },
            newline        : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "New Line at End of Code",
                type      : "boolean",
                definition: "Insert an empty line at the end of output.",
                default   : false
            },
            neverflatten   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Never Flatten Destructured Lists",
                type      : "boolean",
                definition: "If destructured lists in script should never be flattend.",
                default   : false
            },
            nocaseindent   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Case Indentation",
                type      : "boolean",
                definition: "If a case statement should receive the same indentation as the containing swit" +
                        "ch block.",
                default   : false
            },
            nodeerror      : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Write Parse Errors in Node",
                type      : "boolean",
                definition: "A Node.js only option if parse errors should be written to the console.",
                default   : false
            },
            noleadzero     : {
                api       : "any",
                mode      : "any",
                lexer     : "style",
                label     : "Leading 0s",
                type      : "boolean",
                definition: "Whether leading 0s in CSS values immediately preceeding a decimal should be re" +
                        "moved or prevented.",
                default   : false
            },
            objsort        : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Object/Attribute Sort",
                type      : "boolean",
                definition: "Sorts markup attributes and properties by key name in script and style.",
                default   : false
            },
            output         : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Output Location",
                type      : "string",
                definition: "The path of the directory, if readmethod is value 'directory', or path and nam" +
                        "e of the file to write the output.  The path will be created or overwritten.",
                default   : ""
            },
            parseFormat    : {
                api       : "any",
                mode      : "parse",
                lexer     : "any",
                label     : "Parse Format",
                type      : "string",
                definition: "Determines the output format for 'parse' mode.",
                values    : {
                    htmltable : "generates a human readable report in the format of an HTML table",
                    parallel  : "returns a series of parallel arrays",
                    sequential: "returns an array where each index is a child array containing the parsed token" +
                            " and all descriptive data"
                },
                default   : "parallel"
            },
            parseSpace     : {
                api       : "any",
                mode      : "parse",
                lexer     : "markup",
                label     : "Retain White Space Tokens in Parse Output",
                type      : "boolean",
                definition: "Whether whitespace tokens should be included in markup parse output.",
                default   : false
            },
            preserve       : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Preserve Consecutive New Lines",
                type      : "number",
                definition: "The maximum number of consecutive empty lines to retain.",
                default   : 0
            },
            preserveComment: {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Eliminate Word Wrap Upon Comments",
                type      : "boolean",
                definition: "Prevent comment reformatting due to option wrap.",
                default   : false
            },
            quote          : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Normalize Quotes",
                type      : "boolean",
                definition: "If true and mode is 'diff' then all single quote characters will be replaced b" +
                        "y double quote characters in both the source and diff file input so as to elim" +
                        "inate some differences from the diff report HTML output.",
                default   : false
            },
            quoteConvert   : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Indent Size",
                type      : "string",
                definition: "If the quotes of script strings or markup attributes should be converted t" +
                        "o single quotes or double quotes.",
                values    : {
                    "double": "Converts single quotes to double quotes",
                    "single": "Converts double quotes to single quotes",
                    "none": "Ignores this option"
                },
                default   : "none"
            },
            readmethod     : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Read Method",
                type      : "string",
                definition: "The readmethod determines how Node.js should receive input and output.",
                values    : {
                    auto        : "changes to value subdirectory, file, or screen depending on source resolution",
                    screen      : "reads from screen and outputs to screen",
                    file        : "reads a file and outputs to a file.  file requires option 'output'",
                    filescreen  : "reads a file and writes to screen",
                    directory   : "process all files in the specified directory only",
                    subdirectory: "process all files in a directory and its subdirectories"
                },
                default   : "auto"
            },
            selectorlist   : {
                api       : "any",
                mode      : "beautify",
                lexer     : "style",
                label     : "Indent Size",
                type      : "boolean",
                definition: "If comma separated CSS selectors should present on a single line of code.",
                default   : false
            },
            semicolon      : {
                api       : "any",
                mode      : "diff",
                lexer     : "script",
                label     : "Indent Size",
                type      : "boolean",
                definition: "If true and mode is 'diff' and lang is 'javascript' all semicolon characters t" +
                        "hat immediately preceed any white space containing a new line character will b" +
                        "e removed so as to elimate some differences from the code comparison.",
                default   : false
            },
            source         : {
                api       : "any",
                mode      : "any",
                lexer     : "any",
                label     : "Source Sample",
                type      : "string",
                definition: "The source code or location for interpretation. This option is required for al" +
                        "l modes.",
                default   : ""
            },
            sourcelabel    : {
                api       : "any",
                mode      : "diff",
                lexer     : "any",
                label     : "Label for Source Sample",
                type      : "string",
                definition: "This allows for a descriptive label of the source file code for the diff HTML o" +
                        "utput.",
                default   : "Source Sample"
            },
            space          : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Function Space",
                type      : "boolean",
                definition: "Inserts a space following the function keyword for anonymous functions.",
                default   : true
            },
            spaceclose     : {
                api       : "any",
                mode      : "beautify",
                lexer     : "markup",
                label     : "Close Markup Self-Closing Tags with a Space",
                type      : "boolean",
                definition: "Markup self-closing tags end will end with ' />' instead of '/>'.",
                default   : false
            },
            styleguide     : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Script Styleguide",
                type      : "string",
                definition: "Provides a collection of option presets to easily conform to popular JavaScrip" +
                        "t style guides.",
                values    : {
                    "airbnb": "https://github.com/airbnb/javascript",
                    "crockford": "http://jslint.com/",
                    "google": "https://google.github.io/styleguide/jsguide.html",
                    "jquery": "https://contribute.jquery.org/style-guide/js/",
                    "jslint": "http://jslint.com/",
                    "mediawiki": "https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript",
                    "mrdoob": "https://github.com/mrdoob/three.js/wiki/Mr.doob's-Code-Style%E2%84%A2",
                    "standard": "https://standardjs.com/",
                    "yandex": "https://github.com/ymaps/codestyle/blob/master/javascript.md",
                    "none": "Ignores this option"
                },
                default   : "none"
            },
            summaryonly    : {
                api       : "node",
                mode      : "diff",
                lexer     : "any",
                label     : "Output Diff Only Without A Summary",
                type      : "boolean",
                definition: "Node only option to output only number of differences.",
                default   : false
            },
            tagmerge       : {
                api       : "any",
                mode      : "any",
                lexer     : "markup",
                label     : "Merge Adjacent Start and End tags",
                type      : "boolean",
                definition: "Allows immediately adjacement start and end markup tags of the same name to be" +
                        " combined into a single self-closing tag.",
                default   : false
            },
            tagsort        : {
                api       : "any",
                mode      : "any",
                lexer     : "markup",
                label     : "Sort Markup Child Items",
                type      : "boolean",
                definition: "Sort child items of each respective markup parent element.",
                default   : false
            },
            textpreserve   : {
                api       : "any",
                mode      : "any",
                lexer     : "markup",
                label     : "Preserve Markup Text White Space",
                type      : "boolean",
                definition: "If text in the provided markup code should be preserved exactly as provided. T" +
                        "his option eliminates beautification and wrapping of text content.",
                default   : false
            },
            ternaryline    : {
                api       : "any",
                mode      : "beautify",
                lexer     : "script",
                label     : "Keep Ternary Statements On One Line",
                type      : "boolean",
                definition: "If ternary operators in JavaScript (? and :) should remain on the same line.",
                default   : false
            },
            topcoms        : {
                api       : "any",
                mode      : "minify",
                lexer     : "any",
                label     : "Retain Comment At Code Start",
                type      : "boolean",
                definition: "If mode is 'minify' this determines whether comments above the first line of c" +
                        "ode should be kept.",
                default   : false
            },
            unformatted    : {
                api       : "any",
                mode      : "any",
                lexer     : "markup",
                label     : "Markup Tag Preservation",
                type      : "boolean",
                definition: "If markup tags should have their insides preserved.",
                default   : false
            },
            varword        : {
                api       : "any",
                mode      : "any",
                lexer     : "script",
                label     : "Variable Declaration Lists",
                type      : "string",
                definition: "If consecutive JavaScript variables should be merged into a comma separated li" +
                        "st or if variables in a list should be separated.",
                values    : {
                    "each" : "Ensurce each reference is a single declaration statement.",
                    "list": "Ensure consecutive declarations are a comma separated list.",
                    "none": "Ignores this option."
                },
                default   : "none"
            },
            version        : {
                api       : "node",
                mode      : "any",
                lexer     : "any",
                label     : "Version",
                type      : "boolean",
                definition: "A Node.js only option to write the version information to the console.",
                default   : false
            },
            vertical       : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Vertical Alignment",
                type      : "boolean",
                definition: "If lists of assignments and properties should be vertically aligned. This option is not used with the markup lexer.",
                default   : false
            },
            wrap           : {
                api       : "any",
                mode      : "beautify",
                lexer     : "any",
                label     : "Wrap",
                type      : "number",
                definition: "Character width limit before applying word wrap. A 0 value disables this option. A negative value concatenates script strings.",
                default   : 0
            }
        };
    module.exports = optionDef;
}());
