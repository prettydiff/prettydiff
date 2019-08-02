declare var ace: any;
declare var options: any;
declare var prettydiff: pd;
declare module NodeJS {
    interface Global {
        sparser: any;
        prettydiff: any
    }
}
type api = "any" | "dom" | "node";
type codes = [string, number, number, number, number];
type languageAuto = [string, string, string];
type lexer = "any" | "markup" | "script" | "style";
type mode = "beautify" | "diff" | "minify" | "parse";
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
interface data {
    begin: number[];
    ender: number[];
    lexer: string[];
    lines: number[];
    stack: string[];
    token: string[];
    types: string[];
}
interface diffJSON extends Array<["+"|"-"|"=", string]|["r", string, string]> {
    [index:number]: ["+"|"-"|"=", string]|["r", string, string];
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
interface diffview {
    (): [string, number, number]
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
interface externalIndex {
    [key: string]: number;
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
        head: string;
        htmlEnd: string;
        intro: string;
        scriptEnd: string;
        scriptStart: string;
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
    setlexer(input:string):string;
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
    total: boolean;
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
    mode: "any" | mode;
    type: "boolean" | "number" | "string";
    values?: {
        [key: string]: string;
    }
}
interface optionDef {
    [key:string]: option;
}
interface optionFunctions {
    definitions?: {};
}
interface perform {
    codeLength: number;
    diff: string;
    end: [number, number];
    index: number;
    source: string;
    start: [number, number];
    store: number[];
    test: boolean;
}
interface pd {
    (meta?): string;
    api: any;
    beautify: any;
    end: number;
    iterator: number;
    meta: meta;
    minify: any;
    options: any,
    saveAs?: Function;
    scopes: scriptScopes;
    sparser: any;
    start: number;
    version: version;
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
    ender: number;
    lexer: string;
    lines: number;
    stack: string;
    token: string;
    types: string;
}
interface scriptScopes extends Array<[string, number]>{
    [index:number]: [string, number];
}
interface simulationItem {
    artifact?: string;
    command: string;
    file?: string;
    qualifier: qualifier;
    test: string;
}
interface version {
    date: string;
    number: string;
    parse: string;
}
interface Window {
    sparser: any;
}