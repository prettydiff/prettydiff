declare var options: any;
declare var ace: any;
declare var prettydiff: any;
declare var window: Window;
declare module NodeJS {
    interface Global {
        parseFramework: any;
        prettydiff: any
    }
}
type api = "any" | "dom" | "node";
type codes = [string, number, number, number, number];
type languageAuto = [string, string, string];
type lexer = "markup" | "script" | "style";
type mode = "analysis" | "beautify" | "diff" | "minify" | "parse";
type qualifier = "begins" | "contains" | "ends" | "file begins" | "file contains" | "file ends" | "file is" | "file not" | "file not contains" | "filesystem contains" | "filesystem not contains" | "is" | "not" | "not contains";
interface commandList {
    [key: string]: {
        description: string;
        example: {
            code: string;
            defined: string;
        }[];
    }
}
interface compareStore extends Array<[number, number]>{
    [index:number]: [number, number];
}
interface diffmeta {
    differences: number;
    lines: number;
}
interface diffStatus {
    diff: boolean;
    source: boolean;
}
interface difftable {
    [key: string]: [number, number];
}
interface dom {
    [key: string]: any;
}
interface domMethods {
    app: {
        [key: string]: any;
    };
    event: {
        [key: string]: any;
    };
}
interface diffview {
    (): [string, number, number]
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
interface language {
    auto(sample:string, defaultLang:string): languageAuto;
    nameproper(input:string): string;
    setlangmode(input:string):string;
}
interface library {
    (): string;
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
interface nodeError extends Error {
    code: string;
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
interface opcodes extends Array<codes> {
    [index: number]: codes;
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
interface optionDef {
    binaryCheck: RegExp;
    definitions: any;
}
interface optionFunctions {
    definitions?: {};

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
interface readDirectory {
    callback: Function;
    exclusions: string[];
    path: string;
    recursive: boolean;
    symbolic: boolean;
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
interface scriptScopes extends Array<[string, number, number]>{
    [index:number]: [string, number, number];
}
interface simulationItem {
    artifact?: string;
    command: string;
    file?: string;
    qualifier: qualifier;
    test: string;
}
interface Window {
    parseFramework: any;
}