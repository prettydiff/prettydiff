///<reference path="node_modules/parse-framework/index.d.ts" />
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
    braces?: boolean;
    bracepadding?: boolean;
    comments?: boolean;
    correct?: boolean;
    crlf?: boolean;
    elseline?: boolean;
    formatArray?: "indent" | "inline" | "none";
    formatObject?: "indent" | "inline" | "none";
    force_attribute?: boolean;
    force_indent?: boolean;
    functionname?: boolean;
    inchar?: string;
    inlevel?: number;
    insize?: number;
    jsscope?: "none" | "html" | "report";
    lang: string;
    methodchain?: "chain" | "none";
    mode?: mode;
    neverflatten?: boolean;
    newline?: boolean;
    nocaseindent?: boolean;
    nochainindent?: boolean;
    parsed?: parsedArray;
    source: string;
    space?: boolean;
    spaceclose?: boolean;
    style?: boolean;
    ternaryline?: boolean;
    textpreserve?: boolean;
    unformatted?: boolean;
    vertical?: boolean;
    wrap?: number;
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
    meta?: {};
    dom?: {};
}
interface Window {
    MyNamespace: any;
    prettydiff: prettydiff;
    parseFramework: parseFramework;
}
declare var window: Window;
declare module NodeJS {
    interface Global {
        parseFramework: parseFramework;
        prettydiff: prettydiff
    }
}