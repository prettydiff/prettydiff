
declare var options: any;
interface Window {
    parseFramework: any;
}
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
interface optionFunctions {
    definitions?: {};

}
type api = "any" | "dom" | "node";
type lexer = "markup" | "script" | "style";
type mode = "analysis" | "beautify" | "diff" | "minify" | "parse";
interface optionDef {
    binaryCheck: RegExp;
    definitions: any;
}
interface parseOptions {
    lexer: "string";
    lexerOptions: {
        [key: string]: {
            [key: string]: any;
        }
    };
    outputFormat: "objects" | "arrays";
    source: "string";
}
interface library {
    (): string;
}
interface dom {
    [key: string]: any;
}
declare var ace: any;
type languageAuto = [string, string, string];
interface language {
    auto(sample:string, defaultLang:string): languageAuto;
    nameproper(input:string): string;
    setlangmode(input:string):string;
}
interface domMethods {
    app: {
        [key: string]: any;
    };
    event: {
        [key: string]: any;
    };
}
interface finalFile {
    css: {
        color: {
            canvas: string;
            shadow: string;
            white: string;
        };
        global: string;
        reports: string;
    };
    html: {
        body: string;
        color: string;
        end: string;
        head: string;
        intro: string;
        script: string;
    };
    order: string[];
    script: {
        beautify: string;
        diff: string;
        minimal: string;
    };
}
interface diffview {
    (): [string, number, number]
}
interface option {
    api: api;
    default: boolean | number | string;
    definition: string;
    label: string;
    lexer: lexer;
    mode: mode;
    type: "boolean" | "number" | "string";
    values?: {
        [key: string]: string;
    }
}
interface meta {
    error: string;
    lang: [string, string, string];
    time: string;
    insize: number;
    outsize: number;
    difftotal: number;
    difflines: number;
}
type codes = [string, number, number, number, number];
interface opcodes extends Array<codes> {
    [index: number]: codes;
}
interface difftable {
    [key: string]: [number, number];
}
interface compareStore extends Array<[number, number]>{
    [index:number]: [number, number];
}
interface modifyOps {
    end: string;
    injectFlag: string;
    start: string;
}
interface nodeArgs extends Array<[string, any]>{
    [index: number]: [string, any];
}
interface nodeLists {
    emptyline: boolean;
    heading: string;
    obj: any;
    property: "eachkey" | string;
}
interface commandList {
    [key: string]: {
        description: string;
        example: {
            code: string;
            defined: string;
        }[];
    }
}
declare var window: Window;
declare module NodeJS {
    interface Global {
        parseFramework: any;
        prettydiff: any
    }
}