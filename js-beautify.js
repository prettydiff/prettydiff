/*prettydiff.com api.topcoms:true,api.insize:4,api.inchar:" " */
/*
 JS Beautifier
 ---------------

 Written by Einar Lielmanis, <einar@jsbeautifier.org>
 http://jsbeautifier.org/

 Originally converted to javascript by Vital, <vital76@gmail.com>
 Rewritten by Austin Cheney on 30 Jan 2011 for use with:
 http://prettydiff.com/prettydiff.js

 You are free to use this in any way you want, in case you find this
 useful or working for you.

 Options:
 Options are properties of a single object literal named "args".

 * args.insize (default 4) — indentation size

 * args.inchar (default space) — character to indent with

 * args.preserve (default true) — whether existing line breaks should
 be preserved

 * args.preserve_max (default unlimited) - maximum number of line
 breaks to be preserved in one chunk

 * args.inlevel (default 0) — initial indentation level, you probably
 won't need this ever

 * args.space (default false) — if true, then space is added between
 "function ()" (jslint is happy about this); if false, then the common
 "function()" output is used.

 * args.braces (default false) - ANSI / Allman brace style, each
 opening/closing brace gets its own line.

 * args.inarray    --- unknown

 * args.comments - whether or not comments should be indented.  Values
 are "indent" or "noindent"

 Variable summary is not provided a scope by js_beautify.  It is
 intended for use in closure to provide an analysis report for use
 external to the js_beautify function.
 */

