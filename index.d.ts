declare var options: any;
declare var ace: any;
declare var prettydiff: any;
declare var window: Window;
interface nodeError extends Error {
    code: string;
}
declare module NodeJS {
    interface Global {
        parseFramework: any;
        prettydiff: any
    }
}
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
type api = "any" | "dom" | "node";
type lexer = "markup" | "script" | "style";
type mode = "analysis" | "beautify" | "diff" | "minify" | "parse";
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
interface compareStore extends Array<[number, number]>{
    [index:number]: [number, number];
}
interface scriptScopes extends Array<[string, number]>{
    [index:number]: [string, number];
}
interface difftable {
    [key: string]: [number, number];
}
interface modifyOps {
    end: string;
    injectFlag: string;
    start: string;
}
interface nodeCopyParams {
    callback:Function;
    destination:string;
    exclusions:string[];
    target:string;
}
interface nodeFileProps {
    atime: number;
    mode: number;
    mtime: number;
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
interface readDirectory {
    callback: Function;
    exclusions: string[];
    path: string;
    recursive: boolean;
    symbolic: boolean;
}