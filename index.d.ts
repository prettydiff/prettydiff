interface record {
    begin: number;
    lexer: string;
    lines: number;
    presv: boolean;
    stack: string;
    token: string;
    types: string;
}
interface parsedArray {
    begin: number[];
    lexer: string[];
    lines: number[];
    presv: boolean[];
    stack: string[];
    token: string[];
    types: string[];
}
interface parsedObject {
    [index: number]: record;
}
type mode = "analyze" | "beautify" | "diff" | "minify" | "parse";
interface options {
    comments: boolean;
    correct: boolean;
    crlf: boolean;
    force_attribute: boolean;
    force_indent: boolean;
    inchar: string;
    inlevel: number;
    insize: number;
    lang: string;
    mode: mode;
    newline: boolean;
    parsed: parsedArray;
    source: string;
    spaceclose: boolean;
    style: boolean;
    textpreserve: boolean;
    unformatted: boolean;
    vertical: boolean;
    wrap: number;
}
interface library {
    (options: options): string;
}
type app = string | parsedArray | parsedObject;
interface prettydiff {
    analyze: {
        [key: string]: library;
    };
    app(options:options): app;
    beautify: {
        [key: string]: library;
    };
    minify: {
        [key: string]: library;
    };
}
declare module NodeJS {
    interface Global {
        parseFramework: object;
        prettydiff: prettydiff
    }
}