var js_beautify = function (args) {
        "use strict";
        (function () {
            if (!args.source || typeof args.source !== "string") {
                args.source = "";
            } else {
                args.source = args.source.replace(/var /g, "var prettydiffvar,");
            }
            if (args.insize === undefined || isNaN(args.insize)) {
                args.insize = 4;
            }
            if (!args.inchar || args.inchar.length < 1 || typeof args.inchar !== "string") {
                args.inchar = " ";
            }
            if (!args.inlevel || isNaN(args.inlevel)) {
                args.inlevel = 0;
            }
            if (typeof args.preserve !== "boolean") {
                args.preserve = true;
            }
            if (!args.preserve_max || isNaN(args.preserve_max)) {
                args.preserve_max = 0;
            }
            if (!args.space || args.space !== true) {
                args.space = false;
            }
            if (!args.braces || typeof args.braces !== "boolean") {
                if (args.braces === "allman") {
                    args.braces = true;
                } else {
                    args.braces = false;
                }
            }
            if (!args.inarray || args.inarray !== true) {
                args.inarray = false;
            }
            if (!args.content || args.content !== true) {
                args.content = false;
            }
            if (!args.comments || typeof args.comments !== "boolean") {
                if (args.comments === "noindent") {
                    args.comments = true;
                } else {
                    args.comments = false;
                }
            }
        }());
        var j = [0, 0],
            k = [0, 0],
            l = [0, 0, 0],
            m = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            n = [0, 0, 0, 0, 0],
            o = [0, 0],
            w = [0, 0, 0, 0],
            i = 0,
            insize = args.insize,
            input = args.source,
            input_length = args.source.length + 1,
            t = [],
            output = [],
            token_text = "",
            last_type = "TK_START_EXPR",
            var_last_type = "",
            var_last_last_type = "",
            var_end_count = -1,
            last_text = "",
            last_last_text = "",
            last_word = "",
            last_last_word = "",
            flags = {
                previous_mode: (flags) ? flags.mode : "BLOCK",
                mode: "BLOCK",
                var_line: false,
                var_line_reindented: false,
                in_html_comment: false,
                if_line: false,
                in_case: false,
                eat_next_space: false,
                indentation_baseline: -1,
                indentation_level: ((flags) ? flags.indentation_level + ((flags.var_line && flags.var_line_reindented) ? 1 : 0) : args.inlevel)
            },
            functestval = 0,
            var_var_test = false,
            commafix = false,
            comma_test = false,
            forblock = false,
            forcount = 0,
            flag_store = [flags],
            indent_string = "",
            wordchar = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "_", "$"],
            punct = ["+", "-", "*", "/", "%", "&", "++", "--", "=", "+=", "-=", "*=", "/=", "%=", "==", "===", "!=", "!==", ">", "<", ">=", "<=", ">>", "<<", ">>>", ">>>=", ">>=", "<<=", "&&", "&=", "|", "||", "!", "!!", ",", ":", "?", "^", "^=", "|=", "::"],
            parser_pos = 0,
            prefix = "",
            token_type = "",
            do_block_just_closed = false,
            wanted_newline = false,
            just_added_newline = false,
            rvalue = "",
            space_before = true,
            space_after = true,
            pseudo_block = false,
            block_comment = function (x) {
                var lines = x.split(/\x0a|\x0d\x0a/),
                    j = lines.length,
                    i = 0;
                print_newline();
                output.push(lines[0]);
                for (i = 1; i < j; i += 1) {
                    print_newline();
                    if ((/\}|((\!|\=)\=)/).test(lines[i]) || (/(;|(\)\s*\{\s*))$/).test(lines[i]) || ((/^(\s*("|'))/).test(lines[i]) && (/(("|')\s*;?)$/).test(lines[i]))) {
                        output.push(lines[i]);
                    } else {
                        output.push(" ");
                        output.push(trim(lines[i]));
                    }
                }
                print_newline();
            },
            white_count = function (x) {
                var y = 0,
                    z = x.length;
                for (y = 0; y < z; y += 1) {
                    if (x.charAt(y) === " ") {
                        w[1] += 1;
                    } else if (x.charAt(y) === "\t") {
                        w[2] += 1;
                    } else if (x.charAt(y) === "\n") {
                        w[0] += 1;
                    } else if (args.source.charAt(y) === "\r" || args.source.charAt(y) === "\f" || args.source.charAt(y) === "\v") {
                        w[3] += 1;
                    }
                }
            },
            trim_output = function (eat_newlines) {
                eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;
                while (output.length && (output[output.length - 1] === " " || output[output.length - 1] === indent_string || (eat_newlines && (output[output.length - 1] === "\n" || output[output.length - 1] === "\r")))) {
                    output.pop();
                }
            },
            is_array = function (mode) {
                return mode === "[EXPRESSION]" || mode === "[INDENTED-EXPRESSION]";
            },
            trim = function (s) {
                return s.replace(/^\s\s*|\s\s*$/, "");
            },
            print_newline = function (ignore_repeated) {
                var i = 0;
                flags.eat_next_space = false;
                if (args.inarray && is_array(flags.mode)) {
                    return;
                }
                ignore_repeated = (ignore_repeated === undefined) ? true : ignore_repeated;
                flags.if_line = false;
                if (!output.length) {
                    return; // no newline on start of file
                }
                while (output[output.length - 1] === " " || output[output.length - 1] === indent_string) {
                    output.pop();
                }
                if (output[output.length - 1] !== "\n" || !ignore_repeated) {
                    just_added_newline = true;
                    output.push("\n");
                }
                for (i = 0; i < flags.indentation_level; i += 1) {
                    output.push(indent_string);
                }
                if (flags.var_line && flags.var_line_reindented) {
                    output.push(indent_string);
                }
            },
            print_single_space = function () {
                var last_output = " ";
                if (flags.eat_next_space) {
                    flags.eat_next_space = false;
                    return;
                }
                if (output.length) {
                    last_output = output[output.length - 1];
                }
                // prevent occassional duplicate space
                if (last_output !== " " && last_output !== "\n" && last_output !== indent_string) {
                    output.push(" ");
                }
            },
            print_token = function () {
                just_added_newline = false;
                flags.eat_next_space = false;
                output.push(token_text);
            },
            set_mode = function (mode) {
                flag_store.push(flags);
                flags = {
                    previous_mode: (flags) ? flags.mode : "BLOCK",
                    mode: mode,
                    var_line: false,
                    var_line_reindented: false,
                    in_html_comment: false,
                    if_line: false,
                    in_case: false,
                    eat_next_space: false,
                    indentation_baseline: -1,
                    indentation_level: ((flags) ? flags.indentation_level + ((flags.var_line && flags.var_line_reindented) ? 1 : 0) : args.inlevel)
                };
            },
            is_expression = function (mode) {
                return mode === "[EXPRESSION]" || mode === "[INDENTED-EXPRESSION]" || mode === "(EXPRESSION)";
            },
            restore_mode = function () {
                do_block_just_closed = (flags.mode === "DO_BLOCK");
                if (flag_store.length > 0) {
                    flags = flag_store.pop();
                }
            },
            in_array = function (what, arr) {
                var i = 0;
                for (i = 0; i < arr.length; i += 1) {
                    if (arr[i] === what) {
                        return true;
                    }
                }
                return false;
            },

            // Walk backwards from the colon to find a "?" (colon is part of
            // a ternary op) or a "{" (colon is part of a class literal).
            // Along the way, keep track of the blocks and expressions we
            // pass so we only trigger on those chars in our own level, and
            // keep track of the colons so we only trigger on the matching
            // "?".
            is_ternary_op = function () {
                var i = 0,
                    level = 0,
                    colon_count = 0;
                for (i = output.length - 1; i >= 0; i -= 1) {
                    if (output[i] === ":" && level === 0) {
                        colon_count += 1;
                    } else if (output[i] === "?" && level === 0) {
                        if (colon_count === 0) {
                            return true;
                        } else {
                            colon_count -= 1;
                        }
                    } else if (output[i] === "{" || output[i] === "(" || output[i] === "[") {
                        if (output[i] === "{" && level === 0) {
                            return false;
                        }
                        level -= 1;
                    } else if (output[i] === ")" || output[i] === "}" || output[i] === "]") {
                        level += 1;
                    }
                }
            },
            fix_object_own_line = function () {
                var b = 0;
                for (b = output.length - 2; b > 0; b -= 1) {
                    if (/^(\s+)$/.test(output[b])) {
                        output[b] = "";
                    } else if (in_array(output[b], punct)) {
                        output[b + 1] = " ";
                        break;
                    }
                }
            },
            funcfix = function (y) {
                var a = (y.indexOf("}") - 1),
                    b = "",
                    c = "";
                if (y.charAt(0) === "\n") {
                    b = "\n";
                    c = y.substr(1, a);
                } else {
                    c = y.substr(0, a);
                }
                return b + c + "}\n" + c + "(function";
            },
            get_next_token = function () {
                var c = "",
                    i = 0,
                    comment = "",
                    inline_comment = false,
                    keep_whitespace = false,
                    sep = "",
                    esc = false,
                    resulting_string = "",
                    in_char_class = false,
                    whitespace_count = 0;
                if (parser_pos >= input_length) {
                    return ["", "TK_EOF"];
                }
                wanted_newline = false;
                c = input.charAt(parser_pos);
                parser_pos += 1;
                keep_whitespace = args.inarray && is_array(flags.mode);
                if (keep_whitespace) {
                    //
                    // slight mess to allow nice preservation of array
                    // indentation and reindent that correctly first time
                    // when we get to the arrays:
                    // var a = [
                    // ...."something"
                    // we make note of whitespace_count = 4 into
                    // flags.indentation_baseline so we know that 4
                    // whitespaces in original source match indent_level of
                    // reindented source and afterwards, when we get to
                    //
                    // "something,
                    // ......."something else"
                    // we know that this should be indented to indent_level
                    // + (7 - indentation_baseline) spaces
                    //
                    whitespace_count = 0;
                    while (c === "\n" || c === "\r" || c === "\t" || c === " ") {
                        if (c === "\n") {
                            trim_output();
                            output.push("\n");
                            just_added_newline = true;
                            whitespace_count = 0;
                        } else {
                            if (c === "\t") {
                                whitespace_count += 4;
                            } else if (c !== "\r") {
                                whitespace_count += 1;
                            }
                        }
                        if (parser_pos >= input_length) {
                            return ["", "TK_EOF"];
                        }
                        c = input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                    if (flags.indentation_baseline === -1) {
                        flags.indentation_baseline = whitespace_count;
                    }
                    if (just_added_newline) {
                        for (i = 0; i < flags.indentation_level + 1; i += 1) {
                            output.push(indent_string);
                        }
                        if (flags.indentation_baseline !== -1) {
                            for (i = 0; i < whitespace_count - flags.indentation_baseline; i += 1) {
                                output.push(" ");
                            }
                        }
                    }
                } else {
                    (function () {
                        var n_newlines = 0;
                        while (c === "\n" || c === "\r" || c === "\t" || c === " ") {
                            if (c === "\n") {
                                n_newlines += ((args.preserve_max) ? (n_newlines <= args.preserve_max) ? 1 : 0 : 1);
                            }
                            if (parser_pos >= input_length) {
                                return ["", "TK_EOF"];
                            }
                            c = input.charAt(parser_pos);
                            parser_pos += 1;
                        }
                        if (args.preserve) {
                            if (n_newlines > 1) {
                                for (i = 0; i < n_newlines; i += 1) {
                                    print_newline(i === 0);
                                    just_added_newline = true;
                                }
                            }
                        }
                        wanted_newline = n_newlines > 0;
                    }());
                    if (parser_pos >= input_length) {
                        return ["", "TK_EOF"];
                    }
                }
                if (in_array(c, wordchar)) {
                    if (parser_pos < input_length) {
                        while (in_array(input.charAt(parser_pos), wordchar)) {
                            c += input.charAt(parser_pos);
                            parser_pos += 1;
                            if (parser_pos === input_length) {
                                break;
                            }
                        }
                    }
                    if (parser_pos !== input_length && c.match(/^\d+[Ee]$/) && (input.charAt(parser_pos) === "-" || input.charAt(parser_pos) === "+")) {
                        return (function () {
                            var sign = [input.charAt(parser_pos)],
                                dot = true;
                            while (parser_pos < input_length) {
                                parser_pos += 1;
                                if (input.charAt(parser_pos).match(/\d|\./)) {
                                    if (input.charAt(parser_pos).match(/\./)) {
                                        if (dot) {
                                            dot = false;
                                        } else {
                                            sign.push(" ");
                                        }
                                    }
                                    sign.push(input.charAt(parser_pos));
                                } else {
                                    break;
                                }
                            }
                            c += sign.join("");
                            return [c, "TK_WORD"];
                        }());
                    }
                    // hack for "in" operator
                    if (c === "in") {
                        return [c, "TK_OPERATOR"];
                    }
                    if (wanted_newline && last_type !== "TK_OPERATOR" && !flags.if_line && (args.preserve || last_text !== "var")) {
                        print_newline();
                    }
                    return [c, "TK_WORD"];
                }
                if (c === "(" || c === "[") {
                    return [c, "TK_START_EXPR"];
                }
                if (c === ")" || c === "]") {
                    return [c, "TK_END_EXPR"];
                }
                if (c === "{") {
                    return [c, "TK_START_BLOCK"];
                }
                if (c === "}") {
                    return [c, "TK_END_BLOCK"];
                }
                if (c === ";") {
                    return [c, "TK_SEMICOLON"];
                }
                if (c === "/") {
                    comment = "";
                    // peek for comment /* ... */
                    inline_comment = true;
                    if (input.charAt(parser_pos) === "*") {
                        parser_pos += 1;
                        if (parser_pos < input_length) {
                            while (!(input.charAt(parser_pos) === "*" && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === "/") && parser_pos < input_length) {
                                c = input.charAt(parser_pos);
                                comment += c;
                                if (c === "\x0d" || c === "\x0a") {
                                    inline_comment = false;
                                }
                                parser_pos += 1;
                                if (parser_pos >= input_length) {
                                    break;
                                }
                            }
                        }
                        parser_pos += 2;
                        if (inline_comment) {
                            return ["/*" + comment + "*/", "TK_INLINE_COMMENT"];
                        } else {
                            return ["/*" + comment + "*/", "TK_BLOCK_COMMENT"];
                        }
                    }
                    // peek for comment // ...
                    if (input.charAt(parser_pos) === "/") {
                        comment = c;
                        while (input.charAt(parser_pos) !== "\r" && input.charAt(parser_pos) !== "\n") {
                            comment += input.charAt(parser_pos);
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                break;
                            }
                        }
                        parser_pos += 1;
                        if (wanted_newline) {
                            print_newline();
                        }
                        return [comment, "TK_COMMENT"];
                    }
                }
                if (c === "'" || c === "\"" || (c === "/" && ((last_type === "TK_WORD" && (last_text === "return" || last_text === "do")) || (last_type === "TK_COMMENT" || last_type === "TK_START_EXPR" || last_type === "TK_START_BLOCK" || last_type === "TK_END_BLOCK" || last_type === "TK_OPERATOR" || last_type === "TK_EQUALS" || last_type === "TK_EOF" || last_type === "TK_SEMICOLON")))) { // regexp
                    sep = c;
                    esc = false;
                    resulting_string = c;
                    if (parser_pos < input_length) {
                        if (sep === "/") {
                            //
                            // handle regexp separately...
                            //
                            in_char_class = false;
                            while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
                                resulting_string += input.charAt(parser_pos);
                                if (!esc) {
                                    esc = input.charAt(parser_pos) === "\\";
                                    if (input.charAt(parser_pos) === "[") {
                                        in_char_class = true;
                                    } else if (input.charAt(parser_pos) === "]") {
                                        in_char_class = false;
                                    }
                                } else {
                                    esc = false;
                                }
                                parser_pos += 1;
                                if (parser_pos >= input_length) {
                                    // incomplete string/rexp when
                                    // end-of-file reached. bail out with
                                    // what had been received so far.
                                    return [resulting_string, "TK_STRING"];
                                }
                            }
                        } else {
                            //
                            // and handle string also separately
                            //
                            while (esc || input.charAt(parser_pos) !== sep) {
                                resulting_string += input.charAt(parser_pos);
                                if (!esc) {
                                    esc = input.charAt(parser_pos) === "\\";
                                } else {
                                    esc = false;
                                }
                                parser_pos += 1;
                                if (parser_pos >= input_length) {
                                    // incomplete string/rexp when
                                    // end-of-file reached. bail out with
                                    // what had been received so far.
                                    return [resulting_string, "TK_STRING"];
                                }
                            }
                        }
                    }
                    parser_pos += 1;
                    resulting_string += sep;
                    if (sep === "/") {
                        // regexps may have modifiers /regexp/MOD , so fetch
                        // those, too
                        while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
                            resulting_string += input.charAt(parser_pos);
                            parser_pos += 1;
                        }
                    }
                    return [resulting_string, "TK_STRING"];
                }
                // Spidermonkey-specific sharp variables for circular
                // references
                // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
                // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp
                // around line 1935
                if (c === "#") {
                    if (parser_pos < input_length && (input.charAt(parser_pos) === "0" || input.charAt(parser_pos) === "1" || input.charAt(parser_pos) === "2" || input.charAt(parser_pos) === "3" || input.charAt(parser_pos) === "4" || input.charAt(parser_pos) === "5" || input.charAt(parser_pos) === "6" || input.charAt(parser_pos) === "7" || input.charAt(parser_pos) === "8" || input.charAt(parser_pos) === "9")) {
                        return (function () {
                            var sharp = "#";
                            do {
                                c = input.charAt(parser_pos);
                                sharp += c;
                                parser_pos += 1;
                            } while (parser_pos < input_length && c !== "#" && c !== "=");
                            if (c !== "#" && input.charAt(parser_pos) === "[" && input.charAt(parser_pos + 1) === "]") {
                                sharp += "[]";
                                parser_pos += 2;
                            } else if (c !== "#" && input.charAt(parser_pos) === "{" && input.charAt(parser_pos + 1) === "}") {
                                sharp += "{}";
                                parser_pos += 2;
                            }
                            return [sharp, "TK_WORD"];
                        }());
                    }
                }
                if (c === "<" && input.substring(parser_pos - 1, parser_pos + 3) === "<!--") {
                    parser_pos += 3;
                    flags.in_html_comment = true;
                    return ["<!--", "TK_COMMENT"];
                }
                if (c === "-" && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === "-->") {
                    flags.in_html_comment = false;
                    parser_pos += 2;
                    if (wanted_newline) {
                        print_newline();
                    }
                    return ["-->", "TK_COMMENT"];
                }
                if (in_array(c, punct)) {
                    while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input_length) {
                            break;
                        }
                    }
                    if (c === "=") {
                        return [c, "TK_EQUALS"];
                    } else {
                        return [c, "TK_OPERATOR"];
                    }
                }
                return [c, "TK_UNKNOWN"];
            };
        if (args.source === "") {
            return "Error: no source code supplied to js_beautify.js";
        }
        while (insize > 0) {
            indent_string += args.inchar;
            insize -= 1;
        }
        parser_pos = 0;
        while (true) {
            t = get_next_token(parser_pos);
            token_text = t[0];
            token_type = t[1];
            if (token_type === "TK_EOF") {
                break;
            } else if (token_type === "TK_START_EXPR") {
                n[4] += 1;
                pseudo_block = false;
                if (token_text === "[") {
                    if (last_type === "TK_WORD" || last_text === ")") {
                        // this is array index specifier, break immediately
                        // a[x], fn()[x]
                        if (last_text === "continue" || last_text === "try" || last_text === "throw" || last_text === "return" || last_text === "var" || last_text === "if" || last_text === "switch" || last_text === "case" || last_text === "default" || last_text === "for" || last_text === "while" || last_text === "break" || last_text === "function") {
                            print_single_space();
                        }
                        set_mode("(EXPRESSION)");
                        print_token();
                    } else if (flags.mode === "[EXPRESSION]" || flags.mode === "[INDENTED-EXPRESSION]") {
                        if (last_last_text === "]" && last_text === ",") {
                            // ], [ goes to new line
                            if (flags.mode === "[EXPRESSION]") {
                                flags.mode = "[INDENTED-EXPRESSION]";
                                if (!args.inarray) {
                                    flags.indentation_level += 1;
                                }
                            }
                            set_mode("[EXPRESSION]");
                            if (!args.inarray) {
                                print_newline();
                            }
                        } else if (last_text === "[") {
                            if (flags.mode === "[EXPRESSION]") {
                                flags.mode = "[INDENTED-EXPRESSION]";
                                if (!args.inarray) {
                                    flags.indentation_level += 1;
                                }
                            }
                            set_mode("[EXPRESSION]");
                            if (!args.inarray) {
                                print_newline();
                            }
                        } else {
                            set_mode("[EXPRESSION]");
                        }
                    } else {
                        set_mode("[EXPRESSION]");
                    }
                } else {
                    set_mode("(EXPRESSION)");
                }
                if (token_text !== "[" || (token_text === "[" && (last_type !== "TK_WORD" && last_text !== ")"))) {
                    if (last_text === ";" || last_type === "TK_START_BLOCK") {
                        print_newline();
                    } else if (last_type !== "TK_END_EXPR" && last_type !== "TK_START_EXPR" && last_type !== "TK_END_BLOCK" && last_text !== ".") {
                        if ((last_type !== "TK_WORD" && last_type !== "TK_OPERATOR") || (last_word === "function" && args.space)) {
                            print_single_space();
                        } else if (last_text === "continue" || last_text === "try" || last_text === "throw" || last_text === "return" || last_text === "var" || last_text === "if" || last_text === "switch" || last_text === "case" || last_text === "default" || last_text === "for" || last_text === "while" || last_text === "break" || last_text === "function" || last_text === "catch") {
                            print_single_space();
                        }
                    }
                    print_token();
                }
                if (forblock && token_text === "(") {
                    forcount += 1;
                }
            } else if (token_type === "TK_END_EXPR") {
                n[4] += 1;
                if (last_last_text === "}") {
                    pseudo_block = true;
                }
                if (token_text === "]" && args.inarray && last_text === "}") {
                    if (output.length && output[output.length - 1] === indent_string) {
                        output.pop();
                    }
                    print_token();
                    restore_mode();
                } else if (token_text === "]" && flags.mode === "[INDENTED-EXPRESSION]" && last_text === "]") {
                    restore_mode();
                    print_newline();
                    print_token();
                } else {
                    restore_mode();
                    print_token();
                }
                if (forblock && token_text === ")") {
                    forcount -= 1;
                    if (forcount === 0) {
                        forblock = false;
                    }
                }
            } else if (token_type === "TK_START_BLOCK") {
                n[4] += 1;
                pseudo_block = false;
                if (last_word === "do") {
                    set_mode("DO_BLOCK");
                } else {
                    set_mode("BLOCK");
                }
                if (var_last_last_type === "TK_START_BLOCK" && !isNaN(var_end_count)) {
                    var_end_count += 1;
                }
                if (args.braces) {
                    if (last_type !== "TK_OPERATOR") {
                        if (last_text === "return") {
                            print_single_space();
                        } else {
                            print_newline();
                        }
                    }
                } else {
                    if (functestval > 1) {
                        flags.indentation_level += 1;
                        var_var_test = true;
                        comma_test = true;
                    }
                    if (last_type !== "TK_OPERATOR" && last_type !== "TK_START_EXPR") {
                        if (last_type === "TK_START_BLOCK") {
                            print_newline();
                        } else {
                            print_single_space();
                        }
                    } else {
                        // if TK_OPERATOR or TK_START_EXPR
                        if (is_array(flags.previous_mode) && last_text === ",") {
                            // [a, b, c, {
                            print_newline();
                        }
                    }
                }
                flags.indentation_level += 1;
                print_token();
                forblock = false;
                forcount = 0;
            } else if (token_type === "TK_END_BLOCK") {
                n[4] += 1;
                restore_mode();
                functestval = 0;
                if (var_var_test) {
                    pseudo_block = true;
                } else {
                    pseudo_block = false;
                }

                //var_end_count, var_last_type, and var_last_last_type are
                //part of a patch to fix JSLint compliant indentation for
                //object types associated as a list of vars.
                if (var_end_count === 0) {
                    var_end_count = "x";
                } else if (var_end_count === -1 && var_var_test && comma_test) {
                    flags.var_line_reindented = true;
                } else if (var_last_last_type === "TK_START_BLOCK" && !isNaN(var_end_count)) {
                    var_end_count -= 1;
                } else if (var_end_count === "a") {
                    if (flags.var_line && !flags.var_line_reindented) {
                        flags.var_line_reindented = true;
                        var_end_count = -1;
                    }
                }
                if (args.braces) {
                    if (last_text === "{" && in_array(last_last_text, punct)) {
                        fix_object_own_line();
                    } else {
                        if (var_end_count === "y") {
                            //flags.indentation_level -= 1;
                            var_last_last_type = "";
                            var_end_count = "a";
                        }
                        print_newline();
                        if (var_end_count === "x") {
                            if (flags.var_line && !comma_test && !var_var_test) {
                                flags.var_line_reindented = true;
                            }
                            var_end_count = "y";
                        }
                    }
                    print_token();
                } else {
                    if (last_type === "TK_START_BLOCK") {
                        // nothing
                        if (just_added_newline) {
                            if (output.length && output[output.length - 1] === indent_string) {
                                output.pop();
                            }
                        } else {
                            trim_output();
                        }
                    } else if (is_array(flags.mode) && args.inarray) {
                        // we REALLY need a newline here, but newliner
                        // would skip that
                        args.inarray = false;
                        print_newline();
                        args.inarray = true;
                    } else {
                        if (var_end_count === "y") {
                            //flags.indentation_level -= 1;
                            var_last_last_type = "";
                            var_end_count = "a";
                        }
                        print_newline();
                        if (var_end_count === "x") {
                            if (flags.var_line && !comma_test && !var_var_test) {
                                flags.var_line_reindented = true;
                            }
                            var_end_count = "y";
                        }
                    }
                    if (!comma_test && var_var_test && !flags.var_line_reindented) {
                        if ((flags.mode === "(EXPRESSION)" && !flags.var_line) || (flags.mode === "BLOCK" && flags.var_line)) {
                            if (last_text !== "}" && var_end_count === -1 && flags.mode === "(EXPRESSION)") {
                                output.push(indent_string);
                            }
                            var_var_test = false;
                        }
                    }
                    print_token();
                }
            } else if (token_type === "TK_WORD") {
                // no, it's not you. even I have problems understanding how
                // this works and what does what.
                if (token_text === "alert") {
                    m[0] += 1;
                } else if (token_text === "break") {
                    m[2] += 1;
                } else if (token_text === "case") {
                    m[4] += 1;
                } else if (token_text === "catch") {
                    m[48] += 1;
                } else if (token_text === "continue") {
                    m[6] += 1;
                } else if (token_text === "default") {
                    m[8] += 1;
                } else if (token_text === "delete") {
                    m[10] += 1;
                } else if (token_text === "do") {
                    m[12] += 1;
                } else if (token_text === "document") {
                    m[44] += 1;
                } else if (token_text === "else") {
                    m[14] += 1;
                } else if (token_text === "eval") {
                    m[16] += 1;
                } else if (token_text === "for") {
                    m[18] += 1;
                } else if (token_text === "function") {
                    m[20] += 1;
                } else if (token_text === "if") {
                    m[22] += 1;
                } else if (token_text === "in") {
                    m[24] += 1;
                } else if (token_text === "label") {
                    m[26] += 1;
                } else if (token_text === "new") {
                    m[28] += 1;
                } else if (token_text === "return") {
                    m[30] += 1;
                } else if (token_text === "switch") {
                    m[32] += 1;
                } else if (token_text === "this") {
                    m[34] += 1;
                } else if (token_text === "throw") {
                    m[50] += 1;
                } else if (token_text === "try") {
                    m[52] += 1;
                } else if (token_text === "typeof") {
                    m[36] += 1;
                } else if (token_text === "var") {
                    m[38] += 1;
                } else if (token_text === "while") {
                    m[40] += 1;
                } else if (token_text === "with") {
                    m[42] += 1;
                } else if (token_text === "window") {
                    m[46] += 1;
                } else {
                    o[0] += 1;
                    o[1] += token_text.length;
                }
                if (token_text !== "var" && last_text === ";") {
                    comma_test = false;
                }
                if (last_text === ";" && last_last_text === "}" && var_end_count === "y") {
                    flags.indentation_level -= 1;
                }
                if (last_text === "{" && ((last_last_text === ":" && comma_test) || (last_last_text === ")" && var_last_type === "TK_START_BLOCK" && !comma_test))) {

                    output.push(indent_string);
                    flags.indentation_level += 1;
                    if (token_text !== "var" && !isNaN(var_end_count)) {
                        var_end_count += 1;
                    }
                }
                if (do_block_just_closed) {
                    // do {} ## while ()
                    print_single_space();
                    print_token();
                    print_single_space();
                    do_block_just_closed = false;
                } else {
                    if (token_text === "do") {
                        print_newline();
                        print_token();
                    } else if (token_text === "case" || token_text === "default") {
                        if (last_text === ":") {
                            // switch cases following one another
                            if (output.length && output[output.length - 1] === indent_string) {
                                output.pop();
                            }
                        } else {
                            // case statement starts in the same line where
                            // switch
                            flags.indentation_level -= 1;
                            print_newline();
                            flags.indentation_level += 1;
                        }
                        print_token();
                        flags.in_case = true;
                    } else {
                        if (token_text === "function") {
                            if (comma_test && (flags.var_line || (!flags.var_line && last_last_word === "var"))) {
                                functestval += 1;
                            } else if (!comma_test) {
                                functestval -= 1;
                            }
                            if (comma_test && flags.var_line && last_last_word === "var" && !var_var_test && functestval === 0) {
                                flags.var_line_reindented = true;
                            }
                        }
                        prefix = "NONE";
                        if (last_type === "TK_END_BLOCK") {
                            if (args.braces || (token_text !== "else" && token_text !== "catch" && token_text !== "finally")) {
                                prefix = "NEWLINE";
                            } else {
                                prefix = "SPACE";
                                print_single_space();
                            }
                        } else if (last_type === "TK_STRING" || last_type === "TK_START_BLOCK" || (last_type === "TK_SEMICOLON" && (flags.mode === "BLOCK" || flags.mode === "DO_BLOCK"))) {
                            prefix = "NEWLINE";
                        } else if (last_type === "TK_WORD" || (last_type === "TK_SEMICOLON" && is_expression(flags.mode))) {
                            prefix = "SPACE";
                        } else if (last_type === "TK_END_EXPR") {
                            print_single_space();
                            prefix = "NEWLINE";
                        }
                        if (flags.if_line && last_type === "TK_END_EXPR") {
                            flags.if_line = false;
                        }
                        if (token_text === "else" || token_text === "catch" || token_text === "finally") {
                            if (last_type !== "TK_END_BLOCK" || args.braces) {
                                print_newline();
                            } else {
                                trim_output(true);
                                print_single_space();
                            }
                        } else if (last_type !== "TK_START_EXPR" && last_text !== "=" && last_text !== "," && (token_text === "continue" || token_text === "try" || token_text === "throw" || token_text === "return" || token_text === "var" || token_text === "if" || token_text === "switch" || token_text === "case" || token_text === "default" || token_text === "for" || token_text === "while" || token_text === "break" || token_text === "function" || prefix === "NEWLINE")) {
                            if (last_text === "return" || last_text === "throw" || (last_type !== "TK_END_EXPR" && last_text !== ":" && (last_type !== "TK_START_EXPR" || token_text !== "var"))) {
                                if ((token_text === "if" && last_word === "else" && last_text !== "{") || (token_text === "function" && last_type === "TK_OPERATOR")) {
                                    print_single_space();
                                } else {
                                    print_newline();
                                }
                            } else if (last_text !== ")" && last_text !== ":" && (token_text === "continue" || token_text === "try" || token_text === "throw" || token_text === "return" || token_text === "var" || token_text === "if" || token_text === "switch" || token_text === "case" || token_text === "default" || token_text === "for" || token_text === "while" || token_text === "break" || token_text === "function")) {
                                print_newline();
                            }
                        } else if (prefix === "SPACE" || (forblock && last_text === ";")) {
                            print_single_space();
                        } else if (last_text === ";" || (is_array(flags.mode) && last_text === "," && last_last_text === "}")) {
                            // }, in lists get a newline treatment
                            print_newline();
                        }
                        if (token_text === "var") {
                            if (!var_var_test && last_type === "TK_START_BLOCK" && comma_test) {
                                //if (var_last_type === "") {
                                //flags.indentation_level += 1;
                                //output.push(indent_string);
                                //}
                                if (functestval >= 0) {
                                    var_var_test = true;
                                }
                            } else if (last_type === "TK_START_BLOCK") {
                                if (var_last_type === "TK_START_BLOCK") {
                                    if (last_type === "TK_START_BLOCK") {
                                        var_last_type = "";
                                        var_last_last_type = "TK_START_BLOCK";
                                        var_end_count = 0;
                                    }
                                } else {
                                    var_last_type = "TK_START_BLOCK";
                                }
                            } else if (last_type === "TK_START_BLOCK" && var_last_type === "") {
                                var_last_type = "TK_START_BLOCK";
                            }
                            flags.var_line = true;
                            flags.var_line_reindented = false;
                            comma_test = true;
                        }
                        print_token();
                        if (token_text === "typeof") {
                            print_single_space();
                        }
                        if (token_text === "if") {
                            flags.if_line = true;
                        }
                        if (token_text === "else") {
                            flags.if_line = false;
                        }
                        if (token_text === "for") {
                            forblock = true;
                        }
                    }
                    last_last_word = last_word;
                    last_word = token_text;
                }
            } else if (token_type === "TK_SEMICOLON") {
                n[3] += 1;
                if (last_text === "}") {
                    comma_test = true;
                }
                print_token();
                flags.var_line = false;
                flags.var_line_reindented = false;
                if (functestval < 2) {
                    var_var_test = false;
                }
                var_last_type = "";
            } else if (token_type === "TK_STRING") {
                l[0] += 1;
                if ((token_text.charAt(0) === "\"" && token_text.charAt(token_text.length - 1) === "\"") || (token_text.charAt(0) === "'" && token_text.charAt(token_text.length - 1) === "'")) {
                    l[1] += token_text.length - 2;
                    l[2] += 2;
                } else {
                    l[1] += token_text.length;
                }
                white_count(token_text);
                if (last_type === "TK_START_BLOCK" || last_type === "TK_END_BLOCK" || last_type === "TK_SEMICOLON") {
                    print_newline();
                } else if (last_type === "TK_WORD") {
                    print_single_space();
                }
                if (args.content) {
                    output.push(token_text.charAt(0) + "text" + token_text.charAt(0));
                } else {
                    print_token();
                }
            } else if (token_type === "TK_EQUALS") {
                n[0] += 1;
                n[1] += 1;
                print_single_space();
                print_token();
                print_single_space();
            } else if (token_type === "TK_OPERATOR") {
                if (token_text !== ",") {
                    n[0] += 1;
                    n[1] += token_text.length;
                }
                var_last_type = "";
                if (token_text === ",") {
                    if (var_end_count === "y" && last_type !== "TK_END_BLOCK") {
                        flags.indentation_level -= 1;
                    }
                    if (commafix) {
                        commafix = false;
                        if (last_text === "}") {
                            flags.var_line_reindented = true;
                        }
                    }
                    if (last_text === "}" && last_last_text === "{" && last_last_word === "var" && flags.var_line) {
                        commafix = true;
                        flags.var_line_reindented = true;
                    }
                    n[2] += 1;
                    if (flags.mode !== "(EXPRESSION)" && last_last_text !== ":") {
                        comma_test = false;
                    }
                    if (flags.var_line && flags.mode !== "(EXPRESSION)") {
                        flags.var_line_reindented = true;
                        print_token();
                        if (last_word !== "prettydiffvar") {
                            print_newline();
                        }
                    } else if (last_type === "TK_END_BLOCK" && flags.mode !== "(EXPRESSION)") {
                        print_token();
                        if (last_text === "}") {
                            print_newline();
                        } else {
                            print_single_space();
                        }
                    } else if (flags.mode !== "(EXPRESSION)" && (flags.mode === "BLOCK" || flags.mode === "OBJECT" || is_ternary_op())) {
                        print_token();
                        print_newline();
                    } else {
                        // EXPR or DO_BLOCK
                        print_token();
                        print_single_space();
                    }
                    // } else if (in_array(token_text, ["--", "++", "!"]) || (in_array(token_text, ["-", "+"]) && (in_array(last_type, ["TK_START_BLOCK", "TK_START_EXPR", "TK_EQUALS"]) || in_array(last_text, line_starters) || in_array(last_text, ["==", "!=", "+=", "-=", "*=", "/=", "+", "-"])))) {
                } else if (last_text === "return" || last_text === "throw") {
                    // "return" had a special handling in TK_WORD. Now we
                    // need to return the favor
                    print_single_space();
                    print_token();
                } else if (token_text === "::") {
                    // no spaces around exotic namespacing syntax operator
                    print_token();
                } else if (token_text === "--" || token_text === "++" || token_text === "!" || ((token_text === "-" || token_text === "+") && (last_type === "TK_START_BLOCK" || last_type === "TK_START_EXPR" || last_type === "TK_EQUALS" || last_type === "TK_OPERATOR" || last_text === "continue" || last_text === "try" || last_text === "throw" || last_text === "return" || last_text === "var" || last_text === "if" || last_text === "switch" || last_text === "case" || last_text === "default" || last_text === "for" || last_text === "while" || last_text === "break" || last_text === "function"))) {
                    // unary operators (and binary +/- pretending to be
                    // unary) special cases
                    space_before = false;
                    space_after = false;
                    if (last_text === ";" && is_expression(flags.mode)) {
                        // for (;; ++i)
                        // ^^^
                        space_before = true;
                    }
                    if (last_type === "TK_WORD" && (last_text === "continue" || last_text === "try" || last_text === "throw" || last_text === "return" || last_text === "var" || last_text === "if" || last_text === "switch" || last_text === "case" || last_text === "default" || last_text === "for" || last_text === "while" || last_text === "break" || last_text === "function")) {
                        space_before = true;
                    }
                    if (flags.mode === "BLOCK" && (last_text === "{" || last_text === ";")) {
                        // { foo; --i }
                        // foo(); --bar;
                        print_newline();
                    }
                } else if (token_text === ".") {
                    // decimal digits or object.property
                    space_before = false;
                }
                if (token_text !== "," && token_text !== ":" && (token_text !== "-" || (token_text === "-" && last_text !== "continue" && last_text !== "try" && last_text !== "throw" && last_text !== "return" && last_text !== "var" && last_text !== "if" && last_text !== "switch" && last_text !== "case" && last_text !== "default" && last_text !== "for" && last_text !== "while" && last_text !== "break" && last_text !== "function"))) {
                    if (space_before) {
                        print_single_space();
                    }
                    print_token();
                    if (space_after) {
                        print_single_space();
                    }
                } else if (token_text === ":") {
                    if (flags.in_case) {
                        print_token();
                        print_newline();
                        flags.in_case = false;
                    } else if (is_ternary_op()) {
                        print_single_space();
                        print_token();
                        print_single_space();
                        flags.mode = "OBJECT";
                    } else if (flags.in_case) {
                        print_single_space();
                        print_token();
                        print_single_space();
                    } else if (last_last_text !== "case" && last_last_text !== "default" && last_text !== "case" && last_text !== "default") {
                        print_token();
                        print_single_space();
                    }
                }
                space_before = true;
                space_after = true;
                //if (token_text === "!") {
                // flags.eat_next_space = true;
                //}
            } else if (token_type === "TK_BLOCK_COMMENT") {
                j[0] += 1;
                j[1] += token_text.length;
                white_count(token_text);
                if (args.comments) {
                    for (i = output.length - 1; i > 0; i -= 1) {
                        if (output[i] === indent_string || output[i] === " ") {
                            output[i] = "";
                        } else {
                            break;
                        }
                    }
                    output.push("\n");
                    print_token();
                    output.push("\n");
                } else {
                    block_comment(token_text);
                }
            } else if (token_type === "TK_INLINE_COMMENT") {
                j[0] += 1;
                j[1] += token_text.length;
                white_count(token_text);
                print_token();
                if (is_expression(flags.mode)) {
                    print_single_space();
                } else if (args.comments) {
                    output.push("\n");
                } else {
                    print_newline();
                }
            } else if (token_type === "TK_COMMENT") {
                k[0] += 1;
                k[1] += token_text.length;
                white_count(token_text);
                if (args.comments) {
                    for (i = output.length - 1; i > 0; i -= 1) {
                        if (output[i] === indent_string) {
                            output[i] = "";
                        } else {
                            break;
                        }
                    }
                } else if (wanted_newline) {
                    print_newline();
                } else {
                    print_single_space();
                }
                print_token();
                print_newline();
            } else if (token_type === "TK_UNKNOWN") {
                n[0] += 1;
                n[1] += token_text.length;
                white_count(token_text);
                if (last_text === "return" || last_text === "throw") {
                    print_single_space();
                }
                print_token();
            }
            last_last_text = last_text;
            last_type = token_type;
            last_text = token_text;
        }
        rvalue = output.join("").replace(/var prettydiffvar\,\s*/g, "var ").replace(/^(\s+)/, "").replace(/(\s+)$/, "").replace(/\s*\}\(function/g, funcfix).replace(/\n( |\t)+\n/g, "\n\n").replace(/ \n/g, "\n");
        (function () {
            var a = 0,
                b = 0,
                e = 1,
                f = 1,
                g = 0,
                h = 0,
                i = 0,
                p = 0,
                q = [],
                z = [],
                output,
                zero = function (x, y) {
                    if (y === 0) {
                        return "0.00%";
                    } else {
                        return ((x / y) * 100).toFixed(2) + "%";
                    }
                },
                drawRow = function (w, x, y, z, Z) {
                    var a = ["<tr><th>Keyword '"];
                    a.push(w);
                    a.push("'</th><td ");
                    a.push(x);
                    a.push(">");
                    a.push(y);
                    a.push("</td><td>");
                    a.push(zero(y, m[54]));
                    a.push("</td><td>");
                    a.push(zero(y, Z[0]));
                    a.push("</td><td>");
                    a.push(z);
                    a.push("</td><td>");
                    a.push(zero(z, m[55]));
                    a.push("</td><td>");
                    a.push(zero(z, Z[1]));
                    a.push("</td></tr>");
                    return a.join("");
                };
            if (rvalue.length <= input_length) {
                b = input_length;
            } else {
                b = rvalue.length;
            }
            for (a = 0; a < b; a += 1) {
                if (args.source.charAt(a) === " ") {
                    g += 1;
                } else if (args.source.charAt(a) === "\t") {
                    h += 1;
                } else if (args.source.charAt(a) === "\n") {
                    e += 1;
                } else if (args.source.charAt(a) === "\r" || args.source.charAt(a) === "\f" || args.source.charAt(a) === "\v") {
                    p += 1;
                }
                if (rvalue.charAt(a) === "\n") {
                    f += 1;
                }
            }
            if (m[0] > 0) {
                q[0] = " class='bad'";
            } else {
                q[0] = "";
            }
            if (m[6] > 0) {
                q[1] = " class='bad'";
            } else {
                q[1] = "";
            }
            if (m[16] > 0) {
                q[2] = " class='bad'";
            } else {
                q[2] = "";
            }
            if (m[42] > 0) {
                q[3] = " class='bad'";
            } else {
                q[3] = "";
            }
            g = g - w[1];
            h = h - w[2];
            p = p - w[3];
            i = ((e - 1 - w[0]) + g + h + p);
            n.push(l[2] + n[0] + n[2] + n[3] + n[4]);
            n.push(l[2] + n[1] + n[2] + n[3] + n[4]);
            j.push(j[0] + k[0]);
            j.push(j[1] + k[1]);
            m[1] = m[0] * 5;
            m[3] = m[2] * 5;
            m[5] = m[4] * 4;
            m[7] = m[6] * 8;
            m[9] = m[8] * 7;
            m[11] = m[10] * 6;
            m[13] = m[12] * 2;
            m[15] = m[14] * 4;
            m[17] = m[16] * 4;
            m[19] = m[18] * 3;
            m[21] = m[20] * 8;
            m[23] = m[22] * 2;
            m[25] = m[24] * 2;
            m[27] = m[26] * 5;
            m[29] = m[28] * 3;
            m[31] = m[30] * 6;
            m[33] = m[32] * 6;
            m[35] = m[34] * 4;
            m[37] = m[36] * 6;
            m[39] = m[38] * 3;
            m[41] = m[40] * 5;
            m[43] = m[42] * 4;
            m[45] = m[44] * 8;
            m[47] = m[46] * 6;
            m[49] = m[48] * 5;
            m[51] = m[50] * 5;
            m[53] = m[52] * 3;
            m[54] = m[0] + m[2] + m[4] + m[6] + m[8] + m[10] + m[12] + m[14] + m[16] + m[18] + m[20] + m[22] + m[24] + m[26] + m[28] + m[30] + m[32] + m[34] + m[36] + m[38] + m[40] + m[42] + m[44] + m[46] + m[48] + m[50] + m[52];
            m[55] = m[1] + m[3] + m[5] + m[7] + m[9] + m[11] + m[13] + m[15] + m[17] + m[19] + m[21] + m[23] + m[25] + m[27] + m[29] + m[31] + m[33] + m[35] + m[37] + m[39] + m[41] + m[43] + m[45] + m[47] + m[49] + m[51] + m[53];
            z.push(j[2] + l[0] + n[5] + m[54] + o[0] + i);
            z.push(j[3] + l[1] + n[6] + m[55] + o[1] + i);
            output = ["<div id='doc'>"];
            output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr>");
            output.push("</thead><tbody><tr><th>Total Character Size</th><td>");
            output.push(input_length);
            output.push("</td><td>");
            output.push(rvalue.length);
            output.push("</td><td>");
            output.push(rvalue.length - input_length);
            output.push("</td><td>");
            output.push((((rvalue.length - input_length) / rvalue.length) * 100).toFixed(2));
            output.push("%</td></tr><tr><th>Total Lines of Code</th><td>");
            output.push(e);
            output.push("</td><td>");
            output.push(f);
            output.push("</td><td>");
            output.push(f - e);
            output.push("</td><td>");
            output.push((((f - e) / e) * 100).toFixed(2));
            output.push("%</td></tr></tbody></table>");
            output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScript component analysis</caption><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percentage Quantity from Section</th>");
            output.push("<th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage Length from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
            output.push("<tr><th>Total Accounted</th><td>");
            output.push(z[0]);
            output.push("</td><td>100.00%</td><td>100.00%</td><td>");
            output.push(z[1]);
            output.push("</td><td>100.00%</td><td>100.00%</td></tr><tr><th colspan='7'>Comments</th></tr><tr><th>Block Comments</th><td>");
            output.push(j[0]);
            output.push("</td><td>");
            output.push(zero(j[0], j[2]));
            output.push("</td><td>");
            output.push(zero(j[0], z[0]));
            output.push("</td><td>");
            output.push(j[1]);
            output.push("</td><td>");
            output.push(zero(j[1], j[3]));
            output.push("</td><td>");
            output.push(zero(j[1], z[1]));
            output.push("</td></tr><tr><th>Inline Comments</th><td>");
            output.push(k[0]);
            output.push("</td><td>");
            output.push(zero(k[0], j[2]));
            output.push("</td><td>");
            output.push(zero(k[0], z[0]));
            output.push("</td><td>");
            output.push(k[1]);
            output.push("</td><td>");
            output.push(zero(k[1], j[3]));
            output.push("</td><td>");
            output.push(zero(k[1], z[1]));
            output.push("</td></tr><tr><th>Comment Total</th><td>");
            output.push(j[2]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(j[2], z[0]));
            output.push("</td><td>");
            output.push(j[3]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(j[3], z[1]));
            output.push("</td></tr><tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></tr><tr><th>New Lines</th><td>");
            output.push(e - 1 - w[0]);
            output.push("</td><td>");
            output.push(zero(e - 1 - w[0], i));
            output.push("</td><td>");
            output.push(zero(e - 1 - w[0], z[0]));
            output.push("</td><td>");
            output.push(e - 1 - w[0]);
            output.push("</td><td>");
            output.push(zero(e - 1 - w[0], i));
            output.push("</td><td>");
            output.push(zero(e - 1 - w[0], z[1]));
            output.push("</td></tr><tr><th>Spaces</th><td>");
            output.push(g);
            output.push("</td><td>");
            output.push(zero(g, i));
            output.push("</td><td>");
            output.push(zero(g, z[0]));
            output.push("</td><td>");
            output.push(g);
            output.push("</td><td>");
            output.push(zero(g, i));
            output.push("</td><td>");
            output.push(zero(g, z[1]));
            output.push("</td></tr><tr><th>Tabs</th><td>");
            output.push(h);
            output.push("</td><td>");
            output.push(zero(h, i));
            output.push("</td><td>");
            output.push(zero(h, z[0]));
            output.push("</td><td>");
            output.push(h);
            output.push("</td><td>");
            output.push(zero(h, i));
            output.push("</td><td>");
            output.push(zero(h, z[1]));
            output.push("</td></tr><tr><th>Other Whitespace</th><td>");
            output.push(p);
            output.push("</td><td>");
            output.push(zero(p, i));
            output.push("</td><td>");
            output.push(zero(p, z[0]));
            output.push("</td><td>");
            output.push(p);
            output.push("</td><td>");
            output.push(zero(p, i));
            output.push("</td><td>");
            output.push(zero(p, z[1]));
            output.push("</td></tr><tr><th>Total Whitespace</th><td>");
            output.push(i);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(i, z[0]));
            output.push("</td><td>");
            output.push(i);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(i, z[1]));
            output.push("</td></tr><tr><th colspan='7'>Strings</th></tr><tr><th>Strings</th><td>");
            output.push(l[0]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(l[0], z[0]));
            output.push("</td><td>");
            output.push(l[1]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(l[1], z[1]));
            output.push("</td></tr><tr><th colspan='7'>Syntax Characters</th></tr><tr><th>Quote Characters</th><td>");
            output.push(l[2]);
            output.push("</td><td>");
            output.push(zero(l[2], n[5]));
            output.push("</td><td>");
            output.push(zero(l[2], z[0]));
            output.push("</td><td>");
            output.push(l[2]);
            output.push("</td><td>");
            output.push(zero(l[2], n[6]));
            output.push("</td><td>");
            output.push(zero(l[2], z[1]));
            output.push("</td></tr><tr><th>Commas</th><td>");
            output.push(n[2]);
            output.push("</td><td>");
            output.push(zero(n[2], n[5]));
            output.push("</td><td>");
            output.push(zero(n[2], z[0]));
            output.push("</td><td>");
            output.push(n[2]);
            output.push("</td><td>");
            output.push(zero(n[2], n[6]));
            output.push("</td><td>");
            output.push(zero(n[2], z[1]));
            output.push("</td></tr><tr><th>Containment Characters</th><td>");
            output.push(n[4]);
            output.push("</td><td>");
            output.push(zero(n[4], n[5]));
            output.push("</td><td>");
            output.push(zero(n[4], z[0]));
            output.push("</td><td>");
            output.push(n[4]);
            output.push("</td><td>");
            output.push(zero(n[4], n[6]));
            output.push("</td><td>");
            output.push(zero(n[4], z[1]));
            output.push("</td></tr><tr><th>Semicolons</th><td>");
            output.push(n[3]);
            output.push("</td><td>");
            output.push(zero(n[3], n[5]));
            output.push("</td><td>");
            output.push(zero(n[3], z[0]));
            output.push("</td><td>");
            output.push(n[3]);
            output.push("</td><td>");
            output.push(zero(n[3], n[6]));
            output.push("</td><td>");
            output.push(zero(n[3], z[1]));
            output.push("</td></tr><tr><th>Operators</th><td>");
            output.push(n[0]);
            output.push("</td><td>");
            output.push(zero(n[0], n[5]));
            output.push("</td><td>");
            output.push(zero(n[0], z[0]));
            output.push("</td><td>");
            output.push(n[1]);
            output.push("</td><td>");
            output.push(zero(n[1], n[6]));
            output.push("</td><td>");
            output.push(zero(n[1], z[1]));
            output.push("</td></tr><tr><th>Total Syntax Characters</th><td>");
            output.push(n[5]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(n[5], z[0]));
            output.push("</td><td>");
            output.push(n[6]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(n[6], z[1]));
            output.push("</td></tr>");
            output.push("<tr><th colspan='7'>Keywords</th></tr>");
            output.push(drawRow("alert", q[0], m[0], m[1], z));
            output.push(drawRow("break", "", m[2], m[3], z));
            output.push(drawRow("case", "", m[4], m[5], z));
            output.push(drawRow("catch", "", m[48], m[49], z));
            output.push(drawRow("continue", q[1], m[6], m[7], z));
            output.push(drawRow("default", "", m[8], m[9], z));
            output.push(drawRow("delete", "", m[10], m[11], z));
            output.push(drawRow("do", "", m[12], m[13], z));
            output.push(drawRow("document", "", m[44], m[45], z));
            output.push(drawRow("else", "", m[14], m[15], z));
            output.push(drawRow("eval", q[2], m[16], m[17], z));
            output.push(drawRow("for", "", m[18], m[19], z));
            output.push(drawRow("function", "", m[20], m[21], z));
            output.push(drawRow("if", "", m[22], m[23], z));
            output.push(drawRow("in", "", m[24], m[25], z));
            output.push(drawRow("label", "", m[26], m[27], z));
            output.push(drawRow("new", "", m[28], m[29], z));
            output.push(drawRow("return", "", m[30], m[31], z));
            output.push(drawRow("switch", "", m[32], m[33], z));
            output.push(drawRow("this", "", m[34], m[35], z));
            output.push(drawRow("throw", "", m[50], m[51], z));
            output.push(drawRow("typeof", "", m[36], m[37], z));
            output.push(drawRow("var", "", m[38], m[39], z));
            output.push(drawRow("while", "", m[40], m[41], z));
            output.push(drawRow("with", q[3], m[42], m[43], z));
            output.push(drawRow("window", "", m[46], m[47], z));
            output.push(drawRow("try", "", m[52], m[53], z));
            output.push("<tr><th>Total Keywords</th><td>");
            output.push(m[54]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(m[55], z[0]));
            output.push("</td><td>");
            output.push(m[55]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(m[55], z[1]));
            output.push("</td></tr>");
            output.push("<tr><th colspan='7'>Variables and Other Keywords</th></tr><tr><th>Variable Instances</th><td>");
            output.push(o[0]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(o[0], z[0]));
            output.push("</td><td>");
            output.push(o[1]);
            output.push("</td><td>100.00%</td><td>");
            output.push(zero(o[1], z[1]));
            output.push("</td></tr></tbody></table></div>");
            summary = output.join("");
        }());
        return rvalue;
    };