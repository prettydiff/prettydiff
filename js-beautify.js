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

Arguments:
* indent_size (default 4) — indentation size,
* indent_char (default space) — character to indent with,
* preserve_newlines (default true) — whether existing line breaks should
  be preserved,
* max_preserve_newlines (default unlimited) - maximum number of line
  breaks to be preserved in one chunk,
* indent_level (default 0) — initial indentation level, you probably
  won't need this ever
* space_after_anon_function (default false) — if true, then space is
  added between "function ()" (jslint is happy about this); if false,
  then the common "function()" output is used.
* braces_on_own_line (default false) - ANSI / Allman brace style, each
  opening/closing brace gets its own line.
* keep_array_indentation    --- unknown
* indent_comm - whether or not comments should be indented.  Values are
  "indent" or "noindent"

js_summary is not provided a scope by js_beautify.  It is intended for
use as a closure to provide an analysis report for use external to the
js_beautify function.
*/

var js_beautify = function (js_source_text, indent_size, indent_char, preserve_newlines, max_preserve_newlines, indent_level, space_after_anon_function, braces_on_own_line, keep_array_indentation, indent_comm) {
    'use strict';
    // verify with JSLint
    var j = [0, 0],
        k = [0, 0],
        l = [0, 0, 0],
        m = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        n = [0, 0, 0, 0, 0],
        o = [0, 0],
        w = [0, 0, 0, 0],
        i,
        white_count = function (x) {
            var y,
                z = x.length;
            for (y = 0; y < z; y += 1) {
                if (x.charAt(y) === ' ') {
                    w[1] += 1;
                } else if (x.charAt(y) === '\t') {
                    w[2] += 1;
                } else if (x.charAt(y) === '\n') {
                    w[0] += 1;
                } else if (js_source_text.charAt(y) === '\r' || js_source_text.charAt(y) === '\f' || js_source_text.charAt(y) === '\v') {
                    w[3] += 1;
                }
            }
        },
        input = js_source_text,
        input_length = js_source_text.length,
        t,
        output = [],
        token_text,
        last_type = 'TK_START_EXPR',
        last_text = '',
        last_last_text = '',
        last_word = '',
        flags,
        functest = false,
        functestval = 0,
        flag_store = [],
        indent_string = '',
        wordchar = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_', '$'],
        punct = ['+', '-', '*', '/', '%', '&', '++', '--', '=', '+=', '-=', '*=', '/=', '%=', '==', '===', '!=', '!==', '>', '<', '>=', '<=', '>>', '<<', '>>>', '>>>=', '>>=', '<<=', '&&', '&=', '|', '||', '!', '!!', ',', ':', '?', '^', '^=', '|=', '::'],
        parser_pos,
        digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        prefix,
        token_type,
        do_block_just_closed = false,
        wanted_newline,
        just_added_newline = false,
        n_newlines,
        rvalue,
        lines,
        vartainted,
        vartested,
        space_before = true,
        space_after = true,

        // Some interpreters have unexpected results with
        //foo = baz || bar;
        opt_indent_size = (isNaN(indent_size)) ? 4 : Number(indent_size),
        opt_indent_char = (indent_char && indent_char.length > 0) ? indent_char : ' ',
        opt_preserve_newlines = (preserve_newlines !== true) ? false : true,
        opt_max_preserve_newlines = (max_preserve_newlines) ? max_preserve_newlines : false,
        opt_indent_level = (isNaN(indent_level)) ? 0 : indent_level,
        // starting indentation
        opt_space_after_anon_function = (space_after_anon_function !== true) ? false : true,
        opt_braces_on_own_line = (braces_on_own_line !== true) ? false : true,
        opt_keep_array_indentation = (keep_array_indentation !== true) ? false : true,
        trim_output = function (eat_newlines) {
            eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;
            while (output.length && (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string || (eat_newlines && (output[output.length - 1] === '\n' || output[output.length - 1] === '\r')))) {
                output.pop();
            }
        },
        is_array = function (mode) {
            return mode === '[EXPRESSION]' || mode === '[INDENTED-EXPRESSION]';
        },
        trim = function (s) {
            return s.replace(/^\s\s*|\s\s*$/, '');
        },
        print_newline = function (ignore_repeated) {
            var i;
            flags.eat_next_space = false;
            if (opt_keep_array_indentation && is_array(flags.mode)) {
                return;
            }
            ignore_repeated = (ignore_repeated === undefined) ? true : ignore_repeated;

            flags.if_line = false;

            if (!output.length) {
                return; // no newline on start of file
            }
            while (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string) {
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
            var last_output = ' ';
            if (flags.eat_next_space) {
                flags.eat_next_space = false;
                return;
            }
            if (output.length) {
                last_output = output[output.length - 1];
            }
            // prevent occassional duplicate space
            if (last_output !== ' ' && last_output !== '\n' && last_output !== indent_string) {
                output.push(' ');
            }
        },
        print_token = function () {
            just_added_newline = false;
            flags.eat_next_space = false;
            output.push(token_text);
        },
        set_mode = function (mode) {
            if (flags) {
                flag_store.push(flags);
            }
            flags = {
                previous_mode: flags ? flags.mode : 'BLOCK',
                mode: mode,
                var_line: false,
                var_line_tainted: false,
                var_line_reindented: false,
                in_html_comment: false,
                if_line: false,
                in_case: false,
                eat_next_space: false,
                indentation_baseline: -1,
                indentation_level: (flags ? flags.indentation_level + ((flags.var_line && flags.var_line_reindented) ? 1 : 0) : opt_indent_level)
            };
        },
        is_expression = function (mode) {
            return mode === '[EXPRESSION]' || mode === '[INDENTED-EXPRESSION]' || mode === '(EXPRESSION)';
        },
        restore_mode = function () {
            do_block_just_closed = flags.mode === 'DO_BLOCK';
            if (flag_store.length > 0) {
                flags = flag_store.pop();
            }
        },
        in_array = function (what, arr) {
            var i;
            for (i = 0; i < arr.length; i += 1) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
        },

        // Walk backwards from the colon to find a '?' (colon is part of
        // a ternary op) or a '{' (colon is part of a class literal).
        // Along the way, keep track of the blocks and expressions we
        // pass so we only trigger on those chars in our own level, and
        // keep track of the colons so we only trigger on the matching
        // '?'.
        is_ternary_op = function () {
            var i,
                level = 0,
                colon_count = 0;
            for (i = output.length - 1; i >= 0; i -= 1) {
                if (output[i] === ':' && level === 0) {
                    colon_count += 1;
                } else if (output[i] === '?' && level === 0) {
                    if (colon_count === 0) {
                        return true;
                    } else {
                        colon_count -= 1;
                    }
                } else if (output[i] === '{' || output[i] === '(' || output[i] === '[') {
                    if (output[i] === '{' && level === 0) {
                        return false;
                    }
                    level -= 1;
                } else if (output[i] === ')' || output[i] === '}' || output[i] === ']') {
                    level += 1;
                }
            }
        },
        funcfix = function (y) {
            var a = (y.indexOf("}") - 1),
                b = "",
                c;
            if (y.charAt(0) === "\n") {
                b = "\n";
                c = y.substr(1, a);
            } else {
                c = y.substr(0, a);
            }
            return b + c + "}\n" + c + "(function";
        },
        get_next_token = function () {
            var c,
                i,
                sign,
                t,
                comment,
                inline_comment,
                keep_whitespace,
                sep,
                esc,
                resulting_string,
                in_char_class,
                sharp,
                whitespace_count = 0;
            n_newlines = 0;
            if (parser_pos >= input_length) {
                return ['', 'TK_EOF'];
            }
            wanted_newline = false;
            c = input.charAt(parser_pos);
            parser_pos += 1;
            keep_whitespace = opt_keep_array_indentation && is_array(flags.mode);
            if (keep_whitespace) {
                //
                // slight mess to allow nice preservation of array
                // indentation and reindent that correctly first time
                // when we get to the arrays:
                // var a = [
                // ....'something'
                // we make note of whitespace_count = 4 into
                // flags.indentation_baseline so we know that 4
                // whitespaces in original source match indent_level of
                // reindented source and afterwards, when we get to
                //
                // 'something,
                // .......'something else'
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
                        if (c === '\t') {
                            whitespace_count += 4;
                        } else if (c !== '\r') {
                            whitespace_count += 1;
                        }
                    }
                    if (parser_pos >= input_length) {
                        return ['', 'TK_EOF'];
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
                            output.push(' ');
                        }
                    }
                }
            } else {
                while (c === "\n" || c === "\r" || c === "\t" || c === " ") {
                    if (c === "\n") {
                        n_newlines += ((opt_max_preserve_newlines) ? (n_newlines <= opt_max_preserve_newlines) ? 1 : 0 : 1);
                    }
                    if (parser_pos >= input_length) {
                        return ['', 'TK_EOF'];
                    }
                    c = input.charAt(parser_pos);
                    parser_pos += 1;
                }
                if (opt_preserve_newlines) {
                    if (n_newlines > 1) {
                        for (i = 0; i < n_newlines; i += 1) {
                            print_newline(i === 0);
                            just_added_newline = true;
                        }
                    }
                }
                wanted_newline = n_newlines > 0;
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
                // small and surprisingly unugly hack for 1E-10
                // representation
                if (parser_pos !== input_length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {
                    sign = input.charAt(parser_pos);
                    parser_pos += 1;
                    t = get_next_token(parser_pos);
                    c += sign + t[0];
                    return [c, 'TK_WORD'];
                }
                // hack for 'in' operator
                if (c === 'in') {
                    return [c, 'TK_OPERATOR'];
                }
                if (wanted_newline && last_type !== 'TK_OPERATOR' && !flags.if_line && (opt_preserve_newlines || last_text !== 'var')) {
                    print_newline();
                }
                return [c, 'TK_WORD'];
            }
            if (c === '(' || c === '[') {
                return [c, 'TK_START_EXPR'];
            }
            if (c === ')' || c === ']') {
                return [c, 'TK_END_EXPR'];
            }
            if (c === '{') {
                return [c, 'TK_START_BLOCK'];
            }
            if (c === '}') {
                return [c, 'TK_END_BLOCK'];
            }
            if (c === ';') {
                return [c, 'TK_SEMICOLON'];
            }
            if (c === '/') {
                comment = '';
                // peek for comment /* ... */
                inline_comment = true;
                if (input.charAt(parser_pos) === '*') {
                    parser_pos += 1;
                    if (parser_pos < input_length) {
                        while (!(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/') && parser_pos < input_length) {
                            c = input.charAt(parser_pos);
                            comment += c;
                            if (c === '\x0d' || c === '\x0a') {
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
                        return ['/*' + comment + '*/', 'TK_INLINE_COMMENT'];
                    } else {
                        return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
                    }
                }
                // peek for comment // ...
                if (input.charAt(parser_pos) === '/') {
                    comment = c;
                    while (input.charAt(parser_pos) !== '\r' && input.charAt(parser_pos) !== '\n') {
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
                    return [comment, 'TK_COMMENT'];
                }
            }
            if (c === "'" || c === '"' || (c === '/' && ((last_type === 'TK_WORD' && (last_text === 'return' || last_text === 'do')) || (last_type === 'TK_COMMENT' || last_type === 'TK_START_EXPR' || last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_OPERATOR' || last_type === 'TK_EQUALS' || last_type === 'TK_EOF' || last_type === 'TK_SEMICOLON')))) { // regexp
                sep = c;
                esc = false;
                resulting_string = c;
                if (parser_pos < input_length) {
                    if (sep === '/') {
                        //
                        // handle regexp separately...
                        //
                        in_char_class = false;
                        while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (!esc) {
                                esc = input.charAt(parser_pos) === '\\';
                                if (input.charAt(parser_pos) === '[') {
                                    in_char_class = true;
                                } else if (input.charAt(parser_pos) === ']') {
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
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    } else {
                        //
                        // and handle string also separately
                        //
                        while (esc || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (!esc) {
                                esc = input.charAt(parser_pos) === '\\';
                            } else {
                                esc = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when
                                // end-of-file reached. bail out with
                                // what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    }
                }
                parser_pos += 1;
                resulting_string += sep;
                if (sep === '/') {
                    // regexps may have modifiers /regexp/MOD , so fetch
                    // those, too
                    while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
                        resulting_string += input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }
            // Spidermonkey-specific sharp variables for circular
            // references
            // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
            // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp
            // around line 1935
            if (c === '#') {
                sharp = '#';
                if (parser_pos < input_length && in_array(input.charAt(parser_pos), digits)) {
                    do {
                        c = input.charAt(parser_pos);
                        sharp += c;
                        parser_pos += 1;
                    } while (parser_pos < input_length && c !== '#' && c !== '=');
                    if (c !== "#" && input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
                        sharp += '[]';
                        parser_pos += 2;
                    } else if (c !== "#" && input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
                        sharp += '{}';
                        parser_pos += 2;
                    }
                    return [sharp, 'TK_WORD'];
                }
            }
            if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
                parser_pos += 3;
                flags.in_html_comment = true;
                return ['<!--', 'TK_COMMENT'];
            }
            if (c === '-' && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
                flags.in_html_comment = false;
                parser_pos += 2;
                if (wanted_newline) {
                    print_newline();
                }
                return ['-->', 'TK_COMMENT'];
            }
            if (in_array(c, punct)) {
                while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input_length) {
                        break;
                    }
                }
                if (c === '=') {
                    return [c, 'TK_EQUALS'];
                } else {
                    return [c, 'TK_OPERATOR'];
                }
            }
            return [c, 'TK_UNKNOWN'];
        };
    while (opt_indent_size > 0) {
        indent_string += opt_indent_char;
        opt_indent_size -= 1;
    }
    set_mode('BLOCK');
    parser_pos = 0;
    while (true) {
        t = get_next_token(parser_pos);
        token_text = t[0];
        token_type = t[1];
        if (token_type === 'TK_EOF') {
            break;
        } else if (token_type === 'TK_START_EXPR') {
            n[4] += 1;
            if (token_text === '[') {
                if (last_type === 'TK_WORD' || last_text === ')') {
                    // this is array index specifier, break immediately
                    // a[x], fn()[x]
                    if (last_text === 'continue' || last_text === 'try' || last_text === 'throw' || last_text === 'return' || last_text === 'var' || last_text === 'if' || last_text === 'switch' || last_text === 'case' || last_text === 'default' || last_text === 'for' || last_text === 'while' || last_text === 'break' || last_text === 'function') {
                        print_single_space();
                    }
                    set_mode('(EXPRESSION)');
                    print_token();
                } else if (flags.mode === '[EXPRESSION]' || flags.mode === '[INDENTED-EXPRESSION]') {
                    if (last_last_text === ']' && last_text === ',') {
                        // ], [ goes to new line
                        if (flags.mode === '[EXPRESSION]') {
                            flags.mode = '[INDENTED-EXPRESSION]';
                            if (!opt_keep_array_indentation) {
                                flags.indentation_level += 1;
                            }
                        }
                        set_mode('[EXPRESSION]');
                        if (!opt_keep_array_indentation) {
                            print_newline();
                        }
                    } else if (last_text === '[') {
                        if (flags.mode === '[EXPRESSION]') {
                            flags.mode = '[INDENTED-EXPRESSION]';
                            if (!opt_keep_array_indentation) {
                                flags.indentation_level += 1;
                            }
                        }
                        set_mode('[EXPRESSION]');
                        if (!opt_keep_array_indentation) {
                            print_newline();
                        }
                    } else {
                        set_mode('[EXPRESSION]');
                    }
                } else {
                    set_mode('[EXPRESSION]');
                }
            } else {
                set_mode('(EXPRESSION)');
            }
            if (token_text !== '[' || (token_text === '[' && (last_type !== 'TK_WORD' && last_text !== ')'))) {
                if (last_text === ';' || last_type === 'TK_START_BLOCK') {
                    print_newline();
                } else if (last_type !== 'TK_END_EXPR' && last_type !== 'TK_START_EXPR' && last_type !== 'TK_END_BLOCK' && last_text !== '.') {
                    if ((last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') || (last_word === 'function' && opt_space_after_anon_function)) {
                        print_single_space();
                    } else if (last_text === 'continue' || last_text === 'try' || last_text === 'throw' || last_text === 'return' || last_text === 'var' || last_text === 'if' || last_text === 'switch' || last_text === 'case' || last_text === 'default' || last_text === 'for' || last_text === 'while' || last_text === 'break' || last_text === 'function' || last_text === 'catch') {
                        print_single_space();
                    }
                }
                print_token();
            }
        } else if (token_type === 'TK_END_EXPR') {
            n[4] += 1;
            if (token_text === ']' && opt_keep_array_indentation && last_text === '}') {
                if (output.length && output[output.length - 1] === indent_string) {
                    output.pop();
                }
                print_token();
                restore_mode();
            } else if (token_text === ']' && flags.mode === '[INDENTED-EXPRESSION]' && last_text === ']') {
                restore_mode();
                print_newline();
                print_token();
            } else {
                restore_mode();
                print_token();
            }
        } else if (token_type === 'TK_START_BLOCK') {
            n[4] += 1;
            if (functest === true) {
                functestval += 1;
            }
            if (last_word === 'do') {
                set_mode('DO_BLOCK');
            } else {
                set_mode('BLOCK');
            }
            if (opt_braces_on_own_line) {
                if (last_type !== 'TK_OPERATOR') {
                    if (last_text === 'return') {
                        print_single_space();
                    } else {
                        print_newline();
                    }
                }
            } else {
                if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                    if (last_type === 'TK_START_BLOCK') {
                        print_newline();
                    } else {
                        print_single_space();
                    }
                } else {
                    // if TK_OPERATOR or TK_START_EXPR
                    if (is_array(flags.previous_mode) && last_text === ',') {
                        // [a, b, c, {
                        print_newline();
                    }
                }
            }
            flags.indentation_level += 1;
            print_token();
        } else if (token_type === 'TK_END_BLOCK') {
            n[4] += 1;
            restore_mode();
            if (opt_braces_on_own_line) {
                print_newline();
                print_token();
            } else {
                if (last_type === 'TK_START_BLOCK') {
                    // nothing
                    if (just_added_newline) {
                        if (output.length && output[output.length - 1] === indent_string) {
                            output.pop();
                        }
                    } else {
                        // {}
                        trim_output();
                    }
                } else if (is_array(flags.mode) && opt_keep_array_indentation) {
                    // we REALLY need a newline here, but newliner
                    // would skip that
                    opt_keep_array_indentation = false;
                    print_newline();
                    opt_keep_array_indentation = true;
                } else {
                    print_newline();
                }
                print_token();

                if (functest === true) {
                    functestval -= 1;
                    if (functestval === 0) {
                        flags.indentation_level -= 1;
                        functest = false;
                    }
                }

            }
        } else if (token_type === 'TK_WORD') {
            // no, it's not you. even I have problems understanding how
            // this works and what does what.
            if (token_text === 'alert') {
                m[0] += 1;
            } else if (token_text === 'break') {
                m[2] += 1;
            } else if (token_text === 'case') {
                m[4] += 1;
            } else if (token_text === 'catch') {
                m[48] += 1;
            } else if (token_text === 'continue') {
                m[6] += 1;
            } else if (token_text === 'default') {
                m[8] += 1;
            } else if (token_text === 'delete') {
                m[10] += 1;
            } else if (token_text === 'do') {
                m[12] += 1;
            } else if (token_text === 'document') {
                m[44] += 1;
            } else if (token_text === 'else') {
                m[14] += 1;
            } else if (token_text === 'eval') {
                m[16] += 1;
            } else if (token_text === 'for') {
                m[18] += 1;
            } else if (token_text === 'function') {
                m[20] += 1;
            } else if (token_text === 'if') {
                m[22] += 1;
            } else if (token_text === 'in') {
                m[24] += 1;
            } else if (token_text === 'label') {
                m[26] += 1;
            } else if (token_text === 'new') {
                m[28] += 1;
            } else if (token_text === 'return') {
                m[30] += 1;
            } else if (token_text === 'switch') {
                m[32] += 1;
            } else if (token_text === 'this') {
                m[34] += 1;
            } else if (token_text === 'throw') {
                m[50] += 1;
            } else if (token_text === 'try') {
                m[52] += 1;
            } else if (token_text === 'typeof') {
                m[36] += 1;
            } else if (token_text === 'var') {
                m[38] += 1;
            } else if (token_text === 'while') {
                m[40] += 1;
            } else if (token_text === 'with') {
                m[42] += 1;
            } else if (token_text === 'window') {
                m[46] += 1;
            } else {
                o[0] += 1;
                o[1] += token_text.length;
            }
            if (do_block_just_closed) {
                // do {} ## while ()
                print_single_space();
                print_token();
                print_single_space();
                do_block_just_closed = false;
            } else {
                if (token_text === 'case' || token_text === 'default') {
                    if (last_text === ':') {
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

                    if (token_text === 'function') {
                        // These next two conditions are necessary to
                        // provide extra indentation for the contents of
                        // functions assigned to a variable that are in
                        // turn a variable in a higher function.
                        if (flags.var_line) {
                            vartainted = true;
                        }
                        if (vartested === true) {
                            vartested = 'function';
                        }

                        if (last_text === ':') {
                            flags.indentation_level += 1;
                            functest = true;
                        }
                        if ((just_added_newline || last_text === ';') && last_text !== '{') {
                            // make sure there is a nice clean space of
                            // at least one blank line before a new
                            // function definition
                            n_newlines = just_added_newline ? n_newlines : 0;
                            if (!opt_preserve_newlines) {
                                n_newlines = 1;
                            }
                            for (i = 0; i < 2 - n_newlines; i += 1) {
                                print_newline(false);
                            }
                        }
                    }
                    prefix = 'NONE';
                    if (last_type === 'TK_END_BLOCK') {
                        if (opt_braces_on_own_line || (token_text !== 'else' && token_text !== 'catch' && token_text !== 'finally')) {
                            prefix = 'NEWLINE';
                        } else {
                            prefix = 'SPACE';
                            print_single_space();
                        }
                    } else if (last_type === 'TK_STRING' || last_type === 'TK_START_BLOCK' || (last_type === 'TK_SEMICOLON' && (flags.mode === 'BLOCK' || flags.mode === 'DO_BLOCK'))) {
                        prefix = 'NEWLINE';
                    } else if (last_type === 'TK_WORD' || (last_type === 'TK_SEMICOLON' && is_expression(flags.mode))) {
                        prefix = 'SPACE';
                    } else if (last_type === 'TK_END_EXPR') {
                        print_single_space();
                        prefix = 'NEWLINE';
                    }
                    if (flags.if_line && last_type === 'TK_END_EXPR') {
                        flags.if_line = false;
                    }
                    if (token_text === 'else' || token_text === 'catch' || token_text === 'finally') {
                        if (last_type !== 'TK_END_BLOCK' || opt_braces_on_own_line) {
                            print_newline();
                        } else {
                            trim_output(true);
                            print_single_space();
                        }
                    } else if (last_type !== 'TK_START_EXPR' && last_text !== '=' && last_text !== ',' && (token_text === 'continue' || token_text === 'try' || token_text === 'throw' || token_text === 'return' || token_text === 'var' || token_text === 'if' || token_text === 'switch' || token_text === 'case' || token_text === 'default' || token_text === 'for' || token_text === 'while' || token_text === 'break' || token_text === 'function' || prefix === 'NEWLINE')) {
                        if (last_text === 'return' || last_text === 'throw' || (last_type !== 'TK_END_EXPR' && last_text !== ':' && (last_type !== 'TK_START_EXPR' || token_text !== 'var'))) {
                            // no need to force newline on
                            // 'var': for (var x = 0...)
                            // no newline for } else if {
                            if (token_text === 'if' && last_word === 'else' && last_text !== '{') {
                                print_single_space();
                            } else {
                                print_newline();
                            }
                        } else if (last_text !== ')' && (token_text === 'continue' || token_text === 'try' || token_text === 'throw' || token_text === 'return' || token_text === 'var' || token_text === 'if' || token_text === 'switch' || token_text === 'case' || token_text === 'default' || token_text === 'for' || token_text === 'while' || token_text === 'break' || token_text === 'function')) {
                            print_newline();
                        }
                    } else if (prefix === 'SPACE') {
                        print_single_space();
                    } else if (last_text === ';' || (is_array(flags.mode) && last_text === ',' && last_last_text === '}')) {
                        // }, in lists get a newline treatment
                        print_newline();
                    }
                    print_token();
                    if (token_text === 'typeof') {
                        print_single_space();
                    }
                    last_word = token_text;
                    if (token_text === 'var') {
                        flags.var_line = true;
                        flags.var_line_reindented = false;
                        if (vartainted) {
                            vartested = true;
                        }
                    }
                    if (token_text === 'if') {
                        flags.if_line = true;
                    }
                    if (token_text === 'else') {
                        flags.if_line = false;
                    }
                }
            }
        } else if (token_type === 'TK_SEMICOLON') {
            n[3] += 1;
            print_token();
            flags.var_line = false;
            flags.var_line_reindented = false;
        } else if (token_type === 'TK_STRING') {
            l[0] += 1;
            if ((token_text.charAt(0) === "\"" && token_text.charAt(token_text.length - 1) === "\"") || (token_text.charAt(0) === "'" && token_text.charAt(token_text.length - 1) === "'")) {
                l[1] += token_text.length - 2;
                l[2] += 2;
            } else {
                l[1] += token_text.length;
            }
            white_count(token_text);
            if (last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_SEMICOLON') {
                print_newline();
            } else if (last_type === 'TK_WORD') {
                print_single_space();
            }
            print_token();
        } else if (token_type === 'TK_EQUALS') {
            n[0] += 1;
            n[1] += 1;
            print_single_space();
            print_token();
            print_single_space();
        } else if (token_type === 'TK_OPERATOR') {
            if (token_text !== ',') {
                n[0] += 1;
                n[1] += token_text.length;
            }
            if (token_text === ',') {
                n[2] += 1;
                if (flags.var_line) {
                    if (last_text !== "}") {
                        flags.var_line_reindented = true;
                    } else {
                        vartested = false;
                    }
                    print_token();
                    print_newline();
                } else if (last_type === 'TK_END_BLOCK' && flags.mode !== "(EXPRESSION)") {
                    print_token();
                    if (flags.mode === 'OBJECT' && last_text === '}') {
                        print_newline();
                    } else {
                        print_single_space();
                    }
                } else if (flags.mode === 'BLOCK' || flags.mode === 'OBJECT' || is_ternary_op()) {
                    print_token();
                    print_newline();
                } else {
                    // EXPR or DO_BLOCK
                    print_token();
                    print_single_space();
                }
                // } else if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS']) || in_array(last_text, line_starters) || in_array(last_text, ['==', '!=', '+=', '-=', '*=', '/=', '+', '-'])))) {
            } else if (last_text === 'return' || last_text === 'throw') {
                // "return" had a special handling in TK_WORD. Now we
                // need to return the favor
                print_single_space();
                print_token();
            } else if (token_text === ':' && flags.in_case) {
                // colon really asks for separate treatment
                print_token();
                print_newline();
                flags.in_case = false;
            } else if (token_text === '::') {
                // no spaces around exotic namespacing syntax operator
                print_token();
            } else if (token_text === '--' || token_text === '++' || token_text === '!' || ((token_text === '-' || token_text === '+') && (last_type === 'TK_START_BLOCK' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR' || last_text === 'continue' || last_text === 'try' || last_text === 'throw' || last_text === 'return' || last_text === 'var' || last_text === 'if' || last_text === 'switch' || last_text === 'case' || last_text === 'default' || last_text === 'for' || last_text === 'while' || last_text === 'break' || last_text === 'function'))) {
                // unary operators (and binary +/- pretending to be
                // unary) special cases
                space_before = false;
                space_after = false;
                if (last_text === ';' && is_expression(flags.mode)) {
                    // for (;; ++i)
                    // ^^^
                    space_before = true;
                }
                if (last_type === 'TK_WORD' && (last_text === 'continue' || last_text === 'try' || last_text === 'throw' || last_text === 'return' || last_text === 'var' || last_text === 'if' || last_text === 'switch' || last_text === 'case' || last_text === 'default' || last_text === 'for' || last_text === 'while' || last_text === 'break' || last_text === 'function')) {
                    space_before = true;
                }
                if (flags.mode === 'BLOCK' && (last_text === '{' || last_text === ';')) {
                    // { foo; --i }
                    // foo(); --bar;
                    print_newline();
                }
            } else if (token_text === '.') {
                // decimal digits or object.property
                space_before = false;
            } else if (token_text === ':' && is_ternary_op()) {
                flags.mode = 'OBJECT';
                space_before = false;
            }
            if (token_text !== ',' && token_text !== ":" && (token_text !== '-' || (token_text === '-' && last_text !== 'continue' && last_text !== 'try' && last_text !== 'throw' && last_text !== 'return' && last_text !== 'var' && last_text !== 'if' && last_text !== 'switch' && last_text !== 'case' && last_text !== 'default' && last_text !== 'for' && last_text !== 'while' && last_text !== 'break' && last_text !== 'function'))) {
                if (space_before) {
                    print_single_space();
                }
                print_token();
                if (space_after) {
                    print_single_space();
                }
            } else if (token_text === ":") {
                if (is_ternary_op()) {
                    print_single_space();
                    print_token();
                    print_single_space();
                    flags.mode = 'OBJECT';
                } else if (flags.in_case) {
                    print_single_space();
                    print_token();
                    print_single_space();
                } else if (last_last_text !== 'case' && last_last_text !== 'default' && last_text !== 'case' && last_text !== 'default') {
                    print_token();
                    print_single_space();
                }
            }
            space_before = true;
            space_after = true;
            //if (token_text === '!') {
            // flags.eat_next_space = true;
            //}
        } else if (token_type === 'TK_BLOCK_COMMENT') {
            j[0] += 1;
            j[1] += token_text.length;
            white_count(token_text);
            if (indent_comm === "noindent") {
                for (i = output.length - 1; i > 0; i -= 1) {
                    if (output[i] === indent_string || output[i] === " ") {
                        output[i] = "";
                    } else {
                        break;
                    }
                }
                print_token();
                print_newline();
            } else {
                lines = token_text.split(/\x0a|\x0d\x0a/);
                if (/^\/\*\*/.test(token_text)) {
                    // javadoc: reformat and reindent
                    print_newline();
                    output.push(lines[0]);
                    for (i = 1; i < lines.length; i += 1) {
                        print_newline();
                        output.push(' ');
                        output.push(trim(lines[i]));
                    }
                } else {
                    // simple block comment: leave intact
                    if (lines.length > 1) {
                        // multiline comment block starts with a new
                        // line
                        print_newline();
                        trim_output();
                    } else {
                        // single-line /* comment */ stays where it is
                        print_single_space();
                    }
                    for (i = 0; i < lines.length; i += 1) {
                        output.push(lines[i]);
                        output.push('\n');
                    }
                }
                print_newline();
            }
        } else if (token_type === 'TK_INLINE_COMMENT') {
            j[0] += 1;
            j[1] += token_text.length;
            white_count(token_text);
            if (indent_comm !== "noindent") {
                print_single_space();
            } else {
                output.push("\n");
            }
            print_token();
            if (is_expression(flags.mode)) {
                print_single_space();
            } else if (indent_comm === "noindent") {
                output.push("\n");
            } else {
                print_newline();
            }
        } else if (token_type === 'TK_COMMENT') {
            k[0] += 1;
            k[1] += token_text.length;
            white_count(token_text);
            if (indent_comm === "noindent") {
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
        } else if (token_type === 'TK_UNKNOWN') {
            n[0] += 1;
            n[1] += token_text.length;
            white_count(token_text);
            if (last_text === 'return' || last_text === 'throw') {
                print_single_space();
            }
            print_token();
        }
        last_last_text = last_text;
        last_type = token_type;
        last_text = token_text;
    }
    rvalue = output.join('').replace(/^(\s+)/, '').replace(/(\s+)$/, '').replace(/\s*\}\(function/g, funcfix);
    js_summary = function () {
        var a,
            b,
            e = 1,
            f = 1,
            g = 0,
            h = 0,
            i,
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
            };
        if (rvalue.length <= input_length) {
            b = input_length;
        } else {
            b = rvalue.length;
        }
        for (a = 0; a < b; a += 1) {
            if (js_source_text.charAt(a) === ' ') {
                g += 1;
            } else if (js_source_text.charAt(a) === '\t') {
                h += 1;
            } else if (js_source_text.charAt(a) === '\n') {
                e += 1;
            } else if (js_source_text.charAt(a) === '\r' || js_source_text.charAt(a) === '\f' || js_source_text.charAt(a) === '\v') {
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
        output.push("<table class='analysis' summary='JavaScript character size comparison'><caption>JavaScript data report</caption><thead><tr><th>Data Label</th><th>Input</th><th>Output</th><th>Literal Increase</th><th>Percentage Increase</th></tr></thead><tbody><tr><th>Total Character Size</th><td>" + input_length + "</td><td>" + rvalue.length + "</td><td>" + (rvalue.length - input_length) + "</td><td>" + (((rvalue.length - input_length) / rvalue.length) * 100).toFixed(2) + "%</td></tr><tr><th>Total Lines of Code</th><td>" + e + "</td><td>" + f + "</td><td>" + (f - e) + "</td><td>" + (((f - e) / e) * 100).toFixed(2) + "%</td></tr></tbody></table>");
        output.push("<table class='analysis' summary='JavaScript component analysis'><caption>JavaScript component analysis</caption><thead><tr><th>JavaScript Component</th><th>Component Quantity</th><th>Percentage Quantity from Section</th><th>Percentage Qauntity from Total</th><th>Character Length</th><th>Percentage Length from Section</th><th>Percentage Length from Total</th></tr></thead><tbody>");
        output.push("<tr><th>Total Accounted</th><td>" + z[0] + "</td><td>100.00%</td><td>100.00%</td><td>" + z[1] + "</td><td>100.00%</td><td>100.00%</td></tr>");
        output.push("<tr><th colspan='7'>Comments</th></tr>");
        output.push("<tr><th>Block Comments</th><td>" + j[0] + "</td><td>" + zero(j[0], j[2]) + "</td><td>" + zero(j[0], z[0]) + "</td><td>" + j[1] + "</td><td>" + zero(j[1], j[3]) + "</td><td>" + zero(j[1], z[1]) + "</td></tr>");
        output.push("<tr><th>Inline Comments</th><td>" + k[0] + "</td><td>" + zero(k[0], j[2]) + "</td><td>" + zero(k[0], z[0]) + "</td><td>" + k[1] + "</td><td>" + zero(k[1], j[3]) + "</td><td>" + zero(k[1], z[1]) + "</td></tr>");
        output.push("<tr><th>Comment Total</th><td>" + j[2] + "</td><td>100.00%</td><td>" + zero(j[2], z[0]) + "</td><td>" + j[3] + "</td><td>100.00%</td><td>" + zero(j[3], z[1]) + "</td></tr>");
        output.push("<tr><th colspan='7'>Whitespace Outside of Strings and Comments</th></tr>");
        output.push("<tr><th>New Lines</th><td>" + (e - 1 - w[0]) + "</td><td>" + zero(e - 1 - w[0], i) + "</td><td>" + zero(e - 1 - w[0], z[0]) + "</td><td>" + (e - 1 - w[0]) + "</td><td>" + zero(e - 1 - w[0], i) + "</td><td>" + zero(e - 1 - w[0], z[1]) + "</td></tr>");
        output.push("<tr><th>Spaces</th><td>" + g + "</td><td>" + zero(g, i) + "</td><td>" + zero(g, z[0]) + "</td><td>" + g + "</td><td>" + zero(g, i) + "</td><td>" + zero(g, z[1]) + "</td></tr>");
        output.push("<tr><th>Tabs</th><td>" + h + "</td><td>" + zero(h, i) + "</td><td>" + zero(h, z[0]) + "</td><td>" + h + "</td><td>" + zero(h, i) + "</td><td>" + zero(h, z[1]) + "</td></tr>");
        output.push("<tr><th>Other Whitespace</th><td>" + p + "</td><td>" + zero(p, i) + "</td><td>" + zero(p, z[0]) + "</td><td>" + p + "</td><td>" + zero(p, i) + "</td><td>" + zero(p, z[1]) + "</td></tr>");
        output.push("<tr><th>Total Whitespace</th><td>" + i + "</td><td>100.00%</td><td>" + zero(i, z[0]) + "</td><td>" + i + "</td><td>100.00%</td><td>" + zero(i, z[1]) + "</td></tr>");
        output.push("<tr><th colspan='7'>Strings</th></tr>");
        output.push("<tr><th>Strings</th><td>" + l[0] + "</td><td>100.00%</td><td>" + zero(l[0], z[0]) + "</td><td>" + l[1] + "</td><td>100.00%</td><td>" + zero(l[1], z[1]) + "</td></tr>");
        output.push("<tr><th colspan='7'>Syntax Characters</th></tr>");
        output.push("<tr><th>Quote Characters</th><td>" + l[2] + "</td><td>" + zero(l[2], n[5]) + "</td><td>" + zero(l[2], z[0]) + "</td><td>" + l[2] + "</td><td>" + zero(l[2], n[6]) + "</td><td>" + zero(l[2], z[1]) + "</td></tr>");
        output.push("<tr><th>Commas</th><td>" + n[2] + "</td><td>" + zero(n[2], n[5]) + "</td><td>" + zero(n[2], z[0]) + "</td><td>" + n[2] + "</td><td>" + zero(n[2], n[6]) + "</td><td>" + zero(n[2], z[1]) + "</td></tr>");
        output.push("<tr><th>Containment Characters</th><td>" + n[4] + "</td><td>" + zero(n[4], n[5]) + "</td><td>" + zero(n[4], z[0]) + "</td><td>" + n[4] + "</td><td>" + zero(n[4], n[6]) + "</td><td>" + zero(n[4], z[1]) + "</td></tr>");
        output.push("<tr><th>Semicolons</th><td>" + n[3] + "</td><td>" + zero(n[3], n[5]) + "</td><td>" + zero(n[3], z[0]) + "</td><td>" + n[3] + "</td><td>" + zero(n[3], n[6]) + "</td><td>" + zero(n[3], z[1]) + "</td></tr>");
        output.push("<tr><th>Operators</th><td>" + n[0] + "</td><td>" + zero(n[0], n[5]) + "</td><td>" + zero(n[0], z[0]) + "</td><td>" + n[1] + "</td><td>" + zero(n[1], n[6]) + "</td><td>" + zero(n[1], z[1]) + "</td></tr>");
        output.push("<tr><th>Total Syntax Characters</th><td>" + n[5] + "</td><td>100.00%</td><td>" + zero(n[5], z[0]) + "</td><td>" + n[6] + "</td><td>100.00%</td><td>" + zero(n[6], z[1]) + "</td></tr>");
        output.push("<tr><th colspan='7'>Keywords</th></tr>");
        output.push("<tr><th>Keyword 'alert'</th><td" + q[0] + ">" + m[0] + "</td><td>" + zero(m[0], m[54]) + "</td><td>" + zero(m[0], z[0]) + "</td><td>" + m[1] + "</td><td>" + zero(m[1], m[55]) + "</td><td>" + zero(m[1], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'break'</th><td>" + m[2] + "</td><td>" + zero(m[2], m[54]) + "</td><td>" + zero(m[2], z[0]) + "</td><td>" + m[3] + "</td><td>" + zero(m[3], m[55]) + "</td><td>" + zero(m[3], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'case'</th><td>" + m[4] + "</td><td>" + zero(m[4], m[54]) + "</td><td>" + zero(m[4], z[0]) + "</td><td>" + m[5] + "</td><td>" + zero(m[5], m[55]) + "</td><td>" + zero(m[5], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'catch'</th><td>" + m[48] + "</td><td>" + zero(m[48], m[54]) + "</td><td>" + zero(m[48], z[0]) + "</td><td>" + m[49] + "</td><td>" + zero(m[49], m[55]) + "</td><td>" + zero(m[49], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'continue'</th><td" + q[1] + ">" + m[6] + "</td><td>" + zero(m[6], m[54]) + "</td><td>" + zero(m[6], z[0]) + "</td><td>" + m[7] + "</td><td>" + zero(m[7], m[55]) + "</td><td>" + zero(m[7], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'default'</th><td>" + m[8] + "</td><td>" + zero(m[8], m[54]) + "</td><td>" + zero(m[8], z[0]) + "</td><td>" + m[9] + "</td><td>" + zero(m[9], m[55]) + "</td><td>" + zero(m[9], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'delete'</th><td>" + m[10] + "</td><td>" + zero(m[10], m[54]) + "</td><td>" + zero(m[10], z[0]) + "</td><td>" + m[11] + "</td><td>" + zero(m[11], m[55]) + "</td><td>" + zero(m[11], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'do'</th><td>" + m[12] + "</td><td>" + zero(m[12], m[54]) + "</td><td>" + zero(m[12], z[0]) + "</td><td>" + m[13] + "</td><td>" + zero(m[13], m[55]) + "</td><td>" + zero(m[13], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'document'</th><td>" + m[44] + "</td><td>" + zero(m[44], m[54]) + "</td><td>" + zero(m[44], z[0]) + "</td><td>" + m[45] + "</td><td>" + zero(m[45], m[55]) + "</td><td>" + zero(m[45], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'else'</th><td>" + m[14] + "</td><td>" + zero(m[14], m[54]) + "</td><td>" + zero(m[14], z[0]) + "</td><td>" + m[15] + "</td><td>" + zero(m[15], m[55]) + "</td><td>" + zero(m[15], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'eval'</th><td" + q[2] + ">" + m[16] + "</td><td>" + zero(m[16], m[54]) + "</td><td>" + zero(m[16], z[0]) + "</td><td>" + m[17] + "</td><td>" + zero(m[17], m[55]) + "</td><td>" + zero(m[17], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'for'</th><td>" + m[18] + "</td><td>" + zero(m[18], m[54]) + "</td><td>" + zero(m[18], z[0]) + "</td><td>" + m[19] + "</td><td>" + zero(m[19], m[55]) + "</td><td>" + zero(m[19], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'function'</th><td>" + m[20] + "</td><td>" + zero(m[20], m[54]) + "</td><td>" + zero(m[20], z[0]) + "</td><td>" + m[21] + "</td><td>" + zero(m[21], m[55]) + "</td><td>" + zero(m[21], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'if'</th><td>" + m[22] + "</td><td>" + zero(m[22], m[54]) + "</td><td>" + zero(m[22], z[0]) + "</td><td>" + m[23] + "</td><td>" + zero(m[23], m[55]) + "</td><td>" + zero(m[23], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'in'</th><td>" + m[24] + "</td><td>" + zero(m[24], m[54]) + "</td><td>" + zero(m[24], z[0]) + "</td><td>" + m[25] + "</td><td>" + zero(m[25], m[55]) + "</td><td>" + zero(m[25], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'label'</th><td>" + m[26] + "</td><td>" + zero(m[26], m[54]) + "</td><td>" + zero(m[26], z[0]) + "</td><td>" + m[27] + "</td><td>" + zero(m[27], m[55]) + "</td><td>" + zero(m[27], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'new'</th><td>" + m[28] + "</td><td>" + zero(m[28], m[54]) + "</td><td>" + zero(m[28], z[0]) + "</td><td>" + m[29] + "</td><td>" + zero(m[29], m[55]) + "</td><td>" + zero(m[29], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'return'</th><td>" + m[30] + "</td><td>" + zero(m[30], m[54]) + "</td><td>" + zero(m[30], z[0]) + "</td><td>" + m[31] + "</td><td>" + zero(m[31], m[55]) + "</td><td>" + zero(m[31], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'switch'</th><td>" + m[32] + "</td><td>" + zero(m[32], m[54]) + "</td><td>" + zero(m[32], z[0]) + "</td><td>" + m[33] + "</td><td>" + zero(m[33], m[55]) + "</td><td>" + zero(m[33], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'this'</th><td>" + m[34] + "</td><td>" + zero(m[34], m[54]) + "</td><td>" + zero(m[34], z[0]) + "</td><td>" + m[35] + "</td><td>" + zero(m[35], m[55]) + "</td><td>" + zero(m[35], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'throw'</th><td>" + m[50] + "</td><td>" + zero(m[50], m[54]) + "</td><td>" + zero(m[50], z[0]) + "</td><td>" + m[51] + "</td><td>" + zero(m[51], m[55]) + "</td><td>" + zero(m[51], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'typeof'</th><td>" + m[36] + "</td><td>" + zero(m[36], m[54]) + "</td><td>" + zero(m[36], z[0]) + "</td><td>" + m[37] + "</td><td>" + zero(m[37], m[55]) + "</td><td>" + zero(m[37], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'var'</th><td>" + m[38] + "</td><td>" + zero(m[38], m[54]) + "</td><td>" + zero(m[38], z[0]) + "</td><td>" + m[39] + "</td><td>" + zero(m[39], m[55]) + "</td><td>" + zero(m[39], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'while'</th><td>" + m[40] + "</td><td>" + zero(m[40], m[54]) + "</td><td>" + zero(m[40], z[0]) + "</td><td>" + m[41] + "</td><td>" + zero(m[41], m[55]) + "</td><td>" + zero(m[41], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'with'</th><td" + q[3] + ">" + m[42] + "</td><td>" + zero(m[42], m[54]) + "</td><td>" + zero(m[42], z[0]) + "</td><td>" + m[43] + "</td><td>" + zero(m[43], m[55]) + "</td><td>" + zero(m[43], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'window'</th><td>" + m[46] + "</td><td>" + zero(m[46], m[54]) + "</td><td>" + zero(m[46], z[0]) + "</td><td>" + m[47] + "</td><td>" + zero(m[47], m[55]) + "</td><td>" + zero(m[47], z[1]) + "</td></tr>");
        output.push("<tr><th>Keyword 'try'</th><td>" + m[52] + "</td><td>" + zero(m[52], m[54]) + "</td><td>" + zero(m[52], z[0]) + "</td><td>" + m[53] + "</td><td>" + zero(m[53], m[55]) + "</td><td>" + zero(m[53], z[1]) + "</td></tr>");
        output.push("<tr><th>Total Keywords</th><td>" + m[54] + "</td><td>100.00%</td><td>" + zero(m[55], z[0]) + "</td><td>" + m[55] + "</td><td>100.00%</td><td>" + zero(m[55], z[1]) + "</td></tr>");
        output.push("<tr><th colspan='7'>Variables and Other Keywords</th></tr>");
        output.push("<tr><th>Variable Instances</th><td>" + o[0] + "</td><td>100.00%</td><td>" + zero(o[0], z[0]) + "</td><td>" + o[1] + "</td><td>100.00%</td><td>" + zero(o[1], z[1]) + "</td></tr>");
        output.push("</tbody></table></div>");
        return output.join('');
    };
    return rvalue;
};